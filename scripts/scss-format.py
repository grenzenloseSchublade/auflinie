#!/usr/bin/env python3
"""SCSS-Format-Prüfung (STYLEGUIDE.md SCSS-19, Audit B-SCSS-08).

Prüft jede Datei unter assets/_sass:
  - Einrückung nach Klammertiefe in Zweierschritten. Fortsetzungszeilen
    (mehrzeilige Werte, Argumentlisten) behalten ihren Versatz relativ zur
    ersten Zeile des Statements, Selektorlisten stehen auf Blocktiefe.
  - keine Tabs, kein Leerzeichen am Zeilenende
  - genau ein abschließender Zeilenumbruch

Stylelint 16 prüft Einrückung nicht mehr (stilistische Regeln entfallen),
.editorconfig hilft nur im Editor. Deshalb dieser Check im Lint-Job.

Nutzung: python3 scripts/scss-format.py          (Exit 0 = sauber, 1 = Verstoß)
         python3 scripts/scss-format.py --fix    (korrigiert Einrückung,
         Endleerzeichen und Dateiende, Tabs bleiben Handarbeit)
"""
import pathlib
import sys


def strip_code(line, in_comment):
    """Code ohne Kommentare, Strings und #{…} (für die Klammerzählung)."""
    out = []
    i = 0
    quote = None
    while i < len(line):
        c = line[i]
        if in_comment:
            if line.startswith("*/", i):
                in_comment = False
                i += 2
            else:
                i += 1
            continue
        if quote:
            if c == "\\":
                i += 2
                continue
            if c == quote:
                quote = None
            i += 1
            continue
        if c in "\"'":
            quote = c
        elif line.startswith("//", i):
            break
        elif line.startswith("/*", i):
            in_comment = True
            i += 2
            continue
        elif line.startswith("#{", i):
            end = line.find("}", i)
            i = len(line) if end == -1 else end + 1
            continue
        else:
            out.append(c)
        i += 1
    return "".join(out), in_comment


def formatted(text):
    lines = [line.rstrip() for line in text.split("\n")]
    while lines and lines[-1] == "":
        lines.pop()
    result = []
    depth = paren = 0
    in_comment = False
    stmt_open = False  # mitten in einem mehrzeiligen Statement
    stmt_old = stmt_new = 0  # Einrückung der Statement-Startzeile alt/neu
    for raw in lines:
        if raw == "":
            result.append("")
            continue
        old = len(raw) - len(raw.lstrip(" "))
        body = raw.lstrip(" ")
        was_comment = in_comment
        code, in_comment = strip_code(body, in_comment)
        code = code.strip()
        line_depth = depth - (1 if code.startswith("}") else 0)
        if was_comment:
            # Zeile im /* … */-Block: Versatz relativ halten
            new = max(0, old - stmt_old + stmt_new) if stmt_open else old
        elif stmt_open and (paren > 0 or not code.startswith("}")):
            if paren == 0 and code.endswith("{") and not code.startswith(")"):
                new = 2 * line_depth  # letzte Zeile einer Selektorliste
            else:
                new = max(0, old - stmt_old + stmt_new)
                if new <= stmt_new and paren > 0 and not code.startswith(")"):
                    new = stmt_new + 2
        else:
            new = 2 * line_depth
            stmt_old, stmt_new = old, new
        result.append(" " * new + body)
        if was_comment:
            continue
        for ch in code:
            depth += {"{": 1, "}": -1}.get(ch, 0)
            paren += {"(": 1, ")": -1}.get(ch, 0)
        if code == "":
            continue  # reine Kommentarzeile: Statement-Zustand bleibt
        stmt_open = paren > 0 or not code.endswith((";", "{", "}"))
    return "\n".join(result) + "\n"


def main():
    fix = "--fix" in sys.argv
    root = pathlib.Path(__file__).resolve().parent.parent
    problems = []
    for path in sorted((root / "assets/_sass").rglob("*.scss")):
        rel = path.relative_to(root)
        text = path.read_text(encoding="utf-8")
        for n, line in enumerate(text.split("\n"), 1):
            if "\t" in line:
                problems.append(f"{rel}:{n}: Tab")
        want = formatted(text)
        if want == text:
            continue
        if fix:
            path.write_text(want, encoding="utf-8")
            print(f"korrigiert: {rel}")
            continue
        have_lines = text.split("\n")
        for n, (have, should) in enumerate(zip(have_lines, want.split("\n")), 1):
            if have != should:
                if have.rstrip() != have:
                    problems.append(f"{rel}:{n}: Leerzeichen am Zeilenende")
                else:
                    indent = len(have) - len(have.lstrip(" "))
                    expected = len(should) - len(should.lstrip(" "))
                    problems.append(f"{rel}:{n}: Einrückung {indent} statt {expected} Leerzeichen")
                break
        else:
            problems.append(f"{rel}: Dateiende (genau ein Zeilenumbruch)")
    if problems:
        print("VERSTOSS — SCSS-Format (SCSS-19), je Datei die erste Abweichung:")
        print("\n".join(problems))
        print("\nFix: python3 scripts/scss-format.py --fix (Tabs von Hand ersetzen)")
        return 1
    if not fix:
        print("SCSS-Format OK: 2 Leerzeichen nach Klammertiefe, keine Endleerzeichen")
    return 0


if __name__ == "__main__":
    sys.exit(main())
