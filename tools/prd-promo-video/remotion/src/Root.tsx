import { Composition } from 'remotion';
import { PromoMain, TOTAL } from './Main';

export const Root: React.FC = () => {
  return (
    <Composition
      id="Promo"
      component={PromoMain}
      durationInFrames={TOTAL}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
