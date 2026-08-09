# Persistent-Shell-Navigation (`spa-nav.js`)

Clientseitiges Content-Swapping: Beim Navigieren zwischen **verdrahteten**
Seiten bleibt die Shell (Masthead, `<head>`, Footer, Skripte) physisch stehen,
und nur `.initial-content` wird ausgetauscht. Der Masthead „lädt" nicht neu —
das ist **DOM-Realität**, kein View-Transition-Trick. Löst insbesondere
Firefox + `prefers-reduced-motion`, wo der frühere VT-basierte „stehende
Header" versagte (voller Reload).

Umgesetzt in [`assets/js/spa-nav.js`](assets/js/spa-nav.js) — Vanilla, keine
Dependency, CSP-`'self'`-konform, **progressive enhancement**.

Verwandt: [`README-tv-umschalt.md`](README-tv-umschalt.md) (Cross-Document-VT /
CRT — bleibt als Kür erhalten und ist von diesem Fundament unabhängig).

---

## Grundprinzip: streng additiv

Das Fundament ist ein **Enhancement über einer normalen MPA**. Fehlt eine
Voraussetzung oder greift eine Zweifelsregel, passiert die **ganz normale
volle Navigation**. Ohne JavaScript funktioniert die Seite unverändert
(server-seitiger Aktiv-Marker, echte `<a href>`).

Ein voller Reload (statt Swap) tritt immer ein bei:

- Herkunft **oder** Ziel nicht im Wired-Set
- Modifier-/Mittelklick (`ctrl/meta/shift/alt`, `button ≠ 0`), `target ≠ _self`,
  `download`, `rel="external"`, `data-no-swap`
- cross-origin, non-http(s)
- `!res.ok`, falscher Content-Type, Ziel-HTML ohne `.initial-content`
- Redirect nach extern
- Fetch-/Parse-Fehler
- fehlende Browser-Fähigkeit (`fetch`, `history`, `DOMParser`, `Promise`, `Set`)
- fremder / bfcache-restaurierter History-Eintrag (siehe *History*)

---

## Wired-Set: welche Seiten geswappt werden

`isWired(pathname)` in `spa-nav.js` ist die einzige Allowlist. Aktuell (Phase 1):

```js
function isWired(pathname) {
  var p = stripBase(pathname);           // baseurl "/auflinie" bereinigt
  if (p === '/' || p === '/about/') return true;
  return /^\/posts\/(page\d+\/)?$/.test(p);   // Blog-Übersicht + Pagination
}
```

Interception nur, wenn **Herkunft UND Ziel** verdrahtet sind — das Verlassen
einer nicht-verdrahteten Seite (CV, Mandelbrot, Einzelbeitrag) ist immer ein
voller Reload und schützt deren Live-State.

Eine Seite verdrahten heißt: ihren Pfad in `isWired` aufnehmen **und** alle
ihre Seiten-Skripte an den Lifecycle-Kontrakt binden (unten). Reihenfolge nicht
vertauschen — siehe Checkliste.

---

## Der Lifecycle-Kontrakt

Zwei Events am `document` (überleben Swaps, weil sie am Shell-`document` hängen):

```
document → 'spa:unload'  detail: { root }               // VOR dem Wipe der alten .initial-content
document → 'spa:load'    detail: { root, url, initial }  // NACH Content + Script-Reconcile
```

- `detail.root` = die (neue) `.initial-content`. `initial: true` beim allerersten
  `spa:load` (Erstaufbau nach `DOMContentLoaded`), sonst `false`.
- `spa:load` feuert **erst nachdem** fehlende Seiten-Skripte injiziert und
  geladen sind — ein Modul, dessen `<script>` die Zielseite erst mitbringt, ist
  zum `spa:load`-Zeitpunkt garantiert vorhanden.

### Regeln für jedes Seiten-Modul

1. **Auf `spa:load` mounten.** `detail.root` nach dem eigenen Wurzel-Selektor
   absuchen; **fehlt er → sofort raus** (idempotenter No-Op auf fremden Seiten).
2. **Idempotent.** Doppel-`mount` (initial + PE-Fallback, oder `pageshow`) darf
   nicht doppelt initialisieren — Marker-Attribut auf dem Wurzelknoten.
