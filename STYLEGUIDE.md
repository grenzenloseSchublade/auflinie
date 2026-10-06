# Style Guide auflinie

Version 2026-10-06 · Stand: 6. Oktober 2026 · Gilt für: Repo `auflinie` (Jekyll, Remote-Theme Minimal Mistakes, Dart Sass über jekyll-sass-converter, Versionen in `Gemfile.lock`, `_config.yml` und `package-lock.json`)

Ist-Angaben wurden gegen Commit `848efe2` erhoben, am 2. 10. 2026 vollständig gegen `75c23c0` abgeglichen (jede Regel mit Status Soll oder Offen und jeder Registereintrag) und seither je Änderung nachgeführt: am 4. 10. 2026 gegen `c19da3f` für die Commits seit `1d6a37b` samt Skill-Graph-Regeln, am 5. 10. 2026 für alle Regeln mit SPA-Bezug und beim Entschlacken nach ARCH-7 (geänderte Verweise am Code geprüft, Abschnitt 19), am 6. 10. 2026 für die Owner-Entscheidungen dieses Tages. Bei jedem neuen Ist-Stand werden die Ist-Sätze und das Register neu geprüft und dieser Satz aktualisiert.

Dieses Dokument ist die **einzige normative Quelle** für Gestaltung, Code, Sprache, Sicherheit und Arbeitsweise im Repo. Es kodifiziert die Entscheidungen des Owners (Abschnitt 1.3) und verlinkt externe Standards. Einzelbefunde, Messwerte und der Ist-Zustand stehen im Audit-Bericht `docs/audits/2026-10-01-audit.md`, die Sicherheitsbefunde in `docs/audits/2026-10-01-security.md`. Beide Berichte sind Momentaufnahmen vom 1. 10. 2026 und nicht normativ. Was seither behoben ist, steht nur hier, nicht im Bericht.

## Grundsätze

- **G-1 Ruhig vor bunt.** Struktur entsteht aus Größe, Abstand und Hairlines, nicht aus Farbe.
- **G-2 Tokens vor Literalen.** Jeder Farb-, Größen-, Abstands- und Zeitwert hat genau eine Quelle in `assets/_sass/variables/`.
- **G-3 Barrierefreiheit ist Pflicht, kein Extra.** Ziel ist WCAG 2.2 AA. Bewusste Abweichungen stehen mit Begründung in Abschnitt 6.
- **G-4 Jede prüfbare Regel bekommt einen Check.** Jede Regel nennt ihre Durchsetzung (Abschnitt 1.2). Was eine Maschine prüfen kann, prüft die CI (Abschnitt 16).
- **G-5 Code und Doku ändern sich im selben Commit.** Doku verweist auf Variablen, statt Zahlen zu kopieren.
- **G-6 Eigene Entscheidungen ausschreiben, externe Standards verlinken.**
- **G-7 Neuer Code erfüllt die Regeln sofort, Bestand wird geplant migriert.** Bekannte Abweichungen stehen im Register (Abschnitt 17), nicht verstreut im Text.

---

## 1 Geltungsbereich und Verbindlichkeit

### 1.1 Geltungsbereich

Gilt für:

- Quellen: `assets/_sass`, `assets/js`, `service-worker.js`, `_includes` (inklusive der Logo-Dateien `_includes/logo.svg` und `_includes/logo-roehren.svg`), `_layouts`, `_pages`, `_posts`, `_drafts`, `_data`, `index.html`, `404.html`, `offline.html`
- Medien und Downloads: `assets/images/`, `assets/webfonts/`, `assets/downloads/`
- Konfiguration und Werkzeuge: `_config.yml`, `package.json`, `Gemfile`, `.stylelintrc.json`, `.editorconfig`, `playwright.config.js`, `.github/workflows/`, `.devcontainer/`, `scripts/`, `tests/`
- die Repo-Dokumentation

Nicht erfasst sind `vendor/`, `assets/vendor/` (unveränderte Fremddateien, siehe SEC-8), `node_modules/`, `_site/`, `.jekyll-cache/` und `tmp/`.

### 1.2 Verbindlichkeit, Status, Durchsetzung

Jede Regel trägt drei Angaben in eckigen Klammern, zum Beispiel FARB-2 [MUSS · Soll · CI-P2].

Verbindlichkeit (angelehnt an RFC 2119):

| Stufe | Bedeutung |
|---|---|
| **MUSS** / **DARF NICHT** | Zwingend. Abweichung nur mit Ausnahme-Marker (1.4) und Begründung. |
| **SOLL** / **SOLL NICHT** | Regelfall. Abweichung ist erlaubt, wenn der Grund im Commit oder Kommentar steht. |
| **KANN** | Empfehlung ohne Pflicht. |

Status:

| Status | Bedeutung |
|---|---|
| **Ist** | Der Code erfüllt die Regel heute. |
| **Soll** | Die Regel gilt ab sofort für neuen und angefassten Code. Bekannte Abweichungen im Bestand stehen im Register (17) und werden migriert, fehlende Bausteine (ein noch nicht gebauter Helfer, Check oder Datei) im Regeltext. Ein Soll ohne beides heißt: keine Abweichung bekannt, der Bestand ist aber nicht vollständig geprüft (meist Inhalts-, Review- oder Prozessregeln). |
| **Offen** | Vorschlag. Wartet auf eine Owner-Entscheidung und ist bis dahin **nicht** verbindlich. |

Durchsetzung:

| Angabe | Bedeutung |
|---|---|
| **CI** | Ein Check im Workflow prüft die Regel heute (16.1). |
| **CI-P1** … **CI-P4** | Check geplant, Priorität nach 16.2. |
| **Hook** | Ein lokaler Git-Hook prüft die Regel (`.githooks/commit-msg`, einschalten nach `README_DEV.md`, im Dev Container automatisch), die CI nicht (Owner-Wahl 6. 10. 2026, 16.1). |
| **Review** | Nur per Review prüfbar (Checkliste 16.3). |

### 1.3 Owner-Entscheidungen und dieser Guide

- **GOV-1** [MUSS · Ist · Review] Der Guide schreibt Owner-Entscheidungen fest. Widerspricht eine Regel einer dokumentierten Owner-Entscheidung, wird **nicht** per Rangfolge entschieden. Der Owner wird gefragt, danach wird der Guide angepasst.
- **GOV-2** [MUSS · Ist · Review] Für alles andere gilt: dieser Guide, dann verlinkte externe Standards, dann Duden.

### 1.4 Ausnahmen

- **GOV-3** [MUSS · Ist · CI] Ausnahme-Marker stehen **in der Zeile direkt über** der betroffenen Stelle und nennen die Regel-ID oder Kategorie und einen Grund. Die Guardrails (16.1) erkennen `fs`- und `bp`-Marker nur dort, `farb`- und `skala`-Marker zusätzlich als `[Block]`-Paar (Anfang und `-Ende`).

```scss
// fs-Ausnahme: Hero-em-System, skaliert mit dem Titel
// farb-Ausnahme: CRT-Phosphor, kein Palettenton
// bp-Ausnahme: Drawer-Aussparung = $drawer-width / 0.75
// skala-Ausnahme: Drawer-Choreografie (MO-4), gekoppelt an greedy-navigation.js
```

- **GOV-4** [MUSS · Ist · Review] Wo kein Code-Kommentar möglich ist, gilt dasselbe Format in der jeweiligen Kommentarsyntax: Liquid und Markdown `{% comment %} ausnahme TYPO-1: Grund {% endcomment %}`, YAML `# ausnahme TYPO-1: Grund`, Commits als Zeile `Ausnahme: GIT-1, Grund` im Body.
- **GOV-5** [MUSS · Ist · Review] Das zentrale Ausnahme-Register ist die Summe aller Marker. `grep -rnE '(fs|farb|bp|skala)-Ausnahme:|ausnahme [A-Z]+-[0-9]+:'` listet es vollständig (heute nur Code-Marker, `ausnahme …` in Liquid, YAML oder Commits kommt nicht vor). Commits mit Ausnahme listet `git log --grep='^Ausnahme: GIT-'`. Bekannte Verstöße ohne Marker stehen in Abschnitt 17.

### 1.5 Änderungen am Guide

- **GOV-6** [MUSS · Ist · Review] Regeln ändert nur der Owner oder eine vom Owner freigegebene Änderung. Neue Regeln, Statuswechsel und Löschungen laufen als eigener Commit `docs(styleguide): …`.
- **GOV-7** [MUSS · Ist · Review] Der Kopf trägt die Version als Datum. Jede inhaltliche Änderung ergänzt Abschnitt 19 (Änderungen) um eine Zeile.
- **GOV-8** [MUSS · Ist · Review] Regel-IDs werden nie neu vergeben. Gestrichene Regeln bleiben als „entfallen“ mit Verweis stehen. Das gilt auch für Register-IDs: Ein erledigter Eintrag verschwindet, seine Nummer wird nicht wieder belegt (Code-Kommentare dürfen alte IDs weiter nennen).

### 1.6 Arbeitsweise

- **PROZ-1** [MUSS · Ist · Review] Vor Design-Umbauten werden Vorschläge oder ASCII-Mockups zur Auswahl gezeigt. Der Owner entscheidet nach Optik.
- **PROZ-2** [MUSS · Ist · Review] Bei widersprüchlichen oder unklaren Anweisungen wird nachgefragt, mit den Deutungsvarianten. Die wörtlichste Lesart wird nicht stillschweigend gebaut.
- **PROZ-3** [MUSS · Ist · Review] Umgesetzt wird nur, was sachlich besser ist. Zweifelhafte oder spekulative Änderungen (vor allem rein visuelle Experimente) werden als solche benannt und mit Abwägung vorgelegt statt gebaut.
- **PROZ-4** [SOLL · Ist · Review] Tests im Browser erst, wenn der Docker-Build grün ist (kein lokales Ruby, siehe `README_DEV.md`).

### 1.7 Begriffe

| Begriff | Bedeutung |
|---|---|
| Owner | Inhaber des Repos, entscheidet über Gestaltung, Inhalte und diesen Guide |
| Ansicht | Arbeitsdefinition: der gleichzeitig sichtbare Viewport-Ausschnitt einer Seite (Owner bestätigen) |
| Lesertexte | sichtbare Texte für Besucher (Hero, Einleitungen, Excerpts, Bedientexte), im Unterschied zu Doku und Kommentaren |
| Chrome-Label | kleines Bedien- oder Meta-Label in Mono-Versalien (TOC-Kopf, Meta-Zeile), kein Fließtext |
| Interaktions-Moment | Zustand während oder als Ergebnis einer Bedienung (Fokus, Hover, Auswahl) |
| Seiten-Modul | Skript, das das Verhalten einer Seite oder Komponente einmal beim Laden anschaltet (10.2) |
| Kaskaden-Falle | Theme-Regeln wie `.page__content p` machen niedrig spezifische eigene Deklarationen wirkungslos (TYP-4) |
| Kill-Switch | globaler Reduced-Motion-Block in `base/_accessibility.scss` |
| Theme-Brücke | `assets/_sass/_theme-bridge.scss`, die einzige Stelle, die Minimal Mistakes per `@import` lädt und ihm die eigenen Tokens übergibt (SCSS-4) |
| Choreografie | gekoppelte Abfolge mehrerer Animationen (View Transition, CRT, Drawer, Neon) |
| Hover-Lift | Anheben eines Elements per `translateY` beim Hover |
| Front-Loading | Kernaussage an den Anfang von Satz, Überschrift oder Listenpunkt |
| Review-Blocker | Befund, der einen Merge verhindert, bis er behoben ist |
| Trefferpolster | unsichtbare Vergrößerung der Trefferfläche eines Bedienelements auf Touch-Geräten, ohne Optik oder Layout zu ändern (Mixin `touch-target-pad`, 6.1) |

### 1.8 Leitlinie: einfach, aber anpassbar

Owner-Entscheidung vom 4. 10. 2026. Minimal Mistakes wurde gewählt, weil die Seite einfach und trotzdem anpassbar sein soll. Laufend gepflegt werden vor allem Lebenslauf und Blog, alle übrigen Inhalte müssen genauso einfach änderbar sein, nur seltener. Inhalte pflegt allein der Owner. Diese Leitlinie gilt vor allen technischen Regeln dieses Guides: Eine Regel, die ihr widerspricht, wird dem Owner vorgelegt (GOV-1).

Grundlage der Entscheidung (Messungen vom 4. 10. 2026, Momentaufnahme):

- Git-Historie seit Februar 2025: 13 % der Commits waren Inhalt, 5 % von außen erzwungene Wartung, der Rest selbst gewählte Technik (Design, Funktionen, Guardrails, dieser Guide). Pflicht-Wartung realistisch 3 bis 6 Stunden im Jahr, mit Theme-, Playwright- und Werkzeug-Updates 10 bis 20 Stunden. Kein roter CI-Lauf ging bisher auf einen reinen Inhalts-Commit zurück.
- Theme-CSS: Die Gegenregeln (R-11, R-50, R-79) sitzen in tragenden Theme-Partials, ein Ersatz des Theme-CSS lohnt nicht. Ungenutzt sind nur `magnific-popup` und `search` (zusammen etwa 4 % des CSS).
- Abweichungen vom Theme bewegen sich in Markup und CSS meist innerhalb der Theme-Hooks und -Variablen. Die größte eigene Last ist die SPA-Navigation (`spa-nav.js`, Kontrakt in 18 Skripten, eigene Regeln und Ausnahmen). Native cross-document View Transitions sind bereits eingebaut und erzeugen in Chromium und Safari denselben Effekt.
- Probelauf aller Inhaltsarten: Lebenslauf, Skills, Mandelbrot-Texte und Über mich sind ein bis zwei Schritte in YAML oder Markdown. Startseite, Footer und Kontakt stehen noch in HTML-Includes. Mehrere Inhaltsfehler (kaputte Bilder, öffentliche HTML-Kommentare, falsche Skill-IDs) kamen bisher still durch die CI.

- **ARCH-1** [MUSS · Soll · Review] **Theme zuerst.** Minimal Mistakes bleibt das Fundament. Anpassungen laufen zuerst über die Mechanismen des Themes: Konfiguration, Theme-Variablen vor dem Import (z. B. `$global-transition`), Hook-Includes (`head/custom.html`, `footer/custom.html`), `_data`. Ein Override einer Theme-Datei braucht einen Grund im Dateikopf (LIQ-1), der bei jedem Theme-Update geprüft wird. Trägt der Grund nicht mehr, kehrt die Datei zur Theme-Fassung zurück (seit 5. 10. 2026 `page__related.html`). `archive-single.html` weicht nur noch an zwei Stellen von der Theme-Fassung ab: Teaser mit `width`/`height` aus `_plugins/bildmasse.rb`, `loading="lazy"` und `decoding="async"` (IMG-3), Ebene des Kartentitels per `heading_level` (SEITE-3). Nicht genutzte Theme-Partials werden nicht eingebunden: Seit 5. 10. 2026 importiert `_theme-bridge.scss` die Partials einzeln, ohne `magnific-popup` und `search`. Die Liste wird bei jedem Theme-Update mit `_sass/minimal-mistakes.scss` abgeglichen.
- **ARCH-2** [MUSS · Ist · Review] **Plattform vor Eigenbau.** Was der Browser selbst kann (cross-document View Transitions, `<dialog>`, `inert`, `:focus-visible`, `(hover: hover)`), wird genutzt statt nachgebaut. Die SPA-Navigation ist deshalb ausgebaut (Owner 4. 10. 2026, umgesetzt 5. 10. 2026, `docs/features/seitenwechsel.md`). Seitenwechsel laufen als normale Seitenaufrufe mit nativer View Transition. Firefox ohne cross-document View Transitions lädt die Seite normal neu, ein kurzer Moment ohne stehende Kopfzeile ist dort akzeptiert. Unter `prefers-reduced-motion` bleibt die View Transition in Chromium und Safari aktiv, aber mit Dauer null (harter Schnitt ohne Bewegung).
- **ARCH-3** [MUSS · Ist · Review] **Bewegung nur mit Mehrwert.** Überblendet wird nur, was einen echten Nutzen hat. Global gilt `$global-transition` des Themes, eingeschränkt auf Farbe, Hintergrund, Rahmenfarbe und Deckkraft (gesetzt in `_theme-bridge.scss`, MO-1). Größe, Abstand und Position springen. Bewusst gestaltete Effekte (Drawer, CRT, Neon, Skill-Graph, Seitenwechsel) bleiben eigene, gezielte Animationen (MO-1, 6.5). Die Theme-Einblendung beim Laden ist aus (`$intro-transition: none` in `_theme-bridge.scss`), Kopfzeile, Inhalt und Footer erscheinen sofort (Owner, bestätigt 6. 10. 2026, Z-1).
- **ARCH-4** [MUSS · Soll · Review] **Inhalte in Daten, eine Quelle je Angabe.** Lesertexte stehen in Markdown oder `_data/*.yml`, nicht in Includes, Layouts oder JavaScript. Wiederkehrende Angaben (Kontakt, Social-Links, Menütitel) haben genau eine Quelle, aus der Footer, Sidebar, Kontaktkarten und Metadaten lesen. Kontakt und Social-Links: `author.links` in `_config.yml` (Sidebar, Footer mit `footer: true`, Kontaktkarten und Kontakt-Hinweise mit `contact: true`, JSON-LD `sameAs` über `_plugins/social-links.rb`). Startseite: `_data/home.yml`, Markup in `_includes/home/`. Fraktal-Panels: Bedientexte in `_data/fractal_panel.yml`, Erklärboxen in `_data/mandelbrot.yml` (`panel_explanations`, Markup `_includes/fractal/explanation.html`), Umschalttexte als `data-label`/`data-…-active` am Knopf, `fractal-panel.js` erzeugt keinen eigenen Text. Skill-Feature: `texts` in `_data/skill_graph.yml`, die Skripte lesen sie aus dem JSON-Datenblock. Copyright-Zeile: `powered_by` in `_data/ui-text.yml`. Menütitel: `_data/navigation.yml` (`main`, Footer-Liste `footer` erbt den Titel aus `main`, ein Eintrag ohne Menüpunkt wie „Datenschutz“ trägt ihn selbst). Seitentitel im Front Matter und Menütitel sind bewusst getrennt: Minimal Mistakes kennt keine Kopplung, und die Kurzform darf abweichen („Mandelbrot“ zu „Die Welt der Fraktale“). Rest: R-88.
- **ARCH-5** [MUSS · Ist · CI] **Einfacher Pflegepfad.** Jede Inhaltsart lässt sich in höchstens fünf Schritten ändern, beschrieben in der Pflege-Anleitung (`docs/pflege.md`). Gastbeiträge kommen als Markdown nach der Vorlage `assets/downloads/post-template.txt`, der Gast steht nur mit Namen im Feld `author` (INH-5). Die CI erkennt typische Inhaltsfehler, statt sie still durchzulassen (Bilder, HTML-Kommentare, Skill-IDs, Links). Regeln, die einen reinen Inhalts-Commit rot machen, brauchen einen klaren Grund und eine verständliche Meldung. Heute in der CI: `scripts/content-check.py` (HTML-Kommentare, Skill-IDs, Mathe, Pfade ohne `relative_url`, fehlende oder leere Text-Schlüssel der Bedienung, unbekannte Felder der Erklärboxen) und html-proofer (Links, Bilder, Skripte), siehe 16.1.
- **ARCH-6** [SOLL · Soll · Review] **Technik in Etappen, dann Stopp.** Größere technische Änderungen gehen in Etappen live, jede einzeln geprüft, mit Zeit zum Beobachten. Nach den laufenden Etappen (Stand 4. 10. 2026: Register-Abbau mit Cross-Browser-Tests, Gastbeiträge und Links, Rückwege zum Theme mit ARCH-3, Inhaltspflege robust machen, SPA-Ausbau, Pflege-Anleitung und Entschlacken dieses Guides) gilt ein Technik-Stopp: Neue Technik nur, wenn ein echtes Problem es verlangt. Der Vorrang liegt danach bei den Inhalten.
- **ARCH-7** [SOLL · Ist · Review] **Dieser Guide bleibt schlank.** Was erledigt und durch die CI abgesichert ist, wird im Guide auf Regel und Check verkürzt. Ausführliche Herleitungen gehören in Commits oder `docs/`, nicht in Regeltexte.

---

## 2 Design-Prinzipien

Owner-Entscheidungen vom Juli 2026, mehrfach bestätigt:

- **DES-1** [MUSS · Ist · Review] **Farbarm.** Weiß und gedimmtes Weiß tragen Text und Überschriften. Panel-Ton `#1a1c20` plus Hairlines bilden Flächen.
- **DES-2** [MUSS · Ist · Review] **Keine zwei statischen Akzentfarben nebeneinander.** Statische Farbakzente werden abgelehnt, sobald zwei Akzentfarben nebeneinander sichtbar sind. Cyan-subtle ist der einzige statische Struktur-Anker. *Offen:* ob „Cyan-subtle“ `$link-color-subtle` (40 %) oder `$border-accent` (55 %, der tatsächliche Kartenrand von `card-panel`) meint.
- **DES-3** [MUSS · Ist · Review] **Magenta = Interaktions-Moment.** Fokus, Textauswahl, Nav-Hover, Zoom-Box, aktive Skill-Auswahl (auch als Ergebnis-Zustand einer Interaktion) sowie die Marke (Logo, Neon-Umlaut). Sonst nicht.
- **DES-4** [MUSS · Ist · Review] **Beige = singulärer Warm-Akzent.** Motto, Kapitel-Hairline (`section-break`), Panel-Spaltentitel. Sonst nicht.
- **DES-5** [MUSS · Ist · Review] **Kapitelgrenze = Luft plus eine auslaufende Beige-Hairline.** Eine Linie pro Grenze. Die H2 hat keine zusätzliche Unterstreichung.
- **DES-6** [MUSS · Ist · Review] **Hero-Action-Buttons weiß gerahmt** (CRT-Look), nicht cyan.
- **DES-7** [MUSS · Ist · Review] **Neue Akzent-Einsätze werden vorher mit dem Owner abgestimmt.** Im Zweifel weiß oder gedimmt.
- **DES-8** [MUSS · Ist · Review] **Nur dunkel.** Die Seite hat kein helles Farbschema. `<meta name="color-scheme" content="dark">` und `<meta name="theme-color">` im Seitengrund `$page-bg` (beide in `_includes/head/custom.html`, Wert dort als Spiegel kommentiert) sorgen dafür, dass native Controls, Scrollbars und die Browser-Leiste dunkel rendern.

---

## 3 Design-Tokens

Quelle: `assets/_sass/variables/_colors.scss`, `_typography.scss`, `_layout.scss`, `_scales.scss`, `_css-properties.scss`. Die ersten vier bündelt `abstracts/_tokens.scss` als Modul. Die Theme-Brücke lädt es **vor** den Theme-Dateien, damit `!default`-Variablen des Themes überschrieben werden (SCSS-4). `_css-properties.scss` erzeugt die `:root`-Custom-Properties und steht in `assets/css/main.scss` an erster Stelle.

### 3.1 Farben

Kontrastwerte nach WCAG 2.x, Alpha auf den jeweiligen Grund komponiert, nachgerechnet mit gerundeter Komposition. Gründe:

| Grund | Wert | Herkunft |
|---|---|---|
| Seite | `#252a34` | `$page-bg`, Spiegel des MM-Dark-Skins (Critical-CSS, `theme-color`). Das Theme-`$background-color` zeigt darauf (FARB-10) |
| Panel | `#1a1c20` | `$console-panel-bg` |
| Panel-Hover | `#20242a` | `$console-panel-bg-hover` |
| Drawer | `#0f0f14` | `$drawer-bg` |

Text- und Akzent-Tokens (Kontrast auf Seite · Panel · Drawer):

| Token | Wert | Rolle | Seite | Panel | Drawer | Als Text |
|---|---|---|---|---|---|---|
| `$white` | `#ffffff` | Überschriften stark | 14,39 | 17,06 | 19,11 | ja |
| `$body-text-color` | `#e8e6e3` | Fließtext (`body` in `components/_pages.scss`, Alias auf `$base05`) | 11,55 | 13,70 | 15,34 | ja |
| `$fg-muted` | Weiß 80 % | Fließtext auf Panels | 9,70 | 11,26 | 12,28 | ja |
| `$fg-subtle` | Weiß 55 % | Meta, Labels | 5,43 | 5,98 | 6,23 | ja (Untergrenze) |
| `$link-color` | `#05d9e8` | Interaktion, Item-Titel | 8,29 | 9,83 | 11,01 | ja |
| `$card-heading-color` | `#05d9e8` | Karten-Titel (Alias auf `$link-color`) | 8,29 | 9,83 | 11,01 | ja |
| `$link-color-active` | Cyan 75 % | Aktiver TOC-Eintrag, nicht fett | 5,28 | 6,04 | 6,48 | ja |
| `$link-color-rail` | Cyan 75 % | Aktives Rail-Segment | 5,28 | 6,04 | 6,48 | nein (Fläche) |
| `$border-accent` | Cyan 55 % | Karten-Akzentrand | 3,50 | 3,83 | 3,97 | nein (UI ≥ 3:1 erfüllt) |
| `$border-accent-hover` | Cyan 35 % | Karten-Rahmen Hover | – | – | – | nein |
| `$link-color-subtle` | Cyan 40 % | Linien, Flächen | 2,50 | 2,63 | 2,63 | **nein** |
| `$hover-color` | `#ff00ff` | Interaktions-Moment | 4,59 | 5,44 | 6,09 | ja (knapp) |
| `$hover-color-subtle` | `rgb(255 29 206 / 60%)` | Linien, Marker | 2,26 | 2,51 | 2,67 | **nein** |
| `$hover-color-text` | `#ff2fd2` | Magenta als Textfarbe (Hover, Active) | 4,51 | 5,35 | 5,46 | ja (knapp, dunkelster AA-Ton) |
| `$console-heading` | `#eacfb4` | Beige-Akzent | 9,65 | 11,44 | 12,82 | ja |
| `$selection-bg` / `$selection-text` | `#ff00ff` / `#000000` | `::selection` (Aliase auf `$hover-color` / `$black`) | – | – | – | ja |
| `$base0e` | `#ff79c6` | Syntax-Keywords | 6,03 | 7,15 | 8,01 | ja |

Das Theme-Token `$text-color` ist ein Alias auf `$body-text-color` (`#e8e6e3`, Owner-Entscheidung 6. 10. 2026). Theme und eigene Stellen nutzen damit ein Fast-Weiß, auch die Theme-Ableitung `$muted-text-color` geht davon aus. Maßgeblich ist der gerenderte Wert. Der Token-Kommentar in `_colors.scss` nennt für 75 % Cyan 5,30:1 (ungerundete Komposition), die Tabelle rechnet gerundet.

Flächen und Linien:

| Token | Wert | Rolle |
|---|---|---|
| `$console-panel-bg` | `#1a1c20` | Panel-Grund (dunkler als die Seite) |
| `$console-panel-bg-hover` | `#20242a` | Panel-Hover |
| `$console-panel-border` | Weiß 8 % (`$white-a08`) | Hairline, Panel-Rahmen |
| `$surface-tint` | Weiß 6 % (`$white-a06`) | dezente Aufhellung, Divider |
| `$background-dark` | `#1a1a1a` | nur Back-to-Top (Soll: in der Flächen-Skala aufgehen) |
| `$drawer-bg` | `#0f0f14` | Nav-Drawer, voll deckend |
| `$crt-screen-bg` | `#10141a` | Röhren-Schwarz der CRT-Seitenwechsel (`_view-transition.scss`) |
| `$ink` | `#0a0e12` | kühles Fast-Schwarz, nur über Stufen (`$ink-a35`, `-a45`, `-a55`: Hero-Buttons, Footer, Hero-Caption, Blog-Hinweis) |
| `$console-panel-bg-a96`, `-a98` | Panel-Ton 96 / 98 % | mobile TOC-Leisten |
| `$console-heading-a50` | Beige 50 % | Kapitel-Hairline (`section-break`), Motto-Linien |
| `$raised-bg-from`, `-to`, `-from-hover`, `-to-hover` | Grau 95 / 98 % | Verlauf der Fraktal-Erklärkarte |
| `$float-panel-bg`, `-strong` | `rgb(34 34 34 / 90%)`, `/ 95%` | schwebende Panels im Fraktal-Vollbild |
| `$hud-bg` | `rgb(8 10 14 / 78%)` | Mess-Chips über dem Fraktal-Canvas |
| `$inset-panel-bg` | `rgb(20 21 24 / 97%)` | Skill-Erklärfeld im CV |
| `$control-bg`, `-hover` | `#202329`, `#262a31` | Fraktal-Toolbar-Buttons |
| `$slider-track-bg`, `$slider-handle-bg`, `$slider-connect-blue` | `#111318`, `#1f2228`, `#4aa3ff` | noUiSlider (das Blau ist kein Palettenton, Audit B-F23) |
| `$cyan-pale`, `$red-pale` | `#d1f7ff`, `#ffd1d1` | Titel im Fraktal-Erklärtext, Fehlertext auf dem Canvas |
| `$gray-12` … `$gray-93` | `#1e1e1e` … `#eeeeee` (Zahl = HSL-Helligkeit) | Fraktal-Panel, CV-Nebentext, Offline-Seite |

Regeln:

