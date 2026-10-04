import React from "react";
import { C } from "./palette";
import { E, P, rand, rr } from "./paper";

const BULB_COLORS = ["#ffcf5a", "#ff6b5a", "#7fd0ff", "#9be07a", "#ffa04a", "#ff9ad0"];

/** Foquito con halo. on: 0..1 */
export const Bulb: React.FC<{ x: number; y: number; c?: string; on?: number; r?: number; halo?: number }> = ({ x, y, c = "#ffcf5a", on = 1, r = 1.6, halo = 1 }) => (
  <g>
    {on > 0.05 && halo > 0 ? <circle cx={x} cy={y} r={r * 5 * halo} fill={c} opacity={0.22 * on} /> : null}
    {on > 0.05 && halo > 0 ? <circle cx={x} cy={y} r={r * 2.6 * halo} fill={c} opacity={0.35 * on} /> : null}
    <ellipse cx={x} cy={y} rx={r * 0.8} ry={r} fill={on > 0.3 ? "#fff6d8" : c} opacity={0.6 + 0.4 * on} />
    <ellipse cx={x} cy={y} rx={r * 0.8} ry={r} fill={c} opacity={on > 0.3 ? 0.55 : 0.9} />
    <rect x={x - r * 0.45} y={y - r * 1.7} width={r * 0.9} height={r * 0.8} fill="#3b3b30" />
  </g>
);

/** Parpadeo suave de foquitos */
export const twinkle = (t: number, i: number) => 0.55 + 0.45 * Math.sin(t * (1.5 + rand(i) * 2.5) + rand(i + 9) * 6.28);

/** Guirnalda de fieltro con foquitos a lo largo de una curva (lista de puntos) */
export const Garland: React.FC<{ pts: [number, number][]; t: number; thick?: number; seed?: number; bulbs?: number; bulbR?: number }> = ({
  pts,
  t,
  thick = 7,
  seed = 1,
  bulbs = 2,
  bulbR = 1.6,
}) => {
  // pieza ondulada (tijera de picos) siguiendo la curva
  const top: string[] = [];
  const bot: string[] = [];
  const bulbList: React.ReactNode[] = [];
  for (let i = 0; i < pts.length; i++) {
    const [x, y] = pts[i];
    const [x2, y2] = pts[Math.min(pts.length - 1, i + 1)];
    const [x0, y0] = pts[Math.max(0, i - 1)];
    const dx = x2 - x0;
    const dy = y2 - y0;
    const L = Math.hypot(dx, dy) || 1;
    const nx = -dy / L;
    const ny = dx / L;
    const w = thick * (0.75 + 0.35 * rand(i * 3 + seed));
    top.push(`${x + nx * w * 0.5},${y + ny * w * 0.5}`);
    bot.push(`${x - nx * w * 0.5},${y - ny * w * 0.5}`);
    if (i % bulbs === 1) {
      const k = i + seed * 31;
      bulbList.push(<Bulb key={i} x={x + nx * w * 0.25} y={y + ny * w * 0.55 + bulbR} c={BULB_COLORS[k % BULB_COLORS.length]} on={twinkle(t, k)} r={bulbR} />);
    }
  }
  const d = `M${top.join(" L")} L${bot.reverse().join(" L")} Z`;
  return (
    <g>
      <P d={d} fill={C.greenDark} tex="felt" sh={1} />
      {pts.map(([x, y], i) =>
        i % 2 === 0 ? <circle key={i} cx={x + (rand(i + seed) - 0.5) * thick * 0.6} cy={y + (rand(i * 7 + seed) - 0.5) * thick * 0.5} r={thick * 0.28} fill={C.green} opacity={0.9} /> : null,
      )}
      {bulbList}
    </g>
  );
};

/** curva colgante (catenaria aproximada) entre dos puntos */
export const swag = (x0: number, y0: number, x1: number, y1: number, sag: number, n = 24): [number, number][] =>
  Array.from({ length: n + 1 }).map((_, i) => {
    const u = i / n;
    return [x0 + (x1 - x0) * u, y0 + (y1 - y0) * u + sag * 4 * u * (1 - u)];
  });

