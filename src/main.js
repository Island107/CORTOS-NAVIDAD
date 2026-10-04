// "La visita" — corto navideño en POV, estilo diorama en miniatura. 30 s, 1080×1920.
// Todo el render es determinista: renderFrame(t) dibuja exactamente el instante t.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { buildHouse, Y1, TOP, CEIL, STAIR, stairFloorY, addGlow } from './house.js';
import { buildBedroom, buildLiving, blob, starShape } from './props.js';
import { makeSanta, makeDog, makeKid, makePovArm } from './characters.js';
import { M, mesh, box, sphere, capsule, cyl, rbox, torus, sweep, track, smooth, smoother, clamp, lerp, pulse, easeOutBack } from './geo.js';
import * as TX from './textures.js';

const W = 1080, H = 1920;
export const DURATION = 30;

// ------------------------------------------------------------------ renderer
const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(1);
renderer.setSize(W, H);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
// luz rebotada suave de estudio (IBL)
{
  const pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.12;
  scene.environmentRotation = new THREE.Euler(0, 0.6, 0);
}
const camera = new THREE.PerspectiveCamera(62, W / H, 0.03, 300);
scene.add(camera);

// ------------------------------------------------------------------ estudio (fondo infinito)
const skyU = { top: { value: new THREE.Color('#262a47') }, mid: { value: new THREE.Color('#58547a') }, bot: { value: new THREE.Color('#857b98') } };
const backdrop = new THREE.Mesh(new THREE.SphereGeometry(150, 48, 24), new THREE.ShaderMaterial({
  side: THREE.BackSide, depthWrite: false, uniforms: skyU,
  vertexShader: `varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0);} `,
  fragmentShader: `uniform vec3 top, mid, bot; varying vec3 vP;
    void main(){ float h = vP.y; vec3 c = mix(bot, mid, smoothstep(-0.05, 0.12, h)); c = mix(c, top, smoothstep(0.12, 0.7, h)); gl_FragColor = vec4(c,1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    }`,
}));
backdrop.renderOrder = -10;
scene.add(backdrop);
const floorMat = new THREE.MeshStandardMaterial({ color: '#8a80a0', roughness: 1 });
const studioFloor = new THREE.Mesh(new THREE.CircleGeometry(140, 64), floorMat);
studioFloor.rotation.x = -Math.PI / 2;
studioFloor.position.y = -0.36;
studioFloor.receiveShadow = true;
scene.add(studioFloor);
scene.fog = new THREE.Fog('#857b98', 34, 120);

// ------------------------------------------------------------------ luces
const hemi = new THREE.HemisphereLight('#d9cfe6', '#8a6450', 0.6);
scene.add(hemi);
const key = new THREE.DirectionalLight('#dfe2ff', 1.2);
key.position.set(-7, 14, 10);
key.target.position.set(-0.6, 1.5, 0);
scene.add(key, key.target);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
Object.assign(key.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8, near: 1, far: 45 });
key.shadow.bias = -0.0004;
key.shadow.normalBias = 0.02;
key.shadow.radius = 10;
key.shadow.blurSamples = 16;

const moon = new THREE.SpotLight('#9fb4ff', 0, 14, 0.42, 0.7, 1.2);
moon.position.set(0.7, Y1 + 3.2, -6.5);
moon.target.position.set(1.6, Y1, 0.9);
moon.castShadow = true;
moon.shadow.mapSize.set(1024, 1024);
moon.shadow.bias = -0.0005;
moon.shadow.radius = 6;
moon.shadow.blurSamples = 12;
scene.add(moon, moon.target);

// ------------------------------------------------------------------ casa y utilería
const HS = buildHouse(scene);
const house = HS.house;
// pecho de chimenea en la recámara + chimenea exterior
{
  const brickR = M('#ffffff', { map: TX.brick('#b9624a', '#e6d2c0'), rough: 0.95 });
  brickR.map.repeat.set(1 / 0.6, 1 / 0.6);
  const pBedC = M('#ffffff', { map: TX.wallpaperStars('#9fbdd6', '#f6e7b5'), rough: 0.95 });
  pBedC.map.repeat.set(1 / 0.75, 1 / 0.75);
  box(house, -1.0, 0.4, Y1, TOP, -2.44, -1.8, [pBedC, pBedC, M('#f6ece0'), pBedC, pBedC, pBedC], 1);
  box(house, -0.85, 0.25, TOP - 0.2, TOP + 0.85, -2.66, -1.86, brickR, 1);
  mesh(rbox(1.26, 0.1, 0.96, 0.03), M('#8e4a3a'), house, [-0.3, TOP + 0.88, -2.26]);
  mesh(new THREE.BoxGeometry(0.7, 0.02, 0.45), M('#1a1414'), house, [-0.3, TOP + 0.94, -2.26], [0, 0, 0], 1, false);
  // nieve sobre la chimenea
  mesh(rbox(1.2, 0.06, 0.9, 0.03), M('#f4f6fb'), house, [-0.3, TOP + 0.96, -2.26]);
}
const BR = buildBedroom(house, HS);
const LV = buildLiving(house, HS);

// exterior: pinitos nevados y muñeco de nieve sobre la base
function pine(x, z, s) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(s); house.add(g);
  mesh(cyl(0.05, 0.06, 0.25, 10), M('#6b4429'), g, [0, 0.12, 0]);
  for (let i = 0; i < 3; i++) {
    mesh(new THREE.ConeGeometry(0.42 - i * 0.11, 0.5, 20), M('#2f6a4c', { rough: 1 }), g, [0, 0.4 + i * 0.28, 0]);
    mesh(new THREE.ConeGeometry(0.3 - i * 0.08, 0.2, 20), M('#f4f6fb', { rough: 1 }), g, [0, 0.58 + i * 0.28, 0]);
  }
}
pine(-4.55, 3.6, 1.0); pine(-4.2, -2.9, 1.25); pine(3.15, -2.95, 1.1); pine(3.25, 3.7, 0.8);
{
  const sm = new THREE.Group(); sm.position.set(2.2, 0, 3.55); house.add(sm);
  const sn = M('#f6f8fc', { rough: 1 });
  mesh(sphere(0.26), sn, sm, [0, 0.24, 0]); mesh(sphere(0.19), sn, sm, [0, 0.58, 0]); mesh(sphere(0.13), sn, sm, [0, 0.84, 0]);
  mesh(new THREE.ConeGeometry(0.03, 0.14, 12), M('#e8833a'), sm, [0, 0.84, 0.17], [Math.PI / 2, 0, 0]);
  for (const s of [-1, 1]) mesh(sphere(0.018), M('#1d1715'), sm, [s * 0.045, 0.88, 0.115]);
  mesh(torus(0.14, 0.04, 8, 24), M('#c0392b'), sm, [0, 0.72, 0], [Math.PI / 2, 0, 0]);
  mesh(cyl(0.09, 0.09, 0.14, 20), M('#2a2422'), sm, [0, 1.0, 0]);
  mesh(cyl(0.14, 0.14, 0.02, 20), M('#2a2422'), sm, [0, 0.93, 0]);
}
// camino de piedras al frente
for (let i = 0; i < 5; i++) mesh(cyl(0.2, 0.2, 0.03, 18), M('#c9c2bd'), house, [-3.2 + (i % 2) * 0.15, 0.01, 2.85 + i * 0.32], [0, 0, 0], [1, 1, 0.7]);

