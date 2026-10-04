/**
 * mathjax-config.js — MathJax-Konfiguration und verzögertes Laden des Kerns.
 * Eigene Datei (statt inline im Head), damit spa-nav.js sie beim
 * Seitentausch nachladen kann: der Script-Reconcile überträgt nur
 * script[src], keine Inline-Blöcke.
 *
 * Den Kern (vendor/mathjax/tex-chtml.js, mit Schrift rund 380 KB) hängt
 * dieses Skript erst an, wenn er gebraucht wird: sofort, wenn die erste
 * Formel höchstens zwei Bildschirmhöhen tief steht (am Desktop meist), sonst
 * sobald eine Formel bis auf eine Bildschirmhöhe heranrückt, bei der ersten
 * Eingabe (Zeiger, Taste, Mausrad) oder nach dem load-Ereignis, wenn der
 * Browser Zeit hat. Als defer-Skript im Kopf teilte er sich mobil Bandbreite
 * und Hauptthread mit dem Hero-Bild (Lighthouse mobil auf /mandelbrot/:
 * LCP 4,5 s, verzögert 2,6 s). Gesetzte Formeln sehen gleich aus.
 *
 * MathJax ist selbst gehostet (assets/vendor/mathjax + mathjax-newcm-font):
 * kein CDN-Request, Formeln funktionieren offline, CSP kommt ohne
 * jsdelivr aus. fontPath zeigt auf die lokale Font-Kopie (CHTML-Teil des
 * @mathjax/mathjax-newcm-font-Pakets).
 */
(function () {
  'use strict';

  const BASE = (document.documentElement.getAttribute('data-baseurl') || '').replace(/\/+$/, '');

  window.MathJax = {
    tex: {
      inlineMath: [['$', '$'], ['\\(', '\\)']],
      displayMath: [['$$', '$$'], ['\\[', '\\]']],
      processEscapes: true,
      packages: { '[+]': ['noerrors'] }
    },
    output: {
      fontPath: BASE + '/assets/vendor/mathjax-newcm-font'
    },
    options: {
      skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code'],
      ignoreHtmlClass: 'tex2jax_ignore',
      processHtmlClass: 'tex2jax_process',
      // Sprach-/Braille-Ausgabe (SRE) aus: Sie startet einen blob:-Worker,
      // dessen Dateien (vendor/mathjax/sre/) nicht mitgeliefert sind, und
      // würde worker-src blob: in der CSP erzwingen. Barrierefreiheit trägt
      // das versteckte MathML (assistiveMml), das Screenreader selbst
      // vorlesen. Die Menü-Settings überschreiben die Optionen, daher beides.
      enableEnrichment: false,
      enableSpeech: false,
      enableBraille: false,
      enableExplorer: false,
      menuOptions: {
        settings: {
          assistiveMml: true,
          enrich: false,
          speech: false,
          braille: false
        }
      }
    },
    loader: {
      load: ['[tex]/noerrors']
    },
    startup: {
      ready: function () {
        // WICHTIG (v4): defaultReady() liefert das Startup-Promise zurück —
        // ohne return bleibt MathJax.startup.promise für immer pending und
        // jeder typesetPromise-Aufruf (SPA-Hook!) hängt daran fest.
        const readyPromise = MathJax.startup.defaultReady();

        // Fehlerbehandlung für veraltete Attribute
        if (MathJax._?.input?.mathml?.MathMLCompile?.prototype?.error) {
          const originalCompileError = MathJax._.input.mathml.MathMLCompile.prototype.error;
          MathJax._.input.mathml.MathMLCompile.prototype.error = function (node, message) {
            if (message.match(/mathvariant='script'/)) {
              return null; // Unterdrücke diese spezifische Warnung
            }
            return originalCompileError.call(this, node, message);
          };
        }

        return readyPromise;
      }
    }
  };

  // ── Kern nachladen ─────────────────────────────────────────────────────────
  const INPUT = ['pointerdown', 'keydown', 'wheel', 'touchstart'];
  let started = false;
  let observer = null;

  function loadCore() {
    if (started) { return; }
    started = true;
    INPUT.forEach(function (type) { window.removeEventListener(type, loadCore, true); });
    if (observer) { observer.disconnect(); observer = null; }
    const script = document.createElement('script');
    script.id = 'MathJax-script';
    script.src = BASE + '/assets/vendor/mathjax/tex-chtml.js';
    document.head.appendChild(script);
  }

  // Elemente mit Formel-Begrenzern ($, \( oder \[) im Text, ohne Code
  function formulaElements() {
    const root = document.querySelector('.page__content') || document.body;
    const skip = 'script, style, code, pre, textarea, noscript, .tex2jax_ignore';
    const found = new Set();
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (/\$|\\\(|\\\[/.test(node.nodeValue) && !node.parentElement.closest(skip)) {
        found.add(node.parentElement);
      }
    }
    return Array.from(found);
  }

  function arm() {
    // Seitentausch (spa-nav.js) oder spätes Laden: sofort
    if (document.readyState === 'complete' || !('IntersectionObserver' in window)) { loadCore(); return; }
    const targets = formulaElements();
    if (!targets.length) { return; }
    // Erste Formel schon im oder nahe dem ersten Bild (hohe Fenster): ohne
    // Umweg über den Observer sofort laden, so früh wie vorher per defer
    if (targets[0].getBoundingClientRect().top < window.innerHeight * 2) { loadCore(); return; }
    observer = new IntersectionObserver(function (entries) {
      if (entries.some(function (e) { return e.isIntersecting; })) { loadCore(); }
    }, { rootMargin: '100% 0px' });
    targets.forEach(function (el) { observer.observe(el); });
    INPUT.forEach(function (type) { window.addEventListener(type, loadCore, { capture: true, passive: true }); });
    window.addEventListener('load', function () {
      if ('requestIdleCallback' in window) { window.requestIdleCallback(loadCore, { timeout: 1500 }); }
      else { setTimeout(loadCore, 200); }
    }, { once: true });
  }

  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', arm, { once: true }); }
  else { arm(); }
})();
