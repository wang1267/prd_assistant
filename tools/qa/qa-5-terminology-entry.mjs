/**
 * PMHub · v19.15「术语与入口订正」验证（第 5 轮）
 *
 * 覆盖两处产品评审结论（A4 / B1），并顺带回归一处被误判为「空 tab」的设置页：
 *
 *  A4 侧栏「PRD 项目」死控件 —— 原实现无项目时把文案写成「PRD 项目」，但整条绑定的
 *     始终是 gohome（只做 activeProjectId=null），已在家时点击零反馈。v19.15 改为：
 *     有项目才显示「← 返回主页」，无项目隐藏。
 *
 *  B1 术语统一 —— 顶栏 pill 原写「健康度 77%」但取值是 metrics.completion（完成度），
 *     与其自身 title、看板「完成度」卡自相矛盾。v19.15 约定：带百分比一律叫「完成度」，
 *     「健康度」只用于红黄绿规则引擎结论。
 *
 *  回归 设置「高级 → 判分基线」不是空 tab —— renderRulesTab 会渲染 FULL 规则表，
 *     且体检面板的 rule-link 直接下钻打开它（case 'rulelink'）。曾误判为空 tab，此处加断言锁住。
 *
 * 用法: bash tools/qa/run.sh qa-5-terminology-entry.mjs
 */
import puppeteer from 'puppeteer';

const CHROME = 'C:/Users/xlq/.cache/puppeteer/chrome/win64-149.0.7790.0/chrome-win64/chrome.exe';
const APP = 'E:/WorkBuddy/work/prd%E7%9C%8B%E6%9D%BF/PMHub.html';

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
const page = await browser.newPage();
// puppeteer 默认视口 800×600，此时侧栏是抽屉态、入口条不可点（click 会报
// "Node is either not clickable"），故先设成桌面视口。
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
const errors = [];
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', e => errors.push(String((e && e.message) || e)));

await page.goto(APP, { waitUntil: 'domcontentloaded' });
// 就绪轮询：831KB 单文件冷启动可能超过固定延时（见 README 铁律 2）
await page.waitForFunction(
  () => document.readyState === 'complete' && typeof loadSample === 'function',
  { timeout: 15000 }
);

/** 读侧栏入口条与顶栏 pill 的当前状态 */
const snap = () => page.evaluate(() => {
  const bar = document.querySelector('.proj-bar');
  const pill = document.querySelector('#topbarHealthPill');
  const barVisible = !!bar && getComputedStyle(bar).display !== 'none';
  const pillVisible = !!pill && getComputedStyle(pill).display !== 'none';
  return {
    barText: bar ? bar.querySelector('.name').textContent.trim() : null,
    barVisible,
    barAct: bar ? bar.getAttribute('data-act') : null,
    pillText: pill && pillVisible ? pill.querySelector('.txt').textContent.trim() : null,
    pillTitle: pill && pillVisible ? pill.getAttribute('title') : null,
  };
});

// ── 1) 冷启动 = 主页（无项目）：入口条与 pill 都不该出现 ──
{
  const s = await snap();
  ok('回归 A4：冷启动（无项目）侧栏入口条隐藏，不再是点了没反应的「PRD 项目」',
    s.barVisible === false, s);
  ok('回归 A4：入口条绑定的动作始终是 gohome（未引入第二套 Action）',
    s.barAct === 'gohome', s);
}

// ── 2) 载入示例后：入口条出现「← 返回主页」，pill 用「完成度」──
await page.evaluate(() => loadSample());
await page.waitForFunction(
  () => { const p = document.querySelector('#topbarHealthPill'); return p && getComputedStyle(p).display !== 'none'; },
  { timeout: 10000 }
).catch(() => {});
await new Promise(r => setTimeout(r, 600));

let afterLoad;
{
  const s = await snap();
  afterLoad = s;
  ok('A4：载入项目后入口条显示「← 返回主页」',
    s.barVisible === true && s.barText === '← 返回主页', s);
  ok('B1：pill 文案改用「完成度」且带百分比',
    !!s.pillText && s.pillText.startsWith('完成度 ') && /%/.test(s.pillText), s);
  ok('B1：pill 文案不再出现「健康度」字样（百分比不叫健康度）',
    !!s.pillText && !s.pillText.includes('健康度'), s);
  ok('B1：pill 的 title 与文案术语一致（同为「完成度」）',
    !!s.pillTitle && s.pillTitle.startsWith('完成度 ') && !s.pillTitle.includes('健康度'), s);
}

// ── 3) 点入口条回主页：入口条应重新隐藏（闭环，不留半死状态）──
{
  await page.click('.proj-bar');
  await new Promise(r => setTimeout(r, 700));
  const s = await snap();
  ok('A4：点击「← 返回主页」后回到主页，入口条随之隐藏',
    s.barVisible === false, s);
}

// ── 4) 回归：设置「高级 → 判分基线」不是空 tab，确有规则表（并被 rule-link 使用）──
{
  await page.evaluate(() => { document.querySelector('#topbarProjName'); openSettings('rules'); });
  await new Promise(r => setTimeout(r, 500));
  const r = await page.evaluate(() => {
    const rows = document.querySelectorAll('#tabRules .rule-row').length;
    const tbl = !!document.querySelector('#tabRules table.tbl');
    const head = document.querySelector('#tabRules .muted');
    const first = document.querySelector('#tabRules .rule-row .r-id');
    return {
      rows, tbl,
      intro: head ? head.textContent.trim().slice(0, 24) : null,
      firstRule: first ? first.textContent.trim() : null,
      ruleSetLen: (typeof STATE !== 'undefined' && STATE.ruleSet) ? STATE.ruleSet.length : null,
    };
  });
  ok('回归：判分基线 tab 渲染出完整规则表（非空 tab）',
    r.tbl === true && r.rows > 0 && r.rows === r.ruleSetLen, r);
  ok('回归：规则表含真实规则 ID（如 R-SPEC-01）',
    typeof r.firstRule === 'string' && /^R-/.test(r.firstRule), r);
  await page.evaluate(() => document.querySelector('#settingsModal [data-act="closemodal"]')?.click());
}

// ── 5) 回归：分组仍是在用功能（佐证源码中「分组功能已移除」注释是错的）──
{
  await page.evaluate(() => document.querySelector('[data-act="toggleprojpanel"]')?.click());
  await new Promise(r => setTimeout(r, 400));
  const g = await page.evaluate(() => ({
    addBtn: !!document.querySelector('#projPanel [data-act="grp-add"]'),
    hasGroupsState: typeof STATE !== 'undefined' && Array.isArray(STATE.groups),
    label: document.querySelector('#projPanel [data-act="grp-add"]')?.textContent.trim() || null,
  }));
  ok('回归：项目抽屉提供「＋ 新建分组」入口，分组是在用功能',
    g.addBtn === true && g.hasGroupsState === true, g);
}

await page.close();
await browser.close();

ok('运行期间无 console error / pageerror', errors.length === 0, errors.slice(0, 5));

const fail = checks.filter(c => !c.pass).length;
console.log(`\n术语与入口断言：PASS=${checks.length - fail} FAIL=${fail}`);
process.exit(fail ? 1 : 0);
