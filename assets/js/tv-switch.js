/**
 * tv-switch.js — Cross-Document View Transitions, Zustandsübergabe (alte Seite).
 *
 * Types propagieren NICHT automatisch zum neuen Dokument: pageswap
 * schreibt die Entscheidung (CRT bei scrollY≈0, Drawer offen?) nach
 * sessionStorage; assets/js/head-early.js liest sie im pagereveal der
 * Zielseite und setzt dort die Types. Ohne Eintrag oder ohne Browser-Support:
 * UA-Default-Crossfade bzw. normale Navigation.
 * Der Masthead steht dabei immer (eigener Snapshot, _view-transition.scss).
 */
(function () {
  'use strict';

  // Projekt-Präfix auflinie: (geteilter github.io-Origin, STYLEGUIDE SEC-6).
  // KEY muss identisch zu KEY in assets/js/head-early.js bleiben.
  const KEY = 'auflinie:tv-switch:state';
  const COOLDOWN_KEY = 'auflinie:tv-switch:last-crt';
  const COOLDOWN_MS = 6000;
  const BASE = document.documentElement.getAttribute('data-baseurl') || '';

  // Mobil = down(md) wie der Vollbild-Hero (_hero.scss und Critical-CSS in
  // _layouts/default.html). Gate-Paar, nur gemeinsam ändern (STYLEGUIDE BP-6).
  // Ohne site-utils.js (altes HTML aus dem Cache): kein CRT, nur Crossfade.
  function isMobile() {
    const mq = window.AuflinieUtils && window.AuflinieUtils.mq;
    return !!(mq && mq.downMd && mq.downMd.matches);
  }

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
  // nicht jeden Klick (Nutzer-Entscheidung, siehe docs/features/tv-umschalt.md)
  function crtAllowed(fromPath, toPath) {
    // NUR mobil: der Kanalwechsel betrifft die GANZE Seite und wirkt nur
    // stimmig, wenn das Hero-Bild den Viewport füllt (mobil). Auf Desktop (mehr
    // Layout/Chrome) sähe der Ganzseiten-Effekt unruhig aus. Ihn auf Desktop
    // NUR auf die Hero-Region zu scopen wäre ein eigener Schritt (Task #10).
    // Weiterhin dosiert: Bereichswechsel + Scroll-Top + Cooldown (markiert
    // Kapitel). Firefox kann kein Cross-Doc-VT. Unter reduced motion läuft
    // die View Transition mit Dauer null (ARCH-2), ein CRT-Type wäre dort
    // wirkungslos und verbrauchte nur den Cooldown. Ohne site-utils.js
    // (altes HTML aus dem Cache) gilt wie bei isMobile: kein CRT.
    const utils = window.AuflinieUtils;
    if (!utils || utils.prefersReducedMotion()) return false;
    if (!isMobile()) return false;
    if (window.scrollY > 4) return false;
    if (!toPath || area(fromPath) === area(toPath)) return false;
    try {
      const last = parseInt(sessionStorage.getItem(COOLDOWN_KEY) || '0', 10);
      if (Date.now() - last < COOLDOWN_MS) return false;
      sessionStorage.setItem(COOLDOWN_KEY, String(Date.now()));
    } catch (err) { /* Storage weg: lieber Effekt zeigen als nie */ }
    return true;
  }

  window.addEventListener('pageswap', function (e) {
    if (!e.viewTransition) return;

    const drawerOpen = !!document.querySelector('.greedy-nav .hidden-links:not(.hidden)');

    // Last-minute-Änderung VOR dem Old-Snapshot (pageswap feuert vor dem
    // letzten Frame): das Content-Overlay (body::before, 0.2s-Fade) sofort
    // aus dem Bild nehmen — der Root-Snapshot soll die ungedimmte Seite
    // zeigen; der Drawer selbst bleibt offen (eigener Snapshot nav-drawer).
    if (drawerOpen) document.documentElement.classList.add('vt-capture');

    let to = '';
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
