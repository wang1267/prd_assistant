/**
 * PMHub PMHub —— 自动化 QA 测试脚本
 * 用法: node tools/qa-app-test.mjs
 * 输出: tools/_qa_out/report.json + 截图
 */
import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';

const CHROME = 'C:/Users/xlq/.cache/puppeteer/chrome/win64-149.0.7790.0/chrome-win64/chrome.exe';
const FILE = 'file:///E:/WorkBuddy/work/prd%E7%9C%8B%E6%9D%BF/PMHub.html';
const OUT = 'E:/WorkBuddy/work/prd看板/tools/_qa_out';
fs.mkdirSync(OUT, { recursive: true });

const report = {
  consoleErrors: [], consoleWarns: [], pageErrors: [], failedRequests: [],
  timings: {}, checks: {}, screenshots: [], state: {},
};

const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const rec = (k, v) => { report.checks[k] = v; };

async function shot(page, name, opts = {}) {
  const p = path.join(OUT, `${name}.png`);
  await page.screenshot({ path: p, ...opts });
  report.screenshots.push(p);
  return p;
}

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--allow-file-access-from-files', '--font-render-hinting=none'],
  defaultViewport: { width: 1440, height: 900, deviceScaleFactor: 1 },
});

const page = await browser.newPage();
page.on('console', (m) => {
  const t = m.type();
  if (t === 'error') report.consoleErrors.push(m.text().slice(0, 300));
  else if (t === 'warning') report.consoleWarns.push(m.text().slice(0, 300));
});
page.on('pageerror', (e) => report.pageErrors.push(String(e.message).slice(0, 300)));
page.on('requestfailed', (r) => {
  const u = r.url();
  if (!u.startsWith('data:')) report.failedRequests.push(`${u.slice(0, 120)} :: ${r.failure()?.errorText}`);
});

