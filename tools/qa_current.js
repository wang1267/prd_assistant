// 当前主文件的零依赖质量基线检查。
// 运行：node tools/qa_current.js
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const appFile = path.join(root, 'PRD智能看板.html');
const html = fs.readFileSync(appFile, 'utf8');
const failures = [];

function check(name, condition, detail = '') {
  if (condition) {
    console.log(`PASS  ${name}`);
  } else {
    failures.push(name);
    console.log(`FAIL  ${name}${detail ? ` >>> ${detail}` : ''}`);
  }
}

function scriptBodyById(id) {
  const pattern = new RegExp(`<script\\s+[^>]*\\bid=["']${id}["'][^>]*>([\\s\\S]*?)<\\/script>`, 'i');
  const match = html.match(pattern);
  return match ? match[1] : null;
}

const block1Start = html.indexOf('/* ============ SVG 图标常量');
const block1End = html.indexOf('</script>', block1Start);
const block1 = block1Start >= 0 && block1End >= 0 ? html.slice(block1Start, block1End) : null;
const aiController = scriptBodyById('ai-controller');

check('主应用文件存在且为当前版本', html.includes('版本 v18.65'), appFile);
check('AI 发送后立即创建深度思考状态，实际推理到达后流式替换', html.includes('深度思考已启动') && html.includes('正在理解你的想法，并找出最需要确认的一件事') && html.includes('m.reasoning||m.pending'));
check('AI 需求澄清支持小白从一句想法起步且不强制填写指标', html.includes('AI 需求澄清 · 从一句想法开始') && html.includes('先用一句话说说') && html.includes('不需要懂 PRD、指标或技术术语') && html.includes('AI 建议（待确认）'));
check('AI 需求澄清按信息缺口选择下一问，而不机械走固定题序', html.includes('不要按固定题序') && html.includes('当前最大的缺口') && html.includes('第一版最小范围'));
check('AI 澄清实时区分已理解、待确认与待确认假设，并检测明显矛盾', html.includes('我已理解') && html.includes('还需要确认') && html.includes('AI 暂定假设') && html.includes('aiDesConflictHints'));
check('AI 澄清先展示可编辑方案，确认后才调用逐节生成', html.includes('aiDesSkeletonModal') && html.includes('确认方案并生成 PRD') && html.includes('function aiDesConfirmSkeleton'));
check('设计模式功能需求使用固定交付字段并提示缺口', html.includes('目标：…；前置：…；主流程：…；异常/边界') && html.includes('缺少可交付字段'));
check('AI 需求澄清提供每轮单问题提示和不确定时的 AI 建议出口', html.includes('每次只需回答一个问题') && html.includes('data-ai="desadvise"') && html.includes('标记为待确认'));
check('AI 需求澄清不会因准备阶段异常永久卡在思考中，停止可在请求前生效', html.includes('function aiDesSend(forceEnd)') && html.includes('forceEnd=!!forceEnd') && html.includes("Promise.resolve().then(function(){\n    if(aiCancelFlag)throw {kind:'canceled'") && html.includes('return aiChat([{role:\'system\',content:sys}'));
check('健康度输出评审、研发、测试交付结论并标明红色阻塞', html.includes('function deliveryReadiness()') && html.includes('可进入评审') && html.includes('可进入研发') && html.includes('可进入测试') && html.includes('存在 '+"'+red+'"+' 个红色阻塞项'));
check('交付缺口按研发、测试、目标与建议优化排序，并保留展开项关联', html.includes('function gapImpact(h)') && html.includes('阻塞研发') && html.includes('阻塞测试') && html.includes('影响目标') && html.includes('建议优化') && html.includes('data-hi'));
check('需求追溯链连接用户需求、功能、验收、自测与埋点，P0 缺口阻断交付', html.includes('function traceabilityReport()') && html.includes('需求追溯链') && html.includes('基于共同关键词自动推断') && html.includes('const p0Ready=!trace.p0Gaps.length') && html.includes('P0 功能缺少关联验收或测试点'));
check('Markdown 与 Word 导出前均展示交付检查和追溯缺口', html.includes('id="exportPreflightModal"') && html.includes('function openExportPreflight') && html.includes("openExportPreflight('md'") && html.includes("openExportPreflight('docx'") && html.includes('仍然导出（继续编辑）'));
check('AI 检测问题展示可核对的来源与处理状态', html.includes("source:it.ruleId?'规则 '") && html.includes("'AI 推断'") && html.includes("'已忽略/误报'") && html.includes("'待处理'"));
check('跨章节规则覆盖追溯、目标埋点、权限状态、依赖风险与范围边界', html.includes("R-XCONS-01") && html.includes("R-XCONS-02") && html.includes("R-XCONS-03") && html.includes("R-XCONS-04") && html.includes("R-XCONS-05") && html.includes('function traceabilityReport()'));
check('AI 优化项关联原始问题，并在写入后记录规则复检结果', html.includes('function aiRelatedIssues') && html.includes('relatedIssues:aiRelatedIssues') && html.includes('function aiBuildRecheck') && html.includes('st.lastRecheck=aiBuildRecheck'));
check('AI 章节锁定持久化且拦截单条、批量和修改后写入', html.includes('function aiToggleSectionLock') && html.includes('data-ai="lock-section"') && html.includes("if(aiIsSectionLocked(it.sectionId)){aiToast('该节已锁定") && html.includes('if(aiIsSectionLocked(it.sectionId))return;'));
check('初始页四条主路径采用桌面双列与窄屏单列布局', html.includes('grid-template-columns:repeat(2,minmax(0,1fr))') && html.includes('@media(max-width:760px){.placeholder{max-width:560px}.wk-entries{grid-template-columns:1fr}}'));
check('场景模板默认提供小白可直接使用的场景卡片，并将 Markdown 编辑降级为高级入口', html.includes('id="tplGallery"') && html.includes('不需要会 Markdown') && html.includes('tplToggleAdvanced') && html.includes('AI 助手 / 智能功能') && html.includes('移动 App') && html.includes('SaaS / Web 服务') && html.includes('智能硬件 / 物联网'));
check('主脚本 block1 可提取', !!block1);
check('AI 控制器可提取', !!aiController);

