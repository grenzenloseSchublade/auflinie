---
title: "Zentralisierung des Designs: Eine Analyse der CSS/SASS-Struktur in Jekyll mit Minimal Mistakes"
date: 2025-03-05
categories:
  - Webentwicklung
tags:
  - Jekyll
  - Minimal Mistakes
  - CSS
  - SASS
  - Design
toc: true
toc_label: "Inhalt"
toc_icon: "list"
toc_sticky: true
header:
  overlay_image: /assets/images/background.jpg
  overlay_filter: 0.5
  caption: "CSS/SASS-Struktur und Design-Zentralisierung"
  teaser: /assets/images/background.jpg
excerpt: "Eine detaillierte Analyse der CSS/SASS-Struktur in unserem Jekyll-Projekt und wie wir das Design zentral verwalten können"
---

TODO: Erstellung dieser Seite zusammenfassen und beschreiben wie ich die Struktur analysiert habe und wie ich die Struktur verbessert habe.

{% raw %}
## Die Herausforderung der Design-Zentralisierung

Bei der Entwicklung einer Website mit Jekyll und dem Minimal Mistakes Theme stehe ich vor einer klassischen Herausforderung: Wie kann ich alle designrelevanten Änderungen an einem zentralen Ort verwalten, anstatt sie über verschiedene Dateien zu verstreuen? Diese Frage ist besonders relevant, da ich langfristig ein konsistentes Design gewährleisten und Änderungen effizient durchführen möchte.

In diesem Beitrag analysiere ich die aktuelle CSS/SASS-Struktur unseres Projekts und entwickle eine Strategie für eine bessere Zentralisierung des Designs.

## Analyse der aktuellen Struktur

### Die Hauptdatei: main.scss

Der Einstiegspunkt für alle Styles in unserem Projekt ist die Datei `assets/css/main.scss`. Diese Datei enthält:

1. YAML-Frontmatter (die Trennstriche `---` am Anfang)
2. Eigene Variablen-Definitionen (Farben, etc.)
3. Import des Theme-Skins und der Hauptstilkomponenten
4. Eigene CSS-Überschreibungen und Erweiterungen

```scss
--- 
# Only the main Sass file needs front matter (the dashes are enough) 
--- 

@charset "utf-8";

$link-color: #05d9e8; // Linkfarbe
$hover-color: #ff00ff; // Hover-Effekt Farbe
$background-dark: #1a1a1a; // Dunkler Hintergrund
$code-background: #2d2d2d; // Code-Block Hintergrund
$h1-color: #ff00ff; // H1 Überschriften
$h2-color: #05d9e8; // H2 Überschriften
$h3-color: #00ffc8; // H3 Überschriften
// ... weitere Variablen ...

// Theme importieren - nach den Variablen, aber vor eigenen Styles
@import "minimal-mistakes/skins/{{ site.minimal_mistakes_skin | default: 'default' }}";
@import "minimal-mistakes";

// Eigene Styles folgen hier...
```

### Die Theme-Struktur

Das Minimal Mistakes Theme verwendet eine gut organisierte SASS-Struktur:

1. Eine Hauptdatei `minimal-mistakes.scss`, die alle Komponenten importiert
2. Einzelne SASS-Dateien für verschiedene Komponenten (Navigation, Footer, etc.)
3. Ein Skin-System für verschiedene Farbschemata
4. Vendor-Dateien für externe Bibliotheken

Die Hauptdatei `minimal-mistakes.scss` importiert alle Komponenten in einer logischen Reihenfolge:

```scss
/* Variables */
@import "minimal-mistakes/variables";

/* Mixins and functions */
@import "minimal-mistakes/vendor/breakpoint/breakpoint";
// ... weitere Imports ...

/* Core CSS */
@import "minimal-mistakes/reset";
@import "minimal-mistakes/base";
// ... weitere Imports ...

/* Components */
@import "minimal-mistakes/buttons";
@import "minimal-mistakes/notices";
// ... weitere Imports ...

/* Utility classes */
@import "minimal-mistakes/utilities";

/* Layout specific */
@import "minimal-mistakes/page";
@import "minimal-mistakes/archive";
// ... weitere Imports ...
```

### Probleme in der aktuellen Struktur

Bei der Analyse unserer aktuellen Implementierung habe ich folgende Probleme identifiziert:

1. **Vermischung von Variablen und Styles**: In unserer `main.scss` definieren wir Variablen und schreiben gleichzeitig CSS-Überschreibungen, was die Datei unübersichtlich macht.

2. **Fehlende Modularisierung**: Unsere eigenen Styles sind nicht in thematische Module aufgeteilt, sondern alle in einer Datei.

3. **Inkonsistente Namenskonventionen**: Bei eigenen Klassen und Variablen fehlt eine einheitliche Namenskonvention.

4. **Redundante Styles**: An einigen Stellen werden ähnliche Styles mehrfach definiert, anstatt Mixins oder Variablen zu verwenden.

5. **Fehlende Dokumentation**: Die Bedeutung und Verwendung von Variablen und Klassen ist nicht ausreichend dokumentiert.

## Die ideale Struktur für zentralisiertes Design