- **FARB-1** [MUSS · Ist · CI] Farbliterale stehen nur in `variables/_colors.scss`. Komponenten-Tokens (`fractal-panel/_tokens.scss` und künftige) zeigen nur auf globale Tokens (SCSS-8), ein neuer Ton kommt zuerst als globales Token nach `_colors.scss`. Ausnahmen nur mit `farb-Ausnahme`-Marker (Effektwerte wie CRT-Phosphor, Neon-Flackern, Fraktal-Paletten als Daten): `// farb-Ausnahme: Grund` direkt über der (auch mehrzeiligen) Deklaration oder `// farb-Ausnahme: [Block] Grund` … `// farb-Ausnahme-Ende` um einen Effekt-Abschnitt, Liste per GOV-5. Die Neon-Custom-Properties in `variables/_css-properties.scss` sind Effektwerte unter `variables/` (Markenton offen, B-F09). Check: `scripts/color-guardrail.sh` (`assets/_sass` außerhalb von `variables/`).
- **FARB-2** [MUSS · Soll · CI-P2] Text erreicht 4,5:1, großer Text (ab 24 px oder ab 18,66 px fett) 3:1, UI-Grafik und Fokus 3:1, und zwar in **allen** Zuständen, gemessen auf dem tatsächlichen Grund. Jeder Kontrastwert in einem Token-Kommentar nennt seinen Grund („4,51:1 auf Drawer“). Die Textproben der Styleguide-Ansicht prüft `tests/visual/contrast.spec.js` schon in der CI, ein Token-Kontrast-Skript fehlt (16.2).
- **FARB-3** [MUSS · Soll · Review] Informationstragender Text nie unter `$fg-subtle` (55 %). Werte von 25 bis 40 % nur für rein dekorative Glyphen (z. B. Footer-Trenner).
- **FARB-4** [MUSS · Soll · Review] `-subtle`-Tokens sind für Linien, Marker und Flächen. Nie als Textfarbe, nie als einziges Erkennungsmerkmal eines Controls.
- **FARB-5** [MUSS · Ist · CI] Niemals ein Token mit eingebautem Alpha in `rgba()` geben. Sass ersetzt den Alpha-Kanal, multipliziert ihn nicht (Beispiel: `rgba($console-panel-border, 0.7)` wird zu 70 % Weiß). Check: `color-guardrail.sh`, auch über Aliase.
- **FARB-6** [MUSS · Ist · CI] Keine Ad-hoc-Abstufung `rgba($hover-color, 0.x)`. Benannte Abstufungen (`$magenta-aNN`) verwenden oder in `_colors.scss` neu anlegen (Owner-Regel vom 8. Juli 2026). Check: `color-guardrail.sh`, ohne Ausnahme-Marker.
- **FARB-7** [MUSS · Soll · Review] Fokus- und Hover-Zustand nehmen Vorder- und Hintergrund nie aus demselben Token.
- **FARB-8** [MUSS · Soll · CI-P1] Farb**literale** in der Notation `rgb(r g b / a%)`, Hex lang und klein, keine Farbnamen außer `transparent`, `currentColor`, `inherit`. Gilt auch für JS-Strings, Inline-Styles und das Critical-CSS. Sass-Funktionen auf Tokens (`rgba($link-color, 0.6)`) dürfen Dezimal-Alpha nutzen. In `assets/_sass` und im Critical-CSS erfüllt, in `assets/_sass` per `color-guardrail.sh` geprüft (Notation in `variables/`, Farbnamen überall). In JS offen nur `skill-graph.js` (Canvas-Farben als `rgba(r, g, b, a)`). Dort rendert Prozent-Alpha im Auswahlzustand um 1/255 anders, `rgb(r g b / a)` mit Dezimal-Alpha bleibt byte-gleich. Offen ist die Owner-Entscheidung, ob berechnete Canvas-Farben wie Sass-Funktionen Dezimal-Alpha nutzen dürfen. Systemfarben (`Canvas`, `CanvasText`, `Highlight`) stehen nur im Forced-Colors-Block (A11Y-6).
- **FARB-9** [SOLL · Ist · CI] Gleicher Wert = Alias, nie zweites Literal (`$card-heading-color: $link-color`, `$selection-bg: $hover-color`, `$base00: $console-panel-bg`). Der Guardrail meldet textgleiche Literale in `_colors.scss`. Wertgleiche in anderer Schreibweise (`#ffffff` gegen `rgb(255 255 255)`) fallen nur im Review auf.
- **FARB-10** [SOLL · Ist · Review] MM-Variablen, die die Palette beeinflussen, werden explizit gesetzt: `$primary-color`, `$background-color`, `$text-color`. Gesetzt sind `$primary-color: $link-color` (Rollen-Token in `_colors.scss`, Abnehmerliste im Kommentar), `$background-color: $page-bg` und `$text-color: $body-text-color` (Owner-Entscheidung 6. 10. 2026). Eigene Partials lesen `$body-text-color`, nicht `mm.$text-color`. Den Hover der Hamburger-Balken setzt `components/_masthead.scss` selbst auf volles Cyan `$link-color` (Owner, 6. 10. 2026, 8,29:1 auf dem Masthead), weil die Theme-Regel `mix(#000, $primary-color, 25 %)` die eigene Ruhe-Regel per Spezifität schlägt.

**[Ist]** Alpha-Stufen als Primitive. Jede Stufe heißt `$<familie>-aNN` (NN = Deckkraft in Prozent) und ist aus der **deckenden** Grundfarbe abgeleitet (FARB-5). Die Stufen bilden genau die Werte ab, die bei der Migration im Einsatz waren. Eine neue Stufe kommt nur dazu, wenn keine vorhandene passt.

| Familie | Grundfarbe | Stufen (NN) | Rollen-Aliase |
|---|---|---|---|
| `$cyan-aNN` | `$link-color` | 00 · 08 · 10 · 12 · 15 · 16 · 20 · 22 · 25 · 26 · 30 · 35 · 40 · 45 · 50 · 55 · 60 · 70 · 75 · 80 · 85 | `$link-color-subtle` = a40, `$border-accent` = a55, `$border-accent-hover` = a35, `$link-color-active` und `-rail` = a75 |
| `$magenta-aNN` | `$hover-color` | 08 · 15 · 18 · 20 · 22 · 30 · 35 · 55 · 75 | keine (nur Interaktions-Momente, DES-3) |
| `$white-aNN` | `$white` | 00 · 02 · 03 · 04 · 05 · 06 · 08 · 10 · 12 · 14 · 15 · 18 · 20 · 25 · 32 · 40 · 45 · 50 · 55 · 60 · 62 · 65 · 70 · 78 · 80 · 82 · 85 · 88 · 90 · 92 · 95 | `$fg-muted` = a80, `$fg-subtle` = a55, `$console-panel-border` = a08, `$surface-tint` = a06 |
| `$black-aNN` | `$black` | 10 · 20 · 25 · 30 · 35 · 40 · 45 · 50 · 55 · 60 · 70 · 75 · 78 · 94 | `$selection-text` = `$black` |
| `$ink-aNN` | `$ink` | 35 · 45 · 55 | keine |

**[Soll]** Rollen-Ebene nach W3C DTCG (Primitive → Rollen-Tokens): Komponenten nutzen Rollen statt Stufen, die Stufen schrumpfen auf eine kleine Skala. Zusammenlegen ändert Werte, ist also eine sichtbare Änderung, die der Owner nach Vorher-nachher-Vergleich freigibt (PROZ-1). Zielbild:

| Skala | Stufen |
|---|---|
| Weiß auf Dunkel | `$fg` 95 % · `$fg-muted` 80 % · `$fg-subtle` 55 % · `$line-strong` 15 % · `$surface-hover` 10 % · `$line` 8 % · `$surface-tint` 6 % |
| Cyan | Wash 10 % · Linie 40 % (`$link-color-subtle`) · Akzent 55 % (`$border-accent`) · Text-Aktiv ab 70 % |
| Flächen | Seite · Panel · Raised · Overlay / Drawer · Scrim · CRT-Grund (`$crt-screen-bg`) |

**[Offen]** Palettenfragen: Marken-Magenta (`#ff00ff` oder `#ff00cc`), zweites Marken-Cyan `#00ffff` im Neon, Status-Farben ja oder nein (Audit B-F09). Ob das Slider-Blau `$slider-connect-blue` (`#4aa3ff`, Audit B-F23) ein Palettenton wird oder in Cyan aufgeht. Komponenten-Tokens zeigen schon nur noch auf globale Tokens.

### 3.2 Typografie

Quelle `variables/_typography.scss`. Die Skala ist bewusst „cluster-treu“ zu den gewachsenen Werten. Die px-Spalte gilt bei 16 px Root-Größe. Das Critical-CSS setzt `html { font-size: 100% }`, die Browser-Einstellung der Besucher (Standard 16 px) gilt also, die Theme-Rampe 18/20/22 px bleibt bewusst aus (Owner-Freigabe 1. 10. 2026).

| Token | rem | px | Rolle |
|---|---|---|---|
| `$fs-label-xs` | `0.68` | 10,9 | nur dekorative oder redundante Mikro-Labels |
| `$fs-label` | `0.72` | 11,5 | Chrome-Label (`mono-label`-Default), Meta |
| `$fs-label-lg` | `0.78` | 12,5 | betonte Labels, CV-Daten |
| `$fs-ui` | `0.8` | 12,8 | kleine Buttons, Kontextzeilen, Hero-Caption |
| `$fs-body-sm` | `0.85` | 13,6 | Sekundär-Fließtext |
| `$fs-body` | `0.9` | 14,4 | Karten- und Panel-Fließtext |
| `$fs-body-lg` | `0.95` | 15,2 | Excerpts |
| `$fs-base` | `1` | 16 | Grundgröße |
| `$fs-title-sm` | `1.05` | 16,8 | Item-Titel |
| `$fs-md` | `1.125` | 18 | Lead, Intro |
| `$fs-heading-sm` | `1.2` | 19,2 | Panel-H3 (`accent-header`) |
| `$fs-title` | `1.25` | 20 | Karten-Titel |
| `$fs-heading` | `1.35` | 21,6 | Sektions-H2 |

Weitere bestehende Tokens:

| Token | Wert | Rolle | Einordnung |
|---|---|---|---|
| `$site-title-font-size` | `1.8em` | Seitentitel im Masthead | em-Ausnahme (TYP-2) |
| `$nav-font-size` | `1.0em` | Navigationslinks | em-Ausnahme (TYP-2) |
| `$cv-group-title-font-size`, `$cv-chip-font-size` | `1em` | Skill-Gruppen, Chips | em-Ausnahme (TYP-2) |
| `$medium-weight` | `600` | Gewicht für Titel | Name passt nicht zum Wert, Soll: `$fw-semibold` |
| `$sans-serif` | `"Ubuntu derivative auflinie"`, Ersatzschrift, `$system-font-stack` | Fließtext, Überschriften, Navigation | Familie, Schalter `$text-font` (TYP-13) |
| `$mono-font-stack` | System-Mono-Stack | Mono | Familie |

Fraktal-Panel (px, bewusst viewport-fix): `$fp-fs-2xs` 10 · `$fp-fs-xs` 11 · `$fp-fs-sm` 12 · `$fp-fs-md` 13 · `$fp-fs-lg` 14 · `$fp-fs-xl` 16 · `$fp-fs-icon` 20.

Semantische Aliase: `$toc-*`, `$cv-*` (zeigen auf `$fs-*` oder bewusst auf `1em`). Familien: Sans = `$sans-serif` (eigenes Token in `variables/_typography.scss`, TYP-13), Mono = `$mono-font-stack`.

Überschriften-Matrix (Ist, Quelle `base/_headings.scss`, `components/_hero.scss`, Theme):

| Ebene | Kontext | Größe | Gewicht | Farbe | Abstand |
|---|---|---|---|---|---|
| H1 | Hero `.page__title` | `2.5em`, ab 768 px `3.5em` (Hero-em-System) | Theme | Weiß | Hero-Layout |
| H2 | Markdown `.page__content > h2` | `$fs-heading` | `600` | Weiß 95 % | `section-break` oben, `margin-bottom: $space-5` |
| H3 | Markdown `.page__content > h3` | Theme `$h-size-3` (`1.125em`) | `600` | Weiß 92 % | Theme `2em 0 0.5em` |
| H4 | Markdown | Theme `$h-size-4` (`1.0625em`) | Theme `bold` | Theme | Theme `2em 0 0.5em` |
| Panel-H3 | Komponenten | `$fs-heading-sm` per `accent-header` | `600` | Weiß 95 % | Komponente |

**[Offen]** H4 ist heute schwerer als H3 (`bold` gegen `600`). Vorschlag: H4 `600`, Größe `$fs-base`, Farbe `$fg-muted`. Sichtbare Änderung, deshalb Owner-Entscheidung (TYP-5). H5 und H6 werden nicht verwendet.

Webfonts:

| Datei | Zweck | Laden |
|---|---|---|
| `assets/webfonts/fa-solid-900-subset.woff2`, `fa-regular-400-subset.woff2`, `fa-brands-400-subset.woff2` | Font-Awesome-Icons, auf genutzte Glyphen reduziert | sitewide über `base/_icons.scss` |
| `assets/webfonts/ubuntu-latin-wght.woff2` (28 KB), `ubuntu-latin-italic-wght.woff2` (30 KB) | Textschrift Ubuntu 0.869, variabel 400–700, Latin-Subset | aufrecht sitewide mit Preload, kursiv bei Bedarf, über `base/_fonts.scss` (TYP-13) |
| `assets/vendor/mathjax-newcm-font/chtml/` | MathJax-Formeln | nur auf Seiten mit `mathjax: true` |

Regeln:

- **TYP-1** [MUSS · Ist · CI] Jede `font-size` nutzt ein Token, auch in der Kurzschreibweise `font:`. px- und rem-Literale (auch ohne führende Null) nur mit `fs-Ausnahme` (CI: `scripts/fs-guardrail.sh`).
- **TYP-2** [MUSS · Soll · Review] em nur für Inline-Anpassungen im Kontext (Icons, `<code>`, Pseudo-Glyphen) und für diese dokumentierten em-Systeme: Hero-H1, TOC-Ebenen, Masthead (`$site-title-font-size`, `$nav-font-size`), CV-Skill-Gruppen und -Chips. Neue em-Systeme nur nach Eintrag in diese Liste.
- **TYP-3** [MUSS · Soll · Review] Funktionaler Text (Buttons, Formular-Labels, Hinweise, Daten) nie unter `$fs-label` (11,5 px). `$fs-label-xs` und `$fp-fs-2xs` nur für Deko. Bestand: R-54.
- **TYP-4** [MUSS · Soll · CI-P3] Kaskaden-Falle: Größen und Abstände auf `<p>`, `<li>`, `<dl>` innerhalb von `.page__content` brauchen Spezifität ab (0,1,1) und spätere Position. Muster: `.block p.block__text`. Kommentar mit Verweis auf die Theme-Regel. Gilt analog für Komponenten-Überschriften, die direkte Kinder von `.page__content` sind.
- **TYP-5** [MUSS · Ist · Review] Ein entdeckter toter Wert wird auf den **gerenderten** Wert festgeschrieben. Den ursprünglich gemeinten Wert scharfzuschalten braucht eine Owner-Freigabe mit Screenshot-Vergleich.
- **TYP-6** [MUSS · Soll · Review] Nach jeder Änderung an Typografie, Abständen oder Theme-Overrides läuft `scripts/cascade-check.py` gegen das gebaute CSS.
- **TYP-7** [MUSS · Ist · CI] `line-height` einheitenlos. `letter-spacing` in em und nur aus der Laufweiten-Skala `$tracking-meta` (0.03em), `$tracking-label` (0.06em), `$tracking-label-wide` (0.08em) in `variables/_typography.scss`, auch im Fraktal-Panel mit seinen px-Größen. Fließtext hat keine Laufweite. Ein neuer Wert braucht eine neue Skalenstufe mit Owner-Freigabe, kein Einzel-Token. Check: `scale-guardrail.sh` (Kategorie `tracking`, Grenze 0): Literale und jede Variable außer den drei Skalen-Tokens, in `letter-spacing` und in Argument und Default von `mono-label()`, lokale Variablen aufgelöst.
- **TYP-8** [SOLL · Ist · CI] Gewichte numerisch, kein `bold`. `500` nur bewusst (fällt bei vielen System-Fonts auf `400` zurück, die Ubuntu-Achse deckt es ab, TYP-13).
- **TYP-9** [SOLL · Soll · Review] Ziffern in Mono-Daten mit `font-variant-numeric: tabular-nums`.
- **TYP-10** [SOLL · Offen · Review] Fließtextspalte höchstens 75 Zeichen. `$content-width: 46rem` sind 736 px, das ergibt bei 16 bis 18 px Sans geschätzt 80 bis 90 Zeichen. Vor einer Festlegung wird gemessen. Danach wird entweder das Token (zum Beispiel in `ch`) oder die Regel angepasst. Blocksatz nur mit `hyphens: auto`, `lang` und linksbündig bis 480 px Breite (Home-Intro, Owner-Entscheidung).
- **TYP-11** [SOLL · Soll · Review] Überschriftengröße und -gewicht fallen monoton mit der Ebene. Abweichung: H4 ist schwerer als H3 (Überschriften-Matrix, Owner-Entscheidung offen).
- **TYP-12** [MUSS · Ist · Review] Einzige Webfonts sind die drei Font-Awesome-Subsets, die MathJax-NewCM-Fonts und die Textschrift (TYP-13). Ein neues Icon heißt: Icon-Klassen im gebauten `_site` inventarisieren, Subset mit `pyftsubset` neu erzeugen, Liste im Kopf von `base/_icons.scss` nachziehen, alles in einem Commit.
- **TYP-13** [MUSS · Ist · Review] Eine Textschrift für Fließtext, Überschriften und Navigation: Ubuntu, selbst gehostet (Owner-Entscheidung 1. 10. 2026). Sie kommt nur über `$sans-serif`, kein Partial und nicht das Critical-CSS setzt eine eigene Sans-Familie. Die Konsolenschrift `$mono-font-stack` bleibt davon unberührt. Schalter `text_font` in `_config.yml`: `ubuntu` (Standard) oder `system` (Systemschrift, dann weder `@font-face` noch Preload noch Precache). Dateien: zwei variable WOFF2 (aufrecht, kursiv), Gewichtsachse 400–700 deckt die genutzten Gewichte 400, 500, 600 und 700 exakt ab, Latin-Subset mit deutschen Zeichen, `font-display: swap`. Bis zum Laden steht eine metrisch angepasste Ersatzschrift (Arial bzw. Liberation Sans mit `size-adjust` und `ascent-override`). Quelle ist das Ubuntu-Paket `fonts-ubuntu` 0.869 von Canonical, erzeugt mit `scripts/ubuntu-font-subset.py` (gepinnte SHA-256). Weil ein Subset nach Ubuntu Font Licence 1.0 (2c) eine abgeleitete Fassung ist, heißt die Familie „Ubuntu derivative auflinie“. Lizenz liegt als `assets/webfonts/UBUNTU-FONT-LICENCE.txt` neben den Dateien. Neue Zeichen außerhalb des Subsets fallen auf die Systemschrift zurück. Wer sie braucht, erweitert `UNICODES` im Skript und `unicode-range` in `base/_fonts.scss` gemeinsam. Nach einem Wechsel des Schalters werden die Vergleichsbilder neu erzeugt.

**[Soll]** Gewichts-Tokens `$fw-regular` / `$fw-medium` / `$fw-semibold` / `$fw-bold` (`$medium-weight` wird zu `$fw-semibold` und entfällt). Zeilenhöhen `$lh-none` `1` · `$lh-tight` `1.2` · `$lh-snug` `1.35` · `$lh-body` `1.6`. `$monospace: $mono-font-stack` vor dem Theme-Import. **[Ist]** Laufweiten-Tokens (TYP-7). Ein einziger Sans-Stack, auch im Critical-CSS (TYP-13).

### 3.3 Abstände und Layout

Quelle `variables/_scales.scss` (Skala) und `variables/_layout.scss` (Breiten, Altbestand). Die Skala ist ein 4-px-Raster in rem, der Index nennt das Vielfache von 4 px bei 16 px Grundschrift.

| Token | rem | px | Token | rem | px |
|---|---|---|---|---|---|
| `$space-1` | `0.25` | 4 | `$space-6` | `1.5` | 24 |
| `$space-2` | `0.5` | 8 | `$space-8` | `2` | 32 |
| `$space-3` | `0.75` | 12 | `$space-10` | `2.5` | 40 |
| `$space-4` | `1` | 16 | `$space-12` | `3` | 48 |
| `$space-5` | `1.25` | 20 | `$space-16` | `4` | 64 |

Fraktal-Panel (px, viewport-fix wie `$fp-fs-*`, 2-px-Raster mit Halbschritten, Owner 1. 10. 2026): `$fp-space-0-5` 2 · `$fp-space-1` 4 · `$fp-space-1-5` 6 · `$fp-space-2` 8 · `$fp-space-2-5` 10 · `$fp-space-3` 12 · `$fp-space-3-5` 14 · `$fp-space-4` 16 · `$fp-space-5` 20.

Rechnungen aus Tokens sind Skalenwerte, z. B. die TOC-Einrückung `$space-4 + n * $space-2` je Ebene.

| Token | Wert | Rolle |
|---|---|---|
| `$section-spacing` | `2em` | Sektionsabstand (Altbestand, em-Ausnahme bis zur Migration) |
| `$small-spacing` | `0.5em` | kleiner Abstand (Altbestand, em-Ausnahme bis zur Migration) |
| `$content-width` | `46rem` | Content-Spalte (siehe TYP-10) |
| `$drawer-width` | `180px` | Drawer-Breite und Overlay-Aussparung |
| `$graph-sheet-width` | `1100px` | Skill-Graph-Sheet am Desktop (darunter `94vw`, mobil volle Breite). Breiter als die Lesespalte, weil waagerechte Labels Breite brauchen. Lässt bei 1280 px je 90 px Scrim sichtbar |
| `$space-section-break`, `-inner`, `-narrow`, `-inner-narrow` | `3.2rem` / `2.4rem`, bis 640 px `2.4rem` / `1.8rem` | Kapitelgrenze (`section-break`-Mixin), abgenommen, benannte Sonderwerte neben dem Raster |
| `--masthead-height` | `74px`, ab 768 px `88px` | Laufzeit |
| `--sticky-toc-height` | per JS, nur an Elementen mit `data-sticky-toc-offset` | Laufzeit (CV-Auswahl-Konsole) |
| `--anchor-offset` | Masthead + `20px` | Anker-Offset ohne Sticky-TOC, deren Höhe addiert `toc.js` inline am `scroll-padding-top` (PERF-6) |

- **SP-1** [SOLL · Soll · CI] Neue Abstände nur aus der Skala. Bestehende Werte bei Berührung migrieren. `scripts/scale-guardrail.sh` lässt die Zahl der Abstands-Literale außerhalb von `variables/` nicht steigen (Ratchet, Rest im Register R-35). Ein Literal in einer lokalen Sass-Variablen (`$lokal: 13px`) zählt dort, wo es als Abstand landet.
- **SP-2** [MUSS · Soll · Review] Einheit nach Kontext: Content rem, Hero, Masthead und TOC em (die em-Systeme tragen `skala-Ausnahme`-Marker), Fraktal-Panel px, Hairlines und Schatten px. Feste Chrome-Maße in px: `--masthead-height`, `$drawer-width` und davon abgeleitete Breakpoints (SP-4). `$section-spacing` und `$small-spacing` bleiben em, bis sie in der Skala aufgehen. Ein px-Literal wird nie still durch ein rem-Token ersetzt: Bei 16 px Grundschrift sieht beides gleich aus, bei größerer Browser-Schrift nicht.
- **SP-3** [MUSS · Soll · Review] Komponenten-Geometrie (Radius, Full-Bleed) lebt in der Komponente. Layout-Dateien setzen nur Container-Padding und -Breite.
- **SP-4** [MUSS · Soll · Review] Gekoppelte Werte werden abgeleitet oder per Custom Property gelesen, nicht als zweites Literal gepflegt (Beispiel: Drawer-Breakpoint = `$drawer-width / 0.75`).

### 3.4 Breakpoints

**[Ist]** Token-Set in `variables/_layout.scss`, als Map `$breakpoints` für die Mixins in `abstracts/_breakpoints.scss`. Jeder Wert ist die erste Breite des größeren Bereichs. Die Theme-Variablen `$small`, `$medium`, `$medium-wide`, `$large` und `$x-large` zeigen auf dieselben Tokens, Theme und eigener Code teilen also eine Skala.

| Token | Map-Schlüssel | Wert | Einsatz |
|---|---|---|---|
| `$bp-drawer` | `drawer` | `240px` (`$drawer-width / 0.75`, SP-4) | Overlay neben dem Drawer |
| `$bp-xs` | `xs` | `480px` | Startseite, Fraktal-Steuerung |
| `$bp-fp-columns` | `fp-columns` | `500px` | Fraktal-Hilfe, Spalten nebeneinander |
| `$bp-toast` | `toast` | `576px` (vorher `36em`) | Update-Hinweis rechtsbündig |
| `$bp-sm` | `sm` | `600px` (Theme `$small`) | Fraktal-Canvas |
| `$bp-content` | `content` | `640px` | CV, Skill-Graph, `section-break` |
| `$bp-md` | `md` | `768px` (Theme `$medium`) | mobil darunter, Desktop ab hier |
| `$bp-md-wide` | `md-wide` | `900px` (Theme `$medium-wide`) | Fraktal-Steuerung |
| `$bp-lg` | `lg` | `1024px` (Theme `$large`) | TOC als Seitenleiste, Autor-Links inline, Masthead-Tablet bis hier |
| `$bp-xl` | `xl` | `1280px` (Theme `$x-large`) | Navigation (Neumessung) |

Höhen-Grenzen stehen getrennt in der Map `$breakpoints-height` und laufen nur über `down-height()` (`@media (max-height: Wert − 0.02px)`):

| Token | Map-Schlüssel | Wert | Einsatz |
|---|---|---|---|
| `$bp-height-short` | `short` | `640px` | Skill-Graph-Sheet in flachen Fenstern (Telefon quer, 1024×600): fast volle Höhe, Info-Leiste zweizeilig |

```scss
@use "abstracts/breakpoints" as *;

.block {
  @include down(md) { … }          // @media (max-width: 767.98px)
  @include up(md) { … }            // @media (min-width: 768px)
  @include between(md, lg) { … }   // @media (min-width: 768px) and (max-width: 1023.98px)
}

.link {
  @include can-hover { &:hover { … } }   // @media (hover: hover), nur echte Zeiger (BP-3)
  @include no-hover { &:hover { … } }    // @media (hover: none), nur Ruhewerte gegen Theme-Hover
  &:focus-visible { … }                  // Fokus nie in der Hover-Weiche
}
```

- **BP-1** [MUSS · Ist · CI] Bereiche sind halboffen: `up(x)` ab dem Wert, `down(x)` bis Wert minus `0.02px`, `between(x, y)` dazwischen. Eigene `@media`-Zeilen mit Breite oder Zahl gibt es nur in `abstracts/_breakpoints.scss`, eine neue Grenze kommt zuerst als `$bp-…` in die Tabelle. Das Theme-Mixin `breakpoint()` ist im eigenen Code gesperrt. Check: `scripts/bp-guardrail.sh` (SCSS samt berechneter Tokens, alle Templates samt Critical-CSS).
- **BP-2** [MUSS · Ist · CI] JS fragt Breiten nur über `window.AuflinieUtils.mq` ab (`downMd`, `downLg`, `downXl`, `MediaQueryList` aus `site-utils.js`), mit Fallback ohne Zahl, falls `site-utils.js` fehlt. Kein Lesen der Viewport-Breite (`innerWidth`, `documentElement.clientWidth`, `screen.width` …), kein eigenes `matchMedia()` mit Breite oder mit einem Argument, das kein Literal ist. Wer die Breite für etwas anderes als eine Layout-Weiche braucht, setzt `// bp-Ausnahme: <Grund>` darüber. Ausnahme von JS-8: Die Abfragen stehen als Literal in `site-utils.js`, weil eine Media-Query kein `var()` liest. Check: `bp-guardrail.sh` (Literale gegen die Tokens, Breiten-Abfragen in anderen Skripten).
- **BP-3** [MUSS · Ist · CI] Interaktion per Fähigkeit, Layout per Breite: Hover-Stile in `@media (hover: hover)`, Zielgrößen in `@media (pointer: coarse)`, weil Touch-Browser `:hover` nach dem Antippen festhalten. Eigene `:hover`-Regeln stehen in `@include can-hover { … }` aus `abstracts/_breakpoints.scss` (die rohe Query bleibt erlaubt). Zielgrößen stehen in `@include coarse-pointer { … }` aus derselben Datei, das Trefferpolster liefert `touch-target-pad` (`abstracts/_mixins.scss`, 6.1). Kombinierte Selektoren wie `a:hover, a:focus` werden geteilt, der Fokus-Teil steht nie in der Weiche. Gegen jede Theme-Hover-Regel, die auf einem sichtbaren Element greift, setzt `@include no-hover { … }` (`@media (hover: none)`) unter `:hover` nur die Ruhewerte. Die Grundregel für Links im Inhalt (`base/_links.scss`) hat per `:where()` genau die Spezifität des Theme-`a:hover` und lädt vor den Komponenten, besuchte Links behalten dort `$link-color-visited`. Eine Gegenregel, die für jede Eingabeart gilt, trägt `// bp-Ausnahme: BP-3, <Grund>` direkt über der ersten Selektorzeile. Check: `scripts/bp-guardrail.sh` (Klasse 5) und der Touch-Test in `tests/visual/invariants.spec.js`. Rest im Theme: R-79.
- **BP-4** [SOLL · Soll · Review] Neue Regeln mobile-first (`up()`). Der Bestand nutzt noch überwiegend `down()` (R-80), er wird bei Berührung umgedreht, unter Beachtung von BP-6.
- **BP-5** [MUSS · Ist · CI] Prefix-Notation (`min-width`/`max-width`), keine Range-Syntax, solange `.stylelintrc.json` das festlegt (`media-feature-range-notation: prefix`). Grund: Range-Syntax erst ab iOS Safari 16.4.
- **BP-6** [MUSS · Ist · Review] Gate-Paare aus CSS und JS werden nur gemeinsam im selben Commit geändert. Heute: (a) `@view-transition` in `_view-transition.scss` (seit dem Ausbau der SPA-Navigation ohne Reduced-Motion-Gate, ARCH-2) und der Klick-Handler der Drawer-Links in `greedy-navigation.js` (schließt den Drawer selbst, wenn `PageSwapEvent` fehlt). (b) Mobil-Gate für das CRT-Umschalten: `AuflinieUtils.mq.downMd` in `tv-switch.js` und `down(md)` beim Vollbild-Hero (`_hero.scss` und Critical-CSS in `_layouts/default.html`). Weitere Paare an derselben Grenze: Sticky-TOC (`toc.js` `downLg`, `_toc.scss` `down(lg)`), Zoom-Knöpfe im Fraktal-Panel (`fractal-panel.js` `downMd`, `fractal-panel/*.scss` `down(md)`).

Einheit: Repo-SCSS und JS in px. Das Theme kompiliert seine eigenen Queries aus denselben Tokens in em (`48em` = `768px` bei 16 px Grundgröße). **[Offen]** Ob alle Queries in em laufen sollen, damit sie mit der Browser-Schriftgröße mitwachsen (Owner).

### 3.5 Ebenen (z-index)

Globale Ebenen als Tokens in `variables/_scales.scss`, aufsteigend. Werte und Reihenfolge sind exakt aus dem Bestand übernommen. Gleich hohe Ebenen sind gewollt gleich hoch, dort entscheidet die DOM-Reihenfolge.

| Token | Wert | Element |
|---|---|---|
| `$z-toc-overlay` | `997` | Scrim hinter dem aufgeklappten Sticky-TOC |
| `$z-toc-sticky` | `998` | mitlaufende TOC-Leiste (mobil) |
| `$z-scrim` | `998` | Drawer-Dimmer `body::before` |
| `$z-float` | `999` | Back-to-Top |
| `$z-drawer` | `999` | Drawer-Liste, wirkt im Stacking-Kontext des Mastheads |
| `$z-masthead` | `1000` | Masthead |
| `$z-drawer-toggle` | `1010` | Burger / X, im Masthead über der Drawer-Liste |
| `$z-sheet` | `1100` | Skill-Graph-Ebene (Scrim) |
| `$z-sheet-panel` | `$z-sheet + 10` | Skill-Graph-Sheet |
| `$z-offline` | `$z-toast - 1` | Offline-Hinweis |
| `$z-toast` | `10020` | Service-Worker-Toast |

