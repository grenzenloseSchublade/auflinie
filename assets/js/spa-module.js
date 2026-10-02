/**
 * spa-module.js — Persistent-Shell-Kontrakt als sitewide Helfer.
 *
 * Registriert ein Seiten-Modul am SPA-Lebenszyklus (spa-nav.js, siehe
 * docs/features/spa-nav.md) in einem Aufruf: mount auf spa:load /
 * pageshow(persisted) / PE-Fallback, teardown auf spa:unload.
 * mount muss idempotent sein (Mounted-Attribut beim Aufrufer).
 *
 * Sitewide geladen (VOR allen Modulen, die ihn nutzen: Skill-Feature,
 * Fraktal-Panels) — vorher lag er in skill-graph-data.js und stand damit
 * nur auf CV-Seiten zur Verfügung.
 */
(function (global) {
  'use strict';

  /** @param {{mount: function(root), teardown: function()}} opts */
  global.spaModule = function (opts) {
    document.addEventListener('spa:load', function (e) { opts.mount(e.detail && e.detail.root); });
    document.addEventListener('spa:unload', function () { opts.teardown(); });
    window.addEventListener('pageshow', function (e) { if (e.persisted) { opts.mount(document); } });

    // PE-Fallback wie docs/features/spa-nav.md (Regel 6): erst zur DOMContentLoaded-
    // bzw. complete-Zeit prüfen. Defer-Skripte laufen im Zustand 'interactive',
    // bevor spa-nav.js als letztes Defer-Skript __spaNavActive setzt. Eine
    // Prüfung auf 'loading' feuerte dort sofort und mountete jedes Modul
    // zusätzlich zum initialen spa:load (tests/spa-nav.spec.js).
    function peFallback() { if (!global.__spaNavActive) { opts.mount(document); } }
    if (document.readyState === 'complete') { peFallback(); }
    else { document.addEventListener('DOMContentLoaded', peFallback); }
  };
})(typeof self !== 'undefined' ? self : window);