/** ÁRBOL de navidad — tarjeta 140 x 220 cm */
export const Tree: React.FC<{ t: number; layer: "back" | "front" }> = ({ t, layer }) => {
  const tiers = [
    { y: 38, w: 44, h: 50 },
    { y: 70, w: 66, h: 58 },
    { y: 108, w: 90, h: 64 },
    { y: 148, w: 116, h: 64 },
  ];
  const tierPath = (y: number, w: number, h: number) => {
    const n = Math.round(w / 14);
    let d = `M70,${y - h * 0.62} `;
    d += `C${70 + w * 0.2},${y - h * 0.3} ${70 + w * 0.42},${y - 10} ${70 + w / 2},${y + 2} `;
    for (let i = n; i > 0; i--) {
      const x0 = 70 - w / 2 + (w * i) / n;
      const x1 = 70 - w / 2 + (w * (i - 1)) / n;
      d += `Q${(x0 + x1) / 2},${y + 10} ${x1},${y + 2} `;
    }
    d += `C${70 - w * 0.42},${y - 10} ${70 - w * 0.2},${y - h * 0.3} 70,${y - h * 0.62} Z`;
    return d;
  };
  if (layer === "back") {
    return (
      <g>
        <P d={rr(62, 200, 16, 18, 2)} fill={C.woodDark} tex="felt" sh={0.6} />
        {tiers.map((tr, i) => (
          <g key={i}>
            <P d={tierPath(tr.y + 8, tr.w + 8, tr.h + 6)} fill={C.greenDark} tex="felt" sh={1.4} />
          </g>
        ))}
        {/* falda del árbol */}
        <P d="M24,206 C30,198 110,198 116,206 C120,214 112,220 70,220 C28,220 20,214 24,206 Z" fill={C.red} tex="knit" sh={0.8} />
        <P d="M24,206 C30,198 110,198 116,206 C100,203 40,203 24,206 Z" fill={C.white} tex="boucle" sh={0} />
      </g>
    );
  }
  // capa frontal: niveles claros, adornos y luces
  const orn: [number, number, string][] = [];
  const lights: [number, number][] = [];
  tiers.forEach((tr, i) => {
    const n = 2 + i;
    for (let k = 0; k < n; k++) {
      const u = (k + 0.5) / n;
      orn.push([70 - tr.w * 0.38 + tr.w * 0.76 * u, tr.y - 8 + rand(i * 10 + k) * 6, [C.red, C.gold, "#5f86b6", C.cream][(i + k) % 4]]);
    }
    for (let k = 0; k <= 7; k++) {
      const u = k / 7;
      lights.push([70 - tr.w * 0.45 + tr.w * 0.9 * u, tr.y - tr.h * 0.35 + 22 * u * u + (i % 2 ? 4 : 0)]);
    }
  });
  return (
    <g>
      {tiers.map((tr, i) => (
        <g key={i}>
          <P d={tierPath(tr.y, tr.w, tr.h)} fill={i % 2 ? C.green : "#4b7a4c"} tex="felt" sh={1.2} />
          <path d={tierPath(tr.y, tr.w, tr.h)} fill="url(#g-shade-down)" />
        </g>
      ))}
      {/* cadena de cuentas */}
      {tiers.map((tr, i) => (
        <path
          key={i}
          d={`M${70 - tr.w * 0.42},${tr.y - tr.h * 0.33} Q70,${tr.y - tr.h * 0.33 + 24} ${70 + tr.w * 0.42},${tr.y - tr.h * 0.38 + 10}`}
          stroke={C.gold}
          strokeWidth={1.2}
          strokeDasharray="1.2 1.6"
          strokeLinecap="round"
          fill="none"
        />
      ))}
      {orn.map(([x, y, c], i) => (
        <g key={i}>
          <E cx={x} cy={y} rx={4.2} fill={c} tex="felt" sh={0.6} />
          <rect x={x - 1} y={y - 5.6} width={2} height={1.6} fill={C.goldDark} />
          <circle cx={x - 1.4} cy={y - 1.4} r={1} fill="#fff" opacity={0.35} />
        </g>
      ))}
      {lights.map(([x, y], i) => (
        <Bulb key={i} x={x} y={y} c={BULB_COLORS[i % BULB_COLORS.length]} on={twinkle(t, i)} r={1.5} />
      ))}
      {/* estrella */}
      <g transform="translate(70 -2)">
        <circle r={16} fill="#ffd56a" opacity={0.25 + 0.1 * Math.sin(t * 3)} />
        <P d="M0,-11 L3.2,-3.5 L11,-3.4 L4.8,1.6 L7,9.5 L0,5 L-7,9.5 L-4.8,1.6 L-11,-3.4 L-3.2,-3.5 Z" fill={C.gold} tex="felt" sh={0.8} />
      </g>
    </g>
  );
};

