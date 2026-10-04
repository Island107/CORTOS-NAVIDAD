import React from "react";
import { AbsoluteFill } from "remotion";
import { Cam, Plane, project, Stage } from "../lib/engine";
import { E, P, ease, lerp, rand, rr } from "../lib/paper";
import { C } from "../lib/palette";
import { FIRE_OPEN, Fire, Firebox, FireplaceFront, Frame, Garland, Gifts, NightWindow, SofaBack, SofaFront, swag, Tree } from "../lib/props";
import { Dog, Santa, SANTA_H, SANTA_W, SackOnFloor } from "../lib/characters";
import { Glow, LightRig } from "../lib/overlays";

/**
 * ESCENAS 3 y 4 (12–26 s): la sala. Comparten el mismo set y cámara continua.
 * Sala: x −200..200, z 0..520, alto 260 cm.
 */
export const ROOM = { x0: -200, x1: 230, z1: 520, h: 260 };
export const FX = 40; // centro de la chimenea
const FZ = 505; // frente de la chimenea
const FW = 150;
const FH = 125;
const OPEN = { x0: FX - FW / 2 + FIRE_OPEN.x0, x1: FX - FW / 2 + FIRE_OPEN.x1, top: FH - FIRE_OPEN.top };
const SOFA = { x: 135, z: 330 };
const TREE = { x: -125, z: 470 };

export const livingCam = (t: number): Cam => {
  const a = ease(t, 12, 14.6);
  const push = ease(t, 20, 21.7);
  const back = ease(t, 25.3, 26.2);
  const drift = ease(t, 14.6, 20);
  const breathe = Math.sin(t * 1.3) * 1.2;
  return {
    x: lerp(lerp(-28, 0, a), FX - 4, push),
    y: lerp(lerp(104, 110, a), 86, push) + breathe * 0.4 + back * 6,
    z: lerp(lerp(-15, 40, a) + 30 * drift, 318, push) - back * 30,
    yaw: lerp(lerp(7, 3, a) + 3 * drift, 0, push),
    pitch: lerp(-6, -2.5, push),
    roll: lerp(2.5, 0, a),
  };
};

