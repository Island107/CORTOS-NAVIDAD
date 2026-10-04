import { Composition } from "remotion";
import { Main } from "./Main";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition id="Navidad" component={Main} durationInFrames={720} fps={24} width={1080} height={1920} />
    </>
  );
};
