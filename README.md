# Meine Jekyll Website mit Minimal Mistakes

Dies ist eine persönliche Website, die mit Jekyll und dem Minimal Mistakes Theme erstellt wurde.

## Projektübersicht

Diese Website kombiniert Jekyll mit dem Minimal Mistakes Theme, um eine ansprechende und funktionale Plattform zu bieten.

## TODO

- [ ] Bilder und Grafiken optimieren
- [ ] Weitere Blog Einträge hinzufügen

## Installation und Einrichtung

1. Stellen Sie sicher, dass Ruby (Version 2.5.0 oder höher) installiert ist:

   ```bash
   ruby --version
   ```

2. Installieren Sie die Bundler gem:

   ```bash
   gem install bundler
   ```

3. Klonen Sie dieses Repository:

   ```bash
   git clone [REPOSITORY-URL]
   cd [REPOSITORY-NAME]
   ```

4. Installieren Sie die erforderlichen Gems:

   ```bash
   bundle install
   ```

## Lokale Entwicklung

Um die Website lokal zu entwickeln:

1. Starten Sie den Jekyll-Server:

   ```bash
   bundle exec jekyll serve
   ```

2. Öffnen Sie <http://localhost:4000> in Ihrem Browser

### Service Worker und CSS-Änderungen

Wenn Styles oder Skripte nach Änderungen nicht wirken: **Hard-Reload** (Cache leeren) oder in den DevTools unter **Application → Service Workers** den Worker **Unregister** und die Seite neu laden. Der Service Worker kann ältere `main.css`-Versionen ausliefern.

## Markdown und Kramdown

Kramdown ist der Standard-Markdown-Prozessor für Jekyll und spielt eine wichtige Rolle bei der Verarbeitung mathematischer Formeln:

### Was ist Kramdown?

- Ein leistungsfähiger Markdown-Parser für Ruby
- Standardmäßig in Jekyll integriert
- Unterstützt erweiterte Funktionen wie Fußnoten, Definitionen und mathematische Formeln
- Bietet bessere Unterstützung für HTML-Ausgabe als andere Markdown-Parser

### Kramdown und MathJax

Die Kramdown-Konfiguration ist entscheidend für die korrekte Darstellung mathematischer Formeln:

```yaml
markdown: kramdown
kramdown:
  math_engine: mathjax    # Verwendet MathJax zur Formeldarstellung
  input: GFM             # GitHub Flavored Markdown
  syntax_highlighter: rouge
```

### Häufige Kramdown-bezogene Probleme

1. **Falsche Formeldarstellung**
   - Überprüfen Sie, ob `math_engine: mathjax` in `_config.yml` gesetzt ist
   - Stellen Sie sicher, dass keine Leerzeilen in Formeln sind
   - Escapen Sie Unterstriche in Formeln: `a\_b` statt `a_b`

2. **Parsing-Fehler**
   - Verwenden Sie `{: .class}` für Kramdown-spezifische Attribute
   - Achten Sie auf korrekte Einrückung in Listen
   - Vermeiden Sie Mischung von Tabs und Leerzeichen

3. **GFM-Kompatibilität**
   - `input: GFM` ermöglicht GitHub-Flavored Markdown
   - Unterstützt Tabellen und durchgestrichenen Text
   - Beachten Sie die unterschiedliche Behandlung von Unterstrichen

### Kramdown-Tipps

1. **Mathematische Formeln**

   ```markdown
   $$ 
   \begin{align*}
   y &= mx + b \\
   y &= 2x + 1
   \end{align*}
   $$
   ```

2. **Attribute**

   ```markdown
   {: .notice--info}
   Dieser Text erhält eine spezielle Formatierung
   ```

3. **Fußnoten**

   ```markdown
   Ein Text mit einer Fußnote[^1]
   [^1]: Dies ist die Fußnote
   ```

## Mathematische Formeln mit MathJax

Diese Website unterstützt mathematische Formeln durch MathJax. Die Konfiguration erfolgt in zwei Dateien:

### 1. _config.yml

```yaml
# Math Settings
markdown: kramdown
mathjax: true
kramdown:
  math_engine: mathjax
  syntax_highlighter: rouge
  input: GFM

# MathJax specific settings (MathJax 4)
head_scripts:
  - https://cdn.jsdelivr.net/npm/mathjax@4.1.0/tex-chtml.js
```

### 2. _includes/head/custom.html

