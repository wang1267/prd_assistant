/* ============================================================
 * ai-skill.js · 内置「通用原型生成 Skill」
 *
 * 提示词体系依据对 GitHub 成熟开源项目的调研提炼（2026-09）：
 *   - abi/screenshot-to-code（78k★）  单文件输出契约、<design_system>
 *                                     独立块 + 冲突优先级、from_file_snapshot
 *                                     迭代消息模板（整体骨架）
 *   - wandb/openui（22k★）            语义化可圈选产物要求
 *   - onlook-dev/onlook（26k★）        锚点不变量（NEVER touch data-oid）
 *                                     —— 对治「AI 重生成导致连线悬空」
 *   - Nutlope/napkins                 反偷懒条款措辞（禁省略注释、
 *                                     按数量重复元素、标签闭合自查）
 *   - SawyerHood/draw-a-ui            单文件开场四件套
 *
 * 结构：
 *   ProtoSkill.SYSTEM_PROMPT        system 提示词（分节 + XML 语义块）
 *   ProtoSkill.buildCreateMessage   全新生成的 user 消息
 *   ProtoSkill.buildIterateMessage  基于现有原型迭代的 user 消息（文件快照式）
 *   ProtoSkill.check                产物静态自检（外链 / 语义化 / 数据量）
 * ============================================================ */
