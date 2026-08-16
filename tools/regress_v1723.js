// v17.23 回归自测：移除「带小卡片结构（8 节）」默认框架 + 老数据迁移过滤
// 运行：node tools/regress_v1723.js
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const block1 = fs.readFileSync(path.join(__dirname, '..', 'tools', 'block1.js'), 'utf8');

function makeEl(id) {
  const el = {
    id, dataset: {}, style: {}, className: '', value: '', checked: false, disabled: false, files: null,
    isContentEditable: false, tagName: 'DIV', parentNode: null, _children: [],
    classList: { _s: new Set(), add(...c){c.forEach(x=>this._s.add(x));}, remove(...c){c.forEach(x=>this._s.delete(x));}, toggle(c,f){f===undefined?(this._s.has(c)?this._s.delete(c):this._s.add(c)):(f?this._s.add(c):this._s.delete(c));return this._s.has(c);}, contains(c){return this._s.has(c);} },
    _innerHTML:'', _text:'',
    get innerHTML(){return this._innerHTML;}, set innerHTML(v){this._innerHTML=v;},
    get textContent(){return this._text!==''?this._text:this._innerHTML.replace(/<[^>]+>/g,'');}, set textContent(v){this._text=v;},
    _listeners:{}, addEventListener(t,fn){(this._listeners[t]=this._listeners[t]||[]).push(fn);}, removeEventListener(){},
    appendChild(c){this._children.push(c); if(c)c.parentNode=this; return c;},
    insertBefore(c,ref){this._children.push(c); if(c)c.parentNode=this; return c;},
    remove(){}, focus(){}, click(){}, scrollIntoView(){}, setAttribute(){}, removeAttribute(){},
    getBoundingClientRect(){return {left:0,top:0,right:0,bottom:0,width:0,height:0};},
    querySelector(){const e=makeEl(id+'-q'); e.parentNode=this; return e;}, querySelectorAll(){return [];}, closest(){return null;},
    contains(){return false;},
  };
  return el;
}

const doc = {
  _els:{}, _listeners:{}, documentElement:makeEl('html'), body:makeEl('body'), head:makeEl('head'),
  activeElement:makeEl('body'), readyState:'complete',
  getElementById(id){const el=this._els[id]=this._els[id]||makeEl(id); el.parentNode=el.parentNode||this.body; return el;},
  createElement(t){const el=makeEl('created:'+t); el.tagName=(t||'DIV').toUpperCase(); return el;},
  querySelector(){const el=makeEl('qs'); el.parentNode=this.body; return el;},
  querySelectorAll(){return [];},
  addEventListener(t,fn){(this._listeners[t]=this._listeners[t]||[]).push(fn);}, removeEventListener(){},
  fire(t,ev){(this._listeners[t]||[]).forEach(fn=>fn(ev));},
  execCommand(){return true;}, createRange(){return {cloneRange(){return {collapse(){}};},setStartAfter(){},collapse(){}};},
};

const storage = { _m:{}, getItem(k){return this._m[k]||null;}, setItem(k,v){this._m[k]=String(v);}, removeItem(k){delete this._m[k];} };
const ctx = {
  document:doc, localStorage:storage, console, setTimeout, clearTimeout, setInterval, clearInterval,
  confirm:()=>true, prompt:()=>'', alert:()=>{}, TextDecoder, TextEncoder, URL, AbortController,
  fetch:()=>Promise.reject(new Error('no network')), FileReader:function(){}, Blob:function(){}, FormData:function(){},
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
  const src = block1 + '\n;globalThis.__test={get DEFAULT_PRESETS(){return DEFAULT_PRESETS;},get STATE(){return STATE;},set STATE(v){STATE=v;}};\n';
  vm.runInContext(src, ctx, {filename:'v1723.js'});
  const t=ctx.__test;

  const ids=t.DEFAULT_PRESETS.map(p=>p.id);
  check('v17.23 默认框架不再含「带小卡片结构(cards)」', ids.indexOf('cards')<0 && ids.indexOf('default')>=0 && ids.indexOf('minimal')>=0, JSON.stringify(ids));

  // 老数据迁移：存储里残留 cards 预设 → load() 后清除
  const legacy={version:6,density:'standard',seenWizard:true,projects:[],groups:[],groupOpen:{},ruleSet:[],framework:[],frameworkPresets:[
    {id:'cards',name:'带小卡片结构',framework:[{id:'purpose',title:'目的',type:'text',required:true,weight:1}]},
    {id:'custom',name:'我的框架',framework:[{id:'x',title:'X',type:'text',required:false,weight:1}]}
  ]};
  ctx.localStorage.setItem('prdKanbanStateV3', JSON.stringify(legacy));
  ctx.load();
  const after=(t.STATE.frameworkPresets||[]).map(p=>p.id);
  check('v17.23 load 迁移：老存储中 cards 预设被清除、自定义保留', after.indexOf('cards')<0 && after.indexOf('custom')>=0, JSON.stringify(after));

  // 新安装默认即无 cards（空存储 → load 用 DEFAULT_PRESETS）
  ctx.localStorage.removeItem('prdKanbanStateV3');
  t.STATE=null; // 模拟全新安装（首次 load 时 STATE 为空）
  ctx.load();
  const fresh=(t.STATE.frameworkPresets||[]).map(p=>p.id);
  check('v17.23 全新安装默认框架列表无 cards', fresh.indexOf('cards')<0 && fresh.length===2, JSON.stringify(fresh));
}catch(e){
  results.push({name:'脚本异常',pass:false});
  console.log('FAIL  脚本异常  >>> '+(e&&e.stack||e));
}
const failed=results.filter(r=>!r.pass).length;
console.log('\n共 '+results.length+' 项断言，失败 '+failed+' 项');
process.exit(failed?1:0);
