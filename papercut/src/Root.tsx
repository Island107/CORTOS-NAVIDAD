import { Composition } from "remotion";
import { Main } from "./Main";
import { Room5 } from "./Room5";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition id="Navidad" component={Main} durationInFrames={720} fps={24} width={1080} height={1920} />
      <Composition id="Room5" component={Room5} durationInFrames={96} fps={24} width={1080} height={1920} />
    </>
  );
};
