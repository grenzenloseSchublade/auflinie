#!/bin/bash
# Farb-Guardrail (Token-Skalen, STYLEGUIDE FARB-1, FARB-5, FARB-6, FARB-8, FARB-9)
#
# Prüft assets/_sass auf fünf Fehlerklassen:
#  1. Farbliterale (Hex, rgb()/rgba()/hsl()/hsla()/hwb()/lab()/lch()/oklab()/
#     oklch() mit Zahlen, Farbnamen) außerhalb von assets/_sass/variables/.
#     Farben kommen aus variables/_colors.scss (FARB-1). Kommentare und
#     url(...) zählen nicht.
#  2. Ad-hoc-Abstufung rgba($hover-color, …) außerhalb von variables/
#     (FARB-6, Owner-Regel vom 8. Juli 2026). Keine Ausnahme möglich:
#     benannte Stufe $magenta-aNN aus _colors.scss nehmen oder dort anlegen.
#  3. Alpha-auf-Alpha (FARB-5): rgba()/hsla() auf ein Token, das schon Alpha
#     trägt. Sass ERSETZT den Alpha-Kanal, statt ihn zu multiplizieren —
#     rgba($console-panel-border, 0.7) ergibt 70 % Weiß statt 5,6 %. Gilt
#     überall, auch in variables/.
#  4. Notation der Literale in variables/ (FARB-8): Hex lang und klein,
#     rgb(r g b / a%) statt Komma-Schreibweise, keine Farbnamen.
#  5. Doppelte Literale in variables/_colors.scss (FARB-9): gleicher Wert =
#     Alias auf das erste Token, kein zweites Literal (Textvergleich nach
#     Kleinschreibung, #ffffff und rgb(255 255 255) gelten als verschieden).
#
# Bewusste Ausnahmen (Effektwerte: CRT-Phosphor, Neon-Flackern) tragen einen
# Marker:
#   // farb-Ausnahme: <Grund>        in der Zeile DIREKT ÜBER der Deklaration.
#                                     Gilt für die ganze Deklaration, auch
#                                     wenn sie über mehrere Zeilen läuft.
#   // farb-Ausnahme: [Block] <Grund>  … // farb-Ausnahme-Ende
#                                     für zusammenhängende Effekt-Abschnitte.
#                                     Ein Block ohne Ende (oder ein Ende
#                                     ohne Block) ist ein Verstoß, sonst
#                                     nähme er still den Rest der Datei aus.
# Beide Formen enthalten „farb-Ausnahme:“ und erscheinen so im Register-Grep
# aus STYLEGUIDE GOV-5.
#
# Nutzung: scripts/color-guardrail.sh   (Exit 0 = sauber, 1 = Verstoß)
# Läuft im Lint-Job der CI (nach dem Schriftgrößen-Guardrail).
set -u
cd "$(dirname "$0")/.."

SASS_DIR=assets/_sass
FAIL=0

# --- 1. und 2.: Literale und rgba($hover-color, …) außerhalb von variables/ --
FILES=$(find "$SASS_DIR" -name '*.scss' -not -path "$SASS_DIR/variables/*" | sort)

