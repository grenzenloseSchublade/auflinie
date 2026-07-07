/**
 * Service Worker Registration Script
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
   * "Jetzt laden" aktiviert den wartenden Worker (SKIP_WAITING) und lädt die
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
        <div class="sw-update-toast__content">
          <p class="sw-update-toast__headline">Neue Version verfügbar</p>
          <p class="sw-update-toast__sub">Seite neu laden, um die Aktualisierung zu nutzen.</p>
        </div>
        <div class="sw-update-toast__actions">
          <button type="button" id="sw-update-dismiss" class="sw-update-toast__ghost">Später</button>
          <button type="button" id="sw-update-reload" class="sw-update-toast__primary">Jetzt laden</button>
        </div>
      </div>
    `;

    document.body.appendChild(toast);
    
    // Event-Listener
    document.getElementById('sw-update-reload').addEventListener('click', () => {
      const waiting = registration && registration.waiting;
      if (waiting) {
        // Genau ein Reload, sobald der neue Worker übernommen hat
        let reloaded = false;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (reloaded) return;
          reloaded = true;
          window.location.reload();
        });
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
    navigator.serviceWorker.getRegistrations()
      .then((regs) => regs.forEach((reg) => reg.unregister()))
      .catch(() => {});

    if (window.caches && caches.keys) {
      caches.keys()
        .then((keys) => keys.forEach((key) => {
          if (key.indexOf('kraftstoff-cache-') === 0) {
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

        if (config.enableServiceWorker !== false) {
          // Bestimme den Pfad zum Root der Website
          const rootPath = getRootPath();
          
          // Service Worker-Pfad relativ zum Root der Website
          const swPath = rootPath + 'service-worker.js';
          
          // Registriere den Service Worker mit dem Scope des Root-Verzeichnisses
          navigator.serviceWorker.register(swPath, { scope: rootPath })
            .then(registration => {
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
              console.error('ServiceWorker-Registrierung fehlgeschlagen:', error);
            });
          
          // Auf Nachrichten vom Service Worker hören
          navigator.serviceWorker.addEventListener('message', event => {
            // Cache-Events werden still behandelt
          });
          
          // Nach kurzer Verzögerung Hintergrundbilder cachen
          setTimeout(() => {
            if (navigator.serviceWorker.controller) {
              // Alle Hintergrundbilder sammeln
              const backgroundImages = Array.from(document.querySelectorAll('[data-background-image]'))
                .map(el => el.getAttribute('data-background-image'))
                .filter(Boolean);
              
              // Globales Hintergrundbild hinzufügen, falls vorhanden
              const globalBackgroundImage = document.documentElement.getAttribute('data-background-image');
              if (globalBackgroundImage) {
                backgroundImages.push(globalBackgroundImage);
              }
              
              // Nachricht an Service Worker senden
              if (backgroundImages.length > 0) {
                navigator.serviceWorker.controller.postMessage({
                  type: 'CACHE_IMAGES',
                  images: backgroundImages
                });
              }
            }
          }, 2000);
        }
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
  
  // Service Worker registrieren
  registerServiceWorker();
})(); 