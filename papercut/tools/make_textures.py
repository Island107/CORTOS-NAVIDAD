"""Genera texturas tileables (overlays RGBA) para el look de papel y fieltro.
Cada textura es un overlay: píxeles oscuros/claros semitransparentes que se
superponen sobre una figura de color plano."""
import numpy as np
from PIL import Image
import os

OUT = os.path.join(os.path.dirname(__file__), "..", "public", "tex")
rng = np.random.default_rng(7)


def tile_noise(n, scale):
    """Ruido tileable por filtrado en frecuencia (envuelve en los bordes)."""
    white = rng.standard_normal((n, n))
    f = np.fft.fft2(white)
    fy = np.fft.fftfreq(n)[:, None]
    fx = np.fft.fftfreq(n)[None, :]
    r = np.sqrt(fx**2 + fy**2)
    filt = np.exp(-(r * scale) ** 2)
    out = np.real(np.fft.ifft2(f * filt))
    out -= out.mean()
    return out / (out.std() + 1e-9)


def fibers(n, count, length, width=1.0):
    """Fibras cortas aleatorias (envueltas), como en papel o fieltro."""
    img = np.zeros((n, n))
    for _ in range(count):
        x, y = rng.uniform(0, n, 2)
        a = rng.uniform(0, np.pi)
        L = rng.uniform(length * 0.4, length)
        curve = rng.uniform(-0.04, 0.04)
        steps = int(L * 2)
        val = rng.choice([-1, 1]) * rng.uniform(0.4, 1.0)
        for s in range(steps):
            a += curve
            x += np.cos(a) * 0.5
            y += np.sin(a) * 0.5
            img[int(y) % n, int(x) % n] += val * width
    return img


def blur_wrap(img, k=1):
    out = img.copy()
    for _ in range(k):
        out = (out + np.roll(out, 1, 0) + np.roll(out, -1, 0) + np.roll(out, 1, 1) + np.roll(out, -1, 1)) / 5
    return out


def save_overlay(name, v, dark=0.35, light=0.25):
    """v en ~[-1,1]: negativo oscurece, positivo aclara."""
    n = v.shape[0]
    rgba = np.zeros((n, n, 4), np.uint8)
    pos = np.clip(v, 0, 1)
    neg = np.clip(-v, 0, 1)
    # mezcla: blanco cálido para luces, marrón profundo para sombras
    a = np.maximum(pos * light, neg * dark)
    is_light = pos * light > neg * dark
    rgba[..., 0] = np.where(is_light, 255, 40)
    rgba[..., 1] = np.where(is_light, 250, 22)
    rgba[..., 2] = np.where(is_light, 235, 12)
    rgba[..., 3] = np.clip(a * 255, 0, 255).astype(np.uint8)
    Image.fromarray(rgba, "RGBA").save(os.path.join(OUT, name), optimize=True)
    print("ok", name)


N = 256

# Papel: grano fino + fibras sutiles + manchas muy suaves
paper = 0.55 * tile_noise(N, 1.2) + 0.15 * tile_noise(N, 25) + 0.45 * blur_wrap(fibers(N, 1400, 10), 1)
paper /= np.abs(paper).max()
save_overlay("paper.png", paper * 1.3, dark=0.22, light=0.18)

# Fieltro: más fibroso y con motas
felt = 0.45 * tile_noise(N, 1.5) + 0.9 * blur_wrap(fibers(N, 3500, 14), 1) + 0.25 * tile_noise(N, 20)
felt /= np.abs(felt).max()
save_overlay("felt.png", felt * 1.6, dark=0.32, light=0.26)

# Tejido de punto (jersey): columnas de "V". Tile 256 = 8 columnas x 10 filas
knit = np.zeros((N, N))
cols, rows = 8, 10
cw, rh = N / cols, N / rows
yy, xx = np.mgrid[0:N, 0:N].astype(float)
for c in range(cols):
    for r in range(rows + 1):
        cx = (c + 0.5) * cw
        cy = r * rh
        for side in (-1, 1):
            # cada mitad de la V es una elipse inclinada
            ex = cx + side * cw * 0.2
            ey = cy + rh * 0.05
            dx = (xx - ex + N / 2) % N - N / 2
            dy = (yy - ey + N / 2) % N - N / 2
            ang = side * 0.55
            u = dx * np.cos(ang) + dy * np.sin(ang)
            v = -dx * np.sin(ang) + dy * np.cos(ang)
            d = (u / (cw * 0.15)) ** 2 + (v / (rh * 0.7)) ** 2
            bump = np.clip(1 - d, 0, 1)
            # luz desde arriba-izquierda dentro de cada lazo
            knit += bump ** 0.6 * (0.55 + 0.45 * np.clip(-v / (rh * 0.62), -1, 1))
knit = knit / knit.max()
knit_v = (knit - 0.45) * 2.0
knit_v += 0.25 * blur_wrap(fibers(N, 1500, 8), 1)
save_overlay("knit.png", np.clip(knit_v, -1, 1), dark=0.5, light=0.22)

# Bouclé / felpa para ribetes (sin pelo): lazos rizados pequeños
boucle = np.zeros((N, N))
for _ in range(700):
    cx, cy = rng.uniform(0, N, 2)
    rad = rng.uniform(3, 6)
    dx = (xx - cx + N / 2) % N - N / 2
    dy = (yy - cy + N / 2) % N - N / 2
    d = np.sqrt(dx**2 + dy**2)
    ring = np.exp(-((d - rad) ** 2) / 1.6)
    shade = 0.4 - 0.6 * (dy / (rad + 1e-6))
    boucle += ring * np.clip(shade, -1, 1) * 0.5
boucle /= np.abs(boucle).max()
save_overlay("boucle.png", boucle * 2.0, dark=0.45, light=0.4)

# Veta de madera (horizontal), tileable
wood = np.zeros((N, N))
for _ in range(60):
    y0 = rng.uniform(0, N)
    amp = rng.uniform(1, 5)
    ph = rng.uniform(0, 2 * np.pi)
    k = rng.integers(1, 3)
    yline = y0 + amp * np.sin(2 * np.pi * k * xx / N + ph)
    dy = (yy - yline + N / 2) % N - N / 2
    wood += rng.choice([-1, 1]) * np.exp(-(dy**2) / rng.uniform(0.3, 2.0)) * rng.uniform(0.3, 1)
wood = blur_wrap(wood, 1) + 0.25 * tile_noise(N, 2)
wood /= np.abs(wood).max()
save_overlay("wood.png", wood * 1.3, dark=0.3, light=0.15)

# Cartón corrugado / cartulina gruesa (para la base del diorama)
card = 0.6 * tile_noise(N, 1.5) + 0.3 * tile_noise(N, 20)
card /= np.abs(card).max()
save_overlay("card.png", card, dark=0.25, light=0.15)
