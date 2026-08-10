/**
 * spa-nav.js — Persistent-Shell-Navigation (Phase 1)
 *
 * Faengt AUSSCHLIESSLICH verdrahtete interne Links (Wired-Set) ab und tauscht
 * clientseitig nur .initial-content aus — der Masthead-DOM bleibt physisch
 * stehen. Streng additiv: fehlt eine Faehigkeit, ist Herkunft ODER Ziel nicht
 * verdrahtet, scheitert fetch/parse, oder betrifft es einen fremden/bfcache-
 * restaurierten History-Eintrag -> ganz normale volle Navigation.
 *
 * Kuer (Chromium + Bewegung): document.startViewTransition() umschliesst den
 * Swap. Firefox / prefers-reduced-motion: stiller, sofortiger DOM-Tausch.
 *
 * Kontrakt fuer Seiten-Skripte: document-Events 'spa:unload' (vor dem Wipe der
 * alten .initial-content) und 'spa:load' (nach Content + Script-Reconcile),
 * detail = { root, url, initial }.
 */
(function () {
  'use strict';

  // ── Progressive Enhancement: fehlt etwas, bleibt ALLES beim Alten ───────────
  if (!window.history || !window.fetch || !window.DOMParser ||
      !window.Promise || !document.querySelector || !window.Set) return;

  // Erst NACH dem Capability-Gate: nur so wissen die Module, dass wirklich ein
  // spa:load kommt (sonst naehmen sie faelschlich den PE-Fallback nicht).
  window.__spaNavActive = true;

  // ── Konfiguration ──────────────────────────────────────────────────────────
  var RUNTIME_CLASSES = ['menu-open', 'page-loading', 'page-loaded', 'vt-capture'];
  var BASEURL = (document.documentElement.getAttribute('data-baseurl') || '').replace(/\/+$/, '');
  // Pro Dokument-Instanz einmalig — unterscheidet Same-Document-Geschwister-
  // Entries von fremden/bfcache-Entries.
  var DOC_ID = (window.performance && performance.timeOrigin ? performance.timeOrigin : Date.now()) +
               ':' + Math.random().toString(36).slice(2);

  // ── Zustand ────────────────────────────────────────────────────────────────
  // Eine Navigation ist eine stornierbare Transaktion mit einer Epoch (nav.token).
  // Die Epoch besitzt Fetch UND Commit. Wird sie ueberholt, bricht der Fetch hart
  // ab (currentAbort) und der Commit kommt nie — kein Zustand bleibt haengen.
  var nav = { token: 0 };
  var STALE = {};
  var announcer = null;
  var bfRestored = false;   // pageshow(persisted) -> naechsten popstate ueberspringen
  var bfPending = null;     // verzoegerter popstate-Swap (durch pageshow abbrechbar)
  var vtDepth = 0;          // laufende SPA-View-Transitions (Masthead-Snapshot-Gate)
  // Single-Flight-Commit: es committet IMMER nur genau EINE Navigation ins DOM.
  // Kommt waehrend eines laufenden Commits eine neue, wartet sie als 'pending'
  // (juengste gewinnt) und laeuft, sobald der aktuelle Commit fertig ist. Dadurch
  // koennen sich Swap-Ketten und View-Transitions NIE ueberlappen — Epoch-Race,
  // VT-Skip-Ruckeln und vt-capture/spa-vt-Cleanup-Races sind strukturell
  // ausgeschlossen statt per Guard geflickt.
  var committing = false;
  var pending = null;
  var currentAbort = null;  // laufender Fetch; bei Ueberholung hart abgebrochen
  var loadedScripts = new Set();
  Array.prototype.forEach.call(document.querySelectorAll('script[src]'), function (s) {
    loadedScripts.add(s.src);
  });

  // ── Pfad-Helfer + Wired-Praedikat ───────────────────────────────────────────
  function stripBase(pathname) {
    if (BASEURL && pathname.indexOf(BASEURL) === 0) {
      var rest = pathname.slice(BASEURL.length);
      return rest.charAt(0) === '/' ? rest : '/' + rest;
    }
    return pathname;
  }
  // NUR Home, About, Blog-Uebersicht + Pagination. Einzelne Beitraege
  // (/posts/:title/) sind bewusst NICHT verdrahtet.
  function isWired(pathname) {
    var p = stripBase(pathname);
    if (p === '/' || p === '/about/' || p === '/cv/') return true;
    return /^\/posts\//.test(p);   // Übersicht, Pagination UND einzelne Beiträge
  }

  // ── §0 Link-Interception (delegiert am document, ueberlebt Swaps) ───────────
  document.addEventListener('click', function (e) {
    // Herkunft muss verdrahtet sein — sonst NIE abfangen (schuetzt CV/Mandelbrot
    // vor Weg-Swap in eine fremde Shell).
    if (!isWired(location.pathname)) return;
    if (e.defaultPrevented || e.button !== 0 ||
        e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    if (a.target && a.target !== '_self') return;
    if (a.hasAttribute('download') || a.hasAttribute('data-no-swap')) return;
    if (a.getAttribute('rel') === 'external') return;

    var url;
    try { url = new URL(a.href, location.href); } catch (_) { return; }
    if (url.origin !== location.origin) return;
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return;
    if (!isWired(url.pathname)) return;                               // Ziel nicht verdrahtet -> nativ

    // Reiner In-Page-Anker zur AKTUELLEN Seite -> nativer Sprung (+ Fokus)
    if (url.pathname === location.pathname && url.search === location.search && url.hash) return;
    if (url.href === location.href) { e.preventDefault(); return; }  // kein History-Duplikat

    e.preventDefault();
    navigate(url.href, true, 0);
  });

  // ── §0b Prefetch bei Absicht: wired Ziele bei Hover/Touch/Fokus vorwaermen ──
  // Rein additiv: holt die Ziel-HTML ueber denselben X-SPA-Nav-Pfad in den
  // (SW-/HTTP-)Cache, sodass der spaetere Swap-fetch ein Cache-Treffer ist —
  // macht den Wechsel auch in Firefox quasi-instant (dort kein speculationrules).
  // Nutzt bewusst NICHT nav.token (kein Eingriff in die Swap-Staleness-Logik).
  var prefetched = new Set();
  function prefetchCandidate(target) {
    var a = target && target.closest && target.closest('a[href]');
    if (!a) return null;
    if (a.target && a.target !== '_self') return null;
    if (a.hasAttribute('download') || a.hasAttribute('data-no-swap')) return null;
    if (a.getAttribute('rel') === 'external') return null;
    var url;
    try { url = new URL(a.href, location.href); } catch (_) { return null; }
    if (url.origin !== location.origin) return null;
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    if (!isWired(url.pathname)) return null;
    if (url.href === location.href) return null;
    return url.href;
  }
  function warm(target) {
    if (document.visibilityState === 'hidden') return;
    var href = prefetchCandidate(target);
    if (!href || prefetched.has(href)) return;
    var c = navigator.connection;                          // fehlt in Firefox -> uebersprungen
    if (c && (c.saveData || /(^|-)2g$/.test(c.effectiveType || ''))) return;  // Datensparen respektieren
    prefetched.add(href);
    fetch(href, { headers: { 'X-SPA-Nav': '1' }, credentials: 'same-origin' })
      .catch(function () { prefetched.delete(href); });    // Fehlschlag: erneuter Versuch erlaubt
  }
  document.addEventListener('pointerover', function (e) { warm(e.target); }, { passive: true });
  document.addEventListener('focusin', function (e) { warm(e.target); });
  document.addEventListener('touchstart', function (e) { warm(e.target); }, { passive: true });

  // ── §1 History-Aktivierung: NUR auf verdrahteter Einstiegsseite ─────────────
  if (isWired(location.pathname)) {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    try {
      history.replaceState(assign({}, history.state, {
        spa: true, docId: DOC_ID, url: location.href,
        scrollY: (history.state && history.state.scrollY) || 0
      }), '');
    } catch (_) {}
  }

  // bfcache-Restore: DOM ist bereits korrekt -> folgenden popstate ueberspringen.
  window.addEventListener('pageshow', function (e) {
    if (!e.persisted) return;
    bfRestored = true;
    if (bfPending) { clearTimeout(bfPending); bfPending = null; }     // umgekehrte Reihenfolge
    setTimeout(function () { bfRestored = false; }, 0);
  });

  window.addEventListener('popstate', function (e) {
    if (bfRestored) { bfRestored = false; return; }                  // bfcache-Restore
    var st = e.state;
    if (!st || !st.spa) return;                                      // fremder/MPA-Entry -> Browser
    if (st.docId !== DOC_ID) return;                                 // anderes Dokument -> Browser laedt korrekt
    if (!isWired(location.pathname)) return;                         // Sicherheitsnetz
    var y = st.scrollY || 0;
    if (bfPending) clearTimeout(bfPending);
    // 0-ms-Verzoegerung: ein direkt folgendes pageshow(persisted) kann abbrechen.
    bfPending = setTimeout(function () { bfPending = null; navigate(location.href, false, y); }, 0);
  });

  // ── Orchestrierung ──────────────────────────────────────────────────────────
  // Transaktion: Epoch ziehen, ueberholten Fetch hart abbrechen, Ziel holen,
  // dann committen (oder hinter einen laufenden Commit stellen).
  function navigate(href, push, restoreY) {
    var my = ++nav.token;
    // Laufenden, jetzt ueberholten Fetch WIRKLICH abbrechen (nicht nur verwerfen).
    if (currentAbort) { try { currentAbort.abort(); } catch (_) {} }
    var ac = ('AbortController' in window) ? new AbortController() : null;
    currentAbort = ac;
    fetchPage(href, my, ac && ac.signal).then(function (doc) {
      if (my !== nav.token) return;                                  // waehrend Fetch ueberholt/abgebrochen
      if (doc === STALE) return;
      if (!doc) { location.href = href; return; }                    // harte Fallback-Leitplanke
      if (needsFullLoad(doc)) { location.href = href; return; }       // neue CDN-Abhängigkeit -> voll navigieren
      commitOrQueue({ my: my, doc: doc, href: href, push: push, restoreY: restoreY });
    });
  }

  // Single-Flight: laeuft schon ein Commit, wird dies die juengste wartende
  // Navigation (aeltere wartende werden bewusst verworfen — latest-wins, nur
  // jetzt ohne jede Ueberlappung).
  function commitOrQueue(job) {
    if (committing) { pending = job; return; }
    runCommit(job);
  }

  function runCommit(job) {
    if (job.my !== nav.token) { pending = null; return; }            // schon wieder ueberholt
    committing = true;
    // fromPath JETZT (vor pushState) = die Seite, die wir tatsaechlich verlassen —
    // korrekt fuer die CRT-Dosierung, auch wenn dieser Commit gewartet hat.
    var fromPath = location.pathname;
    if (job.push) {
      // Ausgehenden Scroll sichern, DANN den neuen Eintrag pushen — atomar, damit
      // Verlauf und Inhalt zusammenpassen (auch nach Wartezeit hinter Single-Flight).
      try { history.replaceState(assign({}, history.state, { scrollY: window.scrollY }), ''); } catch (_) {}
      document.title = job.doc.title;                               // korrektes Verlaufs-Label
      try { history.pushState({ spa: true, docId: DOC_ID, url: job.href, scrollY: 0 }, '', job.href); } catch (_) {}
    }
    swap(job.doc, job.href, job.push, fromPath)
      .then(function () { applyScroll(job.href, job.push ? 0 : job.restoreY); })
      .catch(function () {})                                         // Swap-Kette resolvet immer; Guertel & Hosentraeger
      .then(function () {
        committing = false;
        var p = pending; pending = null;
        if (p) runCommit(p);                                        // juengste wartende jetzt fahren
      });
  }

  // ── §5 Fetch-Pfad (jeder Zweifel -> null -> voller Reload beim Caller) ───────
  // Epoch (my) wird von navigate gezogen; ein abgebrochener Fetch (signal) wird
  // von der Epoch-Pruefung im Caller ohnehin verworfen -> kein Fallback-Reload.
  function fetchPage(href, my, signal) {
    var opts = { headers: { 'X-SPA-Nav': '1' }, credentials: 'same-origin', redirect: 'follow' };
    if (signal) opts.signal = signal;
    return fetch(href, opts).then(function (res) {
      if (my !== nav.token) return STALE;
      if (res.redirected && new URL(res.url).origin !== location.origin) { location.href = res.url; return null; }
      if (!res.ok) return null;
      var ct = res.headers.get('content-type') || '';
      if (ct.indexOf('text/html') === -1) return null;
      return res.text().then(function (html) {
        if (my !== nav.token) return STALE;
        var doc = new DOMParser().parseFromString(html, 'text/html'); // inert
        if (!doc.querySelector('.initial-content')) return null;
        return doc;
      });
    }).catch(function () { return null; });
  }

  // ── Zielseite mit einer Cross-Origin-Abhängigkeit (CDN-Skript/-Style, z.B.
  //     MathJax/jsdelivr, Fractal-CSS)? reconcile lädt nur Same-Origin nach, und
  //     solche Libs brauchen pro Seite eine Initialisierung (MathJax
  //     typesetPromise u.a.), die ein reiner Content-Swap nicht leistet -> voll
  //     navigieren. Greift AUTOMATISCH für jeden künftigen Beitrag mit Formeln
  //     (keine Sonderliste, keine Pfad-Ausnahme). Bewusst simpel: JEDE
  //     Cross-Origin-Abhängigkeit zählt, unabhängig davon, ob schon geladen —
  //     "schon geladen" heißt bei MathJax NICHT "swap-sicher" (Re-Typeset fehlt).
  //     Verifiziert: es gibt keine sitewide Cross-Origin-Ressource, normale
  //     Seiten swappen weiter; preconnect/preload-Links zählen hier nicht.
  function needsFullLoad(doc) {
    // Interaktive Fraktal-Panels brauchen eine per-Seite-Initialisierung
    // (fractal-panel.js initAll auf [data-fractal-panel]), die ein reiner
    // Content-Swap nicht leistet. Die Vendor-Libs sind same-origin, würden von
    // der Cross-Origin-Prüfung unten also NICHT erfasst -> wie bei MathJax voll
    // navigieren. Heute latent (kein verdrahtetes Ziel rendert ein Panel),
    // greift aber automatisch, falls künftig ein Beitrag eines einbettet.
    if (doc.querySelector('[data-fractal-panel]')) return true;
    var els = doc.querySelectorAll('script[src], link[rel="stylesheet"][href]');
    for (var i = 0; i < els.length; i++) {
      var el = els[i], a = el.tagName === 'SCRIPT' ? 'src' : 'href', u;
      try { u = new URL(el.getAttribute(a), location.href); } catch (_) { continue; }
      if (u.origin !== location.origin) { return true; }
    }
    return false;
  }

  // ── §6 Swap (+ View-Transition-Kür) ─────────────────────────────────────────
  // Ziel: Animation/Verhalten IDENTISCH zum Full-Reload (Cross-Doc-VT). Daher
  // dieselbe Choreografie: der offene Drawer bleibt für den ALTEN Snapshot
  // erhalten (nav-drawer) und wird erst in mutate geschlossen -> ::view-
  // transition-old(nav-drawer) slidet ihn raus; Typen crt/drawer + vt-capture
  // exakt wie im pageswap/pagereveal-Pfad von tv-switch.js. Die gesamte CSS-
  // Choreografie (inkl. $crt-drawer-offset: Drawer-Exit zuerst, dann CRT) ist
  // gemeinsam und greift automatisch über die Typen/Namen.
  // Kein Epoch-Guard im Tail noetig: Single-Flight (runCommit) stellt sicher,
  // dass immer nur EIN swap laeuft — es gibt keinen ueberlappenden zweiten, der
  // finishSwap/Cleanup ueberholen koennte. Die Balance spa:load<->spa:unload ist
  // damit strukturell garantiert, nicht per Race-Guard erkauft.
  function swap(doc, href, push, fromPath) {
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var drawerOpen = !!(window.__tvSwitch &&
      typeof window.__tvSwitch.drawerOpen === 'function' && window.__tvSwitch.drawerOpen());

    // Drawer INSTANT (transition:none) schließen. Im VT-Pfad INNERHALB mutate,
    // damit der NEUE Snapshot ihn geschlossen zeigt -> Slide-Out des alten.
    function closeDrawerInstant() {
      if (drawerOpen && window.GreedyNav && typeof window.GreedyNav.closeInstant === 'function') {
        try { window.GreedyNav.closeInstant(); } catch (_) {}
      }
    }

    var mutate = function () {
      closeDrawerInstant();       // vor updateBodyClass -> menu-open nicht als Runtime-Klasse bewahrt
      replaceContent(doc);        // spa:unload + innerHTML
      if (push) focusMain();      // Fokus SYNCHRON, nur vorwaerts, VOR reconcile
      document.title = doc.title;
      mergeHead(doc);
      updateBodyClass(doc);
      updateActiveNav(href);
    };

    var done;
    if (document.startViewTransition && !reduce) {
      var toPath = '';
      try { toPath = new URL(href, location.href).pathname; } catch (_) {}
      // Dosierung wie Full-Reload (tv-switch.crtAllowed: mobil/Scroll-Top/
      // Bereichswechsel/Cooldown; Seiteneffekt Cooldown -> genau EIN Aufruf).
      var wantsCrt = !!(push && window.__tvSwitch &&
        typeof window.__tvSwitch.crtAllowed === 'function' &&
        window.__tvSwitch.crtAllowed(fromPath, toPath));

      var types = [];
      if (wantsCrt) types.push('crt');
      if (drawerOpen) types.push('drawer');
      // vt-capture: Content-Overlay (body::before) aus dem Snapshot nehmen —
      // exakt wie tv-switch.pageswap bei offenem Drawer.
      if (drawerOpen) document.documentElement.classList.add('vt-capture');

      // Masthead-Schutz: OHNE CRT überdeckt nichts den Snapshot-Versatz des
      // fixierten Masthead -> per spa-vt aus dem VT nehmen (auch bei offenem
      // Drawer! spa-vt nullt nur den Masthead-Namen; der nav-drawer-Slide bleibt).
      // MIT CRT: KEIN spa-vt -> Masthead behält seinen Snapshot, der minimale
      // Versatz wird vom Effekt überdeckt (identisch zum Full-Reload).
      // Entscheidung VOR startViewTransition (spa-vt wirkt auf den Snapshot).
      var usedSpaVt = !wantsCrt;
      if (usedSpaVt) { document.documentElement.classList.add('spa-vt'); vtDepth++; }

      var vt;
      try {
        vt = types.length
          ? document.startViewTransition({ update: mutate, types: types })
          : document.startViewTransition(mutate);
      } catch (_) {
        vt = document.startViewTransition(mutate);   // object-Form nicht unterstützt -> ohne Typen
      }
      var cleanup = function () {
        document.documentElement.classList.remove('vt-capture');
        if (usedSpaVt && --vtDepth <= 0) { vtDepth = 0; document.documentElement.classList.remove('spa-vt'); }
      };
      if (vt.finished && vt.finished.then) vt.finished.then(cleanup, cleanup);
      else cleanup();
      done = vt.updateCallbackDone ? vt.updateCallbackDone.catch(function () {}) : Promise.resolve();
    } else {
      // Kein VT (reduced-motion / kein Support): Drawer instant zu, sofort tauschen.
      closeDrawerInstant();
      mutate();
      done = Promise.resolve();
    }
    return done
      .then(function () { return reconcilePageScripts(doc); })
      .then(function () { finishSwap(doc, href); });
  }

  function replaceContent(doc) {
    var current = document.querySelector('.initial-content');
    var next = doc.querySelector('.initial-content');
    if (!current || !next) return;
    dispatch('spa:unload', { root: current });            // Teardown, solange altes DOM lebt
    current.innerHTML = next.innerHTML;
  }

  // ── §4 Head-Diff ─────────────────────────────────────────────────────────────
  function mergeHead(doc) {
    document.title = doc.title;
    copyAttr(doc, 'meta[name="description"]', 'content');
    copyAttr(doc, 'link[rel="canonical"]', 'href');
    copyAttr(doc, 'meta[property="og:title"]', 'content');
    copyAttr(doc, 'meta[property="og:description"]', 'content');
    copyAttr(doc, 'meta[property="og:url"]', 'content');
    copyAttr(doc, 'meta[name="twitter:title"]', 'content');
    copyAttr(doc, 'meta[name="twitter:description"]', 'content');
    var old = document.head.querySelectorAll('script[type="application/ld+json"]');
    for (var i = 0; i < old.length; i++) old[i].parentNode.removeChild(old[i]);
    var neu = doc.head.querySelectorAll('script[type="application/ld+json"]');
    for (var j = 0; j < neu.length; j++) {
      var s = document.createElement('script');
      s.type = 'application/ld+json';
      s.textContent = neu[j].textContent;
      document.head.appendChild(s);
    }
  }
  function copyAttr(doc, sel, attr) {
    var n = doc.head.querySelector(sel), o = document.head.querySelector(sel);
    if (n && o) o.setAttribute(attr, n.getAttribute(attr));
  }

  function updateBodyClass(doc) {
    if (!doc.body) return;
    var keep = RUNTIME_CLASSES.filter(function (c) { return document.body.classList.contains(c); });
    document.body.className = doc.body.className;
    keep.forEach(function (c) { document.body.classList.add(c); });
  }

  // ── Aktiv-Marker (Jekyll-Semantik: exakt ODER Praefix), beide ul-Listen ─────
  function updateActiveNav(href) {
    var target = stripBase(new URL(href, location.href).pathname);
    var links = document.querySelectorAll('.greedy-nav .visible-links a, .greedy-nav .hidden-links a');
    for (var i = 0; i < links.length; i++) {
      var a = links[i];
      a.classList.remove('current');
      a.removeAttribute('aria-current');
      var lp = stripBase(new URL(a.href, location.href).pathname);
      if (target === lp || (lp !== '/' && target.indexOf(lp) === 0)) {
        a.classList.add('current');
        a.setAttribute('aria-current', 'page');
      }
    }
  }

  // ── §2.4 Script-Reconcile: nur fehlende same-origin-Skripte injizieren ──────
  function reconcilePageScripts(doc) {
    var srcs = [], nodes = doc.querySelectorAll('script[src]');
    for (var i = 0; i < nodes.length; i++) {
      var src;
      try { src = new URL(nodes[i].getAttribute('src'), location.href); } catch (_) { continue; }
      if (src.origin !== location.origin) continue;       // jsdelivr NICHT hier laden
      if (loadedScripts.has(src.href)) continue;
      srcs.push(src.href);
    }
    if (!srcs.length) return Promise.resolve();
    return Promise.all(srcs.map(injectScript));
  }
  function injectScript(src) {
    loadedScripts.add(src);
    return new Promise(function (resolve) {
      var s = document.createElement('script');
      s.src = src; s.async = false;                       // 'self' + Reihenfolge
      s.onload = resolve; s.onerror = resolve;
      document.body.appendChild(s);
    });
  }

  // ── Abschluss: Lifecycle + Ansage (Fokus lief schon synchron in mutate) ─────
  function finishSwap(doc, href) {
    var root = document.querySelector('.initial-content');
    dispatch('spa:load', { root: root, url: href, initial: false });
    announce(document.title);
  }

  // ── §2 A11y: Fokus auf #main[role=main], NICHT auf das dekorative Hero-h1 ────
  function focusMain() {
    var root = document.querySelector('.initial-content');
    var main = (root && (root.querySelector('#main') || root.querySelector('[role="main"]'))) || root;
    focusTarget(main);
  }
  function focusTarget(el) {
    if (!el) return;
    if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
    try { el.focus({ preventScroll: true }); } catch (_) { try { el.focus(); } catch (__) {} }
  }
  function announce(title) {
    if (!announcer) announcer = document.getElementById('spa-route-announcer');
    if (!announcer) return;
    announcer.textContent = '';                           // leeren -> identische Titel re-announcen
    setTimeout(function () { announcer.textContent = title + ' — geladen'; }, 150);
  }

  // ── §1 Scroll anwenden (immer OHNE smooth — reduced-motion-Primaernutzer) ────
  function applyScroll(href, y) {
    var hash = '';
    try { hash = new URL(href, location.href).hash.slice(1); } catch (_) {}
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        if (hash) {
          var el = document.getElementById(decodeURIComponent(hash));
          if (el) { el.scrollIntoView({ behavior: 'auto' }); focusTarget(el); return; }
        }
        window.scrollTo({ top: y || 0, left: 0, behavior: 'auto' });
      });
    });
  }

  // ── Utilities ────────────────────────────────────────────────────────────────
  function dispatch(name, detail) { document.dispatchEvent(new CustomEvent(name, { detail: detail })); }
  function assign(t) {
    for (var i = 1; i < arguments.length; i++) {
      var s = arguments[i]; if (!s) continue;
      for (var k in s) if (Object.prototype.hasOwnProperty.call(s, k)) t[k] = s[k];
    }
    return t;
  }

  // ── Initiales spa:load (nach DOMContentLoaded; alle defer-Module registriert) ─
  function fireInitial() {
    dispatch('spa:load', { root: document.querySelector('.initial-content'), url: location.href, initial: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fireInitial);
  else fireInitial();
})();
