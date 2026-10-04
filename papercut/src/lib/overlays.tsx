import React, { useLayoutEffect, useRef } from "react";
import { AbsoluteFill, staticFile } from "remotion";
import { DBG } from "./dbg";

export type Glow = { x: number; y: number; r: number; color: string; a: number };

/**
 * Luz de la escena: tinte (noche / cálido) + halos de luz + viñeta.
 * Todo en UNA capa de gradientes CSS con mezcla normal (las capas con
 * mix-blend-mode duplicaban el costo de composición por cuadro).
 */
const hexA = (hex: string, a: number) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${Math.max(0, Math.min(1, a)).toFixed(3)})`;
};
export const LightRig: React.FC<{ tint: string; tintA: number; glows: Glow[]; vignette?: number }> = ({ tint, tintA, glows, vignette = 0.55 }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const key = JSON.stringify([tint, tintA, glows, vignette]);
  useLayoutEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const k = cv.width / 1080;
    ctx.clearRect(0, 0, cv.width, cv.height);
    // tinte
    ctx.fillStyle = hexA(tint, tintA);
    ctx.fillRect(0, 0, cv.width, cv.height);
    // halos
    for (const g of glows) {
      const r = Math.max(1, g.r * k);
      const gr = ctx.createRadialGradient(g.x * k, g.y * k, 0, g.x * k, g.y * k, r);
      gr.addColorStop(0, hexA(g.color, g.a * 0.55));
      gr.addColorStop(0.45, hexA(g.color, g.a * 0.18));
      gr.addColorStop(1, hexA(g.color, 0));
      ctx.fillStyle = gr;
      ctx.fillRect(0, 0, cv.width, cv.height);
    }
    // viñeta
    ctx.save();
    ctx.translate(cv.width / 2, cv.height * 0.48);
    ctx.scale(1, (0.62 * 1920) / (0.75 * 1080));
    const vr = 0.75 * cv.width;
    const vg = ctx.createRadialGradient(0, 0, 0, 0, 0, vr);
    vg.addColorStop(0.55, "rgba(18,8,3,0)");
    vg.addColorStop(1, `rgba(18,8,3,${vignette})`);
    ctx.fillStyle = vg;
    ctx.fillRect(-cv.width, -cv.height, cv.width * 2, cv.height * 2);
    ctx.restore();
  }, [key]);
  if (DBG.has("noblend")) return null;
  return <canvas ref={ref} width={270} height={480} style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920 }} />;
};

/** Grano de papel sobre todo el cuadro */
export const Grain: React.FC<{ a?: number }> = ({ a = 0.35 }) => DBG.has("nograin") ? null : (
  <AbsoluteFill
    style={{
      backgroundImage: `url(${staticFile("tex/paper.png")})`,
      backgroundSize: "380px 380px",
      opacity: a,
    }}
  />
);

/** Párpados: open 0 = cerrado, 1 = abierto */
export const Eyelids: React.FC<{ open: number }> = ({ open }) => {
  if (open >= 0.999) return null;
  const ry = Math.max(0.001, open) * 1250;
  const rx = 700 + 300 * open;
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse ${rx}px ${ry}px at 50% 50%, rgba(12,6,4,0) 0%, rgba(12,6,4,0) ${55 + open * 25}%, rgba(12,6,4,1) 100%)`,
      }}
    />
  );
};
