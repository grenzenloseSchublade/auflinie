/**
 * blog-notice.js — Blog-Hinweis (Markup: _includes/blog-notice.html).
 * Seiten-Modul (STYLEGUIDE 10.2): mountet einmal beim Laden, Marker
 * data-blog-notice-mounted. Früher Inline-Skript im Include, das gegen die
 * CSP ohne 'unsafe-inline' verstieß (Security-Audit 10/2026, I10).
 * Natives <dialog> per showModal() (Top Layer, R-10): Escape, Fokusfalle und
 * inert für den Rest der Seite kommen vom Browser, showModal() setzt den
 * Fokus auf den Knopf. Gespeichert wird im close-Event, das deckt Knopf,
 * Abdunkler und Escape ab. Einmaligkeit pro Besucher über localStorage
 * (Schlüssel je Hinweis-id).
 */
(function () {
  'use strict';

  function mount() {
    const box = document.querySelector('#blog-notice');
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

  mount();
})();
