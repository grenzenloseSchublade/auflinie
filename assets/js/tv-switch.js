/*
 * TV-Umschalt-Übergang (Prototyp): setzt den View-Transition-Type "crt"
 * ausschließlich für Navigationen von der Startseite zu den beiden
 * Hero-Buttons (Über mich / Fraktale erkunden). Ohne Browser-Support
 * feuern die Events nicht — normale Navigation.
 */
(function () {
  'use strict';

  var HERO_TARGETS = ['/about/', '/mandelbrot/'];
  var BASE = (document.documentElement.getAttribute('data-baseurl') || '');

  function path(url) {
    try {
      var p = new URL(url, location.href).pathname;
      return BASE && p.indexOf(BASE) === 0 ? p.slice(BASE.length) : p;
    } catch (e) {
      return '';
    }
  }

  function heroSichtbar() {
    var hero = document.querySelector('.page__hero--overlay');
    return !!hero && hero.getBoundingClientRect().bottom > 90; // Header ragt in den Viewport
  }

  function isHeroSwitch(fromUrl, toUrl) {
    return path(fromUrl) === '/' && HERO_TARGETS.indexOf(path(toUrl)) !== -1;
  }

  window.addEventListener('pageswap', function (e) {
    if (!e.viewTransition || !e.activation || !e.activation.entry) return;
    if (isHeroSwitch(location.href, e.activation.entry.url) && heroSichtbar()) {
      e.viewTransition.types.add('crt');
    }
  });

  window.addEventListener('pagereveal', function (e) {
    if (!e.viewTransition || !e.activation || !e.activation.from) return;
    if (isHeroSwitch(e.activation.from.url, location.href)) {
      e.viewTransition.types.add('crt');
    }
  });
})();
