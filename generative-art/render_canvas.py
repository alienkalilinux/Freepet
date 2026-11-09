#!/usr/bin/env python3
"""Ember Atlas — canvas renderer for ФРИПЕТ.
Design philosophy: systematic warmth, specimen grid, 4 hues max.
Outputs (only .png / .pdf + .md philosophy):
  generative-art/ember-atlas.png   — museum plate, single page
  generative-art/ember-atlas.pdf   — same plate, print
  frontend/public/placeholders/*.png — refined pet placeholders (no text)
Seeded randomness -> reproducible. Requires: pillow.
Fonts from canvas-design skill (Latin-only canvas text).
"""
import random, math, os
from PIL import Image, ImageDraw, ImageFont

BASE = r"D:\ФРИПЕТ"
FONTS = r"C:\Users\USER\.agents\skills\canvas-design\canvas-fonts"
OUT_ART = os.path.join(BASE, "generative-art")
OUT_PH = os.path.join(BASE, "frontend", "public", "placeholders")

CREAM = (255, 237, 213)
EMBER = (251, 146, 60)
LEAF = (52, 211, 153)
INK_TOP = (42, 26, 13)
INK_BOT = (22, 13, 5)

SPECIES = [
    ("dog", "canis", 11), ("cat", "felis", 7),
    ("hamster", "cricetus", 21), ("parrot", "psittacus", 33),
    ("fish", "piscis", 44), ("turtle", "testudo", 55),
    ("rabbit", "cuniculus", 66), ("unknown", "ignotus", 99),
]

def font(name, size):
    return ImageFont.truetype(os.path.join(FONTS, name), size)

def vgrad(w, h, top, bot):
    img = Image.new("RGB", (w, h))
    px = img.load()
    for y in range(h):
        t = y / max(1, h - 1)
        px_line = tuple(round(top[i] + (bot[i] - top[i]) * t) for i in range(3))
        for x in range(w):
            px[x, y] = px_line
    return img.convert("RGBA")

def glow_layer(w, h, cx, cy, maxr, color, peak):
    ov = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(ov)
    steps = 26
    for i in range(steps, 0, -1):
        r = maxr * i / steps
        a = peak * (1 - i / steps)
        d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=color + (int(a),))
    return ov

def dots_layer(w, h, rng, gap=30, r=2, alpha=26):
    ov = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(ov)
    y = gap / 2
    while y < h:
        x = gap / 2 + rng.uniform(-2, 2)
        while x < w:
            d.ellipse([x - r, y - r, x + r, y + r], fill=CREAM + (alpha,))
            x += gap + rng.uniform(-3, 3)
        y += gap
    return ov

def arcs_layer(w, h, rng, count, alpha=26, width=3):
    ov = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(ov)
    for _ in range(count):
        x0, y0 = rng.uniform(0, w), rng.uniform(0, h)
        L, A, ph = rng.uniform(120, 340), rng.uniform(30, 130), rng.uniform(0, 6.28)
        pts, n = [], 24
        for i in range(n + 1):
            t = i / n
            pts.append((x0 + t * L, y0 + A * math.sin(ph + t * 4.2)))
        d.line(pts, fill=CREAM + (rng.randint(alpha - 8, alpha + 8),), width=width, joint="curve")
    return ov

def grain_layer(w, h, rng, count, alpha=14):
    ov = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(ov)
    for _ in range(count):
        x, y = rng.uniform(0, w), rng.uniform(0, h)
        d.point((x, y), fill=CREAM + (rng.randint(4, alpha),))
    return ov

