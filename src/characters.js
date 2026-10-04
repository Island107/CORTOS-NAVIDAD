// Personajes estilo figura de juguete: Santa, el perrito, el niño (para el plano final) y el brazo en POV.
import * as THREE from 'three';
import { M, mesh, sphere, capsule, cyl, rbox, torus, sweep, lathe, wobble } from './geo.js';
import { knit, burlap, stripes, plain } from './textures.js';

const SKIN = '#f0c3a2';

function group(parent, pos = [0, 0, 0]) {
  const g = new THREE.Group();
  g.position.set(...pos);
  if (parent) parent.add(g);
  return g;
}

// ---------------------------------------------------------------- SANTA
export function makeSanta() {
  const red = M('#b8322f', { map: plain('#b8322f', 16, 21), rough: 0.95 });
  const redLeg = M('#a52b28', { rough: 0.95 });
  const fur = M('#e6dfd4', { map: plain('#e6dfd4', 22, 4), rough: 1 });
  const black = M('#2a2422', { rough: 0.7 });
  const gold = M('#d8a842', { rough: 0.45, metal: 0.35 });
  const skin = M(SKIN, { rough: 0.8 });
  const beardM = M('#e9e4dc', { map: plain('#e9e4dc', 30, 5), rough: 1 });
  const glove = M('#e2dbd0', { rough: 0.95 });

  const root = group(null);
  const hips = group(root, [0, 0.5, 0]);
  const legs = [];
  for (const s of [1, -1]) {
    const leg = group(hips, [s * 0.12, 0, 0]);
    mesh(capsule(0.088, 0.26), redLeg, leg, [0, -0.2, 0]);
    const boot = group(leg, [0, -0.4, 0]);
    mesh(cyl(0.092, 0.095, 0.13), black, boot, [0, 0.0, 0]);
    mesh(rbox(0.17, 0.09, 0.27, 0.04), black, boot, [0, -0.045, 0.045]);
    mesh(torus(0.095, 0.03, 10, 28), fur, boot, [0, 0.07, 0], [Math.PI / 2, 0, 0]);
    legs.push(leg);
  }
  const torso = group(hips, [0, 0, 0]);
  const bodyProf = [[0, -0.03], [0.26, -0.03], [0.32, 0.06], [0.35, 0.2], [0.34, 0.32], [0.29, 0.46], [0.2, 0.57], [0.1, 0.63], [0, 0.65]];
  mesh(lathe(bodyProf, 48), red, torso, [0, 0, 0]);
  mesh(torus(0.285, 0.05, 12, 48), fur, torso, [0, 0.0, 0], [Math.PI / 2, 0, 0]);
  mesh(cyl(0.356, 0.356, 0.075, 48), black, torso, [0, 0.2, 0]);
  mesh(rbox(0.13, 0.1, 0.03, 0.012), gold, torso, [0, 0.2, 0.36]);
  mesh(rbox(0.07, 0.045, 0.034, 0.008), black, torso, [0, 0.2, 0.362]);
  const rAt = (y) => { for (let i = 0; i < bodyProf.length - 1; i++) { const [r0, y0] = bodyProf[i], [r1, y1] = bodyProf[i + 1]; if (y >= y0 && y <= y1) return r0 + (r1 - r0) * (y - y0) / (y1 - y0); } return 0; };
  // franja de piel al frente (gajo del mismo perfil, un poco más grande)
  const stripProf = bodyProf.filter(([r, y]) => y > 0.0 && y < 0.6).map(([r, y]) => [r + 0.018, y]);
  const strip = new THREE.LatheGeometry(stripProf.map(([r, y]) => new THREE.Vector2(r, y)), 8, -0.16, 0.32);
  mesh(strip, fur, torso, [0, 0, 0], [0, 0, 0], 1, false);
  mesh(sphere(0.022), gold, torso, [0, 0.36, rAt(0.36) + 0.025]);
  mesh(sphere(0.022), gold, torso, [0, 0.48, rAt(0.48) + 0.022]);
  mesh(torus(0.13, 0.05, 12, 36), fur, torso, [0, 0.6, 0], [Math.PI / 2, 0, 0]);

  // brazos
  const arms = {};
  for (const [name, s] of [['L', 1], ['R', -1]]) {
    const sh = group(torso, [s * 0.27, 0.5, 0]);
    mesh(sphere(0.085), red, sh, [0, 0, 0]);
    mesh(capsule(0.074, 0.17), red, sh, [0, -0.13, 0]);
    const el = group(sh, [0, -0.27, 0]);
    mesh(capsule(0.068, 0.14), red, el, [0, -0.09, 0]);
    mesh(torus(0.066, 0.034, 10, 28), fur, el, [0, -0.2, 0], [Math.PI / 2, 0, 0]);
    const hand = group(el, [0, -0.27, 0]);
    mesh(sphere(0.066), glove, hand, [0, 0, 0], [0, 0, 0], [1, 1.12, 0.8]);
    mesh(capsule(0.025, 0.04), glove, hand, [s * -0.0 + 0.0, 0.01, 0.055], [0.6, 0, 0]);
    arms[name] = { sh, el, hand };
  }

  // cabeza
  const head = group(torso, [0, 0.64, 0]);
  const face = group(head, [0, 0, 0]);
  mesh(sphere(0.15), skin, face, [0, 0.14, 0]);
  mesh(sphere(0.034), skin, face, [0.148, 0.13, 0], [0, 0, 0], [0.5, 1, 0.8]);
  mesh(sphere(0.034), skin, face, [-0.148, 0.13, 0], [0, 0, 0], [0.5, 1, 0.8]);
  const beardG = wobble(sphere(0.15, 32, 24), 0.012, 28, 3);
  mesh(beardG, beardM, face, [0, 0.02, 0.04], [0, 0, 0], [1.08, 1.08, 0.85]);
  mesh(wobble(sphere(0.11, 24, 18), 0.01, 30, 5), beardM, face, [0, -0.08, 0.075], [0, 0, 0], [1.05, 1.2, 0.85]);
  for (const s of [1, -1]) {
    mesh(capsule(0.026, 0.05), beardM, face, [s * 0.042, 0.1, 0.158], [0, 0, s * 1.2]);
    mesh(sphere(0.034), M('#eaa48f', { rough: 0.85 }), face, [s * 0.078, 0.135, 0.118]);
  }
  mesh(sphere(0.036), M('#e8977e', { rough: 0.7 }), face, [0, 0.135, 0.158]);
  const eyes = [];
  for (const s of [1, -1]) {
    const e = group(face, [s * 0.05, 0.175, 0.132]);
    mesh(sphere(0.019, 16, 12), M('#1d1715', { rough: 0.35 }), e, [0, 0, 0], [0, 0, 0], [1, 1.15, 0.6], false);
    mesh(sphere(0.006, 8, 6), M('#ffffff', { rough: 0.3, emissive: '#ffffff', ei: 0.3 }), e, [0.006, 0.008, 0.012], [0, 0, 0], 1, false);
    mesh(capsule(0.012, 0.035), beardM, face, [s * 0.055, 0.212, 0.13], [0, 0, s * 1.35]);
    eyes.push(e);
  }
  // sombrero
  const hat = group(head, [0, 0.245, 0]);
  const hatG = sweep([[0, -0.02, 0], [0, 0.11, -0.02], [0, 0.19, -0.08], [0, 0.21, -0.18], [0, 0.16, -0.25]], (u) => 0.145 * (1 - u) + 0.022 * u, 28, 22, true);
  mesh(hatG, red, hat);
  mesh(torus(0.142, 0.04, 12, 40), fur, hat, [0, 0.0, 0], [Math.PI / 2, 0, 0]);
  mesh(wobble(sphere(0.05), 0.006, 40), fur, hat, [0, 0.165, -0.265]);

  // costal casi vacío (se arruga con ruido)
  const sack = group(null);
  const sackG = wobble(lathe([[0, -0.28], [0.12, -0.275], [0.17, -0.2], [0.16, -0.1], [0.11, -0.02], [0.05, 0.05], [0.035, 0.08], [0.07, 0.15], [0, 0.15]], 40), 0.03, 22, 2);
  const bur = M('#cfa874', { map: plain('#cfa874', 30, 17), rough: 1 });
  mesh(sackG, bur, sack, [0, 0, 0], [0, 0, 0], [1, 1, 0.62]);
  mesh(torus(0.05, 0.014, 8, 20), M('#7a2b20'), sack, [0, 0.06, 0], [Math.PI / 2, 0, 0]);

  return { root, hips, torso, head, face, hat, legs, arms, eyes, sack };
}

