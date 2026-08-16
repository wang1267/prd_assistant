# PRD 智能看板 · 代码架构白皮书

> 版本基线：v16.1（项目下拉弹窗）｜ 整理日期：2026-08-14     用途：给后续接手修改本工具的任何 AI / 开发者，快速建立完整认知，避免改出 bug。     一句话心智模型：**数据在内存（STATE/DATA）→ `render()` 全量重建 DOM → 事件委托 `bindStatic` 分发 → 改数据 → `save()` 落 localStorage**。

>   ⚠️ v16.3 变更提示（本白皮书正文仍以 v16.1 为准）：判分规则已冻结为 12 条内置基线（`DEFAULT_RULES`），设置页规则 tab 改为只读清单；`hitsFor` 改为按「节类型 / 标题关键词」定位，不再依赖 `feat/accept/meta` 等写死节 id；`isEmpty()` 与 `plain()` 已把表格节 `rows` 纳入判定；`runHealth` 对内置规则统一放行（`scope:'all'`），仅历史自定义规则仍走 `default` 分支的关键词/正则匹配。规则管理相关代码（`addCustomRule`/`handleRuleFile`/`ruleFileInput` 及 bindStatic 的 rule-* 分支）已删除。

>   ⚠️ v16.4 变更提示：富文本表格的常驻操作条（`.rtbl-wrap`）与单元格 × 按钮已移除，行/列增删改统一改为右键菜单（`openTblMenu`/`doTblOp`，Excel 式：上方/下方插入行、左侧/右侧插入列、删行/删列/删表）；`stripRtblHtml` 额外剥离历史残留的 `rtbl-col-del`/`rtbl-row-del` 节点；`initTblResize` 修复了 contenteditable 文本节点导致 closest 崩溃的缩放失效问题（`norm()` 归一化 + 热区扩至 8px）；评论气泡 `showTip` 改为 `placeTip()` 锚定划线，划出视口即隐藏、滚回自动恢复。

>   ⚠️ v16.5 变更提示：结构化表格渲染不再生成操作列（`.tbl-actcol`）与行内 × /底部「＋行/＋列」按钮（bindStatic 的 addrow/addcol/delrow/delcol/addtblsec 分支已删除），与富文本表格统一走右键菜单；`saveTblLayout`/`scaleTblCols`/`initTblResize`/`openTblMenu` 中的操作列逻辑同步移除。评论气泡 `placeTip()` 改为始终可见：划线在视口内贴线（下/上/兜底），划出视口时贴到靠近划线的一侧（顶部或底部）并显示方向提示 `.cmt-dir`，不再隐藏。

>   ⚠️ v16.6 变更提示：
>   1. 结构化表格拖拽改为显式手柄：渲染时在表头右缘注入 `<span class="tbl-col-h">`（列宽）、行首格下缘注入 `<span class="tbl-row-h">`（行高），由独立 document mousedown 委托处理拖拽并 `saveTblLayout` 落盘；`initTblResize` 的边缘热区逻辑对 `.table-scroll` 一律跳过（仅富文本表格保留边缘拖拽）。
>   2. 评论气泡引入内联第三方库 **Floating UI**（`@floating-ui/core@1.6.9` + `@floating-ui/dom@1.6.13`，MIT，共约 22KB，已嵌入 comment-controller 前的两个 `<script>`，无需网络）。`showTip` 改用 `FloatingUIDOM.autoUpdate/computePosition` + `offset(10)/flip()/shift({padding:10})/hide({strategy:'referenceHidden'})` 定位；`activeTipCleanup` 统一管理 autoUpdate 清理，✕/删除时 `stopTip()`。`window.FloatingUIDOM` 缺失时保留简易 fixed 兜底。

>   ⚠️ v16.7 变更提示：
>   1. `selectMedia` 对结构化表格（`.table-scroll`）提前返回——不再弹浮动工具条与右下角整体缩放角标（`imgResizeHandle`），结构化表格只有逐列/逐行手柄。
>   2. 评论气泡"看不到"的真实根因：CSS 中一条顶层 `.cmt-tip{position:relative}` 覆盖了 `position:fixed`（同特异性后定义胜出），使 Floating UI fixed 策略算出的视口坐标被套在 relative 元素上，气泡渲染到文档底部视口外。已删除该覆盖；`computePosition` 显式传 `strategy:'fixed'`；`showTip` 先 `fallbackPlace()` 就近放置一次，`computePosition` 的 Promise 加 `.catch` 兜底并对 x/y 做 isFinite 校验。真机验证见 `tools/browser_check.mjs`（无头 Chrome + CDP）。

>   ⚠️ v16.8 变更提示：`openTblPicker` 的网格由「10 个行 div、每行 10 个按钮」改为平铺 100 个按钮，与 `.table-modal-grid` 的 `display:grid;grid-template-columns:repeat(10,28px)` 对齐；点击事件从被点击按钮读取 `data-r/data-c`（不再从容器读）。真机验证见 `tools/browser_check_grid.mjs`（100 按钮、28×28、步进 32px、无溢出）。

>   ⚠️ v16.9 变更提示：`selectMedia` 中表格（含富文本）不再调用 `positionImgHandle`（右下角整体缩放角标），`sizes` 仅对 IMG 渲染尺寸预设按钮，表格的「↔ 拖拽缩放」按钮移除；表格列宽/行高仍由 `initTblResize` 边缘拖拽与右键菜单提供。

>   ⚠️ v17.0 变更提示（AI 助手，方案 C 纯前端）：在文件末尾追加独立脚本块 `<script id="ai-controller">`（约 1000 行，IIFE），**不改动 block1 任何代码**。功能与约定：
>   1. **设置页第 4 tab「AI」**：运行时向 `#settingsModal .tabs` 注入按钮与 `#tabAI`，并包装 `window.setSettingsTab`（`map` 增加 `ai:'tabAI'`，切到 ai 时调 `aiRenderTab()`）。设置存独立键 `prdKanbanAiSettings`（provider/baseUrl/model/apiKey/targetScore/maxRounds/dims 权重开关），Key 永不进 STATE、不随 JSON 备份导出（备份只序列化 STATE，天然隔离）。
>   2. **AI 业务数据存项目对象 `p.ai`**（`versions[] / lastReport / ignoredAiIssues[] / pendingDiffs`），随项目切换与备份走；`aiState()` 惰性初始化。
>   3. **Provider 层**（`aiChatOnce/aiChat/aiAskJSON`）：OpenAI 兼容 `POST {base}/chat/completions`；默认 SSE 流式（`aiAskJSON` 先流式、解析失败或流式不可用自动降级非流式 + `response_format:json_object` 重试）；错误分类（401 Key/429 限流/404 地址/超时/CORS）；`aiExtractJson` 容错解析（去围栏、括号配对）。
>   4. **文本抽取**：`aiDocText()/aiSecText(id)` 按框架节输出 `## [节id] 标题` 文本（items/rows/cards 全部扁平化），供评分与优化；AI 返回的节 id 必须匹配框架 id。
>   5. **6 维评分**：`aiScore()` 返回 `{total, dimensions[], summary}`，total 按设置权重在本地加权计算（不信任 AI 总分）；问题带稳定忽略键 `aiKey(sectionId+reason)`（djb2），换轮次不失效。
>   6. **一键优化**：`aiRunOptimize()` 先基线评分 → 每轮 `aiOptimize()`（prompt 要求只返回 JSON changes，text 节给完整 newHtml、table 节给完整 newRows、items/cards 节仅 suggestion）→ `aiDocTextWith()` 模拟复检 → 分数回退自动保留最好版本 → 产出 `pendingDiffs`。**确认前正文零改动**。
>   7. **版本链**：节级差异补丁 `patch={sectionId:{old,new}}`（old/new 为逐字字段快照），`aiRestoreToVersion()` 恢复前先写「恢复前快照」human 版本，再对 head→目标之间的版本**倒序**应用各 patch 的 `old`，最后把目标 patch 的节落回 `new`——精确无误差累积；上限 10 版（超限自动淘汰最早非 final 并 toast 提示）。手动编辑兜底：`aiCaptureManualDelta()` 在下次优化前对比版本记录，自动生成 human 版本。
>   8. **UI**：body 级右抽屉 `#aiPanel`（z-index:58，低于模态 60，避免盖住弹窗；`render()` 重建 #main 不影响它）；顶栏「AI」按钮 + 侧栏「AI 助手」入口；面板含评分条/问题清单（可展开、定位、忽略/已订正）/待确认 Diff（接受/修改/拒绝/暂缓/全部接受）/版本时间线（查看 Diff、恢复）/过程记录。
>   9. **安全**：`aiSanitizeHtml` 剥 script/style/iframe/on* 属性并校验 img/a 协议；错误信息不含 Authorization 头；UI/导出均无 AI 内容标记（`kind:'ai'` 仅内部语义）。
>   10. **验证**：`tools/regress_v170.js`（26 断言：设置隔离/加权总分/优化流/回滚/上限/清洗）+ `tools/browser_check_ai.mjs`（无头 Chrome 端到端 9 断言 + 控制台零报错）；原有 `browser_check.mjs`（评论气泡）与 `browser_check_grid.mjs`（表格网格）仍全绿。

