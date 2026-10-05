// Service Worker mit echter Registrierung (Projekt sw, serviceWorkers:
// 'allow', playwright.config.js). Jeder Seitenwechsel ist ein volles Laden
// (ARCH-2) und läuft offline über handleNavigation in service-worker.js:
// precachte Seiten aus dem Cache, unbekannte Seiten als offline.html.
const { test, expect } = require('@playwright/test');

const BASE = '/auflinie'; // site.baseurl

test('Offline-Navigation über den Service Worker', async ({ page, context }) => {
  await page.goto(`${BASE}/`);
  // Warten, bis der Worker aktiv ist und die Seite steuert
  await page.evaluate(() => navigator.serviceWorker.ready);
  await expect.poll(async () => {
    await page.reload();
    return page.evaluate(() => !!navigator.serviceWorker.controller);
  }, { timeout: 20000 }).toBe(true);
  // Precache fertig: die Installation hat alle Einträge abgearbeitet
  await page.waitForTimeout(1000);

  await context.setOffline(true);
  await page.goto(`${BASE}/about/`);
  await expect(page).toHaveTitle(/Über mich/);
  await expect(page.locator('.masthead')).toBeVisible();

  await page.goto(`${BASE}/cv/`);
  await expect(page.locator('[data-skill-chips-mounted]')).toHaveCount(1);   // Skripte aus dem Cache

  await page.goto(`${BASE}/gibt-es-nicht/`);
  await expect(page.locator('.offline-page')).toBeVisible();
  await context.setOffline(false);
});
