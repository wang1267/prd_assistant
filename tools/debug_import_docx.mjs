// 复现：真实 .docx 导入 → 抓 extractDocText 输出 + 自动框架节数
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const candidates = ['C:/Program Files/Google/Chrome/Application/chrome.exe','C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',process.env.LOCALAPPDATA+'/Google/Chrome/Application/chrome.exe','C:/Program Files/Microsoft/Edge/Application/msedge.exe','C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'];
const browserExe = candidates.find(p => p && fs.existsSync(p));
if (!browserExe) { console.log('NO_BROWSER'); process.exit(2); }
const docx = 'D:/Users/xlq/Documents/【需求文档案例】贷款需求文档v1.3.2.docx';
if (!fs.existsSync(docx)) { console.log('NO_DOCX'); process.exit(2); }
const port = 9337;
const userData = fs.mkdtempSync(path.join(os.tmpdir(), 'prd-imp-'));
const proc = spawn(browserExe, ['--headless=new','--disable-gpu','--no-first-run','--disable-extensions','--remote-debugging-port='+port,'--user-data-dir='+userData,'--window-size=1000,800','about:blank'], { stdio: 'ignore' });
let target;
for (let i=0;i<40;i++){ await new Promise(r=>setTimeout(r,250)); try{ const list=await (await fetch(`http://127.0.0.1:${port}/json`)).json(); target=list.find(t=>t.type==='page'); if(target)break; }catch(e){} }
if(!target){ console.log('NO_TARGET'); proc.kill(); process.exit(2); }
const ws=new WebSocket(target.webSocketDebuggerUrl);
await new Promise((res,rej)=>{ws.onopen=res;ws.onerror=rej;});
let msgId=0; const pend=new Map();
ws.onmessage=ev=>{ const m=JSON.parse(ev.data); if(m.id&&pend.has(m.id)){ const p=pend.get(m.id); pend.delete(m.id); m.error?p.rej(new Error(JSON.stringify(m.error))):p.res(m.result); } };
function send(method,params){ return new Promise((res,rej)=>{ const id=++msgId; pend.set(id,{res,rej}); ws.send(JSON.stringify({id,method,params})); }); }
async function evalJs(expr){ const r=await send('Runtime.evaluate',{expression:expr,awaitPromise:true,returnByValue:true}); if(r.exceptionDetails) return {__err:JSON.stringify(r.exceptionDetails).slice(0,600)}; return r.result&&r.result.value; }
await send('Page.enable'); await send('Runtime.enable'); await send('DOM.enable');
await send('Page.navigate',{url:'file:///E:/vibecoding/prd_assistant/PRD智能看板.html'});
await new Promise(r=>setTimeout(r,3500));
await evalJs(`(()=>{
  window.__cap='';
  const oe=window.extractDocText;
  window.extractDocText=function(x,r,m){ window.__cap=oe(x,r,m); return window.__cap; };
  if(typeof STATE!=='undefined'){ STATE.seenWizard=true; try{save();}catch(e){} }
  return true;
})()`);
const doc=await send('DOM.getDocument',{depth:-1});
const q=await send('DOM.querySelector',{nodeId:doc.root.nodeId,selector:'#fileInput'});
await send('DOM.setFileInputFiles',{nodeId:q.nodeId,files:[docx]});
await new Promise(r=>setTimeout(r,5000));
const out=await evalJs(`(()=>{
  const p=currentProj();
  const cap=window.__cap||'';
  const mdLines=cap.split('\\n').filter(l=>/^#{1,6}\s/.test(l));
  return {
    autoGen:p?!!p.autoGen:null,
    fwCount:p&&p.framework?p.framework.length:null,
    titles:p&&p.framework?p.framework.slice(0,40).map(s=>s.id+':'+s.title):[],
    capLen:cap.length,
    mdCount:mdLines.length,
    mdSample:mdLines.slice(0,30),
    capHead:cap.slice(0,800),
    capMid:cap.slice(3000,4300)
  };
})()`);
console.log(JSON.stringify(out,null,2).slice(0,8000));
proc.kill();
