// Seitenwechsel per Cross-Document-View-Transition (STYLEGUIDE ARCH-2,
// docs/features/seitenwechsel.md). Jeder interne Wechsel ist ein volles
// Laden. Geprüft wird, was die frühere SPA-Navigation selbst leisten musste
// und jetzt Browser und Seiten-Module tragen: jedes Modul mountet beim
// Laden genau einmal und fehlerfrei, die Navigation markiert die aktuelle
// Seite, die Kopfzeile ist ein eigener Snapshot, die View Transition läuft
// auch unter Reduced Motion (ohne CRT), die Speculation Rules sind gültig.
// Service Worker und Offline-Navigation prüft das Projekt sw
// (playwright.config.js). Die bfcache-Rückkehr lässt sich headless nicht
// prüfen (Chromium meldet notRestoredReasons „masked“), sie ist in der
// Messung mit sichtbarem Browser belegt (tests/README.md).
const { test, expect } = require('@playwright/test');

const BASE = '/auflinie'; // site.baseurl

// Zählt je Marker data-<modul>-mounted, wie oft ein Modul ihn setzt, und
// sammelt Seitenfehler. Ein Modul, das doppelt liefe, setzte ihn bei einem
// zweiten Element oder gar nicht (Guard), beides fiele unten auf.
async function watch(page) {
  const errors = [];
  page.on('pageerror', (err) => errors.push('pageerror: ' + err.message));
  page.on('console', (msg) => {
    if (msg.type() !== 'error') return;
    if (msg.text().startsWith('sw-register: ServiceWorker-Registrierung')) return;   // serviceWorkers: 'block'
    if (/inline-speculation-rules|does not appear in the script-src directive/.test(msg.text())) return;   // WebKit, R-86
    errors.push('console: ' + msg.text());
  });
  await page.addInitScript(() => {
    window.__mounts = {};
    const set = Element.prototype.setAttribute;
    Element.prototype.setAttribute = function (name, value) {
      if (/^data-[a-z-]+-mounted$/.test(name)) window.__mounts[name] = (window.__mounts[name] || 0) + 1;
      return set.call(this, name, value);
    };
  });
  return errors;
}

// Marker je Seite (Stand _includes/scripts.html). hero-crt.js und
// neon-orbit-toggle.js setzen keinen Marker, sie prüfen die Tests einzeln.
const SEITEN = {
  '/': [],
  '/cv/': ['author-follow', 'back-to-top', 'toc', 'skill-chips', 'skill-graph', 'graph-sheet'],
  '/mandelbrot/': ['author-follow', 'back-to-top', 'toc', 'fractal-panel'],
  '/posts/': ['back-to-top', 'blog-search'],
  '/posts/erstellung-dieser-website/': ['author-follow', 'back-to-top', 'toc'],
};
const MEHRFACH = { 'fractal-panel': 2 };   // zwei Panels auf /mandelbrot/

test.describe('Seiten-Module beim vollen Laden', () => {
  for (const [pfad, module] of Object.entries(SEITEN)) {
    test(`${pfad}: jedes Modul mountet genau einmal, ohne Fehler`, async ({ page }) => {
      const errors = await watch(page);
      await page.goto(`${BASE}${pfad}`, { waitUntil: 'load' });
      await page.waitForTimeout(300);
      const mounts = await page.evaluate(() => window.__mounts);
      // Ein eingeschalteter Blog-Hinweis (blog_notice) bringt sein Modul mit
      const extra = await page.locator('#blog-notice').count() ? ['blog-notice'] : [];
      const erwartet = Object.fromEntries([...module, ...extra].map((m) => [`data-${m}-mounted`, MEHRFACH[m] || 1]));
      expect(mounts).toEqual(erwartet);
      // Jedes Skript genau einmal im Dokument
      const srcs = await page.evaluate(() => Array.from(document.scripts).map((s) => s.src).filter(Boolean));
      expect(srcs.length).toBe(new Set(srcs).size);
      // hero-crt.js: Hero-Bild gesetzt (alle Seiten hier haben einen Overlay-Hero)
      await expect(page.locator('.page__hero--overlay.loaded')).toHaveCount(1);
      expect(errors).toEqual([]);
    });
  }

  test('Autor-Dropdown: ein Klick öffnet (Listener nur einmal gebunden)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });   // Knopf nur schmal sichtbar
    await page.goto(`${BASE}/cv/`);
    const btn = page.locator('.author__urls-wrapper button');
    await expect(btn).toBeVisible();
    await btn.click();
    await expect(btn).toHaveAttribute('aria-expanded', 'true');
  });

  test('Startseite: Neon-Modul pausiert außerhalb des Viewports', async ({ page }) => {
    await page.goto(`${BASE}/`);
    const neon = page.locator('.neon-name').first();
    await expect(neon).not.toHaveClass(/neon-paused/);
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await expect(neon).toHaveClass(/neon-paused/);
  });
});

