import React from "react";
import { AbsoluteFill } from "remotion";
import { Cam, Plane, project, Stage } from "../lib/engine";
import { E, P, ease, lerp, rr } from "../lib/paper";
import { C } from "../lib/palette";
import { Frame, Garland, NightWindow, swag } from "../lib/props";
import { ChildArm } from "../lib/characters";
import { Eyelids, Glow, LightRig } from "../lib/overlays";

/**
 * ESCENA 1 (0–6 s): despertar, lámpara, puerta.
 * Cuarto: x −180..180, z −40..380, alto 250 cm.
 */
const ROOM = { x0: -180, x1: 180, z0: -40, z1: 380, h: 250 };
const DOOR = { x0: 70, x1: 150, h: 200 };
const LAMP = { x: -75, z: 125 };
const LAMP_SWITCH = { x: -69, y: 59, z: 124 };
const KNOB = { x: 80, y: 95, z: 377 };

export const bedroomCam = (t: number): Cam => {
  const sit = ease(t, 1.5, 2.6);
  const look = ease(t, 2.3, 3.0) - ease(t, 3.5, 4.3);
  const walk = ease(t, 3.6, 5.2);
  const enter = ease(t, 5.3, 6.2);
  const bob = Math.sin(clampT(t, 3.6, 5.3) * 11) * 2.2 * (walk > 0 && walk < 1 ? 1 : 0);
  return {
    x: lerp(0, 62, walk) + lerp(0, 46, enter),
    y: lerp(80, 92, sit) + lerp(0, 22, walk) + bob,
    z: lerp(0, 200, walk) + lerp(0, 150, enter),
    yaw: -20 * look + 2 * Math.sin(t * 0.7) * (1 - walk),
    pitch: lerp(9, -3, sit) - 4 * look + lerp(0, -2, walk),
    roll: lerp(-8, 0, sit) + Math.sin(t * 9) * 0.6 * walk * (1 - walk) * 4,
  };
};
const clampT = (t: number, a: number, b: number) => Math.max(a, Math.min(b, t)) - a;

const Quilt: React.FC = () => {
  const cols = ["#c9824f", "#8fb3c9", "#d9a440", "#b5352c", "#6f9658", "#e9d7b6"];
  const sq: React.ReactNode[] = [];
  for (let r = 0; r < 4; r++)
    for (let c = 0; c < 10; c++) {
      sq.push(<rect key={`${r}-${c}`} x={c * 22} y={18 + r * 18} width={22} height={18} fill={cols[(r * 3 + c * 2) % cols.length]} />);
    }
  const top = "M0,26 C20,22 40,10 64,8 C86,6 96,20 110,22 C124,24 136,6 160,6 C184,6 200,20 220,22 V90 H0 Z";
  return (
    <g>
      <defs>
        <clipPath id="quilt-clip">
          <path d={top} />
        </clipPath>
      </defs>
      <path d={top} fill="rgba(30,15,6,0.4)" transform="translate(0 -2)" />
      <g clipPath="url(#quilt-clip)">
        <rect x={0} y={0} width={220} height={90} fill="#e9d7b6" />
        <g transform="translate(0 -6)">{sq}</g>
        <rect x={0} y={0} width={220} height={90} fill="url(#tex-knit)" />
        <rect x={0} y={0} width={220} height={90} fill="url(#g-shade-down)" />
        {Array.from({ length: 11 }).map((_, i) => (
          <path key={i} d={`M${i * 22},0 V90`} stroke="#f6ead2" strokeWidth={0.6} strokeDasharray="1.5 1.5" />
        ))}
      </g>
    </g>
  );
};

