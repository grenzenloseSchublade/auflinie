/**
 * skill-graph-sheet.js — Präsentations-Wrapper für den Skill-Graphen.
 *
 * Ändert den Graph-KERN (skill-graph.js) NICHT — nur Aktivierung & Darstellung.
 * Zwei Stufen:
 *   1) Statischer Button [data-role="graph-activate"] schaltet den Graph-Modus.
 *      Solange man IM Kapitel „Technische Fähigkeiten" ist (präzise per Scroll),
 *      erscheint unten ein floatender Öffnen-Button und die sticky TOC-Leiste
 *      weicht (Klasse body.graph-here). Verlässt man das Kapitel, kehrt die TOC
 *      zurück und der Floating-Button verschwindet — der Modus bleibt aber an.
 *   2) Der floatende Button IST der bestehende [data-role="graph-toggle"] —
 *      sein Klick öffnet das Panel über skill-graph.js. Dieses Modul präsentiert
 *      es dann NON-MODAL als Bottom-Sheet (body.graph-open): KEIN Scrim, KEIN
 *      Scroll-Lock — die Chips bleiben live und steuern den Graphen. Geschlossen
 *      wird über ✕ / Esc / erneut den Toggle; ein MutationObserver auf [hidden]
 *      ist die einzige Reaktionsstelle.
 *
 * Fällt dieses Modul aus, bleibt der Graph über skill-graph.js voll funktionsfähig
 * (das Panel zeigt sich dann inline). Am Persistent-Shell-Kontrakt.
 */
