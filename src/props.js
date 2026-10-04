// Muebles, juguetes, árbol de Navidad, chimenea y regalos.
import * as THREE from 'three';
import { M, mesh, box, sphere, capsule, cyl, rbox, torus, sweep, lathe, wobble } from './geo.js';
import * as TX from './textures.js';
import { fabric, addFur, woodMaps, stuccoNormal, paperNormal, weaveMaps } from './materials.js';
function woodMat(color, rep = [1, 1], seed = 31) {
  const w = woodMaps(color, { seed });
  w.map.repeat.set(...rep); w.normalMap.repeat.set(...rep);
  return new THREE.MeshPhysicalMaterial({ color: '#ffffff', map: w.map, normalMap: w.normalMap, normalScale: new THREE.Vector2(0.6, 0.6), roughness: 0.6, clearcoat: 0.2, clearcoatRoughness: 0.45, specularIntensity: 0.4 });
}
function pileRug(mesh, map) {
  addFur(mesh, { useUv: true, len: 0.014, density: 5, shells: 10, map, color: '#9a948c', tip: '#ffffff', clump: 0.3, gravity: 0, seed: 21, ao: 0.6 });
}
import { Y1, CEIL, addGlow, addGarland, picture, wreath } from './house.js';

function G(parent, pos = [0, 0, 0], rotY = 0) {
  const g = new THREE.Group();
  g.position.set(...pos);
  g.rotation.y = rotY;
  parent.add(g);
  return g;
}

// Sombra de contacto suave (decal) para asentar los objetos como en una maqueta.
let blobTex;
export function blob(parent, x, y, z, sx, sz, opacity = 0.35) {
  if (!blobTex) {
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const g = c.getContext('2d');
    const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(0.5, 'rgba(0,0,0,0.5)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    blobTex = new THREE.CanvasTexture(c);
  }
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, opacity, depthWrite: false, color: '#2a1a10' }));
  m.rotation.x = -Math.PI / 2;
  m.position.set(x, y + 0.004, z);
  m.scale.set(sx, sz, 1);
  m.renderOrder = 1;
  parent.add(m);
  return m;
}

