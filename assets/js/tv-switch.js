/*
 * Cross-Document View Transitions — Zustandsübergabe (alte Seite).
 *
 * Types propagieren NICHT automatisch zum neuen Dokument: pageswap
 * schreibt die Entscheidung (CRT bei scrollY≈0, Drawer offen?) nach
 * sessionStorage; das Inline-Script in _includes/head/custom.html liest
 * sie im pagereveal der Zielseite und setzt dort die Types. Ohne Eintrag
 * oder ohne Browser-Support: UA-Default-Crossfade bzw. normale Navigation.
 * Der Masthead steht dabei immer (eigener Snapshot, _view-transition.scss).
 */
(function () {
  'use strict';

  var KEY = 'tv-switch:state';

  function normalizePath(p) {
    return p.replace(/\/+$/, '') || '/';
  }

  window.addEventListener('pageswap', function (e) {
    if (!e.viewTransition) return;

    var drawerOpen = !!document.querySelector('.greedy-nav .hidden-links:not(.hidden)');
    var crt = window.scrollY <= 4;

    // Last-minute-Änderung VOR dem Old-Snapshot (pageswap feuert vor dem
    // letzten Frame): das Content-Overlay (body::before, 0.2s-Fade) sofort
    // aus dem Bild nehmen — der Root-Snapshot soll die ungedimmte Seite
    // zeigen; der Drawer selbst bleibt offen (eigener Snapshot nav-drawer).
    if (drawerOpen) document.documentElement.classList.add('vt-capture');

    var to = '';
    try {
      if (e.activation && e.activation.entry && e.activation.entry.url) {
        to = normalizePath(new URL(e.activation.entry.url).pathname);
      }
    } catch (err) { /* ungültige URL -> leer -> Zielseite ignoriert Eintrag */ }

    try {
      sessionStorage.setItem(KEY, JSON.stringify({
        crt: crt,
        drawer: drawerOpen,
        to: to,
        t: Date.now()
      }));
    } catch (err) { /* Storage nicht verfügbar: Fallback = Crossfade */ }
  });

  // BFCache-Rückkehr: Capture-Klasse zurücksetzen (den Drawer-Reset macht
  // greedy-navigation.js im eigenen pageshow-Handler)
  window.addEventListener('pageshow', function (e) {
    if (e.persisted) document.documentElement.classList.remove('vt-capture');
  });
})();
