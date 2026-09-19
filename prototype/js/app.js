/* ============================================================
 * app.js · 应用入口：路由 / 首页 / 工作台编排
 * 三种模式：原型 / 需求 / 阅读（含分享只读）
 * ============================================================ */
(function () {
  'use strict';

  try { Store.init(); }
  catch (error) {
    if (window.PRD_MODE) { PRD_MODE.showStartupError(error); return; }
    throw error;
  }

  /* ==================== 路由 ==================== */

  function parseHash() {
    var h = location.hash || '#/';
    var m;
    if ((m = h.match(/^#\/s\/([A-Za-z0-9_-]+)/))) return { name: 'shared-workspace', token: m[1] };
    if ((m = h.match(/^#\/share\/([\w-]+)(?:\/([\w-]+))?/))) return { name: 'share', projectId: m[1], pageId: m[2] || '' };
    if ((m = h.match(/^#\/p\/([\w-]+)(?:\/([\w-]+))?/))) return { name: 'project', projectId: m[1], pageId: m[2] || '' };
    return { name: 'home' };
  }

  function navigate(hash) {
    if (location.hash === hash) render();
    else location.hash = hash;
  }

  var currentCleanup = null;
  var flushSaveRef = null;
  var persistPrototypeNowRef = null;
  var AI_HOME_PAGE_KEY = 'protoReq.openAIPage.v1';

  window.addEventListener('hashchange', render);

  /* 卸载 / 切后台前落库：
   * - pagehide：覆盖关闭页与站内跳转，比 beforeunload 可靠，且不阻止 bfcache；
   * - visibilitychange→hidden：覆盖切标签 / 最小化，此时页面仍存活，
   *   大库分片也能完整送达（见 store.js flushRemote）。
   * 两条路径幂等：store 层按「内容未变跳过」去重，不会重复 PUT。 */
  function flushBeforeExit() {
    if (flushSaveRef) { try { flushSaveRef(); } catch (e) { /* ignore */ } }
    /* 原型内容（含新写入的 data-proto-id）同样要在卸载前落库，否则连线元素丢失 */
    if (persistPrototypeNowRef) { try { persistPrototypeNowRef(); } catch (e) { /* ignore */ } }
    if (window.Store && Store.flushRemote) { try { Store.flushRemote(); } catch (e) { /* ignore */ } }
  }
  window.addEventListener('pagehide', flushBeforeExit);
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') flushBeforeExit();
  });

  function render() {
    if (currentCleanup) { try { currentCleanup(); } catch (e) { console.warn(e); } currentCleanup = null; }
    /* 离开工作台（返回首页 / 切项目）前，把原型里新写入的元素 ID 落库，
       此时工作台 DOM 尚未销毁，序列化仍可读到最新内容。
       （需求编辑器的落库由 currentCleanup 里的 flushSave 负责，不重复调用） */
    if (persistPrototypeNowRef) { try { persistPrototypeNowRef(); } catch (e) { /* ignore */ } }
    flushSaveRef = null;
    persistPrototypeNowRef = null;
    var app = document.getElementById('app');
    app.innerHTML = '';
    document.body.className = '';
    var r = parseHash();
    if (r.name === 'shared-workspace') { renderSharedWorkspace(app, r.token); return; }
    if (r.name === 'home') renderHome(app);
    else renderWorkspace(app, r);
  }

  function renderSharedWorkspace(app, token) {
    var loading = U.el('div', { class: 'imp-wrap' }, U.el('div', { class: 'imp-loading', text: '正在打开共享项目…' }));
    app.append(loading);
    Store.openShared(token).then(function (session) {
      if (!session.ok) {
        loading.innerHTML = '';
        if (session.status === 401) {
          loading.append(U.el('div', { class: 'imp-card imp-error-card' }, U.el('div', { class: 'empty-title', text: '协作编辑需要登录' }), U.el('div', { class: 'empty-desc', text: '登录后即可进入共享编辑空间。' })));
          Auth.showLogin({ title: '登录后协作编辑', reason: '该分享链接允许多人共同修改项目。', onDone: function () { render(); } });
        } else loading.append(U.el('div', { class: 'imp-card imp-error-card' }, U.el('div', { class: 'empty-title', text: '无法打开共享项目' }), U.el('div', { class: 'empty-desc', text: session.error || '分享链接不存在或已被撤销' })));
        return;
      }
      app.innerHTML = '';
      renderWorkspace(app, { name: 'share', projectId: session.projectId, pageId: '' });
    });
  }

  /* ==================== 首页 ==================== */

  var LOGO = window.PRD_MODE ? '<img src="../assets/pmhub-mark.svg" alt="">' : '<svg viewBox="0 0 48 48" width="24" height="24" aria-hidden="true"><defs><linearGradient id="pmhub-a" x1="0" x2="1" y1="0" y2="1"><stop stop-color="#2462ff"/><stop offset="1" stop-color="#6625f5"/></linearGradient><linearGradient id="pmhub-b" x1="0" x2="1" y1="0" y2="1"><stop stop-color="#b4c7ff" stop-opacity=".92"/><stop offset="1" stop-color="#8067ef" stop-opacity=".74"/></linearGradient></defs><rect x="1" y="1" width="46" height="46" rx="15" fill="#f8f9ff" stroke="#fff"/><path d="M12 17.5 26.6 9c2.7-1.5 6 .4 6 3.5v19.2c0 2.2-2.3 3.7-4.3 2.6L14 26.1a4.1 4.1 0 0 1-2-3.5v-1.5c0-1.5.8-2.8 2-3.6Z" fill="url(#pmhub-a)"/><path d="m25.1 21.1 9.5 5.4c1.4.8 2.2 2.2 2.2 3.8v7.1c0 3-3.2 4.9-5.8 3.4l-12.1-7a4.1 4.1 0 0 1-2.1-3.5v-7.9c0-3 3.1-4.9 5.8-3.3l2.5 1.4Z" fill="url(#pmhub-b)"/></svg>';

  function renderHome(app) {
    document.title = 'PMHub';

    function createProjectDialog() {
      var name = U.el('input', { class: 'input', type: 'text', placeholder: '例如：电商后台二期', maxlength: '40' });
      var desc = U.el('input', { class: 'input', type: 'text', placeholder: '一句话描述（可选）', maxlength: '80' });
      U.modal({
        title: '新建项目',
        body: U.el('div', {},
          U.el('div', { class: 'field-label', text: '项目名称' }), name,
          U.el('div', { class: 'field-label', style: 'margin-top:12px', text: '项目描述' }), desc
        ),
        actions: [
          { label: '取消' },
          {
            label: '创建', kind: 'primary', onClick: function (close) {
              if (!name.value.trim()) { U.toast('请输入项目名称', 'warn'); name.focus(); return; }
              var p = Store.createProject({ name: name.value, description: desc.value });
              close();
              navigate('#/p/' + p.id);
            }
          }
        ]
      });
      setTimeout(function () { name.focus(); }, 30);
    }

    function openStarterGuide() {
      U.modal({
        title: '开始使用', width: 440,
        body: U.el('div', { class: 'set-body' },
          U.el('div', { class: 'set-section' }, U.el('div', { text: '1. 新建项目和页面' })),
          U.el('div', { class: 'set-section' }, U.el('div', { text: '2. 导入或编辑 HTML 原型' })),
          U.el('div', { class: 'set-section' }, U.el('div', { text: '3. 写需求，点击“连线”建立关联' }))
        ),
        actions: [{ label: '知道了', kind: 'primary' }]
      });
    }

    function startAIGeneration() {
      U.prompt({ title: 'AI 生成原型', label: '项目名称', placeholder: '例如：用户管理后台', okLabel: '开始生成' })
        .then(function (name) {
          name = (name || '').trim();
          if (!name) return;
          var project = Store.createProject({ name: name });
          var firstPage = Store.createPage({ project_id: project.id, name: '首页' });
          try { sessionStorage.setItem(AI_HOME_PAGE_KEY, firstPage.id); } catch (e) { /* ignore */ }
          navigate('#/p/' + project.id + '/' + firstPage.id);
        });
    }

    var homeActions = U.el('div', { class: 'home-actions' },
      U.el('button', { class: 'btn', text: '新手教程', onclick: openStarterGuide }),
      U.el('button', { class: 'btn', html: U.ICONS.spark + '<span>AI 生成</span>', onclick: startAIGeneration }),
      U.el('button', { class: 'btn btn-primary', html: U.ICONS.plus + '<span>新建项目</span>', onclick: createProjectDialog }),
      Auth.accountButton(),
      U.el('button', { class: 'icon-btn', title: '设置（署名 / 数据备份 / 关于）', html: U.ICONS.gear, onclick: function () { Settings.open(); } })
    );

    var header = U.el('header', { class: 'home-header' },
      U.el('div', { class: 'home-brand' },
        U.el('span', { class: 'brand-logo', html: LOGO }),
        U.el('div', {},
          U.el('div', { class: 'brand-name', text: 'PMHub' }),
          U.el('div', { class: 'brand-sub', text: '让产品更进一步' }))
      ),
      homeActions
    );

    var projects = Store.listProjects();
    var main = U.el('main', { class: 'home-main' },
      U.el('div', { class: 'home-section-title', text: '项目（' + projects.length + '）' })
    );

    if (!projects.length) {
      main.append(U.el('div', { class: 'home-empty' },
        U.el('div', { class: 'empty-ico', html: LOGO }),
        U.el('div', { class: 'empty-title', text: '还没有项目' }),
        U.el('div', { class: 'empty-desc', text: '创建一个项目，导入 HTML 原型，在右侧自由编写需求，并手动建立元素与需求的连线。' }),
        U.el('div', { class: 'empty-actions' },
          U.el('button', { class: 'btn btn-primary', text: '新建项目', onclick: createProjectDialog }),
          U.el('button', { class: 'btn', html: U.ICONS.spark + '<span>AI 生成</span>', onclick: startAIGeneration }),
          U.el('button', { class: 'btn', text: '新手教程', onclick: openStarterGuide })
        )
      ));
    } else {
      var grid = U.el('div', { class: 'project-grid' });
      projects.forEach(function (p) {
        var pages = Store.listPages(p.id);
        /* 卡片统计：连线与评论跨页汇总，让首页一眼看到项目的「协作密度」 */
        var linkN = 0, cmtN = 0;
        pages.forEach(function (pg) {
          linkN += Store.getLinks(pg.id).length;
          cmtN += Store.getComments(pg.id).length;
        });
        var stats = [pages.length + ' 个页面'];
        if (linkN) stats.push(linkN + ' 条连线');
        if (cmtN) stats.push(cmtN + ' 条评论');
        var multiUser = Auth.isMultiUser();
        var card = U.el('div', { class: 'project-card' },
          U.el('div', { class: 'pc-head' },
            U.el('div', { class: 'pc-name', text: p.name }),
            U.el('div', { class: 'pc-actions' },
              multiUser ? U.el('button', {
                class: 'icon-btn', title: '分享这个项目（对方只能看到它）', html: U.ICONS.share,
                onclick: function (e) { e.stopPropagation(); Auth.shareProjectDialog(p); }
              }) : null,
              U.el('button', {
                class: 'icon-btn', title: '重命名', html: U.ICONS.pen, onclick: async function (e) {
                  e.stopPropagation();
                  var name = await U.prompt({ title: '重命名项目', label: '项目名称', value: p.name });
                  if (name && name.trim()) { Store.updateProject(p.id, { name: name.trim() }); Store.save(); render(); }
                }
              }),
              U.el('button', {
                class: 'icon-btn', title: '删除项目', html: U.ICONS.trash, onclick: async function (e) {
                  e.stopPropagation();
                  var ok = await U.confirm('删除项目「' + p.name + '」及其全部页面、需求与关联？此操作不可恢复。', { danger: true, okLabel: '删除' });
                  if (ok) { Store.deleteProject(p.id); U.toast('项目已删除', 'success'); render(); }
                }
              })
            )
          ),
          U.el('div', { class: 'pc-desc', text: p.description || '暂无描述' }),
          U.el('div', { class: 'pc-meta', text: stats.join(' · ') + ' · 更新于 ' + U.fmtDT(p.updated_at) })
        );
        card.addEventListener('click', function () { navigate('#/p/' + p.id); });
        grid.append(card);
      });
      main.append(grid);
    }

    var footText = Auth.isMultiUser()
      ? '多账号模式 · 数据按账号隔离保存在服务器 · 分享链接只包含你指定的那一个项目'
      : (Store.isRemote()
        ? '免鉴权服务模式 · 数据保存在服务器（server-data/），同一网络内可直接访问'
        : '本地演示版 · 数据保存在当前浏览器 localStorage，运行 python3 server.py 可开启跨设备分享');
    app.append(
      header,
      main,
      U.el('footer', { class: 'home-foot', text: footText })
    );
  }

  /* ==================== 工作台 ==================== */

  function renderWorkspace(app, route) {
    var project = Store.getProject(route.projectId);
    if (!project) { U.toast('项目不存在或已被删除', 'warn'); location.hash = '#/'; return; }

    var share = route.name === 'share';
    var sharedEditable = share && Store.isShared && Store.isShared() && Store.sharedAccess() === 'edit';
    var locked = share && !sharedEditable;
    var pages = Store.listPages(project.id);
    var page = null;
    if (route.pageId) {
      var found = Store.getPage(route.pageId);
      if (found && found.project_id === project.id) page = found;
    }
    if (!page) page = pages[0] || null;

    document.title = project.name + ' · PMHub';

    /* ---------- 状态 ---------- */
    /* 模式记忆：回到工作台时恢复上次使用的模式（原型 / 需求 / 阅读），减少重复切换 */
    var MODE_KEY = 'protoReq.lastMode';
    var mode = locked ? 'read' : (function () {
      try {
        var m = localStorage.getItem(MODE_KEY);
        return (m === 'proto' || m === 'read') ? m : 'req';
      } catch (e) { return 'req'; }
    })();
    var doc = null;
    var links = [];
    /* 元素编号表：prototype_element_id → 序号（1 起，按 links 首次出现顺序分配）。
       需求卡片上的 el-chip 编号与原型侧元素框左上角的编号圆点（links.js elnum）
       共用同一编号，两端一一对应，无需追线也能识别关联。 */
    var elIndexMap = {};
    var savedBlocks = [];
    var dirty = false;
    var lastSavedAt = 0;   /* 最近一次保存时间：不进顶栏文案，悬停时展示 */
    var frameReady = false;
    var linkMode = { active: false, protoId: null, blockId: null, rebindLinkId: null };

    /* ---------- DOM ---------- */
    var saveChip, undoBtn, redoBtn, historyBtn, versionBtn, shareBtn, linkModeBtn, lineDisplayBtn, visualEditBtn, exportPngBtn, exportHtmlBtn, commentBtn, helpBtn, settingsBtn, accountBtn;
    var treeList, addPageBtn, treeToggle, treeExpandBtn;
    var stage, protoPanel, protoEmpty, dragbar, reqPanel, reqHint, editorRoot;
    var linkBar, lbStep1, lbStep2, lbElVal, lbBlkVal, lbBind, lbTitle, lbUndoBtn, lbRedoBtn;
    var linkUndoStack = [];   /* 连线操作历史（命令模式），与文档编辑器的撤销栈相互独立 */
    var linkRedoStack = [];
    var modeSeg;
    var projSub;

    var topbar = U.el('header', { id: 'topbar' },
      U.el('div', { class: 'tb-left' },
        U.el('button', {
          class: 'icon-btn tb-back', title: '返回主页（项目列表）', html: U.ICONS.arrowLeft,
          onclick: function () { navigate('#/'); }
        }),
        /* 树折叠后树内的折叠键随树一起隐藏，顶栏常驻展开键兜底（见 CSS .tree-expand） */
        treeExpandBtn = U.el('button', {
          class: 'icon-btn tree-expand', title: '展开页面树', html: U.ICONS.panelLeft,
          onclick: function () { document.body.classList.remove('tree-collapsed'); }
        }),
        U.el('span', { class: 'tb-brand-logo', html: LOGO }),
        U.el('span', { class: 'tb-brand-name', text: 'PMHub' }),
        U.el('div', { class: 'tb-project' },
          U.el('button', {
            class: 'tb-proj-btn', title: '项目菜单：返回主页 / 切换项目 / 新建项目',
            onclick: function (e) { if (!window.PRD_MODE) openProjectMenu(e.currentTarget); }
          },
            U.el('span', { class: 'tb-proj-name', text: project.name }),
            U.el('span', { class: 'tb-proj-caret', html: U.ICONS.chevronD })),
          projSub = U.el('div', { class: 'tb-proj-sub' })
        )
      ),
      modeSeg = U.el('div', { class: 'seg' },
        U.el('button', { class: 'seg-btn', 'data-mode': 'proto', text: '原型', title: '只看原型' }),
        U.el('button', { class: 'seg-btn active', 'data-mode': 'req', text: '需求', title: '原型 + 需求 + 连线' }),
        U.el('button', { class: 'seg-btn', 'data-mode': 'read', text: '阅读', title: '只读，点击可双向定位' })
      ),
      U.el('div', { class: 'tb-right' },
        visualEditBtn = U.el('button', { class: 'btn btn-sm', text: '进入编辑态', title: '可视化拖拽编辑当前原型' }),
        exportHtmlBtn = U.el('button', { class: 'btn btn-sm', text: '导出 HTML', title: '下载当前页面原型，可在浏览器中独立打开' }),
        exportPngBtn = U.el('button', { class: 'btn btn-sm', text: '导出 PNG', title: '将当前原型导出为 PNG 图片' }),
        linkModeBtn = U.el('button', { class: 'btn btn-primary btn-sm', html: U.ICONS.link + '<span>连线</span>', title: '进入连线模式：选择元素 → 选择需求 → 建立关联' }),
        lineDisplayBtn = U.el('button', { class: 'btn btn-sm', title: '连线显示控制' }),
        U.el('span', { class: 'tb-sep' }),
        undoBtn = U.el('button', { class: 'icon-btn', title: '撤销（Ctrl+Z）', html: U.ICONS.undo }),
        redoBtn = U.el('button', { class: 'icon-btn', title: '重做（Ctrl+Shift+Z）', html: U.ICONS.redo }),
        saveChip = U.el('button', { class: 'save-chip', title: '点击立即保存' }),
        historyBtn = U.el('button', { class: 'btn btn-sm', html: U.ICONS.clock + '<span>修改记录</span>' }),
        versionBtn = U.el('button', { class: 'btn btn-sm', html: U.ICONS.branch + '<span>版本</span>', title: '版本管理：保存快照 / 对比 Diff / 恢复' }),
        shareBtn = U.el('button', { class: 'btn btn-sm btn-primary', html: U.ICONS.share + '<span>分享</span>', title: '生成分享链接' }),
        accountBtn = Auth.accountButton(),
        settingsBtn = U.el('button', { class: 'icon-btn', title: '设置（署名 / 数据备份 / 关于）', html: U.ICONS.gear, onclick: function () { flushSave(); persistPrototypeNow(); Settings.open(); } }),
        helpBtn = U.el('button', { class: 'icon-btn', title: '快捷键与操作速查（按 ? 随时打开）', html: U.ICONS.help })
      )
    );

    if (window.PRD_MODE) {
      [historyBtn, versionBtn, shareBtn, accountBtn, helpBtn].forEach(function (button) { if (button) button.remove(); });
      var prdUrl = '../PMHub.html?project=' + encodeURIComponent(PRD_MODE.projectId);
      topbar.querySelector('.tb-back').title = '返回当前项目的需求文档';
      topbar.querySelector('.tb-back').onclick = function () { if (flushSave() === false || persistPrototypeNow() === false) return; location.href = prdUrl; };
      topbar.querySelector('.tb-proj-btn').title = '当前 PRD 项目的原型工作区';
      topbar.querySelector('.tb-proj-caret').remove();
      var stopPrdBtn = U.el('button', { class: 'btn btn-sm', text: '停止 AI', disabled: true, onclick: function () { if (PRD_MODE.abort) PRD_MODE.abort.abort(); } });
      topbar.querySelector('.tb-right').prepend(stopPrdBtn);
      var generatePrdBtn = U.el('button', { class: 'btn btn-sm', text: '根据 PRD 生成', onclick: async function () {
        if (!page || PRD_MODE.busy || generatePrdBtn.disabled) return;
        generatePrdBtn.disabled = true;
        try {
          if (!AI.isRemoteReady()) { Settings.openAIConfig(); return; }
          var instruction = await U.prompt({ title: '根据 PRD 生成当前页面', label: '页面要求', placeholder: '例如：移动端首页', okLabel: '生成' });
          if (instruction === null) return;
          var targetId = page.id;
          var originalHtml = page.prototype_content || '';
          generatePrdBtn.disabled = true; generatePrdBtn.textContent = '正在生成…';
          stopPrdBtn.disabled = false;
          var generated = await AI.generate('当前页面：' + page.name + '\n' + (instruction || '根据 PRD 生成此页面'), { currentHtml: originalHtml });
          var result = generated.html;
          if (page.id !== targetId) throw new Error('已切换页面，未应用生成结果');
          if ((page.prototype_content || '') !== originalHtml) throw new Error('生成期间页面已修改，未覆盖，请重试');
          if (!/<\/html>/i.test(result)) throw new Error('返回的原型不完整，请重试');
          if (!confirm('原型草稿已生成，应用到当前页面？当前页面原型将被替换，需求说明会保留。')) return;
          Store.updatePage(page.id, { prototype_content: PRD_MODE.safeHTML(result, false) });
          if (!Store.save()) throw new Error('原型仅在当前页面内，本地保存失败，请导出备份');
          loadPage(Store.getPage(page.id));
          U.toast('原型已应用，可进入画布编辑', 'success');
        } catch (error) { U.toast(error.message || '生成失败，当前页面未替换', 'error'); }
        finally { stopPrdBtn.disabled = true; generatePrdBtn.disabled = false; generatePrdBtn.textContent = '根据 PRD 生成'; }
      }});
      topbar.querySelector('.tb-right').prepend(generatePrdBtn);
      var analyzePrdBtn = U.el('button', { class: 'btn btn-sm', text: 'AI 需求说明与连线', onclick: async function () {
        if (!page || PRD_MODE.busy) return;
        if (!AI.isRemoteReady()) { Settings.openAIConfig(); return; }
        analyzePrdBtn.disabled = true; analyzePrdBtn.textContent = '分析画布中…';
        stopPrdBtn.disabled = false;
        try {
          flushSave();
          editor.setReadonly(true);
          var targetId = page.id;
          var count = await PRD_MODE.analyze(page, protoView);
          if (page.id === targetId) loadPage(Store.getPage(targetId));
          U.toast('已新增 ' + count + ' 条待确认说明并连线，原有说明保留', 'success');
        } catch (error) { U.toast(error.message || '分析失败，未写入', 'error'); }
        finally { stopPrdBtn.disabled = true; editor.setReadonly(mode === 'read' || locked); analyzePrdBtn.disabled = false; analyzePrdBtn.textContent = 'AI 需求说明与连线'; }
      }});
      topbar.querySelector('.tb-right').prepend(analyzePrdBtn);
    }

    /* 面包屑项目菜单：返回主页 / 快速切换项目 / 新建项目。
       多项目评审时不必先回主页再进，一次点击直达（Penpot Dashboard↔Workspace 的轻量替代） */
    function openProjectMenu(anchor) {
      var items = [
        { label: '返回项目列表（主页）', icon: U.ICONS.panelLeft, onClick: function () { navigate('#/'); } }
      ];
      var others = Store.listProjects().filter(function (p) { return p.id !== project.id; });
      if (others.length) {
        items.push('-');
        others.slice(0, 10).forEach(function (p) {
          items.push({ label: p.name, onClick: function () { navigate('#/p/' + p.id); } });
        });
      }
      items.push('-');
      items.push({
        label: '新建项目', icon: U.ICONS.plus, onClick: function () {
          U.prompt({ title: '新建项目', label: '项目名称', placeholder: '例如：官网改版' }).then(function (name) {
            if (name && name.trim()) {
              var p = Store.createProject({ name: name.trim() });
              navigate('#/p/' + p.id);
            }
          });
        }
      });
      U.menu(items, anchor.getBoundingClientRect());
    }

    treeList = U.el('div', { id: 'treeList' });
    treeToggle = U.el('button', { class: 'icon-btn', title: '折叠 / 展开页面树', html: U.ICONS.panelLeft });
    addPageBtn = U.el('button', { id: 'addPageBtn', class: 'tree-add', html: U.ICONS.plus + '<span>新建页面</span>' });

    var tree = U.el('aside', { id: 'tree' },
      U.el('div', { class: 'tree-head' }, U.el('span', { text: '页面' }), treeToggle),
      treeList,
      addPageBtn
    );

    protoEmpty = U.el('div', { id: 'protoEmpty', class: 'panel-empty' },
      U.el('div', { class: 'empty-ico small', html: U.ICONS.doc }),
      U.el('div', { class: 'empty-title', text: '还没有原型' }),
      U.el('div', { class: 'empty-desc', text: window.PRD_MODE ? '根据当前需求生成页面，或导入已有 HTML 后继续编辑。' : '导入 HTML 原型' }),
      U.el('div', { class: 'empty-actions' },
        U.el('button', { class: 'btn btn-sm', text: '导入原型', onclick: function () { openImportDialog(); } })
      )
    );

    if (window.PRD_MODE) protoEmpty.querySelector('.empty-actions').prepend(U.el('button', { class: 'btn btn-primary', text: '根据 PRD 生成', onclick: function () { generatePrdBtn.click(); } }));
    protoPanel = U.el('div', { id: 'protoPanel' }, protoEmpty);
    dragbar = U.el('div', { id: 'dragbar', title: '拖动调整需求栏宽度，双击复位' });
    reqHint = U.el('span', { class: 'panel-hint' });
    editorRoot = U.el('div', { id: 'editorRoot', class: 'editor-root' });
    /* P1 评论：面板头部入口（全部模式可见，分享页也可查看/添加评论） */
    commentBtn = U.el('button', {
      class: 'cmt-panel-btn', title: '查看本页全部评论',
      html: U.ICONS.chat + '<span>评论</span>'
    });
    reqPanel = U.el('div', { id: 'reqPanel' },
      U.el('div', { class: 'panel-head' },
        U.el('div', { class: 'ph-left' },
          U.el('span', { class: 'panel-title', text: '需求说明' }),
          commentBtn
        ),
        reqHint
      ),
      editorRoot
    );

    linkBar = U.el('div', { id: 'linkBar', class: 'link-bar', hidden: true, title: '按住空白处可拖动位置，避免遮挡' },
      U.el('span', { class: 'lb-grip', html: '⠿⠿' }),
      lbTitle = U.el('div', { class: 'lb-title', text: '手动连线' }),
      U.el('div', { class: 'lb-steps' },
        lbStep1 = U.el('div', { class: 'lb-step' },
          U.el('span', { class: 'lb-num', text: '1' }),
          U.el('span', { class: 'lb-label', text: '选择元素' }),
          lbElVal = U.el('span', { class: 'lb-val', text: '点左侧原型元素' })),
        U.el('span', { class: 'lb-arrow', text: '→' }),
        lbStep2 = U.el('div', { class: 'lb-step' },
          U.el('span', { class: 'lb-num', text: '2' }),
          U.el('span', { class: 'lb-label', text: '选择需求' }),
          lbBlkVal = U.el('span', { class: 'lb-val', text: '点右侧需求块' })),
        U.el('span', { class: 'lb-arrow', text: '→' }),
        U.el('div', { class: 'lb-step' },
          U.el('span', { class: 'lb-num', text: '3' }),
          U.el('span', { class: 'lb-label', text: '建立连线' }))
      ),
      lbBind = U.el('button', { class: 'btn btn-primary btn-sm', text: '建立关联' }),
      lbUndoBtn = U.el('button', { class: 'icon-btn lb-hist', title: '撤销连线操作（Ctrl+Z）', html: U.ICONS.undo, onclick: function () { undoLinkOp(); } }),
      lbRedoBtn = U.el('button', { class: 'icon-btn lb-hist', title: '重做连线操作（Ctrl+Shift+Z）', html: U.ICONS.redo, onclick: function () { redoLinkOp(); } }),
      U.el('button', { class: 'btn btn-sm btn-ghost', text: '取消 Esc', onclick: function () { exitLinkMode(); } })
    );

    stage = U.el('div', { id: 'stage' }, protoPanel, dragbar, reqPanel, linkBar);

    /* 连线条拖拽：指针捕获使其可越过 iframe，按住空白处拖到不遮挡的位置 */
    (function () {
      var dragging = false, sx = 0, sy = 0, bx = 0, by = 0;
      function clamp(x, y) {
        var sr = stage.getBoundingClientRect(), br = linkBar.getBoundingClientRect();
        return {
          x: Math.min(Math.max(x, 4), Math.max(sr.width - br.width - 4, 4)),
          y: Math.min(Math.max(y, 4), Math.max(sr.height - br.height - 4, 4))
        };
      }
      linkBar.addEventListener('pointerdown', function (e) {
        if (e.button !== 0 || e.target.closest('button')) return;
        dragging = true; sx = e.clientX; sy = e.clientY;
        var sr = stage.getBoundingClientRect(), br = linkBar.getBoundingClientRect();
        bx = br.left - sr.left; by = br.top - sr.top;
        linkBar.classList.add('dragging');
        try { linkBar.setPointerCapture(e.pointerId); } catch (err) { }
        e.preventDefault();
      });
      linkBar.addEventListener('pointermove', function (e) {
        if (!dragging) return;
        var p = clamp(bx + (e.clientX - sx), by + (e.clientY - sy));
        linkBar.style.transform = 'none';
        linkBar.style.left = p.x + 'px';
        linkBar.style.top = p.y + 'px';
        linkBar.style.bottom = 'auto';
      });
      function end() {
        if (!dragging) return;
        dragging = false;
        linkBar.classList.remove('dragging');
      }
      linkBar.addEventListener('pointerup', end);
      linkBar.addEventListener('pointercancel', end);
      window.addEventListener('resize', function () {
        if (linkBar.hidden || !linkBar.style.left) return;
        var p = clamp(parseFloat(linkBar.style.left) || 0, parseFloat(linkBar.style.top) || 0);
        linkBar.style.left = p.x + 'px';
        linkBar.style.top = p.y + 'px';
      });
    })();

    var noPageEmpty = null;
    if (!page) {
      noPageEmpty = U.el('div', { class: 'stage-empty' },
        U.el('div', { class: 'empty-ico small', html: U.ICONS.doc }),
        U.el('div', { class: 'empty-title', text: '创建第一个页面' }),
        U.el('div', { class: 'empty-desc', text: '每个页面可导入一份独立的 HTML 原型，并各自维护需求说明与连线。' }),
        U.el('div', { class: 'empty-actions' },
          U.el('button', { class: 'btn btn-primary', html: U.ICONS.plus + '<span>新建页面</span>', onclick: function () { addPage(); } })
        )
      );
      stage.append(noPageEmpty);
    }

    var body = U.el('div', { id: 'body' }, tree, stage);

    app.append(topbar, body);

    if (share) {
      document.body.classList.add('share');
      shareBtn.hidden = true;
      settingsBtn.hidden = true; /* 只读访客无需本机设置 */
      if (accountBtn) accountBtn.hidden = true;
      if (locked) {
        modeSeg.style.display = 'none';
        linkModeBtn.hidden = true;
        undoBtn.hidden = true;
        redoBtn.hidden = true;
        saveChip.hidden = true;
        historyBtn.hidden = true;
        versionBtn.hidden = true;
        addPageBtn.style.display = 'none';
        projSub.append(U.el('span', { class: 'ro-badge', text: '仅评审' }));
      } else {
        projSub.append(U.el('span', { class: 'ro-badge', text: '协作编辑' }));
      }
    }

    /* ---------- 组件 ---------- */

    var editor = createBlockEditor(editorRoot, {
      readonly: locked,
      onChange: function () {
        if (locked) return;
        markDirty();
        scheduleSave();
        overlay.requestRedraw();
      },
      onRendered: function () { renderBlockChips(); overlay.requestRedraw(); },
      onBlockClick: onBlockClick,
      onComment: openCommentThread,
      onUndoState: function (s) {
        undoBtn.classList.toggle('disabled', !s.canUndo);
        redoBtn.classList.toggle('disabled', !s.canRedo);
      }
    });
    reqPanel.insertBefore(editor.toolbarEl, editorRoot);

    /* 原型持久化状态：
       protoDirty —— 本页有未落库的 proto-id 写入；
       protoForPageId —— 当前 iframe 内容所属页面，防止防抖回调跨页串写 */
    var protoDirty = false;
    var protoForPageId = null;

    var protoView = createProtoView(protoPanel, {
      onRedraw: function () { overlay.requestRedraw(); },
      onTargetHover: onProtoHover,
      onTargetClick: onProtoClick,
      onFrameReady: function () {
        frameReady = true;
        refreshLinks();
        /* 上一轮保存时丢失的标识，加载后按指纹找回（历史数据也能恢复连线） */
        healElements(false);
        overlay.requestRedraw();
      },
      onPrototypeMutated: function () {
        protoDirty = true;
        schedulePrototypePersist(page ? page.id : null);
      },
      /* 原型自身脚本重渲染了 DOM：先按指纹恢复被重建元素上的标识，
         再重绘连线、选中框跟随元素、缺失提示实时刷新 */
      onDomMutate: function () {
        console.log('[mutate] onDomMutate fired');
        healElements(false);
        overlay.requestRedraw();
        if (linkMode.active && linkMode.protoId) {
          var selEl = protoView.findEl(linkMode.protoId);
          overlay.setSelectedRect(selEl ? elementBoxOf(selEl) : null);
        }
        updateMissingChip();
      }
    });

    var overlay = createOverlay(stage, {
      elementBox: function (pid) {
        var el = protoView.findEl(pid);
        return el ? elementBoxOf(el) : null;
      },
      blockBox: function (bid) {
        var el = editor.getBlockEl(bid);
        return el ? blockBoxOf(el) : null;
      },
      protoViewport: function () { return viewportOf(protoPanel); },
      reqViewport: function () { return viewportOf(reqPanel); },
      elementIndex: function (pid) { return elIndexMap[pid] || 0; }
    }, {
      onLinkHover: function (link) {
        if (link) {
          overlay.setActiveElement(link.prototype_element_id);
          highlightBlocks([link.requirement_block_id], true);
        } else {
          overlay.setActiveElement(null);
          highlightBlocks(null);
        }
      },
      onLinkClick: showLinkPopover
    });

    /* ---------- 几何 ---------- */

    function elementBoxOf(el) {
      try {
        var fr = protoView.frame.getBoundingClientRect();
        var r = el.getBoundingClientRect();
        var s = stage.getBoundingClientRect();
        return { x: fr.left - s.left + r.left, y: fr.top - s.top + r.top, w: r.width, h: r.height };
      } catch (e) { return null; }
    }
    function blockBoxOf(el) {
      var s = stage.getBoundingClientRect();
      var r = el.getBoundingClientRect();
      return { x: r.left - s.left, y: r.top - s.top, w: r.width, h: r.height };
    }
    function viewportOf(panelEl) {
      var s = stage.getBoundingClientRect();
      var r = panelEl.getBoundingClientRect();
      return { left: r.left - s.left, top: r.top - s.top, right: r.right - s.left, bottom: r.bottom - s.top };
    }

    /* ---------- 保存 ---------- */

    function previewOf(b) {
      var c = b.content;
      if (b.type === 'ul' || b.type === 'ol') return (c || []).map(U.stripHtml).join('\n');
      if (b.type === 'checklist') return (c || []).map(function (i) { return (i.checked ? '[已完成] ' : '[ ] ') + U.stripHtml(i.html); }).join('\n');
      if (b.type === 'code') return String(c || '');
      if (b.type === 'table') {
        var rows = (c && c.rows ? c.rows : []).map(function (r) { return r.map(U.stripHtml).join(' | '); });
        if (c && c.header) rows.unshift(c.header.map(U.stripHtml).join(' | '));
        return rows.join('\n');
      }
      if (b.type === 'divider') return '——— 分割线 ———';
      return U.stripHtml(String(c || ''));
    }

    function markDirty() { dirty = true; setSaveStatus('editing'); }

    function setSaveStatus(st, at) {
      if (!saveChip) return;
      if (st === 'editing') {
        saveChip.textContent = '编辑中…';
        saveChip.title = '有未保存的修改 · 点击立即保存';
        saveChip.classList.add('editing');
      } else if (st === 'error') {
        dirty = true;
        saveChip.textContent = '未保存 · 点击重试';
        saveChip.title = '保存失败，请先导出备份或释放浏览器存储空间';
        saveChip.classList.add('editing');
      } else {
        /* 顶栏文案固定为「已保存」，避免时间变化导致顶栏宽度抖动；
           具体保存时间收进 title，悬停可见 */
        lastSavedAt = at || Date.now();
        saveChip.textContent = '已保存';
        saveChip.title = '已保存于 ' + U.fmtDTS(lastSavedAt) + ' · 点击立即保存';
        saveChip.classList.remove('editing');
        dirty = false;
      }
    }

    function flushSave() {
      if (!page || !doc || locked) return;
      var cur = editor.getBlocks();
      var oldMap = {};
      savedBlocks.forEach(function (b) { oldMap[b.id] = b; });
      var curIds = {};
      var records = [];
      cur.forEach(function (b) {
        curIds[b.id] = 1;
        var o = oldMap[b.id];
        if (!o) records.push({ block_id: b.id, old_content: null, new_content: previewOf(b) });
        else if (JSON.stringify(o.content) !== JSON.stringify(b.content)) {
          records.push({ block_id: b.id, old_content: previewOf(o), new_content: previewOf(b) });
        }
      });
      var removed = [];
      savedBlocks.forEach(function (o) { if (!curIds[o.id]) removed.push(o); });
      removed.forEach(function (o) { records.push({ block_id: o.id, old_content: previewOf(o), new_content: null }); });

      if (records.length) {
        Store.replaceBlocks(doc.id, cur);
        records.forEach(function (r) {
          Store.addChange({ project_id: project.id, page_id: page.id, block_id: r.block_id, old_content: r.old_content, new_content: r.new_content });
        });
        var removedLinks = 0;
        var removedComments = 0;
        removed.forEach(function (o) {
          Store.linksForBlock(o.id).forEach(function (l) { Store.removeLink(l.id); removedLinks++; });
          removedComments += Store.removeCommentsOfBlock(o.id);
        });
        savedBlocks = U.deepCopy(cur);
        if (removedLinks) U.toast('已移除 ' + removedLinks + ' 条失效关联', 'info');
        if (removedComments) U.toast('已清理 ' + removedComments + ' 条块评论', 'info');
        refreshLinks();
      } else {
        savedBlocks = U.deepCopy(cur);
      }
      if (Store.save() === false) { setSaveStatus('error'); return false; }
      setSaveStatus('saved');
      return true;
    }

    var scheduleSave = U.debounce(flushSave, 1000);
    flushSaveRef = flushSave;

    /* ---------- 原型内容持久化（proto-id 写入后保存） ----------
       修复：保存回调使用「写入时刻的页面 ID」参数，且校验 iframe 仍属于该页。
       此前回调直接读可变的 page 变量——连线后 600ms 内切换页面会导致
       旧页 DOM 被写进新页（跨页污染），或新写入的元素 ID 彻底丢失，
       返回原页面时连线因元素缺失而消失。 */
    function persistPrototype(targetId) {
      /* 保存前先按指纹治愈：原型脚本切走视图 / 暂时移除的元素，
         会在视图回来时自动恢复，不应被当作「丢失」写入警告 */
      healElements(true);
      var before = (page && page.id === targetId) ? (page.prototype_content || '') : '';
      var html = protoView.serialize();
      /* 检测「保存前存在、保存后消失」的连线元素 ID：原型脚本重建了对应区域。
         已记录指纹的元素交给自动恢复（元素重新出现时按指纹打回标识），
         无指纹的旧数据才提示手动重绑 */
      var lost = Store.getLinks(targetId).filter(function (l) {
        if (html.indexOf(l.prototype_element_id) >= 0) return false;
        if (before.indexOf(l.prototype_element_id) < 0) return false;
        var meta = Store.getElement(targetId, l.prototype_element_id);
        return !(meta && meta.fingerprint && meta.fingerprint.tag);
      });
      Store.updatePage(targetId, { prototype_content: html });
      if (Store.save() === false) { protoDirty = true; setSaveStatus('error'); return false; }
      protoDirty = false;
      if (lost.length) {
        U.toast('原型更新导致 ' + lost.length + ' 个已连线元素丢失标识，点击顶部「关联元素缺失」可重新绑定', 'warn', 5000);
        updateMissingChip();
      }
      return true;
    }

    /* ---------- 元素标识自动恢复（指纹治愈） ----------
       场景：原型自身脚本重渲染 DOM（切标签 / 返回上一视图 / 列表刷新），
       重建出的节点不再携带 data-proto-id，连线随之消失。
       策略：注册元素时记录指纹（tag + class + 文本，见 proto.fingerprintOf）；
       DOM 变化 / iframe 就绪后，对缺失的 proto-id 按指纹找回等价元素并重新
       打标。唯一匹配才自动恢复——多个候选（如同文本的重复行）或无指纹的
       旧数据保持缺失，走顶部「关联元素缺失」手动重绑，避免绑错元素。 */
    var lastHealToastAt = 0;

    function healElements(silent) {
      if (!frameReady || !page || protoForPageId !== page.id) return 0;
      var doc = protoView.doc();
      if (!doc || !doc.documentElement) return 0;
      console.log('[heal] start silent=' + silent);
      var linked = {};
      links.forEach(function (l) { linked[l.prototype_element_id] = 1; });
      var healedLinked = 0;
      Store.getElements(page.id).forEach(function (meta) {
        var pid = meta.proto_element_id;
        if (!pid || protoView.findEl(pid)) return;   /* 元素还在，无需恢复 */
        var fp = meta.fingerprint;
        if (!fp || !fp.tag) { console.log('[heal] skip-no-fp ' + pid); return; }
        var match = matchFingerprint(doc, fp);
        if (!match) { console.log('[heal] no-match ' + pid); return; }
        try { match.setAttribute('data-proto-id', pid); } catch (e) { return; }
        console.log('[heal] restored ' + pid + ' linked=' + (!!linked[pid]) + ' linksLen=' + links.length);
        if (linked[pid]) healedLinked++;
      });
      if (healedLinked) {
        console.log('[heal] healedLinked=' + healedLinked + ' sinceLastToast=' + (Date.now() - lastHealToastAt));
        overlay.requestRedraw();
        updateMissingChip();
        /* 治愈结果写回 DOM 后落库，刷新 / 重新进入页面时连线直接可用 */
        if (!locked && !silent) {
          protoDirty = true;
          schedulePrototypePersist(page.id);
        }
        /* 恢复提示节流：连续重渲染（轮播 / 筛选）时不刷屏 */
        if (!silent && Date.now() - lastHealToastAt > 3000) {
          console.log('[heal] TOAST fired');
          lastHealToastAt = Date.now();
          U.toast('原型刷新后已自动恢复 ' + healedLinked + ' 条连线的元素标识', 'success', 3000);
        }
      }
      return healedLinked;
    }

    /* 在当前 DOM 中按指纹查找等价元素：tag + class 全等、文本全等（无文本指纹
       则要求候选也无文本），且未被其他 proto-id 占用；候选唯一才返回 */
    function matchFingerprint(doc, fp) {
      var nodes;
      try { nodes = doc.querySelectorAll(fp.tag); } catch (e) { return null; }
      var hit = null, count = 0;
      for (var i = 0; i < nodes.length; i++) {
        var el = nodes[i];
        if (el.nodeType !== 1 || el.getAttribute('data-proto-id')) continue;
        var cls = (el.getAttribute('class') || '').trim();
        if (cls) cls = cls.split(/\s+/).sort().join(' ');
        if (cls !== (fp.cls || '')) continue;
        var text = '';
        try {
          text = (el.innerText || el.getAttribute('placeholder') || el.getAttribute('title') || '').trim();
        } catch (e2) { text = ''; }
        text = text.replace(/\s+/g, ' ').slice(0, 80);
        if (fp.text ? text !== fp.text : text) continue;
        count++;
        if (!hit) hit = el;
      }
      return count === 1 ? hit : null;
    }

    var schedulePrototypePersist = U.debounce(function (targetId) {
      if (locked || !targetId) return;
      if (protoForPageId !== targetId) { protoDirty = false; return; }  // iframe 已不属于该页，放弃保存
      persistPrototype(targetId);
    }, 600);

    /* 切页 / 卸载前立即落库（此时 page 仍是旧页，iframe 内容也仍是旧页的） */
    function persistPrototypeNow() {
      schedulePrototypePersist.cancel();
      if (!protoDirty || !page || locked) return;
      if (protoForPageId !== page.id) { protoDirty = false; return; }
      return persistPrototype(page.id);
    }
    persistPrototypeNowRef = persistPrototypeNow;

    /* ---------- 连线数据 ---------- */

    /* 按连线首次出现顺序为元素编号（1 起）。编号只依赖 links 数据，
       与 DOM 恢复状态无关，因此元素指纹治愈 / 原型重渲染都不会改变编号，
       卡片 chip 与原型圆点的对应关系保持稳定。 */
    function rebuildElementIndex() {
      elIndexMap = {};
      var n = 0;
      links.forEach(function (l) {
        var pid = l.prototype_element_id;
        if (!(pid in elIndexMap)) elIndexMap[pid] = ++n;
      });
    }

    function elementNameOf(pid) {
      var meta = page ? Store.getElement(page.id, pid) : null;
      if (meta && meta.element_name) return meta.element_name;
      var el = protoView.findEl(pid);
      if (el) {
        try { return protoView.elementLabel(el).name || '元素'; } catch (e) { return '元素'; }
      }
      return '元素';
    }

    /* 卡片关联徽标：在每个已连线块顶部渲染元素 chips（编号 + 元素名）。
       - 编号与原型侧 elnum 圆点对应；元素缺失时降级琥珀色 miss 态
         （miss 状态由 updateMissingChip 的延迟校准统一维护，避免误报）。
       - 悬停 chip 高亮原型元素框；点击 chip 定位元素（缺失时打开失效处理）。
       - 幂等：先清空再重建，块增删 / 撤销重做后由 onRendered 重新调用。 */
    function renderBlockChips() {
      editorRoot.querySelectorAll('.blk-links').forEach(function (n) { n.remove(); });
      if (!links.length) return;
      var byBlock = {};
      links.forEach(function (l) {
        (byBlock[l.requirement_block_id] || (byBlock[l.requirement_block_id] = [])).push(l);
      });
      Object.keys(byBlock).forEach(function (bid) {
        var wrap = editor.getBlockEl(bid);
        if (!wrap) return;
        var bar = U.el('div', { class: 'blk-links' });
        byBlock[bid].forEach(function (l) {
          var pid = l.prototype_element_id;
          var miss = frameReady && !protoView.findEl(pid);
          var chip = U.el('button', {
            class: 'el-chip' + (miss ? ' miss' : ''),
            type: 'button',
            'data-pid': pid,
            title: miss ? '原型元素暂不可见，点击处理失效关联' : '点击定位原型元素',
            onclick: function (e) {
              e.stopPropagation();
              var el = protoView.findEl(pid);
              if (!el) { openMissingLinks(); return; }
              var ls = links.filter(function (l2) { return l2.prototype_element_id === pid; });
              if (ls.length) locateElement(ls);
            },
            onmouseenter: function () {
              if (linkMode.active || mode === 'proto') return;
              overlay.setActiveElement(protoView.findEl(pid) ? pid : null);
            },
            onmouseleave: function () { overlay.setActiveElement(null); }
          });
          chip.append(
            U.el('i', { class: 'el-num', text: String(elIndexMap[pid] || '') }),
            U.el('span', { text: elementNameOf(pid) })
          );
          bar.append(chip);
        });
        wrap.prepend(bar);   /* gutter / cmt-btn 均为绝对定位，文档流首子元素即徽标行 */
      });
    }

    function refreshLinks() {
      links = page ? Store.getLinks(page.id) : [];
      rebuildElementIndex();
      overlay.setLinks(links);
      editorRoot.querySelectorAll('.blk.has-links').forEach(function (el) { el.classList.remove('has-links'); });
      links.forEach(function (l) {
        var el = editor.getBlockEl(l.requirement_block_id);
        if (el) el.classList.add('has-links');
      });
      renderBlockChips();
      overlay.requestRedraw();   /* 徽标行改变块高度，连线锚点需重算 */
      updateMissingChip();
      refreshComments();
    }

    /* ---------- 评论（P1） ---------- */

    var pageComments = [];

    function refreshComments() {
      pageComments = page ? Store.getComments(page.id) : [];
      editorRoot.querySelectorAll('.blk.has-comments, .blk.cmt-resolved').forEach(function (el) {
        el.classList.remove('has-comments');
        el.classList.remove('cmt-resolved');
        var b = el.querySelector('.cmt-btn');
        if (b) b.removeAttribute('data-count');
      });
      /* 按块聚合：总数 / 未解决数，驱动气泡徽标 */
      var agg = {};
      pageComments.forEach(function (c) {
        var m = agg[c.block_id] || (agg[c.block_id] = { total: 0, open: 0 });
        m.total++;
        if (!c.resolved) m.open++;
      });
      Object.keys(agg).forEach(function (bid) {
        var el = editor.getBlockEl(bid);
        if (!el) return;
        el.classList.add('has-comments');
        var btn = el.querySelector('.cmt-btn');
        if (agg[bid].open > 0) {
          if (btn) btn.setAttribute('data-count', String(agg[bid].open));
        } else {
          el.classList.add('cmt-resolved');   /* 有评论但全部已解决：绿色 ✓ */
        }
      });
      updateCommentBtnBadge();
    }

    function updateCommentBtnBadge() {
      if (!commentBtn) return;
      var n = pageComments.filter(function (c) { return !c.resolved; }).length;
      var b = commentBtn.querySelector('.cmt-badge');
      if (n > 0) {
        if (!b) { b = U.el('span', { class: 'cmt-badge' }); commentBtn.append(b); }
        b.textContent = n > 99 ? '99+' : String(n);
      } else if (b) b.remove();
    }

    /* 署名统一走 Settings（同一 localStorage 键，设置中心与本处共用单一数据源） */
    function getAuthor() { return Settings.getAuthor(); }
    function setAuthor(n) { Settings.setAuthor(n); }

    function fmtCmtTime(ts) { return U.fmtDTS(ts); }

    /* 块级评论浮层：查看 / 发表 / 回复 / 解决 / 删除 */
    function openCommentThread(blockId, anchorBtn) {
      if (!page) return;
      var wrap = editor.getBlockEl(blockId);
      var anchorRect = (anchorBtn || wrap).getBoundingClientRect();

      var list = U.el('div', { class: 'cmt-list' });

      function renderThread(c) {
        var thread = U.el('div', { class: 'cmt-thread' + (c.resolved ? ' resolved' : '') });
        thread.append(U.el('div', { class: 'cmt-head' },
          U.el('span', { class: 'cmt-author', text: c.author }),
          U.el('span', { class: 'cmt-time', text: fmtCmtTime(c.created_at) }),
          U.el('span', { class: 'cmt-spacer' }),
          U.el('button', {
            class: 'cmt-act', text: c.resolved ? '重新打开' : '标记解决', title: '切换解决状态',
            onclick: function () {
              Store.setCommentResolved(c.id, !c.resolved);
              renderList(); refreshComments();
            }
          }),
          U.el('button', {
            class: 'cmt-act danger', text: '删除', title: '删除这条评论及其全部回复',
            onclick: async function () {
              var ok = await U.confirm('删除这条评论及其回复？', { danger: true, okLabel: '删除' });
              if (!ok) return;
              Store.deleteComment(c.id);
              renderList(); refreshComments();
            }
          })
        ));
        thread.append(U.el('div', { class: 'cmt-body', text: c.body }));
        (c.replies || []).forEach(function (r) {
          thread.append(U.el('div', { class: 'cmt-reply' },
            U.el('span', { class: 'cmt-author', text: r.author }),
            U.el('span', { class: 'cmt-time', text: fmtCmtTime(r.created_at) }),
            U.el('div', { class: 'cmt-body', text: r.body })
          ));
        });
        /* 回复 */
        var rta = U.el('textarea', { class: 'input cmt-ta', rows: '2', placeholder: '回复…（Ctrl+Enter 发送）' });
        var rbtn = U.el('button', { class: 'btn btn-sm btn-primary', text: '回复' });
        function sendReply() {
          if (!rta.value.trim()) return;
          Store.replyComment(c.id, { body: rta.value, author: getAuthor() });
          renderList(); refreshComments();
        }
        rbtn.addEventListener('click', sendReply);
        rta.addEventListener('keydown', function (e) {
          if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); sendReply(); }
        });
        thread.append(U.el('div', { class: 'cmt-compose' }, rta, rbtn));
        return thread;
      }

      function renderList() {
        list.innerHTML = '';
        var cs = Store.commentsForBlock(blockId);
        if (!cs.length) {
          list.append(U.el('div', { class: 'cmt-empty', text: '还没有评论，点击下方输入框发表第一条。' }));
          return;
        }
        cs.forEach(function (c) { list.append(renderThread(c)); });
      }
      renderList();

      /* 新评论 */
      var nta = U.el('textarea', { class: 'input cmt-ta', rows: '2', placeholder: '添加评论…（Ctrl+Enter 发送）' });
      var nbtn = U.el('button', { class: 'btn btn-sm btn-primary', text: '发送' });
      var nameInput = U.el('input', { class: 'input cmt-name', placeholder: '你的名字', maxlength: '24', value: getAuthor(), title: '署名（保存在本浏览器）' });
      nameInput.addEventListener('change', function () { setAuthor(nameInput.value); });
      function sendNew() {
        var body = nta.value.trim();
        if (!body) { U.toast('请输入评论内容', 'warn'); return; }
        setAuthor(nameInput.value);
        Store.addComment({ page_id: page.id, block_id: blockId, body: body, author: nameInput.value });
        nta.value = '';
        renderList(); refreshComments();
      }
      nbtn.addEventListener('click', sendNew);
      nta.addEventListener('keydown', function (e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); sendNew(); }
      });

      U.popover(anchorRect, U.el('div', { class: 'cmt-pop' },
        U.el('div', { class: 'cmt-pop-title', text: '需求块评论' }),
        list,
        U.el('div', { class: 'cmt-new' },
          nta,
          U.el('div', { class: 'cmt-new-row' }, nameInput, U.el('span', { class: 'cmt-spacer' }), nbtn)
        )
      ), { className: 'cmt-pop-wrap' });
      setTimeout(function () { nta.focus(); }, 30);
    }

    /* 本页全部评论列表（面板头部入口） */
    function openCommentsPanel() {
      if (!page) { U.toast('请先创建页面', 'warn'); return; }
      var cs = Store.getComments(page.id);
      var list = U.el('div', { class: 'cmt-all-list' });
      if (!cs.length) {
        list.append(U.el('div', { class: 'cmt-empty', text: '暂无评论。悬停右侧需求块，点击气泡图标即可针对该块评论。' }));
      } else {
        cs.forEach(function (c) {
          var prev = editor.blockPreview(c.block_id) || '（需求块已被删除）';
          var row = U.el('div', { class: 'cmt-all-item' + (c.resolved ? ' resolved' : '') });
          row.append(U.el('div', { class: 'cmt-all-meta' },
            U.el('span', { class: 'cmt-author', text: c.author }),
            U.el('span', { class: 'cmt-time', text: fmtCmtTime(c.created_at) }),
            U.el('span', { class: 'cmt-spacer' }),
            (c.replies && c.replies.length) ? U.el('span', { class: 'cmt-reply-tag', text: c.replies.length + ' 回复' }) : null,
            c.resolved ? U.el('span', { class: 'cmt-res-tag', text: '已解决' }) : null
          ));
          row.append(U.el('div', { class: 'cmt-body', text: c.body }));
          row.append(U.el('div', { class: 'cmt-all-ctx' },
            U.el('span', { class: 'cmt-ctx-text', text: '评论于：' + prev }),
            U.el('span', { class: 'cmt-spacer' }),
            U.el('button', {
              class: 'btn btn-sm', text: '定位 / 回复', title: '滚动到该需求块并打开评论',
              onclick: function () {
                m.close();
                var el = editor.getBlockEl(c.block_id);
                if (!el) { U.toast('该需求块已被删除', 'warn'); return; }
                editor.scrollBlockIntoView(c.block_id);
                editor.flashBlock(c.block_id);
                setTimeout(function () {
                  openCommentThread(c.block_id, el.querySelector('.cmt-btn'));
                }, 350);
              }
            })
          ));
          list.append(row);
        });
      }
      var m = U.modal({ title: '评论 · ' + page.name, body: list, wide: true, actions: [{ label: '关闭', kind: 'primary' }] });
    }

    /* 失效关联校准（顶栏提示 chip 已按需求移除）：延迟 400ms 判定，
       只校准需求卡片上元素徽标的 miss 状态（琥珀色 / 提示文案）。
       iframe 内脚本渲染 / 指纹治愈存在时间差，立即判定会把「正在恢复」
       误报为「缺失」。点击 miss 徽标仍可打开失效处理弹窗。 */
    var missingChipTimer = null;
    function updateMissingChip() {
      clearTimeout(missingChipTimer);
      if (!frameReady || !page) return;
      missingChipTimer = setTimeout(function () {
        var missingSet = {};
        links.forEach(function (l) {
          if (!protoView.findEl(l.prototype_element_id)) missingSet[l.prototype_element_id] = true;
        });
        /* 同步卡片 chips 的缺失态：元素恢复 / 丢失时 chip 颜色与提示一起校准 */
        editorRoot.querySelectorAll('.el-chip').forEach(function (chip) {
          var pid = chip.getAttribute('data-pid');
          var miss = !!missingSet[pid];
          chip.classList.toggle('miss', miss);
          chip.title = miss ? '原型元素暂不可见，点击处理失效关联' : '点击定位原型元素';
        });
      }, 400);
    }

    /* 失效关联处理：元素不在当前原型中（原型脚本重建了区域 / 原型被重新导入）。
       连线数据仍保留，可重新绑定到新元素，或删除失效关联。 */
    function openMissingLinks() {
      var miss = links.filter(function (l) { return !protoView.findEl(l.prototype_element_id); });
      if (!miss.length) {
        U.toast('当前没有失效关联');
        return;
      }
      var m = null;
      function remainingMiss() {
        return links.filter(function (l) { return !protoView.findEl(l.prototype_element_id); });
      }
      var list = U.el('div', { class: 'miss-list' });
      miss.forEach(function (l) {
        var meta = Store.getElement(page.id, l.prototype_element_id);
        var blkTxt = editor.blockPreview(l.requirement_block_id) || '（空需求块）';
        var row = U.el('div', { class: 'miss-row' },
          U.el('div', { class: 'miss-info' },
            U.el('div', { class: 'miss-el', text: (meta ? meta.element_name : '未知元素') }),
            U.el('div', { class: 'miss-blk', text: '↳ ' + blkTxt })
          ),
          U.el('div', { class: 'miss-acts' },
            U.el('button', {
              class: 'btn btn-sm', text: '重新绑定', title: '进入连线模式，点击新的原型元素完成绑定',
              onclick: function () {
                if (m) m.close();
                enterLinkMode({ rebindLinkId: l.id });
                U.toast('重新绑定：点击左侧原型中新的元素', 'info');
              }
            }),
            U.el('button', {
              class: 'btn btn-sm btn-danger-ghost', text: '删除',
              onclick: function () {
                (function (snap) {
                  recordLinkAction('删除失效关联',
                    function () { Store.restoreLink(snap); },
                    function () { Store.removeLink(snap.id); });
                })(U.deepCopy(l));
                Store.removeLink(l.id);
                Store.save();
                refreshLinks();
                row.remove();
                U.toast('已删除失效关联（Ctrl+Z 可撤销）', 'success');
                if (!remainingMiss().length && m) m.close();
              }
            })
          )
        );
        list.append(row);
      });
      m = U.modal({
        title: miss.length + ' 条关联元素缺失',
        body: U.el('div', {},
          U.el('div', { class: 'miss-tip', text: '这些关联的元素当前不在原型中。已记录指纹的元素会在重新出现时自动恢复连线；以下为无法自动匹配的关联（区域被重建 / 原型被重新导入），可手动重新绑定到新元素，或删除失效关联。' }),
          list),
        actions: [{ label: '关闭', kind: 'primary' }]
      });
    }

    function highlightBlocks(ids, on) {
      editorRoot.querySelectorAll('.blk.linked-hover').forEach(function (el) { el.classList.remove('linked-hover'); });
      if (!ids) return;
      ids.forEach(function (bid) {
        var el = editor.getBlockEl(bid);
        if (el) el.classList.add('linked-hover');
      });
    }

    /* ---------- 页面加载 / 页面树 ---------- */

    function updateTopbarSub() {
      projSub.textContent = '';
      if (page) projSub.append(document.createTextNode(page.name));
      if (locked && !projSub.querySelector('.ro-badge')) projSub.append(U.el('span', { class: 'ro-badge', text: '仅评审' }));
    }

    function renderTree() {
      treeList.innerHTML = '';
      var ps = Store.listPages(project.id);
      ps.forEach(function (p, i) {
        var actions = U.el('div', { class: 'ti-actions' });
        if (!locked) {
          actions.append(
            U.el('button', { class: 'icon-btn', title: '上移', html: U.ICONS.up, onclick: function (e) { e.stopPropagation(); Store.movePage(p.id, -1); renderTree(); } }),
            U.el('button', { class: 'icon-btn', title: '下移', html: U.ICONS.down, onclick: function (e) { e.stopPropagation(); Store.movePage(p.id, 1); renderTree(); } }),
            U.el('button', {
              class: 'icon-btn', title: '重命名', html: U.ICONS.pen, onclick: async function (e) {
                e.stopPropagation();
                var name = await U.prompt({ title: '重命名页面', label: '页面名称', value: p.name });
                if (name && name.trim()) { Store.updatePage(p.id, { name: name.trim() }); Store.save(); renderTree(); updateTopbarSub(); }
              }
            }),
            U.el('button', {
              class: 'icon-btn ti-del', title: '删除页面', html: U.ICONS.trash, onclick: async function (e) {
                e.stopPropagation();
                var ok = await U.confirm('删除页面「' + p.name + '」及其需求文档、元素关联与修改记录？', { danger: true, okLabel: '删除' });
                if (!ok) return;
                Store.deletePage(p.id);
                U.toast('页面已删除', 'success');
                var rest = Store.listPages(project.id);
                if (page && p.id === page.id) {
                  page = null;
                  navigate(rest.length ? '#/p/' + project.id + '/' + rest[0].id : '#/p/' + project.id);
                } else renderTree();
              }
            })
          );
        }
        var item = U.el('div', { class: 'tree-item' + (page && p.id === page.id ? ' active' : '') },
          U.el('span', { class: 'ti-name', text: p.name }), actions);
        item.addEventListener('click', function () {
          if (!page || p.id !== page.id) navigate('#/p/' + project.id + '/' + p.id);
        });
        treeList.append(item);
      });
      if (!ps.length) treeList.append(U.el('div', { class: 'tree-empty', text: '还没有页面' }));
    }

    async function addPage() {
      var name = await U.prompt({ title: '新建页面', label: '页面名称', placeholder: '例如：用户管理', okLabel: '创建' });
      if (!name || !name.trim()) return;
      var p = Store.createPage({ project_id: project.id, name: name.trim() });
      U.toast('页面已创建，请导入 HTML 原型', 'success');
      navigate('#/p/' + project.id + '/' + p.id);
    }

    function loadPage(p) {
      /* 关键顺序：先把旧页面的原型改动（新写入的元素 ID）落库，再切换 page —— 
         否则防抖中的保存会读到新 page，旧页面的元素 ID 永远不会持久化 */
      persistPrototypeNow();
      flushSave();
      clearLinkHistory();
      frameReady = false;
      page = p;
      doc = Store.getDocByPage(page.id, true);
      savedBlocks = Store.getBlocks(doc.id).map(function (b) {
        return { id: b.id, type: b.block_type, content: b.content };
      });
      editor.setBlocks(savedBlocks);
      updateTopbarSub();
      renderTree();
      protoEmpty.style.display = page.prototype_content ? 'none' : 'flex';
      visualEditBtn.disabled = !page.prototype_content;
      exportPngBtn.disabled = !page.prototype_content;
      exportHtmlBtn.disabled = !page.prototype_content;
      protoForPageId = page.id;
      protoView.load(page.prototype_content || '');
      refreshLinks();
      overlay.requestRedraw();
      /* 悬停时间取已落库的真实保存时刻（需求 / 原型较新者），而非加载时刻 */
      setSaveStatus('saved', Math.max(doc.updated_at || 0, page.updated_at || 0));
    }

    /* ---------- 模式 ---------- */

    function setMode(m) {
      mode = m;
      document.body.classList.toggle('mode-proto', m === 'proto');
      document.body.classList.toggle('mode-read', m === 'read');
      modeSeg.querySelectorAll('.seg-btn').forEach(function (b) {
        b.classList.toggle('active', b.getAttribute('data-mode') === m);
      });
      if (!share) { try { localStorage.setItem(MODE_KEY, m); } catch (e) { /* ignore */ } }
      overlay.setVisible(m !== 'proto');
      editor.setReadonly(m === 'read' || locked);
      reqHint.textContent = (m === 'read' || locked)
        ? '只读 · 点击需求定位原型元素'
        : '停止输入约 1 秒后自动保存';
      linkModeBtn.hidden = !(m === 'req' && !locked);
      visualEditBtn.hidden = !!locked;
      exportPngBtn.hidden = !!locked;
      exportHtmlBtn.hidden = !!locked;
      visualEditBtn.disabled = !page || !page.prototype_content;
      exportPngBtn.disabled = !page || !page.prototype_content;
      exportHtmlBtn.disabled = !page || !page.prototype_content;
      if (m !== 'req') exitLinkMode();
      if (m === 'proto') overlay.clearTemp();
      overlay.requestRedraw();
    }

    modeSeg.addEventListener('click', function (e) {
      var btn = e.target.closest('.seg-btn');
      if (!btn || locked) return;
      setMode(btn.getAttribute('data-mode'));
    });

    /* ---------- 连线模式 ---------- */

    function clearBlockSelection() {
      editorRoot.querySelectorAll('.blk.selected').forEach(function (el) { el.classList.remove('selected'); });
    }

    /* ---------- 连线操作历史（撤销 / 重做） ---------- */

    function updateLinkHistoryUI() {
      if (!lbUndoBtn || !lbRedoBtn) return;
      lbUndoBtn.classList.toggle('disabled', !linkUndoStack.length);
      lbRedoBtn.classList.toggle('disabled', !linkRedoStack.length);
      var lastUndo = linkUndoStack[linkUndoStack.length - 1];
      var lastRedo = linkRedoStack[linkRedoStack.length - 1];
      lbUndoBtn.title = lastUndo ? '撤销连线操作（Ctrl+Z）：' + lastUndo.label : '暂无可撤销的连线操作';
      lbRedoBtn.title = lastRedo ? '重做连线操作（Ctrl+Shift+Z）：' + lastRedo.label : '暂无可重做的连线操作';
    }

    function recordLinkAction(label, undoFn, redoFn) {
      linkUndoStack.push({ label: label, undo: undoFn, redo: redoFn });
      linkRedoStack.length = 0;
      updateLinkHistoryUI();
    }

    function clearLinkHistory() {
      linkUndoStack.length = 0;
      linkRedoStack.length = 0;
      updateLinkHistoryUI();
    }

    function undoLinkOp() {
      if (locked) return false;
      var a = linkUndoStack.pop();
      if (!a) return false;
      try { a.undo(); } catch (err) { console.warn('[link-undo]', err); }
      linkRedoStack.push(a);
      Store.save();
      refreshLinks();
      updateLinkHistoryUI();
      U.toast('已撤销 · ' + a.label, 'info');
      return true;
    }

    function redoLinkOp() {
      if (locked) return false;
      var a = linkRedoStack.pop();
      if (!a) return false;
      try { a.redo(); } catch (err) { console.warn('[link-redo]', err); }
      linkUndoStack.push(a);
      Store.save();
      refreshLinks();
      updateLinkHistoryUI();
      U.toast('已重做 · ' + a.label, 'info');
      return true;
    }

    function updateLinkBar() {
      lbStep1.classList.toggle('done', !!linkMode.protoId);
      if (linkMode.protoId) {
        var meta = Store.getElement(page.id, linkMode.protoId);
        lbElVal.textContent = (meta ? meta.element_name : '元素') + ' · ' + linkMode.protoId;
      } else lbElVal.textContent = '点左侧原型元素';
      lbStep2.classList.toggle('done', !!linkMode.blockId);
      lbBlkVal.textContent = linkMode.blockId
        ? (editor.blockPreview(linkMode.blockId) || '（空需求块）')
        : '点右侧需求块';
      lbBind.disabled = !(linkMode.protoId && linkMode.blockId);
      lbTitle.textContent = linkMode.rebindLinkId ? '重新绑定 · 点击新的原型元素' : '手动连线';
    }

    function enterLinkMode(opts) {
      opts = opts || {};
      if (locked) return;
      if (mode !== 'req') setMode('req');
      exitLinkMode();
      linkMode = { active: true, protoId: opts.protoId || null, blockId: opts.blockId || null, rebindLinkId: opts.rebindLinkId || null };
      document.body.classList.add('link-mode');
      editorRoot.classList.add('link-selecting');
      editor.setReadonly(true);
      if (linkMode.blockId) {
        var el = editor.getBlockEl(linkMode.blockId);
        if (el) el.classList.add('selected');
      }
      linkBar.hidden = false;
      updateLinkBar();
    }

    function exitLinkMode() {
      if (!linkMode.active && !document.body.classList.contains('link-mode')) return;
      linkMode = { active: false, protoId: null, blockId: null, rebindLinkId: null };
      document.body.classList.remove('link-mode');
      editorRoot.classList.remove('link-selecting');
      if (mode === 'req' && !locked) editor.setReadonly(false);
      overlay.setHoverRect(null);
      overlay.setSelectedRect(null);
      clearBlockSelection();
      linkBar.hidden = true;
    }

    linkModeBtn.addEventListener('click', function () {
      if (linkMode.active) exitLinkMode();
      else enterLinkMode();
    });

    visualEditBtn.addEventListener('click', openVisualEditorMode);
    exportPngBtn.addEventListener('click', exportPrototypePng);
    exportHtmlBtn.addEventListener('click', exportPrototypeHtml);

    lbBind.addEventListener('click', function () {
      if (!linkMode.protoId || !linkMode.blockId || !page) return;
      if (linkMode.rebindLinkId) {
        var rbLink = Store.getLink(linkMode.rebindLinkId);
        var oldProtoId = rbLink ? rbLink.prototype_element_id : null;
        var newProtoId = linkMode.protoId;
        Store.updateLinkElement(linkMode.rebindLinkId, linkMode.protoId);
        Store.save();
        if (rbLink && oldProtoId && oldProtoId !== newProtoId) {
          (function (linkId, oldId, newId) {
            recordLinkAction('重新绑定',
              function () { Store.updateLinkElement(linkId, oldId); },
              function () { Store.updateLinkElement(linkId, newId); });
          })(linkMode.rebindLinkId, oldProtoId, newProtoId);
        }
        U.toast('已重新绑定', 'success');
      } else if (Store.findLink(page.id, linkMode.protoId, linkMode.blockId)) {
        U.toast('该元素与该需求已存在关联', 'warn');
      } else {
        var newLink = Store.addLink({ page_id: page.id, prototype_element_id: linkMode.protoId, requirement_block_id: linkMode.blockId });
        Store.save();
        if (newLink) {
          (function (linkSnapshot) {
            recordLinkAction('建立关联',
              function () { Store.removeLink(linkSnapshot.id); },
              function () { Store.restoreLink(linkSnapshot); });
          })(U.deepCopy(newLink));
        }
        U.toast('已建立关联', 'success');
      }
      linkMode.protoId = null;
      linkMode.blockId = null;
      linkMode.rebindLinkId = null;
      overlay.setSelectedRect(null);
      clearBlockSelection();
      refreshLinks();
      updateLinkBar();
    });

    /* ---------- 原型区交互 ---------- */

    function onProtoClick(el, e) {
      if (!el || el.nodeType !== 1) return;
      if (linkMode.active) {
        e.preventDefault();
        e.stopPropagation();
        var pid = protoView.ensureProtoId(el);
        if (!pid) { U.toast('该元素无法绑定', 'warn'); return; }
        var label = protoView.elementLabel(el);
        /* 注册元素时记录指纹：原型重渲染导致标识丢失时按指纹自动恢复 */
        Store.ensureElement(page.id, pid, label.name, label.type, protoView.fingerprintOf(el));
        Store.save();
        linkMode.protoId = pid;
        overlay.setSelectedRect(elementBoxOf(el));
        updateLinkBar();
        return;
      }
      if (mode === 'read' || locked) {
        var bound = el.closest('[data-proto-id]');
        if (bound) {
          var bpid = bound.getAttribute('data-proto-id');
          var ls = Store.linksForElement(page.id, bpid);
          if (ls.length) {
            e.preventDefault();
            e.stopPropagation();
            locateBlocks(ls);
          }
        }
      }
    }

    function onProtoHover(el) {
      if (linkMode.active) {
        overlay.setHoverRect(el && el.nodeType === 1 ? elementBoxOf(el) : null);
        return;
      }
      if (mode === 'proto' || overlay.getDisplay() === 'hidden') {
        overlay.setActiveElement(null);
        return;
      }
      var bound = el && el.closest ? el.closest('[data-proto-id]') : null;
      if (bound) {
        var pid = bound.getAttribute('data-proto-id');
        var ls = Store.linksForElement(page.id, pid);
        if (ls.length) {
          overlay.setActiveElement(pid);
          overlay.tempShow(ls.map(function (l) { return l.id; }));
          highlightBlocks(ls.map(function (l) { return l.requirement_block_id; }));
          return;
        }
      }
      overlay.setActiveElement(null);
      overlay.clearTemp();
      highlightBlocks(null);
    }

    /* ---------- 需求区交互 ---------- */

    function onBlockClick(e, blockId) {
      if (e.target.closest && e.target.closest('.el-chip')) return;   /* chips 自行处理（定位元素） */
      if (linkMode.active) {
        if (e.target.closest('.blk-gutter')) return;
        linkMode.blockId = blockId;
        clearBlockSelection();
        var el = editor.getBlockEl(blockId);
        if (el) el.classList.add('selected');
        updateLinkBar();
        return;
      }
      if (mode === 'read' || locked) {
        if (e.target.closest('a')) return;
        var ls = links.filter(function (l) { return l.requirement_block_id === blockId; });
        if (ls.length) locateElement(ls);
      }
    }

    editorRoot.addEventListener('mouseover', function (e) {
      if (!e.target.closest) return;
      var wrap = e.target.closest('.blk');
      if (!wrap || linkMode.active || mode === 'proto') return;
      var bid = wrap.getAttribute('data-id');
      var ls = links.filter(function (l) { return l.requirement_block_id === bid; });
      if (ls.length) {
        overlay.tempShow(ls.map(function (l) { return l.id; }));
        highlightBlocks([bid]);
      }
    });
    editorRoot.addEventListener('mouseout', function (e) {
      if (!e.target.closest) return;
      var wrap = e.target.closest('.blk');
      if (!wrap) return;
      var to = e.relatedTarget;
      if (to && editorRoot.contains(to) && to.closest && to.closest('.blk') === wrap) return;
      if (linkMode.active) return;
      overlay.clearTemp();
      overlay.setActiveElement(null);
      highlightBlocks(null);
    });
    editorRoot.addEventListener('scroll', function () { overlay.requestRedraw(); }, { passive: true });

    /* ---------- 双向定位 ---------- */

    function locateBlocks(ls) {
      var bids = [];
      ls.forEach(function (l) { if (bids.indexOf(l.requirement_block_id) < 0) bids.push(l.requirement_block_id); });
      bids.forEach(function (bid) { editor.flashBlock(bid); });
      if (bids.length) editor.scrollBlockIntoView(bids[0]);
      overlay.tempShow(ls.map(function (l) { return l.id; }), 2200);
      overlay.setActiveElement(ls[0].prototype_element_id);
      setTimeout(function () { overlay.clearTemp(); overlay.setActiveElement(null); }, 2300);
    }

    function locateElement(ls) {
      var pid = ls[0].prototype_element_id;
      var el = protoView.findEl(pid);
      if (!el) { U.toast('原型元素未找到，可能已被替换', 'warn'); return; }
      try { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (err) { /* ignore */ }
      overlay.tempShow(ls.map(function (l) { return l.id; }), 2200);
      highlightBlocks(ls.map(function (l) { return l.requirement_block_id; }));
      setTimeout(function () {
        var el2 = protoView.findEl(pid);
        if (el2) overlay.flashElement(elementBoxOf(el2), 1600);
      }, 380);
      setTimeout(function () { overlay.clearTemp(); highlightBlocks(null); }, 2300);
    }

    /* ---------- 关联详情浮层 ---------- */

    function showLinkPopover(link, cx, cy) {
      var el = protoView.findEl(link.prototype_element_id);
      var meta = Store.getElement(page.id, link.prototype_element_id);
      var name = meta ? meta.element_name : (el ? protoView.elementLabel(el).name : '未知元素');
      var preview = editor.blockPreview(link.requirement_block_id) || '（空需求块）';
      var readOnly = locked || mode === 'read';
      var box = U.el('div', { class: 'link-pop' },
        U.el('div', { class: 'lp-sec' },
          U.el('div', { class: 'lp-label', text: '原型元素' }),
          U.el('div', { class: 'lp-name', text: name }),
          U.el('code', { class: 'lp-code', text: link.prototype_element_id })),
        U.el('div', { class: 'lp-sec' },
          U.el('div', { class: 'lp-label', text: '关联需求' }),
          U.el('div', { class: 'lp-req', text: preview })),
        readOnly
          ? U.el('div', { class: 'lp-note', text: '只读模式，仅可查看' })
          : U.el('div', { class: 'lp-actions' },
            U.el('button', {
              class: 'btn btn-sm', text: '重新绑定', onclick: function () {
                pop.close();
                enterLinkMode({ rebindLinkId: link.id, blockId: link.requirement_block_id });
              }
            }),
            U.el('button', {
              class: 'btn btn-sm btn-danger', text: '删除关联', onclick: function () {
                pop.close();
                var removedLink = U.deepCopy(link);
                Store.removeLink(link.id);
                Store.save();
                refreshLinks();
                recordLinkAction('删除关联',
                  function () { Store.restoreLink(removedLink); },
                  function () { Store.removeLink(removedLink.id); });
                U.toast('已删除关联 · Ctrl+Z 可撤销', 'success');
              }
            }))
      );
      var pop = U.popover({ left: cx, top: cy, right: cx, bottom: cy }, box, { className: 'link-pop-wrap' });
    }

    /* ---------- 连线显示控制 ---------- */

    var LINE_LABEL = { all: '全部', hover: '悬停', hidden: '隐藏' };
    function updateLineDisplayLabel() {
      lineDisplayBtn.innerHTML = '<span>连线显示 · ' + LINE_LABEL[overlay.getDisplay()] + '</span>' + U.ICONS.chevronD;
    }
    function setLineDisplay(d) {
      overlay.setDisplay(d);
      try { localStorage.setItem('protoReq.lineDisplay', d); } catch (e) { /* ignore */ }
      updateLineDisplayLabel();
    }
    lineDisplayBtn.addEventListener('click', function () {
      var cur = overlay.getDisplay();
      U.menu([
        { label: '全部显示', checked: cur === 'all', onClick: function () { setLineDisplay('all'); } },
        { label: '悬停显示（默认）', checked: cur === 'hover', onClick: function () { setLineDisplay('hover'); } },
        { label: '隐藏全部连线', checked: cur === 'hidden', onClick: function () { setLineDisplay('hidden'); } }
      ], lineDisplayBtn.getBoundingClientRect());
    });
    var savedDisplay = 'hover';
    try { savedDisplay = localStorage.getItem('protoReq.lineDisplay') || 'hover'; } catch (e) { /* ignore */ }
    overlay.setDisplay(savedDisplay);
    updateLineDisplayLabel();

    /* ---------- 顶部按钮 ---------- */

    undoBtn.addEventListener('click', function () { if (!locked) editor.undo(); });
    redoBtn.addEventListener('click', function () { if (!locked) editor.redo(); });
    saveChip.addEventListener('click', function () { if (flushSave() === false || persistPrototypeNow() === false) return; U.toast('已保存', 'success'); });
    historyBtn.addEventListener('click', openHistory);
    versionBtn.addEventListener('click', openVersions);
    commentBtn.addEventListener('click', openCommentsPanel);
    shareBtn.addEventListener('click', openShare);
    helpBtn.addEventListener('click', openShortcutHelp);

    treeToggle.addEventListener('click', function () {
      document.body.classList.toggle('tree-collapsed');
      setTimeout(function () { overlay.requestRedraw(); }, 50);
    });
    addPageBtn.addEventListener('click', addPage);

    /* ---------- 修改记录 ---------- */

    function openHistory() {
      var records = page ? Store.getChanges(page.id) : [];
      var list = U.el('div', { class: 'chg-list' });
      if (!records.length) {
        list.append(U.el('div', { class: 'chg-empty', text: '暂无修改记录。编辑需求并自动保存后，这里会记录每次变更。' }));
      } else {
        records.forEach(function (r) {
          list.append(U.el('div', { class: 'chg-item' },
            U.el('div', { class: 'chg-time', text: U.fmtDTS(r.created_at) }),
            r.old_content == null
              ? U.el('div', { class: 'chg-tag', text: '新增需求块' })
              : r.new_content == null
                ? U.el('div', { class: 'chg-tag del', text: '删除需求块' })
                : U.el('div', { class: 'chg-tag mod', text: '修改需求块' }),
            r.old_content != null ? U.el('pre', { class: 'chg-pre old', text: r.old_content }) : null,
            r.new_content != null ? U.el('pre', { class: 'chg-pre new', text: r.new_content }) : null
          ));
        });
      }
      U.modal({ title: '修改记录 · ' + (page ? page.name : ''), body: list, wide: true, actions: [{ label: '关闭', kind: 'primary' }] });
    }

    /* ---------- 快捷键与操作速查 ---------- */

    function openShortcutHelp() {
      function group(title, rows) {
        var box = U.el('div', {},
          U.el('div', { class: 'sc-group-title', text: title }));
        rows.forEach(function (r) {
          /* U.el 只展开一层数组：先拍平键位序列 [Ctrl,+,S] */
          var keys = [];
          r[0].forEach(function (k, i) {
            if (i) keys.push(U.el('span', { class: 'sc-plus', text: '+' }));
            keys.push(U.el('kbd', { class: 'kbd', text: k }));
          });
          box.append(U.el('div', { class: 'sc-row' },
            U.el('span', { class: 'sc-desc', text: r[1] }),
            U.el('span', { class: 'sc-keys' }, keys)
          ));
        });
        return box;
      }
      var body = U.el('div', {},
        group('通用', [
          [['Ctrl', 'S'], '立即保存需求'],
          [['Esc'], '退出连线模式 / 关闭弹层'],
          [['?'], '打开本速查面板']
        ]),
        group('导航', [
          [['Alt', '←'], '浏览器后退（hash 路由原生支持，返回上一页面）'],
          [['Alt', '→'], '浏览器前进']
        ]),
        group('撤销 / 重做', [
          [['Ctrl', 'Z'], '需求编辑器内：撤销文档；连线模式内：撤销连线操作'],
          [['Ctrl', 'Shift', 'Z'], '重做（也可用 Ctrl + Y）'],
          [['Ctrl', 'Z'], '原型 iframe 内的文本编辑撤销，优先在原型内生效']
        ]),
        group('评论与 AI', [
          [['Ctrl', 'Enter'], '评论输入框内快速提交'],
          [['Ctrl', 'Enter'], 'AI 生成弹窗内开始生成']
        ])
      );
      body.append(U.el('div', { class: 'sc-group-title', text: '鼠标操作' }));
      [['点顶栏项目名', '项目菜单：返回主页 / 切换项目 / 新建项目'],
       ['悬停需求块', '左上角 + 插入块、⋯ 块菜单；右上角气泡为评论入口'],
       ['拖动中间分割条', '调整原型 / 需求栏宽度（双击复位）'],
       ['拖动连线条空白处', '移动引导条位置，避免遮挡原型'],
       ['阅读模式点击原型元素', '右侧需求块滚动定位并闪烁（双向定位）']
      ].forEach(function (r) {
        body.append(U.el('div', { class: 'sc-row' },
          U.el('span', { class: 'sc-desc', text: r[0] }),
          U.el('span', { class: 'sc-keys', text: r[1], style: 'font-size:12px; color:var(--ink-2); text-align:right; max-width:60%;' })
        ));
      });
      U.modal({ title: '快捷键与操作速查', body: body, actions: [{ label: '知道了', kind: 'primary' }] });
    }

    /* ---------- 版本管理 + 需求 Diff（P1） ---------- */

    /* 版本 blocks（db 格式）→ 编辑器格式 */
    function toEditorBlocks(arr) {
      return (arr || []).map(function (b) {
        return { id: b.id, type: b.block_type || b.type, content: b.content };
      });
    }

    /* 只读静态渲染一个块（Diff 视图用，无 contenteditable / 无操作按钮）。
       内容来自自家编辑器（粘贴时已过白名单净化），与编辑器同等信任级别 */
    function staticBlock(b) {
      var t = b.type, c = b.content;
      if (t === 'h1' || t === 'h2' || t === 'h3') return U.el(t, { html: c || '' });
      if (t === 'quote') return U.el('blockquote', { html: c || '' });
      if (t === 'ul' || t === 'ol') {
        var l = U.el(t);
        (c && c.length ? c : ['']).forEach(function (it) { l.append(U.el('li', { html: it || '' })); });
        return l;
      }
      if (t === 'checklist') {
        var d = U.el('div', { class: 'sb-ck' });
        (c || []).forEach(function (it) {
          d.append(U.el('div', { class: 'sb-ck-item' + (it.checked ? ' done' : '') },
            U.el('span', { class: 'sb-ck-box', text: it.checked ? '☑' : '☐' }),
            U.el('span', { class: 'sb-ck-text', html: it.html || '' })));
        });
        return d;
      }
      if (t === 'code') return U.el('pre', { class: 'sb-code', text: String(c == null ? '' : c) });
      if (t === 'table') {
        var cc = c || { header: [], rows: [] };
        var tb = U.el('table', { class: 'sb-tbl' });
        var thead = U.el('thead');
        var htr = U.el('tr');
        (cc.header || []).forEach(function (h) { htr.append(U.el('th', { html: h || '' })); });
        thead.append(htr);
        var tbody = U.el('tbody');
        (cc.rows || []).forEach(function (r) {
          var tr = U.el('tr');
          (r || []).forEach(function (cell) { tr.append(U.el('td', { html: cell || '' })); });
          tbody.append(tr);
        });
        tb.append(thead, tbody);
        return tb;
      }
      if (t === 'divider') return U.el('hr', { class: 'sb-hr' });
      return U.el('div', { class: 'sb-p', html: c || '' });
    }

    /* 两份 blocks 的块级 Diff：按 block_id 对齐。
       same=未变（淡化）/ add=新增（绿色高亮）/ del=删除（红色+删除线）/
       mod=修改（旧文删除线 + 新文高亮）/ move=位置调整 */
    function diffBlocks(A, B) {
      var aMap = {}, bMap = {};
      A.forEach(function (b) { aMap[b.id] = 1; });
      B.forEach(function (b) { bMap[b.id] = 1; });
      function sameBlock(x, y) {
        return x.type === y.type && JSON.stringify(x.content) === JSON.stringify(y.content);
      }
      var out = [];
      var i = 0, j = 0;
      while (i < A.length || j < B.length) {
        if (j >= B.length) { out.push({ kind: 'del', b: A[i] }); i++; continue; }
        if (i >= A.length) { out.push({ kind: 'add', b: B[j] }); j++; continue; }
        var a = A[i], b = B[j];
        if (a.id === b.id) {
          out.push(sameBlock(a, b) ? { kind: 'same', b: b } : { kind: 'mod', a: a, b: b });
          i++; j++; continue;
        }
        if (!bMap[a.id]) { out.push({ kind: 'del', b: a }); i++; continue; }
        if (!aMap[b.id]) { out.push({ kind: 'add', b: b }); j++; continue; }
        /* 两边都存在但错位（块被移动）：先按新顺序渲染，标注位置调整 */
        out.push({ kind: 'move', b: b }); j++;
      }
      return out;
    }

    function diffTag(text, cls) {
      return U.el('span', { class: 'diff-tag ' + (cls || ''), text: text });
    }

    /* Diff 弹窗：vOld → vNew（vNew 为 null 表示当前编辑内容） */
    function openDiff(vOld, vNew) {
      var A = toEditorBlocks(vOld.blocks);
      var B;
      var newLabel;
      if (vNew) {
        B = toEditorBlocks(vNew.blocks);
        newLabel = vNew.label;
      } else {
        flushSave();
        B = toEditorBlocks(Store.getBlocks(doc.id));
        newLabel = '当前内容';
      }
      var items = diffBlocks(A, B);
      var nAdd = items.filter(function (x) { return x.kind === 'add'; }).length;
      var nDel = items.filter(function (x) { return x.kind === 'del'; }).length;
      var nMod = items.filter(function (x) { return x.kind === 'mod'; }).length;

      var summary = (nAdd || nDel || nMod)
        ? U.el('div', { class: 'diff-summary' },
            U.el('span', { class: 'ds-item add', text: '+' + nAdd + ' 新增' }),
            U.el('span', { class: 'ds-item del', text: '-' + nDel + ' 删除' }),
            U.el('span', { class: 'ds-item mod', text: '~' + nMod + ' 修改' }),
            U.el('span', { class: 'ds-arrow', text: vOld.label + ' → ' + newLabel })
          )
        : U.el('div', { class: 'diff-summary', html: '<span class="ds-same">两个版本内容一致，无差异。</span>' });

      var body = U.el('div', { class: 'diff-body' });
      items.forEach(function (it) {
        if (it.kind === 'same') {
          body.append(U.el('div', { class: 'diff-blk same' }, staticBlock(it.b)));
        } else if (it.kind === 'add') {
          body.append(U.el('div', { class: 'diff-blk add' }, diffTag('新增', 'add'), staticBlock(it.b)));
        } else if (it.kind === 'del') {
          body.append(U.el('div', { class: 'diff-blk del' }, diffTag('删除', 'del'), staticBlock(it.b)));
        } else if (it.kind === 'move') {
          body.append(U.el('div', { class: 'diff-blk move' }, diffTag('位置调整', 'move'), staticBlock(it.b)));
        } else {
          body.append(U.el('div', { class: 'diff-blk mod' },
            diffTag('修改', 'mod'),
            U.el('div', { class: 'diff-sub del' }, diffTag('旧', 'del'), staticBlock(it.a)),
            U.el('div', { class: 'diff-sub add' }, diffTag('新', 'add'), staticBlock(it.b))
          ));
        }
      });

      U.modal({
        title: '需求 Diff · ' + page.name,
        wide: true,
        body: U.el('div', {}, summary, body),
        actions: [{ label: '关闭', kind: 'primary' }]
      });
    }

    /* 版本面板：快照 / 对比 / 恢复 / 删除 */
    function openVersions() {
      if (!page) { U.toast('请先创建页面', 'warn'); return; }
      flushSave();

      var list = U.el('div', { class: 'ver-list' });

      function renderVerList() {
        list.innerHTML = '';
        var vs = Store.listVersions(page.id);
        if (!vs.length) {
          list.append(U.el('div', { class: 'chg-empty', text: '还没有版本快照。在评审节点点击「保存当前为版本」留档，之后可随时对比差异或恢复。' }));
          return;
        }
        vs.forEach(function (v, i) {
          var older = vs[i + 1] || null;   /* 列表按新→旧排序，i+1 是上一个更早版本 */
          var cmpBtn = U.el('button', { class: 'btn btn-sm', text: '对比', title: '与上一版本或当前内容对比' });
          cmpBtn.addEventListener('click', function () {
            U.menu([
              { label: '与上一版本对比', disabled: !older, onClick: function () { openDiff(older, v); } },
              { label: '与当前内容对比', onClick: function () { openDiff(v, null); } }
            ], cmpBtn.getBoundingClientRect());
          });

          var row = U.el('div', { class: 'ver-item' + (v.auto ? ' auto' : '') },
            U.el('div', { class: 'ver-main' },
              U.el('div', { class: 'ver-label', text: v.label }),
              U.el('div', { class: 'ver-meta', text: U.fmtDTS(v.created_at) + ' · ' + (v.blocks ? v.blocks.length : 0) + ' 个需求块' + (v.auto ? ' · 自动快照' : '') })
            ),
            U.el('div', { class: 'ver-actions' },
              cmpBtn,
              U.el('button', {
                class: 'btn btn-sm', text: '恢复', title: '将需求、原型和连线恢复到该版本（恢复前会自动备份）',
                onclick: async function () {
                  var ok = await U.confirm('将需求内容恢复到版本「' + v.label + '」？\n\n当前内容会先自动保存一份快照，误恢复也可再切回；但被移除需求块的连线和评论会被清理。', { okLabel: '恢复' });
                  if (!ok) return;
                  restoreVersion(v, function () { m.close(); });
                }
              }),
              U.el('button', {
                class: 'icon-btn', title: '删除版本', html: U.ICONS.trash,
                onclick: async function () {
                  var ok = await U.confirm('删除版本「' + v.label + '」？此操作不可恢复。', { danger: true, okLabel: '删除' });
                  if (!ok) return;
                  Store.deleteVersion(v.id);
                  renderVerList();
                  U.toast('版本已删除', 'success');
                }
              })
            )
          );
          list.append(row);
        });
      }
      renderVerList();

      var snapBtn = U.el('button', {
        class: 'btn btn-sm btn-primary', html: U.ICONS.save + '<span>保存当前为版本</span>',
        title: '把当前需求内容保存为版本快照'
      });
      snapBtn.addEventListener('click', async function () {
        var label = await U.prompt({ title: '保存当前为版本', label: '版本说明（例如：评审 v1.2 / 提测前定稿）', placeholder: '可留空', okLabel: '保存版本' });
        if (label === null) return;
        flushSave();
        Store.saveVersion(page.id, doc.id, label, false);
        renderVerList();
        U.toast('版本已保存', 'success');
      });

      var m = U.modal({
        title: '版本管理 · ' + page.name,
        wide: true,
        body: U.el('div', {},
          U.el('div', { class: 'ver-head' },
            snapBtn,
            U.el('span', { class: 'ver-note', text: '版本包含需求、原型与连线。每页最多保留 30 个版本。' })
          ),
          list
        ),
        actions: [{ label: '关闭', kind: 'primary' }]
      });
    }

    /* 恢复版本：先自动备份当前 → 恢复原型/连线 → 载入版本 blocks。 */
    function restoreVersion(v, done) {
      flushSave();
      Store.saveVersion(page.id, doc.id, '恢复「' + v.label + '」前自动备份', true);
      Store.restoreVisualSnapshot(v);
      var blocks = toEditorBlocks(v.blocks);
      editor.setBlocks(blocks);
      flushSave();          /* replaceBlocks + change 记录 + 移除块的连线/评论级联清理 */
      protoView.load(page.prototype_content || '');
      refreshLinks();
      overlay.requestRedraw();
      if (done) done();
      U.toast('已恢复到「' + v.label + '」，恢复前内容已自动备份为新版本', 'success');
    }

    /* ---------- 分享 ---------- */

    function openShare() {
      /* 多账号模式：项目级 token 分享——对方登录后项目以副本进入他的库，
         看不到你的其他项目（对应用户诉求「只分享这一个项目」） */
      if (Auth.isMultiUser()) {
        Auth.shareProjectDialog(project);
        return;
      }
      if (!page) { U.toast('请先创建页面', 'warn'); return; }
      var base = (location.origin && location.origin !== 'null')
        ? location.origin + location.pathname
        : location.href.split('#')[0];
      var url = base + '#/share/' + project.id + '/' + page.id;
      var input = U.el('input', { class: 'input', readonly: 'readonly', value: url, onclick: function () { input.select(); } });
      var note = Store.isRemote()
        ? '研发 / 测试 / 设计打开链接后进入<b>只读模式</b>：可点击原型元素定位需求，也可点击需求定位原型元素。<br>数据来自本地服务（<code>server.py</code>），<b>同一网络内的设备可直接打开此链接</b>，无需安装任何东西。'
        : '研发 / 测试 / 设计打开链接后进入<b>只读模式</b>：可点击原型元素定位需求，也可点击需求定位原型元素。<br>当前为纯本机模式（数据仅存本浏览器），链接只在本机有效；运行 <code>python3 server.py</code> 启动本地服务后，即可把链接分享给同一网络的同事。';
      U.modal({
        title: '分享此页面',
        body: U.el('div', {},
          U.el('div', { class: 'field-label', text: '只读访问链接' }), input,
          U.el('div', { class: 'share-note', html: note })
        ),
        actions: [
          { label: '关闭' },
          {
            label: '复制链接', kind: 'primary', onClick: async function (close) {
              var ok = await U.copyText(url);
              U.toast(ok ? '链接已复制' : '复制失败，请手动选择复制', ok ? 'success' : 'error');
              if (ok) close();
            }
          }
        ]
      });
      setTimeout(function () { input.select(); }, 50);
    }

    /* ---------- AI 生成原型（提示词见 js/ai-skill.js 内置 Skill） ---------- */

    function openAIDialog() {
      if (window.PRD_MODE) { generatePrdBtn.click(); return; }
      if (!page) { U.toast('请先创建页面', 'warn'); return; }

      var currentHtml = null;    /* 本次生成结果（未应用） */
      var abortCtrl = null;
      var genState = 'idle';     /* idle | loading | done */
      var hasProto = !!page.prototype_content;   /* 页面已有原型 → 迭代模式 */

      var ta = U.el('textarea', {
        class: 'input ai-ta', spellcheck: 'false', rows: '3',
        placeholder: hasProto
          ? '描述要修改的内容，例如：状态列改成胶囊标签，再增加一列「负责人」'
          : '用一句话描述你要的页面，例如：用户管理后台，支持搜索、创建用户、批量导出'
      });

      /* 接口配置：引导视图（未配置时）与生成视图（点「接口配置」）共用同一表单 */
      var epInput = U.el('input', { class: 'input', type: 'text', spellcheck: 'false', placeholder: 'https://api.openai.com/v1/chat/completions' });
      var keyInput = U.el('input', { class: 'input', type: 'password', spellcheck: 'false', placeholder: 'sk-…（仅保存在本浏览器，不会上传）' });
      var modelInput = U.el('input', { class: 'input', type: 'text', spellcheck: 'false', placeholder: 'gpt-4o-mini / deepseek-chat / qwen-plus…' });
      var thinkingInput = U.el('select', { class: 'input' });
      [['auto', '自动兼容（推荐）'], ['disabled', '关闭深度思考'], ['enabled', '开启深度思考']].forEach(function (item) {
        thinkingInput.append(U.el('option', { value: item[0], text: item[1] }));
      });
      var maxTokensInput = U.el('input', { class: 'input', type: 'number', min: '1024', max: '131072', step: '1024', value: '16384' });
      var cfgSaveBtn = U.el('button', { class: 'btn btn-primary btn-sm', text: '保存并开始' });
      var cfgTestBtn = U.el('button', { class: 'btn btn-sm', text: '测试连接' });

      function refreshCfgInputs() {
        var c = AI.getCfg();
        epInput.value = c.endpoint;
        keyInput.value = c.apiKey;
        modelInput.value = c.model;
        thinkingInput.value = c.thinking || 'auto';
        maxTokensInput.value = c.maxTokens || 16384;
      }

      var cfgPanel = U.el('div', { class: 'ai-cfg' },
        U.el('div', { class: 'ai-cfg-note', html: '兼容 OpenAI <code>/v1/chat/completions</code> 格式，OpenAI / DeepSeek / 通义 / Moonshot 等均可。Key 仅写入当前浏览器 localStorage，不会上传到任何其他地方。' }),
        U.el('div', { class: 'field-label', text: '接口地址' }), epInput,
        U.el('div', { class: 'field-label', style: 'margin-top:10px', text: 'API Key' }), keyInput,
        U.el('div', { class: 'field-label', style: 'margin-top:10px', text: '模型名称' }), modelInput,
        U.el('div', { class: 'field-label', style: 'margin-top:10px', text: '深度思考' }), thinkingInput,
        U.el('div', { class: 'field-label', style: 'margin-top:10px', text: '最大输出 Token' }), maxTokensInput,
        U.el('div', { class: 'set-row', style: 'margin-top:12px' }, cfgTestBtn, cfgSaveBtn)
      );

      function saveAiCfg() {
        if (!epInput.value.trim() || !keyInput.value.trim()) {
          U.toast('请填写接口地址与 API Key', 'warn');
          return false;
        }
        AI.saveCfg({
          endpoint: epInput.value.trim(),
          apiKey: keyInput.value.trim(),
          model: modelInput.value.trim() || 'gpt-4o-mini',
          thinking: thinkingInput.value,
          maxTokens: Math.max(1024, Math.min(131072, parseInt(maxTokensInput.value, 10) || 16384))
        });
        return true;
      }

      cfgSaveBtn.addEventListener('click', function () {
        if (!saveAiCfg()) return;
        U.toast('接口配置已保存', 'success');
        cfgPanel.hidden = true;
        renderView();
        if (AI.isRemoteReady()) setTimeout(function () { ta.focus(); }, 30);
      });

      cfgTestBtn.addEventListener('click', async function () {
        if (!saveAiCfg()) return;
        cfgTestBtn.disabled = true;
        cfgTestBtn.textContent = '测试中…';
        try {
          var result = await AI.testConnection();
          U.toast('连接成功 · ' + result.model, 'success');
        } catch (e) {
          U.toast((e && e.message) || '连接失败，请检查配置', 'error', 5000);
        } finally {
          cfgTestBtn.disabled = false;
          cfgTestBtn.textContent = '测试连接';
        }
      });

      /* 引导头：未配置接口时的说明区 */
      var guideHead = U.el('div', { class: 'ai-guide' },
        U.el('div', { class: 'ai-guide-ico', html: U.ICONS.spark }),
        U.el('div', { class: 'ai-guide-title', text: '连接你的 AI 接口' }),
        U.el('div', { class: 'ai-guide-desc', text: '填写接口、Key 和模型后先测试连接。' })
      );

      /* 结果区 */
      var previewFrame = U.el('iframe', { class: 'ai-preview', sandbox: 'allow-same-origin allow-scripts allow-forms allow-popups allow-modals' });
      var srcPre = U.el('pre', { class: 'ai-src' });
      var tabPrev = U.el('button', { class: 'ai-tab active', text: '预览' });
      var tabSrc = U.el('button', { class: 'ai-tab', text: '源码' });
      var applyBtn = U.el('button', { class: 'btn btn-primary btn-sm', text: '应用并替换原型' });
      var reGenBtn = U.el('button', { class: 'btn btn-sm', text: '重新生成' });
      var engineHint = U.el('span', { class: 'ai-engine-hint' });

      function switchTab(which) {
        tabPrev.classList.toggle('active', which === 'prev');
        tabSrc.classList.toggle('active', which === 'src');
        previewFrame.style.display = which === 'prev' ? '' : 'none';
        srcPre.style.display = which === 'src' ? '' : 'none';
      }
      tabPrev.addEventListener('click', function () { switchTab('prev'); });
      tabSrc.addEventListener('click', function () { switchTab('src'); });

      var resultWrap = U.el('div', { class: 'ai-result', hidden: true },
        U.el('div', { class: 'ai-result-bar' },
          U.el('div', { class: 'ai-tabs' }, tabPrev, tabSrc),
          engineHint
        ),
        previewFrame, srcPre,
        U.el('div', { class: 'ai-result-actions' }, applyBtn, reGenBtn)
      );

      /* 历史 */
      var histList = U.el('div', { class: 'ai-hist' });
      function renderHistory() {
        histList.innerHTML = '';
        var hs = AI.listHistory().slice(0, 5);
        if (!hs.length) {
          histList.append(U.el('div', { class: 'ai-hist-empty', text: '暂无生成记录' }));
          return;
        }
        hs.forEach(function (h) {
          var row = U.el('div', { class: 'ai-hist-item', title: h.prompt },
            U.el('span', { class: 'ai-hist-meta', text: U.fmtDT(h.created_at) }),
            U.el('span', { class: 'ai-hist-prompt', text: h.prompt }));
          row.addEventListener('click', function () { ta.value = h.prompt; ta.focus(); });
          histList.append(row);
        });
      }
      renderHistory();

      var genBtn = U.el('button', { class: 'btn btn-primary btn-sm' });
      var cfgToggle = U.el('button', { class: 'btn btn-sm btn-ghost', text: '接口配置', title: '修改 AI 接口配置（OpenAI 兼容）' });
      cfgToggle.addEventListener('click', function () {
        refreshCfgInputs();
        cfgPanel.hidden = !cfgPanel.hidden;
      });

      function setLoading(on) {
        genState = on ? 'loading' : (currentHtml ? 'done' : 'idle');
        genBtn.disabled = on;
        genBtn.classList.toggle('loading', on);
        genBtn.innerHTML = on
          ? '<span class="spin"></span><span>生成中…</span>'
          : U.ICONS.spark + '<span>' + (currentHtml ? '重新生成' : (hasProto ? '生成修改' : '生成原型')) + '</span>';
      }

      /* 视图切换：未配置接口 → 引导；已配置 → 生成 */
      var viewRoot = U.el('div');
      function renderView() {
        viewRoot.innerHTML = '';
        if (!AI.isRemoteReady()) {
          cfgSaveBtn.textContent = '保存并开始';
          cfgPanel.hidden = false;
          refreshCfgInputs();
          viewRoot.append(guideHead, cfgPanel);
          return;
        }
        cfgSaveBtn.textContent = '保存配置';
        cfgPanel.hidden = true;
        viewRoot.append(
          U.el('div', { class: 'field-label', text: hasProto ? '修改描述（基于当前页面原型）' : '页面描述' }),
          ta,
          U.el('div', { class: 'ai-engine-row', style: 'margin-top:12px' },
            cfgToggle, U.el('span', { class: 'spacer' }), genBtn),
          cfgPanel,
          resultWrap,
          U.el('div', { class: 'ai-hist-title', text: '最近生成（点击回填描述）' }),
          histList,
          U.el('div', { class: 'ai-foot-note', text: 'AI 只负责生成原型页面；需求撰写与元素连线始终由产品经理手动完成。' })
        );
      }

      async function doGenerate() {
        var prompt = ta.value.trim();
        if (!prompt) { U.toast(hasProto ? '请先描述要修改的内容' : '请先描述要生成的页面', 'warn'); ta.focus(); return; }
        setLoading(true);
        abortCtrl = new AbortController();
        try {
          /* 迭代基准：本次会话最新结果优先，其次页面已应用的原型（含连线锚点） */
          var base = currentHtml || (hasProto ? page.prototype_content : null);
          var r = await AI.generate(prompt, { signal: abortCtrl.signal, currentHtml: base });
          currentHtml = r.html;
          previewFrame.setAttribute('srcdoc', currentHtml);
          srcPre.textContent = currentHtml;
          resultWrap.hidden = false;
          var chk = ProtoSkill.check(currentHtml);
          engineHint.textContent = '由 ' + r.model + ' 生成' + (chk.issues.length ? ' · 自检提示：' + chk.issues.join('；') : '');
          switchTab('prev');
          AI.addHistory({ prompt: prompt, page_id: page.id, provider: 'remote', model: r.model });
          renderHistory();
          U.toast(hasProto ? '修改已生成，确认后点击「应用并替换原型」' : '原型已生成，确认后点击「应用并替换原型」', 'success');
        } catch (e) {
          if (e && e.name === 'AbortError') return;
          U.toast(String((e && e.message) || e), 'error', 5200);
        } finally {
          if (genState === 'loading') setLoading(false);
        }
      }

      genBtn.addEventListener('click', doGenerate);
      reGenBtn.addEventListener('click', doGenerate);
      ta.addEventListener('keydown', function (e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); doGenerate(); }
      });

      async function applyHtml() {
        if (!currentHtml || !page) return;
        var isReplace = !!page.prototype_content;
        if (isReplace && Store.getLinks(page.id).length) {
          var ok = await U.confirm('当前页面已存在连线关联，替换原型后这些关联可能失效，确定继续？', { danger: true, okLabel: '替换原型' });
          if (!ok) return;
        }
        Store.updatePage(page.id, { prototype_content: currentHtml });
        Store.save();
        m.close();
        loadPage(Store.getPage(page.id));
        U.toast('AI 原型已应用到页面，可继续编辑需求并手动连线', 'success');
      }
      applyBtn.addEventListener('click', applyHtml);

      var m = U.modal({
        title: 'AI 生成原型 · ' + page.name,
        wide: true,
        closable: true,
        onClose: function () { if (abortCtrl) { try { abortCtrl.abort(); } catch (e) { /* ignore */ } } },
        body: viewRoot
      });
      renderView();
      setLoading(false);
      if (AI.isRemoteReady()) setTimeout(function () { ta.focus(); }, 30);
    }

    /* ---------- 可视化原型编辑 / PNG 导出 ---------- */

    function openVisualEditorMode() {
      if (!page || !page.prototype_content) { U.toast('请先导入原型', 'warn'); return; }
      var changedOnce = false;
      window.openVisualEditor({
        html: protoView.serialize() || page.prototype_content,
        onFirstChange: function () {
          changedOnce = true;
        },
        onSave: function (html, changed) {
          if (!changed) { U.toast('未修改原型', 'info'); return; }
          if (flushSave() === false) throw new Error('保存失败，编辑内容已保留，请释放浏览器存储空间后重试');
          Store.saveVersion(page.id, doc.id, '进入编辑态前自动备份', true);
          var count = window.PRD_MODE ? 0 : Store.clearPageLinks(page.id);
          var previousHtml = page.prototype_content;
          Store.updatePage(page.id, { prototype_content: html });
          if (Store.save() === false) {
            Store.updatePage(page.id, { prototype_content: previousHtml });
            setSaveStatus('error');
            throw new Error('保存失败，编辑内容已保留，请释放浏览器存储空间后重试');
          }
          loadPage(Store.getPage(page.id));
          setMode('req');
          U.toast(count ? '已保存，原连线已清除' : '已保存并回到评审视图', 'success');
        },
        onCancel: function () {
          if (changedOnce) U.toast('已取消，本次修改未保存', 'info');
        }
      });
      return;

      /* 旧版源码编辑保留为不可达兼容代码；用户入口已改为可视化编辑态。 */
      var ta = U.el('textarea', { class: 'input html-ta', spellcheck: 'false' });
      ta.value = protoView.serialize() || page.prototype_content;
      U.modal({
        title: '编辑原型源码 · ' + page.name,
        wide: true,
        body: ta,
        actions: [
          { label: '取消' },
          { label: '保存原型', kind: 'primary', onClick: async function (close) {
            var html = ta.value.trim();
            if (!html) { U.toast('原型代码不能为空', 'warn'); return; }
            if (!/<html[\s>]/i.test(html) && !/<!doctype html/i.test(html)) {
              U.toast('请粘贴完整 HTML 文档', 'warn'); return;
            }
            var missing = Store.getLinks(page.id).filter(function (l) {
              return html.indexOf('data-proto-id="' + l.prototype_element_id + '"') < 0;
            }).length;
            if (missing) {
              var ok = await U.confirm('这次修改会使 ' + missing + ' 条关联失效，仍然保存？', { danger: true, okLabel: '仍然保存' });
              if (!ok) return;
            }
            Store.updatePage(page.id, { prototype_content: html });
            Store.save();
            close();
            loadPage(Store.getPage(page.id));
            U.toast('原型已保存', 'success');
          } }
        ]
      });
      setTimeout(function () { ta.focus(); }, 30);
    }

    function exportPrototypeHtml() {
      if (locked) return;
      persistPrototypeNow();
      if (!page || !page.prototype_content) { U.toast('请先生成或导入原型', 'warn'); return; }
      exportHtmlBtn.disabled = true;
      exportHtmlBtn.textContent = '导出中…';
      try {
        // 使用当前页面保存的编辑稿，避免导出画布注入的选中态与工具节点。
        var html = window.PRD_MODE ? PRD_MODE.safeHTML(page.prototype_content, false) : page.prototype_content;
        var output = new DOMParser().parseFromString(html, 'text/html');
        output.querySelectorAll('[contenteditable]').forEach(function (el) { el.removeAttribute('contenteditable'); });
        output.querySelectorAll('meta[charset],meta[name="viewport"]').forEach(function (el) { el.remove(); });
        var charset = output.createElement('meta'); charset.setAttribute('charset', 'utf-8'); output.head.prepend(charset);
        var viewport = output.createElement('meta'); viewport.name = 'viewport'; viewport.content = 'width=device-width,initial-scale=1'; output.head.append(viewport);
        output.documentElement.lang = output.documentElement.lang || 'zh-CN';
        output.title = page.name || '页面原型';
        var url = URL.createObjectURL(new Blob(['<!doctype html>\n' + output.documentElement.outerHTML], { type: 'text/html;charset=utf-8' }));
        var a = document.createElement('a'); a.href = url;
        a.download = (page.name || '页面原型').replace(/[\\/:*?"<>|\x00-\x1f]/g, '-').slice(0,100) + '.html';
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(function () { URL.revokeObjectURL(url); }, 3000);
        U.toast('HTML 已导出，可在浏览器中打开', 'success');
      } catch (e) { U.toast('导出失败：' + (e.message || '请重试'), 'error'); }
      finally { exportHtmlBtn.disabled = !page || !page.prototype_content; exportHtmlBtn.textContent = '导出 HTML'; }
    }

    function loadHtml2Canvas(doc) {
      var win = doc && doc.defaultView;
      if (!win) return Promise.reject(new Error('原型尚未加载'));
      if (win.html2canvas) return Promise.resolve(win.html2canvas);
      return new Promise(function (resolve, reject) {
        var script = doc.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
        script.onload = function () { win.html2canvas ? resolve(win.html2canvas) : reject(new Error('导出组件未加载')); };
        script.onerror = function () { reject(new Error('无法加载导出组件，请检查网络')); };
        doc.head.appendChild(script);
      });
    }

    async function exportPrototypePng() {
      if (!page || !page.prototype_content) { U.toast('请先导入原型', 'warn'); return; }
      var doc = protoView.doc();
      if (!doc || !doc.body) { U.toast('原型尚未加载完成', 'warn'); return; }
      exportPngBtn.disabled = true;
      exportPngBtn.textContent = '导出中…';
      try {
        var html2canvas = await loadHtml2Canvas(doc);
        var root = doc.documentElement;
        var canvas = await html2canvas(doc.body, {
          backgroundColor: '#ffffff',
          useCORS: true,
          scale: Math.min(2, Math.max(1, window.devicePixelRatio || 1)),
          width: Math.max(root.scrollWidth, doc.body.scrollWidth),
          height: Math.max(root.scrollHeight, doc.body.scrollHeight),
          windowWidth: Math.max(root.scrollWidth, doc.body.scrollWidth),
          windowHeight: Math.max(root.scrollHeight, doc.body.scrollHeight)
        });
        var blob = await new Promise(function (resolve) { canvas.toBlob(resolve, 'image/png'); });
        if (!blob) throw new Error('图片编码失败');
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = (page.name || 'prototype').replace(/[\\/:*?"<>|]/g, '-') + '.png';
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(function () { URL.revokeObjectURL(url); }, 3000);
        U.toast('PNG 已导出', 'success');
      } catch (e) {
        U.toast((e && e.message) || '导出失败；如原型含跨域图片，请确认图片允许跨域访问', 'error', 5000);
      } finally {
        exportPngBtn.disabled = false;
        exportPngBtn.textContent = '导出 PNG';
      }
    }

    /* ---------- 原型导入 ---------- */

    function openImportDialog() {
      var ta = U.el('textarea', { class: 'input html-ta', spellcheck: 'false', placeholder: '<!DOCTYPE html>\n<html>\n<head><meta charset="UTF-8"><title>页面</title></head>\n<body>\n  <button>创建用户</button>\n</body>\n</html>' });

      var fileInput = U.el('input', { type: 'file', accept: '.html,.htm,text/html', style: 'display:none' });
      var drop = U.el('div', { class: 'file-drop' },
        U.el('div', { class: 'fd-ico', html: U.ICONS.doc }),
        U.el('div', { text: '点击选择 .html 文件', class: 'fd-text' }),
        U.el('div', { class: 'fd-sub', text: '读取后可在左侧预览确认' }),
        fileInput
      );
      drop.addEventListener('click', function () { fileInput.click(); });
      fileInput.addEventListener('change', function () {
        var f = fileInput.files && fileInput.files[0];
        if (!f) return;
        var reader = new FileReader();
        reader.onload = function () {
          ta.value = String(reader.result || '');
          switchPane('paste');
          U.toast('已读取 ' + f.name, 'success');
        };
        reader.readAsText(f);
      });

      var panes = { paste: ta, file: drop };
      var tabWrap = U.el('div', { class: 'imp-tabs' });
      var curTab = 'paste';

      function openImportAIGenerator() {
        if (window.PRD_MODE) { m.close(); generatePrdBtn.click(); return; }
        var prompt = U.el('textarea', {
          class: 'input html-ta', spellcheck: 'false',
          placeholder: '描述要生成的页面，例如：一个用于管理团队成员的后台页面，包含搜索、筛选、成员列表和邀请成员按钮'
        });
        prompt.style.minHeight = '180px';
        var generateBtn = U.el('button', { class: 'btn btn-primary btn-sm', html: U.ICONS.spark + '<span>开始生成</span>' });
        var aiModal = U.modal({
          title: 'AI 生成原型', width: 680,
          body: U.el('div', { class: 'set-body' },
            U.el('div', { class: 'field-label', text: '页面描述' }), prompt,
            U.el('div', { class: 'ai-engine-row', style: 'margin-top:12px' }, generateBtn),
            U.el('div', { class: 'ai-foot-note', text: '生成结果会回填到导入内容，确认后再点击“导入原型”。' })
          ),
          actions: [{ label: '取消' }]
        });

        async function generate() {
          var request = prompt.value.trim();
          if (!request) { U.toast('请先描述要生成的页面', 'warn'); prompt.focus(); return; }
          if (!AI.isRemoteReady()) { U.toast('请先在设置页完成 AI 配置并测试连接', 'warn'); return; }
          generateBtn.disabled = true;
          generateBtn.innerHTML = '<span class="spin"></span><span>生成中…</span>';
          try {
            var result = await AI.generate(request);
            ta.value = result.html;
            switchPane('paste');
            aiModal.close();
            U.toast('原型已生成，请确认后点击“导入原型”', 'success');
          } catch (error) {
            U.toast((error && error.message) || 'AI 生成失败', 'error', 5200);
          } finally {
            generateBtn.disabled = false;
            generateBtn.innerHTML = U.ICONS.spark + '<span>开始生成</span>';
          }
        }
        generateBtn.addEventListener('click', generate);
        prompt.addEventListener('keydown', function (event) {
          if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') { event.preventDefault(); generate(); }
        });
        setTimeout(function () { prompt.focus(); }, 30);
      }

      function switchPane(t) {
        curTab = t;
        tabWrap.querySelectorAll('button').forEach(function (b) {
          b.classList.toggle('active', b.getAttribute('data-tab') === t);
        });
        Object.keys(panes).forEach(function (k) {
          panes[k].style.display = k === t ? '' : 'none';
        });
      }
      [['paste', '粘贴代码'], ['file', '上传文件']].forEach(function (d) {
        tabWrap.append(U.el('button', { 'data-tab': d[0], text: d[1], onclick: function () { switchPane(d[0]); } }));
      });

      var isReplace = !!(page && page.prototype_content);
      var m = U.modal({
        title: isReplace ? '替换原型 · ' + (page ? page.name : '') : '导入原型 · ' + (page ? page.name : ''),
        wide: true,
        body: U.el('div', {}, tabWrap, panes.paste, panes.file),
        onClose: function () { done = true; },
        actions: [
          { label: '取消' },
          { label: 'AI 生成', onClick: openImportAIGenerator },
          {
            label: '导入原型', kind: 'primary', onClick: async function (close) {
              if (done) return;
              var html = ta.value.trim();
              if (!html) { U.toast('请先粘贴 HTML、上传文件或选择模板', 'warn'); return; }
              if (!/<html[\s>]|<!doctype html/i.test(html)) { U.toast('请粘贴完整 HTML 文档', 'warn'); return; }
              done = true;
              if (isReplace && Store.getLinks(page.id).length) {
                var ok = await U.confirm('当前页面已存在连线关联，替换原型后这些关联可能失效，确定继续？', { danger: true, okLabel: '替换原型' });
                if (!ok) { done = false; return; }
              }
              var previousHtml = page.prototype_content;
              Store.updatePage(page.id, { prototype_content: html });
              if (Store.save() === false) {
                Store.updatePage(page.id, { prototype_content: previousHtml });
                done = false;
                setSaveStatus('error');
                return;
              }
              close();
              loadPage(Store.getPage(page.id));
              U.toast('原型已导入', 'success');
            }
          }
        ]
      });
      var done = false; void done;
      switchPane(curTab);
      if (curTab === 'paste') setTimeout(function () { ta.focus(); }, 30);
    }

    /* ---------- 面板宽度拖动（记忆到 localStorage，刷新不丢；双击复位并清除记忆） ---------- */

    var PANEL_W_KEY = 'protoReq.reqPanelWidth.v1';
    try {
      var savedW = parseFloat(localStorage.getItem(PANEL_W_KEY));
      if (savedW >= 300 && savedW <= 640) {
        reqPanel.style.width = savedW + 'px';
        reqPanel.style.flex = '0 0 auto';
      }
    } catch (e) { /* ignore */ }

    var finishPanelDrag = function () {};
    dragbar.addEventListener('pointerdown', function (e) {
      if (e.button !== 0) return;
      finishPanelDrag();
      e.preventDefault();
      var pointerId = e.pointerId;
      function move(ev) {
        if (ev.pointerId !== pointerId) return;
        if (ev.buttons === 0) { up(); return; }
        var sr = stage.getBoundingClientRect();
        var w = U.clamp(sr.right - ev.clientX, 300, 640);
        reqPanel.style.width = w + 'px';
        reqPanel.style.flex = '0 0 auto';
        overlay.requestRedraw();
      }
      function up() {
        window.removeEventListener('pointermove', move, true);
        window.removeEventListener('pointerup', endPointer, true);
        window.removeEventListener('pointercancel', endPointer, true);
        window.removeEventListener('blur', up);
        document.removeEventListener('visibilitychange', visibility);
        dragbar.removeEventListener('lostpointercapture', endPointer);
        document.body.classList.remove('dragging');
        if (dragbar.hasPointerCapture(pointerId)) dragbar.releasePointerCapture(pointerId);
        finishPanelDrag = function () {};
        try { localStorage.setItem(PANEL_W_KEY, reqPanel.style.width || ''); } catch (e2) { /* ignore */ }
      }
      function endPointer(ev) { if (ev.pointerId === pointerId) up(); }
      function visibility() { if (document.hidden) up(); }
      finishPanelDrag = up;
      document.body.classList.add('dragging');
      window.addEventListener('pointermove', move, true);
      window.addEventListener('pointerup', endPointer, true);
      window.addEventListener('pointercancel', endPointer, true);
      window.addEventListener('blur', up);
      document.addEventListener('visibilitychange', visibility);
      dragbar.addEventListener('lostpointercapture', endPointer);
      try { dragbar.setPointerCapture(pointerId); } catch (e2) { /* Window listeners still end the drag. */ }
    });
    dragbar.addEventListener('dblclick', function () {
      reqPanel.style.width = '';
      reqPanel.style.flex = '';
      try { localStorage.removeItem(PANEL_W_KEY); } catch (e) { /* ignore */ }
      overlay.requestRedraw();
    });

    var ro = new ResizeObserver(function () { overlay.requestRedraw(); });
    ro.observe(stage);
    ro.observe(reqPanel);
    ro.observe(protoPanel);

    /* ---------- 全局键盘 ---------- */

    function onKeyDown(e) {
      if (e.key === 'Escape') {
        if (linkMode.active) { exitLinkMode(); }
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (flushSave() === false || persistPrototypeNow() === false) return;
        U.toast('已保存', 'success');
      }
      /* ? 键打开快捷键速查：正在输入（编辑器 / 输入框 / 弹窗）时不拦截 */
      if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        var ae0 = document.activeElement;
        var typing = !!(ae0 && (ae0.isContentEditable || ae0.tagName === 'TEXTAREA' || ae0.tagName === 'INPUT' ||
          (ae0.closest && ae0.closest('.modal-card, .popover'))));
        if (!typing) { e.preventDefault(); openShortcutHelp(); }
      }
      /* 连线撤销/重做：连线模式内始终接管；连线模式外，仅当焦点不在需求编辑器
         （.ed 可编辑块）且存在可回退的连线操作时接管——覆盖「popover 删除后按 Ctrl+Z」的场景。
         焦点在编辑器内时文档撤销优先（编辑器自身的处理器会先消费该事件）。
         P1 起补充：焦点在弹窗/浮层的输入框（评论、AI 对话）时放行给原生文本撤销。 */
      if ((e.ctrlKey || e.metaKey) && !locked && 'zy'.indexOf(e.key.toLowerCase()) >= 0) {
        var ae = document.activeElement;
        var focusInEditor = !!(ae && ae.closest && ae.closest('.ed'));
        var focusInInput = !!(ae && ((ae.tagName === 'TEXTAREA' || ae.tagName === 'INPUT') ||
          (ae.closest && ae.closest('.modal-card, .popover'))));
        if (linkMode.active || (!focusInEditor && !focusInInput)) {
          var wantRedo = e.shiftKey || e.key.toLowerCase() === 'y';
          var handled = wantRedo ? redoLinkOp() : undoLinkOp();
          if (handled) e.preventDefault();
        }
      }
    }
    document.addEventListener('keydown', onKeyDown);

    /* ---------- 初始化 ---------- */

    if (page) {
      loadPage(page);
    } else {
      renderTree();
      setSaveStatus('saved');
    }
    setMode(mode);
    var sharedPollTimer = null;
    if (share && Store.isShared && Store.isShared()) {
      sharedPollTimer = setInterval(function () {
        if (dirty || protoDirty || linkMode.active) return;
        Store.refreshShared().then(function (r) {
          if (!r || !r.changed) return;
          var fresh = Store.getPage(page && page.id);
          if (fresh) loadPage(fresh);
          U.toast('已同步协作者的最新修改', 'info');
        });
      }, 8000);
    }
    try {
      if (page && sessionStorage.getItem(AI_HOME_PAGE_KEY) === page.id) {
        sessionStorage.removeItem(AI_HOME_PAGE_KEY);
        setTimeout(openAIDialog, 50);
      }
    } catch (e) { /* ignore */ }
    if (locked) reqHint.textContent = '只读 · 点击需求定位原型元素';

    /* ---------- 清理 ---------- */

    currentCleanup = function () {
      finishPanelDrag();
      try { flushSave(); } catch (e) { console.warn(e); }
      try { if (sharedPollTimer) clearInterval(sharedPollTimer); } catch (e) { /* ignore */ }
      try { schedulePrototypePersist.cancel && schedulePrototypePersist.cancel(); } catch (e) { /* ignore */ }
      try { clearTimeout(missingChipTimer); } catch (e) { /* ignore */ }
      try { editor.destroy(); } catch (e) { /* ignore */ }
      try { ro.disconnect(); } catch (e) { /* ignore */ }
      document.removeEventListener('keydown', onKeyDown);
      document.body.classList.remove('link-mode', 'mode-proto', 'mode-read', 'share', 'tree-collapsed', 'dragging');
    };
  }

  /* 启动：先探测本地后端（GET /api/health），再走账号门（Auth）：
   *   无后端            → 纯本机 localStorage 模式（静态托管 / file:// 均可运行）
   *   后端 + 免鉴权     → 服务模式，全部请求以 admin 身份执行（可信内网）
   *   后端 + 多账号     → 已登录 → 同步该账号数据分片后进入
   *                      未登录 → 全屏登录/注册页，登录成功后再进入
   * 会话过期（store.js 收到 401）→ Auth.onSessionLost 弹重登页，编辑不丢 */
  (function boot() {
    var started = false;
    function start() { if (started) return; started = true; render(); }

    function syncThenRender() {
      var t = setTimeout(start, 2600);
      Promise.resolve(Store.initRemote())
        .then(function () { clearTimeout(t); start(); },
              function () { clearTimeout(t); start(); });
    }

    /* 登录 / 重新登录后的统一入口：跨账号缓存隔离 + 同步 + 渲染 */
    Auth.afterRelogin = function (user) {
      if (user && user.id) {
        /* 公共电脑换人登录：丢弃上一账号的本地缓存，防止其数据
           经「合并 + 回推」混进当前账号 */
        if (Store.cacheOwner() && Store.cacheOwner() !== user.id) Store.reset();
        Store.markCacheOwner(user.id);
      }
      Promise.resolve(Store.initRemote()).then(function () {
        if (started) render(); else start();   /* 重登：界面已在，刷新数据 */
      }, function () {
        if (started) render(); else start();
      });
    };

    /* 兜底：探测链路被网络黑洞卡住时也要能进本地模式 */
    var timer = setTimeout(function () { Auth.state.backend = false; start(); }, 3200);

    Promise.resolve(Auth.boot()).then(function (st) {
      clearTimeout(timer);
      /* 仅评审链接允许未登录打开；若它是协作编辑链接，工作区会提示登录。 */
      if (st.backend && !st.noAuth && !st.user && !/^#\/s\/[A-Za-z0-9_-]+/.test(location.hash || '')) {
        Auth.showLogin({
          onDone: function (user) { Auth.afterRelogin(user); }
        });
      } else if (st.user) {
        Auth.afterRelogin(st.user);
      } else {
        syncThenRender();
      }
    }, function () { clearTimeout(timer); start(); });
  })();
})();
