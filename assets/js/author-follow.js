/**
 * author-follow.js — Folgen-Dropdown im Autor-Profil: Vanilla-Ersatz für den
 * entfernten jQuery-Toggle des Themes (main.min.js wird nicht mehr geladen).
 * Toggelt .is--visible auf .author__urls; schließt bei Außenklick/Escape.
 * Muster nach STYLEGUIDE A11Y-2: aria-expanded und aria-controls am Button,
 * Öffnen per Tastatur setzt den Fokus in die Liste, Escape gibt ihn an den
 * Button zurück. Das Markup kommt aus dem Theme-Include author-profile.html,
 * deshalb setzt das Skript id und aria-controls selbst.
 *
 * An den Persistent-Shell-Kontrakt (spa-nav.js) gebunden: das Autor-Markup
 * liegt INNERHALB von .initial-content und wird bei jedem Swap ersetzt. Ohne
 * Re-Mount wäre der Button danach tot; ohne Teardown zeigten die dokumentweiten
 * Listener auf detachierte Nodes. Daher: idempotenter Mount auf spa:load,
 * dokumentweite Listener via AbortController an spa:unload abräumen.
 */
(function () {
  'use strict';

  let controller = null;

  function mount(root) {
    const scope = root || document;
    const wrapper = scope.querySelector('.author__urls-wrapper');
    if (!wrapper || wrapper.hasAttribute('data-author-follow-init')) return;
    const btn = wrapper.querySelector('button');
    const list = wrapper.querySelector('.author__urls');
    if (!btn || !list) return;
    wrapper.setAttribute('data-author-follow-init', '');

    if (!list.id) list.id = 'author-follow-list';
    btn.setAttribute('aria-controls', list.id);
    btn.setAttribute('aria-expanded', 'false');

    function close() {
      list.classList.remove('is--visible');
      btn.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
    }

    // Element-scoped -> stirbt mit dem alten DOM beim Swap, kein Teardown nötig.
    // Per Enter/Leertaste geöffnet (click mit detail 0): Fokus auf den ersten
    // Link der Liste. Bei Maus/Touch bleibt er am Button, wie beim Drawer
    // (greedy-navigation.js): das Theme zeichnet schon bei :focus einen Ring
    // um Links, nach dem Antippen stünde er ohne Grund am ersten Eintrag.
    // Tab führt vom Button ohnehin direkt in die Liste.
    btn.addEventListener('click', function (e) {
      const offen = list.classList.toggle('is--visible');
      btn.classList.toggle('open', offen);
      btn.setAttribute('aria-expanded', offen ? 'true' : 'false');
      if (offen && e.detail === 0) {
        const first = list.querySelector('a[href]');
        if (first) first.focus({ preventScroll: true });
      }
    });

    // Dokumentweit -> überlebt den Swap und muss aktiv abgeräumt werden.
    controller = new AbortController();
    const signal = controller.signal;
    document.addEventListener('click', function (e) {
      if (!wrapper.contains(e.target)) close();
    }, { signal: signal });
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape' || !list.classList.contains('is--visible')) return;
      // Fokus nur zurückholen, wenn er im Dropdown oder am Button liegt.
      // Wer schon weitergetabbt hat, bleibt, wo er ist.
      const fokusDrin = wrapper.contains(document.activeElement);
      close();
      if (fokusDrin) btn.focus();
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
