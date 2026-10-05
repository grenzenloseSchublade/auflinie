/**
 * blog-search.js — Blog-Suche/Filter auf der Blog-Übersicht.
 * Seiten-Modul (STYLEGUIDE 10.2): mountet einmal beim Laden, Marker
 * data-blog-search-mounted. Nur mit blog_search im Front Matter geladen
 * (_includes/scripts.html).
 */
(function () {
  'use strict';

  function mount() {
    const input = document.querySelector('#blog-search-input');
    if (!input || input.hasAttribute('data-blog-search-mounted')) return;
    input.setAttribute('data-blog-search-mounted', '');

    const clearBtn = document.querySelector('#blog-search-clear');
    const entries = document.querySelectorAll('#blog-entries .post-item');
    const emptyMessage = document.querySelector('#blog-empty-message');

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
    // Zurück ohne bfcache (Firefox lädt neu): Der Browser stellt den
    // Suchtext wieder her, die Liste muss dazu passen
    if (input.value) applyFilter();
  }

  mount();
})();
