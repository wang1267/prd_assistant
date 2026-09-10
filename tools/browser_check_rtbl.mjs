// v17.21 浏览器端到端：富文本表格列宽持久化（拖拽→落盘→刷新→列/行操作后宽度继承）
// 运行：node tools/browser_check_rtbl.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const appUrl = new URL('../PMHub.html', import.meta.url).href;
const browserExe = ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Google/Chrome/Application/chrome.exe'].find(p => fs.existsSync(p));
if (!browserExe) { console.log('NO_BROWSER'); process.exit(2); }
const port = 11600 + Math.floor(Math.random() * 100);
const userData = fs.mkdtempSync(path.join(os.tmpdir(), 'prd-rtbl-'));
function psExec(cmd) { return execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', cmd], { encoding: 'utf8', windowsHide: true }).trim(); }
let browserPid = -1;
try { browserPid = parseInt(psExec(`$p = Start-Process -FilePath '${browserExe}' -ArgumentList @('--headless=new','--disable-gpu','--no-first-run','--disable-extensions','--no-sandbox','--disable-breakpad','--disable-crash-reporter','--remote-debugging-port=${port}','--remote-allow-origins=*','--user-data-dir=${userData}','--window-size=1280,900','about:blank') -PassThru -WindowStyle Hidden; Write-Output $p.Id`), 10); } catch (e) { console.log('LAUNCH_FAIL'); process.exit(2); }
function cleanup() { try { if (browserPid > 0) psExec(`Stop-Process -Id ${browserPid} -Force -ErrorAction SilentlyContinue`); } catch (e) {} try { fs.rmSync(userData, { recursive: true, force: true }); } catch (e) {} }
let target;
for (let i = 0; i < 80; i++) { await new Promise(r => setTimeout(r, 250)); try { const l = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); target = l.find(t => t.type === 'page'); if (target) break; } catch (e) {} }
if (!target) { console.log('NO_CDP_TARGET'); cleanup(); process.exit(2); }
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
let id = 0; const pend = new Map(); const errors = [];
ws.onmessage = ev => { const m = JSON.parse(ev.data); if (m.id && pend.has(m.id)) { const p = pend.get(m.id); pend.delete(m.id); m.error ? p.j(new Error(JSON.stringify(m.error))) : p.r(m.result); } else if (m.method === 'Runtime.exceptionThrown' || (m.method === 'Runtime.consoleAPICalled' && ['error','warning'].includes(m.params.type))) { errors.push(m.method + ': ' + JSON.stringify(m.params).slice(0, 300)); } };
function send(method, params) { return new Promise((r, j) => { const i = ++id; const t = setTimeout(() => { pend.delete(i); j(new Error('TO ' + method)); }, 8000); pend.set(i, { r: v => { clearTimeout(t); r(v); }, j: e => { clearTimeout(t); j(e); } }); ws.send(JSON.stringify({ id: i, method, params })); }); }
async function ev(expr) { const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }); if (r.exceptionDetails) throw new Error('EVAL ' + JSON.stringify(r.exceptionDetails).slice(0, 600)); return r.result && r.result.value; }
await send('Page.enable'); await send('Runtime.enable');
await send('Page.navigate', { url: appUrl }); await new Promise(r => setTimeout(r, 3500));

let pass = 0, fail = 0;
function check(name, cond, detail) { if (cond) { pass++; console.log('PASS  ' + name); } else { fail++; console.log('FAIL  ' + name + '  >>> ' + detail); } }

