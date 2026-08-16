# PRD 智能看板 · v17.1 实施方案（P0：可信度与安全性）

> ⚠️ **归档说明**：本文件已被《[PRD智能看板_方案设计.md](PRD智能看板_方案设计.md)》（v17.24 整合版）取代，仅作为历史设计记录保留，**不再维护**；后续新增/修改请更新整合版。

> 状态：**已实现（v17.1）** · 版本：v1.0 · 日期：2026-08-16
> 基线：v17.0（AI 助手已上线）· 范围：独立复检 + 确定性校验 / 评分校准三件套 / 最小编辑补丁
> 原则：**可计算的交给代码，不可计算的才交给 AI；AI 提议、代码执行、人做决定。**

---

## 1. 背景与第一性目标

v17.0 已打通「测量 → 定位 → 改进 → 验证 → 沉淀」闭环，但存在四个可信度缺口：

1. **自评自证**：优化与复检用同一模型同一 prompt 体系，复检分数有同源性偏差；
2. **整节重写**：AI 返回整节 `newHtml`，评论划线、富文本样式、未授权细节可能被连带破坏；
3. **分数不可核查**：评分无证据引用、无缓存、有方差；
4. **无确定性校验**：表格列数错位、标签不闭合、评论 mark 丢失，AI 复检分数感知不到。

v17.1 只做一件事：**让 AI 的输出可被信任**。三项改动对应三个信任来源——独立视角、本地硬校验、最小侵入。

---

## 2. 改动一：评分校准三件套

### 2.1 评分 temperature 降至 0

- `aiScore`（深度体检）与新增 `aiReview`（复检）固定 `temperature: 0`，降方差。
- 优化生成保留 `0.3`（需要一定多样性）。

### 2.2 评分缓存（同文档不重复花钱）

- 缓存位置：`p.ai.scoreCache = {fingerprint, report}`。
- 指纹：`fnv1a64(JSON.stringify({text: aiDocText(), fw: framework 摘要, rules: ruleSet 摘要, dims: 维度配置}))`。
- 命中条件：指纹一致 → 直接返回缓存报告，面板显示「（内容未变化，使用缓存）」。
- 失效：任何正文/框架/规则/维度权重变化 → 指纹变化自动失效，无手动清理。
- 深度体检与一键优化的**基线评分**共用该缓存；优化中的**模拟复检**因文本每次变化，天然不命中。

### 2.3 证据引用 + 幻觉标记

- 评分 prompt 要求：每条 issue 必须带 `quote`（原文逐字引用，证明问题存在；"缺失"类问题引用所属节标题并注明未发现内容）；每个维度带一行 `note`（评分依据）。
- 本地校验：将 `quote` 与对应节文本做**规范化匹配**（折叠空白后匹配）。
  - 匹配失败 → 该 issue 标记 `lowConfidence: true`，面板显示「⚠ 引用未匹配原文，疑似幻觉，请人工核对」，不自动忽略、不自动拦截（避免误伤）。
- 面板问题行增加引用预览（可折叠），用户可点「定位」核对原文。

---

## 3. 改动二：独立复检 + 确定性校验

### 3.1 独立复检（`aiReview`）

- 新增独立评审调用，**不是**复用 `aiScore`：
  - 独立 system prompt：「你是独立的 PRD 评审复核员，不知道修改由谁生成。基于原文与修改后全文，检查：①是否解决原问题；②是否引入新问题（删除未授权内容、虚构需求、破坏结构）；③给出复核分与结论。」
  - 返回 JSON：`{score, verdict: 'pass'|'needs_work'|'fail', newIssues:[{sectionId,severity,reason,quote}], summary}`。
- 模型：设置页新增 `复检模型 reviewModel`（可选，留空 = 与主模型相同）；temperature 0。
- 达标判定升级为：`review.score ≥ 目标分` 且 `verdict !== 'fail'` 且确定性校验无硬伤。

### 3.2 确定性校验（本地、免费、硬约束）

在**待确认 Diff 生成时**对每条修改执行，结果附在条目上（`validation: {ok, warnings[], blocked[]}`）：

| 校验 | 规则 | 失败处理 |
|---|---|---|
| HTML 标签闭合 | 对 text 节新内容做基础标签配对检查（p/ul/ol/li/table/tr/td/th/strong/em/h3/h4） | blocked：禁止「接受」 |
| 表格结构 | rows 列数一致；至少 1 行；首行为表头 | blocked |
| 评论完整性 | 被替换块内原含 `.cmt-hl` 划线 → 提示该块评论会被覆盖 | warning（不强拦，提示人工确认） |
| 引用匹配 | 每条 block/row 修改的 `match` 必须在原文中找到 | blocked（未找到=跳过并提示） |
| 越界修改 | 修改节集合 ⊆ 本次优化范围 | blocked |

