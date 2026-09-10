#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
中英文边界补空格（配合 rename-to-pmhub.py 使用）

改名后 "需求文档工作台" -> "PMHub" 会让英文词与汉字贴在一起（如 "请返回PMHub检查"），
排版上很难看。本脚本只在 PMHub 与【汉字】紧邻时插入一个空格：
  PMHub解决   -> PMHub 解决
  请返回PMHub -> 请返回 PMHub

刻意不处理的：
  - 全角标点（（）、「」、，。：）—— 全角标点本身自带字面间距，加空格反而松散
  - 半角标点与代码符号 —— 会破坏代码

用法：
  python tools/fix-pmhub-spacing.py            # 干跑
  python tools/fix-pmhub-spacing.py --apply    # 写入
"""
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EXTS = {'.html', '.htm', '.md', '.js', '.mjs', '.json', '.css', '.txt', '.yml', '.yaml'}
SKIP_DIRS = {'node_modules', 'archive', 'backups', '.git', '__pycache__'}
SKIP_FILE_PATTERNS = [re.compile(r'_backup_before_')]

HAN = r'\u4e00-\u9fff'
RULES = [
    (re.compile(rf'PMHub(?=[{HAN}])'), 'PMHub '),
    (re.compile(rf'(?<=[{HAN}])PMHub'), ' PMHub'),
    # 连续补两遍会漏，如 "汉字PMHub汉字" 两个断言都成立但要各补一次；
    # 因此下面再跑一轮把 "汉字 PMHub" 形式确认干净
]


def fix(text):
    hits = []
    out = text
    for pat, repl in RULES:
        for m in pat.finditer(out):
            line_no = out[:m.start()].count('\n') + 1
            line = out.split('\n')[line_no - 1].strip()
            hits.append((line_no, line[:110]))
        out = pat.sub(repl, out)
    # 清理可能产生的双空格
    out = re.sub(r'PMHub  +', 'PMHub ', out)
    out = re.sub(r'  +PMHub', ' PMHub', out)
    return out, hits


def main():
    apply = '--apply' in sys.argv
    nf = nh = 0
    for dirpath, dirnames, filenames in os.walk(ROOT):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
        for fn in sorted(filenames):
            if os.path.splitext(fn)[1].lower() not in EXTS:
                continue
            if any(p.search(fn) for p in SKIP_FILE_PATTERNS):
                continue
            fp = os.path.join(dirpath, fn)
            try:
                # newline='' 必须保留（同 rename-to-pmhub.py）：否则 CRLF 会被折成 LF，
                # 整文件行尾被改写。读与写两侧都要 newline=''。
                with open(fp, 'r', encoding='utf-8', newline='') as f:
                    src = f.read()
            except (UnicodeDecodeError, OSError):
                continue
            new, hits = fix(src)
            if not hits or new == src:
                continue
            rel = os.path.relpath(fp, ROOT).replace('\\', '/')
            nf += 1
            nh += len(hits)
            print(f'\n== {rel}  ({len(hits)} 处)')
            seen = set()
            for ln, snip in hits:
                if ln in seen:
                    continue
                seen.add(ln)
                print(f'   L{ln:<6} {snip}')
            if apply:
                with open(fp, 'w', encoding='utf-8', newline='') as f:
                    f.write(new)
    print(f'\n{"=" * 60}')
    print(f'{"已写入" if apply else "干跑（未写入）"}：{nf} 个文件 / {nh} 处')
    if not apply and nf:
        print('执行：python tools/fix-pmhub-spacing.py --apply')


if __name__ == '__main__':
    main()
