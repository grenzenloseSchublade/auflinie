/**
 * site-utils.js — gemeinsame Helfer für die Site-Skripte (STYLEGUIDE JS-18).
 *
 * Shell-Skript, einmal pro Dokument. Kein DOM-Zugriff beim Laden (matchMedia
 * liest nur den Viewport), keine Abhängigkeiten. Exportiert window.AuflinieUtils.
 *
 * Ladereihenfolge: in _includes/scripts.html als ERSTES Skript (defer), vor
 * allen Nutzern. Skripte aus dem <head> (head-early.js, mathjax-*.js) laufen
 * davor und dürfen die Helfer deshalb nicht nutzen. Precache-Eintrag in
 * service-worker.js.
 */
(function (global) {
  'use strict';

  /**
   * Live-Abfrage der Systemeinstellung „Bewegung reduzieren“. Ohne
   * matchMedia gilt: keine Einschränkung.
   * @returns {boolean}
   */
  function prefersReducedMotion() {
    return global.matchMedia
      ? global.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;
  }

  /**
   * Drosselt fn auf höchstens einen Aufruf pro Frame. Weitere Aufrufe bis
   * zum nächsten Frame verfallen, fn läuft im rAF ohne Argumente.
   * @param {function(): void} fn
   * @returns {function(): void}
   */
  function rafThrottle(fn) {
    let pending = false;
    return function () {
      if (pending) return;
      pending = true;
      global.requestAnimationFrame(function () { pending = false; fn(); });
    };
  }

  /**
   * Ruft fn sofort und bei jeder Größenänderung von Dokument oder Viewport
   * auf (ResizeObserver auf <body> plus window resize). Für Maße wie
   * scrollHeight, die ein Scroll-Handler sonst pro Frame läse (PERF-8): fn
   * misst und cacht, der Handler liest nur den Cache. Der ResizeObserver
   * meldet nach dem Layout, Lesen dort erzwingt also kein Layout.
   * @param {function(): void} fn
   * @param {AbortSignal} [signal] beendet Listener und Observer (Teardown)
   */
  function onDocumentResize(fn, signal) {
    fn();
    global.addEventListener('resize', fn, { passive: true, signal: signal });
    if (!('ResizeObserver' in global) || !global.document.body) return;
    const ro = new global.ResizeObserver(function () { fn(); });
    ro.observe(global.document.body);
    if (signal) signal.addEventListener('abort', function () { ro.disconnect(); }, { once: true });
  }

  /**
   * Breakpoints als Live-Abfragen (STYLEGUIDE BP-2), dieselben Grenzen wie
   * die Sass-Mixins. Nur hier stehen Breiten-Zahlen im JS, Nutzer lesen
   * `AuflinieUtils.mq.downMd.matches`.
   * Spiegel zu variables/_layout.scss ($bp-md, $bp-lg, $bp-xl) und
   * abstracts/_breakpoints.scss: down(x) = max-width: x - 0.02px.
   * scripts/bp-guardrail.sh prüft, dass die Werte übereinstimmen.
   * Ohne matchMedia: null, Nutzer fallen auf ihr Desktop-Verhalten zurück.
   */
  const BREAKPOINT_QUERIES = {
    downMd: '(max-width: 767.98px)',   // mobil, down(md)
    downLg: '(max-width: 1023.98px)',  // ohne Seitenleiste, down(lg)
    downXl: '(max-width: 1279.98px)',  // down(xl)
  };
  const mq = {};
  Object.keys(BREAKPOINT_QUERIES).forEach(function (key) {
    mq[key] = global.matchMedia ? global.matchMedia(BREAKPOINT_QUERIES[key]) : null;
  });

  global.AuflinieUtils = {
    prefersReducedMotion: prefersReducedMotion,
    rafThrottle: rafThrottle,
    onDocumentResize: onDocumentResize,
    mq: mq,
  };
})(window);
