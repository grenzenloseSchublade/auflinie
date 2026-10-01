---
---
/**
 * Service Worker für Offline-Caching
 * 
 * Dieser Service Worker ist verantwortlich für das Caching wichtiger Ressourcen,
 * insbesondere des Hintergrundbildes, um die Ladezeit zu verbessern und
 * Offline-Funktionalität zu ermöglichen.
 */

// Cache-Name mit Build-Version. Der Präfix grenzt die eigenen Caches ab:
// Alle Pages-Projekte unter grenzenloseSchublade.github.io teilen sich EINEN
// Origin und damit dieselbe CacheStorage. Löschen und Lesen deshalb nur über
// CACHE_PREFIX bzw. CACHE_NAME, nie origin-weit (Security-Audit 10/2026, N1/N2).
const CACHE_VERSION = '{{ site.time | date: "%Y%m%d%H%M" }}';
const CACHE_PREFIX = 'kraftstoff-cache-';
const CACHE_NAME = CACHE_PREFIX + CACHE_VERSION;
// Scope-Pfad (z. B. "/auflinie/") für die Zuständigkeitsprüfung im fetch-Handler
const SCOPE_PATH = new URL(self.registration.scope).pathname;

// Liest ausschließlich aus dem eigenen, aktuellen Cache. caches.match() ohne
// Cache-Namen durchsucht jeden Cache des Origins, also auch die der
// Geschwister-Projekte.
async function matchOwn(request, options) {
  const cache = await caches.open(CACHE_NAME);
  return cache.match(request, options);
}

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
  './assets/js/site-utils.js',
  './assets/js/offline.js',
  './assets/js/greedy-navigation.js',
  './assets/js/hero-crt.js',
  './assets/js/sw-register.js',
  './assets/js/tv-switch.js',
  './assets/js/author-follow.js',
  './assets/js/back-to-top.js',
  './assets/js/neon-orbit-toggle.js',
  './assets/js/spa-nav.js',
  './assets/js/spa-module.js',
  './assets/js/toc.js',
  './assets/js/blog-search.js',
  './assets/js/skill-chips.js',
  './assets/js/skill-graph-data.js',
  './assets/js/skill-graph-sim.js',
  './assets/js/skill-graph.js',
  './assets/js/skill-graph-sheet.js',
  './assets/js/fractal-panel.js',
  './assets/js/fractal-renderer.js',
  './assets/js/fractal-color-utils.js',
  './assets/js/fractal-worker-core.js',
  './assets/js/julia-worker.js',
  './assets/js/mandelbrot-worker.js',
  // MathJax (selbst gehostet; die vielen Font-Range-Dateien laufen über den
  // Runtime-Cache-First-Pfad und sind nach erstem Gebrauch offline verfügbar)
  './assets/js/mathjax-config.js',
  './assets/js/mathjax-typeset.js',
  './assets/vendor/mathjax/tex-chtml.js',
  './assets/vendor/mathjax/input/tex/extensions/noerrors.js',
  './assets/vendor/mathjax/ui/menu.js',
  './assets/vendor/mathjax/a11y/assistive-mml.js',
  './assets/vendor/mathjax-newcm-font/chtml.js',
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
  './assets/webfonts/fa-brands-400-subset.woff2'{% unless site.text_font == "system" %},
  // Textschrift (STYLEGUIDE TYP-13), nur bei text_font: ubuntu
  './assets/webfonts/ubuntu-latin-wght.woff2',
  './assets/webfonts/ubuntu-latin-italic-wght.woff2'{% endunless %}
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
// "Neu laden" wählt (sw-register.js sendet dann SKIP_WAITING).
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Aktivierung des Service Workers
self.addEventListener('activate', event => {
  // Nur eigene Alt-Versionen löschen, fremde Caches des Origins bleiben
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName => cacheName.startsWith(CACHE_PREFIX) && cacheName !== CACHE_NAME)
            .map(cacheName => caches.delete(cacheName))
        );
      })
      .then(() => self.clients.claim())
  );
});

// Abfangen von Fetch-Requests
self.addEventListener('fetch', event => {
  // Nur GET-Requests behandeln
  if (event.request.method !== 'GET') return;
  
  // Nur eigene Requests: gleicher Origin UND unterhalb des eigenen Scopes.
  // startsWith(origin) ließe auch "…github.io.evil.example" durch.
  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin || !requestUrl.pathname.startsWith(SCOPE_PATH)) return;

  const url = event.request.url;

  // Navigationen (HTML-Seiten): cache-first aus dem Voll-Precache, Details
  // siehe handleNavigation. Frische kommt über den SW-Update-Pfad (Toast).
  // X-SPA-Nav: clientseitige Navigation (spa-nav.js) holt die Ziel-HTML per
  // fetch — das ist KEINE 'navigate'-Anfrage, soll aber denselben cache-first-
  // Pfad + Offline-Fallback nutzen wie eine echte Navigation.
  if (event.request.mode === 'navigate' || event.request.headers.get('X-SPA-Nav')) {
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
  let cached = await matchOwn(request, { ignoreSearch: true });
  if (!cached && request.url.split('?')[0].endsWith('/')) {
    // Paginierte Seiten liegen unter .../index.html im Cache (jekyll-paginate-v2
    // schreibt page.url um) — Trailing-Slash-Anfragen darauf zurückfallen lassen
    cached = await matchOwn(request.url.split('?')[0] + 'index.html');
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
    // GitHub Pages leitet /about auf /about/ um (301). Eine umgeleitete
    // Antwort auf eine echte Navigation wertet der Browser als Netzwerkfehler
    // (Fetch-Spec, redirect mode "manual") -> Umleitung explizit weiterreichen.
    if (response.redirected && request.mode === 'navigate') {
      return Response.redirect(response.url, 301);
    }
    return response;
  } catch (error) {
    const offline = await matchOwn('./offline.html');
    if (offline) {
      return offline;
    }
    return new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' } });
  }
}

// Cache-First-Strategie für Bilder
async function cacheFirst(request) {
  const cachedResponse = await matchOwn(request);
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
    const cachedResponse = await matchOwn(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Fallback für HTML-Seiten (request.mode robuster als Accept-Sniffing;
    // Accept kann null sein -> früher TypeError im Offline-Fall)
    if (request.mode === 'navigate' || (request.headers.get('Accept') || '').includes('text/html')) {
      return matchOwn('./offline.html');
    }
    
    return new Response('Ressource nicht verfügbar', { status: 404 });
  }
}
