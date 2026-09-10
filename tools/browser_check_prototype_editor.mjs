// 原型编辑增强与主题适配回归：隔离本地浏览器，无 AI 网络请求。
// 运行：node tools/browser_check_web_export.mjs
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
  try { if (path.dirname(path.resolve(userData)) === path.resolve(os.tmpdir()) && path.basename(userData).startsWith('prd-dash-')) fs.rmSync(userData, { recursive: true, force: true }); } catch (e) {}
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
await new Promise(r => setTimeout(r, 3500));

let pass = 0, fail = 0;
function check(name, cond, detail) { if (cond) { pass++; console.log('PASS  ' + name); } else { fail++; console.log('FAIL  ' + name + '  >>> ' + detail); } }



try {
  const id=await evalJs(`(()=>{loadSample();const p=currentProj();p.prototype={revision:1,html:'<!doctype html><html><head><style>body{padding:40px;font-family:system-ui;background:#fff;color:#20243b}.card{padding:20px;border:1px solid #e2e5f1;border-radius:14px;margin:15px 0}</style></head><body><h1>编辑器回归示例</h1><section class="card"><h2 id="source" style="color:rgb(80,69,216);font-size:24px">品牌标题</h2><p>选择文字或区域，精确调整样式</p></section><div id="target" style="width:200px;height:80px;padding:10px;background:#f1f3fb">目标文案</div></body></html>'};save();return p.id;})()`);
  await send('Page.navigate',{url:new URL('../proto-req/prd.html?project='+id,import.meta.url).href});
  await new Promise(r=>setTimeout(r,900));
  for(const [theme,background] of [['brand','rgb(246, 247, 252)'],['light','rgb(250, 249, 247)'],['dark','rgb(45, 49, 58)'],['hc','rgb(0, 0, 0)']]){
    await evalJs(`localStorage.setItem('prdKanbanTheme','${theme}');window.dispatchEvent(new Event('focus'));`);
    check('workspace theme '+theme,await evalJs(`document.documentElement.dataset.theme==='${theme}'&&getComputedStyle(document.body).backgroundColor==='${background}'`));
  }
  check('shared logo asset',await evalJs(`document.querySelector('.tb-brand-logo img').getAttribute('src')===document.querySelector('link[rel="icon"]').getAttribute('href')`));
  await evalJs(`[...document.querySelectorAll('button')].find(b=>b.textContent==='进入编辑态').click()`);
  for(let i=0;i<30;i++){if(await evalJs(`!!document.querySelector('.ve-status')&&document.querySelector('.ve-status').textContent==='已保存'`))break;await new Promise(r=>setTimeout(r,150));}
  check('editor actually loads Moveable',await evalJs(`!!document.querySelector('.ve-frame').contentWindow.Moveable&&document.querySelector('.ve-status').textContent==='已保存'`));
  check('single-row header and contextual empty state',await evalJs(`document.querySelector('.ve-topbar').getBoundingClientRect().height<80&&!document.querySelector('.ve-inspector-empty').hidden&&document.querySelector('.ve-contextbar').hidden`));
  check('canvas tools have independent dock',await evalJs(`!!document.querySelector('.ve-canvas-dock .ve-mode-switch')&&!document.querySelector('.ve-topbar .ve-mode-switch')`));
  const collapse=await evalJs(`(()=>{const before=document.querySelector('.ve-viewport').clientWidth;const b=document.querySelector('[aria-controls="ve-inspector"]');b.click();const closed=document.querySelector('.ve-inspector').hidden&&b.getAttribute('aria-expanded')==='false';const after=document.querySelector('.ve-viewport').clientWidth;b.click();return closed&&after>before&&!document.querySelector('.ve-inspector').hidden;})()`);
  check('collapsible inspector gives space back to canvas',collapse);
  check('inspector starts disabled',await evalJs(`[...document.querySelectorAll('[data-ve-property]')].every(el=>el.disabled)`));
  for(const [theme,panel] of [['brand','rgb(255, 255, 255)'],['dark','rgb(50, 55, 66)'],['hc','rgb(10, 10, 10)']]){
    await evalJs(`localStorage.setItem('prdKanbanTheme','${theme}');window.dispatchEvent(new StorageEvent('storage',{key:'prdKanbanTheme'}));`);
    check('editor surfaces follow '+theme,await evalJs(`getComputedStyle(document.querySelector('.ve-topbar')).backgroundColor==='${panel}'&&getComputedStyle(document.querySelector('.ve-properties')).backgroundColor==='${panel}'`));
  }
  await evalJs(`window.selectTest=id=>{const d=document.querySelector('.ve-frame').contentDocument;d.getElementById(id).dispatchEvent(new d.defaultView.MouseEvent('click',{bubbles:true}));};window.buttonTest=t=>[...document.querySelectorAll('.visual-editor button')].find(b=>b.textContent===t);selectTest('source');buttonTest('复制样式').click();selectTest('target');window.targetBefore=document.querySelector('.ve-frame').contentDocument.getElementById('target').style.width;buttonTest('粘贴样式').click();`);
  check('style brush preserves text and width',await evalJs(`(()=>{const f=document.querySelector('.ve-frame'),t=f.contentDocument.getElementById('target');return t.textContent==='目标文案'&&t.style.width===targetBefore&&f.contentWindow.getComputedStyle(t).color==='rgb(80, 69, 216)'})()`));
  await evalJs(`buttonTest('撤销').click()`);await new Promise(r=>setTimeout(r,400));
  check('style paste undo',await evalJs(`document.querySelector('.ve-frame').contentWindow.getComputedStyle(document.querySelector('.ve-frame').contentDocument.getElementById('target')).color==='rgb(32, 36, 59)'`));
  await evalJs(`buttonTest('重做').click()`);await new Promise(r=>setTimeout(r,400));
  check('style paste redo',await evalJs(`document.querySelector('.ve-frame').contentWindow.getComputedStyle(document.querySelector('.ve-frame').contentDocument.getElementById('target')).color==='rgb(80, 69, 216)'`));
  await evalJs(`selectTest('target');window.setField=(property,value)=>{const el=document.querySelector('[data-ve-property="'+property+'"]');el.focus();el.value=value;el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));el.blur();};setField('width','320');setField('padding','24');setField('borderRadius','18');`);
  check('precise width spacing radius',await evalJs(`(()=>{const t=document.querySelector('.ve-frame').contentDocument.getElementById('target');return t.style.width==='320px'&&t.offsetWidth===320&&t.style.padding==='24px'&&t.style.borderRadius==='18px'})()`));
  await evalJs(`setField('width','-10')`);
  check('negative width clamps to minimum',await evalJs(`document.querySelector('.ve-frame').contentDocument.getElementById('target').style.width==='1px'`));
  await evalJs(`setField('width','320');document.querySelector('.ve-frame').contentDocument.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',altKey:true,shiftKey:true,bubbles:true}));`);
  check('Alt Shift Arrow changes size by ten',await evalJs(`document.querySelector('.ve-frame').contentDocument.getElementById('target').style.width==='330px'`));
  await evalJs(`localStorage.setItem('prdKanbanTheme','brand');window.dispatchEvent(new Event('focus'));`);
  await new Promise(r=>setTimeout(r,250));
  await send('Page.captureScreenshot',{format:'png'}).then(r=>fs.writeFileSync(path.join(os.tmpdir(),'prd-editor-brand-qa.png'),Buffer.from(r.data,'base64')));
  await evalJs(`buttonTest('完成编辑').click()`);await new Promise(r=>setTimeout(r,300));
  const saved=await evalJs(`Store.exportAll().pages.find(p=>p.prototype_content&&p.prototype_content.includes('目标文案')).prototype_content`);
  check('saved HTML includes edits, excludes editor chrome',saved.includes('330px')&&saved.includes('border-radius: 18px')&&!saved.includes('data-pr-editor')&&!saved.includes('ve-properties')&&!saved.includes('moveable-control-box'));
  await send('Page.reload');await new Promise(r=>setTimeout(r,600));
  const persisted=await evalJs(`Store.exportAll().pages.find(p=>p.prototype_content&&p.prototype_content.includes('目标文案')).prototype_content`);
  check('edits persist after reopening workspace',persisted.includes('330px')&&persisted.includes('border-radius: 18px'));
  await send('Page.captureScreenshot',{format:'png'}).then(r=>fs.writeFileSync(path.join(os.tmpdir(),'prd-workspace-brand-qa.png'),Buffer.from(r.data,'base64')));
  check('brand theme persists after reload',await evalJs(`document.documentElement.dataset.theme==='brand'`));
  await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
  await evalJs(`[...document.querySelectorAll('button')].find(b=>b.textContent==='进入编辑态').click()`);
  await new Promise(r=>setTimeout(r,500));
  check('narrow editor starts with collapsed properties and fits viewport',await evalJs(`document.querySelector('.ve-inspector').hidden&&document.querySelector('.visual-editor').getBoundingClientRect().width<=window.innerWidth&&document.querySelector('.ve-topbar').scrollWidth<=window.innerWidth`));
  await evalJs(`document.querySelector('[aria-controls="ve-inspector"]').click()`);
  check('narrow properties can be opened and closed',await evalJs(`(()=>{const panel=document.querySelector('.ve-inspector');const open=!panel.hidden&&panel.getBoundingClientRect().right<=window.innerWidth;document.querySelector('[aria-label="收起属性面板"]').click();return open&&panel.hidden;})()`));
  check('no browser exceptions',!errors.some(e=>e.startsWith('Runtime.exceptionThrown')),errors.join('\n'));
} catch(e){fail++;console.log('FAIL',e.message);}
console.log({pass,fail});ws.close();cleanup();process.exit(fail?1:0);