# ---------------- emblems (cream linework, centered, radius r) ----------------
def emblem(d, kind, cx, cy, r, wdt, fill):
    c = CREAM + (255,)
    faint = CREAM + (90,)
    if kind == "unknown":  # paw
        d.ellipse([cx - r * 0.52, cy - r * 0.10, cx + r * 0.52, cy + r * 0.78], outline=c, width=wdt)
        for i, (ox, oy, s) in enumerate([(-0.62, -0.42, 0.20), (-0.24, -0.66, 0.21), (0.20, -0.66, 0.21), (0.60, -0.40, 0.20)]):
            d.ellipse([cx + ox * r - s * r, cy + oy * r - s * r, cx + ox * r + s * r, cy + oy * r + s * r], outline=c, width=wdt)
    elif kind == "dog":
        d.ellipse([cx - r * 0.55, cy - r * 0.55, cx + r * 0.55, cy + r * 0.55], outline=c, width=wdt)
        d.ellipse([cx - r * 0.95, cy - r * 0.45, cx - r * 0.45, cy + r * 0.45], outline=c, width=wdt)
        d.ellipse([cx + r * 0.45, cy - r * 0.45, cx + r * 0.95, cy + r * 0.45], outline=c, width=wdt)
        d.ellipse([cx - r * 0.22, cy + r * 0.05, cx + r * 0.22, cy + r * 0.42], outline=c, width=wdt)
        d.ellipse([cx - r * 0.05, cy + r * 0.14, cx + r * 0.05, cy + r * 0.24], fill=fill)
    elif kind == "cat":
        d.ellipse([cx - r * 0.55, cy - r * 0.45, cx + r * 0.55, cy + r * 0.65], outline=c, width=wdt)
        d.polygon([(cx - r * 0.55, cy - r * 0.25), (cx - r * 0.45, cy - r * 0.85), (cx - r * 0.05, cy - r * 0.40)], outline=c)
        d.polygon([(cx + r * 0.55, cy - r * 0.25), (cx + r * 0.45, cy - r * 0.85), (cx + r * 0.05, cy - r * 0.40)], outline=c)
        for s in (-1, 1):
            for k in range(3):
                yy = cy + r * (0.05 + k * 0.12)
                d.line([(cx + s * r * 0.5, yy), (cx + s * r * 0.95, yy + (k - 1) * r * 0.08)], fill=faint, width=max(2, wdt - 2))
        d.ellipse([cx - r * 0.30, cy - r * 0.10, cx - r * 0.18, cy + r * 0.02], fill=fill)
        d.ellipse([cx + r * 0.18, cy - r * 0.10, cx + r * 0.30, cy + r * 0.02], fill=fill)
    elif kind == "hamster":
        d.ellipse([cx - r * 0.75, cy - r * 0.5, cx + r * 0.75, cy + r * 0.6], outline=c, width=wdt)
        d.ellipse([cx - r * 0.62, cy - r * 0.78, cx - r * 0.34, cy - r * 0.50], outline=c, width=wdt)
        d.ellipse([cx + r * 0.34, cy - r * 0.78, cx + r * 0.62, cy - r * 0.50], outline=c, width=wdt)
        d.ellipse([cx - r * 0.45, cy + r * 0.05, cx - r * 0.15, cy + r * 0.35], outline=faint, width=max(2, wdt - 2))
        d.ellipse([cx + r * 0.15, cy + r * 0.05, cx + r * 0.45, cy + r * 0.35], outline=faint, width=max(2, wdt - 2))
        d.ellipse([cx - r * 0.04, cy + r * 0.10, cx + r * 0.04, cy + r * 0.18], fill=fill)
    elif kind == "parrot":
        d.ellipse([cx - r * 0.35, cy - r * 0.15, cx + r * 0.35, cy + r * 0.70], outline=c, width=wdt)
        d.ellipse([cx - r * 0.30, cy - r * 0.65, cx + r * 0.30, cy - r * 0.05], outline=c, width=wdt)
        d.polygon([(cx + r * 0.28, cy - r * 0.35), (cx + r * 0.52, cy - r * 0.22), (cx + r * 0.28, cy - r * 0.08)], outline=c)
        d.ellipse([cx - r * 0.02, cy - r * 0.42, cx + r * 0.08, cy - r * 0.32], fill=fill)
        d.line([(cx - r * 0.8, cy + r * 0.70), (cx + r * 0.8, cy + r * 0.70)], fill=faint, width=wdt)
    elif kind == "fish":
        d.ellipse([cx - r * 0.65, cy - r * 0.38, cx + r * 0.25, cy + r * 0.38], outline=c, width=wdt)
        d.polygon([(cx + r * 0.25, cy), (cx + r * 0.75, cy - r * 0.40), (cx + r * 0.75, cy + r * 0.40)], outline=c)
        d.ellipse([cx - r * 0.45, cy - r * 0.12, cx - r * 0.33, cy + r * 0.00], fill=fill)
        d.arc([cx - r * 0.25, cy - r * 0.38, cx + r * 0.05, cy + r * 0.38], start=250, end=110, fill=faint, width=max(2, wdt - 2))
    elif kind == "turtle":
        d.arc([cx - r * 0.75, cy - r * 0.75, cx + r * 0.75, cy + r * 0.45], start=180, end=360, fill=c, width=wdt)
        d.line([(cx - r * 0.75, cy + r * 0.05), (cx + r * 0.75, cy + r * 0.05)], fill=c, width=wdt)
        d.line([(cx, cy - r * 0.75), (cx, cy + r * 0.05)], fill=faint, width=max(2, wdt - 2))
        d.ellipse([cx + r * 0.75, cy - r * 0.15, cx + r * 1.0, cy + r * 0.10], outline=c, width=wdt)
        for sx, sy in [(-0.5, 0.28), (-0.15, 0.30), (0.25, 0.30), (0.55, 0.26)]:
            d.ellipse([cx + sx * r - r * 0.09, cy + sy * r, cx + sx * r + r * 0.09, cy + sy * r + r * 0.18], outline=faint, width=max(2, wdt - 2))
    elif kind == "rabbit":
        d.ellipse([cx - r * 0.42, cy - r * 0.10, cx + r * 0.42, cy + r * 0.72], outline=c, width=wdt)
        d.ellipse([cx - r * 0.38, cy - r * 0.95, cx - r * 0.08, cy - r * 0.15], outline=c, width=wdt)
        d.ellipse([cx + r * 0.08, cy - r * 0.95, cx + r * 0.38, cy - r * 0.15], outline=c, width=wdt)
        d.ellipse([cx - r * 0.24, cy + r * 0.18, cx - r * 0.14, cy + r * 0.28], fill=fill)

