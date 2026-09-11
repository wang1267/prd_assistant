/* ============================================================
 * ai.js · AI 原型生成模块
 * 定位：AI 只负责「自然语言 → HTML 原型页面」。
 *       需求撰写与元素连线仍由产品经理手动完成（产品红线）。
 *
 * 生成提示词由内置 Skill（js/ai-skill.js）提供：基于对 GitHub 上
 * screenshot-to-code / openui / onlook / napkins 等成熟项目的
 * prompt 工程调研提炼，支持「全新生成」与「基于当前原型迭代」两种
 * 消息构造，迭代时靠 system prompt 的锚点不变量保留 data-proto-id。
 *
 * 结构：
 *   AI.getCfg / saveCfg      配置（localStorage 键 protoReq.ai.v1，独立于业务数据）
 *   AI.isRemoteReady         是否已配置可用的 OpenAI 兼容接口
 *   AI.generate              统一生成入口（OpenAI 兼容；可携带当前原型走迭代）
 *   AI.extractHtml           从模型输出中提取完整单文件 HTML
 *   AI.addHistory / listHistory 生成历史
 * ============================================================ */
(function () {
  'use strict';

  var CFG_KEY = 'protoReq.ai.v1';
  var HISTORY_MAX = 20;

  /* ---------- 图标补充（供 app.js 使用） ---------- */
  if (window.U && U.ICONS && !U.ICONS.spark) {
    U.ICONS.spark = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/></svg>';
  }

  /* ==================== 配置 ==================== */

  var DEFAULTS = {
    endpoint: 'https://api.openai.com/v1/chat/completions',   // OpenAI 兼容接口
    apiKey: '',
    model: 'gpt-4o-mini',
    thinking: 'auto',
    maxTokens: 16384,
    histories: []
  };

  function getCfg() {
    if (window.PRD_MODE && PRD_MODE.readAIConfig) return PRD_MODE.readAIConfig();
    var c = {};
    try { c = JSON.parse(localStorage.getItem(CFG_KEY) || '{}') || {}; } catch (e) { c = {}; }
    var out = {};
    Object.keys(DEFAULTS).forEach(function (k) { out[k] = (c[k] === undefined || c[k] === null) ? DEFAULTS[k] : c[k]; });
    return out;
  }

  function saveCfg(patch) {
    var c = getCfg();
    Object.keys(patch || {}).forEach(function (k) { c[k] = patch[k]; });
    try { localStorage.setItem(CFG_KEY, JSON.stringify(c)); } catch (e) { /* ignore */ }
    return c;
  }

  function isRemoteReady() {
    var c = getCfg();
    return !!(c.apiKey && c.endpoint);
  }

  /* ==================== HTML 提取与校验 ==================== */

  function extractHtml(text) {
    if (!text) return null;
    var m = text.match(/```(?:html)?\s*\n?([\s\S]*?)```/i);
    var cand = (m ? m[1] : text).trim();
    /* 截掉代码块之前的说明文字 */
    var dm = cand.match(/<!DOCTYPE html/i);
    if (dm && dm.index > 0) cand = cand.slice(dm.index);
    /* 截掉 </html> 之后模型追加的说明文字 */
    var em = cand.match(/<\/html>/i);
    if (em) cand = cand.slice(0, em.index + em[0].length);
    if (/^<!DOCTYPE html/i.test(cand) || /^<html[\s>]/i.test(cand)) {
      if (/<body[\s>]/i.test(cand)) return cand;
    }
    /* 容错：模型只给了 <body> 片段 */
    var bm = cand.match(/<body[\s\S]*<\/body>/i);
    if (bm) {
      return '<!DOCTYPE html>\n<html lang="zh-CN">\n<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>\n' +
        bm[0].replace(/<body/i, '<body style="margin:0"') + '\n</html>';
    }
    return null;
  }

  function normalizeContent(value) {
    if (typeof value === 'string') return value;
    if (Array.isArray(value)) {
      return value.map(function (part) {
        if (typeof part === 'string') return part;
        return part && (part.text || part.content || part.output_text) || '';
      }).join('');
    }
    if (value && typeof value === 'object') return value.text || value.content || value.output_text || '';
    return '';
  }

  function modelProfile(cfg) {
    var name = String(cfg.model || '').toLowerCase();
    var endpoint = String(cfg.endpoint || '').toLowerCase();
    var family = /^glm-|bigmodel|zhipu|z\.ai/.test(name + ' ' + endpoint) ? 'glm'
      : (/^qwen|dashscope/.test(name + ' ' + endpoint) ? 'qwen'
        : (/^o\d|^gpt-5/.test(name) ? 'openai-reasoning'
          : (/deepseek-reasoner/.test(name) ? 'reasoning' : 'generic')));
    var configured = parseInt(cfg.maxTokens, 10);
    var thinking = cfg.thinking === 'enabled' || cfg.thinking === 'disabled' ? cfg.thinking : 'auto';
    return {
      family: family,
      thinking: thinking,
      maxTokens: Math.max(1024, Math.min(131072, configured || 16384)),
      tokenField: family === 'openai-reasoning' ? 'max_completion_tokens' : 'max_tokens',
      temperature: family === 'reasoning' || family === 'openai-reasoning' ? null : (family === 'glm' ? 0.7 : 0.4)
    };
  }

  function validateGeneratedHtml(html) {
    var s = String(html || '');
    var issues = [];
    if (s.length < 300) issues.push('HTML 内容过短');
    if (!/<html[\s>]/i.test(s)) issues.push('缺少 html 根节点');
    if (!/<body[\s>]/i.test(s) || !/<\/body>/i.test(s)) issues.push('body 标签不完整');
    if (!/<\/html>/i.test(s)) issues.push('缺少 html 结束标签');
    var openStyle = (s.match(/<style\b/gi) || []).length;
    var closeStyle = (s.match(/<\/style>/gi) || []).length;
    if (openStyle !== closeStyle) issues.push('style 标签未闭合');
    var openScript = (s.match(/<script\b/gi) || []).length;
    var closeScript = (s.match(/<\/script>/gi) || []).length;
    if (openScript !== closeScript) issues.push('script 标签未闭合');
    return issues;
  }

  async function requestChat(cfg, messages, opts) {
    var profile = modelProfile(cfg);
    var body = {
      model: cfg.model || 'gpt-4o-mini',
      messages: messages
    };
    var temperature = opts && opts.temperature !== undefined ? opts.temperature : profile.temperature;
    if (temperature !== null) body.temperature = temperature;
    body[profile.tokenField] = opts && opts.maxTokens ? opts.maxTokens : profile.maxTokens;

    /* 能力差异集中在适配层：通用流程不感知具体模型。 */
    var thinkingType = profile.thinking === 'auto' ? 'disabled' : profile.thinking;
    if (profile.family === 'glm') body.thinking = { type: thinkingType };
    if (profile.family === 'qwen') body.enable_thinking = thinkingType === 'enabled';

    var res;
    try {
      res = await fetch(cfg.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + cfg.apiKey
        },
        body: JSON.stringify(body),
        signal: opts && opts.signal
      });
    } catch (e) {
      if (e && e.name === 'AbortError') throw e;
      throw new Error('网络请求失败：' + (e && e.message ? e.message : '无法连接接口') + '。可检查接口地址是否正确、是否可访问');
    }

    if (!res.ok) {
      var detail = '';
      try { detail = (await res.text()).slice(0, 240); } catch (e2) { /* ignore */ }
      /* 一些兼容网关不接受供应商扩展字段或只接受另一种 token 字段，自动降级一次。 */
      if ((res.status === 400 || res.status === 422) && (body.thinking || body.enable_thinking !== undefined || /max_(?:completion_)?tokens|temperature|unsupported parameter|unknown field/i.test(detail))) {
        var fallbackBody = {};
        Object.keys(body).forEach(function (key) { fallbackBody[key] = body[key]; });
        delete fallbackBody.thinking;
        delete fallbackBody.enable_thinking;
        if (/temperature|unsupported parameter/i.test(detail)) delete fallbackBody.temperature;
        if (/max_completion_tokens/i.test(detail) && fallbackBody.max_tokens !== undefined) {
          fallbackBody.max_completion_tokens = fallbackBody.max_tokens;
          delete fallbackBody.max_tokens;
        } else if (/max_tokens/i.test(detail) && fallbackBody.max_completion_tokens !== undefined) {
          fallbackBody.max_tokens = fallbackBody.max_completion_tokens;
          delete fallbackBody.max_completion_tokens;
        }
        res = await fetch(cfg.endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + cfg.apiKey },
          body: JSON.stringify(fallbackBody),
          signal: opts && opts.signal
        });
        if (!res.ok) {
          try { detail = (await res.text()).slice(0, 240); } catch (e4) { /* ignore */ }
        }
      }
      if (!res.ok) throw new Error('接口返回 ' + res.status + (detail ? '：' + detail : '') + '。可检查 Key / 模型名和兼容参数是否正确');
    }

    var data;
    try { data = await res.json(); } catch (e3) { throw new Error('接口响应不是合法 JSON'); }
    var choice = data && data.choices && data.choices[0];
    var message = choice && choice.message || {};
    var content = normalizeContent(message.content || (choice && choice.text) || data.output_text);
    if (!content && message.tool_calls && message.tool_calls[0] && message.tool_calls[0].function) {
      try {
        var args = JSON.parse(message.tool_calls[0].function.arguments || '{}');
        content = normalizeContent(args.html || args.content);
      } catch (e5) { /* ignore malformed tool output */ }
    }
    var reasoning = normalizeContent(message.reasoning_content);
    return {
      content: content,
      reasoning: reasoning,
      candidate: content || reasoning,
      finishReason: choice && choice.finish_reason || '',
      usage: data && data.usage || null
    };
  }

  /* ==================== 远端生成（OpenAI 兼容） ==================== */

  async function generateRemote(userInput, opts) {
    opts = opts || {};
    var cfg = getCfg();
    if (!cfg.apiKey) throw new Error('尚未配置 API Key，请先完成「接口配置」');
    if (!cfg.endpoint) throw new Error('接口地址为空，请先完成「接口配置」');

    var currentHtml = opts.currentHtml || null;
    var optimize = !!opts.optimize;
    var messages = [
      { role: 'system', content: ProtoSkill.SYSTEM_PROMPT },
      {
        role: 'user',
        content: optimize
          ? ProtoSkill.buildOptimizeMessage(userInput, currentHtml)
          : currentHtml
          ? ProtoSkill.buildIterateMessage(userInput, currentHtml)
          : ProtoSkill.buildCreateMessage(userInput)
      }
    ];

    var first = await requestChat(cfg, messages, { signal: opts.signal });
    var html = extractHtml(first.candidate);
    var issues = validateGeneratedHtml(html);
    if (html && !issues.length) return html;

    /* 成熟生成器都会在展示前执行“生成 → 校验 → 一次修复”的闭环。 */
    var failure = issues.length ? issues.join('、') : (first.finishReason === 'length' ? '输出被截断' : '没有可解析的 HTML 正文');
    var repairMessages = messages.concat([
      { role: 'assistant', content: String(first.candidate || '').slice(0, 60000) },
      {
        role: 'user',
        content: '上一次输出未通过检查：' + failure + '。请重新输出从 <!DOCTYPE html> 到 </html> 的完整单文件 HTML，只输出代码本身，不要解释或使用 Markdown 围栏。'
      }
    ]);
    var repaired = await requestChat(cfg, repairMessages, { signal: opts.signal, temperature: 0.2 });
    html = extractHtml(repaired.candidate);
    issues = validateGeneratedHtml(html);
    if (!html || issues.length) {
      var reason = issues.length ? issues.join('、') : (repaired.finishReason === 'length' ? '输出仍被截断' : '模型仍未返回 HTML 正文');
      throw new Error('原型生成失败：' + reason + '。系统已自动重试一次；请检查模型输出上限或改用代码能力更强的模型');
    }
    return html;
  }

  /* ==================== 统一入口 ==================== */

  /**
   * AI.generate(prompt, { signal, currentHtml }) → Promise<{html, provider, model}>
   * currentHtml 存在时走迭代模式：基于当前原型按描述修改（含 data-proto-id 锚点）。
   */
  async function generate(userInput, opts) {
    var html = await generateRemote(userInput, opts);
    return { html: html, provider: 'remote', model: getCfg().model };
  }

  /* 编辑器调用：复用统一模型适配、校验与自动修复链路，仅替换内置提示词。 */
  async function optimizePrototype(userInput, currentHtml, opts) {
    opts = opts || {};
    opts.currentHtml = currentHtml;
    opts.optimize = true;
    var html = await generateRemote(userInput, opts);
    return { html: html, provider: 'remote', model: getCfg().model };
  }

  /**
   * 用一次极小的 Chat Completions 请求验证地址、Key 和模型是否可用。
   * 不复用 /models：不少兼容服务未实现该端点；也不要求返回 HTML，避免
   * 将连通性问题和原型生成契约混在一起。
   */
  async function testConnection(opts) {
    opts = opts || {};
    var cfg = getCfg();
    if (!cfg.apiKey) throw new Error('请先填写 API Key');
    if (!cfg.endpoint) throw new Error('请先填写接口地址');
    var result = await requestChat(cfg, [{ role: 'user', content: '只回复 OK' }], {
      signal: opts.signal,
      temperature: 0,
      maxTokens: 32
    });
    if (!String(result.candidate || '').trim()) throw new Error('接口可连接，但模型没有返回正文内容');
    return { model: cfg.model || 'gpt-4o-mini' };
  }

  /* ==================== 生成历史 ==================== */

  function addHistory(rec) {
    var cfg = getCfg();
    cfg.histories = [{
      id: U.uid('aih'),
      prompt: String(rec.prompt || '').slice(0, 200),
      page_id: rec.page_id || null,
      provider: rec.provider || 'remote',
      model: rec.model || '',
      created_at: Date.now()
    }].concat(cfg.histories || []).slice(0, HISTORY_MAX);
    saveCfg({ histories: cfg.histories });
  }

  function listHistory() {
    return getCfg().histories || [];
  }

  /* ==================== 导出 ==================== */

  window.AI = {
    requestText: function (messages, opts) { return requestChat(getCfg(), messages, opts || {}); },
    getCfg: getCfg,
    saveCfg: saveCfg,
    isRemoteReady: isRemoteReady,
    generate: generate,
    optimizePrototype: optimizePrototype,
    testConnection: testConnection,
    extractHtml: extractHtml,
    addHistory: addHistory,
    listHistory: listHistory
  };
})();
