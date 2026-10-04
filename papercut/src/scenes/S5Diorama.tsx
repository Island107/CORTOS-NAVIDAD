import React from "react";
import { AbsoluteFill } from "remotion";
import { Cam, Plane, project, Stage } from "../lib/engine";
import { E, P, ease, lerp, rand, rr } from "../lib/paper";
import { C } from "../lib/palette";
import { Bulb, twinkle } from "../lib/props";
import { Glow, LightRig } from "../lib/overlays";
import { S34Living } from "./S34Living";
import { FONT } from "./Fx";

/**
 * ESCENA 5 (26–30 s): la cámara sale por la ventana de la sala y se aleja
 * hasta ver la casa como diorama nevado; el trineo sale volando y aparece el texto.
 */
const WIN = { cx: -75, y0: 60, w: 72, h: 128 }; // ventana de la sala (9:16, igual que el cuadro)
const F = 1150;
const PXCM = 2.5;
const zStart = -((F * WIN.w * PXCM) / 1080) / PXCM; // la ventana llena el cuadro

export const dioramaCam = (t: number): Cam => {
  const u = ease(t, 26.0, 28.6);
  const zEnd = -880;
  // interpolación logarítmica de la distancia: zoom de velocidad constante
  const d = Math.exp(lerp(Math.log(-zStart), Math.log(-zEnd), u));
  const k = ease(t, 26.2, 28.6);
  return {
    x: lerp(WIN.cx, 0, k),
    y: lerp(WIN.y0 + WIN.h / 2, 520, k),
    z: -d,
    yaw: 0,
    pitch: 0,
    roll: 0,
  };
};

const Pine: React.FC<{ h: number; c?: string }> = ({ h, c = C.greenDark }) => {
  const w = h * 0.55;
  const tiers = [0.42, 0.66, 0.9];
  return (
    <g>
      <P d={rr(w / 2 - 5, h - 16, 10, 16, 2)} fill={C.woodDark} tex="felt" sh={0.6} />
      {tiers.map((k, i) => {
        const y = h * k;
        const ww = w * (0.45 + 0.27 * i);
        const top = h * (k - 0.42);
        return (
          <g key={i}>
            <P d={`M${w / 2},${top} L${w / 2 + ww / 2},${y - 10} Q${w / 2},${y + 4} ${w / 2 - ww / 2},${y - 10} Z`} fill={i % 2 ? C.green : c} tex="felt" sh={1.2} />
            {/* nieve en las puntas */}
            <P d={`M${w / 2},${top} L${w / 2 + ww * 0.16},${top + (y - top) * 0.32} Q${w / 2 + ww * 0.05},${top + (y - top) * 0.26} ${w / 2},${top + (y - top) * 0.36} Q${w / 2 - ww * 0.05},${top + (y - top) * 0.26} ${w / 2 - ww * 0.16},${top + (y - top) * 0.32} Z`} fill={C.snow} tex="felt" sh={0} />
          </g>
        );
      })}
    </g>
  );
};

