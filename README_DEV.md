# Entwicklungsumgebung für Fraktale Welten

Diese Entwicklungsumgebung kombiniert Python 3.11 und Jekyll, um sowohl die Website-Entwicklung als auch die Generierung von Fraktal-Visualisierungen zu unterstützen.

## Einrichtung

Die Entwicklungsumgebung ist mit Visual Studio Code und Dev Containers konfiguriert:

1. Installieren Sie [Visual Studio Code](https://code.visualstudio.com/)
2. Installieren Sie die [Dev Containers Extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)
3. Installieren Sie [Docker Desktop](https://www.docker.com/products/docker-desktop)
4. Öffnen Sie dieses Projekt in VS Code und klicken Sie auf "Reopen in Container", wenn Sie dazu aufgefordert werden

## Enthaltene Komponenten

Die Entwicklungsumgebung enthält:

### Python-Umgebung

- Python 3.11 mit wissenschaftlichen Bibliotheken (NumPy, Matplotlib, SciPy)
- Jupyter Notebooks für interaktive Entwicklung
- Bildverarbeitungsbibliotheken (Pillow)
- Entwicklungswerkzeuge (pytest, black, flake8, pylint)

## Jekyll / Hero

- **CRT-Overlay** (Scanlines, Retro-Look) bei Seiten mit `header.overlay_image`: global in `_config.yml` mit `hero_crt_intensity: "stark"` (Standard) oder `"dezent"`. Pro Seite: `header.crt_intensity: dezent`.
- **Schichten / Roll:** Abdunkelung Preboot/Boot-Ausblend nur noch als **`::after`** auf `.page__hero--overlay[data-background-image]` (`z-index: 15`) → **`.page__hero-crt-media`** (`z-index: 2`) umschließt CRT-Malerei (`svg-defs`, `crt-layer`, `grain`, `roll`, `noise`). **`--crt-roll-travel: calc(100cqh + 32vh)`** (`container-type: size` auf `.page__hero-crt-media`) — nicht `100%` im gleichen `calc` für `translateY` am schmalen `::before`, sonst würde die Prozentangabe gegen die **Balkenhöhe** statt gegen die **Media-Höhe** aufgelöst und der Roll nur in einem mittleren Streifen sichtbar. **Power-Steuerung** (nur Startseite mit Overlay-Bild) und **`.wrapper`** liegen außerhalb der Media-Box. Overlay nutzt wieder **`isolation: isolate`**.
- **Eingangsanimation „Tube Boot“:** einmal pro Session (`sessionStorage` `auflinieHeroCrtBoot`). Sequenz nach `loaded` und **`load`/`complete`**: `page__hero--crt-preboot` (Overlay-`::after` über Bild + CRT + Text, `z-index: 15`; Power-Button bleibt darüber) + CRT-Filter wie Tube-Start → Pause (**0,9 s**, `HERO_CRT_PREBOOT_DELAY_MS`) → `page__hero--crt-boot` (**ca. 3,5 s** Tube + gleich langes Ausblenden des `::after`). Tube-Ende per **`animationend`** oder Timeout-Fallback (`HERO_TUBE_BOOT_DURATION_MS` + Puffer). **Nur** dieser initiale Boot — **nicht** beim Umschalten Lesemodus/Retro. **CRT-Hero** (Boot, Roll, Canvas, Flash) hängt **nicht** an `prefers-reduced-motion`; die Systemeinstellung „Reduzierte Bewegung“ betrifft die übrige Seite (s. [`_custom.scss`](assets/_sass/_custom.scss)).
- **Performance (Hero-CRT):** Canvas-Rauschen nutzt einen **wiederverwendeten `ImageData`-Puffer**, **Zeitdrossel** (`HERO_CRT_NOISE_TARGET_FPS`, Standard 10 FPS) statt festem „jedes 3. RAF-Frame“-Raster, und pausiert bei **`document.visibilityState === 'hidden'`** (kein RAF im Hintergrundtab). Flash-Timeout: **ID auf dem Overlay**, `clearTimeout` vor erneutem Toggle, **`pagehide`** räumt auf; Dauer aus **`getComputedStyle` → `--hero-crt-mode-flash-dur`**, Fallback `HERO_CRT_MODE_FLASH_MS` in [`assets/js/hero-crt.js`](assets/js/hero-crt.js). Tube-Boot lauscht nur noch auf **`animationend`** (ohne `webkitAnimationEnd`-Duplikat).
- **Regression (manuell):** Startseite **Lesemodus ↔ Retro** (Power); während **laufendem Erstbesuch-Boot** kein Toggle; **CRT** auch bei aktivierter **reduzierter Bewegung** im System; schmales Viewport; Druckvorschau (CRT-Schichten, Power-Wrap und Preboot-`::after` sind im Print-Stylesheet ausgeblendet). Ohne Hero-Preload (`data-enable-image-caching="false"` am `<html>`) bleibt der CRT-Pfad aus — dann ist der Power-Button nur sinnvoll, wenn das Bild anderweitig geladen wird.
- **Referenz / Parameter:** [Grainy Gradients](https://grainy-gradients.vercel.app/) zum Experimentieren mit `feTurbulence`; kostenlose PNG-Kacheln z. B. [Transparent Textures](https://www.transparenttextures.com/) — Lizenz je Muster beachten.
- **Barrierefreiheit:** `prefers-reduced-motion: reduce` drosselt weiterhin Animationen/Transitions auf der **Seite allgemein** (Ausnahmen u. a. Neon-Orbit-Trigger, CRT-Hero-Knoten). **Lesemodus** (`page__hero--crt-read`) schaltet CRT-Effekte **nur** über den **Power-Button** aus (Retro ↔ Lesemodus inkl. Flash).
- **CRT auf der Startseite (produktiv, nur `/` + `header.overlay_image`):** Im Markup liegt **`page__hero--crt-over-text`** an — Retro: CRT-Effekte **über** Titel/Untertitel. **Lesemodus:** `page__hero--crt-read` — `crt-over-text` aus, Text vorne; Grain, Roll, Noise und laufende Layer-Animationen **hart** aus. Umschalten mit **phosphorgrünem Aufflackern** (`page__hero--crt-flash`, Dauer **`--hero-crt-mode-flash-dur`** in SCSS, JS liest dieselbe Variable). Steuerung in [`assets/js/hero-crt.js`](assets/js/hero-crt.js) (`bindHomeHeroCrtPowerToggle`, `syncHeroCrtPowerButton`, `stopHeroCanvasNoise` im Lesemodus). **Rollbalken:** Dauer `--crt-roll-dur` und Laufrichtung `--crt-roll-sign` (`1` / `-1`, zufällig pro Seitenaufruf).

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

## Fraktal-Generatoren

Das Projekt enthält mehrere Skripte zur Generierung von Fraktalen:

### Hauptskript

Das Hauptskript zur Generierung von Fraktalen ist in Python geschrieben und nutzt die oben genannten Bibliotheken, um komplexe Fraktalbilder zu erstellen und zu visualisieren.
