// Utilidades de geometría y materiales con look "juguete mate".
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { worldUV } from './textures.js';

const matCache = new Map();
export function M(color, o = {}) {
  const key = JSON.stringify([color, o.rough, o.metal, o.map && o.map.uuid, o.emissive, o.ei, o.side, o.transparent, o.opacity]);
  if (!o.map && !o.noCache && matCache.has(key)) return matCache.get(key);
  const m = new THREE.MeshStandardMaterial({
    color, roughness: o.rough ?? 0.88, metalness: o.metal ?? 0,
    map: o.map || null,
    emissive: o.emissive || '#000000', emissiveIntensity: o.ei ?? 1,
    side: o.side ?? THREE.FrontSide,
    transparent: !!o.transparent, opacity: o.opacity ?? 1,
  });
  if (!o.map && !o.noCache) matCache.set(key, m);
  return m;
}

export function mesh(geo, mat, parent, pos = [0, 0, 0], rot = [0, 0, 0], scl = [1, 1, 1], shadow = true) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(...pos);
  m.rotation.set(...rot);
  if (typeof scl === 'number') m.scale.setScalar(scl); else m.scale.set(...scl);
  m.castShadow = shadow; m.receiveShadow = true;
  if (parent) parent.add(m);
  return m;
}

export const sphere = (r, ws = 28, hs = 20) => new THREE.SphereGeometry(r, ws, hs);
export const capsule = (r, len, cs = 8, rs = 20) => new THREE.CapsuleGeometry(r, len, cs, rs);
export const cyl = (rt, rb, h, rs = 28) => new THREE.CylinderGeometry(rt, rb, h, rs);
export const rbox = (w, h, d, r = 0.03, seg = 3) => new RoundedBoxGeometry(w, h, d, seg, Math.min(r, w / 2 - 1e-4, h / 2 - 1e-4, d / 2 - 1e-4));
export const torus = (R, r, rs = 14, ts = 40, arc = Math.PI * 2) => new THREE.TorusGeometry(R, r, rs, ts, arc);

// Caja con UV en metros y materiales por cara [+x,-x,+y,-y,+z,-z].
export function box(parent, x0, x1, y0, y1, z0, z1, mat, tile = 1, shadow = true) {
  const w = x1 - x0, h = y1 - y0, d = z1 - z0;
  const g = worldUV(new THREE.BoxGeometry(w, h, d), w, h, d, tile);
  const m = new THREE.Mesh(g, mat);
  m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
  m.castShadow = shadow; m.receiveShadow = true;
  parent.add(m);
  return m;
}

// Barrido de un círculo a lo largo de una curva con radio variable (gorro, calcetas, cola...).
export function sweep(points, radiusFn, tubular = 32, radial = 18, closed = true, scaleXFn = null) {
  const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)));
  const frames = curve.computeFrenetFrames(tubular, false);
  const pos = [], nor = [], uv = [], idx = [];
  const P = new THREE.Vector3();
  for (let i = 0; i <= tubular; i++) {
    const u = i / tubular;
    curve.getPointAt(u, P);
    const N = frames.normals[i], B = frames.binormals[i];
    const r = radiusFn(u);
    const sx = scaleXFn ? scaleXFn(u) : 1;
    for (let j = 0; j <= radial; j++) {
      const v = (j / radial) * Math.PI * 2;
      const c = Math.cos(v) * sx, s = Math.sin(v);
      const nx = c * N.x + s * B.x, ny = c * N.y + s * B.y, nz = c * N.z + s * B.z;
      pos.push(P.x + r * nx, P.y + r * ny, P.z + r * nz);
      nor.push(nx, ny, nz);
      uv.push(u, j / radial);
    }
  }
  for (let i = 0; i < tubular; i++) for (let j = 0; j < radial; j++) {
    const a = i * (radial + 1) + j, b = a + radial + 1;
    idx.push(a, b, a + 1, b, b + 1, a + 1);
  }
  if (closed) {
    // tapas
    for (const end of [0, tubular]) {
      const center = pos.length / 3;
      curve.getPointAt(end / tubular, P);
      pos.push(P.x, P.y, P.z);
      const T = curve.getTangentAt(end / tubular);
      const sgn = end === 0 ? -1 : 1;
      nor.push(T.x * sgn, T.y * sgn, T.z * sgn); uv.push(0.5, 0.5);
      for (let j = 0; j < radial; j++) {
        const a = end * (radial + 1) + j;
        if (end === 0) idx.push(center, a + 1, a); else idx.push(center, a, a + 1);
      }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

export function lathe(profile, seg = 40) {
  return new THREE.LatheGeometry(profile.map(([r, y]) => new THREE.Vector2(r, y)), seg);
}

// Deformación suave con ruido (para que las formas no se vean perfectas, tipo hecho a mano).
export function wobble(geo, amp = 0.01, freq = 6, seed = 1) {
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const n = Math.sin(x * freq + seed) * Math.cos(y * freq * 1.3 + seed * 2) * Math.sin(z * freq * 0.9 + seed * 3);
    const l = Math.hypot(x, y, z) || 1;
    p.setXYZ(i, x + (x / l) * n * amp, y + (y / l) * n * amp, z + (z / l) * n * amp);
  }
  geo.computeVertexNormals();
  return geo;
}

// Matemáticas de animación
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const smooth = (e0, e1, x) => { const t = clamp((x - e0) / (e1 - e0)); return t * t * (3 - 2 * t); };
export const smoother = (e0, e1, x) => { const t = clamp((x - e0) / (e1 - e0)); return t * t * t * (t * (t * 6 - 15) + 10); };
export const easeOutBack = (t) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
export const pulse = (a, b, c, d, x) => smooth(a, b, x) * (1 - smooth(c, d, x));

// Interpolación por keyframes {t, v:number|array} con Hermite (Catmull-Rom no uniforme) => velocidad continua.
export function track(keys) {
  const n = keys.length;
  const isArr = Array.isArray(keys[0].v);
  const dim = isArr ? keys[0].v.length : 1;
  const V = keys.map(k => (isArr ? k.v : [k.v]));
  const tan = keys.map((k, i) => {
    if (k.hold) return new Array(dim).fill(0);
    if (i === 0 || i === n - 1) return new Array(dim).fill(0);
    const dt = keys[i + 1].t - keys[i - 1].t;
    return V[i].map((_, d) => (V[i + 1][d] - V[i - 1][d]) / dt);
  });
  return (t) => {
    if (t <= keys[0].t) return isArr ? [...V[0]] : V[0][0];
    if (t >= keys[n - 1].t) return isArr ? [...V[n - 1]] : V[n - 1][0];
    let i = 0;
    while (t > keys[i + 1].t) i++;
    const t0 = keys[i].t, t1 = keys[i + 1].t, h = t1 - t0;
    let s = (t - t0) / h;
    if (keys[i + 1].ease === 'smooth') s = s * s * (3 - 2 * s);
    const s2 = s * s, s3 = s2 * s;
    const h00 = 2 * s3 - 3 * s2 + 1, h10 = s3 - 2 * s2 + s, h01 = -2 * s3 + 3 * s2, h11 = s3 - s2;
    const out = V[i].map((_, d) => h00 * V[i][d] + h10 * h * tan[i][d] + h01 * V[i + 1][d] + h11 * h * tan[i + 1][d]);
    return isArr ? out : out[0];
  };
}