/** Regalos bajo el árbol — tarjeta 150 x 42 */
export const Gifts: React.FC = () => {
  const box = (x: number, w: number, h: number, c: string, rib: string, k: number) => (
    <g key={k}>
      <P d={rr(x, 42 - h, w, h, 1.5)} fill={c} tex="paper" sh={1} />
      <rect x={x + w / 2 - 1.8} y={42 - h} width={3.6} height={h} fill={rib} />
      <rect x={x} y={42 - h + h * 0.35} width={w} height={3} fill={rib} opacity={0.9} />
      <P d={`M${x + w / 2},${42 - h} c-6,-6 -10,-2 -6,1 z M${x + w / 2},${42 - h} c6,-6 10,-2 6,1 z`} fill={rib} tex="felt" sh={0.4} />
    </g>
  );
  return (
    <g>
      {box(4, 30, 26, C.red, C.gold, 1)}
      {box(30, 26, 36, "#5f86b6", C.cream, 2)}
      {box(58, 34, 22, C.mustard, C.red, 3)}
      {box(96, 26, 30, C.green, C.red, 4)}
      {box(118, 28, 18, C.cream, C.green, 5)}
    </g>
  );
};

/** Llamas de papel. Se dibujan con centro inferior en (cx, by). k = intensidad 0..1 */
export const Fire: React.FC<{ cx: number; by: number; t: number; k: number; w?: number }> = ({ cx, by, t, k, w = 40 }) => {
  const flame = (dx: number, hh: number, ww: number, c: string, i: number) => {
    const h = hh * (0.15 + 0.85 * k) * (0.85 + 0.15 * Math.sin(t * (9 + i * 2.3) + i));
    const sway = Math.sin(t * (5 + i) + i * 2) * 2.2 * k;
    return (
      <P
        key={i}
        d={`M${cx + dx - ww / 2},${by} C${cx + dx - ww / 2},${by - h * 0.5} ${cx + dx + sway - ww * 0.15},${by - h * 0.7} ${cx + dx + sway},${by - h} C${cx + dx + sway + ww * 0.25},${by - h * 0.6} ${cx + dx + ww / 2},${by - h * 0.45} ${cx + dx + ww / 2},${by} Z`}
        fill={c}
        tex="felt"
        sh={0}
      />
    );
  };
  return (
    <g>
      <ellipse cx={cx} cy={by - 8} rx={w * 0.9} ry={20} fill="#ffb347" opacity={0.25 * (0.3 + 0.7 * k)} />
      {flame(-12, 30, 18, "#e8642c", 1)}
      {flame(10, 34, 18, "#e8642c", 2)}
      {flame(0, 44, 22, "#f08c2e", 3)}
      {flame(-6, 26, 12, "#f7c04a", 4)}
      {flame(6, 30, 12, "#f7c04a", 5)}
      {flame(0, 18, 9, "#fff0b0", 6)}
      {/* troncos */}
      <P d={rr(cx - w / 2 - 6, by - 6, w + 12, 9, 4)} fill={C.woodDark} tex="wood" sh={0.6} />
      <P d={rr(cx - w / 2, by - 2, w, 8, 4)} fill={C.brown} tex="wood" sh={0.6} />
      <ellipse cx={cx - w / 2 + 2} cy={by + 2} rx={3} ry={3.5} fill="#d39a64" />
      {/* brasas */}
      {Array.from({ length: 7 }).map((_, i) => (
        <circle key={i} cx={cx - w / 2 + 4 + (i * w) / 7} cy={by + 5} r={1.6} fill="#ff8a3a" opacity={0.5 + 0.5 * Math.sin(t * 4 + i * 1.7)} />
      ))}
    </g>
  );
};

