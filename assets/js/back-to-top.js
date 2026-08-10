/**
 * Back to Top Button — an den Persistent-Shell-Kontrakt (spa-nav.js) gebunden.
 * window scroll/resize sind dokumentweit -> MÜSSEN im Teardown gelöst werden
 * (via AbortController), sonst zeigt der Listener nach einem Swap auf ein
 * entferntes .back-to-top und stapelt sich pro Besuch.
 */
(function () {
  'use strict';
  var SCROLL_THRESHOLD = 888, MIN_RATIO = 1.5, THROTTLE_MS = 16, FOOTER_GAP = 16;
  var controller = null;

  function throttle(fn, limit) {
    var inT = false;
    return function () {
      if (!inT) { fn.apply(this, arguments); inT = true; setTimeout(function () { inT = false; }, limit); }
    };
  }

  function mount(root) {
    var scope = root || document;
    var btn = scope.querySelector('.back-to-top');
    if (!btn || btn.hasAttribute('data-back-to-top-init')) return;
    btn.setAttribute('data-back-to-top-init', '');

    if (controller) controller.abort();
    controller = new AbortController();
    var signal = controller.signal;

    function checkVisibility() {
      var vh = window.innerHeight, ph = document.documentElement.scrollHeight;
      btn.classList.toggle('visible', ph > vh * MIN_RATIO && window.scrollY > SCROLL_THRESHOLD);
      var footer = document.querySelector('.page__footer');
      if (footer) {
        // Stufenlos an den Footer koppeln: sobald dessen Oberkante ins Bild
        // kommt, „reitet" der Button FOOTER_GAP darüber hoch — scroll-gekoppelt,
        // kein harter Schwellwert-Sprung. push=0, solange der Footer weit unten ist.
        var footerTop = footer.getBoundingClientRect().top;
        var base = parseFloat(getComputedStyle(btn).getPropertyValue('--btt-base-bottom')) || 24;
        var push = Math.max(0, vh - footerTop + FOOTER_GAP - base);
        btn.style.setProperty('--btt-footer-push', push + 'px');
      }
    }
    var throttled = throttle(checkVisibility, THROTTLE_MS);
    window.addEventListener('scroll', throttled, { passive: true, signal: signal });
    window.addEventListener('resize', throttled, { passive: true, signal: signal });
    btn.addEventListener('click', function (e) {   // element-scoped -> stirbt mit dem DOM, kein signal nötig
      e.preventDefault();
      if ('scrollBehavior' in document.documentElement.style) window.scrollTo({ top: 0, behavior: 'smooth' });
      else window.scrollTo(0, 0);
    });
    checkVisibility();
  }

  function teardown() { if (controller) { controller.abort(); controller = null; } }

  document.addEventListener('spa:load', function (e) { mount(e.detail && e.detail.root); });
  document.addEventListener('spa:unload', teardown);

  function peFallback() { if (!window.__spaNavActive) mount(document); }
  if (document.readyState === 'complete') peFallback();
  else document.addEventListener('DOMContentLoaded', peFallback);
})();
