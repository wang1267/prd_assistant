// v16.6 回归自测：结构化表格显式拖拽手柄（列宽/行高）+ 旧边缘热区不再作用于结构化表格
// 运行：node tools/regress_v166.js
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const block1 = fs.readFileSync(path.join(__dirname, '..', 'tools', 'block1.js'), 'utf8');
const src = block1 + `
;globalThis.__test={
  get DATA(){return DATA;}, set DATA(v){DATA=v;},
  get STATE(){return STATE;}, set STATE(v){STATE=v;},
  get bodyCursor(){return document.body.style.cursor;},
  get imgHandle(){return imgResizeHandle;}
};
`;

function makeEl(id) {
  const el = {
    id, dataset: {}, style: {}, className: '', value: '', checked: false, disabled: false, files: null,
    isContentEditable: false, tagName: 'DIV', parentNode: null, _children: [],
    classList: { _s: new Set(), add(...c){c.forEach(x=>this._s.add(x));}, remove(...c){c.forEach(x=>this._s.delete(x));}, toggle(c,f){f===undefined?(this._s.has(c)?this._s.delete(c):this._s.add(c)):(f?this._s.add(c):this._s.delete(c));return this._s.has(c);}, contains(c){return this._s.has(c);} },
    _innerHTML:'', _text:'',
    get innerHTML(){return this._innerHTML;}, set innerHTML(v){this._innerHTML=v;},
    get textContent(){return this._text;}, set textContent(v){this._text=v;},
    _listeners:{}, addEventListener(t,fn){(this._listeners[t]=this._listeners[t]||[]).push(fn);}, removeEventListener(){},
    appendChild(c){this._children.push(c); if(c)c.parentNode=this; return c;},
    remove(){}, focus(){}, click(){}, scrollIntoView(){}, setAttribute(){}, removeAttribute(){},
    getBoundingClientRect(){return {left:0,top:0,right:0,bottom:0,width:0,height:0};},
    querySelector(){return makeEl(id+'-q');}, querySelectorAll(){return [];}, closest(){return null;},
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
  vm.runInContext(src, ctx, {filename:'v166.js'});
  const t=ctx.__test;
  ctx.createProject('v166 回归', null);
  t.DATA.meta={rows:[{cells:['版本','作者']},{cells:['v1','张三']}],cards:[],colWidths:[100,120]};

  // ---------- 1. 渲染含显式手柄 ----------
  const html=ctx.renderEditor({id:'meta',title:'文档变更历史',type:'table',required:true,weight:1,template:''});
  check('v16.6 结构化表格渲染含列宽手柄', html.indexOf('tbl-col-h')>=0, 'no col handle');
  check('v16.6 结构化表格渲染含行高手柄', html.indexOf('tbl-row-h')>=0, 'no row handle');
  check('v16.6 手柄数量=列数+行数(3x2)', (html.match(/tbl-col-h/g)||[]).length===2 && (html.match(/tbl-row-h/g)||[]).length===2, html);

  // ---------- 2. 旧边缘热区不再作用于结构化表格（悬停不出现 col-resize 光标） ----------
  const cellRect={left:0,top:0,right:120,bottom:40,width:120,height:40};
  const structCell={nodeType:1,closest:function(s){if(s==='.table-scroll')return {dataset:{sec:'meta'}};if(s==='table th,table td')return {getBoundingClientRect:()=>cellRect};return null;}};
  doc.fire('mousemove',{target:structCell,clientX:115,clientY:20});
  check('v16.6 结构化表格悬停边缘不再触发 col-resize', !/resize/.test(String(t.bodyCursor||'')), 'cursor='+t.bodyCursor);

  // ---------- 3. 列宽手柄拖拽 → 保存 ----------
  const colEl={style:{},offsetWidth:120};
  const rowElData={style:{},offsetHeight:30};
  const tableObj={tagName:'TABLE',
    closest:function(s){return s==='.table-scroll'?scObj:null;},
    querySelector:function(s){return s==='colgroup'?{children:[colEl,{style:{},offsetWidth:120}]}:null;},
    querySelectorAll:function(s){return s==='colgroup col'?[colEl,{style:{},offsetWidth:120}]:s==='tbody tr'?[rowElData]:[];}};
  const scObj={dataset:{sec:'meta'},querySelector:function(s){return s==='table'?tableObj:null;}};
  const colHandle={nodeType:1,dataset:{col:'0'},classList:{contains:c=>c==='tbl-col-h',add(){},remove(){}},closest:function(s){if(s==='.tbl-col-h,.tbl-row-h')return colHandle;if(s==='.table-scroll')return scObj;if(s==='tr')return rowElData;return null;}};
  doc.fire('mousedown',{target:colHandle,clientX:100,clientY:10,preventDefault(){},stopPropagation(){}});
  doc.fire('mousemove',{clientX:150,clientY:10});
  check('v16.6 拖列手柄→列宽更新', colEl.style.width==='170px', 'w='+colEl.style.width);
  doc.fire('mouseup',{});
  check('v16.6 松手后列宽落盘(colWidths[0]=170)', t.DATA.meta.colWidths&&t.DATA.meta.colWidths[0]===170, JSON.stringify(t.DATA.meta.colWidths));

  // ---------- 4. 行高手柄拖拽 → 保存 ----------
  const rowHandle={nodeType:1,dataset:{},classList:{contains:c=>c==='tbl-row-h',add(){},remove(){}},closest:function(s){if(s==='.tbl-col-h,.tbl-row-h')return rowHandle;if(s==='.table-scroll')return scObj;if(s==='tr')return rowElData;return null;}};
  doc.fire('mousedown',{target:rowHandle,clientX:10,clientY:30,preventDefault(){},stopPropagation(){}});
  doc.fire('mousemove',{clientX:10,clientY:60});
  check('v16.6 拖行手柄→行高更新', rowElData.style.height==='60px', 'h='+rowElData.style.height);
  doc.fire('mouseup',{});
  check('v16.6 松手后行高落盘(rowHeights[0]=60)', t.DATA.meta.rowHeights&&t.DATA.meta.rowHeights[0]===60, JSON.stringify(t.DATA.meta.rowHeights));

  // ---------- 5. 结构化表格不再弹浮动条/右下角角标 ----------
  const structNode={tagName:'TABLE',isConnected:true,classList:{add(){},remove(){}},closest:function(s){return s==='.table-scroll'?{dataset:{sec:'meta'}}:null;},getBoundingClientRect:()=>({left:0,top:0,right:200,bottom:60,width:200,height:60})};
  ctx.selectMedia(structNode,{});
  check('v16.7 结构化表格点击不弹浮动条', doc.getElementById('mediaBar').style.display==='none', 'display='+doc.getElementById('mediaBar').style.display);
  const richNode={tagName:'TABLE',isConnected:true,classList:{add(){},remove(){}},closest:function(s){return null;},getBoundingClientRect:()=>({left:0,top:0,right:200,bottom:60,width:200,height:60})};
  ctx.selectMedia(richNode,{});
  check('v16.7 富文本表格仍弹浮动条', doc.getElementById('mediaBar').style.display==='flex', 'display='+doc.getElementById('mediaBar').style.display);
  check('v16.9 富文本表格无右下角整体缩放角标', t.imgHandle&&t.imgHandle.style.display==='none', 'handle='+(t.imgHandle&&t.imgHandle.style.display));
  const sizesHtml=doc.getElementById('mediaBar').querySelector('.sizes')._innerHTML;
  check('v16.9 富文本表格浮动条无「拖拽缩放」按钮', sizesHtml.indexOf('拖拽缩放')<0&&sizesHtml.indexOf('data-resize')<0, sizesHtml);

  const fails=results.filter(r=>!r.pass).length;
  console.log('\n共 '+results.length+' 项，失败 '+fails+' 项');
  process.exit(fails?1:0);
}catch(e){
  console.error('HARNESS ERROR:', e&&e.stack||e);
  process.exit(2);
}
