# Tests

Drei Gruppen, alle mit Playwright:

- **`navigation.spec.js`** – Seitenwechsel per Cross-Document-View-Transition
  (siehe [`docs/features/seitenwechsel.md`](../docs/features/seitenwechsel.md)):
  jedes Seiten-Modul setzt beim vollen Laden seinen Marker genau einmal, ohne
  Seitenfehler, Titel und `aria-current` nach einem Klick, die Kopfzeile ist ein
  eigener Snapshot, die View Transition läuft mobil mit CRT und unter Reduced
  Motion ohne CRT mit Dauer null, die Speculation Rules sind gültig. „Zurück“
  nach einem Anker-Sprung lädt nicht neu, „Zurück“ in einen Eintrag der alten
  SPA zeigt den Inhalt zur URL (Übergang R-96).
- **`sw.spec.js`** – Service Worker mit echter Registrierung (Projekt `sw`):
  offline kommen precachte Seiten samt Skripten aus dem Cache, unbekannte als
  `offline.html`.
- **`vendor.spec.js`** – Prüfung nach jedem Versionswechsel in `assets/vendor/`:
  MathJax setzt auf `/mandelbrot/` alle Formeln (direkt, nach Neuladen und nach Zurück,
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
    `visual/a11y-known.json`, nur neue Verstöße brechen ab. Markdown-Inhalte (Codeblöcke,
    Aufgabenlisten) macht `_plugins/inhalts-a11y.rb` beim Build zugänglich, ein neuer
    Beitrag braucht dafür keine Ausnahme.
  - `invariants.spec.js`: Verhalten statt Aussehen. Fokusführung, `aria-expanded`, `inert`,
    Escape und Light Dismiss an Drawer, Autor- und TOC-Dropdown und Skill-Graph-Sheet, der
    Blog-Hinweis im Top Layer, kein unsichtbares Element mit Tastaturfokus (Tab-Runde auf
    allen Seiten aus `visual/pages.js`), die
    Breakpoint-Grenzen 767/768 und 1023/1024, dass Touch nach dem Antippen keinen
    Theme-Hover festhält (BP-3), dass Menü-Knopf und Buttons auf Touch 44 px
    treffen (6.1, Polster per `touch-target-pad`) und dass Kachelbilder die Maße ihrer Datei tragen
    (`_plugins/bildmasse.rb`, IMG-3).
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
    (ohne Downloads und Styleguide-Ansicht). Umgekehrt existiert jeder
    Asset-Eintrag in `CACHE_URLS`.

Alles läuft in der CI im Build-Job (Schritt „Style-Guide-Review“) und blockiert bei Fehlern den Deploy.

Inhalte bleiben ohne Teständerung pflegbar (STYLEGUIDE ARCH-5): Tests ohne Bezug
zum Blog-Hinweis behandeln ihn über `blog-hinweis.js` als schon geschlossen, ein
eingeschalteter Hinweis blockiert sie also nicht. Als Beispiele dienen der Skill
„Python“, die Seite „Über mich“ und die Beiträge „Erstellung dieser Website“ und
„Blogbeitrag erstellen“ (Hinweis in `docs/pflege.md`).

## Browser

Die Projekte stehen in `playwright.config.js`:

| Projekt | Engine | Tests |
|---|---|---|
| `navigation`, `vendor`, `desktop`, `mobil` | Chromium | alles außer `sw` |
| `sw` | Chromium, Service Worker erlaubt | `sw` (alle anderen Projekte blockieren den Worker) |
| `firefox` | Firefox | `navigation`, `vendor`, `invariants`, `a11y`, `blog-search` |
| `firefox-reduce` | Firefox, Reduced Motion | `navigation`, `vendor` (Primärplattform des Owners, STYLEGUIDE BRW-2) |
| `webkit` | WebKit | `invariants`, `a11y`, `blog-search` |
| `webkit-reduce` | WebKit, Reduced Motion | `navigation`, `vendor` |

- Screenshot-Vergleich (`styleguide.spec.js`) und Kontrast (`contrast.spec.js`) laufen
  bewusst nur in Chromium: Schriftglättung, Farbmischung und Rendering sind
  browserabhängig. Eigene Vergleichsbilder je Engine brächten dreifache Pflege,
  aber keine Regel, die besser geprüft wäre.
- Im Container gibt es keine GPU. Firefox und WebKit malen die Seiten mit dem
  CRT-Hero dort nur mit wenigen Bildern pro Sekunde, WebKit während des Boots
  mit unter einem. Die Tests warten deshalb auf Ereignisse (Laden, Ende der
  Übergänge) statt auf feste Zeiten.
- Seitenwechsel prüft WebKit nur mit Reduced Motion, dort hat die View
  Transition Dauer null (STYLEGUIDE Register R-87). Der Vergleich „mit und ohne
  Bewegung“ (BEW-3) setzt die Einstellung im eigenen Kontext und lässt in WebKit
  den Fall mit Bewegung aus. Firefox kennt keine Cross-Document-View-Transition,
  der Test überspringt sich dort.
- Die bfcache-Rückkehr lässt sich headless nicht prüfen: Chromium meldet in
  `notRestoredReasons` den Grund „masked“, Playwright schaltet den Cache ohnehin
  ab. Belegt ist sie in der Messung mit sichtbarem Browser unter Xvfb
  (`docs/features/seitenwechsel.md`).
- Die CSP erlaubt den `speculationrules`-Block per Hash (SEC-3), keine Engine
  meldet dazu etwas. `navigation.spec.js` zählt deshalb jeden CSP-Fehler und jede
  CSP-Warnung als Befund, `vendor.spec.js` jeden CSP-Verstoß.
- Laufzeit der vollen Suite mit 2 Workern (gemessen 5. 10. 2026 im Container):
  etwa 4,5 min für 358 Tests, vor der Ausweitung von axe und Tab-Runde auf alle
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
