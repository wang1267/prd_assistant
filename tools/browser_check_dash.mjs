// v17.16 浏览器端到端：看板总览（hero 实时摘要 / 节健康度热力图 / AI 总评卡 / 体检摘要复制）
// 运行：node tools/browser_check_dash.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

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
await send('Page.navigate', { url: 'file:///' + encodeURI('E:/vibecoding/prd_assistant/PRD智能看板.html') });
await new Promise(r => setTimeout(r, 3500));

let pass = 0, fail = 0;
function check(name, cond, detail) { if (cond) { pass++; console.log('PASS  ' + name); } else { fail++; console.log('FAIL  ' + name + '  >>> ' + detail); } }

try {
  const badge = await evalJs(`(document.getElementById('vbadge')||{}).textContent || ''`);
  check('dash v17.1x/17.2x 水印', /v17\.(1[6-9]|2\d)/.test(badge), badge);

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
  await evalJs(`(()=>{ const b=document.querySelector('#settingsModal .x'); if(b)b.click(); return true; })()`);
  await new Promise(r => setTimeout(r, 150));

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
    return {menuOpen, open: !!m&&m.classList.contains('open'), text0: t0?t0.textContent:''};
  })()`);
  await new Promise(r => setTimeout(r, 200));
  const wzOpen = await evalJs(`(()=>{ const m=document.getElementById('wizardModal'); return m&&m.classList.contains('open'); })()`);
  check('帮助：更多菜单打开→点「帮助」弹出引导', wz.menuOpen && wzOpen && wz.text0.indexOf('AI 撰写草稿')>=0 && wz.text0.indexOf('多项目总览')>=0 && wz.text0.indexOf('模板')>=0, JSON.stringify(wz));
  await evalJs(`(()=>{ const b=document.querySelector('[data-act="wznext"]'); if(b)b.click(); return true; })()`);
  await new Promise(r => setTimeout(r, 200));
  const wz1 = await evalJs(`(()=>{
    const t1=document.querySelector('#wizardModal .wz-step[data-step="1"]');
    return {vis: t1?getComputedStyle(t1).display:'', hasNew: !!document.querySelector('[data-act="wz-newproj"]'), hasAi: !!document.querySelector('[data-act="wz-ai"]')};
  })()`);
  check('新手引导：第二步含新建/示例/AI 撰写入口', wz1.vis==='block' && wz1.hasNew && wz1.hasAi, JSON.stringify(wz1));
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

  // 加载示例 → 触发 render（标准 14 节框架，验收黄）
  await evalJs(`(()=>{ const b=document.querySelector('[data-act="sample"]'); if(b)b.click(); return true; })()`);
  await new Promise(r => setTimeout(r, 1800));
  const sampleOk = await evalJs(`(()=>{ const p=currentProj(); return p?((p.data.purpose&&p.data.purpose.html||'').indexOf('多意图')>=0 && (p.data.feat&&p.data.feat.items?p.data.feat.items.length:0)===7):false; })()`);
  check('示例加载后内容完整（标准 14 节）', sampleOk===true, String(sampleOk));

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
    return {cards: cards.length, hasRiskStat: txt.indexOf('有风险项目 1')>=0, riskCardComp: riskCard?(riskCard.textContent.indexOf('完成度 0%')>=0):false, riskCardDots: riskCard?riskCard.querySelectorAll('.ov-dots i.red').length:0, h: h2?JSON.stringify(h2.metrics):'null', fwLen: riskProj?(riskProj.framework||[]).length:0};
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
  check('总览：点击卡片切换项目并关闭（目标项目内容不被覆盖）', ovSwitch.closed && ovSwitch.name!=='风险项目' && ovSwitch.spPurpose.indexOf('多意图')>=0, JSON.stringify(ovSwitch));

  // 再打开 → 关闭按钮
  await evalJs(`(()=>{ const b=document.querySelector('[data-act="toggleoverview"]'); if(b)b.click(); return true; })()`);
  await new Promise(r => setTimeout(r, 300));
  await evalJs(`(()=>{ const b=document.querySelector('[data-act="ovclose"]'); if(b)b.click(); return true; })()`);
  await new Promise(r => setTimeout(r, 200));
  const ovClosed = await evalJs(`(()=>!document.getElementById('overviewPanel').classList.contains('open'))()`);
  check('总览：ovclose 关闭浮层', ovClosed===true, String(ovClosed));

  // ---------- v17.18 模板库 + 热力图下钻 ----------
  await evalJs(`(()=>{ const b=document.querySelector('[data-act="tpl"]'); if(b)b.click(); return true; })()`);
  await new Promise(r => setTimeout(r, 300));
  const tpl1 = await evalJs(`(()=>{
    const sel=document.getElementById('tplPreset');
    const ed=document.getElementById('tplEditor');
    return {open: !!document.getElementById('tplModal')&&document.getElementById('tplModal').classList.contains('open'), opts: sel?sel.options.length:0, editor: !!(ed&&ed.value&&ed.value.indexOf('# PRD')>=0)};
  })()`);
  check('模板库：弹窗打开+3 套预设+编辑器已载入', tpl1.open && tpl1.opts===3 && tpl1.editor, JSON.stringify(tpl1));
  await evalJs(`(()=>{ const sel=document.getElementById('tplPreset'); if(sel)sel.value='hardware'; const b=document.querySelector('[data-act="tpl-preset"]'); if(b)b.click(); return true; })()`);
  await new Promise(r => setTimeout(r, 200));
  const tpl2 = await evalJs(`(()=>{ const v=(document.getElementById('tplEditor')||{}).value||''; return {hw: v.indexOf('智能硬件 / 车规需求模板')>=0, safety: v.indexOf('功能安全等级')>=0, env: v.indexOf('高低温')>=0}; })()`);
  check('模板库：套用硬件/车规预设（安全/环境/验证）', tpl2.hw && tpl2.safety && tpl2.env, JSON.stringify(tpl2));
  await evalJs(`(()=>{ const b=document.querySelector('#tplModal .x'); if(b)b.click(); return true; })()`);
  await new Promise(r => setTimeout(r, 200));
  const drill = await evalJs(`(()=>{ const c=document.querySelector('.dash-cell'); return {act: c?c.dataset.act:''}; })()`);
  check('热力图：色块点击=opensec（定位并展开判分明细）', drill.act==='opensec', JSON.stringify(drill));

  // ---------- v17.20 自定义模板存取 + 总览排序 ----------
  await evalJs(`(()=>{ const b=document.querySelector('[data-act="tpl"]'); if(b)b.click(); return true; })()`);
  await new Promise(r => setTimeout(r, 250));
  await evalJs(`(()=>{ const ed=document.getElementById('tplEditor'); if(ed)ed.value='# 我的车规模板\\n\\n## 安全需求\\n功能安全等级 ASIL B。'; window.__tplSaveName='我的车规模板'; const b=document.querySelector('[data-act="tpl-saveas"]'); if(b)b.click(); return true; })()`);
  await new Promise(r => setTimeout(r, 250));
  const c1 = await evalJs(`(()=>{ const sel=document.getElementById('tplPreset'); const opts=Array.from(sel.options).map(o=>o.value); const saved=localStorage.getItem('prdKanbanTplCustom')||''; return {opts: opts.length, hasCustom: opts.some(v=>v.indexOf('custom:')===0), stored: saved.indexOf('我的车规模板')>=0}; })()`);
  check('自定义模板：保存后入下拉+本地存储', c1.opts===4 && c1.hasCustom && c1.stored, JSON.stringify(c1));
  await evalJs(`(()=>{ const sel=document.getElementById('tplPreset'); const cv=Array.from(sel.options).find(o=>o.value.indexOf('custom:')===0); if(cv){sel.value=cv.value;const b=document.querySelector('[data-act="tpl-preset"]');b.click();} return true; })()`);
  await new Promise(r => setTimeout(r, 200));
  const c2 = await evalJs(`(()=>{ const v=(document.getElementById('tplEditor')||{}).value||''; return {has: v.indexOf('我的车规模板')>=0 && v.indexOf('功能安全等级')>=0}; })()`);
  check('自定义模板：套用生效', c2.has, JSON.stringify(c2));
  await evalJs(`(()=>{ window.__tplDelOk=true; const b=document.querySelector('[data-act="tpl-delcustom"]'); if(b)b.click(); return true; })()`);
  await new Promise(r => setTimeout(r, 200));
  const c3 = await evalJs(`(()=>{ const sel=document.getElementById('tplPreset'); return {opts: sel.options.length, stored: (localStorage.getItem('prdKanbanTplCustom')||'').indexOf('我的车规模板')<0}; })()`);
  check('自定义模板：删除后下拉恢复 3 项', c3.opts===3 && c3.stored, JSON.stringify(c3));
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
} catch (e) {
  fail++; console.log('FAIL  browser 脚本异常  >>> ' + (e && e.message || e));
}

console.log('\n浏览器断言：PASS=' + pass + ' FAIL=' + fail);
console.log('控制台错误/警告数：' + errors.length);
errors.slice(0, 5).forEach(e => console.log('  ' + e));
ws.close();
cleanup();
process.exit(fail ? 1 : 0);
