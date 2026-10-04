/**
 * spa-module.js — Persistent-Shell-Kontrakt als sitewide Helfer.
 *
 * Registriert ein Seiten-Modul am SPA-Lebenszyklus (spa-nav.js, siehe
 * docs/features/spa-nav.md) in einem Aufruf: mount auf spa:load /
 * pageshow(persisted) / PE-Fallback, teardown auf spa:unload.
 * mount muss idempotent sein (Mounted-Attribut beim Aufrufer).
 *
 * Sitewide geladen, direkt nach site-utils.js und VOR allen Modulen, die
 * ihn nutzen (_includes/scripts.html). Head-Skripte laufen davor und
 * können ihn nicht nutzen (Ausnahme mathjax-typeset.js, STYLEGUIDE SPA-1).
 */
(function (global) {
  'use strict';

  /**
   * @param {{
   *   mount: function((Element|Document)=): void,
   *   teardown: function(): void,
   *   early?: boolean,
   *   name?: string
   * }} opts
   *   early: Früh-Mount beim ersten Laden (nur LCP-kritisch, STYLEGUIDE
   *   PERF-9). Läuft das Modul als Defer-Skript im Zustand 'interactive'
   *   und ist __spaNavActive noch nicht gesetzt, mountet es sofort auf
   *   document. Das initiale spa:load und der PE-Fallback überspringen den
   *   Mount dann. Swap-ins, Teardown und pageshow bleiben beim Kontrakt.
   *   name: Kennung für Diagnose und Tests (tests/spa-nav.spec.js), ohne
   *   Einfluss auf das Verhalten.
   */
  global.spaModule = function (opts) {
    let earlyMounted = false;

    document.addEventListener('spa:load', function (e) {
      if (earlyMounted && e.detail && e.detail.initial) { return; }
      opts.mount(e.detail && e.detail.root);
    });
    document.addEventListener('spa:unload', function () { opts.teardown(); });
    window.addEventListener('pageshow', function (e) { if (e.persisted) { opts.mount(document); } });

    // Früh-Mount: spa-nav.js läuft als letztes Defer-Skript, beim ersten
    // Laden ist __spaNavActive hier also noch nicht gesetzt. Ein per
    // Reconcile nachgeladenes Skript (Swap zwischen DOMContentLoaded und
    // load, Zustand ebenfalls 'interactive') sieht die Marke und mountet
    // wie jedes Modul erst auf spa:load.
    if (opts.early && document.readyState === 'interactive' && !global.__spaNavActive) {
      earlyMounted = true;
      opts.mount(document);
    }

    // PE-Fallback wie docs/features/spa-nav.md (Regel 6): erst zur DOMContentLoaded-
    // bzw. complete-Zeit prüfen. Defer-Skripte laufen im Zustand 'interactive',
    // bevor spa-nav.js als letztes Defer-Skript __spaNavActive setzt. Eine
    // Prüfung auf 'loading' feuerte dort sofort und mountete jedes Modul
    // zusätzlich zum initialen spa:load (tests/spa-nav.spec.js).
    function peFallback() { if (!global.__spaNavActive && !earlyMounted) { opts.mount(document); } }
    if (document.readyState === 'complete') { peFallback(); }
    else { document.addEventListener('DOMContentLoaded', peFallback); }
  };
})(typeof self !== 'undefined' ? self : window);