`#main { isolation: isolate }` (`layouts/_pages.scss`) erzeugt einen Stacking-Kontext auf `#main`. Was darin fixiert ist (Sticky-TOC, Back-to-Top), konkurriert nicht mit den Ebenen außerhalb. Das ist gewollt, beide sollen unter Masthead und Drawer liegen. Der Blog-Hinweis ist seit 3. 10. 2026 ein natives `<dialog>` im Top Layer (Owner-Entscheidung, früher R-10).

- **Z-1** [MUSS · Ist · Review] Modale öffnen als natives `<dialog>` per `showModal()` (Top Layer, Vorbild `blog-notice.js`), Toasts und app-weite Floats werden am `<body>` gemountet (Vorbild `sw-register.js`), nie innerhalb von `#main`. Seitengebundene Floats, die unter Masthead und Drawer liegen sollen (Sticky-TOC, Back-to-Top), dürfen in `#main` bleiben. Der Stacking-Kontext von `#main` bleibt (Owner-Entscheidung 3. 10. 2026), gesetzt über `isolation: isolate`.
- **Z-2** [MUSS · Ist · Review] Lokale Stapel 0 bis 10 nur in Containern mit `isolation: isolate` und mit Skalen-Kopfkommentar. Vorbild: Skala im Kopf von `components/_fractal-panel.scss`, `isolation: isolate` in `components/fractal-panel/_canvas.scss`. Die Werte stehen als benannte Variablen am Dateikopf (`$hero-z-*`, `$fp-z-*`, `$cv-z-*`, `$masthead-z-*`, `$graph-z-touch-hint`) unter einem `skala-Ausnahme`-Marker. Größer als 10 sind der Hero-Stapel (`15`, `25`, `100`, `101`) und die Vollbild-Ebenen des Fraktal-Panels (`200`, `250`, `300`), dort trägt die Reihenfolge, nicht der Wert.
- **Z-3** [SOLL · Ist · CI] Globale Ebenen nur über die `$z-*`-Tokens, als einzelne Variablen statt Map (ein Tippfehler bricht so den Build ab). Check: Skalen-Guardrail (Ratchet für z-index-Literale).

### 3.6 Radien und Schatten

Quelle `variables/_scales.scss`.

| Token | Wert | Einsatz |
|---|---|---|
| `$radius-xs` | `2px` | Mini-Marker, Regler-Spur |
| `$radius-sm` | `4px` | Chips, kleine Flächen. Theme-`$border-radius` zeigt darauf |
| `$radius-md` | `6px` | Buttons, Code, Eingaben |
| `$radius-lg` | `8px` | Karten, Standard von `card-panel()` |
| `$radius-xl` | `12px` | große Panels |
| `$radius-2xl` | `16px` | Bottom-Sheet |
| `$radius-pill` | `999px` | Pillen |
| `$radius-circle` | `50%` | Kreise |
| `$shadow-1` | `0 1px 3px $black-a20` | knapp abgehoben |
| `$shadow-2` | `0 4px 12px $black-a30` | schwebende Leisten, Menüs |
| `$shadow-3` | `0 10px 30px $black-a40` | Toasts, Dialoge |
| `$shadow-pressed` | `0 0 1px $black-a20` | gedrückt, liegt fast auf |
| `$shadow-masthead` | `0 2px 10px $black-a30` | Masthead |
| `$shadow-drawer` | `-4px 0 20px $black-a40` | Drawer, fällt nach links |
| `$shadow-sheet` | `0 -20px 60px -30px $black` | Bottom-Sheet, fällt nach oben |
| `$shadow-sheet-float` | `0 -4px 24px $black-a50` | Erklärbox im Fraktal-Vollbild, fällt nach oben |

Ringe (ohne Blur) und Glows (nur Interaktions-Momente und Hinweise, nur auf Farb-Tokens) sind eigene Familien. Benannt wird nach Rolle, die Werte sind kalibriert und bleiben exakt:

| Token | Wert | Einsatz |
|---|---|---|
| `$shadow-focus-ring` | `0 0 0 4px $magenta-a30` | Fokus-Hof um Buttons |
| `$shadow-ring-focus-soft` | `0 0 0 4px $magenta-a20` | Fokus-Hof um Kontakt-Karten |
| `$shadow-ring-cyan`, `-strong`, `-soft` | `0 0 0 3px` mit `$cyan-a30`, `-a40`, `-a15` | Fokus Back-to-Top, Tasten, Auswahlfeld |
| `$shadow-ring-hairline`, `-inset` | `0 0 0 1px` | Haarlinie statt `border` (Archiv-Hover, Canvas-Rahmen) |
| `$glow-dot`, `$glow-selected`, `$glow-focus`, `$glow-hover`, `$glow-open` | `0 0 6px` bis `0 0 15px` | Timeline-Punkt, ausgewählter Chip (Magenta), Regler-Fokus, Hover, aufgeklappt |
| `$glow-halo` | drei Lagen 12/24/36 px | Back-to-Top im Hover |
| `$shadow-key-*`, `$glow-key*` | Kante `0 2px 0`, Licht `inset 0 1px 0`, Glimmen `0 0 8px` | Keycaps im Fraktal-Panel, kombiniert als Liste |

Neon- und CRT-Glows sind Effektwerte (MO-4) und tragen Ausnahme-Marker.

- **RAD-1** [SOLL · Ist · CI] Radien und Schatten nur aus diesen Tokens. Check: Skalen-Guardrail (Grenzwert 0, auch über lokale Variablen).

### 3.7 Motion

Quelle `variables/_scales.scss`. UI-Skala in ms (Bandbreite nach NN/g 100 bis 500 ms). Sass-Tokens, weil sie ins CSS kompiliert werden. Braucht JS eine Dauer, stellt eine Custom Property sie bereit (MO-5).

| Token | Wert | Einsatz |
|---|---|---|
| `$duration-instant` | `100ms` | Druck, Farbe |
| `$duration-fast` | `150ms` | kleine Zustandswechsel |
| `$duration-base` | `200ms` | Hover, Fokus |
| `$duration-moderate` | `300ms` | Toast, Overlay, Karten-Lift (`$standard-transition` zeigt darauf) |
| `$duration-slow` | `400ms` | große Flächen |
| `$duration-slower` | `500ms` | Obergrenze für UI |
| `$ease-standard` | `cubic-bezier(0.4, 0, 0.2, 1)` | Bewegung im Viewport |
| `$ease-decelerate` | `cubic-bezier(0.215, 0.61, 0.355, 1)` | Einblenden |
| `$ease-accelerate` | `cubic-bezier(0.4, 0, 1, 1)` | Ausblenden |

Die CSS-Schlüsselwörter `ease`, `ease-out` und `linear` bleiben erlaubt.

- **MO-1** [MUSS · Ist · CI] Kein `transition: all`, kein implizites `transition: 0.3s`. Properties explizit nennen, bevorzugt nur `transform` und `opacity`. Das Theme-`$global-transition` setzt `_theme-bridge.scss` vor dem Theme-Import auf `color`, `background-color`, `border-color` und `opacity` mit `$duration-base` und `ease-in-out` (ARCH-3). Check: Skalen-Guardrail.
- **MO-2** [MUSS · Ist · CI] Eine Zeiteinheit (ms) für neue Deklarationen, Dauern aus der Skala. Check: Skalen-Guardrail (Zeit- und `cubic-bezier()`-Literale, Grenzwert 0). Hinweis- und Ambient-Animationen über 500 ms (Scroll-Hinweis, Power-Puls, Aufglimmen, Lade-Puls) tragen einen `skala-Ausnahme`-Marker wie die Choreografien (MO-4).
- **MO-3** [SOLL · Soll · Review] Einblenden verzögernd, Ausblenden beschleunigend und kürzer. Ausblenden mit Visibility-Delay (`visibility 0s linear <dauer>`).
- **MO-4** [MUSS · Ist · Review] Choreografien stehen außerhalb der UI-Skala und behalten benannte lokale Variablen am Dateikopf: View Transition, CRT, Neon, Logo-Flackern **und der Drawer**. Ihre Literale tragen `skala-Ausnahme`-Marker statt UI-Tokens, damit ein gleicher Zahlenwert sie nicht an die UI-Skala koppelt. Die Drawer-Werte sind abgenommen und gekoppelt: VT-Exit `vt-drawer-exit` (`200ms`) und `$crt-drawer-offset` in `_view-transition.scss`, Slide `0.3s` / `0.24s` in `_masthead.scss`, Fallback-Timer in `greedy-navigation.js` (`320` nach dem Slide-Out, `360` für `inert` nach dem Slide-In). Sie werden nur gemeinsam geändert.
- **MO-5** [SOLL · Soll · Review] CSS ist die Quelle für Dauern. JS liest Custom Properties über einen gemeinsamen Helfer (s- und ms-fähig, Vorbild `hero-crt.js` `readHeroCrtFlashDurationMs`, Ziel `cssDurationMs` in `site-utils.js`, siehe JS-18). Fallbacks gleichen dem Token exakt. Wird MUSS, sobald der Helfer existiert.
- **MO-6** [MUSS · Ist · Review] `transitionend` und `animationend` filtern auf `target` und `propertyName` bzw. `animationName`. Vorbilder: `greedy-navigation.js` (`onSlideEnd`, `onOpenEnd`), `hero-crt.js` (`onAnimationEnd`, Power-Hinweis), `toc.js` (`onOpenEnd`).
- **MO-7** [SOLL · Soll · Review] Hover-Lift höchstens zwei Stufen (Buttons `-2px`, Karten `-3px`). Erfüllt in `_buttons.scss` (`-2px`), Beitrags- und Kontakt-Karten (`-3px`). Offen: `.entries-grid .archive__item:hover` nutzt noch `$hover-transform` (`-5px`) auf der Startseite.

---

## 4 Komponenten und Mixins

Quelle `abstracts/_mixins.scss`, geladen mit `@use "abstracts/mixins" as *;`. Ein Mixin ist Pflicht, sobald sein Look zutrifft. Handnachbauten sind ein Review-Blocker.

| Mixin | Wann | Hinweis |
|---|---|---|
| `card-panel($accent: 2px, $radius: $radius-lg)` | jede Fläche mit Panel-Ton und Hairline | `$accent: 0` ohne Cyan-Rand. Hover pro Komponente. |
| `section-break` | Kapitelgrenze (Sektions-H2) | Beige-Hairline oben, viel Luft |
| `accent-header($size: $fs-heading, $rule: true)` | Sektions- und Panel-Überschriften | Markdown-H2: `accent-header($fs-heading, false)` plus `section-break` |
| `mono-label($size: $fs-label, $tracking: $tracking-label)` | Chrome-Labels (Mono, Versalien) | Laufweite `$tracking-label` (Default) oder `$tracking-label-wide`, nur Skalen-Tokens (TYP-7, CI) |
| `btn-role-primary` | primäre Aktion | getöntes Cyan |
| `btn-role-outline` | sekundäre Aktion | Cyan-subtle-Rand |
| `backdrop-blur($px)` | jeder Blur | einzige erlaubte Quelle für `backdrop-filter` |
| `touch-target-pad` | Menü-Knopf und Buttons (`.btn`) | Trefferfläche unter `(pointer: coarse)` unsichtbar auf `$touch-target-min` (44 px), Optik und Layout gleich. Braucht ein freies `::after` und kein absolut positioniertes Element (6.1) |
| `focus-ring($offset: 2px)` | jeder Magenta-Fokusring an `:focus-visible` | KOMP-4, `-2px` in Scroll-Containern, `-3px` in der Navigation |
| `hover-effect($transform-value: -5px)` | Altbestand | einziger Aufruf `hover-effect(-3px)` in `_about.scss` (MO-7 erfüllt). **[Soll]** Default und das ungenutzte `$hover-transform` (`-5px`, `variables/_layout.scss`) entfernen |

Buttons:

| Rolle | Umsetzung | Kontext |
|---|---|---|
| Primär | `.btn--primary` → `btn-role-primary` | höchstens einer pro Ansicht |
| Outline | `.btn--outline` → `btn-role-outline` | sekundäre Aktionen |
| Light-Outline | `.page__hero--overlay .btn--light-outline` | Hero-Actions, weiß gerahmt (DES-6) |
| Keycap | Fraktal-Toolbar | nur im Fraktal-Panel |

- **KOMP-1** [MUSS · Ist · CI] Zustandsmatrix für jedes interaktive Element: Ruhe · Hover in `(hover: hover)` · `:focus-visible` mit dem globalen Magenta-Ring · Pressed · Ausgewählt (`aria-pressed`, `aria-current`, `.is-active`) · Disabled. Ablage: Styleguide-Ansicht (SG-1 bis SG-3), Check: Screenshot-Vergleich der erzwungenen Zustände.
- **KOMP-2** [MUSS · Ist · Review] Kein `:focus` als Stil-Selektor außer in Resets der Form `:focus:not(:focus-visible)` (global in `base/_accessibility.scss`, lokal beim Back-to-Top gegen den Hover-Schein nach dem Klick). Sonst bleibt der Fokus-Stil nach Klick oder Tipp stehen. Eingabefelder behalten ihn beim Klick, weil `:focus-visible` bei Textfeldern auch für Zeiger greift. Tom Select hängt an seiner Klasse `.focus`.
- **KOMP-3** [MUSS · Ist · Review] Hover-Farbsemantik (Owner, 1. 10. 2026): Navigations-Textlinks (Masthead, Drawer, TOC) hovern in `$hover-color-text` (`#ff2fd2`, dunkelster Ton desselben Magentas mit 4,5:1). `$hover-color-subtle` bleibt Linien und Flächen vorbehalten (FARB-4). Buttons, Karten, Chips hovern über die Cyan-Rahmenstufe. Der Cyan-Hover-Grund der Masthead- und Drawer-Links (`$cyan-a10`) bleibt (Owner, nie ungefragt entfernen). Die TOC-Links hovern ohne Grund. **Dokumentierte Ausnahme (Owner, 1. 10. 2026):** Auf dem Cyan-Grund erreicht `$hover-color-text` nur 3,68:1. Das gilt ausschließlich im kurzen Hover-Moment, der Ruhezustand ist weiß. Der hellere AA-Ton `#ff63dd` wurde verworfen. Neue Stellen übernehmen die Ausnahme nicht, sie gilt nur für Masthead und Drawer.
- **KOMP-3a** [MUSS · Ist · Review] Navigations-Fokus ist ein Rahmen, keine Füllung: `outline: 2px solid $hover-color; outline-offset: -3px` (die Nav-Container clippen). Füllung plus gleichfarbiger Text ergab 1,49:1 (FARB-7).
- **KOMP-4** [SOLL · Ist · Review] Fokus-Ring als Mixin `focus-ring($offset: 2px)`: `outline: 2px solid $hover-color; outline-offset: 2px`, in Scroll-Containern `-2px`, in clippenden Nav-Leisten `-3px` (KOMP-3a). Nur an `:focus-visible` (KOMP-2). Ausgeschrieben bleiben die globalen Ringe in `base/_accessibility.scss`: Das Modul lädt vor `abstracts/mixins`, ein `@use` darauf verschöbe den Platzhalter `%section-base` in der Kaskade.
- **KOMP-5** [MUSS · Ist · Review] Discovery-Hinweise laufen einmalig, sind bewegungs-gegatet und entfernen ihre Klasse bei gefiltertem `animationend`. Der Power-Hinweis im Hero filtert auf Ziel und `animationName`. Der Touch-Hinweis im Skill-Graph-Sheet ist keine Animation und blendet per Timer aus.
- **KOMP-6** [DARF NICHT · Ist · Review] Kein `backdrop-filter` auf dem Drawer. Er ist hinter seinem opaken Grund unsichtbar und rastert jeden Frame über dem animierten Hero neu (Owner-Lehre aus der TV-Umschalt-Architektur).

### 4.1 Icons und Marke

- **ICON-1** [MUSS · Ist · Review] Icons nur aus dem Font-Awesome-Subset (TYP-12) oder als Inline-SVG. Keine Icon-CDNs.
- **ICON-2** [SOLL · Soll · Review] Icon-Größen relativ zum Text: `1em` im Fließtext, `0.85em` in Überschriften (`accent-header`), `0.75em` für das Symbol hinter externen Links (`$fs-icon-external`, LINK-3), feste px nur im Fraktal-Panel (`$fp-fs-icon`).
- **ICON-3** [MUSS · Soll · Review] Dekorative Icons tragen `aria-hidden="true"` (A11Y-3). Ein Icon ohne Text braucht einen zugänglichen Namen am Button oder Link.
- **ICON-4** [MUSS · Ist · Review] Das Logo kommt aus `_includes/logo.svg` und `_includes/logo-roehren.svg` (Magenta-Konturen, flackern, PERF-7), beide inline und deckungsgleich im Masthead. Wer das Logo tauscht, teilt es wieder so auf. Die Neon-Wortmarke ist Marke und darf Magenta tragen (DES-3).
- **[Offen]** Mindestgröße und Schutzraum der Wortmarke, Marken-Magenta (3.1), Umgang mit `assets/images/Logo.svg` (Dateiname verletzt NAME-1, R-71).

### 4.2 Links

- **LINK-1** [MUSS · Soll · Review] Linktext beschreibt das Ziel ohne Umgebung (WCAG 2.4.4). Kein „hier“, kein „mehr“ ohne Kontext.
- **LINK-2** [MUSS · Soll · Review] Links im Fließtext sind unterstrichen oder anders als nur über Farbe erkennbar. Cyan hat zum Body-Text nur 1,39:1, Farbe allein reicht nicht (WCAG 1.4.1). Ist-Zustand im Audit prüfen.
- **LINK-3** [MUSS · Ist · CI] Externe Links öffnen in einem neuen Tab (Owner-Entscheidung 4. 10. 2026). Extern heißt: anderer Host, oder derselbe Host außerhalb von `baseurl`. `_plugins/external-links.rb` setzt beim Build in jeder HTML-Seite `target="_blank"`, `rel="noopener noreferrer"` (vorhandene `rel`-Werte bleiben), ein Symbol ohne Umbruch davor (`components/_ext-link-icon.scss`, `$fs-icon-external`) und den Hinweis „öffnet in neuem Tab“ als `.visually-hidden`-Text oder im vorhandenen `aria-label`. Links werden ohne Zusatz geschrieben, kein handgeschriebenes `target`. Interne Links, Anker, `mailto:` und `tel:` bleiben im selben Tab, ein handgeschriebenes `target="_blank"` bekommt auch intern `rel` und Hinweis. Check: `csp-check.py` (`target="_blank"` ohne `noopener`), `tests/visual/links.spec.js`.
- **LINK-4** [MUSS · Ist · Review] Interne Links nach LIQ-3.

### 4.3 Formulare und Eingaben

Betrifft Blog-Suche, Fraktal-Selects und -Slider (noUiSlider), Tom-Select.

- **FORM-1** [MUSS · Soll · Review] Jedes Feld hat ein sichtbares `<label>` oder ein programmatisch verknüpftes Label. Placeholder ersetzt kein Label.
- **FORM-2** [MUSS · Soll · Review] Ergebnisse und Statuswechsel (Trefferzahl der Suche, Berechnung läuft) werden über eine Live-Region angesagt (WCAG 4.1.3).
- **FORM-3** [MUSS · Ist · Review] Slider und Vendor-Widgets sind benannt (noUiSlider `handleAttributes`) und per Tastatur bedienbar. Umsetzung: `fractal-panel.js` (`sliderHandleAttributes`) übernimmt den sichtbaren Text des Zeilen-Labels ohne Doppelpunkt als `aria-label` des Griffs (2.5.3). Das `<label>` selbst gehört zum Zahlenfeld daneben.
- **FORM-4** [SOLL · Soll · Review] Fehl- und Hinweistexte sagen, was zu tun ist, nicht was schiefging (Beispiel 7.4).
- **FORM-5** [MUSS · Soll · Review] Dropdowns (Tom-Select, TOC) erfüllen WCAG 1.4.13: Inhalt per Escape schließbar, mit der Maus erreichbar, bleibt sichtbar, bis er verlassen wird.

### 4.4 Overlays und Gesten

Anlass: Im Skill-Graphen rutschte die Seite beim Wischen über den Graphen weg (Owner, 1. 10. 2026). Seither ist das Sheet modal.

**Hinweis:** Seit der Skill-Graph-Überarbeitung (Owner-Freigabe 2. 10. 2026) hat der Graph Zoom per Pinch, Mausrad und Knöpfen, wird beim Öffnen eingepasst und zentriert eine Auswahl **nicht** automatisch (der Graph bewegt sich nicht von selbst).

- **OVL-1** [MUSS · Ist · Review] **Gestenhoheit.** Eine Fläche, die wie ein eigenes Objekt aussieht (Canvas, Karte, Sheet, Dialog), besitzt ihre Gesten. Wischen, Mausrad und Ziehen werden nie unbemerkt an die Seite dahinter durchgereicht. Umsetzung: `touch-action: none` auf der Fläche, nicht-passive `wheel`- und `touchstart`-Handler, `overscroll-behavior: contain` bei scrollbaren Overlays. Ausnahme: Inline im Lesefluss eingebettete Flächen dürfen Ein-Finger-Wischen an die Seite geben (sonst Scroll-Falle), dann aber konsistent.
- **OVL-2** [MUSS · Ist · Review] **Gleiche Geste, gleiche Wirkung.** Mausrad über einer Fläche mit Zoom zoomt um den Mauszeiger, im Fraktal-Canvas wie im Skill-Graphen (gleicher Faktor `exp(−deltaY · 0.0016)`). Waagerechtes Wischen auf dem Trackpad und Shift+Rad verschieben. Ein Finger auf leerer Fläche verschiebt die Ansicht, auf einem Objekt zieht er das Objekt. Zwei Finger verschieben und zoomen zugleich (Pinch um den Schwerpunkt). Zoom ist zusätzlich über beschriftete Knöpfe erreichbar (Skill-Graph: „−“, „+“, „Einpassen“, an den Zoom-Grenzen `aria-disabled`; bei Fokus im Sheet auch die Tasten `+`, `−`, `0`, der Canvas trägt `tabindex="-1"`, damit ein Klick den Fokus im Dialog hält). Die Ansicht bewegt sich nie von selbst: kein Zentrieren auf eine Auswahl, keine Kamerafahrt beim Auskühlen des Layouts (Owner, 2. 10. 2026). Ohne Sheet, inline im Lesefluss, bleibt das Rad beim Seiten-Scrollen (OVL-1, Ausnahme). Neue Flächen übernehmen dieses Muster.
- **OVL-3** [MUSS · Ist · CI] **Light Dismiss.** Jedes Overlay, das keine zwingende Entscheidung verlangt (Sheet, Drawer, Dropdown, Hinweis-Dialog, Tooltip), schließt per Escape, per Klick oder Tippen außerhalb (Scrim bzw. Umgebung) und per sichtbarem ✕ bzw. Auslöser. Kein Light Dismiss nur dort, wo dabei Eingaben verloren gingen. Esc ist gestaffelt: erst Auswahl lösen, dann schließen (Skill-Graph), entschieden in der Capture-Phase (`skill-graph-sheet.js`). Check: `invariants.spec.js`.
- **OVL-4** [MUSS · Ist · CI] **Modal heißt vollständig modal:** Scrim, Scroll-Sperre ohne Layout-Sprung (`html { overflow: hidden; scrollbar-gutter: stable }`), Hintergrund `inert`, `role="dialog"` mit `aria-modal="true"` und zugänglichem Namen, Fokus beim Öffnen hinein und beim Schließen zurück zum Auslöser (A11Y-2). Das Overlay liegt direkt unter `<body>`, nicht im Stacking-Kontext von `#main` (Z-1). Vorlage: `assets/js/skill-graph-sheet.js` (`enterModal`, `leaveModal`). Den Hintergrund setzen Drawer, TOC-Dropdown und Sheet über den Helfer `inertOutside` (`site-utils.js`, JS-18) `inert`, Skripte und Live-Regionen bleiben aktiv. Der Drawer lässt den Masthead bedienbar, setzt `inert` erst nach dem Slide-In und bleibt semantisch eine Disclosure-Navigation ohne `role="dialog"` (Register R-32). Check: `invariants.spec.js`.
- **OVL-5** [SOLL · Ist · Review] Non-modale Overlays (Toasts, Hinweise) sperren nichts und stehlen nicht den Fokus. Deckt ein Overlay den größten Teil des Viewports, wird es modal gebaut (OVL-4).

---


## 5 Seitenaufbau und Inhaltsmuster

- **SEITE-1** [MUSS · Ist · CI-P3] Hero → Einleitung **ohne** Überschrift → H2-Kapitel. Keine H2 „Einleitung“, „Einführung“ oder eine Wiederholung des Titels. Einleitungen dürfen länger sein, aber nicht detaillierter (7.2). Gilt auch für die Beitragsvorlage (FM-3). Ausnahme: Pflicht- und Systemseiten (Datenschutz, 404, offline) haben keinen Hero, dort trägt `page__title` die H1.
- **SEITE-2** [MUSS · Ist · Review] In datengetriebenen Seiten (`_data/cv_content.yml`, `_data/mandelbrot.yml`) markiert `intro: true` die Einleitung. Die Loops in `_pages/cv.md` und `_pages/mandelbrot.md` rendern sie ohne H2 und ohne TOC-Eintrag.
- **SEITE-3** [MUSS · Soll · Review] Genau ein H1 pro Seite (Hero bzw. `page__title`, erfüllt auf allen gebauten Seiten). Keine Ebene überspringen (kein Sprung auf den gebauten Seiten, Stand 5. 10. 2026). Gleiche Komponente = gleiche Ebene. Beitragskarten (`archive-single.html`) stehen eine Ebene unter ihrer Abschnittsüberschrift, Parameter `heading_level`: H3 unter einer H2 (Startseite, Archiv, „Das könnte auch interessieren“), H2 nur direkt unter der H1 der Blog-Übersicht. Sidebar (Autor, TOC-Titel) ohne Überschriften-Elemente (erfüllt, Autorname seit 4. 10. 2026 als `<div>` im eigenen `author-profile.html`).
- **SEITE-4** [MUSS · Soll · Review] Hero-Titel = Seitenname. Excerpt = ein bis zwei warme Sätze mit Punkt (wird Meta-Description). Caption = Statuszeile mit Zusatzinformation, **nie** Titel-Paraphrase (z. B. „Stand: 2026“, „In Echtzeit gerechnet“). Ton-Maßstab ist das Home-Intro (7.2).
- **SEITE-5** [SOLL · Soll · Review] Markdown-Inhalte nutzen H2 und H3. H4 nur nach der Überschriften-Matrix in 3.2. H5 und H6 nicht.
- **SEITE-6** [MUSS · Soll · Review] Kein Demo- oder Platzhalter-Content im Build (erfüllt seit dem Depublizieren des Demo-Beitrags). Zeitgebundene Hinweise (z. B. `blog_notice`) tragen ein Ablaufdatum. Bestand: R-67.
- **SEITE-7** [SOLL · Soll · Review] Pro Ansicht höchstens ein `.btn--primary`. Bild und Button zum selben Ziel werden zu einem Link zusammengeführt.

### 5.1 Inhaltsmodell

- **INH-1** [MUSS · Soll · Review] Kategorien und Tags sind sitewide ausgeblendet (`_includes/head/custom.html`) und dienen nur der Ordnung in Repo und Feed. Kategorien kommen aus einer festen Liste (**[Offen]**: Liste festlegen), Tags sind kleingeschrieben, deutsch, Einzahl, mit Bindestrich statt Leerzeichen.
- **INH-2** [MUSS · Ist · Review] Entwürfe liegen in `_drafts/` und gehen nie in den Build. Veröffentlichen heißt: nach `_posts/` mit Datum im Dateinamen verschieben.
- **INH-3** [SOLL · Soll · Review] `last_modified_at` nur bei inhaltlichen Änderungen setzen, nicht bei Tippfehlern oder Format. Ohne Eintrag im Front Matter setzt `jekyll-last-modified-at` das Datum des letzten Commits der Datei (der Build-Job checkt dafür die volle Historie aus), also auch nach rein technischen Änderungen.
- **INH-4** [MUSS · Soll · Review] Depublizieren in zwei Schritten: erst interne Links auf den Beitrag entfernen oder umbiegen, dann `published: false`. Die URL bleibt nicht als 404 stehen, wenn sie extern verlinkt sein kann (Weiterleitung prüfen).
- **INH-5** [MUSS · Ist · CI] Gastbeiträge (Owner-Entscheidung 4. 10. 2026): Gäste schreiben nach der Vorlage (FM-3), der Owner pflegt den Beitrag ein (`docs/pflege.md`). Der Gast steht nur mit Namen im Theme-Feld `author: "Vorname Nachname"`, ohne Autorenprofil, Avatar, Social-Links oder Verweis auf eine Erstveröffentlichung. `_plugins/gast-autor.rb` macht daraus einen Eintrag nur mit `name` und schaltet das Autorprofil der Sidebar ab. Sichtbar ist „von <Name>“ in der Meta-Zeile (`page__meta.html`), in den Metadaten (`meta name="author"`, `article:author`, JSON-LD, Feed) ist der Gast Autor, Herausgeber bleibt Hans Müller. Check: Fixture `_posts/2025-01-01-test-gastbeitrag.md` (`published: false`, nur im Review-Build), `tests/visual/gast-autor.spec.js`, CI-Gate „Test-Gastbeitrag nie im Deploy“.

### 5.2 Bilder und Medien