// ------------------------------------------------------------------ luces interiores
const lampLight = new THREE.PointLight('#ffb766', 0, 7, 2);
lampLight.position.copy(BR.lampWorld).add(new THREE.Vector3(-0.05, -0.05, 0.05));
lampLight.castShadow = true;
lampLight.shadow.mapSize.set(512, 512);
lampLight.shadow.bias = -0.002;
lampLight.shadow.radius = 8;
lampLight.shadow.blurSamples = 12;
scene.add(lampLight);
const bedFill = new THREE.PointLight('#ffcf9a', 0, 8, 2);
bedFill.position.set(0, Y1 + 2.0, 0.2);
scene.add(bedFill);
LV.floorLight.castShadow = true;
LV.floorLight.shadow.mapSize.set(512, 512);
LV.floorLight.shadow.bias = -0.002;
LV.floorLight.shadow.radius = 10;
LV.floorLight.shadow.blurSamples = 12;
const livingFill = new THREE.PointLight('#ffd2a0', 0.0, 9, 2);
livingFill.position.set(-0.6, 1.2, 1.2);
scene.add(livingFill);

// ------------------------------------------------------------------ personajes
const santa = makeSanta();
scene.add(santa.root);
const SANTA0 = new THREE.Vector3(1.3, 0, -0.55);
santa.root.position.copy(SANTA0);
const santaBlob = blob(scene, 0, 0, 0, 0.95, 0.95, 0.45);

const sack = santa.sack;
scene.add(sack);

const dog = makeDog();
dog.root.position.set(2.04, 0.5, -0.04);
dog.root.rotation.y = Math.PI + 0.5;
scene.add(dog.root);

const peek = makeSanta();
scene.add(peek.root);
for (const c of peek.torso.children) if (c.isMesh) c.visible = false;
for (const l of peek.legs) l.visible = false;
peek.arms.L.sh.visible = false;
peek.root.rotation.z = Math.PI;
peek.root.position.set(-0.3, 3.0, -2.08);
peek.root.visible = false;

const kid = makeKid();
scene.add(kid.root);
kid.root.visible = false;
const kidBlob = blob(scene, 0, 0, 0, 0.6, 0.6, 0.4);

const arm = makePovArm();
camera.add(arm.sleeve, arm.cuff, arm.hand);

// trineo para el final
const sleigh = new THREE.Group();
scene.add(sleigh);
{
  const red = M('#b8322f', { rough: 0.7 });
  const gold = M('#d8a842', { rough: 0.4, metal: 0.4 });
  const body = new THREE.Group(); sleigh.add(body);
  mesh(rbox(0.7, 0.3, 0.42, 0.1), red, body, [0, 0.25, 0]);
  mesh(rbox(0.2, 0.42, 0.42, 0.08), red, body, [-0.3, 0.38, 0]);
  for (const s of [-1, 1]) mesh(sweep([[-0.45, 0.05, s * 0.17], [0.2, 0.0, s * 0.17], [0.42, 0.06, s * 0.17], [0.46, 0.18, s * 0.17], [0.38, 0.22, s * 0.17]], () => 0.018, 24, 8), gold, body);
  mesh(rbox(0.3, 0.16, 0.36, 0.06), M('#a7834f', { map: TX.burlap() }), body, [-0.1, 0.46, 0]);
  const mini = makeSanta();
  mini.root.scale.setScalar(0.32);
  mini.root.position.set(0.05, 0.22, 0);
  mini.root.rotation.y = Math.PI / 2;
  mini.arms.R.sh.rotation.z = -2.5;
  body.add(mini.root);
  sleigh.userData.miniArm = mini.arms.R;
  const deer = (x, nose) => {
    const d = new THREE.Group(); d.position.set(x, 0.25, 0); sleigh.add(d);
    const fur = M('#8a5a3a', { rough: 1 });
    mesh(capsule(0.08, 0.2), fur, d, [0, 0.12, 0], [0, 0, Math.PI / 2]);
    mesh(capsule(0.035, 0.12), fur, d, [0.14, 0.22, 0], [0, 0, -0.6]);
    mesh(sphere(0.06), fur, d, [0.2, 0.3, 0], [0, 0, 0], [1.3, 0.9, 0.9]);
    mesh(sphere(0.022), M(nose ? '#ff3b2f' : '#2a1a12', nose ? { emissive: '#ff2a1f', ei: 1.2 } : {}), d, [0.28, 0.3, 0]);
    for (const s of [-1, 1]) {
      mesh(sweep([[0.18, 0.34, s * 0.03], [0.17, 0.42, s * 0.06], [0.14, 0.47, s * 0.1]], () => 0.009, 8, 6), M('#d9c4a3'), d);
      for (const xx of [-0.1, 0.1]) mesh(capsule(0.02, 0.1), fur, d, [xx, 0.0, s * 0.05], [0, 0, xx > 0 ? 0.6 : -0.6]);
    }
    if (nose) sleigh.userData.nose = addGlow(d, [0.29, 0.3, 0], 0.25, '#ff4a3a', 0.9);
    return d;
  };
  sleigh.userData.deer = [deer(0.75, false), deer(1.15, true)];
  mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0.35, 0.35, 0), new THREE.Vector3(0.75, 0.42, 0), new THREE.Vector3(1.15, 0.42, 0)]), 12, 0.006, 6), M('#d8a842'), sleigh);
  sleigh.visible = false;
}

// ------------------------------------------------------------------ partículas (hollín, chispas mágicas, nieve)
const smokeTex = TX.smoke();
const glowTex = TX.glow();
const puffs = [];
for (let i = 0; i < 9; i++) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: smokeTex, color: '#5e5753', transparent: true, opacity: 0, depthWrite: false }));
  scene.add(s); puffs.push(s);
}
const sparkles = [];
for (let i = 0; i < 40; i++) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: i % 3 ? '#ffd77a' : '#ffffff', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
  scene.add(s); sparkles.push(s);
}
const trail = [];
for (let i = 0; i < 70; i++) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: i % 4 ? '#ffe2a0' : '#ffffff', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
  scene.add(s); trail.push(s);
}
const snowN = 900;
const snowGeo = new THREE.BufferGeometry();
const snowBase = new Float32Array(snowN * 4);
{
  const r = TX.rng(5);
  for (let i = 0; i < snowN; i++) { snowBase[i * 4] = -16 + r() * 30; snowBase[i * 4 + 1] = r() * 22; snowBase[i * 4 + 2] = -10 + r() * 24; snowBase[i * 4 + 3] = r(); }
  snowGeo.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(snowN * 3), 3));
}
const snowMat = new THREE.PointsMaterial({ map: glowTex, color: '#ffffff', size: 0.13, transparent: true, opacity: 0, depthWrite: false, sizeAttenuation: true });
const snow = new THREE.Points(snowGeo, snowMat);
snow.frustumCulled = false;
scene.add(snow);

