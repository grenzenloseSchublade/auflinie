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
 */
(function () {
  'use strict';

  var MOBILE_BREAKPOINT = 1024;
  var controller = null;
  var gumshoeInstance = null;

  function teardown() {
    if (gumshoeInstance && gumshoeInstance.destroy) { gumshoeInstance.destroy(); }
    gumshoeInstance = null;
    if (controller) { controller.abort(); controller = null; }
    // Falls beim Teardown ein Dropdown offen war: Body-Scroll wieder freigeben.
    document.body.style.overflow = '';
    document.documentElement.style.setProperty('--sticky-toc-height', '0px');
  }

  function mount(root) {
    var scope = root || document;
    var stickyToc = scope.querySelector('#toc-sticky-mobile');
    var stickyToggle = scope.querySelector('#toc-sticky-toggle');
    var stickyDropdown = scope.querySelector('#toc-sticky-dropdown');
    var stickyCurrent = scope.querySelector('#toc-sticky-current');
    var stickyOverlay = scope.querySelector('#toc-sticky-overlay');
    var originalToc = scope.querySelector('#toc-original');

    if (!stickyToc || !originalToc) { return; }
    if (stickyToc.hasAttribute('data-toc-init')) { return; }   // idempotent
    stickyToc.setAttribute('data-toc-init', '');

    if (controller) { controller.abort(); }
    controller = new AbortController();
    var signal = { signal: controller.signal };

    var isDropdownOpen = false;
    var stickyVisible = false;
    var cachedMastheadHeight = null;

    var isMobile = function () { return window.innerWidth < MOBILE_BREAKPOINT; };

    var getMastheadHeight = function () {
      if (cachedMastheadHeight === null) {
        var val = getComputedStyle(document.documentElement).getPropertyValue('--masthead-height').trim();
        cachedMastheadHeight = parseInt(val, 10) || 60;
      }
      return cachedMastheadHeight;
    };

    // ── Visibility: Sticky-TOC nur mobil + gescrollt + Original-TOC aus dem Bild
    function updateStickyVisibility() {
      if (!isMobile()) { hideStickyToc(); return; }
      var tocRect = originalToc.getBoundingClientRect();
      var mastheadHeight = getMastheadHeight();
      var tocBelowMasthead = tocRect.bottom < mastheadHeight;
      var hasScrolled = window.scrollY > 50;
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
      var mastheadH = getMastheadHeight();
      var stickyH = (isMobile() && stickyVisible) ? stickyToc.offsetHeight : 0;
      return mastheadH + stickyH + 20;
    }

    function initGumshoe() {
      if (typeof Gumshoe === 'undefined') {   // async geladen -> kurz warten
        window.setTimeout(initGumshoe, 50);
        return;
      }
      var tocMenu = originalToc.querySelector('.toc__menu');
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
        var link = event.detail.link;
        if (link && isMobile()) { updateCurrentHeading(link.textContent.trim()); }
        if (link) { link.setAttribute('aria-current', 'true'); }
        syncDropdownActive(link);
      }, signal);

      document.addEventListener('gumshoeDeactivate', function (event) {
        var link = event.detail.link;
        if (link) { link.removeAttribute('aria-current'); }
      }, signal);
    }

    function reinitGumshoe() {
      if (gumshoeInstance && gumshoeInstance.detect) { gumshoeInstance.detect(); }
    }

    // ── Scroll-Handler (Visibility + Lesefortschritt) ──────────────────────
    function updateReadingProgress() {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var progress = max > 0 ? Math.min(1, window.scrollY / max) : 0;
      stickyToc.style.setProperty('--toc-progress', progress.toFixed(4));
    }

    var scrollTicking = false;
    window.addEventListener('scroll', function () {
      if (!scrollTicking) {
        window.requestAnimationFrame(function () {
          updateStickyVisibility();
          updateReadingProgress();
          scrollTicking = false;
        });
        scrollTicking = true;
      }
    }, { passive: true, signal: controller.signal });

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
    var lastActiveText = '';
    var isAnimating = false;

    function updateCurrentHeading(newText) {
      if (!stickyCurrent || !newText) { return; }
      var displayText = newText;
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

    var dropdownLinks = stickyDropdown ? Array.prototype.slice.call(stickyDropdown.querySelectorAll('a')) : [];

    function syncDropdownActive(activeLink) {
      if (!activeLink || dropdownLinks.length === 0) { return; }
      var activeText = activeLink.textContent.trim();
      dropdownLinks.forEach(function (link) {
        var li = link.parentElement;
        if (link.textContent.trim() === activeText) { li.classList.add('active'); }
        else { li.classList.remove('active'); }
      });
    }

    // Initiale Überschrift (nach Gumshoe-Init)
    window.requestAnimationFrame(function () {
      window.setTimeout(function () {
        var activeLi = originalToc.querySelector('.toc__menu li.active');
        if (activeLi) {
          var link = activeLi.querySelector(':scope > a');
          if (link) { updateCurrentHeading(link.textContent.trim()); return; }
        }
        var firstLink = originalToc.querySelector('.toc__menu a');
        if (firstLink && !lastActiveText) { updateCurrentHeading(firstLink.textContent.trim()); }
      }, 150);
    });

    // ── Resize ──────────────────────────────────────────────────────────────
    var resizeTimeout;
    window.addEventListener('resize', function () {
      window.clearTimeout(resizeTimeout);
      resizeTimeout = window.setTimeout(function () {
        cachedMastheadHeight = null;
        updateStickyVisibility();
        reinitGumshoe();
      }, 100);
    }, signal);

    // ── Optionales Collapse des Original-TOC (nur wenn Toggle vorhanden) ─────
    var tocToggle = originalToc.querySelector('.toc-toggle');
    var tocContent = scope.querySelector('.toc__menu-wrapper');
    if (tocToggle && tocContent) {
      var storageKey = tocToggle.id ? tocToggle.id.replace(/-toggle$/, '') + '-state' : 'toc-state';
      var prefersReducedMotion = window.matchMedia
        ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
        : false;
      var resizeRaf = null;

      var updateMaxHeight = function () {
        if (tocToggle.getAttribute('aria-expanded') === 'true') {
          tocContent.style.maxHeight = tocContent.scrollHeight + 'px';
        }
      };

      var setExpanded = function (isExpanded, persist) {
        tocToggle.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
        tocContent.classList.toggle('is-collapsed', !isExpanded);
        if (isExpanded) { updateMaxHeight(); } else { tocContent.style.maxHeight = '0px'; }
        if (persist !== false) {
          try { localStorage.setItem(storageKey, isExpanded ? 'expanded' : 'collapsed'); }
          catch (error) { /* localStorage nicht verfügbar */ }
        }
      };

      var storedState;
      try { storedState = localStorage.getItem(storageKey); } catch (error) { storedState = null; }

      var isFullWidthToc = originalToc.getBoundingClientRect().width > 520;
      var defaultExpanded = !isFullWidthToc;
      var startExpanded = storedState ? storedState !== 'collapsed' : defaultExpanded;
      setExpanded(startExpanded, false);

      if (prefersReducedMotion) { tocContent.style.transition = 'none'; }

      tocToggle.addEventListener('click', function () {
        var isExpanded = tocToggle.getAttribute('aria-expanded') === 'true';
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
