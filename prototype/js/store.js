/* ============================================================
 * store.js · 数据层
 * 数据模型与《开发计划书》第 22 节对齐：
 *   projects / pages / requirement_documents / requirement_blocks
 *   prototype_elements / element_requirement_links / change_records
 * 第一阶段以 localStorage 持久化，接口设计与 Supabase 表一一对应，
 * 后续迁移时仅需替换本文件实现。
 * ============================================================ */
(function () {
  'use strict';

  var KEY = window.PRD_MODE ? PRD_MODE.key : 'protoReq.db.v1';
  var OWNER_KEY = 'protoReq.cacheOwner.v1';   /* 本地缓存归属的账号 id：跨账号切换时据此丢弃旧缓存 */

  function blank() {
    return {
      v: 1,
      saved_at: 0,   // 本库最后一次保存时间戳（远程模式合并时判断新旧）
      projects: [],   // {id,name,description,created_by,created_at,updated_at}
      pages: [],      // {id,project_id,name,prototype_content,sort,created_at,updated_at}
      documents: [],  // {id,page_id,created_at,updated_at}  每页一份需求文档
      blocks: [],     // {id,document_id,block_type,content,sort,created_at,updated_at}
      elements: [],   // {id,page_id,proto_element_id,element_name,element_type,fingerprint:{tag,cls,text},created_at}
      links: [],      // {id,page_id,prototype_element_id,requirement_block_id,created_by,created_at}
      changes: [],    // {id,project_id,page_id,block_id,old_content,new_content,created_by,created_at}
      versions: [],   // P1 版本管理：{id,page_id,document_id,label,auto,blocks:[{id,block_type,content,sort,created_at}],created_by,created_at}
      comments: [],   // P1 评论：{id,page_id,block_id,body,author,created_at,resolved,replies:[{id,author,body,created_at}]}
      tombstones: []  // 删除墓碑 {id,at}：项目删除的跨端传播依据（见下方远程模式合并策略）
    };
  }

  var db = null;

  /* 旧库（P1 之前的 localStorage / 服务端 db.json）缺少 versions / comments /
     tombstones 数组，读写前统一归一化，避免 forEach / findAll 崩溃 */
  function normalize(d) {
    if (!Array.isArray(d.versions)) d.versions = [];
    if (!Array.isArray(d.comments)) d.comments = [];
    if (!Array.isArray(d.tombstones)) d.tombstones = [];
    return d;
  }

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      db = raw ? normalize(JSON.parse(raw)) : blank();
      if (!db || !Array.isArray(db.projects)) db = blank();
    } catch (e) {
      console.error('[store] 读取失败，使用空库', e);
      db = blank();
    }
  }

  /* ---------- 远程模式（本地后端 server.py，可选） ----------
   * 探测 GET /api/health：命中则数据读写走服务端（server-data/db.json），
   * localStorage 退化为缓存；未命中（纯静态托管 / file://）则维持纯本机模式。
   *
   * 同步与合并（与服务端 do_PUT 的 merge_db 互为镜像，两侧逻辑必须一致）：
   *   1. 项目级合并——同 id 项目整棵子树二选一，按 project.updated_at 新者
   *      胜出，平局偏向己方。Store 的变更操作都会 touch 所属项目，多端 /
   *      多标签并发编辑不再整体回滚（旧版按整库 saved_at 胜出，一个旧
   *      标签页的保存就能覆盖掉新标签页刚建的连线）。
   *   2. 删除靠墓碑——删除项目时记录 {id, at} 随库同步，合并时被墓碑命中
   *      的项目直接丢弃；ID 永不复用，墓碑 30 天后回收。「库里没有某项目」
   *      从此不再被解读为删除，分片 / 部分上报因此是安全的。
   *
   * 传输：常规保存绝不使用 fetch keepalive——规范限制 body 与在途
   * keepalive 字节合计 ≤ 64KiB，原型库极易超过，超限 PUT 会静默失败
   * （此前连线丢失的根因之一）。仅卸载前的尽力送达（flushRemote）使用
   * keepalive，超限时按项目分片。 */

  var remote = { on: false, rev: 0 };
  /* 共享项目空间：不写入访问者的私有数据分片，所有保存都经 token 路由到
     分享者的项目。服务端仍做权限校验，前端的 readonly 只是一层体验保护。 */
  var shared = { on: false, token: '', access: 'view', rev: 0, projectId: '' };
  var remoteErrShown = false;
  var putting = false, putQueued = false;
  var lastPutDb = '';               /* 最近一次成功送出的库数据序列化；内容未变时跳过重复 PUT（rev 会随每次成功自增，不参与比较） */
  var KEEPALIVE_LIMIT = 60 * 1024;  /* 规范 64KiB 限额留出余量 */
  var TOMBSTONE_TTL = 30 * 24 * 3600 * 1000;

  function fetchJSON(url, opts, timeoutMs) {
    var ctrl = (typeof AbortController === 'function') ? new AbortController() : null;
    var timer = ctrl ? setTimeout(function () { try { ctrl.abort(); } catch (e) { } }, timeoutMs || 2000) : null;
    var merged = { cache: 'no-store' };
    if (opts) for (var k in opts) merged[k] = opts[k];
    if (ctrl) merged.signal = ctrl.signal;
    return fetch(url, merged)
      .then(function (r) {
        if (timer) clearTimeout(timer);
        return r.ok ? r.json() : null;
      })
      .catch(function () {
        if (timer) clearTimeout(timer);
        return null;
      });
  }

  /* 带状态码的请求：鉴权场景必须区分 401（会话失效）与网络失败，
     fetchJSON 把非 2xx 一律吞成 null，无法表达 */
  function fetchAPI(url, opts, timeoutMs) {
    var ctrl = (typeof AbortController === 'function') ? new AbortController() : null;
    var timer = ctrl ? setTimeout(function () { try { ctrl.abort(); } catch (e) { } }, timeoutMs || 4000) : null;
    var merged = { cache: 'no-store', credentials: 'same-origin' };
    if (opts) for (var k in opts) merged[k] = opts[k];
    if (ctrl) merged.signal = ctrl.signal;
    return fetch(url, merged)
      .then(function (r) {
        return r.json().catch(function () { return null; }).then(function (body) {
          if (timer) clearTimeout(timer);
          return { status: r.status, body: body };
        });
      })
      .catch(function () {
        if (timer) clearTimeout(timer);
        return { status: 0, body: null };
      });
  }

  /* 会话失效（401）：停用远程同步防误判成功，交 Auth 层引导重新登录。
     登录成功后 Auth 会重跑 initRemote()，合并继续。 */
  function sessionLost() {
    remote.on = false;
    lastPutDb = '';
    remoteErrShown = false;
    if (window.Auth && typeof window.Auth.onSessionLost === 'function') {
      try { window.Auth.onSessionLost(); } catch (e) { /* ignore */ }
    }
  }

  function remoteFail(size) {
    console.warn('[store] PUT /api/db 失败，payload ' + (size ? (size / 1024).toFixed(1) + 'KB' : '未知大小') +
      '；数据已存本浏览器，下次打开会自动合并');
    if (remoteErrShown) return;
    remoteErrShown = true;
    try {
      U.toast('已保存到本浏览器，但同步本地服务失败；服务恢复后重新打开页面会自动合并', 'warn', 4200);
    } catch (e) { /* U 可能未就绪 */ }
  }

  /* 常规保存：普通 fetch（无 keepalive，也就没有 64KiB 体积上限） */
  function putRemote() {
    if (!remote.on) return;
    var dbStr = JSON.stringify(db);
    if (dbStr === lastPutDb) return;   /* 内容未变：跳过重复同步（切后台等场景的重复 flush） */
    if (putting) { putQueued = true; return; }
    putting = true;
    var body = JSON.stringify({ rev: remote.rev, db: db });
    console.log('[store] PUT /api/db ' + (body.length / 1024).toFixed(1) + 'KB');
    fetchAPI('/api/db', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: body
    }, 15000).then(function (r) {
      putting = false;
      if (r.status === 401) {
        sessionLost();
      } else if (r.status === 200 && r.body && r.body.ok) {
        remote.rev = r.body.rev; lastPutDb = dbStr; remoteErrShown = false;
      } else {
        remoteFail(body.length);
      }
      if (putQueued) { putQueued = false; putRemote(); }
    });
  }

  /* 卸载 / 切后台前的尽力送达（app.js 在 pagehide / visibilitychange 里调用）。
   * ≤ 限额：单个 keepalive 请求，页面销毁后浏览器仍会送达。
   * > 限额：按项目拆成多片顺序发送（服务端按项目合并，分片安全）。
   *   keepalive 配额是「body + 在途字节」共享的，同时发出多片会被整体
   *   拒绝，因此链式等待上一片 settle 再发下一片——切标签 / 最小化时
   *   页面仍存活，能全部送达；真正关页时只保证首片，剩余由 localStorage
   *   缓存 + 下次打开的项目级合并兜底（同浏览器不丢数据）。 */
  function projectChunks() {
    var out = [];
    var cur = null, curStr = '';
    function baseDb() {
      var b = blank();
      b.saved_at = db.saved_at || Date.now();
      b.tombstones = db.tombstones || [];
      return b;
    }
    (db.projects || []).forEach(function (p) {
      var single = baseDb();
      copyProjectSubtree(db, single, p.id);
      var singleStr = JSON.stringify({ rev: remote.rev, db: single });
      if (singleStr.length > KEEPALIVE_LIMIT) { out.push(singleStr); return; }  /* 单项目超限：独立成片 */
      if (!cur) { cur = single; curStr = singleStr; return; }
      copyProjectSubtree(db, cur, p.id);
      var mergedStr = JSON.stringify({ rev: remote.rev, db: cur });
      if (mergedStr.length <= KEEPALIVE_LIMIT) { curStr = mergedStr; return; }
      out.push(curStr);
      cur = single; curStr = singleStr;
    });
    if (curStr) out.push(curStr);
    return out;
  }

  function flushRemote() {
    if (!remote.on) return;
    try {
      var dbStr = JSON.stringify(db);
      if (dbStr === lastPutDb) return;   /* 内容未变：常规保存已送达，无需重复 */
      if (dbStr.length <= KEEPALIVE_LIMIT) {
        fetch('/api/db', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rev: remote.rev, db: db }),
          keepalive: true
        }).then(function (r) {
          /* 页面存活时可读到响应；销毁则 Promise 不再 settle，无副作用 */
          if (r && r.ok) lastPutDb = dbStr;
        }).catch(function () { });
        return;
      }
      var chunks = projectChunks();
      console.log('[store] 卸载分片同步：' + chunks.length + ' 片 / 共 ' + (dbStr.length / 1024).toFixed(1) + 'KB');
      var i = 0;
      (function next() {
        if (i >= chunks.length) return;
        var body = chunks[i++];
        try {
          fetch('/api/db', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: body,
            keepalive: body.length <= KEEPALIVE_LIMIT   /* 超大单片退化为普通 fetch，页面存活期间可送达 */
          }).then(function (r) {
            if (r && r.ok && i >= chunks.length) lastPutDb = dbStr;   /* 全部送达才标记，失败留给下次重试 */
            next();
          }, next);
        } catch (e) { next(); }
      })();
    } catch (e) { /* 序列化异常等：localStorage 已有数据，交给下次合并 */ }
  }

  function copyProjectSubtree(src, dst, projectId) {
    var pages = findAll(src.pages, function (p) { return p.project_id === projectId; });
    var pageIds = {}; pages.forEach(function (p) { pageIds[p.id] = 1; });
    var docs = findAll(src.documents, function (d) { return !!pageIds[d.page_id]; });
    var docIds = {}; docs.forEach(function (d) { docIds[d.id] = 1; });
    Array.prototype.push.apply(dst.projects, findAll(src.projects, function (p) { return p.id === projectId; }));
    Array.prototype.push.apply(dst.pages, pages);
    Array.prototype.push.apply(dst.documents, docs);
    Array.prototype.push.apply(dst.blocks, findAll(src.blocks, function (b) { return !!docIds[b.document_id]; }));
    Array.prototype.push.apply(dst.elements, findAll(src.elements, function (e) { return !!pageIds[e.page_id]; }));
    Array.prototype.push.apply(dst.links, findAll(src.links, function (l) { return !!pageIds[l.page_id]; }));
    Array.prototype.push.apply(dst.changes, findAll(src.changes, function (c) { return c.project_id === projectId; }));
    Array.prototype.push.apply(dst.versions, findAll(src.versions, function (v) { return !!pageIds[v.page_id]; }));
    Array.prototype.push.apply(dst.comments, findAll(src.comments, function (c) { return !!pageIds[c.page_id]; }));
  }

  /* 墓碑并集：同 id 取 at 较新者；按 id 排序 + 超过 30 天回收。
     排序是为了两侧（前端 / 服务端）序列化结果一致，避免「内容相同但
     顺序不同」引发每次加载都回推一次。 */
  function unionTombstones(a, b) {
    var map = {};
    (a || []).concat(b || []).forEach(function (t) {
      if (!t || !t.id) return;
      if (!map[t.id] || (t.at || 0) > (map[t.id].at || 0)) map[t.id] = t;
    });
    var now = Date.now();
    return Object.keys(map).map(function (k) { return map[k]; })
      .filter(function (t) { return now - (t.at || 0) < TOMBSTONE_TTL; })
      .sort(function (x, y) { return x.id < y.id ? -1 : 1; });
  }

  /* 项目级合并（与服务端 merge_db 互为镜像）：逐项目按 updated_at 选胜者，
     平局偏向 local（保持内存引用与本地直觉一致）；墓碑命中的项目丢弃。
     「一侧没有某项目」只说明它没见过，不算删除——删除只能来自墓碑。 */
  function mergeInto(localDb, otherDb) {
    var merged = blank();
    merged.saved_at = Math.max(localDb.saved_at || 0, otherDb.saved_at || 0);
    merged.tombstones = unionTombstones(localDb.tombstones, otherDb.tombstones);
    var dead = {};
    merged.tombstones.forEach(function (t) { dead[t.id] = 1; });
    var winner = {};   /* projectId -> {side, updated_at} */
    function offer(side, isLocal) {
      (side.projects || []).forEach(function (p) {
        if (!p || !p.id) return;
        var u = p.updated_at || 0;
        var w = winner[p.id];
        if (!w || u > w.updated_at || (isLocal && u === w.updated_at)) {
          winner[p.id] = { side: side, updated_at: u };
        }
      });
    }
    offer(otherDb, false);   /* 先放对方，local 后到 → 平局由 local 覆盖 */
    offer(localDb, true);
    Object.keys(winner).forEach(function (id) {
      if (dead[id]) return;
      copyProjectSubtree(winner[id].side, merged, id);
    });
    return merged;
  }

  function initRemote() {
    if (location.protocol === 'file:') return Promise.resolve(false);
    return fetchJSON('/api/health', null, 1500).then(function (h) {
      if (!h || !h.ok) return false;
      return fetchAPI('/api/db', null, 6000).then(function (r) {
        if (r.status === 401) {
          /* 后端在但会话失效：退回本地模式并引导重新登录（多账号模式）；
             登录成功后 Auth 会重跑本函数完成同步 */
          sessionLost();
          return false;
        }
        var w = r.body;
        if (r.status !== 200 || !w) return false;
        remote.rev = w.rev || 0;
        var sdb = w.db;
        if (sdb) normalize(sdb);   /* 服务端可能是 P1 之前的旧结构 */
        var localHas = !!(db.projects && db.projects.length);
        var serverHas = !!(sdb && sdb.projects && sdb.projects.length);
        var needPush = false;

        if (serverHas) {
          /* 项目级合并：逐项目按 updated_at 选胜者（平局偏向本地），
             墓碑命中丢弃；两侧互为镜像，谁先合并不影响结果 */
          var merged = mergeInto(db, sdb);
          needPush = JSON.stringify(merged) !== JSON.stringify(sdb);
          db = merged;
        } else if (localHas) {
          /* 服务端为空、本地有数据：首次接入，把本地数据推上去 */
          db.saved_at = db.saved_at || Date.now();
          needPush = true;
        } else if (sdb) {
          /* 双方都没有项目：采纳服务端库（可能携带墓碑等） */
          db = normalize(sdb);
        }

        remote.on = true;
        /* 镜像到 localStorage 作为缓存（不经 save()，避免误触发 PUT / 改写 saved_at） */
        try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) { /* ignore */ }
        if (needPush) putRemote();
        return true;
      });
    });
  }

  /* ---------- 变更追踪 ----------
   * project.updated_at 是项目级合并的胜出时钟：凡是改动某项目内容的操作
   * 都要 touch 所属项目，否则旧端可能凭更早的 updated_at 赢回合并，
   * 覆盖掉新建立的连线 / 需求。 */
  function touchProjectById(pid) {
    var p = find(db.projects, function (x) { return x.id === pid; });
    if (p) p.updated_at = Date.now();
  }
  function touchByPage(pageId) {
    var pg = find(db.pages, function (x) { return x.id === pageId; });
    if (pg) touchProjectById(pg.project_id);
  }
  function touchByDoc(docId) {
    var d = find(db.documents, function (x) { return x.id === docId; });
    if (d) touchByPage(d.page_id);
  }

  var saveErrorShown = false;
  function save() {
    db.saved_at = Date.now();
    if (shared.on) { putShared(); return true; }
    try {
      localStorage.setItem(KEY, JSON.stringify(db));
      saveErrorShown = false;
    } catch (e) {
      if (!saveErrorShown) {
        saveErrorShown = true;
        U.toast('保存失败：浏览器本地存储空间不足，请精简原型内容', 'error', 4000);
      }
      return false;
    }
    if (remote.on) putRemote();
    return true;
  }

  function putShared() {
    if (!shared.on || shared.access !== 'edit') return;
    fetchAPI('/api/share/' + encodeURIComponent(shared.token) + '/workspace', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rev: shared.rev, db: db })
    }, 15000).then(function (r) {
      if (r.status === 200 && r.body && r.body.ok) shared.rev = r.body.rev;
      else if (r.status === 401) sessionLost();
      else remoteFail(0);
    });
  }

  function openShared(token) {
    return fetchAPI('/api/share/' + encodeURIComponent(token) + '/workspace', null, 10000).then(function (r) {
      if (r.status !== 200 || !r.body || !r.body.ok || !r.body.db) {
        return { ok: false, status: r.status, error: (r.body && r.body.error) || '无法打开分享项目' };
      }
      db = normalize(r.body.db);
      shared = { on: true, token: token, access: r.body.access || 'view', rev: r.body.rev || 0, projectId: r.body.project_id || '' };
      remote.on = false;
      return { ok: true, access: shared.access, projectId: shared.projectId, ownerName: r.body.owner_name || '' };
    });
  }

  function refreshShared() {
    if (!shared.on) return Promise.resolve({ changed: false });
    return fetchAPI('/api/share/' + encodeURIComponent(shared.token) + '/workspace', null, 10000).then(function (r) {
      if (r.status !== 200 || !r.body || !r.body.ok || !r.body.db) return { changed: false, error: (r.body && r.body.error) || '' };
      if ((r.body.rev || 0) <= shared.rev) return { changed: false };
      db = normalize(r.body.db);
      shared.rev = r.body.rev || shared.rev;
      return { changed: true };
    });
  }

  function find(arr, fn) { for (var i = 0; i < arr.length; i++) if (fn(arr[i])) return arr[i]; return null; }
  function findAll(arr, fn) { var r = []; for (var i = 0; i < arr.length; i++) if (fn(arr[i])) r.push(arr[i]); return r; }
  function rm(arr, fn) { for (var i = arr.length - 1; i >= 0; i--) if (fn(arr[i])) arr.splice(i, 1); }

  var Store = {

    init: function () { load(); },

    /* 远程模式：探测本地后端并完成首次同步，返回 Promise<boolean>（是否进入服务模式） */
    initRemote: initRemote,

    isRemote: function () { return remote.on; },
    isShared: function () { return shared.on; },
    sharedAccess: function () { return shared.access; },
    sharedProjectId: function () { return shared.projectId; },
    openShared: openShared,
    refreshShared: refreshShared,

    /* 账号切换 / 退出登录：丢弃内存库与本地缓存（防止上一个账号的数据
       经「合并 + 回推」进入下一个账号，公共电脑上的数据隔离关键） */
    reset: function () {
      db = blank();
      remote.on = false;
      shared = { on: false, token: '', access: 'view', rev: 0, projectId: '' };
      remote.rev = 0;
      lastPutDb = '';
      putting = false; putQueued = false;
      try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ }
    },

    /* 本地缓存归属标记：initRemote 同步成功后由 Auth 层写入 */
    markCacheOwner: function (userId) {
      try {
        if (userId) localStorage.setItem(OWNER_KEY, userId);
        else localStorage.removeItem(OWNER_KEY);
      } catch (e) { /* ignore */ }
    },
    cacheOwner: function () {
      try { return localStorage.getItem(OWNER_KEY) || ''; } catch (e) { return ''; }
    },

    save: save,

    /* 卸载 / 切后台前的尽力同步（keepalive + 大库分片），app.js 生命周期钩子调用 */
    flushRemote: flushRemote,

    /* ---------- 项目 ---------- */

    listProjects: function () {
      return db.projects.slice().sort(function (a, b) { return b.updated_at - a.updated_at; });
    },

    getProject: function (id) { return find(db.projects, function (p) { return p.id === id; }); },

    createProject: function (o) {
      var now = Date.now();
      var p = {
        id: U.uid('prj'),
        name: (o.name || '未命名项目').trim(),
        description: (o.description || '').trim(),
        created_by: 'local-user',
        created_at: now,
        updated_at: now
      };
      db.projects.push(p);
      save();
      return p;
    },

    updateProject: function (id, patch) {
      var p = this.getProject(id);
      if (!p) return;
      Object.keys(patch).forEach(function (k) { p[k] = patch[k]; });
      p.updated_at = Date.now();
    },

    deleteProject: function (id) {
      var pages = findAll(db.pages, function (x) { return x.project_id === id; });
      var self = this;
      pages.forEach(function (pg) { self._deletePageData(pg.id); });
      rm(db.projects, function (p) { return p.id === id; });
      rm(db.changes, function (c) { return c.project_id === id; });
      /* 墓碑：项目删除必须跨端传播。「库里没有该项目」在合并时不再视为
         删除（否则部分上报 / 旧端数据会让项目复活），删除意图只能靠墓碑表达 */
      if (!find(db.tombstones, function (t) { return t.id === id; })) {
        db.tombstones.push({ id: id, at: Date.now() });
      }
      save();
    },

    /* ---------- 页面 ---------- */

    listPages: function (projectId) {
      return findAll(db.pages, function (p) { return p.project_id === projectId; })
        .sort(function (a, b) { return a.sort - b.sort; });
    },

    getPage: function (id) { return find(db.pages, function (p) { return p.id === id; }); },

    createPage: function (o) {
      var now = Date.now();
      var maxSort = 0;
      db.pages.forEach(function (p) { if (p.project_id === o.project_id && p.sort > maxSort) maxSort = p.sort; });
      var page = {
        id: U.uid('page'),
        project_id: o.project_id,
        name: (o.name || '未命名页面').trim(),
        prototype_content: o.prototype_content || '',
        sort: maxSort + 1,
        created_at: now,
        updated_at: now
      };
      db.pages.push(page);
      var proj = this.getProject(o.project_id);
      if (proj) proj.updated_at = now;
      save();
      return page;
    },

    updatePage: function (id, patch) {
      var p = this.getPage(id);
      if (!p) return;
      Object.keys(patch).forEach(function (k) { p[k] = patch[k]; });
      p.updated_at = Date.now();
      var proj = Store.getProject(p.project_id);
      if (proj) proj.updated_at = Date.now();
    },

    deletePage: function (id) { touchByPage(id); this._deletePageData(id); save(); },

    _deletePageData: function (pageId) {
      var doc = find(db.documents, function (d) { return d.page_id === pageId; });
      if (doc) {
        rm(db.blocks, function (b) { return b.document_id === doc.id; });
        rm(db.documents, function (d) { return d.id === doc.id; });
      }
      rm(db.pages, function (p) { return p.id === pageId; });
      rm(db.elements, function (e) { return e.page_id === pageId; });
      rm(db.links, function (l) { return l.page_id === pageId; });
      rm(db.changes, function (c) { return c.page_id === pageId; });
      rm(db.versions, function (v) { return v.page_id === pageId; });
      rm(db.comments, function (c) { return c.page_id === pageId; });
    },

    movePage: function (id, dir) {
      var page = this.getPage(id);
      if (!page) return;
      var siblings = this.listPages(page.project_id);
      var idx = siblings.indexOf(page);
      var t = idx + dir;
      if (t < 0 || t >= siblings.length) return;
      var tmp = siblings[idx].sort;
      siblings[idx].sort = siblings[t].sort;
      siblings[t].sort = tmp;
      touchByPage(id);
      save();
    },

    /* ---------- 需求文档 / Blocks ---------- */

    getDocByPage: function (pageId, createIfMissing) {
      var doc = find(db.documents, function (d) { return d.page_id === pageId; });
      if (!doc && createIfMissing) {
        var now = Date.now();
        doc = { id: U.uid('doc'), page_id: pageId, created_at: now, updated_at: now };
        db.documents.push(doc);
      }
      return doc;
    },

    getBlocks: function (docId) {
      return findAll(db.blocks, function (b) { return b.document_id === docId; })
        .sort(function (a, b) { return a.sort - b.sort; });
    },

    /* 整体替换文档的 blocks（编辑器每次保存传入全量） */
    replaceBlocks: function (docId, blocks) {
      var now = Date.now();
      rm(db.blocks, function (b) { return b.document_id === docId; });
      blocks.forEach(function (b, i) {
        db.blocks.push({
          id: b.id,
          document_id: docId,
          block_type: b.type,
          content: b.content,
          sort: i,
          created_at: b.created_at || now,
          updated_at: now
        });
      });
      var doc = find(db.documents, function (d) { return d.id === docId; });
      if (doc) doc.updated_at = now;
      touchByDoc(docId);   /* 文档内容变化 → 项目合并时钟推进，防止旧端覆盖 */
    },

    /* ---------- 原型元素 ---------- */

    ensureElement: function (pageId, protoId, name, type, fingerprint) {
      touchByPage(pageId);
      var ex = find(db.elements, function (e) { return e.page_id === pageId && e.proto_element_id === protoId; });
      if (ex) {
        if (name) ex.element_name = name;
        if (type) ex.element_type = type;
        /* 重新选中时刷新指纹——元素可能是原型脚本重建后的新节点 */
        if (fingerprint) ex.fingerprint = fingerprint;
        return ex;
      }
      var el = {
        id: U.uid('elem'),
        page_id: pageId,
        proto_element_id: protoId,
        element_name: name || '未命名元素',
        element_type: type || 'element',
        /* 指纹 {tag,cls,text}：原型重渲染导致 data-proto-id 丢失时，
           按指纹自动找回等价元素并恢复标识（连线不丢） */
        fingerprint: fingerprint || null,
        created_at: Date.now()
      };
      db.elements.push(el);
      return el;
    },

    getElement: function (pageId, protoId) {
      return find(db.elements, function (e) { return e.page_id === pageId && e.proto_element_id === protoId; });
    },

    getElements: function (pageId) {
      return findAll(db.elements, function (e) { return e.page_id === pageId; });
    },

    /* ---------- 连线（元素 ↔ 需求 Block 多对多） ---------- */

    addLink: function (o) {
      if (!o || !o.prototype_element_id || !o.requirement_block_id || !o.page_id) return null;
      var ex = this.findLink(o.page_id, o.prototype_element_id, o.requirement_block_id);
      if (ex) return ex;
      var link = {
        id: U.uid('lnk'),
        page_id: o.page_id,
        prototype_element_id: o.prototype_element_id,
        requirement_block_id: o.requirement_block_id,
        created_by: 'local-user',
        created_at: Date.now()
      };
      db.links.push(link);
      touchByPage(o.page_id);   /* 连线是项目内容：必须推进项目时钟，否则被旧端合并回滚 */
      return link;
    },

    findLink: function (pageId, protoId, blockId) {
      return find(db.links, function (l) {
        return l.page_id === pageId && l.prototype_element_id === protoId && l.requirement_block_id === blockId;
      });
    },

    getLinks: function (pageId) {
      return findAll(db.links, function (l) { return l.page_id === pageId; });
    },

    linksForElement: function (pageId, protoId) {
      return findAll(db.links, function (l) { return l.page_id === pageId && l.prototype_element_id === protoId; });
    },

    linksForBlock: function (blockId) {
      return findAll(db.links, function (l) { return l.requirement_block_id === blockId; });
    },

    removeLink: function (id) {
      var l = find(db.links, function (x) { return x.id === id; });
      if (l) touchByPage(l.page_id);
      rm(db.links, function (l) { return l.id === id; });
    },

    updateLinkElement: function (id, protoId) {
      var l = find(db.links, function (x) { return x.id === id; });
      if (l) { l.prototype_element_id = protoId; touchByPage(l.page_id); }
    },

    getLink: function (id) { return find(db.links, function (l) { return l.id === id; }); },

    /* 撤销/重做专用：按原 ID 原样恢复一条连线（绕过 addLink 的新 ID 生成），
       保证 undo → redo 往返后连线身份不变（popover / 历史记录里引用的仍是同一 id） */
    restoreLink: function (link) {
      if (!link || !link.id) return null;
      var ex = find(db.links, function (l) { return l.id === link.id; });
      if (ex) return ex;
      var copy = U.deepCopy(link);
      db.links.push(copy);
      touchByPage(copy.page_id);
      return copy;
    },

    /* ---------- 修改记录 ---------- */

    addChange: function (o) {
      db.changes.push({
        id: U.uid('chg'),
        project_id: o.project_id,
        page_id: o.page_id,
        block_id: o.block_id || '',
        old_content: o.old_content == null ? null : String(o.old_content),
        new_content: o.new_content == null ? null : String(o.new_content),
        created_by: 'local-user',
        created_at: Date.now()
      });
      touchByPage(o.page_id);
      // 每页最多保留 200 条
      var pageChanges = findAll(db.changes, function (c) { return c.page_id === o.page_id; })
        .sort(function (a, b) { return a.created_at - b.created_at; });
      if (pageChanges.length > 200) {
        var drop = pageChanges.slice(0, pageChanges.length - 200);
        var dropIds = {};
        drop.forEach(function (c) { dropIds[c.id] = 1; });
        rm(db.changes, function (c) { return !!dropIds[c.id]; });
      }
    },

    getChanges: function (pageId) {
      return findAll(db.changes, function (c) { return c.page_id === pageId; })
        .sort(function (a, b) { return b.created_at - a.created_at; });
    },

    /* ---------- 版本管理（P1） ----------
     * 版本保存需求、原型和关联快照。可视化编辑首次改动会清理连线，因此
     * 必须能从「编辑前」版本完整恢复，不能只备份右侧需求块。 */

    saveVersion: function (pageId, docId, label, auto) {
      var doc = find(db.documents, function (d) { return d.id === docId; });
      if (!doc) return null;
      var blocks = this.getBlocks(docId).map(function (b) {
        return { id: b.id, block_type: b.block_type, content: b.content, sort: b.sort, created_at: b.created_at };
      });
      var pg = this.getPage(pageId);
      var v = {
        id: U.uid('ver'),
        page_id: pageId,
        document_id: docId,
        label: (label || '').trim() || '未命名版本',
        auto: !!auto,
        blocks: blocks,
        prototype_content: pg ? (pg.prototype_content || '') : '',
        elements: this.getElements(pageId).map(function (e) { return U.deepCopy(e); }),
        links: this.getLinks(pageId).map(function (l) { return U.deepCopy(l); }),
        created_by: 'local-user',
        created_at: Date.now()
      };
      db.versions.push(v);
      var pv = findAll(db.versions, function (x) { return x.page_id === pageId; })
        .sort(function (a, b) { return a.created_at - b.created_at; });
      if (pv.length > 30) {
        var dropIds = {};
        pv.slice(0, pv.length - 30).forEach(function (x) { dropIds[x.id] = 1; });
        rm(db.versions, function (x) { return !!dropIds[x.id]; });
      }
      touchByPage(pageId);
      save();
      return v;
    },

    /* 可视化编辑首次落笔后的关联清理。返回被移除的连线数；评论和需求保留。 */
    clearPageLinks: function (pageId) {
      var n = this.getLinks(pageId).length;
      rm(db.links, function (l) { return l.page_id === pageId; });
      rm(db.elements, function (e) { return e.page_id === pageId; });
      touchByPage(pageId);
      return n;
    },

    restoreVisualSnapshot: function (v) {
      if (!v || !v.page_id) return false;
      var pg = this.getPage(v.page_id);
      if (!pg) return false;
      if (Object.prototype.hasOwnProperty.call(v, 'prototype_content')) pg.prototype_content = v.prototype_content || '';
      rm(db.links, function (l) { return l.page_id === v.page_id; });
      rm(db.elements, function (e) { return e.page_id === v.page_id; });
      (v.elements || []).forEach(function (e) { db.elements.push(U.deepCopy(e)); });
      (v.links || []).forEach(function (l) { db.links.push(U.deepCopy(l)); });
      touchByPage(v.page_id);
      save();
      return true;
    },

    listVersions: function (pageId) {
      return findAll(db.versions, function (v) { return v.page_id === pageId; })
        .sort(function (a, b) { return b.created_at - a.created_at; });
    },

    getVersion: function (id) { return find(db.versions, function (v) { return v.id === id; }); },

    deleteVersion: function (id) {
      var v = find(db.versions, function (x) { return x.id === id; });
      if (v) touchByPage(v.page_id);
      rm(db.versions, function (x) { return x.id === id; });
      save();
    },

    /* ---------- 评论（P1） ----------
     * 评论挂在需求块上（block_id），支持回复与解决状态。
     * 删除块时由保存流程级联清理（removeCommentsOfBlock）。 */

    addComment: function (o) {
      if (!o || !o.page_id || !o.block_id || !String(o.body || '').trim()) return null;
      var c = {
        id: U.uid('cmt'),
        page_id: o.page_id,
        block_id: o.block_id,
        body: String(o.body).trim().slice(0, 2000),
        author: (o.author || '').trim().slice(0, 24) || '匿名',
        created_at: Date.now(),
        resolved: false,
        replies: []
      };
      db.comments.push(c);
      touchByPage(o.page_id);
      save();
      return c;
    },

    getComments: function (pageId) {
      return findAll(db.comments, function (c) { return c.page_id === pageId; })
        .sort(function (a, b) { return a.created_at - b.created_at; });
    },

    commentsForBlock: function (blockId) {
      return findAll(db.comments, function (c) { return c.block_id === blockId; })
        .sort(function (a, b) { return a.created_at - b.created_at; });
    },

    replyComment: function (id, o) {
      var c = find(db.comments, function (x) { return x.id === id; });
      if (!c || !String(o.body || '').trim()) return;
      c.replies.push({
        id: U.uid('rpl'),
        author: (o.author || '').trim().slice(0, 24) || '匿名',
        body: String(o.body).trim().slice(0, 2000),
        created_at: Date.now()
      });
      touchByPage(c.page_id);
      save();
    },

    setCommentResolved: function (id, resolved) {
      var c = find(db.comments, function (x) { return x.id === id; });
      if (c) { c.resolved = !!resolved; touchByPage(c.page_id); save(); }
    },

    deleteComment: function (id) {
      var c = find(db.comments, function (x) { return x.id === id; });
      if (c) touchByPage(c.page_id);
      rm(db.comments, function (c) { return c.id === id; });
      save();
    },

    /* 级联清理某块的全部评论（块被删除 / 版本恢复时调用），返回清理条数；不触发 save，由调用方统一保存 */
    removeCommentsOfBlock: function (blockId) {
      var before = db.comments.length;
      rm(db.comments, function (c) { return c.block_id === blockId; });
      return before - db.comments.length;
    },

    /* ---------- 导出 / 导入（备份 & 恢复 & 清空） ---------- */

    exportAll: function () { return JSON.parse(JSON.stringify(db)); },

    /* 整库替换导入（备份恢复 / 换机迁移），校验失败返回 false。
       服务模式下 save() 会把结果推给本地后端；服务端按项目级合并，
       其他设备独有的项目不会被抹掉 */
    importAll: function (data) {
      if (!data || data.v !== 1 || !Array.isArray(data.projects)) return false;
      db = normalize({
        v: 1,
        saved_at: Date.now(),
        projects: data.projects,
        pages: Array.isArray(data.pages) ? data.pages : [],
        documents: Array.isArray(data.documents) ? data.documents : [],
        blocks: Array.isArray(data.blocks) ? data.blocks : [],
        elements: Array.isArray(data.elements) ? data.elements : [],
        links: Array.isArray(data.links) ? data.links : [],
        changes: Array.isArray(data.changes) ? data.changes : [],
        versions: Array.isArray(data.versions) ? data.versions : [],
        comments: Array.isArray(data.comments) ? data.comments : [],
        tombstones: Array.isArray(data.tombstones) ? data.tombstones : []
      });
      return save();
    },

    /* 清空全部数据：逐项目走 deleteProject（级联清理 + 生成墓碑，
       服务模式下墓碑可跨端传播防止复活），最后再落盘一次 */
    clearAll: function () {
      var ids = db.projects.map(function (p) { return p.id; });
      ids.forEach(function (id) { Store.deleteProject(id); });
      save();
    }
  };

  window.Store = Store;
})();
