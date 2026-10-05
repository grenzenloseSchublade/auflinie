#!/usr/bin/env python3
"""Inhalts-Check (STYLEGUIDE ARCH-5): typische Inhaltsfehler, die sonst still
durch Build und Deploy gingen. Jede Meldung nennt Datei, Zeile und Lösung,
damit ein roter Lauf nach einem reinen Inhalts-Commit ohne Technikwissen zu
beheben ist.

Quellen (ohne Argument):
  1. FEHLER: HTML-Kommentar `<!--` in _posts, _drafts, _pages, _data. Er ist
     auf der Seite unsichtbar, steht aber öffentlich im Quelltext. Code-Blöcke
     und `Inline-Code` zählen nicht.
  2. WARNUNG: target="_blank" ohne rel="noopener" in denselben Quellen. Das
     Build-Plugin _plugins/external-links.rb ergänzt rel (LINK-3).
  3. FEHLER: Skill-ID in _data/skill_graph.yml ohne passenden Chip in
     _data/cv_content.yml (skill_groups, core und breadth). Eine ID ist der
     Chip-Name nach Jekylls `slugify` (Modus default). Der Graph verlöre die
     Kante sonst still, nur die Browser-Konsole warnte.
  4. FEHLER: Mathe in _data/*.yml entgegen MD-3. Inline `$…$` braucht
     doppelte Backslashes, Display `$$…$$` einfache.
  5. FEHLER: Pfad ab der Wurzel ohne relative_url in _posts, _drafts, _pages
     (`](/…)`, `[x]: /…`, `src="/…"`, `href="/…"`, LIQ-3). Build und
     html-proofer finden die Datei unter _site, live fehlt /auflinie davor.

Gebaute Seiten (--site <dir>, nach dem Jekyll-Build):
  6. WARNUNG: <img> ohne width/height im Inhalt eines Beitrags (posts/**,
     IMG-3). Ohne Maße springt das Layout beim Laden.
  7. WARNUNG: Kachelbild eines Beitrags (header.teaser, .archive__item-teaser
     auf allen Seiten) ohne width/height. Die Maße liest _plugins/bildmasse.rb
     aus der Datei, ohne Treffer lässt der Build sie weg (IMG-3).

Nutzung:
  python3 scripts/content-check.py              (Quellen)
  python3 scripts/content-check.py --site _site (gebaute Beiträge)
Exit 0 = sauber oder nur Warnungen, 1 = mindestens ein Fehler.
"""
from difflib import get_close_matches
from html.parser import HTMLParser
import json
import pathlib
import re
import subprocess
import sys
import unicodedata

ROOT = pathlib.Path(__file__).resolve().parents[1]
SOURCE_DIRS = ["_posts", "_drafts", "_pages", "_data"]
SOURCE_SUFFIXES = {".md", ".markdown", ".html", ".yml", ".yaml"}

errors = []
warnings = []


def rel(path):
    try:
        return str(path.relative_to(ROOT))
    except ValueError:
        return str(path)


def error(path, line, text, fix):
    errors.append(f"FEHLER {rel(path)}:{line}: {text}\n  Lösung: {fix}")


def warn(path, line, text, fix):
    warnings.append(f"WARNUNG {rel(path)}:{line}: {text}\n  Lösung: {fix}")


# --- Quellen ---------------------------------------------------------------

FENCE_RE = re.compile(r"^\s*(```|~~~)")
INLINE_CODE_RE = re.compile(r"`+[^`]*`+")
BLANK_TAG_RE = re.compile(r"<a\b[^>]*\btarget\s*=\s*[\"']?_blank[^>]*>", re.I)
IAL_BLANK_RE = re.compile(r"\{:[^}]*target\s*=\s*[\"']?_blank[^}]*\}", re.I)
# Pfad ab der Wurzel ohne relative_url: Markdown-Link oder -Bild, Referenz-Link,
# src/href in HTML. „//host“ ist ein externer Link und zählt nicht.
ROOT_URL_RE = re.compile(r"\]\(\s*<?(/(?!/)[^)\s>]*)|^\s*\[[^\]]+\]:\s*(/(?!/)\S*)"
                         r"|\b(?:src|href)\s*=\s*[\"'](/(?!/)[^\"']*)", re.I)


