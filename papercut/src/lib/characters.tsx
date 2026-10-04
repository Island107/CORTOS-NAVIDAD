import React from "react";
import { C } from "./palette";
import { E, P, rr } from "./paper";

/**
 * SANTA — recorte articulado. Tarjeta de 120 x 182 cm (ancla: centro de los pies).
 * Altura total con gorro ≈ 178 cm, a escala con los muebles.
 */
export const SANTA_W = 120;
export const SANTA_H = 182;

export type SantaPose = {
  view?: "front" | "back";
  armL?: number; // grados; 0 = colgando. Positivo = levanta hacia afuera
  armR?: number;
  elbowL?: number;
  elbowR?: number;
  walk?: number; // fase de caminata (rad); undefined = quieto
  blink?: number; // 0..1
  wink?: number; // 0..1 (ojo derecho de la pantalla)
  sack?: "none" | "back" | "hand";
  smile?: number;
  headTilt?: number;
  hatSwing?: number;
  upsideDown?: boolean;
};

const Arm: React.FC<{ side: -1 | 1; angle: number; elbow: number; mitten?: string }> = ({ side, angle, elbow }) => {
  // hombro en coordenadas de la tarjeta
  const sx = 60 + side * 30;
  const sy = 86;
  return (
    <g transform={`translate(${sx} ${sy}) rotate(${-side * (12 + angle)})`}>
      {/* brazo superior */}
      <P d={rr(-8.5, -4, 17, 30, 8)} fill={C.red} tex="knit" sh={0.9} />
      <g transform={`translate(0 22) rotate(${-side * elbow})`}>
        <P d={rr(-8, -4, 16, 22, 7.5)} fill={C.red} tex="knit" sh={0.8} />
        {/* puño de felpa */}
        <P d={rr(-9.5, 14, 19, 8, 4)} fill={C.white} tex="boucle" sh={0.6} />
        {/* guante */}
        <P d="M-7,21 C-9,27 -7,33 0,33.5 C7,33 9,27 7,21 Z" fill={C.white} tex="felt" sh={0.6} />
        <P d={`M${side * 5},23 C${side * 10},22 ${side * 11},27 ${side * 7},29 Z`} fill={C.white} tex="felt" sh={0.4} />
      </g>
    </g>
  );
};

const Sack: React.FC<{ x: number; y: number; r?: number; s?: number }> = ({ x, y, r = 0, s = 1 }) => (
  <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}>
    {/* costal casi vacío: arrugado y desinflado */}
    <P
      d="M-14,-6 C-20,2 -24,20 -20,30 C-15,38 15,38 20,30 C24,20 19,2 13,-6 C8,-3 3,-8 0,-6 C-4,-9 -9,-3 -14,-6 Z"
      fill={C.sack}
      tex="felt"
      sh={1}
    />
    <path d="M-12,8 C-6,14 -2,10 4,16 M6,22 C10,18 14,24 16,20 M-15,24 C-10,28 -6,26 -2,30" stroke={C.sackDark} strokeWidth={0.8} fill="none" strokeLinecap="round" />
    {/* cuello con cuerda */}
    <P d="M-7,-14 C-5,-8 5,-8 7,-14 L5,-6 C2,-4 -2,-4 -5,-6 Z" fill={C.sackDark} tex="felt" sh={0.4} />
    <P d={rr(-8, -8, 16, 3.5, 1.7)} fill={C.gold} tex="felt" sh={0.3} />
    {/* un regalito que asoma */}
    <P d={rr(-4, -19, 9, 7, 1)} fill={C.green} tex="paper" sh={0.4} />
    <path d="M0.5,-19 V-12" stroke={C.gold} strokeWidth={1.4} />
  </g>
);