```html
{% if page.mathjax %}
<script>
  MathJax = {
    tex: {
      inlineMath: [['$', '$'], ['\\(', '\\)']],
      displayMath: [['$$', '$$'], ['\\[', '\\]']],
      processEscapes: true,
      packages: { '[+]': ['noerrors'] }
    },
    options: {
      skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code'],
      ignoreHtmlClass: 'tex2jax_ignore',
      processHtmlClass: 'tex2jax_process',
      renderActions: { assistiveMml: [] },
      menuOptions: { settings: { assistiveMml: false } }
    },
    loader: { load: ['[tex]/noerrors'] }
  };
</script>
<script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@4.1.0/tex-chtml.js"></script>
{% endif %}
```

### Verwendung in Markdown-Dateien

1. Aktivieren Sie MathJax im Frontmatter der Seite:

   ```yaml
   ---
   title: "Meine Seite"
   mathjax: true
   ---
   ```

2. Verwenden Sie LaTeX-Syntax:
   - Inline-Formeln: `$E = mc^2$`
   - Display-Formeln: `$$\sum_{i=1}^n i = \frac{n(n+1)}{2}$$`

## Troubleshooting

### MathJax-Probleme

Wenn mathematische Formeln nicht korrekt angezeigt werden:

1. Cache leeren:

   ```bash
   rm -rf .jekyll-cache
   bundle exec jekyll clean
   ```

2. Überprüfen Sie die folgenden Punkte:
   - `mathjax: true` ist im Frontmatter der Seite gesetzt
   - Die MathJax-Version in `_includes/head/custom.html` ist korrekt (4.1.0 empfohlen)
   - Die LaTeX-Syntax verwendet `$$` für Display-Math und `$` für Inline-Math
   - Der Browser-Cache wurde geleert

3. Server neu starten:

   ```bash
   bundle exec jekyll serve
   ```

### Allgemeine Probleme

1. Bei Gem-Konflikten:

   ```bash
   bundle clean --force
   bundle install
   ```

2. Bei Jekyll-Build-Fehlern:

   ```bash
   bundle update
   bundle exec jekyll build --trace
   ```

## Neue Inhalte erstellen

### Blogbeiträge

Neue Blogbeiträge werden im `_posts` Verzeichnis erstellt. Die Dateinamen müssen dem Format `JAHR-MONAT-TAG-titel.md` folgen.

### Seiten

Statische Seiten werden im `_pages` Verzeichnis erstellt.

## Anpassungen

- Die Hauptkonfiguration befindet sich in `_config.yml`
- Layouts können in `_layouts` angepasst werden
- Assets (Bilder, CSS, JS) gehören in den `assets` Ordner

## Deployment

Die Website kann auf verschiedenen Plattformen gehostet werden:

1. GitHub Pages (kostenlos)
2. Netlify
3. Eigener Webserver

Für GitHub Pages:

1. Erstellen Sie ein Repository auf GitHub
2. Pushen Sie Ihren Code
3. Aktivieren Sie GitHub Pages in den Repository-Einstellungen

## Weitere Ressourcen

