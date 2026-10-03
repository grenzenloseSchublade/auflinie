# Style Guide auflinie

Version 2026-10-02 · Stand: 2. Oktober 2026 · Gilt für: Repo `auflinie` (Jekyll, Remote-Theme Minimal Mistakes, Dart Sass über jekyll-sass-converter, Versionen in `Gemfile.lock`, `_config.yml` und `package-lock.json`)

Ist-Angaben wurden gegen Commit `848efe2` erhoben, bis `4adea55` nachgeführt und am 2. 10. 2026 gegen den Code-Stand `75c23c0` abgeglichen, am Abend nach dem Abbau der Code-Einträge des Registers nachgeführt: jede Regel mit Status Soll oder Offen und jeder Registereintrag am Code geprüft, erfüllte Regeln auf Ist, erledigte Einträge aus dem Register (Abschnitt 17), neu gefundene Abweichungen eingetragen. Ausgenommen sind die Skill-Graph-Regeln, die eine laufende Überarbeitung neu fasst (Hinweis in 4.4). Bei jedem neuen Ist-Stand werden die Ist-Sätze und das Register neu geprüft und dieser Satz aktualisiert.

Dieses Dokument ist die **einzige normative Quelle** für Gestaltung, Code, Sprache, Sicherheit und Arbeitsweise im Repo. Es kodifiziert die Entscheidungen des Owners (Abschnitt 1.7) und verlinkt externe Standards. Einzelbefunde, Messwerte und der Ist-Zustand stehen im Audit-Bericht `docs/audits/2026-10-01-audit.md`, die Sicherheitsbefunde in `docs/audits/2026-10-01-security.md`. Beide Berichte sind Momentaufnahmen vom 1. 10. 2026 und nicht normativ. Was seither behoben ist, steht nur hier, nicht im Bericht.

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

- Quellen: `assets/_sass`, `assets/js`, `service-worker.js`, `_includes` (inklusive `_includes/logo.svg`), `_layouts`, `_pages`, `_posts`, `_drafts`, `_data`, `index.html`, `404.html`, `offline.html`
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
- **GOV-5** [MUSS · Ist · Review] Das zentrale Ausnahme-Register ist die Summe aller Marker. `grep -rnE '(fs|farb|bp|skala)-Ausnahme:|ausnahme [A-Z]+-[0-9]+:'` listet es vollständig (heute nur Code-Marker, `ausnahme …` in Liquid, YAML oder Commits kommt nicht vor). Bekannte Verstöße ohne Marker stehen in Abschnitt 17.

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
| Persistent Shell | Navigation per `spa-nav.js`: Masthead bleibt stehen, nur `.initial-content` wird getauscht |
| Wired-Set | Pfade, zwischen denen `spa-nav.js` per Content-Swap navigiert (`isWired`) |
| PE-Fallback | Progressive-Enhancement-Pfad: ein Modul mountet selbst, wenn `spa-nav.js` nicht aktiv ist |
| Kaskaden-Falle | Theme-Regeln wie `.page__content p` machen niedrig spezifische eigene Deklarationen wirkungslos (TYP-4) |
| Kill-Switch | globaler Reduced-Motion-Block in `base/_accessibility.scss` |
| Theme-Brücke | `assets/_sass/_theme-bridge.scss`, die einzige Stelle, die Minimal Mistakes per `@import` lädt und ihm die eigenen Tokens übergibt (SCSS-4) |
| Choreografie | gekoppelte Abfolge mehrerer Animationen (View Transition, CRT, Drawer, Neon) |
| Hover-Lift | Anheben eines Elements per `translateY` beim Hover |
| Front-Loading | Kernaussage an den Anfang von Satz, Überschrift oder Listenpunkt |
| Review-Blocker | Befund, der einen Merge verhindert, bis er behoben ist |

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
| Seite | `#252a34` | `$page-bg`, Spiegel des MM-Dark-Skins (Critical-CSS, `theme-color`). Das Theme-`$background-color` kommt weiter aus dem Skin (FARB-10) |
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

Das Theme-Token `$text-color` (`#eaeaea`) bleibt für die Ableitungen des Themes stehen, den Fließtext setzt `body { color: $body-text-color }`. Maßgeblich ist der gerenderte Wert. Der Token-Kommentar in `_colors.scss` nennt für 75 % Cyan 5,30:1 (ungerundete Komposition), die Tabelle rechnet gerundet.

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

- **FARB-1** [MUSS · Ist · CI] Farbliterale stehen nur in `variables/_colors.scss`. Komponenten-Tokens (`fractal-panel/_tokens.scss` und künftige) zeigen nur auf globale Tokens (siehe SCSS-8). Braucht eine Komponente einen neuen Ton, kommt er zuerst als globales Token nach `_colors.scss`. Ausnahmen nur mit `farb-Ausnahme`-Marker (CRT-Phosphor, Neon-Flackern, Fraktal-Paletten als Daten): `// farb-Ausnahme: Grund` direkt über der Deklaration (gilt für die ganze, auch mehrzeilige Deklaration) oder `// farb-Ausnahme: [Block] Grund` … `// farb-Ausnahme-Ende` um einen Effekt-Abschnitt. `scripts/color-guardrail.sh` prüft `assets/_sass` außerhalb von `variables/`. Markiert sind heute: CRT-Overlay, CRT-Raster, Rollbalken, Korn, Power-Symbol und Phosphor im Hero, Phosphor und Scanlines in `_view-transition.scss`, der Neon-Block in `_neon-base.scss` und der Logo-Selektor `[stroke="#f0c"]`. Die Neon-Custom-Properties in `variables/_css-properties.scss` sind Effektwerte unter `variables/` (Markenton offen, B-F09).
- **FARB-2** [MUSS · Soll · CI-P2] Text erreicht 4,5:1, großer Text (ab 24 px oder ab 18,66 px fett) 3:1, UI-Grafik und Fokus 3:1, und zwar in **allen** Zuständen, gemessen auf dem tatsächlichen Grund. Jeder Kontrastwert in einem Token-Kommentar nennt seinen Grund („4,51:1 auf Drawer“). Die Textproben der Styleguide-Ansicht prüft `tests/visual/contrast.spec.js` schon in der CI, ein Token-Kontrast-Skript fehlt (16.2). Bestand: R-52.
- **FARB-3** [MUSS · Soll · Review] Informationstragender Text nie unter `$fg-subtle` (55 %). Werte von 25 bis 40 % nur für rein dekorative Glyphen (z. B. Footer-Trenner). Bestand: R-52.
- **FARB-4** [MUSS · Soll · Review] `-subtle`-Tokens sind für Linien, Marker und Flächen. Nie als Textfarbe, nie als einziges Erkennungsmerkmal eines Controls. Bestand: R-52.
- **FARB-5** [MUSS · Ist · CI] Niemals ein Token mit eingebautem Alpha in `rgba()` geben. Sass ersetzt den Alpha-Kanal, multipliziert ihn nicht (Beispiel: `rgba($console-panel-border, 0.7)` wird zu 70 % Weiß). Der Guardrail erkennt Alpha-Tokens auch über Aliase. Die einzige Fundstelle (`.guide-banner`) steht seit 1. 10. 2026 auf `$white-a70`, dem bisher gerenderten Wert.
- **FARB-6** [MUSS · Ist · CI] Keine Ad-hoc-Abstufung `rgba($hover-color, 0.x)`. Benannte Abstufungen (`$magenta-aNN`) verwenden oder in `_colors.scss` neu anlegen (Owner-Regel vom 8. Juli 2026). Der Guardrail lässt dafür keinen Ausnahme-Marker zu.
- **FARB-7** [MUSS · Soll · Review] Fokus- und Hover-Zustand nehmen Vorder- und Hintergrund nie aus demselben Token.
- **FARB-8** [MUSS · Soll · CI-P1] Farb**literale** in der Notation `rgb(r g b / a%)`, Hex lang und klein, keine Farbnamen außer `transparent`, `currentColor`, `inherit`. Gilt auch für JS-Strings, Inline-Styles und das Critical-CSS. Sass-Funktionen auf Tokens (`rgba($link-color, 0.6)`) dürfen Dezimal-Alpha nutzen. In `assets/_sass` und im Critical-CSS erfüllt, in `assets/_sass` per `color-guardrail.sh` geprüft (Notation in `variables/`, Farbnamen überall). Den zweiten Style-Block in `head/custom.html` gibt es nicht mehr. Die JS-Farbwerte sind seit 2. 10. umgestellt, offen nur noch `skill-graph.js` (Skill-Graph-Überarbeitung). Systemfarben (`Canvas`, `CanvasText`, `Highlight`) stehen nur im Forced-Colors-Block (A11Y-6).
- **FARB-9** [SOLL · Ist · CI] Gleicher Wert = Alias, nie zweites Literal (`$card-heading-color: $link-color`, `$selection-bg: $hover-color`, `$base00: $console-panel-bg`). Der Guardrail meldet textgleiche Literale in `_colors.scss`. Wertgleiche in anderer Schreibweise (`#ffffff` gegen `rgb(255 255 255)`) fallen nur im Review auf.
- **FARB-10** [SOLL · Soll · Review] MM-Variablen, die die Palette beeinflussen, werden explizit gesetzt: `$primary-color`, `$background-color`, `$text-color`. Ist seit 1. 10. 2026: `$primary-color: $link-color` (Rollen-Token in `_colors.scss`, Abnehmerliste im Kommentar). Sichtbar davon nur der Fokus-Schein des Blog-Suchfelds (`input:focus`, jetzt Cyan statt Teal) und der Hover der Hamburger-Balken. Den setzt `components/_masthead.scss` selbst auf `$hover-color-text` (Nav-Hover Magenta, KOMP-3), weil die Theme-Regel `mix(#000, $primary-color, 25 %)` die eigene Ruhe-Regel per Spezifität schlägt. Offen: `$background-color` und `$text-color` kommen weiter aus dem Skin (R-72).

**[Ist seit 1. 10. 2026]** Alpha-Stufen als Primitive. Jede Stufe heißt `$<familie>-aNN` (NN = Deckkraft in Prozent) und ist aus der **deckenden** Grundfarbe abgeleitet (FARB-5). Die Stufen bilden genau die Werte ab, die bei der Migration im Einsatz waren. Die Migration war optisch neutral, das gebaute CSS ist bytegleich. Eine neue Stufe kommt nur dazu, wenn keine vorhandene passt.

| Familie | Grundfarbe | Stufen (NN) | Rollen-Aliase |
|---|---|---|---|
| `$cyan-aNN` | `$link-color` | 00 · 08 · 10 · 12 · 15 · 16 · 20 · 22 · 25 · 26 · 30 · 35 · 40 · 45 · 50 · 55 · 60 · 70 · 75 · 80 · 85 | `$link-color-subtle` = a40, `$border-accent` = a55, `$border-accent-hover` = a35, `$link-color-active` und `-rail` = a75 |
| `$magenta-aNN` | `$hover-color` | 08 · 15 · 18 · 20 · 22 · 30 · 35 · 55 · 75 | keine (nur Interaktions-Momente, DES-3) |
| `$white-aNN` | `$white` | 00 · 02 · 03 · 04 · 05 · 06 · 08 · 10 · 12 · 14 · 15 · 18 · 20 · 25 · 32 · 40 · 45 · 50 · 55 · 60 · 62 · 65 · 70 · 78 · 80 · 82 · 85 · 88 · 90 · 92 · 95 | `$fg-muted` = a80, `$fg-subtle` = a55, `$console-panel-border` = a08, `$surface-tint` = a06 |
| `$black-aNN` | `$black` | 10 · 20 · 25 · 30 · 35 · 40 · 45 · 50 · 55 · 60 · 70 · 75 · 78 · 94 | `$selection-text` = `$black` |
| `$ink-aNN` | `$ink` | 35 · 45 · 55 | keine |

**[Soll]** Rollen-Ebene nach W3C DTCG (Primitive → Rollen-Tokens): Komponenten nutzen Rollen statt Stufen, die Stufen schrumpfen auf eine kleine Skala. Zusammenlegen ändert Werte, ist also eine sichtbare Änderung, die der Owner nach Vorher/Nachher-Vergleich freigibt (PROZ-1). Zielbild:

| Skala | Stufen |
|---|---|
| Weiß auf Dunkel | `$fg` 95 % · `$fg-muted` 80 % · `$fg-subtle` 55 % · `$line-strong` 15 % · `$surface-hover` 10 % · `$line` 8 % · `$surface-tint` 6 % |
| Cyan | Wash 10 % · Linie 40 % (`$link-color-subtle`) · Akzent 55 % (`$border-accent`) · Text-Aktiv ab 70 % |
| Flächen | Seite · Panel · Raised · Overlay/Drawer · Scrim · CRT-Grund (`$crt-screen-bg`) |

**[Offen]** Palettenfragen: Marken-Magenta (`#ff00ff` oder `#ff00cc`), zweites Marken-Cyan `#00ffff` im Neon, Status-Farben ja oder nein (Audit B-F09). Ob das Slider-Blau `$slider-connect-blue` (`#4aa3ff`, Audit B-F23) ein Palettenton wird oder in Cyan aufgeht. Komponenten-Tokens zeigen schon nur noch auf globale Tokens.

### 3.2 Typografie

Quelle `variables/_typography.scss`. Die Skala ist bewusst „cluster-treu“ zu den gewachsenen Werten. Die px-Spalte gilt bei 16 px Root-Größe. Das Critical-CSS setzt `html { font-size: 100% }`, die Browser-Einstellung der Besuchenden (Standard 16 px) gilt also, die Theme-Rampe 18/20/22 px bleibt bewusst aus (Owner-Freigabe 1. 10. 2026).

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

- **TYP-1** [MUSS · Ist · CI] Jede `font-size` nutzt ein Token. px- und rem-Literale nur mit `fs-Ausnahme` (CI: `scripts/fs-guardrail.sh`).
- **TYP-2** [MUSS · Soll · Review] em nur für Inline-Anpassungen im Kontext (Icons, `<code>`, Pseudo-Glyphen) und für diese dokumentierten em-Systeme: Hero-H1, TOC-Ebenen, Masthead (`$site-title-font-size`, `$nav-font-size`), CV-Skill-Gruppen und -Chips. Neue em-Systeme nur nach Eintrag in diese Liste.
- **TYP-3** [MUSS · Soll · Review] Funktionaler Text (Buttons, Formular-Labels, Hinweise, Daten) nie unter `$fs-label` (11,5 px). `$fs-label-xs` und `$fp-fs-2xs` nur für Deko. Bestand: R-54.
- **TYP-4** [MUSS · Soll · CI-P3] Kaskaden-Falle: Größen und Abstände auf `<p>`, `<li>`, `<dl>` innerhalb von `.page__content` brauchen Spezifität ab (0,1,1) und spätere Position. Muster: `.block p.block__text`. Kommentar mit Verweis auf die Theme-Regel. Gilt analog für Komponenten-Überschriften, die direkte Kinder von `.page__content` sind.
- **TYP-5** [MUSS · Ist · Review] Ein entdeckter toter Wert wird auf den **gerenderten** Wert festgeschrieben. Den ursprünglich gemeinten Wert scharfzuschalten braucht eine Owner-Freigabe mit Screenshot-Vergleich.
- **TYP-6** [MUSS · Soll · CI-P3] Nach jeder Änderung an Typografie, Abständen oder Theme-Overrides läuft `scripts/cascade-check.py` gegen das gebaute CSS.
- **TYP-7** [MUSS · Ist · CI] `line-height` einheitenlos (erfüllt). `letter-spacing` in em, nur aus der Laufweiten-Skala `$tracking-meta`, `$tracking-label`, `$tracking-label-wide` (`variables/_typography.scss`). Werte außerhalb der Skala stehen dort wertgleich als `$tracking-legacy-*` und `$fp-tracking-legacy-*`, die Angleichung ist sichtbar und braucht eine Owner-Freigabe (TYP-5). Bestand: R-21. Literale in `letter-spacing` zählt `scale-guardrail.sh` (Kategorie `tracking`, Grenze 0).
- **TYP-8** [SOLL · Soll · Review] Gewichte numerisch, kein `bold`. `500` nur bewusst (fällt bei vielen System-Fonts auf `400` zurück, die Ubuntu-Achse deckt es ab, TYP-13). Bestand: R-54.
- **TYP-9** [SOLL · Soll · Review] Ziffern in Mono-Daten mit `font-variant-numeric: tabular-nums`.
- **TYP-10** [SOLL · Offen · Review] Fließtextspalte höchstens 75 Zeichen. `$content-width: 46rem` sind 736 px, das ergibt bei 16 bis 18 px Sans geschätzt 80 bis 90 Zeichen. Vor einer Festlegung wird gemessen. Danach wird entweder das Token (zum Beispiel in `ch`) oder die Regel angepasst. Blocksatz nur mit `hyphens: auto`, `lang` und linksbündig bis 480 px Breite (Home-Intro, Owner-Entscheidung).
- **TYP-11** [SOLL · Soll · Review] Überschriftengröße und -gewicht fallen monoton mit der Ebene. Abweichung: H4 ist schwerer als H3 (Überschriften-Matrix, Owner-Entscheidung offen).
- **TYP-12** [MUSS · Ist · Review] Einzige Webfonts sind die drei Font-Awesome-Subsets, die MathJax-NewCM-Fonts und die Textschrift (TYP-13). Ein neues Icon heißt: Icon-Klassen im gebauten `_site` inventarisieren, Subset mit `pyftsubset` neu erzeugen, Liste im Kopf von `base/_icons.scss` nachziehen, alles in einem Commit.
- **TYP-13** [MUSS · Ist · Review] Eine Textschrift für Fließtext, Überschriften und Navigation: Ubuntu, selbst gehostet (Owner-Entscheidung 1. 10. 2026). Sie kommt nur über `$sans-serif`, kein Partial und nicht das Critical-CSS setzt eine eigene Sans-Familie. Die Konsolenschrift `$mono-font-stack` bleibt davon unberührt. Schalter `text_font` in `_config.yml`: `ubuntu` (Standard) oder `system` (Systemschrift, dann weder `@font-face` noch Preload noch Precache). Dateien: zwei variable WOFF2 (aufrecht, kursiv), Gewichtsachse 400–700 deckt die genutzten Gewichte 400, 500, 600 und 700 exakt ab, Latin-Subset mit deutschen Zeichen, `font-display: swap`. Bis zum Laden steht eine metrisch angepasste Ersatzschrift (Arial bzw. Liberation Sans mit `size-adjust` und `ascent-override`). Quelle ist das Ubuntu-Paket `fonts-ubuntu` 0.869 von Canonical, erzeugt mit `scripts/ubuntu-font-subset.py` (gepinnte SHA-256). Weil ein Subset nach Ubuntu Font Licence 1.0 (2c) eine abgeleitete Fassung ist, heißt die Familie „Ubuntu derivative auflinie“. Lizenz liegt als `assets/webfonts/UBUNTU-FONT-LICENCE.txt` neben den Dateien. Neue Zeichen außerhalb des Subsets fallen auf die Systemschrift zurück. Wer sie braucht, erweitert `UNICODES` im Skript und `unicode-range` in `base/_fonts.scss` gemeinsam. Nach einem Wechsel des Schalters werden die Vergleichsbilder neu erzeugt.

