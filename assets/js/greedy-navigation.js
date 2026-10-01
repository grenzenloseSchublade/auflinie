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

    function addWidth(w) {
      if (typeof w !== 'number' || Number.isNaN(w)) return;
      const total = (breakWidths.length ? breakWidths[breakWidths.length - 1] : 0) + w;
      breakWidths.push(total);
      numOfItems += 1;
    }

    function measureLinks() {
      numOfItems = 0;
      breakWidths = [];

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

    // Hilfsfunktion zum Öffnen/Schließen des Menüs.
    // menu-open (Scroll-Lock + Overlay) wird beim Schließen erst NACH dem
    // Slide-Out gelöst: das Entfernen erzwingt einen Ganzseiten-Reflow
    // (overflow: hidden fällt weg) — mitten in der Transform-Animation
    // verursachte das Ruckeln und ein kurzes Header-„Zucken".
    let releaseTimer = null;

    function cancelRelease() {
      if (releaseTimer) {
        clearTimeout(releaseTimer);
        releaseTimer = null;
      }
      hlinks.removeEventListener('transitionend', onSlideEnd);
    }

    function releaseMenuOpen() {
      cancelRelease();
      document.body.classList.remove('menu-open', 'menu-closing');
    }

    function onSlideEnd(e) {
      if (e.target === hlinks && e.propertyName === 'transform') releaseMenuOpen();
    }

    // Disclosure-Muster (STYLEGUIDE A11Y-2): aria-expanded folgt an JEDER
    // Stelle, die .hidden am Drawer umschaltet (öffnen, schließen, instant,
    // bfcache-Reset) — sonst meldet der Screenreader einen falschen Zustand.
    function setExpanded(open) {
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    }

    // Hintergrund inert (STYLEGUIDE OVL-4/A11Y-2): Solange der Drawer offen
    // ist, sind Inhalt, Footer und Skip-Links weder fokussierbar noch für
    // Screenreader erreichbar. Ausgenommen: der Masthead (Drawer + Toggle
    // liegen darin), Skripte und Live-Regionen (Ansagen sollen weiterlaufen).
    // Gesetzt wird erst NACH dem Slide-In: inert erzwingt eine Style-
    // Neuberechnung der ganzen Seite, die mitten in der Transform-Animation
    // ruckeln könnte (gleiche Überlegung wie beim menu-open-Release).
    // Beim pageswap (Drawer bleibt für den VT-Snapshot offen) bleibt alles
    // unangetastet, inert ist unsichtbar. Aufgehoben wird an JEDER Stelle,
    // die den Drawer schließt (close, instant, bfcache-Reset).
    const masthead = nav.closest('.masthead');
    let inerted = null;
    let inertTimer = null;

    function cancelInert() {
      if (inertTimer) {
        clearTimeout(inertTimer);
        inertTimer = null;
      }
      hlinks.removeEventListener('transitionend', onOpenEnd);
    }

    function setBackgroundInert() {
      cancelInert();
      if (inerted || hlinks.classList.contains('hidden')) return;
      inerted = Array.prototype.filter.call(document.body.children, function(el) {
        return el !== masthead && !el.contains(nav) && el.tagName !== 'SCRIPT'
          && !el.matches('[aria-live], [role="status"], [role="alert"]') && !el.inert;
      });
      inerted.forEach(function(el) { el.inert = true; });
    }

    function releaseBackground() {
      cancelInert();
      if (!inerted) return;
      inerted.forEach(function(el) { el.inert = false; });
      inerted = null;
    }

    function onOpenEnd(e) {
      if (e.target === hlinks && e.propertyName === 'transform') setBackgroundInert();
    }

    // keyboard: per Enter/Leertaste geöffnet (click mit detail 0). Nur dann
    // wandert der Fokus auf den ersten Drawer-Link. Bei Maus/Touch bleibt er
    // am Toggle (Tab führt von dort direkt in den Drawer): auf Mobil färbt
    // schon :focus die Drawer-Links magenta, ein programmatischer Fokus nach
    // dem Antippen sähe aus wie ein hängender Hover.
    function openMenu(keyboard) {
      cancelRelease(); // erneutes Öffnen während des Slide-Outs abfangen
      document.body.classList.remove('menu-closing'); // falls während des Schließens wieder geöffnet
      hlinks.classList.remove('hidden');
      btn.classList.add('close');
      setExpanded(true);
      document.body.classList.add('menu-open');
      cancelInert();
      hlinks.addEventListener('transitionend', onOpenEnd);
      inertTimer = setTimeout(setBackgroundInert, 360); // Fallback (Slide: 300ms)
      if (keyboard) focusFirstLink();
    }

    // Unter Reduced Motion macht der globale Kill-Switch aus „visibility 0s"
    // eine Mini-Transition: der Drawer bleibt dann noch einige Frames
    // visibility:hidden und nimmt keinen Fokus an. Dann nach deren Ende
    // erneut (transitionend gefiltert, Timer als Rückfall), sofern der Fokus
    // noch am Toggle steht.
    function focusFirstLink() {
      const first = hlinks.querySelector('a[href]');
      if (!first) return;
      first.focus({ preventScroll: true });
      if (document.activeElement === first) return;
      let timer = null;
      function onVisible(e) {
        if (e && (e.target !== hlinks || e.propertyName !== 'visibility')) return;
        clearTimeout(timer);
        hlinks.removeEventListener('transitionend', onVisible);
        if (hlinks.classList.contains('hidden') || document.activeElement !== btn) return;
        first.focus({ preventScroll: true });
      }
      hlinks.addEventListener('transitionend', onVisible);
      timer = setTimeout(onVisible, 200);
    }

    function closeMenu() {
      // Fokus im Drawer? Zurück zum Auslöser, bevor der Drawer unsichtbar
      // wird — sonst fällt er auf <body> (A11Y-2).
      const focusInside = hlinks.contains(document.activeElement);
      releaseBackground();
      hlinks.classList.add('hidden');
      btn.classList.remove('close');
      setExpanded(false);
      if (focusInside) btn.focus({ preventScroll: true });
      // Dim SOFORT mit dem Slide ausblenden — menu-open bleibt für den Scroll-
      // Lock bis Slide-Ende, aber menu-closing fadet den Overlay jetzt schon:
      // Dunkel und Drawer verschwinden gemeinsam, kein nachhängendes Dim.
      document.body.classList.add('menu-closing');
      cancelRelease();
      hlinks.addEventListener('transitionend', onSlideEnd);
      releaseTimer = setTimeout(releaseMenuOpen, 320); // Fallback (Slide: 240ms)
    }

    // Instant-Close (ohne Slide-Animation): für den Same-Document-Swap
    // (spa-nav.js). Der Drawer muss VOR dem View-Transition-Snapshot zu sein,
    // sonst klappt er WÄHREND der Kanalwechsel-Animation ein statt davor.
    // Gleiche Technik wie der bfcache-pageshow-Reset (transition:none + rAF).
    function closeInstant() {
      cancelRelease();
      releaseBackground(); // vor dem Swap: spa-nav fokussiert danach #main
      hlinks.style.transition = 'none';
      hlinks.classList.add('hidden');
      btn.classList.remove('close');
      setExpanded(false);
      document.body.classList.remove('menu-open', 'menu-closing');
      requestAnimationFrame(function() { hlinks.style.transition = ''; });
    }

    // Für andere Skripte: Drawer gezielt schließen können,
    // ohne die Klassen-Logik zu duplizieren
    window.GreedyNav = { close: closeMenu, closeInstant: closeInstant };

    btn.addEventListener('click', function(e) {
      if (hlinks.classList.contains('hidden')) {
        openMenu(e.detail === 0);
      } else {
        closeMenu();
      }
    });

    // Klick auf Menü-Link: Drawer OFFEN lassen, wenn eine Cross-Document
    // View Transition den Exit übernimmt — der pageswap-Snapshot braucht
    // den offenen Zustand, ::view-transition-old(nav-drawer) slidet ihn
    // innerhalb der Transition raus (_view-transition.scss). Nur ohne VT
    // (Firefox, Desktop >768px, reduced motion) wie früher schließen —
    // fire-and-forget parallel zur nativen Navigation.
    // Die matchMedia-Bedingung spiegelt exakt das @view-transition-Gate
    // aus _view-transition.scss — beide müssen synchron bleiben. Seit dem
    // Un-Gaten auf alle Viewports (Cross-Doc-VT überall) ist die max-width-
    // Beschränkung raus; nur noch reduced-motion gated.
    var vtGate = window.matchMedia('(prefers-reduced-motion: no-preference)');

    hlinks.addEventListener('click', function(e) {
      if (e.target.tagName !== 'A' && !e.target.closest('a')) return;
      if (!('PageSwapEvent' in window) || !vtGate.matches) {
        closeMenu();
      }
    });

    // BFCache-Rückkehr: die Seite wurde ggf. mit offenem Drawer eingefroren
    // (der Klick-Close entfällt bei VT-Navigationen) — ohne Animation
    // zurücksetzen, bevor der erste Frame gemalt wird
    window.addEventListener('pageshow', function(e) {
      if (!e.persisted || hlinks.classList.contains('hidden')) return;
      cancelRelease();
      releaseBackground();
      hlinks.style.transition = 'none';
      hlinks.classList.add('hidden');
      btn.classList.remove('close');
      setExpanded(false);
      document.body.classList.remove('menu-open', 'menu-closing');
      requestAnimationFrame(function() { hlinks.style.transition = ''; });
    });

    // Slide-in Menü: kein automatisches Schließen bei mouseleave
    // (nur bei Klick außerhalb oder auf Overlay)

    // Escape schließt den offenen Drawer und gibt den Fokus an den Toggle
    // zurück (Disclosure-Muster, STYLEGUIDE A11Y-2/OVL-3). Normales closeMenu:
    // Slide-Out + menu-open-Release nach dem Slide bleiben unverändert.
    document.addEventListener('keydown', function(e) {
      if (e.key !== 'Escape' || hlinks.classList.contains('hidden')) return;
      closeMenu();
      btn.focus();
    });

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

    // Flash-Schutz: html.js hält die Links/Burger unsichtbar, bis hier die ERSTE
    // Messung/Kollabierung durch ist -> beim (Voll-)Laden kein sichtbarer
    // „alle Links -> kollabiert"-Reflow. Erst nach check() einblenden.
    function reveal() { nav.classList.add('greedy-nav--ready'); }
    // Sicherheitsnetz: nie dauerhaft versteckt (falls check() je scheitert).
    window.addEventListener('load', reveal);
    if (logoImg && !(logoImg.complete && logoImg.naturalWidth !== 0)) {
      logoImg.addEventListener('load', function () { check(); reveal(); }, { once: true });
      logoImg.addEventListener('error', function () { check(); reveal(); }, { once: true });
    } else {
      // Inline-SVG-Logo (kein <img>): direkt messen
      check();
      reveal();
    }
  }

  document.addEventListener('DOMContentLoaded', function() {
    const nav = document.querySelector('nav.greedy-nav');
    if (nav) setupGreedyNav(nav);
  });
})();