export const Santa: React.FC<SantaPose> = ({
  view = "front",
  armL = 0,
  armR = 0,
  elbowL = 10,
  elbowR = 10,
  walk,
  blink = 0,
  wink = 0,
  sack = "none",
  smile = 1,
  headTilt = 0,
  hatSwing = 0,
}) => {
  const walking = walk !== undefined;
  const lift = (ph: number) => (walking ? Math.max(0, Math.sin(ph)) * 6 : 0);
  const legL = lift(walk ?? 0);
  const legR = lift((walk ?? 0) + Math.PI);
  const bob = walking ? Math.abs(Math.sin(walk ?? 0)) * 2.5 : 0;
  const sway = walking ? Math.sin(walk ?? 0) * 2.5 : 0;
  const back = view === "back";
  const eyeH = 2.8 * (1 - Math.max(blink, 0));
  const winkH = 2.8 * (1 - Math.max(blink, wink));
  return (
    <g>
      {/* piernas y botas */}
      <g transform={`translate(0 ${-legL})`}>
        <P d={rr(40, 140, 17, 30, 5)} fill={C.redDark} tex="knit" sh={0.8} />
        <P d={`M38,163 h20 v12 h${back ? -2 : -1} c0,4 -4,5 -10,5 h-14 c-4,0 -4,-6 0,-7 h4 z`} fill={C.black} tex="felt" sh={0.8} />
        <P d={rr(37, 160, 22, 6, 3)} fill={C.white} tex="boucle" sh={0.4} />
      </g>
      <g transform={`translate(0 ${-legR})`}>
        <P d={rr(63, 140, 17, 30, 5)} fill={C.redDark} tex="knit" sh={0.8} />
        <P d={`M62,163 h20 v12 c4,1 4,7 0,7 h-14 c-6,0 -10,-1 -10,-5 h0 z`} fill={C.black} tex="felt" sh={0.8} />
        <P d={rr(61, 160, 22, 6, 3)} fill={C.white} tex="boucle" sh={0.4} />
      </g>

      <g transform={`translate(0 ${-bob}) rotate(${sway} 60 150)`}>
        {sack === "back" && !back ? <Sack x={88} y={66} r={18} s={1.1} /> : null}
        {/* brazos traseros en vista de espalda van detrás? no: se dibujan después */}
        {/* cuerpo / abrigo */}
        <P d="M33,74 C14,82 10,118 15,140 C19,154 42,157 60,157 C78,157 101,154 105,140 C110,118 106,82 87,74 C78,70 42,70 33,74 Z" fill={C.red} tex="knit" sh={1.2} />
        {/* sombra suave bajo la barba / costados */}
        <path d="M15,140 C19,154 42,157 60,157 C78,157 101,154 105,140 C104,148 80,152 60,152 C40,152 17,148 15,140 Z" fill="rgba(60,10,8,0.25)" />
        {/* ribete inferior */}
        <P d="M14,138 C30,148 90,148 106,138 C108,146 106,152 102,155 C86,160 34,160 18,155 C14,152 12,146 14,138 Z" fill={C.white} tex="boucle" sh={0.8} />
        {!back ? <P d={rr(55, 92, 10, 52, 3)} fill={C.white} tex="boucle" sh={0.6} /> : null}
        {/* cinturón */}
        <P d="M13,114 C40,119 80,119 107,114 L107,126 C80,131 40,131 13,126 Z" fill={C.black} tex="felt" sh={0.7} />
        {!back ? (
          <>
            <P d={rr(51, 113.5, 18, 15, 2.5)} fill={C.gold} tex="felt" sh={0.6} />
            <P d={rr(55.5, 117.5, 9, 7, 1.5)} fill={C.black} tex={null} sh={0} />
            <E cx={60} cy={102} rx={1.8} fill={C.black} tex={null} sh={0.3} />
            <E cx={60} cy={136} rx={1.8} fill={C.black} tex={null} sh={0.3} />
          </>
        ) : null}

        {/* cabeza */}
        <g transform={`rotate(${headTilt} 60 70)`}>
          {back ? (
            <>
              {/* nuca: barba por los lados, cabello blanco, orejas y gorro que cubre más */}
              <P d="M37,52 C33,72 42,92 60,97 C78,92 87,72 83,52 C74,60 46,60 37,52 Z" fill={C.white} tex="boucle" sh={0.9} />
              <E cx={41.5} cy={50} rx={3.5} ry={5} fill={C.skinShade} tex="felt" sh={0.4} />
              <E cx={78.5} cy={50} rx={3.5} ry={5} fill={C.skinShade} tex="felt" sh={0.4} />
              <P d="M42,40 C42,60 50,66 60,66 C70,66 78,60 78,40 Z" fill={C.whiteShade} tex="boucle" sh={0.6} />
              <path d="M48,48 C50,56 52,60 54,62 M60,48 V64 M72,48 C70,56 68,60 66,62" stroke="#c9bfae" strokeWidth={0.9} fill="none" />
            </>
          ) : (
            <>
              <E cx={60} cy={50} rx={18} ry={18.5} fill={C.skin} tex="felt" sh={0.8} />
              {/* barba */}
              <P d="M40,52 C36,62 36,74 40,82 C43,90 50,96 60,98 C70,96 77,90 80,82 C84,74 84,62 80,52 C76,60 70,64 60,64 C50,64 44,60 40,52 Z" fill={C.white} tex="boucle" sh={1} />
              <path d="M44,78 C50,86 56,88 60,88 M76,78 C70,86 64,88 60,88" stroke={C.whiteShade} strokeWidth={0.8} fill="none" />
              {/* mejillas */}
              <ellipse cx={47} cy={55} rx={6} ry={4.5} fill="url(#g-cheek)" />
              <ellipse cx={73} cy={55} rx={6} ry={4.5} fill="url(#g-cheek)" />
              {/* bigote */}
              <P d="M60,60 C55,56 46,56 43,62 C46,66 54,66 60,63 C66,66 74,66 77,62 C74,56 65,56 60,60 Z" fill={C.white} tex="boucle" sh={0.8} />
              {/* sonrisa */}
              {smile > 0 ? <path d={`M55,67 Q60,${67 + 4 * smile} 65,67`} fill="#7a2a22" stroke="#7a2a22" strokeWidth={0.8} /> : null}
              {/* nariz */}
              <E cx={60} cy={56} rx={4.6} ry={4} fill={C.nose} tex="felt" sh={0.6} />
              {/* ojos */}
              {eyeH > 0.4 ? (
                <>
                  <ellipse cx={52} cy={47} rx={2.1} ry={eyeH / 1.1} fill={C.black} />
                  <circle cx={52.7} cy={46.2} r={0.6} fill="#fff" opacity={0.8} />
                </>
              ) : (
                <path d="M49.5,47.5 Q52,49.5 54.5,47.5" stroke={C.black} strokeWidth={1} fill="none" strokeLinecap="round" />
              )}
              {winkH > 0.4 ? (
                <>
                  <ellipse cx={68} cy={47} rx={2.1} ry={winkH / 1.1} fill={C.black} />
                  <circle cx={68.7} cy={46.2} r={0.6} fill="#fff" opacity={0.8} />
                </>
              ) : (
                <path d="M65,46.5 Q68,49.5 71,46.5" stroke={C.black} strokeWidth={1.2} fill="none" strokeLinecap="round" />
              )}
              {/* cejas */}
              <P d={`M47,${41 - wink * 0.5} C49,38.5 54,38.5 56,${41 - wink * 0.5} C53,40 50,40 47,${41 - wink * 0.5} Z`} fill={C.white} tex={null} sh={0.3} />
              <P d={`M64,${41 + wink * 1.2} C66,38.5 71,38.5 73,${41 + wink * 1.2} C70,40 67,40 64,${41 + wink * 1.2} Z`} fill={C.white} tex={null} sh={0.3} />
            </>
          )}
          {/* gorro */}
          <g transform={`rotate(${hatSwing} 60 30) ${back ? "translate(0 6)" : ""}`}>
            <P d="M42,34 C42,16 54,4 70,2 C84,1 94,10 98,22 C92,16 84,14 80,18 C78,24 78,30 78,34 Z" fill={C.red} tex="knit" sh={0.9} />
            <E cx={98} cy={24} rx={6.5} fill={C.white} tex="boucle" sh={0.8} />
            <P d={rr(38, 30, 44, 10, 5)} fill={C.white} tex="boucle" sh={0.8} />
          </g>
        </g>

        {/* brazos */}
        <Arm side={-1} angle={armL} elbow={elbowL} />
        <Arm side={1} angle={armR} elbow={elbowR} />
        {sack === "back" && back ? <Sack x={34} y={84} r={-14} s={1.15} /> : null}
        {sack === "hand" ? <Sack x={98} y={150} r={8} s={1.05} /> : null}
      </g>
    </g>
  );
};

