/**
 * PMHub QA 第三轮：撤销正确性 / 可见区域 a11y / 导入回环 / 边界
 */
import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';

const CHROME = 'C:/Users/xlq/.cache/puppeteer/chrome/win64-149.0.7790.0/chrome-win64/chrome.exe';
const FILE = 'file:///E:/WorkBuddy/work/prd%E7%9C%8B%E6%9D%BF/PMHub.html';
const OUT = 'E:/WorkBuddy/work/prd看板/tools/_qa_out3';
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

const boot = async (withSample = true) => {
  await page.goto(FILE, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
  await page.goto(FILE, { waitUntil: 'load' });
  await sleep(900);
  if (withSample) { await page.evaluate(() => loadSample()); await sleep(1300); }
};

try {
  await boot(true);

  // ========== 1. 撤销（正确顺序：先 pushUndo 再改） ==========
  rec('undoCorrect', await page.evaluate(() => {
    const out = {};
    try {
      const k = Object.keys(DATA).find(x => DATA[x] && 'html' in DATA[x]);
      const orig = DATA[k].html || '';
      if (typeof pushUndo === 'function') pushUndo();          // 先快照
      DATA[k] = Object.assign({}, DATA[k], { html: orig + '<p>QA-EDIT</p>' });
      out.changed = (DATA[k].html || '') !== orig;
      if (typeof undo === 'function') undo();                   // 再撤销
      const after = (DATA[k] && DATA[k].html) || '';
      out.restored = after === orig;
      out.diffLen = (DATA[k].html || '').length - orig.length;
      out.undoBtnDisabledAfter = document.querySelector('#btnUndo')?.disabled;
    } catch (e) { out.error = String(e.message); }
    return out;
  }));

  // ========== 2. 可见区域 a11y（排除隐藏弹窗） ==========
  const visible = () => page.evaluate(() => {
    const isVisible = (el) => {
      if (!el.offsetParent && getComputedStyle(el).position !== 'fixed') return false;
      const r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) return false;
      let p = el;
      while (p && p !== document.body) { const s = getComputedStyle(p); if (s.display === 'none' || s.visibility === 'hidden') return false; p = p.parentElement; }
      return true;
    };
    const ins = [...document.querySelectorAll('input,textarea,select')].filter(i => (i.type !== 'hidden') && isVisible(i));
    const bad = ins.filter(i => !(i.getAttribute('aria-label') || i.getAttribute('placeholder') || i.getAttribute('title') || (i.id && document.querySelector(`label[for="${i.id}"]`)) || i.closest('label')));
    return {
      visibleInputs: ins.length, unlabeledVisible: bad.length,
      samples: bad.slice(0, 5).map(b => ({ tag: b.tagName, type: b.type, id: b.id, cls: (b.className || '').slice(0, 50) })),
      allVisibleInputIds: ins.map(i => i.id || `(${i.tagName}:${i.type})`).slice(0, 25),
    };
  });
  rec('a11yVisibleMain', await visible());

  // 打开设置弹窗，再看一次
  await page.evaluate(() => document.querySelector('[data-act="settings"]')?.click());
  await sleep(700);
  rec('a11yVisibleSettings', await visible());
  await page.screenshot({ path: path.join(OUT, 'C1-settings.png') });
  await page.evaluate(() => document.querySelector('#settingsModal [data-act="closemodal"]')?.click());
  await sleep(400);

  // 打开新建项目弹窗
  await page.evaluate(() => document.querySelector('[data-act="wz-newproj"]')?.click() || document.querySelector('[data-act="newproj"]')?.click());
  await sleep(600);
  rec('a11yVisibleNewProj', await visible());
  await page.screenshot({ path: path.join(OUT, 'C2-newproj.png') });
  await page.keyboard.press('Escape');
  await page.evaluate(() => document.querySelectorAll('.modal [data-act="closemodal"]').forEach(b => { const m = b.closest('.modal'); if (m && getComputedStyle(m).display !== 'none') b.click(); }));
  await sleep(400);

  // ========== 3. 导入回环：导出 MD -> 清空 -> 粘贴导入 ==========
  await page.evaluate(() => document.querySelector('[data-act="exportmd"]').click());
  await sleep(500);
  await page.evaluate(() => document.querySelector('[data-act="exportpreflightconfirm"]')?.click());
  await sleep(2500);
  let md = '';
  const mf = fs.existsSync(DL) ? fs.readdirSync(DL).find(f => /\.md$/i.test(f)) : null;
  if (mf) md = fs.readFileSync(path.join(DL, mf), 'utf8');
  rec('roundTripExport', { file: mf, chars: md.length });

  await boot(false);   // 全新空白环境
  const imported = await page.evaluate((text) => {
    try {
      const ta = document.querySelector('#pasteArea');
      if (!ta) return { error: 'no pasteArea' };
      ta.value = text;
      if (typeof doPaste === 'function') { doPaste(); return { called: 'doPaste' }; }
      document.querySelector('[data-act="doPaste"]')?.click();
      return { called: 'click' };
    } catch (e) { return { error: String(e.message) }; }
  }, md);
  await sleep(2500);
  // 处理可能的导入预览确认
  await page.evaluate(() => document.querySelector('[data-act="importpreviewconfirm"]')?.click());
  await sleep(1800);
  rec('roundTripImport', {
    trigger: imported,
    sections: await page.evaluate(() => document.querySelectorAll('.section-card').length),
    toc: await page.evaluate(() => document.querySelectorAll('#toc a, #toc .toc-item').length),
    projName: await page.evaluate(() => (typeof currentProj === 'function' && currentProj()) ? currentProj().name : null),
    healthText: await page.evaluate(() => document.querySelector('#topbarHealthPill')?.textContent?.trim() || null),
  });
  await page.screenshot({ path: path.join(OUT, 'C3-after-import.png') });

  // ========== 4. 边界：空 PRD 健康度 / 无项目时导出 ==========
  rec('edge', await page.evaluate(() => {
    const out = {};
    try {
      // 新建空白项目后看健康度
      out.hasCreateFn = typeof doCreateProject === 'function';
      if (typeof currentProj === 'function' && currentProj()) {
        out.curProj = currentProj().name;
        out.emptyHealth = typeof healthForProject === 'function' ? (() => { const h = healthForProject(currentProj()); return { sec: Object.keys(h.sec || {}).length, metrics: h.metrics }; })() : null;
      }
    } catch (e) { out.error = String(e.message); }
    return out;
  }));

  // ========== 5. 复制摘要功能 ==========
  rec('copySummary', await page.evaluate(() => {
    const b = document.querySelector('[data-act="copyhealth"]');
    return { buttonExists: !!b };
  }));

  // ========== 6. 检查 title / meta / 打印样式 ==========
  rec('meta', await page.evaluate(() => ({
    title: document.title,
    hasDescription: !!document.querySelector('meta[name="description"]'),
    hasOG: !!document.querySelector('meta[property^="og:"]'),
    hasPrintCss: [...document.styleSheets].some(ss => { try { return [...ss.cssRules].some(r => r.media && String(r.media.mediaText).includes('print')); } catch (e) { return false; } }),
    hasViewport: document.querySelector('meta[name="viewport"]')?.content,
    faviconHref: document.querySelector('link[rel="icon"]')?.getAttribute('href'),
  })));

} catch (e) { R.fatal = String(e.stack || e.message); }
finally {
  R.errors = [...new Set(R.errors)]; R.pageErrors = [...new Set(R.pageErrors)];
  fs.writeFileSync(path.join(OUT, 'report3.json'), JSON.stringify(R, null, 2), 'utf8');
  await browser.close();
}
console.log('QA3_DONE');
console.log(JSON.stringify(R, null, 2));
