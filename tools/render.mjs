// Render headless: node tools/render.mjs --still 15.2 out.png  |  --frames a b dir  |  --video out.mp4 [--fps 30]
import { chromium } from 'playwright-core';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  fs.readFile(p, (err, data) => {
    if (err) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' });
    res.end(data);
  });
});
await new Promise(r => server.listen(0, r));
const port = server.address().port;

const args = process.argv.slice(2);
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-sandbox'],
});
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') console.error('[page]', m.text()); });
page.on('pageerror', e => { console.error('[pageerror]', e.message); process.exit(1); });
await page.goto(`http://localhost:${port}/index.html`);
await page.waitForFunction(() => window.sceneReady === true, null, { timeout: 120000 });
if (args.includes('--flags')) {
  const f = args[args.indexOf('--flags') + 1].split(',');
  await page.evaluate((f) => { for (const k of f) window[k] = true; }, f);
}
if (args.includes('--cam')) {
  const c = JSON.parse(args[args.indexOf('--cam') + 1]);
  await page.evaluate((c) => { window.debugCam = c; }, c);
}

async function grab(t) {
  const b64 = await page.evaluate((t) => {
    window.renderFrame(t);
    return document.querySelector('canvas').toDataURL('image/png').split(',')[1];
  }, t);
  return Buffer.from(b64, 'base64');
}

const mode = args[0];
if (mode === '--still') {
  const ts = args[1].split(',').map(Number);
  const out = args[2];
  for (const t of ts) {
    const t0 = Date.now();
    const buf = await grab(t);
    const f = ts.length > 1 ? out.replace(/(\.png)$/, `_${t.toFixed(2)}$1`) : out;
    fs.writeFileSync(f, buf);
    console.log('frame', t, f, (Date.now() - t0) + 'ms');
  }
} else if (mode === '--video') {
  const out = args[1];
  const fps = Number(args[args.indexOf('--fps') + 1] || 30) || 30;
  const from = args.includes('--from') ? Number(args[args.indexOf('--from') + 1]) : 0;
  const to = args.includes('--to') ? Number(args[args.indexOf('--to') + 1]) : 30;
  const n0 = Math.round(from * fps), n1 = Math.round(to * fps);
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'png', '-i', '-',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-pix_fmt', 'yuv420p', '-r', String(fps), out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const start = Date.now();
  for (let i = n0; i < n1; i++) {
    const buf = await grab(i / fps);
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (i % 15 === 0) {
      const el = (Date.now() - start) / 1000, done = i - n0 + 1;
      console.log(`frame ${i}/${n1} ${(el / done).toFixed(2)}s/f eta ${((n1 - i) * el / done / 60).toFixed(1)}min`);
    }
  }
  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
  console.log('done', out);
}
await browser.close();
server.close();
