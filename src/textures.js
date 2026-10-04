// Texturas procedurales (canvas) — todo generado por código, nada de imágenes externas.
import * as THREE from 'three';

// PRNG determinista para que cada render sea idéntico.
export function rng(seed = 1) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function canvas(w, h = w) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return [c, c.getContext('2d')];
}

function tex(c, repeat = 1, srgb = true) {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat, repeat);
  t.anisotropy = 4;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// Ruido fino tipo papel/fieltro para que las superficies se vean mate y "hechas a mano".
function grain(ctx, w, h, amount, seed) {
  const r = rng(seed);
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (r() - 0.5) * amount;
    d[i] += n; d[i + 1] += n; d[i + 2] += n;
  }
  ctx.putImageData(img, 0, 0);
}

export function woodFloor(base = '#b07a4f') {
  const [c, x] = canvas(1024);
  const r = rng(7);
  const rows = 8;
  const ph = 1024 / rows;
  x.fillStyle = base; x.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < rows; i++) {
    let px = -((i % 2) * 300 + r() * 200);
    for (let k = 0; k < 4; k++) {
      const len = 420 + r() * 200;
      const l = 0.88 + r() * 0.2;
      const col = new THREE.Color(base).multiplyScalar(l);
      x.fillStyle = '#' + col.getHexString();
      x.fillRect(px, i * ph, len, ph);
      // vetas
      x.strokeStyle = 'rgba(60,30,10,0.10)';
      x.lineWidth = 2;
      for (let g = 0; g < 6; g++) {
        const yy = i * ph + 8 + r() * (ph - 16);
        x.beginPath();
        x.moveTo(px, yy);
        x.bezierCurveTo(px + len * 0.3, yy + (r() - 0.5) * 14, px + len * 0.6, yy + (r() - 0.5) * 14, px + len, yy);
        x.stroke();
      }
      x.fillStyle = 'rgba(40,20,8,0.3)';
      x.fillRect(px, i * ph, 2, ph);
      px += len;
    }
    x.fillStyle = 'rgba(40,20,8,0.5)';
    x.fillRect(0, i * ph, 1024, 3);
  }
  grain(x, 1024, 1024, 10, 3);
  return tex(c);
}

export function wallpaperStars(bg = '#a9c3d8', fg = '#f4e6b8') {
  const [c, x] = canvas(512);
  x.fillStyle = bg; x.fillRect(0, 0, 512, 512);
  const r = rng(11);
  const star = (cx, cy, rad, rot) => {
    x.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = rot + (i * Math.PI) / 5;
      const rr = i % 2 ? rad * 0.45 : rad;
      x.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
    }
    x.closePath(); x.fill();
  };
  x.fillStyle = fg;
  const pts = [[64, 64], [320, 64], [192, 192], [448, 192], [64, 320], [320, 320], [192, 448], [448, 448]];
  for (const [px, py] of pts) star(px, py, 22 + r() * 8, r() * 6);
  x.fillStyle = 'rgba(255,255,255,0.55)';
  for (let i = 0; i < 40; i++) { x.beginPath(); x.arc(r() * 512, r() * 512, 3, 0, 7); x.fill(); }
  grain(x, 512, 512, 8, 5);
  return tex(c);
}

export function wallpaperStripes(a = '#efe3cf', b = '#e6d5bb') {
  const [c, x] = canvas(512);
  x.fillStyle = a; x.fillRect(0, 0, 512, 512);
  x.fillStyle = b;
  for (let i = 0; i < 8; i++) x.fillRect(i * 64, 0, 26, 512);
  x.fillStyle = 'rgba(190,120,90,0.25)';
  for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) {
    x.beginPath(); x.arc(i * 64 + 45, j * 64 + 32, 4, 0, 7); x.fill();
  }
  grain(x, 512, 512, 8, 9);
  return tex(c);
}

export function plain(color, amount = 10, seed = 1) {
  const [c, x] = canvas(256);
  x.fillStyle = color; x.fillRect(0, 0, 256, 256);
  grain(x, 256, 256, amount, seed);
  return tex(c);
}

