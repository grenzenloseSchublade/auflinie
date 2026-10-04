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
  Ansicht: Einpassen beim Öffnen (auch mit Auswahl, kein Zentrieren), Zoom
  per Pinch, Mausrad, Knöpfe („−“, „+“, „Einpassen“) und Tasten
  `+`/`−`/`0`, Pan per Ziehen. Der Graph bewegt sich nie von selbst.

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
| `_data/skill_graph.yml` | **Datenquelle** (Schema v1): Projekte → Skills |
| `_includes/cv/skills.html` | Chips (+ Buttons, Kontextzeile, JSON-Tag, Graph-Include oben vor den Gruppen) |
| `_includes/cv/skill-graph.html` | Graph-Markup (Öffner mit Netz-Symbol und Erklärzeile, Kopfleiste, Info-Leiste, Canvas) |
| `assets/js/skill-graph-data.js` | Gemeinsame Helfer: Daten lesen, Skill→Projekte, `renderSelection` (Konsole und Info-Leiste) |
| `assets/js/skill-chips.js` | Klick-Hervorhebung der Chips |
| `assets/js/skill-graph-sim.js` | **DOM-freie** Force-Layout-Engine (reine Physik) |
| `assets/js/skill-graph.js` | Graph: Panel/Canvas/Interaktion, Ansicht (Pan + Zoom, Einpassen), Info-Leiste (nur UI) |
| `assets/js/skill-graph-sheet.js` | Präsentation als modales Sheet (Scrim, Scroll-Sperre, inert, Fokus, Touch-Hinweis) |
| `assets/_sass/components/_cv.scss` | Chip-Zustände (`has-selection`, `is-selected`, `is-related`) |
| `assets/_sass/components/_skill-graph.scss` | Panel- und Sheet-Styles |
| `assets/_sass/abstracts/_mixins.scss` | `selection-console`: gemeinsame Optik von Konsole und Info-Leiste |
| `_includes/scripts.html` | Flag-Gates für die Skripte |
| `service-worker.js` | Precache-Einträge der Skripte |

## Daten pflegen (`_data/skill_graph.yml`)

Schema v1 — Pflichtfelder pro Projekt: `id` (kebab-case, stabil, nie
umbenennen), `label` (Anzeigename für die Kontextzeile), `skills` (Liste von
Skill-IDs).

- **Skill-IDs = `slugify` der Chip-Namen** aus `cv_content.yml` →
  `skill_groups`: `"Python"` → `python`, `"CI / CD"` → `ci-cd`,
  `"NumPy / Scikit-learn"` → `numpy-scikit-learn`.
- **Neues Projekt:** Block anfügen, `id` vergeben, Skills listen — fertig.
  Kanten müssen nicht gepflegt werden: Skill↔Skill-Verbindungen (und ihre
  Gewichte) leitet das JS implizit aus gemeinsamen Projekten ab.
- **Neuer Skill-Chip:** in `cv_content.yml` anlegen und in mindestens einem
  Projekt referenzieren, sonst meldet der Klick „noch keine Projektzuordnung".
- **Konsistenz:** Das JS validiert beim Laden (Version, Pflichtfelder,
  Slug-Abgleich gegen die DOM-Chips) und schreibt `console.warn` bei
  Abweichungen — die Browser-Konsole auf /cv/ ist der schnellste Check.
- Optionale Zukunftsfelder (`period`, `url`, `type`) sind vorgesehen;
  unbekannte Felder ignoriert das JS defensiv. Schema-Änderungen, die alte
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
(`toScreen`/`toLayout`). Zoom skaliert Abstände voll, Knoten und Schrift
gedämpft (`glyphScale`, 0.92 bis 1.3, Schrift also mindestens ≈ 10 px).
Einpassen nie unter 0.6 (darunter überlappen Labels systematisch), nie über
1.0. Beim Öffnen und bei Reset rechnet `settle()` das Layout synchron zu
Ende (`runToEnd`), danach wird EINMAL eingepasst. Die Kamera folgt dem
Layout nie, eine Auswahl wird nur hervorgehoben, wo sie liegt
(Owner-Korrektur 2. 10. 2026). Nur eine Größenänderung der Fläche passt neu
ein, solange niemand Zoom oder Lage verändert hat. Die Engine-Option
`aspect` lässt die Wolke das Format der Fläche annehmen (breit am Desktop,
hoch am Telefon). Ein neues Format nach Drehen oder Fenster-Änderung gilt
erst ab dem nächsten Reset, damit ein kleiner Knoten-Drag nicht die ganze
Wolke umordnet. Labels stehen über dem Knoten, sonst darunter, sonst
seitlich (nur, wenn sie dort ganz in die Fläche passen). `data-zoom`,
`data-outside` und `data-sel-x`/`data-sel-y` (Lage des gewählten Knotens)
am Canvas machen die Ansicht für Tests lesbar.

**Bewusste Später-Liste** (Stand Juli 2026, Zoom + Pan + Drag erledigt):
Projekt-Knoten und
Detailpanel, Canvas-Tooltips, Deep-Links (`#skill=python`), Persistenz des
Toggles, Kantengewichts-Legende, Anker-Links in die Berufserfahrung.

## Verhaltens-Garantien (bei Änderungen erhalten!)

- **A11y:** Chips sind echte `<button>`s mit `aria-pressed`; Kontextzeilen
  sind `aria-live="polite"`; das Canvas ist `role="img"` mit
  `tabindex="-1"` — nicht in der Tab-Reihenfolge, aber ein Klick hält den
  Fokus im Dialog (Tasten `+`/`−`/`0` wirken weiter). Tastatur läuft über
  die Chip-Liste und die beschrifteten Kopfleisten-Knöpfe, die an den
  Zoom-Grenzen `aria-disabled` tragen. Keine Information nur per Hover.
- **`prefers-reduced-motion`:** Beim Öffnen und bei Reset wird das Layout
  ohnehin synchron vorgerechnet. Unter Reduced Motion setzt zusätzlich das
  Knoten-Ziehen den Knoten direkt, ohne Nachschwingen; ein `change`-Listener
  schaltet live um.
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
