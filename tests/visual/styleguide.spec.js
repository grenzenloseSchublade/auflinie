// Automatisches Style-Guide-Review, Teil 1: Screenshot-Vergleich der
// Styleguide-Ansicht (_pages/styleguide.html, nie veröffentlicht).
// Jeder Abschnitt [data-sg-section] wird gegen sein Vergleichsbild geprüft,
// jedes Element mit [data-sg-states] zusätzlich in den erzwungenen Zuständen
// (hover, focus-visible …) über das Chrome DevTools Protocol.
// Gewollte Änderung? `npm run test:visual:update` im Playwright-Container
// (siehe playwright.config.js) und die neuen Bilder mitcommitten.
const { test, expect } = require('@playwright/test');

const URL = '/auflinie/styleguide/';

async function open(page) {
  await page.goto(URL, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
}

test('Styleguide-Abschnitte unverändert', async ({ page }) => {
  await open(page);
  const names = await page.locator('[data-sg-section]').evaluateAll(
    (els) => els.map((el) => el.getAttribute('data-sg-section')));
  expect(names.length).toBeGreaterThan(0);
  for (const name of names) {
    await expect(page.locator(`[data-sg-section="${name}"]`)).toHaveScreenshot(`${name}.png`);
  }
});

test('Komponenten-Zustände unverändert', async ({ page }) => {
  await open(page);
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('DOM.enable');
  await cdp.send('CSS.enable');
  const { root } = await cdp.send('DOM.getDocument', { depth: -1 });
  const { nodeIds } = await cdp.send('DOM.querySelectorAll', { nodeId: root.nodeId, selector: '[data-sg-states]' });
  const targets = page.locator('[data-sg-states]');
  expect(nodeIds.length).toBe(await targets.count());

  for (let i = 0; i < nodeIds.length; i++) {
    const el = targets.nth(i);
    const section = await el.evaluate((n) => n.closest('[data-sg-section]').getAttribute('data-sg-section'));
    const states = (await el.getAttribute('data-sg-states')).split(',').map((s) => s.trim());
    for (const state of states) {
      await cdp.send('CSS.forcePseudoState', { nodeId: nodeIds[i], forcedPseudoClasses: state === 'focus-visible' ? ['focus', 'focus-visible'] : [state] });
      await expect(el).toHaveScreenshot(`${section}-${i}-${state}.png`);
      await cdp.send('CSS.forcePseudoState', { nodeId: nodeIds[i], forcedPseudoClasses: [] });
    }
  }
});
