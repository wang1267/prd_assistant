// 宣传片构建脚本 v1 —— 明暗混剪 · 静音 · 20s · 1920x1080
// 素材为 fullPage 长图，按 16:9 裁取核心首屏区，做 Ken Burns 缓慢平移+缩放
import { execFileSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FFMPEG = 'C:/Users/xlq/AppData/Local/Temp/ffmpeg_dl/extracted/ffmpeg-9.0.1-essentials_build/bin/ffmpeg.exe';
const SHOTS = path.join(__dirname, 'shots');
const OUT = path.join(__dirname, 'build');
fs.mkdirSync(OUT, { recursive: true });

const W = 1920, H = 1080;
const FPS = 25;

// 工具：运行 ffmpeg
function ff(args) {
  console.log('[ffmpeg]', args.join(' ').slice(0, 120));
  execFileSync(FFMPEG, args, { stdio: 'ignore' });
}

// 把一张长图裁成 16:9 核心区，并做 Ken Burns（缓慢平移+缩放），生成一段 mp4
// 参数: src, dst, dur, zoomFrom, zoomTo, panX (0..1 起点), panY, fadeIn, fadeOut
function makeClip({ src, dst, dur, zFrom = 1.0, zTo = 1.12, panX = 0.5, panY = 0.5, fade = 0.4 }) {
  const total = Math.round(dur * FPS);
  // zoompan 本 build 不支持在 x/y 中引用 z 变量，也不支持 min()。
  // 策略：zoom 用常量（取 zFrom~zTo 均值，轻微放大防像素化），平移用 on 线性移动。
  const z = ((zFrom + zTo) / 2).toFixed(3);
  const panX2 = (panX < 0.5 ? panX + 0.12 : panX - 0.12).toFixed(3);
  const panY2 = (panY < 0.5 ? panY + 0.12 : panY - 0.12).toFixed(3);
  // x/y 基于 on 缓慢平移，乘 (iw - iw/z) 预留 zoom 边距避免黑边
  const xExpr = `(${panX} + (${panX2}-${panX})*on/${total})*(iw-iw/${z})`;
  const yExpr = `(${panY} + (${panY2}-${panY})*on/${total})*(ih-ih/${z})`;
  const filter =
    `scale=${W}:-1,` +
    `crop=${W}:${H}:0:0,` +
    `zoompan=z='${z}':d=${total}:x='${xExpr}':y='${yExpr}':s=${W}x${H}:fps=${FPS}`;
  const fa = fade > 0
    ? `,fade=t=in:st=0:d=${fade},fade=t=out:st=${(dur - fade).toFixed(2)}:d=${fade}`
    : '';
  ff([
    '-y', '-i', src,
    '-vf', filter + fa,
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-r', String(FPS),
    '-preset', 'medium', '-crf', '20',
    '-an', dst,
  ]);
}

// 字幕叠加：在已有 clip 上 burn 字幕（用 drawtext，白色描边）
function addCaption(src, dst, text, sub) {
  const safe = text.replace(/:/g, '\\:');
  const subSafe = (sub || '').replace(/:/g, '\\:');
  const draw =
    `drawtext=text='${safe}':fontcolor=white:fontsize=54:fontfile='C\\:/Windows/Fonts/msyh.ttc':` +
    `borderw=3:bordercolor=black:x=(w-text_w)/2:y=h-text_h-90` +
    (subSafe
      ? `,drawtext=text='${subSafe}':fontcolor=white@0.85:fontsize=30:fontfile='C\\:/Windows/Fonts/msyh.ttc':` +
        `borderw=2:bordercolor=black:x=(w-text_w)/2:y=h-text_h-50`
      : '');
  ff(['-y', '-i', src, '-vf', draw, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'medium', '-crf', '20', '-an', dst]);
}

// ============ 分镜 ============
// 1. styleframe 起（2.5s）
// 2. light-full 首屏 → 全生命周期（3.5s）
// 3. dark-main 核心面板 → 撰写体检优化（3.5s）  ← 含完成编辑的面板
// 4. light-main 中部聚焦 → AI可见即可做（3.5s）
// 5. dark-full 拉远 → 干净专业可溯源（3.5s）
// 6. styleframe 收尾（3.5s）
const clips = [];
function step(name, fn) { fn(); clips.push(name); }

step('c1_style_open', () => makeClip({ src: path.join(__dirname, 'styleframe.png'), dst: path.join(OUT, 'c1.mp4'), dur: 2.5, zFrom: 1.06, zTo: 1.0, panX: 0.5, panY: 0.5, fade: 0.3 }));
step('c2_light_full', () => makeClip({ src: path.join(SHOTS, 'light-full.png'), dst: path.join(OUT, 'c2.mp4'), dur: 3.5, zFrom: 1.0, zTo: 1.15, panX: 0.5, panY: 0.15, fade: 0.4 }));
step('c3_dark_main',  () => makeClip({ src: path.join(SHOTS, 'dark-main.png'),  dst: path.join(OUT, 'c3.mp4'), dur: 3.5, zFrom: 1.0, zTo: 1.14, panX: 0.5, panY: 0.2,  fade: 0.4 }));
step('c4_light_main', () => makeClip({ src: path.join(SHOTS, 'light-main.png'), dst: path.join(OUT, 'c4.mp4'), dur: 3.5, zFrom: 1.05, zTo: 1.0, panX: 0.5, panY: 0.5, fade: 0.4 }));
step('c5_dark_full',  () => makeClip({ src: path.join(SHOTS, 'dark-full.png'),  dst: path.join(OUT, 'c5.mp4'), dur: 3.5, zFrom: 1.15, zTo: 1.0, panX: 0.5, panY: 0.1, fade: 0.4 }));
step('c6_style_end',  () => makeClip({ src: path.join(__dirname, 'styleframe.png'), dst: path.join(OUT, 'c6.mp4'), dur: 3.5, zFrom: 1.0, zTo: 1.08, panX: 0.5, panY: 0.5, fade: 0.4 }));

// 字幕
addCaption(path.join(OUT, 'c1.mp4'), path.join(OUT, 'c1c.mp4'), 'PMHub', 'PRD · 健康度 · AI 协同');
addCaption(path.join(OUT, 'c2.mp4'), path.join(OUT, 'c2c.mp4'), '一份文档，全生命周期', '从草稿到发布的完整管理');
addCaption(path.join(OUT, 'c3.mp4'), path.join(OUT, 'c3c.mp4'), '撰写 · 体检 · 优化 · 结构对齐', '完成编辑即出健康报告');
addCaption(path.join(OUT, 'c4.mp4'), path.join(OUT, 'c4c.mp4'), 'AI 可见即可做', '多角色评审 · 一键接受');
addCaption(path.join(OUT, 'c5.mp4'), path.join(OUT, 'c5c.mp4'), '干净 · 专业 · 可溯源', '');
addCaption(path.join(OUT, 'c6.mp4'), path.join(OUT, 'c6c.mp4'), 'PMHub', '让每一份 PRD 都经得起评审');

// 拼接清单
const list = path.join(OUT, 'concat.txt');
const order = ['c1c', 'c2c', 'c3c', 'c4c', 'c5c', 'c6c'];
fs.writeFileSync(list, order.map((n) => `file '${path.join(OUT, n + '.mp4').replace(/\\/g, '/')}'`).join('\n'));

// 交叉溶解转场：用 filter_complex 在每段之间加 0.4s xfade
// 简化：直接 concat（已带 fade in/out，视觉上足够连贯）
ff([
  '-y', '-f', 'concat', '-safe', '0', '-i', list,
  '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'medium', '-crf', '20', '-an',
  path.join(OUT, 'promo_final.mp4'),
]);

console.log('VIDEO_BUILD_DONE:', path.join(OUT, 'promo_final.mp4'));
