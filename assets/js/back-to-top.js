/**
 * back-to-top.js — Back-to-Top-Button (Markup _includes/back-to-top.html).
 * Seiten-Modul (STYLEGUIDE 10.2): mountet einmal beim Laden, Marker
 * data-back-to-top-mounted. Braucht site-utils.js (window.AuflinieUtils),
 * vorher geladen (_includes/scripts.html).
 */
(function () {
  'use strict';

  // site-utils.js liefert die Helfer. Fallback, falls sie fehlen (z. B. altes
  // HTML aus dem HTTP-Cache trifft kurz nach einem Deploy auf neues Skript):
  // dann ohne Drosselung und mit reduzierter Bewegung (Sprung statt Gleiten),
  // aber ohne Absturz.
  function utils() {
    return window.AuflinieUtils || {
      rafThrottle: function (fn) { return fn; },
      onDocumentResize: function (fn, signal) { fn(); window.addEventListener('resize', fn, { signal: signal }); },
      prefersReducedMotion: function () { return true; },   // ohne Helfer: Bewegung reduziert
    };
  }
  const SCROLL_THRESHOLD = 888, MIN_RATIO = 1.5, FOOTER_GAP = 24;

  function mount() {
    const btn = document.querySelector('.back-to-top');
    if (!btn || btn.hasAttribute('data-back-to-top-mounted')) return;
    btn.setAttribute('data-back-to-top-mounted', '');

    // Maße aus dem Cache (PERF-8): Viewport- und Seitenhöhe, Lage des Footers
    // im Dokument und der Grund-Abstand aus dem CSS ändern sich nur mit dem
    // Layout. onDocumentResize misst sie neu, der Scrollpfad liest nur
    // scrollY. Früher las jeder Frame scrollHeight, getBoundingClientRect
    // und getComputedStyle, oft direkt nach Schreibzugriffen anderer
    // Handler und damit als erzwungene Neuberechnung.
    let vh = 0, ph = 0, footerTopDoc = null, base = 24;
    let lastScrollY = window.scrollY;
    let lastVisible = null, lastPush = null;

    function measure() {
      vh = window.innerHeight;
      ph = document.documentElement.scrollHeight;
      const footer = document.querySelector('.page__footer');
      footerTopDoc = footer ? footer.getBoundingClientRect().top + window.scrollY : null;
      // Spiegel zu components/_back-to-top.scss: --btt-base-bottom (24px, unter $bp-md 20px)
      base = parseFloat(getComputedStyle(btn).getPropertyValue('--btt-base-bottom')) || 24;
    }

    function checkVisibility(scrollY) {
      const isVisible = ph > vh * MIN_RATIO && scrollY > SCROLL_THRESHOLD;
      if (isVisible !== lastVisible) {
        lastVisible = isVisible;
        btn.classList.toggle('visible', isVisible);
      }
      if (footerTopDoc !== null) {
        // Stufenlos an den Footer koppeln: sobald dessen Oberkante ins Bild
        // kommt, „reitet" der Button FOOTER_GAP darüber hoch — scroll-gekoppelt,
        // kein harter Schwellwert-Sprung. push=0, solange der Footer weit unten ist.
        const footerTop = footerTopDoc - scrollY;
        const push = Math.max(0, vh - footerTop + FOOTER_GAP - base);
        if (push !== lastPush) {
          lastPush = push;
          btn.style.setProperty('--btt-footer-push', push + 'px');
        }
      }
    }
    // rAF-gekoppelt statt setTimeout-Throttle: pro Paint-Frame genau EIN Update
    // -> ruckelfreies „Reiten" über dem Footer, auch bei schnellem Scrollen (der
    // Button läuft so gar nicht erst in den Footer und springt dann raus).
    // scrollY wird im Scroll-Event gelesen (vor allen rAF-Callbacks), der
    // rAF-Callback schreibt nur (PERF-8).
    const onFrame = utils().rafThrottle(function () {
      checkVisibility(lastScrollY);
    });
    window.addEventListener('scroll', function () {
      lastScrollY = window.scrollY;
      onFrame();
    }, { passive: true });
    utils().onDocumentResize(function () {
      measure();
      lastScrollY = window.scrollY;
      onFrame();
    });
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      // Reduced Motion: springen statt gleiten (STYLEGUIDE BEW-4). Live
      // abgefragt, damit ein Umschalten der Systemeinstellung sofort wirkt.
      const reduce = utils().prefersReducedMotion();
      if ('scrollBehavior' in document.documentElement.style) window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
      else window.scrollTo(0, 0);
    });
    checkVisibility(lastScrollY);
  }

  mount();
})();
