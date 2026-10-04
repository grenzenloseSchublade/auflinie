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
 * (Reihenfolge = Gruppenreihenfolge), Kanten = gemeinsame Projekte. Die
 * Info-Leiste schreibt SkillGraphData.renderSelection — derselbe Renderer
 * wie die Konsole über den Chips (skill-chips.js).
 *
 * Ansicht: Bildschirm = Layout × scale + pan. Render, Hit-Test, Rand-Pfeile
 * und Knoten-Ziehen rechnen über dieselben Helfer (toScreen/toLayout). Zoom
 * skaliert die Abstände voll, Knoten und Schrift nur gedämpft (glyphScale):
 * so bleiben Labels beim Herauszoomen lesbar, beim Hineinzoomen entzerren
 * sich dichte Bereiche. Beim Öffnen (auch mit Auswahl) und bei Reset wird
 * das Layout synchron zu Ende gerechnet und dann EINMAL eingepasst: alle
 * Knoten samt Labels, nicht kleiner als FIT_MIN. Eine Auswahl wird nur
 * hervorgehoben, wo sie liegt — kein Zentrieren, keine Kamerafahrt, die
 * Kamera folgt dem Layout nie von selbst (Owner-Korrektur 2.10.2026: der
 * Graph soll sich nicht von selbst bewegen). Nur eine Größenänderung der
 * Fläche passt erneut ein, solange niemand Zoom oder Lage verändert hat.
 *
 * Verhalten: Lazy-Init beim ersten Öffnen; die rAF-Loop läuft nur nach dem
 * Ziehen eines Knotens (Nachschwingen, < 5 s) und stoppt bei
 * visibilitychange/Zuklappen; prefers-reduced-motion setzt den gezogenen
 * Knoten direkt ohne Nachschwingen. Auswahl läuft
 * über den Event-Vertrag `auflinie:skill-select` (source 'graph').
 * Farben: Cyan für Inhalt (Kanten, Verwandtschaft), Magenta nur für die
 * aktive Auswahl (Interaktionszustand, Design-Regel).
 */
