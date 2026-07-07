/*
 * Folgen-Dropdown im Autor-Profil: Vanilla-Ersatz für den entfernten
 * jQuery-Toggle des Themes (main.min.js wird nicht mehr geladen).
 * Toggelt .is--visible auf .author__urls; schließt bei Außenklick/Escape.
 */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    var wrapper = document.querySelector('.author__urls-wrapper');
    if (!wrapper) return;
    var btn = wrapper.querySelector('button');
    var list = wrapper.querySelector('.author__urls');
    if (!btn || !list) return;

    btn.setAttribute('aria-expanded', 'false');

    function close() {
      list.classList.remove('is--visible');
      btn.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
    }

    btn.addEventListener('click', function () {
      var offen = list.classList.toggle('is--visible');
      btn.classList.toggle('open', offen);
      btn.setAttribute('aria-expanded', offen ? 'true' : 'false');
    });

    document.addEventListener('click', function (e) {
      if (!wrapper.contains(e.target)) close();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') close();
    });
  });
})();
