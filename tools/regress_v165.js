// v16.5 回归自测：结构化表格与富文本表格统一（无操作列/行内按钮）+ 评论气泡始终可见（视口外贴边+方向提示）
// 运行：node tools/regress_v165.js
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const block1 = fs.readFileSync(path.join(root, 'tools', 'block1.js'), 'utf8');
// v16.6：注释控制器是独立 script（block 编号含 vendor 脚本，按 id 精确抽取）
const htmlFile = fs.readFileSync(path.join(root, 'PRD智能看板.html'), 'utf8');
const cmtMatch = htmlFile.match(/<script id="comment-controller">([\s\S]*?)<\/script>/);
const block3 = cmtMatch ? cmtMatch[1] : '';
const src = block1 + `
;globalThis.__test={
  get DATA(){return DATA;}, set DATA(v){DATA=v;},
  get STATE(){return STATE;}, set STATE(v){STATE=v;},
};
` + block3;

function matches(el, sel) {
  if (!el) return false;
  if (sel.startsWith('.')) {
    const cls = sel.slice(1);
    return (el.classList && el.classList.contains(cls)) || String(el.className || '').split(/\s+/).indexOf(cls) >= 0;
  }
  if (sel.startsWith('#')) return el.id === sel.slice(1);
  return (el.tagName || '').toLowerCase() === sel.toLowerCase();
}
function queryIn(root, sel) {
  if (!root || !root._children) return null;
  for (const c of root._children) {
    if (matches(c, sel)) return c;
    const r = queryIn(c, sel); if (r) return r;
  }
  return null;
}
function queryAllIn(root, sel, out) {
  out = out || [];
  if (!root || !root._children) return out;
  for (const c of root._children) {
    if (matches(c, sel)) out.push(c);
    queryAllIn(c, sel, out);
  }
  return out;
}
function makeEl(id) {
  const el = {
    id, dataset: {}, style: {}, className: '', value: '', checked: false, disabled: false, files: null,
    isContentEditable: false, tagName: 'DIV', parentNode: null, _children: [],
    classList: { _s: new Set(), add(...c){c.forEach(x=>this._s.add(x));}, remove(...c){c.forEach(x=>this._s.delete(x));}, toggle(c,f){f===undefined?(this._s.has(c)?this._s.delete(c):this._s.add(c)):(f?this._s.add(c):this._s.delete(c));return this._s.has(c);}, contains(c){return this._s.has(c);} },
    _innerHTML:'', _text:'',
    get innerHTML(){return this._innerHTML;}, set innerHTML(v){this._innerHTML=v;},
    get textContent(){return this._text;}, set textContent(v){this._text=v;},
    _listeners:{}, addEventListener(t,fn){(this._listeners[t]=this._listeners[t]||[]).push(fn);}, removeEventListener(t,fn){if(this._listeners[t])this._listeners[t]=this._listeners[t].filter(f=>f!==fn);},
    appendChild(c){this._children.push(c); if(c)c.parentNode=this; return c;},
    insertBefore(c,ref){this._children.push(c); if(c)c.parentNode=this; return c;},
    remove(){if(this.parentNode&&this.parentNode._children){const i=this.parentNode._children.indexOf(this);if(i>=0)this.parentNode._children.splice(i,1);}this.parentNode=null;},
    contains(c){return this===c||queryIn(this,'#__never__')!==null||(this._children||[]).some(ch=>ch===c||(ch.contains&&ch.contains(c)));},
    focus(){}, click(){}, scrollIntoView(){}, setAttribute(){}, removeAttribute(){},
    getBoundingClientRect(){return {left:0,top:0,right:0,bottom:0,width:0,height:0};},
    querySelector(sel){const c=queryIn(this,sel);if(c)return c;if(!this._qcache)this._qcache={};if(!this._qcache[sel]){this._qcache[sel]=makeEl(sel);}return this._qcache[sel];},
    querySelectorAll(sel){return queryAllIn(this,sel);},
    closest(){return null;},
  };
  return el;
}

