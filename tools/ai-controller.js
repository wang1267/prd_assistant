
/* 需求文档工作台 · AI Agent 控制器（v17.0）
   纯前端方案 C：DeepSeek 直连、Key 存独立 localStorage 键、不导出。
   功能：AI 设置 / 测试连接 / 6 维健康度 / 逐条问题诊断 / 一键优化（全文或按节）
         / 节级差异补丁版本（上限 10 版，回滚护栏）/ AI Diff 逐条确认（接受/拒绝/修改/暂缓）
   以独立 <script id="ai-controller"> 追加，不修改主脚本（block1）。
*/
(function(){
'use strict';
var AI_SAMPLE_TEXT="# 22\r\n\r\n## 文档变更历史\r\n## 目的\r\n本文档用于定义智能座舱语音助手「多意图连续对话与免唤醒交互」功能的完整需求，明确该功能要解决的痛点、目标用户、核心业务流程、功能边界与验收标准。该功能面向量产智能座舱平台，作为车机语音交互的基础能力升级，旨在把&quot;一次一问一答&quot;升级为&quot;自然、连续、可打断&quot;的车内语音交互体验，降低驾驶中操作车机的分心成本。 ---\r\n\r\n## 适用范围\r\n本文档适用于 **「星舱 OS」智能座舱平台 V3.2 及以上版本** 的车载语音助手模块开发与测试，为平台化能力。 - 适用系统：座舱域控制器（CDC）上的语音助手 App（Android/Linux 双栈）。 - 适用车型：搭载星舱 OS V3.2 的全部在研车型（平台化，非单车型定制）。 - 协作边界： - 语音算法（ASR/NLU/TTS）由 **算法供应商 A** 提供 SDK，座舱团队负责集成与端侧调度； - 车控指令执行（空调、车窗、导航等）由 **整车控制团队** 提供能力网关，语音团队只调用接口； - 云端语义理解与上下文管理由 **语音云平台团队** 负责，座舱团队负责端云链路与降级策略。 ---\r\n\r\n## 定义\r\n## 产品信息与目标\r\n1 产品方案 本功能在现有\"唤醒词 + 单轮指令\"架构上，新增**会话上下文管理器**与**连续对话状态机**，实现一次唤醒后可连续下达多条指令、支持一句话多意图、支持随时打断与修正。整体方案自上而下分为四层：- **交互层（车机端）**：负责收音（麦克风阵列）、播报（TTS）、界面反馈与打断检测。- **决策层（车机端）**：会话状态机、上下文管理、端侧兜底解析。- **理解层（云侧）**：多意图 NLU、指代消解、上下文语义补全。- **执行层（车控网关）**：将结构化指令分发给空调、导航、媒体等子系统。```mermaidflowchart LRA[麦克风阵列] --> B[VAD/ASR 端侧]B --> C{是否在对话上下文中?}C -->|是| D[免唤醒直送 NLU]C -->|否| E[唤醒词检测]E -->|命中| DD --> F[云端多意图 NLU]F --> G[会话上下文管理器]G --> H[指令结构化]H --> I[车控/导航/媒体网关]I --> J[TTS 播报 + 界面反馈]``` 2 业务流程图 3 产品目标 ⭐ 目标必须可量化，作为验收与上线判断依据：- 一次唤醒后连续对话轮次 ≥ 5 轮（免唤醒续指令）。- 多意图语句拆解准确率 ≥ 92%（内部测试集）。- 唤醒率 ≥ 95%，误唤醒 ≤ 1 次 / 24 小时。- 端到端响应延迟（说完话到开始播报）≤ 1.5 秒（4G/5G 网络）。- 免唤醒监听窗口内二次指令识别率 ≥ 90%。- 上线后车内语音操控相关驾驶分心投诉下降 ≥ 25%。---\r\n\r\n### 1 产品方案\r\n本功能在现有\"唤醒词 + 单轮指令\"架构上，新增**会话上下文管理器**与**连续对话状态机**，实现一次唤醒后可连续下达多条指令、支持一句话多意图、支持随时打断与修正。整体方案自上而下分为四层：- **交互层（车机端）**：负责收音（麦克风阵列）、播报（TTS）、界面反馈与打断检测。- **决策层（车机端）**：会话状态机、上下文管理、端侧兜底解析。- **理解层（云侧）**：多意图 NLU、指代消解、上下文语义补全。- **执行层（车控网关）**：将结构化指令分发给空调、导航、媒体等子系统。```mermaidflowchart LRA[麦克风阵列] --> B[VAD/ASR 端侧]B --> C{是否在对话上下文中?}C -->|是| D[免唤醒直送 NLU]C -->|否| E[唤醒词检测]E -->|命中| DD --> F[云端多意图 NLU]F --> G[会话上下文管理器]G --> H[指令结构化]H --> I[车控/导航/媒体网关]I --> J[TTS 播报 + 界面反馈]```\r\n\r\n### 2 业务流程图\r\n\r\n\r\n### 3 产品目标 ⭐\r\n目标必须可量化，作为验收与上线判断依据：- 一次唤醒后连续对话轮次 ≥ 5 轮（免唤醒续指令）。- 多意图语句拆解准确率 ≥ 92%（内部测试集）。- 唤醒率 ≥ 95%，误唤醒 ≤ 1 次 / 24 小时。- 端到端响应延迟（说完话到开始播报）≤ 1.5 秒（4G/5G 网络）。- 免唤醒监听窗口内二次指令识别率 ≥ 90%。- 上线后车内语音操控相关驾驶分心投诉下降 ≥ 25%。---\r\n\r\n## 使用者需求\r\n\r\n\r\n### 1 目标客户\r\n角色说明与本功能关系驾驶员行车中的主要语音用户高频使用免唤醒续指令、多意图乘客（副驾/后排）可独立发起语音请求支持声源定位区分主驾/副驾座舱测试人员验证功能与验收按第 11 章验收标准执行售后 / 运营查看语音使用数据消费第 9 章埋点数据\r\n\r\n### 2 场景描述 ⭐\r\n- **场景 1（多意图一次性下达）**：驾驶员上车后说\"你好星舱，打开空调 24 度，导航回家，再放首周杰伦的歌\"。系统拆出三条子指令：空调设温、导航回家、播放音乐，并行执行并一次性汇总播报\"已为您打开空调、开始导航回家、正在播放周杰伦\"。- **场景 2（免唤醒连续对话）**：上述播报结束后，驾驶员无需再说唤醒词，直接说\"音量调小一点\"，系统识别为对媒体的续指令并立即执行。- **场景 3（驾驶中打断修正）**：系统正在播报长导航提示时，驾驶员打断说\"别导航了，改去公司\"。系统停止当前播报，取消原导航，重新发起去公司导航。- **场景 4（异常：噪音过大识别失败）**：隧道内风噪大，ASR 连续两次识别置信度低于阈值。系统播报\"没太听清，您再说一遍？\"并重新进入监听，不退出上下文。---\r\n\r\n## 功能需求\r\n| 功能点 | 描述 | 优先级 | 状态 |\r\n|---|---|---|---|\r\n| | | | |\r\n\r\n### 1 功能总览 ⭐\r\n一级功能二级功能三级功能功能描述优先级状态连续对话会话上下文—维护一次会话内的历史与状态P0 高评审中连续对话免唤醒监听—对话窗口内无需唤醒词续指令P0 高评审中连续对话打断恢复—播报中可被打断并接管P1 中草稿多意图意图拆分—一句话拆多条子指令P0 高评审中多意图并行执行—子指令并行分发与汇总P1 中草稿多意图指代消解—\"调小一点\"等省略指代补全P1 中草稿容错低置信兜底—识别失败时友好提示重说P1 中草稿容错端侧降级—无网时端侧基础指令可用P2 低草稿状态建议值：草稿 → 评审中 → 开发中 → 测试中 → 已上线\r\n\r\n### 2 功能详情\r\n\r\n\r\n### 1 多意图连续对话\r\n**功能名称**：多意图连续对话\r\n\r\n### 1 功能时序图/流程图\r\n\r\n\r\n### 2 业务规则阐述\r\n项目内容功能名称多意图连续对话优先级P0 高功能路径任意界面下说唤醒词进入功能描述一次唤醒后支持多轮免唤醒续指令、一句话多意图拆分并行执行、播报中可打断操作步骤1. 说唤醒词\"你好星舱\"进入对话。2. 下达指令（可多意图）。3. 播报结束后 8s 内可免唤醒续指令。4. 任意时刻可打断播报接管。业务规则1. 多意图上限 3 条子指令，超出部分提示\"一次最多处理 3 条，其余稍后说\"。2. 免唤醒窗口默认 8s，可调（5–15s）。3. 子指令间相互独立，单条失败不影响其余。4. 指代消解仅在当前会话上下文有效，会话结束清空。列表规则N/A（非列表型功能）\r\n\r\n### 3 交互说明 ⭐\r\n- **唤醒反馈**：唤醒成功播放轻微\"叮\"声 + 麦克风图标亮起（呼吸态）。- **识别中**：麦克风图标转圈，状态栏显示\"正在聆听…\"。- **识别成功**：图标变实，开始执行；多意图时显示\"已识别 N 条指令\"卡片。- **识别失败**：图标抖动 + 播报\"没听清，您再说一遍？\"。- **播报中打断**：用户开口即压低/停止 TTS，图标回到聆听态。- **退出上下文**：8s 无输入后麦克风图标熄灭，播放极轻\"噗\"声提示。\r\n\r\n### 4 异常处理/边界条件 ⭐\r\n异常场景处理方式ASR 置信度 < 阈值（两次）播报\"没太听清，您再说一遍？\"，重新监听，不退出上下文多意图超过 3 条执行前 3 条，播报\"一次最多处理 3 条，其余请稍后说\"子指令执行失败（如导航无网络）仅播报失败项原因并提供替代（\"导航暂不可用，要我设个提醒吗？\"）网络中断（云 NLU 不可达）自动切端侧降级：仅支持空调/媒体/车窗等本地指令，提示\"已切换离线模式\"免唤醒窗口内误触发（车内聊天）VAD 结合唤醒词置信度过滤，疑似误触发则不执行，仅轻提示用户打断后长时间沉默打断后重置 8s 窗口，超时正常退出同车多人同时说话声源定位只采纳主驾/被指定乘客声道，其余忽略\r\n\r\n### 5 权限要求 ⭐\r\n- 仅车辆 P 档或行驶中均可使用语音，但**行驶中禁用**需要长时间目视的操作类确认弹窗（改为纯语音确认）。- 车控敏感指令（车窗、门锁、天窗）在行驶中仅主驾声道可触发，且需语音二次确认。- 副驾/后排发起的指令默认不执行车控类，仅限媒体/信息查询，除非主驾在设置中开启\"全车语音控车\"。- 所有语音指令与执行结果记录到本地日志（含时间戳、声道、指令摘要），用于售后追溯，不上传明文语音。---\r\n\r\n## 非功能需求\r\n1 性能需求 - 端到端响应延迟（VAD 结束到 TTS 起播）≤ 1.5s（网络正常）。- 云端 NLU 并发支持单车型 ≥ 5 万在线用户峰值。- 多意图拆分耗时 ≤ 300ms（云端）。 2 安全性 - 语音日志不含明文音频，仅存指令摘要与脱敏文本。- 车控敏感指令需声道校验 + 语音二次确认，防止误触发。- 云端链路全程 TLS，token 短期有效，防止重放。 3 技术架构需求 - 端侧决策层以 SDK 形式集成，支持 Android 与 Linux 座舱双栈。- 云侧 NLU 提供 gRPC 接口，返回 JSON 结构化意图。- 上下文状态机支持端云协同：端侧保活、云侧持久化会话。 4 可用性 ⭐ - 语音助手整体可用性 ≥ 99.5%（月度不可用 ≤ 3.6h）。- 单指令失败不影响其他子系统与整车功能。- 异常恢复（如云端超时自动降级）时间 ≤ 2s。 5 接口需求 ⭐ - 车控执行网关：`POST /v1/vehicle/command`（JSON：{intent, slots, source}）。- 云端 NLU：`grpc CockpitNLU/Parse（audio_feature, context_id）`。- 上下文管理：`GET/PUT /v1/session/{context_id}`。- 接口完整字段与错误码见《星舱 OS 语音接口规范 V3.2》。---\r\n\r\n### 1 性能需求\r\n- 端到端响应延迟（VAD 结束到 TTS 起播）≤ 1.5s（网络正常）。- 云端 NLU 并发支持单车型 ≥ 5 万在线用户峰值。- 多意图拆分耗时 ≤ 300ms（云端）。\r\n\r\n### 2 安全性\r\n- 语音日志不含明文音频，仅存指令摘要与脱敏文本。- 车控敏感指令需声道校验 + 语音二次确认，防止误触发。- 云端链路全程 TLS，token 短期有效，防止重放。\r\n\r\n### 3 技术架构需求\r\n- 端侧决策层以 SDK 形式集成，支持 Android 与 Linux 座舱双栈。- 云侧 NLU 提供 gRPC 接口，返回 JSON 结构化意图。- 上下文状态机支持端云协同：端侧保活、云侧持久化会话。\r\n\r\n### 4 可用性 ⭐\r\n- 语音助手整体可用性 ≥ 99.5%（月度不可用 ≤ 3.6h）。- 单指令失败不影响其他子系统与整车功能。- 异常恢复（如云端超时自动降级）时间 ≤ 2s。\r\n\r\n### 5 接口需求 ⭐\r\n- 车控执行网关：`POST /v1/vehicle/command`（JSON：{intent, slots, source}）。- 云端 NLU：`grpc CockpitNLU/Parse（audio_feature, context_id）`。- 上下文管理：`GET/PUT /v1/session/{context_id}`。- 接口完整字段与错误码见《星舱 OS 语音接口规范 V3.2》。---\r\n\r\n## 自测\r\n- 功能自测通过率 ≥ 95%。 - P0 级 Bug 数量 = 0 方可提测。 - 第 6.2.1.4 异常表全部场景须有对应测试用例覆盖。 - 多意图测试集（≥ 200 条）拆分准确率达标方可合入。 ---\r\n\r\n## 埋点\r\n## 界面\r\n&gt; 文档类型：产品需求文档（PRD） &gt; 适用领域：智能座舱 / 车载语音助手 / 车机功能定义 &gt; 版本：V1.0 状态：评审中 &gt; 基于《PRD 模板（产品需求文档）》结构撰写，含模板标注 ⭐ 的强化章节。 --- - 麦克风状态图标贯穿全系统常驻状态栏，含聆听/识别/播报/熄灭四态。 - 多意图执行时以卡片列出各子指令状态（进行中/成功/失败），配色区分。 - 所有语音按钮具备正常、悬停、按下、禁用四态样式。 - 车机端触控目标最小 48×48px，夜间模式自适应，行驶中简化非必要视觉元素。 - 驾驶中禁止模态确认弹窗，统一改为语音播报 + 语音确认。 ---\r\n\r\n## 验收\r\n- [ ] 验收标准需可\"是/否\"判定：（待定）\r\n- [ ] 1. 说唤醒词后，一次说出含 2 条意图的语句，系统拆出并执行 2 条子指令，汇总播报正确。（待定）\r\n- [ ] 2. 播报结束后 8s 内直接说\"音量调小\"，系统免唤醒执行媒体音量调整。（待定）\r\n- [ ] 3. 说出含 4 条意图的语句，系统仅执行前 3 条并提示超出限制。（待定）\r\n- [ ] 4. 播报过程中用户开口打断，TTS 立即停止并转入聆听。（待定）\r\n- [ ] 5. 模拟断网，系统自动切换离线模式且仅执行本地指令，提示\"已切换离线模式\"。（待定）\r\n- [ ] 6. 行驶中（模拟信号）发起车窗指令，系统要求语音二次确认方可执行。（待定）\r\n- [ ] 7. 连续 5 轮免唤醒指令全部成功，第 6 轮起需重新唤醒。（待定）\r\n- [ ] 8. 副驾声道发起车控指令，默认被忽略（未开启全车控车时）。（待定）\r\n- [ ] --（待定）\r\n\r\n## 上线\r\n- 上线前完成 UAT 并由产品/测试双签确认。 - 灰度策略：先 5% 车辆灰度 3 天，无 P0 再扩至 100%。 - 上线时间窗口：车辆 OTA 静默时段 02:00–04:00。 - 回滚方案：灰度期间出现 P0（如误控车），立即通过OTA 回滚语音助手至 V3.1 并关闭多意图开关。 - 上线后监控第 9 章埋点 48 小时，确认唤醒率/误唤醒在目标区间。 ---\r\n\r\n## 其他相关文件\r\n- 《星舱 OS 语音接口规范 V3.2》 - 《智能座舱麦克风阵列与声源定位设计文档》 - 《车控网关指令字典 V3.2》 - 《PRD 模板（产品需求文档）》 - 《UI 设计稿 - 语音交互状态》（Figma 链接见内部空间） --- - [x] 目的：一句话能说清本功能为什么存在（升级语音交互、降驾驶分心） - [x] 定义：ASR/NLU/TTS/VAD/多意图/免唤醒 等均已解释 - [x] 目标：均为可量化指标（轮次、准确率、延迟等） - [x] 场景：含 3 个正常场景 + 1 个异常场景 - [x] 功能总览：每个功能均有优先级与状态 - [x] 功能详情：字段/业务规则、交互、异常、权限均覆盖 - [x] 异常处理：列出 7 类异常及处理方式 - [x] 权限：主驾/副驾/行驶中约束明确 - [x] 验收：8 条均可&quot;是/否&quot;判定 - [x] 变更历史：已记录 V1.0 初稿 --- *本 PRD 基于《PRD 模板（产品需求文档）》结构生成，适用于智能座舱语音助手产品定义。模板中标注 ⭐ 的为原模板缺失或薄弱、本次已落地的强化章节。* 目录 1. 目的2. 适用范围3. 定义4. 产品信息和目标5. 使用者需求6. 功能需求7. 非功能性需求8. 自测需求9. 埋点需求10. 界面需求11. 验收需求12. 上线需求13. 其他相关文件14. 文档变更历史---\r\n\r\n### 目录\r\n1. 目的2. 适用范围3. 定义4. 产品信息和目标5. 使用者需求6. 功能需求7. 非功能性需求8. 自测需求9. 埋点需求10. 界面需求11. 验收需求12. 上线需求13. 其他相关文件14. 文档变更历史---\r\n";
var AI_SETTINGS_KEY='prdKanbanAiSettings';
var AI_MAX_VERSIONS=10;
var AI_PATCH_WARN=300*1024;
var AI_SCORE_CHUNK_CHARS=5500; // v17.22：长文档分块评分阈值（单块约 5.5k 字，弱模型安全）
var DIM_META={
  completeness:{label:'完整性'},
  clarity:{label:'清晰度'},
  consistency:{label:'一致性'},
  executability:{label:'可执行性'},
  verifiability:{label:'可验证性'},
  risk:{label:'风险'}
};
function defaultSettings(){
  return {
    provider:'deepseek',
    baseUrl:'https://api.deepseek.com/v1',
    model:'deepseek-chat',
    reviewModel:'',
    apiKey:'',
    targetScore:85,
    maxRounds:3,
    dims:{
      completeness:{weight:25,enabled:true},
      clarity:{weight:20,enabled:true},
      consistency:{weight:15,enabled:true},
      executability:{weight:15,enabled:true},
      verifiability:{weight:15,enabled:true},
      risk:{weight:10,enabled:true}
    }
  };
}
/* ---------- 工具 ---------- */
function aiEsc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function aiDeep(o){try{return JSON.parse(JSON.stringify(o));}catch(e){return o&&typeof o==='object'?Object.assign({},o):o;}}
function aiUid(){return 'a'+Date.now().toString(36)+Math.floor(Math.random()*1e6).toString(36);}
function aiKey(sec,reason){var s=(sec||'')+'|'+(reason||'');var h=5381;for(var i=0;i<s.length;i++){h=((h<<5)+h+s.charCodeAt(i))>>>0;}return 'i_'+h.toString(36);}
function aiFingerprint(str){
  try{
    var h=0xcbf29ce484222325n;
    var bytes=new TextEncoder().encode(String(str||''));
    for(var i=0;i<bytes.length;i++){h=BigInt.asUintN(64,h^BigInt(bytes[i]));h=BigInt.asUintN(64,h*0x100000001b3n);}
    return h.toString(16);
  }catch(e){var h2=5381;var s2=String(str||'');for(var j=0;j<s2.length;j++){h2=((h2<<5)+h2+s2.charCodeAt(j))>>>0;}return 'h'+h2.toString(36);}
}
function aiNormText(s){
  return String(s==null?'':s).replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim().toLowerCase();
}
function aiReplaceFirst(h,from,to){
  var i=h.indexOf(from);
  if(i<0)return h;
  return h.slice(0,i)+to+h.slice(i+from.length);
}
function aiBlockTags(){return ['P','UL','OL','TABLE','H3','H4'];}
function aiIsBlockTag(tag,attrs){return aiBlockTags().indexOf(tag)>=0||(tag==='DIV'&&/imp-img/i.test(attrs||''));}
function aiBlocksOf(html){
  var h=String(html||''),blocks=[],stack=[],curStart=-1;
  var tagRe=/<\/?([a-zA-Z][a-zA-Z0-9]*)((?:"[^"]*"|'[^']*'|[^>"'])*)\/?>/g,m;
  while((m=tagRe.exec(h))){
    var closing=m[0].charAt(1)==='/';
    var tag=m[1].toUpperCase();
    if(!aiIsBlockTag(tag,m[2]))continue;
    if(!closing){
      if(!stack.length)curStart=m.index;
      stack.push(tag);
    }else if(stack.length){
      var idx=stack.lastIndexOf(tag);
      if(idx>=0){
        stack.splice(idx);
        if(!stack.length&&curStart>=0){
          var end=m.index+m[0].length;
          blocks.push({html:h.slice(curStart,end),text:aiNormText(h.slice(curStart,end))});
          curStart=-1;
        }
      }
    }
  }
  return blocks;
}
function aiHtmlBalanced(html){
  var h=String(html||''),stack=[];
  var voidTags={BR:1,IMG:1,HR:1,INPUT:1,META:1,LINK:1};
  var re=/<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g,m;
  while((m=re.exec(h))){
    var tag=m[1].toUpperCase();
    if(voidTags[tag])continue;
    if(m[0].charAt(1)==='/'){if(stack.length&&stack[stack.length-1]===tag)stack.pop();else return false;}
    else stack.push(tag);
  }
  return stack.length===0;
}
function aiApplyEdits(html,edits){
  var results=[];
  edits.forEach(function(e){
    var r={edit:e,ok:false,reason:''};
    if(!e||!e.op){r.reason='缺少操作类型';results.push(r);return;}
    if(e.op==='insertBlock'&&(e.position==='start'||e.position==='end')){
      var ins=aiSanitizeHtml(e.newHtml);
      html=e.position==='start'?ins+html:html+ins;
      r.ok=true;r.oldHtml='';r.newHtml=ins;r.anchor='';results.push(r);return;
    }
    var blocks=aiBlocksOf(html),target=null,ti=-1,mt=aiNormText(e.match);
    for(var i=0;i<blocks.length;i++){
      if(mt&&(blocks[i].text===mt||blocks[i].text.indexOf(mt)>=0)){target=blocks[i];ti=i;break;}
    }
    // v17.7：单块未命中时尝试连续多块范围匹配（模型常把连续多段粘贴成 match）
    if(!target&&mt){
      for(var rs=0;rs<blocks.length;rs++){
        var concat='';
        for(var re2=rs;re2<blocks.length&&re2<rs+10;re2++){
          concat+=(re2>rs?' ':'')+blocks[re2].text;
          if(concat.indexOf(mt)>=0){
            target={html:blocks.slice(rs,re2+1).map(function(b){return b.html;}).join(''),text:concat};
            ti=rs;
            break;
          }
        }
        if(target)break;
      }
    }
    if(!target){r.reason='未找到匹配的原文块（引用需与原文逐字一致）';results.push(r);return;}
    if(e.op==='replaceBlock'){
      var nh=aiSanitizeHtml(e.newHtml);
      html=aiReplaceFirst(html,target.html,nh);
      r.ok=true;r.oldHtml=target.html;r.newHtml=nh;r.anchor='';results.push(r);return;
    }
    if(e.op==='deleteBlock'){
      html=aiReplaceFirst(html,target.html,'');
      r.ok=true;r.oldHtml=target.html;r.newHtml='';r.anchor=ti>0?blocks[ti-1].text.slice(0,80):'';results.push(r);return;
    }
    if(e.op==='insertBlock'){
      var nh2=aiSanitizeHtml(e.newHtml);
      var pos=e.position==='before';
      html=aiReplaceFirst(html,target.html,pos?nh2+target.html:target.html+nh2);
      r.ok=true;r.oldHtml='';r.newHtml=nh2;r.anchor=target.text.slice(0,80);results.push(r);return;
    }
    r.reason='未知操作：'+e.op;results.push(r);
  });
  return {html:html,results:results};
}
function aiNormCell(v){return aiNormText(String(v==null?'':v));}
function aiRowCellsOk(cells,rows){
  if(!Array.isArray(cells)||!cells.length)return false;
  var n=rows&&rows.length&&rows[0].cells?rows[0].cells.length:cells.length;
  return cells.length===n;
}
function aiRowExec(rows,rowEdits){
  var out=aiDeep(rows||[]),results=[];
  rowEdits.forEach(function(e){
    var r={edit:e,ok:false,reason:''};
    if(!e||!e.op){r.reason='缺少行操作类型';results.push(r);return;}
    if(e.op==='insert'&&e.position==='end'){
      if(!aiRowCellsOk(e.cells,out)){r.reason='列数与表头不一致';results.push(r);return;}
      var nr={cells:(e.cells||[]).map(function(v){return String(v==null?'':v);})};
      out.push(nr);
      r.ok=true;r.rowOld=null;r.rowNew=aiDeep(nr);r.anchor='';results.push(r);return;
    }
    var ti=-1,mt=aiNormText(e.match);
    for(var i=0;i<out.length;i++){
      var c0=aiNormCell(out[i]&&out[i].cells&&out[i].cells[0]);
      if(mt&&c0&&(c0===mt||c0.indexOf(mt)>=0)){ti=i;break;}
    }
    if(ti<0){r.reason='未找到匹配行（按首列文本）';results.push(r);return;}
    if(e.op==='update'){
      if(!aiRowCellsOk(e.cells,out)){r.reason='列数与表头不一致';results.push(r);return;}
      r.rowOld=aiDeep(out[ti]);
      out[ti]={cells:(e.cells||[]).map(function(v){return String(v==null?'':v);})};
      r.rowNew=aiDeep(out[ti]);r.anchor='';r.ok=true;results.push(r);return;
    }
    if(e.op==='delete'){
      r.rowOld=aiDeep(out[ti]);
      out.splice(ti,1);
      r.rowNew=null;r.anchor=ti>0?aiNormCell(out[ti-1]&&out[ti-1].cells&&out[ti-1].cells[0]):'';r.ok=true;results.push(r);return;
    }
    if(e.op==='insert'){
      if(!aiRowCellsOk(e.cells,out)){r.reason='列数与表头不一致';results.push(r);return;}
      var nr2={cells:(e.cells||[]).map(function(v){return String(v==null?'':v);})};
      var pos=e.position==='before'?ti:ti+1;
      out.splice(pos,0,nr2);
      r.anchor=aiNormCell(out[ti]&&out[ti].cells&&out[ti].cells[0]);r.rowOld=null;r.rowNew=aiDeep(nr2);r.ok=true;results.push(r);return;
    }
    r.reason='未知行操作：'+e.op;results.push(r);
  });
  return {rows:out,results:results};
}
function aiSleep(ms){return new Promise(function(r){setTimeout(r,ms);});}
function aiClamp(v,lo,hi){v=+v;if(isNaN(v))return lo;return Math.max(lo,Math.min(hi,v));}
function aiRound(v){return Math.round((+v||0));}
function aiStripTags(h){if(!h)return '';var d=document.createElement('div');d.innerHTML=String(h);return (d.textContent||'').replace(/\s+/g,' ').trim();}
function aiToast(m){try{if(typeof toast==='function')toast(m);else alert(m);}catch(e){try{alert(m);}catch(e2){}}}
function aiHtmlToText(h){if(typeof htmlToText==='function'){try{return htmlToText(h)||'';}catch(e){}}return aiStripTags(h);}
function aiSectionEmpty(type,id){if(typeof sectionEmpty==='function'){try{return sectionEmpty(type,id);}catch(e){}}return {html:''};}
function aiHashOf(o){return aiKey('obj',JSON.stringify(o));}

/* ---------- 设置存取 ---------- */
function aiGetSettings(){
  var def=defaultSettings();
  try{
    var raw=localStorage.getItem(AI_SETTINGS_KEY);
    if(raw){var s=JSON.parse(raw);if(s&&typeof s==='object'){def=Object.assign(def,s);def.dims=Object.assign(def.dims,s.dims||{});Object.keys(DIM_META).forEach(function(k){if(!def.dims[k])def.dims[k]={weight:10,enabled:true};});}}
  }catch(e){}
  return def;
}
function aiSaveSettings(s){
  try{localStorage.setItem(AI_SETTINGS_KEY,JSON.stringify(s));return true;}
  catch(e){aiToast('AI 设置保存失败（本地存储空间不足）');return false;}
}
function aiNormBase(u){
  u=(u||'').trim().replace(/\/+$/,'');
  if(!/^https?:\/\//i.test(u))u='https://'+u;
  return u;
}

/* ---------- 项目内 AI 状态 ---------- */
function aiState(){
  var p=currentProj();
  if(!p)return null;
  if(!p.ai||typeof p.ai!=='object')p.ai={versions:[],lastReport:null,ignoredAiIssues:[],pendingDiffs:null};
  return p.ai;
}
function aiPersist(){try{typeof flushSave==='function'?flushSave():(typeof save==='function'&&save());}catch(e){}}

/* ---------- 文本抽取 ---------- */
function aiSecText(id,fields,noCards){
  var fw=STATE.framework.find(function(x){return x.id===id;});
  if(!fw)return '';
  var c=DATA[id]||aiSectionEmpty(fw.type,id);
  var t='';
  if(fields&&'html' in fields)t=aiHtmlToText(fields.html);
  else if(c.items&&c.items.length){
    t=c.items.map(function(i){
      if(i&&i.name!=null)return (i.name||'')+' '+(i.desc||'')+' '+(i.priority||'')+' '+(i.status||'');
      if(i&&i.text!=null)return (i.text||'');
      if(i&&i.role!=null)return '作为'+(i.role||'')+'我希望'+(i.want||'')+'以便'+(i.soThat||'');
      return '';
    }).join('\n');
  }else t=(fields&&'html' in fields)?aiHtmlToText(fields.html):aiHtmlToText(c.html||'');
  var rows=fields&&'rows' in fields?fields.rows:(c.rows||[]);
  if(rows&&rows.length)t+='\n'+(rows.map(function(r){return '| '+((r.cells||[]).map(function(v){return String(v==null?'':v);})).join(' | ')+' |';}).join('\n'));
  if(c.cards&&c.cards.length&&!noCards)t+='\n'+(c.cards.map(function(i){return (i.title||'')+' '+aiHtmlToText(i.html||'');}).join('\n'));
  return t.replace(/\s+/g,' ').trim();
}
function aiDocText(){
  return aiDocTextOpt(false);
}
function aiDocTextOpt(noCards){
  return STATE.framework.map(function(s){
    return '## ['+s.id+'] '+s.title+'\n'+(aiSecText(s.id,null,noCards)||'（空）');
  }).join('\n\n');
}
function aiDocTextWith(pm,noCards){
  return STATE.framework.map(function(s){
    return '## ['+s.id+'] '+s.title+'\n'+(pm&&pm[s.id]?aiSecText(s.id,pm[s.id],noCards):(aiSecText(s.id,null,noCards)||'（空）'));
  }).join('\n\n');
}
function aiFieldsOf(ch){
  if(!ch)return null;
  if(ch.replaceSection!=null)return {html:ch.replaceSection};
  if(ch.replaceRows)return {rows:ch.replaceRows};
  if(ch.type==='table'){
    var c0=DATA[ch.sectionId]||{};
    return {rows:aiRowExec(c0.rows||[],ch.rowEdits||[]).rows};
  }
  if(ch.type==='text'){
    var c1=DATA[ch.sectionId]||{};
    return {html:aiApplyEdits(String(c1.html||''),ch.edits||[]).html};
  }
  return null;
}

/* ---------- AI Client ---------- */
function aiClassify(err,resp,bodyMsg){
  if(err&&err.name==='AbortError')return {kind:'timeout',message:'请求超时，请检查网络后重试。'};
  if(resp){
    var st=resp.status;
    if(st===401||st===403)return {kind:'auth',message:'API Key 无效或无权限（'+st+'），请到 设置→AI 检查 Key。'};
    if(st===429)return {kind:'rate',message:'请求过于频繁（429 限流），已重试仍失败，请稍后再试。'};
    if(st===400)return {kind:'param',message:'请求参数错误（400）：'+(bodyMsg||'请检查模型名是否正确。')};
    if(st===404||st===405)return {kind:'notfound',message:'接口地址或模型不存在（'+st+'），请检查 Base URL 与模型名。'};
    if(st>=500)return {kind:'server',message:'AI 服务端异常（'+st+'），请稍后重试。'};
    return {kind:'http',message:'请求失败（HTTP '+st+'）：'+(bodyMsg||'未知错误')};
  }
  if(err instanceof TypeError)return {kind:'net',message:'网络/跨域错误：DeepSeek 对浏览器直连可能不支持 CORS，或当前无网络。可换兼容服务商，或后续接薄代理（Base URL 不变）。'};
  if(err&&err.kind)return err;
  return {kind:'unknown',message:'请求失败：'+(err&&err.message?err.message:err)};
}
function aiExtractJson(text){
  if(!text)return null;
  var t=String(text).trim();
  t=t.replace(/^```(?:json)?\s*/i,'').replace(/```\s*$/,'').trim();
  var a=t.indexOf('{'),b=t.lastIndexOf('}');
  if(a<0||b<=a)return null;
  try{return JSON.parse(t.slice(a,b+1));}catch(e){}
  var depth=0,start=-1;
  for(var i=0;i<t.length;i++){
    var ch=t[i];
    if(ch==='{'){if(depth===0)start=i;depth++;}
    else if(ch==='}'){depth--;if(depth===0&&start>=0){try{return JSON.parse(t.slice(start,i+1));}catch(e2){}}}
  }
  return null;
}
function aiChatOnce(messages,opts){
  var st=aiGetSettings();
  var base=aiNormBase(st.baseUrl);
  var body={model:opts.model||st.model,messages:messages,stream:!!opts.stream,temperature:opts.temperature==null?0.3:opts.temperature};
  if(opts.json)body.response_format={type:'json_object'};
  if(opts.maxTokens)body.max_tokens=opts.maxTokens;
  var ctrl=new AbortController();
  if(aiGlobalAbort){
    aiGlobalAbort.signal.addEventListener('abort',function(){try{ctrl.abort();}catch(e){}});
  }
  var timer=setTimeout(function(){ctrl.abort();},opts.timeout||(opts.stream?150000:45000));
  return fetch(base+'/chat/completions',{
    method:'POST',
    headers:{'Content-Type':'application/json','Authorization':'Bearer '+String(st.apiKey||'').trim()},
    body:JSON.stringify(body),
    signal:ctrl.signal
  }).then(function(resp){
    clearTimeout(timer);
    if(!resp.ok){
      return resp.json().then(function(j){var m=(j&&j.error&&j.error.message)||'';throw aiClassify(null,resp,m);}).catch(function(e){
        if(e&&e.kind)throw e;
        throw aiClassify(null,resp,'');
      });
    }
    if(opts.stream){
      if(!resp.body||!resp.body.getReader)throw {kind:'stream',message:'当前浏览器不支持流式读取。'};
      var reader=resp.body.getReader(),dec=new TextDecoder(),buf='',content='';
      function pump(){
        return reader.read().then(function(r){
          if(r.done)return content;
          buf+=dec.decode(r.value,{stream:true});
          var nl;
          while((nl=buf.indexOf('\n'))>=0){
            var line=buf.slice(0,nl).trim();buf=buf.slice(nl+1);
            if(line.indexOf('data:')!==0)continue;
            var data=line.slice(5).trim();
            if(data==='[DONE]'){buf='';return content;}
            try{
              var j=JSON.parse(data);
              var d=j.choices&&j.choices[0]&&j.choices[0].delta&&j.choices[0].delta.content;
              if(d){content+=d;if(opts.onDelta)opts.onDelta(content);}
            }catch(e){}
          }
          return pump();
        });
      }
      return pump();
    }
    return resp.json().then(function(j){
      var c=(j.choices&&j.choices[0]&&j.choices[0].message&&j.choices[0].message.content)||'';
      return c;
    });
  }).catch(function(e){
    clearTimeout(timer);
    if(e&&e.kind)throw e;
    throw aiClassify(e,null,'');
  });
}
function aiChat(messages,opts){
  var lastErr=null;
  function attempt(n){
    return aiChatOnce(messages,opts).catch(function(e){
      lastErr=e;
      if(e.kind==='auth'||e.kind==='param'||e.kind==='notfound')throw e;
      if(aiCancelFlag)throw {kind:'canceled',message:'已停止'};
      if(n<2){if(opts.onStatus)opts.onStatus('网络波动，重试中（'+(n+1)+'/2）…');return aiSleep(1200*n).then(function(){if(aiCancelFlag)throw {kind:'canceled',message:'已停止'};return attempt(n+1);});}
      throw e;
    });
  }
  return attempt(1);
}
function aiAskJSON(messages,opts){
  var last=null;
  function once(useStream){
    if(aiCancelFlag)return Promise.reject({kind:'canceled',message:'已停止'});
    return aiChat(messages,{stream:useStream,json:!useStream,onDelta:opts.onDelta,onStatus:opts.onStatus,temperature:opts.temperature,timeout:opts.timeout,model:opts.model,maxTokens:opts.maxTokens}).then(function(c){
      var j=aiExtractJson(c);
      if(j)return j;
      last={kind:'parse',message:'AI 返回内容不是合法 JSON，已重试。',raw:String(c||'').slice(0,400)};
      return null;
    }).catch(function(e){
      if(e&&(e.kind==='auth'||e.kind==='param'||e.kind==='notfound'))throw e;
      last=e&&e.kind?e:{kind:'net',message:'AI 请求失败。'};
      return null;
    });
  }
  // v17.13：非流式 + json_object 优先（弱模型更稳），流式作兜底
  return once(false).then(function(j){
    if(aiCancelFlag)return Promise.reject({kind:'canceled',message:'已停止'});
    if(j)return j;
    if(opts.onStatus)opts.onStatus('非流式解析异常，改用流式重试…');
    return once(true).then(function(j2){
      if(j2)return j2;
      throw (last&&last.kind?last:{kind:'parse',message:'AI 未返回可用 JSON'});
    });
  });
}

/* ---------- Prompt 构造 ---------- */
function aiScoreSystem(){
  var s=aiGetSettings();
  var dims=[];
  Object.keys(DIM_META).forEach(function(k){
    var d=s.dims[k]||{weight:10,enabled:true};
    dims.push(DIM_META[k].label+'（权重 '+(d.enabled?d.weight:0)+'）');
  });
  var fw=STATE.framework.map(function(x){return x.id+'「'+x.title+'」类型:'+x.type+(x.required?'（必填）':'');}).join('；');
  var rules=(STATE.ruleSet||[]).filter(function(r){return r&&r.enabled;}).map(function(r){return r.id+'「'+r.dim+'」'+r.desc+(r.level==='red'?'[红]':'[黄]');}).join('；');
  return '你是资深 PRD 评审专家。请依据下面给出的文档框架与内置规则基线，对用户提供的 PRD 内容逐节体检并评分。\n'
    +'评分维度：'+dims.join('、')+'。每维 0-100 整数分；完整性问题（必填节缺失、关键信息缺失）应给低分。\n'
    +'文档框架：'+fw+'\n'
    +'内置规则基线（红=必填缺失，黄=疑似缺失/表述含糊）：'+rules+'\n'
    +'issues 的 sectionId 必须使用文档内容中 [id] 标记里的确切 id；全文性问题 sectionId 用 null。severity 只允许 high/medium/low。\n'
    +'证据要求：每条 issue 必须带 quote——从文档中**逐字引用**证明该问题的原文片段（缺失类问题引用所属节标题并注明"未发现 XX"）；每个维度必须带 note——一句话说明该维度评分的依据。quote 必须能直接在原文中找到，禁止编造。\n'
    +'严格只输出 JSON，不要输出任何其他文字：{"summary":"一句话总评","dimensions":[{"id":"completeness","name":"完整性","score":0,"note":"评分依据","issues":[{"sectionId":"id或null","severity":"high|medium|low","reason":"原因","quote":"原文逐字引用","suggestion":"改进建议"}]},{"id":"clarity","name":"清晰度","score":0,"note":"","issues":[]},{"id":"consistency","name":"一致性","score":0,"note":"","issues":[]},{"id":"executability","name":"可执行性","score":0,"note":"","issues":[]},{"id":"verifiability","name":"可验证性","score":0,"note":"","issues":[]},{"id":"risk","name":"风险","score":0,"note":"","issues":[]}]}';
}
function aiIssueLines(report){
  var out=[];
  (report.dimensions||[]).forEach(function(d){
    (d.issues||[]).forEach(function(it){
      var q=it.quote?('（引用："'+String(it.quote).slice(0,60)+'"）'):'';
      out.push('- ['+it.severity+']'+(it.sectionId?'（'+it.sectionTitle+'）':'（全文）')+' '+it.reason+' '+q+' → '+it.suggestion);
    });
  });
  return out.join('\n')||'（无明显问题）';
}
function aiScore(text,opts){
  var st=aiState();
  var fp=aiFingerprint(JSON.stringify({t:text,f:STATE.framework.map(function(x){return x.id+x.type+(x.required?1:0)+x.title;}).join('|'),r:(STATE.ruleSet||[]).filter(function(x){return x&&x.enabled;}).map(function(x){return x.id;}).join('|'),d:JSON.stringify(aiGetSettings().dims)}));
  if(st&&st.scoreCache&&st.scoreCache.fingerprint===fp){
    var cached=aiDeep(st.scoreCache.report);cached.cached=true;
    return Promise.resolve(cached);
  }
  var doCache=function(report){if(st)st.scoreCache={fingerprint:fp,report:aiDeep(report)};return report;};
  // v17.22：长文档分块评分——超过阈值按节切块、逐块打分、按内容长度加权聚合，避免弱模型长输出截断
  if(String(text||'').length>AI_SCORE_CHUNK_CHARS){
    return aiScoreChunked(text,opts).then(doCache);
  }
  return aiAskJSON([
    {role:'system',content:aiScoreSystem()},
    {role:'user',content:'请评分以下 PRD 内容：\n\n'+text}
  ],{temperature:0,onStatus:opts&&opts.onStatus,onDelta:opts&&opts.onDelta,timeout:120000}).then(function(resp){
    return doCache(aiScoreNormalize(resp));
  });
}
function aiScoreNormalize(resp){
  var s=aiGetSettings();
  var dims=resp&&Array.isArray(resp.dimensions)?resp.dimensions:[];
  var out=[];
  var totalW=0,totalV=0;
  var docTxt=aiDocText();
  Object.keys(DIM_META).forEach(function(k){
    var cfg=s.dims[k]||{weight:10,enabled:true};
    var d=dims.filter(function(x){return x&&(x.id===k);})[0];
    var score=d&&!isNaN(+d.score)?aiRound(d.score):0;
    var issues=d&&Array.isArray(d.issues)?d.issues.map(function(it){
      var sid=it.sectionId||null;
      var q=String(it.quote||'');
      var hay=sid?aiSecText(sid):docTxt;
      var low=!!q&&aiNormText(hay).indexOf(aiNormText(q))<0;
      return {id:aiKey(sid||'',it.reason||''),sectionId:sid,sectionTitle:STATE.framework.find(function(f){return f.id===sid;})?(STATE.framework.find(function(f){return f.id===sid;})).title:'',severity:(it.severity==='high'||it.severity==='medium'||it.severity==='low')?it.severity:'medium',reason:String(it.reason||''),quote:q,lowConfidence:low,suggestion:String(it.suggestion||'')};
    }):[];
    if(!d){issues.push({id:aiKey(k,'missing'),sectionId:null,sectionTitle:'',severity:'medium',reason:'该维度未能评估（AI 未返回）',suggestion:'请重试深度体检。'});}
    out.push({id:k,name:d&&d.name?d.name:DIM_META[k].label,score:score,note:String(d&&d.note||''),weight:cfg.enabled?cfg.weight:0,issues:issues});
    if(cfg.enabled){totalW+=cfg.weight;totalV+=score*cfg.weight;}
  });
  var total=totalW?aiRound(totalV/totalW):0;
  return {total:total,dimensions:out,summary:String(resp&&resp.summary||''),generatedAt:Date.now(),cached:false};
}
function aiChunkDoc(text,maxChars){
  var limit=maxChars||AI_SCORE_CHUNK_CHARS;
  var lines=String(text||'').split('\n');
  var chunks=[],cur=[],curLen=0;
  lines.forEach(function(ln){
    var isHead=/^##\s*\[[^\]]+\]/.test(ln);
    var addLen=ln.length+1;
    if(isHead&&curLen>0&&curLen+addLen>limit){chunks.push(cur.join('\n'));cur=[];curLen=0;}
    cur.push(ln);curLen+=addLen;
  });
  if(cur.length)chunks.push(cur.join('\n'));
  return chunks.filter(function(c){return String(c).trim();});
}
function aiScoreChunked(text,opts){
  var chunks=aiChunkDoc(text,AI_SCORE_CHUNK_CHARS);
  if(chunks.length<=1)return Promise.resolve(null);
  var results=[];
  function next(i){
    if(aiCancelFlag)return Promise.reject({kind:'canceled',message:'已停止'});
    if(i>=chunks.length)return Promise.resolve(results);
    if(opts&&opts.onStatus)opts.onStatus('长文档分块评分 '+(i+1)+'/'+chunks.length+'…');
    return aiAskJSON([
      {role:'system',content:aiScoreSystem()},
      {role:'user',content:'这是长文档的第 '+(i+1)+'/'+chunks.length+' 个分块，请仅依据该分块内容评分并输出 JSON：\n\n'+chunks[i]}
    ],{temperature:0,onStatus:opts&&opts.onStatus,onDelta:opts&&opts.onDelta,timeout:120000,maxTokens:4000}).then(function(resp){
      results.push({resp:resp,len:chunks[i].length});
      return next(i+1);
    });
  }
  return next(0).then(function(){
    var s=aiGetSettings();
    var out=[];
    Object.keys(DIM_META).forEach(function(k){
      var cfg=s.dims[k]||{weight:10,enabled:true};
      var wSum=0,vSum=0,issues=[],notes=[],seen={};
      results.forEach(function(r){
        var d=(r.resp&&Array.isArray(r.resp.dimensions)?r.resp.dimensions:[]).filter(function(x){return x&&x.id===k;})[0];
        if(d&&!isNaN(+d.score)){wSum+=r.len;vSum+=(+d.score)*r.len;}
        (d&&Array.isArray(d.issues)?d.issues:[]).forEach(function(it){
          var sid=it.sectionId||null;
          var q=String(it.quote||'');
          var hay=sid?aiSecText(sid):aiDocText();
          var low=!!q&&aiNormText(hay).indexOf(aiNormText(q))<0;
          var key=aiKey(sid||'',it.reason||'');
          if(seen[key])return;seen[key]=1;
          issues.push({id:key,sectionId:sid,sectionTitle:STATE.framework.find(function(f){return f.id===sid;})?(STATE.framework.find(function(f){return f.id===sid;})).title:'',severity:(it.severity==='high'||it.severity==='medium'||it.severity==='low')?it.severity:'medium',reason:String(it.reason||''),quote:q,lowConfidence:low,suggestion:String(it.suggestion||'')});
        });
        if(d&&d.note)notes.push(String(d.note));
      });
      var score=wSum?aiRound(vSum/wSum):0;
      if(!wSum)issues.push({id:aiKey(k,'missing'),sectionId:null,sectionTitle:'',severity:'medium',reason:'该维度未能评估（AI 未返回）',suggestion:'请重试深度体检。'});
      out.push({id:k,name:DIM_META[k].label,score:score,note:notes.join('；').slice(0,300),weight:cfg.enabled?cfg.weight:0,issues:issues});
    });
    var total=aiComputeTotal({dimensions:out});
    var sumParts=results.map(function(r){return String(r.resp&&r.resp.summary||'').slice(0,60);}).filter(Boolean);
    var summary='长文档分块评分：全文 '+String(text||'').length+' 字 / '+chunks.length+' 个分块。'+(sumParts.length?('｜'+sumParts.join('｜')):'');
    return {total:total,dimensions:out,summary:summary,generatedAt:Date.now(),cached:false,chunked:true};
  });
}
function aiOptimizePrompt(text,scope,issues,target){
  var fw=STATE.framework.map(function(x){return x.id+'「'+x.title+'」类型:'+x.type;}).join('；');
  var scopeNote=scope.mode==='section'?'本次只优化节 ['+scope.sectionId+']，changes 只能包含该节。':'本次优化整份文档。';
  return {
    system:'你是资深 PRD 优化专家。基于体检报告对内容做精准优化：只改有明显问题的部分，保持原有结构与语气，不得虚构需求、不得擅自增删节。\n'
      +'文档节清单：'+fw+'\n'
      +'输出规则（最小编辑）：\n'
      +'1) text 节只给 edits——按"块"操作（块=段落/列表/表格/标题等整块），每条 match 必须**逐字引用文档中该块的原文文本**（从下方"当前内容"复制，只引用**正文块**，不要引用小卡片内容，小卡片不在正文块中），newHtml 是替换后的整块 HTML（基础标签：p/ul/ol/li/strong/em/h3/h4/table，禁止 script/style/on* 属性）；未引用的块一律不要改。\n'
      +'2) table 节只给 rowEdits——按行操作，match 用该行首列单元格文本定位，cells 为整行新单元格数组（含首列，列数必须与表头一致）。\n'
      +'3) 清单/用户故事/小卡片等无法结构化改写的节只给 type:"suggestion" 和建议文字。\n'
      +'严格只输出 JSON：{"changes":[{"sectionId":"节id","type":"text","edits":[{"op":"replaceBlock","match":"被替换块的原文","newHtml":"替换后的整块HTML"},{"op":"insertBlock","match":"锚点块原文","newHtml":"新块HTML","position":"after|before|start|end"},{"op":"deleteBlock","match":"要删除的块原文"}]},{"sectionId":"节id","type":"table","rowEdits":[{"op":"update","match":"首列文本","cells":["列1","列2"]},{"op":"insert","match":"锚点行首列文本","cells":["列1","列2"],"position":"after|before|end"},{"op":"delete","match":"该行首列文本"}]},{"sectionId":"节id","type":"suggestion","suggestion":"建议文字"}],"summary":"本轮改动摘要"}\n'
      +'未改动的节不要出现在 changes 里。',
    user:scopeNote+'\n目标分：'+target+'。\n\n当前体检问题：\n'+issues+'\n\n当前内容：\n'+text
  };
}
function aiOptimize(text,scope,issues,target,opts){
  var p=aiOptimizePrompt(text,scope,issues,target);
  return aiAskJSON([
    {role:'system',content:p.system},
    {role:'user',content:p.user}
  ],{temperature:0.3,onStatus:opts&&opts.onStatus,onDelta:opts&&opts.onDelta,timeout:150000,maxTokens:8000}).then(function(resp){
    return {changes:Array.isArray(resp&&resp.changes)?resp.changes:[],summary:String(resp&&resp.summary||''),fallback:false};
  });
}
function aiOptimizeSimple(text,scope,issues,target,opts){
  var fw=STATE.framework.map(function(x){return x.id+'「'+x.title+'」类型:'+x.type;}).join('；');
  var scopeNote=scope.mode==='section'?'本次只优化节 ['+scope.sectionId+']。':'本次优化整份文档。';
  var p={
    system:'你是 PRD 优化专家。基于体检问题只改写有问题的节，保留其余内容与语气，不得虚构需求。\n'
      +'输出格式（整节替换，最简单可靠）：{"changes":[{"sectionId":"节id","type":"text|table|suggestion","newHtml":"text 节：整节完整替换后的 HTML（保留原内容，只改有问题部分；基础标签 p/ul/ol/li/strong/em/h3/h4/table）","newRows":[{"cells":["列1","列2"]}],"suggestion":"建议文字"}],"summary":"一句话总结"}\n'
      +'注意：newHtml 必须包含该节正文的全部内容（只改有问题部分，不得删减未授权内容）；小卡片内容不用管。\n'
      +'文档节清单：'+fw+'\n'
      +'未改动的节不要出现在 changes 里；严格只输出 JSON。',
    user:scopeNote+'\n目标分：'+target+'。\n\n当前体检问题：\n'+issues+'\n\n当前内容：\n'+text
  };
  return aiAskJSON([
    {role:'system',content:p.system},
    {role:'user',content:p.user}
  ],{temperature:0.3,onStatus:opts&&opts.onStatus,onDelta:opts&&opts.onDelta,timeout:150000,maxTokens:6000}).then(function(resp){
    return {changes:Array.isArray(resp&&resp.changes)?resp.changes:[],summary:String(resp&&resp.summary||''),fallback:true};
  });
}
function aiOptimizeSectionSimple(sid,issues,target,opts){
  var fw=STATE.framework.find(function(s){return s.id===sid;});
  if(!fw)return Promise.resolve([]);
  var secText=aiSecText(sid,null,true)||'（空）';
  var p={
    system:'你是 PRD 优化专家。只优化节 ['+sid+']「'+fw.title+'」，保留该节其余内容与语气，不得虚构需求。\n'
      +'输出 JSON：{"changes":[{"sectionId":"'+sid+'","type":"text|table|suggestion","newHtml":"text 节：该节整节完整替换后的 HTML（只改有问题部分，基础标签 p/ul/ol/li/strong/em/h3/h4/table）","newRows":[{"cells":["列1","列2"]}],"suggestion":"建议文字"}],"summary":"一句话"}。未改动就输出 {"changes":[],"summary":"无需改动"}。严格只输出 JSON。',
    user:'目标分：'+target+'。\n\n该节相关体检问题：\n'+issues+'\n\n该节当前内容：\n'+secText
  };
  return aiAskJSON([
    {role:'system',content:p.system},
    {role:'user',content:p.user}
  ],{temperature:0.3,onStatus:opts&&opts.onStatus,onDelta:opts&&opts.onDelta,timeout:150000,maxTokens:4000}).then(function(resp){
    // 返回原始 changes（由调用方统一 aiNormChange 归一化，避免二次归一化把 replaceSection 丢掉）
    return (Array.isArray(resp&&resp.changes)?resp.changes:[]).filter(function(ch){return ch&&ch.sectionId===sid;});
  });
}
function aiOptimizeBySection(baseReport,issues,target,opts){
  var counts={};
  ((baseReport&&baseReport.dimensions)||[]).forEach(function(d){
    (d.issues||[]).forEach(function(it){if(it.sectionId)counts[it.sectionId]=(counts[it.sectionId]||0)+1;});
  });
  if(!Object.keys(counts).length){
    // 没有带节的问题时兜底：取前 6 个非空节
    STATE.framework.forEach(function(s){
      if(!aiSecText(s.id).trim())return;
      counts[s.id]=1;
    });
  }
  var secs=Object.keys(counts).sort(function(a,b){return counts[b]-counts[a];}).slice(0,6);
  var all=[],idx=0;
  function next(){
    if(idx>=secs.length)return Promise.resolve(all);
    var sid=secs[idx++];
    if(opts&&opts.onStatus)opts.onStatus('分节优化 '+idx+'/'+secs.length+'：'+((STATE.framework.find(function(s){return s.id===sid;})||{}).title||sid)+'…');
    return aiOptimizeSectionSimple(sid,issues,target,opts).then(function(chs){
      all=all.concat(chs);
      return next();
    }).catch(function(e){
      if(aiOptDbg)aiOptDbg.steps.push({kind:'secFail',sec:sid,error:String(e&&e.message||e).slice(0,80)});
      return next();
    });
  }
  return next();
}
function aiOptimizeSafe(text,scope,baseReport,issues,target,opts){
  // v17.14：文档较大时跳过整份调用（弱模型必截断），直接按节逐个优化
  if(scope.mode!=='section'&&String(text||'').length>2500){
    if(aiOptDbg)aiOptDbg.steps.push({kind:'fullDocSkipped',len:String(text||'').length});
    if(opts&&opts.onStatus)opts.onStatus('文档较大，直接按节逐个优化…');
    return aiOptimizeBySection(baseReport,issues,target,opts).then(function(changes){
      return {changes:changes,summary:'分节优化 '+changes.length+' 条',fallback:true,sectionMode:true};
    });
  }
  return aiOptimize(text,scope,issues,target,opts).catch(function(e){
    if(!(e&&e.kind==='parse'))throw e;
    if(aiOptDbg)aiOptDbg.steps.push({kind:'fullDocParseFail',raw:String(e.raw||'').slice(0,200)});
    if(scope.mode==='section')throw e;
    if(opts&&opts.onStatus)opts.onStatus('整份返回无法解析，改为按节逐个优化…');
    return aiOptimizeBySection(baseReport,issues,target,opts).then(function(changes){
      return {changes:changes,summary:'分节优化 '+changes.length+' 条',fallback:true,sectionMode:true};
    });
  });
}
function aiReviewPrompt(text,originalText,changes,target){
  var fw=STATE.framework.map(function(x){return x.id+'「'+x.title+'」';}).join('；');
  return {
    system:'你是独立的 PRD 评审复核员。你不知道修改由谁生成，只依据"原稿"与"修改后全文"做客观复核。\n'
      +'检查：①是否解决了原稿体检指出的问题；②是否引入新问题（删除未授权内容、虚构需求、破坏文档结构、前后不一致）；③给修改后全文打 0-100 分并给出结论。\n'
      +'文档节清单：'+fw+'\n'
      +'严格只输出 JSON：{"score":0,"verdict":"pass|needs_work|fail","newIssues":[{"sectionId":"节id或null","severity":"high|medium|low","reason":"原因","quote":"原文引用"}],"summary":"复核结论"}',
    user:'目标分：'+target+'。\n\n本次拟修改的节与内容摘要：\n'+changes+'\n\n原稿：\n'+originalText+'\n\n修改后全文：\n'+text
  };
}
function aiReview(text,originalText,changes,target,opts){
  var st=aiGetSettings();
  var p=aiReviewPrompt(text,originalText,changes,target);
  return aiAskJSON([
    {role:'system',content:p.system},
    {role:'user',content:p.user}
  ],{temperature:0,model:st.reviewModel||undefined,onStatus:opts&&opts.onStatus,onDelta:opts&&opts.onDelta,timeout:120000}).then(function(resp){
    var verdict=(resp&&resp.verdict==='pass')?'pass':(resp&&resp.verdict==='fail')?'fail':'needs_work';
    return {score:aiRound(resp&&resp.score),verdict:verdict,newIssues:Array.isArray(resp&&resp.newIssues)?resp.newIssues:[],summary:String(resp&&resp.summary||'')};
  });
}
function aiValidateChange(item){
  var w=[],b=[];
  if(item.type==='text'){
    if(item.replaceSection!=null){
      item.oldFields=aiCurFields(item.sectionId);
      if(!aiHtmlBalanced(item.replaceSection))b.push('HTML 标签不闭合');
      if(!aiStripTags(item.replaceSection).trim())b.push('替换后内容为空');
      if((item.oldFields.html||'').trim()===(item.replaceSection||'').trim())w.push('新旧内容相同（未实际变化）');
      item.blocks=[];
    }else{
      var html=String((DATA[item.sectionId]||{}).html||'');
      var exec=aiApplyEdits(html,item.edits||[]);
      exec.results.forEach(function(r){if(!r.ok)b.push(r.reason);});
      if(exec.results.some(function(r){return r.ok&&r.oldHtml&&aiNormText(r.oldHtml).indexOf('cmt-hl')>=0;}))w.push('被替换块内含评论划线，该块内评论将被覆盖，请人工确认');
      if(!aiHtmlBalanced(exec.html))b.push('HTML 标签不闭合');
      item.blocks=exec.results.filter(function(r){return r.ok&&r.oldHtml;}).map(function(r){return {blockOld:r.oldHtml,blockNew:r.newHtml,anchor:r.anchor};});
    }
  }else if(item.type==='table'){
    if(item.replaceRows){
      item.oldFields=aiCurFields(item.sectionId);
      var cols=item.replaceRows.length?item.replaceRows[0].cells.length:0;
      if(!cols)b.push('表格为空');
      if(item.replaceRows.some(function(r){return (r.cells||[]).length!==cols;}))b.push('表格列数不一致');
      item.rows=[];
    }else{
      var rows=(DATA[item.sectionId]||{}).rows||[];
      var re=aiRowExec(rows,item.rowEdits||[]);
      re.results.forEach(function(r){if(!r.ok)b.push(r.reason);});
      item.rows=re.results.filter(function(r){return r.ok;}).map(function(r){return {rowOp:(r.edit&&r.edit.op)||'',match:(r.edit&&r.edit.match)||'',rowOld:r.rowOld,rowNew:r.rowNew,anchor:r.anchor};});
    }
  }else if(item.type==='items'||item.replaceItems){
    item.oldFields=aiCurFields(item.sectionId);
    var its=Array.isArray(item.replaceItems)?item.replaceItems:[];
    if(!its.length)b.push('清单为空，未生成可用条目');
    var secType=item.sectionType||'text';
    its.forEach(function(i){
      if(!i||typeof i!=='object'){b.push('条目结构不合法');return;}
      if(secType==='feat'){
        if(!String(i.name||'').trim())b.push('功能点缺名称');
        if(i.priority&&['P0','P1','P2','P3','P4'].indexOf(String(i.priority).toUpperCase())<0)b.push('优先级非法：'+i.priority);
      }else if(secType==='accept'){
        if(!String(i.text||'').trim())b.push('验收项缺内容');
      }else if(secType==='users'){
        if(!String(i.role||'').trim()&&!String(i.want||'').trim())b.push('用户故事缺角色或期望');
      }
    });
    item.blocks=[];item.rows=[];
  }
  item.validation={ok:!b.length,warnings:w,blocked:b};
}
function aiValidateChanges(changes){
  return changes.map(function(ch){
    var it={sectionId:ch.sectionId,type:ch.type,edits:ch.edits||[],rowEdits:ch.rowEdits||[],replaceSection:ch.replaceSection!=null?ch.replaceSection:null,replaceRows:ch.replaceRows||null};
    aiValidateChange(it);
    return {ch:ch,it:it};
  });
}
function aiEvalRuleDelta(changes){
  var hBefore=HEALTH,affected=[],saved={};
  changes.forEach(function(ch){
    if(ch.type!=='text'&&ch.type!=='table')return;
    var c=DATA[ch.sectionId];if(!c)return;
    affected.push(ch.sectionId);
    saved[ch.sectionId]={html:c.html,rows:c.rows?aiDeep(c.rows):null};
    var f=aiFieldsOf(ch);
    if(f&&f.html!=null)c.html=f.html;
    if(f&&f.rows)c.rows=f.rows;
  });
  var after=null;
  try{if(typeof runHealth==='function')after=runHealth();}catch(e){}
  affected.forEach(function(id){var sv=saved[id];if(!sv)return;var c=DATA[id];if(!c)return;c.html=sv.html;if(sv.rows)c.rows=sv.rows;});
  var b=hBefore&&hBefore.metrics,a=after&&after.metrics;
  return {riskBefore:b?b.risk:null,riskAfter:a?a.risk:null,completionBefore:b?b.completion:null,completionAfter:a?a.completion:null};
}

/* ============ v17.2 AI 结构对齐 ============ */
function aiAlignHint(){
  var p=currentProj();if(!p)return {level:'low',reasons:[]};
  var reasons=[],totalLen=0,catchLen=0,catchId=null;
  try{catchId=typeof catchAllId==='function'?catchAllId():null;}catch(e){}
  STATE.framework.forEach(function(s){
    var t=aiSecText(s.id);
    totalLen+=t.length;
    if(catchId&&s.id===catchId)catchLen=t.length;
  });
  var level='low';
  if(totalLen>0&&catchLen/totalLen>0.25){
    level='high';
    reasons.push('兜底节（其他/附录）内容约占全文 '+(100*catchLen/totalLen).toFixed(0)+'%，疑似大量内容未归位');
  }
  var emptyReq=STATE.framework.filter(function(s){
    return s.required&&!aiSecText(s.id).trim();
  });
  if(emptyReq.length&&totalLen>200){
    if(level!=='high')level='mid';
    reasons.push('必填节「'+emptyReq.map(function(s){return s.title;}).join('、')+'」为空，内容可能没归位');
  }
  var crowded=STATE.framework.filter(function(s){return aiBlocksOf(String((DATA[s.id]||{}).html||'')).length>8;});
  if(crowded.length&&emptyReq.length){
    if(level!=='high')level='mid';
    reasons.push('「'+crowded.map(function(s){return s.title;}).join('、')+'」块数偏多而其他必填节为空，疑似合并错位');
  }
  return {level:level,reasons:reasons};
}
function aiWrapImport(){
  if(window.__aiImportWrapped||typeof doImportText!=='function')return;
  window.__aiImportWrapped=true;
  var orig=window.doImportText;
  window.doImportText=function(text,projName){
    var routed=false;
    try{
      // v17.3：无项目或当前项目全空时，导入默认走「自动框架」（按文档标题建框架），不再硬套 14 节
      var cur=currentProj();
      var filled=cur&&STATE.framework.some(function(s){return !isEmpty(s.id);});
      if(!cur||!filled){
        if(!cur&&typeof createProject==='function')createProject(projName||'导入的PRD');
        if(typeof autoGenImport==='function'){autoGenImport(text);routed=true;}
      }
    }catch(e){routed=false;}
    if(!routed){
      try{orig.apply(this,arguments);}catch(e){try{toast('导入失败：'+(e&&e.message||e));}catch(e2){}}
    }
    try{
      setTimeout(function(){
        var h=aiAlignHint();
        if(h.level!=='low')aiToast('检测到内容与框架可能错位（'+h.reasons[0]+'），可到 AI 助手执行「结构对齐」');
      },300);
    }catch(e){}
  };
}
function aiWrapLoadSample(){
  // v17.24：示例已由 block1 的 loadSample 改用标准 14 节框架，不再用自动框架覆盖
  window.__aiSampleWrapped=true;
}
function aiAlignPrompt(){
  var fw=STATE.framework.map(function(s){return s.id+'「'+s.title+'」类型:'+s.type+(s.required?'（必填）':'');}).join('；');
  var doc=STATE.framework.map(function(s){return '## ['+s.id+'] '+s.title+'\n'+(aiSecText(s.id)||'（空）');}).join('\n\n');
  var hint=aiAlignHint();
  var hintTxt=hint.level==='low'?'（无明显错位信号）':('（错位信号：'+hint.reasons.join('；')+'）');
  return {
    system:'你是 PRD 结构整理专家。给定文档框架（节 id/标题/类型）与当前每节内容，判断哪些内容放错了节、应搬到哪个节。\n'
      +'只输出 JSON：{"moves":[{"fromSection":"节id","match":"要搬走的块原文（逐字引用）","toSection":"节id","position":"after|before|start|end","anchor":"目标节锚点块原文（after/before 必填）"}],"ops":[{"op":"rename","sectionId":"节id","newTitle":"新标题"},{"op":"deleteEmpty","sectionId":"节id"},{"op":"merge","fromSection":"节id","toSection":"节id"},{"op":"split","sectionId":"节id","newTitle":"新节标题","moves":[{"match":"要拆走的块原文"}]}],"suggestions":[{"kind":"other","sectionId":"节id","text":"无法自动执行的建议文字"}],"summary":"一句话总结"}\n'
      +'规则：\n'
      +'- match 必须逐字来自来源节内容（text 节=块文本；table 节=首列单元格文本定位行）；\n'
      +'- 只搬确定属于目标节的内容，不确定的宁可不搬；\n'
      +'- 只做结构归位，不要改写任何内容本身；\n'
      +'- 清单/用户故事/小卡片节（feat/accept/users）内的条目不自动搬，需调整时放 suggestions；\n'
      +'- 目标节与来源节不能相同；text 节对 text 节、table 节对 table 节；\n'
      +'- rename：新标题应贴合文档实际用词；deleteEmpty：只能删**内容为空且非必填**的节；merge：把来源节全部内容并入目标节（text↔text 或 table↔table，来源节删除）；split：从内容臃肿的 text 节拆出部分块到新节（moves 逐字引用这些块）。\n'
      +'- ops 会被真正执行，只有确定无疑的才放 ops；不确定的一律放 suggestions。',
    user:'文档框架：'+fw+'\n错位信号：'+hintTxt+'\n\n当前内容：\n'+doc
  };
}
function aiNormMove(m){
  if(!m||!m.fromSection||!m.toSection||m.fromSection===m.toSection)return null;
  if(!STATE.framework.find(function(s){return s.id===m.fromSection;}))return null;
  if(!STATE.framework.find(function(s){return s.id===m.toSection;}))return null;
  if(!m.match)return null;
  var pos=m.position==='before'?'before':m.position==='start'?'start':m.position==='end'?'end':'after';
  if((pos==='after'||pos==='before')&&!m.anchor)return null;
  return {fromSection:m.fromSection,match:String(m.match),toSection:m.toSection,position:pos,anchor:String(m.anchor||'')};
}
function aiMoveToItem(m){
  var srcType=(STATE.framework.find(function(s){return s.id===m.fromSection;})||{}).type;
  var kind=srcType==='table'?'moveRow':'moveBlock';
  return {id:aiUid(),kind:kind,fromSection:m.fromSection,fromTitle:(STATE.framework.find(function(s){return s.id===m.fromSection;})||{}).title||m.fromSection,toSection:m.toSection,toTitle:(STATE.framework.find(function(s){return s.id===m.toSection;})||{}).title||m.toSection,match:m.match,position:m.position,anchor:m.anchor,blockOld:'',blockNew:'',rowOld:null,rowNew:null,fromAnchor:'',toAnchor:'',suggestion:'',validation:{ok:true,warnings:[],blocked:[]},status:'pending'};
}
function aiNormOp(o){
  if(!o||!o.op)return null;
  if(o.op==='rename'){
    if(!o.sectionId||!o.newTitle)return null;
    if(!STATE.framework.find(function(s){return s.id===o.sectionId;}))return null;
    return {op:'rename',sectionId:o.sectionId,newTitle:String(o.newTitle).trim()};
  }
  if(o.op==='deleteEmpty'){
    if(!o.sectionId)return null;
    if(!STATE.framework.find(function(s){return s.id===o.sectionId;}))return null;
    return {op:'deleteEmpty',sectionId:o.sectionId};
  }
  if(o.op==='merge'){
    if(!o.fromSection||!o.toSection||o.fromSection===o.toSection)return null;
    if(!STATE.framework.find(function(s){return s.id===o.fromSection;}))return null;
    if(!STATE.framework.find(function(s){return s.id===o.toSection;}))return null;
    return {op:'merge',fromSection:o.fromSection,toSection:o.toSection};
  }
  if(o.op==='split'){
    if(!o.sectionId||!o.newTitle)return null;
    if(!STATE.framework.find(function(s){return s.id===o.sectionId;}))return null;
    var moves=Array.isArray(o.moves)?o.moves.map(function(m){return {match:String(m&&m.match||'')};}).filter(function(m){return m.match;}):[];
    if(!moves.length)return null;
    return {op:'split',sectionId:o.sectionId,newTitle:String(o.newTitle).trim(),moves:moves};
  }
  return null;
}
function aiOpToItem(o){
  var titleOf=function(id){var s=STATE.framework.find(function(x){return x.id===id;});return s?s.title:id;};
  if(o.op==='rename')return {id:aiUid(),kind:'rename',fromSection:o.sectionId,fromTitle:titleOf(o.sectionId),toSection:'',toTitle:'',match:'',position:'',anchor:'',blockOld:'',blockNew:'',rowOld:null,rowNew:null,fromAnchor:'',toAnchor:'',newTitle:o.newTitle,moves:[],meta:null,suggestion:'',validation:{ok:true,warnings:[],blocked:[]},status:'pending'};
  if(o.op==='deleteEmpty')return {id:aiUid(),kind:'deleteEmpty',fromSection:o.sectionId,fromTitle:titleOf(o.sectionId),toSection:'',toTitle:'',match:'',position:'',anchor:'',blockOld:'',blockNew:'',rowOld:null,rowNew:null,fromAnchor:'',toAnchor:'',newTitle:'',moves:[],meta:null,suggestion:'',validation:{ok:true,warnings:[],blocked:[]},status:'pending'};
  if(o.op==='merge')return {id:aiUid(),kind:'merge',fromSection:o.fromSection,fromTitle:titleOf(o.fromSection),toSection:o.toSection,toTitle:titleOf(o.toSection),match:'',position:'',anchor:'',blockOld:'',blockNew:'',rowOld:null,rowNew:null,fromAnchor:'',toAnchor:'',newTitle:'',moves:[],meta:null,suggestion:'',validation:{ok:true,warnings:[],blocked:[]},status:'pending'};
  return {id:aiUid(),kind:'split',fromSection:o.sectionId,fromTitle:titleOf(o.sectionId),toSection:'',toTitle:'',match:'',position:'',anchor:'',blockOld:'',blockNew:'',rowOld:null,rowNew:null,fromAnchor:'',toAnchor:'',newTitle:o.newTitle,moves:o.moves,meta:null,suggestion:'',validation:{ok:true,warnings:[],blocked:[]},status:'pending'};
}
function aiValidateMove(it){
  var w=[],b=[];
  var srcType=(STATE.framework.find(function(s){return s.id===it.fromSection;})||{}).type;
  var dstType=(STATE.framework.find(function(s){return s.id===it.toSection;})||{}).type;
  if(it.kind==='moveRow'&&(srcType!=='table'||dstType!=='table')){b.push('仅支持表格节之间的行搬移');}
  if(it.kind==='moveBlock'&&(srcType!=='text'||dstType!=='text')){b.push('仅支持文本节之间的块搬移');}
  if(it.kind==='moveBlock'){
    var src=DATA[it.fromSection]||{};
    var blocks=aiBlocksOf(String(src.html||'')),ti=-1,mt=aiNormText(it.match);
    for(var i=0;i<blocks.length;i++){if(mt&&(blocks[i].text===mt||blocks[i].text.indexOf(mt)>=0)){ti=i;break;}}
    if(ti<0){b.push('来源节未找到匹配的内容块（引用需逐字一致）');}
    else{
      it.blockOld=blocks[ti].html;it.blockNew=blocks[ti].html;
      it.fromAnchor=ti>0?blocks[ti-1].text.slice(0,80):'';
      if(aiNormText(it.blockOld).indexOf('cmt-hl')>=0)w.push('该块内含评论划线，会随块一起移动');
      var tgt=DATA[it.toSection]||{};
      var tblocks=aiBlocksOf(String(tgt.html||''));
      if(tblocks.some(function(x){return x.text===aiNormText(it.blockOld);}))w.push('目标节已存在相同内容块，可能重复');
      if(it.position==='after'||it.position==='before'){
        var ta=-1,mt2=aiNormText(it.anchor);
        for(var j=0;j<tblocks.length;j++){if(mt2&&(tblocks[j].text===mt2||tblocks[j].text.indexOf(mt2)>=0)){ta=j;break;}}
        if(ta<0)b.push('目标节未找到锚点块（'+it.anchor.slice(0,30)+'…）');
        else it.toAnchor=tblocks[ta].text.slice(0,80);
      }
    }
  }else if(it.kind==='moveRow'){
    var srows=(DATA[it.fromSection]||{}).rows||[];
    var ri=-1,rm=aiNormText(it.match);
    for(var k=0;k<srows.length;k++){var c0=aiNormCell(srows[k]&&srows[k].cells&&srows[k].cells[0]);if(rm&&c0&&(c0===rm||c0.indexOf(rm)>=0)){ri=k;break;}}
    if(ri<0){b.push('来源表未找到匹配行（按首列文本）');}
    else{
      it.rowOld=aiDeep(srows[ri]);it.rowNew=aiDeep(srows[ri]);
      it.fromAnchor=ri>0?aiNormCell(srows[ri-1]&&srows[ri-1].cells&&srows[ri-1].cells[0]):'';
      var trows=(DATA[it.toSection]||{}).rows||[];
      var cols=trows.length&&trows[0].cells?trows[0].cells.length:0;
      if(cols&&cols!==(it.rowOld.cells||[]).length)b.push('目标表列数（'+cols+'）与来源行（'+(it.rowOld.cells||[]).length+'）不一致');
      if(it.position==='after'||it.position==='before'){
        var ra=-1,rm2=aiNormText(it.anchor);
        for(var q=0;q<trows.length;q++){if(rm2&&aiNormCell(trows[q]&&trows[q].cells&&trows[q].cells[0])===rm2){ra=q;break;}}
        if(ra<0)b.push('目标表未找到锚点行（'+it.anchor.slice(0,30)+'…）');
        else it.toAnchor=aiNormCell(trows[ra]&&trows[ra].cells&&trows[ra].cells[0]);
      }
    }
  }else if(it.kind==='rename'){
    var fs=STATE.framework.find(function(s){return s.id===it.fromSection;});
    if(!fs){b.push('节不存在');}
    else if(!it.newTitle||it.newTitle===fs.title){b.push('新标题为空或未变化');}
  }else if(it.kind==='deleteEmpty'){
    var fd=STATE.framework.find(function(s){return s.id===it.fromSection;});
    if(!fd){b.push('节不存在');}
    else{
      if(fd.required)b.push('必填节不能删除');
      if(aiSecText(it.fromSection).trim()||((DATA[it.fromSection]||{}).cards||[]).length)b.push('该节仍有内容，不能作为空节删除');
      if(fd.type==='table'&&((DATA[it.fromSection]||{}).rows||[]).length>1)b.push('该表格节还有数据行');
    }
  }else if(it.kind==='merge'){
    var fm=STATE.framework.find(function(s){return s.id===it.fromSection;});
    var tm=STATE.framework.find(function(s){return s.id===it.toSection;});
    if(!fm||!tm)b.push('来源/目标节不存在');
    else if(fm.id===tm.id)b.push('不能合并到自身');
    else if(fm.type!==tm.type)b.push('仅支持同类型节合并（text↔text 或 table↔table）');
    else if(fm.type==='text'&&!aiBlocksOf(String((DATA[it.fromSection]||{}).html||'')).length)b.push('来源节没有可搬的内容块');
    else if(fm.type==='table'&&((DATA[it.fromSection]||{}).rows||[]).length<=1)b.push('来源表没有可搬的数据行');
  }else if(it.kind==='split'){
    var fs2=STATE.framework.find(function(s){return s.id===it.fromSection;});
    if(!fs2){b.push('节不存在');}
    else{
      if(fs2.type!=='text')b.push('仅支持从文本节拆分');
      if(!it.newTitle)b.push('缺少新节标题');
      var blocks2=aiBlocksOf(String((DATA[it.fromSection]||{}).html||''));
      it.moves.forEach(function(mv){
        var mt3=aiNormText(mv.match),found=false;
        for(var z=0;z<blocks2.length;z++){if(mt3&&(blocks2[z].text===mt3||blocks2[z].text.indexOf(mt3)>=0)){found=true;break;}}
        if(!found)b.push('拆分块「'+String(mv.match).slice(0,20)+'…」在来源节未找到');
      });
      if(!it.moves.length)b.push('缺少要拆走的块');
    }
  }else{
    b.push('未知移动类型');
  }
  it.validation={ok:!b.length,warnings:w,blocked:b};
}
function aiAlign(){
  if(aiBusy){aiToast('AI 正在处理中，请稍候');return;}
  if(!currentProj()){aiToast('请先创建或打开项目');return;}
  if(!String(aiGetSettings().apiKey||'').trim()){aiToast('请先在 设置→AI 中配置 API Key');aiOpenSettingsTab();return;}
  var st=aiState();
  if(st.pendingAlign&&st.pendingAlign.items&&st.pendingAlign.items.length){aiToast('有未确认的结构调整，请先处理');return;}
  aiBusy=true;
  aiGlobalAbort=new AbortController();
  aiCancelFlag=false;
  aiStatus='';aiStatusLog=[];
  var p=aiAlignPrompt();
  aiSetStatus('AI 结构对齐分析中…');
  return aiAskJSON([
    {role:'system',content:p.system},
    {role:'user',content:p.user}
  ],{temperature:0.2,onStatus:aiSetStatus,onDelta:function(c){if(aiStatus.indexOf('已接收')<0)aiSetStatus('AI 正在分析…已接收 '+c.length+' 字');},timeout:120000}).then(function(resp){
    var moves=(resp&&Array.isArray(resp.moves)?resp.moves:[]).map(aiNormMove).filter(Boolean);
    var ops=(resp&&Array.isArray(resp.ops)?resp.ops:[]).map(aiNormOp).filter(Boolean);
    var sug=(resp&&Array.isArray(resp.suggestions)?resp.suggestions:[]).filter(function(s){return s&&s.kind&&s.text;});
    var items=moves.map(function(m){
      var it=aiMoveToItem(m);
      aiValidateMove(it);
      return it;
    });
    ops.forEach(function(o){
      var it=aiOpToItem(o);
      aiValidateMove(it);
      items.push(it);
    });
    sug.forEach(function(s){
      var stitle=(STATE.framework.find(function(x){return x.id===s.sectionId;})||{}).title||'';
      items.push({id:aiUid(),kind:'suggestion',fromSection:s.sectionId||'',fromTitle:stitle,toSection:'',toTitle:'',match:'',position:'',anchor:'',blockOld:'',blockNew:'',rowOld:null,rowNew:null,fromAnchor:'',toAnchor:'',newTitle:'',moves:[],meta:null,suggestion:'['+s.kind+']'+(stitle?'「'+stitle+'」':'')+'：'+s.text,validation:{ok:true,warnings:[],blocked:[]},status:'pending'});
    });
    var st2=aiState();
    st2.pendingAlign={id:aiUid(),createdAt:Date.now(),summary:String(resp&&resp.summary||''),items:items};
    aiPersist();
    aiBusy=false;aiGlobalAbort=null;aiStatus='';aiStatusLog=[];
    aiRenderPanel();
    aiToast(items.length?('结构对齐建议 '+items.length+' 条待确认'):'AI 未发现明显错位');
  }).catch(function(e){
    aiBusy=false;aiGlobalAbort=null;
    if(aiCancelFlag){aiStatus='';aiStatusLog=[];aiRenderPanel();return;}
    aiStatus='';aiRenderPanel();
    var c=aiClassify(e,null,'');
    aiToast('结构对齐失败：'+c.message);
  });
}
function aiJumpToBlock(sid,match){
  try{openSection(sid);}catch(e){}
  var card=document.getElementById('sec-'+sid);
  var fw=STATE.framework.find(function(s){return s.id===sid;});
  var mt=aiNormText(match);
  var hit=null;
  if(fw&&fw.type==='table'&&card){
    var tbl=card.querySelector('.editable table, .table-scroll table, table');
    if(tbl){
      var rows=Array.from(tbl.querySelectorAll('tr'));
      for(var i=0;i<rows.length;i++){
        var first=rows[i].querySelector('th,td');
        var t=aiNormText(first?first.textContent:'');
        if(t&&mt&&(t===mt||t.indexOf(mt)>=0||mt.indexOf(t)>=0)){hit=rows[i];break;}
      }
    }
  }
  if(!hit&&card){
    var ed=card.querySelector('.editable[data-id="'+sid+'"], .table-scroll');
    if(ed){
      var els=Array.from(ed.children||[]);
      if(!els.length)els=Array.from(ed.querySelectorAll('p,ul,ol,table,h3,h4,div'));
      for(var j=0;j<els.length;j++){
        var t2=aiNormText(els[j].textContent||'');
        if(t2&&mt&&(t2===mt||t2.indexOf(mt)>=0||mt.indexOf(t2)>=0)){hit=els[j];break;}
      }
      if(!hit&&mt){
        var all=Array.from(ed.querySelectorAll('p,ul,ol,table,h3,h4,div'));
        for(var k=0;k<all.length;k++){
          var t3=aiNormText(all[k].textContent||'');
          if(t3&&mt&&(t3===mt||t3.indexOf(mt)>=0||mt.indexOf(t3)>=0)){hit=all[k];break;}
        }
      }
    }
  }
  if(hit){
    try{hit.scrollIntoView({behavior:'smooth',block:'center'});}catch(e){try{hit.scrollIntoView();}catch(e2){}}
    hit.classList.add('ai-flash');
    setTimeout(function(){hit.classList.remove('ai-flash');},2400);
  }else if(card){
    try{card.scrollIntoView({behavior:'smooth',block:'start'});}catch(e){}
    aiToast('未找到精确内容，已定位到节');
  }
}
function aiDecideAlign(id,status){
  var st=aiState();var pa=st.pendingAlign;if(!pa)return;
  var it=pa.items.filter(function(x){return x.id===id;})[0];
  if(!it)return;
  it.status=status;
  aiPersist();aiRenderPanel();
  if(pa.items.every(function(x){return x.status!=='pending';}))aiFinalizeAlign();
}
function aiAcceptAllAlign(){
  var st=aiState();var pa=st.pendingAlign;if(!pa)return;
  pa.items.forEach(function(it){if(it.status==='pending'&&it.validation&&it.validation.ok)it.status='accepted';});
  if(!pa.items.some(function(it){return it.status==='accepted';})){aiToast('存在校验不过的调整，请逐条处理');return;}
  aiPersist();aiFinalizeAlign();
}
function aiApplyAlignItem(it,patches){
  if(it.kind==='moveBlock'){
    var sc=DATA[it.fromSection],tc=DATA[it.toSection];
    if(!sc||!tc)return;
    var srcHtml=String(sc.html||'');
    sc.html=aiReplaceFirst(srcHtml,it.blockOld,'');
    var tgtHtml=String(tc.html||'');
    if(it.position==='start'){tc.html=it.blockOld+tgtHtml;return pushAlignPatches(it,patches);}
    if(it.position==='end'){tc.html=tgtHtml+it.blockOld;return pushAlignPatches(it,patches);}
    var tblocks=aiBlocksOf(tgtHtml),ai2=-1,mt2=aiNormText(it.anchor);
    for(var i=0;i<tblocks.length;i++){if(mt2&&(tblocks[i].text===mt2||tblocks[i].text.indexOf(mt2)>=0)){ai2=i;break;}}
    if(ai2>=0)tc.html=it.position==='before'?aiReplaceFirst(tgtHtml,tblocks[ai2].html,it.blockOld+tblocks[ai2].html):aiReplaceFirst(tgtHtml,tblocks[ai2].html,tblocks[ai2].html+it.blockOld);
    else tc.html=tgtHtml+it.blockOld;
    pushAlignPatches(it,patches);
  }else if(it.kind==='moveRow'){
    var sc2=DATA[it.fromSection],tc2=DATA[it.toSection];
    if(!sc2||!tc2)return;
    var srows=aiDeep(sc2.rows||[]),ri=-1,rm=aiNormText(it.match);
    for(var j=0;j<srows.length;j++){if(rm&&aiNormCell(srows[j]&&srows[j].cells&&srows[j].cells[0])===rm){ri=j;break;}}
    if(ri<0)return;
    var row=srows.splice(ri,1)[0];
    sc2.rows=srows;
    var trows=aiDeep(tc2.rows||[]);
    if(it.position==='start'){trows.unshift(row);}
    else if(it.position==='end'){trows.push(row);}
    else{
      var ra=-1,rm2=aiNormText(it.anchor);
      for(var k=0;k<trows.length;k++){if(rm2&&aiNormCell(trows[k]&&trows[k].cells&&trows[k].cells[0])===rm2){ra=k;break;}}
      if(ra>=0)trows.splice(it.position==='before'?ra:ra+1,0,row);
      else trows.push(row);
    }
    tc2.rows=trows;
    pushAlignPatches(it,patches);
  }else if(it.kind==='rename'){
    var fs=STATE.framework.find(function(s){return s.id===it.fromSection;});
    if(!fs)return;
    var oldTitle=fs.title;
    aiFwRename(it.fromSection,it.newTitle);
    (patches[it.fromSection]=patches[it.fromSection]||[]).push({kind:'fwname',sectionId:it.fromSection,oldTitle:oldTitle,newTitle:it.newTitle});
  }else if(it.kind==='deleteEmpty'){
    var fd=STATE.framework.find(function(s){return s.id===it.fromSection;});
    if(!fd)return;
    var idx=STATE.framework.indexOf(fd);
    var meta={title:fd.title,type:fd.type,required:!!fd.required,weight:fd.weight!=null?fd.weight:1};
    aiFwRemove(it.fromSection);
    (patches[it.fromSection]=patches[it.fromSection]||[]).push({kind:'fwdel',sectionId:it.fromSection,meta:meta,index:idx});
  }else if(it.kind==='merge'){
    var fm=STATE.framework.find(function(s){return s.id===it.fromSection;});
    var tm=STATE.framework.find(function(s){return s.id===it.toSection;});
    if(!fm||!tm)return;
    var idxM=STATE.framework.indexOf(fm);
    var metaM={title:fm.title,type:fm.type,required:!!fm.required,weight:fm.weight!=null?fm.weight:1};
    if(fm.type==='text'){
      var sc3=DATA[it.fromSection],tc3=DATA[it.toSection];
      if(!sc3||!tc3)return;
      var blocks=aiBlocksOf(String(sc3.html||''));
      blocks.forEach(function(b,bi){
        var anchor=bi>0?blocks[bi-1].text.slice(0,80):'';
        sc3.html=aiReplaceFirst(sc3.html,b.html,'');
        tc3.html=(tc3.html||'')+b.html;
        (patches[it.fromSection]=patches[it.fromSection]||[]).push({kind:'block',blockOld:b.html,blockNew:'',anchor:anchor});
        (patches[it.toSection]=patches[it.toSection]||[]).push({kind:'block',blockOld:'',blockNew:b.html,anchor:''});
      });
    }else{
      var sc4=DATA[it.fromSection],tc4=DATA[it.toSection];
      if(!sc4||!tc4)return;
      var srows=aiDeep(sc4.rows||[]),dataRows=srows.slice(1);
      sc4.rows=[srows.length?srows[0]:{cells:[]}];
      var trows=aiDeep(tc4.rows||[]);
      dataRows.forEach(function(row){
        trows.push(row);
        (patches[it.fromSection]=patches[it.fromSection]||[]).push({kind:'row',rowOp:'delete',match:aiNormCell(row.cells&&row.cells[0]),rowOld:row,rowNew:null,anchor:''});
        (patches[it.toSection]=patches[it.toSection]||[]).push({kind:'row',rowOp:'insert',match:'',rowOld:null,rowNew:row,anchor:''});
      });
      tc4.rows=trows;
    }
    aiFwRemove(it.fromSection);
    (patches[it.fromSection]=patches[it.fromSection]||[]).push({kind:'fwdel',sectionId:it.fromSection,meta:metaM,index:idxM});
  }else if(it.kind==='split'){
    var fs4=STATE.framework.find(function(s){return s.id===it.fromSection;});
    if(!fs4)return;
    var newId='ai_'+aiUid().slice(0,10);
    var srcIdx=STATE.framework.indexOf(fs4);
    aiFwInsert(newId,{title:it.newTitle,type:'text',required:false,weight:1},srcIdx+1);
    (patches[newId]=patches[newId]||[]).push({kind:'fwadd',sectionId:newId,meta:{title:it.newTitle,type:'text',required:false,weight:1},index:srcIdx+1});
    var sc5=DATA[it.fromSection],newData=DATA[newId];
    if(!sc5||!newData)return;
    it.moves.forEach(function(mv){
      var blocks5=aiBlocksOf(String(sc5.html||'')),ti2=-1,mt5=aiNormText(mv.match);
      for(var z=0;z<blocks5.length;z++){if(mt5&&(blocks5[z].text===mt5||blocks5[z].text.indexOf(mt5)>=0)){ti2=z;break;}}
      if(ti2<0)return;
      var b=blocks5[ti2];
      var anchor=ti2>0?blocks5[ti2-1].text.slice(0,80):'';
      sc5.html=aiReplaceFirst(sc5.html,b.html,'');
      newData.html=(newData.html||'')+b.html;
      (patches[it.fromSection]=patches[it.fromSection]||[]).push({kind:'block',blockOld:b.html,blockNew:'',anchor:anchor});
      (patches[newId]=patches[newId]||[]).push({kind:'block',blockOld:'',blockNew:b.html,anchor:''});
    });
  }
}
function pushAlignPatches(it,patches){
  if(it.kind==='moveBlock'){
    (patches[it.fromSection]=patches[it.fromSection]||[]).push({kind:'block',blockOld:it.blockOld,blockNew:'',anchor:it.fromAnchor||''});
    (patches[it.toSection]=patches[it.toSection]||[]).push({kind:'block',blockOld:'',blockNew:it.blockNew,anchor:it.toAnchor||''});
  }else if(it.kind==='moveRow'){
    (patches[it.fromSection]=patches[it.fromSection]||[]).push({kind:'row',rowOp:'delete',match:it.match,rowOld:it.rowOld,rowNew:null,anchor:it.fromAnchor||''});
    (patches[it.toSection]=patches[it.toSection]||[]).push({kind:'row',rowOp:'insert',match:'',rowOld:null,rowNew:it.rowNew,anchor:it.toAnchor||''});
  }
}
function aiFinalizeAlign(){
  var st=aiState();var pa=st.pendingAlign;if(!pa)return;
  var open=pa.items.filter(function(i){return i.status==='pending'||i.status==='deferred';});
  if(open.length){aiToast('还有 '+open.length+' 条未处理项，处理完后再归档');aiRenderPanel();return;}
  var accepted=pa.items.filter(function(i){return i.status==='accepted';});
  if(!accepted.length){st.pendingAlign=null;aiPersist();aiRenderPanel();aiToast('结构对齐全部拒绝，未产生版本');return;}
  var patches={};
  accepted.forEach(function(it){aiApplyAlignItem(it,patches);});
  var totalEntries=Object.keys(patches).reduce(function(a,s){return a+patches[s].length;},0);
  if(!totalEntries){st.pendingAlign=null;aiPersist();aiRenderPanel();aiToast('仅建议类调整，无自动执行内容');return;}
  var vs=st.versions||(st.versions=[]);
  var n=vs.filter(function(v){return String(v.label||'').indexOf('结构对齐')===0;}).length;
  aiCreateVersion('ai',n?'结构对齐 '+(n+1):'结构对齐',patches,null,null,{applied:true});
  st.pendingAlign=null;
  aiPersist();
  try{render();refreshHealthUI();}catch(e){}
  aiRenderPanel();
  aiToast('结构对齐已应用，保存为「结构对齐」版本');
}

/* ---------- 校验 / 清洗 ---------- */
function aiSanitizeHtml(h){
  if(!h)return '';
  var text=String(h);
  try{
    var d=document.createElement('div');
    d.innerHTML=text;
    var all=d.querySelectorAll?d.querySelectorAll('*'):null;
    if(all&&all.length){
      d.querySelectorAll('script,style,iframe,object,embed,link,meta,form,svg').forEach(function(n){n.remove();});
      d.querySelectorAll('*').forEach(function(n){
        Array.from(n.attributes||[]).forEach(function(at){
          var nm=at.name.toLowerCase();
          if(/^on/i.test(nm)||nm==='style'||nm==='id')n.removeAttribute(at.name);
        });
        if(n.tagName==='IMG'){var src=n.getAttribute('src')||'';if(!/^(https?:|data:image\/|blob:)/i.test(src))n.removeAttribute('src');}
        if(n.tagName==='A'){var hr=n.getAttribute('href')||'';if(/^\s*javascript:/i.test(hr))n.removeAttribute('href');}
      });
      return d.innerHTML;
    }
  }catch(e){}
  // 兜底：无 DOM 解析能力（如极简测试环境）时走正则清洗
  return text.replace(/<script[\s\S]*?<\/script>/gi,'')
    .replace(/<style[\s\S]*?<\/style>/gi,'')
    .replace(/<iframe[\s\S]*?<\/iframe>/gi,'')
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi,'')
    .replace(/\sstyle\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi,'');
}
function aiNormChange(ch){
  if(!ch||!ch.sectionId)return null;
  if(!STATE.framework.find(function(f){return f.id===ch.sectionId;}))return null;
  var type=ch.type;
  if(type==='text'){
    var edits=Array.isArray(ch.edits)?ch.edits.map(aiNormEdit).filter(Boolean):[];
    var replaceSection=(typeof ch.newHtml==='string'&&ch.newHtml.trim())?aiSanitizeHtml(ch.newHtml):null;
    if(edits.length)return {sectionId:ch.sectionId,type:'text',edits:edits};
    if(replaceSection)return {sectionId:ch.sectionId,type:'text',edits:[],replaceSection:replaceSection};
    return null;
  }
  if(type==='table'){
    var rowEdits=Array.isArray(ch.rowEdits)?ch.rowEdits.map(aiNormRowEdit).filter(Boolean):[];
    var replaceRows=Array.isArray(ch.newRows)?ch.newRows.filter(function(r){return r&&Array.isArray(r.cells);}).map(function(r){return {cells:r.cells.map(function(v){return String(v==null?'':v);})};}):null;
    if(rowEdits.length)return {sectionId:ch.sectionId,type:'table',rowEdits:rowEdits};
    if(replaceRows&&replaceRows.length)return {sectionId:ch.sectionId,type:'table',rowEdits:[],replaceRows:replaceRows};
    return null;
  }
  return {sectionId:ch.sectionId,type:'suggestion',suggestion:String(ch.suggestion||'').trim()};
}
function aiNormEdit(e){
  if(!e||!e.op)return null;
  if(e.op==='replaceBlock'){
    if(typeof e.newHtml!=='string'||!e.newHtml.trim()||!e.match)return null;
    return {op:'replaceBlock',match:String(e.match),newHtml:aiSanitizeHtml(e.newHtml)};
  }
  if(e.op==='insertBlock'){
    if(typeof e.newHtml!=='string'||!e.newHtml.trim())return null;
    if(e.position==='start'||e.position==='end')return {op:'insertBlock',match:'',newHtml:aiSanitizeHtml(e.newHtml),position:e.position};
    if(!e.match)return null;
    return {op:'insertBlock',match:String(e.match),newHtml:aiSanitizeHtml(e.newHtml),position:e.position==='before'?'before':'after'};
  }
  if(e.op==='deleteBlock'){
    if(!e.match)return null;
    return {op:'deleteBlock',match:String(e.match)};
  }
  return null;
}
function aiNormRowEdit(e){
  if(!e||!e.op)return null;
  if(e.op==='update'){
    if(!Array.isArray(e.cells)||!e.cells.length||!e.match)return null;
    return {op:'update',match:String(e.match),cells:e.cells.map(function(v){return String(v==null?'':v);})};
  }
  if(e.op==='insert'){
    if(!Array.isArray(e.cells)||!e.cells.length)return null;
    if(e.position==='end')return {op:'insert',match:'',cells:e.cells.map(function(v){return String(v==null?'':v);}),position:'end'};
    if(!e.match)return null;
    return {op:'insert',match:String(e.match),cells:e.cells.map(function(v){return String(v==null?'':v);}),position:e.position==='before'?'before':'after'};
  }
  if(e.op==='delete'){
    if(!e.match)return null;
    return {op:'delete',match:String(e.match)};
  }
  return null;
}

/* ---------- 版本 ---------- */
function aiCurFields(sid){
  var c=DATA[sid];if(!c)return {};
  var out={};
  if(c.html!=null)out.html=c.html;
  if(c.rows!=null)out.rows=aiDeep(c.rows);
  if(c.items!=null)out.items=aiDeep(c.items);
  return out;
}
function aiFieldsEq(a,b){
  return aiHashOf(a||{})===aiHashOf(b||{});
}
function aiApplyFields(sid,fields){
  var c=DATA[sid];if(!c||!fields)return;
  if('html' in fields)c.html=fields.html;
  if('rows' in fields)c.rows=aiDeep(fields.rows);
  if('items' in fields)c.items=aiDeep(fields.items);
}
function aiVersionLabel(kind,n){
  if(kind==='original')return '原始版';
  if(kind==='human')return '人工版'+(n>1?' '+n:'');
  if(kind==='final')return '终稿';
  return '优化版'+(n>1?' '+n:'');
}
function aiCreateVersion(kind,label,patches,scoreBefore,scoreAfter,opts){
  var st=aiState();if(!st)return null;
  var vs=st.versions||(st.versions=[]);
  var v={id:aiUid(),kind:kind,label:label,createdAt:Date.now(),parentId:vs.length?vs[vs.length-1].id:null,patch:patches||{},scoreBefore:scoreBefore==null?null:aiRound(scoreBefore),scoreAfter:scoreAfter==null?null:aiRound(scoreAfter),applied:!!(opts&&opts.applied),transform:!!(opts&&opts.transform),rolledBack:false};
  vs.push(v);
  var sz=0;try{sz=JSON.stringify(v.patch).length;}catch(e){}
  if(sz>AI_PATCH_WARN)aiToast('注意：该版本差异较大（约 '+(sz/1024).toFixed(0)+'KB），建议导出备份。');
  aiPruneVersions();
  aiPersist();
  return v;
}
function aiPruneVersions(){
  var st=aiState();if(!st)return;
  var vs=st.versions;if(!vs||vs.length<=AI_MAX_VERSIONS)return;
  while(vs.length>AI_MAX_VERSIONS){
    var idx=vs.findIndex(function(v){return v.kind!=='final';});
    if(idx<0)break;
    var removed=vs.splice(idx,1)[0];
    aiToast('版本已达上限（'+AI_MAX_VERSIONS+'），已自动淘汰最早版本「'+(removed.label||removed.kind)+'」（导出的备份中仍可找回）。');
  }
}
function aiReverseEntries(fields,entries){
  fields.items=fields.items||null;
  entries.forEach(function(e){
    if(!e)return;
    if(e.kind==='section'){fields.html=e.oldHtml;}
    else if(e.kind==='rows'){fields.rows=aiDeep(e.oldRows||[]);}
    else if(e.kind==='block'){
      var h=String(fields.html||'');
      if(e.blockNew){h=aiReplaceFirst(h,e.blockNew,e.blockOld||'');}
      else if(e.blockOld){
        var blocks=aiBlocksOf(h),idx=-1;
        if(e.anchor){var mt=aiNormText(e.anchor);for(var i=0;i<blocks.length;i++){if(mt&&(blocks[i].text===mt||blocks[i].text.indexOf(mt)>=0)){idx=i;break;}}}
        if(idx>=0)h=aiReplaceFirst(h,blocks[idx].html,blocks[idx].html+e.blockOld);
        else h=h+e.blockOld;
      }
      fields.html=h;
    }else if(e.kind==='row'){
      var rows=aiDeep(fields.rows||[]);
      if(e.rowOp==='update'){
        var mu=aiNormCell(e.rowNew&&e.rowNew.cells&&e.rowNew.cells[0]);
        for(var j=0;j<rows.length;j++){if(mu&&aiNormCell(rows[j].cells&&rows[j].cells[0])===mu){rows[j]=e.rowOld?aiDeep(e.rowOld):rows[j];break;}}
      }else if(e.rowOp==='insert'&&e.rowNew){
        var mi=aiNormCell(e.rowNew.cells&&e.rowNew.cells[0]);
        for(var k=rows.length-1;k>=0;k--){if(mi&&aiNormCell(rows[k].cells&&rows[k].cells[0])===mi){rows.splice(k,1);break;}}
      }else if(e.rowOp==='delete'&&e.rowOld){
        var ai2=-1;
        if(e.anchor){for(var k2=0;k2<rows.length;k2++){if(aiNormCell(rows[k2].cells&&rows[k2].cells[0])===aiNormText(e.anchor)){ai2=k2;break;}}}
        if(ai2>=0)rows.splice(ai2+1,0,aiDeep(e.rowOld));else rows.push(aiDeep(e.rowOld));
      }
      fields.rows=rows;
    }else if(e.kind==='items'){
      fields.items=aiDeep(e.oldItems||[]);
    }
  });
  return fields;
}
function aiReversePatch(sid,entries){
  var c=DATA[sid];if(!c)return;
  if(!Array.isArray(entries)){aiApplyFields(sid,entries&&entries.old);return;}
  var f=aiReverseEntries({html:c.html,rows:c.rows?aiDeep(c.rows):null,items:c.items?aiDeep(c.items):null},entries);
  if(f.html!=null)c.html=f.html;
  if(f.rows)c.rows=f.rows;
  if(f.items!=null)c.items=f.items;
}
function aiEnsureTarget(fields,entries){
  fields.items=fields.items||null;
  entries.forEach(function(e){
    if(!e)return;
    if(e.kind==='section'){fields.html=e.newHtml;}
    else if(e.kind==='rows'){fields.rows=aiDeep(e.newRows||[]);}
    else if(e.kind==='block'){
      var h=String(fields.html||'');
      if(e.blockNew){
        var blocks=aiBlocksOf(h),idx=-1,mt=aiNormText(e.blockNew);
        for(var i=0;i<blocks.length;i++){if(mt&&blocks[i].text===mt){idx=i;break;}}
        if(idx>=0){if(blocks[idx].html!==e.blockNew)h=aiReplaceFirst(h,blocks[idx].html,e.blockNew);}
        else h=h+e.blockNew;
      }
      fields.html=h;
    }else if(e.kind==='row'){
      var rows=aiDeep(fields.rows||[]);
      if(e.rowNew){
        var m1=aiNormCell(e.rowNew.cells&&e.rowNew.cells[0]),found=-1;
        for(var j=0;j<rows.length;j++){if(m1&&aiNormCell(rows[j].cells&&rows[j].cells[0])===m1){found=j;break;}}
        if(found>=0)rows[found]=aiDeep(e.rowNew);
        else rows.push(aiDeep(e.rowNew));
      }
      fields.rows=rows;
    }else if(e.kind==='items'){
      fields.items=aiDeep(e.newItems||[]);
    }
  });
  return fields;
}
function aiFwRename(sid,title){
  var p=currentProj();if(!p)return;
  var s=p.framework.find(function(x){return x.id===sid;});
  if(s)s.title=title;
  var s2=STATE.framework.find(function(x){return x.id===sid;});
  if(s2)s2.title=title;
}
function aiFwRemove(sid){
  var p=currentProj();if(!p)return;
  var idx=p.framework.findIndex(function(s){return s.id===sid;});
  if(idx>=0)p.framework.splice(idx,1);
  STATE.framework=p.framework;
  if(p.data&&sid in p.data)delete p.data[sid];
  if(sid in DATA)delete DATA[sid];
}
function aiFwInsert(sid,meta,index){
  var p=currentProj();if(!p)return;
  if(p.framework.some(function(s){return s.id===sid;}))return;
  var fw={id:sid,title:(meta&&meta.title)||sid,type:(meta&&meta.type)||'text',required:!!(meta&&meta.required),weight:(meta&&meta.weight)!=null?meta.weight:1};
  var idx=Math.max(0,Math.min(index==null?p.framework.length:index,p.framework.length));
  p.framework.splice(idx,0,fw);
  STATE.framework=p.framework;
  if(!p.data[sid])p.data[sid]={};
  if(p.data[sid].html===undefined)p.data[sid].html='';
  if(!p.data[sid].cards)p.data[sid].cards=[];
  DATA=p.data;
}
function aiHasFwEntries(v){
  var p=v.patch||{};
  return Object.keys(p).some(function(sid){
    var arr=p[sid];
    if(!Array.isArray(arr))return false;
    return arr.some(function(e){return e&&(e.kind==='fwdel'||e.kind==='fwadd'||e.kind==='fwname');});
  });
}
function aiReverseVersionPatch(v){
  var p=v.patch||{};
  Object.keys(p).forEach(function(sid){
    var arr=p[sid];
    if(!Array.isArray(arr))return;
    arr.forEach(function(e){
      if(e.kind==='fwdel')aiFwInsert(sid,e.meta,e.index);
      else if(e.kind==='fwadd')aiFwRemove(sid);
      else if(e.kind==='fwname')aiFwRename(sid,e.oldTitle);
    });
  });
  Object.keys(p).forEach(function(sid){aiReversePatch(sid,p[sid]);});
}
function aiRestoreToVersion(vid){
  var st=aiState();if(!st)return;
  var vs=st.versions;
  var target=vs.filter(function(v){return v.id===vid;})[0];
  if(!target){aiToast('版本不存在');return;}
  var idxT=vs.indexOf(target);
  var later=vs.slice(idxT+1);
  // v17.2：变换型版本（如结构对齐，含删除类条目）恢复头部=撤销该次搬移
  // v17.15：AI 草稿版本标记 transform=true，恢复=撤销草稿回到生成前空白
  var isTransform=target.transform===true||Object.keys(target.patch||{}).some(function(sid){
    var arr=target.patch[sid];
    if(!Array.isArray(arr))return false;
    return arr.some(function(e){return (e.kind==='block'&&e.blockNew==='')||(e.kind==='row'&&e.rowNew==null)||(e.kind==='fwdel')||(e.kind==='fwadd')||(e.kind==='fwname');});
  });
  if(!later.length&&isTransform){
    if(target.transform){
      // AI 草稿类：先存「恢复前快照」，恢复该快照即可重新得到草稿内容
      var safetyT={};
      Object.keys(target.patch||{}).forEach(function(sid){
        var arr=target.patch[sid];
        var c=DATA[sid];
        if(!Array.isArray(arr)||!c)return;
        var cur={html:c.html,rows:c.rows?aiDeep(c.rows):null,items:c.items?aiDeep(c.items):null};
        var es=[];
        arr.forEach(function(e){
          if(e.kind==='section')es.push({kind:'section',oldHtml:'',newHtml:cur.html});
          else if(e.kind==='rows')es.push({kind:'rows',oldRows:[],newRows:cur.rows||[]});
          else if(e.kind==='items')es.push({kind:'items',oldItems:[],newItems:cur.items||[]});
        });
        if(es.length)safetyT[sid]=es;
      });
      if(Object.keys(safetyT).length)aiCreateVersion('human','恢复前快照',safetyT,null,null,{applied:true});
    }
    aiReverseVersionPatch(target);
    aiPersist();
    try{render();refreshHealthUI();}catch(e){}
    aiRenderPanel();
    aiToast('已撤销「'+target.label+'」'+(target.transform?'（内容已回到生成前空白）':'（内容已搬回原位）'));
    return;
  }
  var hasFw=aiHasFwEntries(target)||later.some(aiHasFwEntries);
  // 生成安全版本：记录受影响节当前值 vs 目标版本状态（任何恢复都可再撤销）
  var affected={};
  later.forEach(function(v){Object.keys(v.patch).forEach(function(s){affected[s]=1;});});
  Object.keys(target.patch||{}).forEach(function(s){affected[s]=1;});
  if(!hasFw){
    var safety={};
    Object.keys(affected).forEach(function(sid){
      var targetState=aiCurFields(sid);
      for(var i=later.length-1;i>=0;i--){
        var p=later[i].patch[sid];
        if(Array.isArray(p))targetState=aiReverseEntries(targetState,p);
        else if(p&&p.old&&Object.keys(p.old).length)targetState=aiDeep(p.old);
      }
      var tp=target.patch&&target.patch[sid];
      if(tp&&!Array.isArray(tp)&&tp.new)targetState=aiDeep(tp.new);
      safety[sid]={old:targetState,new:aiCurFields(sid)};
    });
    aiCreateVersion('human','恢复前快照',safety,null,null,{applied:true});
  }
  // 倒序回放：head → 目标（每个 patch 的 old 即父版本内容，逐字快照无误差）
  later.slice().reverse().forEach(function(v){
    aiReverseVersionPatch(v);
  });
  // 目标版本自身涉及的节落回该版本 new（旧格式直接赋值；新格式按块 ensure，兜底追加）
  Object.keys(target.patch||{}).forEach(function(sid){
    var tp=target.patch[sid];
    if(Array.isArray(tp)){
      var c=DATA[sid];if(!c)return;
      var f=aiEnsureTarget({html:c.html,rows:c.rows?aiDeep(c.rows):null,items:c.items?aiDeep(c.items):null},tp);
      if(f.html!=null)c.html=f.html;
      if(f.rows)c.rows=f.rows;
      if(f.items!=null)c.items=f.items;
    }else if(tp&&tp.new){aiApplyFields(sid,tp.new);}
  });
  aiPersist();
  try{render();refreshHealthUI();}catch(e){}
  aiRenderPanel();
  aiToast('已恢复到「'+target.label+'」'+(target.scoreAfter!=null?'（'+target.scoreAfter+' 分）':''));
}
function aiCaptureManualDelta(){
  var st=aiState();if(!st||!st.versions||!st.versions.length)return;
  var vs=st.versions;
  var hasNew=vs.some(function(v){return Object.keys(v.patch||{}).some(function(s){return Array.isArray(v.patch[s]);});});
  if(hasNew)return; // v17.1 块级补丁暂不自动捕获人工增量（恢复前快照已兜底）
  var rec={};
  vs.forEach(function(v){Object.keys(v.patch||{}).forEach(function(sid){rec[sid]=v.patch[sid].new;});});
  var changes={};
  Object.keys(rec).forEach(function(sid){
    var cur=aiCurFields(sid);
    if(!aiFieldsEq(cur,rec[sid]))changes[sid]={old:aiDeep(rec[sid]),new:cur};
  });
  if(Object.keys(changes).length){
    aiCreateVersion('human',aiVersionLabel('human',vs.filter(function(v){return v.kind==='human';}).length+1),changes,null,null,{applied:true});
    aiToast('检测到版本后的人工修改，已自动记录为人工版本');
  }
}

/* ---------- 6 维评分 ---------- */
function aiComputeTotal(r){
  if(!r||!r.dimensions)return 0;
  var w=0,v=0;
  r.dimensions.forEach(function(d){if(d.weight>0){w+=d.weight;v+=d.score*d.weight;}});
  return w?aiRound(v/w):0;
}

/* ---------- 一键优化 ---------- */
var aiStatus='';
var aiStatusLog=[];
var aiBusy=false;
var aiGlobalAbort=null;
var aiCancelFlag=false;
var aiOptDbg=null;
var aiBackupTimer=null;
var aiRecoverOffer=null;
function aiSetStatus(m){
  aiStatus=m;
  if(m){aiStatusLog.push(m);if(aiStatusLog.length>50)aiStatusLog.shift();}
  aiRenderPanel();
}
function aiAbortRun(){
  aiCancelFlag=true;
  if(aiGlobalAbort){try{aiGlobalAbort.abort();}catch(e){}}
  aiGlobalAbort=null;
  aiBusy=false;
  aiStatus='';aiStatusLog=[];
  aiRenderPanel();
  aiToast('已停止 AI 任务');
}
function aiBackupState(){
  try{
    var raw=localStorage.getItem(STORAGE_KEY);
    if(raw)localStorage.setItem(STORAGE_KEY+'.bak',raw);
  }catch(e){}
}
function aiWrapSave(){
  if(window.__aiSaveWrapped||typeof save!=='function')return;
  window.__aiSaveWrapped=true;
  var orig=window.save;
  window.save=function(){
    var r=orig.apply(this,arguments);
    if(!aiBackupTimer){
      aiBackupTimer=setTimeout(function(){aiBackupTimer=null;aiBackupState();},5000);
    }
    return r;
  };
  try{
    window.addEventListener('beforeunload',function(){
      if(aiBackupTimer){clearTimeout(aiBackupTimer);aiBackupTimer=null;}
      aiBackupState();
    });
  }catch(e){}
}
function aiRecoverFromBackup(){
  var raw=null,bak=null;
  try{raw=localStorage.getItem(STORAGE_KEY);}catch(e){}
  try{bak=localStorage.getItem(STORAGE_KEY+'.bak');}catch(e){}
  if(!bak)return false;
  var j=null;
  try{j=JSON.parse(bak);}catch(e){}
  if(!j||!Array.isArray(j.projects)||!j.projects.length)return false;
  if(raw===null){
    // 主存储彻底缺失（被清/被删）→ 自动恢复
    try{
      STATE=j;
      save();
      aiToast('检测到本地自动备份，已恢复 '+j.projects.length+' 个项目');
      return true;
    }catch(e){return false;}
  }
  var rj=null;
  try{rj=JSON.parse(raw);}catch(e){}
  if(rj&&(!rj.projects||!rj.projects.length)){
    // 主存储存在但项目为空 → 不自动覆盖（尊重用户删除），面板给一键恢复入口
    aiRecoverOffer={count:j.projects.length,at:Date.now()};
    return true;
  }
  return false;
}
function aiOptScope(){return {mode:aiOptMode,sectionId:aiOptSectionId};}
var aiOptMode='full',aiOptSectionId=null;

function aiRunScore(){
  if(aiBusy){aiToast('AI 正在处理中，请稍候');return;}
  aiBusy=true;
  aiGlobalAbort=new AbortController();
  aiCancelFlag=false;
  var st=aiGetSettings();
  if(!String(st.apiKey||'').trim()||!String(st.baseUrl||'').trim()){aiBusy=false;aiToast('请先在 设置→AI 中配置 API Key 与地址');aiOpenSettingsTab();return;}
  var proj=currentProj();if(!proj){aiBusy=false;aiToast('请先创建或打开项目');return;}
  aiStatus='';aiStatusLog=[];
  aiSetStatus('AI 深度体检中（约 10-40 秒）…');
  var t0=Date.now();
  var lastUi=0;
  var timer=setInterval(function(){
    if(Date.now()-lastUi>1000){
      lastUi=Date.now();
      aiSetStatus(aiStatus.replace(/（已用时 \d+ 秒）$/,'')+'（已用时 '+Math.round((Date.now()-t0)/1000)+' 秒）');
    }
  },1000);
  return aiScore(aiDocText(),{onStatus:aiSetStatus,onDelta:function(c){if(aiStatus.indexOf('已接收')<0)aiSetStatus('AI 正在分析…已接收 '+c.length+' 字');}}).then(function(r){
    clearInterval(timer);
    aiBusy=false;
    aiGlobalAbort=null;
    var st2=aiState();st2.lastReport=r;st2.pendingDiffs=null;aiPersist();
    aiSetStatus('');aiStatusLog=[];
    aiRenderPanel();
    aiToast('AI 深度体检完成：'+r.total+' 分');
  }).catch(function(e){
    clearInterval(timer);
    aiGlobalAbort=null;
    if(aiCancelFlag){aiBusy=false;aiStatus='';aiStatusLog=[];aiRenderPanel();return;}
    var c=aiClassify(e,null,'');
    aiBusy=false;
    aiSetStatus('');aiRenderPanel();
    aiToast('AI 体检失败：'+c.message);
  });
}
function aiOpenOptModal(){
  if(!currentProj()){aiToast('请先创建或打开项目');return;}
  if(!String(aiGetSettings().apiKey||'').trim()){aiToast('请先在 设置→AI 中配置 API Key');aiOpenSettingsTab();return;}
  var st=aiState();
  if(st.pendingDiffs&&st.pendingDiffs.items&&st.pendingDiffs.items.length){
    aiToast('有未确认的修改待处理，请先在 AI 面板完成确认');
    return;
  }
  var sel=document.getElementById('aiOptSec');
  if(sel){
    var opts=STATE.framework.map(function(s){return '<option value="'+aiEsc(s.id)+'">'+aiEsc(s.title)+'</option>';}).join('');
    sel.innerHTML=opts;
  }
  try{openModal('aiOptModal');}catch(e){document.getElementById('aiOptModal').classList.add('open');}
}
function aiRunOptimize(){
  if(aiBusy){aiToast('AI 正在处理中，请稍候');return;}
  aiBusy=true;
  aiGlobalAbort=new AbortController();
  aiCancelFlag=false;
  aiOptDbg={at:Date.now(),steps:[]};
  var st=aiGetSettings();
  var scope=aiOptScope();
  if(scope.mode==='section'&&!STATE.framework.find(function(f){return f.id===scope.sectionId;})){aiBusy=false;aiToast('请选择要优化的节');return;}
  aiCaptureManualDelta();
  aiStatus='';aiStatusLog=[];
  var proj=currentProj();
  var baseText=scope.mode==='section'?aiSecText(scope.sectionId,null,true):aiDocTextOpt(true);
  var best={score:null,changes:{}};
  var curText=baseText;
  var rounds=0;
  var target=aiClamp(st.targetScore,50,100);
  var maxR=aiClamp(st.maxRounds,1,5);
  var t0=Date.now();
  aiSetStatus('基线评分中…');
  return aiScore(baseText,{onStatus:aiSetStatus}).then(function(baseReport){
    best.score=baseReport.total;
    var loop=function(){
      if(aiCancelFlag){aiBusy=false;aiGlobalAbort=null;aiStatus='';aiStatusLog=[];aiRenderPanel();return null;}
      if(best.score>=target||rounds>=maxR)return finish(baseReport.total);
      rounds++;
      aiSetStatus('第 '+rounds+'/'+maxR+' 轮优化中…');
      return aiOptimizeSafe(curText,scope,baseReport,aiIssueLines(baseReport),target,{onStatus:aiSetStatus}).then(function(res){
        aiOptDbg.steps.push({kind:'optimize',raw:(res.changes||[]).length,summary:String(res.summary||'').slice(0,60)});
        function normOf(list){return (list||[]).map(aiNormChange).filter(Boolean).filter(function(ch){return scope.mode!=='section'||ch.sectionId===scope.sectionId;});}
        function proceed(changes,res){
          aiOptDbg.steps.push({kind:'norm',got:changes.length});
          if(!changes.length){
            var rawN=(res.changes||[]).length;
            aiOptDbg.steps.push({kind:rawN?'filteredAll':'empty',raw:rawN});
            aiToast(rawN>0?'模型返回 '+rawN+' 条但均未通过（引用不逐字/结构不完整），已停止本轮，可查看面板诊断':(res.fallback?'两次尝试均未产出可用建议，可查看面板诊断':'AI 未返回任何修改建议（可能认为已达标或输出被截断），可查看面板诊断'));
            aiSetStatus('未产生可用的修改建议（第 '+rounds+' 轮），停止。');
            return finish(baseReport.total,null);
          }
          var checked=aiValidateChanges(changes);
          var blockedAny=checked.filter(function(c){return !c.it.validation.ok;});
          if(blockedAny.length){
            var reasons=blockedAny.map(function(c){return c.ch.sectionId+'：'+(c.it.validation.blocked||[]).join('；');}).join(' ｜ ');
            aiOptDbg.steps.push({kind:'blocked',reasons:reasons.slice(0,160)});
            if(!res.fallback&&(res.changes||[]).length){
              // v17.7：引用匹配失败（多为模型粘贴多段/含卡片文本）→ 改用整节替换方式重试一次
              aiOptDbg.steps.push({kind:'blockedRetry'});
              aiSetStatus('第 '+rounds+' 轮：引用匹配失败，改用整节替换方式重试…');
              return aiOptimizeSimple(curText,scope,aiIssueLines(baseReport),target,{onStatus:aiSetStatus}).then(function(res2){
                aiOptDbg.steps.push({kind:'simple',raw:(res2.changes||[]).length,summary:String(res2.summary||'').slice(0,60)});
                return proceed(normOf(res2.changes),res2);
              }).catch(function(e2){
                aiOptDbg.steps.push({kind:'simpleError',error:String(e2&&e2.message||e2).slice(0,120)});
                return proceed([],{changes:[],summary:''});
              });
            }
            aiStatusLog.push('存在结构校验不过的修改（blocked），本轮未采用：'+reasons);
            aiToast('本轮修改未采用：'+reasons.slice(0,120));
            aiSetStatus('');
            return finish(baseReport.total,null);
          }
          var simText;
          if(scope.mode==='section'){
            var ch0=changes.filter(function(x){return x.type!=='suggestion';})[0];
            simText=aiSecText(scope.sectionId,ch0?aiFieldsOf(ch0):null,true);
          }else{
            simText=aiDocTextWith((function(){var pm={};changes.forEach(function(ch){if(ch.type!=='suggestion')pm[ch.sectionId]=aiFieldsOf(ch);});return pm;})(),true);
          }
          aiSetStatus('第 '+rounds+' 轮独立复核中…');
          var chSummary=changes.map(function(c){return c.sectionId+'('+c.type+(c.replaceSection!=null?'整节':c.type==='text'?'×'+c.edits.length:c.type==='table'?'×'+c.rowEdits.length:'')+')';}).join(', ');
          return aiReview(simText,baseText,chSummary,target,{onStatus:aiSetStatus}).then(function(review){
            aiOptDbg.steps.push({kind:'review',score:review.score,verdict:review.verdict});
            var simScore=review.score;
            if(simScore<best.score||review.verdict==='fail'){
              aiStatusLog.push('第 '+rounds+' 轮复核 '+simScore+' 分（'+review.verdict+'）低于/劣于历史最好 '+best.score+'，自动回滚到最好版本（本轮未采用）：'+(review.summary||''));
              aiSetStatus('');
              return finish(baseReport.total,review);
            }
            changes.forEach(function(ch){best.changes[ch.sectionId]=ch;});
            best.score=simScore;
            curText=simText;
            aiStatusLog.push('第 '+rounds+' 轮：复核 '+simScore+' 分（'+review.verdict+'）'+(simScore>=target?'（达标 ✓）':''));
            if(simScore>=target){aiSetStatus('');return finish(baseReport.total,review);}
            return loop();
          });
        }
        var changes=normOf(res.changes);
        if(!changes.length&&(res.changes||[]).length){
          aiOptDbg.steps.push({kind:'fallbackSimple'});
          aiSetStatus('第 '+rounds+' 轮：模型格式不完整，改用整节替换方式重试…');
          return aiOptimizeSimple(curText,scope,aiIssueLines(baseReport),target,{onStatus:aiSetStatus}).then(function(res2){
            aiOptDbg.steps.push({kind:'simple',raw:(res2.changes||[]).length,summary:String(res2.summary||'').slice(0,60)});
            return proceed(normOf(res2.changes),res2);
          }).catch(function(e2){
            aiOptDbg.steps.push({kind:'simpleError',error:String(e2&&e2.message||e2).slice(0,120)});
            return proceed([],{changes:[],summary:''});
          });
        }
        return proceed(changes,res);
      });
    };
    function finish(scoreBefore,review){
      var items=Object.keys(best.changes).map(function(sid){
        var ch=best.changes[sid];
        var it={id:aiUid(),sectionId:sid,sectionTitle:(STATE.framework.find(function(f){return f.id===sid;})||{}).title||sid,type:ch.type,suggestion:ch.type==='suggestion'?ch.suggestion:'',status:'pending',edits:[],rowEdits:[],replaceSection:ch.replaceSection!=null?ch.replaceSection:null,replaceRows:ch.replaceRows||null};
        if(ch.type==='text')it.edits=ch.edits;
        else if(ch.type==='table')it.rowEdits=ch.rowEdits;
        aiValidateChange(it);
        return it;
      });
      var st2=aiState();
      st2.pendingDiffs={id:aiUid(),scoreBefore:aiRound(scoreBefore),scoreAfter:best.score,target:target,rounds:rounds,createdAt:Date.now(),review:review,engineDelta:aiEvalRuleDelta(Object.keys(best.changes).map(function(s){return best.changes[s];})),items:items};
      st2.lastOptDebug=aiOptDbg;
      aiPersist();
      aiBusy=false;
      aiGlobalAbort=null;
      aiStatus='';aiStatusLog=[];
      aiRenderPanel();
      aiToast(items.length?('优化完成：'+scoreBefore+' → '+best.score+' 分（独立复核），共 '+items.length+' 条待确认'):'未产生修改建议（当前已较优或 AI 无可优化项）');
    }
    return loop();
  }).catch(function(e){
    aiBusy=false;
    aiGlobalAbort=null;
    var stDbg=aiState();if(stDbg)stDbg.lastOptDebug={at:Date.now(),error:String((e&&e.message)||e),raw:String(e&&e.raw||'').slice(0,300)};
    if(aiCancelFlag){aiStatus='';aiStatusLog=[];aiRenderPanel();return;}
    aiStatus='';aiRenderPanel();
    var c=aiClassify(e,null,'');
    aiToast('一键优化失败：'+c.message);
  });
}

/* ---------- AI 撰写（v17.15：从产品描述生成整份草稿，逐节确认后写入、版本可回滚） ---------- */
function aiMdToHtml(md){
  // 轻量 Markdown → HTML（供 AI 撰写草稿使用）：段落/标题/列表/表格/代码块/引用/加粗/斜体/行内代码/链接
  var src=String(md==null?'':md).replace(/\r\n?/g,'\n');
  var out=[];
  function escMd(s){return aiEsc(s);}
  function inline(s){
    s=String(s||'');
    s=s.replace(/`([^`]+)`/g,function(m,c){return '<code>'+escMd(c)+'</code>';});
    s=s.replace(/\*\*([^*]+)\*\*/g,function(m,c){return '<strong>'+c+'</strong>';});
    s=s.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g,function(m,p,c){return p+'<em>'+c+'</em>';});
    s=s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g,function(m,t,u){return '<a href="'+escMd(u)+'">'+t+'</a>';});
    return s;
  }
  function tableHtml(rows){
    if(!rows.length)return '';
    var h='<table class="tbl"><thead><tr>'+rows[0].map(function(c){return '<th>'+inline(escMd(c))+'</th>';}).join('')+'</tr></thead><tbody>';
    for(var i=1;i<rows.length;i++)h+='<tr>'+rows[i].map(function(c){return '<td>'+inline(escMd(c))+'</td>';}).join('')+'</tr>';
    return h+'</tbody></table>';
  }
  var lines=src.split('\n'),i=0;
  while(i<lines.length){
    var ln=lines[i];
    if(/^\s*```/.test(ln)){
      var code=[],lang=ln.replace(/^\s*```/,'').trim();
      i++;
      while(i<lines.length&&!/^\s*```/.test(lines[i])){code.push(lines[i]);i++;}
      i++;
      out.push('<pre class="ai-code'+(lang?(' lang-'+escMd(lang)):'')+'"><code>'+escMd(code.join('\n'))+'</code></pre>');
      continue;
    }
    if(/^\s*---+\s*$/.test(ln)){out.push('<hr>');i++;continue;}
    if(/^\s*#{1,4}\s+/.test(ln)){
      var m=ln.match(/^\s*(#{1,4})\s+(.*)$/);
      var lv=m[1].length<=2?3:4;
      out.push('<h'+lv+'>'+inline(escMd(m[2]))+'</h'+lv+'>');
      i++;continue;
    }
    if(/^\s*[-*+]\s+/.test(ln)){
      var items=[],it;
      while(i<lines.length&&(it=lines[i].match(/^\s*[-*+]\s+(.*)$/))){items.push(inline(escMd(it[1])));i++;}
      out.push('<ul>'+items.map(function(x){return '<li>'+x+'</li>';}).join('')+'</ul>');
      continue;
    }
    if(/^\s*\d+[.、]\s+/.test(ln)){
      var oi=[],mi;
      while(i<lines.length&&(mi=lines[i].match(/^\s*\d+[.、]\s+(.*)$/))){oi.push(inline(escMd(mi[1])));i++;}
      out.push('<ol>'+oi.map(function(x){return '<li>'+x+'</li>';}).join('')+'</ol>');
      continue;
    }
    if(/^\s*>\s?/.test(ln)){
      var q=[],qi;
      while(i<lines.length&&(qi=lines[i].match(/^\s*>\s?(.*)$/))){q.push(inline(escMd(qi[1])));i++;}
      out.push('<blockquote>'+q.map(function(x){return '<p>'+x+'</p>';}).join('')+'</blockquote>');
      continue;
    }
    if(ln.indexOf('|')>=0){
      var rows=[],ri;
      while(i<lines.length&&lines[i].indexOf('|')>=0){
        var cells=lines[i].split('|').map(function(c){return c.trim();});
        if(cells.length&&cells[0]==='')cells.shift();
        if(cells.length&&cells[cells.length-1]==='')cells.pop();
        if(!cells.every(function(c){return /^:?-+:?$/.test(c);}))rows.push(cells);
        i++;
      }
      if(rows.length)out.push(tableHtml(rows));
      continue;
    }
    if(ln.trim()===''){i++;continue;}
    var para=[ln.trim()];
    i++;
    while(i<lines.length&&lines[i].trim()!==''&&!/^\s*(#{1,4}\s|[-*+]\s|\d+[.、]\s|>\s?|\s*```)/.test(lines[i])&&lines[i].indexOf('|')<0){
      para.push(lines[i].trim());i++;
    }
    out.push('<p>'+inline(escMd(para.join(' ')))+'</p>');
  }
  return out.join('\n');
}
function aiGenTypeSchema(type){
  var schemas={
    text:{shape:'{"html":"Markdown 格式的章节内容"}',tips:'2-6 个要点；先总述再分点；关键指标给具体数字与判定标准；可用 ##/### 子标题、- 列表、| 表格 组织内容。'},
    table:{shape:'{"rows":[{"cells":["表头1","表头2"]},{"cells":["值1","值2"]}]}',tips:'第一行必须是表头；2-6 行数据；表头按章节用途设计（变更历史：版本/更改内容/作者/日期；定义：术语/定义；埋点：事件/触发条件/参数/上报方式）。'},
    feat:{shape:'{"items":[{"name":"功能点名称","desc":"一句话描述","priority":"P1","status":"草稿"}]}',tips:'5-12 条；name 必填且唯一；priority 只能 P0/P1/P2/P3/P4；status 只能 草稿/评审中/开发中/测试中/已上线；至少 1 条 P0。'},
    accept:{shape:'{"items":[{"text":"验收标准","status":"na"}]}',tips:'4-10 条；每条必须能用是/否判定并尽量带量化指标（如"延迟 ≤ 1.5 秒"）；status 一律 "na"。'},
    users:{shape:'{"items":[{"role":"角色","want":"想要…","soThat":"以便…"}]}',tips:'2-6 条用户故事；role/want/soThat 都必填。'}
  };
  return schemas[type]||schemas.text;
}
function aiGenStyleGuide(style){
  var guides={
    standard:'【模板风格：标准 PRD】全篇遵循：①每个必填节都要有实质内容；②量化目标必须给数字+判定方式；③验收项可"是/否"判定并尽量带指标；④功能需求带优先级 P0-P4 与状态；⑤上线含灰度/回滚/监控。',
    agile:'【模板风格：精简敏捷 PRD】全篇遵循：①聚焦本次迭代要交付的内容，篇幅精简；②范围必须写清"做/不做"（明确排除项防蔓延）；③验收聚焦可量化验收项；④上线计划写发布时间窗/灰度/回滚/监控。',
    hardware:'【模板风格：智能硬件/车规】全篇遵循：①安全优先：功能安全等级、故障降级策略、敏感指令需二次确认；②环境与法规：高低温/湿度/振动/EMC 等环境试验与认证要求（如车规 AEC-Q、CCC）；③接口必须写协议/字段/依赖服务；④量化指标给上下限与测量方式。'
  };
  return guides[style]||'';
}
function aiGenSectionPrompt(sid,desc,fwList,styleGuide){
  var s=STATE.framework.find(function(x){return x.id===sid;});
  if(!s)return null;
  var type=(s.type==='timeline')?'text':s.type;
  var schema=aiGenTypeSchema(type);
  var styleLine=String(styleGuide||'').trim()?('6. 风格约束：'+styleGuide+'\n'):'';
  return {
    system:'你是资深的 PRD（产品需求文档）撰写专家。根据用户提供的产品描述，为指定章节撰写中文内容。\n'
      +'硬性要求：\n'
      +'1. 只输出一个 JSON 对象，不要输出任何多余文字、注释或代码围栏。\n'
      +'2. 内容必须具体、可落地、可验证；可量化的指标必须给出具体数字与判定标准。\n'
      +'3. 严禁编造产品描述中不存在的关键事实；不确定的部分用"（建议：…）"标注，不得写成既定事实。\n'
      +'4. 输出结构必须严格符合：'+schema.shape+'\n'
      +'5. 写作提示：'+schema.tips+'\n'
      +styleLine,
    user:'【产品描述】\n'+desc+'\n\n【全部章节】\n'+fwList+'\n\n【本章节】\n章节 id：'+s.id+'；标题：'+s.title+'；类型：'+(s.type==='timeline'?'text':s.type)+(s.required?'（必填）':'（可选）')+'\n\n按上述要求输出 JSON。'
  };
}
function aiGenNormRows(rows){
  if(!Array.isArray(rows))return null;
  var out=rows.filter(function(r){return r&&Array.isArray(r.cells);}).map(function(r){return {cells:r.cells.map(function(v){return String(v==null?'':v).trim();})};});
  if(!out.length)return null;
  var n=out[0].cells.length;
  if(!n||out.some(function(r){return r.cells.length!==n;}))return null;
  return out;
}
function aiGenNormItems(type,items){
  if(!Array.isArray(items))return null;
  var out=[];
  var prio={'P0':1,'P1':1,'P2':1,'P3':1,'P4':1};
  var sts={'草稿':1,'评审中':1,'开发中':1,'测试中':1,'已上线':1,'':1};
  items.forEach(function(it){
    if(!it)return;
    if(type==='feat'){
      var name=String(it.name==null?'':it.name).trim();
      if(!name)return;
      out.push({name:name,desc:String(it.desc==null?'':it.desc).trim(),priority:(prio[String(it.priority||'P2').toUpperCase()]?String(it.priority).toUpperCase():'P2'),status:(sts[it.status]?it.status:'草稿')});
    }else if(type==='accept'){
      var text=String(it.text==null?'':it.text).trim();
      if(!text)return;
      out.push({text:text,status:'na'});
    }else if(type==='users'){
      var role=String(it.role==null?'':it.role).trim(),want=String(it.want==null?'':it.want).trim(),soThat=String(it.soThat==null?'':it.soThat).trim();
      if(!role&&!want)return;
      out.push({role:role,want:want,soThat:soThat});
    }
  });
  return out.length?out:null;
}
function aiGenSection(sid,desc,opts){
  var s=STATE.framework.find(function(x){return x.id===sid;});
  if(!s)return Promise.resolve(null);
  var type=(s.type==='timeline')?'text':s.type;
  var fwList=STATE.framework.map(function(x){return x.id+'「'+x.title+'」'+(x.type==='timeline'?'text':x.type);}).join('；');
  var p=aiGenSectionPrompt(sid,desc,fwList,opts&&opts.styleGuide);
  return aiAskJSON([{role:'system',content:p.system},{role:'user',content:p.user}],{temperature:0.5,onStatus:opts&&opts.onStatus,onDelta:opts&&opts.onDelta,timeout:120000,maxTokens:2500}).then(function(resp){
    if(!resp||typeof resp!=='object')return null;
    var ch=null;
    if(type==='text'){
      var md=String(resp.html==null?'':resp.html).trim();
      if(!md)return null;
      var html=aiSanitizeHtml(aiMdToHtml(md));
      if(!aiStripTags(html).trim())return null;
      ch={sectionId:sid,type:'text',secType:s.type,replaceSection:html};
    }else if(type==='table'){
      var rows=aiGenNormRows(resp.rows);
      if(!rows)return null;
      ch={sectionId:sid,type:'table',secType:s.type,replaceRows:rows};
    }else{
      var items=aiGenNormItems(type,resp.items);
      if(!items)return null;
      ch={sectionId:sid,type:'items',secType:s.type,replaceItems:items};
    }
    return ch;
  });
}
function aiGenStart(){
  if(aiBusy){aiToast('AI 正在处理中，请稍候');return;}
  var nm=document.getElementById('aiGenName');
  var descEl=document.getElementById('aiGenDesc');
  var fwSel=document.getElementById('aiGenFw');
  var styleSel=document.getElementById('aiGenStyle');
  var stLine=document.getElementById('aiGenStatus');
  var name=(nm&&nm.value||'').trim()||'AI 草稿';
  var text=(descEl&&descEl.value||'').trim();
  if(text.length<10){aiToast('请填写更完整的产品/功能描述（至少 10 个字）');if(stLine)stLine.textContent='请先补充产品描述。';return;}
  var st0=aiGetSettings();
  if(!String(st0.apiKey||'').trim()||!String(st0.baseUrl||'').trim()){aiToast('请先在 设置→AI 中配置 API Key 与地址');aiOpenSettingsTab();return;}
  aiBusy=true;
  aiGlobalAbort=new AbortController();
  aiCancelFlag=false;
  aiStatus='';aiStatusLog=[];
  var styleGuide=aiGenStyleGuide(styleSel&&styleSel.value||'');
  var dbg={at:Date.now(),name:name,fwId:(fwSel&&fwSel.value)||'default',style:(styleSel&&styleSel.value)||'',sections:0,ok:0,failed:[],steps:[]};
  function finishModal(){try{closeModal('aiGenModal');}catch(e){var mm=document.getElementById('aiGenModal');if(mm)mm.classList.remove('open');}}
  try{createProject(name,fwSel?fwSel.value:null);}catch(e){aiBusy=false;aiToast('创建项目失败：'+(e&&e.message||e));return;}
  finishModal();
  aiSetStatus('AI 撰写中：正在逐节生成草稿…');
  var secs=STATE.framework.slice();
  var changes=[];
  var idx=0;
  function next(){
    if(aiCancelFlag){aiBusy=false;aiGlobalAbort=null;aiStatus='';aiStatusLog=[];aiRenderPanel();aiToast('已停止 AI 撰写');return null;}
    if(idx>=secs.length)return finish();
    var s=secs[idx++];
    aiSetStatus('正在撰写第 '+idx+'/'+secs.length+' 节：'+s.title+'…');
    return aiGenSection(s.id,text,{onStatus:aiSetStatus,styleGuide:styleGuide}).then(function(ch){
      if(ch){changes.push(ch);dbg.ok++;dbg.sections++;aiStatusLog.push('✓ '+s.title+'：已生成');}
      else{dbg.sections++;dbg.failed.push(s.title);aiStatusLog.push('— '+s.title+'：本次未生成内容（可稍后手动补写或用一键优化）');}
      return next();
    }).catch(function(e){
      dbg.sections++;dbg.failed.push(s.title+(e&&e.kind==='canceled'?'':'：'+String(e&&e.message||e).slice(0,60)));
      if(aiCancelFlag){aiBusy=false;aiGlobalAbort=null;aiStatus='';aiStatusLog=[];aiRenderPanel();aiToast('已停止 AI 撰写');return null;}
      return next();
    });
  }
  function finish(){
    dbg.finishedAt=Date.now();
    var st=aiState();
    var items=[];
    changes.forEach(function(ch){
      var it={id:aiUid(),sectionId:ch.sectionId,sectionTitle:(STATE.framework.find(function(f){return f.id===ch.sectionId;})||{}).title||ch.sectionId,type:ch.type,sectionType:ch.secType||ch.type,status:'pending'};
      if(ch.type==='text')it.replaceSection=ch.replaceSection;
      else if(ch.type==='table')it.replaceRows=ch.replaceRows;
      else it.replaceItems=ch.replaceItems;
      aiValidateChange(it);
      items.push(it);
    });
    st.pendingDiffs={id:aiUid(),gen:true,genLabel:'AI 草稿',scoreBefore:null,scoreAfter:null,target:null,rounds:0,createdAt:Date.now(),review:null,engineDelta:null,items:items};
    st.lastGenDebug=dbg;
    aiPersist();
    aiBusy=false;
    aiGlobalAbort=null;
    aiStatus='';aiStatusLog=[];
    aiRenderPanel();
    aiToast(items.length?('AI 草稿生成完成：'+items.length+' 节待确认（逐条接受后写入正文）'):'AI 未能生成内容，请检查 API Key/模型或补充产品描述后重试');
  }
  return next();
}
function aiOpenGenModal(){
  if(!String(aiGetSettings().apiKey||'').trim()){aiToast('请先在 设置→AI 中配置 API Key');aiOpenSettingsTab();return;}
  var st=aiState();
  if(st&&st.pendingDiffs&&st.pendingDiffs.items&&st.pendingDiffs.items.length&&!st.pendingDiffs.gen){
    aiToast('有未确认的修改待处理，请先在 AI 面板完成确认');return;
  }
  var fwSel=document.getElementById('aiGenFw');
  if(fwSel){
    var opts=(STATE.frameworkPresets||[]).map(function(p){return '<option value="'+aiEsc(p.id)+'">'+aiEsc(p.name)+'</option>';}).join('');
    var cp=currentProj();
    if(cp)opts+='<option value=""'+(opts?'':' selected')+'>当前框架：'+aiEsc(cp.name)+'</option>';
    fwSel.innerHTML=opts;
  }
  var descEl=document.getElementById('aiGenDesc');if(descEl)descEl.value='';
  var nmEl=document.getElementById('aiGenName');if(nmEl)nmEl.value='';
  var stLine=document.getElementById('aiGenStatus');if(stLine)stLine.textContent='';
  try{openModal('aiGenModal');}catch(e){var mm=document.getElementById('aiGenModal');if(mm)mm.classList.add('open');}
}

/* ---------- Diff 确认（v17.9：逐条点击即写入，可单条撤销） ---------- */
function aiApplyDiffItemNow(it){
  var entries=[];
  if(it.type==='text'){
    var c=DATA[it.sectionId];if(!c)return null;
    if(it.replaceSection!=null){
      c.html=it.replaceSection;
      entries.push({kind:'section',oldHtml:(it.oldFields&&it.oldFields.html)||'',newHtml:it.replaceSection});
    }else{
      var r=aiApplyEdits(String(c.html||''),it.edits||[]);
      if(r.results.some(function(x){return !x.ok;}))return null;
      c.html=r.html;
      entries=r.results.filter(function(x){return x.ok&&x.oldHtml;}).map(function(x){return {kind:'block',blockOld:x.oldHtml,blockNew:x.newHtml,anchor:x.anchor||''};});
    }
  }else if(it.type==='table'){
    var c2=DATA[it.sectionId];if(!c2)return null;
    if(it.replaceRows){
      c2.rows=it.replaceRows;
      entries.push({kind:'rows',oldRows:(it.oldFields&&it.oldFields.rows)||[],newRows:it.replaceRows});
    }else{
      var re=aiRowExec(c2.rows||[],it.rowEdits||[]);
      if(re.results.some(function(x){return !x.ok;}))return null;
      c2.rows=re.rows;
      entries=re.results.filter(function(x){return x.ok;}).map(function(x){return {kind:'row',rowOp:(x.edit&&x.edit.op)||'',match:(x.edit&&x.edit.match)||'',rowOld:x.rowOld,rowNew:x.rowNew,anchor:x.anchor||''};});
    }
  }else if(it.type==='items'){
    var c3=DATA[it.sectionId];if(!c3)return null;
    entries.push({kind:'items',oldItems:aiDeep(c3.items||[]),newItems:aiDeep(it.replaceItems||[])});
    c3.items=aiDeep(it.replaceItems||[]);
  }
  return entries;
}
function aiMergeApplied(pd,it,entries){
  if(!entries||!entries.length)return;
  if(!pd.appliedPatches)pd.appliedPatches={};
  (pd.appliedPatches[it.sectionId]=pd.appliedPatches[it.sectionId]||[]).push.apply(pd.appliedPatches[it.sectionId],entries);
}
function aiDecideDiff(id,status){
  var st=aiState();var pd=st.pendingDiffs;if(!pd)return;
  var it=pd.items.filter(function(x){return x.id===id;})[0];
  if(!it)return;
  if(status==='accepted'){
    if(it.type==='suggestion'){it.status='accepted';aiPersist();aiRenderPanel();if(pd.items.every(function(x){return x.status!=='pending';}))aiFinalizePending();return;}
    if(!(it.validation&&it.validation.ok)){aiToast('该条校验不过，无法接受（可修改或拒绝）');return;}
    var entries=aiApplyDiffItemNow(it);
    if(!entries){aiToast('应用失败：内容已变化或无法匹配，请重新优化');return;}
    aiMergeApplied(pd,it,entries);
    it.appliedEntries=entries;
    it.status='accepted';
    aiPersist();
    try{render();refreshHealthUI();}catch(e){}
    var remain=pd.items.filter(function(x){return x.status==='pending';}).length;
    aiToast('已应用「'+it.sectionTitle+'」'+(remain?('，还剩 '+remain+' 条待确认'):''));
  }else{
    it.status=status;
    aiPersist();
  }
  aiRenderPanel();
  if(pd.items.every(function(x){return x.status!=='pending';}))aiFinalizePending();
}
function aiSaveModifiedDiff(id,ei){
  var st=aiState();var pd=st.pendingDiffs;if(!pd)return;
  var it=pd.items.filter(function(x){return x.id===id;})[0];
  if(!it)return;
  var ta=document.getElementById('aiModify-'+id+(ei!=null?'_'+ei:''));
  if(!ta)return;
  var v=ta.value;
  if(it.type==='text'){
    var html=v.split(/\n{2,}/).map(function(p){return '<p>'+aiEsc(p.replace(/\n/g,' '))+'</p>';}).join('');
    if(ei!=null&&it.edits[ei])it.edits[ei].newHtml=html;
  }else if(it.type==='table'){
    if(ei!=null&&it.rowEdits[ei])it.rowEdits[ei].cells=v.split('|').map(function(c){return c.trim();});
  }else{it.suggestion=v;}
  aiValidateChange(it);
  if(it.type!=='suggestion'){
    if(!(it.validation&&it.validation.ok)){aiToast('修改后校验不过：'+(it.validation.blocked||[]).join('；'));aiRenderPanel();return;}
    var entries=aiApplyDiffItemNow(it);
    if(!entries){aiToast('应用失败：内容已变化或无法匹配');return;}
    aiMergeApplied(pd,it,entries);
    it.appliedEntries=entries;
  }
  it.status='modified';
  aiPersist();
  try{render();refreshHealthUI();}catch(e){}
  aiRenderPanel();
  aiToast('已应用修改后的「'+it.sectionTitle+'」');
  if(pd.items.every(function(x){return x.status!=='pending';}))aiFinalizePending();
}
function aiAcceptAll(){
  var st=aiState();var pd=st.pendingDiffs;if(!pd)return;
  var ok=false;
  pd.items.forEach(function(it){
    if(it.status==='pending'&&it.validation&&it.validation.ok){
      if(it.type==='suggestion'){it.status='accepted';ok=true;return;}
      var entries=aiApplyDiffItemNow(it);
      if(entries){aiMergeApplied(pd,it,entries);it.appliedEntries=entries;it.status='accepted';ok=true;}
    }
  });
  if(!ok){aiToast('存在校验不过的修改，无法全部接受，请逐条处理');aiRenderPanel();return;}
  aiPersist();
  try{render();refreshHealthUI();}catch(e){}
  aiFinalizePending();
}
function aiUndoDiffItem(id){
  var st=aiState();var pd=st.pendingDiffs;if(!pd)return;
  var it=pd.items.filter(function(x){return x.id===id;})[0];
  if(!it||(it.status!=='accepted'&&it.status!=='modified'))return;
  var entries=it.appliedEntries;
  if(entries&&entries.length){
    var c=DATA[it.sectionId];if(c){
      var f=aiReverseEntries({html:c.html,rows:c.rows?aiDeep(c.rows):null,items:c.items?aiDeep(c.items):null},entries);
      if(f.html!=null)c.html=f.html;
      if(f.rows)c.rows=f.rows;
      if(f.items!=null)c.items=f.items;
    }
    var ap=pd.appliedPatches;
    if(ap&&ap[it.sectionId]){
      var keys=entries.map(function(e){return JSON.stringify(e);});
      ap[it.sectionId]=ap[it.sectionId].filter(function(e){return keys.indexOf(JSON.stringify(e))<0;});
      if(!ap[it.sectionId].length)delete ap[it.sectionId];
    }
  }
  it.appliedEntries=null;
  it.status='pending';
  aiPersist();
  try{render();refreshHealthUI();}catch(e){}
  aiRenderPanel();
  aiToast('已撤销「'+it.sectionTitle+'」的修改（恢复原文）');
}
function aiFinalizePending(){
  var st=aiState();var pd=st.pendingDiffs;if(!pd)return;
  var deferred=pd.items.filter(function(i){return i.status==='deferred'||i.status==='pending';});
  if(deferred.length){aiToast('还有 '+deferred.length+' 条暂缓/未处理项，处理完后再归档');aiRenderPanel();return;}
  var accepted=pd.items.filter(function(i){return i.status==='accepted'||i.status==='modified';});
  if(!accepted.length){
    st.pendingDiffs=null;aiPersist();aiRenderPanel();
    aiToast('本轮修改全部拒绝，未产生新版本');
    return;
  }
  var patches=pd.appliedPatches||{};
  var totalEntries=Object.keys(patches).reduce(function(a,s){return a+patches[s].length;},0);
  if(!totalEntries){
    st.pendingDiffs=null;aiPersist();aiRenderPanel();
    aiToast('本轮仅有建议类修改（无自动写入内容），已归档，未产生新版本');
    return;
  }
  var kind=pd.gen?'ai':((pd.scoreAfter!=null&&pd.scoreAfter>=pd.target)?'final':'ai');
  var vs=st.versions||(st.versions=[]);
  var label=pd.genLabel||aiVersionLabel(kind,kind==='ai'?vs.filter(function(v){return v.kind==='ai';}).length+1:1);
  aiCreateVersion(kind,label,patches,pd.scoreBefore,pd.scoreAfter,{applied:true,transform:!!pd.gen});
  st.pendingDiffs=null;
  aiPersist();
  try{render();refreshHealthUI();}catch(e){}
  aiRenderPanel();
  aiToast('已归档为「'+label+'」'+(kind==='final'?'（达到目标分 '+pd.target+'）':''));
}

/* ---------- 忽略 / 已订正 ---------- */
function aiToggleIgnore(key,corrected){
  var st=aiState();var arr=st.ignoredAiIssues||(st.ignoredAiIssues=[]);
  var idx=arr.findIndex(function(x){return x.key===key;});
  if(idx>=0){arr.splice(idx,1);aiToast('已恢复该问题');}
  else{arr.push({key:key,corrected:!!corrected,at:Date.now()});aiToast(corrected?'已标记为已订正':'已忽略');}
  aiPersist();aiRenderPanel();
}

/* ---------- 设置页 ---------- */
function aiOpenSettingsTab(){
  try{openSettings('ai');}catch(e){try{openModal('settingsModal');setSettingsTab('ai');}catch(e2){}}
}
function aiReadForm(){
  var s=aiGetSettings();
  var g=function(id){var el=document.getElementById(id);return el?el.value.trim():'';};
  var key=g('aiKey');
  var out={provider:g('aiProvider')||s.provider,baseUrl:g('aiBaseUrl')||s.baseUrl,model:g('aiModel')||s.model,apiKey:key||s.apiKey,targetScore:aiClamp(+(g('aiTarget')||s.targetScore),50,100),maxRounds:aiClamp(+(g('aiRounds')||s.maxRounds),1,5),dims:{}};
  out.reviewModel=g('aiReviewModel')||s.reviewModel;
  Object.keys(DIM_META).forEach(function(k){
    var en=document.getElementById('aiDimOn-'+k);
    var w=document.getElementById('aiDimW-'+k);
    var cur=s.dims[k]||{weight:10,enabled:true};
    out.dims[k]={enabled:en?en.checked:cur.enabled,weight:aiClamp(w?+(w.value||cur.weight):cur.weight,1,100)};
  });
  return out;
}
function aiSaveForm(){
  var s=aiReadForm();
  if(aiSaveSettings(s)){aiToast('AI 设置已保存（Key 仅存本机浏览器，不随备份导出）');aiRenderPanel();}
}
function aiTestConn(){
  var s=aiReadForm();
  if(!String(s.apiKey||'').trim()||!String(s.baseUrl||'').trim()){aiToast('请先填写 API Key 与地址');return;}
  var line=document.getElementById('aiConnStatus');
  if(line)line.textContent='正在测试连接…';
  var base=aiNormBase(s.baseUrl);
  var ctrl=new AbortController();
  var timer=setTimeout(function(){ctrl.abort();},20000);
  fetch(base+'/models',{headers:{'Authorization':'Bearer '+String(s.apiKey).trim()},signal:ctrl.signal}).then(function(resp){
    clearTimeout(timer);
    if(resp.ok){
      if(line)line.textContent='✓ 连接成功：Key 有效，可开始使用（若后续调用报跨域，说明该服务商对浏览器直连不稳定）。';
      aiToast('连接成功');
    }else{
      var c=aiClassify(null,resp,'');
      if(line)line.textContent='✗ '+c.message;
      aiToast('连接失败：'+c.message);
    }
  }).catch(function(e){
    clearTimeout(timer);
    var c=aiClassify(e,null,'');
    if(line)line.textContent='✗ '+c.message;
    aiToast('连接失败：'+c.message);
  });
}
function aiRenderTab(){
  var el=document.getElementById('tabAI');if(!el)return;
  var s=aiGetSettings();
  var keyMask=s.apiKey?(s.apiKey.length>6?s.apiKey.slice(0,3)+'••••••'+s.apiKey.slice(-2):'••••••'):'';
  var dimsHtml=Object.keys(DIM_META).map(function(k){
    var d=s.dims[k]||{weight:10,enabled:true};
    return '<div class="ai-dim-row"><label class="ai-dim-on"><input type="checkbox" id="aiDimOn-'+k+'"'+(d.enabled?' checked':'')+'>'+DIM_META[k].label+'</label><span class="muted">权重</span><input type="number" id="aiDimW-'+k+'" min="1" max="100" step="1" value="'+(d.weight||10)+'" style="width:64px"></div>';
  }).join('');
  el.innerHTML='<div class="muted" style="margin-bottom:10px">AI 深度体检（与红黄绿规则引擎并列，不覆盖）。Key 仅存本机浏览器，不进备份/导出/日志；公开分享的链接不会携带你的 Key。</div>'
    +'<div class="field"><label>服务商</label><select id="aiProvider">'+[['deepseek','DeepSeek'],['openai','OpenAI'],['custom','自定义']].map(function(o){return '<option value="'+o[0]+'"'+(s.provider===o[0]?' selected':'')+'>'+o[1]+'</option>';}).join('')+'</select></div>'
    +'<div class="field"><label>Base URL（OpenAI 兼容）</label><input id="aiBaseUrl" value="'+aiEsc(s.baseUrl)+'" placeholder="https://api.deepseek.com/v1"></div>'
    +'<div class="field"><label>模型</label><input id="aiModel" value="'+aiEsc(s.model)+'" placeholder="deepseek-chat" list="aiModelList"><datalist id="aiModelList"><option value="deepseek-chat"><option value="deepseek-reasoner"></datalist></div>'
    +'<div class="field"><label>复检模型（可选，留空=与主模型相同）</label><input id="aiReviewModel" value="'+aiEsc(s.reviewModel||'')+'" placeholder="deepseek-chat"></div>'
    +'<div class="field"><label>API Key</label><input id="aiKey" type="password" placeholder="'+(keyMask?('已保存 '+keyMask+'（输入新值将覆盖）'):'sk-...')+'"><div class="muted">'+ (keyMask?'当前 Key：'+aiEsc(keyMask):'尚未配置 Key') +'</div></div>'
    +'<div class="ai-dim-grid"><div class="ai-dim-grid-t"><span>评分维度</span><span>权重（可调，总分会按权重加权）</span></div>'+dimsHtml+'</div>'
    +'<div class="field"><label>目标分（一键优化达标线）</label><input id="aiTarget" type="number" min="50" max="100" value="'+s.targetScore+'"></div>'
    +'<div class="field"><label>最大优化轮数（护栏：2-5，超出自动停止）</label><input id="aiRounds" type="number" min="1" max="5" value="'+s.maxRounds+'"></div>'
    +'<div class="row-act"><button data-ai="savesettings">保存设置</button><button data-ai="testconn">测试连接</button></div>'
    +'<div id="aiConnStatus" class="muted" style="margin-top:6px"></div>';
}

/* ---------- 面板渲染 ---------- */
function aiSeverityTag(sv){
  var map={high:['lv-red','严重'],medium:['lv-yellow','中'],low:['lv-green','轻']};
  var m=map[sv]||map.medium;
  return '<span class="pill-st '+m[0]+'">'+m[1]+'</span>';
}
function aiPreview(fields){
  if(!fields)return '—';
  if('html' in fields)return aiHtmlToText(fields.html).slice(0,220);
  if('rows' in fields)return (fields.rows||[]).map(function(r){return '| '+((r.cells||[]).join(' | '))+' |';}).slice(0,6).join('\n');
  if('items' in fields)return (fields.items||[]).map(function(i){return i?(i.name!=null?(i.name+' '+(i.desc||'')):(i.role?('作为'+i.role+'我希望'+(i.want||'')+'以便'+(i.soThat||'')):(i.text||''))):'';}).slice(0,8).join('\n');
  return '';
}
function aiRenderPanel(){
  var body=document.getElementById('aiBody');if(!body)return;
  var proj=currentProj();
  if(!proj){
    var recHtml=aiRecoverOffer?'<div class="ai-hint">⚠ 检测到本地自动备份（'+aiRecoverOffer.count+' 个项目），当前主存储为空<button data-ai="recover-backup">恢复备份</button></div>':'';
    body.innerHTML='<div class="empty">请先创建或打开一个项目，再使用 AI 助手。</div>'
      +'<div class="ai-diff-all"><button class="ai-btn primary" data-ai="gen" title="输入产品描述，AI 新建项目并逐节生成草稿">✍ AI 撰写草稿（新建项目）</button></div>'
      +recHtml;
    return;
  }
  var st=aiState();
  var eng=HEALTH&&HEALTH.metrics?'规则引擎：'+HEALTH.metrics.completion+'%':'';
  var hint=aiAlignHint();
  var html='<div class="ai-tools"><button class="ai-btn primary" data-ai="score">AI 深度体检</button><button class="ai-btn" data-ai="optimize">一键优化</button><button class="ai-btn" data-ai="align">结构对齐</button><button class="ai-btn" data-ai="gen" title="输入产品描述，AI 新建项目并逐节生成草稿">✍ AI 撰写</button><span class="ai-engine muted">'+eng+'</span></div>';
  if(hint.level!=='low')html+='<div class="ai-hint">⚠ '+hint.reasons.map(function(r){return aiEsc(r);}).join('；')+'<button data-ai="align">执行对齐</button></div>';
  if(aiBusy||aiStatus)html+='<div class="ai-stop-row"><button class="ai-btn danger" data-ai="stop" title="中断当前 AI 任务">■ 停止</button><span class="muted" style="font-size:11.5px">停止后本轮结果不写入，可随时重试</span></div>';
  if(aiStatus)html+='<div class="ai-status">'+aiEsc(aiStatus)+'</div>';
  if(st.lastOptDebug)html+='<div class="ai-sec"><div class="ai-sec-h">最近一次优化诊断 <button data-ai="clearoptdbg">清除</button></div><pre class="ai-dbg">'+aiEsc(JSON.stringify(st.lastOptDebug,null,1).slice(0,900))+'</pre></div>';
  if(st.lastGenDebug)html+='<div class="ai-sec"><div class="ai-sec-h">最近一次撰写诊断 <button data-ai="cleargendbg">清除</button></div><pre class="ai-dbg">'+aiEsc(JSON.stringify(st.lastGenDebug,null,1).slice(0,900))+'</pre></div>';
  if(st.lastReport){
    var r=st.lastReport;
    var ds=new Date(r.generatedAt).toLocaleString();
    html+='<div class="ai-sec"><div class="ai-sec-h">AI 深度体检 <span class="muted">'+ds+(r.cached?' · 内容未变化，使用缓存':'')+'</span></div>'
      +'<div class="ai-total">总分 <b class="'+(r.total>=85?'lv-green':r.total>=60?'lv-yellow':'lv-red')+'">'+r.total+'</b><small>/100</small></div>'
      +(r.summary?'<div class="ai-sum">'+aiEsc(r.summary)+'</div>':'');
    r.dimensions.forEach(function(d){
      var open=aiUi.dimOpen[d.id];
      html+='<div class="ai-dim"><div class="ai-dim-top" data-ai="dimtoggle" data-did="'+aiEsc(d.id)+'"><span>'+aiEsc(d.name)+' <small class="muted">w'+(d.weight||0)+'</small></span><span class="ai-dim-score">'+d.score+'</span></div>'
        +'<div class="ai-bar"><i style="width:'+aiClamp(d.score,0,100)+'%"></i></div>';
      if(open){
        if(d.note)html+='<div class="ai-dim-note">'+aiEsc(d.note)+'</div>';
        var iss=d.issues||[];
        html+='<div class="ai-iss">'+(iss.length?iss.map(function(it){
          var ignored=st.ignoredAiIssues&&st.ignoredAiIssues.some(function(x){return x.key===it.id;});
          return '<div class="ai-iss-item'+(ignored?' ignored':'')+'">'
            +'<div class="ai-iss-top">'+aiSeverityTag(it.severity)+'<span class="muted">'+(it.sectionTitle?aiEsc(it.sectionTitle):'全文')+'</span></div>'
            +'<div class="ai-iss-reason">'+aiEsc(it.reason)+'</div>'
            +(it.lowConfidence?'<div class="ai-iss-warn">⚠ 引用未匹配原文，疑似幻觉，请人工核对</div>':'')
            +(it.quote?'<div class="ai-iss-quote">引用：'+aiEsc(it.quote)+'</div>':'')
            +(it.suggestion?'<div class="ai-iss-adv">建议：'+aiEsc(it.suggestion)+'</div>':'')
            +'<div class="ai-iss-act">'+(it.sectionId?'<button data-ai="jump" data-sid="'+aiEsc(it.sectionId)+'">定位</button>':'')
            +(ignored?'<button data-ai="unignore" data-key="'+aiEsc(it.id)+'">恢复</button>'
              :'<button data-ai="ignore" data-key="'+aiEsc(it.id)+'">忽略</button><button data-ai="correct" data-key="'+aiEsc(it.id)+'">已订正</button>')
            +'</div></div>';
        }).join(''):'<div class="muted">该维度无明显问题</div>')+'</div>';
      }
      html+='</div>';
    });
    html+='</div>';
  }else{
    html+='<div class="ai-sec"><div class="muted">尚未运行 AI 深度体检。点击上方按钮，AI 将按 6 个维度（完整性/清晰度/一致性/可执行性/可验证性/风险）评分并逐条诊断。</div></div>';
  }
  if(st.pendingDiffs&&st.pendingDiffs.items&&st.pendingDiffs.items.length){
    var pd=st.pendingDiffs;
    html+='<div class="ai-sec warn"><div class="ai-sec-h">'+(pd.gen?'AI 撰写草稿（'+pd.items.length+' 节待确认）<span class="muted">逐条接受后写入正文，可回滚</span>':'待确认修改（'+pd.items.length+' 条）<span class="muted">'+pd.scoreBefore+' → '+pd.scoreAfter+' 分 · 目标 '+pd.target+'</span>')+'</div>';
    if(pd.review)html+='<div class="ai-review">独立复核：<b>'+pd.review.score+'</b> 分 · '+(pd.review.verdict==='pass'?'通过':pd.review.verdict==='fail'?'不通过':'需改进')+(pd.review.summary?' · '+aiEsc(pd.review.summary):'')+'</div>';
    if(pd.engineDelta&&pd.engineDelta.riskBefore!=null)html+='<div class="ai-engine-delta">规则引擎：风险 '+pd.engineDelta.riskBefore+'→'+pd.engineDelta.riskAfter+' · 完成度 '+pd.engineDelta.completionBefore+'%→'+pd.engineDelta.completionAfter+'%</div>';
    html+='<div class="ai-diff-all"><button class="ai-btn primary" data-ai="acceptall">全部接受并写入</button></div>';
    pd.items.forEach(function(it){
      var stT=it.status;
      var stLabel=stT==='pending'?'待确认':(stT==='accepted'?'已接受':stT==='modified'?'已修改':stT==='rejected'?'已拒绝':'已暂缓');
      var v=it.validation||{ok:true,warnings:[],blocked:[]};
      var vBadge=v.ok?'<span class="ai-vbadge ok">✓ 校验通过</span>':(v.blocked.length?'<span class="ai-vbadge bad">⛔ '+v.blocked.length+' 项校验不过</span>':'');
      var vWarn=v.warnings&&v.warnings.length?'<div class="ai-vwarn">⚠ '+v.warnings.map(function(x){return aiEsc(x);}).join('；')+'</div>':'';
      html+='<div class="ai-diff'+(stT==='rejected'?' rejected':'')+(stT==='accepted'||stT==='modified'?' accepted':'')+'">'
        +'<div class="ai-diff-h"><b>'+aiEsc(it.sectionTitle)+'</b><span class="muted">'+it.type+' · '+stLabel+'</span>'+vBadge+'</div>'+vWarn;
      if(it.type==='suggestion'){
        html+='<div class="ai-diff-sug">建议：'+aiEsc(it.suggestion)+'</div><div class="muted" style="font-size:12px">该类内容（清单/用户故事/小卡片）不做自动写入，请人工处理。</div>';
      }else{
        if(it.replaceSection!=null){
          html+='<div class="ai-block"><div class="ai-diff-old"><b>原</b><pre class="ai-jump" data-ai="jumpblock" data-sid="'+aiEsc(it.sectionId)+'" data-match="'+aiEsc(aiNormText(aiHtmlToText((it.oldFields&&it.oldFields.html)||'')).slice(0,160))+'" title="点击跳转原文">'+aiEsc(aiHtmlToText((it.oldFields&&it.oldFields.html)||''))+'</pre></div>'
            +'<div class="ai-diff-new"><b>改</b><pre>'+aiEsc(aiHtmlToText(it.replaceSection))+'</pre></div></div>';
        }else if(it.replaceRows){
          var rowTxt0=function(r){return r?'| '+((r.cells||[]).join(' | '))+' |':'';};
          html+='<div class="ai-block"><div class="ai-diff-old"><b>原</b><pre class="ai-jump" data-ai="jumpblock" data-sid="'+aiEsc(it.sectionId)+'" data-match="'+aiEsc(it.replaceRows&&it.replaceRows[0]?String(it.replaceRows[0].cells[0]||'').slice(0,60):'')+'" title="点击跳转原文">'+aiEsc(((it.oldFields&&it.oldFields.rows)||[]).map(rowTxt0).join('\n'))+'</pre></div>'
            +'<div class="ai-diff-new"><b>改</b><pre>'+aiEsc((it.replaceRows||[]).map(rowTxt0).join('\n'))+'</pre></div></div>';
        }else if(it.replaceItems){
          var itemTxt0=function(i){return i?((i.name!=null)?(i.name+' '+(i.desc||'')+' '+(i.priority||'')+' '+(i.status||'')):(i.role?('作为'+i.role+'我希望'+(i.want||'')+'以便'+(i.soThat||'')):(i.text||''))):'';};
          html+='<div class="ai-block"><div class="ai-diff-old"><b>原</b><pre>'+aiEsc(((it.oldFields&&it.oldFields.items)||[]).map(itemTxt0).join('\n')||'（空）')+'</pre></div>'
            +'<div class="ai-diff-new"><b>改</b><pre>'+aiEsc((it.replaceItems||[]).map(itemTxt0).join('\n'))+'</pre></div></div>';
        }else{
        var blks=it.type==='text'?(it.blocks||[]):[];
        var rws=it.type==='table'?(it.rows||[]):[];
        blks.forEach(function(b,bi){
          var mk=it.id+'_'+bi;
          html+='<div class="ai-block"><div class="ai-diff-old"><b>原</b><pre class="ai-jump" data-ai="jumpblock" data-sid="'+aiEsc(it.sectionId)+'" data-match="'+aiEsc(aiNormText(aiHtmlToText(b.blockOld)).slice(0,160))+'" title="点击跳转原文">'+aiEsc(aiHtmlToText(b.blockOld))+'</pre></div>'
            +'<div class="ai-diff-new"><b>改</b><pre>'+aiEsc(aiHtmlToText(b.blockNew))+'</pre></div>';
          if(aiUi.modifyOpen[mk]){
            html+='<textarea id="aiModify-'+aiEsc(it.id)+'_'+bi+'" rows="4" style="width:100%;box-sizing:border-box">'+aiEsc(aiHtmlToText(b.blockNew))+'</textarea>'
              +'<div><button class="ai-btn primary" data-ai="modify-save" data-did="'+aiEsc(it.id)+'" data-ei="'+bi+'">保存修改</button></div>';
          }
          html+='</div>';
        });
        rws.forEach(function(b,bi){
          var mk=it.id+'_'+bi;
          var rowTxt=function(r){return r?(r.cells||[]).join(' | '):'（该行被删除）';};
          html+='<div class="ai-block"><div class="ai-diff-old"><b>原</b><pre class="ai-jump" data-ai="jumpblock" data-sid="'+aiEsc(it.sectionId)+'" data-match="'+aiEsc(b.rowOld&&b.rowOld.cells&&b.rowOld.cells[0]?String(b.rowOld.cells[0]).slice(0,60):'')+'" title="点击跳转原文">'+aiEsc(rowTxt(b.rowOld))+'</pre></div>'
            +'<div class="ai-diff-new"><b>改</b><pre>'+aiEsc(rowTxt(b.rowNew))+'</pre></div>';
          if(aiUi.modifyOpen[mk]){
            html+='<textarea id="aiModify-'+aiEsc(it.id)+'_'+bi+'" rows="2" style="width:100%;box-sizing:border-box">'+aiEsc(b.rowNew?(b.rowNew.cells||[]).join('|'):'')+'</textarea>'
              +'<div><button class="ai-btn primary" data-ai="modify-save" data-did="'+aiEsc(it.id)+'" data-ei="'+bi+'">保存修改</button></div>';
          }
          html+='</div>';
        });
        }
      }
      html+='<div class="ai-diff-act">'
        +(stT==='pending'||stT==='deferred'?(v.ok?'<button class="ai-btn primary" data-ai="accept" data-did="'+aiEsc(it.id)+'">接受</button>':'<button class="ai-btn primary" disabled title="校验不过的修改需先修改或拒绝">接受</button>'):'')
        +(stT==='pending'?'<button data-ai="modify" data-did="'+aiEsc(it.id)+'">修改</button>':'')
        +(stT==='pending'?'<button data-ai="reject" data-did="'+aiEsc(it.id)+'">拒绝</button>':'')
        +(stT==='pending'?'<button data-ai="defer" data-did="'+aiEsc(it.id)+'">暂缓</button>':'')
        +(stT==='accepted'||stT==='modified'?'<button data-ai="undo-diff" data-did="'+aiEsc(it.id)+'">撤销</button>':'')
        +'</div>';
      html+='</div>';
    });
    html+='</div>';
  }
  if(st.pendingAlign&&st.pendingAlign.items&&st.pendingAlign.items.length){
    var pa=st.pendingAlign;
    html+='<div class="ai-sec align"><div class="ai-sec-h">结构对齐建议（'+pa.items.length+' 条）'+(pa.summary?'<span class="muted">'+aiEsc(pa.summary)+'</span>':'')+'</div><div class="ai-diff-all"><button class="ai-btn primary" data-ai="align-all">全部接受并应用</button></div>';
    pa.items.forEach(function(it){
      var stT=it.status;
      var stLabel=stT==='pending'?'待确认':(stT==='accepted'?'已接受':stT==='rejected'?'已拒绝':'已暂缓');
      var v=it.validation||{ok:true,warnings:[],blocked:[]};
      var vBadge=v.ok?'<span class="ai-vbadge ok">✓ 校验通过</span>':(v.blocked.length?'<span class="ai-vbadge bad">⛔ '+v.blocked.length+' 项校验不过</span>':'');
      var vWarn=v.warnings&&v.warnings.length?'<div class="ai-vwarn">⚠ '+v.warnings.map(function(x){return aiEsc(x);}).join('；')+'</div>':'';
      html+='<div class="ai-align-item'+(stT==='rejected'?' rejected':'')+(stT==='accepted'?' accepted':'')+'">'
        +(v.blocked&&v.blocked.length?'<div class="ai-vblock">⛔ '+v.blocked.map(function(x){return aiEsc(x);}).join('；')+'</div>':'');
      if(it.kind==='suggestion'){
        html+='<div class="ai-align-h"><b>建议</b><span class="muted">'+stLabel+'</span>'+vBadge+'</div><div class="ai-align-sug">'+aiEsc(it.suggestion)+'</div>';
      }else if(it.kind==='rename'){
        html+='<div class="ai-align-h"><b>改名：'+aiEsc(it.fromTitle)+' → '+aiEsc(it.newTitle)+'</b><span class="muted">'+stLabel+'</span>'+vBadge+'</div>'+vWarn;
      }else if(it.kind==='deleteEmpty'){
        html+='<div class="ai-align-h"><b>删除空节：「'+aiEsc(it.fromTitle)+'」</b><span class="muted">'+stLabel+'</span>'+vBadge+'</div>'+vWarn+'<div class="ai-align-where muted">仅内容为空且非必填的节才会执行</div>';
      }else if(it.kind==='merge'){
        html+='<div class="ai-align-h"><b>合并：'+aiEsc(it.fromTitle)+' → '+aiEsc(it.toTitle)+'</b><span class="muted">'+stLabel+'</span>'+vBadge+'</div>'+vWarn+'<div class="ai-align-where muted">来源节全部内容并入目标节后删除来源节</div>';
      }else if(it.kind==='split'){
        html+='<div class="ai-align-h"><b>拆分：从「'+aiEsc(it.fromTitle)+'」拆出新节「'+aiEsc(it.newTitle)+'」</b><span class="muted">'+stLabel+'</span>'+vBadge+'</div>'+vWarn
          +'<div class="ai-align-pre"><b>拆走 '+it.moves.length+' 个块</b><pre>'+aiEsc(it.moves.map(function(m){return '· '+aiHtmlToText(m.match);}).join('\n'))+'</pre></div>';
      }else{
        html+='<div class="ai-align-h"><b>'+aiEsc(it.fromTitle)+' → '+aiEsc(it.toTitle)+'</b><span class="muted">'+(it.kind==='moveRow'?'表格行':'文本块')+' · '+stLabel+'</span>'+vBadge+'</div>'+vWarn
          +'<div class="ai-align-pre"><b>搬移内容</b><pre class="ai-jump" data-ai="jumpblock" data-sid="'+aiEsc(it.fromSection)+'" data-match="'+aiEsc(it.kind==='moveRow'?(it.rowOld&&it.rowOld.cells&&it.rowOld.cells[0]?String(it.rowOld.cells[0]).slice(0,60):''):aiNormText(aiHtmlToText(it.blockOld)).slice(0,160))+'" title="点击跳转原文">'+aiEsc(it.kind==='moveRow'?(it.rowOld?(it.rowOld.cells||[]).join(' | '):''):aiHtmlToText(it.blockOld))+'</pre></div>'
          +'<div class="ai-align-where muted">目标位置：'+(it.position==='start'?'节首':it.position==='end'?'节尾':(it.position==='before'?'锚点前':'锚点后')+(it.anchor?'「'+aiEsc(String(it.anchor).slice(0,40))+'」':''))+'</div>';
      }
      html+='<div class="ai-diff-act">'
        +(stT==='pending'||stT==='deferred'?(v.ok?'<button class="ai-btn primary" data-ai="align-accept" data-did="'+aiEsc(it.id)+'">接受</button>':'<button class="ai-btn primary" disabled title="校验不过的调整需先修改或拒绝">接受</button>'):'')
        +(stT==='pending'?'<button data-ai="align-reject" data-did="'+aiEsc(it.id)+'">拒绝</button>':'')
        +(stT==='pending'?'<button data-ai="align-defer" data-did="'+aiEsc(it.id)+'">暂缓</button>':'')
        +'</div></div>';
    });
    html+='</div>';
  }
  var vs=st.versions||[];
  if(vs.length){
    html+='<div class="ai-sec"><div class="ai-sec-h">版本历史 <span class="muted">'+vs.length+'/'+AI_MAX_VERSIONS+' · 节级差异补丁 · 无全文快照</span></div>';
    vs.slice().reverse().forEach(function(v){
      var kindLbl=v.kind==='original'?'原始':v.kind==='human'?'人工':v.kind==='final'?'终稿':'优化';
      var open=aiUi.verOpen[v.id];
      html+='<div class="ai-ver"><div class="ai-ver-top"><span class="ai-ver-lbl">'+aiEsc(v.label)+'</span><span class="pill-st lv-green">'+kindLbl+'</span>'
        +(v.scoreAfter!=null?'<span class="muted">'+v.scoreBefore+' → '+v.scoreAfter+' 分</span>':'')
        +(v.rolledBack?'<span class="pill-st lv-yellow">已回滚</span>':'')
        +'<span class="ai-ver-ops"><button data-ai="viewdiff" data-vid="'+aiEsc(v.id)+'">'+(open?'收起 Diff':'查看 Diff')+'</button><button data-ai="restore" data-vid="'+aiEsc(v.id)+'">恢复</button></span></div>';
      if(open){
        var keys=Object.keys(v.patch||{});
        html+='<div class="ai-ver-diff">'+(keys.length?keys.map(function(sid){
          var p=v.patch[sid],html2='<div class="ai-vd"><div class="muted">'+aiEsc(sectionTitle(sid))+'</div>';
          if(!Array.isArray(p)){
            html2+='<div class="ai-diff-old"><b>原</b><pre>'+aiEsc(aiPreview(p.old))+'</pre></div><div class="ai-diff-new"><b>改</b><pre>'+aiEsc(aiPreview(p.new))+'</pre></div>';
          }else{
            p.forEach(function(e){
              if(e.kind==='block')html2+='<div class="ai-diff-old"><b>原</b><pre class="ai-jump" data-ai="jumpblock" data-sid="'+aiEsc(sid)+'" data-match="'+aiEsc(aiNormText(aiHtmlToText(e.blockOld)).slice(0,160))+'" title="点击跳转原文">'+aiEsc(aiHtmlToText(e.blockOld))+'</pre></div><div class="ai-diff-new"><b>改</b><pre>'+aiEsc(aiHtmlToText(e.blockNew))+'</pre></div>';
              else if(e.kind==='row')html2+='<div class="ai-diff-old"><b>原</b><pre class="ai-jump" data-ai="jumpblock" data-sid="'+aiEsc(sid)+'" data-match="'+aiEsc(e.rowOld&&e.rowOld.cells&&e.rowOld.cells[0]?String(e.rowOld.cells[0]).slice(0,60):'')+'" title="点击跳转原文">'+aiEsc(e.rowOld?(e.rowOld.cells||[]).join(' | '):'')+'</pre></div><div class="ai-diff-new"><b>改</b><pre>'+aiEsc(e.rowNew?(e.rowNew.cells||[]).join(' | '):'')+'</pre></div>';
              else if(e.kind==='fwname')html2+='<div class="ai-diff-old"><b>改名</b><pre>'+aiEsc(e.oldTitle)+' → '+aiEsc(e.newTitle)+'</pre></div>';
              else if(e.kind==='fwdel')html2+='<div class="ai-diff-old"><b>删除节</b><pre>'+aiEsc((e.meta&&e.meta.title)||'')+'</pre></div>';
              else if(e.kind==='fwadd')html2+='<div class="ai-diff-old"><b>新增节</b><pre>'+aiEsc((e.meta&&e.meta.title)||'')+'</pre></div>';
              else if(e.kind==='section')html2+='<div class="ai-diff-old"><b>原</b><pre class="ai-jump" data-ai="jumpblock" data-sid="'+aiEsc(sid)+'" data-match="'+aiEsc(aiNormText(aiHtmlToText(e.oldHtml)).slice(0,160))+'" title="点击跳转原文">'+aiEsc(aiHtmlToText(e.oldHtml))+'</pre></div><div class="ai-diff-new"><b>改</b><pre>'+aiEsc(aiHtmlToText(e.newHtml))+'</pre></div>';
              else if(e.kind==='rows')html2+='<div class="ai-diff-old"><b>原</b><pre class="ai-jump" data-ai="jumpblock" data-sid="'+aiEsc(sid)+'" data-match="'+aiEsc(e.oldRows&&e.oldRows[0]&&e.oldRows[0].cells&&e.oldRows[0].cells[0]?String(e.oldRows[0].cells[0]).slice(0,60):'')+'" title="点击跳转原文">'+aiEsc((e.oldRows||[]).map(function(r){return '| '+((r.cells||[]).join(' | '))+' |';}).join('\n'))+'</pre></div><div class="ai-diff-new"><b>改</b><pre>'+aiEsc((e.newRows||[]).map(function(r){return '| '+((r.cells||[]).join(' | '))+' |';}).join('\n'))+'</pre></div>';
              else if(e.kind==='items')html2+='<div class="ai-diff-old"><b>原</b><pre>'+aiEsc((e.oldItems||[]).map(function(i){return i?((i.name!=null)?(i.name+' '+(i.desc||'')):(i.role?('作为'+i.role+'我希望'+(i.want||'')+'以便'+(i.soThat||'')):(i.text||''))):'';}).join('\n')||'（空）')+'</pre></div><div class="ai-diff-new"><b>改</b><pre>'+aiEsc((e.newItems||[]).map(function(i){return i?((i.name!=null)?(i.name+' '+(i.desc||'')):(i.role?('作为'+i.role+'我希望'+(i.want||'')+'以便'+(i.soThat||'')):(i.text||''))):'';}).join('\n'))+'</pre></div>';
            });
          }
          return html2+'</div>';
        }).join(''):'<div class="muted">（空版本）</div>')+'</div>';
      }
      html+='</div>';
    });
    html+='</div>';
  }
  if(st.ignoredAiIssues&&st.ignoredAiIssues.length){
    html+='<div class="ai-sec"><div class="ai-sec-h">已忽略 / 已订正 <span class="muted">'+st.ignoredAiIssues.length+'</span></div>';
    st.ignoredAiIssues.forEach(function(x){
      html+='<div class="ai-ign"><span>'+(x.corrected?'已订正':'已忽略')+'</span><button data-ai="unignore" data-key="'+aiEsc(x.key)+'">恢复</button></div>';
    });
    html+='</div>';
  }
  if(aiStatusLog.length){
    html+='<div class="ai-sec"><div class="ai-sec-h">过程记录</div>'+aiStatusLog.map(function(l){return '<div class="ai-log">'+aiEsc(l)+'</div>';}).join('')+'</div>';
  }
  body.innerHTML=html;
}

/* ---------- UI 状态 ---------- */
var aiUi={open:false,dimOpen:{},modifyOpen:{},verOpen:{}};
function aiTogglePanel(){
  aiUi.open=!aiUi.open;
  var p=document.getElementById('aiPanel');if(p)p.classList.toggle('open',aiUi.open);
  if(aiUi.open)aiRenderPanel();
}
function aiClosePanel(){aiUi.open=false;var p=document.getElementById('aiPanel');if(p)p.classList.remove('open');}

/* ---------- 注入 ---------- */
function aiInjectStyle(){
  if(document.getElementById('aiStyle'))return;
  var st=document.createElement('style');st.id='aiStyle';
  st.textContent='#aiPanel{position:fixed;top:0;right:0;bottom:0;width:390px;max-width:94vw;z-index:58;background:var(--bg,#faf9f7);border-left:1px solid var(--line,#e4e1da);display:flex;flex-direction:column;transform:translateX(105%);transition:transform .25s ease;box-shadow:-10px 0 28px rgba(0,0,0,.14)}'
    +'#aiPanel.open{transform:translateX(0)}'
    +'.ai-head{display:flex;align-items:center;justify-content:space-between;padding:12px 14px;border-bottom:1px solid var(--line,#e4e1da);font-family:var(--serif,Georgia,serif);font-size:16px;font-weight:600}'
    +'.ai-close{border:0;background:transparent;color:var(--ink-2,#777);font-size:16px;cursor:pointer;padding:4px 8px}'
    +'.ai-body{flex:1;overflow:auto;padding:12px 14px;display:flex;flex-direction:column;gap:12px}'
    +'.ai-tools{display:flex;gap:8px;align-items:center;flex-wrap:wrap}'
    +'.ai-tools .ai-btn{flex:1 1 auto;text-align:center;white-space:nowrap}'
    +'.ai-btn{border:1px solid var(--line,#d8d5ce);background:var(--sidebar-bg,#f0eee9);color:var(--ink,#26241f);border-radius:8px;padding:6px 12px;font-size:13px;cursor:pointer}'
    +'.ai-head{background:linear-gradient(135deg,rgba(27,79,214,.09),transparent 65%)}'
    +'.ai-body::-webkit-scrollbar{width:8px}.ai-body::-webkit-scrollbar-thumb{background:var(--line-2,#d8d5ce);border-radius:4px}.ai-body::-webkit-scrollbar-track{background:transparent}'
    +'.ai-btn.primary{background:var(--brand,#1b4fd6);border-color:var(--brand,#1b4fd6);color:#fff}'
    +'.ai-btn.danger{background:rgba(214,69,69,.1);border-color:var(--red,#d64545);color:var(--red,#d64545)}'
    +'.ai-stop-row{display:flex;align-items:center;gap:8px}'
    +'.ai-engine{margin-left:auto;font-size:12px}'
    +'.ai-status{background:var(--brand-soft,rgba(27,79,214,.12));border:1px solid var(--brand-line,rgba(27,79,214,.28));color:var(--ink,#26241f);border-radius:8px;padding:8px 10px;font-size:12.5px}'
    +'.ai-sec{border:1px solid var(--line,#e4e1da);border-radius:10px;padding:10px;background:var(--sidebar-bg,rgba(0,0,0,.02))}'
    +'.ai-sec.warn{border-color:var(--yellow,#d9a514)}'
    +'.ai-sec-h{font-weight:600;font-size:13px;margin-bottom:8px;display:flex;justify-content:space-between;gap:6px;flex-wrap:wrap}'
    +'.ai-total{font-size:15px;margin:4px 0} .ai-total b{font-size:26px} .ai-total small{color:var(--ink-2,#888)}'
    +'.ai-sum{margin:6px 0;font-size:12.5px;color:var(--ink-2,#666)}'
    +'.ai-dim{margin:8px 0;cursor:pointer}'
    +'.ai-dim-top{display:flex;justify-content:space-between;font-size:12.5px;margin-bottom:3px}'
    +'.ai-dim-score{font-weight:700}'
    +'.ai-bar{height:6px;background:var(--line-2,#f0eee9);border-radius:4px;overflow:hidden}'
    +'.ai-bar i{display:block;height:100%;background:var(--brand,#1b4fd6);border-radius:4px}'
    +'.ai-iss{margin-top:8px;display:flex;flex-direction:column;gap:8px}'
    +'.ai-iss-item{border:1px solid var(--line,#e4e1da);border-radius:8px;padding:8px;background:var(--bg,#fff)}'
    +'.ai-iss-item.ignored{opacity:.55}'
    +'.ai-iss-top{display:flex;gap:6px;align-items:center;font-size:12px}'
    +'.ai-iss-reason{font-size:12.5px;margin:5px 0}'
    +'.ai-iss-warn{font-size:11.5px;color:var(--red,#d64545);background:rgba(214,69,69,.08);border-radius:5px;padding:3px 6px;margin:3px 0}'
    +'.ai-iss-quote{font-size:11.5px;color:var(--ink-2,#666);background:var(--line-2,rgba(0,0,0,.04));border-radius:5px;padding:4px 6px;margin:3px 0;word-break:break-all}'
    +'.ai-dim-note{font-size:11.5px;color:var(--ink-2,#666);margin:5px 0}'
    +'.ai-iss-adv{font-size:12px;color:var(--ink-2,#666)}'
    +'.ai-iss-act{display:flex;gap:6px;margin-top:6px}'
    +'.ai-iss-act button{border:1px solid var(--line,#d8d5ce);background:transparent;border-radius:6px;padding:2px 8px;font-size:12px;cursor:pointer;color:var(--ink,#26241f)}'
    +'.ai-diff-all{margin-bottom:8px}'
    +'.ai-diff{border:1px solid var(--line,#e4e1da);border-radius:8px;padding:8px;margin-bottom:8px;background:var(--bg,#fff)}'
    +'.ai-diff.accepted{border-color:var(--green,#2f9e44);opacity:.75}'
    +'.ai-diff.rejected{border-color:var(--red,#d64545);opacity:.6}'
    +'.ai-diff-h{display:flex;justify-content:space-between;gap:6px;font-size:12.5px;margin-bottom:6px}'
    +'.ai-diff-old,.ai-diff-new{margin:4px 0}'
    +'.ai-diff-old pre,.ai-diff-new pre,.ai-ver-diff pre{white-space:pre-wrap;word-break:break-all;margin:2px 0;font-size:11.5px;background:var(--line-2,rgba(0,0,0,.04));border-radius:6px;padding:5px;max-height:110px;overflow:auto}'
    +'.ai-diff-sug{font-size:12.5px;background:var(--brand-soft,rgba(27,79,214,.1));border-radius:6px;padding:6px}'
    +'.ai-diff-act{display:flex;gap:6px;margin-top:6px;flex-wrap:wrap}'
    +'.ai-diff-act button{border:1px solid var(--line,#d8d5ce);background:transparent;border-radius:6px;padding:3px 10px;font-size:12px;cursor:pointer}'
    +'.ai-review{font-size:12px;background:var(--brand-soft,rgba(27,79,214,.1));border-radius:6px;padding:6px 8px;margin-bottom:6px}'
    +'.ai-engine-delta{font-size:11.5px;color:var(--ink-2,#666);margin-bottom:6px}'
    +'.ai-vbadge{font-size:11px;border-radius:5px;padding:2px 6px;margin-left:4px}'
    +'.ai-vbadge.ok{background:rgba(47,158,68,.12);color:var(--green,#2f9e44)}'
    +'.ai-vbadge.bad{background:rgba(214,69,69,.12);color:var(--red,#d64545)}'
    +'.ai-vwarn{font-size:11.5px;color:var(--yellow,#b8860b);margin:4px 0}'
    +'.ai-vblock{font-size:11.5px;color:var(--red,#d64545);background:rgba(214,69,69,.08);border-radius:5px;padding:4px 6px;margin:4px 0}'
    +'.ai-block{border-top:1px dashed var(--line,#e4e1da);margin-top:6px;padding-top:6px}'
    +'.ai-block:first-of-type{border-top:0;margin-top:0;padding-top:0}'
    +'.ai-hint{font-size:12px;background:rgba(217,165,20,.12);border:1px solid rgba(217,165,20,.35);color:var(--ink,#26241f);border-radius:8px;padding:7px 9px;display:flex;align-items:center;gap:8px;flex-wrap:wrap}'
    +'.ai-hint button{border:1px solid var(--yellow,#d9a514);background:transparent;border-radius:6px;padding:2px 10px;font-size:12px;cursor:pointer;margin-left:auto}'
    +'.ai-sec.align{border-color:rgba(27,79,214,.35)}'
    +'.ai-align-item{border:1px solid var(--line,#e4e1da);border-radius:8px;padding:8px;margin-bottom:8px;background:var(--bg,#fff)}'
    +'.ai-align-item.accepted{border-color:var(--green,#2f9e44);opacity:.75}'
    +'.ai-align-item.rejected{border-color:var(--red,#d64545);opacity:.6}'
    +'.ai-align-h{display:flex;justify-content:space-between;gap:6px;font-size:12.5px;margin-bottom:6px;align-items:center;flex-wrap:wrap}'
    +'.ai-align-pre{margin:4px 0}'
    +'.ai-align-pre pre{white-space:pre-wrap;word-break:break-all;margin:2px 0;font-size:11.5px;background:var(--line-2,rgba(0,0,0,.04));border-radius:6px;padding:5px;max-height:90px;overflow:auto}'
    +'.ai-align-sug{font-size:12.5px;background:var(--brand-soft,rgba(27,79,214,.1));border-radius:6px;padding:6px}'
    +'.ai-align-where{font-size:11.5px;margin:2px 0}'
    +'.ai-dbg{white-space:pre-wrap;word-break:break-all;font-size:10.5px;background:var(--line-2,rgba(0,0,0,.05));border-radius:6px;padding:6px;max-height:180px;overflow:auto;margin:0}'
    +'.ai-jump{cursor:pointer}'
    +'.ai-jump:hover{outline:1px dashed var(--brand,#1b4fd6);outline-offset:-1px}'
    +'.ai-flash{outline:3px solid var(--brand,#1b4fd6)!important;outline-offset:2px;border-radius:4px;transition:outline-color .3s}'
    +'.ai-ver{border:1px solid var(--line,#e4e1da);border-radius:8px;padding:7px;margin-bottom:7px;background:var(--bg,#fff)}'
    +'.ai-ver-top{display:flex;align-items:center;gap:7px;font-size:12.5px;flex-wrap:wrap}'
    +'.ai-ver-lbl{font-weight:600}'
    +'.ai-ver-ops{margin-left:auto;display:flex;gap:5px}'
    +'.ai-ver-ops button,.ai-ign button{border:1px solid var(--line,#d8d5ce);background:transparent;border-radius:6px;padding:2px 7px;font-size:11.5px;cursor:pointer}'
    +'.ai-ver-diff{margin-top:6px}'
    +'.ai-vd{margin-bottom:6px}'
    +'.ai-ign{display:flex;justify-content:space-between;align-items:center;font-size:12px;padding:4px 0;border-bottom:1px dashed var(--line,#e4e1da)}'
    +'.ai-log{font-size:11.5px;color:var(--ink-2,#777);padding:2px 0}'
    +'.ai-dim-row{display:flex;align-items:center;gap:8px;font-size:13px;padding:3px 0}'
    +'.ai-dim-grid{border:1px solid var(--line,#e4e1da);border-radius:8px;padding:8px;margin:8px 0}'
    +'.ai-dim-grid-t{display:flex;justify-content:space-between;font-size:12px;color:var(--ink-2,#888);margin-bottom:4px}'
    +'@media(max-width:760px){#aiPanel{width:94vw}}';
  document.head.appendChild(st);
}
function aiInjectSettingsTab(){
  var tabs=document.querySelector('#settingsModal .tabs');
  if(tabs&&!document.querySelector('#settingsModal .tabs [data-tab="ai"]')){
    var b=document.createElement('button');
    b.type='button';b.dataset.tab='ai';b.dataset.act='settab';b.textContent='AI';
    tabs.appendChild(b);
  }
  var prefs=document.getElementById('tabPrefs');
  if(prefs&&!document.getElementById('tabAI')){
    var d=document.createElement('div');
    d.id='tabAI';d.style.display='none';
    prefs.parentNode.appendChild(d);
  }
  var orig=window.setSettingsTab;
  window.setSettingsTab=function(tab){
    var map={rules:'tabRules',framework:'tabFramework',prefs:'tabPrefs',ai:'tabAI'};
    document.querySelectorAll('#settingsModal .tabs button').forEach(function(x){x.classList.toggle('active',x.dataset.tab===tab);});
    Object.keys(map).forEach(function(k){var el=document.getElementById(map[k]);if(el)el.style.display=(k===tab)?'block':'none';});
    if(tab==='ai')aiRenderTab();
  };
}
function aiInjectButtons(){
  var ta=document.getElementById('topActions');
  if(ta&&!document.getElementById('btnAi')){
    var b=document.createElement('button');
    b.id='btnAi';b.type='button';b.className='top-icon-btn';b.title='AI 助手（深度体检 / 一键优化 / 版本回滚）';b.textContent='AI';
    b.addEventListener('click',function(e){e.stopPropagation();aiTogglePanel();});
    var dd=document.getElementById('ddMore');
    if(dd)ta.insertBefore(b,dd);else ta.appendChild(b);
  }
  var sb=document.getElementById('sidebar');
  if(sb&&!document.getElementById('aiSidebarBtn')){
    var pb=sb.querySelector('.proj-bar');
    var ab=document.createElement('button');
    ab.id='aiSidebarBtn';ab.type='button';ab.className='pp-toggle';ab.style.marginTop='8px';ab.title='AI 助手';
    ab.innerHTML='<span class="ic">✦</span><span class="pt-name">AI 助手</span><span class="chev">›</span>';
    ab.addEventListener('click',function(e){e.stopPropagation();aiTogglePanel();});
    if(pb&&pb.nextSibling)pb.parentNode.insertBefore(ab,pb.nextSibling);
    else sb.appendChild(ab);
  }
}
function aiInjectPanel(){
  if(document.getElementById('aiPanel'))return;
  var p=document.createElement('aside');
  p.id='aiPanel';
  p.setAttribute('aria-label','AI 助手');
  p.innerHTML='<div class="ai-head"><span>AI 助手</span><button type="button" class="ai-close" data-ai="close" title="关闭">✕</button></div><div class="ai-body" id="aiBody"></div>';
  document.body.appendChild(p);
  var m=document.createElement('div');
  m.className='modal';m.id='aiOptModal';
  m.innerHTML='<div class="box"><div class="m-head"><h3>一键优化</h3><button class="x" data-ai="optclose">×</button></div><div class="m-body">'
    +'<div class="muted" style="margin-bottom:10px">选择优化范围。AI 将先体检，再给出逐条修改建议；你确认后才写入正文，分数回退自动保留最好版本。</div>'
    +'<div class="field"><label><input type="radio" name="aiScope" value="full" checked> 全文优化</label></div>'
    +'<div class="field"><label><input type="radio" name="aiScope" value="section"> 按节优化</label>'
    +'<select id="aiOptSec" style="margin-top:6px"></select></div>'
    +'</div><div class="m-foot"><button data-ai="optclose">取消</button><button class="primary" data-ai="optstart">开始优化</button></div></div>';
  document.body.appendChild(m);
  var gm=document.createElement('div');
  gm.className='modal';gm.id='aiGenModal';
  gm.innerHTML='<div class="box"><div class="m-head"><h3>AI 撰写 · 从零生成 PRD 草稿</h3><button class="x" data-ai="genclose">×</button></div><div class="m-body">'
    +'<div class="muted" style="margin-bottom:10px">输入产品/功能描述，AI 将新建项目并按框架逐节撰写草稿；每节内容逐条确认后才写入正文，版本可回滚。</div>'
    +'<div class="field"><label>项目名称</label><input id="aiGenName" placeholder="例如：智能座舱语音助手"></div>'
    +'<div class="field"><label>产品/功能描述（至少 10 个字）</label><textarea id="aiGenDesc" rows="6" style="width:100%;box-sizing:border-box" placeholder="例如：为智能座舱新增免唤醒连续对话能力，支持一句话多意图、可打断修正；目标指标：唤醒率≥95%、端到端延迟≤1.5s、连续对话≥5轮…"></textarea></div>'
    +'<div class="field"><label>框架</label><select id="aiGenFw"></select></div>'
    +'<div class="field"><label>模板风格（约束生成内容的取舍）</label><select id="aiGenStyle">'
    +'<option value="">不约束</option><option value="standard">标准 PRD</option><option value="agile">精简敏捷 PRD</option><option value="hardware">智能硬件 / 车规</option>'
    +'</select></div>'
    +'<div id="aiGenStatus" class="muted" style="margin-top:4px"></div>'
    +'</div><div class="m-foot"><button data-ai="genclose">取消</button><button class="primary" data-ai="genstart">开始生成</button></div></div>';
  document.body.appendChild(gm);
}
function aiBind(){
  document.addEventListener('click',function(e){
    var t=e.target&&e.target.closest?e.target.closest('[data-ai]'):null;
    if(!t)return;
    var act=t.dataset.ai;
    if(act==='close'){aiClosePanel();return;}
    if(act==='score'){aiRunScore();return;}
    if(act==='optimize'){aiOpenOptModal();return;}
    if(act==='align'){aiAlign();return;}
    if(act==='gen'){aiOpenGenModal();return;}
    if(act==='genclose'){try{closeModal('aiGenModal');}catch(e){var gmm=document.getElementById('aiGenModal');if(gmm)gmm.classList.remove('open');}return;}
    if(act==='genstart'){aiGenStart();return;}
    if(act==='align-accept'||act==='align-reject'||act==='align-defer'){aiDecideAlign(t.dataset.did,act==='align-accept'?'accepted':act==='align-reject'?'rejected':'deferred');return;}
    if(act==='align-all'){aiAcceptAllAlign();return;}
    if(act==='stop'){aiAbortRun();return;}
    if(act==='clearoptdbg'){var stc=aiState();if(stc)delete stc.lastOptDebug;aiPersist();aiRenderPanel();return;}
    if(act==='cleargendbg'){var stc2=aiState();if(stc2)delete stc2.lastGenDebug;aiPersist();aiRenderPanel();return;}
    if(act==='jumpblock'){aiJumpToBlock(t.dataset.sid,t.dataset.match);return;}
    if(act==='undo-diff'){aiUndoDiffItem(t.dataset.did);return;}
    if(act==='recover-backup'){
      var rbk=null;
      try{rbk=localStorage.getItem(STORAGE_KEY+'.bak');}catch(e){}
      if(!rbk){aiToast('没有找到可恢复的备份');return;}
      try{
        STATE=JSON.parse(rbk);
        save();
        aiRecoverOffer=null;
        aiRenderPanel();
        aiToast('已从备份恢复 '+STATE.projects.length+' 个项目');
      }catch(e){aiToast('备份恢复失败：'+(e&&e.message||e));}
      return;
    }
    if(act==='optclose'){try{closeModal('aiOptModal');}catch(e){var mm=document.getElementById('aiOptModal');if(mm)mm.classList.remove('open');}return;}
    if(act==='optstart'){
      var v=document.querySelector('input[name="aiScope"]:checked');
      aiOptMode=v&&v.value==='section'?'section':'full';
      var sel=document.getElementById('aiOptSec');
      aiOptSectionId=sel&&sel.value?sel.value:null;
      try{closeModal('aiOptModal');}catch(e){var m2=document.getElementById('aiOptModal');if(m2)m2.classList.remove('open');}
      aiRunOptimize();
      return;
    }
    if(act==='jump'){try{openSection(t.dataset.sid);}catch(e){}return;}
    if(act==='ignore'||act==='correct'){aiToggleIgnore(t.dataset.key,act==='correct');return;}
    if(act==='unignore'){aiToggleIgnore(t.dataset.key,false);return;}
    if(act==='accept'||act==='reject'||act==='defer'){aiDecideDiff(t.dataset.did,act==='accept'?'accepted':act==='reject'?'rejected':'deferred');return;}
    if(act==='modify'){var mk1=t.dataset.did+'_'+(t.dataset.ei||'0');aiUi.modifyOpen[mk1]=!aiUi.modifyOpen[mk1];aiRenderPanel();return;}
    if(act==='modify-save'){aiSaveModifiedDiff(t.dataset.did,t.dataset.ei!=null?+t.dataset.ei:null);return;}
    if(act==='acceptall'){aiAcceptAll();return;}
    if(act==='viewdiff'){aiUi.verOpen[t.dataset.vid]=!aiUi.verOpen[t.dataset.vid];aiRenderPanel();return;}
    if(act==='restore'){aiRestoreToVersion(t.dataset.vid);return;}
    if(act==='dimtoggle'){aiUi.dimOpen[t.dataset.did]=!aiUi.dimOpen[t.dataset.did];aiRenderPanel();return;}
    if(act==='savesettings'){aiSaveForm();return;}
    if(act==='testconn'){aiTestConn();return;}
  });
  document.addEventListener('keydown',function(e){
    if(e.key==='Escape'){var mm=document.getElementById('aiOptModal'),gm=document.getElementById('aiGenModal');if(mm&&mm.classList.contains('open')){try{closeModal('aiOptModal');}catch(e2){mm.classList.remove('open');}}else if(gm&&gm.classList.contains('open')){try{closeModal('aiGenModal');}catch(e3){gm.classList.remove('open');}}else if(aiUi.open)aiClosePanel();}
  });
}
function aiBoot(){
  aiInjectStyle();
  aiInjectSettingsTab();
  aiInjectButtons();
  aiInjectPanel();
  aiBind();
  aiWrapImport();
  aiWrapLoadSample();
  aiWrapSave();
  aiRecoverFromBackup();
}

/* ---------- 对外 ---------- */
window.__AICtrl={
  boot:aiBoot,
  openPanel:function(){aiUi.open=true;var p=document.getElementById('aiPanel');if(p)p.classList.add('open');aiRenderPanel();},
  closePanel:aiClosePanel,
  togglePanel:aiTogglePanel,
  renderPanel:aiRenderPanel,
  getSettings:aiGetSettings,
  runScore:aiRunScore,
  runOptimize:aiRunOptimize,
  runAlign:aiAlign,
  runGen:aiGenStart,
  openGen:aiOpenGenModal,
  stop:aiAbortRun,
  isBusy:function(){return aiBusy;},
  restoreToVersion:aiRestoreToVersion,
  _test:{
    state:aiState,
    createVersion:aiCreateVersion,
    decideDiff:aiDecideDiff,
    acceptAll:aiAcceptAll,
    finalizePending:aiFinalizePending,
    restore:aiRestoreToVersion,
    prune:aiPruneVersions,
    toggleIgnore:aiToggleIgnore,
    docText:aiDocText,
    sanitize:aiSanitizeHtml,
    normChange:aiNormChange,
    validate:aiValidateChange,
    evalDelta:aiEvalRuleDelta,
    applyEdits:aiApplyEdits,
    rowExec:aiRowExec,
    balanced:aiHtmlBalanced,
    blocks:aiBlocksOf,
    alignHint:aiAlignHint,
    secText:aiSecText,
    docTextNoCards:function(){return aiDocTextOpt(true);},
    normMove:aiNormMove,
    validateMove:aiValidateMove,
    decideAlign:aiDecideAlign,
    acceptAllAlign:aiAcceptAllAlign,
    finalizeAlign:aiFinalizeAlign,
    applyAlignItem:aiApplyAlignItem,
    undoDiff:aiUndoDiffItem,
    applyDiffNow:aiApplyDiffItemNow,
    genSection:aiGenSection,
    genStart:aiGenStart,
    genPrompt:aiGenSectionPrompt,
    styleGuide:aiGenStyleGuide,
    chunkDoc:aiChunkDoc,
    scoreChunked:aiScoreChunked,
    scoreNormalize:aiScoreNormalize,
    mdToHtml:aiMdToHtml,
    normItems:aiGenNormItems,
    normRows:aiGenNormRows,
    backup:aiBackupState,
    recover:aiRecoverFromBackup,
    recoverOffer:function(){return aiRecoverOffer;},
    sampleText:function(){return AI_SAMPLE_TEXT;}
  }
};
aiBoot();
})();

