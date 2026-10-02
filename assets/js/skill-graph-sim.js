/**
 * SkillGraphSim — DOM-freie Force-Layout-Engine (Stufe 2 des Skill-Features)
 *
 * Zuständigkeit: reine Physik. Nimmt Knoten (mit Startpositionen) und
 * gewichtete Kanten, bewegt die Positionen pro tick() einen Schritt weiter
 * (Spring-Embedder: Coulomb-Repulsion, Federn, Zentrums-Gravitation,
 * Cooling nach d3-Vorbild). Kennt weder DOM noch Canvas.
 *
 * API:
 *   new SkillGraphSim(nodes, edges, width, height, options?)
 *     nodes: [{id, x, y}]           (x/y = Startposition, wird mutiert)
 *     edges: [{source, target, weight}]  (Indizes in nodes)
 *   sim.tick()      → true solange sich noch etwas bewegt
 *   sim.isSettled() → Abkühlung erreicht
 *   sim.runToEnd()  → synchron zu Ende rechnen (reduced-motion-Standbild)
 *   sim.resize(w,h) → Positionen proportional auf neue Fläche skalieren
 *
 * Erweiterungspunkte:
 * - Parameter über options überschreibbar (siehe DEFAULTS), auch zur
 *   Laufzeit über sim.opts (z. B. aspect nach einem Resize).
 * - Export über self/window: die Datei ist ohne Änderung per importScripts
 *   in einen Web Worker verschiebbar (kein DOM-Zugriff).
 * - Neue Knotentypen (z. B. Projekt-Knoten) brauchen hier nichts — nur
 *   Daten und Renderer ändern sich.
 */
(function (global) {
  'use strict';

  const DEFAULTS = {
    repulsion: 20000,    // Coulomb-Konstante C (F = C / d²)
    springLength: 100,   // Feder-Ruhelänge in px
    springK: 0.03,       // Federkonstante (Kantengewicht skaliert leicht)
    gravity: 0.02,       // Zug zur Canvas-Mitte
    velocityDecay: 0.6,  // Faktor pro Tick (entspricht d3 velocityDecay 0.4)
    alphaDecay: 0.0228,  // → ~300 Ticks bis Stillstand (d3-Default)
    alphaMin: 0.001,
    padding: 24,         // Mindestabstand zum Rand
    // Seitenverhältnis (Breite/Höhe) der Anzeigefläche. Die Gravitation zieht
    // waagerecht mit gravity/aspect und senkrecht mit gravity·aspect: die
    // Wolke übernimmt so ungefähr das Format der Fläche (gemessen 2.10.2026
    // mit den CV-Daten: Canvas 2,07 → Wolke 1,82, Canvas 0,66 → Wolke 0,65;
    // isotrop blieb sie bei ~0,93 und ließ breite wie hohe Flächen halb leer).
    // 1 = isotrop wie bisher.
    aspect: 1
  };

  function SkillGraphSim(nodes, edges, width, height, options) {
    this.nodes = nodes;
    this.edges = edges;
    this.width = width;
    this.height = height;
    this.opts = Object.assign({}, DEFAULTS, options || {});
    this.alpha = 1;
    nodes.forEach(function (node) {
      node.vx = 0;
      node.vy = 0;
    });
  }

  SkillGraphSim.prototype.isSettled = function () {
    return this.alpha < this.opts.alphaMin;
  };

  SkillGraphSim.prototype.tick = function () {
    if (this.isSettled()) { return false; }

    const opts = this.opts;
    const nodes = this.nodes;
    let i;
    let j;

    // Repulsion (O(n²) — bei ~20 Knoten unkritisch)
    for (i = 0; i < nodes.length; i++) {
      for (j = i + 1; j < nodes.length; j++) {
        const a = nodes[i];
        const b = nodes[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const distSq = dx * dx + dy * dy;
        const dist = Math.sqrt(distSq) || 1;
        const force = (opts.repulsion / Math.max(distSq, 100)) * this.alpha;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        a.vx -= fx; a.vy -= fy;
        b.vx += fx; b.vy += fy;
      }
    }

    // Federn entlang der Kanten (Gewicht strafft leicht)
    for (i = 0; i < this.edges.length; i++) {
      const edge = this.edges[i];
      const source = nodes[edge.source];
      const target = nodes[edge.target];
      const ex = target.x - source.x;
      const ey = target.y - source.y;
      const elen = Math.sqrt(ex * ex + ey * ey) || 1;
      const k = opts.springK * (1 + 0.15 * Math.min(edge.weight - 1, 3));
      const stretch = (elen - opts.springLength) * k * this.alpha;
      const sx = (ex / elen) * stretch;
      const sy = (ey / elen) * stretch;
      source.vx += sx; source.vy += sy;
      target.vx -= sx; target.vy -= sy;
    }

    // Zentrums-Gravitation (anisotrop nach aspect), Integration,
    // Temperatur-Deckel, Rand-Clamp
    const cx = this.width / 2;
    const cy = this.height / 2;
    const gx = opts.gravity / opts.aspect;
    const gy = opts.gravity * opts.aspect;
    const maxStep = 0.1 * this.width * this.alpha;
    for (i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      // Per Drag fixierte Knoten (fx/fy) bleiben liegen — sie wirken über
      // Repulsion/Federn weiter auf andere, bewegen sich aber selbst nicht.
      if (node.fx != null && node.fy != null) {
        node.x = node.fx;
        node.y = node.fy;
        node.vx = 0;
        node.vy = 0;
        continue;
      }
      node.vx += (cx - node.x) * gx * this.alpha;
      node.vy += (cy - node.y) * gy * this.alpha;
      node.vx *= opts.velocityDecay;
      node.vy *= opts.velocityDecay;

      const step = Math.sqrt(node.vx * node.vx + node.vy * node.vy);
      const scale = step > maxStep ? maxStep / step : 1;
      node.x += node.vx * scale;
      node.y += node.vy * scale;

      node.x = Math.min(Math.max(node.x, opts.padding), this.width - opts.padding);
      node.y = Math.min(Math.max(node.y, opts.padding), this.height - opts.padding);
    }

    this.alpha *= (1 - opts.alphaDecay);
    return true;
  };

  SkillGraphSim.prototype.runToEnd = function (maxTicks) {
    let limit = maxTicks || 400;
    while (limit-- > 0 && this.tick()) { /* synchron auskühlen */ }
  };

  SkillGraphSim.prototype.resize = function (width, height) {
    const sx = width / this.width;
    const sy = height / this.height;
    this.nodes.forEach(function (node) {
      node.x *= sx;
      node.y *= sy;
      // Per Drag fixierte Knoten (fx/fy) mitskalieren — sonst springen sie
      // beim nächsten Reheat auf die alte, unskalierte Position zurück.
      if (node.fx != null) { node.fx *= sx; }
      if (node.fy != null) { node.fy *= sy; }
    });
    this.width = width;
    this.height = height;
  };

  global.SkillGraphSim = SkillGraphSim;
})(typeof self !== 'undefined' ? self : window);
