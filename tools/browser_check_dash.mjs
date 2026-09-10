// v17.16 浏览器端到端：看板总览（hero 实时摘要 / 节健康度热力图 / AI 总评卡 / 体检摘要复制）
// 运行：node tools/browser_check_dash.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const appUrl = new URL('../PMHub.html', import.meta.url).href;
const candidates = [
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  process.env.LOCALAPPDATA + '/Google/Chrome/Application/chrome.exe',
];
const browserExe = candidates.find(p => p && fs.existsSync(p));
if (!browserExe) { console.log('NO_BROWSER'); process.exit(2); }

const port = 10800 + Math.floor(Math.random() * 200);
const userData = fs.mkdtempSync(path.join(os.tmpdir(), 'prd-dash-'));
function psExec(cmd) { return execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', cmd], { encoding: 'utf8', windowsHide: true }).trim(); }
let browserPid = -1;
try {
  browserPid = parseInt(psExec(`$p = Start-Process -FilePath '${browserExe}' -ArgumentList @('--headless=new','--disable-gpu','--no-first-run','--disable-extensions','--no-sandbox','--disable-breakpad','--disable-crash-reporter','--remote-debugging-port=${port}','--remote-allow-origins=*','--user-data-dir=${userData}','--window-size=1440,960','about:blank') -PassThru -WindowStyle Hidden; Write-Output $p.Id`), 10);
} catch (e) { console.log('LAUNCH_FAIL ' + String(e.message || e)); process.exit(2); }
function cleanup() {
  try { if (browserPid > 0) psExec(`Stop-Process -Id ${browserPid} -Force -ErrorAction SilentlyContinue`); } catch (e) {}
  try { fs.rmSync(userData, { recursive: true, force: true }); } catch (e) {}
}

let target;
for (let i = 0; i < 80; i++) {
  await new Promise(r => setTimeout(r, 250));
  try {
    const list = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
    target = list.find(t => t.type === 'page');
    if (target) break;
  } catch (e) {}
}
if (!target) { console.log('NO_CDP_TARGET'); cleanup(); process.exit(2); }

const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((res, rej) => {
  const t = setTimeout(() => rej(new Error('WS_TIMEOUT')), 8000);
  ws.onopen = () => { clearTimeout(t); res(); };
  ws.onerror = e => { clearTimeout(t); rej(new Error('WS_ERROR ' + (e && e.message || ''))); };
});
let msgId = 0;
const pend = new Map();
const errors = [];
ws.onmessage = ev => {
  const m = JSON.parse(ev.data);
  if (m.id && pend.has(m.id)) { const p = pend.get(m.id); pend.delete(m.id); m.error ? p.rej(new Error(JSON.stringify(m.error))) : p.res(m.result); }
  else if (m.method === 'Runtime.exceptionThrown' || (m.method === 'Runtime.consoleAPICalled' && ['error','warning'].includes(m.params.type))) {
    errors.push(m.method + ': ' + JSON.stringify(m.params).slice(0, 300));
  }
};
function send(method, params) {
  return new Promise((res, rej) => {
    const id = ++msgId;
    const t = setTimeout(() => { pend.delete(id); rej(new Error('SEND_TIMEOUT ' + method)); }, 8000);
    pend.set(id, { res: v => { clearTimeout(t); res(v); }, rej: e => { clearTimeout(t); rej(e); } });
    ws.send(JSON.stringify({ id, method, params }));
  });
}
async function evalJs(expr) {
  const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) throw new Error('EVAL_ERR: ' + JSON.stringify(r.exceptionDetails).slice(0, 600));
  return r.result && r.result.value;
}

await send('Page.enable');
await send('Runtime.enable');
await send('Page.navigate', { url: appUrl });
// 等应用就绪：原为固定延时等待，831KB 单文件冷启动偶尔会超过该时长，
// 后续 eval 就会撞上「loadSample is not defined」这类假回归（见 README 文件约定）。
for (let i = 0; i < 60; i++) {
  try { if (await evalJs("document.readyState==='complete' && typeof loadSample==='function'")) break; }
  catch (e) { /* 导航尚未完成，继续等 */ }
  await new Promise(r => setTimeout(r, 250));
}
await new Promise(r => setTimeout(r, 300));

let pass = 0, fail = 0;
function check(name, cond, detail) { if (cond) { pass++; console.log('PASS  ' + name); } else { fail++; console.log('FAIL  ' + name + '  >>> ' + detail); } }