def source_lines(path):
    """Zeilen außerhalb von Code-Blöcken, Inline-Code durch Leerzeichen ersetzt."""
    in_fence = None
    markdown = path.suffix in {".md", ".markdown"}
    for no, line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
        if markdown:
            m = FENCE_RE.match(line)
            if m:
                if in_fence is None:
                    in_fence = m.group(1)
                elif m.group(1) == in_fence:
                    in_fence = None
                continue
            if in_fence:
                continue
            line = INLINE_CODE_RE.sub(lambda m: " " * len(m.group(0)), line)
        yield no, line


def check_sources():
    for d in SOURCE_DIRS:
        base = ROOT / d
        if not base.is_dir():
            continue
        for path in sorted(base.rglob("*")):
            if not path.is_file() or path.suffix not in SOURCE_SUFFIXES:
                continue
            yml = path.suffix in {".yml", ".yaml"}
            for no, line in source_lines(path):
                if yml and line.lstrip().startswith("#"):
                    continue  # YAML-Kommentar, landet nicht auf der Seite
                if "<!--" in line:
                    error(path, no, "HTML-Kommentar „<!--“. Er ist auf der Seite unsichtbar, "
                          "steht aber öffentlich im Quelltext.",
                          "als YAML-Kommentar mit # schreiben." if yml else
                          "{% comment %} … {% endcomment %} nutzen, das entfernt Jekyll beim Bauen.")
                if not yml:
                    for m in ROOT_URL_RE.finditer(line):
                        url = next(g for g in m.groups() if g)
                        error(path, no, f"Pfad „{url}“ ohne relative_url. Lokal und in den übrigen "
                              "Prüfungen fällt das nicht auf, auf der Website fehlt aber /auflinie "
                              "davor, Bild oder Link gehen ins Leere.",
                              f'{{{{ "{url}" | relative_url }}}} statt {url} schreiben.')
                for tag in BLANK_TAG_RE.findall(line) + IAL_BLANK_RE.findall(line):
                    if "noopener" not in tag.lower():
                        warn(path, no, 'target="_blank" ohne rel="noopener noreferrer".',
                             "target weglassen. Externe Links öffnen beim Build ohnehin in einem "
                             "neuen Tab, mit rel und Hinweis (LINK-3).")


def slugify(text):
    """Jekyll::Utils.slugify im Modus default (Jekyll 4): Jede Folge aus
    Zeichen außer Buchstaben (\\p{L}), Markierungen (\\p{M}) und Dezimalziffern
    (\\p{Nd}) wird ein „-“, Bindestriche am Anfang und Ende fallen weg, dann
    Kleinschreibung. Beispiele: „Next.js“ → next-js, „C#“ → c, „.NET“ → net."""
    chars = []
    for ch in text:
        cat = unicodedata.category(ch)
        chars.append(ch if cat[0] in "LM" or cat == "Nd" else "-")
    slug = re.sub(r"-+", "-", "".join(chars))
    return slug.strip("-").lower()


def load_yaml(path):
    """PyYAML, sonst Ruby (im Build-Job immer da). Beides fehlt: klare Meldung."""
    try:
        import yaml  # noqa: PLC0415
        return yaml.safe_load(path.read_text(encoding="utf-8"))
    except ImportError:
        pass
    ruby = ("require 'yaml'; require 'json'; require 'date';"
            "puts JSON.dump(YAML.safe_load(File.read(ARGV[0]), permitted_classes: [Date, Time], aliases: true))")
    try:
        out = subprocess.run(["ruby", "-e", ruby, str(path)], capture_output=True, text=True, check=True)
    except (OSError, subprocess.CalledProcessError) as exc:
        sys.exit(f"content-check: {rel(path)} nicht lesbar, weder PyYAML noch Ruby verfügbar ({exc})")
    return json.loads(out.stdout)


