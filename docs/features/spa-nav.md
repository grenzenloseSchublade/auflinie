# Persistent-Shell-Navigation (`spa-nav.js`)

Clientseitiges Content-Swapping: Beim Navigieren zwischen **verdrahteten**
Seiten bleibt die Shell (Masthead, `<head>`, Footer, Skripte) physisch stehen,
und nur `.initial-content` wird ausgetauscht. Der Masthead „lädt" nicht neu —
das ist **DOM-Realität**, kein View-Transition-Trick. Löst insbesondere
Firefox + `prefers-reduced-motion`, wo der frühere VT-basierte „stehende
Header" versagte (voller Reload).

Umgesetzt in [`assets/js/spa-nav.js`](../../assets/js/spa-nav.js) — Vanilla, keine
Dependency, CSP-`'self'`-konform, **progressive enhancement**.

Verwandt: [`tv-umschalt.md`](tv-umschalt.md) (Cross-Document-VT /
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

`isWired(pathname)` in `spa-nav.js` ist die einzige Allowlist. Aktuell (Phase 2):

```js
function isWired(pathname) {
  const p = stripBase(pathname);         // baseurl "/auflinie" bereinigt, null = fremd
  if (p === null) return false;
  if (p === '/' || p === '/about/' || p === '/cv/' || p === '/mandelbrot/') return true;
  return /^\/posts\//.test(p);           // Übersicht, Pagination UND Einzelbeiträge
}
```

Interception nur, wenn **Herkunft UND Ziel** verdrahtet sind. Seiten mit
unbekannten Cross-Origin-Abhängigkeiten fängt zusätzlich `needsFullLoad` ab
(Sicherheitsnetz; MathJax und die Fraktal-Deps sind seit dem Self-Host
same-origin und swappen).

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

Jedes Seiten-Modul registriert sich über `window.spaModule({ name, mount,
teardown })` aus [`spa-module.js`](../../assets/js/spa-module.js) (STYLEGUIDE
SPA-1). Der Helfer verdrahtet `spa:load`, `spa:unload`, `pageshow(persisted)`
und den PE-Fallback, die Regeln 1, 5 und 6 erfüllt er also selbst. Er lädt
sitewide direkt nach `site-utils.js` und vor allen Modulen. `name` dient nur
der Diagnose und den Tests.

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

**Ausnahme Früh-Mount (nur LCP-kritisch, STYLEGUIDE PERF-9):** Das initiale
`spa:load` kommt erst, wenn alle Defer-Skripte bis `spa-nav.js` geladen sind.
`hero-crt.js` setzt das Hero-Bild (LCP) deshalb schon bei der eigenen
Ausführung, über die Option `early: true` von `spaModule`: Zustand
`interactive` und `__spaNavActive` noch nicht gesetzt heißt „erstes Laden,
Defer-Phase“, der Helfer mountet sofort auf `document`. Danach überspringen
das initiale `spa:load` (`detail.initial === true`) und der PE-Fallback den
Mount. Swap-ins, Teardown und `pageshow` bleiben beim Kontrakt. Ein per
Reconcile nachgeladenes Skript sieht `__spaNavActive` und mountet wie jedes
Modul erst auf `spa:load`.

**Ausnahme `mathjax-typeset.js`:** Head-Skript, läuft vor `spa-module.js` und
reagiert nur auf Swaps (Typeset auf `spa:load` mit `initial: false`,
`typesetClear` auf `spa:unload`). Beim Erstaufbau setzt MathJax selbst, PE-
Fallback und `pageshow` hätten nichts zu tun. Die Datei hängt deshalb direkt
an den beiden Events.

### Standard-Skelett

```js
(function () {
  'use strict';
  let controller = null;                     // nur wenn dokumentweite Listener nötig

  function mount(root) {
    const scope = root || document;
    const el = scope.querySelector('DEIN-WURZEL-SELEKTOR');
    if (!el || el.hasAttribute('data-DEIN-mounted')) return;   // fremde Seite / idempotent
    el.setAttribute('data-DEIN-mounted', '');

    if (controller) controller.abort();
    controller = new AbortController();
    const signal = controller.signal;

    // element-scoped: kein signal nötig
    el.addEventListener('click', onClick);
    // dokumentweit: IMMER an das signal
    window.addEventListener('resize', onResize, { signal: signal });
    document.addEventListener('keydown', onKey, { signal: signal });
    // Timer: Callback prüft signal.aborted (SPA-3)
    setTimeout(function () { if (signal.aborted) return; /* … */ }, 100);
  }

  function teardown() { if (controller) { controller.abort(); controller = null; } }

  window.spaModule({ name: 'DEIN-MODUL', mount: mount, teardown: teardown });
})();
```

Vorbilder im Repo: [`back-to-top.js`](../../assets/js/back-to-top.js) (window-Listener
via AbortController), [`blog-search.js`](../../assets/js/blog-search.js) (rein
element-scoped, leerer Teardown), [`hero-crt.js`](../../assets/js/hero-crt.js) /
[`neon-orbit-toggle.js`](../../assets/js/neon-orbit-toggle.js) (Observer/rAF/Timer,
ohne Marker: jeder Mount bricht den alten Controller ab und wirft den Effekt
nach `pageshow` neu an).

`tests/spa-nav.spec.js` prüft je Modul (über `name`) genau einen Mount bei
Erstaufbau und PE-Fallback (auf `/cv/`, `/posts/` und `/mandelbrot/`), beim
Swap von der Startseite nach `/cv/` und bei `pageshow(persisted)` sowie gleich
viele `window`-/`document`-Listener über mehrere Swap-Runden. `blog-notice.js`
lädt nur bei aktivem Blog-Hinweis und fehlt deshalb in den Listen.

---

## ⚠️ Falle: Inline-Skripte in `.initial-content`

Ein `<script>` **innerhalb** von `.initial-content` (z. B. per Layout-Include in
den Content gerendert) wird beim Swap als **inertes Markup** kopiert und läuft
**nicht** erneut. Nur externe `<script src>` werden nachgezogen (siehe
Script-Reconcile). Jede seiten-spezifische Initialisierung muss also entweder in
einer **externen, an `spa:load` gebundenen** Datei liegen oder als solche
umgebaut werden, bevor die Seite verdrahtet wird.

> Beispiel: Die TOC-Initialisierung stand früher als großes Inline-Script in
> [`_includes/toc-wrapper.html`](../../_includes/toc-wrapper.html). Vor dem
> Verdrahten von `/cv/` wanderte sie nach
> [`assets/js/toc.js`](../../assets/js/toc.js), sonst wäre die TOC nach einem
> Swap tot gewesen. STYLEGUIDE SPA-4 sperrt solche Skripte per CI, die CSP
> verbietet ausführbare Inline-Skripte ohnehin (STYLEGUIDE SEC-4).

---

## Was `spa-nav.js` selbst erledigt

- **Script-Reconcile:** injiziert beim Swap die **fehlenden, same-origin**
  `<script src>` der Zielseite (`async=false`, Reihenfolge bleibt); fremde
  Origins werden per Filter nicht geladen (Sicherheitsnetz `needsFullLoad`).
- **Stylesheet-Reconcile:** fehlende same-origin `<link rel=stylesheet>` der
  Zielseite werden VOR den Skripten additiv in den Head gehängt (nie
  entfernt) — deckt die per Seiten-Flag eingebundenen Fraktal-CSS ab.
- **MathJax:** selbst gehostet (`assets/vendor/mathjax*`); `mathjax-config.js`
  (Datei statt Inline, damit der Reconcile sie überträgt) und
  `mathjax-typeset.js` (setzt auf `spa:load` den neuen Inhalt per synchronem
  `MathJax.typeset` + Retry-Muster; `typesetClear` auf `spa:unload`).
  Achtung: die v4.1-Promise-Kette (`startup.promise`/`typesetPromise`) hängt
  in diesem Setup dauerhaft — nicht darauf warten.
- **`<head>`-Diff:** `title`, `meta[description]`, `canonical`, OG-/Twitter-Tags,
  komplette `application/ld+json`. Nie angefasst: CSP-Meta, Favicons,
  `speculationrules`, `pagereveal`-Setter.
- **Aktiv-Marker:** `.current`/`aria-current` auf beiden Nav-Listen nach
  Jekyll-Semantik (exakt oder Präfix) — der Masthead-DOM bleibt stehen.
- **A11y:** Fokus (nur vorwärts) auf `<main id="main">` (**nicht** das
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
| **Speculation Rules** | Alle verdrahteten Ziele (`/`, `/about/`, `/cv/`, `/mandelbrot/`, `/posts/*`) sind aus dem Chromium-Prerender ausgenommen, sie werden geswappt. Prerender bleibt für die übrigen Seiten (Archiv), nie für die versteckten Drawer-Links (`_includes/head/custom.html`). |
| **View-Transition-Kür** | Bewegung erlaubt und `document.startViewTransition` vorhanden (Chromium, Safari, Firefox seit den Same-Document-View-Transitions, geprüft mit Firefox 155 in Playwright): `startViewTransition(mutate)` blendet den Inhalt über. `reduce` oder ohne Support: stiller Instant-Swap. Für die Dauer setzt `spa-nav.js` `html.spa-vt`; CSS `html.spa-vt .masthead { view-transition-name: none }` nimmt den **fixierten** Masthead aus dem Snapshot (sonst versetzt sein Snapshot die Schrift um wenige Pixel). Cross-Document-CRT (ohne `.spa-vt`) bleibt unberührt. |
| **reduced-motion** | JS-Gate `!reduce` + CSS-Gürtel (`@media (prefers-reduced-motion: reduce) { ::view-transition-*{animation:none} }`). |
| **CSP** | Nur `src='self'`-Injektion + Attribut-Mutation + `textContent`-JSON-LD. Kein `eval`/`blob:`/Inline-Style. |

---

## Checkliste: eine neue Seite verdrahten

1. **Skripte inventarisieren** (`_includes/scripts.html` + Inline-Init im Layout/
   Content der Seite). Alles Seiten-spezifische identifizieren.
2. **Inline-Init → externes `spa:load`-Modul** umbauen (siehe Falle oben).
3. **Jedes Modul** über `window.spaModule` registrieren: idempotenter
   `mount`, `teardown` für dokumentweite Ressourcen (`pageshow`-Remount und
   PE-Fallback erledigt der Helfer). Modulname in die Liste der
   Seite in `tests/spa-nav.spec.js` aufnehmen, für eine neue Seite eine Liste
   anlegen und in `SEITEN` eintragen.
4. **Cross-Origin-Abhängigkeiten**: erst self-hosten (Muster `assets/vendor/`,
   siehe MathJax) und die per-Seite-Initialisierung an `spa:load` binden —
   sonst Seite vorerst nicht verdrahten (`needsFullLoad` erzwingt dann von
   selbst den Voll-Reload).
5. **Pfad in `isWired`** aufnehmen.
6. **Testen:** [`tests/spa-nav.spec.js`](../../tests/spa-nav.spec.js) um die
   Seite erweitern (Swap hin und zurück, Interaktion nach Swap, Zahl der
   `mount`-Aufrufe). Die Suite läuft in Chromium, Firefox (mit und ohne
   `reduce`) und WebKit (nur `reduce`, siehe `tests/README.md`). Im echten
   Browser dazu: kein Listener-Leak über N Swaps (`getEventListeners`/
   Heap-Diff), Zurück/Vor, bfcache, Fokus, Offline.

---

## Stand & bekannte Grenzen

Phase 2 ist umgesetzt: CV (Skill-Graph/Chips/Sheet), Mandelbrot
(Fraktal-Panels über `spaModule`, MathJax-Typeset-Hook) und alle
`/posts/`-Seiten swappen. Der Persistent-Shell-Kontrakt liegt sitewide in
`assets/js/spa-module.js`, alle Seiten-Module außer `mathjax-typeset.js`
registrieren sich darüber (seit 4. 10. 2026).

- Same-Doc-CRT-Typen (`crt`/`drawer`) laufen auch auf dem SPA-Pfad
  (tv-switch-Typen in `swap()`). Firefox nimmt denselben Pfad, seit er
  Same-Document-View-Transitions kann, mit `reduce` den stillen Instant-Swap.
- Firefox-Gegentest (4. 10. 2026, headless in Playwright, Firefox 155): Swap,
  Zurück, Rapid-Nav, `spaModule`-Kontrakt, MathJax nach Swap, Drawer, Fokus
  und `inert` grün, mit und ohne `reduce`. Offen im echten Firefox: bfcache,
  Offline, die Optik des stehenden Headers und der Überblendung.
- Scroll-Restore: Position wird laufend (trailing-throttled, 500 ms) in
  `history.state.scrollY` gesichert — Back, Forward und Reload stellen sie
  wieder her; Same-Page-Hash-Traversal swappt nicht, sondern scrollt nur.
- Nicht verdrahtet bleibt nur, was `needsFullLoad` wegen fremder
  Cross-Origin-Deps aussortiert (aktuell: nichts).
