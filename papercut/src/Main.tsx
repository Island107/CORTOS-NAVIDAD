import React from "react";
import { AbsoluteFill, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont } from "@remotion/fonts";
import { Audio } from "@remotion/media";
import { PaperDefs } from "./lib/paper";
import { project } from "./lib/engine";
import { S1Bedroom } from "./scenes/S1Bedroom";
import { S2Stairs } from "./scenes/S2Stairs";
import { livingCam, S34Living, santaHeadWorld } from "./scenes/S34Living";
import { Bubble, Sparkles } from "./scenes/Fx";
import { S5Diorama } from "./scenes/S5Diorama";

loadFont({ family: "Fredoka", url: staticFile("fonts/fredoka-latin-700-normal.woff2"), weight: "700" });
loadFont({ family: "Fredoka", url: staticFile("fonts/fredoka-latin-600-normal.woff2"), weight: "600" });

const fade = (t: number, a: number, b: number) => Math.max(0, Math.min(1, (t - a) / (b - a)));

export const Main: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const head = santaHeadWorld(Math.min(t, 24.3));
  const hp = project(livingCam(t), head.x, head.y, head.z);
  return (
    <AbsoluteFill style={{ background: "#120c0a" }}>
      <PaperDefs />
      <Audio src={staticFile("audio/sfx.wav")} />
      {t < 6.3 ? <S1Bedroom t={t} /> : null}
      {t >= 5.9 && t < 12.4 ? (
        <AbsoluteFill style={{ opacity: fade(t, 5.9, 6.3) }}>
          <S2Stairs t={t} />
        </AbsoluteFill>
      ) : null}
      {t >= 11.6 && t < 26 ? (
        <AbsoluteFill style={{ opacity: fade(t, 11.6, 12.3) }}>
          <S34Living t={t} />
        </AbsoluteFill>
      ) : null}
      {t >= 21.5 && t < 25 ? (
        <Bubble t={t} t0={21.95} t1={24.15} x={hp.sx + 150} y={hp.sy - 560} tailX={hp.sx + 40} tailY={hp.sy - 140} text="¡Jo, jo, jo!" />
      ) : null}
      <Sparkles t={t} t0={24.32} x={hp.sx} y={hp.sy} />
      {t >= 26 ? <S5Diorama t={t} /> : null}
    </AbsoluteFill>
  );
};
