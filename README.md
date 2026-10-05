# Meine Jekyll Website mit Minimal Mistakes

Dies ist eine persönliche Website, die mit Jekyll und dem Minimal Mistakes Theme erstellt wurde.

## Projektübersicht

Diese Website kombiniert Jekyll mit dem Minimal Mistakes Theme, um eine ansprechende und funktionale Plattform zu bieten.

## TODO

- [x] Bilder und Grafiken optimieren (ungenutzte Assets entfernt — ~450 KB; Font-Awesome-Subset statt Komplett-CSS)
- [ ] Weitere Blog Einträge hinzufügen
- [ ] og:image: eigenes 1200 × 630-Bild statt des Hero-Hintergrunds mit 675 × 360 px (bessere Link-Vorschauen, STYLEGUIDE Register R-67)

## Installation und Einrichtung

Die Site nutzt **Jekyll 4** mit dart-sass. Die Ruby-Version steht in `.ruby-version`, die Node-Version
für das Lint- und Test-Werkzeug in `.nvmrc`. Die CI liest beide Dateien. Am einfachsten ist der mitgelieferte Dev Container
(siehe `.devcontainer/`), der Ruby, Bundler und alle Gems automatisch einrichtet.

Manuelles Setup:

1. Die in `.ruby-version` angegebene Ruby-Version muss installiert sein:

   ```bash
   ruby --version   # sollte zur .ruby-version passen
   ```

2. Bundler installieren (Version siehe `Gemfile.lock` → „BUNDLED WITH“):

   ```bash
   gem install bundler
   ```

3. Repository klonen:

   ```bash
   git clone [REPOSITORY-URL]
   cd [REPOSITORY-NAME]
   ```

4. Gems installieren:

   ```bash
   bundle install
   ```

## Lokale Entwicklung

Um die Website lokal zu entwickeln:

1. Jekyll-Server starten:

   ```bash
   bundle exec jekyll serve
   ```

2. <http://localhost:4000/auflinie/> im Browser öffnen (die Site liegt unter `baseurl: /auflinie`)

### Service Worker und CSS-Änderungen

Der Service Worker registriert sich **nur im Production-Build** (`JEKYLL_ENV=production`; Gate in `_layouts/default.html` via `jekyll.environment`). Beim lokalen `jekyll serve`/Dev-Build deregistriert die Seite vorhandene Worker automatisch und löscht die Site-Caches (`assets/js/sw-register.js`) — nach einem Wechsel von Production- zu Dev-Artefakten genügen also **zwei Reloads**, DevTools sind nicht nötig. Navigationen kommen **cache-first** aus dem Voll-Precache (`service-worker.js`, `handleNavigation`): alle Seiten werden bei der Installation geladen, Seitenwechsel sind danach netzunabhängig. Frische liefert ausschließlich der Update-Pfad (neuer Build ⇒ neuer Worker ⇒ Toast). Nur bei einem Cache-Miss (z. B. Paginierung) wird aus dem Netz geholt und nachgecacht. Der Worker liest und löscht nur seine eigenen Caches (Präfix `kraftstoff-cache-`), weil sich alle Projekte unter `grenzenloseSchublade.github.io` einen Origin teilen. Updates in Production meldet ein Toast („Neu laden“), nichts lädt ungefragt neu.

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
   - `math_engine: mathjax` muss in `_config.yml` gesetzt sein
   - Formeln dürfen keine Leerzeilen enthalten
   - Unterstriche in Formeln escapen: `a\_b` statt `a_b`

2. **Parsing-Fehler**
   - Kramdown-spezifische Attribute mit `{: .class}` setzen
   - Listen korrekt einrücken
   - Tabs und Leerzeichen nicht mischen

3. **GFM-Kompatibilität**
   - `input: GFM` ermöglicht GitHub-Flavored Markdown
   - Unterstützt Tabellen und durchgestrichenen Text
   - Unterstriche werden unterschiedlich behandelt

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