def line_of(path, needle):
    pat = re.compile(r"(^|[\s\[,:-])" + re.escape(needle) + r"($|[\s\],#])")
    for no, line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
        if not line.lstrip().startswith("#") and pat.search(line):
            return no
    return 1


def check_skill_ids():
    graph_path = ROOT / "_data/skill_graph.yml"
    cv_path = ROOT / "_data/cv_content.yml"
    if not graph_path.exists() or not cv_path.exists():
        return
    graph = load_yaml(graph_path) or {}
    cv = load_yaml(cv_path) or {}

    chips = {}
    def collect(node):
        if isinstance(node, dict):
            for group in node.get("skill_groups") or []:
                for key in ("core", "skills", "breadth"):
                    for skill in group.get(key) or []:
                        name = skill.get("name") if isinstance(skill, dict) else skill
                        if name:
                            chips.setdefault(slugify(str(name)), str(name))
            for value in node.values():
                collect(value)
        elif isinstance(node, list):
            for value in node:
                collect(value)
    collect(cv)
    if not chips:
        return

    used = [(sid, "foundations") for sid in graph.get("foundations") or []]
    for project in graph.get("projects") or []:
        used += [(sid, f"Projekt {project.get('id')}") for sid in project.get("skills") or []]
    for sid, where in used:
        sid = str(sid)
        if sid in chips:
            continue
        guess = get_close_matches(sid, list(chips), n=1, cutoff=0.5)
        hint = (f"Gemeint ist vermutlich „{chips[guess[0]]}“, ID {guess[0]}."
                if guess else "Den Chip-Namen in _data/cv_content.yml (skill_groups) prüfen.")
        error(graph_path, line_of(graph_path, sid),
              f"Skill-ID „{sid}“ ({where}) passt zu keinem Chip in _data/cv_content.yml. "
              "Der Graph ließe sie still weg.",
              f"{hint} Die ID ist der Chip-Name klein, jede Folge aus Leer- und "
              "Sonderzeichen wird ein Bindestrich („Next.js“ → next-js, „OCR / Tesseract“ → ocr-tesseract).")


DISPLAY_RE = re.compile(r"\$\$(.+?)\$\$", re.S)
INLINE_RE = re.compile(r"(?<![\\$])\$(?!\$)([^$\n]+?)(?<!\\)\$(?!\$)")
DISPLAY_DOUBLE_RE = re.compile(r"\\\\(?=[A-Za-z{}])")
# Zeichen, die kramdown nach einem Backslash als Escape schluckt
KRAMDOWN_ESCAPES = set("\\.*_+-`()[]{}#!<>|\"':$=")


def check_math():
    for path in sorted((ROOT / "_data").glob("*.y*ml")):
        text = path.read_text(encoding="utf-8")
        # Kommentarzeilen ausblenden, Zeilenzahl bleibt erhalten
        text = "\n".join("" if ln.lstrip().startswith("#") else ln for ln in text.split("\n"))
        for m in DISPLAY_RE.finditer(text):
            for d in DISPLAY_DOUBLE_RE.finditer(m.group(1)):
                no = text.count("\n", 0, m.start(1) + d.start()) + 1
                error(path, no, "Display-Mathe $$…$$ mit doppeltem Backslash. Dort steht "
                      "LaTeX unverändert, „\\\\“ ist ein Zeilenumbruch, kein Befehl.",
                      "In $$…$$ einfache Backslashes schreiben (STYLEGUIDE MD-3).")
        masked = DISPLAY_RE.sub(lambda m: re.sub(r"[^\n]", " ", m.group(0)), text)
        for no, line in enumerate(masked.split("\n"), 1):
            for m in INLINE_RE.finditer(line):
                for run in re.finditer(r"\\+", m.group(1)):
                    if len(run.group(0)) % 2 == 0:
                        continue
                    nxt = m.group(1)[run.end():run.end() + 1]
                    why = (f"kramdown macht aus „\\{nxt}“ ein „{nxt}“, MathJax bekommt den Befehl nicht zu sehen"
                           if nxt in KRAMDOWN_ESCAPES else
                           "der einfache übersteht kramdown nur bei manchen Befehlen, bei \\{, \\} oder \\_ "
                           "geht er verloren")
                    error(path, no, f"Inline-Mathe „${m.group(1)}$“ mit einfachem Backslash: {why}.",
                          "In $…$ jeden Backslash verdoppeln, etwa $\\\\{z_n\\\\}$ oder $n\\\\to\\\\infty$ "
                          "(STYLEGUIDE MD-3).")
                    break