**[Soll]** Gewichts-Tokens `$fw-regular` / `$fw-medium` / `$fw-semibold` / `$fw-bold` (`$medium-weight` wird zu `$fw-semibold` und entfällt). Zeilenhöhen `$lh-none` `1` · `$lh-tight` `1.2` · `$lh-snug` `1.35` · `$lh-body` `1.6`. `$monospace: $mono-font-stack` vor dem Theme-Import. **[Ist seit 2. 10. 2026]** Laufweiten-Tokens (TYP-7). Ein einziger Sans-Stack, auch im Critical-CSS (TYP-13).

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
| `--sticky-toc-height` | per JS | Laufzeit |
| `--anchor-offset` | Masthead + Sticky-TOC + `20px` | Anker-Offset |

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
```

- **BP-1** [MUSS · Ist · CI] Bereiche sind halboffen: `up(x)` ab dem Wert, `down(x)` bis Wert minus `0.02px`, `between(x, y)` dazwischen. Eigene `@media`-Zeilen mit Breite oder Zahl gibt es nur in `abstracts/_breakpoints.scss`, eine neue Grenze kommt zuerst als `$bp-…` in die Tabelle. Check: `scripts/bp-guardrail.sh` (wertet auch berechnete Tokens wie `$bp-drawer` aus, liest `@media` über mehrere Zeilen, sperrt das Theme-Mixin `breakpoint()` im eigenen Code auch mit Namespace und prüft die Queries in allen Templates, vor allem im Critical-CSS).
- **BP-2** [MUSS · Ist · CI] JS fragt Breiten nur über `window.AuflinieUtils.mq` ab (`downMd`, `downLg`, `downXl`, `MediaQueryList` aus `site-utils.js`), mit Fallback ohne Zahl, falls `site-utils.js` fehlt. Kein Lesen der Viewport-Breite (`innerWidth`, `documentElement.clientWidth`, `screen.width` …), kein eigenes `matchMedia()` mit Breite oder mit einem Argument, das kein Literal ist. Wer die Breite für etwas anderes als eine Layout-Weiche braucht, setzt `// bp-Ausnahme: <Grund>` darüber. Ausnahme von JS-8: Die Abfragen stehen als Literal in `site-utils.js`, weil eine Media-Query kein `var()` liest. Check: `scripts/bp-guardrail.sh` vergleicht sie mit den Tokens und meldet Breiten-Abfragen in anderen Skripten.
- **BP-3** [MUSS · Soll · Review] Interaktion per Fähigkeit, Layout per Breite: Hover-Stile in `@media (hover: hover)`, Zielgrößen in `@media (pointer: coarse)`. Bestand: R-55.
- **BP-4** [SOLL · Soll · Review] Neue Regeln mobile-first (`up()`). Der Bestand nutzt noch überwiegend `down()` (R-55), er wird bei Berührung umgedreht, unter Beachtung von BP-6.
- **BP-5** [MUSS · Ist · CI] Prefix-Notation (`min-width`/`max-width`), keine Range-Syntax, solange `.stylelintrc.json` das festlegt (`media-feature-range-notation: prefix`). Grund: Range-Syntax erst ab iOS Safari 16.4.
- **BP-6** [MUSS · Ist · Review] Gate-Paare aus CSS und JS werden nur gemeinsam im selben Commit geändert. Heute: (a) View-Transition-Gate `@media (prefers-reduced-motion: no-preference) { @view-transition … }` in `_view-transition.scss` und `vtGate` in `greedy-navigation.js`. (b) Mobil-Gate für das CRT-Umschalten: `AuflinieUtils.mq.downMd` in `tv-switch.js` und `down(md)` beim Vollbild-Hero (`_hero.scss` und Critical-CSS in `_layouts/default.html`). Weitere Paare an derselben Grenze: Sticky-TOC (`toc.js` `downLg`, `_toc.scss` `down(lg)`), Zoom-Knöpfe im Fraktal-Panel (`fractal-panel.js` `downMd`, `fractal-panel/*.scss` `down(md)`).

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
| `$z-drawer-toggle` | `1010` | Burger/X, im Masthead über der Drawer-Liste |
| `$z-sheet` | `1100` | Skill-Graph-Ebene (Scrim) |
| `$z-sheet-panel` | `$z-sheet + 10` | Skill-Graph-Sheet |
| `$z-notice` | `10010` | Blog-Hinweis |
| `$z-offline` | `$z-toast - 1` | Offline-Hinweis |
| `$z-toast` | `10020` | Service-Worker-Toast |

Die Theme-Animation `#main { animation: $intro-transition }` erzeugt einen Stacking-Kontext auf `#main`. Was darin fixiert ist (TOC, Back-to-Top, Blog-Hinweis), konkurriert nicht mit den Ebenen außerhalb (Register R-10).

- **Z-1** [MUSS · Soll · Review] Modale, Toasts und app-weite Floats werden am `<body>` gemountet (Vorbild `sw-register.js`), nie innerhalb von `#main`. **[Offen]** Alternative: `$intro-transition: none` vor dem Theme-Import beseitigt den Stacking-Kontext direkt, nimmt aber auch Masthead und Seite die Theme-Einblendung (sichtbare Änderung, Owner).
- **Z-2** [MUSS · Ist · Review] Lokale Stapel 0 bis 10 nur in Containern mit `isolation: isolate` und mit Skalen-Kopfkommentar. Vorbild: Skala im Kopf von `components/_fractal-panel.scss`, `isolation: isolate` in `components/fractal-panel/_canvas.scss`. Die Werte stehen als benannte Variablen am Dateikopf (`$hero-z-*`, `$fp-z-*`, `$cv-z-*`, `$masthead-z-*`, `$graph-z-touch-hint`) unter einem `skala-Ausnahme`-Marker. Größer als 10 sind der Hero-Stapel (`15`, `25`, `100`, `101`) und die Vollbild-Ebenen des Fraktal-Panels (`200`, `250`, `300`), dort trägt die Reihenfolge, nicht der Wert.
- **Z-3** [SOLL · Ist · CI] Globale Ebenen nur über die `$z-*`-Tokens. Einzelne Variablen statt Map mit `z()`-Funktion: Ein Tippfehler bricht so den Build ab, `map.get` lieferte still `null` und Sass ließe die Deklaration weg. Der Skalen-Guardrail zählt z-index-Literale (Ratchet).

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

- **RAD-1** [SOLL · Ist · CI] Radien und Schatten nur aus diesen Tokens. Der Skalen-Guardrail lässt keine Literale zu (Grenzwert 0), auch nicht über lokale Variablen.

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

- **MO-1** [MUSS · Soll · CI] Kein `transition: all`, kein implizites `transition: 0.3s`. Properties explizit nennen, bevorzugt nur `transform` und `opacity`. Dazu wird Theme-`$global-transition` (`all 0.2s ease-in-out`) vor dem Theme-Import auf explizite Properties gesetzt, sonst erzeugt das Theme selbst `transition: all`. Im eigenen SCSS gibt es keins mehr, der Skalen-Guardrail lässt keine neuen zu (Theme-Rest R-11).
- **MO-2** [MUSS · Ist · CI] Eine Zeiteinheit (ms) für neue Deklarationen, Dauern aus der Skala. Der Skalen-Guardrail zählt Zeit- und `cubic-bezier()`-Literale (Grenzwert 0). Hinweis- und Ambient-Animationen über 500 ms (Scroll-Hinweis, Power-Puls, Aufglimmen, Lade-Puls) tragen einen `skala-Ausnahme`-Marker wie die Choreografien (MO-4).
- **MO-3** [SOLL · Soll · Review] Einblenden verzögernd, Ausblenden beschleunigend und kürzer. Ausblenden mit Visibility-Delay (`visibility 0s linear <dauer>`).
- **MO-4** [MUSS · Ist · Review] Choreografien stehen außerhalb der UI-Skala und behalten benannte lokale Variablen am Dateikopf: View Transition, CRT, Neon, Logo-Flackern **und der Drawer**. Ihre Literale tragen `skala-Ausnahme`-Marker statt UI-Tokens, damit ein gleicher Zahlenwert sie nicht an die UI-Skala koppelt. Die Drawer-Werte sind abgenommen und gekoppelt: VT-Exit `vt-drawer-exit` (`200ms`) und `$crt-drawer-offset` in `_view-transition.scss`, Slide `0.3s` / `0.24s` in `_masthead.scss`, Fallback-Timer in `greedy-navigation.js` (`320` nach dem Slide-Out, `360` für `inert` nach dem Slide-In). Sie werden nur gemeinsam geändert.
- **MO-5** [SOLL · Soll · Review] CSS ist die Quelle für Dauern. JS liest Custom Properties über einen gemeinsamen Helfer (s- und ms-fähig, Vorbild `hero-crt.js` `readHeroCrtFlashDurationMs`, Ziel `cssDurationMs` in `site-utils.js`, siehe JS-18). Fallbacks gleichen dem Token exakt. Wird MUSS, sobald der Helfer existiert.
- **MO-6** [MUSS · Soll · Review] `transitionend` und `animationend` filtern auf `target` und `propertyName` bzw. `animationName`. Vorbilder: `greedy-navigation.js` (`onSlideEnd`, `onOpenEnd`), `hero-crt.js` (`onAnimationEnd`). Bestand: R-57.
- **MO-7** [SOLL · Soll · Review] Hover-Lift höchstens zwei Stufen (Buttons `-2px`, Karten `-3px`). Erfüllt in `_buttons.scss` (`-2px`), Beitrags- und Kontakt-Karten (`-3px`). Offen: `.entries-grid .archive__item:hover` nutzt noch `$hover-transform` (`-5px`) auf der Startseite.

---

## 4 Komponenten und Mixins

Quelle `abstracts/_mixins.scss`, geladen mit `@use "abstracts/mixins" as *;`. Ein Mixin ist Pflicht, sobald sein Look zutrifft. Handnachbauten sind ein Review-Blocker.

| Mixin | Wann | Hinweis |
|---|---|---|
| `card-panel($accent: 2px, $radius: $radius-lg)` | jede Fläche mit Panel-Ton und Hairline | `$accent: 0` ohne Cyan-Rand. Hover pro Komponente. |
| `section-break` | Kapitelgrenze (Sektions-H2) | Beige-Hairline oben, viel Luft |
| `accent-header($size: $fs-heading, $rule: true)` | Sektions- und Panel-Überschriften | Markdown-H2: `accent-header($fs-heading, false)` plus `section-break` |
| `mono-label($size: $fs-label, $tracking: $tracking-legacy-mono-label)` | Chrome-Labels (Mono, Versalien) | Default heute `0.07em` als Legacy-Token. **[Soll]** Default auf `$tracking-label` (`0.06em`), Aufrufe nur mit `$tracking-label` oder `$tracking-label-wide` (sichtbar, R-21) |
| `btn-role-primary` | primäre Aktion | getöntes Cyan |
| `btn-role-outline` | sekundäre Aktion | Cyan-subtle-Rand |
| `backdrop-blur($px)` | jeder Blur | einzige erlaubte Quelle für `backdrop-filter` |
| `hover-effect($transform-value: -5px)` | Altbestand | einziger Aufruf `hover-effect(-3px)` in `_about.scss` (MO-7 erfüllt). **[Soll]** Default und das ungenutzte `$hover-transform` (`-5px`, `variables/_layout.scss`) entfernen |

Buttons:

| Rolle | Umsetzung | Kontext |
|---|---|---|
| Primär | `.btn--primary` → `btn-role-primary` | höchstens einer pro Ansicht |
| Outline | `.btn--outline` → `btn-role-outline` | sekundäre Aktionen |
| Light-Outline | `.page__hero--overlay .btn--light-outline` | Hero-Actions, weiß gerahmt (DES-6) |
| Keycap | Fraktal-Toolbar | nur im Fraktal-Panel |

- **KOMP-1** [MUSS · Ist · CI] Zustandsmatrix für jedes interaktive Element: Ruhe · Hover in `(hover: hover)` · `:focus-visible` mit dem globalen Magenta-Ring · Pressed · Ausgewählt (`aria-pressed`, `aria-current`, `.is-active`) · Disabled. Ablage: Styleguide-Ansicht (SG-1 bis SG-3), Check: Screenshot-Vergleich der erzwungenen Zustände.
- **KOMP-2** [MUSS · Soll · Review] Kein `:focus` als Stil-Selektor außer im globalen Reset `:focus:not(:focus-visible)`. Bestand: R-56, darunter `btn-role-*`.
- **KOMP-3** [MUSS · Ist · Review] Hover-Farbsemantik (Owner, 1. 10. 2026): Navigations-Textlinks (Masthead, Drawer, TOC) hovern in `$hover-color-text` (`#ff2fd2`, dunkelster Ton desselben Magentas mit 4,5:1). `$hover-color-subtle` bleibt Linien und Flächen vorbehalten (FARB-4). Buttons, Karten, Chips hovern über die Cyan-Rahmenstufe. Der Cyan-Hover-Grund der Masthead- und Drawer-Links (`$cyan-a10`) bleibt (Owner, nie ungefragt entfernen). Die TOC-Links hovern ohne Grund. **Dokumentierte Ausnahme (Owner, 1. 10. 2026):** Auf dem Cyan-Grund erreicht `$hover-color-text` nur 3,68:1. Das gilt ausschließlich im kurzen Hover-Moment, der Ruhezustand ist weiß. Der hellere AA-Ton `#ff63dd` wurde verworfen. Neue Stellen übernehmen die Ausnahme nicht, sie gilt nur für Masthead und Drawer.
- **KOMP-3a** [MUSS · Ist · Review] Navigations-Fokus ist ein Rahmen, keine Füllung: `outline: 2px solid $hover-color; outline-offset: -3px` (die Nav-Container clippen). Füllung plus gleichfarbiger Text ergab 1,49:1 (FARB-7).
- **KOMP-4** [SOLL · Soll · Review] Fokus-Ring als Mixin `focus-ring($offset: 2px)`: `outline: 2px solid $hover-color; outline-offset: 2px`, in Scroll-Containern `-2px`. Das Mixin fehlt noch, die Ringe sind heute je Komponente ausgeschrieben (R-56).
- **KOMP-5** [MUSS · Soll · Review] Discovery-Hinweise laufen einmalig, sind bewegungs-gegatet und entfernen ihre Klasse bei gefiltertem `animationend`. Einmalig und gegatet sind alle, den Filter auf `animationName` haben der Power-Hinweis im Hero und die Graph-Hinweise noch nicht (R-57).
- **KOMP-6** [DARF NICHT · Ist · Review] Kein `backdrop-filter` auf dem Drawer. Er ist hinter seinem opaken Grund unsichtbar und rastert jeden Frame über dem animierten Hero neu (Owner-Lehre aus der TV-Umschalt-Architektur).

### 4.1 Icons und Marke

