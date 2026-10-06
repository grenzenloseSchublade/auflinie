#!/usr/bin/env python3
"""Prüft Commit-Nachrichten gegen GIT-1, GIT-7 und GIT-8 (STYLEGUIDE.md 14.1).

Typen und Bereiche (Scopes) liest das Skript aus den Tabellen unter GIT-7 und
GIT-8 im Guide. Eine zweite Liste gibt es nicht: Wer einen Bereich ergänzt,
ändert nur die Tabelle. Für alte Bereiche (etwa `css`) nennt die Meldung die
Zuordnung aus docs/commit-bereiche.md.

Geprüft wird die erste Zeile:
  typ(bereich): Betreff   oder   typ: Betreff   (optional `!` vor dem Doppelpunkt)
  - Typ aus GIT-7, höchstens ein Bereich aus GIT-8
  - GIT-1: kein Schlusspunkt, höchstens 100 Zeichen (über 72 nur Warnung)
Durchgelassen werden Merge-, Revert-, fixup!-, squash!- und amend!-Commits.
Eine Zeile `Ausnahme: GIT-8, Grund` im Body schaltet die Prüfung dieser Regel
ab (GOV-4).

Nutzung:
  python3 scripts/commit-msg-check.py <datei>   (Hook .githooks/commit-msg)
  python3 scripts/commit-msg-check.py --log 50  (die letzten 50 Commits)
Exit 0 = gültig, 1 = Verstoß, 2 = Tabelle im Guide nicht gefunden.
Einrichten: git config core.hooksPath .githooks (README_DEV.md).
"""
import pathlib
import re
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
GUIDE = ROOT / "STYLEGUIDE.md"
MAPPING = ROOT / "docs/commit-bereiche.md"

DURCHLASS = re.compile(r"^(Merge\b|(Revert|Reapply) \"|(fixup|squash|amend)! )")
KOPF = re.compile(r"^(?P<typ>[A-Za-z]+)(?:\((?P<bereich>[^()]*)\))?!?: (?P<betreff>\S.*)$")
AUSNAHME = re.compile(r"^Ausnahme: (GIT-\d+)\b", re.MULTILINE)
SCHERE = "# ------------------------ >8 ------------------------"


def tabelle(zeilen, regel):
    """Tabellenzeilen direkt unter der Regel `- **<regel>**`."""
    start = next((i for i, z in enumerate(zeilen) if z.startswith(f"- **{regel}**")), None)
    if start is None:
        return []
    rows = []
    for z in zeilen[start + 1:]:
        if z.startswith("|"):
            rows.append([c.strip() for c in z.strip().strip("|").split("|")])
        elif rows or z.startswith(("- **", "#")):
            break
    return rows


def listen():
    zeilen = GUIDE.read_text(encoding="utf-8").splitlines()
    typen = {m.group(1) for row in tabelle(zeilen, "GIT-7")
             for m in [re.fullmatch(r"`([a-z]+)`", row[0])] if m}
    bereiche = {b for row in tabelle(zeilen, "GIT-8")
                for zelle in row[1:] for b in re.findall(r"`([a-z0-9-]+)`", zelle)}
    if len(typen) < 5 or len(bereiche) < 10:
        print(f"FEHLER: Typen- oder Bereichstabelle unter GIT-7 / GIT-8 in {GUIDE.name} "
              f"nicht gefunden ({len(typen)} Typen, {len(bereiche)} Bereiche).")
        sys.exit(2)
    return typen, bereiche


def zuordnungen():
    """Alte Bereiche und Typen mit Zuordnung, Zeilen `| `alt` | … | Zuordnung |`."""
    if not MAPPING.exists():
        return {}
    hinweise = {}
    for z in MAPPING.read_text(encoding="utf-8").splitlines():
        m = re.match(r"^\| `([^`]+)` \|(?:[^|]*\|)+? ([^|]+) \|$", z)
        if m and not m.group(2).startswith("erlaubt"):
            hinweise[m.group(1)] = m.group(2).strip()
    return hinweise


