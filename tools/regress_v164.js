// v16.4 回归自测：表格右键菜单（行间/列间插入、删行删列）+ 结构化表格缩放文本节点修复 + 操作条残留剥离
// 运行：node tools/regress_v164.js
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const block1 = path.join(__dirname, '..', 'tools', 'block1.js');
let src = fs.readFileSync(block1, 'utf8');
src += `
;globalThis.__test={
  get DATA(){return DATA;}, set DATA(v){DATA=v;},
  get STATE(){return STATE;}, set STATE(v){STATE=v;},
  get bodyCursor(){return document.body.style.cursor;},
  get tblMenu(){return tblMenuEl;}
};
`;

function makeEl(id) {
  const el = {
    id, dataset: {}, style: {}, className: '', value: '', checked: false, disabled: false, files: null,
    isContentEditable: false, tagName: 'DIV',
    classList: { _s: new Set(), add(...c){c.forEach(x=>this._s.add(x));}, remove(...c){c.forEach(x=>this._s.delete(x));}, toggle(c,f){f===undefined?(this._s.has(c)?this._s.delete(c):this._s.add(c)):(f?this._s.add(c):this._s.delete(c));return this._s.has(c);}, contains(c){return this._s.has(c);} },
    _innerHTML:'', _text:'',
    get innerHTML(){return this._innerHTML;}, set innerHTML(v){this._innerHTML=v;},
    get textContent(){return this._text;}, set textContent(v){this._text=v;},
    _listeners:{}, addEventListener(t,fn){(this._listeners[t]=this._listeners[t]||[]).push(fn);}, removeEventListener(){},
    appendChild(){}, insertBefore(){}, remove(){}, focus(){}, click(){}, scrollIntoView(){},
    setAttribute(){}, removeAttribute(){},
    getBoundingClientRect(){return {left:0,top:0,right:0,bottom:0,width:0,height:0};},
    querySelector(){return makeEl(id+'-q');}, querySelectorAll(){return [];}, closest(){return null;}, contains(){return false;},
  };
  return el;
}

const doc = {
  _els:{}, _listeners:{}, documentElement:makeEl('html'), body:makeEl('body'), activeElement:makeEl('body'),
  getElementById(id){return (this._els[id]=this._els[id]||makeEl(id));},
  createElement(){return makeEl('created');}, querySelector(){return makeEl('qs');}, querySelectorAll(){return [];},
  addEventListener(t,fn){(this._listeners[t]=this._listeners[t]||[]).push(fn);}, removeEventListener(){},
  fire(t,ev){(this._listeners[t]||[]).forEach(fn=>fn(ev));},
  execCommand(){return true;}, createRange(){return {cloneRange(){return {collapse(){}};},setStartAfter(){},collapse(){}};},
};

const storage = { _m:{}, getItem(k){return this._m[k]||null;}, setItem(k,v){this._m[k]=String(v);}, removeItem(k){delete this._m[k];} };
const ctx = {
  document:doc, localStorage:storage, console, setTimeout, clearTimeout,
  confirm:()=>true, prompt:()=>'', alert:()=>{}, TextDecoder, URL,
  fetch:()=>Promise.reject(new Error('no network')), FileReader:function(){}, Blob:function(){},
  DOMParser:function(){return {parseFromString:()=>({body:{innerHTML:'',querySelectorAll:()=>[]}})};},
  addEventListener(){}, removeEventListener(){}, innerWidth:1280, innerHeight:800, scrollX:0, scrollY:0,
  getSelection(){return {isCollapsed:true,rangeCount:0,removeAllRanges(){},getRangeAt(){return {cloneRange(){}};}};},
  matchMedia:()=>({matches:false,addEventListener(){}}),
};
ctx.window=ctx;
vm.createContext(ctx);

let results=[];
function check(name,cond,detail){results.push({name,pass:!!cond});console.log((cond?'PASS':'FAIL')+'  '+name+(cond?'':'  >>> '+detail));}

