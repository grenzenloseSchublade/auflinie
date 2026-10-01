#!/usr/bin/env python3
"""Skalen-Literale in assets/_sass zählen (STYLEGUIDE.md SP-1, RAD-1, Z-3, MO-1, MO-2).

Findet Zahlenwerte, die eine Skala ersetzen soll, außerhalb der Token-Zentrale
assets/_sass/variables/. Gezählt werden nur CSS-Deklarationen. Sass-Variablen
($name: …) und Custom Properties (--name: …) sind benannte Werte und zählen
nicht, ebenso Kommentare.

Kategorien (je Kategorie eine Zahl im Ratchet):
  spacing        px-, rem- und em-Literale ungleich 0 in margin*, padding*,
                 gap, row-gap, column-gap, scroll-margin*, scroll-padding*
                 (je Literal)
  radius         Literale ungleich 0 in border-*radius, dazu das Radius-
                 Argument von card-panel() (je Literal)
  shadow         box-shadow-Deklarationen mit Zahlenwerten (je Deklaration,
                 none und reine Token zählen nicht)
  z-index        Zahlen in z-index (je Deklaration)
  duration       Zeitliterale ungleich 0 in transition* und animation* (je Literal)
  easing         cubic-bezier() und steps() in transition* und animation*
  transition-all transition mit all oder ohne Eigenschaft (MO-1, je Deklaration)

Ausnahmen: `// skala-Ausnahme: <Grund>` in der Zeile direkt über der
Deklaration, oder als Block `// skala-Ausnahme: [Block] <Grund>` …
`// skala-Ausnahme-Ende`. Markierte Literale zählen nicht.

Nutzung:
  python3 scripts/scale-literals.py --check scripts/scale-baseline.txt
      Exit 1, wenn eine Kategorie über ihrem Grenzwert liegt (Ratchet).
  python3 scripts/scale-literals.py --update scripts/scale-baseline.txt
      schreibt die aktuellen Zahlen, aber nur nach unten.
  python3 scripts/scale-literals.py --report
      Inventar als Markdown (Werte, Häufigkeit, Fundstellen).
  python3 scripts/scale-literals.py --json
      alle Fundstellen als JSON.
Normaler Einstieg ist scripts/scale-guardrail.sh.
"""
import collections
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SASS = ROOT / "assets" / "_sass"
CATEGORIES = ["spacing", "radius", "shadow", "z-index", "duration", "easing", "transition-all"]

SPACING_PROP = re.compile(
    r"^(margin|padding|gap|row-gap|column-gap|scroll-margin|scroll-padding)(-[a-z-]+)?$"
)
RADIUS_PROP = re.compile(r"^border(-[a-z]+)*-radius$")
MOTION_PROP = re.compile(r"^(transition|animation)(-[a-z-]+)?$")
NUM = re.compile(r"(?<![\w$.#-])(-?(?:\d+\.?\d*|\.\d+))([a-z%]*)")
TIME = re.compile(r"(?<![\w$.#-])((?:\d+\.?\d*|\.\d+))(ms|s)\b")
MARK = "skala-Ausnahme:"


def strip(text):
    """Kommentare und Interpolationsklammern neutralisieren, Zeilen erhalten.

    Gibt den Code mit Leerzeichen statt Kommentaren zurück (gleiche Länge,
    gleiche Zeilenumbrüche), damit Zeilennummern stimmen.
    """
    out = []
    i = 0
    n = len(text)
    quote = None
    while i < n:
        c = text[i]
        if quote:
            out.append(c)
            if c == "\\" and i + 1 < n:
                out.append(text[i + 1])
                i += 2
                continue
            if c == quote:
                quote = None
            i += 1
            continue
        if c in "\"'":
            quote = c
            out.append(c)
            i += 1
            continue
        if text.startswith("/*", i):
            j = text.find("*/", i + 2)
            j = n if j < 0 else j + 2
            out.append("".join(ch if ch == "\n" else " " for ch in text[i:j]))
            i = j
            continue
        if text.startswith("//", i) and (i == 0 or text[i - 1] != ":"):
            j = text.find("\n", i)
            j = n if j < 0 else j
            out.append(" " * (j - i))
            i = j
            continue
        if text.startswith("#{", i):
            depth = 0
            j = i
            while j < n:
                if text[j] == "{":
                    depth += 1
                elif text[j] == "}":
                    depth -= 1
                    if depth == 0:
                        break
                j += 1
            out.append(" " * (j + 1 - i))
            i = j + 1
            continue
        out.append(c)
        i += 1
    return "".join(out)


