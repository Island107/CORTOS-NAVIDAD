// Materiales "de comercial": tejido de punto, trama, veta de madera, estuco, piel mate y pelo por capas (shell fur).
import * as THREE from 'three';
import { rng } from './textures.js';

// ---------------------------------------------------------------- utilidades de altura → normal
function heightToNormal(H, w, h, strength = 2) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d');
  const img = x.createImageData(w, h);
  const at = (i, j) => H[((j + h) % h) * w + ((i + w) % w)];
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const dx = (at(i + 1, j) - at(i - 1, j)) * strength;
    const dy = (at(i, j + 1) - at(i, j - 1)) * strength;
    const l = Math.hypot(dx, dy, 1);
    const k = (j * w + i) * 4;
    img.data[k] = (-dx / l * 0.5 + 0.5) * 255;
    img.data[k + 1] = (dy / l * 0.5 + 0.5) * 255;
    img.data[k + 2] = (1 / l * 0.5 + 0.5) * 255;
    img.data[k + 3] = 255;
  }
  x.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  return t;
}
function colorFromHeight(H, w, h, colorFn) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d');
  const img = x.createImageData(w, h);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const k = (j * w + i) * 4;
    const [r, g, b] = colorFn(H[j * w + i], i, j);
    img.data[k] = r; img.data[k + 1] = g; img.data[k + 2] = b; img.data[k + 3] = 255;
  }
  x.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}
// ruido de valor suave y repetible
function valueNoise(w, h, cells, seed) {
  const r = rng(seed);
  const g = []; for (let i = 0; i < cells * cells; i++) g.push(r());
  const at = (i, j) => g[((j % cells + cells) % cells) * cells + ((i % cells + cells) % cells)];
  const out = new Float32Array(w * h);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const u = i / w * cells, v = j / h * cells;
    const i0 = Math.floor(u), j0 = Math.floor(v);
    let fu = u - i0, fv = v - j0;
    fu = fu * fu * (3 - 2 * fu); fv = fv * fv * (3 - 2 * fv);
    const a = at(i0, j0), b = at(i0 + 1, j0), c = at(i0, j0 + 1), d = at(i0 + 1, j0 + 1);
    out[j * w + i] = (a * (1 - fu) + b * fu) * (1 - fv) + (c * (1 - fu) + d * fu) * fv;
  }
  return out;
}
function fbm(w, h, seed, octaves = [[4, 0.5], [8, 0.25], [16, 0.15], [32, 0.1]]) {
  const out = new Float32Array(w * h);
  octaves.forEach(([cells, amp], k) => {
    const n = valueNoise(w, h, cells, seed + k * 13);
    for (let i = 0; i < out.length; i++) out[i] += n[i] * amp;
  });
  return out;
}
const hex = (c) => { const k = new THREE.Color(c); return [k.r, k.g, k.b].map(v => Math.pow(v, 1 / 2.2) * 255).map(v => v); };
const srgb = (c) => { const k = new THREE.Color(c); k.convertLinearToSRGB(); return [k.r * 255, k.g * 255, k.b * 255]; };

