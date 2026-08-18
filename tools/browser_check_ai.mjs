// v17.0 真实浏览器验证：无头 Chrome 打开单文件，模拟 DeepSeek 返回，
// 走通 AI 设置/深度体检/一键优化/逐条确认/版本恢复，并收集控制台错误。
// 运行：node tools/browser_check_ai.mjs
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
const userData = fs.mkdtempSync(path.join(os.tmpdir(), 'prd-cdp-ai-'));
function psExec(cmd) { return execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', cmd], { encoding: 'utf8', windowsHide: true }).trim(); }
let browserPid = -1;
try {
  browserPid = parseInt(psExec(`$p = Start-Process -FilePath '${browserExe}' -ArgumentList @('--headless=new','--disable-gpu','--no-first-run','--disable-extensions','--no-sandbox','--disable-breakpad','--disable-crash-reporter','--remote-debugging-port=${port}','--remote-allow-origins=*','--user-data-dir=${userData}','--window-size=1280,900','about:blank') -PassThru -WindowStyle Hidden; Write-Output $p.Id`), 10);
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
const errors = [];
ws.onmessage = ev => {
  const m = JSON.parse(ev.data);
  if (m.id && pend.has(m.id)) { const p = pend.get(m.id); pend.delete(m.id); m.error ? p.rej(new Error(JSON.stringify(m.error))) : p.res(m.result); }
  else if (m.method === 'Runtime.exceptionThrown' || (m.method === 'Runtime.consoleAPICalled' && ['error','warning'].includes(m.params.type))) {
    errors.push(m.method + ': ' + JSON.stringify(m.params).slice(0, 400));
  }
};
function send(method, params) {
  return new Promise((res, rej) => {
    const id = ++msgId;
    pend.set(id, { res, rej });
    ws.send(JSON.stringify({ id, method, params }));
  });
}
async function evalJs(expr) {
  const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) throw new Error('EVAL_ERR: ' + JSON.stringify(r.exceptionDetails).slice(0, 500));
  return r.result && r.result.value;
}

await send('Page.enable');
await send('Runtime.enable');
await send('Page.navigate', { url: 'file:///E:/vibecoding/prd_assistant/PRD智能看板.html' });
await new Promise(r => setTimeout(r, 3500));

let pass = 0, fail = 0;
function check(name, cond, detail) { if (cond) { pass++; console.log('PASS  ' + name); } else { fail++; console.log('FAIL  ' + name + '  >>> ' + detail); } }

try {
  // ---------- 1. 注入与设置页 ----------
  const boot = await evalJs(`(()=>{
    const out={};
    out.ctrl = typeof window.__AICtrl==='object';
    out.panel = !!document.getElementById('aiPanel');
    out.btnAi = !!document.getElementById('btnAi');
    out.sidebar = !!document.getElementById('aiSidebarBtn');
    out.tabAI = !!document.getElementById('tabAI');
    return out;
  })()`);
  check('browser AI 控制器已注入', boot.ctrl, JSON.stringify(boot));
  check('browser AI 面板/顶栏/侧栏/设置tab 就位', boot.panel && boot.btnAi && boot.sidebar && boot.tabAI, JSON.stringify(boot));

  await evalJs(`(()=>{ if(typeof openSettings==='function')openSettings('ai'); return true; })()`);
  await new Promise(r => setTimeout(r, 300));
  const tab = await evalJs(`(()=>{
    const el=document.getElementById('tabAI');
    return {visible: el && el.style.display!=='none', hasKey: !!document.getElementById('aiKey'), hasBase: !!document.getElementById('aiBaseUrl')};
  })()`);
  check('browser 设置 AI tab 可打开', tab.visible && tab.hasKey && tab.hasBase, JSON.stringify(tab));

  // ---------- 2. 保存设置（Key 走独立键） ----------
  await evalJs(`(()=>{
    const el=document.getElementById('aiKey'); if(el)el.value='sk-browser-test-001';
    const b=document.querySelector('[data-ai="savesettings"]'); if(b)b.click();
    return true;
  })()`);
  await new Promise(r => setTimeout(r, 300));
  const keyCheck = await evalJs(`(()=>({
    inSettings: (localStorage.getItem('prdKanbanAiSettings')||'').indexOf('sk-browser-test-001')>=0,
    inState: (localStorage.getItem('prdKanbanStateV3')||'').indexOf('sk-browser-test-001')<0
  }))()`);
  check('browser Key 存独立键且不进 STATE', keyCheck.inSettings && keyCheck.inState, JSON.stringify(keyCheck));

  // ---------- 3. 建项目 + 模拟 DeepSeek（SSE 流式桩） ----------
  await evalJs(`(()=>{
    if(typeof createProject==='function'){ createProject('AI 浏览器回归', null); }
    const p=currentProj();
    if(p){ p.data.purpose={html:'<p>目标：提升转化率</p>',cards:[]}; p.data.accept={items:[{text:'通过',status:'pass',id:'a1'}],cards:[]}; p.data.feat={items:[{name:'A',desc:'x',priority:'P0',status:'草稿'}],cards:[]}; }
    if(typeof render==='function')render();
    const score70 = '{"summary":"整体尚可","dimensions":[{"id":"completeness","name":"完整性","score":70,"note":"目标未量化","issues":[{"sectionId":"purpose","severity":"high","reason":"缺量化指标","quote":"目标：提升转化率","suggestion":"补指标"}]},{"id":"clarity","name":"清晰度","score":80,"note":"","issues":[]},{"id":"consistency","name":"一致性","score":90,"note":"","issues":[]},{"id":"executability","name":"可执行性","score":60,"note":"","issues":[]},{"id":"verifiability","name":"可验证性","score":75,"note":"","issues":[]},{"id":"risk","name":"风险","score":85,"note":"","issues":[]}]}';
    const opt = '{"changes":[{"sectionId":"purpose","type":"text","edits":[{"op":"replaceBlock","match":"目标：提升转化率","newHtml":"<p>新目标：转化率 ≥ 5%（量化）</p>"}]}],"summary":"补量化指标"}';
    const review91 = '{"score":91,"verdict":"pass","newIssues":[],"summary":"复核通过"}';
    window.__aiQ=[score70,opt,review91];
    window.__origFetch=window.fetch;
    window.fetch=(u,o)=>{
      const content=window.__aiQ.length?window.__aiQ.shift():'{}';
      const enc=new TextEncoder();
      const bytes=enc.encode('data: '+JSON.stringify({choices:[{delta:{content}}]})+'\\n\\ndata: [DONE]\\n\\n');
      let pos=0;
      return Promise.resolve({ok:true,status:200,json:()=>Promise.resolve({choices:[{message:{content}}]}),body:{getReader(){return {read(){if(pos>=bytes.length)return Promise.resolve({done:true});const s=bytes.slice(pos,pos+64);pos+=64;return Promise.resolve({done:false,value:s});}};}}});
    };
    return true;
  })()`);

  // ---------- 4. 深度体检 ----------
  await evalJs(`(()=>{ if(window.__AICtrl)window.__AICtrl.openPanel(); return true; })()`);
  await evalJs(`(()=>{ const b=document.querySelector('[data-ai="score"]'); if(b)b.click(); return true; })()`);
  await new Promise(r => setTimeout(r, 2500));
  await evalJs(`(()=>{ const d=document.querySelector('[data-ai="dimtoggle"][data-did="completeness"]'); if(d)d.click(); return true; })()`);
  await new Promise(r => setTimeout(r, 300));
  const scoreUi = await evalJs(`(()=>{
    const body=document.getElementById('aiBody')||{};
    const txt=body.textContent||'';
    const st=window.__AICtrl._test.state();
    return {total76: txt.indexOf('76')>=0, hasIssues: txt.indexOf('缺量化指标')>=0, last: st.lastReport?st.lastReport.total:'null', first: txt.slice(0,100)};
  })()`);
  check('browser 深度体检渲染 76 分与问题', scoreUi.total76 && scoreUi.hasIssues, JSON.stringify(scoreUi));

  // ---------- 5. 一键优化 → 待确认 → 全部接受 → 写入 ----------
  await evalJs(`(()=>{
    const opt = '{"changes":[{"sectionId":"purpose","type":"text","edits":[{"op":"replaceBlock","match":"目标：提升转化率","newHtml":"<p>新目标：转化率 ≥ 5%（量化）</p>"}]}],"summary":"补量化指标"}';
    const review91 = '{"score":91,"verdict":"pass","newIssues":[],"summary":"复核通过"}';
    window.__aiQ=[opt,review91];
    return true;
  })()`);
  await evalJs(`(()=>{ const b=document.querySelector('[data-ai="optimize"]'); if(b)b.click(); return true; })()`);
  await new Promise(r => setTimeout(r, 300));
  await evalJs(`(()=>{ const b=document.querySelector('[data-ai="optstart"]'); if(b)b.click(); return true; })()`);
  await new Promise(r => setTimeout(r, 4000));
  const pendingUi = await evalJs(`(()=>{
    const body=document.getElementById('aiBody')||{};
    const txt=body.textContent||'';
    const st=window.__AICtrl._test.state();
    return {pending: txt.indexOf('待确认修改')>=0, review: txt.indexOf('独立复核')>=0, oldText: txt.indexOf('提升转化率')>=0, newText: txt.indexOf('5%')>=0, pd: st.pendingDiffs?JSON.stringify(st.pendingDiffs).slice(0,400):null, txt: txt.slice(0,300)};
  })()`);
  check('browser 待确认 Diff 渲染（独立复核+old/new）', pendingUi.pending && pendingUi.review && pendingUi.oldText && pendingUi.newText, JSON.stringify(pendingUi));
  const jumpUi = await evalJs(`(()=>{
    const el=document.querySelector('.ai-jump[data-ai="jumpblock"]');
    if(!el)return {ok:false,note:'no jump element'};
    el.click();
    return {ok:true,clicked:true};
  })()`);
  check('browser 原文可点击跳转（Diff 定位）', jumpUi.ok===true, JSON.stringify(jumpUi));
  await evalJs(`(()=>{ const b=document.querySelector('.ai-diff-act [data-ai="accept"]'); if(!b)return false; b.click(); return true; })()`);
  await new Promise(r => setTimeout(r, 800));
  const applied = await evalJs(`(()=>{
    const p=currentProj();
    const html=p?p.data.purpose.html:'';
    const dom=(document.querySelector('#sec-purpose .editable')||{}).textContent||'';
    const st=window.__AICtrl._test.state();
    return {written: (html||'').indexOf('5%')>=0, domShown: dom.indexOf('5%')>=0, versions: st.versions.length, scoreAfter: st.versions[0]&&st.versions[0].scoreAfter};
  })()`);
  check('browser 单个接受：正文立即变化（数据+可见DOM）并归档版本', applied.written && applied.domShown && applied.versions===1 && applied.scoreAfter===91, JSON.stringify(applied));

  // ---------- 6. 版本恢复（安全快照 + 倒序回放） ----------
  const restore = await evalJs(`(async()=>{
    const st=window.__AICtrl._test.state();
    const vid=st.versions[0].id;
    const p=currentProj();
    p.data.purpose.html='<p>用户手改内容</p>';
    try{window.__AICtrl.restoreToVersion(vid);}catch(e){return {err:String(e)};}
    await new Promise(r=>setTimeout(r,600));
    const st2=window.__AICtrl._test.state();
    return {html:p.data.purpose.html, versions:st2.versions.length, lastKind:st2.versions[st2.versions.length-1].kind};
  })()`);
  check('browser 恢复到 v1 并生成安全快照', (restore.html||'').indexOf('5%')>=0 && restore.versions===2 && restore.lastKind==='human', JSON.stringify(restore));

  // ---------- 7. v17.2 结构对齐：错位提示 + 确认搬移 + 撤销 ----------
  await evalJs(`(()=>{
    const p=currentProj();
    if(p){ p.data.other={html:'<p>错位浏览器内容甲：这是导入后未归位的整段背景描述，用于触发错位提示</p><p>错位浏览器内容乙：补充占位</p>',cards:[]}; }
    if(typeof render==='function')render();
    return true;
  })()`);
  const hintLv = await evalJs(`(()=>{ const h=window.__AICtrl._test.alignHint(); return {level:h.level,reasons:h.reasons}; })()`);
  check('browser 错位检测触发高风险', hintLv.level==='high', JSON.stringify(hintLv));
  await evalJs(`(()=>{
    const alignJson='{"moves":[{"fromSection":"other","match":"错位浏览器内容甲：这是导入后未归位的整段背景描述，用于触发错位提示","toSection":"purpose","position":"end"}],"suggestions":[],"summary":"搬回目的节"}';
    window.__aiQ=[alignJson];
    return true;
  })()`);
  await evalJs(`(()=>{ const b=document.querySelector('[data-ai="align"]'); if(b)b.click(); return true; })()`);
  await new Promise(r => setTimeout(r, 3000));
  const alignUi = await evalJs(`(()=>{
    const body=document.getElementById('aiBody')||{};
    const txt=body.textContent||'';
    const p=currentProj();
    return {pending: txt.indexOf('结构对齐建议')>=0, moved: txt.indexOf('错位浏览器内容甲')>=0, inPurpose:(p.data.purpose.html||'').indexOf('错位浏览器内容甲')>=0};
  })()`);
  check('browser 结构对齐建议渲染', alignUi.pending && alignUi.moved && !alignUi.inPurpose, JSON.stringify(alignUi));
  await evalJs(`(()=>{ const b=document.querySelector('[data-ai="align-all"]'); if(b)b.click(); return true; })()`);
  await new Promise(r => setTimeout(r, 800));
  const alignApplied = await evalJs(`(()=>{
    const p=currentProj();
    const st=window.__AICtrl._test.state();
    const av=st.versions.filter(v=>String(v.label||'').indexOf('结构对齐')===0).pop();
    return {inPurpose:(p.data.purpose.html||'').indexOf('错位浏览器内容甲')>=0, inOther:(p.data.other.html||'').indexOf('错位浏览器内容甲')<0, version:!!av, vid:av?av.id:null};
  })()`);
  check('browser 确认后内容搬移并生成版本', alignApplied.inPurpose && alignApplied.inOther && alignApplied.version, JSON.stringify(alignApplied));
  await evalJs(`(()=>{ const p=currentProj(); const st=window.__AICtrl._test.state(); const av=st.versions.filter(v=>String(v.label||'').indexOf('结构对齐')===0).pop(); if(av)window.__AICtrl.restoreToVersion(av.id); return true; })()`);
  await new Promise(r => setTimeout(r, 600));
  const alignUndo = await evalJs(`(()=>{ const p=currentProj(); return {inOther:(p.data.other.html||'').indexOf('错位浏览器内容甲')>=0, inPurpose:(p.data.purpose.html||'').indexOf('错位浏览器内容甲')<0}; })()`);
  check('browser 撤销结构对齐（搬回原位）', alignUndo.inOther && alignUndo.inPurpose, JSON.stringify(alignUndo));

  // ---------- 8. 规则引擎未被破坏（红黄绿仍可用） ----------
  const engine = await evalJs(`(()=>{ if(typeof runHealth==='function'){const h=runHealth();return h?{completion:h.metrics.completion,risk:h.metrics.risk}:null;} return null; })()`);
  check('browser 规则引擎并存可用', !!engine && typeof engine.completion==='number', JSON.stringify(engine));

  // ---------- 9. v17.3 停止 AI（挂起请求 + abort） ----------
  await evalJs(`(()=>{
    window.__aiQ=[];
    window.__hangFetch=(u,o)=>{
      return new Promise((res,rej)=>{
        if(o&&o.signal){ if(o.signal.aborted){rej(new DOMException('Aborted','AbortError'));return;} o.signal.addEventListener('abort',()=>rej(new DOMException('Aborted','AbortError'))); }
      });
    };
    window.fetch=window.__hangFetch;
    return true;
  })()`);
  await evalJs(`(()=>{ const b=document.querySelector('[data-ai="score"]'); if(b)b.click(); return true; })()`);
  await new Promise(r => setTimeout(r, 400));
  const stopUi = await evalJs(`(()=>({hasStop:(document.getElementById('aiBody').textContent||'').indexOf('停止')>=0, busy:window.__AICtrl.isBusy()}))()`);
  check('browser 运行中显示停止按钮', stopUi.hasStop && stopUi.busy===true, JSON.stringify(stopUi));
  await evalJs(`(()=>{ window.__AICtrl.stop(); return true; })()`);
  await new Promise(r => setTimeout(r, 250));
  const stopped = await evalJs(`(()=>window.__AICtrl.isBusy())()`);
  check('browser 停止后 busy=false', stopped===false, String(stopped));

  // ---------- 10. v17.3 自动调整 ops：改名 + 删空节（渲染→执行→撤销） ----------
  await evalJs(`(()=>{
    const p=currentProj();
    if(p){ p.data.launch={html:'',cards:[]}; p.data.purpose={html:'<p>目的内容</p>',cards:[]}; }
    const ui=STATE.framework.find(s=>s.id==='ui'); if(ui)ui.required=false;
    window.fetch=(u,o)=>{
      const content=window.__aiQ.length?window.__aiQ.shift():'{}';
      const enc=new TextEncoder();
      const bytes=enc.encode('data: '+JSON.stringify({choices:[{delta:{content}}]})+'\\n\\ndata: [DONE]\\n\\n');
      let pos=0;
      return Promise.resolve({ok:true,status:200,json:()=>Promise.resolve({choices:[{message:{content}}]}),body:{getReader(){return {read(){if(pos>=bytes.length)return Promise.resolve({done:true});const s=bytes.slice(pos,pos+64);pos+=64;return Promise.resolve({done:false,value:s});}};}}});
    };
    const opsJson='{"ops":[{"op":"rename","sectionId":"purpose","newTitle":"产品目标"},{"op":"deleteEmpty","sectionId":"ui"}],"suggestions":[],"summary":"ops 浏览器测试"}';
    window.__aiQ=[opsJson];
    return true;
  })()`);
  await evalJs(`(()=>{ const b=document.querySelector('[data-ai="align"]'); if(b)b.click(); return true; })()`);
  await new Promise(r => setTimeout(r, 2500));
  const opsUi = await evalJs(`(()=>{
    const txt=document.getElementById('aiBody').textContent||'';
    return {rename:txt.indexOf('改名')>=0, delEmpty:txt.indexOf('删除空节')>=0};
  })()`);
  check('browser ops 建议渲染（改名/删空节）', opsUi.rename && opsUi.delEmpty, JSON.stringify(opsUi));
  await evalJs(`(()=>{ const b=document.querySelector('[data-ai="align-all"]'); if(b)b.click(); return true; })()`);
  await new Promise(r => setTimeout(r, 800));
  const opsApplied = await evalJs(`(()=>{
    const fw=STATE.framework;
    return {renamed:fw.some(s=>s.title==='产品目标'), uiGone:!fw.some(s=>s.id==='ui')};
  })()`);
  check('browser ops 执行生效', opsApplied.renamed && opsApplied.uiGone, JSON.stringify(opsApplied));
  await evalJs(`(()=>{
    const st=window.__AICtrl._test.state();
    const av=st.versions.filter(v=>String(v.label||'').indexOf('结构对齐')===0).pop();
    if(av)window.__AICtrl.restoreToVersion(av.id);
    return true;
  })()`);
  await new Promise(r => setTimeout(r, 600));
  const opsUndo = await evalJs(`(()=>({back:STATE.framework.some(s=>s.title==='目的'), uiBack:STATE.framework.some(s=>s.id==='ui')}))()`);
  check('browser ops 撤销还原', opsUndo.back && opsUndo.uiBack, JSON.stringify(opsUndo));
} catch (e) {
  fail++; console.log('FAIL  browser 脚本异常  >>> ' + (e && e.message || e));
}

console.log('\n浏览器断言：PASS=' + pass + ' FAIL=' + fail);
console.log('控制台错误/警告数：' + errors.length);
errors.slice(0, 6).forEach(e => console.log('  ' + e));
cleanup();
process.exit(fail ? 1 : 0);
