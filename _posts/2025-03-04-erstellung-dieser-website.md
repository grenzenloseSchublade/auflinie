---
title: "Erstellung dieser Website: Von der Konzeption zur Implementierung"
date: 2025-03-04
last_modified_at: 2026-10-06
author_profile: true
categories:
  - Webentwicklung
  - Technische Dokumentation
tags:
  - Jekyll
  - Minimal Mistakes
  - GitHub Pages
  - Static Site Generator
  - Webentwicklung
header:
  overlay_image: /assets/images/background.jpg
  overlay_filter: 0.5
  caption: "Technische Architektur und Implementierungsdetails"
  teaser: /assets/images/background.jpg
toc: true
toc_label: "Inhalt"
toc_icon: "list"
toc_sticky: true
toc_collapse: true
excerpt: "Wie diese Website mit Jekyll und dem Theme Minimal Mistakes entstanden ist – von der Technologiewahl über Build und Deployment bis zu den Erfahrungen daraus."
---

Diese Website ist als persönliche Plattform für technische Inhalte, ausführliche Blogbeiträge und interaktive Fraktal-Visualisierungen entstanden. Mehr als eine Visitenkarte sollte sie sein – ein Ort, an dem technische Dokumentation und Ausprobieren zusammenkommen. Dieser Beitrag zeichnet nach, wie sie gebaut ist und warum.

## I. Ausgangslage und Anforderungen

### 1.1 Ziele

Hinter der Entwicklung standen technische und inhaltliche Ziele. Im Zentrum stand Geschwindigkeit: Statisch erzeugte Seiten brauchen keine serverseitige Verarbeitung und laden entsprechend schnell. Gleichzeitig sollte die Seite wartbar bleiben und mitwachsen können. Dafür sorgen Markdown-Dateien, die sich auch ohne tiefes technisches Wissen pflegen lassen.

Für kurze Ladezeiten weltweit sollte die Auslieferung über ein Content Delivery Network (CDN) sorgen. Die größte Herausforderung waren die Fraktal-Generatoren in JavaScript. Gedacht sind sie dafür, Mathematik sichtbar zu machen und zum Ausprobieren einzuladen.

Technisch brachte das mehrere Herausforderungen mit sich, die eine sorgfältige Auswahl der Werkzeuge verlangten. Damit die Oberfläche bei rechenintensiven Fraktalen nicht einfriert, laufen die Berechnungen in Web Workern. Außerdem sollten Blogbeiträge LaTeX-Formeln und mathematische Notation darstellen können.

Dazu kamen Bilder, Skripte und Stylesheets, die verwaltet und klein gehalten werden wollten. Die Versionierung mit Git sollte jede Änderung nachvollziehbar und bei Problemen leicht rückgängig machen. Und die Seite sollte in allen gängigen Browsern und auf allen Geräten funktionieren.

Auch inhaltlich gab es Anforderungen. Technische Konzepte und Tutorials sollten sich strukturiert darstellen lassen, interaktive Inhalte wie der Mandelbrot-Julia-Explorer sollten Mathematik anschaulich machen. Lebenslauf, Projekte und persönliche Interessen gehören ebenfalls auf die Seite. Und neue Beiträge sollten sich ohne technische Vorkenntnisse schreiben und bearbeiten lassen.

## II. Technologieevaluation und Entscheidungsfindung

### 2.1 Static Site Generators im Vergleich

Am Anfang stand der Vergleich verschiedener Static Site Generators. Die Entscheidung fiel auf Jekyll, nach den Anforderungen des Projekts und mit Blick auf die lange Sicht.

In die engere Wahl kamen vier Kandidaten. Hugo, in Go geschrieben, überzeugt mit sehr schnellen Builds (oft unter einer Sekunde) und einer einzigen ausführbaren Datei ohne weitere Abhängigkeiten. Die Template-Syntax von Go ist aber gewöhnungsbedürftig. Wer nicht in Go entwickelt, braucht länger für den Einstieg. Hugos größte Stärke, die Geschwindigkeit, zählt vor allem bei großen Websites mit Tausenden Seiten. Für ein Projekt dieser Größe war sie kein Argument. Hugo hat eine große und wachsende Community.

Gatsby baut auf React und GraphQL auf und hat ein großes Plugin-Ökosystem. Für statische Inhalte bringt es aber viel Overhead mit: eine aufwendigere Build-Pipeline und größere JavaScript-Bundles. Für interaktive Web-Apps ist das sinnvoll, für einen statischen Blog unnötig komplex. Die Community ist sehr aktiv, aber stark auf React ausgerichtet.

Eleventy (11ty) unterstützt die meisten Template-Sprachen, ist in JavaScript geschrieben und modern aufgebaut. Das Ökosystem ist aber kleiner, es gibt weniger fertige Themes, und das Projekt ist jünger. Eleventy ist vielversprechend, wirkte zum Zeitpunkt der Entscheidung aber weniger ausgereift als Jekyll. Die Community ist kleiner, aber sehr engagiert.

Jekyll, in Ruby geschrieben, bot den besten Kompromiss aus Funktionsumfang, Stabilität und Einfachheit. Die ausgereifte Technik, die große Community, die Nähe zu GitHub Pages und die große Auswahl an Themes wogen schwerer als die Nachteile: langsamere Builds, Ruby als Abhängigkeit und eine weniger moderne Architektur. Jekyll gehört zu den ältesten und am weitesten verbreiteten Static Site Generators.

Bewertet wurde nach mehreren Kriterien. Bei der Geschwindigkeit reicht Jekyll für ein Projekt dieser Größe locker: Ein vollständiger Build dieser Website dauert lokal rund eine Sekunde. Beim Besuch der Seite zählt ohnehin die Ladezeit, und die ist bei statischen Seiten kurz. Stylesheets komprimiert Jekyll beim Kompilieren von Sass gleich mit, Bilder werden von Hand optimiert (siehe Kapitel IV).

Mindestens so wichtig war, wie angenehm sich damit arbeiten lässt. Die Template-Sprache Liquid ist gut dokumentiert und schnell gelernt, Dokumentation und Tutorials erleichtern den Einstieg. Fehlermeldungen beim Build sind meist verständlich, Optionen wie `--trace` und `--verbose` helfen bei der Fehlersuche.

Dazu kamen Ökosystem und Community: eine große, aktive Gemeinschaft, viele Plugins und Hunderte kostenlose Themes. GitHub Pages kann Jekyll-Seiten ohne eigenes Build-Setup bauen, allerdings nur mit einer älteren Jekyll-Version und einer festen Liste erlaubter Plugins. Diese Website nutzt deshalb einen eigenen Build über GitHub Actions (Kapitel IV). Jekyll lässt sich außerdem leicht automatisieren und wird von vielen Hosting-Anbietern unterstützt.

### 2.2 Jekyll: Begründung der Technologiewahl

Den Ausschlag für Jekyll gaben technische und praktische Gründe.

Zuerst die Nähe zu GitHub Pages: Das Hosting ist kostenlos, auch für das CDN fallen keine Kosten an. Jeder Push auf den Hauptzweig löst automatisch ein Deployment aus. SSL-Zertifikate stellt GitHub bereit und erneuert sie selbst, eine eigene Domain lässt sich ohne Zusatzkosten einbinden. Gebaut wird die Seite allerdings nicht vom eingebauten Pages-Builder, sondern von einem eigenen GitHub-Actions-Workflow. Nur so sind Jekyll 4 und Plugins außerhalb der Pages-Liste möglich.

Bei den Themes hat Jekyll eine große Auswahl, viele davon kostenlos und gut gemacht. Minimal Mistakes lässt sich weitgehend anpassen und ist, wie die meisten aktuellen Themes, responsiv und mobile-first gebaut. Meta-Tags, Open Graph und Twitter Cards bringt es fertig mit. Bei der Barrierefreiheit legt das Theme eine gute Grundlage, für das Ziel WCAG 2.2 AA braucht es trotzdem eigene Arbeit.