try {
  await ev(`(()=>{
    createProject('RTBL',null);
    const p=currentProj();
    p.data.purpose={html:'<table><thead><tr><th style="width:100px">A</th><th style="width:150px">B</th></tr></thead><tbody><tr><td style="width:100px">1</td><td style="width:150px">2</td></tr></tbody></table>',cards:[]};
    render();
    return true;
  })()`);
  await new Promise(r => setTimeout(r, 400));
  const afterRender = await ev(`(()=>{
    const t=document.querySelector('#sec-purpose table');
    return {cols: t?t.rows[0].cells.length:0, w0: t?t.rows[0].cells[0].style.width:'', w1: t?t.rows[0].cells[1].style.width:''};
  })()`);
  check('rtbl 渲染：两列带内联宽度', afterRender.cols===2 && afterRender.w0==='100px' && afterRender.w1==='150px', JSON.stringify(afterRender));

  // 模拟拖拽改宽并落盘
  await ev(`(()=>{ const t=document.querySelector('#sec-purpose table'); Array.from(t.rows).forEach(tr=>{tr.cells[0].style.width='300px';}); saveTblLayout(t); return true; })()`);
  await new Promise(r => setTimeout(r, 300));
  const afterDrag = await ev(`(()=>{ const h=(currentProj().data.purpose.html||''); return {has300: h.indexOf('width: 300px')>=0}; })()`);
  check('rtbl 拖拽改宽后落盘（html 含 width: 300px）', afterDrag.has300===true, JSON.stringify(afterDrag));

  // 刷新页面 → 宽度保留
  await send('Page.navigate', { url: appUrl }); await new Promise(r => setTimeout(r, 3500));
  const afterReload = await ev(`(()=>{
    const p=currentProj(); if(!p)return {none:true};
    const h=p.data.purpose.html||'';
    const t=document.querySelector('#sec-purpose table');
    return {has300: h.indexOf('width: 300px')>=0, w0: t?t.rows[0].cells[0].style.width:''};
  })()`);
  check('rtbl 刷新后列宽保留', afterReload.has300 && afterReload.w0==='300px', JSON.stringify(afterReload));

  // 插入列 → 新列继承相邻宽度、表头用 <th>、旧列宽不动
  await ev(`(()=>{
    const t=document.querySelector('#sec-purpose table');
    const ed=document.querySelector('#sec-purpose .editable');
    doTblOp('ins-col-right',{table:t,rowIdx:0,colIdx:1,sec:null,ed:ed,isSec:false});
    return true;
  })()`);
  await new Promise(r => setTimeout(r, 300));
  const afterOp = await ev(`(()=>{
    const t=document.querySelector('#sec-purpose table');
    const h=(currentProj().data.purpose.html||'');
    const c2=t.rows[0].cells[2];
    return {cols: t.rows[0].cells.length, isTh: c2.tagName==='TH', w2: c2.style.width, offset: c2.offsetWidth, oldW0: t.rows[0].cells[0].style.width, saved: h.indexOf('style="width: 150px;"')>=0};
  })()`);
  check('rtbl 插列：新列继承相邻宽(150px)+表头<th>+非 17px 挤扁', afterOp.cols===3 && afterOp.isTh && afterOp.w2.indexOf('150px')>=0 && afterOp.offset>=90 && afterOp.oldW0==='300px', JSON.stringify(afterOp));

  // 插入行 → 新行复制列宽
  await ev(`(()=>{
    const t=document.querySelector('#sec-purpose table');
    const ed=document.querySelector('#sec-purpose .editable');
    doTblOp('ins-row-below',{table:t,rowIdx:1,colIdx:0,sec:null,ed:ed,isSec:false});
    return true;
  })()`);
  await new Promise(r => setTimeout(r, 300));
  const afterRow = await ev(`(()=>{
    const t=document.querySelector('#sec-purpose table');
    const newRow=t.rows[2];
    return {rows: t.rows.length, w0: newRow.cells[0].style.width, w1: newRow.cells[1].style.width};
  })()`);
  check('rtbl 插行：新行复制列宽', afterRow.rows===3 && afterRow.w0==='300px' && afterRow.w1==='150px', JSON.stringify(afterRow));

  // 浮动选区工具栏：行内格式只能作用于精确选区，块级格式不能误改整段
  await ev(`(()=>{
    const p=currentProj();
    p.data.purpose={html:'<p><span id="fmtPrefix">前缀</span> <span id="fmtTarget">只改这里</span> <span id="fmtSuffix">后缀</span></p>',cards:[]};
    render();
    const ed=document.querySelector('#sec-purpose .editable'),target=ed.querySelector('#fmtTarget');
    const range=document.createRange();range.selectNodeContents(target.firstChild);
    const sel=window.getSelection();sel.removeAllRanges();sel.addRange(range);document.dispatchEvent(new Event('selectionchange'));
    applyFmt('bold');
    const afterBold=ed.innerHTML;
    const suffix=ed.querySelector('#fmtSuffix');const range2=document.createRange();range2.selectNodeContents(suffix.firstChild);sel.removeAllRanges();sel.addRange(range2);document.dispatchEvent(new Event('selectionchange'));
    applyFmt('h2');
    return {afterBold,hasHeading:!!ed.querySelector('h2'),prefix:ed.querySelector('#fmtPrefix').innerHTML,suffix:ed.querySelector('#fmtSuffix').innerHTML,saved:(currentProj().data.purpose.html||'')};
  })()`);
  const fmt = await ev(`(()=>{ const ed=document.querySelector('#sec-purpose .editable'); return {target:ed.querySelector('#fmtTarget').innerHTML,prefix:ed.querySelector('#fmtPrefix').innerHTML,suffix:ed.querySelector('#fmtSuffix').innerHTML,hasHeading:!!ed.querySelector('h2'),saved:(currentProj().data.purpose.html||'')}; })()`);
  check('浮动工具栏：加粗仅修改选中文字，标题命令不再扩大为整段', /<(b|strong)>只改这里<\/(b|strong)>/i.test(fmt.target) && !/<(b|strong)>/i.test(fmt.prefix) && !/<(b|strong)>/i.test(fmt.suffix) && !fmt.hasHeading && fmt.saved.indexOf('只改这里')>=0, JSON.stringify(fmt));
} catch (e) {
  fail++; console.log('FAIL  browser 脚本异常  >>> ' + (e && e.message || e));
}

console.log('\n浏览器断言：PASS=' + pass + ' FAIL=' + fail);
console.log('控制台错误/警告数：' + errors.length);
errors.slice(0, 5).forEach(e => console.log('  ' + e));
ws.close();
cleanup();
process.exit(fail ? 1 : 0);
