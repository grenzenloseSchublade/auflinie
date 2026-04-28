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
- **Eingangsanimation „Tube Boot“:** einmal pro Session (`sessionStorage` `auflinieHeroCrtBoot`). Sequenz nach `loaded` und **`load`/`complete`**: `page__hero--crt-preboot` (Overlay-`::after` über Bild + CRT + Text, `z-index: 15`; Power-Button bleibt darüber) + CRT-Filter wie Tube-Start → Pause (**0,9 s**, `HERO_CRT_PREBOOT_DELAY_MS`) → `page__hero--crt-boot` (**ca. 3,5 s** Tube + gleich langes Ausblenden des `::after`). Tube-Ende per **`animationend`** oder Timeout-Fallback (`HERO_TUBE_BOOT_DURATION_MS` + Puffer). **Nur** dieser initiale Boot — **nicht** beim Umschalten Lesemodus/Retro. Bei `prefers-reduced-motion: reduce` entfallen Preboot, Boot und Canvas-Rauschen.
- **Regression (manuell):** Startseite **Lesemodus ↔ Retro** (Power); während **laufendem Erstbesuch-Boot** kein Toggle; Systemeinstellung reduzierte Bewegung; schmales Viewport; Druckvorschau (CRT-Schichten, Power-Wrap und Preboot-`::after` sind im Print-Stylesheet ausgeblendet). Ohne Hero-Preload (`data-enable-image-caching="false"` am `<html>`) bleibt der CRT-Pfad aus — dann ist der Power-Button nur sinnvoll, wenn das Bild anderweitig geladen wird.
- **Referenz / Parameter:** [Grainy Gradients](https://grainy-gradients.vercel.app/) zum Experimentieren mit `feTurbulence`; kostenlose PNG-Kacheln z. B. [Transparent Textures](https://www.transparenttextures.com/) — Lizenz je Muster beachten.
- **Barrierefreiheit:** Unter `prefers-reduced-motion: reduce` werden Rollbalken, Korn, Canvas und CRT-Layer-Animationen in [`assets/_sass/_custom.scss`](/workspaces/auflinie/assets/_sass/_custom.scss) abgeschaltet; der **Power-Button** bleibt sichtbar und schaltet **Lesemodus** (`page__hero--crt-read`) / **Retro** (`page__hero--crt-over-text`) **ohne** Flash um.
- **CRT auf der Startseite (produktiv, nur `/` + `header.overlay_image`):** Im Markup liegt **`page__hero--crt-over-text`** an — Retro: CRT-Effekte **über** Titel/Untertitel. **Lesemodus:** `page__hero--crt-read` — `crt-over-text` aus, Text vorne; Grain, Roll, Noise und laufende Layer-Animationen **hart** aus. Umschalten mit **phosphorgrünem Aufflackern** (`page__hero--crt-flash`, ~**100 ms**, `heroCrtModeFlash` / `HERO_CRT_MODE_FLASH_MS`). Steuerung in [`assets/js/image-cache.js`](/workspaces/auflinie/assets/js/image-cache.js) (`bindHomeHeroCrtPowerToggle`, `syncHeroCrtPowerButton`, `stopHeroCanvasNoise` im Lesemodus). **Rollbalken:** Dauer `--crt-roll-dur` und Laufrichtung `--crt-roll-sign` (`1` / `-1`, zufällig pro Seitenaufruf).

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