>   ⚠️ v17.1 变更提示（可信度升级，仍在 `ai-controller` 内，block1 零改动）：
>   1. **评分校准**：`aiScore` temperature 0；issue 强制带 `quote`（原文逐字引用）+ 维度 `note`，本地 `aiNormText` 规范化匹配，未匹配标 `lowConfidence`（UI 显示「⚠ 疑似幻觉」）；内容指纹缓存 `p.ai.scoreCache`（`aiFingerprint` FNV-1a64 + 文本/框架/规则/维度摘要），命中直接返回且面板标注「使用缓存」。
>   2. **独立复检**：新增 `aiReview`（独立 prompt、verdict pass/needs_work/fail、temperature 0、可配 `reviewModel`，经 `aiChatOnce` 的 `opts.model` 覆盖）；一键优化达标 = review.score≥目标 且 verdict≠fail 且无 blocked。
>   3. **确定性校验**：`aiValidateChange/aiValidateChanges`——块/行编辑的引用匹配、`aiHtmlBalanced` 标签闭合、表格列数（`aiRowCellsOk`）、被替换块含评论划线时 warning、越界修改拦截；blocked 条目 UI 禁「接受」只能修改/拒绝；`aiEvalRuleDelta` 临时套用新内容跑 `runHealth()` 对比风险/完成度（还原现场，不改 HEALTH 全局），只警告不硬拦。
>   4. **块级最小编辑**：`aiBlocksOf`（字符串级顶层块切分 p/ul/ol/table/h3/h4/div.imp-img）+ `aiApplyEdits`（replaceBlock/insertBlock/deleteBlock，match 规范化匹配，未匹配=blocked 绝不静默跳过）+ `aiRowExec`（表格行级，按首列定位）；优化 prompt 改为输出 `edits`/`rowEdits`；模拟复检与真实写入共用同一执行器（`aiFieldsOf`/`aiDocTextWith`）。
>   5. **版本双格式**：新版本补丁 `patch[sid]=[{kind:'block',blockOld,blockNew,anchor}|{kind:'row',rowOp,match,rowOld,rowNew,anchor}]`；`aiReverseEntries/aiReversePatch/aiEnsureTarget` 支持倒序回放与目标落回，旧格式 `{old,new}` 整节补丁继续可查看/恢复；恢复前仍写「恢复前快照」；`aiCaptureManualDelta` 对新格式跳过（快照兜底）。存储量从整节缩到被改的块。
>   6. **测试**：`tools/regress_v170.js` 升级为 32 断言（quote/幻觉/缓存/块级编辑/行级校验/双格式恢复/引擎对比等）；`tools/browser_check_ai.mjs` 端到端 9 断言（含独立复核徽标、块级 Diff、恢复）全绿，控制台零报错。

>   ⚠️ v17.2 变更提示（AI 结构对齐，仍在 `ai-controller` 内，block1 零改动）：
>   1. **错位检测**：`aiAlignHint()` 本地确定性信号——兜底节（`catchAllId()`）内容占比 >25%、必填节空、单节块数 >8 且存在空必填节；`aiWrapImport()` 包装 `window.doImportText`（函数声明→window 属性可替换），导入后 300ms 检测，高风险才 toast 提示，不自动执行。
>   2. **对齐提议**：`aiAlignPrompt()` 把框架（节 id/标题/类型/必填）与逐节文本（含 [id] 标记）给 AI，输出 `moves[{fromSection,match,toSection,position,anchor}]` + `suggestions`（改名/合并/拆分/删空节，仅文字）；`aiNormMove/aiMoveToItem/aiValidateMove` 归一化与校验（text↔text、table↔table、match 逐字匹配、目标锚点存在、表格列数一致、评论划线随块移动时警告；校验不过→blocked 禁接受）。
>   3. **执行与版本**：`aiApplyAlignItem` 跨节移动（来源删块/行、目标按 start/end/锚点插入）；版本补丁双节记录（来源 `{kind:'block',blockOld,blockNew:''}`、目标 `{kind:'block',blockOld:'',blockNew}`；行同理 `rowOp:'delete'/'insert'`）；`aiRestoreToVersion` 对**变换型版本**（patch 含删除类条目）的头部恢复=反向应用自身条目（撤销搬移搬回原位），普通内容版本保持原语义；版本标签「结构对齐 N」。
>   4. **UI**：面板工具栏新增「结构对齐」按钮；高风险时顶部黄色提示条（含一键执行）；新增「结构对齐建议」区（来源→目标预览、校验徽标、接受/拒绝/暂缓/全部接受）；与待确认 Diff 并列独立 `p.ai.pendingAlign`，互不干扰。
>   5. **免费模型**：实测智谱 GLM-4-Flash 可浏览器直连（`open.bigmodel.cn/api/paas/v4`，CORS 放行），配置=服务商自定义 + Base URL + `glm-4-flash-250414`/`glm-4-flash`；设置页模型为自由输入框，可随时切换其他 OpenAI 兼容服务。
>   6. **测试**：`regress_v170.js` 增至 44 断言（新增 hint/normMove/validateMove/全流程/撤销）；`browser_check_ai.mjs` 端到端 13 断言；评论/网格旧检查全绿。

