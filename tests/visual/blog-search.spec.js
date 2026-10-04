// Verhaltenstest der Blog-Suche auf /posts/ (assets/js/blog-search.js):
// Filtern nach Titel, Excerpt und Gastname (INH-5), ohne Groß- und
// Kleinschreibung, Leerzustand mit Hinweis, „Zurücksetzen“ zeigt wieder alles
// und gibt den Fokus ins Suchfeld. Die Suchbegriffe kommen aus den Einträgen
// selbst, ein neuer Beitrag ändert den Test nicht.
const { test, expect } = require('@playwright/test');

const URL = '/auflinie/posts/';

async function visibleTitles(page) {
  return page.locator('#blog-entries .post-item:visible .archive__item-title').allTextContents();
}

test.describe('Blog-Suche (/posts/)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(URL, { waitUntil: 'load' });
    await expect(page.locator('#blog-search-input')).toHaveAttribute('data-blog-search-mounted', '');
  });

  test('filtert nach einem Titelwort, ohne Groß- und Kleinschreibung', async ({ page }) => {
    const items = page.locator('#blog-entries .post-item');
    const total = await items.count();
    expect(total, 'Review-Build ohne Beiträge').toBeGreaterThan(1);
    const searches = await items.evaluateAll((els) => els.map((e) => e.dataset.search));
    // Ein Wort aus dem ersten Titel, das nicht in allen Einträgen vorkommt
    const title = (await items.first().locator('.archive__item-title').textContent()).trim();
    const word = title.split(/\s+/).map((w) => w.replace(/[^\p{L}\p{N}-]/gu, ''))
      .find((w) => w.length >= 4 && searches.some((s) => !s.includes(w.toLowerCase())));
    expect(word, `kein unterscheidendes Wort in „${title}“`).toBeTruthy();
    const expected = searches.filter((s) => s.includes(word.toLowerCase())).length;

    await page.locator('#blog-search-input').fill(word.toUpperCase());
    await expect(page.locator('#blog-entries .post-item:visible')).toHaveCount(expected);
    expect((await visibleTitles(page)).map((t) => t.trim())).toContain(title);
    await expect(page.locator('#blog-empty-message')).toBeHidden();
  });

  test('findet Gastbeiträge über den Namen des Gastes (INH-5)', async ({ page }) => {
    const guest = page.locator('#blog-entries .post-item .page__meta-author').first();
    test.skip(await guest.count() === 0, 'kein Gastbeitrag auf der ersten Seite');
    const name = (await guest.textContent()).replace(/^\s*von\s+/, '').trim();
    await page.locator('#blog-search-input').fill(name.split(/\s+/).pop());
    await expect(page.locator('#blog-entries .post-item:visible .page__meta-author').first()).toContainText(name);
  });

  test('Leerzustand und Zurücksetzen', async ({ page }) => {
    const total = await page.locator('#blog-entries .post-item').count();
    const input = page.locator('#blog-search-input');
    await input.fill('zzqxwv');
    await expect(page.locator('#blog-entries .post-item:visible')).toHaveCount(0);
    await expect(page.locator('#blog-empty-message')).toBeVisible();

    await page.locator('#blog-search-clear').click();
    await expect(input).toHaveValue('');
    await expect(input).toBeFocused();
    await expect(page.locator('#blog-entries .post-item:visible')).toHaveCount(total);
    await expect(page.locator('#blog-empty-message')).toBeHidden();
  });
});
