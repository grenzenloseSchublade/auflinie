# Interaktives Skill-Feature (CV-Seite)

Entwickler-Doku für Pflege und Weiterentwicklung. Das Verzeichnis `docs/` ist
in `_config.yml` vom Build ausgeschlossen — diese Datei landet nie auf der Site.

## Was das Feature macht

Die Skill-Chips auf `/cv/` sind erkundbar:

- **Klick-Hervorhebung:** Klick auf einen Chip hebt alle
  Skills hervor, die über gemeinsame Projekte verbunden sind (Rest dimmt), und
  zeigt die Projekte in einer Kontextzeile. Zweiter Klick oder Escape löst.
- **Skill-Graph:** Der Knopf „Skill-Graph öffnen“ oben im Abschnitt
  „Technische Fähigkeiten“ (unter der Auswahl-Konsole, vor den Gruppen, mit
  der Erklärzeile „Welche Fähigkeiten in welchen Projekten zusammenkommen“)
  öffnet ein modales Sheet mit Kräfte-Graph — Knoten = Skills, Kanten =
  gemeinsame Projekte (Kantendeckkraft = Gewicht). Klick auf Knoten wählt
  aus; die Auswahl ist mit der Chip-Liste synchronisiert, die Info-Leiste
  oben im Sheet zeigt sie im Format der Konsole (Skill, Rolle, Projekte).
  Ansicht: Startansicht beim Öffnen (alles eingepasst, auch mit Auswahl,
  kein Zentrieren), Zoom per Pinch, Mausrad, Knöpfe („−“, „+“,
  „Übersicht“ zurück zur Startansicht) und Tasten `+`/`−`/`0`, Pan per
  Ziehen. Der Graph bewegt sich nie von selbst. Namen stehen je nach
  Maßstab, Punkte ohne Namen zeigen ihn beim Antippen, beim Hineinzoomen
  und mit der Maus als Vorschau beim Überfahren.
- **Kleiner Graph-Knopf in der Konsole** (Prototyp, Owner 7. 10. 2026): Die
  Auswahl-Konsole über den Chips klebt beim Scrollen oben. Sobald der große
  Knopf darunter aus dem Bild ist, übernimmt rechts unten in der Konsole ein
  kleiner Knopf (Symbol und „Graph“, 24 px hoch) und öffnet dasselbe Sheet.
  Die Konsole hält dafür nur die Ecke unter ihren vollen Zeilen frei
  (`shape-outside`), sie läuft nicht öfter über als ohne Knopf. Beim Scrollen
  wird derselbe Knopf klein und dockt an: Erst kurz bevor der große die
  Konsole erreicht, löst er sich vom Scrollen und zieht auf einer geraden
  Linie schräg zum Platz des kleinen (Abnahme 8. 10. 2026), schrumpft dabei
  auf dessen Höhe und blendet erst am Ziel in ihn über (scroll-getriebene
  CSS-Animation, nur `translate`, `transform` und `opacity`, kein
  Scroll-Listener). Unterwegs ist sein Grund deckend, Text, der unter ihm
  durchzieht, scheint nicht durch. Die Erklärzeile bleibt stehen. Ohne
  Scroll-Zeitleisten (Firefox) und bei Reduced Motion blenden beide Knöpfe
  nur über (0,2 s bzw. sofort), sobald die Konsole den großen zu verdecken
  beginnt. Genau einer
  der beiden Knöpfe ist bedienbar, der andere `inert` und `aria-hidden`, ein
  IntersectionObserver in `skill-graph-sheet.js` schaltet in der Mitte der
  Überblendung um (dort sind beide zu 60 % sichtbar). Der Fokus kehrt nach
  dem Schließen zu dem Knopf zurück, über den geöffnet wurde.

Die statische Chip-Liste bleibt immer die kanonische, vollständige
Darstellung (auch für Screenreader und Druck); alles Interaktive ist
Progressive Enhancement.

## Ein-/Ausschalten

Front Matter von `_pages/cv.md`:

```yaml
skill_graph:
  enabled: true   # klickbare Chips
  graph: true     # Skill-Graph: Öffner, Panel, Sheet (setzt kein enabled voraus)
```