Ruby ist seit Jahrzehnten etabliert, mit einer riesigen Auswahl an Bibliotheken (Gems) und einer großen Community. Die Template-Sprache Liquid stammt ursprünglich von Shopify und ist einfach zu lernen. Zusammen ergibt das eine solide technische Basis.

Liquid ist einfach, aber mächtig genug, ohne dass es echte Programmierung braucht. Wiederverwendbare Includes halten den Code geordnet, und strukturierte Daten in YAML (etwa für Lebenslauf und Mandelbrot-Seite) erlauben mehr als klassische Blogbeiträge. So bleibt die Architektur modular.

Die Nachteile von Jekyll fallen bei diesem Projekt kaum ins Gewicht. Jekyll ist langsamer als Hugo, und bei sehr großen Websites mit Tausenden Seiten können Builds lästig lange dauern. Diese Website hat aber nur rund ein Dutzend Seiten, der Build ist in rund einer Sekunde fertig.

Ruby als Abhängigkeit macht die Installation etwas aufwendiger: Ruby und Bundler müssen installiert und eingerichtet sein, und unterschiedliche Ruby-Versionen vertragen sich nicht immer. Dev Container und Docker nehmen diesen Aufwand ab. Lokal läuft der Build sogar ganz ohne installiertes Ruby, in einem Docker-Container mit fester Ruby-Version.

Auch persönliche Gründe spielten mit. Dank guter Dokumentation und vieler Tutorials ging der Einstieg schnell. Die meisten Probleme hatte schon jemand anderes gelöst und dokumentiert, Beispiele und Best Practices aus der Community gibt es reichlich.

Wichtig war auch die Langzeitstabilität. Jekyll wird seit 2008 entwickelt, gilt als sehr stabil und bekommt weiterhin Updates und Bugfixes. Jekyll ist allerdings kein GitHub-Produkt, sondern ein Open-Source-Projekt der Community. Eine Garantie für langfristige Unterstützung gibt es also nicht, die lange Geschichte und die weite Verbreitung sprechen aber dafür.

Wartbar und erweiterbar bleibt das Ganze durch die modulare Architektur: Plugins und eigener Code lassen sich leicht ergänzen. Alle Inhalte und Einstellungen sind mit Git versioniert, und in Markdown lässt sich gut gemeinsam arbeiten.

### 2.3 Minimal-Mistakes-Theme: Feature-Analyse und Auswahl

Ebenso wichtig wie Jekyll war die Wahl des Themes. Nach dem Vergleich mehrerer Jekyll-Themes passte Minimal Mistakes am besten zu den Anforderungen.

Minimal Mistakes bringt vieles mit, was eine Website braucht. Der Mobile-First-Ansatz sorgt für eine gute Darstellung vom Smartphone bis zum großen Monitor, Buttons und Abstände sind auf Touch-Bedienung ausgelegt. Das Theme achtet auf Barrierefreiheit und läuft in allen modernen Browsern. Dank Progressive Enhancement bleiben die Inhalte auch ohne JavaScript lesbar, mit JavaScript kommen weitere Funktionen dazu.

Stark ist das Theme bei Metadaten und Suchmaschinen. Meta-Tags entstehen automatisch aus dem Front Matter, Open Graph sorgt für eine ordentliche Vorschau beim Teilen, etwa auf LinkedIn, Twitter Cards erledigen dasselbe für Twitter. Strukturierte Daten nach Schema.org (JSON-LD) helfen Suchmaschinen beim Einordnen. Sitemap und Feed kommen über die Plugins jekyll-sitemap und jekyll-feed dazu, Letzteres erzeugt einen Atom-Feed für Abonnements.

Anpassen lässt sich das Theme an vielen Stellen. Es gibt mehrere fertige Farbschemata (Skins) wie Dark, Air und Aqua und verschiedene Layouts für unterschiedliche Inhalte. Die Navigation schiebt Einträge, die nicht mehr in die Leiste passen, automatisch in ein Menü, Breadcrumbs lassen sich zuschalten. Seitenleiste und Footer sind konfigurierbar.

Bei der Performance liefert das Theme eine schlanke Grundlage, den Rest erledigt eigener Code. Das kritische CSS steht inline im eigenen Basis-Layout und sorgt für einen schnellen ersten Bildaufbau. Bilder unterhalb des sichtbaren Bereichs laden verzögert (`loading="lazy"`), Bildgrößen und Formate werden von Hand gewählt und nicht automatisch erzeugt. Einen Service Worker bringt das Theme nicht mit – die Offline-Funktion dieser Website ist ein Eigenbau (mehr dazu in Kapitel III).

Auch die Dokumentation spricht für Minimal Mistakes. Ausführlich, wie sie ist, deckt sie praktisch jede Funktion ab, mit Codebeispielen zu den meisten Einstellungen. Eine Beispielseite zeigt die Layouts in Aktion, und eine Anleitung zum Aktualisieren hilft beim Umstieg auf neue Versionen.

Das Theme wird weiter gepflegt, wenn auch ohne festen Rhythmus. Neue Versionen achten auf Abwärtskompatibilität, ein Changelog listet alle Änderungen. Diese Website bindet das Theme über `remote_theme` an einen festen Commit (Version 4.28.1). Ein Update ist damit immer eine bewusste Entscheidung.

Die Community ist groß. Minimal Mistakes gehört zu den meistgenutzten Jekyll-Themes, das Repository hat Tausende Stars und Forks. Fragen und Fehlerberichte laufen über GitHub, zu vielen Problemen gibt es außerdem Antworten auf Stack Overflow.

Zum Vergleich standen weitere Jekyll-Themes. Jekyll Now ist sehr einfach einzurichten, bietet aber kaum Anpassungsmöglichkeiten und wirkt optisch veraltet. Für den allerersten Einstieg ideal, für die Anforderungen dieses Projekts zu wenig.

Beautiful Jekyll hat ein schönes, modernes Design und eine gute Dokumentation, aber weniger Layouts und weniger SEO-Funktionen. Für einen einfachen Blog eine gute Wahl, für die gewünschten Anpassungen nicht flexibel genug.

Minimal Mistakes überzeugte mit vielen Funktionen, sauberer Umsetzung und guter Dokumentation. Die Einarbeitung dauert länger und die Konfiguration ist umfangreicher, dafür war es der beste Kompromiss aus Funktionsumfang und Einfachheit.

Weitere Themes schieden aus anderen Gründen aus: Hyde hat ein klassisches Design, ist technisch aber in die Jahre gekommen. Cayman ist für mehr als eine einfache Projektseite zu schlicht, Architect lässt sich wenig anpassen, und Leap Day sieht modern aus, bietet aber wenig Funktionen.

Am Ende sprach für Minimal Mistakes die Mischung aus Funktionsumfang, Qualität und Community. Es bietet alles Nötige für eine moderne Website und ist flexibel genug für das, was später noch dazukommt.

## III. Technische Umsetzung

### 3.1 Setup und Entwicklungsumgebung

Eine gute Entwicklungsumgebung spart später viel Zeit. Die gewählte Lösung verbindet Container mit bewährten Werkzeugen.

Grundlage sind feste Versionen. Die Datei `.ruby-version` legt Ruby 3.4.11 fest, damit lokale Umgebung, Dev Container und CI identisch bauen. Mehrere Ruby-Versionen ließen sich lokal mit rbenv parallel verwalten – im Alltag übernehmen das aber der Dev Container oder ein Docker-Container mit genau dieser Ruby-Version.

Die Ruby-Abhängigkeiten verwaltet Bundler. Die `Gemfile.lock` hält die genauen Versionen fest und macht Builds reproduzierbar. Die Testwerkzeuge, etwa html-proofer, stehen in einer eigenen Gruppe im `Gemfile`.