# ---------------- masterpiece plate ----------------
def render_plate():
    W, H = 3000, 2000
    rng = random.Random(20260930)
    base = vgrad(W, H, INK_TOP, INK_BOT)
    base = Image.alpha_composite(base, glow_layer(W, H, W * 0.15, H * 0.06, 900, EMBER, 46))
    base = Image.alpha_composite(base, glow_layer(W, H, W * 0.87, H * 0.08, 780, LEAF, 34))
    base = Image.alpha_composite(base, glow_layer(W, H, W * 0.50, H * 1.06, 1050, (124, 45, 18), 44))
    base = Image.alpha_composite(base, dots_layer(W, H, rng, 34, 2, 22))
    base = Image.alpha_composite(base, arcs_layer(W, H, rng, 26, 22, 3))
    base = Image.alpha_composite(base, grain_layer(W, H, rng, 9000, 12))

    d = ImageDraw.Draw(base)
    f_title = font("YoungSerif-Regular.ttf", 132)
    f_sub = font("WorkSans-Regular.ttf", 46)
    f_mono = font("DMMono-Regular.ttf", 46)
    f_lab = font("WorkSans-Regular.ttf", 42)
    f_foot = font("WorkSans-Regular.ttf", 36)

    M = 140
    d.text((M, 150), "De calore", font=f_title, fill=CREAM + (255,))
    d.text((M + 4, 300), "field plate  ·  nº 01   —   systematic observation of warmth", font=f_sub, fill=CREAM + (170,))
    d.line([(M, 400), (W - M, 400)], fill=CREAM + (70,), width=2)

    # grid 4 x 2
    gx, gy, gw, gh, gap = M, 480, W - 2 * M, 1220, 60
    cw, ch = (gw - 3 * gap) / 4, (gh - gap) / 2
    for i, (key, latin, seed) in enumerate(SPECIES):
        col, row = i % 4, i // 4
        x0, y0 = gx + col * (cw + gap), gy + row * (ch + gap)
        x1, y1 = x0 + cw, y0 + ch
        d.rounded_rectangle([x0, y0, x1, y1], radius=36, outline=CREAM + (56,), width=2)
        d.text((x0 + 30, y0 + 22), f"{i + 1:02d}", font=f_mono, fill=CREAM + (150,))
        d.text((x1 - 30 - d.textlength("seed " + str(seed), font=f_mono), y0 + 22), f"seed {seed}", font=f_mono, fill=CREAM + (110,))
        m_cx, m_cy, mr = (x0 + x1) / 2, y0 + ch * 0.50, 148
        d.ellipse([m_cx - mr, m_cy - mr, m_cx + mr, m_cy + mr], fill=EMBER + (38,))
        d.ellipse([m_cx - mr, m_cy - mr, m_cx + mr, m_cy + mr], outline=CREAM + (90,), width=2)
        d.ellipse([m_cx - mr * 0.72, m_cy - mr * 0.72, m_cx + mr * 0.72, m_cy + mr * 0.72], outline=CREAM + (40,), width=1)
        emblem(d, key, m_cx, m_cy, 118, 5, CREAM + (255,))
        label = latin
        d.text(((x0 + x1) / 2 - d.textlength(label, font=f_lab) / 2, y1 - 78), label, font=f_lab, fill=CREAM + (200,))

    d.line([(M, 1760), (W - M, 1760)], fill=CREAM + (70,), width=2)
    d.text((M, 1796), "ember atlas  —  eight specimens, one fire", font=f_foot, fill=CREAM + (150,))
    right = "plate I  ·  3000 × 2000"
    d.text((W - M - d.textlength(right, font=f_foot), 1796), right, font=f_foot, fill=CREAM + (150,))

    base.convert("RGB").save(os.path.join(OUT_ART, "ember-atlas.png"))
    base.convert("RGB").save(os.path.join(OUT_ART, "ember-atlas.pdf"), "PDF", resolution=300.0)
    print("plate done")

