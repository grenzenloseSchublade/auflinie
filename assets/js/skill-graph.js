/**
 * skill-graph.js — Skill-Graph, Canvas-Ansicht (Teil des Skill-Features)
 *
 * Zuständigkeit: nur UI. Toggle, Canvas-Rendering, Ansicht (Pan + Zoom),
 * Klick-Interaktion, Info-Leiste und Synchronisation mit der Chip-Liste. Die
 * Physik liegt vollständig in der DOM-freien Engine skill-graph-sim.js
 * (window.SkillGraphSim) — Rendering und Layout sind bewusst getrennt, damit
 * sich das Feature weiterentwickeln lässt (Worker-Offload, Projekt-Knoten),
 * ohne beides anzufassen. Die Präsentation als modales Sheet übernimmt
 * skill-graph-sheet.js; ohne das Modul klappt das Panel inline auf.
 *
 * Daten: dasselbe JSON-Tag [data-skill-graph-data] wie die Chip-Hervorhebung
 * (_data/skill_graph.yml, Schema v1). Knoten = Skills aus den DOM-Chips
 * (Reihenfolge = Gruppenreihenfolge). Zwei Fassungen, Schalter graph_mode in
 * den Daten (Stufe 2, Prototyp 6. 10. 2026):
 * - „skills“ (Stufe 1): Kanten Skill↔Skill über gemeinsame Projekte.
 * - „projekte“: Projekte sind eigene Knoten (ID mit Präfix „projekt:“,
 *   ruhiges abgerundetes Quadrat in Beige, Namen mit Vorrang), Kanten
 *   Skill↔Projekt. Der Graph zeigt so ohne Antippen, welche Fähigkeiten in
 *   welchen Projekten zusammenkommen, und braucht viel weniger Kanten.
 *   Antippen eines Projekts hebt seine Skills hervor, Antippen eines Skills
 *   seine Projekte (dazu ruhiger die Skills, die dort mit ihm zusammenkamen).
 * Die Info-Leiste schreibt SkillGraphData.renderSelection — derselbe Renderer
 * wie die Konsole über den Chips (skill-chips.js). Texte: Beschriftungen und
 * Ruhezustand der Info-Leiste (Hinweis, Satz zu Punkten ohne Namen) rendert
 * Liquid aus texts in _data/skill_graph.yml, die Auswahl-Anzeige kommt aus
 * texts.selection (ARCH-4).
 *
 * Ansicht: Bildschirm = Layout × scale + pan. Render, Hit-Test, Rand-Pfeile
 * und Knoten-Ziehen rechnen über dieselben Helfer (toScreen/toLayout). Zoom
 * skaliert nur die Abstände, Knoten und Schrift bleiben gleich groß (GLYPH):
 * Hineinzoomen schafft so echten Platz für Namen. Startansicht (homeView):
 * alle Knoten samt Labels eingepasst, nicht kleiner als FIT_MIN. Sie steht
 * beim Öffnen (auch mit Auswahl) und nach Reset, jeweils nachdem das Layout
 * synchron zu Ende gerechnet ist, und der Knopf „Übersicht“ (Taste 0) führt
 * genau dorthin zurück. Eine Auswahl wird nur hervorgehoben, wo sie liegt —
 * kein Zentrieren, keine Kamerafahrt, die Kamera folgt dem Layout nie von
 * selbst (Owner-Korrektur 2.10.2026: der Graph soll sich nicht von selbst
 * bewegen). Eine Größenänderung der Fläche lässt die Knotenlagen
 * unverändert und passt nur die Kamera neu ein, wenn die Ansicht gerade die
 * Startansicht war (6. 10. 2026).
 *
 * Labels (6. 10. 2026, nach Been, Daiches und Yap 2006): Ob ein Name steht,
 * hängt nur vom Maßstab ab. Nach jedem fertigen Layout bekommt jedes Label
 * einen Mindestmaßstab (computeLabelScales, Vorrang Kern vor Breite, dann
 * Zahl der Verbindungen), ab dem es frei steht. Verschieben ändert die
 * Beschriftung nie, Hineinzoomen nimmt keinen Namen weg, Öffnen und
 * „Übersicht“ zeigen dieselben Namen. Am Rand dürfen Labels angeschnitten
 * sein. Neu sichtbare Labels blenden kurz ein. Punkte ohne Namen zeigen ihn
 * bei Auswahl (Antippen), beim Hineinzoomen und mit Maus oder Stift als
 * ruhige Vorschau beim Überfahren. Kern-Knoten sind etwas größer und heller
 * als die Breite.
 *
 * Verhalten: Lazy-Init beim ersten Öffnen; die rAF-Loop läuft nur nach dem
 * Ziehen eines Knotens (Nachschwingen, < 5 s) und für die Dauer einer
 * Label-Blende (200 ms) und stoppt bei visibilitychange/Zuklappen;
 * prefers-reduced-motion setzt den gezogenen Knoten direkt ohne Nachschwingen
 * und zeigt Labels ohne Blende (Helfer aus site-utils.js). Auswahl läuft
 * über den Event-Vertrag `auflinie:skill-select` (source 'graph'). Ein
 * gewähltes Projekt geht als { skill: null, project: <id> } hinaus: Die
 * Chip-Liste kennt keine Projekte und kehrt in den Ruhezustand zurück (kein
 * Chip ist „der gewählte“, ein halbes Hervorheben ohne Magenta-Anker läse
 * sich wie ein Fehler), das Sheet hält damit die Esc-Staffelung.
 * Farben: Cyan für Inhalt (Kanten, Verwandtschaft, Vorschau), Beige der
 * Konsolen-Titel ($console-heading) für Projekte, Magenta nur für die aktive
 * Auswahl (Interaktionszustand, Design-Regel).
 */
