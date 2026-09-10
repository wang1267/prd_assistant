# PMHub · 宣传片设计 Spec（video-shotcraft 自主自由创作）

> 模式：自主自由创作（用户授权全权推进，不逐阶段等待确认）
> 硬约束（用户给定）：无字幕、炫酷动效、使用自带免费商用音效库（SFX，无 BGM）、核心功能必须体现（帮助创作 PRD / AI 功能）

## 阶段 0：产品简报 + 需求到执行决策表

**产品**：PMHub（v18.41，单文件 HTML 应用）
**定位**：PRD 撰写 / 体检 / 优化 / 结构对齐 / 缺口处理 / 对话助手 / 多角色评审（含深度思考）
**受众**：产品/研发/QA/设计协作场景，对外展示（公开演示）
**核心卖点**：一份需求文档的全生命周期管理 + AI 可见即可做 + 多角色评审
**必须展示功能**（用户强调）：
1. 帮助创作 PRD（向导 Wizard / AI 辅助撰写 aiDes* / 模板套用 / 结构对齐）
2. AI 功能（可见即可做 command-palette / 体检 healthCheck / 优化 / 多角色评审 review + 深度思考 / 对话助手 aiFloatLog）
**时长/画幅**：~20s / 1920×1080 / 30fps
**语言**：无字幕（用户明确要求无字幕，C1 文案规则不适用，但保留引导性纯动画段落的解说需求→改为用界面自身文字承载，不额外加 caption）
**音频**：仅 SFX（免费商用音效库），无 BGM（静音基底 + 音效）
**数据口径**：公开演示数据（脱敏示例，通用 SaaS「协同」），可直接使用

## 阶段 1：视觉方向与 styleframe

**动效性格 tokens**（品牌→动效推导）：
- 能量轴：中（专业信赖 / 工具类 SaaS，非高能量 startup）
- 调性轴：严肃偏精致（enterprise / B2B）
- 预设：专业信赖（fintech/enterprise/B2B）→ 主时长@30f bezier(0,0,0.2,1)，过冲 1.0 不弹，squash 0
- 取舍：开场主体动作弧给足 3s（R3），品牌字标 hold ≥1s（R1），批量入场收尾留 0.5s 静止（R2）

**色板（100% 复用产品 design tokens，不另造皮肤）**：
- 深青品牌 `#1f3a45` / 强调蓝 `#1b4fd6` / 危险红 `#d64545` / 成功绿 `#2fa84f` / 警告黄 `#ECC94B` / 紫(AI) `#6C63FF` `#8B84FF`
- 浅色纸感底 `#faf9f7` `#f0eee9` `#e4e1da`；暗色面 `#26241f` `#2D313A` `#363B46`
- 字体：`--sans` 系统无衬线 / `--mono` 等宽 / `--serif` 衬线（无第三方字体依赖）

**光感**：干净、留白、克制高级感；单点光效（Q4 不群发、裁进圆角）；明暗双主题呼吸

**styleframe**：跳过独立 HTML 渲染（已通过之前 promo 截图验证色板/字体/光感，且本片直接复用真实页面截图，无额外风格探索价值）——记录理由：真实页面截图即 styleframe 来源。

## 阶段 2：功能到镜头映射

| 功能 | 首选卡 | 备选卡 | 依据 |
|------|--------|--------|------|
| 品牌开场（单主角） | `spotlight-hero-card` | `crane-rise-reveal` | Q5 开场单主角完整弧 |
| 帮助创作 PRD（撰写/向导） | `glass-pill-dictation-typing` | `assemble-then-type-flyin` | 打字/撰写动效，S4 拟音配键盘声 |
| AI 对话助手（流式响应） | `ai-stream-response` | `voice-waveform-live` | AI 流式输出/对话 |
| 可见即可做（命令面板） | `command-palette-summon` | `input-trigger-moves` | 命令面板召唤 |
| 体检/健康度（仪表） | `gauge-readout-moves` / `odometer-digit-roll` | `chart-live-moves` | 健康度环/数字滚动 |
| 多角色评审（节点/连线） | `glow-flyline-moves` | `collab-cursor-moves` | 节点连线流光 |
| 明暗主题切换 | `theme-switch-moves` | `segmented-thumb-hero` | 明暗过渡（炫酷核心） |
| 结尾合影/品牌定格 | `outro-group-photo-launch` | `ui-to-brand-morph` | Q8 发布会合影能量峰值 |

## 阶段 3：分镜表（自主放行）

| # | 时间 | 镜头 | 关键动效 | 镜头卡 | 页面状态 | SFX |
|---|------|------|----------|--------|----------|-----|
| 1 | 0-3s | 品牌开场 | 单卡聚光→推近→悬浮→描边光→归位，hold 1s | spotlight-hero-card | 顶栏+品牌（light） | transition-soft + sparkle |
| 2 | 3-7s | 帮助创作PRD | 撰写面板揭示，AI 辅助文字逐字打出，向导步骤浮现 | glass-pill-dictation-typing | 编辑器+aiDes（light） | keyboard(截段) + text 类 |
| 3 | 7-10s | 可见即可做 | 命令面板从顶部 summon，指令列表飞入 | command-palette-summon | command palette（light） | whoosh + ui-select-click(真实开关) |
| 4 | 10-13s | AI体检 | 健康度环 0→92% 填充，指标数字 digit-roll，红黄绿卡点亮 | gauge-readout-moves + odometer-digit-roll | 体检面板（light） | counter + light/sparkle |
| 5 | 13-16s | 主题切换(炫酷核心) | 整体 hue/亮度流畅过渡到 dark，流光描边扫过面板 | theme-switch-moves | light→dark 过渡 | transition + light/sparkle |
| 6 | 16-18s | 多角色评审 | 评审节点连线流光，脉冲光点沿路径跑，深度思考轮次 | glow-flyline-moves | 评审面板（dark） | data/flow + light |
| 7 | 18-20s | 结尾合影/品牌定格 | 各功能代表元素飞入围住字标，crane 拉远+舞台光，品牌 lockup | outro-group-photo-launch | 收尾（dark→light） | riser→impact→sparkle |

**能量曲线**：低开(1) → 功能推进(2-4) → 炫酷峰值(5 主题切换) → 收束(6) → 峰值合影(7)
**hold/rest 预算**：镜头1 品牌 hold 1s；镜头4 收尾 0.5s 静止；镜头7 品牌定格 ≥1s
**无字幕**：所有信息由界面自身文字承载，不叠加 caption

## 阶段 4-7：实现与交付

- 阶段4：起 server 加载 PMHub.html，capture-template 采三件套（全页2x/元素cutout/layout.json），light+dark 各一套
- 阶段5：Remotion 工程（template 起步），PageCam 2.5D 运镜，逐镜头 still 静帧验收
- 阶段6：SFX 钉帧（免费商用库，无 BGM），transition/impact/riser/light/text 类，相对帧号
- 阶段7：整片渲染 + ffmpeg 抽帧 + 独立 subagent 终检（final-review + aesthetic-rules）→ 终渲交付 mp4
