// 联网与原型 HTML 导出回归：仅使用隔离浏览器与模拟响应，不调用付费服务。
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
  await evalJs(`localStorage.setItem('prdKanbanAiPrivacyAckV1',JSON.stringify({firstUse:true}));loadSample()`);
  await send('Page.reload');await new Promise(r=>setTimeout(r,800));
  await evalJs(`window.requests=[];window.mode='ok';window.realFetch=window.fetch;window.fetch=async function(url,opt){
    requests.push({url:String(url),headers:opt.headers,body:opt.body?JSON.parse(opt.body):null});
    if(mode==='abort')return new Promise((resolve,reject)=>{if(opt.signal.aborted)reject(new DOMException('Aborted','AbortError'));else opt.signal.addEventListener('abort',()=>reject(new DOMException('Aborted','AbortError')));});
    const json=(j,status=200)=>new Response(JSON.stringify(j),{status,headers:{'content-type':'application/json'}});
    if(String(url).includes('api.github.com'))return mode==='repoFail'?json({message:'rate limit'},403):json({items:[{full_name:'example/board',html_url:'https://github.com/example/board',description:'Board demo',language:'JavaScript',stargazers_count:42,pushed_at:'2026-09-01',license:{spdx_id:'MIT'}}]});
    if(String(url).endsWith('/web_search'))return json(mode==='empty'?{search_result:[]}:{search_result:[{title:'文档',link:'https://example.com/docs',content:'真实来源摘要'}]});
    if(String(url).includes('/services/aigc/'))return new Response('data: '+JSON.stringify({output:{search_info:{search_results:[{url:'https://example.com/qwen',title:'Qwen 来源'}]},choices:[{message:{content:[{text:'检索完成'}]}}]}})+'\\n\\n',{headers:{'content-type':'text/event-stream'}});
    if(String(url).endsWith('/responses'))return json({output:[{type:'message',content:[{text:'联网回答',annotations:[{type:'url_citation',url:'https://example.com/response',title:'实际来源'}]}]}]});
    const body=JSON.parse(opt.body),isQuery=body.messages[0].content.includes('GitHub 仓库搜索词');
    const content=isQuery?'{"query":"kanban board"}':'带来源回答 <action name="deleteSection" payload='+String.fromCharCode(39)+'{"title":"目的"}'+String.fromCharCode(39)+' />';
    if(body.stream)return new Response('data: '+JSON.stringify({choices:[{delta:{content:'普通回答'}}]})+'\\n\\ndata: [DONE]\\n\\n',{headers:{'content-type':'text/event-stream'}});
    return json({choices:[{message:{content}}]});
  };window.setConfig=(provider='custom',extra={})=>localStorage.setItem('prdKanbanAiSettings',JSON.stringify(Object.assign({provider,baseUrl:'https://chat.example/v1',apiKey:'TEST_CHAT_KEY',model:'example-model',web:true,webProvider:'zhipu',webApiKey:'TEST_SEARCH_KEY'},extra)));setConfig();`);
  const formCheck=await evalJs(`(()=>{openSettings('ai');const provider=document.getElementById('aiWebProvider'),key=document.getElementById('aiWebKey');if(!provider||!key)return false;provider.value='zhipu';key.value='TEST_SEARCH_FORM';document.querySelector('[data-ai="savesettings"]').click();const s=JSON.parse(localStorage.getItem('prdKanbanAiSettings'));document.querySelector('#settingsModal .x').click();setConfig();return s.webProvider==='zhipu'&&s.webApiKey==='TEST_SEARCH_FORM';})()`);
  check('independent search settings can be saved',formCheck);
  check('domestic chat providers can use independent search',await evalJs(`['doubao','moonshot','minimax','siliconflow','custom'].every(provider=>__AICtrl._test.webResearchAvailable({provider,baseUrl:'https://chat.example/v1',model:'example',apiKey:'TEST_CHAT_KEY',web:true,webProvider:'zhipu',webApiKey:'TEST_SEARCH_KEY'}))`));
  const sourceParse=await evalJs(`__AICtrl._test.webResponseSources({output:[{content:[{annotations:[{url_citation:{url:'https://example.com/a',title:'A'}}]}]}],search_info:{search_results:[{url:'https://example.com/b'},{url:'javascript:alert(1)'}]}})`);
  check('nested citations and Qwen sources; unsafe URLs excluded',sourceParse.length===2,JSON.stringify(sourceParse));
  const research=await evalJs(`__AICtrl._test.runWebResearch('做一个看板')`);
  check('web and GitHub results both retained',research.sources.length===2&&research.text.includes('MIT')&&research.text.includes('example/board'),JSON.stringify(research));
  const keys=await evalJs(`({github:requests.find(r=>r.url.includes('api.github.com')).headers,search:requests.find(r=>r.url.endsWith('/web_search')).headers,chat:requests.find(r=>r.url.endsWith('/chat/completions')).headers})`);
  check('separate keys; no credentials sent to GitHub',!keys.github.Authorization&&keys.search.Authorization==='Bearer TEST_SEARCH_KEY'&&keys.chat.Authorization==='Bearer TEST_CHAT_KEY');
  await evalJs(`requests=[];mode='empty'`);
  check('empty sources reject',await evalJs(`__AICtrl._test.runWebResearch('查一下',{repositories:false}).then(()=>false,e=>e.kind==='websource')`));
  await evalJs(`mode='repoFail'`);
  check('repository failure shown as partial',await evalJs(`__AICtrl._test.runWebResearch('开源看板').then(r=>r.partial&&r.text.includes('部分搜索未完成'))`));
  await evalJs(`mode='ok';setConfig('deepseek',{webProvider:'auto',baseUrl:'https://api.deepseek.com/v1',model:'deepseek-v4-flash'});requests=[]`);
  check('DeepSeek Responses sources',await evalJs(`__AICtrl._test.runWebResearch('搜索',{repositories:false}).then(r=>r.sources.length===1&&requests[0].url==='https://api.deepseek.com/responses')`));
  await evalJs(`setConfig('qwen',{webProvider:'auto',baseUrl:'https://dashscope.aliyuncs.com/compatible-mode/v1',model:'qwen3.5-plus'});requests=[]`);
  check('Qwen native streaming with sources',await evalJs(`__AICtrl._test.runWebResearch('搜索',{repositories:false}).then(r=>r.text==='检索完成'&&r.sources.length===1&&requests[0].url.includes('multimodal-generation')&&requests[0].body.parameters.search_options.enable_source)`));
  await evalJs(`setConfig();requests=[];window.beforeSections=STATE.framework.length`);
  await evalJs(`__AICtrl._test.chatSend('联网搜索最新看板产品')`);
  check('chat web sources rendered; no search actions executed',await evalJs(`(()=>{const m=__AICtrl._test.chatState().messages.at(-1);return m.sources.length===1&&!m.pending&&STATE.framework.length===beforeSections})()`));
  await evalJs(`requests=[];__AICtrl._test.chatSend('不要联网，解释一下目标')`);
  check('ordinary chat remains ordinary',await evalJs(`requests.every(r=>r.url.endsWith('/chat/completions'))`));
  await evalJs(`mode='abort';window.pendingChat=__AICtrl._test.chatSend('联网搜索天气');true`);
  await evalJs(`__AICtrl._test.chatState().abort.abort();pendingChat`);
  check('stop recovers chat controls',await evalJs(`!__AICtrl._test.chatState().busy&&__AICtrl._test.chatState().messages.at(-1).content.includes('已停止')`));
  await evalJs(`mode='ok';setConfig('custom',{web:false});requests=[];`);
  await evalJs(`__AICtrl._test.chatSend('联网搜索天气')`);
  check('disabled search gives actionable error without request',await evalJs(`requests.length===0&&__AICtrl._test.chatState().messages.at(-1).content.includes('设置')`));
  const projectId=await evalJs(`(()=>{const p=currentProj();p.prototype={revision:1,html:'<!doctype html><html><head><style>body{color:rgb(20,30,40)}</style></head><body><h1>原型导出测试</h1><script>alert(1)<'+ '/script><button onclick="alert(2)">保存</button></body></html>'};save();return p.id;})()`);
  await send('Page.navigate',{url:new URL('../proto-req/prd.html?project='+projectId,import.meta.url).href});
  await new Promise(r=>setTimeout(r,1300));
  const exportResult=await evalJs(`(async()=>{window.exportBlob=null;URL.createObjectURL=b=>{exportBlob=b;return 'blob:test'};HTMLAnchorElement.prototype.click=function(){window.downloadName=this.download;};const b=[...document.querySelectorAll('button')].find(b=>b.textContent==='导出 HTML');if(!b)return {missing:true,text:document.body.innerText.slice(0,300)};b.click();if(!exportBlob)return {noBlob:true};const html=await exportBlob.text();const d=new DOMParser().parseFromString(html,'text/html');return {name:downloadName,content:html.includes('原型导出测试'),charset:!!d.querySelector('meta[charset="utf-8"]'),viewport:!!d.querySelector('meta[name="viewport"]'),css:!!d.querySelector('style'),scripts:d.querySelectorAll('script,[onclick],[contenteditable]').length,csp:!!d.querySelector('meta[http-equiv="Content-Security-Policy"]'),recovered:!b.disabled};})()`);
  check('HTML downloads with Chinese content, styles, charset and viewport',exportResult.content&&exportResult.charset&&exportResult.viewport&&exportResult.css&&exportResult.name.endsWith('.html'),JSON.stringify(exportResult));
  check('HTML preserves prototype sandbox and removes scripts/editor state',exportResult.scripts===0&&exportResult.csp&&exportResult.recovered,JSON.stringify(exportResult));
  const standalone=await evalJs(`exportBlob.text()`);
  await send('Page.navigate',{url:'data:text/html;charset=utf-8,'+encodeURIComponent(standalone)});
  await new Promise(r=>setTimeout(r,250));
  check('exported HTML opens independently with styles',await evalJs(`document.querySelector('h1').textContent==='原型导出测试'&&getComputedStyle(document.body).color==='rgb(20, 30, 40)'`));
  check('no uncaught browser exceptions',!errors.some(e=>e.startsWith('Runtime.exceptionThrown')),errors.join('\n'));
} catch(e){fail++;console.log('FAIL',e.message);}
console.log({pass,fail});ws.close();cleanup();process.exit(fail?1:0);
