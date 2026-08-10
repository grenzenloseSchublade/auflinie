/*
 * Folgen-Dropdown im Autor-Profil: Vanilla-Ersatz für den entfernten
 * jQuery-Toggle des Themes (main.min.js wird nicht mehr geladen).
 * Toggelt .is--visible auf .author__urls; schließt bei Außenklick/Escape.
 *
 * An den Persistent-Shell-Kontrakt (spa-nav.js) gebunden: das Autor-Markup
 * liegt INNERHALB von .initial-content und wird bei jedem Swap ersetzt. Ohne
 * Re-Mount wäre der Button danach tot; ohne Teardown zeigten die dokumentweiten
 * Listener auf detachierte Nodes. Daher: idempotenter Mount auf spa:load,
 * dokumentweite Listener via AbortController an spa:unload abräumen.
 */
(function () {
  'use strict';

  var controller = null;

  function mount(root) {
    var scope = root || document;
    var wrapper = scope.querySelector('.author__urls-wrapper');
    if (!wrapper || wrapper.hasAttribute('data-author-follow-init')) return;
    var btn = wrapper.querySelector('button');
    var list = wrapper.querySelector('.author__urls');
    if (!btn || !list) return;
    wrapper.setAttribute('data-author-follow-init', '');

    btn.setAttribute('aria-expanded', 'false');

    function close() {
      list.classList.remove('is--visible');
      btn.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
    }

    // Element-scoped -> stirbt mit dem alten DOM beim Swap, kein Teardown nötig.
    btn.addEventListener('click', function () {
      var offen = list.classList.toggle('is--visible');
      btn.classList.toggle('open', offen);
      btn.setAttribute('aria-expanded', offen ? 'true' : 'false');
    });

    // Dokumentweit -> überlebt den Swap und muss aktiv abgeräumt werden.
    controller = new AbortController();
    var signal = controller.signal;
    document.addEventListener('click', function (e) {
      if (!wrapper.contains(e.target)) close();
    }, { signal: signal });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') close();
    }, { signal: signal });
  }

  function teardown() { if (controller) { controller.abort(); controller = null; } }

  document.addEventListener('spa:load', function (e) { mount(e.detail && e.detail.root); });
  document.addEventListener('spa:unload', teardown);

  // PE-Fallback: greift nur, wenn das Fundament NICHT aktiv ist (JS-an, aber
  // spa-nav-Capability-Gate nicht bestanden). Prüfung erst zur complete-Zeit.
  function peFallback() { if (!window.__spaNavActive) mount(document); }
  if (document.readyState === 'complete') peFallback();
  else document.addEventListener('DOMContentLoaded', peFallback);
})();
