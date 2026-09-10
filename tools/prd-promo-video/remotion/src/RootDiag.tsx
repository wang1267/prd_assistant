import { Composition } from 'remotion';
import { Diag } from './Diag';

export const Root: React.FC = () => {
  return (
    <Composition
      id="Diag"
      component={Diag}
      durationInFrames={30}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
