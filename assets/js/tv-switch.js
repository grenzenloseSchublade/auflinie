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
  var COOLDOWN_KEY = 'tv-switch:last-crt';
  var COOLDOWN_MS = 8000;
  var BASE = document.documentElement.getAttribute('data-baseurl') || '';

  function normalizePath(p) {
    return p.replace(/\/+$/, '') || '/';
  }

  // Bereich = erstes Pfad-Segment (baseurl-bereinigt): home, about,
  // mandelbrot, cv, archiv, posts … — Wechsel INNERHALB eines Bereichs
  // (Post -> Post, Pagination) bleiben ruhig
  function area(p) {
    if (BASE && p.indexOf(BASE) === 0) p = p.slice(BASE.length);
    return p.split('/')[1] || 'home';
  }

  // Dosierung: CRT nur bei Ortswechsel (Bereichsgrenze), oben gescrollt
  // und höchstens einmal pro Cooldown — der Effekt markiert Kapitel,
  // nicht jeden Klick (Nutzer-Entscheidung, siehe README-tv-umschalt.md)
  function crtAllowed(fromPath, toPath) {
    // NUR mobil: der Kanalwechsel betrifft die GANZE Seite und wirkt nur
    // stimmig, wenn das Hero-Bild den Viewport füllt (mobil). Auf Desktop (mehr
    // Layout/Chrome) sähe der Ganzseiten-Effekt unruhig aus. Ihn auf Desktop
    // NUR auf die Hero-Region zu scopen wäre ein eigener Schritt (Task #10).
    // Weiterhin dosiert: Bereichswechsel + Scroll-Top + Cooldown (markiert
    // Kapitel). Firefox kann kein Cross-Doc-VT; reduced-motion schaltet
    // @view-transition ohnehin ab.
    if (window.innerWidth > 768) return false;
    if (window.scrollY > 4) return false;
    if (!toPath || area(fromPath) === area(toPath)) return false;
    try {
      var last = parseInt(sessionStorage.getItem(COOLDOWN_KEY) || '0', 10);
      if (Date.now() - last < COOLDOWN_MS) return false;
      sessionStorage.setItem(COOLDOWN_KEY, String(Date.now()));
    } catch (err) { /* Storage weg: lieber Effekt zeigen als nie */ }
    return true;
  }

  window.addEventListener('pageswap', function (e) {
    if (!e.viewTransition) return;

    var drawerOpen = !!document.querySelector('.greedy-nav .hidden-links:not(.hidden)');

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
        crt: crtAllowed(location.pathname, to),
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