>   ⚠️ v17.3 变更提示（仍在 `ai-controller` 内，block1 零改动）：
>   1. **停止 AI**：模块级 `aiGlobalAbort`（AbortController）+ `aiCancelFlag`；`aiChatOnce` 将全局 abort 联动到每次请求的 `ctrl`，`aiChat` 重试、`aiAskJSON` 降级路径、优化轮询、三个流程的 catch 均检查取消；`aiAbortRun()` 公开为 `__AICtrl.stop`，面板运行中显示「■ 停止」（`.ai-stop-row`），中断后不写入、可重试。
>   2. **导入默认自动框架**：`aiWrapImport` 升级——`doImportText` 包装器在「无项目或当前项目全空」时改为 `createProject` + `autoGenImport`（按文档标题建 `agN` 框架），不再硬套 14 节；有内容项目仍走原确认/合并流程；导入后照常做错位提示。
>   3. **对齐自动调整（ops 真正执行）**：prompt 新增 `ops`（rename/deleteEmpty/merge/split）；`aiNormOp/aiOpToItem` 归一化；`aiValidateMove` 扩展校验（rename 新标题非空且变化、deleteEmpty 仅空且非必填、merge 仅同类型且来源有内容、split 仅 text 节且 moves 逐字匹配）；`aiApplyAlignItem` 执行——rename=`aiFwRename`，deleteEmpty=`aiFwRemove`，merge=整节块/行搬移+删来源，split=`aiFwInsert` 新节（`ai_*` id）+搬块；框架级补丁 `{kind:'fwname'|'fwdel'|'fwadd'}`。
>   4. **框架级版本还原**：`aiReverseVersionPatch(v)` 先处理框架条目（fwdel=插回、fwadd=移除、fwname=还原标题）再处理节条目；`aiRestoreToVersion` 的 isTransform 扩展到框架条目、含框架条目的恢复跳过「恢复前快照」；版本 Diff 视图支持框架条目展示。
>   5. **测试**：`regress_v170.js` 增至 55 断言（新增停止/ops 全流程与撤销/导入自动框架）；`browser_check_ai.mjs` 端到端 18 断言；评论/网格旧检查全绿。

>   ⚠️ v17.4 变更提示（**block1 两处修复**，首次直接修改主脚本——导入识别是核心逻辑，不宜用包装器）：
>   1. **`headingLevelOf`**：①outlineLvl 只认 0-8（WPS 正文段落常写 9，原代码会把它当 10 级标题）；②删除 `/[a-z]/i.test(样式ID)→二级标题` 的过宽兜底——Word 自动目录样式 `TOC1..TOC4`、`toc*`、`目录*` 显式返回 0；标题识别仅保留 `heading[1-9]`、单个数字样式 `[1-9]`、中文「标题N」与加粗兜底；③加粗兜底排除封面日期/编号标签行。
>   2. **`parseAutoGen`**：①新增 `skipToc()`——定位「目录/目 录/Contents」标题后，删除到第一个真实 `#` 标题之间的目录条目块；②`hasMarkdownHeadings` 门控——文本中只要存在 `#` 标题（即样式识别成功），就禁用"编号行/已知节名"兜底，避免把正文编号列表行误当节。
>   3. 真实案例验证：`【需求文档案例】贷款需求文档v1.3.2.docx`（50 个 Heading 样式标题 + 55 条 TOC）导入从 **290 节 → 72 节**，目录条目/页码不再成节，正文编号行不再误判。复现工具：`tools/debug_import_docx.mjs`（无头 Chrome + 真实文件）。

>   ⚠️ v17.5 变更提示：
>   1. **侧栏滚动**（block1 CSS）：`#sidebar` 增加 `max-height:calc(100vh - 61px);overflow-y:auto`，长目录可滚动（此前 sticky 列被视口截断、底部划不到）。
>   2. **标题层级**（block1）：`headingLevelOf` 加粗兜底由二级改为三级 `###`；`parseAutoGen` 新增 `hasH12` 门控——存在 `#/##` 大标题时 `###` 归入父节成为小卡片（`cards`），无大标题时 `###` 仍作节（纯加粗文档兜底）。真实 docx 验证：72 节 → **18 个顶级节**，H3/加粗子标题全部成为父节卡片。
>   3. **优化整节兼容**（`ai-controller`）：`aiNormChange` 对模型返回整节 `newHtml/newRows` 自动降级为 `replaceSection/replaceRows`（补丁 `kind:'section'/'rows'`，`aiReverseEntries/aiEnsureTarget/版本 Diff` 均已支持，可回滚）；`aiValidateChange` 增加整节分支（标签闭合/非空/列数一致）；失败反馈——AI 返回 N 条但全被过滤、或校验不过时，toast 具体原因。
>   4. **对齐 blocked 原因可见**：`ai-align-item` 渲染 `ai-vblock`（⛔ + 具体原因），校验不过的项不再"点击没反应"。
>   5. 测试：`regress_v170.js` 增至 65 断言；无头 Chrome 端到端 18 断言；评论/网格旧检查全绿。

>   ⚠️ v17.6 变更提示（`ai-controller`）：
>   1. **优化兜底重试**：新增 `aiOptimizeSimple`（简化 prompt，只要求整节 `newHtml/newRows`）；`aiRunOptimize` 每轮先走复杂"块级 edits"协议，若模型返回非空但全部被 `aiNormChange` 过滤（引用不逐字/结构不完整），自动改用简化协议重试一次（`fallbackSimple`），并可直接落入 `replaceSection/replaceRows` 路径。
>   2. **诊断记录**：模块级 `aiOptDbg`，每步（optimize 原始条数/摘要、norm 结果、blocked 原因、review 分数/verdict、简化重试、错误）写入 `p.ai.lastOptDebug`；面板渲染「最近一次优化诊断」（`ai-dbg`，可清除 `clearoptdbg`），用于判断"是模型问题还是过滤问题"。
>   3. **失败提示细分**：区分"模型未返回任何建议（可能认为已达标/输出截断）"与"返回 N 条但均未通过校验"，均提示查看面板诊断。
>   4. 测试：`regress_v170.js` 增至 68 断言（新增复杂协议失败→简化重试→写入、诊断保留 3 条）；无头 Chrome 端到端 18 断言全绿。

>   ⚠️ v17.7 变更提示（`ai-controller`，针对真实诊断"模型返回 9 条但全部 blocked"）：
>   1. **连续多块范围匹配**：`aiApplyEdits` 单块未命中时，按块序拼接最多 10 个连续块的规范化文本，若包含 match 则整段替换（处理模型把连续多段粘贴成 match 的常见情况）。
>   2. **优化文本排除小卡片**：`aiSecText(id,fields,noCards)` 与 `aiDocTextOpt(noCards)`，优化 prompt（`aiOptimizePrompt`/`aiOptimizeSimple`）与模拟复检改用 `noCards=true`——模型看到的内容只含正文块，不再引用卡片文本导致匹配失败；提示词明确"不要引用小卡片内容"。
>   3. **全部 blocked → 整节重试**：`proceed` 中 blocked 且非简化重试结果时，自动走 `aiOptimizeSimple` 再试一次（`blockedRetry` 入诊断），仍失败才丢弃并给出原因。
>   4. 测试：`regress_v170.js` 增至 73 断言（新增范围匹配/卡片排除/blockedRetry 全流程 5 条）；无头 Chrome 端到端 18 断言全绿。