const doc = {
  _els:{}, _listeners:{}, documentElement:makeEl('html'), body:makeEl('body'), activeElement:makeEl('body'),
  getElementById(id){return (this._els[id]=this._els[id]||makeEl(id));},
  createElement(){return makeEl('created');},
  querySelector(sel){return queryIn(this.body,sel)||null;},
  querySelectorAll(sel){return queryAllIn(this.body,sel);},
  addEventListener(t,fn){(this._listeners[t]=this._listeners[t]||[]).push(fn);},
  removeEventListener(){},
  fire(t,ev){(this._listeners[t]||[]).forEach(fn=>fn(ev));},
  execCommand(){return true;},
  createRange(){return {cloneRange(){return {collapse(){}};},setStartAfter(){},collapse(){}};},
};

const storage = { _m:{}, getItem(k){return this._m[k]||null;}, setItem(k,v){this._m[k]=String(v);}, removeItem(k){delete this._m[k];} };
const ctx = {
  document:doc, localStorage:storage, console, setTimeout, clearTimeout,
  confirm:()=>true, prompt:()=>'', alert:()=>{}, TextDecoder, URL,
  fetch:()=>Promise.reject(new Error('no network')), FileReader:function(){}, Blob:function(){},
  DOMParser:function(){return {parseFromString:()=>({body:{innerHTML:'',querySelectorAll:()=>[]}})};},
  MutationObserver:function(){this.observe=function(){};this.disconnect=function(){};},
  addEventListener(t,fn){doc.addEventListener(t,fn);},
  removeEventListener(t,fn){doc.removeEventListener(t,fn);},
  innerWidth:1280, innerHeight:800, scrollX:0, scrollY:0,
  getSelection(){return {isCollapsed:true,rangeCount:0,removeAllRanges(){},getRangeAt(){return {cloneRange(){}};}};},
  matchMedia:()=>({matches:false,addEventListener(){}}),
};
ctx.window=ctx;
vm.createContext(ctx);

let results=[];
function check(name,cond,detail){results.push({name,pass:!!cond});console.log((cond?'PASS':'FAIL')+'  '+name+(cond?'':'  >>> '+detail));}

