#!/bin/bash
# Skalen-Guardrail (Ratchet, STYLEGUIDE SP-1, RAD-1, Z-3, MO-1, MO-2, TYP-7)
#
# Zählt Zahlenliterale, die eine Skala aus assets/_sass/variables/ ersetzen
# soll, außerhalb von assets/_sass/variables/: Abstände (margin, padding,
# gap), border-radius, box-shadow, z-index, Dauern und Kurven in
# transition/animation, transition ohne konkrete Eigenschaft und Laufweiten
# (letter-spacing, Kategorie tracking). Dazu die Argumente der Mixins
# card-panel() und mono-label() (scripts/scale-literals.py). Lokale
# Sass-Variablen außerhalb von variables/ ($lokal: 13px) zählen dort, wo
# eine dieser Deklarationen sie liest, wie das Literal selbst.
# Grenzwerte je Kategorie stehen in scripts/scale-baseline.txt. Die CI
# scheitert, sobald eine Zahl STEIGT. Sinkt eine Zahl, meldet das Skript es
# als Hinweis: dann mit --update den Grenzwert senken und mitcommitten.
#
# Bewusste Ausnahmen tragen einen Marker in der Zeile DIREKT ÜBER der
# Deklaration (gilt auch für mehrzeilige Deklarationen):
#   // skala-Ausnahme: <Grund>
# oder für zusammenhängende Effekt-Abschnitte (Choreografien nach MO-4):
#   // skala-Ausnahme: [Block] <Grund>  …  // skala-Ausnahme-Ende
# Ein Block ohne Ende (oder ein Ende ohne Block) ist ein Verstoß. Ein Marker
# über einer Variablen-Definition nimmt jede Stelle aus, die sie liest.
#
# Nutzung: scripts/scale-guardrail.sh            (Exit 0 = sauber, 1 = Verstoß)
#          scripts/scale-guardrail.sh --update   (Grenzwerte nur nach unten)
#          python3 scripts/scale-literals.py --report   (Inventar als Markdown)
# Läuft im Lint-Job der CI.
set -u
cd "$(dirname "$0")/.."

if [ "${1:-}" = "--update" ]; then
  exec python3 scripts/scale-literals.py --update scripts/scale-baseline.txt
fi
exec python3 scripts/scale-literals.py --check scripts/scale-baseline.txt
