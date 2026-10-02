/**
 * hero-crt.js — Overlay-Hero: Hintergrundbild und CRT-Effekt.
 *
 * Lädt das Bild aus data-background-image vor und setzt es samt
 * Retro-Verlauf, danach steuert es den CRT-Effekt (Einschalt-Sequenz,
 * Canvas-Rauschen, Power-Knopf für den Lesemodus mit Hinweis-Puls).
 * Am Persistent-Shell-Kontrakt (spa:load/spa:unload, PE-Fallback). Nur auf
 * Seiten mit Overlay-Hero geladen (_includes/scripts.html).
 */

(function() {
  'use strict';

  // Persistent-Shell-Kontrakt (spa-nav.js): dokumentweite Listener dieses
  // Mounts hängen an heroSignal und werden im Teardown zentral gelöst.
  const HERO_SEL = '.page__hero--overlay[data-background-image]';
  let heroController = null;
  let heroSignal = null;
  let bgPreloaded = false;

  const HERO_CRT_BOOT_KEY = 'auflinieHeroCrtBoot';
  const HERO_TUBE_BOOT_NAMES = ['hero-tube-boot-stark', 'hero-tube-boot-dezent'];
  /** Pause mit Vorhang/Filter vor `page__hero--crt-boot` (ms), 0,9 s — mit `--hero-tube-boot-dur` nicht verwechseln */
  const HERO_CRT_PREBOOT_DELAY_MS = 900;
  /** Dauer der Tube-Boot-Keyframes (ms), exakt wie `--hero-tube-boot-dur` in `_hero.scss` (unabhängig von Preboot) */
  const HERO_TUBE_BOOT_DURATION_MS = 3500;
  /** Fallback nur wenn `getComputedStyle` `--hero-crt-mode-flash-dur` nicht liefert (Spiegel zu `_hero.scss`) */
  const HERO_CRT_MODE_FLASH_MS = 100;
  /** Ziel-FPS für Canvas-Rauschen (Zeitdrossel, weniger CPU/GC als festes RAF-3er-Raster) */
  const HERO_CRT_NOISE_TARGET_FPS = 10;

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
      if (!e || !e.animationName || HERO_TUBE_BOOT_NAMES.indexOf(e.animationName) === -1) return;
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
    if (overlay._heroCrtNoiseRafId) {
      cancelAnimationFrame(overlay._heroCrtNoiseRafId);
      overlay._heroCrtNoiseRafId = 0;
    }
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

    function tick(now) {
      if (document.hidden) {
        overlay._heroCrtNoiseRafId = 0;
        return;
      }
      if (!overlay.classList.contains('loaded')) {
        overlay._heroCrtNoiseRafId = requestAnimationFrame(tick);
        return;
      }
      if (overlay.classList.contains('page__hero--crt-read')) {
        overlay._heroCrtNoiseRafId = 0;
        return;
      }
      const ts = typeof now === 'number' ? now : performance.now();
      const lastTs = overlay._heroCrtNoiseLastTs;
      if (lastTs != null && ts - lastTs < noiseMinIntervalMs) {
        overlay._heroCrtNoiseRafId = requestAnimationFrame(tick);
        return;
      }
      overlay._heroCrtNoiseLastTs = ts;

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

      overlay._heroCrtNoiseRafId = requestAnimationFrame(tick);
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

    function kick() {
      if (!overlay.classList.contains('loaded')) return;
      startCrtBootSequence(overlay);
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
        'linear-gradient(180deg, rgba(32,30,48,0.38) 0%, rgba(190,160,175,0.07) 38%, rgba(150,175,195,0.07) 72%, rgba(25,25,35,0.14) 100%), '
      );
    }
    return (
      'linear-gradient(180deg, rgba(28,26,42,0.22) 0%, rgba(180,150,170,0.04) 42%, rgba(145,170,188,0.045) 100%), '
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
            console.error(error);
            // Fallback-Hintergrund anwenden, wenn das Bild nicht geladen werden kann
            element.style.backgroundColor = '#1a1a1a';
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
    try { if (sessionStorage.getItem('auflinieHeroCrtPowerHinted') === '1') return; } catch (e) { /* private mode */ }
    if (window._auflinieHeroCrtHintScheduled) return;
    window._auflinieHeroCrtHintScheduled = true;
    const fire = function () {
      window.setTimeout(function () {
        const btn = document.getElementById('hero-crt-power');
        if (!btn) { window._auflinieHeroCrtHintScheduled = false; return; } // kein Button -> später erneut zulassen
        btn.classList.add('hero-crt-power--hint');
        btn.addEventListener('animationend', function onEnd() {
          btn.classList.remove('hero-crt-power--hint');
          btn.removeEventListener('animationend', onEnd);
        });
        try { sessionStorage.setItem('auflinieHeroCrtPowerHinted', '1'); } catch (e) { /* private mode */ }
      }, 1200);
    };
    if (document.readyState === 'complete') fire();
    else window.addEventListener('load', fire, { once: true });
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

    if (heroController) heroController.abort();          // Doppel-Mount absichern
    heroController = new AbortController();
    heroSignal = heroController.signal;

    const toLoad = [];
    Array.prototype.forEach.call(heroes, function(el) {
      el._heroCrtNoiseVisibilityAttached = false;        // Re-Bind an den NEUEN Signal erlauben
      if (el.classList.contains('loaded')) startHeroCanvasNoise(el);  // bfcache/Re-Mount: nur Rauschen an
      else toLoad.push(el);
    });
    if (config.enableImageCaching !== false && toLoad.length) applyBackgroundImages(toLoad);

    bindHomeHeroCrtPowerToggle();
    schedulePowerHint();
  }

  function teardownHero() {
    document.querySelectorAll(HERO_SEL).forEach(function(el) {
      clearHeroCrtFlashTimeout(el);
      stopHeroCanvasNoise(el);          // rAF-Noise-Loop stoppen
      abortCrtBootFlow(el);             // Preboot/Boot-Timer + load-wait-Listener
    });
    if (heroController) { heroController.abort(); heroController = null; heroSignal = null; } // visibilitychange weg
  }

  // Kontrakt: mount bei jedem spa:load (initial + Swap-in), teardown bei spa:unload.
  document.addEventListener('spa:load', function(e) { mountHero(e.detail && e.detail.root); });
  document.addEventListener('spa:unload', teardownHero);
  // bfcache-Restore refeuert kein spa:load -> Effekt selbst wieder anwerfen.
  window.addEventListener('pageshow', function(e) { if (e.persisted) mountHero(document); });

  // PE-Fallback (Fundament inaktiv): einmaliger Mount ohne Kontrakt.
  function heroPeFallback() { if (!window.__spaNavActive) mountHero(document); }
  if (document.readyState === 'complete') heroPeFallback();
  else document.addEventListener('DOMContentLoaded', heroPeFallback);
})();