>   ⚠️ v17.8 变更提示（`ai-controller`）：
>   1. **原文点击跳转**：新增 `aiJumpToBlock(sid,match)`——按节类型定位（table 节按行首列匹配 `<tr>`；text 节按块子元素/全元素规范化文本匹配），`scrollIntoView` + `.ai-flash` 高亮 2.4s，未命中时定位到节并 toast。
>   2. 所有"原"预览加上 `.ai-jump`（可点击、hover 虚线框、title 提示）：优化 Diff（块/整节 replaceSection/表格行）、结构对齐搬移内容、版本 Diff（block/row/section/rows 条目）均带 `data-ai="jumpblock" data-sid data-match`。
>   3. 测试：`browser_check_ai.mjs` 增至 19 断言（新增 Diff 原文点击跳转）；无头 Chrome 全绿。

>   ⚠️ v17.9 变更提示（`ai-controller`，Diff 确认语义调整）：
>   1. **逐条即写**：`aiDecideDiff('accepted')`/`aiSaveModifiedDiff` 现在立即调用 `aiApplyDiffItemNow(it)` 应用该条（text/table 的 block/row/section/rows 分支），并 `aiMergeApplied` 记入 `pd.appliedPatches`；toast 提示剩余待确认数；`aiAcceptAll` 逐条应用后 `aiFinalizePending`。
>   2. **单条撤销**：`aiUndoDiffItem(id)` 用 `aiReverseEntries` 反向应用 `it.appliedEntries` 恢复原文，并从 `appliedPatches` 移除对应条目，状态回到 pending；已接受/已修改条目渲染「撤销」按钮（`undo-diff`）。
>   3. **归档**：`aiFinalizePending` 改从 `pd.appliedPatches` 汇总补丁建版本（不再二次应用），建议类条目无补丁时按原逻辑归档提示。
>   4. 测试：`regress_v170.js` 增至 77 断言（新增单条即写/剩余待确认/撤销/全部归档 4 条）；无头 Chrome 端到端 19 断言全绿。

>   ⚠️ v17.10 变更提示（`ai-controller`）：
>   1. **自动备份**：`aiWrapSave()` 包装 `window.save`——每次保存 5s 防抖写 `prdKanbanStateV3.bak`（`aiBackupState`），`beforeunload` 兜底再写；备份键与主键同源。
>   2. **启动恢复**：`aiRecoverFromBackup()`（boot 时调用）——主键缺失时自动恢复备份并 `save()`；主键存在但项目为空时仅置 `aiRecoverOffer`，面板显示「恢复备份」按钮（`recover-backup`），不自动覆盖（尊重主动删除）。
>   3. 存储边界提示：localStorage 按"浏览器+页面来源"隔离；换路径/换副本/换浏览器/清站点数据都会表现为"数据不见了"，备份只能同空间兜底，跨环境必须用「导出 JSON 备份」。
>   4. 测试：`regress_v170.js` 增至 80 断言（新增备份写入/主键缺失自动恢复/空主键给入口 3 条）；无头 Chrome 端到端 19 断言全绿。

>   ⚠️ v17.11 变更提示（`ai-controller`）：
>   1. **新示例 PRD**：`var AI_SAMPLE_TEXT` 内嵌《智能座舱语音助手·多意图连续对话与免唤醒交互》需求文档（JSON 转义字符串，约 7KB）；`aiWrapLoadSample()` 包装 `window.loadSample`——无项目时 `createProject('示例 PRD')`，随后 `autoGenImport(AI_SAMPLE_TEXT)` 按文档标题自动建框架（复用 v17.3 导入管线与 v17.5 层级逻辑），不再使用 block1 旧的固定 `sampleData`；向导/顶栏「加载示例」均生效。
>   2. 测试：`regress_v170.js` 增至 82 断言（新增示例文本内嵌、加载走自动框架含「目的」节 2 条）；无头 Chrome 端到端 19 断言全绿。

>   ⚠️ v17.12 变更提示（`ai-controller`，单条接受不重绘的修复）：
>   1. v17.9 起单条「接受」即写 DATA，但 `aiDecideDiff/aiSaveModifiedDiff/aiUndoDiffItem/aiAcceptAll` 只调 `refreshHealthUI()`，正文 DOM 未重建——用户看到"没变化"（仅"全部接受"因 finalize 末尾 `render()` 有效）。现全部改为 `render()+refreshHealthUI()` 即时重绘。
>   2. 测试：`browser_check_ai.mjs` 的"确认后写入正文并生成版本"改为"单个接受：正文立即变化（数据+可见DOM）并归档版本"（点击单条接受 → 校验 `#sec-purpose .editable` 文本含新内容 → 版本归档），19 断言全绿。

>   ⚠️ v17.13 变更提示（`ai-controller`，优化输出加固 + 按节兜底）：
>   1. `aiAskJSON` 尝试顺序反转：非流式 + `response_format:json_object` 优先，流式兜底；`aiChatOnce` 支持 `maxTokens`（`body.max_tokens`），评分/复检/整份优化/简单优化/分节优化分级设限。
>   2. `aiOptimizeSafe`：整份 `aiOptimize` 抛 `parse` 类错误时，记录 `fullDocParseFail`（含原始返回前 200 字），自动转 `aiOptimizeBySection`——只取有问题节（无则取前 6 个非空节），每节走 `aiOptimizeSectionSimple`（整节替换协议、`maxTokens:4000`），合并后照常校验/复检/出 Diff；注意**分节调用返回原始 changes，归一化统一由 proceed 的 `aiNormChange` 执行**（曾因二次归一化丢失 `replaceSection`）。
>   3. `runOptimize` catch 的 `lastOptDebug` 增加 `raw`（原始返回前 300 字），失败可诊断。
>   4. 测试：`regress_v170.js` 增至 84 断言（新增整份解析失败→分节兜底出建议、诊断含原始返回 2 条）；无头 Chrome 端到端 19 断言全绿。

>   ⚠️ v17.14 变更提示（`ai-controller`，大文档直接按节优化）：
>   1. `aiOptimizeSafe` 整份模式且文本 >2500 字符时**跳过整份调用**（弱模型必截断），直接 `aiOptimizeBySection`（问题节计数排序、最多 6 节、每节一个短请求），诊断记录 `fullDocSkipped`；不再等整份失败才兜底。
>   2. 测试：`regress_v170.js` 增至 85 断言（新增大文档直接按节 1 条）；端到端 19 断言全绿。

