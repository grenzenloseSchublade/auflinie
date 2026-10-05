// Regressionstests für die selbst gehosteten Bibliotheken (assets/vendor/):
// MathJax, noUiSlider, Tom Select. Sie laufen nach jedem Versionswechsel
// und prüfen nur, was die Seite davon wirklich nutzt: /mandelbrot/ setzt alle
// Formeln (direkt geladen, nach Neuladen und nach Zurück), ohne Seitenfehler und
// ohne CSP-Verstoß, und das Fraktal-Panel bleibt bedienbar.
const { test, expect } = require('@playwright/test');

const BASE = '/auflinie'; // site.baseurl

// CSP-Verstöße und Laufzeitfehler mitschreiben, bevor die Seite lädt. Ohne
// Ausnahme, auch für den speculationrules-Block: die CSP erlaubt ihn per Hash,
// das kennt jede Engine (früher Register R-86)
async function watchErrors(page) {
  const errors = [];
  page.on('pageerror', (err) => errors.push('pageerror: ' + err.message));
  page.on('console', (msg) => {
    if (msg.type() !== 'error') return;
    // Die Testkonfiguration blockiert Service Worker (serviceWorkers: 'block'),
    // sw-register.js meldet das als Fehler. Kein Befund der Bibliotheken.
    if (msg.text().startsWith('sw-register: ServiceWorker-Registrierung')) return;
    errors.push('console: ' + msg.text());
  });
  await page.addInitScript(() => {
    document.addEventListener('securitypolicyviolation', (e) => {
      console.error('CSP: ' + e.violatedDirective + ' ' + e.blockedURI);
    });
  });
  return errors;
}

// Wartet, bis MathJax fertig ist: Anzahl der gesetzten Formeln stabil und im
// Inhalt kein ungesetztes TeX ($ ... $) mehr. startup.promise eignet sich
// nicht als Signal (bleibt in 4.1 pending, siehe mathjax-config.js).
async function renderedMath(page) {
  await page.waitForFunction(() => {
    const root = document.querySelector('.page__content');
    if (!root) return false;
    const n = root.querySelectorAll('mjx-container').length;
    const prev = window.__mjxCount;
    window.__mjxCount = n;
    return n > 0 && n === prev;
  }, null, { polling: 300, timeout: 15000 });
  return page.evaluate(() => {
    const root = document.querySelector('.page__content');
    const skip = 'mjx-container, script, style, code, pre, textarea, noscript, .tex2jax_ignore';
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: (node) => (node.parentElement.closest(skip)
        ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
    });
    let leftover = 0;
    while (walker.nextNode()) {
      if (/\$[^$\s]/.test(walker.currentNode.nodeValue)) leftover += 1;
    }
    return {
      count: root.querySelectorAll('mjx-container').length,
      errors: root.querySelectorAll('mjx-merror').length,
      leftover: leftover,
    };
  });
}

test.describe('Vendor-Bibliotheken auf /mandelbrot/', () => {
  test('MathJax setzt alle Formeln, auch nach Neuladen und Zurück', async ({ page }) => {
    const errors = await watchErrors(page);

    await page.goto(`${BASE}/mandelbrot/`);
    const direct = await renderedMath(page);
    expect(direct.count).toBeGreaterThan(0);
    expect(direct.errors).toBe(0);
    expect(direct.leftover).toBe(0);
    test.info().annotations.push({ type: 'mjx-container', description: String(direct.count) });
    console.log('mjx-container auf /mandelbrot/: ' + direct.count);

    // Neu laden: MathJax setzt dieselben Formeln wieder selbst
    await page.evaluate(() => { window.__mjxCount = undefined; });
    await page.reload();
    expect(await renderedMath(page)).toEqual(direct);

    // Weg und zurück: aus dem bfcache stehen die Formeln schon, ohne
    // bfcache (Playwright schaltet ihn in Chromium ab) lädt die Seite neu
    await page.click('.greedy-nav .visible-links a[href$="/about/"]');
    await expect(page).toHaveURL(new RegExp(`${BASE}/about/?$`));
    await page.goBack();
    await expect(page).toHaveURL(new RegExp(`${BASE}/mandelbrot/?`));
    await page.evaluate(() => { window.__mjxCount = undefined; });
    expect(await renderedMath(page)).toEqual(direct);

    expect(errors).toEqual([]);
  });

  test('Fraktal-Panel: Slider benannt und per Tastatur bedienbar, Preset wählbar', async ({ page }) => {
    const errors = await watchErrors(page);
    await page.goto(`${BASE}/mandelbrot/`);

    const handles = page.locator('.noUi-handle[role="slider"]');
    await expect(handles.first()).toBeVisible();
    const names = await handles.evaluateAll((els) => els.map((el) => el.getAttribute('aria-label')));
    expect(names.length).toBeGreaterThan(0);
    for (const name of names) {
      expect(name).toBeTruthy();
      expect(name).not.toMatch(/:\s*$/);
    }

    // Iterationen: Pfeiltaste verschiebt den Griff, das Zahlenfeld folgt
    const iter = page.locator('[data-role="iterations-slider"] .noUi-handle').first();
    const before = Number(await iter.getAttribute('aria-valuenow'));
    await iter.focus();
    await page.keyboard.press('ArrowRight');
    await expect(iter).not.toHaveAttribute('aria-valuenow', String(before));
    const after = await iter.getAttribute('aria-valuenow');
    const iterInput = page.locator('[data-role="iterations-input"]').first();
    await expect(iterInput).toHaveValue(String(Math.round(Number(after))));

    // Preset (Tom Select): Auswahl setzt c im Julia-Panel
    const preset = page.locator('[data-role="preset"]').first();
    const options = await preset.evaluate((sel) => Array.from(sel.options).map((o) => ({
      value: o.value, real: o.dataset.real,
    })));
    const target = options.find((o) => o.value !== 'standard');
    const control = page.locator('[data-role="preset"] + .ts-wrapper .ts-control').first();
    // Das Preset sitzt in den erweiterten Optionen
    const advanced = page.locator('[data-role="advanced-toggle"]').first();
    if ((await advanced.getAttribute('aria-expanded')) === 'false') await advanced.click();
    await control.click();
    await page.locator(`[data-role="preset"] + .ts-wrapper .ts-dropdown [data-value="${target.value}"]`)
      .first().click();
    await expect(page.locator('[data-role="real-input"]').first())
      .toHaveValue(Number(target.real).toFixed(2));
    await expect(control).toHaveAttribute('role', 'combobox');

    expect(errors).toEqual([]);
  });
});
