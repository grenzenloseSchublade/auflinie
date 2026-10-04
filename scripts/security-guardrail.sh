#!/bin/bash
# Security-Guardrail (Quellcode, Security-Audit 10/2026)
#
# Verhindert, dass behobene Fehlerklassen zurückkommen:
#  1. GitHub Actions nur über volle Commit-SHAs (Tags sind verschiebbar)
#  2. remote_theme auf Commit-SHA gepinnt
#  3. Service Worker liest/löscht nur eigene Caches (geteilter github.io-Origin):
#     kein caches.match() ohne eigenen Cache, kein origin-weites Löschen
#  4. Kein getRegistrations() (lieferte auch fremde Worker des Origins)
#  5. Keine Inline-Skripte und Inline-Handler (jedes on…=) in Templates und
#     Inhalten (_includes, _layouts, _pages, _posts, _drafts, Seiten im
#     Wurzelverzeichnis), CSP ohne 'unsafe-inline'. Datenblöcke (JSON-LD,
#     speculationrules) sind erlaubt. Geprüft wird jedes <script>-Tag
#     einzeln, ein src= anderswo in der Zeile entschuldigt nichts.
#     Code-Blöcke und Inline-Code in Markdown sind Beispieltext
#  6. Cache-Präfix nur als sw_cache_prefix in _config.yml (SEC-5c), nicht leer
#     und kein zweites Literal in Skripten oder Templates
#
# Nutzung: scripts/security-guardrail.sh   (Exit 0 = sauber, 1 = Verstoß)
# Läuft im Lint-Job der CI. Gegenstück nach dem Build: scripts/csp-check.py
set -u
cd "$(dirname "$0")/.."
FAIL=0
fail() { echo "VERSTOSS: $1"; FAIL=1; }

V=$(grep -nE '^\s*(-\s*)?uses:\s*[^ ]+@' .github/workflows/*.yml | grep -vE '@[0-9a-f]{40}(\s|$)')
[ -n "$V" ] && fail "Action nicht auf Commit-SHA gepinnt:
$V"

grep -qE '^remote_theme:\s*"?[^@"]+@[0-9a-f]{40}"?' _config.yml \
  || fail "remote_theme in _config.yml nicht auf Commit-SHA gepinnt"

V=$(grep -nE '(^|[^.])caches\.match\(' service-worker.js | grep -vE '^[0-9]+:\s*//')
[ -n "$V" ] && fail "service-worker.js: caches.match() durchsucht alle Caches des Origins, matchOwn() nutzen:
$V"
grep -q 'startsWith(CACHE_PREFIX)' service-worker.js \
  || fail "service-worker.js: activate löscht nicht mehr präfixgefiltert"

PREFIX=$(sed -nE 's/^sw_cache_prefix:[[:space:]]*"?([^"#[:space:]]*)"?.*/\1/p' _config.yml | head -1)
if [ -z "$PREFIX" ]; then
  fail "_config.yml: sw_cache_prefix fehlt oder ist leer (ein leerer Präfix löschte fremde Caches)"
else
  V=$(grep -rnF -- "$PREFIX" assets/js service-worker.js _layouts _includes 2>/dev/null)
  [ -n "$V" ] && fail "Cache-Präfix als Literal, Quelle ist nur sw_cache_prefix in _config.yml:
$V"
fi

V=$(grep -rn 'getRegistrations()' assets/js service-worker.js | grep -vE '^[^:]+:[0-9]+:\s*//')
[ -n "$V" ] && fail "getRegistrations() trifft auch fremde Worker, getRegistration(scope) nutzen:
$V"

# Templates und Inhalte zeilenweise als datei:zeile:text. In Markdown ohne
# Code-Blöcke und Inline-Code: ein Code-Beispiel im Beitrag ist Text.
SRC=$( { find _includes _layouts _pages _posts _drafts -type f \
           \( -name '*.html' -o -name '*.md' -o -name '*.markdown' \) 2>/dev/null
         ls index.html 404.html offline.html 2>/dev/null; } | sort | xargs awk '
  FNR == 1 { fence = ""; md = (FILENAME ~ /\.(md|markdown)$/) }
  md && match($0, /^[ \t]*(```|~~~)/) {
    mark = substr($0, RSTART + RLENGTH - 3, 3)
    if (fence == "") fence = mark; else if (fence == mark) fence = ""
    next
  }
  fence != "" { next }
  { line = $0; if (md) gsub(/`+[^`]*`+/, "", line); print FILENAME ":" FNR ":" line }
')

# Inline-Skripte: jedes <script>-Tag ohne src und ohne Daten-Typ
V=$(printf '%s\n' "$SRC" | awk '
  {
    rest = $0
    while (match(rest, /<script([ \t][^>]*)?>/)) {
      tag = substr(rest, RSTART, RLENGTH)
      rest = substr(rest, RSTART + RLENGTH)
      if (tag ~ /[ \t]src=/) continue
      if (tag ~ /type="(application\/ld\+json|application\/json|speculationrules)"/) continue
      print; break
    }
  }')
[ -n "$V" ] && fail "Inline-Script in Template oder Beitrag (CSP verbietet es, Code nach assets/js/):
$V"

V=$(printf '%s\n' "$SRC" | grep -E '<[a-zA-Z][^>]*[[:space:]]on[a-z]+[[:space:]]*=')
[ -n "$V" ] && fail "Inline-Event-Handler (CSP), addEventListener nutzen:
$V"

if [ "$FAIL" -ne 0 ]; then
  echo
  echo "Hintergrund: STYLEGUIDE.md, Abschnitt Sicherheit."
  exit 1
fi
echo "Security-Guardrail OK"