// ======================================================== RECÁMARA
export function buildBedroom(parent, H) {
  const R = {};
  const y = Y1;
  // tapete redondo
  const rug = new THREE.Mesh(new THREE.CircleGeometry(1.15, 64), M('#ffffff', { map: TX.rugRound('#7fb3a6', '#f4ead6', '#e8a35c'), rough: 1 }));
  rug.rotation.x = -Math.PI / 2; rug.position.set(-0.3, y + 0.006, 0.2); rug.receiveShadow = true; parent.add(rug);

  // cama: cabecera contra el muro derecho
  const bed = G(parent, [1.5, y, 1.75]);
  const bedWood = M('#d9a56b', { rough: 0.7 });
  mesh(rbox(1.9, 0.26, 1.15, 0.05), bedWood, bed, [0, 0.2, 0]);
  mesh(rbox(0.1, 1.0, 1.22, 0.05), bedWood, bed, [0.92, 0.5, 0]);
  mesh(cyl(0.61, 0.61, 0.1, 40, 1, false), bedWood, bed, [0.92, 1.0, 0], [Math.PI / 2, 0, Math.PI / 2], [1, 1, 0.45]);
  mesh(rbox(0.1, 0.62, 1.22, 0.05), bedWood, bed, [-0.92, 0.31, 0]);
  for (const zz of [-0.55, 0.55]) for (const xx of [-0.9, 0.9]) mesh(sphere(0.06), bedWood, bed, [xx, xx > 0 ? 1.02 : 0.64, zz]);
  mesh(rbox(1.78, 0.18, 1.06, 0.07), M('#f6f1e8'), bed, [0, 0.4, 0]);
  const quiltMat = M('#ffffff', { map: TX.quilt(), rough: 1 });
  quiltMat.map.repeat.set(1, 1);
  R.quilt = mesh(rbox(1.42, 0.09, 1.16, 0.045), quiltMat, bed, [-0.2, 0.52, 0]);
  R.quiltBump = mesh(sphere(0.3, 24, 16), quiltMat, bed, [0.15, 0.5, 0.05], [0, 0, 0], [1.4, 0.35, 0.9]);
  mesh(rbox(0.38, 0.13, 0.7, 0.06), M('#fbf7f0'), bed, [0.68, 0.56, 0], [0, 0, 0.12]);
  // peluche de estrella sobre la cama
  blob(parent, 1.5, y, 1.75, 2.4, 1.5, 0.3);

  // buró + lámpara
  const ns = G(parent, [2.2, y, 0.75]);
  const nsMat = M('#e8d6bd', { rough: 0.8 });
  mesh(rbox(0.46, 0.55, 0.56, 0.04), nsMat, ns, [0, 0.275, 0]);
  mesh(rbox(0.04, 0.16, 0.46, 0.02), M('#d8c2a3'), ns, [-0.235, 0.33, 0]);
  mesh(sphere(0.025), M('#c08b4c', { rough: 0.4, metal: 0.4 }), ns, [-0.26, 0.33, 0]);
  const lamp = G(ns, [0.02, 0.55, -0.06]);
  mesh(lathe([[0, 0], [0.1, 0], [0.11, 0.03], [0.07, 0.08], [0.085, 0.16], [0.05, 0.24], [0.02, 0.27], [0, 0.27]], 32), M('#e98b6d', { rough: 0.6 }), lamp);
  R.lampShadeMat = M('#fff1d6', { rough: 0.9, emissive: '#ffb45c', ei: 0, side: THREE.DoubleSide, noCache: true });
  mesh(lathe([[0.17, 0.25], [0.11, 0.48]], 40), R.lampShadeMat, lamp, [0, 0, 0], [0, 0, 0], 1, true);
  R.lampBulbMat = new THREE.MeshBasicMaterial({ color: '#5a5048' });
  mesh(sphere(0.045), R.lampBulbMat, lamp, [0, 0.33, 0], [0, 0, 0], 1, false);
  R.lampSwitch = mesh(rbox(0.05, 0.03, 0.04, 0.01), M('#f5efe6'), lamp, [-0.09, 0.02, 0.05]);
  R.lampWorld = new THREE.Vector3(2.22, y + 0.55 + 0.36, 0.69);
  R.switchWorld = new THREE.Vector3(2.2 + 0.02 - 0.09, y + 0.55 + 0.04, 0.75 - 0.06 + 0.05);
  R.lampGlow = addGlow(parent, [2.22, y + 0.92, 0.69], 1.1, '#ffc27a', 0);
  // despertador y libro
  mesh(cyl(0.05, 0.05, 0.04, 24), M('#7fb3a6'), ns, [0.08, 0.6, 0.15], [Math.PI / 2, 0, -0.5]);
  mesh(rbox(0.18, 0.04, 0.24, 0.01), M('#d65a4a'), ns, [-0.05, 0.57, 0.15], [0, 0.3, 0]);
  blob(parent, 2.2, y, 0.75, 0.8, 0.9, 0.3);

  // repisa de juguetes contra el muro izquierdo
  const shelf = G(parent, [-2.24, y, 0.95]);
  const shM = M('#f2e6d6', { rough: 0.85 });
  mesh(rbox(0.36, 1.25, 1.3, 0.02), shM, shelf, [0, 0.625, 0], [0, 0, 0], 1, true).visible = false;
  box(shelf, -0.18, 0.18, 0, 1.25, -0.65, -0.61, shM, 1);
  box(shelf, -0.18, 0.18, 0, 1.25, 0.61, 0.65, shM, 1);
  box(shelf, -0.18, -0.15, 0, 1.25, -0.65, 0.65, shM, 1);
  for (const yy of [0, 0.42, 0.84, 1.22]) box(shelf, -0.18, 0.18, yy, yy + 0.03, -0.65, 0.65, shM, 1);
  const r = TX.rng(77);
  const blockCols = ['#e86f5a', '#f2c46d', '#7fb3a6', '#5d84b8', '#e9a6a0'];
  for (let i = 0; i < 4; i++) mesh(rbox(0.12, 0.12, 0.12, 0.02), M(blockCols[i % 5]), shelf, [0.02, 0.09, -0.45 + i * 0.14], [0, r() * 0.5, 0]);
  mesh(rbox(0.12, 0.12, 0.12, 0.02), M(blockCols[4]), shelf, [0.02, 0.21, -0.38], [0, 0.3, 0]);
  for (let i = 0; i < 6; i++) mesh(rbox(0.18, 0.26 + r() * 0.08, 0.05, 0.01), M(blockCols[(i + 2) % 5]), shelf, [0.0, 0.58, 0.05 + i * 0.065], [0.0, 0, 0]);
  mesh(sphere(0.11), M('#e86f5a'), shelf, [0.02, 0.56, -0.38]);
  // carrito
  const car = G(shelf, [0.02, 0.87, -0.3], Math.PI / 2);
  mesh(rbox(0.26, 0.08, 0.13, 0.03), M('#5d84b8'), car, [0, 0.07, 0]);
  mesh(rbox(0.13, 0.07, 0.11, 0.03), M('#5d84b8'), car, [-0.02, 0.14, 0]);
  for (const xx of [-0.08, 0.08]) for (const zz of [-0.065, 0.065]) mesh(cyl(0.035, 0.035, 0.03, 16), M('#2a2422'), car, [xx, 0.035, zz], [Math.PI / 2, 0, 0]);
  // osito pequeño en la repisa de arriba
  teddy(shelf, [0.0, 1.25, 0.2], 0.45, -Math.PI / 2 + 0.0);
  blob(parent, -2.24, y, 0.95, 0.6, 1.5, 0.25);

  // osito grande en el tapete
  teddy(parent, [-0.75, y, 0.35], 1.0, 0.9);
  blob(parent, -0.75, y, 0.35, 0.6, 0.6, 0.35);
  // cubos con letras en el tapete
  const letters = [['N', '#e86f5a'], ['O', '#f2c46d'], ['E', '#7fb3a6']];
  letters.forEach(([ch, c], i) => letterBlock(parent, [-0.1 + i * 0.2, y + 0.07, 0.95 - i * 0.05], c, ch, i * 0.4));
  letterBlock(parent, [0.0, y + 0.21, 0.92], '#5d84b8', 'L', 0.2);
  // cohete de juguete
  const rk = G(parent, [-1.9, y, 1.95]);
  mesh(lathe([[0, 0.15], [0.15, 0.17], [0.17, 0.4], [0.15, 0.7], [0.08, 0.9], [0, 0.98]], 32), M('#f4efe4'), rk);
  mesh(cyl(0.172, 0.172, 0.08, 32), M('#d65a4a'), rk, [0, 0.48, 0]);
  mesh(lathe([[0.0, 0.84], [0.1, 0.84], [0.0, 1.0]], 24), M('#d65a4a'), rk);
  mesh(cyl(0.06, 0.06, 0.03, 24), M('#9fd0ff', { rough: 0.3 }), rk, [0, 0.62, 0.155], [Math.PI / 2, 0, 0]);
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    const f = mesh(rbox(0.03, 0.28, 0.16, 0.012), M('#d65a4a'), rk, [Math.sin(a) * 0.17, 0.18, Math.cos(a) * 0.17], [0, a, 0]);
  }
  blob(parent, -1.9, y, 1.95, 0.6, 0.6, 0.35);

  // banderines sobre la ventana y la pared
  bunting(parent, [[-0.2, y + 2.15, -2.42], [0.55, y + 1.95, -2.42], [1.3, y + 2.1, -2.42], [2.05, y + 1.95, -2.42], [2.42, y + 2.15, -2.42]], 4);
  bunting(parent, [[-2.42, y + 2.1, 2.3], [-2.42, y + 1.9, 1.5], [-2.42, y + 2.1, 0.6], [-2.42, y + 1.92, -0.3], [-2.42, y + 2.12, -1.2]], 5, 'x');
  // cortinas
  for (const s of [-1, 1]) {
    const c = mesh(wobble(capsule(0.1, 1.05, 6, 16), 0.015, 18, s + 3), M('#f2c46d', { rough: 1 }), parent, [1.3 + s * 0.58, y + 1.5, -2.36], [0, 0, 0], [1, 1, 0.45]);
  }
  mesh(cyl(0.02, 0.02, 1.5, 10), M('#c08b4c'), parent, [1.3, y + 2.1, -2.36], [0, 0, Math.PI / 2]);
  // dibujo enmarcado
  picture(parent, 2.43, y + 1.6, -0.9, 0.5, 0.4, '#e86f5a', 'x-');
  picture(parent, -0.15, y + 1.55, -2.43, 0.0001, 0.0001, '#000', 'z+').visible = false;

  // puerta (bisagra en z=-2.25)
  R.door = G(parent, [-2.5, y, -2.25]);
  const doorM = M('#f5efe6', { rough: 0.8 });
  mesh(rbox(0.05, 1.98, 0.79, 0.015), doorM, R.door, [0, 0.99, 0.4]);
  for (const yy of [0.55, 1.45]) {
    mesh(rbox(0.06, 0.62, 0.55, 0.01), M('#efe6d8'), R.door, [0, yy, 0.4]);
  }
  mesh(sphere(0.035), M('#d8a842', { rough: 0.35, metal: 0.5 }), R.door, [0.05, 0.95, 0.7]);
  mesh(sphere(0.035), M('#d8a842', { rough: 0.35, metal: 0.5 }), R.door, [-0.05, 0.95, 0.7]);
  // estrellita de papel en la puerta
  const star = starShape(0.12);
  mesh(new THREE.ExtrudeGeometry(star, { depth: 0.01, bevelEnabled: false }), M('#f2c46d'), R.door, [0.035, 1.55, 0.4], [0, Math.PI / 2, 0]);
  return R;
}

