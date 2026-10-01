/**
 * Back to Top Button — an den Persistent-Shell-Kontrakt (spa-nav.js) gebunden.
 * window scroll/resize sind dokumentweit -> MÜSSEN im Teardown gelöst werden
 * (via AbortController), sonst zeigt der Listener nach einem Swap auf ein
 * entferntes .back-to-top und stapelt sich pro Besuch.
 */
(function () {
  'use strict';
  const SCROLL_THRESHOLD = 888, MIN_RATIO = 1.5, FOOTER_GAP = 24;
  let controller = null;

  function mount(root) {
    const scope = root || document;
    const btn = scope.querySelector('.back-to-top');
    if (!btn || btn.hasAttribute('data-back-to-top-init')) return;
    btn.setAttribute('data-back-to-top-init', '');

    if (controller) controller.abort();
    controller = new AbortController();
    const signal = controller.signal;

    function checkVisibility() {
      const vh = window.innerHeight, ph = document.documentElement.scrollHeight;
      btn.classList.toggle('visible', ph > vh * MIN_RATIO && window.scrollY > SCROLL_THRESHOLD);
      const footer = document.querySelector('.page__footer');
      if (footer) {
        // Stufenlos an den Footer koppeln: sobald dessen Oberkante ins Bild
        // kommt, „reitet" der Button FOOTER_GAP darüber hoch — scroll-gekoppelt,
        // kein harter Schwellwert-Sprung. push=0, solange der Footer weit unten ist.
        const footerTop = footer.getBoundingClientRect().top;
        const base = parseFloat(getComputedStyle(btn).getPropertyValue('--btt-base-bottom')) || 24;
        const push = Math.max(0, vh - footerTop + FOOTER_GAP - base);
        btn.style.setProperty('--btt-footer-push', push + 'px');
      }
    }
    // rAF-gekoppelt statt setTimeout-Throttle: pro Paint-Frame genau EIN Update
    // -> ruckelfreies „Reiten" über dem Footer, auch bei schnellem Scrollen (der
    // Button läuft so gar nicht erst in den Footer und springt dann raus).
    let rafPending = false;
    function onScrollResize() {
      if (rafPending) return;
      rafPending = true;
      requestAnimationFrame(function () { rafPending = false; checkVisibility(); });
    }
    window.addEventListener('scroll', onScrollResize, { passive: true, signal: signal });
    window.addEventListener('resize', onScrollResize, { passive: true, signal: signal });
    btn.addEventListener('click', function (e) {   // element-scoped -> stirbt mit dem DOM, kein signal nötig
      e.preventDefault();
      // Reduced Motion: springen statt gleiten (STYLEGUIDE BEW-4). Live
      // abgefragt, damit ein Umschalten der Systemeinstellung sofort wirkt.
      const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if ('scrollBehavior' in document.documentElement.style) window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
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
