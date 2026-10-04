/**
 * toc.js — Sticky-Mobile-Header, Gumshoe-ScrollSpy, Dropdown, optionales Collapse.
 *
 * Externalisiert aus dem früheren Inline-Script in _includes/toc-wrapper.html
 * und an den Persistent-Shell-Kontrakt (spa-nav.js, siehe docs/features/spa-nav.md)
 * gebunden (window.spaModule): mount auf spa:load, teardown auf spa:unload. Alle dokument-/
 * fensterweiten Listener (window scroll/resize, document keydown/gumshoe*) und
 * die Gumshoe-Instanz hängen an einem AbortController bzw. werden im Teardown
 * gelöst — sonst leakten sie über Content-Swaps.
 *
 * Feature-detect per DOM (keine Liquid-Abhängigkeit mehr): das Collapse wird
 * nur verdrahtet, wenn der Toggle (.toc-toggle) vorhanden ist; die frühere
 * toc_id kommt aus dem gerenderten Toggle-id-Attribut.
 *
 * Braucht gumshoe.min.js, site-utils.js (window.AuflinieUtils) und
 * spa-module.js (window.spaModule), alle vorher geladen
 * (_includes/scripts.html).
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
  let controller = null;
  let gumshoeInstance = null;
  let releaseInert = null;

  function teardown() {
    if (gumshoeInstance && gumshoeInstance.destroy) { gumshoeInstance.destroy(); }
    gumshoeInstance = null;
    if (controller) { controller.abort(); controller = null; }
    // Falls beim Teardown ein Dropdown offen war: inert und Body-Scroll
    // wieder freigeben (Footer und Skip-Links überleben den Swap).
    if (releaseInert) { releaseInert(); releaseInert = null; }
    document.body.style.overflow = '';
    document.documentElement.style.removeProperty('scroll-padding-top');
  }

  // Höhe der sichtbaren Sticky-TOC in den Sprungmarken-Versatz geben (WCAG
  // 2.4.11). Spiegel zu variables/_css-properties.scss: --anchor-offset ist
  // der Versatz ohne Leiste. An <html> landet nur scroll-padding-top (inline,
  // nicht vererbt), keine Custom Property: eine Custom Property auf <html>
  // berechnet bei jedem Umschalten alle Elemente der Seite neu (PERF-6).
  // Elemente mit data-sticky-toc-offset (CV-Auswahl-Konsole) bekommen die
  // Höhe als --sticky-toc-height direkt, das trifft nur ihren Teilbaum.
  function setStickyOffset(targets, height) {
    const root = document.documentElement.style;
    if (height > 0) { root.setProperty('scroll-padding-top', 'calc(var(--anchor-offset) + ' + height + 'px)'); }
    else { root.removeProperty('scroll-padding-top'); }
    targets.forEach(function (el) { el.style.setProperty('--sticky-toc-height', height + 'px'); });
  }

  function mount(root) {
    const scope = root || document;
    const stickyToc = scope.querySelector('#toc-sticky-mobile');
    const stickyToggle = scope.querySelector('#toc-sticky-toggle');
    const stickyDropdown = scope.querySelector('#toc-sticky-dropdown');
    const stickyCurrent = scope.querySelector('#toc-sticky-current');
    const stickyOverlay = scope.querySelector('#toc-sticky-overlay');
    const originalToc = scope.querySelector('#toc-original');
    const progressBar = scope.querySelector('#toc-sticky-mobile .toc-sticky-mobile__progress');
    const offsetTargets = Array.prototype.slice.call(scope.querySelectorAll('[data-sticky-toc-offset]'));

    if (!stickyToc || !originalToc) { return; }
    if (stickyToc.hasAttribute('data-toc-mounted')) { return; }   // idempotent
    stickyToc.setAttribute('data-toc-mounted', '');

    if (controller) { controller.abort(); }
    controller = new AbortController();
    const signal = { signal: controller.signal };
    // Mount-Generation für den Gumshoe-Retry: nach Teardown (abort) darf die
    // 50ms-Schleife keine verwaiste Instanz einer alten Generation erzeugen.
    const mountSignal = controller.signal;
    let gumshoeRetries = 0;

    let isDropdownOpen = false;
    let stickyVisible = false;
    let cachedMastheadHeight = null;
    // Gecacht statt pro Scroll-Frame gemessen (PERF-8), aktualisiert bei
    // jeder Größenänderung von Dokument oder Viewport (onDocumentResize)
    let scrollMax = 0;              // scrollHeight - innerHeight
    let tocBottomDoc = 0;           // Unterkante des Original-TOC in Dokumentkoordinaten
    let lastProgress = '';

    const getMastheadHeight = function () {
      if (cachedMastheadHeight === null) {
        const val = getComputedStyle(document.documentElement).getPropertyValue('--masthead-height').trim();
        cachedMastheadHeight = parseInt(val, 10) || MASTHEAD_HEIGHT_FALLBACK_PX;
      }
      return cachedMastheadHeight;
    };

    // ── Visibility: Sticky-TOC nur mobil + gescrollt + Original-TOC aus dem Bild
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
      if (tocBelowMasthead && hasScrolled) { showStickyToc(); } else { hideStickyToc(); }
    }

    function showStickyToc() {
      if (!stickyVisible) {
        stickyVisible = true;
        stickyToc.classList.add('is-visible');
        stickyToc.setAttribute('aria-hidden', 'false');
        setStickyOffset(offsetTargets, stickyToc.offsetHeight);
        reinitGumshoe();
      }
    }

    function hideStickyToc() {
      if (stickyVisible) {
        stickyVisible = false;
        stickyToc.classList.remove('is-visible');
        stickyToc.setAttribute('aria-hidden', 'true');
        closeDropdown();
        setStickyOffset(offsetTargets, 0);
        reinitGumshoe();
      }
    }

    // ── Gumshoe (ScrollSpy) ────────────────────────────────────────────────
    function getGumshoeOffset() {
      const mastheadH = getMastheadHeight();
      const stickyH = (isBelowLg() && stickyVisible) ? stickyToc.offsetHeight : 0;
      return mastheadH + stickyH + 20;
    }

    function initGumshoe() {
      if (mountSignal.aborted) { return; }    // Seite/Mount schon abgeräumt
      if (typeof Gumshoe === 'undefined') {   // async geladen -> kurz warten
        if (gumshoeRetries++ >= 100) { return; }   // ~5s: gumshoe.min.js lädt nicht — aufgeben statt endlos pollen
        window.setTimeout(initGumshoe, 50);
        return;
      }
      const tocMenu = originalToc.querySelector('.toc__menu');
      if (!tocMenu) { return; }

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

      document.addEventListener('gumshoeActivate', function (event) {
        const link = event.detail.link;
        if (link && isBelowLg()) { updateCurrentHeading(link.textContent.trim()); }
        if (link) { link.setAttribute('aria-current', 'true'); }
        syncDropdownActive(link);
      }, signal);

      document.addEventListener('gumshoeDeactivate', function (event) {
        const link = event.detail.link;
        if (link) { link.removeAttribute('aria-current'); }
      }, signal);
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
    // Nach dem Teardown verfällt ein noch angeforderter Frame (SPA-3): er
    // schriebe sonst scroll-padding-top an <html> der neuen Seite.
    const onScrollFrame = utils().rafThrottle(function () {
      if (mountSignal.aborted) { return; }
      updateStickyVisibility(lastScrollY);
      updateReadingProgress(lastScrollY);
    });
    function onScroll() {
      lastScrollY = window.scrollY;
      onScrollFrame();
    }
    function bindScroll() {
      window.removeEventListener('scroll', onScroll);
      window.addEventListener('scroll', onScroll, { passive: true, signal: controller.signal });
    }
    bindScroll();

    utils().onDocumentResize(function () {
      scrollMax = document.documentElement.scrollHeight - window.innerHeight;
      tocBottomDoc = originalToc.getBoundingClientRect().bottom + window.scrollY;
    }, controller.signal);

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
    // Skripte und Live-Regionen. Gesetzt erst nach dem Aufklappen: inert
    // berechnet die Stile der Seite neu, das soll nicht in die
    // max-height-Animation fallen (gleiche Überlegung wie im Drawer).
    let inerted = null;
    let inertTimer = null;

    function cancelInert() {
      if (inertTimer) { clearTimeout(inertTimer); inertTimer = null; }
      if (stickyDropdown) { stickyDropdown.removeEventListener('transitionend', onOpenEnd); }
    }

    function setBackgroundInert() {
      cancelInert();
      if (inerted || !isDropdownOpen) { return; }
      const keep = new Set();
      [stickyToc, stickyOverlay].forEach(function (el) {
        for (let n = el; n && n !== document.body; n = n.parentElement) { keep.add(n); }
      });
      inerted = [];
      keep.forEach(function (n) {
        Array.prototype.forEach.call(n.parentElement.children, function (el) {
          if (keep.has(el) || el.inert || el.tagName === 'SCRIPT' || el.classList.contains('masthead')
            || el.matches('[aria-live], [role="status"], [role="alert"]')) { return; }
          el.inert = true;
          inerted.push(el);
        });
      });
    }

    function releaseBackground() {
      cancelInert();
      if (!inerted) { return; }
      inerted.forEach(function (el) { el.inert = false; });
      inerted = null;
    }
    releaseInert = releaseBackground;

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
      }, signal);
    }
    if (stickyOverlay) {
      stickyOverlay.addEventListener('click', closeDropdown, signal);
    }
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && isDropdownOpen) {
        closeDropdown();
        stickyToggle.focus();
      }
    }, signal);
    if (stickyDropdown) {
      stickyDropdown.addEventListener('click', function (e) {
        if (e.target.tagName === 'A') { closeDropdown(); }
      }, signal);
    }

    // ── Aktuelle Überschrift im Sticky-Header (mit Slide-Animation) ─────────
    let lastActiveText = '';
    let isAnimating = false;

    function updateCurrentHeading(newText) {
      if (!stickyCurrent || !newText) { return; }
      const displayText = newText;
      if (lastActiveText !== newText && !isAnimating) {
        lastActiveText = newText;
        isAnimating = true;
        stickyCurrent.classList.add('is-sliding-out');
        window.setTimeout(function () {
          if (mountSignal.aborted) { return; }
          stickyCurrent.textContent = displayText;
          stickyCurrent.classList.remove('is-sliding-out');
          stickyCurrent.classList.add('is-sliding-in');
          window.setTimeout(function () {
            if (mountSignal.aborted) { return; }
            stickyCurrent.classList.remove('is-sliding-in');
            isAnimating = false;
          }, 200);
        }, 150);
      }
    }

    const dropdownLinks = stickyDropdown ? Array.prototype.slice.call(stickyDropdown.querySelectorAll('a')) : [];

    function syncDropdownActive(activeLink) {
      if (!activeLink || dropdownLinks.length === 0) { return; }
      const activeText = activeLink.textContent.trim();
      dropdownLinks.forEach(function (link) {
        const li = link.parentElement;
        if (link.textContent.trim() === activeText) { li.classList.add('active'); }
        else { li.classList.remove('active'); }
      });
    }

    // Initiale Überschrift (nach Gumshoe-Init)
    window.requestAnimationFrame(function () {
      window.setTimeout(function () {
        if (mountSignal.aborted) { return; }
        const activeLi = originalToc.querySelector('.toc__menu li.active');
        if (activeLi) {
          const link = activeLi.querySelector(':scope > a');
          if (link) { updateCurrentHeading(link.textContent.trim()); return; }
        }
        const firstLink = originalToc.querySelector('.toc__menu a');
        if (firstLink && !lastActiveText) { updateCurrentHeading(firstLink.textContent.trim()); }
      }, 150);
    });

    // ── Resize ──────────────────────────────────────────────────────────────
    let resizeTimeout;
    window.addEventListener('resize', function () {
      window.clearTimeout(resizeTimeout);
      resizeTimeout = window.setTimeout(function () {
        if (mountSignal.aborted) { return; }
        cachedMastheadHeight = null;
        updateStickyVisibility();
        updateReadingProgress();
        reinitGumshoe();
      }, 100);
    }, signal);

    // ── Optionales Collapse des Original-TOC (nur wenn Toggle vorhanden) ─────
    const tocToggle = originalToc.querySelector('.toc-toggle');
    const tocContent = scope.querySelector('.toc__menu-wrapper');
    if (tocToggle && tocContent) {
      // Projekt-Präfix auflinie: (geteilter github.io-Origin, STYLEGUIDE SEC-6)
      const legacyKey = tocToggle.id ? tocToggle.id.replace(/-toggle$/, '') + '-state' : 'toc-state';
      const storageKey = 'auflinie:' + legacyKey;
      const prefersReducedMotion = utils().prefersReducedMotion();

      // Aufgeklappt steht max-height auf none: Die Liste darf wachsen, wenn
      // Lesende Textabstände vergrößern (WCAG 1.4.12), ein fester Pixelwert
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

      // Voll breiter TOC (mehr als 520 px) startet eingeklappt. Spiegel zur
      // Container-Query in _toc.scss: Sie klappt ihn schon vor dem ersten
      // Bild ein, hier wird der Zustand ohne Übergang übernommen. Sonst
      // klappte er erst jetzt sichtbar zu und der Inhalt spränge hoch (CLS).
      const isFullWidthToc = originalToc.getBoundingClientRect().width > 520;
      const defaultExpanded = !isFullWidthToc;
      const startExpanded = storedState ? storedState !== 'collapsed' : defaultExpanded;
      setExpanded(startExpanded, false, true);
      originalToc.classList.add('toc--ready');

      tocToggle.addEventListener('click', function () {
        const isExpanded = tocToggle.getAttribute('aria-expanded') === 'true';
        setExpanded(!isExpanded);
      }, signal);

      tocContent.addEventListener('transitionend', function (e) {
        if (e.target === tocContent && e.propertyName === 'max-height'
          && tocToggle.getAttribute('aria-expanded') === 'true') {
          tocContent.style.maxHeight = 'none';
        }
      }, signal);
    }
  }

  // spa-module.js lädt direkt nach site-utils.js und damit vor toc.js
  // (_includes/scripts.html). Älteres HTML aus dem HTTP-Cache lud es erst
  // danach: dann ohne TOC-Verhalten, aber ohne Absturz.
  if (typeof window.spaModule === 'function') {
    window.spaModule({ name: 'toc', mount: mount, teardown: teardown });
  }
})();