# --- Gebaute Seiten ----------------------------------------------------------

class ImgScan(HTMLParser):
    """<img> ohne width oder height innerhalb jedes Elements mit der
    Klasse `container` (Default .page__content)."""

    VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"}

    def __init__(self, container="page__content"):
        super().__init__(convert_charrefs=True)
        self.container = container
        self.stack = []
        self.depth_content = None
        self.hits = []

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == "img" and self.depth_content is not None:
            if not a.get("width") or not a.get("height"):
                self.hits.append((self.getpos()[0], a.get("src", "?")))
        if tag in self.VOID:
            return
        self.stack.append(tag)
        if self.depth_content is None and self.container in (a.get("class") or "").split():
            self.depth_content = len(self.stack)

    def handle_endtag(self, tag):
        if tag in self.VOID or tag not in self.stack:
            return
        while self.stack:
            if self.stack.pop() == tag:
                break
        if self.depth_content is not None and len(self.stack) < self.depth_content:
            self.depth_content = None


def check_site(site):
    posts = site / "posts"
    for path in sorted(posts.rglob("*.html")) if posts.is_dir() else []:
        scan = ImgScan()
        scan.feed(path.read_text(encoding="utf-8"))
        for no, src in scan.hits:
            warn(path, no, f"Bild ohne width/height ({src}). Beim Laden springt das Layout (IMG-3).",
                 "Im Beitrag die Pixelmaße angeben, etwa ![Alt](/assets/images/posts/bild.jpg)"
                 '{: width="1200" height="800"}.')
    for path in sorted(site.rglob("*.html")):
        scan = ImgScan("archive__item-teaser")
        scan.feed(path.read_text(encoding="utf-8"))
        for no, src in scan.hits:
            warn(path, no, f"Kachelbild ohne width/height ({src}). Der Build liest die Maße aus der "
                 "Datei, das ging hier nicht. Beim Laden springt das Layout (IMG-3).",
                 "header.teaser im Beitrag auf ein JPEG, PNG, WebP oder GIF zeigen lassen, Pfad "
                 "ab der Wurzel, etwa /assets/images/posts/bild.jpg.")


def main(argv):
    if len(argv) == 3 and argv[1] == "--site":
        site = pathlib.Path(argv[2])
        if not site.is_dir():
            sys.exit(f"content-check: {site} fehlt, erst bauen")
        check_site(site)
        scope = f"gebaute Beiträge in {site}"
    elif len(argv) == 1:
        check_sources()
        check_skill_ids()
        check_math()
        scope = "Quellen"
    else:
        print(__doc__)
        return 2
    for w in warnings:
        print(w)
    for e in errors:
        print(e)
    if errors:
        print(f"\nInhalts-Check ({scope}): {len(errors)} Fehler, {len(warnings)} Warnung(en). "
              "Hilfe: docs/pflege.md, Abschnitt „Prüfen vor dem Push“.")
        return 1
    print(f"Inhalts-Check OK ({scope}{f', {len(warnings)} Warnung(en)' if warnings else ''})")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
