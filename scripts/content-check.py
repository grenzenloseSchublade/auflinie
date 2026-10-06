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
  6. FEHLER: Text-Schlüssel der Bedienung fehlt oder ist leer (TEXT_KEYS:
     _data/fractal_panel.yml, texts in _data/skill_graph.yml, powered_by in
     _data/ui-text.yml). Markup und Skripte lesen die Texte von dort (ARCH-4),
     ein vertippter Schlüssel gäbe still einen leeren Knopf- oder
     Screenreader-Namen. Bei den Erklärboxen (panel_explanations in
     _data/mandelbrot.yml) zusätzlich jedes unbekannte Feld (EXPLANATION_FIELDS),
     ein leeres Textfeld und ein Abschnitt ohne Inhalt.

Gebaute Seiten (--site <dir>, nach dem Jekyll-Build):
  7. WARNUNG: <img> ohne width/height im Inhalt eines Beitrags (posts/**,
     IMG-3). Ohne Maße springt das Layout beim Laden.
  8. WARNUNG: Kachelbild eines Beitrags (header.teaser, .archive__item-teaser
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


# Text-Schlüssel, die Markup und Skripte lesen (ARCH-4). Schreibweise: Punkte
# trennen die Ebenen, {a,b} steht für mehrere Schlüssel, name[] für eine
# nicht leere Liste (der Rest des Pfads gilt dann für jeden Eintrag).
# {locale} ist locale aus _config.yml. Neue Texte im Markup hier ergänzen.
TEXT_KEYS = {
    "_data/fractal_panel.yml": [
        "buttons.{focus,recalc,crt}.{label,title,aria_label}",
        "buttons.reset.label",
        "buttons.reset.{julia,explorer}.{title,aria_label}",
        "buttons.fullscreen.{label,label_active,title}",
        "buttons.intensity.{label,label_active,title,aria_label,aria_label_active}",
        "buttons.advanced.{label,label_active,title,title_active}",
        "buttons.extreme_zoom.{label,label_active,title}",
        "buttons.download.{title,aria_label}",
        "buttons.explanation.{label,label_active}",
        "controls.{iterations,colors,real,imag,preset}",
        "controls.color_schemes[].{value,label}",
        "canvas.{keyboard_help,hud_c,hud_zoom,loading,unsupported,zoom_warning,gesture_hint}",
        "julia.canvas.{label,zoom_in,zoom_out}",
        "julia.presets[].{value,label,real,imag}",
        "julia.hint.{mouse,touch}[]",
        "explorer.{mandelbrot,julia}.{title,info}",
        "explorer.{mandelbrot,julia}.canvas.{label,zoom_in,zoom_out}",
        "explorer.hint.{mouse,touch}[]",
    ],
    "_data/skill_graph.yml": [
        "texts.{hint,breadth}",
        "texts.selection.{with_projects,foundation,no_projects}",
        "texts.graph.{open,lead,dialog,close,canvas,unlabeled}",
        "texts.graph.{zoom_out,zoom_in}.{label,title}",
        "texts.graph.{fit,reset}.{text,label,title}",
        "texts.graph.touch_hint[]",
    ],
    "_data/ui-text.yml": ["{locale}.powered_by"],
}
BRACE_RE = re.compile(r"\{([^{}]*,[^{}]*)\}")


def expand(spec):
    m = BRACE_RE.search(spec)
    if not m:
        return [spec]
    return [x for alt in m.group(1).split(",")
            for x in expand(spec[:m.start()] + alt + spec[m.end():])]


def line_of_keys(path, keys):
    """Zeile des letzten Schlüssels, gesucht der Reihe nach ab dem vorigen.
    Steht ein Schlüssel erst davor (geerbt per <<: *anker), zählt der erste."""
    lines = path.read_text(encoding="utf-8").splitlines()
    pos = 0
    for key in keys:
        pat = re.compile(r"^\s*(-\s+)?[\"']?" + re.escape(key) + r"[\"']?\s*:")
        hit = next((i for i in range(pos, len(lines)) if pat.match(lines[i])), None)
        if hit is None:
            hit = next((i for i in range(len(lines)) if pat.match(lines[i])), pos)
        pos = hit
    return pos + 1


def check_text_keys():
    cfg = ROOT / "_config.yml"
    m = re.search(r"^locale:\s*[\"']?([^\"'\s#]+)", cfg.read_text(encoding="utf-8"), re.M) if cfg.exists() else None
    locale = m.group(1) if m else "de-DE"
    for name, specs in TEXT_KEYS.items():
        path = ROOT / name
        if not path.exists():
            continue
        data = load_yaml(path) or {}
        seen = set()

        def report(trail, problem, fix, at=None):
            dotted = ".".join(trail)
            if dotted in seen:
                return
            seen.add(dotted)
            # Zeile: der Schlüssel selbst, bei fehlendem der vertippte oder die Ebene darüber
            keys = [k.split("[")[0] for k in (at if at is not None else trail)]
            error(path, line_of_keys(path, keys), f"Text-Schlüssel „{dotted}“ {problem} Die Stelle "
                  "auf der Website bliebe still leer, auch für Screenreader.", fix)

        def walk(node, segs, trail):
            if not segs:
                if isinstance(node, (dict, list)) or node is None or not str(node).strip():
                    report(trail, "ist leer.", "Den Text zwischen die Anführungszeichen schreiben.")
                return
            seg = segs[0]
            is_list = seg.endswith("[]")
            key = seg[:-2] if is_list else seg
            if not isinstance(node, dict) or key not in node:
                near = get_close_matches(key, [str(k) for k in node], n=1, cutoff=0.6) \
                    if isinstance(node, dict) else []
                fix = (f"Dort steht „{near[0]}“: den Namen links vom Doppelpunkt zurück auf „{key}“ "
                       "setzen. Geändert wird nur der Text in Anführungszeichen." if near else
                       "Den Schlüssel mit Text wieder eintragen, Einrückung wie die Nachbarzeilen "
                       "(zwei Leerzeichen je Ebene, keine Tabs).")
                report(trail + [key], "fehlt.", fix, at=trail + near)
                return
            child = node[key]
            if not is_list:
                walk(child, segs[1:], trail + [key])
                return
            if not isinstance(child, list) or not child:
                report(trail + [key], "ist keine Liste oder leer.",
                       "Mindestens einen Eintrag mit „- “ davor angeben, wie in den Nachbarzeilen.")
                return
            for i, item in enumerate(child, 1):
                walk(item, segs[1:], trail + [f"{key}[{i}]"])

        for spec in specs:
            for full in expand(spec.replace("{locale}", locale)):
                walk(data, full.split("."), [])


# Erklärboxen (panel_explanations in _data/mandelbrot.yml), wie sie
# _includes/fractal/explanation.html liest: erlaubte Felder je Ebene, davon
# Pflicht. Ein unbekannter Name (etwa „txt“ statt „text“) gibt keinen Fehler
# im Build, der Absatz fehlt nur still. Neue Felder im Markup hier ergänzen.
EXPLANATION_VARIANTS = ("julia", "explorer")
EXPLANATION_FIELDS = {
    "explanation": ({"title", "intro", "sections"}, ("title", "sections")),
    "section": ({"title", "text", "groups", "columns", "hint"}, ("title",)),
    "group": ({"title", "text", "hint", "color_schemes"}, ("title",)),
    "column": ({"title", "text"}, ("title", "text")),
}
EXPLANATION_CHILDREN = {"explanation": [("sections", "section")],
                        "section": [("groups", "group"), ("columns", "column")]}
EXPLANATION_TEXT = ("title", "intro", "text", "hint")
SECTION_CONTENT = ("text", "groups", "columns", "hint")


def line_of_path(path, needles):
    """Zeile zur Folge von Suchstellen, jede ab der vorigen gesucht.
    Eine Stelle ist ("key", name) für „name:“ oder ("title", text) für
    „title: "text"“. Ohne Treffer bleibt die vorige Zeile."""
    lines = path.read_text(encoding="utf-8").splitlines()
    pos = 0
    for kind, value in needles:
        if value is None:
            continue
        if kind == "key":
            pat = re.compile(r"^\s*(-\s+)?[\"']?" + re.escape(str(value)) + r"[\"']?\s*:")
        else:
            pat = re.compile(r"^\s*(-\s+)?title\s*:\s*[\"']?" + re.escape(str(value)))
        pos = next((i for i in range(pos, len(lines)) if pat.match(lines[i])), pos)
    return pos + 1


def check_explanations():
    path = ROOT / "_data/mandelbrot.yml"
    if not path.exists():
        return
    data = load_yaml(path) or {}
    lost = "Die Stelle in der Erklärbox bliebe still leer."
    indent = "Einrückung wie die Nachbarzeilen (zwei Leerzeichen je Ebene, keine Tabs)."

    def check(node, kind, trail, needles):
        dotted = ".".join(trail)
        if not isinstance(node, dict):
            error(path, line_of_path(path, needles), f"„{dotted}“ fehlt oder hat keine Felder. {lost}",
                  f"Die Felder wie im Kopfkommentar der Datei eintragen, {indent}")
            return
        allowed, required = EXPLANATION_FIELDS[kind]
        unknown = [str(k) for k in node if k not in allowed]
        for key in unknown:
            near = get_close_matches(key, sorted(allowed), n=1, cutoff=0.5)
            fix = (f"Den Namen links vom Doppelpunkt zurück auf „{near[0]}“ setzen. "
                   "Geändert wird nur der Text rechts davon." if near else
                   f"Erlaubt sind hier: {', '.join(sorted(allowed))}.")
            error(path, line_of_path(path, needles + [("key", key)]),
                  f"Unbekanntes Feld „{key}“ in „{dotted}“. Die Erklärbox liest es nicht, "
                  "der Text fehlte still auf der Seite.", fix)
        # Fehlt ein Pflichtfeld nur wegen eines Tippfehlers, reicht die Meldung oben.
        for key in required:
            if key not in node and not get_close_matches(key, unknown, n=1, cutoff=0.5):
                error(path, line_of_path(path, needles), f"„{dotted}“ ohne „{key}“. {lost}",
                      f"„{key}:“ wie bei den Nachbarn eintragen, {indent}")
        for key in EXPLANATION_TEXT:
            if key in node and (node[key] is None or not str(node[key]).strip()):
                error(path, line_of_path(path, needles + [("key", key)]),
                      f"Feld „{dotted}.{key}“ ist leer. {lost}",
                      "Den Text eintragen oder die ganze Zeile löschen." if key != "title" else
                      "Die Überschrift zwischen die Anführungszeichen schreiben.")
        if kind == "section" and not any(k in node for k in SECTION_CONTENT) \
                and not any(get_close_matches(k, unknown, n=1, cutoff=0.5) for k in SECTION_CONTENT):
            error(path, line_of_path(path, needles),
                  f"Abschnitt „{dotted}“ hat keinen Inhalt (text, groups, columns oder hint). "
                  "In der Box stünde nur die Überschrift.",
                  f"Text unter dem Abschnitt eintragen, {indent}")
        for key, child_kind in EXPLANATION_CHILDREN.get(kind, []):
            if key not in node:
                continue
            items = node[key]
            if not isinstance(items, list) or not items:
                error(path, line_of_path(path, needles + [("key", key)]),
                      f"„{dotted}.{key}“ ist keine Liste oder leer.",
                      "Mindestens einen Eintrag mit „- “ davor angeben, wie in den Nachbarzeilen.")
                continue
            for i, item in enumerate(items, 1):
                title = item.get("title") if isinstance(item, dict) else None
                check(item, child_kind, trail + [f"{key}[{i}]"], needles + [("title", title)])

    explanations = data.get("panel_explanations") if isinstance(data, dict) else None
    if not isinstance(explanations, dict):
        error(path, 1, "„panel_explanations“ fehlt. Beide Erklärboxen der Fraktal-Panels "
              "blieben still leer.", "Den Block mit julia und explorer wieder eintragen.")
        return
    for variant in EXPLANATION_VARIANTS:
        if variant not in explanations:
            near = get_close_matches(variant, [str(k) for k in explanations], n=1, cutoff=0.6)
            if near:
                error(path, line_of_path(path, [("key", "panel_explanations"), ("key", near[0])]),
                      f"„panel_explanations.{variant}“ fehlt. {lost}",
                      f"Dort steht „{near[0]}“: den Namen links vom Doppelpunkt zurück auf „{variant}“ setzen.")
                continue
        check(explanations.get(variant), "explanation", ["panel_explanations", variant],
              [("key", "panel_explanations"), ("key", variant)])


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
        check_text_keys()
        check_explanations()
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