(function () {
  'use strict';

  var instances = [];

  function GraphMode(root) {
    this.root = root;
    this.activate = root.querySelector('[data-role="graph-activate"]');
    this.toggle = root.querySelector('[data-role="graph-toggle"]');   // = Floating-Öffner
    this.panel = root.querySelector('[data-role="graph-panel"]');
    this.section = root.closest('.cv-section') || root.closest('.cv-skills') || root;
    this.ok = !!(this.activate && this.toggle && this.panel);
    if (!this.ok) { return; }

    this.mode = false;
    this.inView = false;
    this.abort = new AbortController();
    var signal = { signal: this.abort.signal };

    // ✕ ins Panel injizieren (nur im offenen Sheet sichtbar, CSS)
    this.closeBtn = document.createElement('button');
    this.closeBtn.type = 'button';
    this.closeBtn.className = 'skill-graph__sheet-close';
    this.closeBtn.setAttribute('aria-label', 'Graph schließen');
    this.closeBtn.innerHTML = '<span aria-hidden="true">✕</span>';
    // In die Kopfzeile (neben „Zurücksetzen") statt frei ins Panel -> kein
    // Überlappen mit dem Reset-Button.
    (this.panel.querySelector('.skill-graph__head') || this.panel).appendChild(this.closeBtn);
    this.closeBtn.addEventListener('click', this.close.bind(this), signal);

    this.activate.addEventListener('click', this.onActivate.bind(this), signal);
    document.addEventListener('keydown', this.onKeydown.bind(this), signal);

    // Panel öffnet/schließt über [hidden] (skill-graph.js) — hier nur reagieren.
    this.observer = new MutationObserver(this.onHidden.bind(this));
    this.observer.observe(this.panel, { attributes: true, attributeFilter: ['hidden'] });

    // Kapitel-Sichtbarkeit präzise per Scroll: bindet Floating-Button, TOC-
    // Ausblendung UND das offene Sheet exakt ans Kapitel (wie die sticky Konsole).
    // Verlässt „Technische Fähigkeiten" den Lesebereich, verschwindet alles — kein
    // Überstehen in den Nachbarabschnitt (Akademischer Werdegang).
    this.rafPending = false;
    var boundScroll = this.onScroll.bind(this);
    window.addEventListener('scroll', boundScroll, { passive: true, signal: this.abort.signal });
    window.addEventListener('resize', boundScroll, { passive: true, signal: this.abort.signal });
    this.updateInView();
  }

  GraphMode.prototype.onActivate = function () { this.setMode(!this.mode); };

  GraphMode.prototype.setMode = function (on) {
    this.mode = on;
    this.activate.setAttribute('aria-pressed', String(on));
    this.activate.textContent = on ? 'Graph deaktivieren' : 'Graph aktivieren';
    if (!on && !this.panel.hidden) { this.toggle.click(); }   // Deaktivieren schließt offenen Graph
    this.syncHere();
  };

  GraphMode.prototype.onScroll = function () {
    if (this.rafPending) { return; }
    this.rafPending = true;
    var self = this;
    requestAnimationFrame(function () { self.rafPending = false; self.updateInView(); });
  };

  GraphMode.prototype.updateInView = function () {
    var r = this.section.getBoundingClientRect();
    var vh = window.innerHeight || document.documentElement.clientHeight || 800;
    // „Im Kapitel": das Kapitel hat begonnen (top < vh) UND sein Ende steht noch
    // unter der Bindungslinie (bottom > vh*BIND). So verschwinden Sheet/Floating/
    // TOC genau, wenn der Nachbarabschnitt den unteren Bereich übernimmt. KEIN
    // Auto-Schließen — nur Sichtbarkeit (der Zustand bleibt „offen").
    var BIND = 0.4;
    var inView = r.top < vh && r.bottom > vh * BIND;
    if (inView !== this.inView) {
      this.inView = inView;
      this.syncHere();
      if (inView) { this.maybeHint(); }
    }
  };

  // Einmaliges Aufglimmen des „Graph aktivieren"-Buttons, damit er entdeckt wird
  // (wie der Hero-Power-Button): session-gated, nur bei erlaubter Bewegung.
  GraphMode.prototype.maybeHint = function () {
    try { if (sessionStorage.getItem('graphActivateHinted')) { return; } } catch (e) { return; }
    if (!window.matchMedia('(prefers-reduced-motion: no-preference)').matches) { return; }
    try { sessionStorage.setItem('graphActivateHinted', '1'); } catch (e) { /* noop */ }
    var btn = this.activate;
    btn.classList.add('is-hint');
    btn.addEventListener('animationend', function () { btn.classList.remove('is-hint'); }, { once: true });
  };

  GraphMode.prototype.syncHere = function () {
    document.body.classList.toggle('graph-here', this.mode && this.inView);
  };

  GraphMode.prototype.onHidden = function () {
    var open = !this.panel.hidden;
    document.body.classList.toggle('graph-open', open);
    if (open) {
      var self = this;
      requestAnimationFrame(function () { try { self.closeBtn.focus(); } catch (e) { /* noop */ } });
    }
  };

  // Schließen delegiert an den bestehenden Toggle -> skill-graph.js räumt sauber auf.
  GraphMode.prototype.close = function () {
    if (!this.panel.hidden) {
      this.toggle.click();
      try { this.toggle.focus(); } catch (e) { /* noop */ }
    }
  };

  GraphMode.prototype.onKeydown = function (e) {
    if (e.key === 'Escape' && !this.panel.hidden) { this.close(); }
  };

  GraphMode.prototype.destroy = function () {
    if (this.abort) { this.abort.abort(); }   // deckt auch die Scroll/Resize-Listener
    if (this.observer) { this.observer.disconnect(); this.observer = null; }
    document.body.classList.remove('graph-here', 'graph-open');
    if (this.closeBtn && this.closeBtn.parentNode) { this.closeBtn.parentNode.removeChild(this.closeBtn); }
  };

  // ── Persistent-Shell-Kontrakt (spa-nav.js, siehe README-spa-nav.md) ─────────
  function mount(root) {
    var scope = root || document;
    scope.querySelectorAll('[data-skill-graph]').forEach(function (el) {
      if (el.hasAttribute('data-graph-mode-mounted')) { return; }   // idempotent
      el.setAttribute('data-graph-mode-mounted', '');
      var g = new GraphMode(el);
      if (g.ok) { instances.push(g); }
    });
  }

  function teardown() {
    instances.forEach(function (g) { if (g && g.destroy) { g.destroy(); } });
    instances = [];
  }

  document.addEventListener('spa:load', function (e) { mount(e.detail && e.detail.root); });
  document.addEventListener('spa:unload', teardown);
  window.addEventListener('pageshow', function (e) { if (e.persisted) { mount(document); } });

  function peFallback() { if (!window.__spaNavActive) { mount(document); } }
  if (document.readyState === 'complete') { peFallback(); }
  else { document.addEventListener('DOMContentLoaded', peFallback); }
})();
