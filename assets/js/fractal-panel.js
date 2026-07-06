/**
 * Fractal Panel — gemeinsames UI-Modul der interaktiven Fraktal-Panels.
 *
 * Ersetzt die Inline-Scripts von julia-interactive.html und
 * mandelbrot-julia-explorer.html. Ein Panel wird über sein Wurzelelement
 * mit data-fractal-panel="julia|explorer" automatisch initialisiert;
 * die fachlichen Unterschiede (Anzahl Canvases, Controls, Kopplung,
 * Download-Strategie) leben ausschließlich in VARIANTS.
 *
 * Benötigt: fractal-renderer.js (FractalRenderer, FractalPalettes, FractalUtils),
 * noUiSlider, TomSelect — alle defer-geladen via _includes/fractal/deps.html.
 */
(function () {
  'use strict';

  // Wird in der Panel-Migration (Etappe 2/3) gefüllt.
  const VARIANTS = {};

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('[data-fractal-panel]').forEach(function (root) {
      const variant = VARIANTS[root.dataset.fractalPanel];
      if (!variant) {
        console.warn('fractal-panel: unbekannte Variante', root.dataset.fractalPanel);
      }
    });
  });
})();