Das Einrichten ist kurz: Repository klonen, ins Verzeichnis wechseln, `bundle install` ausführen. Danach sind alle Gems da, `bundle exec jekyll --version` bestätigt die Installation. So sieht die Umgebung auf jedem Rechner gleich aus.

**Erweiterte Entwicklungsumgebung:**

**Dev Container mit Visual Studio Code:**
```json
// .devcontainer/devcontainer.json (gekürzt)
{
  "name": "Jekyll & Node",
  "image": "mcr.microsoft.com/devcontainers/python:3.11",
  "features": {
    "ghcr.io/devcontainers/features/ruby:1": { "version": "3.4.11" },
    "ghcr.io/devcontainers/features/node:1": {
      "version": "22",
      "installYarnUsingApt": false
    },
    "ghcr.io/devcontainers/features/github-cli:1": {},
    "ghcr.io/anthropics/devcontainer-features/claude-code:1": {}
  },
  "postCreateCommand": "bash -i .devcontainer/post-create.sh",
  "forwardPorts": [4000],
  "customizations": {
    "vscode": {
      "extensions": [
        "sissel.shopify-liquid",
        "davidanson.vscode-markdownlint",
        "yzhang.markdown-all-in-one",
        "streetsidesoftware.code-spell-checker",
        "streetsidesoftware.code-spell-checker-german",
        "redhat.vscode-yaml",
        "github.vscode-pull-request-github"
      ]
    }
  },
  "remoteUser": "vscode"
}
```

Technisch steht die Umgebung auf Ruby 3.4.11, Bundler und der `Gemfile.lock`. Jekyll 4.4 bringt über jekyll-sass-converter 3 das aktuelle Dart Sass mit, Liquid setzt Layouts und Inhalte zusammen. Der Parser kramdown übersetzt Markdown und reicht Formeln an MathJax weiter, was gerade bei technischen Inhalten hilft.

Im Alltag helfen ein paar eingebaute Werkzeuge. LiveReload lädt den Browser bei jeder Änderung neu, Jekyll kompiliert SCSS beim Bauen zu komprimiertem CSS. Eine eigene Asset-Pipeline gibt es nicht: JavaScript wird weder gebündelt noch minimiert, Bilder werden von Hand optimiert.

**Lokale Entwicklung:**

**Development Server mit erweiterten Optionen:**
```bash
# Standard Development Server
bundle exec jekyll serve --livereload --port 4000 --host 0.0.0.0

# Mit erweiterten Debugging-Optionen
bundle exec jekyll serve \
  --livereload \
  --port 4000 \
  --host 0.0.0.0 \
  --verbose \
  --trace \
  --incremental \
  --drafts \
  --unpublished

# Website verfügbar unter: http://localhost:4000/auflinie/
```

**Build-Optimierungen und Performance-Tuning:**
```bash
# Produktions-Build mit Optimierungen
JEKYLL_ENV=production bundle exec jekyll build

# Build mit detailliertem Logging
bundle exec jekyll build --verbose --trace

# Incremental Build für schnellere Entwicklung
bundle exec jekyll serve --incremental
```

**Debugging und Troubleshooting:**
```bash
# Jekyll-Dokumentation anzeigen
bundle exec jekyll help

# Konfiguration validieren
bundle exec jekyll doctor

# Dependencies prüfen
bundle exec jekyll clean
bundle exec jekyll build --verbose
```

Für den Arbeitsablauf gibt es ein paar feste Regeln. Neue Funktionen entstehen auf eigenen Branches, Commit-Nachrichten folgen dem Format Conventional Commits mit deutschem Betreff. Die Qualitätsprüfungen laufen nicht als Pre-commit-Hook, sondern vor jedem Push von Hand und danach automatisch in der CI.

Linting hält den Code wartbar. Stylelint prüft die SCSS-Dateien, ESLint das JavaScript. Kleine Prüfskripte wachen zusätzlich darüber, dass Schriftgrößen, Farben, Abstände und Breakpoints aus den Tokens kommen und behobene Sicherheitsprobleme nicht zurückkehren. Markdown prüft im Editor die Erweiterung markdownlint. Die Regeln für Gestaltung, Code und Sprache stehen gesammelt im Style Guide (`STYLEGUIDE.md`).

Die Performance lässt sich mit einfachen Mitteln im Blick behalten. `time` misst die Build-Zeit, `du` zeigt, wie groß CSS, JavaScript und Bilder sind. Das reicht, um Ausreißer früh zu bemerken.

### 3.2 Projektstruktur und Konfiguration

Die Projektstruktur folgt den Jekyll-Konventionen. Jedes Verzeichnis hat eine klare Aufgabe.

**Jekyll-Architektur:**

```plaintext
auflinie/
├── _config.yml                    # Hauptkonfiguration mit allen Einstellungen
├── _data/                         # Strukturierte Daten in YAML-Format
│   ├── navigation.yml             # Hauptnavigation und Menüstruktur
│   ├── cv_content.yml             # Lebenslauf-Daten und Berufserfahrung
│   └── mandelbrot.yml             # Fraktal-Seiteninhalte und Sektionen
├── _includes/                     # Wiederverwendbare HTML-Komponenten
│   ├── head/custom.html           # Custom CSS/JS für spezielle Seiten
│   ├── fractal/                   # Fraktal-Panel (canvas, panel, deps, Erklärtexte)
│   ├── cv/                        # Lebenslauf-Komponenten (entry, skills, languages)
│   ├── julia-interactive.html     # Wrapper um das Julia-Panel
│   ├── mandelbrot-julia-explorer.html # Wrapper um den Explorer
│   ├── section-epigraph.html      # Zitat-Epigraph für Abschnitte
│   └── *.html                     # Masthead, Hero, Footer, TOC u. a.
├── _layouts/                      # HTML-Layout-Templates
│   ├── default.html               # Basis-Layout für alle Seiten
│   └── single.html                # Layout für Seiten und Blogbeiträge
├── _pages/                        # Statische Seiten (nicht Blog-Posts)
│   ├── about.md                   # Über mich
│   ├── cv.md                      # Lebenslauf
│   ├── mandelbrot.md              # Fraktal-Visualisierung
│   ├── posts.md                   # Blog-Übersicht
│   └── archiv.md                  # Jahres-Archiv
├── _posts/                        # Blogbeiträge (Jekyll-Konvention)
├── assets/
│   ├── _sass/                     # SCSS: _custom.scss + base/components/layouts/variables
│   ├── css/main.scss              # Haupt-SCSS-Einstieg
│   ├── js/                        # Eigene Skripte: fractal-renderer, fractal-panel,
│   │                              #   julia-/mandelbrot-worker, hero-crt, tv-switch,
│   │                              #   sw-register, blog-search u. a.
│   ├── vendor/                    # Selbst gehostete Bibliotheken (MathJax,
│   │                              #   tom-select, nouislider, gumshoe) – vormals CDN
│   ├── webfonts/                  # Ubuntu und Font-Awesome-Subset (pyftsubset, woff2)
│   ├── images/                    # background.jpg, mandelbrot-preview.jpg, Logo.svg
│   └── downloads/post-template.md # Blog-Template zum Download
├── .devcontainer/                 # Dev-Container (python:3.11 + Ruby 3.4.11 Feature)
├── .github/workflows/             # CI: Lint, Build, Style-Guide-Review, Deploy
├── scripts/                       # Prüfskripte (Guardrails, CSP-Prüfung)
├── tests/                         # Playwright-Tests und Style-Guide-Review
├── Gemfile / Gemfile.lock         # Ruby Dependencies (Jekyll ~> 4.4)
├── offline.html / 404.html        # Offline-Fallback und Fehlerseite
└── service-worker.js              # App-Shell-Precache (Liquid-generierte URL-Liste)
```