// ---------------------------------------------------------------- tejido de punto (suéter / abrigo de lana)
const knitCache = new Map();
export function knitMaps(color, opts = {}) {
  const key = color + JSON.stringify(opts);
  if (knitCache.has(key)) return knitCache.get(key);
  const W = 512, Hh = 512, cols = opts.cols || 16, rows = opts.rows || 20;
  const H = new Float32Array(W * Hh);
  const fib = valueNoise(W, Hh, 128, 7);
  const r = rng(3);
  const cw = W / cols, ch = Hh / rows;
  for (let j = 0; j < Hh; j++) for (let i = 0; i < W; i++) {
    const cx = (i % cw) / cw, cy = (j % ch) / ch;
    let best = 0;
    for (const [ox, ang] of [[0.28, 0.75], [0.72, -0.75]]) {
      // cada pierna de la "V" es una elipse inclinada
      const dx = cx - ox, dy = cy - 0.5;
      const ca = Math.cos(ang), sa = Math.sin(ang);
      const u = (dx * ca - dy * sa) / 0.2, v = (dx * sa + dy * ca) / 0.62;
      const d = u * u + v * v;
      if (d < 1) {
        // fibras torcidas a lo largo de la pierna
        const twist = 0.5 + 0.5 * Math.sin((v * 9 + u * 3) * 3.1);
        best = Math.max(best, Math.sqrt(1 - d) * (0.82 + 0.18 * twist));
      }
    }
    H[j * W + i] = best * 0.9 + fib[j * W + i] * 0.12;
  }
  const base = new THREE.Color(color);
  const tint = rng(9);
  const map = colorFromHeight(H, W, Hh, (h, i, j) => {
    const k = 0.48 + h * 0.62 + (fib[j * W + i] - 0.5) * 0.12;
    const c = base.clone().multiplyScalar(k);
    c.convertLinearToSRGB();
    return [Math.min(255, c.r * 255), Math.min(255, c.g * 255), Math.min(255, c.b * 255)];
  });
  const normalMap = heightToNormal(H, W, Hh, opts.strength || 3.2);
  const out = { map, normalMap };
  knitCache.set(key, out);
  return out;
}

// trama tipo lino/terciopelo para sofá y cojines
export function weaveMaps(color, opts = {}) {
  const W = 256, n = opts.n || 32;
  const H = new Float32Array(W * W);
  const fib = valueNoise(W, W, 64, 21);
  for (let j = 0; j < W; j++) for (let i = 0; i < W; i++) {
    const u = (i / W) * n, v = (j / W) * n;
    const cu = Math.floor(u), cv = Math.floor(v);
    const over = (cu + cv) % 2 === 0;
    const fu = u - cu, fv = v - cv;
    const a = Math.sin(fu * Math.PI), b = Math.sin(fv * Math.PI);
    H[j * W + i] = (over ? a * 0.8 + b * 0.2 : b * 0.8 + a * 0.2) * 0.8 + fib[j * W + i] * 0.3;
  }
  const base = new THREE.Color(color);
  const map = colorFromHeight(H, W, W, (h, i, j) => {
    const c = base.clone().multiplyScalar(0.72 + h * 0.36);
    c.convertLinearToSRGB();
    return [Math.min(255, c.r * 255), Math.min(255, c.g * 255), Math.min(255, c.b * 255)];
  });
  return { map, normalMap: heightToNormal(H, W, W, opts.strength || 1.6) };
}

// veta de madera
export function woodMaps(color = '#9a6a43', opts = {}) {
  const W = 512, Hh = 512;
  const n1 = fbm(W, Hh, opts.seed || 31, [[3, 0.6], [6, 0.3], [24, 0.1]]);
  const n2 = valueNoise(W, Hh, 128, 37);
  const H = new Float32Array(W * Hh);
  const base = new THREE.Color(color);
  for (let j = 0; j < Hh; j++) for (let i = 0; i < W; i++) {
    const k = j * W + i;
    const y = j / Hh;
    const rings = Math.sin((y * 14 + n1[k] * 3.5) * Math.PI * 2);
    const streak = Math.sin((y * 90 + n1[k] * 8) * Math.PI) * 0.15 + (n2[k] - 0.5) * 0.25;
    H[k] = rings * 0.5 + 0.5 + streak;
  }
  const map = colorFromHeight(H, W, Hh, (h) => {
    const c = base.clone().multiplyScalar(0.72 + h * 0.38);
    c.convertLinearToSRGB();
    return [Math.min(255, c.r * 255), Math.min(255, c.g * 255), Math.min(255, c.b * 255)];
  });
  return { map, normalMap: heightToNormal(H, W, Hh, 0.6) };
}

// estuco / papel (normal sutil)
let stuccoN;
export function stuccoNormal() {
  if (stuccoN) return stuccoN;
  const W = 512;
  const H = fbm(W, W, 51, [[8, 0.4], [32, 0.35], [96, 0.25]]);
  stuccoN = heightToNormal(H, W, W, 2.2);
  return stuccoN;
}
let paperN;
export function paperNormal() {
  if (paperN) return paperN;
  const W = 256;
  const H = fbm(W, W, 61, [[16, 0.3], [64, 0.4], [128, 0.3]]);
  paperN = heightToNormal(H, W, W, 1.2);
  return paperN;
}

