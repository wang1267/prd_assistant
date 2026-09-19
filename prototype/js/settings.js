/* ============================================================
 * ProtoReq · 设置中心（js/settings.js）
 * ------------------------------------------------------------
 * 调研结论（Excalidraw / AFFiNE / reviewjs-annotate）：
 * 轻量评审工具不建账号体系与重型后台，设置 = 一页式弹窗 + 少量分组：
 *   我的信息（评论署名） / 数据管理（导出 · 导入 · 用量 · 清空） / 关于。
 * JSON 导出 + 导入是数据三保险之一（备份 / 恢复 / 换机迁移）。
 * ============================================================ */
(function () {
  'use strict';

  var AUTHOR_KEY = 'protoReq.author.v1';
  var VERSION = '1.4.0';

  /* ---------- 署名（app.js 评论流程共用同一 localStorage 键） ---------- */

  function getAuthor() {
    try { return localStorage.getItem(AUTHOR_KEY) || ''; } catch (e) { return ''; }
  }
  function setAuthor(n) {
    try { localStorage.setItem(AUTHOR_KEY, (n || '').trim().slice(0, 24)); } catch (e) { /* ignore */ }
  }

  function fmtBytes(n) {
    if (n < 1024) return n + ' B';
    if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
    return (n / 1024 / 1024).toFixed(2) + ' MB';
  }

  /* ---------- 数据备份 / 恢复 / 清空 ---------- */

  function exportBackup() {
    var data = Store.exportAll();
    var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    var d = new Date();
    function p2(n) { return (n < 10 ? '0' : '') + n; }
    a.href = url;
    a.download = 'protoreq-backup-' + d.getFullYear() + p2(d.getMonth() + 1) + p2(d.getDate())
      + '-' + p2(d.getHours()) + p2(d.getMinutes()) + '.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 3000);
    U.toast('已导出备份（' + data.projects.length + ' 个项目 · ' + data.pages.length + ' 个页面 · ' + data.links.length + ' 条连线）', 'success');
  }

  function importBackup() {
    var input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = function () {
      var f = input.files && input.files[0];
      if (!f) return;
      var reader = new FileReader();
      reader.onload = function () {
        var data;
        try { data = JSON.parse(reader.result); }
        catch (e) { U.toast('导入失败：文件不是有效的 JSON', 'error'); return; }
        if (!data || data.v !== 1 || !Array.isArray(data.projects)) {
          U.toast('导入失败：不是 ProtoReq 备份文件（缺少项目数据）', 'error');
          return;
        }
        if (window.PRD_MODE && ['pages','documents','blocks','elements','links'].some(function (key) { return !Array.isArray(data[key]); })) {
          U.toast('导入失败：原型备份不完整，原有数据未修改', 'error'); return;
        }
        var stat = data.projects.length + ' 个项目 · ' + (data.pages || []).length + ' 个页面 · ' + (data.links || []).length + ' 条连线';
        U.confirm('将用备份（' + stat + '）替换当前浏览器中的全部数据，建议先导出现有数据作为备份。确定导入？', { danger: true, okLabel: '替换并导入' })
          .then(function (ok) {
            if (!ok) return;
            if (Store.importAll(data)) {
              U.toast('导入成功，正在刷新…', 'success');
              setTimeout(function () { location.reload(); }, 700);
            } else {
              U.toast('导入失败：浏览器存储空间不足', 'error');
            }
          });
      };
      reader.readAsText(f);
    };
    input.click();
  }

  function clearAllData() {
    U.confirm('清空将删除当前浏览器中的全部项目、页面、需求、连线与评论，不可恢复。建议先导出备份。', { danger: true, okLabel: '清空' })
      .then(function (ok) {
        if (!ok) return;
        U.confirm('再次确认：真的要清空全部数据吗？', { danger: true, okLabel: '仍然清空' })
          .then(function (ok2) {
            if (!ok2) return;
            Store.clearAll();
            U.toast('已清空，正在刷新…', 'success');
            setTimeout(function () { location.reload(); }, 700);
          });
      });
  }

  /* ---------- AI 配置（与生成弹窗共用同一份本地配置） ---------- */

  function openAIConfig() {
    if (window.PRD_MODE) {
      var config = PRD_MODE.readAIConfig();
      U.modal({ title: '沿用工作台 AI 配置', width: 480,
        body: U.el('div', {}, U.el('p', { text: '原型生成、画布 AI 修改、需求说明与连线均使用同一套工作台配置。此处不单独保存 Key。' }), U.el('p', { text: '当前模型：' + (config.model || '尚未配置') })),
        actions: [{ label: '关闭' }, { label: '去工作台修改', kind: 'primary', onClick: function () { location.href = '../PMHub.html?project=' + encodeURIComponent(PRD_MODE.projectId) + '&settings=ai'; } }] });
      return;
    }
    if (!window.AI) { U.toast('AI 模块尚未加载', 'error'); return; }
    var cfg = AI.getCfg();
    var endpoint = U.el('input', { class: 'input', type: 'text', spellcheck: 'false', value: cfg.endpoint, placeholder: 'https://api.openai.com/v1/chat/completions' });
    var apiKey = U.el('input', { class: 'input', type: 'password', spellcheck: 'false', value: cfg.apiKey, placeholder: 'API Key' });
    var model = U.el('input', { class: 'input', type: 'text', spellcheck: 'false', value: cfg.model, placeholder: 'gpt-4o-mini' });
    var thinking = U.el('select', { class: 'input' });
    [['auto', '自动兼容（推荐）'], ['disabled', '关闭深度思考'], ['enabled', '开启深度思考']].forEach(function (item) {
      thinking.append(U.el('option', { value: item[0], text: item[1] }));
    });
    thinking.value = cfg.thinking || 'auto';
    var maxTokens = U.el('input', { class: 'input', type: 'number', min: '1024', max: '131072', step: '1024', value: cfg.maxTokens || 16384 });
    var testBtn = U.el('button', { class: 'btn', text: '测试连接' });

    function save() {
      if (!endpoint.value.trim() || !apiKey.value.trim()) {
        U.toast('请填写接口地址与 API Key', 'warn');
        return false;
      }
      AI.saveCfg({
        endpoint: endpoint.value.trim(),
        apiKey: apiKey.value.trim(),
        model: model.value.trim() || 'gpt-4o-mini',
        thinking: thinking.value,
        maxTokens: Math.max(1024, Math.min(131072, parseInt(maxTokens.value, 10) || 16384))
      });
      return true;
    }
    testBtn.addEventListener('click', async function () {
      if (!save()) return;
      testBtn.disabled = true;
      testBtn.textContent = '测试中…';
      try {
        var r = await AI.testConnection();
        U.toast('连接成功 · ' + r.model, 'success');
      } catch (e) {
        U.toast((e && e.message) || '连接失败', 'error', 5000);
      } finally {
        testBtn.disabled = false;
        testBtn.textContent = '测试连接';
      }
    });
    U.modal({
      title: 'AI 配置', width: 480,
      body: U.el('div', { class: 'set-body' },
        U.el('div', { class: 'field-label', text: '接口地址' }), endpoint,
        U.el('div', { class: 'field-label', style: 'margin-top:12px', text: 'API Key' }), apiKey,
        U.el('div', { class: 'field-label', style: 'margin-top:12px', text: '模型' }), model,
        U.el('div', { class: 'field-label', style: 'margin-top:12px', text: '深度思考' }), thinking,
        U.el('div', { class: 'field-label', style: 'margin-top:12px', text: '最大输出 Token' }), maxTokens,
        U.el('div', { class: 'set-row', style: 'margin-top:14px' }, testBtn)
      ),
      actions: [
        { label: '取消' },
        { label: '保存', kind: 'primary', onClick: function (close) { if (save()) { U.toast('AI 配置已保存', 'success'); close(); } } }
      ]
    });
  }

  /* ---------- 设置弹窗 ---------- */

  function open() {
    var nameInput = U.el('input', { class: 'input', type: 'text', maxlength: '24', placeholder: '例如：李明 / 主站 PM' });
    nameInput.value = getAuthor();
    var nameSaved = U.el('span', { class: 'set-saved', text: '' });
    nameInput.addEventListener('change', function () {
      setAuthor(nameInput.value);
      nameSaved.textContent = '已保存';
      setTimeout(function () { nameSaved.textContent = ''; }, 1500);
    });

    /* 存储用量：localStorage 同源上限约 5MB（各浏览器略有差异） */
    var used = 0;
    try { used = new Blob([localStorage.getItem(window.PRD_MODE ? PRD_MODE.key : 'protoReq.db.v1') || '']).size; } catch (e) { /* ignore */ }
    var pct = Math.min(100, Math.round(used / (5 * 1024 * 1024) * 100));
    var snapshot = Store.exportAll();
    var usageText = '已用 ' + fmtBytes(used) + '（约 ' + pct + '%）· '
      + snapshot.projects.length + ' 个项目 · ' + snapshot.pages.length + ' 个页面';

    /* 多账号模式：账号信息 / 管理员入口 */
    var acctSection = null;
    if (window.Auth && Auth.isMultiUser && Auth.isMultiUser()) {
      var u = Auth.state.user;
      var isAdmin = u.role === 'admin';
      acctSection = U.el('div', { class: 'set-section' },
        U.el('div', { class: 'set-sec-title', text: '我的账号' }),
        U.el('div', { class: 'set-row acct-row' },
          U.el('span', { class: 'acct-avatar', text: (u.display_name || u.username || '?').charAt(0).toUpperCase() }),
          U.el('div', { class: 'acct-lines' },
            U.el('div', { class: 'acct-line' },
              U.el('b', { text: u.display_name || u.username }),
              U.el('span', { class: 'acct-uname', text: '@' + u.username }),
              isAdmin ? U.el('span', { class: 'adm-tag admin', text: '管理员' }) : null),
            U.el('div', { class: 'set-note', style: 'margin-top:4px', text: '数据按账号隔离保存在服务器；分享链接只包含你指定分享的那一个项目。' })
          )
        ),
        U.el('div', { class: 'set-row', style: 'margin-top:12px' },
          U.el('button', { class: 'btn', html: U.ICONS.pen + '<span>修改密码</span>', onclick: function () { Auth.changePasswordDialog(); } }),
          isAdmin ? U.el('button', { class: 'btn', html: U.ICONS.table + '<span>用户管理</span>', title: '创建 / 禁用 / 删除账号，开关注册', onclick: function () { Auth.adminPanel(); } }) : null
        )
      );
    }

    var body = U.el('div', { class: 'set-body' },

      U.el('div', { class: 'set-section' },
        U.el('div', { class: 'set-sec-title', text: '我的信息' }),
        U.el('div', { class: 'field-label', text: '显示名' }),
        U.el('div', { class: 'set-row' }, nameInput, nameSaved)
      ),

      U.el('div', { class: 'set-section' },
        U.el('div', { class: 'set-sec-title', text: 'AI' }),
        U.el('div', { class: 'set-row' },
          U.el('button', { class: 'btn', html: U.ICONS.spark + '<span>配置 AI</span>', onclick: openAIConfig })
        )
      ),

      acctSection,

      U.el('div', { class: 'set-section' },
        U.el('div', { class: 'set-sec-title', text: window.PRD_MODE ? '当前 PRD 的原型备份' : '数据管理' }),
        U.el('div', { class: 'set-storage-bar' },
          U.el('div', { class: 'set-storage-fill' + (pct > 80 ? ' hot' : ''), style: 'width:' + Math.max(pct, 1.5) + '%' })),
        U.el('div', { class: 'set-storage-text', text: usageText + (Store.isRemote() ? ' · 已同步到服务器' : ' · 仅此浏览器') }),
        U.el('div', { class: 'set-row', style: 'margin-top:12px' },
          U.el('button', { class: 'btn', html: U.ICONS.download + '<span>导出备份</span>', title: '下载 JSON 备份文件，可跨浏览器 / 跨设备恢复', onclick: exportBackup }),
          U.el('button', { class: 'btn', html: U.ICONS.upload + '<span>导入数据</span>', title: '从备份 JSON 恢复（替换当前数据）', onclick: importBackup })
        ),
        U.el('div', { class: 'set-danger-row' },
          U.el('span', { class: 'set-danger-hint', text: window.PRD_MODE ? '清空当前 PRD 的原型数据（不可恢复）' : '清空全部数据（不可恢复）' }),
          U.el('button', { class: 'btn btn-danger-ghost', text: '清空', onclick: clearAllData })
        )
      ),

      U.el('div', { class: 'set-section' },
        U.el('div', { class: 'set-sec-title', text: '关于' }),
        U.el('div', { class: 'set-about', html:
          (window.PRD_MODE ? 'PMHub · 原型' : 'ProtoReq v' + VERSION) + ' · <b>?</b> 快捷键' })
      )
    );

    U.modal({
      title: '设置', width: 480,
      body: body,
      actions: [{ label: '完成', kind: 'primary', onClick: function (close) { setAuthor(nameInput.value); close(); } }]
    });
    setTimeout(function () { nameInput.focus(); }, 30);
  }

  window.Settings = { open: open, openAIConfig: openAIConfig, getAuthor: getAuthor, setAuthor: setAuthor, VERSION: VERSION };
})();