Das Herzstück der Konfiguration ist die Einbindung von Minimal Mistakes. Die `_config.yml` legt das Theme als `remote_theme` fest, gepinnt auf einen Commit, und wählt die Skin. Die Wahl fiel auf „dark“, weil sie die Augen schont. Zur Auswahl stehen außerdem „default“, „air“, „aqua“, „contrast“, „dirt“, „neon“, „mint“, „plum“ und „sunrise“.

Die Navigation hat vier Einträge: Mandelbrot, Blog, Über mich und Lebenslauf. Für Suchmaschinen beschreibt die Konfiguration die Website als Seite einer Person, mit Namen und Profil-Links. So wird sie einheitlich dargestellt und richtig eingeordnet.

**Konfigurationsparameter:**

**GitHub-Pages-Integration:**
```yaml
# Repository und URL-Konfiguration
repository: "grenzenloseSchublade/auflinie"
url: "https://grenzenloseSchublade.github.io"
baseurl: "/auflinie"  # Wichtig für GitHub Pages Subdirectory

# Author-Informationen
author:
  name: "Hans Müller"
  avatar: "/assets/images/Logo.svg"
  bio: "Ingenieur & Entwickler"
  location: "Bochum, Deutschland"
  links:
    - label: "GitHub"
      icon: "fab fa-fw fa-github"
      url: "https://github.com/grenzenloseSchublade"
    - label: "LinkedIn"
      icon: "fab fa-fw fa-linkedin"
      url: "https://www.linkedin.com/in/hans-m%C3%BCller-39a133359/"
```

**Markdown-Engine und Syntax-Highlighting:**
```yaml
# Markdown-Verarbeitung
markdown: kramdown
kramdown:
  math_engine: mathjax          # LaTeX-Formeln mit MathJax
  syntax_highlighter: rouge     # Code-Syntax-Highlighting
  input: GFM                    # GitHub Flavored Markdown
  smart_quotes: ["sbquo", "lsquo", "bdquo", "ldquo"]  # „deutsche“ Anführungszeichen
  syntax_highlighter_opts:
    css_class: "highlight"
    span:
      line_numbers: false
    block:
      line_numbers: true
      start_line: 1
      background_color: "#2d2d2d"

# MathJax nur auf Seiten, die Formeln enthalten:
# mathjax: true im Front Matter der jeweiligen Seite
```

Auch für die Performance gibt es ein paar Einstellungen. Rouge übernimmt das Syntax-Highlighting, LSI (verwandte Beiträge per Textanalyse) ist abgeschaltet, und ein Excerpt-Separator legt fest, wo die Zusammenfassung endet. Sass kompiliert zu komprimiertem CSS ohne Source Maps. Das HTML wird nicht zusätzlich komprimiert.

Sechs Plugins erweitern Jekyll: jekyll-paginate-v2 teilt die Blog-Übersicht in Seiten, jekyll-sitemap erzeugt die XML-Sitemap und jekyll-feed einen Atom-Feed. Das Plugin jekyll-include-cache beschleunigt den Build, indem es wiederkehrende Includes zwischenspeichert, jekyll-last-modified-at liefert Änderungsdaten, und jekyll-remote-theme lädt das Theme. Weil der Build in GitHub Actions läuft, gilt die Plugin-Liste von GitHub Pages hier nicht.

**Layout-Defaults und Standardwerte:**
```yaml
# Standard-Layouts für verschiedene Content-Typen
defaults:
  # Blog-Posts
  - scope:
      path: ""
      type: posts
    values:
      layout: single
      author_profile: true
      read_time: true
      share: false
      related: true
      show_date: true
      show_categories: false
      show_tags: false
  
  # Statische Seiten
  - scope:
      path: "_pages"
      type: pages
    values:
      layout: single
      author_profile: true
```

**Exclude-Konfiguration:**
```yaml
# Dateien und Verzeichnisse von der Verarbeitung ausschließen (Auszug)
exclude:
  - tests/          # Playwright-Tests, nicht deployen
  - scripts/        # Lint- und Analyse-Werkzeuge
  - STYLEGUIDE.md   # Regelwerk, nie deployen
  - .sass-cache/
  - .jekyll-cache/
  - Gemfile
  - Gemfile.lock
  - node_modules/
  - vendor/bundle/
  - package.json
  - package-lock.json
  - tmp
  - /docs
```

### 3.3 Customization und Content-Management

Angepasst wurde die Website optisch und funktional. Inhalte entstehen weiterhin als einfache Dateien im Repository, ein CMS gibt es nicht.

Die eigenen Styles liegen in `assets/_sass/`, alle Werte zentral in `assets/_sass/variables/`. Die Farben bauen auf der Skin „dark“ auf: Cyan (`#05d9e8`) für Links, Magenta (`#ff00ff`) für Hover und Auswahl, dazu ein dunkler Seitengrund (`#252a34`). Als Textschrift dient Ubuntu, selbst gehostet und auf die genutzten Zeichen reduziert, Code steht in einer Monospace-Schrift. Die Grundgröße folgt der Einstellung im Browser, alle Schriftgrößen kommen aus einer festen Token-Skala.

Die Textspalte ist höchstens `46rem` breit, damit die Zeilen gut lesbar bleiben. Die Breakpoints übernimmt die Website vom Theme: Small (`600px`), Medium (`768px`), Large (`1024px`) und X-Large (`1280px`).

Eigene Komponenten gibt es unter anderem für das Fraktal-Panel, den Hero mit CRT-Effekt, den Lebenslauf und das Inhaltsverzeichnis, dazu Code-Blöcke mit dunklem Hintergrund und heller Schrift. Gestalterisch gilt: ruhig vor bunt. Struktur entsteht aus Größe, Abstand und feinen Linien, nicht aus Farbe.

**Layout-Modifikationen und Includes:**

Die Fraktal-Visualisierungen sind als geteilte Panel-Komponente organisiert: Markup in `_includes/fractal/panel.html`, Rendering-Logik in `assets/js/fractal-renderer.js` und `fractal-panel.js`, Berechnung in Web Workern (`julia-worker.js`, `mandelbrot-worker.js`). Die Seiten binden davon nur dünne Wrapper ein:

```liquid
{% raw %}{% comment %} _includes/julia-interactive.html – dünner Wrapper um das geteilte Panel {% endcomment %}
{% include fractal/panel.html variant="julia" id="julia-container"
   title="Interaktive Julia-Menge" crt="dezent" %}{% endraw %}
```

Die gesamte Panel-Kette (inklusive der selbst gehosteten Bibliotheken nouislider und tom-select) lädt nur auf Seiten, die im Front Matter `fractal_panels: true` setzen – alle anderen Seiten bleiben JavaScript-leicht.

**Navigation und Menüstruktur:**
```yaml
# _data/navigation.yml
main:
  - title: "Mandelbrot"
    url: "/mandelbrot/"
  - title: "Blog"
    url: "/posts/"
  - title: "Über mich"
    url: "/about/"
  - title: "Lebenslauf"
    url: "/cv/"

# GitHub und LinkedIn stehen nicht hier, sondern als
# author.links in der _config.yml (Autorenprofil)
```

Für Beiträge gibt es einen festen Ablauf. Das Front Matter hält die Metadaten fest: Titel, Datum, letzte Änderung, Autorenprofil, Kategorien und Tags (die beiden Letzteren sind auf der Seite ausgeblendet). Über `header` kommen Titelbild, Abdunklung und Bildunterschrift dazu, die TOC-Einstellungen steuern Titel, Icon und Verhalten des Inhaltsverzeichnisses. Der Excerpt liefert die Kurzfassung für Übersicht und Suchmaschinen. Unter jedem Beitrag stehen verwandte Beiträge. Teilen-Buttons und Kommentare sind abgeschaltet.

