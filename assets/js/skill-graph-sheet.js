/**
 * skill-graph-sheet.js — Präsentations-Wrapper für das Skill-Graph-Panel.
 *
 * Ändert den Graphen (skill-graph.js) NICHT — nur die AKTIVIERUNG/DARSTELLUNG:
 * Der vorhandene Toggle wird per CSS zum Footer-Button; öffnet er das Panel
 * (das [hidden]-Attribut von [data-role="graph-panel"] fällt weg), präsentiert
 * dieses Modul es als fokussiertes Bottom-Sheet — Scrim (ohne Blur, per CSS),
 * Scroll-Lock, Fokus, Esc-/Außenklick-Schließen. Der bestehende Readout
 * [data-role="graph-context"] wandert per CSS nach oben und bleibt als reaktive
 * Konsole sichtbar (skill-graph.js füllt ihn bei Knoten-Auswahl weiter).
 *
 * Geschlossen wird IMMER über den bestehenden Toggle (toggle.click()), damit
 * skill-graph.js autoritativ für den Auf/Zu-Zustand bleibt; ein MutationObserver
 * auf [hidden] ist die einzige Reaktionsstelle. Fällt dieses Modul aus, zeigt
 * sich das Panel einfach inline wie bisher (Progressive Enhancement).
 *
 * Am Persistent-Shell-Kontrakt: spa:load -> mount, spa:unload -> teardown.
 */
(function () {
  'use strict';

  var OPEN_CLASS = 'graph-sheet-open';
  var instances = [];

  function SheetWrap(root) {
    this.toggle = root.querySelector('[data-role="graph-toggle"]');
    this.panel = root.querySelector('[data-role="graph-panel"]');
    this.ok = !!(this.toggle && this.panel);
    if (!this.ok) { return; }

    this.open = false;
    this.abort = new AbortController();
    var signal = { signal: this.abort.signal };

    // Schließen-Button ins Panel injizieren (nur im Sheet-Modus sichtbar, CSS).
    this.closeBtn = document.createElement('button');
    this.closeBtn.type = 'button';
    this.closeBtn.className = 'skill-graph__sheet-close';
    this.closeBtn.setAttribute('aria-label', 'Graph schließen');
    this.closeBtn.innerHTML = '<span aria-hidden="true">✕</span>';
    this.panel.appendChild(this.closeBtn);
    this.closeBtn.addEventListener('click', this.requestClose.bind(this), signal);

    // Öffnen/Schließen steuert skill-graph.js über [hidden] — hier nur beobachten.
    this.observer = new MutationObserver(this.onHiddenChange.bind(this));
    this.observer.observe(this.panel, { attributes: true, attributeFilter: ['hidden'] });

    document.addEventListener('click', this.onDocClick.bind(this), signal);
    document.addEventListener('keydown', this.onKeydown.bind(this), signal);

    if (!this.panel.hidden) { this.engage(); }   // falls schon offen (Remount)
  }

  SheetWrap.prototype.onHiddenChange = function () {
    var nowOpen = !this.panel.hidden;
    if (nowOpen === this.open) { return; }
    if (nowOpen) { this.engage(); } else { this.disengage(); }
  };

  SheetWrap.prototype.engage = function () {
    this.open = true;
    document.body.classList.add(OPEN_CLASS);
    var self = this;
    requestAnimationFrame(function () { try { self.closeBtn.focus(); } catch (e) { /* noop */ } });
  };

  SheetWrap.prototype.disengage = function () {
    this.open = false;
    document.body.classList.remove(OPEN_CLASS);
    try { this.toggle.focus(); } catch (e) { /* noop */ }
  };

  // Schließen delegiert an den bestehenden Toggle -> skill-graph.js räumt sauber
  // auf (hidden=true, Button-Text/aria, stopLoop); der Observer disengagt dann.
  SheetWrap.prototype.requestClose = function () {
    if (!this.panel.hidden) { this.toggle.click(); }
  };

  SheetWrap.prototype.onDocClick = function (e) {
    if (!this.open) { return; }                                   // Öffnen-Klick: open noch false
    if (this.panel.contains(e.target) || this.toggle.contains(e.target)) { return; }
    this.requestClose();                                          // Klick außerhalb -> schließen
  };

  SheetWrap.prototype.onKeydown = function (e) {
    if (e.key === 'Escape' && this.open) { this.requestClose(); }
  };

  SheetWrap.prototype.destroy = function () {
    if (this.abort) { this.abort.abort(); }
    if (this.observer) { this.observer.disconnect(); this.observer = null; }
    if (this.open) { document.body.classList.remove(OPEN_CLASS); }
    if (this.closeBtn && this.closeBtn.parentNode) { this.closeBtn.parentNode.removeChild(this.closeBtn); }
  };

  // ── Persistent-Shell-Kontrakt (spa-nav.js, siehe README-spa-nav.md) ─────────
  function mount(root) {
    var scope = root || document;
    scope.querySelectorAll('[data-skill-graph]').forEach(function (el) {
      if (el.hasAttribute('data-graph-sheet-mounted')) { return; }   // idempotent
      el.setAttribute('data-graph-sheet-mounted', '');
      var wrap = new SheetWrap(el);
      if (wrap.ok) { instances.push(wrap); }
    });
  }

  function teardown() {
    instances.forEach(function (w) { if (w && w.destroy) { w.destroy(); } });
    instances = [];
  }

  document.addEventListener('spa:load', function (e) { mount(e.detail && e.detail.root); });
  document.addEventListener('spa:unload', teardown);
  window.addEventListener('pageshow', function (e) { if (e.persisted) { mount(document); } });

  function sheetPeFallback() { if (!window.__spaNavActive) { mount(document); } }
  if (document.readyState === 'complete') { sheetPeFallback(); }
  else { document.addEventListener('DOMContentLoaded', sheetPeFallback); }
})();
