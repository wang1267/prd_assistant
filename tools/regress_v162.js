// v16.2 回归自测：最小 DOM 桩 + vm 执行主脚本，验证四项安全修复
// 运行：node tools/regress_v162.js
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const block1 = path.join(root, 'tools', 'block1.js');
let src = fs.readFileSync(block1, 'utf8');

// 把 let/const 词法作用域里的关键状态暴露给测试探针
src += `
;globalThis.__test={
  get DATA(){return DATA;}, set DATA(v){DATA=v;},
  get STATE(){return STATE;}, set STATE(v){STATE=v;},
  get saveFailed(){return saveFailed;},
  get undoStack(){return undoStack;},
  get editing(){return editing;},
  get warnEl(){return document.getElementById('storageWarn');},
  get activeEl(){return document.activeElement;}, set activeEl(v){document.activeElement=v;}
};
`;

function makeEl(id) {
  const el = {
    id,
    dataset: {},
    style: {},
    classList: {
      _s: new Set(),
      add(...c) { c.forEach(x => this._s.add(x)); },
      remove(...c) { c.forEach(x => this._s.delete(x)); },
      toggle(c, f) {
        if (f === undefined) { this._s.has(c) ? this._s.delete(c) : this._s.add(c); }
        else { f ? this._s.add(c) : this._s.delete(c); }
        return this._s.has(c);
      },
      contains(c) { return this._s.has(c); },
    },
    _innerHTML: '', _text: '',
    get innerHTML() { return this._innerHTML; },
    set innerHTML(v) { this._innerHTML = v; },
    get textContent() { return this._text; },
    set textContent(v) { this._text = v; },
    className: '', value: '', checked: false, disabled: false, files: null,
    isContentEditable: false, tagName: 'DIV', _listeners: {},
    addEventListener(t, fn) { (this._listeners[t] = this._listeners[t] || []).push(fn); },
    removeEventListener() {},
    appendChild() {}, insertBefore() {}, remove() {}, focus() {}, click() {},
    scrollIntoView() {}, setAttribute() {}, removeAttribute() {},
    getBoundingClientRect() { return { left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0 }; },
    querySelector() { return makeEl(id + '-q'); },
    querySelectorAll() { return []; },
    closest() { return null; },
    contains() { return false; },
  };
  return el;
}

const doc = {
  _els: {},
  _listeners: {},
  documentElement: makeEl('html'),
  body: makeEl('body'),
  activeElement: makeEl('body'),
  getElementById(id) { return (this._els[id] = this._els[id] || makeEl(id)); },
  createElement() { return makeEl('created'); },
  querySelector() { return makeEl('qs'); },
  querySelectorAll() { return []; },
  addEventListener(t, fn) { (this._listeners[t] = this._listeners[t] || []).push(fn); },
  removeEventListener() {},
  fire(t, ev) { (this._listeners[t] || []).forEach(fn => fn(ev)); },
  execCommand() { return true; },
  createRange() { return { cloneRange() { return { collapse() {} }; }, setStartAfter() {}, collapse() {} }; },
};

const storage = {
  _m: {}, throwOnSet: false,
  getItem(k) { return this._m[k] || null; },
  setItem(k, v) { if (this.throwOnSet) { const e = new Error('QuotaExceededError'); e.name = 'QuotaExceededError'; throw e; } this._m[k] = String(v); },
  removeItem(k) { delete this._m[k]; },
};

const ctx = {
  document: doc,
  localStorage: storage,
  console,
  setTimeout, clearTimeout,
  confirm: () => true,
  prompt: () => '',
  alert: () => {},
  TextDecoder,
  URL,
  fetch: () => Promise.reject(new Error('no network in test')),
  FileReader: function () {},
  Blob: function () {},
  DOMParser: function () { return { parseFromString: () => ({ body: { innerHTML: '', querySelectorAll: () => [] } }) }; },
  addEventListener() {},
  removeEventListener() {},
  innerWidth: 1280, innerHeight: 800, scrollX: 0, scrollY: 0,
  getSelection() { return { isCollapsed: true, rangeCount: 0, removeAllRanges() {}, getRangeAt() { return { cloneRange() {} }; } }; },
  matchMedia: () => ({ matches: false, addEventListener() {} }),
};
ctx.window = ctx;
vm.createContext(ctx);

