/**
 * blog-search.js — Blog-Suche/Filter, an den Persistent-Shell-Kontrakt
 * (spa-nav.js) gebunden.
 * Rein element-scoped (input/clear sterben mit dem alten DOM) -> kein Teardown,
 * nur idempotent gegen Doppel-Init. Läuft initial UND nach jedem Swap.
 * Registrierung über window.spaModule (spa-module.js, vorher geladen).
 */
(function () {
  'use strict';

  function mount(root) {
    const scope = root || document;
    const input = scope.querySelector('#blog-search-input');
    if (!input || input.hasAttribute('data-blog-search-mounted')) return;
    input.setAttribute('data-blog-search-mounted', '');

    const clearBtn = scope.querySelector('#blog-search-clear');
    const entries = scope.querySelectorAll('#blog-entries .post-item');
    const emptyMessage = scope.querySelector('#blog-empty-message');

    function normalize(v) { return (v || '').toLowerCase().trim(); }
    function applyFilter() {
      const q = normalize(input.value);
      let n = 0;
      entries.forEach(function (item) {
        const visible = q === '' || (item.getAttribute('data-search') || '').indexOf(q) !== -1;
        item.style.display = visible ? '' : 'none';
        if (visible) n += 1;
      });
      if (emptyMessage) emptyMessage.style.display = n === 0 ? 'block' : 'none';
    }
    input.addEventListener('input', applyFilter);
    if (clearBtn) clearBtn.addEventListener('click', function () { input.value = ''; applyFilter(); input.focus(); });
  }

  // Kein Teardown nötig: alle Listener hängen an Knoten im Inhalt.
  function teardown() {}

  window.spaModule({ name: 'blog-search', mount: mount, teardown: teardown });
})();
