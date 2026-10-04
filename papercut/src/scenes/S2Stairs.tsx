import React from "react";
import { AbsoluteFill } from "remotion";
import { Cam, Plane, project, Stage } from "../lib/engine";
import { P, ease, lerp, rr } from "../lib/paper";
import { C } from "../lib/palette";
import { Bulb, Frame, Garland, twinkle } from "../lib/props";
import { ChildArm } from "../lib/characters";
import { Glow, LightRig } from "../lib/overlays";

/**
 * ESCENA 2 (6–12 s): bajar la escalera con guirnalda y foquitos; asomarse a la sala.
 * Piso de arriba a 280 cm. 15 escalones (huella 26, peralte 18.67). Ancho x −50..50.
 */
const N = 15;
const RISE = 280 / N;
const RUN = 26;
const TOP = 280;
const BOTTOM_Z = N * RUN; // 390
const railY = (z: number) => TOP - (Math.max(0, Math.min(BOTTOM_Z, z)) / RUN) * RISE + 88;

export const stairsCam = (t: number): Cam => {
  const u = t - 6;
  const d = ease(u, 0.5, 4.5); // bajar
  const turn = ease(u, 4.3, 5.8);
  const z = lerp(-70, 420, d) + lerp(0, 40, turn);
  // altura de los ojos sobre el escalón (con rebote de pasos)
  const stepPh = d * N * Math.PI;
  const groundY = z < 0 ? TOP : z > BOTTOM_Z ? 0 : TOP - (z / RUN) * RISE;
  const bob = d > 0 && d < 1 ? -Math.abs(Math.sin(stepPh)) * 3 : 0;
  return {
    x: lerp(-5, 15, d) + lerp(0, 50, turn),
    y: groundY + 112 + bob,
    z,
    yaw: lerp(4, 0, d) + 58 * turn,
    pitch: lerp(-24, -36, ease(u, 0.3, 1.6)) + lerp(0, 22, ease(u, 3.4, 4.8)) + lerp(0, 8, turn),
    roll: Math.sin(stepPh) * 1.2 * (d > 0 && d < 1 ? 1 : 0),
  };
};

const Step: React.FC<{ i: number }> = ({ i }) => {
  const yTop = TOP - RISE * i;
  const z = RUN * i;
  return (
    <>
      {/* peralte */}
      <Plane x={0} y={yTop - RISE} z={z} w={100} h={RISE}>
        <rect width={100} height={RISE} fill={C.cream} />
        <rect width={100} height={RISE} fill="url(#tex-paper)" />
        <rect x={22} width={56} height={RISE} fill={C.redDark} />
        <rect x={22} width={56} height={RISE} fill="url(#tex-knit)" />
        <rect y={RISE - 2.2} width={100} height={2.2} fill="rgba(40,20,8,0.3)" />
      </Plane>
      {/* huella */}
      <Plane x={0} y={yTop - RISE} z={z} w={100} h={RUN} orient="floor">
        <rect width={100} height={RUN} fill={C.wood} />
        <rect width={100} height={RUN} fill="url(#tex-wood)" />
        <rect x={22} width={56} height={RUN} fill={C.red} />
        <rect x={22} width={56} height={RUN} fill="url(#tex-knit)" />
        <rect x={22} width={3} height={RUN} fill={C.gold} opacity={0.8} />
        <rect x={75} width={3} height={RUN} fill={C.gold} opacity={0.8} />
        <rect y={RUN - 3} width={100} height={3} fill={C.woodDark} opacity={0.7} />
      </Plane>
    </>
  );
};