const Lamp: React.FC<{ on: number }> = ({ on }) => (
  <g>
    {on > 0 ? <circle cx={20} cy={20} r={34} fill="url(#g-bulb)" opacity={0.6 * on} /> : null}
    {/* base */}
    <P d="M10,50 C10,46 30,46 30,50 L30,52 H10 Z" fill={C.woodDark} tex="wood" sh={0.6} />
    <P d={rr(18, 28, 4, 20, 1.5)} fill={C.woodLight} tex="wood" sh={0.5} />
    <E cx={20} cy={44} rx={7} ry={5} fill={C.mustard} tex="felt" sh={0.6} />
    {/* botón */}
    <E cx={26} cy={47} rx={1.6} fill={C.red} tex={null} sh={0.3} />
    {/* pantalla */}
    <P d="M6,30 L12,8 H28 L34,30 Z" fill={on > 0.5 ? "#fff1c8" : "#e8d9b8"} tex="felt" sh={1} />
    <path d="M6,30 L12,8 H28 L34,30 Z" fill="#ffcf73" opacity={0.55 * on} />
    <path d="M7,28 H33 M11,11 H29" stroke={C.red} strokeWidth={1} strokeDasharray="1.2 1.2" />
  </g>
);

const Nightstand: React.FC = () => (
  <g>
    <P d={rr(2, 4, 46, 51, 2)} fill={C.woodLight} tex="wood" sh={1} />
    <P d={rr(0, 0, 50, 6, 1.5)} fill={C.wood} tex="wood" sh={0.8} />
    <P d={rr(6, 12, 38, 16, 1.5)} fill={C.wood} tex="wood" sh={0.6} />
    <E cx={25} cy={20} rx={1.8} fill={C.gold} tex={null} sh={0.3} />
    <P d={rr(6, 32, 38, 16, 1.5)} fill={C.wood} tex="wood" sh={0.6} />
    <E cx={25} cy={40} rx={1.8} fill={C.gold} tex={null} sh={0.3} />
  </g>
);

const Teddy: React.FC = () => (
  <g>
    <E cx={10} cy={10} rx={5} fill={C.caramelDark} tex="felt" />
    <E cx={30} cy={10} rx={5} fill={C.caramelDark} tex="felt" />
    <E cx={20} cy={36} rx={14} ry={13} fill={C.caramel} tex="felt" />
    <E cx={20} cy={16} rx={11} ry={10} fill={C.caramel} tex="felt" />
    <E cx={20} cy={20} rx={4.5} ry={3.5} fill={C.cream} tex="felt" sh={0.3} />
    <circle cx={20} cy={18.6} r={1.3} fill={C.black} />
    <circle cx={16} cy={14} r={1.1} fill={C.black} />
    <circle cx={24} cy={14} r={1.1} fill={C.black} />
    <P d="M12,27 L20,30 L28,27 L28,31 L20,33 L12,31 Z" fill={C.red} tex="felt" sh={0.3} />
  </g>
);

