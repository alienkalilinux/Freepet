#!/usr/bin/env python3
"""Build UserIcon.tsx + public/icons + favicon/logo from user's icon pack.
Reads D:\\ФРИПЕТ\\иконки\\*.svg (flaticon, single-color) and generates:
  frontend/src/components/UserIcon.tsx  — inline currentColor component
  frontend/public/icons/<name>.svg      — normalized copies
  frontend/public/favicon.svg           — paw on gradient (browser tabs)
  frontend/public/logo.svg              — paw on gradient (brand mark)
"""
import os, re, shutil

SRC = r"D:\ФРИПЕТ\иконки"
PUB = r"D:\ФРИПЕТ\frontend\public"
COMP = r"D:\ФРИПЕТ\frontend\src\components\UserIcon.tsx"

FILES = {
    "bird": "free-icon-font-bird-12088780.svg",
    "cat": "free-icon-font-cat-12435964.svg",
    "check": "free-icon-font-check-3917749.svg",
    "cross": "free-icon-font-cross-3917759.svg",
    "dog": "free-icon-font-dog-12435986.svg",
    "dog-leashed": "free-icon-font-dog-leashed-14656006.svg",
    "exit": "free-icon-font-exit-3917349.svg",
    "filter": "free-icon-font-filter-3914366.svg",
    "headset": "free-icon-font-headset-3917617.svg",
    "heart": "free-icon-font-heart-3916585.svg",
    "home": "free-icon-font-home-3917033.svg",
    "menu": "free-icon-font-menu-burger-3917762.svg",
    "send": "free-icon-font-paper-plane-3917567.svg",
    "paw": "free-icon-font-paw-5068980.svg",
    "picture": "free-icon-font-picture-3917317.svg",
    "rabbit": "free-icon-font-rabbit-12436043.svg",
    "stats": "free-icon-font-stats-3916730.svg",
    "trash": "free-icon-font-trash-3917378.svg",
    "fish": "free-icon-font-tropical-fish-19019248.svg",
    "user": "free-icon-font-user-3917688.svg",
    # Fetched via Iconify API (flaticon.com blocks direct downloads):
    # hamster — EmojiOne Monotone (CC BY 4.0), turtle/chat — Material Design Icons (Apache 2.0)
    "hamster": "iconify-hamster.svg",
    "turtle": "iconify-mdi-turtle.svg",
    "chat": "iconify-chat.svg",
}

def parse(path):
    with open(path, encoding="utf-8") as f:
        raw = f.read()
    m = re.search(r'<svg[^>]*viewBox="([^"]+)"[^>]*>(.*)</svg\s*>\s*$', raw, re.DOTALL)
    assert m, f"no svg in {path}"
    viewBox, inner = m.group(1), m.group(2)
    inner = re.sub(r'<!--.*?-->', '', inner, flags=re.DOTALL).strip()
    return viewBox, inner

icons = {}
for name, fn in FILES.items():
    vb, inner = parse(os.path.join(SRC, fn))
    icons[name] = (vb, inner)
    print(name, vb, len(inner), "chars")

# 1. normalized copies
os.makedirs(os.path.join(PUB, "icons"), exist_ok=True)
for name, fn in FILES.items():
    vb, inner = icons[name]
    out = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}">{inner}</svg>'
    with open(os.path.join(PUB, "icons", f"{name}.svg"), "w", encoding="utf-8") as f:
        f.write(out)

# 2. favicon + logo with user paw
paw_vb, paw_inner = icons["paw"]
assert paw_vb == "0 0 24 24", paw_vb

favicon = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
<defs><linearGradient id="fbg" x1="0" y1="0" x2="1" y2="1">
<stop offset="0%" stop-color="#fb923c"/><stop offset="58%" stop-color="#ea580c"/><stop offset="100%" stop-color="#7c2d12"/>
</linearGradient></defs>
<rect x="0" y="0" width="64" height="64" rx="15" fill="url(#fbg)"/>
<g transform="translate(11 12) scale(1.75)" fill="#fff7ed">{paw_inner}</g>
<circle cx="47" cy="45" r="7.5" fill="#34d399" stroke="#fff7ed" stroke-width="2.5"/>
<path d="M44.2 45.2l2 2 3.8-4.2" fill="none" stroke="#fff7ed" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>'''
with open(os.path.join(PUB, "favicon.svg"), "w", encoding="utf-8") as f:
    f.write(favicon)

logo = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
<defs><linearGradient id="lbg" x1="0" y1="0" x2="1" y2="1">
<stop offset="0%" stop-color="#fb923c"/><stop offset="58%" stop-color="#c2410c"/><stop offset="100%" stop-color="#431407"/>
</linearGradient></defs>
<rect x="0" y="0" width="64" height="64" rx="16" fill="url(#lbg)"/>
<g transform="translate(12 13) scale(1.65)" fill="#fff7ed">{paw_inner}</g>
</svg>'''
with open(os.path.join(PUB, "logo.svg"), "w", encoding="utf-8") as f:
    f.write(logo)

# 3. UserIcon.tsx
lines = []
lines.append("'use client';")
lines.append("")
lines.append("import type { ReactNode, SVGProps } from 'react';")
lines.append("")
lines.append("export type UserIconName =")
names = sorted(icons.keys())
for i, n in enumerate(names):
    lines.append(f"  | '{n}'" + (";" if i == len(names) - 1 else ""))
lines.append("")
lines.append("const ICONS: Record<UserIconName, { viewBox: string; body: ReactNode }> = {")
for n in names:
    vb, inner = icons[n]
    lines.append(f"  '{n}': {{")
    lines.append(f'    viewBox: "{vb}",')
    lines.append("    body: (")
    lines.append("      <>")
    for iline in inner.splitlines():
        s = iline.strip()
        if s:
            lines.append(f"        {s}")
    lines.append("      </>")
    lines.append("    ),")
    lines.append("  },")
lines.append("};")
lines.append("")
lines.append("interface UserIconProps extends SVGProps<SVGSVGElement> {")
lines.append("  name: UserIconName;")
lines.append("}")
lines.append("")
lines.append("/** Иконки пользователя (Flaticon): наследуют цвет через currentColor. */")
lines.append("export default function UserIcon({ name, ...props }: UserIconProps) {")
lines.append("  const icon = ICONS[name];")
lines.append("  return (")
lines.append("    <svg viewBox={icon.viewBox} fill=\"currentColor\" aria-hidden=\"true\" focusable=\"false\" {...props}>")
lines.append("      {icon.body}")
lines.append("    </svg>")
lines.append("  );")
lines.append("}")
lines.append("")
lines.append("export { ICONS };")
lines.append("")

with open(COMP, "w", encoding="utf-8") as f:
    f.write("\n".join(lines))
print("wrote", COMP)
