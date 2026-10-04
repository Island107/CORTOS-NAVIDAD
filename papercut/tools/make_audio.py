"""Genera la pista de sonido (30 s) completamente por código:
cajita musical suave, cascabeles de trineo y efectos (clic, pasos, puerta,
fuego, chispas...). Sin voces. Salida: public/audio/sfx.wav (44.1 kHz estéreo)."""
import numpy as np
import wave, os

SR = 44100
DUR = 30.0
N = int(SR * DUR)
L = np.zeros(N)
R = np.zeros(N)
rng = np.random.default_rng(3)


def add(sig, t0, gain=1.0, pan=0.0):
    i0 = int(t0 * SR)
    if i0 >= N:
        return
    sig = sig[: N - i0] * gain
    l = np.cos((pan + 1) * np.pi / 4)
    r = np.sin((pan + 1) * np.pi / 4)
    L[i0 : i0 + len(sig)] += sig * l
    R[i0 : i0 + len(sig)] += sig * r


def tt(d):
    return np.arange(int(d * SR)) / SR


def band_noise(d, lo, hi, env=None):
    n = rng.standard_normal(int(d * SR))
    f = np.fft.rfft(n)
    fr = np.fft.rfftfreq(len(n), 1 / SR)
    shape = np.exp(-0.5 * ((np.log(fr + 1) - np.log((lo + hi) / 2)) / (np.log(hi / lo) / 2 + 1e-6)) ** 2)
    out = np.fft.irfft(f * shape, len(n))
    out /= np.abs(out).max() + 1e-9
    if env is not None:
        out *= env
    return out


def adsr(d, a=0.005, rel=0.1):
    t = tt(d)
    e = np.minimum(1, t / max(a, 1e-4))
    e *= np.minimum(1, (d - t) / max(rel, 1e-4))
    return np.clip(e, 0, 1)


# ---------- instrumentos ----------
def music_box(f, d=1.6):
    t = tt(d)
    s = np.sin(2 * np.pi * f * t) * np.exp(-t * 2.6)
    s += 0.35 * np.sin(2 * np.pi * f * 2.0 * t) * np.exp(-t * 4)
    s += 0.18 * np.sin(2 * np.pi * f * 5.4 * t) * np.exp(-t * 9)
    s += 0.05 * band_noise(d, 3000, 8000) * np.exp(-t * 120)
    return s * adsr(d, 0.002, 0.2)


def bell(f0, d=0.35):
    t = tt(d)
    parts = [(1, 1.0, 14), (2.32, 0.55, 20), (4.25, 0.35, 28), (6.63, 0.2, 36)]
    s = sum(a * np.sin(2 * np.pi * f0 * p * t + rng.uniform(0, 6)) * np.exp(-t * k) for p, a, k in parts)
    s += 0.25 * band_noise(d, 4000, 10000) * np.exp(-t * 200)
    return s


def jingle_shake(strength=1.0):
    out = np.zeros(int(0.5 * SR))
    for _ in range(int(6 + 8 * strength)):
        b = bell(rng.uniform(2500, 3600), 0.35) * rng.uniform(0.3, 1)
        i = int(rng.uniform(0, 0.05) * SR)
        out[i : i + len(b)] += b[: len(out) - i]
    return out / 8


def thump(f=70, d=0.25, noise=0.4):
    t = tt(d)
    s = np.sin(2 * np.pi * f * t * (1 + 0.5 * np.exp(-t * 30))) * np.exp(-t * 18)
    s += noise * band_noise(d, 150, 900) * np.exp(-t * 40)
    return s


def chime(f, d=1.2):
    t = tt(d)
    return (np.sin(2 * np.pi * f * t) + 0.4 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 3)) * np.exp(-t * 3.2) * adsr(d, 0.002, 0.2)


def whoosh(d, lo, hi, rise=True):
    t = tt(d)
    env = np.sin(np.pi * t / d) ** 2
    n = band_noise(d, lo, hi)
    # barrido simple: mezcla entre graves y agudos
    n2 = band_noise(d, lo * 3, hi * 3)
    k = t / d if rise else 1 - t / d
    return (n * (1 - k) + n2 * k) * env


