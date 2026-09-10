/* ============ SVG 图标常量（替代 emoji，线性描边风格） ============ */
var ICONS={
  brain:'<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/></svg>',
  check:'<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12.5l5 5L20 6.5"/></svg>',
  checkL:'<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12.5l5 5L20 6.5"/></svg>',
  x:'<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  warn:'<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3 2 21h20L12 3Z"/><path d="M12 10v4"/><path d="M12 17.5v.5"/></svg>',
  bolt:'<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></svg>',
  robot:'<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="8" width="16" height="12" rx="2"/><path d="M12 8V4"/><circle cx="12" cy="3" r="1.5"/><circle cx="9" cy="13" r="1"/><circle cx="15" cy="13" r="1"/><path d="M8 17h8"/></svg>',
  clipboard:'<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V3h6v1"/><path d="M9 9h6M9 13h6M9 17h4"/></svg>',
  star:'<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l2.7 5.6 6.1.8-4.5 4.2 1.2 6-5.5-3-5.5 3 1.2-6L3.2 9.4l6.1-.8L12 3Z"/></svg>',
  starL:'<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l2.7 5.6 6.1.8-4.5 4.2 1.2 6-5.5-3-5.5 3 1.2-6L3.2 9.4l6.1-.8L12 3Z"/></svg>',
  up:'<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5"/><path d="M5 12l7-7 7 7"/></svg>',
  upL:'<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5"/><path d="M5 12l7-7 7 7"/></svg>',
  refresh:'<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a9 9 0 1 1-2.6-6.4"/><path d="M21 3v6h-6"/></svg>',
  upload:'<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M17 8l-5-5-5 5"/><path d="M12 3v12"/></svg>',
  pencil:'<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3Z"/></svg>',
  target:'<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/></svg>',
  gear:'<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.2a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.2a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.2a1.7 1.7 0 0 0 1 1.5h.1a1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9v.1a1.7 1.7 0 0 0 1.5 1h.2a2 2 0 1 1 0 4h-.2a1.7 1.7 0 0 0-1.5 1Z"/></svg>',
  flask:'<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 2v6L4.5 18.5A2 2 0 0 0 6.3 21.5h11.4a2 2 0 0 0 1.8-3L14 8V2"/><path d="M8.5 2h7"/><path d="M7 15h10"/></svg>',
  palette:'<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21a9 9 0 1 1 9-9c0 2-1.5 3-3 3h-2a2 2 0 0 0-1.5 3.3c.4.5.5 1 .5 1.7a2 2 0 0 1-3 1Z"/><circle cx="7.5" cy="11.5" r="1"/><circle cx="11" cy="7.5" r="1"/><circle cx="16" cy="8.5" r="1"/></svg>',
  cal:'<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>',
  ban:'<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M5.6 5.6l12.8 12.8"/></svg>'
};
/* 思考块自动滚动到底：流式思考内容实时下翻 */
function aiScrollThinkBody(){
  var els=document.querySelectorAll('.ai-think[open] .ai-think-body');
  for(var i=0;i<els.length;i++){els[i].scrollTop=els[i].scrollHeight;}
}
/* ============ 默认值（基线 rubric） ============ */
const STORAGE_KEY='prdKanbanStateV3';

const DEFAULT_FRAMEWORK=[
  {id:'meta',title:'文档变更历史',type:'table',required:true,weight:1,template:''},
  {id:'purpose',title:'目的',type:'text',required:true,weight:2,template:''},
  {id:'scope',title:'适用范围',type:'text',required:true,weight:1,template:''},
  {id:'def',title:'定义',type:'table',required:true,weight:1,template:''},
  {id:'prodinfo',title:'产品信息与目标',type:'text',required:true,weight:2,template:''},
  {id:'users',title:'使用者需求',type:'users',required:true,weight:2,template:''},
  {id:'feat',title:'功能需求',type:'feat',required:true,weight:3,template:''},
  {id:'nfr',title:'非功能需求',type:'text',required:true,weight:2,template:''},
  {id:'selftest',title:'自测',type:'text',required:true,weight:2,template:''},
  {id:'track',title:'埋点',type:'table',required:true,weight:1,template:''},
  {id:'ui',title:'界面',type:'text',required:true,weight:1,template:''},
  {id:'accept',title:'验收',type:'accept',required:true,weight:3,template:''},
  {id:'launch',title:'上线',type:'timeline',required:true,weight:1,template:''},
  {id:'other',title:'其他',type:'text',required:false,weight:0.5,template:''}
];

// 框架预设（新建项目时可快速选择）
const DEFAULT_PRESETS=[
  {id:'default',name:'标准 PRD 14 节',framework:deep(DEFAULT_FRAMEWORK)},
  {id:'minimal',name:'精简 7 节',framework:[
    {id:'purpose',title:'目的',type:'text',required:true,weight:2,template:''},
    {id:'scope',title:'范围',type:'text',required:true,weight:1,template:''},
    {id:'feat',title:'功能需求',type:'feat',required:true,weight:3,template:''},
    {id:'nfr',title:'非功能需求',type:'text',required:true,weight:1,template:''},
    {id:'accept',title:'验收标准',type:'accept',required:true,weight:2,template:''},
    {id:'launch',title:'上线计划',type:'timeline',required:true,weight:1,template:''},
    {id:'other',title:'其他',type:'text',required:false,weight:0.5,template:''}
  ]}
];

// 判分规则（v16.3 起为内置基线，不再开放自定义）。level: red/yellow。scope: 兼容字段（'all' 由 hitsFor 内部按类型/标题定位）
// v16.3：内置判分基线固定为 12 条（不再开放自定义规则）。
// 定位策略：按「节类型 / 标题关键词」匹配，不再写死节 id，自定义框架、改过标题的文档也能命中。
// 人工审核通道：下钻面板「忽略/已订正」+ 节色块「手动改色」均保留。
const DEFAULT_RULES=[
  {id:'R-SPEC-01',dim:'结构完整性',desc:'必填节内容为空',level:'red',weight:3,enabled:true,scope:'required'},
  {id:'R-SPEC-02',dim:'规范合规',desc:'功能需求行缺名称',level:'yellow',weight:1,enabled:true,scope:'all'},
  {id:'R-SPEC-03',dim:'规范合规',desc:'功能需求行缺优先级或优先级值非法（P0~P4）',level:'yellow',weight:1,enabled:true,scope:'all'},
  {id:'R-CONS-01',dim:'一致性',desc:'功能需求与验收失衡（有功能无验收 / 有验收无功能）',level:'red',weight:3,enabled:true,scope:'all'},
  {id:'R-CONS-03',dim:'一致性',desc:'承诺指标含数字阈值但验收/自测无对应验证',level:'yellow',weight:2,enabled:true,scope:'all'},
  {id:'R-CONS-04',dim:'一致性',desc:'埋点未被功能/界面提及',level:'yellow',weight:2,enabled:true,scope:'all'},
  {id:'R-TEST-01',dim:'可测性',desc:'验收项无可量化标准',level:'yellow',weight:2,enabled:true,scope:'all'},
  {id:'R-TEST-02',dim:'可测性',desc:'含模糊形容词但无量化指标',level:'yellow',weight:1,enabled:true,scope:'all'},
  {id:'R-TEST-05',dim:'可测性',desc:'验收项标「不通过」',level:'red',weight:3,enabled:true,scope:'all'},
  {id:'R-RISK-01',dim:'风险冗余',desc:'P0 占比超阈值',level:'yellow',weight:2,enabled:true,scope:'all',threshold:0.5},
  {id:'R-RISK-02',dim:'风险冗余',desc:'功能需求条数异常高（范围蔓延）',level:'yellow',weight:2,enabled:true,scope:'all',threshold:40},
  {id:'R-RISK-03',dim:'风险冗余',desc:'残留占位符（TODO/待补充/【】/xxx）',level:'yellow',weight:2,enabled:true,scope:'all'},
  {id:'R-XCONS-01',dim:'一致性',desc:'功能与验收、测试点的跨章节追溯缺口',level:'yellow',weight:2,enabled:true,scope:'all'},
  {id:'R-XCONS-02',dim:'一致性',desc:'目标与埋点的跨章节追溯缺口',level:'yellow',weight:2,enabled:true,scope:'all'},
  {id:'R-XCONS-03',dim:'一致性',desc:'角色、权限或状态表述存在冲突',level:'yellow',weight:2,enabled:true,scope:'all'},
  {id:'R-XCONS-04',dim:'风险冗余',desc:'外部依赖未在风险与对策中说明',level:'yellow',weight:2,enabled:true,scope:'all'},
  {id:'R-XCONS-05',dim:'风险冗余',desc:'范围蔓延：第一版范围缺少明确取舍',level:'yellow',weight:1,enabled:true,scope:'all'}
];

/* ============ 状态 ============ */
var STATE=null;
let editing=true; // 默认进入编辑态，确保验收/功能点/用户故事等控件始终可点（PM 核心操作）
let dirty=false; // 编辑态下是否有未保存改动；save() 成功后置 false；非编辑态恒 false
function markDirty(){ if(editing) dirty=true; }
function clearDirty(){ dirty=false; }
let drillOpen=null; // sectionId
let undoStack=[]; const UNDO_MAX=40;
let lastEdEl=null; // 顶栏「插入」定位：最近点击/聚焦的可编辑区
const MUT=new Set(['addfeat','delfeat','addaccept','delaccept','adduser','deluser','accstatus','doOverride','ov-red','ov-yellow','ov-green','ov-clear','corr','setdensity','resetframework','fw-title','fw-type','fw-req','fw-w','fw-up','fw-down','fw-ins','fw-del','fw-add','fw-autosort','doRename','reset','doPaste','sample']); // 项目级操作（新建/切换/删除/回主页）不入撤销栈，避免撤销『删掉』当前项目
function pushUndo(){try{const s=JSON.stringify(STATE);if(undoStack.length&&undoStack[undoStack.length-1]===s)return;undoStack.push(s);if(undoStack.length>UNDO_MAX)undoStack.shift();}catch(e){}updateUndoBtn();}
// v18.9：单步撤销（成熟方案——时间+位置合并，对齐 ProseMirror / TipTap / Loro / CodeMirror 的 history grouping）
// 连续「同目标 + 合并窗口内」的输入合并为一个撤销单元；停顿超过窗口 / 换目标 / 重新聚焦则开新单元。
// 效果：一次撤销只回退「最近一次操作」（一个输入突发或一次离散改动），而不是把整段编辑会话全部回退。
const UNDO_GROUP_DELAY=500;
let _undoGrpT=0, _undoGrpKey='';
function undoGroupKey(el){
  if(!el||!el.dataset)return '';
  if(el.dataset.act==='tcell')return 'tcell:'+el.dataset.sec+':'+el.dataset.row+':'+el.dataset.col;
  if(el.dataset.act==='editable')return 'ed:'+el.dataset.id;
  if(el.dataset.act==='cardbody'||(el.classList&&el.classList.contains('sub-card-body')))return 'cb:'+el.dataset.sec+':'+el.dataset.idx;
  return '';
}
function pushUndoGroup(el){
  const now=Date.now();const k=undoGroupKey(el);
  // 同目标且在合并窗口内：并入当前单元，不再快照（单元起点快照即「操作前」状态）
  if(k && k===_undoGrpKey && now-_undoGrpT<UNDO_GROUP_DELAY)return;
  pushUndo();_undoGrpT=now;_undoGrpKey=k;
}
function undo(){
  if(!undoStack.length){toast('没有可撤销的操作');return;}
  const curId=STATE.activeProjectId;
  let snap=null;
  while(undoStack.length){
    try{
      const st=JSON.parse(undoStack.pop());
      // 只恢复仍包含当前项目的快照：历史残留的旧快照若已不含当前项目则跳过，绝不把当前项目"撤销"掉
      if(!curId||(st.projects||[]).some(p=>p.id===curId)){snap=st;break;}
    }catch(e){}
  }
  if(!snap){toast('没有可撤销的编辑操作');return;}
  STATE=snap;
  try{document.body.setAttribute('data-density',STATE.density||'standard');}catch(e){}
  refreshData();save();render();toast('已撤销');
}

function uid(){return 'x'+Math.random().toString(36).slice(2,9);}
function deep(o){return JSON.parse(JSON.stringify(o));}
function esc(s){return (s==null?'':String(s)).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}
function toast(msg){const t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');clearTimeout(t._t);t._t=setTimeout(()=>t.classList.remove('show'),1900);}

function blankData(framework){const d={};(framework||DEFAULT_FRAMEWORK).forEach(s=>{d[s.id]=sectionEmpty(s.type,s.id);});return d;}
function sectionEmpty(type,id){
  const base={cards:[]}; // 小卡片：每个节通用，默认无
  if(type==='feat'||type==='accept'||type==='users')return Object.assign({items:[]},base);
  if(type==='table'){
    // 框架节类型为「table」的，按节 id 给一组默认表头（用户可改、删、加）
    const presets={
      meta:['版本','更改内容','作者','日期'],
      def:['术语','定义'],
      track:['事件','触发条件','参数','上报方式']
    };
    const heads=(id&&presets[id])?presets[id]:['列1','列2'];
    return Object.assign({rows:[{cells:heads.slice()},{cells:heads.map(()=>'')}]},base);
  }
  return base; // text/timeline/cards 等 → {cards:[]}
}
// 「其他」兜底节：导入时放不进设定框架的内容自动归到这里；可被用户删除
function catchAllId(){const s=(STATE.framework||[]).find(x=>x.id==='other'||(x.title||'').indexOf('其他')===0);return s?s.id:null;}
function ensureCatchAll(fw){fw=fw||STATE.framework;if(!fw)return null;let s=fw.find(x=>x.id==='other'||(x.title||'').indexOf('其他')===0);if(!s){s={id:'other',title:'其他',type:'text',required:false,weight:0.5,auto:true};fw.push(s);}return s.id;}
function ensureCatchAllAll(){
  const id=ensureCatchAll(STATE.framework);
  const p=currentProj();
  if(p){
    const pid=ensureCatchAll(p.framework);
    if(!p.data[pid])p.data[pid]=sectionEmpty((p.framework.find(s=>s.id===pid)||{}).type||'text',pid);
  }
  return id;
}
function isCatchAll(id){return id===catchAllId();}

function seedState(){
  return {version:6,density:'standard',seenWizard:false,projects:[],activeProjectId:null,groups:[],groupOpen:{},ruleSet:deep(DEFAULT_RULES),framework:deep(DEFAULT_FRAMEWORK),frameworkPresets:deep(DEFAULT_PRESETS)};
}
function load(){
  try{const raw=localStorage.getItem(STORAGE_KEY);if(raw){STATE=JSON.parse(raw);} }catch(e){}
  if(!STATE||!STATE.projects){STATE=seedState();}
  // v3→v4 / v4→v5 迁移：缺则补默认、绝不删字段（旧用户无感升级、数据不丢）
  if(!STATE.version||STATE.version<4)STATE.version=4;
  if(!STATE.version||STATE.version<5)STATE.version=5;
  // v16.3 迁移：规则库冻结为 12 条内置基线；旧版自定义规则/改动不再保留（人工审核走忽略/改色通道）
  if(!STATE.version||STATE.version<6){STATE.version=6;STATE.ruleSet=deep(DEFAULT_RULES);}
  if(!STATE.density)STATE.density='standard';
  if(!STATE.groups)STATE.groups=[];
  if(!STATE.groupOpen)STATE.groupOpen={};
  STATE.seenWizard=!!STATE.seenWizard;
  if(!STATE.frameworkPresets||!STATE.frameworkPresets.length)STATE.frameworkPresets=deep(DEFAULT_PRESETS);
  // v17.23：移除已废弃的「带小卡片结构（8 节）」默认框架（老用户存储里也清掉；已用它建过的项目不受影响）
  STATE.frameworkPresets=(STATE.frameworkPresets||[]).filter(p=>p&&p.id!=='cards');
  if(!STATE.framework||!STATE.framework.length)STATE.framework=deep(DEFAULT_FRAMEWORK);
  STATE.framework.forEach(f=>{if(f.template===undefined)f.template='';});
  if(!STATE.ruleSet)STATE.ruleSet=deep(DEFAULT_RULES);
  // 新增内置规则只补齐缺失项，不覆盖既有项目的启用状态或人工处理记录。
  DEFAULT_RULES.forEach(function(rule){if(!STATE.ruleSet.some(function(old){return old&&old.id===rule.id;}))STATE.ruleSet.push(deep(rule));});
  STATE.ruleSet=STATE.ruleSet.filter(r=>!(r&&r.id&&r.id.indexOf('R-TRACE')===0)); // 移除可追溯维度（用户不需要）
  STATE.projects.forEach(p=>{
    if(!p.overrides)p.overrides={};if(!p.corrections)p.corrections={};
    if(!p.framework||!p.framework.length)p.framework=deep(STATE.framework);
    if(!p.data)p.data=blankData(p.framework);
    const fwArr=p.framework||STATE.framework;
    fwArr.forEach(fw=>{
      if(fw.template===undefined)fw.template='';
      const d=p.data[fw.id];if(!d)return;
      if(!d.links)d.links={reqIds:[],acceptIds:[]};
      if(fw.type==='accept'&&Array.isArray(d.items))d.items.forEach(it=>{if(it){if(it.status===undefined){it.status=(it.passfail==='通过'?'pass':it.passfail==='不通过'?'fail':'na');}delete it.passfail;if(!it.id)it.id=uid();}});
      // 表格节迁移：旧版本只有 c.html，现在给一份默认 rows（仅在确实空时才补，避免破坏已有内容）
      if(fw.type==='table'){
        if(!Array.isArray(d.rows)||!d.rows.length){
          if(!d.cards||!d.cards.length){
            const htmlEmpty=!(d.html&&d.html.replace(/<[^>]+>/g,'').trim());
            if(htmlEmpty){const seed=sectionEmpty('table',fw.id);d.rows=seed.rows;}
          }
        }
      }
    });
  });
  // 迁移：cards 节类型 → text（小卡片改为每个节通用的 .cards 字段，不依赖特殊类型）
  const migrateFw=arr=>{(arr||[]).forEach(fw=>{if(fw&&fw.type==='cards')fw.type='text';});};
  migrateFw(STATE.framework);
  (STATE.frameworkPresets||[]).forEach(pr=>migrateFw(pr.framework));
  STATE.projects.forEach(p=>{
    migrateFw(p.framework);
    Object.keys(p.data||{}).forEach(k=>{
      const d=p.data[k];if(!d)return;
      if(!d.cards)d.cards=[];
      if(d.type==='cards'){const items=d.items||[];d.type='text';d.html='';d.cards=items;delete d.items;}
    });
  });
  // 让全局 STATE.framework 与当前激活项目的框架保持一致，避免切换项目后框架错位
  const active=STATE.projects.find(x=>x.id===STATE.activeProjectId);
  if(active&&active.framework&&active.framework.length)STATE.framework=deep(active.framework);
  if(STATE.activeProjectId && !STATE.projects.find(x=>x.id===STATE.activeProjectId))STATE.activeProjectId=null;
  document.body.setAttribute('data-density',STATE.density||'standard');
}
let saveFailed=false;
function save(){
  const p=currentProj();if(p){p.data=DATA;p.updatedAt=Date.now();}
  try{
    const serialized=JSON.stringify(STATE);updateStorageAdvice(serialized);
    localStorage.setItem(STORAGE_KEY,serialized);
    if(saveFailed){saveFailed=false;showStorageWarn(false);}
    clearDirty();
  }catch(e){
    // v16.2 修复：localStorage 写满（图片内联很容易超 ~5MB）时绝不静默失败——
    // 明确告警并引导导出备份，保住"当前页面内"的数据
    saveFailed=true;markDirty();
    showStorageWarn(true);
  }
}
function showStorageWarn(on){
  const w=document.getElementById('storageWarn');if(!w)return;
  w.style.display=on?'flex':'none';
}
function updateStorageAdvice(serialized){
  const w=document.getElementById('storageAdvice'),txt=document.getElementById('storageAdviceText');if(!w||!txt)return;
  const bytes=(serialized==null?JSON.stringify(STATE||{}):serialized).length*2;
  // localStorage 通常约 5 MB；预留安全边际，避免图片内联后一次保存直接失败。
  const threshold=3.5*1024*1024;
  if(bytes>=threshold){
    const mb=(bytes/1024/1024).toFixed(1);
    txt.textContent='本地数据约 '+mb+' MB，已接近浏览器常见存储上限。请先导出备份；内嵌图片建议压缩后再插入（单张尽量不超过 1 MB）。';
    w.style.display='flex';
  }else w.style.display='none';
}
function currentProj(){return STATE.projects.find(x=>x.id===STATE.activeProjectId)||null;}
let DATA={};
function refreshData(){const p=currentProj();DATA=p?p.data:{};}

/* ============ 内容工具 ============ */
function plain(id){
  const c=DATA[id];if(!c)return'';
  let t='';
  if(c.items&&c.items.length){
    // v16.3：按字段形状识别功能/验收/用户故事，不再依赖节 id
    t=c.items.map(i=>{
      if(i&&i.name!=null)return (i.name||'')+' '+(i.desc||'')+' '+(i.priority||'')+' '+(i.status||'');
      if(i&&i.text!=null)return (i.text||'');
      if(i&&i.role!=null)return '作为'+(i.role||'')+'我希望'+(i.want||'')+'以便'+(i.soThat||'');
      return '';
    }).join('\n');
  }else{t=(c.html||'');}
  // v16.3：表格节 rows 纳入判定（此前表格节对规则完全不可见）
  if(c.rows&&c.rows.length){t+=' '+(c.rows||[]).map(r=>(r.cells||[]).map(v=>String(v==null?'':v)).join(' ')).join(' ');}
  t+=' '+(c.cards||[]).map(i=>(i.title||'')+' '+htmlToText(i.html||'')).join(' ');
  return t.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
}
function isEmpty(id){
  const c=DATA[id];if(!c)return true;
  if(c.items&&c.items.length)return false;
  if(c.cards&&c.cards.length)return false;
  // v16.3：表格节按 rows 判定（表头之后有任一非空单元格即视为有内容）
  if(c.rows&&c.rows.length>1){
    const body=c.rows.slice(1);
    if(body.some(r=>(r.cells||[]).some(v=>String(v==null?'':v).trim())))return false;
  }
  return !(c.html&&c.html.replace(/<[^>]+>/g,'').trim());
}

/* ============ 体检引擎 ============ */
function hitsFor(rule){
  const out=[];const id=rule.id;
  // v16.3：按「节类型 / 标题关键词」定位，兼容自定义框架与改名节；表格节内容（rows）也会纳入判定
  const secsOfType=t=>STATE.framework.filter(s=>s.type===t);
  const secByTitle=kws=>STATE.framework.find(s=>kws.some(k=>s.title.indexOf(k)>=0));
  const secData=s=>DATA[s.id]||{html:'',items:[],cards:[],rows:[]};
  const textOfType=t=>secsOfType(t).map(s=>plain(s.id)).join(' ');
  const textByTitle=kws=>STATE.framework.filter(s=>kws.some(k=>s.title.indexOf(k)>=0)).map(s=>plain(s.id)).join(' ');
  try{
  switch(id){
    case 'R-SPEC-01':{ // 必填节缺失（红）
      STATE.framework.forEach(s=>{if(s.required && isEmpty(s.id))out.push({sectionId:s.id,ruleId:id,level:rule.level,snippet:'必填节「'+s.title+'」内容为空',advice:'补充该节内容，或若不需则在框架里取消必填'});});
      break;}
    case 'R-SPEC-02':{ // 功能行缺名称（黄）
      secsOfType('feat').forEach(s=>{(secData(s).items||[]).forEach((it,i)=>{if(!it.name||!it.name.trim())out.push({sectionId:s.id,ruleId:id,level:rule.level,snippet:'「'+s.title+'」第'+(i+1)+'行功能点名称为空',advice:'填写功能点名称'});});});
      break;}
    case 'R-SPEC-03':{ // 缺优先级或值非法（黄）
      secsOfType('feat').forEach(s=>{(secData(s).items||[]).forEach((it,i)=>{const pr=(it.priority||'').trim();if(!pr)out.push({sectionId:s.id,ruleId:id,level:rule.level,snippet:'「'+s.title+'」第'+(i+1)+'行缺优先级',advice:'补全优先级 P0~P4'});else if(!['P0','P1','P2','P3','P4'].includes(pr))out.push({sectionId:s.id,ruleId:id,level:rule.level,snippet:'「'+s.title+'」第'+(i+1)+'行优先级「'+pr+'」不在 {P0,P1,P2,P3,P4}',advice:'改为 P0~P4'});});});
      break;}
    case 'R-CONS-01':{ // 功能↔验收失衡（红，双向合并）
      const featSecs=secsOfType('feat'),acceptSecs=secsOfType('accept');
      const hasFeat=featSecs.some(s=>(secData(s).items||[]).length>0);
      const hasAccept=acceptSecs.some(s=>(secData(s).items||[]).length>0);
      if(hasFeat&&!hasAccept&&acceptSecs.length)out.push({sectionId:acceptSecs[0].id,ruleId:id,level:rule.level,snippet:'功能需求有内容，但验收为空',advice:'为每条功能补充可勾选验收项'});
      if(hasAccept&&!hasFeat&&featSecs.length)out.push({sectionId:featSecs[0].id,ruleId:id,level:rule.level,snippet:'验收需求有内容，但功能需求为空',advice:'补充对应功能需求'});
      break;}
    case 'R-CONS-03':{ // 承诺指标无验证（黄）
      const targets=STATE.framework.filter(s=>/目的|背景|目标|概述|产品信息|产品概述/.test(s.title));
      const verify=textOfType('accept')+' '+textByTitle(['自测','自检']);
      targets.forEach(s=>{
        const t=plain(s.id);if(isEmpty(s.id))return;
        if(/(\d+(?:\.\d+)?\s*(?:%|秒|毫秒|ms|分钟|小时|次|帧|fps)|[≤≥<>]\s*\d+)/i.test(t) && !/\d/.test(verify))out.push({sectionId:s.id,ruleId:id,level:rule.level,snippet:'承诺指标含数字阈值但验收/自测无对应验证：'+(t.slice(0,50)),advice:'在验收/自测中补充该指标的验证方法与阈值'});
      });
      break;}
    case 'R-CONS-04':{ // 埋点未被提及（黄；表格埋点节同样生效）
      const trk=secByTitle(['埋点','打点','数据采集','事件追踪']);
      if(trk&&!isEmpty(trk.id)){
        const f=textOfType('feat')+' '+textByTitle(['界面','交互','UI']);
        if(!/埋点|事件|track|event/i.test(f))out.push({sectionId:trk.id,ruleId:id,level:rule.level,snippet:'「'+trk.title+'」存在，但功能/界面未提及埋点',advice:'在功能或界面节说明各埋点事件的触发与用途'});
      }
      break;}
    case 'R-TEST-01':{ // 验收项无可量化标准（黄）
      secsOfType('accept').forEach(s=>{(secData(s).items||[]).forEach((it,i)=>{const tx=(it.text||'');if(!/(\d|%|秒|毫秒|次|个|条|≤|≥|<|>)/.test(tx) && /(支持|优化|提升|完善|增强|保证|实现)/.test(tx))out.push({sectionId:s.id,ruleId:id,level:rule.level,snippet:'「'+s.title+'」第'+(i+1)+'项无可量化标准：'+(tx.slice(0,50)),advice:'补充量化指标，如响应≤1.5s、覆盖率≥95%'});});});
      break;}
    case 'R-TEST-02':{ // 模糊词无指标（黄，逐句判定减少误报）
      const targets=STATE.framework.filter(s=>s.type==='feat'||s.type==='accept'||/非功能|性能|安全|稳定性/.test(s.title));
      targets.forEach(s=>{const t=plain(s.id);if(isEmpty(s.id))return;t.split(/[。！？\n]/).forEach(sent=>{if(/(流畅|友好|高效|易用|极简|智能)/.test(sent)&&!/\d/.test(sent))out.push({sectionId:s.id,ruleId:id,level:rule.level,snippet:'含模糊形容词无指标：'+(sent.trim().slice(0,50)),advice:'用可量化指标替换模糊词'});});});
      break;}
    case 'R-TEST-05':{ // 验收项不通过（红；na 待定不再误报为黄）
      secsOfType('accept').forEach(s=>{(secData(s).items||[]).forEach((it,i)=>{if((it.status||'na')==='fail')out.push({sectionId:s.id,ruleId:id,level:'red',snippet:'「'+s.title+'」第'+(i+1)+'项验收「不通过」：'+(it.text||'').slice(0,40),advice:'修复后重新验收，否则该节视为风险'});});});
      break;}
    case 'R-RISK-01':{ // P0 占比（黄）
      const featSecs=secsOfType('feat');
      const all=featSecs.map(s=>secData(s).items||[]).reduce((a,b)=>a.concat(b),[]);
      if(all.length){const p0=all.filter(i=>(i.priority||'')==='P0').length;const r=p0/all.length;if(r>rule.threshold)out.push({sectionId:featSecs[0].id,ruleId:id,level:rule.level,snippet:'P0 占比 '+Math.round(r*100)+'% 超过阈值 '+Math.round(rule.threshold*100)+'%',advice:'重新评估优先级，降低 P0 数量'});}
      break;}
    case 'R-RISK-02':{ // 功能条数（黄）
      const featSecs=secsOfType('feat');
      const n=featSecs.map(s=>secData(s).items||[]).reduce((a,b)=>a.concat(b),[]).length;
      if(n>rule.threshold)out.push({sectionId:featSecs[0].id,ruleId:id,level:rule.level,snippet:'功能需求 '+n+' 项，超过阈值 '+rule.threshold,advice:'拆分需求，控制范围蔓延'});
      break;}
    case 'R-RISK-03':{ // 残留占位符（黄）
      STATE.framework.forEach(s=>{const t=plain(s.id);if(!isEmpty(s.id) && /(TODO|待补充|待定|【】|xxx|XXX|\?\?\?)/.test(t))out.push({sectionId:s.id,ruleId:id,level:rule.level,snippet:'含残留占位符：'+(t.slice(0,50)),advice:'补全占位内容或删除占位符'});});
      break;}
    case 'R-XCONS-01':{ // 功能 → 验收 → 测试：按功能逐条给出可追溯缺口
      const tr=traceabilityReport();
      tr.rows.forEach(function(row){
        const miss=[];if(!row.accept.length)miss.push('验收');if(!row.test.length)miss.push('测试点/自测');
        if(miss.length)out.push({sectionId:(tr.sections.accept||tr.sections.test||{}).id||row.feature&&STATE.framework.find(function(s){return s.type==='feat';}).id,ruleId:id,level:String(row.feature&&row.feature.priority||'').toUpperCase()==='P0'?'red':rule.level,snippet:'功能「'+String(row.feature&&row.feature.name||'').slice(0,40)+'」未关联'+miss.join('与'),advice:'为该功能补充可匹配的'+miss.join('、')+'，并以功能名称或共同关键词建立追溯'});
      });
      break;}
    case 'R-XCONS-02':{ // 目标 → 埋点：只在目标已写明时检查，避免空文档误报
      const goal=STATE.framework.find(function(s){return /目的|背景|目标|概述|产品信息|产品概述/.test(s.title)&&!isEmpty(s.id);});
      const tr=traceabilityReport(),track=tr.sections.track;
      if(goal&&(!track||isEmpty(track.id)))out.push({sectionId:goal.id,ruleId:id,level:rule.level,snippet:'目标已定义，但未找到可关联的埋点/数据采集',advice:'补充至少一个衡量目标是否达成的事件、指标或数据采集方式'});
      break;}
    case 'R-XCONS-03':{ // 仅报告明确互斥的表述，不把正常的多角色文档误判为冲突
      const all=STATE.framework.map(function(s){return plain(s.id);}).join(' ');
      const anchor=STATE.framework.find(function(s){return /用户|权限|功能|流程|状态/.test(s.title);});
      if(/(?:访客|游客)/.test(all)&&/(?:可编辑|可以编辑|允许编辑|可删除|可以删除)/.test(all)&&!/(?:访客[^。；\n]{0,20}(?:只读|不可编辑|无编辑权限)|(?:只读|不可编辑|无编辑权限)[^。；\n]{0,20}(?:访客|游客))/.test(all))out.push({sectionId:(anchor||{}).id||null,ruleId:id,level:rule.level,snippet:'出现“访客/游客”与“可编辑或删除”，但未说明权限边界',advice:'明确访客是否只读、哪些角色可编辑/删除，以及无权限时的反馈'});
      if(/(?:无需登录|免登录)/.test(all)&&/(?:登录后|登录才可|必须登录)/.test(all))out.push({sectionId:(anchor||{}).id||null,ruleId:id,level:rule.level,snippet:'同时出现“无需登录/免登录”与“必须登录”',advice:'区分可免登录浏览的范围与必须登录的操作，写明状态转换'});
      break;}
    case 'R-XCONS-04':{ // 发现外部依赖时，要求有风险/对策承接
      const dep=STATE.framework.find(function(s){return /依赖|第三方|接口|支付|地图|短信/.test(plain(s.id));});
      const risk=STATE.framework.find(function(s){return /风险|对策|依赖/.test(s.title)&&!isEmpty(s.id);});
      if(dep&&!risk)out.push({sectionId:dep.id,ruleId:id,level:rule.level,snippet:'检测到第三方或外部依赖，但未找到风险与对策说明',advice:'说明依赖方、失败影响、降级/重试方案和负责人'});
      break;}
    case 'R-XCONS-05':{ // 需要做很多事却没有 MVP 取舍，才提示范围边界；条数异常仍由 R-RISK-02 覆盖
      const featSecs=secsOfType('feat'),n=featSecs.map(function(s){return (secData(s).items||[]).length;}).reduce(function(a,b){return a+b;},0);
      const scope=STATE.framework.find(function(s){return /范围|边界|目标/.test(s.title);});
      const scopeText=scope?plain(scope.id):'';
      if(n>=8&&(!scopeText||!/(?:第一版|MVP|暂不|不做|不支持|范围外|后续)/i.test(scopeText)))out.push({sectionId:(scope||featSecs[0]||{}).id||null,ruleId:id,level:rule.level,snippet:'当前有 '+n+' 个功能点，但第一版范围未写明做与不做的取舍',advice:'在范围节明确 MVP、暂不做事项和后续版本边界，防止范围蔓延'});
      break;}
    default:{
      // v16.2 修复：自定义规则此前仅存 keyword 却从不读取，是"完全不生效"的死功能。
      // 现在支持两种写法：1) 关键词用 | 分隔（如 尽量|最好）；2) /正则/ 语法（如 /TODO|待定/i）。
      const kw=(rule&&rule.keyword||'').trim();
      if(!kw)break;
      let re=null;
      try{
        const m=kw.match(/^\/(.+)\/([a-z]*)$/i);
        re=m?new RegExp(m[1],m[2]||'i'):new RegExp(kw.split('|').map(s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|'),'i');
      }catch(e){re=null;}
      if(!re)break;
      // 旧数据兼容：scope 曾把「全部节」存成 ['all']，这里与字符串 'all' 等价
      const scopes=Array.isArray(rule.scope)?rule.scope:(rule.scope==='all'||rule.scope==='required'?null:[rule.scope]);
      const scopeAll=Array.isArray(scopes)&&scopes.length===1&&scopes[0]==='all';
      STATE.framework.forEach(s=>{
        if(rule.scope==='required'&&!s.required)return;
        if(scopes&&!scopeAll&&!scopes.includes(s.id))return;
        if(isEmpty(s.id))return;
        const t=plain(s.id);
        re.lastIndex=0;
        if(re.test(t))out.push({sectionId:s.id,ruleId:id,level:rule.level||'yellow',dim:rule.dim||'自定义',snippet:'自定义规则命中「'+(rule.desc||kw)+'」',advice:'按规则要求补充或修改该节内容'});
      });
      break;
    }
  }
  }catch(e){/* 单条规则失败不影响整体 */}
  return out;
}

function runHealth(){
  const proj=currentProj();if(!proj)return null;
  const corrections=proj.corrections||{};
  const overrides=proj.overrides||{};
  const rawHits=[];
  STATE.ruleSet.filter(function(r){return r.enabled;}).forEach(function(r){
    var scopeOk=false;
    // v16.2 兼容旧数据：自定义规则曾把「全部节」存成 ['all']，这里视为 'all'
    const scopeAll=(r.scope==='all'||(Array.isArray(r.scope)&&r.scope.length===1&&r.scope[0]==='all'));
    if(scopeAll||r.scope==='required'){scopeOk=true;}
    else if(Array.isArray(r.scope)){scopeOk=true;}
    if(!scopeOk){return;}
    var hs=hitsFor(r);
    hs.forEach(function(h){
      if(r.scope==='required'||scopeAll){
        // required 节已由规则内部处理；['all'] 旧数据视为全部节放行
      } else if(Array.isArray(r.scope) && !r.scope.includes(h.sectionId)){
        return;
      }
      rawHits.push(h);
    });
  });
  // 应用"忽略"：从 rawHits 中剔除被忽略的命中
  const activeHits=rawHits.filter(h=>{const c=(corrections[h.sectionId]||{})[h.ruleId];return !(c&&(c.status==='ignored'||c.status==='done'));});
  // 每节引擎色 = 剩余命中最坏等级
  const bySec={};
  STATE.framework.forEach(s=>{bySec[s.id]={engine:'green',raw:[],active:[]};});
  rawHits.forEach(h=>{(bySec[h.sectionId]||(bySec[h.sectionId]={engine:'green',raw:[],active:[]})).raw.push(h);});
  activeHits.forEach(h=>{(bySec[h.sectionId]||(bySec[h.sectionId]={engine:'green',raw:[],active:[]})).active.push(h);});
  Object.values(bySec).forEach(b=>{const lv=b.active.some(h=>h.level==='red')?'red':b.active.some(h=>h.level==='yellow')?'yellow':'green';b.engine=lv;});
  // 生效色 = 覆盖 or 引擎
  const sec={};
  STATE.framework.forEach(s=>{const ov=overrides[s.id];sec[s.id]={engine:bySec[s.id].engine,raw:bySec[s.id].raw,active:bySec[s.id].active,override:null};if(ov&&ov.color){sec[s.id].override=ov;sec[s.id].effective=ov.color;}else{sec[s.id].effective=bySec[s.id].engine;}});
  // 指标
  const reqSec=STATE.framework.filter(s=>s.required);
  const total=reqSec.length||STATE.framework.length;
  let green=0,red=0,overrideCount=0,consistency=0;
  reqSec.forEach(s=>{const e=sec[s.id].effective;if(e==='green')green++;if(e==='red')red++;});
  STATE.framework.forEach(s=>{if(overrides[s.id])overrideCount++;});
  rawHits.forEach(h=>{if(h.dim==='一致性'||['R-CONS-01','R-CONS-03','R-CONS-04'].includes(h.ruleId))consistency++;});
  // v16.3：无必填节时不再恒为 0%（有红节=0，否则=100）
  const completion=reqSec.length?Math.round(green/total*100):(red>0?0:100);
  return {sec,metrics:{completion,risk:red,consistency,overrideCount,green,total},rawHits,activeHits};
}
let HEALTH=null;
let PREV_METRICS=null;

/* ============ 渲染 ============ */
// v18.8：撤销按钮可用态抽成独立函数——pushUndo() 末尾与 render() 都会调用，
// 保证正文/卡片打字（走 scheduleEditableSave→save，不触发 render）后按钮立即解除禁用
function updateUndoBtn(){const ub=document.getElementById('btnUndo');if(ub)ub.disabled=!undoStack.length;}
function render(){
  if(typeof closeTblMenu==='function')closeTblMenu(); // v16.4：重建时收起右键菜单
  updateUndoBtn();
  refreshData();
  if(!currentProj()){renderPlaceholder();renderSidebar();return;}
  HEALTH=runHealth();
  renderSidebar();
  renderSections();
}
function renderHero(){/* hero 已随 renderSections 的 heroHtml 写入，无需单独处理 */}
function renderPlaceholder(){
  const main=document.getElementById('main');
  main.innerHTML='<div class="placeholder wk">'+
    '<div class="wk-hero"><h2 class="wk-hi">你好，产品经理</h2>'+
    '<p class="wk-sub">今天想完成什么？让 AI 搭档帮你从想法一路推进到研发就绪。</p></div>'+
    '<div class="wk-entries">'+
      '<button class="wk-entry" data-act="wz-ai" data-genmode="design"><span class="wk-e-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10c1 1 2 2 1 3h6c-1-1 0-2 1-3a6 6 0 0 0-4-10z"/></svg></span><span class="wk-e-t">从想法开始</span><span class="wk-e-d">AI 逐步澄清用户、目标、范围与验收，再生成可确认的 PRD。</span><span class="wk-e-meta">约 5–10 分钟 · 适合只有模糊想法</span></button>'+
      '<button class="wk-entry" data-act="newproj"><span class="wk-e-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/><rect x="3" y="3" width="18" height="18" rx="3"/></svg></span><span class="wk-e-t">从空白开始</span><span class="wk-e-d">新建一个空项目，自选框架后从第一节开始自由编辑。</span><span class="wk-e-meta">约 1 分钟 · 适合已有清晰结构</span></button>'+
      '<button class="wk-entry" id="importEntry" data-act="import"><span class="wk-e-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/></svg></span><span class="wk-e-t">导入已有 PRD</span><span class="wk-e-d">导入 Markdown、文本或 Word，保留原文后检查章节与质量缺口。</span><span class="wk-e-meta">约 1–3 分钟 · 适合已有需求文档</span></button>'+
      '<button class="wk-entry" data-act="tpl"><span class="wk-e-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/></svg></span><span class="wk-e-t">使用场景模板</span><span class="wk-e-d">选择 Web、移动端、AI、硬件等常见场景，直接生成一个可填写的项目。</span><span class="wk-e-meta">约 2 分钟 · 适合不想从头搭结构</span></button>'+
    '</div>'+
    '</div>';
  const card=document.getElementById('importEntry');
  if(card){
    card.addEventListener('click',()=>document.getElementById('fileInput').click());
    ['dragenter','dragover'].forEach(ev=>card.addEventListener(ev,e=>{e.preventDefault();e.stopPropagation();card.classList.add('drag');}));
    ['dragleave','dragend'].forEach(ev=>card.addEventListener(ev,e=>{e.preventDefault();card.classList.remove('drag');}));
    card.addEventListener('drop',e=>{e.preventDefault();e.stopPropagation();card.classList.remove('drag');const f=e.dataTransfer&&e.dataTransfer.files&&e.dataTransfer.files[0];if(f)ingestFile(f);});
  }
  document.getElementById('sidebar').querySelector('#toc').innerHTML='';
}
function renderSidebar(){
  const proj=currentProj();
  const cp=document.getElementById('curProjName');
  if(cp){
    /* v19.15：原实现在无项目时把文案写成「PRD 项目」，但整条绑定的始终是 gohome
       （只做 activeProjectId=null），已在家时点击零反馈 —— 是一个会骗点击的死控件。
       现改为：有项目才显示（「← 返回主页」），无项目隐藏；主页的项目入口由下方
       「总览 / 项目」两个按钮承担，不再并列第三个入口。 */
    cp.textContent='← 返回主页';
    var pb=cp.parentNode;
    if(pb&&pb.classList&&pb.classList.contains('proj-bar'))pb.style.display=proj?'':'none';
  }
  const tp=document.getElementById('topbarProjName');if(tp)tp.textContent=proj?proj.name:'PMHub';
  updateHealthPill();
  const pp=document.getElementById('projPanel');
  const ptn=document.getElementById('ppToggleName');
  if(ptn)ptn.textContent=proj?proj.name:'项目';
  const groups=STATE.groups||[];
  const projItem=p=>{const ov=proj&&proj.id===p.id;return '<div class="pp-proj'+(ov?' active':'')+'" data-act="switchproj" data-id="'+p.id+'" draggable="true" title="左键切换 · 拖拽可移动/分组 · 右键更多">'+esc(p.name)+'</div>';};
  let html='';
  html+='<button class="pp-add pp-grp-add" data-act="grp-add" title="新建分组，用于收纳项目">＋ 新建分组</button>';
  groups.forEach(g=>{
    const items=STATE.projects.filter(p=>p.groupId===g.id);
    const open=STATE.groupOpen&&STATE.groupOpen[g.id];
    html+='<div class="pp-grp'+(open?' open':'')+'" data-gid="'+g.id+'">'+
      '<div class="pp-grp-hd" data-act="togglegroup" data-gid="'+g.id+'" title="点击展开/折叠 · 拖拽项目到此加入分组">'+
        '<span class="chev">▸</span><span class="gname">'+esc(g.name)+'</span><span class="gcnt">'+items.length+'</span>'+
        '<span class="pp-grp-ops">'+
          '<button data-act="grp-rename" data-gid="'+g.id+'" title="重命名分组"><svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3Z"/></svg></button>'+
          '<button data-act="grp-del" data-gid="'+g.id+'" class="gdel" title="删除分组（组内项目移回未分组）">×</button>'+
        '</span>'+
      '</div>'+
      '<div class="pp-grp-body"'+(open?'':' style="display:none"')+'>'+
        items.map(projItem).join('')+
      '</div></div>';
  });
  const ungrouped=STATE.projects.filter(p=>!p.groupId);
  if(ungrouped.length||!groups.length){
    html+='<div class="pp-ungrouped"><div class="pp-ungrouped-hd">未分组 <span class="gcnt">'+ungrouped.length+'</span></div>'+
      '<div class="pp-ungrouped-body">'+ungrouped.map(projItem).join('')+'</div></div>';
  }
  html+='<button class="pp-add" data-act="newproj">＋ 新建项目</button>';
  pp.innerHTML=html;
  if(pp.dataset.open==='1')pp.classList.add('open');
  pp.querySelectorAll('.pp-proj').forEach(el=>{
    el.addEventListener('contextmenu',e=>{e.preventDefault();openProjMenu(e.clientX,e.clientY,el.dataset.id);});
  });
  bindProjDrag();
}
function renderHero(){
  const main=document.getElementById('main');
  const cur=currentProj();
  const h=main.querySelector('.hero');if(!h)return;
}
function renderDashboard(){
  const m=HEALTH.metrics;
  const el=document.getElementById('main').querySelector('#dashboard');
  if(!el)return;
  const dprev=PREV_METRICS;
  const delta=(key,unit)=>{
    if(dprev==null)return '';
    const diff=m[key]-(dprev[key]||0);
    if(diff===0)return '<div class="card-delta flat">— 较上次持平</div>';
    const up=diff>0;
    return '<div class="card-delta '+(up?'up':'down')+'">'+(up?'▲ +':'▼ ')+Math.abs(diff)+unit+' 较上次</div>';
  };
  const compTag=m.completion>=80?'<span class="tag green">良好</span>':(m.completion>=60?'<span class="tag yellow">进行中</span>':'<span class="tag red">偏低</span>');
  const riskTag=m.risk>0?'<span class="tag red">有风险</span>':'<span class="tag green">安全</span>';
  const consTag=m.consistency>0?'<span class="tag yellow">'+m.consistency+' 项</span>':'<span class="tag green">一致</span>';
  const delivery=deliveryReadiness();

  let html='<div class="delivery-ready"><div class="delivery-ready-h"><b>交付就绪结论</b><span>'+delivery.blockerText+'</span></div><div class="delivery-ready-rows">'+delivery.rows.map(function(row){return '<div class="delivery-ready-row '+row.level+'"><b>'+row.title+'</b><span>'+row.text+'</span></div>';}).join('')+'</div></div>'+renderTraceability()+
    '<div class="card click" data-act="drillmetric" data-m="completion"><div class="k">完成度'+compTag+'</div><div class="v green">'+m.completion+'<small>% ('+m.green+'/'+m.total+')</small></div>'+delta('completion','%')+'</div>'+
    '<div class="card click" data-act="drillmetric" data-m="risk"><div class="k">风险数（红节）'+riskTag+'</div><div class="v red">'+m.risk+'</div>'+delta('risk')+'</div>'+
    '<div class="card click" data-act="drillmetric" data-m="consistency"><div class="k">一致性问题'+consTag+'</div><div class="v brand">'+m.consistency+'</div>'+delta('consistency')+'</div>';
  // 节健康度热力图（看板核心：一眼看清哪些节绿/黄/红）
  html+='<div class="dash-heatmap" style="grid-column:1/-1"><div class="dash-heatmap-h"><b>节健康度总览</b><span class="muted">'+STATE.framework.length+' 节 · 绿 '+m.green+' / 黄 '+(m.total-m.green-m.risk)+' / 红 '+m.risk+'</span></div><div class="dash-cells">';
  STATE.framework.forEach((s,i)=>{
    const e=HEALTH.sec[s.id].effective;
    const lbl=e==='red'?'有风险':e==='yellow'?'需关注':'达标';
    var aiR=currentProj()&&currentProj().ai&&currentProj().ai.lastReport;var aiHit=aiR?aiR.dimensions.some(function(d){return (d.issues||[]).some(function(it){return it.sectionId===s.id;});}):false;
    html+='<div class="dash-cell '+e+(aiHit?' ai-hit':'')+'" data-act="opensec" data-id="'+s.id+'" title="'+(i+1)+'. '+esc(s.title)+' · '+lbl+(aiHit?'（AI 诊断有问题，点击查看）':'（点击查看判分与 AI 诊断）')+'"><b class="dc-n">'+(i+1)+'</b><i class="dc-g">'+(e==='red'?'C':e==='yellow'?'B':'A')+'</i></div>';
  });
  html+='</div><div class="dash-legend"><span class="lg"><i class="ok"></i>达标</span><span class="lg"><i class="warn"></i>需关注</span><span class="lg"><i class="bad"></i>有风险</span></div></div>';
  // AI 总评 + 摘要操作
  const aiReport=currentProj()&&currentProj().ai&&currentProj().ai.lastReport?currentProj().ai.lastReport:null;
  if(aiReport){
    const dims=aiReport.dimensions||[];
    const g=gradeOf(aiReport.total,m.completion);
    html+='<div class="dash-panel dash-ai" style="grid-column:1/3"><div class="dash-panel-h"><b>AI 深度总评</b><span class="pill-grade g-'+g+'">'+g+' 级</span><span class="pill-st '+(aiReport.total>=80?'lv-green':aiReport.total>=60?'lv-yellow':'lv-red')+'">'+aiReport.total+' 分</span></div>'
      +(aiReport.summary?'<div class="dash-ai-sum">'+esc(aiReport.summary)+'</div>':'')
      +'<div class="dash-dims">'+dims.slice(0,6).map(function(d,i){
        const dv=aiReport.total>=80?'ok':aiReport.total>=60?'warn':'bad';
        return '<button type="button" class="dash-dim" data-act="dimdrill" data-i="'+i+'" aria-expanded="false" aria-controls="dimd-'+i+'"><span>'+esc(d.name)+'</span><div class="dash-dim-bar"><i class="'+dv+'" style="width:'+Math.max(0,Math.min(100,d.score||0))+'%"></i></div><b>'+d.score+'</b><span class="dd-chev" aria-hidden="true">▶</span></button>';
      }).join('')+'</div>'
      +'<div class="dim-details">'+dims.slice(0,6).map(function(d,i){return '<div class="dim-detail" id="dimd-'+i+'" style="display:none"></div>';}).join('')+'</div>'
      +'</div>';
  }else{
    html+='<div class="dash-panel dash-ai" style="grid-column:1/3"><div class="dash-panel-h"><b>AI 深度体检</b></div><div class="muted" style="font-size:12.5px">让 AI 按 6 个维度评分并逐条诊断，与红黄绿规则引擎并列、不覆盖。</div><div class="row-act" style="margin-top:8px"><button data-ai="score">运行深度体检</button></div></div>';
  }
  const sumG=gradeOf(aiReport?aiReport.total:null,m.completion);
  html+='<div class="dash-panel dash-sum" style="grid-column:3/5"><div class="dash-panel-h"><b>体检摘要</b><span class="pill-grade g-'+sumG+'">'+sumG+' 级</span></div>'
    +'<div class="dash-sum-line">完成度 <b>'+m.completion+'%</b>（'+m.green+'/'+m.total+' 必填节达标）</div>'

    +'<div class="row-act" style="margin-top:8px"><button data-act="copyhealth">⧉ 复制摘要（Markdown）</button><button data-act="exportmd">导出 MD</button><button data-act="multireview">多角色评审</button></div>'
    +'<div class="muted" style="font-size:11.5px;margin-top:6px">粘贴到评审群/需求评审文档，一行带全部关键指标。</div></div>';
  const hits=HEALTH.activeHits.map(function(h,hi){return {h:h,hi:hi,impact:gapImpact(h)};}).sort(function(a,b){
    var d=a.impact.rank-b.impact.rank;if(d)return d;
    if(a.h.level!==b.h.level)return a.h.level==='red'?-1:1;
    return String(sectionTitle(a.h.sectionId)).localeCompare(String(sectionTitle(b.h.sectionId)),'zh-CN');
  });
  if(hits.length){
    html+='<div class="gaps" style="grid-column:1/-1"><h3>交付缺口（已按交付影响排序；点 ▾ 查看依据，点行跳到对应节）</h3><div class="gap-table-wrap"><table class="gap-table"><thead><tr><th></th><th>缺口项</th><th>所属章节</th><th>交付影响</th><th>下一步</th></tr></thead><tbody>';
    hits.forEach(function(entry,i){
      var h=entry.h,impact=entry.impact;
      const lv=h.level;
      html+='<tr class="gap-row" data-act="opensec" data-id="'+h.sectionId+'">'+
        '<td class="gap-expand" data-act="gapexpand" data-hi="'+entry.hi+'">▾</td>'+
        '<td class="gitem">'+esc(h.snippet)+'</td>'+
        '<td class="gsec">'+esc(sectionTitle(h.sectionId))+'</td>'+
        '<td><span class="pill-st '+impact.cls+'">'+impact.label+'</span></td>'+
        '<td class="gadv">'+esc(impact.next||((h.advice||'').split('\n')[0]||''))+'</td>'+
        '</tr>'+
        '<tr class="gap-detail" id="gapd-'+entry.hi+'" style="display:none"><td colspan="5"></td></tr>';
    });
    html+='</tbody></table></div></div>';
  }else{
    html+='<div class="gaps" style="grid-column:1/-1"><div class="empty"><span class="e-ic">'+ICONS.checkL+'</span><span class="e-t">暂无缺口</span><span class="e-d">全部节达标，规则引擎未命中任何问题</span></div></div>';
  }
  el.innerHTML=html;
  PREV_METRICS=m;
}
function deliveryReadiness(){
  const has=function(id,words){
    let sec=(STATE.framework||[]).find(function(s){return s.id===id;});
    if(!sec&&words)sec=(STATE.framework||[]).find(function(s){const t=(s.title||'').replace(/\s/g,'');return words.some(function(w){return t.indexOf(w)>=0;});});
    if(!sec)return false;const c=DATA[sec.id]||{};
    if((c.items||[]).length||(c.cards||[]).length||(c.rows||[]).length)return true;
    return !!htmlToText(c.html||'').trim();
  };
  const red=(HEALTH&&HEALTH.activeHits||[]).filter(function(h){return h.level==='red';}).length;
  const trace=traceabilityReport();
  const p0Ready=!trace.p0Gaps.length;
  const basics=has('purpose',['目的','目标','背景'])&&has('scope',['范围','边界'])&&has('feat',['功能需求','功能']);
  const devNeeds=has('nfr',['非功能','性能','安全'])&&has('accept',['验收','测试标准']);
  const testNeeds=has('accept',['验收','测试标准'])&&has('selftest',['自测','测试点','测试']);
  const level=function(ok){return red?'block':ok?'ok':'warn';};
  /* P0 缺口同源 → 首行说明根因，后两行用「同上」并各自给出本阶段的后果，避免三行重复同一句 */
  const p0n=trace.p0Gaps.length;
  return {blockerText:red?'存在 '+red+' 个红色阻塞项：请先处理后再交付':(!p0Ready?'存在 '+p0n+' 个 P0 追溯缺口：补齐验收与测试点后再交付':'无红色阻塞项；仍需按各阶段要求核对'),rows:[
    {title:basics&&p0Ready&&!red?'可进入评审':'暂不建议评审',level:level(basics&&p0Ready),text:!p0Ready?'P0 功能缺少关联验收或测试点（'+p0n+' 项），评审大概率会被追问、难以定稿。':basics?'目标、范围与功能已具备，可组织评审。':'补齐目标、范围或功能需求后再评审。'},
    {title:basics&&devNeeds&&p0Ready&&!red?'可进入研发':'暂不建议研发',level:level(basics&&devNeeds&&p0Ready),text:!p0Ready?'同上（'+p0n+' 项 P0 追溯缺口）：缺可判定的验收标准，研发无法确认「做完了」。':basics&&devNeeds?'非功能约束与验收已具备，可进入研发拆解。':'需补齐非功能约束或验收标准。'},
    {title:basics&&devNeeds&&testNeeds&&p0Ready&&!red?'可进入测试':'暂不建议测试',level:level(basics&&devNeeds&&testNeeds&&p0Ready),text:!p0Ready?'同上（'+p0n+' 项 P0 追溯缺口）：缺测试点/自测，测试无法据此编写用例。':basics&&devNeeds&&testNeeds?'验收与自测内容齐备，可进入测试设计。':'需补齐可判定验收和自测/测试点。'}
  ]};
}
function traceSection(type,words){
  var sec=null;
  if(words)sec=(STATE.framework||[]).find(function(s){var t=String(s.title||'');return words.some(function(w){return t.indexOf(w)>=0;});});
  if(!sec)sec=(STATE.framework||[]).find(function(s){return s.type===type;});
  return sec||null;
}
function traceTerms(text){
  var out=[],seen={};
  String(text||'').toLowerCase().match(/[a-z][a-z0-9_-]{2,}|[\u4e00-\u9fff]{2,}/g)?.forEach(function(run){
    var chunks=/^[\u4e00-\u9fff]+$/.test(run)?Array.from({length:Math.max(0,run.length-1)},function(_,i){return run.slice(i,i+2);}):[run];
    chunks.forEach(function(x){if(x.length>=2&&!/^(用户|功能|需求|系统|支持|进行|相关|可以|需要|一个|我们|通过)$/.test(x)&&!seen[x]){seen[x]=1;out.push(x);}});
  });
  return out;
}
function traceMatches(feature,items){
  var terms=traceTerms(feature),full=String(feature||'').replace(/\s/g,'').toLowerCase();
  return (items||[]).filter(function(item){
    var text=String(item&&item.text||item&&item.label||'').replace(/\s/g,'').toLowerCase();if(!text)return false;
    if(full.length>=2&&(text.indexOf(full)>=0||full.indexOf(text)>=0))return true;
    return traceTerms(text).some(function(term){return terms.indexOf(term)>=0;});
  });
}
function traceabilityReport(){
  var featSec=traceSection('feat',['功能']),userSec=traceSection('users',['用户','使用者']),acceptSec=traceSection('accept',['验收']),testSec=traceSection('text',['自测','测试点','测试']),trackSec=traceSection('table',['埋点','数据']);
  var features=((featSec&&DATA[featSec.id]||{}).items||[]).filter(function(it){return String(it&&it.name||'').trim();});
  var users=((userSec&&DATA[userSec.id]||{}).items||[]).map(function(it){return {text:'作为'+(it.role||'')+'，我希望'+(it.want||'')+'，以便'+(it.soThat||'')};});
  var accepts=((acceptSec&&DATA[acceptSec.id]||{}).items||[]).map(function(it){return {text:it.text||''};});
  var tests=[];if(testSec){htmlToText((DATA[testSec.id]||{}).html||'').split(/[\n。；;]/).forEach(function(text){if(String(text).trim())tests.push({text:String(text).trim()});});}
  var tracks=[];if(trackSec){var td=DATA[trackSec.id]||{};(td.rows||[]).slice(1).forEach(function(row){var cells=(row&&row.cells)||[];if(cells.join('').trim())tracks.push({text:cells.join(' / ')});});if(!tracks.length&&td.html)tracks.push({text:htmlToText(td.html)});}
  var rows=features.map(function(f){var source=[f.name,f.desc].join(' ');return {feature:f,user:traceMatches(source,users),accept:traceMatches(source,accepts),test:traceMatches(source,tests),track:traceMatches(source,tracks)};});
  return {rows:rows,sections:{user:userSec,accept:acceptSec,test:testSec,track:trackSec},p0Gaps:rows.filter(function(r){return String(r.feature.priority||'').toUpperCase()==='P0'&&(!r.accept.length||!r.test.length);})};
}
function renderTraceCell(items,sec,empty){
  if(!sec)return '<span class="trace-cell none">未设置该节</span>';
  if(!items||!items.length)return '<span class="trace-cell none">'+esc(empty||'未匹配，需补齐')+'</span>';
  return '<button type="button" class="trace-cell" data-act="opensec" data-id="'+esc(sec.id)+'" title="点击查看「'+esc(sec.title)+'」">'+esc(items.slice(0,2).map(function(x){return x.text;}).join('；'))+(items.length>2?' 等 '+items.length+' 条':'')+'</button>';
}
function renderTraceability(){
  var report=traceabilityReport();if(!report.rows.length)return '';
  var s=report.sections;
  return '<div class="trace-panel"><div class="trace-panel-h"><b>需求追溯链</b><span>基于共同关键词自动推断，点击查看原节；请人工核对后交付</span></div><table class="trace-table"><thead><tr><th>功能</th><th>用户需求</th><th>验收标准</th><th>测试点 / 自测</th><th>埋点</th></tr></thead><tbody>'+report.rows.map(function(row){var p0=String(row.feature.priority||'').toUpperCase()==='P0';return '<tr><td class="trace-main">'+esc(row.feature.name)+(p0?'<span class="trace-p0">P0</span>':'')+'</td><td>'+renderTraceCell(row.user,s.user,'未匹配，需核对用户需求')+'</td><td>'+renderTraceCell(row.accept,s.accept,'未匹配，需补验收')+'</td><td>'+renderTraceCell(row.test,s.test,'未匹配，需补测试点')+'</td><td>'+renderTraceCell(row.track,s.track,'未匹配，需补埋点')+'</td></tr>';}).join('')+'</tbody></table>'+(report.p0Gaps.length?'<div class="muted" style="margin-top:8px;color:var(--red)">P0 缺口：'+esc(report.p0Gaps.map(function(r){return r.feature.name;}).join('、'))+' 缺少关联验收或测试点，不能判为研发/测试就绪。</div>':'')+'</div>';
}
function gapImpact(h){
  var id=String(h&&h.ruleId||''),sid=String(h&&h.sectionId||'');
  var isTest=/^R-TEST|^R-CONS-0[13]$/.test(id)||/(?:accept|selftest|test|验收|测试)/i.test(sid);
  var isDev=(id==='R-SPEC-01'&&/(?:purpose|scope|feat|nfr|users|ui|track)/i.test(sid))||/(?:feat|nfr|scope|users|ui|track|功能|范围|非功能|界面|埋点)/i.test(sid);
  if(h&&h.level==='red'&&isDev)return {rank:0,label:'阻塞研发',cls:'lv-red',next:'先补齐该项，再进入研发拆解'};
  if((h&&h.level==='red'&&isTest)||id==='R-CONS-01'||id==='R-CONS-03')return {rank:1,label:'阻塞测试',cls:'lv-red',next:'先补齐可判定验收与验证方式'};
  if(/^R-CONS|^R-RISK/.test(id)||/(?:purpose|目标|范围)/i.test(sid))return {rank:2,label:'影响目标',cls:'lv-yellow',next:'核对目标、范围与关联内容是否一致'};
  return {rank:3,label:'建议优化',cls:'lv-yellow',next:(h&&h.advice||'').split('\n')[0]||'补齐后重新运行体检'};
}
/* P0-②/③ 健康度等级 + 维度下钻 + 缺口详情 */
function gradeOf(aiTotal,completion){
  var s=(aiTotal==null||isNaN(+aiTotal))?(+completion||0):(+aiTotal);
  if(s>=90)return 'S'; if(s>=80)return 'A'; if(s>=70)return 'B'; return 'C';
}
function ruleWhy(ruleId){var r=(STATE.ruleSet||[]).find(function(x){return x&&x.id===ruleId;});return r?r.desc:'';}
function renderDimDetail(d){
  var issues=(d&&d.issues)||[];
  if(!issues.length)return '<div class="muted">该维度无明显问题，保持即可。</div>';
  return issues.map(function(it){
    var sev=it.severity==='high'?'lv-red':'lv-yellow';
    var q=it.quote?('<div class="di-quote">“'+esc(it.quote)+'”'+(it.lowConfidence?' <span class="muted">（原文依据弱，建议复核）</span>':'')+'</div>'):'';
    return '<div class="dim-iss"><div class="di-why"><b>'+esc(it.sectionTitle||'')+'</b> '+(it.severity?'<span class="pill-st '+sev+'">'+esc(it.severity)+'</span> ':'')+esc(it.reason||'')+'</div>'+q+(it.suggestion?('<div class="di-sug"><b>建议：</b>'+esc(it.suggestion)+'</div>'):'')+'</div>';
  }).join('');
}
function renderHero(){
  const main=document.getElementById('main');
  const sub=document.getElementById('heroSub');
  if(!sub||!HEALTH||!HEALTH.metrics)return;
  const proj=currentProj();
  const title=sub.parentElement&&sub.parentElement.querySelector('h1');if(title&&proj)title.textContent=proj.name;
  let reportChip=sub.parentElement&&sub.parentElement.querySelector('.import-report-chip');
  if(proj&&proj.importReport){
    if(!reportChip){reportChip=document.createElement('button');reportChip.className='import-report-chip';reportChip.dataset.act='showimportreport';sub.parentElement.appendChild(reportChip);}
    reportChip.innerHTML='最近导入：'+esc(proj.importReport.sourceLabel||'文档')+' · 查看报告 <span aria-hidden="true">→</span>';
  }else if(reportChip){reportChip.remove();}
  let sampleNext=main.querySelector('#sampleNext');
  if(proj&&proj.sampleGuide){
    if(!sampleNext){sampleNext=document.createElement('div');sampleNext.id='sampleNext';sampleNext.className='sample-next';const dash=document.getElementById('dashboard');if(dash)dash.before(sampleNext);}
    sampleNext.innerHTML='<div><b>示例 PRD 已加载</b><br><span>把它改成自己的项目，再用体检找出需补齐的内容。</span></div><div class="row-act"><button data-act="sample-edit">先替换目标</button><button data-act="sample-health">查看质量缺口</button><button data-act="sample-rename">保留为我的项目</button></div>';
  }else if(sampleNext){sampleNext.remove();}
  const m=HEALTH.metrics;
  const aiReport=proj&&proj.ai&&proj.ai.lastReport?proj.ai.lastReport:null;
  const updated=proj&&proj.updatedAt?new Date(proj.updatedAt).toLocaleString():'';
  sub.innerHTML='<span class="hero-meta hero-dot ok"></span>完成度 <b>'+m.completion+'%</b>'
    +'<span class="hero-sep">·</span>风险红节 <b>'+(m.risk||0)+'</b>'
    +(aiReport?'<span class="hero-sep">·</span>AI 总评 <b>'+aiReport.total+'</b>':'')
    +(updated?'<span class="hero-sep">·</span>更新于 '+esc(updated):'')
    +'<span class="hero-sep">·</span><span class="muted">智能体检 · 红黄绿可视化面板</span>';
}
function copyHealthSummary(){
  if(!HEALTH||!HEALTH.metrics)return;
  const m=HEALTH.metrics;
  const p=currentProj();
  const aiReport=p&&p.ai&&p.ai.lastReport?p.ai.lastReport:null;
  const lines=['# '+esc((p&&p.name)||'PRD')+' · 健康度摘要',''];
  lines.push('- 生成时间：'+new Date().toLocaleString());
  lines.push('- 完成度：'+m.completion+'%（必填节 '+m.green+'/'+m.total+' 达标）');
  lines.push('- 风险红节：'+m.risk);
  lines.push('- 一致性问题：'+(m.consistency||0));

  if(aiReport)lines.push('- AI 总评：'+aiReport.total+' 分'+(aiReport.summary?'（'+aiReport.summary+'）':''));
  lines.push('');
  lines.push('### 节状态');
  STATE.framework.forEach(s=>{
    const e=HEALTH.sec[s.id].effective;
    lines.push('- ['+(e==='green'?'✅':e==='yellow'?'⚠️':'🔴')+'] '+s.title);
  });
  const hits=HEALTH.activeHits.slice();
  if(hits.length){
    lines.push('');
    lines.push('### 缺口清单');
    hits.forEach(h=>{
      lines.push('- ['+(h.level==='red'?'红':'黄')+'] '+sectionTitle(h.sectionId)+'：'+(h.snippet||'').replace(/\n/g,' ')+'（建议：'+(h.advice||'').replace(/\n/g,' ')+'）');
    });
  }
  const text=lines.join('\n');
  function done(){toast('体检摘要已复制，可直接粘贴到评审群');}
  if(navigator.clipboard&&navigator.clipboard.writeText){
    navigator.clipboard.writeText(text).then(done).catch(()=>{fallbackCopy(text);done();});
  }else{
    fallbackCopy(text);done();
  }
  try{window.__lastHealthSummary=text;}catch(e){}
  return text;
}
function fallbackCopy(text){
  try{
    const ta=document.createElement('textarea');
    ta.value=text;ta.style.position='fixed';ta.style.opacity='0';
    document.body.appendChild(ta);ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  }catch(e){toast('复制失败，请手动复制');}
}
function renderTOC(){
  const toc=document.getElementById('toc');
  let html='<div class="toc-title">目录</div>';
  STATE.framework.forEach(s=>{const e=HEALTH.sec[s.id].effective;const c=e==='red'?'var(--red)':e==='yellow'?'var(--yellow)':'var(--green)';
    html+='<a href="#sec-'+s.id+'" data-act="goto" data-id="'+s.id+'" data-tocid="'+s.id+'" draggable="true" title="拖拽可调整节顺序"><span class="dot" style="background:'+c+'"></span><span class="t">'+esc(s.title)+'</span></a>';});
  toc.innerHTML=html;
  watchTocScroll();
  bindTocDrag();
  bindTouchDrag();
}
function renderSections(){
  const main=document.getElementById('main');
  // hero + dashboard 容器只在首次创建
  let wrap=main.querySelector('#content');
  const latestImport=currentProj().importReport;
  const heroHtml='<div class="hero"><div class="hcontent"><h1>'+esc(currentProj().name)+'</h1><div class="sub" id="heroSub"></div>'+
    (latestImport?'<button class="import-report-chip" data-act="showimportreport">最近导入：'+esc(latestImport.sourceLabel||'文档')+' · 查看报告 <span aria-hidden="true">→</span></button>':'')+
    '</div></div>'+

    '<div id="dashboard" class="dashboard"></div><div id="content"></div>';
  if(!wrap){main.innerHTML=heroHtml;wrap=main.querySelector('#content');}
  if(typeof aiTblDestroyAll==='function')aiTblDestroyAll();
  let html='';
  STATE.framework.forEach((s,i)=>{html+=renderSection(s,i);});
  wrap.innerHTML=html;
  renderHero();renderDashboard();renderTOC();
  if(typeof aiTblUpgradeAll==='function')aiTblUpgradeAll();
  if(drillOpen&&HEALTH.sec[drillOpen])renderDrill(drillOpen);
}
function renderSection(s,i){
  const e=HEALTH.sec[s.id].effective;const ov=HEALTH.sec[s.id].override;
  const body=renderEditor(s);
  const locked=!!(currentProj()&&currentProj().ai&&currentProj().ai.locks&&currentProj().ai.locks[s.id]);
  return '<div class="section-card'+(ov?' overridden':'')+'" id="sec-'+s.id+'" data-id="'+s.id+'">'+
    '<div class="sec-head"><span class="num" data-act="drill" data-id="'+s.id+'">'+(i+1)+'</span><h2 data-act="drill" data-id="'+s.id+'">'+esc(s.title)+'</h2>'+
    (s.auto?'<span class="auto-tag" title="导入文档时自动生成的章节">自动</span>':'')+
    '<button type="button" class="btn btn--sm btn--ghost" data-ai="lock-section" data-sid="'+esc(s.id)+'" title="锁定后 AI 优化、AI 草稿写入不会修改本节">'+(locked?'🔒 已锁定 AI':'🔓 锁定 AI')+'</button>'+
    '<span class="sec-color '+e+'" data-act="ovmenu" data-id="'+s.id+'" id="badge-'+s.id+'" title="点击手动改色"></span>'+
    '</div>'+
    '<div class="sec-body">'+body+'</div>'+
    '<div class="drill" id="drill-'+s.id+'" style="display:'+(drillOpen===s.id?'block':'none')+'"></div>'+
    '</div>';
}
function pill(kind,val){
  const v=(val||'').trim();
  if(kind==='prio'){
    const map={'P0':'p0','P1':'p1','P2':'p2','P3':'p3','P4':'p4'};
    return '<span class="pill '+(map[v]||'pill-empty')+'">'+(v||'—')+'</span>';
  }
  if(kind==='status'){
    const map={'草稿':'st-draft','评审中':'st-review','开发中':'st-dev','测试中':'st-test','已上线':'st-done','已暂缓':'st-hold'};
    return '<span class="pill st '+(map[v]||'st-draft')+'">'+(v||'—')+'</span>';
  }
  return '<span class="pill pill-empty">'+(v||'—')+'</span>';
}
function renderEditor(s){
  const c=DATA[s.id]||sectionEmpty(s.type,s.id);
  const dis=editing?'':' disabled'; // 非编辑态下所有结构化控件只读（点击“完成编辑”后整页进入只读视图）
  let body;
  if(s.type==='feat'){
    let rows=c.items.map((it,idx)=>'<tr>'+
      '<td><input'+dis+' data-act="field" data-sec="feat" data-idx="'+idx+'" data-key="name" value="'+esc(it.name||'')+'" aria-label="功能 '+(idx+1)+' · 功能点名称"'+'></td>'+
      '<td><textarea'+dis+' data-act="field" data-sec="feat" data-idx="'+idx+'" data-key="desc" aria-label="功能 '+(idx+1)+' · 描述"'+'>'+esc(it.desc||'')+'</textarea></td>'+
      '<td>'+(editing?'<select'+dis+' data-act="field" data-sec="feat" data-idx="'+idx+'" data-key="priority" aria-label="功能 '+(idx+1)+' · 优先级">'+['','P0','P1','P2','P3','P4'].map(p=>'<option'+( (it.priority||'')===p?' selected':'')+'>'+p+'</option>').join('')+'</select>':pill('prio',it.priority))+'</td>'+
      '<td>'+(editing?'<select'+dis+' data-act="field" data-sec="feat" data-idx="'+idx+'" data-key="status" aria-label="功能 '+(idx+1)+' · 状态">'+['','草稿','评审中','开发中','测试中','已上线'].map(p=>'<option'+( (it.status||'')===p?' selected':'')+'>'+p+'</option>').join('')+'</select>':pill('status',it.status))+'</td>'+
      (editing?'<td><button class="del" data-act="delfeat" data-idx="'+idx+'" aria-label="删除功能 '+(idx+1)+'" title="删除该功能点">×</button></td>':'')+
      '</tr>').join('');
    body='<table class="tbl"><thead><tr><th>功能点</th><th>描述</th><th>优先级</th><th>状态</th>'+(editing?'<th></th>':'')+'</tr></thead><tbody>'+rows+'</tbody></table>'+
      (editing?'<div class="row-act"><button data-act="addfeat">＋ 添加功能点</button></div>':'');
  }
  else if(s.type==='accept'){
    let rows=c.items.map((it,idx)=>{const st=it.status||'na';return '<div class="checkitem" data-aid="'+(it.id||'')+'"><input type="text"'+dis+' data-act="field" data-sec="accept" data-idx="'+idx+'" data-key="text" value="'+esc(it.text||'')+'" aria-label="验收项 '+(idx+1)+'"'+'>'+
      '<span class="tri">'+
      ['pass','fail','na'].map(v=>'<button type="button" class="tri-btn '+(st===v?'on':'')+' '+v+'" data-act="accstatus" data-idx="'+idx+'" data-val="'+v+'" aria-label="验收项 '+(idx+1)+' · 标记为'+(v==='pass'?'通过':v==='fail'?'不通过':'待定')+'" aria-pressed="'+(st===v)+'">'+(v==='pass'?ICONS.check+'通过':v==='fail'?ICONS.x+'不通过':'–待定')+'</button>').join('')+
      '</span>'+
      (editing?'<button class="del" data-act="delaccept" data-idx="'+idx+'" aria-label="删除验收项 '+(idx+1)+'" title="删除该验收项">×</button>':'')+'</div>';}).join('');
    body=rows+(editing?'<div class="row-act"><button data-act="addaccept">＋ 添加验收项</button></div>':'');
  }
  else if(s.type==='users'){
    let cards=c.items.map((it,idx)=>'<div class="story"><div class="line"><label for="fld-users-'+idx+'-role">作为</label><textarea'+dis+' id="fld-users-'+idx+'-role" data-act="field" data-sec="users" data-idx="'+idx+'" data-key="role" rows="2" aria-label="用户故事 '+(idx+1)+' · 作为（角色）">'+esc(it.role||'')+'</textarea></div>'+
      '<div class="line"><label for="fld-users-'+idx+'-want">我希望</label><textarea'+dis+' id="fld-users-'+idx+'-want" data-act="field" data-sec="users" data-idx="'+idx+'" data-key="want" rows="2" aria-label="用户故事 '+(idx+1)+' · 我希望（诉求）">'+esc(it.want||'')+'</textarea></div>'+
      '<div class="line"><label for="fld-users-'+idx+'-soThat">以便</label><textarea'+dis+' id="fld-users-'+idx+'-soThat" data-act="field" data-sec="users" data-idx="'+idx+'" data-key="soThat" rows="2" aria-label="用户故事 '+(idx+1)+' · 以便（价值）">'+esc(it.soThat||'')+'</textarea></div>'+
      (editing?'<button class="del" data-act="deluser" data-idx="'+idx+'" aria-label="删除用户故事 '+(idx+1)+'" title="删除该用户故事">× 删除</button>':'')+'</div>').join('');
    body=cards+(editing?'<div class="row-act"><button data-act="adduser">＋ 添加用户故事</button></div>':'');
  }
  else if(s.type==='table'){
    const rows=(c.rows&&c.rows.length)?c.rows:[{cells:['列1','列2']}];
    const cw=c.colWidths||[],rh=c.rowHeights||{};
    const heads=rows[0].cells||[];
    let tools='';
    let tbl='<div class="table-scroll native-tbl" data-sec="'+s.id+'"><table class="tbl user-tbl"><colgroup>';
    heads.forEach((_,j)=>{tbl+='<col style="width:'+(cw[j]||120)+'px">';});
    // v16.5/16.6：与富文本表格统一——无操作列/行内删除按钮，增删改走右键菜单；
    // 拖拽用显式手柄：表头右缘拖列宽（tbl-col-h），行首格下缘拖行高（tbl-row-h）
    tbl+='</colgroup><thead><tr>';
    heads.forEach((h,j)=>{
      tbl+='<th data-sec="'+s.id+'" data-row="0" data-col="'+j+'" aria-label="表头第 '+(j+1)+' 列"'+(editing?' contenteditable="true" data-act="tcell" data-key="head"':'')+'>'+cellHtmlWithComments(s.id,c,0,j,h||'');
      if(editing){tbl+='<span class="tbl-col-h" data-col="'+j+'"></span>';if(j===0)tbl+='<span class="tbl-row-h"></span>';}
      tbl+='</th>';
    });
    tbl+='</tr></thead><tbody>';
    for(let i=1;i<rows.length;i++){
      const r=rows[i];const cells=r.cells||[];
      tbl+='<tr'+(rh[i-1]?' style="height:'+rh[i-1]+'px"':'')+'>';
      heads.forEach((_,j)=>{
        const colName=String(heads[j]||('第'+(j+1)+'列')).replace(/<[^>]*>/g,'');
        tbl+='<td data-sec="'+s.id+'" data-row="'+i+'" data-col="'+j+'" aria-label="'+esc(colName)+' 第 '+i+' 行"'+(editing?' contenteditable="true" data-act="tcell" data-key="cell"':'')+'>'+cellHtmlWithComments(s.id,c,i,j,cells[j]||'');
        if(editing&&j===0)tbl+='<span class="tbl-row-h"></span>';
        tbl+='</td>';
      });
      tbl+='</tr>';
    }
    tbl+='</tbody></table></div>';
    let host='<div class="tbl-host" id="tblhost-'+s.id+'" data-sec="'+s.id+'" style="display:none"></div>';
    body='<div class="tbl-wrap" data-sec="'+s.id+'">'+tools+'<div class="tbl-stage">'+tbl+host+'</div></div>';
  }
    else { // text / timeline（含迁移后的旧 cards 类型）
      // v18.8：取消「添加小卡片后隐藏正文输入框」——始终显示正文输入框，便于连续录入正文与小卡片
      body='<div class="editable" data-act="editable" data-id="'+s.id+'" contenteditable="'+(editing?'true':'false')+'"'+((editing)?' role="textbox" aria-multiline="true"':'')+' aria-label="'+esc(s.title||'正文')+' · 正文内容'+'">'+stripRtblHtml(c.html||'')+'</div>';
    }
  return body+renderSubCards(s);
}
// 小卡片：每个节通用的「子标题+内容」，编辑态可增删，视图态无卡片则不显示
function renderSubCards(s){
  const c=DATA[s.id]||sectionEmpty(s.type,s.id);
  const cards=c.cards||[];
  if(!cards.length && !editing)return '';
  const dis=editing?'':' disabled';
  const catchAll=isCatchAll(s.id);
  const list=cards.map((it,idx)=>'<div class="sub-card">'+
    '<div class="sub-card-head"><input type="text" class="sub-card-title"'+dis+' data-act="field" data-sec="'+s.id+'" data-idx="'+idx+'" data-key="title" value="'+esc(it.title||'')+'" placeholder="小标题" aria-label="小卡片 '+(idx+1)+' · 小标题">'+
    (editing?'<span class="sub-card-acts"><button class="mini" data-act="promotecard" data-sec="'+s.id+'" data-idx="'+idx+'" title="把这条提升为正式框架节">转为框架节</button><button class="del" data-act="delcard" data-sec="'+s.id+'" data-idx="'+idx+'" aria-label="删除小卡片 '+(idx+1)+'" title="删除该小卡片">×</button></span>':'')+'</div>'+
    '<div class="editable sub-card-body" data-act="cardbody" data-sec="'+s.id+'" data-idx="'+idx+'" contenteditable="'+(editing?'true':'false')+'"'+((editing)?' role="textbox" aria-multiline="true"':'')+' aria-label="'+esc(it.title||('小卡片 '+(idx+1)))+' · 内容">'+stripRtblHtml(it.html||'')+'</div>'+
    '</div>').join('');
  let label=editing?'<div class="subcards-label">小卡片（可选 · 小节下的子标题内容）</div>':'';
  if(catchAll&&editing)label='<div class="subcards-label">「其他」兜底：导入时放不进设定框架的内容会归到这里。可逐条「转为框架节」，或一键把下方标题都生成为正式框架节。</div>';
  const promoAll=(catchAll&&editing&&cards.length)?'<button class="mini" data-act="promoteall" data-sec="'+s.id+'" title="把这里的每条标题都生成为正式框架节">⤴ 把这些标题都生成为框架节</button>':'';
  const foot=editing?'<div class="row-act"><button data-act="addcard" data-sec="'+s.id+'">＋ 添加小卡片</button>'+promoAll+'</div>':'';
  return '<div class="subcards-wrap">'+label+list+foot+'</div>';
}
// v18.8：重渲染后按 c.cellComments 给结构化表格单元格重新贴评论划线（数据层持久、DOM 重建不丢）
function cellHtmlWithComments(secId,c,row,col,text){
  if(!c||!c.cellComments)return esc(text||'');
  var map=c.cellComments[row+'_'+col];
  if(!map)return esc(text||'');
  var html=esc(text||'');
  Object.keys(map).forEach(function(cid){
    var q=map[cid]&&map[cid].quote; if(!q)return;
    var safe=esc(q); var idx=html.indexOf(safe);
    if(idx<0){ html='<mark class="cmt-hl" data-cid="'+cid+'" data-cell="'+row+'_'+col+'" data-sec="'+secId+'">'+html+'</mark>'; return; }
    var open=html.lastIndexOf('<mark',idx); // 防嵌套：引号已落在某 mark 内则跳过
    if(open>=0&&html.indexOf('</mark>',open)<idx)return;
    html=html.slice(0,idx)+'<mark class="cmt-hl" data-cid="'+cid+'" data-cell="'+row+'_'+col+'" data-sec="'+secId+'">'+safe+'</mark>'+html.slice(idx+safe.length);
  });
  return html;
}

/* ============ 下钻（判分原因） ============ */
function renderDrill(id){
  const box=document.getElementById('drill-'+id);if(!box)return;
  const proj=currentProj();const corr=proj.corrections[id]||{};
  const info=HEALTH.sec[id];
  const eng=info.engine;const ov=info.override;
  let html='';
  if(ov){html+='<div class="dual">引擎判定：'+eng+' ｜ 你的标记：'+ov.color+'（原因：'+esc(ov.reason||'')+'，'+new Date(ov.at).toLocaleString()+'）</div>';}
  html+='<div class="d-sum">该节命中 '+info.raw.length+' 条规则（已处理 '+(info.raw.length-info.active.length)+' 条）。点击"已订正"或"忽略/误报"后该条即消失并自动升色。</div>';
  if(!info.raw.length){html+='<div class="empty"><span class="e-ic">'+ICONS.checkL+'</span><span class="e-t">该节无命中，达标</span><span class="e-d">规则引擎未命中任何判定项</span></div>';}
  info.raw.forEach(h=>{
    const c=corr[h.ruleId]||{};
    if(c.status==='done'||c.status==='ignored')return;
    html+='<div class="hit '+h.level+'"><div class="h-top"><span class="lv '+h.level+'">'+h.level+'</span><span class="rule-link" data-act="rulelink" data-rule="'+esc(h.ruleId)+'">'+esc(h.ruleId)+'</span><span class="muted">'+esc(h.dim||'')+'</span></div>'+
      '<div class="h-snip">'+esc(h.snippet)+'</div>'+
      '<div class="h-advice"><b>订正建议：</b>'+esc(h.advice)+'</div>'+
      '<div class="h-act">'+
      '<button class="done'+(c.status==='done'?' on':'')+'" data-act="corr" data-id="'+id+'" data-rule="'+h.ruleId+'" data-status="done">已订正</button>'+
      '<button class="ign'+(c.status==='ignored'?' on':'')+'" data-act="corr" data-id="'+id+'" data-rule="'+h.ruleId+'" data-status="ignored">忽略/误报</button>'+
      '</div></div>';
  });
  var aiReportD=proj.ai&&proj.ai.lastReport;
  if(aiReportD&&Array.isArray(aiReportD.dimensions)){
    var secIssues=[];
    aiReportD.dimensions.forEach(function(d){(d.issues||[]).forEach(function(it){if(it.sectionId===id)secIssues.push({dim:d.name,severity:it.severity,reason:it.reason,quote:it.quote,suggestion:it.suggestion});});});
    if(secIssues.length){
      html+='<div class="ai-drill-h"><span class="ai-drill-ic">'+ICONS.robot+'</span> AI 深度体检诊断（'+secIssues.length+' 条）</div>';
      secIssues.forEach(function(it){
        html+='<div class="ai-iss '+(it.severity==='high'?'bad':it.severity==='medium'?'warn':'')+'"><div class="ai-iss-top"><span class="lv '+(it.severity==='high'?'red':it.severity==='medium'?'yellow':'green')+'">'+it.severity+'</span><span class="muted">'+esc(it.dim||'')+'</span></div><div class="ai-iss-reason">'+esc(it.reason||'')+'</div>'+(it.quote?'<div class="ai-iss-quote">“'+esc(it.quote)+'”</div>':'')+(it.suggestion?'<div class="ai-iss-sug"><b>建议：</b>'+esc(it.suggestion)+'</div>':'')+'<div class="h-act"><button class="done" data-act="jump" data-sid="'+esc(id)+'">定位到节</button></div></div>';
      });
    }else{html+='<div class="empty"><span class="e-ic">'+ICONS.checkL+'</span><span class="e-t">AI 体检未发现明显问题</span><span class="e-d">该节 6 维诊断全部通过</span></div>';}
  }else{html+='<div class="muted" style="margin-top:8px">尚未运行 AI 深度体检，运行后此处显示该节 AI 诊断。</div>';}
  box.innerHTML=html;
}
function toggleDrill(id){
  if(drillOpen===id){drillOpen=null;}else{drillOpen=id;}
  const box=document.getElementById('drill-'+id);if(box)box.style.display=(drillOpen===id?'block':'none');
  if(drillOpen)renderDrill(id);
  // 更新色标按钮视觉（开/合无需改色）
}
function openSection(id){
  const card=document.getElementById('sec-'+id);if(card)card.scrollIntoView({behavior:'smooth'});
  if(drillOpen!==id){drillOpen=id;const box=document.getElementById('drill-'+id);if(box){box.style.display='block';renderDrill(id);}}
}

/* ============ 局部刷新（编辑/改色/订正后，不重建编辑器） ============ */
function updateHealthPill(){
  const pill=document.getElementById('topbarHealthPill');if(!pill)return;
  if(currentProj()&&HEALTH){
    const m=HEALTH.metrics;const lvl=m.risk>0?'red':(m.completion>=80)?'green':(m.completion>=60?'yellow':'red');
    pill.className='topbar-health-pill '+lvl;
    /* 术语约定（v19.15）：带百分比的数字一律叫「完成度」（= 必填节达标率）；
       「健康度」只用于红黄绿规则引擎结论（如看板「节健康度总览」）。
       此前这里写「健康度 X%」而取值是 m.completion，与同一条的 title、以及看板「完成度」卡自相矛盾。
       另：百分比与风险是两件事，risk>0 时配色转红，故文案同时点出红灯数，
       避免「77% 却是红的」被误读为分数偏低 */
    pill.querySelector('.txt').textContent='完成度 '+m.completion+'%'+(m.risk>0?' · '+m.risk+' 红灯':'');
    pill.title=m.risk>0?('完成度 '+m.completion+'%，另有 '+m.risk+' 个红色风险项需先行处理'):('完成度 '+m.completion+'%，无红色风险项');
    pill.setAttribute('aria-label',pill.title);
    pill.style.display='';
  }
  else{pill.style.display='none';}
}
function refreshHealthUI(){
  HEALTH=runHealth();
  updateHealthPill();
  renderDashboard();renderTOC();
  STATE.framework.forEach(s=>{const b=document.getElementById('badge-'+s.id);if(b){const e=HEALTH.sec[s.id].effective;b.className='sec-color '+e;}});
  // 更新被覆盖卡片的边框（人工标签已按需求移除）
  STATE.framework.forEach(s=>{const card=document.getElementById('sec-'+s.id);if(card){const ov=HEALTH.sec[s.id].override;card.classList.toggle('overridden',!!ov);}});
}

/* ============ 项目/分组操作 ============ */
function switchProject(id){
  if(id===STATE.activeProjectId){return;}
  // 切换前先把当前项目内容落盘（含未触发的防抖保存），避免切走再切回内容丢失
  flushSave();
  save();
  STATE.activeProjectId=id;
  const p=currentProj();if(p&&p.framework&&p.framework.length)STATE.framework=deep(p.framework);
  drillOpen=null;render();save();toast('已切换到 '+currentProj().name);
}
function flushSave(){if(saveTimer){clearTimeout(saveTimer);saveTimer=null;}try{save();}catch(e){}}
// 页面关闭/刷新前：先保存；仅当编辑态且有未保存改动才弹"离开页面"提示
// 视图态（editing=false）浏览绝不打扰；编辑态下 autoSave 触发 save() 后 dirty=false 也不再弹
window.addEventListener('beforeunload',function(e){
  try{flushSave();}catch(err){}
  if(editing && dirty && currentProj()){
    e.preventDefault();
    e.returnValue=''; // 触发浏览器原生"离开页面？更改可能不会保存"提示
  }
});
function renderNewProjFrameworks(){
  const list=document.getElementById('npFwList');if(!list)return;
  const sel=document.getElementById('npFramework');
  const presets=STATE.frameworkPresets||[];
  let html='';
  presets.forEach(pr=>{
    const n=(pr.framework||[]).length;
    html+='<div class="fw-pick" data-act="np-pick" data-fwid="'+esc(pr.id||'')+'">'+
      '<div class="fw-pick-main"><b>'+esc(pr.name||('框架 '+pr.id))+'</b><span class="fw-pick-count">'+n+' 节</span></div>'+
      '<div class="fw-pick-actions"><button class="mini" data-act="np-edit" data-fwid="'+esc(pr.id||'')+'">编辑</button><button class="mini" data-act="np-rename" data-fwid="'+esc(pr.id||'')+'" title="重命名该框架">重命名</button><button class="mini fw-del" data-act="np-del" data-fwid="'+esc(pr.id||'')+'" title="删除该框架">×</button></div>'+
      '</div>';
  });
  html+='<div class="fw-pick fw-pick-add autogen" data-act="np-autogen" data-fwid="__AUTO__" title="不预设框架，导入文档时按标题/排版自动生成框架与内容">'+
    '<div class="fw-pick-main"><b>导入自动生成</b><span class="fw-pick-count">按标题</span></div>'+
    '<div class="fw-pick-hint">不预设框架，导入时按标题与排版自动生成结构（可能误判/漏分，请导入后核对）</div>'+
    '</div>';
  html+='<div class="fw-pick fw-pick-add" data-act="np-newfw">＋ 自建框架</div>';
  html+='<div class="fw-pick fw-pick-current" data-act="np-pick" data-fwid="">使用当前框架（'+((STATE.framework||[]).length)+' 节）</div>';
  list.innerHTML=html;
  if(!sel.value && presets.length)sel.value=presets[0].id;
  refreshFwPickSel();
}
function refreshFwPickSel(){
  const sel=document.getElementById('npFramework');const list=document.getElementById('npFwList');if(!list||!sel)return;
  list.querySelectorAll('.fw-pick[data-fwid]').forEach(el=>{el.classList.toggle('sel',el.dataset.fwid===sel.value);});
}
/* ============ 框架编辑器（新建项目双击编辑 / 自建 / 设置页另存为） ============ */
let fwEditorBuf=null; // 正在编辑的框架（节数组）
let fwEditorCtx=null; // {context:'newproj'|'settings', sourceId, baseName, saveAs}
let fwEditorDeleteOps=[]; // 当前编辑会话内待提交的删节策略，取消编辑时不会影响项目数据
let fwDeletePending=null;
function openFwEditor(framework,opts){
  fwEditorBuf=deep(framework||[]);
  fwEditorCtx=opts||{context:'newproj',sourceId:null,baseName:'自定义框架',saveAs:false};
  fwEditorDeleteOps=[];
  if(!fwEditorBuf.length)fwEditorBuf.push({id:uid(),title:'新节',type:'text',required:false,weight:1});
  renderFwEditor();openModal('fwEditModal');
}
function fwImpactOf(sec){
  const p=currentProj(),d=p&&p.data&&p.data[sec.id];
  if(!d)return {has:false,body:0,cards:0,items:0,rows:0};
  const body=htmlToText(d.html||'').trim().length;
  const cards=(d.cards||[]).length,items=(d.items||[]).filter(Boolean).length,rows=(d.rows||[]).length;
  return {has:!!(body||cards||items||rows),body,cards,items,rows};
}
function fwArchiveHtml(sec,d){
  d=d||{};
  let html=d.html||'';
  if(d.items&&d.items.length)html+='<ul>'+d.items.filter(Boolean).map(function(i){return '<li>'+esc(i.name!=null?((i.name||'')+' '+(i.desc||'')):(i.text!=null?i.text:('作为'+(i.role||'')+'我希望'+(i.want||'')+'以便'+(i.soThat||''))))+'</li>';}).join('')+'</ul>';
  if(d.rows&&d.rows.length)html+='<table><tbody>'+d.rows.map(function(r){return '<tr>'+((r.cells||[]).map(function(c){return '<td>'+esc(c)+'</td>';}).join(''))+'</tr>';}).join('')+'</tbody></table>';
  (d.cards||[]).forEach(function(c){html+='<h3>'+esc(c.title||'小标题')+'</h3>'+(c.html||'');});
  return html||'<p>（原节为空）</p>';
}
function openFwDeleteModal(index){
  const sec=fwEditorBuf&&fwEditorBuf[index];if(!sec)return;
  const targets=fwEditorBuf.filter(function(x,i){return i!==index;});
  const blocked=fwEditorDeleteOps.some(function(x){return x.mode==='archive'&&x.targetId===sec.id;});
  if(blocked){toast('该节已被选为其他内容的归档目标；请先完成当前编辑，或取消后重新调整。');return;}
  const impact=fwImpactOf(sec),parts=[];
  if(impact.body)parts.push('正文约 '+impact.body+' 字');if(impact.cards)parts.push(impact.cards+' 个小卡片');if(impact.items)parts.push(impact.items+' 条结构化条目');if(impact.rows)parts.push(impact.rows+' 行表格数据');
  const el=document.getElementById('fwDeleteImpact');
  if(el)el.innerHTML='<b>即将删除：「'+esc(sec.title)+'</b><ul><li><b>受影响内容：</b>'+((parts.join('、'))||'当前为空')+'</li><li><b>导出影响：</b>该节将不再作为独立章节导出。</li><li><b>提示：</b>删除在点击“完成”保存框架后才会生效。</li></ul>';
  const sel=document.getElementById('fwDeleteTarget');if(sel)sel.innerHTML=targets.map(function(x){return '<option value="'+esc(x.id)+'">'+esc(x.title)+'</option>';}).join('');
  const wrap=document.getElementById('fwDeleteTargetWrap');if(wrap)wrap.style.display=targets.length?'block':'none';
  document.querySelectorAll('#fwDeleteModal input[name="fwDeleteMode"]').forEach(function(x){x.checked=x.value===(targets.length?'archive':'delete');});
  fwDeletePending={index,sec:deep(sec),hasTargets:targets.length>0};openModal('fwDeleteModal');
}
function confirmFwDelete(){
  const pending=fwDeletePending;if(!pending||!fwEditorBuf)return;
  const sec=fwEditorBuf[pending.index];if(!sec||sec.id!==pending.sec.id){toast('框架已变化，请重新选择要删除的节');return;}
  const checked=document.querySelector('#fwDeleteModal input[name="fwDeleteMode"]:checked');
  const mode=checked?checked.value:'delete',targetId=(document.getElementById('fwDeleteTarget')||{}).value||'';
  if(mode==='archive'&&(!pending.hasTargets||!targetId)){toast('请选择归档目标节，或改为连内容删除');return;}
  fwEditorDeleteOps.push({section:deep(sec),mode,targetId});
  fwEditorBuf.splice(pending.index,1);fwDeletePending=null;closeModal('fwDeleteModal');renderFwEditor();
}
function applyFwDeleteOps(project){
  if(!project||!fwEditorDeleteOps.length)return;
  const remain=new Set((fwEditorBuf||[]).map(function(s){return s.id;}));
  fwEditorDeleteOps.forEach(function(op){
    const data=project.data&&project.data[op.section.id];
    if(op.mode==='archive'&&remain.has(op.targetId)&&data){
      const target=project.data[op.targetId]||(project.data[op.targetId]={cards:[]});
      if(!target.cards)target.cards=[];
      target.cards.push({id:uid(),title:'已归档：'+op.section.title,html:fwArchiveHtml(op.section,data)});
    }
    if(project.data)delete project.data[op.section.id];
  });
}
function openFwEditorFromPreset(fwId){
  const pr=(STATE.frameworkPresets||[]).find(x=>x.id===fwId);
  if(!pr){toast('框架不存在');return;}
  openFwEditor(pr.framework,{context:'newproj',sourceId:fwId,baseName:pr.name,saveAs:false});
}
function renderFwEditor(){
  const el=document.getElementById('fwEditList');if(!el)return;
  let html='';
  fwEditorBuf.forEach((s,i)=>{
    html+='<div class="fw-row" data-fi="'+i+'" draggable="true" title="拖拽可调整节顺序">'+
      '<span class="muted">#'+(i+1)+'</span>'+
      '<input data-act="fwedit-title" data-i="'+i+'" value="'+esc(s.title)+'">'+
      '<select data-act="fwedit-type" data-i="'+i+'">'+[['text','文本'],['table','表格'],['feat','功能卡'],['users','用户故事'],['accept','清单'],['timeline','时间线']].map(t=>'<option value="'+t[0]+'"'+(s.type===t[0]?' selected':'')+'>'+t[1]+'</option>').join('')+'</select>'+
      '<label class="muted"><input type="checkbox" class="ck" data-act="fwedit-req" data-i="'+i+'"'+(s.required?' checked':'')+'>必填</label>'+
      '权重<input type="number" step="0.5" style="width:56px" data-act="fwedit-w" data-i="'+i+'" value="'+s.weight+'">'+
      '<span class="drag-handle" title="拖动调整顺序" aria-label="拖动排序"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="9" cy="6" r="1.7"/><circle cx="15" cy="6" r="1.7"/><circle cx="9" cy="12" r="1.7"/><circle cx="15" cy="12" r="1.7"/><circle cx="9" cy="18" r="1.7"/><circle cx="15" cy="18" r="1.7"/></svg></span><span class="ord"><button data-act="fwedit-ins" data-i="'+i+'">插</button><button data-act="fwedit-del" data-i="'+i+'" class="muted">删</button></span>'+
      '</div>';
  });
  html+='<div class="row-act"><button data-act="fwedit-add">＋ 新增节</button></div>';
  el.innerHTML=html;
  const cnt=document.getElementById('fwEditCount');if(cnt)cnt.textContent=(fwEditorBuf.length)+' 节';
}

let __projDragId=null;
function setProjGroup(pid,gid){
  const arr=STATE.projects;
  const from=arr.findIndex(x=>x.id===pid);if(from<0)return;
  const [m]=arr.splice(from,1);
  m.groupId=gid||undefined;
  arr.push(m);
  save();renderSidebar();
}
function moveProjTo(pid,targetPid,after){
  const arr=STATE.projects;
  const from=arr.findIndex(x=>x.id===pid);
  const tgt=arr.findIndex(x=>x.id===targetPid);
  if(from<0||tgt<0||from===tgt)return;
  const [m]=arr.splice(from,1);
  let insertAt=after?tgt+1:tgt;
  if(from<insertAt)insertAt--;
  insertAt=Math.max(0,Math.min(insertAt,arr.length));
  arr.splice(insertAt,0,m);
  const tProj=STATE.projects.find(x=>x.id===targetPid);
  if(tProj)m.groupId=tProj.groupId;
  save();renderSidebar();
}
function bindProjDrag(){
  if(window.__projDragBound)return;
  window.__projDragBound=true;
  function clsDragUI(){
    document.querySelectorAll('#projPanel .drag-over').forEach(x=>x.classList.remove('drag-over'));
    document.querySelectorAll('#projPanel .dragging').forEach(x=>x.classList.remove('dragging'));
  }
  document.addEventListener('dragstart',e=>{
    const pr=e.target.closest?e.target.closest('#projPanel .pp-proj'):null;
    if(!pr)return;
    __projDragId=pr.dataset.id;
    try{e.dataTransfer.setData('text/plain',pr.dataset.id);e.dataTransfer.effectAllowed='move';}catch(err){}
    pr.classList.add('dragging');
  });
  document.addEventListener('dragover',e=>{
    if(!__projDragId)return;
    const t=e.target;
    const hd=t.closest?t.closest('.pp-grp-hd'):null;
    const pr=t.closest?t.closest('#projPanel .pp-proj'):null;
    const ug=t.closest?t.closest('#projPanel .pp-ungrouped'):null;
    if(hd){e.preventDefault();clsDragUI();hd.closest('.pp-grp').classList.add('drag-over');if(e.dataTransfer)e.dataTransfer.dropEffect='move';}
    else if(pr){e.preventDefault();clsDragUI();pr.classList.add('drag-over');if(e.dataTransfer)e.dataTransfer.dropEffect='move';}
    else if(ug){e.preventDefault();clsDragUI();ug.classList.add('drag-over');if(e.dataTransfer)e.dataTransfer.dropEffect='move';}
  });
  document.addEventListener('drop',e=>{
    if(!__projDragId)return;
    const t=e.target;
    const hd=t.closest?t.closest('.pp-grp-hd'):null;
    const pr=t.closest?t.closest('#projPanel .pp-proj'):null;
    const ug=t.closest?t.closest('#projPanel .pp-ungrouped'):null;
    clsDragUI();
    if(hd){e.preventDefault();setProjGroup(__projDragId,hd.dataset.gid);}
    else if(pr){e.preventDefault();const rect=pr.getBoundingClientRect();const after=e.clientY>rect.top+rect.height/2;moveProjTo(__projDragId,pr.dataset.id,after);}
    else if(ug){e.preventDefault();setProjGroup(__projDragId,undefined);}
    __projDragId=null;
  });
  document.addEventListener('dragend',()=>{clsDragUI();__projDragId=null;});
}

/* ===== 触摸拖放（手机端）：框架节顺序调整 ===== */
function bindTouchDrag(){
  if(window.__touchDragBound)return; window.__touchDragBound=true;
  let el=null,fromIdx=-1,type=null,sY=0,sX=0,active=false;
  function clearUI(){document.querySelectorAll('.dragging,.drag-over-before,.drag-over-after').forEach(x=>x.classList.remove('dragging','drag-over-before','drag-over-after'));}
  function onDown(e){
    if(!e.target.closest)return;
    if(e.pointerType&&e.pointerType!=='touch')return;
    const h=e.target.closest('.drag-handle'); if(!h)return;
    const row=h.closest('.fw-row[data-fi]'); if(!row)return;
    e.preventDefault();
    el=row; type=row.closest('#fwEditList')?'edit':'fw'; fromIdx=+row.dataset.fi; sY=e.clientY; sX=e.clientX; active=false;
    row.classList.add('dragging');
    try{row.setPointerCapture(e.pointerId);}catch(_){}
  }
  function onMove(e){
    if(!el)return;
    const y=e.clientY,x=e.clientX;
    if(!active){if(Math.abs(y-sY)<8&&Math.abs(x-sX)<8)return; active=true;}
    e.preventDefault();
    const rows=[].slice.call(document.querySelectorAll('.fw-row[data-fi]'));
    let found=null;
    for(const r of rows){const rc=r.getBoundingClientRect(); if(y>=rc.top-2&&y<=rc.bottom+2){found=r;break;}}
    clearUI(); el.classList.add('dragging');
    if(found&&found!==el){const rc=found.getBoundingClientRect(); const before=y<rc.top+rc.height/2; found.classList.add(before?'drag-over-before':'drag-over-after');}
  }
  function onUp(e){
    if(!el)return;
    const tgt=document.querySelector('.drag-over-before,.drag-over-after');
    const before=tgt&&tgt.classList.contains('drag-over-before');
    const toIdx=tgt?+tgt.dataset.fi:-1;
    clearUI();
    if(tgt&&tgt!==el&&toIdx>=0){
      if(type==='edit'){
        if(fromIdx>=0&&fromIdx<fwEditorBuf.length){
          if(moveArrayItem(fwEditorBuf,fromIdx,toIdx+(before?0:1)))renderFwEditor();
        }
      }else if(fromIdx>=0){ reorderSection(fromIdx,toIdx+(before?0:1)); }
    }
    try{el.releasePointerCapture(e.pointerId);}catch(_){}
    el=null;fromIdx=-1;type=null;active=false;
  }
  document.addEventListener('pointerdown',onDown,{passive:false});
  document.addEventListener('pointermove',onMove,{passive:false});
  document.addEventListener('pointerup',onUp);
  document.addEventListener('pointercancel',onUp);
}

function createProject(name,frameworkId){name=(name||'').trim();if(!name){toast('请输入项目名称');return;}let fw,autoGen=false;if(frameworkId==='__AUTO__'){fw=[];autoGen=true;}else if(frameworkId==='__IDEA_STANDARD__'){fw=deep(DEFAULT_FRAMEWORK);}else if(frameworkId==='__IDEA_MINIMAL__'){const compact=DEFAULT_PRESETS.find(x=>x.id==='minimal');fw=deep((compact&&compact.framework)||DEFAULT_FRAMEWORK);}else{fw=deep(STATE.framework);if(frameworkId){const preset=(STATE.frameworkPresets||[]).find(x=>x.id===frameworkId);if(preset&&preset.framework&&preset.framework.length)fw=deep(preset.framework);}ensureCatchAll(fw);}if(!autoGen)ensureCatchAll(fw);const p={id:uid(),name:name,data:blankData(fw),overrides:{},corrections:{},framework:fw,autoGen:autoGen,context:{},updatedAt:Date.now()};STATE.projects.push(p);STATE.activeProjectId=p.id;STATE.framework=deep(fw);drillOpen=null;DATA=p.data;save();render();toast(autoGen?'已创建项目（自动生成框架：导入文档后将按标题生成结构，可能有误差，请核对）':'已创建项目');}
function deleteProject(id){const i=STATE.projects.findIndex(p=>p.id===id);if(i<0)return;STATE.projects.splice(i,1);if(STATE.activeProjectId===id)STATE.activeProjectId=STATE.projects.length?STATE.projects[0].id:null;render();save();}
function renameProject(id,name){const p=STATE.projects.find(x=>x.id===id);if(p){p.name=name;delete p.sampleGuide;save();render();}}

/* ============ 手动改色 ============ */
let ovTarget=null,ovColor=null;
function openOverride(id,color){ovTarget=id;ovColor=color;const ov=currentProj().overrides[id];document.getElementById('ovTitle').textContent='手动改色 · '+sectionTitle(id);document.getElementById('ovColorView').textContent='将标记为：'+color+(color==='green'?'（恢复为达标）':'');document.getElementById('ovReason').value=ov&&ov.color===color?ov.reason:'';openModal('overrideModal');}
function applyOverride(){const r=document.getElementById('ovReason').value.trim();if(!r){toast('请填写改色原因');return;}currentProj().overrides[ovTarget]={color:ovColor,reason:r,by:'PM',at:Date.now()};save();closeModal('overrideModal');refreshHealthUI();toast('已手动标'+ovColor);}
function clearOverride(id){delete currentProj().overrides[id];save();refreshHealthUI();toast('已恢复引擎判定');}

/* ============ 订正 ============ */
function setCorr(id,rule,status){const p=currentProj();if(!p.corrections[id])p.corrections[id]={};(p.corrections[id])[rule]={status,at:Date.now()};save();const info=HEALTH.sec[id];// 重新算（忽略影响引擎色）
  HEALTH=runHealth();renderDrill(id);refreshHealthUI();}

/* ============ 导入 / 导出 ============ */
function headingToId(t){
  t=t.toLowerCase();
  // “自定义风险 / 自定义字段”等是用户自建标题，不应因包含“定义”而误归入标准「定义」节。
  if(/^自定义/.test(t))return null;
  const map=[['purpose','目的'],['purpose','背景'],['scope','适用范围'],['scope','范围'],['def','定义'],['def','术语'],['prodinfo','产品信息'],['prodinfo','目标'],['users','使用者'],['users','用户需求'],['users','用户故事'],['feat','功能需求'],['nfr','非功能'],['nfr','性能'],['nfr','安全'],['selftest','自测'],['track','埋点'],['track','数据'],['ui','界面'],['ui','交互'],['accept','验收'],['launch','上线'],['launch','发布'],['meta','变更'],['meta','历史'],['other','其他'],['other','相关文件'],['other','附录']];
  for(const [id,kw] of map){if(t.includes(kw.toLowerCase()))return id;}
  return null;
}
function parsePRD(text){
  const stripNum=t=>t.replace(/^\s*(?:\d+(?:\.\d+)*)[.、)]\s*/,'').trim();
  const lines=text.split(/\r?\n/);let curSection=null,curCard=null;
  const buckets={},titles={},order=[];
  const cards={}; // sectionId -> [{title,lines}]（任意节内的子标题都作为小卡片）
  for(const line of lines){
    const m=line.match(/^(#{1,6})\s+(.*)$/);
    if(m){
      const level=m[1].length,raw=m[2].trim();
      if(!raw){curSection=null;curCard=null;continue;}
      if(level<=2){
        const mapped=headingToId(raw);
        const known=mapped && STATE.framework.some(s=>s.id===mapped);
        const key=known?mapped:('new::'+raw);   // 看板没有的标题按"新章节"暂存，正文不丢
        curSection=key;curCard=null;
        if(!buckets[key]){buckets[key]=[];order.push(key);titles[key]=raw;}
      }else if(curSection){
        // level>2 的子标题：作为当前节的小卡片（通用能力，不依赖节类型）
        if(!cards[curSection])cards[curSection]=[];
        curCard={title:stripNum(raw),lines:[]};
        cards[curSection].push(curCard);
      }
    }else{
      if(curCard)curCard.lines.push(line);
      else if(curSection)buckets[curSection].push(line);
    }
  }
  const data=blankData();const unmatched=[];
  order.forEach(key=>{
    const body=buckets[key].join('\n').trim();
    if(key.indexOf('new::')===0){
      unmatched.push(key);                      // 文档有、看板框架没有 → 归入「其他」兜底节
      // 同样保留该节内的子标题（level>2）作为小卡片，避免导入丢内容
      data[key]={html:importBodyToHtml(body),cards:(cards[key]||[]).map(c=>({id:uid(),title:c.title||'',html:importBodyToHtml(c.lines.join('\n').trim())}))};
    }else{
      const type=(STATE.framework.find(s=>s.id===key)||{}).type;
      const sec={cards:(cards[key]||[]).map(c=>({id:uid(),title:c.title||'',html:importBodyToHtml(c.lines.join('\n').trim())}))};
      if(type==='feat'||type==='accept'||type==='users'){sec.items=parseStruct(type,body,[]);}
      else{sec.html=importBodyToHtml(body);}
      data[key]=sec;
    }
  });
  return {data,unmatched,buckets,titles,order};
}
// 由解析结果生成「沿用文档自身结构」的框架：已知节映射到看板标准类型，文档特有节为 text 节，保持原标题顺序
function docFrameworkFromParse(r){
  const fw=[];
  (r.order||[]).forEach(key=>{
    if(key.indexOf('new::')===0){
      const title=(r.titles&&r.titles[key])||key.slice(5);
      fw.push({id:key,title:title,type:'text',required:false,weight:1});
    }else{
      const existing=(STATE.framework||[]).find(s=>s.id===key);
      fw.push(existing?deep(existing):{id:key,title:(r.titles&&r.titles[key])||key,type:'text',required:false,weight:1});
    }
  });
  ensureCatchAll(fw);
  return fw;
}
function parseStruct(type,body,cardList){
  const HEADER_TOKENS=['名称','功能点','序号','功能编号','描述','说明','优先级','状态'];
  if(type==='feat'){const items=[];body.split(/\n+/).forEach(raw=>{
    let l=raw.replace(/^[-*]\s*/,'').trim();if(!l)return;
    let parts;
    if(/\|/.test(l)){parts=l.replace(/^\s*\|/,'').replace(/\|\s*$/,'').split('|').map(c=>c.trim());}
    else{parts=[l];}
    if(parts.join('|').replace(/[\s|:-]/g,'')==='')return;            // 跳过 |---|---| 分隔行
    if(parts.some(c=>HEADER_TOKENS.includes(c)))return;
    if(parts.length<2)return; // 跳过合并单元格产生的单列行（跨列表头等），避免误判为功能项
    items.push({name:parts[0]||l,desc:parts[1]||'',priority:parts[2]&&['P0','P1','P2','P3','P4'].includes(parts[2])?parts[2]:'',status:parts[3]||''});
  });return items;}
  if(type==='accept'){return body.split(/\n+/).filter(l=>l.trim()).map(l=>{l=l.replace(/^[-*]\s*/,'').trim();let st='na';const m=l.match(/^[\[【]?([✓✗○×])[\]】]?\s*/);if(m){const c=m[1];if(c==='✓'||c==='√')st='pass';else if(c==='✗'||c==='×')st='fail';l=l.replace(/^[\[【]?([✓✗○×])[\]】]?\s*/,'');}return {text:l,status:st,id:uid()};});}
  if(type==='users'){const items=[];const re=/作为(.+?)我希望(.+?)以便(.+)/;body.split(/\n+/).forEach(l=>{const m=l.match(re);if(m)items.push({role:m[1].trim(),want:m[2].trim(),soThat:m[3].trim()});});return items;}
  return [];
}
// 自动生成：按文档标题层级（#/##/### 作节，#### 及以下作小卡片）与排版直接生成框架结构与内容
// 兼容常见非 Markdown 标题：纯文本编号标题（1. 目的 / 1.1 功能 / 一、适用范围）与"其他"等已知节名
function parseAutoGen(text){
  text=stripWordCssNoise(text);
  const stripNum=t=>t.replace(/^\s*(?:\d+(?:\.\d+)*)[.、)]\s*/,'').trim();
  const stripCNNum=t=>t.replace(/^\s*[一二三四五六七八九十]+[、.]\s*/,'').trim();
  const lines=(text||'').split(/\r?\n/);
  // v17.4：跳过 Word 自动目录块（「目录」标题到第一个真正的 # 标题之间的条目都是目录项，不是正文标题）
  (function skipToc(){
    let tocIdx=-1;
    for(let i=0;i<lines.length;i++){
      const t=lines[i].trim().replace(/^#{1,6}\s+/,'').replace(/^\s*(?:\d+(?:\.\d+)*)[、.)]\s*/,'').trim();
      if(t==='目录'||t==='目 录'||/^contents/i.test(t)){tocIdx=i;break;}
    }
    if(tocIdx<0)return;
    let end=lines.length;
    for(let i=tocIdx+1;i<lines.length;i++){
      if(/^#{1,6}\s/.test(lines[i])){end=i;break;}
    }
    if(end<lines.length)lines.splice(tocIdx,end-tocIdx);
  })();
  // v17.4：只要文本里有真正的 # 标题（样式识别出的），就不再启用"编号行/已知节名"兜底，
  // 避免把正文里的编号列表行、目录残留误当标题
  const hasMarkdownHeadings=lines.some(l=>/^#{1,6}\s/.test(l));
  // v17.5：存在 #/## 大标题时，### 子标题作为父节的小卡片（保留"大标题→子标题"层级）
  const hasH12=lines.some(l=>/^#{1,2}\s/.test(l));
  const sections=[];let cur=null,curCard=null,preamble=[];
  // 已知的 PRD 常见节名（含"其他"），用于识别无编号/无 # 的标题行
  const KNOWN_SECTIONS=['目的','适用范围','范围','定义','术语','产品信息','功能需求','功能点','非功能需求','自测','埋点','界面','验收','上线','其他','附录','背景','概述','需求背景','产品概述','总体描述','术语定义','参考资料','相关文档','变更历史','文档变更历史','更新记录','修订记录'];
  function isKnownTitle(s){
    const t=s.replace(/^[（(【\[]?[一二三四五六七八九十\d]+[、.．）)\]）]?\s*/,'').trim();
    return KNOWN_SECTIONS.includes(t)||KNOWN_SECTIONS.some(k=>t.indexOf(k)===0);
  }
  for(const line of lines){
    const m=line.match(/^(#{1,6})\s+(.*)$/);
    // 非 Markdown 标题：编号标题（数字或中文数字）或已知节名，且行较短（更像标题而非正文）
    let alt=null;
    if(!m&&!hasMarkdownHeadings){
      const t=line.trim();
      if(t&&t.length<=40){
        if(/^\d+(\.\d+)*[、.．)）]\s*\S/.test(t)||/^[一二三四五六七八九十]+[、.．]\s*\S/.test(t)){
          const level=(t.match(/^(\d+)/)?t.match(/^(\d+)/)[1].split('.').length:2);
          alt={level:level<=2?2:3,raw:t};
        }else if(isKnownTitle(t)){
          alt={level:2,raw:t};
        }
      }
    }
    if(m||alt){
      const level=m?m[1].length:alt.level;
      const raw=m?(m[2]||'').trim():alt.raw;
      if(!raw)continue;
      if(level<=2||(level===3&&!hasH12)){ // 1-2 级为框架节；无 #/## 大标题时 3 级也作节（纯加粗文档兜底）
        cur={title:stripNum(stripCNNum(raw)),type:'text',html:'',cards:[]};sections.push(cur);curCard=null;
      }else{ // 有 #/## 大标题时的 ### 子标题、以及 4 级及以下 → 当前节的小卡片
        if(!cur){cur={title:'概述',type:'text',html:'',cards:[]};sections.push(cur);}
        curCard={id:uid(),title:stripNum(stripCNNum(raw)),html:'',lines:[]};cur.cards.push(curCard);
      }
    }else{
      if(curCard)curCard.lines.push(line);
      else if(cur){cur._body=cur._body||[];cur._body.push(line);}
      else preamble.push(line);
    }
  }
  const pb=preamble.join('\n').trim();
  if(pb)sections.unshift({title:'概述',type:'text',html:importBodyToHtml(pb),cards:[]});
  sections.forEach(s=>{
    if(!s.html){s.html=importBodyToHtml((s._body||[]).join('\n').trim());delete s._body;}
    (s.cards||[]).forEach(c=>{c.html=importBodyToHtml((c.lines||[]).join('\n').trim());delete c.lines;});
  });
  return sections;
}
// 自动生成导入：直接按标题建框架节并填充内容（可能误判，提示用户核对）
function autoGenImport(text){
  const secs=parseAutoGen(text);
  if(!secs.length){toast('未识别到可导入的标题（需含 #~### 标题）');return;}
  const fw=[],data={};
  secs.forEach((s,i)=>{
    const sid='ag'+(i+1);
    // v17.17：按标题关键词给自动节补「必填」语义，导入/示例文档也能触发 R-SPEC-01 红线（此前全部 required:false → 完成度恒 100%）
    const t=String(s.title||'').replace(/\s/g,'');
    const required=/目的|背景|简介|概述|目标|范围|边界|功能需求|功能点|非功能|性能|安全|可用性|接口|验收|自测|测试标准|用户|使用者|角色|场景|风险|权限/.test(t);
    fw.push({id:sid,title:s.title,type:'text',required:required,weight:1});
    data[sid]={html:s.html,cards:s.cards};
  });
  const p=currentProj();
  STATE.framework=fw;p.framework=fw;p.data=data;p.autoGen=true;DATA=data;
  save();render();
  toast('已按文档标题自动生成 '+fw.length+' 个框架节（可能误判/漏分，请核对）');
}
function htmlToText(h){if(!h)return'';const d=document.createElement('div');d.innerHTML=h;return (d.textContent||'').replace(/\s*\n\s*/g,'\n').replace(/[ \t]{2,}/g,' ').trim();}
function mdTableToHtml(rows){
  const data=rows.filter(r=>!/^\s*\|[\s:|-]+\|\s*$/.test(r));
  if(!data.length)return '';
  const splitRow=r=>r.replace(/^\s*\|/,'').replace(/\|\s*$/,'').split('|').map(c=>c.trim());
  let html='<table class="resp-table">';
  data.forEach((r,idx)=>{
    const cells=splitRow(r);
    html+='<tr>'+cells.map(c=>'<t'+(idx===0?'h':'d')+'>'+esc(c)+'</t'+(idx===0?'h':'d')+'>').join('')+'</tr>';
  });
  html+='</table>';
  return html;
}
// 把 Markdown 图片语法 ![alt](url "title") 安全转成 <img>（仅允许安全协议/相对路径）
function mdImgTag(m){
  const alt=m[1]||'',src=m[2]||'',title=m[3]||'';
  const safe=/^(https?:|data:|blob:)/i.test(src)||!/:[^/]/.test(src); // 允许 http(s)/data/blob 与相对路径，拦截 javascript: 等
  if(!safe)return esc(m[0]);
  return '<img src="'+esc(src)+'" alt="'+esc(alt)+'"'+(title?' title="'+esc(title)+'"':'')+' class="resp-img">';
}
// 行内 Markdown 图片：转换图片，其余文字 escape
// 行内富文本：同一遍扫描同时转换 Markdown 图片 ![alt](url) 与内联 HTML <img>，
// 避免先转义再插入导致的二次转义；URL 允许内含一对括号(如 photo(1).png)
function lineRich(line){
  let out='',last=0;
  const re=/!\[([^\]]*)\]\(((?:[^()\s]|\([^()]*\))*)(?:\s+"([^"]*)")?\)|<img\b([^>]*)>/gi;
  let m;
  while((m=re.exec(line))){
    out+=esc(line.slice(last,m.index));
    if(m[1]!==undefined){ out+=mdImgTag([null,m[1],m[2],m[3]]); }
    else {
      const sm=m[4].match(/src=["']([^"']+)["']/i);
      const src=sm?sm[1]:'';
      const safe=/^(https?:|data:|blob:)/i.test(src)||!/:[^/]/.test(src);
      if(sm&&safe)out+='<img src="'+esc(src)+'" alt="" class="resp-img">';
      else out+=esc(m[0]);
    }
    last=re.lastIndex;
  }
  out+=esc(line.slice(last));
  return out;
}
// 把「导入得到的纯文本/类 Markdown 正文」渲染成可显示的 HTML：
//  - <img src=...>（仅 data:/http(s):/blob:）内联为图片
//  - ![alt](url) Markdown 图片语法 → <img>
//  - 连续的 | 表格行 渲染为 <table>
//  - 其余按段落合并
// 去掉从 Word 另存为 HTML 粘贴过来的 CSS 噪声：行内 style 块、/* Style Definitions */ 注释、
// "120 Normal 0 7.8 磅 0 2 false ... EN-US ZH-CN X-NONE" 这种默认样式参数头、
// 以及形如 selector { property:value; ... } 的 CSS 规则。
function stripWordCssNoise(text){
  if(!text)return text;
  let s=text.replace(/\/\*\s*Style Definitions\s*\*\/[\s\S]*?\*\/\s*End style\s*\*\//gi,'');
  s=s.replace(/\/\*\s*Style Definitions\s*\*\/[\s\S]*?(?=\n\s*\n|$)/gi,'');
  s=s.replace(/^\s*\d+\s+Normal\s+\d+\s+[\d.]+\s*\u78cb?\s+\d+\s+\d+\s+(?:false|true)\s+(?:false|true)\s+(?:false|true)\s+[A-Z]{2}(-[A-Z]{2,3})?\s+[A-Z]{2}(-[A-Z]{2,3})?\s+(?:X-NONE|[a-z]{2}(-[A-Z]{2})?)\s*$/gim,'');
  s=s.replace(/^[a-zA-Z][a-zA-Z0-9_\\\.\-\*\s,:#\.]*\{[^{}]*\}[^\n]*\n?/gm,'');
  s=s.replace(/\.shape\s*\{[^}]*\}/gi,'');
  s=s.replace(/\bvml\s*\{[^}]*\}/gi,'');
  s=s.replace(/\n{3,}/g,'\n\n');
  return s;
}
function importBodyToHtml(text){
  text=stripWordCssNoise(text);
  const lines=(text||'').split(/\r?\n/);
  let html='';let i=0;
  while(i<lines.length){
    const line=lines[i];
    if(/^\s*<img\b/i.test(line)){
      const m=line.match(/src=["']([^"']+)["']/i);
      if(m&&/^(data:|https?:|blob:)/i.test(m[1]))html+='<div class="imp-img"><img src="'+esc(m[1])+'" alt="" class="resp-img"></div>';
      i++;continue;
    }
    // 整行 Markdown 图片（![alt](url) 或 ![alt](url "title")，URL 允许含一对括号）
    const mdImg=line.match(/^\s*!\[([^\]]*)\]\(((?:[^()\s]|\([^()]*\))*)(?:\s+"([^"]*)")?\)\s*$/);
    if(mdImg){ html+='<div class="imp-img">'+mdImgTag(mdImg)+'</div>'; i++;continue; }
    if(/^\s*\|/.test(line)){
      const tbl=[];
      while(i<lines.length&&/^\s*\|/.test(lines[i])){tbl.push(lines[i]);i++;}
      html+=mdTableToHtml(tbl);
      continue;
    }
    const para=[];
    while(i<lines.length&&!/^\s*<img\b/i.test(lines[i])&&!/^\s*!\[([^\]]*)\]\(((?:[^()\s]|\([^()]*\))*)/.test(lines[i])&&!/^\s*\|/.test(lines[i])){
      const l=lines[i].trim();if(l)para.push(l);i++;
    }
    if(para.length)html+='<p>'+para.map(l=>lineRich(l)).join('<br>')+'</p>';
  }
  return html||'';   // 空正文返回空串，避免把「（空）」当作可见占位文本塞进节体，也避免 isEmpty 误判为已填写
}
function projectMD(p){let out='# '+p.name+'\n\n';const fw=(p&&p.framework)||STATE.framework||DEFAULT_FRAMEWORK;fw.forEach((s,idx)=>{out+='## '+(idx+1)+'. '+(s.title||'')+'\n';const c=p.data[s.id]||sectionEmpty(s.type,s.id);
    if(s.type==='feat'){out+='| 功能点 | 描述 | 优先级 | 状态 |\n|---|---|---|---|\n'+(c.items.map(i=>'| '+(i.name||'')+' | '+(i.desc||'')+' | '+(i.priority||'')+' | '+(i.status||'')+' |').join('\n')||'| | | | |')+'\n\n';}
    else if(s.type==='accept'){out+=(c.items.map(i=>'- [ ] '+i.text+'（'+(i.status==='pass'?'通过':i.status==='fail'?'不通过':'待定')+'）').join('\n')||'- [ ] ')+'\n\n';}
    else if(s.type==='users'){out+=(c.items.map(i=>'作为'+(i.role||'')+'，我希望'+(i.want||'')+'，以便'+(i.soThat||'')+'').join('\n')||'')+'\n\n';}
    else if(s.type==='table'){
      const rows=(c.rows&&c.rows.length)?c.rows:[];
      if(rows.length){
        const heads=rows[0].cells||[];
        // 检测首列是否已是"序号"——若是则不重复加
        const hasSeq=heads[0]&&/^(序号|#|No\.?|number|num|index)$/i.test(String(heads[0]).trim());
        const finalHeads=hasSeq?heads:['序号',...heads];
        out+='| '+finalHeads.map(h=>h||'').join(' | ')+' |\n|'+finalHeads.map(()=>'---').join('|')+'|\n';
        for(let i=1;i<rows.length;i++){
          const r=rows[i]||{cells:[]};
          const cells=(r.cells||[]).slice();
          if(!hasSeq)cells.unshift(String(i));
          out+='| '+finalHeads.map((_,j)=>cells[j]||'').join(' | ')+' |\n';
        }
        out+='\n';
      }
    }
    else{out+=(plainOf(p.data,s.id)||'')+'\n\n';}
    // 小卡片：任意节通用的子标题内容，导出为 ### 子节
    (c.cards||[]).forEach(it=>{out+='### '+(it.title||'小标题')+'\n'+(htmlToText(it.html||'')||'')+'\n\n';});
  });
  return out;
}
function plainOf(data,id){const c=data[id];if(!c)return'';let t='';if(c.items){if(id==='feat')t=c.items.map(i=>(i.name||'')+' '+(i.desc||'')).join('\n');else if(id==='accept')t=c.items.map(i=>(i.text||'')).join('\n');else if(id==='users')t=c.items.map(i=>'作为'+(i.role||'')+'我希望'+(i.want||'')+'以便'+(i.soThat||'')).join('\n');}else{t=(c.html||'');}t+=' '+(c.cards||[]).map(i=>(i.title||'')+' '+htmlToText(i.html||'')).join(' ');return t.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();}
// 统一下载：a.click 在 iframe（资料库在线预览等）里常被沙箱拦截 → 自动降级为「新标签页打开」，用户可另存/复制
function safeDownload(name,blob){
  const url=URL.createObjectURL(blob);
  const inIframe=window.self!==window.top;
  let clicked=false;
  if(!inIframe){
    const a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);
    try{a.click();clicked=true;}catch(e){}
    a.remove();
  }
  if(inIframe||!clicked){
    let win=null;
    try{win=window.open(url,'_blank');}catch(e){}
    if(win)toast('当前为在线预览环境，浏览器限制了自动下载；已在新的标签页打开，请在新页面按 Ctrl+S 或右键另存。');
    else toast('当前在线预览环境无法自动下载：请使用本地文件导出，或在新标签页手动打开。');
  }
  setTimeout(()=>URL.revokeObjectURL(url),60000);
}
function download(name,content,mime){safeDownload(name,new Blob([content],{type:mime||'text/plain;charset=utf-8'}));}
function downloadBytes(name,bytes){safeDownload(name,new Blob([bytes],{type:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'}));}

/* ============ 设置面板 ============ */
function openSettings(tab,preselect){if(tab===undefined||tab===null)tab='prefs';if(['prefs','rules','ai'].indexOf(tab)===-1)tab='rules';setTier(tab==='prefs'?'normal':'advanced');setSettingsTab(tab);renderRulesTab(preselect);renderPrefsTab();openModal('settingsModal');}
function setSettingsTab(tab){document.querySelectorAll('#settingsModal .tabs button').forEach(function(x){x.classList.toggle('active',x.dataset.tab===tab);});if(tab==='rules'||tab==='ai'){var map={rules:'tabRules',ai:'tabAI'};Object.keys(map).forEach(function(k){var el=document.getElementById(map[k]);if(el)el.style.display=(k===tab)?'block':'none';});if(tab==='ai'){try{aiRenderTab();}catch(e){}}}}
function setTier(tier){const n=document.getElementById('tierNormal'),a=document.getElementById('tierAdvanced');if(n)n.style.display=tier==='normal'?'block':'none';if(a)a.style.display=tier==='advanced'?'block':'none';document.querySelectorAll('#settingsModal .set-tier-btn').forEach(b=>b.classList.toggle('on',b.dataset.tier===tier));}
function renderRulesTab(preselect){
  const el=document.getElementById('tabRules');
  let html='<div class="muted" style="margin-bottom:10px">内置判分基线（v16.3 起固定 12 条，不再开放自定义）。判定结果可在各节下钻面板「忽略/已订正」，或点节色块「手动改色」，保留人工审核通道。</div>';
  html+='<table class="tbl"><thead><tr><th>规则</th><th>维度</th><th>判定内容</th><th>等级</th></tr></thead><tbody>';
  STATE.ruleSet.forEach((r,i)=>{
    html+='<tr class="rule-row" data-ri="'+i+'"><td class="r-id">'+esc(r.id)+'</td><td>'+esc(r.dim)+'</td>'+
      '<td>'+esc(r.desc)+(r.threshold!=null?'（阈值 '+r.threshold+'）':'')+'</td>'+
      '<td><span class="pill-st '+(r.level==='red'?'lv-red':'lv-yellow')+'">'+(r.level==='red'?'红':'黄')+'</span></td></tr>';
  });
  html+='</tbody></table>';
  el.innerHTML=html;
  if(preselect){el.querySelectorAll('.rule-row').forEach(r=>{const i=+r.dataset.ri;if(STATE.ruleSet[i]&&STATE.ruleSet[i].id===preselect){r.classList.add('preselect');setTimeout(()=>r.scrollIntoView({block:'center'}),60);}});}
}
function renderFrameworkTab(){
  const el=document.getElementById('tabFramework');if(!el)return;
  let html='<div class="muted" style="margin-bottom:10px">文档框架 = 有序节列表。可增/删/插/排序；改完联动解析、渲染与体检。</div>';
  STATE.framework.forEach((s,i)=>{
    html+='<div class="fw-row" data-fi="'+i+'" draggable="true" title="拖拽可调整节顺序">'+
      '<span class="muted">#'+(i+1)+'</span>'+
      '<input data-act="fw-title" data-i="'+i+'" value="'+esc(s.title)+'">'+
      '<select data-act="fw-type" data-i="'+i+'">'+[['text','文本'],['table','表格'],['feat','功能卡'],['users','用户故事'],['accept','清单'],['timeline','时间线']].map(t=>'<option value="'+t[0]+'"'+(s.type===t[0]?' selected':'')+'>'+t[1]+'</option>').join('')+'</select>'+
      '<label class="muted"><input type="checkbox" class="ck" data-act="fw-req" data-i="'+i+'"'+(s.required?' checked':'')+'>必填</label>'+
      '权重<input type="number" step="0.5" style="width:56px" data-act="fw-w" data-i="'+i+'" value="'+s.weight+'">'+
      '<span class="drag-handle" title="拖动调整顺序" aria-label="拖动排序"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="9" cy="6" r="1.7"/><circle cx="15" cy="6" r="1.7"/><circle cx="9" cy="12" r="1.7"/><circle cx="15" cy="12" r="1.7"/><circle cx="9" cy="18" r="1.7"/><circle cx="15" cy="18" r="1.7"/></svg></span><span class="ord"><button data-act="fw-ins" data-i="'+i+'">插</button><button data-act="fw-del" data-i="'+i+'" class="muted">删</button></span>'+
      '</div>';
  });
  html+='<div class="row-act"><button data-act="fw-add">＋ 新增节</button><button data-act="fw-autosort">自动排序（回预设序）</button><button data-act="resetframework">恢复默认框架</button><button data-act="fw-saveas">另存为自定义框架</button><button data-act="exportframework">导出框架 JSON</button><button data-act="importframework">导入框架 JSON</button></div>';
  el.innerHTML=html;
}
function moveArrayItem(arr,from,dest){
  if(from===dest)return false;
  if(from<0||from>=arr.length)return false;
  if(dest<0)dest=0;
  if(dest>arr.length)dest=arr.length;
  const [m]=arr.splice(from,1);
  const insertAt=from<dest?dest-1:dest;
  arr.splice(insertAt,0,m);
  return true;
}
function reorderSection(fromIdx,toIdx){
  const arr=STATE.framework;
  if(!arr||fromIdx<0||fromIdx>=arr.length)return;
  const dest=toIdx<0?0:(toIdx>arr.length?arr.length:toIdx);
  if(!moveArrayItem(arr,fromIdx,dest))return;
  const p=currentProj();if(p)p.framework=deep(arr);
  save();
  try{renderFrameworkTab();}catch(e){}
  if(currentProj())render();
}
// ---- M4 大纲滚动高亮 ----
function watchTocScroll(){
  if(window.__tocObserver){try{window.__tocObserver.disconnect();}catch(e){}window.__tocObserver=null;}
  const toc=document.getElementById('toc');if(!toc)return;
  const secs=document.querySelectorAll('#content .section-card');
  if(!secs.length)return;
  const links={};
  toc.querySelectorAll('a[data-tocid]').forEach(a=>links[a.dataset.tocid]=a);
  function setActive(id){
    toc.querySelectorAll('a.active').forEach(a=>a.classList.remove('active'));
    const a=links[id];if(a)a.classList.add('active');
  }
  if('IntersectionObserver' in window){
    const obs=new IntersectionObserver(es=>{
      let best=null,bestRatio=-1;
      es.forEach(en=>{if(en.isIntersecting&&en.intersectionRatio>bestRatio){bestRatio=en.intersectionRatio;best=en.target;}});
      if(best){const id=(best.id||'').replace(/^sec-/,'');setActive(id);}
    },{rootMargin:'-12% 0px -70% 0px',threshold:[0,0.1,0.3,0.6]});
    secs.forEach(el=>obs.observe(el));
    window.__tocObserver=obs;
  }else{
    const onScroll=()=>{
      let best=null,bestTop=-1;
      secs.forEach(el=>{const r=el.getBoundingClientRect();if(r.top<window.innerHeight*0.4&&r.top>bestTop){bestTop=r.top;best=el;}});
      if(best)setActive((best.id||'').replace(/^sec-/,''));
    };
    window.addEventListener('scroll',onScroll,{passive:true});
    onScroll();
  }
  if(!toc.querySelector('a.active')){const a=toc.querySelector('a[data-tocid]');if(a)setActive(a.dataset.tocid);}
}
// ---- M2 节拖拽排序（TOC 侧边栏 + 框架管理页共用） ----
let __dragFrom=null,__dragType=null;
function bindTocDrag(){
  if(window.__tocDragBound)return;
  window.__tocDragBound=true;
  function clearDragUI(){
    document.querySelectorAll('.dragging,.drag-over-before,.drag-over-after').forEach(x=>x.classList.remove('dragging','drag-over-before','drag-over-after'));
  }
  document.addEventListener('dragstart',e=>{
    const t=e.target;
    if(t.closest&&t.closest('input,select,button,textarea,a[href="#"]')){e.preventDefault();return;} // 控件/纯锚点不触发拖拽（允许输入框内选词）
    const a=t.closest?t.closest('a[data-tocid]'):null;
    const r=t.closest?t.closest('.fw-row[data-fi]'):null;
    if(!a&&!r)return;
    if(a&&editing){e.preventDefault();toast('请先完成编辑，再拖拽调整节顺序');return;}
    if(a){__dragType='toc';__dragFrom=a.dataset.tocid;try{e.dataTransfer.setData('text/plain',a.dataset.tocid);e.dataTransfer.effectAllowed='move';}catch(err){}a.classList.add('dragging');}
    else{__dragType='fw';__dragFrom=+r.dataset.fi;try{e.dataTransfer.setData('text/plain',String(r.dataset.fi));e.dataTransfer.effectAllowed='move';}catch(err){}r.classList.add('dragging');}
  });
  document.addEventListener('dragover',e=>{
    if(!__dragType)return;
    const t=e.target;
    const target=__dragType==='toc'?(t.closest?t.closest('a[data-tocid]'):null):(t.closest?t.closest('.fw-row[data-fi]'):null);
    if(!target)return;
    e.preventDefault();
    if(e.dataTransfer)e.dataTransfer.dropEffect='move';
    clearDragUI();
    const rect=target.getBoundingClientRect();
    const before=e.clientY<rect.top+rect.height/2;
    target.classList.add(before?'drag-over-before':'drag-over-after');
  });
  document.addEventListener('drop',e=>{
    if(!__dragType)return;
    const t=e.target;
    const target=__dragType==='toc'?(t.closest?t.closest('a[data-tocid]'):null):(t.closest?t.closest('.fw-row[data-fi]'):null);
    clearDragUI();
    if(!target){__dragType=null;__dragFrom=null;return;}
    e.preventDefault();
    const rect=target.getBoundingClientRect();
    const before=e.clientY<rect.top+rect.height/2;
    let fromIdx=-1,toIdx=-1;
    if(__dragType==='toc'){
      fromIdx=STATE.framework.findIndex(s=>s.id===__dragFrom);
      toIdx=STATE.framework.findIndex(s=>s.id===target.dataset.tocid);
    }else{
      fromIdx=__dragFrom;toIdx=+target.dataset.fi;
      const inEditor=target.closest?target.closest('#fwEditList'):null;
      if(inEditor&&typeof fwEditorBuf!=='undefined'&&fwEditorBuf&&fromIdx>=0&&fromIdx<fwEditorBuf.length){
        if(moveArrayItem(fwEditorBuf,fromIdx,toIdx+(before?0:1))){
          try{renderFwEditor();}catch(e){}
        }
        __dragType=null;__dragFrom=null;
        return;
      }
    }
    if(fromIdx>=0&&toIdx>=0)reorderSection(fromIdx,toIdx+(before?0:1));
    __dragType=null;__dragFrom=null;
  });
  document.addEventListener('dragend',()=>{clearDragUI();__dragType=null;__dragFrom=null;});
}
function sectionTitle(id){const s=STATE.framework.find(x=>x.id===id);return s?s.title:id;}
function renderPrefsTab(){
  const el=document.getElementById('tabPrefs');if(!el)return;
  const opts=[['compact','紧凑'],['standard','标准'],['comfortable','宽松']];
  const labels={compact:'紧凑：减少留白，便于快速浏览',standard:'标准：兼顾阅读与信息密度',comfortable:'宽松：增加留白，适合长时间阅读'};
  let html='<div class="muted" style="margin-bottom:10px">以下外观设置仅本机生效，刷新后保留。</div>'
    +'<div class="muted" style="margin-bottom:10px">面板密度影响卡片留白与信息密度。<span id="densityCurrent" class="dens-current" aria-live="polite">当前：'+labels[STATE.density||'standard']+'</span></div><div class="dens-row" role="group" aria-label="面板密度">';
  opts.forEach(o=>{const on=STATE.density===o[0];html+='<button type="button" class="dens-btn'+(on?' on':'')+'" data-act="setdensity" data-v="'+o[0]+'" aria-pressed="'+(on?'true':'false')+'">'+o[1]+'</button>';});
  html+='</div>';
  // 主题选择器由 theme-controller 统一注入，避免与设置页重复渲染两套入口。
  el.innerHTML=html;
  var curT=document.documentElement.dataset.theme||'brand';
  el.querySelectorAll('.theme-opt').forEach(function(b){b.classList.toggle('on',b.dataset.t===curT);});
}
function setDensity(v){
  const labels={compact:'紧凑：减少留白，便于快速浏览',standard:'标准：兼顾阅读与信息密度',comfortable:'宽松：增加留白，适合长时间阅读'};
  if(!labels[v])return;
  STATE.density=v;
  document.body.setAttribute('data-density',v);
  document.querySelectorAll('#tabPrefs .dens-btn').forEach(function(btn){const on=btn.dataset.v===v;btn.classList.toggle('on',on);btn.setAttribute('aria-pressed',on?'true':'false');});
  const current=document.getElementById('densityCurrent');if(current)current.textContent='当前：'+labels[v];
  save();
  toast('已切换为'+(v==='compact'?'紧凑':v==='comfortable'?'宽松':'标准')+'密度');
}

let resetScope='';
const RESET_LOCAL_KEYS={templateDraft:'prdKanbanTplDraftV1',templateCustom:'prdKanbanTplCustom',theme:'prdKanbanTheme',aiSettings:'prdKanbanAiSettings',preImport:'prdKanbanStateV3.preimport'};
const RESET_META={
  projects:{label:'仅项目',remove:['所有项目与分组','项目中的 PRD 正文、AI 记录和版本','自动恢复备份与导入前恢复点'],keep:['自定义框架预设','模板草稿与自定义模板','界面主题与密度','AI 服务设置与 API Key']},
  projectsTemplates:{label:'项目 + 模板',remove:['所有项目与分组','项目中的 PRD 正文、AI 记录和版本','自动恢复备份与导入前恢复点','自定义框架预设、模板草稿和自定义模板'],keep:['界面主题与密度','AI 服务设置与 API Key']},
  all:{label:'全部本地数据',remove:['所有项目、分组和全部恢复点','自定义框架预设、模板草稿和自定义模板','界面主题与密度','AI 服务设置与 API Key'],keep:['无；下次打开将按全新本地环境开始']}
};
function resetSummaryHtml(scope){const meta=RESET_META[scope];if(!meta)return '请选择一个重置范围，查看具体影响后再确认。';return '<b>将执行：'+meta.label+'</b><ul><li><b>会删除：</b>'+meta.remove.join('；')+'</li><li><b>会保留：</b>'+meta.keep.join('；')+'</li></ul>';}
function openResetModal(){resetScope='';const summary=document.getElementById('resetSummary');if(summary){summary.className='reset-summary empty';summary.textContent='请选择一个重置范围，查看具体影响后再确认。';}document.querySelectorAll('#resetModal .reset-choice').forEach(function(btn){btn.classList.remove('selected');btn.setAttribute('aria-checked','false');});const confirmBtn=document.getElementById('resetConfirm');if(confirmBtn){confirmBtn.disabled=true;confirmBtn.textContent='选择范围后确认';}openModal('resetModal');}
function pickResetScope(scope){if(!RESET_META[scope])return;resetScope=scope;document.querySelectorAll('#resetModal .reset-choice').forEach(function(btn){const on=btn.dataset.scope===scope;btn.classList.toggle('selected',on);btn.setAttribute('aria-checked',on?'true':'false');});const summary=document.getElementById('resetSummary');if(summary){summary.className='reset-summary';summary.innerHTML=resetSummaryHtml(scope);}const confirmBtn=document.getElementById('resetConfirm');if(confirmBtn){confirmBtn.disabled=false;confirmBtn.textContent='确认删除：'+RESET_META[scope].label;}}
function resetFreshState(keepFrameworkPresets){const next=seedState();const old=STATE||{};next.density=['compact','standard','comfortable'].indexOf(old.density)>=0?old.density:'standard';next.seenWizard=!!old.seenWizard;if(keepFrameworkPresets&&Array.isArray(old.frameworkPresets)&&old.frameworkPresets.length)next.frameworkPresets=deep(old.frameworkPresets);return next;}
function resetLocalData(scope){
  if(!RESET_META[scope])return false;
  try{
    if(scope==='all'){
      [STORAGE_KEY,STORAGE_KEY+'.bak',RESET_LOCAL_KEYS.preImport,RESET_LOCAL_KEYS.templateDraft,RESET_LOCAL_KEYS.templateCustom,RESET_LOCAL_KEYS.theme,RESET_LOCAL_KEYS.aiSettings].forEach(function(key){localStorage.removeItem(key);});
      STATE=seedState();
      document.body.setAttribute('data-density','standard');
      document.documentElement.dataset.theme='brand';
      const darkStyle=document.getElementById('dark-neumorphism');if(darkStyle)darkStyle.disabled=true;
      updateStorageAdvice('{}');
    }else{
      STATE=resetFreshState(scope==='projects');
      localStorage.removeItem(STORAGE_KEY+'.bak');localStorage.removeItem(RESET_LOCAL_KEYS.preImport);
      if(scope==='projectsTemplates'){localStorage.removeItem(RESET_LOCAL_KEYS.templateDraft);localStorage.removeItem(RESET_LOCAL_KEYS.templateCustom);}
      document.body.setAttribute('data-density',STATE.density);
      save();
    }
    refreshData();render();closeModal('resetModal');resetScope='';toast('已重置：'+RESET_META[scope].label);return true;
  }catch(error){toast('重置失败：'+(error&&error.message||error));return false;}
}

/* ============ 模态 ============ */
function openModal(id){document.getElementById(id).classList.add('open');}
function closeModal(id){document.getElementById(id).classList.remove('open');}
/* ============ 首开向导（R-18） ============ */
let wzStep=0;
function openWizard(){wzStep=0;showWzStep();openModal('wizardModal');}
function showWzStep(){
  document.querySelectorAll('#wizardModal .wz-step').forEach(p=>{p.style.display=(+p.dataset.step===wzStep)?'block':'none';});
  const prev=document.getElementById('wzPrev'),next=document.getElementById('wzNext'),start=document.getElementById('wzStart');
  if(prev)prev.style.visibility=wzStep>0?'visible':'hidden';
  if(next)next.style.display='none';
  if(start)start.style.display='inline-block';
}
function wzNext(){showWzStep();}
function wzPrev(){if(wzStep>0){wzStep--;showWzStep();}}
function wzFinish(){STATE.seenWizard=true;save();closeModal('wizardModal');}

/* ============ 事件 ============ */
function bindStatic(){
  document.addEventListener('click',e=>{
    const edT=e.target.closest('.editable[data-act="editable"],.sub-card-body[data-act="cardbody"]');if(edT)lastEdEl=edT;
    const t=e.target.closest('[data-act]');if(!t)return;const act=t.dataset.act;const id=t.dataset.id;
    if(MUT.has(act))pushUndo();
    switch(act){
      case 'toggleproj':document.getElementById('projPanel').classList.toggle('open');break;
      case 'switchproj':switchProject(id);break;
      case 'newproj':{renderNewProjFrameworks();openModal('newProjModal');break;}
      case 'doCreateProject':{const n=document.getElementById('npName').value.trim();const fwId=document.getElementById('npFramework').value;createProject(n,fwId);closeModal('newProjModal');break;}
      case 'np-pick':{const sel=document.getElementById('npFramework');if(sel){sel.value=t.dataset.fwid;refreshFwPickSel();}break;}
      case 'np-edit':{openFwEditorFromPreset(t.dataset.fwid);break;}
      case 'np-autogen':{const sel=document.getElementById('npFramework');if(sel){sel.value='__AUTO__';refreshFwPickSel();}break;}
      case 'np-newfw':{openFwEditor([],{context:'newproj',sourceId:null,baseName:'自建框架',saveAs:false});break;}
      case 'np-del':{const delId=t.dataset.fwid;const pr=(STATE.frameworkPresets||[]).find(x=>x.id===delId);const nm=pr?pr.name:'该框架';if(!confirm('确定删除框架「'+nm+'」？\n删除后将从框架列表中移除（已用此框架建过的项目不受影响）。'))break;STATE.frameworkPresets=(STATE.frameworkPresets||[]).filter(x=>x.id!==delId);const sel=document.getElementById('npFramework');if(sel&&sel.value===delId)sel.value='';save();renderNewProjFrameworks();toast('已删除框架「'+nm+'」');break;}
      case 'toggleprojpanel':{const pp=document.getElementById('projPanel');if(!pp)break;const on=pp.classList.toggle('open');pp.dataset.open=on?'1':'0';break;}
      case 'togglegroup':{const gid=t.dataset.gid;if(!STATE.groupOpen)STATE.groupOpen={};STATE.groupOpen[gid]=!STATE.groupOpen[gid];save();const grp=t.closest('.pp-grp');if(grp){grp.classList.toggle('open',!!STATE.groupOpen[gid]);const gb=grp.querySelector('.pp-grp-body');if(gb)gb.style.display=STATE.groupOpen[gid]?'':'none';}break;}
      case 'grp-add':{const n=prompt('新分组名称：','');if(n===null)break;const name=(n||'').trim();if(!name){toast('名称不能为空');break;}STATE.groups=STATE.groups||[];STATE.groups.push({id:uid(),name:name});save();const pp=document.getElementById('projPanel');if(pp)pp._keepOpen=true;renderSidebar();toast('已创建分组「'+name+'」');break;}
      case 'grp-rename':{const gid=t.dataset.gid;const g=(STATE.groups||[]).find(x=>x.id===gid);if(!g)break;renameCtx={type:'grp',id:gid};document.getElementById('rnTitle').textContent='重命名分组';document.getElementById('rnLabel').textContent='分组名称';document.getElementById('rnName').value=g.name;openModal('renameModal');break;}
      case 'grp-del':{const gid=t.dataset.gid;const g=(STATE.groups||[]).find(x=>x.id===gid);if(!g)break;if(!confirm('删除分组「'+g.name+'」？组内项目将移回未分组。'))break;STATE.projects.forEach(p=>{if(p.groupId===gid)p.groupId=undefined;});STATE.groups=STATE.groups.filter(x=>x.id!==gid);if(STATE.groupOpen)delete STATE.groupOpen[gid];save();const pp=document.getElementById('projPanel');if(pp)pp._keepOpen=true;renderSidebar();toast('已删除分组「'+g.name+'」');break;}
      case 'renameproj':{closeProjMenu();renameCtx={type:'proj',id};const p=STATE.projects.find(x=>x.id===id);document.getElementById('rnTitle').textContent='重命名项目';document.getElementById('rnLabel').textContent='项目名称';document.getElementById('rnName').value=p?p.name:'';openModal('renameModal');break;}
      case 'projctx':{closeProjMenu();ctxEditId=id;const pj=STATE.projects.find(x=>x.id===id);const c=(pj&&pj.context)||{};const cv=function(el,v){if(el)el.value=v||'';};cv(document.getElementById('ctxType'),c.type);cv(document.getElementById('ctxUsers'),c.users);cv(document.getElementById('ctxPlatform'),c.platform);cv(document.getElementById('ctxCompetitors'),c.competitors);cv(document.getElementById('ctxTech'),c.techDeps);cv(document.getElementById('ctxGoals'),c.goals);openModal('ctxModal');break;}
      case 'projctx-save':{const pj=STATE.projects.find(x=>x.id===ctxEditId);if(!pj)break;pj.context={type:(document.getElementById('ctxType')||{}).value||'',users:(document.getElementById('ctxUsers')||{}).value||'',platform:(document.getElementById('ctxPlatform')||{}).value||'',competitors:(document.getElementById('ctxCompetitors')||{}).value||'',techDeps:(document.getElementById('ctxTech')||{}).value||'',goals:(document.getElementById('ctxGoals')||{}).value||''};save();closeModal('ctxModal');toast('项目上下文已保存');break;}
      case 'multireview':rvOpen();break;
      case 'rvpick':{closeModal('reviewPickModal');switchProject(t.dataset.id);rvOpen();break;}
      case 'rvhist':rvShowHistory(+t.dataset.i);break;
      case 'rvback':{const rs=document.getElementById('rvResult');if(rs)rs.innerHTML='';break;}
      case 'rvdel':{const pj=currentProj(),r=pj&&pj.reviews&&pj.reviews[+t.dataset.i];if(pj&&r){rvRemoveReviewComments(pj,r.id);pj.reviews.splice(+t.dataset.i,1);save();rvRenderHistory();const rs=document.getElementById('rvResult');if(rs)rs.innerHTML='';toast('已删除该次评审及其 AI 评论');}break;}
      case 'rvclear':{const pj=currentProj();if(pj&&pj.reviews&&pj.reviews.length&&confirm('确定清空该项目全部评审历史及其 AI 评论？')){pj.reviews.forEach(function(r){rvRemoveReviewComments(pj,r.id);});pj.reviews=[];save();rvRenderHistory();const rs=document.getElementById('rvResult');if(rs)rs.innerHTML='';toast('已清空评审历史及其 AI 评论');}break;}
      case 'rvcomments':openCommentsPanel();break;
      case 'rvautofix':rvOptimizeReview(+t.dataset.i);break;
      case 'review-go':rvRun();break;case 'np-rename':{const fwId=t.dataset.fwid;const pr=(STATE.frameworkPresets||[]).find(x=>x.id===fwId);if(!pr){toast('框架不存在');break;}renameCtx={type:'fw',id:fwId};document.getElementById('rnTitle').textContent='重命名框架';document.getElementById('rnLabel').textContent='框架名称';document.getElementById('rnName').value=pr.name||'';openModal('renameModal');break;}
      case 'doRename':{const n=document.getElementById('rnName').value.trim();if(!n){toast('名称不能为空');break;}if(renameCtx.type==='proj'){renameProject(renameCtx.id,n);}else if(renameCtx.type==='fw'){const pr=(STATE.frameworkPresets||[]).find(x=>x.id===renameCtx.id);if(pr){pr.name=n;save();renderNewProjFrameworks();toast('已重命名框架「'+n+'」');}}else if(renameCtx.type==='grp'){const g=(STATE.groups||[]).find(x=>x.id===renameCtx.id);if(g){g.name=n;save();renderSidebar();toast('已重命名分组「'+n+'」');}}closeModal('renameModal');break;}
      case 'delproj':{closeProjMenu();const p=STATE.projects.find(x=>x.id===id);if(p&&confirm('确定删除项目「'+p.name+'」？此操作不可撤销。'))deleteProject(id);break;}
      case 'gohome':STATE.activeProjectId=null;drillOpen=null;save();render();closeSidebar();break;
      case 'toggleoverview':toggleOverview();break;
      case 'ovsort':ovSortMode=(ovSortMode+1)%3;renderOverview();break;
      case 'ovclose':{const ov=document.getElementById('overviewPanel');if(ov)ov.classList.remove('open');break;}
      case 'ovopen':{
        const ov=document.getElementById('overviewPanel');if(ov)ov.classList.remove('open');
        const pj=STATE.projects.find(x=>x.id===id);
        // v17.24 修复：切换后必须先 refreshData() 再 save()，否则 save() 会把上一个项目的 DATA 覆盖到目标项目（真实数据丢失）
        if(pj&&STATE.activeProjectId!==pj.id){
          try{if(typeof flushSave==='function')flushSave();}catch(e){}
          STATE.activeProjectId=pj.id;drillOpen=null;
          try{refreshData();}catch(e){}
          save();render();
        }
        break;
      }
      case 'sidebartoggle':openSidebar();break;
      case 'sidebarclose':closeSidebar();break;
      case 'expmd':{closeProjMenu();openExportPreflight('md',id);break;}
      case 'expdocx':{closeProjMenu();openExportPreflight('docx',id);break;}
      case 'edit':toggleEdit();break;
      case 'undo':undo();break;
      case 'settings':openSettings();break;
      case 'closemodal':closeModal('newProjModal');closeModal('renameModal');closeModal('pasteModal');closeModal('importPreviewModal');closeModal('importReportModal');closeModal('exportPreflightModal');closeModal('overrideModal');closeModal('resetModal');closeModal('fwDeleteModal');closeModal('backupImportModal');closeModal('settingsModal');closeModal('wizardModal');closeModal('tplModal');closeModal('fwEditModal');closeModal('ctxModal');closeModal('reviewModal');closeModal('reviewPickModal');break;
      case 'drill':toggleDrill(id);break;
      case 'rulelink':openSettings('rules',t.dataset.rule);break;
      case 'setdensity':setDensity(t.dataset.v);break;
      case 'accstatus':{const idx=+t.dataset.idx;const v=t.dataset.val;if(DATA.accept&&DATA.accept.items[idx]){DATA.accept.items[idx].status=v;save();render();}break;}
      case 'exportdocx':openExportPreflight('docx');break;
      case 'tpl':showTpl();break;
      case 'help':openWizard();break;
      case 'copytpl':copyTpl();break;
      case 'tplchoose':tplChoose(t.dataset.tpl);break;
      case 'tpladvanced':tplToggleAdvanced();break;
      case 'tpl-regen':tplRegen();break;
      case 'tpl-preset':tplApplyPreset();break;
      case 'tpl-saveas':tplSaveAsCustom();break;
      case 'tpl-delcustom':tplDeleteCustom();break;
      case 'tpl-save':tplSaveDraft();break;
      case 'tpl-loaddraft':tplLoadDraft();break;
      case 'tpl-importfile':tplImportFile();break;
      case 'tpl-apply':tplApply(false);break;
      case 'tpl-newproj':tplApply(true);break;
      case 'opensec':openSection(id);break;
      case 'wzprev':wzPrev();break;
      case 'wznext':wzNext();break;
      case 'wzfinish':wzFinish();break;
      case 'wz-sample':{loadSample();wzFinish();break;}
      case 'wz-newproj':{wzFinish();renderNewProjFrameworks();openModal('newProjModal');break;}
      case 'wz-ai':{wzFinish();var gmode=t.dataset.genmode||'';if(gmode==='design'){aiDesignOpen();}else if(window.__AICtrl&&window.__AICtrl.openGen){window.__AICtrl.openGen('');}else toast('AI 助手尚未就绪，请稍后再试');break;}
      case 'wz-template':{wzFinish();showTpl();break;}
      case 'wz-import':{wzFinish();document.getElementById('fileInput').click();break;}
      case 'drillmetric':{const hm=document.querySelector('.dash-heatmap');if(hm)hm.scrollIntoView({behavior:'smooth',block:'center'});else toast('点击各节色标查看判分明细');break;}
      case 'dimdrill':{const i=+t.dataset.i;const box=document.getElementById('dimd-'+i);const dim=document.querySelector('.dash-dim[data-i="'+i+'"]');if(!box)break;const opening=box.style.display==='none'||!box.style.display;if(opening){const aiR=currentProj()&&currentProj().ai&&currentProj().ai.lastReport;const d=aiR&&aiR.dimensions&&aiR.dimensions[i];if(d)box.innerHTML=renderDimDetail(d);box.style.display='block';if(dim){dim.classList.add('open');dim.setAttribute('aria-expanded','true');}}else{box.style.display='none';if(dim){dim.classList.remove('open');dim.setAttribute('aria-expanded','false');}}break;}
      case 'gapexpand':{const i=+t.dataset.hi;const row=t.closest('.gap-row');const box=document.getElementById('gapd-'+i);if(!box)break;if(box.style.display==='none'||!box.style.display){const h=HEALTH&&HEALTH.activeHits&&HEALTH.activeHits[i];if(h){const imp=gapImpact(h);box.innerHTML='<div class="gd-why"><b>为什么重要：</b>'+esc(ruleWhy(h.ruleId)||'该问题影响 PRD 质量基线，建议处理')+'</div><div class="gd-adv"><b>交付影响：</b>'+esc(imp.label)+'；'+esc(imp.next)+'</div><div class="gd-adv"><b>改进建议：</b>'+esc((h.advice||'').replace(/\n/g,'<br>'))+'</div>';}box.style.display='table-row';if(row)row.classList.add('open');}else{box.style.display='none';if(row)row.classList.remove('open');}break;}
      case 'goto':{const el=document.getElementById('sec-'+id);if(el)el.scrollIntoView({behavior:'smooth'});if(window.innerWidth<=860)closeSidebar();break;}
      case 'ovmenu':openOverrideQuick(id);break;
      case 'ov-red':closeOverrideQuick();openOverride(id,'red');break;
      case 'ov-yellow':closeOverrideQuick();openOverride(id,'yellow');break;
      case 'ov-green':closeOverrideQuick();openOverride(id,'green');break;
      case 'ov-clear':closeOverrideQuick();clearOverride(id);break;
      case 'doOverride':applyOverride();break;
      case 'corr':setCorr(id,t.dataset.rule,t.dataset.status);break;
      case 'addfeat':{DATA.feat.items.push({name:'',desc:'',priority:'',status:''});save();render();break;}
      case 'delfeat':{DATA.feat.items.splice(+t.dataset.idx,1);save();render();break;}
      case 'addaccept':{DATA.accept.items.push({text:'',status:'na',id:uid()});save();render();break;}
      case 'delaccept':{DATA.accept.items.splice(+t.dataset.idx,1);save();render();break;}
      case 'adduser':{DATA.users.items.push({role:'',want:'',soThat:''});save();render();break;}
      case 'deluser':{DATA.users.items.splice(+t.dataset.idx,1);save();render();break;}
      case 'addcard':{const sec=t.dataset.sec;if(DATA[sec]){if(!DATA[sec].cards)DATA[sec].cards=[];DATA[sec].cards.push({id:uid(),title:'',html:''});save();render();}break;}
      case 'addimg':{const sec=t.dataset.sec;const el=document.querySelector('.editable[data-act="editable"][data-id="'+sec+'"]');if(el)openImgPicker(el);break;}
      case 'addimgcard':{const sec=t.dataset.sec,idx=+t.dataset.idx;const el=document.querySelector('.editable.sub-card-body[data-act="cardbody"][data-sec="'+sec+'"][data-idx="'+idx+'"]');if(el)openImgPicker(el);break;}
      case 'addtbl':{const sec=t.dataset.sec;const el=document.querySelector('.editable[data-act="editable"][data-id="'+sec+'"]');if(el)openTblPicker(el);break;}
      case 'addtblcard':{const sec=t.dataset.sec,idx=+t.dataset.idx;const el=document.querySelector('.editable.sub-card-body[data-act="cardbody"][data-sec="'+sec+'"][data-idx="'+idx+'"]');if(el)openTblPicker(el);break;}
      // v16.5：表格增删行/列统一走右键菜单（doTblOp），不再保留追加按钮 case
      case 'delcard':{const sec=t.dataset.sec;const idx=+t.dataset.idx;if(DATA[sec]&&DATA[sec].cards&&DATA[sec].cards[idx]){DATA[sec].cards.splice(idx,1);save();render();}break;}
      // 把「其他」里的某条标题提升为正式框架节（仅认文档里真正的格式化标题，正文噪声不会进来）
      case 'promotecard':{const sec=t.dataset.sec;const idx=+t.dataset.idx;const c=DATA[sec];if(c&&c.cards&&c.cards[idx]){const card=c.cards[idx];const nid='imp_'+uid();const newSec={id:nid,title:card.title||'新节',type:'text',required:false,weight:1,auto:true};STATE.framework.push(newSec);const p=currentProj();if(p)p.framework.push(newSec);DATA[nid]={html:card.html||'',cards:[]};c.cards.splice(idx,1);save();render();toast('已将「'+(card.title||'新节')+'」转为框架节');}break;}
      case 'promoteall':{const sec=t.dataset.sec;const c=DATA[sec];if(c&&c.cards&&c.cards.length){let n=0;c.cards.slice().forEach(card=>{const nid='imp_'+uid();const newSec={id:nid,title:card.title||'新节',type:'text',required:false,weight:1,auto:true};STATE.framework.push(newSec);const p=currentProj();if(p)p.framework.push(newSec);DATA[nid]={html:card.html||'',cards:[]};n++;});c.cards=[];save();render();toast('已从「其他」生成 '+n+' 个框架节');}break;}
      // 编辑过程中直接管理/增加框架（作用于当前项目，不强制另存为预设）
      case 'managefw':{openFwEditor(STATE.framework,{context:'settings',sourceId:null,baseName:'自定义框架',saveAs:false});break;}
      case 'import':document.getElementById('fileInput').click();break;
      case 'sample':loadSample();break;
      case 'sample-edit':{const id=(STATE.framework.find(function(s){return s.id==='purpose';})||STATE.framework[0]||{}).id;if(!editing)toggleEdit();if(id)setTimeout(function(){openSection(id);},0);break;}
      case 'sample-health':{const dash=document.getElementById('dashboard');if(dash)dash.scrollIntoView({behavior:'smooth',block:'start'});break;}
      case 'sample-rename':{const p=currentProj();if(!p)break;const name=prompt('为此项目命名：',p.name==='示例 PRD'?'我的 PRD':p.name);if(name!==null&&name.trim())renameProject(p.id,name.trim());break;}
      case 'paste':document.getElementById('pasteArea').value='';openModal('pasteModal');break;
      case 'doPaste':{const txt=document.getElementById('pasteArea').value;if(beginImportPreview(txt,'粘贴导入 PRD','粘贴内容'))closeModal('pasteModal');break;}
      case 'importpreviewmode':renderImportPreview();break;
      case 'importpreviewconfirm':applyImportPreview();break;
      case 'showimportreport':openImportReport();break;
      case 'importreport-framework':{closeModal('importReportModal');const p=currentProj();if(p)openFwEditor(p.framework,{context:'settings',sourceId:null,baseName:p.name+' 导入框架',saveAs:false});break;}
      case 'importreport-health':{closeModal('importReportModal');const dash=document.getElementById('dashboard');if(dash)dash.scrollIntoView({behavior:'smooth',block:'start'});break;}
      case 'exportmd':openExportPreflight('md');break;
      case 'exportpreflightconfirm':confirmExportPreflight();break;
      case 'copyhealth':copyHealthSummary();break;
      case 'backup':download('prd-kanban-backup.json',JSON.stringify({app:'prd-kanban',version:3,exportedAt:Date.now(),state:STATE}),'application/json');break;
      case 'importbackup':document.getElementById('fileInputBackup').click();break;
      case 'restorepreimport':restorePreImport();break;
      case 'backupimportconfirm':applyBackupImport();break;
      case 'reset':openResetModal();break;
      case 'resetpick':pickResetScope(t.dataset.scope);break;
      case 'resetconfirm':if(resetScope)resetLocalData(resetScope);break;
      case 'settab':setSettingsTab(t.dataset.tab);break;
      case 'settier':setTier(t.dataset.tier);break;
      case 'fw-title':{STATE.framework[+t.dataset.i].title=t.value;const p=currentProj();if(p)p.framework=deep(STATE.framework);save();break;}
      case 'fw-type':{STATE.framework[+t.dataset.i].type=t.value;const p=currentProj();if(p)p.framework=deep(STATE.framework);save();break;}
      case 'fw-req':{STATE.framework[+t.dataset.i].required=t.checked;const p=currentProj();if(p)p.framework=deep(STATE.framework);save();if(currentProj())refreshHealthUI();break;}
      case 'fw-w':{STATE.framework[+t.dataset.i].weight=+t.value||1;const p=currentProj();if(p)p.framework=deep(STATE.framework);save();break;}
      case 'fw-ins':{STATE.framework.splice(+t.dataset.i+1,0,{id:uid(),title:'新节',type:'text',required:false,weight:1});const p=currentProj();if(p)p.framework=deep(STATE.framework);save();renderFrameworkTab();if(currentProj()){render();}break;}
      case 'fw-del':{STATE.framework.splice(+t.dataset.i,1);const p=currentProj();if(p)p.framework=deep(STATE.framework);save();renderFrameworkTab();if(currentProj())render();break;}
      case 'fw-add':{STATE.framework.push({id:uid(),title:'新节',type:'text',required:false,weight:1});const p=currentProj();if(p)p.framework=deep(STATE.framework);save();renderFrameworkTab();if(currentProj())render();break;}
      case 'fw-autosort':{const order=DEFAULT_FRAMEWORK.map(s=>s.id);STATE.framework.sort((a,b)=>order.indexOf(a.id)-order.indexOf(b.id));const p=currentProj();if(p)p.framework=deep(STATE.framework);save();renderFrameworkTab();if(currentProj())render();toast('已按预设序排序');break;}
      case 'resetframework':{STATE.framework=deep(DEFAULT_FRAMEWORK);const p=currentProj();if(p)p.framework=deep(STATE.framework);save();renderFrameworkTab();if(currentProj())render();toast('已恢复默认框架');break;}
      case 'exportframework':download('prd-framework.json',JSON.stringify(STATE.framework,null,2),'application/json');break;
      case 'fw-saveas':{openFwEditor(STATE.framework,{context:'settings',sourceId:null,baseName:'自定义框架',saveAs:true});break;}
      case 'fwedit-title':{if(fwEditorBuf&&fwEditorBuf[+t.dataset.i])fwEditorBuf[+t.dataset.i].title=t.value;break;}
      case 'fwedit-type':{if(fwEditorBuf&&fwEditorBuf[+t.dataset.i])fwEditorBuf[+t.dataset.i].type=t.value;break;}
      case 'fwedit-req':{if(fwEditorBuf&&fwEditorBuf[+t.dataset.i])fwEditorBuf[+t.dataset.i].required=t.checked;break;}
      case 'fwedit-w':{if(fwEditorBuf&&fwEditorBuf[+t.dataset.i])fwEditorBuf[+t.dataset.i].weight=+t.value||1;break;}
      case 'fwedit-ins':{if(fwEditorBuf)fwEditorBuf.splice(+t.dataset.i+1,0,{id:uid(),title:'新节',type:'text',required:false,weight:1});renderFwEditor();break;}
      case 'fwedit-del':{if(fwEditorBuf)openFwDeleteModal(+t.dataset.i);break;}
      case 'fwedit-add':{if(fwEditorBuf)fwEditorBuf.push({id:uid(),title:'新节',type:'text',required:false,weight:1});renderFwEditor();break;}
      case 'fwedit-cancel':{closeModal('fwEditModal');break;}
      case 'fwdeleteconfirm':{confirmFwDelete();break;}
      case 'fwedit-done':{
        const ctx=fwEditorCtx||{context:'newproj'};
        if(ctx.context==='newproj'){
          const src=(STATE.frameworkPresets||[]).find(x=>x.id===ctx.sourceId);
          let presetId,presetName;
          if(ctx.sourceId&&src&&JSON.stringify(src.framework)===JSON.stringify(fwEditorBuf)){
            presetId=src.id;presetName=src.name;
          }else{
            presetId='custom_'+Date.now().toString(36);
            presetName=(ctx.baseName?ctx.baseName+'（自定义）':'自定义框架')+' '+fwEditorBuf.length+'节';
            if(!STATE.frameworkPresets)STATE.frameworkPresets=[];
            STATE.frameworkPresets.push({id:presetId,name:presetName,framework:deep(fwEditorBuf)});
          }
          save();renderNewProjFrameworks();
          const sel=document.getElementById('npFramework');if(sel)sel.value=presetId;refreshFwPickSel();
          closeModal('fwEditModal');
          toast('已保存框架「'+presetName+'」('+fwEditorBuf.length+' 节)，新建项目时可选中复用');
        }else{
          STATE.framework=deep(fwEditorBuf);const p=currentProj();if(p){applyFwDeleteOps(p);p.framework=deep(fwEditorBuf);}
          if(ctx.saveAs){
            if(!STATE.frameworkPresets)STATE.frameworkPresets=[];
            const pn='自定义框架 '+fwEditorBuf.length+'节';
            STATE.frameworkPresets.push({id:'custom_'+Date.now().toString(36),name:pn,framework:deep(fwEditorBuf)});
          }
          save();renderFrameworkTab();if(currentProj())render();
          closeModal('fwEditModal');
          const deleted=fwEditorDeleteOps.length;fwEditorDeleteOps=[];
          toast('文档框架已更新（'+fwEditorBuf.length+' 节）'+(deleted?('，已处理 '+deleted+' 个删节操作'):'')+(ctx.saveAs?'，并已另存为自定义框架':''));
        }
        break;
      }
      case 'importframework':document.getElementById('frameworkFileInput').click();break;
      case 'addimg-top':{const el=lastEdEl||document.querySelector('.editable[data-act="editable"],.sub-card-body[data-act="cardbody"]');if(!el){toast('请先在正文区点击一下，再插入图片');break;}openImgPicker(el);break;}
      case 'addtbl-top':{const el=lastEdEl||document.querySelector('.editable[data-act="editable"],.sub-card-body[data-act="cardbody"]');if(!el){toast('请先在正文区点击一下，再插入表格');break;}openTblPicker(el);break;}
      case 'tbl-zoom-in':{aiTblZoom(t.dataset.sec,0.1);break;}
      case 'tbl-zoom-out':{aiTblZoom(t.dataset.sec,-0.1);break;}
      case 'tbl-add-col':{aiTblAddCol(t.dataset.sec);break;}
      case 'tbl-add-row':{aiTblAddRow(t.dataset.sec);break;}
      case 'tbl-del-col':{aiTblDelCol(t.dataset.sec);break;}
      case 'tbl-del-row':{aiTblDelRow(t.dataset.sec);break;}
      case 'tbl-export-csv':{download(currentProj().name+'_'+t.dataset.sec+'.csv',aiTblToCSV(t.dataset.sec),'text/csv;charset=utf-8');break;}
      case 'tbl-export-md':{download(currentProj().name+'_'+t.dataset.sec+'.md',aiTblToMD(t.dataset.sec),'text/markdown;charset=utf-8');break;}
      case 'tbl-import-csv':{aiTblImport(t.dataset.sec,'csv');break;}
      case 'tbl-import-md':{aiTblImport(t.dataset.sec,'md');break;}
      case 'comments':openCommentsPanel();break;
    }
  });
  // 顶栏下拉菜单（整合按钮：导入▾ / 导出▾ / 更多▾）
  document.addEventListener('click',e=>{
    const trigger=e.target.closest('.top-dd-trigger');
    if(trigger){
      const menu=trigger.parentElement.querySelector('.top-dd-menu');
      const open=menu&&menu.classList.contains('open');
      document.querySelectorAll('.top-dd-menu.open').forEach(m=>m.classList.remove('open'));
      document.querySelectorAll('.top-dd-trigger[aria-expanded="true"]').forEach(b=>b.setAttribute('aria-expanded','false'));
      if(menu&&!open){menu.classList.add('open');trigger.setAttribute('aria-expanded','true');}
      return;
    }
    if(e.target.closest('.top-dd-menu')){
      document.querySelectorAll('.top-dd-menu.open').forEach(m=>m.classList.remove('open'));
      document.querySelectorAll('.top-dd-trigger[aria-expanded="true"]').forEach(b=>b.setAttribute('aria-expanded','false'));
      return;
    }
    document.querySelectorAll('.top-dd-menu.open').forEach(m=>m.classList.remove('open'));
    document.querySelectorAll('.top-dd-trigger[aria-expanded="true"]').forEach(b=>b.setAttribute('aria-expanded','false'));
  });
  // 双击框架项 → 打开框架编辑器（新建项目界面）
  document.addEventListener('dblclick',e=>{
    if(e.target.closest('button'))return;
    const el=e.target.closest('.fw-pick[data-fwid]');
    if(el&&el.dataset.fwid&&el.dataset.fwid!=='__AUTO__'){openFwEditorFromPreset(el.dataset.fwid);}
  });
  // input 事件（字段编辑：功能点/验收/用户故事 与 小卡片标题 + 表格单元格）
  document.addEventListener('input',e=>{
    const t=e.target.closest('[data-act="field"]');if(!t)return;
    const sec=t.dataset.sec,idx=+t.dataset.idx,key=t.dataset.key;
    const c=DATA[sec];if(!c)return;
    if(c.items&&c.items[idx]){c.items[idx][key]=t.value;markDirty();scheduleSaveHealth();}
    else if(c.cards&&c.cards[idx]){c.cards[idx][key]=t.value;markDirty();scheduleSaveHealth();}
  });
  document.addEventListener('input',e=>{
    const t=e.target.closest('[data-act="tcell"]');if(!t)return;
    const sec=t.dataset.sec,row=+t.dataset.row,col=+t.dataset.col,key=t.dataset.key;
    const c=DATA[sec];if(!c)return;
    // 结构化表格（meta/def/track 等 type:'table'）：写入 c.rows
    if(c.rows&&c.rows[row]&&c.rows[row].cells){
      // 过滤表头里的「删除此列 ×」按钮文本，避免污染单元格内容
      let txt=t.textContent||'';
      const delBtn=t.querySelector&&t.querySelector('.col-del');
      if(delBtn)txt=txt.replace(/\s*×\s*/g,'').trim();
      pushUndoGroup(t); // v18.9：表格单元格编辑入撤销栈（按单元格分组，单步可撤销）
      c.rows[row].cells[col]=txt;
      scheduleSaveHealth();
      return;
    }
    // 富文本节里粘贴/插入的 HTML 表格：找不到 rows 时，向上找最近的可编辑容器整体保存
    const ed=t.closest('[data-act="editable"],[data-act="cardbody"]');
    if(ed)saveEditableEl(ed);
  });
  document.addEventListener('change',e=>{
    const t=e.target.closest('[data-act="field"]');if(t)return; // 已处理
  });
  // 撤销：表单控件聚焦时先快照一次（避免逐键入栈噪声）
  document.addEventListener('focusin',e=>{
    const el=e.target;
    // v18.9：重新聚焦编辑区时重置合并键，使本次编辑会话从新单元开始（首键入即入栈「操作前」快照）
    if(el&&el.dataset&&(el.dataset.act==='editable'||el.dataset.act==='cardbody'||el.dataset.act==='tcell'))_undoGrpKey='';
    if(el&&(el.tagName==='INPUT'||el.tagName==='TEXTAREA'||el.tagName==='SELECT'))pushUndo();
  });
  // v18.7：编辑框失焦时清除「本次编辑已入栈」标记，使下次进入可重新快照（保证应用级撤销能回退文字编辑）
  document.addEventListener('focusout',e=>{ const el=e.target; if(el&&el.matches&&el.matches('.editable[data-act="editable"],.sub-card-body[data-act="cardbody"]'))el._undoPushed=false; });
  // 撤销快捷键 Ctrl/Cmd+Z（输入框聚焦时放行原生文本撤销，避免破坏正在进行的编辑）
  document.addEventListener('keydown',e=>{
    if((e.ctrlKey||e.metaKey)&&(e.key==='z'||e.key==='Z')&&!e.shiftKey){
      const a=document.activeElement;
      const typing=a&&(a.tagName==='INPUT'||a.tagName==='TEXTAREA'||a.tagName==='SELECT')&&!a.readOnly&&!a.disabled;
      // v16.2 修复：contenteditable 正文/卡片内 Ctrl+Z 必须走浏览器原生撤销，
      // 否则会触发应用级 undo()（恢复很久前的快照 + 全量重建 DOM），把刚输入的内容全部清空
      const inRichText=a&&a.isContentEditable;
      if(typing||inRichText)return;
      e.preventDefault();undo();
    }
  });
  // 文件导入
  document.getElementById('fileInput').addEventListener('change',handleFile);
  // v15.8 P4：编辑态下，选中正文文字时浮出迷你格式工具条
  ensureMiniFormatBar();
  document.getElementById('fileInputBackup').addEventListener('change',handleBackup);
  document.getElementById('frameworkFileInput').addEventListener('change',handleFrameworkFile);
  document.getElementById('tplFileInput').addEventListener('change',handleTplFile);
  const tplEditorEl=document.getElementById('tplEditor');
  tplEditorEl.addEventListener('input',tplEditorInput);
  tplEditorEl.addEventListener('paste',tplPasteHandler);
  // v16.1 项目下拉浮层：点击面板外关闭（点击项目切换后自动收起）
  document.addEventListener('click',e=>{
    const pp=document.getElementById('projPanel');if(!pp)return;if(pp._keepOpen){pp._keepOpen=false;return;}
    if(e.target.closest&&e.target.closest('.pp-toggle'))return;
    if(e.target.closest&&e.target.closest('#projPanel')){
      const a=e.target.closest('[data-act]');
      if(a&&a.dataset.act==='switchproj'){pp.classList.remove('open');pp.dataset.open='0';}
      return;
    }
    if(pp.classList.contains('open')){pp.classList.remove('open');pp.dataset.open='0';}
  });
}
let saveTimer=null;
function scheduleSaveHealth(){clearTimeout(saveTimer);saveTimer=setTimeout(()=>{save();if(currentProj())refreshHealthUI();},500);}

let renameCtx={type:'proj',id:null};
let ctxEditId='';
/* P1-② 多角色评审（Mock）：5 角色同模型换 prompt，先模拟评审展示全流程，真实 AI 后端 P2 接入 */
const RV_ROLES=[
  {id:'pm',name:'产品经理',ic:ICONS.target,d:'产品定位、目标、范围与优先级'},
  {id:'rd',name:'研发',ic:ICONS.gear,d:'技术可行性、实现成本与依赖'},
  {id:'qa',name:'测试',ic:ICONS.flask,d:'验收标准、测试覆盖与边界'},
  {id:'design',name:'设计',ic:ICONS.palette,d:'交互体验、多端一致性与反馈'},
  {id:'pjm',name:'项目经理',ic:ICONS.cal,d:'排期、里程碑、风险与资源'}
];
function rvSectionId(name){
  var n=String(name||'').replace(/\s+/g,'').toLowerCase();
  if(!n||/^(全局|global|未定位)/.test(n))return '';
  var exact=(STATE.framework||[]).find(function(s){return String(s.title||'').replace(/\s+/g,'').toLowerCase()===n;});
  var fuzzy=exact||(STATE.framework||[]).find(function(s){var t=String(s.title||'').replace(/\s+/g,'').toLowerCase();return t&&((n.indexOf(t)>=0)||(t.indexOf(n)>=0));});
  return fuzzy?fuzzy.id:'';
}
function rvReviewCommentId(){return 'rv_'+Date.now().toString(36)+Math.floor(Math.random()*100000).toString(36);}
function rvSyncReviewComments(pj,review){
  if(!pj||!review||!review.id)return 0;
  var count=0;
  (review.groups||[]).forEach(function(group){
    var role=group.role||{};
    (group.items||[]).forEach(function(item){
      var sid=rvSectionId(item.sec),cm={id:rvReviewCommentId(),text:String(item.txt||'').trim(),by:'AI 评审 · '+(role.name||'未命名角色'),at:review.at||Date.now(),source:'ai-review',reviewId:review.id,severity:item.sev||'medium',sectionTitle:item.sec||'全局'};
      if(!cm.text)return;
      if(sid){var sec=DATA[sid]||(DATA[sid]={});if(!sec.comments)sec.comments={};sec.comments[cm.id]=cm;}
      else{pj.reviewComments=pj.reviewComments||[];pj.reviewComments.push(cm);}
      count++;
    });
  });
  return count;
}
function rvRemoveReviewComments(pj,reviewId){
  if(!pj||!reviewId)return;
  (STATE.framework||[]).forEach(function(sec){var c=DATA[sec.id];if(c&&c.comments)Object.keys(c.comments).forEach(function(cid){if(c.comments[cid]&&c.comments[cid].source==='ai-review'&&c.comments[cid].reviewId===reviewId)delete c.comments[cid];});});
  if(pj.reviewComments)pj.reviewComments=pj.reviewComments.filter(function(cm){return !(cm&&cm.source==='ai-review'&&cm.reviewId===reviewId);});
}
function rvOptimizePayload(review){
  var items=[];
  (review.groups||[]).forEach(function(group){(group.items||[]).forEach(function(item){items.push({role:(group.role||{}).name||'AI 评审',severity:item.sev||'medium',text:String(item.txt||''),sectionId:rvSectionId(item.sec),sectionTitle:item.sec||'全局'});});});
  return items;
}
function rvOptimizeReview(i){
  var pj=currentProj(),review=pj&&pj.reviews&&pj.reviews[i],AIC=window.__AICtrl;
  if(!review||!AIC||typeof AIC.runReviewOptimize!=='function'){toast('评审优化模块未加载，请刷新后重试');return;}
  var items=rvOptimizePayload(review);if(!items.length){toast('本次评审没有可优化的建议');return;}
  if(!confirm('AI 将根据本次评审生成修改，并自动应用通过结构校验与独立复核的内容。已锁定、校验失败或无法定位的章节不会被改动，且会保留版本记录。继续吗？'))return;
  try{closeModal('reviewModal');}catch(e){}
  AIC.runReviewOptimize({reviewId:review.id,reviewItems:items,autoApply:true});
}
function rvOpen(){
  const pj=currentProj();
  if(!pj){rvOpenPick();return;}
  const box=document.getElementById('rvRoles');
  if(box){
    box.innerHTML=RV_ROLES.map(function(r){
      return '<div class="rv-role on" data-rid="'+r.id+'"><span class="rv-chk"></span><span class="rv-ic">'+r.ic+'</span><div class="rv-t">'+esc(r.name)+'</div><div class="rv-d">'+esc(r.d)+'</div></div>';
    }).join('');
    box.querySelectorAll('.rv-role').forEach(function(el){
      el.addEventListener('click',function(){el.classList.toggle('on');});
    });
  }
  const st=document.getElementById('rvStatus');if(st)st.textContent='';
  const rs=document.getElementById('rvResult');if(rs)rs.innerHTML='';
  rvRenderHistory();
  openModal('reviewModal');
}
function rvRenderGroupsHtml(groups,meta){
  const pjName=(meta&&meta.pjName)||'';
  const actions=meta&&meta.reviewIndex!=null?'<div class="row-act" style="margin:0 0 10px"><button class="btn btn--secondary" data-act="rvcomments">在评论中查看</button><button class="btn btn--primary" data-act="rvautofix" data-i="'+meta.reviewIndex+'">根据评审一键优化并应用</button></div>':'';
  let html='';
  groups.forEach(function(g){
    const role=g.role;
    const items=g.items.map(function(it){
      const sev=it.sev;
      return '<div class="rv-item"><span class="pill-st '+(sev==='high'?'lv-red':sev==='medium'?'lv-yellow':'lv-green')+'">'+(sev==='high'?'高':sev==='medium'?'中':'低')+'</span><div class="rv-txt">'+esc(it.txt)+'<div class="rv-where">涉及章节：'+esc(it.sec)+'</div><div class="rv-adv">建议：结合项目「'+esc(pjName)+'」的具体内容逐条确认后落实</div></div></div>';
    }).join('');
    html+='<div class="rv-group"><div class="rv-group-h"><span>'+role.ic+'</span>'+esc(role.name)+'视角<span class="rv-cnt">'+items.length+' 条意见</span></div>'+items+'</div>';
  });
  html+=actions+'<div class="muted" style="font-size:11.5px;margin-top:8px">评审意见已同步到评论：每条均带 AI 角色署名；无法精确对应原文的意见以章节级或全局评论展示。自动优化只会应用通过校验与独立复核的修改。</div>';
  return html;
}
function rvRenderHistory(){
  const pj=currentProj();
  const box=document.getElementById('rvHistory');if(!box)return;
  const revs=(pj&&pj.reviews)||[];
  if(!revs.length){box.style.display='none';box.innerHTML='';return;}
  box.style.display='';
  const rows=revs.map(function(r,i){
    const cnt=r.groups?r.groups.reduce(function(a,g){return a+(g.items?g.items.length:0);},0):0;
    const roles=(r.roles||[]).map(function(id){const rr=RV_ROLES.find(function(x){return x.id===id;});return rr?rr.name:'';}).join(' / ');
    const dt=new Date(r.at).toLocaleString();
    return '<div class="rv-hist-item" data-act="rvhist" data-i="'+i+'" title="点击复看本次评审"><span class="rv-hist-dt">'+dt+'</span><span class="rv-hist-meta">'+esc(roles)+' · '+cnt+' 条意见</span><span class="rv-hist-go">复看 ›</span><button class="rv-hist-del" data-act="rvdel" data-i="'+i+'" title="删除该次评审">×</button></div>';
  }).join('');
  box.innerHTML='<div class="rv-hist-h"><span class="rv-hist-ic">'+ICONS.clipboard+'</span> 历史评审（'+revs.length+'，最多保留 20 次）<button class="btn btn--ghost" data-act="rvclear" style="margin-left:auto;font-size:11px;padding:2px 8px">清空</button></div>'+rows;
}
function rvShowHistory(i){
  const pj=currentProj();if(!pj)return;
  const r=(pj.reviews||[])[i];if(!r)return;
  const st=document.getElementById('rvStatus');if(st)st.textContent='';
  const rs=document.getElementById('rvResult');if(!rs)return;
  rs.innerHTML='<div class="row-act" style="margin-bottom:10px"><button data-act="rvback">← 返回重新评审</button><span class="muted" style="font-size:12px">'+new Date(r.at).toLocaleString()+' · '+(r.roles||[]).length+' 个角色 · '+(r.roles||[]).map(function(id){const rr=RV_ROLES.find(function(x){return x.id===id;});return rr?rr.name:'';}).join(' / ')+'</span></div>'
    +rvRenderGroupsHtml(r.groups||[],{pjName:pj.name,reviewIndex:i});
}
// 评审 fetch 流式调用（绕过 ai-controller IIFE 抽象，直接 fetch）
function rvFetchStream(messages,callbacks,stg){
  var base=(stg.baseUrl||'').replace(/\/+$/,'');
  var ctrl=new AbortController();
  var idle=setTimeout(function(){try{ctrl.abort();}catch(e){}},15000);
  var kick=function(){clearTimeout(idle);idle=setTimeout(function(){try{ctrl.abort();}catch(e){}},15000);};
  return fetch(base+'/chat/completions',{
    method:'POST',
    headers:{'Content-Type':'application/json','Authorization':'Bearer '+String(stg.apiKey||'').trim()},
    body:JSON.stringify({model:stg.model||stg.deepModel||'',messages,stream:true,temperature:0.2}),
    signal:ctrl.signal
  }).then(function(resp){
    if(!resp.ok)throw new Error('HTTP '+resp.status);
    var reader=resp.body.getReader(),dec=new TextDecoder(),buf='',content='';
    function pump(){
      return reader.read().then(function(r){
        if(r.done){clearTimeout(idle);return content;}
        kick();
        buf+=dec.decode(r.value,{stream:true});
        var nl;
        while((nl=buf.indexOf('\n'))>=0){
          var line=buf.slice(0,nl).trim();buf=buf.slice(nl+1);
          if(line.indexOf('data:')!==0)continue;
          var data=line.slice(5).trim();
          if(data==='[DONE]'){clearTimeout(idle);return content;}
          try{
            var j=JSON.parse(data);
            var ch=j.choices&&j.choices[0]&&j.choices[0].delta;
            var d=ch&&ch.content;
            if(d){content+=d;if(callbacks.onDelta)callbacks.onDelta(content);}
            var dr=ch&&(ch.reasoning_content||ch.reasoning||ch.thinking);
            if(dr&&callbacks.onReasoning)callbacks.onReasoning(dr);
          }catch(e){}
        }
        return pump();
      }).catch(function(e){clearTimeout(idle);if(e&&e.name==='AbortError')throw{kind:'timeout',message:'流式响应空闲超时（15 秒无数据）'};throw e;});
    }
    return pump();
  });
}
function rvParseMdItems(text){
  var items=[];
  var lines=String(text||'').split('\n');
  for(var i=0;i<lines.length;i++){
    var line=lines[i].trim();
    if(!line)continue;
    var m=line.match(/^[-*]\s*\[(high|medium|low)\]\s*(.+?)(?:\s*[（(]章节[：:]\s*(.+?)[)）]\s*)?$/i);
    if(m){
      var sev=m[1].toLowerCase();
      var txt=m[2].trim();
      var sec=m[3]?m[3].trim():'全局';
      items.push({sev:sev,txt:txt,sec:sec});
    }
  }
  if(!items.length){
    var t=String(text||'').trim();
    if(t&&t.length<800)items.push({sev:'medium',txt:t.substring(0,200),sec:'全局'});
  }
  return items;
}
function rvThinkHtml(role,reasoning,out){
  var think=reasoning?'<details class="ai-think" open><summary><span class="ai-think-h-t"><span class="ai-think-dot"></span>「'+esc(role.name)+'」视角 · 深度思考</span><span class="ai-think-cnt">'+reasoning.length+' 字</span><span class="ai-think-caret">▾</span></summary><div class="ai-think-body">'+esc(reasoning)+'</div></details>':'';
  var outHtml=out?'<pre class="rv-stream-body">'+esc(String(out).slice(-1500))+'</pre>':'';
  return think+outHtml;
}
function rvRun(){
  const st=document.getElementById('rvStatus');
  const rs=document.getElementById('rvResult');
  const showErr=function(msg){if(st)st.textContent='评审出错：'+msg;if(rs)rs.innerHTML='<div class="muted" style="color:var(--red);padding:8px 0">'+esc(msg)+'</div>';};
  const AIC=window.__AICtrl;
  if(!AIC||typeof AIC.getSettings!=='function'){
    if(st)st.textContent='AI 控制器未加载（window.__AICtrl 不存在），请 Ctrl+Shift+R 强刷清缓存';
    if(rs)rs.innerHTML='<div class="muted" style="color:var(--red);padding:8px 0">AI 控制器未加载，请强制刷新 (Ctrl+Shift+R)。</div>';
    return;
  }
  const pj=currentProj();if(!pj){toast('请先打开项目');return;}
  if(st)st.textContent='正在准备评审…';
  const sel=[];
  document.querySelectorAll('#rvRoles .rv-role.on').forEach(function(el){sel.push(el.dataset.rid);});
  if(!sel.length){if(st)st.textContent='请至少选择一个评审角色';toast('至少选择一个评审角色');return;}
  if(rs)rs.innerHTML='';
  let stg={};
  try{stg=AIC.getSettings();}catch(e){showErr('读取 AI 设置失败：'+(e.message||e));return;}
  if(!stg||!String(stg.apiKey||'').trim()){
    if(st)st.textContent='未配置 AI API Key：请到 设置 → AI 填写（此环境需重新配置）';
    toast('请先在 设置→AI 中配置 API Key');
    return;
  }
  if(!String(stg.model||stg.deepModel||'').trim()){
    if(st)st.textContent='未配置 AI 模型：请到 设置 → AI 填写标准模型或深度模型。';
    toast('请先在 设置→AI 中填写模型名');
    return;
  }
  let docText='';
  try{
    docText = (AIC._test && typeof AIC._test.docText==='function') ? AIC._test.docText() : '';
  }catch(e){showErr('读取文档内容失败：'+(e.message||e));return;}
  if(!docText.trim()){if(st)st.textContent='当前项目没有可评审的 PRD 内容';toast('当前项目没有可评审的 PRD 内容');return;}
  const startReview=function(){
  const groups=[];
  let i=0;
  const runNext=function(){
    if(i>=sel.length){
      if(st)st.textContent='';
      pj.reviews=pj.reviews||[];
      var review={id:rvReviewCommentId(),at:Date.now(),roles:sel,groups:groups};
      pj.reviews.unshift(review);
      if(pj.reviews.length>20)pj.reviews.splice(20).forEach(function(old){rvRemoveReviewComments(pj,old&&old.id);});
      var commentCount=rvSyncReviewComments(pj,review);
      save();
      rvRenderHistory();
      if(rs)rs.innerHTML=rvRenderGroupsHtml(groups,{pjName:pj.name,reviewIndex:0,commentCount:commentCount});
      toast('评审完成：'+commentCount+' 条意见已同步到评论');
      return;
    }
    const rid=sel[i++];
    const role=RV_ROLES.find(function(r){return r.id===rid;});
    if(!role){if(st)st.textContent='角色 '+rid+' 未定义，请检查 RV_ROLES';return;}
    if(st)st.textContent='正在以「'+role.name+'」视角评审…';
    var reasoning='',lastRender=0;
    const messages=[
      {role:'system',content:rvReviewSystemPrompt(role)},
      {role:'user',content:'请评审以下 PRD 内容：\n\n'+docText}
    ];
    const cbs={
      onDelta:function(c){
        if(st)st.textContent='「'+role.name+'」视角 · 正在思考（已生成 '+c.length+' 字）…';
        if(rs){rs.innerHTML=rvThinkHtml(role,reasoning,c);aiScrollThinkBody();}
      },
      onReasoning:function(r){
        reasoning+=r;
        var now=Date.now();
        if(now-lastRender>180&&rs){lastRender=now;rs.innerHTML=rvThinkHtml(role,reasoning,'');aiScrollThinkBody();}
      }
    };
    rvFetchStream(messages,cbs,stg).then(function(c){
      groups.push({role:role,items:rvParseMdItems(c)});
      if(rs)rs.innerHTML=rvRenderGroupsHtml(groups,{pjName:pj.name});
      runNext();
    }).catch(function(e){
      groups.push({role:role,items:[{sev:'high',txt:'AI 评审失败：'+((e&&e.message)||'未知错误')+'，可稍后重试。',sec:'全局'}]});
      if(rs)rs.innerHTML=rvRenderGroupsHtml(groups,{pjName:pj.name});
      runNext();
    });
  };
  runNext();
  };
  if(typeof AIC.privacyConfirm!=='function'){showErr('AI 隐私确认模块未加载，请 Ctrl+Shift+R 后重试');return;}
  if(st)st.textContent='请确认本次评审的数据发送范围…';
  AIC.privacyConfirm({label:'多角色评审',scope:'当前项目的 PRD 全文、章节结构和所选角色评审指令',key:'多角色评审|全文 PRD'}).then(startReview).catch(function(e){if(st)st.textContent=(e&&e.message)||'已取消本次评审';});
}
function rvReviewSystemPrompt(role){
  const fw=STATE.framework.map(function(x){return x.id+'「'+x.title+'」';}).join('；');
  return '你是资深'+role.name+'评审专家，擅长'+role.d+'。\n'
    +'请以该专业视角对用户提供的 PRD 内容进行评审，输出实质性问题。\n'
    +'要求：\n'
    +'1) 只报告该视角真正关心的实质问题，宁缺毋滥，最多 5 条；\n'
    +'2) 每条意见必须针对文档中的具体内容，禁止泛泛而谈或编造；\n'
    +'3) 严格只输出 Markdown 列表，每行一条，格式严格如下：\n'
    +'   - [high|medium|low] 具体意见（含问题与原因）（章节：章节名）\n'
    +'   - high=严重问题，medium=警告，low=提示；无法定位章节时填「全局」\n'
    +'4) 不要输出其他文字（不要解释、不要总结、不要开场白）；\n'
    +'文档框架章节（用于定位章节名）：'+fw;
}
function rvOpenPick(){
  const list=document.getElementById('rvPickList');if(!list)return;
  const ps=STATE.projects||[];
  if(!ps.length){
    list.innerHTML='<div class="empty"><span class="e-ic">'+ICONS.starL+'</span><span class="e-t">还没有项目</span><span class="e-d">先导入一份 PRD，或从首页「从空白开始 / 从想法开始」新建项目，再进行评审</span></div>';
  }else{
    let rows=ps.map(function(p){
      const ts=p.updatedAt?new Date(p.updatedAt).toLocaleDateString():'';
      return '<div class="rv-pick-item" data-act="rvpick" data-id="'+p.id+'" title="切换到此项目并开始评审"><span class="rv-pick-n">'+esc(p.name)+'</span><span class="muted">'+ts+'</span><span class="rv-pick-go">评审 ›</span></div>';
    }).join('');
    list.innerHTML='<div class="muted" style="margin-bottom:8px;font-size:12px">共 '+ps.length+' 个项目，点击即切换并开始评审</div>'+rows;
  }
  openModal('reviewPickModal');
}
function closeProjMenu(){const m=document.getElementById('projMenu');if(m)m.remove();}
function openSidebar(){const sb=document.getElementById('sidebar'),ov=document.getElementById('sidebarOverlay');if(sb)sb.classList.add('open');if(ov)ov.classList.add('open');document.body.style.overflow='hidden';}
function closeSidebar(){const sb=document.getElementById('sidebar'),ov=document.getElementById('sidebarOverlay');if(sb)sb.classList.remove('open');if(ov)ov.classList.remove('open');document.body.style.overflow='';}
window.addEventListener('resize',()=>{if(window.innerWidth>860)closeSidebar();});
function openProjMenu(x,y,id){
  closeProjMenu();
  const p=STATE.projects.find(z=>z.id===id);if(!p)return;
  const html='<div class="ov-dropdown" id="projMenu" role="menu" style="top:'+Math.min(y,window.innerHeight-150)+'px;left:'+Math.min(x,window.innerWidth-170)+'px">'+
    '<div class="ov-item" data-act="renameproj" data-id="'+id+'"><span class="lbl">重命名</span></div>'+
    '<div class="ov-item" data-act="projctx" data-id="'+id+'"><span class="lbl">项目上下文</span></div>'+
    '<div class="ov-item" data-act="expmd" data-id="'+id+'"><span class="lbl">导出 MD</span></div>'+
    '<div class="ov-item" data-act="expdocx" data-id="'+id+'"><span class="lbl">导出 Word</span></div>'+
    '<div class="ov-item" data-act="delproj" data-id="'+id+'"><span class="lbl" style="color:var(--red)">删除</span></div>'+
    '</div>';
  document.body.insertAdjacentHTML('beforeend',html);
}

function toggleEdit(){
  editing=!editing;
  document.documentElement.classList.toggle('view-mode',!editing);
  if(!editing){if(typeof flushSave==='function'){try{flushSave();}catch(e){}}clearDirty();}
  if(window.__syncViewBanner)window.__syncViewBanner();
  document.getElementById('btnEdit').textContent=editing?'完成编辑':'进入编辑';
  render();
}

function openCommentsPanel(){
  const items=[];
  (STATE.framework||[]).forEach(sec=>{
    const c=DATA[sec.id];if(!c)return;
    const title=sec.title||sec.id;
    if(c.comments){Object.keys(c.comments).forEach(cid=>{const cm=c.comments[cid];items.push({cid:cid,sec:sec.id,where:title,txt:cm.text,by:cm.by||'评审',at:cm.at||0});});}
    (c.cards||[]).forEach(function(card,ci){if(card.comments){Object.keys(card.comments).forEach(cid=>{const cm=card.comments[cid];items.push({cid:cid,sec:sec.id,card:ci,where:title+' · 卡片'+(ci+1),txt:cm.text,by:cm.by||'评审',at:cm.at||0});});}});
  });
  const pj=currentProj();
  (pj&&pj.reviewComments||[]).forEach(function(cm){items.push({cid:cm.id,sec:'',where:'全局建议',txt:cm.text,by:cm.by||'AI 评审',at:cm.at||0,review:true});});
  if(!items.length){toast('还没有评论');return;}
  items.sort(function(a,b){return (b.at||0)-(a.at||0);});
  const m=document.createElement('div');m.className='cmt-list-modal';
  let list='';
  items.forEach(function(it){
    list+='<div class="cmt-list-item" data-cid="'+it.cid+'" data-sec="'+it.sec+'" data-card="'+(it.card!=null?it.card:'')+'"><div class="cli-txt">'+esc(it.txt)+'</div><div class="cli-meta">'+esc(it.where)+' · '+esc(it.by)+' · '+new Date(it.at||Date.now()).toLocaleDateString()+'</div></div>';
  });
  m.innerHTML='<div class="cmt-list-head"><b>全部评论（'+items.length+'）</b><button type="button" class="cmt-list-x" data-act="cmtlistclose"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div><div class="cmt-list-body">'+list+'</div>';
  document.body.appendChild(m);
  function closeList(){m.remove();document.removeEventListener('click',outC);}
  function outC(e){
    if(!e.target.closest('.cmt-list-modal')){closeList();return;}
    if(e.target.closest('[data-act="cmtlistclose"]')){closeList();return;}
    const item=e.target.closest('.cmt-list-item');
    if(item){const cid=item.dataset.cid,sec=item.dataset.sec;closeList();goCmt(cid,sec);}
  }
  setTimeout(function(){document.addEventListener('click',outC);},0);
}
function goCmt(cid,fallbackSec){
  const mk=document.querySelector('.cmt-hl[data-cid="'+cid+'"]');
  if(mk){if(window.__commentCtrl&&window.__commentCtrl.reveal)window.__commentCtrl.reveal(mk);else mk.click();}
  else if(fallbackSec){try{openSection(fallbackSec);toast('已定位到相关章节；这是章节级 AI 评审意见，未对原文划线');}catch(e){toast('该评论所在内容已变化，找不到划线位置');}}
  else toast('这是全局 AI 评审建议，没有对应的单一章节');
}
function closeOverrideQuick(){const m=document.getElementById('ovMenu');if(m)m.remove();}
function openOverrideQuick(id){
  closeOverrideQuick(); // 先关闭已存在的下拉
  if(!HEALTH||!HEALTH.sec[id])return;
  const hasOv=!!HEALTH.sec[id].override;
  // 以颜色块为主的下拉菜单，替代原“标红/标黄/标绿/恢复引擎判定”文字按钮
  const html='<div class="ov-dropdown" id="ovMenu" role="menu">'+
    '<div class="ov-item" data-act="ov-red" data-id="'+id+'"><span class="swatch red"></span><span class="lbl">标红</span></div>'+
    '<div class="ov-item" data-act="ov-yellow" data-id="'+id+'"><span class="swatch yellow"></span><span class="lbl">标黄</span></div>'+
    '<div class="ov-item" data-act="ov-green" data-id="'+id+'"><span class="swatch green"></span><span class="lbl">标绿</span></div>'+
    (hasOv?'<div class="ov-item" data-act="ov-clear" data-id="'+id+'"><span class="swatch neutral"></span><span class="lbl">恢复引擎判定</span></div>':'')+
    '</div>';
  document.body.insertAdjacentHTML('beforeend',html);
  const menu=document.getElementById('ovMenu');
  const btn=document.querySelector('.sec-color[data-id="'+id+'"]');
  if(btn&&menu){const r=btn.getBoundingClientRect();const left=Math.max(8,r.right-menu.offsetWidth);menu.style.top=(r.bottom+4)+'px';menu.style.left=left+'px';}
}
// 点击空白处关闭改色下拉（点击 ovmenu 按钮本身不关闭，由 openOverrideQuick 处理替换）
document.addEventListener('click',e=>{
  if(e.target.closest('[data-act="ovmenu"]'))return;
  if(!e.target.closest('#ovMenu'))closeOverrideQuick();
  if(!e.target.closest('#projMenu'))closeProjMenu();
});

let importPreviewPlan=null;
function importPreviewMode(){const picked=document.querySelector('#importPreviewOptions input[name="importPreviewMode"]:checked');return picked?picked.value:(importPreviewPlan&&importPreviewPlan.defaultMode)||'new';}
function renderImportPreview(){
  const plan=importPreviewPlan;if(!plan)return;
  const mode=importPreviewMode(),asNew=mode==='new',keepsSource=asNew||!plan.currentFilled;
  const summary=document.getElementById('importPreviewSummary');
  const options=document.getElementById('importPreviewOptions');
  const nameField=document.getElementById('importPreviewNameField');
  const nameInput=document.getElementById('importPreviewName');
  const mapping=document.getElementById('importPreviewMapping');
  const unmatchedTitle=document.getElementById('importPreviewUnmatchedTitle');
  const unmatched=document.getElementById('importPreviewUnmatched');
  if(summary)summary.innerHTML='<b>已读取「'+esc(plan.sourceLabel)+'」</b>：识别到 '+plan.sectionCount+' 个章节。确认前不会修改本地项目。';
  if(options){
    if(plan.currentFilled){options.innerHTML='<label class="import-preview-choice"><input type="radio" name="importPreviewMode" value="new" data-act="importpreviewmode"'+(mode==='new'?' checked':'')+'><span><b>导入为新项目（推荐）</b><br>保留当前项目「'+esc(plan.currentName)+'」，并按原文标题生成框架。</span></label><label class="import-preview-choice"><input type="radio" name="importPreviewMode" value="overwrite" data-act="importpreviewmode"'+(mode==='overwrite'?' checked':'')+'><span><b>覆盖当前项目</b><br>替换当前项目「'+esc(plan.currentName)+'」已匹配章节；未识别章节会收纳到“其他”。</span></label>';}else if(plan.currentName){options.innerHTML='<div class="import-preview-choice"><span><b>导入到当前空项目「'+esc(plan.currentName)+'」</b><br>将按原文标题生成框架，后续可在框架设置中调整。</span></div>';}else{options.innerHTML='<div class="import-preview-choice"><span><b>将创建新项目</b><br>按原文标题生成框架，不会覆盖任何已有项目。</span></div>';}
  }
  if(nameField)nameField.style.display=asNew?'':'none';
  if(nameInput&&asNew&&!nameInput.value)nameInput.value=plan.projectName;
  const mapped=plan.matched.map(function(key){const from=plan.parsed.titles[key]||key;const target=(STATE.framework.find(function(s){return s.id===key;})||{}).title||key;return '<li>'+esc(from)+' <span class="muted">→</span> '+esc(target)+'</li>';});
  if(!mapped.length&&plan.generated.length)mapped.push.apply(mapped,plan.generated.slice(0,12).map(function(s){return '<li>'+esc(s.title)+' <span class="muted">→ 保留为原文标题章节</span></li>';}));
  if(mapping)mapping.innerHTML=mapped.length?mapped.join(''):'<li class="import-preview-empty">未识别到可映射的标准章节，将保留原文结构。</li>';
  const unknown=plan.unmatched.map(function(key){return plan.parsed.titles[key]||key.replace(/^new::/,'');});
  if(unmatchedTitle)unmatchedTitle.textContent=keepsSource?'将按原文标题保留的章节':'未识别章节（将收纳到“其他”）';
  if(unmatched)unmatched.innerHTML=unknown.length?unknown.slice(0,18).map(function(title){return '<li>'+esc(title)+'</li>';}).join(''):'<li class="import-preview-empty">无</li>';
}
function beginImportPreview(text,projName,sourceLabel){
  let parsed,generated=[];
  try{parsed=parsePRD(text||'');generated=parseAutoGen(text||'');}catch(e){toast('解析失败：'+(e&&e.message||e));return false;}
  const sectionCount=(parsed.order||[]).length||generated.length;
  if(!sectionCount){toast('未识别到可导入的章节（建议使用 Markdown 标题或编号标题）');return false;}
  const cur=currentProj();
  importPreviewPlan={text:text||'',projectName:(projName||'导入项目').trim()||'导入项目',sourceLabel:sourceLabel||projName||'导入内容',parsed:parsed,generated:generated,matched:(parsed.order||[]).filter(function(key){return key.indexOf('new::')!==0;}),unmatched:parsed.unmatched||[],sectionCount:sectionCount,currentName:cur?cur.name:'',currentFilled:!!(cur&&STATE.framework.some(function(s){return !isEmpty(s.id);})),defaultMode:cur&&STATE.framework.some(function(s){return !isEmpty(s.id);})?'new':(cur?'current':'new')};
  const nameInput=document.getElementById('importPreviewName');if(nameInput)nameInput.value=importPreviewPlan.projectName;
  renderImportPreview();openModal('importPreviewModal');return true;
}
function applyImportPreview(){
  const plan=importPreviewPlan;if(!plan)return;
  const mode=importPreviewMode();const name=((document.getElementById('importPreviewName')||{}).value||plan.projectName).trim()||'导入项目';
  closeModal('importPreviewModal');importPreviewPlan=null;
  if(mode==='new'){
    createProject(name,'__AUTO__');
    if(!currentProj())return;
  }
  doImportText(plan.text,name,mode==='overwrite'?'overwrite':undefined);
  const p=currentProj();
  if(p){
    p.importReport={sourceLabel:plan.sourceLabel,importedAt:Date.now(),sectionCount:plan.sectionCount,mappedTitles:plan.matched.map(function(key){return plan.parsed.titles[key]||key;}),unmatchedTitles:plan.unmatched.map(function(key){return plan.parsed.titles[key]||key.replace(/^new::/,'' );}),mode:mode};
    save();render();openImportReport();
  }
}
function openImportReport(){
  const p=currentProj(),report=p&&p.importReport;if(!report)return;
  const summary=document.getElementById('importReportSummary');const tasks=document.getElementById('importReportTasks');
  const unmatched=report.unmatchedTitles||[];const kept=report.mode==='overwrite'?'已收纳到“其他”':'已按原文标题保留';
  if(summary)summary.innerHTML='<b>已导入「'+esc(report.sourceLabel||'文档')+'」</b>：共 '+(report.sectionCount||0)+' 个章节，其中 '+(report.mappedTitles||[]).length+' 个可映射到标准结构'+(unmatched.length?'；'+unmatched.length+' 个非标准章节'+kept:'')+'。';
  const h=HEALTH||runHealth();const taskRows=[];
  if(unmatched.length)taskRows.push('<li><b>核对非标准章节：</b>'+esc(unmatched.slice(0,4).join('、'))+(unmatched.length>4?' 等':'')+'；确认它们是否应保留为独立内容或并入标准章节。</li>');
  if(h&&h.activeHits&&h.activeHits.length)taskRows.push('<li><b>处理规则体检：</b>当前有 '+h.activeHits.length+' 项待处理问题，优先查看红色章节和必填内容缺口。</li>');
  else taskRows.push('<li><b>继续完善：</b>章节已导入；建议核对目标、范围、验收和风险是否足以进入评审。</li>');
  taskRows.push('<li><b>下一步：</b>核对章节结构后，再根据体检结果补齐内容或发起 AI 深度审查。</li>');
  if(tasks)tasks.innerHTML=taskRows.join('');openModal('importReportModal');
}
function doImportText(text,projName){
  pushUndo();
  const cur0=currentProj();
  if(cur0 && cur0.autoGen){ try{ autoGenImport(text); }catch(e){ toast('自动生成失败：'+(e&&e.message||e)); } return; }
  ensureCatchAllAll(); // 先保证有「其他」兜底节（影响 headingToId 映射，让“其他/附录”等标题能正确归位）
  let r;
  try{ r=parsePRD(text); }catch(e){ toast('解析失败：'+(e&&e.message||e)); return; }
  const hasContent=Object.keys(r.data).length>0 || (r.unmatched&&r.unmatched.length>0);
  if(!hasContent){ toast('未识别到可导入的章节（需含 Markdown 标题 #~######）'); return; }
  const cur=currentProj();
  const curFilled=cur && STATE.framework.some(s=>!isEmpty(s.id));
  if(curFilled && arguments[2]!=='overwrite' && !confirm('当前项目「'+cur.name+'」已有内容，导入将覆盖它。\n确定覆盖？\n（点“取消”则导入为全新项目，保留当前项目）')){
    // 取消覆盖 → 新建项目，并“沿用导入文档自身框架”（标题顺序+已知节类型），避免内容全进「其他」
    const docFw=docFrameworkFromParse(r);
    STATE.framework=deep(docFw);
    createProject(projName||'导入的PRD');
    r.unmatched=[]; // 沿用文档框架后所有节都是真实节，不再丢进「其他」
  }
  if(!currentProj()){ createProject(projName||'导入项目'); }
  // 先完成「已匹配节」的赋值，再追加「未归类卡片」。
  // 重要：若先塞卡片再赋值，文档自带的「其他/附录/相关文件」标题会被当成 matched 节赋值，
  // 从而用 r.data['other']（html 可能为「（空）」）把刚塞进去的卡片整体覆盖掉，导致「其他」只剩（空）。
  Object.keys(r.data).forEach(id=>{if(id.indexOf('new::')===0)return;if(STATE.framework.some(s=>s.id===id))DATA[id]=r.data[id];});
  // 放不进设定框架的内容（文档有、看板框架没有的标题）→ 全部归入「其他」兜底节（作为小卡片），不再自动生成新框架节
  const cid=catchAllId();
  let otherCount=0;
  if(cid){
    const c=DATA[cid];if(!c.cards)c.cards=[];
    r.unmatched.forEach(key=>{
      const title=r.titles[key]||key.replace(/^new::/,'');
      const secData=r.data[key]||{html:'',cards:[]};
      let html=secData.html||'';
      (secData.cards||[]).forEach(sc=>{html+='<h3>'+(sc.title||'')+'</h3>'+(sc.html||'');}); // 子标题一并带进「其他」，防丢内容
      if(!html && !title)return;
      c.cards.push({id:uid(),title:title,html:html});
      otherCount++;
    });
  }
  const p=currentProj();if(p)p.framework=deep(STATE.framework);
  save();render();
  // 导入完成后自动切到视图态，便于直接看体检结果
  try{ if(typeof editing!=='undefined' && editing) toggleEdit(); }catch(e){}
  toast('导入完成'+(otherCount?('：'+otherCount+' 段未归类内容已放入「其他」'):''));
}
function ingestFile(f){if(!f)return;const nm=(f.name||'').toLowerCase();const base=(f.name||'导入项目').replace(/\.[^.]+$/,'');
  if(nm.endsWith('.docx')){importDOCX(f,base);return;}
  const rd=new FileReader();
  rd.onload=()=>{
    const buf=new Uint8Array(rd.result);
    let text;
    try{ text=new TextDecoder('utf-8',{fatal:false}).decode(buf); }catch(e){ try{ text=new TextDecoder('gbk').decode(buf); }catch(e2){ text=String(rd.result); } }
    // 编码兼容：UTF-8 解码出现大量替换符（乱码特征）→ 改用 GBK/GB18030（Windows 记事本保存的 .md 常见）
    if((text.match(/\uFFFD/g)||[]).length > Math.max(3, Math.floor(buf.length/200))){
      try{ text=new TextDecoder('gbk').decode(buf); }catch(e){}
    }
    // .html 文档：先把标题标签转 Markdown 标题，再剥其余标签，避免标题丢失/标签残留
    if(nm.endsWith('.html')||nm.endsWith('.htm')){
      text=text.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi,'# $1\n')
               .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi,'## $1\n')
               .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi,'### $1\n')
               .replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi,'#### $1\n')
               .replace(/<h5[^>]*>([\s\S]*?)<\/h5>/gi,'##### $1\n')
               .replace(/<h6[^>]*>([\s\S]*?)<\/h6>/gi,'###### $1\n')
               .replace(/<[^>]+>/g,' ');
    }
    beginImportPreview(text,base,f.name||base);
  };
  rd.readAsArrayBuffer(f);
}
function handleFile(e){const f=e.target.files[0];if(!f)return;e.target.value='';ingestFile(f);}
let backupPending=null;
function backupStateSummary(st){st=st||{};const ps=Array.isArray(st.projects)?st.projects:[];return {projects:ps.length,groups:(st.groups||[]).length,presets:(st.frameworkPresets||[]).length,names:ps.slice(0,3).map(function(p){return p.name||'未命名项目';})};}
function openBackupImportModal(incoming,mode){
  const next=backupStateSummary(incoming),now=backupStateSummary(STATE),restore=mode==='restore';
  const title=document.getElementById('backupImportTitle'),summary=document.getElementById('backupImportSummary'),confirmBtn=document.getElementById('backupImportConfirm');
  if(title)title.textContent=restore?'恢复导入前状态':'导入备份前确认';if(confirmBtn)confirmBtn.textContent=restore?'确认恢复导入前状态':'确认覆盖并导入';
  if(summary)summary.innerHTML='<b>'+((restore?'即将恢复导入前保存的状态':'即将用备份整体覆盖当前看板'))+'</b><ul><li><b>当前：</b>'+now.projects+' 个项目、'+now.groups+' 个分组、'+now.presets+' 个自定义框架</li><li><b>'+((restore?'恢复为':'导入内容：'))+'</b>'+next.projects+' 个项目、'+next.groups+' 个分组、'+next.presets+' 个自定义框架'+(next.names.length?'（'+next.names.map(esc).join('、')+(next.projects>3?' 等':'')+'）':'')+'</li><li><b>会覆盖：</b>项目、分组、文档框架、规则和项目内 AI 记录；界面主题与 AI 服务设置不受备份导入影响。</li><li><b>保护：</b>'+((restore?'恢复前':'导入前'))+'会创建新的本地恢复点；也可先导出当前项目备份。</li></ul>';
  backupPending={incoming:deep(incoming),mode:mode||'import'};openModal('backupImportModal');
}
function applyBackupImport(){
  const pending=backupPending;if(!pending)return;
  try{localStorage.setItem(RESET_LOCAL_KEYS.preImport,JSON.stringify(STATE));}catch(err){toast('无法创建导入前恢复点，已取消覆盖：'+(err&&err.message||err));return;}
  try{
    const incoming=deep(pending.incoming);
    if(!incoming.ruleSet||(incoming.version||0)<6)incoming.ruleSet=deep(DEFAULT_RULES);incoming.version=6;
    if(!incoming.frameworkPresets||!incoming.frameworkPresets.length)incoming.frameworkPresets=deep(DEFAULT_PRESETS);
    if(!incoming.framework||!incoming.framework.length)incoming.framework=deep(DEFAULT_FRAMEWORK);
    incoming.projects.forEach(function(p){if(!p.overrides)p.overrides={};if(!p.corrections)p.corrections={};if(!p.framework||!p.framework.length)p.framework=deep(incoming.framework);if(!p.data)p.data=blankData(p.framework);});
    const active=incoming.projects.find(function(x){return x.id===incoming.activeProjectId;});if(active&&active.framework&&active.framework.length)incoming.framework=deep(active.framework);
    pushUndo();STATE=incoming;save();refreshData();render();closeModal('backupImportModal');backupPending=null;
    toast(pending.mode==='restore'?'已恢复导入前状态（可用撤销返回）':'备份已导入，已创建导入前恢复点');
  }catch(err){toast('备份导入失败：'+(err&&err.message||err));}
}
function restorePreImport(){let raw=null;try{raw=localStorage.getItem(RESET_LOCAL_KEYS.preImport);}catch(e){}if(!raw){toast('没有可恢复的导入前状态');return;}try{const incoming=JSON.parse(raw);if(!incoming||!Array.isArray(incoming.projects))throw new Error('恢复点格式不正确');openBackupImportModal(incoming,'restore');}catch(err){toast('导入前恢复点不可用：'+(err&&err.message||err));}}
function handleBackup(e){const f=e.target.files[0];if(!f)return;e.target.value='';const rd=new FileReader();rd.onload=()=>{let raw;try{raw=JSON.parse(rd.result);}catch(err){toast('备份文件不是有效的 JSON');return;}const incoming=raw&&raw.state?raw.state:raw;if(!incoming||!Array.isArray(incoming.projects)){toast('备份格式不正确：未找到项目数据');return;}openBackupImportModal(incoming,'import');};rd.readAsText(f);}
function handleFrameworkFile(e){const f=e.target.files[0];if(!f)return;pushUndo();const rd=new FileReader();rd.onload=()=>{try{const arr=JSON.parse(rd.result);if(Array.isArray(arr)&&arr.length){STATE.framework=arr;const p=currentProj();if(p)p.framework=deep(STATE.framework);save();renderFrameworkTab();if(currentProj())render();toast('框架已导入');}}catch(err){toast('框架 JSON 解析失败');}};rd.readAsText(f);e.target.value='';}

/* ============ Word(.docx) 导入/导出（R-27，零依赖、本地） ============ */
function xmlEsc(s){return (s==null?'':String(s)).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function crc32(buf){
  let t=[];if(!crc32.t){let c,n;for(let i=0;i<256;i++){c=i;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[i]=c>>>0;}crc32.t=t;}
  let crc=0xFFFFFFFF;for(let i=0;i<buf.length;i++)crc=crc32.t[(crc^buf[i])&0xFF]^(crc>>>8);
  return (crc^0xFFFFFFFF)>>>0;
}
function makeZip(files){
  const enc=new TextEncoder();
  const entries=Object.keys(files).map(name=>({name,nameBytes:enc.encode(name),data:typeof files[name]==='string'?enc.encode(files[name]):files[name]}));
  const b=[];
  const u16=n=>{b.push(n&0xFF,(n>>8)&0xFF);};
  const u32=n=>{b.push(n&0xFF,(n>>8)&0xFF,(n>>16)&0xFF,(n>>24)&0xFF);};
  const central=[];let offset=0;
  entries.forEach(e=>{
    const lo=offset;const crc=crc32(e.data);const size=e.data.length;
    b.push(0x50,0x4b,0x03,0x04);u16(0x14);u16(0);u16(0);u16(0);u16(0);
    u32(crc);u32(size);u32(size);u16(e.nameBytes.length);u16(0);
    for(const x of e.nameBytes)b.push(x);
    for(let i=0;i<e.data.length;i++)b.push(e.data[i]);
    const cb=[];const cu16=n=>{cb.push(n&0xFF,(n>>8)&0xFF);};const cu32=n=>{cb.push(n&0xFF,(n>>8)&0xFF,(n>>16)&0xFF,(n>>24)&0xFF);};
    cb.push(0x50,0x4b,0x01,0x02);cu16(0x14);cu16(0x14);cu16(0);cu16(0);cu16(0);cu16(0);
    cu32(crc);cu32(size);cu32(size);cu16(e.nameBytes.length);cu16(0);cu16(0);cu16(0);cu16(0);cu32(0);cu32(lo);
    for(const x of e.nameBytes)cb.push(x);
    central.push(Uint8Array.from(cb));
    offset=lo+(30+e.nameBytes.length+e.data.length);
  });
  const centralStart=offset;let centralSize=0;
  central.forEach(c=>{centralSize+=c.length;for(let i=0;i<c.length;i++)b.push(c[i]);});
  b.push(0x50,0x4b,0x05,0x06);u16(0);u16(0);u16(entries.length);u16(entries.length);u32(centralSize);u32(centralStart);u16(0);
  return new Uint8Array(b);
}
function mimeToExt(mime){
  const map={'image/png':'png','image/jpeg':'jpg','image/gif':'gif','image/bmp':'bmp','image/webp':'webp','image/tiff':'tif','image/svg+xml':'svg','image/emf':'emf','image/wmf':'wmf'};
  return map[(mime||'').toLowerCase()]||'png';
}
function unescapeHtml(s){if(!s)return'';const d=document.createElement('div');d.innerHTML=s;return d.textContent||'';}
async function buildDocx(srcData,proj){
  const data=srcData||DATA;
  const fw=(proj&&proj.framework)||STATE.framework||DEFAULT_FRAMEWORK;
  const doc=['<w:body>'];
  // 封面页：项目名（大标题，居中）+ 导出日期；作者/版本归入「文档变更历史」节，不在封面重复
  const _exportDate=(function(){const d=new Date();const p=n=>String(n).padStart(2,'0');return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate());})();
  doc.push('<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:before="480" w:after="120"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="44"/><w:szCs w:val="44"/><w:color w:val="1F3A45"/></w:rPr><w:t xml:space="preserve">'+xmlEsc((proj&&proj.name)||'未命名 PRD')+'</w:t></w:r></w:p>');
  doc.push('<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:after="480"/></w:pPr><w:r><w:rPr><w:sz w:val="22"/><w:color w:val="666666"/></w:rPr><w:t xml:space="preserve">导出日期：'+_exportDate+'</w:t></w:r></w:p>');

  const media=[]; // {bytes,name}
  let relId=2,docPr=0;const imageRels=[];
  function allocImage(bytes,mime){
    const ext=mimeToExt(mime);const name='media/image'+(media.length+1)+'.'+ext;const rid='rId'+relId;relId++;
    imageRels.push({id:rid,target:name});media.push({bytes,name});return rid;
  }
  async function fetchImageBytes(src){
    if(!src)return null;
    try{
      if(/^data:/i.test(src)){
        const m=src.match(/^data:([^;]+);base64,(.*)$/s);
        if(m){const bin=atob(m[2]);const u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);return {bytes:u,mime:m[1]};}
        return null;
      }
      const resp=await fetch(src,{mode:'cors'});
      if(!resp.ok)return null;
      const blob=await resp.blob();const buf=await blob.arrayBuffer();
      return {bytes:new Uint8Array(buf),mime:blob.type||extToMime(src)};
    }catch(e){return null;}
  }
  async function drawingFor(src){
    const emb=await fetchImageBytes(src);if(!emb)return null;
    const rid=allocImage(emb.bytes,emb.mime);
    let w=600,h=400;
    try{const img=new Image();img.src='data:'+emb.mime+';base64,'+bufToBase64(emb.bytes);await new Promise(res=>{if(img.complete)return res();img.onload=res;img.onerror=res;});if(img.naturalWidth){w=img.naturalWidth;h=img.naturalHeight;}}catch(e){}
    const maxEmu=5700000;let cw=w*9525,ch=h*9525;
    if(cw>maxEmu){const r=maxEmu/cw;cw=maxEmu;ch=Math.round(ch*r);}else{cw=Math.round(cw);ch=Math.round(ch);}
    docPr++;
    return '<w:p><w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="'+cw+'" cy="'+ch+'"/><wp:effectExtent l="0" t="0" r="0" b="0"/><wp:docPr id="'+docPr+'" name="Picture '+docPr+'" descr=""/><wp:cNvGraphicFramePr><a:graphicFrameLocks noChangeAspect="1"/></wp:cNvGraphicFramePr><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic><pic:nvPicPr><pic:cNvPr id="'+docPr+'" name="Picture"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="'+rid+'"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="'+cw+'" cy="'+ch+'"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>';
  }
  async function richText(html){
    if(!html)return;
    const srcs=[];
    // 先剥 Word 网页导出噪声：<style> 块 / 注释 / mso-* 样式 / behavior:url / o:p 标签
    let working=(html||'')
      .replace(/<style[\s\S]*?<\/style>/gi,'')
      .replace(/<!--[\s\S]*?-->/g,'')
      .replace(/<o:p>\s*<\/o:p>/gi,'')
      .replace(/<\/?o:p[^>]*>/gi,'')
      .replace(/behavior:\s*url\([^)]*\)/gi,'')
      .replace(/mso-[a-z-]+:\s*[^;\n]*/gi,'')
      .replace(/\s*\/\*\s*Style Definitions\s*\*\/\s*/g,'')
      .replace(/^\s*table\.MsoNormalTable[^{]*$/gm,'');
    working=working.replace(/<img\b[^>]*>/gi,full=>{const sm=full.match(/src=["']([^"']+)["']/i)||full.match(/src=([^\s>]+)/i);srcs.push(sm?sm[1]:'');return '\u0001IMG'+(srcs.length-1)+'\u0001';});
    working=working.replace(/<br\s*\/?>/gi,'\n');
    const text=working.replace(/<[^>]+>/g,'');
    const segments=text.split('\u0001');
    for(let i=0;i<segments.length;i++){
      const seg=segments[i];
      if(/^IMG\d+$/.test(seg)){
        const idx=parseInt(seg.slice(3),10);const d=await drawingFor(srcs[idx]);
        if(d)doc.push(d);else doc.push('<w:p><w:r><w:t xml:space="preserve">[图片:'+xmlEsc(srcs[idx]||'')+']</w:t></w:r></w:p>');
      } else {
        const un=unescapeHtml(seg);
        un.split(/\n+/).forEach(line=>{if(line.trim())doc.push('<w:p><w:r><w:t xml:space="preserve">'+xmlEsc(line)+'</w:t></w:r></w:p>');});
      }
    }
  }
  for(let _fwIdx=0;_fwIdx<fw.length;_fwIdx++){
    const s=fw[_fwIdx];
    doc.push('<w:p><w:pPr><w:pStyle w:val="Heading1"/><w:spacing w:before="240" w:after="120"/></w:pPr><w:r><w:rPr><w:color w:val="1F3A45"/></w:rPr><w:t xml:space="preserve">'+xmlEsc((_fwIdx+1)+'. '+(s.title||''))+'</w:t></w:r></w:p>');
    const c=data[s.id]||sectionEmpty(s.type,s.id);
    if(s.type==='feat'){
      const hdrCell=function(txt){return '<w:tc><w:tcPr><w:shd w:val="clear" w:color="auto" w:fill="1F3A45"/></w:tcPr><w:p><w:pPr><w:spacing w:before="40" w:after="40"/></w:pPr><w:r><w:rPr><w:b/><w:color w:val="FFFFFF"/></w:rPr><w:t xml:space="preserve">'+xmlEsc(txt)+'</w:t></w:r></w:p></w:tc>';};
      doc.push('<w:tbl><w:tblPr><w:tblStyle w:val="TableGrid"/><w:tblW w:w="5000" w:type="pct"/></w:tblPr><w:tblGrid><w:gridCol w:w="700"/><w:gridCol w:w="1300"/><w:gridCol w:w="1800"/><w:gridCol w:w="700"/><w:gridCol w:w="700"/></w:tblGrid><w:tr>'+hdrCell('序号')+hdrCell('功能点')+hdrCell('描述')+hdrCell('优先级')+hdrCell('状态')+'</w:tr>');
      (c.items||[]).forEach((it,fi)=>{doc.push('<w:tr><w:tc><w:p><w:r><w:t>'+xmlEsc(String(fi+1))+'</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>'+xmlEsc(it.name||'')+'</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>'+xmlEsc(it.desc||'')+'</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>'+xmlEsc(it.priority||'')+'</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>'+xmlEsc(it.status||'')+'</w:t></w:r></w:p></w:tc></w:tr>');});
      doc.push('</w:tbl>');
    } else if(s.type==='accept'){
      (c.items||[]).forEach(it=>{doc.push('<w:p><w:pPr><w:pStyle w:val="ListParagraph"/></w:pPr><w:r><w:t xml:space="preserve">['+(it.status==='pass'?'✓':it.status==='fail'?'✗':'○')+'] '+xmlEsc(it.text||'')+'</w:t></w:r></w:p>');});
    } else if(s.type==='users'){
      (c.items||[]).forEach(it=>{doc.push('<w:p><w:r><w:t xml:space="preserve">作为'+xmlEsc(it.role||'')+'，我希望'+xmlEsc(it.want||'')+'，以便'+xmlEsc(it.soThat||'')+'</w:t></w:r></w:p>');});
    } else if(s.type==='table'){
      // 用户自建表格：按 rows[0] 表头 + 其余行 转为真实 docx 表格
      // 列数取表头与各行中最大者，避免内容列被截断
      const rows=(c.rows&&c.rows.length)?c.rows:[];
      if(rows.length){
        const heads=rows[0].cells||[];
        // 自动加"序号"列（首列已是"序号"则不重复）
        const hasSeq=heads[0]&&/^(序号|#|No\.?|number|num|index)$/i.test(String(heads[0]).trim());
        const finalHeads=hasSeq?heads:['序号',...heads];
        const colCount=rows.reduce((m,r)=>Math.max(m,(r.cells||[]).length),finalHeads.length);
        // v18.7：表格宽度约束在页面内（A4 文本区 = 11906 - 边距1440*2 = 9026 twips）。
        // tblW=5000(pct) 即 100% 页宽（OOXML pct 以 1/50 百分比计，5000=100%）；各列等分 twips 且总和封顶≤9026，列再多也不超出页面
        const PAGE_TXT=9026; const n=Math.max(1,colCount);
        let colW=Math.floor(PAGE_TXT/n); colW=Math.max(420,colW);
        if(colW*n>PAGE_TXT)colW=Math.floor(PAGE_TXT/n);
        const totalW=5000;
        doc.push('<w:tbl><w:tblPr><w:tblStyle w:val="TableGrid"/><w:tblW w:w="'+totalW+'" w:type="pct"/></w:tblPr><w:tblGrid>');
        for(let j=0;j<colCount;j++)doc.push('<w:gridCol w:w="'+colW+'"/>');
        doc.push('</w:tblGrid>');
        doc.push('<w:tr>');
        finalHeads.forEach(h=>{
          doc.push('<w:tc><w:tcPr><w:shd w:val="clear" w:color="auto" w:fill="1F3A45"/></w:tcPr><w:p><w:pPr><w:pStyle w:val="Normal"/><w:spacing w:before="40" w:after="40"/></w:pPr><w:r><w:rPr><w:b/><w:color w:val="FFFFFF"/></w:rPr><w:t xml:space="preserve">'+xmlEsc(h||'')+'</w:t></w:r></w:p></w:tc>');
        });
        doc.push('</w:tr>');
        for(let i=1;i<rows.length;i++){
          const r=rows[i]||{cells:[]};
          const cells=(r.cells||[]).slice();
          if(!hasSeq)cells.unshift(String(i));
          doc.push('<w:tr>');
          for(let j=0;j<colCount;j++){
            doc.push('<w:tc><w:p><w:r><w:t xml:space="preserve">'+xmlEsc(cells[j]||'')+'</w:t></w:r></w:p></w:tc>');
          }
          doc.push('</w:tr>');
        }
        doc.push('</w:tbl>');
      }
    } else {
      await richText(c.html||'');
    }
    // 小卡片：任意节通用的子标题内容，导出为 Heading2 子节（含图片）
    for(const it of (c.cards||[])){
      doc.push('<w:p><w:pPr><w:pStyle w:val="Heading2"/></w:pPr><w:r><w:t xml:space="preserve">'+xmlEsc(it.title||'小标题')+'</w:t></w:r></w:p>');
      await richText(it.html||'');
    }
  }
  doc.push('<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="720" w:footer="720" w:gutter="0"/></w:sectPr>');
  doc.push('</w:body>');
  const documentXml='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:wp14="http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:w10="urn:schemas-microsoft-com:office:word" xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml" xmlns:w15="http://schemas.microsoft.com/office/word/2012/wordml" xmlns:wpg="http://schemas.microsoft.com/office/word/2010/wordprocessingGroup" xmlns:wpi="http://schemas.microsoft.com/office/word/2010/wordprocessingInk" xmlns:wne="http://schemas.microsoft.com/office/word/2006/wordml" xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture" mc:Ignorable="w14 w15 wp14"><w:body>'+doc.slice(1,-1).join('')+'</w:body></w:document>';
  const rels='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>';
  const docRels='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>'+imageRels.map(r=>'<Relationship Id="'+r.id+'" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="'+r.target+'"/>').join('')+'</Relationships>';
  const styles='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:eastAsia="Microsoft YaHei" w:hAnsi="Calibri" w:cs="Times New Roman"/><w:sz w:val="21"/><w:szCs w:val="22"/><w:lang w:val="en-US" w:eastAsia="zh-CN" w:bidi="ar-SA"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="0" w:line="240" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style><w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:link w:val="Heading1Char"/><w:qFormat/><w:pPr><w:keepNext/><w:spacing w:before="240" w:after="60"/><w:outlineLvl w:val="0"/></w:pPr><w:rPr><w:b/><w:bCs/><w:sz w:val="32"/><w:szCs w:val="32"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:link w:val="Heading2Char"/><w:qFormat/><w:pPr><w:keepNext/><w:spacing w:before="180" w:after="40"/><w:outlineLvl w:val="1"/></w:pPr><w:rPr><w:b/><w:bCs/><w:sz w:val="26"/><w:szCs w:val="26"/></w:rPr></w:style><w:style w:type="character" w:customStyle="1" w:styleId="Heading1Char"><w:name w:val="Heading 1 Char"/><w:basedOn w:val="DefaultParagraphFont"/><w:link w:val="Heading1"/><w:rPr><w:b/><w:bCs/><w:sz w:val="32"/><w:szCs w:val="32"/></w:rPr></w:style><w:style w:type="character" w:customStyle="1" w:styleId="Heading2Char"><w:name w:val="Heading 2 Char"/><w:basedOn w:val="DefaultParagraphFont"/><w:link w:val="Heading2"/><w:rPr><w:b/><w:bCs/><w:sz w:val="26"/><w:szCs w:val="26"/></w:rPr></w:style><w:style w:type="character" w:default="1" w:styleId="DefaultParagraphFont"><w:name w:val="Default Paragraph Font"/><w:uiPriority w:val="1"/><w:semiHidden/><w:unhideWhenUsed/></w:style><w:style w:type="paragraph" w:styleId="ListParagraph"><w:name w:val="List Paragraph"/><w:basedOn w:val="Normal"/><w:qFormat/><w:pPr><w:ind w:left="720"/><w:contextualSpacing/></w:pPr></w:style><w:style w:type="table" w:styleId="TableNormal"><w:name w:val="Normal Table"/><w:uiPriority w:val="99"/><w:semiHidden/><w:unhideWhenUsed/><w:tblPr><w:tblInd w:w="0" w:type="dxa"/><w:tblCellMar><w:top w:w="0" w:type="dxa"/><w:left w:w="108" w:type="dxa"/><w:bottom w:w="0" w:type="dxa"/><w:right w:w="108" w:type="dxa"/></w:tblCellMar></w:tblPr></w:style><w:style w:type="table" w:styleId="TableGrid"><w:name w:val="Table Grid"/><w:basedOn w:val="TableNormal"/><w:uiPriority w:val="59"/><w:tblPr><w:tblBorders><w:top w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:left w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:bottom w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:right w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:insideH w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:insideV w:val="single" w:sz="4" w:space="0" w:color="auto"/></w:tblBorders></w:tblPr></w:style></w:styles>';
  // Content_Types：只声明实际用到的图片扩展名 + 必要的固定类型
  const usedExts=new Set(media.map(m=>m.name.split('.').pop().toLowerCase()));
  // 同时声明 xml/rels 和 Override 给 document.xml / styles.xml，并按需声明图片扩展名
  const ctParts=['<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>','<Default Extension="xml" ContentType="application/xml"/>'];
  usedExts.forEach(e=>{ctParts.push('<Default Extension="'+e+'" ContentType="'+extToMime(e==='jpg'?'jpeg':e)+'"/>');});
  ctParts.push('<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>');
  ctParts.push('<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>');
  const ct='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'+ctParts.join('')+'</Types>';
  const parts={'[Content_Types].xml':ct,'_rels/.rels':rels,'word/_rels/document.xml.rels':docRels,'word/styles.xml':styles,'word/document.xml':documentXml};
  media.forEach(m=>{parts['word/'+m.name]=m.bytes;});
  return makeZip(parts);
}
var exportPreflightTarget=null;
function projectPreflight(p){
  if(!p)return null;
  var old={active:STATE.activeProjectId,framework:STATE.framework,data:DATA,health:HEALTH};
  try{
    STATE.activeProjectId=p.id;STATE.framework=p.framework||STATE.framework;DATA=p.data||{};HEALTH=runHealth();
    var trace=traceabilityReport(),delivery=deliveryReadiness();
    var red=(HEALTH.activeHits||[]).filter(function(h){return h.level==='red';});
    return {delivery:delivery,trace:trace,red:red};
  }finally{STATE.activeProjectId=old.active;STATE.framework=old.framework;DATA=old.data;HEALTH=old.health;}
}
function openExportPreflight(kind,projectId){
  var p=projectId?STATE.projects.find(function(x){return x.id===projectId;}):currentProj();if(!p){toast('请先创建项目');return;}
  var info=projectPreflight(p);if(!info){toast('无法生成交付检查');return;}
  exportPreflightTarget={kind:kind,projectId:p.id};
  var summary=document.getElementById('exportPreflightSummary'),gaps=document.getElementById('exportPreflightGaps'),confirmBtn=document.getElementById('exportPreflightConfirm');
  var ready=info.delivery.rows.every(function(r){return r.level==='ok';});
  if(summary)summary.innerHTML='<b>'+esc(p.name)+' · '+(kind==='docx'?'Word':'Markdown')+' 导出</b><br>'+(ready?'当前满足评审、研发与测试交付检查。':'当前未达到完整交付就绪条件；你仍可导出用于继续编辑或内部核对。');
  var list=[];
  /* 1) 各阶段阻塞：三行各自说明本阶段后果，不再重复同一句 */
  info.delivery.rows.filter(function(r){return r.level!=='ok';}).forEach(function(r){list.push('【'+r.title+'】'+r.text);});
  /* 2) P0 追溯缺口：合并为一条并列出受影响功能，避免逐条重复同一根因 */
  if(info.trace.p0Gaps.length){
    list.push('【P0 追溯缺口 '+info.trace.p0Gaps.length+' 项】'+info.trace.p0Gaps.map(function(r){return r.feature.name;}).join('、')+' —— 缺少关联验收或测试点。');
  }
  /* 3) 红色规则：跳过与上面 P0 缺口同源（同一功能）的条目，避免同因重复 */
  var p0names=info.trace.p0Gaps.map(function(r){return String(r.feature.name||'');});
  info.red.filter(function(h){var s=String(h.snippet||'');return !p0names.some(function(n){return n&&s.indexOf(n)>=0;});}).slice(0,4).forEach(function(h){list.push('【红色规则】'+h.snippet);});
  if(gaps)gaps.innerHTML=(list.length?list:['未发现阻塞项；导出后仍建议由相关角色人工核对。']).map(function(x){return '<li>'+esc(x)+'</li>';}).join('');
  if(confirmBtn)confirmBtn.textContent=ready?'确认导出':'仍然导出（继续编辑）';
  openModal('exportPreflightModal');
}
function confirmExportPreflight(){
  var target=exportPreflightTarget,p=target&&STATE.projects.find(function(x){return x.id===target.projectId;});
  if(!target||!p){toast('导出目标不存在，请重新发起导出');return;}
  closeModal('exportPreflightModal');exportPreflightTarget=null;
  if(target.kind==='docx'){exportDOCX(p.id);return;}
  download(p.name+'.md',projectMD(p),'text/markdown;charset=utf-8');toast('已导出 Markdown');
}
async function exportDOCX(id){const p=id?STATE.projects.find(x=>x.id===id):currentProj();if(!p){toast('请先创建项目');return;}try{toast('正在生成 Word（含图片）…');const bytes=await buildDocx(p.data,p);downloadBytes(p.name+'.docx',bytes);toast('已导出 Word（含图片）');}catch(e){console.error(e);toast('导出失败');}}
function parseZip(buf){
  if(buf instanceof ArrayBuffer) buf=new Uint8Array(buf);
  const dv=new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  let eocd=-1;for(let i=buf.byteLength-22;i>=0;i--){if(dv.getUint32(i,true)===0x06054b50){eocd=i;break;}}
  if(eocd<0)throw new Error('不是有效的 zip');
  const cdOffset=dv.getUint32(eocd+16,true);const cdCount=dv.getUint16(eocd+10,true);
  const entries=[];let p=cdOffset;
  for(let i=0;i<cdCount;i++){
    if(dv.getUint32(p,true)!==0x02014b50)break;
    const method=dv.getUint16(p+10,true);const compSize=dv.getUint32(p+20,true);const size=dv.getUint32(p+24,true);
    const nameLen=dv.getUint16(p+28,true);const extraLen=dv.getUint16(p+30,true);const commentLen=dv.getUint16(p+32,true);
    const lho=dv.getUint32(p+42,true);
    const name=new TextDecoder().decode(buf.slice(p+46,p+46+nameLen));
    const lnameLen=dv.getUint16(lho+26,true);const lextraLen=dv.getUint16(lho+28,true);
    const dataOffset=lho+30+lnameLen+lextraLen;
    entries.push({name,method,size,compSize,offset:dataOffset});
    p+=46+nameLen+extraLen+commentLen;
  }
  return entries;
}
async function inflateRaw(bytes){
  if(typeof DecompressionStream==='undefined')throw new Error('当前环境不支持解压');
  const ds=new DecompressionStream('deflate-raw');
  const w=ds.writable.getWriter();w.write(bytes);w.close();
  const ab=await new Response(ds.readable).arrayBuffer();
  return new Uint8Array(ab);
}
function bufToBase64(u8){
  let bin='';const chunk=0x8000;
  for(let i=0;i<u8.length;i+=chunk){bin+=String.fromCharCode.apply(null,u8.subarray(i,i+chunk));}
  return btoa(bin);
}
function extToMime(name){
  const ext=(name.split('.').pop()||'').toLowerCase();
  const map={png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',gif:'image/gif',bmp:'image/bmp',webp:'image/webp',svg:'image/svg+xml',tif:'image/tiff',tiff:'image/tiff',emf:'image/emf',wmf:'image/wmf'};
  return map[ext]||'image/png';
}
function parseRels(xml){
  const map={};
  const doc=new DOMParser().parseFromString(xml,'application/xml');
  Array.from(doc.getElementsByTagNameNS('http://schemas.openxmlformats.org/package/2006/relationships','Relationship')).forEach(r=>{
    const id=r.getAttribute('Id');const target=r.getAttribute('Target');
    if(id&&target)map[id]=target;
  });
  return map;
}
// 判断段落是否为标题，并返回层级（1=最高）。兼容：
//  - 英文内置样式 Heading1~Heading9
//  - 中文模板常见的「标题 N」→ 样式 id 即数字 1~9
//  - 任意 outlineLvl（显式大纲级别，最可靠）
//  - 其它英文字母样式（如 a9）→ 当作二级小节
function headingLevelOf(el,W){
  const pPr=el.getElementsByTagNameNS(W,'pPr')[0];
  if(pPr){
    const ol=pPr.getElementsByTagNameNS(W,'outlineLvl')[0];
    // v17.4：outlineLvl 9 = 正文（WPS 常见），只认 0-8
    if(ol){const v=parseInt(ol.getAttribute('w:val'),10);if(!isNaN(v)&&v>=0&&v<=8)return v+1;}
    const ps=pPr.getElementsByTagNameNS(W,'pStyle')[0];
    if(ps){
      const s=ps.getAttribute('w:val')||'';
      const m=s.match(/^heading\s*([1-9])$/i);if(m)return parseInt(m[1],10);
      if(/^[1-9]$/.test(s))return parseInt(s,10);
      const m2=s.match(/标题\s*([1-6])/);if(m2)return parseInt(m2[1],10); // 中文「标题1 / 标题 2」样式（WPS / 中文 Word）
      // v17.4 修复：目录(TOC/toc/目录)、列表/正文样式一律不是标题（此前任何带字母的样式都按二级标题处理，
      // 导致 Word 自动目录条目与列表项全被识别成框架节，真实案例 50 个标题被撑成 290 节）
      if(/^(toc|目录)/i.test(s))return 0;
    }
  }
  // 兜底：未用标题样式、仅靠整段加粗的文档（不少非技术用户习惯）。短文本且无句末标点 → 视为二级标题
  if(el.getElementsByTagNameNS(W,'b').length>0){
    let t='';Array.from(el.getElementsByTagNameNS(W,'t')).forEach(e=>{t+=(e.textContent||'');});
    const clean=t.replace(/^\s*(?:\d+(?:\.\d+)*)[.、)]\s*/,'').trim();
    // v17.4：加粗兜底再排除封面日期/编号行，避免封面信息被当成节
    // v17.5：加粗子标题降为三级（###），在有 #/## 大标题时归入父节成为小卡片，保留"大标题→子标题"层级
    if(clean&&clean.length<=30&&!/[。，、；：！？]/.test(clean)&&!/\d{4}\s*年\s*\d{1,2}\s*月\s*\d{1,2}\s*日/.test(clean)&&!/^(文档编号|保密等级|作者|审核|批准)/.test(clean))return 3;
  }
  return 0;
}
function extractDocText(xml,relsMap,mediaMap){
  const W='http://schemas.openxmlformats.org/wordprocessingml/2006/main';
  const A='http://schemas.openxmlformats.org/drawingml/2006/main';
  const doc=new DOMParser().parseFromString(xml,'application/xml');
  const body=doc.getElementsByTagNameNS(W,'body')[0]||doc.documentElement;
  const lines=[];
  const txtOf=el=>{
    const pses=el.getElementsByTagNameNS(W,'p');
    if(pses.length){ return Array.from(pses).map(p=>{let t='';Array.from(p.getElementsByTagNameNS(W,'t')).forEach(e=>{t+=(e.textContent||'');});return t;}).join(' '); }
    let t='';Array.from(el.getElementsByTagNameNS(W,'t')).forEach(e=>{t+=(e.textContent||'');});return t;
  };
  const blipImages=el=>{
    const out=[];
    Array.from(el.getElementsByTagNameNS(A,'blip')).forEach(blip=>{
      const rid=blip.getAttribute('r:embed');if(!rid)return;
      const target=relsMap&&relsMap[rid];if(!target)return;
      const path=target.charAt(0)==='/'?target.slice(1):('word/'+target);
      const uri=mediaMap&&mediaMap[path];if(!uri)return;
      out.push('<img src="'+uri+'" alt="">');
    });
    return out;
  };
  const stripNum=t=>t.replace(/^\s*(?:\d+(?:\.\d+)*)[.、)]\s*/,'').trim();
  const lead=[];let firstHeading=false;
  Array.from(body.childNodes).forEach(node=>{
    const tag=node.localName;
    if(tag==='p'){
      const lv=headingLevelOf(node,W);
      const t=txtOf(node);
      const imgs=blipImages(node);
      if(lv>0){
        firstHeading=true;
        const clean=stripNum(t);
        if(clean){
          const prefix=lv===1?'# ':(lv===2?'## ':'### ');
          lines.push(prefix+clean);
        }
      }else if(t.trim()){
        if(!firstHeading)lead.push(t.trim());else lines.push(t.trim());
      }
      imgs.forEach(i=>lines.push(i));
    }else if(tag==='tbl'){
      const rows=Array.from(node.getElementsByTagNameNS(W,'tr'));
      const tblLines=rows.map(tr=>{
        const row=Array.from(tr.getElementsByTagNameNS(W,'tc')).map(c=>txtOf(c)).join(' | ');
        return '| '+row+' |';
      });
      // 首个标题之前的表格（如封面信息表）归入 lead，避免被 parsePRD 丢弃；首个标题之后照常进正文
      if(!firstHeading)lead.push.apply(lead,tblLines);else lines.push.apply(lines,tblLines);
    }
  });
  if(lead.length){lines.unshift.apply(lines,['## 文档说明'].concat(lead));}
  return lines.join('\n');
}
function isEncryptedDocx(parsed){
  return parsed.some(e=>e.name==='EncryptionInfo.xml'||e.name.includes('EncryptionInfo')||e.name==='EncryptedPackage');
}
async function importDOCX(file,projName){
  pushUndo();
  try{
    const ab=await file.arrayBuffer();
    const buf=new Uint8Array(ab);
    if(buf.length<8){toast('Word 导入失败：文件为空或已损坏');return;}
    const sig=[buf[0],buf[1],buf[2],buf[3]];
    const isPK=sig[0]===0x50&&sig[1]===0x4B;
    const isOLE=sig[0]===0xD0&&sig[1]===0xCF&&sig[2]===0x11&&sig[3]===0xE0;
    if(!isPK){
      if(isOLE){toast('Word 导入失败：该文件是旧版 .doc 格式。请在 Word/WPS 中「另存为」.docx 后再导入；也可另存为 .txt/.md 直接导入文本。');return;}
      toast('Word 导入失败：该文件无法识别，可能已被公司加密/权限保护。请先用解密工具或 Word/WPS 打开并「另存为」未加密的 .docx 后再导入；或另存为 .txt/.md 直接导入文本（加密/权限文件推荐此方式）。');return;
    }
    let parsed;
    try{parsed=parseZip(buf);}catch(zipErr){
      toast('Word 导入失败：不是有效的 zip 压缩包，文件可能已加密或损坏。请另存为未加密 .docx 后再导入；或另存为 .txt/.md 直接导入文本。');return;
    }
    if(isEncryptedDocx(parsed)){toast('该 .docx 已加密/受密码保护，无法直接导入。请先在 Word/WPS 中打开，另存为未加密文档后再导入；或另存为 .txt/.md 直接导入文本（加密文件推荐此方式）。');return;}
    const docEntry=parsed.find(e=>e.name==='word/document.xml');
    if(!docEntry){toast('不是有效的 .docx 文件');return;}
    // 文档关系表：rId -> 资源路径
    const relsEntry=parsed.find(e=>e.name==='word/_rels/document.xml.rels');
    let relsMap={};
    if(relsEntry){
      const rx=buf.slice(relsEntry.offset,relsEntry.offset+relsEntry.compSize);
      const rxb=relsEntry.method===0?rx:await inflateRaw(rx);
      relsMap=parseRels(new TextDecoder().decode(rxb));
    }
    // 媒体文件直接转 base64，供图片内联
    const mediaMap={};
    for(const e of parsed){
      const m=e.name.match(/^word\/media\/(.+)$/);
      if(!m)continue;
      const bytes=buf.slice(e.offset,e.offset+e.compSize);
      const raw=e.method===0?bytes:await inflateRaw(bytes);
      mediaMap[e.name]='data:'+extToMime(m[1])+';base64,'+bufToBase64(raw);
    }
    const raw=buf.slice(docEntry.offset,docEntry.offset+docEntry.compSize);
    const xmlBytes=docEntry.method===0?raw:await inflateRaw(raw);
    const xml=new TextDecoder().decode(xmlBytes);
    const text=extractDocText(xml,relsMap,mediaMap);
    const imgCnt=Object.keys(mediaMap).length;
    if(beginImportPreview(text,projName,'Word 文档「'+projName+'」'))toast('Word 已读取（已尽量保留标题层级、表格'+(imgCnt?'与 '+imgCnt+' 张图片':'')+'），请确认导入范围');
  }catch(err){toast('Word 导入失败：'+(err&&err.message||err));}
}

/* ============ PRD 完整模板（整体式，可编辑 / 粘贴 / 导入） ============ */
const TPL_DRAFT_KEY='prdKanbanTplDraftV1';
/* 内置内容模板库：默认展示 6 套小白可直接使用的场景骨架，高级编辑仍可自定义。 */
const TPL_PRESETS={
  standard:'# PRD 完整模板（标准 14 节）\n\n'
    +'> 撰写提示：必填节必须填写；量化指标给具体数字与判定方式；验收项可"是/否"判定。\n\n'
    +'## 文档变更历史\n| 版本 | 更改内容 | 作者 | 日期 |\n| --- | --- | --- | --- |\n| V0.1 | 初稿 | 【作者】 | 【日期】 |\n\n'
    +'## 目的\n> 一句话说清"为什么做"：解决什么问题、服务谁、带来什么价值。\n\n'
    +'【背景：当前痛点 / 业务机会】\n\n'
    +'【目标：本功能上线后要达到的核心结果】\n\n'
    +'## 适用范围\n【适用系统 / 版本 / 平台，如"XX 系统 V3.2 及以上"】\n\n'
    +'【适用对象：最终用户 / 内部系统】\n\n'
    +'【协作边界：与哪些团队 / 系统的依赖关系】\n\n'
    +'## 定义\n| 术语 | 定义 |\n| --- | --- |\n| 【术语】 | 【定义】 |\n\n'
    +'## 产品信息与目标\n【产品方案概述：核心机制 / 架构分层，1-3 段】\n\n'
    +'- 量化目标 1：【指标】目标值【如 ≥95%】判定方式【如何测量】\n'
    +'- 量化目标 2：【指标】目标值【】判定方式【】\n\n'
    +'## 使用者需求\n作为【角色】，我希望【需求】，以便【价值 / 动机】\n\n'
    +'## 功能需求\n| 功能点 | 描述 | 优先级 | 状态 |\n| --- | --- | --- | --- |\n'
    +'| 【功能名】 | 【一句话描述】 | P0 | 草稿 |\n| 【功能名】 | 【一句话描述】 | P1 | 草稿 |\n\n'
    +'## 非功能需求\n【性能：延迟 / 并发 / 容量，如"端到端延迟 ≤ 1.5s"】\n\n'
    +'【安全：数据加密、权限、脱敏要求】\n\n'
    +'【可用性：SLA，如"月度可用性 ≥ 99.5%"】\n\n'
    +'【接口：对外接口 / 依赖服务，含协议与字段说明】\n\n'
    +'## 自测\n- 功能自测通过率 ≥ 【95】%\n- P0 级 Bug = 0 方可提测\n- 【关键场景】全部有对应测试用例\n\n'
    +'## 埋点\n| 事件 | 触发条件 | 参数 | 上报方式 |\n| --- | --- | --- | --- |\n'
    +'| 【event_name】 | 【触发时机】 | 【参数列表】 | 【实时 / 批量】 |\n\n'
    +'## 界面\n【界面 / 交互说明：状态、动效、反馈；可附设计稿链接】\n\n'
    +'## 验收\n- [ ] 【验收项：可量化、可"是/否"判定】\n- [ ] 【验收项】\n\n'
    +'## 上线\n- 上线前完成 UAT 并由产品 / 测试双签确认\n- 灰度策略：【如 5% 灰度 3 天无 P0 再全量】\n- 回滚方案：【出现 P0 时如何回滚】\n- 上线后监控：【关键指标】48 小时确认达标\n\n'
    +'## 其他相关文件\n- 【关联文档 1】\n- 【关联文档 2】\n',
  agile:'# 精简敏捷 PRD（7 节）\n\n'
    +'> 撰写提示：面向迭代，聚焦"这次要交付什么、怎么验收"，范围要明确排除项。\n\n'
    +'## 目的\n【一句话：本次迭代解决什么问题、成功标准是什么】\n\n'
    +'## 范围\n【做：…】\n\n【不做：…（明确排除项，防范围蔓延）】\n\n'
    +'## 功能需求\n| 功能点 | 描述 | 优先级 | 状态 |\n| --- | --- | --- | --- |\n'
    +'| 【功能名】 | 【描述】 | P0 | 草稿 |\n\n'
    +'## 非功能需求\n【性能 / 安全 / 可用性 / 接口关键约束，缺省写 N/A】\n\n'
    +'## 验收标准\n- [ ] 【可量化的验收项】\n- [ ] 【可量化的验收项】\n\n'
    +'## 上线计划\n【发布时间窗 / 灰度策略 / 回滚方案 / 监控指标】\n\n'
    +'## 其他\n【遗留问题、依赖、待澄清项】\n',
  hardware:'# 通用硬件 / 物联网产品需求模板\n\n'
    +'> 撰写提示：硬件类 PRD 必须覆盖安全、环境、法规与可测试性；量化指标给上下限。\n\n'
    +'## 文档变更历史\n| 版本 | 更改内容 | 作者 | 日期 |\n| --- | --- | --- | --- |\n| V0.1 | 初稿 | 【作者】 | 【日期】 |\n\n'
    +'## 目的\n【一句话：解决什么问题、目标市场 / 用户、商业价值】\n\n'
    +'## 适用范围\n【目标设备 / 硬件平台 / 软件版本】\n\n【环境条件：温度 / 湿度 / 振动等】\n\n'
    +'【法规与合规：认证要求（如 CE / FCC / CCC / 行业强制认证）】\n\n'
    +'## 定义\n| 术语 | 定义 |\n| --- | --- |\n| 【术语】 | 【定义】 |\n\n'
    +'## 产品信息与目标\n【硬件方案概述：关键器件 / 架构】\n\n'
    +'- 目标指标：如【关键指标达标率 ≥ 95%】、【端到端延迟 ≤ 1.5s】、【异常率 ≤ 1 次 / 天】\n\n'
    +'## 使用者需求\n作为【角色】，我希望【需求】，以便【价值】\n\n'
    +'## 功能需求\n| 功能点 | 描述 | 优先级 | 状态 |\n| --- | --- | --- | --- |\n'
    +'| 【功能名】 | 【描述】 | P0 | 草稿 |\n\n'
    +'## 非功能需求\n【性能：延迟 / 功耗 / 并发，给上下限】\n\n'
    +'【安全：功能安全等级、故障降级、敏感指令二次确认】\n\n'
    +'【可用性：SLA 与恢复时间】\n\n'
    +'【接口：硬件接口 / 协议 / 依赖服务】\n\n'
    +'## 自测\n- 环境试验（高低温 / 振动 / EMC）通过\n- 关键场景测试用例全覆盖\n- P0 级 Bug = 0\n\n'
    +'## 埋点\n| 事件 | 触发条件 | 参数 | 上报方式 |\n| --- | --- | --- | --- |\n'
    +'| 【event】 | 【触发】 | 【参数】 | 【方式】 |\n\n'
    +'## 界面\n【人机交互：状态机、提示语、多态反馈】\n\n'
    +'## 验收\n- [ ] 【硬件 / 软件验收项，可量化】\n- [ ] 【安全相关验收项】\n\n'
    +'## 上线\n【SOP 量产节点 / 灰度 / 回滚 / 售后监控】\n\n'
    +'## 其他相关文件\n- 【设计文档 / 规格书 / 认证资料】\n',
  web:'# SaaS / Web 服务需求模板\n\n'
    +'> 适合后台管理、在线服务、会员/订阅和企业工具。请先写清楚谁在什么场景下解决什么问题。\n\n'
    +'## 产品目标\n【要解决的问题、目标用户、成功标准】\n\n'
    +'## 范围与优先级\n- 本期必须做：【】\n- 本期不做：【】\n- 后续再评估：【】\n\n'
    +'## 用户与权限\n| 角色 | 可以做什么 | 不能做什么 |\n| --- | --- | --- |\n| 【角色】 | 【权限】 | 【限制】 |\n\n'
    +'## 核心流程\n1. 用户【进入/登录】\n2. 用户【完成关键操作】\n3. 系统【给出结果与下一步】\n\n'
    +'## 功能清单\n| 功能 | 用户价值 | 优先级 | 验收方式 |\n| --- | --- | --- | --- |\n| 【功能】 | 【价值】 | P0/P1/P2 | 【可判断结果】 |\n\n'
    +'## 数据与异常\n【关键字段、空状态、失败提示、重复提交、权限不足时的处理】\n\n'
    +'## 上线与指标\n【埋点、成功指标、灰度范围、回滚方式】\n',
  mobile:'# 移动 App 需求模板\n\n'
    +'> 适合手机端新功能或独立 App。优先描述用户打开 App 后的完整操作路径。\n\n'
    +'## 产品目标\n【用户要完成什么、为什么现在要做、成功的衡量方式】\n\n'
    +'## 使用场景\n| 场景 | 用户动作 | 期望结果 |\n| --- | --- | --- |\n| 【例如：通勤中】 | 【快速操作】 | 【立即得到反馈】 |\n\n'
    +'## 页面与流程\n1. 【入口页】→ 【操作页】→ 【结果页】\n2. 【返回/取消/重试】时系统如何处理\n\n'
    +'## 功能需求\n| 页面/功能 | 内容与交互 | 优先级 | 验收标准 |\n| --- | --- | --- | --- |\n| 【】 | 【】 | P0/P1/P2 | 【】 |\n\n'
    +'## 状态与边界\n【首次使用、无网络、无内容、加载中、权限拒绝、深链返回、不同屏幕尺寸】\n\n'
    +'## 发布与指标\n【版本范围、灰度、崩溃/性能观察、核心转化指标】\n',
  ai:'# AI 助手 / 智能功能需求模板\n\n'
    +'> 适合在产品中增加 AI 对话、生成、审核或推荐能力。先定义用户要得到的结果，再定义 AI 的边界。\n\n'
    +'## 用户目标\n【用户希望 AI 帮他完成什么；完成后如何判断有用】\n\n'
    +'## 输入与隐私边界\n| 输入内容 | 是否可选 | 是否外发 | 脱敏/限制 |\n| --- | --- | --- | --- |\n| 【】 | 是/否 | 是/否 | 【】 |\n\n'
    +'## AI 工作方式\n1. 用户【输入/选择上下文】\n2. AI【澄清/生成/检测】\n3. 用户【预览、修改、确认或重试】\n\n'
    +'## 输出与人工确认\n【输出格式、引用依据、置信度、哪些操作必须由用户确认】\n\n'
    +'## 异常与安全\n【无答案、错误内容、超时、敏感信息、幻觉提示、停止生成、反馈入口】\n\n'
    +'## 评估与验收\n| 指标 | 目标 | 验收方法 |\n| --- | --- | --- |\n| 【准确性/采纳率/耗时】 | 【】 | 【抽检/数据】 |\n\n'
    +'## 上线策略\n【试用人群、频率限制、模型/成本监控、回滚方案】\n'
};
const TPL_CATALOG={
  standard:{title:'标准 PRD',desc:'适合第一次完整梳理一个产品或功能，覆盖目标、流程、验收和上线。',projectName:'标准 PRD 项目'},
  agile:{title:'精简 MVP',desc:'适合想快速验证一个想法，只保留最小范围和关键验收。',projectName:'MVP 验证项目'},
  web:{title:'SaaS / Web 服务',desc:'适合后台、在线服务、会员或企业工具，内置权限和异常处理。',projectName:'Web 服务项目'},
  mobile:{title:'移动 App',desc:'适合手机端功能，内置页面流程、弱网和首次使用等状态。',projectName:'移动 App 项目'},
  ai:{title:'AI 助手 / 智能功能',desc:'适合对话、生成、审核或推荐，内置隐私边界和人工确认。',projectName:'AI 智能功能项目'},
  hardware:{title:'智能硬件 / 物联网',desc:'适合设备、传感器和软硬件协同，内置安全、环境和验证要求。',projectName:'智能硬件项目'}
};
let tplSelectedKey='standard';
function tplPresetText(key){return String(key||'').indexOf('custom:')===0?((tplCustomList().find(x=>x.id===String(key).slice(7))||{}).text||''):TPL_PRESETS[key];}
function tplPresetMeta(key){
  if(TPL_CATALOG[key])return TPL_CATALOG[key];
  if(String(key||'').indexOf('custom:')===0){const c=tplCustomList().find(x=>x.id===String(key).slice(7));if(c)return {title:c.name,desc:'这是你保存的自定义模板，可从高级编辑继续调整。',projectName:c.name+'项目'};}
  return {title:'自定义内容',desc:'可从高级编辑继续调整后，再生成项目。',projectName:'由模板生成'};
}
function tplRenderGallery(){
  const host=document.getElementById('tplGallery');if(!host)return;
  host.innerHTML=Object.keys(TPL_CATALOG).map(key=>{const m=TPL_CATALOG[key],on=key===tplSelectedKey?' on':'';return '<button type="button" class="tpl-card'+on+'" data-act="tplchoose" data-tpl="'+key+'"><span class="tpl-card-title"><span class="tpl-card-check">✓</span>'+esc(m.title)+'</span><span class="tpl-card-desc">'+esc(m.desc)+'</span></button>';}).join('');
}
function tplRenderPreview(){
  const meta=tplPresetMeta(tplSelectedKey);
  const title=document.getElementById('tplPreviewTitle'),desc=document.getElementById('tplPreviewDesc');
  if(title)title.textContent='已选：'+meta.title;
  if(desc)desc.textContent=meta.desc+' 创建后可直接继续填写，不会要求你编辑 Markdown。';
}
function tplSetSelected(key,backup){
  const text=tplPresetText(key),el=document.getElementById('tplEditor');
  if(!text||!el){toast('模板内容不可用，请重新选择');return false;}
  if(backup&&el.value.trim()&&el.value!==text)localStorage.setItem(TPL_DRAFT_KEY,el.value);
  tplSelectedKey=key;el.value=text;tplEditorInput();
  const sel=document.getElementById('tplPreset');if(sel&&Array.from(sel.options).some(o=>o.value===key))sel.value=key;
  tplRenderGallery();tplRenderPreview();return true;
}
function tplChoose(key){if(tplSetSelected(key,true))toast('已选「'+tplPresetMeta(key).title+'」，可直接新建项目');}
function tplToggleAdvanced(){
  const box=document.getElementById('tplAdvanced'),btn=document.getElementById('tplAdvancedToggle');if(!box)return;
  const opening=box.style.display==='none'||!box.style.display;box.style.display=opening?'block':'none';
  if(btn)btn.textContent=opening?'收起高级编辑':'需要导入或编辑原始模板？打开高级编辑';
  if(opening){const el=document.getElementById('tplEditor');if(el)el.focus();}
}
function tplApplyPreset(){
  const sel=document.getElementById('tplPreset');const key=sel?sel.value:'standard';
  if(tplSetSelected(key,true))toast('已套用「'+tplPresetMeta(key).title+'」（原内容已自动存入草稿）');
}
function tplCustomList(){
  try{const a=JSON.parse(localStorage.getItem('prdKanbanTplCustom')||'[]');return Array.isArray(a)?a:[];}catch(e){return [];}
}
function tplRenderPresets(){
  const sel=document.getElementById('tplPreset');if(!sel)return;
  let html=Object.keys(TPL_CATALOG).map(key=>'<option value="'+key+'">'+esc(TPL_CATALOG[key].title)+'（内置）</option>').join('');
  tplCustomList().forEach(c=>{html+='<option value="custom:'+esc(c.id)+'">'+ICONS.star+' '+esc(c.name)+'（自定义）</option>';});
  sel.innerHTML=html;
  if(Array.from(sel.options).some(o=>o.value===tplSelectedKey))sel.value=tplSelectedKey;
}
function tplSaveAsCustom(){
  const el=document.getElementById('tplEditor');
  const text=(el&&el.value||'').trim();
  if(!text){toast('编辑区为空，无法保存为模板');return;}
  let name=window.__tplSaveName!==undefined?String(window.__tplSaveName):prompt('模板名称：');
  if(name==null)return;
  const nm=String(name).trim()||('自定义模板 '+(tplCustomList().length+1));
  const list=tplCustomList();
  list.push({id:'c'+Date.now().toString(36),name:nm,text:text,at:Date.now()});
  try{localStorage.setItem('prdKanbanTplCustom',JSON.stringify(list));}catch(e){toast('保存失败（本地存储空间不足）');return;}
  tplRenderPresets();
  tplSelectedKey='custom:'+list[list.length-1].id;
  tplRenderPresets();tplRenderGallery();tplRenderPreview();
  toast('已保存自定义模板「'+nm+'」');
}
function tplDeleteCustom(){
  const sel=document.getElementById('tplPreset');if(!sel)return;
  const v=sel.value||'';
  if(v.indexOf('custom:')!==0){toast('内置模板不可删除');return;}
  const id=v.slice(7);
  const list=tplCustomList();
  const item=list.find(x=>x.id===id);
  if(!item)return;
  const ok=window.__tplDelOk!==undefined?!!window.__tplDelOk:confirm('删除自定义模板「'+item.name+'」？');
  if(!ok)return;
  try{localStorage.setItem('prdKanbanTplCustom',JSON.stringify(list.filter(x=>x.id!==id)));}catch(e){toast('删除失败');return;}
  if(tplSelectedKey===v)tplSelectedKey='standard';
  tplRenderPresets();tplRenderGallery();tplRenderPreview();
  toast('已删除「'+item.name+'」');
}
function tplPlaceholder(type){
  if(type==='feat')return '| 功能点 | 描述 | 优先级 | 状态 |\n| --- | --- | --- | --- |\n|  |  |  |  |\n';
  if(type==='accept')return '- [ ] 验收项（需可量化，如响应≤1.5s）\n';
  if(type==='users')return '作为<角色>，我希望<目标>，以便<价值>\n';
  if(type==='table')return '| 字段 | 说明 |\n| --- | --- |\n';
  if(type==='timeline')return '时间线：开发完成 ___ ，上线 ___ \n';
  return '<在此填写内容>\n';
}
function tplDefaultText(){
  let txt='# PRD 完整模板\n\n';
  STATE.framework.forEach(s=>{
    txt+='## '+s.title+(s.required?'（必填）':'')+'\n';
    const g=(s.template||'').trim();
    if(g)txt+='> 撰写提示：'+g+'\n';
    txt+=tplPlaceholder(s.type)+'\n';
  });
  return txt;
}
function showTpl(){
  tplRenderPresets();
  tplSelectedKey='standard';tplSetSelected('standard',false);
  const advanced=document.getElementById('tplAdvanced'),toggle=document.getElementById('tplAdvancedToggle');
  if(advanced)advanced.style.display='none';
  if(toggle)toggle.textContent='需要导入或编辑原始模板？打开高级编辑';
  openModal('tplModal');
}
function tplEditorInput(){const el=document.getElementById('tplEditor');if(el)window.__tplText=el.value;}
function copyTpl(){
  const txt=(document.getElementById('tplEditor')||{}).value||window.__tplText||'';
  if(navigator.clipboard&&txt){navigator.clipboard.writeText(txt).then(()=>toast('已复制模板全文'),()=>toast('复制失败，请手动选择文本'));}
  else{toast('当前环境不支持自动复制，请手动选择');}
}
function insertAtCursor(el,text){
  const s=el.selectionStart,en=el.selectionEnd;
  el.value=el.value.slice(0,s)+text+el.value.slice(en);
  const pos=s+text.length;el.setSelectionRange(pos,pos);el.focus();tplEditorInput();
}
// 富文本（Word/网页）→ Markdown：表格→| 语法、标题→#、图片→![alt](src)、列表→-
function htmlToMd(html){
  const d=document.createElement('div');d.innerHTML=html||'';
  // 元素级：移除 <style>/<link>/<meta>/title 等
  d.querySelectorAll('script,style,link,meta,title').forEach(n=>n.remove());
  // 防御性：剥 Word 网页导出残留"行为属性"（v:behavior 等）
  d.querySelectorAll('*').forEach(n=>{
    if(n.style&&n.style.behavior)n.style.removeProperty('behavior');
    if(n.style&&n.style.cssText&&/behavior:\s*url/i.test(n.style.cssText))n.removeAttribute('style');
  });
  let out='';
  const walk=node=>{
    if(node.nodeType===3){out+=node.textContent;return;}
    if(node.nodeType!==1)return;
    const tag=node.tagName.toLowerCase();
    if(tag==='table'){
      const rows=Array.from(node.querySelectorAll('tr'));
      const md=rows.map((tr,ri)=>{
        const cells=Array.from(tr.children).map(c=>(c.textContent||'').replace(/\s*\n\s*/g,' ').trim());
        const line='| '+cells.join(' | ')+' |';
        return ri===0?line+'\n| '+cells.map(()=>'---').join(' | ')+' |':line;
      }).join('\n');
      out+='\n'+md+'\n';
      return;
    }
    if(tag==='img'){out+='!['+(node.getAttribute('alt')||'')+']('+(node.getAttribute('src')||'')+')';return;}
    if(/^h[1-6]$/.test(tag)){out+='\n'+'#'.repeat(+tag[1])+' '+(node.textContent||'').trim()+'\n';return;}
    if(tag==='li'){out+='- '+(node.textContent||'').trim()+'\n';return;}
    if(tag==='br'){out+='\n';return;}
    node.childNodes.forEach(walk);
    if(tag==='p'||tag==='div'||tag==='section'||tag==='tr'||tag==='ul'||tag==='ol')out+='\n';
  };
  walk(d);
  // 行级：清洗 mso-* / Style Definitions / behavior:url / 单独数字行 等 CSS 噪声
  return out.split(/\n/).map(line=>{
    line=line.replace(/behavior:\s*url\([^)]*\)/gi,'');
    line=line.replace(/mso-[a-z-]+:\s*[^;\n]*/gi,'');
    line=line.replace(/\b(margin|padding|font|color|background|border|line-height|text-align|width|height):\s*0(?:pt|cm|mm|px)?\s*/gi,'');
    line=line.replace(/\s*\/\*\s*Style Definitions\s*\*\/\s*/g,'');
    line=line.replace(/^\s*table\.MsoNormalTable[^{]*$/g,'');
    line=line.replace(/^\s*\d+(?:\.\d+)?\s*$/g,''); // 单独数字行
    return line;
  }).filter(l=>l.trim().length>0).join('\n').replace(/[ \t]+\n/g,'\n').replace(/\n{3,}/g,'\n\n').trim()+'\n';
}
// paste 拦截：剪贴板带富文本（Word/网页）时自动转 Markdown 插入，保住表格/图片/标题
function tplPasteHandler(e){
  const cd=e.clipboardData;if(!cd)return;
  const html=cd.getData('text/html');
  if(html&&/<(table|img|h[1-6]|ol|ul)\b/i.test(html)){
    e.preventDefault();
    insertAtCursor(document.getElementById('tplEditor'),htmlToMd(html));
  }
}
function tplRegen(){
  const el=document.getElementById('tplEditor');
  if(el.value.trim())localStorage.setItem(TPL_DRAFT_KEY,el.value); // 先自动备份，防误丢
  el.value=tplDefaultText();tplSelectedKey='';tplEditorInput();tplRenderGallery();tplRenderPreview();
  toast('已生成默认模板（原内容已自动存入草稿，可点「载入草稿」找回）');
}
function tplSaveDraft(){
  const el=document.getElementById('tplEditor');
  localStorage.setItem(TPL_DRAFT_KEY,el.value);
  toast('模板草稿已保存，可在高级编辑中随时载入');
}
function tplLoadDraft(){
  const draft=localStorage.getItem(TPL_DRAFT_KEY);
  if(!draft){toast('暂无已保存的草稿');return;}
  const el=document.getElementById('tplEditor');
  el.value=draft;tplSelectedKey='';tplEditorInput();tplRenderGallery();tplRenderPreview();
  toast('已载入上次保存的草稿');
}
function tplImportFile(){
  const el=document.getElementById('tplEditor');
  if(el.value.trim())localStorage.setItem(TPL_DRAFT_KEY,el.value); // 导入前自动备份
  const inp=document.getElementById('tplFileInput');
  inp.value='';inp.click();
}
function handleTplFile(e){
  const f=e.target.files[0];if(!f)return;
  const nm=(f.name||'').toLowerCase();
  const el=document.getElementById('tplEditor');
  if(nm.endsWith('.docx')){
    toast('正在解析 Word 模板…');
    readDocxText(f).then(text=>{
      if(text==null){toast('Word 解析失败或为空');return;}
      el.value=text;tplSelectedKey='';tplEditorInput();tplRenderGallery();tplRenderPreview();
      toast('Word 模板已载入编辑区（可继续编辑后保存/导入项目）');
    }).catch(err=>toast('Word 导入失败：'+(err&&err.message||err)));
    return;
  }
  const rd=new FileReader();
  rd.onload=()=>{
    let text=String(rd.result||'');
    if(nm.endsWith('.html')||nm.endsWith('.htm')){text=htmlToMd(text);}
    el.value=text;tplSelectedKey='';tplEditorInput();tplRenderGallery();tplRenderPreview();
    toast('模板已载入编辑区（可继续编辑后保存/导入项目）');
  };
  rd.readAsText(f);
  e.target.value='';
}
// 只提取 .docx 文本（图片转 data URL 内联），不写入项目
async function readDocxText(file){
  const ab=await file.arrayBuffer();
  const buf=new Uint8Array(ab);
  if(buf.length<8){toast('模板载入失败：文件为空或已损坏');return null;}
  const sig=[buf[0],buf[1],buf[2],buf[3]];
  const isPK=sig[0]===0x50&&sig[1]===0x4B;
  const isOLE=sig[0]===0xD0&&sig[1]===0xCF&&sig[2]===0x11&&sig[3]===0xE0;
  if(!isPK){
    if(isOLE){toast('模板载入失败：该文件是旧版 .doc 格式，请另存为 .docx 后再导入；也可另存为 .txt/.md 直接导入文本');return null;}
    toast('模板载入失败：该文件可能已被加密/保护，请另存为未加密 .docx 后再导入；或另存为 .txt/.md 直接导入文本（加密/权限文件推荐此方式）');return null;
  }
  let parsed;
  try{parsed=parseZip(buf);}catch(zipErr){
    toast('模板载入失败：不是有效的 zip 压缩包，文件可能已加密或损坏；请另存为未加密 .docx 或 .txt/.md 再导入');return null;
  }
  if(isEncryptedDocx(parsed)){toast('该 .docx 已加密/受密码保护，请先在 Word/WPS 中打开并另存为未加密文档');return null;}
  const docEntry=parsed.find(e=>e.name==='word/document.xml');
  if(!docEntry){toast('不是有效的 .docx 文件');return null;}
  const relsEntry=parsed.find(e=>e.name==='word/_rels/document.xml.rels');
  let relsMap={};
  if(relsEntry){
    const rx=buf.slice(relsEntry.offset,relsEntry.offset+relsEntry.compSize);
    const rxb=relsEntry.method===0?rx:await inflateRaw(rx);
    relsMap=parseRels(new TextDecoder().decode(rxb));
  }
  const mediaMap={};
  for(const e of parsed){
    const m=e.name.match(/^word\/media\/(.+)$/);
    if(!m)continue;
    const bytes=buf.slice(e.offset,e.offset+e.compSize);
    const raw=e.method===0?bytes:await inflateRaw(bytes);
    mediaMap[e.name]='data:'+extToMime(m[1])+';base64,'+bufToBase64(raw);
  }
  const raw=buf.slice(docEntry.offset,docEntry.offset+docEntry.compSize);
  const xmlBytes=docEntry.method===0?raw:await inflateRaw(raw);
  return extractDocText(new TextDecoder().decode(xmlBytes),relsMap,mediaMap);
}
function tplApply(asNew){
  const el=document.getElementById('tplEditor');
  const text=(el.value||'').trim();
  if(!text){toast('编辑区为空，请先粘贴/导入/输入内容');return;}
  const meta=tplPresetMeta(tplSelectedKey);
  if(asNew){
    const nm=window.__tplProjectName!==undefined?String(window.__tplProjectName):prompt('新项目名称：',meta.projectName||'由模板生成');
    if(nm==null)return;
    createProject(nm.trim()||'由模板生成');
  }
  doImportText(text,meta.title||'由模板生成');
  closeModal('tplModal');
  toast(asNew?'已用模板生成新项目（框架按标题自动划分，请核对）':'已按模板内容导入当前项目');
}

/* ============ 示例 ============ */
// 旧版示例（通用任务看板结构，兼容历史）
// 示例 PRD：标准 14 节框架（轻量团队协作工具）
function sampleData(){
  const d=blankData(DEFAULT_FRAMEWORK);
  d.meta={rows:[{cells:['版本','更改内容','作者','日期']},{cells:['V1.0','初稿（示例 PRD）','产品团队','2026-08-16']}],cards:[]};
  d.purpose={html:'<p>本文档定义轻量团队协作工具「协同」的核心需求：明确痛点、目标用户、核心业务流程、功能边界与验收标准。</p><p>本产品面向 10-200 人规模的中小团队，把任务看板、文档、进度同步统一到一个工作空间，减少在多个工具间切换带来的信息割裂与沟通损耗。</p>',cards:[]};
  d.scope={html:'<p>本文档适用于「协同」Web 端与移动端（iOS / Android）的任务协作模块开发与测试，为跨端通用能力。</p><ul><li>适用端：Web 工作台、移动端 App（双端功能对齐）</li><li>适用团队：研发、设计、运营、市场等需要协同推进项目的团队</li><li>协作边界：即时通讯与日历由第三方集成提供；账号体系支持企业 SSO 接入；开放 API 供内部系统对接</li></ul>',cards:[]};
  d.def={rows:[{cells:['术语','定义']},{cells:['看板','以列为状态、卡片为任务的视图，拖拽即流转']},{cells:['任务','最小工作单元，含负责人 / 截止日 / 子项 / 状态']},{cells:['工作流','任务从创建到完成的阶段定义与流转规则']},{cells:['角色','成员在团队 / 项目中的权限身份（管理员 / 成员 / 访客）']},{cells:['里程碑','一组任务的集合目标与关键时间点']},{cells:['实时协同','多人同时查看 / 编辑同一看板，变更秒级同步']}],cards:[]};
  d.prodinfo={html:'<p>在现有「列表 + 表单」任务管理基础上，新增实时协同看板与工作流引擎，实现多人同时编辑、状态自动流转、进度自动汇总。整体方案自上而下分四层：交互层（Web / 移动端渲染与拖拽）、业务层（任务 / 权限 / 通知 / 工作流）、数据层（关系存储 + 实时同步）、集成层（SSO / 日历 / Webhook / 开放 API）。</p><p>量化目标（上线判断依据）：</p><ul><li>任务创建到可见响应 ≤ 200ms</li><li>多人协同编辑端到端同步延迟 ≤ 500ms（P95）</li><li>服务可用性 ≥ 99.9%（月度不可用 ≤ 43 分钟）</li><li>离线状态下可查看与本地编辑，恢复网络后自动合并</li><li>核心流程（建任务→分派→更新→完成）转化率 ≥ 40%</li></ul>',cards:[]};
  d.users={items:[
    {role:'团队负责人',want:'一眼看清各项目进度与阻塞',soThat:'及时纠偏、合理调配资源'},
    {role:'执行成员',want:'快速领取与更新自己的任务',soThat:'减少站会与私聊的沟通成本'},
    {role:'项目管理员',want:'按角色配置成员权限',soThat:'保证敏感数据安全与合规'},
    {role:'干系人 / 管理者',want:'以只读看板了解进展',soThat:'无需打扰团队即可掌握全局'}
  ],cards:[]};
  d.feat={items:[
    {name:'看板视图与拖拽',desc:'多列状态看板，卡片拖拽即流转，支持分组与筛选',priority:'P0',status:'评审中'},
    {name:'任务详情与子任务',desc:'负责人 / 截止日 / checklist / 附件 / 评论，支持子任务拆解',priority:'P0',status:'评审中'},
    {name:'实时协同编辑',desc:'多人同时编辑同一看板，变更秒级同步并展示在线成员',priority:'P0',status:'草稿'},
    {name:'@评论与通知',desc:'任务内 @成员，变更触发站内 / 邮件 / Webhook 通知',priority:'P1',status:'草稿'},
    {name:'角色权限（RBAC）',desc:'管理员 / 成员 / 访客三级，按项目独立配置',priority:'P0',status:'评审中'},
    {name:'工作流引擎',desc:'自定义阶段与流转规则，状态变更自动联动通知',priority:'P1',status:'草稿'},
    {name:'模板库',desc:'从常用项目模板一键创建，降低建项成本',priority:'P2',status:'草稿'},
    {name:'第三方集成',desc:'SSO 登录、日历双向同步、开放 API 与 Webhook',priority:'P1',status:'草稿'}
  ],cards:[]};
  d.nfr={html:'<ul><li>性能：看板万级卡片下首屏 ≤ 1.5s；协同同步 P95 ≤ 500ms；批量操作 ≤ 1s</li><li>安全：数据传输与存储全程加密；支持企业 SSO 与审计日志；敏感操作需二次确认</li><li>可用性：整体可用性 ≥ 99.9%；单模块故障不影响其他模块</li><li>接口：开放 API 基于 REST + Webhook；SSO 遵循 OIDC 协议</li></ul>',cards:[]};
  d.selftest={html:'<ul><li>功能自测通过率 ≥ 95%</li><li>P0 级 Bug 数量 = 0 方可提测</li><li>实时协同冲突合并测试全覆盖</li><li>权限矩阵（9 种角色×操作）全部用例通过</li></ul>',cards:[]};
  d.track={rows:[{cells:['事件','触发条件','参数','上报方式']},{cells:['task_create','任务创建','创建人 / 项目 / 来源','实时']},{cells:['task_update','任务状态或字段变更','字段 / 旧值 / 新值','实时']},{cells:['comment_add','新增评论或 @','任务 / 评论人 / 被@人','实时']},{cells:['integration_call','第三方接口调用','类型 / 耗时 / 结果','批量']}],cards:[]};
  d.ui={html:'<ul><li>看板列头常驻状态色与计数，卡片显示负责人头像与截止日</li><li>触控目标最小 44×44px；支持暗色模式；移动端单列自适应</li><li>冲突合并时以高亮提示被他人修改的字段，由用户选择保留</li><li>只读访客隐藏编辑入口与敏感字段</li></ul>',cards:[]};
  d.accept={items:[
    {text:'创建任务并拖拽到「进行中」，看板与列表视图状态一致',status:'na',id:uid()},
    {text:'两人同时编辑同一任务的不同字段，双方均看到对方更新且无覆盖',status:'na',id:uid()},
    {text:'将成员角色改为「访客」，其无法看到标记为敏感的字段',status:'na',id:uid()},
    {text:'任务临近截止日自动触发一次提醒通知',status:'na',id:uid()},
    {text:'断网后在本地修改任务，恢复网络后变更自动合并且无误',status:'na',id:uid()},
    {text:'通过 SSO 登录后默认进入上次打开的项目',status:'na',id:uid()},
    {text:'从项目模板创建，自动带出预置看板与任务',status:'na',id:uid()},
    {text:'配置 Webhook 后任务状态变更成功回调外部系统',status:'na',id:uid()}
  ],cards:[]};
  d.launch={html:'<ul><li>上线前完成 UAT 并由产品 / 测试双签确认</li><li>灰度策略：先 5% 团队灰度 3 天，无 P0 再扩至 100%</li><li>上线时间窗：业务低峰时段 02:00-04:00</li><li>回滚方案：灰度期间出现 P0 立即回滚至上一稳定版本并关闭实时协同开关</li><li>上线后监控埋点 48 小时，确认协同延迟与可用性在目标区间</li></ul>',cards:[]};
  d.other={html:'<ul><li>《协同 产品需求总纲 V1.0》</li><li>《权限模型与 RBAC 设计文档》</li><li>《实时协同冲突合并技术方案》</li><li>《开放 API 与 Webhook 接入规范》</li></ul><p>核对清单：目的 / 定义 / 量化目标 / 场景 / 功能总览 / 异常处理 / 权限 / 验收均已覆盖，验收 8 条均可「是/否」判定。</p>',cards:[]};
  return d;
}
function loadSample(){
  if(!currentProj()){createProject('示例 PRD','default');}
  const d=sampleData();
  DATA=d;currentProj().data=d;currentProj().sampleGuide=true;save();render();toast('已加载示例 PRD（标准 14 节框架 · 轻量团队协作工具）');
}

/* ============ 启动 ============ */
/* ============ 总览（v17.17：多项目健康度看板） ============ */
function healthForProject(p){
  if(!p)return null;
  const savedFw=STATE.framework,savedData=DATA,savedActive=STATE.activeProjectId;
  try{
    STATE.framework=p.framework||[];
    DATA=p.data||{};
    STATE.activeProjectId=p.id;
    return runHealth();
  }catch(e){return null;}
  finally{
    STATE.framework=savedFw;DATA=savedData;STATE.activeProjectId=savedActive;
  }
}
function renderOverview(){
  const panel=document.getElementById('overviewPanel');if(!panel)return;
  const projects=STATE.projects||[];
  const stats=projects.map(p=>({p,h:healthForProject(p)}));
  // v17.20 总览排序：0=风险优先(红节在前，再按完成度升序) 1=完成度升序 2=最近更新降序
  stats.sort(function(a,b){
    const ma=a.h?a.h.metrics:null,mb=b.h?b.h.metrics:null;
    const ra=ma?ma.risk:0,rb=mb?mb.risk:0;
    if(ovSortMode===0){if(ra!==rb)return rb-ra;return (ma?ma.completion:0)-(mb?mb.completion:0);}
    if(ovSortMode===1)return (ma?ma.completion:0)-(mb?mb.completion:0);
    return (b.p.updatedAt||0)-(a.p.updatedAt||0);
  });
  const avg=stats.length?Math.round(stats.reduce((a,s)=>a+(s.h?s.h.metrics.completion:0),0)/stats.length):0;
  const redProj=stats.filter(s=>s.h&&s.h.metrics.risk>0).length;
  const aiCount=projects.filter(p=>p.ai&&p.ai.lastReport).length;
  const sortLbl=ovSortMode===0?'风险优先':ovSortMode===1?'完成度升序':'最近更新';
  let html='<div class="ov-head"><b>总览</b><span class="muted">'+projects.length+' 个项目 · 平均完成度 '+avg+'% · 有风险项目 '+redProj+' · 有 AI 总评 '+aiCount+'</span>'
    +'<button class="btn btn--sm btn--ghost" data-act="ovsort" title="切换排序方式">排序：'+sortLbl+' ▾</button><button class="btn btn--sm btn--ghost" data-act="ovclose" aria-label="关闭">×</button></div>';
  if(!projects.length){
    html+='<div class="ov-empty">还没有项目。点击「＋ 新建项目」、导入 Word/MD，或到 AI 面板用「<svg class="hw-ic-inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20l4.2-1.1 11-11-3.1-3.1-11 11L4 20Z"/><path d="M13.9 6.9l3.1 3.1"/></svg> AI 撰写」从描述生成草稿。</div>';
  }else{
    html+='<div class="ov-grid">';
    stats.forEach(s=>{
      const p=s.p;
      if(!s.h){html+='<div class="ov-card"><div class="ov-top"><b>'+esc(p.name)+'</b></div><div class="muted">健康度计算失败</div></div>';return;}
      const m=s.h.metrics;
      const grp=(STATE.groups||[]).find(g=>g.id===p.groupId);
      const dots=(p.framework||[]).map(f=>{
        const e=s.h.sec[f.id]?s.h.sec[f.id].effective:'green';
        return '<i class="'+e+'" title="'+esc(f.title)+'"></i>';
      }).join('');
      const ai=p.ai&&p.ai.lastReport?p.ai.lastReport:null;const ovGrade=m.risk>0?'C':(m.completion>=80?'A':'B');const ovGradeCls=m.risk>0?'c':(m.completion>=80?'a':'b');
      html+='<div class="ov-card" data-act="ovopen" data-id="'+esc(p.id)+'" title="点击打开项目">'
        +'<div class="ov-top"><b>'+esc(p.name)+'</b>'+(grp?'<span class="ov-grp">'+esc(grp.name)+'</span>':'')+'<span class="ov-pill ov-pill--'+ovGradeCls+'">'+ovGrade+'</span></div>'
        +'<div class="ov-metric"><span class="ov-comp '+(m.completion>=80?'ok':m.completion>=60?'warn':'bad')+'">完成度 '+m.completion+'%</span><span class="ov-risk '+(m.risk?'bad':'ok')+'">红节 '+m.risk+'</span>'+(ai?'<span class="ov-ai">AI '+ai.total+'</span>':'')+'</div>'
        +'<div class="ov-dots">'+dots+'</div>'
        +'<div class="ov-meta muted">'+(p.updatedAt?new Date(p.updatedAt).toLocaleString():'未更新')+'</div>'
        +'</div>';
    });
    html+='</div>';
  }
  panel.innerHTML='<div class="ov-inner">'+html+'</div>';
  panel.classList.add('open');
}
function toggleOverview(){
  const panel=document.getElementById('overviewPanel');if(!panel)return;
  if(panel.classList.contains('open'))panel.classList.remove('open');
  else renderOverview();
}
var ovSortMode=0;
function injectOverviewPanel(){
  if(document.getElementById('overviewPanel'))return;
  const d=document.createElement('div');
  d.id='overviewPanel';d.className='ov-panel';
  d.addEventListener('click',e=>{if(e.target===d)d.classList.remove('open');});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')d.classList.remove('open');});
  document.body.appendChild(d);
}
/* ===== 手机端交互：点按波纹 + 滑动返回 ===== */
function bindRipple(){
  document.addEventListener('pointerdown',e=>{
    const el=e.target.closest('.btn,.top-icon-btn,.modal .m-foot button,.fw-row .ord button,a[data-tocid],.pp-proj');
    if(!el||el.classList.contains('dragging'))return;
    const r=el.getBoundingClientRect();const size=Math.max(r.width,r.height);
    const ink=document.createElement('span');ink.className='ripple-ink';
    ink.style.width=ink.style.height=size+'px';
    ink.style.left=(e.clientX-r.left-size/2)+'px';ink.style.top=(e.clientY-r.top-size/2)+'px';
    el.appendChild(ink);setTimeout(()=>{if(ink.parentNode)ink.remove();},520);
  },{passive:true});
}
function bindSwipeClose(){
  function bindSwipe(el,axis,pos,closeFn,gate){
    gate = gate || el;
    if(!el)return; let sx=0,sy=0,dx=0,dy=0,trk=false;
    el.addEventListener('touchstart',e=>{ if(e.touches.length!==1){trk=false;return;} const t=e.touches[0]; sx=t.clientX; sy=t.clientY; dx=0;dy=0; trk=true; el.classList.add('swiping'); },{passive:true});
    el.addEventListener('touchmove',e=>{ if(!trk)return; const t=e.touches[0]; dx=t.clientX-sx; dy=t.clientY-sy;
      if(gate.classList.contains('open')){
        if(axis==='x'&&(pos>0?dx>0:dx<0)) el.style.transform=(pos>0?'translateX('+Math.min(dx,180)+'px)':'translateX('+Math.max(dx,-180)+'px)');
        else if(axis==='y'&&dy>0) el.style.transform='translateY('+Math.min(dy,180)+'px)';
      }
    },{passive:true});
    el.addEventListener('touchend',e=>{ if(!trk)return; trk=false; el.classList.remove('swiping'); el.style.transform='';
      const horiz=axis==='x'; const dist=horiz?dx:dy; const dom=horiz?Math.abs(dx)>Math.abs(dy):Math.abs(dy)>Math.abs(dx);
      const ok=dom && (pos>0?dist>70:dist<-70); if(ok)closeFn();
    });
    el.addEventListener('touchcancel',()=>{ trk=false; el.classList.remove('swiping'); el.style.transform=''; });
  }
  const ai=document.getElementById('aiPanel'); bindSwipe(ai,'x',1,()=>aiClosePanel());
  const sb=document.getElementById('sidebar'); bindSwipe(sb,'x',-1,()=>closeSidebar());
  document.querySelectorAll('.modal .m-head').forEach(h=>{ const m=h.closest('.modal'); if(m){ const box=h.closest('.box')||m; bindSwipe(box,'y',1,()=>closeModal(m.id),m); } });
}
function init(){
  load();injectOverviewPanel();bindStatic();initMediaBar();initTblResize();if(window.__syncViewBanner)window.__syncViewBanner();bindRipple();bindSwipeClose();
  // 内容编辑失焦保存（合并而非整体替换：保住 rows/cards/items 等结构化数据，避免表格内容"莫名消失"）
  document.addEventListener('blur',e=>{
    const t=e.target.closest('[data-act="editable"]');
    if(t){const id=t.dataset.id;const cur=DATA[id]||{};DATA[id]=Object.assign({},cur,{html:t.innerHTML});save();if(currentProj())refreshHealthUI();}
    const cb=e.target.closest('[data-act="cardbody"]');
    if(cb){const sec=cb.dataset.sec;const idx=+cb.dataset.idx;const c=DATA[sec];if(c&&c.cards&&c.cards[idx]){c.cards[idx].html=cb.innerHTML;save();if(currentProj())refreshHealthUI();}}
  },true);
  // v16.2：正文/卡片输入即保存（防抖 500ms），不再只依赖失焦；与上面的 blur 兜底并存
  document.addEventListener('input',e=>{
    const ed=e.target.closest&&e.target.closest('.editable[data-act="editable"],.sub-card-body[data-act="cardbody"]');
    if(ed){ pushUndoGroup(ed); scheduleEditableSave(ed); }
  });
  // 粘贴自适应：清洗 Word/Excel 带来的固定 width/height，令表格/图片随容器缩放
  // —— 黏贴：支持「图片文件」（截图 / AI 生图 / 复制的图片）→ 转 base64 内联，离线也能显示 ——
  document.addEventListener('paste',e=>{
    const el=e.target;
    if(!el||!el.classList||!el.classList.contains('editable'))return;
    const cd=e.clipboardData||window.clipboardData;
    if(!cd)return;
    // 1) 剪贴板里的图片文件优先：直接内联为 <img>，避免只粘出文件名/空白
    const imgFiles=[];
    if(cd.items){for(let i=0;i<cd.items.length;i++){const it=cd.items[i];if(it.kind==='file'&&it.type&&it.type.indexOf('image/')===0){const f=it.getAsFile();if(f)imgFiles.push(f);}}}
    if(cd.files&&cd.files.length){for(let i=0;i<cd.files.length;i++){if(cd.files[i].type&&cd.files[i].type.indexOf('image/')===0)imgFiles.push(cd.files[i]);}}
    if(imgFiles.length){
      e.preventDefault();
      let pend=imgFiles.length,oversized=false;
      imgFiles.forEach(f=>{if(f.size>2*1024*1024)oversized=true;const rd=new FileReader();rd.onload=()=>{insertImageAtCursor(el,rd.result);if(--pend===0){saveEditableEl(el);if(oversized)toast('部分图片较大，已内联（注意存储空间）');}};rd.readAsDataURL(f);});
      return;
    }
    // 2) 富文本（网页 / AI 工具复制出来的 <img> 外链或内联）
    const html=cd.getData('text/html');
    if(html){
      e.preventDefault();
      const doc=new DOMParser().parseFromString('<body>'+html+'</body>','text/html');
      const strip=n=>{n.removeAttribute('width');n.removeAttribute('height');if(n.removeAttribute)n.removeAttribute('style');if(n.style){n.style.width='';n.style.height='';n.style.minWidth='';n.style.maxWidth='';}};
      doc.body.querySelectorAll('table,img,td,th,tr,col,colgroup,thead,tbody').forEach(strip);
      doc.body.querySelectorAll('table').forEach(t=>{t.classList.add('resp-table');if(!t.getAttribute('border'))t.setAttribute('border','1');});
      doc.body.querySelectorAll('img').forEach(im=>im.classList.add('resp-img'));
      const frag=doc.body.innerHTML;
      try{ document.execCommand('insertHTML',false,frag); }catch(err){ try{ document.execCommand('paste'); }catch(e2){} }
      saveEditableEl(el);
      return;
    }
    // 3) 纯文本：若只粘了一个图片链接，直接转成图片（避免只显示 URL 文字）
    const txt=(cd.getData('text/plain')||'').trim();
    if(txt&&/^https?:\/\/\S+\.(png|jpe?g|gif|webp|bmp|svg)(\?\S*)?$/i.test(txt)){
      e.preventDefault();
      insertImageAtCursor(el,txt);
      saveEditableEl(el);
      return;
    }
    // 其余纯文本交给浏览器默认粘贴，不会撑版
  });
  // —— 拖拽图片文件进入编辑区也可内联 ——
  document.addEventListener('dragover',e=>{
    if(e.target&&e.target.classList&&e.target.classList.contains('editable')){const dt=e.dataTransfer;if(dt&&dt.types&&Array.prototype.indexOf.call(dt.types,'Files')>=0){e.preventDefault();dt.dropEffect='copy';}}
  });
  document.addEventListener('drop',e=>{
    const el=e.target;
    if(!el||!el.classList||!el.classList.contains('editable'))return;
    const dt=e.dataTransfer;if(!dt||!dt.files||!dt.files.length)return;
    const imgs=Array.prototype.filter.call(dt.files,f=>f.type&&f.type.indexOf('image/')===0);
    if(!imgs.length)return;
    e.preventDefault();
    let pend=imgs.length,oversized=false;
    imgs.forEach(f=>{if(f.size>2*1024*1024)oversized=true;const rd=new FileReader();rd.onload=()=>{insertImageAtCursor(el,rd.result);if(--pend===0){saveEditableEl(el);if(oversized)toast('部分图片较大，已内联（注意存储空间）');}};rd.readAsDataURL(f);});
  });
  render();
  // v17.24：引导已移入「更多 → 帮助」，不再首启自动弹出
}
/* ============ 图片/表格 选中·缩放·删除 ============ */
let selMedia=null;
function initMediaBar(){
  ensureImgHandle();
  let bar=document.getElementById('mediaBar');
  if(!bar){bar=document.createElement('div');bar.className='media-bar';bar.id='mediaBar';document.body.appendChild(bar);}
  // v15.4：富文本表格 hover 即触发 selectMedia。⚠️ e.target 在 contenteditable 里常为文本节点（无 closest），必须按 nodeType 取父元素
  document.addEventListener('mouseover',function(e){
    var el=e.target;
    if(el&&el.nodeType!==1&&el.parentElement)el=el.parentElement;
    if(!el||!el.closest)return;
    var t=el.closest('.editable[data-act="editable"] table, .sub-card-body table');
    if(!t)return;
    if(t.closest('.table-scroll'))return; // 结构化表格走原点击逻辑
    var ed=t.closest('.editable,.sub-card-body');
    if(!ed)return;
    if(!ed.isConnected)return;
    if(selMedia&&selMedia.node===t)return;
    selectMedia(t,ed);
  });
  // v16.4：行/列增删改统一走右键菜单，浮动条只保留缩放与删除
  bar.innerHTML='<span class="sizes"></span><button class="del">删除</button>';
  bar.addEventListener('click',e=>{
    if(!selMedia)return;
    const b=e.target.closest('button');if(!b)return;
    const node=selMedia.node,ed=selMedia.ed;
    if(b.classList.contains('del')){node.remove();saveEditableEl(ed);hideMediaBar();return;}
    const w=b.dataset.w;
    if(w){node.style.width=w;if(node.tagName==='IMG')node.style.height='auto';saveEditableEl(ed);}
  });
  bar.addEventListener('mousedown',e=>{
    const b=e.target.closest('[data-resize]');if(!b||!selMedia)return;
    e.preventDefault();
    const node=selMedia.node,ed=selMedia.ed;
    const startX=e.clientX,startW=node.offsetWidth;
    function mm(ev){const dw=ev.clientX-startX;const newW=Math.max(40,startW+dw);node.style.width=newW+'px';if(node.tagName==='IMG')node.style.height='auto';else if(node.tagName==='TABLE')scaleTblCols(node,newW/startW);positionMediaBar(node);positionImgHandle(node);}
    function mu(){document.removeEventListener('mousemove',mm);document.removeEventListener('mouseup',mu);document.body.style.cursor='';if(node.tagName==='TABLE')saveTblLayout(node);else saveEditableEl(ed);hideImgHandle();}
    document.body.style.cursor='nwse-resize';
    document.addEventListener('mousemove',mm);document.addEventListener('mouseup',mu);
  });
}
function stripRtblHtml(h){
  // v16.4：操作条/×按钮已改为右键菜单，保存/渲染时仍剥离历史残留（含旧版注入到单元格里的 × 按钮）
  return String(h||'')
    .replace(/<div class="rtbl-wrap"[^>]*data-rtbl="1"[\s\S]*?<\/div>/gi,'')
    .replace(/<div class="rtbl-wrap"[^>]*>[\s\S]*?<\/div>/gi,'')
    .replace(/<div class="rtbl-wrap"[\s\S]*?<\/div>/gi,'')
    .replace(/<span class="rtbl-(?:row|col)-del"[\s\S]*?<\/span>/gi,'');
}
function saveEditableEl(ed){
  if(!ed)return;
  var h=stripRtblHtml(ed.innerHTML);
  if(ed.dataset.act==='editable'){const id=ed.dataset.id;const cur=DATA[id]||{};DATA[id]=Object.assign({},cur,{html:h});}
  else if(ed.dataset.act==='cardbody'){const sec=ed.dataset.sec,idx=+ed.dataset.idx;const c=DATA[sec];if(c&&c.cards&&c.cards[idx])c.cards[idx].html=h;}
  save();if(currentProj())refreshHealthUI();
}
// v16.2：正文/卡片输入时先同步内存（DOM→DATA），再防抖落盘。
// 之前只在 blur 保存：未失焦直接关页/切项目时，beforeunload 里的 flushSave() 也救不了
// （内容还只在 DOM，没进 DATA）。现在输入即同步，关闭页面/切项目都不会丢最后输入。
let editableSaveTimer=null;
function syncEditableData(ed){
  if(!ed)return;
  const h=stripRtblHtml(ed.innerHTML);
  if(ed.dataset.act==='editable'){const id=ed.dataset.id;const cur=DATA[id]||{};DATA[id]=Object.assign({},cur,{html:h});}
  else if(ed.dataset.act==='cardbody'){const sec=ed.dataset.sec,idx=+ed.dataset.idx;const c=DATA[sec];if(c&&c.cards&&c.cards[idx])c.cards[idx].html=h;}
  markDirty();
}
function scheduleEditableSave(ed){
  syncEditableData(ed);
  if(editableSaveTimer)clearTimeout(editableSaveTimer);
  editableSaveTimer=setTimeout(()=>{
    editableSaveTimer=null;
    try{save();if(currentProj())refreshHealthUI();}catch(e){}
  },500);
}
/* 图片/表格 拖拽缩放手柄：选中元素右下角的小方块，按住拖动即改宽度（高度等比） */
let imgResizeHandle=null;
function ensureImgHandle(){
  if(imgResizeHandle)return;
  imgResizeHandle=document.createElement('div');
  imgResizeHandle.id='imgResizeHandle';
  imgResizeHandle.className='img-resize-handle';
  imgResizeHandle.title='拖动调整大小';
  document.body.appendChild(imgResizeHandle);
  imgResizeHandle.addEventListener('mousedown',e=>{
    if(!selMedia||(selMedia.node.tagName!=='IMG'&&selMedia.node.tagName!=='TABLE'))return;
    e.preventDefault();e.stopPropagation();
    const node=selMedia.node,ed=selMedia.ed;
    const startX=e.clientX,startW=node.offsetWidth;
    imgResizeHandle.classList.add('active');
    function mm(ev){const dw=ev.clientX-startX;const newW=Math.max(30,startW+dw);if(node.tagName==='IMG'){node.style.width=newW+'px';node.style.height='auto';}else if(node.tagName==='TABLE'){const cg=node.querySelector('colgroup');if(cg){scaleTblCols(node,newW/startW);}else{node.style.width=newW+'px';}}positionMediaBar(node);positionImgHandle(node);}
    function mu(){document.removeEventListener('mousemove',mm);document.removeEventListener('mouseup',mu);imgResizeHandle.classList.remove('active');document.body.style.cursor='';if(node.tagName==='TABLE')saveTblLayout(node);else saveEditableEl(ed);hideImgHandle();}
    document.body.style.cursor='nwse-resize';
    document.addEventListener('mousemove',mm);document.addEventListener('mouseup',mu);
  });
}
function positionImgHandle(node){
  if(!imgResizeHandle)return;
  const r=node.getBoundingClientRect();
  imgResizeHandle.style.left=(r.right+window.scrollX-9)+'px';
  imgResizeHandle.style.top=(r.bottom+window.scrollY-9)+'px';
  imgResizeHandle.style.display='block';
}
function hideImgHandle(){if(imgResizeHandle)imgResizeHandle.style.display='none';}
// 在光标处（或编辑区末尾）插入一张内联图片（src 可为 base64 或图片链接）
function insertImageAtCursor(ed,src){
  const img=document.createElement('img');
  img.src=src;img.className='resp-img';img.style.maxWidth='100%';
  const sel=window.getSelection();
  if(sel&&sel.rangeCount>0&&ed.contains(sel.anchorNode)){
    const range=sel.getRangeAt(0);
    range.deleteContents();range.insertNode(img);
    const r=document.createRange();r.setStartAfter(img);r.collapse(true);
    sel.removeAllRanges();sel.addRange(r);
  }else{
    ed.appendChild(img);ed.appendChild(document.createElement('br'));
  }
}
// 在光标处插入一张用户自建表格（rows/cols 由弹窗指定）
function insertTableAtCursor(ed,rows,cols,headers){
  const tbl=document.createElement('table');
  tbl.className='tbl user-tbl';
  const thead=document.createElement('thead');
  const trh=document.createElement('tr');
  for(let j=0;j<cols;j++){const th=document.createElement('th');th.textContent=headers&&headers[j]!=null?headers[j]:('列'+(j+1));trh.appendChild(th);}
  thead.appendChild(trh);tbl.appendChild(thead);
  const tbody=document.createElement('tbody');
  for(let i=0;i<rows;i++){
    const tr=document.createElement('tr');
    for(let j=0;j<cols;j++){const td=document.createElement('td');td.innerHTML='&nbsp;';tr.appendChild(td);}
    tbody.appendChild(tr);
  }
  tbl.appendChild(tbody);
  const sel=window.getSelection();
  if(sel&&sel.rangeCount>0&&ed.contains(sel.anchorNode)){
    const range=sel.getRangeAt(0);range.deleteContents();
    range.insertNode(tbl);
    const br=document.createElement('br');tbl.parentNode.insertBefore(br,tbl.nextSibling);
    const r=document.createRange();r.setStartAfter(br);r.collapse(true);
    sel.removeAllRanges();sel.addRange(r);
  }else{
    ed.appendChild(tbl);ed.appendChild(document.createElement('br'));
  }
}
// 「插入表格」弹窗：让用户用 10×10 网格点选 rows/cols，再生成表格插入；可手动填行/列数
function openTblPicker(targetEl){
  const m=document.createElement('div');m.className='modal open'; // 必须加 open，否则 CSS display:none 不显示
  let rows=3,cols=3;
  function render(){
    let cells='';
    for(let i=1;i<=10;i++){
      for(let j=1;j<=10;j++){
        const on=(i<=rows&&j<=cols);
        cells+='<button type="button" class="'+(on?'on':'')+'" data-r="'+i+'" data-c="'+j+'" title="'+i+' × '+j+'">'+j+'</button>';
      }
    }
    // v16.8：平铺 100 个按钮，与 .table-modal-grid 的 grid 布局对齐（此前包了行 div，被塞进单个网格列挤成一团）
    m.innerHTML='<div class="box"><div class="m-head"><h3>插入表格</h3><button class="icon-btn" data-act="tblclose" aria-label="关闭">×</button></div>'+
      '<div class="m-body"><div class="muted" style="margin-bottom:8px">点选下方的网格设定行数 × 列数；也可直接输入数字（最多 10×10）。</div>'+
      '<div style="display:flex;gap:10px;align-items:center;margin-bottom:10px"><label>行 <input type="number" min="1" max="10" value="'+rows+'" data-act="tblrows" style="width:60px"></label><label>列 <input type="number" min="1" max="10" value="'+cols+'" data-act="tblcols" style="width:60px"></label></div>'+
      '<div class="table-modal-grid" data-act="tblgrid">'+cells+'</div>'+
      '<div class="row-act" style="justify-content:flex-end"><button data-act="tblcancel">取消</button><button class="btn btn--primary" data-act="tblok">插入</button></div>'+
      '</div></div>';
  }
  render();
  document.body.appendChild(m);
  function closeTbl(){m.remove();document.removeEventListener('keydown',escTbl);}
  function escTbl(ev){if(ev.key==='Escape'){closeTbl();}}
  document.addEventListener('keydown',escTbl);
  m.addEventListener('click',function(e){
    if(e.target===m){closeTbl();return;} // 点遮罩关闭
    const t=e.target.closest('[data-act]');if(!t)return;
    const a=t.dataset.act;
    if(a==='tblclose'||a==='tblcancel'){closeTbl();return;}
    if(a==='tblrows')return; // input event handles it
    if(a==='tblcols')return;
    if(a==='tblgrid'){const btn=e.target.closest('button[data-r][data-c]');if(btn){rows=+btn.dataset.r;cols=+btn.dataset.c;render();}return;}
    if(a==='tblok'){
      const headers=[];
      const cols2=+m.querySelector('[data-act="tblcols"]').value||cols;
      const rows2=+m.querySelector('[data-act="tblrows"]').value||rows;
      for(let j=0;j<cols2;j++)headers.push('列'+(j+1));
      insertTableAtCursor(targetEl,Math.max(1,Math.min(10,rows2)),Math.max(1,Math.min(10,cols2)),headers);
      saveEditableEl(targetEl);
      closeTbl();
      toast('已插入表格，可直接填写');
    }
  });
  m.addEventListener('input',function(e){
    const t=e.target;
    if(t.dataset.act==='tblrows'){rows=Math.max(1,Math.min(10,+t.value||1));render();}
    if(t.dataset.act==='tblcols'){cols=Math.max(1,Math.min(10,+t.value||1));render();}
  });
}
// 显式「插入图片」：打开文件选择器，读为 base64 后内联
let imgFileInput=null,imgFileTarget=null;
function openImgPicker(targetEl){
  imgFileTarget=targetEl;
  if(!imgFileInput){
    imgFileInput=document.createElement('input');
    imgFileInput.type='file';imgFileInput.accept='image/*';imgFileInput.multiple=true;imgFileInput.style.display='none';
    imgFileInput.addEventListener('change',function(){
      const el=imgFileTarget;if(!el){imgFileInput.value='';return;}
      const files=Array.prototype.filter.call(imgFileInput.files||[],f=>f.type&&f.type.indexOf('image/')===0);
      imgFileInput.value='';
      if(!files.length)return;
      let pend=files.length,oversized=false;
      files.forEach(f=>{if(f.size>2*1024*1024)oversized=true;const rd=new FileReader();rd.onload=function(){insertImageAtCursor(el,rd.result);if(--pend===0){saveEditableEl(el);if(oversized)toast('部分图片较大，已内联（注意存储空间）');}};rd.readAsDataURL(f);});
    });
    document.body.appendChild(imgFileInput);
  }
  imgFileInput.click();
}
function positionMediaBar(node){
  const bar=document.getElementById('mediaBar');if(!bar)return;
  const r=node.getBoundingClientRect();
  const bw=bar.offsetWidth||160,bh=bar.offsetHeight||32;
  const vh=window.innerHeight||document.documentElement.clientHeight;
  let left=r.left+window.scrollX;
  let top;
  // 优先表格上方（预留顶栏 56px）；上方放不下（表格贴顶）→ 放表格下方
  if(r.top-bh-8>=56){ top=r.top-bh-8; }
  else { top=r.bottom+8; }
  // 左右也 clamp，避免工具条超出屏幕
  left=Math.max(4, Math.min(left, (window.innerWidth||vh)-bw-4));
  top=Math.max(window.scrollY+8, Math.min(top, window.scrollY+vh-bh-4));
  bar.style.left=left+'px';
  bar.style.top=top+'px';
}
function selectMedia(node,ed){
  if(!node||!node.isConnected){hideMediaBar();return;} // render 重建后旧节点不再连接，直接收起
  if(selMedia&&selMedia.node&&selMedia.node!==node)selMedia.node.classList.remove('sel');
  node.classList.add('sel');
  selMedia={node,ed};
  const bar=document.getElementById('mediaBar');if(!bar)return;
  const isImg=node.tagName==='IMG';
  const isSec=!!node.closest('.table-scroll');
  // v16.7：结构化表格不再弹浮动工具条/右下角整体缩放角标（列宽/行高走各自手柄），与富文本表格区分开
  if(isSec){hideMediaBar();return;}
  const sizes=bar.querySelector('.sizes');
  // v16.9：表格不再提供整体缩放（右下角角标 + 「拖拽缩放」按钮），仅图片保留尺寸预设；
  // 表格列宽/行高走单元格边缘拖拽（initTblResize）与右键菜单
  sizes.innerHTML=isImg?['50%','75%','100%'].map(p=>'<button data-w="'+p+'">'+p+'</button>').join(''):'';
  const delBtn=bar.querySelector('.del');
  if(delBtn)delBtn.style.display=(isImg||!isSec)?'':'none'; // 结构化表格属于框架节，禁止整表删除
  bar.style.display='flex';
  positionMediaBar(node);
  if(node.tagName==='IMG')positionImgHandle(node); else hideImgHandle();
}
/* ============ 表格尺寸调整（Excel 式：拖列边界改列宽 / 拖行下缘改行高 / 手柄等比整体缩放） ============ */
function tblEd(table){ // 富文本表格所在编辑容器；结构化表格返回 .table-scroll（带 data-sec）
  return table.closest('.editable,.sub-card-body,.table-scroll');
}
// v15.8 P4 迷你格式工具条
let mfbBar=null,miniFmtRange=null,miniFmtEditor=null;
function mfbEditorOfRange(range){
  if(!range)return null;
  const ac=range.commonAncestorContainer;
  return ac&&((ac.nodeType===1?ac:ac.parentElement)&&((ac.nodeType===1?ac:ac.parentElement).closest('.editable,.sub-card-body,.table-scroll')));
}
function rememberMiniFmtRange(){
  const sel=window.getSelection();
  const range=sel&&sel.rangeCount>0?sel.getRangeAt(0):null;
  const ed=range&&!range.collapsed?mfbEditorOfRange(range):null;
  if(!ed)return null;
  miniFmtRange=range.cloneRange();miniFmtEditor=ed;
  return {range:range,ed:ed};
}
function ensureMiniFormatBar(){
  if(mfbBar)return;
  mfbBar=document.createElement('div');
  mfbBar.id='miniFmtBar';
  mfbBar.className='mini-fmt-bar';
  mfbBar.innerHTML='<button type="button" data-fmt="bold" title="加粗"><b>B</b></button>'+
    '<button type="button" data-fmt="italic" title="斜体"><i>I</i></button>'+
    '<button type="button" data-fmt="underline" title="下划线"><u>U</u></button>'+
    '<button type="button" data-fmt="strike" title="删除线"><s>S</s></button>'+
    '<button type="button" data-fmt="link" title="链接"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/></svg></button>'+
    '<span class="mfb-sep"></span>'+
    '<button type="button" data-fmt="removeFormat" title="清除格式" class="danger">清格式</button>';
  document.body.appendChild(mfbBar);
  mfbBar.addEventListener('mousedown',function(e){e.preventDefault();});
  mfbBar.addEventListener('click',function(e){
    const b=e.target.closest('button[data-fmt]');if(!b)return;
    e.preventDefault();
    applyFmt(b.dataset.fmt);
  });
  document.addEventListener('selectionchange',function(){
    if(!editing){hideMfb();return;}
    const saved=rememberMiniFmtRange();
    if(!saved){hideMfb();return;}
    const range=saved.range,ed=saved.ed;
    // v18.8：去掉「表格内隐藏工具条」限制——富文本表格、结构化表格单元格内的划词同样可加粗/标题/链接等
    if(!ed){hideMfb();return;}
    const rect=range.getBoundingClientRect();
    if(!rect||rect.width<2){hideMfb();return;}
    mfbBar.style.display='flex';
    var bw=mfbBar.offsetWidth||240,bh=mfbBar.offsetHeight||36;
    var tw=window.innerWidth,th=window.innerHeight;
    var top=rect.top-bh-6,left=rect.left+rect.width/2-bw/2;
    if(top<8)top=rect.bottom+6;
    if(left<8)left=8;if(left+bw>tw-8)left=tw-8-bw;
    mfbBar.style.left=left+'px';
    mfbBar.style.top=top+'px';
  });
  document.addEventListener('mousedown',function(e){
    if(!mfbBar||mfbBar.style.display==='none')return;
    if(e.target.closest('#miniFmtBar'))return;
    setTimeout(function(){const s=window.getSelection();if(!s||s.isCollapsed)hideMfb();},10);
  },true);
}
function hideMfb(){if(mfbBar)mfbBar.style.display='none';}
function applyFmt(op){
  // 浮动栏只服务于“当前选中的文字”。标题/引用属于整段语义，不能悄悄扩大到整段。
  const sel=window.getSelection();
  const saved=miniFmtRange&&miniFmtEditor&&miniFmtEditor.isConnected?{range:miniFmtRange,ed:miniFmtEditor}:rememberMiniFmtRange();
  if(!saved||saved.range.collapsed){toast('请先选中要调整的文字');return;}
  try{sel.removeAllRanges();sel.addRange(saved.range);}catch(e){toast('选区已失效，请重新选中文字');return;}
  if(op==='h2'||op==='h3'||op==='quote'){toast('标题和引用会影响整段，请在段落级编辑中调整；浮动工具栏只修改选中文字');return;}
  try{
    if(op==='link'){ const url=prompt('链接地址（含 http(s)://）：','https://'); if(url){ document.execCommand('createLink',false,url); } }
    else { document.execCommand(op,false,null); }
  }catch(e){}
  const ed=saved.ed;
  if(ed){
    if(ed.classList.contains('table-scroll')){ try{typeof save==='function'&&save();}catch(e){} }
    else if(typeof saveEditableEl==='function'){try{saveEditableEl(ed);}catch(e){}}
  }
  const after=window.getSelection();if(after&&after.rangeCount&&!after.isCollapsed){miniFmtRange=after.getRangeAt(0).cloneRange();miniFmtEditor=ed;}
}
// 保存表格布局：核心前提——单元格宽高不属于单元格，属于行对象/列对象。
// 结构化表格：列宽写回 c.colWidths（从列对象 <col> 读），行高写回 c.rowHeights（从行对象 <tr> 读）。
// 富文本表格：整体保存其所在编辑区 html（含各列 <col>/单元格内联宽高，由浏览器持久化）。
function saveTblLayout(table){
  if(!table)return;
  const sc=table.closest('.table-scroll');
  if(sc&&sc.dataset.sec){
    const c=DATA[sc.dataset.sec];if(!c)return;
    // 列宽：只从列对象 <col> 读（v16.5 已无操作列，全部为数据列）
    const colEls=Array.prototype.slice.call(table.querySelectorAll('colgroup col')||[]);
    c.colWidths=colEls.map(col=>{
      const w=col.style.width?parseInt(col.style.width,10):0;
      return w>0?w:120;
    });
    // 行高：只从行对象 <tr>（tbody 内）读
    const rh={};
    Array.prototype.forEach.call(table.querySelectorAll('tbody tr')||[],(tr,idx)=>{
      const h=tr.style.height?parseInt(tr.style.height,10):0;
      if(h>0)rh[idx]=h;
    });
    c.rowHeights=rh;
    save();
  }else{
    const ed=tblEd(table);
    if(ed)saveEditableEl(ed);
  }
}
// 等比缩放表格各列宽（整体缩放用）：结构化改 colgroup；富文本按首行单元格当前宽度乘比例写各列
function scaleTblCols(table,ratio){
  if(!table||!isFinite(ratio)||ratio<=0)return;
  const cg=table.querySelector('colgroup');
  if(cg){
    const headCells=table.rows[0]?table.rows[0].cells:null;
    Array.prototype.forEach.call(cg.children,(col,i)=>{
      const w=Math.max(40,Math.round((parseInt(col.style.width,10)||120)*ratio));
      col.style.width=w+'px';
    });
    return;
  }
  const first=table.rows[0];
  if(!first)return;
  Array.prototype.forEach.call(first.cells,(cell,j)=>{
    const base=parseInt(cell.style.width,10)||120;
    const w=Math.max(40,Math.round(base*ratio));
    Array.prototype.forEach.call(table.rows,row=>{
      const c2=row.cells[j];
      if(c2)c2.style.width=w+'px';
    });
  });
}
let tblResize=null; // {mode:'col'|'row', table, colIdx, rowIdx, startX, startY, startW, startH}
function initTblResize(){
  // v16.4：e.target 在 contenteditable 单元格里常是文本节点（无 closest），必须先归一化到元素，
  // 否则结构化表格（可编辑单元格）悬停/拖拽直接报错，缩放完全失效
  var norm=function(el){return (el&&el.nodeType===1)?el:(el&&el.parentElement?el.parentElement:null);};
  // 光标提示：仅在单元格右/下边缘 8px 容差内提示可拖；非编辑态或离开立即复位
  document.addEventListener('mousemove',e=>{
    if(tblResize){document.body.style.cursor=tblResize.mode==='col'?'col-resize':'row-resize';return;}
    if(!editing){if(document.body.style.cursor)document.body.style.cursor='';return;}
    const tgt=norm(e.target);if(!tgt||!tgt.closest){if(document.body.style.cursor)document.body.style.cursor='';return;}
    if(tgt.closest('.table-scroll'))return; // v16.6：结构化表格走显式手柄，不做边缘热区
    const cell=tgt.closest('table th,table td');
    if(!cell){if(document.body.style.cursor)document.body.style.cursor='';return;}
    const r=cell.getBoundingClientRect();
    const nearRight=e.clientX>=r.right-8&&e.clientX<=r.right+3;
    const nearBottom=e.clientY>=r.bottom-8&&e.clientY<=r.bottom+3;
    // 右下角：优先行高（行高入口更易被忽略，避免永远调不了行高）
    const want=nearBottom&&!nearRight?'row-resize':(nearRight?'col-resize':'');
    if(document.body.style.cursor!==want)document.body.style.cursor=want;
  });
  // 按下单元格边缘 → 开始拖拽（编辑态生效）
  document.addEventListener('mousedown',e=>{
    if(!editing)return;
    const tgt=norm(e.target);if(!tgt||!tgt.closest)return;
    if(tgt.closest('#mediaBar')||tgt.closest('#imgResizeHandle'))return;
    if(tgt.closest('.table-scroll'))return; // v16.6：结构化表格走显式手柄
    const cell=tgt.closest('table th,table td');
    if(!cell)return;
    const r=cell.getBoundingClientRect();
    const nearRight=e.clientX>=r.right-8&&e.clientX<=r.right+3;
    const nearBottom=e.clientY>=r.bottom-8&&e.clientY<=r.bottom+3;
    if(!nearRight&&!nearBottom)return;
    e.preventDefault();e.stopPropagation();
    hideMediaBar();
    const table=cell.closest('table');
    const colIdx=cell.cellIndex;
    const row=cell.parentElement;
    const cg=table.querySelector('colgroup');
    // 模式判定：右下角优先行高；否则右边缘=列宽，下边缘=行高
    let mode=(nearBottom&&!nearRight)?'row':(nearRight?'col':'row');
    // 列宽起点取列对象真实宽（col.offsetWidth），行高起点取行对象高
    let startW=120,startH=24;
    if(mode==='col'&&cg){
      const col=cg.children[colIdx];
      if(col)startW=col.offsetWidth||120;
    }else{
      startW=cell.offsetWidth;
    }
    startH=row.offsetHeight||24;
    tblResize={mode,table,colIdx,rowEl:row,startX:e.clientX,startY:e.clientY,startW,startH};
    document.body.style.cursor=mode==='col'?'col-resize':'row-resize';
    function mm(ev){
      if(!tblResize)return;
      if(tblResize.mode==='col'){
        // 只改列对象 <col>：单元格宽度由列对象派生，绝不写在单元格上
        const cg2=tblResize.table.querySelector('colgroup');
        const newW=Math.max(40,Math.round(tblResize.startW+(ev.clientX-tblResize.startX)));
        if(cg2){
          const col=cg2.children[tblResize.colIdx];
          if(col)col.style.width=newW+'px';
        }else{
          // 富文本表格无 colgroup：改首列单元格内联宽，由各单元格继承（列对象退化为首行单元格）
          Array.prototype.forEach.call(tblResize.table.rows,tr=>{const c2=tr.cells[tblResize.colIdx];if(c2)c2.style.width=newW+'px';});
        }
      }else{
        // 只改行对象 <tr>
        const newH=Math.max(24,Math.round(tblResize.startH+(ev.clientY-tblResize.startY)));
        tblResize.rowEl.style.height=newH+'px';
      }
    }
    function mu(){
      document.removeEventListener('mousemove',mm);document.removeEventListener('mouseup',mu);
      document.body.style.cursor='';
      if(tblResize){const tb=tblResize.table;tblResize=null;saveTblLayout(tb);}
    }
    document.addEventListener('mousemove',mm);document.addEventListener('mouseup',mu);
  });
}
/* ============ v16.6 结构化表格显式拖拽手柄：表头右缘=列宽，行首格下缘=行高 ============ */
document.addEventListener('mousedown',function(e){
  if(!editing)return;
  var tgt=e.target;
  if(tgt&&tgt.nodeType!==1&&tgt.parentElement)tgt=tgt.parentElement;
  if(!tgt||!tgt.closest)return;
  var h=tgt.closest('.tbl-col-h,.tbl-row-h');
  if(!h)return;
  var sc=h.closest('.table-scroll');if(!sc)return;
  var table=sc.querySelector('table');if(!table)return;
  e.preventDefault();e.stopPropagation();
  try{hideMediaBar();}catch(err){}
  var isCol=h.classList.contains('tbl-col-h');
  var colIdx=isCol?parseInt(h.dataset.col,10):-1;
  var rowEl=h.closest('tr');
  var cg=table.querySelector('colgroup');
  var startX=e.clientX,startY=e.clientY;
  var startW=(isCol&&cg&&cg.children[colIdx])?(cg.children[colIdx].offsetWidth||120):(rowEl?rowEl.offsetWidth:120);
  var startH=rowEl?(rowEl.offsetHeight||24):24;
  h.classList.add('on');
  function mm(ev){
    if(isCol){
      var newW=Math.max(40,Math.round(startW+(ev.clientX-startX)));
      if(cg&&cg.children[colIdx])cg.children[colIdx].style.width=newW+'px';
    }else{
      var newH=Math.max(24,Math.round(startH+(ev.clientY-startY)));
      if(rowEl)rowEl.style.height=newH+'px';
    }
  }
  function mu(){
    document.removeEventListener('mousemove',mm);document.removeEventListener('mouseup',mu);
    h.classList.remove('on');
    document.body.style.cursor='';
    if(table){try{saveTblLayout(table);}catch(err){}}
  }
  document.body.style.cursor=isCol?'col-resize':'row-resize';
  document.addEventListener('mousemove',mm);document.addEventListener('mouseup',mu);
});
/* ============ v16.4 表格右键菜单（Excel 式：行间/列间插入、删行删列、删表） ============ */
let tblMenuEl=null;
function closeTblMenu(){
  if(tblMenuEl){tblMenuEl.remove();tblMenuEl=null;}
}
function openTblMenu(x,y,cell){
  closeTblMenu();
  const table=cell.closest('table');if(!table)return;
  const sc=cell.closest('.table-scroll');
  const ed=cell.closest('.editable,.sub-card-body');
  const sec=sc&&sc.dataset.sec?sc.dataset.sec:null;
  const tr=cell.parentElement;
  const rowIdx=tr.rowIndex;
  const colIdx=cell.cellIndex;
  const isSec=!!sec;
  const isHeader=rowIdx===0;
  const items=[];
  if(isSec){
    // 结构化表格：表头行只做列操作；数据行做行列操作（v16.5 已无操作列）
    if(!isHeader){items.push({op:'ins-row-above',label:'在上方插入行'});items.push({op:'ins-row-below',label:'在下方插入行'});items.push({op:'del-row',label:'删除本行'});}
    items.push({op:'ins-col-left',label:'在左侧插入列'});items.push({op:'ins-col-right',label:'在右侧插入列'});items.push({op:'del-col',label:'删除本列'});
  }else{
    items.push({op:'ins-row-above',label:'在上方插入行'});
    items.push({op:'ins-row-below',label:'在下方插入行'});
    items.push({op:'ins-col-left',label:'在左侧插入列'});
    items.push({op:'ins-col-right',label:'在右侧插入列'});
    items.push({op:'del-row',label:'删除本行'});
    items.push({op:'del-col',label:'删除本列'});
    items.push({op:'del-table',label:'删除整个表格'});
  }
  if(!items.length){toast('该位置无可操作项');return;}
  const m=document.createElement('div');
  m.className='tbl-menu';m.id='tblMenu';
  items.forEach(it=>{
    const b=document.createElement('button');
    b.type='button';b.textContent=it.label;
    b.addEventListener('click',ev=>{ev.preventDefault();ev.stopPropagation();closeTblMenu();doTblOp(it.op,{table,rowIdx,colIdx,sec,ed,isSec});});
    m.appendChild(b);
  });
  document.body.appendChild(m);
  // 位置 clamp：不超出视口
  const r=m.getBoundingClientRect();
  const vw=window.innerWidth||document.documentElement.clientWidth;
  const vh=window.innerHeight||document.documentElement.clientHeight;
  let left=Math.max(4,x),top=Math.max(4,y);
  if(left+r.width>vw-4)left=Math.max(4,vw-r.width-4);
  if(top+r.height>vh-4)top=Math.max(4,vh-r.height-4);
  m.style.left=left+'px';m.style.top=top+'px';
  tblMenuEl=m;
}
function doTblOp(op,ctx){
  const {table,rowIdx,colIdx,sec,ed}=ctx;
  try{
    if(sec){ // 结构化表格：改 DATA + 重渲染
      const c=DATA[sec];if(!c)return;
      const rows=c.rows||[];if(!rows.length)return;
      const heads=rows[0].cells||[];
      const emptyRow=()=>({cells:heads.map(()=> '')});
      if(op==='ins-row-above'){rows.splice(rowIdx,0,emptyRow());delete c.rowHeights;}
      else if(op==='ins-row-below'){rows.splice(rowIdx+1,0,emptyRow());delete c.rowHeights;}
      else if(op==='del-row'){if(rows.length>1&&rowIdx>0){rows.splice(rowIdx,1);delete c.rowHeights;}else{toast('至少保留表头与一行');return;}}
      else if(op==='ins-col-left'){rows.forEach(r=>{(r.cells||[]).splice(colIdx,0,'');});if(c.colWidths)c.colWidths.splice(colIdx,0,120);}
      else if(op==='ins-col-right'){rows.forEach(r=>{(r.cells||[]).splice(colIdx+1,0,'');});if(c.colWidths)c.colWidths.splice(colIdx+1,0,120);}
      else if(op==='del-col'){if(heads.length>1){rows.forEach(r=>{if(r.cells&&r.cells.length>colIdx)r.cells.splice(colIdx,1);});if(c.colWidths&&c.colWidths.length>colIdx)c.colWidths.splice(colIdx,1);}else{toast('至少保留一列');return;}}
      save();render();
    }else if(ed){ // 富文本表格：直接改 DOM + 落盘
      const ncols=table.rows[0]?table.rows[0].cells.length:(colIdx+1);
      // v17.21：富文本表格列宽持久化修复——新列/新行必须继承列宽，否则渲染成 17px 挤成一团且刷新后仍窄
      const colW=function(at){
        const src=table.rows[0]&&table.rows[0].cells[at];
        return (src&&src.style&&src.style.width)||'120px';
      };
      if(op==='ins-row-above'||op==='ins-row-below'){
        const tr=table.insertRow(op==='ins-row-above'?rowIdx:rowIdx+1);
        const headCells=table.rows[0]?table.rows[0].cells:[];
        for(let j=0;j<ncols;j++){
          const td=tr.insertCell(-1);td.innerHTML='&nbsp;';
          if(headCells[j]&&headCells[j].style&&headCells[j].style.width)td.style.width=headCells[j].style.width;
        }
      }else if(op==='del-row'){
        if(table.rows.length>1)table.deleteRow(rowIdx);else{toast('至少保留一行');return;}
      }else if(op==='ins-col-left'||op==='ins-col-right'){
        const at=op==='ins-col-left'?colIdx:colIdx+1;
        const w=colW(colIdx);
        for(let r=0;r<table.rows.length;r++){
          const tr=table.rows[r];
          const td=tr.insertCell(at);td.innerHTML='&nbsp;';
          if(td.style)td.style.width=w;
          if(r===0&&tr.replaceChild&&document.createElement){ // 表头行用 <th>（v17.21 修复：此前插的是 <td>）
            const th=document.createElement('th');
            th.innerHTML='&nbsp;';if(th.style)th.style.width=w;
            tr.replaceChild(th,td);
          }
        }
      }else if(op==='del-col'){
        if(ncols>1){for(let r=0;r<table.rows.length;r++)table.rows[r].deleteCell(colIdx);}else{toast('至少保留一列');return;}
      }else if(op==='del-table'){
        table.remove();
      }
      saveEditableEl(ed);
    }
  }catch(err){toast('表格操作失败：'+(err&&err.message||err));}
}
// 右键表格单元格 → Excel 式菜单（编辑态生效；其余右键行为不受影响）
document.addEventListener('contextmenu',e=>{
  if(!editing)return;
  const tgt=e.target;
  const el=(tgt&&tgt.nodeType===1)?tgt:(tgt&&tgt.parentElement?tgt.parentElement:null);
  if(!el||!el.closest)return;
  const cell=el.closest('table th,table td');
  if(!cell)return;
  e.preventDefault();e.stopPropagation();
  openTblMenu(e.clientX,e.clientY,cell);
});
// 点菜单外 / 滚动 / 重建时收起
document.addEventListener('mousedown',e=>{
  if(tblMenuEl&&(!e.target.closest||!e.target.closest('#tblMenu')))closeTblMenu();
});
window.addEventListener('scroll',closeTblMenu,true);
function hideMediaBar(){const bar=document.getElementById('mediaBar');if(bar)bar.style.display='none';if(selMedia&&selMedia.node)selMedia.node.classList.remove('sel');selMedia=null;hideImgHandle();}
// 点击图片/表格 → 选中并显示工具条；点击别处 → 收起（仅在编辑态生效）
document.addEventListener('click',e=>{
  if(e.target.closest('#mediaBar'))return;
  if(e.target.closest('#imgResizeHandle'))return;
  if(!editing){hideMediaBar();return;}
  const ed=e.target.closest('.editable,.sub-card-body,.table-scroll');
  if(!ed){hideMediaBar();return;}
  const node=e.target.closest('img,table');
  if(node&&(ed.contains(node)||node===ed))selectMedia(node,ed);
  else hideMediaBar();
});
init();
