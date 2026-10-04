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
  - `a11y.spec.js`: axe-core (WCAG 2.2 AA) auf den echten Seiten, jedem Beitrag des
    Review-Builds und der Styleguide-Ansicht (Liste in `visual/pages.js`, neue Beiträge
    sind automatisch dabei), einmal in Fensterbreite und einmal bei 320 px, dort mit
    Reflow-Prüfung (kein waagerechtes Scrollen, WCAG 1.4.10). Bekannte Befunde stehen in
    `visual/a11y-known.json`, nur neue Verstöße brechen ab. Befunde, die an einem
    Inhaltsmuster hängen (Aufgabenliste, breiter Code-Block), nimmt `KNOWN_PATTERNS` mit
    Verweis aufs Register aus, sonst machte jeder neue Beitrag die CI rot.
  - `invariants.spec.js`: Verhalten statt Aussehen. Fokusführung, `aria-expanded`, `inert`,
    Escape und Light Dismiss an Drawer, Autor- und TOC-Dropdown und Skill-Graph-Sheet, der
    Blog-Hinweis im Top Layer, kein unsichtbares Element mit Tastaturfokus (Tab-Runde auf
    allen Seiten aus `visual/pages.js`), die
    Breakpoint-Grenzen 767/768 und 1023/1024 und dass Touch nach dem Antippen keinen
    Theme-Hover festhält (BP-3).
  - `links.spec.js`: externe Links mit `target="_blank"`, `rel="noopener noreferrer"`,
    verstecktem Hinweis „öffnet in neuem Tab“ und Symbol ohne Umbruch davor, interne
    Links unverändert (LINK-3).
  - `blog-search.spec.js`: Blog-Suche auf `/posts/` filtert nach Titel und Gastname ohne
    Groß- und Kleinschreibung, zeigt den Leerzustand, „Zurücksetzen“ zeigt wieder alles
    und gibt den Fokus ins Suchfeld.
  - `gast-autor.spec.js`: Gastbeitrag (Fixture mit `published: false`, nur im Review-Build)
    mit „von <Name>“, ohne Sidebar-Profil, Gast als Autor in den Metadaten (INH-5).
  - `precache.spec.js`: Jede Datei unter `/assets/`, die eine Seite aus der
    Precache-Liste lädt, steht selbst in `CACHE_URLS` von `service-worker.js`
    (ohne Downloads und Styleguide-Ansicht).

Alles läuft in der CI im Build-Job (Schritt „Style-Guide-Review“) und blockiert bei Fehlern den Deploy.

## Browser

Die Projekte stehen in `playwright.config.js`:

| Projekt | Engine | Tests |
|---|---|---|
| `spa-nav`, `vendor`, `desktop`, `mobil` | Chromium | alles |
| `firefox` | Firefox | `spa-nav`, `vendor`, `invariants`, `a11y`, `blog-search` |
| `firefox-reduce` | Firefox, Reduced Motion | `spa-nav`, `vendor` (Primärplattform des Owners, STYLEGUIDE BRW-2) |
| `webkit` | WebKit | `invariants`, `a11y`, `blog-search` |
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
  15 s (STYLEGUIDE Register R-87). Der stille Tausch ist derselbe Code ohne View
  Transition, die prüfen Chromium und Firefox.
- Die Listener-Zählung über Swap-Runden in `spa-nav.spec.js` (STYLEGUIDE SPA-3)
  braucht das Chrome-DevTools-Protokoll und läuft nur in Chromium. Der Vergleich
  „mit und ohne Bewegung“ (BEW-1a) setzt die Einstellung im eigenen Kontext und
  lässt in WebKit den Fall mit Bewegung aus (R-87).
- WebKit blockt den `speculationrules`-Block per CSP (Register R-86).
  `vendor.spec.js` nimmt genau diese Meldungen in WebKit aus.
- Laufzeit der vollen Suite mit 2 Workern (gemessen 5. 10. 2026 im Container):
  etwa 4,5 min für 357 Tests, vor der Ausweitung von axe und Tab-Runde auf alle
  Beiträge und 320 px etwa 2,6 min für 219 Tests.

Dazu, ohne Browser und ohne Node:

- **`guardrails/`** – Negativtests der Guardrail-Skripte (`scripts/*-guardrail.sh`),
  von `scripts/csp-check.py` (auf der Mini-Site `guardrails/csp-site/`) und von
  `scripts/content-check.py` (Quellen und Mini-Site `guardrails/content-site/`).
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
