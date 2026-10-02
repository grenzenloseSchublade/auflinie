/**
 * head-early.js — parser-blockierend im <head> geladen (ohne defer/async).
 *
 * Sammelt die früheren Inline-Skripte aus head.html und head/custom.html,
 * damit die CSP ohne 'unsafe-inline' in script-src auskommt
 * (Security-Audit 10/2026, N3). Muss vor dem ersten Render laufen:
 *  1. no-js -> js auf <html> (sonst blitzen no-js-Stile kurz auf)
 *  2. pagereveal-Listener für View-Transition-Types — defer/async würden
 *     pagereveal verpassen. Gegenstück: pageswap in assets/js/tv-switch.js
 *     schreibt den Zustand (CRT bei Scroll-Top, Drawer offen) nach
 *     sessionStorage.
 */
(function () {
  'use strict';

  const root = document.documentElement;
  root.className = root.className.replace(/\bno-js\b/g, '') + ' js ';

  // Projekt-Präfix: der github.io-Origin ist mit anderen Projekten geteilt.
  // Muss identisch zu KEY in assets/js/tv-switch.js bleiben.
  const KEY = 'auflinie:tv-switch:state';
  window.addEventListener('pagereveal', function (e) {
    if (!e.viewTransition) return;
    let raw;
    try {
      raw = sessionStorage.getItem(KEY);
      if (raw !== null) sessionStorage.removeItem(KEY);
    } catch (err) { return; }
    if (!raw) return;
    let st;
    try { st = JSON.parse(raw); } catch (err) { return; }
    const here = location.pathname.replace(/\/+$/, '') || '/';
    // Stale-Guard: nur akzeptieren, wenn der Eintrag frisch ist und für
    // GENAU diese Seite geschrieben wurde (Trailing-Slash normalisiert,
    // deckt den GitHub-Pages-Redirect /about -> /about/ ab)
    if (!st || st.to !== here || !st.t || (Date.now() - st.t) > 10000) return;
    if (st.crt) e.viewTransition.types.add('crt');
    if (st.drawer) e.viewTransition.types.add('drawer');
  });
})();