- **ICON-1** [MUSS · Ist · Review] Icons nur aus dem Font-Awesome-Subset (TYP-12) oder als Inline-SVG. Keine Icon-CDNs.
- **ICON-2** [SOLL · Soll · Review] Icon-Größen relativ zum Text: `1em` im Fließtext, `0.85em` in Überschriften (`accent-header`), feste px nur im Fraktal-Panel (`$fp-fs-icon`).
- **ICON-3** [MUSS · Soll · Review] Dekorative Icons tragen `aria-hidden="true"` (A11Y-3). Ein Icon ohne Text braucht einen zugänglichen Namen am Button oder Link.
- **ICON-4** [MUSS · Ist · Review] Das Logo kommt aus `_includes/logo.svg` (inline im Masthead). Die Neon-Wortmarke ist Marke und darf Magenta tragen (DES-3).
- **[Offen]** Mindestgröße und Schutzraum der Wortmarke, Marken-Magenta (3.1), Umgang mit `assets/images/Logo.svg` und `WebSite_Logo_3.png` (Dateinamen verletzen NAME-1, R-71). `WebSite_Logo_3.png` ist zugleich das Site-Vorschaubild (SEO-3).

### 4.2 Links

- **LINK-1** [MUSS · Soll · Review] Linktext beschreibt das Ziel ohne Umgebung (WCAG 2.4.4). Kein „hier“, kein „mehr“ ohne Kontext.
- **LINK-2** [MUSS · Soll · CI-P4] Links im Fließtext sind unterstrichen oder anders als nur über Farbe erkennbar. Cyan hat zum Body-Text nur 1,39:1, Farbe allein reicht nicht (WCAG 1.4.1). Ist-Zustand im Audit prüfen.
- **LINK-3** [MUSS · Soll · CI-P1] Externe Links öffnen im selben Tab. Wo `target="_blank"` bleibt, trägt der Link `rel="noopener noreferrer"` (SEC-9, erfüllt) und einen Hinweis (Icon mit `.visually-hidden`-Text „öffnet in neuem Tab“). Bestand: R-70.
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

**Hinweis (2. 10. 2026):** Die Skill-Graph-Überarbeitung (Owner-Freigabe 2. 10. 2026) gibt dem Graphen Zoom per Pinch, Mausrad und Knöpfen, passt ihn beim Öffnen ein und zentriert eine Auswahl **nicht** automatisch (der Graph bewegt sich nicht von selbst). OVL-2 („der Graph hat keinen Zoom“, Mausrad verschiebt) widerspricht dem und wird mit dieser Überarbeitung neu gefasst, ebenso `$z-graph-float` (3.5) und der Skill-Graph-Knopf in R-10.

- **OVL-1** [MUSS · Ist · Review] **Gestenhoheit.** Eine Fläche, die wie ein eigenes Objekt aussieht (Canvas, Karte, Sheet, Dialog), besitzt ihre Gesten. Wischen, Mausrad und Ziehen werden nie unbemerkt an die Seite dahinter durchgereicht. Umsetzung: `touch-action: none` auf der Fläche, nicht-passive `wheel`- und `touchstart`-Handler, `overscroll-behavior: contain` bei scrollbaren Overlays. Ausnahme: Inline im Lesefluss eingebettete Flächen dürfen Ein-Finger-Wischen an die Seite geben (sonst Scroll-Falle), dann aber konsistent.
- **OVL-2** [MUSS · Ist · Review] **Gleiche Geste, gleiche Wirkung.** Mausrad über einer Fläche mit Zoom zoomt um den Mauszeiger, im Fraktal-Canvas wie im Skill-Graphen (seit 2. 10. 2026, gleicher Faktor `exp(−deltaY · 0.0016)`). Waagerechtes Wischen auf dem Trackpad und Shift+Rad verschieben. Ein Finger auf leerer Fläche verschiebt die Ansicht, auf einem Objekt zieht er das Objekt. Zwei Finger verschieben und zoomen zugleich (Pinch um den Schwerpunkt). Zoom ist zusätzlich über beschriftete Knöpfe erreichbar (Skill-Graph: „−“, „+“, „Einpassen“, an den Zoom-Grenzen `aria-disabled`; bei Fokus im Sheet auch die Tasten `+`, `−`, `0`, der Canvas trägt `tabindex="-1"`, damit ein Klick den Fokus im Dialog hält). Die Ansicht bewegt sich nie von selbst: kein Zentrieren auf eine Auswahl, keine Kamerafahrt beim Auskühlen des Layouts (Owner, 2. 10. 2026). Ohne Sheet, inline im Lesefluss, bleibt das Rad beim Seiten-Scrollen (OVL-1, Ausnahme). Neue Flächen übernehmen dieses Muster.
- **OVL-3** [MUSS · Ist · Review] **Light Dismiss.** Jedes Overlay, das keine zwingende Entscheidung verlangt (Sheet, Drawer, Dropdown, Hinweis-Dialog, Tooltip), schließt per Escape, per Klick oder Tippen außerhalb (Scrim bzw. Umgebung) und per sichtbarem ✕ bzw. Auslöser. Kein Light Dismiss nur dort, wo dabei Eingaben verloren gingen. Esc ist gestaffelt: erst Auswahl lösen, dann schließen (Skill-Graph). Das Overlay entscheidet darüber in der Capture-Phase, bevor andere Listener die Auswahl lösen (`skill-graph-sheet.js`).
- **OVL-4** [MUSS · Ist · Review] **Modal heißt vollständig modal:** Scrim, Scroll-Sperre ohne Layout-Sprung (`html { overflow: hidden; scrollbar-gutter: stable }`), Hintergrund `inert`, `role="dialog"` mit `aria-modal="true"` und zugänglichem Namen, Fokus beim Öffnen hinein und beim Schließen zurück zum Auslöser (A11Y-2). Das Overlay liegt in einer eigenen Ebene direkt unter `<body>`, nicht im Stacking-Kontext von `#main` (sonst überdecken es Footer und Masthead). Vorlage: `assets/js/skill-graph-sheet.js` (`enterModal`, `leaveModal`). Der Drawer setzt seit 1. 10. den Hintergrund `inert` (`greedy-navigation.js`: alle `body`-Kinder außer Masthead, Skripten und Live-Regionen). Gesetzt wird erst nach dem Slide-In, aufgehoben an jeder Schließ-Stelle, beim pageswap bleibt alles unangetastet. Semantisch bleibt er eine Disclosure-Navigation ohne `role="dialog"` (Register R-32).
- **OVL-5** [SOLL · Ist · Review] Non-modale Overlays (Toasts, Hinweise) sperren nichts und stehlen nicht den Fokus. Deckt ein Overlay den größten Teil des Viewports, wird es modal gebaut (OVL-4).

---


## 5 Seitenaufbau und Inhaltsmuster

- **SEITE-1** [MUSS · Ist · CI-P3] Hero → Einleitung **ohne** Überschrift → H2-Kapitel. Keine H2 „Einleitung“, „Einführung“ oder eine Wiederholung des Titels. Einleitungen dürfen länger sein, aber nicht detaillierter (7.2). Ist seit 1. 10. 2026 auf allen gebauten Seiten, in allen Beiträgen und in der Beitragsvorlage (FM-3).
- **SEITE-2** [MUSS · Ist · Review] In datengetriebenen Seiten (`_data/cv_content.yml`, `_data/mandelbrot.yml`) markiert `intro: true` die Einleitung. Die Loops in `_pages/cv.md` und `_pages/mandelbrot.md` rendern sie ohne H2 und ohne TOC-Eintrag.
- **SEITE-3** [MUSS · Soll · Review] Genau ein H1 pro Seite (Hero bzw. `page__title`, erfüllt auf allen gebauten Seiten). Keine Ebene überspringen. Gleiche Komponente = gleiche Ebene. Sidebar (Autor, TOC-Titel) ohne Überschriften-Elemente. Bestand: R-76 (Autorname).
- **SEITE-4** [MUSS · Soll · Review] Hero-Titel = Seitenname. Excerpt = ein bis zwei warme Sätze mit Punkt (wird Meta-Description). Caption = Statuszeile mit Zusatzinformation, **nie** Titel-Paraphrase (z. B. „Stand: 2026“, „In Echtzeit gerechnet“). Ton-Maßstab ist das Home-Intro (7.2).
- **SEITE-5** [SOLL · Soll · Review] Markdown-Inhalte nutzen H2 und H3. H4 nur nach der Überschriften-Matrix in 3.2. H5 und H6 nicht.
- **SEITE-6** [MUSS · Soll · Review] Kein Demo- oder Platzhalter-Content im Build (erfüllt seit dem Depublizieren des Demo-Beitrags). Zeitgebundene Hinweise (z. B. `blog_notice`) tragen ein Ablaufdatum. Bestand: R-67.
- **SEITE-7** [SOLL · Soll · Review] Pro Ansicht höchstens ein `.btn--primary`. Bild und Button zum selben Ziel werden zu einem Link zusammengeführt.

### 5.1 Inhaltsmodell

- **INH-1** [MUSS · Soll · Review] Kategorien und Tags sind sitewide ausgeblendet (`_includes/head/custom.html`) und dienen nur der Ordnung in Repo und Feed. Kategorien kommen aus einer festen Liste (**[Offen]**: Liste festlegen), Tags sind kleingeschrieben, deutsch, Einzahl, mit Bindestrich statt Leerzeichen.
- **INH-2** [MUSS · Ist · Review] Entwürfe liegen in `_drafts/` und gehen nie in den Build. Veröffentlichen heißt: nach `_posts/` mit Datum im Dateinamen verschieben.
- **INH-3** [SOLL · Soll · Review] `last_modified_at` nur bei inhaltlichen Änderungen setzen, nicht bei Tippfehlern oder Format.
- **INH-4** [MUSS · Soll · Review] Depublizieren in zwei Schritten: erst interne Links auf den Beitrag entfernen oder umbiegen, dann `published: false`. Die URL bleibt nicht als 404 stehen, wenn sie extern verlinkt sein kann (Weiterleitung prüfen).

### 5.2 Bilder und Medien

- **IMG-1** [MUSS · Soll · Review] Fotos als JPEG (progressiv) oder WebP, mit AVIF-Variante, wo der Gewinn deutlich ist. Grafiken als SVG. PNG nur für Favicons und Bildschirmfotos mit Text.
- **IMG-2** [MUSS · Soll · Review] Maße: Hero-Bilder 1920 × 1080 px oder kleiner, Teaser 1200 × 675 px. Kompression so, dass das Hero-Bild das Budget in 15.1 einhält.
- **IMG-3** [MUSS · Soll · Review] Jedes `<img>` mit `width`/`height` (HTML-3). Bilder unterhalb des ersten Viewports `loading="lazy"`, alle `decoding="async"`. Das LCP-Bild (Hero) nie lazy.
- **IMG-4** [SOLL · Soll · Review] Bilder breiter als `800px` bekommen `srcset` mit mindestens zwei Breiten.
- **IMG-5** [MUSS · Ist · Review] Hero-Overlay: `overlay_filter: 0.5` als Standard (Kontrast des Titels auf dem Foto). Abweichungen nur mit gemessenem Kontrast.
- **IMG-6** [MUSS · Soll · Review] Alt-Texte nach 6.1 (1.1.1): beschreiben Zweck und Inhalt in einem Satz ohne „Bild von“. Formeln und Diagramme verweisen auf das DOM-Äquivalent.
- **IMG-7** [MUSS · Soll · Review] Bildrechte: nur eigene, gemeinfreie oder lizenzierte Bilder. Lizenz und Quelle stehen in `assets/images/QUELLEN.md` (zu bauen, R-73). Metadaten nach SEC-10 entfernen.

### 5.3 SEO und Metadaten

- **SEO-1** [MUSS · Ist · Review] `title` im Front Matter ist der Seitenname ohne Site-Namen. Den Zusatz mit dem Site-Namen erzeugt das Theme (`site.title`, `title_separator`). `title_separator` steht in `_config.yml` auf dem Hausstil-Strich „–“ (TYPO-2).
- **SEO-2** [SOLL · Soll · CI-P3] Excerpt bzw. Description 70 bis 160 Zeichen. Bestand: R-67.
- **SEO-3** [SOLL · Soll · Review] OG-Bild 1200 × 630 px (Bestand: R-67), pro Seite über `header.og_image`, sonst Site-Standard. Alt-Text (`og:image:alt`) pro Seite über `header.og_image_alt`, sonst `og_image_alt` (Site-Bild) oder `background_image_alt` (gemeinsamer Hero-Hintergrund) aus `_config.yml`. `_includes/seo.html` bindet den Text an das tatsächlich gezeigte Bild.
- **SEO-4** [MUSS · Ist · CI-P3] Seiten, die nicht in Suche und Sitemap gehören (Archiv-Stubs, Weiterleitungen), tragen `sitemap: false` und `noindex: true` (SEC-12). Interne Werkzeugseiten werden gar nicht erst deployt (SG-1). Heute gibt es weder Stubs noch Weiterleitungen, `404.html` und `offline.html` tragen `sitemap: false`.
- **SEO-5** [MUSS · Ist · Review] Speculation Rules schließen Pfade aus dem Wired-Set und die Drawer-Links aus, weil der Swap Prerenderings verwirft. Wer das Wired-Set ändert, prüft die Ausschlüsse (SPA-5).

### 5.4 Druck

- **PRINT-1** [SOLL · Soll · Review] Animationen, CRT-Schichten, Power-Button, Overlays und Navigation sind im Druck ausgeblendet. Text druckt schwarz auf weiß. Ist: Regeln in `_hero.scss` und `_skill-graph.scss`.

### 5.5 Styleguide-Ansicht und automatisches Review

- **SG-1** [MUSS · Ist · CI] **Im Repo, nie veröffentlicht (Owner, 1. 10. 2026).** Die Styleguide-Ansicht `_pages/styleguide.html` (Stylesheet `assets/css/styleguide.scss`) trägt `published: false`. Gebaut wird sie nur mit `jekyll build --unpublished` (lokal `jekyll serve --unpublished`, CI: `_site_review`). Ein CI-Gate bricht ab, wenn sie im deployten `_site` auftaucht.
- **SG-2** [MUSS · Ist · CI] Die Ansicht zeigt echte Komponenten mit echtem Markup und echten Klassen aus `main.css`, Tokens kommen aus den Sass-Variablen. Jede neue Komponente und jedes neue Farb- oder Schriftgrößen-Token wird dort eingetragen, mit `data-sg-section` und, falls interaktiv, `data-sg-states`.
- **SG-3** [MUSS · Ist · CI] Automatisches Review (`tests/visual/`, Playwright im Container `mcr.microsoft.com/playwright`, Version wie `@playwright/test`): Screenshot-Vergleich jedes Abschnitts und jedes Zustands, Kontrast jeder Textprobe gegen ihren Grund (`data-sg-min`, Ausnahmen mit Regel-ID), axe-core WCAG 2.2 AA auf den echten Seiten mit Baseline `tests/visual/a11y-known.json` (nur neue Verstöße brechen ab, seit 1. 10. leer), Bedien-Invarianten in `invariants.spec.js` (A11Y-2, OVL-3, OVL-4, kein unsichtbarer Fokus). Gewollte visuelle Änderung: `npm run test:visual:update` im Container, neue Bilder mitcommitten. Die Baseline der bekannten a11y-Befunde darf nur schrumpfen.

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
| 2.4.2 | A | Jede Seite hat einen eindeutigen `<title>`. Nach einem SPA-Swap wird `document.title` gesetzt (A11Y-5). |
| 2.4.3 / 2.4.7 | A / AA | Unsichtbares ist nicht fokussierbar (`hidden`, `inert` oder `visibility: hidden`). Kein `outline: none` ohne gleichwertigen Ersatz. |
| 2.4.4 | A | Linkzweck aus dem Linktext oder seinem Kontext erkennbar (LINK-1). |
| 2.4.11 | AA | `html { scroll-padding-top: var(--anchor-offset) }`. Jede fixe Leiste meldet ihre Höhe in diese Rechnung. |
| 2.5.1 / 2.5.7 | A / AA | Jede Drag- oder Mehrfinger-Geste hat eine Ein-Klick-Alternative. |
| 2.5.3 | A | Der zugängliche Name beginnt mit dem sichtbaren Text, oder es gibt kein `aria-label`. |
| 2.5.8 | AA | Ziele mindestens 24 × 24 px, Touch-Ziele unter `(pointer: coarse)` 44 px. |
| 3.1.1 / 3.1.2 | A / AA | `lang="de-DE"`. Fremdsprachige Passagen (Motto, Zitate) mit `lang`. Theme-Strings übersetzt (Skip-Links), Landmark-Namen deutsch (Rest R-51). |
| 3.2.3 | AA | Navigation steht auf allen Seiten in derselben Reihenfolge (Persistent Shell, `_data/navigation.yml` als einzige Quelle). |
| 4.1.2 | A | Kein `role="button"` auf `span`/`div`, kein `aria-label` auf generischen Elementen, keine interaktiven Elemente in Überschriften, Buttons nur mit Phrasing Content. Vendor-Widgets benannt (noUiSlider `handleAttributes`). |
| 4.1.3 | AA | Statusmeldungen über eine beim Laden vorhandene, leere Live-Region. |

