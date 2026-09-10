import puppeteer from 'puppeteer';
const CHROME = 'C:/Users/xlq/.cache/puppeteer/chrome/win64-149.0.7790.0/chrome-win64/chrome.exe';
const FILE = 'file:///E:/WorkBuddy/work/prd%E7%9C%8B%E6%9D%BF/PMHub.html';
const b = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage', '--allow-file-access-from-files'], defaultViewport: { width: 1440, height: 900 } });
const p = await b.newPage();
await p.goto(FILE, { waitUntil: 'domcontentloaded' });
await p.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
await p.goto(FILE, { waitUntil: 'load' });
await new Promise(r => setTimeout(r, 900));
await p.evaluate(() => loadSample());
await new Promise(r => setTimeout(r, 1300));

const info = await p.evaluate(() => {
  const pathOf = (el) => { const a = []; let x = el; while (x && x !== document.body) { a.unshift(x.tagName + (x.id ? '#' + x.id : '') + (x.className && typeof x.className === 'string' ? '.' + x.className.trim().split(/\s+/).slice(0, 2).join('.') : '')); x = x.parentElement; } return a.join(' > '); };
  const visible = (el) => {
    let x = el; while (x && x !== document.body) { if (getComputedStyle(x).display === 'none') return false; x = x.parentElement; }
    const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0;
  };
  const all = [...document.querySelectorAll('input,textarea,select')].filter(i => i.type !== 'hidden');
  const vis = all.filter(visible);
  const unlabeled = vis.filter(i => !(i.getAttribute('aria-label') || i.getAttribute('placeholder') || i.getAttribute('title') || (i.id && document.querySelector(`label[for="${i.id}"]`)) || i.closest('label')));
  const group = {};
  unlabeled.forEach(i => { const k = pathOf(i).split('>').slice(0, 3).join('>').trim(); group[k] = (group[k] || 0) + 1; });
  return {
    totalInputs: all.length, visibleInputs: vis.length, unlabeledVisible: unlabeled.length,
    topAncestorGroups: Object.entries(group).sort((a, c) => c[1] - a[1]).slice(0, 10),
    detail: unlabeled.slice(0, 8).map(i => ({ path: pathOf(i).slice(0, 200), ph: i.placeholder || '', ce: i.isContentEditable, r: (() => { const r = i.getBoundingClientRect(); return [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)]; })() })),
  };
});
console.log(JSON.stringify(info, null, 2));
await b.close();
