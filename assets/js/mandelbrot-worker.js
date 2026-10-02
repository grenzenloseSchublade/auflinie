/**
 * mandelbrot-worker.js — Web Worker für die Mandelbrot-Menge, dünner Wrapper
 * um den gemeinsamen Rechenkern (fractal-worker-core.js), Farb-Utilities aus
 * fractal-color-utils.js (precomputeColors/interpolateColor/…).
 */
importScripts('fractal-color-utils.js', 'fractal-worker-core.js');

self.onmessage = function (e) {
    // -0.5: Standard-Zentrum der Mandelbrot-Menge
    runFractalChunkJob(e.data, { julia: false, defaultViewX: -0.5 });
};
