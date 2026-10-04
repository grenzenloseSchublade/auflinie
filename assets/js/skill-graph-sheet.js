/**
 * skill-graph-sheet.js — Präsentations-Wrapper für den Skill-Graphen.
 *
 * Ändert den Graph-KERN (skill-graph.js) nicht, nur die Darstellung: Der Knopf
 * „Skill-Graph öffnen“ oben im Abschnitt ([data-role="graph-toggle"]) öffnet das
 * Panel über skill-graph.js. Dieses Modul präsentiert es dann MODAL als Sheet
 * (body.graph-open, seit 1.10.2026): Scrim, Scroll-Sperre, Hintergrund inert.
 * Vorher war das Sheet non-modal, die Seite rutschte beim Wischen über den
 * Graphen weg (Nutzer: „kontraintuitiv“). Gesten gehören jetzt dem Graphen
 * (skill-graph.js: Ziehen verschiebt, Pinch und Mausrad zoomen). Das Panel
 * wandert beim Öffnen in eine Ebene direkt unter <body> (raus aus dem
 * Stacking-Kontext von #main, sonst lag der Footer darüber) und beim
 * Schließen zurück an seinen Platz.
 * Schließen: ✕ / Esc (gestaffelt: erst Auswahl lösen) / Tippen auf den Scrim
 * (Light Dismiss) / erneut den Toggle; ein MutationObserver auf [hidden] ist
 * die einzige Reaktionsstelle. Fokus beim Öffnen auf ✕, beim Schließen
 * zurück auf den Öffner.
 * Bis 2.10.2026 gab es davor einen Aktivieren-Schritt und einen schwebenden
 * Öffner im Kapitel. Beides ist entfallen: ein Knopf, ein Weg.
 *
 * Fällt dieses Modul aus, bleibt der Graph über skill-graph.js voll funktionsfähig
 * (das Panel zeigt sich dann inline). Am Persistent-Shell-Kontrakt.
 */
