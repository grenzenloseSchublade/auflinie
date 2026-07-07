---
---
/**
 * Service Worker für Offline-Caching
 * 
 * Dieser Service Worker ist verantwortlich für das Caching wichtiger Ressourcen,
 * insbesondere des Hintergrundbildes, um die Ladezeit zu verbessern und
 * Offline-Funktionalität zu ermöglichen.
 */

// Cache-Name mit Build-Version
const CACHE_VERSION = '{{ site.time | date: "%Y%m%d%H%M" }}';
const CACHE_NAME = `kraftstoff-cache-${CACHE_VERSION}`;

// Ressourcen, die beim Installieren des Service Workers gecached werden sollen
// Alle Pfade sind relativ zum Scope des Service Workers (Root der Website)
const CACHE_URLS = [
  './offline.html',
  './assets/js/offline.js',
  './assets/css/main.css',
  './assets/js/greedy-navigation.js',
  './assets/js/hero-crt.js',
  './assets/js/sw-register.js',
  './assets/images/background.jpg',
  './assets/webfonts/fa-solid-900-subset.woff2',
  './assets/webfonts/fa-regular-400-subset.woff2',
  './assets/webfonts/fa-brands-400-subset.woff2'
];

// Installation des Service Workers
self.addEventListener('install', event => {
  // Warten, bis der Cache geöffnet und die Ressourcen hinzugefügt wurden
  // Promise.allSettled ermöglicht fehlertolerantes Caching (einzelne Fehler blockieren nicht)
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return Promise.allSettled(
          CACHE_URLS.map(url => 
            cache.add(url).catch(() => {
              // Einzelne Fehler still ignorieren - Ressource wird später bei Bedarf gecached
            })
          )
        );
      })
  );
});

// Update-Steuerung: Der neue Worker wartet, bis der Nutzer im Update-Toast
// "Jetzt laden" wählt (sw-register.js sendet dann SKIP_WAITING).
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Aktivierung des Service Workers
self.addEventListener('activate', event => {
  // Alte Caches löschen
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Abfangen von Fetch-Requests
self.addEventListener('fetch', event => {
  // Nur GET-Requests behandeln
  if (event.request.method !== 'GET') return;
  
  // Ignoriere Chrome-Extensions und andere externe Requests
  if (!event.request.url.startsWith(self.location.origin)) return;
  
  const url = event.request.url;

  // Navigationen (HTML-Seiten): IMMER frisch vom Server — cache:'reload'
  // umgeht auch den HTTP-Cache des Browsers. Veraltete Seiten aus dem
  // Laufzeit-Cache waren die Ursache der Update-Dauerschleife; der Cache
  // dient nur noch als Offline-Fallback (offline.html).
  if (event.request.mode === 'navigate') {
    event.respondWith(handleNavigation(event.request));
    return;
  }

  // Spezielle Behandlung für Bilder: Cache-First
  if (url.match(/\.(jpg|jpeg|png|gif|webp|ico)$/)) {
    event.respondWith(cacheFirst(event.request));
  }
  // CSS und JS: Network-First — nach einem Deploy kommt sofort die neue
  // Version (stale-while-revalidate lieferte erst die alte aus dem Cache und
  // erzeugte einen Mischzustand aus neuem HTML und altem CSS/JS);
  // der Cache dient nur noch als Offline-Fallback.
  else if (url.match(/\.(css|js)$/)) {
    event.respondWith(networkFirst(event.request));
  }
  // Für alle anderen Ressourcen: Network-First-Strategie
  else {
    event.respondWith(networkFirst(event.request));
  }
});

// Navigationen: frisch oder Offline-Seite.
// WICHTIG: per URL-String fetchen — wird das originale Navigations-Request-
// Objekt wiederverwendet, ignoriert Chromium die cache-Option und bedient
// sich weiter am HTTP-Cache (verifiziert; das war die Update-Dauerschleife).
async function handleNavigation(request) {
  try {
    return await fetch(request.url, { cache: 'reload', credentials: 'same-origin' });
  } catch (error) {
    const offline = await caches.match('./offline.html');
    if (offline) {
      return offline;
    }
    return new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' } });
  }
}

// Cache-First-Strategie für Bilder
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    // Fallback-Bild oder leere Response zurückgeben
    return new Response('Bild nicht verfügbar', { status: 404 });
  }
}

// Network-First-Strategie für andere Ressourcen.
// cache: 'no-cache' zwingt zur Revalidierung beim Server — ohne das bedient
// sich fetch() am HTTP-Cache des Browsers (heuristische Frische), und
// "Network-First" liefert in Wahrheit veraltete Kopien aus.
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request, { cache: 'no-cache' });
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    // Offline-Modus - verwende Cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Fallback für HTML-Seiten (request.mode robuster als Accept-Sniffing;
    // Accept kann null sein -> früher TypeError im Offline-Fall)
    if (request.mode === 'navigate' || (request.headers.get('Accept') || '').includes('text/html')) {
      return caches.match('./offline.html');
    }
    
    return new Response('Ressource nicht verfügbar', { status: 404 });
  }
}

// Nachricht-Event-Handler für explizites Caching von Bildern
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'CACHE_IMAGES') {
    const imageUrls = event.data.images || [];
    if (imageUrls.length > 0) {
      caches.open(CACHE_NAME)
        .then(cache => {
          return Promise.all(
            imageUrls.map(url => {
              // Relativen Pfad zum Basis-URL hinzufügen
              const fullUrl = url.startsWith('/') ? self.location.origin + url : url;
              
              // same-origin für lokale Bilder, cors für externe
              const fetchMode = fullUrl.startsWith(self.location.origin) ? 'same-origin' : 'cors';
              
              return fetch(fullUrl, { mode: fetchMode })
                .then(response => {
                  if (response && response.ok) {
                    cache.put(fullUrl, response);
                    
                    // Benachrichtigung an Client senden
                    if (event.source) {
                      event.source.postMessage({
                        type: 'CACHE_COMPLETE',
                        url: url
                      });
                    }
                  }
                })
                .catch(() => {
                  // Fehler beim Bild-Caching still ignorieren
                });
            })
          );
        });
    }
  }
}); 