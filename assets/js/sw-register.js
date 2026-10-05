/**
 * sw-register.js — Registrierung des Service Workers.
 *
 * Dieses Skript registriert den Service Worker, der für das Caching von Ressourcen
 * und die Offline-Funktionalität der Website verantwortlich ist.
 */

(function() {
  'use strict';
  
  // Konfiguration aus dem HTML-Dokument auslesen
  const config = {
    enableServiceWorker: document.documentElement.getAttribute('data-enable-service-worker') === 'true'
  };
  
  /**
   * Zeigt ein visuelles Update-Toast statt eines blockierenden confirm().
   * "Neu laden" aktiviert den wartenden Worker (SKIP_WAITING) und lädt die
   * Seite erst nach dem controllerchange neu — so gibt es keinen Mischzustand
   * aus altem DOM und neuem Cache.
   */
  function showUpdateToast(registration) {
    // Prüfe ob Toast bereits existiert
    if (document.getElementById('sw-update-toast')) return;

    const toast = document.createElement('div');
    toast.id = 'sw-update-toast';
    toast.className = 'sw-update-toast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    toast.setAttribute('aria-relevant', 'additions');
    toast.innerHTML = `
      <div class="sw-update-toast__panel">
        <p class="sw-update-toast__headline">Neue Version verfügbar</p>
        <div class="sw-update-toast__actions">
          <button type="button" id="sw-update-dismiss" class="sw-update-toast__ghost">Später</button>
          <button type="button" id="sw-update-reload" class="sw-update-toast__primary">Neu laden</button>
        </div>
      </div>
    `;

    document.body.appendChild(toast);
    
    // Event-Listener — der Reload passiert im globalen controllerchange-
    // Listener (wireControllerReload), damit ALLE offenen Tabs neu laden,
    // nicht nur der, in dem geklickt wurde.
    document.getElementById('sw-update-reload').addEventListener('click', () => {
      const waiting = registration && registration.waiting;
      if (waiting) {
        waiting.postMessage({ type: 'SKIP_WAITING' });
      } else {
        window.location.reload();
      }
    });
    
    document.getElementById('sw-update-dismiss').addEventListener('click', () => {
      toast.classList.add('sw-update-toast--leaving');
      setTimeout(() => toast.remove(), 320);
    });
  }
  
  /**
   * Service Worker registrieren
   */
  /**
   * Dev-Betrieb (jekyll serve): vorhandene Service Worker deregistrieren und
   * Site-Caches löschen. Ohne das bleibt ein früher registrierter Worker aktiv
   * und meldet nach jeder Regeneration ein "Update" (CACHE_VERSION = Build-
   * Zeitstempel) — die gemeldete Dauerschleife beim lokalen Entwickeln.
   */
  function cleanupServiceWorker() {
    // Nur die EIGENE Registrierung: getRegistrations() lieferte auch die
    // Worker anderer Projekte auf demselben Origin (github.io-Nutzerseite).
    const scopeUrl = new URL(getRootPath(), window.location.href).href;
    navigator.serviceWorker.getRegistration(scopeUrl)
      .then((reg) => { if (reg && reg.scope === scopeUrl) reg.unregister(); })
      .catch(() => {});

    // Präfix aus _config.yml (sw_cache_prefix) über data-sw-cache-prefix, wie
    // CACHE_PREFIX in service-worker.js. Leer = nichts löschen: ein leerer
    // Präfix passte auf jeden Cache des geteilten Origins.
    const prefix = document.documentElement.getAttribute('data-sw-cache-prefix') || '';
    if (prefix && window.caches && caches.keys) {
      caches.keys()
        .then((keys) => keys.forEach((key) => {
          if (key.indexOf(prefix) === 0) {
            caches.delete(key);
          }
        }))
        .catch(() => {});
    }
  }

  function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      // Warten, bis die Seite geladen ist
      window.addEventListener('load', () => {
        // Nur in Production registrieren — im Dev-Betrieb aufräumen
        if (!config.enableServiceWorker) {
          cleanupServiceWorker();
          return;
        }

        // Bestimme den Pfad zum Root der Website
        const rootPath = getRootPath();
        
        // Service Worker-Pfad relativ zum Root der Website
        const swPath = rootPath + 'service-worker.js';
        
        // Registriere den Service Worker mit dem Scope des Root-Verzeichnisses
        // updateViaCache: 'none' -> der SW-Skript-Fetch umgeht bei jedem
        // Update-Check den HTTP-Cache; ein neuer Build wird zuverlässig erkannt.
        navigator.serviceWorker.register(swPath, { scope: rootPath, updateViaCache: 'none' })
          .then(registration => {
            // Toast-Lücke: wählte der Nutzer früher "Später", wartet der neue
            // Worker weiter, aber updatefound feuert nicht erneut — daher
            // beim Laden direkt prüfen
            if (registration.waiting && navigator.serviceWorker.controller) {
              showUpdateToast(registration);
            }

            // Auf Updates prüfen
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing;
              
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // Neuer Service Worker ist installiert - zeige Update-Toast
                  showUpdateToast(registration);
                }
              });
            });
          })
          .catch(error => {
            console.error('sw-register: ServiceWorker-Registrierung fehlgeschlagen', error);
          });
      });
    }
  }
  
  /**
   * Bestimmt den Pfad zum Root der Website
   * Berücksichtigt die baseurl in Jekyll-Projekten
   */
  function getRootPath() {
    // Aktuelle URL
    const currentPath = window.location.pathname;
    
    // Bestimme den baseurl aus dem HTML-Element (falls vorhanden)
    const baseUrl = document.documentElement.getAttribute('data-baseurl') || '';
    
    if (baseUrl) {
      // Wenn baseurl gesetzt ist, verwende diesen als Präfix
      return baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';
    } else {
      // Ohne baseurl: Bestimme den Root-Pfad aus der aktuellen URL
      // Entferne alles nach dem letzten Slash in der URL
      const pathParts = currentPath.split('/');
      
      // Entferne den letzten Teil (Dateiname oder leerer String)
      pathParts.pop();
      
      // Füge einen Slash am Ende hinzu
      return pathParts.join('/') + '/';
    }
  }
  
  /**
   * Freshness in lange offenen Tabs: Bei jedem Seitenaufruf prüft der Browser
   * selbst auf einen neuen Service Worker. Wer einen Tab lange stehen lässt,
   * bekäme den "Neue Version"-Toast nach einem Deploy aber erst beim nächsten
   * Klick. Deshalb zusätzlich bei Rückkehr zum Tab und bei Fokus prüfen
   * (gedrosselt, production-only).
   */
  function wireUpdateChecks() {
    if (!('serviceWorker' in navigator) || !config.enableServiceWorker) return;
    const THROTTLE = 12 * 1000;   // nur gegen Doppel-Feuern; sonst so oft wie möglich
    let last = 0;

    function checkForUpdate() {
      // Ohne Controller (Erstbesuch) gibt es kein "Update" -> nichts zu tun.
      if (!navigator.serviceWorker.controller) return;
      const now = Date.now();
      if (now - last < THROTTLE) return;
      last = now;
      navigator.serviceWorker.ready.then(function (reg) {
        // Wartet bereits ein neuer Worker (z.B. nach "Später")? -> erneut anbieten.
        if (reg.waiting) { showUpdateToast(reg); }
        // Frisch prüfen: service-worker.js wird cache-umgehend geholt -> ein neuer
        // Build wird erkannt, installiert, wartet -> updatefound zeigt den Toast.
        reg.update().catch(function () {});
      }).catch(function () {});
    }

    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'visible') { checkForUpdate(); }
    });
    window.addEventListener('focus', checkForUpdate);
  }

  /**
   * Versions-Mix bei mehreren Tabs verhindern: der Update-Flow löscht beim
   * Aktivieren die alten Caches (activate) und übernimmt alle Tabs
   * (clients.claim) — ohne globalen Reload liefe jeder NICHT klickende Tab
   * mit altem DOM gegen den neuen Cache. Erst-Claim beim Erstbesuch (vorher
   * kein Controller) löst bewusst keinen Reload aus.
   */
  function wireControllerReload() {
    if (!('serviceWorker' in navigator) || !config.enableServiceWorker) return;
    let hadController = !!navigator.serviceWorker.controller;
    let reloaded = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!hadController) { hadController = true; return; }
      if (reloaded) return;
      reloaded = true;
      window.location.reload();
    });
  }

  /**
   * Offline-Hinweis (Markup in _layouts/default.html). Früher Inline-Skript im Layout,
   * ausgelagert für die CSP ohne 'unsafe-inline'. Einmal beim Laden
   * abgleichen: Liefert der Service Worker die Seite offline aus dem Cache,
   * erscheint der Hinweis sofort, nicht erst beim nächsten Wechsel.
   */
  function wireOfflineNotice() {
    function sync() {
      const note = document.getElementById('offline-notification');
      if (note) note.hidden = navigator.onLine !== false;
    }
    window.addEventListener('online', sync);
    window.addEventListener('offline', sync);
    sync();
  }

  /**
   * Übergang nach dem SPA-Ausbau (Register R-96, kann ab 2026-12-01 entfallen):
   * Die alte SPA-Navigation (bis c19da3f) legte ihre Einträge per pushState
   * im selben Dokument an (State {spa, docId, url}). Wer im alten Stand
   * weiterklickt und per Update-Toast auf den neuen Stand wechselt, hat diese
   * Einträge noch in der History. „Zurück“ springt dann im neuen Dokument nur
   * die URL um, der Inhalt bleibt. Der neue Stand legt selbst keine Einträge
   * an, ein popstate mit anderem Pfad kann also nur aus der alten SPA stammen
   * und lädt die Seite zur URL neu. Reine Anker-Sprünge (TOC, Fußnoten)
   * behalten den Pfad und bleiben unberührt, ebenso die Rückkehr aus dem
   * bfcache (kein popstate).
   */
  function wireLegacySpaHistory() {
    const loadedPath = window.location.pathname;
    window.addEventListener('popstate', (event) => {
      const legacyEntry = event.state && event.state.spa === true;
      if (legacyEntry || window.location.pathname !== loadedPath) {
        window.location.reload();
      }
    });
  }

  // Service Worker registrieren
  wireLegacySpaHistory();
  wireOfflineNotice();
  registerServiceWorker();
  wireUpdateChecks();
  wireControllerReload();
})();