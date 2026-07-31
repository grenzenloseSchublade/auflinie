/**
 * Skill-Graph-Panel — experimentelle Canvas-Ansicht (Stufe 2 des Skill-Features)
 *
 * Zuständigkeit: nur UI. Toggle, Canvas-Rendering, Klick-Interaktion und
 * Synchronisation mit der Chip-Liste. Die Physik liegt vollständig in der
 * DOM-freien Engine skill-graph-sim.js (window.SkillGraphSim) — Rendering
 * und Layout sind bewusst getrennt, damit sich das Feature weiterentwickeln
 * lässt (Worker-Offload, Projekt-Knoten, Drag), ohne beides anzufassen.
 *
 * Daten: dasselbe JSON-Tag [data-skill-graph-data] wie Stufe 1
 * (_data/skill_graph.yml, Schema v1). Knoten = Skills aus den DOM-Chips
 * (Reihenfolge = Gruppenreihenfolge), Kanten = gemeinsame Projekte.
 *
 * Verhalten: Lazy-Init beim ersten Öffnen; rAF-Loop endet beim Auskühlen
 * (< 5 s) sowie bei visibilitychange/Zuklappen; prefers-reduced-motion
 * rechnet das Layout synchron vor und zeigt ein Standbild. Auswahl läuft
 * über den Event-Vertrag `auflinie:skill-select` (source 'graph').
 * Farben: Cyan-only auf dem Canvas — Magenta bleibt DOM-Fokusringen
 * vorbehalten (Design-Regel).
 */
