// Regressionstests für die Persistent-Shell-Navigation (spa-nav.js).
// Nageln die "bricht-nichts"-Invarianten fest — siehe README-spa-nav.md.
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

  test('nicht-verdrahteter Link (Mandelbrot, CDN-Deps) macht Voll-Reload', async ({ page }) => {
    await gotoHome(page);

    // Passe den Selektor ggf. an die echte Navigation an, falls kein Mandelbrot-Link.
    await page.click('.greedy-nav a[href*="/mandelbrot/"]');
    await expect(page).toHaveURL(new RegExp(`${BASE}/mandelbrot/?`));
    expect(await survivedSwap(page)).toBe(false);                // window frisch -> Voll-Reload
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
    expect(await survivedSwap(page)).toBe(true);

    await page.waitForTimeout(600); // etwaige pending-Drainage + finishSwap settlen lassen

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
