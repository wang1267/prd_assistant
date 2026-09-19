// Focused regressions for startup recovery, AI failure recovery and save feedback.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const adapter = fs.readFileSync(path.join(root, 'prototype/js/prd-adapter.js'), 'utf8');
const app = fs.readFileSync(path.join(root, 'prototype/js/app.js'), 'utf8');
let passed = 0;
async function test(name, run) { await run(); passed++; console.log('PASS ' + name); }
function adapterContext() {
  const data = new Map([
    ['prdKanbanStateV3', JSON.stringify({ projects: [{ id: 'test', name: 'Test', framework: [{ id: 'purpose', title: 'Goal' }], data: { purpose: 'Book loans' } }] })],
    ['prdKanbanAiSettings', JSON.stringify({ baseUrl: 'https://example.invalid/v1', apiKey: 'test-only', model: 'test' })],
    ['prdKanbanAiPrivacyAckV1', '{"firstUse":true}']
  ]);
  let initialized = 0;
  const ctx = {
    Auth: {}, Store: { init() { initialized++; } }, AI: {},
    PRD_MODE: { projectId: 'test', key: 'test-prototype', safeHTML: s => s },
    localStorage: { getItem: k => data.get(k) || null, setItem: (k,v) => data.set(k,v) },
    DOMParser: class { parseFromString(s) { return { body: { textContent: s } }; } },
    AbortController, setTimeout, clearTimeout, U: { confirm: async () => true }
  };
  vm.createContext(ctx); vm.runInContext(adapter, ctx);
  return { ctx, data, initialized: () => initialized };
}
(async () => {
  await test('missing PRD does not initialize or overwrite prototype storage', () => {
    const {ctx,data,initialized} = adapterContext();
    ctx.PRD_MODE.projectId = 'missing'; data.set('test-prototype','original');
    assert.throws(() => ctx.Store.init(), /不存在/);
    assert.equal(initialized(),0); assert.equal(data.get('test-prototype'),'original');
  });
  await test('malformed prototype is preserved for recovery', () => {
    for (const raw of ['{', 'null', '{"projects":[]}']) {
      const {ctx,data,initialized} = adapterContext(); data.set('test-prototype', raw);
      assert.throws(() => ctx.Store.init()); assert.equal(initialized(),0);
      assert.equal(data.get('test-prototype'),raw);
    }
  });
  await test('network failure releases AI busy state and permits retry', async () => {
    const {ctx} = adapterContext();
    ctx.AI.requestText = async () => { throw new Error('Network failed'); };
    await assert.rejects(ctx.AI.generate('home'), /Network failed/);
    assert.equal(ctx.PRD_MODE.busy,false); assert.equal(ctx.PRD_MODE.abort,null);
    ctx.AI.requestText = async () => ({content:'<!doctype html><html>OK</html>'});
    ctx.AI.extractHtml = s => s;
    assert.match((await ctx.AI.generate('home')).html, /OK/);
  });
  await test('empty AI response fails without permanent loading', async () => {
    const {ctx} = adapterContext(); ctx.AI.requestText = async () => ({content:''});
    await assert.rejects(ctx.AI.generate('home'), /未返回正文/);
    assert.equal(ctx.PRD_MODE.busy,false);
  });
  await test('damaged AI configuration falls back to configuration guidance', () => {
    const {ctx,data} = adapterContext(); data.set('prdKanbanAiSettings','{');
    assert.equal(ctx.AI.isRemoteReady(),false);
  });
  await test('duplicate AI request is rejected and stop restores idle state', async () => {
    const {ctx} = adapterContext();
    ctx.AI.requestText = (_,opts) => new Promise((resolve,reject) => opts.signal.addEventListener('abort', () => reject(new Error('aborted'))));
    const first = ctx.AI.generate('home');
    await assert.rejects(ctx.AI.generate('duplicate'), /尚未结束/);
    ctx.PRD_MODE.abort.abort(); await assert.rejects(first, /停止或超时/);
    assert.equal(ctx.PRD_MODE.busy,false);
  });
  await test('failed local save stays unsaved, retry succeeds without duplicate changes', () => {
    let fail = true, changes = 0;
    const ctx = {
      page:{id:'p'}, doc:{id:'d'}, project:{id:'project'}, locked:false, dirty:true,
      savedBlocks:[], editor:{getBlocks:() => [{id:'b',content:'edited'}]},
      Store:{replaceBlocks(){},addChange(){changes++;},save:() => !fail},
      U:{deepCopy:v=>JSON.parse(JSON.stringify(v)),toast(){},fmtDTS:()=>''},
      previewOf:b=>b.content,refreshLinks(){},lastSavedAt:0,
      saveChip:{textContent:'',title:'',classList:{add(){},remove(){}}}
    };
    vm.createContext(ctx);
    vm.runInContext(app.slice(app.indexOf('    function setSaveStatus('), app.indexOf('    var scheduleSave =')),ctx);
    assert.equal(ctx.flushSave(),false); assert.equal(ctx.dirty,true);
    assert.match(ctx.saveChip.textContent,/未保存/);
    fail = false; assert.equal(ctx.flushSave(),true); assert.equal(ctx.dirty,false);
    assert.equal(ctx.saveChip.textContent,'已保存'); assert.equal(changes,1);
  });
  await test('visual editor save failure retains the editor and restores prior preview', () => {
    let fail = true, loaded = 0;
    const ctx = {
      page:{id:'p',prototype_content:'original'},doc:{id:'d'},window:{PRD_MODE:{}},
      flushSave:()=>true,setSaveStatus(){},setMode(){},U:{toast(){}},
      loadPage(){loaded++;},Store:{saveVersion(){},save:()=>!fail,getPage:()=>ctx.page,updatePage:(_,patch)=>Object.assign(ctx.page,patch)}
    };
    const start = app.indexOf('        onSave: function (html, changed)');
    const callback = app.slice(start,app.indexOf('        onCancel:',start)).trim().replace(/,$/,'');
    vm.createContext(ctx); vm.runInContext('var callback = ({'+callback+'}).onSave;',ctx);
    assert.throws(()=>ctx.callback('edited',true),/编辑内容已保留/);
    assert.equal(ctx.page.prototype_content,'original'); assert.equal(loaded,0);
    fail=false; ctx.callback('edited',true);
    assert.equal(ctx.page.prototype_content,'edited'); assert.equal(loaded,1);
  });
  console.log(`Experience regressions: ${passed} passed`);
})().catch(error => { console.error(error); process.exitCode = 1; });
