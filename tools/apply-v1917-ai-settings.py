#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
v19.17「AI 设置页重排 + 去掉本地部署」批量订正脚本。

王上反馈：AI 设置页**很杂乱**，且**不要再引导本地部署**。

改前问题（实测：该 tab 可见文案 916 字，是设置弹窗里最长的一屏）
  1. 14 个块平铺、无分组；顺序也不合理（API Key 排在模型之后，评分维度权重夹在中间）。
  2. 顶部「先选择接入方式」两个预置按钮（本地免费 / 配置在线）与下面的完整表单**重复表达同一件事**，
     且把「必填的连接配置」割裂成两段。
  3. 说明性文字占比过大：「AI 数据边界」3 条 bullet、「联网搜索」一段约 200 字，全部常驻展开。
  4. 本地部署（Ollama）相关文案散落 6 处：接入方式按钮、服务商选项、Base URL placeholder、
     模型 datalist（qwen3:8b / gpt-oss:20b）、错误提示、联网搜索说明里的「本地模型」。

改法
  - 去掉「本地部署 / Ollama」全部引导（含服务商选项、预设按钮、示例模型、错误提示里的指引）。
    「自定义 OpenAI 兼容服务」保留 —— 那是接入任意网关的能力，不等于本地部署。
  - 用「服务商下拉选中即自动填入官方 Base URL + 推荐模型」替代原来的两个预置按钮：
    一个控件代替两个块，且与「必填配置」放在一起。
  - 重排为 4 个带编号的分区：① 连接服务（含保存/测试）② 按任务分配模型 ③ 评分与优化护栏 ④ 联网搜索；
    「AI 数据边界与隐私」与「联网搜索说明」收进折叠区，默认收起。
  - 保存/测试连接上移到「连接服务」区（它们只跟连接有关，原本在最底部要滚一屏）。

大块改写用「按行定位首尾标记再整段替换」实现，比长字符串精确匹配稳（不怕内部有细微空白差异）。

用法：
    python tools/apply-v1917-ai-settings.py            # 干跑
    python tools/apply-v1917-ai-settings.py --apply    # 写入