- **IMG-1** [MUSS · Soll · Review] Fotos als JPEG (progressiv) oder WebP, mit AVIF-Variante, wo der Gewinn deutlich ist. Grafiken als SVG. PNG nur für Favicons und Bildschirmfotos mit Text. Ausnahme: Das Vorschaubild beim Teilen ist ein JPEG, weil Plattformen kein SVG lesen (SEO-3).
- **IMG-2** [MUSS · Soll · Review] Maße: Hero-Bilder 1920 × 1080 px oder kleiner, Teaser 1200 × 675 px. Kompression so, dass das Hero-Bild das Budget in 15.1 einhält.
- **IMG-3** [MUSS · Soll · Review] Jedes `<img>` mit `width`/`height` (HTML-3). Kachelbilder (`header.teaser`) bekommen sie beim Build aus der Datei (`_plugins/bildmasse.rb`, JPEG, PNG, WebP, GIF), Beitragsautoren tragen nur den Pfad ein. Für Bilder im Inhalt eines Beitrags und für Kachelbilder ohne lesbare Maße warnt `scripts/content-check.py --site _site` im Build-Job. Bilder unterhalb des ersten Viewports `loading="lazy"`, alle `decoding="async"`. Das LCP-Bild (Hero) nie lazy.
- **IMG-4** [SOLL · Soll · Review] Bilder breiter als `800px` bekommen `srcset` mit mindestens zwei Breiten.
- **IMG-5** [MUSS · Ist · Review] Hero-Overlay: `overlay_filter: 0.5` als Standard (Kontrast des Titels auf dem Foto). Abweichungen nur mit gemessenem Kontrast.
- **IMG-6** [MUSS · Soll · Review] Alt-Texte nach 6.1 (1.1.1): beschreiben Zweck und Inhalt in einem Satz ohne „Bild von“. Formeln und Diagramme verweisen auf das DOM-Äquivalent. Der Text zum Hero-Hintergrund (`background_image_alt` in `_config.yml`) bleibt, wie er ist (Owner, 6. 10. 2026). Im Hero ist das Bild Deko ohne `alt`, der Text gilt nur noch als Rückfall für das Vorschaubild (SEO-3).
- **IMG-7** [MUSS · Soll · Review] Bildrechte: nur eigene, gemeinfreie oder lizenzierte Bilder. Lizenz und Quelle stehen in `assets/images/QUELLEN.md` (zu bauen, R-73). Metadaten nach SEC-10 entfernen.

### 5.3 SEO und Metadaten

- **SEO-1** [MUSS · Ist · Review] `title` im Front Matter ist der Seitenname ohne Site-Namen. Den Zusatz mit dem Site-Namen erzeugt das Theme (`site.title`, `title_separator`). `title_separator` steht in `_config.yml` auf dem Hausstil-Strich „–“ (TYPO-2).
- **SEO-2** [SOLL · Soll · CI-P3] Excerpt bzw. Description 70 bis 160 Zeichen. Bestand: R-67.
- **SEO-3** [SOLL · Ist · Review] Vorschaubild beim Teilen 1200 × 630 px: `og_image` in `_config.yml` (`assets/images/og-vorschaubild.jpg`, Hero-Motiv mit Namen und Adresse, erzeugt mit `scripts/og-image.js`, Owner 6. 10. 2026) gilt auf allen Seiten, auch vor dem Hero der Seite. Eine Seite mit eigenem Motiv setzt `header.og_image` (heute `/mandelbrot/` mit `mandelbrot-preview.jpg`). Alt-Text (`og:image:alt`) pro Seite über `header.og_image_alt`, sonst `og_image_alt` (Site-Bild) aus `_config.yml`, als Rückfall ohne `og_image` `background_image_alt` (gemeinsamer Hero-Hintergrund). `_includes/seo.html` bindet den Text an das tatsächlich gezeigte Bild und gibt `og:image:width` und `og:image:height` aus der Datei aus (`_plugins/bildmasse.rb`).
- **SEO-4** [MUSS · Ist · CI-P3] Seiten, die nicht in Suche und Sitemap gehören (Archiv-Stubs, Weiterleitungen), tragen `sitemap: false` und `noindex: true` (SEC-12). Interne Werkzeugseiten werden gar nicht erst deployt (SG-1). Heute gibt es weder Stubs noch Weiterleitungen, `404.html` und `offline.html` tragen `sitemap: false`.
- **SEO-5** [MUSS · Ist · Review] Speculation Rules (`_includes/head/custom.html`) schließen nur `/mandelbrot/` (Fraktal-Worker und MathJax rechneten schon beim Hover) und die Drawer-Links aus (der Prerender stahl dem Drawer-Exit die CPU). Die übrigen internen Ziele werden vorgerendert (PERF-4).

### 5.4 Druck

- **PRINT-1** [SOLL · Soll · Review] Animationen, CRT-Schichten, Power-Button, Overlays und Navigation sind im Druck ausgeblendet. Text druckt schwarz auf weiß. Ist: Regeln in `_hero.scss` und `_skill-graph.scss`.

### 5.5 Styleguide-Ansicht und automatisches Review

- **SG-1** [MUSS · Ist · CI] **Im Repo, nie veröffentlicht (Owner, 1. 10. 2026).** Die Styleguide-Ansicht `_pages/styleguide.html` (Stylesheet `assets/css/styleguide.scss`) trägt `published: false`. Gebaut wird sie nur mit `jekyll build --unpublished` (lokal `jekyll serve --unpublished`, CI: `_site_review`). Ein CI-Gate bricht ab, wenn sie im deployten `_site` auftaucht.
- **SG-2** [MUSS · Ist · CI] Die Ansicht zeigt echte Komponenten mit echtem Markup und echten Klassen aus `main.css`, Tokens kommen aus den Sass-Variablen. Jede neue Komponente und jedes neue Farb- oder Schriftgrößen-Token wird dort eingetragen, mit `data-sg-section` und, falls interaktiv, `data-sg-states`.
- **SG-3** [MUSS · Ist · CI] Automatisches Review (`tests/visual/`, Playwright im Container `mcr.microsoft.com/playwright`, Version wie `@playwright/test`): Screenshot-Vergleich jedes Abschnitts und jedes Zustands, Kontrast jeder Textprobe gegen ihren Grund (`data-sg-min`, Ausnahmen mit Regel-ID), axe-core WCAG 2.2 AA auf den echten Seiten mit Baseline `tests/visual/a11y-known.json` (nur neue Verstöße brechen ab, die Baseline darf nur schrumpfen), Bedien-Invarianten in `invariants.spec.js` (A11Y-2, OVL-3, OVL-4, kein unsichtbarer Fokus). Gewollte visuelle Änderung: `npm run test:visual:update` im Container, neue Bilder mitcommitten.

---

## 6 Barrierefreiheit

Ziel: **WCAG 2.2 AA** als freiwillige Selbstverpflichtung. Rechtsrahmen: Das BFSG gilt für diese reine Präsentationsseite nach Auslegung der Bundesfachstelle Barrierefreiheit nicht, die BITV 2.0 gilt nur für öffentliche Stellen. Beides wird neu bewertet, sobald ein entgeltlicher Dienst hinzukommt. Keine Rechtsberatung. WCAG 3 und APCA sind kein Prüfmaßstab (WCAG 3 ist Working Draft, der Kontrastalgorithmus ist offen).

### 6.1 Pflichtkatalog

| SC | Stufe | Regel für dieses Repo |
|---|---|---|
| 1.1.1 | A | Inhaltsbilder mit beschreibendem `alt`. Dekorative und redundante Bilder (Teaser neben gleichem Titel, Hero neben H1) `alt=""`. Canvas: `role="img"` plus Label mit Verweis auf das DOM-Äquivalent. |
| 1.3.1 | A | Optische Überschriften sind echte Überschriften. Landmarks nach HTML-2. |
| 1.4.1 | A | Information nie nur über Farbe (Links: LINK-2, Zustände: KOMP-1). |
| 1.4.3 | AA | siehe FARB-2 und FARB-3 |
| 1.4.4 | AA | Text bis 200 % vergrößerbar. Ist: `html { font-size: 100% }` im Critical-CSS, die Browser-Grundgröße wirkt (Owner-Freigabe 1. 10. 2026). Die px-Schriften im Fraktal-Panel (`$fp-fs-*`) sind bewusst viewport-fix: Sie wachsen mit dem Browser-Zoom, der 1.4.4 erfüllt, aber nicht mit der Schriftgrößen-Einstellung. |
| 1.4.10 | AA | Bei 320 px CSS-Breite kein horizontales Scrollen, auch nicht in Fraktal-Panels und im Skill-Graph. |
| 1.4.11 | AA | Icons, Control-Grenzen, Fokus ab 3:1. `-subtle`-Tokens reichen dafür nicht. |
| 1.4.12 | AA | Keine Textcontainer mit fester Höhe und `overflow: hidden`. |
| 1.4.13 | AA | Inhalt bei Hover oder Fokus (TOC-Dropdown, Tom-Select, Tooltips) ist schließbar, erreichbar und bleibt sichtbar (FORM-5). |
| 2.1.1 | A | Alles per Tastatur. Scroll-Container mit Text sind fokussierbar. |
| 2.1.2 | A | Keine Tastaturfalle. Das Skill-Graph-Bottom-Sheet und der Drawer lassen sich per Escape und Tab verlassen. |
| 2.2.2 | A | Auto-Bewegung über 5 s braucht Pause oder Stopp (siehe 6.3 und 6.5). |
| 2.3.1 | A | höchstens 3 Blitze pro Sekunde, gilt unabhängig von Reduced Motion |
| 2.4.2 | A | Jede Seite hat einen eindeutigen `<title>`. Jeder Seitenwechsel ist ein echter Seitenaufruf (A11Y-5). |
| 2.4.3 / 2.4.7 | A / AA | Unsichtbares ist nicht fokussierbar (`hidden`, `inert` oder `visibility: hidden`). Kein `outline: none` ohne gleichwertigen Ersatz. |
| 2.4.4 | A | Linkzweck aus dem Linktext oder seinem Kontext erkennbar (LINK-1). |
| 2.4.11 | AA | `html { scroll-padding-top: var(--anchor-offset) }`. Jede fixe Leiste meldet ihre Höhe in diese Rechnung, die Sticky-TOC per Inline-`scroll-padding-top` (`toc.js`, PERF-6). |
| 2.5.1 / 2.5.7 | A / AA | Jede Drag- oder Mehrfinger-Geste hat eine Ein-Klick-Alternative. |
| 2.5.3 | A | Der zugängliche Name beginnt mit dem sichtbaren Text, oder es gibt kein `aria-label`. |
| 2.5.8 | AA | Ziele mindestens 24 × 24 px. Unter `(pointer: coarse)` treffen Menü-Knopf und Buttons (`.btn`, auch „Folgen“) auf mindestens 44 × 44 px, per unsichtbarem Polster (Mixin `touch-target-pad`, Token `$touch-target-min`), Optik und Abstände bleiben gleich (Owner, 6. 10. 2026). Skill-Chips und Links im Fließtext folgen der 24-px-Regel. Check: `invariants.spec.js` („Touch-Ziele 44 px“). |
| 3.1.1 / 3.1.2 | A / AA | `lang="de-DE"`. Fremdsprachige Passagen (Motto, Zitate) mit `lang`. Theme-Strings übersetzt (Skip-Links), Landmark-Namen deutsch (Rest R-51). |
| 3.2.3 | AA | Navigation steht auf allen Seiten in derselben Reihenfolge (`_includes/masthead.html` auf jeder Seite, `_data/navigation.yml` als einzige Quelle). |
| 4.1.2 | A | Kein `role="button"` auf `span`/`div`, kein `aria-label` auf generischen Elementen, keine interaktiven Elemente in Überschriften, Buttons nur mit Phrasing Content. Vendor-Widgets benannt (noUiSlider `handleAttributes`). |
| 4.1.3 | AA | Statusmeldungen über eine beim Laden vorhandene, leere Live-Region. |

### 6.2 Muster

- **A11Y-1** [MUSS · Soll · Review] Toggle-Buttons: entweder festes Label plus `aria-pressed`/`aria-expanded` oder wechselndes Aktions-Label ohne State-Attribut. Nie beides.
- **A11Y-2** [MUSS · Soll · CI] Disclosure, Dropdown, Drawer, Sheet folgen einem Muster: Button mit `aria-expanded` und `aria-controls`, Escape schließt und gibt den Fokus an den Auslöser zurück, beim Öffnen wandert der Fokus hinein. Mit Scrim oder Scroll-Sperre wird der Hintergrund `inert`. Drawer, Skill-Graph-Sheet, Autor-Folgen-Dropdown und das TOC-Dropdown der mobilen Sticky-Leiste erfüllen das Muster, `tests/visual/invariants.spec.js` prüft sie. Drawer, Autor- und TOC-Dropdown setzen den Fokus nur beim Öffnen per Tastatur (`click` mit `detail === 0`) auf den ersten Link, bei Maus und Touch bleibt er am Toggle (bis zur Entscheidung zu R-32).
- **A11Y-3** [MUSS · Soll · Review] Dekorative Icons (`<i class="fa…">`, SVG, Glyphen ▲▼✕) tragen `aria-hidden="true"`, Inline-SVG zusätzlich `focusable="false"`.
- **A11Y-4** [MUSS · Soll · Review] Für versteckten Text nur `.visually-hidden`.
- **A11Y-5** [MUSS · Ist · CI] Seitenwechsel sind echte Seitenaufrufe (ARCH-2): Fokus, Titel und die Ansage der neuen Seite übernimmt der Browser, `aria-current="page"` setzt `_includes/masthead.html` beim Build. Kein Nachbau per Live-Region oder Fokus-Skript. Check: `tests/navigation.spec.js` (Titel und `aria-current` nach einem Klick in der Navigation).
- **A11Y-6** [SOLL · Soll · Review] Forced-Colors-Block in `base/_accessibility.scss` (Selektoren mit `:root`-Präfix, weil die Datei vor den Komponenten lädt). Fokus nie allein über `box-shadow`.

### 6.3 Bewegung

- **BEW-1** [MUSS · Ist · Review] Jede CSS-Animation respektiert `prefers-reduced-motion`. Der globale Kill-Switch in `base/_accessibility.scss` deckt CSS ab.
- **BEW-1a** [MUSS · Ist · CI] JS-Animationen fragen die Systemeinstellung „Bewegung reduzieren“ nur über die Helfer in `site-utils.js` ab (JS-18): `AuflinieUtils.prefersReducedMotion()` live im Moment der Bewegung, `AuflinieUtils.onReducedMotionChange(fn, signal)` für Zustände, die beim Umschalten neu gesetzt werden müssen. Die Media-Query steht im JS nur in `site-utils.js`. Fehlt der Helfer, gilt „reduziert“. Check: `tests/navigation.spec.js`.
- **BEW-2** [MUSS · Ist · Review] Ausnahmen vom Kill-Switch stehen namentlich in **einer** Liste in `_accessibility.scss` (die `:not(…)`-Liste des Kill-Switch-Selektors) und hier in 6.5.
- **BEW-3** [MUSS · Ist · CI] Bewegte Seitenübergänge (Überblendung, Drawer-Exit, CRT-Umschalten) laufen nur unter `prefers-reduced-motion: no-preference`. Unter `reduce` läuft die View Transition mit Dauer null (Gürtel am Ende von `_view-transition.scss`, ARCH-2), `tv-switch.js` setzt keinen CRT-Type. CSS-Gürtel und JS-Gate bleiben synchron (BP-6). Check: `tests/navigation.spec.js` (mobil ohne CRT, Transition in Chromium unter 200 ms).
- **BEW-4** [MUSS · Ist · Review] Programmatischer Scroll mit `behavior: 'auto'` bei Reduced Motion. Einziger weicher Scroll ist `back-to-top.js`, er springt unter `reduce`.
- **BEW-5** [MUSS · Soll · Review] Jede Flicker-Animation schneller als 3 Hz trägt einen Kommentar zur Amplitude (Vorbild `_crt-overlay.scss`: ±3 % Luminanz). Eine neue `$crt-variante` oder `$glitch-variante` wird erst Standard, wenn ein Blitztest bestanden ist. Messverfahren: Bildschirmaufnahme mit mindestens 60 fps bei 1024 × 768 px, dann entweder Analyse mit PEAT oder Harding FPA (beide werten Video aus) oder eigene Frame-Analyse der relativen Luminanz. Ein Blitz ist ein Paar gegenläufiger Änderungen um mindestens 10 % der relativen Luminanz, bei dem der dunklere Zustand unter 0,80 liegt. Kritisch sind mehr als drei pro Sekunde auf einer Fläche über 25 % eines 10-Grad-Sichtfelds (bei 1024 × 768 px etwa 341 × 256 px).

### 6.4 Offene Kontrastkonflikte mit Owner-Entscheidungen

| Stelle | Ist | Problem | Vorschlag |
|---|---|---|---|
| Nav- und TOC-Hover | seit 1. 10. `$hover-color-text` | 4,51:1, auf Cyan-Hover-Grund 3,68:1 | Owner-Ausnahme (KOMP-3) |
| Hamburger, Back-to-Top | `$control-icon-color` (Cyan 55 %), Hamburger im Hover volles Cyan `$link-color` | 3,50:1 auf `#252a34`, 3,84:1 auf `#1a1a1a` (UI), Hover 8,29:1 | – |

### 6.5 Dokumentierte bewusste Ausnahmen

**CRT-Hero und Neon-Schriftzug laufen auch bei `prefers-reduced-motion: reduce` endlos** (das Logo-Flackern steht nicht in den Ausnahmen des Kill-Switches und hält bei Reduced Motion an) (Owner-Entscheidung vom Juli 2026, am 1. 10. 2026 bestätigt: „das soll ja so, es sind Stilelemente“). Ehrliche Bewertung:

- **2.3.3 (AAA)** ist keine AA-Pflicht. Die Ausnahme ist dort zulässig.
- **2.2.2 (Level A) ist nicht erfüllt.** Rollbalken, Scanline-Jitter, Phosphor-Flackern, Neon-Flicker und das Logo-Flackern starten automatisch und laufen endlos. Der einzige Stopp-Mechanismus ist der Power-Button (Lesemodus). Er existiert nur auf `/`, wird nicht gespeichert und stoppt Neon und Logo nicht.
- **2.3.1 (Level A):** Die aktive Variante `antenne` liegt nach Codeanalyse unter der Schwelle. Die Varianten `dezent`, `linie-punkt`, `voll` sind ungemessen und dürfen ohne Test nach BEW-5 nicht Standard werden.
- **Entschieden (Owner, 1. 10. 2026):** Kein separater Bewegungs-Schalter, kein gespeicherter Lesemodus auf allen Hero-Seiten, kein Anhalten nach 5 s. Die Seite ist damit formal nicht WCAG-2.2-A-konform (2.2.2). Das ist eine dokumentierte Ausnahme und wird nicht erneut als Fix vorgeschlagen. Neu bewertet wird nur, wenn sich der Charakter der Seite ändert.
- Harte Grenze bleibt 2.3.1: Jeder neue Flacker-, Glitch- oder Blitzeffekt wird vorher nach BEW-5 gemessen. Der Umbau des Neon-Schriftzugs vom 6. 10. 2026 behält Flacker-Keyframes und Takte bei (keine höhere Frequenz).
- Das Aufglimmen des Power-Buttons ist auf `no-preference` gegatet (Owner-Entscheidung): Der Kill-Switch nimmt den Hinweis-Puls unter `reduce` heraus.

Weitere bewusste Ausnahmen: Fokus des Hero-Power-Buttons beige statt Magenta (Kontrast auf dem Foto), Blocksatz im Home-Intro (1.4.8 ist AAA), Fußnoten-Rücksprung „↩“ (`a.reversefootnote`) nur über die Farbe vom Text abgesetzt (1.4.1, axe `link-in-text-block`, Owner-Entscheidung 6. 10. 2026). Er trägt den Namen „Zurück zum Text“ (`_plugins/inhalts-a11y.rb`), sichtbar bleibt er grau ohne Unterstreichung. Die axe-Meldung steht seitenunabhängig in `KNOWN_PATTERNS` (`tests/visual/a11y.spec.js`), damit ein neuer Beitrag mit Fußnote die CI nicht rot macht. Der Kontrast der Styleguide-Probe `hover-color-text` auf Nav-Hover-Grund (Owner-Ausnahme KOMP-3, 6.4) steht als Baseline in `tests/visual/a11y-known.json`.

---

## 7 Sprache und Ton

### 7.1 Anrede

- **TON-1** [MUSS · Ist · CI-P3] Anredefrei. Aussagesatz oder Infinitiv („Die Iterationszahl steuert die Detailtiefe“, „Bild speichern“).
- **TON-2** [MUSS · Soll · CI-P3] **Nie „Sie“**, auch nicht in Theme-Strings (eigener `de-DE`-Block in `_data/ui-text.yml`, erfüllt) und nicht in der Repo-Doku.
- **TON-3** [SOLL · Ist · Review] „Du“ nur bei unvermeidbarer direkter Bedienansprache.
- **TON-4** [SOLL · Ist · Review] Ich-Stimme für Persönliches.

### 7.2 Ton

Alle Ton-Regeln sind Review-Regeln. Maßstab ist das Home-Intro (`index.html`), zum Beispiel dieser Satz: „Erfahrung nützt aber niemandem, solange sie bei einem selbst bleibt.“ Seit 1. 10. 2026 ist auch das Home-Intro frei von Semikolons: Ein Punkt ersetzt das einzige Semikolon, sonst ist der Referenztext unverändert (Beispiel in 7.4).

- **TON-5** [MUSS · Ist · Review] Locker, wissenschaftlich korrekt, präzise. Anspruchsvoll, aber nicht hochgestochen.
- **TON-6** [MUSS · Ist · Review] Lesertexte (Hero, Einleitungen auf Home, Über mich, Lebenslauf, Blog) warm statt „nerdig“. Erst auf Ton prüfen, dann auf Präzision.
- **TON-7** [MUSS · Ist · Review] Einleitungen dürfen länger sein, aber nicht detaillierter.
- **TON-8** [SOLL · Ist · Review] Kurze aktive Sätze. Ein Gedanke, der etwas behauptet, schlägt eine Aufzählung, die nichts sagt. Front-Loading: Kernaussage zuerst, Überschriften und Listenpunkte tragen in den ersten zwei Wörtern Bedeutung (NN/g).

### 7.3 Verbotene Muster

- **TON-9** [MUSS · Ist · CI-P3 für Semikolon, sonst Review] Lesertexte in `_pages`, `_posts`, `_data` und `index.html` sind seit 1. 10. 2026 frei von Semikolons.

| Muster | Stattdessen |
|---|---|
| Semikolon in Lesertexten | Punkt oder Gedankenstrich (Ausnahme: wörtliche Zitate) |
| Nominalstil („unter Anwendung moderner Entwicklungspraktiken“) | Verb („entwickle ich mit …“) |
| Verstärker (faszinierend, einzigartig, außergewöhnlich, optimal) | Sache konkret benennen |
| Selbst-Etiketten (Autodidakt, Experte) | Handlung zeigen („eigne ich mir … an“) |
| Gendern und neutrale Ersatzformen (Lesende, Studierende, Leser:innen, Doppelnennung) | generisches Maskulinum (Leser, Studenten), Regel in Abschnitt 8 (Owner, 6. 10. 2026) |
| Konkrete Berufsdauer („seit 8 Jahren“) | „Seit vielen Jahren“ |
| Technik- oder System-Metaphern in Einleitungen | menschliche Formulierung |
| Fach-Listing als Einstieg | ein Satz mit Aussage |
| Fraktale und Machine Learning als zusammengehörig | getrennt darstellen, Dach: „die Schönheit der Mathematik und Technik“ |
| Interne Begriffe in sichtbaren Zuständen („Render-Fallback aktiv“) | „Die Darstellung ist in diesem Browser nicht möglich.“ |

### 7.4 Beispiele

| Schlecht | Gut |
|---|---|
| „Hier können Sie Bilder einfügen.“ | „Bilder lassen sich mit `![]()` einfügen.“ |
| „Eine systematische Darstellung der technischen Grundlagen …“ | „Wie ein Beitrag entsteht, vom Entwurf bis zur Veröffentlichung.“ |
| „Ich bin Autodidakt.“ | „Die Grundlagen eigne ich mir Schritt für Schritt an.“ |
| „frei verfügbar sein; es wird nicht weniger“ | „frei verfügbar sein. Es wird nicht weniger …“ |
| „Fehler: Worker-Initialisierung fehlgeschlagen“ | „Die Berechnung startet nicht. Neu laden hilft meistens.“ |

### 7.5 Bedientexte (Microcopy)

- **COPY-1** [MUSS · Soll · Review] Buttons im Infinitiv mit Objekt („Bild speichern“, „Graph anzeigen“), höchstens drei Wörter. Kein „OK“, kein „Klicken Sie hier“.
- **COPY-2** [MUSS · Soll · Review] Statusmeldungen im Aussagesatz ohne Ausrufezeichen („Neue Version verfügbar.“). Laufende Vorgänge mit Auslassungspunkten („Berechne …“). Bestand: R-65.
- **COPY-3** [MUSS · Soll · Review] Toasts nennen Ursache und genau eine Aktion („Neue Version verfügbar.“ plus Button „Neu laden“).
- **COPY-4** [MUSS · Soll · Review] Leerzustände sagen, was fehlt und was hilft („Keine Beiträge zu diesem Suchbegriff. Ein kürzerer Begriff findet mehr.“). Bestand: R-65.
- **COPY-5** [MUSS · Ist · Review] Fehlerseiten (404, offline) sagen in einem Satz, was passiert ist, und bieten einen Weg zurück (Startseite, zuletzt besuchte Seiten aus dem Cache).
- **COPY-6** [SOLL · Soll · Review] Kleinschreibung nach Duden. Hinweise in Kleinbuchstaben sind gestaltete Ausnahmen (Owner) und stehen im Glossar.

### 7.6 Fachliche Korrektheit

- **FACH-1** [MUSS · Soll · CI-P3] Mathematische und technische Aussagen sind belegbar (Bestand: R-65). Die Quelle steht als greppbarer Kommentar neben dem Text: in HTML und Markdown `{% comment %} Quelle: Autor, Titel, Jahr, URL {% endcomment %}`, in YAML `# Quelle: Autor, Titel, Jahr, URL`. HTML-Kommentare (`<!-- -->`) sind verboten (LIQ-5).
- **FACH-2** [MUSS · Soll · Review] Beispielwerte (c-Parameter, Voreinstellungen) werden vor dem Veröffentlichen im eigenen Explorer geprüft.
- **FACH-3** [MUSS · Soll · Review] Zitate nur mit belegter Quelle, sonst „(sinngemäß)“ (Gedanke belegt, Wortlaut nicht, z. B. Einstein 1933), „(zugeschrieben)“ (Zuschreibung ohne Beleg) oder „Unbekannt“. Der Beleg steht als Quellenkommentar daneben (FACH-1).
- **FACH-4** [MUSS · Soll · Review] Architekturänderungen ziehen technische Blogposts im selben Commit nach.

### 7.7 Glossar

| Begriff | Schreibweise |
|---|---|
| Bereich | Fraktale |
| Komponenten | „Interaktive Julia-Menge“, „Mandelbrot-Julia-Explorer“ (danach „Explorer“) |
| Mengen | Mandelbrot-Menge, Julia-Menge, gefüllte Julia-Menge (≠ Julia-Menge) |
| Inhalt | Blogbeitrag, Lebenslauf, Archiv |
| Fußnoten | Rücksprung „↩“, zugänglicher Name „Zurück zum Text“ |
| Rechtliches | Datenschutzerklärung (Dokument), Footer-Link und Seitentitel „Datenschutz“, kein Impressum |
| Skills | Kapitel „Technische Fähigkeiten“, Element „Skill“ |
| Technik | Front Matter, Dev Container, CI / CD, KI (im Fließtext) |
| Commits | Typ, Bereich (Scope nach Conventional Commits), Betreff, Commit-Hook |
| Bedienhinweise im Fraktal-Panel | bewusst in Kleinbuchstaben, gestaltete Ausnahme zu COPY-6 (Owner, 6. 10. 2026), etwa „ziehen: zoom-rechteck · mausrad: zoom“ (`_data/fractal_panel.yml`) |
| Marken | LinkedIn, Spring Boot, Docker Compose, pip, scikit-learn, Vue.js |

**Entschieden (Owner, 1. 10. 2026):** „Reset“ und „Preset“ sind eingedeutschte UI-Wörter und bleiben. Gleiche Aktion, gleiches Wort: Der Zurücksetzen-Button heißt sichtbar überall „Reset“ (Fraktal-Panel, Skill-Graph). Der zugängliche Name beginnt mit dem sichtbaren Wort (WCAG 2.5.3 Label in Name): „Reset – Ansicht zurücksetzen“, Tooltip „Zurücksetzen“. „Zurücksetzen“ passt nicht in die Keycap-Buttons. Der Navigationspunkt bleibt „Mandelbrot“. Der Knopf der Blog-Suche heißt „Suche leeren“ (Owner, 6. 10. 2026): Er leert das Suchfeld und setzt keine Ansicht zurück.

- **GLOS-1** [MUSS · Ist · Review] Neue Begriffe werden hier ergänzt, bevor sie live gehen.

---

## 8 Deutsche Typografie

Je Fall genau eine Entscheidung. Gilt für alle Quellen (Markdown, HTML-Includes, YAML, JS-Strings) und für diesen Guide.

- **TYPO-1** [MUSS · Soll · CI-P3] Zeichen werden direkt als Unicode getippt (Bestand: R-65). Entities nur für HTML-Syntaxzeichen (`&amp;`, `&lt;`, `&gt;`, `&quot;`) und für unsichtbare Zeichen, die im Editor nicht unterscheidbar sind (`&nbsp;` für U+00A0, `&#8239;` für U+202F). Grundlage: W3C i18n.
- **TYPO-2** [MUSS · Soll · CI-P3] Die Tabelle gilt für Lesertexte und Doku. Gedankenstrich, Zeiträume und „Heute“ sind site-weit umgesetzt, Bestand: R-65.

