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

  // Vollbild-Hero-Zustand: der Header reicht bis an den unteren
  // Bildschirmrand (768px-Breakpoint; gescrollt => nicht mehr erfüllt)
  function heroFuellt() {
    var hero = document.querySelector('.page__hero--overlay');
    return !!hero && hero.getBoundingClientRect().bottom >= window.innerHeight - 4;
  }

  function isHeroSwitch(fromUrl, toUrl) {
    return path(fromUrl) === '/' && HERO_TARGETS.indexOf(path(toUrl)) !== -1;
  }

  window.addEventListener('pageswap', function (e) {
    if (!e.viewTransition || !e.activation || !e.activation.entry) return;
    if (isHeroSwitch(location.href, e.activation.entry.url) && heroFuellt()) {
      e.viewTransition.types.add('crt');
    }
  });

  // Drawer erst schließen, DANN umschalten: der pageswap-Schnappschuss
  // entsteht im Navigationsmoment — ein offener Burger-Drawer wäre Teil
  // des Schnappschusses und racet sichtbar mit der CRT-Animation.
  // Capture-Phase, damit preventDefault vor der Default-Navigation greift;
  // der greedy-nav-Close läuft zusätzlich, GreedyNav.close() ist idempotent.
  document.addEventListener('click', function (e) {
    if (!document.body.classList.contains('menu-open')) return;
    var link = e.target && e.target.closest ? e.target.closest('.greedy-nav .hidden-links a') : null;
    if (!link || !isHeroSwitch(location.href, link.href)) return;
    e.preventDefault();

    var hlinks = document.querySelector('.greedy-nav .hidden-links');
    var done = false;
    function go() {
      if (done) return;
      done = true;
      location.href = link.href;
    }

    if (window.GreedyNav) window.GreedyNav.close();
    if (hlinks) hlinks.addEventListener('transitionend', go, { once: true });
    setTimeout(go, 350); // Fallback (z. B. gedrosselte Transition bei reduced motion)
  }, true);

  window.addEventListener('pagereveal', function (e) {
    if (!e.viewTransition || !e.activation || !e.activation.from) return;
    if (isHeroSwitch(e.activation.from.url, location.href)) {
      e.viewTransition.types.add('crt');
    }
  });
})();
