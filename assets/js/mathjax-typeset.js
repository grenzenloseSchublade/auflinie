/**
 * MathJax unter der Persistent-Shell (spa-nav.js): nach einem Content-Swap
 * die Formeln des NEUEN Inhalts setzen, beim Wegtauschen die internen
 * Referenzen auf das alte DOM lösen.
 *
 * Bewusst die SYNCHRONE API (MathJax.typeset) statt typesetPromise:
 * in MathJax 4.1 bleibt die interne Promise-Kette (startup.promise /
 * whenReady / typesetPromise) in diesem Setup dauerhaft pending — auch mit
 * Minimal-Konfiguration und obwohl das Rendern längst fertig ist (im
 * Browser verifiziert; MathJax.typeset rendert korrekt). Muss eine
 * Ressource asynchron nachgeladen werden (Font-Range, Extension), wirft
 * typeset einen Retry-Fehler mit err.retry-Promise — das offizielle
 * Muster: warten, erneut versuchen (begrenzte Versuche).
 */
(function () {
  'use strict';

  var MAX_RETRIES = 5;

  function typesetRoot(root, attempts) {
    if (!window.MathJax || typeof MathJax.typeset !== 'function') { return; }
    try {
      MathJax.typeset([root]);
    } catch (err) {
      if (err && err.retry && attempts > 0) {
        Promise.resolve(err.retry).then(function () { typesetRoot(root, attempts - 1); });
      } else {
        console.warn('mathjax-typeset:', err && err.message ? err.message : err);
      }
    }
  }

  document.addEventListener('spa:load', function (e) {
    var detail = e.detail || {};
    if (detail.initial) { return; }              // Initial-Load typesettet MathJax selbst
    var root = detail.root;
    if (!root || !window.MathJax) { return; }
    if (typeof MathJax.typeset === 'function') {
      typesetRoot(root, MAX_RETRIES);
      return;
    }
    // Erster Swap auf eine Formel-Seite: tex-chtml.js wurde soeben injiziert,
    // der Startup läuft noch — kurz pollen, bis die API bereitsteht.
    var tries = 40;                              // ~2s
    (function waitForApi() {
      if (typeof MathJax.typeset === 'function') { typesetRoot(root, MAX_RETRIES); return; }
      if (tries-- > 0) { setTimeout(waitForApi, 50); }
    })();
  });

  document.addEventListener('spa:unload', function (e) {
    var root = e.detail && e.detail.root;
    if (!window.MathJax || typeof MathJax.typesetClear !== 'function') { return; }
    try {
      // Referenzen auf die gleich verworfenen DOM-Knoten freigeben
      MathJax.typesetClear(root ? [root] : undefined);
    } catch (err) { /* noop — Teardown darf nie den Swap blockieren */ }
  });
})();