// normales degeneradas (puntas de tornos) → evita NaN en el sombreado
{
  const seen = new Set();
  scene.traverse(o => {
    if (!o.isMesh || seen.has(o.geometry)) return;
    seen.add(o.geometry);
    const n = o.geometry.attributes.normal; if (!n) return;
    for (let i = 0; i < n.count; i++) {
      const x = n.getX(i), y = n.getY(i), z = n.getZ(i), l = Math.hypot(x, y, z);
      if (!(l > 1e-5)) n.setXYZ(i, 0, 1, 0); else if (Math.abs(l - 1) > 1e-3) n.setXYZ(i, x / l, y / l, z / l);
    }
    n.needsUpdate = true;
  });
}
// ------------------------------------------------------------------ post-proceso
const rt = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, samples: 4 });
const composer = new EffectComposer(renderer, rt);
composer.setPixelRatio(1);
composer.setSize(W, H);
composer.addPass(new RenderPass(scene, camera));
const sanitize = new ShaderPass({
  uniforms: { tDiffuse: { value: null } },
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0);} `,
  fragmentShader: `uniform sampler2D tDiffuse; varying vec2 vUv;
    void main(){ vec4 c = texture2D(tDiffuse, vUv);
      if (!(c.r == c.r) || !(c.g == c.g) || !(c.b == c.b)) c = vec4(0.0, 0.0, 0.0, 1.0);
      gl_FragColor = vec4(min(c.rgb, vec3(40.0)), c.a); }`,
});
const gtao = new GTAOPass(scene, camera, W, H);
gtao.output = GTAOPass.OUTPUT.Default;
gtao.blendIntensity = 0.85;
gtao.updateGtaoMaterial({ radius: 0.45, distanceExponent: 1.4, thickness: 1.5, scale: 1.0, samples: 12, screenSpaceRadius: false });
gtao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, rings: 2, samples: 12 });
{
  const orig = gtao.render.bind(gtao);
  const hidden = [];
  gtao.render = (...a) => {
    scene.traverseVisible(o => { if (o.isSprite || o.isPoints || (o.material && o.material.transparent)) hidden.push(o); });
    hidden.forEach(o => (o.visible = false));
    orig(...a);
    hidden.forEach(o => (o.visible = true));
    hidden.length = 0;
  };
}
composer.addPass(gtao);
composer.addPass(sanitize);
const bokeh = new BokehPass(scene, camera, { focus: 4.5, aperture: 0.0035, maxblur: 0.006 });
composer.addPass(bokeh);
const bloom = new UnrealBloomPass(new THREE.Vector2(W / 2, H / 2), 0.5, 0.55, 1.15);
composer.addPass(bloom);
composer.addPass(new OutputPass());

const textCanvas = document.createElement('canvas');
textCanvas.width = W; textCanvas.height = H;
{
  const x = textCanvas.getContext('2d');
  x.textAlign = 'center'; x.textBaseline = 'middle';
  x.shadowColor = 'rgba(30,15,50,0.55)'; x.shadowBlur = 24;
  x.fillStyle = '#fff7ea';
  x.font = 'italic 120px "DejaVu Serif", "FreeSerif", serif';
  x.fillText('¡Feliz Navidad!', W / 2, H * 0.83);
  x.font = '40px "DejaVu Sans", sans-serif';
  x.fillStyle = 'rgba(255,247,234,0.85)';
  x.fillText('la magia ocurre en casa', W / 2, H * 0.83 + 100);
}
const textTex = new THREE.CanvasTexture(textCanvas);
textTex.colorSpace = THREE.SRGBColorSpace;
const finish = new ShaderPass({
  uniforms: { tDiffuse: { value: null }, tText: { value: textTex }, lid: { value: 1 }, blur: { value: 0 }, textA: { value: 0 }, fade: { value: 0 }, time: { value: 0 }, vig: { value: 1 } },
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0);} `,
  fragmentShader: `
    uniform sampler2D tDiffuse, tText; uniform float lid, blur, textA, fade, time, vig; varying vec2 vUv;
    float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)))*43758.5453); }
    void main(){
      vec4 c = texture2D(tDiffuse, vUv);
      if (blur > 0.001) {
        vec4 acc = c; float b = blur*0.012;
        for (int i=0;i<8;i++){ float a = float(i)*0.785398; acc += texture2D(tDiffuse, vUv + vec2(cos(a), sin(a)*0.5625)*b); acc += texture2D(tDiffuse, vUv + vec2(cos(a+0.39), sin(a+0.39)*0.5625)*b*0.5); }
        c = acc/17.0;
      }
      vec2 d = (vUv - 0.5) * vec2(1.0, 1.25);
      float v = smoothstep(0.95, 0.35, length(d));
      c.rgb *= mix(1.0, 0.55 + 0.45*v, vig);
      c.rgb += (hash(vUv*vec2(1080.0,1920.0) + fract(time*7.31)*91.0) - 0.5) * 0.028;
      vec4 tx = texture2D(tText, vUv);
      c.rgb = mix(c.rgb, tx.rgb, tx.a*textA);
      // párpados al despertar
      float yy = abs(vUv.y - 0.5) * 2.0;
      float curve = 0.10 * (1.0 - pow((vUv.x - 0.5) * 2.0, 2.0));
      float open = lid * 1.25;
      float m = smoothstep(open + curve + 0.06, open + curve - 0.06, yy);
      c.rgb *= m;
      c.rgb *= 1.0 - fade;
      gl_FragColor = c;
    }`,
});
composer.addPass(finish);

// ------------------------------------------------------------------ cámara (keyframes)
const camKeys = [
  { t: 0.0, p: [2.12, Y1 + 0.7, 1.9], l: [1.55, Y1 + 0.75, -0.2], r: -1.15 },
  { t: 1.6, p: [2.1, Y1 + 0.71, 1.88], l: [1.5, Y1 + 0.78, -0.2], r: -1.08 },
  { t: 2.55, p: [2.02, Y1 + 1.1, 1.5], l: [2.1, Y1 + 0.62, 0.35], r: 0.0 },
  { t: 3.7, p: [2.03, Y1 + 1.09, 1.42], l: [2.12, Y1 + 0.72, 0.45], r: 0.0 },
  { t: 4.55, p: [1.98, Y1 + 1.1, 1.38], l: [0.4, Y1 + 0.95, -1.9], r: 0.02 },
  { t: 5.25, p: [1.6, Y1 + 1.0, 0.75], l: [-1.6, Y1 + 0.95, -1.4], r: 0.0 },
  { t: 6.95, p: [-1.62, Y1 + 1.0, -1.55], l: [-2.6, Y1 + 0.95, -1.88], r: 0.0 },
  { t: 7.4, p: [-1.68, Y1 + 1.0, -1.6], l: [-2.6, Y1 + 0.95, -1.9], r: 0.0, hold: true },
  { t: 7.95, p: [-1.45, Y1 + 1.0, -1.42], l: [-2.6, Y1 + 0.98, -1.95], r: 0.0 },
  { t: 8.55, p: [-2.45, Y1 + 1.0, -1.86], l: [-3.4, Y1 + 0.85, -1.2], r: 0.0 },
  { t: 9.15, p: [-3.36, Y1 + 1.0, -1.8], l: [-3.38, Y1 + 0.15, 0.6], r: 0.0 },
  { t: 12.0, p: [-3.38, 1.0, 1.82], l: [-3.3, 0.95, 4.2], r: 0.0, stairs: true },
  { t: 12.6, p: [-3.12, 1.0, 2.25], l: [0.0, 1.0, 2.3], r: 0.0 },
  { t: 13.35, p: [-2.8, 0.97, 2.3], l: [1.0, 0.85, 0.75], r: 0.07 },
  { t: 14.2, p: [-2.05, 0.97, 1.62], l: [1.45, 0.8, -0.6], r: 0.02 },
  { t: 17.6, p: [-2.0, 0.98, 1.58], l: [1.3, 0.8, -0.65], r: 0.0 },
  { t: 20.1, p: [-2.25, 1.0, 1.7], l: [-0.15, 0.85, -1.4], r: 0.0 },
  { t: 22.5, p: [-1.4, 1.0, 0.72], l: [-0.3, 0.72, -1.95], r: 0.0 },
  { t: 25.05, p: [-1.22, 0.98, 0.5], l: [-0.3, 0.74, -1.95], r: 0.0, hold: true },
  { t: 26.2, p: [-1.9, 2.0, 2.6], l: [-0.6, 1.3, -1.0], r: 0.0 },
  { t: 28.6, p: [-7.4, 7.2, 17.6], l: [-0.55, 1.95, 0.0], r: 0.0 },
  { t: 30.0, p: [-7.1, 7.0, 17.0], l: [-0.55, 2.0, 0.0], r: 0.0 },
];
const camP = track(camKeys.map(k => ({ t: k.t, v: k.p, hold: k.hold })));
const camL = track(camKeys.map(k => ({ t: k.t, v: k.l, hold: k.hold })));
const camR = track(camKeys.map(k => ({ t: k.t, v: k.r, hold: k.hold })));
const camFov = track([{ t: 0, v: 58 }, { t: 13.3, v: 58 }, { t: 14.2, v: 50 }, { t: 25.1, v: 52 }, { t: 28.4, v: 43 }, { t: 30, v: 42 }]);

