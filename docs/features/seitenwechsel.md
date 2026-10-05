# Seitenwechsel per View Transition

Jeder interne Link ist ein normaler Seitenaufruf. Den Eindruck einer
stehenden Kopfzeile erzeugt der Browser selbst über eine Cross-Document View
Transition (STYLEGUIDE ARCH-2, Owner-Entscheidung 4. 10. 2026). Bis zum
5. 10. 2026 tauschte stattdessen `spa-nav.js` den Inhalt clientseitig aus
(Persistent Shell), mit eigenem Lebenszyklus für alle Seiten-Module. Der
Ausbau steht in den Commits `feat(nav)` bis `docs` vom 5. 10. 2026.

## Was der Browser macht

| Browser | Seitenwechsel |
|---|---|
| Chromium 126+, Safari 18.2+ | View Transition: Der alte Masthead-Snapshot bleibt stehen, der Inhalt blendet über, ein offener Drawer gleitet heraus. Mobil von ganz oben bei einem Bereichswechsel dosiert der CRT-Effekt (`docs/features/tv-umschalt.md`). |
| dieselben mit `prefers-reduced-motion: reduce` | View Transition mit Dauer null: Der alte Stand bleibt stehen, bis die neue Seite malen kann, dann harter Schnitt bei stehender Kopfzeile. Kein CRT. |
| Firefox | Normales Laden ohne Übergang. Ein kurzer Moment ohne stehende Kopfzeile ist akzeptiert (ARCH-2). |

Bausteine:

- `assets/_sass/components/_view-transition.scss`: `@view-transition { navigation: auto }` ohne Media-Query-Gate, `view-transition-name: masthead` mit verstecktem neuem Snapshot, Drawer-Exit, CRT-Varianten, am Ende der Reduced-Motion-Gürtel (`animation: none` auf allen VT-Pseudo-Elementen samt `::view-transition`).
- `assets/js/tv-switch.js` (`pageswap`) und `assets/js/head-early.js` (`pagereveal`): Übergabe der Types `crt` und `drawer` über `sessionStorage`.
- `assets/js/greedy-navigation.js`: Ein Klick auf einen Drawer-Link lässt den Drawer für den Snapshot offen, ohne `PageSwapEvent` (Firefox) schließt er selbst (BP-6). Im `pageswap` springt der Burger vom ✕ zurück, `pageshow` mit `persisted` setzt den Drawer nach einer bfcache-Rückkehr zurück.
- `_theme-bridge.scss`: `$intro-transition: none`. Die Theme-Einblendung ließe sonst bei jedem Laden Masthead, Inhalt und Footer neu einblenden. Den Stacking-Kontext, den sie `#main` gab, setzt `layouts/_pages.scss` mit `isolation: isolate` (Z-1).
- Screenreader sagen die neue Seite beim Laden selbst an, `aria-current="page"` kommt aus `_includes/masthead.html`.

## Seiten-Module

Jedes Seiten-Modul ist ein Defer-Skript und ruft am Dateiende `mount()` auf
(STYLEGUIDE 10.2, SPA-1 bis SPA-3). Das DOM steht dann fertig, der Marker
`data-<modul>-mounted` schützt vor doppeltem Laden und dient den Tests.
Aufräumen für einen Seitenwechsel gibt es nicht, das nächste Laden räumt alles
ab. Endlos-Arbeit pausiert bei verdecktem Tab oder außerhalb des Viewports.
Kein `unload`-Listener, er schlösse die Seite vom bfcache aus.

## Prerender, bfcache, Service Worker

- Speculation Rules (`_includes/head/custom.html`, `moderate`) rendern interne
  Ziele vor, außer `/mandelbrot/` und den Drawer-Links (SEO-5, PERF-4). Die View
  Transition läuft auch beim Aktivieren eines Prerenders. CRT-Einschalten,
  Power-Hinweis und Blog-Hinweis warten über `AuflinieUtils.whenActivated`
  auf die Aktivierung.
- Zurück und Vor kommen in Chromium aus dem bfcache, Module laufen ohne
  Remount weiter, MathJax-Formeln stehen schon.
