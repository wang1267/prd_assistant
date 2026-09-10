/**
 * PMHub · v19.16「说明文案去重」验证（第 6 轮）
 *
 * 验证产品评审 C 组四条冗余说明确实被收敛，且**关键警告没有被误删**：
 *   C1  AI 设置页不再复述「与红黄绿规则引擎并列、不覆盖」，但 Key 隐私说明仍在
 *   C2  设置页「仅本机生效，刷新后保留」由 2 处收敛为 1 处（上提为设置页顶部统一声明）
 *   C5  评审「选择项目」弹窗的冗余引导语删除，但列表头 / 空态 / 导入按钮仍在
 *   C6  「导入备份」菜单项 title 不再与菜单底部注记逐字重复，且注记本身（覆盖 + 先备份）仍在
 *
 * 说明：本脚本只断言「渲染后的可见文案」，不看源码字符串 —— 上一轮把设置
 * 「判分基线」误判为空 tab，根因就是只读静态 HTML 没跑 JS（见 memory/MEMORY.md）。
 *
 * 用法: bash tools/qa/run.sh qa-6-copy-dedupe.mjs
 */
import puppeteer from 'puppeteer';

const CHROME = 'C:/Users/xlq/.cache/puppeteer/chrome/win64-149.0.7790.0/chrome-win64/chrome.exe';
const APP = 'E:/WorkBuddy/work/prd%E7%9C%8B%E6%9D%BF/PMHub.html';

const checks = [];
function ok(name, pass, detail) {
  checks.push({ name, pass });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${pass ? '' : '  >>> ' + JSON.stringify(detail)}`);
}

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox', '--disable-gpu'] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
const errors = [];
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', e => errors.push(String((e && e.message) || e)));

await page.goto(APP, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => document.readyState === 'complete' && typeof loadSample === 'function', { timeout: 15000 });
await page.evaluate(() => loadSample());
await new Promise(r => setTimeout(r, 1200));

// ── C2：设置页（普通档）「仅本机生效，刷新后保留」只应出现 1 次 ──
{
  await page.evaluate(() => document.querySelector('[data-act="settings"]')?.click());
  await new Promise(r => setTimeout(r, 500));
  const s = await page.evaluate(() => {
    const el = document.getElementById('tabPrefs');
    const t = el ? el.innerText : '';
    return {
      persistCount: t.split('仅本机生效，刷新后保留').length - 1,
      hasHoisted: t.includes('以下外观设置仅本机生效，刷新后保留。'),
      densityHasPersist: t.includes('面板密度影响卡片留白与信息密度，仅本机生效'),
      themeHasPersist: t.includes('界面主题（本机生效'),
      chars: t.replace(/\s/g, '').length,
    };
  });
  ok('C2：设置页持久化提示由 2 处收敛为 1 处',
    s.persistCount === 1 && s.hasHoisted === true, s);
  ok('C2：面板密度与主题各自的说明不再重复持久化提示',
    s.densityHasPersist === false && s.themeHasPersist === false, s);
  console.log(`      · 设置页（普通档）可见文案 ${s.chars} 字`);
}

// ── C1：AI 设置 tab 不再复述与规则引擎的关系，但 Key 隐私说明仍在 ──
{
  await page.evaluate(() => { const b = document.querySelector('#settingsModal [data-tab="ai"]'); if (b) b.click(); });
  await new Promise(r => setTimeout(r, 800));
  const s = await page.evaluate(() => {
    const el = document.getElementById('tabAI');
    const t = el ? el.innerText : '';
    return { hasNotCover: t.includes('不覆盖'), hasEngineLine: t.includes('与红黄绿规则引擎并列'), hasKeyNote: t.includes('Key 仅存本机浏览器'), chars: t.replace(/\s/g, '').length };
  });
  ok('C1：AI 设置页不再复述「与红黄绿规则引擎并列 / 不覆盖」',
    s.hasNotCover === false && s.hasEngineLine === false, s);
  ok('C1：但 Key 存储与隐私说明仍在（警告未被误删）',
    s.hasKeyNote === true, s);
  console.log(`      · AI 设置 tab 可见文案 ${s.chars} 字`);
  await page.evaluate(() => document.querySelector('#settingsModal [data-act="closemodal"]')?.click());
  await new Promise(r => setTimeout(r, 300));
}

// ── C5：评审「选择项目」弹窗 ──
{
  await page.evaluate(() => { if (typeof rvOpenPick === 'function') rvOpenPick(); });
  await new Promise(r => setTimeout(r, 500));
  const s = await page.evaluate(() => {
    const m = document.getElementById('reviewPickModal');
    const open = !!m && getComputedStyle(m).display !== 'none';
    const t = m ? m.innerText : '';
    const list = document.getElementById('rvPickList');
    return {
      open,
      hasOldIntro: t.includes('选择一个已有项目进行五视角评审'),
      hasListHeader: !!list && list.innerText.includes('点击即切换并开始评审'),
      hasEmptyState: !!list && !!list.querySelector('.empty'),
      hasImportBtn: !!m && !!m.querySelector('[data-act="import"]'),
    };
  });
  ok('C5：弹窗内的冗余引导语已删除',
    s.open === true && s.hasOldIntro === false, s);
  ok('C5：列表头 / 空态 / 导入入口三者仍在（信息未缺失）',
    s.hasListHeader === true && (s.hasEmptyState === true || s.hasImportBtn === true), s);
  await page.keyboard.press('Escape');
  await page.evaluate(() => document.querySelector('#reviewPickModal [data-act="closemodal"]')?.click());
  await new Promise(r => setTimeout(r, 300));
}

// ── C6：导入备份 —— title 不再与菜单注记逐字重复，且注记（覆盖 + 先备份）仍在 ──
{
  const s = await page.evaluate(() => {
    const item = document.querySelector('[data-act="importbackup"]');
    const note = document.querySelector('#ddImport .top-dd-note');
    const itemTitle = item ? (item.getAttribute('title') || '') : '';
    const noteText = note ? note.textContent.trim() : '';
    return { itemTitle, noteText, same: itemTitle === noteText, noteHasWarn: noteText.includes('覆盖') && noteText.includes('导出备份') };
  });
  ok('C6：导入备份的 title 与菜单注记不再逐字重复',
    s.same === false && s.itemTitle.length > 0, s);
  ok('C6：菜单注记仍保留「覆盖 + 先导出备份」的警告',
    s.noteHasWarn === true, s);
}

await page.close();
await browser.close();

ok('运行期间无 console error / pageerror', errors.length === 0, errors.slice(0, 5));

const fail = checks.filter(c => !c.pass).length;
console.log(`\n文案去重断言：PASS=${checks.length - fail} FAIL=${fail}`);
process.exit(fail ? 1 : 0);
