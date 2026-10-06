/**
 * fractal-panel.js — gemeinsames UI-Modul der interaktiven Fraktal-Panels.
 *
 * Ersetzt die Inline-Scripts von julia-interactive.html und
 * mandelbrot-julia-explorer.html. Ein Panel wird über sein Wurzelelement
 * mit data-fractal-panel="julia|explorer" automatisch initialisiert; die
 * fachlichen Unterschiede (Anzahl Canvases, Controls, Kopplung, Download-
 * Strategie, Reset-Verhalten) leben ausschließlich in VARIANTS.
 *
 * Alle Elemente werden über data-role relativ zum Panel-Wurzelelement
 * gefunden (keine globalen IDs → mehrere Panels pro Seite kollisionsfrei).
 * Alle Event-Listener laufen über einen AbortController pro Panel.
 *
 * Texte (ARCH-4): Das Skript erzeugt keine eigenen. Umschalt-Knöpfe tragen
 * die Texte beider Zustände als data-Attribute (data-label, data-title,
 * data-aria-label und je …-active), den Text bei fehlender Darstellung
 * trägt die Ladeanzeige (data-unsupported-text). Quelle ist
 * _data/fractal_panel.yml über fractal/panel.html und canvas.html.
 *
 * Benötigt: fractal-renderer.js (FractalRenderer, FractalPalettes,
 * FractalUtils), noUiSlider, TomSelect — defer-geladen via fractal/deps.html.
 */
