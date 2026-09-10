/**
 * PMHub · 旧文件名跳转页验证（第 4 轮）
 *
 * 背景：应用主文件已由 `PRD智能看板.html` 更名为 `PMHub.html`，旧文件名保留为一个跳转页，
 *       用来兜住已对外分享的链接。对外链接通常带 `?project=xxx`（甚至 `&settings=ai`），
 *       因此跳转**必须**把查询参数和锚点原样带过去，否则旧链接打开后会丢项目。
 *
 * 本脚本用真实浏览器打开旧链接，断言落地 URL。
 *
 * 用法: bash tools/qa/run.sh qa-4-legacy-redirect.mjs
 */
import puppeteer from 'puppeteer';

const CHROME = 'C:/Users/xlq/.cache/puppeteer/chrome/win64-149.0.7790.0/chrome-win64/chrome.exe';
const DIR = 'E:/WorkBuddy/work/prd%E7%9C%8B%E6%9D%BF';
const OLD = `${DIR}/PRD%E6%99%BA%E8%83%BD%E7%9C%8B%E6%9D%BF.html`;
const NEW = `${DIR}/PMHub.html`;

const checks = [];
function ok(name, pass, detail) {
  checks.push({ name, pass });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${pass ? '' : '  >>> ' + JSON.stringify(detail)}`);
}

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--no-sandbox', '--disable-gpu', '--no-first-run'],
});

/** 用旧链接打开，等跳转落地，返回 { url, title, hasAppShell } */
async function openLegacy(qs) {
  const page = await browser.newPage();
  const pageErrors = [];
  page.on('pageerror', e => pageErrors.push(String(e && e.message || e)));
  await page.goto(OLD + qs, { waitUntil: 'domcontentloaded' });
  let url = page.url();
  for (let i = 0; i < 50; i++) {
    if (url.includes('PMHub.html')) break;
    await new Promise(r => setTimeout(r, 100));
    url = page.url();
  }
  // 等目标页挂载出应用外壳，确认跳转目标真的可用而不是只换了个地址
  let hasAppShell = false;
  try {
    hasAppShell = await page.evaluate(
      () => !!document.querySelector('#topbarProjName, .sidebar-brand, #app'),
      { timeout: 3000 }
    );
  } catch (e) { /* 保持 false */ }
  const title = await page.title();
  await page.close();
  return { url: decodeURIComponent(url), title, hasAppShell, pageErrors };
}

// 1) 最典型的对外链接形态：带 project 参数
{
  const r = await openLegacy('?project=xeswqfjb');
  ok('旧链接带 ?project= 时转发保留项目参数',
    r.url.includes('PMHub.html?project=xeswqfjb'), r);
}
// 2) 多参数：project + settings（从设置页跳回会用到）
{
  const r = await openLegacy('?project=abc123&settings=ai');
  ok('多参数 ?project=&settings= 全部保留',
    r.url.includes('project=abc123') && r.url.includes('settings=ai'), r);
}
// 3) 锚点
{
  const r = await openLegacy('?project=abc123#sec-users');
  ok('锚点 #hash 一并保留',
    r.url.includes('sec-users') && r.url.includes('project=abc123'), r);
}
// 4) 裸旧链接
{
  const r = await openLegacy('');
  ok('无参数旧链接正常落到 PMHub.html',
    r.url.replace(/^file:\/\/\//, '') === NEW.replace(/^file:\/\/\//, '') || r.url.includes('PMHub.html'), r);
}
// 5) 落地页确实是可用应用，不是白屏或循环
{
  const r = await openLegacy('?project=xeswqfjb');
  ok('转发目标页挂载出应用外壳且标题为 PMHub',
    r.hasAppShell && r.title === 'PMHub', r);
  ok('转发过程无页面脚本异常', r.pageErrors.length === 0, r.pageErrors);
}

await browser.close();

const fail = checks.filter(c => !c.pass).length;
console.log(`\n跳转页断言：PASS=${checks.length - fail} FAIL=${fail}`);
process.exit(fail ? 1 : 0);
