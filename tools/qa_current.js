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

check('主应用文件存在且为当前版本', html.includes('版本 v19.11 · 联网研究闭环'), appFile);
check('AI 发送后立即创建深度思考状态，实际推理到达后流式替换', html.includes('深度思考已启动') && html.includes('正在理解你的想法，并找出最需要确认的一件事') && html.includes('m.reasoning||m.pending'));
check('AI 需求澄清支持小白从一句想法起步且不强制填写指标', html.includes('AI 需求澄清 · 从一句想法开始') && html.includes('先用一句话说说') && html.includes('不需要懂 PRD、指标或技术术语') && html.includes('AI 建议（待确认）'));
check('AI 需求澄清按信息缺口选择下一问，而不机械走固定题序', html.includes('不要按固定题序') && html.includes('当前最大的缺口') && html.includes('第一版最小范围'));
check('AI 需求澄清将问题、回答与已确认事实一起带入下一轮，避免同义重复追问', html.includes('function aiDesTranscript()') && html.includes('function aiDesFactsText()') && html.includes('aiDesState.turns.push({question:aiDesState.lastQuestion') && html.includes('不得换一种说法重复提问') && html.includes('只要已有回答足以确定某个信息'));
check('AI 澄清实时区分已理解、待确认与待确认假设，并检测明显矛盾', html.includes('我已理解') && html.includes('还需要确认') && html.includes('AI 暂定假设') && html.includes('aiDesConflictHints'));
check('AI 澄清先展示可编辑方案，确认后才调用逐节生成', html.includes('aiDesSkeletonModal') && html.includes('确认方案并生成 PRD') && html.includes('function aiDesConfirmSkeleton'));
check('AI 需求澄清不把 Vibe Coding 默认写成产品 AI 功能，只在影响方案时追问', html.includes('产品能力默认不含 AI') && html.includes('AI 只用来帮你开发它') && html.includes('产品中的 AI 功能边界') && html.includes('严禁自行加入 AI 助手'));
check('AI 生成前由用户填写项目名，AI 名称仅作可编辑建议且不能为空', html.includes('id="aiDesProjectName"') && html.includes('项目名称（由你决定）') && html.includes('AI 的名称建议仅供参考，不会自动采用') && html.includes('请先为项目取个名字') && html.includes("aiDesState.name=projectName"));
check('从想法开始默认使用独立的通用产品目录，不继承旧项目或 AI 专属模板', html.includes('id="aiDesFramework"') && html.includes('通用产品 PRD（推荐，14 节）') && html.includes('__IDEA_STANDARD__') && html.includes("else if(frameworkId==='__IDEA_STANDARD__'){fw=deep(DEFAULT_FRAMEWORK);}") && html.includes('不会继承旧项目，也不会默认套用 AI 专属目录'));
check('设计模式功能需求使用固定交付字段并提示缺口', html.includes('目标：…；前置：…；主流程：…；异常/边界') && html.includes('缺少可交付字段'));
check('AI 需求澄清提供每轮单问题提示和不确定时的 AI 建议出口', html.includes('每次只需回答一个问题') && html.includes('data-ai="desadvise"') && html.includes('标记为待确认'));
check('AI 需求澄清每 10 轮回答提供继续完善或查看方案的自主检查点', html.includes('id=\'aiDesCheckpointModal\'') && html.includes('已完成 10 轮需求澄清') && html.includes('data-ai="descheckpointcontinue"') && html.includes('data-ai="descheckpointgenerate"') && html.includes('aiDesState.turns.length%10===0') && html.includes('checkpointAt'));
check('AI 需求澄清不再按三轮提前打断，而是保留完成汇总、跳过和每 10 轮自主检查点', !html.includes('function aiDesReadiness()') && !html.includes('data-ai="desreadyfinish"') && !html.includes('现在先生成一版'));
check('AI 生成前用可手动编辑的动态方案卡与自由补充替代固定六张卡，并保留高级全文编辑', html.includes('id="aiDesSkeletonCards"') && html.includes('function aiDesAbsorbRoundCards') && html.includes('data-desplan-card') && html.includes('data-ai="desaddplancard"') && html.includes('还有想自己补充的吗？') && html.includes('id="aiDesManualInput"') && html.includes('高级：查看或手动编辑完整方案'));
check('每轮方案卡由全部对话累积整理，展示全部对话依据并将关键取舍交由用户确认', html.includes('【本轮方案卡】') && html.includes('function aiDesAppendRoundCards') && html.includes('查看本次方案依据（全部对话）') && html.includes('function aiDesRenderDecisionCards') && html.includes('data-ai="desdecisionrecommend"'));
check('用户主动让 AI 建议时以内容卡展示三条有取舍方向，兼容单行输出并提供 A/B/C/D 选择且文本不塞进按钮', html.includes('【三条建议】') && html.includes('我不确定，让 AI 建议。请结合我前面的描述给出三个可选方向') && html.includes('function aiDesAbsorbRecommendations') && html.includes('var re=/(?:^|\\s)([123])') && html.includes("aria-label=\"选择方案 '+letter+'\"") && html.includes('data-ai="deswriterecommend"') && html.includes('D · 我自己填写') && html.includes('已填入输入框，你可以修改后再发送'));
check('用户主动请求三条建议时，AI 被要求停止追问并等待 A/B/C/D 选择', html.includes('必须等待用户点选 A/B/C/D') && html.includes("if(aiDesState.adviceRequested&&t.indexOf('【三条建议】')>=0)") && html.includes("}else if(!aiDesState.adviceRequested&&t.indexOf('【进入下一题】')>=0)"));
check('联网竞品研究优先支持 DeepSeek、Qwen、GLM：Responses 检索或 GLM 真实检索结果受证据分析，GLM 用户确认后强制实际搜索且不向普通聊天猜测性注入工具参数', html.includes("deepseek:'responses'") && html.includes("qwen:'responses'") && html.includes("zhipu:'zhipu-search'") && html.includes("tools:[{type:'web_search'}]") && html.includes("tool_choice:{type:'web_search'}") && html.includes('https://open.bigmodel.cn/api/paas/v4/web_search') && html.includes('search_intent:false') && html.includes('function aiResearchPayloadError(payload)') && html.includes('未取得可展示来源') && !html.includes('if(st.web&&!opts.json)aiApplyWebSearch(body,st);'));
check('需求澄清每约 5 轮仅在 AI 确认后单独询问竞品研究；研究可停止、存入本次记忆并基于结果追问', html.includes('function aiDesShouldOfferResearch') && html.includes('n-aiDesState.researchPromptAt>=5') && html.includes('researchCheckAfterReply') && html.includes('pendingNextQuestion') && html.includes('function aiDesStartResearch') && html.includes('正在联网搜索') && html.includes('aiDesStopControl(true)') && html.includes('已存入本次需求记忆') && html.includes('function aiDesResearchFollowup') && html.includes('查看实际搜索来源'));
check('想法生成完成后提供可复制的 Coding Agent 交接摘要，不扩展为任务管理', html.includes('function aiDesBuildHandoff') && html.includes('Coding Agent 交接摘要') && html.includes('data-ai="deshandoffcopy"') && html.includes('handoff:aiGenMode===\'design\''));
check('从想法开始在发起或确认生成前校验标准模型配置', html.includes('function aiDesConfigReady') && html.includes("aiModelFor('standard',st)") && html.includes('API Key、地址和标准模型'));
check('AI 需求澄清不会因准备阶段异常永久卡在思考中，停止可在请求前生效', html.includes('function aiDesSend(forceEnd)') && html.includes('forceEnd=!!forceEnd') && /Promise\.resolve\(\)\.then\(function\(\)\{\s*if\(aiCancelFlag\)throw \{kind:'canceled'/.test(html) && html.includes('var collected=aiDesTranscript();') && html.includes('return aiChat([{role:\'system\',content:sys}'));
check('健康度输出评审、研发、测试交付结论并标明红色阻塞', html.includes('function deliveryReadiness()') && html.includes('可进入评审') && html.includes('可进入研发') && html.includes('可进入测试') && html.includes('存在 '+"'+red+'"+' 个红色阻塞项'));
check('交付缺口按研发、测试、目标与建议优化排序，并保留展开项关联', html.includes('function gapImpact(h)') && html.includes('阻塞研发') && html.includes('阻塞测试') && html.includes('影响目标') && html.includes('建议优化') && html.includes('data-hi'));
check('需求追溯链连接用户需求、功能、验收、自测与埋点，P0 缺口阻断交付', html.includes('function traceabilityReport()') && html.includes('需求追溯链') && html.includes('基于共同关键词自动推断') && html.includes('const p0Ready=!trace.p0Gaps.length') && html.includes('P0 功能缺少关联验收或测试点'));
check('Markdown 与 Word 导出前均展示交付检查和追溯缺口', html.includes('id="exportPreflightModal"') && html.includes('function openExportPreflight') && html.includes("openExportPreflight('md'") && html.includes("openExportPreflight('docx'") && html.includes('仍然导出（继续编辑）'));
check('AI 检测问题展示可核对的来源与处理状态', html.includes("source:it.ruleId?'规则 '") && html.includes("'AI 推断'") && html.includes("'已忽略/误报'") && html.includes("'待处理'"));
check('跨章节规则覆盖追溯、目标埋点、权限状态、依赖风险与范围边界', html.includes("R-XCONS-01") && html.includes("R-XCONS-02") && html.includes("R-XCONS-03") && html.includes("R-XCONS-04") && html.includes("R-XCONS-05") && html.includes('function traceabilityReport()'));
check('AI 优化项关联原始问题，并在写入后记录规则复检结果', html.includes('function aiRelatedIssues') && html.includes('relatedIssues:aiRelatedIssues') && html.includes('function aiBuildRecheck') && html.includes('st.lastRecheck=aiBuildRecheck'));
check('AI 章节锁定持久化且拦截单条、批量和修改后写入', html.includes('function aiToggleSectionLock') && html.includes('data-ai="lock-section"') && html.includes("if(aiIsSectionLocked(it.sectionId)){aiToast('该节已锁定") && html.includes('if(aiIsSectionLocked(it.sectionId))return;'));
check('多角色评审会同步为带角色署名的章节或全局评论，并在删历史时一并清理', html.includes('function rvSyncReviewComments') && html.includes("by:'AI 评审 · '") && html.includes("source:'ai-review'") && html.includes('function rvRemoveReviewComments') && html.includes('已删除该次评审及其 AI 评论'));
check('评审支持一次授权后的安全自动优化：携带评审建议、跳过锁定项并保留校验与复核', html.includes('function rvOptimizeReview') && html.includes('runReviewOptimize') && html.includes('function aiReviewOptimizeLines') && html.includes('不得为满足建议而编造需求') && html.includes('if(options.autoApply&&items.length)') && html.includes('aiAcceptAll();'));
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
check('项目助手每轮带入当前项目正文和质量状态，并在切换项目时清空旧对话', html.includes('function aiChatProjectKnowledge()') && html.includes('【当前项目完整知识】') && html.includes('【文档框架与正文】') && html.includes('【当前质量状态】') && html.includes('function aiChatEnsureProject()') && html.includes('aiChatState.projectId!==p.id') && html.includes("slice(-12)") && html.includes('当前已确认」「AI 建议」「仍待确认'));
check('项目助手的当前日期由本机时间确定性回答，并把日期注入普通对话提示，避免模型猜测', html.includes('function aiLocalDateText()') && html.includes('function aiChatDateAnswer(text)') && html.includes('今天是\'+aiLocalDateText()') && html.includes('当前客户端日期是 \'+aiLocalDateText()') && html.includes('var localDateReply=aiChatDateAnswer(text)'));
check('旧版官方 DeepSeek/Qwen/GLM 地址会安全识别服务商，第三方代理仍保持自定义', html.includes('function aiInferProvider(provider,baseUrl)') && html.includes("return 'zhipu'") && html.includes("return 'deepseek'") && html.includes("return 'qwen'") && html.includes('def.provider=aiInferProvider(def.provider,def.baseUrl)'));
check('项目助手的可见即可做入口支持小白提问与当前项目提示', html.includes('ai-float-quick') && html.includes('data-ai="floatask"') && html.includes('解释项目') && html.includes('下一步建议') && html.includes('教我怎么写') && html.includes('已读取「'));
check('AI 设置不再默认绑定 DeepSeek，支持标准/快速/深度模型分档与本地免费引导', html.includes("provider:'custom'") && html.includes("baseUrl:''") && html.includes("fastModel:''") && html.includes("deepModel:''") && html.includes('function aiModelFor') && html.includes("tier:'fast'") && html.includes("tier:'deep'") && html.includes('preset-local-free') && html.includes('ollama run qwen3:8b') && html.includes('在线“免费额度”会随服务商和时间变化'));
check('版本规则从 v19 起每 20 次改动进一位已记录在计划书', html.includes('版本 v19.11 · 联网研究闭环') && fs.readFileSync(path.join(root,'docs','个人本地PRD输出助手_优化实施计划.md'),'utf8').includes('v19.01–v19.19'));
check('浮动编辑工具栏保存精确选区，仅提供行内格式且拒绝整段标题/引用格式', html.includes('let mfbBar=null,miniFmtRange=null,miniFmtEditor=null') && html.includes('function rememberMiniFmtRange') && html.includes("if(op==='h2'||op==='h3'||op==='quote')") && !html.includes('data-fmt="h2"') && !html.includes('data-fmt="h3"'));

console.log(`\n质量基线：${failures.length ? `失败 ${failures.length} 项` : '通过'}`);
process.exit(failures.length ? 1 : 0);
