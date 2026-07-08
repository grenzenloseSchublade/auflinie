#!/usr/bin/env python3
"""Kaskaden-Check: Welche Regel GEWINNT effektiv für einen Selektor?

Hintergrund: Das Theme setzt u. a. `.page__content p, li, dl { font-size: 1em }`
und blanket-Resets — niedrig-spezifische eigene Deklarationen sind dann TOT,
obwohl sie im CSS stehen. Dieses Skript rechnet für gegebene Selektor-Muster
die effektiv gewinnenden Deklarationen im GEBAUTEN CSS nach (Spezifität +
Reihenfolge), statt nur zu prüfen, ob eine Regel existiert.

Nutzung:
  python3 scripts/cascade-check.py _site/assets/css/main.css \
      '.cv-skill-group__title' '.blog-notice__text' [...]
  # optional: --props font-size,margin,line-height   (Default: typo-Set)

Grenzen: Media Queries werden entfernt (Desktop-Sicht), Pseudo-Klassen-
Zustände (:hover …) werden ignoriert. Für MQ-Fälle im Quell-CSS greppen.
Siehe Memory/Doku: „Kaskaden-Falle Theme-Absätze".
"""
import re
import sys

DEFAULT_PROPS = ("font-size", "margin", "margin-top", "margin-bottom",
                 "line-height", "padding", "padding-top", "padding-bottom")


def specificity(sel: str):
    ids = len(re.findall(r"#[\w-]+", sel))
    cls = len(re.findall(r"\.[\w-]+|\[[^\]]*\]|:(?!:)[\w-]+", sel))
    els = len(re.findall(r"(?:^|[\s>+~(])([a-z][\w-]*)", sel))
    return (ids, cls, els)


def main() -> int:
    args = [a for a in sys.argv[1:]]
    props = DEFAULT_PROPS
    if "--props" in args:
        i = args.index("--props")
        props = tuple(args[i + 1].split(","))
        del args[i:i + 2]
    if len(args) < 2:
        print(__doc__)
        return 2
    css_path, patterns = args[0], args[1:]

    css = re.sub(r"@media[^{]*\{", "", open(css_path).read())

    for pattern in patterns:
        print(f"== {pattern} ==")
        winners = {}
        for i, m in enumerate(re.finditer(r"([^{}]+)\{([^}]*)\}", css)):
            for sel in m.group(1).split(","):
                s = sel.strip()
                # Regel muss das Muster enthalten UND darauf enden können
                # (grobe Heuristik: Muster ist letzter Compound-Bestandteil)
                if pattern not in s:
                    continue
                if "::" in s or ":hover" in s or ":focus" in s:
                    continue
                spec = specificity(s)
                for decl in m.group(2).split(";"):
                    if ":" not in decl:
                        continue
                    prop, val = decl.split(":", 1)
                    prop = prop.strip()
                    if prop in props:
                        key = (spec, i)
                        if prop not in winners or key >= winners[prop][0]:
                            winners[prop] = (key, val.strip(), s)
        if not winners:
            print("  (keine matchenden Regeln)")
        for prop in props:
            if prop in winners:
                _, val, sel = winners[prop]
                print(f"  {prop:15} = {val:30} <- {sel[:70]}")
        print("  Hinweis: shorthand (margin) vs. longhand (margin-top) separat")
        print("  bewerten — bei gleicher Spezifität gewinnt die spätere Regel.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
