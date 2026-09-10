// capture-init-only.mjs — 仅重采初始页，确保主题正确
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));
const FILE = 'file:///' + path.join('E:', 'WorkBuddy', 'work', 'prd看板', 'PMHub.html').replace(/\\/g, '/');
const OUT = path.join(here, 'textures', 'live');
fs.mkdirSync(OUT, { recursive: true });

const VIEWPORT = { width: 1920, height: 1080, deviceScaleFactor: 2 };
const THEMES = ['light', 'dark'];

const browser = await puppeteer.launch({
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--force-color-profile=srgb'],
});
const page = await browser.newPage();
await page.setViewport(VIEWPORT);

const settle = async (ms = 600) => {
  await page.evaluate(() => document.fonts.ready);
  await new Promise((r) => setTimeout(r, ms));
};

for (const theme of THEMES) {
  await page.goto(FILE, { waitUntil: 'networkidle0', timeout: 60000 });
  await page.evaluate(() => {
    // 清掉 persisted 状态，确保回到初始页
    localStorage.clear();
    sessionStorage.clear();
    const fin = document.querySelector('[data-act="wzfinish"]'); if (fin) fin.click();
    document.querySelectorAll('.modal [data-act="closemodal"], .modal .x').forEach((b) => b.click());
    const ov = document.getElementById('sidebarOverlay'); if (ov) ov.click();
  });
  await settle(400);

  // 在拍初始页之前先切主题
  await page.evaluate((t) => {
    if (typeof window.setTheme === 'function') window.setTheme(t);
    else document.documentElement.setAttribute('data-theme', t);
  }, theme);
  await settle(1200);

  // 确保没有 sample 注入
  await page.evaluate(() => {
    if (typeof window.clearProject === 'function') window.clearProject();
  });
  await settle(600);

  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  const name = `${theme}-init`;
  if (h <= 1200) {
    await page.screenshot({ path: path.join(OUT, `${name}.png`) }); // viewport
    console.log('shotVP', name, h);
  } else {
    await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: true });
    console.log('shotFP', name, h);
  }
}

await browser.close();
console.log('CAPTURE_INIT_DONE');
