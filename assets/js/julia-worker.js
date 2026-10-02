/**
 * julia-worker.js — Web Worker für die Julia-Menge, dünner Wrapper um den
 * gemeinsamen Rechenkern (fractal-worker-core.js), Farb-Utilities aus
 * fractal-color-utils.js (precomputeColors/interpolateColor/…).
 */
importScripts('fractal-color-utils.js', 'fractal-worker-core.js');

self.onmessage = function (e) {
    runFractalChunkJob(e.data, { julia: true });
};
