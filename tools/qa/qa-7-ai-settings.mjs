/**
 * PMHub · v19.17「AI 设置页重排 + 去掉本地部署」验证（第 7 轮）
 *
 * 王上反馈：AI 设置页很杂乱、不要本地部署引导。
 *
 * 本脚本验证重排后的**渲染结果**（不是源码字符串）：
 *   1. 分组为 4 个带编号分区，连接配置在前、保存/测试同区
 *   2. 服务商下拉无本地部署选项；选中官方三家会自动填入官方 Base URL + 推荐模型
 *   3. 折叠区（数据边界 / 联网说明）默认收起，可见文案随之下降
 *   4. 所有既有控件 id 仍在（重排最容易出的错就是丢 id，保存就会静默丢字段）
 *   5. 端到端：填值 → 保存设置 → localStorage 落盘正确
 *   6. 页面内不出现本地部署相关字样
 *
 * 用法: bash tools/qa/run.sh qa-7-ai-settings.mjs
 */
import puppeteer from 'puppeteer';

const CHROME = 'C:/Users/xlq/.cache/puppeteer/chrome/win64-149.0.7790.0/chrome-win64/chrome.exe';
const APP = 'E:/WorkBuddy/work/prd%E7%9C%8B%E6%9D%BF/PMHub.html';

// 重排前实测：该 tab 可见文案 916 字（设置弹窗里最长一屏）
const BEFORE_CHARS = 916;

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

// 打开 设置 → 高级 → AI 设置
await page.evaluate(() => { const b = document.querySelector('[data-act="settings"]'); if (b) b.click(); });
await new Promise(r => setTimeout(r, 400));
await page.evaluate(() => { const b = document.querySelector('#settingsModal [data-tab="ai"]'); if (b) b.click(); });
await new Promise(r => setTimeout(r, 700));

// ── 1) 结构与分区 ──
{
  const s = await page.evaluate(() => {
    const el = document.getElementById('tabAI');
    const heads = [...el.querySelectorAll('.set-sec-h')].map(h => h.textContent.trim());
    const nums = [...el.querySelectorAll('.set-sec-n')].map(n => n.textContent.trim());
    return {
      sections: heads.length,
      heads,
      nums,
      // 保存/测试必须落在第 1 区（连接服务）内
      saveInFirst: !!el.querySelector('.set-sec .row-act [data-ai="savesettings"]'),
      details: el.querySelectorAll('details.set-more').length,
      detailsOpen: [...el.querySelectorAll('details.set-more')].filter(d => d.open).length,
      chars: el.innerText.replace(/\s/g, '').length,
    };
  });
  ok('重排为 4 个带编号的分区', s.sections === 4 && s.nums.join(',') === '1,2,3,4', s);
  ok('分区顺序为 连接服务 → 按任务分配模型 → 评分与优化护栏 → 联网搜索',
    s.heads[0].indexOf('连接服务') >= 0 && s.heads[1].indexOf('按任务分配模型') >= 0
    && s.heads[2].indexOf('评分与优化') >= 0 && s.heads[3].indexOf('联网搜索') >= 0, s.heads);
  ok('保存设置 / 测试连接 落在「连接服务」区内（原在最底部要滚一屏）', s.saveInFirst === true, s);
  ok('折叠区存在且默认全部收起', s.details >= 2 && s.detailsOpen === 0, s);
  ok(`可见文案由改前 ${BEFORE_CHARS} 字下降（折叠区默认收起生效）`,
    s.chars > 0 && s.chars < BEFORE_CHARS, { now: s.chars, before: BEFORE_CHARS });
  console.log(`      · AI 设置 tab 可见文案：${BEFORE_CHARS} → ${s.chars} 字`);
}