/** Estado de Santa en el tiempo */
const santaState = (t: number) => {
  // posiciones clave
  let x = 32;
  let z = 322;
  let y = 0;
  let view: "front" | "back" = "front";
  let flipX = 1; // escala horizontal para la vuelta de papel
  let sack: "none" | "back" | "hand" = "none";
  let armL = 0;
  let armR = 0;
  let elbowL = 10;
  let elbowR = 10;
  let headTilt = 0;
  let walk: number | undefined;
  let visible = true;
  let upside = false;
  let rotZ = 0;
  let wink = 0;
  let blink = 0;

  // A. acaricia al perrito
  const petEnd = ease(t, 14.4, 14.9);
  armR = lerp(50 + 6 * Math.sin(t * 6), 0, petEnd);
  elbowR = lerp(4, 10, petEnd);
  headTilt = lerp(7, 0, petEnd);
  // B. saluda a la cámara
  const wave = ease(t, 14.7, 15.1) * (1 - ease(t, 16.3, 16.7));
  armL = wave * (112 + 14 * Math.sin(t * 11));
  elbowL = 10 + wave * (30 + 22 * Math.sin(t * 11 + 1.2));
  if (t > 14.7 && t < 16.7) headTilt = -4 * wave;
  // C. recoge el costal (a su izquierda)
  const pick = ease(t, 16.6, 17.0) * (1 - ease(t, 17.05, 17.35));
  if (t > 16.4) {
    x = lerp(32, 4, ease(t, 16.2, 16.8));
    walk = t > 16.2 && t < 16.75 ? t * 9 : undefined;
    armL = Math.max(armL, pick * 34);
    elbowL = lerp(elbowL, 0, pick);
    y = -5 * pick;
    rotZ = -5 * pick;
  }
  if (t > 17.05) sack = "back";
  // vuelta de papel (frente → espalda)
  if (t > 17.2 && t < 17.6) {
    const u = (t - 17.2) / 0.4;
    flipX = Math.abs(Math.cos(u * Math.PI));
    view = u < 0.5 ? "front" : "back";
  } else if (t >= 17.6) view = "back";
  // D. camina a la chimenea
  if (t >= 17.5) {
    const w = ease(t, 17.5, 19.05);
    x = lerp(4, FX, w);
    z = lerp(322, 492, w);
    walk = t * 9;
    if (t > 19.05) walk = undefined;
  }
  // F. entra y sube por la chimenea
  if (t >= 19.0) {
    z = lerp(492, 526, ease(t, 19.0, 19.35));
    x = FX;
    y = lerp(0, 175, ease(t, 19.35, 19.95));
  }
  if (t >= 20.0) visible = false;
  // H–L. de cabeza dentro de la chimenea
  if (t >= 21.1 && t < 24.7) {
    visible = true;
    upside = true;
    view = "front";
    sack = "none";
    walk = undefined;
    x = FX;
    z = 526;
    const drop = ease(t, 21.1, 21.55);
    const over = Math.sin(ease(t, 21.5, 21.9) * Math.PI) * 6;
    const up = ease(t, 24.35, 24.6);
    y = lerp(300, 176, drop) - over + up * 140;
    rotZ = 180 + Math.sin(t * 2.2) * 3;
    const w2 = ease(t, 21.6, 21.9) * (1 - ease(t, 23.6, 23.9));
    armR = 0;
    armL = 0;
    elbowL = 10;
    elbowR = 10;
    // brazo que saluda (de cabeza)
    // (de cabeza los lados se invierten: el brazo izquierdo queda a la derecha en pantalla)
    armL = lerp(10, 158 + 14 * Math.sin(t * 10), w2);
    elbowL = lerp(10, 20 + 16 * Math.sin(t * 10 + 1), w2);
    armR = lerp(5, 120, ease(t, 21.5, 21.8));
    elbowR = 5;
    wink = ease(t, 23.25, 23.4) * (1 - ease(t, 23.75, 23.9));
    headTilt = 0;
  }
  blink = t % 3.7 < 0.12 ? 1 : 0;
  return { x, y, z, view, flipX, sack, armL, armR, elbowL, elbowR, headTilt, walk, visible, upside, rotZ, wink, blink };
};

const contactShadow = ({ x, z, w, d, a = 0.35 }: { x: number; z: number; w: number; d: number; a?: number }) => (
  <Plane key={`cs-${x}-${z}`} x={x} y={2.6} z={z - d / 2} w={w} h={d} orient="floor" prio={0.2}>
    <defs>
      <radialGradient id="cs">
        <stop offset="0" stopColor="#1a0c05" stopOpacity={0.9} />
        <stop offset="1" stopColor="#1a0c05" stopOpacity={0} />
      </radialGradient>
    </defs>
    <ellipse cx={w / 2} cy={d / 2} rx={w / 2} ry={d / 2} fill="url(#cs)" opacity={a} />
  </Plane>
);

