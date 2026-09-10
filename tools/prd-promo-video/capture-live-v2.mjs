// capture-live-v2.mjs — 采集 v2 宣传片所需新素材
// 新增：初始页(无sample) / AI聊天框 / 导入下拉 / 导出下拉 / 编辑器(创作PRD)
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
const THEMES = ['light', 'dark'];

const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox', '--force-color-profile=srgb'] });
const page = await browser.newPage();
await page.setViewport(VIEWPORT);

const settle = async (ms = 600) => {
  await page.evaluate(() => document.fonts.ready);
  await new Promise((r) => setTimeout(r, ms));
};
const pageBox = (el) => el.evaluate((e) => {
  const r = e.getBoundingClientRect();
  return { x: r.x + window.scrollX, y: r.y + window.scrollY, w: r.width, h: r.height };
});
const shot = async (name) => {
  await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: true });
  console.log('shot', name, await page.evaluate(() => document.documentElement.scrollHeight));
};
const shotViewport = async (name) => {
  await page.screenshot({ path: path.join(OUT, `${name}.png`) });
  console.log('shotVP', name);
};

const layout = JSON.parse(fs.readFileSync(LAYOUT, 'utf8'));

for (const theme of THEMES) {
  await page.goto(FILE, { waitUntil: 'networkidle0', timeout: 60000 });
  await settle();
  await page.evaluate(() => {
    const fin = document.querySelector('[data-act="wzfinish"]'); if (fin) fin.click();
    document.querySelectorAll('.modal [data-act="closemodal"], .modal .x').forEach((b) => b.click());
    const ov = document.getElementById('sidebarOverlay'); if (ov) ov.click();
  });
  await settle(300);

  // ---- 初始页：不注入 sample，展示自然首屏 ----
  await settle(800);
  await shot(`${theme}-init`);

  // 注入示例 + 设定主题（后续镜头用）
  await page.evaluate((t) => {
    if (typeof window.loadSample === 'function') window.loadSample();
    if (typeof window.setTheme === 'function') window.setTheme(t);
  }, theme);
  await settle(1800);

  // ---- AI 聊天框：打开 aiFloatPanel ----
  await page.evaluate(() => { const b = document.getElementById('aiFloatBtn'); if (b) b.click(); });
  await settle(900);
  await shotViewport(`${theme}-aichat`);
  // 关闭
  await page.evaluate(() => { const c = document.getElementById('aiFloatClose'); if (c) c.click(); });
  await settle(400);

  // ---- 导入下拉 ----
  await page.evaluate(() => { const d = document.getElementById('ddImport'); if (d) d.click(); });
  await settle(700);
  await shotViewport(`${theme}-implant`);
  await page.evaluate(() => { const d = document.getElementById('ddImport'); if (d) d.click(); });
  await settle(300);

  // ---- 导出下拉 ----
  await page.evaluate(() => { const d = document.getElementById('ddExport'); if (d) d.click(); });
  await settle(700);
  await shotViewport(`${theme}-exportdd`);
  await page.evaluate(() => { const d = document.getElementById('ddExport'); if (d) d.click(); });
  await settle(300);

  // ---- 编辑器（创作PRD 载体）：#main 全页 + 顶栏首屏裁剪 ----
  await shot(`${theme}-editor`);
  // 尝试打开模板编辑器 tplEditor（可选，失败跳过）
  try {
    const tplBtn = await page.$('[data-act="tpl-importfile"], #tplEditorBtn, [data-act="openTpl"]');
    if (tplBtn) {
      await tplBtn.evaluate((el) => el.click()).catch(() => {});
      await settle(800);
      await shotViewport(`${theme}-tpled`);
      await page.evaluate(() => { const x = document.querySelector('#tplEditor .x, #tplEditor [data-act="closemodal"]'); if (x) x.click(); }).catch(() => {});
      await settle(300);
    } else {
      console.log('tplBtn miss');
    }
  } catch (e) { console.log('tpl skip', e.message); }

  // 记录编辑器首屏裁剪坐标（顶栏+首屏 980px）
  const mainEl = await page.$('#main, .main, #projView');
  if (mainEl) {
    const bb = await pageBox(mainEl);
    layout[theme].editor = { x: bb.x, y: bb.y, w: bb.w, h: bb.h };
    console.log(`${theme} editor box`, bb);
  }
}
fs.writeFileSync(LAYOUT, JSON.stringify(layout, null, 1));
console.log('wrote', LAYOUT);
await browser.close();
console.log('CAPTURE_V2_DONE');