"""
import sys
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
TARGET = ROOT / "PMHub.html"


def to_crlf(s: str) -> str:
    return s.replace("\r\n", "\n").replace("\n", "\r\n")


# ---------------------------------------------------------------- 片段替换
RULES = [
    # ---------- CSS：新增分区与折叠区样式 ----------
    (
        "CSS 新增 set-sec / set-more 样式",
        "    +'.ai-dim-grid-t{display:flex;justify-content:space-between;font-size:12px;color:var(--ink-2,#888);margin-bottom:4px}'",
        "    +'.ai-dim-grid-t{display:flex;justify-content:space-between;font-size:12px;color:var(--ink-2,#888);margin-bottom:4px}'\n"
        "    /* v19.17 AI 设置页分区与折叠区 */\n"
        "    +'.set-sec{margin:0 0 15px}'\n"
        "    +'.set-sec-h{display:flex;align-items:center;gap:7px;font-weight:600;font-size:13.5px;padding-bottom:6px;margin:0 0 10px;border-bottom:1px solid var(--line,#e4e1da)}'\n"
        "    +'.set-sec-n{display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;border-radius:50%;background:var(--brand,#1b4fd6);color:#fff;font-size:11px;font-weight:600;flex:0 0 auto}'\n"
        "    +'.set-sec-h .muted{font-weight:400;font-size:11.5px;margin-left:auto}'\n"
        "    +'.set-more{margin-top:9px;font-size:12px}'\n"
        "    +'.set-more summary{cursor:pointer;color:var(--brand,#1b4fd6);font-size:12px;padding:2px 0;user-select:none}'\n"
        "    +'.set-more>.muted,.set-more-list{padding-top:4px;line-height:1.65;color:var(--ink-2,#777)}'\n"
        "    +'.set-more-list{margin:4px 0 0;padding-left:18px}'\n"
        "    +'.set-more-list li{margin-bottom:3px}'",
    ),
    # ---------- 服务商标签映射：移除 ollama ----------
    (
        "服务商标签移除「本地 Ollama」",
        "{deepseek:'DeepSeek',qwen:'Qwen / 阿里云百炼',zhipu:'GLM / 智谱 AI',openai:'OpenAI',ollama:'本地 Ollama',custom:'自定义 OpenAI 兼容服务'}",
        "{deepseek:'DeepSeek',qwen:'Qwen / 阿里云百炼',zhipu:'GLM / 智谱 AI',openai:'OpenAI',custom:'自定义 OpenAI 兼容服务'}",
    ),
    # ---------- 配置缺失提示：去掉「本地免费 · Ollama」指引 ----------
    (
        "配置缺失提示不再指向本地免费示例",
        "请先在 设置 → AI 设置 中填写服务地址、模型名和 API Key；可选择“本地免费 · Ollama”自动填入示例。",
        "请先在 设置 → AI 设置 中填写服务地址、模型名和 API Key（在「服务商」下拉中选择后会立即填入官方地址与推荐模型）。",
    ),
    # ---------- 动作分发：移除两个预置按钮的处理 ----------
    (
        "移除 preset-local-free / preset-online 动作分发",
        "    if(act==='preset-local-free'){aiFillModelPreset('local-free');return;}\n"
        "    if(act==='preset-online'){aiFillModelPreset('online');return;}\n",
        "",
    ),
    # ---------- 版本号 ----------
    (
        "设置页版本号",
        "版本 v19.16 · 说明文案去重",
        "版本 v19.17 · AI 设置页重排",
    ),
    # ---------- 文件头变更说明 ----------
    (
        "文件头新增 v19.17 说明",
        "       属「入口随『设置→框架』tab 一起消失」的回归，待补入口后一并清理死渲染。\n-->",
        "       属「入口随『设置→框架』tab 一起消失」的回归，待补入口后一并清理死渲染。\n"
        " 10) v19.17 AI 设置页重排 + 去掉本地部署引导（王上反馈「AI 设置页很杂乱、不要本地部署了」）：\n"
        "     - 移除全部本地部署引导：服务商下拉里的「本地 Ollama」选项、顶部「本地免费 · Ollama」\n"
        "       预置按钮、Base URL 的 localhost 占位、模型 datalist 里的 qwen3:8b / gpt-oss:20b、\n"
        "       配置缺失提示里的指引、联网搜索说明里的「本地模型」。\n"
        "       「自定义 OpenAI 兼容服务」保留 —— 接入任意网关的能力 ≠ 本地部署。\n"
        "     - 用「选中服务商即自动填入官方 Base URL + 推荐模型」替代原来的两个预置按钮：\n"
        "       一个控件代替两个块，且与必填的连接配置放在同一处。\n"
        "     - 重排为 4 个带编号分区：① 连接服务（保存/测试上移到此处）② 按任务分配模型\n"
        "       ③ 评分与优化护栏 ④ 联网搜索；「AI 数据边界与隐私」「联网搜索说明」收进折叠区默认收起。\n"
        "       改前该 tab 可见文案 916 字为设置弹窗最长一屏，且 14 个块平铺无分组、\n"
        "       API Key 排在模型之后、评分维度权重夹在中间。\n"
        "-->",
    ),
]

# ---------------------------------------------------------------- 整段替换（按行定位）
BLOCK_RULES = [
    (
        "aiFillModelPreset 改写为 aiFillProviderDefaults",
        "function aiFillModelPreset(kind){",
        "  if(base)base.focus();\n",
        1,  # 结束标记的下一行是函数收尾的 `}`，一并吞掉，否则会留下孤立的右花括号
        """var AI_PROVIDER_PRESETS={
  deepseek:{base:'https://api.deepseek.com/v1',model:'deepseek-chat'},
  qwen:{base:'https://dashscope.aliyuncs.com/compatible-mode/v1',model:'qwen3.7-max'},
  zhipu:{base:'https://open.bigmodel.cn/api/paas/v4',model:'glm-4.7'},
  openai:{base:'https://api.openai.com/v1',model:'gpt-4o-mini'}
};
/* v19.17：不再引导本地部署（原来的「本地免费 · Ollama」一键示例已移除），
   改为按服务商一键填入官方地址与推荐模型；custom 不预填，交给用户填任意 OpenAI 兼容地址。
   官方域名与 aiInferProvider 的识别规则保持一致（open.bigmodel.cn / api.deepseek.com / dashscope）。 */
