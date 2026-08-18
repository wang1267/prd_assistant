// v17.19 回归自测：AI 撰写按模板风格约束生成（风格指南注入 prompt）
// 运行：node tools/regress_v1719.js
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const block1 = fs.readFileSync(path.join(__dirname, '..', 'tools', 'block1.js'), 'utf8');
const aiCtrl = fs.readFileSync(path.join(__dirname, '..', 'tools', 'ai-controller.js'), 'utf8');

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

let fetchQueue = [];
let capturedBodies = [];
function respWith(content){
  const enc = new TextEncoder();
  const bytes = enc.encode('data: '+JSON.stringify({choices:[{delta:{content}}]})+'\n\ndata: [DONE]\n\n');
  let pos = 0;
  return {
    ok:true, status:200,
    json:()=>Promise.resolve({choices:[{message:{content}}]}),
    body:{ getReader(){ return { read(){ if(pos>=bytes.length)return Promise.resolve({done:true}); const slice=bytes.slice(pos,pos+48); pos+=48; return Promise.resolve({done:false,value:slice}); } }; } }
  };
}
function mockFetch(url, opts){
  if(opts&&opts.body)capturedBodies.push(JSON.parse(opts.body));
  return new Promise((resolve,reject)=>{
    if(opts&&opts.signal){
      if(opts.signal.aborted){ reject(new DOMException('Aborted','AbortError')); return; }
      opts.signal.addEventListener('abort',()=>reject(new DOMException('Aborted','AbortError')));
    }
    const content = fetchQueue.length?fetchQueue.shift():'{}';
    resolve(respWith(content));
  });
}

const ctx = {
  document:doc, localStorage:storage, console, setTimeout, clearTimeout, setInterval, clearInterval,
  confirm:()=>true, prompt:()=>'', alert:()=>{}, TextDecoder, TextEncoder, URL, AbortController,
  fetch:mockFetch, FileReader:function(){}, Blob:function(){}, FormData:function(){},
  DOMParser:function(){return {parseFromString:()=>({body:{innerHTML:'',querySelectorAll:()=>[]}})};},
  addEventListener(){}, removeEventListener(){}, innerWidth:1280, innerHeight:800, scrollX:0, scrollY:0,
  getSelection(){return {isCollapsed:true,rangeCount:0,removeAllRanges(){},getRangeAt(){return {cloneRange(){}};}};},
  matchMedia:()=>({matches:false,addEventListener(){}}),
};
ctx.window=ctx;
vm.createContext(ctx);

let results=[];
function check(name,cond,detail){results.push({name,pass:!!cond});console.log((cond?'PASS':'FAIL')+'  '+name+(cond?'':'  >>> '+detail));}

(async function(){
  try{
    const src = block1 + '\n' + aiCtrl + '\n;globalThis.__test={get DATA(){return DATA;},set DATA(v){DATA=v;},get STATE(){return STATE;},set STATE(v){STATE=v;}};\n';
    vm.runInContext(src, ctx, {filename:'v1719.js'});
    const t=ctx.__test;
    const AI=ctx.__AICtrl;

    // ---------- 1. 风格指南 ----------
    const gH=AI._test.styleGuide('hardware');
    const gA=AI._test.styleGuide('agile');
    const gN=AI._test.styleGuide('');
    check('v17.19 风格指南：hardware 含安全/法规/接口', gH.indexOf('功能安全等级')>=0&&gH.indexOf('AEC-Q')>=0&&gH.indexOf('接口必须写协议')>=0, gH);
    check('v17.19 风格指南：agile 含排除项', gA.indexOf('排除项')>=0, gA);
    check('v17.19 风格指南：不约束返回空', gN==='', JSON.stringify(gN));

    // ---------- 2. prompt 注入 ----------
    ctx.createProject('v17.19 回归', null);
    t.DATA.purpose={html:'',cards:[]};
    const fwList=ctx.STATE.framework.map(x=>x.id+'「'+x.title+'」').join('；');
    const pWith=AI._test.genPrompt('purpose','为座舱新增免唤醒能力。',fwList,AI._test.styleGuide('hardware'));
    const pNo=AI._test.genPrompt('purpose','为座舱新增免唤醒能力。',fwList,'');
    check('v17.19 prompt：带风格时 system 含风格约束', pWith&&pWith.system.indexOf('【模板风格：智能硬件/车规】')>=0&&pWith.system.indexOf('功能安全等级')>=0, pWith?pWith.system:'null');
    check('v17.19 prompt：不带风格时无风格段落', pNo&&pNo.system.indexOf('【模板风格')<0, pNo?pNo.system:'null');

    // ---------- 3. genSection 透传风格指南到请求体 ----------
    fetchQueue=[JSON.stringify({html:'## 目标\n- 唤醒率 ≥ 95%'})];
    capturedBodies=[];
    const ch1=await AI._test.genSection('purpose','为座舱新增免唤醒能力。',{styleGuide:AI._test.styleGuide('hardware')});
    const body1=capturedBodies[0];
    check('v17.19 genSection：请求体 system 含硬件风格', ch1&&ch1.replaceSection&&body1&&String(body1.messages[0].content).indexOf('功能安全等级')>=0, JSON.stringify({ch1,body:body1&&body1.messages[0].content&&String(body1.messages[0].content).slice(0,80)}));

    fetchQueue=[JSON.stringify({html:'## 目标\n- 延迟 ≤ 1.5s'})];
    capturedBodies=[];
    const ch2=await AI._test.genSection('purpose','为座舱新增免唤醒能力。',{});
    const body2=capturedBodies[0];
    check('v17.19 genSection：无风格时不注入', ch2&&body2&&String(body2.messages[0].content).indexOf('【模板风格')<0, JSON.stringify({ch2:!!ch2}));
  }catch(e){
    results.push({name:'脚本异常',pass:false});
    console.log('FAIL  脚本异常  >>> '+(e&&e.stack||e));
  }
  const failed=results.filter(r=>!r.pass).length;
  console.log('\n共 '+results.length+' 项断言，失败 '+failed+' 项');
  process.exit(failed?1:0);
})();
