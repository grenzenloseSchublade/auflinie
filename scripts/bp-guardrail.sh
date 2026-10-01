#!/bin/bash
# Breakpoint-Guardrail (STYLEGUIDE BP-1, BP-2, BP-5, BP-6)
#
# Prüft fünf Fehlerklassen:
#  0. Tokens: jeder $bp-… in variables/_layout.scss muss sich zu einem
#     px-Wert auswerten lassen, auch berechnete wie
#     $bp-drawer: math.div($drawer-width, 0.75). Die Map $breakpoints zeigt
#     nur auf diese Tokens.
#  1. @media mit Breite oder Zahl in eigenem SCSS (assets/_sass, assets/css)
#     außerhalb von abstracts/_breakpoints.scss, auch über mehrere Zeilen
#     und mit em/rem. Breiten-Queries entstehen nur über die Mixins up(),
#     down() und between(), die Werte stehen in variables/_layout.scss
#     ($breakpoints). Das Theme-Mixin breakpoint() ist im eigenen Code
#     gesperrt, auch mit Namespace (@include mm.breakpoint(…)). Fähigkeits-
#     Queries wie (hover: hover) oder (prefers-reduced-motion: reduce)
#     bleiben erlaubt.
#  2. Breiten-Abfragen in JS (assets/js ohne Fremdcode) außerhalb von
#     site-utils.js: matchMedia() mit width oder mit einem Argument, das kein
#     Literal ist, und jedes Lesen der Viewport-Breite (innerWidth,
#     window.outerWidth, documentElement.clientWidth, screen.width,
#     visualViewport.width). Ein Vergleich über eine Zwischenvariable ist
#     sonst nicht zu erkennen. Nutzer lesen AuflinieUtils.mq (BP-2).
#  3. Spiegel in site-utils.js: jede Abfrage downXx muss max-width: $bp-xx
#     minus 0.02px lauten.
#  4. Media-Queries in Templates (_layouts, _includes, Seiten im Wurzel-
#     verzeichnis, vor allem das Critical-CSS in _layouts/default.html):
#     min-width nur mit einem $bp-Wert in px, max-width nur mit $bp-Wert
#     minus 0.02px (halboffen wie die Mixins, Register R-6), keine anderen
#     Zahlen-Features, keine em/rem, keine Range-Syntax (BP-5).
#
# Bewusste Ausnahme in JS (z. B. Positionsrechnung, keine Layout-Weiche):
#   // bp-Ausnahme: <Grund>     in der Zeile DIREKT ÜBER der Fundstelle.
#
# Nutzung: scripts/bp-guardrail.sh   (Exit 0 = sauber, 1 = Verstoß)
# Läuft im Lint-Job der CI (nach dem Farb-Guardrail). Negativtests:
# tests/guardrails/run.sh
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


def strip_comments(text, line_comments=True):
    """Kommentare durch Leerzeichen ersetzen, Zeilenumbrüche (und damit
    Zeilennummern) bleiben erhalten. // nur, wenn line_comments (SCSS, JS),
    nicht nach ':' (url(//…), https://)."""
    def blank(m):
        return re.sub(r"[^\n]", " ", m.group(0))
    text = re.sub(r"/\*.*?\*/", blank, text, flags=re.S)
    if line_comments:
        text = re.sub(r"(?<![:\\])//[^\n]*", blank, text)
    return text


def line_of(text, pos):
    return text.count("\n", 0, pos) + 1


def media_preludes(code):
    """(Position, Prelude) je @media, Prelude bis zur öffnenden Klammer."""
    for m in re.finditer(r"@media\b", code):
        end = code.find("{", m.end())
        end = len(code) if end < 0 else end
        yield m.start(), " ".join(code[m.end():end].split())


# --- 0. Tokens ---------------------------------------------------------------
layout = strip_comments(pathlib.Path("assets/_sass/variables/_layout.scss").read_text())
defs = {m.group(1): m.group(2).strip()
        for m in re.finditer(r"^\$([a-zA-Z0-9_-]+)\s*:\s*([^;]+);", layout, re.M)}


