/**
 * blog-notice.js — Blog-Hinweis (Markup: _includes/blog-notice.html), am
 * Persistent-Shell-Kontrakt (window.spaModule). Früher Inline-Skript im
 * Include: das lief nach einem SPA-Swap nie (innerHTML führt <script> nicht
 * aus) und verstieß gegen die CSP ohne 'unsafe-inline' (Security-Audit
 * 10/2026, I10).
 * Natives <dialog> per showModal() (Top Layer, R-10): Escape, Fokusfalle und
 * inert für den Rest der Seite kommen vom Browser, showModal() setzt den
 * Fokus auf den Knopf. Gespeichert wird im close-Event, das deckt Knopf,
 * Abdunkler und Escape ab. Ein SPA-Swap entfernt den Dialog ohne close.
 * Einmaligkeit pro Besucher über localStorage (Schlüssel je Hinweis-id).
 */
(function () {
  'use strict';

  function mount(root) {
    const scope = root || document;
    const box = scope.querySelector('#blog-notice');
    if (!box || box.hasAttribute('data-blog-notice-mounted')) return;
    box.setAttribute('data-blog-notice-mounted', '');
    if (typeof box.showModal !== 'function') return;

    const key = 'auflinie:blog-notice-dismissed:' + box.getAttribute('data-notice-id');
    try { if (localStorage.getItem(key) === '1') { return; } } catch (e) { /* Storage gesperrt: einfach zeigen */ }

    box.addEventListener('close', function () {
      try { localStorage.setItem(key, '1'); } catch (e) { /* ok */ }
    });
    box.querySelector('#blog-notice-close').addEventListener('click', function () { box.close(); });
    // Klick auf den Abdunkler trifft das <dialog> selbst, das Panel füllt es aus
    box.addEventListener('click', function (e) { if (e.target === box) { box.close(); } });

    // Im Prerender (Speculation Rules) erst mit der Aktivierung öffnen, ein
    // vorher geöffneter Dialog stünde beim Aufruf schon fertig da
    const utils = window.AuflinieUtils;
    if (utils && utils.whenActivated) utils.whenActivated(function () { box.showModal(); });
    else box.showModal();
  }

  // Alle Listener hängen am Dialog und sterben mit dem DOM beim Swap
  function teardown() {}

  window.spaModule({ name: 'blog-notice', mount: mount, teardown: teardown });
})();
