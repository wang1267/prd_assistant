// v17.1 回归自测：AI 控制器（评分校准/独立复检/确定性校验/块级最小编辑/双格式版本）
// 运行：node tools/regress_v170.js
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
let fetchFail = null;
let fetchCount = 0;
let hangFetch = false;
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
    if(hangFetch)return; // 挂起：等待 abort
    if(fetchFail){ const f=fetchFail; fetchFail=null; resolve({ok:false,status:f.status,json:()=>Promise.resolve({error:{message:f.msg||'err'}})}); return; }
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
    vm.runInContext(src, ctx, {filename:'v170.js'});
    const t=ctx.__test;
    const AI=ctx.__AICtrl;

    // ---------- 1. 启动注入 ----------
    check('v17.1 boot 注入面板/按钮/tab', !!doc.getElementById('aiPanel')&&!!doc.getElementById('btnAi')&&!!doc.getElementById('tabAI'), '');
    const def = AI.getSettings();
    check('v17.1 默认 6 维权重=100', Object.keys(def.dims).length===6&&Object.values(def.dims).reduce((a,d)=>a+d.weight,0)===100, '');
    check('v17.1 默认 reviewModel 为空', def.reviewModel==='', def.reviewModel);

    // ---------- 2. Key 隔离 ----------
    def.apiKey='sk-test-123456';
    ctx.localStorage.setItem('prdKanbanAiSettings', JSON.stringify(def));
    const savedState = ctx.localStorage.getItem('prdKanbanStateV3')||'';
    check('v17.1 Key 独立键且不进 STATE', (ctx.localStorage.getItem('prdKanbanAiSettings')||'').indexOf('sk-test-123456')>=0&&savedState.indexOf('sk-test-123456')<0, '');

    // ---------- 3. 项目 + 评分（quote/note/lowConfidence） ----------
    ctx.createProject('v17.1 AI 回归', null);
    t.DATA.purpose={html:'<p>目标：提升转化率</p><p>保留段落</p>',cards:[]};
    const dt = AI._test.docText();
    check('v17.1 全文抽取含节标记', dt.indexOf('[purpose]')>=0&&dt.indexOf('保留段落')>=0, dt.slice(0,60));

    // ---------- 3.5 v17.3 停止 AI（挂起请求 + abort） ----------
    hangFetch=true;
    const pRun=AI.runScore();
    await new Promise(r=>setTimeout(r,120));
    check('v17.3 运行中 busy=true', AI.isBusy()===true, '');
    AI.stop();
    await new Promise(r=>setTimeout(r,50));
    check('v17.3 停止后 busy=false', AI.isBusy()===false, '');
    await pRun;
    check('v17.3 停止后未产生评分结果', AI._test.state().lastReport===null, JSON.stringify(AI._test.state().lastReport));
    hangFetch=false;

    const scoreJson='{"summary":"整体尚可","dimensions":[{"id":"completeness","name":"完整性","score":70,"note":"目标未量化","issues":[{"sectionId":"purpose","severity":"high","reason":"缺量化指标","quote":"目标：提升转化率","suggestion":"补指标"},{"sectionId":"purpose","severity":"low","reason":"疑似问题","quote":"原文不存在的句子","suggestion":"核对"}]},{"id":"clarity","name":"清晰度","score":80,"note":"","issues":[]},{"id":"consistency","name":"一致性","score":90,"note":"","issues":[]},{"id":"executability","name":"可执行性","score":60,"note":"","issues":[]},{"id":"verifiability","name":"可验证性","score":75,"note":"","issues":[]},{"id":"risk","name":"风险","score":85,"note":"","issues":[]}]}';
    fetchQueue=[scoreJson];
    await AI.runScore();
    const st1=AI._test.state();
    const iss=st1.lastReport.dimensions.filter(d=>d.id==='completeness')[0].issues;
    check('v17.1 加权总分=76', st1.lastReport.total===76, st1.lastReport.total);
    check('v17.1 quote 匹配→非幻觉', iss[0].lowConfidence===false, JSON.stringify(iss[0]));
    check('v17.1 quote 未匹配→标幻觉', iss[1].lowConfidence===true, JSON.stringify(iss[1]));

    // ---------- 4. 评分缓存：同内容第二次零网络调用 ----------
    const n0=fetchCount;
    await AI.runScore();
    check('v17.1 缓存命中且零网络', AI._test.state().lastReport.cached===true&&fetchCount===n0, 'fetch='+(fetchCount-n0));

    // ---------- 5. 一键优化：块级 edits + 独立复检 ----------
    const optJson='{"changes":[{"sectionId":"purpose","type":"text","edits":[{"op":"replaceBlock","match":"目标：提升转化率","newHtml":"<p>新目标：转化率 ≥ 5%（量化）</p>"}]}],"summary":"补量化"}';
    const reviewJson='{"score":91,"verdict":"pass","newIssues":[],"summary":"复核通过"}';
    fetchQueue=[optJson,reviewJson];
    await AI.runOptimize();
    const st2=AI._test.state();
    check('v17.1 优化产生待确认 Diff', st2.pendingDiffs&&st2.pendingDiffs.items.length===1, JSON.stringify(st2.pendingDiffs));
    check('v17.1 复检结论记录 pass/91', st2.pendingDiffs.review&&st2.pendingDiffs.review.verdict==='pass'&&st2.pendingDiffs.review.score===91, JSON.stringify(st2.pendingDiffs.review));
    check('v17.1 确认前正文未改动且保留段落仍在', (t.DATA.purpose.html||'').indexOf('5%')<0&&(t.DATA.purpose.html||'').indexOf('保留段落')>=0, t.DATA.purpose.html);
    const it0=st2.pendingDiffs.items[0];
    check('v17.1 块级校验通过且记录 blocks', it0.validation&&it0.validation.ok&&it0.blocks&&it0.blocks.length===1, JSON.stringify(it0.validation));

    // ---------- 6. 全部接受 → 只改被引用块，未引用块保留 ----------
    AI._test.acceptAll();
    const st3=AI._test.state();
    check('v17.1 接受后正文写入且保留段落未动', (t.DATA.purpose.html||'').indexOf('5%')>=0&&(t.DATA.purpose.html||'').indexOf('保留段落')>=0, t.DATA.purpose.html);
    check('v17.1 新格式补丁（块级）', Array.isArray(st3.versions[0].patch.purpose)&&st3.versions[0].patch.purpose[0].kind==='block'&&st3.versions[0].patch.purpose[0].blockOld.indexOf('提升转化率')>=0&&st3.versions[0].patch.purpose[0].blockNew.indexOf('5%')>=0, JSON.stringify(st3.versions[0].patch));
    check('v17.1 版本 applied 且 scoreAfter=91', st3.versions[0].applied&&st3.versions[0].scoreAfter===91, JSON.stringify(st3.versions[0]));

    // ---------- 7. 第二版 + 恢复（新格式倒序回放 + 安全快照） ----------
    const v1=st3.versions[0];
    t.DATA.purpose.html='<p>用户又手改的内容</p><p>保留段落</p>';
    AI._test.createVersion('ai','优化版 2',{purpose:[{kind:'block',blockOld:'<p>新目标：转化率 ≥ 5%（量化）</p>',blockNew:'<p>再优化一版</p>',anchor:''}]},91,92,{applied:true});
    t.DATA.purpose.html='<p>再优化一版</p><p>保留段落</p>';
    AI._test.restore(v1.id);
    const st4=AI._test.state();
    check('v17.1 新格式恢复回 v1 块内容', (t.DATA.purpose.html||'').indexOf('转化率 ≥ 5%')>=0&&(t.DATA.purpose.html||'').indexOf('保留段落')>=0, t.DATA.purpose.html);
    check('v17.1 恢复生成安全快照', st4.versions.length===3&&st4.versions[st4.versions.length-1].kind==='human', JSON.stringify(st4.versions.map(v=>v.kind)));

    // ---------- 8. 旧格式（v17.0 整节补丁）兼容恢复（非 head，走倒序回放） ----------
    AI._test.createVersion('ai','旧格式',{purpose:{old:{html:'<p>旧内容</p>'},new:{html:'<p>新内容</p>'}}},70,80,{applied:true});
    AI._test.createVersion('ai','后续版',{purpose:[{kind:'block',blockOld:'<p>新内容</p>',blockNew:'<p>后续内容</p>',anchor:''}]},80,85,{applied:true});
    t.DATA.purpose.html='<p>后续内容</p>';
    const oldV=AI._test.state().versions.filter(v=>v.label==='旧格式')[0];
    AI._test.restore(oldV.id);
    check('v17.1 旧格式版本仍可恢复（回放到其状态）', (t.DATA.purpose.html||'').indexOf('新内容')>=0, t.DATA.purpose.html);

    // ---------- 9. 表格行级 + 确定性校验（列数不一致 → blocked） ----------
    t.DATA.meta={rows:[{cells:['版本','作者']},{cells:['v1','张三']}],cards:[]};
    const badIt={sectionId:'meta',type:'table',rowEdits:[{op:'update',match:'v1',cells:['v1','张三','多一列']}]};
    AI._test.validate(badIt);
    check('v17.1 表格列数不一致被 blocked', !badIt.validation.ok&&badIt.validation.blocked.join('').indexOf('列数')>=0, JSON.stringify(badIt.validation));
    const okIt={sectionId:'meta',type:'table',rowEdits:[{op:'update',match:'v1',cells:['v1','李四']}]};
    AI._test.validate(okIt);
    check('v17.1 表格行级校验通过', okIt.validation.ok&&okIt.rows.length===1, JSON.stringify(okIt.validation));
    const re=AI._test.rowExec(t.DATA.meta.rows,[{op:'update',match:'v1',cells:['v1','李四']}]);
    check('v17.1 行级执行按首列定位', re.rows[1].cells[1]==='李四', JSON.stringify(re.rows));

    // ---------- 10. 块级执行器：replace/insert/delete + 未匹配 blocked ----------
    const html='<p>第一段</p><p>第二段</p>';
    const e1=AI._test.applyEdits(html,[{op:'replaceBlock',match:'第二段',newHtml:'<p>第二段改</p>'}]);
    check('v17.1 块替换精确', e1.html.indexOf('<p>第二段改</p>')>=0&&e1.html.indexOf('<p>第一段</p>')>=0, e1.html);
    const e2=AI._test.applyEdits(html,[{op:'insertBlock',match:'第一段',newHtml:'<p>插入段</p>',position:'after'}]);
    check('v17.1 块插入锚定', e2.html.indexOf('<p>第一段</p><p>插入段</p>')>=0, e2.html);
    const e3=AI._test.applyEdits(html,[{op:'deleteBlock',match:'第一段'}]);
    check('v17.1 块删除', e3.html.indexOf('<p>第一段</p>')<0&&e3.html.indexOf('<p>第二段</p>')>=0, e3.html);
    const e4=AI._test.applyEdits(html,[{op:'replaceBlock',match:'不存在的内容',newHtml:'<p>x</p>'}]);
    check('v17.1 未匹配块 → blocked', e4.results[0].ok===false, JSON.stringify(e4.results));
    check('v17.1 HTML 平衡校验', AI._test.balanced('<p>a</p><ul><li>b</li></ul>')===true&&AI._test.balanced('<p>a')===false, '');

    // ---------- 11. 规则引擎前后对比（确定性） ----------
    const delta=AI._test.evalDelta([{sectionId:'purpose',type:'text',edits:[{op:'replaceBlock',match:'再优化一版',newHtml:'<p>完整目标：转化率 ≥ 5%</p>'}]}]);
    check('v17.1 引擎对比返回指标', delta&&typeof delta.riskBefore==='number', JSON.stringify(delta));

    // ---------- 12. 上限淘汰 ----------
    for(let i=0;i<11;i++)AI._test.createVersion('ai','占位'+i,{purpose:[{kind:'block',blockOld:'<p>a'+i+'</p>',blockNew:'<p>b'+i+'</p>',anchor:''}]},10,10+i,{applied:true});
    check('v17.1 版本上限 10', AI._test.state().versions.length<=10, 'len='+AI._test.state().versions.length);

    // ---------- 13. change 归一化 / 清洗 ----------
    const ch=AI._test.normChange({sectionId:'purpose',type:'text',edits:[{op:'replaceBlock',match:'ok',newHtml:'<p>ok</p><script>x</script>'}]});
    check('v17.1 change 归一化（edits）', ch&&ch.type==='text'&&ch.edits.length===1&&ch.edits[0].newHtml.indexOf('<script')<0, JSON.stringify(ch));
    const bad=AI._test.normChange({sectionId:'no-such',type:'text',edits:[{op:'replaceBlock',match:'x',newHtml:'<p>x</p>'}]});
    check('v17.1 未知节 id 被拒绝', bad===null, JSON.stringify(bad));

    // ---------- 14. 401 错误分类（改内容使缓存失效后） ----------
    t.DATA.purpose.html='<p>触发缓存失效的新内容</p>';
    fetchFail={status:401,msg:'Invalid API key'};
    await AI.runScore();
    check('v17.1 401 不崩溃', true, '');

    // ---------- 15. v17.2 AI 结构对齐：错位检测 ----------
    ctx.createProject('v17.2 对齐回归', null);
    t.DATA.other={html:'<p>被放错的内容一：这是导入时未匹配到框架标题的整段背景描述</p><p>被放错的内容二：产品概述与目标说明，本应放在目的节</p><p>被放错的内容三：更多错位资料，用于把兜底节占比撑过四分之一阈值</p>',cards:[]};
    t.DATA.purpose={html:'<p>目标：提升转化率</p>',cards:[]};
    const hint=AI._test.alignHint();
    check('v17.2 兜底节占比高→高风险提示', hint.level==='high'&&hint.reasons.length>0, JSON.stringify(hint));

    // ---------- 16. 移动归一化 / 校验 ----------
    const mv=AI._test.normMove({fromSection:'other',match:'被放错的内容',toSection:'purpose',position:'end'});
    check('v17.2 move 归一化', mv&&mv.position==='end', JSON.stringify(mv));
    check('v17.2 同节移动被拒', AI._test.normMove({fromSection:'other',match:'x',toSection:'other',position:'end'})===null, '');
    check('v17.2 after 缺锚点被拒', AI._test.normMove({fromSection:'other',match:'x',toSection:'purpose',position:'after'})===null, '');
    const alignBad={id:'m1',kind:'moveBlock',fromSection:'other',fromTitle:'其他',toSection:'purpose',toTitle:'目的',match:'不存在的块',position:'end',anchor:'',blockOld:'',blockNew:'',rowOld:null,rowNew:null,fromAnchor:'',toAnchor:'',suggestion:'',validation:null,status:'pending'};
    AI._test.validateMove(alignBad);
    check('v17.2 找不到来源块→blocked', !alignBad.validation.ok&&alignBad.validation.blocked.join('').indexOf('未找到')>=0, JSON.stringify(alignBad.validation));
    const alignOk={id:'m2',kind:'moveBlock',fromSection:'other',fromTitle:'其他',toSection:'purpose',toTitle:'目的',match:'被放错的内容',position:'end',anchor:'',blockOld:'',blockNew:'',rowOld:null,rowNew:null,fromAnchor:'',toAnchor:'',suggestion:'',validation:null,status:'pending'};
    AI._test.validateMove(alignOk);
    check('v17.2 块移动校验通过且记录内容', alignOk.validation.ok&&alignOk.blockOld.indexOf('被放错的内容')>=0, JSON.stringify(alignOk.validation));
    t.DATA.meta={rows:[{cells:['版本','作者']},{cells:['v1','张三']}],cards:[]};
    t.DATA.track={rows:[{cells:['事件','参数','值']},{cells:['click','x','1']}],cards:[]};
    const alignRowBad={id:'m3',kind:'moveRow',fromSection:'meta',fromTitle:'变更',toSection:'track',toTitle:'埋点',match:'v1',position:'end',anchor:'',blockOld:'',blockNew:'',rowOld:null,rowNew:null,fromAnchor:'',toAnchor:'',suggestion:'',validation:null,status:'pending'};
    AI._test.validateMove(alignRowBad);
    check('v17.2 表格列数不一致→blocked', !alignRowBad.validation.ok&&alignRowBad.validation.blocked.join('').indexOf('列数')>=0, JSON.stringify(alignRowBad.validation));

    // ---------- 17. 全流程：AI 提议 → 确认 → 应用 → 版本 → 撤销 ----------
    const alignJson='{"moves":[{"fromSection":"other","match":"被放错的内容一：这是导入时未匹配到框架标题的整段背景描述","toSection":"purpose","position":"end"}],"suggestions":[{"kind":"rename","sectionId":"purpose","text":"建议把节标题改为产品概述"}],"summary":"把错位内容搬回目的节"}';
    fetchQueue=[alignJson];
    await AI.runAlign();
    const stA=AI._test.state();
    check('v17.2 对齐产生待确认项（1 移动+1 建议）', stA.pendingAlign&&stA.pendingAlign.items.length===2, JSON.stringify(stA.pendingAlign));
    check('v17.2 确认前内容未移动', (t.DATA.purpose.html||'').indexOf('内容一')<0&&(t.DATA.other.html||'').indexOf('内容一')>=0, t.DATA.purpose.html);
    AI._test.acceptAllAlign();
    const stB=AI._test.state();
    check('v17.2 确认后内容搬入目标节', (t.DATA.purpose.html||'').indexOf('内容一')>=0&&(t.DATA.other.html||'').indexOf('内容一')<0, t.DATA.purpose.html);
    const alignV=stB.versions.filter(v=>String(v.label||'').indexOf('结构对齐')===0).pop();
    check('v17.2 生成结构对齐版本（双节补丁）', !!alignV&&Array.isArray(alignV.patch.other)&&Array.isArray(alignV.patch.purpose)&&alignV.patch.other[0].blockNew===''&&alignV.patch.purpose[0].blockNew.indexOf('内容一')>=0, JSON.stringify(alignV&&alignV.patch));
    AI._test.restore(alignV.id);
    check('v17.2 撤销结构对齐（内容搬回原位）', (t.DATA.other.html||'').indexOf('内容一')>=0&&(t.DATA.purpose.html||'').indexOf('内容一')<0, t.DATA.purpose.html);

    // ---------- 18. v17.3 自动调整 ops：改名/删空节/合并/拆分 → 应用 → 撤销 ----------
    ctx.createProject('v17.3 ops', null);
    t.DATA.purpose={html:'<p>目的内容</p>',cards:[]};
    t.DATA.other={html:'<p>块一</p><p>块二</p>',cards:[]};
    t.DATA.nfr={html:'<p>非功能内容</p>',cards:[]};
    const uiSec=ctx.STATE.framework.find(s=>s.id==='ui');
    if(uiSec)uiSec.required=false;
    const emptySec=uiSec;
    const opsJson='{"ops":[{"op":"rename","sectionId":"purpose","newTitle":"产品目标"},{"op":"deleteEmpty","sectionId":"'+(emptySec?emptySec.id:'')+'"},{"op":"merge","fromSection":"nfr","toSection":"purpose"},{"op":"split","sectionId":"other","newTitle":"新增资料","moves":[{"match":"块一"}]}],"suggestions":[],"summary":"ops 测试"}';
    fetchQueue=[opsJson];
    await AI.runAlign();
    const stO1=AI._test.state();
    const kinds=stO1.pendingAlign?stO1.pendingAlign.items.map(i=>i.kind).sort().join(','):'';
    check('v17.3 四种 ops 生成待确认项', kinds==='deleteEmpty,merge,rename,split', kinds);
    AI._test.acceptAllAlign();
    const stO2=AI._test.state();
    const fwTitles=ctx.STATE.framework.map(s=>s.title);
    const newSec=ctx.STATE.framework.find(s=>s.title==='新增资料');
    const oth=(t.DATA.other&&t.DATA.other.html)||'';
    check('v17.3 改名生效', fwTitles.indexOf('产品目标')>=0, JSON.stringify(fwTitles));
    check('v17.3 空节被删除', emptySec?!ctx.STATE.framework.some(s=>s.id===emptySec.id):true, JSON.stringify(fwTitles));
    check('v17.3 合并生效（来源节删除+内容并入）', !ctx.STATE.framework.some(s=>s.id==='nfr')&&(t.DATA.purpose.html||'').indexOf('非功能内容')>=0, t.DATA.purpose.html);
    check('v17.3 拆分生效（新节含块一）', !!newSec&&((newSec&&t.DATA[newSec.id]&&t.DATA[newSec.id].html)||'').indexOf('块一')>=0&&oth.indexOf('块二')>=0&&oth.indexOf('块一')<0, oth);
    const opsV=stO2.versions.filter(v=>String(v.label||'').indexOf('结构对齐')===0).pop();
    const hasFw=!!opsV&&Object.keys(opsV.patch).some(sid=>opsV.patch[sid].some(e=>e.kind==='fwdel'||e.kind==='fwadd'||e.kind==='fwname'));
    check('v17.3 版本含框架级补丁', hasFw, JSON.stringify(opsV&&opsV.patch));
    AI._test.restore(opsV.id);
    const stO3=AI._test.state();
    const fwT2=ctx.STATE.framework.map(s=>s.title);
    check('v17.3 撤销 ops：改名还原/节恢复/内容回原位', fwT2.indexOf('目的')>=0&&!ctx.STATE.framework.some(s=>s.title==='新增资料')&&!!ctx.STATE.framework.some(s=>s.id==='nfr')&&(t.DATA.other.html||'').indexOf('块一')>=0&&(t.DATA.purpose.html||'').indexOf('非功能内容')<0, JSON.stringify({fwT2,other:t.DATA.other.html,purpose:t.DATA.purpose.html}));

    // ---------- 19. v17.3 导入默认走自动框架（无项目时） ----------
    t.STATE.activeProjectId=null;t.DATA={};
    ctx.doImportText('# 我的PRD\n\n## 目的\n目标说明\n## 功能需求\n功能说明','导入测试');
    const impP=ctx.currentProj();
    check('v17.3 无项目导入默认自动框架', !!impP&&impP.autoGen===true&&String(impP.framework[0]&&impP.framework[0].id).indexOf('ag')===0&&impP.data['ag2']&&(impP.data['ag2'].html||'').indexOf('目标说明')>=0, JSON.stringify(impP&&{autoGen:impP.autoGen,fw:impP.framework.map(s=>s.id+':'+s.title)}));

    // ---------- 20. v17.4 目录识别修复：跳过 Word 自动目录 + 有 # 标题时禁用编号行兜底 ----------
    const tocText='# 目录\n1 目的 1\n1.1 背景 2\n1.2 范围 3\n# 目的\n目标内容\n## 背景\n背景内容';
    const tocSecs=ctx.parseAutoGen(tocText);
    const tocTitles=tocSecs.map(s=>s.title);
    check('v17.4 目录块被跳过且条目不成为节', tocTitles.join(',')==='目的,背景', JSON.stringify(tocTitles));
    const gateText='## 目的\n目标内容\n1.2 这是正文编号行，不该是标题\n更多正文';
    const gateSecs=ctx.parseAutoGen(gateText);
    check('v17.4 有 # 标题时编号正文行不再误判为节', gateSecs.length===1&&gateSecs[0].title==='目的', JSON.stringify(gateSecs.map(s=>s.title)));

    // ---------- 21. v17.5 大标题→子标题层级：### 成为父节小卡片；无大标题时 ### 仍作节 ----------
    const hierText='## 系统管理\n### 机构管理\n### 角色管理\n## 贷款管理';
    const hierSecs=ctx.parseAutoGen(hierText);
    const smSec=hierSecs.find(s=>s.title==='系统管理');
    check('v17.5 ### 子标题归入父节小卡片', !!smSec&&(smSec.cards||[]).length===2&&smSec.cards[0].title==='机构管理'&&hierSecs.length===2, JSON.stringify(hierSecs.map(s=>({t:s.title,c:(s.cards||[]).map(x=>x.title)}))));
    const pure3Text='### 只有三级标题\n内容';
    const pure3Secs=ctx.parseAutoGen(pure3Text);
    check('v17.5 无大标题时 ### 仍作为节（纯加粗文档兜底）', pure3Secs.length===1&&pure3Secs[0].title==='只有三级标题', JSON.stringify(pure3Secs.map(s=>s.title)));

    // ---------- 22. v17.5 整节替换兜底（模型返回 newHtml 时也可用）：归一化→确认→版本→恢复 ----------
    ctx.STATE.framework=JSON.parse(JSON.stringify(t.DEFAULT_FRAMEWORK));
    ctx.createProject('v17.5 replace', null);
    ctx.STATE.framework=ctx.currentProj().framework;
    const chRS=AI._test.normChange({sectionId:'purpose',type:'text',newHtml:'<p>整节新内容</p>'});
    check('v17.5 整节 newHtml 归一化为 replaceSection', !!chRS&&chRS.replaceSection&&chRS.replaceSection.indexOf('整节新内容')>=0, JSON.stringify(chRS));
    t.DATA.purpose={html:'<p>原内容</p>',cards:[]};
    const scoreJson2='{"summary":"尚可","dimensions":[{"id":"completeness","name":"完整性","score":70,"note":"","issues":[{"sectionId":"purpose","severity":"high","reason":"内容单薄","quote":"原内容","suggestion":"补充"}]},{"id":"clarity","name":"清晰度","score":80,"note":"","issues":[]},{"id":"consistency","name":"一致性","score":90,"note":"","issues":[]},{"id":"executability","name":"可执行性","score":60,"note":"","issues":[]},{"id":"verifiability","name":"可验证性","score":75,"note":"","issues":[]},{"id":"risk","name":"风险","score":85,"note":"","issues":[]}]}';
    const optRS='{"changes":[{"sectionId":"purpose","type":"text","newHtml":"<p>整节新内容</p>"}],"summary":"整节替换"}';
    const reviewRS='{"score":88,"verdict":"pass","newIssues":[],"summary":"ok"}';
    fetchQueue=[scoreJson2,optRS,reviewRS];
    await AI.runOptimize();
    const stRS=AI._test.state();
    check('v17.5 整节替换产生待确认项', stRS.pendingDiffs&&stRS.pendingDiffs.items.length===1&&stRS.pendingDiffs.items[0].replaceSection!=null, JSON.stringify(stRS.pendingDiffs&&stRS.pendingDiffs.items[0]));
    AI._test.acceptAll();
    check('v17.5 整节替换写入正文', (t.DATA.purpose.html||'').indexOf('整节新内容')>=0, t.DATA.purpose.html);
    const rsV=AI._test.state().versions[AI._test.state().versions.length-1];
    check('v17.5 版本含整节补丁（kind section）', !!rsV&&rsV.patch.purpose&&rsV.patch.purpose.some(e=>e.kind==='section'), JSON.stringify(rsV&&rsV.patch));
    AI._test.createVersion('ai','后续',{purpose:[{kind:'block',blockOld:'<p>整节新内容</p>',blockNew:'<p>后续内容</p>',anchor:''}]},88,90,{applied:true});
    t.DATA.purpose.html='<p>后续内容</p>';
    AI._test.restore(rsV.id);
    check('v17.5 整节版本恢复回其状态（倒序回放+ensure）', (t.DATA.purpose.html||'').indexOf('整节新内容')>=0&&(t.DATA.purpose.html||'').indexOf('后续内容')<0, t.DATA.purpose.html);

    // ---------- 23. v17.5 对齐 blocked 原因在面板可见 ----------
    t.DATA.meta={rows:[{cells:['版本','作者']},{cells:['v1','张三']}],cards:[]};
    t.DATA.track={rows:[{cells:['事件','参数','值']}],cards:[]};
    const blockedAlign={id:'bx',kind:'moveRow',fromSection:'meta',fromTitle:'变更',toSection:'track',toTitle:'埋点',match:'v1',position:'end',anchor:'',blockOld:'',blockNew:'',rowOld:null,rowNew:null,fromAnchor:'',toAnchor:'',newTitle:'',moves:[],meta:null,suggestion:'',validation:null,status:'pending'};
    AI._test.validateMove(blockedAlign);
    const stBL=AI._test.state();
    stBL.pendingAlign={id:'x',createdAt:Date.now(),summary:'',items:[blockedAlign]};
    AI.renderPanel();
    const blHtml=doc.getElementById('aiBody').innerHTML||'';
    check('v17.5 对齐 blocked 原因在面板可见', blHtml.indexOf('列数')>=0, blHtml.slice(0,160));
    stBL.pendingAlign=null;

    // ---------- 24. v17.6 优化兜底：复杂协议失败→整节简化重试；失败记录诊断 ----------
    ctx.STATE.framework=JSON.parse(JSON.stringify(t.DEFAULT_FRAMEWORK));
    ctx.createProject('v17.6 fallback', null);
    ctx.STATE.framework=ctx.currentProj().framework;
    t.DATA.purpose={html:'<p>原内容</p>',cards:[]};
    const badJ='{"changes":[{"foo":"bar"}],"summary":"坏格式"}';
    const simpleJ='{"changes":[{"sectionId":"purpose","type":"text","newHtml":"<p>简化后的新内容</p>"}],"summary":"简化整节"}';
    const revJ='{"score":87,"verdict":"pass","newIssues":[],"summary":"ok"}';
    fetchQueue=[scoreJson2,badJ,simpleJ,revJ];
    await AI.runOptimize();
    const stFB=AI._test.state();
    check('v17.6 复杂协议失败自动简化重试并出建议', stFB.pendingDiffs&&stFB.pendingDiffs.items.length===1&&stFB.pendingDiffs.items[0].replaceSection!=null, JSON.stringify(stFB.pendingDiffs&&stFB.pendingDiffs.items[0]));
    check('v17.6 诊断记录保留（含 fallback 步骤）', !!stFB.lastOptDebug&&JSON.stringify(stFB.lastOptDebug).indexOf('fallbackSimple')>=0, JSON.stringify(stFB.lastOptDebug));
    AI._test.acceptAll();
    check('v17.6 简化结果可写入正文', (t.DATA.purpose.html||'').indexOf('简化后的新内容')>=0, t.DATA.purpose.html);

    // ---------- 25. v17.7 引用匹配修复：连续多块范围匹配 + 全部 blocked 自动整节重试 + 卡片不喂给优化 ----------
    const rngHtml=AI._test.applyEdits('<p>第一段</p><p>第二段</p><p>第三段</p>',[{op:'replaceBlock',match:'第一段 第二段',newHtml:'<p>合并段</p>'}]);
    check('v17.7 连续多块范围匹配', rngHtml.results[0].ok&&rngHtml.html.indexOf('<p>合并段</p>')>=0&&rngHtml.html.indexOf('<p>第三段</p>')>=0&&rngHtml.html.indexOf('第一段')<0, rngHtml.html);
    t.DATA.purpose={html:'<p>正文内容</p>',cards:[{title:'卡片标题',html:'<p>卡片正文</p>'}]};
    const withCards=AI._test.docText();
    const noCards=AI._test.docTextNoCards();
    check('v17.7 优化文本不含小卡片内容', withCards.indexOf('卡片标题')>=0&&noCards.indexOf('卡片标题')<0, noCards.slice(0,120));
    t.DATA.purpose={html:'<p>简化后的新内容</p>',cards:[]};
    const blockedEdits='{"changes":[{"sectionId":"purpose","type":"text","edits":[{"op":"replaceBlock","match":"完全不存在的引用","newHtml":"<p>x</p>"}]}],"summary":"引用失败"}';
    const simpleJ2='{"changes":[{"sectionId":"purpose","type":"text","newHtml":"<p>二次简化内容</p>"}],"summary":"整节"}';
    fetchQueue=[scoreJson2,blockedEdits,simpleJ2,revJ];
    await AI.runOptimize();
    const stV7=AI._test.state();
    check('v17.7 全部 blocked 自动改整节重试并出建议', stV7.pendingDiffs&&stV7.pendingDiffs.items.length===1&&stV7.pendingDiffs.items[0].replaceSection!=null, JSON.stringify(stV7.pendingDiffs&&stV7.pendingDiffs.items[0]));
    check('v17.7 诊断记录 blockedRetry', !!stV7.lastOptDebug&&JSON.stringify(stV7.lastOptDebug).indexOf('blockedRetry')>=0, JSON.stringify(stV7.lastOptDebug));
    AI._test.acceptAll();
    check('v17.7 整节重试结果可写入', (t.DATA.purpose.html||'').indexOf('二次简化内容')>=0, t.DATA.purpose.html);

    // ---------- 26. v17.9 逐条接受即写入 + 单条撤销 ----------
    ctx.STATE.framework=JSON.parse(JSON.stringify(t.DEFAULT_FRAMEWORK));
    ctx.createProject('v17.9 single', null);
    ctx.STATE.framework=ctx.currentProj().framework;
    t.DATA.purpose={html:'<p>目的原文</p>',cards:[]};
    t.DATA.scope={html:'<p>范围原文</p>',cards:[]};
    const opt9='{"changes":[{"sectionId":"purpose","type":"text","newHtml":"<p>目的已改</p>"},{"sectionId":"scope","type":"text","newHtml":"<p>范围已改</p>"}],"summary":"两节"}';
    fetchQueue=[scoreJson2,opt9,revJ];
    await AI.runOptimize();
    const st9=AI._test.state();
    const it9a=st9.pendingDiffs.items.find(i=>i.sectionId==='purpose');
    AI._test.decideDiff(it9a.id,'accepted');
    check('v17.9 单个接受立即写入该条', (t.DATA.purpose.html||'').indexOf('目的已改')>=0&&(t.DATA.scope.html||'').indexOf('范围已改')<0, (t.DATA.purpose.html||'')+' | '+(t.DATA.scope.html||''));
    check('v17.9 单个接受后其他条仍待确认', AI._test.state().pendingDiffs!==null&&AI._test.state().pendingDiffs.items.some(i=>i.status==='pending'), '');
    AI._test.undoDiff(it9a.id);
    check('v17.9 单条撤销恢复原文', (t.DATA.purpose.html||'').indexOf('目的原文')>=0, t.DATA.purpose.html);
    AI._test.acceptAll();
    check('v17.9 全部接受写入并归档', (t.DATA.purpose.html||'').indexOf('目的已改')>=0&&(t.DATA.scope.html||'').indexOf('范围已改')>=0&&AI._test.state().pendingDiffs===null, (t.DATA.purpose.html||'')+' | '+(t.DATA.scope.html||''));

    // ---------- 27. v17.10 数据自动备份与恢复 ----------
    ctx.createProject('v17.10 bak', null);
    ctx.save();
    AI._test.backup();
    const bakRaw=ctx.localStorage.getItem('prdKanbanStateV3.bak');
    check('v17.10 自动备份写入独立键', bakRaw!=null&&bakRaw.indexOf('v17.10 bak')>=0, '');
    const mainRaw=ctx.localStorage.getItem('prdKanbanStateV3');
    ctx.localStorage.removeItem('prdKanbanStateV3');
    const recovered=AI._test.recover();
    check('v17.10 主存储缺失时自动恢复', recovered===true&&ctx.currentProj()!=null&&(ctx.localStorage.getItem('prdKanbanStateV3')||'').indexOf('v17.10 bak')>=0, String(recovered));
    ctx.localStorage.removeItem('prdKanbanStateV3');
    ctx.localStorage.removeItem('prdKanbanStateV3.bak');
    ctx.localStorage.setItem('prdKanbanStateV3', JSON.stringify({version:6,projects:[],activeProjectId:null}));
    ctx.localStorage.setItem('prdKanbanStateV3.bak', bakRaw);
    const offered=AI._test.recover();
    const off=AI._test.recoverOffer();
    check('v17.10 主存储为空但有备份→给恢复入口', offered===true&&off!=null&&off.count>0, JSON.stringify(off));
    ctx.localStorage.removeItem('prdKanbanStateV3');
    ctx.localStorage.removeItem('prdKanbanStateV3.bak');
    ctx.localStorage.setItem('prdKanbanStateV3', mainRaw);

    // ---------- 28. v17.11 新示例 PRD（内嵌文档 + 自动框架） ----------
    check('v17.11 示例文本已内嵌', (AI._test.sampleText()||'').indexOf('多意图连续对话')>=0, String((AI._test.sampleText()||'').length));
    ctx.loadSample();
    const sp=ctx.currentProj();
    check('v17.11 加载示例走自动框架并含「目的」节', !!sp&&sp.autoGen===true&&sp.framework.length>0&&sp.framework.some(s=>s.title==='目的')&&JSON.stringify(sp.data).indexOf('多意图连续对话')>=0, JSON.stringify(sp&&sp.framework.map(s=>s.title).slice(0,15)));

    // ---------- 29. v17.13 整份解析失败→按节逐个优化兜底 ----------
    ctx.STATE.framework=JSON.parse(JSON.stringify(t.DEFAULT_FRAMEWORK));
    ctx.createProject('v17.13 section', null);
    ctx.STATE.framework=ctx.currentProj().framework;
    t.DATA.purpose={html:'<p>目的内容一</p><p>目的内容二</p>',cards:[]};
    const garbage='这不是合法JSON，模型在闲聊，没有按要求输出。';
    const secJ='{"changes":[{"sectionId":"purpose","type":"text","newHtml":"<p>分节优化后的目的</p>"}],"summary":"分节"}';
    const revJ2='{"score":87,"verdict":"pass","newIssues":[],"summary":"ok"}';
    fetchQueue=[scoreJson2,garbage,garbage,secJ,revJ2];
    await AI.runOptimize();
    const stS=AI._test.state();
    check('v17.13 整份解析失败→分节优化兜底出建议', stS.pendingDiffs&&stS.pendingDiffs.items.length===1&&stS.pendingDiffs.items[0].replaceSection!=null, JSON.stringify(stS.pendingDiffs));
    check('v17.13 诊断记录 fullDocParseFail 与原始返回', !!stS.lastOptDebug&&JSON.stringify(stS.lastOptDebug).indexOf('fullDocParseFail')>=0&&JSON.stringify(stS.lastOptDebug).indexOf('这不是合法JSON')>=0, JSON.stringify(stS.lastOptDebug));

    // ---------- 30. v17.14 大文档直接按节优化（跳过必然截断的整份调用） ----------
    ctx.STATE.framework=JSON.parse(JSON.stringify(t.DEFAULT_FRAMEWORK));
    ctx.createProject('v17.14 big', null);
    ctx.STATE.framework=ctx.currentProj().framework;
    t.DATA.purpose={html:'<p>'+('正文内容'.repeat(700))+'</p>',cards:[]};
    fetchQueue=[scoreJson2,secJ,revJ2];
    await AI.runOptimize();
    const stBig=AI._test.state();
    const dbgB=JSON.stringify(stBig.lastOptDebug);
    check('v17.14 大文档直接按节优化并出建议', stBig.pendingDiffs&&stBig.pendingDiffs.items.length===1&&dbgB.indexOf('fullDocSkipped')>=0&&dbgB.indexOf('fullDocParseFail')<0, dbgB.slice(0,300));

  }catch(e){
    console.error('UNEXPECTED ERROR', e && e.stack || e);
    results.push({name:'脚本无异常',pass:false,detail:String(e&&e.stack||e)});
  }
  const failed=results.filter(r=>!r.pass).length;
  console.log('\n共 '+results.length+' 项断言，失败 '+failed+' 项');
  process.exit(failed?1:0);
})();