(function () {
  'use strict';

  const MIN_ZOOM = 0.5;
  const MAX_ZOOM_DEFAULT = 5000;
  const MAX_ZOOM_EXTREME = 500000;
  const ZOOM_WARNING_THRESHOLD = 100000;

  const VARIANTS = {
    julia: {
      iterations: { start: 250, min: 10, max: 1000, step: 10 },
      previewScale: 0.55,
      maxWorkers: function () {
        return FractalUtils.isMobileDevice() ? 2 : (navigator.hardwareConcurrency || 4);
      },
      cControls: true,
      initialC: { realPart: -0.7, imagPart: 0.27015 },
      canvases: [
        { key: 'julia', worker: 'julia-worker.js', type: 'julia', view: { viewX: 0, viewY: 0, zoomLevel: 1 } }
      ],
      download: { filename: 'julia-menge.png', keys: ['julia'] },
      // Reset stellt nur die Ansicht zurück; c und Iterationen bleiben erhalten.
      reset: function (panel) {
        panel.resetViews([{ key: 'julia', view: { viewX: 0, viewY: 0, zoomLevel: 1 } }]);
      }
    },
    explorer: {
      iterations: { start: 80, min: 10, max: 500, step: 10 },
      previewScale: 0.6,
      maxWorkers: function () {
        return FractalUtils.isMobileDevice() ? 2 : Math.min(navigator.hardwareConcurrency || 2, 4);
      },
      cControls: false,
      initialC: { realPart: -0.7, imagPart: 0.27015 },
      canvases: [
        { key: 'mandelbrot', worker: 'mandelbrot-worker.js', type: 'mandelbrot', view: { viewX: -0.5, viewY: 0, zoomLevel: 1 }, tapSelectsC: true },
        { key: 'julia', worker: 'julia-worker.js', type: 'julia', view: { viewX: 0, viewY: 0, zoomLevel: 1 } }
      ],
      download: { filename: 'mandelbrot-julia-explorer.png', keys: ['mandelbrot', 'julia'] },
      // Reset stellt beide Ansichten UND den c-Parameter zurück.
      reset: function (panel) {
        panel.setCParameter(-0.7, 0.27015, { render: false });
        panel.resetViews([
          { key: 'mandelbrot', view: { viewX: -0.5, viewY: 0, zoomLevel: 1 } },
          { key: 'julia', view: { viewX: 0, viewY: 0, zoomLevel: 1 } }
        ]);
      }
    }
  };

  // Anzeige mit echtem Minuszeichen U+2212 (STYLEGUIDE TYPO-2), Dezimalpunkt
  // wie in MathJax. Nur für Text, Rechenwerte (data-real, Eingabefelder)
  // bleiben ASCII.
  function formatComplex(cx, cy) {
    const sign = cy >= 0 ? '+' : '−';
    return cx.toFixed(3).replace('-', '−') + ' ' + sign + ' ' + Math.abs(cy).toFixed(3) + 'i';
  }

  // Text eines Umschalt-Knopfs für einen Zustand: name ist der dataset-Schlüssel
  // ('label', 'title', 'ariaLabel'), eingeschaltet gilt name + 'Active'.
  // Fehlt das Attribut (altes HTML aus dem Cache), ist das Ergebnis undefined
  // und der bisherige Text bleibt stehen.
  function toggleText(button, name, isActive) {
    return button.dataset[isActive ? name + 'Active' : name];
  }

  function setToggleAttribute(button, attribute, name, isActive) {
    const value = toggleText(button, name, isActive);
    if (value !== undefined) button.setAttribute(attribute, value);
  }

  function setButtonLabel(button, label) {
    if (!button || label === undefined) return;
    const text = button.querySelector('.btn-text');
    if (text) {
      text.textContent = label;
    } else {
      button.textContent = label;
    }
  }

  // Zugänglicher Name eines noUiSlider-Griffs (STYLEGUIDE FORM-3, WCAG 2.5.3
  // Label in Name): der sichtbare Text des Zeilen-Labels ohne Doppelpunkt.
  // Das <label> selbst zeigt auf das Zahlenfeld daneben, der Griff
  // (role="slider") bekäme sonst gar keinen Namen.
  function sliderHandleAttributes(slider) {
    const row = slider && slider.closest('.fractal-panel__control-row');
    const label = row && row.querySelector('label');
    const text = label ? label.textContent.trim().replace(/:\s*$/, '') : '';
    return [text ? { 'aria-label': text } : {}];
  }

  function getTouchDistance(touches) {
    if (!touches || touches.length < 2) return 0;
    return Math.hypot(
      touches[0].clientX - touches[1].clientX,
      touches[0].clientY - touches[1].clientY
    );
  }

  /**
   * Eine Canvas-Ansicht (Renderer + Interaktion) innerhalb eines Panels.
   * Kapselt Zoom-Box, Pan (Rechtsklick/Leertaste/Touch), Pinch, Wheel,
   * Doppelklick, mobile Zoom-Buttons, HUD und Extremzoom-Warnung.
   */
  class CanvasView {
    constructor(panel, config, frame) {
      this.panel = panel;
      this.config = config;
      this.key = config.key;
      this.frame = frame;
      this.canvas = frame.querySelector('[data-role="canvas"]');
      this.zoomBox = frame.querySelector('[data-role="zoom-box"]');
      this.loading = frame.querySelector('[data-role="loading"]');
      this.zoomWarning = frame.querySelector('[data-role="zoom-warning"]');
      this.hudPosition = frame.querySelector('[data-role="hud-position"]');
      this.hudZoom = frame.querySelector('[data-role="hud-zoom"]');
      this.mobileZoom = frame.querySelector('[data-role="mobile-zoom"]');
      this.zoomLevelDisplay = frame.querySelector('[data-role="zoom-level"]');
      this.view = Object.assign({}, config.view);

      this.renderer = new FractalRenderer({
        canvas: this.canvas,
        loadingIndicator: this.loading,
        unsupportedText: this.loading ? this.loading.dataset.unsupportedText : '',
        workerUrl: panel.workerBase + '/' + config.worker,
        type: config.type,
        allowIterationData: false,
        maxWorkers: panel.variant.maxWorkers(),
        maxCanvasPixels: 1920 * 1080,
        previewScale: panel.variant.previewScale
      });

      this.renderer.onViewUpdate = (v) => {
        this.view.viewX = v.viewX;
        this.view.viewY = v.viewY;
        this.view.zoomLevel = v.zoomLevel;
        this.updateHudZoom();
        this.showCenterInHud();
        this.updateZoomWarning();
      };

      // Interaktionszustand
      this.pointerId = null;
      this.panning = false;
      this.lastPan = null;
      this.zoomBoxStart = null;
      this.zoomBoxStartCss = null;
      this.didDrag = false;
      this.clickTimer = null;
      this.touchStart = null;
      this.gestureHintTimer = null;
      this.pinch = { active: false, startDist: 0, startZoom: 1, lastCenter: null };
    }

    // --- Koordinaten -------------------------------------------------------

    canvasCoords(event) {
      const rect = this.canvas.getBoundingClientRect();
      return {
        x: (event.clientX - rect.left) * (this.canvas.width / rect.width),
        y: (event.clientY - rect.top) * (this.canvas.height / rect.height)
      };
    }

    cssCoords(event) {
      const rect = this.canvas.getBoundingClientRect();
      return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    }

    touchCanvasCoords(touch) {
      return this.canvasCoords(touch);
    }

    touchCenter(touches) {
      if (!touches || touches.length < 2) return null;
      const p1 = this.touchCanvasCoords(touches[0]);
      const p2 = this.touchCanvasCoords(touches[1]);
      return { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
    }

    screenToComplex(pos) {
      const xRange = 3 / this.view.zoomLevel;
      const yRange = 3 / this.view.zoomLevel;
      return {
        cx: this.view.viewX - xRange / 2 + (pos.x / this.canvas.width) * xRange,
        cy: this.view.viewY - yRange / 2 + (pos.y / this.canvas.height) * yRange
      };
    }

    // --- HUD / Anzeigen ----------------------------------------------------

    updateHudZoom() {
      if (this.hudZoom) this.hudZoom.textContent = FractalUtils.formatZoomLevel(this.view.zoomLevel);
      if (this.zoomLevelDisplay) this.zoomLevelDisplay.textContent = this.view.zoomLevel.toFixed(2) + '×';
    }

    showCursorInHud(pos) {
      if (!this.hudPosition) return;
      const complex = this.screenToComplex(pos);
      this.hudPosition.textContent = formatComplex(complex.cx, complex.cy);
    }

    showCenterInHud() {
      if (!this.hudPosition) return;
      this.hudPosition.textContent = formatComplex(this.view.viewX, this.view.viewY);
    }

    updateZoomWarning() {
      if (!this.zoomWarning) return;
      this.zoomWarning.style.display = this.view.zoomLevel >= ZOOM_WARNING_THRESHOLD ? 'block' : 'none';
    }

    // --- Zoom & Pan --------------------------------------------------------

    animateZoomTo(targetZoom, center) {
      const xRangeNew = 3 / targetZoom;
      const yRangeNew = 3 / targetZoom;
      const complexAtCursor = this.screenToComplex(center);
      const targetViewX = complexAtCursor.cx - (center.x / this.canvas.width) * xRangeNew + xRangeNew / 2;
      const targetViewY = complexAtCursor.cy - (center.y / this.canvas.height) * yRangeNew + yRangeNew / 2;
      this.renderer.animateTo({ viewX: targetViewX, viewY: targetViewY, zoomLevel: targetZoom }, 140);
      this.view.viewX = targetViewX;
      this.view.viewY = targetViewY;
      this.view.zoomLevel = targetZoom;
    }

    // Live-Preview während Gesten: Zustand DIREKT setzen und den letzten
    // gerenderten Frame transformiert zeichnen (drawPreview). Kein
    // animateTo: dessen 140ms-Easing wurde pro touchmove neu gestartet und
    // kam nie vom Fleck — der Zoom wurde erst nach der Geste sichtbar.
    previewZoomTo(targetZoom, center) {
      const xRangeNew = 3 / targetZoom;
      const yRangeNew = 3 / targetZoom;
      const complexAtCursor = this.screenToComplex(center);
      this.view.viewX = complexAtCursor.cx - (center.x / this.canvas.width) * xRangeNew + xRangeNew / 2;
      this.view.viewY = complexAtCursor.cy - (center.y / this.canvas.height) * yRangeNew + yRangeNew / 2;
      this.view.zoomLevel = targetZoom;
      this.schedulePreviewDraw();
    }

    previewPanBy(dx, dy) {
      const xRange = 3 / this.view.zoomLevel;
      const yRange = 3 / this.view.zoomLevel;
      this.view.viewX -= (dx / this.canvas.width) * xRange;
      this.view.viewY -= (dy / this.canvas.height) * yRange;
      this.schedulePreviewDraw();
    }

    schedulePreviewDraw() {
      if (this._previewRaf) return;
      this._previewRaf = requestAnimationFrame(() => {
        this._previewRaf = null;
        this.renderer.setState({
          viewX: this.view.viewX,
          viewY: this.view.viewY,
          zoomLevel: this.view.zoomLevel
        });
        this.renderer.drawPreview();
      });
    }

    zoomAtCenter(factor, debounce, reason) {
      const targetZoom = FractalUtils.clamp(this.view.zoomLevel * factor, MIN_ZOOM, this.panel.getMaxZoom());
      this.animateZoomTo(targetZoom, { x: this.canvas.width / 2, y: this.canvas.height / 2 });
      this.panel.requestRender(this, { debounce: debounce, reason: reason });
    }

    panBy(dx, dy, debounce, reason) {
      const xRange = 3 / this.view.zoomLevel;
      const yRange = 3 / this.view.zoomLevel;
      this.view.viewX -= (dx / this.canvas.width) * xRange;
      this.view.viewY -= (dy / this.canvas.height) * yRange;
      this.renderer.setState({ viewX: this.view.viewX, viewY: this.view.viewY, zoomLevel: this.view.zoomLevel });
      this.renderer.drawPreview();
      this.renderer.scheduleRender({ debounce: debounce, reason: reason });
    }

    // --- Zoom-Box ----------------------------------------------------------

    beginZoomBox(cssPos, canvasPos) {
      this.zoomBoxStart = canvasPos;
      this.zoomBoxStartCss = cssPos;
      this.zoomBox.style.display = 'block';
      this.zoomBox.style.left = cssPos.x + 'px';
      this.zoomBox.style.top = cssPos.y + 'px';
      this.zoomBox.style.width = '0px';
      this.zoomBox.style.height = '0px';
    }

    updateZoomBox(cssPos) {
      if (!this.zoomBoxStartCss) return null;
      const left = Math.min(cssPos.x, this.zoomBoxStartCss.x);
      const top = Math.min(cssPos.y, this.zoomBoxStartCss.y);
      const width = Math.abs(cssPos.x - this.zoomBoxStartCss.x);
      const height = Math.abs(cssPos.y - this.zoomBoxStartCss.y);
      this.zoomBox.style.left = left + 'px';
      this.zoomBox.style.top = top + 'px';
      this.zoomBox.style.width = width + 'px';
      this.zoomBox.style.height = height + 'px';
      return { width: width, height: height };
    }

    endZoomBox(canvasPos) {
      this.zoomBox.style.display = 'none';
      if (!this.zoomBoxStart) return;
      const width = Math.abs(canvasPos.x - this.zoomBoxStart.x);
      const height = Math.abs(canvasPos.y - this.zoomBoxStart.y);
      if (width > 10 && height > 10) {
        const center = {
          x: (canvasPos.x + this.zoomBoxStart.x) / 2,
          y: (canvasPos.y + this.zoomBoxStart.y) / 2
        };
        const zoomX = this.canvas.width / width;
        const zoomY = this.canvas.height / height;
        const targetZoom = FractalUtils.clamp(
          this.view.zoomLevel * Math.min(zoomX, zoomY), MIN_ZOOM, this.panel.getMaxZoom()
        );
        this.animateZoomTo(targetZoom, center);
        this.panel.requestRender(this, { debounce: 180, reason: 'zoom-box' });
        this.didDrag = true;
      }
      this.zoomBoxStart = null;
      this.zoomBoxStartCss = null;
    }

    cancelInteraction() {
      this.panning = false;
      this.lastPan = null;
      this.zoomBoxStart = null;
      this.zoomBoxStartCss = null;
      this.pointerId = null;
      this.zoomBox.style.display = 'none';
    }

    // Kurzer Hinweis, wenn jemand mit einem Finger auf dem Canvas zieht
    // (kooperative Gesten: ein Finger scrollt die Seite, zwei verschieben)
    flashGestureHint() {
      const hint = this.frame.querySelector('[data-role="gesture-hint"]');
      if (!hint) return;
      hint.classList.add('is-visible');
      if (this.gestureHintTimer) clearTimeout(this.gestureHintTimer);
      this.gestureHintTimer = setTimeout(() => {
        hint.classList.remove('is-visible');
        this.gestureHintTimer = null;
      }, 1600);
    }

    resetView() {
      Object.assign(this.view, this.config.view);
      this.renderer.animateTo(this.config.view, 180);
      this.panel.requestRender(this, { immediate: true, reason: 'key-reset' });
    }

    // --- Events ------------------------------------------------------------

    bindEvents() {
      const canvas = this.canvas;
      const panel = this.panel;

      // Maus/Stift (Touch läuft über die touch*-Handler)
      canvas.addEventListener('pointerdown', (event) => {
        if (event.pointerType === 'touch') return;
        if (this.pointerId !== null) return;
        this.pointerId = event.pointerId;
        canvas.setPointerCapture(event.pointerId);
        this.didDrag = false;
        const canvasPos = this.canvasCoords(event);
        const cssPos = this.cssCoords(event);
        this.showCursorInHud(canvasPos);
        if (event.button === 2 || panel.isSpacePanning) {
          this.panning = true;
          this.lastPan = canvasPos;
          return;
        }
        if (event.button !== 0) return;
        this.beginZoomBox(cssPos, canvasPos);
      });

      canvas.addEventListener('pointermove', (event) => {
        if (event.pointerType === 'touch') return;
        const canvasPos = this.canvasCoords(event);
        this.showCursorInHud(canvasPos);
        if (this.pointerId !== event.pointerId) return;
        if (this.zoomBoxStart && this.zoomBoxStartCss) {
          const size = this.updateZoomBox(this.cssCoords(event));
          if (size && (size.width > 2 || size.height > 2)) this.didDrag = true;
          return;
        }
        if (!this.panning || !this.lastPan) return;
        const dx = canvasPos.x - this.lastPan.x;
        const dy = canvasPos.y - this.lastPan.y;
        if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) this.didDrag = true;
        this.lastPan = canvasPos;
        this.panBy(dx, dy, 180, 'pan');
      });

      canvas.addEventListener('pointerup', (event) => {
        if (event.pointerType === 'touch') return;
        if (this.pointerId !== event.pointerId) return;
        const canvasPos = this.canvasCoords(event);
        if (this.zoomBoxStart && this.zoomBoxStartCss) {
          this.endZoomBox(canvasPos);
        }
        this.panning = false;
        this.lastPan = null;
        this.pointerId = null;
        this.showCursorInHud(canvasPos);
      });

      canvas.addEventListener('pointercancel', (event) => {
        if (event.pointerType === 'touch') return;
        if (this.pointerId !== event.pointerId) return;
        this.cancelInteraction();
      });

      canvas.addEventListener('contextmenu', (event) => event.preventDefault());

      canvas.addEventListener('mouseleave', () => this.showCenterInHud());

      // Klick wählt c (nur Canvas mit tapSelectsC, z.B. Mandelbrot im Explorer).
      // Verzögert, damit ein Doppelklick den Klick abbrechen kann.
      if (this.config.tapSelectsC) {
        canvas.addEventListener('click', (event) => {
          if (this.didDrag) {
            this.didDrag = false;
            return;
          }
          if (this.clickTimer) clearTimeout(this.clickTimer);
          const pos = this.canvasCoords(event);
          this.clickTimer = setTimeout(() => {
            this.clickTimer = null;
            panel.applyTap(this, pos);
          }, 220);
        });
      }

      canvas.addEventListener('wheel', (event) => {
        event.preventDefault();
        const pos = this.canvasCoords(event);
        const zoomFactor = Math.exp(-event.deltaY * 0.0016);
        const targetZoom = FractalUtils.clamp(this.view.zoomLevel * zoomFactor, MIN_ZOOM, panel.getMaxZoom());
        this.animateZoomTo(targetZoom, pos);
        panel.requestRender(this, { debounce: 220, reason: 'wheel' });
        this.showCursorInHud(pos);
      }, { passive: false });

      canvas.addEventListener('dblclick', (event) => {
        event.preventDefault();
        if (this.clickTimer) {
          clearTimeout(this.clickTimer);
          this.clickTimer = null;
        }
        const pos = this.canvasCoords(event);
        const targetZoom = FractalUtils.clamp(this.view.zoomLevel / 2, MIN_ZOOM, panel.getMaxZoom());
        this.animateZoomTo(targetZoom, pos);
        panel.requestRender(this, { debounce: 180, reason: 'dblclick-out' });
      });

      // Touch — kooperative Gesten wie bei eingebetteten Karten:
      // 1 Finger scrollt die Seite (touch-action: pan-y, kein preventDefault),
      // 2 Finger zoomen (Pinch) und verschieben (Center-Delta).
      // Ein Tap läuft über das nachgelagerte click-Event (tapSelectsC).
      canvas.addEventListener('touchstart', (event) => {
        if (event.touches.length === 2) {
          event.preventDefault();
          this.pinch.active = true;
          this.pinch.startDist = getTouchDistance(event.touches);
          this.pinch.startZoom = this.view.zoomLevel;
          this.pinch.lastCenter = this.touchCenter(event.touches);
          this.touchStart = null;
          return;
        }
        if (event.touches.length === 1) {
          this.touchStart = this.touchCanvasCoords(event.touches[0]);
          this.showCursorInHud(this.touchStart);
        }
      }, { passive: false });

      canvas.addEventListener('touchmove', (event) => {
        if (this.pinch.active && event.touches.length === 2) {
          event.preventDefault();
          const center = this.touchCenter(event.touches);
          if (center && this.pinch.lastCenter) {
            const dx = center.x - this.pinch.lastCenter.x;
            const dy = center.y - this.pinch.lastCenter.y;
            if (dx || dy) this.previewPanBy(dx, dy);
          }
          const distance = getTouchDistance(event.touches);
          if (!this.pinch.startDist) this.pinch.startDist = distance;
          const zoomFactor = distance / this.pinch.startDist;
          if (center && Math.abs(zoomFactor - 1) > 0.005) {
            const targetZoom = FractalUtils.clamp(this.pinch.startZoom * zoomFactor, MIN_ZOOM, panel.getMaxZoom());
            this.previewZoomTo(targetZoom, center);
          }
          this.pinch.lastCenter = center;
          return;
        }
        if (event.touches.length === 1 && this.touchStart) {
          const pos = this.touchCanvasCoords(event.touches[0]);
          if (Math.abs(pos.x - this.touchStart.x) > 8 || Math.abs(pos.y - this.touchStart.y) > 8) {
            this.flashGestureHint();
          }
        }
      }, { passive: false });

      canvas.addEventListener('touchend', (event) => {
        if (this.pinch.active && event.touches.length < 2) {
          this.pinch.active = false;
          this.pinch.startDist = 0;
          this.pinch.startZoom = this.view.zoomLevel;
          this.pinch.lastCenter = null;
          panel.requestRender(this, { debounce: 40, reason: 'pinch-commit' });
        }
        if (event.touches.length === 0) {
          this.touchStart = null;
          this.showCenterInHud();
        }
      });

      // Tastatursteuerung (Canvas hat tabindex="0")
      canvas.addEventListener('keydown', (event) => {
        const stepX = this.canvas.width * 0.08;
        const stepY = this.canvas.height * 0.08;
        switch (event.key) {
          case 'ArrowLeft': this.panBy(stepX, 0, 200, 'key-pan'); break;
          case 'ArrowRight': this.panBy(-stepX, 0, 200, 'key-pan'); break;
          case 'ArrowUp': this.panBy(0, stepY, 200, 'key-pan'); break;
          case 'ArrowDown': this.panBy(0, -stepY, 200, 'key-pan'); break;
          case '+':
          case '=': this.zoomAtCenter(1.2, 200, 'key-zoom-in'); break;
          case '-': this.zoomAtCenter(1 / 1.2, 200, 'key-zoom-out'); break;
          case '0': this.resetView(); break;
          case 'Enter':
            if (!this.config.tapSelectsC) return;
            panel.applyTap(this, { x: this.canvas.width / 2, y: this.canvas.height / 2 });
            break;
          default: return;
        }
        event.preventDefault();
      });

      // Mobile Zoom-Buttons
      const zoomIn = this.frame.querySelector('[data-role="zoom-in"]');
      const zoomOut = this.frame.querySelector('[data-role="zoom-out"]');
      if (zoomIn) {
        zoomIn.addEventListener('click', () => this.zoomAtCenter(1.2, 200, 'zoom-in'));
      }
      if (zoomOut) {
        zoomOut.addEventListener('click', () => this.zoomAtCenter(1 / 1.2, 200, 'zoom-out'));
      }
    }
  }

  /** Ein komplettes Fraktal-Panel (Toolbar, Controls, 1–n Canvas-Ansichten). */
  class FractalPanel {
    constructor(root, variant) {
      this.root = root;
      this.variant = variant;
      this.workerBase = root.dataset.workerBase || '/assets/js';
      this.isSpacePanning = false;

      this.state = {
        maxIterations: variant.iterations.start,
        colorScheme: 'retrowave',
        useIntense: false,
        allowExtremeZoom: false,
        realPart: variant.initialC.realPart,
        imagPart: variant.initialC.imagPart
      };

      this.$ = (role) => root.querySelector('[data-role="' + role + '"]');

      // Canvas-Ansichten
      this.views = [];
      const frames = root.querySelectorAll('[data-role="canvas-frame"]');
      variant.canvases.forEach((config) => {
        let frame = null;
        frames.forEach((candidate) => {
          if (candidate.dataset.canvasKey === config.key) frame = candidate;
        });
        if (frame) this.views.push(new CanvasView(this, config, frame));
      });

      this.colorSchemeSelect = this.$('color-scheme');
      this.state.colorScheme = this.colorSchemeSelect ? this.colorSchemeSelect.value : 'retrowave';

      this.initSliders();
      this.initSelects();
      this.bindControls();
      this.views.forEach((view) => view.bindEvents());
      this.bindGlobal();

      // Initialzustand (Knopftexte im Ruhezustand stehen schon im Markup)
      this.updateJuliaParamText();
      this.views.forEach((view) => {
        view.updateHudZoom();
        view.showCenterInHud();
        view.updateZoomWarning();
      });
      this.updateMobileControls();
      this.resizeAndRender(true);
    }

    view(key) {
      return this.views.find((v) => v.key === key) || null;
    }

    getMaxZoom() {
      return this.state.allowExtremeZoom ? MAX_ZOOM_EXTREME : MAX_ZOOM_DEFAULT;
    }

    // --- Rendering ---------------------------------------------------------

    syncRendererState() {
      const palettes = this.state.useIntense ? FractalPalettes.intense : FractalPalettes.standard;
      if (!palettes[this.state.colorScheme]) {
        this.state.colorScheme = 'blau-rot';
        if (this.colorSchemeSelect) this.colorSchemeSelect.value = this.state.colorScheme;
      }
      this.views.forEach((view) => {
        view.renderer.setState({
          viewX: view.view.viewX,
          viewY: view.view.viewY,
          zoomLevel: view.view.zoomLevel,
          maxIterations: this.state.maxIterations,
          colorScheme: this.state.colorScheme,
          colorPalettes: palettes,
          realPart: this.state.realPart,
          imagPart: this.state.imagPart
        });
      });
    }

    requestRender(viewOrNull, options) {
      const settings = options || {};
      this.syncRendererState();
      const targets = viewOrNull ? [viewOrNull] : this.views;
      targets.forEach((view) => {
        if (settings.preview) view.renderer.drawPreview();
        if (settings.immediate) {
          view.renderer.render({ preview: false, reason: settings.reason || 'immediate' });
        } else {
          view.renderer.scheduleRender({ debounce: settings.debounce || 200, reason: settings.reason || 'scheduled' });
        }
      });
    }

    resizeAndRender(force) {
      let changed = false;
      this.views.forEach((view) => {
        const before = view.canvas.width + 'x' + view.canvas.height;
        view.renderer.resizeToContainer(view.frame);
        if (view.canvas.width + 'x' + view.canvas.height !== before) changed = true;
      });
      if (changed || force) {
        // Während eines laufenden Fenster-Resize feuert der ResizeObserver pro
        // Frame — ein immediate-Render würde pro Tick maxWorkers Worker
        // erzeugen und gleich wieder terminieren. Debouncen; nur der initiale
        // force-Aufruf (Erst-Render) bleibt sofort.
        this.requestRender(null, force
          ? { immediate: true, reason: 'resize' }
          : { debounce: 180, reason: 'resize' });
      }
    }

    // --- Varianten-Hooks ---------------------------------------------------

    /** Klick/Tap auf ein tapSelectsC-Canvas: setzt den c-Parameter der Julia-Ansicht. */
    applyTap(view, pos) {
      const complex = view.screenToComplex(pos);
      this.setCParameter(complex.cx, complex.cy, { render: true });
    }

    setCParameter(realPart, imagPart, options) {
      // Reihenfolge wichtig: Slider zuerst — deren synchroner 'update'-Handler
      // schreibt den auf das 0.01-Raster gerundeten Wert in den State. Danach
      // die EXAKTEN Werte setzen, damit Presets/Taps mit präzisem c rendern
      // (z.B. Blitz -0.835/-0.2321); die Slider zeigen den gerundeten Wert.
      this.syncCSliders(realPart, imagPart);
      this.state.realPart = realPart;
      this.state.imagPart = imagPart;
      this.updateJuliaParamText();
      if (options && options.render) {
        const juliaView = this.view('julia');
        if (juliaView) this.requestRender(juliaView, { immediate: true, reason: 'julia-c' });
      }
    }

    updateJuliaParamText() {
      const span = this.$('julia-param');
      if (span) span.textContent = formatComplex(this.state.realPart, this.state.imagPart);
    }

    syncCSliders(realPart, imagPart) {
      if (this.realSlider) this.realSlider.noUiSlider.set(realPart);
      if (this.imagSlider) this.imagSlider.noUiSlider.set(imagPart);
    }

    resetViews(targets) {
      targets.forEach((target) => {
        const view = this.view(target.key);
        if (!view) return;
        Object.assign(view.view, target.view);
        view.renderer.animateTo(target.view, 180);
      });
      this.requestRender(null, { immediate: true, reason: 'reset' });
    }

    download() {
      const config = this.variant.download;
      const canvases = config.keys
        .map((key) => this.view(key))
        .filter(Boolean)
        .map((view) => view.canvas);
      if (!canvases.length) return;
      let source = canvases[0];
      if (canvases.length > 1) {
        // Mehrere Canvases vertikal stapeln (Explorer-Export)
        const merge = document.createElement('canvas');
        merge.width = Math.max.apply(null, canvases.map((c) => c.width));
        merge.height = canvases.reduce((sum, c) => sum + c.height, 0);
        const ctx = merge.getContext('2d');
        let y = 0;
        canvases.forEach((c) => {
          ctx.drawImage(c, 0, y);
          y += c.height;
        });
        source = merge;
      }
      const link = document.createElement('a');
      link.download = config.filename;
      link.href = source.toDataURL('image/png');
      link.click();
    }

    // --- Controls ----------------------------------------------------------

    initSliders() {
      const iterations = this.variant.iterations;
      this.iterSlider = this.$('iterations-slider');
      this.iterInput = this.$('iterations-input');
      noUiSlider.create(this.iterSlider, {
        start: iterations.start,
        connect: [true, false],
        step: iterations.step,
        range: { min: iterations.min, max: iterations.max },
        format: { to: (v) => Math.round(v), from: (v) => Number(v) },
        handleAttributes: sliderHandleAttributes(this.iterSlider)
      });
      this.iterSlider.noUiSlider.on('update', (values) => {
        this.state.maxIterations = parseInt(values[0], 10);
        if (this.iterInput) this.iterInput.value = values[0];
      });
      this.iterSlider.noUiSlider.on('change', () => {
        this.requestRender(null, { preview: true, debounce: 220, reason: 'iterations' });
      });
      if (this.iterInput) {
        this.iterInput.addEventListener('change', () => {
          const val = parseInt(this.iterInput.value, 10);
          if (!isNaN(val) && val >= iterations.min && val <= iterations.max) {
            this.iterSlider.noUiSlider.set(val);
            this.requestRender(null, { preview: true, debounce: 220, reason: 'iterations-input' });
          } else {
            this.iterInput.value = this.state.maxIterations;
          }
        });
      }

      if (!this.variant.cControls) return;

      this.realSlider = this.$('real-slider');
      this.imagSlider = this.$('imag-slider');
      this.realInput = this.$('real-input');
      this.imagInput = this.$('imag-input');
      const cSliderOptions = {
        connect: [true, false],
        step: 0.01,
        range: { min: -2, max: 2 },
        format: { to: (v) => v.toFixed(2), from: (v) => Number(v) }
      };
      noUiSlider.create(this.realSlider, Object.assign({
        start: this.state.realPart,
        handleAttributes: sliderHandleAttributes(this.realSlider)
      }, cSliderOptions));
      noUiSlider.create(this.imagSlider, Object.assign({
        start: this.state.imagPart,
        handleAttributes: sliderHandleAttributes(this.imagSlider)
      }, cSliderOptions));

      const bindCSlider = (slider, input, prop) => {
        slider.noUiSlider.on('update', (values) => {
          this.state[prop] = parseFloat(values[0]);
          if (input) input.value = values[0];
        });
        slider.noUiSlider.on('change', () => {
          this.requestRender(this.view('julia'), { preview: true, debounce: 150, reason: prop });
        });
        if (input) {
          input.addEventListener('change', () => {
            const val = parseFloat(input.value);
            if (!isNaN(val) && val >= -2 && val <= 2) {
              slider.noUiSlider.set(val);
              this.requestRender(this.view('julia'), { preview: true, debounce: 150, reason: prop + '-input' });
            } else {
              input.value = this.state[prop].toFixed(2);
            }
          });
        }
      };
      bindCSlider(this.realSlider, this.realInput, 'realPart');
      bindCSlider(this.imagSlider, this.imagInput, 'imagPart');
      // noUiSlider feuert 'update' synchron beim Binden und hat den initialen
      // c-Parameter soeben aufs 0.01-Raster gerundet (0.27015 -> 0.27) — die
      // exakten Startwerte nachziehen (Reihenfolge Slider -> exakter State,
      // siehe setCParameter).
      this.setCParameter(this.variant.initialC.realPart, this.variant.initialC.imagPart, { render: false });
    }

    initSelects() {
      if (this.colorSchemeSelect && typeof TomSelect !== 'undefined') {
        this.colorTomSelect = new TomSelect(this.colorSchemeSelect, {
          create: false,
          sortField: null,
          controlInput: null,
          allowEmptyOption: false,
          onChange: (value) => {
            this.state.colorScheme = value;
            this.requestRender(null, { immediate: true, reason: 'colorScheme' });
          }
        });
      } else if (this.colorSchemeSelect) {
        this.colorSchemeSelect.addEventListener('change', () => {
          this.state.colorScheme = this.colorSchemeSelect.value;
          this.requestRender(null, { immediate: true, reason: 'colorScheme' });
        });
      }

      const presetSelect = this.$('preset');
      if (presetSelect && typeof TomSelect !== 'undefined') {
        this.presetTomSelect = new TomSelect(presetSelect, {
          create: false,
          sortField: null,
          controlInput: null,
          allowEmptyOption: false,
          onChange: (value) => {
            const option = presetSelect.querySelector('option[value="' + value + '"]');
            if (!option) return;
            this.setCParameter(parseFloat(option.dataset.real), parseFloat(option.dataset.imag), { render: false });
            this.requestRender(this.view('julia'), { preview: true, debounce: 100, reason: 'preset' });
          }
        });
      }
    }

    bindControls() {
      const root = this.root;

      const focusButton = this.$('focus-mode');
      if (focusButton) {
        focusButton.addEventListener('click', () => {
          root.classList.toggle('is-focus-mode');
          const active = root.classList.contains('is-focus-mode');
          focusButton.classList.toggle('is-active', active);
          focusButton.setAttribute('aria-pressed', String(active));
          if (!root.classList.contains('is-fullscreen')) {
            setTimeout(() => this.resizeAndRender(), 100);
          }
        });
      }

      const advancedButton = this.$('advanced-toggle');
      if (advancedButton) {
        advancedButton.addEventListener('click', () => {
          root.classList.toggle('is-advanced-open');
          const isOpen = root.classList.contains('is-advanced-open');
          advancedButton.classList.toggle('is-active', isOpen);
          advancedButton.setAttribute('aria-expanded', String(isOpen));
          setButtonLabel(advancedButton, toggleText(advancedButton, 'label', isOpen));
          setToggleAttribute(advancedButton, 'title', 'title', isOpen);
          if (!root.classList.contains('is-fullscreen')) {
            setTimeout(() => this.resizeAndRender(), 100);
          }
        });
      }

      const resetButton = this.$('reset');
      if (resetButton) {
        resetButton.addEventListener('click', () => this.variant.reset(this));
      }

      const recalcButton = this.$('recalc');
      if (recalcButton) {
        recalcButton.addEventListener('click', () => {
          if (this.colorSchemeSelect) this.state.colorScheme = this.colorSchemeSelect.value;
          this.requestRender(null, { immediate: true, reason: 'apply' });
        });
      }

      const intensityButton = this.$('intensity');
      if (intensityButton) {
        intensityButton.addEventListener('click', () => {
          this.state.useIntense = !this.state.useIntense;
          intensityButton.classList.toggle('is-active', this.state.useIntense);
          intensityButton.setAttribute('aria-pressed', String(this.state.useIntense));
          setButtonLabel(intensityButton, toggleText(intensityButton, 'label', this.state.useIntense));
          // Label in Name (WCAG 2.5.3): der zugängliche Name beginnt mit dem
          // sichtbaren Wort — Pflicht, weil der Text mobil ausgeblendet ist.
          setToggleAttribute(intensityButton, 'aria-label', 'ariaLabel', this.state.useIntense);
          this.requestRender(null, { preview: true, debounce: 200, reason: 'palette' });
        });
      }

      const extremeButton = this.$('extreme-zoom');
      if (extremeButton) {
        extremeButton.addEventListener('click', () => {
          this.state.allowExtremeZoom = !this.state.allowExtremeZoom;
          extremeButton.classList.toggle('is-active', this.state.allowExtremeZoom);
          extremeButton.setAttribute('aria-pressed', String(this.state.allowExtremeZoom));
          setButtonLabel(extremeButton, toggleText(extremeButton, 'label', this.state.allowExtremeZoom));
          if (!this.state.allowExtremeZoom) {
            let clamped = false;
            this.views.forEach((view) => {
              if (view.view.zoomLevel > MAX_ZOOM_DEFAULT) {
                view.view.zoomLevel = MAX_ZOOM_DEFAULT;
                view.renderer.animateTo({
                  viewX: view.view.viewX,
                  viewY: view.view.viewY,
                  zoomLevel: view.view.zoomLevel
                }, 160);
                clamped = true;
              }
            });
            if (clamped) this.requestRender(null, { immediate: true, reason: 'limit-clamp' });
          }
          this.views.forEach((view) => view.updateZoomWarning());
        });
      }

      const crtToggle = this.$('crt-toggle');
      if (crtToggle) {
        crtToggle.addEventListener('click', () => {
          const off = root.classList.toggle('is-crt-off');
          crtToggle.classList.toggle('is-active', !off);
          crtToggle.setAttribute('aria-pressed', String(!off));
        });
      }

      const downloadButton = this.$('download');
      if (downloadButton) {
        downloadButton.addEventListener('click', () => this.download());
      }

      const fullscreenButton = this.$('fullscreen');
      if (fullscreenButton) {
        fullscreenButton.addEventListener('click', () => {
          if (!document.fullscreenElement) {
            if (root.requestFullscreen) root.requestFullscreen();
          } else if (document.exitFullscreen) {
            document.exitFullscreen();
          }
        });
        document.addEventListener('fullscreenchange', () => {
          // Nur reagieren, wenn DIESES Panel betroffen ist (nicht das andere auf der Seite)
          const isFullscreen = document.fullscreenElement === root;
          if (!isFullscreen && !root.classList.contains('is-fullscreen')) return;
          root.classList.toggle('is-fullscreen', isFullscreen);
          setButtonLabel(fullscreenButton, toggleText(fullscreenButton, 'label', isFullscreen));
          setTimeout(() => this.resizeAndRender(), 80);
        });
      }

      const explanationToggle = this.$('explanation-toggle');
      const explanationBox = this.$('explanation-box');
      if (explanationToggle && explanationBox) {
        const explanationIcon = explanationToggle.querySelector('.toggle-icon');
        explanationToggle.addEventListener('click', () => {
          const isOpen = explanationBox.classList.toggle('is-visible');
          explanationToggle.classList.toggle('is-active', isOpen);
          explanationToggle.setAttribute('aria-expanded', String(isOpen));
          // Inhalt wie im Markup: „<Text> <span class="toggle-icon">▲|▼</span>“.
          // Ohne Wechseltext (altes HTML aus dem Cache) bleiben Text und Pfeil
          // zusammen stehen, sonst entstünde „anzeigen ▲“.
          const label = toggleText(explanationToggle, 'label', isOpen);
          if (label !== undefined) {
            if (explanationIcon) explanationIcon.textContent = isOpen ? '▲' : '▼';
            explanationToggle.textContent = label + ' ';
            if (explanationIcon) explanationToggle.appendChild(explanationIcon);
          }
        });
      }
    }

    bindGlobal() {
      window.addEventListener('keydown', (event) => {
        if (event.code === 'Space') this.isSpacePanning = true;
      });
      window.addEventListener('keyup', (event) => {
        if (event.code === 'Space') this.isSpacePanning = false;
      });

      // Canvas-Resize übernimmt der ResizeObserver (deckt window-resize mit ab);
      // hier nur die Mobile-Controls nachziehen — der frühere doppelte
      // resizeAndRender-Aufruf pro resize-Event entfällt.
      // rAF-gedrosselt (JS-12, PERF-8): updateMobileControls schreibt
      // style.display. Direkt im Event lief das vor den Messungen anderer
      // resize-Listener (toc.js, back-to-top.js), an der md-Grenze erzwang das
      // ein zusätzliches Layout. Ohne site-utils.js (altes HTML) ungedrosselt.
      const utils = window.AuflinieUtils;
      const throttle = utils && utils.rafThrottle ? utils.rafThrottle : (fn) => fn;
      window.addEventListener('resize', throttle(() => this.updateMobileControls()));

      if (typeof ResizeObserver !== 'undefined') {
        this.resizeObserver = new ResizeObserver(() => this.resizeAndRender());
        this.views.forEach((view) => this.resizeObserver.observe(view.frame));
      } else {
        window.addEventListener('resize', throttle(() => this.resizeAndRender()));
      }
    }

    updateMobileControls() {
      // Breite wie down(md) in components/fractal-panel/*.scss. Ohne
      // site-utils.js (altes HTML aus dem Cache) zählt nur die Eingabeart.
      const mq = window.AuflinieUtils && window.AuflinieUtils.mq;
      const narrow = !!(mq && mq.downMd && mq.downMd.matches);
      const isMobile = FractalUtils.isMobileDevice() || narrow;
      this.views.forEach((view) => {
        if (view.mobileZoom) view.mobileZoom.style.display = isMobile ? 'flex' : 'none';
      });
    }
  }

  // ── Seiten-Modul (STYLEGUIDE 10.2): mountet einmal beim Laden ──────────────
  // Marker data-fractal-panel-mounted. Als Defer-Skript nach den
  // Abhängigkeiten aus fractal/deps.html steht das DOM fertig.
  function mount() {
    document.querySelectorAll('[data-fractal-panel]').forEach((rootElement) => {
      if (rootElement.hasAttribute('data-fractal-panel-mounted')) { return; }
      const variant = VARIANTS[rootElement.dataset.fractalPanel];
      if (!variant) {
        console.warn('fractal-panel: unbekannte Variante', rootElement.dataset.fractalPanel);
        return;
      }
      if (typeof FractalRenderer === 'undefined' || typeof noUiSlider === 'undefined') {
        console.warn('fractal-panel: Abhängigkeiten fehlen (fractal_panels-Flag im Front Matter gesetzt?)');
        return;
      }
      rootElement.setAttribute('data-fractal-panel-mounted', '');
      new FractalPanel(rootElement, variant);   // die Instanz lebt über ihre Listener weiter
    });
  }

  mount();
})();