3. **Teardown auf `spa:unload`** für **dokument-/fensterweite** Ressourcen:
   `window`/`document`-Listener, `requestAnimationFrame`, `setTimeout/Interval`,
   `ResizeObserver`/`IntersectionObserver` (`.disconnect()`), `Worker`
   (`.terminate()`). Am einfachsten alles über **einen `AbortController`** +
   `{ signal }` bündeln und im Teardown `.abort()`.
4. **Element-scoped Listener** (auf Knoten **innerhalb** `.initial-content`)
   brauchen **keinen** Teardown — sie sterben mit dem alten DOM.
5. **`pageshow(persisted)` → erneut mounten** (bfcache-Rückkehr feuert kein
   `spa:load`; idempotenz-Marker verhindert Doppel-Init).
6. **PE-Fallback:** läuft nur, wenn das Fundament **nicht** aktiv ist
   (`!window.__spaNavActive`), damit die Seite auch ohne `spa-nav.js` bootet.
   Prüfung erst zur `DOMContentLoaded`/`complete`-Zeit — `spa-nav.js` ist das
   **letzte** `defer`-Skript und setzt `__spaNavActive` erst dann.

### Standard-Skelett

```js
(function () {
  'use strict';
  var controller = null;                     // nur wenn dokumentweite Listener nötig

  function mount(root) {
    var scope = root || document;
    var el = scope.querySelector('DEIN-WURZEL-SELEKTOR');
    if (!el || el.hasAttribute('data-DEIN-init')) return;   // fremde Seite / idempotent
    el.setAttribute('data-DEIN-init', '');

    if (controller) controller.abort();
    controller = new AbortController();
    var signal = controller.signal;

    // element-scoped: kein signal nötig
    el.addEventListener('click', onClick);
    // dokumentweit: IMMER an das signal
    window.addEventListener('resize', onResize, { signal: signal });
    document.addEventListener('keydown', onKey, { signal: signal });
  }

  function teardown() { if (controller) { controller.abort(); controller = null; } }

  document.addEventListener('spa:load', function (e) { mount(e.detail && e.detail.root); });
  document.addEventListener('spa:unload', teardown);
  window.addEventListener('pageshow', function (e) { if (e.persisted) mount(document); });

  function peFallback() { if (!window.__spaNavActive) mount(document); }
  if (document.readyState === 'complete') peFallback();
  else document.addEventListener('DOMContentLoaded', peFallback);
})();
```

Vorbilder im Repo: [`back-to-top.js`](assets/js/back-to-top.js) (window-Listener
via AbortController), [`blog-search.js`](assets/js/blog-search.js) (rein
element-scoped, kein Teardown), [`hero-crt.js`](assets/js/hero-crt.js) /
[`neon-orbit-toggle.js`](assets/js/neon-orbit-toggle.js) (Observer/rAF/Timer +
`pageshow`-Remount).

---

## ⚠️ Falle: Inline-Skripte in `.initial-content`

Ein `<script>` **innerhalb** von `.initial-content` (z. B. per Layout-Include in
den Content gerendert) wird beim Swap als **inertes Markup** kopiert und läuft
**nicht** erneut. Nur externe `<script src>` werden nachgezogen (siehe
Script-Reconcile). Jede seiten-spezifische Initialisierung muss also entweder in
einer **externen, an `spa:load` gebundenen** Datei liegen oder als solche
umgebaut werden, bevor die Seite verdrahtet wird.

> Konkret offen: die TOC-Initialisierung in
> [`_includes/toc-wrapper.html`](_includes/toc-wrapper.html) ist ein großes
> Inline-Script — es muss vor dem Verdrahten von `/cv/` in ein `spa:load`-Modul
> überführt werden (sonst TOC nach Swap tot). Siehe Task „CV verdrahten".

---

## Was `spa-nav.js` selbst erledigt

- **Script-Reconcile:** injiziert beim Swap die **fehlenden, same-origin**
  `<script src>` der Zielseite (`async=false`, Reihenfolge bleibt); jsdelivr
  (MathJax etc.) wird per Origin-Filter **nicht** hier geladen — solche Seiten
  bleiben Phase 2.
- **`<head>`-Diff:** `title`, `meta[description]`, `canonical`, OG-/Twitter-Tags,
  komplette `application/ld+json`. Nie angefasst: CSP-Meta, Favicons,
  `speculationrules`, `pagereveal`-Setter.
