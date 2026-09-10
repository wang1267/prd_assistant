/**
 * PMHub 深度 QA 测试 第二轮
 * 覆盖：导出全链路 / 导入回环 / 撤销 / 注入安全 / a11y 细节 / 性能
 */
import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';

const CHROME = 'C:/Users/xlq/.cache/puppeteer/chrome/win64-149.0.7790.0/chrome-win64/chrome.exe';
const FILE = 'file:///E:/WorkBuddy/work/prd%E7%9C%8B%E6%9D%BF/PMHub.html';
const OUT = 'E:/WorkBuddy/work/prd看板/tools/_qa_out2';
const DL = path.join(OUT, 'downloads');
fs.mkdirSync(DL, { recursive: true });

const R = { errors: [], pageErrors: [], checks: {} };
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const rec = (k, v) => { R.checks[k] = v; };

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--allow-file-access-from-files'],
  defaultViewport: { width: 1440, height: 900 },
});
const page = await browser.newPage();
page.on('console', m => { if (m.type() === 'error') R.errors.push(m.text().slice(0, 250)); });
page.on('pageerror', e => R.pageErrors.push(String(e.message).slice(0, 250)));

const cdp = await page.createCDPSession();
await cdp.send('Page.setDownloadBehavior', { behavior: 'allow', downloadPath: DL });

const waitFile = async (dir, ms = 4000) => {
  const t = Date.now();
  while (Date.now() - t < ms) {
    const f = fs.existsSync(dir) ? fs.readdirSync(dir).filter(x => !x.endsWith('.crdownload')) : [];
    if (f.length) return f;
    await sleep(200);
  }
  return fs.existsSync(dir) ? fs.readdirSync(dir) : [];
};

