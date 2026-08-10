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

    // Touch-Onboarding: „Zwei Finger verschieben die Ansicht" — beim ersten
    // Öffnen auf Touch-Geräten kurz eingeblendet, blendet nach ein paar Sekunden
    // wieder aus (session-gated). Auf Desktop signalisiert der grab-Cursor.
    this.touchHint = document.createElement('div');
    this.touchHint.className = 'skill-graph__touch-hint';
    this.touchHint.setAttribute('aria-hidden', 'true');
    this.touchHint.innerHTML =
      '↔ Zwei Finger verschieben die Ansicht<br>' +
      '● Knoten: ziehen ordnet um, tippen wählt aus';
    this.panel.appendChild(this.touchHint);

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
    // Beim Aktivieren taucht der Floating-Öffner unten auf — er geht leicht
    // unter, daher kurz aufglimmen lassen (wenn er sichtbar wird, also im Kapitel).
    if (on && this.inView) { this.hintFloating(); }
  };

  GraphMode.prototype.hintFloating = function () {
    if (!window.matchMedia('(prefers-reduced-motion: no-preference)').matches) { return; }
    var btn = this.toggle;
    btn.classList.remove('is-hint');
    void btn.offsetWidth;   // Reflow -> Animation startet auch bei erneutem Aktivieren neu
    btn.classList.add('is-hint');
    btn.addEventListener('animationend', function () { btn.classList.remove('is-hint'); }, { once: true });
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
    // „Im Kapitel" = das Skills-Kapitel überlappt ein zentrales Band
    // [BIND, 1-BIND] des Viewports. BEIDE Ränder gebunden — sonst überschießt
    // das Sheet beim Hochscrollen nach OBEN in die Ausbildung (die im CV ÜBER
    // den Fähigkeiten steht): vorher war nur die Unterkante gebunden, `r.top<vh`
    // blieb wahr, bis das Kapitel ganz unten raus war. Jetzt verschwinden
    // Sheet/Floating/TOC beim Hoch- UND Runterscrollen präzise am Abschnitts-
    // wechsel. Kein Auto-Schließen — nur Sichtbarkeit (Zustand bleibt „offen").
    // Das Sheet ist 68vh (Oberkante bei ~32vh). „Akademische Ausbildung" steht
    // im CV ÜBER den Fähigkeiten; würde das Sheet erst spät ausgeblendet, deckte
    // es beim HOCHscrollen die Ausbildung. Daher die Ausblend-Lane auf die
    // Sheet-Oberkante herunter (TOP_LINE ≈ 0.30): verschwindet, sobald die
    // Kapitel-Oberkante dorthin steigt. BOT_LINE bindet die Unterkante fürs
    // Runterscrollen.
    var TOP_LINE = 0.30;
    var BOT_LINE = 0.40;
    var inView = r.top < vh * TOP_LINE && r.bottom > vh * BOT_LINE;

    // Footer-Ride wie Back-to-Top (rAF-gekoppelt über onScroll): weicht dem
    // Seiten-Footer in sinnvollem Abstand aus, statt reinzulaufen. Base 20, GAP 24.
    var footer = document.querySelector('.page__footer');
    if (footer) {
      var ft = footer.getBoundingClientRect().top;
      this.toggle.style.setProperty('--graph-float-push', Math.max(0, vh - ft + 24 - 20) + 'px');
    }

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
      this.maybeTouchHint();
    }
  };

  // Touch-Hinweis einmal pro Session einblenden, dann nach ~4.5s ausblenden.
  GraphMode.prototype.maybeTouchHint = function () {
    if (!window.matchMedia('(hover: none)').matches) { return; }   // nur Touch-Geräte
    try { if (sessionStorage.getItem('graphTouchHinted')) { return; } } catch (e) { return; }
    try { sessionStorage.setItem('graphTouchHinted', '1'); } catch (e) { /* noop */ }
    var hint = this.touchHint;
    hint.classList.add('is-show');
    this.touchHintTimer = setTimeout(function () { hint.classList.remove('is-show'); }, 4500);
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
    if (this.touchHintTimer) { clearTimeout(this.touchHintTimer); this.touchHintTimer = null; }
    document.body.classList.remove('graph-here', 'graph-open');
    if (this.closeBtn && this.closeBtn.parentNode) { this.closeBtn.parentNode.removeChild(this.closeBtn); }
    if (this.touchHint && this.touchHint.parentNode) { this.touchHint.parentNode.removeChild(this.touchHint); }
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
