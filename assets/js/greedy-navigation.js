/*
 * Vanilla GreedyNav based on lukejacksonn/GreedyNav
 * Keeps visible links in the navbar and moves overflow to hidden menu.
 */
(function() {
  'use strict';

  function outerWidth(el) {
    if (!el) return 0;
    const style = window.getComputedStyle(el);
    const margin = parseFloat(style.marginLeft) + parseFloat(style.marginRight);
    return el.getBoundingClientRect().width + margin;
  }

  function setupGreedyNav(nav) {
    const btn = nav.querySelector('.greedy-nav__toggle');
    const vlinks = nav.querySelector('.visible-links');
    const hlinks = nav.querySelector('.hidden-links');
    const logo = nav.querySelector('.site-logo');
    const title = nav.querySelector('.site-title');
    const search = nav.querySelector('button.search__toggle');
    const logoImg = nav.querySelector('.site-logo img');

    if (!btn || !vlinks || !hlinks || !title) return;

    // Entferne alte jQuery Event-Listener (aus main.min.js)

    let numOfItems = 0;
    let breakWidths = [];
    let lastBreakpoint = null;
    let closingTime = 3000; // 3 Sekunden
    let timer;

    function addWidth(w) {
      if (typeof w !== 'number' || Number.isNaN(w)) return;
      const total = (breakWidths.length ? breakWidths[breakWidths.length - 1] : 0) + w;
      breakWidths.push(total);
      numOfItems += 1;
    }

    function measureLinks() {
      numOfItems = 0;
      breakWidths = [];
      // closingTime wird NICHT mehr hier überschrieben (Bug behoben)

      const vChildren = Array.from(vlinks.children);
      vChildren.forEach((child) => addWidth(outerWidth(child)));

      const hChildren = Array.from(hlinks.children);
      hChildren.forEach((child) => {
        const clone = child.cloneNode(true);
        clone.style.visibility = 'hidden';
        vlinks.appendChild(clone);
        addWidth(outerWidth(clone));
        vlinks.removeChild(clone);
      });
    }

    function currentBreakpoint() {
      const winWidth = window.innerWidth || document.documentElement.clientWidth;
      if (winWidth < 768) return 0;
      if (winWidth < 1024) return 1;
      if (winWidth < 1280) return 2;
      return 3;
    }

    function check() {
      const curBreakpoint = currentBreakpoint();
      if (curBreakpoint !== lastBreakpoint) {
        measureLinks();
        lastBreakpoint = curBreakpoint;
      }

      let numOfVisibleItems = vlinks.children.length;
      const availableSpace = nav.getBoundingClientRect().width
        - (logo ? outerWidth(logo) : 0)
        - outerWidth(title)
        - (search ? outerWidth(search) : 0)
        - (numOfVisibleItems !== breakWidths.length ? outerWidth(btn) : 0);

      // Sicherheitspuffer: kollabieren BEVOR es optisch eng wird
      const SAFETY = 24;
      const requiredSpace = (breakWidths[numOfVisibleItems - 1] || 0) + SAFETY;

      if (requiredSpace > availableSpace && numOfVisibleItems > 0) {
        hlinks.insertBefore(vlinks.lastElementChild, hlinks.firstChild);
        check();
      } else if (
        (availableSpace + (numOfVisibleItems === breakWidths.length - 1 ? outerWidth(btn) : 0))
        > ((breakWidths[numOfVisibleItems] || 0) + SAFETY)
      ) {
        if (hlinks.children.length > 0) {
          vlinks.appendChild(hlinks.firstElementChild);
          check();
        }
      }

      const hiddenCount = numOfItems - vlinks.children.length;
      btn.setAttribute('count', hiddenCount);
      if (hiddenCount <= 0) {
        btn.classList.add('hidden');
      } else {
        btn.classList.remove('hidden');
      }
    }

    // Hilfsfunktion zum Öffnen/Schließen des Menüs
    function openMenu() {
      hlinks.classList.remove('hidden');
      btn.classList.add('close');
      document.body.classList.add('menu-open');
    }
    
    function closeMenu() {
      hlinks.classList.add('hidden');
      btn.classList.remove('close');
      document.body.classList.remove('menu-open');
    }

    btn.addEventListener('click', function() {
      if (hlinks.classList.contains('hidden')) {
        openMenu();
      } else {
        closeMenu();
      }
    });

    // Klick auf Menü-Link schließt das Menü
    hlinks.addEventListener('click', function(e) {
      if (e.target.tagName === 'A') {
        closeMenu();
      }
    });

    // Slide-in Menü: kein automatisches Schließen bei mouseleave
    // (nur bei Klick außerhalb oder auf Overlay)

    // Click außerhalb des Menüs schließt es (Overlay-Klick)
    document.addEventListener('click', function(e) {
      const isClickInsideMenu = hlinks.contains(e.target);
      const isClickOnToggle = btn.contains(e.target);
      
      if (!isClickInsideMenu && !isClickOnToggle && !hlinks.classList.contains('hidden')) {
        closeMenu();
      }
    });

    // Touch-Event für bessere Mobile-Unterstützung
    document.addEventListener('touchstart', function(e) {
      const isClickInsideMenu = hlinks.contains(e.target);
      const isClickOnToggle = btn.contains(e.target);
      
      if (!isClickInsideMenu && !isClickOnToggle && !hlinks.classList.contains('hidden')) {
        closeMenu();
      }
    }, { passive: true });

    // rAF-Throttle: folgt dem Resize flüssig (max. eine Prüfung pro Frame);
    // der frühere 100ms-Timeout ließ die Links sichtbar nachziehen
    let rafPending = false;
    function throttledCheck() {
      if (rafPending) return;
      rafPending = true;
      window.requestAnimationFrame(() => {
        rafPending = false;
        check();
      });
    }
    window.addEventListener('resize', throttledCheck);

    // Nach dem Font-Laden neu messen: die Erstmessung mit Fallback-Font
    // unterschätzt die Linkbreiten, der Umbruch käme sonst zu spät
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        lastBreakpoint = null;
        check();
      });
    }

    if (logoImg && !(logoImg.complete && logoImg.naturalWidth !== 0)) {
      logoImg.addEventListener('load', check, { once: true });
      logoImg.addEventListener('error', check, { once: true });
    } else {
      // Inline-SVG-Logo (kein <img>): direkt messen
      check();
    }
  }

  document.addEventListener('DOMContentLoaded', function() {
    const nav = document.querySelector('nav.greedy-nav');
    if (nav) setupGreedyNav(nav);
  });
})();