>   ⚠️ v17.15 变更提示（`ai-controller`，AI 撰写草稿——从零起草）：
>   1. **入口**：AI 面板工具行「✍ AI 撰写」+ 无项目空态按钮；`#aiGenModal` 表单（项目名称/产品描述/框架选择），`aiBind` 新增 `gen/genclose/genstart/cleargendbg`。
>   2. **逐节生成**：`aiGenStart` → `createProject(name,fwId)` 新建空白项目 → 按 `STATE.framework` 顺序 `aiGenSection(sid,desc,opts)`（每节一次 `aiAskJSON`，`maxTokens:2500`）：text/timeline 返回 Markdown，经新函数 `aiMdToHtml`（段落/标题/列表/表格/围栏代码/引用/加粗/斜体/行内代码/链接，本地轻量转换）→ `aiSanitizeHtml`；table 返回 `rows`（`aiGenNormRows` 列数一致校验）；feat/accept/users 返回 `items`（`aiGenNormItems`：优先级 P0-P4 归一、状态枚举、空条目过滤）。单节空返回/异常跳过并记 `p.ai.lastGenDebug`（sections/ok/failed），不中断整体；`aiCancelFlag` 每节断点可停止。
>   3. **写入**：产出归一为 change（`replaceSection/replaceRows/replaceItems`）→ `aiValidateChange`（items 分支：清单非空、feat 名称/优先级、accept 内容、users 角色）→ `pendingDiffs`（`gen:true, genLabel:'AI 草稿'`，面板标题「AI 撰写草稿」），逐条接受/修改/拒绝/暂缓复用 v17.9 机制；`aiApplyDiffItemNow` 新增 `type:'items'` 分支写 `c.items` 并产生 `{kind:'items',oldItems,newItems}` 补丁条目。
>   4. **版本与回滚**：`aiCreateVersion` 支持 `opts.transform`（版本对象新增 `transform` 字段）；草稿版本 `transform:true`，「恢复」=撤销草稿回到生成前空白（`aiReverseVersionPatch` 逐字清空），恢复前自动存「恢复前快照」（恢复该快照=重新得到草稿）；`aiCurFields/aiApplyFields/aiReverseEntries/aiEnsureTarget/aiReversePatch/aiRestoreToVersion/aiUndoDiffItem/aiPreview` 全部扩展 `items` 字段与 `kind:'items'` 条目，清单类可精确回滚。
>   5. **测试**：新增 `tools/regress_v1715.js`（22 断言：mdToHtml/norm/genSection/全流程/接受/版本/回滚/找回）；新增 `tools/browser_check_gen.mjs`（端到端 5 断言，走真实 UI：弹窗→填表→mock AI→全部接受→正文变化→版本归档→恢复清空）；6 套既有回归 170 断言 + `browser_check_ai.mjs` 19 断言 + 评论/网格旧检查全绿。

>   注：`tools/` 下浏览器检查脚本（`browser_check*.mjs`）在受限沙箱内需以 PowerShell `Start-Process` 拉起 Edge/Chrome 并加 `--no-sandbox --disable-breakpad --disable-crash-reporter --remote-allow-origins=*`（node 直接 spawn 会崩），已统一更新。

>   ⚠️ v17.16 变更提示（看板总览升级，block1 渲染 + CSS，数据模型零改动）：
>   1. **hero 实时摘要**：`renderSections` 首次创建 `<div class="sub" id="heroSub">`，每次渲染由新函数 `renderHero()` 刷新（完成度/风险红节/AI 总评/更新时间）。
>   2. **节健康度热力图**：`renderDashboard` 新增 `.dash-heatmap`（全宽）——每节一个 `.dash-cell`（green/yellow/red），`data-act="goto"` 点击定位，附统计与 `.dash-legend` 图例。
>   3. **AI 总评卡**：`p.ai.lastReport` 存在时渲染 `.dash-ai`（总分 pill + `.dash-dim` 6 维迷你条 + 摘要），否则渲染「运行深度体检」入口（`data-ai="score"`，复用 aiBind 委托）。
>   4. **摘要复制**：新函数 `copyHealthSummary()`（`data-act="copyhealth"`，bindStatic 新 case）生成 Markdown（指标 + `### 节状态` emoji 逐节 + `### 缺口清单`），`navigator.clipboard` + `fallbackCopy` 双兜底，测试钩子 `window.__lastHealthSummary`。
>   5. **AI 面板微调**（`ai-controller` CSS）：`.ai-tools .ai-btn{flex:1}`、`.ai-head` 渐变、`.ai-body` 滚动条。
>   6. 新样式全部走 CSS 变量（`--card/--line/--green/--yellow/--red/--ink-*`），深浅色/拟态自动适配；900px 以下 `.dash-panel` 全宽、维度条单列。
>   7. 测试：新增 `tools/browser_check_dash.mjs`（8 断言：hero/热力图/AI 卡/摘要/定位）；6 套回归 170 + v17.15 22 断言全绿；其余浏览器检查全绿。

>   ⚠️ v17.17 变更提示（多项目总览 + 自动框架必填语义）：
>   1. **总览入口**：侧栏骨架新增 `.pp-toggle[data-act="toggleoverview"]`；`injectOverviewPanel()` 在 `init()` 注入全屏浮层 `#overviewPanel.ov-panel`（z-index 59，点击背板/Escape/`ovclose` 关闭）；bindStatic 新增 `toggleoverview/ovclose/ovopen`（`ovopen` 切换项目并关闭，项目级操作不入撤销栈）。
>   2. **healthForProject(p)**：try/finally 临时切换 `STATE.framework=p.framework`、`DATA=p.data`、`STATE.activeProjectId=p.id` → `runHealth()` → 恢复；同步执行无重入，不污染当前项目。`renderOverview()` 生成统计头 + `.ov-grid` 项目卡（完成度/红节/AI 总评/`.ov-dots` 逐节迷你色点带 title/更新时间）。
>   3. **自动框架必填语义**：`autoGenImport` 按标题关键词（目的/背景/简介/概述/目标/范围/边界/功能需求/功能点/非功能/性能/安全/可用性/接口/验收/自测/测试标准/用户/使用者/角色/场景/风险/权限）判定 `required`，修复导入/示例文档 R-SPEC-01 永不命中、完成度恒 100% 的缺陷。
>   4. **视图态横幅**（block2 `sync`）：`rb-meta` 增加「风险红节 N」与「AI 总评 X 分」。
>   5. 测试：`browser_check_dash.mjs` 增至 14 断言（含总览打开/项目卡/色点/隔离性/两项目统计/切换/关闭）；6 套回归 170 + v17.15 22 断言全绿。

---

## 0. 阅读导览

- 单文件自包含：`PRD智能看板.html`（约 2.1MB / 4100+ 行），无任何外部依赖（图片内联 base64、docx 解析自实现）。

- 结构三明治：**`<style>` 设计系统 → `<body>` 静态骨架 → 7 个 `<script>` 逻辑**（block0 主题 / block1 主逻辑 / block2 视图模式 / block3-4 Floating UI / block5 评论 / block6 AI）。

- 双模式：`editing=true` 编辑态（可输入）↔ `view-mode` 视图态（只读评审，`document.documentElement.classList` 控制）。

- 改动前必读第 6 节「历史 Bug 根因库」，第 5.5 节「两套表格模型」。

---

## 1. 文件总体结构（行号分区，以 v16.1 为准）

| 行号 | 内容 | 说明 |
| --- | --- | --- |
| 1–16 | `:root` CSS 变量 | 品牌色/文字色/边框色/红黄绿状态色/字体栈（衬线+等宽） |
| 17–726 | 主样式 | topbar、sidebar、卡片、表格、评论、模态框、打印适配 |
| 727–751 | `<script id="theme-controller">` | **block0**：浅色/深色主题 + 拟态皮肤开关，注入设置页主题按钮 |
| 752–788 | `<style id="comment-style">` | 评论划线/气泡/列表面板样式（独立 style 便于定位） |
| 790–975 | `<body>` | 顶栏按钮群、侧边栏（项目按钮+分组面板+目录）、main、modals、隐藏 file input、mediaBar、图片缩放柄 |
| 976–3784 | `<script>`（主脚本） | **block1（核心，~2800 行）**：常量、状态、健康度、渲染、事件、表格、导入导出、模板、媒体条 |
| 3966–4003 | `<script id="view-mode-controller">` | **block2**：视图态注入「PRD 健康体检报告」横幅 |
| 4004 | `<div id="vbadge">` | **版本水印**（左下角），每次发版必须更新（当前 v17.17） |
| 4006–4015 | `<script>` ×2 | **block3-4**：Floating UI（core 1.6.9 + dom 1.6.13，MIT，内联无网络） |
| 4016–4275 | `<script id="comment-controller">` | **block5**：评论系统（划线、气泡、列表、清理） |
| 4300–7050 | `<script id="ai-controller">` | **block6（v17.15）**：AI 助手（设置/评分/优化/结构对齐/撰写/版本/审阅），独立 IIFE，见文首 v17.x 变更提示 |