# ---------- cajita musical (melodía original, 3/4) ----------
NOTE = {n: 440 * 2 ** ((i - 9) / 12) for i, n in enumerate(["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"])}


def nf(name):
    p, o = name[:-1], int(name[-1])
    return NOTE[p] * 2 ** (o - 4)


beat = 0.42
melody = [
    ("E5", 1), ("G5", 1), ("C6", 1), ("B5", 2), ("G5", 1),
    ("A5", 1), ("G5", 1), ("E5", 1), ("F5", 2), ("D5", 1),
    ("E5", 1), ("G5", 1), ("C6", 1), ("D6", 2), ("B5", 1),
    ("C6", 3), ("G5", 3),
]
bass = ["C4", "G3", "A3", "F3", "C4", "G3", "C4", "G3"]
t0 = 1.0
pos = t0
music_gain = lambda t: 0.10 if t < 25.5 else 0.10 + 0.10 * min(1, (t - 25.5) / 2)
while pos < 29.0:
    for n, b in melody:
        if pos > 29.0:
            break
        add(music_box(nf(n)), pos, music_gain(pos), pan=0.15)
        pos += b * beat
for i in range(int((29 - t0) / (3 * beat))):
    tb = t0 + i * 3 * beat
    add(music_box(nf(bass[i % len(bass)]), 2.0), tb, music_gain(tb) * 0.7, pan=-0.2)

# ---------- ESCENA 1 ----------
add(band_noise(0.8, 200, 600) * adsr(0.8, 0.3, 0.4), 1.4, 0.05)  # sábanas al incorporarse
click = band_noise(0.05, 1500, 5000) * np.exp(-tt(0.05) * 120)
add(click, 3.15, 0.35, pan=-0.4)
add(thump(1200, 0.04, 0) * 0.5, 3.17, 0.25, pan=-0.4)
add(chime(nf("E6"), 0.8), 3.2, 0.08)
for i, ts in enumerate(np.arange(3.7, 5.2, 0.36)):
    add(thump(80, 0.25, 0.5), ts, 0.18, pan=(-1) ** i * 0.15)
# puerta que rechina suave
d = 0.9
t = tt(d)
f = 420 + 120 * np.sin(np.pi * t / d) + 30 * np.sin(2 * np.pi * 9 * t)
creak = np.sin(2 * np.pi * np.cumsum(f) / SR) * band_noise(d, 300, 2000) * np.sin(np.pi * t / d) ** 2
add(creak, 5.1, 0.12, pan=0.3)
add(whoosh(0.9, 300, 1500), 5.6, 0.12)

# ---------- ESCENA 2: escalera ----------
for i in range(15):
    ts = 6.5 + i * (4.0 / 15)
    add(thump(90 + (i % 2) * 10, 0.25, 0.6), ts, 0.16, pan=(-1) ** i * 0.15)
    if i % 2 == 0:
        add(band_noise(0.12, 600, 2500) * np.exp(-tt(0.12) * 25), ts + 0.02, 0.03)  # crujido de madera
for i in range(10):
    ts = 6.4 + rng.uniform(0, 5)
    add(chime(rng.choice([nf("C7"), nf("E7"), nf("G7"), nf("A6")]), 0.6), ts, 0.035, pan=rng.uniform(-0.6, 0.6))
add(whoosh(1.4, 200, 900), 10.6, 0.1)

# ---------- ESCENAS 3-4: la sala ----------
# fuego crepitando (más bajo cuando se apaga)
for i in range(240):
    ts = 12 + rng.uniform(0, 14)
    lvl = 0.25 if 18.6 < ts < 24.9 else 1.0
    pop = band_noise(0.03, 1500, 6000) * np.exp(-tt(0.03) * 150)
    add(pop, ts, 0.06 * lvl * rng.uniform(0.3, 1), pan=0.1)
