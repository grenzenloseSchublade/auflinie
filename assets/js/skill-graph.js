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
    this.resetBtn = root.querySelector('[data-role="graph-reset"]');
    if (!this.toggle || !this.panel || !this.canvas || !this.wrap) { return; }

    this.abort = new AbortController();
    this.initialized = false;
    this.rafId = null;
    this.selected = null;
    this.dragId = null;
    this.dragMoved = false;
    this.pointerStart = null;
    // Pan (verschiebbares Fenster in den größeren Layout-Raum): Zwei-Finger
    // (Touch) bzw. Maus-Drag auf leere Fläche. Knoten-Drag bleibt wie gehabt.
    this.panX = 0;
    this.panY = 0;
    this.panning = false;
    this.pointers = {};
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

    // Größerer virtueller Layout-Raum: dieselbe Physik, aber mehr Platz, damit
    // sich die Knoten verteilen statt am Rand zu stauen. Der Canvas ist ein
    // verschiebbares Fenster (Pan) in diese Fläche.
    var w = this.wrap.clientWidth || 600;
    var h = this.wrap.clientHeight || 380;
    this.canvasW = w;
    this.canvasH = h;
    this.spread = Math.max(1.4, Math.min(2.5, this.nodes.length / 6));
    var vw = w * this.spread;
    var vh = h * this.spread;
    var radius = Math.min(vw, vh) * 0.36;
    this.nodes.forEach(function (node, i) {
      var angle = (i / self.nodes.length) * Math.PI * 2 - Math.PI / 2;
      node.x = vw / 2 + Math.cos(angle) * radius;
      node.y = vh / 2 + Math.sin(angle) * radius;
    });
    this.sim = new window.SkillGraphSim(this.nodes, this.edges, vw, vh);
    // Pan so, dass die virtuelle Mitte im Canvas zentriert startet.
    this.panX = (w - vw) / 2;
    this.panY = (h - vh) / 2;

    // Resize: Positionen proportional skalieren, kein Reheat
    // resizeTimer an der Instanz (self), damit destroy() ihn löschen kann.
    this.resizeTimer = null;
    this.observer = new ResizeObserver(function () {
      clearTimeout(self.resizeTimer);
      self.resizeTimer = setTimeout(function () {
        if (self.panel.hidden) { return; }
        var cw = self.wrap.clientWidth;
        var ch = self.wrap.clientHeight;
        if (cw && ch && (cw !== self.canvasW || ch !== self.canvasH)) {
          self.canvasW = cw;
          self.canvasH = ch;
          var nvw = cw * self.spread;
          var nvh = ch * self.spread;
          self.sim.resize(nvw, nvh);
          self.panX = (cw - nvw) / 2;
          self.panY = (ch - nvh) / 2;
          self.clampPan();
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
    if (this.resetBtn) {
      this.resetBtn.addEventListener('click', this.reset.bind(this), canvasSignal);
    }
    this.reduceMotion.addEventListener('change', this.startOrStill.bind(this), { signal: this.abort.signal });
    this.initialized = true;
    // Vor dem Öffnen gewählten Chip nachziehen (sonst öffnet der Graph ohne
    // Markierung, obwohl ein Skill aktiv ist).
    if (this.pendingExternal != null) { this.setSelection(this.pendingExternal); }
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

  // Layout zurücksetzen: Fixierungen lösen, Knoten auf die deterministische
  // Kreis-Startlage zurücksetzen, Sim neu aufheizen.
  SkillGraph.prototype.reset = function () {
    if (!this.sim) { return; }
    var w = this.sim.width;
    var h = this.sim.height;
    var radius = Math.min(w, h) * 0.36;
    // Ansicht wieder auf die virtuelle Mitte zentrieren (Pan zurücksetzen).
    this.panX = ((this.canvasW || w) - w) / 2;
    this.panY = ((this.canvasH || h) - h) / 2;
    var count = this.nodes.length || 1;
    this.nodes.forEach(function (node, i) {
      node.fx = null;
      node.fy = null;
      node.vx = 0;
      node.vy = 0;
      var angle = (i / count) * Math.PI * 2 - Math.PI / 2;
      node.x = w / 2 + Math.cos(angle) * radius;
      node.y = h / 2 + Math.sin(angle) * radius;
    });
    this.sim.alpha = 1;
    if (this.selected !== null) {
      this.setSelection(null);
      this.dispatch();
    }
    this.startOrStill();
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

  // Persistent-Shell-Teardown (spa:unload): alle dokumentweiten Ressourcen lösen.
  // this.abort deckt die per {signal} gebundenen Listener ab (Toggle, Canvas-
  // Pointer, document skill-select/visibilitychange/keydown, reduceMotion);
  // Observer/rAF/Resize-Timer separat. Guards, falls der Konstruktor früh
  // zurückkehrte (fehlende Elemente) oder build() nie lief.
  SkillGraph.prototype.destroy = function () {
    if (this.abort) { this.abort.abort(); }
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

    // Vollflächig löschen unabhängig von der DPR-Rundung — sonst bleibt am
    // rechten/unteren Rand eine Subpixel-Spalte mit Geister-Pixeln stehen.
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.restore();

    // Pan-Offset: Knoten/Kanten im verschobenen Fenster zeichnen.
    ctx.save();
    ctx.translate(this.panX || 0, this.panY || 0);

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

    ctx.restore();            // Pan-Transform zurück -> Screen-Space
    this.drawEdgeHints();     // Rand-Chevrons: "hier geht's weiter"
    void self;
  };

  // Liegen Knoten außerhalb des sichtbaren Fensters, deutet ein dezenter Pfeil
  // "hier geht's weiter" an. Screen-Space (nach dem Pan-restore gezeichnet).
  SkillGraph.prototype.drawEdgeHints = function () {
    var ctx = this.ctx;
    if (!ctx) { return; }
    var w = this.canvasW || this.wrap.clientWidth;
    var h = this.canvasH || this.wrap.clientHeight;
    var px = this.panX || 0, py = this.panY || 0;
    var m = 6;
    var left = false, right = false, top = false, bottom = false;
    this.nodes.forEach(function (n) {
      var sx = n.x + px, sy = n.y + py;
      if (sx < m) { left = true; }
      if (sx > w - m) { right = true; }
      if (sy < m) { top = true; }
      if (sy > h - m) { bottom = true; }
    });
    if (!(left || right || top || bottom)) { return; }
    var s = 6;
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

  SkillGraph.prototype.centroid = function () {
    var ids = Object.keys(this.pointers), cx = 0, cy = 0, i;
    for (i = 0; i < ids.length; i++) { cx += this.pointers[ids[i]].x; cy += this.pointers[ids[i]].y; }
    var n = ids.length || 1;
    return { x: cx / n, y: cy / n };
  };

  SkillGraph.prototype.startPan = function () {
    this.panning = true;
    this.panStartCentroid = this.centroid();
    this.panStartPan = { x: this.panX || 0, y: this.panY || 0 };
  };

  // Pan begrenzen: mindestens PAD px der Knoten-Wolke bleiben je Seite sichtbar.
  SkillGraph.prototype.clampPan = function () {
    if (!this.nodes || !this.nodes.length) { return; }
    var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    this.nodes.forEach(function (n) {
      if (n.x < minX) { minX = n.x; }
      if (n.x > maxX) { maxX = n.x; }
      if (n.y < minY) { minY = n.y; }
      if (n.y > maxY) { maxY = n.y; }
    });
    var w = this.canvasW || this.wrap.clientWidth;
    var h = this.canvasH || this.wrap.clientHeight;
    var pad = 60;
    var minPanX = pad - maxX, maxPanX = (w - pad) - minX;
    var minPanY = pad - maxY, maxPanY = (h - pad) - minY;
    if (minPanX > maxPanX) { minPanX = maxPanX = (minPanX + maxPanX) / 2; }
    if (minPanY > maxPanY) { minPanY = maxPanY = (minPanY + maxPanY) / 2; }
    this.panX = Math.max(minPanX, Math.min(maxPanX, this.panX));
    this.panY = Math.max(minPanY, Math.min(maxPanY, this.panY));
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
    this.pointers[event.pointerId] = this.canvasPos(event);
    var count = Object.keys(this.pointers).length;

    if (count >= 2) {
      // Zwei Finger -> Pan (Karten-Muster). Laufenden Knoten-Drag abbrechen und
      // Touch dem Browser entziehen, solange gepannt wird.
      this.dragId = null;
      this.startPan();
      try { this.canvas.style.touchAction = 'none'; } catch (e) { /* noop */ }
      return;
    }

    var pos = this.pointers[event.pointerId];
    var hit = this.hitTest(pos.x - (this.panX || 0), pos.y - (this.panY || 0));
    if (hit !== null) {
      // Auf einem Knoten -> Knoten ziehen (wie bisher).
      this.dragId = hit;
      this.dragMoved = false;
      this.pointerStart = pos;
      try { this.canvas.setPointerCapture(event.pointerId); } catch (e) { /* noop */ }
    } else if (event.pointerType === 'mouse') {
      // Maus auf leere Fläche -> Pan (Desktop, kein Scroll-Konflikt).
      this.startPan();
    }
    // Touch auf leere Fläche: nichts -> die Seite scrollt (touch-action: pan-y).
  };

  SkillGraph.prototype.onPointerMove = function (event) {
    if (this.pointers[event.pointerId]) { this.pointers[event.pointerId] = this.canvasPos(event); }

    if (this.panning) {
      var c = this.centroid();
      this.panX = this.panStartPan.x + (c.x - this.panStartCentroid.x);
      this.panY = this.panStartPan.y + (c.y - this.panStartCentroid.y);
      this.clampPan();
      if (event.cancelable) { event.preventDefault(); }
      this.render();
      return;
    }

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
    // In Layout-Koordinaten pinnen (Pan herausrechnen); die Sim hält fx/fy fest.
    node.fx = pos.x - (this.panX || 0);
    node.fy = pos.y - (this.panY || 0);
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
    var remaining = Object.keys(this.pointers).length;

    if (this.panning) {
      if (remaining >= 2) {
        this.startPan();   // noch >=2 Finger: Bezug neu setzen (kein Sprung)
      } else {
        this.panning = false;
        try { this.canvas.style.touchAction = ''; } catch (e) { /* noop */ }  // Scroll wieder frei
      }
      try { this.canvas.releasePointerCapture(event.pointerId); } catch (e) { /* noop */ }
      return;
    }

    if (this.dragId !== null && !this.dragMoved) {
      // Kein echtes Ziehen → als Klick behandeln (Auswahl togglen)
      var hit = this.dragId;
      this.setSelection(hit === this.selected ? null : hit);
      this.dispatch();
    }
    // War es ein Drag: fx/fy bleiben gesetzt → der Knoten bleibt liegen.
    try { this.canvas.releasePointerCapture(event.pointerId); } catch (e) { /* noop */ }
    this.dragId = null;
    this.dragMoved = false;
    this.pointerStart = null;
  };

  SkillGraph.prototype.setSelection = function (skillId) {
    // Skills, die KEIN Knoten sind (Basis-Skills ohne Projektkanten), kann der
    // Graph nicht hervorheben — sie als "keine Auswahl" behandeln, sonst würden
    // alle Knoten ausgegraut (und node.label unten liefe auf undefined).
    var node = skillId === null ? null : this.nodeById(skillId);
    if (skillId !== null && !node) { skillId = null; }

    this.selected = skillId;
    if (this.contextLine) {
      if (skillId === null) {
        // Platz bleibt reserviert (feste Höhe) — nur der Text wechselt
        this.contextLine.textContent = '';
      } else {
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
    // Auswahl IMMER merken — auch wenn der Graph noch nicht gebaut ist (lazy-init
    // beim ersten Öffnen). Sonst bleibt ein VOR dem Öffnen gewählter Chip im
    // Graphen unmarkiert; build() zieht this.pendingExternal dann nach.
    this.pendingExternal = event.detail.skill;
    if (this.initialized && event.detail.skill !== this.selected) {
      this.setSelection(event.detail.skill);
    }
  };

  // ── Persistent-Shell-Kontrakt (spa-nav.js, siehe README-spa-nav.md) ─────────
  var instances = [];

  function mountGraph(root) {
    var scope = root || document;
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

  document.addEventListener('spa:load', function (e) { mountGraph(e.detail && e.detail.root); });
  document.addEventListener('spa:unload', teardownGraph);
  window.addEventListener('pageshow', function (e) { if (e.persisted) { mountGraph(document); } });

  function graphPeFallback() { if (!window.__spaNavActive) { mountGraph(document); } }
  if (document.readyState === 'complete') { graphPeFallback(); }
  else { document.addEventListener('DOMContentLoaded', graphPeFallback); }
})();