> 注意：4 个 script 块按 `theme-controller → 主脚本 → view-mode-controller → comment-controller` 顺序加载；block3 依赖 block1 的全局（`DATA`/`editing`/`esc` 等）。

---

## 2. 数据层

### 2.1 全局状态 STATE（localStorage 键 `prdKanbanStateV3`）

```js
  STATE = {
    version: 5,
    density: 'standard',            // compact | standard | comfortable
    seenWizard: bool,
    projects: [Project],            // 项目数组，顺序即分组内/未分区的展示顺序
    activeProjectId: string|null,
    groups: [{id, name}],           // v16 新增：项目分组
    groupOpen: {gid: bool},         // v16 新增：分组展开状态（持久化）
    ruleSet: [Rule],                // 健康度规则（可增删改）
    framework: [Section],           // 当前激活项目的框架（全局镜像，见 load()）
    frameworkPresets: [Preset],     // 新建项目可选框架
  }
  Project = { id, name, groupId?, data: {secId: SecData}, framework?, overrides: {secId:{color,reason,by,at}}, corrections: {secId:{ruleId:{status,at}}}, createdAt?, updatedAt? }
  SecData = { html?, items?, rows?, colWidths?, rowHeights?, cards?, comments? }
  Section = { id, title, type, required, weight, template }
  // type ∈ text | table | feat | accept | users | timeline
  Rule = { id, dim, desc, level:'red'|'yellow', weight, enabled, scope:'all'|'required'|[...ids], threshold? }
  ```

### 2.2 DATA 与 refreshData

- `DATA` 是**当前激活项目的 `p.data` 的引用**（`refreshData()`：`DATA = currentProj()?.data ?? {}`）。所有节编辑直接改 `DATA`，`save()` 时写回 `p.data`。

- `currentProj()` = `STATE.projects.find(x => x.id === STATE.activeProjectId) || null`。

- `save()`：把 `DATA` 写回当前项目 → `JSON.stringify(STATE)` 存 localStorage → `clearDirty()`。

### 2.3 默认常量（block1 开头）

- `DEFAULT_FRAMEWORK`：14 节标准框架（meta 变更历史/ purpose 目的 / scope 范围 / def 定义 / prodinfo 产品信息 / users 使用者需求 / feat 功能需求 / nfr 非功能 / selftest 自测 / track 埋点 / ui 界面 / accept 验收 / launch 上线(timeline) / other 兜底）。

- `DEFAULT_PRESETS`：标准 14 节、精简 7 节、带小卡片 3 套。

- `DEFAULT_RULES`：19 条规则（R-SPEC/R-CONS/R-TEST/R-RISK/R-SAFE），含"车控/行驶中未标安全红线"等座舱特色规则。

- `COVER`：Word 导出封面 base64 图。

### 2.4 load() 迁移纪律（v3→v5）

- 只**补默认、绝不删字段**：`!STATE.groups → []`、`!STATE.groupOpen → {}`、`!STATE.frameworkPresets → DEFAULT_PRESETS` 等。

- 每个项目逐字段补：`overrides`/`corrections`/`framework`/`data`；表格节 `rows` 缺失时用 `sectionEmpty('table')` 补默认表头（**仅当 html 也为空才补，避免覆盖旧内容**）。

- 最后：`STATE.framework = deep(active.framework)` 全局镜像同步；`activeProjectId` 失效则置 null。

---

## 3. 渲染模型（全量重建 + 渲染后钩子）

### 3.1 `render()`（block1, ~1264）

```
  render():
    btnUndo.disabled = !undoStack.length
    refreshData()
    if(!currentProj()) → renderPlaceholder() + renderSidebar(); return
    HEALTH = runHealth()
    renderSidebar(); renderSections()
  ```

**全量重建原则**：DOM 每次都是字符串拼装后 `innerHTML` 覆盖重建（非 diff）。因此：

- 所有**临时 UI/运行时状态**（弹窗开着、气泡显示、选中态）不会自动保留，需要显式恢复（见 5.6/5.11）。

- 事件用**委托**绑在 document/container 上（见第 4 节），不绑在重建的元素上。

### 3.2 renderSections（~1391）— 正文区

1. 首次创建 hero+dashboard 容器（`main.innerHTML = heroHtml`，之后只更新 `#content`）。

1. `STATE.framework.forEach((s,i) => html += renderSection(s,i))` → `#content.innerHTML`。

1. **渲染后钩子（按顺序）**：`renderDashboard()`、`renderTOC()`、`renderDrill()`（若 drillOpen）、`injectRichTableBars()`、`injectRtblCellBtns()`。

### 3.3 renderSection / renderEditor（~1498 / ~1522）

- 每个节：`.section-card#sec-<id>`，含标题区（序号/标题/自动标签/色块 `data-act=ovmenu`）+ `.sec-body` + 折叠详情 `.drill`。

- `renderEditor(s)` 按 `s.type` 分支：feat 功能表 / accept 验收清单 / users 用户故事 / table 结构化表格 / 其余 text（`.editable` contenteditable + `.cards` 小卡片）。

- **编辑态 vs 视图态**：`const dis = editing ? '' : ' disabled'` —— 视图态所有结构化输入只读；删除按钮/添加按钮仅编辑态渲染。视图态把 priority/status 渲染成彩色 pill。

### 3.4 renderSidebar（~1297）— 项目与分组

- 顶部「项目 ▾」按钮（`.pp-toggle`，`data-act=toggleprojpanel`，文本=当前项目名或"项目"）。

- `#projPanel` 下拉浮层（`position:absolute`）：`＋新建分组` → 每个分组（标题 chev 展开/折叠 + ✎重命名 + ×删除）→ 组内项目 → 「未分组」区 → `＋新建项目`。

- 项目项 `.pp-proj`：`data-act=switchproj data-id` + `draggable` + 右键 contextmenu → `openProjMenu`。

- 浮层开合状态用 `pp.dataset.open==='1'` 恢复（innerHTML 重建不丢）；**不再强制 `add('open')`**（v16.1 改）。

### 3.5 renderTOC（~1382）— 大纲

- 每节一个 `<a data-act=goto data-id data-tocid draggable>`，色点=健康状态色。

- 末尾调用 `watchTocScroll()`（滚动高亮）+ `bindTocDrag()`（节拖拽排序）。

### 3.6 renderDashboard（~1342）— 健康度卡片

- 完成度/风险/一致性/人工覆盖 4 卡片 + 缺口清单表（`data-act=opensec` 点击跳节）。

- `PREV_METRICS` 记录上一轮指标用于"较上次"增量显示。

---

## 4. 事件系统

### 4.1 bindStatic（~2265）— 唯一的 document click 委托

