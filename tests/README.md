# Tests

Drei Gruppen, alle mit Playwright:

- **`spa-nav.spec.js`** – Regressionstests der Persistent-Shell-Navigation
  (`assets/js/spa-nav.js`, siehe [`docs/features/spa-nav.md`](../docs/features/spa-nav.md)),
  dazu der `spaModule`-Kontrakt: je Seiten-Modul genau ein Mount bei Erstaufbau,
  PE-Fallback, Swap und bfcache-Rückkehr, kein Listener-Leck über Swap-Runden.
- **`vendor.spec.js`** – Prüfung nach jedem Versionswechsel in `assets/vendor/`:
  MathJax setzt auf `/mandelbrot/` alle Formeln (direkt und nach SPA-Navigation,
  ohne Seitenfehler und CSP-Verstoß), die noUiSlider-Griffe sind benannt und per
  Tastatur bedienbar, das Preset (Tom Select) ist wählbar.
- **`visual/`** – automatisches Style-Guide-Review (Regeln: [`STYLEGUIDE.md`](../STYLEGUIDE.md), SG-1 bis SG-3):
  - `styleguide.spec.js`: Screenshot-Vergleich jedes Abschnitts der Styleguide-Ansicht
    (`_pages/styleguide.html`, nie veröffentlicht) und jedes erzwungenen Zustands
    (`data-sg-states`: hover, focus-visible).
  - `contrast.spec.js`: Kontrast jeder Textprobe (`data-sg-min`) gegen ihren tatsächlichen Grund.
  - `a11y.spec.js`: axe-core (WCAG 2.2 AA) auf den echten Seiten und der Styleguide-Ansicht.
    Bekannte Befunde stehen in `visual/a11y-known.json`, nur neue Verstöße brechen ab.
  - `invariants.spec.js`: Verhalten statt Aussehen. Fokusführung, `aria-expanded`, `inert`,
    Escape und Light Dismiss an Drawer, Autor- und TOC-Dropdown und Skill-Graph-Sheet, der
    Blog-Hinweis im Top Layer, kein unsichtbares Element mit Tastaturfokus und die
    Breakpoint-Grenzen 767/768 und 1023/1024.

Alles läuft in der CI im Build-Job (Schritt „Style-Guide-Review“) und blockiert bei Fehlern den Deploy.

## Browser

Die Projekte stehen in `playwright.config.js`:

| Projekt | Engine | Tests |
|---|---|---|
| `spa-nav`, `vendor`, `desktop`, `mobil` | Chromium | alles |
| `firefox` | Firefox | `spa-nav`, `vendor`, `invariants`, `a11y` |
| `firefox-reduce` | Firefox, Reduced Motion | `spa-nav`, `vendor` (Primärplattform des Owners, STYLEGUIDE BRW-2) |
| `webkit` | WebKit | `invariants`, `a11y` |
| `webkit-reduce` | WebKit, Reduced Motion | `spa-nav`, `vendor` |

- Screenshot-Vergleich (`styleguide.spec.js`) und Kontrast (`contrast.spec.js`) laufen
  bewusst nur in Chromium: Schriftglättung, Farbmischung und Rendering sind
  browserabhängig. Eigene Vergleichsbilder je Engine brächten dreifache Pflege,
  aber keine Regel, die besser geprüft wäre.
- Im Container gibt es keine GPU. Firefox und WebKit malen die Seiten mit dem
  CRT-Hero dort nur mit wenigen Bildern pro Sekunde, WebKit während des Boots
  mit unter einem. Die Tests warten deshalb auf Ereignisse (`spa:load`, Ende der
  Übergänge) statt auf feste Zeiten.
- SPA-Wechsel prüft WebKit nur mit Reduced Motion: Der Update-Callback der View
  Transition kommt im Container erst nach 3 bis 5 s, unter Parallel-Last nach über
  15 s (STYLEGUIDE Register R-83). Der stille Tausch ist derselbe Code ohne View
  Transition, die prüfen Chromium und Firefox.
- WebKit blockt den `speculationrules`-Block per CSP (Register R-82).
  `vendor.spec.js` nimmt genau diese Meldungen in WebKit aus.
- Laufzeit der vollen Suite mit 2 Workern auf 4 Kernen (wie ein GitHub-Runner):
  etwa 3 min, davon etwa 30 s Chromium.

Dazu, ohne Browser und ohne Node:

- **`guardrails/`** – Negativtests der Guardrail-Skripte (`scripts/*-guardrail.sh`).
  Jeder Fall in `guardrails/cases/*.case` baut einen absichtlichen Verstoß (oder einen
  erlaubten Grenzfall) in eine Kopie des Repos und erwartet den passenden Exit-Code.
  Aufbau einer Fall-Datei: Kopf von `guardrails/run.py`. Läuft im Lint-Job:
  `python3 tests/guardrails/run.py`.

## Lokal ausführen

Screenshots hängen von Schriften und Rendering ab. Deshalb immer im selben
Container wie die CI (Version = `@playwright/test` in `package.json`):

```bash
# 1) Site inkl. Styleguide-Ansicht bauen (kein lokales Ruby: Docker)
docker run --rm --user "$(id -u):$(id -g)" -e HOME=/tmp -v "$PWD":/srv -w /srv "ruby:$(cat .ruby-version)-slim" \
  bash -c "bundle config set --local path vendor/bundle >/dev/null; JEKYLL_ENV=production bundle exec jekyll build --unpublished -d _site_review"

# 2) Tests im Playwright-Container (startet den Server tests/serve.js selbst)
docker run --rm --user "$(id -u):$(id -g)" -e HOME=/tmp -v "$PWD":/w -w /w --ipc=host \
  mcr.microsoft.com/playwright:v1.63.0-noble npx playwright test

# Nur eine Engine: ... npx playwright test --project=firefox --project=firefox-reduce

# Gewollte visuelle Änderung: Vergleichsbilder neu erzeugen und mitcommitten
#   ... npx playwright test tests/visual --update-snapshots
# a11y-Baseline neu schreiben (nur bewusst, Diff prüfen, darf nur schrumpfen)
#   ... npm run test:a11y:baseline
```

Styleguide-Ansicht im Browser: `bundle exec jekyll serve --unpublished`, dann
<http://localhost:4000/auflinie/styleguide/>.
