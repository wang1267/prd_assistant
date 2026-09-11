(function () {
  var projectId = new URLSearchParams(location.search).get('project');
  window.PRD_MODE = { projectId: projectId, key: 'prd.prototype.workspace.v1.' + encodeURIComponent(projectId || '') };
  function applyTheme() { var theme; try { theme = localStorage.getItem('prdKanbanTheme'); } catch (e) {} document.documentElement.dataset.theme = ['brand','light','dark','hc'].includes(theme) ? theme : 'brand'; }
  applyTheme();
  window.addEventListener('focus', applyTheme);
  window.addEventListener('pageshow', applyTheme);
  window.addEventListener('storage', function (event) { if (event.key === 'prdKanbanTheme') applyTheme(); });
  PRD_MODE.safeHTML = function (html, editing) {
    var doc = new DOMParser().parseFromString(html || '', 'text/html');
    doc.querySelectorAll('script,iframe,object,embed,link,meta,base,svg,math,template').forEach(function (el) { el.remove(); });
    doc.querySelectorAll('*').forEach(function (el) {
      Array.from(el.attributes).forEach(function (attr) {
        if (!/^(id|class|style|data-proto-id|type|value|placeholder|title|role|aria-[\w-]+|colspan|rowspan|disabled|checked|selected|for|name|rows|cols)$/i.test(attr.name)) el.removeAttribute(attr.name);
      });
      if (el.tagName === 'INPUT' && el.type === 'file') el.type = 'text';
    });
    var nonce = crypto.randomUUID(), policy = doc.createElement('meta');
    policy.httpEquiv = 'Content-Security-Policy';
    policy.content = "default-src 'none'; script-src " + (editing ? "'nonce-" + nonce + "'" : "'none'") + "; style-src 'unsafe-inline'; img-src data: blob:; form-action 'none'; base-uri 'self'";
    doc.head.prepend(policy);
    if (editing) { var marker = doc.createElement('meta'); marker.name = 'prd-editor-nonce'; marker.content = nonce; doc.head.append(marker); }
    return '<!doctype html>' + doc.documentElement.outerHTML;
  };
})();
