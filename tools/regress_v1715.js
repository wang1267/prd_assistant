// v17.15 回归自测：AI 撰写草稿（从产品描述逐节生成整份 PRD，逐条确认后写入、版本可回滚）
// 运行：node tools/regress_v1715.js
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
    const src = block1 + '\n' + aiCtrl + '\n;globalThis.__test={get DATA(){return DATA;},set DATA(v){DATA=v;},get STATE(){return STATE;},set STATE(v){STATE=v;},get DEFAULT_FRAMEWORK(){return DEFAULT_FRAMEWORK;}};\n';
    vm.runInContext(src, ctx, {filename:'v1715.js'});
    const t=ctx.__test;
    const AI=ctx.__AICtrl;

    // ---------- 1. Markdown → HTML 转换 ----------
    const md1='## 目标\n- 唤醒率 ≥ 95%\n- 延迟 ≤ 1.5 秒\n\n**重点**：可量化。\n\n| 指标 | 目标 |\n|---|---|\n| 唤醒率 | ≥95% |';
    const h1=AI._test.mdToHtml(md1);
    check('v17.15 mdToHtml：h3/列表/加粗/表格', h1.indexOf('<h3>目标</h3>')>=0&&h1.indexOf('<ul><li>唤醒率 ≥ 95%</li>')>=0&&h1.indexOf('<strong>重点</strong>')>=0&&h1.indexOf('<table class="tbl">')>=0, h1);
    const h2=AI._test.mdToHtml('<script>alert(1)</script> 正文');
    check('v17.15 mdToHtml：脚本被转义不注入', h2.indexOf('<script>')<0, h2);
    const h3=AI._test.mdToHtml('1. 第一步\n2. 第二步');
    check('v17.15 mdToHtml：有序列表', h3.indexOf('<ol>')>=0&&h3.indexOf('<li>第一步</li>')>=0, h3);

    // ---------- 2. 归一化：rows / items ----------
    const rowsOk=AI._test.normRows([{cells:['版本','作者']},{cells:['v1','张三']}]);
    const rowsBad=AI._test.normRows([{cells:['版本','作者']},{cells:['v1']}]);
    check('v17.15 normRows：列数一致保留、不一致拒绝', rowsOk&&rowsOk.length===2&&rowsBad===null, JSON.stringify({rowsOk,rowsBad}));
    const itemsF=AI._test.normItems('feat',[{name:'免唤醒',desc:'支持续指令',priority:'p0',status:'评审中'},{name:'',desc:'缺名'},{name:'打断',desc:'可打断',priority:'P9'}]);
    check('v17.15 normItems(feat)：优先级归一 P0、非法 P9→P2、空名过滤', itemsF.length===2&&itemsF[0].priority==='P0'&&itemsF[1].priority==='P2', JSON.stringify(itemsF));
    const itemsA=AI._test.normItems('accept',[{text:'延迟≤1.5s',status:'x'},{text:'无量化'}]);
    check('v17.15 normItems(accept)：status 强制 na', itemsA.length===2&&itemsA.every(i=>i.status==='na'), JSON.stringify(itemsA));
    const itemsU=AI._test.normItems('users',[{role:'驾驶员',want:'免唤醒',soThat:'少分心'},{role:'',want:''}]);
    check('v17.15 normItems(users)：空条目过滤', itemsU.length===1&&itemsU[0].role==='驾驶员', JSON.stringify(itemsU));

    // ---------- 3. 设置 Key + 项目 ----------
    const def=AI.getSettings();
    def.apiKey='sk-gen-123456';
    ctx.localStorage.setItem('prdKanbanAiSettings', JSON.stringify(def));
    ctx.createProject('v17.15 撰写回归', null);
    t.DATA.purpose={html:'',cards:[]};
    t.DATA.feat={items:[],cards:[]};
    t.DATA.accept={items:[],cards:[]};

    // ---------- 4. 单节生成：text / table / items ----------
    fetchQueue=[JSON.stringify({html:'## 目标\n- 唤醒率 ≥ 95%\n- 延迟 ≤ 1.5 秒'})];
    const chT=await AI._test.genSection('purpose','为座舱新增免唤醒连续对话能力。',{});
    check('v17.15 genSection(text)：转 HTML 并含要点', chT&&chT.type==='text'&&chT.replaceSection.indexOf('<h3>目标</h3>')>=0&&chT.replaceSection.indexOf('≥ 95%')>=0, JSON.stringify(chT));

    const p=ctx.currentProj();
    p.framework.push({id:'def',title:'定义',type:'table',required:false,weight:1,template:''});
    t.STATE.framework=p.framework;
    t.DATA.def={rows:[{cells:['术语','定义']},{cells:['','']}],cards:[]};
    fetchQueue=[JSON.stringify({rows:[{cells:['术语','定义']},{cells:['免唤醒','无需唤醒词']},{cells:['多意图','一句话多条指令']}]})];
    const chTb=await AI._test.genSection('def','为座舱新增免唤醒连续对话能力。',{});
    check('v17.15 genSection(table)：rows 归一且列数一致', chTb&&chTb.type==='table'&&chTb.replaceRows.length===3&&chTb.replaceRows[0].cells[0]==='术语', JSON.stringify(chTb));

    fetchQueue=[JSON.stringify({items:[{name:'免唤醒续指令',desc:'窗口内无需唤醒词',priority:'P0',status:'草稿'},{name:'多意图拆分',desc:'一句话拆多条',priority:'P1',status:'评审中'}]})];
    const chF=await AI._test.genSection('feat','为座舱新增免唤醒连续对话能力。',{});
    check('v17.15 genSection(feat)：items 归一', chF&&chF.type==='items'&&chF.replaceItems.length===2&&chF.replaceItems[0].priority==='P0', JSON.stringify(chF));

    fetchQueue=['{}'];
    const chEmpty=await AI._test.genSection('accept','为座舱新增免唤醒连续对话能力。',{});
    check('v17.15 genSection：模型空返回 → 该节跳过(null)', chEmpty===null, String(chEmpty));

    // ---------- 5. 全流程：minimal 框架逐节生成 ----------
    const genName=doc.getElementById('aiGenName'); genName.value='座舱语音草稿';
    const genDesc=doc.getElementById('aiGenDesc'); genDesc.value='为智能座舱新增免唤醒连续对话能力，支持一句话多意图、随时打断修正；目标：唤醒率≥95%、误唤醒≤1次/24h、端到端延迟≤1.5s、连续对话≥5轮。';
    const genFw=doc.getElementById('aiGenFw'); genFw.value='minimal';
    fetchQueue=[
      JSON.stringify({html:'## 背景\n本功能解决驾驶分心问题。'}),
      '{}', // scope 故意失败 → 应跳过
      JSON.stringify({items:[{name:'免唤醒续指令',desc:'窗口内续指令',priority:'P0',status:'草稿'},{name:'多意图拆分',desc:'一句话拆多条',priority:'P1',status:'评审中'}]}),
      JSON.stringify({html:'性能：延迟≤1.5s；可用性≥99.5%。'}),
      JSON.stringify({items:[{text:'免唤醒连续对话≥5轮'},{text:'端到端延迟≤1.5s'}]}),
      JSON.stringify({html:'灰度 5% 三天后全量。'}),
      JSON.stringify({html:'无补充。'})
    ];
    await AI.runGen();
    const stG=AI._test.state();
    const pd=stG.pendingDiffs;
    check('v17.15 全流程：生成新项目且 pendingDiffs.gen', pd&&pd.gen===true&&ctx.currentProj().name==='座舱语音草稿', JSON.stringify({pd,proj:ctx.currentProj().name}));
    check('v17.15 全流程：6 节成功 1 节失败跳过', pd.items.length===6&&pd.items.every(i=>i.validation&&i.validation.ok), JSON.stringify(pd.items.map(i=>({sid:i.sectionId,type:i.type,ok:i.validation&&i.validation.ok}))));
    check('v17.15 全流程：诊断记录 scope 失败', stG.lastGenDebug&&stG.lastGenDebug.failed.indexOf('范围')>=0&&stG.lastGenDebug.ok===6, JSON.stringify(stG.lastGenDebug));
    check('v17.15 全流程：确认前正文零改动', !t.DATA.purpose.html&&t.DATA.feat.items.length===0, JSON.stringify({html:t.DATA.purpose.html,items:t.DATA.feat.items}));
    const featIt=pd.items.filter(i=>i.sectionId==='feat')[0];
    check('v17.15 全流程：feat 为 items 类型且校验通过', featIt&&featIt.type==='items'&&featIt.replaceItems.length===2, JSON.stringify(featIt));

    // ---------- 6. 全部接受 → 写入 + 「AI 草稿」版本 ----------
    AI._test.acceptAll();
    const stA=AI._test.state();
    check('v17.15 接受后正文写入（text/items/accept）', (t.DATA.purpose.html||'').indexOf('驾驶分心')>=0&&t.DATA.feat.items.length===2&&t.DATA.accept.items.length===2, JSON.stringify({html:t.DATA.purpose.html,feat:t.DATA.feat.items.length,accept:t.DATA.accept.items.length}));
    const vG=stA.versions[0];
    check('v17.15 归档版本：label=AI 草稿、kind=ai、含 items 条目', vG&&vG.label==='AI 草稿'&&vG.kind==='ai'&&Array.isArray(vG.patch.feat)&&vG.patch.feat[0].kind==='items', JSON.stringify(vG&&vG.patch));
    check('v17.15 版本补丁 oldItems 精确快照（空→新）', vG.patch.feat[0].oldItems.length===0&&vG.patch.feat[0].newItems.length===2, JSON.stringify(vG.patch.feat));

    // ---------- 7. 恢复 AI 草稿 → 回到生成前空白；恢复安全快照 → 草稿可找回 ----------
    AI._test.restore(vG.id);
    const stR=AI._test.state();
    check('v17.15 恢复草稿=回到生成前空白（含 items 精确回滚）', !t.DATA.purpose.html&&t.DATA.feat.items.length===0&&t.DATA.accept.items.length===0, JSON.stringify({html:t.DATA.purpose.html,feat:t.DATA.feat.items,accept:t.DATA.accept.items}));
    check('v17.15 恢复生成安全快照 human', stR.versions[stR.versions.length-1].kind==='human'&&stR.versions[stR.versions.length-1].label==='恢复前快照', JSON.stringify(stR.versions.map(v=>v.kind+'/'+v.label)));
    const safety=stR.versions[stR.versions.length-1];
    AI._test.restore(safety.id);
    check('v17.15 恢复安全快照=草稿可找回', (t.DATA.purpose.html||'').indexOf('驾驶分心')>=0&&t.DATA.feat.items.length===2&&t.DATA.accept.items.length===2, JSON.stringify({html:t.DATA.purpose.html,feat:t.DATA.feat.items.length,accept:t.DATA.accept.items.length}));
  }catch(e){
    results.push({name:'脚本异常',pass:false});
    console.log('FAIL  脚本异常  >>> '+(e&&e.stack||e));
  }
  const failed=results.filter(r=>!r.pass).length;
  console.log('\n共 '+results.length+' 项断言，失败 '+failed+' 项');
  process.exit(failed?1:0);
})();
