import React from "react";
import { AbsoluteFill } from "remotion";
import { ease, rand } from "../lib/paper";

export const FONT = "Fredoka, 'DejaVu Sans', sans-serif";

/** Resorte simple 0..1 con rebote (para "pop") */
const pop = (t: number, t0: number, dur = 0.45) => {
  const u = Math.max(0, Math.min(1, (t - t0) / dur));
  if (u <= 0) return 0;
  return 1 - Math.exp(-6 * u) * Math.cos(u * 11);
};

/** Burbuja de diálogo de fieltro con texto que rebota letra por letra */
export const Bubble: React.FC<{ t: number; t0: number; t1: number; x: number; y: number; tailX: number; tailY: number; text: string }> = ({
  t,
  t0,
  t1,
  x,
  y,
  tailX,
  tailY,
  text,
}) => {
  if (t < t0 || t > t1 + 0.35) return null;
  const s = pop(t, t0) * (1 - ease(t, t1, t1 + 0.3));
  const wob = Math.sin(t * 5) * 2;
  const w = 600;
  const h = 250;
  const letters = text.split("");
  return (
    <AbsoluteFill>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", overflow: "visible" }}>
        <g transform={`translate(${x} ${y}) rotate(${wob}) scale(${s})`} style={{ filter: "drop-shadow(0 14px 16px rgba(20,8,2,0.45))" }}>
          {/* cola apuntando a Santa */}
          <path d={`M-70,${h / 2 - 30} L${tailX - x},${tailY - y} L20,${h / 2 - 22} Z`} fill="#fbf4e6" />
          {/* nube de fieltro */}
          <path
            d={`M${-w / 2 + 40},${-h / 2 + 20}
              C${-w / 2 + 60},${-h / 2 - 30} ${-60},${-h / 2 - 30} ${-30},${-h / 2 + 4}
              C0,${-h / 2 - 40} ${120},${-h / 2 - 30} ${140},${-h / 2 + 6}
              C${w / 2 - 20},${-h / 2 - 20} ${w / 2 + 30},${-20} ${w / 2 - 10},${20}
              C${w / 2 + 20},${h / 2 - 10} ${100},${h / 2 + 20} ${60},${h / 2 - 6}
              C${0},${h / 2 + 30} ${-160},${h / 2 + 20} ${-170},${h / 2 - 14}
              C${-w / 2},${h / 2} ${-w / 2 - 30},${0} ${-w / 2 + 40},${-h / 2 + 20} Z`}
            fill="#fbf4e6"
          />
          <path
            d={`M${-w / 2 + 40},${-h / 2 + 20}
              C${-w / 2 + 60},${-h / 2 - 30} ${-60},${-h / 2 - 30} ${-30},${-h / 2 + 4}
              C0,${-h / 2 - 40} ${120},${-h / 2 - 30} ${140},${-h / 2 + 6}
              C${w / 2 - 20},${-h / 2 - 20} ${w / 2 + 30},${-20} ${w / 2 - 10},${20}
              C${w / 2 + 20},${h / 2 - 10} ${100},${h / 2 + 20} ${60},${h / 2 - 6}
              C${0},${h / 2 + 30} ${-160},${h / 2 + 20} ${-170},${h / 2 - 14}
              C${-w / 2},${h / 2} ${-w / 2 - 30},${0} ${-w / 2 + 40},${-h / 2 + 20} Z`}
            fill="url(#tex-felt)"
            transform="scale(1)"
          />
          {/* puntada */}
          <path
            d={`M${-w / 2 + 62},${-h / 2 + 34} C${-w / 2 + 80},${-h / 2 - 8} ${-60},${-h / 2 - 8} ${-30},${-h / 2 + 24} C0,${-h / 2 - 16} ${110},${-h / 2 - 8} ${132},${-h / 2 + 26} C${w / 2 - 34},${-h / 2 + 2} ${w / 2 + 4},${-16} ${w / 2 - 30},${20} C${w / 2 - 6},${h / 2 - 26} ${100},${h / 2} ${60},${h / 2 - 26} C0,${h / 2 + 8} ${-150},${h / 2} ${-166},${h / 2 - 34} C${-w / 2 + 20},${h / 2 - 20} ${-w / 2 - 6},0 ${-w / 2 + 62},${-h / 2 + 34}`}
            fill="none"
            stroke="#c9463a"
            strokeWidth={4}
            strokeDasharray="12 9"
            strokeLinecap="round"
          />
          {/* texto */}
          <text x={0} y={30} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={104} letterSpacing={2}>
            {letters.map((ch, i) => {
              const b = pop(t, t0 + 0.12 + i * 0.05, 0.4);
              const hop = Math.max(0, Math.sin((t - t0) * 9 - i * 0.6)) * 10 * (t < t1 ? 1 : 0);
              return (
                <tspan key={i} dy={0} fill={i % 2 ? "#b5352c" : "#8a2620"} opacity={Math.min(1, b * 1.5)} style={{ fontSize: 104 * (0.4 + 0.6 * b) }}>
                  <tspan dy={-hop}>{ch}</tspan>
                  <tspan dy={hop}>{""}</tspan>
                </tspan>
              );
            })}
          </text>
        </g>
      </svg>
    </AbsoluteFill>
  );
};

/** Estrella de 5 picos */
const star = (r: number) => {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const a = (i * Math.PI) / 5 - Math.PI / 2;
    const rr = i % 2 ? r * 0.45 : r;
    pts.push(`${Math.cos(a) * rr},${Math.sin(a) * rr}`);
  }
  return `M${pts.join(" L")} Z`;
};

/** Chispas mágicas: estallido desde (x, y) */
export const Sparkles: React.FC<{ t: number; t0: number; x: number; y: number; n?: number; spread?: number; dur?: number }> = ({ t, t0, x, y, n = 40, spread = 520, dur = 1.4 }) => {
  if (t < t0 || t > t0 + dur) return null;
  const u = (t - t0) / dur;
  const cols = ["#ffe08a", "#fff6d8", "#ffc14a", "#ffffff", "#ffb3c9"];
  return (
    <AbsoluteFill>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute" }}>
        <circle cx={x} cy={y} r={40 + 160 * u} fill="#ffe7a0" opacity={0.22 * (1 - u) * (1 - u) * (1 - u)} />
        {Array.from({ length: n }).map((_, i) => {
          const a = rand(i) * Math.PI * 2;
          const sp = (0.35 + rand(i + 50) * 0.65) * spread;
          const e = 1 - Math.pow(1 - u, 2.2);
          const px = x + Math.cos(a) * sp * e;
          const py = y + Math.sin(a) * sp * e + 160 * u * u;
          const sz = (10 + rand(i + 9) * 22) * Math.sin(Math.min(1, u * 1.2) * Math.PI) * (0.7 + 0.3 * Math.sin(t * 20 + i));
          if (sz <= 0.5) return null;
          return i % 3 === 0 ? (
            <circle key={i} cx={px} cy={py} r={sz * 0.3} fill={cols[i % cols.length]} />
          ) : (
            <path key={i} d={star(sz)} transform={`translate(${px} ${py}) rotate(${(t - t0) * 200 * (rand(i + 3) - 0.5)})`} fill={cols[i % cols.length]} stroke="#e2a93b" strokeWidth={1.2} />
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
