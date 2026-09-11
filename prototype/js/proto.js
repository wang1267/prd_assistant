/* ============================================================
 * proto.js · 原型视图（iframe 沙箱）
 * - HTML 原型通过 srcdoc 注入 iframe，同源可访问 DOM
 * - 元素选择：hover / 点击回调交给上层决定行为
 * - 元素绑定稳定性：首次选中即写入 data-proto-id（计划书 §16）
 * ============================================================ */
(function () {
  'use strict';

  window.createProtoView = function (panelEl, callbacks) {
    callbacks = callbacks || {};
    var api = {};
    var frame = null;
    var lastHtml = null;

    function mountFrame() {
      frame = U.el('iframe', {
        class: 'proto-frame',
        sandbox: window.PRD_MODE ? 'allow-same-origin' : 'allow-same-origin allow-scripts allow-forms allow-popups allow-modals',
        title: '原型预览'
      });
      frame.addEventListener('load', onFrameLoad);
      panelEl.append(frame);
    }

    var hookBound = false;
    var domObserver = null;
    var mutateTimer = null;

    function onFrameLoad() {
      hookBound = false;
      hook();
      if (callbacks.onFrameReady) callbacks.onFrameReady();
    }

    function hook() {
      var doc = frameDoc();
      if (!doc || hookBound) return;
      hookBound = true;
      var w = frame.contentWindow;
      try {
        w.addEventListener('scroll', callbacks.onRedraw || function () {}, true);
        w.addEventListener('resize', callbacks.onRedraw || function () {}, true);
        doc.addEventListener('mouseover', function (e) {
          if (callbacks.onTargetHover) callbacks.onTargetHover(e.target || null);
        }, true);
        doc.addEventListener('mouseout', function (e) {
          if (!callbacks.onTargetHover) return;
          var rt = e.relatedTarget;
          if (rt && doc.contains(rt)) return; // 内部移动，忽略
          callbacks.onTargetHover(null);
        }, true);
        doc.addEventListener('click', function (e) {
          if (callbacks.onTargetClick) callbacks.onTargetClick(e.target || null, e);
        }, true);
        /* iframe 内的 Ctrl+Z/Y 不会冒泡到主文档：转发给主文档统一路由（连线撤销/重做）。
           原型自身输入框的文本编辑优先，不转发。 */
        doc.addEventListener('keydown', function (e) {
          if (!(e.ctrlKey || e.metaKey)) return;
          var k = (e.key || '').toLowerCase();
          if (k !== 'z' && k !== 'y') return;
          var t = e.target;
          if (t && t.closest && t.closest('input, textarea, select, [contenteditable="true"]')) return;
          try {
            document.dispatchEvent(new KeyboardEvent('keydown', {
              key: e.key, ctrlKey: e.ctrlKey, metaKey: e.metaKey,
              shiftKey: e.shiftKey, altKey: e.altKey, bubbles: true, cancelable: true
            }));
          } catch (err) { /* ignore */ }
        }, true);
        /* 可交互原型自身的脚本会重渲染 DOM（列表翻页 / 图表刷新 / 向导切步），
           可能移动或销毁已连线的元素。监听变化并节流通知上层：
           连线跟随重绘、选中框跟随元素、缺失提示实时更新（120ms 节流防抖动） */
        if ('MutationObserver' in w) {
          if (domObserver) domObserver.disconnect();
          domObserver = new w.MutationObserver(function () {
            if (!callbacks.onDomMutate) return;
            clearTimeout(mutateTimer);
            mutateTimer = setTimeout(function () {
              try { callbacks.onDomMutate(); } catch (err) { /* ignore */ }
            }, 120);
          });
          domObserver.observe(doc.documentElement, {
            childList: true, subtree: true,
            attributes: true, attributeFilter: ['style', 'class', 'hidden']
          });
        }
      } catch (e) {
        console.warn('[proto] iframe 事件绑定失败', e);
      }
    }

    function frameDoc() {
      try { return frame ? frame.contentDocument : null; } catch (e) { return null; }
    }

    api.load = function (html) {
      if (!frame) mountFrame();
      hookBound = false;
      lastHtml = html || '';
      var EMPTY = '<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><style>body{font-family:system-ui;margin:0}</style></head><body></body></html>';
      var next = lastHtml || EMPTY;
      if (window.PRD_MODE) next = PRD_MODE.safeHTML(next, false);
      if (frame.srcdoc === next) {
        // 内容相同不会触发 load，直接补一次 ready
        if (callbacks.onFrameReady) callbacks.onFrameReady();
      } else {
        frame.srcdoc = next;
      }
    };

    api.findEl = function (protoId) {
      var doc = frameDoc();
      if (!doc || !protoId) return null;
      try { return doc.querySelector('[data-proto-id="' + protoId + '"]'); } catch (e) { return null; }
    };

    /* 首次选中元素时写入稳定 ID，之后绑定关系只记录该 ID */
    api.ensureProtoId = function (el) {
      if (!el || el.nodeType !== 1) return null;
      var id = el.getAttribute && el.getAttribute('data-proto-id');
      if (!id) {
        id = U.uid('proto');
        try {
          el.setAttribute('data-proto-id', id);
          if (callbacks.onPrototypeMutated) callbacks.onPrototypeMutated();
        } catch (e) { return null; }
      }
      return id;
    };

    /* 元素指纹（tag + 规范化 class + 规范化文本）：
       原型自身脚本重建 DOM（切标签 / 返回上一视图）后，新节点不再携带
       data-proto-id。上层用指纹在新 DOM 中找回等价元素，自动恢复标识，
       连线因此不丢。文本取 innerText / placeholder / title——不取 value
       （用户输入会变化，不稳定）。 */
    api.fingerprintOf = function (el) {
      if (!el || el.nodeType !== 1) return null;
      try {
        var tag = (el.tagName || '').toLowerCase();
        var cls = (el.getAttribute('class') || '').trim();
        if (cls) cls = cls.split(/\s+/).sort().join(' ');
        var text = '';
        try {
          text = (el.innerText || el.getAttribute('placeholder') || el.getAttribute('title') || '').trim();
        } catch (e2) { text = ''; }
        text = text.replace(/\s+/g, ' ').slice(0, 80);
        return { tag: tag, cls: cls, text: text };
      } catch (e) { return null; }
    };

    api.elementLabel = function (el) {
      if (!el) return { name: '未知元素', type: 'element' };
      var tag = (el.tagName || 'div').toLowerCase();
      var name = '';
      try {
        name = (el.innerText || el.value || el.getAttribute('placeholder') || el.getAttribute('title') || el.getAttribute('aria-label') || '').trim();
      } catch (e) { name = ''; }
      name = name.replace(/\s+/g, ' ').slice(0, 24);
      if (!name) name = '<' + tag + '>';
      return { name: name, type: tag };
    };

    /* 序列化原型（保留 data-proto-id，不注入任何额外节点） */
    api.serialize = function () {
      var doc = frameDoc();
      if (!doc || !doc.documentElement) return lastHtml || '';
      try { return '<!DOCTYPE html>\n' + doc.documentElement.outerHTML; } catch (e) { return lastHtml || ''; }
    };

    api.frame = frame ? frame : null;
    Object.defineProperty(api, 'frame', {
      get: function () { return frame; }
    });

    api.doc = frameDoc;

    return api;
  };
})();
