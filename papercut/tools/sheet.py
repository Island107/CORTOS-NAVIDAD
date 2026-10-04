"""Hace una hoja de contacto con cuadros renderizados: sheet.py out.png cols w img1 img2 ..."""
import sys
from PIL import Image, ImageDraw
out, cols, w = sys.argv[1], int(sys.argv[2]), int(sys.argv[3])
files = sys.argv[4:]
h = int(w * 16 / 9)
rows = (len(files) + cols - 1) // cols
sheet = Image.new("RGB", (cols * w, rows * (h + 22)), (30, 30, 30))
d = ImageDraw.Draw(sheet)
for i, f in enumerate(files):
    im = Image.open(f).convert("RGB").resize((w, h))
    x, y = (i % cols) * w, (i // cols) * (h + 22)
    sheet.paste(im, (x, y + 22))
    d.text((x + 4, y + 4), f.split("/")[-1], fill=(255, 255, 255))
sheet.save(out)