/** Calcetín navideño colgado. Origen arriba. */
export const Stocking: React.FC<{ x: number; y: number; c: string; trim?: string }> = ({ x, y, c, trim = C.white }) => (
  <g transform={`translate(${x} ${y})`}>
    <P d="M-6,4 L6,4 L6,22 C6,26 10,27 14,27 C18,27 19,33 14,34 L0,34 C-5,34 -7,30 -6,26 Z" fill={c} tex="knitS" sh={0.8} />
    <P d={rr(-7.5, 0, 15, 7, 2.5)} fill={trim} tex="boucle" sh={0.5} />
  </g>
);

/** Chimenea: frente de ladrillo con hueco. Tarjeta 150 x 125. Hueco: x 40..110, y 55..125 */
export const FIRE_OPEN = { x0: 38, x1: 112, top: 52, bottom: 125 };
export const FireplaceFront: React.FC<{ t: number }> = ({ t }) => {
  const { x0, x1, top, bottom } = FIRE_OPEN;
  const outer = `M8,30 H142 V125 H8 Z`;
  const hole = `M${x0},${bottom} V${top + 14} Q${x0},${top} ${x0 + 14},${top} H${x1 - 14} Q${x1},${top} ${x1},${top + 14} V${bottom} Z`;
  const bricks: React.ReactNode[] = [];
  for (let r = 0; r < 10; r++) {
    for (let c = -1; c < 7; c++) {
      const bx = 8 + c * 22 + (r % 2 ? 11 : 0);
      const by = 32 + r * 9.4;
      bricks.push(<rect key={`${r}-${c}`} x={bx + 0.8} y={by + 0.8} width={20.4} height={7.8} rx={1.2} fill={rand(r * 13 + c) > 0.5 ? C.brick : "#b36148"} />);
    }
  }
  return (
    <g>
      <defs>
        <clipPath id="fp-clip">
          <path d={`${outer} ${hole}`} clipRule="evenodd" />
        </clipPath>
      </defs>
      <path d={`${outer} ${hole}`} fillRule="evenodd" fill="rgba(35,18,8,0.35)" transform="translate(0.6 1.4)" />
      <g clipPath="url(#fp-clip)">
        <rect x={0} y={0} width={150} height={125} fill={C.brickDark} />
        {bricks}
        <rect x={0} y={0} width={150} height={125} fill="url(#tex-felt)" />
      </g>
      {/* arco de piedra alrededor del hueco */}
      <path d={`M${x0 - 6},${bottom} V${top + 12} Q${x0 - 6},${top - 6} ${x0 + 12},${top - 6} H${x1 - 12} Q${x1 + 6},${top - 6} ${x1 + 6},${top + 12} V${bottom}`} stroke={C.cream} strokeWidth={5} fill="none" opacity={0.85} />
      <path d={`M${x0 - 6},${bottom} V${top + 12} Q${x0 - 6},${top - 6} ${x0 + 12},${top - 6} H${x1 - 12} Q${x1 + 6},${top - 6} ${x1 + 6},${top + 12} V${bottom}`} stroke="url(#tex-paper)" strokeWidth={5} fill="none" />
      {/* repisa */}
      <P d={rr(0, 20, 150, 12, 2)} fill={C.woodDark} tex="wood" sh={1.4} />
      <P d={rr(4, 31, 142, 3, 1)} fill={C.wood} tex="wood" sh={0.4} />
      {/* guirnalda sobre la repisa */}
      <Garland pts={swag(2, 24, 148, 24, 10, 30)} t={t} thick={6} seed={3} bulbs={3} bulbR={1.3} />
      <Stocking x={20} y={31} c={C.red} />
      <Stocking x={124} y={31} c={C.green} />
      {/* velas y adornos en la repisa */}
      <P d={rr(14, 6, 6, 15, 1)} fill={C.cream} tex="paper" sh={0.5} />
      <ellipse cx={17} cy={3} rx={1.8} ry={3} fill="#ffcf5a" />
      <circle cx={17} cy={3} r={7} fill="#ffcf5a" opacity={0.2} />
      <P d={rr(128, 9, 6, 12, 1)} fill={C.cream} tex="paper" sh={0.5} />
      <ellipse cx={131} cy={6} rx={1.8} ry={3} fill="#ffcf5a" />
      <circle cx={131} cy={6} r={7} fill="#ffcf5a" opacity={0.2} />
    </g>
  );
};

