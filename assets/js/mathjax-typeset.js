/**
 * MathJax unter der Persistent-Shell (spa-nav.js): nach einem Content-Swap
 * die Formeln des NEUEN Inhalts setzen, beim Wegtauschen die internen
 * Referenzen auf das alte DOM lösen.
 *
 * Best Practice laut MathJax-Doku (advanced/typeset): nie zwei Typeset-Läufe
 * parallel — typesetPromise-Aufrufe an das jeweils vorige Promise ketten.
 * Der Initial-Load braucht keinen Aufruf (MathJax setzt beim Startup die
 * ganze Seite selbst); ohne SPA-Swaps ist dieses Modul ein No-Op.
 */
(function () {
  'use strict';

  var chain = Promise.resolve();

  function queue(fn) {
    chain = chain.then(fn).catch(function (err) {
      console.warn('mathjax-typeset:', err && err.message ? err.message : err);
    });
  }

  document.addEventListener('spa:load', function (e) {
    var detail = e.detail || {};
    if (detail.initial) { return; }              // Startup typesettet selbst
    var root = detail.root;
    if (!root || !window.MathJax) { return; }
    queue(function () {
      // startup.promise wartet auf Komponenten-Load (auch beim ersten Swap
      // auf eine Formel-Seite, wenn tex-chtml gerade erst injiziert wurde).
      return MathJax.startup.promise.then(function () {
        return MathJax.typesetPromise([root]);
      });
    });
  });

  document.addEventListener('spa:unload', function (e) {
    var root = e.detail && e.detail.root;
    if (!window.MathJax || !MathJax.typesetClear) { return; }
    queue(function () {
      // Referenzen auf die gleich verworfenen DOM-Knoten freigeben
      MathJax.typesetClear(root ? [root] : undefined);
    });
  });
})();