def evaluate(name, seen=()):
    """Wert einer Variablen aus _layout.scss in px (float), sonst ValueError."""
    if name in seen or name not in defs:
        raise ValueError(f"${name} nicht in variables/_layout.scss definiert")
    expr = defs[name]
    if re.search(r"\d(\.\d+)?\s*(r?em|%|vw|vh)\b", expr):
        raise ValueError(f"${name}: {expr} ist kein px-Wert")
    expr = re.sub(r"\bmath\.div\(", "_div(", expr)
    expr = re.sub(r"(\d)px\b", r"\1", expr)
    refs = {}
    def ref(m):
        refs[m.group(1)] = evaluate(m.group(1), seen + (name,))
        return repr(refs[m.group(1)])
    expr = re.sub(r"\$([a-zA-Z0-9_-]+)", ref, expr)
    if not re.fullmatch(r"[\d.\s+\-*/(),_div]*", expr):
        raise ValueError(f"${name}: {defs[name]} nicht auswertbar")
    try:
        return float(eval(expr, {"__builtins__": {}}, {"_div": lambda a, b: a / b}))  # noqa: S307
    except Exception as exc:  # noqa: BLE001
        raise ValueError(f"${name}: {defs[name]} nicht auswertbar ({exc})")


hits = []
tokens = {}
for name in defs:
    if name.startswith("bp-"):
        try:
            tokens[name[3:]] = evaluate(name)
        except ValueError as exc:
            hits.append(str(exc))
mapping = re.search(r"^\$breakpoints\s*:\s*\((.*?)\)\s*;", layout, re.M | re.S)
if not mapping:
    hits.append("$breakpoints-Map nicht in variables/_layout.scss gefunden")
else:
    for key, val in re.findall(r"([a-z][a-z0-9-]*)\s*:\s*([^,\n]+)", mapping.group(1)):
        val = val.strip()
        if val != f"$bp-{key}":
            hits.append(f"$breakpoints: {key} zeigt auf {val}, erwartet $bp-{key}")
if "md" not in tokens:
    hits.append("$bp-md nicht in variables/_layout.scss gefunden")
report(
    "VERSTOSS (BP-1) — Breakpoint-Tokens nicht auswertbar:",
    hits,
    "Fix: $bp-… als px-Wert oder als Rechnung aus px-Variablen in variables/_layout.scss\n"
    "(math.div, + - *), die Map $breakpoints zeigt je Schlüssel auf $bp-<schlüssel>.",
)
if hits:
    sys.exit(1)

# --- 1. SCSS -----------------------------------------------------------------
hits = []
files = sorted(pathlib.Path("assets/_sass").rglob("*.scss")) + sorted(pathlib.Path("assets/css").glob("*.scss"))
for f in files:
    if f.as_posix() == "assets/_sass/abstracts/_breakpoints.scss":
        continue
    code = strip_comments(f.read_text())
    for m in re.finditer(r"@include\s+(?:[a-zA-Z_][a-zA-Z0-9_-]*\.)?breakpoint\s*\(", code):
        hits.append(f"{f}:{line_of(code, m.start())}: @include …breakpoint(…) (Theme-Mixin)")
    for pos, prelude in media_preludes(code):
        if re.search(r"width|height|aspect-ratio|resolution|[<>=]|\d|#\{|\$", prelude):
            hits.append(f"{f}:{line_of(code, pos)}: @media {prelude}")
report(
    "VERSTOSS (BP-1) — @media mit Breite oder Zahl außerhalb von abstracts/_breakpoints.scss:",
    hits,
    "Fix: @use \"abstracts/breakpoints\" as *; und @include up(md) / down(md) /\n"
    "between(md, lg). Neue Grenze zuerst als $bp-… in variables/_layout.scss anlegen.",
)

