# AGENTS.md · PRD 智能看板 开发守则

本文件给任何接手本项目的 AI / 开发者。**改动前必读**,尤其注意下面的红线。

## 项目是什么

单文件 HTML 的 PRD 撰写 + 健康度自检工具:14 节框架写作、12 条规则红黄绿体检、Word/MD/JSON 导入导出、划线评论、富文本/结构化双表格、项目分组、AI 助手(深度体检/一键优化/结构对齐/**AI 撰写草稿**)、节级差异补丁版本链。纯前端 localStorage,零服务器依赖。

## 文件结构(勿拆散)

- `PRD智能看板.html`(唯一主文件,约 6700 行):全部 HTML/CSS/JS。
  - block0 `theme-controller`(约 730 行)
  - block1 主脚本(约 976–3900 行):状态/渲染/事件/表格/导入导出/模板
  - block2 `view-mode-controller`、block3-4 Floating UI、block5 `comment-controller`
  - block6 `ai-controller`(约 4300 行起):**AI 全部逻辑,独立 IIFE,默认不改 block1**
- `tools/`:回归/端到端脚本。`block1.js`、`ai-controller.js` 是**从主文件抽取的测试副本**,改主文件后必须重新抽取再跑测试。
- `PRD智能看板_*.md`:方案/白皮书/交接文档,发版后同步。

## 红线(血泪教训,违背必出 bug)

1. **发版必改左下角版本水印** `<div id="vbadge">`,用户靠它确认加载版本。
2. **富文本表格操作条防污染**:运行时注入的临时 DOM(`data-rtbl`)保存时必须 `stripRtblHtml` 剥离,涉及保存/渲染 text/渲染 card **三处**,漏一处即污染数据。
3. **两套表格模型**:结构化表格(框架节 `rows` 数组)与富文本表格(正文 html 内 `<table>`)逻辑不同,改动前先分清。
4. **正文失焦保存用合并**:`Object.assign({}, cur, {html})`,整体替换会清掉 rows/items/cards。
5. **项目级操作不入撤销栈**:`MUT` 只放编辑类 `data-act`;switchproj/newproj/delproj 等绝不入栈。
6. **AI Key 隔离**:只存独立键 `prdKanbanAiSettings`,永不进 STATE、永不随备份导出、错误信息不过滤 Authorization。
7. **AI 业务数据存 `p.ai`**(版本/pendingDiffs/诊断/忽略清单),随项目走。
8. **AI 输出必须经确定性校验才可写**:引用逐字匹配、标签闭合、表格列数、清单字段;blocked 禁接受。
9. **渲染全量重建**:事件走 document 委托 `data-act`/`data-ai`;渲染后要保留的状态需显式恢复。
10. **本地存储按浏览器+页面来源隔离**:跨环境迁移用「导出/导入 JSON 备份」。

## AI 控制器约定(block6)

- 新增交互:按钮加 `data-ai` + `aiBind()` 加 case;弹窗走 `aiInjectPanel()` 注入。
- 文本抽取 `aiDocText/aiSecText`;AI 请求 `aiChatOnce/aiChat/aiAskJSON`;版本 `aiCreateVersion/aiRestoreToVersion`。
- 「AI 提议、代码执行、人做决定」:生成/优化产出先入 `pendingDiffs` 逐条确认,接受才写正文。
- AI 撰写草稿(`aiGenStart`):按节生成,text/table 用 `replaceSection/replaceRows`,feat/accept/users 用 `replaceItems`(kind `items` 补丁);版本带 `transform:true`,恢复=回到生成前空白。
- 对外测试入口 `window.__AICtrl._test`。

## 验证纪律(改完必跑)

1. 重新抽取 block6:`node tools/regress_v1715.js` 前先同步 `tools/ai-controller.js`。
2. 语法:抽取后 `node --check tools/ai-controller.js`。
3. 回归:`node tools/regress_v162.js` ~ `v166.js`、`v170.js`、`v1715.js` 全绿。
4. 端到端(无头浏览器):`node tools/browser_check.mjs`(评论)、`browser_check_grid.mjs`(表格网格)、`browser_check_ai.mjs`(AI 既有)、`browser_check_gen.mjs`(AI 撰写)。
5. UI 截图:`node tools/screenshot_ui.mjs [输出目录]`(PowerShell 拉起 Edge/Chrome,沙箱内不要直接用 node spawn 浏览器)。

## 提交

保持主文件 + 文档 + 测试同步提交;`tools/block1.js`、`tools/ai-controller.js` 为抽取副本,一并更新。