try{
  vm.runInContext(src, ctx, {filename:'v165.js'});
  const t=ctx.__test;
  ctx.createProject('v165 回归', null);
  t.DATA.meta={rows:[{cells:['版本','作者']},{cells:['v1','张三']}],cards:[],colWidths:[100,120]};

  // v16.6：Floating UI 桩——验证评论气泡集成逻辑（应用 pos、按 referenceHidden 显隐）
  ctx._hideRef=false;
  ctx.FloatingUIDOM={
    offset:()=>({}), flip:()=>({}), shift:()=>({}), hide:()=>({}),
    computePosition:(ref,el,opt)=>{ctx._lastOpts=opt;return Promise.resolve({x:ref.getBoundingClientRect().left,y:ref.getBoundingClientRect().bottom+10,middlewareData:{hide:{referenceHidden:ctx._hideRef}}});},
    autoUpdate:(ref,el,fn)=>{ctx._autoUpd=fn;fn();return ()=>{};}
  };

  // ---------- 1. 结构化表格渲染与富文本统一：无操作列/行内按钮 ----------
  const html=ctx.renderEditor({id:'meta',title:'文档变更历史',type:'table',required:true,weight:1,template:''});
  check('v16.5 结构化表格无操作列', html.indexOf('tbl-actcol')<0, 'actcol found');
  check('v16.5 结构化表格无行内删除/追加按钮', html.indexOf('data-act="addrow"')<0&&html.indexOf('data-act="addcol"')<0&&html.indexOf('data-act="delrow"')<0&&html.indexOf('data-act="delcol"')<0&&html.indexOf('col-del')<0, html);
  check('v16.5 结构化表格保留可编辑单元格', html.indexOf('data-act="tcell"')>=0, 'no tcell');

  // ---------- 2. 右键菜单内容（结构化 vs 富文本） ----------
  const secCell={closest:function(s){if(s==='table')return fakeTableObj;if(s==='.table-scroll')return {dataset:{sec:'meta'}};if(s==='.editable,.sub-card-body')return null;return null;},parentElement:{rowIndex:1},cellIndex:1};
  const fakeTableObj={rows:[{cells:[{},{}]}],tagName:'TABLE',closest(){return null;},querySelector(){return null;}};
  ctx.openTblMenu(100,100,secCell);
  let menu=doc.querySelector('#tblMenu');
  check('v16.5 结构化数据行右键=6项(3行+3列)', menu&&menu._children.length===6, 'items='+(menu?menu._children.length:-1));
  const labels=menu?menu._children.map(b=>b.textContent):[];
  check('v16.5 菜单含 在上方插入行/在左侧插入列/删除本行/删除本列', ['在上方插入行','在下方插入行','在左侧插入列','在右侧插入列','删除本行','删除本列'].every(x=>labels.includes(x)), JSON.stringify(labels));
  // 点击菜单按钮 → 执行结构化插入
  const before=t.DATA.meta.rows.length;
  const btn=menu._children.find(b=>b.textContent==='在上方插入行');
  btn._listeners.click[0]({preventDefault(){},stopPropagation(){}});
  check('v16.5 菜单点击执行 上方插入行', t.DATA.meta.rows.length===before+1, 'rows='+t.DATA.meta.rows.length);

  const hdrCell={closest:function(s){if(s==='table')return fakeTableObj;if(s==='.table-scroll')return {dataset:{sec:'meta'}};if(s==='.editable,.sub-card-body')return null;return null;},parentElement:{rowIndex:0},cellIndex:0};
  ctx.openTblMenu(100,100,hdrCell);
  menu=doc.querySelector('#tblMenu');
  check('v16.5 结构化表头右键=3列操作', menu&&menu._children.length===3&&menu._children.every(b=>b.textContent.indexOf('行')<0), 'items='+(menu?menu._children.map(b=>b.textContent).join(','):-1));

  const richCell={closest:function(s){if(s==='table')return fakeTableObj;if(s==='.table-scroll')return null;if(s==='.editable,.sub-card-body')return {dataset:{act:'editable',id:'purpose'}};return null;},parentElement:{rowIndex:1},cellIndex:0};
  ctx.openTblMenu(100,100,richCell);
  menu=doc.querySelector('#tblMenu');
  check('v16.5 富文本右键=7项(含删表)', menu&&menu._children.length===7&&menu._children.some(b=>b.textContent==='删除整个表格'), 'items='+(menu?menu._children.length:-1));

  // ---------- 3. 评论气泡：Floating UI 锚定 + 划线划出视口隐藏/恢复 ----------
  t.DATA.purpose={html:'<p>正文内容</p>',cards:[],comments:{}};
  t.DATA.purpose.comments['c1']={text:'这条评论',by:'评审',at:Date.now()};
  let mkRect={left:100,top:100,right:180,bottom:130,width:80,height:30};
  const mark={dataset:{cid:'c1'},getBoundingClientRect:()=>mkRect,closest:function(s){if(s==='.editable,.sub-card-body')return {dataset:{id:'purpose'},classList:{contains:()=>false},closest:()=>null};return null;},scrollIntoView(){}};
  (async ()=>{
    ctx.__commentCtrl.reveal(mark);
    await new Promise(r=>setTimeout(r,5));
    let tip=doc.querySelector('.cmt-tip');
    check('v16.7 Floating UI 使用 fixed 策略(与 CSS position:fixed 匹配)', ctx._lastOpts&&ctx._lastOpts.strategy==='fixed', 'strategy='+(ctx._lastOpts&&ctx._lastOpts.strategy));
    check('v16.6 划线在视口内→气泡按锚定位置显示', tip&&tip.style.display!=='none'&&tip.style.left==='100px'&&tip.style.top==='140px', 'left='+(tip?tip.style.left:-1)+' top='+(tip?tip.style.top:-1));
    check('v16.6 气泡内容正常', tip&&tip.innerHTML.indexOf('这条评论')>=0, 'no txt');

    ctx._hideRef=true; // 模拟划线滚出视口（referenceHidden）
    ctx._autoUpd();
    await new Promise(r=>setTimeout(r,5));
    tip=doc.querySelector('.cmt-tip');
    check('v16.6 划线划出视口→气泡自动隐藏', tip&&tip.style.display==='none', 'display='+(tip?tip.style.display:-1));

    ctx._hideRef=false; // 滚回视口
    ctx._autoUpd();
    await new Promise(r=>setTimeout(r,5));
    tip=doc.querySelector('.cmt-tip');
    check('v16.6 滚回视口→气泡恢复显示', tip&&tip.style.display!=='none'&&tip.style.top==='140px', 'top='+(tip?tip.style.top:-1));

    const fails=results.filter(r=>!r.pass).length;
    console.log('\n共 '+results.length+' 项，失败 '+fails+' 项');
    process.exit(fails?1:0);
  })();
}catch(e){
  console.error('HARNESS ERROR:', e&&e.stack||e);
  process.exit(2);
}