# --- 2. JS -------------------------------------------------------------------
VIEWPORT_READ = re.compile(
    r"\binnerWidth\b"
    r"|\b(?:window|self|globalThis)\s*\.\s*outerWidth\b"
    r"|\bdocumentElement\s*\.\s*clientWidth\b"
    r"|\bdocument\s*\.\s*body\s*\.\s*clientWidth\b"
    r"|\bscreen\s*\.\s*(?:avail)?[wW]idth\b"
    r"|\bvisualViewport\s*\.\s*width\b"
)
hits = []
for f in sorted(pathlib.Path("assets/js").glob("*.js")):
    if f.name == "site-utils.js":
        continue
    raw_lines = f.read_text().splitlines()
    code = strip_comments(f.read_text())
    found = []
    for m in re.finditer(r"matchMedia\s*\(", code):
        lit = re.match(r"""\s*(['"`])([^'"`$]*)\1\s*\)""", code[m.end():])
        if not lit or "width" in lit.group(2):
            arg = code[m.end():m.end() + 60].split("\n")[0]
            found.append((m.start(), f"matchMedia({arg.strip()}"))
    for m in VIEWPORT_READ.finditer(code):
        found.append((m.start(), m.group(0)))
    for pos, what in found:
        n = line_of(code, pos)
        if n > 1 and "bp-Ausnahme:" in raw_lines[n - 2]:
            continue
        hits.append(f"{f}:{n}: {what}")
report(
    "VERSTOSS (BP-2) — Breiten-Abfrage in JS außerhalb von site-utils.js:",
    hits,
    "Fix: window.AuflinieUtils.mq.downMd / downLg / downXl lesen (mit Fallback,\n"
    "falls site-utils.js fehlt). Neue Grenze zuerst in site-utils.js anlegen. Liest\n"
    "der Code die Breite für etwas anderes als eine Layout-Weiche: Zeile\n"
    "'// bp-Ausnahme: <Grund>' direkt darüber.",
)

# --- 3. site-utils.js --------------------------------------------------------
hits = []
utils = pathlib.Path("assets/js/site-utils.js").read_text()
queries = re.findall(r"down([A-Z][a-zA-Z]*):\s*'\(max-width:\s*([0-9.]+)px\)'", utils)
if not queries:
    hits.append("assets/js/site-utils.js: keine Abfragen downXx: '(max-width: …px)' gefunden")
for key, val in queries:
    name = re.sub(r"(?<!^)([A-Z])", r"-\1", key).lower()
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

# --- 4. Templates (Critical-CSS) ---------------------------------------------
hits = []
templates = sorted(pathlib.Path("_layouts").glob("*.html")) + sorted(pathlib.Path("_includes").rglob("*.html")) \
    + sorted(pathlib.Path(".").glob("*.html"))
for f in templates:
    code = strip_comments(f.read_text(), line_comments=False)
    code = re.sub(r"<!--.*?-->", lambda m: re.sub(r"[^\n]", " ", m.group(0)), code, flags=re.S)
    for pos, prelude in media_preludes(code):
        n = line_of(code, pos)
        if re.search(r"[<>]=?|=", prelude):
            hits.append(f"{f}:{n}: Range-Syntax in @media {prelude} (BP-5)")
            continue
        for feat in re.findall(r"\(([^()]*)\)", prelude):
            if not re.search(r"\d", feat):
                continue
            m = re.fullmatch(r"\s*(min|max)-width\s*:\s*([0-9.]+)px\s*", feat)
            if not m:
                hits.append(f"{f}:{n}: ({feat.strip()}) — nur min-/max-width in px erlaubt")
                continue
            kind, v = m.group(1), float(m.group(2))
            if not any(abs(v - (t if kind == "min" else t - GAP)) < 1e-9 for t in tokens.values()):
                hits.append(f"{f}:{n}: {kind}-width: {m.group(2)}px passt zu keinem $bp-Wert"
                            + (" (max-width = $bp - 0.02px)" if kind == "max" else ""))
report(
    "VERSTOSS (BP-1, R-6) — Media-Query im Template weicht von den Breakpoints ab:",
    hits,
    "Fix: min-width = $bp-Wert, max-width = $bp-Wert - 0.02px (wie up()/down()), in px.",
)

if fail:
    sys.exit(1)
print(f"Breakpoint-Guardrail OK: @media nur über Mixins, JS nur über AuflinieUtils.mq, "
      f"site-utils.js und Templates passen zu {len(tokens)} Tokens ({', '.join(f'{k} {v:g}px' for k, v in tokens.items())})")
PY
