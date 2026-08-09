/**
 * Blog-Suche/Filter — an den Persistent-Shell-Kontrakt (spa-nav.js) gebunden.
 * Rein element-scoped (input/clear sterben mit dem alten DOM) -> kein Teardown,
 * nur idempotent gegen Doppel-Init. Läuft initial UND nach jedem Swap.
 */
(function () {
  'use strict';

  function mount(root) {
    var scope = root || document;
    var input = scope.querySelector('#blog-search-input');
    if (!input || input.hasAttribute('data-blog-search-init')) return;
    input.setAttribute('data-blog-search-init', '');

    var clearBtn = scope.querySelector('#blog-search-clear');
    var entries = scope.querySelectorAll('#blog-entries .post-item');
    var emptyMessage = scope.querySelector('#blog-empty-message');

    function normalize(v) { return (v || '').toLowerCase().trim(); }
    function applyFilter() {
      var q = normalize(input.value), n = 0;
      entries.forEach(function (item) {
        var visible = q === '' || (item.getAttribute('data-search') || '').indexOf(q) !== -1;
        item.style.display = visible ? '' : 'none';
        if (visible) n += 1;
      });
      if (emptyMessage) emptyMessage.style.display = n === 0 ? 'block' : 'none';
    }
    input.addEventListener('input', applyFilter);
    if (clearBtn) clearBtn.addEventListener('click', function () { input.value = ''; applyFilter(); input.focus(); });
  }

  document.addEventListener('spa:load', function (e) { mount(e.detail && e.detail.root); });

  // PE-Fallback: greift nur, wenn das Fundament NICHT aktiv ist. Prüfung erst
  // zur DOMContentLoaded-/complete-Zeit -> dann ist __spaNavActive korrekt
  // gesetzt (spa-nav ist das letzte defer-Skript).
  function peFallback() { if (!window.__spaNavActive) mount(document); }
  if (document.readyState === 'complete') peFallback();
  else document.addEventListener('DOMContentLoaded', peFallback);
})();