function teddy(parent, pos, s = 1, rotY = 0) {
  const g = G(parent, pos, rotY);
  g.scale.setScalar(s);
  const fur = M('#b77b4a', { map: TX.plain('#b77b4a', 30, 8), rough: 1 });
  const light = M('#e6c39a', { rough: 1 });
  mesh(sphere(0.13), fur, g, [0, 0.14, 0], [0, 0, 0], [1, 1.05, 0.9]);
  mesh(sphere(0.07), light, g, [0, 0.13, 0.08], [0, 0, 0], [1, 1.1, 0.5]);
  mesh(sphere(0.1), fur, g, [0, 0.33, 0]);
  mesh(sphere(0.045), light, g, [0, 0.31, 0.085], [0, 0, 0], [1, 0.8, 0.8]);
  mesh(sphere(0.015), M('#2a1a12'), g, [0, 0.325, 0.12]);
  for (const x of [-1, 1]) {
    mesh(sphere(0.04), fur, g, [x * 0.075, 0.41, 0]);
    mesh(sphere(0.012), M('#1d1715'), g, [x * 0.035, 0.355, 0.09]);
    mesh(sphere(0.05), fur, g, [x * 0.12, 0.18, 0.04], [0, 0, 0], [0.8, 1.2, 0.8]);
    mesh(sphere(0.055), fur, g, [x * 0.07, 0.04, 0.08], [0, 0, 0], [0.9, 0.7, 1.2]);
  }
  mesh(torus(0.06, 0.015, 8, 20), M('#c0392b'), g, [0, 0.245, 0.0], [Math.PI / 2, 0, 0]);
  return g;
}

