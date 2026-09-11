/* ============================================================
 * auth.js · 账号体系前端（多账号模式，与 server.py 账号端点配对）
 * ------------------------------------------------------------
 * 职责：
 *   1. 启动探测：/api/health → /api/auth/config → /api/auth/me，
 *      决定「多账号模式 / 免鉴权模式 / 纯本地模式」
 *   2. 登录 / 注册全屏页（未登录时挡在应用前面）
 *   3. 会话过期重登（store.js PUT /api/db 收到 401 时回调）
 *   4. 顶栏账号菜单：修改密码 / 用户管理（管理员）/ 退出登录
 *   5. 项目分享：生成 token 链接（#/s/<token>）+ 撤销
 *   6. 分享落地页：#/<token> → 展示项目名片 → 一键导入我的库
 *
 * 数据隔离（对应用户诉求「分享一个项目，但对方看不到我的库」）：
 *   - 每个账号一个独立数据分片，GET /api/db 只返回自己的
 *   - 分享 token 只携带单个项目快照，导入即换 ID 复制，双向解耦
 *   - 浏览器缓存按账号归属（cacheOwner），切换账号自动丢弃旧缓存
 * ============================================================ */
(function () {
  'use strict';

  var state = {
    backend: false,        /* 是否有本地后端（server.py） */
    noAuth: false,         /* 后端是否免鉴权（可信内网） */
    user: null,            /* 当前登录用户 {id, username, display_name, role} */
    registrationOpen: true /* 是否开放注册 */
  };

  /* ---------- 基础请求（同源 Cookie 会话） ---------- */

  function api(method, path, body) {
    var opts = { method: method, credentials: 'same-origin', cache: 'no-store' };
    if (body !== undefined) {
      opts.headers = { 'Content-Type': 'application/json' };
      opts.body = JSON.stringify(body);
    }
    return fetch(path, opts)
      .then(function (r) {
        return r.json().catch(function () { return null; }).then(function (data) {
          return { status: r.status, data: data };
        });
      })
      .catch(function () { return { status: 0, data: null }; });
  }

  function errText(r, fallback) {
    return (r && r.data && r.data.error) || fallback || '请求失败，请稍后再试';
  }

  /* ---------- 启动探测 ---------- */

  function boot() {
    if (location.protocol === 'file:') {
      state.backend = false;
      return Promise.resolve(state);
    }
    return fetch('/api/health', { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; })
      .then(function (h) {
        if (!h || !h.ok) {
          state.backend = false;
          return state;
        }
        state.backend = true;
        return api('GET', '/api/auth/config').then(function (r) {
          var cfg = (r.status === 200 && r.data) || {};
          state.noAuth = !!cfg.no_auth;
          state.registrationOpen = cfg.registration_open !== false;
          if (state.noAuth) return state;   /* 免鉴权：无账号概念，直接进 */
          return api('GET', '/api/auth/me').then(function (r2) {
            state.user = (r2.status === 200 && r2.data && r2.data.user) || null;
            return state;
          });
        });
      });
  }

  function isMultiUser() {
    return state.backend && !state.noAuth && !!state.user;
  }

  /* ============================================================
   * 登录 / 注册全屏页
   * ============================================================ */

  var overlayEl = null;   /* 当前登录覆盖层（防重复弹出） */

  function showLogin(opts) {
    opts = opts || {};
    if (overlayEl) return;

    var mode = 'login';   /* login | register */
    var errBox = U.el('div', { class: 'auth-err', hidden: true });
    var submitBtn = U.el('button', { class: 'btn btn-primary auth-submit', type: 'submit', text: '登 录' });

    var userIn = U.el('input', { class: 'input', type: 'text', placeholder: '用户名', autocomplete: 'username', spellcheck: 'false' });
    var pwIn = U.el('input', { class: 'input', type: 'password', placeholder: '密码（至少 6 位）', autocomplete: 'current-password' });
    var nameIn = U.el('input', { class: 'input', type: 'text', placeholder: '显示名（选填，评论署名用）', maxlength: '24' });
    var pw2In = U.el('input', { class: 'input', type: 'password', placeholder: '再次输入密码' });
    var nameRow = fieldRow('显示名', nameIn);
    var pw2Row = fieldRow('确认密码', pw2In);
    nameRow.hidden = pw2Row.hidden = true;

    var tabLogin = U.el('button', { class: 'auth-tab active', type: 'button', text: '登录' });
    var tabReg = U.el('button', { class: 'auth-tab', type: 'button', text: '注册新账号' });
    if (!state.registrationOpen) tabReg.hidden = true;

    function setMode(m) {
      mode = m;
      tabLogin.classList.toggle('active', m === 'login');
      tabReg.classList.toggle('active', m === 'register');
      nameRow.hidden = pw2Row.hidden = (m !== 'register');
      submitBtn.textContent = m === 'login' ? '登 录' : '创建账号';
      errBox.hidden = true;
    }
    tabLogin.addEventListener('click', function () { setMode('login'); userIn.focus(); });
    tabReg.addEventListener('click', function () { setMode('register'); userIn.focus(); });

    function showErr(msg) {
      errBox.textContent = msg;
      errBox.hidden = false;
    }

    function close(user) {
      if (overlayEl) { overlayEl.remove(); overlayEl = null; }
      if (user && opts.onDone) opts.onDone(user);
    }

    var form = U.el('form', { class: 'auth-form' },
      fieldRow('用户名', userIn),
      fieldRow('密码', pwIn),
      nameRow,
      pw2Row,
      errBox,
      submitBtn
    );
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var username = userIn.value.trim();
      var password = pwIn.value;
      if (!/^[a-zA-Z0-9_-]{3,24}$/.test(username)) {
        showErr('用户名需 3-24 位字母 / 数字 / 下划线 / 短横线'); return;
      }
      if (password.length < 6) { showErr('密码至少 6 位'); return; }
      if (mode === 'register' && password !== pw2In.value) {
        showErr('两次输入的密码不一致'); return;
      }
      submitBtn.disabled = true;
      submitBtn.textContent = mode === 'login' ? '登录中…' : '创建中…';
      var req = mode === 'login'
        ? api('POST', '/api/auth/login', { username: username, password: password })
        : api('POST', '/api/auth/register', { username: username, password: password, display_name: nameIn.value });
      req.then(function (r) {
        if (r.status === 200 && r.data && r.data.ok) {
          state.user = r.data.user;
          close(state.user);
          return;
        }
        submitBtn.disabled = false;
        submitBtn.textContent = mode === 'login' ? '登 录' : '创建账号';
        showErr(errText(r, '操作失败，请稍后再试'));
        if (r.status === 403 && mode === 'register') tabReg.hidden = true;
        if (mode === 'login') pwIn.select();
      });
    });

    var card = U.el('div', { class: 'auth-card' },
      U.el('div', { class: 'auth-brand' },
        U.el('span', { class: 'brand-logo', html: '<svg viewBox="0 0 48 48" width="26" height="26" aria-hidden="true"><defs><linearGradient id="auth-a" x1="0" x2="1" y1="0" y2="1"><stop stop-color="#2462ff"/><stop offset="1" stop-color="#6625f5"/></linearGradient></defs><path d="M11 17 27 8c2.7-1.5 6 .4 6 3.5v20c0 2.2-2.3 3.7-4.3 2.6l-15.7-9A4.1 4.1 0 0 1 11 21.6V20c0-1.3.7-2.4 2-3Z" fill="url(#auth-a)"/><path d="m25 21 10 5.7c1.3.8 2.1 2.1 2.1 3.7v7.3c0 3-3.2 4.9-5.8 3.4l-12.2-7A4.1 4.1 0 0 1 17 30.5v-8c0-3 3.2-4.9 5.8-3.4Z" fill="#a6baff" fill-opacity=".82"/></svg>' }),
        U.el('span', { class: 'auth-brand-name', text: 'PMHub' })
      ),
      U.el('div', { class: 'auth-title', text: opts.title || '登录工作台' }),
      opts.reason ? U.el('div', { class: 'auth-reason', text: opts.reason }) : null,
      U.el('div', { class: 'auth-tabs' }, tabLogin, tabReg),
      form,
      U.el('div', {
        class: 'auth-foot',
        text: '数据按账号隔离 · 分享链接只包含你指定的那一个项目'
      })
    );

    overlayEl = U.el('div', { class: 'auth-overlay' }, card);
    document.body.append(overlayEl);
    setTimeout(function () { userIn.focus(); }, 60);
  }

  function fieldRow(label, inputEl) {
    return U.el('div', { class: 'auth-field' },
      U.el('div', { class: 'field-label', text: label }), inputEl);
  }

  /* 会话过期（store.js 401 回调）：弹重登页，当前编辑保留在浏览器，登录后自动同步 */
  function onSessionLost() {
    if (!state.backend || state.noAuth) return;
    if (overlayEl) return;   /* 已在登录页 */
    showLogin({
      title: '重新登录',
      reason: '登录已过期。你刚才的编辑仍保留在本浏览器，登录后会自动同步，不会丢失。',
      onDone: function (user) {
        if (window.Auth && Auth.afterRelogin) Auth.afterRelogin(user);
      }
    });
  }

  /* ---------- 退出登录 ---------- */

  function logout() {
    U.confirm('退出当前账号？本浏览器会清空缓存，数据仍在服务器上，随时可以重新登录。', { okLabel: '退出' })
      .then(function (ok) {
        if (!ok) return;
        api('POST', '/api/auth/logout').then(function () {
          try {
            Store.reset();
            Store.markCacheOwner('');
          } catch (e) { /* ignore */ }
          location.hash = '#/';
          location.reload();
        });
      });
  }

  /* ============================================================
   * 顶栏账号按钮 + 菜单
   * ============================================================ */

  function accountButton() {
    var u = state.user;
    if (!u) return null;
    var btn = U.el('button', {
      class: 'acct-btn', type: 'button',
      title: '账号：' + (u.display_name || u.username) + (u.role === 'admin' ? '（管理员）' : '')
    },
      U.el('span', { class: 'acct-avatar', text: (u.display_name || u.username || '?').charAt(0).toUpperCase() }),
      U.el('span', { class: 'acct-name', text: u.display_name || u.username }),
      U.el('span', { class: 'acct-caret', html: U.ICONS.chevronD })
    );
    btn.addEventListener('click', function (e) {
      openAccountMenu(e.currentTarget, u);
    });
    return btn;
  }

  function openAccountMenu(anchor, u) {
    var items = [];
    if (u.role === 'admin') {
      items.push({ label: '用户管理', icon: U.ICONS.table, badge: '管理员', onClick: function () { adminPanel(); } });
      items.push('-');
    }
    items.push({ label: '修改密码', icon: U.ICONS.pen, onClick: function () { changePasswordDialog(); } });
    items.push('-');
    items.push({ label: '退出登录', icon: U.ICONS.external, danger: true, onClick: logout });
    U.menu(items, anchor.getBoundingClientRect(), { align: 'right' });
  }

  /* ---------- 修改密码 ---------- */

  function changePasswordDialog() {
    var oldIn = U.el('input', { class: 'input', type: 'password', placeholder: '当前密码', autocomplete: 'current-password' });
    var newIn = U.el('input', { class: 'input', type: 'password', placeholder: '新密码（至少 6 位）', autocomplete: 'new-password' });
    var new2In = U.el('input', { class: 'input', type: 'password', placeholder: '再次输入新密码', autocomplete: 'new-password' });
    var errBox = U.el('div', { class: 'auth-err', hidden: true });
    var submitBtn = U.el('button', { class: 'btn btn-primary', text: '修改密码' });

    function submit(close) {
      if (newIn.value.length < 6) { errBox.textContent = '新密码至少 6 位'; errBox.hidden = false; return; }
      if (newIn.value !== new2In.value) { errBox.textContent = '两次输入的新密码不一致'; errBox.hidden = false; return; }
      submitBtn.disabled = true;
      api('POST', '/api/auth/password', { old_password: oldIn.value, new_password: newIn.value })
        .then(function (r) {
          submitBtn.disabled = false;
          if (r.status === 200 && r.data && r.data.ok) {
            close();
            U.toast('密码已修改，其他设备的登录已全部注销', 'success');
            return;
          }
          errBox.textContent = errText(r, '修改失败，请稍后再试');
          errBox.hidden = false;
        });
    }

    var m = U.modal({
      title: '修改密码',
      body: U.el('div', {},
        fieldRow('当前密码', oldIn),
        U.el('div', { style: 'height:12px' }),
        fieldRow('新密码', newIn),
        U.el('div', { style: 'height:12px' }),
        fieldRow('确认新密码', new2In),
        errBox
      ),
      actions: [
        { label: '取消' },
        { label: '修改密码', kind: 'primary', onClick: function (close) { submit(close); } }
      ]
    });
    setTimeout(function () { oldIn.focus(); }, 40);
    [oldIn, newIn, new2In].forEach(function (el) {
      el.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') submit(m.close);
      });
    });
  }

  /* ============================================================
   * 管理员面板：用户管理
   * ============================================================ */

  function adminPanel() {
    var wrap = U.el('div', { class: 'adm-wrap' }, U.el('div', { class: 'adm-loading', text: '正在加载用户…' }));
    U.modal({
      title: '用户管理 · 管理员', wide: true, width: 720,
      body: wrap,
      actions: [{ label: '关闭', kind: 'primary' }]
    });

    function refresh() {
      api('GET', '/api/admin/users').then(function (r) {
        wrap.innerHTML = '';
        if (r.status !== 200 || !r.data || !r.data.ok) {
          wrap.append(U.el('div', { class: 'adm-empty', text: errText(r, '加载失败') }));
          return;
        }
        renderAll(r.data);
      });
    }

    function renderAll(d) {
      /* 顶部操作行：注册开关 + 新建用户 */
      var regBtn = U.el('button', {
        class: 'btn btn-sm', type: 'button',
        text: d.registration_open ? '关闭注册' : '开放注册',
        title: '控制登录页是否允许自主注册新账号',
        onclick: function () {
          regBtn.disabled = true;
          api('POST', '/api/admin/settings', { registration_open: !d.registration_open }).then(function (r) {
            if (r.status === 200 && r.data && r.data.ok) {
              state.registrationOpen = !d.registration_open;
              U.toast(d.registration_open ? '已关闭注册，新用户需由你创建' : '已开放注册', 'success');
              refresh();
            } else {
              regBtn.disabled = false;
              U.toast(errText(r, '操作失败'), 'error');
            }
          });
        }
      });
      var head = U.el('div', { class: 'adm-head' },
        U.el('span', { class: 'adm-count', text: '共 ' + d.users.length + ' 个账号' }),
        U.el('div', { class: 'adm-head-btns' },
          regBtn,
          U.el('button', { class: 'btn btn-sm btn-primary', html: U.ICONS.plus + '<span>新建用户</span>', onclick: function () { createUserDialog(refresh); } })
        )
      );
      wrap.append(head);

      if (!d.users.length) {
        wrap.append(U.el('div', { class: 'adm-empty', text: '暂无用户' }));
        return;
      }

      var thead = U.el('div', { class: 'adm-row adm-row-head' },
        U.el('span', { text: '用户名' }),
        U.el('span', { text: '显示名' }),
        U.el('span', { text: '角色' }),
        U.el('span', { text: '状态' }),
        U.el('span', { text: '项目' }),
        U.el('span', { text: '创建时间' }),
        U.el('span', { text: '' })
      );
      var list = U.el('div', { class: 'adm-list' }, thead);
      d.users.forEach(function (u) {
        list.append(userRow(u));
      });
      wrap.append(list);
      wrap.append(U.el('div', {
        class: 'set-note',
        text: '禁用：立即踢下线且无法登录，数据保留；删除：连同其全部项目数据一起清除，不可恢复。'
      }));
    }

    function userRow(u) {
      var status = u.disabled
        ? U.el('span', { class: 'adm-tag off', text: '已禁用' })
        : U.el('span', { class: 'adm-tag ok', text: '正常' });
      var role = U.el('span', { class: 'adm-tag' + (u.role === 'admin' ? ' admin' : ''), text: u.role === 'admin' ? '管理员' : '成员' });
      var moreBtn = U.el('button', { class: 'icon-btn', title: '操作', html: U.ICONS.dots });
      moreBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        var items = [
          { label: '重置密码', icon: U.ICONS.pen, onClick: function () { resetPasswordDialog(u, refresh); } },
          {
            label: u.disabled ? '启用账号' : '禁用账号', icon: U.ICONS.warn,
            onClick: function () {
              var act = u.disabled ? '启用' : '禁用';
              U.confirm(act + '账号「' + u.username + '」？' + (u.disabled ? '' : '禁用后该用户会立即下线，无法登录，数据保留。'), { okLabel: act })
                .then(function (ok) {
                  if (!ok) return;
                  api('POST', '/api/admin/users/' + u.id + '/disabled', { disabled: !u.disabled }).then(function (r) {
                    if (r.status === 200 && r.data && r.data.ok) { U.toast('已' + act, 'success'); refresh(); }
                    else U.toast(errText(r, '操作失败'), 'error');
                  });
                });
            }
          },
          '-',
          {
            label: '删除用户', icon: U.ICONS.trash, danger: true, onClick: function () {
              U.confirm('删除用户「' + u.username + '」？其名下 ' + u.projects + ' 个项目及全部数据将被永久删除，不可恢复。', { danger: true, okLabel: '删除' })
                .then(function (ok) {
                  if (!ok) return;
                  api('DELETE', '/api/admin/users/' + u.id).then(function (r) {
                    if (r.status === 200 && r.data && r.data.ok) { U.toast('用户已删除', 'success'); refresh(); }
                    else U.toast(errText(r, '操作失败'), 'error');
                  });
                });
            }
          }
        ];
        U.menu(items, moreBtn.getBoundingClientRect());
      });
      return U.el('div', { class: 'adm-row' },
        U.el('span', { class: 'adm-uname', text: u.username }),
        U.el('span', { text: u.display_name || '-' }),
        role,
        status,
        U.el('span', { text: String(u.projects) }),
        U.el('span', { class: 'adm-time', text: U.fmtDT(u.created_at || 0) }),
        moreBtn
      );
    }

    refresh();
  }

  function createUserDialog(onDone) {
    var userIn = U.el('input', { class: 'input', type: 'text', placeholder: '登录用户名（3-24 位字母 / 数字 / _ -）', spellcheck: 'false' });
    var nameIn = U.el('input', { class: 'input', type: 'text', placeholder: '显示名（选填）', maxlength: '24' });
    var pwIn = U.el('input', { class: 'input', type: 'password', placeholder: '初始密码（至少 6 位）' });
    var pw2In = U.el('input', { class: 'input', type: 'password', placeholder: '再次输入密码' });
    var roleSel = U.el('select', { class: 'input' },
      U.el('option', { value: 'user', text: '普通成员' }),
      U.el('option', { value: 'admin', text: '管理员' })
    );
    var errBox = U.el('div', { class: 'auth-err', hidden: true });
    var submitBtn = U.el('button', { class: 'btn btn-primary', text: '创建' });

    function submit(close) {
      if (!/^[a-zA-Z0-9_-]{3,24}$/.test(userIn.value.trim())) { errBox.textContent = '用户名需 3-24 位字母 / 数字 / 下划线 / 短横线'; errBox.hidden = false; return; }
      if (pwIn.value.length < 6) { errBox.textContent = '密码至少 6 位'; errBox.hidden = false; return; }
      if (pwIn.value !== pw2In.value) { errBox.textContent = '两次输入的密码不一致'; errBox.hidden = false; return; }
      submitBtn.disabled = true;
      api('POST', '/api/admin/users', {
        username: userIn.value.trim(), password: pwIn.value,
        display_name: nameIn.value, role: roleSel.value
      }).then(function (r) {
        submitBtn.disabled = false;
        if (r.status === 200 && r.data && r.data.ok) {
          close();
          U.toast('用户已创建，请把初始密码告知对方', 'success');
          onDone();
          return;
        }
        errBox.textContent = errText(r, '创建失败');
        errBox.hidden = false;
      });
    }

    var m = U.modal({
      title: '新建用户',
      body: U.el('div', {},
        fieldRow('用户名', userIn),
        U.el('div', { style: 'height:12px' }),
        fieldRow('显示名', nameIn),
        U.el('div', { style: 'height:12px' }),
        fieldRow('初始密码', pwIn),
        U.el('div', { style: 'height:12px' }),
        fieldRow('确认密码', pw2In),
        U.el('div', { style: 'height:12px' }),
        fieldRow('角色', roleSel),
        errBox
      ),
      actions: [
        { label: '取消' },
        { label: '创建', kind: 'primary', onClick: function (close) { submit(close); } }
      ]
    });
    setTimeout(function () { userIn.focus(); }, 40);
    userIn.addEventListener('keydown', function (e) { if (e.key === 'Enter') submit(m.close); });
  }

  function resetPasswordDialog(u, onDone) {
    var pwIn = U.el('input', { class: 'input', type: 'password', placeholder: '新密码（至少 6 位）' });
    var errBox = U.el('div', { class: 'auth-err', hidden: true });
    var submitBtn = U.el('button', { class: 'btn btn-primary', text: '重置' });
    function submit(close) {
      if (pwIn.value.length < 6) { errBox.textContent = '密码至少 6 位'; errBox.hidden = false; return; }
      submitBtn.disabled = true;
      api('POST', '/api/admin/users/' + u.id + '/password', { password: pwIn.value }).then(function (r) {
        submitBtn.disabled = false;
        if (r.status === 200 && r.data && r.data.ok) {
          close();
          U.toast('已重置「' + u.username + '」的密码，其所有登录已注销', 'success');
          onDone();
          return;
        }
        errBox.textContent = errText(r, '重置失败');
        errBox.hidden = false;
      });
    }
    var m = U.modal({
      title: '重置密码 · ' + u.username,
      body: U.el('div', {},
        fieldRow('新密码', pwIn),
        errBox,
        U.el('div', { class: 'set-note', text: '重置后该用户在所有设备上的登录都会被注销，需要用新密码重新登录。' })
      ),
      actions: [
        { label: '取消' },
        { label: '重置', kind: 'primary', onClick: function (close) { submit(close); } }
      ]
    });
    setTimeout(function () { pwIn.focus(); }, 40);
    pwIn.addEventListener('keydown', function (e) { if (e.key === 'Enter') submit(m.close); });
  }

  /* ============================================================
   * 项目分享（多账号模式）：token 链接 + 撤销
   * ============================================================ */

  function shareBase() {
    return (location.origin && location.origin !== 'null')
      ? location.origin + location.pathname
      : location.href.split('#')[0];
  }

  function shareProjectDialog(project) {
    var body = U.el('div', { class: 'share-pj' });
    U.modal({ title: '分享项目 · ' + project.name, width: 560, body: body, actions: [{ label: '关闭', kind: 'primary' }] });

    function card(s, redraw) {
      var access = s.access === 'edit' ? '可协作编辑' : '仅评审';
      var url = shareBase() + '#/s/' + s.token;
      var input = U.el('input', { class: 'input', readonly: 'readonly', value: url, onclick: function () { input.select(); } });
      var revoke = U.el('button', { class: 'btn btn-sm btn-danger-ghost', text: '撤销', onclick: function () {
        U.confirm('撤销后此链接立即失效。', { danger: true, okLabel: '撤销' }).then(function (ok) {
          if (!ok) return;
          api('DELETE', '/api/shares/' + s.token).then(function (r) { if (r.status === 200 && r.data && r.data.ok) { U.toast('链接已撤销', 'success'); redraw(); } else U.toast(errText(r, '撤销失败'), 'error'); });
        });
      } });
      return U.el('div', { class: 'chg-item' },
        U.el('div', { class: 'set-row', style: 'justify-content:space-between' }, U.el('b', { text: access }), revoke),
        U.el('div', { class: 'set-row', style: 'margin-top:8px' }, input, U.el('button', { class: 'btn btn-sm', text: '复制', onclick: function () { U.copyText(url).then(function (ok) { U.toast(ok ? '链接已复制' : '复制失败', ok ? 'success' : 'error'); }); } })),
        U.el('div', { class: 'set-note', text: s.access === 'edit' ? '协作者登录后在同一项目中共同修改，系统会自动同步更新。' : '任何拿到链接的人都可以查看与评审，不能修改。' })
      );
    }

    function redraw() {
      body.innerHTML = '';
      api('GET', '/api/shares/mine').then(function (r) {
        var mine = ((r.status === 200 && r.data && r.data.shares) || []).filter(function (s) { return s.project_id === project.id && (s.access === 'view' || s.access === 'edit'); });
        var access = U.el('select', { class: 'input' }, U.el('option', { value: 'view', text: '仅评审（不可编辑）' }), U.el('option', { value: 'edit', text: '协作编辑（需登录）' }));
        var create = U.el('button', { class: 'btn btn-primary', text: '生成链接' });
        create.addEventListener('click', function () {
          create.disabled = true;
          api('POST', '/api/shares', { project_id: project.id, access: access.value }).then(function (r2) {
            if (r2.status === 200 && r2.data && r2.data.ok) { U.toast(r2.data.created ? '链接已生成' : '复用已有链接', 'success'); redraw(); }
            else { create.disabled = false; U.toast(errText(r2, '生成失败'), 'error'); }
          });
        });
        body.append(U.el('div', { class: 'share-note', text: '选择链接权限。协作编辑使用同一项目数据，不会复制为各自独立副本。' }), U.el('div', { class: 'set-row', style: 'margin:12px 0 16px' }, access, create));
        if (mine.length) mine.forEach(function (s) { body.append(card(s, redraw)); });
        else body.append(U.el('div', { class: 'chg-empty', text: '还没有分享链接' }));
      });
    }
    redraw();
  }

  /* ============================================================
   * 分享落地页：#/s/<token>
   * ============================================================ */

  function renderImportShare(app, token) {
    document.title = '分享的项目 · PMHub';
    document.body.className = '';
    var wrap = U.el('div', { class: 'imp-wrap' },
      U.el('div', { class: 'imp-loading', text: '正在加载分享内容…' }));
    app.append(wrap);

    api('GET', '/api/share/' + token).then(function (r) {
      wrap.innerHTML = '';
      if (r.status !== 200 || !r.data || !r.data.ok) {
        wrap.append(impError(errText(r, '分享链接不存在或已被撤销')));
        return;
      }
      var meta = r.data;
      var counts = meta.counts || {};
      var pageChips = (meta.pages || []).slice(0, 12).map(function (n) {
        return U.el('span', { class: 'imp-chip', text: n });
      });
      var importBtn = U.el('button', { class: 'btn btn-primary btn-lg', html: U.ICONS.download + '<span>导入到我的项目库</span>' });
      importBtn.addEventListener('click', function () {
        importBtn.disabled = true;
        importBtn.textContent = '正在导入…';
        api('POST', '/api/share/' + token + '/import').then(function (r2) {
          if (r2.status !== 200 || !r2.data || !r2.data.ok) {
            importBtn.disabled = false;
            importBtn.innerHTML = U.ICONS.download + '<span>导入到我的项目库</span>';
            U.toast(errText(r2, '导入失败'), 'error');
            return;
          }
          /* 导入成功：重新拉取我的数据分片（含新副本）再跳转 */
          Promise.resolve(Store.initRemote()).then(function () {
            U.toast(r2.data.imported ? '项目已导入你的项目库' : '该项目已在你的库中，直接打开', 'success');
            location.hash = '#/p/' + r2.data.project_id;
          }, function () {
            U.toast('已导入，同步稍后自动完成', 'success');
            location.hash = '#/p/' + r2.data.project_id;
          });
        });
      });

      wrap.append(U.el('div', { class: 'imp-card' },
        U.el('div', { class: 'imp-owner', text: (meta.owner_name || '某位产品经理') + ' 分享给你的项目' }),
        U.el('div', { class: 'imp-name', text: meta.project.name }),
        meta.project.description ? U.el('div', { class: 'imp-desc', text: meta.project.description }) : null,
        pageChips.length ? U.el('div', { class: 'imp-chips' }, pageChips) : null,
        U.el('div', { class: 'imp-meta', text: (counts.pages || 0) + ' 个页面 · ' + (counts.blocks || 0) + ' 个需求块 · ' + (counts.links || 0) + ' 条连线' }),
        U.el('div', { class: 'imp-divider' }),
        importBtn,
        U.el('div', {
          class: 'imp-note',
          html: '项目会以<b>可编辑副本</b>加入你的项目库，与分享者之后各自的修改互不影响；你也不会看到对方的任何其他项目。'
        })
      ));
    });
  }

  function impError(msg) {
    return U.el('div', { class: 'imp-card imp-error-card' },
      U.el('div', { class: 'empty-ico small', html: U.ICONS.warn }),
      U.el('div', { class: 'empty-title', text: '无法打开这个分享' }),
      U.el('div', { class: 'empty-desc', text: msg }),
      U.el('div', { class: 'empty-actions' },
        U.el('button', { class: 'btn', text: '返回主页', onclick: function () { location.hash = '#/'; } })
      )
    );
  }

  /* ---------- 导出 ---------- */

  window.Auth = {
    state: state,
    boot: boot,
    isMultiUser: isMultiUser,
    showLogin: showLogin,
    onSessionLost: onSessionLost,
    afterRelogin: null,          /* app.js 注入：登录/重登后的同步 + 重渲染 */
    accountButton: accountButton,
    changePasswordDialog: changePasswordDialog,
    adminPanel: adminPanel,
    shareProjectDialog: shareProjectDialog,
    renderImportShare: renderImportShare
  };
})();