function aiFillProviderDefaults(provider){
  var p=AI_PROVIDER_PRESETS[provider];
  var base=document.getElementById('aiBaseUrl'),model=document.getElementById('aiModel'),status=document.getElementById('aiConnStatus');
  if(!p){
    if(status)status.textContent='自定义服务：请填写 OpenAI 兼容的 Base URL、模型名与 API Key。';
    if(base)base.focus();
    return;
  }
  if(base)base.value=p.base;
  if(model)model.value=p.model;
  if(status)status.textContent='已填入 '+aiProviderLabel(provider)+' 的官方地址与推荐模型；填写该服务商的 API Key 后点击「保存设置」与「测试连接」。';
  aiToast('已填入 '+aiProviderLabel(provider)+' 的地址与推荐模型');
}
""",
    ),
    (
        "aiRenderTab 表单重排为 4 个分区",
        '  el.innerHTML=\'<div class="muted" style="margin-bottom:10px">Key 仅存本机浏览器',
        "    +'<div id=\"aiConnStatus\" class=\"muted\" style=\"margin-top:6px\"></div>';\n",
        0,
        """  el.innerHTML=
    '<div class="set-sec"><div class="set-sec-h"><span class="set-sec-n">1</span>连接服务<span class="muted">必填</span></div>'
      +'<div class="field"><label for="aiProvider">服务商</label><select id="aiProvider" onchange="aiFillProviderDefaults(this.value)">'+[['custom','自定义 OpenAI 兼容服务'],['deepseek','DeepSeek'],['qwen','Qwen / 阿里云百炼'],['zhipu','GLM / 智谱 AI'],['openai','OpenAI']].map(function(o){return '<option value="'+o[0]+'"'+(s.provider===o[0]?' selected':'')+'>'+o[1]+'</option>';}).join('')+'</select><div class="muted">选择后会填入该服务商的官方 Base URL 与推荐模型，可再手改。在线服务的免费额度随服务商和时间变化，应用不默认绑定也不承诺某一家免费。</div></div>'
      +'<div class="field"><label for="aiBaseUrl">Base URL（OpenAI 兼容）</label><input id="aiBaseUrl" value="'+aiEsc(s.baseUrl)+'" placeholder="选择服务商后自动填入，也可手填"></div>'
      +'<div class="field"><label for="aiKey">API Key</label><input id="aiKey" type="password" placeholder="'+(keyMask?('已保存 '+keyMask+'（输入新值将覆盖）'):'sk-...')+'"><div class="muted">'+(keyMask?('当前 Key：'+aiEsc(keyMask)+' · '):'')+'Key 仅存本机浏览器，不进备份/导出/日志，公开分享的链接不会携带</div></div>'
      +'<div class="field"><label for="aiModel">标准模型</label><input id="aiModel" value="'+aiEsc(s.model)+'" placeholder="填写服务商提供的模型名" list="aiModelList"><div class="muted">用于需求澄清与 PRD 生成</div><datalist id="aiModelList"><option value="deepseek-chat"><option value="deepseek-v4-flash"><option value="qwen3.7-max"><option value="glm-4.7"><option value="gpt-4o-mini"></datalist></div>'
      +'<div class="row-act"><button data-ai="savesettings">保存设置</button><button data-ai="testconn">测试连接</button></div>'
      +'<div id="aiConnStatus" class="muted" style="margin-top:6px"></div>'
    +'</div>'
    +'<div class="set-sec"><div class="set-sec-h"><span class="set-sec-n">2</span>按任务分配模型<span class="muted">可选 · 留空回退标准模型</span></div>'
      +'<div class="field"><label for="aiFastModel">快速模型</label><input id="aiFastModel" value="'+aiEsc(s.fastModel||'')+'" placeholder="留空 = 标准模型"><div class="muted">用于项目助手聊天</div></div>'
      +'<div class="field"><label for="aiDeepModel">深度模型</label><input id="aiDeepModel" value="'+aiEsc(s.deepModel||'')+'" placeholder="留空 = 标准模型"><div class="muted">用于体检、优化、结构对齐与评审，通常更慢或更贵</div></div>'
      +'<div class="field"><label for="aiReviewModel">复检模型</label><input id="aiReviewModel" value="'+aiEsc(s.reviewModel||'')+'" placeholder="留空 = 深度模型"><div class="muted">用于优化后的独立复核</div></div>'
    +'</div>'
    +'<div class="set-sec"><div class="set-sec-h"><span class="set-sec-n">3</span>评分与优化护栏</div>'
      +'<div class="ai-dim-grid"><div class="ai-dim-grid-t"><span>评分维度</span><span>权重（总分为加权结果）</span></div>'+dimsHtml+'</div>'
      +'<div class="field"><label for="aiTarget">目标分</label><input id="aiTarget" type="number" min="50" max="100" value="'+s.targetScore+'"><div class="muted">一键优化的达标线</div></div>'
      +'<div class="field"><label for="aiRounds">最大优化轮数</label><input id="aiRounds" type="number" min="1" max="5" value="'+s.maxRounds+'"><div class="muted">护栏 2–5 轮，超出自动停止</div></div>'
    +'</div>'
    +'<div class="set-sec"><div class="set-sec-h"><span class="set-sec-n">4</span>联网搜索<span class="muted">可选</span></div>'
      +'<div class="ai-web-field">'
      +'<label class="ai-toggle"><input type="checkbox" class="sw" id="aiWeb"'+(s.web?' checked':'')+'> 开启联网搜索</label>'
      +'<div class="field" style="margin:8px 0 0"><label for="aiWebProvider">搜索服务</label><select id="aiWebProvider"><option value="auto"'+(s.webProvider!=='zhipu'?' selected':'')+'>跟随聊天服务（DeepSeek / Qwen / 智谱 / OpenAI）</option><option value="zhipu"'+(s.webProvider==='zhipu'?' selected':'')+'>独立智谱搜索（适配任意聊天模型）</option></select></div>'
      +'<div class="field" style="margin:8px 0 0"><label for="aiWebKey">独立智谱搜索 API Key</label><input id="aiWebKey" type="password" autocomplete="off" value="'+aiEsc(s.webApiKey||'')+'" placeholder="仅选择独立智谱搜索时需要"></div>'
      +'<details class="set-more"><summary>联网搜索的说明</summary><div class="muted">用于从想法生成与项目助手，会展示真实来源；找开源方案时额外查询 GitHub 仓库。没有来源时明确报错，不会静默降级。<br>跟随模式下：DeepSeek 需使用支持搜索的模型；Qwen 需用官方百炼地址并通过 DashScope 返回来源；智谱需开通 Web Search API。浏览器直连还需服务商允许跨域。<br>其他兼容服务可搭配独立智谱搜索，检索结果仍由当前聊天模型分析；聊天 Key 不会发给独立搜索服务或 GitHub。</div></details>'
      +'</div>'
    +'</div>'
    +'<details class="set-more"><summary>AI 数据边界与隐私</summary><ul class="set-more-list"><li>首次使用 AI 时会显示服务商、模型与数据边界，确认后不再因不同操作重复打断。</li><li>体检 / 全文优化 / 评审会发送当前项目 PRD；单节优化只发送该节及相关问题；对话只发送本轮对话内容。</li><li>请先脱敏账号、密钥、个人信息、客户数据和未公开合同。API Key、界面主题及其他本机项目不会作为请求字段发送。</li></ul></details>';