- [Minimal Mistakes Dokumentation](https://mmistakes.github.io/minimal-mistakes/docs/quick-start-guide/)
- [Jekyll Dokumentation](https://jekyllrb.com/docs/)
- [MathJax Dokumentation](https://docs.mathjax.org/)

## Best Practices

1. **Trennung von Inhalt und Präsentation**:
   - Speichere strukturierte Daten in YAML-Dateien im `_data/` Verzeichnis
   - Verwende Includes für die Darstellung
   - Halte Markdown-Dateien sauber und fokussiert auf den Inhalt

2. **Wiederverwendbarkeit**:
   - Erstelle generische Includes, die in verschiedenen Kontexten verwendet werden können
   - Parametrisiere Includes, um sie flexibel zu halten

3. **Konsistenz**:
   - Verwende einheitliche Benennungskonventionen
   - Halte die Struktur der Datendateien konsistent

4. **Erweiterbarkeit**:
   - Dokumentiere neue Includes und deren Parameter
   - Halte die Struktur modular, um einfache Erweiterungen zu ermöglichen

## Beispiel: Neue Seite mit benutzerdefinierten Daten

### 1. Datendatei erstellen (`_data/projekte.yml`)

```yaml
- section: "Aktuelle Projekte"
  icon: "rocket"
  content: "Hier sind meine aktuellen Projekte."
  projekte:
    - titel: "Projekt A"
      beschreibung: "Beschreibung des Projekts A"
      technologien: ["HTML", "CSS", "JavaScript"]
      link: "https://example.com/projektA"
    - titel: "Projekt B"
      beschreibung: "Beschreibung des Projekts B"
      technologien: ["Python", "Django", "PostgreSQL"]
      link: "https://example.com/projektB"
```

### 2. Include erstellen (`_includes/projekte.html`)

```html
{% for projekt in include.projekte %}
<div class="cv-entry">
  <div class="cv-entry-header">
    <h3>{{ projekt.titel }}</h3>
  </div>
  <div class="cv-entry-content">
    <p>{{ projekt.beschreibung }}</p>
    <p><strong>Technologien:</strong> {{ projekt.technologien | join: ", " }}</p>
    <p><a href="{{ projekt.link }}" target="_blank">Projekt ansehen</a></p>
  </div>
</div>
{% endfor %}
```

### 3. Markdown-Datei erstellen (`_pages/projekte.md`)

```yaml
---
title: "Meine Projekte"
permalink: /projekte/
layout: single
author_profile: true
toc: true
toc_label: "Inhalt"
toc_sticky: true
---

{% for section in site.data.projekte %}
<section id="{{ section.section | slugify }}" class="projekte-section">
  <h2>{{ section.section }}</h2>

  {% capture inner_content %}
    {% if section.projekte %}
      {% include projekte.html projekte=section.projekte %}
    {% endif %}
  {% endcapture %}

  {% include cv-section.html 
    icon=section.icon 
    title=section.section 
    content=section.content 
    inner_content=inner_content %}
</section>
{% endfor %}
```

## Inhaltsverzeichnis (TOC)

Das Inhaltsverzeichnis (Table of Contents, TOC) wird automatisch aus den Überschriften der Seite generiert. Es gibt zwei Möglichkeiten, ein TOC zu verwenden:

### Natives TOC mit Minimal Mistakes

Das native TOC von Minimal Mistakes kann über die Front Matter aktiviert werden:

```yaml
---
title: "Seitentitel"
toc: true
toc_label: "Inhalt"  # Optional: Passt die Beschriftung an
toc_icon: "list"     # Optional: Fügt ein Icon hinzu
toc_sticky: true     # Optional: Macht das TOC scrollbar
---
```

### Ausklappbares TOC

Das ausklappbare TOC erweitert das native TOC von Minimal Mistakes um eine Ausklapp-Funktionalität. Es kann über die Front Matter aktiviert werden:

```yaml
---
title: "Seitentitel"
toc: true
toc_label: "Inhalt"  # Wird vom ausklappbaren TOC verwendet
toc_icon: "list"     # Wird vom ausklappbaren TOC verwendet
toc_collapse: true   # Macht das TOC ausklappbar
---
```

### Parameter des ausklappbaren TOC

Das ausklappbare TOC unterstützt alle Parameter des nativen TOC von Minimal Mistakes:

- `toc`: Aktiviert das TOC (muss `true` sein)
- `toc_label`: Die Beschriftung des TOC (Standard: "Inhalt")
- `toc_icon`: Das Icon für das TOC (Standard: "file-alt")
- `toc_sticky`: Wenn `true`, bleibt das TOC beim Scrollen sichtbar
- `toc_collapse`: Wenn `true`, wird das TOC ausklappbar gemacht

### Beispiele

#### Standard-TOC

```yaml
---
title: "Seitentitel"
toc: true
---
```

#### Ausklappbares TOC (YAML-Beispiel)

```yaml
---
title: "Seitentitel"
toc: true
toc_label: "Inhalt"
toc_icon: "list"
toc_collapse: true
---
```

#### Ausklappbares TOC mit Sticky-Funktion

```yaml
---
title: "Seitentitel"
toc: true
toc_label: "Inhalt"
toc_icon: "list"
toc_collapse: true
toc_sticky: true
---
```

### Automatische Erkennung des Farbschemas

Das ausklappbare TOC erkennt automatisch, ob die Seite ein dunkles oder helles Farbschema verwendet, und passt sein Erscheinungsbild entsprechend an. Es verwendet dafür mehrere Methoden:

1. Prüfung der Hintergrundfarbe des `<body>`-Elements
2. Prüfung der Hintergrundfarbe des `.page__content`-Elements
3. Prüfung, ob bestimmte Elemente vorhanden sind, die auf ein dunkles Design hinweisen
4. Prüfung, ob das Minimal Mistakes Skin "dark" ist

### Speicherung des Zustands

Der Zustand des ausklappbaren TOC (ausgeklappt oder eingeklappt) wird im `localStorage` des Browsers gespeichert, sodass er beim nächsten Besuch der Seite wiederhergestellt wird.
