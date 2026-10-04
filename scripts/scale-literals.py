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
  tracking       Zahlen in letter-spacing, dazu das Laufweiten-Argument von
                 mono-label() (Laufweiten nur über $tracking-*, TYP-7)
  duration       Zeitliterale ungleich 0 in transition* und animation* (je Literal)
  easing         cubic-bezier() und steps() in transition* und animation*
  transition-all transition mit all oder ohne Eigenschaft (MO-1, je Deklaration)

Lokale Sass-Variablen: Eine Variable außerhalb von variables/, die selbst
ein Literal trägt ($lokal: 13px), zählt dort, wo eine der Deklarationen oben
sie liest (margin: $lokal), wie das Literal selbst. Ein Literal wird durch
einen eigenen Namen also nicht unsichtbar. Benannte lokale Skalen (Z-2,
MO-4) tragen deshalb einen Marker an der Definition.

Ausnahmen: `// skala-Ausnahme: <Grund>` in der Zeile direkt über der
Deklaration oder Variablen-Definition, oder als Block
`// skala-Ausnahme: [Block] <Grund>` … `// skala-Ausnahme-Ende`. Markierte
Literale zählen nicht. Ein Block ohne Ende (oder ein Ende ohne Block) ist
ein Fehler, sonst nähme er still den Rest der Datei aus.

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
CATEGORIES = ["spacing", "radius", "shadow", "z-index", "duration", "easing", "transition-all", "tracking"]

SPACING_PROP = re.compile(
    r"^(margin|padding|gap|row-gap|column-gap|scroll-margin|scroll-padding)(-[a-z-]+)?$"
)
RADIUS_PROP = re.compile(r"^border(-[a-z]+)*-radius$")
MOTION_PROP = re.compile(r"^(transition|animation)(-[a-z-]+)?$")
NUM = re.compile(r"(?<![\w$.#-])(-?(?:\d+\.?\d*|\.\d+))([a-z%]*)")
TIME = re.compile(r"(?<![\w$.#-])((?:\d+\.?\d*|\.\d+))(ms|s)\b")
MARK = "skala-Ausnahme:"
# Mixin-Parameter, die eine Skala tragen: Name -> (Kategorie, Position, Parametername).
# Ein Literal als Argument (positional oder benannt) oder als Default zählt
# wie dasselbe Literal in der Deklaration, die das Mixin daraus schreibt.
MIXIN_ARGS = {
    "card-panel": ("radius", 1, "$radius"),
    "mono-label": ("tracking", 1, "$tracking"),
}


def mixin_arg(args, pos, name):
    """Wert des Parameters `name` (benannt) oder an Position `pos` (0-basiert), sonst None.

    Getrennt wird nur an Kommas außerhalb von Klammern. Bei einer
    Mixin-Definition ist der Wert der Default hinter dem Doppelpunkt.
    """
    parts, buf, depth = [], [], 0
    for c in args:
        if c == "(":
            depth += 1
        elif c == ")":
            depth -= 1
        if c == "," and depth == 0:
            parts.append("".join(buf).strip())
            buf = []
        else:
            buf.append(c)
    parts.append("".join(buf).strip())
    parts = [p for p in parts if p]
    named = re.compile(r"^\$([a-zA-Z0-9_-]+)\s*:\s*(.*)$", re.S)
    for p in parts:
        nm = named.match(p)
        if nm and "$" + nm.group(1) == name:
            return nm.group(2).strip()
    if pos < len(parts) and not named.match(parts[pos]):
        return parts[pos]
    return None


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
            # Klammern neutralisieren, Inhalt behalten: calc(#{$lokal}) liest
            # die Variable, ihr Literal zählt mit.
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
            out.append("  " + text[i + 2:j] + " ")
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


