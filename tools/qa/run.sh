#!/usr/bin/env bash
# PMHub 产品工作台 —— QA 脚本运行器
#
# 用法：
#   bash tools/qa/run.sh qa-1-basics.mjs
#   bash tools/qa/run.sh qa-2-export-a11y.mjs
#   bash tools/qa/run.sh qa-3-undo-roundtrip.mjs
#   bash tools/qa/run.sh probe-a11y.mjs
#
# 说明：puppeteer 安装在 tools/prd-promo-video/node_modules，
#       ESM 只会从脚本自身所在目录向上找依赖，因此这里先把脚本
#       复制到该目录再执行。产物输出到 tools/_qa_out*。
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET="$(cd "$HERE/../prd-promo-video" && pwd)"
SCRIPT="${1:?请指定要运行的脚本名，例如 qa-1-basics.mjs}"

if [ ! -f "$HERE/$SCRIPT" ]; then
  echo "找不到 $HERE/$SCRIPT"
  echo "可用脚本："
  ls -1 "$HERE"/*.mjs 2>/dev/null | sed 's|.*/|  |'
  exit 1
fi

cp "$HERE/$SCRIPT" "$TARGET/_qa_run.mjs"
trap 'rm -f "$TARGET/_qa_run.mjs"' EXIT
cd "$TARGET" && node _qa_run.mjs