/** Interior de la chimenea (fondo oscuro de ladrillo) — tarjeta 90 x 90 */
export const Firebox: React.FC = () => (
  <g>
    <rect x={0} y={0} width={90} height={90} fill="#3a1d14" />
    {Array.from({ length: 9 }).map((_, r) =>
      Array.from({ length: 5 }).map((__, c) => (
        <rect key={`${r}-${c}`} x={c * 20 + (r % 2 ? 10 : 0) - 5} y={r * 10} width={19} height={9} rx={1} fill="#4a261a" />
      )),
    )}
    <rect x={0} y={0} width={90} height={90} fill="url(#tex-felt)" />
    <rect x={0} y={0} width={90} height={90} fill="url(#g-shade-up)" />
  </g>
);

/** Sillón: respaldo (tarjeta 170 x 92) */
export const SofaBack: React.FC = () => (
  <g>
    <P d="M10,30 C10,14 22,6 40,6 H130 C148,6 160,14 160,30 V70 H10 Z" fill={C.teal} tex="felt" sh={1.2} />
    <path d="M85,10 V66" stroke={C.tealDark} strokeWidth={1.2} strokeDasharray="2 2" />
    <P d={rr(14, 50, 142, 22, 6)} fill={C.tealDark} tex="felt" sh={0.6} />
    {/* cojín decorativo */}
    <P d="M120,30 C128,26 142,28 146,34 C148,42 146,52 140,56 C132,58 122,56 118,50 C116,42 116,34 120,30 Z" fill={C.mustard} tex="knitS" sh={1} />
  </g>
);
/** Sillón: frente (asiento + brazos) — tarjeta 170 x 60, el asiento queda a 45 cm */
export const SofaFront: React.FC = () => (
  <g>
    <P d={rr(16, 13, 138, 34, 5)} fill={C.teal} tex="felt" sh={1} />
    <path d="M85,15 V45" stroke={C.tealDark} strokeWidth={1} strokeDasharray="2 2" />
    <P d={rr(0, 2, 22, 52, 10)} fill={C.teal} tex="felt" sh={1.2} />
    <P d={rr(148, 2, 22, 52, 10)} fill={C.teal} tex="felt" sh={1.2} />
    <path d={`M3,10 Q11,4 19,10`} stroke={C.tealDark} strokeWidth={1} fill="none" />
    <path d={`M151,10 Q159,4 167,10`} stroke={C.tealDark} strokeWidth={1} fill="none" />
    <P d={rr(5, 52, 7, 8, 1.5)} fill={C.woodDark} tex="wood" sh={0.4} />
    <P d={rr(158, 52, 7, 8, 1.5)} fill={C.woodDark} tex="wood" sh={0.4} />
    {/* manta tejida doblada en el brazo */}
    <P d="M148,2 C156,0 166,2 170,8 L170,30 C164,26 156,28 150,32 Z" fill={C.cream} tex="knitS" sh={0.8} />
  </g>
);

