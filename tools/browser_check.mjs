// 真实浏览器验证：无头 Chrome + CDP 打开单文件 HTML，实测评论气泡是否可见且定位正确
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

const port = 9333;
const winSize = process.argv[2] || '800,600';
const userData = fs.mkdtempSync(path.join(os.tmpdir(), 'prd-cdp-'));
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
  else if (m.method === 'Runtime.exceptionThrown' || (m.method === 'Runtime.consoleAPICalled' && ['error','warning'].includes(m.params.type))) {
    events.push(m.method + ': ' + JSON.stringify(m.params).slice(0, 500));
  }
};
function send(method, params) {
  return new Promise((res, rej) => {
    const id = ++msgId;
    pend.set(id, { res, rej });
    ws.send(JSON.stringify({ id, method, params }));
  });
}

await send('Page.enable');
await send('Runtime.enable');
await send('Page.navigate', { url: 'file:///E:/vibecoding/prd_assistant/PRD智能看板.html' });
await new Promise(r => setTimeout(r, 3000));

const expr = `(async()=>{
  const out={};
  try{
    out.FloatingUI=typeof window.FloatingUIDOM;
    if(typeof createProject==='function'){
      createProject('评论测试',null);
      const p=currentProj();
      p.data.purpose={html:'<p>这是正文，供评论测试。</p>',cards:[]};
      p.data.accept={items:[{text:'通过',status:'pass',id:'a1'}],cards:[]};
      p.data.feat={items:[{name:'A',desc:'x',priority:'P0',status:'草稿'}],cards:[]};
      render();
    }
    const ed=document.querySelector('.editable[data-id="purpose"]');
    out.hasEd=!!ed;
    const mk=document.createElement('mark');
    mk.className='cmt-hl'; mk.dataset.cid='t1'; mk.textContent='测试划线';
    if(ed)ed.appendChild(mk);
    if(typeof DATA!=='undefined'&&DATA.purpose){DATA.purpose.comments={t1:{text:'测试评论',by:'评审',at:Date.now()}};}
    try{mk.scrollIntoView({block:'center'});}catch(e){}
    if(window.__commentCtrl&&window.__commentCtrl.reveal)window.__commentCtrl.reveal(mk);
    await new Promise(r=>setTimeout(r,1200));
    const tip=document.querySelector('.cmt-tip');
    if(tip){
      const r=tip.getBoundingClientRect();
      out.tip={display:tip.style.display,left:tip.style.left,top:tip.style.top,rect:{x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height)},inView:r.top>=0&&r.bottom<=innerHeight};
    }else{out.tip=null;}
    out.scrollY=window.scrollY;
    return out;
  }catch(e){out.err=String(e&&e.stack||e);return out;}
})()`;

const res = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
console.log('RESULT:');
console.log(JSON.stringify(res.result && res.result.value, null, 2));

// 第二项：点击结构化表格 → 不应弹浮动条/右下角整体缩放角标
const expr2 = `(async()=>{
  const out={};
  try{
    const td=document.querySelector('.table-scroll td')||document.querySelector('.table-scroll');
    out.hasTbl=!!td;
    if(td)td.dispatchEvent(new MouseEvent('click',{bubbles:true}));
    await new Promise(r=>setTimeout(r,250));
    const bar=document.getElementById('mediaBar');
    const h=document.getElementById('imgResizeHandle');
    out.mediaBarDisplay=bar?bar.style.display:'no-bar';
    out.handleDisplay=h?h.style.display:'no-handle';
    return out;
  }catch(e){out.err=String(e&&e.stack||e);return out;}
})()`;
const res2 = await send('Runtime.evaluate', { expression: expr2, awaitPromise: true, returnByValue: true });
console.log('STRUCT_TABLE_RESULT:');
console.log(JSON.stringify(res2.result && res2.result.value, null, 2));

if (events.length) {
  console.log('PAGE_EVENTS:');
  events.slice(0, 10).forEach(e => console.log('  ' + e));
} else {
  console.log('PAGE_EVENTS: none');
}
ws.close();
cleanup();
