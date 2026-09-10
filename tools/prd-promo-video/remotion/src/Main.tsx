import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, interpolate, Easing } from 'remotion';
import { PageCam, CamKey } from './PageCam';
import layout from './live-layout.json';

// ===========================================================================
// 需求文档工作台 · 宣传片 v3
// 9 shots · ~32.5s · 1920×1080 · 30fps · SFX only
// 变更：删除帮助镜头 / 新增初始页·导入导出·AI聊天框 / 创作PRD为重点 / 主题切换更自然并加文案
// 所有 PageCam 保持 FLAT 2D（无 3D rotate/zoom CSS），兼容 headless 渲染
// ===========================================================================

// --- design tokens --------------------------------------------------------
const C = {
  brand: '#1f3a45',
  accent: '#1b4fd6',
  danger: '#d64545',
  ok: '#2fa84f',
  warn: '#ECC94B',
  ai: '#6C63FF',
  ai2: '#8B84FF',
  paper: '#faf9f7',
  paper2: '#f0eee9',
  paper3: '#e4e1da',
  dark: '#26241f',
  dark2: '#1e1c18',
};
const SANS = 'system-ui, -apple-system, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';
const MONO = 'ui-monospace, SFMono-Regular, Menlo, "Cascadia Code", monospace';

// --- frame timeline (absolute, 30fps) --------------------------------------
export const SHOTS = {
  brand:  { from: 0,   duration: 90 },
  init:   { from: 90,  duration: 90 },
  create: { from: 180, duration: 165 },
  io:     { from: 345, duration: 120 },
  aichat: { from: 465, duration: 120 },
  health: { from: 585, duration: 75 },
  theme:  { from: 660, duration: 150 },
  review: { from: 810, duration: 75 },
  outro:  { from: 885, duration: 90 },
} as const;
export const TOTAL = 975;

const PAGE_LIGHT_H = (layout as any).light.pageH as number;
const PAGE_DARK_H = (layout as any).dark.pageH as number;

// --- easing presets -------------------------------------------------------
const easeOut = Easing.bezier(0.33, 0, 0.15, 1);
const easeInOut = Easing.bezier(0.35, 0, 0.2, 1);
const easePop = Easing.bezier(0.2, 0.9, 0.3, 1);
const easeTheme = Easing.bezier(0.45, 0, 0.55, 1);