### 6.2 Muster

- **A11Y-1** [MUSS · Soll · Review] Toggle-Buttons: entweder festes Label plus `aria-pressed`/`aria-expanded` oder wechselndes Aktions-Label ohne State-Attribut. Nie beides.
- **A11Y-2** [MUSS · Soll · CI] Disclosure, Dropdown, Drawer, Sheet folgen einem Muster: Button mit `aria-expanded` und `aria-controls`, Escape schließt und gibt den Fokus an den Auslöser zurück, beim Öffnen wandert der Fokus hinein. Mit Scrim oder Scroll-Sperre wird der Hintergrund `inert`. Drawer, Skill-Graph-Sheet und Autor-Folgen-Dropdown erfüllen das Muster, `tests/visual/invariants.spec.js` prüft alle drei (`author-follow.js` setzt `aria-controls` selbst, weil das Markup aus dem Theme kommt). Das TOC-Dropdown schließt per Escape und gibt den Fokus zurück, beim Öffnen bleibt der Fokus am Toggle. Drawer und Autor-Dropdown setzen den Fokus nur beim Öffnen per Tastatur (`click` mit `detail === 0`) auf den ersten Link. Bei Maus und Touch bleibt er am Toggle, weil mobil schon `:focus` die Drawer-Links magenta färbt und das Theme um Links bei `:focus` einen Ring zeichnet (Register R-32).
- **A11Y-3** [MUSS · Soll · Review] Dekorative Icons (`<i class="fa…">`, SVG, Glyphen ▲▼✕) tragen `aria-hidden="true"`, Inline-SVG zusätzlich `focusable="false"`.
- **A11Y-4** [MUSS · Soll · Review] Für versteckten Text nur `.visually-hidden`.
- **A11Y-5** [MUSS · Ist · CI-P4] SPA-Navigation verhält sich wie ein Seitenwechsel: Fokus auf `#main`, `document.title`, `aria-current`, Ansage über `#spa-route-announcer` (umgesetzt in `spa-nav.js`).
- **A11Y-6** [SOLL · Soll · Review] Forced-Colors-Block in `base/_accessibility.scss` (Selektoren mit `:root`-Präfix, weil die Datei vor den Komponenten lädt). Fokus nie allein über `box-shadow`.

### 6.3 Bewegung

- **BEW-1** [MUSS · Ist · Review] Jede CSS-Animation respektiert `prefers-reduced-motion`. Der globale Kill-Switch in `base/_accessibility.scss` deckt CSS ab.
- **BEW-1a** [SOLL · Soll · Review] JS-Animationen fragen `matchMedia('(prefers-reduced-motion: reduce)')` und reagieren auf `change`. Gemeinsamer Helfer ist `prefersReducedMotion` in `site-utils.js` (JS-18, seit 1. 10. 2026, Nutzer `toc.js`, `back-to-top.js`). Wird MUSS, sobald die lokalen Abfragen migriert sind (R-58).
- **BEW-2** [MUSS · Ist · Review] Ausnahmen vom Kill-Switch stehen namentlich in **einer** Liste in `_accessibility.scss` (die `:not(…)`-Liste des Kill-Switch-Selektors) und hier in 6.5.
- **BEW-3** [MUSS · Ist · Review] Seitenübergänge (View Transitions, CRT-Umschalten) laufen nur unter `prefers-reduced-motion: no-preference`. CSS-Gate und JS-Gate bleiben synchron (BP-6).
- **BEW-4** [MUSS · Ist · Review] Programmatischer Scroll mit `behavior: 'auto'` bei Reduced Motion. Einziger weicher Scroll ist `back-to-top.js`, er springt unter `reduce`. `spa-nav.js` scrollt nie weich.
- **BEW-5** [MUSS · Soll · Review] Jede Flicker-Animation schneller als 3 Hz trägt einen Kommentar zur Amplitude (Vorbild `_crt-overlay.scss`: ±3 % Luminanz). Eine neue `$crt-variante` oder `$glitch-variante` wird erst Standard, wenn ein Blitztest bestanden ist. Messverfahren: Bildschirmaufnahme mit mindestens 60 fps bei 1024 × 768 px, dann entweder Analyse mit PEAT oder Harding FPA (beide werten Video aus) oder eigene Frame-Analyse der relativen Luminanz. Ein Blitz ist ein Paar gegenläufiger Änderungen um mindestens 10 % der relativen Luminanz, bei dem der dunklere Zustand unter 0,80 liegt. Kritisch sind mehr als drei pro Sekunde auf einer Fläche über 25 % eines 10-Grad-Sichtfelds (bei 1024 × 768 px etwa 341 × 256 px).

### 6.4 Offene Kontrastkonflikte mit Owner-Entscheidungen

| Stelle | Ist | Problem | Vorschlag |
|---|---|---|---|
| Aktiver TOC-Eintrag `$link-color-active` | erledigt 1. 10.: Cyan 75 %, nicht fett | 5,28:1 auf `#252a34` | – |
| Nav- und TOC-Hover | seit 1. 10. `$hover-color-text` | 4,51:1, auf Cyan-Hover-Grund 3,68:1 | Owner-Ausnahme (KOMP-3) |
| Nav `:focus-visible` | erledigt 1. 10.: Rahmen statt Füllung | – | KOMP-3a |
| Hamburger, Back-to-Top | `$link-color-subtle` | 2,50 bis 2,63:1 (UI), R-52 | ab 55 % oder volles Cyan für das Icon (sichtbar, Owner) |

### 6.5 Dokumentierte bewusste Ausnahmen

**CRT-Hero und Neon-Schriftzug laufen auch bei `prefers-reduced-motion: reduce` endlos** (das Logo-Flackern steht nicht in den Ausnahmen des Kill-Switches und hält bei Reduced Motion an) (Owner-Entscheidung vom Juli 2026, am 1. 10. 2026 bestätigt: „das soll ja so, es sind Stilelemente“). Ehrliche Bewertung:

- **2.3.3 (AAA)** ist keine AA-Pflicht. Die Ausnahme ist dort zulässig.
- **2.2.2 (Level A) ist nicht erfüllt.** Rollbalken, Scanline-Jitter, Phosphor-Flackern, Neon-Flicker und das Logo-Flackern starten automatisch und laufen endlos. Der einzige Stopp-Mechanismus ist der Power-Button (Lesemodus). Er existiert nur auf `/`, wird nicht gespeichert und stoppt Neon und Logo nicht.
- **2.3.1 (Level A):** Die aktive Variante `antenne` liegt nach Codeanalyse unter der Schwelle. Die Varianten `dezent`, `linie-punkt`, `voll` sind ungemessen und dürfen ohne Test nach BEW-5 nicht Standard werden.
- **Entschieden (Owner, 1. 10. 2026):** Kein separater Bewegungs-Schalter, kein gespeicherter Lesemodus auf allen Hero-Seiten, kein Anhalten nach 5 s. Die Seite ist damit formal nicht WCAG-2.2-A-konform (2.2.2). Das ist eine dokumentierte Ausnahme und wird nicht erneut als Fix vorgeschlagen. Neu bewertet wird nur, wenn sich der Charakter der Seite ändert.
- Harte Grenze bleibt 2.3.1: Jeder neue Flacker-, Glitch- oder Blitzeffekt wird vorher nach BEW-5 gemessen.
- Das Aufglimmen des Power-Buttons ist auf `no-preference` gegatet (Owner-Entscheidung): Der Kill-Switch nimmt den Hinweis-Puls unter `reduce` heraus.

Weitere bewusste Ausnahmen: Fokus des Hero-Power-Buttons beige statt Magenta (Kontrast auf dem Foto), Blocksatz im Home-Intro (1.4.8 ist AAA).

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
- **FACH-3** [MUSS · Soll · Review] Zitate nur mit belegter Quelle, sonst „(zugeschrieben)“ oder „Unbekannt“.
- **FACH-4** [MUSS · Soll · Review] Architekturänderungen ziehen technische Blogposts im selben Commit nach.

### 7.7 Glossar

| Begriff | Schreibweise |
|---|---|
| Bereich | Fraktale |
| Komponenten | „Interaktive Julia-Menge“, „Mandelbrot-Julia-Explorer“ (danach „Explorer“) |
| Mengen | Mandelbrot-Menge, Julia-Menge, gefüllte Julia-Menge (≠ Julia-Menge) |
| Inhalt | Blogbeitrag, Lebenslauf, Archiv |
| Skills | Kapitel „Technische Fähigkeiten“, Element „Skill“ |
| Technik | Front Matter, Dev Container, CI/CD, KI (im Fließtext) |
| Marken | LinkedIn, Spring Boot, Docker Compose, pip, scikit-learn, Vue.js |

