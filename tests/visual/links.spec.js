// Externe Links (STYLEGUIDE LINK-3): neuer Tab, rel, Hinweis für Screenreader
// und Symbol setzt _plugins/external-links.rb beim Build. Interne Links
// bleiben unverändert.
const { test, expect } = require('@playwright/test');

const HINT = 'öffnet in neuem Tab';

test.describe('Externe Links im neuen Tab mit Hinweis (LINK-3)', () => {
  test('extern mit target, rel, verstecktem Hinweis und Symbol, intern ohne', async ({ page }) => {
    await page.goto('/auflinie/posts/', { waitUntil: 'load' });
    const ext = page.locator('.guide-banner a[href^="https://github.com/"]');
    await expect(ext).toHaveAttribute('target', '_blank');
    const rel = (await ext.getAttribute('rel')).split(/\s+/);
    expect(rel).toEqual(expect.arrayContaining(['noopener', 'noreferrer']));
    await expect(ext.locator('.visually-hidden')).toHaveText(` (${HINT})`);
    await expect(ext.locator('.ext-link-icon svg')).toHaveAttribute('aria-hidden', 'true');
    await expect(ext).toHaveAccessibleName(`GitHub (${HINT})`);

    const int = page.locator('.guide-banner a.guide-banner__btn');
    expect(await int.getAttribute('target')).toBeNull();
    await expect(int.locator('.ext-link-icon, .visually-hidden')).toHaveCount(0);
  });

  test('Link mit aria-label trägt den Hinweis im aria-label', async ({ page }) => {
    await page.goto('/auflinie/about/', { waitUntil: 'load' });
    // Erste externe Karte, eine Mail-Karte (mailto:) bleibt ohne Hinweis
    const card = page.locator('a.contact-card[href^="https://"]').first();
    await expect(card).toHaveAttribute('target', '_blank');
    await expect(card).toHaveAttribute('aria-label', new RegExp(`\\(${HINT}\\)$`));
    await expect(card.locator('.visually-hidden')).toHaveCount(0);
  });

  test('kein Umbruch zwischen letztem Wort und Symbol', async ({ page }) => {
    await page.goto('/auflinie/posts/', { waitUntil: 'load' });
    // Den Banner-Text schrittweise schmaler machen: Das Symbol steht in jeder
    // Breite auf derselben Zeile wie der letzte Buchstabe des Linktexts
    const fails = await page.evaluate(() => {
      const p = document.querySelector('.guide-banner__text');
      // Ohne Übergang: Eine überblendete Breite (bis Oktober 2026 das
      // Theme-transition: all am <p>) ließe die Messung bei der Ausgangsbreite
      p.style.transition = 'none';
      const a = p.querySelector('a[target="_blank"]');
      const icon = a.querySelector('.ext-link-icon svg');
      const text = [...a.childNodes].find((n) => n.nodeType === Node.TEXT_NODE);
      const range = document.createRange();
      range.setStart(text, text.length - 1);
      range.setEnd(text, text.length);
      const bad = [];
      for (let w = 420; w >= 120; w -= 3) {
        p.style.width = `${w}px`;
        const last = range.getBoundingClientRect();
        const ic = icon.getBoundingClientRect();
        if (ic.top >= last.bottom || ic.bottom <= last.top) bad.push(w);
      }
      p.style.width = '';
      return bad;
    });
    expect(fails).toEqual([]);
  });
});
