import io, re, sys

TARGET = 'PMHub.html'
NAMES = ['RV_TEMPLATES','aiApplyWebSearch','aiDesCardDefinitions','escapeHtml',
         'exportMD','moveFw','neuOn','sampleDataLegacy','wasEditing']
APPLY = '--apply' in sys.argv

src = io.open(TARGET, 'r', encoding='utf-8', newline='').read()
lines = src.split('\n')


def scan_end(start):
    """从 start 行开始，返回该语句结束的行号（含）。感知字符串/模板串/注释。

    规则：优先以「首个 depth-0 的 { ... } 配对」为边界；若在遇到 { 之前先遇到
    depth-0 的 ';'，说明这是无花括号的单行语句（如 var x=y;），立即收尾——
    否则会把后面的兄弟语句一并吞掉。
    """
    depth = 0
    seen_open = False
    i = start
    while i < len(lines):
        line = lines[i]
        j = 0
        quote = None
        while j < len(line):
            c = line[j]
            if quote:
                if c == '\\':
                    j += 2
                    continue
                if c == quote:
                    quote = None
                j += 1
                continue
            if c in '"\'`':
                quote = c
                j += 1
                continue
            if c == '/' and j + 1 < len(line):
                nxt = line[j + 1]
                if nxt == '/':
                    break
                if nxt == '*':
                    end = line.find('*/', j + 2)
                    if end == -1:
                        k = i + 1
                        while k < len(lines) and '*/' not in lines[k]:
                            k += 1
                        if k >= len(lines):
                            return len(lines) - 1
                        i = k
                        line = lines[i]
                        j = line.find('*/') + 2
                        continue
                    j = end + 2
                    continue
            if c == '{':
                depth += 1
                seen_open = True
            elif c == '}':
                depth -= 1
                if seen_open and depth == 0:
                    return i
            elif c == ';' and not seen_open and depth == 0:
                return i                     # 无花括号的单行语句，就此收尾
            j += 1
        i += 1
    return len(lines) - 1


jobs, skipped = [], []
for name in NAMES:
    pat = re.compile(r'^\s*(?:const|let|var|function)\s+' + re.escape(name) + r'\b')
    idxs = [i for i, l in enumerate(lines) if pat.match(l)]
    if len(idxs) != 1:
        skipped.append((name, f'匹配到 {len(idxs)} 处定义'))
        continue
    s = idxs[0]
    e = scan_end(s)
    jobs.append((s, e, name))

print('=== 计划删除 ===')
total = 0
for s, e, name in sorted(jobs):
    chunk = '\n'.join(lines[s:e + 1])
    total += len(chunk)
    print(f'{name:24s} 行 {s+1:>5}-{e+1:<5} ({e-s+1:>3} 行 / {len(chunk):>6} 字符)  {lines[s].strip()[:70]}')
print(f'\n合计 {len(jobs)} 处 / 约 {total/1024:.1f} KB')
if skipped:
    print('跳过:', skipped)

if not APPLY:
    print('\n[DRY-RUN] 未修改文件。加 --apply 执行删除。')
    sys.exit(0)

# 从后往前删，避免行号漂移
for s, e, name in sorted(jobs, key=lambda x: -x[0]):
    del lines[s:e + 1]

out = '\n'.join(lines)
io.open(TARGET, 'w', encoding='utf-8', newline='').write(out)
print(f'\n[APPLIED] 已删除 {len(jobs)} 处；文件 {len(src)/1024:.1f} KB -> {len(out)/1024:.1f} KB')