/** Ventana nocturna con nieve. Dibuja en (x, y) con tamaño w x h */
export const NightWindow: React.FC<{ x: number; y: number; w: number; h: number; t: number; curtains?: string; moon?: boolean }> = ({
  x,
  y,
  w,
  h,
  t,
  curtains = C.red,
  moon = true,
}) => {
  const flakes = Array.from({ length: 26 }).map((_, i) => {
    const sp = 6 + rand(i) * 6;
    const fx = x + 4 + rand(i + 3) * (w - 8) + Math.sin(t * 1.2 + i) * 2;
    const fy = y + 4 + ((rand(i + 7) * h + t * sp) % (h - 8));
    return <circle key={i} cx={fx} cy={fy} r={0.6 + rand(i + 11) * 0.8} fill="#fff" opacity={0.85} />;
  });
  const id = `win-${Math.round(x)}-${Math.round(y)}`;
  return (
    <g>
      <defs>
        <clipPath id={id}>
          <rect x={x} y={y} width={w} height={h} />
        </clipPath>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={C.nightDeep} />
          <stop offset="1" stopColor="#3b4a78" />
        </linearGradient>
      </defs>
      <rect x={x - 2} y={y - 2} width={w + 4} height={h + 4} fill="rgba(35,18,8,0.35)" transform="translate(0.6 1.5)" />
      <g clipPath={`url(#${id})`}>
        <rect x={x} y={y} width={w} height={h} fill={`url(#${id}-sky)`} />
        {moon ? (
          <>
            <circle cx={x + w * 0.72} cy={y + h * 0.25} r={w * 0.2} fill="#fff3c4" opacity={0.18} />
            <circle cx={x + w * 0.72} cy={y + h * 0.25} r={w * 0.1} fill="#fbeec0" />
          </>
        ) : null}
        <path d={`M${x},${y + h * 0.82} Q${x + w * 0.3},${y + h * 0.7} ${x + w * 0.6},${y + h * 0.8} T${x + w},${y + h * 0.76} V${y + h} H${x} Z`} fill="#dfe6ee" />
        <path d={`M${x + w * 0.15},${y + h * 0.8} l6,-16 l6,16 z M${x + w * 0.8},${y + h * 0.78} l5,-12 l5,12 z`} fill="#2f4a3c" />
        {flakes}
      </g>
      {/* marco y cruz */}
      <path d={`M${x - 3},${y - 3} h${w + 6} v${h + 6} h${-w - 6} z M${x},${y} v${h} h${w} v${-h} z`} fillRule="evenodd" fill={C.cream} />
      <path d={`M${x - 3},${y - 3} h${w + 6} v${h + 6} h${-w - 6} z M${x},${y} v${h} h${w} v${-h} z`} fillRule="evenodd" fill="url(#tex-paper)" />
      <rect x={x + w / 2 - 1.5} y={y} width={3} height={h} fill={C.cream} />
      <rect x={x} y={y + h * 0.45 - 1.5} width={w} height={3} fill={C.cream} />
      <P d={rr(x - 8, y + h + 2, w + 16, 5, 1.5)} fill={C.cream} tex="paper" sh={0.8} />
      {/* cortinas */}
      <P d={`M${x - 12},${y - 10} H${x + w * 0.2} C${x + w * 0.12},${y + h * 0.4} ${x + w * 0.05},${y + h * 0.7} ${x - 2},${y + h + 6} H${x - 14} Z`} fill={curtains} tex="knitS" sh={1.2} />
      <P d={`M${x + w + 12},${y - 10} H${x + w * 0.8} C${x + w * 0.88},${y + h * 0.4} ${x + w * 0.95},${y + h * 0.7} ${x + w + 2},${y + h + 6} H${x + w + 14} Z`} fill={curtains} tex="knitS" sh={1.2} />
      <P d={rr(x - 16, y - 13, w + 32, 4, 2)} fill={C.woodDark} tex="wood" sh={0.6} />
    </g>
  );
};

/** Cuadro enmarcado */
export const Frame: React.FC<{ x: number; y: number; w: number; h: number; kind?: number }> = ({ x, y, w, h, kind = 0 }) => (
  <g>
    <P d={rr(x, y, w, h, 1)} fill={C.woodDark} tex="wood" sh={1} />
    <rect x={x + 3} y={y + 3} width={w - 6} height={h - 6} fill={C.cream} />
    {kind === 0 ? (
      <>
        <path d={`M${x + 3},${y + h - 3} L${x + w * 0.35},${y + h * 0.45} L${x + w * 0.6},${y + h * 0.7} L${x + w * 0.75},${y + h * 0.55} L${x + w - 3},${y + h - 3} Z`} fill={C.green} />
        <circle cx={x + w * 0.72} cy={y + h * 0.3} r={w * 0.1} fill={C.mustard} />
      </>
    ) : kind === 1 ? (
      <>
        <circle cx={x + w / 2} cy={y + h * 0.42} r={w * 0.18} fill={C.skin} />
        <path d={`M${x + w * 0.22},${y + h - 3} C${x + w * 0.25},${y + h * 0.6} ${x + w * 0.75},${y + h * 0.6} ${x + w * 0.78},${y + h - 3} Z`} fill={C.red} />
      </>
    ) : (
      <path d={`M${x + w / 2},${y + 8} l${w * 0.3},${h * 0.5} h${-w * 0.6} z`} fill={C.green} />
    )}
    <rect x={x + 3} y={y + 3} width={w - 6} height={h - 6} fill="url(#tex-paper)" />
  </g>
);
