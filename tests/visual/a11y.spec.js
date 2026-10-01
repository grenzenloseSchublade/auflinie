// Automatisches Style-Guide-Review, Teil 3: Barrierefreiheit mit axe-core
// (WCAG 2.0/2.1/2.2 A und AA) auf den echten Seiten und der Styleguide-Ansicht.
//
// Bekannte, noch offene Befunde stehen in a11y-known.json (Baseline, jeder
// Eintrag „Regel | Selektor“). Der Test schlägt nur bei NEUEN Verstößen fehl.
// Behobene Einträge meldet er als Hinweis, damit die Baseline schrumpft.
// Baseline neu schreiben (nur bewusst, Diff prüfen!): npm run test:a11y:baseline
const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;

const KNOWN_FILE = path.join(__dirname, 'a11y-known.json');
const PAGES = ['', 'about/', 'cv/', 'posts/', 'mandelbrot/', 'styleguide/', '404.html'];
const known = fs.existsSync(KNOWN_FILE) ? JSON.parse(fs.readFileSync(KNOWN_FILE, 'utf8')) : {};
const collected = {};

for (const p of PAGES) {
  test(`axe: /${p}`, async ({ page }) => {
    await page.goto(`/auflinie/${p}`, { waitUntil: 'load' });
    await page.waitForTimeout(p === 'mandelbrot/' ? 3000 : 800);
    const { violations } = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    const found = [...new Set(violations.flatMap((v) => v.nodes.map((n) => `${v.id} | ${n.target.join(' ')}`)))].sort();
    collected[p || '/'] = found;
    const base = new Set(known[p || '/'] || []);
    const fresh = found.filter((f) => !base.has(f));
    const fixed = [...base].filter((b) => !found.includes(b));
    if (fixed.length) console.log(`/${p}: behoben, aus a11y-known.json entfernen:\n  ${fixed.join('\n  ')}`);
    if (!process.env.UPDATE_A11Y) {
      expect(fresh, `Neue Verstöße auf /${p}:\n${fresh.join('\n')}`).toEqual([]);
    }
  });
}

test.afterAll(() => {
  if (!process.env.UPDATE_A11Y) return;
  const merged = { ...known, ...collected };
  fs.writeFileSync(KNOWN_FILE, JSON.stringify(merged, null, 2) + '\n');
});