function letterBlock(parent, pos, color, ch, rot) {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const x = c.getContext('2d');
  x.fillStyle = color; x.fillRect(0, 0, 128, 128);
  x.fillStyle = '#fffaf0'; x.font = 'bold 86px DejaVu Sans'; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText(ch, 64, 70);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const m = mesh(rbox(0.14, 0.14, 0.14, 0.02), M('#ffffff', { map: t }), parent, pos, [0, rot, 0]);
  return m;
}

function bunting(parent, pts, n, axis = 'z') {
  const curve = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p)));
  mesh(new THREE.TubeGeometry(curve, 40, 0.006, 6), M('#f4efe4'), parent, [0, 0, 0], [0, 0, 0], 1, false);
  const cols = ['#e86f5a', '#f2c46d', '#7fb3a6', '#5d84b8', '#e9a6a0'];
  const k = n * 3;
  const tri = new THREE.Shape([new THREE.Vector2(-0.07, 0), new THREE.Vector2(0.07, 0), new THREE.Vector2(0, -0.16)]);
  for (let i = 0; i < k; i++) {
    const p = curve.getPointAt((i + 0.5) / k);
    const f = mesh(new THREE.ShapeGeometry(tri), M(cols[i % 5], { side: THREE.DoubleSide }), parent, [p.x, p.y, p.z], [0, axis === 'x' ? Math.PI / 2 : 0, 0], 1, false);
  }
}

export function starShape(R) {
  const s = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const a = Math.PI / 2 + (i * Math.PI) / 5;
    const r = i % 2 ? R * 0.45 : R;
    if (i === 0) s.moveTo(Math.cos(a) * r, Math.sin(a) * r); else s.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  s.closePath();
  return s;
}