- `graph: false` entfernt Öffner, Panel und Skripte serverseitig komplett.
- `enabled: false` (und `graph: false`) ⇒ die Seite rendert byte-identisch zur
  rein statischen Fassung — keine Buttons, kein JSON, kein JS.

## Beteiligte Dateien

| Datei | Rolle |
|---|---|
| `_data/skills.yml` | **Einzige Datenquelle**: Skill-Katalog (Gruppen, Skills mit `tier` und `show`), `foundations`, Graph-Projekte, unter `texts` alle Bedientexte des Features |
| `_data/cv_content.yml` | bindet den Katalog im Abschnitt „Technische Fähigkeiten“ über `skills_catalog: true` ein |
| `_includes/cv/skills.html` | Gruppen und Chips aus dem Katalog (+ Buttons, Kontextzeile, gefilterter JSON-Tag, Graph-Include oben vor den Gruppen) |
| `_includes/cv/skill-graph.html` | Graph-Markup (Öffner mit Netz-Symbol und Erklärzeile, Kopfleiste, Info-Leiste, Canvas) |
| `_includes/cv/skill-graph-icon.html` | Netz-Symbol, eine Quelle für großen und kleinen Öffner |
| `assets/js/skill-graph-data.js` | Gemeinsame Helfer: Daten lesen, Skill→Projekte, `renderSelection` (Konsole und Info-Leiste) |
| `assets/js/skill-chips.js` | Klick-Hervorhebung der Chips |
| `assets/js/skill-graph-sim.js` | **DOM-freie** Force-Layout-Engine (reine Physik) |
| `assets/js/skill-graph.js` | Graph: Panel/Canvas/Interaktion, Ansicht (Pan + Zoom, Startansicht), Beschriftung nach Maßstab, Info-Leiste (nur UI) |
| `assets/js/skill-graph-sheet.js` | Präsentation als modales Sheet (Scrim, Scroll-Sperre, inert, Fokus, Touch-Hinweis), Umschalten großer und kleiner Öffner |
| `assets/_sass/components/_cv.scss` | Chip-Zustände (`has-selection`, `is-selected`, `is-related`), Breite ohne Trenner in Gruppen ohne Kern |
| `scripts/content-check.py` | prüft den Katalog vor dem Build (siehe „Prüfregeln“) |
| `assets/_sass/components/_skill-graph.scss` | Panel- und Sheet-Styles, kleiner Öffner und Verwandlung beim Scrollen |
| `assets/_sass/abstracts/_mixins.scss` | `selection-console`: gemeinsame Optik von Konsole und Info-Leiste |
| `_includes/scripts.html` | Flag-Gates für die Skripte |
| `service-worker.js` | Precache-Einträge der Skripte |

## Daten pflegen (`_data/skills.yml`)

**Datenfluss:**

```
_data/skills.yml ─┬─ groups + skills (show: true) ──► cv/skills.html ──► Chips je Gruppe (Kern, dann Breite)
                  │                                        │
                  └─ foundations + projects + texts ──────►└─► JSON-Tag [data-skill-graph-data]
                     (Liquid filtert auf sichtbare Skills)         ├─► skill-chips.js (Klick-Hervorhebung)
                                                                    └─► skill-graph.js (Knoten = DOM-Chips mit Projekt)
```

Schema (Kopf der Datei):

- **`groups`:** `id`, `title`, `context`. Reihenfolge = Anzeige. Eine Gruppe
  ohne sichtbare Skills entfällt, eine ohne Kern zeigt nur die Breite.