- Der Service Worker beantwortet Navigationen cache-first aus dem
  Voll-Precache, offline unbekannte Seiten mit `offline.html`
  (`tests/sw.spec.js`).

## Tests

`tests/navigation.spec.js` (Module, Navigation, View Transition, Speculation
Rules), `tests/sw.spec.js` (offline), `tests/vendor.spec.js` (MathJax nach
Neuladen und Zurück), Übersicht in `tests/README.md`. Die bfcache-Rückkehr ist
headless nicht prüfbar und unten mit sichtbarem Browser gemessen.

## Messung 5. 10. 2026

Gemessen gegen den Prototyp der Vorbereitung (Stand `c19da3f` ohne
`spa-nav.js`), gleiche Szenen: Start → Über mich, Über mich → Lebenslauf,
Lebenslauf → Mandelbrot, Mandelbrot → Blog, Blog → Beitrag, Zurück, dazu ein
Anker-Link nach `/cv/#sprachen`. Chromium und Firefox mit sichtbarem Browser
unter Xvfb, aufgenommen per `ffmpeg x11grab` mit 50 Bildern je Sekunde
(headless zeigt Chromium falsche Leerbilder), WebKit headless. Server mit
40 ms Latenz für HTML wie GitHub Pages.

| Konfiguration | Bilder ohne Kopfzeile (6 Wechsel) | erste Änderung, Median | Zurück |
|---|---|---|---|
| Chromium Desktop | 0, Prototyp 0 | 220 ms, Prototyp 200 ms | bfcache |
| Chromium Desktop, Service Worker | 0, Prototyp 0 | 220 ms, Prototyp 200 ms | bfcache |
| Chromium Desktop, Reduced Motion | 0, Prototyp 0 | 140 ms, Prototyp 140 ms | bfcache |
| Chromium mobil (Drawer, CRT) | 0, Prototyp 0 | 140 ms, Prototyp 140 ms | bfcache |
| Chromium mobil, Reduced Motion | 0, Prototyp 0 | 100 ms, Prototyp 60 ms | bfcache |
| Firefox Desktop | 0, Prototyp 0 | 240 ms, Prototyp 160 ms | neu geladen |
| Firefox Desktop, Reduced Motion | 0, Prototyp 0 | 140 ms, Prototyp 160 ms | neu geladen |
| Firefox mobil | 0, Prototyp 0 | 80 ms, Prototyp 80 ms | neu geladen |

- Beim Anker-Link zählt die Auswertung in allen Varianten einige Bilder
  „ohne Kopfzeile“ (Chromium 2 bis 4, Firefox 7 bis 13). Die Kontaktbögen
  zeigen dort eine stehende Kopfzeile, die Seite springt nur zur Überschrift.
- Layout-Verschiebung über alle Wechsel in Chromium Desktop 0 statt 0,022 bis
  0,032. Alle Modul-Prüfungen grün (TOC, Chips, Graph-Sheet, MathJax,
  Fraktal-Panels, Back-to-Top, Drawer, Blog-Suche auch nach Zurück, Anker),
  keine Seitenfehler.
- Mobil mit offenem Drawer zeigt der stehende Masthead während des
  CRT-Wechsels den Burger statt des ✕ (Prototyp: ✕ bis zum Ende).
- WebKit headless: View Transition bei jedem Wechsel, Kopfzeile steht.
  Klick auf einen Drawer-Link bis `load` der Zielseite, je 6 Runden, Median:
  1,45 s statt 1,46 s unter Reduced Motion, 2,3 s statt 2,2 s mit Bewegung.
  Die Streuung im Container ohne GPU ist groß (Ausreißer über 4 s in beiden
  Varianten, Register R-87). Ein echter Safari ist ungeprüft.
- Prerender (Chromium, Zeiger über dem Link): `/`, `/about/`, `/cv/` und
  `/posts/` werden vorgerendert und beim Klick aktiviert, die View
  Transition läuft dabei. Das CRT-Einschalten startet 2 bis 4 ms nach der
  Aktivierung, der Power-Hinweis 1,2 s danach, nicht schon im Hintergrund.
  `/mandelbrot/` wird nicht vorgerendert.
