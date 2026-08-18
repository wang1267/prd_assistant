// 真实浏览器验证：插入表格弹窗网格是否 10×10 正常平铺（v16.8 修复"挤到一起"）
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const candidates = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  process.env.LOCALAPPDATA + '/Google/Chrome/Application/chrome.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
];
const browserExe = candidates.find(p => p && fs.existsSync(p));
if (!browserExe) { console.log('NO_BROWSER'); process.exit(2); }

const port = 9334;
const winSize = process.argv[2] || '1280,800';
const userData = fs.mkdtempSync(path.join(os.tmpdir(), 'prd-cdp-grid-'));
function psExec(cmd) { return execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', cmd], { encoding: 'utf8', windowsHide: true }).trim(); }
let browserPid = -1;
try {
  browserPid = parseInt(psExec(`$p = Start-Process -FilePath '${browserExe}' -ArgumentList @('--headless=new','--disable-gpu','--no-first-run','--disable-extensions','--no-sandbox','--disable-breakpad','--disable-crash-reporter','--remote-debugging-port=${port}','--remote-allow-origins=*','--user-data-dir=${userData}','--window-size=${winSize}','about:blank') -PassThru -WindowStyle Hidden; Write-Output $p.Id`), 10);
} catch (e) { console.log('LAUNCH_FAIL ' + String(e.message || e)); process.exit(2); }
function cleanup() {
  try { if (browserPid > 0) psExec(`Stop-Process -Id ${browserPid} -Force -ErrorAction SilentlyContinue`); } catch (e) {}
  try { fs.rmSync(userData, { recursive: true, force: true }); } catch (e) {}
}

let target;
for (let i = 0; i < 40; i++) {
  await new Promise(r => setTimeout(r, 250));
  try {
    const list = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
    target = list.find(t => t.type === 'page');
    if (target) break;
  } catch (e) { /* retry */ }
}
if (!target) { console.log('NO_CDP_TARGET'); cleanup(); process.exit(2); }

const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
let msgId = 0;
const pend = new Map();
const events = [];
ws.onmessage = ev => {
  const m = JSON.parse(ev.data);
  if (m.id && pend.has(m.id)) { const p = pend.get(m.id); pend.delete(m.id); m.error ? p.rej(new Error(JSON.stringify(m.error))) : p.res(m.result); }
  else if (m.method === 'Runtime.exceptionThrown') { events.push(JSON.stringify(m.params).slice(0, 400)); }
};
function send(method, params) {
  return new Promise((res, rej) => { const id = ++msgId; pend.set(id, { res, rej }); ws.send(JSON.stringify({ id, method, params })); });
}

await send('Page.enable');
await send('Runtime.enable');
await send('Page.navigate', { url: 'file:///E:/vibecoding/prd_assistant/PRD智能看板.html' });
await new Promise(r => setTimeout(r, 3000));

const expr = `(async()=>{
  const out={};
  try{
    if(typeof createProject==='function'){createProject('网格测试',null);const p=currentProj();p.data.purpose={html:'<p>正文</p>',cards:[]};render();}
    const ed=document.querySelector('.editable[data-id="purpose"]');
    openTblPicker(ed);
    await new Promise(r=>setTimeout(r,300));
    const grid=document.querySelector('[data-act="tblgrid"]');
    if(!grid){out.err='grid not found';return out;}
    const btns=grid.querySelectorAll('button');
    const gr=grid.getBoundingClientRect();
    const b0=btns[0].getBoundingClientRect();
    const b1=btns[1].getBoundingClientRect();
    const b10=btns[10].getBoundingClientRect();
    const b99=btns[99].getBoundingClientRect();
    return {btns:btns.length,gridW:Math.round(gr.width),gridH:Math.round(gr.height),
      btnW:Math.round(b0.width),btnH:Math.round(b0.height),
      stepX:Math.round(b1.x-b0.x),stepY:Math.round(b10.y-b0.y),
      lastInside: b99.right<=gr.right+1 && b99.bottom<=gr.bottom+1,
      selected: btns[0].className, at33: btns[3].className};
  }catch(e){out.err=String(e&&e.stack||e);return out;}
})()`;
const res = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
console.log('GRID_RESULT:');
console.log(JSON.stringify(res.result && res.result.value, null, 2));

// 截图整个弹窗区域
const shot = await send('Page.captureScreenshot', { format: 'png' });
if (shot.data) {
  const p = path.join(process.cwd(), 'tools', 'grid_check.png');
  fs.writeFileSync(p, Buffer.from(shot.data, 'base64'));
  console.log('SCREENSHOT: ' + p);
}
if (events.length) { console.log('PAGE_EVENTS: ' + events.slice(0, 5).join('\n')); } else { console.log('PAGE_EVENTS: none'); }
ws.close();
cleanup();
