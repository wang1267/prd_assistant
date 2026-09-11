/* ============================================================
 * editor.js · 自由需求编辑器（Block 机制）
 * - 每个顶层块拥有唯一 block_id（用户不可见），供连线绑定
 * - 支持块类型：正文/H1/H2/H3/无序列表/有序列表/待办/引用/代码块/表格/分割线
 * - 行内格式：加粗/斜体/下划线/删除线/字体色/背景高亮/超链接
 * - 文档级撤销重做（快照栈）、粘贴白名单净化、只读模式
 * ============================================================ */
(function () {
  'use strict';

  var BLOCK_TYPES = {
    p: '正文', h1: '标题 1', h2: '标题 2', h3: '标题 3',
    ul: '无序列表', ol: '有序列表', checklist: '待办清单',
    quote: '引用', code: '代码块', table: '表格', divider: '分割线'
  };
  var BADGES = { p: '¶', h1: 'H1', h2: 'H2', h3: 'H3', ul: '•', ol: '1.', checklist: '✓', quote: '❝', code: '</>', table: '▦', divider: '—' };
  var TEXT_LIKE = { p: 1, h1: 1, h2: 1, h3: 1, quote: 1 };
  var COLORS = ['#1d1d1f', '#e5484d', '#d97706', '#16a34a', '#2563eb', '#7c3aed', '#db2777', '#0d9488'];
  var HIGHLIGHTS = ['#fff3bf', '#ffd8a8', '#d3f9d8', '#d0ebff', '#e5dbff', '#ffe3e3', '#f1f3f5'];

  function preventDefault(e) { e.preventDefault(); }

  window.createBlockEditor = function (container, opts) {
    opts = opts || {};
    var api = {};
    var blocks = [];
    var readonly = !!opts.readonly;
    var undoStack = [], redoStack = [];
    var currentBlockId = null;

    /* ---------- 模型工具 ---------- */

    function blockById(id) {
      for (var i = 0; i < blocks.length; i++) if (blocks[i].id === id) return blocks[i];
      return null;
    }
    function newBlock(type) {
      return { id: U.uid('block'), type: type, content: defaultContent(type), created_at: Date.now(), updated_at: Date.now() };
    }
    function defaultContent(type) {
      if (type === 'ul' || type === 'ol') return [''];
      if (type === 'checklist') return [{ checked: false, html: '' }];
      if (type === 'table') return { header: ['列 1', '列 2', '列 3'], rows: [['', '', ''], ['', '', '']] };
      if (type === 'divider') return null;
      return '';
    }
    function blockToHtml(b) {
      var t = b.type, c = b.content;
      if (t === 'ul' || t === 'ol') return (c || []).join('<br>');
      if (t === 'checklist') return (c || []).map(function (i) { return i.html; }).join('<br>');
      if (t === 'code') return U.esc(c || '');
      if (t === 'table') {
        var parts = (c.header || []).concat([].concat.apply([], c.rows || []));
        return parts.filter(Boolean).join(' · ');
      }
      if (t === 'divider') return '';
      return c || '';
    }

    /* ---------- DOM 序列化 ---------- */

    var pendingSerialize = {};
    var serializeTimer = null;

    function scheduleSerialize(id) {
      pendingSerialize[id] = true;
      clearTimeout(serializeTimer);
      serializeTimer = setTimeout(flushSerialize, 350);
    }

    function flushSerialize() {
      clearTimeout(serializeTimer);
      var ids = Object.keys(pendingSerialize);
      pendingSerialize = {};
      var touched = false;
      ids.forEach(function (id) {
        var wrap = container.querySelector('.blk[data-id="' + id + '"]');
        if (wrap) { serializeBlockFromDOM(wrap); touched = true; }
      });
      if (touched) {
        scheduleSnapshotPush();
        if (opts.onChange) opts.onChange({ kind: 'content' });
      }
    }

    function cleanHtml(html) {
      if (!html) return '';
      if (!U.stripHtml(html)) return '';
      return String(html).trim();
    }

    function serializeBlockFromDOM(wrap) {
      var id = wrap.getAttribute('data-id');
      var b = blockById(id);
      if (!b) return;
      var t = b.type;
      try {
        if (TEXT_LIKE[t]) {
          var ed = wrap.querySelector('.ed');
          if (ed) b.content = cleanHtml(ed.innerHTML);
        } else if (t === 'ul' || t === 'ol') {
          var list = wrap.querySelector('.ed');
          var items = list ? [].slice.call(list.children) : [];
          b.content = items.filter(function (li) { return li.tagName === 'LI'; })
            .map(function (li) { return cleanHtml(li.innerHTML); });
          if (!b.content.length) b.content = [''];
        } else if (t === 'checklist') {
          b.content = [].slice.call(wrap.querySelectorAll('.ck-item')).map(function (it) {
            var cb = it.querySelector('input');
            var ed = it.querySelector('.ed');
            return { checked: !!(cb && cb.checked), html: cleanHtml(ed ? ed.innerHTML : '') };
          });
        } else if (t === 'code') {
          var pre = wrap.querySelector('pre');
          if (pre) b.content = pre.innerText;
        } else if (t === 'table') {
          var ths = [].slice.call(wrap.querySelectorAll('thead th')).map(function (th) { return cleanHtml(th.innerHTML); });
          var rows = [].slice.call(wrap.querySelectorAll('tbody tr')).map(function (tr) {
            return [].slice.call(tr.children).map(function (td) { return cleanHtml(td.innerHTML); });
          });
          b.content = { header: ths, rows: rows };
        }
        b.updated_at = Date.now();
      } catch (e) { console.warn('[editor] 序列化块失败', e); }
    }

    /* ---------- 渲染 ---------- */

    function renderBlock(b) {
      var wrap = U.el('div', { class: 'blk', 'data-id': b.id, 'data-type': b.type });
      var gutter = U.el('div', { class: 'blk-gutter' },
        U.el('button', {
          class: 'g-btn', title: '在下方插入块', html: U.ICONS.plus,
          onclick: function (e) { e.stopPropagation(); openAddMenu(wrap, this); }
        }),
        U.el('button', {
          class: 'g-btn', title: '块操作', html: U.ICONS.dots,
          onclick: function (e) { e.stopPropagation(); openBlockMenu(wrap, this); }
        })
      );
      wrap.append(gutter);

      /* P1 评论入口：悬停块时出现在右上角；只读 / 分享模式同样可用。
         未解决评论数与「已解决」样式由 app.js 的 refreshComments 维护（data-count / 类名）。 */
      var cmtBtn = U.el('button', {
        class: 'cmt-btn', title: '评论', html: U.ICONS.chat,
        onclick: function (e) {
          e.stopPropagation();
          if (opts.onComment) opts.onComment(wrap.getAttribute('data-id'), cmtBtn);
        }
      });
      wrap.append(cmtBtn);

      var t = b.type;
      if (TEXT_LIKE[t]) {
        var tag = (t === 'p') ? 'div' : t;
        var ed = U.el(tag, {
          class: 'ed' + (t === 'quote' ? ' ed-quote' : '') + (t !== 'p' && t !== 'quote' ? ' ed-' + t : ''),
          'data-ph': t === 'p' ? '输入需求内容，回车新建块…' : (t === 'quote' ? '输入引用内容…' : '输入标题…'),
          contenteditable: readonly ? 'false' : 'true',
          html: b.content || ''
        });
        wrap.append(ed);
      } else if (t === 'ul' || t === 'ol') {
        var list = U.el(t, { class: 'ed', contenteditable: readonly ? 'false' : 'true' });
        /* 容错：content 异常（字符串 / null）时按单项处理，避免整页渲染中断 */
        var items = Array.isArray(b.content) ? b.content : [''];
        items.forEach(function (item) {
          list.append(U.el('li', { html: item || '' }));
        });
        wrap.append(list);
      } else if (t === 'checklist') {
        var cl = U.el('div', { class: 'checklist' });
        /* 同上：checklist content 期望 [{checked,html}]，坏数据降级为单个空项 */
        var cks = Array.isArray(b.content) ? b.content : [{ checked: false, html: '' }];
        cks.forEach(function (it) {
          cl.append(renderCheckItem(it));
        });
        wrap.append(cl);
      } else if (t === 'code') {
        wrap.append(U.el('pre', {
          class: 'ed ed-code', 'data-ph': '输入代码…',
          contenteditable: readonly ? 'false' : 'true', text: b.content || ''
        }));
      } else if (t === 'table') {
        wrap.append(renderTable(b, wrap));
      } else if (t === 'divider') {
        wrap.append(U.el('hr', { class: 'blk-hr' }));
      }
      return wrap;
    }

    function renderCheckItem(it) {
      var row = U.el('div', { class: 'ck-item' + (it.checked ? ' done' : '') });
      var cb = U.el('input', { type: 'checkbox' });
      cb.checked = !!it.checked;
      cb.disabled = readonly;
      cb.addEventListener('change', function () {
        row.classList.toggle('done', cb.checked);
        var wrap = row.closest('.blk');
        if (wrap) { serializeBlockFromDOM(wrap); scheduleSnapshotPush(); if (opts.onChange) opts.onChange({ kind: 'content' }); }
      });
      var ed = U.el('div', {
        class: 'ed', 'data-ph': '输入待办事项…',
        contenteditable: readonly ? 'false' : 'true', html: it.html || ''
      });
      row.append(cb, ed);
      return row;
    }

    function renderTable(b, wrap) {
      /* 容错：content 非对象 / 缺 rows 时回退默认表，坏数据不再中断渲染 */
      var c = (b.content && typeof b.content === 'object' && !Array.isArray(b.content))
        ? b.content : { header: ['列 1', '列 2', '列 3'], rows: [['', '', ''], ['', '', '']] };
      if (!Array.isArray(c.header) || !c.header.length) c = { header: ['列 1'], rows: [['']] };
      else if (!Array.isArray(c.rows)) c.rows = [[]];
      var ce = readonly ? 'false' : 'true';
      var table = U.el('table', { class: 'tbl' });
      var thead = U.el('thead');
      var htr = U.el('tr');
      c.header.forEach(function (h) { htr.append(U.el('th', { class: 'ed', contenteditable: ce, html: h || '' })); });
      thead.append(htr);
      var tbody = U.el('tbody');
      (c.rows.length ? c.rows : [['']]).forEach(function (r) {
        var tr = U.el('tr');
        r.forEach(function (cell) { tr.append(U.el('td', { class: 'ed', contenteditable: ce, html: cell || '' })); });
        tbody.append(tr);
      });
      table.append(thead, tbody);

      var ctl = U.el('div', { class: 'tbl-ctl' },
        U.el('button', { class: 'g-btn', text: '+行', title: '增加一行', onclick: function (e) { e.stopPropagation(); tblAddRow(wrap); } }),
        U.el('button', { class: 'g-btn', text: '−行', title: '删除一行', onclick: function (e) { e.stopPropagation(); tblDelRow(wrap); } }),
        U.el('button', { class: 'g-btn', text: '+列', title: '增加一列', onclick: function (e) { e.stopPropagation(); tblAddCol(wrap); } }),
        U.el('button', { class: 'g-btn', text: '−列', title: '删除一列', onclick: function (e) { e.stopPropagation(); tblDelCol(wrap); } })
      );
      return U.el('div', { class: 'tbl-root' }, table, ctl);
    }

    function tblAddRow(wrap) {
      flushSerialize(); pushUndo();
      var tb = wrap.querySelector('tbody');
      var cols = wrap.querySelectorAll('thead th').length || 1;
      var tr = U.el('tr');
      for (var i = 0; i < cols; i++) tr.append(U.el('td', { class: 'ed', contenteditable: readonly ? 'false' : 'true' }));
      tb.append(tr);
      serializeBlockFromDOM(wrap);
      if (opts.onChange) opts.onChange({ kind: 'structure' });
      if (opts.onRendered) opts.onRendered();
    }
    function tblDelRow(wrap) {
      var rows = wrap.querySelectorAll('tbody tr');
      if (rows.length <= 1) return;
      flushSerialize(); pushUndo();
      rows[rows.length - 1].remove();
      serializeBlockFromDOM(wrap);
      if (opts.onChange) opts.onChange({ kind: 'structure' });
      if (opts.onRendered) opts.onRendered();
    }
    function tblAddCol(wrap) {
      flushSerialize(); pushUndo();
      var ce = readonly ? 'false' : 'true';
      wrap.querySelectorAll('thead tr').forEach(function (tr) { tr.append(U.el('th', { class: 'ed', contenteditable: ce })); });
      wrap.querySelectorAll('tbody tr').forEach(function (tr) { tr.append(U.el('td', { class: 'ed', contenteditable: ce })); });
      serializeBlockFromDOM(wrap);
      if (opts.onChange) opts.onChange({ kind: 'structure' });
      if (opts.onRendered) opts.onRendered();
    }
    function tblDelCol(wrap) {
      var cols = wrap.querySelectorAll('thead th');
      if (cols.length <= 1) return;
      flushSerialize(); pushUndo();
      wrap.querySelectorAll('tr').forEach(function (tr) { if (tr.children.length > 1) tr.lastElementChild.remove(); });
      serializeBlockFromDOM(wrap);
      if (opts.onChange) opts.onChange({ kind: 'structure' });
      if (opts.onRendered) opts.onRendered();
    }

    function renderAll() {
      container.innerHTML = '';
      if (!blocks.length) blocks = [newBlock('p')];
      var frag = document.createDocumentFragment();
      blocks.forEach(function (b) { frag.append(renderBlock(b)); });
      container.append(frag);
      if (opts.onRendered) opts.onRendered();
    }

    /* ---------- 光标工具 ---------- */

    function placeCaret(ed, atEnd) {
      if (!ed) return;
      try {
        ed.focus();
        var sel = window.getSelection();
        var r = document.createRange();
        r.selectNodeContents(ed);
        r.collapse(!atEnd);
        sel.removeAllRanges();
        sel.addRange(r);
      } catch (e) { /* ignore */ }
    }

    function caretAtStart(ed) {
      var sel = window.getSelection();
      if (!sel.rangeCount || !sel.isCollapsed) return false;
      var r = sel.getRangeAt(0);
      if (!ed.contains(r.startContainer)) return false;
      var pre = document.createRange();
      pre.selectNodeContents(ed);
      try { pre.setEnd(r.startContainer, r.startOffset); } catch (e) { return false; }
      return pre.toString().replace(/\u00a0/g, '').length === 0;
    }

    function currentEditable() {
      var sel = window.getSelection();
      if (!sel.rangeCount) return null;
      var n = sel.anchorNode;
      if (!n) return null;
      var el = n.nodeType === 1 ? n : n.parentElement;
      if (!el || !el.closest) return null;
      var ed = el.closest('.ed');
      return (ed && container.contains(ed)) ? ed : null;
    }

    /* ---------- 撤销 / 重做（文档级快照） ---------- */

    function snapshot() { return JSON.parse(JSON.stringify(blocks)); }
    function sameSn(a, b) { return JSON.stringify(a) === JSON.stringify(b); }

    function pushUndo() {
      var s = snapshot();
      var top = undoStack[undoStack.length - 1];
      if (!top || !sameSn(top, s)) {
        undoStack.push(s);
        if (undoStack.length > 80) undoStack.shift();
      }
      redoStack.length = 0;
      fireUndoState();
    }

    var scheduleSnapshotPush = U.debounce(function () {
      var s = snapshot();
      var top = undoStack[undoStack.length - 1];
      if (!top || !sameSn(top, s)) {
        undoStack.push(s);
        if (undoStack.length > 80) undoStack.shift();
        fireUndoState();
      }
    }, 900);

    function fireUndoState() {
      if (opts.onUndoState) {
        var canUndo = undoStack.length > 0 && !(undoStack.length === 1 && sameSn(undoStack[0], blocks));
        opts.onUndoState({ canUndo: canUndo, canRedo: redoStack.length > 0 });
      }
    }

    function undo() {
      flushSerialize();
      if (!undoStack.length) return;
      var top = undoStack[undoStack.length - 1];
      if (sameSn(top, blocks)) {
        undoStack.pop();
        if (!undoStack.length) { fireUndoState(); return; }
      }
      redoStack.push(snapshot());
      blocks = undoStack.pop();
      renderAll();
      if (opts.onChange) opts.onChange({ kind: 'undo' });
      fireUndoState();
    }

    function redo() {
      flushSerialize();
      if (!redoStack.length) return;
      undoStack.push(snapshot());
      blocks = redoStack.pop();
      renderAll();
      if (opts.onChange) opts.onChange({ kind: 'undo' });
      fireUndoState();
    }

    /* ---------- 块级操作 ---------- */

    function splitBlock(wrap, ed) {
      flushSerialize();
      var b = blockById(wrap.getAttribute('data-id'));
      if (!b) return;
      var sel = window.getSelection();
      if (!sel.rangeCount) return;
      var r = sel.getRangeAt(0);
      var afterHtml = '';
      try {
        var after = document.createRange();
        after.selectNodeContents(ed);
        after.setStart(r.startContainer, r.startOffset);
        var frag = after.extractContents();
        var tmp = U.el('div');
        tmp.append(frag);
        afterHtml = tmp.innerHTML;
      } catch (err) { /* ignore */ }
      pushUndo();
      serializeBlockFromDOM(wrap);
      var nb = { id: U.uid('block'), type: 'p', content: afterHtml, created_at: Date.now(), updated_at: Date.now() };
      blocks.splice(blocks.indexOf(b) + 1, 0, nb);
      var nw = renderBlock(nb);
      wrap.after(nw);
      placeCaret(nw.querySelector('.ed'), false);
      if (opts.onChange) opts.onChange({ kind: 'structure' });
      if (opts.onRendered) opts.onRendered();
    }

    function removeBlock(wrap) {
      flushSerialize();
      var b = blockById(wrap.getAttribute('data-id'));
      if (!b) return;
      pushUndo();
      blocks.splice(blocks.indexOf(b), 1);
      var prevWrap = wrap.previousElementSibling && wrap.previousElementSibling.classList.contains('blk') ? wrap.previousElementSibling : null;
      wrap.remove();
      if (!blocks.length) {
        blocks = [newBlock('p')];
        container.append(renderBlock(blocks[0]));
        placeCaret(container.querySelector('.blk .ed'), false);
      } else if (prevWrap) {
        var pe = prevWrap.querySelector('.ed');
        if (pe) placeCaret(pe, true);
      }
      if (opts.onChange) opts.onChange({ kind: 'structure' });
      if (opts.onRendered) opts.onRendered();
    }

    function mergeBlocks(prevWrap, wrap) {
      flushSerialize();
      var pb = blockById(prevWrap.getAttribute('data-id'));
      var cb = blockById(wrap.getAttribute('data-id'));
      if (!pb || !cb || !TEXT_LIKE[pb.type]) return;
      pushUndo();
      var prevEd = prevWrap.querySelector('.ed');
      var html = wrap.querySelector('.ed') ? wrap.querySelector('.ed').innerHTML : '';
      blocks.splice(blocks.indexOf(cb), 1);
      wrap.remove();
      // 在旧内容末尾放标记，拼接后把光标落在拼接点
      var marker = U.el('span', { id: '__caret_marker__' });
      prevEd.appendChild(marker);
      prevEd.insertAdjacentHTML('beforeend', html);
      try {
        var after = marker.nextSibling;
        var sel = window.getSelection();
        var rr = document.createRange();
        if (after) { rr.setStartBefore(after); rr.collapse(true); }
        else { rr.selectNodeContents(prevEd); rr.collapse(false); }
        sel.removeAllRanges(); sel.addRange(rr);
      } catch (e) { placeCaret(prevEd, true); }
      marker.remove();
      scheduleSerialize(pb.id);
      if (opts.onChange) opts.onChange({ kind: 'structure' });
      if (opts.onRendered) opts.onRendered();
    }

    function checklistEnter(wrap, ed) {
      flushSerialize();
      var item = ed.closest('.ck-item');
      if (!item) return;
      var all = wrap.querySelectorAll('.ck-item');
      if (!U.stripHtml(ed.innerHTML) && all.length > 1) {
        pushUndo();
        var b = blockById(wrap.getAttribute('data-id'));
        var nb = newBlock('p');
        blocks.splice(blocks.indexOf(b) + 1, 0, nb);
        item.remove();
        serializeBlockFromDOM(wrap);
        var nw = renderBlock(nb);
        wrap.after(nw);
        placeCaret(nw.querySelector('.ed'), false);
        if (opts.onChange) opts.onChange({ kind: 'structure' });
        if (opts.onRendered) opts.onRendered();
        return;
      }
      pushUndo();
      var newItem = renderCheckItem({ checked: false, html: '' });
      item.after(newItem);
      placeCaret(newItem.querySelector('.ed'), false);
      serializeBlockFromDOM(wrap);
      if (opts.onChange) opts.onChange({ kind: 'structure' });
    }

    function checklistBackspace(wrap, ed, e) {
      if (!caretAtStart(ed)) return;
      var item = ed.closest('.ck-item');
      if (!item) return;
      var all = wrap.querySelectorAll('.ck-item');
      var empty = !U.stripHtml(ed.innerHTML);
      if (all.length > 1) {
        e.preventDefault();
        var prevItem = item.previousElementSibling;
        if (prevItem && empty) {
          flushSerialize(); pushUndo();
          item.remove();
          serializeBlockFromDOM(wrap);
          placeCaret(prevItem.querySelector('.ed'), true);
          if (opts.onChange) opts.onChange({ kind: 'structure' });
        } else if (prevItem) {
          flushSerialize(); pushUndo();
          var ped = prevItem.querySelector('.ed');
          placeCaret(ped, true);
          ped.insertAdjacentHTML('beforeend', ed.innerHTML);
          item.remove();
          serializeBlockFromDOM(wrap);
          if (opts.onChange) opts.onChange({ kind: 'structure' });
        } else if (empty) {
          convertTo('p', wrap);
        }
      } else if (empty) {
        e.preventDefault();
        convertTo('p', wrap);
      }
    }

    function insertBlock(type, afterWrap) {
      flushSerialize();
      pushUndo();
      var nb = newBlock(type);
      var nw;
      if (afterWrap) {
        var b = blockById(afterWrap.getAttribute('data-id'));
        blocks.splice(blocks.indexOf(b) + 1, 0, nb);
        nw = renderBlock(nb);
        afterWrap.after(nw);
      } else {
        blocks.push(nb);
        nw = renderBlock(nb);
        container.append(nw);
      }
      if (type !== 'divider') {
        var ed = nw.querySelector('.ed');
        if (ed) placeCaret(ed, false);
      }
      if (opts.onChange) opts.onChange({ kind: 'structure' });
      if (opts.onRendered) opts.onRendered();
    }

    function convertTo(type, wrap) {
      flushSerialize();
      var b = blockById(wrap.getAttribute('data-id'));
      if (!b || b.type === type) return;
      pushUndo();
      var html = blockToHtml(b);
      b.type = type;
      b.content = (type === 'ul' || type === 'ol') ? [html]
        : (type === 'checklist') ? [{ checked: false, html: html }]
        : (type === 'divider') ? null
        : (type === 'table') ? { header: [html || '列 1', '列 2'], rows: [['', '']] }
        : html;
      b.updated_at = Date.now();
      var nw = renderBlock(b);
      wrap.replaceWith(nw);
      if (type !== 'divider' && type !== 'table') {
        var ed = nw.querySelector('.ed');
        if (ed) placeCaret(ed, false);
      }
      if (opts.onChange) opts.onChange({ kind: 'structure' });
      if (opts.onRendered) opts.onRendered();
    }

    function moveBlock(id, dir) {
      flushSerialize();
      var b = blockById(id);
      if (!b) return;
      var idx = blocks.indexOf(b);
      var t = idx + dir;
      if (t < 0 || t >= blocks.length) return;
      pushUndo();
      blocks.splice(idx, 1);
      blocks.splice(t, 0, b);
      renderAll();
      if (opts.onChange) opts.onChange({ kind: 'structure' });
    }

    /* ---------- 菜单 ---------- */

    function openAddMenu(wrap, btn) {
      var items = Object.keys(BLOCK_TYPES).map(function (t) {
        return {
          label: BLOCK_TYPES[t], badge: BADGES[t],
          onClick: function () { insertBlock(t, wrap); }
        };
      });
      U.menu(items, btn.getBoundingClientRect());
    }

    function openBlockMenu(wrap, btn) {
      var id = wrap.getAttribute('data-id');
      var b = blockById(id);
      if (!b) return;
      var idx = blocks.indexOf(b);
      var items = [];
      if (TEXT_LIKE[b.type] || b.type === 'ul' || b.type === 'ol') {
        ['p', 'h1', 'h2', 'h3', 'quote', 'ul', 'ol'].forEach(function (t) {
          if (t !== b.type) items.push({ label: '转换为' + BLOCK_TYPES[t], badge: BADGES[t], onClick: function () { convertTo(t, wrap); } });
        });
        items.push('-');
      }
      items.push({ label: '上移', icon: U.ICONS.up, disabled: idx === 0, onClick: function () { moveBlock(id, -1); } });
      items.push({ label: '下移', icon: U.ICONS.down, disabled: idx === blocks.length - 1, onClick: function () { moveBlock(id, 1); } });
      items.push('-');
      items.push({ label: '删除此块', icon: U.ICONS.trash, danger: true, onClick: function () { removeBlock(wrap); } });
      U.menu(items, btn.getBoundingClientRect());
    }

    /* ---------- 工具栏 ---------- */

    var toolbarEl = null;

    function updateTypeLabel() {
      if (!toolbarEl) return;
      var b = currentBlockId ? blockById(currentBlockId) : null;
      var label = toolbarEl.querySelector('.tb-type-label');
      if (label) label.textContent = b ? (BLOCK_TYPES[b.type] || '正文') : '正文';
    }

    function openTypeMenu(btn) {
      var b = currentBlockId ? blockById(currentBlockId) : null;
      var curType = b ? b.type : null;
      var items = ['p', 'h1', 'h2', 'h3', 'quote', 'ul', 'ol'].map(function (t) {
        return {
          label: BLOCK_TYPES[t], badge: BADGES[t], checked: t === curType,
          onClick: function () {
            var wrap = container.querySelector('.blk[data-id="' + currentBlockId + '"]');
            if (wrap && curType && (TEXT_LIKE[curType] || curType === 'ul' || curType === 'ol')) convertTo(t, wrap);
          }
        };
      });
      U.menu(items, btn.getBoundingClientRect());
    }

    function swatchPopover(anchorBtn, colors, apply) {
      var box = U.el('div', { class: 'palette' });
      colors.forEach(function (c) {
        var sw = U.el('button', { class: 'swatch', title: c, style: 'background:' + c });
        sw.addEventListener('click', function () { closeRef.close(); apply(c); });
        box.append(sw);
      });
      var closeRef = U.popover(anchorBtn.getBoundingClientRect(), box);
    }

    function buildToolbar() {
      toolbarEl = U.el('div', { class: 'ed-toolbar' });
      var g1 = U.el('div', { class: 'tb-group' });
      var typeBtn = U.el('button', {
        class: 'tb-btn tb-type', title: '转换当前块类型',
        html: '<span class="tb-type-label">正文</span>' + U.ICONS.chevronD
      });
      typeBtn.addEventListener('mousedown', preventDefault);
      typeBtn.addEventListener('click', function () { openTypeMenu(typeBtn); });
      g1.append(typeBtn);

      var g2 = U.el('div', { class: 'tb-group' });
      [['<b>B</b>', 'bold', '加粗'], ['<i>I</i>', 'italic', '斜体'], ['<u>U</u>', 'underline', '下划线'], ['<s>S</s>', 'strikeThrough', '删除线']].forEach(function (d) {
        var btn = U.el('button', { class: 'tb-btn tb-fmt', html: d[0], title: d[2] });
        btn.addEventListener('mousedown', preventDefault);
        btn.addEventListener('click', function () { document.execCommand(d[1], false, null); });
        g2.append(btn);
      });

      var g3 = U.el('div', { class: 'tb-group' });
      var colorBtn = U.el('button', { class: 'tb-btn', title: '字体颜色', html: '<span class="swatch-dot"></span>A' });
      colorBtn.addEventListener('mousedown', preventDefault);
      colorBtn.addEventListener('click', function () {
        swatchPopover(colorBtn, COLORS, function (c) {
          document.execCommand('styleWithCSS', false, true);
          document.execCommand('foreColor', false, c);
        });
      });
      var hlBtn = U.el('button', { class: 'tb-btn', title: '背景高亮', html: '<span class="hl-demo">ab</span>' });
      hlBtn.addEventListener('mousedown', preventDefault);
      hlBtn.addEventListener('click', function () {
        swatchPopover(hlBtn, HIGHLIGHTS, function (c) {
          document.execCommand('styleWithCSS', false, true);
          document.execCommand('hiliteColor', false, c === 'transparent' ? 'transparent' : c);
        });
      });
      var linkBtn = U.el('button', { class: 'tb-btn', title: '超链接 / 点击已有链接可解除', html: U.ICONS.link });
      linkBtn.addEventListener('mousedown', preventDefault);
      linkBtn.addEventListener('click', async function () {
        var sel = window.getSelection();
        var node = sel && sel.anchorNode ? (sel.anchorNode.nodeType === 1 ? sel.anchorNode : sel.anchorNode.parentElement) : null;
        var inLink = node && node.closest ? node.closest('a') : null;
        if (inLink && container.contains(inLink)) { document.execCommand('unlink'); return; }
        if (!sel || !sel.toString()) { U.toast('请先选中要添加链接的文字', 'warn'); return; }
        var url = await U.prompt({ title: '插入超链接', label: '链接地址', placeholder: 'https://example.com', okLabel: '插入' });
        if (!url) return;
        if (!/^(https?:|mailto:|#|\/)/i.test(url)) url = 'https://' + url;
        document.execCommand('createLink', false, url);
        var ed = currentEditable();
        if (ed) ed.querySelectorAll('a').forEach(function (a) { a.target = '_blank'; a.rel = 'noopener'; });
      });
      g3.append(colorBtn, hlBtn, linkBtn);

      var g4 = U.el('div', { class: 'tb-group' });
      var insBtn = U.el('button', { class: 'tb-btn', title: '插入块', html: U.ICONS.plus + '<span>插入</span>' + U.ICONS.chevronD });
      insBtn.addEventListener('mousedown', preventDefault);
      insBtn.addEventListener('click', function () {
        var items = ['ul', 'ol', 'checklist', 'quote', 'code', 'table', 'divider'].map(function (t) {
          return {
            label: BLOCK_TYPES[t], badge: BADGES[t],
            onClick: function () {
              var wrap = currentBlockId ? container.querySelector('.blk[data-id="' + currentBlockId + '"]') : null;
              insertBlock(t, wrap);
            }
          };
        });
        U.menu(items, insBtn.getBoundingClientRect());
      });
      g4.append(insBtn);

      toolbarEl.append(g1, U.el('div', { class: 'tb-sep' }), g2, U.el('div', { class: 'tb-sep' }), g3, U.el('div', { class: 'tb-sep' }), g4);
      return toolbarEl;
    }

    /* ---------- 事件绑定 ---------- */

    container.addEventListener('input', function (e) {
      if (!e.target.closest) return;
      var ed = e.target.closest('.ed');
      if (!ed) return;
      var wrap = ed.closest('.blk');
      if (!wrap) return;
      scheduleSerialize(wrap.getAttribute('data-id'));
    });

    container.addEventListener('keydown', function (e) {
      var ed = e.target.closest ? e.target.closest('.ed') : null;
      if (!ed) return;
      var wrap = ed.closest('.blk');
      if (!wrap) return;
      var b = blockById(wrap.getAttribute('data-id'));
      if (!b) return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (readonly) return; /* 只读（如连线模式）时放行，由全局处理器做连线撤销/重做 */
        e.preventDefault();
        if (e.shiftKey) redo(); else undo();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        if (readonly) return;
        e.preventDefault(); redo(); return;
      }

      if (e.key === 'Enter' && !e.shiftKey) {
        if (b.type === 'code') { e.preventDefault(); document.execCommand('insertText', false, '\n'); return; }
        if (b.type === 'table') { e.preventDefault(); return; }
        if (b.type === 'ul' || b.type === 'ol') return;
        if (b.type === 'checklist') { e.preventDefault(); checklistEnter(wrap, ed); return; }
        e.preventDefault(); splitBlock(wrap, ed); return;
      }

      if (e.key === 'Backspace') {
        if (b.type === 'checklist') { checklistBackspace(wrap, ed, e); return; }
        if (b.type === 'code' || b.type === 'ul' || b.type === 'ol' || b.type === 'table') return;
        if (caretAtStart(ed)) {
          e.preventDefault();
          var prev = wrap.previousElementSibling;
          if (isEmptyEditable(ed)) {
            removeBlock(wrap);
          } else if (prev && prev.classList.contains('blk')) {
            mergeBlocks(prev, wrap);
          }
        }
        return;
      }

      if (e.key === 'Tab' && b.type === 'code') {
        e.preventDefault();
        document.execCommand('insertText', false, '  ');
      }
    });

    function isEmptyEditable(ed) {
      return !U.stripHtml(ed.innerHTML);
    }

    container.addEventListener('paste', function (e) {
      var ed = e.target.closest ? e.target.closest('.ed') : null;
      if (!ed) return;
      e.preventDefault();
      var cd = e.clipboardData || window.clipboardData;
      if (!cd) return;
      var html = cd.getData('text/html');
      var text = cd.getData('text/plain');
      if (html) {
        var clean = sanitizeHtml(html);
        if (clean) { document.execCommand('insertHTML', false, clean); return; }
      }
      if (text) document.execCommand('insertText', false, text);
    });

    container.addEventListener('focusin', function (e) {
      if (!e.target.closest) return;
      var ed = e.target.closest('.ed');
      if (!ed) return;
      var wrap = ed.closest('.blk');
      var nid = wrap ? wrap.getAttribute('data-id') : null;
      if (nid !== currentBlockId) { currentBlockId = nid; updateTypeLabel(); }
    });

    container.addEventListener('click', function (e) {
      if (!e.target.closest) return;
      var wrap = e.target.closest('.blk');
      if (wrap && opts.onBlockClick) opts.onBlockClick(e, wrap.getAttribute('data-id'));
    });

    var onSelectionChange = function () {
      /* 页面切换后旧实例自清理：container 已从 DOM 移除时摘掉监听，
         避免监听器与浮动格式条残留 */
      if (!container.isConnected) {
        hideFloatBar();
        document.removeEventListener('selectionchange', onSelectionChange);
        return;
      }
      var sel = window.getSelection();
      if (!sel || !sel.anchorNode) { hideFloatBar(); return; }
      var n = sel.anchorNode.nodeType === 1 ? sel.anchorNode : sel.anchorNode.parentElement;
      if (!n || !container.contains(n)) { hideFloatBar(); return; }
      var wrap = n.closest ? n.closest('.blk') : null;
      var nid = wrap ? wrap.getAttribute('data-id') : null;
      if (nid !== currentBlockId) { currentBlockId = nid; updateTypeLabel(); }
      scheduleFloatBar(); /* 划词浮动格式条（Notion 式） */
    };
    document.addEventListener('selectionchange', onSelectionChange);

    /* ---------- 划词浮动格式条 ----------
       在需求编辑器里选中文字时，于选区上方弹出迷你格式条（加粗/斜体/
       下划线/删除线/颜色/高亮），免去移动到顶部工具栏的往返。
       与主工具栏共用 execCommand 与 .tb-btn 样式；selectionchange 高频
       触发，用 rAF 合并调度；只读模式 / 代码块 / 非 .ed 区域不出现。 */

    var floatBar = null, floatRaf = 0;

    function hideFloatBar() {
      if (floatRaf) { cancelAnimationFrame(floatRaf); floatRaf = 0; }
      if (floatBar) { floatBar.remove(); floatBar = null; }
    }

    function scheduleFloatBar() {
      if (floatRaf) cancelAnimationFrame(floatRaf);
      floatRaf = requestAnimationFrame(updateFloatBar);
    }

    function updateFloatBar() {
      floatRaf = 0;
      var sel = window.getSelection();
      var ok = !!sel && !sel.isCollapsed && !!sel.toString().trim() && sel.rangeCount > 0 && !readonly;
      var n = ok && sel.anchorNode ? (sel.anchorNode.nodeType === 1 ? sel.anchorNode : sel.anchorNode.parentElement) : null;
      var ed = n && n.closest ? n.closest('.ed') : null;
      if (ok && (!ed || !container.contains(ed)
        || ed.getAttribute('contenteditable') === 'false'
        || (ed.closest('.blk[data-type="code"]')))) ok = false;
      if (!ok) { hideFloatBar(); return; }
      var rect = sel.getRangeAt(0).getBoundingClientRect();
      if (!rect || (!rect.width && !rect.height)) { hideFloatBar(); return; }
      if (!floatBar) buildFloatBar();
      positionFloatBar(rect);
    }

    function positionFloatBar(rect) {
      if (!floatBar) return;
      var bw = floatBar.offsetWidth, bh = floatBar.offsetHeight;
      var x = Math.round(rect.left + rect.width / 2 - bw / 2);
      x = Math.max(8, Math.min(x, window.innerWidth - bw - 8));
      var y = Math.round(rect.top - bh - 8);
      if (y < 54) y = Math.round(rect.bottom + 8); /* 贴近顶栏时改放选区下方 */
      floatBar.style.left = x + 'px';
      floatBar.style.top = y + 'px';
    }

    function buildFloatBar() {
      floatBar = U.el('div', { class: 'fmt-float' });
      [['<b>B</b>', 'bold', '加粗（Ctrl+B）'], ['<i>I</i>', 'italic', '斜体（Ctrl+I）'], ['<u>U</u>', 'underline', '下划线'], ['<s>S</s>', 'strikeThrough', '删除线']].forEach(function (d) {
        var btn = U.el('button', { class: 'tb-btn tb-fmt', html: d[0], title: d[2] });
        btn.addEventListener('mousedown', preventDefault);
        btn.addEventListener('click', function () {
          document.execCommand(d[1], false, null);
          var sel = window.getSelection();
          if (sel && sel.rangeCount) {
            try { positionFloatBar(sel.getRangeAt(0).getBoundingClientRect()); } catch (e) { /* ignore */ }
          }
        });
        floatBar.append(btn);
      });
      floatBar.append(U.el('div', { class: 'tb-sep' }));
      var colorBtn = U.el('button', { class: 'tb-btn', title: '字体颜色', html: '<span class="swatch-dot"></span>A' });
      colorBtn.addEventListener('mousedown', preventDefault);
      colorBtn.addEventListener('click', function () {
        swatchPopover(colorBtn, COLORS, function (c) {
          document.execCommand('styleWithCSS', false, true);
          document.execCommand('foreColor', false, c);
        });
      });
      var hlBtn = U.el('button', { class: 'tb-btn', title: '背景高亮', html: '<span class="hl-demo">ab</span>' });
      hlBtn.addEventListener('mousedown', preventDefault);
      hlBtn.addEventListener('click', function () {
        swatchPopover(hlBtn, HIGHLIGHTS, function (c) {
          document.execCommand('styleWithCSS', false, true);
          document.execCommand('hiliteColor', false, c === 'transparent' ? 'transparent' : c);
        });
      });
      floatBar.append(colorBtn, hlBtn);
      document.body.append(floatBar);
    }

    /* 滚动 / 窗口变化时选区矩形随之移动，简单隐藏即可（再次划词重新出现） */
    window.addEventListener('scroll', hideFloatBar, true);
    window.addEventListener('resize', hideFloatBar);

    /* ---------- 粘贴净化（白名单） ---------- */

    function sanitizeHtml(html) {
      try {
        var doc = new DOMParser().parseFromString(html, 'text/html');
        var tmp = U.el('div');
        [].slice.call(doc.body.childNodes).forEach(function (n) { tmp.append(cleanNode(n)); });
        return tmp.innerHTML;
      } catch (e) { return ''; }
    }
    function cleanNode(n) {
      if (n.nodeType === 3) return document.createTextNode(n.nodeValue);
      if (n.nodeType !== 1) return document.createTextNode('');
      var tag = n.tagName.toLowerCase();
      var ok = ['b', 'strong', 'i', 'em', 'u', 's', 'strike', 'del', 'a', 'br', 'span', 'code'];
      if (ok.indexOf(tag) < 0) {
        var frag = document.createDocumentFragment();
        [].slice.call(n.childNodes).forEach(function (c) { frag.append(cleanNode(c)); });
        return frag;
      }
      var el = document.createElement(tag);
      if (tag === 'a') {
        var href = n.getAttribute('href');
        if (href && /^(https?:|mailto:|#|\/)/i.test(href)) {
          el.setAttribute('href', href);
          el.setAttribute('target', '_blank');
          el.setAttribute('rel', 'noopener');
        }
      }
      if (tag === 'span') {
        var st = n.getAttribute('style') || '';
        var m = /(^|;)\s*color:\s*([^;]+)/i.exec(st);
        var bg = /(^|;)\s*background(?:-color)?:\s*([^;]+)/i.exec(st);
        if (m) el.style.color = m[2].trim();
        if (bg) el.style.backgroundColor = bg[3].trim();
      }
      [].slice.call(n.childNodes).forEach(function (c) { el.append(cleanNode(c)); });
      return el;
    }

    /* ---------- 只读 ---------- */

    function setReadonly(ro) {
      readonly = !!ro;
      container.classList.toggle('readonly', readonly);
      if (toolbarEl) toolbarEl.style.display = readonly ? 'none' : '';
      container.querySelectorAll('.ed').forEach(function (ed) {
        ed.setAttribute('contenteditable', readonly ? 'false' : 'true');
      });
      container.querySelectorAll('.ck-item input').forEach(function (cb) { cb.disabled = readonly; });
    }

    /* ---------- API ---------- */

    api.setBlocks = function (arr) {
      flushSerialize();
      blocks = (arr && arr.length) ? JSON.parse(JSON.stringify(arr)) : [newBlock('p')];
      undoStack = [snapshot()];
      redoStack = [];
      renderAll();
      fireUndoState();
    };
    api.getBlocks = function () {
      flushSerialize();
      return JSON.parse(JSON.stringify(blocks));
    };
    api.setReadonly = setReadonly;
    api.undo = undo;
    api.redo = redo;
    api.flashBlock = function (id) {
      var el = container.querySelector('.blk[data-id="' + id + '"]');
      if (!el) return;
      el.classList.remove('flash');
      void el.offsetWidth;
      el.classList.add('flash');
      setTimeout(function () { el.classList.remove('flash'); }, 1700);
    };
    api.getBlockEl = function (id) { return container.querySelector('.blk[data-id="' + id + '"]'); };
    api.scrollBlockIntoView = function (id) {
      var el = api.getBlockEl(id);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };
    api.focusEnd = function () {
      var last = container.querySelector('.blk:last-child .ed');
      if (last) placeCaret(last, true);
    };
    api.blockPreview = function (id) {
      var b = blockById(id);
      return b ? U.stripHtml(blockToHtml(b)).slice(0, 60) : '';
    };
    api.toolbarEl = buildToolbar();
    api.destroy = function () {
      document.removeEventListener('selectionchange', onSelectionChange);
    };

    return api;
  };
})();
