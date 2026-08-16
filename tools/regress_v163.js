// v16.3 回归自测：内置 12 条规则基线 + 类型/标题定位 + 表格节 rows 判定 + 人工审核通道保留
// 运行：node tools/regress_v163.js
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const block1 = path.join(__dirname, '..', 'tools', 'block1.js');
let src = fs.readFileSync(block1, 'utf8');

src += `
;globalThis.__test={
  get DATA(){return DATA;}, set DATA(v){DATA=v;},
  get STATE(){return STATE;}, set STATE(v){STATE=v;},
  get warnEl(){return document.getElementById('storageWarn');},
  get tabRules(){return document.getElementById('tabRules');}
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
const hitSecs=(h,rid)=>h.rawHits.filter(x=>x.ruleId===rid).map(x=>x.sectionId);
const hitLevels=(h,rid)=>h.rawHits.filter(x=>x.ruleId===rid).map(x=>x.level);

try{
  vm.runInContext(src, ctx, {filename:'block1.js'});
  const t=ctx.__test;
  ctx.createProject('v163 回归', null);

  // ---------- 1. 内置 12 条基线 ----------
  const ids=t.STATE.ruleSet.map(r=>r.id);
  check('v16.3 内置规则共 12 条', ids.length===12, JSON.stringify(ids));
  const removed=['R-SPEC-04','R-CONS-05','R-CONS-06','R-TEST-03','R-TEST-04','R-SAFE-01'];
  check('v16.3 已删除的 6 条不在基线内', !removed.some(x=>ids.includes(x)), JSON.stringify(ids));
  check('v16.3 旧自定义规则数据被迁移重置', !ids.includes('CUSTOM-ALL'), JSON.stringify(ids));

  // ---------- 2. 表格节 isEmpty/rows 判定（R-SPEC-01） ----------
  t.DATA.meta={rows:[{cells:['版本','更改内容','作者','日期']},{cells:['','','','']}],cards:[]};
  let h=ctx.runHealth();
  check('v16.3 空表格节仍判必填缺失', hitSecs(h,'R-SPEC-01').includes('meta'), JSON.stringify(hitSecs(h,'R-SPEC-01')));
  t.DATA.meta.rows[1].cells=['v1.0','新增功能','张三','2026-08-14'];
  h=ctx.runHealth();
  check('v16.3 填了表格内容后不再误报必填缺失', !hitSecs(h,'R-SPEC-01').includes('meta'), JSON.stringify(hitSecs(h,'R-SPEC-01')));

  // ---------- 3. R-SPEC-03 缺优先级/非法 ----------
  t.DATA.feat={items:[{name:'A',desc:'x',priority:'',status:'草稿'}],cards:[]};
  t.DATA.accept={items:[{text:'通过标准',status:'pass',id:ctx.uid()}],cards:[]};
  h=ctx.runHealth();
  check('v16.3 缺优先级命中', hitSecs(h,'R-SPEC-03').length>0, JSON.stringify(hitSecs(h,'R-SPEC-03')));
  t.DATA.feat.items[0].priority='P9';
  h=ctx.runHealth();
  check('v16.3 非法优先级命中', hitSecs(h,'R-SPEC-03').length>0, JSON.stringify(hitSecs(h,'R-SPEC-03')));
  t.DATA.feat.items[0].priority='P1';
  h=ctx.runHealth();
  check('v16.3 合法优先级不命中', hitSecs(h,'R-SPEC-03').length===0, JSON.stringify(hitSecs(h,'R-SPEC-03')));

  // ---------- 4. R-CONS-01 双向失衡 ----------
  t.DATA.accept={items:[],cards:[]};
  h=ctx.runHealth();
  check('v16.3 有功能无验收→命中验收节', hitSecs(h,'R-CONS-01').includes('accept'), JSON.stringify(hitSecs(h,'R-CONS-01')));
  t.DATA.feat={items:[],cards:[]};
  t.DATA.accept={items:[{text:'T',status:'pass',id:ctx.uid()}],cards:[]};
  h=ctx.runHealth();
  check('v16.3 有验收无功能→命中功能节', hitSecs(h,'R-CONS-01').includes('feat'), JSON.stringify(hitSecs(h,'R-CONS-01')));
  t.DATA.feat={items:[{name:'A',desc:'x',priority:'P1',status:'草稿'}],cards:[]};
  h=ctx.runHealth();
  check('v16.3 功能验收都有→不命中', hitSecs(h,'R-CONS-01').length===0, JSON.stringify(hitSecs(h,'R-CONS-01')));

  // ---------- 5. R-TEST-05 只红不黄 ----------
  t.DATA.accept={items:[{text:'T1',status:'na',id:ctx.uid()},{text:'T2',status:'fail',id:ctx.uid()}],cards:[]};
  h=ctx.runHealth();
  check('v16.3 不通过→红', hitLevels(h,'R-TEST-05').includes('red'), JSON.stringify(hitLevels(h,'R-TEST-05')));
  check('v16.3 待定(na)不再标黄', hitLevels(h,'R-TEST-05').filter(l=>l==='yellow').length===0, JSON.stringify(hitLevels(h,'R-TEST-05')));

  // ---------- 6. R-RISK-02 阈值 40 ----------
  const many=Array.from({length:41},(_,i)=>({name:'F'+i,desc:'',priority:'P2',status:'草稿'}));
  t.DATA.feat={items:many,cards:[]};
  h=ctx.runHealth();
  check('v16.3 41 条功能→命中范围蔓延', hitSecs(h,'R-RISK-02').length>0, JSON.stringify(hitSecs(h,'R-RISK-02')));
  t.DATA.feat={items:many.slice(0,40),cards:[]};
  h=ctx.runHealth();
  check('v16.3 40 条功能→不命中', hitSecs(h,'R-RISK-02').length===0, JSON.stringify(hitSecs(h,'R-RISK-02')));

  // ---------- 7. R-CONS-04 表格埋点节可见 ----------
  t.DATA.feat={items:[{name:'A',desc:'普通功能',priority:'P1',status:'草稿'}],cards:[]};
  t.DATA.track={rows:[{cells:['事件','触发条件']},{cells:['voice_wake','唤醒']}],cards:[]};
  h=ctx.runHealth();
  check('v16.3 埋点表格可见且功能未提及→命中', hitSecs(h,'R-CONS-04').includes('track'), JSON.stringify(hitSecs(h,'R-CONS-04')));
  t.DATA.feat.items[0].desc='含埋点 voice_wake';
  h=ctx.runHealth();
  check('v16.3 功能已提及埋点→不命中', hitSecs(h,'R-CONS-04').length===0, JSON.stringify(hitSecs(h,'R-CONS-04')));

  // ---------- 8. 类型定位：自定义框架（feat2/accept2） ----------
  const p=ctx.currentProj();
  const fw=[{id:'feat2',title:'功能需求',type:'feat',required:true,weight:1,template:''},{id:'accept2',title:'验收',type:'accept',required:true,weight:1,template:''},{id:'text1',title:'其他说明',type:'text',required:false,weight:1,template:''}];
  p.framework=fw; t.STATE.framework=fw;
  t.DATA={feat2:{items:[{name:'',desc:'x',priority:'P0',status:'草稿'}],cards:[]},accept2:{items:[{text:'T',status:'pass',id:ctx.uid()}],cards:[]},text1:{html:'<p>正文</p>',cards:[]}};
  h=ctx.runHealth();
  check('v16.3 自定义节 id 也能命中（按类型定位）', hitSecs(h,'R-SPEC-02').includes('feat2'), JSON.stringify(hitSecs(h,'R-SPEC-02')));
  check('v16.3 自定义框架下功能↔验收平衡', hitSecs(h,'R-CONS-01').length===0, JSON.stringify(hitSecs(h,'R-CONS-01')));

  // ---------- 9. 人工审核通道：忽略/已订正 ----------
  t.DATA.feat2={items:Array.from({length:41},(_,i)=>({name:'F'+i,desc:'',priority:'P2',status:'草稿'})),cards:[]};
  h=ctx.runHealth();
  check('v16.3 基线:范围蔓延命中 feat2', hitSecs(h,'R-RISK-02').includes('feat2'), JSON.stringify(hitSecs(h,'R-RISK-02')));
  p.corrections={}; p.corrections.feat2={}; p.corrections.feat2['R-RISK-02']={status:'ignored',at:Date.now()};
  h=ctx.runHealth();
  check('v16.3 「忽略」后从 activeHits 剔除', !h.activeHits.some(x=>x.ruleId==='R-RISK-02'), JSON.stringify(h.activeHits.filter(x=>x.ruleId==='R-RISK-02')));
  check('v16.3 「忽略」保留在 rawHits（可回看）', h.rawHits.some(x=>x.ruleId==='R-RISK-02'), 'not in raw');

  // ---------- 10. 人工审核通道：手动改色 ----------
  t.STATE.framework=fw; p.framework=fw;
  t.DATA.feat2={items:[{name:'A',desc:'x',priority:'P0',status:'草稿'}],cards:[]};
  p.overrides={}; p.overrides.feat2={color:'green',reason:'人工复核通过',by:'PM',at:Date.now()};
  h=ctx.runHealth();
  check('v16.3 手动改色覆盖引擎色', h.sec.feat2.effective==='green'&&h.sec.feat2.override&&h.sec.feat2.override.reason==='人工复核通过', JSON.stringify(h.sec.feat2));

  // ---------- 11. 无必填节时完成度不再恒 0 ----------
  fw.forEach(s=>s.required=false);
  t.DATA={feat2:{items:[],cards:[]},accept2:{items:[],cards:[]},text1:{html:'',cards:[]}};
  h=ctx.runHealth();
  check('v16.3 无必填节且无红节→完成度 100', h.metrics.completion===100, 'completion='+h.metrics.completion);

  // ---------- 12. 设置页规则列表只读 ----------
  ctx.renderRulesTab();
  const html=t.tabRules.innerHTML;
  check('v16.3 规则列表含 R-SPEC-01', html.indexOf('R-SPEC-01')>=0, 'no R-SPEC-01');
  check('v16.3 规则列表无编辑控件(只读)', html.indexOf('rule-en')<0&&html.indexOf('addrule')<0&&html.indexOf('rule-del')<0, 'editable controls found');

  const fails=results.filter(r=>!r.pass).length;
  console.log('\n共 '+results.length+' 项，失败 '+fails+' 项');
  process.exit(fails?1:0);
}catch(e){
  console.error('HARNESS ERROR:', e&&e.stack||e);
  process.exit(2);
}