MathJax 4 ist selbst gehostet (`assets/vendor/mathjax/` und das Font-Paket `assets/vendor/mathjax-newcm-font/`), es gibt keinen CDN-Aufruf. Geladen wird es nur auf Seiten mit `mathjax: true` im Front Matter:

- `_config.yml` stellt kramdown auf `math_engine: mathjax`. kramdown gibt die Formeln dann als `\(…\)` und `\[…\]` aus.
- `_includes/head/custom.html` bindet bei `page.mathjax` zwei Skripte mit `defer` ein: `assets/js/mathjax-config.js` (die Konfiguration als Datei, kein Inline-Skript wegen der CSP) und `assets/js/mathjax-typeset.js` (setzt nach einem SPA-Seitenwechsel den neuen Inhalt).
- Den Kern `assets/vendor/mathjax/tex-chtml.js` hängt `mathjax-config.js` erst an, wenn er gebraucht wird: sofort, wenn die erste Formel höchstens zwei Bildschirmhöhen tief steht, sonst sobald eine Formel bis auf eine Bildschirmhöhe heranrückt, bei der ersten Eingabe oder nach dem Laden der Seite im Leerlauf. Nach einem SPA-Seitenwechsel lädt er sofort. So teilt sich der Kern mobil nicht Bandbreite und Hauptthread mit dem Hero-Bild.
- Die Version steht in `THIRD-PARTY-NOTICES.md`, `tests/vendor.spec.js` prüft nach einem Versionswechsel, ob alle Formeln gesetzt werden.

### Verwendung in Markdown-Dateien

1. MathJax im Front Matter der Seite aktivieren:

   ```yaml
   ---
   title: "Meine Seite"
   mathjax: true
   ---
   ```

2. Formeln in LaTeX-Syntax schreiben:
   - Inline-Formeln: `$E = mc^2$`
   - Display-Formeln: `$$\sum_{i=1}^n i = \frac{n(n+1)}{2}$$`

   In `_data/*.yml` (etwa `_data/mandelbrot.yml`) gilt eine Besonderheit (STYLEGUIDE MD-3): Inline-Formeln brauchen doppelte Backslashes, `$\\{z_n\\}$` und `$n\\to\\infty$`, Display-Formeln `$$…$$` einfache. Sonst verschluckt kramdown etwa bei `\{` den Backslash. `scripts/content-check.py` prüft das.

## Troubleshooting

### MathJax-Probleme

Wenn mathematische Formeln nicht korrekt angezeigt werden:

1. Cache leeren:

   ```bash
   rm -rf .jekyll-cache
   bundle exec jekyll clean
   ```

2. Diese Punkte prüfen:
   - `mathjax: true` ist im Frontmatter der Seite gesetzt
   - `assets/vendor/mathjax/tex-chtml.js` wird ohne Fehler geladen (Netzwerk-Tab, Konsole). Steht die erste Formel weiter unten, lädt der Kern erst beim Scrollen dorthin
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

## Inhalte pflegen

Inhalte stehen in Markdown oder in `_data/*.yml`, das Markup in Includes (STYLEGUIDE ARCH-4). Die CI meldet typische Fehler mit Datei, Zeile und Lösung. Vor dem Push lokal: `python3 scripts/content-check.py`.

