/**
 * hero-crt.js — Overlay-Hero: Hintergrundbild und CRT-Effekt.
 *
 * Lädt das Bild aus data-background-image vor und setzt es samt
 * Retro-Verlauf, danach steuert es den CRT-Effekt (Einschalt-Sequenz,
 * Canvas-Rauschen, Power-Knopf für den Lesemodus mit Hinweis-Puls).
 * Am Persistent-Shell-Kontrakt (window.spaModule aus spa-module.js), beim
 * ersten Laden mit Früh-Mount vor dem initialen spa:load (Option early,
 * PERF-9). Nur auf Seiten mit Overlay-Hero geladen (_includes/scripts.html).
 */

(function() {
  'use strict';

  // Persistent-Shell-Kontrakt (spa-nav.js): dokumentweite Listener dieses
  // Mounts hängen an heroSignal und werden im Teardown zentral gelöst.
  const HERO_SEL = '.page__hero--overlay[data-background-image]';
  /** Klasse am Overlay, solange der Hero außerhalb des Viewports liegt. Hält per CSS die Endlos-Animationen an (PERF-7, `_hero.scss`) */
  const HERO_OFFSCREEN_CLASS = 'page__hero--crt-offscreen';
  let heroController = null;
  let heroSignal = null;
  let heroObserver = null;
  let bgPreloaded = false;
  /** Power-Hinweis geplant, aber noch nicht gezeigt: Timer-ID (0, solange er auf `load` wartet) */
  let powerHintPending = false;
  let powerHintTimer = 0;

  const HERO_CRT_BOOT_KEY = 'auflinie:hero-crt:boot';
  const HERO_TUBE_BOOT_NAMES = ['hero-tube-boot-stark', 'hero-tube-boot-dezent'];
  /** Keyframes des Power-Hinweises, Spiegel zu `@keyframes hero-crt-power-hint` in `_hero.scss` */
  const HERO_POWER_HINT_ANIMATION = 'hero-crt-power-hint';
  /** Pause mit Vorhang/Filter vor `page__hero--crt-boot` (ms), 0,9 s — mit `--hero-tube-boot-dur` nicht verwechseln */
  const HERO_CRT_PREBOOT_DELAY_MS = 900;
  /** Dauer der Tube-Boot-Keyframes (ms), exakt wie `--hero-tube-boot-dur` in `_hero.scss` (unabhängig von Preboot) */
  const HERO_TUBE_BOOT_DURATION_MS = 3500;
  /** Fallback nur wenn `getComputedStyle` `--hero-crt-mode-flash-dur` nicht liefert (Spiegel zu `_hero.scss`) */
  const HERO_CRT_MODE_FLASH_MS = 100;
  /** Ziel-FPS für Canvas-Rauschen (Zeitdrossel: gezeichnet wird im ersten Frame, der mindestens 1000/FPS ms nach dem letzten Bild liegt) */
  const HERO_CRT_NOISE_TARGET_FPS = 10;
  /** Vorlauf (ms), mit dem der Timer vor dem nächsten Bild wieder Frames anfordert, gut ein Frame bei 60 Hz (PERF-7) */
  const HERO_CRT_NOISE_RAF_LEAD_MS = 20;

  /** Einmal-Effekte erst, wenn die Seite zu sehen ist (Prerender, site-utils.js). Ohne Helfer sofort */
  function whenActivated(fn) {
    const utils = window.AuflinieUtils;
    if (utils && utils.whenActivated) utils.whenActivated(fn);
    else fn();
  }

  function readEnableImageCaching() {
    const raw = (document.documentElement.getAttribute('data-enable-image-caching') || '')
      .toString()
      .trim()
      .toLowerCase();
    if (raw === 'false') return false;
    if (raw === 'true') return true;
    // Fehlendes Attribut oder ältere Werte (z. B. "True"): Hero-Bild laden
    return true;
  }

  function setRandomRollDuration(overlay) {
    const roll = overlay.querySelector('.page__hero-crt-roll');
    if (!roll) return;
    const sec = 8.5 + Math.random() * 7.5;
    roll.style.setProperty('--crt-roll-dur', sec.toFixed(2) + 's');
  }

  /** Laufrichtung Rollbalken: 1 = nach unten, -1 = nach oben (pro Aufruf zufällig); -1 setzt data-crt-roll-up für Keyframes */
  function setRandomRollSign(overlay) {
    const roll = overlay.querySelector('.page__hero-crt-roll');
    if (!roll) return;
    const up = Math.random() < 0.5;
    roll.style.setProperty('--crt-roll-sign', up ? '-1' : '1');
    if (up) {
      roll.setAttribute('data-crt-roll-up', '');
    } else {
      roll.removeAttribute('data-crt-roll-up');
    }
  }

  function cancelCrtBootCleanup(overlay) {
    const state = overlay._crtBootState;
    if (!state) return;
    if (state.timeoutId) {
      window.clearTimeout(state.timeoutId);
    }
    if (state.crtLayer && state.onAnimationEnd) {
      state.crtLayer.removeEventListener('animationend', state.onAnimationEnd);
    }
    overlay._crtBootState = null;
  }

  /** Timer, `load`-Warteliste und `animationend`-Cleanup — ohne Preboot-/Boot-Klassen zu entfernen */
  function abortCrtBootTimersAndListeners(overlay) {
    if (overlay._heroCrtPrebootTimer) {
      window.clearTimeout(overlay._heroCrtPrebootTimer);
      overlay._heroCrtPrebootTimer = null;
    }
    if (overlay._heroCrtLoadWaitListener) {
      window.removeEventListener('load', overlay._heroCrtLoadWaitListener);
      overlay._heroCrtLoadWaitListener = null;
    }
    cancelCrtBootCleanup(overlay);
  }

  /** Preboot-Timer, Boot-Listener und CRT-Boot-Klassen zurücksetzen */
  function abortCrtBootFlow(overlay) {
    abortCrtBootTimersAndListeners(overlay);
    overlay.classList.remove('page__hero--crt-preboot', 'page__hero--crt-boot');
  }

  function finishHeroCrtBoot(overlay) {
    cancelCrtBootCleanup(overlay);
    overlay.classList.remove('page__hero--crt-boot');
    try {
      sessionStorage.setItem(HERO_CRT_BOOT_KEY, '1');
    } catch (err) {
      /* private mode */
    }
    syncHeroCrtPowerButton(overlay);
  }

  function syncHeroCrtPowerButton(overlay) {
    const btn = document.getElementById('hero-crt-power');
    if (!btn || !overlay) return;
    const read = overlay.classList.contains('page__hero--crt-read');
    btn.setAttribute('aria-pressed', read ? 'false' : 'true');
    btn.setAttribute('aria-label', read ? 'Retro-Ansicht aktivieren' : 'Lesemodus aktivieren');
    btn.setAttribute('title', read ? 'Retro-Ansicht' : 'Lesemodus');
  }

  /**
   * Kurz `page__hero--crt-preboot` (Abdunkelung per Overlay-`::after` + CRT-Filter-Pause), dann Tube-Boot.
   * Ende: `animationend` (Tube-Name) oder ein Timeout-Fallback (ein gemeinsamer Abschluss).
   * @param {HTMLElement} overlay
   */
  function startCrtBootSequence(overlay) {
    abortCrtBootFlow(overlay);
    const crtLayer = overlay.querySelector('.page__hero-crt-layer');
    if (!crtLayer) return;
    void crtLayer.offsetWidth;
    overlay.classList.add('page__hero--crt-preboot');
    overlay._heroCrtPrebootTimer = window.setTimeout(function() {
      overlay._heroCrtPrebootTimer = null;
      if (!overlay.classList.contains('page__hero--crt-preboot') || !overlay.classList.contains('loaded')) {
        return;
      }
      overlay.classList.add('page__hero--crt-boot');
      overlay.classList.remove('page__hero--crt-preboot');
      void crtLayer.offsetWidth;
      scheduleCrtBootCleanup(overlay, crtLayer);
    }, HERO_CRT_PREBOOT_DELAY_MS);
  }

  function scheduleCrtBootCleanup(overlay, crtLayer) {
    cancelCrtBootCleanup(overlay);
    let bootFinished = false;
    function endBoot() {
      if (bootFinished) return;
      if (!overlay.classList.contains('page__hero--crt-boot')) return;
      bootFinished = true;
      finishHeroCrtBoot(overlay);
    }
    function onAnimationEnd(e) {
      if (!e || e.target !== crtLayer || HERO_TUBE_BOOT_NAMES.indexOf(e.animationName) === -1) return;
      endBoot();
    }
    crtLayer.addEventListener('animationend', onAnimationEnd);
    const timeoutId = window.setTimeout(endBoot, HERO_TUBE_BOOT_DURATION_MS + 400);
    overlay._crtBootState = {
      timeoutId: timeoutId,
      crtLayer: crtLayer,
      onAnimationEnd: onAnimationEnd
    };
  }

  function stopHeroCanvasNoise(overlay) {
    if (overlay._heroCrtNoiseTimerId) {
      window.clearTimeout(overlay._heroCrtNoiseTimerId);
      overlay._heroCrtNoiseTimerId = 0;
    }
    if (overlay._heroCrtNoiseRafId) {
      cancelAnimationFrame(overlay._heroCrtNoiseRafId);
      overlay._heroCrtNoiseRafId = 0;
    }
  }

  function isHeroCanvasNoiseRunning(overlay) {
    return !!(overlay._heroCrtNoiseTimerId || overlay._heroCrtNoiseRafId);
  }

  /** Flash-Timeout aus `bindHomeHeroCrtPowerToggle`; bei Navigation/DOM-Entfernung aufräumen */
  function clearHeroCrtFlashTimeout(overlay) {
    if (overlay._heroCrtFlashTimeoutId) {
      window.clearTimeout(overlay._heroCrtFlashTimeoutId);
      overlay._heroCrtFlashTimeoutId = null;
    }
  }

  /** Eine Quelle der Wahrheit: Dauer aus CSS-Variable `--hero-crt-mode-flash-dur` (z. B. `0.1s`) */
  function readHeroCrtFlashDurationMs(overlay) {
    try {
      const raw = (window.getComputedStyle(overlay).getPropertyValue('--hero-crt-mode-flash-dur') || '')
        .trim();
      if (!raw) return HERO_CRT_MODE_FLASH_MS;
      if (/ms$/i.test(raw)) {
        const nMs = parseFloat(raw);
        return isNaN(nMs) ? HERO_CRT_MODE_FLASH_MS : Math.max(0, Math.round(nMs));
      }
      if (/s$/i.test(raw)) {
        const nS = parseFloat(raw);
        return isNaN(nS) ? HERO_CRT_MODE_FLASH_MS : Math.max(0, Math.round(nS * 1000));
      }
    } catch (err) {
      /* ignore */
    }
    return HERO_CRT_MODE_FLASH_MS;
  }

  function bindHomeHeroCrtPowerToggle() {
    const btn = document.getElementById('hero-crt-power');
    if (!btn || btn.hasAttribute('data-hero-crt-power-init')) return;
    btn.setAttribute('data-hero-crt-power-init', '');
    btn.addEventListener('click', function() {
      const overlay = document.querySelector('.page__hero--overlay[data-background-image].loaded');
      if (!overlay || !overlay.querySelector('.page__hero-crt-layer')) return;

      if (overlay.classList.contains('page__hero--crt-preboot') || overlay.classList.contains('page__hero--crt-boot')) {
        return;
      }

      if (overlay.classList.contains('page__hero--crt-flash')) {
        return;
      }

      const read = overlay.classList.contains('page__hero--crt-read');

      function applyLesemodus() {
        overlay.classList.remove('page__hero--crt-over-text');
        overlay.classList.add('page__hero--crt-read');
        stopHeroCanvasNoise(overlay);
        syncHeroCrtPowerButton(overlay);
      }

      function applyRetro() {
        overlay.classList.remove('page__hero--crt-read');
        overlay.classList.add('page__hero--crt-over-text');
        startHeroCanvasNoise(overlay);
        syncHeroCrtPowerButton(overlay);
      }

      if (read) {
        overlay.classList.add('page__hero--crt-flash');
        applyRetro();
        clearHeroCrtFlashTimeout(overlay);
        overlay._heroCrtFlashTimeoutId = window.setTimeout(function() {
          overlay._heroCrtFlashTimeoutId = null;
          overlay.classList.remove('page__hero--crt-flash');
        }, readHeroCrtFlashDurationMs(overlay));
      } else {
        overlay.classList.add('page__hero--crt-flash');
        applyLesemodus();
        clearHeroCrtFlashTimeout(overlay);
        overlay._heroCrtFlashTimeoutId = window.setTimeout(function() {
          overlay._heroCrtFlashTimeoutId = null;
          overlay.classList.remove('page__hero--crt-flash');
        }, readHeroCrtFlashDurationMs(overlay));
      }
    });
  }

  function startHeroCanvasNoise(overlay) {
    if (overlay.classList.contains('page__hero--crt-read')) return;
    // Außerhalb des Viewports nicht starten, sondern vormerken: der
    // Observer (observeHeroVisibility) startet beim Wiedereintritt
    if (overlay.classList.contains(HERO_OFFSCREEN_CLASS)) {
      stopHeroCanvasNoise(overlay);
      overlay._heroCrtNoiseOffscreen = true;
      return;
    }
    const canvas = overlay.querySelector('.page__hero-crt-noise');
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;
    stopHeroCanvasNoise(overlay);

    const noiseMinIntervalMs = 1000 / HERO_CRT_NOISE_TARGET_FPS;

    if (!overlay._heroCrtNoiseVisibilityAttached) {
      overlay._heroCrtNoiseVisibilityAttached = true;
      document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
          stopHeroCanvasNoise(overlay);
          return;
        }
        if (overlay.classList.contains('page__hero--crt-over-text') &&
            !overlay.classList.contains('page__hero--crt-read') &&
            overlay.classList.contains('loaded')) {
          startHeroCanvasNoise(overlay);
        }
      }, heroSignal ? { signal: heroSignal } : false);
    }

    // Frames erst kurz vor dem nächsten Bild anfordern (PERF-7): früher lief
    // die rAF-Schleife mit 60 Hz und verwarf fünf von sechs Frames. Jetzt
    // wartet ein Timer bis HERO_CRT_NOISE_RAF_LEAD_MS vor dem Termin, dann
    // entscheidet dieselbe Zeitdrossel wie vorher über den Frame. Gezeichnet
    // wird also in denselben Frames, nur die leeren Callbacks entfallen
    function requestTick(delayMs) {
      overlay._heroCrtNoiseRafId = 0;
      overlay._heroCrtNoiseTimerId = window.setTimeout(function() {
        overlay._heroCrtNoiseTimerId = 0;
        overlay._heroCrtNoiseRafId = requestAnimationFrame(tick);
      }, Math.max(0, delayMs));
    }

    function tick(now) {
      overlay._heroCrtNoiseRafId = 0;
      if (document.hidden) return;
      if (overlay.classList.contains('page__hero--crt-read')) return;
      if (!overlay.classList.contains('loaded')) {
        requestTick(noiseMinIntervalMs - HERO_CRT_NOISE_RAF_LEAD_MS);
        return;
      }
      const ts = typeof now === 'number' ? now : performance.now();
      const lastTs = overlay._heroCrtNoiseLastTs;
      if (lastTs != null && ts - lastTs < noiseMinIntervalMs) {
        // noch vor dem Termin: nächsten Frame prüfen (ein bis zwei pro Bild)
        overlay._heroCrtNoiseRafId = requestAnimationFrame(tick);
        return;
      }
      overlay._heroCrtNoiseLastTs = ts;
      drawNoise();
      requestTick(noiseMinIntervalMs - HERO_CRT_NOISE_RAF_LEAD_MS - (performance.now() - ts));
    }

    function drawNoise() {
      const w = canvas.width;
      const h = canvas.height;
      let buf = overlay._heroCrtNoiseBuffer;
      if (!buf || buf.width !== w || buf.height !== h) {
        buf = ctx.createImageData(w, h);
        overlay._heroCrtNoiseBuffer = buf;
      }
      const d = buf.data;
      for (let i = 0; i < d.length; i += 4) {
        const v = Math.random() * 255;
        d[i] = v;
        d[i + 1] = v;
        d[i + 2] = v;
        d[i + 3] = 52;
      }
      ctx.putImageData(buf, 0, 0);
    }

    overlay._heroCrtNoiseRafId = requestAnimationFrame(tick);
  }

  /**
   * CRT-Effekte nach geladenem Hero-Bild (Boot, Roll-Dauer, Canvas-Rauschen)
   * @param {HTMLElement} overlay
   */
  function enhanceHeroCrtAfterLoad(overlay) {
    setRandomRollDuration(overlay);
    setRandomRollSign(overlay);
    startHeroCanvasNoise(overlay);

    const crtLayer = overlay.querySelector('.page__hero-crt-layer');
    if (!crtLayer) return;

    let skipBoot;
    try {
      skipBoot = sessionStorage.getItem(HERO_CRT_BOOT_KEY) === '1';
    } catch (e1) {
      skipBoot = false;
    }

    if (skipBoot) {
      overlay.classList.remove('page__hero--crt-preboot');
      return;
    }

    // Im Prerender (Speculation Rules) liefe das Einschalten ungesehen ab:
    // erst mit der Aktivierung starten
    function kick() {
      whenActivated(function() {
        if (!overlay.classList.contains('loaded')) return;
        startCrtBootSequence(overlay);
      });
    }

    if (document.readyState === 'complete') {
      kick();
    } else {
      const listener = function() {
        window.removeEventListener('load', listener);
        overlay._heroCrtLoadWaitListener = null;
        kick();
      };
      overlay._heroCrtLoadWaitListener = listener;
      window.addEventListener('load', listener);
    }
  }

    // Konfiguration aus dem HTML-Dokument auslesen
  const config = {
    enableImageCaching: readEnableImageCaching(),
    backgroundImage: document.documentElement.getAttribute('data-background-image') || null
  };
  
  /**
   * Bild vorladen und im Cache speichern
   * @param {string} url - Die URL des zu ladenden Bildes
   * @return {Promise} Ein Promise, das erfüllt wird, wenn das Bild geladen ist
   */
  function preloadImage(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(url);
      img.onerror = () => reject(new Error(`Fehler beim Laden des Bildes: ${url}`));
      img.src = url;
    });
  }
  
  function retroGradeFor(element) {
    const mode = (element.getAttribute('data-crt-intensity') || 'stark').toString().trim().toLowerCase();
    if (mode === 'stark') {
      return (
        'linear-gradient(180deg, rgb(32 30 48 / 38%) 0%, rgb(190 160 175 / 7%) 38%, rgb(150 175 195 / 7%) 72%, rgb(25 25 35 / 14%) 100%), '
      );
    }
    return (
      'linear-gradient(180deg, rgb(28 26 42 / 22%) 0%, rgb(180 150 170 / 4%) 42%, rgb(145 170 188 / 4.5%) 100%), '
    );
  }

  /**
   * Hintergrundbilder auf Elemente anwenden
   * @param {NodeList} elements - Die Elemente, auf die Hintergrundbilder angewendet werden sollen
   */
  function applyBackgroundImages(elements) {
    elements.forEach(element => {
      const imageUrl = extractImageUrl(element);
      if (imageUrl) {
        preloadImage(imageUrl)
          .then(() => {
            // Löst der Preload erst NACH einem SPA-Swap aus, ist das Element
            // schon detacht — enhanceHeroCrtAfterLoad würde dann eine rAF-Loop
            // (+ Boot-Timer) starten, die kein Teardown mehr erreicht.
            if (!element.isConnected) return;
            // Overlay-Filter anwenden, falls vorhanden
            const overlayFilter = element.getAttribute('data-overlay-filter');
            const retroGrade = retroGradeFor(element);
            if (overlayFilter) {
              element.style.backgroundImage = `${overlayFilter}, ${retroGrade}url('${imageUrl}')`;
            } else {
              element.style.backgroundImage = `${retroGrade}url('${imageUrl}')`;
            }
            element.classList.add('loaded');
            enhanceHeroCrtAfterLoad(element);
          })
          .catch(error => {
            console.error('hero-crt: Hero-Bild nicht ladbar', error);
            // Fallback-Hintergrund, wenn das Bild nicht geladen werden kann.
            // Die Farbe kommt aus _hero.scss ($background-dark, JS-9).
            element.classList.add('is-image-failed');
          });
      }
    });
  }
  
  /**
   * Bild-URL aus dem data-background-image-Attribut extrahieren
   * @param {Element} element - Das Element, aus dem die URL extrahiert werden soll
   * @return {string|null} Die extrahierte URL oder null
   */
  function extractImageUrl(element) {
    return element.getAttribute('data-background-image');
  }
  
  // Einmaliger, dezenter Hinweis-Puls auf den CRT-Power-Button (~1.2s nach dem
  // vollständigen Laden), macht den Retro/Lesemodus-Knopf entdeckbar. Nur
  // einmal pro Session. Unter prefers-reduced-motion: reduce nimmt der
  // Kill-Switch in base/_accessibility.scss den Puls heraus (Owner-Entscheidung,
  // STYLEGUIDE 6.5): Die Klasse wird trotzdem gesetzt, animationend feuert nach
  // 0.01ms und räumt sie wieder ab.
  function schedulePowerHint() {
    try { if (sessionStorage.getItem('auflinie:hero-crt:power-hinted') === '1') return; } catch (e) { /* noop: Storage gesperrt (privater Modus) */ }
    if (window.__auflinieHeroCrtHintScheduled) return;
    window.__auflinieHeroCrtHintScheduled = true;
    powerHintPending = true;
    const fire = function () {
      powerHintTimer = window.setTimeout(function () {
        powerHintTimer = 0;
        powerHintPending = false;
        const btn = document.getElementById('hero-crt-power');
        if (!btn) { window.__auflinieHeroCrtHintScheduled = false; return; } // kein Button -> später erneut zulassen
        btn.classList.add('hero-crt-power--hint');
        // Nur das Ende des Pulses (am ::after des Buttons, MO-6): animationend
        // bubbelt, andere Animationen im Button räumten die Klasse sonst zu früh ab.
        btn.addEventListener('animationend', function onEnd(e) {
          if (e.target !== btn || e.animationName !== HERO_POWER_HINT_ANIMATION) return;
          btn.classList.remove('hero-crt-power--hint');
          btn.removeEventListener('animationend', onEnd);
        });
        try { sessionStorage.setItem('auflinie:hero-crt:power-hinted', '1'); } catch (e) { /* noop: Storage gesperrt (privater Modus) */ }
      }, 1200);
    };
    // Im Prerender erst nach der Aktivierung, sonst pulste er ungesehen
    const fireWhenActivated = function () { whenActivated(fire); };
    if (document.readyState === 'complete') fireWhenActivated();
    else window.addEventListener('load', fireWhenActivated, { once: true, signal: heroSignal });
  }

  /** Teardown (SPA-3): geplanten Hinweis verwerfen, der nächste Mount plant ihn neu */
  function cancelPowerHint() {
    if (!powerHintPending) return;
    if (powerHintTimer) { window.clearTimeout(powerHintTimer); powerHintTimer = 0; }
    powerHintPending = false;
    window.__auflinieHeroCrtHintScheduled = false;
  }

  /**
   * Sichtbarkeit des Heros beobachten: außerhalb des Viewports setzt der
   * Observer HERO_OFFSCREEN_CLASS, dann stehen Scanline-Jitter, Phosphor-
   * Flackern und Rollbalken still, und das Canvas-Rauschen pausiert. Ohne
   * die Pause malte der Browser die Fläche 60-mal pro Sekunde neu, auch weit
   * unten auf einer langen Seite (PERF-7). Sichtbar ändert sich nichts, der
   * Hero ist dann ja nicht zu sehen.
   * @param {NodeList} heroes
   */
  function observeHeroVisibility(heroes) {
    if (heroObserver) heroObserver.disconnect();
    heroObserver = null;
    if (!('IntersectionObserver' in window)) return;
    heroObserver = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        const overlay = entry.target;
        overlay.classList.toggle(HERO_OFFSCREEN_CLASS, !entry.isIntersecting);
        if (!entry.isIntersecting) {
          if (isHeroCanvasNoiseRunning(overlay)) {
            stopHeroCanvasNoise(overlay);
            overlay._heroCrtNoiseOffscreen = true;
          }
        } else if (overlay._heroCrtNoiseOffscreen) {
          overlay._heroCrtNoiseOffscreen = false;
          startHeroCanvasNoise(overlay);
        }
      });
    });
    Array.prototype.forEach.call(heroes, function(el) { heroObserver.observe(el); });
  }

  // ── Persistent-Shell-Kontrakt (spa-nav.js): Mount bei jedem spa:load ────────
  function mountHero(root) {
    const scope = root || document;
    const heroes = scope.querySelectorAll(HERO_SEL);

    config.enableImageCaching = readEnableImageCaching();
    config.backgroundImage = document.documentElement.getAttribute('data-background-image');

    // Globales Hintergrundbild einmal vorwärmen (früher in cacheBackgroundImages)
    if (!bgPreloaded && config.backgroundImage) {
      bgPreloaded = true;
      preloadImage(config.backgroundImage).catch(function() {});
    }

    if (!heroes.length) return;

    if (heroController) {                                // Doppel-Mount absichern
      heroController.abort();
      cancelPowerHint();                                 // load-Warten hing am alten Signal, unten neu planen
    }
    heroController = new AbortController();
    heroSignal = heroController.signal;

    const toLoad = [];
    Array.prototype.forEach.call(heroes, function(el) {
      el._heroCrtNoiseVisibilityAttached = false;        // Re-Bind an den NEUEN Signal erlauben
      if (el.classList.contains('loaded')) startHeroCanvasNoise(el);  // bfcache/Re-Mount: nur Rauschen an
      else toLoad.push(el);
    });
    if (config.enableImageCaching !== false && toLoad.length) applyBackgroundImages(toLoad);

    observeHeroVisibility(heroes);
    bindHomeHeroCrtPowerToggle();
    schedulePowerHint();
  }

  function teardownHero() {
    document.querySelectorAll(HERO_SEL).forEach(function(el) {
      clearHeroCrtFlashTimeout(el);
      stopHeroCanvasNoise(el);          // Rausch-Timer und -rAF stoppen
      el._heroCrtNoiseOffscreen = false;
      abortCrtBootFlow(el);             // Preboot/Boot-Timer + load-wait-Listener
      el.classList.remove(HERO_OFFSCREEN_CLASS);
    });
    if (heroObserver) { heroObserver.disconnect(); heroObserver = null; } // Observer-Leak zu
    if (heroController) { heroController.abort(); heroController = null; heroSignal = null; } // visibilitychange und load-Warten weg
    cancelPowerHint();
  }

  // Kontrakt über spaModule: mount bei jedem spa:load (initial + Swap-in),
  // teardown bei spa:unload, bfcache-Restore (pageshow) wirft den Effekt
  // wieder an. Früh-Mount beim ersten Laden (early, PERF-9): Als
  // Defer-Skript läuft diese Datei im Zustand 'interactive', das DOM ist
  // vollständig geparst und das Stylesheet geladen. Das initiale spa:load
  // käme erst nach dem Download ALLER Defer-Skripte bis spa-nav.js. So lange
  // wartete das Hero-Bild (LCP), obwohl es längst geladen war. spaModule
  // mountet deshalb sofort, das initiale spa:load und der PE-Fallback
  // überspringen den Mount danach. Swap-ins (initial: false) und bfcache
  // bleiben beim Kontrakt, ein Reconcile-Nachladen erkennt spaModule an
  // __spaNavActive.
  window.spaModule({ name: 'hero-crt', mount: mountHero, teardown: teardownHero, early: true });
})();
