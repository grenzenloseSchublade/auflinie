# Beitragen zum Fraktale-Welten-Projekt

Schön, dass das Projekt Interesse weckt. Dieses Dokument sammelt Richtlinien und Hinweise, mit denen ein Beitrag gut gelingt.

## Wie kann ich beitragen?

Es gibt viele Möglichkeiten, zum Projekt beizutragen:

### Fehler melden

Ein gefundener Fehler kommt als Issue mit diesen Angaben:
- Klare Beschreibung des Fehlers
- Schritte zur Reproduktion
- Erwartetes vs. tatsächliches Verhalten
- Screenshots (falls relevant)
- Browser und Betriebssystem

### Verbesserungen vorschlagen

Ideen für neue Funktionen oder Verbesserungen kommen als Issue mit:
- Klare Beschreibung der vorgeschlagenen Funktion
- Begründung, warum diese Funktion nützlich wäre
- Mögliche Implementierungsansätze

### Gastbeitrag schreiben

Gastbeiträge kommen als Markdown-Datei nach der Vorlage `assets/downloads/post-template.md` (Download im Beitrag „Blogbeitrag erstellen“), Bilder als eigene Dateien. Was der Gast liefert und wie der Beitrag eingepflegt wird, steht in [`docs/pflege.md`](docs/pflege.md#gastbeitrag-einspielen).

### Code beitragen

1. Repository forken
2. Branch nach STYLEGUIDE.md anlegen (`git checkout -b feat/neues-thema`)
3. Änderungen committen (`git commit -m 'feat: neues Thema'`)
4. Branch pushen (`git push origin feat/neues-thema`)
5. Pull Request öffnen

## Entwicklungsrichtlinien

### Codestruktur

- `_includes/fractal/`: Gemeinsame Komponente der interaktiven Fraktal-Panels
  - `panel.html`: parametrisiertes Markup (Variante `julia` | `explorer`)
  - `julia-interactive.html` / `mandelbrot-julia-explorer.html` sind nur noch dünne Wrapper
- `assets/js/fractal-panel.js`: Panel-Verhalten (Varianten-Konfiguration, Gesten, Tastatur)
- `assets/js/fractal-renderer.js` + `*-worker.js`: Rendering in Web Workern
- `assets/_sass/components/_fractal-panel.scss` + `_crt-overlay.scss`: Panel-Optik und Retro-Screen
- `_pages/`: Markdown-Seiten; Inhalte der Mandelbrot-Seite in `_data/mandelbrot.yml`
- `assets/`: Bilder, CSS und andere statische Dateien

### Technische Anforderungen

- **JavaScript**: klassische Skripte bis ES2020, ohne Bundler (STYLEGUIDE JS-1)
- **Performance**: besonders bei rechenintensiven Operationen wichtig
  - Web Worker für parallele Berechnungen
  - progressives Rendering
- **Responsive Design**: Alle Komponenten sollten auf verschiedenen Geräten gut funktionieren
- **Zugänglichkeit**: grundlegende Zugänglichkeitsstandards einhalten

### Mathematische Genauigkeit

Da es sich um ein mathematisches Projekt handelt, ist die Genauigkeit der Implementierungen und Erklärungen besonders wichtig:
- Algorithmen korrekt implementieren
- Mathematische Formeln und Erklärungen auf Richtigkeit prüfen
- Mathematische Konzepte klar und verständlich dokumentieren

## Ideen für zukünftige Entwicklungen

Hier sind einige Ideen für zukünftige Erweiterungen:
- Implementierung weiterer Fraktaltypen (z. B. Newton-Fraktale, Burning Ship)
- 3D-Visualisierungen von Fraktalen
- Animationen zur Veranschaulichung der Entstehung von Fraktalen
- Optimierung für mobile Geräte
- Implementierung von GPU-Beschleunigung mit WebGL
- Erweiterung der mathematischen Erklärungen und Tutorials

## Kontakt

Fragen und Unklarheiten gehören in ein Issue.

Danke für jede Unterstützung! 