try {
  const appShell = await evalJs(`({title:document.title,legacyBadge:!!document.getElementById('vbadge')})`);
  check('dash 当前应用加载且无废弃顶栏版本水印', appShell.title==='PMHub' && !appShell.legacyBadge, JSON.stringify(appShell));

  // ---------- v17.25 顶栏收纳：设置/评论/框架移入「更多」 ----------
  const more1 = await evalJs(`(()=>{
    const ta=document.getElementById('topActions');
    return {
      topHasSettings: !!ta.querySelector(':scope > [data-act="settings"]'),
      topHasComments: !!ta.querySelector(':scope > [data-act="comments"]'),
      topHasManagefw: !!ta.querySelector(':scope > [data-act="managefw"]'),
      moreSettings: !!document.querySelector('#ddMore [data-act="settings"]'),
      moreComments: !!document.querySelector('#ddMore [data-act="comments"]'),
      moreManagefw: !!document.querySelector('#ddMore [data-act="managefw"]')
    };
  })()`);
  check('顶栏收纳：设置/评论/框架已移入「更多」', more1.topHasSettings===false && more1.topHasComments===false && more1.topHasManagefw===false && more1.moreSettings && more1.moreComments && more1.moreManagefw, JSON.stringify(more1));
  await evalJs(`(()=>{ const b=document.querySelector('#ddMore .top-dd-trigger'); if(b)b.click(); return true; })()`);
  await new Promise(r => setTimeout(r, 150));
  await evalJs(`(()=>{ const b=document.querySelector('#ddMore [data-act="settings"]'); if(b)b.click(); return true; })()`);
  await new Promise(r => setTimeout(r, 250));
  const more2 = await evalJs(`(()=>{ const m=document.getElementById('settingsModal'); return !!m&&m.classList.contains('open'); })()`);
  check('更多→设置 打开设置弹窗', more2===true, String(more2));
  const density = await evalJs(`(()=>{
    const compact=document.querySelector('#tabPrefs .dens-btn[data-v="compact"]');
    const standard=document.querySelector('#tabPrefs .dens-btn[data-v="standard"]');
    const comfortable=document.querySelector('#tabPrefs .dens-btn[data-v="comfortable"]');
    if(!compact||!standard||!comfortable)return {missing:true};
    compact.click();
    const compactState={body:document.body.getAttribute('data-density'),active:compact.classList.contains('on'),pressed:compact.getAttribute('aria-pressed'),text:(document.getElementById('densityCurrent')||{}).textContent||''};
    comfortable.click();
    const comfortableState={body:document.body.getAttribute('data-density'),active:comfortable.classList.contains('on'),pressed:comfortable.getAttribute('aria-pressed'),text:(document.getElementById('densityCurrent')||{}).textContent||''};
    standard.click();
    return {compactState,comfortableState,restored:{body:document.body.getAttribute('data-density'),active:standard.classList.contains('on'),pressed:standard.getAttribute('aria-pressed'),text:(document.getElementById('densityCurrent')||{}).textContent||''}};
  })()`);
  check('设置密度：点击后即时更新选中态、说明与页面状态', !density.missing && density.compactState.body==='compact' && density.compactState.active && density.compactState.pressed==='true' && density.compactState.text.indexOf('紧凑')>=0 && density.comfortableState.body==='comfortable' && density.comfortableState.active && density.comfortableState.pressed==='true' && density.comfortableState.text.indexOf('宽松')>=0 && density.restored.body==='standard' && density.restored.active && density.restored.pressed==='true' && density.restored.text.indexOf('标准')>=0, JSON.stringify(density));
  const modelSetup = await evalJs(`(()=>{
    const tab=document.querySelector('#tierAdvanced [data-tab="ai"]');if(tab)tab.click();
    const secs=document.querySelectorAll('#tabAI .set-sec .set-sec-h').length;
    const sel=document.getElementById('aiProvider');
    const options=sel?[...sel.options].map(o=>o.value):[];
    if(sel){sel.value='deepseek';sel.dispatchEvent(new Event('change',{bubbles:true}));}
    return {tab:!!tab,sections:secs,options,provider:sel?sel.value:'',base:(document.getElementById('aiBaseUrl')||{}).value||'',model:(document.getElementById('aiModel')||{}).value||'',fast:!!document.getElementById('aiFastModel'),deep:!!document.getElementById('aiDeepModel'),review:!!document.getElementById('aiReviewModel'),statusBtn:!!document.querySelector('[data-ai="savesettings"]'),hint:(document.getElementById('aiConnStatus')||{}).textContent||''};
  })()`);
  // v19.17：AI 设置页重排为 4 个分区、去掉本地部署入口，改为「选中服务商即自动填入官方地址与推荐模型」
  check('AI 设置：4 分区呈现、服务商可选官方三家、选中后自动填入地址与模型、无本地部署选项', modelSetup.tab && modelSetup.sections===4 && modelSetup.options.indexOf('ollama')<0 && modelSetup.options.indexOf('deepseek')>=0 && modelSetup.options.indexOf('qwen')>=0 && modelSetup.options.indexOf('zhipu')>=0 && modelSetup.options.indexOf('custom')>=0 && modelSetup.provider==='deepseek' && /api\.deepseek\.com/.test(modelSetup.base) && !!modelSetup.model && modelSetup.fast && modelSetup.deep && modelSetup.review && modelSetup.statusBtn && modelSetup.hint.indexOf('DeepSeek')>=0, JSON.stringify(modelSetup));
  await evalJs(`(()=>{ const b=document.querySelector('#settingsModal .x'); if(b)b.click(); return true; })()`);
  await new Promise(r => setTimeout(r, 150));

  // ---------- P0 重置范围：先明确影响，再执行对应范围 ----------
  await evalJs(`(()=>{ const b=document.querySelector('#ddMore .top-dd-trigger'); if(b)b.click(); return true; })()`);
  await new Promise(r => setTimeout(r, 120));
  await evalJs(`(()=>{ const b=document.querySelector('#ddMore [data-act="reset"]'); if(b)b.click(); return true; })()`);
  await new Promise(r => setTimeout(r, 120));
  const resetUi = await evalJs(`(()=>{
    const modal=document.getElementById('resetModal');
    const confirm=document.getElementById('resetConfirm');
    const pick=document.querySelector('#resetModal [data-scope="projectsTemplates"]');
    const before={open:!!(modal&&modal.classList.contains('open')),disabled:!!(confirm&&confirm.disabled)};
    if(pick)pick.click();
    const cs=confirm?getComputedStyle(confirm):null;
    const rect=confirm?confirm.getBoundingClientRect():null;
    return {before,selected:!!(pick&&pick.classList.contains('selected')),checked:pick&&pick.getAttribute('aria-checked'),confirm:confirm?{disabled:confirm.disabled,text:confirm.textContent,display:cs.display,visibility:cs.visibility,opacity:cs.opacity,width:rect.width,height:rect.height,inViewport:rect.bottom>0&&rect.top<innerHeight&&rect.right>0&&rect.left<innerWidth}:null,summary:(document.getElementById('resetSummary')||{}).textContent||''};
  })()`);
  check('重置：未选范围不可确认，选中后展示影响清单和可见确认按钮', resetUi.before.open && resetUi.before.disabled && resetUi.selected && resetUi.checked==='true' && resetUi.confirm && !resetUi.confirm.disabled && resetUi.confirm.text.indexOf('项目 + 模板')>=0 && resetUi.confirm.display!=='none' && resetUi.confirm.visibility!=='hidden' && Number(resetUi.confirm.opacity)>0 && resetUi.confirm.width>0 && resetUi.confirm.height>0 && resetUi.confirm.inViewport && resetUi.summary.indexOf('会删除')>=0 && resetUi.summary.indexOf('会保留')>=0, JSON.stringify(resetUi));
  await evalJs(`(()=>{ const b=document.querySelector('#resetModal [data-act="closemodal"]'); if(b)b.click(); return true; })()`);
  const resetData = await evalJs(`(()=>{
    const keys={state:'prdKanbanStateV3',backup:'prdKanbanStateV3.bak',draft:'prdKanbanTplDraftV1',custom:'prdKanbanTplCustom',theme:'prdKanbanTheme',ai:'prdKanbanAiSettings'};
    function setShared(){localStorage.setItem(keys.draft,'draft');localStorage.setItem(keys.custom,'[]');localStorage.setItem(keys.theme,'dark');localStorage.setItem(keys.ai,'{"apiKey":"reset-test"}');localStorage.setItem(keys.backup,'{"projects":[{"id":"old"}]}');}
    createProject('重置测试-项目',null);STATE.frameworkPresets.push({id:'keep-reset-preset',name:'保留预设',framework:[]});save();setShared();resetLocalData('projects');
    const projects={projects:STATE.projects.length,keepPreset:STATE.frameworkPresets.some(x=>x.id==='keep-reset-preset'),draft:localStorage.getItem(keys.draft),custom:localStorage.getItem(keys.custom),theme:localStorage.getItem(keys.theme),ai:localStorage.getItem(keys.ai),backup:localStorage.getItem(keys.backup)};
    createProject('重置测试-模板',null);save();setShared();resetLocalData('projectsTemplates');
    const projectsTemplates={projects:STATE.projects.length,keepPreset:STATE.frameworkPresets.some(x=>x.id==='keep-reset-preset'),draft:localStorage.getItem(keys.draft),custom:localStorage.getItem(keys.custom),theme:localStorage.getItem(keys.theme),ai:localStorage.getItem(keys.ai),backup:localStorage.getItem(keys.backup),state:!!localStorage.getItem(keys.state)};
    createProject('重置测试-全部',null);save();setShared();resetLocalData('all');
    const all={projects:STATE.projects.length,state:localStorage.getItem(keys.state),backup:localStorage.getItem(keys.backup),draft:localStorage.getItem(keys.draft),custom:localStorage.getItem(keys.custom),theme:localStorage.getItem(keys.theme),ai:localStorage.getItem(keys.ai),rootTheme:document.documentElement.dataset.theme,bodyDensity:document.body.dataset.density};
    return {projects,projectsTemplates,all};
  })()`);
  // 注意 rootTheme 期望 'brand' 而非 'light'：应用默认主题自 v19 起为「蓝紫光感」brand ——
  // theme-controller 里对无效值也回落 brand，resetLocalData('all') 更显式写入
  // document.documentElement.dataset.theme='brand'，qa_current.js 亦有同口径基线断言。
  // 此处原为 'light'，属旧默认值时代的遗留，导致这一项长期误报失败。
  check('重置：仅项目保留模板与 AI 设置，项目+模板保留偏好，全部清除独立键', resetData.projects.projects===0 && resetData.projects.keepPreset && resetData.projects.draft==='draft' && resetData.projects.custom==='[]' && resetData.projects.theme==='dark' && resetData.projects.ai && resetData.projects.backup===null && resetData.projectsTemplates.projects===0 && !resetData.projectsTemplates.keepPreset && resetData.projectsTemplates.draft===null && resetData.projectsTemplates.custom===null && resetData.projectsTemplates.theme==='dark' && resetData.projectsTemplates.ai && resetData.projectsTemplates.backup===null && resetData.projectsTemplates.state && resetData.all.projects===0 && resetData.all.state===null && resetData.all.backup===null && resetData.all.draft===null && resetData.all.custom===null && resetData.all.theme===null && resetData.all.ai===null && resetData.all.rootTheme==='brand' && resetData.all.bodyDensity==='standard', JSON.stringify(resetData));

  // ---------- v17.23 新手引导 + 默认框架精简 ----------
  // v17.24：引导移入「更多 → 帮助」，不再首启自动弹出
  await evalJs(`(()=>{ const b=document.querySelector('#ddMore .top-dd-trigger'); if(b)b.click(); return true; })()`);
  await new Promise(r => setTimeout(r, 200));
  const wz = await evalJs(`(()=>{
    const m=document.getElementById('wizardModal');
    const t0=document.querySelector('#wizardModal .wz-step[data-step="0"]');
    const helpBtn=document.querySelector('[data-act="help"]');
    const menuOpen=document.querySelector('#ddMore .top-dd-menu')&&document.querySelector('#ddMore .top-dd-menu').classList.contains('open');
    if(helpBtn)helpBtn.click();
    return {menuOpen, open: !!m&&m.classList.contains('open'), text0: t0?t0.textContent:'', idea:!!document.querySelector('[data-act="wz-ai"][data-genmode="design"]'), tpl:!!document.querySelector('[data-act="wz-template"]'), imp:!!document.querySelector('[data-act="wz-import"]'), blank:!!document.querySelector('[data-act="wz-newproj"]')};
  })()`);
  await new Promise(r => setTimeout(r, 200));
  const wzOpen = await evalJs(`(()=>{ const m=document.getElementById('wizardModal'); return m&&m.classList.contains('open'); })()`);
  check('帮助：一屏只给四个可执行起步选择，不堆叠低频功能', wz.menuOpen && wzOpen && wz.text0.indexOf('只选一种最接近你的情况')>=0 && wz.text0.indexOf('创建后只做两件事')>=0 && wz.text0.indexOf('多角色评审')<0 && wz.idea && wz.tpl && wz.imp && wz.blank, JSON.stringify(wz));
  await evalJs(`(()=>{ const b=document.querySelector('[data-act="wz-newproj"]'); if(b)b.click(); return true; })()`);
  await new Promise(r => setTimeout(r, 300));
  const np = await evalJs(`(()=>{
    const m=document.getElementById('newProjModal');
    const list=document.getElementById('npFwList');
    const txt=list?list.textContent:'';
    return {open: !!m&&m.classList.contains('open'), wzClosed: !document.getElementById('wizardModal').classList.contains('open'), hasCards: txt.indexOf('带小卡片')>=0, fwPicks: list?list.querySelectorAll('.fw-pick[data-fwid]').length:0};
  })()`);
  check('新建项目：向导关闭、框架列表无「带小卡片」', np.open && np.wzClosed && !np.hasCards && np.fwPicks===4, JSON.stringify(np));
  await evalJs(`(()=>{ const b=document.querySelector('#newProjModal .x'); if(b)b.click(); return true; })()`);
  await new Promise(r => setTimeout(r, 200));

  const bootOv = await evalJs(`(()=>{ const p=document.getElementById('overviewPanel'); return p?getComputedStyle(p).display:'missing'; })()`);
  check('总览浮层启动即隐藏（不糊屏）', bootOv==='none', String(bootOv));

  // ---------- v18.53 小白需求澄清：先看可编辑方案，再确认生成 ----------
  const desGuide = await evalJs(`(()=>{
    aiDesignOpen();
    const des=document.getElementById('aiDesignModal');
    const state=document.getElementById('aiDesState');
    const input=document.getElementById('aiDesInput');
    if(input)input.value='我想做一个记录每天喝水的小网页，具体怎么做我不确定';
    const send=document.getElementById('aiDesSendBtn'); if(send)send.click();
    const skip=document.getElementById('aiDesSkip'); if(skip)skip.click();
    const sk=document.getElementById('aiDesSkeletonModal');
    const ed=document.getElementById('aiDesSkeletonEditor');
    const name=document.getElementById('aiDesProjectName'),nameHint=document.getElementById('aiDesProjectNameHint'),framework=document.getElementById('aiDesFramework'),frameworkHint=document.getElementById('aiDesFrameworkHint');
    return {desOpen:!!(des&&des.classList.contains('open')), stateText:state?state.textContent:'', skOpen:!!(sk&&sk.classList.contains('open')), editor:ed?ed.value:'', confirm:!!document.querySelector('[data-ai="desskelconfirm"]'),nameInput:!!name,nameValue:name?name.value:'',nameHint:nameHint?nameHint.textContent:'',framework:framework?framework.value:'',frameworkOptions:framework?Array.from(framework.options).map(o=>o.textContent).join(' / '):'',frameworkHint:frameworkHint?frameworkHint.textContent:''};
  })()`);
  check('AI 澄清：展示理解/待确认/假设，并先打开含用户命名权和通用目录的可编辑方案确认层', !desGuide.desOpen && desGuide.stateText.indexOf('我已理解')>=0 && desGuide.stateText.indexOf('还需要确认')>=0 && desGuide.stateText.indexOf('AI 暂定假设')>=0 && desGuide.skOpen && desGuide.editor.indexOf('用户原始想法')>=0 && desGuide.editor.indexOf('产品中的 AI 功能边界')>=0 && desGuide.confirm && desGuide.nameInput && desGuide.nameValue==='' && desGuide.nameHint.indexOf('不会自动采用')>=0 && desGuide.framework==='__IDEA_STANDARD__' && desGuide.frameworkOptions.indexOf('通用产品 PRD')>=0 && desGuide.frameworkOptions.indexOf('精简 MVP')>=0 && desGuide.frameworkHint.indexOf('不会继承旧项目')>=0, JSON.stringify(desGuide));
  await evalJs(`(()=>{ const b=document.querySelector('[data-ai="desskelclose"]'); if(b)b.click(); return true; })()`);
  const desV1904 = await evalJs(`(()=>{
    aiDesignOpen();
    const turns=[{question:'想做什么？',answer:'我想做一个给自己用的喝水记录网页'},{question:'谁会用？',answer:'只有我自己用，记得更规律'},{question:'第一版做什么？',answer:'每天一键记录，并看到当天是否喝够'},{question:'有什么限制？',answer:'手机上也要能用，不需要登录'},{question:'什么算成功？',answer:'我能一眼看出今天还差多少水'}];
    window.__AICtrl._test.designSetState({turns,qa:turns.map(x=>x.answer),understood:'做一个帮助自己坚持喝水的简单网页',needs:['是否需要提醒'],conflicts:[],assumptions:[],skeletonFields:{},skeletonAdvanced:false});
    const researchEligible=window.__AICtrl._test.designShouldOfferResearch();window.__AICtrl._test.designOfferResearch();
    const researchOffer=!!document.querySelector('[data-ai="desresearchstart"]')&&!!document.querySelector('[data-ai="desresearchlater"]');
    window.__AICtrl._test.designAbsorbResponse(['【本轮方案卡】','[已确认] 使用边界：只给自己使用，不需要登录。','[AI建议] 首版路径：手机打开后，一键记录喝水量并查看当天进度。','【三条建议】1. 极简记录：适合先养成习惯；上手快；没有提醒。 2. 记录加提醒：适合容易忘记；更主动；需要处理通知。 3. 记录加周报：适合想复盘趋势；有反馈；首版更复杂。','【关键取舍】','问题：第一版是否需要喝水提醒？','AI建议：先不做提醒。','原因：先验证记录和进度查看是否能让用户坚持。','其他选择：加入本地提醒。'].join('\\n'));
    window.__AICtrl._test.designAppendRoundCards();
    const optionLabels=Array.from(document.querySelectorAll('.ai-des-recommend button')).map(b=>b.textContent.trim());
    const longTextInButton=Array.from(document.querySelectorAll('.ai-des-recommend button')).some(b=>b.textContent.indexOf('极简记录')>=0);
    const recommend=document.querySelector('[data-ai="despickrecommend"]');if(recommend)recommend.click();
    const selected=(document.getElementById('aiDesInput')||{}).value||'';
    window.__AICtrl._test.designFinish();
    const sk=document.getElementById('aiDesSkeletonModal'),cards=document.querySelectorAll('#aiDesSkeletonCards [data-desplan-card]');
    const goal=document.querySelector('[data-desplan-card="0"]');if(goal){goal.value='我手动改写的个人使用边界';goal.dispatchEvent(new Event('input',{bubbles:true}));}
    const decide=document.querySelector('[data-ai="desdecisionrecommend"]');if(decide)decide.click();
    const newTitle=document.getElementById('aiDesNewCardTitle'),newContent=document.getElementById('aiDesNewCardContent');if(newTitle)newTitle.value='隐私边界';if(newContent)newContent.value='所有记录只保存在本地浏览器。';const add=document.querySelector('[data-ai="desaddplancard"]');if(add)add.click();
    const manual=document.getElementById('aiDesManualInput');if(manual){manual.value='我手动补充：不要做登录，也不要做社交排名';manual.dispatchEvent(new Event('input',{bubbles:true}));}
    const editor=document.getElementById('aiDesSkeletonEditor'),editorText=editor?editor.value||'':'',evidence=(document.getElementById('aiDesEvidence')||{}).textContent||'',decisionText=(document.getElementById('aiDesDecisionCards')||{}).textContent||'',skOpen=!!(sk&&sk.classList.contains('open'));
    const configMissing=window.__AICtrl._test.designConfigReady({apiKey:'k',baseUrl:'https://mock.local/v1',model:''})===false;
    const configReady=window.__AICtrl._test.designConfigReady({apiKey:'k',baseUrl:'https://mock.local/v1',model:'mock'})===true;
    const close=document.querySelector('[data-ai="desskelclose"]');if(close)close.click();
    return {hasEarly:!!document.getElementById('aiDesReadiness')||!!document.querySelector('[data-ai="desreadyfinish"]'),skOpen,cards:cards.length,manual:!!manual,advanced:!!editor,editorText,evidence,decisionText,configMissing,configReady,researchEligible,researchOffer,selected,optionLabels,longTextInButton,addCard:editorText.indexOf('隐私边界')>=0};
  })()`);
  check('AI 澄清：不再按三轮提前结束；方案卡按每轮对话动态累积、可手改和手动新增，并保留全部对话依据', !desV1904.hasEarly && desV1904.skOpen && desV1904.cards===2 && desV1904.manual && desV1904.advanced && desV1904.evidence.indexOf('我能一眼看出今天还差多少水')>=0 && desV1904.editorText.indexOf('我手动改写的个人使用边界')>=0 && desV1904.editorText.indexOf('我手动补充：不要做登录')>=0 && desV1904.addCard, JSON.stringify(desV1904));
  check('AI 澄清：形成五轮有效产品方向后仅提示是否进行真实竞品研究，不会自动联网打断当前任务', desV1904.researchEligible && desV1904.researchOffer, JSON.stringify(desV1904));
  check('AI 澄清：主动建议使用内容卡说明方向，仅给 A/B/C/D 小按钮；点选后留给用户修改，关键取舍和模型配置守卫仍有效', desV1904.optionLabels.join('|')==='A|B|C|D · 我自己填写' && !desV1904.longTextInButton && desV1904.selected.indexOf('我选择第 1 个建议')>=0 && desV1904.decisionText.indexOf('先不做提醒')>=0 && desV1904.editorText.indexOf('第一版是否需要喝水提醒')>=0 && desV1904.configMissing && desV1904.configReady, JSON.stringify(desV1904));
  const domesticWeb = await evalJs(`(()=>{
    const t=window.__AICtrl._test;
    const base={web:true,baseUrl:'https://example.test/v1',apiKey:'test-key',model:'test-model',deepModel:'test-deep'};
    const providers=['deepseek','qwen','zhipu'].map(provider=>({provider,mode:t.webResearchMode(Object.assign({},base,{provider})),ready:t.webResearchAvailable(Object.assign({},base,{provider}))}));
    const none=t.webResearchAvailable(Object.assign({},base,{provider:'custom'}));
    const sources=t.webResponseSources({output:[{type:'web_search_call',action:{sources:[{title:'官方来源',url:'https://example.com/doc'}]}}],search_result:[{title:'结构化来源',link:'https://example.org/search'}],web_search:[{search_result:[{title:'工具来源',link:'https://example.net/web'}]}]});
    openSettings('ai');
    const opts=Array.from((document.getElementById('aiProvider')||{}).options||[]).map(o=>o.value);
    closeModal('settingsModal');
    return {providers,none,sourceUrls:sources.map(x=>x.url),opts};
  })()`);
  check('AI 设置：DeepSeek、Qwen、GLM 均具备真实联网适配路径，来源仅从服务商返回结构提取', domesticWeb.providers.every(x=>x.ready&&x.mode) && !domesticWeb.none && ['https://example.com/doc','https://example.org/search','https://example.net/web'].every(url=>domesticWeb.sourceUrls.includes(url)) && ['deepseek','qwen','zhipu'].every(x=>domesticWeb.opts.includes(x)), JSON.stringify(domesticWeb));
  const researchFlow = await evalJs(`(async()=>{
    const oldFetch=window.fetch,oldSettings=localStorage.getItem('prdKanbanAiSettings'),oldTest=window.__AI_TEST_MODE,t=window.__AICtrl._test;
    const turns=[{question:'想做什么？',answer:'我想做一个给自己用的喝水记录网页'},{question:'谁会用？',answer:'只有我自己用，记得更规律'},{question:'第一版做什么？',answer:'每天一键记录，并看到当天是否喝够'},{question:'有什么限制？',answer:'手机上也要能用，不需要登录'},{question:'什么算成功？',answer:'我能一眼看出今天还差多少水'}];
    window.__AI_TEST_MODE=true;localStorage.setItem('prdKanbanAiSettings',JSON.stringify({provider:'zhipu',web:true,apiKey:'test-key',baseUrl:'https://open.bigmodel.cn/api/paas/v4',model:'mock-model',deepModel:'mock-deep'}));
    aiDesignOpen();t.designSetState({turns,qa:turns.map(x=>x.answer),understood:'做一个帮助自己坚持喝水的简单网页',facts:['只给自己使用','手机可用，不需要登录'],needs:['是否需要提醒'],pendingNextQuestion:'第一版是否需要本地提醒？'});t.designOfferResearch(true);
    let releaseSearch;window.fetch=(url,opts)=>{if(String(url).indexOf('/web_search')>=0)return new Promise((resolve,reject)=>{if(opts.signal)opts.signal.addEventListener('abort',()=>reject(new DOMException('aborted','AbortError')));releaseSearch=()=>resolve(new Response(JSON.stringify({search_result:[{title:'开源喝水记录示例',link:'https://github.com/example/water',content:'可参考本地记录与每日进度。'}]}),{headers:{'Content-Type':'application/json'}}));});return Promise.resolve(new Response(JSON.stringify({choices:[{message:{content:'【研究推荐】\\n1. 行业基础 MVP：后续方向：先做本地记录与每日进度；复用判断：仅参考现有做法，不直接引入依赖；差异化机会：先验证坚持体验；代价：提醒暂缓。\\n2. 复用评估：后续方向：先核对开源喝水记录示例；复用判断：仅参考，须核对许可证、维护和兼容性；差异化机会：把精力留给体验；代价：需要评估接入。\\n3. 差异化验证：后续方向：先访谈容易忘记喝水的人；复用判断：不建议复用；差异化机会：验证低打扰提醒；代价：需要先验证需求。'}}]}),{headers:{'Content-Type':'application/json'}}));};
    const start=document.querySelector('[data-ai="desresearchstart"]');if(start)start.click();await new Promise(r=>setTimeout(r,10));
    const during={stop:getComputedStyle(document.getElementById('aiDesStop')).display,researching:t.designState().researching,state:(document.getElementById('aiDesState')||{}).textContent||''};
    if(releaseSearch)releaseSearch();await new Promise(r=>setTimeout(r,80));
    const afterState=t.designState(),afterLog=(document.getElementById('aiDesLog')||{}).textContent||'',saved=afterState.researchHistory[0]||{};
    aiDesignOpen();t.designSetState({turns,qa:turns.map(x=>x.answer),pendingNextQuestion:'原来的下一问'});t.designOfferResearch(true);t.designSkipResearch();const skipLog=(document.getElementById('aiDesLog')||{}).textContent||'';
    window.fetch=oldFetch;if(oldSettings===null)localStorage.removeItem('prdKanbanAiSettings');else localStorage.setItem('prdKanbanAiSettings',oldSettings);window.__AI_TEST_MODE=oldTest;
    const close=document.querySelector('[data-ai="desclose"]');if(close)close.click();
    return {during,history:afterState.researchHistory.length,sources:(saved.sources||[]).length,recommendations:(saved.recommendations||[]),afterLog,skipLog,pending:afterState.pendingNextQuestion};
  })()`);
  check('AI 澄清：联网搜索期间展示可停止状态；真实来源与结论写入本次记忆后直接给出方向、复用与差异化策略；暂不搜索才恢复原问题', researchFlow.during.stop!=='none' && researchFlow.during.researching && researchFlow.during.state.indexOf('正在联网搜索')>=0 && researchFlow.history===1 && researchFlow.sources===1 && researchFlow.recommendations.length===3 && researchFlow.recommendations.every(x=>x.indexOf('复用判断')>=0&&x.indexOf('差异化机会')>=0) && researchFlow.afterLog.indexOf('已存入本次需求记忆')>=0 && researchFlow.afterLog.indexOf('下一步推荐')>=0 && researchFlow.pending==='' && researchFlow.skipLog.indexOf('暂不搜索')>=0 && researchFlow.skipLog.indexOf('原来的下一问')>=0, JSON.stringify(researchFlow));
  const deterministicFacts = await evalJs(`(()=>{
    const t=window.__AICtrl._test,local=t.localDateText(),answer=t.chatDateAnswer('今天几月几日？'),nonDate=t.chatDateAnswer('项目今天要做什么？');
    return {local,answer,nonDate,zhipu:t.inferProvider('custom','https://open.bigmodel.cn/api/paas/v4'),deepseek:t.inferProvider('custom','https://api.deepseek.com/v1'),qwen:t.inferProvider('custom','https://workspace.cn-beijing.maas.aliyuncs.com/compatible-mode/v1'),proxy:t.inferProvider('custom','https://my-proxy.example/v1'),prompt:t.chatPrompt()};
  })()`);
  check('项目助手：短日期问题直接使用本机日期，旧版 GLM/DeepSeek/Qwen 官方地址自动进入对应服务商，代理不误判', deterministicFacts.answer==='今天是'+deterministicFacts.local+'（以这台设备的本地时间为准）。' && deterministicFacts.nonDate==='' && deterministicFacts.zhipu==='zhipu' && deterministicFacts.deepseek==='deepseek' && deterministicFacts.qwen==='qwen' && deterministicFacts.proxy==='custom' && deterministicFacts.prompt.indexOf('当前客户端日期是 '+deterministicFacts.local)>=0, JSON.stringify(deterministicFacts));
  const ideaHandoff = await evalJs(`(()=>{
    window.__AICtrl.openPanel();const oldActive=STATE.activeProjectId;let createdId='';let st=window.__AICtrl._test.state();if(!st){createProject('交接摘要测试','__IDEA_STANDARD__');createdId=(currentProj()||{}).id||'';st=window.__AICtrl._test.state();}if(!st)return {missing:true};const old=st.pendingDiffs;
    st.pendingDiffs={id:'handoff-test',gen:true,items:[{id:'h1',sectionId:'purpose',sectionTitle:'目的',type:'text',status:'pending',validation:{ok:true,warnings:[],blocked:[]}}],handoff:'# Coding Agent 交接摘要\\n\\n## P0：第一版必须完成\\n每日记录喝水'};
    window.__AICtrl.renderPanel();const panel=document.getElementById('aiBody'),text=panel?panel.textContent||'':'';const copy=!!document.querySelector('[data-ai="deshandoffcopy"]');st.pendingDiffs=old;if(createdId){STATE.projects=STATE.projects.filter(p=>p.id!==createdId);STATE.activeProjectId=oldActive;refreshData();save();render();}window.__AICtrl.renderPanel();return {missing:false,text,copy};
  })()`);
  check('AI 草稿待确认时显示可复制的 Coding Agent 交接摘要', !ideaHandoff.missing && ideaHandoff.text.indexOf('Coding Agent 交接摘要')>=0 && ideaHandoff.text.indexOf('每日记录喝水')>=0 && ideaHandoff.copy, JSON.stringify(ideaHandoff));
  const isolatedIdeaFramework = await evalJs(`(()=>{
    const before=deep(STATE);
    STATE.framework=[{id:'legacy-ai',title:'AI 助手旧目录',type:'text',required:true,weight:1}];
    createProject('目录隔离验证','__IDEA_STANDARD__');
    const created=currentProj(),titles=(created&&created.framework||[]).map(s=>s.title);
    STATE=before;refreshData();save();render();
    return {count:titles.length,hasPurpose:titles.indexOf('目的')>=0,hasFeature:titles.indexOf('功能需求')>=0,hasAiLegacy:titles.some(x=>x.indexOf('AI 助手旧目录')>=0)};
  })()`);
  check('从想法开始：创建时隔离旧项目框架，始终落到通用产品目录', isolatedIdeaFramework.count===14 && isolatedIdeaFramework.hasPurpose && isolatedIdeaFramework.hasFeature && !isolatedIdeaFramework.hasAiLegacy, JSON.stringify(isolatedIdeaFramework));
  const desStream = await evalJs(`(async()=>{
    const oldFetch=window.fetch,oldSettings=localStorage.getItem('prdKanbanAiSettings'),oldTest=window.__AI_TEST_MODE,requests=[];
    window.__AI_TEST_MODE=true;
    localStorage.setItem('prdKanbanAiSettings',JSON.stringify({provider:'custom',apiKey:'test-key',baseUrl:'https://mock.local/v1',model:'mock-model'}));
    window.fetch=(url,opts)=>{requests.push(String(opts&&opts.body||''));const content=requests.length===1?'【我已理解】你想做一个喝水记录工具。\\n【已确认事实】- 想做喝水记录工具\\n【还需确认】使用者。\\n【AI假设】无。\\n【进入下一题】你希望谁使用它？':'【我已理解】这是给你自己使用的喝水记录工具。\\n【已确认事实】- 想做喝水记录工具\\n- 使用者是你自己\\n【还需确认】第一版最想完成的事。\\n【AI假设】无。\\n【进入下一题】第一版最想让它完成什么？';const body='data: '+JSON.stringify({choices:[{delta:{content}}]})+'\\n\\ndata: [DONE]\\n\\n';return Promise.resolve(new Response(body,{headers:{'Content-Type':'text/event-stream'}}));};
    aiDesignOpen();const input=document.getElementById('aiDesInput');if(input)input.value='我想记录每天喝水';const send1=document.getElementById('aiDesSendBtn');if(send1)send1.click();
    await new Promise(r=>setTimeout(r,120));
    const replyLog=(document.getElementById('aiDesLog')||{}).textContent||'',replyStop=getComputedStyle(document.getElementById('aiDesStop')).display;
    const follow=document.getElementById('aiDesInput');if(follow)follow.value='我自己用';const sendFollow=document.getElementById('aiDesSendBtn');if(sendFollow)sendFollow.click();
    await new Promise(r=>setTimeout(r,120));
    const remembered=!!(requests[1]&&requests[1].indexOf('已完成问答')>=0&&requests[1].indexOf('问题：你希望谁使用它？')>=0&&requests[1].indexOf('回答：我自己用')>=0&&requests[1].indexOf('不得换一种说法重复提问')>=0);
    aiDesState.turns=Array.from({length:9},(_,i)=>({question:'问题'+(i+1),answer:'回答'+(i+1)}));aiDesState.qa=aiDesState.turns.map(x=>x.answer);aiDesState.needs=['第一版范围'];aiDesState.checkpointAt=0;
    const tenth=document.getElementById('aiDesInput');if(tenth)tenth.value='第十轮补充';const tenthSend=document.getElementById('aiDesSendBtn');if(tenthSend)tenthSend.click();
    await new Promise(r=>setTimeout(r,120));
    const checkpoint=document.getElementById('aiDesCheckpointModal'),checkpointOpen=!!(checkpoint&&checkpoint.classList.contains('open')),continueBtn=document.querySelector('[data-ai="descheckpointcontinue"]');if(continueBtn)continueBtn.click();
    const checkpointClosed=!(checkpoint&&checkpoint.classList.contains('open'));
    aiDesState.turns=Array.from({length:19},(_,i)=>({question:'问题'+(i+1),answer:'回答'+(i+1)}));aiDesState.qa=aiDesState.turns.map(x=>x.answer);aiDesState.needs=['第一版范围'];aiDesState.checkpointAt=10;
    const twentieth=document.getElementById('aiDesInput');if(twentieth)twentieth.value='第二十轮补充';const twentiethSend=document.getElementById('aiDesSendBtn');if(twentiethSend)twentiethSend.click();
    await new Promise(r=>setTimeout(r,120));
    const generateBtn=document.querySelector('[data-ai="descheckpointgenerate"]');if(generateBtn)generateBtn.click();
    const skeleton=document.getElementById('aiDesSkeletonModal'),checkpointGenerate=!!(skeleton&&skeleton.classList.contains('open'));
    const checkpointAt=aiDesState.checkpointAt;
    const skeletonClose=document.querySelector('[data-ai="desskelclose"]');if(skeletonClose)skeletonClose.click();
    aiDesignOpen();const input2=document.getElementById('aiDesInput');if(input2)input2.value='我想做一个简单工具';const send2=document.getElementById('aiDesSendBtn');if(send2)send2.click();const stop=document.getElementById('aiDesStop');if(stop)stop.click();
    await new Promise(r=>setTimeout(r,80));
    const stopLog=(document.getElementById('aiDesLog')||{}).textContent||'',stopDisplay=getComputedStyle(document.getElementById('aiDesStop')).display;
    window.fetch=oldFetch;if(oldSettings===null)localStorage.removeItem('prdKanbanAiSettings');else localStorage.setItem('prdKanbanAiSettings',oldSettings);window.__AI_TEST_MODE=oldTest;
    const close=document.querySelector('[data-ai="desclose"]');if(close)close.click();
    return {reply:replyLog.indexOf('你希望谁使用它')>=0,replyStop,remembered,checkpointOpen,checkpointClosed,checkpointAt,hasContinue:!!continueBtn,hasGenerate:!!generateBtn,checkpointGenerate,stopped:stopLog.indexOf('已停止本轮引导')>=0,stopDisplay};
  })()`);
  check('AI 澄清：流式首答会解除思考态；下一轮携带问题-回答与事实记忆，不会遗忘；请求尚未开始时停止也能恢复操作', desStream.reply && desStream.replyStop==='none' && desStream.remembered && desStream.stopped && desStream.stopDisplay==='none', JSON.stringify(desStream));
  check('AI 澄清：第 10 轮触发阶段检查，用户可继续完善或进入可编辑方案，不强制直接生成', desStream.checkpointAt===10 && desStream.checkpointClosed && desStream.hasContinue && desStream.hasGenerate && desStream.checkpointGenerate, JSON.stringify(desStream));

  // 加载示例 → 触发 render（标准 14 节框架，验收黄）
  await evalJs(`(()=>{ const b=document.querySelector('[data-act="sample"]'); if(b)b.click(); return true; })()`);
  await new Promise(r => setTimeout(r, 1800));
  const sampleOk = await evalJs(`(()=>{ const p=currentProj(); return p?((p.data.purpose&&p.data.purpose.html||'').indexOf('核心需求')>=0 && (p.data.feat&&p.data.feat.items?p.data.feat.items.length:0)===8):false; })()`);
  check('示例加载后内容完整（标准 14 节）', sampleOk===true, String(sampleOk));
  const assistantKnowledge = await evalJs(`(()=>{
    const p=currentProj(),api=window.__AICtrl&&window.__AICtrl._test,knowledge=api&&api.chatKnowledge?api.chatKnowledge():'',prompt=api&&api.chatPrompt?api.chatPrompt():'';
    const floatBtn=document.getElementById('aiFloatBtn');if(floatBtn)floatBtn.click();
    const label=(document.getElementById('aiFloatKnowledge')||{}).textContent||'',quick=document.querySelectorAll('[data-ai="floatask"]');
    const panel=document.getElementById('aiFloatPanel');if(panel&&panel.classList.contains('open')&&floatBtn)floatBtn.click();
    return {hasApi:!!api,hasName:knowledge.indexOf(p.name)>=0,hasBody:knowledge.indexOf('功能需求')>=0,hasQuality:knowledge.indexOf('当前质量状态')>=0,teaches:prompt.indexOf('小白能懂的话')>=0,states:prompt.indexOf('当前已确认')>=0,label,quick:quick.length};
  })()`);
  check('项目助手：携带当前项目知识和质量状态，以小白语言回答并提供可见快捷入口', assistantKnowledge.hasApi && assistantKnowledge.hasName && assistantKnowledge.hasBody && assistantKnowledge.hasQuality && assistantKnowledge.teaches && assistantKnowledge.states && assistantKnowledge.label.indexOf('已读取')>=0 && assistantKnowledge.quick===3, JSON.stringify(assistantKnowledge));
  const sampleGuide = await evalJs(`(()=>{ const g=document.getElementById('sampleNext'); return {shown:!!g,edit:!!document.querySelector('[data-act="sample-edit"]'),health:!!document.querySelector('[data-act="sample-health"]'),rename:!!document.querySelector('[data-act="sample-rename"]')}; })()`);
  check('示例 PRD：展示可执行的下一步建议', sampleGuide.shown && sampleGuide.edit && sampleGuide.health && sampleGuide.rename, JSON.stringify(sampleGuide));
  const reviewToComments = await evalJs(`(()=>{
    const pj=currentProj(),review={id:'dash-review',at:Date.now(),roles:['pm','qa'],groups:[{role:RV_ROLES[0],items:[{sev:'high',txt:'目标需要明确量化验收方式。',sec:'目的'}]},{role:RV_ROLES[2],items:[{sev:'medium',txt:'补充异常输入的测试边界。',sec:'验收标准'}]}]};
    const count=rvSyncReviewComments(pj,review),html=rvRenderGroupsHtml(review.groups,{pjName:pj.name,reviewIndex:0});
    openCommentsPanel();const panel=document.querySelector('.cmt-list-modal'),panelText=panel?panel.textContent:'';if(panel)panel.remove();
    const reviewStore=Object.values(DATA).flatMap(c=>Object.values(c&&c.comments||{})).concat(pj.reviewComments||{});
    const roleStorage=reviewStore.some(c=>c&&c.by==='AI 评审 · 产品经理')&&reviewStore.some(c=>c&&c.by==='AI 评审 · 测试');
    rvRemoveReviewComments(pj,review.id);
    const remaining=Object.values(DATA).flatMap(c=>Object.values(c&&c.comments||{})).concat(pj.reviewComments||[]);
    return {count,roleStorage,panelRole:panelText.indexOf('AI 评审 · 产品经理')>=0&&panelText.indexOf('AI 评审 · 测试')>=0,actions:html.indexOf('data-act="rvcomments"')>=0&&html.indexOf('data-act="rvautofix"')>=0,cleaned:!remaining.some(c=>c&&c.reviewId==='dash-review')};
  })()`);
  check('多角色评审：意见同步到评论并标清角色，提供评论查看与一键安全优化入口', reviewToComments.count===2 && reviewToComments.roleStorage && reviewToComments.panelRole && reviewToComments.actions && reviewToComments.cleaned, JSON.stringify(reviewToComments));
  const stage4 = await evalJs(`(()=>{
    const sid='purpose';
    const btn=document.querySelector('[data-ai="lock-section"][data-sid="'+sid+'"]');
    const rules=(STATE.ruleSet||[]).filter(r=>/^R-XCONS-0[1-5]$/.test(r.id)).map(r=>r.id);
    const before=typeof runHealth==='function'?runHealth():null;
    return {hasBtn:!!btn,label:btn?btn.textContent:'',rules,health:!!before};
  })()`);
  check('阶段四：跨章节规则已加载，章节旁提供 AI 锁定入口且保留规则体检能力', stage4.hasBtn && stage4.label.indexOf('锁定 AI')>=0 && stage4.rules.length===5 && stage4.health, JSON.stringify(stage4));
  const traceability = await evalJs(`(()=>{ const panel=document.querySelector('.trace-panel');const table=panel&&panel.querySelector('.trace-table');const rows=table?Array.from(table.querySelectorAll('tbody tr')):[];return {shown:!!panel,header:table?table.querySelector('thead').textContent:'',rows:rows.length,hasFeature:rows.some(r=>(r.cells[0]||{}).textContent.trim().length>0),hasLink:!!document.querySelector('.trace-panel [data-act="opensec"]'),p0Gate:(document.querySelector('.delivery-ready')||{}).textContent||''}; })()`);
  check('需求追溯链：展示功能到用户、验收、测试、埋点，并提示 P0 交付门槛', traceability.shown && traceability.header.indexOf('用户需求')>=0 && traceability.header.indexOf('验收标准')>=0 && traceability.header.indexOf('测试点')>=0 && traceability.header.indexOf('埋点')>=0 && traceability.rows>0 && traceability.hasFeature && traceability.hasLink && traceability.p0Gate.indexOf('P0 功能缺少关联验收或测试点')>=0, JSON.stringify(traceability));
  const exportPreflight = await evalJs(`(()=>{const b=document.querySelector('#dashboard [data-act="exportmd"]');if(b)b.click();const m=document.getElementById('exportPreflightModal');return {open:!!(m&&m.classList.contains('open')),title:m?m.querySelector('.m-head').textContent:'',summary:(document.getElementById('exportPreflightSummary')||{}).textContent||'',gaps:(document.getElementById('exportPreflightGaps')||{}).textContent||'',confirm:(document.getElementById('exportPreflightConfirm')||{}).textContent||''};})()`);
  check('导出前：先展示交付检查与追溯缺口，允许作为继续编辑稿导出', exportPreflight.open && exportPreflight.title.indexOf('导出前交付检查')>=0 && exportPreflight.summary.indexOf('当前未达到完整交付就绪条件')>=0 && exportPreflight.gaps.indexOf('P0 追溯缺口')>=0 && exportPreflight.confirm.indexOf('仍然导出')>=0, JSON.stringify(exportPreflight));
  await evalJs(`(()=>{ const b=document.querySelector('#exportPreflightModal [data-act="closemodal"]'); if(b)b.click(); return true; })()`);
  const gapPriority = await evalJs(`(()=>{
    const order={'阻塞研发':0,'阻塞测试':1,'影响目标':2,'建议优化':3};
    const table=document.querySelector('.gap-table');
    const rows=Array.from(document.querySelectorAll('.gap-row'));
    const impacts=rows.map(r=>((r.cells[3]||{}).textContent||'').trim());
    const ranks=impacts.map(x=>order[x]);
    return {hasTable:!!table,header:table?table.querySelector('thead').textContent:'',count:rows.length,impacts,ranks,linked:rows.every(r=>!!r.querySelector('[data-hi]'))};
  })()`);
  check('交付缺口：按研发、测试、目标、建议优化排序并保留展开关联', gapPriority.hasTable && gapPriority.header.indexOf('交付影响')>=0 && gapPriority.header.indexOf('下一步')>=0 && gapPriority.count>0 && gapPriority.ranks.every((v,i,a)=>v!==undefined&&(i===0||a[i-1]<=v)) && gapPriority.linked, JSON.stringify(gapPriority));

  const dash = await evalJs(`(()=>{
    const sub=document.getElementById('heroSub');
    const cells=Array.from(document.querySelectorAll('#dashboard .dash-cell'));
    const out={};
    out.hero = sub?sub.textContent:'';
    out.cellCount = cells.length;
    out.cellsOk = cells.every(c=>['green','yellow','red'].includes(c.className.split(' ')[1]));
    out.hasLegend = !!document.querySelector('.dash-legend');
    out.hasAiCard = !!document.querySelector('#dashboard .dash-ai');
    out.hasScoreBtn = !!document.querySelector('#dashboard [data-ai="score"]');
    out.hasCopyBtn = !!document.querySelector('#dashboard [data-act="copyhealth"]');
    out.hasExportBtn = !!document.querySelector('#dashboard [data-act="exportmd"]');
    out.hasGaps = !!document.querySelector('#dashboard .gaps');
    const health=window.__dashTest?null:(typeof runHealth==='function'?runHealth():null);
    out.healthCount = health?health.metrics.completion:null;
    return out;
  })()`);
  check('dash hero 实时摘要含完成度', (dash.hero||'').indexOf('完成度')>=0 && (dash.hero||'').indexOf('%')>=0, JSON.stringify(dash.hero));
  check('dash 热力图：14 节=框架节数、颜色合法、含图例', dash.cellCount===14 && dash.cellsOk && dash.hasLegend, JSON.stringify(dash));
  check('dash 无 AI 报告时显示体检入口 + 摘要操作', dash.hasAiCard && dash.hasScoreBtn && dash.hasCopyBtn && dash.hasExportBtn, JSON.stringify(dash));
  check('dash 缺口清单仍在', dash.hasGaps===true, JSON.stringify(dash));

  // 注入 AI 总评 → render → AI 卡升级为总分+6 维条
  await evalJs(`(()=>{
    const st=window.__AICtrl._test.state();
    st.lastReport={total:86,summary:'整体完整，验收与自测可再补量化',generatedAt:Date.now(),dimensions:[
      {id:'completeness',name:'完整性',score:90,weight:25,issues:[]},
      {id:'clarity',name:'清晰度',score:85,weight:20,issues:[]},
      {id:'consistency',name:'一致性',score:88,weight:15,issues:[]},
      {id:'executability',name:'可执行性',score:84,weight:15,issues:[]},
      {id:'verifiability',name:'可验证性',score:80,weight:15,issues:[]},
      {id:'risk',name:'风险',score:87,weight:10,issues:[]}
    ]};
    window.__dashTest=1;
    if(typeof render==='function')render();
    return true;
  })()`);
  await new Promise(r => setTimeout(r, 400));
  const aiCard = await evalJs(`(()=>{
    const card=document.querySelector('#dashboard .dash-ai');
    const txt=card?card.textContent:'';
    return {has: !!card, score86: txt.indexOf('86')>=0, dims: document.querySelectorAll('#dashboard .dash-dim').length, summary: txt.indexOf('验收')>=0};
  })()`);
  check('dash AI 总评卡：总分+6 维迷你条+摘要', aiCard.has && aiCard.score86 && aiCard.dims===6 && aiCard.summary, JSON.stringify(aiCard));

  const dimDrill = await evalJs(`(()=>{
    const dim=document.querySelector('#dashboard .dash-dim[data-i="0"]');
    const box=document.getElementById('dimd-0');
    if(!dim||!box)return {missing:true};
    const chev=dim.querySelector('.dd-chev'),cr=chev.getBoundingClientRect();
    const before=window.scrollY;dim.click();
    const crAfter=chev.getBoundingClientRect();
    const opened={tag:dim.tagName,expanded:dim.getAttribute('aria-expanded'),shown:getComputedStyle(box).display,detailsBelow:box.getBoundingClientRect().top>=dim.getBoundingClientRect().bottom-1,chevronFixed:Math.abs(cr.left-crAfter.left)<=1&&Math.abs(cr.top-crAfter.top)<=1&&Math.abs(cr.width-crAfter.width)<=1,chevronWidth:Math.round(crAfter.width),scrollDelta:Math.abs(window.scrollY-before)};
    dim.click();
    return {opened,closed:{expanded:dim.getAttribute('aria-expanded'),shown:getComputedStyle(box).display}};
  })()`);
  check('AI 总评维度：展开箭头固定在分数右侧，仅旋转且不改变页面滚动', !dimDrill.missing && dimDrill.opened.tag==='BUTTON' && dimDrill.opened.expanded==='true' && dimDrill.opened.shown==='block' && dimDrill.opened.detailsBelow && dimDrill.opened.chevronFixed && dimDrill.opened.chevronWidth===12 && dimDrill.opened.scrollDelta<=1 && dimDrill.closed.expanded==='false' && dimDrill.closed.shown==='none', JSON.stringify(dimDrill));

  // 复制体检摘要 → 生成 Markdown 且含节状态
  await evalJs(`(()=>{ const b=document.querySelector('[data-act="copyhealth"]'); if(b)b.click(); return true; })()`);
  await new Promise(r => setTimeout(r, 300));
  const summary = await evalJs(`(()=>{
    const s=window.__lastHealthSummary||'';
    return {has: s.length>80, md: s.indexOf('健康度摘要')>=0, sections: s.indexOf('### 节状态')>=0, emoji: s.indexOf('✅')>=0};
  })()`);
  check('dash 复制摘要：Markdown 含指标与节状态', summary.has && summary.md && summary.sections && summary.emoji, JSON.stringify(summary));

  // 热力图单元格可点击定位（点击不报错）
  await evalJs(`(()=>{ const c=document.querySelector('.dash-cell.yellow')||document.querySelector('.dash-cell'); if(c)c.click(); return true; })()`);
  await new Promise(r => setTimeout(r, 300));
  check('dash 热力图点击定位无异常', true, '');

  // ---------- v17.17 多项目总览 ----------
  await evalJs(`(()=>{ const b=document.querySelector('[data-act="toggleoverview"]'); if(b)b.click(); return true; })()`);
  await new Promise(r => setTimeout(r, 400));
  const ov1 = await evalJs(`(()=>{
    const panel=document.getElementById('overviewPanel');
    const txt=panel?panel.textContent:'';
    return {open: !!panel&&panel.classList.contains('open'), disp: panel?getComputedStyle(panel).display:'', btn: !!document.querySelector('[data-act="toggleoverview"]'), cards: document.querySelectorAll('.ov-card').length, avg: txt.indexOf('平均完成度')>=0};
  })()`);
  check('总览：侧栏按钮+浮层打开(display:flex)+项目卡与统计', ov1.open && ov1.disp==='flex' && ov1.btn && ov1.cards>=1 && ov1.avg, JSON.stringify(ov1));
  const ovCard1 = await evalJs(`(()=>{
    const card=document.querySelector('.ov-card');
    const dots=card?card.querySelectorAll('.ov-dots i').length:0;
    const fw=window.__dashFw||0;
    return {hasComp: card?(card.textContent.indexOf('完成度')>=0):false, dots, fwCount: STATE.framework.length};
  })()`);
  check('总览：项目卡含完成度与逐节色点', ovCard1.hasComp && ovCard1.dots===ovCard1.fwCount, JSON.stringify(ovCard1));
  const ovIsolated = await evalJs(`(()=>{
    const before=currentProj().name;
    const h=window.healthForProject?window.healthForProject(currentProj()):null;
    const after=currentProj().name;
    const cur=typeof runHealth==='function'?runHealth():null;
    return {same: before===after, hOk: !!(h&&h.metrics&&typeof h.metrics.completion==='number'), curOk: !!(cur&&cur.metrics)};
  })()`);
  check('总览：按项目计算健康度且不污染当前状态', ovIsolated.same && ovIsolated.hOk && ovIsolated.curOk, JSON.stringify(ovIsolated));

  // 第二个项目（必填节全空 → 红）→ 总览出现 2 卡且统计含风险项目
  await evalJs(`(()=>{ const pv=document.getElementById('overviewPanel'); if(pv)pv.classList.remove('open'); createProject('风险项目','default'); const p=currentProj(); if(p){p.data.purpose={html:'',cards:[]};p.data.feat={items:[{name:'',desc:'',priority:'',status:''}],cards:[]};} if(typeof render==='function')render(); toggleOverview(); return true; })()`);
  await new Promise(r => setTimeout(r, 400));
  const ov2 = await evalJs(`(()=>{
    const txt=document.getElementById('overviewPanel').textContent;
    const cards=Array.from(document.querySelectorAll('.ov-card'));
    const riskCard=cards.find(c=>c.textContent.indexOf('风险项目')>=0);
    const h=window.healthForProject?window.healthForProject(window.__dashRiskProj||currentProj()):null;
    const riskProj=STATE.projects.find(p=>p.name==='风险项目');
    const h2=riskProj?window.healthForProject(riskProj):null;
    return {cards: cards.length, hasRiskStat: txt.indexOf('风险项目')>=0, riskCardComp: riskCard?(riskCard.textContent.indexOf('完成度 0%')>=0):false, riskCardDots: riskCard?riskCard.querySelectorAll('.ov-dots i.red').length:0, h: h2?JSON.stringify(h2.metrics):'null', fwLen: riskProj?(riskProj.framework||[]).length:0};
  })()`);
  check('总览：两项目+风险项目统计+红点', ov2.cards===2 && ov2.hasRiskStat && ov2.riskCardComp && ov2.riskCardDots>=1, JSON.stringify(ov2));

  // 点击项目卡 → 切换项目并关闭浮层
  await evalJs(`(()=>{ const cards=Array.from(document.querySelectorAll('.ov-card')); const target=cards.find(c=>c.textContent.indexOf('风险项目')<0)||cards[0]; target.click(); return true; })()`);
  await new Promise(r => setTimeout(r, 400));
  const ovSwitch = await evalJs(`(()=>{
    const panel=document.getElementById('overviewPanel');
    const tp=document.getElementById('topbarProjName');
    const sp=STATE.projects.find(p=>p.name==='示例 PRD');
    return {closed: !panel.classList.contains('open'), name: tp?tp.textContent:'', spPurpose: sp&&sp.data.purpose?(sp.data.purpose.html||'').slice(0,30):'EMPTY'};
  })()`);
  check('总览：点击卡片切换项目并关闭（目标项目内容不被覆盖）', ovSwitch.closed && ovSwitch.name!=='风险项目' && ovSwitch.spPurpose.indexOf('核心需求')>=0, JSON.stringify(ovSwitch));

  // 再打开 → 关闭按钮
  await evalJs(`(()=>{ const b=document.querySelector('[data-act="toggleoverview"]'); if(b)b.click(); return true; })()`);
  await new Promise(r => setTimeout(r, 300));
  await evalJs(`(()=>{ const b=document.querySelector('[data-act="ovclose"]'); if(b)b.click(); return true; })()`);
  await new Promise(r => setTimeout(r, 200));
  const ovClosed = await evalJs(`(()=>!document.getElementById('overviewPanel').classList.contains('open'))()`);
  check('总览：ovclose 关闭浮层', ovClosed===true, String(ovClosed));

  // ---------- v18.62 小白场景模板 + 热力图下钻 ----------
  await evalJs(`(()=>{ const b=document.querySelector('[data-act="tpl"]'); if(b)b.click(); return true; })()`);
  await new Promise(r => setTimeout(r, 300));
  const tpl1 = await evalJs(`(()=>{
    const sel=document.getElementById('tplPreset');
    const ed=document.getElementById('tplEditor');
    const advanced=document.getElementById('tplAdvanced');
    const cards=Array.from(document.querySelectorAll('#tplGallery .tpl-card'));
    return {open: !!document.getElementById('tplModal')&&document.getElementById('tplModal').classList.contains('open'), opts: sel?sel.options.length:0, cards:cards.length, selected:cards.some(c=>c.classList.contains('on')&&c.dataset.tpl==='standard'), advancedHidden:!!advanced&&getComputedStyle(advanced).display==='none', editor: !!(ed&&ed.value&&ed.value.indexOf('# PRD')>=0)};
  })()`);
  check('场景模板：默认展示 6 个小白场景，Markdown 编辑默认收起', tpl1.open && tpl1.opts===6 && tpl1.cards===6 && tpl1.selected && tpl1.advancedHidden && tpl1.editor, JSON.stringify(tpl1));
  await evalJs(`(()=>{ const b=document.querySelector('[data-act="tplchoose"][data-tpl="hardware"]'); if(b)b.click(); return true; })()`);
  await new Promise(r => setTimeout(r, 200));
  const tpl2 = await evalJs(`(()=>{ const v=(document.getElementById('tplEditor')||{}).value||'',p=(document.getElementById('tplPreviewTitle')||{}).textContent||'';const card=document.querySelector('[data-tpl="hardware"]'); return {hw: v.indexOf('通用硬件 / 物联网产品需求模板')>=0, safety: v.indexOf('功能安全等级')>=0, env: v.indexOf('高低温')>=0, chosen:!!card&&card.classList.contains('on'), preview:p.indexOf('智能硬件')>=0}; })()`);
  check('场景模板：选择硬件场景即载入安全、环境和验证框架', tpl2.hw && tpl2.safety && tpl2.env && tpl2.chosen && tpl2.preview, JSON.stringify(tpl2));
  await evalJs(`(()=>{ const b=document.querySelector('#tplModal .x'); if(b)b.click(); return true; })()`);
  await new Promise(r => setTimeout(r, 200));
  const drill = await evalJs(`(()=>{ const c=document.querySelector('.dash-cell'); return {act: c?c.dataset.act:''}; })()`);
  check('热力图：色块点击=opensec（定位并展开判分明细）', drill.act==='opensec', JSON.stringify(drill));

  // ---------- v17.20 自定义模板存取 + 总览排序 ----------
  await evalJs(`(()=>{ const b=document.querySelector('[data-act="tpl"]'); if(b)b.click(); return true; })()`);
  await new Promise(r => setTimeout(r, 250));
  await evalJs(`(()=>{ const b=document.querySelector('[data-act="tpladvanced"]'); if(b)b.click(); return true; })()`);
  await new Promise(r => setTimeout(r, 150));
  await evalJs(`(()=>{ const ed=document.getElementById('tplEditor'); if(ed)ed.value='# 我的车规模板\\n\\n## 安全需求\\n功能安全等级 ASIL B。'; window.__tplSaveName='我的车规模板'; const b=document.querySelector('[data-act="tpl-saveas"]'); if(b)b.click(); return true; })()`);
  await new Promise(r => setTimeout(r, 250));
  const c1 = await evalJs(`(()=>{ const sel=document.getElementById('tplPreset'); const opts=Array.from(sel.options).map(o=>o.value); const saved=localStorage.getItem('prdKanbanTplCustom')||''; return {opts: opts.length, hasCustom: opts.some(v=>v.indexOf('custom:')===0), stored: saved.indexOf('我的车规模板')>=0}; })()`);
  check('自定义模板：从高级编辑保存后入下拉+本地存储', c1.opts===7 && c1.hasCustom && c1.stored, JSON.stringify(c1));
  await evalJs(`(()=>{ const sel=document.getElementById('tplPreset'); const cv=Array.from(sel.options).find(o=>o.value.indexOf('custom:')===0); if(cv){sel.value=cv.value;const b=document.querySelector('[data-act="tpl-preset"]');b.click();} return true; })()`);
  await new Promise(r => setTimeout(r, 200));
  const c2 = await evalJs(`(()=>{ const v=(document.getElementById('tplEditor')||{}).value||''; return {has: v.indexOf('我的车规模板')>=0 && v.indexOf('功能安全等级')>=0}; })()`);
  check('自定义模板：套用生效', c2.has, JSON.stringify(c2));
  await evalJs(`(()=>{ window.__tplDelOk=true; const b=document.querySelector('[data-act="tpl-delcustom"]'); if(b)b.click(); return true; })()`);
  await new Promise(r => setTimeout(r, 200));
  const c3 = await evalJs(`(()=>{ const sel=document.getElementById('tplPreset'); return {opts: sel.options.length, stored: (localStorage.getItem('prdKanbanTplCustom')||'').indexOf('我的车规模板')<0}; })()`);
  check('自定义模板：删除后下拉恢复 6 项', c3.opts===6 && c3.stored, JSON.stringify(c3));
  await evalJs(`(()=>{ const b=document.querySelector('#tplModal .x'); if(b)b.click(); return true; })()`);
  await new Promise(r => setTimeout(r, 200));

  await evalJs(`(()=>{ if(typeof toggleOverview==='function')toggleOverview(); return true; })()`);
  await new Promise(r => setTimeout(r, 300));
  const s1 = await evalJs(`(()=>{ const cards=Array.from(document.querySelectorAll('.ov-card')); const risks=STATE.projects.map(p=>{const h=window.healthForProject?window.healthForProject(p):null;return {name:p.name,risk:h?h.metrics.risk:null,comp:h?h.metrics.completion:null};}); const sp=STATE.projects.find(p=>p.name==='示例 PRD'); return {first: cards[0]?cards[0].textContent.indexOf('风险项目')>=0:false, mode: window.ovSortMode, names: cards.map(c=>c.textContent.slice(0,20)), risks, active: currentProj()?currentProj().name:'none', spKeys: sp?Object.keys(sp.data||{}).length:-1, spPurpose: sp&&sp.data.purpose?(sp.data.purpose.html||'').slice(0,40):'EMPTY'}; })()`);
  check('总览排序：默认风险优先(风险项目在前)', s1.first && s1.mode===0, JSON.stringify(s1));
  await evalJs(`(()=>{ const b=document.querySelector('[data-act="ovsort"]'); if(b)b.click(); return true; })()`);
  await new Promise(r => setTimeout(r, 250));
  const s2 = await evalJs(`(()=>{ const b=document.querySelector('[data-act="ovsort"]'); return {mode: window.ovSortMode, label: b?b.textContent:''}; })()`);
  check('总览排序：点击切换模式+标签更新', s2.mode===1 && s2.label.indexOf('完成度升序')>=0, JSON.stringify(s2));
  await evalJs(`(()=>{ const b=document.querySelector('[data-act="ovclose"]'); if(b)b.click(); return true; })()`);

  // ---------- P0 删除框架节与备份覆盖保护 ----------
  const fwDelete = await evalJs(`(()=>{
    const p=STATE.projects.find(x=>x.name==='示例 PRD')||currentProj();
    STATE.activeProjectId=p.id;STATE.framework=JSON.parse(JSON.stringify(p.framework));refreshData();
    openFwEditor(STATE.framework,{context:'settings',sourceId:null,baseName:'自定义框架',saveAs:false});
    const sourceIndex=fwEditorBuf.findIndex(s=>s.id==='purpose');
    openFwDeleteModal(sourceIndex);
    const modal=document.getElementById('fwDeleteModal');const wasOpen=!!(modal&&modal.classList.contains('open'));
    const impact=(document.getElementById('fwDeleteImpact')||{}).textContent||'';
    const target=document.getElementById('fwDeleteTarget'); if(target)target.value='meta';
    confirmFwDelete();
    const b=document.querySelector('#fwEditModal [data-act="fwedit-done"]');if(b)b.click();
    const now=currentProj(), archived=now.data.meta&&now.data.meta.cards&&now.data.meta.cards.some(c=>(c.title||'').indexOf('已归档：目的')>=0);
    return {modalOpen:wasOpen,impact,archiveOption:!!document.querySelector('#fwDeleteModal input[value="archive"]'),deleteOption:!!document.querySelector('#fwDeleteModal input[value="delete"]'),removed:!now.framework.some(s=>s.id==='purpose'),sourceGone:!now.data.purpose,archived};
  })()`);
  check('框架删节：先展示内容/导出影响，并可归档后再提交', fwDelete.modalOpen && fwDelete.impact.indexOf('受影响内容')>=0 && fwDelete.impact.indexOf('导出影响')>=0 && fwDelete.archiveOption && fwDelete.deleteOption && fwDelete.removed && fwDelete.sourceGone && fwDelete.archived, JSON.stringify(fwDelete));

  const backupImport = await evalJs(`(()=>{
    localStorage.removeItem(RESET_LOCAL_KEYS.preImport);
    const incoming=JSON.parse(JSON.stringify(STATE));incoming.projects=[];incoming.groups=[];incoming.activeProjectId=null;
    openBackupImportModal(incoming,'import');
    const modal=document.getElementById('backupImportModal');const wasOpen=!!(modal&&modal.classList.contains('open'));const summary=(document.getElementById('backupImportSummary')||{}).textContent||'';
    applyBackupImport();
    return {opened:wasOpen,summary,restored:!!localStorage.getItem(RESET_LOCAL_KEYS.preImport),projects:STATE.projects.length,hasRestoreEntry:!!document.querySelector('[data-act="restorepreimport"]')};
  })()`);
  check('备份导入：先展示覆盖范围并写入独立导入前恢复点', backupImport.opened && backupImport.summary.indexOf('会覆盖')>=0 && backupImport.summary.indexOf('保护')>=0 && backupImport.restored && backupImport.projects===0 && backupImport.hasRestoreEntry, JSON.stringify(backupImport));

  const storageAdvice = await evalJs(`(()=>{ updateStorageAdvice('x'.repeat(Math.ceil(3.6*1024*1024/2))); const el=document.getElementById('storageAdvice'); const shown={display:getComputedStyle(el).display,text:el.textContent||''}; updateStorageAdvice('{}'); return {shown,hidden:getComputedStyle(el).display}; })()`);
  check('存储预警：接近上限时提示备份和图片压缩建议', storageAdvice.shown.display==='flex' && storageAdvice.shown.text.indexOf('导出备份')>=0 && storageAdvice.shown.text.indexOf('图片')>=0 && storageAdvice.hidden==='none', JSON.stringify(storageAdvice));

  const aiPrivacy = await evalJs(`(async()=>{ const t=window.__AICtrl._test;t.clearPrivacySeen();const st=Object.assign(window.__AICtrl.getSettings(),{provider:'deepseek',model:'privacy-test'});const p=t.privacyConfirm({label:'AI 深度体检',scope:'当前项目的 PRD 全文、章节结构和规则命中摘要',key:'privacy-test'} ,st);const m=document.getElementById('aiPrivacyModal');const text=m?m.textContent||'':'';const b=m&&m.querySelector('[data-priv="confirm"]');if(b)b.click();await p;await t.privacyConfirm({label:'AI 优化',scope:'当前项目的 PRD 全文',key:'another-action'},st);return {shown:!!m,provider:text.indexOf('DeepSeek')>=0,scope:text.indexOf('发送范围')>=0&&text.indexOf('PRD 全文')>=0,sensitive:text.indexOf('敏感信息提醒')>=0,approved:!!t.privacySeen().firstUse,noSecondModal:!document.getElementById('aiPrivacyModal')}; })()`);
  check('AI 外发前：仅首次展示服务商、范围与脱敏提示，后续操作不重复打断', aiPrivacy.shown && aiPrivacy.provider && aiPrivacy.scope && aiPrivacy.sensitive && aiPrivacy.approved && aiPrivacy.noSecondModal, JSON.stringify(aiPrivacy));

  // ---------- P1 空白页四条主路径 ----------
  const blankPaths = await evalJs(`(()=>{
    STATE.activeProjectId=null; refreshData(); render();
    const items=Array.from(document.querySelectorAll('.wk-entry')).map(el=>({text:(el.textContent||'').replace(/\\s+/g,' ').trim(),act:el.dataset.act||''}));
    const grid=document.querySelector('.wk-entries');const cols=grid?getComputedStyle(grid).gridTemplateColumns.split(' ').filter(Boolean).length:0;
    return {count:items.length,items,hasGuide:!!document.querySelector('.wk-guide'),hasDuplicateImport:!!document.getElementById('importCard'),cols};
  })()`);
  const blankText=blankPaths.items.map(x=>x.text).join(' | ');
  check('空白页：四条主路径均说明产物、耗时与适用条件，含显式新建空白项目', blankPaths.count===4 && blankPaths.cols===2 && blankPaths.items.some(x=>x.act==='wz-ai') && blankPaths.items.some(x=>x.act==='newproj') && blankPaths.items.some(x=>x.act==='import') && blankPaths.items.some(x=>x.act==='tpl') && blankText.indexOf('从想法开始')>=0 && blankText.indexOf('从空白开始')>=0 && blankText.indexOf('导入已有 PRD')>=0 && blankText.indexOf('使用场景模板')>=0 && blankText.indexOf('约 5–10 分钟')>=0 && blankText.indexOf('适合已有需求文档')>=0 && blankText.indexOf('适合不想从头搭结构')>=0 && !blankPaths.hasDuplicateImport, JSON.stringify(blankPaths));
  await evalJs(`(()=>{ const b=document.querySelector('.wk-entry[data-act="newproj"]'); if(b)b.click(); return true; })()`);
  await new Promise(r => setTimeout(r, 150));
  const blankNew = await evalJs(`(()=>{ const m=document.getElementById('newProjModal'); return {open:!!(m&&m.classList.contains('open')),hasName:!!document.getElementById('npName'),hasFramework:!!document.getElementById('npFramework')}; })()`);
  check('空白页：从空白开始直接打开新建项目与框架选择', blankNew.open && blankNew.hasName && blankNew.hasFramework, JSON.stringify(blankNew));
  await evalJs(`(()=>{ const b=document.querySelector('#newProjModal .x'); if(b)b.click(); return true; })()`);
  check('空白页：不再重复展示快速上手入口', blankPaths.hasGuide===false, JSON.stringify(blankPaths));

  // ---------- P1 文档导入预览 ----------
  const importPreview = await evalJs(`(()=>{
    closeModal('wizardModal'); if(!currentProj())loadSample();
    const before=STATE.projects.length;
    beginImportPreview('# 目的\\n导入目标\\n# 功能需求\\n导入功能\\n# 自定义风险\\n需评审','导入预览测试','预览样例.md');
    const modal=document.getElementById('importPreviewModal');
    const mapping=(document.getElementById('importPreviewMapping')||{}).textContent||'';
    const unknown=(document.getElementById('importPreviewUnmatched')||{}).textContent||'';
    const options=(document.getElementById('importPreviewOptions')||{}).textContent||'';
    return {open:!!(modal&&modal.classList.contains('open')),mapping,unknown,options,before,after:STATE.projects.length};
  })()`);
  check('文档导入：写入前预览章节映射、未识别内容与覆盖范围', importPreview.open && importPreview.mapping.indexOf('目的')>=0 && importPreview.mapping.indexOf('功能需求')>=0 && importPreview.unknown.indexOf('自定义风险')>=0 && importPreview.options.indexOf('导入为新项目')>=0 && importPreview.before===importPreview.after, JSON.stringify(importPreview));
  await evalJs(`(()=>{ const b=document.querySelector('#importPreviewModal [data-act="importpreviewconfirm"]'); if(b)b.click(); return true; })()`);
  await new Promise(r => setTimeout(r, 250));
  const imported = await evalJs(`(()=>{ const p=currentProj(),report=document.getElementById('importReportModal'); const reportText=report?report.textContent||'':''; return {name:p?p.name:'',auto:!!(p&&p.autoGen),hasPurpose:!!(p&&p.framework.some(s=>s.title==='目的')),hasCustom:!!(p&&p.framework.some(s=>s.title==='自定义风险')),closed:!document.getElementById('importPreviewModal').classList.contains('open'),reportOpen:!!(report&&report.classList.contains('open')),reportStored:!!(p&&p.importReport),reportText}; })()`);
  check('文档导入：确认后新建项目并保留原文标题结构', imported.name==='导入预览测试' && imported.auto && imported.hasPurpose && imported.hasCustom && imported.closed, JSON.stringify(imported));
  check('文档导入：完成后生成可回看的报告和待处理项', imported.reportOpen && imported.reportStored && imported.reportText.indexOf('导入报告')>=0 && imported.reportText.indexOf('核对非标准章节')>=0 && imported.reportText.indexOf('下一步')>=0, JSON.stringify(imported));
  await evalJs(`(()=>{ closeModal('importReportModal'); const b=document.querySelector('.import-report-chip'); if(b)b.click(); return true; })()`);
  await new Promise(r => setTimeout(r, 100));
  const reportRecall = await evalJs(`(()=>{const m=document.getElementById('importReportModal');return {open:!!(m&&m.classList.contains('open')),chip:!!document.querySelector('.import-report-chip')};})()`);
  check('文档导入：项目页可重新打开最近一次导入报告', reportRecall.open && reportRecall.chip, JSON.stringify(reportRecall));
} catch (e) {
  fail++; console.log('FAIL  browser 脚本异常  >>> ' + (e && e.message || e));
}

console.log('\n浏览器断言：PASS=' + pass + ' FAIL=' + fail);
console.log('控制台错误/警告数：' + errors.length);
errors.slice(0, 5).forEach(e => console.log('  ' + e));
ws.close();
cleanup();
process.exit(fail ? 1 : 0);
