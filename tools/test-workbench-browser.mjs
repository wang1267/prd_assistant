import { createServer } from 'node:http';
import { readFile, mkdtemp, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
const root = path.resolve(import.meta.dirname, '..');
const server = createServer(async (req, res) => {
  try {
    const file = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
    if (!file.startsWith(root + path.sep)) throw Error('outside workspace');
    res.setHeader('Content-Type', /\.(mjs|js)$/.test(file) ? 'text/javascript' : file.endsWith('.css') ? 'text/css' : 'text/html');
    res.end(await readFile(file));
  } catch { res.writeHead(404); res.end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const exe = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(existsSync);
if (!exe) throw Error('需要本机 Chrome 或 Edge');
const profile = await mkdtemp(path.join(tmpdir(), 'workbench-test-'));
const browser = spawn(exe, ['--headless=new', '--disable-gpu', '--no-first-run', '--disable-extensions', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'], { windowsHide: true, stdio: 'ignore' });
const pause = () => new Promise(resolve => setTimeout(resolve, 100));
let ws;
try {
  let port;
  for (let i = 0; i < 100; i++) {
    try { port = (await readFile(path.join(profile, 'DevToolsActivePort'), 'utf8')).split('\n')[0]; break; } catch { await pause(); }
  }
  assert.ok(port, '浏览器启动');
  console.log('浏览器已启动，连接测试会话');
  const tabs = await (await fetch(`http://127.0.0.1:${port}/json`, { signal: AbortSignal.timeout(10000) })).json();
  ws = new WebSocket(tabs.find(x => x.type === 'page').webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
  let seq = 0; const pending = new Map(), contexts = new Map();
  ws.onmessage = event => {
    const data = JSON.parse(event.data);
    if (data.method === 'Runtime.exceptionThrown') console.log('BROWSER_ERROR', JSON.stringify(data.params.exceptionDetails));
    if (data.method === 'Target.attachedToTarget') send('Runtime.enable', {}, data.params.sessionId).catch(() => {});
    if (data.method === 'Runtime.executionContextCreated') contexts.set(`${data.sessionId}:${data.params.context.id}`, { ...data.params.context, sessionId: data.sessionId });
    if (data.method === 'Runtime.executionContextsCleared') for (const [key, context] of contexts) { if (context.sessionId === data.sessionId) contexts.delete(key); }
    if (data.method === 'Runtime.executionContextDestroyed') contexts.delete(`${data.sessionId}:${data.params.executionContextId}`);
    if (data.id) { const p = pending.get(data.id); pending.delete(data.id); data.error ? p.reject(Error(data.error.message)) : p.resolve(data.result); }
  };
  const send = (method, params = {}, sessionId) => new Promise((resolve, reject) => {
    const id = ++seq, timer = setTimeout(() => reject(Error('CDP 超时: ' + method)), 15000);
    pending.set(id, { resolve: value => { clearTimeout(timer); resolve(value); }, reject: error => { clearTimeout(timer); reject(error); } });
    ws.send(JSON.stringify({ id, method, params, sessionId }));
  });
  const evaluate = async (expression, context) => {
    const result = await send('Runtime.evaluate', { expression, contextId: context?.id, awaitPromise: true, returnByValue: true }, context?.sessionId);
    if (result.exceptionDetails) throw Error(JSON.stringify(result.exceptionDetails));
    return result.result.value;
  };
  const until = async expression => { for (let i = 0; i < 100; i++) { if (await evaluate(expression)) return; await pause(); } throw Error('等待失败: ' + expression); };
  await send('Runtime.enable'); await send('Page.enable');
  await send('Target.setAutoAttach', { autoAttach: true, waitForDebuggerOnStart: false, flatten: true });
  const prototypeMode = process.argv.includes('--prototype'), pagesMode = process.argv.includes('--pages');
  await send('Page.navigate', { url: base + (prototypeMode || pagesMode ? '/' + encodeURIComponent('PMHub.html') : '/workbench.html') });
  if (pagesMode) {
    await until(`!!window.__AICtrl && typeof createProject==='function'`);
    await evaluate(`(()=>{createProject('页面工作区测试',null);DATA.feat={items:[{name:'短信登录',desc:'输入验证码后登录'}]};save();localStorage.setItem('prdKanbanAiSettings',JSON.stringify({baseUrl:'https://shared.invalid/v1',apiKey:'test-only',model:'shared-model'}));localStorage.setItem('prdKanbanAiPrivacyAckV1',JSON.stringify({firstUse:true}));})()`);
    assert.equal(await evaluate(`document.getElementById('prdPrototypeOpen').textContent`),'原型');
    assert.equal(await evaluate(`!!document.getElementById('prdPrototypeWorkspace')`),false);
    await evaluate(`document.getElementById('prdPrototypeOpen').click()`);
    await until(`!!document.getElementById('addPageBtn')`);
    assert.ok(await evaluate(`!Array.from(document.querySelectorAll('#topbar button')).some(b=>/^(版本|修改记录|分享)$/.test(b.textContent.trim()))`));
    assert.ok(await evaluate(`!Array.from(document.querySelectorAll('#topbar button')).some(b=>b.textContent.includes('工作台 AI 设置')||/设置（|快捷键与操作速查/.test(b.title))`), '原型页移除三个设置/帮助按钮');
    await evaluate(`document.getElementById('addPageBtn').click()`);
    await until(`!!document.querySelector('#modal-root input')`);
    await evaluate(`document.querySelector('#modal-root input').value='登录页';Array.from(document.querySelectorAll('#modal-root button')).find(b=>b.textContent.trim()==='创建').click()`);
    await until(`Store.listPages(Store.listProjects()[0].id).length===2`);
    await evaluate(`Array.from(document.querySelectorAll('button')).find(b=>b.textContent.trim()==='导入原型').click()`);
    await until(`!!document.querySelector('#modal-root textarea')`);
    await evaluate(`document.querySelector('#modal-root textarea').value='<!doctype html><html><body><h1>登录页面</h1><button>登录</button></body></html>';Array.from(document.querySelectorAll('#modal-root button')).find(b=>b.textContent.trim()==='导入原型').click()`);
    await until(`document.querySelector('.proto-frame')?.contentDocument?.body?.textContent.includes('登录页面')`);
    await evaluate(`document.querySelector('.proto-frame').contentDocument.body.style.minHeight='2400px'`);
    for (const ending of ['release','blur','cancel']) {
      const bar = await evaluate(`(()=>{const r=document.getElementById('dragbar').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+80}})()`);
      await send('Input.dispatchMouseEvent',{type:'mousePressed',...bar,button:'left',buttons:1,clickCount:1});
      await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:bar.x-40,y:bar.y,button:'left',buttons:1});
      assert.equal(await evaluate(`document.body.classList.contains('dragging')`),true);
      if (ending==='blur') await evaluate(`window.dispatchEvent(new Event('blur'))`);
      if (ending==='cancel') await evaluate(`document.getElementById('dragbar').dispatchEvent(new PointerEvent('pointercancel',{pointerId:1,bubbles:true}))`);
      if (ending!=='release') assert.equal(await evaluate(`document.body.classList.contains('dragging')`),false, ending+' 清理拖拽');
      await send('Input.dispatchMouseEvent',{type:'mouseReleased',x:bar.x-40,y:bar.y,button:'left',buttons:0,clickCount:1});
      assert.equal(await evaluate(`document.body.classList.contains('dragging')`),false);
      assert.notEqual(await evaluate(`getComputedStyle(document.querySelector('.proto-frame')).pointerEvents`),'none');
      await evaluate(`document.querySelector('.proto-frame').contentWindow.scrollTo(0,0)`);
      await pause();
      const point = await evaluate(`(()=>{const r=document.querySelector('.proto-frame').getBoundingClientRect();return {x:r.x+60,y:r.y+120}})()`);
      await send('Input.dispatchMouseEvent',{type:'mouseMoved',...point});
      await send('Input.dispatchMouseEvent',{type:'mouseWheel',...point,deltaX:0,deltaY:360});
      await new Promise(resolve=>setTimeout(resolve,400));
      await until(`document.querySelector('.proto-frame').contentWindow.scrollY>0`);
      await send('Input.dispatchMouseEvent',{type:'mouseWheel',...point,deltaX:0,deltaY:-360});
      await until(`document.querySelector('.proto-frame').contentWindow.scrollY===0`);
    }
    console.log('PASS: 正常松开、窗口失焦、取消拖动后，真实鼠标滚轮均可上下滚动 HTML。');
    assert.equal(await evaluate('window.opener===null'), true, '无需依赖另一个窗口');
    await evaluate(`window.fetch=async function(url,opts){const body=JSON.parse(opts.body);window.sharedRequest={url:String(url),body};let content='<!doctype html><html><body><h1>短信登录</h1><button>发送验证码</button></body></html>';if(body.messages[0].content.includes('requirements')){const elements=JSON.parse(body.messages[1].content.split('画布：')[1]);content=JSON.stringify({requirements:[{text:'根据 PRD，支持短信验证码登录',elementIds:[elements[0].id]}]});}return new Response(JSON.stringify({choices:[{message:{content}}]}),{headers:{'Content-Type':'application/json'}})}`);
    assert.equal(await evaluate(`AI.getCfg().model`),'shared-model');
    assert.ok(await evaluate(`(async()=>{const result=await AI.generate('登录页',{});return result.html.includes('短信登录')&&sharedRequest.body.messages[1].content.includes('输入验证码后登录')&&sharedRequest.body.model==='shared-model'})()`));
    assert.equal(await evaluate('sharedRequest.url'),'https://shared.invalid/v1/chat/completions');
    assert.ok(await evaluate(`(()=>{const s=JSON.parse(localStorage.getItem('prdKanbanAiSettings'));s.model='updated-model';localStorage.setItem('prdKanbanAiSettings',JSON.stringify(s));return AI.getCfg().model==='updated-model'&&!JSON.stringify(Store.exportAll()).includes('test-only')&&!localStorage.getItem('protoReq.ai.v1')})()`), '实时读取统一设置且不写入第二份配置或项目备份');
    assert.ok(await evaluate(`(async()=>{const state=JSON.parse(localStorage.getItem('prdKanbanStateV3'));state.projects.find(p=>p.id===PRD_MODE.projectId).data.feat.items[0].desc='仅支持中国大陆手机号';localStorage.setItem('prdKanbanStateV3',JSON.stringify(state));await AI.generate('重试',{});return sharedRequest.body.messages[1].content.includes('仅支持中国大陆手机号')})()`), '重新生成读取最新 PRD');
    await evaluate(`Array.from(document.querySelectorAll('#topbar button')).find(b=>b.textContent.trim()==='AI 需求说明与连线').click()`);
    await until(`Store.exportAll().links.length===1`);
    await until(`document.body.textContent.includes('根据 PRD，支持短信验证码登录')`);
    await evaluate(`Array.from(document.querySelectorAll('#topbar button')).find(b=>b.textContent.trim()==='进入编辑态').click()`);
    await until(`!!document.querySelector('.ve-status')`);
    await until(`!!document.querySelector('iframe[title="原型编辑画布"]')?.contentWindow?.Moveable`);
    assert.ok(await evaluate(`document.body.textContent.includes('抓手')`));
    console.log('PASS: 同页进入原型 → 新增/导入 → 无 opener 共用 AI 配置及当前 PRD → AI 说明落到编辑器并关联真实元素 → 原版画布加载。模型为受控返回。');
  } else if (prototypeMode) {
    await until(`!!window.__AICtrl && !!document.getElementById('prdPrototypeOpen')`);
    await evaluate(`(()=>{
      window.__AI_TEST_MODE=true;createProject('原型测试',null);DATA.feat={items:[{name:'记录喝水',desc:'输入水量后保存'}]};save();
      const settings=__AICtrl.getSettings();settings.apiKey='test-only';settings.baseUrl='https://test.invalid/v1';settings.model='test';localStorage.setItem('prdKanbanAiSettings',JSON.stringify(settings));
      const fetchOriginal=window.fetch;window.fetch=async function(url,opts){if(String(url).includes('test.invalid')){window.prototypeRequest=JSON.parse(opts.body);return new Response('data: '+JSON.stringify({choices:[{delta:{content:'<!doctype html><html><head><style>body{padding:30px}h1{color:blue}</style></head><body><h1>喝水记录</h1><button>记录</button><script>parent.pwned=true<\\/script></body></html>'}}]})+'\\n\\ndata: [DONE]\\n\\n',{headers:{'Content-Type':'text/event-stream'}});}return fetchOriginal.apply(this,arguments)};
      document.getElementById('prdPrototypeOpen').click();document.getElementById('pp-generate').click();
    })()`);
    await until(`document.getElementById('pp-status').textContent.includes('草稿已生成')`);
    assert.ok(await evaluate(`prototypeRequest.messages[1].content.includes('记录喝水')`), '使用真实 PRD 内容构造请求');
    let child;
    for (let i=0;i<100&&!child;i++) {
      for (const context of contexts.values()) {
        try { if(context.auxData?.isDefault && await evaluate(`window!==top && !!document.querySelector('h1')`,context)) {child=context;break;} } catch {}
      }
      if(!child)await pause();
    }
    if (!child) for (const c of contexts.values()) { try { console.log('FRAME_DIAGNOSTIC', c.sessionId, await evaluate(`document.documentElement.outerHTML.slice(-600)`, c)); } catch(e) { console.log(String(e)); } }
    assert.ok(child,'可编辑原型加载');
    assert.equal(await evaluate(`(()=>{try{parent.document.body;return false}catch{return true}})()`,child),true);
    assert.equal(await evaluate(`!!window.pwned`),false);
    await evaluate(`(()=>{const el=document.querySelector('h1');el.click();el.textContent='我的喝水记录';el.dispatchEvent(new InputEvent('input',{bubbles:true}))})()`,child);
    await until(`document.getElementById('pp-status').textContent.includes('未保存修改')`);
    await evaluate(`document.getElementById('pp-save').click()`);
    assert.ok(await evaluate(`currentProj().prototype.html.includes('我的喝水记录')`));
    assert.ok(await evaluate(`!currentProj().prototype.html.includes('parent.pwned')&&!currentProj().prototype.html.includes('contenteditable')`));
    await evaluate(`document.getElementById('pp-close').click();document.getElementById('prdPrototypeOpen').click()`);
    assert.ok(await evaluate(`document.getElementById('pp-frame').srcdoc.includes('我的喝水记录')`));
    await evaluate(`__AICtrl.generatePrototype=()=>Promise.reject(new Error('测试网络失败'));document.getElementById('pp-generate').click()`);
    await until(`document.getElementById('pp-status').textContent.includes('测试网络失败')`);
    assert.ok(await evaluate(`currentProj().prototype.html.includes('我的喝水记录')`),'失败保留已保存原型');
    await evaluate(`document.getElementById('pp-close').click()`);
    await send('Page.reload');
    await new Promise(resolve => setTimeout(resolve, 500));
    await until(`!!window.__AICtrl && typeof currentProj==='function' && !!currentProj()`);
    assert.ok(await evaluate(`currentProj().prototype.html.includes('我的喝水记录')`));
    await evaluate(`document.getElementById('prdPrototypeOpen').click()`);
    console.log('PASS: PRD → 真实请求构造（受控模型返回）→ 隔离预览 → 文字编辑 → 保存 → 重开/刷新恢复；生成脚本未执行。');
  } else {
  console.log('检查体验入口');
  await until(`!document.getElementById('start')?.hidden`);
  await evaluate(`document.getElementById('demo').click()`);
  await until(`document.getElementById('status').textContent.includes('体验项目已保存')`);
  await evaluate(`document.getElementById('toPage').click()`);
  let child;
  for (let i = 0; i < 100; i++) {
    child = null;
    for (const context of contexts.values()) {
      try {
        if (context.auxData?.isDefault && await evaluate(`window !== window.top && !!document.querySelector('[data-proto-id="record"]')`, context)) { child = context; break; }
      } catch { /* The initial about:blank context is replaced by srcdoc. */ }
    }
    if (child) break; await pause();
  }
  assert.ok(child, '隔离预览加载');
  const isolation = await evaluate(`(()=>{let parentBlocked=false,storageBlocked=false;try{parent.document.body}catch{parentBlocked=true}try{localStorage.getItem('x')}catch{storageBlocked=true}document.querySelector('[data-proto-id="record"]').click();return {parentBlocked,storageBlocked}})()`, child);
  assert.deepEqual(isolation, { parentBlocked: true, storageBlocked: true });
  await until(`!document.getElementById('bind').disabled`);
  await evaluate(`document.getElementById('bind').click()`);
  await until(`document.getElementById('bindings').textContent.includes('已核对')`);
  await evaluate(`document.getElementById('back').click();document.getElementById('name').value='记录饮水量';document.getElementById('edit').requestSubmit()`);
  await until(`document.getElementById('bindings').textContent.includes('需求已变更')`);
  await send('Page.reload');
  await until(`document.getElementById('status').textContent.includes('已恢复')`);
  assert.equal(await evaluate(`document.getElementById('name').value`), '记录饮水量');
  assert.ok(await evaluate(`document.getElementById('bindings').textContent.includes('需求已变更')`));
  const conflict = await evaluate(`(async()=>{const {openRepository}=await import('./src/workbench/repository.mjs');const a=await openRepository(),b=await openRepository();const p=await a.get('prd:workbench-demo');await a.save(p,p.storageRevision);let rejected=false;try{await b.save(p,p.storageRevision)}catch{rejected=true}a.close();b.close();return rejected})()`);
  assert.equal(conflict, true);
  const sanitize = await evaluate(`(async()=>{const {mountPreview}=await import('./src/workbench/preview.mjs');const f=document.createElement('iframe');f.sandbox='allow-scripts';document.body.append(f);const p=mountPreview(f,'<script>parent.pwned=true<\\/script><img src="https://example.com/leak"><button onclick="parent.pwned=true" data-proto-id="safe">安全</button>',()=>{});const src=f.srcdoc;p.dispose();f.remove();return !src.includes('parent.pwned')&&!src.includes('example.com/leak')})()`);
  assert.equal(sanitize, true);
  await evaluate(`document.getElementById('toPage').click()`);
  }
  await send('Emulation.setDeviceMetricsOverride', { width: 1200, height: 900, deviceScaleFactor: 1, mobile: false });
  const shot = await send('Page.captureScreenshot', { format: 'png' });
  const screenshot = path.join(profile, 'workbench.png');
  await writeFile(screenshot, Buffer.from(shot.data, 'base64'));
  console.log('截图: ' + screenshot);
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  assert.ok(await evaluate('document.documentElement.scrollWidth <= innerWidth'), '窄屏无横向溢出');
  if (!prototypeMode && !pagesMode) console.log('PASS: 创建 → 选取 → 手动关联 → 修改待核对 → 刷新恢复；双连接冲突拒绝；沙箱宿主/存储隔离；脚本与外部资源移除。');
} finally {
  ws?.close(); browser.kill(); server.close();
  // Keep this isolated temporary profile for diagnostics; never touch the user's browser profile.
}