// ======================================================== SALA
export function buildLiving(parent, H) {
  const L = { flames: [], embers: [] };
  // tapete
  const rugMap = TX.rugRound('#b9705f', '#eadcc6', '#7f9c8a');
  const rug = new THREE.Mesh(new THREE.CircleGeometry(1.05, 64), new THREE.MeshPhysicalMaterial({ map: rugMap, color: '#8f8a84', roughness: 1 }));
  rug.rotation.x = -Math.PI / 2; rug.position.set(0.25, 0.006, 0.25); rug.receiveShadow = true; parent.add(rug);
  pileRug(rug, rugMap);

  // ---------- chimenea (pecho de ladrillo al centro del muro trasero)
  const brickM = new THREE.MeshPhysicalMaterial({ map: TX.brick('#d8c3ad', '#efe5d8'), normalMap: stuccoNormal(), normalScale: new THREE.Vector2(1.2, 1.2), roughness: 0.97 });
  brickM.map.repeat.set(1 / 0.6, 1 / 0.6);
  const soot = M('#2b2220', { rough: 1 });
  const xa = -1.0, xb = 0.4, oa = -0.775, ob = 0.175, zf = -1.8, zb = -2.44, oh = 0.92;
  const B = [brickM, brickM, brickM, brickM, brickM, brickM];
  box(parent, xa, oa, 0, CEIL, zb, zf, B, 1);
  box(parent, ob, xb, 0, CEIL, zb, zf, B, 1);
  box(parent, oa, ob, oh, CEIL, -1.95, zf, B, 1);              // dintel (solo el frente)
  box(parent, oa, ob, 1.55, CEIL, zb, -1.95, soot, 1);           // tapa del tiro (arriba, oculta)
  box(parent, oa, ob, 0, 0.06, zb, zf, soot, 1);                 // piso del hogar
  box(parent, oa, ob, 0, 1.6, zb, -2.38, soot, 1);               // fondo
  box(parent, oa, oa + 0.02, 0, 1.6, zb, -1.95, soot, 1);
  box(parent, ob - 0.02, ob, 0, 1.6, zb, -1.95, soot, 1);
  // arco interior suave
  // repisa
  const mantelM = woodMat('#7a4a2a', [1, 0.3], 33);
  mesh(rbox(1.62, 0.08, 0.3, 0.02), mantelM, parent, [-0.3, 1.0, -1.72]);
  mesh(rbox(1.5, 0.05, 0.36, 0.015), M('#cdb79f'), parent, [-0.3, 0.025, -1.62]);
  // piedra del hogar al frente
  mesh(rbox(1.6, 0.04, 0.42, 0.015), M('#b9aa98', { rough: 0.9 }), parent, [-0.3, 0.02, -1.6]);
  // guirnalda en la repisa
  const gp = [];
  for (let i = 0; i <= 20; i++) { const u = i / 20; gp.push([-1.08 + u * 1.56, 1.06 - Math.sin(u * Math.PI * 3) ** 2 * 0.07, -1.6]); }
  addGarland(parent, gp, H, 0.045, 14, 5);
  // velas y adornos en la repisa
  for (const [x, h] of [[-0.95, 0.2], [-0.85, 0.14], [0.3, 0.18]]) {
    mesh(cyl(0.035, 0.035, h, 16), M('#f6efe2'), parent, [x, 1.04 + h / 2, -1.78]);
    const fl = mesh(sphere(0.016, 10, 8), new THREE.MeshBasicMaterial({ color: '#ffd27a' }), parent, [x, 1.04 + h + 0.02, -1.78], [0, 0, 0], [1, 1.7, 1], false);
    H.glows.push(addGlow(parent, [x, 1.04 + h + 0.03, -1.76], 0.28, '#ffb85a', 0.8));
    L.embers.push(fl);
  }
  mesh(rbox(0.16, 0.22, 0.08, 0.03), M('#3f6b57'), parent, [-0.3, 1.15, -1.82]);
  mesh(cyl(0.055, 0.055, 0.01, 24), M('#f6efe2'), parent, [-0.3, 1.17, -1.775], [Math.PI / 2, 0, 0]);
  // calcetas navideñas colgando de los pilares
  stocking(parent, [-0.9, 0.98, -1.6], '#c0392b');
  stocking(parent, [0.3, 0.98, -1.6], '#3f6b57');
  // corona sobre la chimenea
  wreath(parent, -0.3, 1.75, -1.79, 0.2, 1);

  // leños + fuego
  const logM = woodMat('#5d3a22', [0.5, 1], 35); logM.clearcoat = 0; logM.roughness = 0.95;
  mesh(cyl(0.06, 0.07, 0.62, 14), logM, parent, [-0.3, 0.12, -2.15], [0, 0.2, Math.PI / 2]);
  mesh(cyl(0.055, 0.06, 0.55, 14), logM, parent, [-0.32, 0.12, -2.0], [0, -0.25, Math.PI / 2]);
  mesh(cyl(0.05, 0.055, 0.5, 14), logM, parent, [-0.28, 0.22, -2.08], [0, 0.05, Math.PI / 2]);
  for (const [x, z] of [[-0.55, -2.05], [-0.1, -2.1], [-0.35, -1.98], [-0.2, -2.2], [-0.45, -2.2]]) {
    const e = mesh(sphere(0.03, 10, 8), new THREE.MeshBasicMaterial({ color: '#ff7a2e' }), parent, [x, 0.08, z], [0, 0, 0], [1.4, 0.6, 1.2], false);
    L.embers.push(e);
  }
  const flameGeo = lathe([[0, 0], [0.05, 0.03], [0.065, 0.08], [0.05, 0.16], [0.02, 0.26], [0, 0.3]], 20);
  const fcol = ['#ff8a2a', '#ffb347', '#ffd27a', '#ff6a1f', '#ffc061'];
  for (let i = 0; i < 5; i++) {
    const f = new THREE.Mesh(flameGeo, new THREE.MeshBasicMaterial({ color: fcol[i], transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }));
    f.position.set(-0.5 + i * 0.1, 0.17, -2.1 + (i % 2) * 0.06);
    f.userData = { x: f.position.x, ph: i * 1.7, s: 0.8 + (i % 3) * 0.25 };
    parent.add(f);
    L.flames.push(f);
  }
  L.fireGlow = addGlow(parent, [-0.3, 0.35, -1.95], 1.3, '#ff9a4a', 0.7);
  L.fireLight = new THREE.PointLight('#ff9a52', 3, 6, 2);
  L.fireLight.position.set(-0.3, 0.45, -1.55);
  parent.add(L.fireLight);
  blob(parent, -0.3, 0.0, -1.55, 2.0, 0.9, 0.25);

  // ---------- árbol de Navidad (esquina trasera derecha)
  L.tree = buildTree(parent, [1.68, 0, -1.7], H);
  blob(parent, 1.68, 0, -1.7, 2.0, 2.0, 0.4);

  // regalos bajo el árbol
  const gifts = [
    [1.0, -1.28, 0.34, 0.26, 0.3, '#d65a4a', '#f2d27a', 0.3],
    [1.3, -1.12, 0.28, 0.2, 0.26, '#7fb3a6', '#f4efe4', -0.4],
    [2.1, -0.95, 0.4, 0.3, 0.32, '#f2c46d', '#c0392b', 0.2],
    [0.8, -1.5, 0.3, 0.38, 0.3, '#5d84b8', '#f2d27a', 0.6],
    [1.15, -2.0, 0.26, 0.22, 0.26, '#e9a6a0', '#f4efe4', 0.1],
    [2.15, -1.6, 0.24, 0.42, 0.24, '#3f6b57', '#e86f5a', -0.2],
    [1.82, -0.86, 0.2, 0.16, 0.2, '#f4efe4', '#d65a4a', 0.7],
    [2.25, -0.58, 0.18, 0.14, 0.22, '#c0392b', '#f4efe4', -0.6],
  ];
  for (const [x, z, w, h, d, c, rb, ry] of gifts) gift(parent, [x, 0, z], w, h, d, c, rb, ry);

  // ---------- sofá contra el muro derecho (mira hacia -x)
  const sofa = G(parent, [2.06, 0, 0.5], -Math.PI / 2);
  const sofaM = fabric('#577f7b', 'weave', { repeat: [5, 5], n: 44, strength: 2.2, ns: 1.2, sheen: 1.0 });
  mesh(rbox(1.9, 0.3, 0.82, 0.08), sofaM, sofa, [0, 0.22, 0]);
  mesh(rbox(1.9, 0.5, 0.22, 0.09), sofaM, sofa, [0, 0.6, -0.32]);
  for (const s of [-1, 1]) mesh(rbox(0.2, 0.58, 0.82, 0.09), sofaM, sofa, [s * 0.95, 0.33, 0]);
  for (const s of [-1, 1]) mesh(rbox(0.86, 0.14, 0.62, 0.06), sofaM, sofa, [s * 0.44, 0.43, 0.08]);
  for (const s of [-1, 1]) for (const zz of [-0.32, 0.32]) mesh(cyl(0.03, 0.02, 0.07, 10), M('#6b4429'), sofa, [s * 0.86, 0.035, zz]);
  const pl = fabric('#ffffff', 'weave', { repeat: [3, 3], n: 40 }); pl.map = TX.plaid('#a82c2a', '#24453a'); pl.map.repeat.set(1, 1);
  mesh(rbox(0.36, 0.34, 0.12, 0.06), pl, sofa, [0.68, 0.66, -0.16], [-0.2, 0.2, -0.15]);
  mesh(rbox(0.32, 0.3, 0.11, 0.06), fabric('#e0ae4f', 'knit', { repeat: [2, 2] }), sofa, [0.36, 0.64, -0.18], [-0.2, -0.1, 0.1]);
  // mantita doblada
  mesh(rbox(0.5, 0.06, 0.4, 0.03), fabric('#e3d6c3', 'knit', { repeat: [3, 2], ns: 1.4 }), sofa, [0.82, 0.68, 0.0], [0, 0.2, 0]);
  blob(parent, 2.06, 0, 0.5, 1.2, 2.3, 0.35);

  // mesita con galletas y leche (al lado izquierdo de la chimenea)
  const st = G(parent, [-1.7, 0, -1.55]);
  mesh(cyl(0.25, 0.25, 0.04, 32), woodMat('#7a4a2a', [1, 1], 37), st, [0, 0.52, 0]);
  mesh(cyl(0.04, 0.05, 0.5, 16), woodMat('#7a4a2a', [1, 2], 38), st, [0, 0.25, 0]);
  mesh(cyl(0.16, 0.16, 0.02, 24), M('#ffffff', { rough: 0.15 + 0.4 }), st, [0, 0.55, 0], [0, 0, 0], 1, true);
  mesh(cyl(0.045, 0.045, 0.012, 16), M('#c08b4c'), st, [0.04, 0.567, 0.02]);
  mesh(cyl(0.04, 0.045, 0.012, 16, 1, false), M('#c08b4c'), st, [-0.05, 0.567, -0.03], [0, 0, 0], [1, 1, 0.55]);
  mesh(cyl(0.045, 0.04, 0.15, 20), M('#e8eef4', { rough: 0.2, transparent: true, opacity: 0.85 }), st, [0.13, 0.62, -0.08]);
  mesh(cyl(0.041, 0.038, 0.05, 20), M('#fbfbf8'), st, [0.13, 0.57, -0.08]);
  blob(parent, -1.7, 0, -1.55, 0.7, 0.7, 0.35);

  // lámpara de piso en la esquina trasera izquierda
  const fl = G(parent, [-2.1, 0, -2.1]);
  mesh(cyl(0.16, 0.18, 0.04, 24), M('#3a3330'), fl, [0, 0.02, 0]);
  mesh(cyl(0.015, 0.015, 1.5, 10), M('#3a3330'), fl, [0, 0.77, 0]);
  L.flShade = M('#fff1d6', { emissive: '#ffb45c', ei: 0.7, side: THREE.DoubleSide, noCache: true });
  mesh(lathe([[0.24, 1.4], [0.15, 1.72]], 36), L.flShade, fl, [0, 0, 0], [0, 0, 0], 1, true);
  L.floorLight = new THREE.PointLight('#ffbf7a', 3, 7, 2);
  L.floorLight.position.set(-2.0, 1.5, -2.0);
  parent.add(L.floorLight);
  H.glows.push(addGlow(parent, [-2.1, 1.5, -2.1], 0.9, '#ffc27a', 0.35));
  blob(parent, -2.1, 0, -2.1, 0.6, 0.6, 0.3);

  // banderines cruzando el techo
  bunting(parent, [[-2.42, 2.3, -2.2], [-1.2, 2.02, -1.0], [0.0, 1.98, 0.1], [1.2, 2.04, 1.2], [2.42, 2.3, 2.3]], 6);
  bunting(parent, [[-2.42, 2.3, 2.3], [-1.2, 2.06, 1.2], [0.0, 2.0, 0.15], [1.2, 2.02, -1.0], [2.42, 2.3, -2.2]], 6);
  // cuadros
  picture(parent, 2.43, 1.55, -0.95, 0.45, 0.35, '#e9b44c', 'x-');
  picture(parent, -1.6, 1.65, -2.43, 0.45, 0.55, '#8fb3c9', 'z+');
  // canasta de leña
  const bk = G(parent, [-2.0, 0, -0.9]);
  mesh(cyl(0.22, 0.18, 0.3, 24, 1, true), M('#b88a55', { map: TX.burlap(), side: THREE.DoubleSide }), bk, [0, 0.15, 0]);
  for (let i = 0; i < 3; i++) mesh(cyl(0.05, 0.05, 0.5, 12), logM, bk, [-0.08 + i * 0.08, 0.3, 0], [0.2 * (i - 1), 0, Math.PI / 2 + 0.1 * i]);
  blob(parent, -2.0, 0, -0.9, 0.6, 0.6, 0.3);
  return L;
}

