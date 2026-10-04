// La casa-diorama: recámara (arriba), escalera y sala (abajo), sobre una base nevada flotando en un estudio neutro.
import * as THREE from 'three';
import { M, mesh, box, sphere, capsule, cyl, rbox, torus, sweep, lathe, wobble } from './geo.js';
import * as TX from './textures.js';
import { stuccoNormal, woodMaps } from './materials.js';
function wall(map, color = '#ffffff') { return new THREE.MeshPhysicalMaterial({ color, map, normalMap: stuccoNormal(), normalScale: new THREE.Vector2(0.55, 0.55), roughness: 0.96, sheen: 0.15 }); }

export const Y1 = 2.52;     // nivel del piso de arriba
export const TOP = 4.82;    // remate de muros
export const CEIL = 2.4;    // plafón de la sala
export const STAIR = { x0: -3.84, x1: -2.95, z0: -1.3, run: 0.24, rise: 0.21, n: 11 };

export function stairFloorY(z) {
  // altura del piso bajo los pies en la escalera (rampa continua)
  const k = (z - STAIR.z0) / STAIR.run;
  return Math.max(0, Math.min(Y1, Y1 - (k + 0.5) * STAIR.rise));
}

export function buildHouse(scene) {
  const H = { glows: [], bulbs: [], front: new THREE.Group(), lights: {} };
  const house = new THREE.Group();
  scene.add(house);
  house.add(H.front);

  // ---------- materiales
  const ext = wall(TX.plain('#efe2cf', 10, 2));
  const cap = M('#f6ece0', { rough: 0.95 });
  const pLiving = wall(TX.wallpaperStripes('#efe1c9', '#e5d2b4'));
  pLiving.map.repeat.set(1 / 0.7, 1 / 0.7);
  const pBed = wall(TX.wallpaperStars('#9fbdd6', '#f6e7b5'));
  pBed.map.repeat.set(1 / 0.75, 1 / 0.75);
  const pHall = wall(TX.wallpaperStripes('#b7c4a6', '#aab994'));
  pHall.map.repeat.set(1 / 0.7, 1 / 0.7);
  const wn = woodMaps('#888', { seed: 41 }).normalMap; wn.repeat.set(1.5, 6);
  const wood = new THREE.MeshPhysicalMaterial({ map: TX.woodFloor('#a8724a'), normalMap: wn, normalScale: new THREE.Vector2(0.5, 0.5), roughness: 0.55, clearcoat: 0.25, clearcoatRoughness: 0.4 });
  wood.map.repeat.set(0.5, 0.5);
  const woodLight = M('#ffffff', { map: TX.woodFloor('#c99a6a'), rough: 0.8 });
  woodLight.map.repeat.set(0.5, 0.5);
  const plaster = wall(null, '#f3ebe0');
  const trim = M('#f8f3ea', { rough: 0.8 });
  const snow = M('#eef1f7', { map: TX.plain('#eef1f7', 14, 3), rough: 1 });

  const W = (mats) => mats; // [+x,-x,+y,-y,+z,-z]

  // ---------- base nevada del diorama
  mesh(rbox(8.8, 0.34, 8.2, 0.14, 4), snow, house, [-0.7, -0.17, 0.4]);
  mesh(rbox(8.95, 0.06, 8.35, 0.03, 2), M('#cfd6e3'), house, [-0.7, -0.33, 0.4]);

  // ---------- pisos
  box(house, -2.44, 2.44, -0.02, 0.0, -2.44, 2.44, wood, 1);
  box(house, -3.84, -2.56, -0.02, 0.0, -2.44, 2.44, wood, 1);
  box(house, -2.56, -2.44, -0.02, 0.0, 1.45, 2.15, wood, 1);
  // losa entre pisos (techo de sala / piso de la recámara)
  box(house, -2.44, 2.44, CEIL, Y1, -2.44, 2.44, W([cap, cap, woodLight, plaster, cap, cap]), 1);
  // descanso de la escalera
  box(house, -3.84, -2.56, CEIL, Y1, -2.44, STAIR.z0, W([cap, cap, wood, plaster, wood, cap]), 1);

  // ---------- muros (centrados en las líneas, 12 cm de grosor)
  const wallX = (parent, x, z0, z1, y0, y1, holes, matPX, matNX) => {
    const mats = W([matPX, matNX, cap, cap, cap, cap]);
    let a = z0;
    const hs = [...holes].sort((p, q) => p[0] - q[0]);
    for (const [h0, h1, b0, b1] of hs) {
      if (h0 > a) box(parent, x - 0.06, x + 0.06, y0, y1, a, h0, mats, 1);
      if (b0 > y0) box(parent, x - 0.06, x + 0.06, y0, b0, h0, h1, mats, 1);
      if (b1 < y1) box(parent, x - 0.06, x + 0.06, b1, y1, h0, h1, mats, 1);
      a = h1;
    }
    if (a < z1) box(parent, x - 0.06, x + 0.06, y0, y1, a, z1, mats, 1);
  };
  const wallZ = (parent, z, x0, x1, y0, y1, holes, matPZ, matNZ) => {
    const mats = W([cap, cap, cap, cap, matPZ, matNZ]);
    let a = x0;
    const hs = [...holes].sort((p, q) => p[0] - q[0]);
    for (const [h0, h1, b0, b1] of hs) {
      if (h0 > a) box(parent, a, h0, y0, y1, z - 0.06, z + 0.06, mats, 1);
      if (b0 > y0) box(parent, h0, h1, y0, b0, z - 0.06, z + 0.06, mats, 1);
      if (b1 < y1) box(parent, h0, h1, b1, y1, z - 0.06, z + 0.06, mats, 1);
      a = h1;
    }
    if (a < x1) box(parent, a, x1, y0, y1, z - 0.06, z + 0.06, mats, 1);
  };

  // muro trasero
  wallZ(house, -2.5, -3.96, -2.5, 0, TOP, [], pHall, ext);
  wallZ(house, -2.5, -2.5, 2.56, 0, Y1, [], pLiving, ext);
  wallZ(house, -2.5, -2.5, 2.56, Y1, TOP, [[0.85, 1.75, Y1 + 0.9, Y1 + 1.95]], pBed, ext);
  // muro derecho
  wallX(house, 2.5, -2.44, 2.44, 0, Y1, [[0.1, 1.15, 1.05, 2.05]], ext, pLiving);
  wallX(house, 2.5, -2.44, 2.44, Y1, TOP, [], ext, pBed);
  // muro izquierdo exterior (cubo de la escalera)
  wallX(house, -3.9, -2.44, 2.44, 0, TOP, [], pHall, ext);
  // muro divisorio sala/escalera y recámara/descanso
  wallX(house, -2.5, -2.44, 2.44, 0, Y1, [[1.45, 2.15, 0, 2.0]], pLiving, pHall);
  wallX(house, -2.5, -2.44, 2.44, Y1, TOP, [[-2.25, -1.45, Y1, Y1 + 2.0]], pBed, pHall);
  // muros frontales (se hunden al final para revelar el diorama)
  wallZ(H.front, 2.5, -3.96, -2.5, 0, TOP, [[-3.5, -2.9, 2.9, 3.6]], ext, pHall);
  wallZ(H.front, 2.5, -2.5, 2.56, 0, Y1, [[-0.6, 0.6, 1.0, 2.0]], ext, pLiving);
  wallZ(H.front, 2.5, -2.5, 2.56, Y1, TOP, [[-1.6, -0.7, Y1 + 0.9, Y1 + 1.9]], ext, pBed);

  // zoclos
  const skirt = (x0, x1, y, z0, z1) => box(house, x0, x1, y, y + 0.09, z0, z1, trim, 1, false);
  skirt(-2.44, 2.44, 0, -2.44, -2.41); skirt(2.41, 2.44, 0, -2.44, 2.44); skirt(-2.44, -2.41, 0, -2.44, 1.45);
  skirt(-2.44, 2.44, Y1, -2.44, -2.41); skirt(2.41, 2.44, Y1, -2.44, 2.44); skirt(-2.44, -2.41, Y1, -1.45, 2.44);
  skirt(-2.44, -2.41, Y1, -2.44, -2.25);

  // marcos de puertas
  const frameDoorX = (x, z0, z1, y0, y1, side) => {
    for (const s of side) {
      box(house, x - 0.07 + s * 0.0, x + 0.07, y0, y1 + 0.06, z0 - 0.06, z0, trim, 1, false);
      box(house, x - 0.07, x + 0.07, y0, y1 + 0.06, z1, z1 + 0.06, trim, 1, false);
      box(house, x - 0.07, x + 0.07, y1, y1 + 0.06, z0 - 0.06, z1 + 0.06, trim, 1, false);
    }
  };
  frameDoorX(-2.5, 1.45, 2.15, 0, 2.0, [0]);
  frameDoorX(-2.5, -2.25, -1.45, Y1, Y1 + 2.0, [0]);

  // ---------- ventanas con "paisaje nocturno" de cartón detrás
  const skyTex = TX.nightSky();
  const skyMat = new THREE.MeshBasicMaterial({ map: skyTex, color: '#8d96b6' });
  const windowFrame = (parent, cx, cy, cz, w, h, axis, outward) => {
    // axis: 'z' => ventana en muro z=cte; 'x' => muro x=cte; outward = signo hacia afuera
    const g = new THREE.Group();
    g.position.set(cx, cy, cz);
    if (axis === 'x') g.rotation.y = outward > 0 ? -Math.PI / 2 : Math.PI / 2;
    else g.rotation.y = outward > 0 ? Math.PI : 0;
    parent.add(g);
    const t = 0.05;
    mesh(new THREE.BoxGeometry(w + 0.1, t, 0.16), trim, g, [0, -h / 2, 0.0]);
    mesh(new THREE.BoxGeometry(w + 0.18, 0.05, 0.24), trim, g, [0, -h / 2 - 0.02, 0.06]);
    mesh(new THREE.BoxGeometry(w + 0.1, t, 0.16), trim, g, [0, h / 2, 0]);
    mesh(new THREE.BoxGeometry(t, h, 0.16), trim, g, [-w / 2, 0, 0]);
    mesh(new THREE.BoxGeometry(t, h, 0.16), trim, g, [w / 2, 0, 0]);
    mesh(new THREE.BoxGeometry(0.03, h, 0.04), trim, g, [0, 0, 0]);
    mesh(new THREE.BoxGeometry(w, 0.03, 0.04), trim, g, [0, 0, 0]);
    const sky = new THREE.Mesh(new THREE.PlaneGeometry(w * 2.2, h * 2.0), skyMat);
    sky.position.set(0, 0, -0.45);
    g.add(sky);
    return g;
  };
  windowFrame(house, 1.3, Y1 + 1.425, -2.5, 0.9, 1.05, 'z', -1);
  windowFrame(house, 2.5, 1.55, 0.625, 1.05, 1.0, 'x', 1);
  windowFrame(H.front, 0, 1.5, 2.5, 1.2, 1.0, 'z', 1);
  windowFrame(H.front, -1.15, Y1 + 1.4, 2.5, 0.9, 1.0, 'z', 1);
  windowFrame(H.front, -3.2, 3.25, 2.5, 0.6, 0.7, 'z', 1);

  // ---------- escalera
  const stairWood = M('#a8693f', { rough: 0.75 });
  const runner = M('#a83a32', { map: TX.plaid('#a83a32', '#5b1f1c'), rough: 1 });
  runner.map.repeat.set(0.6, 0.6);
  for (let i = 1; i <= STAIR.n; i++) {
    const z0 = STAIR.z0 + (i - 1) * STAIR.run, z1 = z0 + STAIR.run, y = Y1 - i * STAIR.rise;
    box(house, STAIR.x0, STAIR.x1, 0, y, z0, z1, stairWood, 1);
    box(house, STAIR.x0 - 0.0, STAIR.x1 + 0.02, y - 0.0, y + 0.025, z0 - 0.0, z1 + 0.025, M('#c08454', { rough: 0.7 }), 1);
    box(house, -3.62, -3.17, y + 0.025, y + 0.035, z0, z1 + 0.02, runner, 1, false);
    box(house, -3.62, -3.17, y - STAIR.rise + 0.03, y + 0.03, z1 + 0.025, z1 + 0.035, runner, 1, false);
  }
  // barandal
  const rail = M('#f4efe6', { rough: 0.7 });
  const railWood = M('#7c4a2b', { rough: 0.6 });
  const rx = -2.99;
  for (let i = 1; i <= STAIR.n; i++) {
    const zc = STAIR.z0 + (i - 0.5) * STAIR.run, y = Y1 - i * STAIR.rise + 0.025;
    mesh(cyl(0.018, 0.018, 0.86), rail, house, [rx, y + 0.43, zc]);
  }
  const railPts = [];
  for (let i = 0; i <= 12; i++) {
    const z = STAIR.z0 + i * (STAIR.run * STAIR.n) / 12;
    railPts.push([rx, stairFloorY(z) + 0.9, z]);
  }
  railPts.unshift([rx, Y1 + 0.9, STAIR.z0 - 0.05]);
  mesh(sweep(railPts, () => 0.032, 40, 12), railWood, house);
  mesh(rbox(0.09, 1.05, 0.09, 0.02), railWood, house, [rx, 0.52, STAIR.z0 + STAIR.run * STAIR.n + 0.12]);
  mesh(sphere(0.06), railWood, house, [rx, 1.08, STAIR.z0 + STAIR.run * STAIR.n + 0.12]);
  mesh(rbox(0.09, 1.0, 0.09, 0.02), railWood, house, [rx, Y1 + 0.5, STAIR.z0 - 0.05]);
  // baranda del descanso
  mesh(cyl(0.032, 0.032, 0.45, 12), railWood, house, [-2.77, Y1 + 0.9, STAIR.z0 - 0.05], [0, 0, Math.PI / 2]);
  for (const x of [-2.86, -2.72, -2.6]) mesh(cyl(0.018, 0.018, 0.88), rail, house, [x, Y1 + 0.45, STAIR.z0 - 0.05]);

  // guirnalda con foquitos en el barandal
  const garlandPts = [];
  for (let i = 0; i <= 40; i++) {
    const u = i / 40;
    const z = STAIR.z0 - 0.05 + u * (STAIR.run * STAIR.n + 0.17);
    const sag = Math.sin(u * Math.PI * 6) * 0.06;
    garlandPts.push([rx + 0.03, stairFloorY(z) + 0.84 - Math.abs(sag), z]);
  }
  addGarland(house, garlandPts, H, 0.05, 26, 3);

  // cuadros en el muro de la escalera
  const frames = [[-3.84, 3.0, -0.6, '#e9b44c'], [-3.84, 2.2, 0.3, '#8fb3c9'], [-3.84, 1.45, 1.2, '#d97a5b']];
  for (const [x, y, z, c] of frames) picture(house, x + 0.03, y, z, 0.42, 0.52, c, 'x+');
  // aplique de luz en el pasillo
  mesh(cyl(0.06, 0.1, 0.16, 20), M('#fff4dc', { emissive: '#ffd59a', ei: 0.9 }), house, [-3.8, 1.85, 2.2]);
  H.glows.push(addGlow(house, [-3.75, 1.85, 2.2], 0.6, '#ffcf8a', 0.55));
  const sconce = new THREE.PointLight('#ffc98a', 0, 4.5, 2);
  sconce.position.set(-3.6, 1.9, 2.1);
  house.add(sconce);
  H.lights.sconce = sconce;
  // corona en la ventanita del pasillo
  wreath(H.front, -3.2, 3.25, 2.42, 0.22, -1);

  H.house = house;
  H.mats = { wood, ext, trim };
  return H;
}

