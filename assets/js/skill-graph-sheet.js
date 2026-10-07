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
 * Kleiner Öffner in der klebenden Auswahl-Konsole ([data-role="graph-dock"],
 * Owner 7. 10. 2026): Er übernimmt, sobald der große Knopf oben aus dem Bild
 * ist, und gibt ab, sobald dieser wieder zu sehen ist. Es ist immer genau
 * einer der beiden bedienbar, der andere ist inert und aria-hidden. Hat der
 * abgebende den Fokus, wandert er mit. Ein IntersectionObserver misst die
 * ruhende Hülle des großen Knopfs gegen einen Umschaltpunkt (kein
 * Scroll-Listener), data-graph-dock an .cv-skills (big/small) trägt den
 * Zustand ins CSS. Die sichtbare Verwandlung beim Scrollen macht das CSS
 * allein (scroll-getriebene Animation, _skill-graph.scss). Von hier kommen
 * nur die Maße (Unterkante der Konsole, Skala, Weg) als Custom Properties an
 * .cv-skills. Mit Verwandlung liegt der Umschaltpunkt in der Mitte der
 * Überblendung am Ende des Wegs, ohne (Firefox, Reduced Motion) dort, wo die
 * Konsole den großen Knopf zu verdecken beginnt. So ist der bedienbare
 * Knopf immer der sichtbare. Der kleine Knopf öffnet über denselben Toggle,
 * der Fokus kehrt nach dem Schließen zu dem Knopf zurück, über den geöffnet
 * wurde. Läuft der Text der Konsole über, hält .has-overflow die Ecke des
 * kleinen Knopfs am Textende frei.
 *
 * Fällt dieses Modul aus, bleibt der Graph über skill-graph.js voll funktionsfähig
 * (das Panel zeigt sich dann inline). Seiten-Modul, mountet einmal beim Laden.
 *
 * Texte (Name des Fensters, ✕-Knopf, Touch-Hinweis): texts.graph in
 * _data/skill_graph.yml, gelesen aus dem JSON-Tag [data-skill-graph-data]
 * über SkillGraphData (skill-graph-data.js, vorher geladen, ARCH-4).
 */
