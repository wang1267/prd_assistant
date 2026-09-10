#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
文件名引用更新器（PMHub.html 改名配套）

把项目里对旧文件名的引用更新为新名：
  PRD智能看板.html                -> PMHub.html
  PRD智能看板_方案设计.md          -> PMHub_方案设计.md
  PRD智能看板_交接文档.md          -> PMHub_交接文档.md
  PRD智能看板_代码架构白皮书.md     -> PMHub_代码架构白皮书.md
  PRD智能看板_*.md                -> PMHub_*.md
  PRD%E6%99%BA%E8%83%BD%E7%9C%8B%E6%9D%BF -> PMHub   （URL 编码形式）

刻意不动：
  - 目录名 `prd看板` / `prd%E7%9C%8B%E6%9D%BF`（本规则只匹配「智能看板」的编码，不会误伤）
  - 历史快照：archive/、tools/backups/、*_backup_before_*
  - 项目记忆：.workbuddy/

行尾：读写两侧都显式 newline=''，原样保留 CRLF（见 README「文件约定」）。

用法：
  python tools/update-file-refs.py            # 干跑
  python tools/update-file-refs.py --apply    # 写入
"""
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EXTS = {'.html', '.htm', '.md', '.js', '.mjs', '.json', '.css', '.txt', '.yml', '.yaml', '.py', '.sh'}
SKIP_DIRS = {'node_modules', 'archive', 'backups', '.git', '__pycache__', '.workbuddy'}
SKIP_FILE_PATTERNS = [re.compile(r'_backup_before_')]
# 不能改自己：本脚本的 RULES / 文档字符串里含旧名，自我替换会让规则表失效、脚本无法复用
SKIP_FILES = {'update-file-refs.py'}

# 顺序要紧：先长后短，先编码后明文，最后才兜底裸串
RULES = [
    ('PRD智能看板_代码架构白皮书.md', 'PMHub_代码架构白皮书.md'),
    ('PRD智能看板_交接文档.md', 'PMHub_交接文档.md'),
    ('PRD智能看板_方案设计.md', 'PMHub_方案设计.md'),
    ('PRD智能看板_*.md', 'PMHub_*.md'),
    ('PRD%E6%99%BA%E8%83%BD%E7%9C%8B%E6%9D%BF', 'PMHub'),
    ('PRD智能看板.html', 'PMHub.html'),
    ('PRD智能看板', 'PMHub'),          # 兜底：处理剩余裸串
]


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
            if fn in SKIP_FILES:
                continue
            fp = os.path.join(dirpath, fn)
            try:
                with open(fp, 'r', encoding='utf-8', newline='') as f:
                    src = f.read()
            except (UnicodeDecodeError, OSError):
                continue

            out = src
            hits = []
            for old, new in RULES:
                if old not in out:
                    continue
                for i, line in enumerate(out.split('\n'), 1):
                    if old in line:
                        hits.append((i, old, line.strip()[:105]))
                out = out.replace(old, new)

            if not hits or out == src:
                continue

            rel = os.path.relpath(fp, ROOT).replace('\\', '/')
            nf += 1
            nh += len(hits)
            print(f'\n== {rel}  ({len(hits)} 处)')
            seen = set()
            for lineno, old, snip in hits:
                if (lineno, old) in seen:
                    continue
                seen.add((lineno, old))
                print(f'   L{lineno:<6} [{old[:22]}]  {snip}')

            if apply:
                with open(fp, 'w', encoding='utf-8', newline='') as f:
                    f.write(out)

    print(f'\n{"=" * 62}')
    print(f'{"已写入" if apply else "干跑（未写入）"}：{nf} 个文件 / {nh} 处')
    if not apply and nf:
        print('执行：python tools/update-file-refs.py --apply')


if __name__ == '__main__':
    main()