同时做**规则引擎前后对比**（确定性信号，不进 LLM）：

- `aiEvalRuleDelta(edits)`：临时把受影响节换成新内容 → 调 `runHealth()` → 对比 `metrics.risk / completion` → 还原。产出 `engineDelta: {riskBefore, riskAfter, completionBefore, completionAfter}`。
- 引擎恶化 → 不硬拦截，但在 Diff 头部显示「⚠ 规则引擎信号变差（风险 X→Y）」，供人工判断。

### 3.3 判定流程（v17.1 一键优化）

```
基线评分（缓存可命中，temperature 0）
每轮：
  aiOptimize → 块级/行级 edits
  aiValidateEdits(edits)  → 每条附 blocked/warning
  若有 blocked → 本轮作废（不产出 Diff），提示修改或放弃
  aiDocTextWith(edits) 模拟全文
  aiReview(...) → reviewScore + verdict + newIssues
  aiEvalRuleDelta(edits) → engineDelta
  达标 = reviewScore ≥ 目标 且 verdict≠fail 且 无 blocked
  回退护栏：reviewScore < 历史最好 → 保留最好版本（原逻辑）
finish → pendingDiffs（每条带 validation + review 结论）
```

---

## 4. 改动三：最小编辑补丁（块级）

### 4.1 为什么是"块级"而不是"句子级"

- 句子级文本手术（逐字符替换、保留 mark）实现复杂、对中文/富文本脆弱；
- 块级（段落/列表/表格行）是**最小可控单元**：未引用的块一律不动，评论只可能在被替换的那一块内丢失（有警告），版本补丁从"整节"缩到"被改的块"。

### 4.2 优化输出协议（text 节）

AI 不再返回整节 `newHtml`，改为：

```json
{"edits":[
  {"op":"replaceBlock","match":"该块原文（逐字，供定位）","newHtml":"替换后的整块 HTML"},
  {"op":"insertBlock","match":"锚点块原文","newHtml":"插入的块 HTML","position":"after|before"},
  {"op":"insertBlock","position":"start|end","newHtml":"插到节首/节尾"},
  {"op":"deleteBlock","match":"要删除的块原文"}
]}
```

### 4.3 本地执行器 `aiApplyEdits(id, edits)`

- 解析节 html 为 DOM，取**顶层块元素**（p/ul/ol/table/h3/h4/div.imp-img）；
- `match` 与块元素做**规范化文本匹配**（折叠空白，支持跨行）：
  - replaceBlock → 整块外 HTML 替换为清洗后的 `newHtml`；
  - insertBlock → 锚点块前/后插入；start/end 无锚点；
  - deleteBlock → 移除该块；
  - 未匹配 → 该 edit 标 blocked（绝不静默跳过）；
- 返回 `{html, unmatched[]}`；`aiDocTextWith` 用同一执行器生成模拟文本（保证模拟=真实）。

### 4.4 表格节：行级操作

```json
{"rowEdits":[
  {"op":"update","match":"首列单元格文本","cells":["列1","列2"]},
  {"op":"insert","match":"锚点行首列文本","cells":["列1","列2"],"position":"after|before"},
  {"op":"insert","position":"end","cells":["列1","列2"]},
  {"op":"delete","match":"该行首列文本"}
]}
```

- 定位：按首列文本匹配（比行号稳定）；未匹配 → blocked。
- items/cards 结构化节仍只给 `suggestion`（P1 再开放行级操作，本版不做）。

### 4.5 版本补丁格式（v17.1+）

```js
// 新格式：patch[sectionId] = 修改块数组（整节 → 块级，体积大幅缩小）
patch["purpose"] = [
  {kind:"block", blockOld:"<p>旧目标</p>", blockNew:"<p>新目标（量化）</p>"}
];
patch["meta"] = [
  {kind:"row", rowOp:"update", match:"v1", cells:["v1","张三"], rowOld:[...], rowNew:[...]}
];
```

### 4.6 兼容旧版（v17.0 版本链不丢）

- 旧格式 `patch[sid] = {old, new}`（整节）**保留读取**：`aiNormalizePatch()` 统一转内部视图；
- 应用/恢复/预览/Diff 展示全部走统一视图，新旧格式并存无感；
- 迁移策略：旧版本对象原样保存（不重写历史），仅新版本写新格式。

---

## 5. 数据模型与设置变更

```js
// 新增
p.ai.scoreCache = { fingerprint, report }
p.ai.lastReport.dimensions[].issues[] += { quote, lowConfidence }
p.ai.pendingDiffs.items[] += { validation:{ok,warnings[],blocked[]}, review:{score,verdict,newIssues[],summary} }
p.ai.versions[].patch  // 新格式（块/行级），兼容旧格式

// 设置新增
prdKanbanAiSettings += { reviewModel: '' }   // 空=同主模型
```