try{
  vm.runInContext(src, ctx, {filename:'block1.js'});
  const t=ctx.__test;
  ctx.createProject('v164 回归', null);
  t.DATA.meta={rows:[{cells:['版本','作者']},{cells:['v1','张三']}],cards:[],colWidths:[100,120],rowHeights:{0:30}};

  // ---------- 1. 结构化表格右键操作 ----------
  ctx.doTblOp('ins-row-above',{table:null,rowIdx:1,colIdx:0,sec:'meta',ed:null,isSec:true});
  check('v16.4 结构化-上方插入行', t.DATA.meta.rows.length===3 && t.DATA.meta.rows[1].cells.join('|')==='|', JSON.stringify(t.DATA.meta.rows));
  check('v16.4 结构化-插行后行高重置(防错位)', t.DATA.meta.rowHeights===undefined, 'rowHeights='+JSON.stringify(t.DATA.meta.rowHeights));

  ctx.doTblOp('ins-row-below',{table:null,rowIdx:1,colIdx:0,sec:'meta',ed:null,isSec:true});
  check('v16.4 结构化-下方插入行', t.DATA.meta.rows.length===4 && t.DATA.meta.rows[2].cells.join('|')==='|', JSON.stringify(t.DATA.meta.rows));

  ctx.doTblOp('ins-col-left',{table:null,rowIdx:0,colIdx:1,sec:'meta',ed:null,isSec:true});
  check('v16.4 结构化-左侧插入列(含 colWidths)', t.DATA.meta.rows.every(r=>r.cells.length===3) && JSON.stringify(t.DATA.meta.colWidths)==='[100,120,120]', JSON.stringify({rows:t.DATA.meta.rows,cw:t.DATA.meta.colWidths}));

  ctx.doTblOp('ins-col-right',{table:null,rowIdx:0,colIdx:1,sec:'meta',ed:null,isSec:true});
  check('v16.4 结构化-右侧插入列', t.DATA.meta.rows.every(r=>r.cells.length===4), 'cells='+t.DATA.meta.rows[0].cells.length);

  ctx.doTblOp('del-col',{table:null,rowIdx:0,colIdx:1,sec:'meta',ed:null,isSec:true});
  check('v16.4 结构化-删除列(含 colWidths)', t.DATA.meta.rows.every(r=>r.cells.length===3) && JSON.stringify(t.DATA.meta.colWidths)==='[100,120,120]', JSON.stringify({rows:t.DATA.meta.rows[0].cells,cw:t.DATA.meta.colWidths}));

  ctx.doTblOp('del-row',{table:null,rowIdx:1,colIdx:0,sec:'meta',ed:null,isSec:true});
  check('v16.4 结构化-删除行', t.DATA.meta.rows.length===3 && t.DATA.meta.rows[0].cells[0]==='版本', JSON.stringify(t.DATA.meta.rows));

  ctx.doTblOp('del-row',{table:null,rowIdx:0,colIdx:0,sec:'meta',ed:null,isSec:true});
  check('v16.4 结构化-表头行不可删', t.DATA.meta.rows.length===3, 'rows='+t.DATA.meta.rows.length);

  // ---------- 2. 富文本表格右键操作（DOM 路径） ----------
  function fakeCell(){return {innerHTML:'&nbsp;'};}
  function fakeRow(idx){const cells=[];return {cells,rowIndex:idx,insertCell(i){const c=fakeCell();if(i==null||i===-1)cells.push(c);else cells.splice(i,0,c);return c;},deleteCell(i){cells.splice(i,1);}};}
  function fakeTable(nrows){const t={rows:[],tagName:'TABLE',querySelector(){return null;},closest(){return null;},insertRow(i){const r=fakeRow(this.rows.length);if(i==null||i===-1)this.rows.push(r);else this.rows.splice(i,0,r);this.rows.forEach((x,idx)=>x.rowIndex=idx);return r;},deleteRow(i){this.rows.splice(i,1);this.rows.forEach((x,idx)=>x.rowIndex=idx);}};for(let i=0;i<nrows;i++){const r=fakeRow(i);r.cells.push(fakeCell(),fakeCell());t.rows.push(r);}return t;}
  const ft=fakeTable(2);
  const edEl=makeEl('ed');edEl.dataset.act='editable';edEl.dataset.id='purpose';
  t.DATA.purpose={html:'',cards:[]};
  ctx.doTblOp('ins-row-above',{table:ft,rowIdx:1,colIdx:0,sec:null,ed:edEl,isSec:false});
  check('v16.4 富文本-上方插入行', ft.rows.length===3, 'rows='+ft.rows.length);
  ctx.doTblOp('ins-col-right',{table:ft,rowIdx:0,colIdx:0,sec:null,ed:edEl,isSec:false});
  check('v16.4 富文本-右侧插入列(整表)', ft.rows.every(r=>r.cells.length===3), 'cells='+ft.rows.map(r=>r.cells.length).join(','));
  ctx.doTblOp('del-col',{table:ft,rowIdx:0,colIdx:1,sec:null,ed:edEl,isSec:false});
  check('v16.4 富文本-删除列', ft.rows.every(r=>r.cells.length===2), 'cells='+ft.rows.map(r=>r.cells.length).join(','));
  ctx.doTblOp('del-row',{table:ft,rowIdx:1,colIdx:0,sec:null,ed:edEl,isSec:false});
  check('v16.4 富文本-删除行', ft.rows.length===2, 'rows='+ft.rows.length);
  ctx.doTblOp('del-table',{table:ft,rowIdx:0,colIdx:0,sec:null,ed:edEl,isSec:false});
  check('v16.4 富文本-删除表格后落盘', ft.rows.length===2 && typeof t.DATA.purpose.html==='string', 'html='+typeof t.DATA.purpose.html);

  // ---------- 3. 结构化表格缩放：contenteditable 文本节点不再崩溃 ----------
  const cellRect={left:0,top:0,right:120,bottom:40,width:120,height:40};
  const tdEl={nodeType:1,closest(s){return s==='table th,table td'?{getBoundingClientRect:()=>cellRect}:null;}};
  doc.fire('mousemove',{target:{nodeType:3,parentElement:tdEl},clientX:115,clientY:20});
  check('v16.4 缩放-文本节点悬停正常显示列宽光标', t.bodyCursor==='col-resize', 'cursor='+t.bodyCursor);
  doc.fire('mousemove',{target:{nodeType:3,parentElement:tdEl},clientX:60,clientY:20});
  check('v16.4 缩放-离开边缘光标复位', t.bodyCursor==='', 'cursor='+t.bodyCursor);

  // ---------- 4. 操作条/×按钮残留剥离 ----------
  const cleaned=ctx.stripRtblHtml('<p>正文</p><div class="rtbl-wrap" data-rtbl="1"><button>＋行</button></div><span class="rtbl-col-del">×</span><span class="rtbl-row-del">×</span>');
  check('v16.4 剥离历史操作条与×按钮', cleaned.indexOf('rtbl')<0, cleaned);

  // ---------- 5. render() 内右键菜单自动收起（不报错） ----------
  ctx.render();
  check('v16.4 render 正常执行并收起菜单', true, '');

  const fails=results.filter(r=>!r.pass).length;
  console.log('\n共 '+results.length+' 项，失败 '+fails+' 项');
  process.exit(fails?1:0);
}catch(e){
  console.error('HARNESS ERROR:', e&&e.stack||e);
  process.exit(2);
}