(function () {
  'use strict';

  // Unterer Rand des Beobachtungsbereichs für den kleinen Öffner in px:
  // „beliebig weit unten“, größer als jede Seitenhöhe
  const DOCK_FAR = 1000000;

  // Bedientexte aus texts.graph. Fehlen die Daten, bleibt der Text weg.
  function graphTexts() {
    const sgd = window.SkillGraphData;
    const tag = document.querySelector('script[data-skill-graph-data]');
    if (!sgd || !tag) { return {}; }
    return sgd.texts(sgd.parse(tag, 'skill-graph-sheet'), 'skill-graph-sheet').graph || {};
  }

  function GraphSheet(root) {
    this.root = root;
    this.toggle = root.querySelector('[data-role="graph-toggle"]');
    this.panel = root.querySelector('[data-role="graph-panel"]');
    this.ok = !!(this.toggle && this.panel);
    if (!this.ok) { return; }
    this.texts = graphTexts();

    // ✕ in die Kopfleiste (rechts außen, nur im offenen Sheet sichtbar, CSS)
    this.closeBtn = document.createElement('button');
    this.closeBtn.type = 'button';
    this.closeBtn.className = 'skill-graph__sheet-close';
    if (this.texts.close) { this.closeBtn.setAttribute('aria-label', this.texts.close); }
    const cross = document.createElement('span');
    cross.setAttribute('aria-hidden', 'true');
    cross.textContent = '✕';
    this.closeBtn.appendChild(cross);
    (this.panel.querySelector('.skill-graph__head') || this.panel).appendChild(this.closeBtn);
    this.closeBtn.addEventListener('click', this.close.bind(this));

    // Touch-Onboarding: beim ersten Öffnen auf Touch-Geräten kurz eingeblendet,
    // blendet nach ein paar Sekunden wieder aus (session-gated). Sitzt im
    // Canvas-Rahmen, damit er genau über dem Graphen zentriert ist. Auf
    // Desktop signalisiert der grab-Cursor. Owner: Kasten mittig über dem
    // Graphen, eine Zeile je Geste (texts.graph.touch_hint).
    this.touchHint = document.createElement('div');
    this.touchHint.className = 'skill-graph__touch-hint';
    this.touchHint.setAttribute('aria-hidden', 'true');
    const hint = this.touchHint;
    const lines = Array.isArray(this.texts.touch_hint) ? this.texts.touch_hint : [];
    lines.forEach(function (line, i) {
      if (i) { hint.appendChild(document.createElement('br')); }
      hint.appendChild(document.createTextNode(line));
    });
    (this.panel.querySelector('[data-role="canvas-wrap"]') || this.panel).appendChild(this.touchHint);

    // Capture-Phase: Die Entscheidung „Auswahl lösen oder schließen“ fällt,
    // BEVOR skill-chips/skill-graph (Bubble-Phase am document) die Auswahl
    // lösen und per Event selectedSkill auf null setzen. Sonst schlösse
    // dasselbe Esc das Sheet gleich mit (Staffelung, OVL-3).
    document.addEventListener('keydown', this.onKeydown.bind(this), { capture: true });
    // Aktive Skill-Auswahl mitverfolgen (Event-Vertrag mit skill-graph/skill-chips):
    // Esc-Staffelung — erstes Esc löst nur die Auswahl, zweites schließt das Sheet.
    this.selectedSkill = null;
    const self = this;
    document.addEventListener('auflinie:skill-select', function (event) {
      self.selectedSkill = (event.detail && event.detail.skill) || null;
    });

    // Panel öffnet/schließt über [hidden] (skill-graph.js) — hier nur reagieren.
    this.observer = new MutationObserver(this.onHidden.bind(this));
    this.observer.observe(this.panel, { attributes: true, attributeFilter: ['hidden'] });

    this.opener = null;   // Knopf, über den das Sheet zuletzt aufging
    this.mountDock();
  }

  // Kleiner Öffner in der Konsole (siehe Dateikopf). Ohne Konsole, Hülle
  // oder IntersectionObserver bleibt er, wie im Markup, unsichtbar und inert.
  GraphSheet.prototype.mountDock = function () {
    const dock = document.querySelector('[data-role="graph-dock"]');
    const box = dock && dock.closest('[data-role="skill-console"]');
    const scope = box && box.closest('.cv-skills');
    const slot = this.root.querySelector('[data-role="graph-toggle-slot"]');
    if (!dock || !box || !scope || !slot || !('IntersectionObserver' in window)) { return; }
    this.dock = dock;
    this.dockScope = scope;
    this.docked = null;
    // Ausgangslage wie im Markup (großer bedienbar), bis der Observer misst
    scope.setAttribute('data-graph-dock', 'big');

    const self = this;
    dock.addEventListener('click', function () {
      if (!self.panel.hidden) { return; }
      self.opener = dock;
      self.toggle.click();   // skill-graph.js öffnet, onHidden präsentiert
    });

    // Verwandlung beim Scrollen (CSS, _skill-graph.scss) nur, wo die Engine
    // Scroll-Zeitleisten kann und keine reduzierte Bewegung gewünscht ist.
    // Sonst einfache Blende und Umschalten, sobald die Konsole den großen
    // Knopf zu verdecken beginnt.
    const motion = window.matchMedia('(prefers-reduced-motion: no-preference)');
    const timelines = !!(window.CSS && CSS.supports &&
      CSS.supports('animation-timeline: view()') && CSS.supports('timeline-scope: none'));
    const rootPx = function () { return parseFloat(getComputedStyle(document.documentElement).fontSize) || 16; };
    // Länge aus einer Custom Property des CSS (rem oder px) in px
    function cssPx(name) {
      const v = getComputedStyle(scope).getPropertyValue(name).trim();
      const n = parseFloat(v);
      if (!isFinite(n)) { return 0; }
      return /rem$/.test(v) ? n * rootPx() : n;
    }

    // Unterkante der klebenden Konsole im Viewport: ihr top (Masthead,
    // Sticky-TOC, Abstand) plus ihre Höhe. Ändert sich mit der Fenstergröße
    // und wenn toc.js --sticky-toc-height an der Konsole umsetzt. Dazu die
    // Maße, mit denen das CSS den großen Knopf genau auf den kleinen führt.
    let io = null;
    let margin = '';
    function observe() {
      const line = Math.round((parseFloat(getComputedStyle(box).top) || 0) + box.offsetHeight);
      const h = slot.offsetHeight;
      const s = h ? dock.offsetHeight / h : 1;
      const dockRect = dock.getBoundingClientRect();
      const boxRect = box.getBoundingClientRect();
      const gap = Math.round(boxRect.bottom - dockRect.bottom);
      const dx = Math.round(dockRect.right - slot.getBoundingClientRect().left - s * self.toggle.offsetWidth);
      scope.style.setProperty('--graph-dock-line', line + 'px');
      scope.style.setProperty('--graph-dock-s', String(Math.round(s * 1000) / 1000));
      scope.style.setProperty('--graph-dock-dx', dx + 'px');
      scope.style.setProperty('--graph-dock-gap', gap + 'px');
      // Umschaltpunkt als Abstand der Unterkante der Hülle unter der Linie:
      // mit Verwandlung in der Mitte der Überblendung am Ende des Wegs, sonst
      // sobald ihre Oberkante die Konsole erreicht
      const ride = cssPx('--graph-dock-ride');
      const at = timelines && motion.matches && ride
        ? cssPx('--graph-dock-fade') / 2 - ride
        : h;
      const next = (-Math.round(line + at)) + 'px 0px ' + DOCK_FAR + 'px 0px';
      if (next === margin && io) { return; }
      margin = next;
      if (io) { io.disconnect(); }
      // Beobachtet wird alles ab dem Umschaltpunkt abwärts, auch weit
      // unterhalb des Viewports (riesiger unterer Rand). Sonst meldete ein
      // Sprung von „unter dem Viewport“ nach „über der Konsole“ nichts
      // (Anker, Ende-Taste): Beides wäre „schneidet nicht“.
      io = new IntersectionObserver(function (entries) {
        // Ganz über dem Umschaltpunkt: Der kleine Knopf übernimmt
        self.setDocked(!entries[entries.length - 1].isIntersecting);
      }, { rootMargin: margin });
      io.observe(slot);
    }
    observe();
    window.addEventListener('resize', observe);
    if (motion.addEventListener) { motion.addEventListener('change', observe); }
    // Schriften laden nach: Größe der Knöpfe und der Konsole neu messen
    if ('ResizeObserver' in window) {
      const ro = new ResizeObserver(observe);
      [box, dock, this.toggle].forEach(function (el) { ro.observe(el); });
    }
    new MutationObserver(observe).observe(box, { attributes: true, attributeFilter: ['style'] });

    // Läuft der Text der Konsole über, hält ein Platzhalter am Textende die
    // Ecke des kleinen Knopfs frei (.has-overflow, _cv.scss). Gemessen ohne
    // ihn, nur innerhalb der Konsole (feste Höhe, die Seite verschiebt sich
    // nicht).
    const info = box.querySelector('[data-role="skill-context"]');
    if (info) {
      const fit = function () {
        info.classList.remove('has-overflow');
        info.classList.toggle('has-overflow', info.scrollHeight > info.clientHeight + 1);
      };
      new MutationObserver(fit).observe(info, { childList: true, characterData: true, subtree: true });
      window.addEventListener('resize', fit);
      fit();
    }
  };

  // Genau einer der beiden Öffner ist bedienbar und für Screenreader da
  GraphSheet.prototype.setDocked = function (docked) {
    if (docked === this.docked) { return; }
    this.docked = docked;
    const show = docked ? this.dock : this.toggle;
    const hide = docked ? this.toggle : this.dock;
    show.inert = false;
    show.removeAttribute('aria-hidden');
    // Der Fokus wandert mit, sonst fiele er beim inert-Setzen auf <body>
    if (document.activeElement === hide) {
      try { show.focus({ preventScroll: true }); } catch (e) { /* noop */ }
    }
    hide.inert = true;
    hide.setAttribute('aria-hidden', 'true');
    this.dockScope.setAttribute('data-graph-dock', docked ? 'small' : 'big');
  };

  GraphSheet.prototype.onHidden = function () {
    const open = !this.panel.hidden;
    if (open) { this.enterModal(); } else { this.leaveModal(); }
    document.body.classList.toggle('graph-open', open);
    if (this.dock) { this.dock.setAttribute('aria-expanded', String(open)); }
    const self = this;
    if (open) {
      requestAnimationFrame(function () { try { self.closeBtn.focus(); } catch (e) { /* noop */ } });
      this.maybeTouchHint();
    } else {
      // Fokus zurück zum Öffner, über den das Sheet aufging — erst jetzt,
      // vorher lag er im inerten Bereich. Ist dieser inzwischen nicht mehr
      // bedienbar (Fenstergröße geändert), der andere.
      const opener = this.opener || this.toggle;
      this.opener = null;
      requestAnimationFrame(function () {
        const target = opener.inert && self.dock ? (opener === self.dock ? self.toggle : self.dock) : opener;
        try { target.focus({ preventScroll: true }); } catch (e) { /* noop */ }
      });
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
    if (this.texts.dialog) { this.panel.setAttribute('aria-label', this.texts.dialog); }

    // Gemeinsamer Helfer aus site-utils.js: Live-Regionen (Route-Ansage,
    // Offline-Hinweis, Update-Toast) bleiben wie bei Drawer und TOC aktiv
    const u = window.AuflinieUtils;
    this.releaseInert = u && u.inertOutside ? u.inertOutside([this.layer]) : null;
    document.documentElement.classList.add('graph-scroll-lock');
  };

  GraphSheet.prototype.leaveModal = function () {
    if (!this.layer) { return; }
    if (this.releaseInert) { this.releaseInert(); }
    this.releaseInert = null;
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
    // Offene Vorschau beim Überfahren (data-preview am Canvas): Esc nimmt
    // erst nur sie weg (WCAG 1.4.13), skill-graph.js übernimmt das
    if (this.panel.querySelector('[data-role="canvas"][data-preview]')) { return; }
    this.close();
  };

  // Seiten-Modul (STYLEGUIDE 10.2): mountet einmal beim Laden, Marker
  // data-graph-sheet-mounted
  function mount() {
    document.querySelectorAll('[data-skill-graph]').forEach(function (el) {
      if (el.hasAttribute('data-graph-sheet-mounted')) { return; }
      el.setAttribute('data-graph-sheet-mounted', '');
      new GraphSheet(el);   // die Instanz lebt über ihre Listener weiter
    });
  }

  mount();
})();