export function brick(base = '#c9b8a6', mortar = '#e9dfd2') {
  const [c, x] = canvas(512);
  x.fillStyle = mortar; x.fillRect(0, 0, 512, 512);
  const r = rng(21);
  const bh = 512 / 8, bw = 512 / 4;
  for (let j = 0; j < 8; j++) for (let i = -1; i < 5; i++) {
    const ox = (j % 2) * bw * 0.5;
    const col = new THREE.Color(base).multiplyScalar(0.85 + r() * 0.25);
    x.fillStyle = '#' + col.getHexString();
    x.beginPath();
    x.roundRect(i * bw + ox + 4, j * bh + 4, bw - 8, bh - 8, 6);
    x.fill();
  }
  grain(x, 512, 512, 14, 4);
  return tex(c);
}

export function quilt() {
  const [c, x] = canvas(512);
  const cols = ['#e86f5a', '#f2c46d', '#7fb3a6', '#f4efe4', '#5d84b8', '#e9a6a0'];
  const r = rng(31);
  const n = 4, s = 512 / n;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    x.fillStyle = cols[Math.floor(r() * cols.length)];
    x.fillRect(i * s, j * s, s, s);
    x.fillStyle = 'rgba(255,255,255,0.35)';
    if ((i + j) % 2 === 0) {
      for (let k = 0; k < 4; k++) { x.beginPath(); x.arc(i * s + s * (0.25 + 0.5 * (k % 2)), j * s + s * (0.25 + 0.5 * (k >> 1)), s * 0.1, 0, 7); x.fill(); }
    } else {
      for (let k = 0; k < 4; k++) x.fillRect(i * s, j * s + k * s / 4 + 8, s, 10);
    }
    // costura
    x.setLineDash([8, 7]);
    x.strokeStyle = 'rgba(255,255,255,0.7)'; x.lineWidth = 3;
    x.strokeRect(i * s + 7, j * s + 7, s - 14, s - 14);
    x.setLineDash([]);
  }
  grain(x, 512, 512, 12, 8);
  return tex(c);
}

export function rugRound(c1 = '#c9553f', c2 = '#f1e2c6', c3 = '#2f6b5a') {
  const [c, x] = canvas(1024);
  const rings = [c1, c2, c3, c2, c1, c2, c3, c2];
  for (let i = 0; i < rings.length; i++) {
    x.fillStyle = rings[i];
    x.beginPath(); x.arc(512, 512, 512 - i * 58, 0, 7); x.fill();
  }
  x.fillStyle = c1;
  for (let k = 0; k < 16; k++) {
    const a = (k / 16) * Math.PI * 2;
    x.beginPath(); x.arc(512 + Math.cos(a) * 300, 512 + Math.sin(a) * 300, 18, 0, 7); x.fill();
  }
  grain(x, 1024, 1024, 22, 2);
  const t = tex(c); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; return t;
}

export function stripes(a = '#6f8fc9', b = '#f1ede4', n = 8, vertical = false) {
  const [c, x] = canvas(256);
  x.fillStyle = a; x.fillRect(0, 0, 256, 256);
  x.fillStyle = b;
  for (let i = 0; i < n; i++) {
    if (vertical) x.fillRect(i * 256 / n, 0, 256 / n / 2.4, 256);
    else x.fillRect(0, i * 256 / n, 256, 256 / n / 2.4);
  }
  grain(x, 256, 256, 10, 6);
  return tex(c);
}

export function plaid(a = '#b8322f', b = '#24453a') {
  const [c, x] = canvas(256);
  x.fillStyle = a; x.fillRect(0, 0, 256, 256);
  x.fillStyle = b; x.globalAlpha = 0.55;
  for (let i = 0; i < 4; i++) { x.fillRect(i * 64 + 10, 0, 18, 256); x.fillRect(0, i * 64 + 10, 256, 18); }
  x.globalAlpha = 0.5; x.fillStyle = '#f1d27a';
  for (let i = 0; i < 4; i++) { x.fillRect(i * 64 + 44, 0, 4, 256); x.fillRect(0, i * 64 + 44, 256, 4); }
  x.globalAlpha = 1;
  grain(x, 256, 256, 14, 12);
  return tex(c);
}