Strukturierte Daten liegen als YAML in `_data/`. Die `cv_content.yml` gliedert den Lebenslauf in Abschnitte: Profil, Berufserfahrung (mit Position, Unternehmen, Ort, Zeitraum, Beschreibung und Aufgaben), akademische Ausbildung, technische Fähigkeiten und Sprachen. Die Seite selbst ist nur ein Template, das diese Daten ausgibt. Neue Einträge brauchen deshalb keine Änderung am Layout.

**Asset-Management und Optimierung:**

Das Asset-Management folgt dem Prinzip „selbst hosten statt CDN“: Font Awesome liegt als per pyftsubset generiertes Subset (nur die tatsächlich genutzten Icons) in `assets/webfonts/`, die Bibliotheken der Fraktal-Panels (tom-select, nouislider, gumshoe) in `assets/vendor/`. Auch MathJax (Version 4.1.3) liegt inzwischen selbst gehostet in `assets/vendor/mathjax/` und lädt nur auf Seiten mit `mathjax: true`. Damit gibt es keine externen Abhängigkeiten mehr, und die Seite ist vollständig offline-fähig. Bilder werden nicht über eine generische Pipeline skaliert, sondern einzeln von Hand optimiert (etwa `background.jpg` und das per Skript gerenderte `mandelbrot-preview.jpg`, jeweils als komprimiertes JPEG unter 250 KB).

**Performance-Optimierungen und Caching:**

**Service Worker für Offline-Funktionalität (Eigenbau):**

Der Service Worker verfolgt eine App-Shell-Strategie: Beim Installieren wird die komplette Site vorab gecacht – die Seitenliste generiert Jekyll per Liquid direkt in die Datei, statische Assets stehen in einer gepflegten Liste. Seitenwechsel sind danach netzunabhängig.

```javascript
// service-worker.js (Auszug)
const CACHE_VERSION = '<build-zeitstempel via Liquid>';
const CACHE_NAME = `kraftstoff-cache-${CACHE_VERSION}`;
const CACHE_URLS = [
  // Alle Seiten + Posts (per Liquid aus site.html_pages generiert),
  // dazu CSS, eigene Skripte, Vendor-Bibliotheken, Fonts und Bilder
];
```

Die Registrierung übernimmt `assets/js/sw-register.js`. Das Skript ist per `data-enable-service-worker`-Attribut schaltbar und zeigt bei neuen Versionen einen Update-Toast statt eines blockierenden Dialogs – „Neu laden“ aktiviert den wartenden Worker (`SKIP_WAITING`) und lädt erst nach dem `controllerchange` neu, damit kein Mischzustand aus altem DOM und neuem Cache entsteht. Frische kommt über den Cache-Versionsstempel: Jeder Build erzeugt einen neuen Cache-Namen, alte Caches mit dem eigenen Präfix werden beim Aktivieren aufgeräumt. Dabei fasst der Service Worker nur die eigenen Caches an. Alle Projekte unter grenzenloseSchublade.github.io teilen sich einen Origin und damit denselben Cache-Speicher. Gelesen wird deshalb nur aus dem aktuellen eigenen Cache, gelöscht nur, was das eigene Präfix trägt, und beantwortet werden nur Anfragen innerhalb des eigenen Pfads.

**Build-Optimierungen:**
```yaml
# _config.yml – Sass-Ausgabe (HTML wird nicht komprimiert)
sass:
  sass_dir: assets/_sass
  style: compressed
  sourcemap: never
```

**Content-Management-Workflow:**

**Markdown-Templates und Vorlagen** (`assets/downloads/post-template.md`, gekürzt):
```markdown
{% raw %}---
title: "Titel des Beitrags"
excerpt: "Ein bis zwei Sätze, worum es geht. ..."
header:
  overlay_image: /assets/images/background.jpg
  overlay_filter: 0.5
  caption: "Zusatzinformation zum Bild ..."
  teaser: /assets/images/background.jpg
toc: true
toc_label: "Inhalt"
toc_sticky: true
categories:
  - Blog
tags:
  - jekyll
---

{% comment %}
Vorlage für einen Blogbeitrag. Speichern als _posts/JJJJ-MM-TT-titel-des-beitrags.md …
Dieser Kommentar erscheint nicht auf der Seite.
{% endcomment %}

Hier steht, worum es in diesem Beitrag geht …{% endraw %}
```

Ein eigenes Skript zum Anlegen neuer Beiträge gibt es nicht. Stattdessen wird die Vorlage heruntergeladen oder kopiert, als `_posts/JJJJ-MM-TT-titel.md` gespeichert und befüllt. Weil sie selbst schon ein gültiger Beitrag ist, bleibt die Struktur aller Beiträge einheitlich.


## IV. Deployment, Herausforderungen und Lessons Learned

Deployment und laufende Pflege brachten eigene Herausforderungen mit sich. Die meisten ließen sich mit klaren Abläufen lösen.

### 4.1 Deployment-Strategie

Gehostet wird auf GitHub Pages, aus technischen wie wirtschaftlichen Gründen. In der `_config.yml` stehen Repository, URL und die `baseurl` für das Hosting im Unterverzeichnis `/auflinie`. Weil die Seite in GitHub Actions gebaut wird, ist sie nicht auf die Plugins und die Jekyll-Version von GitHub Pages beschränkt.

Gebaut und veröffentlicht wird über einen GitHub-Actions-Workflow. Er startet bei jedem Push auf den Hauptzweig und lässt sich von Hand auslösen, Pull Requests lösen ihn nicht aus. Zwei Jobs laufen parallel. Der Lint-Job prüft mit Stylelint und ESLint und führt die Prüfskripte für Tokens und Sicherheit aus. Der Build-Job richtet Ruby ein (Version aus der `.ruby-version`, mit Bundler-Cache), baut die Seite mit `--strict_front_matter` und prüft, dass die interne Style-Guide-Ansicht nicht im Deploy landet. Danach folgen ein zweiter Build mit dieser Ansicht, das automatische Style-Guide-Review mit Playwright, die CSP-Prüfung und htmlproofer für die internen Links. Veröffentlicht wird nur, wenn beide Jobs grün sind.

Der Jekyll-Build selbst ist schnell: Bei dieser Größe ist er lokal in rund einer Sekunde fertig. Den größten Teil eines CI-Laufs brauchen Einrichtung und Prüfungen, vor allem das Review im Playwright-Container. Der Bundler-Cache spart dabei das erneute Installieren der Gems.

Für die Qualitätssicherung sorgen vor allem die Prüfungen im Workflow. Das Style-Guide-Review vergleicht Screenshots einer internen Komponenten-Ansicht mit Referenzbildern, misst Kontraste und prüft die echten Seiten mit axe-core auf WCAG 2.2 AA. Die CSP-Prüfung stellt sicher, dass keine Seite ausführbare Inline-Skripte oder Inline-Event-Handler enthält und die Content Security Policy für Skripte ohne `unsafe-inline` auskommt. Das Werkzeug htmlproofer findet kaputte interne Links. Schlägt etwas fehl, wird nicht veröffentlicht.

**Hosting-Optionen im Vergleich:**

Beim Hosting fiel die Wahl auf GitHub Pages. Es ist kostenlos, passt nahtlos zum Git-Workflow und bringt SSL-Zertifikate automatisch mit. Ausgeliefert wird über ein CDN, eine eigene Domain lässt sich einbinden. Dem stehen Grenzen gegenüber: keine serverseitige Verarbeitung, ein weiches Limit für den Datenverkehr und eine Zeitgrenze für Deployments. Die Plugin-Beschränkung des eingebauten Builders umgeht der eigene Build in GitHub Actions. Für statische Inhalte ohne laufende Kosten ist GitHub Pages die beste Wahl.