| Fall | Datei | Fallen |
|---|---|---|
| Neuer Beitrag | `_posts/JJJJ-MM-TT-titel.md` nach der Vorlage `assets/downloads/post-template.txt` (Download im Leitfaden „Blogbeitrag erstellen“) | Das Datum im Dateinamen ist das Veröffentlichungsdatum, ein Datum in der Zukunft erscheint erst ab diesem Tag beim nächsten Build. Kein `<!-- -->`, Notizen als `{% comment %}` (sonst rot) |
| Gastbeitrag | wie ein Beitrag, dazu `author: "Vorname Nachname"` | Nur der Name erscheint, kein Profil (INH-5) |
| Bild im Beitrag | Datei nach `assets/images/posts/`, Einbindung `![Alt]({{ "/assets/images/posts/bild.jpg" \| relative_url }}){: width="1200" height="800"}` | Ohne `relative_url` fehlt `/auflinie`. Fehlende Datei oder fehlendes `alt` macht die CI rot, fehlende Maße geben eine Warnung |
| Entwurf | `_drafts/titel.md` oder `published: false` | Erscheint nur mit `--drafts` bzw. `--unpublished` |
| Lebenslauf | `_data/cv_content.yml` | Zeiträume „2020 – 2025“ mit normalen Leerzeichen. Prosa als `\|`-Block, harter Umbruch als `\\` am Zeilenende |
| Skills, Skill-Graph | Chips in `_data/cv_content.yml` (`skill_groups`), Projekte in `_data/skill_graph.yml` | Eine Skill-ID ist der Chip-Name klein mit Bindestrichen („Next.js“ → `next-js`). Eine unbekannte ID macht die CI rot, mit Vorschlag |
| Fraktal-Texte | `_data/mandelbrot.yml` | Inline-Mathe mit doppelten, Display-Mathe mit einfachen Backslashes (oben, MD-3) |
| Startseite | `_data/home.yml` | Absätze im `\|`-Block mit Leerzeile trennen. Ein neues Kachelbild in jeder Breite unter `image.srcset` und in `CACHE_URLS` (`service-worker.js`, Offline-Cache) eintragen |
| Über mich, andere Seiten | `_pages/*.md` | Neue Seite braucht `permalink` und einen Menüeintrag |
| Menü und Footer | `_data/navigation.yml` (`main`, `footer`) | Menütitel und Seitentitel sind getrennt gepflegt |
| Kontakt, Social-Links | `_config.yml` → `author.links` | `footer: true` zeigt den Kanal im Footer, `contact: true` als Kontaktkarte. Neue Icons ins Subset (`assets/_sass/base/_icons.scss`) |
| Hinweis über dem Blog | `_pages/posts.md` → `blog_notice` | Für einen neuen Hinweis auch eine neue `id`, sonst bleibt er bei allen ausgeblendet, die den alten geschlossen haben |

## Anpassungen

- Die Hauptkonfiguration befindet sich in `_config.yml`
- Layouts können in `_layouts` angepasst werden
- Assets (Bilder, CSS, JS) gehören in den `assets` Ordner

## Deployment

Das Deployment läuft über **GitHub Actions** (Workflow `.github/workflows/jekyll-gh-pages.yml`),
das die Site mit `bundle exec jekyll build` baut und das Ergebnis auf GitHub Pages veröffentlicht –
**nicht** über den nativen GitHub-Pages-Build. Das ist nötig, weil die Site Plugins nutzt, die nicht
auf der Pages-Whitelist stehen (`jekyll-paginate-v2`, `jekyll-last-modified-at`), und erlaubt den
Einsatz der aktuellen Jekyll-4-Version inkl. dart-sass.

Ablauf:

1. Push auf `main`/`master` → Workflow baut und deployt automatisch.
2. Manueller Start (`workflow_dispatch`) auf einem anderen Branch → Workflow baut und prüft nur (ohne Deploy).
3. In den Repository-Einstellungen muss unter **Pages → Build and deployment** die Quelle auf
   **GitHub Actions** stehen.

## Weitere Ressourcen