/** Costal suelto en el piso. Tarjeta 50 x 52 */
export const SackOnFloor: React.FC = () => (
  <g>
    <Sack x={25} y={14} s={1.15} />
  </g>
);

/**
 * PERRITO acostado mirando a la izquierda. Tarjeta 64 x 38 cm.
 */
export const Dog: React.FC<{ tail: number; happy: number; headLift?: number; earFlap?: number }> = ({ tail, happy, headLift = 0, earFlap = 0 }) => (
  <g>
    {/* cola */}
    <g transform={`rotate(${tail} 56 24)`}>
      <P d="M54,25 C60,20 64,12 63,6 C66,10 66,20 58,28 Z" fill={C.caramel} tex="felt" sh={0.6} />
      <E cx={63.3} cy={7} rx={2.2} ry={2.6} fill={C.white} tex="felt" sh={0.3} />
    </g>
    {/* cuerpo */}
    <P d="M14,28 C14,17 26,13 38,14 C50,14 60,18 60,27 C60,34 52,37 38,37 L20,37 C15,37 14,33 14,28 Z" fill={C.caramel} tex="felt" sh={1} />
    <P d="M40,16 C46,15 52,17 55,21 C50,21 44,20 40,16 Z" fill={C.caramelDark} tex="felt" sh={0} />
    {/* pata trasera */}
    <P d="M44,30 C46,26 54,26 56,31 C56,36 52,37 48,37 C44,37 43,34 44,30 Z" fill={C.caramelDark} tex="felt" sh={0.6} />
    {/* patas delanteras */}
    <P d={rr(4, 32, 16, 5.5, 2.7)} fill={C.white} tex="felt" sh={0.5} />
    <P d={rr(9, 34.5, 15, 5, 2.5)} fill={C.white} tex="felt" sh={0.5} />
    {/* pecho */}
    <P d="M18,20 C24,22 26,30 22,36 C18,36 15,32 15,27 C15,23 16,21 18,20 Z" fill={C.white} tex="felt" sh={0.5} />
    {/* cabeza */}
    <g transform={`translate(0 ${-headLift}) rotate(${-headLift * 1.5} 20 22)`}>
      <P d="M8,15 C8,6 15,1 22,1.5 C30,2 34,8 33,15 C32,22 26,25 20,25 C13,25 8,21 8,15 Z" fill={C.caramel} tex="felt" sh={0.9} />
      {/* hocico */}
      <P d="M1,17 C1,12 6,10 11,10 C16,10 19,13 19,17 C19,21 15,23 10,23 C5,23 1,21 1,17 Z" fill={C.white} tex="felt" sh={0.7} />
      <E cx={3.2} cy={14.6} rx={2.6} ry={2.1} fill={C.black} tex={null} sh={0.3} />
      <path d={`M6,19.5 Q9,${21 + happy * 1.5} 12,19.5`} stroke={C.black} strokeWidth={0.6} fill="none" strokeLinecap="round" />
      {happy > 0.5 ? <P d="M8.5,20.5 C8.5,24 11,24.5 11.5,21 Z" fill="#d9635a" tex={null} sh={0} /> : null}
      {/* ojo */}
      {happy > 0.5 ? (
        <path d="M14,11 Q16,8.6 18,11" stroke={C.black} strokeWidth={0.9} fill="none" strokeLinecap="round" />
      ) : (
        <>
          <ellipse cx={16} cy={10.5} rx={1.5} ry={1.8} fill={C.black} />
          <circle cx={16.5} cy={9.9} r={0.45} fill="#fff" />
        </>
      )}
      {/* oreja caída */}
      <g transform={`rotate(${earFlap} 25 5)`}>
        <P d="M22,4 C27,1 32,3 32,9 C33,16 31,22 27,22 C23,21 22,15 22,4 Z" fill={C.brown} tex="felt" sh={0.8} />
      </g>
      {/* collar */}
      <P d="M23,24 C27,24 31,22 33,19 L34,22 C32,25 28,27 23,27 Z" fill={C.red} tex="felt" sh={0.4} />
      <E cx={27} cy={28} rx={1.6} fill={C.gold} tex={null} sh={0.3} />
    </g>
  </g>
);