# shellcheck disable=SC2086
V=$(awk '
  function strip(s) {
    gsub(/\/\*.*\*\//, "", s)            # /* … */ in einer Zeile
    sub(/(^|[ \t])\/\/.*$/, "", s)       # // Kommentar (nicht in url(//…))
    gsub(/url\([^)]*\)/, "", s)          # url(#filter) ist keine Farbe
    return s
  }
  function trim(s) { sub(/^[ \t]+/, "", s); sub(/[ \t]+$/, "", s); return s }
  # Zeile setzt die Deklaration davor fort (Mehrzeilen-Werte wie box-shadow,
  # Verläufe): nicht leer, kein reiner Kommentar, endet nicht auf ; { }
  function cont(s,   t) {
    t = trim(strip(s))
    if (t == "") return 0
    return (t !~ /[;{}]$/)
  }
  function flush(   i, s, code, hit) {
    inblock = 0
    for (i = 1; i <= n; i++) {
      if (L[i] ~ /farb-Ausnahme: *\[Block\]/) {
        if (inblock) print "FARB-BLOCK " file ":" i ": neuer [Block] vor dem farb-Ausnahme-Ende des Blocks aus Zeile " inblock
        inblock = i; continue
      }
      if (L[i] ~ /farb-Ausnahme-Ende/) {
        if (!inblock) print "FARB-BLOCK " file ":" i ": farb-Ausnahme-Ende ohne offenen [Block]"
        inblock = 0; continue
      }
      code = strip(L[i])
      if (code ~ /rgba?\([ \t]*\$hover-color[ \t]*,/) {
        print "FARB-6 " file ":" i ": " trim(L[i]); continue
      }
      if (inblock) continue
      hit = 0
      if (code ~ /#[0-9a-fA-F][0-9a-fA-F][0-9a-fA-F][0-9a-fA-F]*([^0-9a-zA-Z_-]|$)/) hit = 1
      if (code ~ /(^|[^a-zA-Z0-9_-])(rgba?|hsla?|hwb|lab|lch|oklab|oklch)\([ \t]*[0-9.]/) hit = 1
      if (code ~ /(^|[^a-zA-Z0-9_$-])(white|black|red|green|blue|yellow|cyan|magenta|aqua|fuchsia|lime|navy|teal|olive|maroon|purple|silver|gray|grey|orange|pink|gold|brown|violet|indigo)([^a-zA-Z0-9_-]|$)/ \
          && code !~ /^[ \t]*[@.&#:[]/) hit = 1
      if (!hit) continue
      s = i
      while (s > 1 && cont(L[s - 1])) s--
      if (s > 1 && L[s - 1] ~ /farb-Ausnahme/) continue
      print "FARB-1 " file ":" i ": " trim(L[i])
    }
    if (inblock) print "FARB-BLOCK " file ":" inblock ": [Block] ohne farb-Ausnahme-Ende, nähme den Rest der Datei aus"
  }
  FNR == 1 && NR > 1 { flush(); n = 0 }
  FNR == 1 { file = FILENAME }
  { L[++n] = $0 }
  END { if (n) flush() }
' $FILES)

if [ -n "$V" ]; then
  if printf '%s\n' "$V" | grep -q '^FARB-1 '; then
    echo "VERSTOSS (FARB-1/FARB-8) — Farbliteral außerhalb von $SASS_DIR/variables/ ohne farb-Ausnahme-Marker:"
    printf '%s\n' "$V" | sed -n 's/^FARB-1 /  /p'
    echo "Fix: Token aus $SASS_DIR/variables/_colors.scss verwenden (Skalen \$cyan-aNN,"
    echo "\$white-aNN, \$black-aNN, \$magenta-aNN …) oder dort zuerst anlegen. Nur echte"
    echo "Effektwerte bekommen einen '// farb-Ausnahme: <Grund>'-Kommentar darüber."
    echo
  fi
  if printf '%s\n' "$V" | grep -q '^FARB-6 '; then
    echo "VERSTOSS (FARB-6) — Ad-hoc-Abstufung rgba(\$hover-color, …):"
    printf '%s\n' "$V" | sed -n 's/^FARB-6 /  /p'
    echo "Fix: benannte Stufe \$magenta-aNN aus $SASS_DIR/variables/_colors.scss nehmen."
    echo
  fi
  if printf '%s\n' "$V" | grep -q '^FARB-BLOCK '; then
    echo "VERSTOSS — ungepaarter farb-Ausnahme-Block:"
    printf '%s\n' "$V" | sed -n 's/^FARB-BLOCK /  /p'
    echo "Fix: jeden '// farb-Ausnahme: [Block] <Grund>' mit '// farb-Ausnahme-Ende' schließen."
    echo
  fi
  FAIL=1
fi

# --- 3. Alpha-auf-Alpha (FARB-5) ---------------------------------------------
# Tokens mit eingebautem Alpha: Wert ist rgb(… / a), rgba(…, a), hsla(…) oder
# ein Alias auf ein solches Token (transitiv).
ALPHA=$(grep -rhE '^[ \t]*\$[a-zA-Z0-9_-]+[ \t]*:' "$SASS_DIR" --include='*.scss' | awk '
  {
    line = $0
    sub(/\/\/.*$/, "", line)
    name = line; sub(/^[ \t]*\$/, "", name); sub(/[ \t]*:.*$/, "", name)
    val = line;  sub(/^[^:]*:[ \t]*/, "", val); sub(/[ \t]*(!default)?[ \t]*;?[ \t]*$/, "", val)
    if (val ~ /^(rgb|hsl)a?\(.*\/[ \t]*[0-9.]+%?[ \t]*\)$/ || val ~ /^(rgba|hsla)\(.*,.*\)$/ \
        || val ~ /^(transparentize|fade-out|fade-in|opacify)\(/) alpha[name] = 1
    else if (val ~ /^\$[a-zA-Z0-9_-]+$/) { sub(/^\$/, "", val); alias[name] = val }
  }
  END {
    do {
      changed = 0
      for (a in alias) if (!(a in alpha) && (alias[a] in alpha)) { alpha[a] = 1; changed = 1 }
    } while (changed)
    for (a in alpha) print a
  }')

V=""
for t in $ALPHA; do
  H=$(grep -rnE "(rgba|hsla|rgb|hsl)\([ \t]*\\\$$t[ \t]*," "$SASS_DIR" --include='*.scss' | grep -vE '^[^:]+:[0-9]+:[ \t]*//')
  [ -n "$H" ] && V="$V$H
"
done
if [ -n "$V" ]; then
  echo "VERSTOSS (FARB-5) — rgba()/hsla() auf ein Token mit eingebautem Alpha:"
  printf '%s' "$V" | sed 's/^/  /'
  echo "Sass ersetzt den Alpha-Kanal, statt ihn zu multiplizieren. Fix: die gewünschte"
  echo "Stufe als eigenes Token aus der deckenden Grundfarbe ableiten."
  echo
  FAIL=1
fi

# --- 4. Notation in variables/ (FARB-8) --------------------------------------
V=$(awk '
  {
    code = $0
    sub(/(^|[ \t])\/\/.*$/, "", code)
    bad = 0
    if (code ~ /#[0-9a-f]*[A-F][0-9a-fA-F]*([^0-9a-zA-Z_-]|$)/) bad = 1
    if (code ~ /#[0-9a-fA-F][0-9a-fA-F][0-9a-fA-F][0-9a-fA-F]?([^0-9a-zA-Z_-]|$)/) bad = 1
    if (code ~ /(rgba?|hsla?)\([ \t]*[0-9.]+[ \t]*,/) bad = 1
    if (code ~ /:[^;]*(^|[^a-zA-Z0-9_$-])(white|black|red|green|blue|yellow|cyan|magenta|aqua|fuchsia|lime|navy|teal|olive|maroon|purple|silver|gray|grey|orange|pink|gold|brown|violet|indigo)([^a-zA-Z0-9_-]|$)/) bad = 1
    if (bad) print "  " FILENAME ":" FNR ": " $0
  }
' "$SASS_DIR"/variables/*.scss)
if [ -n "$V" ]; then
  echo "VERSTOSS (FARB-8) — Literal-Notation in $SASS_DIR/variables/:"
  printf '%s\n' "$V"
  echo "Fix: Hex lang und klein (#ffffff), sonst rgb(r g b / a%), keine Farbnamen."
  echo
  FAIL=1
fi

# --- 5. Doppelte Literale in _colors.scss (FARB-9) ---------------------------
V=$(awk '
  /^[ \t]*\$[a-zA-Z0-9_-]+[ \t]*:/ {
    line = $0
    sub(/[ \t]*\/\/.*$/, "", line)
    name = line; sub(/^[ \t]*/, "", name); sub(/[ \t]*:.*$/, "", name)
    val = line;  sub(/^[^:]*:[ \t]*/, "", val); sub(/[ \t]*(!default)?[ \t]*;[ \t]*$/, "", val)
    if (val !~ /^(#[0-9a-fA-F]+|rgba?\([0-9 .\/%,]+\))$/) next
    key = tolower(val); gsub(/[ \t]+/, " ", key)
    if (key in first) print "  " FILENAME ":" FNR ": " name " = " val " (gleicher Wert wie " first[key] ")"
    else first[key] = name
  }
' "$SASS_DIR"/variables/_colors.scss)
if [ -n "$V" ]; then
  echo "VERSTOSS (FARB-9) — zweites Literal für denselben Wert:"
  printf '%s\n' "$V"
  echo "Fix: als Alias auf das erste Token schreiben."
  echo
  FAIL=1
fi

if [ "$FAIL" -ne 0 ]; then
  exit 1
fi
echo "Farb-Guardrail OK: keine unmarkierten Farbliterale, keine Ad-hoc-Magenta-Stufen, kein Alpha-auf-Alpha, Notation und Aliase in variables/ sauber"