const House: React.FC<{ t: number }> = ({ t }) => {
  // tarjeta 440 x 820, origen arriba-izquierda; x mundo = lx − 220, y mundo = 820 − ly
  const X = (x: number) => x + 220;
  const Y = (y: number) => 820 - y;
  const body = `M${X(-180)},${Y(0)} V${Y(520)} H${X(180)} V${Y(0)} Z`;
  const roof = `M${X(-215)},${Y(505)} L${X(0)},${Y(735)} L${X(215)},${Y(505)} Z`;
  const eaveLights = Array.from({ length: 22 }).map((_, i) => {
    const u = i / 21;
    const x = lerp(-205, 205, u);
    const y = 512 + (1 - Math.abs(u - 0.5) * 2) * 220 - 6;
    return <Bulb key={i} x={X(x)} y={Y(y) + 4} c={["#ffcf5a", "#ff6b5a", "#7fd0ff", "#9be07a"][i % 4]} on={twinkle(t, i + 40)} r={3.4} />;
  });
  return (
    <g>
      {/* chimenea */}
      <P d={rr(X(100), Y(790), 46, 200, 2)} fill={C.brick} tex="felt" sh={1.4} />
      {Array.from({ length: 9 }).map((_, r) => (
        <path key={r} d={`M${X(100)},${Y(790 - r * 20)} h46`} stroke={C.brickDark} strokeWidth={1.2} />
      ))}
      <P d={`M${X(94)},${Y(795)} h58 c4,0 4,10 0,12 c-6,3 -8,-2 -14,2 c-8,4 -12,-3 -20,1 c-8,4 -14,-1 -24,-3 c-4,-2 -4,-12 0,-12 Z`} fill={C.snow} tex="boucle" sh={0.8} />
      {/* cuerpo */}
      <P d={body} fill="#b4573f" tex="felt" sh={0} />
      {/* tablas horizontales */}
      {Array.from({ length: 25 }).map((_, i) => (
        <path key={i} d={`M${X(-180)},${Y(i * 21 + 10)} H${X(180)}`} stroke="#93432f" strokeWidth={1.2} opacity={0.6} />
      ))}
      {/* esquineros */}
      <P d={rr(X(-184), Y(520), 14, 520, 1)} fill={C.cream} tex="paper" sh={0.6} />
      <P d={rr(X(170), Y(520), 14, 520, 1)} fill={C.cream} tex="paper" sh={0.6} />
      <P d={rr(X(-184), Y(285), 368, 10, 1)} fill={C.cream} tex="paper" sh={0.6} />
      {/* techo */}
      <P d={roof} fill="#6e3a2a" tex="felt" sh={1.5} />
      {Array.from({ length: 9 }).map((_, i) => (
        <path key={i} d={`M${X(-200 + i * 4)},${Y(510 + i * 24)} H${X(200 - i * 4)}`} stroke="#5a2e20" strokeWidth={1.5} opacity={0.7} />
      ))}
      {/* nieve sobre el techo con goteos */}
      <P
        d={`M${X(-222)},${Y(500)} L${X(0)},${Y(742)} L${X(222)},${Y(500)} ${Array.from({ length: 12 })
          .map((_, i) => {
            const x = lerp(222, -222, (i + 1) / 12);
            const y = 500 + (1 - Math.abs(x / 222)) * 242;
            return `Q${X(x + 18)},${Y(y - 24 - rand(i) * 18)} ${X(x)},${Y(y - 6)}`;
          })
          .join(" ")} Z`}
        fill={C.snow}
        tex="boucle"
        sh={1}
      />
      {/* ventana de la ático (redonda) */}
      <E cx={X(0)} cy={Y(600)} rx={26} fill={C.cream} tex="paper" sh={1} />
      <E cx={X(0)} cy={Y(600)} rx={20} fill="#ffd27a" tex={null} sh={0} />
      <path d={`M${X(-20)},${Y(600)} h40 M${X(0)},${Y(580)} v40`} stroke={C.cream} strokeWidth={3} />
      {/* ventanas de arriba */}
      {[
        [-75, 330, 80, 110, "#2c3a62"],
        [75, 330, 80, 110, "#ffcf7a"],
      ].map(([x, y, w, h, col], i) => (
        <g key={i}>
          <P d={rr(X((x as number) - (w as number) / 2 - 8), Y((y as number) + (h as number) + 8), (w as number) + 16, (h as number) + 16, 2)} fill={C.cream} tex="paper" sh={1} />
          <rect x={X((x as number) - (w as number) / 2)} y={Y((y as number) + (h as number))} width={w as number} height={h as number} fill={col as string} />
          {i === 1 ? (
            <>
              {/* silueta de la lámpara del cuarto */}
              <path d={`M${X(52)},${Y(372)} l6,-22 h18 l6,22 z`} fill="#fff1c8" />
              <rect x={X(62)} y={Y(372)} width={4} height={14} fill="#8a5a2a" />
              <circle cx={X(75)} cy={Y(385)} r={60} fill="#ffe0a0" opacity={0.25} />
            </>
          ) : (
            <path d={`M${X(-110)},${Y(395)} q20,-10 70,-6`} stroke="#fff" strokeWidth={1} opacity={0.4} fill="none" />
          )}
          <path d={`M${X(x as number)},${Y(y as number)} v${-(h as number)} M${X((x as number) - (w as number) / 2)},${Y((y as number) + (h as number) / 2)} h${w}`} stroke={C.cream} strokeWidth={4} />
          <P d={`M${X((x as number) - (w as number) / 2 - 14)},${Y(y as number) + 6} h${(w as number) + 28} v8 h${-(w as number) - 28} z`} fill={C.snow} tex="boucle" sh={0.8} />
        </g>
      ))}
      {/* ventana de la sala: marco (el interior se dibuja aparte) */}
      <P d={`M${X(WIN.cx - WIN.w / 2 - 10)},${Y(WIN.y0 + WIN.h + 10)} h${WIN.w + 20} v${WIN.h + 20} h${-WIN.w - 20} z M${X(WIN.cx - WIN.w / 2)},${Y(WIN.y0 + WIN.h)} v${WIN.h} h${WIN.w} v${-WIN.h} z`} fill={C.cream} tex="paper" sh={1} />
      <rect x={X(WIN.cx - WIN.w / 2)} y={Y(WIN.y0 + WIN.h)} width={WIN.w} height={WIN.h} fill="#ffcf7a" />
      <P d={`M${X(WIN.cx - WIN.w / 2 - 16)},${Y(WIN.y0) + 8} h${WIN.w + 32} v9 h${-WIN.w - 32} z`} fill={C.snow} tex="boucle" sh={0.8} />
      {/* puerta con corona */}
      <P d={rr(X(40), Y(210), 84, 210, 3)} fill={C.cream} tex="paper" sh={1} />
      <P d={rr(X(46), Y(204), 72, 204, 2)} fill={C.greenDark} tex="felt" sh={0.6} />
      <circle cx={X(82)} cy={Y(150)} r={17} fill="none" stroke={C.green} strokeWidth={8} />
      {Array.from({ length: 6 }).map((_, i) => (
        <circle key={i} cx={X(82) + Math.cos(i) * 17} cy={Y(150) + Math.sin(i) * 17} r={2.6} fill={C.red} />
      ))}
      <P d={`M${X(76)},${Y(130)} l6,-4 6,4 -3,7 -3,-3 -3,3z`} fill={C.red} tex="felt" sh={0.4} />
      <E cx={X(108)} cy={Y(100)} rx={3.4} fill={C.gold} tex={null} sh={0.5} />
      {/* luces del alero */}
      <path d={`M${X(-205)},${Y(506)} L${X(0)},${Y(726)} L${X(205)},${Y(506)}`} stroke="#3b3b30" strokeWidth={1} fill="none" />
      {eaveLights}
    </g>
  );
};