Netlify als erste Alternative bietet mehr CI/CD-Funktionen, Serverless Functions, A/B-Tests, Formularverarbeitung und Vorschauen pro Branch. Erweiterte Funktionen kosten aber Geld, und die Konfiguration ist aufwendiger. Die Performance ist sehr gut, das Mehr an Funktionen braucht eine statische Seite wie diese aber nicht.

Vercel als zweite Alternative ist auf React und Next.js zugeschnitten, mit Edge Functions, globalem CDN und automatischen Optimierungen. Für Jekyll passt es weniger gut und verlangt eine aufwendigere Build-Pipeline. Die Pro-Stufe kostet monatlich, die Performance ist hervorragend – für eine statische Seite ist das mehr als nötig.

AWS S3 mit CloudFront bietet als Enterprise-Option maximale Kontrolle, skalierbare Infrastruktur, ausführliche Auswertungen und ein frei konfigurierbares CDN. Dafür ist die Einrichtung aufwendig, und je nach Datenverkehr kommen Kosten und Wartung hinzu. Für die Anforderungen dieser Seite ist das zu komplex.

Ein eigener Server (VPS) bietet volle Kontrolle, eine frei wählbare Konfiguration und keine Abhängigkeit von einem Hosting-Anbieter. Dafür liegen Wartung, Sicherheit und Backups komplett in eigener Hand, und je nach Anbieter fallen monatliche Kosten an. Für dieses Projekt lohnt sich das nicht.

### 4.2 Praktische Herausforderungen und Lösungen

Bei Entwicklung und Pflege tauchten praktische Probleme auf. Die meisten ließen sich Schritt für Schritt lösen.

Die Abhängigkeiten stehen im `Gemfile`: Jekyll 4.4 direkt statt des Gems github-pages, dazu die sechs Plugins, Webrick für den lokalen Server und html-proofer in der Testgruppe für die Linkprüfung. Die Werkzeuge für Linting und Tests verwaltet npm über die `package.json`, die Site selbst braucht kein Node.

Aktualisiert wird gezielt mit `bundle update`, `bundle outdated` zeigt veraltete Gems. Die `Gemfile.lock` hält die Versionen samt Plattformen fest, damit Builds reproduzierbar bleiben. Vor bekannten Sicherheitslücken warnen die Dependabot-Alerts von GitHub, für die gepinnten GitHub Actions öffnet Dependabot einmal im Monat einen Update-PR.

Versionskonflikte lassen sich so meist vermeiden: Die Ruby-Version ist über `.ruby-version` festgelegt, Gem-Konflikte fallen beim Build auf, und das Theme ist auf einen Commit gepinnt. Die GitHub Actions stehen auf vollen Commit-SHAs statt auf verschiebbaren Tags.

Für schnelle Builds sorgen wenige Dinge: Verzeichnisse wie `node_modules`, `vendor`, `.sass-cache` und `.jekyll-cache` sind vom Build ausgeschlossen, Sass gibt komprimiertes CSS ohne Source Maps aus, und jekyll-include-cache spart wiederholtes Rendern von Includes. Beim Entwickeln hilft `jekyll serve --incremental`.

Wo der Build Zeit verliert, zeigt `jekyll build --profile`: Es listet die Renderzeit pro Datei. Dazu kommen `time` für die Gesamtdauer und ein Blick auf die Größe von CSS, JavaScript und Bildern.

**Asset-Handling und Optimierung:**

Statt einer generischen Bildoptimierungs-Pipeline setzt die Website auf wenige, gezielt optimierte Bilder: Das Hero-Hintergrundbild und das Mandelbrot-Vorschaubild der Startseite sind handkomprimierte JPEGs (Ziel: unter 250 KB), Logo und Favicons liegen als SVG bzw. PNG vor. Das Vorschaubild der Startseite gibt es in zwei Breiten, der Browser wählt die passende. Bei einer Handvoll Bilder schlägt Kuratieren jede Automatisierung – eine Pipeline, die WebP-Varianten und Größen für jedes Bild erzeugt, stünde in keinem Verhältnis zum Nutzen.

**JavaScript-Performance-Optimierung:**

**Web Workers für CPU-intensive Aufgaben:**
```javascript
// Prinzip der Berechnung, stark vereinfacht. Die echten Worker
// (julia-worker.js, mandelbrot-worker.js) teilen sich den Rechenkern
// fractal-worker-core.js und rechnen das Bild in Abschnitten.
// Web Worker für die Julia-Menge
self.onmessage = function(e) {
  const { width, height, realPart, imagPart, maxIterations } = e.data;
  
  const imageData = new ImageData(width, height);
  const data = imageData.data;
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const cReal = realPart;
      const cImag = imagPart;
      let zReal = (x - width / 2) / (width / 4);
      let zImag = (y - height / 2) / (height / 4);
      
      let iterations = 0;
      while (zReal * zReal + zImag * zImag < 4 && iterations < maxIterations) {
        const temp = zReal * zReal - zImag * zImag + cReal;
        zImag = 2 * zReal * zImag + cImag;
        zReal = temp;
        iterations++;
      }
      
      const index = (y * width + x) * 4;
      const color = getColor(iterations, maxIterations);
      data[index] = color.r;
      data[index + 1] = color.g;
      data[index + 2] = color.b;
      data[index + 3] = 255;
    }
  }
  
  self.postMessage(imageData);
};

function getColor(iterations, maxIterations) {
  if (iterations === maxIterations) {
    return { r: 0, g: 0, b: 0 };
  }
  
  const ratio = iterations / maxIterations;
  const hue = ratio * 360;
  return hslToRgb(hue, 1, 0.5);
}
```

**Content-Workflow-Herausforderungen und Lösungen:**

**Editor-Experience-Optimierung:**

**VS-Code-Konfiguration:**
```json
// .vscode/settings.json – Vorschlag, liegt nicht im Repository
{
  "markdown.preview.breaks": true,
  "markdown.preview.linkify": true,
  "markdown.extension.toc.levels": "1..6",
  "markdown.extension.toc.orderedList": false,
  "markdown.extension.toc.updateOnSave": true,
  "files.associations": {
    "*.md": "markdown"
  },
  "emmet.includeLanguages": {
    "markdown": "html"
  },
  "markdownlint.config": {
    "MD013": false,
    "MD033": false,
    "MD041": false
  }
}
```

**Live-Preview-Setup:**
```bash
# Jekyll mit LiveReload für sofortiges Preview
bundle exec jekyll serve --livereload --port 4000 --host 0.0.0.0

# Markdown-Preview in VS Code
# eingebaute Markdown-Vorschau von VS Code
# Shortcut: Ctrl+Shift+V
```

**Preview-Probleme und Debugging:**

**Lokale Entwicklungsumgebung:**
```bash
# Jekyll-Doktor für Konfigurationsprüfung
bundle exec jekyll doctor

# Detaillierte Build-Logs
bundle exec jekyll build --verbose --trace

# Review-Build inklusive Style-Guide-Ansicht (wird nicht deployt)
bundle exec jekyll build --unpublished -d _site_review
```

**Häufige Preview-Probleme und Lösungen:**
- **Baseurl-Probleme**: Korrekte Konfiguration für lokale Entwicklung
- **Asset-Pfade**: Verwendung von `relative_url` Filter
- **Plugin-Konflikte**: Sorgfältige Plugin-Auswahl und -Konfiguration
- **Cache-Probleme**: Regelmäßiges Löschen von `.jekyll-cache`

**Asset-Management und Organisation:**