```js
  document.addEventListener('click', e => {
    const edT = e.target.closest('.editable[data-act="editable"],.sub-card-body[data-act="cardbody"]');
    if(edT) lastEdEl = edT;                          // 记录最近点击的正文容器（顶栏插入定位用）
    const t = e.target.closest('[data-act]'); if(!t) return;
    const act = t.dataset.act; const id = t.dataset.id;
    if(MUT.has(act)) pushUndo();                     // 只有编辑类操作入撤销栈
    switch(act){ /* ~80 个 case */ }
  });
  ```

- **所有交互按钮靠 `data-act` 属性驱动**，新增按钮 = 加 `data-act` + 加 case。

- `lastEdEl` 全局：顶栏「插入图片/插入表格」的落点。

### 4.2 MUT 撤销判定集（重要！）

```js
  MUT = new Set(['addfeat','delfeat','addaccept','delaccept','adduser','deluser','accstatus',
    'doOverride','ov-red','ov-yellow','ov-green','ov-clear','corr','setdensity','rule-en','rule-lv',
    'rule-w','rule-th','rule-del','addrule','resetrules','resetframework','fw-title','fw-type','fw-req',
    'fw-w','fw-up','fw-down','fw-ins','fw-del','fw-add','fw-autosort','doRename','reset','doPaste','sample']);
  ```

- **项目级操作（switchproj/gohome/newproj 创建/delproj）绝不允许入栈**（v13 血泪教训：曾把项目操作入栈导致撤销"删掉"当前项目）。

### 4.3 其他 document 级监听（分散注册）

| 事件 | 位置 | 用途 |
| --- | --- | --- |
| blur (capture) | init() | `.editable`/`.sub-card-body` 失焦保存（**合并 Object.assign 保留 rows/items/cards**） |
| paste | init() | 图片文件→base64 内联；富文本→清洗 width/height 后插入；图片 URL→转 img |
| drop/dragover | init() | 图片文件拖入正文内联 |
| keydown | bindStatic | Ctrl+Z 撤销（输入框内不拦截） |
| mouseup/mousedown | block3 评论 + 迷你格式条 | 选中文本→评论按钮/格式工具条 |
| scroll | 多处 | 大纲高亮、气泡跟随 |
| dragstart/dragover/drop/dragend | bindProjDrag / bindTocDrag | 项目拖拽、节拖拽（document 委托 + `__xxBound` 全局 guard 防重复绑定） |

---

## 5. 模块详解

### 5.1 项目与分组（v16）

- 渲染：`renderSidebar()`；分组数据 `STATE.groups`/`p.groupId`；展开态 `STATE.groupOpen`。

- 操作 case：`toggleprojpanel`（浮层开关）、`togglegroup`、`grp-add`（prompt 命名）、`grp-rename`（**复用 renameModal**，`renameCtx.type='grp'`，`doRename` 分支）、`grp-del`（组内项目回未分组）、`switchproj`、`newproj`、`delproj`、`renameproj`、`expmd`/`expdocx`。

- 拖拽（`bindProjDrag`）：项目拖到组标题→`setProjGroup`（进组+移到数组末尾）；拖到项目→`moveProjTo`（插入式排序+组归属跟随目标）；拖到未分组区→移出组。

- 浮层外点关闭监听在 bindStatic 末尾（`switchproj` 后自动收起）。

### 5.2 框架管理（fw）

- 两处框架列表（**极易混淆，改一处必须同步另一处**）：

  - `renderFrameworkTab()`：设置页「框架」tab，操作 **`STATE.framework`**（当前项目框架），case 前缀 `fw-`。

  - `renderFwEditor()`：新建项目/另存框架 modal，操作 **`fwEditorBuf`** 缓冲，case 前缀 `fwedit-`。

- 排序：`moveFw(i,dir)`（↑↓ 按钮）+ `reorderSection(fromIdx,toIdx)`（拖拽，TOC 与两处 fw 列表共用；`#fwEditList` 内走 fwEditorBuf 分支）。

- 拖拽绑在 `bindTocDrag()`（document 委托，`__tocDragBound` guard）。

### 5.3 健康度引擎

- `runHealth()`：遍历启用的规则 → `hitsFor(r)` 产出命中 → 过滤被"忽略/已完成"的 correction → 每节 engine 色（最坏等级）→ 合并 override 得 effective → 算指标（completion/risk/consistency/overrideCount）。

- `hitsFor(rule)`（~1175）：按 scope 匹配节，对节内 plain 文本/功能行/验收项做关键词与阈值判定（如 P0 占比、模糊词、TODO 占位符）。

- 交互：节标题色块 `data-act=ovmenu` 手动改色（overrides，需填原因）、命中行 `corr` 忽略/完成、`renderDrill` 展开缺口详情、`refreshHealthUI` 顶栏 pill + 卡片增量。

- 规则管理：设置页 tabRules（`renderRulesTab`，rule-en/lv/w/th/del/addrule/resetrules/导出导入 JSON）。

### 5.4 正文富文本（.editable）

- 数据在 `DATA[sec].html`；**失焦合并保存**（`Object.assign({}, cur, {html})`）——绝不整体替换，否则 rows/cards/items 会丢（v13 血泪）。

- 粘贴清洗：Word/网页 table/img 去 width/height/style；图片文件转 base64 内联（>2MB 提示占空间）；纯图片 URL 自动转 img。

- 迷你格式工具条（v15.8）：`ensureMiniFormatBar()` 监听 selectionchange，选区上方浮出 B/I/U/S/H2/H3/引用/链接/清格式，`execCommand` 应用；工具条 `mousedown preventDefault` 防丢选区。

- 图片：选中后 mediaBar 缩放/删除，`imgResizeHandle` 拖拽改尺寸（`positionImgHandle`）。

- 小卡片 `.sub-card`：正文内 `＋ 添加卡片`，卡片标题+正文（`.sub-card-body` 也是 contenteditable，`data-sec`/`data-idx` 定位）。

### 5.5 表格：**两套模型（全项目最容易踩坑处，务必分清）**

|  | 结构化表格（框架节） | 富文本表格（正文内嵌） |
| --- | --- | --- |
| 出现位置 | type=table 的节（meta/def/track） | 正文 `.editable` 里「插入表格」插入的 `<table>` |
| 数据形态 | `DATA[sec].rows` 数组 + colWidths/rowHeights | 存于 `.editable` 的 html 字符串，无独立结构 |
| DOM 容器 | `.table-scroll > table.user-tbl`（有 data-sec） | `.editable` 内直接 `<table>`（无 table-scroll） |
| 行/列操作 | 表头 × 删列（delcol）、行尾 × 删行、+行/+列按钮，改 rows 后 render | 渲染后注入操作条 `.rtbl-wrap`（+行/+列/-行/-列/删除表格）+ 单元格 × 按钮，直接改 DOM（`tblRowColOp`/`removeTableColumn`/`removeTableRow`） |
| 列宽 | colgroup col 宽度，`saveTblLayout` 持久化到 colWidths | 无持久化（遗留项） |
| 关键函数 | renderEditor table 分支、tcell 输入 | injectRichTableBars、injectRtblCellBtns、stripRtblHtml |

**⚠️ 富文本表格操作条防污染（红线）**：操作条/×按钮是运行时注入的临时 DOM（`data-rtbl` 标记）。保存正文时**必须** `stripRtblHtml(html)` 剥离，且渲染时也要剥一次防历史残留。**涉及 3 处**：`saveEditableEl`、text 节渲染、卡片渲染。漏一处 = 操作条 HTML 存进数据 = 渲染叠加 bug。

### 5.6 评论系统（block3 comment-controller）