if (block1) {
  try { new Function(block1); check('block1 语法有效', true); }
  catch (error) { check('block1 语法有效', false, error.message); }
}
if (aiController) {
  try { new Function(aiController); check('AI 控制器语法有效', true); }
  catch (error) { check('AI 控制器语法有效', false, error.message); }
}

const mirrors = [
  ['tools/block1.js', block1],
  ['tools/ai-controller.js', aiController],
];
for (const [relative, expected] of mirrors) {
  const file = path.join(root, relative);
  const actual = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
  check(`${relative} 与主文件同步`, actual === expected, actual === null ? '文件不存在；请先运行 node tools/sync_test_blocks.js' : '内容已过期；请先运行 node tools/sync_test_blocks.js');
}

check('未引用已删除的 newest.html', !html.includes('newest.html'));
check('设置页主题入口未重复', (html.match(/class="theme-opt"/g) || []).length === 3);
check('未保存主题时默认使用浅色', html.includes("t=(t==='light'||t==='dark'||t==='hc')?t:'light'"));
check('AI 总评维度展开不重排指标且有可访问状态', html.includes('class="dim-details"') && html.includes('aria-controls="dimd-') && html.includes("dim.setAttribute('aria-expanded','true')"));
check('重置提供三档范围与二次确认', html.includes('data-scope="projects"') && html.includes('data-scope="projectsTemplates"') && html.includes('data-scope="all"') && html.includes('data-act="resetconfirm"'));
check('全部重置覆盖独立本地数据键', html.includes("RESET_LOCAL_KEYS.aiSettings") && html.includes("RESET_LOCAL_KEYS.theme") && html.includes("STORAGE_KEY+'.bak'"));
check('删框架节先展示影响并提供归档或连内容删除', html.includes('id="fwDeleteModal"') && html.includes('data-act="fwdeleteconfirm"') && html.includes('归档到其他节') && html.includes('连内容删除'));
check('导入备份先预览覆盖范围并保存独立恢复点', html.includes('id="backupImportModal"') && html.includes('openBackupImportModal(incoming') && html.includes('RESET_LOCAL_KEYS.preImport') && html.includes('data-act="restorepreimport"'));
check('接近存储上限时提前提示备份与图片处理建议', html.includes('id="storageAdvice"') && html.includes('updateStorageAdvice(serialized)') && html.includes('单张尽量不超过 1 MB'));
check('AI 请求前展示服务商、发送范围与脱敏提醒', html.includes('function aiPrivacyConfirm') && html.includes('发送范围') && html.includes('敏感信息提醒') && html.includes('确认并发送'));
check('AI 隐私确认仅在首次使用时展示，确认状态本地保留', html.includes("AI_PRIVACY_ACK_KEY='prdKanbanAiPrivacyAckV1'") && html.includes('if(aiPrivacySeen.firstUse)') && html.includes('aiPrivacyMarkSeen()'));
check('多角色评审也经过 AI 隐私确认', html.includes("AIC.privacyConfirm({label:'多角色评审'") && html.includes('privacyConfirm:function(meta)'));
check('空白页提供四条主路径，含显式的新建空白项目入口与适用条件', html.includes('从想法开始') && html.includes('从空白开始') && html.includes('data-act="newproj"') && html.includes('导入已有 PRD') && html.includes('使用场景模板') && html.includes('约 5–10 分钟') && html.includes('适合已有需求文档'));
check('快速上手收敛为可直接执行的起步选择，不堆叠低频功能说明', html.includes('用 1 分钟开始第一份 PRD') && html.includes('只选一种最接近你的情况') && html.includes('data-act="wz-template"') && html.includes('data-act="wz-import"') && html.includes('创建后只做两件事') && !html.includes('多角色评审</strong>：产品 / 研发 / 测试'));
check('空白页只保留四条起步路径，不重复放置快速上手入口', !html.includes('查看 60 秒上手指南') && !html.includes('class="wk-guide"') && html.includes('id="importEntry"') && !html.includes('id="importCard"'));
check('文档导入先预览映射、未识别内容与覆盖范围', html.includes('id="importPreviewModal"') && html.includes('章节映射') && html.includes('确认前不会修改本地项目') && html.includes('beginImportPreview') && html.includes('applyImportPreview'));
check('自定义标题不会误匹配到标准定义节', html.includes('if(/^自定义/.test(t))return null;'));
check('示例 PRD 提供替换目标、体检和保留项目的下一步建议', html.includes('id=\'sampleNext\'') && html.includes('data-act="sample-edit"') && html.includes('data-act="sample-health"') && html.includes('data-act="sample-rename"'));
check('AI Key 仍使用独立存储键', html.includes("var AI_SETTINGS_KEY='prdKanbanAiSettings'"));
check('AI 写入仍保留待确认机制', html.includes('pendingDiffs') && html.includes('逐条确认'));
check('浮动编辑工具栏保存精确选区，仅提供行内格式且拒绝整段标题/引用格式', html.includes('let mfbBar=null,miniFmtRange=null,miniFmtEditor=null') && html.includes('function rememberMiniFmtRange') && html.includes("if(op==='h2'||op==='h3'||op==='quote')") && !html.includes('data-fmt="h2"') && !html.includes('data-fmt="h3"'));

console.log(`\n质量基线：${failures.length ? `失败 ${failures.length} 项` : '通过'}`);
process.exit(failures.length ? 1 : 0);
