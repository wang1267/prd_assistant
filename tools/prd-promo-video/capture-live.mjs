// capture-live.mjs — 为「PMHub」单文件 HTML 应用采集视频素材三件套
// 改造自 video-shotcraft capture-template.mjs：BASE 改为 file://，主动注入
// loadSample() + setTheme() 准备 light/dark 两套演示状态。
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));
const FILE = 'file:///' + path.join('E:', 'WorkBuddy', 'work', 'prd看板', 'PMHub.html').replace(/\\/g, '/');
const OUT = path.join(here, 'textures', 'live');
const LAYOUT = path.join(here, 'live-layout.json');
fs.mkdirSync(OUT, { recursive: true });

const VIEWPORT = { width: 1920, height: 1080, deviceScaleFactor: 2 };

// 每个主题采集一套：全页图 + 关键元素 cutout + layout.json
const THEMES = ['light', 'dark'];

const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox', '--force-color-profile=srgb'] });
const page = await browser.newPage();
await page.setViewport(VIEWPORT);

const settle = async (ms = 600) => {
  await page.evaluate(() => document.fonts.ready);
  await new Promise((r) => setTimeout(r, ms));
};

// 元素 bbox → 整页坐标系
const pageBox = (el) => el.evaluate((e) => {
  const r = e.getBoundingClientRect();
  return { x: r.x + window.scrollX, y: r.y + window.scrollY, w: r.width, h: r.height };
});

const layout = { pageW: VIEWPORT.width };

for (const theme of THEMES) {
  await page.goto(FILE, { waitUntil: 'networkidle0', timeout: 60000 });
  await settle();
  // 关闭首屏向导/弹层
  await page.evaluate(() => {
    const fin = document.querySelector('[data-act="wzfinish"]'); if (fin) fin.click();
    document.querySelectorAll('.modal [data-act="closemodal"], .modal .x').forEach((b) => b.click());
    const ov = document.getElementById('sidebarOverlay'); if (ov) ov.click();
  });
  await settle(300);
  // 注入脱敏示例 + 设定主题
  await page.evaluate((t) => {
    if (typeof window.loadSample === 'function') window.loadSample();
    if (typeof window.setTheme === 'function') window.setTheme(t);
  }, theme);
  await settle(1800);

  const key = theme;
  const entry = { pageH: await page.evaluate(() => document.documentElement.scrollHeight) };
  layout[key] = entry;

  // 1. 全页 2x
  await page.screenshot({ path: path.join(OUT, `${key}-full.png`), fullPage: true });
  console.log(`[${theme}] full`, entry.pageH);

  // 2. boxes（关键区域坐标，进 layout）
  const boxSpecs = [
    { key: 'topbar', selector: '#topbar' },
    { key: 'main', selector: '#main, .main, #projView' },
    { key: 'sidebar', selector: '#sidebar, .sidebar' },
    { key: 'aiFloat', selector: '#aiFloatLog, .ai-float-log' },
    { key: 'aiDes', selector: '#aiDesInput, .ai-des' },
    { key: 'healthCards', selector: '.health-card, [class*="health"]', all: true, max: 8 },
    { key: 'reviewNodes', selector: '.review-node, [class*="review"]', all: true, max: 8 },
  ];
  entry.boxes = {};
  for (const b of boxSpecs) {
    const els = await page.$$(b.selector);
    const picked = b.all ? els.slice(0, b.max ?? els.length) : els.slice(0, 1);
    const boxes = [];
    for (const el of picked) boxes.push(await pageBox(el));
    entry.boxes[b.key] = b.all ? boxes : (boxes[0] ?? null);
    console.log(`  boxes.${b.key}:`, boxes.length);
  }

  // 3. cutouts（关键 UI 芯片，透明底供浮起）
  const cutSpecs = [
    { name: 'topbar', selector: '#topbar', omitBackground: true },
    { name: 'main', selector: '#main, .main, #projView', omitBackground: true },
    { name: 'aiFloat', selector: '#aiFloatLog, .ai-float-log', omitBackground: true },
  ];
  entry.cutouts = [];
  for (const c of cutSpecs) {
    const els = await page.$$(c.selector);
    const el = els[0];
    if (!el) { console.log(`  cutout miss ${c.name}`); continue; }
    const bb = await pageBox(el);
    try {
      await el.screenshot({ path: path.join(OUT, `${theme}-${c.name}.png`), omitBackground: !!c.omitBackground });
      entry.cutouts.push({ file: `${theme}-${c.name}.png`, ...bb });
      console.log(`  cutout ${theme}-${c.name}`, bb);
    } catch (e) { console.log(`  cutout err ${c.name}:`, e.message); }
  }

  // 3b. 弹窗素材：打开 AI 撰写向导（帮助创作PRD）与 多角色评审面板
  // —— 帮助创作 PRD：openWizard()
  await page.evaluate(() => { if (typeof window.openWizard === 'function') window.openWizard(); });
  await settle(900);
  const wizEl = await page.$('#wizardModal, #aiDesInput');
  if (wizEl) {
    const bb = await pageBox(wizEl);
    try {
      await wizEl.screenshot({ path: path.join(OUT, `${theme}-wizard.png`), omitBackground: true });
      entry.cutouts.push({ file: `${theme}-wizard.png`, ...bb, role: 'help-prd' });
      console.log(`  cutout ${theme}-wizard`, bb);
    } catch (e) { console.log(`  cutout err wizard:`, e.message); }
  } else { console.log(`  wizard miss`); }
  // 关掉向导
  await page.evaluate(() => {
    const x = document.querySelector('#wizardModal .x, #wizardModal [data-act="closemodal"]');
    if (x) x.click();
    const skip = document.getElementById('aiDesSkip'); if (skip) skip.click();
  });
  await settle(400);

  // —— 多角色评审：打开 reviewPickModal
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll('button, [data-act]')].find((e) => /评审|review/i.test(e.textContent || ''));
    if (btn) btn.click();
  });
  await settle(900);
  const revEl = await page.$('#reviewPickModal, #reviewModal, .ai-review');
  if (revEl) {
    const bb = await pageBox(revEl);
    try {
      await revEl.screenshot({ path: path.join(OUT, `${theme}-review.png`), omitBackground: true });
      entry.cutouts.push({ file: `${theme}-review.png`, ...bb, role: 'review' });
      console.log(`  cutout ${theme}-review`, bb);
    } catch (e) { console.log(`  cutout err review:`, e.message); }
  } else { console.log(`  review miss`); }
  // 关掉评审
  await page.evaluate(() => {
    const x = document.querySelector('#reviewPickModal .x, #reviewPickModal [data-act="closemodal"], #reviewModal .x');
    if (x) x.click();
  });
  await settle(400);
}

fs.writeFileSync(LAYOUT, JSON.stringify(layout, null, 1));
console.log('wrote', LAYOUT);
await browser.close();
console.log('CAPTURE_LIVE_DONE');
