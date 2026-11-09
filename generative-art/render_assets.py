#!/usr/bin/env python3
"""Warm Emergence — deterministic SVG asset renderer for ФРИПЕТ.
Seeded randomness (random.Random per species) -> reproducible placeholders.
No external deps, stdlib only.
"""
import random, math, os

OUT_PUBLIC = r"D:\ФРИПЕТ\frontend\public"
PLACEHOLDER_DIR = os.path.join(OUT_PUBLIC, "placeholders")

SPECIES = {
    "dog":      {"seed": 11, "hue": "#fb923c", "glow": "#ea580c", "label": "Собака"},
    "cat":      {"seed": 7,  "hue": "#fbbf24", "glow": "#f97316", "label": "Кошка"},
    "hamster":  {"seed": 21, "hue": "#fcd34d", "glow": "#fb923c", "label": "Хомяк"},
    "parrot":   {"seed": 33, "hue": "#34d399", "glow": "#059669", "label": "Попугай"},
    "fish":     {"seed": 44, "hue": "#5eead4", "glow": "#0d9488", "label": "Рыбка"},
    "turtle":   {"seed": 55, "hue": "#a3e635", "glow": "#4d7c0f", "label": "Черепаха"},
    "rabbit":   {"seed": 66, "hue": "#fdba74", "glow": "#ea580c", "label": "Кролик"},
    "unknown":  {"seed": 99, "hue": "#fdba74", "glow": "#c2410c", "label": "Питомец"},
}

# SpeciesIcon paths (48x48, stroke) reused as placeholder glyphs
GLYPHS = {
    "dog": '<circle cx="24" cy="26" r="11"/><path d="M13.5 23c-3.5-1-5-6.5-3.8-11 4.5-.5 8 1.8 9 6.5"/><path d="M34.5 23c3.5-1 5-6.5 3.8-11-4.5-.5-8 1.8-9 6.5"/><ellipse cx="24" cy="29.5" rx="2" ry="1.5"/><path d="M24 31v2.5M24 33.5c-1.8 1.8-4.5 1.8-6 0M24 33.5c1.8 1.8 4.5 1.8 6 0"/>',
    "cat": '<circle cx="24" cy="27" r="10"/><path d="M16 21l-3-10 8.5 5M32 21l3-10-8.5 5"/><path d="M22 30.5h4l-2 2.2z"/><path d="M9 28.5h6M9.5 32.5l5.8-1M39 28.5h-6M38.5 32.5l-5.8-1"/>',
    "hamster": '<ellipse cx="24" cy="28" rx="12" ry="10"/><circle cx="14.5" cy="18.5" r="3"/><circle cx="33.5" cy="18.5" r="3"/><path d="M24 30.5v2M22 33.5c1 1.2 3 1.2 4 0"/>',
    "parrot": '<path d="M8 39h32"/><path d="M25 37c-5.5-1.5-9-6-9-11.5C16 19 20.5 14 26 14c4.5 0 8 3.2 8.6 7.5l4.4 2.6-4.2 1.2c-.8 5-4.4 9.4-9.8 11.7z"/><path d="M27 14c.2-3 2-5 5-5.5"/>',
    "fish": '<ellipse cx="21" cy="24" rx="10" ry="7"/><path d="M31 24l8.5-6.5v13z"/><path d="M24 18.5c-1.2 3.4-1.2 7.6 0 11"/>',
    "turtle": '<path d="M9 30c0-8 6.5-14 15-14s15 6 15 14"/><path d="M24 16v14M16.5 19.5L13.5 30M31.5 19.5l3 10.5"/><path d="M7 30h34"/><circle cx="40" cy="26.5" r="3"/>',
    "rabbit": '<ellipse cx="26" cy="31" rx="10" ry="8"/><path d="M21 24c-2-7-2-13.5.5-18 2.8.5 3.8 7 3.3 14"/><path d="M29.5 24c.5-7 2-12.5 5-15 2 2.5.8 9.5-1.5 15"/>',
    "unknown": '<path d="M24 27c-5.2 0-9.5 3.6-9.5 7.5 0 2.6 2.1 4.2 4.7 4.2 1.5 0 2.6-.5 4.8-.5s3.3.5 4.8.5c2.6 0 4.7-1.6 4.7-4.2 0-3.9-4.3-7.5-9.5-7.5z"/><ellipse cx="12" cy="17.5" rx="2.6" ry="3.4"/><ellipse cx="19" cy="11.5" rx="2.6" ry="3.4"/><ellipse cx="29" cy="11.5" rx="2.6" ry="3.4"/><ellipse cx="36" cy="17.5" rx="2.6" ry="3.4"/>',
}

