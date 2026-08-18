// v17.22 回归自测：长文档分块评分（按节切块→逐块打分→按内容长度加权聚合→合并问题→缓存）
// 运行：node tools/regress_v1722.js
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
let fetchCount = 0;
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
  fetchCount++;
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
    vm.runInContext(src, ctx, {filename:'v1722.js'});
    const t=ctx.__test;
    const AI=ctx.__AICtrl;

    const def=AI.getSettings();
    def.apiKey='sk-chunk-001';
    ctx.localStorage.setItem('prdKanbanAiSettings', JSON.stringify(def));

    ctx.createProject('v17.22 分块回归', null);
    const longText='这是用于长文档分块评分回归的长篇内容。'.repeat(90); // ~1620 字/节
    ['purpose','scope','nfr','ui','launch','other'].forEach(sid=>{t.DATA[sid]={html:'<p>'+longText+'</p>',cards:[]};});
    const text=AI._test.docText();
    check('v17.22 长文总长度超过阈值', text.length>5500, 'len='+text.length);

    const chunks=AI._test.chunkDoc(text,5500);
    // 按节切分：单块可超限一个有界单节的量（约 2k），但必须保持整节完整性
    check('v17.22 分块：≥2 块、每块超限有界、整节不切断', chunks.length>=2 && chunks.every(c=>c.length<=7600) && chunks.every(c=>/^##\s*\[/.test(c)), 'chunks='+chunks.length+', lens='+chunks.map(c=>c.length).join(','));

    function chunkResp(score,issue){
      return JSON.stringify({summary:'块评分 '+score,dimensions:['completeness','clarity','consistency','executability','verifiability','risk'].map(k=>{
        const d={id:k,name:k,score:score,note:'note-'+k};
        if(issue)d.issues=[issue];
        else d.issues=[];
        return d;
      })});
    }
    const issue1={sectionId:'purpose',severity:'high',reason:'块1问题',quote:longText.slice(0,30),suggestion:'补量化'};
    const issue2={sectionId:'nfr',severity:'medium',reason:'块2问题',quote:'',suggestion:'补指标'};
    fetchQueue=chunks.map((c,i)=>chunkResp(i===0?60:90,i===0?issue1:issue2));
    fetchCount=0;
    const rep=await AI._test.scoreChunked(text,{});
    const expCom=Math.round(chunks.reduce((a,c,i)=>a+c.length*(i===0?60:90),0)/chunks.reduce((a,c)=>a+c.length,0));
    const compDim=rep.dimensions.find(d=>d.id==='completeness');
    const allReasons=rep.dimensions.reduce((a,d)=>a.concat((d.issues||[]).map(i=>i.reason)),[]);
    check('v17.22 分块评分：chunked 标记+按长度加权总分', rep.chunked===true && rep.total===expCom && compDim.score===expCom, JSON.stringify({total:rep.total,expCom,compDim:compDim.score}));
    check('v17.22 分块评分：两个块的问题合并且引用匹配', allReasons.indexOf('块1问题')>=0 && allReasons.indexOf('块2问题')>=0 && compDim.issues.every(i=>i.lowConfidence===false), JSON.stringify(allReasons));
    check('v17.22 分块评分：摘要含分块说明', rep.summary.indexOf('分块')>=0 && rep.summary.indexOf('全文')>=0, rep.summary);
    check('v17.22 分块评分：请求次数=分块数', fetchCount===chunks.length, 'fetch='+fetchCount);

    // 缓存：runScore 两次，第二次零请求
    fetchQueue=chunks.map((c,i)=>chunkResp(i===0?60:90,null));
    fetchCount=0;
    await AI.runScore();
    const n1=fetchCount;
    const st1=AI._test.state();
    fetchQueue=[];
    await AI.runScore();
    const st2=AI._test.state();
    check('v17.22 缓存：首跑 N 请求、二跑零请求且 cached', n1===chunks.length && fetchCount===n1 && st2.lastReport.cached===true, JSON.stringify({n1,fetchCount,cached:st2.lastReport&&st2.lastReport.cached}));

    // 短文档走单请求
    ['purpose','scope','nfr','ui','launch','other'].forEach(sid=>{t.DATA[sid]={html:'<p>短内容</p>',cards:[]};});
    fetchQueue=[chunkResp(80,null)];
    fetchCount=0;
    await AI.runScore();
    const st3=AI._test.state();
    check('v17.22 短文档：单请求且无 chunked', fetchCount===1 && !(st3.lastReport&&st3.lastReport.chunked), JSON.stringify({fetchCount,chunked:st3.lastReport&&st3.lastReport.chunked}));
  }catch(e){
    results.push({name:'脚本异常',pass:false});
    console.log('FAIL  脚本异常  >>> '+(e&&e.stack||e));
  }
  const failed=results.filter(r=>!r.pass).length;
  console.log('\n共 '+results.length+' 项断言，失败 '+failed+' 项');
  process.exit(failed?1:0);
})();