def statements(code):
    """(Startzeile, Text, Endzeichen) je Statement, getrennt an ; { }."""
    buf = []
    start = None
    line = 1
    depth = 0
    quote = None
    for c in code:
        if quote:
            buf.append(c)
            if c == quote:
                quote = None
        elif c in "\"'":
            quote = c
            buf.append(c)
        elif c == "(":
            depth += 1
            buf.append(c)
        elif c == ")":
            depth -= 1
            buf.append(c)
        elif depth == 0 and c in ";{}":
            text = "".join(buf).strip()
            if text:
                yield start, text, c
            buf = []
            start = None
        else:
            if start is None and not c.isspace():
                start = line
            buf.append(c)
        if c == "\n":
            line += 1


def marked_lines(raw_lines):
    """Zeilennummern, für die ein skala-Ausnahme-Marker gilt."""
    marked = set()
    block = False
    for idx, ln in enumerate(raw_lines, start=1):
        if MARK in ln and "[Block]" in ln:
            block = True
            continue
        if "skala-Ausnahme-Ende" in ln:
            block = False
            continue
        if block:
            marked.add(idx)
        if MARK in ln and ln.strip().startswith("//"):
            marked.add(idx + 1)
    return marked


def nonzero(num):
    return float(num) != 0.0


def scan_file(path):
    raw = path.read_text(encoding="utf-8")
    raw_lines = raw.split("\n")
    marked = marked_lines(raw_lines)
    rel = str(path.relative_to(ROOT))
    for line, text, end in statements(strip(raw)):
        if end == "{":
            continue  # Selektor oder At-Rule-Kopf
        # Radius-Argument von card-panel()
        m = re.match(r"@(include|mixin)\s+card-panel\s*\((.*)\)\s*$", text, re.S)
        if m:
            args = [a.strip() for a in m.group(2).split(",")]
            if len(args) >= 2:
                val = args[1].split(":")[-1].strip()
                for nm in NUM.finditer(val):
                    if nonzero(nm.group(1)):
                        yield dict(cat="radius", file=rel, line=line, prop="card-panel($radius)",
                                   value=nm.group(0), decl=text, marked=line in marked)
            continue
        m = re.match(r"^([a-z][a-z-]*)\s*:\s*(.*)$", text, re.S)
        if not m:
            continue
        prop, value = m.group(1), " ".join(m.group(2).split())
        value = re.sub(r"\s*!important$", "", value)
        mk = line in marked
        base = dict(file=rel, line=line, prop=prop, decl=value, marked=mk)
        if SPACING_PROP.match(prop):
            for nm in NUM.finditer(value):
                if nm.group(2) in ("px", "rem", "em") and nonzero(nm.group(1)):
                    yield dict(base, cat="spacing", value=nm.group(0))
                elif nm.group(2) and nonzero(nm.group(1)):
                    yield dict(base, cat="spacing-relativ", value=nm.group(0))
        elif RADIUS_PROP.match(prop):
            for nm in NUM.finditer(value):
                if nonzero(nm.group(1)):
                    yield dict(base, cat="radius", value=nm.group(0))
        elif prop == "box-shadow":
            if any(nonzero(nm.group(1)) for nm in NUM.finditer(value)):
                yield dict(base, cat="shadow", value=value)
        elif prop == "z-index":
            if NUM.search(value):
                yield dict(base, cat="z-index", value=value)
        elif MOTION_PROP.match(prop):
            for tm in TIME.finditer(value):
                if nonzero(tm.group(1)):
                    yield dict(base, cat="duration", value=tm.group(0))
            for em in re.finditer(r"(cubic-bezier|steps)\([^)]*\)", value):
                yield dict(base, cat="easing", value=re.sub(r"\s+", " ", em.group(0)))
            if prop == "transition":
                parts = [p.strip() for p in re.split(r",(?![^(]*\))", value)]
                for p in parts:
                    first = p.split()[0] if p.split() else ""
                    if first == "all" or TIME.match(first) or first.startswith("$"):
                        yield dict(base, cat="transition-all", value=p)


def scan():
    files = sorted(p for p in SASS.rglob("*.scss") if "variables" not in p.relative_to(SASS).parts)
    hits = []
    for f in files:
        hits.extend(scan_file(f))
    return hits


def counts(hits):
    c = collections.Counter(h["cat"] for h in hits if not h["marked"] and h["cat"] in CATEGORIES)
    return {cat: c.get(cat, 0) for cat in CATEGORIES}


def read_baseline(path):
    base = {}
    for ln in pathlib.Path(path).read_text(encoding="utf-8").splitlines():
        ln = ln.split("#", 1)[0].strip()
        if ln:
            k, v = ln.split()
            base[k] = int(v)
    return base