// ------------------------------------------------------------------ helpers de animación
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const tmpV = new THREE.Vector3(), tmpQ = new THREE.Quaternion();
const DOWN = V(0, -1, 0);

// IK de dos huesos para los brazos de Santa (hombro → codo → mano, 0.27 + 0.27).
function armIK(a, targetWorld, pole = V(0, 0, -1), a1 = 0.27, a2 = 0.27) {
  const parent = a.sh.parent;
  parent.updateWorldMatrix(true, false);
  const T = parent.worldToLocal(targetWorld.clone());
  const S = a.sh.position.clone();
  const d = T.clone().sub(S);
  let L = d.length();
  L = Math.min(L, (a1 + a2) * 0.999);
  const dir = d.normalize();
  const cosA = clamp((a1 * a1 + L * L - a2 * a2) / (2 * a1 * L), -1, 1);
  const A = Math.acos(cosA);
  const pp = pole.clone().sub(dir.clone().multiplyScalar(pole.dot(dir))).normalize();
  const u = dir.clone().multiplyScalar(Math.cos(A)).add(pp.multiplyScalar(Math.sin(A))).normalize();
  a.sh.quaternion.setFromUnitVectors(DOWN, u);
  const elbowPos = S.clone().add(u.clone().multiplyScalar(a1));
  const handPos = S.clone().add(dir.clone().multiplyScalar(L));
  const f = handPos.sub(elbowPos).normalize();
  const fl = f.applyQuaternion(a.sh.quaternion.clone().invert());
  a.el.quaternion.setFromUnitVectors(DOWN, fl);
}
function armRest(a, side, swing = 0, out = 0.12) {
  a.sh.quaternion.identity();
  a.sh.rotation.set(swing, 0, side * out);
  a.el.rotation.set(-0.25 - Math.max(0, -swing) * 0.3, 0, 0);
}
function lerpQ(obj, q, k) { obj.quaternion.slerp(q, k); }

function walkPose(ch, phase, amt, legLen = 1) {
  const s = Math.sin(phase);
  ch.legs[0].rotation.x = s * 0.5 * amt;
  ch.legs[1].rotation.x = -s * 0.5 * amt;
  ch.hips.position.y = (ch.hipsY ?? 0.5) + Math.abs(Math.cos(phase)) * 0.035 * amt;
  ch.torso.rotation.z = s * 0.06 * amt;
}

// Ruta de Santa hacia la chimenea
const santaPath = new THREE.CatmullRomCurve3([V(1.3, 0, -0.55), V(0.75, 0, -0.62), V(0.15, 0, -1.0), V(-0.3, 0, -1.28)]);
const FIRE_X = -0.3;

// ------------------------------------------------------------------ actualización por tiempo
function bulbs(t) {
  for (const b of HS.bulbs) {
    const k = 0.62 + 0.38 * Math.sin(t * b.speed + b.phase) * Math.sin(t * b.speed * 0.37 + b.phase * 2);
    b.g.material.opacity = b.g.userData.base * k;
  }
}

function fire(t) {
  for (const f of LV.flames) {
    const u = f.userData;
    const fl = 0.75 + 0.25 * Math.sin(t * 9 + u.ph) + 0.12 * Math.sin(t * 23 + u.ph * 3);
    f.scale.set(u.s * (0.9 + 0.1 * Math.sin(t * 7 + u.ph)), u.s * fl * 1.1, u.s);
    f.position.x = u.x + Math.sin(t * 5 + u.ph) * 0.012;
    f.rotation.z = Math.sin(t * 6 + u.ph) * 0.12;
  }
  const fk = 0.85 + 0.15 * Math.sin(t * 11.3) * Math.sin(t * 4.1 + 1) + 0.05 * Math.sin(t * 31);
  LV.fireLight.intensity = 2.6 * fk;
  const dim = 1 - 0.6 * pulse(23.1, 23.3, 25.0, 25.3, t);
  for (const f of LV.flames) f.scale.y *= dim;
  LV.fireGlow.material.opacity = 0.55 * fk;
}

function setDog(t) {
  const d = dog;
  // respiración
  d.root.scale.y = 1 + Math.sin(t * 2.6) * 0.012;
  const petting = pulse(12.0, 12.4, 14.2, 14.5, t) + pulse(15.9, 16.3, 17.2, 17.5, t);
  const lookCam = pulse(14.3, 14.7, 15.9, 16.2, t);
  const followSanta = smooth(17.4, 18.0, t) * (1 - smooth(25.4, 26.5, t));
  const peekLook = pulse(23.1, 23.4, 25.2, 25.6, t);
  // cabeza: inclinada hacia la mano, luego mira a la cámara, luego sigue a Santa
  let yaw = 0, pitch = 0.05, roll = 0;
  yaw += petting * 0.35; pitch += petting * -0.25; roll += petting * 0.25 * Math.sin(t * 2.1);
  yaw += lookCam * 0.95; pitch += lookCam * -0.1;
  if (followSanta > 0) {
    const sp = santa.root.position;
    const local = d.root.worldToLocal(sp.clone());
    const yy = Math.atan2(local.x, local.z);
    yaw = lerp(yaw, clamp(yy, -1.2, 1.2), followSanta * (1 - peekLook));
    pitch = lerp(pitch, -0.15, followSanta);
  }
  yaw = lerp(yaw, -0.85, peekLook);
  pitch = lerp(pitch, -0.05 + 0.12 * Math.sin(t * 5), peekLook);
  roll += peekLook * 0.25 * Math.sin(t * 3);
  d.neck.rotation.set(pitch, yaw * 0.4, 0);
  d.head.rotation.set(pitch * 0.6, yaw * 0.6, roll);
  // orejas y ojos (se entrecierran al acariciar)
  const perk = Math.max(lookCam, peekLook, followSanta * 0.6);
  d.ears[0].rotation.set(0, 0, -perk * 0.5 + Math.sin(t * 3) * 0.04);
  d.ears[1].rotation.set(0, 0, perk * 0.5 - Math.sin(t * 3) * 0.04);
  const squint = petting * 0.75;
  const blinkT = (t % 3.7) < 0.12 ? 0.9 : 0;
  for (const e of d.eyes) e.scale.set(1, Math.max(0.12, 1 - squint - blinkT), 0.6);
  // cola
  const wag = 0.25 + petting * 0.8 + lookCam * 0.6 + peekLook * 0.9 + followSanta * 0.3;
  d.tail.rotation.set(0.2, Math.sin(t * (6 + wag * 6)) * 0.55 * clamp(wag, 0, 1), 0);
  d.tongue.visible = (lookCam + peekLook) > 0.5;
}

