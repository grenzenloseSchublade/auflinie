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
- **Schichten / Roll:** Abdunkelung Preboot/Boot-Ausblend nur noch als **`::after`** auf `.page__hero--overlay[data-background-image]` (`z-index: 1`, kein extra DOM) → **`.page__hero-crt-media`** (`z-index: 2`) umschließt CRT-Malerei (`svg-defs`, `crt-layer`, `grain`, `roll`, `noise`). **`--crt-roll-travel: calc(100cqh + 32vh)`** (`container-type: size` auf `.page__hero-crt-media`) — nicht `100%` im gleichen `calc` für `translateY` am schmalen `::before`, sonst würde die Prozentangabe gegen die **Balkenhöhe** statt gegen die **Media-Höhe** aufgelöst und der Roll nur in einem mittleren Streifen sichtbar. **Dev-Buttons** und **`.wrapper`** liegen außerhalb der Media-Box. Overlay nutzt wieder **`isolation: isolate`**.
- **Eingangsanimation „Tube Boot“:** einmal pro Session (`sessionStorage` `auflinieHeroCrtBoot`). Sequenz nach `loaded` und **`load`/`complete`**: `page__hero--crt-preboot` (Overlay-`::after` über Bild + CRT + Text, `z-index: 15`; Dev-Buttons bleiben darüber) + CRT-Filter wie Tube-Start → Pause (**0,9 s**, `HERO_CRT_PREBOOT_DELAY_MS`) → `page__hero--crt-boot` (**ca. 3,5 s** Tube + gleich langes Ausblenden des `::after`). Tube-Ende per **`animationend`** oder Timeout-Fallback (`HERO_TUBE_BOOT_DURATION_MS` + Puffer). **„Boot“**-Button spielt dieselbe Sequenz. Bei `prefers-reduced-motion: reduce` entfallen Preboot, Boot und Canvas-Rauschen.
- **Regression (manuell):** Startseite mit/ohne **Layers**; Systemeinstellung reduzierte Bewegung; schmales Viewport; Druckvorschau (CRT-Schichten und Preboot-`::after` sind im Print-Stylesheet ausgeblendet). Ohne Hero-Preload (`data-enable-image-caching="false"` am `<html>`) bleibt der CRT-Pfad aus — dann Dev-Buttons prüfen nur sinnvoll, wenn das Bild anderweitig geladen wird.
- **Referenz / Parameter:** [Grainy Gradients](https://grainy-gradients.vercel.app/) zum Experimentieren mit `feTurbulence`; kostenlose PNG-Kacheln z. B. [Transparent Textures](https://www.transparenttextures.com/) — Lizenz je Muster beachten.
- **Barrierefreiheit:** Unter `prefers-reduced-motion: reduce` werden Rollbalken, Korn, Canvas und CRT-Layer-Animationen in [`assets/_sass/_custom.scss`](/workspaces/auflinie/assets/_sass/_custom.scss) abgeschaltet; die **CRT-Dev-Buttons** (Startseite) werden ebenfalls ausgeblendet.
- **CRT Dev-Controls (nur Startseite, `page.url == "/"` + Overlay-Bild):** Unten links im Hero erscheinen zwei Test-Buttons (nur sinnvoll, wenn das Hero-Bild geladen ist, also `loaded` — dazu muss `image-cache.js` laufen, z. B. `data-enable-image-caching` nicht `false`): **„Boot“** spielt **Preboot (`::after` + Filterpause) + Verzögerung + Tube-Boot** erneut (ohne `sessionStorage` zurücksetzen zu müssen). **„Layers“** schaltet die Klasse `page__hero--crt-over-text` und legt CRT-Effekte per `z-index` **über** den Hero-Text, um Lesbarkeit vs. Look zu prüfen (nicht als Live-Default gedacht). **Rollbalken:** Dauer `--crt-roll-dur` und Laufrichtung `--crt-roll-sign` (`1` / `-1`, zufällig pro Seitenaufruf) setzt [`assets/js/image-cache.js`](/workspaces/auflinie/assets/js/image-cache.js).

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