def nachricht_bereinigen(text):
    zeilen = []
    for z in text.splitlines():
        if z.startswith(SCHERE):
            break
        if not z.startswith("#"):
            zeilen.append(z.rstrip())
    return "\n".join(zeilen).strip("\n")


def pruefe(text, typen, bereiche, hinweise):
    """Liefert (fehler, warnungen) als Listen von Sätzen."""
    text = nachricht_bereinigen(text)
    if not text.strip():
        return [], []
    kopf = text.splitlines()[0]
    if DURCHLASS.match(kopf):
        return [], []
    aus = set(AUSNAHME.findall(text))
    fehler, warnungen = [], []

    if "GIT-1" not in aus:
        if len(kopf) > 100:
            fehler.append(f"GIT-1: Betreff hat {len(kopf)} Zeichen, höchstens 100.")
        elif len(kopf) > 72:
            warnungen.append(f"GIT-1: Betreff hat {len(kopf)} Zeichen, Ziel höchstens 72.")
        if kopf.endswith(".") and not kopf.endswith("..."):
            fehler.append("GIT-1: Betreff ohne Schlusspunkt.")

    m = KOPF.match(kopf)
    if not m:
        fehler.append("Format: `typ(bereich): Betreff` oder `typ: Betreff`, "
                      "ein Leerzeichen nach dem Doppelpunkt.")
        return fehler, warnungen
    typ, bereich = m.group("typ"), m.group("bereich")
    if "GIT-7" not in aus and typ not in typen:
        hinweis = f" Zuordnung: {hinweise[typ]}." if typ in hinweise else ""
        fehler.append(f"GIT-7: Typ `{typ}` gibt es nicht.{hinweis} "
                      f"Erlaubt: {', '.join(sorted(typen))}.")
    if "GIT-8" not in aus and bereich is not None:
        if re.search(r"[/,\s]", bereich):
            fehler.append(f"GIT-8: höchstens ein Bereich, nicht `{bereich}`. "
                          "Bereich weglassen oder Commit teilen.")
        elif bereich not in bereiche:
            hinweis = (f" Zuordnung: {hinweise[bereich]}." if bereich in hinweise
                       else " Neue Bereiche entscheidet der Owner (Tabelle unter GIT-8).")
            fehler.append(f"GIT-8: Bereich `{bereich}` steht nicht in der Liste.{hinweis}")
    return fehler, warnungen


def melden(name, fehler, warnungen):
    for f in fehler:
        print(f"{name}: {f}")
    for w in warnungen:
        print(f"{name}: Warnung {w}")


def main(argv):
    typen, bereiche = listen()
    hinweise = zuordnungen()
    if len(argv) == 3 and argv[1] == "--log":
        out = subprocess.run(["git", "-C", str(ROOT), "log", f"-{int(argv[2])}",
                              "--format=%h%x00%B%x01"], capture_output=True, text=True, check=True)
        gueltig = ungueltig = 0
        for eintrag in filter(str.strip, out.stdout.split("\x01")):
            sha, _, text = eintrag.strip("\n").partition("\x00")
            fehler, warnungen = pruefe(text, typen, bereiche, hinweise)
            kopf = text.splitlines()[0] if text else ""
            print(f"{'FEHLER' if fehler else 'ok    '} {sha} {kopf}")
            for f in fehler:
                print(f"       {f}")
            ungueltig += bool(fehler)
            gueltig += not fehler
        print(f"\n{gueltig} gültig, {ungueltig} ungültig")
        return 1 if ungueltig else 0
    if len(argv) != 2:
        print(__doc__.strip())
        return 2
    text = pathlib.Path(argv[1]).read_text(encoding="utf-8")
    fehler, warnungen = pruefe(text, typen, bereiche, hinweise)
    melden("commit-msg", fehler, warnungen)
    if fehler:
        print("Regeln: STYLEGUIDE.md GIT-1, GIT-7, GIT-8. Die Nachricht ist gesichert, "
              f"weiter mit: git commit -e -F {argv[1]}")
    return 1 if fehler else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