function stocking(parent, pos, color) {
  const g = G(parent, pos);
  const m = fabric(color, 'knit', { repeat: [3, 2], ns: 1.3 });
  mesh(sweep([[0, 0, 0], [0, -0.16, 0], [0, -0.27, 0.02], [0, -0.32, 0.1], [0, -0.32, 0.15]], (u) => 0.06 + 0.012 * Math.sin(u * 3), 24, 16, true, () => 0.75), m, g, [0, -0.1, 0]);
  mesh(cyl(0.068, 0.068, 0.1, 20), M('#f6f1ea', { map: TX.plain('#f6f1ea', 22, 4) }), g, [0, -0.06, 0], [0, 0, 0], [1, 1, 0.78]);
  return g;
}

export function gift(parent, pos, w, h, d, color, ribbon, rotY) {
  const g = G(parent, pos, rotY);
  const paper = new THREE.MeshPhysicalMaterial({ color, map: TX.plain('#ffffff', 10, 3 + w * 10), normalMap: paperNormal(), normalScale: new THREE.Vector2(0.5, 0.5), roughness: 0.8, sheen: 0.2 });
  const rb = M(ribbon, { rough: 0.6 });
  mesh(rbox(w, h, d, 0.015), paper, g, [0, h / 2, 0]);
  mesh(new THREE.BoxGeometry(w * 0.16, h + 0.004, d + 0.004), rb, g, [0, h / 2, 0]);
  mesh(new THREE.BoxGeometry(w + 0.004, h + 0.004, d * 0.16), rb, g, [0, h / 2, 0]);
  const bs = Math.min(w, d) * 0.22;
  mesh(torus(bs, bs * 0.32, 8, 20), rb, g, [-bs * 0.8, h + bs * 0.55, 0], [0, 0, 0.6]);
  mesh(torus(bs, bs * 0.32, 8, 20), rb, g, [bs * 0.8, h + bs * 0.55, 0], [0, 0, -0.6]);
  mesh(sphere(bs * 0.35), rb, g, [0, h + bs * 0.15, 0]);
  return g;
}

