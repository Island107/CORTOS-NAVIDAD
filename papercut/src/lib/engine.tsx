import React, { Children, createContext, Fragment, isValidElement, ReactElement, useContext } from "react";
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
export const PX = DBG.has("px15") ? 1.5 : DBG.has("px2") ? 2 : 2.5; // px CSS por cm (resolución de raster de los recortes)

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
          {sortPlanes(children, cam)}
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
  prio?: number; // orden de pintado: <0 detrás de las paredes (a través de huecos), 0 paredes/piso, 1 objetos
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
  // sombra suave sobre la capa de atrás, dentro del SVG: se rasteriza una vez
  // con el contenido (un filtro CSS se recalcularía en cada cuadro)
  const sh = shadow && !DBG.has("noshadow") ? Math.round(shadow * 10) / 10 : 0;
  const fid = `psh-${String(sh).replace(".", "_")}`;
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
        ...style,
      }}
    >
      {svg ? (
        <svg width={w * PX} height={h * PX} viewBox={viewBox ?? `0 0 ${w} ${h}`} style={{ display: "block", overflow: "visible" }}>
          {sh ? (
            <>
              <defs>
                <filter id={fid} x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur in="SourceAlpha" stdDeviation={5 * sh} />
                  <feOffset dx={0} dy={4 * sh} />
                  <feColorMatrix type="matrix" values={`0 0 0 0 0.1  0 0 0 0 0.05  0 0 0 0 0.02  0 0 0 ${0.45 * Math.min(1, sh)} 0`} />
                </filter>
              </defs>
              <g filter={`url(#${fid})`}>{children}</g>
            </>
          ) : null}
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

/** Profundidad (cm) de un punto en el espacio de la cámara */
export const camDepth = (cam: Cam, x: number, y: number, z: number) => {
  const d2r = Math.PI / 180;
  const dx = x - cam.x;
  const dy = y - cam.y;
  const dz = z - cam.z;
  const ay = (cam.yaw ?? 0) * d2r;
  const ax = (cam.pitch ?? 0) * d2r;
  const zf = dx * Math.sin(ay) + dz * Math.cos(ay);
  return zf * Math.cos(ax) + dy * Math.sin(ax);
};

/**
 * Orden de pintado explícito (algoritmo del pintor) y descarte de recortes
 * detrás de la cámara. Así el resultado no depende del ordenamiento 3D del
 * compositor de Chromium y se puede usar el rasterizador por software rápido.
 */
const flatten = (nodes: React.ReactNode, out: ReactElement[] = []) => {
  Children.toArray(nodes).forEach((n) => {
    if (!isValidElement(n)) return;
    if (n.type === Fragment) flatten((n.props as { children?: React.ReactNode }).children, out);
    else out.push(n);
  });
  return out;
};
const sortPlanes = (children: React.ReactNode, cam: Cam) => {
  const items = flatten(children).map((el, i) => {
    if (el.type !== Plane) return { el, key: -1e9 + i, keep: true };
    const p = el.props as React.ComponentProps<typeof Plane>;
    const orient = p.orient ?? "front";
    const prio = p.prio ?? (orient === "front" ? 1 : 0);
    const ay = p.anchor === "top" ? 0 : p.anchor === "center" ? p.h / 2 : p.h;
    const cy = orient === "front" ? p.y + ay / 2 : p.y;
    const cz = orient === "floor" || orient === "ceiling" ? p.z + (orient === "floor" ? p.h / 2 : -p.h / 2) : p.z;
    const depth = camDepth(cam, p.x, cy, cz);
    // recortes de frente completamente detrás de la cámara: no se dibujan
    let keep = !(orient === "front" && camDepth(cam, p.x, cy, p.z) < 3 && Math.abs(p.rotY ?? 0) < 1);
    // descarte por encuadre: recortes de frente totalmente fuera de la pantalla
    if (keep && orient === "front" && !p.rotY && !p.rotZ) {
      const ax = p.ax ?? 0.5;
      const yb = p.y - (p.h - ay);
      const a = project(cam, p.x - p.w * ax, yb + p.h, p.z);
      const b = project(cam, p.x + p.w * (1 - ax), yb, p.z);
      const m = 200;
      if (a.visible && b.visible && (b.sx < -m || a.sx > W + m || b.sy < -m || a.sy > H + m)) keep = false;
    }
    // recorte de planos (piso/techo/pared lateral) a la parte frente a la cámara
    let out = el;
    const zmin = cam.z + 4;
    const sx = (p.ax ?? 0.5) === 0.5;
    if (orient === "floor" && p.z < zmin && keep) {
      const c = Math.min(p.h - 1, zmin - p.z);
      out = React.cloneElement(el as ReactElement<React.ComponentProps<typeof Plane>>, { z: p.z + c, h: p.h - c, viewBox: `0 0 ${p.w} ${p.h - c}` });
    } else if (orient === "ceiling" && p.z - p.h < zmin) {
      const c = Math.min(p.h - 1, zmin - (p.z - p.h));
      out = React.cloneElement(el as ReactElement<React.ComponentProps<typeof Plane>>, { h: p.h - c, viewBox: `0 ${c} ${p.w} ${p.h - c}` });
    } else if (orient === "side" && sx && p.z - p.w / 2 < zmin) {
      const c = Math.min(p.w - 1, zmin - (p.z - p.w / 2));
      out = React.cloneElement(el as ReactElement<React.ComponentProps<typeof Plane>>, { z: p.z + c / 2, w: p.w - c, viewBox: `${c} 0 ${p.w - c} ${p.h}` });
    }
    // sombra suave entre capas: se omite en recortes muy ampliados (costosa y fuera de cuadro)
    if (keep && p.shadow && orient === "front" && depth > 0) {
      const scale = project(cam, p.x, cy, p.z).s;
      if (scale > 2.2) out = React.cloneElement(out as ReactElement<React.ComponentProps<typeof Plane>>, { shadow: 0 });
    }
    return { el: out, key: prio * 1e6 - depth, keep };
  });
  return items
    .filter((it) => it.keep)
    .sort((a, b) => a.key - b.key)
    .map((it) => it.el);
};
