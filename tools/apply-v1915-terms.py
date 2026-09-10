#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
v19.15「术语与入口订正」批量订正脚本。

落地产品评审的第 1 优先级三项（A4 死控件 / B1 术语统一 / 两处与实现不符的陈述）。
每条替换都断言命中次数 == 1，避免误伤；读写双侧 newline='' 以原样保留 CRLF 行尾
（见 README「行尾约定」与 2026-09-10 记忆：读侧漏配 newline='' 会静默把 CRLF 折成 LF）。

用法：
    python tools/apply-v1915-terms.py            # 干跑，只报告命中情况
    python tools/apply-v1915-terms.py --apply    # 实际写入
"""
import sys
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
TARGET = ROOT / "PMHub.html"


def crlf(s: str) -> str:
    """脚本内统一用 \\n 书写，落盘前转 CRLF。"""
    return s.replace("\r\n", "\n").replace("\n", "\r\n")


RULES = [
    # ---------------- A4：侧栏「PRD 项目」死控件 ----------------
    (
        "A4-1 静态默认隐藏 proj-bar",
        '<div class="proj-bar" data-act="gohome"><span class="name" id="curProjName">← 返回主页</span><span class="chev">‹</span></div>',
        '<!-- v19.15：该条只承担「返回主页」；无项目时它绑定的 gohome 是空操作，默认隐藏，'
        '显隐由 renderSidebar 决定 -->\n'
        '<div class="proj-bar" data-act="gohome" style="display:none"><span class="name" id="curProjName">← 返回主页</span><span class="chev">‹</span></div>',
    ),
    (
        "A4-2 renderSidebar 按有无项目决定显隐",
        "  const cp=document.getElementById('curProjName');if(cp)cp.textContent=proj?'← 返回主页':'PRD 项目';",
        "  const cp=document.getElementById('curProjName');\n"
        "  if(cp){\n"
        "    /* v19.15：原实现在无项目时把文案写成「PRD 项目」，但整条绑定的始终是 gohome\n"
        "       （只做 activeProjectId=null），已在家时点击零反馈 —— 是一个会骗点击的死控件。\n"
        "       现改为：有项目才显示（「← 返回主页」），无项目隐藏；主页的项目入口由下方\n"
        "       「总览 / 项目」两个按钮承担，不再并列第三个入口。 */\n"
        "    cp.textContent='← 返回主页';\n"
        "    var pb=cp.parentNode;\n"
        "    if(pb&&pb.classList&&pb.classList.contains('proj-bar'))pb.style.display=proj?'':'none';\n"
        "  }",
    ),
    # ---------------- B1：术语统一 ----------------
    (
        "B1-1 pill 静态占位文案",
        '<span class="txt">健康度 —</span>',
        '<span class="txt">完成度 —</span>',
    ),
    (
        "B1-2 pill 文案与注释",
        "    /* 百分比与风险是两件事：risk>0 时配色转红。文案同时点出红灯数，避免「77% 却是红的」被误读为分数偏低 */\n"
        "    pill.querySelector('.txt').textContent='健康度 '+m.completion+'%'+(m.risk>0?' · '+m.risk+' 红灯':'');",
        "    /* 术语约定（v19.15）：带百分比的数字一律叫「完成度」（= 必填节达标率）；\n"
        "       「健康度」只用于红黄绿规则引擎结论（如看板「节健康度总览」）。\n"
        "       此前这里写「健康度 X%」而取值是 m.completion，与同一条的 title、以及看板「完成度」卡自相矛盾。\n"
        "       另：百分比与风险是两件事，risk>0 时配色转红，故文案同时点出红灯数，\n"
        "       避免「77% 却是红的」被误读为分数偏低 */\n"
        "    pill.querySelector('.txt').textContent='完成度 '+m.completion+'%'+(m.risk>0?' · '+m.risk+' 红灯':'');",
    ),
    # ---------------- 与实现不符的陈述 ①：分组注释 ----------------
    (
        "FIX-1 分组注释说谎",
        "<!-- 分组功能已移除 -->",
        "<!-- v19.15：此处原有「分组功能已移除」注释，与实现不符 —— 分组是在用功能：\n"
        "     数据为 STATE.groups / project.groupId；入口与操作见侧栏项目抽屉\n"
        "     （「＋ 新建分组」grp-add、grp-rename、grp-del L3530-3532，拖拽可移动/分组），\n"
        "     总览页亦按组展示（L5203）。照旧注释去清理会删掉在用功能，故更正。 -->",
    ),
    # ---------------- 与实现不符的陈述 ②：文件头第 4 条的补充 ----------------
    (
        "FIX-2 文件头新增 v19.15 变更说明",
        "     注：示例 PRD 正文里的「Web 工作台」属业务内容，不在改名范围。\n-->",
        "     注：示例 PRD 正文里的「Web 工作台」属业务内容，不在改名范围。\n"
        "  8) v19.15 术语与入口订正（产品评审 A4 / B1，另更正两处与实现不符的陈述）：\n"
        "     - 术语统一：顶栏 pill 原写「健康度 77%」但取值是 metrics.completion（完成度），\n"
        "       与其自身 title、看板「完成度」卡自相矛盾。现约定 —— 带百分比一律叫「完成度」\n"
        "       （必填节达标率），「健康度」只用于红黄绿规则引擎结论（如「节健康度总览」）。\n"
        "     - 侧栏「PRD 项目」条是死控件：无项目时该条绑定的始终是 gohome（只做\n"
        "       activeProjectId=null），已在家时点击零反馈。现改为无项目即隐藏，\n"
        "       有项目时保留「← 返回主页」；主页入口由「总览 / 项目」承担。\n"
        "     - 更正陈述①：源码中「分组功能已移除」注释与实现不符（STATE.groups / groupId /\n"
        "       grp-add·grp-rename·grp-del 共 14 处在用，分组是活的）。\n"
        "     - 更正陈述②：本文件头第 4 条「删除设置中的判分规则展示」已过时 —— 该展示随\n"
        "       规则下钻回归，现为设置「高级 → 判分基线」（renderRulesTab，12 条规则表），\n"
        "       并被体检面板的 rule-link 直接下钻打开（case 'rulelink'），属在用功能。\n"
        "-->",
    ),
    # ---------------- 版本号 ----------------
    (
        "VER 设置页版本号",
        "版本 v19.14 · PMHub 统一命名",
        "版本 v19.15 · 术语与入口订正",
    ),
]


def main() -> int:
    apply = "--apply" in sys.argv
    raw = TARGET.read_text(encoding="utf-8", newline="")  # 必须 newline=''：原样保留 CRLF
    text = raw
    failures = []

    for name, old, new in RULES:
        o, n = crlf(old), crlf(new)
        hits = text.count(o)
        if hits != 1:
            failures.append(f"{name}: 命中 {hits} 次（期望 1）")
            print(f"[FAIL] {name}: 命中 {hits} 次（期望 1）")
            continue
        text = text.replace(o, n, 1)
        print(f"[ OK ] {name}")

    if failures:
        print("\n存在异常命中，未写入任何改动。")
        return 1

    if not apply:
        print("\n干跑完成，未写入。加 --apply 实际落盘。")
        return 0

    TARGET.write_text(text, encoding="utf-8", newline="")
    before, after = len(raw.encode("utf-8")), len(text.encode("utf-8"))
    print(f"\n已写入 {TARGET.name}：{before} → {after} bytes（{'+' if after >= before else ''}{after - before}）")
    print(f"行尾检查：CRLF={text.count(chr(13) + chr(10))} / 裸 LF={text.count(chr(10)) - text.count(chr(13) + chr(10))}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
