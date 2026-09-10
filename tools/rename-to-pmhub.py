#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
PMHub 统一改名器（v19.14）

把两个旧显示名统一成 PMHub：
  1. "PMHub · 产品工作台"  -> "PMHub"
  2. "需求文档工作台"      -> "PMHub"
  3. "产品工作台"          -> "PMHub"   （负向断言，不碰 "产品经理工作台"）

严格不动的：
  - 文件名引用 "PMHub.html" / "PMHub_*.md"（部署约定）
  - 历史快照：archive/、tools/backups/、*_backup_before_*
  - 项目记忆：.workbuddy/

用法：
  python tools/rename-to-pmhub.py            # 干跑，只报告
  python tools/rename-to-pmhub.py --apply    # 实际写入
"""
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

EXTS = {'.html', '.htm', '.md', '.js', '.mjs', '.json', '.css', '.txt', '.yml', '.yaml'}

SKIP_DIRS = {'node_modules', 'archive', 'backups', '.git', '.workbuddy', '__pycache__'}
SKIP_FILE_PATTERNS = [re.compile(r'_backup_before_')]

# 顺序要紧：先干掉带 PMHub 前缀的组合，再处理裸旧名
# 注意 "Web 工作台" 是示例 PRD 的业务内容，不是产品名，绝不能碰
RULES = [
    ('PMHub · 产品工作台', 'PMHub'),
    ('需求文档工作台', 'PMHub'),
    ('PRD 工作台', 'PMHub'),
    (re.compile(r'(?<!经理)产品工作台'), 'PMHub'),
]


def should_skip(path, name):
    if name in SKIP_DIRS:
        return True
    for pat in SKIP_FILE_PATTERNS:
        if pat.search(name):
            return True
    return False


def apply_rules(text):
    """返回 (新文本, 命中列表[(行号, 规则名, 原片段)])"""
    hits = []
    out = text
    for rule, repl in RULES:
        if isinstance(rule, str):
            if rule not in out:
                continue
            # 逐行定位命中，供报告
            for i, line in enumerate(out.split('\n'), 1):
                if rule in line:
                    hits.append((i, rule, line.strip()[:110]))
            out = out.replace(rule, repl)
        else:
            if not rule.search(out):
                continue
            for i, line in enumerate(out.split('\n'), 1):
                if rule.search(line):
                    hits.append((i, rule.pattern, line.strip()[:110]))
            out = rule.sub(repl, out)
    return out, hits


def main():
    apply = '--apply' in sys.argv
    total_files = 0
    total_hits = 0

    for dirpath, dirnames, filenames in os.walk(ROOT):
        dirnames[:] = [d for d in dirnames if not should_skip(dirpath, d)]
        for fn in sorted(filenames):
            if os.path.splitext(fn)[1].lower() not in EXTS:
                continue
            if should_skip(dirpath, fn):
                continue
            fp = os.path.join(dirpath, fn)
            try:
                # newline='' 必须保留：项目源文件是 CRLF，若用默认 universal newlines
                # 读入会把 \r\n 折成 \n，写出时 newline='' 又不再还原，导致整文件行尾被改写、
                # git 产生大面积噪音 diff。读与写两侧都要 newline='' 才能原样保留。
                with open(fp, 'r', encoding='utf-8', newline='') as f:
                    src = f.read()
            except (UnicodeDecodeError, OSError):
                continue

            new, hits = apply_rules(src)
            if not hits or new == src:
                continue

            rel = os.path.relpath(fp, ROOT).replace('\\', '/')
            total_files += 1
            total_hits += len(hits)
            print(f'\n== {rel}  ({len(hits)} 处)')
            seen = set()
            for lineno, rule, snippet in hits:
                key = (lineno, rule)
                if key in seen:
                    continue
                seen.add(key)
                print(f'   L{lineno:<6} [{rule}]  {snippet}')

            if apply:
                with open(fp, 'w', encoding='utf-8', newline='') as f:
                    f.write(new)

    mode = '已写入' if apply else '干跑（未写入）'
    print(f'\n{"=" * 60}')
    print(f'{mode}：{total_files} 个文件 / {total_hits} 处命中')
    if not apply and total_files:
        print('确认无误后执行：python tools/rename-to-pmhub.py --apply')


if __name__ == '__main__':
    main()