// ── 2) 服务商选项与自动填入 ──
{
  const s = await page.evaluate(() => {
    const sel = document.getElementById('aiProvider');
    const out = { options: [...sel.options].map(o => o.value), filled: {} };
    for (const p of ['deepseek', 'qwen', 'zhipu', 'openai', 'custom']) {
      sel.value = p;
      sel.dispatchEvent(new Event('change', { bubbles: true }));
      out.filled[p] = {
        base: (document.getElementById('aiBaseUrl') || {}).value || '',
        model: (document.getElementById('aiModel') || {}).value || '',
      };
    }
    out.hint = (document.getElementById('aiConnStatus') || {}).textContent || '';
    return out;
  });
  ok('服务商不再包含本地部署选项（ollama）', s.options.indexOf('ollama') < 0, s.options);
  ok('仍保留自定义 / DeepSeek / Qwen / 智谱 / OpenAI 五种',
    ['custom', 'deepseek', 'qwen', 'zhipu', 'openai'].every(p => s.options.indexOf(p) >= 0), s.options);
  ok('选中 DeepSeek 自动填入官方地址与推荐模型',
    /^https:\/\/api\.deepseek\.com\//.test(s.filled.deepseek.base) && !!s.filled.deepseek.model, s.filled.deepseek);
  ok('选中 Qwen 填入百炼 compatible-mode 地址',
    /dashscope\.aliyuncs\.com/.test(s.filled.qwen.base) && /compatible-mode/.test(s.filled.qwen.base) && !!s.filled.qwen.model, s.filled.qwen);
  ok('选中智谱填入 open.bigmodel.cn 地址（与 aiInferProvider 识别规则一致）',
    /open\.bigmodel\.cn/.test(s.filled.zhipu.base) && !!s.filled.zhipu.model, s.filled.zhipu);
  ok('选中 OpenAI 填入官方地址', /api\.openai\.com/.test(s.filled.openai.base) && !!s.filled.openai.model, s.filled.openai);
  ok('选择「自定义」不预填地址，交回用户', s.filled.custom.base === '' && s.filled.custom.model === '', s.filled.custom);
  ok('状态行给出可执行指引（含服务商名）', s.hint.indexOf('OpenAI') >= 0, s.hint);
}

// ── 3) 控件 id 完整性（重排最易出的错）──
{
  const s = await page.evaluate(() => {
    const ids = ['aiProvider', 'aiBaseUrl', 'aiKey', 'aiModel', 'aiFastModel', 'aiDeepModel', 'aiReviewModel',
      'aiTarget', 'aiRounds', 'aiWeb', 'aiWebProvider', 'aiWebKey', 'aiConnStatus', 'aiModelList'];
    const missing = ids.filter(i => !document.getElementById(i));
    const dims = [...document.querySelectorAll('#tabAI [id^="aiDimOn-"]')].length;
    const dimW = [...document.querySelectorAll('#tabAI [id^="aiDimW-"]')].length;
    const saveBtn = !!document.querySelector('#tabAI [data-ai="savesettings"]');
    const testBtn = !!document.querySelector('#tabAI [data-ai="testconn"]');
    const legends = [...document.querySelectorAll('#tabAI label')].filter(l => !l.getAttribute('for') && !l.querySelector('input')).length;
    return { missing, dims, dimW, saveBtn, testBtn, unlabeled: legends };
  });
  ok('全部既有控件 id 仍在（重排没有丢字段）', s.missing.length === 0, s.missing);
  ok('6 个评分维度的开关与权重输入都在', s.dims === 6 && s.dimW === 6, { on: s.dims, w: s.dimW });
  ok('保存设置 / 测试连接 按钮都在', s.saveBtn && s.testBtn, s);
}

// ── 4) 端到端：填值 → 保存 → localStorage ──
{
  const s = await page.evaluate(() => {
    const sel = document.getElementById('aiProvider');
    sel.value = 'zhipu'; sel.dispatchEvent(new Event('change', { bubbles: true }));
    document.getElementById('aiKey').value = 'TEST_AI_KEY_V17';
    document.getElementById('aiFastModel').value = 'glm-4.7-air';
    document.querySelector('#tabAI [data-ai="savesettings"]').click();
    const raw = JSON.parse(localStorage.getItem('prdKanbanAiSettings') || '{}');
    return { provider: raw.provider, base: raw.baseUrl, model: raw.model, key: raw.apiKey, fast: raw.fastModel, web: raw.web, target: raw.targetScore, rounds: raw.maxRounds, dims: Object.keys(raw.dims || {}).length };
  });
  ok('保存后服务商/地址/Key/快速模型正确落盘',
    s.provider === 'zhipu' && /open\.bigmodel\.cn/.test(s.base || '') && !!s.model && s.key === 'TEST_AI_KEY_V17' && s.fast === 'glm-4.7-air', s);
  ok('评分维度与护栏字段也完整落盘',
    s.dims === 6 && s.target != null && s.rounds != null, s);
}

// ── 5) 页面内不再出现本地部署引导 ──
{
  const s = await page.evaluate(() => {
    const t = document.getElementById('tabAI').innerText;
    return {
      hasLocalDeploy: /本地部署|本地模型|Ollama|ollama|localhost|11434|qwen3:8b/.test(t),
      preview: t.slice(0, 60),
    };
  });
  ok('AI 设置页可见文案不再出现本地部署引导', s.hasLocalDeploy === false, s);
}

await page.close();
await browser.close();

ok('运行期间无 console error / pageerror', errors.length === 0, errors.slice(0, 5));

const fail = checks.filter(c => !c.pass).length;
console.log(`\nAI 设置页断言：PASS=${checks.length - fail} FAIL=${fail}`);
process.exit(fail ? 1 : 0);