def flow_arcs(rng, w, h, count=14):
    parts = []
    for _ in range(count):
        x0 = rng.uniform(0, w); y0 = rng.uniform(0, h)
        amp = rng.uniform(40, 150); length = rng.uniform(120, 320)
        segs = 8; d = f"M {x0:.1f} {y0:.1f}"
        x, y = x0, y0
        phase = rng.uniform(0, 6.28)
        for i in range(1, segs + 1):
            x += length / segs
            y += math.sin(phase + i * 0.7) * amp / segs
            d += f" L {x:.1f} {y:.1f}"
        op = round(rng.uniform(0.10, 0.28), 2)
        sw = round(rng.uniform(1.2, 3.2), 1)
        parts.append(f'<path d="{d}" fill="none" stroke="#ffedd5" stroke-opacity="{op}" stroke-width="{sw}" stroke-linecap="round"/>')
    return "\n".join(parts)

def dots(rng, w, h, gap=28, r=1.6, opacity=0.16):
    parts = []
    y = gap / 2
    while y < h:
        x = gap / 2 + rng.uniform(-2, 2)
        while x < w:
            # skip center glow zone slightly
            parts.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r}" fill="#ffedd5" fill-opacity="{opacity}"/>')
            x += gap + rng.uniform(-3, 3)
        y += gap
    return "\n".join(parts)

def placeholder_svg(key, cfg):
    rng = random.Random(cfg["seed"])
    w, h = 800, 600
    gid = f"g-{key}"
    arcs = flow_arcs(rng, w, h, 16)
    dot = dots(rng, w, h)
    glyph = GLYPHS[key]
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" role="img" aria-label="{cfg["label"]} — ФРИПЕТ">
<defs>
<radialGradient id="{gid}-a" cx="18%" cy="8%" r="65%">
<stop offset="0%" stop-color="{cfg["hue"]}" stop-opacity="0.55"/><stop offset="100%" stop-color="{cfg["hue"]}" stop-opacity="0"/>
</radialGradient>
<radialGradient id="{gid}-b" cx="86%" cy="12%" r="60%">
<stop offset="0%" stop-color="#34d399" stop-opacity="0.35"/><stop offset="100%" stop-color="#34d399" stop-opacity="0"/>
</radialGradient>
<radialGradient id="{gid}-c" cx="50%" cy="108%" r="75%">
<stop offset="0%" stop-color="{cfg["glow"]}" stop-opacity="0.5"/><stop offset="100%" stop-color="{cfg["glow"]}" stop-opacity="0"/>
</radialGradient>
<linearGradient id="{gid}-bg" x1="0" y1="0" x2="0" y2="1">
<stop offset="0%" stop-color="#2a1a0d"/><stop offset="55%" stop-color="#221407"/><stop offset="100%" stop-color="#160d05"/>
</linearGradient>
</defs>
<rect width="{w}" height="{h}" fill="url(#{gid}-bg)"/>
<rect width="{w}" height="{h}" fill="url(#{gid}-a)"/>
<rect width="{w}" height="{h}" fill="url(#{gid}-b)"/>
<rect width="{w}" height="{h}" fill="url(#{gid}-c)"/>
{dot}
{arcs}
<ellipse cx="{w/2}" cy="{h*0.52}" rx="190" ry="170" fill="{cfg["hue"]}" fill-opacity="0.22"/>
<ellipse cx="{w/2}" cy="{h*0.52}" rx="140" ry="126" fill="none" stroke="#ffedd5" stroke-opacity="0.35" stroke-width="2"/>
<g transform="translate({w/2-120},{h*0.52-120}) scale(5)" fill="none" stroke="#ffedd5" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" opacity="0.95">
{glyph}
</g>
<text x="{w/2}" y="{h-46}" text-anchor="middle" font-family="Verdana, sans-serif" font-size="26" font-weight="700" letter-spacing="6" fill="#ffedd5" fill-opacity="0.85">ФРИПЕТ · {cfg["label"]}</text>
</svg>'''
    return svg

def favicon_svg():
    return '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
<defs><linearGradient id="fbg" x1="0" y1="0" x2="1" y2="1">
<stop offset="0%" stop-color="#fb923c"/><stop offset="58%" stop-color="#ea580c"/><stop offset="100%" stop-color="#7c2d12"/>
</linearGradient></defs>
<rect x="0" y="0" width="64" height="64" rx="15" fill="url(#fbg)"/>
<ellipse cx="32" cy="34" rx="17" ry="14" fill="#fff7ed" opacity="0.22"/>
<g transform="translate(14 15) scale(1.5)" fill="#fff7ed">
<ellipse cx="12" cy="6.5" rx="3.1" ry="4"/>
<ellipse cx="20" cy="4" rx="3.1" ry="4"/>
<ellipse cx="28" cy="4" rx="3.1" ry="4"/>
<ellipse cx="36" cy="6.5" rx="3.1" ry="4"/>
<path d="M24 15c-5.6 0-10 3.8-10 7.9 0 2.7 2.2 4.4 4.9 4.4 1.6 0 2.8-.5 5.1-.5s3.5.5 5.1.5c2.7 0 4.9-1.7 4.9-4.4 0-4.1-4.4-7.9-10-7.9z"/>
</g>
<circle cx="47" cy="45" r="7.5" fill="#34d399" stroke="#fff7ed" stroke-width="2.5"/>
<path d="M44.2 45.2l2 2 3.8-4.2" fill="none" stroke="#fff7ed" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>'''