function setSanta(t) {
  const s = santa;
  const R = s.root;
  R.visible = t < 22.25;
  R.scale.set(1, 1, 1);
  s.hipsY = 0.5;
  s.torso.rotation.set(0, 0, 0);
  s.head.rotation.set(0, 0, 0);
  s.legs[0].rotation.set(0, 0, 0); s.legs[1].rotation.set(0, 0, 0);
  s.hips.position.y = 0.5;
  // respiración / panza
  const breath = Math.sin(t * 2.2) * 0.012;
  s.torso.scale.set(1 + breath, 1 - breath * 0.5, 1 + breath);

  const dogHead = new THREE.Vector3();
  dog.head.getWorldPosition(dogHead);

  // orientación base: entre el perro y la cámara
  let theta = 0.5;
  const wave = pulse(14.35, 14.7, 15.85, 16.15, t);
  theta = lerp(theta, -0.55, wave);
  const pos = SANTA0.clone();

  // recoger el costal (17.4-18.0) y caminar (18.0-20.1)
  const pick = pulse(17.35, 17.65, 17.85, 18.1, t);
  const walkU = smoother(18.0, 20.0, t);
  if (t >= 18.0) {
    santaPath.getPointAt(walkU, pos);
    const tan = santaPath.getTangentAt(Math.min(0.999, walkU));
    const walkDir = Math.atan2(tan.x, tan.z);
    theta = lerp(lerp(Math.atan2(-0.53, -0.85), walkDir, smooth(17.9, 18.25, t)), Math.PI, smooth(19.75, 20.25, t));
  } else if (t > 17.3) {
    theta = lerp(0.5, -1.2, smooth(17.3, 17.65, t));
    theta = lerp(theta, Math.atan2(-0.53, -0.85), smooth(17.85, 18.0, t));
  }
  // entrar a la chimenea
  const crouch = smooth(20.6, 21.05, t);
  const enter = smooth(20.85, 21.3, t);
  const climb = smoother(21.25, 22.2, t);
  if (t > 20.25) {
    pos.set(FIRE_X, 0, -1.28);
    pos.z = lerp(-1.28, -2.12, enter);
    pos.y = climb * 2.3;
    theta = Math.PI;
    R.scale.z = lerp(1, 0.6, enter);
  }
  R.position.copy(pos);
  R.rotation.y = theta;

  // caminar
  const walking = t > 17.95 && t < 20.15;
  if (walking) {
    const ph = (t - 18.0) * Math.PI * 2 * 1.7;
    walkPose(s, ph, smooth(17.95, 18.2, t) * (1 - smooth(19.9, 20.15, t)));
    s.torso.rotation.x = 0.06;
  }
  // agacharse y subir
  s.torso.rotation.x += crouch * 0.85 - climb * 0.5;
  s.hips.position.y -= crouch * 0.12 * (1 - climb);
  if (climb > 0) {
    s.legs[0].rotation.x = Math.sin(t * 16) * 0.45 * climb;
    s.legs[1].rotation.x = -Math.sin(t * 16) * 0.45 * climb;
  }

  // cabeza
  const headToDog = 1 - wave;
  s.head.rotation.y = lerp(0.35 * headToDog, -0.3, wave);
  s.head.rotation.x = 0.18 * headToDog * (t < 17.3 ? 1 : 0) - 0.05 * wave;
  s.head.rotation.z = Math.sin(t * 1.3) * 0.04;
  // mirada de complicidad hacia el niño antes de entrar (20.15-20.6)
  const glance = pulse(20.1, 20.3, 20.55, 20.75, t);
  s.head.rotation.y += glance * 1.15;
  s.head.rotation.z += glance * 0.12;
  s.head.rotation.x += Math.max(0, Math.sin((t - 14.4) * 6)) * 0.05 * wave; // risita
  // parpadeo
  const blink = (t % 3.1) < 0.1 ? 0.15 : 1;
  for (const e of s.eyes) e.scale.y = blink;
  s.face.position.y = 0;

  // brazo izquierdo: acariciar al perrito
  const petAmt = (t < 17.35 ? 1 : 0) * (1 - wave * 0.0);
  if (petAmt > 0 && t < 17.35) {
    s.root.updateMatrixWorld(true);
    const stroke = Math.sin(t * 4.2);
    const tgt = dogHead.clone().add(V(0.02 * stroke, 0.14 + 0.02 * Math.abs(stroke), 0.03 + 0.07 * stroke));
    armIK(s.arms.L, tgt, V(0.4, 0.2, -1));
    s.torso.rotation.z += 0.12;
    s.torso.rotation.x += 0.12;
  } else {
    armRest(s.arms.L, 1, walking ? -Math.sin((t - 18) * Math.PI * 2 * 1.7) * 0.35 : 0);
  }
  // brazo derecho: saludar / recoger costal / sostener costal al hombro
  s.root.updateMatrixWorld(true);
  if (wave > 0.001) {
    const head = new THREE.Vector3(); s.head.getWorldPosition(head);
    const w = Math.sin((t - 14.5) * 11) ;
    const right = V(-Math.cos(theta), 0, Math.sin(theta));
    const fwd = V(Math.sin(theta), 0, Math.cos(theta));
    const tgt = head.clone().add(right.clone().multiplyScalar(0.25 + 0.06 * w)).add(V(0, 0.22, 0)).add(fwd.clone().multiplyScalar(0.12));
    const restT = head.clone().add(right.clone().multiplyScalar(0.22)).add(V(0, -0.75, 0));
    armIK(s.arms.R, restT.lerp(tgt, wave), V(-0.3, -1, -0.6));
    s.arms.R.el.rotation.z += w * 0.25 * wave;
  } else if (t > 17.3 && t < 20.7) {
    if (t < 17.85) {
      const sk = new THREE.Vector3(); sack.getWorldPosition(sk);
      const right = V(-Math.cos(theta), 0, Math.sin(theta));
      const restT = R.position.clone().add(V(0, 0.75, 0)).add(right.multiplyScalar(0.33));
      armIK(s.arms.R, restT.lerp(sk.add(V(0, 0.18, 0)), pick), V(-1, 0, 1));
      s.torso.rotation.x += pick * 0.45;
    } else {
      // al hombro
      s.arms.R.sh.quaternion.identity();
      s.arms.R.sh.rotation.set(-2.6, 0, -0.25);
      s.arms.R.el.rotation.set(-1.9, 0, 0);
    }
  } else if (t >= 20.7) {
    s.arms.R.sh.rotation.set(-2.9, 0, -0.1);
    s.arms.L.sh.rotation.set(-2.9, 0, 0.1);
    s.arms.R.el.rotation.set(-0.2, 0, 0);
    s.arms.L.el.rotation.set(-0.2, 0, 0);
  } else {
    armRest(s.arms.R, -1, 0, 0.18);
  }
  // Brazo izquierdo al subir
  if (t > 20.25 && t < 20.7) armRest(s.arms.L, 1, 0, 0.1);
  if (t > 20.15) {
    const k = smooth(20.15, 20.45, t) * (1 - smooth(20.55, 20.75, t));
    if (k > 0) {
      // dedo junto a la nariz (guiño clásico)
      s.arms.L.sh.quaternion.identity();
      s.arms.L.sh.rotation.set(-1.4 * k, 0, 0.3 + 0.9 * k);
      s.arms.L.el.rotation.set(-2.0 * k, 0, 0);
    }
  }

  // sombra de contacto
  santaBlob.visible = R.visible && pos.y < 0.3;
  santaBlob.position.set(pos.x, 0.006, pos.z);
  santaBlob.material.opacity = 0.42 * (1 - enter * 0.6);
}