// ---------------------------------------------------------------- PERRITO
export function makeDog() {
  const tan = M('#d9b48a', { map: plain('#d9b48a', 18, 6), rough: 0.98 });
  const white = M('#f4ece0', { map: plain('#f4ece0', 16, 7), rough: 0.98 });
  const brown = M('#8a5634', { rough: 0.95 });
  const blackS = M('#171211', { rough: 0.35 });
  const root = group(null);
  // cuerpo echado, mirando a +z
  mesh(capsule(0.14, 0.3), tan, root, [0, 0.13, 0], [Math.PI / 2, 0, 0], [1.1, 1, 0.82]);
  mesh(sphere(0.11), white, root, [0, 0.11, 0.17], [0, 0, 0], [1, 0.95, 0.9]);
  mesh(sphere(0.1), brown, root, [0, 0.21, -0.05], [0, 0, 0], [1.25, 0.5, 1.6]);
  // patas
  for (const s of [1, -1]) {
    mesh(capsule(0.045, 0.14), tan, root, [s * 0.075, 0.045, 0.28], [Math.PI / 2, 0, 0]);
    mesh(sphere(0.05), white, root, [s * 0.075, 0.045, 0.37], [0, 0, 0], [1, 0.8, 1.15]);
    mesh(sphere(0.1), tan, root, [s * 0.11, 0.1, -0.2], [0, 0, 0], [0.7, 0.9, 1.2]);
    mesh(sphere(0.05), white, root, [s * 0.14, 0.04, -0.08], [0, 0, 0], [0.9, 0.7, 1.4]);
  }
  const tail = group(root, [0, 0.16, -0.32]);
  mesh(sweep([[0, 0, 0], [0, 0.05, -0.06], [0, 0.11, -0.09], [0, 0.17, -0.08]], (u) => 0.03 * (1 - u) + 0.016 * u, 16, 10), tan, tail);
  mesh(sphere(0.022), white, tail, [0, 0.17, -0.08]);

  const neck = group(root, [0, 0.2, 0.25]);
  const head = group(neck, [0, 0.03, 0.05]);
  mesh(sphere(0.12), tan, head, [0, 0, 0], [0, 0, 0], [1, 0.95, 1.05]);
  mesh(sphere(0.07), white, head, [0, -0.035, 0.1], [0, 0, 0], [1, 0.8, 1.25]);
  mesh(capsule(0.02, 0.1), white, head, [0, 0.07, 0.085], [1.2, 0, 0]);
  mesh(sphere(0.03), blackS, head, [0, -0.005, 0.185], [0, 0, 0], [1.2, 0.9, 1]);
  const tongue = mesh(rbox(0.04, 0.012, 0.06, 0.005), M('#e07a7a'), head, [0, -0.085, 0.14], [0.35, 0, 0], 1, false);
  const eyes = [];
  for (const s of [1, -1]) {
    const e = mesh(sphere(0.02, 16, 12), blackS, head, [s * 0.052, 0.04, 0.098], [0, 0, 0], [1, 1, 0.6], false);
    mesh(sphere(0.006, 8, 6), M('#ffffff', { emissive: '#ffffff', ei: 0.3 }), e, [0.25, 0.3, 0.8], [0, 0, 0], 1, false);
    eyes.push(e);
  }
  const ears = [];
  for (const s of [1, -1]) {
    const ear = group(head, [s * 0.1, 0.055, -0.01]);
    mesh(sphere(0.07), brown, ear, [s * 0.02, -0.07, 0], [0, 0, s * 0.2], [0.35, 1.25, 0.8]);
    ears.push(ear);
  }
  // collar con cascabel
  mesh(torus(0.085, 0.018, 8, 28), M('#c23b33'), neck, [0, 0.0, 0.0], [Math.PI / 2 - 0.4, 0, 0]);
  mesh(sphere(0.022), M('#d8a842', { rough: 0.4, metal: 0.4 }), neck, [0, -0.06, 0.07]);
  return { root, neck, head, tail, ears, eyes, tongue };
}