- **Aktiv-Marker:** `.current`/`aria-current` auf beiden Nav-Listen nach
  Jekyll-Semantik (exakt oder Präfix) — der Masthead-DOM bleibt stehen.
- **A11y:** Fokus (nur vorwärts) auf `#main[role=main]` (**nicht** das
  dekorative Neon-Hero-`h1`); Route-Ansage über die Live-Region
  `#spa-route-announcer` (`role=status`, vor dem Setzen geleert).
- **History:** `scrollRestoration='manual'` + `docId`-markierte States **nur** auf
  wired Seiten; `popstate` swappt nur bei eigenem `docId`; bfcache-Guard über
  `pageshow(persisted)`. Programmatischer Scroll immer `behavior:'auto'`
  (respektiert reduced-motion).
- **Prefetch bei Absicht:** `pointerover`/`focusin`/`touchstart` wärmen wired
  Ziele über denselben `X-SPA-Nav`-fetch in den Cache (einmal pro URL,
  respektiert Save-Data/2g) — macht den Swap auch in Firefox quasi-instant.

---

## Interop

| Subsystem | Regel |
|---|---|
| **Service Worker** | Swap-/Prefetch-fetch trägt Header `X-SPA-Nav`; das navigate-Gate in `service-worker.js` leitet ihn auf `handleNavigation` (cache-first + `offline.html`). Same-origin + Custom-Header ⇒ kein Preflight. `spa-nav.js` ist im Precache. |
| **Speculation Rules** | `/` und `/about/*` sind aus dem Chromium-Prerender ausgenommen (werden geswappt). Beiträge/CV/Archiv behalten Prerender. |
| **View-Transition-Kür** | Chromium + Bewegung: `document.startViewTransition(mutate)` blendet den Inhalt über. Firefox / `reduce`: stiller Instant-Swap. Für die Dauer setzt `spa-nav.js` `html.spa-vt`; CSS `html.spa-vt .masthead { view-transition-name: none }` nimmt den **fixierten** Masthead aus dem Snapshot (sonst versetzt sein Snapshot die Schrift um wenige Pixel). Cross-Document-CRT (ohne `.spa-vt`) bleibt unberührt. |
| **reduced-motion** | JS-Gate `!reduce` + CSS-Gürtel (`@media (prefers-reduced-motion: reduce) { ::view-transition-*{animation:none} }`). |
| **CSP** | Nur `src='self'`-Injektion + Attribut-Mutation + `textContent`-JSON-LD. Kein `eval`/`blob:`/Inline-Style. |

---

## Checkliste: eine neue Seite verdrahten

1. **Skripte inventarisieren** (`_includes/scripts.html` + Inline-Init im Layout/
   Content der Seite). Alles Seiten-spezifische identifizieren.
2. **Inline-Init → externes `spa:load`-Modul** umbauen (siehe Falle oben).
3. **Jedes Modul** auf den Kontrakt bringen: idempotenter `mount`, `teardown`
   für dokumentweite Ressourcen, `pageshow`-Remount, PE-Fallback.
4. **jsdelivr-Abhängigkeiten** (MathJax, CDN-CSS): beim Swap gezielt nachziehen
   und initialisieren (Reconcile lädt nur same-origin) — sonst Seite vorerst
   nicht verdrahten.
5. **Pfad in `isWired`** aufnehmen.
6. **Im echten Browser testen** (headless hier nicht möglich): Swap hin/zurück,
   Interaktion nach Swap, kein Listener-Leak über N Swaps (`getEventListeners`/
   Heap-Diff), Zurück/Vor, bfcache, Fokus, Offline, `reduce` + Firefox.

---

## Bekannte Grenzen / Phase 2

- Interaktive Seiten (CV: Skill-Graph/Chips + TOC; Mandelbrot: WebGL/Worker/
  MathJax; Einzelbeiträge) sind noch **nicht** verdrahtet → voller Reload.
- Same-Doc-CRT-Typen (`crt`/`drawer`) sind noch nicht auf den SPA-Pfad portiert
  (nur Default-Crossfade als Kür).
- Scroll-Restore sichert die ausgehende Position nur beim Vorwärts-Push.
