#!/usr/bin/env python3
"""CSP-Prüfung der gebauten Site (Security-Audit 10/2026, N3/I1).

Prüft jede HTML-Datei unter _site:
  - genau eine CSP-Meta, und zwar VOR dem ersten <script> (Meta-CSP gilt nur
    für nachfolgendes Markup)
  - script-src ohne 'unsafe-inline'/'unsafe-eval', keine Wildcard-Quellen
  - keine ausführbaren Inline-Skripte (Datenblöcke wie JSON-LD und
    speculationrules sind erlaubt)
  - keine Inline-Event-Handler (onclick=, onload= ...)
  - die Policy ist auf allen Seiten byte-identisch (spa-nav.js behält die
    Policy der Einstiegsseite)
  - keine http://-URL (STYLEGUIDE SEC-9) in URL-Attributen (href, src,
    srcset, action, content …), in url() eines <style>-Blocks oder in
    einem HTML-Kommentar. Text und Code-Beispiele zählen nicht, ebenso
    xmlns-Namensräume (sind Bezeichner, keine Adressen)
  - jedes target="_blank" trägt rel="noopener noreferrer" (SEC-9, LINK-3).
    Externe Links bekommen beides beim Build über _plugins/external-links.rb

Nutzung: python3 scripts/csp-check.py [_site]   (Exit 0 = sauber, 1 = Verstoß)
"""
from html.parser import HTMLParser
import pathlib
import re
import sys

DATA_TYPES = {"application/ld+json", "application/json", "speculationrules"}
CSP_RE = re.compile(r'<meta\s+http-equiv="Content-Security-Policy"\s+content="([^"]+)"', re.I)
SCRIPT_RE = re.compile(r"<script\b([^>]*)>(.*?)</script>", re.S | re.I)
HANDLER_RE = re.compile(r"<[a-z][^>]*\son[a-z]+\s*=", re.I)
# Theme-Reste, die nie ausgeliefert, aber evtl. mitkopiert werden
SKIP_DIRS = {"assets/vendor"}
URL_ATTRS = {"href", "src", "srcset", "action", "formaction", "poster", "data", "cite",
             "background", "content", "imagesrcset"}
HTTP_RE = re.compile(r"\bhttp://", re.I)
CSS_HTTP_RE = re.compile(r"url\(\s*['\"]?\s*http://", re.I)


class HttpScan(HTMLParser):
    """Sammelt http://-Fundstellen in URL-Attributen, <style>-url() und Kommentaren
    sowie target="_blank" ohne noopener/noreferrer (SEC-9)."""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.hits = []
        self.blank = []
        self.in_style = False

    def handle_starttag(self, tag, attrs):
        self.in_style = tag == "style"
        found = {name.lower(): value or "" for name, value in attrs}
        if found.get("target", "").lower() == "_blank":
            rel = found.get("rel", "").lower().split()
            if "noopener" not in rel or "noreferrer" not in rel:
                self.blank.append(f"<{tag} href=\"{found.get('href', '')[:80]}\" target=\"_blank\">")
        for name, value in attrs:
            name = name.lower()
            if value and (name in URL_ATTRS or name.endswith(":href")) and HTTP_RE.search(value):
                self.hits.append(f"<{tag} {name}=\"{value[:80]}\">")

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        self.in_style = False

    def handle_endtag(self, tag):
        if tag == "style":
            self.in_style = False

    def handle_data(self, data):
        if self.in_style and CSS_HTTP_RE.search(data):
            self.hits.append("<style> mit url(http://…)")

    def handle_comment(self, data):
        if HTTP_RE.search(data):
            self.hits.append(f"Kommentar: {' '.join(data.split())[:80]}")


def main(root: str) -> int:
    base = pathlib.Path(root)
    if not base.is_dir():
        print(f"csp-check: Verzeichnis {root} fehlt (erst jekyll build)")
        return 1
    fails, policies, count = [], {}, 0
    for f in sorted(base.rglob("*.html")):
        rel = f.relative_to(base).as_posix()
        if any(rel.startswith(d) for d in SKIP_DIRS):
            continue
        html = f.read_text(encoding="utf-8", errors="replace")
        # Weiterleitungs-Stubs (jekyll-redirect-from) haben kein <head>-Layout
        if "<html" not in html.lower():
            continue
        count += 1
        metas = CSP_RE.findall(html)
        if len(metas) != 1:
            fails.append(f"{rel}: {len(metas)} CSP-Metas (erwartet: 1)")
            continue
        csp = " ".join(metas[0].split())
        policies.setdefault(csp, []).append(rel)
        first_script = html.lower().find("<script")
        if first_script != -1 and html.find("Content-Security-Policy") > first_script:
            fails.append(f"{rel}: CSP steht nach dem ersten <script>")
        script_src = re.search(r"script-src([^;]*)", csp)
        if script_src and re.search(r"'unsafe-(inline|eval)'", script_src.group(1)):
            fails.append(f"{rel}: unsafe-inline/unsafe-eval in script-src")
        if re.search(r"(^|\s)(https?:|\*)(\s|;|$)", csp):
            fails.append(f"{rel}: Wildcard-Quelle in der CSP")
        for attrs, body in SCRIPT_RE.findall(html):
            if re.search(r"\bsrc\s*=", attrs):
                continue
            t = re.search(r'type\s*=\s*"([^"]+)"', attrs)
            if t and t.group(1).strip().lower() in DATA_TYPES:
                continue
            snippet = " ".join(body.split())[:60]
            fails.append(f"{rel}: Inline-Script ({snippet} …)")
        for m in HANDLER_RE.finditer(html):
            fails.append(f"{rel}: Inline-Event-Handler: {m.group(0)[:80]}")
        scan = HttpScan()
        scan.feed(html)
        for hit in scan.hits:
            fails.append(f"{rel}: http://-URL (SEC-9): {hit}")
        for hit in scan.blank:
            fails.append(f"{rel}: target=\"_blank\" ohne rel=\"noopener noreferrer\" (SEC-9): {hit}")
    if len(policies) > 1:
        variants = "\n    ".join(f"{len(v)} Seiten, z. B. {v[0]}" for v in policies.values())
        fails.append(f"CSP nicht auf allen Seiten identisch:\n    {variants}")
    if fails:
        print("CSP-VERSTOSS:")
        print("\n".join("  " + x for x in fails))
        return 1
    print(f"csp-check OK: {count} Seiten, eine einheitliche Policy, keine Inline-Skripte, keine http://-URL, target=_blank nur mit noopener")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1] if len(sys.argv) > 1 else "_site"))