| Fall | Entscheidung | Beispiel | Begründung |
|---|---|---|---|
| Gedankenstrich | **Halbgeviertstrich mit Leerzeichen „ – “** (Hausstil, Owner, 1. 10. 2026) | „Daten – und was sie bedeuten“ | Duden, DIN 5008. Site-weit umgestellt, der Geviertstrich „—“ kommt in Lesertexten nicht mehr vor |
| Bis-Strich (Bereich) | Halbgeviert **ohne** Leerzeichen | 10–50 Iterationen, S. 10–15 | Duden |
| Zeiträume im Lebenslauf | Halbgeviert **mit** Leerzeichen (Owner-Stilelement, 1. 10. 2026). In `_data/cv_content.yml` normale Leerzeichen, `_includes/cv/entry.html` gibt sie als `&nbsp;` aus (kein Umbruch im Zeitraum) | 2020 – 2025, 2025 – Heute (groß, Owner-Stilelement) | Hausstil |
| Offenes Ende | im Fließtext „seit 2025“, als Zeitraum „2025 – Heute“ (groß, mit Leerzeichen wie die Zeiträume im Lebenslauf, Owner-Stilelement, 1. 10. 2026) | | Hausstil, Duden erlaubt auch klein |
| Bindestrich als Strich | **verboten** | ~~Hans Müller - Ingenieur~~ | |
| Anführungszeichen | „…“, innen ‚…‘ | „Seepferdchen“ | Duden |
| Apostroph | ’ (U+2019) | geht’s | Duden |
| Auslassung | … (U+2026), Leerzeichen davor bei ganzem Wort | „und so weiter …“ | Duden |
| Abkürzungen | mit geschütztem Leerzeichen (U+00A0) | z. B., d. h., e. V., M. Sc. | DIN 5008, amtliches Regelwerk |
| Prozent, Einheiten | Zahl, geschütztes Leerzeichen, Einheit | 98 %, 16 px, 100 dpi | DIN 5008 |
| Code-Werte im Fließtext | in Backticks, ohne Leerzeichen, wie im Code | `16px`, `0.06em` | eigene Regel |
| Dezimalzeichen | Komma im Fließtext | 0,75 | Duden |
| Dezimalzeichen Mathe / HUD | Punkt (wie Code und MathJax), dokumentierte Ausnahme | c = −0.700 + 0.270i | eigene Regel |
| Minus | − (U+2212), über gemeinsamen Formatter | −0,75 | Duden |
| Tausender | vierstellig ohne, ab fünf Stellen schmales geschütztes Leerzeichen (U+202F) | 1000, 34 500 | Duden |
| Datum Anzeige | „4. März 2025“ über `_includes/date-de.html` | | DIN 5008 alphanumerisch |
| Datum maschinenlesbar | ISO 8601 im `datetime`-Attribut | 2025-03-04 | ISO 8601 |
| Uhrzeit | 14:30 Uhr, volle Stunde 14 Uhr | | DIN 5008 |
| Schrägstrich | **immer mit Leerzeichen** zwischen Begriffen (Hausstil, Owner, 6. 10. 2026). Ausnahmen: Pfade, URLs, Code, Einheiten, Brüche, Datumsangaben sowie feste Fachbegriffe und Eigennamen mit Schrägstrich im Original. Im Kompositum lieber umstellen („Pipelines für CI / CD“ statt „CI / CD-Pipelines“) | C / C++, CI / CD, Azure AI / OpenAI, aber `assets/js/`, km/h, 1/2, A/B-Test | Hausstil, bewusst abweichend vom Duden (Lesbarkeit) |
| Komposita | deutsch zusammen, fremdsprachige Mehrwortglieder durchgekoppelt | Webanwendung, GitHub-Pages-Integration | Duden |
| Und-Zeichen | „&“ in Firmennamen und als bewusstes Stilelement in kurzen Labels (Autoren-Bio, Kapitel- und Gruppentitel, Owner, 1. 10. 2026). Im Fließtext „und“ | Procter & Gamble, Ingenieur & Entwickler, Data & Analytics | Duden, Hausstil |
| Noten | klein | sehr gut (1,3) | |
| Doppelformen | Duden-Empfehlung | sogenannt, potenziell, sequenziell, Kryptografie, Stand-up-Paddling, nicht ganzzahlig | Duden |
| Umlaute | immer echt, auch in JS | verfügbar, nicht verfuegbar | |
| Gendern | **nie gendern:** generisches Maskulinum, keine Wortbinnenzeichen, keine Doppelnennung, keine neutralen Ersatzformen. Bestehende Maskulina bleiben | Leser, Autoren, Entwickler (nicht: Lesende, Nutzende, Leser:innen) | Hausstil (Owner, 6. 10. 2026) |

Die Duden-Verweise zeigen auf die Sprachwissen-Seiten in Abschnitt 18. Paragrafennummern werden bewusst nicht zitiert, weil sie zwischen Duden-Auflagen und amtlichem Regelwerk abweichen.

- **TYPO-3** [SOLL · Ist · Review] **kramdown:** In `_config.yml` steht `smart_quotes: ["sbquo", "lsquo", "bdquo", "ldquo"]`. Das macht aus geraden Anführungszeichen in Markdown deutsche. Apostrophe wandelt kramdown dabei falsch (zu ‘), deshalb Apostrophe immer direkt als ’ tippen. Die ASCII-Kürzel `--`, `---`, `...`, `<<`, `>>` nicht verwenden. Includes, YAML ohne `markdownify` und JS laufen nicht durch kramdown und brauchen die finalen Zeichen.
- **TYPO-4** [SOLL · Soll · Review] **Listen:** Punkt am Ende nur bei ganzen Sätzen, einheitlich innerhalb einer Liste.

---

## 9 SCSS-Konventionen

Werkzeuge: Dart Sass (sass-embedded, über jekyll-sass-converter auf die 1.x-Reihe gepinnt), Stylelint mit `stylelint-config-standard-scss` (Versionen in `package-lock.json`).

### 9.1 Struktur

Ladereihenfolge in `assets/css/main.scss` (= Kaskade): `abstracts/tokens` mit dem Schalter `$text-font` aus `_config.yml` (kein CSS, TYP-13) → `variables/css-properties` (`:root`) → `theme-bridge` (MM-Skin `dark`, dann MM) → `custom`. Schichten (ITCSS-artig), ab Base in `_custom.scss`:

| Schicht | Ordner | Inhalt |
|---|---|---|
| Settings | `variables/`, gebündelt in `abstracts/_tokens.scss` | Tokens, `:root`-Custom-Properties (`variables/_css-properties.scss`) |
| Tools | `abstracts/_mixins.scss`, `abstracts/_breakpoints.scss` | Mixins, Platzhalter, Breakpoint-Mixins (BP-1), kein CSS-Output |
| Theme | `_theme-bridge.scss` | Minimal Mistakes per `@import`, einzige Ausnahme von SCSS-2 |
| Base | `base/` | Elemente, globale A11y, Icons |
| Components | `components/` | ein BEM-Block je Datei |
| Layouts | `layouts/` | Seitenkontexte, nur Container |
| Overrides | `theme-overrides/` | Retuschen an MM-Klassen |

Jedes Partial lädt am Dateianfang, was es nutzt, und nur das:

```scss
@use "sass:color";                 // Sass-Builtins zuerst, nur bei Bedarf
@use "abstracts/tokens" as *;      // $link-color, $fs-body, $content-width …
@use "abstracts/mixins" as *;      // card-panel, mono-label … (nur bei Bedarf)
@use "abstracts/breakpoints" as *; // up(md), down(md), between(md, lg) (nur bei Bedarf)
@use "theme-bridge" as mm;         // Theme-Werte: mm.$sans-serif, mm.$type-size-5 (nur bei Bedarf)
```

Ein neues Token kommt in die passende Datei unter `variables/` und ist danach über `abstracts/tokens` überall da. Ein Theme-Wert, den ein gleichnamiges Token überschreibt (heute `$sans-serif`, `$primary-color`), ist nur als Token erreichbar, nicht als `mm.$…`. Ein neues Partial mit CSS-Ausgabe bekommt ein `@use` in `_custom.scss` an der Stelle, an der es in der Kaskade stehen soll.