test.describe('Navigation', () => {
  test('Link lädt die Zielseite voll, Titel und aria-current wandern', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await page.evaluate(() => { window.__alteSeite = true; });
    const link = page.locator('.greedy-nav .visible-links a[href$="/about/"]');   // Desktop: im Menü
    await expect(link).toBeVisible();
    await link.click();
    await expect(page).toHaveURL(new RegExp(`${BASE}/about/$`));
    expect(await page.evaluate(() => window.__alteSeite)).toBeUndefined();   // volles Laden
    await expect(page).toHaveTitle(/Über mich/);
    const aktuell = page.locator('.greedy-nav a[aria-current="page"]');
    await expect(aktuell).toHaveCount(1);
    await expect(aktuell).toHaveAttribute('href', `${BASE}/about/`);
  });

  // Übergang R-96 (sw-register.js, entfällt ab 2026-12-01): Einträge der
  // alten SPA lagen per pushState im selben Dokument. Nachgestellt wie beim
  // Update per Toast: Eintrag anlegen, dann neu laden.
  test('Zurück in einen Eintrag der alten SPA lädt die Seite zur URL', async ({ page }) => {
    await page.goto(`${BASE}/cv/`);
    await page.evaluate((url) => history.pushState({ spa: true, docId: 'alt', url }, '', url), `${BASE}/posts/`);
    await page.reload();
    await expect(page.locator('h1').first()).toContainText('Blog');
    await page.goBack();
    await expect(page).toHaveURL(new RegExp(`${BASE}/cv/$`));
    await expect(page.locator('h1').first()).toContainText('Lebenslauf');
  });

  test('Anker-Sprung und Zurück laden nicht neu, Zurück zwischen Seiten schon', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await page.locator('.greedy-nav .visible-links a[href$="/cv/"]').click();
    await expect(page).toHaveURL(new RegExp(`${BASE}/cv/$`));
    await page.evaluate(() => { window.__gleicheSeite = true; });
    const anker = page.locator('#toc-original .toc__menu a[href^="#"]').first();
    const ziel = await anker.getAttribute('href');
    await anker.click();
    await expect(page).toHaveURL(new RegExp(`${BASE}/cv/${ziel}$`));
    await page.goBack();
    await expect(page).toHaveURL(new RegExp(`${BASE}/cv/$`));
    await page.waitForTimeout(300);   // ein Reload käme hier an
    expect(await page.evaluate(() => window.__gleicheSeite)).toBe(true);
    await page.goBack();
    await expect(page).toHaveURL(new RegExp(`${BASE}/$`));
    await expect(page.locator('h1').first()).not.toContainText('Lebenslauf');
  });

  test('Kopfzeile ist ein eigener View-Transition-Snapshot', async ({ page }) => {
    await page.goto(`${BASE}/about/`);
    const name = await page.evaluate(() => (CSS.supports('view-transition-name: none')
      ? getComputedStyle(document.querySelector('.masthead')).viewTransitionName : 'nicht unterstützt'));
    test.skip(name === 'nicht unterstützt', 'Engine kennt view-transition-name nicht');
    expect(name).toBe('masthead');
  });

  test('Speculation Rules sind gültiges JSON und schließen Mandelbrot und Drawer aus', async ({ page }) => {
    await page.goto(`${BASE}/`);
    const text = await page.locator('script[type="speculationrules"]').textContent();
    const rules = JSON.parse(text);
    const where = JSON.stringify(rules.prerender[0].where);
    expect(where).toContain(`"href_matches":"${BASE}/*"`);
    expect(where).toContain(`{"not":{"href_matches":"${BASE}/mandelbrot/*"}}`);
    expect(where).toContain('{"not":{"selector_matches":".greedy-nav .hidden-links a"}}');
    expect(rules.prerender[0].eagerness).toBe('moderate');
  });
});

// Cross-Document-View-Transition (Chromium und Safari, Firefox lädt normal).
// pagereveal der Zielseite hält die Transition fest, die Types setzt
// head-early.js im selben Ereignis danach. Mobil (390 px) von ganz oben mit
// Bereichswechsel wäre der CRT-Effekt fällig (tv-switch.js), unter Reduced
// Motion bleibt er aus, die Transition läuft trotzdem (ARCH-2).
test.describe('View Transition beim Seitenwechsel', () => {
  for (const [reducedMotion, crt] of [['no-preference', true], ['reduce', false]]) {
    test(`${reducedMotion}: Transition läuft, CRT ${crt ? 'an' : 'aus'}`, async ({ browser, browserName }) => {
      test.skip(browserName === 'webkit' && reducedMotion === 'no-preference',
        'View Transition in WebKit ohne GPU zu langsam (R-87)');
      const ctx = await browser.newContext({ reducedMotion, viewport: { width: 390, height: 844 } });
      const page = await ctx.newPage();
      await page.addInitScript(() => {
        addEventListener('pagereveal', (e) => {
          window.__vt = e.viewTransition || null;
          window.__revealT = performance.now();
          if (e.viewTransition) e.viewTransition.finished.then(() => { window.__vtEnde = performance.now(); }, () => {});
        });
      });
      await page.goto(`${BASE}/`);
      const support = await page.evaluate(() => 'CSSViewTransitionRule' in window);
      test.skip(!support, 'keine Cross-Document-View-Transition in dieser Engine');
      await page.waitForTimeout(300);
      // Ein Link im Inhalt statt im Drawer (sonst käme der Type drawer dazu)
      await page.evaluate((href) => {
        const a = document.createElement('a');
        a.href = href; a.textContent = 'Test'; a.id = '__test-link';
        a.style.cssText = 'position:fixed;top:120px;left:20px;z-index:99999';
        document.body.appendChild(a);
      }, `${BASE}/about/`);
      await page.click('#__test-link');
      await expect(page).toHaveURL(new RegExp(`${BASE}/about/$`));
      await expect.poll(() => page.evaluate(() => window.__vtEnde || 0), { timeout: 15000 }).toBeGreaterThan(0);
      const info = await page.evaluate(() => ({
        vt: !!window.__vt,
        types: window.__vt ? Array.from(window.__vt.types) : [],
        dauer: window.__vtEnde - window.__revealT,
      }));
      expect(info.vt).toBe(true);
      expect(info.types.includes('crt')).toBe(crt);
      if (!crt && browserName === 'chromium') expect(info.dauer).toBeLessThan(200);   // Dauer null
      await ctx.close();
    });
  }
});