def write_baseline(path, nums):
    lines = [
        "# Ratchet für scripts/scale-guardrail.sh (STYLEGUIDE.md 3.3 bis 3.7, 16.1)",
        "# Höchstzahl verbliebener Skalen-Literale je Kategorie außerhalb von",
        "# assets/_sass/variables/. Die CI scheitert, wenn eine Zahl steigt.",
        "# Nach einer Migration senken: bash scripts/scale-guardrail.sh --update",
        "# (schreibt nur nach unten). Erhöhen nur mit Begründung im Commit.",
    ]
    lines += [f"{k} {nums[k]}" for k in CATEGORIES]
    pathlib.Path(path).write_text("\n".join(lines) + "\n", encoding="utf-8")


def report(hits):
    out = ["# Inventar Skalen-Literale", ""]
    out.append("Erzeugt mit `python3 scripts/scale-literals.py --report`. Gezählt werden CSS-Deklarationen in "
               "`assets/_sass` außerhalb von `variables/`. Sass-Variablen und Custom Properties sind benannte "
               "Werte und zählen nicht.")
    out.append("")
    out.append("| Kategorie | Literale (unmarkiert) | markiert | verschiedene Werte (unmarkiert) |")
    out.append("|---|---|---|---|")
    cats = CATEGORIES + ["spacing-relativ"]
    for cat in cats:
        hs = [h for h in hits if h["cat"] == cat]
        out.append(f"| {cat} | {sum(not h['marked'] for h in hs)} | {sum(h['marked'] for h in hs)} | "
                   f"{len(set(h['value'] for h in hs if not h['marked']))} |")
    for cat in cats:
        hs = [h for h in hits if h["cat"] == cat]
        if not hs:
            continue
        out += ["", f"## {cat}", "", "| Wert | Anzahl | Fundstellen |", "|---|---|---|"]
        by = collections.defaultdict(list)
        for h in hs:
            by[h["value"]].append(h)

        def key(v):
            m = NUM.search(v)
            return (len(by[v]) * -1, float(m.group(1)) if m else 0, v)

        for v in sorted(by, key=key):
            locs = ", ".join(
                f"{h['file'].replace('assets/_sass/', '')}:{h['line']}" + (" (markiert)" if h["marked"] else "")
                for h in by[v])
            vv = v.replace("|", "\\|")
            out.append(f"| `{vv}` | {len(by[v])} | {locs} |")
    return "\n".join(out) + "\n"


def main(argv):
    hits = scan()
    if len(argv) >= 2 and argv[1] == "--report":
        sys.stdout.write(report(hits))
        return 0
    if len(argv) >= 2 and argv[1] == "--json":
        json.dump(hits, sys.stdout, ensure_ascii=False, indent=1)
        return 0
    if len(argv) == 3 and argv[1] in ("--check", "--update"):
        nums = counts(hits)
        path = argv[2]
        base = read_baseline(path) if pathlib.Path(path).exists() else {}
        if argv[1] == "--update":
            new = {k: min(nums[k], base.get(k, nums[k])) if base else nums[k] for k in CATEGORIES}
            raised = [k for k in CATEGORIES if nums[k] > new[k]]
            write_baseline(path, new)
            print("Grenzwerte geschrieben: " + ", ".join(f"{k} {new[k]}" for k in CATEGORIES))
            if raised:
                print("Nicht erhöht (Ratchet): " + ", ".join(raised))
                return 1
            return 0
        fail = False
        lower = []
        for k in CATEGORIES:
            limit = base.get(k)
            if limit is None:
                print(f"Grenzwert fehlt für {k} in {path}")
                fail = True
            elif nums[k] > limit:
                fail = True
                print(f"VERSTOSS {k}: {nums[k]} Literale, erlaubt {limit}. Die neue Stelle ist eine von diesen:")
                for h in hits:
                    if h["cat"] == k and not h["marked"]:
                        print(f"  {h['file']}:{h['line']}: {h['prop']}: {h['decl'] if k == 'shadow' else h['value']}")
            elif nums[k] < limit:
                lower.append(f"{k} {limit} → {nums[k]}")
        if fail:
            print()
            print("Fix: Token aus assets/_sass/variables/_scales.scss verwenden ($space-*, $fp-space-*,")
            print("$radius-*, $shadow-*, $z-*, $duration-*, $ease-*) oder (begründet) eine Zeile")
            print("'// skala-Ausnahme: <Grund>' direkt darüber. transition immer mit konkreten")
            print("Eigenschaften (MO-1). Inventar: python3 scripts/scale-literals.py --report")
            return 1
        print("Skalen-Guardrail OK: " + ", ".join(f"{k} {nums[k]}" for k in CATEGORIES))
        if lower:
            print("Weniger Literale als erlaubt, Grenzwert senken mit --update: " + ", ".join(lower))
        return 0
    print(__doc__)
    return 2


if __name__ == "__main__":
    sys.exit(main(sys.argv))
