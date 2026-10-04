#!/usr/bin/env python3
"""Negativtests der Guardrail-Skripte (STYLEGUIDE.md 16.1).

Jeder Fall in tests/guardrails/cases/*.case baut einen absichtlichen Verstoß
(oder einen erlaubten Grenzfall) in eine Kopie des Repos und erwartet einen
bestimmten Exit-Code des Guardrails. So fällt auf, wenn ein Check eine Lücke
bekommt, die er schon einmal geschlossen hatte.

Aufbau einer .case-Datei (Kopfzeilen, dann `---`, dann der Inhalt):

    # Beschreibung in einer Zeile
    guardrail: scale            (scripts/<name>-guardrail.sh, csp = scripts/csp-check.py
                                 auf der Mini-Site tests/guardrails/csp-site,
                                 content = scripts/content-check.py auf den Quellen,
                                 content-site = derselbe Check mit --site auf der
                                 Mini-Site tests/guardrails/content-site,
                                 version-sync = scripts/version-sync-check.sh)
    expect: 1                   (erwarteter Exit-Code)
    grep: VERSTOSS spacing      (optional, Regex, muss in der Ausgabe stehen)
    file: assets/_sass/components/_footer.scss
    mode: append                (append | create | replace)
    old: <Text>                 (nur replace: wird einmal ersetzt)
    ---
    <Inhalt, bei replace der neue Text>

Vorab läuft jeder Guardrail einmal auf der unveränderten Kopie und muss dort
Exit 0 liefern, sonst ist der Fall nicht aussagekräftig.

Nutzung: python3 tests/guardrails/run.py   (Exit 0 = alle Fälle wie erwartet)
Läuft im Lint-Job der CI.
"""
import pathlib
import re
import shutil
import subprocess
import sys
import tempfile

ROOT = pathlib.Path(__file__).resolve().parents[2]
CASES = sorted((ROOT / "tests/guardrails/cases").glob("*.case"))
COPY = ["scripts", "assets/_sass", "assets/css", "assets/js", "_layouts", "_includes",
        ".github", "_config.yml", "service-worker.js", "tests/guardrails/csp-site",
        "_posts", "_drafts", "_pages", "_data", "tests/guardrails/content-site",
        "package.json", "package-lock.json", ".devcontainer", ".ruby-version", ".nvmrc",
        "playwright.config.js", "tests/README.md", "README.md", "README_DEV.md"]


def parse(path):
    head, _, body = path.read_text(encoding="utf-8").partition("\n---\n")
    meta = {"desc": ""}
    for ln in head.splitlines():
        if ln.startswith("#"):
            meta["desc"] = meta["desc"] or ln.lstrip("# ").strip()
        elif ":" in ln:
            k, v = ln.split(":", 1)
            meta[k.strip()] = v.strip()
    meta["body"] = body
    return meta


def make_copy(dst):
    for rel in COPY:
        if (ROOT / rel).is_dir():
            shutil.copytree(ROOT / rel, dst / rel)
        else:
            shutil.copy2(ROOT / rel, dst / rel)
    for f in ROOT.glob("*.html"):
        shutil.copy2(f, dst / f.name)


def run(copy, guardrail):
    if guardrail == "csp":
        cmd = ["python3", str(copy / "scripts/csp-check.py"), str(copy / "tests/guardrails/csp-site")]
    elif guardrail == "content":
        cmd = ["python3", str(copy / "scripts/content-check.py")]
    elif guardrail == "content-site":
        cmd = ["python3", str(copy / "scripts/content-check.py"), "--site",
               str(copy / "tests/guardrails/content-site")]
    elif guardrail == "version-sync":
        cmd = ["bash", str(copy / "scripts/version-sync-check.sh")]
    else:
        cmd = ["bash", str(copy / "scripts" / f"{guardrail}-guardrail.sh")]
    p = subprocess.run(cmd, capture_output=True, text=True, check=False)
    return p.returncode, p.stdout + p.stderr


def main():
    if not CASES:
        print("Keine Fälle in tests/guardrails/cases/")
        return 1
    failed = 0
    with tempfile.TemporaryDirectory(prefix="guardrail-") as tmp:
        clean = pathlib.Path(tmp) / "clean"
        make_copy(clean)
        for g in sorted({parse(c)["guardrail"] for c in CASES}):
            code, out = run(clean, g)
            if code != 0:
                print(f"FEHLER {g}-guardrail.sh schon ohne Eingriff Exit {code}:\n{out}")
                return 1
        for i, case in enumerate(CASES):
            meta = parse(case)
            work = pathlib.Path(tmp) / f"case{i}"
            shutil.copytree(clean, work)
            target = work / meta["file"]
            mode = meta.get("mode", "append")
            if mode == "create":
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_text(meta["body"], encoding="utf-8")
            elif mode == "append":
                target.write_text(target.read_text(encoding="utf-8") + "\n" + meta["body"], encoding="utf-8")
            elif mode == "replace":
                text = target.read_text(encoding="utf-8")
                old = meta["old"]
                if old not in text:
                    print(f"FEHLER {case.name}: '{old}' nicht in {meta['file']}")
                    failed += 1
                    continue
                target.write_text(text.replace(old, meta["body"].rstrip("\n"), 1), encoding="utf-8")
            code, out = run(work, meta["guardrail"])
            ok = code == int(meta.get("expect", "1"))
            if ok and meta.get("grep") and not re.search(meta["grep"], out):
                ok = False
                out = f"(erwartet in der Ausgabe: {meta['grep']})\n" + out
            print(f"{'ok  ' if ok else 'FAIL'} {case.name}: {meta['desc']} (Exit {code})")
            if not ok:
                failed += 1
                print("     " + out.strip().replace("\n", "\n     "))
            shutil.rmtree(work)
    print(f"\n{len(CASES) - failed}/{len(CASES)} Guardrail-Fälle wie erwartet")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
