/**
 * 探查：框架相关的 data-act 操作在 UI 上到底有没有可见入口。
 *
 * 背景：`renderFrameworkTab()` 写入的 `#tabFramework` 在当前主文件里**并不存在**
 * （只在 v16.9 / stripped.html 的历史快照里有），因此它渲染的按钮全部不可达。
 * 其中 `fw-autosort / resetframework / fw-saveas / exportframework / importframework`
 * 这 5 个动作**只**出现在那处已死渲染里 —— 需要用真实浏览器确认它们确实没有入口。
 *
 * 用法: bash tools/qa/run.sh probe-fw-actions.mjs
 */
import puppeteer from 'puppeteer';

const CHROME = 'C:/Users/xlq/.cache/puppeteer/chrome/win64-149.0.7790.0/chrome-win64/chrome.exe';
const APP = 'E:/WorkBuddy/work/prd%E7%9C%8B%E6%9D%BF/PMHub.html';

const LEGACY = ['fw-autosort', 'resetframework', 'fw-saveas', 'exportframework', 'importframework'];
const LIVE = ['fwedit-add', 'fwedit-ins', 'fwedit-del', 'fwedit-title', 'fwedit-type', 'fwedit-req', 'fwedit-w'];

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox', '--disable-gpu'] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.goto(APP, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => document.readyState === 'complete' && typeof loadSample === 'function', { timeout: 15000 });
await page.evaluate(() => loadSample());
await new Promise(r => setTimeout(r, 1200));

// 冷启动后全页扫描一次
const before = await page.evaluate((acts) => {
  const hit = {};
  acts.forEach(a => { hit[a] = document.querySelectorAll(`[data-act="${a}"]`).length; });
  return { hit, hasTabFramework: !!document.getElementById('tabFramework') };
}, [...LEGACY, ...LIVE]);

// 打开「编辑文档框架」弹窗（更多 → 框架 / data-act="managefw"）
await page.evaluate(() => {
  const ev = document.querySelector('[data-act="managefw"]');
  if (ev) ev.click();
});
await new Promise(r => setTimeout(r, 600));

const inModal = await page.evaluate((acts) => {
  const m = document.getElementById('fwEditModal');
  const hit = {};
  acts.forEach(a => { hit[a] = m ? m.querySelectorAll(`[data-act="${a}"]`).length : -1; });
  return {
    modalOpen: !!m && getComputedStyle(m).display !== 'none',
    hit,
    rowCount: m ? m.querySelectorAll('.fw-row').length : -1,
    actions: m ? [...m.querySelectorAll('[data-act]')].map(e => e.getAttribute('data-act')) : [],
  };
}, [...LEGACY, ...LIVE]);

// 顺便看设置弹窗里有没有 framework 相关 tab
const inSettings = await page.evaluate(() => {
  const s = document.getElementById('settingsModal');
  return {
    tabs: s ? [...s.querySelectorAll('.tabs button')].map(b => b.dataset.tab || b.textContent.trim()) : null,
    hasTabFramework: !!document.getElementById('tabFramework'),
  };
});

console.log(JSON.stringify({ before, inModal, inSettings }, null, 2));

await page.close();
await browser.close();
