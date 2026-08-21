import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SHOTS = path.join(__dirname, 'shots');
fs.mkdirSync(SHOTS, { recursive: true });

const FILE = 'file:///' + path.join('E:', 'WorkBuddy', 'work', 'prd看板', 'PRD智能看板.html').replace(/\\/g, '/');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--force-color-profile=srgb'],
});

try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 2 });
  await page.goto(FILE, { waitUntil: 'networkidle0', timeout: 60000 });
  await sleep(800);

  // 关掉首次向导 / 任意弹层，避免遮挡
  await page.evaluate(() => {
    const fin = document.querySelector('[data-act="wzfinish"]');
    if (fin) fin.click();
    document.querySelectorAll('.modal [data-act="closemodal"], .modal .x').forEach((b) => b.click());
    const ov = document.getElementById('sidebarOverlay');
    if (ov) ov.click();
  });
  await sleep(400);

  // 加载脱敏示例数据
  await page.evaluate(() => {
    if (typeof window.loadSample === 'function') window.loadSample();
  });
  await sleep(1800);

  // ---- 浅色（方向 A：纸感编辑部）----
  await page.evaluate(() => window.setTheme('light'));
  await sleep(700);
  await page.screenshot({ path: path.join(SHOTS, 'light-full.png'), fullPage: true });
  // 顶栏健康度胶囊特写
  const topbar = await page.$('#topbar');
  if (topbar) await topbar.screenshot({ path: path.join(SHOTS, 'light-topbar.png') });
  // PRD 框架主区（hero + 章节）特写
  const main = await page.$('#main') || await page.$('.main') || await page.$('#projView');
  if (main) await main.screenshot({ path: path.join(SHOTS, 'light-main.png') });

  // ---- 暗色（方向 B：暗色拟态座舱）----
  await page.evaluate(() => window.setTheme('dark'));
  await sleep(700);
  await page.screenshot({ path: path.join(SHOTS, 'dark-full.png'), fullPage: true });
  const topbarD = await page.$('#topbar');
  if (topbarD) await topbarD.screenshot({ path: path.join(SHOTS, 'dark-topbar.png') });
  const mainD = await page.$('#main') || await page.$('.main') || await page.$('#projView');
  if (mainD) await mainD.screenshot({ path: path.join(SHOTS, 'dark-main.png') });

  console.log('CAPTURE_DONE');
  const files = fs.readdirSync(SHOTS);
  console.log(files.join('\n'));
} finally {
  await browser.close();
}