try {
  // ---------- 1. 冷启动（干净 localStorage） ----------
  await page.goto(FILE, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => { try { localStorage.clear(); sessionStorage.clear(); } catch (e) {} });
  const t0 = Date.now();
  await page.goto(FILE, { waitUntil: 'load' });
  await page.waitForFunction(() => document.querySelector('#main') && document.querySelector('#main').children.length >= 0, { timeout: 15000 });
  await sleep(1200);
  report.timings.coldLoadMs = Date.now() - t0;

  report.timings.domNodes = await page.evaluate(() => document.getElementsByTagName('*').length);
  report.timings.heapMB = await page.evaluate(() => (performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : null));
  report.state.initialMainChildren = await page.evaluate(() => document.querySelector('#main').children.length);
  report.state.homeVisible = await page.evaluate(() => !!document.querySelector('#main .hero, #main .home, #main .projects, .hero'));
  await shot(page, '01-home-desktop');

  // ---------- 2. 主题切换（4 套：brand / light / dark / hc） ----------
  const themeRes = {};
  for (const t of ['brand', 'light', 'dark', 'hc']) {
    const r = await page.evaluate((th) => {
      try {
        if (typeof window.setTheme === 'function') { window.setTheme(th); }
        else { document.documentElement.dataset.theme = th; }
        const cs = getComputedStyle(document.body);
        return {
          applied: document.documentElement.dataset.theme,
          bg: cs.backgroundColor, color: cs.color,
          saved: localStorage.getItem('prdKanbanTheme'),
          neumorphDisabled: (() => { const s = document.getElementById('dark-neumorphism'); return s ? s.disabled : null; })(),
        };
      } catch (e) { return { error: String(e.message) }; }
    }, t);
    themeRes[t] = r;
    await sleep(250);
    await shot(page, `02-theme-${t}`);
  }
  rec('themes', themeRes);

  // 主题持久化检查：刷新后是否保留
  await page.evaluate(() => { window.setTheme && window.setTheme('dark'); });
  await sleep(300);
  await page.reload({ waitUntil: 'load' });
  await sleep(800);
  report.state.themeAfterReload = await page.evaluate(() => document.documentElement.dataset.theme);
  await shot(page, '03-theme-persist-after-reload');

  // ---------- 3. 加载示例 -> 主视图 ----------
  await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
  await page.goto(FILE, { waitUntil: 'load' });
  await sleep(900);
  const sampleOk = await page.evaluate(() => { try { if (typeof loadSample === 'function') { loadSample(); return true; } return false; } catch (e) { return 'ERR:' + e.message; } });
  await sleep(1200);
  rec('loadSample', sampleOk);
  report.state.afterSample = await page.evaluate(() => ({
    mainChildren: document.querySelector('#main').children.length,
    tocItems: document.querySelectorAll('#toc a, #toc .toc-item').length,
    sections: document.querySelectorAll('.section-card').length,
    healthPillVisible: (() => { const e = document.querySelector('#topbarHealthPill'); return e ? getComputedStyle(e).display !== 'none' : null; })(),
    healthPillText: document.querySelector('#topbarHealthPill')?.textContent?.trim() || null,
  }));
  await shot(page, '04-sample-loaded');

  // ---------- 4. 健康度计算 ----------
  const health = await page.evaluate(() => {
    try {
      const p = (typeof currentProj === 'function') ? currentProj() : null;
      if (!p) return { error: 'no current project' };
      const h = (typeof healthForProject === 'function') ? healthForProject(p) : null;
      return { hasProj: true, projName: p.name, health: h };
    } catch (e) { return { error: String(e.message) }; }
  });
  rec('health', health);

  // ---------- 5. 导出 MD（拦截下载） ----------
  const dlDir = path.join(OUT, 'downloads');
  fs.mkdirSync(dlDir, { recursive: true });
  const cdp = await page.createCDPSession();
  await cdp.send('Page.setDownloadBehavior', { behavior: 'allow', downloadPath: dlDir });
  let exportErr = null;
  try {
    await page.evaluate(() => {
      const btn = document.querySelector('[data-act="exportmd"]');
      if (btn) { btn.click(); return; }
      if (typeof exportMd === 'function') exportMd();
      // 打开导出菜单再点
      const trigger = document.querySelector('#ddExport .top-dd-trigger');
      if (trigger) { trigger.click(); setTimeout(() => document.querySelector('[data-act="exportmd"]')?.click(), 120); }
    });
    await sleep(2000);
  } catch (e) { exportErr = String(e.message); }
  rec('exportMd', { error: exportErr, files: fs.existsSync(dlDir) ? fs.readdirSync(dlDir) : [] });

  // ---------- 6. 编辑交互 + 网格/表格渲染 ----------
  report.state.editables = await page.evaluate(() => document.querySelectorAll('[data-act="editable"]').length);
  report.state.tables = await page.evaluate(() => document.querySelectorAll('table.tbl').length);
  report.state.cards = await page.evaluate(() => document.querySelectorAll('.sub-card').length);

  // ---------- 7. 响应式（移动端 390x844） ----------
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await sleep(700);
  report.state.mobile = await page.evaluate(() => {
    const sb = document.querySelector('#sidebar');
    const tg = document.querySelector('#sidebarToggle');
    const main = document.querySelector('#main');
    return {
      sidebarToggleVisible: tg ? getComputedStyle(tg).display !== 'none' : null,
      sidebarTransform: sb ? getComputedStyle(sb).transform : null,
      horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 1,
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
      mainPad: main ? getComputedStyle(main).padding : null,
    };
  });
  await shot(page, '05-mobile-390');
  // 打开抽屉
  await page.evaluate(() => document.querySelector('#sidebarToggle')?.click());
  await sleep(500);
  report.state.mobileDrawerOpen = await page.evaluate(() => document.querySelector('#sidebar')?.classList.contains('open'));
  await shot(page, '06-mobile-drawer');

  // ---------- 8. 平板 768 ----------
  await page.setViewport({ width: 768, height: 1024, deviceScaleFactor: 1 });
  await sleep(500);
  report.state.tabletOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  await shot(page, '07-tablet-768');

  // ---------- 9. 窄屏 1024 ----------
  await page.setViewport({ width: 1024, height: 768, deviceScaleFactor: 1 });
  await sleep(500);
  report.state.w1024Overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);

  // ---------- 10. 无障碍快检 ----------
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await sleep(400);
  rec('a11y', await page.evaluate(() => {
    const btns = [...document.querySelectorAll('button')];
    const noName = btns.filter(b => !(b.textContent || '').trim() && !b.getAttribute('aria-label') && !b.getAttribute('title')).length;
    const noLang = !document.documentElement.getAttribute('lang');
    const inputs = [...document.querySelectorAll('input,textarea,select')];
    const noLabel = inputs.filter(i => {
      if (i.type === 'hidden' || i.id === 'fileInput' || (i.className || '').includes('file-hidden')) return false;
      if (i.getAttribute('aria-label') || i.getAttribute('placeholder') || i.getAttribute('title')) return false;
      return !(i.id && document.querySelector(`label[for="${i.id}"]`)) && !i.closest('label');
    }).length;
    const imgsNoAlt = [...document.querySelectorAll('img')].filter(i => !i.hasAttribute('alt')).length;
    return { buttonsWithoutName: noName, inputsWithoutLabel: noLabel, langMissing: noLang, imgsWithoutAlt: imgsNoAlt, totalButtons: btns.length };
  }));

  // ---------- 11. 存储占用分析 ----------
  rec('storage', await page.evaluate(() => {
    const out = { total: 0, items: [] };
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        const v = localStorage.getItem(k) || '';
        out.items.push({ key: k, kb: +(v.length / 1024).toFixed(1) });
        out.total += v.length;
      }
    } catch (e) {}
    out.totalKB = +(out.total / 1024).toFixed(1);
    out.items.sort((a, b) => b.kb - a.kb);
    out.top = out.items.slice(0, 8);
    return out;
  }));

} catch (e) {
  report.fatal = String(e.stack || e.message);
} finally {
  report.consoleErrors = [...new Set(report.consoleErrors)];
  report.consoleWarns = [...new Set(report.consoleWarns)];
  fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2), 'utf8');
  await browser.close();
}
console.log('QA_DONE');
console.log(JSON.stringify(report, null, 2));
