/**
 * author-follow.js — Folgen-Dropdown im Autor-Profil: Vanilla-Ersatz für den
 * entfernten jQuery-Toggle des Themes (main.min.js wird nicht mehr geladen).
 * Toggelt .is--visible auf .author__urls; schließt bei Außenklick/Escape.
 * Muster nach STYLEGUIDE A11Y-2: aria-expanded und aria-controls am Button,
 * Öffnen per Tastatur setzt den Fokus in die Liste, Escape gibt ihn an den
 * Button zurück. Das Markup kommt aus dem Theme-Include author-profile.html,
 * deshalb setzt das Skript id und aria-controls selbst.
 *
 * Seiten-Modul (STYLEGUIDE 10.2): mountet einmal beim Laden, als
 * Defer-Skript steht das DOM dann fertig. Der Marker
 * data-author-follow-mounted schützt vor einem zweiten Mount.
 */
(function () {
  'use strict';

  function mount() {
    const wrapper = document.querySelector('.author__urls-wrapper');
    if (!wrapper || wrapper.hasAttribute('data-author-follow-mounted')) return;
    const btn = wrapper.querySelector('button');
    const list = wrapper.querySelector('.author__urls');
    if (!btn || !list) return;
    wrapper.setAttribute('data-author-follow-mounted', '');

    if (!list.id) list.id = 'author-follow-list';
    btn.setAttribute('aria-controls', list.id);
    btn.setAttribute('aria-expanded', 'false');

    function close() {
      list.classList.remove('is--visible');
      btn.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
    }

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

    document.addEventListener('click', function (e) {
      if (!wrapper.contains(e.target)) close();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape' || !list.classList.contains('is--visible')) return;
      // Fokus nur zurückholen, wenn er im Dropdown oder am Button liegt.
      // Wer schon weitergetabbt hat, bleibt, wo er ist.
      const fokusDrin = wrapper.contains(document.activeElement);
      close();
      if (fokusDrin) btn.focus();
    });
  }

  mount();
})();
