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
 *      es dann MODAL als Bottom-Sheet (body.graph-open, seit 1.10.2026): Scrim,
 *      Scroll-Sperre, Hintergrund inert. Vorher war das Sheet non-modal, die Seite
 *      rutschte beim Wischen über den Graphen weg (Nutzer: „kontraintuitiv").
 *      Gesten gehören jetzt dem Graphen (skill-graph.js: Ein-Finger-/Maus-Pan,
 *      Mausrad verschiebt). Das Panel wandert beim Öffnen in eine Ebene direkt
 *      unter <body> (raus aus dem Stacking-Kontext von #main, sonst lag der
 *      Footer darüber) und beim Schließen zurück an seinen Platz.
 *      Schließen: ✕ / Esc / Tippen auf den Scrim (Light Dismiss) / erneut den
 *      Toggle; ein MutationObserver auf [hidden] ist die einzige Reaktionsstelle.
 *
 * Fällt dieses Modul aus, bleibt der Graph über skill-graph.js voll funktionsfähig
 * (das Panel zeigt sich dann inline). Am Persistent-Shell-Kontrakt.
 */
(function () {
  'use strict';

  let instances = [];

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
    const signal = { signal: this.abort.signal };

    // ✕ ins Panel injizieren (nur im offenen Sheet sichtbar, CSS)
    this.closeBtn = document.createElement('button');
    this.closeBtn.type = 'button';
    this.closeBtn.className = 'skill-graph__sheet-close';
    this.closeBtn.setAttribute('aria-label', 'Graph schließen');
    this.closeBtn.innerHTML = '<span aria-hidden="true">✕</span>';
    // In die Kopfzeile (neben „Reset") statt frei ins Panel -> kein
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
      '↔ Ziehen verschiebt die Ansicht<br>' +
      '● Knoten: ziehen ordnet um, tippen wählt aus';
    this.panel.appendChild(this.touchHint);

    this.activate.addEventListener('click', this.onActivate.bind(this), signal);
    document.addEventListener('keydown', this.onKeydown.bind(this), signal);
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

    // Kapitel-Sichtbarkeit präzise per Scroll: bindet Floating-Button, TOC-
    // Ausblendung UND das offene Sheet exakt ans Kapitel (wie die sticky Konsole).
    // Verlässt „Technische Fähigkeiten" den Lesebereich, verschwindet alles — kein
    // Überstehen in den Nachbarabschnitt (Akademischer Werdegang).
    this.rafPending = false;
    const boundScroll = this.onScroll.bind(this);
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
    const btn = this.toggle;
    btn.classList.remove('is-hint');
    void btn.offsetWidth;   // Reflow -> Animation startet auch bei erneutem Aktivieren neu
    btn.classList.add('is-hint');
    btn.addEventListener('animationend', function () { btn.classList.remove('is-hint'); }, { once: true });
  };

  GraphMode.prototype.onScroll = function () {
    if (this.rafPending) { return; }
    this.rafPending = true;
    const self = this;
    requestAnimationFrame(function () { self.rafPending = false; self.updateInView(); });
  };

  GraphMode.prototype.updateInView = function () {
    // Offenes Sheet ist modal (Scroll gesperrt): Sichtbarkeit nicht neu bewerten,
    // sonst könnte ein Resize das offene Sheet unsichtbar schalten.
    if (document.body.classList.contains('graph-open')) { return; }
    const r = this.section.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight || 800;
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
    const TOP_LINE = 0.30;
    const BOT_LINE = 0.40;
    const inView = r.top < vh * TOP_LINE && r.bottom > vh * BOT_LINE;

    // Footer-Ride wie Back-to-Top (rAF-gekoppelt über onScroll): weicht dem
    // Seiten-Footer in sinnvollem Abstand aus, statt reinzulaufen. Base 20, GAP 24.
    const footer = document.querySelector('.page__footer');
    if (footer) {
      const ft = footer.getBoundingClientRect().top;
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
    try { if (sessionStorage.getItem('auflinie:graph-activate-hinted')) { return; } } catch (e) { return; }
    if (!window.matchMedia('(prefers-reduced-motion: no-preference)').matches) { return; }
    try { sessionStorage.setItem('auflinie:graph-activate-hinted', '1'); } catch (e) { /* noop */ }
    const btn = this.activate;
    btn.classList.add('is-hint');
    btn.addEventListener('animationend', function () { btn.classList.remove('is-hint'); }, { once: true });
  };

  GraphMode.prototype.syncHere = function () {
    document.body.classList.toggle('graph-here', this.mode && this.inView);
  };

  GraphMode.prototype.onHidden = function () {
    const open = !this.panel.hidden;
    if (open) { this.enterModal(); } else { this.leaveModal(); }
    document.body.classList.toggle('graph-open', open);
    const self = this;
    if (open) {
      requestAnimationFrame(function () { try { self.closeBtn.focus(); } catch (e) { /* noop */ } });
      this.maybeTouchHint();
    } else {
      // Fokus zurück zum Auslöser — erst jetzt, vorher war er per graph-open
      // ausgeblendet und damit nicht fokussierbar.
      requestAnimationFrame(function () { try { self.toggle.focus({ preventScroll: true }); } catch (e) { /* noop */ } });
    }
  };

  // Modal öffnen: Panel in eine eigene Ebene unter <body> verschieben (Platzhalter
  // merkt die Herkunft), Scrim davor, Rest der Seite inert, Scroll sperren.
  GraphMode.prototype.enterModal = function () {
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

  GraphMode.prototype.leaveModal = function () {
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
  GraphMode.prototype.maybeTouchHint = function () {
    if (!window.matchMedia('(hover: none)').matches) { return; }   // nur Touch-Geräte
    try { if (sessionStorage.getItem('auflinie:graph-touch-hinted')) { return; } } catch (e) { return; }
    try { sessionStorage.setItem('auflinie:graph-touch-hinted', '1'); } catch (e) { /* noop */ }
    const hint = this.touchHint;
    hint.classList.add('is-show');
    this.touchHintTimer = setTimeout(function () { hint.classList.remove('is-show'); }, 4500);
  };

  // Schließen delegiert an den bestehenden Toggle -> skill-graph.js räumt sauber auf.
  GraphMode.prototype.close = function () {
    if (!this.panel.hidden) {
      this.toggle.click();   // Fokus-Rückgabe übernimmt onHidden
    }
  };

  GraphMode.prototype.onKeydown = function (e) {
    if (e.key !== 'Escape' || this.panel.hidden) { return; }
    // Bei aktiver Auswahl übernehmen skill-graph/skill-chips dieses Esc und
    // lösen nur die Auswahl — das Sheet schließt erst beim nächsten Esc.
    if (this.selectedSkill != null) { return; }
    this.close();
  };

  GraphMode.prototype.destroy = function () {
    if (this.abort) { this.abort.abort(); }   // deckt auch die Scroll/Resize-Listener
    if (this.observer) { this.observer.disconnect(); this.observer = null; }
    if (this.touchHintTimer) { clearTimeout(this.touchHintTimer); this.touchHintTimer = null; }
    this.leaveModal();
    document.body.classList.remove('graph-here', 'graph-open');
    if (this.closeBtn && this.closeBtn.parentNode) { this.closeBtn.parentNode.removeChild(this.closeBtn); }
    if (this.touchHint && this.touchHint.parentNode) { this.touchHint.parentNode.removeChild(this.touchHint); }
  };

  // ── Persistent-Shell-Kontrakt (spa-nav.js, siehe README-spa-nav.md) ─────────
  function mount(root) {
    const scope = root || document;
    scope.querySelectorAll('[data-skill-graph]').forEach(function (el) {
      if (el.hasAttribute('data-graph-mode-mounted')) { return; }   // idempotent
      el.setAttribute('data-graph-mode-mounted', '');
      const g = new GraphMode(el);
      if (g.ok) { instances.push(g); }
    });
  }

  function teardown() {
    instances.forEach(function (g) { if (g && g.destroy) { g.destroy(); } });
    instances = [];
  }

  window.spaModule({ mount: mount, teardown: teardown });
})();