amb = band_noise(14, 80, 500)
env = np.ones(len(amb))
tt14 = tt(14)
env *= np.where((tt14 > 6.6) & (tt14 < 12.9), 0.35, 1.0)
add(amb * env * adsr(14, 1.0, 1.0), 12, 0.03)
# colita del perrito golpeando el cojín
for ts in np.arange(12.1, 14.6, 0.19):
    add(thump(110, 0.12, 0.8), ts, 0.12, pan=0.35)
# saludo: chispita
add(chime(nf("G6")), 14.9, 0.07, pan=-0.1)
add(chime(nf("C7")), 15.05, 0.05, pan=-0.1)
# costal
add(band_noise(0.5, 300, 3000) * adsr(0.5, 0.05, 0.3), 16.85, 0.12, pan=-0.2)
# botas de Santa
for i, ts in enumerate(np.arange(17.55, 19.1, 0.35)):
    add(thump(65, 0.3, 0.5), ts, 0.22 * (1 - i * 0.07), pan=(-1) ** i * 0.1)
# el fuego baja
add(whoosh(0.7, 200, 800, rise=False), 18.3, 0.12)
# sube por la chimenea
add(whoosh(0.9, 150, 900, rise=True), 19.3, 0.2)
for k in range(4):
    add(jingle_shake(0.6), 19.4 + k * 0.17, 0.25 * (1 - k * 0.2))
# reaparece de cabeza: boing suave
d = 0.6
t = tt(d)
fb = 300 * (1 + 0.6 * np.exp(-t * 8)) * (1 + 0.04 * np.sin(2 * np.pi * 14 * t))
add(np.sin(2 * np.pi * np.cumsum(fb) / SR) * np.exp(-t * 5), 21.15, 0.22)
add(jingle_shake(0.4), 21.15, 0.18)
# burbuja: pop + "jo, jo, jo" como tres notas graves de marimba (sin voz)
add(thump(500, 0.08, 0.2), 21.95, 0.25)
for k, ts in enumerate([22.15, 22.45, 22.75]):
    add(music_box(nf(["G3", "G3", "C3"][k]) * 2, 0.6), ts, 0.16)
# guiño
add(chime(nf("E7"), 0.7), 23.3, 0.12, pan=0.1)
add(chime(nf("B6"), 0.7), 23.38, 0.08, pan=0.1)
# desaparece con chispas: glissando de campanitas
for k in range(16):
    add(chime(nf("C6") * 2 ** (k / 8), 0.9), 24.32 + k * 0.035, 0.07, pan=rng.uniform(-0.5, 0.5))
add(band_noise(1.2, 5000, 12000) * np.exp(-tt(1.2) * 3) * adsr(1.2, 0.01, 0.3), 24.32, 0.08)
# el fuego vuelve
add(whoosh(0.7, 200, 900), 24.85, 0.14)

# ---------- ESCENA 5: diorama y trineo ----------
for i, ts in enumerate(np.arange(26.3, 29.8, 0.21)):
    strength = min(1, (ts - 26.3) / 1.2) * (1 if ts < 29.2 else max(0, 1 - (ts - 29.2) / 0.6))
    add(jingle_shake(strength), ts, 0.7 * strength + 0.05, pan=np.sin(ts * 1.2) * 0.5)
add(whoosh(1.6, 300, 1600), 27.2, 0.12, pan=-0.3)
for k, n in enumerate(["C6", "E6", "G6", "C7"]):
    add(chime(nf(n), 2.0), 27.95 + k * 0.06, 0.09)

# ---------- mezcla final ----------
mix = np.stack([L, R], axis=1)
# fundidos
fade_in = np.minimum(1, np.arange(N) / (0.3 * SR))
fade_out = np.minimum(1, (N - np.arange(N)) / (0.6 * SR))
mix *= (fade_in * fade_out)[:, None]
peak = np.abs(mix).max()
mix = mix / peak * 0.85
out = os.path.join(os.path.dirname(__file__), "..", "public", "audio", "sfx.wav")
with wave.open(out, "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((mix * 32767).astype(np.int16).tobytes())
print("ok", out, "peak", peak)