**Strukturierte Asset-Organisation:**
```plaintext
assets/
├── _sass/                  # SCSS: base / components / layouts / variables
├── css/main.scss           # Einstieg für die Sass-Kompilierung
├── js/                     # Eigene Skripte (flach, sprechende Namen):
│   │                       #   fractal-renderer, fractal-panel,
│   │                       #   julia-worker, mandelbrot-worker,
│   │                       #   hero-crt, tv-switch, sw-register, …
├── vendor/                 # Selbst gehostete Bibliotheken inkl. MathJax (vormals CDN)
├── webfonts/               # Ubuntu und Font-Awesome-Subset (woff2)
├── images/                 # Wenige, handoptimierte Bilder
└── downloads/              # Downloadbare Dateien (Post-Template)
```

**Asset-Versionierung und Caching:**

Cache-Busting läuft nicht über Query-Parameter oder Config-Felder, sondern über den Service Worker: Der Cache-Name enthält einen Build-Zeitstempel (per Liquid aus `site.time`), sodass jeder Deploy einen frischen Cache erzeugt und alte Caches beim Aktivieren aufgeräumt werden. Die Sass-Kompilierung mit `style: compressed` übernimmt Jekyll selbst – eine separate Minifizierungs-Pipeline für CSS/JS existiert bewusst nicht.

### 4.3 Kritische Reflexion und Empfehlungen

Nach Aufbau und laufendem Betrieb lässt sich einschätzen, wie gut der gewählte Technologie-Stack passt und für wen er sich eignet.

Die Kombination aus Jekyll, Minimal Mistakes und GitHub Pages hat sich bewährt. Jekyll lief in der Praxis stabil, Builds sind vorhersagbar und liefern jedes Mal dasselbe Ergebnis. Für fast jedes Problem fand sich eine Lösung in Dokumentation oder Community. Die Architektur ließ sich gut an eigene Anforderungen anpassen, und Git macht jede Änderung nachvollziehbar.

Minimal Mistakes lieferte eine solide Grundlage, auf der sich die eigene Gestaltung gut aufbauen ließ. Die meisten gewünschten Anpassungen waren über Einstellungen und eigene Stylesheets möglich, die Darstellung funktioniert vom Smartphone bis zum Desktop. Meta-Tags und strukturierte Daten kommen automatisch.

GitHub Pages bot kostenloses Hosting ohne laufende Kosten für Hosting und CDN, automatische Deployments bei jedem Push und SSL-Zertifikate, die sich selbst erneuern. Das CDN von GitHub Pages sorgt für kurze Ladezeiten – Drittanbieter-CDNs für Bibliotheken und Fonts wurden dagegen bewusst abgelöst: Vendor-Skripte, MathJax und das Font-Awesome-Subset liegen selbst gehostet im Repository. Die Website lädt damit nichts von fremden Servern, und die Content Security Policy erlaubt auch nur Quellen der eigenen Domain.

Markdown hat sich ebenfalls bewährt: Inhalte lassen sich ohne tiefes technisches Wissen schreiben, jede Änderung ist versioniert, und die Texte sind an keine Plattform gebunden. Weil sie gut lesbar und klar strukturiert sind, bleiben sie leicht zu pflegen.

Verbesserungspotenzial gibt es trotzdem. Jekyll baut langsamer als etwa Hugo. Bei dieser Größe spielt das keine Rolle, bei Tausenden Seiten würden Builds aber lang und speicherhungrig. Abhilfe schaffen dann Incremental Builds, Caching und schlankere Assets.

Die Abhängigkeiten brauchen Pflege: Ruby-Gems wollen regelmäßig aktualisiert werden, Gems können sich untereinander nicht vertragen, und Sicherheitslücken müssen im Blick bleiben. Dependabot-Alerts und der monatliche Update-PR für die Actions nehmen hier Arbeit ab.

Theme-Updates bleiben heikel: Neue Versionen können Inkompatibilitäten mitbringen, und eigene Anpassungen, die Theme-Regeln überschreiben, können danach ins Leere laufen. Deshalb ist das Theme auf einen Commit gepinnt, und vor jedem Update laufen die automatischen Tests mit Screenshot-Vergleich.

**Zielgruppen:**

**Ideal geeignet für:**

**Entwickler mit Grundkenntnissen:**
- **Ruby/HTML/CSS-Kenntnisse**: Basiswissen für Customization erforderlich
- **Git-Erfahrung**: Für effektive Versionskontrolle und Deployment
- **Markdown-Kenntnisse**: Für Content-Erstellung und -Wartung
- **Terminal-Komfort**: Für lokale Entwicklung und Build-Prozesse

**Content-Creator mit technischem Interesse:**
- **Strukturierte Workflows**: Wertschätzung für organisierte Content-Erstellung
- **Markdown-Affinität**: Bereitschaft, Markdown zu erlernen
- **Git-Basics**: Grundlegende Kenntnisse für Content-Updates
- **Technische Neugier**: Interesse an der zugrundeliegenden Technologie

**Kleine bis mittlere Projekte:**
- **Bis zu 1000 Seiten**: Gute Performance in diesem Bereich
- **Statische Inhalte**: Keine dynamischen, datenbankbasierten Features
- **Regelmäßige Updates**: Häufige Content-Änderungen und -Erweiterungen
- **Team-Kollaboration**: Mehrere Autoren mit Git-Workflow

**Technische Blogs und Dokumentation:**
- **Code-Beispiele**: Syntax-Highlighting und Code-Blöcke
- **Mathematische Formeln**: LaTeX-Unterstützung für Formeln
- **Strukturierte Inhalte**: TOC, Kategorien, Tags für Organisation
- **SEO-Anforderungen**: Suchmaschinenoptimierung für technische Inhalte

**Alternative Szenarien:**

**Für große Websites (>1000 Seiten):**
- **Hugo**: Extrem schnelle Build-Zeiten (oft <1 Sekunde)
- **11ty**: Flexiblere Template-Engines und bessere Performance
- **Gatsby**: React-basierte Lösung mit GraphQL-Integration
- **Empfehlung**: Hugo für reine Performance, 11ty für Flexibilität

**Für React-Entwickler:**
- **Gatsby**: Optimiert für React-Entwicklung mit GraphQL
- **Next.js**: Full-Stack React-Framework mit SSG/SSR
- **Nuxt.js**: Vue.js-basierte Alternative
- **Empfehlung**: Gatsby für statische Sites, Next.js für dynamische Features

**Für einfache Blogs ohne technische Anforderungen:**
- **WordPress.com**: Managed WordPress mit einfacher Bedienung
- **Ghost**: Moderne Blogging-Plattform mit Fokus auf Content
- **Medium**: Publishing-Plattform ohne technische Komplexität
- **Empfehlung**: Ghost für professionelle Blogs, WordPress für Einfachheit

**Für Enterprise-Anwendungen:**
- **Headless CMS**: Contentful, Strapi, Sanity für Content-Management
- **Static Site Generators**: Hugo, 11ty mit Enterprise-Features
- **Cloud-Plattformen**: AWS, Azure, GCP mit Custom-Build-Pipelines
- **Empfehlung**: Headless CMS + Static Site Generator für Skalierbarkeit

**Langfristige Strategien und Migrationspfade:**

**Kurzfristige Optimierungen (0–12 Monate):**
- **Performance-Tuning**: Build-Zeit-Optimierung und Asset-Minimierung
- **Content-Expansion**: Erweiterung der Inhalte und Features
- **SEO-Optimierung**: Verbesserung der Suchmaschinen-Rankings
- **User Experience**: Optimierung der Benutzerfreundlichkeit

**Mittelfristige Entwicklungen (1–3 Jahre):**
- **Feature-Erweiterungen**: Neue interaktive Elemente und Funktionen
- **Performance-Monitoring**: Ladezeiten und Build-Dauer regelmäßig messen
- **Content-Strategie**: Erweiterte Content-Typen und -Formate
- **Community-Building**: Interaktion mit Lesern und Feedback-Integration