try {
  await page.goto(FILE, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
  await page.goto(FILE, { waitUntil: 'load' });
  await sleep(1000);
  await page.evaluate(() => loadSample());
  await sleep(1400);

  // ========== 1. 导出 MD 全链路（含交付检查弹窗） ==========
  await page.evaluate(() => document.querySelector('[data-act="exportmd"]').click());
  await sleep(600);
  const mdModal = await page.evaluate(() => {
    const m = document.querySelector('#exportPreflightModal');
    return { open: m ? getComputedStyle(m).display !== 'none' : false, hasConfirm: !!document.querySelector('#exportPreflightConfirm'), gapCount: document.querySelectorAll('#exportPreflightGaps li').length };
  });
  await page.screenshot({ path: path.join(OUT, 'A1-preflight-md.png') });
  await page.evaluate(() => document.querySelector('[data-act="exportpreflightconfirm"]').click());
  const mdFiles = await waitFile(DL);
  rec('exportMd', { preflightModal: mdModal, files: mdFiles });
  const mdName = mdFiles.find(f => /\.md$/i.test(f));
  if (mdName) {
    const buf = fs.readFileSync(path.join(DL, mdName), 'utf8');
    rec('mdContent', { size: buf.length, head: buf.slice(0, 400), hasH1: /^#\s/m.test(buf), tables: (buf.match(/\n\|/g) || []).length, lines: buf.split('\n').length });
  }

  // ========== 2. 导出 Word ==========
  fs.readdirSync(DL).forEach(f => { try { fs.unlinkSync(path.join(DL, f)); } catch (e) {} });
  await page.evaluate(() => document.querySelector('[data-act="exportdocx"]').click());
  await sleep(500);
  await page.evaluate(() => document.querySelector('[data-act="exportpreflightconfirm"]')?.click());
  const docxFiles = await waitFile(DL, 8000);
  rec('exportDocx', { files: docxFiles, sizes: docxFiles.map(f => fs.statSync(path.join(DL, f)).size) });

  // ========== 3. 导出备份 JSON ==========
  fs.readdirSync(DL).forEach(f => { try { fs.unlinkSync(path.join(DL, f)); } catch (e) {} });
  await page.evaluate(() => document.querySelector('[data-act="backup"]')?.click());
  const bkFiles = await waitFile(DL, 6000);
  rec('exportBackup', { files: bkFiles });
  const bkName = bkFiles.find(f => /\.json$/i.test(f));
  if (bkName) {
    try { const j = JSON.parse(fs.readFileSync(path.join(DL, bkName), 'utf8')); rec('backupShape', { topKeys: Object.keys(j), projects: (j.projects || []).length, hasFramework: !!j.projects?.[0]?.framework }); }
    catch (e) { rec('backupShape', { error: String(e.message) }); }
  }

  // ========== 4. 撤销 / 重做 ==========
  rec('undo', await page.evaluate(() => {
    const out = {};
    const btn = document.querySelector('#btnUndo');
    out.undoBtnExists = !!btn;
    out.undoDisabledBefore = btn ? btn.disabled : null;
    // 直接改一个 section 触发 pushUndo
    try {
      const before = JSON.stringify(STATE).length;
      if (typeof DATA !== 'undefined' && Object.keys(DATA).length) {
        const k = Object.keys(DATA)[0];
        const orig = JSON.stringify(DATA[k]);
        DATA[k] = Object.assign({}, DATA[k], { html: (DATA[k].html || '') + '<p>QA-TEST-EDIT</p>' });
        if (typeof pushUndo === 'function') pushUndo();
        out.afterEdit = JSON.stringify(DATA[k]).length !== orig.length;
        const undoLenBefore = (typeof undoStack !== 'undefined') ? undoStack.length : null;
        if (typeof undo === 'function') undo();
        out.undoStackBefore = undoLenBefore;
        out.afterUndoRestored = JSON.stringify(DATA[k]) === orig;
      }
    } catch (e) { out.error = String(e.message); }
    return out;
  }));

  // ========== 5. 注入安全（XSS / HTML 转义） ==========
  rec('injectionSafety', await page.evaluate(() => {
    const payload = '<img src=x onerror="window.__XSS=1"><script>window.__XSS2=1<\/script>';
    const out = {};
    try {
      window.__XSS = undefined; window.__XSS2 = undefined;
      const k = Object.keys(DATA)[0];
      DATA[k] = Object.assign({}, DATA[k], { html: payload });
      if (typeof renderMain === 'function') renderMain(); else if (typeof render === 'function') render();
      out.renderedWithoutThrow = true;
    } catch (e) { out.renderError = String(e.message); }
    // 检查 esc() 是否正确转义
    try { out.escWorks = (typeof esc === 'function') && esc('<b>&"') === '&lt;b&gt;&amp;&quot;'; } catch (e) { out.escErr = String(e.message); }
    out.domInjectedScript = document.querySelectorAll('#main script').length;
    return out;
  }));
  await sleep(600);
  rec('injectionEffect', await page.evaluate(() => ({ xssFired: window.__XSS, xss2Fired: window.__XSS2, mainHasRawImg: !!document.querySelector('#main img[src="x"]') })));

  // ========== 6. a11y 细节：哪些输入缺标签 ==========
  await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
  await page.goto(FILE, { waitUntil: 'load' });
  await sleep(900);
  await page.evaluate(() => loadSample());
  await sleep(1200);
  rec('a11yDetail', await page.evaluate(() => {
    const inputs = [...document.querySelectorAll('input,textarea,select')];
    const bad = inputs.filter(i => {
      if (i.type === 'hidden' || (i.className || '').includes('file-hidden')) return false;
      if (i.getAttribute('aria-label') || i.getAttribute('placeholder') || i.getAttribute('title')) return false;
      return !(i.id && document.querySelector(`label[for="${i.id}"]`)) && !i.closest('label');
    });
    const byType = {};
    bad.forEach(b => { const k = (b.tagName.toLowerCase() + ':' + (b.type || b.className || '')).slice(0, 40); byType[k] = (byType[k] || 0) + 1; });
    return { count: bad.length, byType, samples: bad.slice(0, 6).map(b => ({ tag: b.tagName, type: b.type, cls: (b.className || '').slice(0, 60), id: b.id, ce: b.isContentEditable })) };
  }));

  // ========== 7. 键盘可达性 ==========
  rec('keyboard', await page.evaluate(() => {
    const out = { tabindexNeg: 0, ceCount: 0, roles: {} };
    document.querySelectorAll('[tabindex="-1"]').forEach(() => out.tabindexNeg++);
    out.ceCount = document.querySelectorAll('[contenteditable="true"]').length;
    document.querySelectorAll('[role]').forEach(e => { const r = e.getAttribute('role'); out.roles[r] = (out.roles[r] || 0) + 1; });
    // 检查是否有 skip-link / 焦点样式
    out.hasFocusVisibleCss = [...document.styleSheets].some(ss => { try { return [...ss.cssRules].some(r => r.selectorText && /:focus-visible/.test(r.selectorText)); } catch (e) { return false; } });
    return out;
  }));

  // ========== 8. 性能：大量内容下的渲染 ==========
  rec('perf', await page.evaluate(() => {
    const out = {};
    const t0 = performance.now();
    try {
      // 往 14 个节各塞 40 段，模拟长文档
      const keys = Object.keys(DATA);
      keys.forEach(k => { if (DATA[k] && 'html' in DATA[k]) { DATA[k].html = Array.from({ length: 40 }, (_, i) => `<h3>QA 标题 ${i}</h3><p>段落内容 ${i} —— 用于压力测试的占位文本。</p>`).join(''); } });
      if (typeof renderMain === 'function') renderMain();
      out.renderMs = +(performance.now() - t0).toFixed(1);
      out.domAfter = document.getElementsByTagName('*').length;
      out.heapMB = performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : null;
    } catch (e) { out.error = String(e.message); }
    return out;
  }));
  await page.screenshot({ path: path.join(OUT, 'B1-stress.png') });

  // ========== 9. 存储配额边界 ==========
  rec('quota', await page.evaluate(() => {
    const out = {};
    try {
      const big = 'x'.repeat(1024 * 512);
      let n = 0;
      try { for (; n < 20; n++) localStorage.setItem('__qa_fill_' + n, big); } catch (e) { out.threwAt = n; }
      out.fillStoppedAt = n;
      while (n-- > 0) localStorage.removeItem('__qa_fill_' + n);
      // 触发一次 save，看是否走到告警
      if (typeof save === 'function') { save(); out.saveAfterCleanupOk = true; }
      const w = document.querySelector('#storageWarn');
      out.warnShown = w ? getComputedStyle(w).display !== 'none' : null;
    } catch (e) { out.error = String(e.message); }
    return out;
  }));

} catch (e) {
  R.fatal = String(e.stack || e.message);
} finally {
  R.errors = [...new Set(R.errors)]; R.pageErrors = [...new Set(R.pageErrors)];
  fs.writeFileSync(path.join(OUT, 'report2.json'), JSON.stringify(R, null, 2), 'utf8');
  await browser.close();
}
console.log('QA2_DONE');
console.log(JSON.stringify(R, null, 2));
