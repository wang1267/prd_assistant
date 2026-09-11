/* ============================================================
 * visual-editor.js · 桌面端画布式原型编辑器
 *
 * 只在编辑态加载 Moveable。原型始终放在隔离 iframe 中，编辑结果以完整
 * HTML 返回；原型自带脚本在编辑时暂停，保存时原样还原。
 * ============================================================ */
(function () {
  'use strict';

  var MOVEABLE_URL = 'js/vendor/moveable.min.js';
  var SCRIPT_MARK = 'protoreq-script:';

  function documentHtml(doc) {
    return '<!DOCTYPE html>\n' + doc.documentElement.outerHTML;
  }

  function prepareSource(html) {
    if (window.PRD_MODE) html = PRD_MODE.safeHTML(html, true);
    var doc = new DOMParser().parseFromString(
      html || '<!doctype html><html lang="zh-CN"><head><meta charset="UTF-8"></head><body></body></html>',
      'text/html'
    );
    var scripts = [];
    [].slice.call(doc.querySelectorAll('script')).forEach(function (node, index) {
      scripts[index] = node.outerHTML;
      node.replaceWith(doc.createComment(SCRIPT_MARK + index));
    });
    if (!doc.querySelector('base')) {
      var base = doc.createElement('base');
      base.href = document.baseURI;
      base.setAttribute('data-pr-editor', 'base');
      doc.head.insertBefore(base, doc.head.firstChild);
    }
    return { html: documentHtml(doc), scripts: scripts };
  }

  function cleanEditorHtml(doc) {
    var clone = doc.cloneNode(true);
    [].slice.call(clone.querySelectorAll('[data-pr-editor], .moveable-control-box')).forEach(function (node) {
      node.remove();
    });
    [].slice.call(clone.querySelectorAll('[data-pr-editing]')).forEach(function (node) {
      var old = node.getAttribute('data-pr-contenteditable');
      if (old === '__none__' || old === null) node.removeAttribute('contenteditable');
      else node.setAttribute('contenteditable', old);
      node.removeAttribute('data-pr-editing');
      node.removeAttribute('data-pr-contenteditable');
      node.removeAttribute('spellcheck');
    });
    [].slice.call(clone.querySelectorAll('[data-pr-hover]')).forEach(function (node) {
      node.removeAttribute('data-pr-hover');
    });
    return documentHtml(clone);
  }

  function restoreScripts(html, scripts) {
    var doc = new DOMParser().parseFromString(html, 'text/html');
    var walker = doc.createTreeWalker(doc.documentElement, NodeFilter.SHOW_COMMENT);
    var comments = [];
    while (walker.nextNode()) comments.push(walker.currentNode);
    var restored = {};
    comments.forEach(function (comment) {
      var value = String(comment.nodeValue || '').trim();
      if (value.indexOf(SCRIPT_MARK) !== 0) return;
      var index = Number(value.slice(SCRIPT_MARK.length));
      if (!scripts[index] || restored[index]) { comment.remove(); return; }
      var holder = doc.createElement('template');
      holder.innerHTML = scripts[index];
      var script = holder.content.firstChild;
      if (script) comment.replaceWith(script);
      else comment.remove();
      restored[index] = true;
    });
    return documentHtml(doc);
  }

  function loadMoveable(win, doc) {
    if (win.Moveable) return Promise.resolve(win.Moveable);
    return new Promise(function (resolve, reject) {
      var existingHeadNodes = [].slice.call(doc.head.children);
      var script = doc.createElement('script');
      if (window.PRD_MODE) script.nonce = doc.querySelector('meta[name="prd-editor-nonce"]').content;
      script.src = MOVEABLE_URL;
      script.setAttribute('data-pr-editor', 'moveable');
      script.onload = function () {
        /* Moveable 会向 head 注入运行时样式；标记后才能在保存 HTML 时剔除。 */
        [].slice.call(doc.head.children).forEach(function (node) {
          if (existingHeadNodes.indexOf(node) < 0 && node !== script) node.setAttribute('data-pr-editor', 'moveable-style');
        });
        if (win.Moveable) resolve(win.Moveable);
        else reject(new Error('画布组件未正确加载'));
      };
      script.onerror = function () { reject(new Error('画布组件加载失败，请检查网络')); };
      doc.head.appendChild(script);
    });
  }

  function isTextElement(el) {
    if (!el || el.nodeType !== 1) return false;
    return !/^(IMG|SVG|PATH|VIDEO|AUDIO|CANVAS|IFRAME|INPUT|TEXTAREA|SELECT|OPTION|HR)$/i.test(el.tagName);
  }

  function elementName(el) {
    if (!el) return '未选择';
    var tag = (el.tagName || '').toLowerCase();
    var id = el.id ? '#' + el.id : '';
    var cls = '';
    if (!id && el.classList && el.classList.length) cls = '.' + el.classList[0];
    return tag + id + cls;
  }

  window.openVisualEditor = function (opts) {
    opts = opts || {};
    var source = prepareSource(opts.html || '');
    var host = U.el('div', { class: 'visual-editor' });
    var viewport = U.el('div', { class: 've-viewport', tabindex: '0' });
    var surface = U.el('div', { class: 've-surface' });
    var frame = U.el('iframe', {
      class: 've-frame',
      title: '原型编辑画布',
      sandbox: 'allow-same-origin allow-scripts allow-forms'
    });
    surface.append(frame);
    viewport.append(surface);

    var status = U.el('span', { class: 've-status', text: '正在打开画布…' });
    var selectToolBtn = U.el('button', { class: 've-mode-btn active', text: '选择', title: '选择工具（V）' });
    var handToolBtn = U.el('button', { class: 've-mode-btn', text: '抓手', title: '抓手工具（H），也可按住空格' });
    var selectedName = U.el('span', { class: 've-selected-name', text: '未选择' });
    var selectionTools = U.el('div', { class: 've-selection-tools' });
    var parentBtn = U.el('button', { class: 'btn btn-sm', text: '上一级', title: '选择父级元素' });
    var textBtn = U.el('button', { class: 'btn btn-sm', text: '改文字', title: '编辑选中元素的文字' });
    var duplicateBtn = U.el('button', { class: 'btn btn-sm', text: '复制', title: '复制选中元素（Ctrl+D）' });
    var deleteBtn = U.el('button', { class: 'btn btn-sm ve-danger-btn', text: '删除', title: '删除选中元素（Delete）' });
    var fontSizeInput = U.el('input', { class: 've-font-size', type: 'number', min: '8', max: '200', step: '1', title: '字体大小（像素）' });
    var boldBtn = U.el('button', { class: 've-format-btn', text: 'B', title: '加粗' });
    var italicBtn = U.el('button', { class: 've-format-btn ve-italic-btn', text: 'I', title: '斜体' });
    var underlineBtn = U.el('button', { class: 've-format-btn ve-underline-btn', text: 'U', title: '下划线' });
    var textColorInput = U.el('input', { class: 've-color-input', type: 'color', value: '#1d1d1f', title: '文字颜色' });
    var fillColorInput = U.el('input', { class: 've-color-input', type: 'color', value: '#ffffff', title: '区域填充颜色' });
    var clearFillBtn = U.el('button', { class: 've-format-btn ve-clear-fill', text: '×', title: '清除区域填充' });
    var textColorField = U.el('div', { class: 've-color-field', title: '文字颜色' }, U.el('span', { text: '字' }), textColorInput);
    var fillColorField = U.el('div', { class: 've-color-field', title: '区域填充颜色' }, U.el('span', { text: '填' }), fillColorInput, clearFillBtn);
    var layerBackBtn = U.el('button', { class: 've-format-btn', text: '置底', title: '置于同级元素底层' });
    var layerDownBtn = U.el('button', { class: 've-format-btn', text: '下移', title: '向下移动一层' });
    var layerUpBtn = U.el('button', { class: 've-format-btn', text: '上移', title: '向上移动一层' });
    var layerFrontBtn = U.el('button', { class: 've-format-btn', text: '置顶', title: '置于同级元素顶层' });

    var styleClipboard = null;
    var copyStyleBtn = U.el('button', { class: 'btn btn-sm', text: '复制样式', title: '复制颜色、字体、边框等视觉样式（Ctrl+Shift+C）', disabled: 'disabled' });
    var pasteStyleBtn = U.el('button', { class: 'btn btn-sm', text: '粘贴样式', title: '应用已复制样式（Ctrl+Shift+V）', disabled: 'disabled' });
    var properties = U.el('div', { class: 've-properties', 'aria-label': '元素精确调整' });
    var precisionFields = [
      { property: 'width', label: '宽', min: 1, max: 10000 },
      { property: 'height', label: '高', min: 1, max: 10000 },
      { property: 'padding', label: '内边距', min: 0, max: 500 },
      { property: 'margin', label: '外边距', min: -500, max: 500 },
      { property: 'borderRadius', label: '圆角', min: 0, max: 500 }
    ];
    precisionFields.forEach(function (field) {
      field.input = U.el('input', { type: 'number', min: String(field.min), max: String(field.max), step: '1', disabled: 'disabled', 'aria-label': field.label + '（像素）', 'data-ve-property': field.property });
      properties.append(U.el('label', {}, U.el('span', { text: field.label }), field.input));
    });
    properties.append(copyStyleBtn, pasteStyleBtn, U.el('span', { class: 've-hint', text: 'px · 选择元素后调整；Alt + 方向键改尺寸，Shift 加速' }));

    var undoBtn = U.el('button', { class: 'btn btn-sm', text: '撤销', disabled: 'disabled' });
    var redoBtn = U.el('button', { class: 'btn btn-sm', text: '重做', disabled: 'disabled' });
    var zoomOutBtn = U.el('button', { class: 've-icon-btn', text: '−', title: '缩小画布' });
    var zoomBtn = U.el('button', { class: 've-zoom-value', text: '100%', title: '适应窗口' });
    var zoomInBtn = U.el('button', { class: 've-icon-btn', text: '+', title: '放大画布' });
    var aiOptimizeBtn = U.el('button', { class: 'btn btn-sm', html: U.ICONS.spark + '<span>AI 优化</span>', title: '在保留现有结构与连线锚点的前提下优化当前原型' });
    var cancelBtn = U.el('button', { class: 'btn btn-sm', text: '取消' });
    var saveBtn = U.el('button', { class: 'btn btn-primary btn-sm', text: '完成编辑' });

    function inspectorSection(title, content) {
      return U.el('section', { class: 've-inspector-section' }, U.el('h3', { text: title }), content);
    }
    var emptyInspector = U.el('div', { class: 've-inspector-empty' },
      U.el('span', { class: 've-empty-symbol', text: '↖', 'aria-hidden': 'true' }),
      U.el('b', { text: '选择一个元素' }),
      U.el('p', { text: '点击画布中的文字或区域，在这里调整尺寸、颜色和样式。' }),
      U.el('span', { text: '双击文字可直接编辑' })
    );
    var textSection = inspectorSection('文字', U.el('div', { class: 've-inspector-stack' },
      textBtn,
      U.el('label', { class: 've-font-field' }, U.el('span', { text: '字号' }), fontSizeInput, U.el('span', { text: 'px' })),
      U.el('div', { class: 've-inspector-row' }, boldBtn, italicBtn, underlineBtn, textColorField)
    ));
    // Reuse existing inputs and handlers; only move them into contextual groups.
    properties.querySelectorAll('.ve-hint').forEach(function (node) { node.remove(); });
    selectionTools.append(
      inspectorSection('布局', properties),
      textSection,
      inspectorSection('外观', U.el('div', { class: 've-inspector-stack' }, fillColorField, precisionFields[4].input.parentElement)),
      inspectorSection('排列', U.el('div', { class: 've-layer-grid' }, layerBackBtn, layerDownBtn, layerUpBtn, layerFrontBtn)),
      inspectorSection('样式', U.el('div', { class: 've-inspector-row' }, copyStyleBtn, pasteStyleBtn)),
      inspectorSection('元素操作', U.el('div', { class: 've-element-actions' }, parentBtn, duplicateBtn, deleteBtn))
    );
    var contextBar = U.el('div', { class: 've-contextbar' }, selectionTools);
    var inspectorToggle = U.el('button', { class: 'btn btn-sm', text: '属性', title: '显示或收起元素属性', 'aria-controls': 've-inspector', 'aria-expanded': 'true' });
    var inspectorClose = U.el('button', { class: 've-icon-btn', text: '×', 'aria-label': '收起属性面板', title: '收起属性面板' });
    var inspector = U.el('aside', { class: 've-inspector', id: 've-inspector', 'aria-label': '元素属性' },
      U.el('div', { class: 've-inspector-heading' }, U.el('b', { text: '元素属性' }), inspectorClose),
      U.el('div', { class: 've-selection-heading' }, selectedName), emptyInspector, contextBar
    );
    var dock = U.el('div', { class: 've-canvas-dock', role: 'toolbar', 'aria-label': '画布工具' },
      U.el('div', { class: 've-mode-switch' }, selectToolBtn, handToolBtn),
      U.el('span', { class: 've-tool-divider' }), zoomOutBtn, zoomBtn, zoomInBtn
    );
    host.append(
      U.el('div', { class: 've-topbar' },
        U.el('div', { class: 've-title' }, U.el('b', { text: '编辑原型' }), status),
        U.el('div', { class: 've-tools', role: 'toolbar', 'aria-label': '编辑操作' },
          U.el('div', { class: 've-history-group' }, undoBtn, redoBtn),
          U.el('span', { class: 've-tool-divider' }), inspectorToggle, aiOptimizeBtn,
          U.el('span', { class: 've-tool-divider' }), cancelBtn, saveBtn
        )
      ),
      U.el('div', { class: 've-workspace' }, U.el('div', { class: 've-canvas-area' }, viewport, dock), inspector)
    );
    function setInspectorOpen(open) {
      host.classList.toggle('ve-inspector-hidden', !open);
      inspectorToggle.setAttribute('aria-expanded', String(open));
      inspector.hidden = !open;
    }
    inspectorToggle.addEventListener('click', function () { setInspectorOpen(inspector.hidden); });
    inspectorClose.addEventListener('click', function () { setInspectorOpen(false); inspectorToggle.focus(); });
    setInspectorOpen(window.innerWidth > 760);
    host.querySelectorAll('button[title],input[title]').forEach(function (el) { if (!el.hasAttribute('aria-label')) el.setAttribute('aria-label', el.title); });

    var modal = U.modal({ title: '', closable: false, body: host });
    modal.card.classList.add('modal-visual');
    var overlay = modal.card.parentElement;
    if (overlay) overlay.classList.add('modal-overlay-visual');

    var moveable = null;
    var selected = null;
    var editingText = null;
    var hoverTarget = null;
    var destroyed = false;
    var initializing = false;
    var frameWidth = 1440;
    var frameHeight = 900;
    var zoom = 1;
    var history = [];
    var historyScripts = [];
    var historyIndex = -1;
    var initialSnapshot = '';
    var firstChangeSent = false;
    var resizeObserver = null;
    var gestureStartHtml = '';
    var toolMode = 'select';
    var spaceHeld = false;
    var panning = null;
    var suppressNextClick = false;
    var styleGesture = null;
    var pendingAiSnapshot = null;
    var pendingAiScripts = null;

    function frameDoc() {
      try { return frame.contentDocument; } catch (e) { return null; }
    }

    function close() {
      destroyed = true;
      if (resizeObserver) resizeObserver.disconnect();
      try { if (moveable) moveable.destroy(); } catch (e) { /* ignore */ }
      window.removeEventListener('keydown', onWindowKeyDown, true);
      window.removeEventListener('keyup', onWindowKeyUp, true);
      modal.close();
    }

    function isSvgElement(el) {
      return !!(el && el.namespaceURI === 'http://www.w3.org/2000/svg');
    }

    function isPanMode() {
      return toolMode === 'hand' || spaceHeld;
    }

    function colorToHex(value, fallback) {
      var nums = String(value || '').match(/[\d.]+/g);
      if (!nums || nums.length < 3 || (nums.length > 3 && Number(nums[3]) === 0)) return fallback;
      return '#' + nums.slice(0, 3).map(function (part) {
        var s = Math.max(0, Math.min(255, Math.round(Number(part)))).toString(16);
        return s.length < 2 ? '0' + s : s;
      }).join('');
    }

    function isTransparentColor(value) {
      return !value || value === 'transparent' || /rgba\([^)]*,\s*0(?:\.0+)?\s*\)/i.test(value);
    }

    function syncInspector() {
      var enabled = !!selected;
      var textEnabled = enabled && isTextElement(selected);
      emptyInspector.hidden = enabled;
      textSection.hidden = !textEnabled;
      contextBar.hidden = !enabled;
      selectedName.parentElement.hidden = !enabled;
      [fontSizeInput, boldBtn, italicBtn, underlineBtn, textColorInput].forEach(function (el) { el.disabled = !textEnabled; });
      [fillColorInput, clearFillBtn, layerBackBtn, layerDownBtn, layerUpBtn, layerFrontBtn].forEach(function (el) { el.disabled = !enabled; });
      copyStyleBtn.disabled = !enabled;
      pasteStyleBtn.disabled = !enabled || !styleClipboard;
      precisionFields.forEach(function (field) { field.input.disabled = !enabled || isSvgElement(selected); if (!enabled) field.input.value = ''; });
      if (!enabled) return;
      var win = frame.contentWindow;
      if (!win) return;
      var cs = win.getComputedStyle(selected);
      if (textEnabled) {
        fontSizeInput.value = String(Math.round((parseFloat(cs.fontSize) || 14) * 10) / 10);
        boldBtn.classList.toggle('active', cs.fontWeight === 'bold' || (parseInt(cs.fontWeight, 10) || 0) >= 600);
        italicBtn.classList.toggle('active', cs.fontStyle === 'italic' || cs.fontStyle === 'oblique');
        underlineBtn.classList.toggle('active', String(cs.textDecorationLine || cs.textDecoration || '').indexOf('underline') >= 0);
        textColorInput.value = colorToHex(cs.color, '#1d1d1f');
      }
      precisionFields.forEach(function (field) {
        var value = cs[field.property];
        if (field.property === 'width') value = selected.offsetWidth;
        if (field.property === 'height') value = selected.offsetHeight;
        // 多边间距或多角圆角不冒充统一值，输入后才统一设置。
        var parts = String(value || '').trim().split(/\s+/);
        var mixed = parts.some(function (part) { return part !== parts[0]; });
        field.input.value = mixed || !Number.isFinite(parseFloat(value)) ? '' : String(Math.round(parseFloat(value) * 10) / 10);
        field.input.placeholder = mixed ? '多值' : '自动';
      });
      fillColorInput.value = colorToHex(cs.backgroundColor, '#ffffff');
      fillColorField.classList.toggle('is-transparent', isTransparentColor(cs.backgroundColor));
    }

    function applyStyle(property, value, label) {
      if (!selected) return;
      finishText(true);
      var before = currentSnapshot();
      setSelectedStyle(property, value);
      markCommitted(label, before);
      syncInspector();
      if (moveable) { try { moveable.updateRect(); } catch (e) { /* ignore */ } }
    }

    function setSelectedStyle(property, value) {
      if ((property === 'width' || property === 'height') && selected) {
        if (frame.contentWindow.getComputedStyle(selected).display === 'inline') selected.style.display = 'inline-block';
        selected.style.boxSizing = 'border-box';
      }
      selected.style[property] = value;
    }

    var visualProperties = ['color', 'backgroundColor', 'fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'lineHeight', 'letterSpacing', 'textAlign', 'textDecoration', 'borderTop', 'borderRight', 'borderBottom', 'borderLeft', 'borderRadius', 'boxShadow', 'opacity'];
    function copyVisualStyle() {
      if (!selected) return;
      finishText(true);
      var cs = frame.contentWindow.getComputedStyle(selected);
      styleClipboard = {};
      visualProperties.forEach(function (key) { styleClipboard[key] = cs[key]; });
      status.textContent = '样式已复制，选择另一个元素后粘贴';
      syncInspector();
    }
    function pasteVisualStyle() {
      if (!selected || !styleClipboard) return;
      finishText(true);
      var before = currentSnapshot();
      visualProperties.forEach(function (key) { selected.style[key] = styleClipboard[key]; });
      markCommitted('样式已粘贴，可撤销', before);
      syncInspector();
      if (moveable) moveable.updateRect();
    }
    function styleShortcut(event) {
      if (editingText || isTypingTarget(event.target) || !(event.ctrlKey || event.metaKey) || !event.shiftKey) return false;
      var key = String(event.key || '').toLowerCase();
      if (key !== 'c' && key !== 'v') return false;
      event.preventDefault();
      if (key === 'c') copyVisualStyle(); else pasteVisualStyle();
      return true;
    }

    function bindLiveStyleField(input, property, label, normalize) {
      function begin() {
        if (!selected) return;
        finishText(true);
        styleGesture = { input: input, target: selected, before: currentSnapshot() };
      }
      function apply() {
        if (!styleGesture || styleGesture.input !== input || styleGesture.target !== selected) begin();
        if (!selected) return;
        var value = normalize ? normalize(input.value) : input.value;
        if (value !== null) setSelectedStyle(property, value);
        if (moveable) { try { moveable.updateRect(); } catch (e) { /* ignore */ } }
      }
      function commit() {
        if (!styleGesture || styleGesture.input !== input || styleGesture.target !== selected) return;
        var before = styleGesture.before;
        styleGesture = null;
        markCommitted(label, before);
        syncInspector();
      }
      input.addEventListener('focus', begin);
      input.addEventListener('pointerdown', begin);
      input.addEventListener('input', apply);
      input.addEventListener('change', commit);
      input.addEventListener('blur', commit);
    }

    function changeLayer(mode) {
      if (!selected || !selected.parentElement) return;
      finishText(true);
      var before = currentSnapshot();
      var win = frame.contentWindow;
      var siblings = [].slice.call(selected.parentElement.children).filter(function (el) {
        return el !== selected && !(el.closest && el.closest('[data-pr-editor]'));
      });
      var values = siblings.map(function (el) {
        var z = parseInt(win.getComputedStyle(el).zIndex, 10);
        return isNaN(z) ? 0 : z;
      });
      var current = parseInt(win.getComputedStyle(selected).zIndex, 10);
      if (isNaN(current)) current = 0;
      var next = current;
      if (mode === 'front') next = Math.max.apply(Math, [current].concat(values)) + 1;
      else if (mode === 'back') next = Math.min.apply(Math, [current].concat(values)) - 1;
      else if (mode === 'up') next = current + 1;
      else next = current - 1;
      if (win.getComputedStyle(selected).position === 'static') selected.style.position = 'relative';
      selected.style.zIndex = String(next);
      markCommitted('层级已修改', before);
      syncInspector();
    }

    function updateMoveableInteraction() {
      if (!moveable) return;
      var enabled = !!selected && !isPanMode() && !editingText;
      moveable.draggable = enabled;
      moveable.resizable = enabled && !isSvgElement(selected);
      moveable.scalable = enabled && isSvgElement(selected);
      moveable.zoom = 1 / Math.max(zoom, 0.01);
      try { moveable.updateRect(); } catch (e) { /* ignore */ }
    }

    function syncCanvasCursor() {
      viewport.classList.toggle('hand-mode', isPanMode());
      var doc = frameDoc();
      if (doc && doc.documentElement) {
        if (isPanMode()) doc.documentElement.setAttribute('data-pr-pan', 'true');
        else doc.documentElement.removeAttribute('data-pr-pan');
      }
      updateMoveableInteraction();
    }

    function setToolMode(mode) {
      toolMode = mode === 'hand' ? 'hand' : 'select';
      selectToolBtn.classList.toggle('active', toolMode === 'select');
      handToolBtn.classList.toggle('active', toolMode === 'hand');
      status.textContent = toolMode === 'hand' ? '拖动画布' : (isChanged() ? '已修改' : '已保存');
      syncCanvasCursor();
    }

    function setSpaceHeld(value) {
      if (editingText || spaceHeld === value) return;
      spaceHeld = value;
      syncCanvasCursor();
    }

    function currentSnapshot() {
      var doc = frameDoc();
      return doc && doc.documentElement ? cleanEditorHtml(doc) : (history[historyIndex] || source.html);
    }

    function isChanged() {
      return !!initialSnapshot && currentSnapshot() !== initialSnapshot;
    }

    function syncHistoryButtons() {
      undoBtn.disabled = historyIndex <= 0 || initializing;
      redoBtn.disabled = historyIndex < 0 || historyIndex >= history.length - 1 || initializing;
    }

    function markCommitted(label, beforeHtml) {
      if (destroyed || initializing) return;
      var next = currentSnapshot();
      var previous = beforeHtml || history[historyIndex] || '';
      if (next === previous) { status.textContent = '已保存'; return; }
      history = history.slice(0, historyIndex + 1);
      historyScripts = historyScripts.slice(0, historyIndex + 1);
      history.push(next);
      historyScripts.push((source.scripts || []).slice());
      historyIndex = history.length - 1;
      status.textContent = label || '已修改';
      if (!firstChangeSent) {
        firstChangeSent = true;
        if (opts.onFirstChange) opts.onFirstChange();
      }
      syncHistoryButtons();
      syncInspector();
      updateFrameHeight();
    }

    function selectElement(el) {
      var doc = frameDoc();
      styleGesture = null;
      if (!doc || !el || el.nodeType !== 1 || el === doc.body || el === doc.documentElement) {
        selected = null;
      } else if (el.closest && el.closest('[data-pr-editor], .moveable-control-box')) {
        return;
      } else {
        selected = el;
      }
      contextBar.classList.toggle('active', !!selected);
      selectionTools.classList.toggle('active', !!selected);
      selectedName.textContent = elementName(selected);
      parentBtn.disabled = !selected || !selected.parentElement || selected.parentElement === doc.body;
      textBtn.disabled = !isTextElement(selected);
      syncInspector();
      if (moveable) {
        moveable.target = selected;
        moveable.elementGuidelines = guidelineElements(doc, selected);
        updateMoveableInteraction();
      }
    }

    function guidelineElements(doc, except) {
      return [].slice.call(doc.body.querySelectorAll('header,main,section,article,aside,nav,div,button,img,h1,h2,h3,p'))
        .filter(function (el) {
          if (el === except || (el.closest && el.closest('[data-pr-editor]'))) return false;
          var rect = el.getBoundingClientRect();
          return rect.width > 4 && rect.height > 4;
        }).slice(0, 120);
    }

    function finishText(commit) {
      if (!editingText) return;
      var el = editingText;
      var before = el.__prBeforeTextHtml || '';
      el.removeEventListener('blur', onTextBlur);
      var old = el.getAttribute('data-pr-contenteditable');
      if (old === '__none__') el.removeAttribute('contenteditable');
      else if (old !== null) el.setAttribute('contenteditable', old);
      el.removeAttribute('data-pr-editing');
      el.removeAttribute('data-pr-contenteditable');
      el.removeAttribute('spellcheck');
      delete el.__prBeforeTextHtml;
      editingText = null;
      updateMoveableInteraction();
      if (commit) markCommitted('文字已修改', before);
      if (moveable) setTimeout(function () { try { moveable.updateRect(); } catch (e) { /* ignore */ } }, 0);
    }

    function onTextBlur() { finishText(true); }

    function editSelectedText() {
      if (!selected || !isTextElement(selected)) return;
      finishText(true);
      editingText = selected;
      selected.__prBeforeTextHtml = currentSnapshot();
      selected.setAttribute('data-pr-contenteditable', selected.hasAttribute('contenteditable') ? selected.getAttribute('contenteditable') : '__none__');
      selected.setAttribute('data-pr-editing', 'true');
      selected.setAttribute('contenteditable', 'true');
      selected.setAttribute('spellcheck', 'false');
      updateMoveableInteraction();
      selected.addEventListener('blur', onTextBlur);
      selected.focus();
      status.textContent = '正在修改文字';
    }

    function duplicateSelected() {
      if (!selected || !selected.parentNode) return;
      finishText(true);
      var before = currentSnapshot();
      var clone = selected.cloneNode(true);
      clone.removeAttribute('data-proto-id');
      selected.parentNode.insertBefore(clone, selected.nextSibling);
      selectElement(clone);
      markCommitted('已复制元素', before);
    }

    function deleteSelected() {
      if (!selected || !selected.parentNode) return;
      finishText(false);
      var before = currentSnapshot();
      var parent = selected.parentElement;
      selected.remove();
      selectElement(parent && parent !== frameDoc().body ? parent : null);
      markCommitted('已删除元素', before);
    }

    function updateSurface() {
      frame.style.width = frameWidth + 'px';
      frame.style.height = frameHeight + 'px';
      frame.style.transform = 'scale(' + zoom + ')';
      surface.style.width = Math.round(frameWidth * zoom) + 'px';
      surface.style.height = Math.round(frameHeight * zoom) + 'px';
      zoomBtn.textContent = Math.round(zoom * 100) + '%';
      if (moveable) {
        try { moveable.zoom = 1 / Math.max(zoom, 0.01); moveable.updateRect(); } catch (e) { /* ignore */ }
      }
    }

    function setZoom(value, anchor) {
      var old = zoom;
      var next = Math.round(value * 20) / 20;
      zoom = Math.max(0.1, Math.min(4, next));
      if (Math.abs(old - zoom) < 0.001) return;
      var oldSurfaceLeft = surface.offsetLeft;
      var oldSurfaceTop = surface.offsetTop;
      var pointX = anchor ? (viewport.scrollLeft + anchor.x - oldSurfaceLeft) / old : frameWidth / 2;
      var pointY = anchor ? (viewport.scrollTop + anchor.y - oldSurfaceTop) / old : 0;
      updateSurface();
      if (anchor) {
        viewport.scrollLeft = surface.offsetLeft + pointX * zoom - anchor.x;
        viewport.scrollTop = surface.offsetTop + pointY * zoom - anchor.y;
      }
    }

    function fitCanvas() {
      var available = Math.max(320, viewport.clientWidth - 96);
      setZoom(Math.min(1, available / frameWidth));
      viewport.scrollLeft = Math.max(0, (surface.offsetWidth - viewport.clientWidth) / 2);
      viewport.scrollTop = 32;
    }

    function updateFrameHeight() {
      var doc = frameDoc();
      if (!doc || !doc.body) return;
      var minHeight = Math.max(720, Math.ceil((viewport.clientHeight - 64) / zoom));
      var next = Math.max(minHeight, doc.documentElement.scrollHeight, doc.body.scrollHeight);
      if (Math.abs(next - frameHeight) > 2) {
        frameHeight = next;
        updateSurface();
      }
    }

    function loadHistory(index) {
      if (index < 0 || index >= history.length || initializing) return;
      finishText(false);
      initializing = true;
      historyIndex = index;
      if (historyScripts[index]) source.scripts = historyScripts[index].slice();
      selected = null;
      syncHistoryButtons();
      frame.srcdoc = history[index];
    }

    function applyAiHtml(html) {
      var nextSource = prepareSource(html);
      source = nextSource;
      pendingAiSnapshot = true;
      pendingAiScripts = nextSource.scripts.slice();
      initializing = true;
      selected = null;
      frame.srcdoc = source.html;
    }

    async function runAiOptimize() {
      if (initializing) return;
      if (!window.AI || !AI.isRemoteReady()) {
        U.toast('请先在设置页完成 AI 配置并测试连接', 'warn');
        return;
      }
      var request = await U.prompt({
        title: 'AI 优化当前原型',
        label: '优先优化什么（可留空）',
        placeholder: '例如：让信息层级更清晰，重点操作更突出'
      });
      if (request === null || destroyed) return;
      var snapshot = restoreScripts(currentSnapshot(), source.scripts);
      aiOptimizeBtn.disabled = true;
      aiOptimizeBtn.innerHTML = '<span class="spin"></span><span>优化中…</span>';
      status.textContent = 'AI 正在优化原型';
      try {
        var result = await AI.optimizePrototype(request, snapshot);
        if (destroyed) return;
        applyAiHtml(result.html);
        U.toast('AI 优化结果已载入画布，可继续调整后保存', 'success');
      } catch (error) {
        if (!destroyed) {
          status.textContent = isChanged() ? '已修改' : '已保存';
          U.toast((error && error.message) || 'AI 优化失败', 'error', 5200);
        }
      } finally {
        aiOptimizeBtn.disabled = false;
        aiOptimizeBtn.innerHTML = U.ICONS.spark + '<span>AI 优化</span>';
      }
    }

    function attachMoveable(Moveable, win, doc) {
      var headBeforeMoveable = [].slice.call(doc.head.children);
      moveable = new Moveable(doc.body, {
        target: null,
        draggable: true,
        resizable: true,
        scalable: false,
        snappable: true,
        snapGridWidth: 8,
        snapGridHeight: 8,
        snapThreshold: 5,
        isDisplaySnapDigit: true,
        origin: false,
        /* 边框整条都可拖动缩放，不要求用户精准点中小圆点。 */
        edge: true,
        dragArea: false,
        passDragArea: true,
        controlPadding: 8,
        zoom: 1 / Math.max(zoom, 0.01),
        useResizeObserver: true,
        useMutationObserver: true,
        throttleDrag: 1,
        throttleResize: 1,
        renderDirections: ['nw', 'n', 'ne', 'w', 'e', 'sw', 's', 'se']
      });
      [].slice.call(doc.head.children).forEach(function (node) {
        if (headBeforeMoveable.indexOf(node) < 0) node.setAttribute('data-pr-editor', 'moveable-style');
      });

      moveable.on('dragStart', function () {
        finishText(true);
        gestureStartHtml = currentSnapshot();
        status.textContent = '移动中';
      });
      moveable.on('drag', function (event) {
        event.target.style.transform = event.transform;
      });
      moveable.on('dragEnd', function (event) {
        if (event.lastEvent) markCommitted('位置已修改', gestureStartHtml);
      });
      moveable.on('resizeStart', function (event) {
        finishText(true);
        gestureStartHtml = currentSnapshot();
        if (win.getComputedStyle(event.target).display === 'inline') event.target.style.display = 'inline-block';
        event.setOrigin(['%', '%']);
        if (event.dragStart) event.dragStart.set([0, 0]);
        status.textContent = '缩放中';
      });
      moveable.on('resize', function (event) {
        event.target.style.width = Math.max(1, event.width) + 'px';
        event.target.style.height = Math.max(1, event.height) + 'px';
        event.target.style.boxSizing = 'border-box';
        if (event.drag) event.target.style.transform = event.drag.transform;
      });
      moveable.on('resizeEnd', function (event) {
        if (event.lastEvent) markCommitted('尺寸已修改', gestureStartHtml);
      });
      moveable.on('scaleStart', function () {
        finishText(true);
        gestureStartHtml = currentSnapshot();
        status.textContent = '缩放中';
      });
      moveable.on('scale', function (event) {
        event.target.style.transform = event.transform;
      });
      moveable.on('scaleEnd', function (event) {
        if (event.lastEvent) markCommitted('尺寸已修改', gestureStartHtml);
      });
      updateMoveableInteraction();
    }

    function beginPan(event, coordinateScale, captureTarget) {
      if (panning) return;
      panning = {
        x: event.clientX,
        y: event.clientY,
        left: viewport.scrollLeft,
        top: viewport.scrollTop,
        scale: coordinateScale || 1,
        moved: false
      };
      viewport.classList.add('panning');
      if (captureTarget && captureTarget.setPointerCapture && event.pointerId !== undefined) {
        try { captureTarget.setPointerCapture(event.pointerId); } catch (e) { /* ignore */ }
      }
    }

    function movePan(event) {
      if (!panning) return;
      var dx = (event.clientX - panning.x) * panning.scale;
      var dy = (event.clientY - panning.y) * panning.scale;
      if (Math.abs(dx) + Math.abs(dy) > 3) panning.moved = true;
      viewport.scrollLeft = panning.left - dx;
      viewport.scrollTop = panning.top - dy;
    }

    function endPan() {
      if (!panning) return;
      suppressNextClick = panning.moved;
      panning = null;
      viewport.classList.remove('panning');
      setTimeout(function () { suppressNextClick = false; }, 0);
    }

    function nudgeSelected(event) {
      if (!selected || !moveable || isPanMode() || editingText) return false;
      var amount = event.shiftKey ? 10 : 1;
      var dx = event.key === 'ArrowLeft' ? -amount : event.key === 'ArrowRight' ? amount : 0;
      var dy = event.key === 'ArrowUp' ? -amount : event.key === 'ArrowDown' ? amount : 0;
      if (!dx && !dy) return false;
      if (event.altKey) {
        if (isSvgElement(selected)) return false;
        var before = currentSnapshot();
        if (dx) setSelectedStyle('width', Math.max(1, Math.min(10000, selected.offsetWidth + dx)) + 'px');
        if (dy) setSelectedStyle('height', Math.max(1, Math.min(10000, selected.offsetHeight + dy)) + 'px');
        markCommitted('尺寸已调整', before); syncInspector(); moveable.updateRect();
      } else moveable.request('draggable', { deltaX: dx, deltaY: dy }, true);
      return true;
    }

    function isTypingTarget(target) {
      if (!target || target.nodeType !== 1) return false;
      return /^(INPUT|TEXTAREA|SELECT)$/i.test(target.tagName) || target.isContentEditable;
    }

    function onWindowKeyDown(event) {
      if (destroyed || isTypingTarget(event.target)) return;
      if (styleShortcut(event)) return;
      var key = String(event.key || '').toLowerCase();
      if (event.code === 'Space' || event.key === ' ') {
        event.preventDefault();
        setSpaceHeld(true);
      } else if (!event.ctrlKey && !event.metaKey && !event.altKey && key === 'v') {
        setToolMode('select');
      } else if (!event.ctrlKey && !event.metaKey && !event.altKey && key === 'h') {
        setToolMode('hand');
      } else if ((event.ctrlKey || event.metaKey) && key === '0') {
        event.preventDefault();
        fitCanvas();
      } else if (nudgeSelected(event)) {
        event.preventDefault();
      }
    }

    function onWindowKeyUp(event) {
      if (event.code === 'Space' || event.key === ' ') setSpaceHeld(false);
    }

    function attachFrameEvents(win, doc) {
      var style = doc.createElement('style');
      style.setAttribute('data-pr-editor', 'style');
      style.textContent = [
        'html{min-height:100%;}',
        'body{min-height:100%;}',
        '[data-pr-hover]:not([data-pr-editing]){outline:1px solid rgba(91,91,214,.55)!important;outline-offset:1px;}',
        '[data-pr-editing]{outline:2px solid #5b5bd6!important;outline-offset:2px;cursor:text!important;}',
        '.moveable-control-box{z-index:2147483000!important;}',
        '.moveable-line{background:#5b5bd6!important;}',
        '.moveable-control{width:10px!important;height:10px!important;margin-top:-5px!important;margin-left:-5px!important;border:2px solid #5b5bd6!important;background:#fff!important;}',
        '.moveable-guideline{background:#ef476f!important;}',
        'html[data-pr-pan],html[data-pr-pan] body,html[data-pr-pan] body *{cursor:grab!important;user-select:none!important;}',
        'html[data-pr-pan].pr-panning,html[data-pr-pan].pr-panning body,html[data-pr-pan].pr-panning body *{cursor:grabbing!important;}'
      ].join('');
      doc.head.appendChild(style);

      syncCanvasCursor();

      doc.addEventListener('mouseover', function (event) {
        if (isPanMode()) return;
        var target = event.target;
        if (!target || target === doc.body || target === doc.documentElement || (target.closest && target.closest('[data-pr-editor], .moveable-control-box'))) return;
        if (hoverTarget && hoverTarget !== target) hoverTarget.removeAttribute('data-pr-hover');
        hoverTarget = target;
        target.setAttribute('data-pr-hover', 'true');
      }, true);
      doc.addEventListener('mouseout', function (event) {
        if (editingText) return;
        var target = event.target;
        if (target && target.removeAttribute) target.removeAttribute('data-pr-hover');
        if (hoverTarget === target) hoverTarget = null;
      }, true);
      doc.addEventListener('click', function (event) {
        if (isPanMode() || suppressNextClick) {
          event.preventDefault();
          event.stopPropagation();
          return;
        }
        if (editingText && editingText.contains(event.target)) return;
        event.preventDefault();
        event.stopPropagation();
        selectElement(event.target);
      }, true);
      doc.addEventListener('dblclick', function (event) {
        if (isPanMode()) return;
        event.preventDefault();
        event.stopPropagation();
        selectElement(event.target);
        editSelectedText();
      }, true);
      doc.addEventListener('wheel', function (event) {
        event.preventDefault();
        if (event.ctrlKey || event.metaKey) {
          var frameRect = frame.getBoundingClientRect();
          var viewportRect = viewport.getBoundingClientRect();
          var anchor = {
            x: frameRect.left - viewportRect.left + event.clientX * zoom,
            y: frameRect.top - viewportRect.top + event.clientY * zoom
          };
          setZoom(zoom + (event.deltaY < 0 ? 0.1 : -0.1), anchor);
        } else {
          viewport.scrollLeft += event.deltaX || (event.shiftKey ? event.deltaY : 0);
          viewport.scrollTop += event.shiftKey ? 0 : event.deltaY;
        }
      }, { passive: false, capture: true });
      doc.addEventListener('pointerdown', function (event) {
        if (!isPanMode() && event.button !== 1) {
          if (event.button === 0 && !editingText) {
            var target = event.target;
            var isEditorControl = target && target.closest && target.closest('[data-pr-editor], .moveable-control-box');
            if (target && target !== doc.body && target !== doc.documentElement && !isEditorControl && target !== selected) {
              selectElement(target);
            }
          }
          return;
        }
        event.preventDefault();
        event.stopPropagation();
        doc.documentElement.classList.add('pr-panning');
        beginPan(event, zoom, doc.documentElement);
      }, true);
      doc.addEventListener('pointermove', function (event) {
        if (!panning) return;
        event.preventDefault();
        movePan(event);
      }, true);
      doc.addEventListener('pointerup', function () {
        doc.documentElement.classList.remove('pr-panning');
        endPan();
      }, true);
      doc.addEventListener('pointercancel', function () {
        doc.documentElement.classList.remove('pr-panning');
        endPan();
      }, true);
      doc.addEventListener('submit', function (event) { event.preventDefault(); }, true);
      doc.addEventListener('keydown', function (event) {
        if (styleShortcut(event)) return;
        var key = (event.key || '').toLowerCase();
        if (editingText) {
          if (event.key === 'Escape') { event.preventDefault(); editingText.blur(); }
          if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') { event.preventDefault(); editingText.blur(); }
          return;
        }
        if (event.code === 'Space' || event.key === ' ') {
          event.preventDefault();
          setSpaceHeld(true);
        } else if (!event.ctrlKey && !event.metaKey && !event.altKey && key === 'v') {
          setToolMode('select');
        } else if (!event.ctrlKey && !event.metaKey && !event.altKey && key === 'h') {
          setToolMode('hand');
        } else if ((event.ctrlKey || event.metaKey) && key === '0') {
          event.preventDefault();
          fitCanvas();
        } else if (nudgeSelected(event)) {
          event.preventDefault();
        } else if ((event.ctrlKey || event.metaKey) && key === 'z') {
          event.preventDefault();
          if (event.shiftKey) redoBtn.click(); else undoBtn.click();
        } else if ((event.ctrlKey || event.metaKey) && key === 'y') {
          event.preventDefault(); redoBtn.click();
        } else if ((event.ctrlKey || event.metaKey) && key === 'd') {
          event.preventDefault(); duplicateSelected();
        } else if (event.key === 'Delete' || event.key === 'Backspace') {
          event.preventDefault(); deleteSelected();
        } else if (event.key === 'Enter') {
          event.preventDefault(); editSelectedText();
        } else if (event.key === 'Escape') {
          event.preventDefault(); selectElement(null);
        }
      }, true);
      doc.addEventListener('keyup', function (event) {
        if (event.code === 'Space' || event.key === ' ') setSpaceHeld(false);
      }, true);
    }

    function initializeFrame() {
      if (destroyed) return;
      var doc = frameDoc();
      var win = frame.contentWindow;
      if (!doc || !doc.body || !win) return;
      try { if (moveable) moveable.destroy(); } catch (e) { /* ignore */ }
      moveable = null;
      selected = null;
      editingText = null;
      contextBar.classList.remove('active');
      selectionTools.classList.remove('active');
      syncInspector();
      attachFrameEvents(win, doc);
      loadMoveable(win, doc).then(function (Moveable) {
        if (destroyed || doc !== frameDoc()) return;
        attachMoveable(Moveable, win, doc);
        if (!history.length) {
          initialSnapshot = currentSnapshot();
          history = [initialSnapshot];
          historyScripts = [(source.scripts || []).slice()];
          historyIndex = 0;
          requestAnimationFrame(fitCanvas);
        } else if (pendingAiSnapshot) {
          pendingAiSnapshot = null;
          var aiSnapshot = currentSnapshot();
          history = history.slice(0, historyIndex + 1);
          historyScripts = historyScripts.slice(0, historyIndex + 1);
          history.push(aiSnapshot);
          historyScripts.push((pendingAiScripts || source.scripts || []).slice());
          pendingAiScripts = null;
          historyIndex = history.length - 1;
          if (!firstChangeSent) {
            firstChangeSent = true;
            if (opts.onFirstChange) opts.onFirstChange();
          }
        }
        initializing = false;
        status.textContent = isChanged() ? '已修改' : '已保存';
        syncCanvasCursor();
        syncHistoryButtons();
        updateFrameHeight();
        if ('ResizeObserver' in win) {
          if (resizeObserver) resizeObserver.disconnect();
          resizeObserver = new win.ResizeObserver(function () { updateFrameHeight(); });
          resizeObserver.observe(doc.body);
        }
      }).catch(function (error) {
        initializing = false;
        status.textContent = '画布加载失败';
        saveBtn.disabled = true;
        U.toast(error.message || '画布组件加载失败', 'error');
      });
    }

    syncInspector();
    frame.addEventListener('load', initializeFrame);
    frame.srcdoc = source.html;
    window.addEventListener('keydown', onWindowKeyDown, true);
    window.addEventListener('keyup', onWindowKeyUp, true);

    selectToolBtn.addEventListener('click', function () { setToolMode('select'); });
    handToolBtn.addEventListener('click', function () { setToolMode('hand'); });
    parentBtn.addEventListener('click', function () {
      if (selected && selected.parentElement) selectElement(selected.parentElement);
    });
    textBtn.addEventListener('click', editSelectedText);
    duplicateBtn.addEventListener('click', duplicateSelected);
    deleteBtn.addEventListener('click', deleteSelected);
    copyStyleBtn.addEventListener('click', copyVisualStyle);
    pasteStyleBtn.addEventListener('click', pasteVisualStyle);
    precisionFields.forEach(function (field) {
      bindLiveStyleField(field.input, field.property, field.label + '已修改', function (value) {
        if (!String(value).trim()) return null;
        var number = Number(value);
        return Number.isFinite(number) ? Math.max(field.min, Math.min(field.max, number)) + 'px' : null;
      });
    });
    bindLiveStyleField(fontSizeInput, 'fontSize', '字号已修改', function (value) {
      var n = parseFloat(value);
      return isNaN(n) ? null : Math.max(8, Math.min(200, n)) + 'px';
    });
    bindLiveStyleField(textColorInput, 'color', '文字颜色已修改');
    bindLiveStyleField(fillColorInput, 'backgroundColor', '区域填充已修改');
    boldBtn.addEventListener('click', function () {
      if (!selected) return;
      var weight = frame.contentWindow.getComputedStyle(selected).fontWeight;
      applyStyle('fontWeight', weight === 'bold' || (parseInt(weight, 10) || 0) >= 600 ? '400' : '700', '字重已修改');
    });
    italicBtn.addEventListener('click', function () {
      if (!selected) return;
      var style = frame.contentWindow.getComputedStyle(selected).fontStyle;
      applyStyle('fontStyle', style === 'italic' || style === 'oblique' ? 'normal' : 'italic', '斜体已修改');
    });
    underlineBtn.addEventListener('click', function () {
      if (!selected) return;
      var decoration = frame.contentWindow.getComputedStyle(selected).textDecorationLine || '';
      applyStyle('textDecorationLine', decoration.indexOf('underline') >= 0 ? 'none' : 'underline', '下划线已修改');
    });
    clearFillBtn.addEventListener('click', function () { applyStyle('backgroundColor', 'transparent', '区域填充已清除'); });
    layerBackBtn.addEventListener('click', function () { changeLayer('back'); });
    layerDownBtn.addEventListener('click', function () { changeLayer('down'); });
    layerUpBtn.addEventListener('click', function () { changeLayer('up'); });
    layerFrontBtn.addEventListener('click', function () { changeLayer('front'); });
    undoBtn.addEventListener('click', function () { if (historyIndex > 0) loadHistory(historyIndex - 1); });
    redoBtn.addEventListener('click', function () { if (historyIndex < history.length - 1) loadHistory(historyIndex + 1); });
    zoomOutBtn.addEventListener('click', function () { setZoom(zoom - 0.1, { x: viewport.clientWidth / 2, y: viewport.clientHeight / 2 }); });
    zoomInBtn.addEventListener('click', function () { setZoom(zoom + 0.1, { x: viewport.clientWidth / 2, y: viewport.clientHeight / 2 }); });
    zoomBtn.addEventListener('click', fitCanvas);
    aiOptimizeBtn.addEventListener('click', runAiOptimize);
    viewport.addEventListener('wheel', function (event) {
      if (!(event.ctrlKey || event.metaKey)) return;
      event.preventDefault();
      var rect = viewport.getBoundingClientRect();
      setZoom(zoom + (event.deltaY < 0 ? 0.1 : -0.1), { x: event.clientX - rect.left, y: event.clientY - rect.top });
    }, { passive: false });

    viewport.addEventListener('pointerdown', function (event) {
      if (!isPanMode() && event.button !== 1 && event.target !== viewport && event.target !== surface) return;
      if (!isPanMode() && event.button !== 1 && event.target === frame) return;
      event.preventDefault();
      beginPan(event, 1, viewport);
    });
    viewport.addEventListener('pointermove', function (event) {
      if (!panning) return;
      event.preventDefault();
      movePan(event);
    });
    viewport.addEventListener('pointerup', endPan);
    viewport.addEventListener('pointercancel', endPan);
    viewport.addEventListener('lostpointercapture', endPan);

    cancelBtn.addEventListener('click', function () {
      var changed = isChanged();
      close();
      if (opts.onCancel) opts.onCancel(changed);
    });
    saveBtn.addEventListener('click', function () {
      saveBtn.disabled = true;
      try {
        finishText(true);
        var snapshot = currentSnapshot();
        var changed = snapshot !== initialSnapshot;
        var html = restoreScripts(snapshot, source.scripts);
        if (opts.onSave) opts.onSave(html, changed);
        close();
      } catch (error) {
        saveBtn.disabled = false;
        U.toast(error.message || '保存失败', 'error');
      }
    });
  };
})();