export const S2Stairs: React.FC<{ t: number }> = ({ t }) => {
  const cam = stairsCam(t);
  const u = t - 6;
  const z0 = -160;
  const z1 = 640;
  const L = z1 - z0;
  const HH = 560;
  // barandal en el plano lateral x = 50: coordenadas locales (lx = z - z0, ly = HH - y)
  const lz = (z: number) => z - z0;
  const ly = (y: number) => HH - y;
  const railPts: [number, number][] = [];
  for (let k = 0; k <= 40; k++) {
    const z = lerp(-20, BOTTOM_Z + 10, k / 40);
    railPts.push([lz(z), ly(railY(z))]);
  }
  // guirnalda que cuelga en ondas del pasamanos
  const garPts: [number, number][] = [];
  for (let k = 0; k <= 90; k++) {
    const z = lerp(-20, BOTTOM_Z + 10, k / 90);
    const sag = Math.abs(Math.sin((k / 90) * Math.PI * 9)) * 12;
    garPts.push([lz(z), ly(railY(z) - 4 - sag)]);
  }
  const balusters: React.ReactNode[] = [];
  for (let i = 0; i < N; i++) {
    for (const off of [6, 19]) {
      const z = RUN * i + off;
      const yb = TOP - RISE * (i + 1) + RISE;
      const yt = railY(z);
      balusters.push(<P key={`${i}-${off}`} d={rr(lz(z) - 1.8, ly(yt), 3.6, yt - (TOP - RISE * (i + 1)), 1)} fill={C.cream} tex="paper" sh={0.6} />);
      void yb;
    }
  }
  const stringer = `M${lz(-10)},${ly(TOP + 2)} ${Array.from({ length: N })
    .map((_, i) => `L${lz(RUN * i)},${ly(TOP - RISE * i)} L${lz(RUN * i)},${ly(TOP - RISE * (i + 1))}`)
    .join(" ")} L${lz(BOTTOM_Z)},${ly(0)} L${lz(BOTTOM_Z)},${ly(-1)} L${lz(BOTTOM_Z - 30)},${ly(-1)} L${lz(-10)},${ly(TOP - 30)} Z`;

  const doorP = project(cam, 255, 110, 520);
  const bottomP = project(cam, 0, 60, 430);
  const glows: Glow[] = [
    { x: doorP.sx, y: doorP.sy, r: 650 + 350 * ease(u, 4, 5.8), color: "#ffa34a", a: 0.65 },
    { x: bottomP.sx, y: bottomP.sy, r: 700, color: "#ff9a3c", a: 0.35 },
  ];
  // mano sobre el pasamanos (lado derecho)
  const hz = cam.z + 115;
  const hand = project(cam, 50, railY(hz) + 2, hz);
  const handA = ease(u, 0.6, 1.1) * (1 - ease(u, 4.2, 4.7));

  return (
    <AbsoluteFill>
      <Stage cam={cam} background="#140d09">
        {/* piso de arriba (rellano) */}
        <Plane x={100} y={TOP} z={z0} w={300} h={-z0} orient="floor">
          <rect width={300} height={-z0} fill="url(#floor-planks)" />
          <rect width={300} height={-z0} fill="url(#tex-wood)" />
        </Plane>
        {/* piso de abajo */}
        <Plane x={100} y={0} z={0} w={300} h={z1} orient="floor">
          <rect width={300} height={z1} fill="url(#floor-planks)" />
          <rect width={300} height={z1} fill="url(#tex-wood)" />
          <rect x={60} y={460} width={140} height={90} rx={12} fill={C.teal} />
          <rect x={60} y={460} width={140} height={90} rx={12} fill="url(#tex-knit)" />
        </Plane>
        {/* techo */}
        <Plane x={100} y={HH} z={z1} w={300} h={L} orient="ceiling">
          <rect width={300} height={L} fill="#e4d6bc" />
          <rect width={300} height={L} fill="url(#tex-paper)" />
        </Plane>
        {/* pared izquierda con cuadros */}
        <Plane x={-50} y={0} z={(z0 + z1) / 2} w={L} h={HH} orient="side">
          <rect width={L} height={HH} fill="url(#wp-hall)" />
          <rect width={L} height={HH} fill="url(#tex-paper)" />
          {/* zoclo inclinado */}
          <path d={`M0,${ly(TOP + 14)} L${lz(0)},${ly(TOP + 14)} L${lz(BOTTOM_Z)},${ly(14)} L${L},${ly(14)} L${L},${ly(0)} L${lz(BOTTOM_Z)},${ly(0)} L${lz(0)},${ly(TOP)} L0,${ly(TOP)} Z`} fill={C.cream} />
          <Frame x={lz(60)} y={ly(TOP + 150)} w={40} h={50} kind={1} />
          <Frame x={lz(170)} y={ly(TOP + 80)} w={34} h={34} kind={0} />
          <Frame x={lz(250)} y={ly(150)} w={44} h={56} kind={2} />
          <Frame x={lz(480)} y={ly(170)} w={40} h={50} kind={0} />
        </Plane>
        {/* pared lejana derecha (con la puerta de la sala) */}
        <Plane x={260} y={0} z={(z0 + z1) / 2} w={L} h={HH} orient="side">
          <path d={`M0,0 H${L} V${HH} H0 Z M${lz(450)},${HH} V${HH - 215} H${lz(600)} V${HH} Z`} fillRule="evenodd" fill="url(#wp-hall)" />
          <path d={`M0,0 H${L} V${HH} H0 Z M${lz(450)},${HH} V${HH - 215} H${lz(600)} V${HH} Z`} fillRule="evenodd" fill="url(#tex-paper)" />
          <path d={`M${lz(442)},${HH} V${HH - 223} H${lz(608)} V${HH} H${lz(600)} V${HH - 215} H${lz(450)} V${HH} Z`} fill={C.cream} />
        </Plane>
        {/* la sala vista por la puerta: resplandor y árbol */}
        <Plane x={420} y={0} z={530} w={300} h={260} orient="side" shadow={0}>
          <rect width={300} height={260} fill="url(#wp-stripe)" />
          <rect width={300} height={260} fill="#ffb060" opacity={0.3} />
          <g transform="translate(70 40) scale(1)">
            <path d="M70,0 L130,200 H10 Z" fill={C.greenDark} />
            {Array.from({ length: 18 }).map((_, i) => (
              <Bulb key={i} x={30 + ((i * 37) % 80)} y={40 + ((i * 53) % 150)} c={["#ffcf5a", "#ff6b5a", "#7fd0ff"][i % 3]} on={twinkle(t, i)} r={2} />
            ))}
          </g>
        </Plane>
        {/* pared del fondo, abajo */}
        <Plane x={100} y={0} z={z1} w={300} h={HH}>
          <rect width={300} height={HH} fill="url(#wp-hall)" />
          <rect width={300} height={HH} fill="url(#tex-paper)" />
          <Frame x={40} y={HH - 190} w={60} h={70} kind={0} />
          {/* perchero con bufandas */}
          <P d={rr(150, HH - 175, 80, 6, 2)} fill={C.woodDark} tex="wood" sh={1} />
          <P d={`M165,${HH - 170} c-6,20 -4,60 2,80 h10 c-4,-20 -6,-60 -2,-80 z`} fill={C.red} tex="knitS" sh={1} />
          <P d={`M200,${HH - 170} c-10,10 -14,50 -8,70 h30 c4,-20 0,-60 -8,-70 z`} fill={C.mustard} tex="knitS" sh={1} />
        </Plane>
        {/* escalones */}
        {Array.from({ length: N }).map((_, i) => (
          <Step key={i} i={i} />
        ))}
        {/* barandal derecho con guirnalda y foquitos */}
        <Plane x={50} y={0} z={(z0 + z1) / 2} w={L} h={HH} orient="side">
          <P d={stringer} fill={C.cream} tex="paper" sh={0} />
          {balusters}
          {/* postes */}
          <P d={rr(lz(-26), ly(TOP + 105), 10, 105, 2)} fill={C.woodDark} tex="wood" sh={1} />
          <P d={rr(lz(BOTTOM_Z), ly(110), 11, 110, 2)} fill={C.woodDark} tex="wood" sh={1} />
          <circle cx={lz(-21)} cy={ly(TOP + 108)} r={6} fill={C.woodDark} />
          <circle cx={lz(BOTTOM_Z + 5.5)} cy={ly(113)} r={6.5} fill={C.woodDark} />
          <P d={`M${railPts.map((p) => `${p[0]},${p[1] - 3}`).join(" L")} L${railPts
            .slice()
            .reverse()
            .map((p) => `${p[0]},${p[1] + 3}`)
            .join(" L")} Z`} fill={C.woodDark} tex="wood" sh={1} />
          <Garland pts={garPts} t={t} thick={9} seed={7} bulbs={2} bulbR={2.6} />
          {/* moños rojos */}
          {[0.1, 0.33, 0.56, 0.8].map((k, i) => {
            const z = lerp(-20, BOTTOM_Z, k);
            return <P key={i} d={`M${lz(z)},${ly(railY(z))} c-8,-7 -12,4 -2,4 z M${lz(z)},${ly(railY(z))} c8,-7 12,4 2,4 z M${lz(z) - 2},${ly(railY(z)) + 2} l-4,10 h3 z M${lz(z) + 2},${ly(railY(z)) + 2} l4,10 h-3 z`} fill={C.red} tex="felt" sh={0.6} />;
          })}
        </Plane>
      </Stage>
      <LightRig tint="#2a1408" tintA={0.28} glows={glows} vignette={0.65} />
      {handA > 0.01 && hand.visible ? <ChildArm hx={lerp(hand.sx + 200, hand.sx, handA)} hy={lerp(2100, hand.sy + 30, handA)} fromX={960} side={1} scale={0.95} /> : null}
    </AbsoluteFill>
  );
};
