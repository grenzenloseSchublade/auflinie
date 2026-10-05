/** fractal-renderer.js — gemeinsamer Renderer für Mandelbrot-/Julia-Visualisierungen */
(function() {
  'use strict';

  const standardPalettes = {
    'blau-rot': ['#000764', '#206bcb', '#edffff', '#ffb847', '#fb0c00'],
    'cyberpunk': ['#ff00ff', '#9600ff', '#0000ff', '#00ffff', '#00ffcc', '#ff00cc'],
    'retrowave': ['#ff00ff', '#9600ff', '#0000ff', '#00ffff', '#00ffcc', '#ff00cc', '#ff00ff'],
    'feuer': ['#000000', '#340000', '#800000', '#ff0000', '#ffff00', '#ffffff'],
    'ozean': ['#000033', '#000066', '#0000ff', '#00ffff', '#ffffff', '#00ffff'],
    'monochrom': ['#000000', '#222222', '#444444', '#666666', '#888888', '#aaaaaa', '#cccccc', '#ffffff'],
    'regenbogen': ['#ff00ff', '#ff8000', '#ffff00', '#00ff00', '#00ffff', '#0000ff', '#8000ff', '#ff00ff'],
    'ultraviolett': ['#000000', '#2e0854', '#5a1a9a', '#7b52ab', '#9470dc', '#b490ff', '#dcacff', '#ffffff'],
    'goldgruen': ['#071a07', '#0b3b0b', '#0e640e', '#11c411', '#30ff30', '#88ff88', '#dfffdf', '#ffffff'],
    'goldgrün': ['#071a07', '#0b3b0b', '#0e640e', '#11c411', '#30ff30', '#88ff88', '#dfffdf', '#ffffff']
  };

  const intensePalettes = {
    'blau-rot': ['#000764', '#0c3b9e', '#206bcb', '#4e9ced', '#edffff', '#ffce89', '#ffb847', '#ff7847', '#fb0c00'],
    'cyberpunk': ['#ff00ff', '#d400ff', '#a900ff', '#7e00ff', '#5300ff', '#2700ff', '#001eff', '#0069ff', '#00b4ff', '#00ffff', '#00ffb4', '#00ff69', '#00ff1e', '#27ff00', '#53ff00', '#7eff00', '#a9ff00', '#d4ff00', '#ffff00', '#ffd400', '#ffa900', '#ff7e00', '#ff5300', '#ff2700', '#ff001e', '#ff0069', '#ff00b4', '#ff00ff'],
    'retrowave': ['#ff00ff', '#f700f7', '#d100ff', '#9f00ff', '#5500ff', '#2300ff', '#0014ff', '#0046ff', '#0078ff', '#00a9ff', '#00d9ff', '#00ffff', '#00ffdc', '#00ffb0', '#00ff83', '#00ff55', '#00ff28', '#19ff00', '#64ff00', '#b0ff00', '#ffff00', '#ffdc00', '#ffb000', '#ff8300', '#ff5500', '#ff2800', '#ff0019', '#ff0064', '#ff00b0', '#ff00ff'],
    'feuer': ['#000000', '#1c0000', '#340000', '#550000', '#800000', '#aa0000', '#d40000', '#ff0000', '#ff4000', '#ff8000', '#ffc000', '#ffff00', '#ffffaa', '#ffffff'],
    'ozean': ['#000033', '#000044', '#000066', '#000088', '#0000aa', '#0000cc', '#0000ff', '#0055ff', '#00aaff', '#00ffff', '#55ffff', '#aaffff', '#ffffff', '#aaffff', '#00ffff'],
    'monochrom': ['#000000', '#111111', '#222222', '#333333', '#444444', '#555555', '#666666', '#777777', '#888888', '#999999', '#aaaaaa', '#bbbbbb', '#cccccc', '#dddddd', '#eeeeee', '#ffffff'],
    'regenbogen': ['#ff00ff', '#ff00cc', '#ff0099', '#ff0066', '#ff0033', '#ff0000', '#ff3300', '#ff6600', '#ff9900', '#ffcc00', '#ffff00', '#ccff00', '#99ff00', '#66ff00', '#33ff00', '#00ff00', '#00ff33', '#00ff66', '#00ff99', '#00ffcc', '#00ffff', '#00ccff', '#0099ff', '#0066ff', '#0033ff', '#0000ff', '#3300ff', '#6600ff', '#9900ff', '#cc00ff', '#ff00ff'],
    'ultraviolett': ['#000000', '#150429', '#2e0854', '#44127e', '#5a1a9a', '#6b36a3', '#7b52ab', '#876eb4', '#9470dc', '#a480e8', '#b490ff', '#c59dff', '#dcacff', '#e9cbff', '#f5e9ff', '#ffffff'],
    'goldgruen': ['#071a07', '#09280a', '#0b3b0b', '#0c500c', '#0e640e', '#0f790f', '#118e11', '#10a710', '#11c411', '#20d820', '#30ff30', '#59ff59', '#88ff88', '#b0ffb0', '#dfffdf', '#ffffff'],
    'goldgrün': ['#071a07', '#09280a', '#0b3b0b', '#0c500c', '#0e640e', '#0f790f', '#118e11', '#10a710', '#11c411', '#20d820', '#30ff30', '#59ff59', '#88ff88', '#b0ffb0', '#dfffdf', '#ffffff']
  };

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  // Eingabeart statt Gerätename (JS-11): Touch als primäre Eingabe zählt
  // als mobil. Deckt auch iPads mit Desktop-UA ab, Laptops mit Touchscreen
  // bleiben Desktop (primärer Zeiger ist Maus oder Touchpad). Der Name bleibt,
  // fractal-panel.js liest ihn über FractalUtils.
  function isMobileDevice() {
    return !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
  }

  function formatZoomLevel(level) {
    if (level >= 10) return level.toFixed(0) + '×';
    if (level >= 1) return level.toFixed(1) + '×';
    return level.toFixed(2) + '×';
  }

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  class FractalRenderer {
    constructor(options) {
      this.canvas = options.canvas;
      this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
      if (!this.ctx) {
        console.warn('fractal-renderer: Canvas-Kontext nicht verfügbar');
        return;
      }
      this.loadingIndicator = options.loadingIndicator || null;
      this.workerUrl = options.workerUrl;
      this.type = options.type;
      this.allowIterationData = !!options.allowIterationData;
      this.maxWorkers = options.maxWorkers || (navigator.hardwareConcurrency || 4);
      this.maxCanvasPixels = options.maxCanvasPixels || 1920 * 1080;
      this.previewScale = options.previewScale || 0.6;
      this.qualityScale = 1;
      this.iterationScale = 1;
      this.state = {
        viewX: 0,
        viewY: 0,
        zoomLevel: 1,
        maxIterations: 200,
        colorScheme: 'retrowave',
        colorPalettes: standardPalettes,
        realPart: -0.7,
        imagPart: 0.27015
      };
      this.lastRenderedState = null;
      this.backingCanvas = document.createElement('canvas');
      this.backingCtx = this.backingCanvas.getContext('2d');
      this.renderCanvas = document.createElement('canvas');
      this.renderCtx = this.renderCanvas.getContext('2d');
      this.iterationData = null;
      this.iterationMeta = null;
      this.activeWorkers = [];
      this.requestId = 0;
      this.pendingTimer = null;
      this.isRendering = false;
      this.onViewUpdate = null;
      this.onRenderComplete = null;
      this.animationFrame = null;
    }

    setState(partial) {
      this.state = Object.assign({}, this.state, partial);
      if (this.onViewUpdate) {
        this.onViewUpdate({
          viewX: this.state.viewX,
          viewY: this.state.viewY,
          zoomLevel: this.state.zoomLevel
        });
      }
    }

    resizeToContainer(container) {
      if (!container) return;
      // clientWidth/clientHeight statt getBoundingClientRect: schliesst Border
      // und Scrollbars aus. Mit Border wuerde die gemessene Hoehe die gesetzte
      // Canvas-Hoehe stets um die Borderbreite uebersteigen -> ResizeObserver-
      // Endlosschleife (Canvas waechst pro Tick).
      const rect = container.getBoundingClientRect();
      const targetWidth = Math.max(1, Math.floor(container.clientWidth || rect.width));
      const targetHeight = Math.max(1, Math.floor(container.clientHeight || rect.height || targetWidth * 9 / 16));
      if (!targetWidth || !targetHeight) return;

      const baseDpr = window.devicePixelRatio || 1;
      const targetPixels = targetWidth * targetHeight * baseDpr * baseDpr;
      const dprScale = targetPixels > this.maxCanvasPixels
        ? Math.sqrt(this.maxCanvasPixels / targetPixels)
        : 1;
      const effectiveDpr = Math.max(0.5, baseDpr * dprScale);

      const nextWidth = Math.max(1, Math.floor(targetWidth * effectiveDpr));
      const nextHeight = Math.max(1, Math.floor(targetHeight * effectiveDpr));

      if (this.canvas.width !== nextWidth || this.canvas.height !== nextHeight) {
        this.canvas.width = nextWidth;
        this.canvas.height = nextHeight;
        this.canvas.style.width = targetWidth + 'px';
        this.canvas.style.height = targetHeight + 'px';
        this.invalidateBacking();
      }
    }

    invalidateBacking() {
      this.backingCanvas.width = this.canvas.width;
      this.backingCanvas.height = this.canvas.height;
      this.backingCtx.clearRect(0, 0, this.backingCanvas.width, this.backingCanvas.height);
      this.lastRenderedState = null;
    }

    scheduleRender(options) {
      const settings = options || {};
      const debounce = typeof settings.debounce === 'number' ? settings.debounce : 200;
      if (this.pendingTimer) {
        clearTimeout(this.pendingTimer);
      }
      this.pendingTimer = setTimeout(() => {
        this.pendingTimer = null;
        this.render({ preview: false, reason: settings.reason || 'scheduled' });
      }, debounce);
    }

    drawPreview() {
      if (!this.lastRenderedState) return;
      const base = this.lastRenderedState;
      if (base.canvasWidth !== this.canvas.width || base.canvasHeight !== this.canvas.height) {
        return;
      }
      const xRangeBase = 3 / base.zoomLevel;
      const yRangeBase = 3 / base.zoomLevel;
      const dxPixels = ((this.state.viewX - base.viewX) / xRangeBase) * this.canvas.width;
      const dyPixels = ((this.state.viewY - base.viewY) / yRangeBase) * this.canvas.height;
      const scale = this.state.zoomLevel / base.zoomLevel;

      this.ctx.setTransform(1, 0, 0, 1, 0, 0);
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      // Pan-Versatz in Pixeln des NEUEN Zooms: dxPixels ist im Basis-Bild
      // gemessen und muss mit dem Zoom-Faktor mitskaliert werden, sonst ist
      // die Vorschau bei jedem nicht-zentrierten Zoom versetzt.
      this.ctx.translate(-dxPixels * scale, -dyPixels * scale);
      this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
      this.ctx.scale(scale, scale);
      this.ctx.translate(-this.canvas.width / 2, -this.canvas.height / 2);
      this.ctx.drawImage(this.backingCanvas, 0, 0);
      this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    }

    animateTo(target, duration) {
      const start = {
        viewX: this.state.viewX,
        viewY: this.state.viewY,
        zoomLevel: this.state.zoomLevel
      };
      const end = Object.assign({}, start, target);
      const startTime = performance.now();
      const total = duration || 160;
      if (this.animationFrame) cancelAnimationFrame(this.animationFrame);

      const step = (now) => {
        const t = clamp((now - startTime) / total, 0, 1);
        const eased = easeOutCubic(t);
        this.setState({
          viewX: start.viewX + (end.viewX - start.viewX) * eased,
          viewY: start.viewY + (end.viewY - start.viewY) * eased,
          zoomLevel: start.zoomLevel + (end.zoomLevel - start.zoomLevel) * eased
        });
        this.drawPreview();
        if (t < 1) {
          this.animationFrame = requestAnimationFrame(step);
        }
      };
      this.animationFrame = requestAnimationFrame(step);
    }

    cancelActiveWorkers() {
      this.activeWorkers.forEach(worker => worker.terminate());
      this.activeWorkers = [];
      this.isRendering = false;
    }

    render(options) {
      const settings = options || {};
      const preview = !!settings.preview;
      // Ein noch anstehender debounced Render würde nach diesem Render denselben
      // Zustand ein zweites Mal rechnen — verfällt hiermit.
      if (this.pendingTimer) { clearTimeout(this.pendingTimer); this.pendingTimer = null; }
      if (this.workerUrl && window.Worker) {
        this.cancelActiveWorkers();
        this.requestId += 1;
        const requestId = this.requestId;

        if (!preview && this.loadingIndicator) {
          this.loadingIndicator.style.display = 'block';
        }
        this.isRendering = true;

        const renderScale = preview ? this.previewScale : this.qualityScale;
        const renderWidth = Math.max(1, Math.floor(this.canvas.width * renderScale));
        const renderHeight = Math.max(1, Math.floor(this.canvas.height * renderScale));

        this.renderCanvas.width = renderWidth;
        this.renderCanvas.height = renderHeight;
        this.renderCtx.clearRect(0, 0, renderWidth, renderHeight);

        const paletteMap = this.state.colorPalettes || standardPalettes;
        const fallbackPalette = paletteMap['blau-rot'] || standardPalettes['blau-rot'];
        const selectedPalette = paletteMap[this.state.colorScheme];
        const colorPalette = Array.isArray(selectedPalette) && selectedPalette.length >= 2
          ? selectedPalette
          : fallbackPalette;
        const rawIterations = Number.isFinite(this.state.maxIterations)
          ? this.state.maxIterations
          : this.state.maxIterations == null
            ? 200
            : Number(this.state.maxIterations);
        const safeIterations = Number.isFinite(rawIterations) ? rawIterations : 200;
        const effectiveIterations = Math.max(10, Math.round(safeIterations * (preview ? 0.7 : this.iterationScale)));
        const numWorkers = Math.max(1, Math.min(this.maxWorkers, Math.ceil(renderHeight / 128)));
        const chunkHeight = Math.ceil(renderHeight / numWorkers);
        const iterationBuffer = (!preview && this.allowIterationData)
          ? new Uint16Array(renderWidth * renderHeight)
          : null;
        let completed = 0;
        const startTime = performance.now();

        for (let i = 0; i < numWorkers; i++) {
          const startY = i * chunkHeight;
          const endY = Math.min(startY + chunkHeight, renderHeight);
          const worker = new Worker(this.workerUrl);
          this.activeWorkers.push(worker);
          worker.postMessage({
            requestId,
            width: renderWidth,
            height: renderHeight,
            maxIterations: effectiveIterations,
            colorPalette,
            startY,
            endY,
            workerId: i,
            viewX: this.state.viewX,
            viewY: this.state.viewY,
            zoomLevel: this.state.zoomLevel,
            realPart: this.state.realPart,
            imagPart: this.state.imagPart,
            includeIterationData: !preview && this.allowIterationData
          });

          worker.onmessage = (event) => {
            if (!event.data || event.data.requestId !== requestId) return;
            const result = event.data;
            this.renderCtx.putImageData(result.imageData, 0, result.startY);
            if (iterationBuffer && result.iterationChunk) {
              iterationBuffer.set(result.iterationChunk, result.startY * renderWidth);
            }
            completed += 1;
            this.ctx.setTransform(1, 0, 0, 1, 0, 0);
            this.ctx.drawImage(this.renderCanvas, 0, 0, this.canvas.width, this.canvas.height);
            if (completed === numWorkers) {
              const renderTime = performance.now() - startTime;
              this.backingCanvas.width = this.canvas.width;
              this.backingCanvas.height = this.canvas.height;
              this.backingCtx.clearRect(0, 0, this.backingCanvas.width, this.backingCanvas.height);
              this.backingCtx.drawImage(this.canvas, 0, 0);
              this.lastRenderedState = {
                viewX: this.state.viewX,
                viewY: this.state.viewY,
                zoomLevel: this.state.zoomLevel,
                canvasWidth: this.canvas.width,
                canvasHeight: this.canvas.height
              };
              this.iterationData = iterationBuffer;
              this.iterationMeta = iterationBuffer ? { width: renderWidth, height: renderHeight } : null;
              this.activeWorkers.forEach(w => w.terminate());
              this.activeWorkers = [];
              this.isRendering = false;
              if (this.loadingIndicator) this.loadingIndicator.style.display = 'none';
              if (!preview) this.adjustQuality(renderTime);
              if (this.onRenderComplete) {
                this.onRenderComplete({ renderTime, preview });
              }
            }
          };

          worker.onerror = (error) => {
            console.error('fractal-renderer: Worker-Fehler', error);
            if (this.loadingIndicator) this.loadingIndicator.style.display = 'none';
            this.isRendering = false;
            this.activeWorkers.forEach(w => w.terminate());
            this.activeWorkers = [];
          };
        }
      } else {
        if (this.loadingIndicator) {
          this.loadingIndicator.style.display = 'block';
          this.loadingIndicator.textContent = 'Die Darstellung ist in diesem Browser nicht möglich.';
        }
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = '#111111';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = '#dddddd';
        this.ctx.font = '16px sans-serif';
        this.ctx.fillText('Die Darstellung ist in diesem Browser nicht möglich.', 20, 32);
        console.warn('fractal-renderer: Web Worker nicht verfügbar, Rendering deaktiviert');
      }
    }

    adjustQuality(renderTime) {
      if (renderTime > 800) {
        this.qualityScale = Math.max(0.5, this.qualityScale * 0.85);
        this.iterationScale = Math.max(0.6, this.iterationScale * 0.9);
      } else if (renderTime > 450) {
        this.qualityScale = Math.max(0.6, this.qualityScale * 0.92);
        this.iterationScale = Math.max(0.7, this.iterationScale * 0.95);
      } else if (renderTime < 180) {
        this.qualityScale = Math.min(1, this.qualityScale + 0.04);
        this.iterationScale = Math.min(1, this.iterationScale + 0.03);
      }
    }

    getIterationAt(x, y) {
      if (!this.iterationData || !this.iterationMeta) return null;
      const dataX = Math.floor(x * (this.iterationMeta.width / this.canvas.width));
      const dataY = Math.floor(y * (this.iterationMeta.height / this.canvas.height));
      if (dataX < 0 || dataY < 0 || dataX >= this.iterationMeta.width || dataY >= this.iterationMeta.height) {
        return null;
      }
      return this.iterationData[dataY * this.iterationMeta.width + dataX];
    }
  }

  window.FractalRenderer = FractalRenderer;
  window.FractalPalettes = {
    standard: standardPalettes,
    intense: intensePalettes
  };
  window.FractalUtils = {
    clamp,
    formatZoomLevel,
    isMobileDevice
  };
})();
