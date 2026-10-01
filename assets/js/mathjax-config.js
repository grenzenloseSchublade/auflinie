/**
 * MathJax-Konfiguration — als eigene Datei (statt inline im Head), damit
 * spa-nav.js sie beim Seitentausch nachladen kann: der Script-Reconcile
 * überträgt nur script[src], keine Inline-Blöcke. Muss VOR
 * vendor/mathjax/tex-chtml.js laden (defer erhält die Reihenfolge, der
 * Reconcile ebenso via async=false).
 *
 * MathJax ist selbst gehostet (assets/vendor/mathjax + mathjax-newcm-font):
 * kein CDN-Request, Formeln funktionieren offline, CSP kommt ohne
 * jsdelivr aus. fontPath zeigt auf die lokale Font-Kopie (CHTML-Teil des
 * @mathjax/mathjax-newcm-font-Pakets).
 */
(function () {
  'use strict';

  var BASE = (document.documentElement.getAttribute('data-baseurl') || '').replace(/\/+$/, '');

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
        var readyPromise = MathJax.startup.defaultReady();

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
})();