export const S34Living: React.FC<{ t: number; camOverride?: Cam; noOverlay?: boolean }> = ({ t, camOverride, noOverlay }) => {
  const cam = camOverride ?? livingCam(t);
  const st = santaState(t);
  const fireK = lerp(1, 0.12, ease(t, 18.3, 18.9)) + lerp(0, 0.88, ease(t, 24.8, 25.4));
  const flick = 0.85 + 0.15 * Math.sin(t * 13) * Math.sin(t * 7.3);
  const W = ROOM.x1 - ROOM.x0;
  const RX = (ROOM.x0 + ROOM.x1) / 2;
  const D = ROOM.z1;
  const H = ROOM.h;
  const lx = (x: number) => x - ROOM.x0;
  const ly = (y: number) => H - y;
  const wallPath = `M0,0 H${W} V${H} H0 Z M${lx(OPEN.x0)},${H} V${ly(OPEN.top)} H${lx(OPEN.x1)} V${H} Z`;
  const sackOnFloor = t < 17.05;

  const treeP = project(cam, TREE.x, 120, TREE.z);
  const fireP = project(cam, FX, 30, 535);
  const glows: Glow[] = [
    { x: treeP.sx, y: treeP.sy, r: 260 * treeP.s + 120, color: "#ffb24a", a: 0.75 },
    { x: fireP.sx, y: fireP.sy, r: (220 * fireP.s + 80) * (0.5 + 0.5 * fireK), color: "#ff8a30", a: 0.8 * fireK * flick },
  ];
  // destello al desaparecer
  const flash = ease(t, 24.3, 24.45) * (1 - ease(t, 24.5, 25.2));
  const headP = project(cam, FX, 52, 520);
  if (flash > 0) glows.push({ x: headP.sx, y: headP.sy, r: 380, color: "#ffd88a", a: 0.8 * flash });

  return (
    <AbsoluteFill>
      <Stage cam={cam} background="#140c08">
        {/* piso */}
        <Plane x={RX} y={0} z={0} w={W} h={D} orient="floor">
          <rect width={W} height={D} fill="url(#floor-planks)" />
          <rect width={W} height={D} fill="url(#tex-wood)" />
        </Plane>
        {/* tapete redondo */}
        <Plane x={-10} y={2} z={200} w={260} h={200} orient="floor" prio={0.1}>
          <ellipse cx={130} cy={100} rx={130} ry={100} fill={C.cream} />
          <ellipse cx={130} cy={100} rx={110} ry={84} fill={C.red} />
          <ellipse cx={130} cy={100} rx={86} ry={66} fill={C.cream} />
          <ellipse cx={130} cy={100} rx={62} ry={48} fill={C.green} />
          <ellipse cx={130} cy={100} rx={38} ry={30} fill={C.cream} />
          <ellipse cx={130} cy={100} rx={130} ry={100} fill="url(#tex-knit)" />
        </Plane>
        {/* techo */}
        <Plane x={RX} y={H} z={D} w={W} h={D} orient="ceiling">
          <rect width={W} height={D} fill="#e6d6bb" />
          <rect width={W} height={D} fill="url(#tex-paper)" />
        </Plane>
        {/* paredes laterales */}
        <Plane x={ROOM.x0} y={0} z={D / 2} w={D} h={H} orient="side">
          <rect width={D} height={H} fill="url(#wp-stripe)" />
          <rect width={D} height={H} fill="url(#tex-paper)" />
          <P d={rr(0, H - 90, D, 90, 0)} fill={C.cream} tex="paper" sh={0} />
          <P d={rr(0, H - 94, D, 6, 0)} fill={C.woodDark} tex="wood" sh={0.6} />
          <Frame x={250} y={60} w={50} h={64} kind={1} />
          <Frame x={320} y={74} w={40} h={40} kind={0} />
        </Plane>
        <Plane x={ROOM.x1} y={0} z={D / 2} w={D} h={H} orient="side">
          <rect width={D} height={H} fill="url(#wp-stripe)" />
          <rect width={D} height={H} fill="url(#tex-paper)" />
          <P d={rr(0, H - 90, D, 90, 0)} fill={C.cream} tex="paper" sh={0} />
          <P d={rr(0, H - 94, D, 6, 0)} fill={C.woodDark} tex="wood" sh={0.6} />
          <Frame x={200} y={70} w={56} h={44} kind={0} />
        </Plane>

        {/* interior de la chimenea */}
        <Plane x={FX} y={-5} z={552} w={90} h={90} prio={-1}>
          <Firebox />
        </Plane>
        <Plane x={FX} y={0} z={540} w={90} h={70} prio={-1}>
          <Fire cx={45} by={66} t={t} k={fireK} w={44} />
        </Plane>
        <Plane x={OPEN.x0} y={0} z={530} w={50} h={OPEN.top} orient="side" prio={-0.5}>
          <rect width={50} height={OPEN.top} fill="#2a140d" />
        </Plane>
        <Plane x={OPEN.x1} y={0} z={530} w={50} h={OPEN.top} orient="side" prio={-0.5}>
          <rect width={50} height={OPEN.top} fill="#2a140d" />
        </Plane>

        {/* pared del fondo */}
        <Plane x={RX} y={0} z={ROOM.z1} w={W} h={H} prio={0}>
          <path d={wallPath} fillRule="evenodd" fill="url(#wp-stripe)" />
          <path d={wallPath} fillRule="evenodd" fill="url(#tex-paper)" />
          <path d={`M0,${H - 90} H${lx(OPEN.x0)} V${H} H0 Z M${lx(OPEN.x1)},${H - 90} H${W} V${H} H${lx(OPEN.x1)} Z`} fill={C.cream} />
          {/* hollín alrededor del hueco (solo se ve a través de la boca de la chimenea) */}
          <rect x={lx(OPEN.x0) - 30} y={ly(OPEN.top) - 30} width={30} height={OPEN.top + 30} fill="#2a140d" />
          <rect x={lx(OPEN.x1)} y={ly(OPEN.top) - 30} width={30} height={OPEN.top + 30} fill="#2a140d" />
          <rect x={lx(OPEN.x0) - 30} y={ly(OPEN.top) - 30} width={OPEN.x1 - OPEN.x0 + 60} height={30} fill="#2a140d" />
          <rect x={0} y={H - 94} width={W} height={6} fill={C.woodDark} />
          {/* chimenea (parte alta, de yeso) */}
          <P d={rr(lx(FX - 58), 0, 116, H - FH + 4, 0)} fill="#e9dcc3" tex="paper" sh={1.2} />
          <path d={`M${lx(FX - 58)},0 V${H - FH}`} stroke="rgba(40,20,8,0.25)" strokeWidth={2} />
          {/* corona */}
          <circle cx={lx(FX)} cy={70} r={20} fill="none" stroke={C.greenDark} strokeWidth={10} />
          <circle cx={lx(FX)} cy={70} r={20} fill="none" stroke="url(#tex-felt)" strokeWidth={10} />
          {Array.from({ length: 8 }).map((_, i) => (
            <circle key={i} cx={lx(FX) + Math.cos(i * 0.8) * 20} cy={70 + Math.sin(i * 0.8) * 20} r={2.4} fill={i % 2 ? C.red : C.gold} />
          ))}
          <P d={`M${lx(FX) - 8},${92} l8,-5 8,5 -4,8 -4,-4 -4,4z`} fill={C.red} tex="felt" sh={0.5} />
          <NightWindow x={lx(130)} y={55} w={56} h={95} t={t} curtains={C.red} />
          {/* guirnalda en lo alto */}
          <Garland pts={swag(4, 8, W / 2, 8, 22, 22).concat(swag(W / 2, 8, W - 4, 8, 22, 22).slice(1))} t={t} thick={8} seed={11} bulbs={2} bulbR={2} />
        </Plane>

        {/* frente de la chimenea */}
        <Plane x={FX} y={0} z={FZ} w={FW} h={FH} shadow={1}>
          <FireplaceFront t={t} />
        </Plane>

        {/* árbol (dos capas para parallax) */}
        {contactShadow({ x: TREE.x, z: TREE.z - 10, w: 150, d: 60, a: 0.45 })}
        <Plane x={TREE.x} y={0} z={TREE.z} w={140} h={220} shadow={1}>
          <Tree t={t} layer="back" />
        </Plane>
        <Plane x={TREE.x} y={2} z={TREE.z - 14} w={140} h={220} shadow={0.8}>
          <Tree t={t} layer="front" />
        </Plane>
        <Plane x={TREE.x + 10} y={0} z={TREE.z - 40} w={150} h={42} shadow={0.8}>
          <Gifts />
        </Plane>

        {/* sillón y perrito */}
        {contactShadow({ x: SOFA.x, z: SOFA.z + 10, w: 190, d: 50, a: 0.5 })}
        <Plane x={SOFA.x} y={0} z={SOFA.z + 16} w={170} h={92} shadow={1}>
          <SofaBack />
        </Plane>
        <Plane x={SOFA.x - 13} y={44} z={SOFA.z + 7} w={64} h={38} shadow={0.6}>
          <Dog
            tail={(t < 15 ? 22 : 12) * Math.sin(t * (t < 15 ? 16 : 9))}
            happy={t < 14.7 ? 1 : 0}
            headLift={t > 14.6 && t < 17 ? 3 * ease(t, 14.6, 15) : t < 14.6 ? 1.5 + Math.sin(t * 6) : 0}
            earFlap={t < 14.6 ? 4 * Math.sin(t * 6) : 0}
          />
        </Plane>
        <Plane x={SOFA.x} y={0} z={SOFA.z} w={170} h={60} shadow={1}>
          <SofaFront />
        </Plane>

        {/* costal en el piso */}
        {sackOnFloor ? (
          <Plane x={-32} y={0} z={318} w={50} h={52} shadow={0.7}>
            <SackOnFloor />
          </Plane>
        ) : null}

        {/* Santa */}
        {st.visible ? (
          <>
            {!st.upside && st.y < 20 && st.z < 500 ? contactShadow({ x: st.x, z: st.z, w: 90, d: 40, a: 0.5 }) : null}
            <Plane
              x={st.x}
              y={st.y}
              z={st.z}
              w={SANTA_W}
              h={SANTA_H}
              rotZ={st.rotZ}
              prio={st.z > FZ ? -0.7 : 1}
              shadow={st.upside ? 0.6 : 1}
              style={{ scale: `${st.flipX} 1` }}
            >
              <Santa
                view={st.view}
                armL={st.armL}
                armR={st.armR}
                elbowL={st.elbowL}
                elbowR={st.elbowR}
                walk={st.walk}
                sack={st.sack}
                headTilt={st.headTilt}
                wink={st.wink}
                blink={st.blink}
                hatSwing={st.upside ? Math.sin(t * 3) * 5 : 0}
              />
            </Plane>
          </>
        ) : null}

        {/* hollín al subir por la chimenea */}
        {t > 19.5 && t < 20.6 ? (
          <Plane x={FX} y={OPEN.top - 22} z={FZ - 2} w={80} h={40}>
            {Array.from({ length: 7 }).map((_, i) => {
              const u = ease(t, 19.5, 20.6);
              return <circle key={i} cx={40 + (i - 3) * 9 * (0.5 + u)} cy={30 - u * 14 - rand(i) * 8} r={4 + u * 6 + rand(i + 3) * 3} fill="#8c8478" opacity={0.75 * (1 - u)} />;
            })}
          </Plane>
        ) : null}

        {/* copos y estrellas de papel colgando del techo */}
        {[
          [-120, 200, 0],
          [-30, 300, 1],
          [70, 170, 2],
          [150, 260, 1],
          [-160, 380, 2],
          [20, 420, 0],
          [120, 400, 0],
        ].map(([x, z, k], i) => {
          const len = 40 + rand(i) * 40;
          return (
            <Plane key={i} x={x} y={H - len - 22} z={z} w={30} h={len + 22} rotZ={Math.sin(t * 1.1 + i) * 3}>
              <line x1={15} y1={0} x2={15} y2={len} stroke="#7a6a58" strokeWidth={0.3} />
              <g transform={`translate(15 ${len + 10}) rotate(${t * 8 + i * 40})`}>
                {k === 2 ? (
                  <P d="M0,-11 L3.2,-3.5 L11,-3.4 L4.8,1.6 L7,9.5 L0,5 L-7,9.5 L-4.8,1.6 L-11,-3.4 L-3.2,-3.5 Z" fill={C.gold} tex="paper" sh={0.6} />
                ) : (
                  <g>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <g key={j} transform={`rotate(${j * 60})`}>
                        <P d="M-1.2,0 L-1.2,-10 L0,-12 L1.2,-10 L1.2,0 Z M-1,-6 L-4.5,-9 L-3.6,-10 L0,-7.4 L3.6,-10 L4.5,-9 L1,-6 Z" fill={k === 0 ? C.white : C.cream} tex="paper" sh={0.4} />
                      </g>
                    ))}
                    <circle r={2.4} fill={k === 0 ? C.white : C.cream} />
                  </g>
                )}
              </g>
            </Plane>
          );
        })}

      </Stage>
      {noOverlay ? null : <LightRig tint="#3a1606" tintA={0.16} glows={glows} vignette={0.5} />}
    </AbsoluteFill>
  );
};

export const santaHeadWorld = (t: number) => {
  const st = santaState(t);
  return { x: st.x, y: st.y - 132, z: st.z, visible: st.visible && st.upside };
};
void E;
