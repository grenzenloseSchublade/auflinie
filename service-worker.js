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

// Ressourcen, die beim Installieren des Service Workers gecached werden.
// App-Shell-Voll-Precache: ALLE Seiten + Assets — Seitenwechsel sind danach
// netzunabhängig; Frische kommt über den SW-Update-Pfad (Browser prüft
// service-worker.js bei Navigationen, GH-Pages max-age=600 ⇒ ≤10 min Verzug,
// dann Update-Toast). Die Seitenliste wird aus Jekyll generiert und wächst mit.
const CACHE_URLS = [
  // Seiten
{% assign nav_pages = site.html_pages | where_exp: "p", "p.sitemap != false" %}{% for p in nav_pages %}{% unless p.url contains "404" %}  '.{{ p.url }}',
{% endunless %}{% endfor %}{% for post in site.posts %}  '.{{ post.url }}',
{% endfor %}  './404.html',
  './offline.html',
  // Styles/Skripte
  './assets/css/main.css',
  './assets/js/offline.js',
  './assets/js/greedy-navigation.js',
  './assets/js/hero-crt.js',
  './assets/js/sw-register.js',
  './assets/js/tv-switch.js',
  './assets/js/author-follow.js',
  './assets/js/back-to-top.js',
  './assets/js/neon-orbit-toggle.js',
  './assets/js/blog-search.js',
  './assets/js/skill-chips.js',
  './assets/js/skill-graph-sim.js',
  './assets/js/skill-graph.js',
  './assets/js/fractal-panel.js',
  './assets/js/fractal-renderer.js',
  './assets/js/fractal-color-utils.js',
  './assets/js/julia-worker.js',
  './assets/js/mandelbrot-worker.js',
  // Vendor (vormals CDN)
  './assets/vendor/nouislider.min.js',
  './assets/vendor/nouislider.min.css',
  './assets/vendor/tom-select.complete.min.js',
  './assets/vendor/tom-select.css',
  './assets/vendor/gumshoe.min.js',
  // Sonstiges
  './assets/images/background.jpg',
  './assets/images/mandelbrot-preview.jpg',
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
            // cache: 'reload' — direkt vom Server, nie aus dem HTTP-Cache:
            // der neue versionierte Cache darf keine alten Kopien enthalten
            cache.add(new Request(url, { cache: 'reload' })).catch(() => {
              // Einzelne Fehler still ignorieren - Netz-Fallback greift zur Laufzeit
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
  if (url.match(/\.(jpg|jpeg|png|gif|webp|ico|woff2?)$/)) {
    event.respondWith(cacheFirst(event.request));
  }
  // CSS und JS: Cache-First — alles ist precached und friert pro Build ein
  // (Versionskonsistenz mit dem cache-first-HTML); Updates kommen als
  // Ganzes über den neuen Worker
  else if (url.match(/\.(css|js)$/)) {
    event.respondWith(cacheFirst(event.request));
  }
  // Für alle anderen Ressourcen: Network-First-Strategie
  else {
    event.respondWith(networkFirst(event.request));
  }
});

// Navigationen: CACHE-FIRST aus dem Voll-Precache — der frühere
// no-cache-Roundtrip kostete mobil Sekunden (SW-Kaltstart + RTT seriell).
// Bewusst OHNE Hintergrund-Revalidierung: neues HTML im alten Cache würde
// Versionen mischen; Frische liefert der SW-Update-Pfad (Toast).
// Cache-Miss (z.B. Paginierung): Netz + Nachcache; offline: offline.html.
// fetch per URL-String — Chromium ignoriert die cache-Option beim
// wiederverwendeten Navigations-Request-Objekt (verifiziert).
async function handleNavigation(request) {
  let cached = await caches.match(request, { ignoreSearch: true });
  if (!cached && request.url.split('?')[0].endsWith('/')) {
    // Paginierte Seiten liegen unter .../index.html im Cache (jekyll-paginate-v2
    // schreibt page.url um) — Trailing-Slash-Anfragen darauf zurückfallen lassen
    cached = await caches.match(request.url.split('?')[0] + 'index.html');
  }
  if (cached) {
    return cached;
  }
  try {
    const response = await fetch(request.url, { cache: 'no-cache', credentials: 'same-origin' });
    if (response.ok && !response.redirected) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request.url.split('?')[0], response.clone());
    }
    return response;
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