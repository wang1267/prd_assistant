/**
 * PMHub · 产品评审用界面截图（临时工具）
 *
 * 只截「首屏 / 编辑器 / 设置」三个界面，用于产品视角评审：
 * 看信息密度、入口层级、说明文案占比 —— 这些从源码读不出来。
 *
 * 用法: bash tools/qa/run.sh shot-review.mjs
 * 产物: tools/_review_shots/*.png（评审结束后应删除，不是交付物）
 */
import puppeteer from 'puppeteer';
import fs from 'node:fs';

const CHROME = 'C:/Users/xlq/.cache/puppeteer/chrome/win64-149.0.7790.0/chrome-win64/chrome.exe';
const APP = 'file:///E:/WorkBuddy/work/prd%E7%9C%8B%E6%9D%BF/PMHub.html';
const OUT = 'E:/WorkBuddy/work/prd看板/tools/_review_shots';
fs.mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--no-sandbox', '--disable-gpu', '--window-size=1440,900'],
  defaultViewport: { width: 1440, height: 900 },
});
const page = await browser.newPage();
const errs = [];
page.on('pageerror', e => errs.push(String(e.message)));

await page.goto(APP, { waitUntil: 'domcontentloaded' });
// 等应用就绪（同 browser_check 的轮询方式，避免固定延时不够）
for (let i = 0; i < 60; i++) {
  try {
    if (await page.evaluate(() => document.readyState === 'complete' && typeof loadSample === 'function')) break;
  } catch (e) { /* 继续等 */ }
  await new Promise(r => setTimeout(r, 250));
}
await new Promise(r => setTimeout(r, 600));

/** 统计当前可见文本量与可点击控件数，量化信息密度 */
async function density(tag) {
  const d = await page.evaluate(() => {
    const vis = el => {
      const r = el.getBoundingClientRect();
      const s = getComputedStyle(el);
      return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none';
    };
    const btns = [...document.querySelectorAll('button,[role="menuitem"],a[href]')].filter(vis);
    const txt = (document.body.innerText || '').replace(/\s+/g, ' ').trim();
    return { chars: txt.length, buttons: btns.length, text: txt };
  });
  console.log(`\n[${tag}] 可见文字 ${d.chars} 字 / 可点击控件 ${d.buttons} 个`);
  return d;
}

// 1) 首屏（空白态）
await page.screenshot({ path: `${OUT}/1-home.png` });
const home = await density('首屏');
console.log('   首屏可见文字：', home.text.slice(0, 700));

// 2) 载入示例后的编辑器
await page.evaluate(() => { const b = document.querySelector('[data-act="sample"]'); if (b) b.click(); });
await new Promise(r => setTimeout(r, 1200));
await page.screenshot({ path: `${OUT}/2-editor.png` });
const ed = await density('编辑器');
console.log('   编辑器可见文字：', ed.text.slice(0, 500));

// 3) 设置弹窗
await page.evaluate(() => { const b = document.querySelector('[data-act="settings"]'); if (b) b.click(); });
await new Promise(r => setTimeout(r, 700));
await page.screenshot({ path: `${OUT}/3-settings.png` });
const st = await density('设置');
console.log('   设置可见文字：', st.text.slice(0, 900));

console.log('\n页面异常：', errs.length ? errs : '无');
await browser.close();
