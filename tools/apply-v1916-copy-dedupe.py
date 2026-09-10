#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
v19.16「说明文案去重」批量订正脚本。

落地产品评审 C 组（C1 / C2 / C5 / C6）—— 四条经过逐条回源码复核的冗余说明。
复核结论（与上一轮评审清单的差异，如实记录）：
  - C3「尚未运行 AI 深度体检」两处**不是冗余**：一处是节下钻空态（只说本节会显示诊断），
    一处是 AI 面板空态（列 6 个维度并指路按钮），作用不同 → 本轮**不动**。
  - C4「两套框架说明」实为「一份活的（编辑文档框架弹窗）+ 一份死渲染（renderFrameworkTab
    写入的 #tabFramework 在主文件里不存在）」，属死代码而非文案冗余 → 见 PMHub.html 文件头第 9 条，
    与「框架 5 个操作入口丢失」一并单独处理，本轮不动。

用法：
    python tools/apply-v1916-copy-dedupe.py            # 干跑
    python tools/apply-v1916-copy-dedupe.py --apply    # 写入
"""
import sys
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
TARGET = ROOT / "PMHub.html"


def crlf(s: str) -> str:
    return s.replace("\r\n", "\n").replace("\n", "\r\n")


RULES = [
    # ---------- C2：设置页「本机生效，刷新后保留」原写两遍 → 上提为一处 ----------
    (
        "C2-1 面板密度说明去掉重复的持久化提示",
        '<div class="muted" style="margin-bottom:10px">面板密度影响卡片留白与信息密度，仅本机生效，刷新后保留。',
        '<div class="muted" style="margin-bottom:10px">面板密度影响卡片留白与信息密度。',
    ),
    (
        "C2-2 主题说明去掉重复的持久化提示",
        '<div class="muted" style="margin-bottom:10px">界面主题（本机生效，刷新后保留）。点击直接切换，无需循环。</div>',
        '<div class="muted" style="margin-bottom:10px">界面主题。点击直接切换，无需循环。</div>',
    ),
    (
        "C2-3 在设置页顶部统一声明一次本机生效",
        "  let html='<div class=\"muted\" style=\"margin-bottom:10px\">面板密度影响卡片留白与信息密度。",
        "  let html='<div class=\"muted\" style=\"margin-bottom:10px\">以下外观设置仅本机生效，刷新后保留。</div>'\n"
        "    +'<div class=\"muted\" style=\"margin-bottom:10px\">面板密度影响卡片留白与信息密度。",
    ),
    # ---------- C1：AI「不覆盖」原写两遍 ----------
    (
        "C1 AI 设置页不再重复解释与规则引擎的关系",
        '<div class="muted" style="margin-bottom:10px">AI 深度体检（与红黄绿规则引擎并列，不覆盖）。Key 仅存本机浏览器，',
        '<div class="muted" style="margin-bottom:10px">Key 仅存本机浏览器，',
    ),
    # ---------- C5：评审选项目弹窗引导语与列表头/空态/按钮三重重复 ----------
    (
        "C5 删除评审选项目弹窗的冗余引导语",
        '    <div class="muted" style="margin-bottom:10px">选择一个已有项目进行五视角评审；没有合适的项目，可以先导入一份 PRD。</div>\n',
        '',
    ),
    # ---------- C6：导入备份警告的 title 与菜单注记逐字重复 ----------
    (
        "C6 导入备份 title 改为补充信息而非复述警告",
        'title="会整体覆盖当前看板所有内容，请先导出备份"',
        'title="覆盖全部项目与设置；执行前会自动保留一份「导入前状态」可回退"',
    ),
    # ---------- 版本号 ----------
    (
        "VER 设置页版本号",
        "版本 v19.15 · 术语与入口订正",
        "版本 v19.16 · 说明文案去重",
    ),
    # ---------- 文件头变更说明 ----------
    (
        "DOC 文件头新增 v19.16 说明",
        "       并被体检面板的 rule-link 直接下钻打开（case 'rulelink'），属在用功能。\n-->",
        "       并被体检面板的 rule-link 直接下钻打开（case 'rulelink'），属在用功能。\n"
        "  9) v19.16 说明文案去重（产品评审 C 组，逐条回源码复核后只保留真正冗余的）：\n"
        "     - 设置页「仅本机生效，刷新后保留」原在面板密度与界面主题两处各写一遍，\n"
        "       现上提为设置页顶部统一声明一次。\n"
        "     - AI 设置页原复述「与红黄绿规则引擎并列、不覆盖」，与看板 AI 体检卡重复；\n"
        "       该页只保留 Key 存储与隐私说明（用户在此关心的是 Key，不是引擎关系）。\n"
        "     - 多角色评审的「选择项目」弹窗删掉浮引导语：非空时有列表头「共 N 个项目，\n"
        "       点击即切换并开始评审」+「导入 PRD 文件」按钮，空态有专门 empty 块，\n"
        "       原引导语与三者重复。\n"
        "     - 「导入备份」菜单项的 title 原与菜单底部注记逐字重复，改为补充信息\n"
        "       （覆盖范围 + 会自动留可回退的导入前状态）。\n"
        "     - 复审后撤回两项：C3「尚未运行 AI 深度体检」两处作用不同（节下钻空态 vs\n"
        "       AI 面板空态），不是冗余；C4「两套框架说明」实为一份活文档 + 一份死渲染。\n"
        "     - 【待处理，未在本轮改动】框架的 5 个操作（自动排序 / 恢复默认框架 /\n"
        "       另存为自定义框架 / 导出框架 JSON / 导入框架 JSON）**在 UI 上不可达**：\n"
        "       它们只由 renderFrameworkTab() 渲染，而该函数写入的 #tabFramework 元素\n"
        "       在当前主文件里并不存在（仅 v16.9/stripped.html 历史快照有）。\n"
        "       已用真实浏览器在框架弹窗打开状态下全页扫描，5 个 data-act 命中数均为 0。\n"
        "       动作处理函数（case 'fw-autosort' / 'resetframework' / 'fw-saveas' /\n"
        "       'exportframework' / 'importframework'）与 frameworkFileInput 监听都还在，\n"
        "       属「入口随『设置→框架』tab 一起消失」的回归，待补入口后一并清理死渲染。\n"
        "-->",
    ),
]


def main() -> int:
    apply = "--apply" in sys.argv
    raw = TARGET.read_text(encoding="utf-8", newline="")
    text = raw
    failures = []

    for name, old, new in RULES:
        o, n = crlf(old), crlf(new)
        hits = text.count(o)
        if hits != 1:
            failures.append(name)
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