(function () {
  'use strict';

  // Systemeinstellung „Bewegung reduzieren“ über site-utils.js (BEW-1a).
  // Ohne Helfer gilt sie als gesetzt: Die Simulation springt in die Ruhelage.
  function reducedMotion() {
    return !window.AuflinieUtils || window.AuflinieUtils.prefersReducedMotion();
  }

  const SOURCE = 'graph';
  const CYAN = '5, 217, 232';
  const MAGENTA = '255, 0, 255'; // nur für die aktive Auswahl (Interaktionszustand)
  // Projekt-Knoten (graph_mode: projekte): warmes Beige der Konsolen-Titel
  // ($console-heading in _colors.scss), keine neue Farbe
  const BEIGE = '234, 207, 180';
  const PROJECT_PREFIX = 'projekt:';
  // Halbe Kantenlänge des Projekt-Quadrats (Bildschirm-px vor GLYPH), Ecken
  // abgerundet: klar andere Form als die Kreise der Skills, ähnlich groß
  // wie ein Kern-Knoten
  const PROJECT_HALF = 6.5;
  const PROJECT_CORNER = 2.5;
  // Kern-Skills (core) etwas größer mit hellerer Kontur, die Breite (breadth)
  // kleiner und gedämpfter (Owner, 6. 10. 2026): Der Vorrang der Beschriftung
  // wird so sichtbar, ohne neue Farbe
  const NODE_RADIUS_CORE = 7;
  const NODE_RADIUS_BREADTH = 4.5;
  const HIT_RADIUS = 16;           // Bildschirm-px, für alle Knoten gleich (Touch-Ziel)
  const LABEL_PX = 11;
  const LABEL_GAP = 5;             // Abstand Kreis → Label-Grundlinie
  // Luft zwischen zwei Labels (Bildschirm-px), nur für die Kollisionsprüfung:
  // Labels gelten schon als belegt, wenn sie sich bis auf diesen Abstand nähern
  const LABEL_AIR_X = 8;
  const LABEL_AIR_Y = 4;
  const LABEL_FAMILY = '"SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace';

  // Zoom-Grenzen der Ansicht. 0.4 zeigt auch einen gewachsenen Graphen als
  // Ganzes (Überblick, Labels überlappen dann), 2.5 entzerrt den dichten Kern
  // auf dem Telefon.
  const ZOOM_MIN = 0.4;
  const ZOOM_MAX = 2.5;
  const ZOOM_STEP = 1.25;          // Knöpfe und Tastatur (+/−)
  const WHEEL_ZOOM = 0.0016;       // wie das Fraktal-Panel (exp(−deltaY · k))
  // Einpassen: nie kleiner als 0.6. Darunter wird die Feder-Ruhelänge
  // (150 Layout-px, skill-graph-sim.js) kürzer als 90 px, also kaum länger als
  // ein typisches Label (6 bis 10 Zeichen ≈ 55 bis 90 px bei gedämpfter
  // Schrift) — benachbarte Labels überlappen dann systematisch, das Bild
  // wird zum Knäuel. Lieber zentriert mit Rand-Pfeilen als unlesbar.
  // Und nie größer als 1.0 — ein kleiner Graph wird nicht aufgeblasen.
  const FIT_MIN = 0.6;
  const FIT_MAX = 1;
  const FIT_PAD = 20;              // Rand in Bildschirm-px (Platz für die Rand-Pfeile)
  // Knoten und Schrift haben bei jedem Zoom dieselbe Bildschirmgröße:
  // 0.92 × 11 px ≈ 10 px (Telefon lesbar, 0.85 ≈ 9,4 px war zu klein). Bis
  // 6. 10. 2026 wuchs beides oberhalb von 0.92 mit, dann schuf Hineinzoomen
  // bis etwa 1.3 keinen neuen Platz für Labels.
  const GLYPH = 0.92;
  // Weiches Einblenden neu sichtbarer Labels (nur Deckkraft, ms)
  const LABEL_FADE_MS = 200;

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  // Format der Fläche für die Gravitation der Engine. Labels laufen
  // waagerecht und brauchen am Rand zusätzlich Breite (ein typisches Label
  // ≈ 10 Zeichen ≈ 66 px plus Luft), darum zählt für die Knoten nur die
  // Breite abzüglich LABEL_ALLOWANCE. Begrenzt, damit sehr schmale oder
  // flache Flächen die Wolke nicht zu einer Linie quetschen.
  const LABEL_ALLOWANCE = 80;
  function layoutAspect(w, h) { return clamp(Math.max(w - LABEL_ALLOWANCE, w / 2) / h, 0.4, 2.5); }
  function labelFont(g) { return (LABEL_PX * g).toFixed(2) + 'px ' + LABEL_FAMILY; }
  // Bildschirm-Radius eines Knotens (Projekt: halbe Kante des Quadrats)
  function nodeRadius(node) {
    if (node.project) { return PROJECT_HALF * GLYPH; }
    return (node.core ? NODE_RADIUS_CORE : NODE_RADIUS_BREADTH) * GLYPH;
  }

  // Physik je Fassung (skill-graph-sim.js, DEFAULTS gelten für „skills“).
  // Mit Projekt-Knoten hängt jeder Skill nur an seinen Projekten: kürzere,
  // straffere Federn halten die Skills um ihr Projekt, schwächere Abstoßung
  // und Gravitation halten die Wolke am Handy kompakt. Projekte stoßen sich
  // sechsfach ab (charge), so liegen sie als Anker auseinander und ihre
  // Namen haben Platz. Abgestimmt am 6. 10. 2026 mit einem Raster über
  // Federlänge, Abstoßung, Federkonstante, charge und Gravitation, bewertet
  // nach beschrifteten Projekten und Skills beim Öffnen, Kantenkreuzungen
  // und Überstand bei 390 × 844, 360 × 780 und 1280 × 900 (Ergebnis:
  // 8 bis 9 Projektnamen, rund 10 statt rund 50 Kreuzungen).
  const SIM_OPTIONS = {
    skills: {},
    projekte: { springLength: 90, repulsion: 10000, springK: 0.2, gravity: 0.03 }
  };
  const PROJECT_CHARGE = 6;

  // Maßstäbe s, bei denen sich zwei Rechtecke (mit Luft) überlappen. Beide
  // hängen an ihrem Knoten, der Abstand ihrer Mitten auf dem Bildschirm ist
  // D · s + B (D Abstand der Knoten im Layout, B fester Versatz der Rechtecke
  // in px), die halben Summen ihrer Maße samt Luft sind H. Je Achse ist das
  // eine offene Spanne in s, die Überlappung ihre Schnittmenge.
  // Rückgabe [lo, hi] oder null.
  function overlapSpan(dx, bx, hx, dy, by, hy) {
    function axis(d, b, h) {
      if (Math.abs(d) < 1e-9) { return Math.abs(b) < h ? [-Infinity, Infinity] : null; }
      const a = (-h - b) / d, c = (h - b) / d;
      return a < c ? [a, c] : [c, a];
    }
    const x = axis(dx, bx, hx);
    const y = x && axis(dy, by, hy);
    if (!y) { return null; }
    const lo = Math.max(x[0], y[0]), hi = Math.min(x[1], y[1]);
    return lo < hi ? [lo, hi] : null;
  }

  function SkillGraph(root) {
    this.root = root;
    this.toggle = root.querySelector('[data-role="graph-toggle"]');
    this.panel = root.querySelector('[data-role="graph-panel"]');
    this.canvas = root.querySelector('[data-role="canvas"]');
    this.wrap = root.querySelector('[data-role="canvas-wrap"]');
    this.contextLine = root.querySelector('[data-role="graph-context"]');
    this.resetBtn = root.querySelector('[data-role="graph-reset"]');
    this.zoomInBtn = root.querySelector('[data-role="graph-zoom-in"]');
    this.zoomOutBtn = root.querySelector('[data-role="graph-zoom-out"]');
    this.fitBtn = root.querySelector('[data-role="graph-fit"]');
    if (!this.toggle || !this.panel || !this.canvas || !this.wrap) { return; }

    this.initialized = false;
    this.rafId = null;
    this.selected = null;      // hervorgehobener Knoten (nur Skills mit Knoten)
    this.current = null;       // zuletzt gewählter Skill, auch ohne Knoten (Info-Leiste)
    // Ruhezustand der Info-Leiste (Hinweis und Satz zu Punkten ohne Namen,
    // Markup aus Liquid), zum Zurückstellen nach einer Auswahl
    this.defaultInfo = this.contextLine ? Array.prototype.map.call(this.contextLine.childNodes,
      function (n) { return n.cloneNode(true); }) : [];
    this.dragId = null;
    this.dragMoved = false;
    this.pointerStart = null;
    // Ansicht: Bildschirm = Layout × scale + pan
    this.scale = 1;
    this.panX = 0;
    this.panY = 0;
    this.openRaf = null;
    this.pendingAspect = null;
    this.pendingSize = null;
    this.panning = false;
    this.gesture = null;
    this.pointers = {};
    this.labelRects = [];
    // Ab welchem Maßstab steht das Label eines Knotens (Index wie nodes)?
    // Einmal je fertigem Layout berechnet (computeLabelScales).
    this.labelMin = null;
    this.labelShown = new Set();   // im letzten Bild beschriftet (Blende)
    this.fadeStart = new Map();    // id → Startzeit der Einblendung
    this.fadeRaf = null;
    this.instantLabels = true;     // nächstes Bild ohne Blende (Öffnen, Reset)
    this.hoverId = null;           // Vorschau beim Überfahren (Maus, Stift)
    this.hoverRect = null;
    this.canHover = !!(window.matchMedia && window.matchMedia('(hover: hover)').matches);

    this.toggle.addEventListener('click', this.onToggle.bind(this));
    document.addEventListener('auflinie:skill-select', this.onExternalSelect.bind(this));
    document.addEventListener('visibilitychange', this.onVisibility.bind(this));
    document.addEventListener('keydown', this.onKeydown.bind(this));
  }

  SkillGraph.prototype.onToggle = function () {
    const open = this.panel.hidden;
    this.panel.hidden = !open;
    this.toggle.setAttribute('aria-expanded', String(open));
    if (open) {
      // Erst im nächsten Frame bauen/sizen: dann hat der Präsentations-Wrapper
      // body.graph-open gesetzt (Microtask VOR rAF) und der Wrap hat seine
      // ECHTEN (Sheet-)Maße. Sonst würde bei Inline-Maßen gesized und der Canvas
      // später gestreckt -> Klick-Koordinaten passen nicht (Hit-Test daneben,
      // v.a. beim Wieder-Öffnen). syncLayout koppelt Canvas an die aktuelle
      // Größe = einzige Wahrheit fürs Koordinatensystem.
      const self = this;
      if (this.openRaf !== null) { cancelAnimationFrame(this.openRaf); }
      this.openRaf = requestAnimationFrame(function () {
        self.openRaf = null;
        if (self.panel.hidden) { return; }
        if (!self.initialized) { self.build(); }
        if (!self.sim) { return; }
        self.syncLayout();
        // Startansicht bei JEDEM Öffnen, mit und ohne Auswahl: Layout zu Ende
        // rechnen, einmal alles einpassen. Die Auswahl wird nur hervorgehoben.
        // Das Startbild steht sofort komplett (keine Blende).
        self.settle();
        self.instantLabels = true;
        self.fit();
      });
    } else {
      if (this.openRaf !== null) { cancelAnimationFrame(this.openRaf); this.openRaf = null; }
      this.stopLoop();
      // Eine offene Vorschau endet mit dem Fenster (auch per Esc)
      this.hoverId = null;
      this.hoverRect = null;
      if (this.initialized) { this.publishView(); }
    }
  };

  // Canvas-Bitmap IMMER an die aktuelle Wrap-Größe koppeln. Render und
  // Hit-Test nutzen dieselben node.x/scale/pan -> bleiben deckungsgleich,
  // egal ob Erst-Öffnen, Wieder-Öffnen oder Viewport-Änderung.
  // Die Knotenlagen bleiben dabei unverändert (Owner, 6. 10. 2026): Bis dahin
  // skalierte eine Größenänderung (z. B. die Adressleiste am Handy) sie
  // getrennt in x und y, das Layout verzerrte sich und wanderte von selbst.
  // Jetzt bewegt sich nur die Kamera, und nur, wenn die Ansicht gerade die
  // Startansicht war: Sie wird für die neue Fläche neu eingepasst. Sonst
  // bleibt die Kamera stehen.
  SkillGraph.prototype.syncLayout = function () {
    const cw = this.wrap.clientWidth, ch = this.wrap.clientHeight;
    if (!cw || !ch) { return; }
    const wasHome = this.isHome();
    if (this.sim && (cw !== this.canvasW || ch !== this.canvasH)) {
      // Fläche und Format des Layouts erst beim nächsten Reset übernehmen:
      // sonst zöge schon ein kleiner Knoten-Drag (Aufheizen) die ganze Wolke
      // ins neue Format. Gleiches Format (nur Leiste ein/aus): nichts
      // vormerken, sonst stünde Reset ohne sichtbaren Grund wieder bereit.
      this.pendingSize = { w: cw * this.spread, h: ch * this.spread };
      const aspect = layoutAspect(cw, ch);
      this.pendingAspect = Math.abs(aspect - this.sim.opts.aspect) > 1e-3 ? aspect : null;
    }
    this.canvasW = cw;
    this.canvasH = ch;
    this.sizeCanvas();
    if (wasHome) { this.applyFit(); } else { this.clampPan(); }
  };

  SkillGraph.prototype.build = function () {
    const dataTag = document.querySelector('script[data-skill-graph-data]');
    const data = dataTag && window.SkillGraphData.parse(dataTag, 'skill-graph');
    if (!data) { return; }

    const self = this;
    // Fassung: Projekt-Knoten (projekte) oder nur Skills (skills, Standard)
    this.mode = data.graph_mode === 'projekte' ? 'projekte' : 'skills';

    // Nur verbundene Skills werden Knoten: erst die IDs sammeln, die in
    // mindestens einem Projekt vorkommen. Basis-Skills (foundations) und
    // projektlose Breite-Chips bleiben bewusst außen vor — sonst schweben
    // sie kantenlos herum und überfüllen die Fläche.
    const connected = new Set();
    data.projects.forEach(function (project) {
      // Derselbe Pflichtfeld-Filter wie in SkillGraphData.buildSkillProjects:
      // Projekte ohne id/label fallen dort heraus — ihre Skills dürfen deshalb
      // auch hier keine Knoten werden, sonst schweben sie kantenlos herum.
      if (project && project.id && project.label && Array.isArray(project.skills)) {
        project.skills.forEach(function (id) { connected.add(id); });
      }
    });

    // Knoten aus den DOM-Chips (deterministische Reihenfolge), gefiltert auf
    // verbundene. Alle Chip-Labels merken: die Info-Leiste zeigt auch Skills
    // ohne Knoten (Basis-Werkzeuge), genau wie die Konsole.
    const buttons = document.querySelectorAll('.cv-skill-chip__button[data-skill]');
    const indexById = new Map();
    this.chipLabels = new Map();
    this.nodes = [];
    Array.prototype.forEach.call(buttons, function (btn) {
      const id = btn.getAttribute('data-skill');
      if (!self.chipLabels.has(id)) { self.chipLabels.set(id, btn.textContent.trim()); }
      if (!connected.has(id) || indexById.has(id)) { return; }
      indexById.set(id, self.nodes.length);
      // Kern-Skill (core) oder ergänzende Breite (breadth) aus cv_content.yml:
      // Kern-Labels haben beim Platzmangel Vorrang (computeLabelScales)
      self.nodes.push({ id: id, label: btn.textContent.trim(), labelW: null,
        core: !btn.closest('.cv-skill-chip--breadth'), degree: 0 });
    });
    this.foundations = new Set(Array.isArray(data.foundations) ? data.foundations : []);
    this.selectionTexts = window.SkillGraphData.texts(data, 'skill-graph').selection;

    // Skill→Projekte-Map über den gemeinsamen Helfer (warnt bei fehlenden
    // Pflichtfeldern und unbekannten Skill-IDs)
    const built = window.SkillGraphData.buildSkillProjects(data.projects, {
      prefix: 'skill-graph',
      knownIds: new Set(indexById.keys())
    });
    this.skillProjects = built.map;
    this.edges = this.mode === 'projekte' ?
      this.projectEdges(built.projects, indexById) : skillEdges(built.projects, indexById);

    this.neighbors = new Map();
    this.edges.forEach(function (edge) {
      self.nodes[edge.source].degree++;
      self.nodes[edge.target].degree++;
      const s = self.nodes[edge.source].id;
      const t = self.nodes[edge.target].id;
      if (!self.neighbors.has(s)) { self.neighbors.set(s, new Set()); }
      if (!self.neighbors.has(t)) { self.neighbors.set(t, new Set()); }
      self.neighbors.get(s).add(t);
      self.neighbors.get(t).add(s);
    });

    // Größerer virtueller Layout-Raum: dieselbe Physik, aber mehr Platz, damit
    // sich die Knoten verteilen statt am Rand zu stauen. Der Canvas ist ein
    // Fenster (Pan + Zoom) in diese Fläche.
    const w = this.wrap.clientWidth || 600;
    const h = this.wrap.clientHeight || 380;
    this.canvasW = w;
    this.canvasH = h;
    this.spread = Math.max(1.4, Math.min(2.5, this.nodes.length / 6));
    const vw = w * this.spread;
    const vh = h * this.spread;
    this.seedLayout(vw, vh, false);
    // Wolke im Format der Fläche (breit am Desktop, hoch am Telefon), damit
    // Einpassen bei lesbarem Maßstab möglichst alles zeigt.
    this.sim = new window.SkillGraphSim(this.nodes, this.edges, vw, vh,
      Object.assign({ aspect: layoutAspect(w, h) }, SIM_OPTIONS[this.mode]));

    // Resize: Canvas und Kamera nachführen, Knotenlagen bleiben (syncLayout)
    this.resizeTimer = null;
    this.observer = new ResizeObserver(function () {
      clearTimeout(self.resizeTimer);
      self.resizeTimer = setTimeout(function () {
        if (self.panel.hidden) { return; }
        self.syncLayout();   // Canvas + Ansicht an aktuelle Größe koppeln
        self.render();
      }, 120);
    });
    this.observer.observe(this.wrap);

    this.canvas.addEventListener('pointerdown', this.onPointerDown.bind(this));
    this.canvas.addEventListener('pointermove', this.onPointerMove.bind(this));
    this.canvas.addEventListener('pointerup', this.onPointerUp.bind(this));
    this.canvas.addEventListener('pointercancel', this.onPointerUp.bind(this));
    this.canvas.addEventListener('pointerleave', this.setHover.bind(this, null));
    // touch-action wird beim Touch-KONTAKT ausgewertet — die Style-Umschaltung
    // im pointerdown desselben Fingers (onPointerDown) greift erst für SPÄTERE
    // Finger. Nicht-passiver touchstart-Handler entzieht Zwei-Finger-Gesten und
    // Knoten-Treffer dem Browser-Scroll sofort; Ein-Finger-Touch auf leerer
    // Fläche scrollt inline weiter (touch-action: pan-y bleibt wirksam).
    this.canvas.addEventListener('touchstart', this.onTouchStart.bind(this), { passive: false });
    // Mausrad im modalen Sheet: zoomt wie im Fraktal-Panel (OVL-2), waagerecht
    // (Trackpad, Shift+Rad) verschiebt. Inline ohne Sheet scrollt das Rad
    // weiter die Seite.
    this.canvas.addEventListener('wheel', this.onWheel.bind(this), { passive: false });
    if (this.resetBtn) {
      this.resetBtn.addEventListener('click', this.reset.bind(this));
    }
    if (this.zoomInBtn) {
      this.zoomInBtn.addEventListener('click', this.zoomBy.bind(this, ZOOM_STEP));
    }
    if (this.zoomOutBtn) {
      this.zoomOutBtn.addEventListener('click', this.zoomBy.bind(this, 1 / ZOOM_STEP));
    }
    if (this.fitBtn) {
      this.fitBtn.addEventListener('click', this.fit.bind(this));
    }
    if (window.AuflinieUtils) {
      window.AuflinieUtils.onReducedMotionChange(this.startOrStill.bind(this));
    }
    this.initialized = true;
    // Vor dem Öffnen gewählten Chip nachziehen (sonst öffnet der Graph ohne
    // Markierung, obwohl ein Skill aktiv ist).
    if (this.pendingExternal != null) { this.setSelection(this.pendingExternal); }
  };

  // Fassung „skills“ (Stufe 1): Skill-Paare mit gemeinsamen Projekten,
  // Gewicht = Zahl der gemeinsamen Projekte
  function skillEdges(projects, indexById) {
    const edgeMap = new Map();
    projects.forEach(function (entry) {
      const ids = entry.ids;
      for (let i = 0; i < ids.length; i++) {
        for (let j = i + 1; j < ids.length; j++) {
          const a = indexById.get(ids[i]);
          const b = indexById.get(ids[j]);
          const key = Math.min(a, b) + ':' + Math.max(a, b);
          edgeMap.set(key, (edgeMap.get(key) || 0) + 1);
        }
      }
    });
    return Array.from(edgeMap, function (entry) {
      const parts = entry[0].split(':');
      return { source: +parts[0], target: +parts[1], weight: entry[1] };
    });
  }

  // Fassung „projekte“: je Projekt ein Knoten hinter den Skills, eine Kante
  // zu jedem seiner Skills (Gewicht 1). Ein Projekt ohne bekannten Skill
  // bleibt draußen, sonst schwebte es kantenlos herum.
  SkillGraph.prototype.projectEdges = function (projects, indexById) {
    const self = this;
    const edges = [];
    this.projectSkills = new Map();   // Projekt-Knoten-ID → [Skill-Labels]
    projects.forEach(function (entry) {
      if (!entry.ids.length) { return; }
      const id = PROJECT_PREFIX + entry.project.id;
      if (indexById.has(id)) { return; }   // doppelte Projekt-ID: erste gilt
      const index = self.nodes.length;
      indexById.set(id, index);
      // Im Graphen steht der optionale Kurzname (short), die Info-Leiste
      // nennt den vollen Namen
      self.nodes.push({ id: id, label: entry.project.short || entry.project.label,
        fullLabel: entry.project.label, labelW: null, project: true,
        projectId: entry.project.id, core: true, degree: 0, charge: PROJECT_CHARGE });
      self.projectSkills.set(id, entry.ids.map(function (skillId) {
        return { label: self.chipLabels.get(skillId) || skillId };
      }));
      entry.ids.forEach(function (skillId) {
        edges.push({ source: indexById.get(skillId), target: index, weight: 1 });
      });
    });
    return edges;
  };

  SkillGraph.prototype.sizeCanvas = function () {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = this.wrap.clientWidth;
    const h = this.wrap.clientHeight;
    if (!w || !h) { return; }
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.ctx = this.canvas.getContext('2d');
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  SkillGraph.prototype.startOrStill = function () {
    if (!this.sim || this.panel.hidden) { return; }
    this.stopLoop();
    if (reducedMotion()) {
      this.settle();
      this.render();
    } else if (!this.sim.isSettled()) {
      this.loop();
    } else {
      this.render();
    }
  };

  // Layout synchron zu Ende rechnen (36 Knoten: wenige ms). Vor dem
  // Einpassen beim Öffnen und bei Reset: Die Kamera wird dann einmal auf das
  // Endlayout gesetzt und muss dem Auskühlen nicht folgen. Danach stehen die
  // Mindestmaßstäbe der Labels für dieses Layout fest.
  SkillGraph.prototype.settle = function () {
    this.stopLoop();
    this.sim.runToEnd();
    this.computeLabelScales();
  };

  // Deterministische Kreis-Startlage im virtuellen Layout-Raum (w×h).
  // clearPins löst zusätzlich Drag-Fixierungen und nullt Geschwindigkeiten.
  // Mit Projekt-Knoten: Projekte auf einem Kreis, jeder Skill in der Mitte
  // seiner Projekte, leicht versetzt. So beginnt das Layout schon entwirrt
  // und kühlt nicht in einem verdrehten Zustand aus.
  SkillGraph.prototype.seedLayout = function (w, h, clearPins) {
    const nodes = this.nodes;
    const count = nodes.length || 1;
    const radius = Math.min(w, h) * 0.36;
    const projects = nodes.filter(function (n) { return n.project; });
    const neighbors = this.neighbors;
    nodes.forEach(function (node, i) {
      if (clearPins) {
        node.fx = null;
        node.fy = null;
        node.vx = 0;
        node.vy = 0;
      }
      const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
      node.x = w / 2 + Math.cos(angle) * radius;
      node.y = h / 2 + Math.sin(angle) * radius;
    });
    if (!projects.length) { return; }
    // Projekte gleichmäßig auf dem Kreis, ähnliche nebeneinander (Kette nach
    // gemeinsamen Skills, viel weniger Kreuzungen als die Reihenfolge der
    // Daten), Skills danach (brauchen deren Lage)
    chainBySharedSkills(projects, neighbors).forEach(function (node, k) {
      const angle = (k / projects.length) * Math.PI * 2 - Math.PI / 2;
      node.x = w / 2 + Math.cos(angle) * radius;
      node.y = h / 2 + Math.sin(angle) * radius;
    });
    nodes.forEach(function (node, i) {
      if (node.project) { return; }
      const mine = projects.filter(function (p) {
        return neighbors.has(p.id) && neighbors.get(p.id).has(node.id);
      });
      if (!mine.length) { return; }
      let x = 0, y = 0;
      mine.forEach(function (p) { x += p.x; y += p.y; });
      const angle = (i / count) * Math.PI * 2;
      node.x = x / mine.length + Math.cos(angle) * radius * 0.25;
      node.y = y / mine.length + Math.sin(angle) * radius * 0.25;
    });
  };

  // Projekte als Kette ordnen: Start beim Projekt mit den wenigsten
  // gemeinsamen Skills, dann jeweils das ähnlichste noch freie (Zahl
  // gemeinsamer Skills, bei Gleichstand die Reihenfolge der Daten).
  // Deterministisch, so steht nach Reset dasselbe Bild.
  function chainBySharedSkills(projects, neighbors) {
    function shared(a, b) {
      let count = 0;
      neighbors.get(a.id).forEach(function (id) { if (neighbors.get(b.id).has(id)) { count++; } });
      return count;
    }
    const totals = projects.map(function (p) {
      return projects.reduce(function (t, q) { return t + (q === p ? 0 : shared(p, q)); }, 0);
    });
    let current = projects[totals.indexOf(Math.min.apply(null, totals))];
    const order = [current];
    const left = projects.filter(function (p) { return p !== current; });
    while (left.length) {
      let best = 0;
      for (let k = 1; k < left.length; k++) {
        if (shared(current, left[k]) > shared(current, left[best])) { best = k; }
      }
      current = left.splice(best, 1)[0];
      order.push(current);
    }
    return order;
  }

  // Gibt es etwas zurückzusetzen? Ein gezogener (fixierter) Knoten, eine
  // Auswahl oder ein Flächenformat, das erst beim nächsten Reset greift.
  // Sonst ergäbe Reset dasselbe Bild wie „Übersicht“ (Startlage ist
  // deterministisch), der Knopf steht dann ausgegraut (Owner, 6. 10. 2026).
  SkillGraph.prototype.canReset = function () {
    if (this.current !== null || this.pendingAspect !== null) { return true; }
    return this.nodes.some(function (n) { return n.fx !== null && n.fx !== undefined; });
  };

  // Reset: Fixierungen lösen, Knoten auf die deterministische Kreis-Startlage
  // zurücksetzen (in der Fläche und im Format der aktuellen Größe), Sim neu
  // aufheizen, Auswahl lösen, Ansicht einpassen.
  SkillGraph.prototype.reset = function () {
    if (!this.sim || !this.canReset()) { return; }
    if (this.pendingAspect !== null) {
      this.sim.opts.aspect = this.pendingAspect;
      this.pendingAspect = null;
    }
    if (this.pendingSize) {
      this.sim.resize(this.pendingSize.w, this.pendingSize.h);   // Lagen werden gleich neu gesetzt
      this.pendingSize = null;
    }
    this.seedLayout(this.sim.width, this.sim.height, true);
    this.sim.alpha = 1;
    if (this.selected !== null || this.current !== null) {
      this.setSelection(null);
      this.dispatch();
    }
    this.settle();
    this.instantLabels = true;
    this.fit();
  };

  // Nachschwingen nach einem Knoten-Drag. Die Labels behalten dabei ihre
  // Mindestmaßstäbe (kein Flackern), erst das fertige Layout rechnet neu.
  SkillGraph.prototype.loop = function () {
    const self = this;
    this.rafId = requestAnimationFrame(function () {
      const moving = self.sim.tick();
      if (moving && !self.panel.hidden) {
        self.render();   // Kamera bleibt stehen, nur die Knoten schwingen nach
        self.loop();
      } else {
        self.rafId = null;
        if (!moving) { self.computeLabelScales(); }
        self.render();
      }
    });
  };

  SkillGraph.prototype.stopLoop = function () {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    if (this.fadeRaf !== null) {
      cancelAnimationFrame(this.fadeRaf);
      this.fadeRaf = null;
    }
  };

  SkillGraph.prototype.onVisibility = function () {
    if (document.hidden) {
      this.stopLoop();
    } else if (!this.panel.hidden && this.sim && !this.sim.isSettled()) {
      this.startOrStill();
    } else if (!this.panel.hidden && this.fadeStart.size) {
      // Eine beim Verbergen abgebrochene Blende zu Ende bringen, sonst
      // blieben die Labels unsichtbar stehen
      this.render();
    }
  };

  SkillGraph.prototype.onKeydown = function (event) {
    if (this.panel.hidden) { return; }
    if (event.key === 'Escape') {
      // Eine offene Vorschau nimmt das erste Esc allein weg (WCAG 1.4.13:
      // ohne Zeigerbewegung wegschließbar), das Sheet bleibt dann offen
      // (skill-graph-sheet.js prüft data-preview). Sonst löst Esc die
      // Auswahl bzw. schließt das Sheet.
      if (this.hoverRect) {
        this.setHover(null);
        return;
      }
      if (this.selected !== null) {
        this.setSelection(null);
        this.dispatch();
      }
      return;
    }
    // Tastatur-Zoom bei Fokus im Panel: + / − / 0 (Übersicht). Im modalen
    // Sheet zählt auch ein Fokus auf <body> (z. B. nach einem Klick auf
    // eine nicht fokussierbare Stelle): außerhalb des Sheets ist alles inert.
    if (!this.sim || event.ctrlKey || event.metaKey || event.altKey) { return; }
    const active = document.activeElement;
    const inside = this.panel.contains(active) ||
      (this.isModal() && (!active || active === document.body));
    if (!inside) { return; }
    if (event.key === '+' || event.key === '=') {
      this.zoomBy(ZOOM_STEP);
    } else if (event.key === '-' || event.key === '−') {
      this.zoomBy(1 / ZOOM_STEP);
    } else if (event.key === '0') {
      this.fit();
    } else {
      return;
    }
    event.preventDefault();
  };

  // ── Ansicht (Pan + Zoom) ────────────────────────────────────────────────────

  SkillGraph.prototype.toScreen = function (node) {
    return { x: node.x * this.scale + this.panX, y: node.y * this.scale + this.panY };
  };

  SkillGraph.prototype.toLayout = function (x, y) {
    return { x: (x - this.panX) / this.scale, y: (y - this.panY) / this.scale };
  };

  // Label-Breite in Layout-unabhängigen px bei Grundgröße (Monospace skaliert
  // linear mit der Schriftgröße), einmal gemessen und gecacht.
  SkillGraph.prototype.labelWidth = function (node) {
    if (node.labelW == null && this.ctx) {
      this.ctx.save();
      this.ctx.font = labelFont(1);
      node.labelW = this.ctx.measureText(node.label).width;
      this.ctx.restore();
    }
    return node.labelW || node.label.length * LABEL_PX * 0.6;
  };

  // Bildschirm-Rechteck eines Labels, immer über dem Knoten — EINE Quelle
  // für Zeichnen, Kollisionsprüfung, Hit-Test und Einpassen. tx = Mitte des
  // Texts. Die Maße sind Bildschirm-px und bei jedem Zoom gleich (GLYPH).
  SkillGraph.prototype.labelRect = function (sx, sy, node) {
    const w = this.labelWidth(node) * GLYPH;
    const fontPx = LABEL_PX * GLYPH;
    const base = sy - nodeRadius(node) - LABEL_GAP * GLYPH;
    return { x: sx - w / 2 - 2, y: base - fontPx, w: w + 4, h: fontPx + 3, base: base, tx: sx };
  };

  // Vorrang der Labels (Owner, 6. 10. 2026): Projekte vor allen Skills (sie
  // tragen die Aussage, Stufe 2), Kern vor Breite, dann Zahl der
  // Verbindungen, dann Reihenfolge der Chips
  SkillGraph.prototype.labelOrder = function () {
    const nodes = this.nodes;
    return nodes.map(function (n, i) { return i; }).sort(function (a, b) {
      return (!!nodes[b].project - !!nodes[a].project) || (nodes[b].core - nodes[a].core) ||
        (nodes[b].degree - nodes[a].degree) || a - b;
    });
  };

  // Ab welchem Maßstab steht das Label eines Knotens? Konsistente
  // Beschriftung nach Been, Daiches und Yap (2006): Ob ein Label steht, hängt
  // nur vom Maßstab ab, nicht vom Bildausschnitt und nicht vom Weg dorthin,
  // und beim Hineinzoomen verschwindet keines. Öffnen und „Übersicht“ zeigen
  // so immer dieselben Namen, Verschieben ändert nichts. Bis 6. 10. 2026
  // hing die Beschriftung am vorigen Bild (Hysterese) und am Bildrand.
  // Gerechnet einmal je fertigem Layout (settle beim Öffnen und bei Reset,
  // Ende des Nachschwingens nach einem Knoten-Drag), in Vorrang-Reihenfolge:
  // Ein Label steht ab seinem Mindestmaßstab bis ZOOM_MAX frei, mit
  // LABEL_AIR Luft zu allen fremden Knoten und zu den Labels mit höherem
  // Vorrang, die dort schon stehen. Statt eines Rasters von Maßstäben exakt:
  // Zwei Rechtecke, die an ihren Knoten hängen, überlappen je Paar in genau
  // einer Spanne von Maßstäben (overlapSpan). Der Mindestmaßstab ist das obere
  // Ende der letzten Spanne, die in [ZOOM_MIN, ZOOM_MAX] blockiert. Reicht sie
  // über ZOOM_MAX hinaus, bleibt der Knoten ein Punkt (Infinity) und zeigt
  // seinen Namen nur bei Auswahl oder als Vorschau.
  SkillGraph.prototype.computeLabelScales = function () {
    const nodes = this.nodes;
    if (!nodes || !nodes.length) { return; }
    const self = this;
    // Label-Rechteck je Knoten relativ zum Knotenpunkt: Mitte und halbe Maße
    const box = nodes.map(function (n) {
      const r = self.labelRect(0, 0, n);
      return { ox: r.x + r.w / 2, oy: r.y + r.h / 2, hw: r.w / 2, hh: r.h / 2 };
    });
    const min = new Array(nodes.length).fill(Infinity);
    const placed = [];
    this.labelOrder().forEach(function (i) {
      const a = box[i], ni = nodes[i];
      let need = ZOOM_MIN;
      // Spanne [lo, hi] blockiert ab from (das andere Label steht erst dort)
      const block = function (span, from) {
        if (!span) { return; }
        const lo = Math.max(span[0], from), hi = span[1];
        if (lo < hi && hi > ZOOM_MIN && lo < ZOOM_MAX) { need = Math.max(need, hi); }
      };
      nodes.forEach(function (nk, k) {
        if (k === i) { return; }
        const rad = nodeRadius(nk);
        block(overlapSpan(nk.x - ni.x, -a.ox, a.hw + rad + LABEL_AIR_X,
          nk.y - ni.y, -a.oy, a.hh + rad + LABEL_AIR_Y), -Infinity);
      });
      placed.forEach(function (j) {
        const b = box[j], nj = nodes[j];
        block(overlapSpan(nj.x - ni.x, b.ox - a.ox, a.hw + b.hw + LABEL_AIR_X,
          nj.y - ni.y, b.oy - a.oy, a.hh + b.hh + LABEL_AIR_Y), min[j]);
      });
      if (need <= ZOOM_MAX) {
        min[i] = need;
        placed.push(i);
      }
    });
    this.labelMin = min;
  };

  // Ausdehnung aller Knoten samt Label (über dem Knoten) bei Maßstab s,
  // relativ zu pan = 0.
  SkillGraph.prototype.extents = function (s) {
    const self = this;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    this.nodes.forEach(function (n) {
      const sx = n.x * s, sy = n.y * s, rad = nodeRadius(n);
      const up = self.labelRect(sx, sy, n);
      minX = Math.min(minX, up.x, sx - rad);
      maxX = Math.max(maxX, up.x + up.w, sx + rad);
      minY = Math.min(minY, up.y);
      maxY = Math.max(maxY, sy + rad);
    });
    return { minX: minX, minY: minY, maxX: maxX, maxY: maxY };
  };

  // Größter Maßstab in [lo, hi], für den fits(s) gilt. Die Ausdehnung wächst
  // monoton mit s, daher Bisektion. Passt nicht einmal lo, bleibt es bei lo.
  function largestFitting(lo, hi, fits) {
    if (fits(hi)) { return hi; }
    if (!fits(lo)) { return lo; }
    for (let i = 0; i < 24; i++) {
      const mid = (lo + hi) / 2;
      if (fits(mid)) { lo = mid; } else { hi = mid; }
    }
    return lo;
  }

  // Einpassen: alle Knoten samt Labels mit FIT_PAD Rand, Maßstab in
  // [FIT_MIN, FIT_MAX]. Greift die Untergrenze, wird zentriert und die
  // Rand-Pfeile zeigen, wo es weitergeht.
  SkillGraph.prototype.fitScale = function () {
    const availW = this.canvasW - 2 * FIT_PAD;
    const availH = this.canvasH - 2 * FIT_PAD;
    const self = this;
    return largestFitting(FIT_MIN, FIT_MAX, function (s) {
      const e = self.extents(s);
      return e.maxX - e.minX <= availW && e.maxY - e.minY <= availH;
    });
  };

  // Startansicht: alles eingepasst (Maßstab nach fitScale, Ausdehnung
  // mittig). Dieselbe Rechnung beim Öffnen, bei Reset und für „Übersicht“
  // (Muster „Home“ wie bei Kartenansichten), ändert nichts an der Ansicht.
  SkillGraph.prototype.homeView = function () {
    const s = this.fitScale();
    const e = this.extents(s);
    return this.clampedPan(s, this.canvasW / 2 - (e.minX + e.maxX) / 2,
      this.canvasH / 2 - (e.minY + e.maxY) / 2);
  };

  // Ist die Ansicht gerade die Startansicht? Dann steht „Übersicht“
  // ausgegraut, und eine Größenänderung der Fläche passt neu ein.
  SkillGraph.prototype.isHome = function () {
    if (!this.sim || !this.nodes || !this.nodes.length || !this.canvasW) { return false; }
    const h = this.homeView();
    return Math.abs(h.scale - this.scale) < 1e-6 &&
      Math.abs(h.x - this.panX) < 0.5 && Math.abs(h.y - this.panY) < 0.5;
  };

  SkillGraph.prototype.applyFit = function () {
    if (!this.nodes || !this.nodes.length || !this.canvasW) { return; }
    const h = this.homeView();
    this.scale = h.scale;
    this.panX = h.x;
    this.panY = h.y;
  };

  // Knopf „Übersicht“ / Taste 0: zurück zur Startansicht, ohne Übergang
  SkillGraph.prototype.fit = function () {
    if (!this.sim) { return; }
    this.applyFit();
    this.render();
  };

  // Zoom um einen Bildschirmpunkt (Standard: Canvas-Mitte); der Layout-Punkt
  // darunter bleibt stehen.
  SkillGraph.prototype.zoomAt = function (factor, cx, cy) {
    const s = clamp(this.scale * factor, ZOOM_MIN, ZOOM_MAX);
    if (s === this.scale) { return; }
    const p = this.toLayout(cx, cy);
    this.scale = s;
    this.panX = cx - p.x * s;
    this.panY = cy - p.y * s;
    this.clampPan();
    this.render();
  };

  SkillGraph.prototype.zoomBy = function (factor) {
    if (!this.sim) { return; }
    this.zoomAt(factor, this.canvasW / 2, this.canvasH / 2);
  };

  // Pan begrenzen: mindestens PAD px der Knoten-Wolke bleiben je Seite
  // sichtbar. Rechnet nur, Rückgabe { scale, x, y }.
  SkillGraph.prototype.clampedPan = function (s, panX, panY) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    this.nodes.forEach(function (n) {
      if (n.x < minX) { minX = n.x; }
      if (n.x > maxX) { maxX = n.x; }
      if (n.y < minY) { minY = n.y; }
      if (n.y > maxY) { maxY = n.y; }
    });
    const w = this.canvasW || this.wrap.clientWidth;
    const h = this.canvasH || this.wrap.clientHeight;
    const pad = 60;
    let minPanX = pad - maxX * s, maxPanX = (w - pad) - minX * s;
    let minPanY = pad - maxY * s, maxPanY = (h - pad) - minY * s;
    if (minPanX > maxPanX) { minPanX = maxPanX = (minPanX + maxPanX) / 2; }
    if (minPanY > maxPanY) { minPanY = maxPanY = (minPanY + maxPanY) / 2; }
    return { scale: s, x: clamp(panX, minPanX, maxPanX), y: clamp(panY, minPanY, maxPanY) };
  };

  SkillGraph.prototype.clampPan = function () {
    if (!this.nodes || !this.nodes.length) { return; }
    const p = this.clampedPan(this.scale, this.panX, this.panY);
    this.panX = p.x;
    this.panY = p.y;
  };

  // ── Zeichnen ────────────────────────────────────────────────────────────────

  SkillGraph.prototype.render = function () {
    if (!this.ctx || !this.sim) { return; }
    if (!this.labelMin) { this.computeLabelScales(); }
    const ctx = this.ctx;
    const nodes = this.nodes;
    const selected = this.selected;
    const neighbors = selected !== null ? (this.neighbors.get(selected) || new Set()) : null;
    const near = this.nearOf(selected);
    const projectMode = this.mode === 'projekte';
    const scale = this.scale;
    const labelMin = this.labelMin;
    const self = this;

    // Vollflächig löschen unabhängig von der DPR-Rundung — sonst bleibt am
    // rechten/unteren Rand eine Subpixel-Spalte mit Geister-Pixeln stehen.
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.restore();

    // Alles in Bildschirm-Koordinaten zeichnen (kein ctx.scale): Linien bleiben
    // 1 px, Knoten und Schrift haben bei jedem Zoom dieselbe Größe (GLYPH).
    const screen = nodes.map(function (n) { return self.toScreen(n); });

    // Kanten: Deckkraft nach Gewicht; bei Auswahl nur die Nachbarschaft betonen.
    // Mit Projekt-Knoten: Kanten zu den Skills, die mit dem gewählten Skill
    // in seinen Projekten zusammenkamen, bleiben in Grundstärke stehen.
    this.edges.forEach(function (edge) {
      const a = nodes[edge.source];
      const b = nodes[edge.target];
      let alpha = 0.12 + Math.min(edge.weight - 1, 3) * 0.06;
      if (selected !== null) {
        const touches = a.id === selected || b.id === selected;
        const viaNear = near && ((near.has(a.id) && neighbors.has(b.id)) ||
          (near.has(b.id) && neighbors.has(a.id)));
        alpha = touches ? 0.45 : (viaNear ? alpha : alpha * 0.25);
      }
      const pa = screen[edge.source], pb = screen[edge.target];
      ctx.strokeStyle = 'rgba(' + CYAN + ', ' + alpha + ')';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(pa.x, pa.y);
      ctx.lineTo(pb.x, pb.y);
      ctx.stroke();
    });

    // Zustand je Knoten und Beschriftung. Ein Label steht immer über dem
    // Knoten (keine Ausweichlagen, sonst wechselte die Schrift beim Zoomen
    // und Ziehen die Seite). Ohne Auswahl steht es genau dann, wenn der
    // Maßstab seinen Mindestmaßstab erreicht (computeLabelScales), am Rand
    // auch angeschnitten wie auf Karten: So ändert Verschieben die
    // Beschriftung nie. Mit Auswahl stehen der gewählte Skill und seine
    // Nachbarn immer, am Rand ins Bild geschoben. Die übrigen stehen nach
    // Maßstab und nur, wenn sie diese Pflicht-Labels nicht berühren (die
    // Auswahl ist ein fester Zustand, das wird je Bild geprüft).
    const states = nodes.map(function (node) {
      if (selected === null) { return 'base'; }
      if (node.id === selected) { return 'selected'; }
      if (neighbors.has(node.id)) { return 'related'; }
      return near && near.has(node.id) ? 'base' : 'dimmed';
    });
    const forced = function (i) {
      return states[i] === 'selected' || states[i] === 'related';
    };
    const showLabel = new Array(nodes.length).fill(null);
    const placed = [];
    const apart = function (r, p) {
      return r.x + r.w + LABEL_AIR_X <= p.x || p.x + p.w <= r.x - LABEL_AIR_X ||
        r.y + r.h + LABEL_AIR_Y <= p.y || p.y + p.h <= r.y - LABEL_AIR_Y;
    };
    // Frei von den Rechtecken in rects (mit Luft) und von Knoten (außer dem
    // eigenen, ohne Luft)
    const clearOf = function (r, i, rects) {
      return rects.every(function (p) { return apart(r, p); }) && screen.every(function (q, k) {
        const rad = nodeRadius(nodes[k]);
        return k === i || r.x + r.w <= q.x - rad || q.x + rad <= r.x ||
          r.y + r.h <= q.y - rad || q.y + rad <= r.y;
      });
    };
    nodes.forEach(function (node, i) {
      if (!forced(i)) { return; }
      let r = self.clampedLabelRect(screen[i], node);
      // Mit Projekt-Knoten (Prototyp Stufe 2): Stößt ein Pflicht-Label an ein
      // schon gesetztes, weicht es unter den Knoten aus, wenn dort Platz ist
      // (bei einem Projekt stehen bis zu neun Skill-Namen zugleich)
      if (projectMode && !placed.every(function (p) { return apart(r, p); })) {
        const below = self.clampedLabelRect(screen[i], node, true);
        if (clearOf(below, i, placed)) { r = below; }
      }
      showLabel[i] = r;
      placed.push(r);
    });
    const pinned = placed.slice();
    const clearOfPinned = function (r) {
      return pinned.every(function (p) { return apart(r, p); });
    };
    nodes.forEach(function (node, i) {
      if (showLabel[i] || !(scale >= labelMin[i])) { return; }
      const r = self.labelRect(screen[i].x, screen[i].y, node);
      if (!clearOfPinned(r)) { return; }
      r.id = node.id;
      showLabel[i] = r;
      placed.push(r);
    });

    // Neu sichtbare Labels blenden kurz ein (nur Deckkraft, keine Bewegung),
    // ausgeblendete verschwinden sofort. Ohne Blende: Pflicht-Labels der
    // Auswahl, das Startbild nach Öffnen und Reset, reduzierte Bewegung.
    const now = performance.now();
    const fade = !this.instantLabels && !reducedMotion();
    this.instantLabels = false;
    const before = this.labelShown;
    const shown = new Set();
    const labelAlpha = new Array(nodes.length).fill(1);
    nodes.forEach(function (node, i) {
      const id = node.id;
      if (!showLabel[i]) { self.fadeStart.delete(id); return; }
      shown.add(id);
      if (!fade || forced(i)) { self.fadeStart.delete(id); return; }
      if (!before.has(id)) { self.fadeStart.set(id, now); }
      const t0 = self.fadeStart.get(id);
      if (t0 === undefined) { return; }
      const a = (now - t0) / LABEL_FADE_MS;
      if (a >= 1) { self.fadeStart.delete(id); } else { labelAlpha[i] = Math.max(0, a); }
    });
    this.labelShown = shown;
    // Ein Label, das über den Rand ragen würde, wird nicht gezeichnet (statt
    // angeschnitten). Die Beschriftung selbst hängt weiter nur am Maßstab
    // (data-labels, Blende): Beim Verschieben erscheint es, sobald es ganz
    // im Bild liegt, wie ein Ortsname am Kartenrand. Pflicht-Labels der
    // Auswahl sind ohnehin ins Bild geschoben. Projektnamen (Vorrang, sie
    // tragen die Aussage) rücken ebenso ins Bild, solange ihr Knoten darin
    // liegt.
    const cw = this.canvasW, ch = this.canvasH;
    const drawn = showLabel.map(function (r, i) {
      if (!r || forced(i)) { return r; }
      if (r.x >= 0 && r.x + r.w <= cw && r.y >= 0 && r.y + r.h <= ch) { return r; }
      const p = screen[i];
      if (nodes[i].project && p.x >= 0 && p.x <= cw && p.y >= 0 && p.y <= ch) {
        // Ins Bild gerückt nur, wenn es dort keinen Knoten und kein anderes
        // Label berührt
        const moved = self.clampedLabelRect(p, nodes[i]);
        const others = showLabel.filter(function (o, k) { return o && k !== i; });
        return clearOf(moved, i, others) ? moved : null;
      }
      return null;
    });
    this.labelRects = drawn.filter(Boolean);   // Hit-Test trifft nur gezeichnete Labels

    ctx.font = labelFont(GLYPH);
    ctx.textAlign = 'center';
    // Auswahl und ihre Nachbarn zuletzt zeichnen: Ihre Namen liegen sonst
    // unter später gezeichneten Knoten
    const rank = { dimmed: 0, base: 1, related: 2, selected: 3 };
    const drawOrder = nodes.map(function (n, i) { return i; }).sort(function (a, b) {
      return rank[states[a]] - rank[states[b]] || a - b;
    });
    drawOrder.forEach(function (i) {
      const node = nodes[i];
      const state = states[i];
      const p = screen[i];
      ctx.save();
      ctx.globalAlpha = state === 'dimmed' ? 0.3 : 1;
      if (state === 'selected') {
        // Aktive Auswahl = Interaktionszustand ⇒ Magenta (wie in der Chip-Liste)
        ctx.shadowColor = 'rgba(' + MAGENTA + ', 0.5)';
        ctx.shadowBlur = 10;
      }
      ctx.beginPath();
      if (node.project) {
        const half = nodeRadius(node);
        roundedSquare(ctx, p.x, p.y, half, PROJECT_CORNER * GLYPH);
      } else {
        ctx.arc(p.x, p.y, nodeRadius(node), 0, Math.PI * 2);
      }
      ctx.fillStyle = 'rgb(10 14 18)';
      ctx.fill();
      if (state === 'selected') {
        ctx.strokeStyle = 'rgba(' + MAGENTA + ', 0.85)';
        ctx.lineWidth = 2;
      } else if (node.project) {
        // Projekt: Beige-Kontur mit zartem Beige-Grund, ruhig und klar
        // unterscheidbar von den Cyan-Kreisen der Skills
        ctx.fillStyle = 'rgba(' + BEIGE + ', ' + (state === 'related' ? 0.32 : 0.18) + ')';
        ctx.fill();
        ctx.strokeStyle = 'rgba(' + BEIGE + ', ' + (state === 'related' ? 0.95 : 0.75) + ')';
        ctx.lineWidth = 1.25;
      } else {
        // Kern heller als die Breite, Nachbarn der Auswahl heller als der Rest.
        // Auch die Breite hält 3:1 gegen den Grund (WCAG 1.4.11, Cyan 0,5 ≈
        // 3,4:1), sie ist ein antippbares Ziel.
        const contour = state === 'related' ? (node.core ? 0.95 : 0.75) : (node.core ? 0.8 : 0.5);
        ctx.strokeStyle = 'rgba(' + CYAN + ', ' + contour + ')';
        ctx.lineWidth = node.core ? 1.25 : 1;
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
      const label = drawn[i];
      if (label) {
        ctx.globalAlpha *= labelAlpha[i];
        if (state === 'selected') {
          // Dezenter Schimmer am Label des gewählten Knotens (Magenta = Auswahl)
          ctx.shadowColor = 'rgba(' + MAGENTA + ', 0.55)';
          ctx.shadowBlur = 6;
          ctx.fillStyle = 'rgba(255, 255, 255, 0.98)';
        } else if (node.project) {
          ctx.fillStyle = 'rgba(' + BEIGE + ', 0.95)';   // Projektname in Beige
        } else {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        }
        ctx.fillText(node.label, label.tx, label.base);
      }
      ctx.restore();
    });

    this.drawPreview(screen, drawn);
    this.drawEdgeHints(screen, drawn);   // Rand-Pfeile: „hier geht's weiter“
    this.labelIds = Array.from(shown).sort().join(' ');
    this.drawnCount = this.labelRects.length;
    this.publishView();

    // Kurzer Nachlauf nur, solange eine Blende läuft, danach Ruhe
    if (this.fadeStart.size && this.rafId === null && this.fadeRaf === null && !this.panel.hidden) {
      this.fadeRaf = requestAnimationFrame(function () {
        self.fadeRaf = null;
        self.render();
      });
    }
  };

  // Label-Rechteck über dem Knoten, am Rand ins Bild geschoben statt
  // angeschnitten (bleibt über dem Knoten, nur versetzt). Rand wie bei den
  // Weiter-Pfeilen (drawEdgeHints, 6 px). Für Pflicht-Labels und Vorschau.
  // below: unter den Knoten statt darüber (Ausweichlage für Pflicht-Labels
  // mit Projekt-Knoten, siehe render)
  SkillGraph.prototype.clampedLabelRect = function (p, node, below) {
    const cw = this.canvasW, ch = this.canvasH;
    const r = this.labelRect(p.x, p.y, node);
    if (below) {
      const shift = 2 * (p.y - r.base) + LABEL_PX * GLYPH - 2;
      r.y += shift; r.base += shift;
    }
    const dx = clamp(r.x, 6, Math.max(6, cw - 6 - r.w)) - r.x;
    const dy = clamp(r.y, 6, Math.max(6, ch - 6 - r.h)) - r.y;
    r.x += dx; r.tx += dx; r.y += dy; r.base += dy;
    r.id = node.id;
    return r;
  };

  // Vorschau beim Überfahren (Maus, Stift): Name eines Knotens ohne Label,
  // ruhig über dem Knoten (gedämpfte Schrift, dezenter Grund, kein Magenta,
  // das bleibt der Auswahl). Ändert weder Auswahl noch Info-Leiste.
  SkillGraph.prototype.drawPreview = function (screen, labels) {
    this.hoverRect = null;
    const i = this.hoverId === null ? -1 : this.nodeIndex(this.hoverId);
    if (i < 0 || labels[i]) { return; }   // schon beschriftet: keine Vorschau nötig
    const ctx = this.ctx;
    const node = this.nodes[i];
    const r = this.clampedLabelRect(screen[i], node);
    const bg = { x: r.x - 3, y: r.y - 1, w: r.w + 6, h: r.h + 2, id: node.id };
    ctx.save();
    ctx.fillStyle = 'rgba(10, 14, 18, 0.88)';
    ctx.strokeStyle = 'rgba(' + CYAN + ', 0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.rect(bg.x + 0.5, bg.y + 0.5, bg.w - 1, bg.h - 1);
    ctx.fill();
    ctx.stroke();
    ctx.font = labelFont(GLYPH);
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.72)';
    ctx.fillText(node.label, r.tx, r.base);
    ctx.restore();
    this.hoverRect = bg;
  };

  // Liegt ein Knoten oder sein sichtbares Label (ganz oder teilweise)
  // außerhalb des Fensters, deutet ein dezenter Pfeil „hier geht's weiter“
  // an (Owner: bleibt, der Graph wächst). Ein angeschnittenes Label zählt
  // mit — es ist ebenso ein Hinweis, dass dort mehr liegt.
  SkillGraph.prototype.drawEdgeHints = function (screen, labels) {
    const ctx = this.ctx;
    if (!ctx) { return; }
    const w = this.canvasW || this.wrap.clientWidth;
    const h = this.canvasH || this.wrap.clientHeight;
    const m = 6;
    let left = false, right = false, top = false, bottom = false, outside = 0;
    screen.forEach(function (p, i) {
      const r = labels && labels[i];
      const x0 = r ? Math.min(p.x, r.x) : p.x;
      const x1 = r ? Math.max(p.x, r.x + r.w) : p.x;
      const y0 = r ? Math.min(p.y, r.y) : p.y;
      const y1 = r ? Math.max(p.y, r.y + r.h) : p.y;
      let out = false;
      if (x0 < m) { left = out = true; }
      if (x1 > w - m) { right = out = true; }
      if (y0 < m) { top = out = true; }
      if (y1 > h - m) { bottom = out = true; }
      if (out) { outside++; }
    });
    this.outside = outside;
    if (!(left || right || top || bottom)) { return; }
    const s = 6;
    ctx.save();
    ctx.fillStyle = 'rgba(' + CYAN + ', 0.8)';
    function chevron(cx, cy, dx, dy) {
      ctx.beginPath();
      if (dx !== 0) {
        ctx.moveTo(cx, cy - s); ctx.lineTo(cx + dx * s, cy); ctx.lineTo(cx, cy + s);
      } else {
        ctx.moveTo(cx - s, cy); ctx.lineTo(cx, cy + dy * s); ctx.lineTo(cx + s, cy);
      }
      ctx.closePath();
      ctx.fill();
    }
    // Pfeil nicht über ein sichtbares Label legen: entlang der Kante zur
    // nächsten freien Stelle rücken (mittig, wenn frei, sonst abwechselnd
    // ober- und unterhalb bzw. links und rechts davon)
    const rects = (labels || []).filter(Boolean);
    function free(cx, cy) {
      const pad = s + 3;
      return !rects.some(function (r) {
        return cx + pad > r.x && cx - pad < r.x + r.w && cy + pad > r.y && cy - pad < r.y + r.h;
      });
    }
    function along(fixed, mid, len, vertical) {
      for (let k = 0; k <= len / 2 - 16; k += 4) {
        const a = mid - k, b = mid + k;
        if (free(vertical ? fixed : a, vertical ? a : fixed)) { return a; }
        if (free(vertical ? fixed : b, vertical ? b : fixed)) { return b; }
      }
      return mid;
    }
    if (left) { chevron(10, along(10, h / 2, h, true), -1, 0); }
    if (right) { chevron(w - 10, along(w - 10, h / 2, h, true), 1, 0); }
    if (top) { chevron(along(10, w / 2, w, false), 10, 0, -1); }
    if (bottom) { chevron(along(h - 10, w / 2, w, false), h - 10, 0, 1); }
    ctx.restore();
  };

  // Ansichtszustand als Attribute am Canvas (Maßstab, Knoten außerhalb bzw.
  // angeschnitten, Bildschirmlage des gewählten Knotens, IDs der
  // beschrifteten Knoten, Zahl der gezeichneten Namen, Knoten mit
  // Vorschau) — für Tests und Entwickler-Werkzeuge, ändert nichts an der
  // Darstellung. Dazu die Zoom-Knöpfe an den Grenzen, „Übersicht“ in der Startansicht und Reset
  // ohne etwas zum Zurücksetzen als aria-disabled (Rückmeldung für Tastatur
  // und Screenreader; nicht disabled, sonst ginge ihr Fokus verloren).
  // Nur bei Änderung schreiben (die Loop rendert pro Frame).
  SkillGraph.prototype.publishView = function () {
    const canvas = this.canvas;
    function put(el, name, value) {
      if (!el) { return; }
      if (value === null) {
        if (el.hasAttribute(name)) { el.removeAttribute(name); }
      } else if (el.getAttribute(name) !== value) {
        el.setAttribute(name, value);
      }
    }
    put(canvas, 'data-zoom', this.scale.toFixed(3));
    put(canvas, 'data-outside', String(this.outside || 0));
    const sel = this.selected !== null ? this.nodeById(this.selected) : null;
    const p = sel ? this.toScreen(sel) : null;
    put(canvas, 'data-sel-x', p ? p.x.toFixed(1) : null);
    put(canvas, 'data-sel-y', p ? p.y.toFixed(1) : null);
    put(canvas, 'data-labels', this.labelIds || '');
    // Zahl der tatsächlich gezeichneten Namen (ohne die am Rand weggelassenen)
    put(canvas, 'data-drawn', String(this.drawnCount || 0));
    put(canvas, 'data-preview', this.hoverRect ? this.hoverRect.id : null);
    put(this.zoomInBtn, 'aria-disabled', this.scale >= ZOOM_MAX - 1e-6 ? 'true' : null);
    put(this.zoomOutBtn, 'aria-disabled', this.scale <= ZOOM_MIN + 1e-6 ? 'true' : null);
    put(this.fitBtn, 'aria-disabled', this.isHome() ? 'true' : null);
    put(this.resetBtn, 'aria-disabled', this.canReset() ? null : 'true');
  };

  // ── Eingabe ─────────────────────────────────────────────────────────────────

  SkillGraph.prototype.centroid = function () {
    const ids = Object.keys(this.pointers);
    let cx = 0, cy = 0, i;
    for (i = 0; i < ids.length; i++) { cx += this.pointers[ids[i]].x; cy += this.pointers[ids[i]].y; }
    const n = ids.length || 1;
    return { x: cx / n, y: cy / n };
  };

  SkillGraph.prototype.spreadDist = function () {
    const ids = Object.keys(this.pointers);
    if (ids.length < 2) { return 0; }
    const a = this.pointers[ids[0]], b = this.pointers[ids[1]];
    return Math.hypot(a.x - b.x, a.y - b.y);
  };

  // Geste (neu) beginnen: Bezugspunkt = Schwerpunkt der Finger. Mit zwei
  // Fingern zusätzlich Abstand merken -> Pinch-Zoom um den Schwerpunkt.
  SkillGraph.prototype.startGesture = function () {
    this.panning = true;
    const c = this.centroid();
    this.gesture = {
      c: c,
      dist: this.spreadDist(),
      scale: this.scale,
      anchor: this.toLayout(c.x, c.y)
    };
    try { this.canvas.style.cursor = 'grabbing'; } catch (e) { /* noop */ }
  };

  SkillGraph.prototype.canvasPos = function (event) {
    const rect = this.canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  SkillGraph.prototype.nodeIndex = function (id) {
    if (!this.nodes) { return -1; }
    for (let i = 0; i < this.nodes.length; i++) {
      if (this.nodes[i].id === id) { return i; }
    }
    return -1;
  };

  SkillGraph.prototype.nodeById = function (id) {
    const i = this.nodeIndex(id);
    return i < 0 ? null : this.nodes[i];
  };

  // Pfad eines Quadrats mit abgerundeten Ecken um (cx, cy), halbe Kante half
  function roundedSquare(ctx, cx, cy, half, r) {
    const x0 = cx - half, y0 = cy - half, x1 = cx + half, y1 = cy + half;
    ctx.moveTo(x0 + r, y0);
    ctx.arcTo(x1, y0, x1, y1, r);
    ctx.arcTo(x1, y1, x0, y1, r);
    ctx.arcTo(x0, y1, x0, y0, r);
    ctx.arcTo(x0, y0, x1, y0, r);
    ctx.closePath();
  }

  function inRect(r, x, y, m) {
    return x >= r.x - m && x <= r.x + r.w + m && y >= r.y - m && y <= r.y + r.h + m;
  }

  // Nächster Knoten im HIT_RADIUS (Bildschirm-Koordinaten) oder null
  SkillGraph.prototype.hitNode = function (x, y) {
    let hit = null;
    let best = HIT_RADIUS * HIT_RADIUS;
    const self = this;
    this.nodes.forEach(function (node) {
      const p = self.toScreen(node);
      const dx = p.x - x;
      const dy = p.y - y;
      const d = dx * dx + dy * dy;
      if (d <= best) { best = d; hit = node.id; }
    });
    return hit;
  };

  // Treffer: nächster Knoten im HIT_RADIUS, sonst ein SICHTBARES Label
  // (Rechtecke aus dem letzten render) oder die Vorschau.
  SkillGraph.prototype.hitTest = function (x, y) {
    const hit = this.hitNode(x, y);
    if (hit !== null) { return hit; }
    for (let i = this.labelRects.length - 1; i >= 0; i--) {
      if (inRect(this.labelRects[i], x, y, 2)) { return this.labelRects[i].id; }
    }
    return this.hoverRect && inRect(this.hoverRect, x, y, 2) ? this.hoverRect.id : null;
  };

  // Vorschau setzen oder entfernen (null), zeichnet nur bei Änderung neu
  SkillGraph.prototype.setHover = function (id) {
    if (this.hoverId === id) { return; }
    this.hoverId = id;
    if (this.initialized && !this.panel.hidden) { this.render(); }
  };

  // Vorschau nach Zeigerlage (nur Maus und Stift mit Hover): ein Knoten ohne
  // Label im HIT_RADIUS. Solange der Zeiger auf der Vorschau selbst liegt,
  // bleibt sie stehen (WCAG 1.4.13, überfahrbar).
  SkillGraph.prototype.updateHover = function (event, pos) {
    if (!this.canHover || event.pointerType === 'touch') { return; }
    if (this.hoverRect && inRect(this.hoverRect, pos.x, pos.y, 2)) { return; }
    const hit = this.hitNode(pos.x, pos.y);
    this.setHover(hit !== null && !this.labelRects.some(function (r) { return r.id === hit; }) ? hit : null);
  };

  // Modal = Präsentations-Wrapper hat das Sheet geöffnet (skill-graph-sheet.js).
  // Dann gehört jede Geste auf dem Canvas dem Graphen, die Seite ist gesperrt.
  SkillGraph.prototype.isModal = function () {
    return document.body.classList.contains('graph-open');
  };

  SkillGraph.prototype.onWheel = function (event) {
    if (!this.sim || this.panel.hidden || !this.isModal()) { return; }
    event.preventDefault();
    const unit = event.deltaMode === 1 ? 16 : (event.deltaMode === 2 ? this.canvasH || 400 : 1);
    let dx = event.deltaX * unit, dy = event.deltaY * unit;
    if (event.shiftKey && !dx) { dx = dy; dy = 0; }   // Shift+Rad = waagerecht verschieben
    const pos = this.canvasPos(event);
    if (Math.abs(dx) > Math.abs(dy)) {
      // Waagerechtes Wischen (Trackpad) verschiebt
      this.panX -= dx;
      this.clampPan();
      this.render();
    } else {
      // Senkrechtes Rad zoomt um den Mauszeiger (wie im Fraktal-Panel, OVL-2)
      this.zoomAt(Math.exp(-dy * WHEEL_ZOOM), pos.x, pos.y);
    }
    // Unter dem Zeiger liegt jetzt womöglich ein anderer Knoten
    this.updateHover(event, pos);
  };

  SkillGraph.prototype.onTouchStart = function (event) {
    if (!this.sim || this.panel.hidden) { return; }
    if (this.isModal() || event.touches.length >= 2) { event.preventDefault(); return; }
    const t = event.touches[0];
    const rect = this.canvas.getBoundingClientRect();
    if (this.hitTest(t.clientX - rect.left, t.clientY - rect.top) !== null) { event.preventDefault(); }
  };

  SkillGraph.prototype.onPointerDown = function (event) {
    if (!this.sim || this.panel.hidden) { return; }
    this.pointers[event.pointerId] = this.canvasPos(event);
    const count = Object.keys(this.pointers).length;

    if (count >= 2) {
      // Zwei Finger -> Pan + Pinch-Zoom (Karten-Muster). Laufenden Knoten-Drag
      // abbrechen und Touch dem Browser entziehen, solange die Geste läuft.
      // Wurde der Knoten schon bewegt und schwingt nichts nach (reduzierte
      // Bewegung), ist das Layout jetzt fertig: Labels neu rechnen, sonst
      // überspränge onPointerUp das ohne dragId.
      if (this.dragId !== null && this.dragMoved && this.rafId === null) {
        this.computeLabelScales();
      }
      this.dragId = null;
      this.startGesture();
      try { this.canvas.style.touchAction = 'none'; } catch (e) { /* noop */ }
      return;
    }

    const pos = this.pointers[event.pointerId];
    const hit = this.hitTest(pos.x, pos.y);   // trifft auch die Vorschau
    this.setHover(null);   // Ziehen, Verschieben und Auswahl beenden die Vorschau
    if (hit !== null) {
      // Auf einem Knoten -> Knoten ziehen (Klick ohne Bewegung = Auswahl).
      this.dragId = hit;
      this.dragMoved = false;
      this.pointerStart = pos;
      try { this.canvas.setPointerCapture(event.pointerId); } catch (e) { /* noop */ }
      try { this.canvas.style.cursor = 'grabbing'; } catch (e) { /* noop */ }
    } else if (event.pointerType === 'mouse' || this.isModal()) {
      // Leere Fläche -> Pan: mit der Maus immer, per Touch im modalen Sheet
      // (dort ist die Seite gesperrt, ein Finger verschiebt die Ansicht).
      // Capture nötig: ohne sie erreicht ein pointerup außerhalb des Canvas
      // onPointerUp nie und der Pan bliebe am Hover kleben.
      this.startGesture();
      try { this.canvas.setPointerCapture(event.pointerId); } catch (e) { /* noop */ }
    }
    // Inline (ohne Sheet) per Touch auf leere Fläche: nichts -> die Seite
    // scrollt (touch-action: pan-y).
  };

  SkillGraph.prototype.onPointerMove = function (event) {
    if (this.pointers[event.pointerId]) { this.pointers[event.pointerId] = this.canvasPos(event); }

    // Hover (Maus, Stift): Vorschau für Knoten ohne Label, dazu der Cursor
    // über einem Knoten als Klick-Finger, sonst Greif-Hand.
    if (!this.panning && this.dragId === null && event.pointerType !== 'touch' && this.sim) {
      const hover = this.canvasPos(event);
      this.updateHover(event, hover);
      this.canvas.style.cursor = this.hitTest(hover.x, hover.y) !== null ? 'pointer' : 'grab';
    }

    if (this.panning && this.gesture) {
      const gs = this.gesture;
      const c = this.centroid();
      const dist = this.spreadDist();
      if (gs.dist > 0 && dist > 0) {
        // Pinch: Maßstab nach Fingerabstand, der Layout-Punkt unter dem
        // Schwerpunkt wandert mit dem Schwerpunkt (Zoom + Pan in einem).
        this.scale = clamp(gs.scale * dist / gs.dist, ZOOM_MIN, ZOOM_MAX);
        this.panX = c.x - gs.anchor.x * this.scale;
        this.panY = c.y - gs.anchor.y * this.scale;
      } else {
        this.panX = c.x - gs.anchor.x * this.scale;
        this.panY = c.y - gs.anchor.y * this.scale;
      }
      this.clampPan();
      if (event.cancelable) { event.preventDefault(); }
      this.render();
      return;
    }

    if (this.dragId === null || !this.pointerStart) { return; }
    const pos = this.canvasPos(event);
    if (!this.dragMoved) {
      const dx = pos.x - this.pointerStart.x;
      const dy = pos.y - this.pointerStart.y;
      if (dx * dx + dy * dy < 25) { return; } // 5px-Schwelle: darunter bleibt es ein Klick
      this.dragMoved = true;
    }
    if (event.cancelable) { event.preventDefault(); }
    const node = this.nodeById(this.dragId);
    if (!node) { return; }
    // In Layout-Koordinaten pinnen (Zoom und Pan herausrechnen); die Sim hält
    // fx/fy fest.
    const p = this.toLayout(pos.x, pos.y);
    node.fx = p.x;
    node.fy = p.y;
    if (reducedMotion()) {
      node.x = node.fx; node.y = node.fy; node.vx = 0; node.vy = 0;
      this.render();
    } else {
      this.sim.alpha = Math.max(this.sim.alpha, 0.35);
      this.startOrStill();
    }
  };

  SkillGraph.prototype.onPointerUp = function (event) {
    delete this.pointers[event.pointerId];
    const remaining = Object.keys(this.pointers).length;

    if (this.panning) {
      if (remaining >= 2 || (remaining === 1 && this.isModal())) {
        this.startGesture();   // Bezug neu setzen (kein Sprung beim Fingerwechsel)
      } else {
        this.panning = false;
        this.gesture = null;
        try { this.canvas.style.touchAction = ''; } catch (e) { /* noop */ }  // Scroll wieder frei
        try { this.canvas.style.cursor = 'grab'; } catch (e) { /* noop */ }
      }
      try { this.canvas.releasePointerCapture(event.pointerId); } catch (e) { /* noop */ }
      return;
    }

    // pointercancel ist KEIN Klick: der Browser hat die Geste übernommen
    // (z.B. pan-y-Scroll) — nur Pointer-State aufräumen, Auswahl unangetastet.
    if (this.dragId !== null && !this.dragMoved && event.type !== 'pointercancel') {
      // Kein echtes Ziehen → als Klick behandeln (Auswahl togglen)
      const hit = this.dragId;
      this.setSelection(hit === this.selected ? null : hit);
      this.dispatch();
    }
    // War es ein Drag: fx/fy bleiben gesetzt → der Knoten bleibt liegen.
    // Ohne Nachschwingen (reduzierte Bewegung) ist das Layout jetzt fertig,
    // sonst rechnet das Ende der Loop die Labels neu.
    if (this.dragId !== null && this.dragMoved && this.rafId === null) {
      this.computeLabelScales();
      this.render();
    }
    try { this.canvas.releasePointerCapture(event.pointerId); } catch (e) { /* noop */ }
    try { this.canvas.style.cursor = 'grab'; } catch (e) { /* noop */ }
    this.dragId = null;
    this.dragMoved = false;
    this.pointerStart = null;
  };

  // ── Auswahl ─────────────────────────────────────────────────────────────────

  // Mit Projekt-Knoten und gewähltem Skill: die Skills, die in seinen
  // Projekten mit ihm zusammenkamen (zweite Stufe, ruhig in Grundstärke).
  // Sonst null.
  SkillGraph.prototype.nearOf = function (id) {
    if (this.mode !== 'projekte' || id === null) { return null; }
    const node = this.nodeById(id);
    if (!node || node.project) { return null; }
    const neighbors = this.neighbors;
    const near = new Set();
    (neighbors.get(id) || new Set()).forEach(function (projectId) {
      (neighbors.get(projectId) || new Set()).forEach(function (other) {
        if (other !== id) { near.add(other); }
      });
    });
    return near;
  };

  // skillId: ID eines Skills oder (mit Projekt-Knoten) eines Projekt-Knotens
  SkillGraph.prototype.setSelection = function (skillId) {
    // Skills, die KEIN Knoten sind (Basis-Skills ohne Projektkanten), kann der
    // Graph nicht hervorheben — dort bleiben alle Knoten unmarkiert. Die
    // Info-Leiste zeigt sie trotzdem, genau wie die Konsole über den Chips.
    const node = skillId === null ? null : this.nodeById(skillId);
    this.current = skillId;
    this.selected = node ? skillId : null;
    this.renderInfo(skillId);
    if (this.initialized && !this.panel.hidden) { this.render(); }
  };

  // Info-Leiste oben im Sheet: dasselbe Format und derselbe Renderer wie die
  // Konsole über den Chips (SkillGraphData.renderSelection). Feste Höhe im
  // CSS, nur der Inhalt wechselt.
  SkillGraph.prototype.renderInfo = function (skillId) {
    const el = this.contextLine;
    if (!el) { return; }
    const project = skillId !== null && this.projectSkills ? this.projectSkills.get(skillId) : null;
    if (project) {
      // Projekt: Name, „hier kamen zusammen“, darunter seine Skills
      window.SkillGraphData.renderSelection(el, this.nodeById(skillId).fullLabel, project,
        'project', this.selectionTexts);
      el.classList.add('is-active');
      return;
    }
    const label = skillId !== null && this.chipLabels ? this.chipLabels.get(skillId) : null;
    if (!label) {
      el.replaceChildren.apply(el, this.defaultInfo.map(function (n) { return n.cloneNode(true); }));
      el.classList.remove('is-active');
      return;
    }
    const projects = (this.skillProjects && this.skillProjects.get(skillId)) || [];
    const kind = this.foundations && this.foundations.has(skillId) ? 'foundation' : 'plain';
    window.SkillGraphData.renderSelection(el, label, projects, kind, this.selectionTexts);
    // Magenta-Hairline wie .has-selection an der Konsole: nur mit Projekten
    el.classList.toggle('is-active', projects.length > 0);
  };

  // Ein gewähltes Projekt geht als skill: null hinaus (die Chip-Liste kehrt
  // in den Ruhezustand zurück, siehe Dateikopf), seine ID steht in project
  SkillGraph.prototype.dispatch = function () {
    const node = this.current !== null ? this.nodeById(this.current) : null;
    const detail = node && node.project ?
      { skill: null, project: node.projectId, source: SOURCE } :
      { skill: this.current, source: SOURCE };
    document.dispatchEvent(new CustomEvent('auflinie:skill-select', { detail: detail }));
  };

  SkillGraph.prototype.onExternalSelect = function (event) {
    if (!event.detail || event.detail.source === SOURCE) { return; }
    // Auswahl IMMER merken — auch wenn der Graph noch nicht gebaut ist (lazy-init
    // beim ersten Öffnen). Sonst bleibt ein VOR dem Öffnen gewählter Chip im
    // Graphen unmarkiert; build() zieht this.pendingExternal dann nach.
    this.pendingExternal = event.detail.skill;
    if (this.initialized && event.detail.skill !== this.current) {
      this.setSelection(event.detail.skill);
    }
  };

  // ── Seiten-Modul (STYLEGUIDE 10.2): mountet einmal beim Laden ──────────────
  function mountGraph() {
    if (typeof window.SkillGraphSim === 'undefined') {
      console.warn('skill-graph: Engine skill-graph-sim.js fehlt — Panel bleibt inaktiv');
      return;
    }
    document.querySelectorAll('[data-skill-graph]').forEach(function (el) {
      if (el.hasAttribute('data-skill-graph-mounted')) { return; }
      el.setAttribute('data-skill-graph-mounted', '');
      new SkillGraph(el);   // die Instanz lebt über ihre Listener weiter
    });
  }

  mountGraph();
})();
