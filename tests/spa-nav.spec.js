// Regressionstests für die Persistent-Shell-Navigation (spa-nav.js).
// Nageln die "bricht-nichts"-Invarianten fest — siehe docs/features/spa-nav.md.
// Ausführen: siehe playwright.config.js / tests/README.md.
//
// Trick zum Erkennen "Swap vs. Voll-Reload": ein Marker am window. Ein
// Same-Document-Swap lässt window bestehen (Marker überlebt); ein echter
// Voll-Reload verwirft window (Marker weg).
const { test, expect } = require('@playwright/test');

const BASE = '/auflinie'; // site.baseurl

async function gotoHome(page) {
  await page.goto(`${BASE}/`);
  await page.waitForFunction(() => window.__spaNavActive === true, null, { timeout: 7000 });
  await page.evaluate(() => { window.__navTest = true; });
}
function survivedSwap(page) {
  return page.evaluate(() => window.__navTest === true);
}

test.describe('Persistent-Shell-Navigation — Non-Breaking-Invarianten', () => {
  test('verdrahteter Link swappt (kein Voll-Reload, Aktiv-Marker wandert)', async ({ page }) => {
    await gotoHome(page);

    await page.click('.greedy-nav .visible-links a[href$="/about/"]');
    await expect(page).toHaveURL(new RegExp(`${BASE}/about/?$`));
    expect(await survivedSwap(page)).toBe(true);                 // window überlebte -> Swap
    await expect(page.locator('.greedy-nav a[href$="/about/"]').first()).toHaveClass(/current/);
    // Masthead-Node ist noch da (Shell steht)
    await expect(page.locator('.masthead')).toBeVisible();
  });

  test('nicht-verdrahteter Link (Archiv) macht Voll-Reload', async ({ page }) => {
    await gotoHome(page);

    // Seit Phase 2 ist Mandelbrot verdrahtet (spa-nav.js, isWired). Das Archiv
    // gehört nicht zum Wired-Set und lädt daher voll neu.
    await page.click('.page__footer a[href$="/archiv/"]');
    await expect(page).toHaveURL(new RegExp(`${BASE}/archiv/?`));
    expect(await survivedSwap(page)).toBe(false);                // window frisch -> Voll-Reload
  });

  test('verdrahteter Link (Mandelbrot) swappt seit Phase 2', async ({ page }) => {
    await gotoHome(page);
    await page.click('.greedy-nav a[href*="/mandelbrot/"]');
    await expect(page).toHaveURL(new RegExp(`${BASE}/mandelbrot/?`));
    expect(await survivedSwap(page)).toBe(true);
  });

  test('Modifier-Klick (Ctrl/Meta) fängt der Swap NICHT ab', async ({ page, context }) => {
    await gotoHome(page);
    const modifier = process.platform === 'darwin' ? 'Meta' : 'Control';
    await page.click('.greedy-nav .visible-links a[href$="/about/"]', { modifiers: [modifier] });
    // Der Marker bleibt, weil KEIN In-Page-Swap passierte (neuer Tab/Default)
    expect(await survivedSwap(page)).toBe(true);
    await expect(page).toHaveURL(new RegExp(`${BASE}/$`));       // aktuelle Seite unverändert
  });

  test('Zurück nach Swap stellt die vorige Seite wieder her', async ({ page }) => {
    await gotoHome(page);
    await page.click('.greedy-nav .visible-links a[href$="/about/"]');
    await expect(page).toHaveURL(new RegExp(`${BASE}/about/?$`));
    await page.goBack();
    await expect(page).toHaveURL(new RegExp(`${BASE}/$`));
  });

  test('Rapid-Nav: Single-Flight, kein Overlap, spa:load/unload balanciert', async ({ page }) => {
    await gotoHome(page);

    // Lifecycle-Zähler ab JETZT scharf schalten (initiales spa:load ist schon durch).
    await page.evaluate(() => {
      window.__spaLoads = [];
      window.__spaUnloads = [];
      document.addEventListener('spa:load', (e) => window.__spaLoads.push(e.detail && e.detail.url));
      document.addEventListener('spa:unload', () => window.__spaUnloads.push(1));
    });

    // WebKit (Linux-Build von Playwright) bricht unter Last gelegentlich den
    // Abruf des zweiten Ziels mit einem internen Fehler ab, wenn der erste
    // gerade abgebrochen wurde. spa-nav.js lädt dann wie vorgesehen voll nach
    // (Fallback-Leitplanke). Der Fall ist dann kein Befund der Seite. Gezählt
    // wird nur dieser Fehler, nur ab den Klicks und nur am Swap-Abruf eines
    // der beiden Ziele (Kopfzeile X-SPA-Nav), sonst greift der Skip nicht.
    const engineErrors = [];
    page.on('requestfailed', (req) => {
      const text = (req.failure() || {}).errorText || '';
      if (text !== 'WebKit encountered an internal error') return;
      if (req.headers()['x-spa-nav'] !== '1') return;
      if (!new RegExp(`^${BASE}/(about|cv)/?$`).test(new URL(req.url()).pathname)) return;
      engineErrors.push(req.url());
    });

    // Zwei verdrahtete Ziele im SELBEN Tick anklicken -> maximale Überlappung
    // (die zweite Navigation überholt die erste, bevor deren Fetch resolvt).
    await page.evaluate(() => {
      var a = document.querySelector('.greedy-nav a[href$="/about/"]');
      var c = document.querySelector('.greedy-nav a[href$="/cv/"]');
      if (a) a.click();
      if (c) c.click();
    });

    // Endzustand = zuletzt geklicktes Ziel (CV), kein Voll-Reload (alles wired).
    await expect(page).toHaveURL(new RegExp(`${BASE}/cv/?$`));
    test.skip(engineErrors.length > 0, `interner WebKit-Netzfehler: ${engineErrors.join(', ')}`);
    expect(await survivedSwap(page)).toBe(true);

    // Warten, bis das spa:load des Endziels da ist (statt fester Wartezeit:
    // WebKit und Firefox malen im Container ohne GPU nur wenige Bilder pro
    // Sekunde, die View Transition wartet auf ein Bild), danach etwaige
    // pending-Drainage settlen lassen
    await expect.poll(() => page.evaluate(() => window.__spaLoads[window.__spaLoads.length - 1] || ''))
      .toMatch(new RegExp(`${BASE}/cv/?$`));
    await page.waitForTimeout(600);

    const { loads, unloads, lastLoad } = await page.evaluate(() => ({
      loads: window.__spaLoads.length,
      unloads: window.__spaUnloads.length,
      lastLoad: window.__spaLoads[window.__spaLoads.length - 1]
    }));

    // Jeder committete Swap = genau 1 unload + 1 load -> perfekt balanciert,
    // egal ob nur CV oder About+CV committeten. Keine verwaisten Lifecycle-Events.
    expect(loads).toBe(unloads);
    expect(loads).toBeGreaterThanOrEqual(1);
    // Das LETZTE spa:load gehört zum Endziel — kein stale finishSwap mit falscher URL.
    expect(lastLoad).toMatch(new RegExp(`${BASE}/cv/?$`));
  });

  test('ohne JS bleibt die Navigation nativ (Progressive Enhancement)', async ({ browser }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/`);
    await page.click('.greedy-nav .visible-links a[href$="/about/"]');
    await expect(page).toHaveURL(new RegExp(`${BASE}/about/?$`));  // echte Navigation
    await ctx.close();
  });
});


// spaModule-Kontrakt (spa-module.js, STYLEGUIDE SPA-1, SPA-6): jedes über
// window.spaModule registrierte Modul mountet beim Erstaufbau genau EINMAL.
// Mit spa-nav.js über das initiale spa:load (root = .initial-content), ohne
// spa-nav.js über den PE-Fallback (root = document). Ausnahme ist der
// Früh-Mount von hero-crt.js (Option early, PERF-9): Er mountet in beiden
// Fällen einmal auf document, das initiale spa:load überspringt ihn. Ein
// Init-Skript fängt die Zuweisung von window.spaModule ab und protokolliert
// je Modul (Option name) die mount-Aufrufe.
async function trackSpaModuleMounts(page) {
  await page.addInitScript(() => {
    window.__spaMounts = [];
    let impl;
    Object.defineProperty(window, 'spaModule', {
      configurable: true,
      get() { return impl; },
      set(fn) {
        impl = function (opts) {
          const entry = { name: opts.name || '?', calls: [] };
          window.__spaMounts.push(entry);
          const mount = opts.mount;
          return fn(Object.assign({}, opts, {
            mount(root) {
              entry.calls.push(root === document ? 'document' : (root && root.className) || String(root));
              return mount(root);
            },
          }));
        };
      },
    });
  });
}
const spaMounts = (page) => page.evaluate(() => window.__spaMounts);

// Seiten-Module je Seite (Stand _includes/scripts.html und after_footer_scripts).
// Zusammen decken Startseite, /cv/, /posts/ und /mandelbrot/ jedes Modul ab,
// das ein gebautes Seiten-Template lädt. blog-notice.js lädt nur mit
// blog_notice.enabled im Front Matter von /posts/ und fehlt deshalb, solange
// kein Hinweis aktiv ist.
const HOME_MODULES = ['author-follow', 'back-to-top', 'hero-crt', 'neon-orbit-toggle'];
const CV_MODULES = ['author-follow', 'back-to-top', 'hero-crt', 'skill-chips', 'skill-graph',
  'skill-graph-sheet', 'toc'];
const POSTS_MODULES = ['author-follow', 'back-to-top', 'blog-search', 'hero-crt'];
const MANDELBROT_MODULES = ['author-follow', 'back-to-top', 'fractal-panel', 'hero-crt', 'toc'];
const SEITEN = [['/cv/', CV_MODULES], ['/posts/', POSTS_MODULES], ['/mandelbrot/', MANDELBROT_MODULES]];
const EARLY_MODULES = ['hero-crt'];
const ersterMount = (name) => (EARLY_MODULES.includes(name) ? 'document' : 'initial-content');

function mountsByName(mounts) {
  const names = mounts.map((m) => m.name);
  expect(new Set(names).size).toBe(names.length);               // kein Modul doppelt registriert
  return Object.fromEntries(mounts.map((m) => [m.name, m.calls]));
}

test.describe('spaModule-Kontrakt — genau ein Mount pro Modul', () => {
  for (const [pfad, module] of SEITEN) {
    test(`Erstaufbau ${pfad} mit spa-nav.js: nur das initiale spa:load mountet`, async ({ page }) => {
      await trackSpaModuleMounts(page);
      await page.goto(`${BASE}${pfad}`);
      await page.waitForFunction(() => window.__spaNavActive === true, null, { timeout: 7000 });
      await page.waitForTimeout(300);
      const byName = mountsByName(await spaMounts(page));
      expect(Object.keys(byName).sort()).toEqual(module);
      for (const name of module) expect(byName[name], name).toEqual([ersterMount(name)]);
    });

    test(`${pfad} ohne spa-nav.js: der PE-Fallback mountet einmal auf document`, async ({ page }) => {
      await trackSpaModuleMounts(page);
      await page.route('**/assets/js/spa-nav.js', (route) => route.abort());
      await page.goto(`${BASE}${pfad}`);
      await page.waitForTimeout(300);
      expect(await page.evaluate(() => window.__spaNavActive)).toBeFalsy();
      const byName = mountsByName(await spaMounts(page));
      expect(Object.keys(byName).sort()).toEqual(module);
      for (const name of module) expect(byName[name], name).toEqual(['document']);
    });
  }

  test('Swap: neue Modul-Skripte mounten einmal, vorhandene einmal je spa:load', async ({ page }) => {
    await trackSpaModuleMounts(page);
    await gotoHome(page);
    const home = mountsByName(await spaMounts(page));
    expect(Object.keys(home).sort()).toEqual(HOME_MODULES);
    for (const name of HOME_MODULES) expect(home[name], name).toEqual([ersterMount(name)]);

    await page.click('.greedy-nav .visible-links a[href$="/cv/"]');
    await expect(page).toHaveURL(new RegExp(`${BASE}/cv/?$`));
    expect(await survivedSwap(page)).toBe(true);
    await expect.poll(async () => (await spaMounts(page)).length).toBeGreaterThan(HOME_MODULES.length);
    await page.waitForTimeout(300);
    const byName = mountsByName(await spaMounts(page));         // Reconcile lädt nichts doppelt
    for (const name of CV_MODULES) expect(byName[name], name).toBeDefined();
    for (const name of Object.keys(byName)) {
      const vorher = home[name] || [];                           // neu nachgeladen: kein Mount vor dem Swap
      expect(byName[name], name).toEqual([...vorher, 'initial-content']);
    }
  });

  test('bfcache-Rückkehr (pageshow persisted): ein Mount je Modul, idempotent', async ({ page }) => {
    await trackSpaModuleMounts(page);
    await page.goto(`${BASE}/cv/`);
    await page.waitForFunction(() => window.__spaNavActive === true, null, { timeout: 7000 });
    await page.waitForTimeout(300);
    const vorher = mountsByName(await spaMounts(page));
    // Ein echter bfcache-Restore lässt sich headless nicht zuverlässig
    // erzwingen. Das Ereignis ist dasselbe: pageshow mit persisted = true.
    await page.evaluate(() => {
      window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }));
    });
    const byName = mountsByName(await spaMounts(page));
    for (const name of CV_MODULES) expect(byName[name], name).toEqual([...vorher[name], 'document']);
    // Idempotent: das Folgen-Dropdown hat genau einen Klick-Listener, ein
    // doppelt gebundener Toggle klappte sofort wieder zu.
    const offen = await page.evaluate(() => {
      const btn = document.querySelector('.author__urls-wrapper button');
      btn.click();
      return btn.getAttribute('aria-expanded');
    });
    expect(offen).toBe('true');
  });
});

// Teardown (STYLEGUIDE SPA-3): Nach jedem Swap hängen an window und
// document wieder gleich viele Listener. Ein Modul, das dokumentweite
// Listener nicht abräumt, stapelte sie je Besuch. Gezählt über das
// Chrome-DevTools-Protokoll, Stand jeweils auf /about/ nach einer Runde
// über /cv/ und die Startseite (alle Module schon einmal geladen).
// Grenze: Module, die im mount den alten Controller abbrechen und auf
// /about/ wieder mounten (author-follow, back-to-top), räumen dort auch
// ohne Teardown auf. Ein leerer Teardown fällt nur bei Modulen auf, die
// /about/ nicht lädt (Probe: toc.js mit leerem Teardown, window 44 → 48).
test.describe('Teardown — kein Listener-Leck über Swaps', () => {
  test('Listener an window und document bleiben über drei Runden gleich', async ({ page }) => {
    await gotoHome(page);
    const cdp = await page.context().newCDPSession(page);
    async function listenerCounts() {
      const counts = {};
      for (const expr of ['window', 'document']) {
        const { result } = await cdp.send('Runtime.evaluate', { expression: expr });
        const { listeners } = await cdp.send('DOMDebugger.getEventListeners', { objectId: result.objectId });
        counts[expr] = listeners.length;
      }
      return counts;
    }
    async function runde() {
      for (const ziel of ['/cv/', '/about/', '/', '/about/']) {
        const geladen = page.evaluate(() => new Promise((resolve) => {
          document.addEventListener('spa:load', () => resolve(), { once: true });
        }));
        await page.locator(`.greedy-nav a[href="${BASE}${ziel}"]`).first().click();
        await geladen;
        await page.waitForTimeout(200);
      }
      expect(await survivedSwap(page)).toBe(true);
    }
    await runde();
    const nachRunde1 = await listenerCounts();
    await runde();
    await runde();
    expect(await listenerCounts()).toEqual(nachRunde1);
  });
});

// Reduced Motion (STYLEGUIDE BEW-1a): Der Swap fragt die Einstellung über
// AuflinieUtils.prefersReducedMotion ab. Mit Bewegung blendet eine View
// Transition über, unter „reduce“ tauscht er still.
test.describe('Reduced Motion beim Swap', () => {
  for (const [reducedMotion, erwartet] of [['no-preference', 1], ['reduce', 0]]) {
    test(`${reducedMotion}: ${erwartet} View Transition`, async ({ browser }) => {
      const ctx = await browser.newContext({ reducedMotion });
      const page = await ctx.newPage();
      await gotoHome(page);
      await page.evaluate(() => {
        window.__vt = 0;
        const orig = document.startViewTransition && document.startViewTransition.bind(document);
        if (orig) document.startViewTransition = (cb) => { window.__vt += 1; return orig(cb); };
      });
      await page.click('.greedy-nav .visible-links a[href$="/about/"]');
      await expect(page).toHaveURL(new RegExp(`${BASE}/about/?$`));
      expect(await survivedSwap(page)).toBe(true);
      expect(await page.evaluate(() => window.__vt)).toBe(erwartet);
      await ctx.close();
    });
  }
});