- 视图态选中文本 → 浮动评论条 `.cmt-bar` → 输入 → `addComment`：插入 `<mark class="cmt-hl" data-cid>` + 评论写入 `store.comments[cid]`（store = `DATA[sec]` 或卡片对象）。

- 点击 mark（**捕获阶段绑定**，防被其他监听拦截）→ `showTip` 弹气泡（内容+作者+日期+删除）；mark 在视口底部时贴上/滚动回显。

- 常驻三件套：`cleanOrphans()`（render 重建后清理孤儿 mark）、`restoreTip()`（重建后恢复上次气泡）、MutationObserver 监听 `#main` childList。

- 顶栏「评论」面板（`openCommentsPanel`）：聚合全部评论，点击 `goCmt` 滚动定位+弹气泡。

- `curSec(el)`：正文取 `ed.dataset.id`，卡片取 `data-sec/data-idx`（v14 修复：卡片评论存错位置）。

### 5.7 视图模式控制器（block2）

- `view-mode` class 加到 `<html>` 时，在 hero 注入「PRD 健康体检报告」横幅（生成日期/节数/整体 verdict/完成度）。

- MutationObserver 监听 class/data-theme/main 变化自动同步；`window.__syncViewBanner` 供主脚本调用。

### 5.8 撤销

- `pushUndo()`：JSON 快照全量 STATE，去重，上限 `UNDO_MAX`（约 60）。

- `undo()`：弹栈 → **跳过不含当前项目的快照**（防垃圾快照误伤）→ 恢复 STATE → render；无内容提示。

- 触发：bindStatic 中 `MUT.has(act)` 的操作（见 4.2）；Ctrl+Z（输入框内不触发）。

### 5.9 导入导出

- 导入：`ingestFile`（按扩展名分流）→ md/txt 走 `parsePRD`+`autoGenImport`（标题识别自动建框架）；docx 走 **自实现 zip 解析**（`parseZip`→`parseRels`→`extractDocText` 按 headingLevel 分类）→ `doImportText` 建项目。加密 docx 检测（`isEncryptedDocx`）。

- 导出：`projectMD`（MD）、`buildDocx`（自实现 OOXML：封面 COVER+文档体+表格+图片，`makeZip`/`crc32`/`xmlEsc`）、JSON 备份（`backup`/`importbackup` 全量 STATE）、规则/框架 JSON。

- 注意：docx 导出是异步 Promise（`buildDocx(...).then(bytes => downloadBytes(...))`）。

### 5.10 模板（tpl）

- `showTpl` 打开模板 modal：占位符语法、`tplRegen` 重新生成、`tplApply(asNew)` 应用到当前/新建项目、草稿存取、文件导入。`tplPlaceholder`/`tplDefaultText`/`htmlToMd`/`mdToHtml` 转换。

### 5.11 主题（block0 theme-controller）

- `localStorage` 键 `prdKanbanTheme`；`html[data-theme=light|dark]` 控制变量切换；拟态皮肤 `<style id="dark-neumorphism">` 的 disabled 控制。

- 在设置页「偏好」tab 注入主题按钮（MutationObserver 监听 tabPrefs）。

---

## 6. 历史 Bug 根因库（改代码红线，按教训价值排序）

1. **撤销误删项目（v13，最严重）**：MUT 曾误含 switchproj/gohome/doCreateProject/delproj → 新建/切换项目时旧状态入栈，撤销恢复"建项目前"。修复：项目级操作永不入栈 + `undo()` 跳过不含当前项目的快照。

1. **表格内容"完成编辑后消失"（v14）**：`tcell` 渲染漏 `data-sec` → input 事件里读不到节 → 内容没写回 `c.rows`。**改表格输入前先确认元素有 data-sec/data-idx 定位链**。

1. **hover 依赖失效（v15.0–15.4，反复 5 轮）**：contenteditable 里 `e.target` 常是文本节点（无 `.closest()`）→ 监听器 return → 工具条永不出现。**教训：功能存在 ≠ 真的运行；交互尽量"渲染后直接注入"，不要依赖 hover/选中等脆弱链路**。

1. **mediaBar 升级不生效（v16 前）**：新按钮 innerHTML 写在 `if(!bar){...}` 内，而 init 已创建过 bar → 新内容永远写不进。**教训：升级 DOM 时把内容刷新移出 if 块，每次启动重写**。

1. **操作条污染数据（v15.6）**：注入 HTML 随 `ed.innerHTML` 存进 `c.html` → 渲染叠加。修复：`stripRtblHtml` 三处同步（save/渲染 text/渲染 card）。**漏一处即污染**。

1. **列宽拖不动 + 表格收缩（v13）**：`table-layout:auto` 下列宽是建议值；且 `.user-tbl{width:auto}` 被后定义 `.tbl{width:100%}` 覆盖。修复：`.table-scroll .user-tbl{width:auto;table-layout:fixed}`（提特异性）。

1. **评论点击没反应（v14）**：click 监听在冒泡阶段被其他 document 监听干扰；卡片评论 store 取错（只认 data-id）。修复：**捕获阶段绑定 + stopPropagation** + `curSec` 兼容卡片。

1. **渲染后状态丢失**：projPanel open（用 dataset 恢复）、TOC active（observer 重建）、评论气泡（restoreTip）。**任何"渲染后要保留的 UI 状态"都要显式恢复**。

1. **数据合并 vs 覆盖**：正文失焦保存必须 `Object.assign({}, cur, {html})` 合并；整体替换会清掉 rows/cards/items。

1. **沙箱/环境（仅开发时）**：node 写 `.workbuddy/` 偶发被禁 → 测试产物写 `tools/`；node --check 批跑偶发误报 → 用 `node -e` + vm.Script 或单文件重查；交付 .md 必须无 BOM UTF-8（WorkBuddy 预览乱码）。

---

## 7. 开发规范（每次改代码照此执行）

1. **发版必改版本水印**：`<div id="vbadge">` 里的 `vXX.X · 描述`，让用户刷新后一眼确认加载的版本（历史教训：多副本文件 + 缓存导致"没变化"排查半天）。

1. **新增交互**：按钮加 `data-act` + bindStatic 加 case；若需撤销支持，把 act 加进 `MUT`；若改动 DOM 后要保存正文，确认 `stripRtblHtml` 覆盖。

1. **渲染与数据边界**：运行时注入的临时 UI 必须打标记（data-rtbl 等）且**保存时剥离**；不要往 `c.html` 里留任何 UI 壳。

1. **多副本警惕**：目录里有深色拟态版/旧备份/publish 旧发布，只改主文件 `PRD智能看板.html`。

1. **自测清单**（改完至少跑一遍）：

  - 语法：Python 提取 4 个 script 块 → `node --check`（写 tools/，批跑失败就单块重查）。

  - 行为：`tools/` 下回归脚本 `verify_docx.js`（Word 导入 T1–T9）、`_verify_export.js`（导出）、`_verify_cmt3.js`（评论）、`_verify_r13.js`（撤销+表格兜底）、`_hp_m25.py`（分组拖拽）。

  - 手工：建项目→写正文→插表格增删行列→评论→分组拖拽→导出 MD/Word→刷新确认数据还在。

1. **测试产物**统一写 `D:\虚拟看板\tools\`（沙箱对 `.workbuddy/` 写入非确定）；读文件用 Python 写 + PowerShell 转 UTF-8 再 Read。
