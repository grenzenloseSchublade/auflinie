/**
 * toc.js — Sticky-Mobile-Header, Gumshoe-ScrollSpy, Dropdown, optionales Collapse.
 *
 * Externalisiert aus dem früheren Inline-Script in _includes/toc-wrapper.html.
 * Seiten-Modul (STYLEGUIDE 10.2): mountet einmal beim Laden, Marker
 * data-toc-mounted.
 *
 * Feature-detect per DOM (keine Liquid-Abhängigkeit mehr): das Collapse wird
 * nur verdrahtet, wenn der Toggle (.toc-toggle) vorhanden ist; die frühere
 * toc_id kommt aus dem gerenderten Toggle-id-Attribut.
 *
 * Braucht gumshoe.min.js und site-utils.js (window.AuflinieUtils), beide
 * vorher geladen (_includes/scripts.html).
 */
(function () {
  'use strict';

  // site-utils.js liefert die Helfer. Fallback, falls sie fehlen (z. B. altes
  // HTML aus dem HTTP-Cache trifft kurz nach einem Deploy auf neues Skript):
  // dann ohne Drosselung, ohne Breakpoints (Verhalten wie auf dem Desktop,
  // kein Sticky-TOC) und mit reduzierter Bewegung, aber ohne Absturz.
  function utils() {
    return window.AuflinieUtils || {
      rafThrottle: function (fn) { return fn; },
      onDocumentResize: function (fn, signal) { fn(); window.addEventListener('resize', fn, { signal: signal }); },
      prefersReducedMotion: function () { return true; },   // ohne Helfer: Bewegung reduziert
    };
  }

  // Ohne Sidebar-TOC: unter $bp-lg, Gegenstück down(lg) in _toc.scss.
  function isBelowLg() {
    const mq = utils().mq;
    return !!(mq && mq.downLg && mq.downLg.matches);
  }

  // Spiegel zu variables/_css-properties.scss: --masthead-height (Grundwert
  // in :root). Greift nur, wenn das Token fehlt.
  const MASTHEAD_HEIGHT_FALLBACK_PX = 74;
  // Spiegel zu components/_toc.scss: .toc-sticky-mobile__current
  // (is-sliding-out $duration-fast, is-sliding-in $duration-base)
  const SLIDE_OUT_MS = 150;
  const SLIDE_IN_MS = 200;
  let gumshoeInstance = null;

  // Höhe der Sticky-TOC in den Sprungmarken-Versatz geben (WCAG 2.4.11).
  // Spiegel zu variables/_css-properties.scss: --anchor-offset ist der
  // Versatz ohne Leiste. Unter $bp-lg zählt die Leiste immer mit, auch
  // solange sie verborgen ist: Jedes Sprungziel aus dem TOC ist eine
  // Überschrift, nach dem Sprung ist sie aktiv und die Leiste fährt ein.
  // Hinge der Versatz an der Sichtbarkeit, landete ein Sprung von oben (TOC
  // im Bild, Leiste noch weg) mit der Überschrift unter der Leiste. Gleiche
  // Linie wie getGumshoeOffset, deshalb ist die Überschrift nach dem Sprung
  // genau die aktive. An <html> landet nur scroll-padding-top (inline, nicht
  // vererbt), keine Custom Property: eine Custom Property auf <html>
  // berechnet alle Elemente der Seite neu (PERF-6). Geschrieben wird nur bei
  // einer neuen Höhe (Layout-Wechsel), nicht beim Ein- und Ausblenden.
  let lastAnchorHeight = 0;
  function setAnchorOffset(height) {
    if (height === lastAnchorHeight) { return; }
    lastAnchorHeight = height;
    const root = document.documentElement.style;
    if (height > 0) { root.setProperty('scroll-padding-top', 'calc(var(--anchor-offset) + ' + height + 'px)'); }
    else { root.removeProperty('scroll-padding-top'); }
  }

  // Elemente mit data-sticky-toc-offset (CV-Auswahl-Konsole) rücken nur unter
  // die sichtbare Leiste. Sie bekommen die Höhe als --sticky-toc-height
  // direkt, das trifft nur ihren Teilbaum.
  function setStickyOffset(targets, height) {
    targets.forEach(function (el) { el.style.setProperty('--sticky-toc-height', height + 'px'); });
  }

  function mount() {
    const scope = document;
    const stickyToc = scope.querySelector('#toc-sticky-mobile');
    const stickyToggle = scope.querySelector('#toc-sticky-toggle');
    const stickyDropdown = scope.querySelector('#toc-sticky-dropdown');
    const stickyCurrent = scope.querySelector('#toc-sticky-current');
    const stickyOverlay = scope.querySelector('#toc-sticky-overlay');
    const originalToc = scope.querySelector('#toc-original');
    const progressBar = scope.querySelector('#toc-sticky-mobile .toc-sticky-mobile__progress');
    const offsetTargets = Array.prototype.slice.call(scope.querySelectorAll('[data-sticky-toc-offset]'));

    if (!stickyToc || !originalToc) { return; }
    if (stickyToc.hasAttribute('data-toc-mounted')) { return; }
    stickyToc.setAttribute('data-toc-mounted', '');

    let gumshoeRetries = 0;

    let isDropdownOpen = false;
    let stickyVisible = false;
    let cachedMastheadHeight = null;
    // Gecacht statt pro Scroll-Frame gemessen (PERF-8), aktualisiert bei
    // jeder Größenänderung von Dokument oder Viewport (onDocumentResize)
    let scrollMax = 0;              // scrollHeight - innerHeight
    let tocBottomDoc = 0;           // Unterkante des Original-TOC in Dokumentkoordinaten
    let stickyBarHeight = 0;        // Höhe der Leiste ohne aufgeklapptes Dropdown
    let lastProgress = '';
    // Aktiver Link laut Gumshoe-Ereignissen, null über der ersten Überschrift
    let activeLink = null;

    const getMastheadHeight = function () {
      if (cachedMastheadHeight === null) {
        const val = getComputedStyle(document.documentElement).getPropertyValue('--masthead-height').trim();
        cachedMastheadHeight = parseInt(val, 10) || MASTHEAD_HEIGHT_FALLBACK_PX;
      }
      return cachedMastheadHeight;
    };

    // ── Visibility: Sticky-TOC nur mobil + gescrollt + Original-TOC aus dem Bild
    // + eine Überschrift aktiv. Ohne die letzte Bedingung stand die Leiste
    // schon, sobald das TOC unter dem Masthead lag, und zeigte die erste
    // Überschrift, obwohl sie noch weit unten im Bild war (/cv/: rund 800 px).
    // Die Lage des Original-TOC kommt aus dem Cache (tocBottomDoc), pro Frame
    // wird nur scrollY gelesen. Unter $bp-lg steht das TOC im Fluss, seine
    // Dokumentlage ändert sich also nur mit dem Layout. Ein
    // IntersectionObserver reicht hier nicht: springt die Seite in einem
    // Schritt von „TOC unter dem Viewport“ auf „TOC über dem Masthead“
    // (Hash-Sprung, Ende-Taste), schneidet das TOC nie und der Observer
    // meldet nichts.
    function updateStickyVisibility(knownScrollY) {
      if (!isBelowLg()) { hideStickyToc(); return; }
      const scrollY = typeof knownScrollY === 'number' ? knownScrollY : window.scrollY;
      const tocBelowMasthead = tocBottomDoc - scrollY < getMastheadHeight();
      const hasScrolled = scrollY > 50;
      if (activeLink && tocBelowMasthead && hasScrolled) { showStickyToc(); } else { hideStickyToc(); }
    }

    // Ein- und Ausblenden ändert den Versatz von Gumshoe nicht (siehe
    // getGumshoeOffset), deshalb hier kein detect() mehr: Es mäße direkt
    // nach dem Klassenwechsel und erzwänge ein Layout (PERF-8).
    function showStickyToc() {
      if (!stickyVisible) {
        stickyVisible = true;
        stickyToc.classList.add('is-visible');
        stickyToc.setAttribute('aria-hidden', 'false');
        setStickyOffset(offsetTargets, stickyBarHeight);
      }
    }

    function hideStickyToc() {
      if (stickyVisible) {
        stickyVisible = false;
        stickyToc.classList.remove('is-visible');
        stickyToc.setAttribute('aria-hidden', 'true');
        closeDropdown();
        setStickyOffset(offsetTargets, 0);
      }
    }

    // ── Gumshoe (ScrollSpy) ────────────────────────────────────────────────
    // Unter $bp-lg rechnet die Linie immer mit der Leiste, auch solange sie
    // verborgen ist. Hinge der Versatz an stickyVisible, entschiede die
    // Leiste über ihr eigenes Erscheinen: Erst die Leiste machte die erste
    // Überschrift aktiv (größerer Versatz), ohne Leiste fiele sie wieder raus,
    // an der Schwelle flackerte es. So gilt eine Überschrift überall gleich
    // als erreicht, wenn sie unter die (künftige) Leiste rutscht, und die
    // Leiste fährt genau dann ein. Desktop: nur der Masthead, wie bisher.
    function getGumshoeOffset() {
      const stickyH = isBelowLg() ? stickyBarHeight : 0;
      return getMastheadHeight() + stickyH + 20;
    }

    function initGumshoe() {
      if (typeof Gumshoe === 'undefined') {   // async geladen -> kurz warten
        if (gumshoeRetries++ >= 100) { return; }   // ~5s: gumshoe.min.js lädt nicht — aufgeben statt endlos pollen
        window.setTimeout(initGumshoe, 50);
        return;
      }
      const tocMenu = originalToc.querySelector('.toc__menu');
      if (!tocMenu) { return; }

      // Vor dem Anlegen binden: Der Konstruktor ruft detect() sofort auf,
      // so kommt auch der Startzustand (Neuladen mitten im Text, Hash-Sprung)
      // als Ereignis an
      document.addEventListener('gumshoeActivate', function (event) {
        const link = event.detail.link;
        if (!link) { return; }
        link.setAttribute('aria-current', 'true');
        activeLink = link;
        queueHeadingSync();
      });

      document.addEventListener('gumshoeDeactivate', function (event) {
        const link = event.detail.link;
        if (link) { link.removeAttribute('aria-current'); }
        if (link === activeLink) { activeLink = null; }
        queueHeadingSync();
      });

      gumshoeInstance = new Gumshoe('#toc-original .toc__menu a', {
        navClass: 'active',
        contentClass: 'active',
        nested: true,
        nestedClass: 'active',
        offset: getGumshoeOffset,
        reflow: true,
        events: true
      });
      bindScroll();   // eigener Scroll-Listener hinter den von Gumshoe (Schreiben nach Messen)
    }

    // Gumshoe meldet einen Abschnittswechsel als Deactivate und direkt danach
    // Activate, beides synchron in einem detect(). Ausgewertet wird erst im
    // Microtask danach, also mit dem Endzustand: Zwischen den beiden
    // Ereignissen wird der Text nie leer, und ein Deactivate ohne Activate
    // (über die erste Überschrift zurück, etwa per Back-to-Top) setzt Text
    // und Markierung im Dropdown zurück. Der Microtask läuft nach Gumshoes
    // Messung im selben Frame und schreibt nur (PERF-8). Die Sichtbarkeit
    // zieht hier mit, weil detect() auch ohne Scrollen läuft (Start,
    // Resize); scrollY ist nach der Messung ohne Layout-Kosten lesbar.
    let headingSyncQueued = false;
    function queueHeadingSync() {
      if (headingSyncQueued) { return; }
      headingSyncQueued = true;
      window.queueMicrotask(function () {
        headingSyncQueued = false;
        syncDropdownActive(activeLink);
        updateCurrentHeading(activeLink ? activeLink.textContent.trim() : '');
        updateStickyVisibility();
      });
    }

    function reinitGumshoe() {
      if (gumshoeInstance && gumshoeInstance.detect) { gumshoeInstance.detect(); }
    }

    // ── Scroll-Handler (Visibility + Lesefortschritt) ──────────────────────
    // Lesefortschritt als transform direkt am Balken (PERF-8): früher eine
    // Custom Property an der Leiste, die sich auf das ganze Dropdown vererbte
    // und Gumshoes Messung direkt danach eine erzwungene Neuberechnung von
    // rund 40 Elementen kostete. Desktop ohne Leiste (display: none) schreibt
    // nichts. scrollMax kommt aus dem Cache, gelesen wird nur scrollY.
    function updateReadingProgress(knownScrollY) {
      if (!progressBar || !isBelowLg()) { return; }
      const scrollY = typeof knownScrollY === 'number' ? knownScrollY : window.scrollY;
      const progress = scrollMax > 0 ? Math.min(1, scrollY / scrollMax) : 0;
      const value = progress.toFixed(4);
      if (value === lastProgress) { return; }
      lastProgress = value;
      progressBar.style.transform = 'scaleX(' + value + ')';
    }

    // Reihenfolge im Frame (PERF-8): erst messen, dann schreiben. scrollY
    // wird im Scroll-Event gelesen, das vor allen rAF-Callbacks des Frames
    // läuft. Gumshoe misst in seinem rAF, dieser Handler schreibt nur noch,
    // und zwar danach: rAF-Callbacks laufen in der Reihenfolge, in der die
    // Scroll-Listener sie anfordern, deshalb wird der Listener nach dem
    // Anlegen von Gumshoe neu gebunden (bindScroll in initGumshoe).
    let lastScrollY = window.scrollY;
    const onScrollFrame = utils().rafThrottle(function () {
      updateStickyVisibility(lastScrollY);
      updateReadingProgress(lastScrollY);
    });
    function onScroll() {
      lastScrollY = window.scrollY;
      onScrollFrame();
    }
    function bindScroll() {
      window.removeEventListener('scroll', onScroll);
      window.addEventListener('scroll', onScroll, { passive: true });
    }
    bindScroll();

    utils().onDocumentResize(function () {
      scrollMax = document.documentElement.scrollHeight - window.innerHeight;
      tocBottomDoc = originalToc.getBoundingClientRect().bottom + window.scrollY;
      // offsetHeight zählt ein offenes Dropdown mit, dessen Inhaltshöhe geht
      // ab. Der Aktuell-Text bricht nie um (nowrap), die Höhe hängt also nur
      // an Breite und Schrift. Desktop (display: none): 0.
      stickyBarHeight = stickyToc.offsetHeight - (stickyDropdown ? stickyDropdown.clientHeight : 0);
      setAnchorOffset(isBelowLg() ? stickyBarHeight : 0);
      if (stickyVisible) { setStickyOffset(offsetTargets, stickyBarHeight); }
    });

    updateStickyVisibility();
    updateReadingProgress();
    initGumshoe();

    // ── Dropdown ───────────────────────────────────────────────────────────
    // Hintergrund inert (R-77, OVL-4/A11Y-2): Solange die Liste offen ist,
    // sind Inhalt, Footer und Skip-Links weder per Tab erreichbar noch für
    // Screenreader da. Die Leiste liegt tief in #main, deshalb werden entlang
    // ihrer Vorfahren die Geschwister gesperrt, nicht nur die Kinder von
    // <body>. Ausgenommen: Leiste und Scrim (Light Dismiss per Klick), der
    // Masthead (liegt über dem Scrim und bleibt bedienbar, wie beim Drawer),
    // Skripte und Live-Regionen (Helfer inertOutside in site-utils.js).
    // Gesetzt erst nach dem Aufklappen: inert berechnet die Stile der Seite
    // neu, das soll nicht in die max-height-Animation fallen (gleiche
    // Überlegung wie im Drawer).
    let releaseInertNow = null;
    let inertTimer = null;

    function cancelInert() {
      if (inertTimer) { clearTimeout(inertTimer); inertTimer = null; }
      if (stickyDropdown) { stickyDropdown.removeEventListener('transitionend', onOpenEnd); }
    }

    function setBackgroundInert() {
      cancelInert();
      const u = window.AuflinieUtils;
      if (releaseInertNow || !isDropdownOpen || !u || !u.inertOutside) { return; }
      releaseInertNow = u.inertOutside([stickyToc, stickyOverlay, document.querySelector('.masthead')]);
    }

    function releaseBackground() {
      cancelInert();
      if (!releaseInertNow) { return; }
      releaseInertNow();
      releaseInertNow = null;
    }

    function onOpenEnd(e) {
      if (e.target === stickyDropdown && e.propertyName === 'max-height') { setBackgroundInert(); }
    }

    function openDropdown() {
      isDropdownOpen = true;
      stickyToggle.setAttribute('aria-expanded', 'true');
      stickyToc.classList.add('is-open');
      stickyOverlay.classList.add('is-visible');
      stickyOverlay.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      cancelInert();
      if (stickyDropdown) { stickyDropdown.addEventListener('transitionend', onOpenEnd); }
      inertTimer = setTimeout(setBackgroundInert, 400); // Fallback (Aufklappen: $duration-moderate)
    }

    function closeDropdown() {
      if (!isDropdownOpen) { return; }
      isDropdownOpen = false;
      stickyToggle.setAttribute('aria-expanded', 'false');
      stickyToc.classList.remove('is-open');
      stickyOverlay.classList.remove('is-visible');
      stickyOverlay.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      releaseBackground();
    }

    // Per Enter/Leertaste geöffnet (click mit detail 0): Fokus auf den ersten
    // Link der Liste (A11Y-2). Bei Maus/Touch bleibt er am Toggle, wie bei
    // Drawer und Autor-Dropdown: das Theme zeichnet schon bei :focus einen
    // Ring um Links, nach dem Antippen stünde er ohne Grund am ersten Eintrag.
    if (stickyToggle) {
      stickyToggle.addEventListener('click', function (e) {
        if (isDropdownOpen) { closeDropdown(); return; }
        openDropdown();
        if (e.detail === 0 && stickyDropdown) {
          const first = stickyDropdown.querySelector('a[href]');
          if (first) { first.focus({ preventScroll: true }); }
        }
      });
    }
    if (stickyOverlay) {
      stickyOverlay.addEventListener('click', closeDropdown);
    }
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && isDropdownOpen) {
        closeDropdown();
        stickyToggle.focus();
      }
    });
    if (stickyDropdown) {
      stickyDropdown.addEventListener('click', function (e) {
        if (e.target.tagName === 'A') { closeDropdown(); }
      });
    }

    // ── Aktuelle Überschrift im Sticky-Header (mit Slide-Animation) ─────────
    // wantedText ist immer der neueste Stand ('' = nichts aktiv). Kommt ein
    // Wechsel, während die Animation läuft, wird er nicht verworfen (früher
    // blieb die Leiste dann auf einem alten Abschnitt stehen, etwa beim
    // weichen Scrollen per Back-to-Top): Der Tausch in der Mitte nimmt den
    // neuesten Text, ein noch späterer Wechsel landet am Ende ohne zweite
    // Animation. Schnelle Folgen ergeben so höchstens eine Animation statt
    // einer Warteschlange. Ohne Animation: verborgene Leiste (sie fährt mit
    // dem richtigen Text ein), leerer Text, reduzierte Bewegung (BEW-1a).
    let wantedText = '';
    let isAnimating = false;

    function updateCurrentHeading(newText) {
      if (!stickyCurrent || newText === wantedText) { return; }
      wantedText = newText;
      if (isAnimating) { return; }
      if (!stickyVisible || !newText || utils().prefersReducedMotion()) {
        stickyCurrent.textContent = newText;
        return;
      }
      isAnimating = true;
      stickyCurrent.classList.add('is-sliding-out');
      window.setTimeout(function () {
        stickyCurrent.textContent = wantedText;
        stickyCurrent.classList.remove('is-sliding-out');
        stickyCurrent.classList.add('is-sliding-in');
        window.setTimeout(function () {
          stickyCurrent.classList.remove('is-sliding-in');
          isAnimating = false;
          if (stickyCurrent.textContent !== wantedText) { stickyCurrent.textContent = wantedText; }
        }, SLIDE_IN_MS);
      }, SLIDE_OUT_MS);
    }

    const dropdownLinks = stickyDropdown ? Array.prototype.slice.call(stickyDropdown.querySelectorAll('a')) : [];

    // Ohne aktiven Link (über der ersten Überschrift) ist nichts markiert
    function syncDropdownActive(link) {
      if (dropdownLinks.length === 0) { return; }
      const activeText = link ? link.textContent.trim() : null;
      dropdownLinks.forEach(function (a) {
        a.parentElement.classList.toggle('active', a.textContent.trim() === activeText);
      });
    }

    // ── Resize ──────────────────────────────────────────────────────────────
    let resizeTimeout;
    window.addEventListener('resize', function () {
      window.clearTimeout(resizeTimeout);
      resizeTimeout = window.setTimeout(function () {
        cachedMastheadHeight = null;
        updateStickyVisibility();
        updateReadingProgress();
        reinitGumshoe();
      }, 100);
    });

    // ── Optionales Collapse des Original-TOC (nur wenn Toggle vorhanden) ─────
    const tocToggle = originalToc.querySelector('.toc-toggle');
    const tocContent = scope.querySelector('.toc__menu-wrapper');
    if (tocToggle && tocContent) {
      // Projekt-Präfix auflinie: (geteilter github.io-Origin, STYLEGUIDE SEC-6)
      const legacyKey = tocToggle.id ? tocToggle.id.replace(/-toggle$/, '') + '-state' : 'toc-state';
      const storageKey = 'auflinie:' + legacyKey;
      const prefersReducedMotion = utils().prefersReducedMotion();

      // Aufgeklappt steht max-height auf none: Die Liste darf wachsen, wenn
      // Leser Textabstände vergrößern (WCAG 1.4.12), ein fester Pixelwert
      // schnitte sie ab. Für die Animation wird die Höhe nur kurz gemessen:
      // beim Aufklappen bis transitionend, beim Zuklappen als Startwert.
      // instant: ohne Übergang (Startzustand, Reduced Motion).
      const setExpanded = function (isExpanded, persist, instant) {
        const animate = !instant && !prefersReducedMotion;
        tocToggle.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
        if (!animate) { tocContent.style.transition = 'none'; }
        if (isExpanded) {
          tocContent.classList.remove('is-collapsed');
          tocContent.style.maxHeight = animate ? tocContent.scrollHeight + 'px' : 'none';
        } else {
          if (animate) {
            tocContent.style.maxHeight = tocContent.scrollHeight + 'px';
            void tocContent.offsetHeight;   // Startwert festschreiben, sonst springt none → 0
          }
          tocContent.classList.add('is-collapsed');
          tocContent.style.maxHeight = '0px';
        }
        if (!animate && !prefersReducedMotion) {
          void tocContent.offsetHeight;      // Zustand ohne Übergang übernehmen
          tocContent.style.transition = '';
        }
        if (persist !== false) {
          try { localStorage.setItem(storageKey, isExpanded ? 'expanded' : 'collapsed'); }
          catch (error) { /* localStorage nicht verfügbar */ }
        }
      };

      let storedState;
      try {
        storedState = localStorage.getItem(storageKey);
        // Einmalige Übernahme des Zustands unter dem alten Schlüssel ohne
        // Präfix. Gelöscht wird nur ein Wert im eigenen Format, nie ein
        // fremder Eintrag eines anderen Projekts auf demselben Origin.
        if (storedState === null) {
          const legacyState = localStorage.getItem(legacyKey);
          if (legacyState === 'expanded' || legacyState === 'collapsed') {
            storedState = legacyState;
            localStorage.setItem(storageKey, legacyState);
            localStorage.removeItem(legacyKey);
          }
        }
      } catch (error) { storedState = null; }

      // Ein TOC über dem Text startet eingeklappt, einer neben dem Text
      // (Seitenleiste ab lg) offen (Owner, 16. 10. 2026, ohne Ausnahme für
      // kurze Verzeichnisse). Über dem Text steht er unter lg und in breiten
      // Layouts ohne Seitenleiste (Mandelbrot, voll breit über 520 px).
      // Spiegel zu den Regeln in _toc.scss: Sie klappen ihn schon vor dem
      // ersten Bild ein, hier wird der Zustand ohne Übergang übernommen.
      // Sonst klappte er erst jetzt sichtbar zu und der Inhalt spränge hoch
      // (CLS).
      const isAboveText = isBelowLg() || originalToc.getBoundingClientRect().width > 520;
      const defaultExpanded = !isAboveText;
      const startExpanded = storedState ? storedState !== 'collapsed' : defaultExpanded;
      setExpanded(startExpanded, false, true);
      originalToc.classList.add('toc--ready');

      tocToggle.addEventListener('click', function () {
        const isExpanded = tocToggle.getAttribute('aria-expanded') === 'true';
        setExpanded(!isExpanded);
      });

      tocContent.addEventListener('transitionend', function (e) {
        if (e.target === tocContent && e.propertyName === 'max-height'
          && tocToggle.getAttribute('aria-expanded') === 'true') {
          tocContent.style.maxHeight = 'none';
        }
      });
    }
  }

  mount();
})();
