// Prepare only the public application assets for Sites hosting.
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const output = path.join(root, 'out');
if (fs.existsSync(output)) {
  if (fs.realpathSync(output) !== output || path.dirname(output) !== root) {
    throw new Error('Static output must be the project out directory');
  }
  fs.rmSync(output, { recursive: true });
}
fs.mkdirSync(output);
const files = execFileSync('git', ['ls-files', '-z', '--', 'index.html', 'PMHub.html', 'PRD智能看板.html', 'assets', 'src/prd-prototype.js', 'prototype'], { cwd: root, encoding: 'utf8' }).split('\0').filter(Boolean);
for (const relative of files) {
  const source = path.join(root, relative);
  if (!fs.lstatSync(source).isFile()) throw new Error('Expected regular asset: ' + relative);
  const target = path.join(output, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
}
if (!fs.existsSync(path.join(output, 'index.html'))) throw new Error('Missing site entry');
console.log(`Sites static output ready: ${files.length} files`);
