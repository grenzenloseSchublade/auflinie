/**
 * Image Caching Script
 * 
 * Dieses Skript implementiert effizientes Caching für Hintergrundbilder
 * und andere wichtige Ressourcen auf der Website.
 */

(function() {
  'use strict';

  var HERO_CRT_BOOT_KEY = 'auflinieHeroCrtBoot';
  var HERO_TUBE_BOOT_NAMES = ['heroTubeBootStark', 'heroTubeBootDezent'];
  /** Pause mit Vorhang/Filter vor `page__hero--crt-boot` (ms), 0,9 s — mit `--hero-tube-boot-dur` nicht verwechseln */
  var HERO_CRT_PREBOOT_DELAY_MS = 900;
  /** Dauer der Tube-Boot-Keyframes (ms), exakt wie `--hero-tube-boot-dur` in `_hero.scss` (unabhängig von Preboot) */
  var HERO_TUBE_BOOT_DURATION_MS = 3500;
  /** Fallback nur wenn `getComputedStyle` `--hero-crt-mode-flash-dur` nicht liefert (Spiegel zu `_hero.scss`) */
  var HERO_CRT_MODE_FLASH_MS = 100;
  /** Ziel-FPS für Canvas-Rauschen (Zeitdrossel, weniger CPU/GC als festes RAF-3er-Raster) */
  var HERO_CRT_NOISE_TARGET_FPS = 10;

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
    var state = overlay._crtBootState;
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
    var btn = document.getElementById('hero-crt-power');
    if (!btn || !overlay) return;
    var read = overlay.classList.contains('page__hero--crt-read');
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
    var crtLayer = overlay.querySelector('.page__hero-crt-layer');
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
    var bootFinished = false;
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
    var timeoutId = window.setTimeout(endBoot, HERO_TUBE_BOOT_DURATION_MS + 400);
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
      var raw = (window.getComputedStyle(overlay).getPropertyValue('--hero-crt-mode-flash-dur') || '')
        .trim();
      if (!raw) return HERO_CRT_MODE_FLASH_MS;
      if (/ms$/i.test(raw)) {
        var nMs = parseFloat(raw);
        return isNaN(nMs) ? HERO_CRT_MODE_FLASH_MS : Math.max(0, Math.round(nMs));
      }
      if (/s$/i.test(raw)) {
        var nS = parseFloat(raw);
        return isNaN(nS) ? HERO_CRT_MODE_FLASH_MS : Math.max(0, Math.round(nS * 1000));
      }
    } catch (err) {
      /* ignore */
    }
    return HERO_CRT_MODE_FLASH_MS;
  }

  function bindHomeHeroCrtPowerToggle() {
    var btn = document.getElementById('hero-crt-power');
    if (!btn) return;
    btn.addEventListener('click', function() {
      var overlay = document.querySelector('.page__hero--overlay[data-background-image].loaded');
      if (!overlay || !overlay.querySelector('.page__hero-crt-layer')) return;

      if (overlay.classList.contains('page__hero--crt-preboot') || overlay.classList.contains('page__hero--crt-boot')) {
        return;
      }

      if (overlay.classList.contains('page__hero--crt-flash')) {
        return;
      }

      var read = overlay.classList.contains('page__hero--crt-read');

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

    var noiseMinIntervalMs = 1000 / HERO_CRT_NOISE_TARGET_FPS;

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
      });
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
      var ts = typeof now === 'number' ? now : performance.now();
      var lastTs = overlay._heroCrtNoiseLastTs;
      if (lastTs != null && ts - lastTs < noiseMinIntervalMs) {
        overlay._heroCrtNoiseRafId = requestAnimationFrame(tick);
        return;
      }
      overlay._heroCrtNoiseLastTs = ts;

      const w = canvas.width;
      const h = canvas.height;
      var buf = overlay._heroCrtNoiseBuffer;
      if (!buf || buf.width !== w || buf.height !== h) {
        buf = ctx.createImageData(w, h);
        overlay._heroCrtNoiseBuffer = buf;
      }
      const d = buf.data;
      for (var i = 0; i < d.length; i += 4) {
        var v = Math.random() * 255;
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

    var crtLayer = overlay.querySelector('.page__hero-crt-layer');
    if (!crtLayer) return;

    var skipBoot = false;
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
      var listener = function() {
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
  
  /**
   * Hintergrundbilder cachen
   */
  function cacheBackgroundImages() {
    // Alle Elemente mit data-background-image-Attribut finden
    const heroElements = document.querySelectorAll('.page__hero--overlay[data-background-image]');
    
    if (heroElements.length > 0) {
      applyBackgroundImages(heroElements);
    }
    
    // Globales Hintergrundbild aus der Konfiguration cachen, falls vorhanden
    if (config.backgroundImage) {
      preloadImage(config.backgroundImage)
        .catch(error => console.error(error));
    }
  }
  
  // Wenn das DOM geladen ist, Hintergrundbilder cachen
  document.addEventListener('DOMContentLoaded', () => {
    // Konfiguration aus dem HTML-Dokument aktualisieren
    config.enableImageCaching = readEnableImageCaching();
    config.backgroundImage = document.documentElement.getAttribute('data-background-image');
    
    // Hero-Hintergrund setzen, außer explizit data-enable-image-caching="false"
    if (config.enableImageCaching !== false) {
      cacheBackgroundImages();
    }

    bindHomeHeroCrtPowerToggle();

    if (!window._auflinieHeroCrtPagehideBound) {
      window._auflinieHeroCrtPagehideBound = true;
      window.addEventListener('pagehide', function() {
        document.querySelectorAll('.page__hero--overlay[data-background-image]').forEach(function(el) {
          clearHeroCrtFlashTimeout(el);
          stopHeroCanvasNoise(el);
        });
      });
    }
  });
  
  // Service Worker-Kommunikation für Bild-Caching
  if ('serviceWorker' in navigator && window.caches) {
    // Nachricht an den Service Worker senden, um Bilder zu cachen
    setTimeout(() => {
      if (navigator.serviceWorker.controller) {
        // Alle Bild-URLs sammeln
        const imageUrls = Array.from(document.querySelectorAll('[data-background-image]'))
          .map(el => el.getAttribute('data-background-image'))
          .filter(Boolean);
        
        // Globales Hintergrundbild hinzufügen, falls vorhanden
        if (config.backgroundImage) {
          imageUrls.push(config.backgroundImage);
        }
        
        // Nachricht an Service Worker senden
        if (imageUrls.length > 0) {
          navigator.serviceWorker.controller.postMessage({
            type: 'CACHE_IMAGES',
            images: imageUrls
          });
        }
      }
    }, 1000);
  }
})();
