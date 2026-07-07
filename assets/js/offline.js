/**
 * Offline Page Script
 * Automatischer Reload wenn der Benutzer wieder online ist
 */
(function() {
  'use strict';

  // Prüfen, ob der Benutzer wieder online ist
  window.addEventListener('online', function() {
    window.location.reload();
  });

  // Reload-Button Event Listener
  var reloadBtn = document.querySelector('.offline-page__reload-btn');
  if (reloadBtn) {
    reloadBtn.addEventListener('click', function() {
      window.location.reload();
    });
  }
})();

// Cache-Hinweis nur zeigen, wenn wirklich offline —
// die Seite ist auch direkt (online) aufrufbar
(function () {
  var notice = document.querySelector('.offline-page__cache-notice');
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