def marked_lines(raw_lines, errors=None):
    """Zeilennummern, für die ein skala-Ausnahme-Marker gilt.

    Ungepaarte Block-Marker landen als (Zeile, Text) in `errors`.
    """
    marked = set()
    block = 0
    for idx, ln in enumerate(raw_lines, start=1):
        if MARK in ln and "[Block]" in ln:
            if block and errors is not None:
                errors.append((idx, f"neuer [Block] vor dem skala-Ausnahme-Ende des Blocks aus Zeile {block}"))
            block = idx
            continue
        if "skala-Ausnahme-Ende" in ln:
            if not block and errors is not None:
                errors.append((idx, "skala-Ausnahme-Ende ohne offenen [Block]"))
            block = 0
            continue
        if block:
            marked.add(idx)
        if MARK in ln and ln.strip().startswith("//"):
            marked.add(idx + 1)
    if block and errors is not None:
        errors.append((block, "[Block] ohne skala-Ausnahme-Ende, nähme den Rest der Datei aus"))
    return marked


def block_errors():
    """Ungepaarte Block-Marker in allen Dateien außerhalb von variables/."""
    out = []
    for path in sass_files():
        errs = []
        marked_lines(path.read_text(encoding="utf-8").split("\n"), errs)
        out += [f"{path.relative_to(ROOT)}:{line}: {msg}" for line, msg in errs]
    return out


def sass_files():
    return sorted(p for p in SASS.rglob("*.scss") if "variables" not in p.relative_to(SASS).parts)


VAR_DEF = re.compile(r"^\$([a-zA-Z0-9_-]+)\s*:\s*(.*?)\s*(?:!default|!global)?\s*$", re.S)
VAR_REF = re.compile(r"(?<![\w-])(?:[a-zA-Z_][a-zA-Z0-9_-]*\.)?\$([a-zA-Z0-9_-]+)")
_LOCAL = {}


def local_vars():
    """Definitionen außerhalb von variables/: Name -> [(Datei, Zeile, Wert, markiert)]."""
    if not _LOCAL:
        for path in sass_files():
            raw = path.read_text(encoding="utf-8")
            marked = marked_lines(raw.split("\n"))
            rel = str(path.relative_to(ROOT))
            for line, text, end in statements(strip(raw)):
                m = VAR_DEF.match(text) if end == ";" else None
                if m:
                    _LOCAL.setdefault(m.group(1), []).append(
                        (rel, line, " ".join(m.group(2).split()), line in marked))
    return _LOCAL


def resolve(name, rel, line, seen=()):
    """Lokale Definition von $name als (Wert, Fundort, markiert), sonst None.

    Gleiche Datei zuerst (letzte Definition vor der Zeile, sonst die erste),
    danach eine Definition in einer anderen Datei außerhalb von variables/
    (Module, die per @use geladen werden). Unmarkierte lokale Variablen im
    Wert werden mit aufgelöst, markierte gelten wie Tokens. Markiert ist das
    Ergebnis, wenn die Definition selbst einen Marker trägt.
    """
    cands = local_vars().get(name)
    if not cands or name in seen:
        return None
    same = [c for c in cands if c[0] == rel]
    if same:
        before = [c for c in same if c[1] <= line]
        d = before[-1] if before else same[0]
    else:
        d = cands[0]
    value, marked = d[2], d[3]
    for ref in sorted(set(VAR_REF.findall(value)), key=len, reverse=True):
        r = resolve(ref, d[0], d[1], seen + (name,))
        if r and not r[2]:  # markierte Definitionen gelten wie Tokens
            value = re.sub(r"(?:\b[a-zA-Z_][a-zA-Z0-9_-]*\.)?\$" + re.escape(ref) + r"(?![\w-])",
                           lambda _m, v=r[0]: "(" + v + ")", value)
    return value, f"{d[0].replace('assets/_sass/', '')}:{d[1]}", marked


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
        # Skalen-Argumente von Mixins (MIXIN_ARGS), im Aufruf und als Default
        m = re.match(r"@(?:include|mixin)\s+([a-z][a-z0-9-]*)\s*\((.*)\)\s*$", text, re.S)
        if m and m.group(1) in MIXIN_ARGS:
            cat, pos, name = MIXIN_ARGS[m.group(1)]
            val = mixin_arg(m.group(2), pos, name)
            if val is not None:
                mk = line in marked
                for ref in sorted(set(VAR_REF.findall(val))):
                    r = resolve(ref, rel, line)
                    if r:
                        val += " " + r[0]
                        mk = mk or r[2]
                for nm in NUM.finditer(val):
                    if nonzero(nm.group(1)):
                        yield dict(cat=cat, file=rel, line=line, prop=f"{m.group(1)}({name})",
                                   value=nm.group(0), decl=text, marked=mk)
            continue
        m = re.match(r"^([a-z][a-z-]*)\s*:\s*(.*)$", text, re.S)
        if not m:
            continue
        prop, value = m.group(1), " ".join(m.group(2).split())
        value = re.sub(r"\s*!important$", "", value)
        mk = line in marked
        base = dict(file=rel, line=line, prop=prop, decl=value, marked=mk)
        if SPACING_PROP.match(prop) or RADIUS_PROP.match(prop) or prop in ("box-shadow", "z-index", "letter-spacing") \
                or MOTION_PROP.match(prop):
            for ref in sorted(set(VAR_REF.findall(value))):
                r = resolve(ref, rel, line)
                if r:
                    yield from scan_value(dict(base, marked=mk or r[2], decl=f"${ref} = {r[0]} ({r[1]})"),
                                          prop, r[0], via=f"${ref}")
        yield from scan_value(base, prop, value)


