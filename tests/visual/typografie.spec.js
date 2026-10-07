// Geschützter Schrägstrich (STYLEGUIDE TYPO-2): _plugins/schraegstrich.rb
// setzt beim Build vor „/“ zwischen Begriffen ein geschütztes Leerzeichen
// (U+00A0), damit nie „CI /“ am Zeilenende steht. Code, Attribute und
// Skript-Daten bleiben, wie getippt. Fixture für Code, Attribut, Inline-Tag,
// Zeilenumbruch und selbstschließendes SVG:
// _posts/2025-01-01-test-gastbeitrag.md (nur im Review-Build).
const { test, expect } = require('@playwright/test');
const { PAGES } = require('./pages');

const NBSP = ' ';
const FIXTURE = '/auflinie/posts/test-gastbeitrag/';
// Wie SKIP_ELEMENTS im Plugin
const SKIP = 'script, style, textarea, template, title, pre, code, kbd, samp, svg, math';

// Textstellen „a / b“ mit normalem Leerraum vor dem Strich im
// ausgelieferten HTML (vor jedem Skript), ohne Code und Skripte. Auch
// Zeilenumbruch und mehrere Leerzeichen zählen (nicht \s, das passt auch
// auf U+00A0)
async function ungeschuetzt(page, request, url) {
  const html = await (await request.get(url)).text();
  return page.evaluate(({ src, skip }) => {
    const doc = new DOMParser().parseFromString(src, 'text/html');
    const walker = doc.createTreeWalker(doc.documentElement, NodeFilter.SHOW_TEXT);
    const found = [];
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      if (n.parentElement.closest(skip)) continue;
      const m = n.data.match(/\S[ \t\r\n]+\/[ \t\r\n]+\S/);
      if (m) found.push(n.data.trim().slice(0, 80));
    }
    return found;
  }, { src: html, skip: SKIP });
}

test.describe('Geschütztes Leerzeichen vor dem Schrägstrich (TYPO-2)', () => {
  test('Lebenslauf: „CI / CD“ mit U+00A0 vor dem Strich', async ({ page }) => {
    await page.goto('/auflinie/cv/', { waitUntil: 'load' });
    const chip = page.locator('.cv-skill-chip__button[data-skill="ci-cd"]');
    // textContent statt toHaveText: toHaveText glättet Leerraum, auch U+00A0
    expect(await chip.first().textContent()).toBe(`CI${NBSP}/ CD`);
  });

  test('Text geschützt, Code und Attribute wie getippt', async ({ page }) => {
    await page.goto(FIXTURE, { waitUntil: 'load' });
    const p = page.locator('.page__content p', { hasText: 'Pipelines für CI' });
    const text = await p.evaluate((el) => el.textContent);
    expect(text).toContain(`CI${NBSP}/ CD`);
    // Inline-Tags links und rechts vom Strich zählen als Wortgrenze
    expect(text).toContain(`C${NBSP}/ C++`);
    expect(text).toContain(`Link${NBSP}/ Text`);
    // title-Attribut und Inline-Code unverändert
    await expect(p.locator('a[title]')).toHaveAttribute('title', 'Ruby / HTML');
    expect(await p.locator('code').textContent()).toBe('Gemfile / Gemfile.lock');
    // Zeilenumbruch und doppelte Leerzeichen um den Strich
    const p2 = page.locator('.page__content p', { hasText: 'über das Zeilenende' });
    const text2 = await p2.evaluate((el) => el.textContent);
    expect(text2).toContain(`Build${NBSP}/ Deploy`);
    expect(text2).toContain(`Test${NBSP}/ Lint`);
    // Selbstschließendes SVG (<svg …/>) beendet den übersprungenen Bereich
    expect(await p2.locator('svg.test-symbol').count()).toBe(1);
    expect(text2).toContain(`Lesen${NBSP}/ Schreiben`);
    // Codeblock unverändert, ohne U+00A0
    const block = await page.locator('.page__content pre').first().textContent();
    expect(block).toContain('assets / js / main.js');
    expect(block).not.toContain(NBSP);
  });

  test('kein ungeschützter Schrägstrich im Text einer Seite', async ({ page, request }) => {
    test.setTimeout(120_000);
    const bad = {};
    for (const p of PAGES) {
      const found = await ungeschuetzt(page, request, `/auflinie/${p}`);
      if (found.length) bad[p] = found;
    }
    expect(bad).toEqual({});
  });

  test('Skill-Graph misst U+00A0 so breit wie ein Leerzeichen', async ({ page }) => {
    // Knoten-Labels kommen aus den Chip-Texten (skill-graph.js labelWidth)
    await page.goto('/auflinie/cv/', { waitUntil: 'load' });
    const [plain, nbsp] = await page.evaluate((s) => {
      const ctx = document.createElement('canvas').getContext('2d');
      ctx.font = '11px "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace';
      return [ctx.measureText('CI / CD').width, ctx.measureText(s).width];
    }, `CI${NBSP}/ CD`);
    expect(nbsp).toBeCloseTo(plain, 3);
  });
});