// ---------------------------------------------------------------- NIÑO (plano final)
export function makeKid() {
  const pj = M('#6f8fc9', { map: stripes('#6f8fc9', '#eef0f4', 8, true), rough: 0.95 });
  pj.map.repeat.set(2, 1);
  const skin = M(SKIN);
  const hair = M('#6b4029', { rough: 0.95 });
  const root = group(null);
  const hips = group(root, [0, 0.42, 0]);
  const legs = [];
  for (const s of [1, -1]) {
    const leg = group(hips, [s * 0.08, 0, 0]);
    mesh(capsule(0.07, 0.24), pj, leg, [0, -0.2, 0]);
    mesh(rbox(0.12, 0.08, 0.2, 0.035), M('#d65a4a'), leg, [0, -0.38, 0.03]);
    legs.push(leg);
  }
  const torso = group(hips, [0, 0, 0]);
  mesh(lathe([[0, -0.02], [0.17, -0.02], [0.2, 0.08], [0.19, 0.24], [0.15, 0.36], [0.07, 0.41], [0, 0.42]], 36), pj, torso);
  const arms = {};
  for (const [name, s] of [['L', 1], ['R', -1]]) {
    const sh = group(torso, [s * 0.17, 0.33, 0]);
    mesh(capsule(0.055, 0.17), pj, sh, [0, -0.12, 0]);
    const el = group(sh, [0, -0.24, 0]);
    mesh(capsule(0.05, 0.1), pj, el, [0, -0.06, 0]);
    mesh(sphere(0.05), skin, el, [0, -0.16, 0], [0, 0, 0], [0.9, 1.1, 0.7]);
    arms[name] = { sh, el };
  }
  const head = group(torso, [0, 0.42, 0]);
  mesh(sphere(0.16), skin, head, [0, 0.15, 0]);
  for (const s of [1, -1]) mesh(sphere(0.035), skin, head, [s * 0.158, 0.14, 0], [0, 0, 0], [0.5, 1, 0.8]);
  // pelo despeinado
  const hairG = wobble(new THREE.SphereGeometry(0.168, 28, 20, 0, Math.PI * 2, 0, Math.PI * 0.55), 0.015, 20, 7);
  mesh(hairG, hair, head, [0, 0.16, -0.008]);
  for (const [x, y, z, r] of [[0.05, 0.31, 0.04, 0.05], [-0.06, 0.3, -0.02, 0.05], [0.0, 0.32, -0.07, 0.045], [0.1, 0.27, -0.06, 0.04], [-0.1, 0.27, 0.05, 0.04], [0.02, 0.28, 0.12, 0.045]])
    mesh(sphere(r), hair, head, [x, y, z]);
  return { root, hips, torso, head, legs, arms };
}