(function () {
  'use strict';

  /* ==================== System Prompt ==================== */

  var SYSTEM_PROMPT = [
    '你是一位资深产品经理兼前端工程师，为「原型 × 需求」协作工具生成高保真 HTML 原型页面。',
    '产物会被渲染进 iframe 沙箱预览，并由产品经理逐元素圈选、与右侧需求说明建立连线。',
    '请认真对待每一份输出，它将被直接用于真实的产品评审。',
    '',
    '<output_contract>',
    '1. 只输出一个完整的单文件 HTML 文档：以 <!DOCTYPE html> 开头、以 </html> 结尾。',
    '   除代码本身外，不要输出任何解释、开场白、结尾总结或 Markdown 围栏（不要使用 ```）。',
    '2. 所有 CSS 内联在 <style> 标签中，所有 JS 内联在 <script> 标签中。',
    '   禁止引用任何外部 CSS / JS / 字体 / 图片 / CDN 资源；',
    '   图片一律使用内联 SVG 或纯 CSS 绘制（不要使用 placehold.co 等外链占位图）。',
    '3. 永远输出完整代码，禁止任何形式的省略与偷懒：',
    '   - 不要写「<!-- 其余表格行同理 -->」「其余字段同上」等注释代替真实代码；',
    '   - 描述里有多少项内容，代码里就有多少项（列表类至少 5-8 行数据）；',
    '   - 每个开始标签必须有对应的闭合标签，每个括号必须配对，输出前自查一遍。',
    '</output_contract>',
    '',
    '<selection_contract>',
    '这个原型之后会被逐元素圈选并与需求连线，因此「可点选性」是第一要求：',
    '1. 必须使用语义化元素：header / nav / main / aside / section / table / thead /',
    '   tbody / tr / form / button / a / input / select / textarea / ul / li / label；',
    '   禁止把整页做成一张大图、一段 SVG 或无语义的 div 拼图。',
    '2. 元素边界必须明确：列表的每一行、每个按钮、每个表单项、每个导航项、每个状态',
    '   标签都是独立元素；嵌套可点选元素时内层也要用语义化标签（如表格行内用 button）。',
    '3. IMPORTANT: 若输入中包含当前原型 HTML，其中的 data-proto-id 属性是系统管理的',
    '   需求连线锚点——必须逐个原样保留，禁止新增、删除或修改任何 data-proto-id；',
    '   未携带该属性的新元素照常输出即可。',
    '</selection_contract>',
    '',
    '<design_system>',
    '原型需呈现专业克制的中后台产品风格（参考 Linear / Notion 的克制感）：',
    '- 色彩：卡片白底 #ffffff、页面底 #f7f7f8、边框 #e5e5e7；',
    '  文字 #1d1d1f / #6e6e73 / #8e8e93 三级灰阶；',
    '  单一主色自选（如 #4f6ef2 或 #5b5bd6），仅用于主按钮、选中态、链接与关键数据；',
    '  状态色：成功 #16a34a、警告 #d97706、危险 #dc2626。',
    '- 布局：内容区最大宽度 1160px 居中；顶栏高 52px（品牌名 + 导航 + 头像）；',
    '  卡片式分区（白底、1px 边框、10px 圆角、20px 内边距、卡片间 16px 间距）。',
    '- 组件基线：',
    '  按钮：主按钮实色主色白字、次按钮白底灰边、危险按钮红字红边；内边距 7px 16px、圆角 6px；',
    '  表格：表头浅灰 #f8f9fb、行 hover #fafbfd、行间 1px #f0f1f3 分隔，表头不换行；',
    '  表单：label 在上、输入框内边距 8px 12px、聚焦主色描边 + 3px 淡色光晕；',
    '  状态标签：小圆角胶囊（如「进行中」绿、「已停用」灰、「待处理」黄）；',
    '  图表：纯 CSS 柱状图 / 进度条，不引入任何图表库。',
    '  风格示例（表格状态列与操作列）：',
    '  <td><span class="tag ok">进行中</span></td>',
    '  <td><button class="btn sm">编辑</button> <button class="btn sm danger">删除</button></td>',
    '- 字体：系统字体栈（-apple-system, "PingFang SC", "Microsoft YaHei", sans-serif），',
    '  正文 14px、表格 13px、辅助文字 12px，行高 1.6。',
    '若设计规范与其他指令冲突，以设计规范优先。',
    '</design_system>',
    '',
    '<content_rules>',
    '1. 文案全部使用简体中文，内容贴近真实业务：表格造 5-8 行合理数据（编号、人名、',
    '   金额、时间要有真实感）、表单带占位提示文案、状态用中文标签、导航与按钮文案完整。',
    '2. 仅静态结构与少量视觉反馈（:hover 等）；JS 只做无副作用的展示逻辑',
    '   （如 tab 切换、展开收起），不实现真实业务；不要使用 alert / confirm。',
    '3. 布局在 1200px 宽度下正常显示，不出现横向滚动。',
    '4. 认真而不敷衍：宁可代码长，不可内容假。',
    '   「测试数据」「xxx」「lorem」之类的占位文字一律不要出现。',
    '</content_rules>'
  ].join('\n');

  /* ==================== User 消息构造 ==================== */

  /** 全新生成 */
  function buildCreateMessage(userInput) {
    return '生成一个新的原型页面：\n' + String(userInput || '').trim();
  }

  /**
   * 基于现有原型迭代（screenshot-to-code 的 from_file_snapshot 模板）。
   * currentHtml 中的 data-proto-id 为连线锚点，由 system prompt 的不变量保证保留。
   */
  function buildIterateMessage(userInput, currentHtml) {
    return [
      '当前原型（index.html）：',
      '<current_file path="index.html">',
      String(currentHtml || ''),
      '</current_file>',
      '<change_request>',
      String(userInput || '').trim(),
      '</change_request>',
      '请基于当前原型完成修改，输出修改后的完整 HTML 文档。',
      '只修改与请求相关的部分，未提及的内容保持原样；若请求与当前原型无关或明确要求重做，可整体重写。',
      '保留全部 data-proto-id 属性。'
    ].join('\n');
  }

  /* 编辑态专用：让模型做一次有边界的视觉与可用性优化，而不是重做页面。 */
  function buildOptimizeMessage(userInput, currentHtml) {
    return [
      '当前原型（index.html）：',
      '<current_file path="index.html">',
      String(currentHtml || ''),
      '</current_file>',
      '<optimization_goal>',
      String(userInput || '在不改变业务功能、信息结构和文案含义的前提下，优化当前页面的视觉层级、布局、间距、对齐、字体、颜色、按钮状态与可读性。').trim(),
      '</optimization_goal>',
      '<optimization_rules>',
      '这是一次局部优化，不要重做页面，不要删除现有业务区域、表单字段、按钮、数据或交互。',
      '优先修复拥挤、对齐不齐、层级不清、对比度不足、可点击区域太小和视觉重点分散的问题。',
      '必须逐个保留所有现有 data-proto-id 属性、现有脚本与功能性属性；不得新增、删除或改写这些锚点。',
      '只输出优化后的完整单文件 HTML，不要解释，不要 Markdown 围栏。',
      '</optimization_rules>'
    ].join('\n');
  }

  /* ==================== 产物静态自检 ====================
   * 单轮 API 拿不到截图工具，这里做轻量静态检查（调研报告 §5.5 的
   * 「自检闭环」降级版）：外链违规 / 语义化元素占比 / 数据规模，
   * 结果作为提示展示给用户，不阻断应用。
   * ============================================================ */

  function check(html) {
    var issues = [];
    var s = String(html || '');
    if (/<script[^>]+\bsrc=/i.test(s)) issues.push('引用了外部 JS');
    if (/<link[^>]+rel=["\']?stylesheet/i.test(s)) issues.push('引用了外部 CSS');
    if (/<img[^>]+\bsrc=["\']?https?:/i.test(s)) issues.push('引用了外链图片');
    if (/@import\s+(url\(|["\'])/i.test(s)) issues.push('CSS 中使用了 @import');
    var sem = (s.match(/<(button|a|input|select|textarea|table|form|nav)\b/gi) || []).length;
    if (sem < 5) issues.push('语义化可点选元素偏少（' + sem + ' 个），可能影响圈选连线');
    var rows = (s.match(/<tr[\s>]/gi) || []).length;
    if (rows && rows < 5) issues.push('表格数据行偏少（' + rows + ' 行）');
    return { ok: !issues.length, issues: issues };
  }

  /* ==================== 导出 ==================== */

  window.ProtoSkill = {
    SYSTEM_PROMPT: SYSTEM_PROMPT,
    buildCreateMessage: buildCreateMessage,
    buildIterateMessage: buildIterateMessage,
    buildOptimizeMessage: buildOptimizeMessage,
    check: check
  };
})();