---

## 6. UI 变更

1. **问题清单**：每条可展开引用 `quote`；`lowConfidence` 显示「⚠ 引用未匹配」。
2. **待确认 Diff**：
   - 每条显示校验徽标（✓ 通过 / ⚠ 警告 / ⛔ 阻塞）；
   - blocked 条目「接受」按钮禁用，只能「修改/拒绝」；
   - 头部显示复检结论（分数/verdict）与规则引擎前后对比（有变化时）。
3. **版本历史 Diff 视图**：按块展示 old/new（不再整节贴长文本）。
4. **设置 AI tab**：新增「复检模型（可选，留空=主模型）」输入框。
5. **体检结果**：命中缓存时显示「（内容未变化，使用缓存）」。

---

## 7. 实现步骤（确认后按序执行）

| 步骤 | 内容 | 产出 |
|---|---|---|
| V1 | 评分校准：temperature 0 + 证据引用（quote/note）+ 幻觉标记 + 评分缓存 | 可复现、可核查、不重复花钱 |
| V2 | 块级执行器 `aiApplyEdits` + 表格行级操作 + 新旧 patch 双格式兼容 | 最小编辑落地 |
| V3 | 独立复检 `aiReview` + 确定性校验 `aiValidateEdits` + `aiEvalRuleDelta` + 判定流程改造 | 可信达标判定 |
| V4 | UI：引用展示/校验徽标/blocked 禁接受/复检结论/设置项 | 可感知的信任 |
| V5 | 收尾：水印 v17.1、同步三份文档、回归 + 浏览器端到端 | 可发布 |

每步保持 6 套旧回归全绿（111 断言），并新增 v17.1 断言。

---

## 8. 验收要点（v17.1 新增断言/用例）

1. 同一文档连续两次深度体检：第二次命中缓存、零网络调用；
2. issue 带 quote；quote 无法在原文匹配时被标记 lowConfidence；
3. 块级修改：只替换被引用块，未引用块/评论划线原样保留；
4. 表格行级修改：按首列匹配定位，列数不一致被 blocked；
5. 复检 verdict=fail 或 blocked 时，本轮不产出可接受 Diff；
6. 规则引擎前后对比显示在 Diff 头部（恶化仅警告）；
7. v17.0 旧格式版本仍可查看 Diff 与恢复；
8. 版本补丁体积：同改动规模下显著小于整节快照。

---

## 9. 待确认项

1. **补丁粒度**：采用"块级替换 + 表格行级"，不做句子级文本手术；被替换块内含评论划线时警告（不硬拦）——确认？
2. **独立复检**：默认同一模型 + 独立 prompt + temperature 0，设置里可另配 reviewModel——确认？
3. **硬拦截**：确定性校验 blocked 的修改禁止「接受」，只能修改/拒绝——确认？
4. **评分缓存**：基于内容指纹，同文档未变不重复调用——确认？
5. **兼容**：旧版 v17.0 版本链保留并支持查看/恢复——确认？

—— 以上 5 项均已确认并实现（v17.1）。

---

## 10. 实现状态与偏差记录（v17.1）

已按 V1→V5 完成并全量验证：6 套回归 **117 断言**（v162~v166 共 85 + v170 升级为 32）全绿；无头 Chrome 端到端 **9 断言**全绿、控制台零报错；评论气泡与表格网格旧检查全绿；水印 v17.1，三份文档已同步。

与方案的偏差（均为实现细节收窄/兜底）：

| 项 | 方案 | 实现 |
|---|---|---|
| blocked 轮次 | 本轮作废（不产出 Diff） | 同方案：存在 blocked 修改时整轮不采用并记录原因 |
| 恢复最新版本 | 撤销其后人工改动 | 新格式补丁按块 `aiEnsureTarget` 落回目标态；人工改动后的块找不到精确锚点时追加兜底（罕见），人工改动本身已存于「恢复前快照」可再撤销 |
| 手动增量捕获 | 优化前自动记人工版 | 新格式版本链下跳过（恢复前快照兜底），旧格式仍自动捕获 |
| 归一化清洗 | — | `aiNormEdit` 归一化时即对 newHtml 做 `aiSanitizeHtml`（更早拦截） |
| 复检模型 | 设置项 reviewModel | 已实现；`aiChatOnce` 支持 `opts.model` 覆盖 |

遗留（下一版候选）：items/cards 结构化节的行级操作、句子级文本手术、本地模型引导（Base URL 已兼容 Ollama）、AI 效果埋点（接受率/耗时/前后规则命中数）。
