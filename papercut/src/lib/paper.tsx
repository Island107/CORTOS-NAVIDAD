import React from "react";
import { staticFile } from "remotion";
import { DBG } from "./dbg";

/** Texturas pre-generadas (tools/make_textures.py). Tamaño del tile en cm. */
const TEX: Record<string, number> = {
  paper: 60,
  felt: 24,
  knit: 9,
  knitS: 5, // tejido fino para piezas pequeñas
  boucle: 16,
  wood: 80,
  card: 50,
};
export type Tex = keyof typeof TEX;

export const PaperDefs: React.FC = () => (
  <svg width={0} height={0} style={{ position: "absolute" }}>
    <defs>
      {Object.entries(TEX).map(([k, s]) => (
        <pattern key={k} id={`tex-${k}`} patternUnits="userSpaceOnUse" width={s} height={s}>
          <image href={staticFile(`tex/${k === "knitS" ? "knit" : k}.png`)} width={s} height={s} preserveAspectRatio="none" />
        </pattern>
      ))}
      {/* papel tapiz (cm) */}
      <pattern id="wp-stripe" patternUnits="userSpaceOnUse" width={24} height={24}>
        <rect width={24} height={24} fill="#d9a38a" />
        <rect x={0} width={9} height={24} fill="#cf957c" />
        <circle cx={16.5} cy={6} r={1.3} fill="#efcfae" />
        <circle cx={16.5} cy={18} r={1.3} fill="#efcfae" />
      </pattern>
      <pattern id="wp-stars" patternUnits="userSpaceOnUse" width={30} height={30}>
        <rect width={30} height={30} fill="#a9bfb4" />
        <path d="M8,4 l1.5,3.2 3.5,0.4 -2.6,2.4 0.7,3.4 -3.1,-1.7 -3.1,1.7 0.7,-3.4 -2.6,-2.4 3.5,-0.4z" fill="#e9dcb8" />
        <circle cx={22} cy={21} r={1.4} fill="#e9dcb8" />
        <circle cx={25} cy={8} r={0.9} fill="#e9dcb8" />
      </pattern>
      <pattern id="wp-hall" patternUnits="userSpaceOnUse" width={20} height={28}>
        <rect width={20} height={28} fill="#d8b98e" />
        <path d="M10,2 L16,14 L10,26 L4,14 Z" fill="none" stroke="#c9a77b" strokeWidth={1.2} />
      </pattern>
      <pattern id="floor-planks" patternUnits="userSpaceOnUse" width={120} height={18}>
        <rect width={120} height={18} fill="#a8704a" />
        <rect y={17} width={120} height={1} fill="#6b3f28" opacity={0.6} />
        <rect x={70} width={1} height={18} fill="#6b3f28" opacity={0.5} />
      </pattern>
      <radialGradient id="g-bulb">
        <stop offset="0" stopColor="#fffbe0" />
        <stop offset="0.35" stopColor="#ffd56a" stopOpacity="0.9" />
        <stop offset="1" stopColor="#ff9a2a" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="g-cheek">
        <stop offset="0" stopColor="#e86a5a" stopOpacity="0.75" />
        <stop offset="1" stopColor="#e86a5a" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="g-shade-down" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#000" stopOpacity="0" />
        <stop offset="1" stopColor="#1a0d05" stopOpacity="0.35" />
      </linearGradient>
      <linearGradient id="g-shade-up" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#1a0d05" stopOpacity="0.35" />
        <stop offset="1" stopColor="#000" stopOpacity="0" />
      </linearGradient>
    </defs>
  </svg>
);

/**
 * Pieza recortada: sombra de contacto, color plano mate, textura y borde de corte.
 * Todo en unidades del SVG contenedor (cm).
 */
export const P: React.FC<{
  d: string;
  fill: string;
  tex?: Tex | null;
  sh?: number; // desplazamiento de la sombra (cm); 0 = sin sombra
  edge?: string | null; // color del borde de corte
  edgeW?: number;
  opacity?: number;
  transform?: string;
}> = ({ d, fill, tex = "paper", sh = 0.8, edge, edgeW = 0.35, opacity, transform }) => (
  <g opacity={opacity} transform={transform}>
    {sh && !DBG.has("nosh") ? <path d={d} fill="rgba(35,18,8,0.30)" transform={`translate(${sh * 0.4} ${sh})`} /> : null}
    <path d={d} fill={fill} stroke={edge ?? undefined} strokeWidth={edge ? edgeW : undefined} strokeLinejoin="round" />
    {tex && !DBG.has("notex") ? <path d={d} fill={`url(#tex-${tex})`} /> : null}
  </g>
);

/** Círculo/elipse como pieza */
export const E: React.FC<{
  cx: number;
  cy: number;
  rx: number;
  ry?: number;
  fill: string;
  tex?: Tex | null;
  sh?: number;
  edge?: string | null;
  opacity?: number;
}> = ({ cx, cy, rx, ry, fill, tex = "felt", sh = 0.6, edge, opacity }) => {
  const r2 = ry ?? rx;
  return (
    <g opacity={opacity}>
      {sh ? <ellipse cx={cx + sh * 0.4} cy={cy + sh} rx={rx} ry={r2} fill="rgba(35,18,8,0.30)" /> : null}
      <ellipse cx={cx} cy={cy} rx={rx} ry={r2} fill={fill} stroke={edge ?? undefined} strokeWidth={edge ? 0.35 : undefined} />
      {tex ? <ellipse cx={cx} cy={cy} rx={rx} ry={r2} fill={`url(#tex-${tex})`} /> : null}
    </g>
  );
};

/** Rectángulo redondeado como path */
export const rr = (x: number, y: number, w: number, h: number, r: number) =>
  `M${x + r},${y} h${w - 2 * r} a${r},${r} 0 0 1 ${r},${r} v${h - 2 * r} a${r},${r} 0 0 1 ${-r},${r} h${-(w - 2 * r)} a${r},${r} 0 0 1 ${-r},${-r} v${-(h - 2 * r)} a${r},${r} 0 0 1 ${r},${-r} z`;

/** Borde ondulado tipo tijera de picos / recorte a mano: rectángulo con bordes ligeramente irregulares */
export const wobblyRect = (x: number, y: number, w: number, h: number, amp = 0.6, seed = 1) => {
  const pts: string[] = [];
  const rnd = (i: number) => Math.sin(i * 12.9898 + seed * 78.233) * 0.5;
  const n = Math.max(4, Math.round(w / 20));
  const m = Math.max(4, Math.round(h / 20));
  for (let i = 0; i <= n; i++) pts.push(`${x + (w * i) / n},${y + rnd(i) * amp}`);
  for (let i = 1; i <= m; i++) pts.push(`${x + w + rnd(i + 50) * amp},${y + (h * i) / m}`);
  for (let i = n - 1; i >= 0; i--) pts.push(`${x + (w * i) / n},${y + h + rnd(i + 100) * amp}`);
  for (let i = m - 1; i >= 1; i--) pts.push(`${x + rnd(i + 150) * amp},${y + (h * i) / m}`);
  return `M${pts.join(" L")} Z`;
};

/** Pseudo-aleatorio determinista */
export const rand = (i: number) => {
  const s = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

export const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
/** interpolación suave entre t0 y t1 (en segundos o frames, lo que se pase) */
export const ease = (t: number, t0: number, t1: number) => {
  const u = clamp((t - t0) / (t1 - t0));
  return u * u * (3 - 2 * u);
};
export const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