/** Trineo con renos. Tarjeta 260 x 90, mira a la izquierda */
const Sleigh: React.FC<{ t: number }> = ({ t }) => {
  const gallop = (i: number) => Math.sin(t * 12 + i * 1.3) * 3;
  const deer = (x: number, i: number, lead?: boolean) => (
    <g key={i} transform={`translate(${x} ${30 + gallop(i)})`}>
      <P d="M0,14 C0,6 10,2 22,4 C30,5 34,10 34,16 C34,22 26,24 16,24 C6,24 0,21 0,14 Z" fill={C.caramelDark} tex="felt" sh={0.8} />
      {/* patas */}
      <path d={`M6,22 l${-6 + gallop(i)},14 M12,22 l${2 - gallop(i)},14 M26,22 l${6 + gallop(i)},12 M30,20 l${10 - gallop(i)},10`} stroke="#5a3a22" strokeWidth={2.4} strokeLinecap="round" />
      {/* cuello y cabeza */}
      <P d="M2,10 C-2,2 -4,-6 -6,-10 C-10,-12 -16,-10 -16,-6 C-14,-2 -8,0 -6,4 Z" fill={C.caramelDark} tex="felt" sh={0.6} />
      <path d="M-8,-10 l-4,-10 m2,4 l-6,-2 M-6,-10 l2,-10 m-1,4 l5,-3" stroke="#6b4a2a" strokeWidth={1.6} strokeLinecap="round" fill="none" />
      <circle cx={-16} cy={-6} r={lead ? 3 : 1.6} fill={lead ? "#ff4a3a" : "#3a2418"} />
      {lead ? <circle cx={-16} cy={-6} r={8} fill="#ff6a4a" opacity={0.35} /> : null}
    </g>
  );
  return (
    <g>
      {/* arnés */}
      <path d="M20,44 C60,40 100,44 150,52" stroke={C.gold} strokeWidth={1.6} fill="none" />
      {deer(10, 0, true)}
      {deer(62, 1)}
      {deer(110, 2)}
      {/* trineo */}
      <P d="M150,40 H240 C252,40 256,50 252,62 C248,72 236,74 220,74 H170 C158,74 150,64 150,52 Z" fill={C.red} tex="knitS" sh={1} />
      <path d="M154,56 H246" stroke={C.gold} strokeWidth={2} />
      <path d="M140,82 H246 C258,82 262,74 258,68 M168,74 V82 M226,74 V82 M140,82 C132,82 130,74 136,72" stroke={C.gold} strokeWidth={3} fill="none" strokeLinecap="round" />
      {/* Santa en el trineo */}
      <E cx={206} cy={30} rx={15} ry={14} fill={C.red} tex="knitS" sh={0.8} />
      <E cx={194} cy={20} rx={7} fill={C.skin} tex="felt" sh={0.5} />
      <P d="M188,22 C186,30 192,36 198,34 C200,30 199,25 196,22 Z" fill={C.white} tex="boucle" sh={0.4} />
      <P d="M188,16 C190,6 202,4 208,10 C212,14 214,18 216,22 C210,18 204,16 200,16 Z" fill={C.red} tex="knitS" sh={0.5} />
      <circle cx={216} cy={22} r={3} fill={C.white} />
      <path d={`M190,26 L${178 + Math.sin(t * 8) * 4},${8 + Math.cos(t * 8) * 3}`} stroke={C.red} strokeWidth={4} strokeLinecap="round" />
      {/* costal (ya vacío) */}
      <P d="M222,24 C222,14 238,14 240,24 C244,34 240,42 230,42 C222,42 220,34 222,24 Z" fill={C.sack} tex="felt" sh={0.5} />
    </g>
  );
};

