#!/bin/bash
# Breakpoint-Guardrail (STYLEGUIDE BP-1, BP-2, BP-6)
#
# Prüft vier Fehlerklassen:
#  1. @media mit Breite oder Zahl in eigenem SCSS (assets/_sass, assets/css)
#     außerhalb von abstracts/_breakpoints.scss. Breiten-Queries entstehen
#     nur über die Mixins up(), down() und between(), die Werte stehen in
#     variables/_layout.scss ($breakpoints). Das Theme-Mixin breakpoint()
#     ist im eigenen Code ebenfalls gesperrt. Fähigkeits-Queries wie
#     (hover: hover) oder (prefers-reduced-motion: reduce) bleiben erlaubt.
#  2. Breiten-Abfragen in JS (assets/js ohne Fremdcode) außerhalb von
#     site-utils.js: matchMedia() mit width, innerWidth im Vergleich mit
#     einer Zahl. Nutzer lesen AuflinieUtils.mq (BP-2).
#  3. Spiegel in site-utils.js: jede Abfrage downXx muss max-width: $bp-xx
#     minus 0.02px lauten.
#  4. Spiegel im Critical-CSS (_layouts/default.html): min-width nur mit einem
#     $bp-Wert, max-width nur mit $bp-Wert minus 0.02px (halboffen wie die
#     Mixins, Register R-6).
#
# Nutzung: scripts/bp-guardrail.sh   (Exit 0 = sauber, 1 = Verstoß)
# Läuft im Lint-Job der CI (nach dem Farb-Guardrail).
set -u
cd "$(dirname "$0")/.."

python3 - <<'PY'
import pathlib
import re
import sys

fail = False
GAP = 0.02


def report(title, hits, fix):
    global fail
    if not hits:
        return
    fail = True
    print(title)
    for h in hits:
        print("  " + h)
    print(fix)
    print()


def code_of(line):
    """Zeile ohne //- und einzeilige /* */-Kommentare."""
    line = re.sub(r"/\*.*?\*/", "", line)
    return re.sub(r"(^|[ \t])//.*$", "", line)


# --- Tokens ------------------------------------------------------------------
layout = pathlib.Path("assets/_sass/variables/_layout.scss").read_text()
tokens = {m.group(1): float(m.group(2))
          for m in re.finditer(r"^\$bp-([a-z-]+):\s*([0-9.]+)px;", layout, re.M)}
if "md" not in tokens:
    print("bp-guardrail: $bp-md nicht in variables/_layout.scss gefunden")
    sys.exit(1)

# --- 1. SCSS -----------------------------------------------------------------
hits = []
files = sorted(pathlib.Path("assets/_sass").rglob("*.scss")) + sorted(pathlib.Path("assets/css").glob("*.scss"))
for f in files:
    if f.as_posix() == "assets/_sass/abstracts/_breakpoints.scss":
        continue
    for n, line in enumerate(f.read_text().splitlines(), 1):
        code = code_of(line)
        if re.search(r"@include\s+breakpoint\(", code):
            hits.append(f"{f}:{n}: {line.strip()}")
            continue
        if "@media" not in code:
            continue
        if re.search(r"width|height|aspect-ratio|resolution", code) or re.search(r"\d", code) or "#{" in code:
            hits.append(f"{f}:{n}: {line.strip()}")
report(
    "VERSTOSS (BP-1) — @media mit Breite oder Zahl außerhalb von abstracts/_breakpoints.scss:",
    hits,
    "Fix: @use \"abstracts/breakpoints\" as *; und @include up(md) / down(md) /\n"
    "between(md, lg). Neue Grenze zuerst als $bp-… in variables/_layout.scss anlegen.",
)

# --- 2. JS -------------------------------------------------------------------
hits = []
for f in sorted(pathlib.Path("assets/js").glob("*.js")):
    if f.name == "site-utils.js":
        continue
    for n, line in enumerate(f.read_text().splitlines(), 1):
        code = code_of(line)
        if re.search(r"matchMedia\([^)]*width", code) \
                or re.search(r"innerWidth\s*[<>]=?\s*[0-9]", code) \
                or re.search(r"[0-9]\s*[<>]=?\s*(window\.)?innerWidth", code):
            hits.append(f"{f}:{n}: {line.strip()}")
report(
    "VERSTOSS (BP-2) — Breiten-Abfrage in JS außerhalb von site-utils.js:",
    hits,
    "Fix: window.AuflinieUtils.mq.downMd / downLg / downXl lesen (mit Fallback,\n"
    "falls site-utils.js fehlt). Neue Grenze zuerst in site-utils.js anlegen.",
)

# --- 3. site-utils.js --------------------------------------------------------
hits = []
utils = pathlib.Path("assets/js/site-utils.js").read_text()
queries = re.findall(r"down([A-Z][a-zA-Z]*):\s*'\(max-width:\s*([0-9.]+)px\)'", utils)
if not queries:
    hits.append("assets/js/site-utils.js: keine Abfragen downXx: '(max-width: …px)' gefunden")
for key, val in queries:
    name = key[0].lower() + key[1:]
    if name not in tokens:
        hits.append(f"assets/js/site-utils.js: down{key} ohne $bp-{name} in variables/_layout.scss")
    elif abs(float(val) - (tokens[name] - GAP)) > 1e-9:
        hits.append(f"assets/js/site-utils.js: down{key} = {val}px, erwartet {tokens[name] - GAP:g}px ($bp-{name} - {GAP}px)")
for f in sorted(pathlib.Path("assets/js").glob("*.js")):
    for key in set(re.findall(r"\bmq\.down([A-Z][a-zA-Z]*)", f.read_text())):
        if key not in {k for k, _ in queries}:
            hits.append(f"{f}: nutzt mq.down{key}, site-utils.js kennt es nicht")
report(
    "VERSTOSS (BP-2) — site-utils.js passt nicht zu den Tokens:",
    hits,
    "Fix: Werte in assets/js/site-utils.js an variables/_layout.scss angleichen.",
)

# --- 4. Critical-CSS ---------------------------------------------------------
hits = []
crit = pathlib.Path("_layouts/default.html")
for n, line in enumerate(crit.read_text().splitlines(), 1):
    for kind, val in re.findall(r"@media[^{]*?\((min|max)-width:\s*([0-9.]+)px\)", line):
        v = float(val)
        ok = any(abs(v - (t if kind == "min" else t - GAP)) < 1e-9 for t in tokens.values())
        if not ok:
            hits.append(f"{crit}:{n}: {kind}-width: {val}px")
    if re.search(r"@media[^{]*\d+(\.\d+)?(em|rem)\b", line):
        hits.append(f"{crit}:{n}: em-Breite im Critical-CSS")
report(
    "VERSTOSS (BP-1, R-6) — Critical-CSS weicht von den Breakpoints ab:",
    hits,
    "Fix: min-width = $bp-Wert, max-width = $bp-Wert - 0.02px (wie up()/down()).",
)

if fail:
    sys.exit(1)
print(f"Breakpoint-Guardrail OK: @media nur über Mixins, JS nur über AuflinieUtils.mq, "
      f"site-utils.js und Critical-CSS passen zu {len(tokens)} Tokens")
PY
