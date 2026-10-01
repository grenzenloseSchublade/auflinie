/**
 * site-utils.js — gemeinsame Helfer für die Site-Skripte (STYLEGUIDE JS-18).
 *
 * Shell-Skript, einmal pro Dokument. Kein DOM-Zugriff beim Laden, keine
 * Abhängigkeiten. Exportiert window.AuflinieUtils.
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

  global.AuflinieUtils = {
    prefersReducedMotion: prefersReducedMotion,
    rafThrottle: rafThrottle,
  };
})(window);