# ---------------- refined placeholders (no text) ----------------
def render_placeholder(key, seed):
    W, H = 1200, 900
    rng = random.Random(seed * 1000 + 7)
    base = vgrad(W, H, INK_TOP, INK_BOT)
    base = Image.alpha_composite(base, glow_layer(W, H, W * 0.16, H * 0.06, 620, EMBER, 52))
    base = Image.alpha_composite(base, glow_layer(W, H, W * 0.86, H * 0.10, 520, LEAF, 36))
    base = Image.alpha_composite(base, glow_layer(W, H, W * 0.50, H * 1.08, 700, (124, 45, 18), 48))
    base = Image.alpha_composite(base, dots_layer(W, H, rng, 30, 2, 24))
    base = Image.alpha_composite(base, arcs_layer(W, H, rng, 15, 24, 3))
    base = Image.alpha_composite(base, grain_layer(W, H, rng, 3500, 12))
    d = ImageDraw.Draw(base)
    cx, cy, mr = W / 2, H * 0.50, 265
    d.ellipse([cx - mr, cy - mr, cx + mr, cy + mr], fill=EMBER + (40,))
    d.ellipse([cx - mr, cy - mr, cx + mr, cy + mr], outline=CREAM + (100,), width=3)
    d.ellipse([cx - mr * 0.78, cy - mr * 0.78, cx + mr * 0.78, cy + mr * 0.78], outline=CREAM + (45,), width=2)
    emblem(d, key, cx, cy, 200, 8, CREAM + (255,))
    base.convert("RGB").save(os.path.join(OUT_PH, f"{key}.png"))
    print("placeholder", key)

if __name__ == "__main__":
    os.makedirs(OUT_ART, exist_ok=True)
    os.makedirs(OUT_PH, exist_ok=True)
    render_plate()
    for key, _latin, seed in SPECIES:
        render_placeholder(key, seed)