export const S1Bedroom: React.FC<{ t: number }> = ({ t }) => {
  const cam = bedroomCam(t);
  const lampOn = t > 3.15 ? 1 : 0;
  const lampFlick = lampOn ? Math.min(1, (t - 3.15) / 0.12) : 0;
  const door = ease(t, 5.05, 6.0);
  const W = ROOM.x1 - ROOM.x0;
  const D = ROOM.z1 - ROOM.z0;
  // pared del fondo con hueco de puerta
  const lx0 = DOOR.x0 - ROOM.x0;
  const lx1 = DOOR.x1 - ROOM.x0;
  const wallPath = `M0,0 H${W} V${ROOM.h} H0 Z M${lx0},${ROOM.h} V${ROOM.h - DOOR.h} H${lx1} V${ROOM.h} Z`;

  // parpadeo y visión borrosa
  const open =
    t < 0.3
      ? 0
      : t < 0.9
        ? ease(t, 0.3, 0.9) * 0.45
        : t < 1.25
          ? 0.45 * (1 - ease(t, 0.9, 1.15))
          : t < 2.4
            ? ease(t, 1.3, 2.1)
            : 1 - (ease(t, 2.45, 2.55) - ease(t, 2.6, 2.75));
  const blur = lerp(16, 0, ease(t, 0.8, 2.9));

  const lampP = project(cam, LAMP.x, 72, LAMP.z);
  const doorP = project(cam, 110, 100, ROOM.z1 + 40);
  const winP = project(cam, -75, 145, ROOM.z1);
  const glows: Glow[] = [
    { x: winP.sx, y: winP.sy, r: 120 * winP.s * 0.8 + 200, color: "#7d9ad8", a: 0.35 },
    ...(lampOn
      ? [
          { x: lampP.sx, y: lampP.sy, r: 900, color: "#ffb860", a: 0.55 * lampFlick },
          { x: lampP.sx, y: lampP.sy, r: 260, color: "#ffe2a0", a: 0.6 * lampFlick },
        ]
      : []),
    ...(door > 0 ? [{ x: doorP.sx, y: doorP.sy, r: 700 + 500 * door, color: "#ffb35c", a: 0.6 * door }] : []),
  ];
  const night = 1 - lampFlick;

  // mano: lámpara y luego perilla
  const reach = ease(t, 2.55, 3.1) - ease(t, 3.35, 3.8);
  const sw = project(cam, LAMP_SWITCH.x, LAMP_SWITCH.y, LAMP_SWITCH.z);
  const reach2 = ease(t, 4.55, 5.05) - ease(t, 5.45, 5.9);
  const knobOpen = ease(t, 5.05, 6.0);
  const kx = KNOB.x + Math.sin((knobOpen * 70 * Math.PI) / 180) * 0; // la perilla sigue a la puerta
  const kz = KNOB.z - Math.sin((knobOpen * 70 * Math.PI) / 180) * (DOOR.x1 - KNOB.x);
  const kxx = DOOR.x1 - Math.cos((knobOpen * 70 * Math.PI) / 180) * (DOOR.x1 - KNOB.x);
  const kn = project(cam, knobOpen > 0 ? kxx : kx, KNOB.y, kz);

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ filter: blur > 0.3 ? `blur(${blur}px)` : undefined }}>
        <Stage cam={cam} background="#120c0a">
          {/* piso */}
          <Plane x={0} y={0} z={ROOM.z0} w={W} h={D} orient="floor">
            <rect width={W} height={D} fill="url(#floor-planks)" />
            <rect width={W} height={D} fill="url(#tex-wood)" />
          </Plane>
          {/* tapete */}
          <Plane x={20} y={0.4} z={140} w={150} h={110} orient="floor">
            <P d="M75,0 C120,0 150,25 150,55 C150,85 120,110 75,110 C30,110 0,85 0,55 C0,25 30,0 75,0 Z" fill={C.mustard} tex="knit" sh={0} />
            <path d="M75,12 C112,12 136,32 136,55 C136,78 112,98 75,98 C38,98 14,78 14,55 C14,32 38,12 75,12 Z" fill="none" stroke={C.cream} strokeWidth={4} strokeDasharray="5 3" />
          </Plane>
          {/* techo */}
          <Plane x={0} y={ROOM.h} z={ROOM.z1} w={W} h={D} orient="ceiling">
            <rect width={W} height={D} fill="#e8dcc4" />
            <rect width={W} height={D} fill="url(#tex-paper)" />
          </Plane>
          {/* paredes laterales */}
          <Plane x={ROOM.x0} y={0} z={(ROOM.z0 + ROOM.z1) / 2} w={D} h={ROOM.h} orient="side">
            <rect width={D} height={ROOM.h} fill="url(#wp-stars)" />
            <rect width={D} height={ROOM.h} fill="url(#tex-paper)" />
            <P d={rr(0, ROOM.h - 14, D, 14, 0)} fill={C.cream} tex="paper" sh={0} />
            <Frame x={200} y={70} w={44} h={56} kind={2} />
          </Plane>
          <Plane x={ROOM.x1} y={0} z={(ROOM.z0 + ROOM.z1) / 2} w={D} h={ROOM.h} orient="side">
            <rect width={D} height={ROOM.h} fill="url(#wp-stars)" />
            <rect width={D} height={ROOM.h} fill="url(#tex-paper)" />
            <P d={rr(0, ROOM.h - 14, D, 14, 0)} fill={C.cream} tex="paper" sh={0} />
            <Frame x={250} y={80} w={40} h={50} kind={0} />
          </Plane>

          {/* pasillo detrás de la puerta: cálido, con barandal y guirnalda */}
          <Plane x={110} y={0} z={ROOM.z1 + 120} w={260} h={ROOM.h} shadow={0.6}>
            <rect width={260} height={ROOM.h} fill="url(#wp-hall)" />
            <rect width={260} height={ROOM.h} fill="#ffb060" opacity={0.25} />
            <rect width={260} height={ROOM.h} fill="url(#tex-paper)" />
            <Frame x={150} y={60} w={34} h={44} kind={1} />
          </Plane>
          <Plane x={110} y={0} z={ROOM.z1 + 60} w={260} h={ROOM.h} svg>
            {/* barandal de la escalera, visto de frente */}
            <P d={rr(0, ROOM.h - 98, 260, 7, 2)} fill={C.woodDark} tex="wood" sh={1} />
            {Array.from({ length: 13 }).map((_, i) => (
              <P key={i} d={rr(6 + i * 20, ROOM.h - 92, 5, 92, 1.5)} fill={C.cream} tex="paper" sh={0.8} />
            ))}
            <Garland pts={swag(0, ROOM.h - 94, 130, ROOM.h - 94, 14, 20).concat(swag(130, ROOM.h - 94, 260, ROOM.h - 94, 14, 20).slice(1))} t={t} thick={7} seed={5} bulbs={2} bulbR={1.6} />
          </Plane>
          <Plane x={110} y={0} z={ROOM.z1} w={160} h={120} orient="floor">
            <rect width={160} height={120} fill="url(#floor-planks)" />
            <rect width={160} height={120} fill="#ffb060" opacity={0.15} />
          </Plane>

          {/* pared del fondo */}
          <Plane x={0} y={0} z={ROOM.z1} w={W} h={ROOM.h} shadow={0}>
            <path d={wallPath} fillRule="evenodd" fill="url(#wp-stars)" />
            <path d={wallPath} fillRule="evenodd" fill="url(#tex-paper)" />
            <P d={rr(0, ROOM.h - 14, lx0, 14, 0)} fill={C.cream} tex="paper" sh={0} />
            <P d={rr(lx1, ROOM.h - 14, W - lx1, 14, 0)} fill={C.cream} tex="paper" sh={0} />
            {/* marco de la puerta */}
            <path d={`M${lx0 - 7},${ROOM.h} V${ROOM.h - DOOR.h - 7} H${lx1 + 7} V${ROOM.h} H${lx1} V${ROOM.h - DOOR.h} H${lx0} V${ROOM.h} Z`} fill={C.cream} />
            <path d={`M${lx0 - 7},${ROOM.h} V${ROOM.h - DOOR.h - 7} H${lx1 + 7} V${ROOM.h} H${lx1} V${ROOM.h - DOOR.h} H${lx0} V${ROOM.h} Z`} fill="url(#tex-paper)" />
            <NightWindow x={50} y={60} w={90} h={95} t={t} curtains="#8fb3c9" />
            {/* repisa con libros y juguetes */}
            <P d={rr(160, 100, 70, 5, 1)} fill={C.wood} tex="wood" sh={1.2} />
            <P d={rr(166, 80, 7, 20, 1)} fill={C.red} tex="paper" sh={0.6} />
            <P d={rr(174, 83, 6, 17, 1)} fill={C.green} tex="paper" sh={0.6} />
            <P d={rr(181, 78, 8, 22, 1)} fill={C.mustard} tex="paper" sh={0.6} />
            <P d="M205,100 L205,86 L212,80 L219,86 L219,100 Z" fill={C.cream} tex="paper" sh={0.6} />
            <P d="M208,92 h8 v8 h-8z" fill={C.red} tex={null} sh={0} />
            {/* guirnalda de estrellas de papel */}
            {Array.from({ length: 9 }).map((_, i) => {
              const sx = 20 + i * 35;
              const sy = 30 + Math.sin((i / 8) * Math.PI) * 14;
              return (
                <g key={i} transform={`translate(${sx} ${sy}) rotate(${Math.sin(t * 1.3 + i) * 6})`}>
                  <P d="M0,-5 L1.5,-1.6 L5,-1.5 L2.3,0.8 L3.1,4.4 L0,2.4 L-3.1,4.4 L-2.3,0.8 L-5,-1.5 L-1.5,-1.6 Z" fill={i % 2 ? C.gold : C.cream} tex="paper" sh={0.5} />
                </g>
              );
            })}
            <path d={`M10,22 Q${W / 2},52 ${W - 10},22`} stroke={C.woodDark} strokeWidth={0.5} fill="none" />
          </Plane>

          {/* puerta (bisagra a la derecha, abre hacia el cuarto) */}
          <Plane x={DOOR.x1} y={0} z={ROOM.z1 - 1} w={DOOR.x1 - DOOR.x0} h={DOOR.h} ax={1} rotY={70 * door} shadow={0.8}>
            <P d={rr(0, 0, 80, 200, 1)} fill={C.cream} tex="paper" sh={0} />
            <P d={rr(10, 12, 60, 70, 2)} fill="#eadbbd" tex="paper" sh={0.6} />
            <P d={rr(10, 96, 60, 90, 2)} fill="#eadbbd" tex="paper" sh={0.6} />
            {/* corona de fieltro en la puerta */}
            <circle cx={40} cy={47} r={15} fill="none" stroke={C.greenDark} strokeWidth={8} />
            <circle cx={40} cy={47} r={15} fill="none" stroke="url(#tex-felt)" strokeWidth={8} />
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <circle key={i} cx={40 + Math.cos(i * 1.05) * 15} cy={47 + Math.sin(i * 1.05) * 15} r={1.8} fill={C.red} />
            ))}
            <P d="M34,60 l6,-4 6,4 -3,6 -3,-3 -3,3z" fill={C.red} tex="felt" sh={0.4} />
            <E cx={8} cy={105} rx={3} fill={C.gold} tex={null} sh={0.6} />
          </Plane>

          {/* juguetes en el piso */}
          <Plane x={125} y={0} z={300} w={40} h={50} shadow={0.6}>
            <Teddy />
          </Plane>
          <Plane x={-130} y={0} z={300} w={40} h={20} shadow={0.6}>
            <P d={rr(0, 6, 14, 14, 1)} fill={C.red} tex="paper" />
            <P d={rr(16, 6, 14, 14, 1)} fill="#5f86b6" tex="paper" />
            <P d={rr(8, -8, 14, 14, 1)} fill={C.mustard} tex="paper" />
          </Plane>

          {/* buró y lámpara */}
          <Plane x={LAMP.x} y={0} z={LAMP.z + 3} w={50} h={55} shadow={0.8}>
            <Nightstand />
          </Plane>
          <Plane x={LAMP.x} y={55} z={LAMP.z} w={40} h={52} shadow={0.6}>
            <Lamp on={lampFlick} />
          </Plane>

          {/* edredón (primer plano) */}
          <Plane x={0} y={-30} z={48} w={220} h={90} shadow={1}>
            <Quilt />
          </Plane>
        </Stage>
      </AbsoluteFill>

      <LightRig
        tint={night > 0.5 ? "#1c2448" : "#5a3010"}
        tintA={night > 0.5 ? 0.55 : 0.12}
        glows={glows}
        vignette={0.7}
      />
      {/* lucecita de la lámpara en la mano */}
      {reach > 0.01 ? <ChildArm hx={lerp(sw.sx - 120, sw.sx, reach)} hy={lerp(2100, sw.sy + 10, reach)} fromX={300} side={-1} scale={1.05} press={t > 3.0 && t < 3.3 ? 1 : 0} /> : null}
      {reach2 > 0.01 ? <ChildArm hx={lerp(kn.sx + 160, kn.sx, reach2)} hy={lerp(2100, kn.sy + 10, reach2)} fromX={780} side={-1} scale={1.1} /> : null}
      <Eyelids open={open} />
    </AbsoluteFill>
  );
};