(function () {
  'use strict';

  var SOURCE = 'graph';
  var CYAN = '5, 217, 232';
  var MAGENTA = '255, 0, 255'; // nur für die aktive Auswahl (Interaktionszustand)
  var NODE_RADIUS = 6;
  var HIT_RADIUS = 16;

  function parseData(tag) {
    var data;
    try {
      data = JSON.parse(tag.textContent);
    } catch (e) {
      console.warn('skill-graph: skill_graph-Daten nicht lesbar', e);
      return null;
    }
    if (!data || data.version !== 1 || !Array.isArray(data.projects)) {
      console.warn('skill-graph: unbekanntes skill_graph-Schema (erwartet version: 1)');
      return null;
    }
    return data;
  }

  function SkillGraph(root) {
    this.root = root;
    this.toggle = root.querySelector('[data-role="graph-toggle"]');
    this.panel = root.querySelector('[data-role="graph-panel"]');
    this.canvas = root.querySelector('[data-role="canvas"]');
    this.wrap = root.querySelector('[data-role="canvas-wrap"]');
    this.contextLine = root.querySelector('[data-role="graph-context"]');
    if (!this.toggle || !this.panel || !this.canvas || !this.wrap) { return; }

    this.abort = new AbortController();
    this.initialized = false;
    this.rafId = null;
    this.selected = null;
    this.dragId = null;
    this.dragMoved = false;
    this.pointerStart = null;
    this.reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    var signal = { signal: this.abort.signal };
    this.toggle.addEventListener('click', this.onToggle.bind(this), signal);
    document.addEventListener('auflinie:skill-select', this.onExternalSelect.bind(this), signal);
    document.addEventListener('visibilitychange', this.onVisibility.bind(this), signal);
    document.addEventListener('keydown', this.onKeydown.bind(this), signal);
  }

  SkillGraph.prototype.onToggle = function () {
    var open = this.panel.hidden;
    this.panel.hidden = !open;
    this.toggle.setAttribute('aria-expanded', String(open));
    this.toggle.textContent = open ? 'Graph ausblenden' : 'Graph anzeigen';
    if (open) {
      if (!this.initialized) { this.build(); }
      this.sizeCanvas();
      this.startOrStill();
    } else {
      this.stopLoop();
    }
  };

  SkillGraph.prototype.build = function () {
    var dataTag = document.querySelector('script[data-skill-graph-data]');
    var data = dataTag && parseData(dataTag);
    if (!data) { return; }

    var self = this;

    // Nur verbundene Skills werden Knoten: erst die IDs sammeln, die in
    // mindestens einem Projekt vorkommen. Basis-Skills (foundations) und
    // projektlose Breite-Chips bleiben bewusst außen vor — sonst schweben
    // sie kantenlos herum und überfüllen die Fläche.
    var connected = new Set();
    data.projects.forEach(function (project) {
      if (project && Array.isArray(project.skills)) {
        project.skills.forEach(function (id) { connected.add(id); });
      }
    });

    // Knoten aus den DOM-Chips (deterministische Reihenfolge), gefiltert auf verbundene
    var buttons = document.querySelectorAll('.cv-skill-chip__button[data-skill]');
    var indexById = new Map();
    this.nodes = [];
    Array.prototype.forEach.call(buttons, function (btn) {
      var id = btn.getAttribute('data-skill');
      if (!connected.has(id) || indexById.has(id)) { return; }
      indexById.set(id, self.nodes.length);
      self.nodes.push({ id: id, label: btn.textContent.trim() });
    });

    // Kanten: Skill-Paare mit gemeinsamen Projekten (Gewicht = Anzahl);
    // Nachbarschaft + Projektlisten fürs Kontext-Panel gleich mitsammeln
    var edgeMap = new Map();
    this.skillProjects = new Map();
    data.projects.forEach(function (project) {
      if (!project || !project.id || !project.label || !Array.isArray(project.skills)) { return; }
      var ids = project.skills.filter(function (id) {
        if (!indexById.has(id)) {
          console.warn('skill-graph: skill_graph.yml referenziert unbekannten Skill "' + id + '"');
          return false;
        }
        return true;
      });
      ids.forEach(function (id) {
        if (!self.skillProjects.has(id)) { self.skillProjects.set(id, []); }
        self.skillProjects.get(id).push(project);
      });
      for (var i = 0; i < ids.length; i++) {
        for (var j = i + 1; j < ids.length; j++) {
          var a = indexById.get(ids[i]);
          var b = indexById.get(ids[j]);
          var key = Math.min(a, b) + ':' + Math.max(a, b);
          edgeMap.set(key, (edgeMap.get(key) || 0) + 1);
        }
      }
    });
    this.edges = Array.from(edgeMap, function (entry) {
      var parts = entry[0].split(':');
      return { source: +parts[0], target: +parts[1], weight: entry[1] };
    });

    this.neighbors = new Map();
    this.edges.forEach(function (edge) {
      var s = self.nodes[edge.source].id;
      var t = self.nodes[edge.target].id;
      if (!self.neighbors.has(s)) { self.neighbors.set(s, new Set()); }
      if (!self.neighbors.has(t)) { self.neighbors.set(t, new Set()); }
      self.neighbors.get(s).add(t);
      self.neighbors.get(t).add(s);
    });

    // Deterministische Kreis-Startpositionen
    var w = this.wrap.clientWidth || 600;
    var h = this.wrap.clientHeight || 380;
    var radius = Math.min(w, h) * 0.36;
    this.nodes.forEach(function (node, i) {
      var angle = (i / self.nodes.length) * Math.PI * 2 - Math.PI / 2;
      node.x = w / 2 + Math.cos(angle) * radius;
      node.y = h / 2 + Math.sin(angle) * radius;
    });
    this.sim = new window.SkillGraphSim(this.nodes, this.edges, w, h);

    // Resize: Positionen proportional skalieren, kein Reheat
    var resizeTimer = null;
    this.observer = new ResizeObserver(function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        if (self.panel.hidden) { return; }
        var cw = self.wrap.clientWidth;
        var ch = self.wrap.clientHeight;
        if (cw && ch && (cw !== self.sim.width || ch !== self.sim.height)) {
          self.sim.resize(cw, ch);
          self.sizeCanvas();
          self.render();
        }
      }, 150);
    });
    this.observer.observe(this.wrap);

    var canvasSignal = { signal: this.abort.signal };
    this.canvas.addEventListener('pointerdown', this.onPointerDown.bind(this), canvasSignal);
    this.canvas.addEventListener('pointermove', this.onPointerMove.bind(this), canvasSignal);
    this.canvas.addEventListener('pointerup', this.onPointerUp.bind(this), canvasSignal);
    this.canvas.addEventListener('pointercancel', this.onPointerUp.bind(this), canvasSignal);
    this.reduceMotion.addEventListener('change', this.startOrStill.bind(this), { signal: this.abort.signal });
    this.initialized = true;
  };

  SkillGraph.prototype.sizeCanvas = function () {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = this.wrap.clientWidth;
    var h = this.wrap.clientHeight;
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

  SkillGraph.prototype.loop = function () {
    var self = this;
    this.rafId = requestAnimationFrame(function () {
      var moving = self.sim.tick();
      self.render();
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

  SkillGraph.prototype.onVisibility = function () {
    if (document.hidden) {
      this.stopLoop();
    } else if (!this.panel.hidden && this.sim && !this.sim.isSettled()) {
      this.startOrStill();
    }
  };

  SkillGraph.prototype.onKeydown = function (event) {
    if (event.key === 'Escape' && this.selected !== null && !this.panel.hidden) {
      this.setSelection(null);
      this.dispatch();
    }
  };

  SkillGraph.prototype.render = function () {
    if (!this.ctx || !this.sim) { return; }
    var ctx = this.ctx;
    var nodes = this.nodes;
    var selected = this.selected;
    var neighbors = selected !== null ? (this.neighbors.get(selected) || new Set()) : null;
    ctx.clearRect(0, 0, this.sim.width, this.sim.height);

    // Kanten: Deckkraft nach Gewicht; bei Auswahl nur die Nachbarschaft betonen
    var self = this;
    this.edges.forEach(function (edge) {
      var a = nodes[edge.source];
      var b = nodes[edge.target];
      var alpha = 0.12 + Math.min(edge.weight - 1, 3) * 0.06;
      if (selected !== null) {
        var touches = a.id === selected || b.id === selected;
        alpha = touches ? 0.4 : alpha * 0.25;
      }
      ctx.strokeStyle = 'rgba(' + CYAN + ', ' + alpha + ')';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    });

    ctx.font = '11px "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace';
    ctx.textAlign = 'center';
    nodes.forEach(function (node) {
      var state = 'base';
      if (selected !== null) {
        if (node.id === selected) { state = 'selected'; } else if (neighbors.has(node.id)) { state = 'related'; } else { state = 'dimmed'; }
      }

      var nodeAlpha = state === 'dimmed' ? 0.3 : 1;
      ctx.save();
      ctx.globalAlpha = nodeAlpha;
      if (state === 'selected') {
        // Aktive Auswahl = Interaktionszustand ⇒ Magenta (wie in der Chip-Liste)
        ctx.shadowColor = 'rgba(' + MAGENTA + ', 0.5)';
        ctx.shadowBlur = 10;
      }
      ctx.beginPath();
      ctx.arc(node.x, node.y, NODE_RADIUS, 0, Math.PI * 2);
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
      if (state === 'selected') {
        // Dezenter Schimmer am Label des gewählten Knotens (Magenta = Auswahl)
        ctx.shadowColor = 'rgba(' + MAGENTA + ', 0.55)';
        ctx.shadowBlur = 6;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.98)';
      } else {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      }
      ctx.fillText(node.label, node.x, node.y - NODE_RADIUS - 5);
      ctx.restore();
    });
    void self;
  };

  SkillGraph.prototype.canvasPos = function (event) {
    var rect = this.canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  SkillGraph.prototype.nodeById = function (id) {
    for (var i = 0; i < this.nodes.length; i++) {
      if (this.nodes[i].id === id) { return this.nodes[i]; }
    }
    return null;
  };

  // Treffer: nächster Knoten im HIT_RADIUS oder dessen Label (zentriert darüber)
  SkillGraph.prototype.hitTest = function (x, y) {
    var ctx = this.ctx;
    var hit = null;
    var best = HIT_RADIUS * HIT_RADIUS;
    this.nodes.forEach(function (node) {
      var dx = node.x - x;
      var dy = node.y - y;
      var d = dx * dx + dy * dy;
      if (d <= best) { best = d; hit = node.id; }

      // Auch das Label ist Trefferfläche (Text sitzt zentriert über dem Knoten)
      if (hit !== node.id && ctx) {
        var w = ctx.measureText(node.label).width;
        var labelBottom = node.y - NODE_RADIUS - 5;
        if (x >= node.x - w / 2 - 4 && x <= node.x + w / 2 + 4 &&
            y >= labelBottom - 13 && y <= labelBottom + 3) {
          hit = node.id;
          best = 0;
        }
      }
    });
    return hit;
  };

  SkillGraph.prototype.onPointerDown = function (event) {
    if (!this.sim || this.panel.hidden) { return; }
    var pos = this.canvasPos(event);
    this.pointerStart = pos;
    this.dragId = this.hitTest(pos.x, pos.y);
    this.dragMoved = false;
    if (this.dragId !== null) {
      try { this.canvas.setPointerCapture(event.pointerId); } catch (e) { /* noop */ }
    }
  };

  SkillGraph.prototype.onPointerMove = function (event) {
    if (this.dragId === null || !this.pointerStart) { return; }
    var pos = this.canvasPos(event);
    if (!this.dragMoved) {
      var dx = pos.x - this.pointerStart.x;
      var dy = pos.y - this.pointerStart.y;
      if (dx * dx + dy * dy < 25) { return; } // 5px-Schwelle: darunter bleibt es ein Klick
      this.dragMoved = true;
    }
    if (event.cancelable) { event.preventDefault(); }
    var node = this.nodeById(this.dragId);
    if (!node) { return; }
    // An den Cursor pinnen: die Sim hält fx/fy fest (siehe skill-graph-sim.js)
    node.fx = pos.x;
    node.fy = pos.y;
    if (this.reduceMotion.matches) {
      node.x = pos.x; node.y = pos.y; node.vx = 0; node.vy = 0;
      this.render();
    } else {
      this.sim.alpha = Math.max(this.sim.alpha, 0.35);
      this.startOrStill();
    }
  };

  SkillGraph.prototype.onPointerUp = function (event) {
    if (this.dragId === null) { this.pointerStart = null; return; }
    if (!this.dragMoved) {
      // Kein echtes Ziehen → als Klick behandeln (Auswahl togglen)
      var hit = this.dragId;
      this.setSelection(hit === this.selected ? null : hit);
      this.dispatch();
    }
    // War es ein Drag: fx/fy bleiben gesetzt → der Knoten bleibt liegen
    // (manuelles Entwirren; die übrigen Knoten haben sich darum entspannt).
    try { this.canvas.releasePointerCapture(event.pointerId); } catch (e) { /* noop */ }
    this.dragId = null;
    this.dragMoved = false;
    this.pointerStart = null;
  };

  SkillGraph.prototype.setSelection = function (skillId) {
    this.selected = skillId;
    if (this.contextLine) {
      if (skillId === null) {
        // Platz bleibt reserviert (feste Höhe) — nur der Text wechselt
        this.contextLine.textContent = '';
      } else {
        var node = this.nodes.find(function (n) { return n.id === skillId; });
        var projects = (this.skillProjects && this.skillProjects.get(skillId)) || [];
        this.contextLine.textContent = projects.length
          ? node.label + ' — gemeinsam im Einsatz bei: ' + projects.map(function (p) { return p.label; }).join(', ')
          : node.label + ' — noch keine Projektzuordnung hinterlegt.';
      }
    }
    if (this.initialized && !this.panel.hidden) { this.render(); }
  };

  SkillGraph.prototype.dispatch = function () {
    document.dispatchEvent(new CustomEvent('auflinie:skill-select', {
      detail: { skill: this.selected, source: SOURCE }
    }));
  };

  SkillGraph.prototype.onExternalSelect = function (event) {
    if (!event.detail || event.detail.source === SOURCE) { return; }
    if (event.detail.skill !== this.selected && this.initialized) {
      this.setSelection(event.detail.skill);
    }
  };

  function initAll() {
    if (typeof window.SkillGraphSim === 'undefined') {
      console.warn('skill-graph: Engine skill-graph-sim.js fehlt — Panel bleibt inaktiv');
      return;
    }
    document.querySelectorAll('[data-skill-graph]').forEach(function (root) {
      new SkillGraph(root);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }
})();