- [Minimal Mistakes Dokumentation](https://mmistakes.github.io/minimal-mistakes/docs/quick-start-guide/)
- [Jekyll Dokumentation](https://jekyllrb.com/docs/)
- [MathJax Dokumentation](https://docs.mathjax.org/)

## Best Practices

1. **Trennung von Inhalt und Präsentation**:
   - Strukturierte Daten liegen als YAML-Dateien im Verzeichnis `_data/`
   - Die Darstellung übernehmen Includes
   - Markdown-Dateien bleiben schlank und enthalten nur den Inhalt

2. **Wiederverwendbarkeit**:
   - Includes sind generisch gehalten und in verschiedenen Kontexten verwendbar
   - Parameter halten Includes flexibel

3. **Konsistenz**:
   - Benennung folgt einheitlichen Konventionen
   - Datendateien sind einheitlich aufgebaut

4. **Erweiterbarkeit**:
   - Neue Includes und ihre Parameter werden dokumentiert
   - Die Struktur bleibt modular, damit Erweiterungen leichtfallen

## Beispiel: Neue Seite mit benutzerdefinierten Daten

### 1. Datendatei erstellen (`_data/projekte.yml`)

```yaml
- section: "Aktuelle Projekte"
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
<article class="project-card">
  <h3 class="project-card__title">{{ projekt.titel }}</h3>
  <p>{{ projekt.beschreibung }}</p>
  <p><strong>Technologien:</strong> {{ projekt.technologien | join: ", " }}</p>
  <p><a href="{{ projekt.link }}">Projekt ansehen</a></p>
</article>
{% endfor %}
```

Neue Klassen nach BEM bekommen eine eigene Datei unter `assets/_sass/components/` (STYLEGUIDE SCSS-1, SCSS-5). Externe Links bekommen `target="_blank"`, `rel="noopener noreferrer"` und den Hinweis „öffnet in neuem Tab“ beim Build (`_plugins/external-links.rb`, LINK-3).

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
<section id="{{ section.section | slugify }}">
  <h2>{{ section.section }}</h2>
  {{ section.content | markdownify }}
  {% include projekte.html projekte=section.projekte %}
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
toc_sticky: true     # Optional: TOC bleibt beim Scrollen sichtbar
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
- `toc_label`: Die Beschriftung des TOC (Standard: „Auf dieser Seite“ aus `_data/ui-text.yml`, die meisten Seiten setzen „Inhalt“)
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

### Mobile Sticky-Leiste

Unter 1024 px steht die TOC nicht in der Seitenleiste. Sobald sie aus dem Bild scrollt, erscheint unter dem Masthead eine Leiste mit dem aktuellen Kapitel und dem Lesefortschritt, die die Kapitel-Liste aufklappt. Verhalten und Barrierefreiheit liegen in `assets/js/toc.js` (STYLEGUIDE A11Y-2).

### Speicherung des Zustands

Der Zustand des ausklappbaren TOC (ausgeklappt oder eingeklappt) wird im `localStorage` des Browsers gespeichert, sodass er beim nächsten Besuch der Seite wiederhergestellt wird.

## Lizenz

Leitgedanke: Wissen soll weitergegeben und weiterverwendet werden. Deshalb ist das Repository so offen wie möglich lizenziert, mit wenigen begründeten Ausnahmen.

| Bestandteil | Lizenz |
|---|---|
| **Code**: JavaScript (`assets/js/`), SCSS (`assets/_sass/`), Liquid/HTML-Templates (`_includes/`, `_layouts/`), Skripte (`scripts/`, `tests/`), Konfiguration | [MIT](LICENSE) |
| **Wissens-Texte**: Blogbeiträge (`_posts/`), Fraktal-Erklärungen (`_data/mandelbrot.yml`, `_pages/mandelbrot.md`, `_includes/fractal/explanation-*.html`), `assets/downloads/` | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/deed.de) – Weiterverwendung erlaubt, mit Nennung „Hans Müller, auflinie“ und Link |
| **Persönliches**: Lebenslauf und Profil (`_pages/cv.md`, `_pages/about.md`, `_data/cv_content.yml`, `_data/skill_graph.yml`), Startseiten-Texte (`_data/home.yml`) | Alle Rechte vorbehalten |
| **Bilder und Marke**: Logo und Favicons (`assets/images/Logo.svg`, `favicon*`, `apple-touch-icon.png`), `mandelbrot-preview*.jpg` | Alle Rechte vorbehalten |
| **`assets/images/background.jpg`** | Adobe-Stock-Lizenz, darf nicht weitergegeben oder weiterverwendet werden |

### Komponenten Dritter

Theme, Bibliotheken und Schriften von Dritten behalten ihre eigenen Lizenzen. Die vollständige Liste mit Version, Herkunft und Lizenz steht in [`THIRD-PARTY-NOTICES.md`](THIRD-PARTY-NOTICES.md).