/**
 * Brazo del niño en primera persona (overlay en pantalla, px).
 * Pijama de punto azul cielo con rayas crema. Se dibuja desde abajo hacia (hx, hy).
 */
export const ChildArm: React.FC<{ hx: number; hy: number; fromX: number; side?: 1 | -1; scale?: number; press?: number }> = ({
  hx,
  hy,
  fromX,
  side = 1,
  scale = 1,
  press = 0,
}) => {
  const fy = 2050;
  const ang = (Math.atan2(hy - fy, hx - fromX) * 180) / Math.PI + 90;
  const len = Math.hypot(hx - fromX, hy - fy) / scale;
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }} viewBox="0 0 1080 1920">
      <g transform={`translate(${fromX} ${fy}) rotate(${ang}) scale(${scale * 10})`} style={{ filter: "drop-shadow(0 12px 18px rgba(20,10,4,0.45))" }}>
        {/* manga: rayas */}
        <g transform={`translate(0 ${-len / 10 + 13})`}>
          <P d={rr(-9, 8, 18, len / 10 + 4, 8)} fill="#8fb3c9" tex="knitS" sh={0} />
          {Array.from({ length: Math.ceil(len / 10 / 7) }).map((_, i) => (
            <path key={i} d={`M-9,${16 + i * 7} h18 v2.6 h-18z`} fill="#efe4cf" opacity={0.85} />
          ))}
          <P d={rr(-10, 5, 20, 7, 3)} fill="#7aa0b8" tex="knitS" sh={0.3} />
          {/* mano */}
          <g transform={`translate(0 ${press * 1.2}) scale(${side} 1)`}>
            <P d="M-7,7 C-8,0 -7,-8 -5,-13 C-4,-15 -1,-15 -1,-12 L0,-16 C0,-19 4,-19 4,-16 L4.5,-13 C5,-16 8.5,-15.5 8,-12 L7,-4 C9,-6 12,-5 11,-2 L7,6 Z" fill={C.skin} tex="felt" sh={0.6} />
            <path d="M-1,-12 L-1,-5 M4,-14 L3.6,-5" stroke={C.skinShade} strokeWidth={0.6} fill="none" />
          </g>
        </g>
      </g>
    </svg>
  );
};
