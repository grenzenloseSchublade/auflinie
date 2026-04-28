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
  /** Pause mit gedimmtem Bild vor `page__hero--crt-boot` (ms) */
  var HERO_CRT_PREBOOT_DELAY_MS = 900;
  /** Dauer der Tube-Boot-Keyframes (ms), exakt wie Animationsdauer in `_hero.scss` (unabhängig von Preboot) */
  var HERO_TUBE_BOOT_DURATION_MS = 6000;

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

  function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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
      state.crtLayer.removeEventListener('webkitAnimationEnd', state.onAnimationEnd);
    }
    overlay._crtBootState = null;
  }

  /** Preboot-Timer, Boot-Listener und CRT-Klassen zurücksetzen (Replay / Seitenwechsel) */
  function abortCrtBootFlow(overlay) {
    if (overlay._heroCrtPrebootTimer) {
      window.clearTimeout(overlay._heroCrtPrebootTimer);
      overlay._heroCrtPrebootTimer = null;
    }
    cancelCrtBootCleanup(overlay);
    overlay.classList.remove('page__hero--crt-preboot', 'page__hero--crt-boot');
  }

  /**
   * Kurz `page__hero--crt-preboot` (Veil), dann Tube-Boot + Cleanup.
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
      overlay.classList.remove('page__hero--crt-preboot');
      void crtLayer.offsetWidth;
      overlay.classList.add('page__hero--crt-boot');
      scheduleCrtBootCleanup(overlay, crtLayer);
    }, HERO_CRT_PREBOOT_DELAY_MS);
  }

  function scheduleCrtBootCleanup(overlay, crtLayer) {
    cancelCrtBootCleanup(overlay);
    var bootFinished = false;
    function onAnimationEnd(e) {
      if (bootFinished) return;
      if (!e || !e.animationName || HERO_TUBE_BOOT_NAMES.indexOf(e.animationName) === -1) return;
      bootFinished = true;
      cancelCrtBootCleanup(overlay);
      overlay.classList.remove('page__hero--crt-boot');
      try {
        sessionStorage.setItem(HERO_CRT_BOOT_KEY, '1');
      } catch (err) {
        /* private mode */
      }
    }
    crtLayer.addEventListener('animationend', onAnimationEnd);
    crtLayer.addEventListener('webkitAnimationEnd', onAnimationEnd);
    var timeoutId = window.setTimeout(function() {
      if (!overlay.classList.contains('page__hero--crt-boot')) return;
      cancelCrtBootCleanup(overlay);
      overlay.classList.remove('page__hero--crt-boot');
      try {
        sessionStorage.setItem(HERO_CRT_BOOT_KEY, '1');
      } catch (err2) {
        /* ignore */
      }
    }, HERO_TUBE_BOOT_DURATION_MS + 400);
    overlay._crtBootState = {
      timeoutId: timeoutId,
      crtLayer: crtLayer,
      onAnimationEnd: onAnimationEnd
    };
  }

  /**
   * Tube-Boot erneut (Startseiten-Testbutton)
   * @param {HTMLElement} overlay
   */
  function replayHeroTubeBoot(overlay) {
    if (prefersReducedMotion() || !overlay.classList.contains('loaded')) return;
    if (!overlay.querySelector('.page__hero-crt-layer')) return;
    startCrtBootSequence(overlay);
  }

  function bindHomeHeroCrtDevControls() {
    var replayBtn = document.getElementById('hero-crt-replay-boot');
    var overTextBtn = document.getElementById('hero-crt-toggle-over-text');
    if (!replayBtn && !overTextBtn) return;
    if (replayBtn) {
      replayBtn.addEventListener('click', function() {
        var overlay = document.querySelector('.page__hero--overlay[data-background-image].loaded');
        if (overlay) {
          replayHeroTubeBoot(overlay);
        }
      });
    }
    if (overTextBtn) {
      overTextBtn.addEventListener('click', function() {
        var overlay = document.querySelector('.page__hero--overlay[data-background-image].loaded');
        if (!overlay) return;
        var on = overlay.classList.toggle('page__hero--crt-over-text');
        overTextBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
    }
  }

  function startHeroCanvasNoise(overlay) {
    if (prefersReducedMotion()) return;
    const canvas = overlay.querySelector('.page__hero-crt-noise');
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;
    var frame = 0;
    var rafId = 0;

    function tick() {
      if (!overlay.classList.contains('loaded')) {
        rafId = requestAnimationFrame(tick);
        return;
      }
      frame += 1;
      if (frame % 3 === 0) {
        const w = canvas.width;
        const h = canvas.height;
        const imageData = ctx.createImageData(w, h);
        const d = imageData.data;
        for (var i = 0; i < d.length; i += 4) {
          var v = Math.random() * 255;
          d[i] = v;
          d[i + 1] = v;
          d[i + 2] = v;
          d[i + 3] = 52;
        }
        ctx.putImageData(imageData, 0, 0);
      }
      rafId = requestAnimationFrame(tick);
    }

    rafId = requestAnimationFrame(tick);
  }

  /**
   * CRT-Effekte nach geladenem Hero-Bild (Boot, Roll-Dauer, Canvas-Rauschen)
   * @param {HTMLElement} overlay
   */
  function enhanceHeroCrtAfterLoad(overlay) {
    setRandomRollDuration(overlay);
    setRandomRollSign(overlay);
    if (!prefersReducedMotion()) {
      startHeroCanvasNoise(overlay);
    }

    if (prefersReducedMotion()) {
      try {
        sessionStorage.setItem(HERO_CRT_BOOT_KEY, '1');
      } catch (e0) {
        /* ignore */
      }
      return;
    }

    var crtLayer = overlay.querySelector('.page__hero-crt-layer');
    if (!crtLayer) return;

    var skipBoot = false;
    try {
      skipBoot = sessionStorage.getItem(HERO_CRT_BOOT_KEY) === '1';
    } catch (e1) {
      skipBoot = false;
    }

    if (!skipBoot) {
      startCrtBootSequence(overlay);
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

    bindHomeHeroCrtDevControls();
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
