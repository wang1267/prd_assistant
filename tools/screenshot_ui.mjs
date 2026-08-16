// PRD 智能看板 · UI 截图工具（无头 Edge/Chrome + CDP）
// 用法：node tools/screenshot_ui.mjs [输出目录]
// 说明：沙箱内 node 直接 spawn 浏览器会崩，这里用 PowerShell Start-Process 拉起（-WindowStyle Hidden），node 只做 CDP 客户端。
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

const outDir = process.argv[2] || path.join(path.dirname(new URL(import.meta.url).pathname), 'ui_shots');
fs.mkdirSync(outDir, { recursive: true });

const port = 9600 + Math.floor(Math.random() * 300);
const userData = fs.mkdtempSync(path.join(os.tmpdir(), 'prd-ui-'));

function psExec(cmd) {
  return execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', cmd], { encoding: 'utf8', windowsHide: true }).trim();
}

const launchCmd =
  `$p = Start-Process -FilePath '${browserExe}' -ArgumentList @('--headless=new','--disable-gpu','--no-first-run','--disable-extensions','--no-sandbox','--disable-breakpad','--disable-crash-reporter','--remote-debugging-port=${port}','--remote-allow-origins=*','--user-data-dir=${userData}','--window-size=1440,960','about:blank') -PassThru -WindowStyle Hidden; Write-Output $p.Id`;
let browserPid = -1;
try { browserPid = parseInt(psExec(launchCmd), 10); } catch (e) { console.log('LAUNCH_FAIL ' + String(e.message || e)); process.exit(2); }

function cleanup() {
  try { if (browserPid > 0) psExec(`Stop-Process -Id ${browserPid} -Force -ErrorAction SilentlyContinue`); } catch (e) { /* ignore */ }
  try { fs.rmSync(userData, { recursive: true, force: true }); } catch (e) { /* ignore */ }
}

let target;
for (let i = 0; i < 80; i++) {
  await new Promise(r => setTimeout(r, 250));
  try {
    const list = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
    target = list.find(t => t.type === 'page');
    if (target) break;
  } catch (e) { /* retry */ }
}
if (!target) { console.log('NO_CDP_TARGET'); cleanup(); process.exit(2); }
console.log('target: ' + target.url + ' | ws: ' + String(target.webSocketDebuggerUrl).slice(0, 60));

const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((res, rej) => {
  const t = setTimeout(() => rej(new Error('WS_TIMEOUT')), 8000);
  ws.onopen = () => { clearTimeout(t); res(); };
  ws.onerror = e => { clearTimeout(t); rej(new Error('WS_ERROR ' + (e && e.message || ''))); };
});
let msgId = 0;
const pend = new Map();
ws.onmessage = ev => {
  const m = JSON.parse(ev.data);
  if (m.id && pend.has(m.id)) { const p = pend.get(m.id); pend.delete(m.id); m.error ? p.rej(new Error(JSON.stringify(m.error))) : p.res(m.result); }
};
ws.onopen = () => console.log('ws open, readyState=' + ws.readyState);
function send(method, params) {
  return new Promise((res, rej) => {
    const id = ++msgId;
    const t = setTimeout(() => { pend.delete(id); rej(new Error('SEND_TIMEOUT ' + method)); }, 5000);
    const origRes = res, origRej = rej;
    pend.set(id, { res: v => { clearTimeout(t); origRes(v); }, rej: e => { clearTimeout(t); origRej(e); } });
    ws.send(JSON.stringify({ id, method, params }));
  });
}
async function evalJs(expr) {
  const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) throw new Error('EVAL_ERR: ' + JSON.stringify(r.exceptionDetails).slice(0, 500));
  return r.result && r.result.value;
}
async function shot(name) {
  const r = await send('Page.captureScreenshot', { format: 'png' });
  const file = path.join(outDir, name + '.png');
  fs.writeFileSync(file, Buffer.from(r.data, 'base64'));
  console.log('SHOT ' + file);
}

try {
  await send('Page.enable');
  await send('Runtime.enable');
  const fileUrl = 'file:///' + encodeURI('E:/vibecoding/prd_assistant/PRD智能看板.html');
  await send('Page.navigate', { url: fileUrl });
  await new Promise(r => setTimeout(r, 3500));

  console.log('badge: ' + await evalJs(`(document.getElementById('vbadge')||{}).textContent || ''`));
  await shot('01_home');

  // 加载示例 PRD（顶栏按钮 data-act="sample"）
  await evalJs(`(()=>{ const b=document.querySelector('[data-act="sample"]'); if(!b)return false; b.click(); return true; })()`);
  await new Promise(r => setTimeout(r, 2500));
  const facts = await evalJs(`(()=>{
    const out={};
    out.theme = document.documentElement.getAttribute('data-theme')||'light';
    out.topbar = Array.from(document.querySelectorAll('#topbar button, .top-icon-btn')).map(b=>(b.textContent||'').trim()).filter(Boolean).slice(0,20);
    out.sections = Array.from(document.querySelectorAll('#content .section-card')).map(s=>{
      const id=s.id.replace('sec-','');
      const h=s.querySelector('.sec-head, .section-title, h2, h3');
      const color=s.querySelector('[data-act="ovmenu"]');
      return {id, title:(h?h.textContent:'').trim().slice(0,30), color:color?color.className.split(' ').find(c=>/^(ok|warn|bad|gray|red|yellow|green)/.test(c))||'':''};
    }).slice(0,25);
    out.dashboard = (document.querySelector('#dashboard, .dashboard, [class*=dashboard]')||{}).textContent ? 'present' : 'missing';
    out.aiPanel = !!document.getElementById('aiPanel');
    out.vbadge = (document.getElementById('vbadge')||{}).textContent||'';
    out.bodyLen = (document.body.textContent||'').length;
    return out;
  })()`);
  console.log('UI_FACTS ' + JSON.stringify(facts, null, 1));
  await shot('02_sample_editor');

  // 打开多项目总览
  await evalJs(`(()=>{ const b=document.querySelector('[data-act="toggleoverview"]'); if(b)b.click(); return true; })()`);
  await new Promise(r => setTimeout(r, 600));
  await shot('06_overview');
  await evalJs(`(()=>{ const b=document.querySelector('[data-act="ovclose"]'); if(b)b.click(); return true; })()`);

  // 打开 AI 面板
  await evalJs(`(()=>{ if(window.__AICtrl) window.__AICtrl.openPanel(); return true; })()`);
  await new Promise(r => setTimeout(r, 600));
  await shot('03_ai_panel');

  // 打开 AI 撰写弹窗
  await evalJs(`(()=>{ const b=document.querySelector('[data-ai="gen"]'); if(b)b.click(); return true; })()`);
  await new Promise(r => setTimeout(r, 600));
  await shot('05_ai_gen_modal');
  await evalJs(`(()=>{ const b=document.querySelector('[data-ai="genclose"]'); if(b)b.click(); return true; })()`);

  // 打开设置 → AI tab
  await evalJs(`(()=>{ try{ openSettings('ai'); }catch(e){ try{ openModal('settingsModal'); setSettingsTab('ai'); }catch(e2){} } return true; })()`);
  await new Promise(r => setTimeout(r, 600));
  await shot('04_settings_ai');
} catch (e) {
  console.log('SCRIPT_ERROR ' + String(e && e.message || e));
} finally {
  ws.close();
  cleanup();
}
console.log('DONE');