Basierend auf meiner Analyse schlage ich folgende Struktur für eine bessere Zentralisierung des Designs vor:

### 1. Eigenes SASS-Verzeichnis

Wir sollten ein eigenes SASS-Verzeichnis erstellen, das unsere spezifischen Styles enthält:

```plaintext
assets/
└── _sass/
    ├── variables/
    │   ├── _colors.scss
    │   ├── _typography.scss
    │   └── _layout.scss
    ├── components/
    │   ├── _toc.scss
    │   ├── _buttons.scss
    │   └── _cards.scss
    ├── layouts/
    │   ├── _home.scss
    │   ├── _posts.scss
    │   └── _pages.scss
    ├── _variables.scss (importiert alle Dateien aus variables/)
    └── _custom.scss (importiert alle Komponenten und Layouts)
```

### 2. Überarbeitete main.scss

Die `main.scss` sollte vereinfacht werden und nur noch Imports enthalten:

```scss
---
# Only the main Sass file needs front matter (the dashes are enough)
---

@charset "utf-8";

// Eigene Variablen importieren (vor dem Theme)
@import "variables";

// Theme importieren
@import "minimal-mistakes/skins/{{ site.minimal_mistakes_skin | default: 'default' }}";
@import "minimal-mistakes";

// Eigene Styles importieren (nach dem Theme)
@import "custom";
```

### 3. Zentrale Variablendatei

Die Datei `_variables.scss` sollte alle designrelevanten Variablen zentral definieren:

```scss
// Farbschema
$primary-color: #05d9e8;
$secondary-color: #ff00ff;
$tertiary-color: #00ffc8;
$background-color: #1a1a1a;
$text-color: #ffffff;

// Typografie
$heading-font-family: $sans-serif;
$body-font-family: $serif;
$code-font-family: $monospace;

$h1-font-size: 2.5em;
$h2-font-size: 2em;
$h3-font-size: 1.75em;

// Layout
$content-width: 1200px;
$sidebar-width: 300px;
$gutter: 2em;

// Import Untermodule
@import "variables/colors";
@import "variables/typography";
@import "variables/layout";
```

## Implementierungsplan

Um unser Design zu zentralisieren, schlage ich folgenden Implementierungsplan vor:

### Schritt 1: Verzeichnisstruktur erstellen

```bash
mkdir -p assets/_sass/{variables,components,layouts}
touch assets/_sass/variables/{_colors.scss,_typography.scss,_layout.scss}
touch assets/_sass/components/{_toc.scss,_buttons.scss,_cards.scss}
touch assets/_sass/layouts/{_home.scss,_posts.scss,_pages.scss}
touch assets/_sass/{_variables.scss,_custom.scss}
```

### Schritt 2: Variablen extrahieren

Alle in `main.scss` definierten Variablen sollten in die entsprechenden Dateien im `variables`-Verzeichnis verschoben werden.

### Schritt 3: Styles modularisieren

Die bestehenden CSS-Überschreibungen in `main.scss` sollten in die entsprechenden Komponentendateien verschoben werden.

### Schritt 4: main.scss überarbeiten

Die `main.scss` sollte gemäß dem oben beschriebenen Muster vereinfacht werden.

### Schritt 5: SASS-Konfiguration anpassen

Die SASS-Konfiguration in `_config.yml` sollte angepasst werden, um das neue Verzeichnis zu berücksichtigen:

```yaml
sass:
  sass_dir: assets/_sass
  style: compressed
  sourcemap: never
```

## Vorteile der neuen Struktur

Die vorgeschlagene Struktur bietet mehrere Vorteile:

1. **Zentralisierung**: Alle designrelevanten Entscheidungen sind an einem Ort (in den Variablendateien) definiert.

2. **Modularität**: Styles sind thematisch gruppiert, was die Wartung erleichtert.

3. **Skalierbarkeit**: Die Struktur kann leicht um neue Komponenten erweitert werden.

4. **Konsistenz**: Durch die Verwendung von Variablen wird ein konsistentes Design gewährleistet.

5. **Dokumentation**: Jede Datei kann mit Kommentaren versehen werden, die ihre Funktion erklären.

## Beispiel: Farbschema-Änderung

Mit der neuen Struktur wäre eine Änderung des Farbschemas so einfach wie:

```scss
// In assets/_sass/variables/_colors.scss
$primary-color: #new-color;
$secondary-color: #another-new-color;
```

Alle Komponenten, die diese Variablen verwenden, würden automatisch aktualisiert.

## Fazit

Die Zentralisierung des Designs in einem Jekyll-Projekt mit Minimal Mistakes erfordert eine durchdachte SASS-Struktur. Durch die Trennung von Variablen und Styles, die Modularisierung von Komponenten und die Verwendung einer klaren Verzeichnisstruktur können wir ein wartbares, konsistentes Design erreichen.

Der Aufwand für diese Umstrukturierung mag zunächst hoch erscheinen, aber die langfristigen Vorteile in Bezug auf Wartbarkeit und Effizienz überwiegen bei weitem. In zukünftigen Projekten werde ich von Anfang an eine solche Struktur implementieren, um Zeit zu sparen und ein konsistenteres Ergebnis zu erzielen.
{% endraw %} 