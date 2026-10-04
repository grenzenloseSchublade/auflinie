/**
 * back-to-top.js — Back-to-Top-Button, an den Persistent-Shell-Kontrakt
 * (spa-nav.js) gebunden.
 * window scroll/resize sind dokumentweit -> MÜSSEN im Teardown gelöst werden
 * (via AbortController), sonst zeigt der Listener nach einem Swap auf ein
 * entferntes .back-to-top und stapelt sich pro Besuch.
 * Braucht site-utils.js (window.AuflinieUtils) und spa-module.js
 * (window.spaModule), beide vorher geladen (_includes/scripts.html).
 */
(function () {
  'use strict';

  // site-utils.js liefert die Helfer. Fallback, falls sie fehlen (z. B. altes
  // HTML aus dem HTTP-Cache trifft kurz nach einem Deploy auf neues Skript):
  // dann ohne Drosselung und ohne Reduced-Motion-Abfrage, aber ohne Absturz.
  function utils() {
    return window.AuflinieUtils || {
      rafThrottle: function (fn) { return fn; },
      onDocumentResize: function (fn, signal) { fn(); window.addEventListener('resize', fn, { signal: signal }); },
      prefersReducedMotion: function () {
        return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
      },
    };
  }
  const SCROLL_THRESHOLD = 888, MIN_RATIO = 1.5, FOOTER_GAP = 24;
  let controller = null;

  function mount(root) {
    const scope = root || document;
    const btn = scope.querySelector('.back-to-top');
    if (!btn || btn.hasAttribute('data-back-to-top-mounted')) return;
    btn.setAttribute('data-back-to-top-mounted', '');

    if (controller) controller.abort();
    controller = new AbortController();
    const signal = controller.signal;

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
    const onFrame = utils().rafThrottle(function () { checkVisibility(lastScrollY); });
    window.addEventListener('scroll', function () {
      lastScrollY = window.scrollY;
      onFrame();
    }, { passive: true, signal: signal });
    utils().onDocumentResize(function () {
      measure();
      lastScrollY = window.scrollY;
      onFrame();
    }, signal);
    btn.addEventListener('click', function (e) {   // element-scoped -> stirbt mit dem DOM, kein signal nötig
      e.preventDefault();
      // Reduced Motion: springen statt gleiten (STYLEGUIDE BEW-4). Live
      // abgefragt, damit ein Umschalten der Systemeinstellung sofort wirkt.
      const reduce = utils().prefersReducedMotion();
      if ('scrollBehavior' in document.documentElement.style) window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
      else window.scrollTo(0, 0);
    });
    checkVisibility(lastScrollY);
  }

  function teardown() { if (controller) { controller.abort(); controller = null; } }

  window.spaModule({ name: 'back-to-top', mount: mount, teardown: teardown });
})();
