# Interaktives Skill-Feature (CV-Seite)

Entwickler-Doku für Pflege und Weiterentwicklung. Das Verzeichnis `docs/` ist
in `_config.yml` vom Build ausgeschlossen — diese Datei landet nie auf der Site.

## Was das Feature macht

Die Skill-Chips auf `/cv/` sind erkundbar:

- **Stufe 1 — Klick-Hervorhebung (produktiv):** Klick auf einen Chip hebt alle
  Skills hervor, die über gemeinsame Projekte verbunden sind (Rest dimmt), und
  zeigt die Projekte in einer Kontextzeile. Zweiter Klick oder Escape löst.
- **Stufe 2 — Graph-Panel (experimentell, „In Entwicklung"):** Zuschaltbare
  Canvas-Ansicht mit Kräfte-Graph — Knoten = Skills, Kanten = gemeinsame
  Projekte (Kantendeckkraft = Gewicht). Klick auf Knoten wählt aus; die
  Auswahl ist mit der Chip-Liste synchronisiert.

Die statische Chip-Liste bleibt immer die kanonische, vollständige
Darstellung (auch für Screenreader und Druck); alles Interaktive ist
Progressive Enhancement.

## Ein-/Ausschalten

Front Matter von `_pages/cv.md`:

```yaml
skill_graph:
  enabled: true   # Stufe 1: klickbare Chips
  stage2: true    # Stufe 2: Graph-Panel (setzt kein enabled voraus)
```

- `stage2: false` entfernt Panel und Skripte serverseitig komplett.
- `enabled: false` (und stage2 false) ⇒ die Seite rendert byte-identisch zur
  rein statischen Fassung — keine Buttons, kein JSON, kein JS.

## Beteiligte Dateien

| Datei | Rolle |
|---|---|
| `_data/skill_graph.yml` | **Datenquelle** (Schema v1): Projekte → Skills |
| `_includes/cv/skills.html` | Chips (+ Buttons, Kontextzeile, JSON-Tag, Panel-Include) |
| `_includes/cv/skill-graph.html` | Panel-Markup (Toggle, WIP-Badge, Canvas) |
| `assets/js/skill-chips.js` | Stufe 1: Klick-Hervorhebung der Chips |
| `assets/js/skill-graph-sim.js` | **DOM-freie** Force-Layout-Engine (reine Physik) |
| `assets/js/skill-graph.js` | Stufe 2: Panel/Canvas/Interaktion (nur UI) |
| `assets/_sass/components/_cv.scss` | Chip-Zustände (`has-selection`, `is-selected`, `is-related`) |
| `assets/_sass/components/_skill-graph.scss` | Panel-Styles + generisches `.wip-badge` |
| `_includes/scripts.html` | Flag-Gates für die drei Skripte |
| `service-worker.js` | Precache-Einträge der drei Skripte |

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

**Bewusste Später-Liste** (Stand Juli 2026): Zoom + Pan (erst mit
Projekt-Knoten sinnvoll; Muster aus `fractal-panel.js` übernehmen —
Pinch/Rad-Zoom/Reset; Touch-Konflikt mit `touch-action: pan-y` beachten),
Drag + Reheat, Projekt-Knoten und
Detailpanel, Canvas-Tooltips, Deep-Links (`#skill=python`), Persistenz des
Toggles, Kantengewichts-Legende, Anker-Links in die Berufserfahrung.

## Verhaltens-Garantien (bei Änderungen erhalten!)

- **A11y:** Chips sind echte `<button>`s mit `aria-pressed`; Kontextzeilen
  sind `aria-live="polite"`; das Canvas ist `role="img"` und nicht
  fokussierbar — Tastatur läuft über die Chip-Liste. Keine Information nur
  per Hover.
- **`prefers-reduced-motion`:** Die Simulation wird synchron vorgerechnet
  (`runToEnd()`) und als Standbild gezeichnet; ein `change`-Listener schaltet
  live um.
- **Animation endet von selbst** (< 5 s Auskühlung, WCAG 2.2.2) und stoppt
  bei `visibilitychange` und beim Zuklappen des Panels.
- **Farbdisziplin:** Magenta (`$hover-color`) markiert ausschließlich
  Interaktionszustände — Fokusringe UND die aktive Auswahl (Chip wie
  Graph-Knoten). Alles Inhaltliche (Verwandtschaft, Kanten)
  bleibt Cyan.
- **Determinismus:** Kreis-Startpositionen statt `Math.random()` — das Layout
  ist über Reloads reproduzierbar.
- **Kein Layout-Shift:** Kontextzeilen reservieren Höhe (`min-height`).
- **Druck:** `@media print` blendet das Panel aus, die Chips bleiben.

## Verifikation nach Änderungen

1. `npm run lint:css` und Jekyll-Build (`--strict_front_matter`).
2. Browser-Konsole auf /cv/: keine `skill-chips:`/`skill-graph:`-Warnungen.
3. Manuell: Chip-Klick ↔ Graph-Klick synchron; zweiter Klick/Escape löst;
   Tab + Enter mit Magenta-Fokusring; Mobil: Tap und Scrollen über dem Canvas;
   DevTools „Emulate prefers-reduced-motion" → Standbild ohne rAF-Dauerlast
   (Performance-Tab); Print-Vorschau ohne Panel.
4. Flags testweise auf `false` → Seite rendert wie die statische Fassung.
