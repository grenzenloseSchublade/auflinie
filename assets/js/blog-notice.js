/**
 * Blog-Hinweis (Markup: _includes/blog-notice.html) — am Persistent-Shell-
 * Kontrakt (window.spaModule). Früher Inline-Skript im Include: das lief nach
 * einem SPA-Swap nie (innerHTML führt <script> nicht aus) und verstieß gegen
 * die CSP ohne 'unsafe-inline' (Security-Audit 10/2026, I10).
 * Einmaligkeit pro Besucher über localStorage (Schlüssel je Hinweis-id).
 */
(function () {
  'use strict';

  var onKeydown = null;

  function mount(root) {
    var scope = root || document;
    var box = scope.querySelector('#blog-notice');
    if (!box || box.hasAttribute('data-blog-notice-init')) return;
    box.setAttribute('data-blog-notice-init', '');

    var key = 'auflinie:blog-notice-dismissed:' + box.getAttribute('data-notice-id');
    try { if (localStorage.getItem(key) === '1') { return; } } catch (e) { /* Storage gesperrt: einfach zeigen */ }

    var closeBtn = box.querySelector('#blog-notice-close');
    function dismiss() {
      box.hidden = true;
      try { localStorage.setItem(key, '1'); } catch (e) { /* ok */ }
      teardown();
    }

    box.hidden = false;
    closeBtn.addEventListener('click', dismiss);
    box.addEventListener('click', function (e) { if (e.target === box) { dismiss(); } });
    onKeydown = function (e) { if (e.key === 'Escape' && !box.hidden) { dismiss(); } };
    document.addEventListener('keydown', onKeydown);
    closeBtn.focus({ preventScroll: true });
  }

  // Nur der document-Listener überlebt den Swap, Element-Listener sterben mit dem DOM
  function teardown() {
    if (onKeydown) { document.removeEventListener('keydown', onKeydown); onKeydown = null; }
  }

  window.spaModule({ mount: mount, teardown: teardown });
})();
