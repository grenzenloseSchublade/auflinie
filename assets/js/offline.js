/**
 * offline.js — Offline-Seite (offline.html): lädt automatisch neu, sobald die
 * Verbindung wieder steht, und verdrahtet den Knopf „Seite neu laden“.
 */
(function() {
  'use strict';

  // Wieder online: die Seite neu laden, der Service Worker oder das Netz
  // liefert dann die eigentlich angefragte Seite
  window.addEventListener('online', function() {
    window.location.reload();
  });

  // Reload-Button Event Listener
  const reloadBtn = document.querySelector('.offline-page__reload-btn');
  if (reloadBtn) {
    reloadBtn.addEventListener('click', function() {
      window.location.reload();
    });
  }
})();

// Cache-Hinweis nur zeigen, wenn wirklich offline —
// die Seite ist auch direkt (online) aufrufbar
(function () {
  'use strict';

  const notice = document.querySelector('.offline-page__cache-notice');
  if (notice && navigator.onLine) {
    notice.style.display = 'none';
  }
  window.addEventListener('online', function () {
    if (notice) { notice.style.display = 'none'; }
  });
  window.addEventListener('offline', function () {
    if (notice) { notice.style.display = ''; }
  });
})();
