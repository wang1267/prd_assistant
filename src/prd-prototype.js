(function () {
  'use strict';
  var modal, frame, project, html = '', savedHtml = '', session, selected = false, busy = false, revision = 0;
  var $ = function (id) { return document.getElementById('pp-' + id); };
  function notify(text) { $('status').textContent = text; }
  function clean(source) {
    if (String(source).length > 800000) throw new Error('原型超过 800 KB，请简化后重试');
    var match = String(source).match(/```(?:html)?\s*([\s\S]*?)```/i);
    source = match ? match[1] : source;
    if (!/<body[\s>]/i.test(source) || !/<\/html>/i.test(source)) throw new Error('未返回完整 HTML 原型，原页面未替换，请重试');
    var doc = new DOMParser().parseFromString(source, 'text/html');
    doc.querySelectorAll('script,iframe,object,embed,link,meta,base,svg,math,template').forEach(function (el) { el.remove(); });
    doc.querySelectorAll('*').forEach(function (el) {
      Array.from(el.attributes).forEach(function (attr) {
        if (!/^(class|id|style|type|value|placeholder|title|role|aria-[\w-]+|colspan|rowspan|disabled|checked|selected|for|name|rows|cols|maxlength)$/i.test(attr.name)) el.removeAttribute(attr.name);
      });
      if (el.tagName === 'INPUT' && el.type === 'file') el.type = 'text';
    });
    return '<!doctype html>\n' + doc.documentElement.outerHTML;
  }
  function render() {
    selected = false; $('font').disabled = $('color').disabled = true;
    session = crypto.randomUUID();
    if (!html) { frame.srcdoc = '<p style="font:16px system-ui;padding:24px">还没有原型。点击“根据 PRD 生成”，生成后可直接编辑文字。</p>'; return; }
    var doc = new DOMParser().parseFromString(html, 'text/html'), nonce = crypto.randomUUID();
    var policy = doc.createElement('meta'); policy.httpEquiv = 'Content-Security-Policy';
    policy.content = "default-src 'none'; script-src 'nonce-" + nonce + "'; style-src 'unsafe-inline'; form-action 'none'; base-uri 'none'";
    doc.head.prepend(policy);
    var script = doc.createElement('script'); script.setAttribute('nonce', nonce);
    script.textContent = '(' + bridge.toString() + ')(' + JSON.stringify(session) + ')';
    doc.head.append(script);
    frame.srcdoc = '<!doctype html>' + doc.documentElement.outerHTML;
  }
  function bridge(token) {
    var active;
    function send() {
      var clone = document.documentElement.cloneNode(true);
      clone.querySelectorAll('script,meta').forEach(function (el) { el.remove(); });
      clone.querySelectorAll('[contenteditable]').forEach(function (el) { el.removeAttribute('contenteditable'); });
      parent.postMessage({ kind: 'prd-prototype', token: token, html: '<!doctype html>' + clone.outerHTML }, '*');
    }
    document.addEventListener('click', function (event) {
      event.preventDefault();
      var el = event.target;
      if (!(el instanceof HTMLElement) || /^(HTML|BODY|STYLE)$/.test(el.tagName)) return;
      if (active) active.removeAttribute('contenteditable');
      active = el;
      // Editing only leaf text prevents a click on a container from replacing a whole layout.
      if (!el.children.length && !/^(INPUT|SELECT|TEXTAREA|IMG|BR|HR)$/.test(el.tagName)) { el.contentEditable = 'true'; el.focus(); }
      parent.postMessage({ kind: 'prd-prototype', token: token, selected: true }, '*');
    }, true);
    document.addEventListener('input', send);
    document.addEventListener('paste', function (event) {
      if (!active || !active.isContentEditable) return;
      event.preventDefault(); document.execCommand('insertText', false, event.clipboardData.getData('text/plain'));
    });
    document.addEventListener('submit', function (event) { event.preventDefault(); });
    window.addEventListener('message', function (event) {
      var data = event.data;
      if (event.source !== parent || !data || data.token !== token || !active) return;
      if (data.font && Number(data.font) >= 10 && Number(data.font) <= 80) active.style.fontSize = Number(data.font) + 'px';
      if (/^#[\da-f]{6}$/i.test(data.color || '')) active.style.color = data.color;
      send();
    });
  }
  function controls() {
    ['generate','save','restore','prompt'].forEach(function (id) { $(id).disabled = busy; });
    $('stop').disabled = !busy;
    $('save').disabled = busy || !html;
    $('export').disabled = !html;
    frame.style.pointerEvents = busy ? 'none' : '';
  }
  function open() {
    if (!currentProj()) { alert('请先新建或打开一个 PRD 项目'); return; }
    if (!modal) init();
    project = currentProj(); html = project.prototype && project.prototype.html || ''; savedHtml = html;
    revision = project.prototype && project.prototype.revision || 0;
    $('title').textContent = project.name + ' · 原型'; $('prompt').value = '';
    modal.showModal(); render(); controls();
    notify(html ? '已打开本项目原型。点击文字直接编辑，选择元素后可调整字号和文字颜色。' : '从当前 PRD 生成核心页面，可补充“只做首页”“移动端”等要求。');
  }
  function init() {
    modal = document.createElement('dialog'); modal.id = 'prdPrototypeDialog';
    modal.style.cssText = 'width:min(1200px,96vw);max-width:96vw;height:92vh;border:1px solid #bbc8c9;border-radius:16px;padding:20px;color:inherit;background:var(--bg,#fff)';
    modal.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center"><h2 id="pp-title"></h2><button id="pp-close" aria-label="关闭原型">关闭</button></div><p>页面视觉原型：直接点击文字编辑；不执行脚本或连接真实业务，PRD 正文不会被修改。</p><label for="pp-prompt">生成或修改要求（可选）</label><input id="pp-prompt" style="width:100%;box-sizing:border-box" maxlength="3000" placeholder="例如：只生成移动端首页；把主按钮改成绿色"><div style="display:flex;gap:8px;flex-wrap:wrap;margin:12px 0"><button id="pp-generate">根据 PRD 生成 / AI 修改</button><button id="pp-stop" disabled>停止</button><label>元素字号 <input id="pp-font" aria-label="选中元素字号" type="number" min="10" max="80" value="16" style="width:65px" disabled></label><label>文字颜色 <input id="pp-color" aria-label="选中元素文字颜色" type="color" disabled></label><button id="pp-save">保存原型</button><button id="pp-restore">放弃未保存修改</button><button id="pp-export">导出 HTML</button></div><p id="pp-status" role="status" aria-live="polite"></p><iframe id="pp-frame" title="可编辑页面原型" sandbox="allow-scripts" referrerpolicy="no-referrer" style="width:100%;height:calc(100% - 260px);min-height:320px;border:1px solid #cbd5d5;background:white"></iframe>';
    document.body.append(modal); frame = $('frame');
    function close() {
      if (busy) { notify('请先停止生成再关闭。'); return; }
      if (html !== savedHtml && !confirm('原型尚未保存，确定放弃修改并关闭？')) return;
      modal.close(); frame.srcdoc = ''; session = null;
    }
    $('close').onclick = close;
    modal.addEventListener('cancel', function (e) { e.preventDefault(); close(); });
    $('generate').onclick = async function () {
      if (busy) return;
      if (html !== savedHtml && !confirm('将基于当前编辑稿让 AI 修改。成功后替换编辑稿，是否继续？')) return;
      busy = true; controls(); notify('正在读取当前 PRD 并请求 AI，原型返回前保留当前内容…');
      var target = project;
      try {
        if (currentProj() !== target) throw new Error('项目已切换，请重新打开原型');
        // Existing first-use consent is a normal modal, so release the dialog top layer while it is shown.
        modal.close();
        try { await window.__AICtrl.privacyConfirm({label:'AI 原型生成',scope:'当前项目的 PRD 全文、项目上下文、当前原型 HTML 和本次修改要求',key:'prototype'}); }
        finally { modal.showModal(); }
        var result = await window.__AICtrl.generatePrototype($('prompt').value, html, notify);
        var next = clean(result);
        if (currentProj() !== target) throw new Error('项目已切换，未应用本次结果');
        html = next; render(); notify('原型草稿已生成。可直接编辑，满意后点击“保存原型”。');
      } catch (e) { notify((e.message || '生成失败') + '；原稿已保留，可重试。'); }
      finally { busy = false; controls(); }
    };
    $('stop').onclick = function () { window.__AICtrl.stopPrototype(); notify('正在停止，本次结果不会写入…'); };
    $('save').onclick = function () {
      if (currentProj() !== project) { notify('项目已切换，请导出草稿后重新打开'); return; }
      if ((project.prototype && project.prototype.revision || 0) !== revision) { notify('原型版本已变化，请先导出草稿，重新打开后再编辑'); return; }
      var prior = project.prototype;
      project.prototype = { html: html, revision: revision + 1, updatedAt: Date.now() };
      save();
      if (saveFailed) { project.prototype = prior; notify('本地空间不足，尚未保存，请导出 HTML 保留草稿'); return; }
      revision++; savedHtml = html; notify('原型已保存到当前项目，重新打开可继续编辑。');
    };
    $('restore').onclick = function () { if (html !== savedHtml && confirm('放弃未保存修改，恢复上次保存的原型？')) { html = savedHtml; render(); controls(); notify('已恢复上次保存内容'); } };
    $('font').onchange = function () { frame.contentWindow.postMessage({ token: session, font: $('font').value }, '*'); };
    $('color').onchange = function () { frame.contentWindow.postMessage({ token: session, color: $('color').value }, '*'); };
    $('export').onclick = function () {
      var output = new DOMParser().parseFromString(html, 'text/html');
      var policy = output.createElement('meta'); policy.httpEquiv = 'Content-Security-Policy'; policy.content = "default-src 'none'; style-src 'unsafe-inline'; form-action 'none'; base-uri 'none'"; output.head.prepend(policy);
      var url = URL.createObjectURL(new Blob(['<!doctype html>'+output.documentElement.outerHTML], { type: 'text/html;charset=utf-8' })), a = document.createElement('a');
      a.href = url; a.download = '页面原型.html'; a.click(); setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    };
    window.addEventListener('message', function (event) {
      var data = event.data;
      if (!modal.open || busy || event.source !== frame.contentWindow || event.origin !== 'null' || !data || data.kind !== 'prd-prototype' || data.token !== session) return;
      if (data.selected) { selected = true; $('font').disabled = $('color').disabled = false; }
      if (typeof data.html === 'string') { try { html = clean(data.html); notify('有未保存修改，点击“保存原型”保留。'); } catch (e) { notify(e.message); } }
    });
    window.addEventListener('beforeunload', function (event) { if (modal.open && (busy || html !== savedHtml)) { event.preventDefault(); event.returnValue = ''; } });
  }
  document.getElementById('prdPrototypeOpen').addEventListener('click', function () {
    var p = currentProj();
    if (!p) { alert('请先打开一个项目'); return; }
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    save();
    if (saveFailed) { alert('PRD 尚未保存成功，请先导出备份或释放本地空间，再进入原型'); return; }
    location.href = 'proto-req/prd.html?project=' + encodeURIComponent(p.id);
  });
  var query = new URLSearchParams(location.search);
  if (query.get('project') && STATE.projects.some(function (p) { return p.id === query.get('project'); })) switchProject(query.get('project'));
  if (query.get('settings') === 'ai') openSettings('ai');
})();
