// 从唯一主文件提取测试副本，避免回归测试落在历史代码上。
// 运行：node tools/sync_test_blocks.js
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const appFile = path.join(root, 'PMHub.html');
const html = fs.readFileSync(appFile, 'utf8');

function scriptBodyById(id) {
  const pattern = new RegExp(`<script\\s+[^>]*\\bid=["']${id}["'][^>]*>([\\s\\S]*?)<\\/script>`, 'i');
  const match = html.match(pattern);
  if (!match) throw new Error(`未找到 script#${id}`);
  return match[1];
}

const block1Start = html.indexOf('/* ============ SVG 图标常量');
const block1End = html.indexOf('</script>', block1Start);
if (block1Start < 0 || block1End < 0) throw new Error('未找到主脚本 block1');

const block1 = html.slice(block1Start, block1End);
const aiController = scriptBodyById('ai-controller');
const targets = [
  [path.join(root, 'tools', 'block1.js'), block1],
  [path.join(root, 'tools', 'ai-controller.js'), aiController],
];

for (const [file, content] of targets) {
  fs.writeFileSync(file, content, 'utf8');
  console.log(`已同步 ${path.relative(root, file)}（${Buffer.byteLength(content)} bytes）`);
}
