/**
 * Offline Page Script
 * Automatischer Reload wenn der Benutzer wieder online ist
 */
(function() {
  'use strict';

  // Prüfen, ob der Benutzer wieder online ist. Guard: wurde die Offline-Seite
  // per SPA-Swap durch anderen Inhalt ersetzt, lebt dieser Listener weiter —
  // ohne DOM-Check würde er später eine beliebige gerade angezeigte Seite
  // hart neu laden.
  window.addEventListener('online', function() {
    if (!document.querySelector('.offline-page')) { return; }
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