const sleighPath = (t: number) => {
  const u = ease(t, 27.3, 29.9);
  const pts = [
    [125, 800, 10],
    [40, 860, 80],
    [-150, 900, 160],
    [-480, 925, 250],
  ];
  const seg = Math.min(pts.length - 2, Math.floor(u * (pts.length - 1)));
  const k = u * (pts.length - 1) - seg;
  const a = pts[seg];
  const b = pts[seg + 1];
  const s = k * k * (3 - 2 * k) * 0.3 + k * 0.7;
  return { x: lerp(a[0], b[0], s), y: lerp(a[1], b[1], s), z: lerp(a[2], b[2], s), u };
};

export const S5Diorama: React.FC<{ t: number }> = ({ t }) => {
  const cam = dioramaCam(t);
  // rectángulo de la ventana en pantalla
  const p0 = project(cam, WIN.cx - WIN.w / 2, WIN.y0 + WIN.h, 0);
  const p1 = project(cam, WIN.cx + WIN.w / 2, WIN.y0, 0);
  const rw = p1.sx - p0.sx;
  const rh = p1.sy - p0.sy;
  const sc = rw / 1080;
  const sl = sleighPath(t);
  const slP = project(cam, sl.x, sl.y, sl.z);
  const winGlow = project(cam, WIN.cx, WIN.y0 + WIN.h / 2, -5);
  const upGlow = project(cam, 75, 385, -5);
  const glows: Glow[] = [
    { x: winGlow.sx, y: winGlow.sy, r: Math.max(200, rw * 1.3), color: "#ffb04a", a: 0.7 },
    { x: upGlow.sx, y: upGlow.sy, r: Math.max(120, rw * 1.0), color: "#ffb04a", a: 0.5 },
  ];
  const muntin = 1 - ease(rw, 500, 900);
  const titleIn = (i: number, t0: number) => {
    const u = Math.max(0, Math.min(1, (t - t0 - i * 0.045) / 0.5));
    return u <= 0 ? 0 : 1 - Math.exp(-6 * u) * Math.cos(u * 10);
  };
  const title = "¡Feliz Navidad!".split("");
  const sub = "la magia ocurre en casa";
  const subA = ease(t, 28.75, 29.3);

  return (
    <AbsoluteFill>
      <Stage cam={cam} background="#1b120d">
        {/* mesa donde está el diorama */}
        <Plane x={0} y={-72} z={-900} w={2400} h={1600} orient="floor">
          <rect width={2400} height={1600} fill="#4a2e1e" />
          <rect width={2400} height={1600} fill="url(#tex-wood)" />
        </Plane>
        {/* fondo: cielo nocturno en arco */}
        <Plane x={0} y={-10} z={330} w={900} h={1300} shadow={1}>
          <defs>
            <linearGradient id="sky5" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#141c38" />
              <stop offset="0.7" stopColor="#2c3b6a" />
              <stop offset="1" stopColor="#4a5b8c" />
            </linearGradient>
          </defs>
          <P d="M0,1300 V450 C0,150 200,0 450,0 C700,0 900,150 900,450 V1300 Z" fill="url(#sky5)" tex="paper" sh={0} />
          {Array.from({ length: 60 }).map((_, i) => (
            <circle key={i} cx={40 + rand(i) * 820} cy={60 + rand(i + 100) * 700} r={1.2 + rand(i + 7) * 2.2} fill="#fff6d8" opacity={0.5 + 0.5 * Math.sin(t * 3 + i)} />
          ))}
          <circle cx={680} cy={260} r={95} fill="#fff3c4" opacity={0.12} />
          <E cx={680} cy={260} rx={56} fill="#f8ebbd" tex="paper" sh={0} />
          <E cx={662} cy={248} rx={9} fill="#e8d9a4" tex={null} sh={0} />
          <E cx={698} cy={282} rx={6} fill="#e8d9a4" tex={null} sh={0} />
          {/* colinas nevadas al fondo */}
          <P d="M0,1300 V1000 C150,930 300,980 450,950 C620,915 760,960 900,930 V1300 Z" fill="#cdd6e3" tex="paper" sh={0} />
        </Plane>
        {/* suelo nevado */}
        <Plane x={0} y={0} z={-260} w={880} h={590} orient="floor">
          <rect width={880} height={590} fill={C.snow} />
          <rect width={880} height={590} fill="url(#tex-felt)" />
          {/* caminito */}
          <path d="M290,0 C300,120 340,200 360,260 L380,260 C370,200 330,120 330,0 Z" fill="#d9d2c4" />
        </Plane>
        {/* base de madera del diorama */}
        <Plane x={0} y={-72} z={-262} w={884} h={72} shadow={1}>
          <rect width={884} height={72} fill={C.woodDark} />
          <rect width={884} height={72} fill="url(#tex-wood)" />
          <rect y={0} width={884} height={6} fill="#3a2214" opacity={0.5} />
          <P d={`M0,0 H884 V10 ${Array.from({ length: 22 })
            .map((_, i) => `Q${884 - i * 40 - 20},${18 + rand(i) * 14} ${884 - (i + 1) * 40},10`)
            .join(" ")} Z`} fill={C.snow} tex="boucle" sh={0.8} />
        </Plane>
        {/* árboles de atrás */}
        <Plane x={-330} y={0} z={200} w={200} h={360} shadow={1}>
          <Pine h={360} />
        </Plane>
        <Plane x={340} y={0} z={180} w={200} h={380} shadow={1}>
          <Pine h={380} />
        </Plane>
        {/* casa */}
        <Plane x={0} y={0} z={0} w={440} h={820} shadow={1.2}>
          <House t={t} />
        </Plane>
        {/* humo de la chimenea */}
        <Plane x={125} y={800} z={5} w={120} h={200}>
          {Array.from({ length: 6 }).map((_, i) => {
            const ph = (t * 0.35 + i / 6) % 1;
            return <circle key={i} cx={20 + ph * 50 + Math.sin(ph * 6 + i) * 8} cy={190 - ph * 180} r={8 + ph * 22} fill="#e9e4dc" opacity={0.55 * (1 - ph)} />;
          })}
        </Plane>
        {/* árboles y montículos al frente */}
        <Plane x={-290} y={0} z={-90} w={160} h={290} shadow={1}>
          <Pine h={290} c="#355c3c" />
        </Plane>
        <Plane x={300} y={0} z={-70} w={150} h={260} shadow={1}>
          <Pine h={260} />
        </Plane>
        <Plane x={-170} y={0} z={-190} w={70} h={120} shadow={0.8}>
          <Pine h={120} c="#355c3c" />
        </Plane>
        <Plane x={210} y={0} z={-200} w={60} h={100} shadow={0.8}>
          <Pine h={100} />
        </Plane>
        {/* muñeco de nieve */}
        <Plane x={-215} y={0} z={-150} w={60} h={90} shadow={0.9}>
          <E cx={30} cy={66} rx={24} ry={22} fill={C.snow} tex="felt" />
          <E cx={30} cy={34} rx={17} ry={16} fill={C.snow} tex="felt" />
          <P d={rr(14, 40, 32, 7, 3)} fill={C.red} tex="knitS" sh={0.5} />
          <P d="M38,44 l4,14 h-7 z" fill={C.red} tex="knitS" sh={0.5} />
          <circle cx={25} cy={30} r={1.8} fill={C.black} />
          <circle cx={35} cy={30} r={1.8} fill={C.black} />
          <path d="M30,34 l9,2 l-9,2 z" fill="#e8873a" />
          <P d={rr(18, 6, 24, 14, 2)} fill={C.black} tex="felt" sh={0.4} />
          <P d={rr(14, 18, 32, 4, 2)} fill={C.black} tex="felt" sh={0.3} />
        </Plane>
        <Plane x={0} y={0} z={-240} w={860} h={34} shadow={0.8}>
          <P d={`M0,34 C60,6 120,10 180,22 C260,2 330,8 400,24 C470,6 560,4 620,20 C700,0 780,10 860,26 V34 Z`} fill={C.snow} tex="felt" sh={0.8} />
        </Plane>
        {/* trineo */}
        {sl.u > 0 && sl.u < 1 ? (
          <Plane x={sl.x} y={sl.y} z={sl.z} w={260} h={90} rotZ={-8 + Math.sin(t * 3) * 3} shadow={0.6}>
            <Sleigh t={t} />
          </Plane>
        ) : null}
      </Stage>

      {/* interior de la sala dentro de la ventana */}
      <div style={{ position: "absolute", left: p0.sx, top: p0.sy, width: rw, height: rh, overflow: "hidden" }}>
        <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, transform: `scale(${sc})`, transformOrigin: "0 0" }}>
          <S34Living t={t} />
        </div>
        {/* travesaños de la ventana (aparecen al alejarse) */}
        <div style={{ position: "absolute", left: rw / 2 - 1.5 * sc * 15, top: 0, width: 3 * sc * 15, height: rh, background: C.cream, opacity: muntin }} />
        <div style={{ position: "absolute", left: 0, top: rh * 0.45, width: rw, height: 3 * sc * 15, background: C.cream, opacity: muntin }} />
      </div>

      <LightRig tint="#1a2244" tintA={0.18 * ease(t, 26.2, 27.4)} glows={glows} vignette={0.45} />

      {/* estela mágica del trineo */}
      {sl.u > 0 && sl.u < 1
        ? Array.from({ length: 22 }).map((_, i) => {
            const tt = t - i * 0.05;
            const q = sleighPath(tt);
            if (q.u <= 0) return null;
            const pp = project(cam, q.x + 125, q.y + 20, q.z);
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: pp.sx + Math.sin(i * 2.1) * 6,
                  top: pp.sy + Math.cos(i * 1.7) * 6,
                  width: 10 - i * 0.35,
                  height: 10 - i * 0.35,
                  borderRadius: "50%",
                  background: i % 3 ? "#ffe08a" : "#fff",
                  opacity: 1 - i / 22,
                  boxShadow: "0 0 10px 3px rgba(255,210,120,0.6)",
                }}
              />
            );
          })
        : null}
      {slP.visible ? null : null}

      {/* nieve cayendo */}
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
        {Array.from({ length: 70 }).map((_, i) => {
          const sp = 60 + rand(i) * 90;
          const x = (rand(i + 5) * 1080 + Math.sin(t * 0.8 + i) * 30) % 1080;
          const y = ((rand(i + 9) * 1920 + t * sp) % 1980) - 30;
          return <circle key={i} cx={x} cy={y} r={2 + rand(i + 2) * 4} fill="#fff" opacity={0.85 * ease(t, 26.4, 27.2)} />;
        })}
      </svg>

      {/* texto final, letras de fieltro */}
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <g style={{ filter: "drop-shadow(0 10px 10px rgba(10,5,2,0.5))" }}>
          <text x={540} y={300} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={128}>
            {title.map((ch, i) => {
              const s = titleIn(i, 27.9);
              return (
                <tspan key={i} opacity={Math.min(1, s * 2)} fill={i % 2 ? "#f5efe3" : "#fbe7b8"} stroke="#b5352c" strokeWidth={14} paintOrder="stroke" dy={i === 0 ? 0 : 0} style={{ fontSize: 128 * (0.3 + 0.7 * Math.max(0, s)) }}>
                  {ch}
                </tspan>
              );
            })}
          </text>
          <text x={540} y={410} textAnchor="middle" fontFamily={FONT} fontWeight={600} fontSize={64} fill="#fbe7b8" opacity={subA} stroke="#2b4a33" strokeWidth={10} paintOrder="stroke">
            {sub}
          </text>
        </g>
      </svg>
    </AbsoluteFill>
  );
};