**Langfristige Perspektiven (ab drei Jahren):**
- **Technologie-Evaluation**: Bewertung neuer Static Site Generators
- **Migrationsplanung**: Vorbereitung auf mögliche Technologie-Wechsel
- **Skalierungsstrategien**: Planung für wachsende Content-Mengen
- **Innovation**: Integration neuer Web-Technologien und Standards


## V. Fazit und Ausblick

Nach Aufbau, Betrieb und vielen Weiterentwicklungen lassen sich Schlüsse ziehen – über den gewählten Technologie-Stack und darüber, wie es weitergehen kann.

### 5.1 Zusammenfassung der Erkenntnisse

**Technische Bewertung und Validierung:**

Jekyll und Minimal Mistakes haben sich als solide Basis erwiesen. Statisch erzeugte Seiten sind schnell, und die Entwicklung bleibt stabil und vorhersagbar.

**Kernstärken der gewählten Lösung:**
- **Performance**: Kurze Ladezeiten durch statische Generierung
- **Skalierbarkeit**: Effiziente Auslieferung über ein CDN
- **Wartbarkeit**: Strukturierte, versionierte Inhalte
- **Flexibilität**: Umfangreiche Customization-Möglichkeiten
- **Kosteneffizienz**: Vollständig kostenloses Hosting und Deployment

**Entscheidungsvalidierung und Lessons Learned:**

Die ursprüngliche Technologiewahl hat sich in den wichtigen Punkten bewährt:

**GitHub-Pages-Integration:**
- **Kostenloses Hosting**: Keine laufenden Kosten
- **Automatische Deployments**: Jeder Push auf den Hauptzweig geht nach bestandenen Prüfungen online
- **SSL-Zertifikate**: Automatische Sicherheit ohne zusätzlichen Aufwand
- **Globale Performance**: Auslieferung über ein CDN
- **Custom Domain**: Einfache Integration eigener Domain-Namen

**Jekyll-Ökosystem:**
- **Stabile Technologie**: Ausgereift und verlässlich
- **Große Community**: Umfangreiche Ressourcen und Support
- **Kontinuierliche Entwicklung**: Regelmäßige Updates und Verbesserungen
- **Dokumentationsqualität**: Ausführliche Dokumentation
- **Plugin-Ökosystem**: Reichhaltige Sammlung von Erweiterungen

**Minimal-Mistakes-Theme:**
- **Solide Grundlage**: Gutes Grunddesign, auf dem die eigene Gestaltung aufbaut
- **Responsive Design**: Gute Darstellung vom Smartphone bis zum Desktop
- **SEO-Optimierung**: Automatische Meta-Tags und strukturierte Daten
- **Customization-Flexibilität**: Die gewünschten Anpassungen ließen sich umsetzen
- **Erweiterbarkeit**: Eigene Layouts, Includes und Styles lassen sich sauber ergänzen

**Übertragbare Prinzipien und Best Practices:**

**Strukturierte Daten-Architektur:**
- **YAML-basierte Konfiguration**: Wartbare, menschenlesbare Einstellungen
- **Modulare Datenstrukturen**: Wiederverwendbare und erweiterbare Konfigurationen
- **Versionierung**: Vollständige Nachverfolgbarkeit aller Änderungen
- **Konsistenz**: Einheitliche Strukturen für bessere Wartbarkeit

**Modulare Architektur-Prinzipien:**
- **Wiederverwendbare Includes**: DRY-Prinzip für HTML-Komponenten
- **Layout-Hierarchie**: Klare Trennung zwischen Layouts und Inhalten
- **Asset-Organisation**: Strukturierte Verwaltung von CSS, JS und Bildern
- **Plugin-Integration**: Saubere Trennung zwischen Core und Erweiterungen

**Performance-First-Ansatz:**
- **Asset-Optimierung**: Komprimiertes CSS, handoptimierte Bilder, keine fremden Ressourcen
- **Caching-Strategien**: Alle Seiten vorab im Service Worker, Cache-First für Bilder, CSS und JavaScript
- **Lazy Loading**: Bilder verzögert, Skripte wie MathJax nur auf Seiten, die sie brauchen
- **Service Worker**: Offline-Funktion, beschränkt auf die eigenen Caches

**Content-Workflow-Optimierung:**
- **Markdown-basierte Inhalte**: Einfache, strukturierte Content-Erstellung
- **Front Matter**: Metadaten-Management für SEO und Layout-Kontrolle
- **Template-System**: Konsistente Darstellung durch standardisierte Templates
- **Automation**: Prüfskripte und CI für wiederkehrende Kontrollen

### 5.2 Zukunftsperspektiven

Auch das Umfeld entwickelt sich weiter. Jekyll wird weiter gepflegt, mit Updates, neuen Plugins, schnelleren Builds und Anpassungen an neue Webstandards.

Bei Static Site Generators allgemein zeichnen sich Trends ab: schnellere Builds und Seiten, bessere Werkzeuge für die Entwicklung, hybride Ansätze aus statischen und dynamischen Teilen und eine engere Anbindung an Cloud-Plattformen und Headless-CMS.

Die Browser bringen neue APIs, bessere Werkzeuge zum Messen der Performance, strengere Sicherheitsstandards, bessere Barrierefreiheit und mehr Möglichkeiten für Progressive Web Apps mit Offline-Funktion und App-Charakter.

Für die eigene Weiterentwicklung gibt es einen groben Fahrplan. Kurzfristig (0–12 Monate) geht es um weitere Performance-Arbeit an Build und Auslieferung, mehr Inhalte und interaktive Elemente, bessere Sichtbarkeit in Suchmaschinen und eine noch angenehmere Bedienung.

Mittelfristig (1–3 Jahre) kommen neue interaktive Elemente und Funktionen dazu, ein Blick auf die Performance im laufenden Betrieb, neue Inhaltsformate, mehr Austausch mit Lesern samt ihren Rückmeldungen und die Anbindung externer Dienste und Datenquellen.

Langfristig (ab drei Jahren) geht es darum, neue Static Site Generators zu bewerten, einen möglichen Wechsel vorzubereiten, mit wachsenden Inhalten umzugehen, neue Webtechniken aufzunehmen und die Seite an veränderte Anforderungen anzupassen.

**Spezifische Entwicklungsrichtungen:**

**Interaktivität und User Experience:**
- **Erweiterte JavaScript-Features**: Neue interaktive Elemente für Fraktal-Visualisierungen
- **Progressive Web App**: App-ähnliche Funktionen, aufbauend auf dem vorhandenen Offline-Zugriff
- **Real-time Features**: Live-Updates und Echtzeit-Interaktionen
- **Accessibility**: Verbesserte Barrierefreiheit für alle Nutzer

**Performance und Skalierung:**
- **Edge Computing**: Verlagerung von Verarbeitung an den Netzwerkrand
- **Advanced Caching**: Intelligentere Caching-Strategien
- **CDN-Optimierung**: Nutzung mehrerer CDN-Provider für globale Performance
- **Asset-Optimierung**: Automatisierte Optimierung aller Assets
- **Build-Optimierung**: Parallelisierung und Optimierung der Build-Prozesse

**Content und Community:**
- **Multimedia-Integration**: Erweiterte Unterstützung für Videos, Audio und interaktive Inhalte
- **Community-Features**: Kommentare, Bewertungen und Nutzerinteraktionen
- **Content-Collaboration**: Erweiterte Tools für Team-Kollaboration
- **Internationalization**: Mehrsprachige Unterstützung und Lokalisierung

Was bleibt: Die Fraktal-Visualisierungen zeigen, dass auch anspruchsvolle Interaktion auf einer statischen Website möglich ist. Web Worker, Canvas und modernes JavaScript gehen weit über die klassische statische Seite hinaus, ohne deren Stärken aufzugeben – Geschwindigkeit, Stabilität und keine laufenden Kosten. Vielleicht helfen die Entscheidungen und Erfahrungen hier auch bei ähnlichen Projekten.