// ---------- utilidades decorativas
export function addGlow(parent, pos, size, color, opacity = 1) {
  if (!addGlow.tex) addGlow.tex = TX.glow();
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: addGlow.tex, color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false }));
  s.position.set(...pos);
  s.scale.setScalar(size);
  s.userData.base = opacity;
  parent.add(s);
  return s;
}

const BULB_COLS = ['#ffcf7a', '#ff8f6b', '#ffe3a3', '#9fd0ff', '#ffb36b', '#ffd9e0'];
export function addGarland(parent, pts, H, puff = 0.05, bulbs = 20, seed = 1) {
  const r = TX.rng(seed);
  const curve = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p)));
  const green = M('#3d6b4a', { rough: 1 });
  const dark = M('#2f5a3e', { rough: 1 });
  const n = Math.floor(curve.getLength() / (puff * 0.9));
  const geo = new THREE.IcosahedronGeometry(puff, 1);
  const inst = new THREE.InstancedMesh(geo, green, n);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
  for (let i = 0; i < n; i++) {
    const p = curve.getPointAt(i / (n - 1));
    p.x += (r() - 0.5) * puff * 0.8; p.y += (r() - 0.5) * puff * 0.8; p.z += (r() - 0.5) * puff * 0.8;
    e.set(r() * 6, r() * 6, r() * 6); q.setFromEuler(e);
    const sc = 0.8 + r() * 0.5;
    m4.compose(p, q, new THREE.Vector3(sc, sc, sc));
    inst.setMatrixAt(i, m4);
  }
  inst.castShadow = true; inst.receiveShadow = true;
  parent.add(inst);
  for (let i = 0; i < bulbs; i++) {
    const p = curve.getPointAt((i + 0.5) / bulbs);
    const col = BULB_COLS[Math.floor(r() * BULB_COLS.length)];
    const b = mesh(sphere(puff * 0.32, 10, 8), new THREE.MeshBasicMaterial({ color: col }), parent, [p.x + (r() - 0.5) * 0.04, p.y - puff * 0.6, p.z], [0, 0, 0], 1, false);
    const g = addGlow(parent, [p.x, p.y - puff * 0.6, p.z], puff * 3.2, col, 0.75);
    H.bulbs.push({ b, g, phase: r() * 10, speed: 1.5 + r() * 2 });
  }
  return inst;
}