def scan_value(base, prop, value, via=None):
    """Treffer in einem Deklarationswert. `via`: Wert stammt aus einer lokalen Variablen."""
    def tag(v):
        return f"{via} = {v}" if via else v

    if SPACING_PROP.match(prop):
        for nm in NUM.finditer(value):
            if nm.group(2) in ("px", "rem", "em") and nonzero(nm.group(1)):
                yield dict(base, cat="spacing", value=tag(nm.group(0)))
            elif nm.group(2) and nonzero(nm.group(1)):
                yield dict(base, cat="spacing-relativ", value=tag(nm.group(0)))
    elif RADIUS_PROP.match(prop):
        for nm in NUM.finditer(value):
            if nonzero(nm.group(1)):
                yield dict(base, cat="radius", value=tag(nm.group(0)))
    elif prop == "box-shadow":
        if any(nonzero(nm.group(1)) for nm in NUM.finditer(value)):
            yield dict(base, cat="shadow", value=tag(value))
    elif prop == "z-index":
        if NUM.search(value):
            yield dict(base, cat="z-index", value=tag(value))
    elif prop == "letter-spacing":
        # Laufweiten nur über $tracking-* (TYP-7)
        for nm in NUM.finditer(value):
            if nonzero(nm.group(1)):
                yield dict(base, cat="tracking", value=tag(nm.group(0)))
    elif MOTION_PROP.match(prop):
        for tm in TIME.finditer(value):
            if nonzero(tm.group(1)):
                yield dict(base, cat="duration", value=tag(tm.group(0)))
        for em in re.finditer(r"(cubic-bezier|steps)\([^)]*\)", value):
            yield dict(base, cat="easing", value=tag(re.sub(r"\s+", " ", em.group(0))))
        if prop == "transition" and not via:
            parts = [p.strip() for p in re.split(r",(?![^(]*\))", value)]
            for p in parts:
                first = p.split()[0] if p.split() else ""
                if first == "all" or TIME.match(first) or first.startswith("$"):
                    yield dict(base, cat="transition-all", value=p)


def scan():
    files = sass_files()
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
        errs = block_errors()
        if errs:
            fail = True
            print("VERSTOSS: ungepaarter skala-Ausnahme-Block:")
            for e in errs:
                print("  " + e)
            print("Fix: jeden '// skala-Ausnahme: [Block] <Grund>' mit '// skala-Ausnahme-Ende' schließen.")
            print()
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
            print("$radius-*, $shadow-*, $z-*, $duration-*, $ease-*), für Laufweiten $tracking-* aus")
            print("assets/_sass/variables/_typography.scss, oder (begründet) eine Zeile")
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