function setSack(t) {
  const s = santa;
  sack.visible = t < 21.6;
  if (t < 17.75) {
    // en el piso, casi vacío y desparramado
    sack.position.set(0.8, 0.13, -0.3);
    sack.rotation.set(0.1, 0.6, 0.18);
    sack.scale.set(1.1, 0.75, 0.95);
    if (t > 17.6) {
      const hand = new THREE.Vector3(); s.arms.R.hand.getWorldPosition(hand);
      const k = smooth(17.6, 17.75, t);
      sack.position.lerp(hand.add(V(0, -0.2, 0)), k);
      sack.rotation.x = lerp(1.25, 0.2, k);
    }
  } else {
    // colgado sobre el hombro derecho, rebotando al caminar
    s.root.updateMatrixWorld(true);
    const hand = new THREE.Vector3(); s.arms.R.hand.getWorldPosition(hand);
    const back = V(-Math.sin(s.root.rotation.y), 0, -Math.cos(s.root.rotation.y));
    const k = smooth(17.75, 18.1, t);
    const bob = Math.abs(Math.sin((t - 18) * Math.PI * 2 * 1.7)) * 0.03;
    const target = hand.clone().add(back.multiplyScalar(0.16)).add(V(0, -0.12 + bob, 0));
    sack.position.copy(target);
    sack.rotation.set(lerp(0.2, -0.5, k), s.root.rotation.y, 0.25);
    sack.scale.set(1, 1, 1);
  }
}

function setPeek(t) {
  const P = peek;
  const show = t > 23.15 && t < 25.25;
  P.root.visible = show;
  if (!show) return;
  // baja de golpe (rebote), saluda, y se va hacia arriba
  const down = easeOutBack(clamp((t - 23.15) / 0.38));
  const up = smooth(24.85, 25.15, t);
  const yTop = 2.85, yPeek = 2.12;
  P.root.position.set(FIRE_X, lerp(yTop, yPeek, down) + up * 0.9, -2.06);
  P.root.rotation.set(0, 0, Math.PI + Math.sin(t * 3.2) * 0.06);
  // brazo (en el marco invertido "arriba" = hacia el piso)
  const w = Math.sin((t - 23.5) * 12);
  P.arms.R.sh.quaternion.identity();
  P.arms.R.sh.rotation.set(-0.35, 0, -2.75 + 0.05 * w);
  P.arms.R.el.rotation.set(0, 0, 0.45 * w * smooth(23.45, 23.65, t));
  P.head.rotation.set(-0.15 + Math.sin(t * 7) * 0.04 * pulse(23.7, 23.8, 24.7, 24.9, t), 0.1, Math.sin(t * 4) * 0.08);
  P.hat.rotation.set(0.25 + Math.sin(t * 6) * 0.15, 0, 0);
  const blink = (t > 24.3 && t < 24.42) ? 0.12 : 1; // guiño
  P.eyes[0].scale.y = blink;
  P.eyes[1].scale.y = 1;
}

function setKid(t) {
  const show = t > 25.12;
  const R = kid.root;
  if (!show) { R.visible = false; kidBlob.visible = false; return; }
  const eye = V(-1.22, 0.98, 0.5);
  const look = V(-0.3, 0.74, -1.95);
  const f = look.clone().sub(eye); f.y = 0; f.normalize();
  R.position.set(eye.x - f.x * 0.11, 0, eye.z - f.z * 0.11);
  R.rotation.y = Math.atan2(f.x, f.z);
  const head = R.position.clone().add(V(0, 1.0, 0));
  R.visible = camera.position.distanceTo(head) > 0.5;
  kidBlob.visible = R.visible;
  kidBlob.position.set(R.position.x, 0.006, R.position.z);
  // brinquito de emoción y saludo hacia la chimenea
  const hop = Math.max(0, Math.sin((t - 25.4) * 7)) * 0.04 * smooth(25.5, 26.0, t) * (1 - smooth(27.5, 28.5, t));
  kid.hips.position.y = 0.42 + hop;
  kid.head.rotation.set(-0.12, 0, Math.sin(t * 2) * 0.05);
  kid.arms.R.sh.rotation.set(-0.4, 0, -2.5 + Math.sin(t * 9) * 0.25);
  kid.arms.R.el.rotation.set(0, 0, Math.sin(t * 9) * 0.3);
  kid.arms.L.sh.rotation.set(0.1, 0, 0.15);
}