export function picture(parent, x, y, z, w, h, color, facing) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  if (facing === 'x+') g.rotation.y = Math.PI / 2;
  if (facing === 'x-') g.rotation.y = -Math.PI / 2;
  if (facing === 'z-') g.rotation.y = Math.PI;
  parent.add(g);
  mesh(rbox(w, h, 0.04, 0.012), M('#6b4a33', { rough: 0.6 }), g, [0, 0, 0.02]);
  mesh(new THREE.BoxGeometry(w - 0.08, h - 0.08, 0.01), M('#f3ead8'), g, [0, 0, 0.042], [0, 0, 0], 1, false);
  mesh(sphere(Math.min(w, h) * 0.22, 20, 14), M(color), g, [0, -h * 0.05, 0.045], [0, 0, 0], [1, 1, 0.12], false);
  mesh(new THREE.BoxGeometry(w - 0.14, h * 0.18, 0.012), M('#7aa37f'), g, [0, -h * 0.3, 0.046], [0, 0, 0], 1, false);
  return g;
}

export function wreath(parent, x, y, z, R, facingZ = 1) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  if (facingZ < 0) g.rotation.y = Math.PI;
  parent.add(g);
  const r = TX.rng(9);
  const green = M('#36603f', { rough: 1 });
  for (let i = 0; i < 26; i++) {
    const a = (i / 26) * Math.PI * 2;
    mesh(new THREE.IcosahedronGeometry(R * 0.28, 1), green, g, [Math.cos(a) * R, Math.sin(a) * R, (r() - 0.5) * 0.03], [r() * 3, r() * 3, 0]);
  }
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2 + 0.3;
    mesh(sphere(R * 0.09, 10, 8), M('#c0392b', { rough: 0.5 }), g, [Math.cos(a) * R * 1.05, Math.sin(a) * R * 1.05, R * 0.2]);
  }
  mesh(torus(R * 0.16, R * 0.06, 8, 20), M('#b8322f'), g, [-R * 0.17, -R * 1.05, R * 0.22], [0, 0, 0.5]);
  mesh(torus(R * 0.16, R * 0.06, 8, 20), M('#b8322f'), g, [R * 0.17, -R * 1.05, R * 0.22], [0, 0, -0.5]);
  return g;
}