""",
    ),
]


def main() -> int:
    apply = "--apply" in sys.argv
    raw = TARGET.read_text(encoding="utf-8", newline="")
    text = raw
    failures = []

    for name, old, new in RULES:
        o, n = to_crlf(old), to_crlf(new)
        hits = text.count(o)
        if hits != 1:
            failures.append(name)
            print(f"[FAIL] {name}: 命中 {hits} 次（期望 1）")
            continue
        text = text.replace(o, n, 1)
        print(f"[ OK ] {name}")

    # 整段替换：按起止标记定位行号后整段换掉
    # 注意：lines 是按 \r\n 切开的，行内容不含换行符，因此标记里的换行必须去掉再匹配
    #       drop_after：结束标记之后还要一并吞掉的行数（比如函数收尾的 `}`）
    for name, start_sub, end_sub, drop_after, new_text in BLOCK_RULES:
        start_key = start_sub.replace("\r", "").replace("\n", "")
        end_key = end_sub.replace("\r", "").replace("\n", "")
        lines = text.split("\r\n")
        starts = [i for i, ln in enumerate(lines) if start_key in ln]
        if len(starts) != 1:
            failures.append(name)
            print(f"[FAIL] {name}: 起始标记命中 {len(starts)} 处（期望 1）")
            continue
        s0 = starts[0]
        ends = [i for i in range(s0, len(lines)) if end_key in lines[i]]
        if not ends:
            failures.append(name)
            print(f"[FAIL] {name}: 未找到结束标记")
            continue
        e0 = ends[0] + drop_after
        head, tail = lines[:s0], lines[e0 + 1:]
        new_lines = to_crlf(new_text).split("\r\n")
        if new_lines and new_lines[-1] == "":
            new_lines = new_lines[:-1]
        text = "\r\n".join(head + new_lines + tail)
        print(f"[ OK ] {name}（替换第 {s0 + 1}-{e0 + 1} 行，共 {e0 - s0 + 1} → {len(new_lines)} 行）")

    if failures:
        print("\n存在异常命中，未写入任何改动。")
        return 1

    # 残留自检：只扫「活的代码」区域。
    # 文件头是变更说明（本来就要写明移除了哪些本地部署字样），以及本次新增的
    # doc 注释里也会引用旧文案 —— 这两类不算残留，按下面的规则排除。
    KEYS = ("本地 Ollama", "ollama run", "localhost:11434", "qwen3:8b",
            "gpt-oss:20b", "preset-local-free", "aiFillModelPreset", "本地免费")
    all_lines = text.split("\r\n")
    html_at = next((i for i, ln in enumerate(all_lines) if ln.lstrip().startswith("<html")), 0)
    leftover = []
    for i in range(html_at, len(all_lines)):
        ln = all_lines[i]
        if "v19.17" in ln:          # 本次新增的 doc 注释，引用旧文案说明改了什么
            continue
        for k in KEYS:
            if k in ln:
                leftover.append(f"{k}@{i + 1}")
                break
    if leftover:
        print(f"\n[WARN] 仍有本地部署残留（活代码区）：{leftover}（请检查是否需要处理）")
    else:
        print("\n[OK] 活代码区已无本地部署字样（文件头变更说明除外）")

    if not apply:
        print("\n干跑完成，未写入。加 --apply 实际落盘。")
        return 0

    TARGET.write_text(text, encoding="utf-8", newline="")
    before, after = len(raw.encode("utf-8")), len(text.encode("utf-8"))
    print(f"\n已写入 {TARGET.name}：{before} → {after} bytes（{'+' if after >= before else ''}{after - before}）")
    print(f"行尾检查：CRLF={text.count(chr(13) + chr(10))} / 裸 LF={text.count(chr(10)) - text.count(chr(13) + chr(10))}")
    print(f"本地部署残留：{leftover if leftover else '无 ✅'}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