def logo_svg():
    return '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
<defs><linearGradient id="lbg" x1="0" y1="0" x2="1" y2="1">
<stop offset="0%" stop-color="#fb923c"/><stop offset="58%" stop-color="#c2410c"/><stop offset="100%" stop-color="#431407"/>
</linearGradient></defs>
<rect x="0" y="0" width="64" height="64" rx="16" fill="url(#lbg)"/>
<g transform="translate(12 13) scale(1.65)" fill="#fff7ed">
<ellipse cx="12" cy="6.5" rx="2.9" ry="3.8"/>
<ellipse cx="20" cy="4" rx="2.9" ry="3.8"/>
<ellipse cx="28" cy="4" rx="2.9" ry="3.8"/>
<ellipse cx="36" cy="6.5" rx="2.9" ry="3.8"/>
<path d="M24 15c-5.6 0-10 3.8-10 7.9 0 2.7 2.2 4.4 4.9 4.4 1.6 0 2.8-.5 5.1-.5s3.5.5 5.1.5c2.7 0 4.9-1.7 4.9-4.4 0-4.1-4.4-7.9-10-7.9z"/>
</g>
</svg>'''

def hero_svg():
    rng = random.Random(20260930)
    w, h = 1200, 520
    arcs = flow_arcs(rng, w, h, 22)
    dot = dots(rng, w, h, gap=30, r=1.8, opacity=0.20)
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" preserveAspectRatio="xMidYMid slice">
<defs>
<radialGradient id="h-a" cx="15%" cy="0%" r="60%">
<stop offset="0%" stop-color="#f97316" stop-opacity="0.5"/><stop offset="100%" stop-color="#f97316" stop-opacity="0"/>
</radialGradient>
<radialGradient id="h-b" cx="88%" cy="10%" r="55%">
<stop offset="0%" stop-color="#10b981" stop-opacity="0.4"/><stop offset="100%" stop-color="#10b981" stop-opacity="0"/>
</radialGradient>
<linearGradient id="h-bg" x1="0" y1="0" x2="0" y2="1">
<stop offset="0%" stop-color="#3a2412" stop-opacity="0.0"/><stop offset="100%" stop-color="#1c1108" stop-opacity="0.0"/>
</linearGradient>
</defs>
<rect width="{w}" height="{h}" fill="url(#h-bg)"/>
<rect width="{w}" height="{h}" fill="url(#h-a)"/>
<rect width="{w}" height="{h}" fill="url(#h-b)"/>
{dot}
{arcs}
<g opacity="0.9" transform="translate({w-210},90) scale(3.4)" fill="none" stroke="#ffedd5" stroke-opacity="0.5" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
{GLYPHS["unknown"]}
</g>
<g opacity="0.55" transform="translate(80,300) scale(2.2)" fill="none" stroke="#fdba74" stroke-opacity="0.6" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
{GLYPHS["dog"]}
</g>
<g opacity="0.55" transform="translate(260,120) scale(2.2)" fill="none" stroke="#fcd34d" stroke-opacity="0.6" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
{GLYPHS["cat"]}
</g>
</svg>'''

def main():
    os.makedirs(PLACEHOLDER_DIR, exist_ok=True)
    for key, cfg in SPECIES.items():
        p = os.path.join(PLACEHOLDER_DIR, f"{key}.svg")
        with open(p, "w", encoding="utf-8") as f:
            f.write(placeholder_svg(key, cfg))
        print("wrote", p)
    with open(os.path.join(OUT_PUBLIC, "favicon.svg"), "w", encoding="utf-8") as f:
        f.write(favicon_svg())
    print("wrote favicon.svg")
    with open(os.path.join(OUT_PUBLIC, "logo.svg"), "w", encoding="utf-8") as f:
        f.write(logo_svg())
    print("wrote logo.svg")
    with open(os.path.join(OUT_PUBLIC, "hero-decor.svg"), "w", encoding="utf-8") as f:
        f.write(hero_svg())
    print("wrote hero-decor.svg")

if __name__ == "__main__":
    main()
