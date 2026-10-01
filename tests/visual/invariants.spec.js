// Automatisches Style-Guide-Review, Teil 4: Bedien-Invarianten aus
// STYLEGUIDE.md 6.2 und 4.4 (A11Y-2, OVL-3, OVL-4, WCAG 2.4.3/2.4.7).
// Prüft Verhalten, nicht Aussehen: Fokusführung, aria-expanded, inert,
// Escape und Light Dismiss an Drawer und Skill-Graph-Sheet sowie, dass kein
// unsichtbares Element den Tastaturfokus bekommt.
const { test, expect } = require('@playwright/test');

const MOBIL = { width: 390, height: 844 };

// Ist das fokussierte Element wirklich zu sehen? (Größe, visibility und
// Deckkraft entlang der Vorfahren)
async function focusedIsVisible(page) {
  return page.evaluate(() => {
    const el = document.activeElement;
    if (!el || el === document.body) return { ok: true, what: 'body' };
    const r = el.getBoundingClientRect();
    const what = el.outerHTML.slice(0, 120);
    if (r.width < 1 || r.height < 1) return { ok: false, what, why: 'ohne Fläche' };
    if (getComputedStyle(el).visibility !== 'visible') return { ok: false, what, why: 'visibility' };
    for (let n = el; n; n = n.parentElement) {
      if (Number(getComputedStyle(n).opacity) < 0.05) return { ok: false, what, why: 'opacity 0' };
    }
    return { ok: true, what };
  });
}

// Beide Bewegungs-Einstellungen: unter Reduced Motion verzögert der globale
// Kill-Switch das Sichtbarwerden des Drawers um einige Frames.
for (const reducedMotion of ['no-preference', 'reduce']) {
  test.describe(`Drawer per Tastatur, ${reducedMotion} (A11Y-2, OVL-4)`, () => {
    test.use({ viewport: MOBIL, contextOptions: { reducedMotion } });

    test('Fokus hinein, Hintergrund inert, Escape gibt Fokus zurück', async ({ page }) => {
      await page.goto('/auflinie/about/', { waitUntil: 'load' });
      const toggle = page.locator('.greedy-nav__toggle');
      const drawer = page.locator('#site-nav-drawer');
      await expect(toggle).toBeVisible();
      await expect(toggle).toHaveAttribute('aria-expanded', 'false');

      await toggle.focus();
      await page.keyboard.press('Enter');
      await expect(toggle).toHaveAttribute('aria-expanded', 'true');
      await expect(drawer).not.toHaveClass(/(^|\s)hidden(\s|$)/);
      // Fokus auf dem ersten Link im Drawer
      await expect(drawer.locator('a').first()).toBeFocused();
      // Nach dem Slide-In: Inhalt und Footer inert, Masthead nicht
      await expect.poll(() => page.evaluate(() => document.querySelector('.initial-content').inert)).toBe(true);
      expect(await page.evaluate(() => document.getElementById('footer').inert)).toBe(true);
      expect(await page.evaluate(() => document.querySelector('.masthead').inert)).toBe(false);
      expect(await page.evaluate(() => document.getElementById('spa-route-announcer').inert)).toBe(false);

      await page.keyboard.press('Escape');
      await expect(toggle).toHaveAttribute('aria-expanded', 'false');
      await expect(toggle).toBeFocused();
      expect(await page.evaluate(() => document.querySelector('.initial-content').inert)).toBe(false);
      expect(await page.evaluate(() => document.getElementById('footer').inert)).toBe(false);
    });
  });
}

test.describe('Drawer per Zeiger (A11Y-2, OVL-3)', () => {
  test.use({ viewport: MOBIL });

  test('Zeiger: Fokus bleibt am Auslöser, Light Dismiss hebt inert auf', async ({ page }) => {
    await page.goto('/auflinie/about/', { waitUntil: 'load' });
    const toggle = page.locator('.greedy-nav__toggle');
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(toggle).toBeFocused();
    await expect.poll(() => page.evaluate(() => document.querySelector('.initial-content').inert)).toBe(true);

    // Klick auf den abgedunkelten Bereich links vom Drawer
    await page.mouse.click(40, MOBIL.height / 2);
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(await page.evaluate(() => document.querySelector('.initial-content').inert)).toBe(false);
  });
});

test.describe('Skill-Graph-Sheet (OVL-3, OVL-4)', () => {
  async function openSheet(page) {
    await page.locator('[data-role="graph-activate"]').click();
    const opener = page.locator('[data-role="graph-toggle"]');
    await opener.scrollIntoViewIfNeeded();
    await expect(opener).toBeVisible();
    await opener.click();
    const panel = page.locator('[data-role="graph-panel"]');
    await expect(panel).toHaveAttribute('role', 'dialog');
    await expect(panel).toHaveAttribute('aria-modal', 'true');
    return { opener, panel };
  }

  test('Escape schließt, Fokus zurück zum Öffner, Hintergrund wieder frei', async ({ page }) => {
    await page.goto('/auflinie/cv/', { waitUntil: 'load' });
    await page.locator('[data-role="graph-activate"]').scrollIntoViewIfNeeded();
    const { opener, panel } = await openSheet(page);
    await expect(page.locator('.skill-graph__sheet-close')).toBeFocused();
    expect(await page.evaluate(() => document.querySelector('.initial-content').inert)).toBe(true);

    await page.keyboard.press('Escape');
    await expect(panel).not.toHaveAttribute('role', 'dialog');
    await expect(opener).toBeFocused();
    expect(await page.evaluate(() => document.querySelector('.initial-content').inert)).toBe(false);
  });

  test('Light Dismiss über den Scrim', async ({ page }) => {
    await page.goto('/auflinie/cv/', { waitUntil: 'load' });
    await page.locator('[data-role="graph-activate"]').scrollIntoViewIfNeeded();
    const { panel } = await openSheet(page);
    const scrim = page.locator('.skill-graph__scrim');
    const box = await scrim.boundingBox();
    // oberhalb des Sheets (68vh hoch, unten angedockt)
    await page.mouse.click(box.x + box.width / 2, box.y + box.height * 0.2);
    await expect(panel).not.toHaveAttribute('role', 'dialog');
    expect(await page.evaluate(() => document.querySelector('.initial-content').inert)).toBe(false);
  });
});

test.describe('Kein unsichtbarer Fokus (WCAG 2.4.7)', () => {
  for (const p of ['', 'cv/']) {
    test(`Tab durch /${p}`, async ({ page }) => {
      await page.goto(`/auflinie/${p}`, { waitUntil: 'load' });
      await page.waitForTimeout(500);
      const invisible = [];
      const seen = new Set();
      for (let i = 0; i < 120; i++) {
        await page.keyboard.press('Tab');
        const res = await focusedIsVisible(page);
        if (seen.has(res.what)) break; // einmal herum
        seen.add(res.what);
        if (!res.ok) invisible.push(`${res.why}: ${res.what}`);
      }
      expect(seen.size, 'Tab-Runde zu kurz, Test greift nicht').toBeGreaterThan(10);
      expect(invisible, invisible.join('\n')).toEqual([]);
    });
  }
});
