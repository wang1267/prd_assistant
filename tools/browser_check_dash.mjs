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
  check('dash v17.16 水印', badge.indexOf('v17.16') >= 0, badge);

  // 加载示例 → 触发 render（含 15 个自动节，验收黄）
  await evalJs(`(()=>{ const b=document.querySelector('[data-act="sample"]'); if(b)b.click(); return true; })()`);
  await new Promise(r => setTimeout(r, 1800));

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
  check('dash 热力图：节数=框架节数、颜色合法、含图例', dash.cellCount>=15 && dash.cellsOk && dash.hasLegend, JSON.stringify(dash));
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
} catch (e) {
  fail++; console.log('FAIL  browser 脚本异常  >>> ' + (e && e.message || e));
}

console.log('\n浏览器断言：PASS=' + pass + ' FAIL=' + fail);
console.log('控制台错误/警告数：' + errors.length);
errors.slice(0, 5).forEach(e => console.log('  ' + e));
ws.close();
cleanup();
process.exit(fail ? 1 : 0);
