#!/bin/bash
# Schriftgrößen-Guardrail (Token-Skala, Juli 2026)
#
# Verhindert neue px/rem-font-size-Literale außerhalb der Token-Zentrale
# (assets/_sass/variables/_typography.scss). Bewusste Ausnahmen tragen in
# der Zeile DARÜBER einen "fs-Ausnahme"-Kommentar (dokumentierter Bestand:
# Hero-em-System, TOC-em-Hierarchie, Scroll-Cue-Glyphe).
#
# Nutzung: scripts/fs-guardrail.sh   (Exit 0 = sauber, 1 = Verstoß)
# Läuft im Lint-Job der CI. Hintergrund: README-tv-umschalt.md /
# Token-Migration (variables/_typography.scss, Kommentarkopf).
set -u
cd "$(dirname "$0")/.."

V=$(grep -rn 'font-size: *[0-9][0-9.]*\(px\|rem\)' assets/_sass --include='*.scss' \
  | grep -v 'variables/_typography' \
  | while IFS=: read -r f n rest; do
      prev=$(sed -n "$((n-1))p" "$f")
      case "$prev" in *fs-Ausnahme*) ;; *) echo "$f:$n:$rest";; esac
    done)

if [ -n "$V" ]; then
  echo "VERSTOSS — font-size-Literal außerhalb der Token-Zentrale ohne fs-Ausnahme-Marker:"
  echo "$V"
  echo
  echo "Fix: Token aus assets/_sass/variables/_typography.scss verwenden"
  echo "oder (begründet!) einen '// fs-Ausnahme: …'-Kommentar in die Zeile darüber."
  exit 1
fi
echo "fs-Guardrail OK: keine unmarkierten font-size-Literale"