// ---------------- brazo en POV
// Poses del brazo en el espacio de la cámara: {t, p:[x,y,z] (local) | w:fn() (mundo), rot:[x,y,z], curl}
const OFF = { p: [0.32, -0.62, -0.28], rot: [-0.6, 0, -0.3], curl: 0.4 };
function knobWorld() {
  const v = V(0.06, 0.95, 0.7);
  BR.door.updateWorldMatrix(true, false);
  return BR.door.localToWorld(v);
}
const armKeys = [
  { t: 0, ...OFF },
  { t: 2.5, ...OFF },
  { t: 3.05, w: () => BR.switchWorld.clone().add(V(0, 0.06, 0.02)), rot: [-1.25, 0.2, 0.15], curl: 0.5 },
  { t: 3.3, w: () => BR.switchWorld.clone().add(V(0, 0.035, 0.02)), rot: [-1.3, 0.2, 0.15], curl: 0.55 },
  { t: 3.55, w: () => BR.switchWorld.clone().add(V(-0.03, 0.09, 0.05)), rot: [-1.1, 0.2, 0.1], curl: 0.4 },
  { t: 4.1, ...OFF },
  { t: 6.85, ...OFF },
  { t: 7.3, w: () => knobWorld().add(V(0.035, 0, 0)), rot: [-1.35, 0, 0.9], curl: 0.9 },
  { t: 7.7, w: () => knobWorld().add(V(0.035, 0, 0)), rot: [-1.35, 0, 0.9], curl: 1.1 },
  { t: 8.05, w: () => knobWorld().add(V(0.05, -0.02, -0.1)), rot: [-1.2, 0, 0.6], curl: 0.6 },
  { t: 8.45, ...OFF },
  { t: 12.75, ...OFF },
  { t: 13.2, w: () => V(-2.57, 1.08, 2.2), rot: [-0.15, -0.9, 0.2], curl: 0.2 },
  { t: 14.4, w: () => V(-2.57, 1.08, 2.2), rot: [-0.15, -0.9, 0.2], curl: 0.25 },
  { t: 14.9, p: [0.07, -0.25, -0.5], rot: [0.15, 0, 0.1], curl: 0.05 },
  { t: 15.95, p: [0.07, -0.23, -0.5], rot: [0.15, 0, 0.1], curl: 0.05, wave: true },
  { t: 16.6, ...OFF },
  { t: 23.6, ...OFF },
  { t: 24.0, p: [0.12, -0.04, -0.42], rot: [0.12, 0, 0.1], curl: 0.05 },
  { t: 24.95, p: [0.12, -0.03, -0.42], rot: [0.12, 0, 0.1], curl: 0.05, wave: true },
  { t: 25.15, ...OFF },
];
const SHOULDER = V(0.2, -0.36, 0.08);
function setArm(t) {
  // convertir llaves de mundo a local con la cámara actual
  camera.updateMatrixWorld(true);
  const pts = armKeys.map(k => {
    if (k.w) return camera.worldToLocal(k.w()).toArray();
    return k.p;
  });
  const pos = track(armKeys.map((k, i) => ({ t: k.t, v: pts[i], hold: true, ease: 'smooth' })))(t);
  const rot = track(armKeys.map(k => ({ t: k.t, v: k.rot, hold: true, ease: 'smooth' })))(t);
  const curl = track(armKeys.map(k => ({ t: k.t, v: k.curl, hold: true, ease: 'smooth' })))(t);
  // saludo
  let w = 0;
  if (t > 14.75 && t < 16.2) w = Math.sin((t - 14.75) * 13) * smooth(14.75, 15.0, t) * (1 - smooth(15.9, 16.2, t));
  if (t > 23.9 && t < 25.1) w = Math.sin((t - 23.9) * 13) * smooth(23.9, 24.1, t) * (1 - smooth(24.85, 25.1, t));
  const hand = arm.hand;
  hand.position.set(pos[0] + w * 0.03, pos[1], pos[2]);
  hand.rotation.set(rot[0], rot[1], rot[2] + w * 0.35);
  for (let i = 0; i < 4; i++) arm.fingers[i].rotation.set(-curl * (1.2 + i * 0.12), 0, (i - 1.5) * 0.06 * (1 - curl));
  arm.fingers[0].rotation.x *= (t > 2.9 && t < 3.6) ? 0.15 : 1; // índice extendido para el botón
  arm.thumb.rotation.set(-curl * 0.6, 0, 0);
  // manga: del hombro (fuera de cuadro) a la muñeca
  const wrist = V(0, -0.005, 0.0).applyEuler(hand.rotation).add(hand.position);
  const dir = wrist.clone().sub(SHOULDER);
  const len = dir.length();
  dir.normalize();
  arm.sleeve.position.copy(SHOULDER).add(wrist).multiplyScalar(0.5);
  arm.sleeve.quaternion.setFromUnitVectors(V(0, 1, 0), dir);
  arm.sleeve.scale.set(1, len / 1.1, 1);
  const cuffP = wrist.clone().sub(dir.clone().multiplyScalar(0.02));
  arm.cuff.position.copy(cuffP);
  arm.cuff.quaternion.copy(arm.sleeve.quaternion);
  const visible = pos[1] > -0.6 && t < 25.12;
  arm.sleeve.visible = arm.cuff.visible = hand.visible = visible;
}

// ---------------- cámara con respiración y pasos
function setCamera(t) {
  let p = camP(t), l = camL(t), roll = camR(t);
  // escalera: altura según el escalón
  if (t > 9.15 && t < 12.0) {
    const u = smoother(9.15, 12.0, t);
    const z = lerp(-1.8, 1.82, u);
    p[2] = z;
    p[0] = lerp(-3.36, -3.38, u);
    const steps = (z - STAIR.z0) / STAIR.run;
    const fy = stairFloorY(z);
    const bob = Math.abs(Math.sin(Math.max(0, steps) * Math.PI)) * 0.035;
    p[1] = fy + 1.0 + bob;
    l = [lerp(-3.38, -3.3, u), lerp(Y1 * 0.1, 0.9, smooth(9.15, 11.8, t)), z + 2.4];
  }
  // pasos caminando en la recámara
  const walking = pulse(5.3, 5.5, 6.8, 7.0, t) + pulse(8.0, 8.2, 8.9, 9.1, t);
  if (walking > 0) p[1] += Math.abs(Math.sin(t * Math.PI * 3.2)) * 0.04 * walking - 0.02 * walking;
  const walk2 = pulse(17.6, 18.0, 19.8, 20.1, t) * 0.4 + pulse(20.1, 20.5, 22.2, 22.5, t) * 0.7;
  if (walk2 > 0) p[1] += Math.abs(Math.sin(t * Math.PI * 2.4)) * 0.03 * walk2;
  // respiración / cámara en mano (solo en POV)
  const pov = 1 - smooth(25.1, 26.0, t);
  p[0] += Math.sin(t * 0.9) * 0.006 * pov;
  p[1] += Math.sin(t * 1.7) * 0.008 * pov;
  l[0] += Math.sin(t * 0.63 + 1) * 0.02 * pov;
  l[1] += Math.sin(t * 0.81 + 2) * 0.015 * pov;
  camera.position.set(...p);
  camera.up.set(0, 1, 0);
  camera.lookAt(...l);
  camera.rotateZ(roll);
  camera.fov = camFov(t);
  camera.updateProjectionMatrix();
}

function setLights(t) {
  const lampOn = smooth(3.3, 3.42, t) * (t > 3.36 && t < 3.39 ? 0.5 : 1);
  const finale = smooth(25.3, 27.5, t);
  const inBed = t < 9.6;
  const inLiving = t > 8.5;
  // luz de estudio: noche fría y suave; en el final, más presente para leer el diorama
  key.intensity = lerp(0.35, 1.25, finale);
  key.color.set('#c9d2ff');
  hemi.intensity = lerp(0.4, 0.8, finale);
  moon.intensity = inBed ? 22 * (1 - lampOn * 0.35) : 0;
  moon.visible = inBed || finale > 0;
  if (finale > 0) moon.intensity = 10 * finale;
  lampLight.intensity = 3.2 * lampOn;
  lampLight.visible = inBed || finale > 0;
  lampLight.castShadow = inBed;
  BR.lampShadeMat.emissiveIntensity = 0.95 * lampOn;
  BR.lampBulbMat.color.set(lampOn > 0.5 ? '#fff4d8' : '#5a5048');
  BR.lampGlow.material.opacity = 0.75 * lampOn;
  bedFill.intensity = 2.0 * lampOn;
  bedFill.visible = inBed || finale > 0;
  HS.lights.sconce.intensity = 0.7;
  // sala
  LV.floorLight.visible = inLiving;
  LV.floorLight.castShadow = inLiving && t < 25.4;
  LV.floorLight.intensity = 2.2;
  LV.tree.light1.visible = LV.tree.light2.visible = inLiving;
  LV.tree.light1.intensity = 0.7 * (0.93 + 0.07 * Math.sin(t * 3.1));
  LV.tree.light2.intensity = 0.0;
  LV.fireLight.visible = inLiving;
  livingFill.intensity = inLiving ? 0.7 : 0;
  livingFill.visible = inLiving;
  // estudio y niebla
  skyU.top.value.set('#262a47');
  renderer.toneMappingExposure = lerp(1.0, 1.1, finale);
}

