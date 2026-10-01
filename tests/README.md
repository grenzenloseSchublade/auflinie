# Tests

Drei Gruppen, alle mit Playwright:

- **`spa-nav.spec.js`** – Regressionstests der Persistent-Shell-Navigation
  (`assets/js/spa-nav.js`, siehe [`README-spa-nav.md`](../README-spa-nav.md)).
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

Alles läuft in der CI im Build-Job (Schritt „Style-Guide-Review“) und blockiert bei Fehlern den Deploy.

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
docker run --rm --user "$(id -u):$(id -g)" -e HOME=/tmp -v "$PWD":/srv -w /srv ruby:3.4.8-slim \
  bash -c "bundle config set --local path vendor/bundle >/dev/null; JEKYLL_ENV=production bundle exec jekyll build --unpublished -d _site_review"

# 2) Tests im Playwright-Container (startet den Server tests/serve.js selbst)
docker run --rm --user "$(id -u):$(id -g)" -e HOME=/tmp -v "$PWD":/w -w /w --ipc=host \
  mcr.microsoft.com/playwright:v1.63.0-noble npx playwright test

# Gewollte visuelle Änderung: Vergleichsbilder neu erzeugen und mitcommitten
#   ... npx playwright test tests/visual --update-snapshots
# a11y-Baseline neu schreiben (nur bewusst, Diff prüfen, darf nur schrumpfen)
#   ... npm run test:a11y:baseline
```

Styleguide-Ansicht im Browser: `bundle exec jekyll serve --unpublished`, dann
<http://localhost:4000/auflinie/styleguide/>.
