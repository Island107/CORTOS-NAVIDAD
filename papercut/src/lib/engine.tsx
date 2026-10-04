import React, { createContext, useContext } from "react";
import { AbsoluteFill } from "remotion";
import { DBG } from "./dbg";

/**
 * Motor de diorama 2.5D.
 * Mundo en centímetros: x a la derecha, y hacia arriba, z hacia el fondo.
 * Cada recorte es un plano de papel colocado en 3D con transformaciones CSS,
 * así el parallax y la escala respecto a los muebles son consistentes.
 */
export type Cam = {
  x: number;
  y: number;
  z: number;
  yaw?: number; // grados, positivo gira a la derecha
  pitch?: number; // grados, positivo mira hacia arriba
  roll?: number;
  focal?: number; // px
};

export const W = 1080;
export const H = 1920;
export const PX = 2.5; // px CSS por cm (resolución de raster de los recortes)

const CamCtx = createContext<Cam>({ x: 0, y: 100, z: 0 });
export const useCam = () => useContext(CamCtx);

export const Stage: React.FC<{
  cam: Cam;
  children: React.ReactNode;
  background?: string;
  style?: React.CSSProperties;
}> = ({ cam, children, background = "#1b1410", style }) => {
  const f = cam.focal ?? 1150;
  const yaw = cam.yaw ?? 0;
  const pitch = cam.pitch ?? 0;
  const roll = cam.roll ?? 0;
  return (
    <CamCtx.Provider value={cam}>
      <AbsoluteFill style={{ background, overflow: "hidden", perspective: f, perspectiveOrigin: "50% 50%", ...style }}>
        <div
          style={{
            position: "absolute",
            left: W / 2,
            top: H / 2,
            width: 0,
            height: 0,
            transformStyle: "preserve-3d",
            transform: `translateZ(${f}px) rotateZ(${roll}deg) rotateX(${pitch}deg) rotateY(${yaw}deg) translate3d(${-cam.x * PX}px, ${cam.y * PX}px, ${cam.z * PX}px)`,
          }}
        >
          {children}
        </div>
      </AbsoluteFill>
    </CamCtx.Provider>
  );
};

/**
 * Plano de papel. (x, y, z) es la posición del ancla en el mundo.
 * Por defecto el ancla es el centro inferior y el plano mira a la cámara.
 * orient: "front" (pared/recorte), "floor" (horizontal), "left"/"right" (paredes laterales)
 */
export const Plane: React.FC<{
  x: number;
  y: number;
  z: number;
  w: number;
  h: number;
  orient?: "front" | "floor" | "ceiling" | "side";
  rotY?: number; // giro extra sobre el eje vertical (grados)
  rotX?: number;
  rotZ?: number;
  anchor?: "bottom" | "center" | "top";
  ax?: number; // ancla horizontal 0..1 (0.5 = centro); también es el eje de giro
  shadow?: number; // fuerza de la sombra suave sobre la capa de atrás (0..1)
  children?: React.ReactNode;
  style?: React.CSSProperties;
  viewBox?: string;
  svg?: boolean;
  name?: string;
}> = ({
  x,
  y,
  z,
  w,
  h,
  orient = "front",
  rotY = 0,
  rotX = 0,
  rotZ = 0,
  anchor = "bottom",
  ax = 0.5,
  shadow = 0,
  children,
  style,
  viewBox,
  svg = true,
}) => {
  const ay = anchor === "bottom" ? h : anchor === "center" ? h / 2 : 0;
  let base = "";
  if (orient === "floor") base = "rotateX(90deg)";
  if (orient === "ceiling") base = "rotateX(-90deg)";
  if (orient === "side") base = "rotateY(90deg)";
  const filter = shadow && !DBG.has("noshadow")
    ? `drop-shadow(0px ${4 * shadow * PX}px ${10 * shadow * PX}px rgba(25,12,4,${0.45 * Math.min(1, shadow)}))`
    : undefined;
  return (
    <div
      style={{
        position: "absolute",
        left: -w * ax * PX,
        top: -ay * PX,
        width: w * PX,
        height: h * PX,
        transformOrigin: `${w * ax * PX}px ${ay * PX}px`,
        transform: `translate3d(${x * PX}px, ${-y * PX}px, ${-z * PX}px) ${base} rotateY(${-rotY}deg) rotateX(${rotX}deg) rotateZ(${rotZ}deg)`,
        filter,
        ...style,
      }}
    >
      {svg ? (
        <svg width={w * PX} height={h * PX} viewBox={viewBox ?? `0 0 ${w} ${h}`} style={{ display: "block", overflow: "visible" }}>
          {children}
        </svg>
      ) : (
        children
      )}
    </div>
  );
};

/**
 * Proyección de un punto del mundo a la pantalla (px), consistente con la
 * transformación CSS de <Stage>. Devuelve también la escala px/cm.
 */
export const project = (cam: Cam, x: number, y: number, z: number) => {
  const f = cam.focal ?? 1150;
  const d2r = Math.PI / 180;
  // coordenadas CSS relativas a la cámara
  let px = (x - cam.x) * PX;
  let py = -(y - cam.y) * PX;
  let pz = -(z - cam.z) * PX;
  // rotateY(-yaw)
  const ay = (cam.yaw ?? 0) * d2r;
  [px, pz] = [px * Math.cos(ay) + pz * Math.sin(ay), -px * Math.sin(ay) + pz * Math.cos(ay)];
  // rotateX(pitch)
  const ax = (cam.pitch ?? 0) * d2r;
  [py, pz] = [py * Math.cos(ax) - pz * Math.sin(ax), py * Math.sin(ax) + pz * Math.cos(ax)];
  // rotateZ(roll)
  const az = (cam.roll ?? 0) * d2r;
  [px, py] = [px * Math.cos(az) - py * Math.sin(az), px * Math.sin(az) + py * Math.cos(az)];
  const depth = -pz; // distancia hacia adelante (px)
  const s = f / Math.max(depth, 1);
  return { sx: W / 2 + px * s, sy: H / 2 + py * s, s: s * PX, visible: depth > 1 };
};