- **SCSS-1** [MUSS · Soll · Review] Dateien `_kebab-case.scss`, Dateiname = Blockname. Große Komponenten in einen Unterordner mit Sammeldatei, deren Kopf die Reihenfolge als Kaskaden-Vertrag dokumentiert (Vorbild `fractal-panel/`).
- **SCSS-2** [MUSS · Ist · CI] Kein `@import` außer in der Theme-Brücke. Sass-Builtins nur über Module (`@use "sass:list"`, `"sass:color"`, `"sass:math"`, `"sass:map"`). Keine globalen Funktionen (`index`, `map-get`, `lighten` …), kein Legacy-`if()`, stattdessen `@if`/`@else`. Check: Stylelint (`at-rule-disallowed-list`, `scss/no-global-function-names`), das Legacy-`if()` fängt SCSS-3.
- **SCSS-3** [MUSS · Ist · CI] Eigene Deprecation-Warnungen sind Fehler, erlaubt ist nur `[import]` in der Theme-Brücke. Check: `scripts/sass-deprecation-check.sh` baut ohne `quiet_deps`, das sonst auch eigene Partials verschweigt.
- **SCSS-4** [MUSS · Ist · Review] Eigener Code ist ein `@use`/`@forward`-Modulbaum (Hausregel, Owner 1. 10. 2026). Minimal Mistakes bleibt `@import`-basiert (Issue #5026) und hängt an der Theme-Brücke: Sie lädt `abstracts/tokens` mit `as *`, damit die `!default`-Variablen des Themes unsere Werte übernehmen, und importiert danach Skin und die Theme-Partials einzeln (Liste aus `_sass/minimal-mistakes.scss` des gepinnten Commits, ARCH-1). Folgen: (a) Der Skin steht fest auf `dark` in der Brücke, `minimal_mistakes_skin` in `_config.yml` ist nur Doku (Partials laufen nicht durch Liquid). (b) Theme-`@extend` wirken nicht mehr in eigene Module (Register R-34). (c) Schalter wie `$crt-variante` sind `!default` und lassen sich in `_custom.scss` per `@use "components/view-transition" with (…)` setzen. (d) Platzhalter-Ausgabe erscheint dort, wo `abstracts/mixins` zum ersten Mal geladen wird, deshalb steht es in `_custom.scss` ausdrücklich vor `base/headings`. Fällt das `@import` im Theme weg, entfällt die Brücke.

### 9.2 Benennung

- **SCSS-5** [MUSS · Soll · CI-P2] Klassen BEM in kebab-case: `block__element--modifier`. `--modifier` = statische Variante aus Markup. `is-*`/`has-*` = Laufzeitzustand aus JS.
- **SCSS-6** [MUSS · Soll · Review] Keine neuen eigenen Elemente in MM-Namensräumen (`page__`, `masthead__`, `archive__`, `toc__`).
- **SCSS-7** [MUSS · Ist · CI] Variablen, Mixins, Platzhalter, Custom Properties und Keyframes in kebab-case. Keyframes mit Block-Präfix (`neon-orbit-ramp-before`, `toc-slide-in-from-bottom`), nur das allgemeine `fade-in` in `base/_animations.scss` hat keinen Block. Beim Umbenennen JS-Referenzen mitziehen (`hero-crt.js` liest die Tube-Boot-Namen). Stylelint prüft Keyframes (`keyframes-name-pattern`), Mixins und Custom Properties (Standard-Config). `scss/dollar-variable-pattern` ist aus, der Bestand an Variablen ist trotzdem kebab-case.
- **SCSS-8** [MUSS · Ist · Review] Komponenten-Tokens tragen das Block-Präfix (`$fp-*`) und zeigen nur auf globale Tokens (FARB-1). Erfüllt in `fractal-panel/_tokens.scss`, Farbliterale fängt `color-guardrail.sh`.
- **SCSS-20** [MUSS · Ist · Review] Bezeichner sind englisch, mit diesen Ausnahmen: fachliche Varianten-Namen der Choreografien (`$crt-variante`, `$glitch-variante` und ihre Werte wie `antenne`), deutsche Daten- und Paletten-Schlüssel, die sichtbaren Text spiegeln. Neue deutsche Bezeichner nur in diesen Gruppen. Kommentare deutsch (SCSS-14).

### 9.3 Spezifität und Kaskade

- **SCSS-9** [MUSS · Soll · CI-P2] Spezifität höchstens (0,4,2), keine IDs. Ausnahme: Overrides von Theme-ID-Regeln (`#main`) mit Kommentar.
- **SCSS-10** [MUSS · Soll · Review] Gegen das Theme mit Spezifität statt `!important`, Rechnung im Kommentar („(0,2,1) > (0,1,1)“). Das `body`-Präfix im Masthead ist ein sanktioniertes Muster.
- **SCSS-11** [MUSS · Ist · Review] Die Theme-Regel `.page__content h2 { border-bottom; padding-bottom }` wird immer **explizit** zurückgesetzt. Weglassen reicht nie.
- **SCSS-12** [MUSS · Ist · CI] `!important` nur in Kategorie d. Kategorien: (a) überflüssig, löschen. (b) durch Spezifität ersetzbar. (c) durch Umbau ersetzbar (Zustandsklasse, Reihenfolge). (d) unvermeidbar: Reduced-Motion-Kill-Switch, Print, Überstimmen eines Inline-Styles aus JS, Überstimmen einer Theme-Utility mit `!important`. Marker: `// !IMPORTANT-KEEP (Kategorie d, …)` plus `stylelint-disable-next-line declaration-no-important -- Grund`.
- **SCSS-13** [SOLL · Soll · Review] Zustände über eine Zustandsklasse oder ein `data-`-Attribut statt gestapelter Selektoren.

### 9.4 Kommentare und Format

- **SCSS-14** [MUSS · Ist · Review] Kommentare deutsch, nur `//`. `/* */` nur für Stylelint-Blockdirektiven.
- **SCSS-15** [SOLL · Soll · Review] Dateikopf: Banner `// ===`, Titel, Zweck, Zeilen `Markup:` / `JS:` / `Tokens:`.
- **SCSS-16** [MUSS · Soll · Review] Kommentare erklären das Warum des Ist-Zustands. Werthistorie (`// vorher 3.5rem`) gehört in die Commit-Message. A11y- und Owner-Gründe bleiben im Kommentar.
- **SCSS-17** [MUSS · Soll · Review] Keine auskommentierten Alternativwerte, keine toten Selektoren, keine px-Umrechnungen an em- oder rem-Werten.
- **SCSS-18** [MUSS · Soll · CI-P1] `stylelint-disable` regelgenau, mit ` -- Begründung`, Blöcke mit `stylelint-enable` schließen. Generierte Dateien über `ignoreFiles`.
- **SCSS-19** [MUSS · Ist · CI] 2 Leerzeichen nach Klammertiefe, LF, abschließender Zeilenumbruch, kein Leerzeichen am Zeilenende. Editor: `.editorconfig`, Check: `scripts/scss-format.py` (mit `--fix` korrigieren). **[Soll · Review]** `@include` vor den Deklarationen.

### 9.5 Critical-CSS

- **CRIT-1** [MUSS · Ist · CI-P2] Der Inline-Block in `_layouts/default.html` enthält nur Werte, die 1:1 in SCSS existieren (Quelle steht im Kommentar daneben), überstimmt keine Typografie und Farbe (`body{font-family}`, `body{color}`) und hält FARB-8 ein. Einzige bewusste Überstimmung ist `html{font-size:100%}` gegen die Theme-Rampe (Owner-Freigabe 1. 10. 2026, 6.1). Blur nur wie in `backdrop-blur()`, heute keiner. Die Breiten-Queries prüft `bp-guardrail.sh`, den Rest ein geplanter Sync-Check (16.2).
- **CRIT-2** [SOLL · Ist · Review] Er steht vor dem `main.css`-Link oder enthält nur Layout-Stabilisatoren (Masthead-Höhe, Hero-Mindesthöhe). Ist: Er steht danach und enthält nur Stabilisatoren plus die Grundschrift (CRIT-1).
- **CRIT-3** [MUSS · Ist · CI-P2] Außer diesem Block keine Stile in Templates (kein `style=""`, kein weiteres `<style>`). Ausnahme: `style`-Attribute, die kramdown für Tabellenausrichtung erzeugt. Templates, `_data/` und Inhalte sind ohne `style`-Attribut, Inhalte setzen Klassen per kramdown-IAL (MD-2). Kein Check prüft das heute (16.2).

---

## 10 JavaScript-Konventionen

### 10.1 Sprachstand und Aufbau

- **JS-1** [MUSS · Ist · CI] Baseline ES2020 (Optional Chaining wird bereits genutzt). ESLint parst `assets/js` mit `ecmaVersion: 2020`, neuere Syntax ist ein Fehler. Klassische Skripte mit `defer`, keine ES-Module, kein Bundler. **Ausnahme:** `head-early.js` lädt parser-blockierend im `<head>` **ohne** `defer` oder `async`. Der `pagereveal`-Handoff muss vor dem ersten Render laufen. Nie auf `defer` oder `async` umstellen.
- **JS-2** [MUSS · Ist · CI] Code nutzt `const`/`let`, kein `var`. Check: ESLint `no-var` und `prefer-const` für `assets/js` und `service-worker.js`, ohne Ausnahme.
- **JS-3** [MUSS · Ist · CI-P2] Jede Main-Thread-Datei ist eine IIFE mit `'use strict'` als erster Anweisung. Exporte nur über einen expliziten Namespace auf `window` oder `self`. Ein ESLint-Check (`strict`) fehlt (16.2).
- **JS-4** [MUSS · Ist · Review] Dateikopf `/** <datei>.js — Zweck`, dazu Zuständigkeit, Abhängigkeiten, Ladereihenfolge, Event-Verträge. Vorbilder: `site-utils.js`, `skill-graph-sheet.js`, `head-early.js`. Alle Dateien unter `assets/js` erfüllen das.
- **JS-5** [SOLL · Soll · Review] Dateiklassen im Kopf benennen: Shell-Skript (einmal pro Dokument), Seiten-Modul (10.2), DOM-freier Kern oder Worker.
- **JS-6** [SOLL · Soll · Review] Weiche Grenze etwa 600 Zeilen pro Datei. Darüber liegen `fractal-panel.js` (rund 1100) und `skill-graph.js` (rund 1090).
- **JS-21** [MUSS · Ist · Review] Bezeichner englisch. Ausnahmen wie SCSS-20: Varianten-Namen und Daten-Schlüssel, die sichtbaren Text oder SCSS-Varianten spiegeln (z. B. `goldgruen` als Paletten-Schlüssel). Kommentare und Meldungstexte deutsch.

### 10.2 Seiten-Module

Jeder interne Seitenwechsel ist ein volles Laden (ARCH-2). Ein Seiten-Modul ist deshalb ein Defer-Skript, das einmal beim Laden mountet und mit der Seite verschwindet. Einen eigenen Lebenszyklus für Seitenwechsel gibt es nicht. Vorbild-Skelett:

```js
/**
 * beispiel.js — Seiten-Modul: …
 * Abhängigkeiten: site-utils.js (vorher geladen). Ladereihenfolge: defer.
 */
(function () {
  'use strict';

  let frame = 0;

  function tick() {
    // zeichnen …
    frame = requestAnimationFrame(tick);
  }

  function stop() {
    cancelAnimationFrame(frame);
    frame = 0;
  }

  function mount() {
    const el = document.querySelector('[data-role="beispiel"]');
    if (!el || el.hasAttribute('data-beispiel-mounted')) return;
    el.setAttribute('data-beispiel-mounted', '');
    // Endlos-Arbeit nur bei sichtbarem Tab (SPA-3)
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stop();
      else if (!frame) tick();
    });
    tick();
  }

  mount();
})();
```

- **SPA-1** [MUSS · Ist · CI] Seiten-Module mounten einmal beim Laden: Als Defer-Skript aus `_includes/scripts.html` (oder `after_footer_scripts`) rufen sie am Dateiende `mount()` auf, das DOM steht dann fertig. Kein Warten auf `DOMContentLoaded`, kein Remount bei `pageshow` (die bfcache-Rückkehr stellt die Seite samt Listenern wieder her). Einmal-Effekte warten im Prerender auf `AuflinieUtils.whenActivated` (PERF-4). Check: `tests/navigation.spec.js` (Marker je Modul genau einmal, ohne Fehler, 16.1).
- **SPA-2** [MUSS · Ist · Review] `mount()` sucht im `document`, bricht ohne sein Element ab und setzt den Marker `data-<modul>-mounted` (Schutz vor doppeltem Laden, Anker für Tests). Ohne Marker kommen `hero-crt.js` (geprüft über `.loaded` am Hero) und `neon-orbit-toggle.js` aus.
- **SPA-3** [MUSS · Ist · Review] Endlos-Arbeit (rAF-Schleifen, Canvas-Rauschen, Simulationen) pausiert bei verdecktem Tab (`visibilitychange`), Endlos-Animationen außerhalb des Viewports per IntersectionObserver (PERF-7). Aufräumen für den Seitenwechsel entfällt, das Laden der nächsten Seite räumt alles ab. Kein `unload`- oder `beforeunload`-Listener, er schlösse die Seite vom bfcache aus. Zustand, der eine bfcache-Rückkehr nicht überstehen soll, setzt `pageshow` mit `persisted` zurück (heute der Drawer in `greedy-navigation.js` und `vt-capture` in `tv-switch.js`).
- **SPA-4** entfallen (5. 10. 2026, Ausbau der SPA-Navigation): Ohne Content-Swap laufen auch Skripte, die im Inhalt stehen. Inline-Skripte verbietet weiter SEC-4.
- **SPA-5** [MUSS · Ist · Review] Wer die Speculation-Rules-Ausschlüsse (SEO-5) ändert, zieht im selben Commit `tests/navigation.spec.js` und `docs/features/seitenwechsel.md` nach.
- **SPA-6** entfallen (5. 10. 2026, Ausbau der SPA-Navigation): Ohne `spa-nav.js` gibt es weder PE-Fallback noch Früh-Mount, jedes Modul mountet direkt (SPA-1).

### 10.3 Navigation und Übergänge

Owner-Lehren aus der TV-Umschalt-Architektur. Sie werden nicht wieder eingebaut.

- **TV-1** [DARF NICHT · Ist · Review] Kein `skipTransition` und kein Hero-only-Gating der View Transition. Der Header steht bei jedem internen Seitenwechsel (Chromium und Safari, Firefox ohne Cross-Document-VT lädt normal, ARCH-2). Der CRT-Effekt ist dosiert (Owner-Entscheidung): nur mobil, nur von ganz oben, nur bei einem Bereichswechsel und höchstens einmal je Cooldown von 6 s (`crtAllowed()` in `tv-switch.js`, Details in `docs/features/tv-umschalt.md`).
- **TV-2** [DARF NICHT · Ist · Review] Den Drawer nicht vor der Navigation schließen und die Navigation daran verketten (`transitionend` plus Timer). Der Drawer slidet innerhalb der Transition raus.
- **TV-3** [MUSS · Ist · Review] `menu-open` erst nach dem Slide entfernen, nie synchron beim Schließen (Ganzseiten-Reflow mitten in der Animation).
- **TV-4** [MUSS · Ist · Review] Der `pagereveal`-Listener läuft parser-blockierend im Head (JS-1, `head-early.js`).
- **TV-5** [DARF NICHT · Ist · Review] Kein `backdrop-filter` auf dem Drawer (KOMP-6).

### 10.4 Muster

- **JS-7** [MUSS · Soll · Review] JS-Hooks über `data-role` relativ zur Modulwurzel. IDs nur für Singletons und Anker. Keine Styling-Klassen als Hooks.
- **JS-8** [MUSS · Soll · Review] Werte, die CSS besitzt (Dauern, Höhen, Breakpoints, Farben), liest JS per `getComputedStyle(…).getPropertyValue('--token')`. Fallbacks gleichen dem Token, Kommentar `// Spiegel zu <datei>: --token`. Ausnahme Breakpoints: `AuflinieUtils.mq` (BP-2).
- **JS-9** [MUSS · Soll · Review] Keine Design-Farben im JS. DOM-Optik über Klassen, Canvas über CSS-Kanal-Tokens. Fraktal-Paletten sind Daten und ausgenommen.
- **JS-10** [MUSS · Soll · Review] Fachliche Zahlen als `CONSTANT_CASE` mit Einheit (`_MS`, `_PX`) am Modulkopf.
- **JS-11** [MUSS · Soll · CI-P2] Feature-Detection vor Plattform-APIs. Kein UA-Sniffing, Eingabeart über `matchMedia('(pointer: coarse)')`.
- **JS-12** [MUSS · Soll · Review] Handler für `touchstart`, `touchmove` und `wheel` (auch das veraltete `mousewheel`) sind `passive`, solange sie `preventDefault()` nicht brauchen (Pinch und Wheel-Zoom auf den Fraktal-Canvas, Skill-Graph). Bei `scroll` und `resize` bewirkt `passive` nichts, beide lassen sich nicht abbrechen (die Option schadet dort nicht). Scroll- und Resize-Handler sind gedrosselt, per rAF (`AuflinieUtils.rafThrottle`) oder per Debounce, beides gilt als gleichwertig. Ausgenommen sind reine Messungen über `AuflinieUtils.onDocumentResize`, sie lesen bewusst im Ereignis vor allen Schreibzugriffen (PERF-8). Lesen und Schreiben nach PERF-8: Ein Resize-Handler schreibt nie direkt im Ereignis, sondern im rAF oder nach dem Debounce.
- **JS-13** [MUSS · Soll · Review] Storage-Zugriffe in `try/catch` mit sinnvollem Fallback (SEC-6).
- **JS-14** [MUSS · Soll · CI-P2] Kein `console.log` (erfüllt). `console.warn` und `console.error` im Format `'<dateiname>: <Meldung>'`. Leere `catch`-Blöcke mit `/* noop: Grund */`.
- **JS-15** [MUSS · Soll · Review] Benennung: camelCase, PascalCase für Klassen und Namespaces, `CONSTANT_CASE` für Modulkonstanten, Booleans mit `is`/`has`/`should`, Lebenszyklus `mount`/`teardown`, Instanzen `destroy`.
- **JS-16** [SOLL · Soll · Review] Namensräume: Events `auflinie:<thema>`, Storage-Keys `auflinie:<modul>:<zweck>`, interne Brücken `window.__auflinie*`. Bestehende Keys erst bei Berührung migrieren, sonst verlieren Besucher Zustände.
- **JS-17** [MUSS · Soll · Review] Worker: dünner Wrapper plus Kern per `importScripts`, Messages `{ requestId, …params }` mit Echo, Ergebnisse als Transferables. Mehrzweck-Kanäle (Service Worker) als `{ type: 'SCREAMING_SNAKE', … }`.
- **JS-18** [SOLL · Soll · Review] Logik, die zum zweiten Mal gebraucht wird, wandert in einen gemeinsamen Helfer: `assets/js/site-utils.js` mit Namespace `window.AuflinieUtils`, in `_includes/scripts.html` als **erstes** Skript geladen, vor allen Nutzern. Skripte aus dem `<head>` laufen davor und nutzen die Helfer nicht. **[Ist]** Die Datei existiert mit `prefersReducedMotion` und `onReducedMotionChange` (BEW-1a, Nutzer `toc.js`, `back-to-top.js`, `tv-switch.js`, `skill-graph.js`), `rafThrottle` (Nutzer `toc.js`, `back-to-top.js`, `greedy-navigation.js`, `fractal-panel.js`), `inertOutside` (Hintergrund modaler Ebenen `inert` ohne Skripte und Live-Regionen, OVL-4, Nutzer `greedy-navigation.js`, `toc.js`, `skill-graph-sheet.js`), `whenActivated` (Einmal-Effekte erst nach der Aktivierung eines Prerenders, PERF-4, Nutzer `hero-crt.js`, `blog-notice.js`), `onDocumentResize` (gecachte Maße für den Scrollpfad, PERF-8, Nutzer `toc.js`, `back-to-top.js`) und `mq` (Breakpoints, BP-2, Nutzer `toc.js`, `tv-switch.js`, `greedy-navigation.js`, `fractal-panel.js`). **[Soll]** `baseUrl` und `cssDurationMs` (MO-5) fehlen noch.
- **JS-19** [MUSS · Soll · Review] Formatierung: 2 Leerzeichen (auch in Workern), einfache Anführungszeichen, Semikolons, LF, kein Leerzeichen am Zeilenende. Einzeilige Guards ohne Klammern erlaubt.
- **JS-20** [SOLL · Soll · Review] JSDoc mit `@param` und `@returns` für alles, was über einen Namespace exportiert wird. Nur TypeScript-kompatible JSDoc-Syntax.

---

## 11 Sicherheit und Datenschutz

Die Seite ist statisch, hat keine Nutzerkonten und keine Formulare. Die realistischen Risiken sind deshalb andere als bei einer Web-Anwendung: eine manipulierte Lieferkette, der mit anderen Projekten geteilte Origin `grenzenloseschublade.github.io`, versehentlich eingeschleustes Markup und rechtliche Pflichtangaben. Hintergrund und Befund-IDs: `docs/audits/2026-10-01-security.md`.

### 11.1 DOM-Sinks im eigenen JavaScript

- **SEC-1** [MUSS · Ist · CI-P1] Werte, die nicht als Literal im Quelltext stehen, gelangen nur über `textContent`, `setAttribute` (außer `on*`, `src`, `href` mit fremdem Inhalt), `createElement` oder `canvas.fillText` ins DOM. Kein `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `document.write` oder `createContextualFragment` mit dynamischen Werten. Kein `eval`, kein `new Function`, kein `setTimeout`/`setInterval` mit String, keine `javascript:`-URLs. URL-Bestandteile (`location.search`, `location.hash`, `document.referrer`, `window.name`) und Storage-Werte gelten als unvertrauenswürdig und steuern nur Vergleiche, Booleans oder `getElementById`. Erlaubte Ausnahme mit Begründungskommentar: statische Literale in `sw-register.js`. Check geplant: ESLint mit `eslint-plugin-no-unsanitized` sowie `no-eval`, `no-implied-eval`, `no-new-func`, `no-script-url`.

### 11.2 Liquid-Ausgabe

- **SEC-2** [MUSS · Soll · Review] Werte innerhalb von `<script>` (auch `application/json` und `application/ld+json`) werden als `{{ wert | jsonify | replace: '</', '<\/' }}` ausgegeben, ohne umgebende Anführungszeichen. Jekylls `jsonify` maskiert `</` nicht. Keine Liquid-Werte in JavaScript-String-Literalen. Konfiguration gelangt als `data-*`-Attribut an `<html>`. Freitext aus Front Matter und `_data` in HTML-Text mit `| escape` (SOLL), gewollter Rich-Text mit `| markdownify`. Der Skill-Graph-Datenblock folgt dem Muster, das JSON-LD in `head/custom.html` ebenso.

### 11.3 Content Security Policy

- **SEC-3** [MUSS · Ist · CI] Genau eine CSP als `<meta http-equiv>` in `_includes/head.html`, vor dem ersten `<script>`, auf allen Seiten byte-identisch. `script-src` enthält weder `'unsafe-inline'` noch `'unsafe-eval'`. Einzige Inline-Ausnahme: der `speculationrules`-Block aus `_includes/head/custom.html`, erlaubt per `'sha256-…'` über den gebauten Block. Das Schlüsselwort `'inline-speculation-rules'` kennt WebKit nicht (Fehler in der Konsole, Block geblockt), Firefox warnt. `csp-check.py` vergleicht den Hash mit dem gebauten Block und nennt bei einer Änderung den neuen Wert. Keine Direktive enthält `https:`, `http:` oder `*`. Neue Quellen werden einzeln und im selben Commit wie die Funktion ergänzt, die sie braucht. Check: `scripts/csp-check.py` im Build-Job.
- **SEC-3a** [SOLL · Ist · Review] `style-src 'unsafe-inline'` bleibt nur, solange MathJax CHTML und kramdown-Tabellenausrichtung es erfordern. `worker-src blob:` bleibt nur, solange der MathJax-Sprach-Worker aktiv ist.
- Hinweis: Auf GitHub Pages wirken `frame-ancestors`, `report-uri`, `sandbox` und Report-Only per Meta-Tag nicht. Die CSP schützt nicht vor Skripten auf Geschwister-Projekten desselben Origins und nicht vor Fetches des Service Workers.

### 11.4 Inline-Skripte und Event-Handler

- **SEC-4** [MUSS · Ist · CI] Kein ausführbares Inline-`<script>`. Erlaubt sind nur Datenblöcke (`application/json`, `application/ld+json`) und `speculationrules`. Keine Inline-Event-Handler (`onclick=` …) in Templates, Markdown oder `_data`. Seitenspezifisches Verhalten steht in einem Seiten-Modul (SPA-1). Was parser-blockierend früh laufen muss, steht als externe Datei ohne `defer`/`async` im `<head>` (JS-1). Checks: `scripts/security-guardrail.sh` (Quellen samt `_posts` und `_drafts`, Code-Beispiele in Markdown ausgenommen) und `scripts/csp-check.py` (gebaute Seiten).

### 11.5 Service Worker

- **SEC-5** [MUSS · Ist · CI] Cache-Namen tragen den Projektpräfix `CACHE_PREFIX` mit Version. Jedes `caches.delete` steht hinter `startsWith(CACHE_PREFIX)`, Aufräumen in `activate`. Gelesen wird nur aus dem eigenen Cache. Kein `getRegistrations()`, nur die eigene Registrierung (`getRegistration(<baseurl>/)`). Check: `scripts/security-guardrail.sh`.
- **SEC-5a** [MUSS · Ist · Review] Same-Origin-Prüfung per `new URL(url).origin === self.location.origin` plus Pfad unter `self.registration.scope`. Kein `mode: 'cors'`, keine ungeprüften URL-Listen aus `postMessage`. Navigationsantworten mit `redirected === true` als `Response.redirect(response.url)` weitergeben. Erfüllt in `service-worker.js` (`fetch`-Handler und `handleNavigation`), `postMessage` kennt nur `SKIP_WAITING`.
- **SEC-5b** [MUSS · Ist · Review] Update nur nach Bestätigung durch den Toast (kein unbedingtes `skipWaiting`).
- **SEC-5c** [MUSS · Ist · CI] Der Präfix hat genau eine Quelle: `sw_cache_prefix` in `_config.yml`. `service-worker.js` baut `CACHE_PREFIX` per Liquid daraus, `sw-register.js` liest ihn aus `data-sw-cache-prefix` am `<html>`. Ein leerer Präfix ist verboten, er passte auf jeden Cache des geteilten Origins. Check: `scripts/security-guardrail.sh` (Präfix gesetzt, kein zweites Literal) mit Negativtests.
- **SEC-5d** [SOLL · Soll · Review] Ein getesteter Kill-Switch-Worker (eigene Caches löschen, `registration.unregister`, Clients neu laden) liegt bereit und ist im README beschrieben. Fehlt noch. Spätestens Wochen vor einem Domain-Umzug nötig, sonst hängen Wiederkehrer am alten Worker fest.
- **SEC-5e** [MUSS · Ist · CI] Jede JS- und CSS-URL, die das HTML einbindet, trägt die Build-Version `?v={{ site.time | date: '%s' }}`, und `CACHE_URLS` nennt genau dieselbe URL. Ohne Version nahm WebKits Speicher-Cache nach einem Deploy bis zu zehn Minuten die alte Datei zum neuen HTML. Ohne Version bleiben nur Dateien, die Skripte selbst laden (Worker, MathJax-Komponenten). Check: `tests/visual/precache.spec.js`.

### 11.6 Browser-Speicher

- **SEC-6** [MUSS · Ist · Review] localStorage und sessionStorage enthalten nur nicht identifizierende UI-Zustände. Keine IDs, keine sitzungsübergreifenden Zeitstempel, keine personenbezogenen Daten. Jeder Zugriff steht in `try/catch`, die Seite funktioniert ohne Speicher. Neue Speicherzwecke kommen im selben Commit in die Datenschutzerklärung (`_pages/datenschutz.md`, SEC-10a). Neue Schlüssel tragen den Präfix `auflinie:` (JS-16), weil alle Projekte des Origins denselben Speicher teilen.

### 11.7 GitHub Actions

- **SEC-7** [MUSS · Ist · CI] Jede `uses:`-Referenz ist eine volle 40-stellige Commit-SHA mit Versionskommentar. Check: `scripts/security-guardrail.sh`.
- **SEC-7a** [MUSS · Ist · Review] Workflow-Ebene nur `permissions: { contents: read }`, Schreibrechte (`pages: write`, `id-token: write`) ausschließlich im Deploy-Job. `actions/checkout` mit `persist-credentials: false`. Das Pages-Artefakt wird hochgeladen, bevor ein Schritt Fremdcode mit Schreibzugriff auf das Arbeitsverzeichnis ausführt (heute der Playwright-Container mit `npm ci`), und alle Prüfungen des Deploy-Builds laufen davor. Kein `pull_request_target`, kein `workflow_run` mit fremdem Code, keine `${{ github.event.* }}`-Ausdrücke direkt in `run:`.
- **SEC-7b** [MUSS · Ist · Review] CI-Trigger nach GIT-6. Die Owner-Policy zu Dependabot gilt: **Alerts an, automatische Security-Update-PRs aus** (Repo-Einstellung), keine `pull_request`-Trigger. `vulnerability-alerts` wird nie per API gelöscht, das schaltet die Anzeige ab. Ein künftiger Audit-Job hebt diese Policy nicht auf.
- **SEC-7c** [SOLL · Ist · Review] Dependabot-Versionsupdates nur für `github-actions`, monatlich, alle Updates in einem PR, höchstens ein offener PR (`.github/dependabot.yml`, seit `848efe2`). Sie halten die SHA-Pins aktuell. Vom Owner am 1. 10. 2026 ausdrücklich entschieden. Die Policy aus SEC-7b betrifft nur Security-Update-PRs.
- **[Offen]** Repo-Einstellung „Require actions to be pinned to a full-length commit SHA“, `zizmor` im Lint-Job.

### 11.8 Abhängigkeiten, Theme und Vendor-Dateien

- **SEC-8** [MUSS · Ist · CI] `remote_theme` ist auf eine Commit-SHA gepinnt (Check: `scripts/security-guardrail.sh`). Installationen laufen über Lockfiles (`npm ci`, `bundle install` gegen `Gemfile.lock`), auch in `.devcontainer/*.sh`.
- **SEC-8a** [MUSS · Soll · CI-P2] Dateien unter `assets/vendor` sind unveränderte Upstream-Dateien. Ihre Prüfsummen stehen in `assets/vendor/SHA384SUMS` (Format von `sha384sum`, Pfade relativ, `LC_ALL=C` sortiert, in `exclude`). Prüfen: `cd assets/vendor && sha384sum -c --strict --quiet SHA384SUMS`. Neu erzeugen: `find . -type f ! -name SHA384SUMS -printf '%P\n' | LC_ALL=C sort | xargs -d '\n' sha384sum > SHA384SUMS`.
- **SEC-8b** [SOLL · Soll · CI] `Gemfile.lock` mit `CHECKSUMS`-Abschnitt (`bundle lock --add-checksums`). Ungenutzte Theme-Assets stehen in `exclude`. Jekyll fragt `exclude` für Theme-Assets nicht ab, das übernimmt `_plugins/theme-assets-exclude.rb` (CI-Gate für die Theme-Skripte). Devcontainer ohne weitergereichten Host-Token, Image per Digest. Bestand: R-84 (Digest).
- **SEC-8c** [KANN · Offen · Review] Kein Audit-Schritt, der dauerhaft rot ist. Alle npm-Pakete sind Dev-Werkzeuge (Lint, Tests), die Site liefert keinen npm-Code aus. `npm audit` meldet seit Oktober 2026 `braces` (GHSA-vfj7-8cjw-p6xm, Denial of Service durch tief verschachtelte Muster, high) über `micromatch` und `fast-glob` unter `stylelint`, ohne verfügbaren Fix. Ein Schritt mit `--audit-level=high` bliebe rot, bis Stylelint die Kette ersetzt, und würde übergangen. Neue Lücken melden die Dependabot-Alerts (SEC-7b). Ein Audit in der CI käme nur als Information ohne Abbruch (`npm audit` und `bundle-audit check --update`, Ergebnis nur im Log) in einen bestehenden Job, ohne zusätzliche Trigger und Artefakte (GIT-6). Manuell: `npm audit` vor einem Werkzeug-Update.
- **SEC-8d** [SOLL · Ist · CI] Vendor-Bibliotheken werden nur aktualisiert, wenn der Changelog Fixes für Bedienung, Barrierefreiheit oder Sicherheit enthält, die unsere Nutzung betreffen (Owner 1. 10. 2026). Ein Wechsel übernimmt nur die heute ausgelieferten Dateien unverändert aus dem offiziellen npm-Paket, führt die Version in `THIRD-PARTY-NOTICES.md` nach, erzeugt `assets/vendor/SHA384SUMS` neu (SEC-8a). Check: `tests/vendor.spec.js` (16.1).

### 11.9 Externe Links und Ressourcen

- **SEC-9** [MUSS · Ist · CI] Kein Laden von Ressourcen fremder Hosts (Script, Stylesheet, Font, Bild, Iframe, Video, `@import`, `url()`). Alles wird selbst gehostet. Reine `<a href>`-Links sind erlaubt, `target="_blank"` nach LINK-3. Keine `http://`-URLs, für Ressourcen ohne Ausnahme. Ein Hyperlink auf `http://` im Inhalt ist unerwünscht, blockiert aber nicht (Owner 4. 10. 2026: ein alter Link in einem Gastbeitrag soll die Veröffentlichung nicht aufhalten), beim Einpflegen nach Möglichkeit auf `https://` umstellen. Theme-Features mit Dritt-Origins (Teilen-Buttons, Analytics, Kommentare) bleiben aus. Wer sie einführt, ändert im selben Commit CSP, Datenschutzerklärung und gegebenenfalls Einwilligung. Check: die CSP (SEC-3) und `csp-check.py` (`http://` in Ressourcen, übrigen URL-Attributen und HTML-Kommentaren als Fehler, in `<a href>` und `<area href>` als Warnung).

### 11.10 Personenbezogene Daten, Impressum, Datenschutz

- **SEC-10** [MUSS · Ist · CI-P2] Commits tragen die noreply-Adresse von GitHub (alle seit Einführung des Guides, ältere Commits nicht). Bilder in `assets/images` sind frei von GPS-, Kamera-, Seriennummer-, Autor- und Konto-Metadaten (`exiftool`-Stichprobe 2. 10. 2026 ohne Befund). Kontaktdaten nur im Kontaktbereich von „Über mich“ und nur, was der Owner freigibt (heute GitHub). Keine Lebenslauf- oder Office-Dateien im Repo oder in `_site`. `Lebenslauf-soprasteria/` bleibt in `.gitignore` **und** in `exclude`. Projektdetails zu Arbeitgebern und Kunden nur in der Tiefe, die die jeweilige Richtlinie erlaubt (SOLL).
- **SEC-10a** [MUSS · Ist · Review] Die Datenschutzerklärung `_pages/datenschutz.md` (`/datenschutz/`) ist von jeder Seite aus über den Footer verlinkt (`_data/navigation.yml`, Liste `footer`, ARCH-4). Neue Datenverarbeitungen (Speicher, Dienste, Hosting, Kontaktwege) werden dort im selben Commit nachgetragen, samt Zeile „Stand“ und der Schlüsselliste im Kommentar am Seitenanfang. Owner 6. 10. 2026: kurze Seite ohne Impressum (Entscheidung vom 1. 10. bleibt), nötig, weil GitHub Pages IP-Adressen protokolliert und die Haushaltsausnahme hier nicht greift. Keine Rechtsberatung, Grundlage ist der Security-Bericht, Abschnitt 5.
- **Entschieden (Owner, 1. 10. 2026): kein Impressum.** Begründung: Privatperson. Das Restrisiko aus § 18 Abs. 1 MStV ist benannt (keine Rechtsberatung). Neu bewertet wird erst, wenn sich der Charakter der Seite ändert (Freelance-Angebote, Werbung, Affiliate, dann auch § 5 DDG). Bis dahin wird das nicht erneut vorgeschlagen.

### 11.11 Secrets

- **SEC-11** [MUSS · Ist · Review] Keine Tokens, Schlüssel oder Passwörter im Repo, auch nicht in Beispielen. `.env` und `.env.*` bleiben ignoriert. Eine `.env.example` gibt es nicht, kein Plugin braucht einen Token (die frühere Vorlage nannte `jekyll-gist` und `jekyll-github-metadata`, beide nicht im Bundle). Der Workflow braucht keine Secrets außer dem automatischen `GITHUB_TOKEN`. Secret Scanning mit Push Protection ist aktiv (geprüft 5. 10. 2026 per `gh api repos/grenzenloseSchublade/auflinie`).

### 11.12 Veröffentlichung und Indexierung

- **SEC-12** [MUSS · Soll · CI-P3] Interne Seiten tragen `sitemap: false` und `noindex: true`. `head/custom.html` rendert daraus `<meta name="robots" content="noindex, nofollow">` (heute `404.html` und `offline.html`). Kein `Disallow` in `robots.txt`, ein gesperrter Crawler sieht das `noindex` nie. `_site` enthält nur erwartete Pfade (SOLL).

---

## 12 HTML, Liquid, Front Matter, Daten

### 12.1 HTML

- **HTML-1** [MUSS · Soll · Review] `<button type="button">` für Aktionen, `<a href>` für Navigation. `type` ist Pflicht (im gebauten Markup aller Seiten erfüllt, Stand 4. 10. 2026). Bestand: R-83 (Orbit-Auslöser im Neon-Namen).
- **HTML-2** [MUSS · Ist · CI-P4] Landmarks: `<header class="masthead">`, `<main id="inhalt">`, `<footer>`. `<main id="inhalt">` fasst Hero und Inhalt, die H1 im Hero liegt also in der Hauptregion, und „Zum Inhalt springen“ zeigt dorthin. Darin trägt ein `<div id="main">` den Theme-Stil von `#main` (Breite, Innenabstand, Einblendung). Ein `<main>` pro Seite, auch auf `offline.html`. Jedes `<nav>` mit deutschem `aria-label`, sobald es mehrere gibt. `role="region"` nur für Bereiche mit Überschrift. Umgesetzt in `_includes/masthead.html`, `_layouts/single.html`, `_layouts/splash.html` (lokales Override) und `offline.html`.
- **HTML-3** [MUSS · Soll · Review] Bilder mit `alt`, `width`/`height` als ganze Pixelzahlen.
- **HTML-4** [MUSS · Soll · Review] Zitatquelle außerhalb von `<blockquote>`: `<figure><blockquote>…</blockquote><figcaption>– Autor</figcaption></figure>`.

### 12.2 Liquid

- **LIQ-1** [MUSS · Soll · Review] Jedes eigene Include beginnt mit einem `{% comment %}`-Docblock: Zweck, Einbindungsort, `Parameter:` mit Typ, Werten und Default. Theme-Overrides vermerken „Lokales Override: Grund“.
- **LIQ-2** [MUSS · Soll · Review] Parameter in snake_case, Zugriff `include.x | default: …`.
- **LIQ-3** [MUSS · Soll · Review] Interne URLs immer `{{ '/pfad/' | relative_url }}` mit führendem Slash. Kein `{{ site.baseurl }}/…`-Verketten (Ausnahme: Speculation-Rules-Pattern). In Inhalten (`_posts`, `_drafts`, `_pages`) meldet `content-check.py` Pfade ab der Wurzel ohne `relative_url` (16.1).
- **LIQ-4** [MUSS · Ist · Review] Seitenspezifisches JS und CSS nur über Front-Matter-Flags (`blog_search`, `blog_notice.enabled`, `fractal_panels`, `mathjax`, `toc`, `skill_graph.enabled`, `skill_graph.graph`, `header.crt_power`, `neon_name`, `site_schema`, `person_schema`, `noindex`, `styleguide`), nie über `page.url ==`. Erlaubt bleibt der Vergleich für die Aktiv-Markierung im Menü (`masthead.html`), er lädt kein JS oder CSS.
- **LIQ-5** [MUSS · Soll · CI] Entwickler-Notizen als `{% comment %}`, nicht als `<!-- -->` (die gehen an jeden Besucher). Ausnahmen: die Konfigurationswarnung in `fractal/panel.html` (soll im Quelltext sichtbar sein) und Kommentare aus nicht überschriebenen Theme-Includes (Lizenzkopf aus `copyright.html`, Platzhalter aus `footer/custom.html`, Autorenprofil). `scripts/content-check.py` prüft die Inhaltsquellen (`_posts`, `_drafts`, `_pages`, `_data`, Code-Blöcke ausgenommen). Für Includes und Layouts ist der Post-Build-Grep geplant (16.2), er nimmt die Ausnahmen aus.
- **LIQ-6** [SOLL · Soll · Review] 2 Leerzeichen, Liquid-Ausgaben nicht über Zeilen umbrechen, Variablen englisch in snake_case, Liquid-Strings in einfachen, HTML-Attribute in doppelten Anführungszeichen, `{%- -%}` nur paarweise in Attribut-, Listen- und `<head>`-Kontexten.
- **LIQ-7** [MUSS · Soll · Review] Kein Markup im `title` (Name im DOM korrekt schreiben, Effekte per CSS oder `aria-hidden`-Spans).

### 12.3 Front Matter

- **FM-1** [SOLL · Soll · Review] Gemeinsame Werte (`layout`, `author_profile`, `header.overlay_image`, `overlay_filter`, `toc_label`, `toc_icon`) in die `defaults` von `_config.yml`. Front Matter enthält nur Abweichungen.
- **FM-2** [SOLL · Soll · Review] Reihenfolge: `title`, `excerpt`, `permalink`/`date`, `last_modified_at`, `layout`, `header`, `toc*`, Feature-Flags, `categories`, `tags`.
- **FM-3** [MUSS · Ist · Review] `assets/downloads/post-template.md` ist die Referenz-Vorlage für Beiträge und wird bei jeder Regeländerung nachgezogen. Sie muss selbst ein gültiger Beitrag sein (beginnt mit `---`). Quelle ist `assets/downloads/post-template.txt`: Eine `.md`-Datei mit Front Matter würde Jekyll nach HTML übersetzen, die `.txt`-Quelle gibt die Vorlage per `permalink` und `{% raw %}` unverändert aus. Anleitungen stehen darin als `{% comment %}`, nie als `<!-- -->`.

### 12.4 YAML und Markdown

- **YAML-1** [MUSS · Soll · Review] 2 Leerzeichen, Keys englisch in snake_case, Werte deutsch, Prosa in doppelten Anführungszeichen. Ausnahme: Keys, die das Theme vorgibt (`ui-text.yml` und dessen Schlüssel), bleiben in der Theme-Schreibweise.
- **YAML-2** [MUSS · Ist · CI-P3] Mehrabsätzige Prosa oder Listen als `|`-Block, nicht `>-` (Folding macht Listen zu Fließtext). Kein `<br>`, kein HTML, kein `style` in Daten. Betonung per Markdown. Jekyll stellt kramdown auf `hard_wrap: false`: ein einfacher Zeilenumbruch im `|`-Block ist ein Leerzeichen, ein harter Umbruch steht als `\\` am Zeilenende (zwei Zeilen mit `\\` ergeben eine Leerzeile wie früher `<br> <br>`).
- **MD-1** [MUSS · Ist · CI-P3] Code-Fences mit Sprache öffnen und mit blankem ` ``` ` schließen. Ein offener Fence verschluckt den Rest des Beitrags. Für Verzeichnisbäume und Ausgaben `plaintext`, das ergibt dasselbe Markup wie ein Fence ohne Sprache.
- **MD-2** [MUSS · Soll · Review] Kein Inline-HTML für Layout. Klassen per kramdown-IAL (`{: .download-cta}`, Vorbild Beitrag „Blogbeitrag erstellen“). `.text-center` taugt dafür nicht, `layouts/_home.scss` gibt ihm global `margin: 2em 0` mit.
- **MD-3** [MUSS · Ist · CI] Mathe in `_data`: Inline `$…$` mit doppelt escaptem Backslash, Display `$$…$$` mit einfachem, als eigener Absatz ohne umschließendes HTML. Check: `scripts/content-check.py`. `_pages/mandelbrot.md` gibt das `markdownify`-Ergebnis der Abschnitte und Unterabschnitte in `{::nomarkdown}` aus, sonst setzt kramdown es ein zweites Mal und macht aus `\[…\]` ein „[…]“.

---

## 13 Dateien, Benennung und Dokumentation

- **NAME-1** [MUSS · Soll · Review] Dateinamen nach dieser Tabelle. Abweichungen gibt es nur bei Bildern (R-71).

| Art | Schema | Beispiel |
|---|---|---|
| JS, SCSS-Partials, Includes | kebab-case | `skill-graph-sheet.js`, `_view-transition.scss` |
| `_data` | snake_case (Liquid-Zugriff) | `cv_content.yml` |
| `_data` mit Theme-Vorgabe | Theme-Name | `ui-text.yml` |
| Theme-Overrides | Theme-Name behalten | `page__hero.html` |
| Posts | `JJJJ-MM-TT-slug.md`, deutscher Slug | `2025-03-04-blogbeitrag-erstellen.md` |
| Bilder | kebab-case, ASCII, klein | `mandelbrot-preview.jpg` |
| Doku | siehe DOC-5 | |

Dokumentation (Diátaxis):

- **DOC-1** [MUSS · Ist · Review] Dieses Dokument liegt als `STYLEGUIDE.md` im Repo-Root und ist die normative Quelle. Audit- und Sicherheitsberichte liegen datiert unter `docs/audits/`. `README_DEV.md` verweist im Abschnitt „Style Guide“ hierher. Die Pflege-Anleitung für Inhalte ist `docs/pflege.md` (ARCH-5). Owner-Entscheidungen aus der Claude-Memory werden ins Repo übernommen, nachdem jede Zahl gegen den Code geprüft ist.
- **DOC-2** [MUSS · Soll · Review] Doku nennt Variablen statt Zahlen (`$crt-drawer-offset` in `_view-transition.scss`, `COOLDOWN_MS` in `tv-switch.js`). Jede Information hat genau einen Ort.
- **DOC-3** [MUSS · Soll · Review] Ändert ein Commit dokumentiertes Verhalten, Werte, die Speculation-Rules-Ausschlüsse, Tests oder CI, ändert er Doku und Tests mit.
- **DOC-4** [SOLL · Soll · Review] Feature-Dokus nach Vorlage: Zweck in einem Satz, „Stand: Monat Jahr“, Dateien-Tabelle, Verhaltens-Garantien, Verifikation nach Änderungen, bekannte Grenzen.
- **DOC-5** [SOLL · Soll · Review] Feature-Dokus nach `docs/` in kebab-case ohne README-Präfix (`docs/features/seitenwechsel.md`), Entscheidungen als ADR in `docs/entscheidungen/NNNN-titel.md` (Nygard: Kontext, Entscheidung, Konsequenzen). Verweise im Code im selben Commit umstellen.
- **DOC-6** [MUSS · Soll · CI-P3] Doku anredefrei, nie „Sie“. Deutsche Anführungszeichen, Code-Fences mit Sprache, Typografie nach Abschnitt 8.
- **DOC-7** [MUSS · Soll · CI] Je Werkzeug genau eine Versionsquelle: `.ruby-version`, `Gemfile.lock`, `.nvmrc`, `package-lock.json`. Doku und Workflow nennen die Datei, nicht die Nummer (Workflow: `node-version-file`, `cache-version` aus der Versionsdatei abgeleitet, Dev Container: Bundler liest `post-create.sh` aus `Gemfile.lock`. Ruby und Node kommen vorgebaut aus den Features und brauchen dort eine Nummer, `scripts/version-sync-check.sh` verlangt in der CI Gleichstand mit `.ruby-version` und `.nvmrc`). Das Playwright-Image braucht seine Nummer in Workflow, `playwright.config.js` und `tests/README.md`, derselbe Check verlangt dort und in `package-lock.json` die exakte Version von `@playwright/test` aus `package.json`. Bestand: R-69 (Beitrag „Erstellung dieser Website“).

### 13.1 Lizenzen und Fremdcode

- **LIZ-1** [MUSS · Soll · Review] Fremdcode trägt im Dateikopf Herkunft und Lizenz (Beispiel `greedy-navigation.js`: GreedyNav.js, © 2015 Luke Jackson, MIT). Vendor-Dateien behalten ihren Lizenzkopf.
- **LIZ-2** [MUSS · Soll · Review] `THIRD-PARTY-NOTICES.md` listet Theme, Vendor-Bibliotheken (MathJax, noUiSlider, Tom Select, Gumshoe) und Fonts (Font Awesome Free, NewCM, Ubuntu mit Ubuntu Font Licence 1.0) mit Lizenz. Jede Angabe nennt ihren Beleg, nur indirekt belegte sind markiert. Der README-Abschnitt „Komponenten Dritter“ verweist auf die Datei.
- **Entschieden (1. 10. 2026):** `LICENSE` (MIT) für den Code, CC BY 4.0 für die Wissens-Texte (Beiträge, Fraktal-Erklärungen, Downloads). Die Aufteilung und Ausnahmen (Hintergrundbild mit Adobe-Stock-Lizenz) stehen im README-Abschnitt „Lizenz“.

---

## 14 Git

### 14.1 Commits

Format nach Conventional Commits 1.0.0, Betreff auf Deutsch:

```text
typ(scope): Ergebnis in Worten — optional Wirkung oder Grund

Body: Warum, Ursache, Verifikation. Umbruch bei 72.

Co-Authored-By: …
```

- **GIT-1** [MUSS · Ist · Hook] Betreff beschreibt das Ergebnis, Groß- und Kleinschreibung nach deutscher Rechtschreibung, kein Schlusspunkt. Ziel höchstens 72 Zeichen, hart höchstens 100. Aufzählungen in den Body. Schlusspunkt und die harte Grenze prüft der Hook, über 72 Zeichen warnt er nur.
- **GIT-2** [MUSS · Ist · Review] Body bei nicht trivialen Änderungen: Warum, Ursache, wie verifiziert.
- **GIT-3** [MUSS · Ist · Review] `#N` nur für echte GitHub-Issues und -PRs. Interne Aufgaben als Issue anlegen oder mit `T-N` kennzeichnen.
- **GIT-7** [MUSS · Ist · Hook] Typen (abschließend). Der Hook liest sie aus dieser Tabelle (16.1), ihre Bedeutung prüft nur das Review (z. B. `style(scss)` für einen reinen Formatierungs-Commit, 08bae3c):

| Typ | Bedeutung |
|---|---|
| `feat` | neues Verhalten |
| `fix` | Fehlerbehebung |
| `perf` | Leistung |
| `refactor` | Umbau ohne Verhaltensänderung |
| `style` | **sichtbare Gestaltung** ohne neues Verhalten (lokale Definition, abweichend von Angular) |
| `content` | Lesertexte und Daten (`_pages`, `_posts`, `_data`, `index.html`) |
| `docs` | nur Repo-Doku |
| `test` | Tests |
| `ci` | Workflows |
| `build` | Build-Konfiguration |
| `chore` | Wartung, inklusive reiner Formatierung (`chore(lint)`) |
| `revert` | Rücknahme |

`tune` entfällt (wird `style`, `perf` oder `fix`).

- **GIT-8** [MUSS · Ist · Hook] Scopes (abschließend, Einzahl, höchstens einer):

| Gruppe | Scopes |
|---|---|
| Seiten | `home`, `about`, `cv`, `blog`, `mandelbrot` |
| Komponenten | `hero`, `masthead`, `nav`, `tv`, `toc`, `fractal`, `skill-graph`, `sw`, `mathjax`, `seo`, `neon`, `blog-notice`, `author-follow` |
| Querschnitt | `scss`, `js`, `jekyll`, `config`, `a11y`, `security`, `images` |
| Fremdcode | `theme`, `vendor` |
| Infrastruktur | `deps`, `ci`, `tests`, `scripts`, `dev`, `docs`, `lint`, `styleguide` |

Betrifft ein Commit mehrere Bereiche: Scope weglassen oder Commit teilen. Keine Pseudo-Scopes (`polish`, `ui`, `design`, `mobile`, `experiment`). `theme` steht für Anpassungen an Minimal Mistakes und Fehler im Theme, `vendor` für selbst gehostete Bibliotheken unter `assets/vendor/` (Owner, 6. 10. 2026). Alle übrigen Bereiche der Historie sind zugeordnet, etwa `css`, `farben` und `schrift` → `scss`, `spa` und `spa-nav` → `nav`, `fractals` → `fractal`, vollständig mit Anzahl in `docs/commit-bereiche.md`. Der Hook `.githooks/commit-msg` (`scripts/commit-msg-check.py`) liest Typen und Bereiche aus den Tabellen unter GIT-7 und GIT-8, eine neue Zeile hier gilt sofort. Beide Tabellen behalten deshalb ihre Form (Typ bzw. Bereiche in Backticks). Merge-, Revert- und `fixup!`-Commits gehen durch, auch `Reapply "…"`, die Nachricht von Git beim Rückgängigmachen eines Reverts, eine Ausnahme steht als `Ausnahme: GIT-8, Grund` im Body (GOV-4).

### 14.2 Branches

- **GIT-4** [MUSS · Soll · Review] `<typ>/<thema-kebab>` mit den Typen aus GIT-7 (`feat/`, `fix/`, `refactor/`, `content/`, `docs/`). Kein Unterstrich. Altbestand (`feature_…`, `feature/…`) bleibt bis zum Löschen.
- **GIT-5** [SOLL · Soll · Review] Lokaler Merge mit `Merge <branch>: <Zusammenfassung>`. Branches nach dem Merge löschen, regelmäßig `git fetch --prune`.
- **GIT-6** [MUSS · Ist · Review] CI-Trigger sparsam (Owner-Entscheidung, Storage-Limit kontoweit): nur Push auf `main`/`master` und `workflow_dispatch`, Artefakt-Retention 1 Tag. Test-Branches und Pull Requests lösen keinen Lauf aus. Ein manueller Start auf einem Test-Branch baut und prüft nur. Die `concurrency`-Gruppe gilt je Ref, damit er keinen laufenden Deploy von `main` abbricht. Jeder Job hat ein `timeout-minutes`.

### 14.3 Versionierung

Kein SemVer (eine Website hat keine öffentliche API). Ein `CHANGELOG.md` im Format Keep a Changelog ist optional (KANN). Der Guide selbst versioniert nach GOV-7.

---

## 15 Performance, Browser, Tests

### 15.1 Performance-Budget

- **PERF-1** [MUSS · Soll · CI-P4] Core Web Vitals im 75. Perzentil: LCP höchstens 2,5 s, INP höchstens 200 ms, CLS höchstens 0,1. Das sind Feldwerte (Chrome UX Report, soweit vorhanden). Im Labor misst Lighthouse (mobil, gedrosselt) auf `/`, `/cv/`, `/mandelbrot/` und einem Blogbeitrag, INP wird dort über Total Blocking Time angenähert.
- **PERF-2** [SOLL · Offen · CI-P4] Budgets (komprimiert übertragen, Vorschlag, Messbasis im Audit): eigenes JS pro Seite höchstens 50 KB ohne Fraktal-Module und MathJax, `main.css` höchstens 50 KB, Hero-Bild höchstens 150 KB, Critical-CSS höchstens 14 KB (erstes TCP-Fenster).
- **PERF-3** [MUSS · Ist · Review] Das Critical-CSS enthält nur, was für den ersten Viewport ohne Layout-Sprung nötig ist (CRIT-1, CRIT-2).
- **PERF-4** [MUSS · Ist · Review] Prerender per Speculation Rules (`moderate`) für interne Ziele außer den Ausschlüssen aus SEO-5. Einmal-Effekte warten im Prerender auf die Aktivierung (`AuflinieUtils.whenActivated`: CRT-Einschalten und Power-Hinweis in `hero-crt.js`, Blog-Hinweis in `blog-notice.js`).
- **PERF-5** [MUSS · Ist · Review] Textschrift (TYP-13): höchstens 35 KB je Datei (WOFF2, heute 28 KB aufrecht und 30 KB kursiv), nur die aufrechte Datei per Preload, und der Schrifttausch erzeugt keinen messbaren Layoutsprung (CLS unter 0,01).
- **PERF-6** [MUSS · Ist · Review] JS schreibt im Scroll- und Resize-Pfad keine Custom Property auf `<html>` oder `<body>`. Chromium berechnet dann jedes Element der Seite neu, auch mit `@property { inherits: false }`. Erlaubt sind normale Eigenschaften am Wurzelelement (Inline-`scroll-padding-top`: 4 Elemente), Klassen, zu denen nur wenige Regeln passen, und Custom Properties direkt am Element, das sie liest. Vorbild `toc.js` (`setStickyOffset`).
- **PERF-7** [SOLL · Soll · Review] Endlos-Animationen animieren nur `transform` (auch `scale`, `rotate`, `translate`) und `opacity`, die der Compositor ohne Neumalen abspielt. Animiert eine Endlos-Animation eine Paint-Eigenschaft (`background-position`, `filter`, `box-shadow`, `text-shadow`), hält sie außerhalb des Viewports an: ein `IntersectionObserver` setzt eine Klasse, CSS setzt `animation-play-state: paused`. Vorbilder `hero-crt.js` (`page__hero--crt-offscreen`) und `neon-orbit-toggle.js` (`neon-paused`, pausiert auch bei verborgenem Tab). Vorbild für die Umstellung auf den Compositor ist der Neon-Schriftzug: Der Schein steht als `text-shadow` und `box-shadow` fest und wird einmal gemalt, nur `opacity` und `scale` pulsieren. Den Text-Schein trägt eine Kopie des Schriftzugs (`.neon-glow--layer`) mit generiertem Text. Animiert wird ein ganzes Element, kein SVG-Kind: `opacity` an Teilen eines Inline-SVGs läuft in Chromium nicht auf dem Compositor (Vorbild Logo-Flackern, eigenes `logo-roehren.svg` über `logo.svg`). Choreografien mit JS-Timern (CRT-Boot) laufen durch. Für Endlos-Schleifen in JS gilt dasselbe: außerhalb des Viewports aus, und `requestAnimationFrame` nur so oft anfordern, wie gezeichnet wird. Vorbild ist das Canvas-Rauschen in `hero-crt.js` (10 Bilder pro Sekunde, ein Timer fordert erst kurz vor dem nächsten Bild wieder Frames an).
- **PERF-8** [SOLL · Soll · Review] Scroll-Handler messen zuerst und schreiben danach. Pro Frame wird höchstens `scrollY` gelesen, und zwar im Scroll-Event, das vor allen rAF-Callbacks läuft. Maße, die sich nur mit dem Layout ändern (`scrollHeight`, Lage eines Elements im Dokument, berechnete Stile), kommen aus einem Cache, den `AuflinieUtils.onDocumentResize` aktualisiert. Geschrieben wird `transform` oder `opacity` direkt am Element, das sich bewegt, nicht eine Custom Property an einem Vorfahren (PERF-6). Vorbilder `toc.js` (Lesefortschritt, Sticky-TOC) und `back-to-top.js` (Footer-Kopplung, schreibt nur bei geändertem Wert). Ein `IntersectionObserver` ersetzt die Lagemessung nur, wenn das Element dabei nicht übersprungen werden kann: Springt die Seite in einem Schritt über das Element hinweg, meldet er nichts.
- **PERF-9** [MUSS · Ist · Review] Ladepfad im `<head>`: Die Meta-CSP schaltet in Chromium den Preload-Scanner ab. Was der erste Viewport braucht (Stylesheet, Textschrift, Icon-Schrift), steht deshalb als `<link rel="preload">` VOR dem blockierenden `head-early.js`, das Stylesheet selbst bleibt dahinter. Das Hero-Bild wird ohne `fetchpriority` vorgeladen (mit hoher Priorität teilte es die Bandbreite mit CSS und Schriften). `hero-crt.js` setzt das LCP-Bild als Defer-Skript direkt beim Laden (SPA-1).

### 15.2 Browser und Geräte

- **BRW-1** [MUSS · Soll · Review] Zielplattform: Baseline „Widely available“ plus diese Ausnahmen mit Fallback: Cross-Document View Transitions (Chromium und Safari, Firefox lädt ohne Übergang, ARCH-2), Speculation Rules (Chromium, WebKit kennt den Skripttyp, ob Safari die Regeln nutzt, ist ungeprüft).
- **BRW-2** [MUSS · Soll · Review] Testmatrix vor jedem größeren Merge. Die Verhaltens-Tests laufen in jeder CI zusätzlich in Firefox (mit und ohne Reduced Motion) und WebKit (16.1), das ersetzt den Gegentest im echten Browser nicht. Letzter Gegentest in Safari auf echtem Gerät: 6. 10. 2026 ohne Befund (Owner, Seitenwechsel, Menü, Inhaltsverzeichnis, Skill-Graph und Formeln):

| Plattform | Warum | Pflicht |
|---|---|---|
| Firefox Desktop mit `prefers-reduced-motion: reduce` | Primärnutzer des Owners | jedes Mal |
| Chromium Desktop und mobil (DevTools) | View Transitions, CRT, Speculation Rules | jedes Mal |
| iOS Safari ab 16.4 | unterste Version mit Media-Query-Range und den genutzten APIs (BP-5) | vor Releases |
| echtes Touch-Gerät | Zwei-Finger-Pan, Bottom-Sheet, Zielgrößen | bei Touch-Änderungen |

- **BRW-3** [SOLL · Soll · CI-P4] Playwright-Läufe decken `reducedMotion: reduce` und `forcedColors: active` ab (16.2).

---

## 16 Durchsetzung

### 16.1 Heute aktiv

| Check | Wo | Prüft |
|---|---|---|
| Stylelint (`npm run lint:css`) | CI `lint` | SCSS-Regeln laut `.stylelintrc.json`, darunter SCSS-2, SCSS-7 (`keyframes-name-pattern`), SCSS-12 (`declaration-no-important`), TYP-8 (`font-weight-notation: numeric`), BP-5 |
| ESLint (`npm run lint:js`, `eslint.config.mjs`) | CI `lint` | `assets/js`, `service-worker.js` (Jekyll-Vorlage, Liquid per Prozessor ersetzt), `scripts/*.js`, `tests/`: JS-1 (Parser für `assets/js` auf ES2020), JS-2 (`no-var`, `prefer-const`, ohne Ausnahme), dazu `js/recommended` und `no-unsanitized` (SEC-1) |
| `scripts/fs-guardrail.sh` | CI `lint` | TYP-1 |
| `scripts/color-guardrail.sh` | CI `lint` | FARB-1, FARB-5, FARB-6, FARB-8 (SCSS), FARB-9, ungepaarte `[Block]`-Marker |
| `scripts/scale-guardrail.sh` (Ratchet, Grenzwerte `scripts/scale-baseline.txt`) | CI `lint` | SP-1, RAD-1, Z-3, MO-1, MO-2, TYP-7: keine neuen Literale für Abstand, Radius, Schatten, z-index, Dauer und Kurve, auch nicht über lokale Sass-Variablen oder als Argument und Default von `card-panel()` und `mono-label()`. Laufweite nur aus den drei Skalen-Tokens (jede andere Variable zählt, auch ein durchgereichter Parameter eines eigenen Mixins). Kein neues `transition: all`, ungepaarte `[Block]`-Marker |
| `scripts/bp-guardrail.sh` | CI `lint` | BP-1, BP-2, BP-3, BP-5 (Tokens samt Rechnungen, SCSS, JS, Templates samt Critical-CSS, `:hover` nur hinter `can-hover`, `no-hover` oder `@media (hover: hover)`) |
| `scripts/security-guardrail.sh` | CI `lint` | SEC-4, SEC-5, SEC-5c, SEC-7, SEC-8 |
| `scripts/version-sync-check.sh` | CI `lint` | DOC-7: Ruby- und Node-Feature in `.devcontainer/devcontainer.json` spiegeln `.ruby-version` und `.nvmrc`, jedes Playwright-Image und `package-lock.json` die exakte Version von `@playwright/test` |
| `.githooks/commit-msg` mit `scripts/commit-msg-check.py` | lokal (Hook, `git config core.hooksPath .githooks`, im Dev Container automatisch), nicht in der CI | GIT-1, GIT-7, GIT-8: Typen und Bereiche aus den Tabellen dieses Guides, Zuordnung alter Bereiche aus `docs/commit-bereiche.md`, Nachprüfen per `--log 50` |
| `scripts/scss-format.py` | CI `lint` | SCSS-19 |
| `tests/guardrails/run.py` (Fälle in `tests/guardrails/cases/`) | CI `lint` | Negativtests: absichtliche Verstöße gegen Schriftgrößen-, Skalen-, Farb-, Breakpoint- und Security-Guardrail sowie gegen `csp-check.py` (Mini-Site `tests/guardrails/csp-site/`) und `content-check.py` (Quellen und Mini-Site `tests/guardrails/content-site/`) sowie Versionsabweichungen für `version-sync-check.sh` und Commit-Nachrichten für `commit-msg-check.py` müssen scheitern, erlaubte Grenzfälle durchgehen |
| `jekyll build --strict_front_matter` | CI `build` | Front Matter |
| `scripts/sass-deprecation-check.sh` | CI `build` | SCSS-2, SCSS-3 |
| Gate „Styleguide nie im Deploy“ | CI `build` | SG-1 (`_site/styleguide` und `styleguide.css` fehlen im Deploy-Build) |
| Gate „ungenutzte Theme-Skripte nicht im Deploy“ | CI `build` | SEC-8b (`main.min.js`, `vendor/`, `lunr/`, `plugins/` fehlen unter `_site/assets/js/`) |
| Gate „Test-Gastbeitrag nie im Deploy“ | CI `build` | INH-5 (Fixture fehlt in `_site`) |
| Playwright `npx playwright test` im Container (Review-Build `_site_review`) | CI `build`, Schritt „Style-Guide-Review“ | `tests/visual/`: SG-2, SG-3, KOMP-1, Kontrast der Textproben (FARB-2), axe-core WCAG 2.2 AA (6.1) auf allen Seiten und Beiträgen des Review-Builds (`pages.js`), auch bei 320 px mit Reflow (1.4.10), Invarianten (A11Y-2, OVL-3, OVL-4, BP-1, BP-2, BP-3, Touch-Ziele 44 px (6.1), IMG-3 Kachelmaße gleich den Dateimaßen, Tab-Runde ohne unsichtbaren Fokus, Fußnoten-Rücksprung mit Namen „Zurück zum Text“ (6.5)), Blog-Suche, externe Links (LINK-3), Gastbeiträge (INH-5), Precache-Liste in beide Richtungen samt Build-Version an JS und CSS (11.5, SEC-5e). `tests/navigation.spec.js`: SPA-1, A11Y-5, Masthead-Snapshot, ARCH-2, BEW-1a, BEW-3, SEO-5, PERF-7 (Dauer-Animationen im Neon-Schriftzug nur auf dem Compositor). `tests/sw.spec.js`: Offline aus dem Precache. `tests/vendor.spec.js`: SEC-8d. Engines nach BRW-2 (Projekte in `playwright.config.js`, Übersicht in `tests/README.md`, WebKit-Seitenwechsel nur mit Reduced Motion, weil WebKit im Container ohne GPU kaum malt, am echten Safari geprüft (BRW-2)), Screenshots und Kontrast nur Chromium |
| `scripts/content-check.py` | CI `build`, vor dem Jekyll-Build | ARCH-5: HTML-Kommentare in `_posts`, `_drafts`, `_pages` und `_data` (LIQ-5), Skill-IDs in `_data/skill_graph.yml` gegen die Chips in `_data/cv_content.yml` (Jekyll-`slugify`, mit Vorschlag), Mathe-Backslashes in `_data` (MD-3), Pfade ab der Wurzel ohne `relative_url` in `_posts`, `_drafts`, `_pages` (LIQ-3), fehlende oder leere Text-Schlüssel der Bedienung (`_data/fractal_panel.yml`, `texts` in `_data/skill_graph.yml`, `powered_by` in `_data/ui-text.yml`) sowie unbekannte oder leere Felder der Erklärboxen (`panel_explanations` in `_data/mandelbrot.yml`, mit Vorschlag, ARCH-4). Warnung bei `target="_blank"` ohne `rel` in den Quellen (LINK-3 repariert es beim Build). Jede Meldung mit Datei, Zeile und Lösung |
| `scripts/content-check.py --site _site` | CI `build` | IMG-3 als Warnung: `<img>` ohne `width`/`height` im Inhalt eines Beitrags und Kachelbilder (`.archive__item-teaser`) ohne Maße |
| `scripts/csp-check.py _site` | CI `build` | SEC-3 (samt Hash der Speculation Rules gegen den gebauten Block), SEC-4, SEC-9 (`http://`-URLs im gebauten HTML, bei Hyperlinks nur Warnung), LINK-3 (`target="_blank"` nur mit `noopener noreferrer`) |
| html-proofer (`--checks Links,Images,Scripts`) | CI `build` | interne Links und Anker, Bilder (Datei vorhanden, `alt` gesetzt), Skripte (Datei vorhanden), ARCH-5 |
| Deploy nur bei grünem `build` **und** `lint` | `needs: [build, lint]` | alles oben |
| Dependabot-Alerts, Versions-PR für Actions (monatlich) | GitHub, `.github/dependabot.yml` | SEC-7, SEC-7c |
| `scripts/cascade-check.py` | manuell | TYP-4, TYP-6 |
| `scripts/scale-literals.py --report` | manuell | Restliste zu R-35 |
| `scripts/style-snapshot.js` | manuell | optisch neutrale Refactorings (berechnete Stile vorher und nachher) |

### 16.2 Ausbau (priorisiert)

| Priorität | Check | Fängt |
|---|---|---|
| 1 | Stylelint-Flags `--report-needless-disables --report-descriptionless-disables --report-invalid-scope-disables` | SCSS-18 |
| 1 | Stylelint: `color-named: never`, `selector-max-id: 0` | FARB-8, SCSS-9 |
| 1 | Stylelint `declaration-property-value-disallowed-list`: `outline: none` (`transition: all` und `rgba($hover-color` fangen schon die Guardrails) | 2.4.7 |
| 2 | Stylelint `selector-max-specificity: "0,4,2"` | SCSS-9 |
| 2 | Stylelint `selector-class-pattern` für BEM plus `is-`/`has-` | SCSS-5 |
| 2 | Stylelint `scss/dollar-variable-pattern` kebab-case | SCSS-7 |
| 2 | Token-Kontrast-Skript (Paare Vordergrund, Grund, Mindestwert, Alpha komponiert) | FARB-2, 6.4 |
| 2 | Critical-CSS-Sync-Check (Inline-Block gegen Tokens, verbietet `body{font-family}`, `body{color}` und jedes `html{font-size}` außer `100%`), dazu `style`-Attribute in Templates | CRIT-1, CRIT-3 |
| 2 | ESLint-Regeln zusätzlich zur bestehenden Config (16.1): `strict`, `eqeqeq`, `no-console` mit warn/error, `no-restricted-properties` gegen `navigator.userAgent`, `no-eval`, `no-implied-eval`, `no-new-func`, `no-script-url` | JS-3, JS-11, JS-14, SEC-1 |
| 2 | `exiftool`-Gate über `assets/images`, `sha384sum -c` für `assets/vendor` | SEC-10, SEC-8a |
| 3 | `scripts/content-check.py` ausbauen (läuft schon, 16.1): Fence-Balance, Intro ohne Überschrift, Caption ≠ Titel, Sie-Formen, Semikolon in Excerpt und Intro, `<br`/`style=` in `_data`, `\d{4} - \d{4}`, gemischte Anführungszeichen, YAML-Folding-Falle, Quellenkommentare | 5, 7, 8, 12 |
| 3 | Post-Build-Grep auf `_site`: „Sie“-Formen, englische Theme-Fallbacks („Skip to“), `<!--` aus eigenen Includes, `noindex` auf internen Seiten | TON-2, LIQ-5, SEC-12 |
| 3 | `markdownlint-cli2` für Doku (MD040, MD032, MD047), zunächst ohne `_posts` | DOC-6 |
| 3 | `cascade-check.py` mit Element-Regeln und Inline-Blöcken als Konkurrenten, Erwartungswert-Modus | TYP-4, TYP-5 |
| 4 | axe-core läuft schon (16.1). Offen: dieselben Routen zusätzlich mit `reducedMotion: reduce` und `forcedColors: active` | Abschnitt 6, BRW-3 |
| 4 | Playwright-Invariante: Lesemodus (Power-Button auf `/`) stoppt die CRT-Endlos-Animationen | 6.3, 6.5 |
| 4 | Lighthouse-Lauf per `workflow_dispatch` gegen PERF-1 und PERF-2 | 15.1 |

Neue Guardrail-Skripte folgen dem Muster von `fs-guardrail.sh`: Marker in der Zeile darüber, Exit 1 bei Verstoß, Schritt im bestehenden Lint-Job (kein zusätzlicher Artefakt-Speicher, GIT-6).

### 16.3 Review-Checkliste

Vor jedem Push:

- **REV-1** Lint-Job wie in 16.1: `npm run lint:css`, `npm run lint:js`, `python3 scripts/scss-format.py`, `bash scripts/fs-guardrail.sh`, `bash scripts/color-guardrail.sh`, `bash scripts/scale-guardrail.sh`, `bash scripts/bp-guardrail.sh`, `bash scripts/security-guardrail.sh`, `bash scripts/version-sync-check.sh` und `python3 tests/guardrails/run.py` grün
- **REV-2** Build-Job wie in 16.1: `python3 scripts/content-check.py`, Docker-Build mit `--strict_front_matter` grün (kein lokales Ruby, `--user` gesetzt), `bash scripts/sass-deprecation-check.sh`, `python3 scripts/content-check.py --site _site`, die Gates aus dem Workflow, Review-Build `--unpublished -d _site_review` mit `npx playwright test` im Container, `python3 scripts/csp-check.py _site` und html-proofer
- **REV-3** Nur Tokens, keine neuen Literale (Farbe, Größe, Abstand, Breakpoint, z-index, Dauer)
- **REV-4** Kontrast in allen Zuständen geprüft, gegen den echten Grund
- **REV-5** Fokus sichtbar, Tastaturbedienung, Reduced Motion
- **REV-6** Kaskaden-Falle bedacht (p/li, direkte Kinder von `.page__content`), `cascade-check.py` gelaufen
- **REV-7** Neues Seiten-Modul mountet einmal beim Laden (SPA-1), kein Inline-Skript
- **REV-8** Speculation-Rules-Ausschlüsse oder Gate-Paar geändert? Dann Tests, Doku und Gegenstück im selben Commit (SPA-5, BP-6)
- **REV-9** Texte anredefrei, keine Semikolons, deutsche Typografie (Abschnitt 8)
- **REV-10** Doku und Kommentare passen zum neuen Verhalten
- **REV-11** Commit-Format und Scope aus der Liste (Hook eingeschaltet, 16.1)
- **REV-12** Design-Umbau? Vorher Vorschläge gezeigt (PROZ-1)

Nicht automatisierbar und deshalb immer im Review: Ton (warm, nicht nerdig), fachliche Korrektheit, ob ein `alt`-Text das Bild beschreibt, ob eine Caption eine echte Zusatzinformation ist.

---

## 17 Register bekannter Abweichungen

Stand: Abgleich vom 2. 10. 2026, seither nachgeführt (Kopf). Ein Eintrag verschwindet, sobald der Code die Regel erfüllt oder der Owner die Regel ändert. Seine Nummer wird nicht neu vergeben (GOV-8). Details und Zeilen stehen im Audit unter der genannten Befund-ID, bei neueren Einträgen hier. Spalte „Weg“: **Owner** = sichtbare Änderung oder offene Entscheidung, **Code** = umsetzbar ohne Owner-Entscheidung.

| ID | Regel | Stelle | Audit | Weg |
|---|---|---|---|---|
| R-32 | OVL-4, A11Y-2 | Drawer: modal (Scrim, Scroll-Sperre, `inert`), aber ohne `role="dialog"` und `aria-modal`. Fokus wandert nur beim Öffnen per Tastatur hinein. Der damalige Grund, mobil färbte `:focus` die Links magenta, entfällt seit 4. 10. 2026 (KOMP-2) | B-A11Y-05 | Owner |
| R-33 | 2.5.7 | Fraktal-Pan nur per Ziehen (rechte Maustaste, Leertaste), Zwei-Finger-Geste oder Pfeiltasten am fokussierten Canvas. Für Zeiger fehlt eine Alternative ohne Ziehen | B-A11Y-09 | Owner (sichtbare Pan-Buttons?) |
| R-34 | SCSS-4 | Seit der `@use`-Migration erweitert das Theme-`@extend` (`.comment__date { @extend .page__meta }`) nur noch Theme-Regeln. Die eigenen `.page__meta`-Regeln gelten nicht für `.comment__date`. Kommentare sind aus, das Element kommt auf keiner Seite vor | – | Owner-Freigabe 1. 10. 2026, beim Einschalten von Kommentaren nachziehen |
| R-35 | SP-1, SP-2 | Radien, Schatten, z-index, Dauern, Kurven und `transition: all` stehen auf 0. Übrig sind 25 em-Abstände außerhalb der markierten em-Systeme in `_pages.scss`, `_offline.scss`, `_content-accents.scss`, `_footer.scss`, `_archive.scss`, `_author.scss`, `_buttons.scss` und `_home.scss` (Liste: `python3 scripts/scale-literals.py --report`, Ratchet `spacing 25`) | B-SP-01, B-Z-01, B-MO-01, B-RAD-01, B-SH-01 | Code bei Berührung auf rem-Tokens (Größe hängt heute an der Schrift des Elements, je Stelle prüfen) |
| R-50 | SCSS-10 | Minimal Mistakes 4.28.1 setzt `.page__content :first-child { margin-top: 0 }` (PR #5103, gemeint war nur das erste Inhaltselement neben der TOC). Die Regel trifft jedes erste Kind in der Tiefe. Gegenmittel mit Spiegelwerten in `theme-overrides/_first-child.scss`, H2-Probe in `assets/css/styleguide.scss`. Wer einen gespiegelten Wert ändert, zieht ihn dort nach | – | upstream melden (Owner, 6. 10. 2026: Issue eröffnen, Entwurf mit Messung liegt vor), Datei entfernen, sobald das Theme die Regel auf direkte Kinder begrenzt |
| R-51 | 3.1.2 (6.1) | Minimal Mistakes 4.28.1 schreibt englische `aria-label` fest ins Markup. Deutsch überschrieben: `skip-links.html`, `post_pagination.html`, Masthead. Offen: `paginator-v2.html` („Pagination“), erscheint erst ab dem siebten Beitrag (`per_page: 6`) | – | Owner: beim ersten Blättern überschreiben oder upstream `ui-text`-Keys anregen |
| R-54 | TYP-3 | `$fs-label-xs` (10,9 px) für funktionalen Text: Button-Text der Fraktal-Toolbar mobil (`fractal-panel/_toolbar.scss`), Copyright-Zeile im Footer | – | Owner (sichtbar) |
| R-79 | BP-3 | Theme-Hover-Regeln ohne `(hover: hover)` ohne Gegenregel, weil heute ohne sichtbare Wirkung oder ohne Einsatz. Ohne Wirkung: Grau aus `.greedy-nav a:hover` am Logo und Hellcyan am Avatar-Link (SVG und Bild tragen eigene Farben), Hellcyan an den Sprunglinks (nur mit Tastaturfokus zu sehen). Ohne Einsatz: Zahlen-Pagination (`.pagination li a:hover`), Hinweis-Links (`.notice a:hover`), Links in Bildunterschriften, Tags (`.page__taxonomy-item:hover`), Such-Knopf, Überschriften-Anker, Kopierknopf in Codeblöcken, Lightbox (`.mfp-*`), Theme-Buttons ohne eigene Rolle. Die Sidebar-Gegenregel steht an `up(lg)` in px, das Theme an 64em, bei Grundschrift ≠ 16 px weichen beide Grenzen ab | – | Code (bei Einsatz eines dieser Elemente Gegenregel in `no-hover`, Touch-Test in `invariants.spec.js` um die Seite erweitern) |
| R-80 | BP-4 | 40 `down()` gegen 9 `up()` (Stand 4. 10. 2026) | – | Code (bei Berührung umdrehen, BP-6) |
| R-83 | HTML-1, 6.1 (4.1.2) | Neon-Name auf der Startseite (`_includes/page__hero.html`, Flag `neon_name`): Der Orbit-Auslöser ist ein `<span role="button" tabindex="0">` mitten im Wort in der H1, das „ü“ ein `<span aria-label="ü">u</span>` (ein `aria-label` auf einem generischen Element lesen Screenreader meist nicht vor). Der zugängliche Name der H1 zerfällt dadurch in etwa „H Orbit starten ns Muller“ | – | Owner (Auslöser als `<button type="button">` oder außerhalb der Überschrift, „ü“ als Text, Optik vorher und nachher gleich) |
| R-84 | SEC-8b | `.devcontainer/devcontainer.json`: Basis-Image `mcr.microsoft.com/devcontainers/python:3.11` ohne Digest, Features mit schwebendem Major-Tag (`:1`). Der Host-Token wird nicht mehr hineingereicht | N9 (Security-Bericht) | Owner (gepinnt heißt Updates von Hand) |
| R-65 | TYPO-1, TYPO-2, COPY-2, COPY-4, FACH-1 | Entity `&copy;` in `footer.html`. „Berechne…“ ohne Leerzeichen vor der Auslassung. Schrägstrich ohne Leerzeichen im Entwurf `_drafts/2025-03-05-css-struktur-analyse.md` („CSS/SASS“, beim Veröffentlichen nach INH-2). Leerzustand der Blog-Suche ohne Hinweis, was hilft. Fachaussagen in `_data/mandelbrot.yml` ohne Quellenkommentar (z. B. Hausdorff-Dimension, Shishikura 1998) | – | Inhalt (Owner liest Texte gegen) |
| R-67 | SEO-2, SEITE-6 | Excerpts unter 70 Zeichen: Über mich (59), Archiv (44), Blog (69). `blog_notice` kennt kein Ablaufdatum (der Sommerpause-Hinweis ist seit 4. 10. 2026 ausgeschaltet, beim nächsten Hinweis nachrüsten) | – | Owner |
| R-69 | DOC-7 | Der Beitrag „Erstellung dieser Website“ nennt Ruby `3.4.11` als Zahl (Abschnitt 3.1 zweimal, Verzeichnisbaum, Auszug der `devcontainer.json`, dort auch Node `22`). `version-sync-check.sh` prüft Beiträge nicht, beim nächsten Versionssprung läuft der Text still auseinander. Der Auszug selbst ist seit 6. 10. 2026 auf dem Stand der Datei (Faktenkorrektur ohne eigene Owner-Entscheidung, Bestätigung offen) | – | Owner (Lesertext: Datei statt Nummer nennen, oder Beiträge als datierte Lesertexte aus DOC-7 ausnehmen) |
| R-71 | NAME-1 | `assets/images/Logo.svg` (4.1) | – | Owner |
| R-73 | IMG-7 | `assets/images/QUELLEN.md` fehlt. Die Lizenz des Hintergrundbilds steht nur im README-Abschnitt „Lizenz“ | – | Owner (Quellen nennen), dann Code |
| R-88 | ARCH-4 | Bewusster Rest nach Owner-Entscheidung vom 6. 10. 2026 (Technik-Stopp, ARCH-6): Lesemodus-Knopf (`page__hero.html`, `hero-crt.js`), Update-Toast (`sw-register.js`), Offline-Hinweis (`_layouts/default.html`), „Verstanden“ (`blog-notice.html`) und Landmark-Namen in `masthead.html`, `footer.html` und `post_pagination.html` (R-51) bleiben im Code. Die statischen Vorschau-Kopien von Fraktal-Panel und Skill-Graph auf der Styleguide-Seite bleiben. Panel-Überschriften als `title` in `julia-interactive.html` und `mandelbrot-julia-explorer.html` wandern erst mit der Überarbeitung des Beitrags „Erstellung dieser Website“, der diesen Aufruf zitiert (FACH-4). Dort nennt auch der Projektbaum `_includes/fractal/` noch „Erklärtexte“ | – | Inhalt (mit der Überarbeitung des Beitrags) |
| R-96 | ARCH-2 | Übergang nach dem SPA-Ausbau in `assets/js/sw-register.js` (`wireLegacySpaHistory`): Die alte SPA-Navigation (bis `c19da3f`) legte Einträge per `pushState` im selben Dokument an. Wer per Update-Toast auf den neuen Stand wechselt und dann „Zurück“ drückt, bekam nur eine neue URL, der Inhalt blieb. Ein `popstate` mit anderem Pfad oder mit State `spa` lädt die Seite deshalb neu. Anker-Sprünge und bfcache-Rückkehr bleiben unberührt. Check: `tests/navigation.spec.js` | – | Code (Übergang, kann ab 2026-12-01 entfallen, dann Funktion und die zwei Tests entfernen) |

---

## 18 Quellen

Barrierefreiheit und Recht:

- WCAG 2.2: https://www.w3.org/TR/WCAG22/
- Understanding 2.3.1: https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold.html
- Understanding 2.2.2: https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html
- Understanding 2.3.3 und Technik C39: https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html, https://www.w3.org/WAI/WCAG22/Techniques/css/C39
- Understanding 2.4.7, 2.4.11, 1.4.11, 2.5.8: https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html, https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html, https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html, https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html
- Understanding 1.4.1, 1.4.4, 1.4.10, 1.4.13: https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html, https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html, https://www.w3.org/WAI/WCAG22/Understanding/reflow.html, https://www.w3.org/WAI/WCAG22/Understanding/content-on-hover-or-focus.html
- WCAG 3.0 Working Draft: https://www.w3.org/TR/wcag-3.0/
- MDN prefers-reduced-motion: https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion
- BFSG §§ 1–3: https://www.gesetze-im-internet.de/bfsg/__1.html
- Bundesfachstelle Barrierefreiheit, FAQ BFSG: https://www.bundesfachstelle-barrierefreiheit.de/DE/Fachwissen/Produkte-und-Dienstleistungen/Barrierefreiheitsstaerkungsgesetz/FAQ/faq_node
- BITV 2.0 § 1: https://www.gesetze-im-internet.de/bitv_2_0/__1.html
- EN 301 549 V4.1.1 (AccessibleEU): https://accessible-eu-centre.ec.europa.eu/content-corner/news/european-accessibility-standard-en-301-549-has-been-updated-2026-09-07_en

Design-Tokens, Motion, Performance, Browser:

- W3C DTCG Format 2025.10: https://www.designtokens.org/tr/2025.10/format/
- Material Design 3 Motion Tokens: https://raw.githubusercontent.com/material-foundation/material-tokens/json/json/motion.json
- NN/g Animation Duration: https://www.nngroup.com/articles/animation-duration/
- Apple HIG Motion: https://developer.apple.com/design/human-interface-guidelines/motion
- Atlassian Design Tokens: https://atlassian.design/foundations/tokens/design-tokens
- web.dev Web Vitals: https://web.dev/articles/vitals
- web.dev Animations Guide: https://web.dev/articles/animations-guide
- Cross-document View Transitions: https://developer.chrome.com/docs/web-platform/view-transitions/cross-document
- web.dev Baseline: https://web.dev/baseline
- Service-Worker-Lebenszyklus: https://web.dev/articles/service-worker-lifecycle
- MDN `Document.readyState`: https://developer.mozilla.org/en-US/docs/Web/API/Document/readyState

CSS, Sass, JS, Tooling:

- Sass @use, @import-Deprecation, if(): https://sass-lang.com/documentation/at-rules/use/, https://sass-lang.com/documentation/breaking-changes/import/, https://sass-lang.com/documentation/breaking-changes/if-function/
- jekyll-sass-converter: https://github.com/jekyll/jekyll-sass-converter
- Minimal Mistakes Issue #5026: https://github.com/mmistakes/minimal-mistakes/issues/5026
- Sass Guidelines: https://sass-guidelin.es/
- ITCSS: https://www.xfive.co/blog/itcss-scalable-maintainable-css-architecture/
- CUBE CSS: https://cube.fyi/
- stylelint-config-standard-scss: https://github.com/stylelint-scss/stylelint-config-standard-scss
- Stylelint-Migrationsleitfaden auf Version 17 (erst beim geplanten Upgrade relevant, Repo-Stand in `package-lock.json`): https://stylelint.io/migration-guide/to-17/
- MDN JavaScript Code Style: https://developer.mozilla.org/en-US/docs/MDN/Writing_guidelines/Code_style_guide/JavaScript
- ESLint Getting Started: https://eslint.org/docs/latest/use/getting-started
- TypeScript JSDoc-Typen: https://www.typescriptlang.org/docs/handbook/jsdoc-supported-types.html
- EditorConfig: https://editorconfig.org/
- markdownlint: https://github.com/DavidAnson/markdownlint

Sicherheit und Datenschutz:

- OWASP DOM-based XSS Prevention Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/DOM_based_XSS_Prevention_Cheat_Sheet.html
- OWASP Content Security Policy Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html
- W3C CSP Level 3: https://www.w3.org/TR/CSP3/
- GitHub Docs, Secure use reference: https://docs.github.com/en/actions/reference/security/secure-use
- OpenSSF Scorecard: https://github.com/ossf/scorecard

Sprache und Typografie:

- Duden Sprachwissen (Anführungszeichen, Gedankenstrich, Bindestrich, Abkürzungen, Auslassungspunkte, Zahlen): https://www.duden.de/sprachwissen/rechtschreibregeln/anfuehrungszeichen und die verlinkten Schwesterseiten
- Rat für deutsche Rechtschreibung, amtliches Regelwerk 2024: https://www.rechtschreibrat.com/regeln-und-woerterverzeichnis/
- Microsoft German Style Guide: https://aka.ms/german-styleguide
- Mozilla L10n German: https://mozilla-l10n.github.io/styleguides/de/
- kramdown Optionen: https://kramdown.gettalong.org/options.html
- W3C i18n Character Escapes: https://www.w3.org/International/questions/qa-escapes
- German UPA Leitfaden UX-Writing: https://germanupa.de/sites/default/files/2024-08/leitfaden-ux-writing-vorgehensweise-v1.01.pdf
- NN/g F-Pattern, First 2 Words, Inverted Pyramid: https://www.nngroup.com/articles/f-shaped-pattern-reading-web-content/

Prozess und Doku:

- Conventional Commits 1.0.0: https://www.conventionalcommits.org/en/v1.0.0/
- commitlint config-conventional: https://github.com/conventional-changelog/commitlint/tree/master/@commitlint/config-conventional
- Keep a Changelog: https://keepachangelog.com/en/1.1.0/
- Semantic Versioning: https://semver.org/
- Diátaxis: https://diataxis.fr/
- ADR: https://adr.github.io/
- Google Developer Documentation Style Guide: https://developers.google.com/style
- GOV.UK Design System: https://design-system.service.gov.uk/
- Mailchimp Content Style Guide: https://styleguide.mailchimp.com/

---

## 19 Änderungen

Eine Zeile je Änderung, Einzelheiten stehen in den Commits.

| Version | Änderung |
|---|---|
| 2026-10-01 | Erste Fassung mit Status- und Durchsetzungsangaben je Regel, Register, Sicherheitsabschnitt, Owner-Prozessregeln, Performance, Bildern, Links, Formularen, SEO, Druck und Browser-Matrix. |
| 2026-10-01 | JS-2 per ESLint durchgesetzt, R-14 verkleinert, `site-utils.js` mit `prefersReducedMotion` und `rafThrottle` angelegt (JS-18). |
| 2026-10-01 | Gedankenstrich „ – “ und „2025 – Heute“ als Owner-Entscheidungen in TYPO-2, SEITE-1 und FM-3 auf Ist, R-22 erledigt. |
| 2026-10-01 | `@use`-Modulbaum mit Theme-Brücke als Hausregel (SCSS-4), SCSS-2, SCSS-3 und SCSS-19 auf Ist mit CI, R-13 erledigt, R-34 neu. |
| 2026-10-01 | Ubuntu als selbst gehostete Textschrift (TYP-13 und PERF-5 neu), FARB-10 für `$primary-color` auf Ist, R-29 erledigt, R-5 gekürzt. |
| 2026-10-01 | „&“ als Stilelement in kurzen Labels (TYPO-2), R-35 (tote Kaskaden-Werte) erledigt, Demo-Beitrag nach INH-4 depubliziert. |
| 2026-10-01 | Skalen-Tokens in `variables/_scales.scss` auf Ist (3.3, 3.5 bis 3.7) mit `skala-Ausnahme`-Marker und Ratchet `scale-guardrail.sh`, Rest in R-35. |
| 2026-10-01 | Breakpoint-Tokens `$bp-*` mit `up()`, `down()` und `between()`, BP-1 und BP-2 auf Ist mit `bp-guardrail.sh`, R-6 und R-9 erledigt. |
| 2026-10-01 | SEC-8d neu (Vendor-Updates nur bei relevanten Fixes), MathJax 4.1.3, Gems aktualisiert. |
| 2026-10-01 | Minimal Mistakes 4.28.1 per Commit gepinnt, SEO-3 um `og:image:alt` ergänzt, R-50 und R-51 neu. |
| 2026-10-01 | Skalen Stufe B mit Ring- und Glow-Familie, benannten lokalen Ebenen und Guardrail-Negativtests, R-35 auf den em-Rest. |
| 2026-10-02 | Abgleich mit dem Code (`75c23c0`): Ist 100 → 129, Soll 174 → 144, Offen 3 → 4, Register 36 → 34 (entfernt R-1, R-2, R-3 bis R-6, R-7, R-8, R-9, R-12 bis R-15, R-17 bis R-19, R-22 bis R-26, R-27, R-29, R-31, neu R-52 bis R-73, R-10, R-16, R-20, R-21, R-28 und R-35 nachgeführt). |
| 2026-10-02 | Skill-Graph: OVL-2 und OVL-3 neu gefasst, `$graph-sheet-width` neu, `$z-graph-float`, `$glow-hint*` und `$shadow-float` entfallen. |
| 2026-10-02 | Register-Abbau: R-20, R-28, R-53, R-59, R-61, R-62, R-63 und R-68 erledigt, R-66 und R-69 gekürzt, R-74 und R-75 neu. |
| 2026-10-03 | R-75 erledigt: ungenutzte Theme-Skripte per `exclude` und `_plugins/theme-assets-exclude.rb` aus dem Build, mit CI-Gate (SEC-8b). |
| 2026-10-03 | R-60 erledigt (`type="button"`, Regionen und Überschriften im Chrome bereinigt, pixelgleich), R-76 neu. |
| 2026-10-03 | R-74 erledigt: Das Autor-Dropdown setzt den Fokus nur beim Öffnen per Tastatur auf den ersten Link (A11Y-2). |
| 2026-10-03 | R-54 Teil TYP-8: `bold` → `700` in `_about.scss` und `fractal-panel/_states.scss`. |
| 2026-10-03 | R-72 zum Teil: `$background-color: $page-bg`, `$text-color` bleibt beim Skin und geht an den Owner. |
| 2026-10-03 | Owner: Blog-Hinweis als natives `<dialog>` (R-10 erledigt, Z-1 auf Ist), Hamburger und Back-to-Top in `$control-icon-color` (R-52 erledigt), altes Logo entfernt. |
| 2026-10-04 | PERF-6 neu: keine Custom Property auf `<html>` oder `<body>` im Scrollpfad, die Sticky-TOC nutzt Inline-`scroll-padding-top`. |
| 2026-10-04 | PERF-7 neu: Endlos-Animationen des CRT-Hero halten außerhalb des Viewports an. |
| 2026-10-04 | PERF-7 um JS-Schleifen ergänzt: Das Canvas-Rauschen fordert Frames erst kurz vor dem nächsten Bild an. |
| 2026-10-04 | PERF-8 neu (im Scrollpfad erst messen, dann schreiben), Helfer `onDocumentResize` in `site-utils.js` (JS-18). |
| 2026-10-04 | `back-to-top.js` nach PERF-8 umgebaut, Verhalten unverändert. |
| 2026-10-04 | Blog-Hinweis „Sommerpause“ ausgeschaltet (Owner), R-67 nachgeführt. |
| 2026-10-04 | R-21: `scale-guardrail.sh` zählt Laufweiten auch im Argument von `mono-label()`, die Literale stehen auf Tokens. |
| 2026-10-04 | R-76 erledigt: eigenes `author-profile.html` mit Autorname als `<div>` und `type="button"` (SEITE-3, HTML-1). |
| 2026-10-04 | SEC-9: `http://`-Beispiellink aus dem Autorprofil entfernt, `csp-check.py` prüft `http://` auch in URL-Attributen, `url()` und Kommentaren. |
| 2026-10-04 | A11Y-2: Das TOC-Dropdown setzt den Fokus nur beim Öffnen per Tastatur, R-77 neu. |
| 2026-10-04 | R-64 bis auf einen Beitrag erledigt (kein `style` und kein `<br>` in Daten), YAML-2 und MD-1 auf Ist. |
| 2026-10-04 | R-69 Teil Dev Container: Node-Feature `22`, neuer Check `version-sync-check.sh` (DOC-7). |
| 2026-10-04 | PERF-9 neu: Preload vor `head-early.js`, weil die Meta-CSP den Preload-Scanner abschaltet. |
| 2026-10-04 | R-77 erledigt: Der Hintergrund des offenen TOC-Dropdowns wird `inert`. |
| 2026-10-04 | R-55 erledigt, BP-3 auf Ist mit CI (`can-hover`, `no-hover`, `bp-guardrail.sh` Klasse 5), R-79 und R-80 neu. |
| 2026-10-04 | R-56 erledigt, KOMP-2 und KOMP-4 auf Ist (`:focus-visible`, Mixin `focus-ring`), R-81 neu. |
| 2026-10-04 | DOC-7, Rest: Außerhalb von R-69 nennt keine Doku mehr eine Ruby-Version als Zahl. |
| 2026-10-04 | Skill-Graph-Öffner oben im Abschnitt „Technische Fähigkeiten“ (Owner), Flag `skill_graph.graph` statt `stage2`. |
| 2026-10-04 | Skill-Graph-Sheet am Desktop bis knapp unter den Masthead (Owner). |
| 2026-10-04 | R-79 auf den echten Rest gekürzt: Gegenregeln in `no-hover`, `base/_links.scss` neu, Touch-Test in `invariants.spec.js`. |
| 2026-10-04 | R-81 erledigt: Die Fokusringe im Skill-Graphen nutzen `focus-ring`. |
| 2026-10-04 | R-54 Teil TYP-8 erledigt, TYP-8 auf Ist, R-54 hält nur noch TYP-3. |
| 2026-10-04 | TYP-8 per Stylelint `font-weight-notation: numeric` in der CI. |
| 2026-10-04 | R-66 erledigt, SCSS-14 auf Ist. |
| 2026-10-04 | R-69 Teil Skill-Feature-Doku erledigt (`docs/features/skill-feature.md`), DOC-5 ohne Bestand. |
| 2026-10-04 | Skill-Graph-Überarbeitung abgeschlossen, Weg „Track“ entfällt, R-57 und R-58 auf „Code“. |
| 2026-10-04 | R-58 Teil SPA-1 und SPA-2: Module über einen gemeinsamen Kontrakt (mit dem SPA-Ausbau am 5. 10. 2026 wieder entfallen). |
| 2026-10-04 | SPA-3 in den Modulen aus R-58: Callbacks brechen nach einem Swap ab (mit dem SPA-Ausbau entfallen). |
| 2026-10-04 | R-58 erledigt, BEW-1a auf MUSS und Ist mit gemeinsamer Reduced-Motion-Abfrage in `site-utils.js`. |
| 2026-10-04 | R-57 erledigt, MO-6 und KOMP-5 auf Ist (gefilterte `animationend`). |
| 2026-10-04 | SPA-1, Testabdeckung auf `/posts/` und `/mandelbrot/` erweitert. |
| 2026-10-04 | R-64 erledigt, CRIT-3 auf Ist: kramdown-IAL statt `style` im Beitrag „Blogbeitrag erstellen“. |
| 2026-10-04 | Teilabgleich gegen `c19da3f`: HTML-2 und LIQ-4 auf Ist, R-82 bis R-85 neu. |
| 2026-10-04 | Repo-Doku (README, README_DEV, Feature-Dokus, `tests/README.md`) mit dem Code abgeglichen. |
| 2026-10-04 | Verhaltens-Tests zusätzlich in Firefox und WebKit (BRW-2), R-86 und R-87 neu. |
| 2026-10-04 | BRW-1 auf den Stand der Engines, Firefox-Gegentest der damaligen SPA-Navigation headless erledigt. |
| 2026-10-04 | Zusammenführung der Pakete mit Doku und Cross-Browser-Tests, keine sichtbare Änderung. |
| 2026-10-04 | R-70 erledigt, LINK-3 neu gefasst (Owner): externe Links im neuen Tab per `_plugins/external-links.rb`. |
| 2026-10-04 | INH-5 neu (Owner): Gastbeiträge nur mit Namen über `_plugins/gast-autor.rb`, mit Fixture und CI-Gate. |
| 2026-10-04 | SEC-9 gelockert (Owner): `http://` in Hyperlinks ist nur eine Warnung. |
| 2026-10-04 | Abschnitt 1.8 neu: Leitlinie „einfach, aber anpassbar“ (Owner) mit ARCH-1 bis ARCH-7 und Messgrundlage. |
| 2026-10-05 | R-11 erledigt, MO-1 und ARCH-3 auf Ist: Theme-`$global-transition` nur noch auf Farbe, Hintergrund, Rahmenfarbe und Deckkraft. |
| 2026-10-05 | ARCH-1: `page__related.html` auf der Theme-Fassung, `archive-single.html` neu auf ihr aufgesetzt. |
| 2026-10-05 | ARCH-1: `_theme-bridge.scss` importiert die Theme-Partials einzeln, ohne `magnific-popup` und `search`. |
| 2026-10-05 | LINK-3: kein Umbruch mehr vor dem Symbol, der Test misst wieder. |
| 2026-10-05 | ARCH-5, Inhalts-Check `scripts/content-check.py` im Build-Job, LIQ-5 und MD-3 auf CI. |
| 2026-10-05 | ARCH-5, Workflow: html-proofer prüft auch Bilder und Skripte, `concurrency` je Ref, Timeouts (GIT-6, SEC-7a). |
| 2026-10-05 | ARCH-5, Datum: Der Build-Job checkt die volle Historie aus (INH-3). |
| 2026-10-05 | ARCH-5, Werkzeug-Lücken: ESLint auch für `service-worker.js`, `version-sync-check.sh` auch für Playwright, SEC-8c realistisch gefasst. |
| 2026-10-05 | ARCH-5, Guardrail-Lücken in Schriftgrößen-, Security- und Farb-Guardrail geschlossen (TYP-1, SEC-4, FARB-8). |
| 2026-10-05 | ARCH-4: Kontakt und Social-Links aus einer Quelle (`author.links` in `_config.yml`). |
| 2026-10-05 | ARCH-4: Startseite in `_data/home.yml`, die Footer-Liste erbt Menütitel, R-88 neu. |
| 2026-10-05 | TYPO-1 und TYPO-2: Zeiträume im Lebenslauf mit normalen Leerzeichen, geschützt erst bei der Ausgabe. |
| 2026-10-05 | ARCH-5, Tests: axe und Tab-Runde auf allen Beiträgen und bei 320 px, Reflow-Test, R-89, R-90, R-91 und R-92 neu. |
| 2026-10-05 | ARCH-5 auf CI: Pflege-Tabelle im README, Ordner `assets/images/posts/`, Leitfaden „Blogbeitrag erstellen“ technisch korrigiert. |
| 2026-10-05 | Tests, Laufzeit: Der Reflow-Test wartet nicht mehr die feste axe-Zeit ab. |
| 2026-10-05 | TOC: aufgeklappt ohne Höhengrenze (WCAG 1.4.12), ein voll breiter TOC startet ohne Layoutsprung eingeklappt. |
| 2026-10-05 | JS-18 und OVL-4: gemeinsamer Helfer `inertOutside` für Drawer, TOC-Dropdown und Skill-Graph-Sheet. |
| 2026-10-05 | Inhalts-Markup barrierefrei über `_plugins/inhalts-a11y.rb` (scrollbare Codeblöcke per Tastatur, benannte Aufgabenlisten). |
| 2026-10-05 | Service Worker: Precache mit `cache: 'no-cache'`, `CACHE_URLS` vollständig, `precache.spec.js` neu. |
| 2026-10-05 | MathJax lädt seinen Kern erst, wenn eine Formel in die Nähe rückt. |
| 2026-10-05 | HTML-2 und 1.4.10: `<main id="inhalt">` fasst Hero und Inhalt, der Hero-Titel bricht überlange Wörter um. |
| 2026-10-05 | HTML-3 und SEO: Avatar mit Maßen, Microdata-Headline der Startseite aus `seo_title`. |
| 2026-10-05 | Lesezeit einheitlich über `_plugins/lesezeit.rb`. |
| 2026-10-05 | Typografie und Bedientexte nach Abschnitt 7 und 8 (geschützte Leerzeichen, Minuszeichen, Durchkopplung). |
| 2026-10-05 | SEC-11 ohne Offen-Vermerk, `.env.example` entfernt, `tests/serve.js` gegen Pfad-Ausbruch, JS-1 auf CI. |
| 2026-10-05 | SCSS aufgeräumt: toter Selektor, ein Kurven-Literal und ein ungenutztes Token entfernt (SCSS-17). |
| 2026-10-05 | Doku an Code und 16.1 angeglichen, Durchsetzungs-Marker nachgeführt (TV-1, BP-6, REV-1, REV-2, GIT-8). |
| 2026-10-05 | `scale-guardrail.sh`: Der Dateikopf nennt auch TYP-7, nur Kommentar. |
| 2026-10-05 | R-93 neu: Das Logo-Flackern hält im Leerlauf Style-Neuberechnungen am Laufen (Owner-Punkt). |
| 2026-10-05 | R-89, R-90, R-91 und R-92 erledigt (`inhalts-a11y.rb`, `overflow-wrap` am Hero-Titel, Maße am Avatar). |
| 2026-10-05 | IMG-3 und IMG-4: Die Fraktal-Kachel lädt per `srcset` eine von zwei kleinen Breiten statt der Vorlage. |
| 2026-10-05 | Die Footer-Navigation heißt für Screenreader „Fußzeile“. |
| 2026-10-05 | Lint-Job sichert einen YAML-Leser für `content-check.py`, R-94 neu. |
| 2026-10-05 | SPA-Ausbau, Schritt 1 (ARCH-2): Jeder interne Seitenwechsel ist ein volles Laden mit Cross-Document View Transition. |
| 2026-10-05 | SPA-Ausbau, Schritt 2: Speculation Rules schließen nur noch `/mandelbrot/` und die Drawer-Links aus, Helfer `whenActivated` (SEO-5, PERF-4, JS-18). |
| 2026-10-05 | SPA-Ausbau, Schritt 3: Seiten-Module mounten einmal beim Laden, `spa-module.js` und reiner Swap-Teardown entfernt. |
| 2026-10-05 | SPA-Ausbau, Schritt 4: `mathjax-typeset.js` entfernt. |
| 2026-10-05 | SPA-Ausbau, Schritt 5: Service Worker ohne SPA-Zweig, `precache.spec.js` prüft auch die Gegenrichtung. |
| 2026-10-05 | SPA-Ausbau, Schritt 6: `spa-nav.js` gelöscht, `tests/navigation.spec.js` und `tests/sw.spec.js` neu. |
| 2026-10-05 | SPA-Ausbau, Schritt 7 (Doku): ARCH-2 auf Ist, 10.2 neu gefasst, SPA-4 und SPA-6 entfallen, `docs/features/seitenwechsel.md`, R-95 neu. |
| 2026-10-05 | Pflege-Anleitung `docs/pflege.md` (ARCH-5, DOC-1, INH-5), dazu 16.1 und LIQ-3 um die Prüfung auf Pfade ohne `relative_url` ergänzt und R-95 als seitenunabhängiges Muster in `a11y.spec.js` geführt. |
| 2026-10-05 | Guide nach ARCH-7 entschlackt: Ist-Regeln mit CI-Check auf Regel und Check gekürzt, Herleitungen und Messwerte in die Commits, Abschnitt 19 auf eine Zeile je Änderung, Doppelungen zusammengeführt (SEC-9 zu LINK-3, PERF-4 zu SEO-5), veraltete Verweise korrigiert (Kopf, SG-3, SEC-8d, DOC-1), alle Regel- und Register-IDs erhalten. |
| 2026-10-05 | ARCH-5 auf Ist (jede Inhaltsart in höchstens fünf Schritten in `docs/pflege.md`, am Code und per Probelauf geprüft) und ARCH-7 auf Ist (Entschlacken abgeschlossen). |
| 2026-10-05 | R-96 neu: Übergang für „Zurück“ in Einträge der alten SPA nach dem Update (`sw-register.js`, entfällt ab 2026-12-01). |
| 2026-10-05 | SEC-5e neu: JS- und CSS-URLs tragen die Build-Version, gegen gemischte Stände in WebKit nach einem Deploy. |
| 2026-10-05 | SEC-3: Speculation Rules per sha256-Hash statt `'inline-speculation-rules'`, `csp-check.py` prüft den Hash gegen den gebauten Block, R-86 erledigt. |
| 2026-10-05 | R-85 erledigt: „Neueste Beiträge“ als H2 im eigenen Abschnitt, Kartentitel per `heading_level` eine Ebene darunter, Optik unverändert (SEITE-3). |
| 2026-10-05 | R-94 erledigt: Kachelbilder mit `width`/`height` aus der Datei über `_plugins/bildmasse.rb`, `content-check.py --site` warnt ohne Maße (IMG-3). |
| 2026-10-05 | R-82 erledigt: JS-12 geklärt (`passive` nur bei `touchstart`, `touchmove`, `wheel` und `mousewheel`, bei `scroll` und `resize` wirkungslos, Debounce gleichwertig zu rAF, Messungen über `onDocumentResize` ausgenommen), `fractal-panel.js` schaltet die Zoom-Knöpfe rAF-gedrosselt um. |
| 2026-10-06 | ARCH-4, R-88 zum größten Teil erledigt: Bedientexte der Fraktal-Panels in `_data/fractal_panel.yml`, Erklärboxen in `_data/mandelbrot.yml`, Skill-Graph-Texte samt Breite-Liste in `_data/skill_graph.yml`, Copyright-Zeile über `powered_by`, Text unverändert. SEC-1 ohne Ausnahme für `fractal-panel.js`, R-65 nachgeführt, R-88 auf den Rest gekürzt und um Fundstellen ergänzt. ARCH-5: `content-check.py` prüft Text-Schlüssel der Bedienung und die Felder der Erklärboxen. |
| 2026-10-06 | R-88 Rest nach Owner-Wahl: Lesezeit und „Zurück nach oben“ lesen die Theme-Keys aus `_data/ui-text.yml` (neu `minute_read_one` für den Singular), übrige Bedientexte bleiben als Ausnahme im Code, Panel-Überschriften mit dem Beitrag. README nennt `_data/fractal_panel.yml` unter MIT. |
| 2026-10-06 | R-78 erledigt (Owner): Hamburger gleitet erst zusammen, dann dreht er (je halbe Dauer), Hover-Balken volles Cyan statt Magenta, Hover-Deckkraft 0,8 entfällt (FARB-10, 6.4). |
| 2026-10-06 | R-93 erledigt (Owner): Logo-Flackern als Compositor-Schleife an eigenem `logo-roehren.svg`, Main Thread im Leerlauf ohne Neuberechnungen (PERF-7, ICON-4). |
| 2026-10-06 | Touch-Ziele (Owner): Menü-Knopf und Buttons treffen unter `(pointer: coarse)` auf 44 px per `touch-target-pad`, Skill-Chips nach 24-px-Regel, Test in `invariants.spec.js` (6.1, BP-3, Mixin-Tabelle, 16.1). |
| 2026-10-06 | Neon-Schriftzug auf dem Compositor (Owner, PERF-7): Schein einmal gemalt, Text-Puls über die Deckkraft einer Glow-Ebene, Punkt-Puls über `scale`, Flackern unverändert, Pause auch bei verborgenem Tab, abgeschaltete Punkt-Animationen als `none` statt mit Dauer 0, Test in `navigation.spec.js`. |
| 2026-10-06 | R-72 erledigt (Owner): `$text-color` als Alias auf `$body-text-color` (`#e8e6e3`), FARB-10 auf Ist. |
| 2026-10-06 | R-21 erledigt (Owner): Legacy-Laufweiten auf die Skala angeglichen und gelöscht, Leitspruch ohne Laufweite, `scale-guardrail.sh` erlaubt bei Laufweiten nur noch die drei Skalen-Tokens und liest Mixin-Defaults (TYP-7, Mixin-Tabelle, 16.1). |
| 2026-10-06 | R-95 als dokumentierte Ausnahme in 6.5 (Owner): Fußnoten-Rücksprung mit Namen „Zurück zum Text“ über `inhalts-a11y.rb`, axe-Meldung bleibt, Glossar und 16.1 ergänzt. |
| 2026-10-06 | R-67, Teil Vorschaubild (Owner): `og-vorschaubild.jpg` (1200 × 630, Hero-Motiv mit Namen und Adresse, `scripts/og-image.js`) auf allen Seiten vor dem Hero, `/mandelbrot/` mit `mandelbrot-preview.jpg`, `og:image:width` und `og:image:height` aus der Datei, SEO-3 auf Ist, IMG-1 mit Ausnahme. |
| 2026-10-06 | IMG-6 (Owner): Der Alt-Text des Hero-Hintergrunds bleibt, er dient nur noch als Rückfall für das Vorschaubild. |
| 2026-10-06 | SEC-10a auf Ist (Owner): Datenschutzerklärung `/datenschutz/` als schlichte Seite ohne Hero, Footer-Link über `_data/navigation.yml`, SEC-6, SEITE-1 und ARCH-4 nachgezogen, Glossar ergänzt. |
| 2026-10-06 | GIT-8 (Owner): Bereiche `theme` und `vendor` neu, alte Bereiche zugeordnet in `docs/commit-bereiche.md`, Commit-Hook `.githooks/commit-msg` prüft GIT-1, GIT-7 und GIT-8 (Durchsetzung „Hook“ in 1.2, kein CI-Check), Eintrag aus 16.2 nach 16.1. |
| 2026-10-06 | R-50 (Owner): Issue bei Minimal Mistakes eröffnen, Entwurf liegt vor, Register-Weg nachgeführt. |
| 2026-10-06 | Z-1 (Owner, bestätigt): Die Theme-Einblendung beim Laden bleibt aus (ARCH-3). |
| 2026-10-06 | R-87 erledigt (Owner): Gegentest in Safari auf echtem Gerät ohne Befund (BRW-2). Die Seitenwechsel prüfen die Tests in WebKit weiter nur unter Reduced Motion, Grund ist der Container ohne GPU (16.1). |
| 2026-10-06 | TYPO-2 (Owner): nie gendern, generisches Maskulinum, Schrägstriche zwischen Begriffen immer mit Leerzeichen, Beispiele im Guide angeglichen (7.3, 7.7, 3.1, 3.2, 3.5), FACH-3 um „(sinngemäß)“ ergänzt. |
| 2026-10-06 | Owner-Texte in den Beiträgen: Ubuntu als Textschrift, Prüfskripte ohne feste Anzahl, Vorschaubild in zwei Breiten, ein Zeitrahmen im Ausblick, generisches Maskulinum, Schrägstriche mit Leerzeichen, „sequenzielle“. R-69 gekürzt (Auszug der `devcontainer.json` auf Ist). |
| 2026-10-06 | Owner-Texte außerhalb von `_posts/`: Lebenslauf (ROI-Satz, Noten klein, „Wissensgraphen“, „CI / CD“), Über mich (Grammatik, „Stand-up-Paddling“, Zitate „sinngemäß“ und „zugeschrieben“ mit Quellen), 404 „Blogbeiträge“, Blog-Suche „Suche leeren“, Archiv ohne „Pagination“, neue Site-Beschreibung, Fraktal-Bedienhinweise klein im Glossar, R-65 nachgeführt, die neuen Regeln auch in `_data/fractal_panel.yml`, `_data/mandelbrot.yml`, `_data/skill_graph.yml` und `_data/ui-text.yml` umgesetzt. |
