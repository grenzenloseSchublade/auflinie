/**
 * spa-module.js — Persistent-Shell-Kontrakt als sitewide Helfer.
 *
 * Registriert ein Seiten-Modul am SPA-Lebenszyklus (spa-nav.js, siehe
 * README-spa-nav.md) in einem Aufruf: mount auf spa:load /
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

    function peFallback() { if (!global.__spaNavActive) { opts.mount(document); } }
    if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', peFallback); }
    else { peFallback(); }
  };
})(typeof self !== 'undefined' ? self : window);
