import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, 'styleframe.png');
const FILE = 'file:///' + path.join(__dirname, 'styleframe.html').replace(/\\/g, '/');

const browser = await puppeteer.launch({
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--force-color-profile=srgb'],
});

try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
  await page.goto(FILE, { waitUntil: 'networkidle0', timeout: 60000 });
  // 等本地图片和字体就绪
  await page.evaluate(() => Promise.all([...document.images].map((img) => {
    if (img.complete) return Promise.resolve();
    return new Promise((r) => { img.onload = img.onerror = r; });
  })));
  await page.evaluate(() => document.fonts.ready);
  await new Promise((r) => setTimeout(r, 500));
  await page.screenshot({ path: OUT });
  console.log('STYLEFRAME_RENDERED:', OUT);
} finally {
  await browser.close();
}
