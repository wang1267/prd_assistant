// v17.15 浏览器端到端：AI 撰写草稿（打开面板→填写描述→模拟 AI 逐节返回→全部接受→正文变化→版本归档→恢复清空）
// 运行：node tools/browser_check_gen.mjs
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

const port = 10600 + Math.floor(Math.random() * 200);
const userData = fs.mkdtempSync(path.join(os.tmpdir(), 'prd-gen-'));
function psExec(cmd) {
  return execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', cmd], { encoding: 'utf8', windowsHide: true }).trim();
}
const launchCmd =
  `$p = Start-Process -FilePath '${browserExe}' -ArgumentList @('--headless=new','--disable-gpu','--no-first-run','--disable-extensions','--no-sandbox','--disable-breakpad','--disable-crash-reporter','--remote-debugging-port=${port}','--remote-allow-origins=*','--user-data-dir=${userData}','--window-size=1440,960','about:blank') -PassThru -WindowStyle Hidden; Write-Output $p.Id`;
let browserPid = -1;
try { browserPid = parseInt(psExec(launchCmd), 10); } catch (e) { console.log('LAUNCH_FAIL ' + String(e.message || e)); process.exit(2); }
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
  check('browser v17.1x 水印', /v17\.1[5-9]/.test(badge), badge);

  // 预置 AI 设置（Key 只进独立键）
  await evalJs(`(()=>{
    localStorage.setItem('prdKanbanAiSettings', JSON.stringify({provider:'custom',baseUrl:'https://api.deepseek.com/v1',model:'glm-4-flash',reviewModel:'',apiKey:'sk-e2e-gen-001',targetScore:85,maxRounds:3,dims:{completeness:{weight:25,enabled:true},clarity:{weight:20,enabled:true},consistency:{weight:15,enabled:true},executability:{weight:15,enabled:true},verifiability:{weight:15,enabled:true},risk:{weight:10,enabled:true}}}));
    return true;
  })()`);

  // 打开 AI 面板 → 点「AI 撰写」→ 弹窗出现
  await evalJs(`(()=>{ window.__AICtrl.openPanel(); return true; })()`);
  await evalJs(`(()=>{ const b=document.querySelector('[data-ai="gen"]'); if(!b)return false; b.click(); return true; })()`);
  await new Promise(r => setTimeout(r, 400));
  const modal = await evalJs(`(()=>{
    const m=document.getElementById('aiGenModal');
    return {open: m&&m.classList.contains('open'), hasName: !!document.getElementById('aiGenName'), hasDesc: !!document.getElementById('aiGenDesc'), fwOptions: document.querySelectorAll('#aiGenFw option').length};
  })()`);
  check('browser 撰写弹窗打开且含表单/框架选项', modal.open && modal.hasName && modal.hasDesc && modal.fwOptions >= 3, JSON.stringify(modal));

  // 填表 + 模拟 AI 返回（minimal 7 节，1 节失败）
  await evalJs(`(()=>{
    document.getElementById('aiGenName').value='端到端草稿';
    document.getElementById('aiGenDesc').value='为智能座舱新增免唤醒连续对话能力，支持一句话多意图、随时打断修正；目标：唤醒率≥95%、延迟≤1.5s、连续对话≥5轮。';
    document.getElementById('aiGenFw').value='minimal';
    document.getElementById('aiGenStyle').value='hardware';
    window.__aiQ=[
      JSON.stringify({html:'## 背景\\n本功能降低驾驶分心。'}),
      '{}',
      JSON.stringify({items:[{name:'免唤醒续指令',desc:'窗口内续指令',priority:'P0',status:'草稿'},{name:'多意图拆分',desc:'一句话拆多条',priority:'P1',status:'评审中'}]}),
      JSON.stringify({html:'性能：延迟≤1.5s；可用性≥99.5%。'}),
      JSON.stringify({items:[{text:'免唤醒连续对话≥5轮'},{text:'端到端延迟≤1.5s'}]}),
      JSON.stringify({html:'灰度 5% 三天后全量。'}),
      JSON.stringify({html:'无补充。'})
    ];
    window.__aiConsumed=[];
    window.__aiBodies=[];
    window.__origFetch=window.fetch;
    window.fetch=(u,o)=>{
      const content=window.__aiQ.length?window.__aiQ.shift():'{}';
      window.__aiConsumed.push(content.slice(0,60));
      if(o&&o.body)window.__aiBodies.push(JSON.parse(o.body));
      const enc=new TextEncoder();
      const bytes=enc.encode('data: '+JSON.stringify({choices:[{delta:{content}}]})+'\\n\\ndata: [DONE]\\n\\n');
      let pos=0;
      return Promise.resolve({ok:true,status:200,json:()=>Promise.resolve({choices:[{message:{content}}]}),body:{getReader(){return {read(){if(pos>=bytes.length)return Promise.resolve({done:true});const s=bytes.slice(pos,pos+64);pos+=64;return Promise.resolve({done:false,value:s});}};}}});
    };
    return true;
  })()`);
  await evalJs(`(()=>{ const b=document.querySelector('[data-ai="genstart"]'); if(!b)return false; b.click(); return true; })()`);
  await new Promise(r => setTimeout(r, 5000));

  const gen = await evalJs(`(()=>{
    const st=window.__AICtrl._test.state();
    const txt=document.getElementById('aiBody').textContent||'';
    return {gen: st.pendingDiffs&&st.pendingDiffs.gen===true, items: st.pendingDiffs?st.pendingDiffs.items.length:0, allOk: st.pendingDiffs&&st.pendingDiffs.items.every(i=>i.validation&&i.validation.ok), label: txt.indexOf('AI 撰写草稿')>=0, dbg: st.lastGenDebug?JSON.stringify(st.lastGenDebug).slice(0,600):'null'};
  })()`);
  check('browser 草稿生成：6 节待确认且全部校验通过', gen.gen && gen.items === 6 && gen.allOk && gen.label, JSON.stringify(gen));
  console.log('GEN_DEBUG ' + gen.dbg);
  console.log('CONSUMED ' + await evalJs(`JSON.stringify(window.__aiConsumed||[])`));
  const styled = await evalJs(`(()=>{
    const b=window.__aiBodies||[];
    const first=b[0]&&b[0].messages&&b[0].messages[0]&&b[0].messages[0].content||'';
    return {has: first.indexOf('【模板风格：智能硬件/车规】')>=0&&first.indexOf('功能安全等级')>=0, dbgStyle: (window.__AICtrl._test.state().lastGenDebug||{}).style||''};
  })()`);
  check('browser 撰写按硬件模板风格：请求注入风格约束', styled.has && styled.dbgStyle==='hardware', JSON.stringify(styled));

  // 全部接受 → 正文立即变化 + 版本归档
  await evalJs(`(()=>{ const b=document.querySelector('[data-ai="acceptall"]'); if(!b)return false; b.click(); return true; })()`);
  await new Promise(r => setTimeout(r, 1200));
  const applied = await evalJs(`(()=>{
    const st=window.__AICtrl._test.state();
    const dom=(document.querySelector('#sec-purpose .editable')||{}).textContent||'';
    const p=(window.__testProj||null);
    const v=st.versions[0];
    return {dom: dom.indexOf('驾驶分心')>=0, feat: document.querySelectorAll('#sec-feat tbody tr').length, ver: v&&v.label==='AI 草稿'&&v.kind==='ai'&&v.transform===true, itemsEntry: v&&Array.isArray(v.patch.feat)&&v.patch.feat[0].kind==='items'};
  })()`);
  check('browser 全部接受：正文变化+feat 2 行+版本 AI 草稿(transform)', applied.dom && applied.feat === 2 && applied.ver && applied.itemsEntry, JSON.stringify(applied));

  // 恢复 AI 草稿 → 正文清空（回到生成前空白）
  await evalJs(`(()=>{ const st=window.__AICtrl._test.state(); window.__AICtrl.restoreToVersion(st.versions[0].id); return true; })()`);
  await new Promise(r => setTimeout(r, 800));
  const restored = await evalJs(`(()=>{
    const dom=(document.querySelector('#sec-purpose .editable')||{}).textContent||'';
    const featRows=document.querySelectorAll('#sec-feat tbody tr').length;
    const st=window.__AICtrl._test.state();
    return {blank: dom.indexOf('驾驶分心')<0&&featRows===0, safety: st.versions[st.versions.length-1].kind==='human'};
  })()`);
  check('browser 恢复草稿：正文回到空白并生成安全快照', restored.blank && restored.safety, JSON.stringify(restored));
} catch (e) {
  fail++; console.log('FAIL  browser 脚本异常  >>> ' + (e && e.message || e));
}

console.log('\n浏览器断言：PASS=' + pass + ' FAIL=' + fail);
console.log('控制台错误/警告数：' + errors.length);
errors.slice(0, 5).forEach(e => console.log('  ' + e));
ws.close();
cleanup();
process.exit(fail ? 1 : 0);