export function knit(color = '#b8322f') {
  const [c, x] = canvas(128);
  x.fillStyle = color; x.fillRect(0, 0, 128, 128);
  x.strokeStyle = 'rgba(0,0,0,0.18)'; x.lineWidth = 3;
  for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) {
    x.beginPath(); x.moveTo(i * 16, j * 16); x.lineTo(i * 16 + 8, j * 16 + 14); x.lineTo(i * 16 + 16, j * 16); x.stroke();
  }
  grain(x, 128, 128, 16, 13);
  return tex(c);
}

export function burlap() {
  const [c, x] = canvas(256);
  x.fillStyle = '#a7834f'; x.fillRect(0, 0, 256, 256);
  x.strokeStyle = 'rgba(70,45,15,0.35)'; x.lineWidth = 2;
  for (let i = 0; i < 64; i++) {
    x.beginPath(); x.moveTo(i * 4, 0); x.lineTo(i * 4, 256); x.stroke();
    x.beginPath(); x.moveTo(0, i * 4); x.lineTo(256, i * 4); x.stroke();
  }
  grain(x, 256, 256, 26, 14);
  return tex(c);
}

export function nightSky() {
  const [c, x] = canvas(512, 512);
  const g = x.createLinearGradient(0, 0, 0, 512);
  g.addColorStop(0, '#1d2547'); g.addColorStop(1, '#4a5a8c');
  x.fillStyle = g; x.fillRect(0, 0, 512, 512);
  const r = rng(41);
  x.fillStyle = '#fff';
  for (let i = 0; i < 70; i++) { x.globalAlpha = 0.4 + r() * 0.6; x.beginPath(); x.arc(r() * 512, r() * 512, 1 + r() * 2.5, 0, 7); x.fill(); }
  x.globalAlpha = 1;
  // luna
  x.fillStyle = '#fff6d8';
  x.shadowColor = '#fff2c0'; x.shadowBlur = 40;
  x.beginPath(); x.arc(370, 140, 46, 0, 7); x.fill();
  x.shadowBlur = 0;
  // colinas nevadas
  x.fillStyle = '#dfe7f4';
  x.beginPath(); x.moveTo(0, 430); x.quadraticCurveTo(140, 360, 280, 420); x.quadraticCurveTo(400, 380, 512, 410); x.lineTo(512, 512); x.lineTo(0, 512); x.fill();
  x.fillStyle = '#2c4a46';
  for (const [tx, ty] of [[80, 405], [120, 395], [420, 400]]) { x.beginPath(); x.moveTo(tx, ty - 50); x.lineTo(tx - 16, ty); x.lineTo(tx + 16, ty); x.fill(); }
  const t = tex(c); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; return t;
}

export function glow() {
  const [c, x] = canvas(128);
  const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.2, 'rgba(255,255,255,0.55)');
  g.addColorStop(0.5, 'rgba(255,255,255,0.12)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export function smoke() {
  const [c, x] = canvas(128);
  const r = rng(51);
  for (let i = 0; i < 14; i++) {
    const cx = 40 + r() * 48, cy = 40 + r() * 48, rad = 18 + r() * 22;
    const g = x.createRadialGradient(cx, cy, 0, cx, cy, rad);
    g.addColorStop(0, 'rgba(255,255,255,0.35)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g; x.fillRect(0, 0, 128, 128);
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export function textCard(lines, opts = {}) {
  const w = opts.w || 1024, h = opts.h || 512;
  const [c, x] = canvas(w, h);
  x.clearRect(0, 0, w, h);
  x.textAlign = 'center';
  x.textBaseline = 'middle';
  lines.forEach((ln, i) => {
    x.font = ln.font;
    x.fillStyle = ln.color || '#fff';
    x.shadowColor = 'rgba(40,20,60,0.45)'; x.shadowBlur = 18;
    x.fillText(ln.text, w / 2, ln.y);
  });
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

// Escala las UV de una BoxGeometry a metros reales para que las texturas no se estiren.
export function worldUV(geo, w, h, d, tile = 1) {
  const uv = geo.attributes.uv;
  const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let v = 0; v < 4; v++) {
    const i = f * 4 + v;
    uv.setXY(i, uv.getX(i) * dims[f][0] / tile, uv.getY(i) * dims[f][1] / tile);
  }
  uv.needsUpdate = true;
  return geo;
}
