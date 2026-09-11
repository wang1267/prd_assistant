/* ============================================================
 * links.js · SVG 连线层（Overlay）
 * - 覆盖「原型区 + 需求区」整个舞台，位于最上层
 * - 连线：原型元素右缘中点 → 需求 Block 左缘中点（三次贝塞尔）
 * - 显示控制：全部显示 / 悬停显示（默认）/ 隐藏
 * - 交互：悬停高亮两端、点击连线弹出关联详情
 * ============================================================ */
(function () {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';

  function svgEl(tag, attrs) {
    var e = document.createElementNS(NS, tag);
    attrs = attrs || {};
    Object.keys(attrs).forEach(function (k) { e.setAttribute(k, attrs[k]); });
    return e;
  }

  window.createOverlay = function (stageEl, helpers, callbacks) {
    helpers = helpers || {};
    callbacks = callbacks || {};
    var api = {};

    var svg = svgEl('svg', { class: 'overlay-svg' });
    var defs = svgEl('defs');
    defs.innerHTML =
      '<marker id="prc-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">' +
      '<path d="M 0 1 L 8 5 L 0 9 z" fill="#5B5BD6"/></marker>';
    var gRects = svgEl('g');
    var gConns = svgEl('g');
    svg.append(defs, gRects, gConns);
    stageEl.append(svg);

    var links = [];
    var display = 'hover';          // all | hover | hidden
    var visible = true;             // 面板可见（需求/阅读模式）
    var tempIds = {};               // 临时显示的 link id
    var tempTimer = null;
    var hoverLinkId = null;
    var activeElementId = null;     // 悬停高亮的元素（显示其 rect 激活态）
    var hoverRect = null;           // 连线模式：元素悬停框
    var selectedRect = null;        // 连线模式：元素选中框
    var flashRects = [];            // 定位元素闪烁框

    function requestRedraw() { scheduleDraw(); }

    var scheduleDraw = U.rafThrottle(function () { draw(); });

    function draw() {
      gRects.innerHTML = '';
      gConns.innerHTML = '';
      if (!visible) return;

      var showConns = display !== 'hidden' || Object.keys(tempIds).length > 0;

      /* ---- 元素侧矩形 ---- */
      if (display !== 'hidden') {
        var drawn = {};
        links.forEach(function (l) {
          var pid = l.prototype_element_id;
          if (drawn[pid]) return;
          drawn[pid] = true;
          var box = helpers.elementBox(pid);
          if (!box) return;
          var active = (activeElementId === pid) || linksSomeTemp(pid);
          /* “悬停显示”下只保留编号，元素框与连线一起按需出现。 */
          if (display === 'all' || active) {
            gRects.append(svgEl('rect', {
              class: 'elrect' + (active ? ' active' : ''),
              x: box.x, y: box.y, width: Math.max(box.w, 6), height: Math.max(box.h, 6), rx: 4
            }));
          }
          /* 编号圆点（Axure 标注点模式）：与需求卡片上的元素 chip
             编号一一对应（app.js rebuildElementIndex 统一分配） */
          var num = helpers.elementIndex ? helpers.elementIndex(pid) : 0;
          if (num) {
            /* 放在元素右上角外侧，保留编号而不盖住原型内容。 */
            var cx = box.x + box.w + 10, cy = box.y - 10;
            var badge = svgEl('g', { class: 'elnum' + (active ? ' active' : '') });
            badge.append(svgEl('circle', { cx: cx, cy: cy, r: 9 }));
            var txt = svgEl('text', { x: cx, y: cy + 3.5, 'text-anchor': 'middle' });
            txt.textContent = String(num);
            badge.append(txt);
            gRects.append(badge);
          }
        });
      }

      /* ---- 连线模式：悬停 / 选中框 ---- */
      if (hoverRect) {
        gRects.append(svgEl('rect', {
          class: 'hoverrect',
          x: hoverRect.x, y: hoverRect.y, width: Math.max(hoverRect.w, 6), height: Math.max(hoverRect.h, 6), rx: 4
        }));
      }
      if (selectedRect) {
        gRects.append(svgEl('rect', {
          class: 'selrect',
          x: selectedRect.x, y: selectedRect.y, width: Math.max(selectedRect.w, 6), height: Math.max(selectedRect.h, 6), rx: 4
        }));
      }

      /* ---- 定位闪烁框 ---- */
      var now = Date.now();
      flashRects = flashRects.filter(function (f) { return f.until > now; });
      flashRects.forEach(function (f) {
        gRects.append(svgEl('rect', {
          class: 'flashrect',
          x: f.rect.x, y: f.rect.y, width: Math.max(f.rect.w, 6), height: Math.max(f.rect.h, 6), rx: 4
        }));
      });

      /* ---- 连线 ---- */
      if (!showConns) return;
      var pv = helpers.protoViewport ? helpers.protoViewport() : null;
      var rv = helpers.reqViewport ? helpers.reqViewport() : null;

      links.forEach(function (l) {
        var eBox = helpers.elementBox(l.prototype_element_id);
        var bBox = helpers.blockBox(l.requirement_block_id);
        if (!eBox || !bBox) return; // 元素或块缺失，跳过绘制
        var isTemp = !!tempIds[l.id];
        if (display !== 'all' && !isTemp) return;

        var a1 = anchorRight(eBox, pv);
        var a2 = anchorLeft(bBox, rv);
        var dx = U.clamp((a2.x - a1.x) * 0.45, 36, 150);
        var d = 'M ' + a1.x + ' ' + a1.y +
          ' C ' + (a1.x + dx) + ' ' + a1.y + ', ' + (a2.x - dx) + ' ' + a2.y + ', ' + a2.x + ' ' + a2.y;

        var g = svgEl('g', { class: 'conn' + (isTemp || hoverLinkId === l.id ? ' active' : '') + (hasTempOthers(l.id) ? ' dim' : '') + (a1.clamped || a2.clamped ? ' clamped' : ''), 'data-link-id': l.id });
        var hit = svgEl('path', { class: 'hit', d: d });
        var line = svgEl('path', { class: 'line', d: d, 'marker-end': 'url(#prc-arrow)' });
        var dot = svgEl('circle', { class: 'conn-dot', cx: a1.x, cy: a1.y, r: 3 });
        g.append(hit, line, dot);

        g.addEventListener('mouseenter', function () {
          hoverLinkId = l.id;
          if (callbacks.onLinkHover) callbacks.onLinkHover(l);
          requestRedraw();
        });
        g.addEventListener('mouseleave', function () {
          if (hoverLinkId === l.id) {
            hoverLinkId = null;
            if (callbacks.onLinkHover) callbacks.onLinkHover(null);
            requestRedraw();
          }
        });
        g.addEventListener('click', function (e) {
          e.stopPropagation();
          if (callbacks.onLinkClick) callbacks.onLinkClick(l, e.clientX, e.clientY);
        });
        gConns.append(g);
      });
    }

    function linksSomeTemp(protoId) {
      return links.some(function (l) { return l.prototype_element_id === protoId && tempIds[l.id]; });
    }
    function hasTempOthers(linkId) {
      var any = Object.keys(tempIds).length > 0;
      return any && !tempIds[linkId] && display === 'all';
    }

    function anchorRight(box, vp) {
      var x = box.x + box.w, y = box.y + box.h / 2, clamped = false;
      if (vp) {
        var cx = U.clamp(x, vp.left + 2, vp.right - 2);
        var cy = U.clamp(y, vp.top + 10, vp.bottom - 10);
        if (cx !== x || cy !== y) clamped = true;
        x = cx; y = cy;
      }
      return { x: x, y: y, clamped: clamped };
    }
    function anchorLeft(box, vp) {
      var x = box.x, y = box.y + box.h / 2, clamped = false;
      if (vp) {
        var cx = U.clamp(x, vp.left + 2, vp.right - 2);
        var cy = U.clamp(y, vp.top + 10, vp.bottom - 10);
        if (cx !== x || cy !== y) clamped = true;
        x = cx; y = cy;
      }
      return { x: x, y: y, clamped: clamped };
    }

    /* ---------- API ---------- */

    api.setLinks = function (arr) { links = arr || []; requestRedraw(); };
    api.setDisplay = function (d) { display = d; requestRedraw(); };
    api.getDisplay = function () { return display; };
    api.setVisible = function (v) { visible = !!v; requestRedraw(); };
    api.setActiveElement = function (protoId) {
      if (activeElementId === protoId) return;
      activeElementId = protoId;
      requestRedraw();
    };
    api.setHoverRect = function (rect) { hoverRect = rect || null; requestRedraw(); };
    api.setSelectedRect = function (rect) { selectedRect = rect || null; requestRedraw(); };
    api.flashElement = function (rect, ms) {
      if (!rect) return;
      flashRects.push({ rect: rect, until: Date.now() + (ms || 1800) });
      requestRedraw();
      setTimeout(requestRedraw, (ms || 1800) + 60);
    };

    api.tempShow = function (linkIds, duration) {
      (linkIds || []).forEach(function (id) { tempIds[id] = true; });
      requestRedraw();
      if (duration) {
        clearTimeout(tempTimer);
        tempTimer = setTimeout(function () { api.clearTemp(); }, duration);
      }
    };
    api.clearTemp = function () {
      if (!Object.keys(tempIds).length) return;
      tempIds = {};
      clearTimeout(tempTimer);
      requestRedraw();
    };
    api.requestRedraw = requestRedraw;
    api.el = svg;

    return api;
  };
})();