**Entschieden (Owner, 1. 10. 2026):** „Reset“ und „Preset“ sind eingedeutschte UI-Wörter und bleiben. Gleiche Aktion, gleiches Wort: Der Zurücksetzen-Button heißt sichtbar überall „Reset“ (Fraktal-Panel, Skill-Graph), Der zugängliche Name beginnt mit dem sichtbaren Wort (WCAG 2.5.3 Label in Name): „Reset – Ansicht zurücksetzen“, Tooltip „Zurücksetzen“. „Zurücksetzen“ passt nicht in die Keycap-Buttons. Der Navigationspunkt bleibt „Mandelbrot“.

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
| Zeiträume im Lebenslauf | Halbgeviert **mit** Leerzeichen (Owner-Stilelement, 1. 10. 2026) | 2020 – 2025, 2025 – Heute (groß, Owner-Stilelement) | Hausstil |
| Offenes Ende | im Fließtext „seit 2025“, als Zeitraum „2025 – Heute“ (groß, mit Leerzeichen wie die Zeiträume im Lebenslauf, Owner-Stilelement, 1. 10. 2026) | | Hausstil, Duden erlaubt auch klein |
| Bindestrich als Strich | **verboten** | ~~Hans Müller - Ingenieur~~ | |
| Anführungszeichen | „…“, innen ‚…‘ | „Seepferdchen“ | Duden |
| Apostroph | ’ (U+2019) | geht’s | Duden |
| Auslassung | … (U+2026), Leerzeichen davor bei ganzem Wort | „und so weiter …“ | Duden |
| Abkürzungen | mit geschütztem Leerzeichen (U+00A0) | z. B., d. h., e. V., M. Sc. | DIN 5008, amtliches Regelwerk |
| Prozent, Einheiten | Zahl, geschütztes Leerzeichen, Einheit | 98 %, 16 px, 100 dpi | DIN 5008 |
| Code-Werte im Fließtext | in Backticks, ohne Leerzeichen, wie im Code | `16px`, `0.06em` | eigene Regel |
| Dezimalzeichen | Komma im Fließtext | 0,75 | Duden |
| Dezimalzeichen Mathe/HUD | Punkt (wie Code und MathJax), dokumentierte Ausnahme | c = −0.700 + 0.270i | eigene Regel |
| Minus | − (U+2212), über gemeinsamen Formatter | −0,75 | Duden |
| Tausender | vierstellig ohne, ab fünf Stellen schmales geschütztes Leerzeichen (U+202F) | 1000, 34 500 | Duden |
| Datum Anzeige | „4. März 2025“ über `_includes/date-de.html` | | DIN 5008 alphanumerisch |
| Datum maschinenlesbar | ISO 8601 im `datetime`-Attribut | 2025-03-04 | ISO 8601 |
| Uhrzeit | 14:30 Uhr, volle Stunde 14 Uhr | | DIN 5008 |
| Schrägstrich | ohne Leerzeichen bei Einzelwörtern, mit bei Mehrwortgliedern | CI/CD, C/C++, Azure AI / OpenAI | Duden |
| Komposita | deutsch zusammen, fremdsprachige Mehrwortglieder durchgekoppelt | Webanwendung, GitHub-Pages-Integration | Duden |
| Und-Zeichen | „&“ in Firmennamen und als bewusstes Stilelement in kurzen Labels (Autoren-Bio, Kapitel- und Gruppentitel, Owner, 1. 10. 2026). Im Fließtext „und“ | Procter & Gamble, Ingenieur & Entwickler, Data & Analytics | Duden, Hausstil |
| Noten | klein | sehr gut (1,3) | |
| Doppelformen | Duden-Empfehlung | sogenannt, potenziell, Kryptografie | Duden |
| Umlaute | immer echt, auch in JS | verfügbar, nicht verfuegbar | |
| Gendern | keine Wortbinnenzeichen, neutrale Formulierung | Studierende, Lehrkraft | amtliches Regelwerk 2024 |

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
- **SCSS-3** [MUSS · Ist · CI] Eigene Deprecation-Warnungen sind Fehler. `quiet_deps: true` hält das Build-Log ruhig, versteckt aber auch jedes eigene Partial (alles über den Load-Path gilt für Sass als Abhängigkeit). Check: `scripts/sass-deprecation-check.sh` baut im CI-Build-Job ohne `quiet_deps` und scheitert bei jeder Warnung aus eigenem Code. Erlaubt ist nur `[import]` in der Theme-Brücke.
- **SCSS-4** [MUSS · Ist · Review] Eigener Code ist ein `@use`/`@forward`-Modulbaum (Hausregel, Owner 1. 10. 2026). Minimal Mistakes bleibt `@import`-basiert (Issue #5026) und hängt an der Theme-Brücke: Sie lädt `abstracts/tokens` mit `as *`, damit die `!default`-Variablen des Themes unsere Werte übernehmen, und importiert danach Skin und Theme. Folgen: (a) Der Skin steht fest auf `dark` in der Brücke, `minimal_mistakes_skin` in `_config.yml` ist nur Doku (Partials laufen nicht durch Liquid). (b) Theme-`@extend` wirken nicht mehr in eigene Module (Register R-34). (c) Schalter wie `$crt-variante` sind `!default` und lassen sich in `_custom.scss` per `@use "components/view-transition" with (…)` setzen. (d) Platzhalter-Ausgabe erscheint dort, wo `abstracts/mixins` zum ersten Mal geladen wird, deshalb steht es in `_custom.scss` ausdrücklich vor `base/headings`. Fällt das `@import` im Theme weg, entfällt die Brücke.

### 9.2 Benennung

- **SCSS-5** [MUSS · Soll · CI-P2] Klassen BEM in kebab-case: `block__element--modifier`. `--modifier` = statische Variante aus Markup. `is-*`/`has-*` = Laufzeitzustand aus JS.
- **SCSS-6** [MUSS · Soll · Review] Keine neuen eigenen Elemente in MM-Namensräumen (`page__`, `masthead__`, `archive__`, `toc__`).
- **SCSS-7** [MUSS · Ist · CI] Variablen, Mixins, Platzhalter, Custom Properties und Keyframes in kebab-case. Keyframes mit Block-Präfix (`neon-orbit-ramp-before`, `toc-slide-in-from-bottom`), nur das allgemeine `fade-in` in `base/_animations.scss` hat keinen Block. Beim Umbenennen JS-Referenzen mitziehen (`hero-crt.js` liest die Tube-Boot-Namen). Stylelint prüft Keyframes (`keyframes-name-pattern`), Mixins und Custom Properties (Standard-Config). `scss/dollar-variable-pattern` ist aus, der Bestand an Variablen ist trotzdem kebab-case.
- **SCSS-8** [MUSS · Ist · CI-P2] Komponenten-Tokens tragen das Block-Präfix (`$fp-*`) und zeigen nur auf globale Tokens (FARB-1). Erfüllt in `fractal-panel/_tokens.scss`, Farbliterale fängt `color-guardrail.sh`.
- **SCSS-20** [MUSS · Ist · Review] Bezeichner sind englisch, mit diesen Ausnahmen: fachliche Varianten-Namen der Choreografien (`$crt-variante`, `$glitch-variante` und ihre Werte wie `antenne`), deutsche Daten- und Paletten-Schlüssel, die sichtbaren Text spiegeln. Neue deutsche Bezeichner nur in diesen Gruppen. Kommentare deutsch (SCSS-14).

### 9.3 Spezifität und Kaskade

- **SCSS-9** [MUSS · Soll · CI-P2] Spezifität höchstens (0,4,2), keine IDs. Ausnahme: Overrides von Theme-ID-Regeln (`#main`) mit Kommentar.
- **SCSS-10** [MUSS · Soll · Review] Gegen das Theme mit Spezifität statt `!important`, Rechnung im Kommentar („(0,2,1) > (0,1,1)“). Das `body`-Präfix im Masthead ist ein sanktioniertes Muster.
- **SCSS-11** [MUSS · Ist · Review] Die Theme-Regel `.page__content h2 { border-bottom; padding-bottom }` wird immer **explizit** zurückgesetzt. Weglassen reicht nie.
- **SCSS-12** [MUSS · Ist · CI] `!important` nur in Kategorie d. Kategorien: (a) überflüssig, löschen. (b) durch Spezifität ersetzbar. (c) durch Umbau ersetzbar (Zustandsklasse, Reihenfolge). (d) unvermeidbar: Reduced-Motion-Kill-Switch, Print, Überstimmen eines Inline-Styles aus JS, Überstimmen einer Theme-Utility mit `!important`. Marker: `// !IMPORTANT-KEEP (Kategorie d, …)` plus `stylelint-disable-next-line declaration-no-important -- Grund`.
- **SCSS-13** [SOLL · Soll · Review] Zustände über eine Zustandsklasse oder ein `data-`-Attribut statt gestapelter Selektoren.

### 9.4 Kommentare und Format

- **SCSS-14** [MUSS · Soll · Review] Kommentare deutsch, nur `//`. `/* */` nur für Stylelint-Blockdirektiven. Bestand: R-66.
- **SCSS-15** [SOLL · Soll · Review] Dateikopf: Banner `// ===`, Titel, Zweck, Zeilen `Markup:` / `JS:` / `Tokens:`.
- **SCSS-16** [MUSS · Soll · Review] Kommentare erklären das Warum des Ist-Zustands. Werthistorie (`// vorher 3.5rem`) gehört in die Commit-Message. A11y- und Owner-Gründe bleiben im Kommentar.
- **SCSS-17** [MUSS · Soll · Review] Keine auskommentierten Alternativwerte, keine toten Selektoren, keine px-Umrechnungen an em- oder rem-Werten.
- **SCSS-18** [MUSS · Soll · CI-P1] `stylelint-disable` regelgenau, mit ` -- Begründung`, Blöcke mit `stylelint-enable` schließen. Generierte Dateien über `ignoreFiles`.
- **SCSS-19** [MUSS · Ist · CI] 2 Leerzeichen nach Klammertiefe, LF, abschließender Zeilenumbruch, kein Leerzeichen am Zeilenende. Editor: `.editorconfig`, Check: `scripts/scss-format.py` (mit `--fix` korrigieren). **[Soll · Review]** `@include` vor den Deklarationen.

### 9.5 Critical-CSS

- **CRIT-1** [MUSS · Ist · CI-P2] Der Inline-Block in `_layouts/default.html` enthält nur Werte, die 1:1 in SCSS existieren (Quelle steht im Kommentar daneben), überstimmt keine Typografie und Farbe (`body{font-family}`, `body{color}`) und hält FARB-8 ein. Einzige bewusste Überstimmung ist `html{font-size:100%}` gegen die Theme-Rampe (Owner-Freigabe 1. 10. 2026, 6.1). Blur nur wie in `backdrop-blur()`, heute keiner. Die Breiten-Queries prüft `bp-guardrail.sh`, den Rest ein geplanter Sync-Check (16.2).
- **CRIT-2** [SOLL · Ist · Review] Er steht vor dem `main.css`-Link oder enthält nur Layout-Stabilisatoren (Masthead-Höhe, Hero-Mindesthöhe). Ist: Er steht danach und enthält nur Stabilisatoren plus die Grundschrift (CRIT-1).
- **CRIT-3** [MUSS · Soll · CI-P2] Außer diesem Block keine Stile in Templates (kein `style=""`, kein weiteres `<style>`). Ausnahme: `style`-Attribute, die kramdown für Tabellenausrichtung erzeugt. Ein weiteres `<style>` gibt es nicht mehr, `style`-Attribute schon (R-64). Kein Check prüft das heute.

---

## 10 JavaScript-Konventionen

### 10.1 Sprachstand und Aufbau

- **JS-1** [MUSS · Ist · CI-P1] Baseline ES2020 (Optional Chaining wird bereits genutzt). Klassische Skripte mit `defer`, keine ES-Module, kein Bundler. **Ausnahme:** `head-early.js` lädt parser-blockierend im `<head>` **ohne** `defer` oder `async`. Der `pagereveal`-Handoff muss vor dem ersten Render laufen. Nie auf `defer` oder `async` umstellen.
- **JS-2** [MUSS · Ist · CI] Code nutzt `const`/`let`, kein `var`. ESLint prüft `no-var` und `prefer-const` für alle Dateien unter `assets/js`, ohne Ausnahme (die letzten Altdateien `greedy-navigation.js` und `fractal-panel.js` sind migriert).
- **JS-3** [MUSS · Ist · CI-P2] Jede Main-Thread-Datei ist eine IIFE mit `'use strict'` als erster Anweisung. Exporte nur über einen expliziten Namespace auf `window` oder `self`. Erfüllt seit 2. 10. 2026 (zuletzt `head-early.js`, `neon-orbit-toggle.js`, `offline.js`), ein ESLint-Check (`strict`) fehlt.
- **JS-4** [MUSS · Soll · Review] Dateikopf `/** <datei>.js — Zweck`, dazu Zuständigkeit, Abhängigkeiten, Ladereihenfolge, Event-Verträge. Vorbilder: `spa-module.js`, `skill-graph-sheet.js`, `head-early.js`. Bestand: R-16.
- **JS-5** [SOLL · Soll · Review] Dateiklassen im Kopf benennen: Shell-Skript (einmal pro Dokument), Seiten-Modul (am Kontrakt), DOM-freier Kern oder Worker.
- **JS-6** [SOLL · Soll · Review] Weiche Grenze etwa 600 Zeilen pro Datei. Darüber liegen `fractal-panel.js` (rund 1100) und `skill-graph.js` (rund 730).
- **JS-21** [MUSS · Ist · Review] Bezeichner englisch. Ausnahmen wie SCSS-20: Varianten-Namen und Daten-Schlüssel, die sichtbaren Text oder SCSS-Varianten spiegeln (z. B. `goldgruen` als Paletten-Schlüssel). Kommentare und Meldungstexte deutsch.

### 10.2 Persistent-Shell-Kontrakt (`spaModule`)

`spa-nav.js` tauscht nur `.initial-content`, der Masthead bleibt stehen. Jedes Seiten-Modul registriert sich über den Helfer `window.spaModule` (`assets/js/spa-module.js`, sitewide vor den Modulen geladen, die ihn nutzen). Vorbild-Skelett:

```js
/**
 * beispiel.js — Seiten-Modul am Persistent-Shell-Kontrakt.
 * Abhängigkeiten: spa-module.js (vorher geladen). Ladereihenfolge: defer.
 */
(function () {
  'use strict';

  let controller = null;
  let resizeRaf = 0;

  function onResize() {
    if (resizeRaf) return;
    resizeRaf = requestAnimationFrame(() => {
      resizeRaf = 0;
      // Layout neu messen
    });
  }

  function mount(root) {
    const scope = root || document;
    const el = scope.querySelector('[data-role="beispiel"]');
    if (!el || el.hasAttribute('data-beispiel-mounted')) return;
    el.setAttribute('data-beispiel-mounted', '');
    if (controller) controller.abort();
    controller = new AbortController();
    window.addEventListener('resize', onResize, { passive: true, signal: controller.signal });
  }

  function teardown() {
    if (controller) { controller.abort(); controller = null; }
    if (resizeRaf) { cancelAnimationFrame(resizeRaf); resizeRaf = 0; }
  }

  window.spaModule({ mount, teardown });
})();
```

- **SPA-1** [MUSS · Soll · Review] Seiten-Module nur über `window.spaModule({ mount, teardown })`. Keine handgerollten Kontrakte für neue Module. Bestand: R-58.
- **SPA-2** [MUSS · Soll · Review] `mount(root)` sucht nur in `root || document`, bricht ohne Wurzel ab, setzt den Marker `data-<modul>-mounted` und bricht einen alten Controller vor dem Neubinden ab.
- **SPA-3** [MUSS · Soll · Review] `teardown()` räumt alle `window`- und `document`-Listener, Observer, Timer, rAF und Worker ab. Timer-Callbacks prüfen `signal.aborted`.
- **SPA-4** [MUSS · Ist · CI] Kein `<script>` in Includes oder Layouts, die in `.initial-content` rendern. Inline-Skripte laufen nach einem `innerHTML`-Swap nicht. Ausnahme: Datenblöcke (`application/json`, `application/ld+json`) und `speculationrules` (SEC-4).
- **SPA-5** [MUSS · Ist · Review] Wer das Wired-Set (`isWired` in `spa-nav.js`) oder `needsFullLoad` ändert, passt im selben Commit `tests/spa-nav.spec.js`, `tests/README.md`, `docs/features/spa-nav.md` und die Speculation-Rules-Ausschlüsse (SEO-5) an.
- **SPA-6** [SOLL · Ist · Review] Der PE-Fallback prüft erst zur `DOMContentLoaded`-Zeit, weil `spa-nav.js` als letztes Defer-Skript `__spaNavActive` setzt. Muster wie im README: `readyState === 'complete'` → sofort, sonst `DOMContentLoaded`. Ein Test auf `'loading'` reicht nicht: Defer-Skripte laufen im Zustand `interactive`, der Fallback feuerte dort sofort und mountete jedes Modul ein zweites Mal. `spa-module.js` folgt dem Muster seit 2. 10. 2026, `tests/spa-nav.spec.js` zählt die `mount`-Aufrufe. `spa-nav.js` selbst darf `'loading'` prüfen, weil es als Letztes lädt.

### 10.3 Navigation und Übergänge

Owner-Lehren aus der TV-Umschalt-Architektur. Sie werden nicht wieder eingebaut.

- **TV-1** [DARF NICHT · Ist · Review] Kein `skipTransition` und kein Hero-only-Gating der View Transition. CRT bei jedem internen Seitenwechsel plus stehender Header ist das gewollte Verhalten.
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
- **JS-12** [MUSS · Soll · Review] Scroll- und Resize-Handler `passive` und rAF-gedrosselt.
- **JS-13** [MUSS · Soll · Review] Storage-Zugriffe in `try/catch` mit sinnvollem Fallback (SEC-6).
- **JS-14** [MUSS · Soll · CI-P2] Kein `console.log` (erfüllt). `console.warn` und `console.error` im Format `'<dateiname>: <Meldung>'`. Leere `catch`-Blöcke mit `/* noop: Grund */`.
- **JS-15** [MUSS · Soll · Review] Benennung: camelCase, PascalCase für Klassen und Namespaces, `CONSTANT_CASE` für Modulkonstanten, Booleans mit `is`/`has`/`should`, Lebenszyklus `mount`/`teardown`, Instanzen `destroy`.
- **JS-16** [SOLL · Soll · Review] Namensräume: Events `auflinie:<thema>` (Bestand `spa:*` bleibt), Storage-Keys `auflinie:<modul>:<zweck>`, interne Brücken `window.__auflinie*`. Bestehende Keys erst bei Berührung migrieren, sonst verlieren Besucher Zustände.
- **JS-17** [MUSS · Soll · Review] Worker: dünner Wrapper plus Kern per `importScripts`, Messages `{ requestId, …params }` mit Echo, Ergebnisse als Transferables. Mehrzweck-Kanäle (Service Worker) als `{ type: 'SCREAMING_SNAKE', … }`.
- **JS-18** [SOLL · Soll · Review] Logik, die zum zweiten Mal gebraucht wird, wandert in einen gemeinsamen Helfer: `assets/js/site-utils.js` mit Namespace `window.AuflinieUtils`, in `_includes/scripts.html` als **erstes** Skript geladen, vor `toc.js` und `spa-module.js`. Skripte aus dem `<head>` laufen davor und nutzen die Helfer nicht. **[Ist]** Die Datei existiert mit `prefersReducedMotion`, `rafThrottle` (Nutzer `toc.js`, `back-to-top.js`) und `mq` (Breakpoints, BP-2, Nutzer `toc.js`, `tv-switch.js`, `greedy-navigation.js`, `fractal-panel.js`). **[Soll]** `baseUrl` und `cssDurationMs` (MO-5) fehlen noch.
- **JS-19** [MUSS · Soll · CI-P1] Formatierung: 2 Leerzeichen (auch in Workern), einfache Anführungszeichen, Semikolons, LF, kein Leerzeichen am Zeilenende. Einzeilige Guards ohne Klammern erlaubt.
- **JS-20** [SOLL · Soll · Review] JSDoc mit `@param` und `@returns` für alles, was über einen Namespace exportiert wird. Nur TypeScript-kompatible JSDoc-Syntax.

---

## 11 Sicherheit und Datenschutz

Die Seite ist statisch, hat keine Nutzerkonten und keine Formulare. Die realistischen Risiken sind deshalb andere als bei einer Web-Anwendung: eine manipulierte Lieferkette, der mit anderen Projekten geteilte Origin `grenzenloseschublade.github.io`, versehentlich eingeschleustes Markup und rechtliche Pflichtangaben. Hintergrund und Befund-IDs: `docs/audits/2026-10-01-security.md`.

### 11.1 DOM-Sinks im eigenen JavaScript

- **SEC-1** [MUSS · Ist · CI-P1] Werte, die nicht als Literal im Quelltext stehen, gelangen nur über `textContent`, `setAttribute` (außer `on*`, `src`, `href` mit fremdem Inhalt), `createElement` oder `canvas.fillText` ins DOM. Kein `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `document.write` oder `createContextualFragment` mit dynamischen Werten. Kein `eval`, kein `new Function`, kein `setTimeout`/`setInterval` mit String, keine `javascript:`-URLs. URL-Bestandteile (`location.search`, `location.hash`, `document.referrer`, `window.name`) und Storage-Werte gelten als unvertrauenswürdig und steuern nur Vergleiche, Booleans oder `getElementById`. Erlaubte Ausnahmen mit Begründungskommentar: der Same-Origin-Swap in `spa-nav.js` (per `DOMParser` geparstes, selbst geholtes HTML) und statische Literale in `sw-register.js`, `fractal-panel.js` (`skill-graph-sheet.js` baut seit 2. 10. 2026 per `createElement`). Check geplant: ESLint mit `eslint-plugin-no-unsanitized` sowie `no-eval`, `no-implied-eval`, `no-new-func`, `no-script-url`.

### 11.2 Liquid-Ausgabe

- **SEC-2** [MUSS · Soll · CI-P2] Werte innerhalb von `<script>` (auch `application/json` und `application/ld+json`) werden als `{{ wert | jsonify | replace: '</', '<\/' }}` ausgegeben, ohne umgebende Anführungszeichen. Jekylls `jsonify` maskiert `</` nicht. Keine Liquid-Werte in JavaScript-String-Literalen. Konfiguration gelangt als `data-*`-Attribut an `<html>`. Freitext aus Front Matter und `_data` in HTML-Text mit `| escape` (SOLL), gewollter Rich-Text mit `| markdownify`. Der Skill-Graph-Datenblock folgt dem Muster, das JSON-LD in `head/custom.html` ebenso.

### 11.3 Content Security Policy

- **SEC-3** [MUSS · Ist · CI] Genau eine CSP als `<meta http-equiv>` in `_includes/head.html`, vor dem ersten `<script>`, auf allen Seiten byte-identisch (spa-nav behält die Policy der Einstiegsseite). `script-src` enthält weder `'unsafe-inline'` noch `'unsafe-eval'`. Einzige Inline-Ausnahme: `'inline-speculation-rules'`. Keine Direktive enthält `https:`, `http:` oder `*`. Neue Quellen werden einzeln und im selben Commit wie die Funktion ergänzt, die sie braucht. Check: `scripts/csp-check.py` im Build-Job.
- **SEC-3a** [SOLL · Ist · Review] `style-src 'unsafe-inline'` bleibt nur, solange MathJax CHTML und kramdown-Tabellenausrichtung es erfordern. `worker-src blob:` bleibt nur, solange der MathJax-Sprach-Worker aktiv ist.
- Hinweis: Auf GitHub Pages wirken `frame-ancestors`, `report-uri`, `sandbox` und Report-Only per Meta-Tag nicht. Die CSP schützt nicht vor Skripten auf Geschwister-Projekten desselben Origins und nicht vor Fetches des Service Workers.

### 11.4 Inline-Skripte und Event-Handler

- **SEC-4** [MUSS · Ist · CI] Kein ausführbares Inline-`<script>`. Erlaubt sind nur Datenblöcke (`application/json`, `application/ld+json`) und `speculationrules`. Keine Inline-Event-Handler (`onclick=` …) in Templates, Markdown oder `_data`. Seitenspezifisches Verhalten registriert sich per `spaModule` (SPA-1). Was parser-blockierend früh laufen muss, steht als externe Datei ohne `defer`/`async` im `<head>` (JS-1). Checks: `scripts/security-guardrail.sh` (Quellen, Lint-Job) und `scripts/csp-check.py` (gebaute Seiten).

### 11.5 Service Worker

- **SEC-5** [MUSS · Ist · CI] Cache-Namen tragen den Projektpräfix `CACHE_PREFIX` mit Version. Jedes `caches.delete` steht hinter `startsWith(CACHE_PREFIX)`, Aufräumen in `activate`. Gelesen wird nur aus dem eigenen Cache. Kein `getRegistrations()`, nur die eigene Registrierung (`getRegistration(<baseurl>/)`). Check: `scripts/security-guardrail.sh`.
- **SEC-5a** [MUSS · Ist · CI-P2] Same-Origin-Prüfung per `new URL(url).origin === self.location.origin` plus Pfad unter `self.registration.scope`. Kein `mode: 'cors'`, keine ungeprüften URL-Listen aus `postMessage`. Navigationsantworten mit `redirected === true` als `Response.redirect(response.url)` weitergeben. Erfüllt in `service-worker.js` (`fetch`-Handler und `handleNavigation`), `postMessage` kennt nur `SKIP_WAITING`.
- **SEC-5b** [MUSS · Ist · Review] Update nur nach Bestätigung durch den Toast (kein unbedingtes `skipWaiting`).
- **SEC-5c** [MUSS · Ist · CI] Der Präfix hat genau eine Quelle: `sw_cache_prefix` in `_config.yml`. `service-worker.js` baut `CACHE_PREFIX` per Liquid daraus, `sw-register.js` liest ihn aus `data-sw-cache-prefix` am `<html>`. Ein leerer Präfix ist verboten, er passte auf jeden Cache des geteilten Origins. Check: `scripts/security-guardrail.sh` (Präfix gesetzt, kein zweites Literal) mit Negativtests.
- **SEC-5d** [SOLL · Soll · Review] Ein getesteter Kill-Switch-Worker (eigene Caches löschen, `registration.unregister`, Clients neu laden) liegt bereit und ist im README beschrieben. Fehlt noch. Spätestens Wochen vor einem Domain-Umzug nötig, sonst hängen Wiederkehrer am alten Worker fest.

### 11.6 Browser-Speicher

- **SEC-6** [MUSS · Ist · Review] localStorage und sessionStorage enthalten nur nicht identifizierende UI-Zustände. Keine IDs, keine sitzungsübergreifenden Zeitstempel, keine personenbezogenen Daten. Jeder Zugriff steht in `try/catch`, die Seite funktioniert ohne Speicher. Neue Speicherzwecke werden in der Datenschutzerklärung ergänzt, sobald es sie gibt (SEC-10a). Neue Schlüssel tragen den Präfix `auflinie:` (JS-16), weil alle Projekte des Origins denselben Speicher teilen.

### 11.7 GitHub Actions

- **SEC-7** [MUSS · Ist · CI] Jede `uses:`-Referenz ist eine volle 40-stellige Commit-SHA mit Versionskommentar. Check: `scripts/security-guardrail.sh`.
- **SEC-7a** [MUSS · Ist · Review] Workflow-Ebene nur `permissions: { contents: read }`, Schreibrechte (`pages: write`, `id-token: write`) ausschließlich im Deploy-Job. `actions/checkout` mit `persist-credentials: false`. Kein `pull_request_target`, kein `workflow_run` mit fremdem Code, keine `${{ github.event.* }}`-Ausdrücke direkt in `run:`.
- **SEC-7b** [MUSS · Ist · Review] CI-Trigger nach GIT-6. Die Owner-Policy zu Dependabot gilt: **Alerts an, automatische Security-Update-PRs aus** (Repo-Einstellung), keine `pull_request`-Trigger. `vulnerability-alerts` wird nie per API gelöscht, das schaltet die Anzeige ab. Ein künftiger Audit-Job hebt diese Policy nicht auf.
- **SEC-7c** [SOLL · Ist · Review] Dependabot-Versionsupdates nur für `github-actions`, monatlich, alle Updates in einem PR, höchstens ein offener PR (`.github/dependabot.yml`, seit `848efe2`). Sie halten die SHA-Pins aktuell. Vom Owner am 1. 10. 2026 ausdrücklich entschieden. Die Policy aus SEC-7b betrifft nur Security-Update-PRs.
- **[Offen]** Repo-Einstellung „Require actions to be pinned to a full-length commit SHA“, `zizmor` im Lint-Job.

### 11.8 Abhängigkeiten, Theme und Vendor-Dateien

- **SEC-8** [MUSS · Ist · CI] `remote_theme` ist auf eine Commit-SHA gepinnt (Check: `scripts/security-guardrail.sh`). Installationen laufen über Lockfiles (`npm ci`, `bundle install` gegen `Gemfile.lock`), auch in `.devcontainer/*.sh`.
- **SEC-8a** [MUSS · Soll · CI-P2] Dateien unter `assets/vendor` sind unveränderte Upstream-Dateien. Ihre Prüfsummen stehen in `assets/vendor/SHA384SUMS` (Format von `sha384sum`, Pfade relativ, `LC_ALL=C` sortiert, in `exclude`). Prüfen: `cd assets/vendor && sha384sum -c --strict --quiet SHA384SUMS`. Neu erzeugen: `find . -type f ! -name SHA384SUMS -printf '%P\n' | LC_ALL=C sort | xargs -d '\n' sha384sum > SHA384SUMS`.
- **SEC-8b** [SOLL · Soll · Review] `Gemfile.lock` mit `CHECKSUMS`-Abschnitt (`bundle lock --add-checksums`). Ungenutzte Theme-Assets stehen in `exclude`. Jekyll fragt `exclude` für Theme-Assets nicht ab, das übernimmt `_plugins/theme-assets-exclude.rb` (CI-Gate für die Theme-Skripte). Devcontainer ohne weitergereichten Host-Token, Image per Digest.
- **SEC-8c** [KANN · Offen · CI-P3] `bundle-audit check --update` und `npm audit --audit-level=high` als Warnung in einem bestehenden Job, nur unter den Bedingungen von SEC-7b und GIT-6 (keine zusätzlichen Trigger, kein Artefakt-Speicher).
- **SEC-8d** [SOLL · Ist · Review] Vendor-Bibliotheken werden nur aktualisiert, wenn der Changelog Fixes für Bedienung, Barrierefreiheit oder Sicherheit enthält, die unsere Nutzung betreffen (Owner 1. 10. 2026). Ein Wechsel übernimmt nur die heute ausgelieferten Dateien unverändert aus dem offiziellen npm-Paket, führt die Version in `THIRD-PARTY-NOTICES.md` nach, erzeugt `assets/vendor/SHA384SUMS` neu (SEC-8a) und muss `tests/vendor.spec.js` bestehen, der in der CI läuft (Formeln auf `/mandelbrot/` direkt und nach SPA-Navigation, Slider, Preset, keine Konsolenfehler, kein CSP-Verstoß).

### 11.9 Externe Links und Ressourcen

- **SEC-9** [MUSS · Ist · CI-P2] Kein Laden von Ressourcen fremder Hosts (Script, Stylesheet, Font, Bild, Iframe, Video, `@import`, `url()`). Alles wird selbst gehostet. Reine `<a href>`-Links sind erlaubt. Jedes `target="_blank"` trägt `rel="noopener noreferrer"`. Keine `http://`-URLs. Theme-Features mit Dritt-Origins (Teilen-Buttons, Analytics, Kommentare) bleiben aus. Wer sie einführt, ändert im selben Commit CSP, Datenschutzerklärung und gegebenenfalls Einwilligung. Die CSP (SEC-3) setzt das für Seiten bereits durch, ein Post-Build-Grep ist geplant.

### 11.10 Personenbezogene Daten, Impressum, Datenschutz

- **SEC-10** [MUSS · Ist · CI-P2] Commits tragen die noreply-Adresse von GitHub (alle seit Einführung des Guides, ältere Commits nicht). Bilder in `assets/images` sind frei von GPS-, Kamera-, Seriennummer-, Autor- und Konto-Metadaten (`exiftool`-Stichprobe 2. 10. 2026 ohne Befund). Kontaktdaten nur im Kontaktbereich von „Über mich“ und nur, was der Owner freigibt (heute GitHub). Keine Lebenslauf- oder Office-Dateien im Repo oder in `_site`. `Lebenslauf-soprasteria/` bleibt in `.gitignore` **und** in `exclude`. Projektdetails zu Arbeitgebern und Kunden nur in der Tiefe, die die jeweilige Richtlinie erlaubt (SOLL).
- **SEC-10a** [MUSS · Offen · CI-P3] Eine Datenschutzerklärung ist von jeder Seite aus verlinkt (Footer der Persistent Shell). Neue Datenverarbeitungen (Speicher, Dienste, Hosting) werden dort im selben Commit nachgetragen. Empfohlen, weil GitHub Pages IP-Adressen protokolliert und die Haushaltsausnahme hier nicht greift. Entscheidung des Owners steht aus, die Seite existiert nicht.
- **Entschieden (Owner, 1. 10. 2026): kein Impressum.** Begründung: Privatperson. Das Restrisiko aus § 18 Abs. 1 MStV ist benannt (keine Rechtsberatung). Neu bewertet wird erst, wenn sich der Charakter der Seite ändert (Freelance-Angebote, Werbung, Affiliate, dann auch § 5 DDG). Bis dahin wird das nicht erneut vorgeschlagen.

### 11.11 Secrets

- **SEC-11** [MUSS · Ist · Review] Keine Tokens, Schlüssel oder Passwörter im Repo, auch nicht in Beispielen. `.env` und `.env.*` bleiben ignoriert, `.env.example` enthält nur Platzhalter. Der Workflow braucht keine Secrets außer dem automatischen `GITHUB_TOKEN`. **[Offen]** Secret Scanning mit Push Protection aktivieren (Status prüfen).

### 11.12 Veröffentlichung und Indexierung

- **SEC-12** [MUSS · Soll · CI-P3] Interne Seiten tragen `sitemap: false` und `noindex: true`. `head/custom.html` rendert daraus `<meta name="robots" content="noindex, nofollow">` (heute `404.html` und `offline.html`). Kein `Disallow` in `robots.txt`, ein gesperrter Crawler sieht das `noindex` nie. `_site` enthält nur erwartete Pfade (SOLL).

---

## 12 HTML, Liquid, Front Matter, Daten

### 12.1 HTML

- **HTML-1** [MUSS · Soll · Review] `<button type="button">` für Aktionen, `<a href>` für Navigation. `type` ist Pflicht. Bestand: R-76 (Button „Folgen“ aus dem Theme).
- **HTML-2** [MUSS · Soll · CI-P4] Landmarks: `<header class="masthead">`, `<main id="main">`, `<footer>`. Ein `<main>` pro Seite, auch auf `offline.html`. Jedes `<nav>` mit deutschem `aria-label`, sobald es mehrere gibt. `role="region"` nur für Bereiche mit Überschrift. Ist seit 2. 10. 2026: `<header class="masthead">` (`_includes/masthead.html`), `<main id="main">` in `_layouts/single.html`, `_layouts/splash.html` (lokales Override) und `offline.html`, auf jeder gebauten Seite genau ein `<main>`, alle `<nav>` deutsch benannt, keine `role="region"` ohne Überschrift.
- **HTML-3** [MUSS · Soll · Review] Bilder mit `alt`, `width`/`height` als ganze Pixelzahlen.
- **HTML-4** [MUSS · Soll · Review] Zitatquelle außerhalb von `<blockquote>`: `<figure><blockquote>…</blockquote><figcaption>– Autor</figcaption></figure>`.

### 12.2 Liquid

- **LIQ-1** [MUSS · Soll · Review] Jedes eigene Include beginnt mit einem `{% comment %}`-Docblock: Zweck, Einbindungsort, `Parameter:` mit Typ, Werten und Default. Theme-Overrides vermerken „Lokales Override: Grund“.
- **LIQ-2** [MUSS · Soll · Review] Parameter in snake_case, Zugriff `include.x | default: …`.
- **LIQ-3** [MUSS · Soll · Review] Interne URLs immer `{{ '/pfad/' | relative_url }}` mit führendem Slash. Kein `{{ site.baseurl }}/…`-Verketten (Ausnahme: Speculation-Rules-Pattern).
- **LIQ-4** [MUSS · Soll · Review] Seitenspezifisches JS und CSS nur über Front-Matter-Flags (`blog_search`, `fractal_panels`, `mathjax`, `toc`, `skill_graph.enabled`, `header.crt_power`, `neon_name`, `site_schema`, `person_schema`, `noindex`), nie über `page.url ==`. Erlaubt bleibt der Vergleich für die Aktiv-Markierung im Menü (`masthead.html`), er lädt kein JS oder CSS.
- **LIQ-5** [MUSS · Soll · CI-P3] Entwickler-Notizen als `{% comment %}`, nicht als `<!-- -->` (die gehen an jeden Besucher). Ausnahmen: die Konfigurationswarnung in `fractal/panel.html` (soll im Quelltext sichtbar sein) und Kommentare aus nicht überschriebenen Theme-Includes (Lizenzkopf aus `copyright.html`, Platzhalter aus `footer/custom.html`, Autorenprofil). Ein CI-Grep nimmt sie aus.
- **LIQ-6** [SOLL · Soll · Review] 2 Leerzeichen, Liquid-Ausgaben nicht über Zeilen umbrechen, Variablen englisch in snake_case, Liquid-Strings in einfachen, HTML-Attribute in doppelten Anführungszeichen, `{%- -%}` nur paarweise in Attribut-, Listen- und `<head>`-Kontexten.
- **LIQ-7** [MUSS · Soll · Review] Kein Markup im `title` (Name im DOM korrekt schreiben, Effekte per CSS oder `aria-hidden`-Spans).

### 12.3 Front Matter

- **FM-1** [SOLL · Soll · Review] Gemeinsame Werte (`layout`, `author_profile`, `header.overlay_image`, `overlay_filter`, `toc_label`, `toc_icon`) in die `defaults` von `_config.yml`. Front Matter enthält nur Abweichungen.
- **FM-2** [SOLL · Soll · Review] Reihenfolge: `title`, `excerpt`, `permalink`/`date`, `last_modified_at`, `layout`, `header`, `toc*`, Feature-Flags, `categories`, `tags`.
- **FM-3** [MUSS · Ist · Review] `assets/downloads/post-template.md` ist die Referenz-Vorlage für Beiträge und wird bei jeder Regeländerung nachgezogen. Sie muss selbst ein gültiger Beitrag sein (beginnt mit `---`). Quelle ist `assets/downloads/post-template.txt`: Eine `.md`-Datei mit Front Matter würde Jekyll nach HTML übersetzen, die `.txt`-Quelle gibt die Vorlage per `permalink` und `{% raw %}` unverändert aus. Anleitungen stehen darin als `{% comment %}`, nie als `<!-- -->`.

### 12.4 YAML und Markdown

- **YAML-1** [MUSS · Soll · Review] 2 Leerzeichen, Keys englisch in snake_case, Werte deutsch, Prosa in doppelten Anführungszeichen. Ausnahme: Keys, die das Theme vorgibt (`ui-text.yml` und dessen Schlüssel), bleiben in der Theme-Schreibweise.
- **YAML-2** [MUSS · Soll · CI-P3] Mehrabsätzige Prosa oder Listen als `|`-Block, nicht `>-` (Folding macht Listen zu Fließtext). Kein `<br>`, kein HTML, kein `style` in Daten. Betonung per Markdown. Bestand: R-64.
- **MD-1** [MUSS · Soll · CI-P3] Code-Fences mit Sprache öffnen und mit blankem ` ``` ` schließen. Ein offener Fence verschluckt den Rest des Beitrags. Bestand: R-64.
- **MD-2** [MUSS · Soll · Review] Kein Inline-HTML für Layout. Klassen per kramdown-IAL (`{: .text-center}`).
- **MD-3** [MUSS · Ist · Review] Mathe in `_data`: Inline `$…$` mit doppelt escaptem Backslash, Display `$$…$$` mit einfachem. Kontraintuitiv, deshalb hier festgehalten.

---

## 13 Dateien, Benennung und Dokumentation

- **NAME-1** [MUSS · Soll · CI-P3] Dateinamen nach dieser Tabelle. Abweichungen gibt es nur bei Bildern (R-71).

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

- **DOC-1** [MUSS · Ist · Review] Dieses Dokument liegt als `STYLEGUIDE.md` im Repo-Root und ist die normative Quelle. Audit- und Sicherheitsberichte liegen datiert unter `docs/audits/`. `README_DEV.md` „Design-System“ ist ein Verweis hierher. Owner-Entscheidungen aus der Claude-Memory werden ins Repo übernommen, nachdem jede Zahl gegen den Code geprüft ist.
- **DOC-2** [MUSS · Soll · Review] Doku nennt Variablen statt Zahlen (`$crt-drawer-offset` in `_view-transition.scss`, `COOLDOWN_MS` in `tv-switch.js`). Jede Information hat genau einen Ort.
- **DOC-3** [MUSS · Soll · Review] Ändert ein Commit dokumentiertes Verhalten, Werte, das Wired-Set, Tests oder CI, ändert er Doku und Tests mit.
- **DOC-4** [SOLL · Soll · Review] Feature-Dokus nach Vorlage: Zweck in einem Satz, „Stand: Monat Jahr“, Dateien-Tabelle, Verhaltens-Garantien, Verifikation nach Änderungen, bekannte Grenzen.
- **DOC-5** [SOLL · Soll · Review] Feature-Dokus nach `docs/` in kebab-case ohne README-Präfix (`docs/features/spa-nav.md`), Entscheidungen als ADR in `docs/entscheidungen/NNNN-titel.md` (Nygard: Kontext, Entscheidung, Konsequenzen). Verweise im Code im selben Commit umstellen. Bestand: R-69.
- **DOC-6** [MUSS · Soll · CI-P3] Doku anredefrei, nie „Sie“. Deutsche Anführungszeichen, Code-Fences mit Sprache, Typografie nach Abschnitt 8.
- **DOC-7** [MUSS · Soll · CI-P2] Je Werkzeug genau eine Versionsquelle: `.ruby-version`, `Gemfile.lock`, `.nvmrc`, `package-lock.json`. Doku und Workflow nennen die Datei, nicht die Nummer (Workflow: `node-version-file`, `cache-version` aus der Versionsdatei abgeleitet). Bestand: R-69.

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

- **GIT-1** [MUSS · Ist · CI-P3] Betreff beschreibt das Ergebnis, Groß- und Kleinschreibung nach deutscher Rechtschreibung, kein Schlusspunkt. Ziel höchstens 72 Zeichen, hart höchstens 100. Aufzählungen in den Body.
- **GIT-2** [MUSS · Ist · Review] Body bei nicht trivialen Änderungen: Warum, Ursache, wie verifiziert.
- **GIT-3** [MUSS · Ist · Review] `#N` nur für echte GitHub-Issues und -PRs. Interne Aufgaben als Issue anlegen oder mit `T-N` kennzeichnen.
- **GIT-7** [MUSS · Soll · CI-P3] Typen (abschließend). Noch nicht durchgehend eingehalten (z. B. `style(scss)` für einen reinen Formatierungs-Commit, 08bae3c), Prüfung per commitlint geplant:

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

- **GIT-8** [MUSS · Soll · CI-P3] Scopes (abschließend, Einzahl, höchstens einer):

| Gruppe | Scopes |
|---|---|
| Seiten | `home`, `about`, `cv`, `blog`, `mandelbrot` |
| Komponenten | `hero`, `masthead`, `nav`, `spa-nav`, `tv`, `toc`, `fractal`, `skill-graph`, `sw`, `mathjax`, `seo`, `neon`, `blog-notice`, `author-follow` |
| Querschnitt | `scss`, `js`, `jekyll`, `config`, `a11y`, `security`, `images` |
| Infrastruktur | `deps`, `ci`, `tests`, `scripts`, `dev`, `docs`, `lint`, `styleguide` |

Betrifft ein Commit mehrere Bereiche: Scope weglassen oder Commit teilen. Keine Pseudo-Scopes (`polish`, `ui`, `design`, `mobile`, `experiment`). Historische Synonyme werden zusammengeführt: `fractals` → `fractal`, `tv-switch` → `tv`, `css` → `scss`, `post` → `blog`. Abweichung seit Einführung des Guides: Commits mit `farben`, `farbe`, `css`, `html`, `head`, `spa`, `schrift` und `theme`. Ob die Liste wächst (etwa um `html`, `schrift`, `theme`) oder die Commits künftig zuordnen (`spa` → `spa-nav`, `farben` → `scss`), entscheidet der Owner.

### 14.2 Branches

- **GIT-4** [MUSS · Soll · Review] `<typ>/<thema-kebab>` mit den Typen aus GIT-7 (`feat/`, `fix/`, `refactor/`, `content/`, `docs/`). Kein Unterstrich. Altbestand (`feature_…`, `feature/…`) bleibt bis zum Löschen.
- **GIT-5** [SOLL · Soll · Review] Lokaler Merge mit `Merge <branch>: <Zusammenfassung>`. Branches nach dem Merge löschen, regelmäßig `git fetch --prune`.
- **GIT-6** [MUSS · Ist · Review] CI-Trigger sparsam (Owner-Entscheidung, Storage-Limit kontoweit): nur Push auf `main`/`master` und `workflow_dispatch`, Artefakt-Retention 1 Tag. Test-Branches und Pull Requests lösen keinen Lauf aus.

### 14.3 Versionierung

Kein SemVer (eine Website hat keine öffentliche API). Ein `CHANGELOG.md` im Format Keep a Changelog ist optional (KANN). Der Guide selbst versioniert nach GOV-7.

---

## 15 Performance, Browser, Tests

### 15.1 Performance-Budget

- **PERF-1** [MUSS · Soll · CI-P4] Core Web Vitals im 75. Perzentil: LCP höchstens 2,5 s, INP höchstens 200 ms, CLS höchstens 0,1. Das sind Feldwerte (Chrome UX Report, soweit vorhanden). Im Labor misst Lighthouse (mobil, gedrosselt) auf `/`, `/cv/`, `/mandelbrot/` und einem Blogbeitrag, INP wird dort über Total Blocking Time angenähert.
- **PERF-2** [SOLL · Offen · CI-P4] Budgets (komprimiert übertragen, Vorschlag, Messbasis im Audit): eigenes JS pro Seite höchstens 50 KB ohne Fraktal-Module und MathJax, `main.css` höchstens 50 KB, Hero-Bild höchstens 150 KB, Critical-CSS höchstens 14 KB (erstes TCP-Fenster).
- **PERF-3** [MUSS · Ist · Review] Das Critical-CSS enthält nur, was für den ersten Viewport ohne Layout-Sprung nötig ist (CRIT-1, CRIT-2).
- **PERF-4** [MUSS · Ist · Review] Prerender per Speculation Rules nur für Seiten außerhalb des Wired-Sets (SEO-5). Kein Prerender für Drawer-Links.
- **PERF-5** [MUSS · Ist · Review] Textschrift (TYP-13): höchstens 35 KB je Datei (WOFF2, heute 28 KB aufrecht und 30 KB kursiv), nur die aufrechte Datei per Preload, und der Schrifttausch erzeugt keinen messbaren Layoutsprung (CLS unter 0,01). Gemessen 1. 10. 2026 im Playwright-Container mit 1,5 s verzögerter Schrift auf `/`, `/about/`, `/cv/`, `/posts/` und einem Beitrag, Desktop und mobil: höchstens 0,0003 mit Ersatzschrift (0,0007 ohne).

### 15.2 Browser und Geräte

- **BRW-1** [MUSS · Soll · Review] Zielplattform: Baseline „Widely available“ plus diese Ausnahmen mit Fallback: View Transitions (nur Chromium, Firefox navigiert ohne Übergang), Speculation Rules (nur Chromium).
- **BRW-2** [MUSS · Soll · Review] Testmatrix vor jedem größeren Merge:

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
| Stylelint (`npm run lint:css`) | CI `lint` | SCSS-Regeln laut `.stylelintrc.json`, darunter SCSS-2, SCSS-7 (`keyframes-name-pattern`), SCSS-12 (`declaration-no-important`), BP-5 |
| ESLint (`npm run lint:js`, `eslint.config.mjs`) | CI `lint` | JS-2 (`no-var`, `prefer-const`, ohne Ausnahme), dazu `js/recommended` und `no-unsanitized` (SEC-1) |
| `scripts/fs-guardrail.sh` | CI `lint` | TYP-1 |
| `scripts/color-guardrail.sh` | CI `lint` | FARB-1, FARB-5, FARB-6, FARB-8 (SCSS), FARB-9, ungepaarte `[Block]`-Marker |
| `scripts/scale-guardrail.sh` (Ratchet, Grenzwerte `scripts/scale-baseline.txt`) | CI `lint` | SP-1, RAD-1, Z-3, MO-1, MO-2: keine neuen Literale für Abstand, Radius, Schatten, z-index, Dauer, Kurve, auch nicht über lokale Sass-Variablen, kein neues `transition: all`, ungepaarte `[Block]`-Marker |
| `scripts/bp-guardrail.sh` | CI `lint` | BP-1, BP-2, BP-5 (Tokens samt Rechnungen, SCSS, JS, Templates samt Critical-CSS) |
| `scripts/security-guardrail.sh` | CI `lint` | SEC-4, SEC-5, SEC-5c, SEC-7, SEC-8, SPA-4 |
| `scripts/scss-format.py` | CI `lint` | SCSS-19 |
| `tests/guardrails/run.py` (Fälle in `tests/guardrails/cases/`) | CI `lint` | Negativtests: absichtliche Verstöße gegen Skalen-, Farb-, Breakpoint- und Security-Guardrail müssen scheitern, erlaubte Grenzfälle durchgehen |
| `jekyll build --strict_front_matter` | CI `build` | Front Matter |
| `scripts/sass-deprecation-check.sh` | CI `build` | SCSS-2, SCSS-3 |
| Gate „Styleguide nie im Deploy“ | CI `build` | SG-1 (`_site/styleguide` und `styleguide.css` fehlen im Deploy-Build) |
| Gate „ungenutzte Theme-Skripte nicht im Deploy“ | CI `build` | SEC-8b (`main.min.js`, `vendor/`, `lunr/`, `plugins/` fehlen unter `_site/assets/js/`) |
| Playwright `npx playwright test` im Container (Review-Build `_site_review`) | CI `build`, Schritt „Style-Guide-Review“ | `tests/visual/`: SG-2, SG-3, KOMP-1, Kontrast der Textproben (FARB-2), axe-core WCAG 2.2 AA (6.1), Invarianten (A11Y-2, OVL-3, OVL-4, BP-1, BP-2). `tests/spa-nav.spec.js`: SPA-Kontrakt und SPA-6. `tests/vendor.spec.js`: SEC-8d |
| `scripts/csp-check.py _site` | CI `build` | SEC-3, SEC-4 |
| html-proofer, interne Links | CI `build` | Links |
| Deploy nur bei grünem `build` **und** `lint` | `needs: [build, lint]` | alles oben |
| Dependabot-Alerts, Versions-PR für Actions (monatlich) | GitHub, `.github/dependabot.yml` | SEC-7, SEC-7c |
| `scripts/cascade-check.py` | manuell | TYP-4, TYP-6 |
| `scripts/scale-literals.py --report` | manuell | Restliste zu R-35 |
| `scripts/style-snapshot.js` | manuell | optisch neutrale Refactorings (berechnete Stile vorher und nachher) |

### 16.2 Ausbau (priorisiert)

| Priorität | Check | Fängt |
|---|---|---|
| 1 | `node --check` über `assets/js/*.js` im Lint-Job | JS-1 |
| 1 | Stylelint-Flags `--report-needless-disables --report-descriptionless-disables --report-invalid-scope-disables` | SCSS-18 |
| 1 | Stylelint: `color-named: never`, `font-weight-notation: numeric`, `selector-max-id: 0` | FARB-8, TYP-8, SCSS-9 |
| 1 | Stylelint `declaration-property-value-disallowed-list`: `outline: none` (`transition: all` und `rgba($hover-color` fangen schon die Guardrails) | 2.4.7 |
| 1 | Grep `target="_blank"` ohne `noopener` | LINK-3, SEC-9 |
| 2 | Stylelint `selector-max-specificity: "0,4,2"` | SCSS-9 |
| 2 | Stylelint `selector-class-pattern` für BEM plus `is-`/`has-` | SCSS-5 |
| 2 | Stylelint `scss/dollar-variable-pattern` kebab-case | SCSS-7 |
| 2 | Token-Kontrast-Skript (Paare Vordergrund, Grund, Mindestwert, Alpha komponiert) | FARB-2, 6.4 |
| 2 | Critical-CSS-Sync-Check (Inline-Block gegen Tokens, verbietet `body{font-family}`, `body{color}` und jedes `html{font-size}` außer `100%`), dazu `style`-Attribute in Templates | CRIT-1, CRIT-3 |
| 2 | ESLint-Regeln zusätzlich zur bestehenden Config (16.1): `strict`, `eqeqeq`, `no-console` mit warn/error, `no-restricted-properties` gegen `navigator.userAgent`, `no-eval`, `no-implied-eval`, `no-new-func`, `no-script-url` | JS-3, JS-11, JS-14, SEC-1 |
| 2 | `exiftool`-Gate über `assets/images`, `sha384sum -c` für `assets/vendor` | SEC-10, SEC-8a |
| 3 | `scripts/content-check.py`: Fence-Balance, Intro ohne Überschrift, Caption ≠ Titel, Sie-Formen, Semikolon in Excerpt und Intro, `<br`/`style=` in `_data`, `\d{4} - \d{4}`, gemischte Anführungszeichen, YAML-Folding-Falle, Quellenkommentare | 5, 7, 8, 12 |
| 3 | Post-Build-Grep auf `_site`: „Sie“-Formen, englische Theme-Fallbacks („Skip to“), `<!--` aus eigenen Includes, `noindex` auf internen Seiten | TON-2, LIQ-5, SEC-12 |
| 3 | `markdownlint-cli2` für Doku (MD040, MD032, MD047), zunächst ohne `_posts` | DOC-6 |
| 3 | `cascade-check.py` mit Element-Regeln und Inline-Blöcken als Konkurrenten, Erwartungswert-Modus | TYP-4, TYP-5 |
| 3 | commitlint oder Regex-Hook in `.githooks/commit-msg` (`type-enum`, `scope-enum`, `subject-case` **aus**, wegen deutscher Substantive) | GIT-1, GIT-7, GIT-8 |
| 4 | axe-core läuft schon (16.1). Offen: dieselben Routen zusätzlich mit `reducedMotion: reduce` und `forcedColors: active` | Abschnitt 6, BRW-3 |
| 4 | Playwright-Invariante: Lesemodus (Power-Button auf `/`) stoppt die CRT-Endlos-Animationen. Umgesetzt sind schon Grenz-Viewports, Drawer, Skill-Graph-Sheet und „kein unsichtbarer Fokus“ (16.1) | 6.3, 6.5 |
| 4 | Lighthouse-Lauf per `workflow_dispatch` gegen PERF-1 und PERF-2 | 15.1 |

Neue Guardrail-Skripte folgen dem Muster von `fs-guardrail.sh`: Marker in der Zeile darüber, Exit 1 bei Verstoß, Schritt im bestehenden Lint-Job (kein zusätzlicher Artefakt-Speicher, GIT-6).

### 16.3 Review-Checkliste

Vor jedem Push:

- **REV-1** `npm run lint:css`, `python3 scripts/scss-format.py`, `bash scripts/fs-guardrail.sh`, `bash scripts/color-guardrail.sh`, `bash scripts/scale-guardrail.sh`, `bash scripts/bp-guardrail.sh`, `bash scripts/security-guardrail.sh` und `python3 tests/guardrails/run.py` grün
- **REV-2** Docker-Build mit `--strict_front_matter` grün (kein lokales Ruby, `--user` gesetzt), danach `python3 scripts/csp-check.py _site`
- **REV-3** Nur Tokens, keine neuen Literale (Farbe, Größe, Abstand, Breakpoint, z-index, Dauer)
- **REV-4** Kontrast in allen Zuständen geprüft, gegen den echten Grund
- **REV-5** Fokus sichtbar, Tastaturbedienung, Reduced Motion
- **REV-6** Kaskaden-Falle bedacht (p/li, direkte Kinder von `.page__content`), `cascade-check.py` gelaufen
- **REV-7** Neues Seiten-Modul hängt an `spaModule`, kein Inline-Skript
- **REV-8** Wired-Set oder Gate-Paar geändert? Dann Tests, Doku und Gegenstück im selben Commit (SPA-5, BP-6)
- **REV-9** Texte anredefrei, keine Semikolons, deutsche Typografie (Abschnitt 8)
- **REV-10** Doku und Kommentare passen zum neuen Verhalten
- **REV-11** Commit-Format und Scope aus der Liste
- **REV-12** Design-Umbau? Vorher Vorschläge gezeigt (PROZ-1)

Nicht automatisierbar und deshalb immer im Review: Ton (warm, nicht nerdig), fachliche Korrektheit, ob ein `alt`-Text das Bild beschreibt, ob eine Caption eine echte Zusatzinformation ist.

---

## 17 Register bekannter Abweichungen

Stand: Abgleich vom 2. 10. 2026 (Kopf). Ein Eintrag verschwindet, sobald der Code die Regel erfüllt oder der Owner die Regel ändert. Seine Nummer wird nicht neu vergeben (GOV-8). Details und Zeilen stehen im Audit unter der genannten Befund-ID, bei neueren Einträgen hier. Spalte „Weg“: **Owner** = sichtbare Änderung oder offene Entscheidung, **Code** = umsetzbar ohne Owner-Entscheidung, **Track** = gehört zur laufenden Skill-Graph-Überarbeitung.

| ID | Regel | Stelle | Audit | Weg |
|---|---|---|---|---|
| R-10 | Z-1 | Fixierte Overlays im Stacking-Kontext von `#main`: Sticky-TOC, Back-to-Top (`_layouts/single.html`), Blog-Hinweis. (Der schwebende Skill-Graph-Knopf ist seit 2. 10. entfallen.) | B-LAY-05 | Owner (am `<body>` mounten oder `$intro-transition: none`) |
| R-11 | MO-1 | Theme-`$global-transition` (`all 0.2s ease-in-out`) ist nicht überschrieben, das Theme-CSS enthält weiter `transition: all`. Im eigenen SCSS keins mehr | B-MO-01 | Code (eigener Durchgang, ändert Theme-CSS an vielen Stellen, Vorher/Nachher) |
| R-21 | TYP-7 | Laufweiten außerhalb der Skala stehen als `$tracking-legacy-*` und `$fp-tracking-legacy-*` mit Ziel in `variables/_typography.scss` (seit 2. 10. keine Literale mehr, CI: `scale-guardrail.sh` Kategorie `tracking`). Offen nur die Angleichung an die Skala, sichtbar | B-T6 | Owner |
| R-32 | OVL-4, A11Y-2 | Drawer: modal (Scrim, Scroll-Sperre, `inert`), aber ohne `role="dialog"` und `aria-modal`. Fokus wandert nur beim Öffnen per Tastatur hinein, weil mobil `:focus` die Links magenta färbt | B-A11Y-05 | Owner |
| R-33 | 2.5.7 | Fraktal-Pan nur per Ziehen (rechte Maustaste, Leertaste), Zwei-Finger-Geste oder Pfeiltasten am fokussierten Canvas. Für Zeiger fehlt eine Alternative ohne Ziehen | B-A11Y-09 | Owner (sichtbare Pan-Buttons?) |
| R-34 | SCSS-4 | Seit der `@use`-Migration erweitert das Theme-`@extend` (`.comment__date { @extend .page__meta }`) nur noch Theme-Regeln. Die eigenen `.page__meta`-Regeln gelten nicht für `.comment__date`. Kommentare sind aus, das Element kommt auf keiner Seite vor | – | Owner-Freigabe 1. 10. 2026, beim Einschalten von Kommentaren nachziehen |
| R-35 | SP-1, SP-2 | Stufe B erledigt 1. 10. 2026: Radien, Schatten, z-index, Dauern, Kurven und `transition: all` auf 0. Übrig sind 25 em-Abstände außerhalb der markierten em-Systeme in `_pages.scss`, `_offline.scss`, `_content-accents.scss`, `_footer.scss`, `_archive.scss`, `_author.scss`, `_buttons.scss` und `_home.scss` (Liste: `python3 scripts/scale-literals.py --report`, Ratchet `spacing 25`) | B-SP-01, B-Z-01, B-MO-01, B-RAD-01, B-SH-01 | Code bei Berührung auf rem-Tokens (Größe hängt heute an der Schrift des Elements, je Stelle prüfen) |
| R-50 | SCSS-10 | Minimal Mistakes 4.28.1 setzt `.page__content :first-child { margin-top: 0 }` (PR #5103, gemeint war nur das erste Inhaltselement neben der TOC). Die Regel trifft jedes erste Kind in der Tiefe. Gegenmittel mit Spiegelwerten in `theme-overrides/_first-child.scss`, H2-Probe in `assets/css/styleguide.scss`. Wer einen gespiegelten Wert ändert, zieht ihn dort nach | – | upstream melden, Datei entfernen, sobald das Theme die Regel auf direkte Kinder begrenzt |
| R-51 | 3.1.2 (6.1) | Minimal Mistakes 4.28.1 schreibt englische `aria-label` fest ins Markup. Deutsch überschrieben: `skip-links.html`, `post_pagination.html`, Masthead. Offen: `paginator-v2.html` („Pagination“), erscheint erst ab dem siebten Beitrag (`per_page: 6`) | – | Owner: beim ersten Blättern überschreiben oder upstream `ui-text`-Keys anregen |
| R-52 | FARB-2, FARB-3, FARB-4 (1.4.11) | Hamburger-Balken (`_masthead.scss`) und Back-to-Top (Rand, Icon, `_back-to-top.scss`) nur in `$link-color-subtle`, 2,50 bis 2,63:1 als UI-Grafik (6.4). Platzhalter im Fraktal-Preset-Feld `$white-a50` (`fractal-panel/_controls.scss`, 5,0:1, unter `$fg-subtle`) | B-F06 | Owner (sichtbar) |
| R-54 | TYP-3, TYP-8 | `$fs-label-xs` (10,9 px) für funktionalen Text: Button-Text der Fraktal-Toolbar mobil (`fractal-panel/_toolbar.scss`), Copyright-Zeile im Footer. `font-weight: bold` in `_about.scss`, `fractal-panel/_states.scss` (2×) und `_cv.scss` | – | TYP-3: Owner (sichtbar), TYP-8: Code (`bold` = `700`), `_cv.scss`: Track |
| R-55 | BP-3, BP-4 | Von 59 `:hover`-Stellen stehen 6 in `@media (hover: hover)`. 40 `down()` gegen 9 `up()` | – | Code bei Berührung (unter BP-6) |
| R-56 | KOMP-2, KOMP-4 | `:focus` als Stil-Selektor in `btn-role-primary` und `btn-role-outline` (`abstracts/_mixins.scss`), `_back-to-top.scss`, `_masthead.scss` (2×), `fractal-panel/_controls.scss` (2×). Mixin `focus-ring()` fehlt | – | Code mit Vorher/Nachher (der Fokusstil nach Mausklick entfällt sichtbar) |
| R-57 | KOMP-5, MO-6 | `animationend` ohne Filter auf `animationName`: Power-Hinweis in `hero-crt.js`, Graph-Hinweise in `skill-graph-sheet.js` | – | Code, Track |
| R-58 | SPA-1, SPA-2, BEW-1a | Handgerollter `spa:load`-Kontrakt statt `spaModule`: `toc.js`, `back-to-top.js`, `hero-crt.js`, `author-follow.js`, `neon-orbit-toggle.js`, `blog-search.js`, `mathjax-typeset.js`. Lokale Reduced-Motion-Abfragen statt `AuflinieUtils.prefersReducedMotion` in `spa-nav.js`, `greedy-navigation.js` und den Track-Dateien | B-JS-03 | Code bei Berührung, Track |
| R-64 | CRIT-3, YAML-2, MD-1 | `style`-Attribute in `vt-antenne-defs.html`, `page__hero.html` (Theme-Option `overlay_color`) und `_data/mandelbrot.yml`. `>-`-Folding und `<br>` in `_data/cv_content.yml` und `_data/mandelbrot.yml`. Zwei Code-Fences ohne Sprache in „Erstellung dieser Website“ | – | Code, Inhalt |
| R-65 | TYPO-1, TYPO-2, COPY-2, COPY-4, FACH-1 | Entities in `footer.html` (`&copy;`, `&ouml;`), `fractal/panel.html` (`&auml;`, `&middot;`, Pfeile) und `fractal/canvas.html`. „Berechne…“ ohne Leerzeichen vor der Auslassung. Note „Sehr Gut“ groß (`cv_content.yml`). Leerzustand der Blog-Suche ohne Hinweis, was hilft. Fachaussagen in `_data/mandelbrot.yml` ohne Quellenkommentar (z. B. Hausdorff-Dimension, Shishikura 1998) | – | Inhalt (Owner liest Texte gegen) |
| R-66 | SCSS-14 | `/* */`-Dateikopf in `_cv.scss` | – | Track |
| R-67 | SEO-2, SEO-3, SEITE-6 | Excerpts unter 70 Zeichen: Über mich (59), Archiv (44), Blog (69). Site-Vorschaubild `WebSite_Logo_3.png` ist 600 × 600 px statt 1200 × 630 px (Motiv offen). `blog_notice` „Sommerpause“ auf `/posts/` ohne Ablaufdatum, das Include kennt keins | – | Owner |
| R-69 | DOC-5, DOC-7 | Skill-Feature-Doku noch als `docs/README-skill-feature.md`. Zweite Versionsquellen: `.devcontainer/devcontainer.json` (Ruby als Zahl, Node `lts`) und `post-create.sh` (Bundler-Version), dazu ist `.devcontainer/README.md` veraltet (rbenv, Kompilieren) | – | Code (Dev Container, eigene Runde), Skill-Feature-Doku: Track |
| R-70 | LINK-3 | `target="_blank"` ohne Hinweis auf den neuen Tab: GitHub-Links in `_pages/about.md` und `_pages/posts.md`, `archive-single.html`, `single.html` (`page.link`), Beispiel im Beitrag „Blogbeitrag erstellen“ | – | Owner (gleicher Tab oder Hinweis) |
| R-71 | NAME-1 | `assets/images/Logo.svg`, `assets/images/WebSite_Logo_3.png` (4.1) | – | Owner |
| R-72 | FARB-10 | `$background-color` und `$text-color` kommen weiter aus dem Dark-Skin, gespiegelt in `$page-bg` und `$body-text-color` | B-F25 | Code (Theme-Ableitungen vorher und nachher vergleichen) |
| R-73 | IMG-7 | `assets/images/QUELLEN.md` fehlt. Die Lizenz des Hintergrundbilds steht nur im README-Abschnitt „Lizenz“ | – | Owner (Quellen nennen), dann Code |
| R-76 | SEITE-3, HTML-1 | Theme-Include `author-profile.html` (nicht überschrieben): Autorname in der Sidebar als `<h3 class="author__name">`, Button „Folgen“ ohne `type`. Beim Abbau von R-60 gefunden | – | Code (Include überschreiben, Optik vorher und nachher vergleichen) |

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
- Same-document View Transitions: https://developer.chrome.com/docs/web-platform/view-transitions/same-document
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

| Version | Änderung |
|---|---|
| 2026-10-01 | Erste Fassung. Kritik-Runde eingearbeitet: Status- und Durchsetzungsangaben je Regel, Register bekannter Abweichungen, Sicherheitsabschnitt integriert, Owner-Prozessregeln, Performance, Bilder, Links, Formulare, SEO, Druck, Browser-Matrix. |
| 2026-10-01 | JS-2 per ESLint durchgesetzt (`no-var`, `prefer-const`), Register R-14 auf zwei Dateien verkleinert. JS-18: `site-utils.js` mit `prefersReducedMotion` und `rafThrottle` angelegt. |
| 2026-10-01 | Texte: Gedankenstrich „ – “ und „2025 – Heute“ (groß) als Owner-Entscheidungen in TYPO-2 übernommen. SEITE-1 und FM-3 auf Ist (Beiträge und Vorlage ohne Einleitungs-Überschrift, Vorlage ohne verschachtelten Kommentar), Home-Intro ohne Semikolon (7.2), R-22 erledigt. |
| 2026-10-01 | SCSS: `@use`-Modulbaum mit Theme-Brücke als Hausregel (SCSS-4 Ist), SCSS-2, SCSS-3 und SCSS-19 auf Ist mit CI-Checks, Struktur 9.1 und Mixin-Quelle auf `abstracts/`, R-13 erledigt, R-34 (`.comment__date`) neu. |
| 2026-10-01 | Schrift: TYP-13 (Ubuntu selbst gehostet, Schalter `text_font`) und PERF-5 neu, TYP-12, LIZ-2 und 9.1 nachgeführt, FARB-10 auf Ist für `$primary-color`, R-29 erledigt, R-5 ohne `font-family`. |
| 2026-10-01 | Inhalte: TYPO-2 erlaubt „&“ als Stilelement in kurzen Labels (Owner), Token-Zeile `$about-motto-font-size` entfernt, R-35 (tote Kaskaden-Werte, B-T3) erledigt. Demo-Beitrag nach INH-4 depubliziert. |
| 2026-10-01 | Skalen: `variables/_scales.scss` mit Abstands-, Radius-, Schatten-, Ebenen- und Motion-Tokens auf Ist (3.3, 3.5 bis 3.7), exakte Literale migriert, `skala-Ausnahme`-Marker (GOV-5) und Ratchet `scale-guardrail.sh` (16.1), Rest in R-35. |
| 2026-10-01 | Breakpoints: Token-Set `$bp-*` mit den Mixins `up()`, `down()` und `between()`, JS über `AuflinieUtils.mq`, BP-1 und BP-2 auf Ist mit `bp-guardrail.sh`. Grenze überall halboffen, 768 px und 1024 px gehören jetzt zum größeren Bereich (Hero im Critical-CSS eingeschlossen). R-6 und R-9 erledigt. |
| 2026-10-01 | Abhängigkeiten: SEC-8d neu (Vendor-Updates nur bei relevanten Fixes, Prüfung über `tests/vendor.spec.js`), MathJax auf 4.1.3, Gems per `bundle update`. |
| 2026-10-01 | Theme: Minimal Mistakes 4.28.1 (Commit gepinnt), SEO-3 um `og:image:alt` ergänzt, R-50 (Abstand erstes Kind) und R-51 (englische Landmark-Namen) neu. |
| 2026-10-01 | Skalen Stufe B: Literale auf die Skalen gerundet (höchstens 4 px), Fraktal-Halbschritte, Ring- und Glow-Familie, lokale Ebenen benannt, Guardrails zählen lokale Variablen und prüfen Block-Marker, Templates und berechnete Breakpoints, Negativtests `tests/guardrails/`, R-35 auf em-Rest. |
| 2026-10-02 | Abgleich mit dem Code (Stand `75c23c0`), Status vorher → nachher: Ist 100 → 129, Soll 174 → 144, Offen 3 → 4. Auf Ist: GOV-3, GOV-4, GOV-5, GOV-7, GOV-8, DES-8, MO-2, MO-7, SEO-4, BEW-2, BEW-4, TON-1, TON-9, COPY-5, TYPO-3, SCSS-7, SCSS-8, CRIT-1, CRIT-2, JS-2, JS-3, SPA-6, SEC-5a, SEC-5c, SEC-10, DOC-1, GIT-1, GIT-2, GIT-3, GIT-7. Zurück auf Soll, weil der Code sie nicht erfüllt: KOMP-5. Auf Offen: SEC-10a (Datenschutzerklärung), dazu die Owner-Entscheidung „kein Impressum“ (11.10). Übernommen: Grundschrift `html{font-size:100%}` (CRIT-1, 6.1), CRT/Neon endlos als entschiedene Ausnahme (6.5), Lizenz entschieden (13.1), Hinweis zur Skill-Graph-Überarbeitung (4.4). Register 36 → 34 Einträge: 24 entfernt, davon 21 vom Code erfüllt (R-1, R-3 bis R-6, R-8, R-9, R-12 bis R-15, R-17 bis R-19, R-22 bis R-26, R-29, R-31), dazu R-2 (Owner-Ausnahme, steht in KOMP-3), R-7 (Rest ist eine Palettenfrage, 3.1) und R-27 (bewusst viewport-fix, 6.1). R-10, R-16, R-20, R-21, R-28 und R-35 auf den Stand gebracht. Neu R-52 bis R-73 für Abweichungen, die der Abgleich gefunden hat. Hinweis: R-35 war am 1. 10. doppelt vergeben (zuerst tote Kaskaden-Werte, dann Skalen-Rest), die Nummer bleibt beim Skalen-Rest. 16.1 um Playwright, Styleguide-Gate und SEC-5c ergänzt, 16.2 um Erledigtes gekürzt. |
| 2026-10-02 | Skill-Graph: OVL-2 (Mausrad zoomt auch im Graphen, Pinch, Zoom-Knöpfe), OVL-3 (Esc-Staffelung in der Capture-Phase), `$graph-sheet-width` neu, `$z-graph-float`, `$glow-hint*` und `$shadow-float` entfallen mit Aktivieren-Schritt und schwebendem Öffner, SEC-1-Ausnahme `skill-graph-sheet.js` entfällt, R-10 und 16.2 nachgeführt. |
| 2026-10-02 | Register-Abbau (Weg „Code“): erledigt und entfernt R-20, R-28, R-53, R-59, R-61, R-62, R-63, R-68. R-66 auf den `_cv.scss`-Rest, R-69 auf Skill-Feature-Doku und Dev Container gekürzt. Neu R-74 (Fokus beim Öffnen des Autor-Dropdowns) und R-75 (ungenutzte Theme-Skripte im Build). LIQ-4 um die neuen Flags ergänzt, LIQ-5 um die Ausnahmen, SEC-8a um Prüf- und Erzeugungsbefehl, SEC-8d und LIZ-2 auf `THIRD-PARTY-NOTICES.md`, Feature-Dokus unter `docs/features/`. |
| 2026-10-03 | R-75 erledigt: ungenutzte Theme-Skripte (`main.min.js`, `vendor/jquery`, `lunr/`, `plugins/`) per `exclude` aus dem Build. Weil Jekyll `exclude` für Theme-Assets nicht abfragt, filtert `_plugins/theme-assets-exclude.rb` sie nach dem Einlesen, ein CI-Gate prüft das Ergebnis (16.1, SEC-8b). |
| 2026-10-03 | R-60 erledigt: `type="button"` an Back-to-Top und am Neu-laden-Knopf der Offline-Seite, `role="region"` samt `aria-label` am Power-Knopf im Hero von `/` entfernt (Bereich ohne Überschrift, der Knopf ist selbst benannt), Navicon als `<span>`, TOC-Titel als `<span>` im Button und `<div>` im Kopf statt `<h4>`. Optik pixelgleich (Element-Screenshots, `style-snapshot.js`), dafür hält `_toc.scss` die Zeilenhöhe des früheren `<h4>` und nimmt dem Titel das Theme-`transition` für `span`. HTML-2 ohne offenen Rest. Neu R-76 (Autorname als `<h3>`, „Folgen“ ohne `type`, beides im Theme-Include `author-profile.html`). |
| 2026-10-03 | R-74 erledigt: das Autor-Folgen-Dropdown setzt beim Öffnen per Tastatur den Fokus auf den ersten Link, bei Maus und Touch bleibt er am Knopf (gleiche Logik wie der Drawer). A11Y-2 nachgeführt, `tests/visual/invariants.spec.js` prüft das Dropdown mit. |