- **`skills`:** eine Zeile je Skill, `id` (kebab-case, stabil, nie
  umbenennen, muss nicht zum Namen passen: „C#“ hat die id `c`), `name`,
  `group`, `tier` (`core` | `breadth`), `show` (`true` | `false`).
  Sammelchips („Neo4j / Cypher“) fassen zwei Begriffe in einer Zeile.
- **`foundations`:** Basis-Werkzeuge ohne Projektkanten (Python, Git,
  Docker …), ein Klick zeigt „Basiswerkzeug“.
- **`projects`:** `id` (stabil), `label` (öffentlich, anonym), `skills`
  (Liste von Katalog-ids, ausgeblendete erlaubt).

**Sichtbarkeit:** Nur Skills mit `show: true` werden Chips. `skills.html`
filtert `foundations` und die Skills jedes Projekts im JSON-Tag auf
sichtbare ids (`where_exp`), ein Projekt ohne sichtbaren Skill entfällt
dort. Ausgeblendete Skills erreichen den Browser also nie, das JS sieht
keine unbekannten ids. Neue Projektfelder (`period`, `url` …) müssen in
`skills.html` beim Aufbau von `project_json` ergänzt werden.

- **Skill einschalten:** `show: true` in seiner Zeile. Chip und (falls er
  bei einem Projekt steht) Graph-Knoten erscheinen beim nächsten Build.
- **Neues Projekt:** Block unter `projects` anfügen, `id` vergeben, Skills
  listen, fertig. Kanten müssen nicht gepflegt werden: Skill↔Skill-
  Verbindungen (und ihre Gewichte) leitet das JS aus gemeinsamen Projekten ab.
- **Neuer Skill:** Zeile in der passenden Gruppe anlegen und in mindestens
  einem Projekt referenzieren, sonst meldet der Klick „keinem Projekt fest
  zugeordnet“ und der Inhalts-Check warnt.
- **Abgleich mit dem Firmenprofil:** ein lokales Skript außerhalb des Repos
  vergleicht die Skill-Liste des Profils mit dem Katalog (fehlende,
  überzählige, gestrichene, aber sichtbare Skills).

**Prüfregeln** (`scripts/content-check.py`, CI vor dem Build):

| Prüfung | Meldung |
|---|---|
| Skill-ID in `foundations` oder einem Projekt fehlt im Katalog (mit Vorschlag) | FEHLER |
| Gruppe eines Skills unbekannt (mit Vorschlag), Gruppen-id doppelt | FEHLER |
| Skill-id doppelt, Skill-Name doppelt, id nicht kebab-case | FEHLER |
| Skill-Name ist eine Schreibvariante eines anderen (nur Groß- / Kleinschreibung, Leerzeichen, Bindestrich, Schrägstrich, Punkt oder Klammern verschieden, etwa „Docker-Compose“ neben „Docker Compose“) | FEHLER |
| Einzel-Skill steckt schon in einem Sammelchip („Cypher“ neben „Neo4j / Cypher“), zwei Namen sehr ähnlich | WARNUNG |
| `tier` nicht `core` / `breadth`, `show` nicht `true` / `false`, Pflichtfeld fehlt | FEHLER |
| sichtbarer Skill ohne Projekt und nicht in `foundations` | WARNUNG |
| Projekt nur mit ausgeblendeten Skills (fehlt im Graphen) | WARNUNG |

Negativtests dazu: `tests/guardrails/cases/content-05` (unbekannte ID),
`-06` (ids unabhängig vom Namen), `-15` (leerer Text), `-17` (Gruppe),
`-18` (doppelte id), `-19` und `-20` (die beiden Warnungen), `-21`
(Schreibvariante) und `-22` (Teil eines Sammelchips).

- **Konsistenz im Browser:** Das JS validiert beim Laden (Version,
  Pflichtfelder, ids gegen die DOM-Chips) und schreibt `console.warn` bei
  Abweichungen. Nach dem Filter in Liquid sollte es nichts melden.
- **Texte** (`texts`, ARCH-4): Hinweiszeile über den Chips und in der
  Info-Leiste (`hint`), die Rolle nach einem Klick (`selection`) und alles
  im Graph-Fenster (`graph`: Öffner, Erklärzeile, Kopfleisten-Knöpfe mit
  `text`, `label` für Screenreader und `title` als Tooltip, Canvas-
  Beschreibung, Fenstername, ✕-Knopf, Touch-Hinweis, `unlabeled` als Satz
  zu Punkten ohne Namen in der Info-Leiste). Liquid rendert sie in
  `cv/skills.html` und `cv/skill-graph.html`, die Skripte lesen sie aus dem
  JSON-Tag (`SkillGraphData.texts`). Im Skript stehen nur die Trennzeichen
  „ – “ und „ · “ und die Symbole (−, +, ✕). Ein `label` beginnt mit dem
  sichtbaren Text (WCAG 2.5.3).
- Optionale Zukunftsfelder (`period`, `url`, `type`) sind vorgesehen,
  `skills.html` reicht sie erst weiter, wenn sie dort beim Aufbau von
  `project_json` ergänzt sind. Unbekannte Felder ignoriert das JS defensiv. Schema-Änderungen, die alte
  Leser brechen würden, erhöhen `version` (die Leser prüfen `version: 1`).

## Architektur & Erweiterung

**Lose Kopplung über ein Event:** Beide Ansichten kommunizieren ausschließlich
über `auflinie:skill-select` (`detail: {skill: id|null, source: 'chips'|'graph'}`).
Jede Ansicht dispatcht mit eigenem `source` und übernimmt fremde Events ohne
Re-Dispatch (source-Guard). Eine dritte Ansicht (z. B. Timeline-Filter in der
Berufserfahrung) braucht nur diesen Vertrag zu implementieren.

**Physik und Rendering sind getrennt:** `skill-graph-sim.js` kennt weder DOM
noch Canvas — sie nimmt `{nodes, edges, width, height}` und bewegt Positionen
(`tick()`, `runToEnd()`, `resize()`). `skill-graph.js` macht nur UI. Dadurch:

- **Worker-Offload:** Die Engine ist ohne Änderung per `importScripts` in
  einen Web Worker verschiebbar (Export über `self`); das Request-ID-Muster
  dafür liegt in `fractal-renderer.js` als Vorbild bereit. Bei ~20 Knoten
  unnötig — relevant erst mit Projekt-Knoten oder Dauersimulation.
- **Neue Knotentypen** (z. B. Projekt-Knoten für einen bipartiten Graphen):
  Daten in `build()` erweitern und im Renderer eine zweite Knotenform
  zeichnen — die Engine bleibt unverändert.
- **Tuning:** Alle Physik-Parameter liegen in `DEFAULTS` der Engine und sind
  per `options` überschreibbar (Repulsion, Federlänge/-konstante, Gravitation,
  velocityDecay, alphaDecay).

**Ansicht (seit Oktober 2026):** Bildschirm = Layout × `scale` + `pan`. Render,
Hit-Test, Rand-Pfeile und Knoten-Ziehen rechnen über dieselben Helfer
(`toScreen`/`toLayout`). Zoom skaliert nur die Abstände, Knoten und Schrift
bleiben gleich groß (`GLYPH` 0.92, Schrift ≈ 10 px), damit Hineinzoomen
Platz für Namen schafft. Kern-Knoten (Radius 7, hellere Kontur) heben sich
von der Breite (4,5, gedämpft) ab, die Trefferfläche ist für alle gleich.
Startansicht (`homeView`): alles eingepasst, nie unter 0.6 (darunter
überlappen Labels systematisch), nie über 1.0. Beim Öffnen und bei Reset
rechnet `settle()` das Layout synchron zu Ende (`runToEnd`), danach steht
die Startansicht. „Übersicht“ (Taste `0`) führt genau dorthin und ist dort
`aria-disabled`. Die Kamera folgt dem Layout nie, eine Auswahl wird nur
hervorgehoben, wo sie liegt (Owner-Korrektur 2. 10. 2026). Eine
Größenänderung der Fläche lässt die Knotenlagen unverändert (bis
6. 10. 2026 wurden sie in x und y getrennt skaliert), nur eine Ansicht, die
gerade die Startansicht war, passt sich neu ein. Die Engine-Option
`aspect` lässt die Wolke das Format der Fläche annehmen (breit am Desktop,
hoch am Telefon). Ein neues Format nach Drehen oder Fenster-Änderung gilt
erst ab dem nächsten Reset, damit ein kleiner Knoten-Drag nicht die ganze
Wolke umordnet.

**Beschriftung (seit 6. 10. 2026):** Labels stehen immer über dem Knoten.
Ob eines steht, hängt nur vom Maßstab ab (konsistente Beschriftung nach
Been, Daiches und Yap 2006): `computeLabelScales` gibt nach jedem fertigen
Layout jedem Label einen Mindestmaßstab, ab dem es bis zum größten Zoom frei
steht, mit Luft zu fremden Knoten und zu Labels mit höherem Vorrang (Kern vor
Breite, dann Zahl der Verbindungen). Je Paar überlappen zwei Rechtecke in
genau einer Spanne von Maßstäben, darum wird exakt gerechnet statt über ein
Raster. Folgen: Verschieben ändert die Beschriftung nie (am Rand sind Labels
angeschnitten), Hineinzoomen nimmt keinen Namen weg, Öffnen und „Übersicht“
zeigen dieselben Namen. Mit Auswahl stehen Skill und Nachbarn immer (am
Rand ins Bild geschoben), die übrigen nur ohne Berührung mit diesen. Neu
sichtbare Labels blenden in 200 ms ein (nicht beim Öffnen, nicht bei
Reduced Motion). Maus und Stift zeigen beim Überfahren eines Punkts ohne
Namen eine ruhige Vorschau (kein Magenta, ändert keine Auswahl, Esc und
Verlassen nehmen sie weg). Die Info-Leiste nennt im Ruhezustand unter dem
Hinweis `texts.graph.unlabeled`. `data-zoom`, `data-outside`,
`data-sel-x`/`data-sel-y` (Lage des gewählten Knotens), `data-labels` (IDs
der beschrifteten Knoten) und `data-preview` am Canvas machen die Ansicht
für Tests lesbar.

**Bewusste Später-Liste** (Stand Juli 2026, Zoom + Pan + Drag erledigt):
Projekt-Knoten und
Detailpanel, Deep-Links (`#skill=python`), Persistenz des
Toggles, Kantengewichts-Legende, Anker-Links in die Berufserfahrung.

## Verhaltens-Garantien (bei Änderungen erhalten!)

- **A11y:** Chips sind echte `<button>`s mit `aria-pressed`; Kontextzeilen
  sind `aria-live="polite"`; das Canvas ist `role="img"` mit
  `tabindex="-1"` — nicht in der Tab-Reihenfolge, aber ein Klick hält den
  Fokus im Dialog (Tasten `+`/`−`/`0` wirken weiter). Tastatur läuft über
  die Chip-Liste und die beschrifteten Kopfleisten-Knöpfe, die an den
  Zoom-Grenzen (und „Übersicht“ in der Startansicht) `aria-disabled`
  tragen. Keine Information nur per Hover: Die Vorschau beim Überfahren
  ergänzt Antippen, Zoom und Chip-Liste.
- **`prefers-reduced-motion`:** Beim Öffnen und bei Reset wird das Layout
  ohnehin synchron vorgerechnet. Unter Reduced Motion setzt zusätzlich das
  Knoten-Ziehen den Knoten direkt, ohne Nachschwingen, und neue Labels
  erscheinen ohne Blende; ein `change`-Listener schaltet live um.
- **Animation endet von selbst** (< 5 s Auskühlung, WCAG 2.2.2) und stoppt
  bei `visibilitychange` und beim Zuklappen des Panels.
- **Farbdisziplin:** Magenta (`$hover-color`) markiert ausschließlich
  Interaktionszustände — Fokusringe UND die aktive Auswahl (Chip wie
  Graph-Knoten). Alles Inhaltliche (Verwandtschaft, Kanten)
  bleibt Cyan.
- **Determinismus:** Kreis-Startpositionen statt `Math.random()` — das Layout
  ist über Reloads reproduzierbar.
- **Kein Layout-Shift:** Konsole und Info-Leiste haben eine feste Höhe mit internem Scrollen (Mixin `selection-console`).
- **Druck:** `@media print` blendet das Panel aus, die Chips bleiben.

## Verifikation nach Änderungen

1. `npm run lint:css` und Jekyll-Build (`--strict_front_matter`).
2. Browser-Konsole auf /cv/: keine `skill-chips:`/`skill-graph:`-Warnungen.
3. Manuell: Chip-Klick ↔ Graph-Klick synchron; zweiter Klick/Escape löst;
   Tab + Enter mit Magenta-Fokusring; Mobil: Tap und Scrollen über dem Canvas;
   DevTools „Emulate prefers-reduced-motion" → Standbild ohne rAF-Dauerlast
   (Performance-Tab); Print-Vorschau ohne Panel.
4. Flags testweise auf `false` → Seite rendert wie die statische Fassung.