function setFront(t) {
  // los muros frontales se hunden en la base para abrir el diorama
  const k = smoother(25.2, 25.95, t);
  HS.front.position.y = -k * 5.3;
  HS.front.visible = k < 0.999;
}

function setParticles(t) {
  // hollín al desaparecer Santa por la chimenea
  puffs.forEach((p, i) => {
    const t0 = 21.75 + i * 0.07;
    const u = clamp((t - t0) / 1.3);
    p.visible = u > 0 && u < 1;
    if (!p.visible) return;
    const a = i * 2.39;
    p.position.set(FIRE_X + Math.cos(a) * 0.25 * u, 0.55 + Math.sin(a * 1.3) * 0.15 + u * 0.15, -1.85 + u * (0.25 + (i % 3) * 0.1));
    p.scale.setScalar(0.25 + u * 0.55);
    p.material.opacity = 0.55 * Math.sin(u * Math.PI);
  });
  // chispas mágicas cuando se va
  sparkles.forEach((s, i) => {
    const t0 = 25.0 + (i % 5) * 0.03;
    const u = clamp((t - t0) / 0.9);
    s.visible = u > 0 && u < 1;
    if (!s.visible) return;
    const a = i * 2.399, b = (i * 0.618) % 1;
    const r = u * (0.35 + b * 0.35);
    s.position.set(FIRE_X + Math.cos(a) * r, 0.85 + Math.sin(a) * r * 0.7 + u * 0.2, -1.9 + b * 0.15);
    s.scale.setScalar(0.07 + 0.05 * Math.sin(i));
    s.material.opacity = (1 - u) * (0.6 + 0.4 * Math.sin(t * 40 + i));
  });
  // nieve en el plano final
  const sA = smooth(25.6, 27.0, t);
  snowMat.opacity = 0.85 * sA;
  snow.visible = sA > 0;
  if (sA > 0) {
    const pos = snowGeo.attributes.position;
    for (let i = 0; i < snowN; i++) {
      const sp = 0.6 + snowBase[i * 4 + 3] * 0.6;
      let y = snowBase[i * 4 + 1] - t * sp;
      y = ((y % 22) + 22) % 22 - 1;
      pos.setXYZ(i, snowBase[i * 4] + Math.sin(t * 0.7 + i) * 0.3, y, snowBase[i * 4 + 2] + Math.cos(t * 0.5 + i) * 0.3);
    }
    pos.needsUpdate = true;
  }
}

const sleighPath = new THREE.CatmullRomCurve3([V(-0.3, TOP + 0.9, -2.26), V(0.1, TOP + 2.3, -2.6), V(1.6, TOP + 4.0, -3.2), V(4.2, TOP + 5.6, -4.2), V(8.0, TOP + 7.0, -6.0)]);
function setSleigh(t) {
  const t0 = 25.9, t1 = 29.6;
  const u = (t - t0) / (t1 - t0);
  sleigh.visible = u > 0 && u < 1.05;
  trail.forEach((s, i) => {
    const uu = u - i * 0.0065;
    s.visible = sleigh.visible && uu > 0 && uu < 1;
    if (!s.visible) return;
    const p = sleighPath.getPointAt(clamp(uu));
    s.position.copy(p).add(V(Math.sin(i * 3.1) * 0.08, Math.cos(i * 2.3) * 0.08 + 0.05, 0));
    s.scale.setScalar(0.18 * (1 - i / trail.length) + 0.04);
    s.material.opacity = (1 - i / trail.length) * (0.55 + 0.45 * Math.sin(t * 30 + i * 1.7));
  });
  if (!sleigh.visible) return;
  const uc = clamp(u);
  const ease = uc * uc * (3 - 2 * uc) * 0.35 + uc * 0.65;
  const p = sleighPath.getPointAt(clamp(ease, 0, 1));
  const tan = sleighPath.getTangentAt(clamp(ease, 0, 0.999));
  sleigh.position.copy(p);
  sleigh.rotation.set(0, Math.atan2(-tan.z, tan.x), Math.asin(clamp(tan.y, -1, 1)) * 0.6);
  sleigh.scale.setScalar(lerp(0.55, 0.85, smooth(0, 0.3, uc)));
  sleigh.userData.deer.forEach((d, i) => { d.position.y = 0.25 + Math.sin(t * 9 + i * 1.5) * 0.04; });
  sleigh.userData.miniArm.sh.rotation.z = -2.5 + Math.sin(t * 10) * 0.25;
}

// ------------------------------------------------------------------ API para el render
function update(t) {
  setCamera(t);
  setLights(t);
  setFront(t);
  bulbs(t);
  fire(t);
  scene.updateMatrixWorld(true);
  setDog(t);
  dog.root.updateMatrixWorld(true);
  setSanta(t);
  setSack(t);
  setPeek(t);
  setKid(t);
  setArm(t);
  setParticles(t);
  setSleigh(t);
  LV.tree.star.rotation.y = Math.sin(t * 0.8) * 0.15;
  // posprocesos
  const u = finish.uniforms;
  u.time.value = t;
  const lid = Math.max(0, Math.min(1,
    smooth(0.35, 0.95, t) * (1 - pulse(1.05, 1.18, 1.25, 1.45, t))));
  u.lid.value = t < 2 ? lid : 1;
  u.blur.value = (1 - smooth(0.4, 2.4, t)) * 1.6;
  u.textA.value = smooth(27.7, 28.6, t);
  u.fade.value = smooth(29.55, 30.0, t);
  u.vig.value = 1;
  // foco: Santa mientras está en escena, si no, el punto al que mira la cámara
  const fp = new THREE.Vector3();
  if (santa.root.visible) santa.head.getWorldPosition(fp); else fp.set(...camL(t));
  if (t > 22.3 && t < 25.3) fp.set(FIRE_X, 0.75, -1.95);
  if (t > 25.3) fp.set(-0.6, 2.0, 0);
  bokeh.uniforms.focus.value = camera.position.distanceTo(fp);
  bokeh.uniforms.aperture.value = t > 25.3 ? 0.0012 : 0.005;
}

window.renderFrame = (t) => {
  bloom.enabled = !window.noBloom; gtao.enabled = !window.noAO; bokeh.enabled = !window.noDof;
  update(t);
  if (window.debugCam) {
    const d = window.debugCam;
    camera.position.set(...d.p); camera.up.set(0, 1, 0); camera.lookAt(...d.l); camera.fov = d.fov || 30; camera.updateProjectionMatrix();
    arm.hand.visible = arm.sleeve.visible = arm.cuff.visible = false;
    finish.uniforms.lid.value = 1; finish.uniforms.blur.value = 0;
  }
  composer.render();
  return true;
};
window.DURATION = DURATION;
window.__dbg = { scene, santa, THREE, camera };
window.sceneReady = true;
// vista previa en navegador
if (location.search.includes('play')) {
  const t0 = performance.now();
  const loop = () => { window.renderFrame(((performance.now() - t0) / 1000) % DURATION); requestAnimationFrame(loop); };
  loop();
} else if (location.search.includes('t=')) {
  window.renderFrame(parseFloat(new URLSearchParams(location.search).get('t')));
}
