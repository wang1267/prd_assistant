import { AbsoluteFill } from 'remotion';

export const Diag: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: '#1b4fd6', justifyContent: 'center', alignItems: 'center' }}>
      <span style={{ color: '#fff', fontSize: 80, fontFamily: 'system-ui' }}>DIAG OK</span>
    </AbsoluteFill>
  );
};
