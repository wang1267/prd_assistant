// Static selection mode only: rebuild an allowlisted tree, never execute imported scripts.
export function mountPreview(frame, html, onSelect) {
  const parsed = new DOMParser().parseFromString(html, 'text/html');
  const clean = document.implementation.createHTMLDocument('');
  const allowed = new Set('main section article header footer div span p h1 h2 h3 h4 ul ol li button label input textarea select option table thead tbody tr th td strong em br hr'.split(' '));
  const ids = [], labels = new Map(), seen = new Set();
  let sequence = 0;
  function append(source, target) {
    for (const child of source.childNodes) {
      if (child.nodeType === 3) { target.append(clean.createTextNode(child.textContent)); continue; }
      if (child.nodeType !== 1 || !allowed.has(child.localName)) continue;
      const el = clean.createElement(child.localName);
      for (const attr of ['style', 'placeholder', 'type', 'value', 'aria-label']) {
        if (child.hasAttribute(attr)) el.setAttribute(attr, child.getAttribute(attr));
      }
      if (el.localName === 'input') el.setAttribute('type', 'text');
      const existing = child.getAttribute('data-proto-id');
      let elementId = existing || `preview-${++sequence}`;
      if (seen.has(elementId)) throw new Error('原型存在重复元素标识，请先修复后重试');
      seen.add(elementId); ids.push(elementId);
      labels.set(elementId, (child.getAttribute('aria-label') || child.getAttribute('placeholder') || child.textContent || child.localName).trim().slice(0, 60));
      el.setAttribute('data-proto-id', elementId);
      append(child, el); target.append(el);
    }
  }
  append(parsed.body, clean.body);
  const session = crypto.randomUUID(), nonce = crypto.randomUUID();
  const listener = event => {
    const data = event.data;
    if (event.source !== frame.contentWindow || event.origin !== 'null' || !data || data.session !== session || data.type !== 'select' || typeof data.id !== 'string' || !ids.includes(data.id)) return;
    onSelect(data.id);
  };
  window.addEventListener('message', listener);
  frame.srcdoc = `<!doctype html><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'nonce-${nonce}'; style-src 'unsafe-inline'; form-action 'none'; base-uri 'none'"><style>body{font:16px system-ui;padding:24px;color:#203c46}button,input{font:inherit;padding:12px;border:1px solid #abc;border-radius:8px}button{background:#203c46;color:white}[data-proto-id]:hover{outline:2px solid #d19942;cursor:crosshair}[data-selected]{outline:3px solid #d19942}</style>${clean.body.innerHTML}<script nonce="${nonce}">document.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();const el=e.target.closest('[data-proto-id]');if(!el)return;document.querySelectorAll('[data-selected]').forEach(x=>x.removeAttribute('data-selected'));el.setAttribute('data-selected','');parent.postMessage({type:'select',session:${JSON.stringify(session)},id:el.getAttribute('data-proto-id')},'*')},true);<\/script>`;
  return { ids, labels, dispose: () => window.removeEventListener('message', listener) };
}