// ---------------------------------------------------------------- BRAZO EN POV
export function makePovArm() {
  const pj = M('#6f8fc9', { map: stripes('#6f8fc9', '#eef0f4', 6, false), rough: 0.95, noCache: true });
  pj.map.repeat.set(1, 2);
  const skin = M(SKIN, { rough: 0.78, emissive: '#5a3a2a', ei: 0.35 });
  const sleeve = new THREE.Mesh(capsule(0.05, 1), pj); // se estira entre hombro y muñeca
  sleeve.castShadow = false;
  const cuff = mesh(cyl(0.056, 0.056, 0.035, 24), M('#e9ecf2'), null, [0, 0, 0], [0, 0, 0], 1, false);
  const hand = group(null);
  const palm = group(hand);
  mesh(rbox(0.075, 0.085, 0.032, 0.015), skin, palm, [0, 0.045, 0], [0, 0, 0], 1, false);
  const fingers = [];
  const fx = [-0.027, -0.009, 0.009, 0.027];
  const fl = [0.04, 0.048, 0.046, 0.036];
  for (let i = 0; i < 4; i++) {
    const f = group(palm, [fx[i], 0.087, 0]);
    mesh(capsule(0.0095, fl[i]), skin, f, [0, fl[i] / 2 + 0.006, 0], [0, 0, 0], 1, false);
    fingers.push(f);
  }
  const thumb = group(palm, [0.04, 0.03, 0.005]);
  mesh(capsule(0.011, 0.035), skin, thumb, [0.0, 0.022, 0], [0, 0, -0.6], 1, false);
  return { sleeve, cuff, hand, palm, fingers, thumb };
}

// ---------------------------------------------------------------- SANTA DE CABEZA (asomándose por la chimenea)
export function makeSantaPeek() {
  const s = makeSanta();
  // Usamos solo la cabeza y un brazo: el resto queda escondido dentro del tiro de la chimenea.
  return s;
}