(function () {
  'use strict';

  const SOURCE = 'graph';
  const CYAN = '5, 217, 232';
  const MAGENTA = '255, 0, 255'; // nur für die aktive Auswahl (Interaktionszustand)
  const NODE_RADIUS = 6;
  const HIT_RADIUS = 16;           // Bildschirm-px, unabhängig vom Zoom (Touch-Ziel)
  const LABEL_PX = 11;
  const LABEL_GAP = 5;             // Abstand Kreis → Label-Grundlinie
  const LABEL_FAMILY = '"SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace';

  // Zoom-Grenzen der Ansicht. 0.4 zeigt auch einen gewachsenen Graphen als
  // Ganzes (Überblick, Labels überlappen dann), 2.5 entzerrt den dichten Kern
  // auf dem Telefon.
  const ZOOM_MIN = 0.4;
  const ZOOM_MAX = 2.5;
  const ZOOM_STEP = 1.25;          // Knöpfe und Tastatur (+/−)
  const WHEEL_ZOOM = 0.0016;       // wie das Fraktal-Panel (exp(−deltaY · k))
  // Einpassen: nie kleiner als 0.6. Darunter wird die Feder-Ruhelänge
  // (100 Layout-px, skill-graph-sim.js) kürzer als 60 px, also kürzer als
  // ein typisches Label (6 bis 10 Zeichen ≈ 55 bis 90 px bei gedämpfter
  // Schrift) — benachbarte Labels überlappen dann systematisch, das Bild
  // wird zum Knäuel. Lieber zentriert mit Rand-Pfeilen als unlesbar.
  // Und nie größer als 1.0 — ein kleiner Graph wird nicht aufgeblasen.
  const FIT_MIN = 0.6;
  const FIT_MAX = 1;
  const FIT_PAD = 20;              // Rand in Bildschirm-px (Platz für die Rand-Pfeile)
  // Knoten und Schrift folgen dem Zoom gedämpft: beim Herauszoomen bleibt
  // die Schrift bei 0.92 × 11 px ≈ 10 px (Telefon lesbar, 0.85 ≈ 9,4 px war
  // zu klein), bei 2.5 wächst sie auf 1.3 × 11 px ≈ 14 px.
  const GLYPH_MIN = 0.92;
  const GLYPH_MAX = 1.3;

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  // Format der Fläche für die Gravitation der Engine. Labels laufen
  // waagerecht und brauchen am Rand zusätzlich Breite (ein typisches Label
  // ≈ 10 Zeichen ≈ 66 px plus Luft), darum zählt für die Knoten nur die
  // Breite abzüglich LABEL_ALLOWANCE. Begrenzt, damit sehr schmale oder
  // flache Flächen die Wolke nicht zu einer Linie quetschen.
  const LABEL_ALLOWANCE = 80;
  function layoutAspect(w, h) { return clamp(Math.max(w - LABEL_ALLOWANCE, w / 2) / h, 0.4, 2.5); }
  function glyphScale(s) { return clamp(s, GLYPH_MIN, GLYPH_MAX); }
  function labelFont(g) { return (LABEL_PX * g).toFixed(2) + 'px ' + LABEL_FAMILY; }

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

    this.abort = new AbortController();
    this.initialized = false;
    this.rafId = null;
    this.selected = null;      // hervorgehobener Knoten (nur Skills mit Knoten)
    this.current = null;       // zuletzt gewählter Skill, auch ohne Knoten (Info-Leiste)
    this.defaultInfo = this.contextLine ? this.contextLine.textContent : '';
    this.dragId = null;
    this.dragMoved = false;
    this.pointerStart = null;
    // Ansicht: Bildschirm = Layout × scale + pan
    this.scale = 1;
    this.panX = 0;
    this.panY = 0;
    // true, solange die Ansicht eingepasst ist und niemand Zoom oder Lage
    // geändert hat: nur dann passt eine Größenänderung der Fläche neu ein.
    this.fitted = false;
    this.openRaf = null;
    this.pendingAspect = null;
    this.panning = false;
    this.gesture = null;
    this.pointers = {};
    this.labelRects = [];
    this.reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    const signal = { signal: this.abort.signal };
    this.toggle.addEventListener('click', this.onToggle.bind(this), signal);
    document.addEventListener('auflinie:skill-select', this.onExternalSelect.bind(this), signal);
    document.addEventListener('visibilitychange', this.onVisibility.bind(this), signal);
    document.addEventListener('keydown', this.onKeydown.bind(this), signal);
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
        if (self.abort.signal.aborted || self.panel.hidden) { return; }
        if (!self.initialized) { self.build(); }
        if (!self.sim) { return; }
        self.syncLayout();
        // Startansicht bei JEDEM Öffnen, mit und ohne Auswahl: Layout zu Ende
        // rechnen, einmal alles einpassen. Die Auswahl wird nur hervorgehoben.
        self.settle();
        self.fit();
      });
    } else {
      if (this.openRaf !== null) { cancelAnimationFrame(this.openRaf); this.openRaf = null; }
      this.stopLoop();
    }
  };

  // Canvas-Bitmap und virtuellen Layout-Raum IMMER an die aktuelle Wrap-Größe
  // koppeln. Render und Hit-Test nutzen dieselben node.x/scale/pan -> bleiben
  // deckungsgleich, egal ob Erst-Öffnen, Wieder-Öffnen oder Viewport-Änderung.
  SkillGraph.prototype.syncLayout = function () {
    const cw = this.wrap.clientWidth, ch = this.wrap.clientHeight;
    if (!cw || !ch) { return; }
    if (this.sim && (cw !== this.canvasW || ch !== this.canvasH)) {
      this.sim.resize(cw * this.spread, ch * this.spread);   // Positionen proportional
      // Neues Format erst beim nächsten Reset übernehmen: sonst zöge schon
      // ein kleiner Knoten-Drag (Aufheizen) die ganze Wolke ins neue Format.
      this.pendingAspect = layoutAspect(cw, ch);
    }
    this.canvasW = cw;
    this.canvasH = ch;
    this.sizeCanvas();
    if (this.fitted) { this.applyFit(); } else { this.clampPan(); }
  };

  SkillGraph.prototype.build = function () {
    const dataTag = document.querySelector('script[data-skill-graph-data]');
    const data = dataTag && window.SkillGraphData.parse(dataTag, 'skill-graph');
    if (!data) { return; }

    const self = this;

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
      self.nodes.push({ id: id, label: btn.textContent.trim(), labelW: null });
    });
    this.foundations = new Set(Array.isArray(data.foundations) ? data.foundations : []);

    // Kanten: Skill-Paare mit gemeinsamen Projekten (Gewicht = Anzahl);
    // Skill→Projekte-Map über den gemeinsamen Helfer (warnt bei fehlenden
    // Pflichtfeldern und unbekannten Skill-IDs)
    const built = window.SkillGraphData.buildSkillProjects(data.projects, {
      prefix: 'skill-graph',
      knownIds: new Set(indexById.keys())
    });
    this.skillProjects = built.map;
    const edgeMap = new Map();
    built.projects.forEach(function (entry) {
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
    this.edges = Array.from(edgeMap, function (entry) {
      const parts = entry[0].split(':');
      return { source: +parts[0], target: +parts[1], weight: entry[1] };
    });

    this.neighbors = new Map();
    this.edges.forEach(function (edge) {
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
    this.sim = new window.SkillGraphSim(this.nodes, this.edges, vw, vh, { aspect: layoutAspect(w, h) });

    // Resize: Positionen proportional skalieren, kein Reheat
    // resizeTimer an der Instanz (self), damit destroy() ihn löschen kann.
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

    const canvasSignal = { signal: this.abort.signal };
    this.canvas.addEventListener('pointerdown', this.onPointerDown.bind(this), canvasSignal);
    this.canvas.addEventListener('pointermove', this.onPointerMove.bind(this), canvasSignal);
    this.canvas.addEventListener('pointerup', this.onPointerUp.bind(this), canvasSignal);
    this.canvas.addEventListener('pointercancel', this.onPointerUp.bind(this), canvasSignal);
    // touch-action wird beim Touch-KONTAKT ausgewertet — die Style-Umschaltung
    // im pointerdown desselben Fingers (onPointerDown) greift erst für SPÄTERE
    // Finger. Nicht-passiver touchstart-Handler entzieht Zwei-Finger-Gesten und
    // Knoten-Treffer dem Browser-Scroll sofort; Ein-Finger-Touch auf leerer
    // Fläche scrollt inline weiter (touch-action: pan-y bleibt wirksam).
    this.canvas.addEventListener('touchstart', this.onTouchStart.bind(this),
      { signal: this.abort.signal, passive: false });
    // Mausrad im modalen Sheet: zoomt wie im Fraktal-Panel (OVL-2), waagerecht
    // (Trackpad, Shift+Rad) verschiebt. Inline ohne Sheet scrollt das Rad
    // weiter die Seite.
    this.canvas.addEventListener('wheel', this.onWheel.bind(this),
      { signal: this.abort.signal, passive: false });
    if (this.resetBtn) {
      this.resetBtn.addEventListener('click', this.reset.bind(this), canvasSignal);
    }
    if (this.zoomInBtn) {
      this.zoomInBtn.addEventListener('click', this.zoomBy.bind(this, ZOOM_STEP), canvasSignal);
    }
    if (this.zoomOutBtn) {
      this.zoomOutBtn.addEventListener('click', this.zoomBy.bind(this, 1 / ZOOM_STEP), canvasSignal);
    }
    if (this.fitBtn) {
      this.fitBtn.addEventListener('click', this.fit.bind(this), canvasSignal);
    }
    this.reduceMotion.addEventListener('change', this.startOrStill.bind(this), { signal: this.abort.signal });
    this.initialized = true;
    // Vor dem Öffnen gewählten Chip nachziehen (sonst öffnet der Graph ohne
    // Markierung, obwohl ein Skill aktiv ist).
    if (this.pendingExternal != null) { this.setSelection(this.pendingExternal); }
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
    if (this.reduceMotion.matches) {
      this.sim.runToEnd();
      this.render();
    } else if (!this.sim.isSettled()) {
      this.loop();
    } else {
      this.render();
    }
  };

  // Layout synchron zu Ende rechnen (36 Knoten: wenige ms). Vor dem
  // Einpassen beim Öffnen und bei Reset: Die Kamera wird dann einmal auf das
  // Endlayout gesetzt und muss dem Auskühlen nicht folgen.
  SkillGraph.prototype.settle = function () {
    this.stopLoop();
    this.sim.runToEnd();
  };

  // Deterministische Kreis-Startlage im virtuellen Layout-Raum (w×h).
  // clearPins löst zusätzlich Drag-Fixierungen und nullt Geschwindigkeiten.
  SkillGraph.prototype.seedLayout = function (w, h, clearPins) {
    const count = this.nodes.length || 1;
    const radius = Math.min(w, h) * 0.36;
    this.nodes.forEach(function (node, i) {
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
  };

  // Reset: Fixierungen lösen, Knoten auf die deterministische Kreis-Startlage
  // zurücksetzen, Sim neu aufheizen, Auswahl lösen, Ansicht einpassen.
  SkillGraph.prototype.reset = function () {
    if (!this.sim) { return; }
    if (this.pendingAspect !== null) {
      this.sim.opts.aspect = this.pendingAspect;
      this.pendingAspect = null;
    }
    this.seedLayout(this.sim.width, this.sim.height, true);
    this.sim.alpha = 1;
    if (this.selected !== null || this.current !== null) {
      this.setSelection(null);
      this.dispatch();
    }
    this.settle();
    this.fit();
  };

  SkillGraph.prototype.loop = function () {
    const self = this;
    this.rafId = requestAnimationFrame(function () {
      const moving = self.sim.tick();
      self.render();   // Kamera bleibt stehen, nur die Knoten schwingen nach
      if (moving && !self.panel.hidden) {
        self.loop();
      } else {
        self.rafId = null;
      }
    });
  };

  SkillGraph.prototype.stopLoop = function () {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  };

  // Persistent-Shell-Teardown (spa:unload): alle dokumentweiten Ressourcen lösen.
  // this.abort deckt die per {signal} gebundenen Listener ab (Toggle, Canvas-
  // Pointer, Kopfleisten-Knöpfe, document skill-select/visibilitychange/
  // keydown, reduceMotion); Observer/rAF/Resize-Timer separat. Guards, falls
  // der Konstruktor früh zurückkehrte (fehlende Elemente) oder build() nie lief.
  SkillGraph.prototype.destroy = function () {
    if (this.abort) { this.abort.abort(); }
    if (this.openRaf != null) { cancelAnimationFrame(this.openRaf); this.openRaf = null; }
    this.stopLoop();
    if (this.observer) { this.observer.disconnect(); this.observer = null; }
    if (this.resizeTimer) { clearTimeout(this.resizeTimer); this.resizeTimer = null; }
  };

  SkillGraph.prototype.onVisibility = function () {
    if (document.hidden) {
      this.stopLoop();
    } else if (!this.panel.hidden && this.sim && !this.sim.isSettled()) {
      this.startOrStill();
    }
  };

  SkillGraph.prototype.onKeydown = function (event) {
    if (this.panel.hidden) { return; }
    if (event.key === 'Escape') {
      if (this.selected !== null) {
        this.setSelection(null);
        this.dispatch();
      }
      return;
    }
    // Tastatur-Zoom bei Fokus im Panel: + / − / 0 (Einpassen). Im modalen
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

  // Bildschirm-Rechteck eines Labels in einer von vier Lagen: 'up' (über
  // dem Knoten, Regel), 'down' (darunter), 'right' und 'left' (seitlich,
  // nur wenn oben und unten belegt sind) — EINE Quelle für Zeichnen,
  // Kollisionsprüfung, Hit-Test und Einpassen. tx = Mitte des Texts.
  SkillGraph.prototype.labelRect = function (sx, sy, node, g, pos) {
    const w = this.labelWidth(node) * g;
    const fontPx = LABEL_PX * g;
    const off = (NODE_RADIUS + LABEL_GAP) * g;
    let base = sy - off, tx = sx;
    if (pos === 'down') {
      base = sy + off + fontPx * 0.8;
    } else if (pos === 'right' || pos === 'left') {
      base = sy + fontPx * 0.35;
      tx = pos === 'right' ? sx + off + w / 2 : sx - off - w / 2;
    }
    return { x: tx - w / 2 - 2, y: base - fontPx, w: w + 4, h: fontPx + 3, base: base, tx: tx };
  };

  // Ausdehnung aller Knoten samt Label (Lagen oben und unten) bei Maßstab s,
  // relativ zu pan = 0. Seitliche Lagen zählen nicht: sie werden nur gesetzt,
  // wenn sie ganz in die Fläche passen (render).
  SkillGraph.prototype.extents = function (s) {
    const g = glyphScale(s);
    const rad = NODE_RADIUS * g;
    const self = this;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    this.nodes.forEach(function (n) {
      const sx = n.x * s, sy = n.y * s;
      const up = self.labelRect(sx, sy, n, g, 'up');
      const down = self.labelRect(sx, sy, n, g, 'down');
      minX = Math.min(minX, up.x, sx - rad);
      maxX = Math.max(maxX, up.x + up.w, sx + rad);
      minY = Math.min(minY, up.y);
      maxY = Math.max(maxY, down.y + down.h);
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

  // Alles einpassen (Maßstab nach fitScale, Ausdehnung mittig)
  SkillGraph.prototype.applyFit = function () {
    if (!this.nodes || !this.nodes.length || !this.canvasW) { return; }
    this.scale = this.fitScale();
    const e = this.extents(this.scale);
    this.panX = this.canvasW / 2 - (e.minX + e.maxX) / 2;
    this.panY = this.canvasH / 2 - (e.minY + e.maxY) / 2;
    this.clampPan();
  };

  // Einpassen-Knopf / Taste 0
  SkillGraph.prototype.fit = function () {
    if (!this.sim) { return; }
    this.applyFit();
    this.fitted = true;
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
    this.fitted = false;
    this.clampPan();
    this.render();
  };

  SkillGraph.prototype.zoomBy = function (factor) {
    if (!this.sim) { return; }
    this.zoomAt(factor, this.canvasW / 2, this.canvasH / 2);
  };

  // Pan begrenzen: mindestens PAD px der Knoten-Wolke bleiben je Seite sichtbar.
  SkillGraph.prototype.clampPan = function () {
    if (!this.nodes || !this.nodes.length) { return; }
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    this.nodes.forEach(function (n) {
      if (n.x < minX) { minX = n.x; }
      if (n.x > maxX) { maxX = n.x; }
      if (n.y < minY) { minY = n.y; }
      if (n.y > maxY) { maxY = n.y; }
    });
    const s = this.scale;
    const w = this.canvasW || this.wrap.clientWidth;
    const h = this.canvasH || this.wrap.clientHeight;
    const pad = 60;
    let minPanX = pad - maxX * s, maxPanX = (w - pad) - minX * s;
    let minPanY = pad - maxY * s, maxPanY = (h - pad) - minY * s;
    if (minPanX > maxPanX) { minPanX = maxPanX = (minPanX + maxPanX) / 2; }
    if (minPanY > maxPanY) { minPanY = maxPanY = (minPanY + maxPanY) / 2; }
    this.panX = clamp(this.panX, minPanX, maxPanX);
    this.panY = clamp(this.panY, minPanY, maxPanY);
  };

  // ── Zeichnen ────────────────────────────────────────────────────────────────

  SkillGraph.prototype.render = function () {
    if (!this.ctx || !this.sim) { return; }
    const ctx = this.ctx;
    const nodes = this.nodes;
    const selected = this.selected;
    const neighbors = selected !== null ? (this.neighbors.get(selected) || new Set()) : null;
    const g = glyphScale(this.scale);
    const radius = NODE_RADIUS * g;
    const self = this;

    // Vollflächig löschen unabhängig von der DPR-Rundung — sonst bleibt am
    // rechten/unteren Rand eine Subpixel-Spalte mit Geister-Pixeln stehen.
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.restore();

    // Alles in Bildschirm-Koordinaten zeichnen (kein ctx.scale): Linien bleiben
    // 1 px, Knoten und Schrift folgen dem Zoom gedämpft (glyphScale).
    const screen = nodes.map(function (n) { return self.toScreen(n); });

    // Kanten: Deckkraft nach Gewicht; bei Auswahl nur die Nachbarschaft betonen
    this.edges.forEach(function (edge) {
      const a = nodes[edge.source];
      const b = nodes[edge.target];
      let alpha = 0.12 + Math.min(edge.weight - 1, 3) * 0.06;
      if (selected !== null) {
        const touches = a.id === selected || b.id === selected;
        alpha = touches ? 0.4 : alpha * 0.25;
      }
      const pa = screen[edge.source], pb = screen[edge.target];
      ctx.strokeStyle = 'rgba(' + CYAN + ', ' + alpha + ')';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(pa.x, pa.y);
      ctx.lineTo(pb.x, pb.y);
      ctx.stroke();
    });

    // Zustand je Knoten und Beschriftung. Ein Label steht über dem Knoten,
    // überlappt es dort ein schon gesetztes, darunter, sonst rechts oder
    // links daneben (seitlich nur, wenn es ganz in die Fläche passt). Ohne
    // Auswahl bekommt jeder Knoten sein Label (sind alle Lagen belegt, die
    // mit der kleinsten Überdeckung). Mit Auswahl zuerst der gewählte Skill
    // und seine Nachbarn (immer beschriftet), danach die übrigen nur, wenn
    // eine Lage frei ist — sonst bleiben sie Punkte.
    const states = nodes.map(function (node) {
      if (selected === null) { return 'base'; }
      if (node.id === selected) { return 'selected'; }
      return neighbors.has(node.id) ? 'related' : 'dimmed';
    });
    const order = nodes.map(function (n, i) { return i; });
    if (selected !== null) {
      const rank = { selected: 0, related: 1, dimmed: 2 };
      order.sort(function (a, b) { return rank[states[a]] - rank[states[b]] || a - b; });
    }
    const placed = [];
    // Überdeckte Fläche mit allen schon gesetzten Labels (0 = frei)
    const overlapArea = function (r) {
      let sum = 0;
      placed.forEach(function (p) {
        const ox = Math.min(r.x + r.w, p.x + p.w) - Math.max(r.x, p.x);
        const oy = Math.min(r.y + r.h, p.y + p.h) - Math.max(r.y, p.y);
        if (ox > 0 && oy > 0) { sum += ox * oy; }
      });
      return sum;
    };
    const cw = this.canvasW, ch = this.canvasH;
    const inside = function (r) { return r.x >= 0 && r.x + r.w <= cw && r.y >= 0 && r.y + r.h <= ch; };
    const showLabel = new Array(nodes.length);
    const LAGEN = ['up', 'down', 'right', 'left'];
    order.forEach(function (i) {
      let r = null, best = null, bestArea = Infinity;
      for (let k = 0; k < LAGEN.length && !r; k++) {
        const cand = self.labelRect(screen[i].x, screen[i].y, nodes[i], g, LAGEN[k]);
        if (k >= 2 && !inside(cand)) { continue; }   // seitlich nur ganz im Bild
        const area = overlapArea(cand);
        if (area === 0) { r = cand; } else if (area < bestArea) { best = cand; bestArea = area; }
      }
      if (!r && states[i] !== 'dimmed') { r = best; }
      showLabel[i] = r;
      if (r) { r.id = nodes[i].id; placed.push(r); }
    });
    this.labelRects = placed;   // Hit-Test trifft nur sichtbare Labels

    ctx.font = labelFont(g);
    ctx.textAlign = 'center';
    nodes.forEach(function (node, i) {
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
      ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgb(10 14 18)';
      ctx.fill();
      if (state === 'selected') {
        ctx.strokeStyle = 'rgba(' + MAGENTA + ', 0.85)';
      } else {
        ctx.strokeStyle = 'rgba(' + CYAN + ', ' + (state === 'related' ? 0.6 : 0.3) + ')';
      }
      ctx.lineWidth = state === 'selected' ? 2 : 1.25;
      ctx.stroke();
      ctx.shadowBlur = 0;
      const label = showLabel[i];
      if (label) {
        if (state === 'selected') {
          // Dezenter Schimmer am Label des gewählten Knotens (Magenta = Auswahl)
          ctx.shadowColor = 'rgba(' + MAGENTA + ', 0.55)';
          ctx.shadowBlur = 6;
          ctx.fillStyle = 'rgba(255, 255, 255, 0.98)';
        } else {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        }
        ctx.fillText(node.label, label.tx, label.base);
      }
      ctx.restore();
    });

    this.drawEdgeHints(screen, showLabel);   // Rand-Pfeile: „hier geht's weiter“
    this.publishView();
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
    if (left) { chevron(10, h / 2, -1, 0); }
    if (right) { chevron(w - 10, h / 2, 1, 0); }
    if (top) { chevron(w / 2, 10, 0, -1); }
    if (bottom) { chevron(w / 2, h - 10, 0, 1); }
    ctx.restore();
  };

  // Ansichtszustand als Attribute am Canvas (Maßstab, Knoten außerhalb bzw.
  // angeschnitten, Bildschirmlage des gewählten Knotens) — für Tests und
  // Entwickler-Werkzeuge, ändert nichts an der Darstellung. Dazu die
  // Zoom-Knöpfe an den Grenzen als aria-disabled (Rückmeldung für Tastatur
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
    put(this.zoomInBtn, 'aria-disabled', this.scale >= ZOOM_MAX - 1e-6 ? 'true' : null);
    put(this.zoomOutBtn, 'aria-disabled', this.scale <= ZOOM_MIN + 1e-6 ? 'true' : null);
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

  SkillGraph.prototype.nodeById = function (id) {
    if (!this.nodes) { return null; }
    for (let i = 0; i < this.nodes.length; i++) {
      if (this.nodes[i].id === id) { return this.nodes[i]; }
    }
    return null;
  };

  // Treffer in Bildschirm-Koordinaten: nächster Knoten im HIT_RADIUS, sonst
  // ein SICHTBARES Label (Rechtecke aus dem letzten render).
  SkillGraph.prototype.hitTest = function (x, y) {
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
    if (hit !== null) { return hit; }
    for (let i = this.labelRects.length - 1; i >= 0; i--) {
      const r = this.labelRects[i];
      if (x >= r.x - 2 && x <= r.x + r.w + 2 && y >= r.y - 2 && y <= r.y + r.h + 2) { return r.id; }
    }
    return null;
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
    if (Math.abs(dx) > Math.abs(dy)) {
      // Waagerechtes Wischen (Trackpad) verschiebt
      this.panX -= dx;
      this.fitted = false;
      this.clampPan();
      this.render();
      return;
    }
    // Senkrechtes Rad zoomt um den Mauszeiger (wie im Fraktal-Panel, OVL-2)
    const pos = this.canvasPos(event);
    this.zoomAt(Math.exp(-dy * WHEEL_ZOOM), pos.x, pos.y);
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
      this.dragId = null;
      this.startGesture();
      try { this.canvas.style.touchAction = 'none'; } catch (e) { /* noop */ }
      return;
    }

    const pos = this.pointers[event.pointerId];
    const hit = this.hitTest(pos.x, pos.y);
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

    // Hover-Cursor (Maus): über einem Knoten -> Klick-Finger, sonst Greif-Hand.
    if (!this.panning && this.dragId === null && event.pointerType === 'mouse' && this.sim) {
      const hover = this.canvasPos(event);
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
      this.fitted = false;
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
    if (this.reduceMotion.matches) {
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
    try { this.canvas.releasePointerCapture(event.pointerId); } catch (e) { /* noop */ }
    try { this.canvas.style.cursor = 'grab'; } catch (e) { /* noop */ }
    this.dragId = null;
    this.dragMoved = false;
    this.pointerStart = null;
  };

  // ── Auswahl ─────────────────────────────────────────────────────────────────

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
    const label = skillId !== null && this.chipLabels ? this.chipLabels.get(skillId) : null;
    if (!label) {
      el.textContent = this.defaultInfo;
      el.classList.remove('is-active');
      return;
    }
    const projects = (this.skillProjects && this.skillProjects.get(skillId)) || [];
    const kind = this.foundations && this.foundations.has(skillId) ? 'foundation' : 'plain';
    window.SkillGraphData.renderSelection(el, label, projects, kind);
    // Magenta-Hairline wie .has-selection an der Konsole: nur mit Projekten
    el.classList.toggle('is-active', projects.length > 0);
  };

  SkillGraph.prototype.dispatch = function () {
    document.dispatchEvent(new CustomEvent('auflinie:skill-select', {
      detail: { skill: this.current, source: SOURCE }
    }));
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

  // ── Persistent-Shell-Kontrakt (spa-nav.js, siehe docs/features/spa-nav.md) ─────────
  let instances = [];

  function mountGraph(root) {
    const scope = root || document;
    if (typeof window.SkillGraphSim === 'undefined') {
      console.warn('skill-graph: Engine skill-graph-sim.js fehlt — Panel bleibt inaktiv');
      return;
    }
    scope.querySelectorAll('[data-skill-graph]').forEach(function (el) {
      if (el.hasAttribute('data-skill-graph-mounted')) { return; }   // idempotent
      el.setAttribute('data-skill-graph-mounted', '');
      instances.push(new SkillGraph(el));
    });
  }

  function teardownGraph() {
    instances.forEach(function (g) { if (g && g.destroy) { g.destroy(); } });
    instances = [];
  }

  window.spaModule({ name: 'skill-graph', mount: mountGraph, teardown: teardownGraph });
})();