// ---------------------------------------------------------------- materiales
export function fabric(color, kind = 'knit', o = {}) {
  const maps = kind === 'knit' ? knitMaps(color, o) : weaveMaps(color, o);
  const map = maps.map.clone(); map.needsUpdate = true;
  const nm = maps.normalMap.clone(); nm.needsUpdate = true;
  const rep = o.repeat || [3, 3];
  map.repeat.set(...rep); nm.repeat.set(...rep);
  const m = new THREE.MeshPhysicalMaterial({
    color: '#ffffff', map, normalMap: nm, normalScale: new THREE.Vector2(o.ns ?? 1.1, o.ns ?? 1.1),
    roughness: 0.92, metalness: 0,
    sheen: o.sheen ?? 0.9, sheenRoughness: 0.55, sheenColor: new THREE.Color(o.sheenColor || color).lerp(new THREE.Color('#ffffff'), 0.35),
    specularIntensity: 0.15,
  });
  return m;
}

// piel mate: casi sin especular, sheen cálido en el borde y un poco de "luz que entra" (emisivo rojizo tenue)
export function skin(color = '#efc2a2') {
  const W = 256;
  const H = fbm(W, W, 71, [[8, 0.5], [32, 0.3], [64, 0.2]]);
  const base = new THREE.Color(color);
  const map = colorFromHeight(H, W, W, (h) => {
    const c = base.clone().lerp(new THREE.Color('#e9a08a'), (h - 0.5) * 0.35 + 0.05);
    c.convertLinearToSRGB();
    return [c.r * 255, c.g * 255, c.b * 255];
  });
  const m = new THREE.MeshPhysicalMaterial({
    color: '#ffffff', map, roughness: 0.62, metalness: 0,
    specularIntensity: 0.18, sheen: 0.55, sheenRoughness: 0.9, sheenColor: new THREE.Color('#ffb59a'),
    emissive: new THREE.Color('#b0503a'), emissiveIntensity: 0.06,
    normalMap: heightToNormal(H, W, W, 0.5), normalScale: new THREE.Vector2(0.25, 0.25),
  });
  // envoltura de luz (wrap lighting) para que la sombra "entre" suave, como dispersión subsuperficial
  m.onBeforeCompile = (sh) => {
    const chunk = THREE.ShaderChunk.lights_physical_pars_fragment.replace(
      'reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );',
      'reflectedLight.directDiffuse += saturate( ( dot( geometryNormal, directLight.direction ) + 0.45 ) / 1.45 ) * directLight.color * vec3( 1.0, 0.9, 0.84 ) * BRDF_Lambert( material.diffuseColor );');
    sh.fragmentShader = sh.fragmentShader.replace('#include <lights_physical_pars_fragment>', chunk);
  };
  m.customProgramCacheKey = () => 'skin-wrap';
  return m;
}

// ---------------------------------------------------------------- pelo / fibras por capas (shell fur)
const strandTexCache = new Map();
function strandTex(seed = 1, clump = 0.5) {
  const key = seed + ':' + clump;
  if (strandTexCache.has(key)) return strandTexCache.get(key);
  const W = 256;
  const r = rng(seed);
  const cl = valueNoise(W, W, 24, seed + 5);
  const c = document.createElement('canvas'); c.width = c.height = W;
  const x = c.getContext('2d');
  const img = x.createImageData(W, W);
  for (let i = 0; i < W * W; i++) {
    // altura del pelo: aleatoria por texel, agrupada en mechones
    const v = Math.min(1, r() * (1 - clump) + cl[i] * clump * 1.35);
    img.data[i * 4] = v * 255;
    img.data[i * 4 + 1] = r() * 255;  // variación de tono
    img.data[i * 4 + 2] = 0; img.data[i * 4 + 3] = 255;
  }
  x.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter;
  t.generateMipmaps = false;
  strandTexCache.set(key, t);
  return t;
}

