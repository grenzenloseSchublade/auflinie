// Gastbeiträge (STYLEGUIDE INH-5): Fixture _posts/2025-01-01-test-gastbeitrag.md
// (published: false, nur im Review-Build). Der Gast steht als „von <Name>“ in
// der Meta-Zeile und als Autor in den Metadaten, ohne Autorprofil in der
// Sidebar. Herausgeber bleibt die Seite.
const { test, expect } = require('@playwright/test');

const URL = '/auflinie/posts/test-gastbeitrag/';
const NAME = 'Erika Mustermann';

test.describe('Gastbeitrag mit genanntem Autor (INH-5)', () => {
  test('Meta-Zeile, kein Autorprofil, Metadaten', async ({ page }) => {
    await page.goto(URL, { waitUntil: 'load' });
    await expect(page.locator('.page__hero--overlay .page__meta-author')).toHaveText(`von ${NAME}`);
    await expect(page.locator('.sidebar .author__name, .author__avatar, .author__urls')).toHaveCount(0);
    await expect(page.locator('meta[name="author"]')).toHaveAttribute('content', NAME);
    const ld = await page.locator('script[type="application/ld+json"]').first().textContent();
    const data = JSON.parse(ld);
    expect(data.author).toEqual({ '@type': 'Person', name: NAME });
    expect(data.publisher.name).toBe('Hans Müller');
  });

  test('Beitragslisten nennen den Gast, eigene Beiträge bleiben ohne', async ({ page }) => {
    await page.goto('/auflinie/archiv/', { waitUntil: 'load' });
    const item = page.locator('.archive__item').filter({ hasText: 'Test-Gastbeitrag' });
    await expect(item.locator('.page__meta-author')).toHaveText(`von ${NAME}`);
    const own = page.locator('.archive__item').filter({ hasText: 'Erstellung von Blogbeiträgen' });
    await expect(own.locator('.page__meta-author')).toHaveCount(0);

    await page.goto('/auflinie/posts/blogbeitrag-erstellen/', { waitUntil: 'load' });
    await expect(page.locator('.page__hero--overlay .page__meta-author')).toHaveCount(0);
    await expect(page.locator('.sidebar .author__name')).toHaveText('Hans Müller');
  });
});
