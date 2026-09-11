/* ============================================================
 * util.js · 通用工具函数与基础 UI 组件（toast / modal / menu）
 * ============================================================ */
(function () {
  'use strict';

  const U = {};

  /* ---------- 基础 ---------- */

  U.uid = function (prefix) {
    return (prefix || 'id') + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  };

  U.esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };

  U.debounce = function (fn, ms) {
    let t = null;
    const d = function () {
      const args = arguments, self = this;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(self, args); }, ms);
    };
    d.cancel = function () { clearTimeout(t); };
    return d;
  };

  U.rafThrottle = function (fn) {
    let queued = false;
    return function () {
      if (queued) return;
      queued = true;
      requestAnimationFrame(function () { queued = false; fn(); });
    };
  };

  U.clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };

  U.deepCopy = function (v) { return v == null ? v : JSON.parse(JSON.stringify(v)); };

  U.el = function (tag, attrs) {
    const e = document.createElement(tag);
    attrs = attrs || {};
    Object.keys(attrs).forEach(function (k) {
      const v = attrs[k];
      if (v == null) return;
      if (k === 'class') e.className = v;
      else if (k === 'html') e.innerHTML = v;
      else if (k === 'text') e.textContent = v;
      else if (k === 'style' && typeof v === 'string') e.style.cssText = v;
      else if (k.slice(0, 2) === 'on') e.addEventListener(k.slice(2), v);
      else e.setAttribute(k, v);
    });
    for (let i = 2; i < arguments.length; i++) {
      const c = arguments[i];
      if (c == null || c === false) continue;
      if (Array.isArray(c)) c.forEach(function (x) { if (x != null) e.append(x); });
      else e.append(c.nodeType ? c : document.createTextNode(String(c)));
    }
    return e;
  };

  U.stripHtml = function (html) {
    const d = document.createElement('div');
    d.innerHTML = html || '';
    return (d.textContent || '').replace(/\s+/g, ' ').trim();
  };

  U.copyText = async function (text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (e) {
      try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.cssText = 'position:fixed;opacity:0;left:-999px';
        document.body.appendChild(ta);
        ta.select();
        const ok = document.execCommand('copy');
        ta.remove();
        return ok;
      } catch (e2) { return false; }
    }
  };

  /* ---------- 时间格式化 ---------- */

  function p2(n) { return (n < 10 ? '0' : '') + n; }

  U.fmtTime = function (ts) {
    const d = new Date(ts);
    return p2(d.getHours()) + ':' + p2(d.getMinutes());
  };

  U.fmtDT = function (ts) {
    const d = new Date(ts);
    return d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate()) + ' ' + p2(d.getHours()) + ':' + p2(d.getMinutes());
  };

  U.fmtDTS = function (ts) {
    const d = new Date(ts);
    return U.fmtDT(ts) + ':' + p2(d.getSeconds());
  };

  /* ---------- Toast ---------- */

  U.toast = function (msg, type, ms) {
    type = type || 'info';
    const root = document.getElementById('toasts');
    if (!root) return;
    const t = U.el('div', { class: 'toast toast-' + type, text: msg });
    root.appendChild(t);
    requestAnimationFrame(function () { t.classList.add('show'); });
    setTimeout(function () {
      t.classList.remove('show');
      setTimeout(function () { t.remove(); }, 260);
    }, ms || 2600);
  };

  /* ---------- Modal ---------- */

  U.modal = function (opts) {
    opts = opts || {};
    const root = document.getElementById('modal-root');
    const overlay = U.el('div', { class: 'modal-overlay' });
    const card = U.el('div', { class: 'modal-card' + (opts.wide ? ' modal-wide' : '') });
    if (opts.width) card.style.width = opts.width + 'px';

    const head = U.el('div', { class: 'modal-head' },
      U.el('div', { class: 'modal-title', text: opts.title || '' }));
    const bodyWrap = U.el('div', { class: 'modal-body' });
    if (typeof opts.body === 'string') bodyWrap.innerHTML = opts.body;
    else if (opts.body) bodyWrap.append(opts.body);

    let closed = false;
    function close() {
      if (closed) return;
      closed = true;
      overlay.remove();
      document.removeEventListener('keydown', onKey);
      if (opts.onClose) opts.onClose();
    }
    function onKey(e) { if (e.key === 'Escape' && opts.closable !== false) { e.stopPropagation(); close(); } }

    if (opts.closable !== false) {
      head.append(U.el('button', { class: 'icon-btn', title: '关闭', html: U.ICONS.close, onclick: close }));
    }
    document.addEventListener('keydown', onKey);
    overlay.addEventListener('mousedown', function (e) {
      if (e.target === overlay && opts.closable !== false) close();
    });

    const foot = U.el('div', { class: 'modal-foot' });
    (opts.actions || []).forEach(function (a) {
      foot.append(U.el('button', {
        class: 'btn ' + (a.kind === 'primary' ? 'btn-primary' : a.kind === 'danger' ? 'btn-danger' : ''),
        text: a.label,
        /* 未传 onClick 的 action（如纯「关闭 / 取消 / 知道了」）默认就是关闭弹窗，
           曾经因此出现一批点击无响应的假按钮 */
        onclick: function () { if (a.onClick) a.onClick(close); else close(); }
      }));
    });

    card.append(head, bodyWrap);
    if (foot.childNodes.length) card.append(foot);
    overlay.append(card);
    root.append(overlay);
    return { close: close, card: card, body: bodyWrap };
  };

  U.confirm = function (message, opts) {
    opts = opts || {};
    return new Promise(function (resolve) {
      let done = false;
      const m = U.modal({
        title: opts.title || '确认操作',
        body: U.el('div', { class: 'confirm-text', text: message }),
        onClose: function () { if (!done) { done = true; resolve(false); } },
        actions: [
          { label: opts.cancelLabel || '取消', onClick: function (close) { done = true; close(); resolve(false); } },
          { label: opts.okLabel || '确定', kind: opts.danger ? 'danger' : 'primary', onClick: function (close) { done = true; close(); resolve(true); } }
        ]
      });
      const okBtn = m.card.querySelectorAll('.modal-foot .btn')[1];
      if (okBtn) okBtn.focus();
    });
  };

  U.prompt = function (opts) {
    opts = opts || {};
    return new Promise(function (resolve) {
      let done = false;
      const input = U.el('input', {
        class: 'input', type: 'text', value: opts.value || '',
        placeholder: opts.placeholder || '', spellcheck: 'false'
      });
      if (opts.label) input.setAttribute('aria-label', opts.label);
      const m = U.modal({
        title: opts.title || '输入',
        body: U.el('div', {},
          opts.label ? U.el('div', { class: 'field-label', text: opts.label }) : null,
          input
        ),
        onClose: function () { if (!done) { done = true; resolve(null); } },
        actions: [
          { label: '取消', onClick: function (close) { done = true; close(); resolve(null); } },
          {
            label: opts.okLabel || '确定', kind: 'primary',
            onClick: function (close) { done = true; close(); resolve(input.value); }
          }
        ]
      });
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { done = true; m.close(); resolve(input.value); }
      });
      setTimeout(function () { input.focus(); input.select(); }, 30);
    });
  };

  /* ---------- 下拉菜单 / 浮层 ---------- */

  U.popover = function (anchorRect, contentEl, opts) {
    opts = opts || {};
    const root = document.getElementById('popover-root');
    const pop = U.el('div', { class: 'popover' + (opts.className ? ' ' + opts.className : '') });
    pop.append(contentEl);
    root.append(pop);

    // 先渲染拿到尺寸再定位
    const pw = pop.offsetWidth, ph = pop.offsetHeight;
    let x = anchorRect.left, y = anchorRect.bottom + 6;
    if (opts.align === 'right') x = anchorRect.right - pw;
    x = U.clamp(x, 8, window.innerWidth - pw - 8);
    if (y + ph > window.innerHeight - 8) {
      y = anchorRect.top - ph - 6;
      if (y < 8) y = U.clamp(anchorRect.bottom + 6, 8, window.innerHeight - ph - 8);
    }
    pop.style.left = x + 'px';
    pop.style.top = y + 'px';

    let closed = false;
    function close() {
      if (closed) return;
      closed = true;
      pop.remove();
      document.removeEventListener('mousedown', onDoc, true);
      window.removeEventListener('blur', onWinBlur);
      if (opts.onClose) opts.onClose();
    }
    function onDoc(e) {
      if (!pop.contains(e.target)) close();
    }
    // 原型区 / AI 预览是 iframe：iframe 内的点击不会冒泡到主文档，
    // document 上的 mousedown 收不到。用「窗口失焦 + 焦点落入 iframe」兜底，
    // 使点击原型空白处同样能关闭浮层
    function onWinBlur() {
      setTimeout(function () {
        const ae = document.activeElement;
        if (ae && ae.tagName === 'IFRAME') close();
      }, 0);
    }
    setTimeout(function () {
      document.addEventListener('mousedown', onDoc, true);
      window.addEventListener('blur', onWinBlur);
    }, 0);
    return { close: close, el: pop };
  };

  U.menu = function (items, anchorRect, opts) {
    const box = U.el('div', { class: 'menu' });
    items.forEach(function (it) {
      if (it === '-') { box.append(U.el('div', { class: 'menu-sep' })); return; }
      if (it.hidden) return;
      const row = U.el('div', { class: 'menu-item' + (it.disabled ? ' disabled' : '') + (it.danger ? ' danger' : '') },
        it.icon ? U.el('span', { class: 'mi-ico', html: it.icon }) : null,
        U.el('span', { class: 'mi-label', text: it.label }),
        it.badge ? U.el('span', { class: 'mi-badge', text: it.badge }) : null,
        it.checked ? U.el('span', { class: 'mi-check', html: U.ICONS.check }) : null
      );
      row.addEventListener('click', function () {
        if (it.disabled) return;
        closeRef.close();
        it.onClick && it.onClick();
      });
      box.append(row);
    });
    const closeRef = U.popover(anchorRect, box, opts);
    return closeRef;
  };

  /* ---------- 图标（16px 线性风格） ---------- */

  function svg(paths, vb) {
    return '<svg viewBox="' + (vb || '0 0 24 24') + '" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + paths + '</svg>';
  }

  U.ICONS = {
    plus: svg('<path d="M12 5v14M5 12h14"/>'),
    close: svg('<path d="M6 6l12 12M18 6L6 18"/>'),
    check: svg('<path d="M5 13l4 4L19 7"/>'),
    chevronD: svg('<path d="M6 9l6 6 6-6"/>'),
    chevronR: svg('<path d="M9 6l6 6-6 6"/>'),
    undo: svg('<path d="M9 14L4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>'),
    redo: svg('<path d="M15 14l5-5-5-5"/><path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13"/>'),
    link: svg('<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>'),
    trash: svg('<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>'),
    pen: svg('<path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>'),
    up: svg('<path d="M12 19V5M5 12l7-7 7 7"/>'),
    down: svg('<path d="M12 5v14M19 12l-7 7-7-7"/>'),
    dots: svg('<circle cx="5" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.4" fill="currentColor" stroke="none"/>'),
    share: svg('<path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7"/><path d="M16 6l-4-4-4 4M12 2v13"/>'),
    clock: svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>'),
    warn: svg('<path d="M10.3 4.3L2.6 18a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 4.3a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 16.6v.1"/>'),
    copy: svg('<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>'),
    external: svg('<path d="M14 3h7v7M21 3l-9 9"/><path d="M19 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h6"/>'),
    eye: svg('<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>'),
    layout: svg('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M15 4v16"/>'),
    doc: svg('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>'),
    book: svg('<path d="M2 4h6a4 4 0 0 1 4 4v12a3 3 0 0 0-3-3H2z"/><path d="M22 4h-6a4 4 0 0 0-4 4v12a3 3 0 0 1 3-3h7z"/>'),
    table: svg('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M9 10v10"/>'),
    code: svg('<path d="M8 6l-5 6 5 6M16 6l5 6-5 6"/>'),
    list: svg('<path d="M9 6h12M9 12h12M9 18h12"/><path d="M4 6h.01M4 12h.01M4 18h.01"/>'),
    panelLeft: svg('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16"/>'),
    save: svg('<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8M7 3v5h8"/>'),
    branch: svg('<path d="M6 3v12"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/>'),
    chat: svg('<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>'),
    help: svg('<circle cx="12" cy="12" r="9"/><path d="M9.2 9a2.8 2.8 0 0 1 5.4 1c0 1.8-2.6 2.2-2.6 3.6"/><path d="M12 16.6v.1"/>'),
    arrowLeft: svg('<path d="M19 12H5M12 19l-7-7 7-7"/>'),
    gear: svg('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.01a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.01a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.01a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>'),
    download: svg('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5M12 15V3"/>'),
    upload: svg('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M17 8l-5-5-5 5M12 3v12"/>'),
    spark: svg('<path d="M13 2L3 14h8l-1 8 11-13h-8l1-7z"/>')
  };

  window.U = U;
})();