let results = [];
function check(name, cond, detail) {
  results.push({ name, pass: !!cond, detail });
  console.log((cond ? 'PASS' : 'FAIL') + '  ' + name + (cond ? '' : '  >>> ' + detail));
}

try {
  vm.runInContext(src, ctx, { filename: 'block1.js' });
  const t = ctx.__test;
  const { STATE, DATA } = t;

  // ---------- 准备一个带内容的项目 ----------
  ctx.createProject('回归测试', null);
  t.DATA.purpose = { html: '<p>尽量满足，最好全部覆盖</p>', cards: [] };
  t.DATA.other = { html: '<p>其他内容</p>', cards: [] };
  t.DATA.feat = { items: [{ name: 'A', desc: 'x', priority: 'P0', status: '开发中' }], cards: [] };
  t.DATA.accept = { items: [{ text: '通过标准', status: 'pass', id: ctx.uid() }], cards: [] };

  // ---------- P0-1 自定义规则 ----------
  t.STATE.ruleSet.push({ id: 'CUSTOM-ALL', dim: '自定义', desc: '关键词尽量|最好', level: 'yellow', weight: 1, enabled: true, scope: 'all', keyword: '尽量|最好' });
  t.STATE.ruleSet.push({ id: 'CUSTOM-LEGACY', dim: '自定义', desc: '旧数据全部节', level: 'yellow', weight: 1, enabled: true, scope: ['all'], keyword: '尽量' });
  t.STATE.ruleSet.push({ id: 'CUSTOM-ONLY', dim: '自定义', desc: '仅目的节', level: 'red', weight: 1, enabled: true, scope: ['purpose'], keyword: '覆盖' });
  t.STATE.ruleSet.push({ id: 'CUSTOM-REGEX', dim: '自定义', desc: '正则', level: 'yellow', weight: 1, enabled: true, scope: 'all', keyword: '/尽量|最好/i' });
  t.STATE.ruleSet.push({ id: 'CUSTOM-REQ', dim: '自定义', desc: '必填节', level: 'yellow', weight: 1, enabled: true, scope: 'required', keyword: '满足' });
  let h = ctx.runHealth();
  const hitSecs = id => (h.rawHits.filter(x => x.ruleId === id).map(x => x.sectionId));
  check('P0-1 自定义规则 scope=all 命中 purpose', hitSecs('CUSTOM-ALL').includes('purpose'), JSON.stringify(hitSecs('CUSTOM-ALL')));
  check('P0-1 旧数据 scope=["all"] 兼容命中', hitSecs('CUSTOM-LEGACY').includes('purpose'), JSON.stringify(hitSecs('CUSTOM-LEGACY')));
  check('P0-1 自定义规则限定节生效且不越界', hitSecs('CUSTOM-ONLY').length === 1 && hitSecs('CUSTOM-ONLY')[0] === 'purpose', JSON.stringify(hitSecs('CUSTOM-ONLY')));
  check('P0-1 /正则/ 语法生效', hitSecs('CUSTOM-REGEX').includes('purpose'), JSON.stringify(hitSecs('CUSTOM-REGEX')));
  check('P0-1 scope=required 只命中必填节', hitSecs('CUSTOM-REQ').includes('purpose') && !hitSecs('CUSTOM-REQ').includes('other'), JSON.stringify(hitSecs('CUSTOM-REQ')));
  check('P0-1 内置规则未受影响(R-SPEC-01)', h.rawHits.some(x => x.ruleId === 'R-SPEC-01'), 'no R-SPEC-01 hit');

  // ---------- P0-3 localStorage 配额告警 ----------
  storage.throwOnSet = true;
  ctx.save();
  check('P0-3 写满时 saveFailed 置位', t.saveFailed === true, 'saveFailed=' + t.saveFailed);
  check('P0-3 写满时告警条显示', t.warnEl.style.display === 'flex', 'display=' + t.warnEl.style.display);
  storage.throwOnSet = false;
  ctx.save();
  check('P0-3 恢复后 saveFailed 复位', t.saveFailed === false, 'saveFailed=' + t.saveFailed);
  check('P0-3 恢复后告警条隐藏', t.warnEl.style.display === 'none', 'display=' + t.warnEl.style.display);

  // ---------- P1-1 富文本输入自动保存 ----------
  t.DATA.purpose.cards = [{ id: 'c1', title: '旧卡片', html: '<p>old</p>' }];
  const edBody = { dataset: { act: 'editable', id: 'purpose' }, innerHTML: '<p>新正文内容</p>' };
  ctx.scheduleEditableSave(edBody);
  check('P1-1 输入后内存立即同步(DOM→DATA)', t.DATA.purpose.html === '<p>新正文内容</p>', t.DATA.purpose.html);
  check('P1-1 同步不破坏卡片/结构化字段', Array.isArray(t.DATA.purpose.cards) && t.DATA.purpose.cards.length === 1, JSON.stringify(t.DATA.purpose.cards));
  const edCard = { dataset: { act: 'cardbody', sec: 'purpose', idx: '0' }, innerHTML: '<p>新卡片内容</p>' };
  ctx.scheduleEditableSave(edCard);
  check('P1-1 卡片输入同步', t.DATA.purpose.cards[0].html === '<p>新卡片内容</p>', t.DATA.purpose.cards[0].html);

  // ---------- P0-2 Ctrl+Z 不再清空正文 ----------
  const keyZ = { ctrlKey: true, key: 'z', _p: false, preventDefault() { this._p = true; } };
  const editableFocus = makeEl('focus');
  editableFocus.isContentEditable = true;
  t.activeEl = editableFocus;
  const stackBefore = t.undoStack.length;
  doc.fire('keydown', keyZ);
  check('P0-2 正文内 Ctrl+Z 放行(未触发应用撤销)', keyZ._p === false && t.undoStack.length === stackBefore, 'preventDefault=' + keyZ._p + ' stack=' + t.undoStack.length);

  const inputFocus = makeEl('input');
  inputFocus.tagName = 'INPUT';
  t.activeEl = inputFocus;
  const keyZ2 = { ctrlKey: true, key: 'z', _p: false, preventDefault() { this._p = true; } };
  doc.fire('keydown', keyZ2);
  check('P0-2 输入框内 Ctrl+Z 保持原行为(放行)', keyZ2._p === false, 'preventDefault=' + keyZ2._p);

  // 非编辑区 Ctrl+Z 仍走应用级撤销（不应崩）
  t.activeEl = makeEl('body');
  const keyZ3 = { ctrlKey: true, key: 'z', _p: false, preventDefault() { this._p = true; } };
  let toastMsg = null;
  const origToast = ctx.toast;
  ctx.toast = m => { toastMsg = m; };
  doc.fire('keydown', keyZ3);
  ctx.toast = origToast;
  check('P0-2 非编辑区 Ctrl+Z 仍触发应用撤销提示', toastMsg === '没有可撤销的操作', 'toast=' + toastMsg);

  // ---------- P1-1 防抖落盘 ----------
  setTimeout(() => {
    const saved = storage._m['prdKanbanStateV3'] || '';
    const st = JSON.parse(saved);
    const p = st.projects.find(x => x.name === '回归测试');
    check('P1-1 防抖后已落盘(含正文与卡片)', p && p.data.purpose.html === '<p>新正文内容</p>' && p.data.purpose.cards[0].html === '<p>新卡片内容</p>', (p && p.data.purpose.html) || '未找到');
    const fails = results.filter(r => !r.pass).length;
    console.log('\n共 ' + results.length + ' 项，失败 ' + fails + ' 项');
    process.exit(fails ? 1 : 0);
  }, 900);
} catch (e) {
  console.error('HARNESS ERROR:', e && e.stack || e);
  process.exit(2);
}
