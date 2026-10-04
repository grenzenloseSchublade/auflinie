# Entwicklungsumgebung für Fraktale Welten

Diese Entwicklungsumgebung stellt Jekyll (Ruby) und Node-Tooling (Stylelint, ESLint, Playwright) für die Website-Entwicklung bereit. Die Fraktal-Visualisierungen laufen als JavaScript direkt im Browser (`assets/js/fractal-*.js`).

## Einrichtung

Die Entwicklungsumgebung ist mit Visual Studio Code und Dev Containers konfiguriert:

1. [Visual Studio Code](https://code.visualstudio.com/) installieren
2. Die [Dev-Containers-Erweiterung](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers) installieren
3. [Docker Desktop](https://www.docker.com/products/docker-desktop) installieren
4. Das Projekt in VS Code öffnen und bei der Nachfrage „Reopen in Container“ wählen

## Enthaltene Komponenten

- Ruby in der Version aus `.ruby-version` + Bundler (Jekyll, Remote-Theme Minimal Mistakes)
- Node in der Version aus `.nvmrc`, in der CI wie im Dev Container (Stylelint via `npm run lint:css`, Playwright-Tests in `tests/`)
- ESLint via `npm run lint:js` prüft `assets/js/` und `tests/` auf undefinierte Namen, toten Code und `innerHTML` mit Daten (Regeln und Ausnahmen in `eslint.config.mjs`, läuft auch im CI-Lint-Job).
- Hilfsskripte: `scripts/fs-guardrail.sh` (Schriftgrößen-Tokens), `scripts/color-guardrail.sh` (Farb-Tokens, Ausnahmen per `// farb-Ausnahme:`), `scripts/scss-format.py` (Einrückung und Endleerzeichen in `assets/_sass`, mit `--fix` korrigieren), `scripts/sass-deprecation-check.sh` (eigene Sass-Deprecations, braucht Jekyll, also im Ruby-Container), `scripts/ubuntu-font-subset.py` (erzeugt die Textschrift `assets/webfonts/ubuntu-latin-*.woff2` aus dem Canonical-Paket, braucht `fonttools` und `brotli`, nur bei einem neuen Subset nötig), `scripts/cascade-check.py`, `scripts/scale-guardrail.sh` (Ratchet für Abstände, Radien, Schatten, z-index und Motion, Grenzwerte in `scripts/scale-baseline.txt`, nach einer Migration mit `--update` senken, Inventar per `python3 scripts/scale-literals.py --report`, Ausnahmen per `// skala-Ausnahme:`), `scripts/scss-format.py` (Einrückung und Endleerzeichen in `assets/_sass`, mit `--fix` korrigieren), `scripts/sass-deprecation-check.sh` (eigene Sass-Deprecations, braucht Jekyll, also im Ruby-Container), `scripts/cascade-check.py`, `scripts/bp-guardrail.sh` (Breakpoints nur über `up()`/`down()`, JS-Spiegel in `site-utils.js` und Critical-CSS), `scripts/scss-format.py` (Einrückung und Endleerzeichen in `assets/_sass`, mit `--fix` korrigieren), `scripts/sass-deprecation-check.sh` (eigene Sass-Deprecations, braucht Jekyll, also im Ruby-Container), `scripts/cascade-check.py`

## Jekyll / Hero

- **CRT-Overlay** (Scanlines, Retro-Look) bei Seiten mit `header.overlay_image`: global in `_config.yml` mit `hero_crt_intensity: "stark"` (Standard) oder `"dezent"`. Pro Seite: `header.crt_intensity: dezent`.
- **Schichten / Roll:** Abdunkelung Preboot/Boot-Ausblend nur noch als **`::after`** auf `.page__hero--overlay[data-background-image]` (`z-index: 15`) → **`.page__hero-crt-media`** (`z-index: 2`) umschließt CRT-Malerei (`svg-defs`, `crt-layer`, `grain`, `roll`, `noise`). **`--crt-roll-travel: calc(100cqh + 32vh)`** (`container-type: size` auf `.page__hero-crt-media`) — nicht `100%` im gleichen `calc` für `translateY` am schmalen `::before`, sonst würde die Prozentangabe gegen die **Balkenhöhe** statt gegen die **Media-Höhe** aufgelöst und der Roll nur in einem mittleren Streifen sichtbar. **Power-Steuerung** (nur Startseite mit Overlay-Bild) und **`.wrapper`** liegen außerhalb der Media-Box. Overlay nutzt wieder **`isolation: isolate`**.
- **Eingangsanimation „Tube Boot“:** einmal pro Session (`sessionStorage` `auflinie:hero-crt:boot`). Sequenz nach `loaded` und **`load`/`complete`**: `page__hero--crt-preboot` (Overlay-`::after` über Bild + CRT + Text, `z-index: 15`; Power-Button bleibt darüber) + CRT-Filter wie Tube-Start → Pause (**0,9 s**, `HERO_CRT_PREBOOT_DELAY_MS`) → `page__hero--crt-boot` (**ca. 3,5 s** Tube + gleich langes Ausblenden des `::after`). Tube-Ende per **`animationend`** oder Timeout-Fallback (`HERO_TUBE_BOOT_DURATION_MS` + Puffer). **Nur** dieser initiale Boot — **nicht** beim Umschalten Lesemodus/Retro. **CRT-Hero** (Boot, Roll, Canvas, Flash) hängt **nicht** an `prefers-reduced-motion`; die Systemeinstellung „Reduzierte Bewegung“ betrifft die übrige Seite (s. [`_custom.scss`](assets/_sass/_custom.scss)).
- **Performance (Hero-CRT):** Canvas-Rauschen nutzt einen **wiederverwendeten `ImageData`-Puffer**, **Zeitdrossel** (`HERO_CRT_NOISE_TARGET_FPS`, Standard 10 FPS) statt festem „jedes 3. RAF-Frame“-Raster, und pausiert bei **`document.visibilityState === 'hidden'`** (kein RAF im Hintergrundtab). Flash-Timeout: **ID auf dem Overlay**, `clearTimeout` vor erneutem Toggle, **`pagehide`** räumt auf; Dauer aus **`getComputedStyle` → `--hero-crt-mode-flash-dur`**, Fallback `HERO_CRT_MODE_FLASH_MS` in [`assets/js/hero-crt.js`](assets/js/hero-crt.js). Tube-Boot lauscht nur noch auf **`animationend`** (ohne `webkitAnimationEnd`-Duplikat).
- **Regression (manuell):** Startseite **Lesemodus ↔ Retro** (Power); während **laufendem Erstbesuch-Boot** kein Toggle; **CRT** auch bei aktivierter **reduzierter Bewegung** im System; schmales Viewport; Druckvorschau (CRT-Schichten, Power-Wrap und Preboot-`::after` sind im Print-Stylesheet ausgeblendet). Ohne Hero-Preload (`data-enable-image-caching="false"` am `<html>`) bleibt der CRT-Pfad aus — dann ist der Power-Button nur sinnvoll, wenn das Bild anderweitig geladen wird.
- **Referenz / Parameter:** [Grainy Gradients](https://grainy-gradients.vercel.app/) zum Experimentieren mit `feTurbulence`; kostenlose PNG-Kacheln z. B. [Transparent Textures](https://www.transparenttextures.com/) — Lizenz je Muster beachten.
- **Barrierefreiheit:** `prefers-reduced-motion: reduce` drosselt weiterhin Animationen/Transitions auf der **Seite allgemein** (Ausnahmen u. a. Neon-Orbit-Trigger, CRT-Hero-Knoten). **Lesemodus** (`page__hero--crt-read`) schaltet CRT-Effekte **nur** über den **Power-Button** aus (Retro ↔ Lesemodus inkl. Flash).
- **CRT auf der Startseite (produktiv, nur `/` + `header.overlay_image`):** Im Markup liegt **`page__hero--crt-over-text`** an — Retro: CRT-Effekte **über** Titel/Untertitel. **Lesemodus:** `page__hero--crt-read` — `crt-over-text` aus, Text vorne; Grain, Roll, Noise und laufende Layer-Animationen **hart** aus. Umschalten mit **phosphorgrünem Aufflackern** (`page__hero--crt-flash`, Dauer **`--hero-crt-mode-flash-dur`** in SCSS, JS liest dieselbe Variable). Steuerung in [`assets/js/hero-crt.js`](assets/js/hero-crt.js) (`bindHomeHeroCrtPowerToggle`, `syncHeroCrtPowerButton`, `stopHeroCanvasNoise` im Lesemodus). **Rollbalken:** Dauer `--crt-roll-dur` und Laufrichtung `--crt-roll-sign` (`1` / `-1`, zufällig pro Seitenaufruf).

## Style Guide

Alle Regeln zu Gestaltung, Code, Sprache, Sicherheit und Arbeitsweise stehen in [`STYLEGUIDE.md`](STYLEGUIDE.md) – die einzige normative Quelle. Die frühere Kurzreferenz an dieser Stelle ist dort aufgegangen (Farbrollen, Überschriften, Karten, Buttons, Tokens, Hero, Ton). Befunde und Ist-Zustand: [`docs/audits/`](docs/audits/). Automatisch geprüft wird, was in Abschnitt 16 „Durchsetzung“ steht.

## TV-Umschalt-Effekt sichtbar machen (Troubleshooting)

Der Seitenwechsel-Effekt (View Transitions, grüner Phosphor-Blink) erscheint nur, wenn ALLE Bedingungen erfüllt sind:
- Fensterbreite unter 768px (Vollbild-Hero: Header reicht bis an den unteren Rand — auch im schmal gezogenen Desktop-Fenster)
- Start auf der Startseite über „Über mich“ oder „Fraktale erkunden“, ungescrollt
- Browser: Chrome/Edge 126+ oder Safari 18.2+ (Firefox kann Cross-Document-Transitions noch nicht → normaler Wechsel)
- **Systemeinstellung „Bewegung reduzieren“/„Animationen entfernen“ ist AUS** (Android: Bedienungshilfen bzw. Entwickleroptionen → Animationsmaßstab; iOS: Bedienungshilfen → Bewegung) — der Effekt respektiert `prefers-reduced-motion`

## Interaktive Komponenten

Das Projekt enthält mehrere interaktive Komponenten zur Visualisierung von Fraktalen:

### Julia-Menge Interaktiv

- Anpassen der Parameter (Realteil und Imaginärteil von c)
- Einstellen der maximalen Iterationszahl
- Auswahl verschiedener Farbschemata
- Zoom-Funktionen (Mausrad, Klick, Doppelklick, Zoom-Box)
- Speichern der generierten Bilder
- Ausführliche Erklärungen zu allen Parametern

### Mandelbrot-Julia-Explorer

- Erkundung des Zusammenhangs zwischen Mandelbrot- und Julia-Mengen
- Auswahl von Punkten in der Mandelbrot-Menge zur Anzeige der entsprechenden Julia-Menge
- Anpassung von Iterationen und Farbschemata
- Speichern der generierten Bilder

Beide Komponenten rendern über Web Worker (`mandelbrot-worker.js`, `julia-worker.js`) und `fractal-renderer.js`/`fractal-panel.js` — es gibt keine serverseitige Bild-Generierung.