// Agrega capas de pelo a una malla. base = material de la piel base (se usa su color/map).
export function addFur(meshObj, o = {}) {
  const shells = o.shells ?? 14;
  const len = o.len ?? 0.015;
  const density = o.density ?? 40;
  const tex = strandTex(o.seed ?? 1, o.clump ?? 0.45);
  const color = new THREE.Color(o.color || '#ffffff');
  const tip = new THREE.Color(o.tip || o.color || '#ffffff');
  const gravity = o.gravity ?? 0.3;
  const group = new THREE.Group();
  for (let s = 1; s <= shells; s++) {
    const h = s / shells;
    const mat = new THREE.MeshPhysicalMaterial({
      color: color.clone().lerp(tip, h), map: o.map || null, roughness: 0.95,
      sheen: 0.6, sheenRoughness: 0.6, sheenColor: tip.clone().lerp(new THREE.Color('#ffffff'), 0.3),
      specularIntensity: 0.1,
    });
    const U = { uH: { value: h }, uLen: { value: len }, uTex: { value: tex }, uDen: { value: density }, uClump: { value: o.clump ?? 0.45 }, uUseUv: { value: o.useUv ? 1 : 0 }, uGrav: { value: gravity }, uAO: { value: o.ao ?? 0.55 } };
    mat.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, U);
      sh.vertexShader = 'uniform float uH; uniform float uLen; uniform float uGrav;\nvarying vec2 vFurUv;\nvarying vec3 vFurP;\n' + sh.vertexShader
        .replace('#include <begin_vertex>', `#include <begin_vertex>
          vFurP = position;
          transformed += normal * uH * uLen;
          vFurUv = uv;`)
        .replace('#include <project_vertex>', `
          vec4 mvPosition = vec4( transformed, 1.0 );
          #ifdef USE_INSTANCING
            mvPosition = instanceMatrix * mvPosition;
          #endif
          vec4 wp = modelMatrix * mvPosition;
          wp.y -= uGrav * uLen * uH * uH;
          mvPosition = viewMatrix * wp;
          gl_Position = projectionMatrix * mvPosition;`);
      sh.fragmentShader = 'uniform float uH; uniform sampler2D uTex; uniform float uDen; uniform float uAO; uniform float uClump; uniform float uUseUv;\nvarying vec2 vFurUv;\nvarying vec3 vFurP;\n'
        + 'float fh(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }\n'
        + 'float fn(vec3 x){ vec3 i = floor(x); vec3 f = fract(x); f = f*f*(3.0-2.0*f); return mix(mix(mix(fh(i), fh(i+vec3(1,0,0)), f.x), mix(fh(i+vec3(0,1,0)), fh(i+vec3(1,1,0)), f.x), f.y), mix(mix(fh(i+vec3(0,0,1)), fh(i+vec3(1,0,1)), f.x), mix(fh(i+vec3(0,1,1)), fh(i+vec3(1,1,1)), f.x), f.y), f.z); }\n'
        + sh.fragmentShader
        .replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>
          vec4 st;
          if ( uUseUv > 0.5 ) {
            st = texture2D( uTex, vFurUv * vec2( uDen * 2.0, uDen ) );
          } else {
            vec3 cell = floor( vFurP * uDen );
            float rnd = fh( cell + 0.5 );
            float cl = fn( vFurP * uDen * 0.12 );
            st = vec4( min( 1.0, rnd * ( 1.0 - uClump ) + cl * uClump * 1.35 ), fh( cell + 7.3 ), 0.0, 1.0 );
          }
          if ( st.r < uH ) discard;`)
        .replace('#include <color_fragment>', `#include <color_fragment>
          diffuseColor.rgb *= mix( uAO, 1.0, uH ) * ( 0.88 + 0.24 * st.g );`);
    };
    mat.customProgramCacheKey = () => 'fur-shell' + (o.map ? '-map' : '');
    const m = new THREE.Mesh(meshObj.geometry, mat);
    m.castShadow = false; m.receiveShadow = true;
    group.add(m);
  }
  group.position.copy(meshObj.position);
  group.quaternion.copy(meshObj.quaternion);
  group.scale.copy(meshObj.scale);
  meshObj.parent.add(group);
  meshObj.userData.fur = group;
  // la base también se oscurece un poco (raíz del pelo)
  return group;
}