export function buildTree(parent, pos, H) {
  const T = { lights: [] };
  const g = G(parent, pos);
  T.group = g;
  const r = TX.rng(101);
  // maceta / canasta
  mesh(lathe([[0, 0], [0.26, 0], [0.31, 0.26], [0.33, 0.3], [0, 0.3]], 32), M('#ffffff', { map: TX.burlap(), rough: 1 }), g);
  mesh(torus(0.32, 0.03, 8, 32), M('#c0392b'), g, [0, 0.27, 0], [Math.PI / 2, 0, 0]);
  mesh(cyl(0.06, 0.07, 0.3, 12), M('#6b4429'), g, [0, 0.4, 0]);
  const green = new THREE.MeshPhysicalMaterial({ color: '#1f4a35', roughness: 1 });
  const tiers = [[0.84, 0.4, 0.7], [0.68, 0.78, 0.6], [0.52, 1.12, 0.52], [0.37, 1.45, 0.44], [0.22, 1.74, 0.36]];
  const coneR = (y) => {
    // radio de la silueta para colocar adornos
    let best = 0;
    for (const [R, y0, h] of tiers) if (y >= y0 && y <= y0 + h) best = Math.max(best, R * (1 - (y - y0) / h));
    return best;
  };
  for (const [R, y0, h] of tiers) {
    // gajo cónico con borde redondeado y ondulado (tipo fieltro)
    const prof = [[0.0, h], [R * 0.25, h * 0.78], [R * 0.6, h * 0.38], [R * 0.92, h * 0.06], [R, -0.02], [R * 0.96, -0.07], [R * 0.82, -0.09], [R * 0.4, -0.05], [0.0, -0.04]];
    const geo = new THREE.LatheGeometry(prof.map(([x, y]) => new THREE.Vector2(x, y)), 72);
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      const a = Math.atan2(z, x);
      const rr = Math.hypot(x, z) / R;
      const k = Math.max(0, rr - 0.55) / 0.45;
      const wave = Math.sin(a * 9 + y0 * 5);
      p.setXYZ(i, x * (1 + 0.035 * wave * k), y + wave * 0.025 * k * k, z * (1 + 0.035 * wave * k));
    }
    geo.computeVertexNormals();
    mesh(geo, green, g, [0, y0 - 0.02, 0], [0, 0, 0], [0.93, 1, 0.93]);
  }
  // agujas: miles de ramitas instanciadas sobre cada gajo
  {
    const ng = new THREE.ConeGeometry(0.011, 0.09, 4, 1);
    ng.translate(0, 0.045, 0);
    const nm = new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: 0.85, sheen: 0.4, sheenColor: new THREE.Color('#9fd0a0') });
    const total = 15000;
    const inst = new THREE.InstancedMesh(ng, nm, total);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
    const col = new THREE.Color();
    const area = tiers.map(([R, y0, h]) => R * Math.hypot(R, h));
    const sumA = area.reduce((a, b) => a + b, 0);
    let k = 0;
    tiers.forEach(([R, y0, h], ti) => {
      const n = Math.round(total * area[ti] / sumA);
      for (let i = 0; i < n && k < total; i++, k++) {
        const f = 1 - Math.sqrt(r());           // más agujas abajo (más área)
        const a = r() * Math.PI * 2;
        const rr = R * (1 - f) * (0.9 + r() * 0.1);
        const p = new THREE.Vector3(Math.cos(a) * rr, y0 + f * h, Math.sin(a) * rr);
        const d = new THREE.Vector3(Math.cos(a), -0.25 - (1 - f) * 0.5 + (r() - 0.5) * 0.5, Math.sin(a));
        d.x += (r() - 0.5) * 0.6; d.z += (r() - 0.5) * 0.6;
        d.normalize();
        q.setFromUnitVectors(up, d);
        const sc = 0.7 + r() * 0.6;
        m4.compose(p, q, new THREE.Vector3(sc, sc * (0.8 + (1 - f) * 0.5), sc));
        inst.setMatrixAt(k, m4);
        col.setHSL(0.39 + (r() - 0.5) * 0.05, 0.38 + r() * 0.15, 0.09 + r() * 0.09 + f * 0.05);
        inst.setColorAt(k, col);
      }
    });
    inst.count = k;
    inst.castShadow = true; inst.receiveShadow = true;
    g.add(inst);
  }
  // esfera-adornos
  const ornCols = ['#c0392b', '#d8a842', '#f4efe4', '#5d84b8', '#e9a6a0', '#c0392b'];
  for (let i = 0; i < 34; i++) {
    const y = 0.45 + r() * 1.55;
    const a = r() * Math.PI * 2;
    const rr = coneR(y) * 1.0 + 0.08;
    if (rr < 0.12) continue;
    const c = ornCols[i % ornCols.length];
    mesh(sphere(0.042, 16, 12), M(c, { rough: c === '#d8a842' ? 0.35 : 0.55, metal: c === '#d8a842' ? 0.4 : 0 }), g, [Math.cos(a) * rr, y - 0.03, Math.sin(a) * rr]);
  }
  // guirnalda de cuentas doradas en espiral
  const beads = [];
  for (let i = 0; i <= 160; i++) {
    const u = i / 160;
    const y = 0.42 + u * 1.65;
    const a = u * Math.PI * 2 * 4.2 + 1;
    const rr = coneR(y) * 1.0 + 0.085;
    beads.push([Math.cos(a) * rr, y, Math.sin(a) * rr]);
  }
  mesh(sweep(beads, () => 0.007, 300, 6, false), M('#e2be6a', { rough: 0.4, metal: 0.3 }), g);
  // foquitos
  for (let i = 0; i < 46; i++) {
    const u = (i + 0.5) / 46;
    const y = 0.42 + u * 1.6;
    const a = u * Math.PI * 2 * 5.3 + 2.4;
    const rr = coneR(y) * 1.0 + 0.1;
    const col = ['#ffcf7a', '#ffe3a3', '#ff9a6b', '#ffcf7a', '#a9d4ff'][i % 5];
    const p = [Math.cos(a) * rr, y, Math.sin(a) * rr];
    const b = mesh(sphere(0.018, 10, 8), new THREE.MeshBasicMaterial({ color: col }), g, p, [0, 0, 0], 1, false);
    const gl = addGlow(g, p, 0.16, col, 0.85);
    H.bulbs.push({ b, g: gl, phase: r() * 10, speed: 1 + r() * 2.5 });
  }
  // estrella
  const star = new THREE.ExtrudeGeometry(starShape(0.15), { depth: 0.04, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.012, bevelSegments: 2 });
  star.center();
  T.star = mesh(star, M('#f2c94c', { emissive: '#f2b632', ei: 0.65, rough: 0.4 }), g, [0, 2.17, 0]);
  T.starGlow = addGlow(g, [0, 2.17, 0.03], 0.9, '#ffd77a', 0.7);
  // luz cálida del árbol (dos puntos para que no se vea plano)
  T.light1 = new THREE.PointLight('#ffb870', 0.6, 1.4, 2);
  T.light1.position.set(pos[0], 1.1, pos[2]);
  parent.add(T.light1);
  T.light2 = new THREE.PointLight('#ffc98a', 1.2, 3.5, 2);
  T.light2.position.set(pos[0] - 0.6, 0.6, pos[2] + 1.0);
  parent.add(T.light2);
  return T;
}
