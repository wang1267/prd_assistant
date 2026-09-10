import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';

const CHROME = 'C:/Users/xlq/.cache/puppeteer/chrome/win64-149.0.7790.0/chrome-win64/chrome.exe';
const FILE = 'file:///E:/WorkBuddy/work/prd%E7%9C%8B%E6%9D%BF/PMHub.html';
const OUT = 'E:/WorkBuddy/work/prd看板/tools/_verify';
fs.mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const b = await puppeteer.launch({
  executablePath: CHROME, headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--allow-file-access-from-files'],
  defaultViewport: { width: 1440, height: 900 },
});
const p = await b.newPage();
await p.goto(FILE, { waitUntil: 'domcontentloaded' });
await p.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
await p.goto(FILE, { waitUntil: 'load' });
await sleep(900);
await p.evaluate(() => loadSample());
await sleep(1400);

// 进入编辑态，让所有结构化控件渲染出来
await p.evaluate(() => { if (typeof toggleEdit === 'function') toggleEdit(); });
await sleep(1200);

const out = {};

// 1) 全量（不过滤可见性）无标签控件，定位路径
out.unlabeled = await p.evaluate(() => {
  const pathOf = (el) => { const a = []; let x = el; while (x && x !== document.body) { a.unshift(x.tagName + (x.id ? '#' + x.id : '') + (x.className && typeof x.className === 'string' ? '.' + x.className.trim().split(/\s+/).slice(0, 2).join('.') : '')); x = x.parentElement; } return a.join(' > '); };
  const all = [...document.querySelectorAll('input,textarea,select')].filter(i => i.type !== 'hidden' && !(i.className || '').includes('file-hidden'));
  const bad = all.filter(i => !(i.getAttribute('aria-label') || i.getAttribute('placeholder') || i.getAttribute('title') || (i.id && document.querySelector(`label[for="${i.id}"]`)) || i.closest('label')));
  return { total: all.length, unlabeledCount: bad.length, detail: bad.map(i => ({ tag: i.tagName, type: i.type, path: pathOf(i).slice(0, 170) })) };
});

// 2) 编辑态下 aria-label 覆盖情况
out.ariaCoverage = await p.evaluate(() => {
  const ins = [...document.querySelectorAll('input,textarea,select')].filter(i => i.type !== 'hidden' && !(i.className || '').includes('file-hidden'));
  const withLabel = ins.filter(i => i.getAttribute('aria-label'));
  return { total: ins.length, withAriaLabel: withLabel.length, sample: withLabel.slice(0, 8).map(i => i.getAttribute('aria-label')) };
});

// 3) 交付就绪结论三行文本
out.deliveryRows = await p.evaluate(() => {
  const d = (typeof deliveryReadiness === 'function') ? deliveryReadiness() : null;
  return d ? { blockerText: d.blockerText, rows: d.rows } : null;
});

// 4) 导出前检查清单文本
out.preflight = await p.evaluate(() => {
  document.querySelector('[data-act="exportmd"]')?.click();
  return null;
});
await sleep(800);
out.preflight = await p.evaluate(() => {
  const items = [...document.querySelectorAll('#exportPreflightGaps li')].map(li => li.textContent.trim());
  const sum = document.querySelector('#exportPreflightSummary')?.innerText?.trim();
  const btn = document.querySelector('#exportPreflightConfirm')?.textContent?.trim();
  return { summary: sum, button: btn, count: items.length, items };
});
await p.screenshot({ path: path.join(OUT, 'V1-preflight.png') });
await p.evaluate(() => document.querySelector('#exportPreflightModal [data-act="closemodal"]')?.click());
await sleep(500);

// 5) 健康度 pill（含 title / aria-label）
out.pill = await p.evaluate(() => {
  const e = document.querySelector('#topbarHealthPill');
  return e ? { text: e.textContent.trim(), cls: e.className, title: e.getAttribute('title'), aria: e.getAttribute('aria-label') } : null;
});

// 6) 回只读态截图看板
await p.evaluate(() => { if (typeof toggleEdit === 'function') toggleEdit(); });
await sleep(1200);
await p.screenshot({ path: path.join(OUT, 'V2-dashboard.png') });

// 7) 移动端顶栏 pill 是否换行/溢出
await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await sleep(800);
out.mobilePill = await p.evaluate(() => {
  const e = document.querySelector('#topbarHealthPill');
  if (!e) return null;
  const r = e.getBoundingClientRect();
  const tb = document.querySelector('#topbar').getBoundingClientRect();
  return { text: e.textContent.trim(), pillW: Math.round(r.width), pillH: Math.round(r.height), pillTop: Math.round(r.top), topbarH: Math.round(tb.height), overflowX: document.documentElement.scrollWidth > window.innerWidth + 1, nowrap: getComputedStyle(e.querySelector('.txt')).whiteSpace };
});
await p.screenshot({ path: path.join(OUT, 'V3-mobile-pill.png') });

console.log(JSON.stringify(out, null, 2));
await b.close();
