import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { PaperDefs } from "./lib/paper";
import { S34Living } from "./scenes/S34Living";

/** Vista de la sala de 26–30 s, pre-renderizada para verse a través de la ventana en la escena 5 */
export const Room5: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: "#120c0a" }}>
      <PaperDefs />
      <S34Living t={26 + f / fps} />
    </AbsoluteFill>
  );
};