(function () {
  'use strict';

  let instances = [];

  // Touch-Hinweis (Owner: Kasten mittig über dem Graphen), eine Zeile je Geste
  const TOUCH_HINT_LINES = [
    '↔ Ziehen verschiebt die Ansicht',
    '± Zwei Finger zoomen',
    '● Knoten: ziehen ordnet um, tippen wählt aus'
  ];

  function GraphSheet(root) {
    this.root = root;
    this.toggle = root.querySelector('[data-role="graph-toggle"]');
    this.panel = root.querySelector('[data-role="graph-panel"]');
    this.ok = !!(this.toggle && this.panel);
    if (!this.ok) { return; }

    this.abort = new AbortController();
    const signal = { signal: this.abort.signal };

    // ✕ in die Kopfleiste (rechts außen, nur im offenen Sheet sichtbar, CSS)
    this.closeBtn = document.createElement('button');
    this.closeBtn.type = 'button';
    this.closeBtn.className = 'skill-graph__sheet-close';
    this.closeBtn.setAttribute('aria-label', 'Graph schließen');
    const cross = document.createElement('span');
    cross.setAttribute('aria-hidden', 'true');
    cross.textContent = '✕';
    this.closeBtn.appendChild(cross);
    (this.panel.querySelector('.skill-graph__head') || this.panel).appendChild(this.closeBtn);
    this.closeBtn.addEventListener('click', this.close.bind(this), signal);

    // Touch-Onboarding: beim ersten Öffnen auf Touch-Geräten kurz eingeblendet,
    // blendet nach ein paar Sekunden wieder aus (session-gated). Sitzt im
    // Canvas-Rahmen, damit er genau über dem Graphen zentriert ist. Auf
    // Desktop signalisiert der grab-Cursor.
    this.touchHint = document.createElement('div');
    this.touchHint.className = 'skill-graph__touch-hint';
    this.touchHint.setAttribute('aria-hidden', 'true');
    const hint = this.touchHint;
    TOUCH_HINT_LINES.forEach(function (line, i) {
      if (i) { hint.appendChild(document.createElement('br')); }
      hint.appendChild(document.createTextNode(line));
    });
    (this.panel.querySelector('[data-role="canvas-wrap"]') || this.panel).appendChild(this.touchHint);

    // Capture-Phase: Die Entscheidung „Auswahl lösen oder schließen“ fällt,
    // BEVOR skill-chips/skill-graph (Bubble-Phase am document) die Auswahl
    // lösen und per Event selectedSkill auf null setzen. Sonst schlösse
    // dasselbe Esc das Sheet gleich mit (Staffelung, OVL-3).
    document.addEventListener('keydown', this.onKeydown.bind(this),
      { signal: this.abort.signal, capture: true });
    // Aktive Skill-Auswahl mitverfolgen (Event-Vertrag mit skill-graph/skill-chips):
    // Esc-Staffelung — erstes Esc löst nur die Auswahl, zweites schließt das Sheet.
    this.selectedSkill = null;
    const self = this;
    document.addEventListener('auflinie:skill-select', function (event) {
      self.selectedSkill = (event.detail && event.detail.skill) || null;
    }, signal);

    // Panel öffnet/schließt über [hidden] (skill-graph.js) — hier nur reagieren.
    this.observer = new MutationObserver(this.onHidden.bind(this));
    this.observer.observe(this.panel, { attributes: true, attributeFilter: ['hidden'] });
  }

  GraphSheet.prototype.onHidden = function () {
    const open = !this.panel.hidden;
    if (open) { this.enterModal(); } else { this.leaveModal(); }
    document.body.classList.toggle('graph-open', open);
    const self = this;
    if (open) {
      requestAnimationFrame(function () { try { self.closeBtn.focus(); } catch (e) { /* noop */ } });
      this.maybeTouchHint();
    } else {
      // Fokus zurück zum Öffner — erst jetzt, vorher lag er im inerten Bereich.
      requestAnimationFrame(function () { try { self.toggle.focus({ preventScroll: true }); } catch (e) { /* noop */ } });
    }
  };

  // Modal öffnen: Panel in eine eigene Ebene unter <body> verschieben (Platzhalter
  // merkt die Herkunft), Scrim davor, Rest der Seite inert, Scroll sperren.
  GraphSheet.prototype.enterModal = function () {
    if (this.layer) { return; }
    this.placeholder = document.createComment('skill-graph-panel');
    this.panel.parentNode.insertBefore(this.placeholder, this.panel);

    this.layer = document.createElement('div');
    this.layer.className = 'skill-graph-layer';
    const scrim = document.createElement('div');
    scrim.className = 'skill-graph__scrim';
    scrim.addEventListener('click', this.close.bind(this));   // Light Dismiss
    this.layer.appendChild(scrim);
    this.layer.appendChild(this.panel);
    document.body.appendChild(this.layer);

    this.panel.setAttribute('role', 'dialog');
    this.panel.setAttribute('aria-modal', 'true');
    this.panel.setAttribute('aria-label', 'Skill-Graph');

    const layer = this.layer;
    this.inerted = Array.prototype.filter.call(document.body.children, function (el) {
      return el !== layer && el.tagName !== 'SCRIPT' && !el.inert;
    });
    this.inerted.forEach(function (el) { el.inert = true; });
    document.documentElement.classList.add('graph-scroll-lock');
  };

  GraphSheet.prototype.leaveModal = function () {
    if (!this.layer) { return; }
    (this.inerted || []).forEach(function (el) { el.inert = false; });
    this.inerted = null;
    document.documentElement.classList.remove('graph-scroll-lock');
    this.panel.removeAttribute('role');
    this.panel.removeAttribute('aria-modal');
    this.panel.removeAttribute('aria-label');
    if (this.placeholder && this.placeholder.parentNode) {
      this.placeholder.parentNode.insertBefore(this.panel, this.placeholder);
      this.placeholder.parentNode.removeChild(this.placeholder);
    }
    this.placeholder = null;
    if (this.layer.parentNode) { this.layer.parentNode.removeChild(this.layer); }
    this.layer = null;
  };

  // Touch-Hinweis einmal pro Session einblenden, dann nach ~4.5s ausblenden.
  GraphSheet.prototype.maybeTouchHint = function () {
    if (!window.matchMedia('(hover: none)').matches) { return; }   // nur Touch-Geräte
    try { if (sessionStorage.getItem('auflinie:graph-touch-hinted')) { return; } } catch (e) { return; }
    try { sessionStorage.setItem('auflinie:graph-touch-hinted', '1'); } catch (e) { /* noop */ }
    const hint = this.touchHint;
    hint.classList.add('is-show');
    if (this.touchHintTimer) { clearTimeout(this.touchHintTimer); }
    this.touchHintTimer = setTimeout(function () { hint.classList.remove('is-show'); }, 4500);
  };

  // Schließen delegiert an den bestehenden Toggle -> skill-graph.js räumt sauber auf.
  GraphSheet.prototype.close = function () {
    if (!this.panel.hidden) {
      this.toggle.click();   // Fokus-Rückgabe übernimmt onHidden
    }
  };

  GraphSheet.prototype.onKeydown = function (e) {
    if (e.key !== 'Escape' || this.panel.hidden) { return; }
    // Bei aktiver Auswahl übernehmen skill-graph/skill-chips dieses Esc und
    // lösen nur die Auswahl — das Sheet schließt erst beim nächsten Esc.
    if (this.selectedSkill != null) { return; }
    this.close();
  };

  GraphSheet.prototype.destroy = function () {
    if (this.abort) { this.abort.abort(); }
    if (this.observer) { this.observer.disconnect(); this.observer = null; }
    if (this.touchHintTimer) { clearTimeout(this.touchHintTimer); this.touchHintTimer = null; }
    this.leaveModal();
    document.body.classList.remove('graph-open');
    if (this.closeBtn && this.closeBtn.parentNode) { this.closeBtn.parentNode.removeChild(this.closeBtn); }
    if (this.touchHint && this.touchHint.parentNode) { this.touchHint.parentNode.removeChild(this.touchHint); }
  };

  // ── Persistent-Shell-Kontrakt (spa-nav.js, siehe docs/features/spa-nav.md) ─────────
  function mount(root) {
    const scope = root || document;
    scope.querySelectorAll('[data-skill-graph]').forEach(function (el) {
      if (el.hasAttribute('data-graph-sheet-mounted')) { return; }   // idempotent
      el.setAttribute('data-graph-sheet-mounted', '');
      const g = new GraphSheet(el);
      if (g.ok) { instances.push(g); }
    });
  }

  function teardown() {
    instances.forEach(function (g) { if (g && g.destroy) { g.destroy(); } });
    instances = [];
  }

  window.spaModule({ mount: mount, teardown: teardown });
})();
