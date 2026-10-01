/**
 * TOC — Sticky-Mobile-Header, Gumshoe-ScrollSpy, Dropdown, optionales Collapse.
 *
 * Externalisiert aus dem früheren Inline-Script in _includes/toc-wrapper.html
 * und an den Persistent-Shell-Kontrakt (spa-nav.js, siehe README-spa-nav.md)
 * gebunden: mount auf spa:load, teardown auf spa:unload. Alle dokument-/
 * fensterweiten Listener (window scroll/resize, document keydown/gumshoe*) und
 * die Gumshoe-Instanz hängen an einem AbortController bzw. werden im Teardown
 * gelöst — sonst leakten sie über Content-Swaps.
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

  const MOBILE_BREAKPOINT = 1024;
  // Spiegel zu variables/_css-properties.scss: --masthead-height (Grundwert
  // in :root). Greift nur, wenn das Token fehlt.
  const MASTHEAD_HEIGHT_FALLBACK_PX = 74;
  let controller = null;
  let gumshoeInstance = null;

  function teardown() {
    if (gumshoeInstance && gumshoeInstance.destroy) { gumshoeInstance.destroy(); }
    gumshoeInstance = null;
    if (controller) { controller.abort(); controller = null; }
    // Falls beim Teardown ein Dropdown offen war: Body-Scroll wieder freigeben.
    document.body.style.overflow = '';
    document.documentElement.style.setProperty('--sticky-toc-height', '0px');
  }

  function mount(root) {
    const scope = root || document;
    const stickyToc = scope.querySelector('#toc-sticky-mobile');
    const stickyToggle = scope.querySelector('#toc-sticky-toggle');
    const stickyDropdown = scope.querySelector('#toc-sticky-dropdown');
    const stickyCurrent = scope.querySelector('#toc-sticky-current');
    const stickyOverlay = scope.querySelector('#toc-sticky-overlay');
    const originalToc = scope.querySelector('#toc-original');

    if (!stickyToc || !originalToc) { return; }
    if (stickyToc.hasAttribute('data-toc-init')) { return; }   // idempotent
    stickyToc.setAttribute('data-toc-init', '');

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

    const isMobile = function () { return window.innerWidth < MOBILE_BREAKPOINT; };

    const getMastheadHeight = function () {
      if (cachedMastheadHeight === null) {
        const val = getComputedStyle(document.documentElement).getPropertyValue('--masthead-height').trim();
        cachedMastheadHeight = parseInt(val, 10) || MASTHEAD_HEIGHT_FALLBACK_PX;
      }
      return cachedMastheadHeight;
    };

    // ── Visibility: Sticky-TOC nur mobil + gescrollt + Original-TOC aus dem Bild
    function updateStickyVisibility() {
      if (!isMobile()) { hideStickyToc(); return; }
      const tocRect = originalToc.getBoundingClientRect();
      const mastheadHeight = getMastheadHeight();
      const tocBelowMasthead = tocRect.bottom < mastheadHeight;
      const hasScrolled = window.scrollY > 50;
      if (tocBelowMasthead && hasScrolled) { showStickyToc(); } else { hideStickyToc(); }
    }

    function showStickyToc() {
      if (!stickyVisible) {
        stickyVisible = true;
        stickyToc.classList.add('is-visible');
        stickyToc.setAttribute('aria-hidden', 'false');
        document.documentElement.style.setProperty('--sticky-toc-height', stickyToc.offsetHeight + 'px');
        reinitGumshoe();
      }
    }

    function hideStickyToc() {
      if (stickyVisible) {
        stickyVisible = false;
        stickyToc.classList.remove('is-visible');
        stickyToc.setAttribute('aria-hidden', 'true');
        closeDropdown();
        document.documentElement.style.setProperty('--sticky-toc-height', '0px');
        reinitGumshoe();
      }
    }

    // ── Gumshoe (ScrollSpy) ────────────────────────────────────────────────
    function getGumshoeOffset() {
      const mastheadH = getMastheadHeight();
      const stickyH = (isMobile() && stickyVisible) ? stickyToc.offsetHeight : 0;
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

      document.addEventListener('gumshoeActivate', function (event) {
        const link = event.detail.link;
        if (link && isMobile()) { updateCurrentHeading(link.textContent.trim()); }
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
    function updateReadingProgress() {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const progress = max > 0 ? Math.min(1, window.scrollY / max) : 0;
      stickyToc.style.setProperty('--toc-progress', progress.toFixed(4));
    }

    window.addEventListener('scroll', window.AuflinieUtils.rafThrottle(function () {
      updateStickyVisibility();
      updateReadingProgress();
    }), { passive: true, signal: controller.signal });

    updateStickyVisibility();
    initGumshoe();

    // ── Dropdown ───────────────────────────────────────────────────────────
    function openDropdown() {
      isDropdownOpen = true;
      stickyToggle.setAttribute('aria-expanded', 'true');
      stickyToc.classList.add('is-open');
      stickyOverlay.classList.add('is-visible');
      stickyOverlay.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }

    function closeDropdown() {
      if (!isDropdownOpen) { return; }
      isDropdownOpen = false;
      stickyToggle.setAttribute('aria-expanded', 'false');
      stickyToc.classList.remove('is-open');
      stickyOverlay.classList.remove('is-visible');
      stickyOverlay.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }

    if (stickyToggle) {
      stickyToggle.addEventListener('click', function () {
        if (isDropdownOpen) { closeDropdown(); } else { openDropdown(); }
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
          stickyCurrent.textContent = displayText;
          stickyCurrent.classList.remove('is-sliding-out');
          stickyCurrent.classList.add('is-sliding-in');
          window.setTimeout(function () {
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
        cachedMastheadHeight = null;
        updateStickyVisibility();
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
      const prefersReducedMotion = window.AuflinieUtils.prefersReducedMotion();
      let resizeRaf = null;

      const updateMaxHeight = function () {
        if (tocToggle.getAttribute('aria-expanded') === 'true') {
          tocContent.style.maxHeight = tocContent.scrollHeight + 'px';
        }
      };

      const setExpanded = function (isExpanded, persist) {
        tocToggle.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
        tocContent.classList.toggle('is-collapsed', !isExpanded);
        if (isExpanded) { updateMaxHeight(); } else { tocContent.style.maxHeight = '0px'; }
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

      const isFullWidthToc = originalToc.getBoundingClientRect().width > 520;
      const defaultExpanded = !isFullWidthToc;
      const startExpanded = storedState ? storedState !== 'collapsed' : defaultExpanded;
      setExpanded(startExpanded, false);

      if (prefersReducedMotion) { tocContent.style.transition = 'none'; }

      tocToggle.addEventListener('click', function () {
        const isExpanded = tocToggle.getAttribute('aria-expanded') === 'true';
        setExpanded(!isExpanded);
      }, signal);

      window.addEventListener('resize', function () {
        if (resizeRaf) { window.cancelAnimationFrame(resizeRaf); }
        resizeRaf = window.requestAnimationFrame(updateMaxHeight);
      }, signal);
    }
  }

  document.addEventListener('spa:load', function (e) { mount(e.detail && e.detail.root); });
  document.addEventListener('spa:unload', teardown);
  window.addEventListener('pageshow', function (e) { if (e.persisted) { mount(document); } });

  function peFallback() { if (!window.__spaNavActive) { mount(document); } }
  if (document.readyState === 'complete') { peFallback(); }
  else { document.addEventListener('DOMContentLoaded', peFallback); }
})();