// --- helper: 光效层 --------------------------------------------------------
const GlowOverlay: React.FC<{ x: number; y: number; r: number; color: string; opacity: number; soft?: number }> = ({ x, y, r, color, opacity, soft = 0.6 }) => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(${r}px ${r * soft}px at ${x}% ${y}%, ${color}, transparent 70%)`,
      pointerEvents: 'none',
      opacity,
    }}
  />
);

// --- helper: 字幕卡片（相对 shot 帧） --------------------------------------
const Caption: React.FC<{
  title: string;
  sub?: string;
  showAt: number;
  hideAt?: number;
  accent?: string;
}> = ({ title, sub, showAt, hideAt, accent = C.accent }) => {
  const frame = useCurrentFrame();
  const end = hideAt ?? 9999;
  const inT = interpolate(frame, [showAt, showAt + 16], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easePop });
  const outT = end < 9990 ? interpolate(frame, [end - 14, end], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) : 1;
  const vis = inT * outT;
  if (vis < 0.01) return null;
  return (
    <div
      style={{
        position: 'absolute', left: '50%', bottom: 88,
        transform: `translate(-50%, 0) translateY(${(1 - inT) * 18}px) scale(${0.96 + 0.04 * inT})`,
        opacity: vis,
        textAlign: 'center', fontFamily: SANS, pointerEvents: 'none',
        background: 'rgba(255,255,255,0.92)', border: `1.5px solid ${accent}`,
        borderRadius: 18, padding: '18px 28px', boxShadow: `0 14px 40px rgba(31,58,69,0.16)`,
      }}
    >
      <div style={{ fontSize: 30, fontWeight: 700, color: C.brand, letterSpacing: '-0.01em', lineHeight: 1.15 }}>{title}</div>
      {sub ? <div style={{ fontSize: 17, color: accent, marginTop: 8, letterSpacing: '0.02em' }}>{sub}</div> : null}
    </div>
  );
};

// ===========================================================================
// SHOT 1 — 品牌开场 (spotlight-hero-card)
// 从全页鸟瞰推近到顶栏+首屏
// 页状态：light-editor
// ===========================================================================
const BrandOpen: React.FC = () => {
  const frame = useCurrentFrame();
  const d = SHOTS.brand.duration;

  const CAM: CamKey[] = [
    { frame: 0,   cx: 960, cy: 4200, zoom: 0.28 },
    { frame: 20,  cx: 960, cy: 4200, zoom: 0.28 },
    { frame: 52,  cx: 960, cy: 420,  zoom: 0.86 },
    { frame: 70,  cx: 960, cy: 420,  zoom: 0.92 },
    { frame: d - 8, cx: 960, cy: 720,  zoom: 0.58 },
    { frame: d,   cx: 960, cy: 720,  zoom: 0.58 },
  ];

  const spotOn = interpolate(frame, [0, 8], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const spotX = interpolate(frame, [0, 20, 52], [70, 50, 50], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const spotY = interpolate(frame, [0, 20, 52], [45, 36, 16], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const poolR = interpolate(frame, [20, 52], [480, 300], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const edgeOn = frame >= 52 && frame <= 70;
  const edgeProg = interpolate(frame, [52, 70], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easeInOut });

  const outT = interpolate(frame, [d - 10, d], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const titleIn = interpolate(frame, [4, 22], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easePop });
  const titleOut = interpolate(frame, [38, 52], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const titleVis = titleIn * titleOut;

  return (
    <AbsoluteFill style={{ backgroundColor: C.paper, opacity: 1 - outT }}>
      <PageCam src="textures/live/light-editor.png" pageH={PAGE_LIGHT_H} keys={CAM} ease={easeOut} />
      <GlowOverlay x={spotX} y={spotY} r={poolR} color="rgba(255,248,232,0.45)" opacity={0.85 * spotOn} soft={0.5} />
      {edgeOn ? (
        <div
          style={{
            position: 'absolute', left: '50%', top: '16%',
            width: 760, height: 4, borderRadius: 2,
            background: `linear-gradient(90deg, transparent, ${C.warn}, ${C.ai}, ${C.accent}, transparent)`,
            opacity: 0.9,
            transform: `translateX(-50%) scaleX(${edgeProg})`,
            filter: 'drop-shadow(0 0 8px rgba(236,201,75,0.6))',
            pointerEvents: 'none',
          }}
        />
      ) : null}
      {titleVis > 0.01 ? (
        <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', pointerEvents: 'none', opacity: titleVis }}>
          <div style={{ textAlign: 'center', fontFamily: SANS }}>
            <div style={{ fontSize: 110, fontWeight: 700, color: C.brand, letterSpacing: '-0.01em', lineHeight: 1 }}>需求文档工作台</div>
            <div style={{ fontSize: 26, color: C.accent, marginTop: 18, letterSpacing: '0.1em' }}>PRD · AI · 评审 · 一体化</div>
          </div>
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};

// ===========================================================================
// SHOT 2 — 初始页 (clean-landing)
// 展示无 sample 注入的自然首屏
// 页状态：light-init
// ===========================================================================
const InitialPage: React.FC = () => {
  const frame = useCurrentFrame();
  const d = SHOTS.init.duration;

  const CAM: CamKey[] = [
    { frame: 0,  cx: 960, cy: 540, zoom: 1.0 },
    { frame: 30, cx: 960, cy: 540, zoom: 1.05 },
    { frame: d, cx: 960, cy: 540, zoom: 1.02 },
  ];

  const glowOp = interpolate(frame, [10, 40], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const outT = interpolate(frame, [d - 12, d], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ backgroundColor: C.paper, opacity: 1 - outT }}>
      <PageCam src="textures/live/light-init.png" pageH={1080} keys={CAM} ease={easeOut} />
      <GlowOverlay x={50} y={55} r={520} color="rgba(255,248,232,0.55)" opacity={0.7 * glowOp} soft={0.55} />
      <Caption title="首次打开，干净起步" sub="空白项目、导入草稿，或加载示例" showAt={18} hideAt={d - 8} />
    </AbsoluteFill>
  );
};

// ===========================================================================
// SHOT 3 — 创作 PRD (scroll-through-structure) · 核心重点
// 长页 light-editor 缓慢下行，展示完整 PRD 结构
// ===========================================================================
const CreatePRD: React.FC = () => {
  const frame = useCurrentFrame();
  const d = SHOTS.create.duration;

  const CAM: CamKey[] = [
    { frame: 0,    cx: 960, cy: 420,  zoom: 0.92 },
    { frame: 45,   cx: 960, cy: 420,  zoom: 0.92 },
    { frame: 90,   cx: 960, cy: 1650, zoom: 0.80 },
    { frame: 135,  cx: 960, cy: 3200, zoom: 0.72 },
    { frame: d,    cx: 960, cy: 4800, zoom: 0.66 },
  ];

  const outT = interpolate(frame, [d - 14, d], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // 章节高亮提示卡（依次浮现）
  const sections = [
    { label: '背景与目标',    at: 28,  x: 1240, y: 360 },
    { label: '范围与角色',    at: 55,  x: 360,  y: 900 },
    { label: '功能需求',      at: 82,  x: 1320, y: 1600 },
    { label: '验收标准',      at: 108, x: 420,  y: 2400 },
    { label: '风险与迭代',    at: 132, x: 1180, y: 3600 },
  ];

  return (
    <AbsoluteFill style={{ backgroundColor: C.paper, opacity: 1 - outT }}>
      <PageCam src="textures/live/light-editor.png" pageH={PAGE_LIGHT_H} keys={CAM} ease={easeInOut}>
        {sections.map((s, i) => {
          const tIn = interpolate(frame, [s.at, s.at + 16], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easePop });
          const tOut = interpolate(frame, [s.at + 36, s.at + 50], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const t = tIn * tOut;
          if (t < 0.01) return null;
          return (
            <div
              key={i}
              style={{
                position: 'absolute', left: s.x, top: s.y,
                transform: `translate(-50%, -50%) scale(${0.9 + 0.1 * t})`,
                opacity: t,
                fontFamily: SANS, fontSize: 18, fontWeight: 600, color: C.brand,
                background: 'rgba(255,255,255,0.94)', border: `1.5px solid ${C.accent}`,
                borderRadius: 12, padding: '10px 16px', boxShadow: '0 8px 24px rgba(27,79,214,0.14)',
                pointerEvents: 'none',
              }}
            >
              {s.label}
            </div>
          );
        })}
      </PageCam>
      <Caption title="创作 PRD，从这里开始" sub="背景、目标、范围、验收、风险 · 结构完整" showAt={18} hideAt={d - 10} accent={C.accent} />
    </AbsoluteFill>
  );
};

// ===========================================================================
// SHOT 4 — 导入与导出 (io-wipe)
// 导入下拉 → 导出下拉
// ===========================================================================
const ImportExport: React.FC = () => {
  const frame = useCurrentFrame();
  const d = SHOTS.io.duration;

  const switchAt = 55;
  const reveal = interpolate(frame, [switchAt, switchAt + 28], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easeTheme });
  const outT = interpolate(frame, [d - 12, d], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ backgroundColor: C.paper, opacity: 1 - outT }}>
      {/* 导入层 */}
      <AbsoluteFill style={{ opacity: 1 - reveal }}>
        <PageCam src="textures/live/light-implant.png" pageH={1080} keys={[{ frame: 0, cx: 960, cy: 540, zoom: 1.0 }, { frame: d, cx: 960, cy: 540, zoom: 1.03 }]} ease={easeOut} />
      </AbsoluteFill>
      {/* 导出层 */}
      <AbsoluteFill style={{ opacity: reveal }}>
        <PageCam src="textures/live/light-exportdd.png" pageH={1080} keys={[{ frame: 0, cx: 960, cy: 540, zoom: 1.0 }, { frame: d, cx: 960, cy: 540, zoom: 1.03 }]} ease={easeOut} />
      </AbsoluteFill>
      {/* 过渡光带 */}
      <div
        style={{
          position: 'absolute', left: 0, top: 0, width: '45%', height: '100%',
          background: `linear-gradient(100deg, transparent, rgba(27,79,214,0.35), rgba(108,99,255,0.25), transparent)`,
          transform: `translateX(${interpolate(frame, [switchAt, switchAt + 40], [-50, 140], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })}%)`,
          opacity: frame > switchAt - 10 && frame < switchAt + 50 ? 0.85 : 0,
          filter: 'blur(2px)', pointerEvents: 'none', mixBlendMode: 'screen',
        }}
      />
      <Caption title="导入草稿 · 导出交付" sub="支持 Markdown / Word / HTML" showAt={12} hideAt={d - 8} accent={C.accent} />
    </AbsoluteFill>
  );
};

// ===========================================================================
// SHOT 5 — AI 助手聊天框 (ai-float-reply)
// 展示 AI 浮动面板与对话
// ===========================================================================
const AIChat: React.FC = () => {
  const frame = useCurrentFrame();
  const d = SHOTS.aichat.duration;

  const CAM: CamKey[] = [
    { frame: 0,  cx: 1100, cy: 600, zoom: 1.0 },
    { frame: 45, cx: 1460, cy: 680, zoom: 1.18 },
    { frame: d,  cx: 1460, cy: 680, zoom: 1.18 },
  ];

  const panelPulse = interpolate(frame, [20, 40, 60], [0, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easeInOut });
  const outT = interpolate(frame, [d - 12, d], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ backgroundColor: C.paper, opacity: 1 - outT }}>
      <PageCam src="textures/live/light-aichat.png" pageH={1080} keys={CAM} ease={easeOut}>
        {/* 高亮 AI 聊天面板区域 */}
        <div
          style={{
            position: 'absolute', left: 1180, top: 420, width: 640, height: 560,
            borderRadius: 24,
            border: `2px solid rgba(108,99,255,${0.35 + 0.35 * panelPulse})`,
            background: `rgba(108,99,255,${0.04 + 0.06 * panelPulse})`,
            boxShadow: `0 0 ${40 + 30 * panelPulse}px rgba(108,99,255,${0.15 + 0.15 * panelPulse})`,
            opacity: 0.7 + 0.3 * panelPulse,
            pointerEvents: 'none',
          }}
        />
      </PageCam>
      <GlowOverlay x={72} y={62} r={340} color="rgba(108,99,255,0.22)" opacity={0.85 * (frame > 30 ? 1 : 0)} soft={0.5} />
      <Caption title="AI 助手随时对话" sub="补结构、写验收、标风险 · 一问就有" showAt={16} hideAt={d - 8} accent={C.ai} />
    </AbsoluteFill>
  );
};

// ===========================================================================
// SHOT 6 — AI 体检 (gauge-readout) · 弱化
// 健康度环 0→92% 填充，指标卡依次点亮
// ===========================================================================
const HealthCheck: React.FC = () => {
  const frame = useCurrentFrame();
  const d = SHOTS.health.duration;

  const CAM: CamKey[] = [
    { frame: 0, cx: 960, cy: 450, zoom: 0.95 },
    { frame: d, cx: 960, cy: 450, zoom: 1.02 },
  ];

  const ringT = interpolate(frame, [12, 50], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.2, 0.8, 0.3, 1) });
  const ringAngle = ringT * 2 * Math.PI * 0.75;
  const pct = Math.round(ringT * 92);

  const YOFF = 200;
  const cardCenters = [ { x: 520, y: 420 - YOFF, c: C.danger }, { x: 760, y: 420 - YOFF, c: C.warn }, { x: 1000, y: 420 - YOFF, c: C.ok } ];
  const cardDelays = [32, 42, 52];

  const outT = interpolate(frame, [d - 10, d], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ backgroundColor: C.paper, opacity: 1 - outT }}>
      <PageCam src="textures/live/light-crop-health.png" pageH={800} keys={CAM} ease={easeOut}>
        <div style={{ position: 'absolute', left: 360, top: 360 - YOFF }}>
          <svg width={220} height={220} viewBox="0 0 220 220">
            <circle cx={110} cy={110} r={92} fill="none" stroke={C.paper3} strokeWidth={16} />
            <circle
              cx={110} cy={110} r={92} fill="none" stroke={C.ok} strokeWidth={16} strokeLinecap="round"
              strokeDasharray={`${ringAngle * 92} ${2 * Math.PI * 92}`}
              transform="rotate(135 110 110)"
              style={{ filter: 'drop-shadow(0 0 8px rgba(47,168,79,0.5))' }}
            />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: MONO, fontSize: 56, fontWeight: 700, color: C.brand }}>
            {pct}%
          </div>
        </div>
        {cardCenters.map((cc, i) => {
          const del = cardDelays[i];
          const t = interpolate(frame, [del, del + 12], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easePop });
          return (
            <div
              key={i}
              style={{
                position: 'absolute', left: cc.x - 70, top: cc.y - 30, width: 140, height: 60,
                borderRadius: 12, border: `1.5px solid ${cc.c}`,
                background: 'rgba(255,255,255,0.9)',
                opacity: t, transform: `scale(${0.85 + 0.15 * t})`,
                boxShadow: `0 6px 20px ${cc.c}33`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: SANS, fontSize: 18, color: C.brand,
              }}
            >
              {['缺口', '待对齐', '达标'][i]}
            </div>
          );
        })}
      </PageCam>
      <Caption title="实时健康度" sub="一眼看清风险与缺口" showAt={14} hideAt={d - 8} accent={C.ok} />
    </AbsoluteFill>
  );
};

// ===========================================================================
// SHOT 7 — 主题切换 (theme-switch-natural)
// 柔和转场 + 明确说明「支持切换你喜欢的主题」
// light-crop-theme → dark-crop-theme
// ===========================================================================
const ThemeSwitch: React.FC = () => {
  const frame = useCurrentFrame();
  const d = SHOTS.theme.duration;

  const CAM: CamKey[] = [
    { frame: 0, cx: 960, cy: 450, zoom: 1.2 },
    { frame: d / 2, cx: 960, cy: 450, zoom: 1.24 },
    { frame: d, cx: 960, cy: 450, zoom: 1.22 },
  ];

  // 暗色层渐进：用 easeTheme 让中间段更果断，减少" muddy "感
  const cross = interpolate(frame, [20, 90], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easeTheme });
  // 切换瞬间压暗（像眨眼/开关灯），让过渡更自然
  const dip = interpolate(frame, [45, 65, 80], [0, 0.42, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easeInOut });
  // 光晕绽放
  const bloom = interpolate(frame, [50, 95], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easeOut });
  const bloomOut = interpolate(frame, [95, 135], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const bloomOp = bloom * bloomOut;

  // 光带横扫（装饰动势）
  const sweepT = interpolate(frame, [30, 110], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easeInOut });

  // 文案
  const capIn = interpolate(frame, [100, 120], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easePop });

  return (
    <AbsoluteFill style={{ backgroundColor: C.dark2 }}>
      {/* 浅色底 */}
      <AbsoluteFill style={{ opacity: 1 - cross }}>
        <PageCam src="textures/live/light-crop-theme.png" pageH={900} keys={CAM} />
      </AbsoluteFill>
      {/* 暗色层 */}
      <AbsoluteFill style={{ opacity: cross }}>
        <PageCam src="textures/live/dark-crop-theme.png" pageH={900} keys={CAM} />
      </AbsoluteFill>

      {/* 压暗闪烁：制造"开关"的重量感 */}
      <AbsoluteFill style={{ backgroundColor: '#000', opacity: dip, pointerEvents: 'none' }} />

      {/* 切换光晕 */}
      <GlowOverlay x={72} y={18} r={360} color="rgba(139,132,255,0.35)" opacity={0.85 * bloomOp} soft={0.45} />
      <GlowOverlay x={72} y={18} r={220} color="rgba(255,255,255,0.25)" opacity={0.7 * bloomOp} soft={0.35} />

      {/* 装饰光带 */}
      <div
        style={{
          position: 'absolute', left: 0, top: 0, width: '38%', height: '100%',
          background: `linear-gradient(100deg, transparent, rgba(139,132,255,0.45), rgba(27,79,214,0.30), transparent)`,
          transform: `translateX(${sweepT * 260 - 40}%)`,
          filter: 'blur(3px)', opacity: 0.85, pointerEvents: 'none', mixBlendMode: 'screen',
        }}
      />

      {/* 文案说明 */}
      {capIn > 0.01 ? (
        <div
          style={{
            position: 'absolute', left: '50%', bottom: 96,
            transform: `translate(-50%, 0) translateY(${(1 - capIn) * 20}px) scale(${0.96 + 0.04 * capIn})`,
            opacity: capIn,
            textAlign: 'center', fontFamily: SANS, pointerEvents: 'none',
            background: 'rgba(38,36,31,0.88)', border: `1.5px solid ${C.ai2}`,
            borderRadius: 18, padding: '18px 30px', boxShadow: `0 14px 40px rgba(0,0,0,0.35)`,
          }}
        >
          <div style={{ fontSize: 32, fontWeight: 700, color: '#fff', letterSpacing: '-0.01em' }}>支持切换你喜欢的主题</div>
          <div style={{ fontSize: 18, color: C.ai2, marginTop: 8, letterSpacing: '0.04em' }}>深色 / 浅色 · 随心定义你的工作台</div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// ===========================================================================
// SHOT 8 — 多角色评审 (glow-flyline)
// 暗色 review 面板 + 节点连线
// ===========================================================================
const Review: React.FC = () => {
  const frame = useCurrentFrame();
  const d = SHOTS.review.duration;

  const CAM: CamKey[] = [
    { frame: 0, cx: 960, cy: 540, zoom: 0.96 },
    { frame: d, cx: 960, cy: 540, zoom: 1.04 },
  ];

  const nodes = [
    { x: 500, y: 480, c: C.ai },
    { x: 820, y: 360, c: C.accent },
    { x: 1120, y: 560, c: C.ok },
    { x: 1420, y: 420, c: C.warn },
  ];
  const edges = [ [0,1],[1,2],[2,3],[0,2] ];

  const pulseT = interpolate(frame, [10, 50], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.linear });
  const pulse = (a: {x:number;y:number}, b: {x:number;y:number}) => ({ x: a.x + (b.x - a.x) * pulseT, y: a.y + (b.y - a.y) * pulseT });

  const outT = interpolate(frame, [d - 10, d], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ backgroundColor: C.dark2, opacity: 1 - outT }}>
      <PageCam src="textures/live/dark-review.png" pageH={1080} keys={CAM} ease={easeOut}>
        <svg style={{ position: 'absolute', inset: 0, width: 1920, height: 1080, pointerEvents: 'none' }}>
          {edges.map((e, i) => {
            const a = nodes[e[0]], b = nodes[e[1]];
            const t = interpolate(frame, [6 + i * 4, 22 + i * 4], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
            return (
              <line key={i} x1={a.x} y1={a.y} x2={a.x + (b.x - a.x) * t} y2={a.y + (b.y - a.y) * t}
                stroke={C.ai2} strokeWidth={2.5} strokeLinecap="round" opacity={0.7}
                style={{ filter: 'drop-shadow(0 0 6px rgba(139,132,255,0.6))' }} />
            );
          })}
        </svg>
        {pulseT < 1 ? (() => { const p = pulse(nodes[0], nodes[2]); return (
          <div style={{ position: 'absolute', left: p.x, top: p.y, width: 14, height: 14, marginLeft: -7, marginTop: -7, borderRadius: '50%', background: '#fff', boxShadow: `0 0 16px 4px ${C.ai2}` }} />
        ); })() : null}
        {nodes.map((n, i) => {
          const t = interpolate(frame, [4 + i * 3, 18 + i * 3], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easePop });
          return (
            <div key={i} style={{ position: 'absolute', left: n.x - 16, top: n.y - 16, width: 32, height: 32, borderRadius: '50%', background: n.c, opacity: t, transform: `scale(${0.7 + 0.3 * t})`, boxShadow: `0 0 18px 3px ${n.c}` }} />
          );
        })}
      </PageCam>
      <Caption title="多角色评审" sub="产品 · 研发 · 测试 · 设计 · 五视角找缺口" showAt={10} hideAt={d - 8} accent={C.ai2} />
    </AbsoluteFill>
  );
};

// ===========================================================================
// SHOT 9 — 结尾定格 (outro-lockup)
// 功能标签飞入围住字标，舞台光升起
// ===========================================================================
const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const d = SHOTS.outro.duration;

  const liftT = interpolate(frame, [0, 34], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easeInOut });
  const stageGlow = interpolate(frame, [0, 24, d], [0, 1, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const items = [
    { a: 0,    label: '创作 PRD', c: C.accent },
    { a: 60,   label: '导入导出', c: C.accent },
    { a: 120,  label: 'AI 助手', c: C.ai },
    { a: 190,  label: '多角色评审', c: C.warn },
    { a: 260,  label: '主题切换', c: C.ai2 },
  ];
  const R = 230;

  const lockup = interpolate(frame, [14, 40], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easePop });

  return (
    <AbsoluteFill style={{ backgroundColor: `rgb(${Math.round(38 + (250 - 38) * liftT)}, ${Math.round(36 + (249 - 36) * liftT)}, ${Math.round(31 + (247 - 31) * liftT)})` }}>
      <GlowOverlay x={50} y={46} r={480} color="rgba(255,248,232,0.5)" opacity={stageGlow * 0.9} soft={0.6} />

      {items.map((it, i) => {
        const ang = (it.a) * Math.PI / 180 - Math.PI / 2;
        const tx = 960 + Math.cos(ang) * R;
        const ty = 540 + Math.sin(ang) * R;
        const sx = 960 + Math.cos(ang) * (R + 420);
        const sy = 540 + Math.sin(ang) * (R + 420);
        const t = interpolate(frame, [8 + i * 6, 30 + i * 6], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easePop });
        return (
          <div
            key={i}
            style={{
              position: 'absolute', left: sx + (tx - sx) * t, top: sy + (ty - sy) * t,
              transform: `translate(-50%,-50%) scale(${0.8 + 0.2 * t})`,
              opacity: t,
              fontFamily: SANS, fontSize: 20, color: '#fff',
              background: 'rgba(255,255,255,0.10)', border: `1.5px solid ${it.c}`,
              borderRadius: 14, padding: '12px 18px', whiteSpace: 'nowrap',
              boxShadow: `0 0 20px ${it.c}66`,
            }}
          >
            {it.label}
          </div>
        );
      })}

      <div
        style={{
          position: 'absolute', left: '50%', top: '50%', transform: `translate(-50%,-50%) scale(${0.8 + 0.2 * lockup})`,
          opacity: lockup, textAlign: 'center', fontFamily: SANS,
        }}
      >
        <div style={{ fontSize: 92, fontWeight: 700, color: C.brand, letterSpacing: '-0.01em', lineHeight: 1 }}>需求文档工作台</div>
        <div style={{ fontSize: 26, color: C.accent, marginTop: 18, letterSpacing: '0.12em' }}>PRD · 体检 · 优化 · 评审 · 一体化</div>
      </div>
    </AbsoluteFill>
  );
};

// ===========================================================================
// SFX 钉帧表
// ===========================================================================
const SFX: { from: number; src: string; volume: number; dur?: number }[] = [
  // 1 品牌开场
  { from: SHOTS.brand.from + 4,  src: 'transition-soft.mp3', volume: 0.4 },
  { from: SHOTS.brand.from + 18, src: 'whoosh-big.mp3',      volume: 0.5 },
  { from: SHOTS.brand.from + 52, src: 'sparkle.mp3',         volume: 0.35 },

  // 2 初始页
  { from: SHOTS.init.from + 8,   src: 'transition-soft.mp3', volume: 0.38 },
  { from: SHOTS.init.from + 30,  src: 'pop.mp3',             volume: 0.28 },

  // 3 创作 PRD
  { from: SHOTS.create.from + 6,  src: 'whoosh-fast.mp3',    volume: 0.42 },
  { from: SHOTS.create.from + 32, src: 'ui-select-click.mp3', volume: 0.42 },
  { from: SHOTS.create.from + 60, src: 'ui-select-click.mp3', volume: 0.38 },
  { from: SHOTS.create.from + 88, src: 'ui-select-click.mp3', volume: 0.35 },
  { from: SHOTS.create.from + 116, src: 'ui-select-click.mp3', volume: 0.32 },

  // 4 导入导出
  { from: SHOTS.io.from + 8,      src: 'transition-soft.mp3', volume: 0.4 },
  { from: SHOTS.io.from + 55,     src: 'whoosh-fast.mp3',     volume: 0.45 },
  { from: SHOTS.io.from + 62,     src: 'transition-snap.mp3', volume: 0.35 },

  // 5 AI 助手
  { from: SHOTS.aichat.from + 10, src: 'pop.mp3',             volume: 0.32 },
  { from: SHOTS.aichat.from + 50, src: 'keyboard.mp3',        volume: 0.38, dur: 55 },

  // 6 健康度
  { from: SHOTS.health.from + 14, src: 'sparkle.mp3',         volume: 0.32 },
  { from: SHOTS.health.from + 36, src: 'sparkle.mp3',         volume: 0.28 },

  // 7 主题切换（重点自然过渡）
  { from: SHOTS.theme.from + 20,  src: 'transition-soft.mp3', volume: 0.45 },
  { from: SHOTS.theme.from + 55,  src: 'light-sweep-magic.mp3', volume: 0.42 },
  { from: SHOTS.theme.from + 100, src: 'sparkle.mp3',         volume: 0.32 },

  // 8 多角色评审
  { from: SHOTS.review.from + 6,  src: 'swoosh-quick.mp3',    volume: 0.4 },
  { from: SHOTS.review.from + 30, src: 'sparkle.mp3',         volume: 0.28 },

  // 9 结尾
  { from: SHOTS.outro.from + 8,   src: 'riser-cine.mp3',      volume: 0.5 },
  { from: SHOTS.outro.from + 44,  src: 'impact-cine.mp3',     volume: 0.55 },
  { from: SHOTS.outro.from + 58,  src: 'sparkle.mp3',         volume: 0.3 },
];

export const PromoMain: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: C.paper }}>
      {SFX.map((s, i) => (
        <Sequence key={`sfx-${i}`} from={s.from} durationInFrames={s.dur ?? 90}>
          <Audio src={staticFile(`audio/${s.src}`)} volume={s.volume} />
        </Sequence>
      ))}

      <Sequence from={SHOTS.brand.from}  durationInFrames={SHOTS.brand.duration}>  <BrandOpen />  </Sequence>
      <Sequence from={SHOTS.init.from}   durationInFrames={SHOTS.init.duration}>   <InitialPage /></Sequence>
      <Sequence from={SHOTS.create.from} durationInFrames={SHOTS.create.duration}> <CreatePRD />  </Sequence>
      <Sequence from={SHOTS.io.from}     durationInFrames={SHOTS.io.duration}>     <ImportExport /></Sequence>
      <Sequence from={SHOTS.aichat.from} durationInFrames={SHOTS.aichat.duration}> <AIChat />     </Sequence>
      <Sequence from={SHOTS.health.from} durationInFrames={SHOTS.health.duration}> <HealthCheck /></Sequence>
      <Sequence from={SHOTS.theme.from}  durationInFrames={SHOTS.theme.duration}>  <ThemeSwitch /></Sequence>
      <Sequence from={SHOTS.review.from} durationInFrames={SHOTS.review.duration}> <Review />    </Sequence>
      <Sequence from={SHOTS.outro.from}  durationInFrames={SHOTS.outro.duration}>  <Outro />     </Sequence>
    </AbsoluteFill>
  );
};
