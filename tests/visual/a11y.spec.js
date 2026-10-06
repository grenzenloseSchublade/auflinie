// Automatisches Style-Guide-Review, Teil 3: Barrierefreiheit mit axe-core
// (WCAG 2.0/2.1/2.2 A und AA) auf den echten Seiten, allen Beiträgen des
// Review-Builds und der Styleguide-Ansicht (Liste in pages.js), einmal in der
// Fensterbreite des Projekts und einmal bei 320 px. Bei 320 px gilt zusätzlich
// Reflow (WCAG 1.4.10): kein waagerechtes Scrollen der Seite.
//
// Bekannte, noch offene Befunde stehen in a11y-known.json (Baseline, jeder
// Eintrag „Regel | Selektor“, Schlüssel = Pfad, bei 320 px mit „ @320“). Der
// Test schlägt nur bei NEUEN Verstößen fehl. Behobene Einträge meldet er als
// Hinweis, damit die Baseline schrumpft. Befunde an Inhaltsmustern stehen
// seitenunabhängig in KNOWN_PATTERNS.
// Baseline neu schreiben (nur bewusst, Diff prüfen!): npm run test:a11y:baseline
const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;
const { PAGES } = require('./pages');

const KNOWN_FILE = path.join(__dirname, 'a11y-known.json');
const known = fs.existsSync(KNOWN_FILE) ? JSON.parse(fs.readFileSync(KNOWN_FILE, 'utf8')) : {};
const collected = {};

// Bekannte Befunde, die an einem Inhaltsmuster hängen statt an einer Seite.
// Ein neuer Beitrag mit diesem Muster machte die CI sonst rot, obwohl er nur
// Inhalt ist (STYLEGUIDE ARCH-5). Ein Muster fällt weg, sobald der Befund
// behoben ist oder die Ausnahme endet.
const KNOWN_PATTERNS = [
  // Dokumentierte Ausnahme (STYLEGUIDE 6.5, Owner-Entscheidung 6. 10. 2026,
  // R-95): Der Fußnoten-Rücksprung „↩“ hebt sich im Text nur über die Farbe
  // ab und bleibt so. Er trägt den Namen „Zurück zum Text“
  // (_plugins/inhalts-a11y.rb). Fußnoten-Namen sind Zahlen oder Wörter
  // ([^1], [^quelle]), ein zweiter Verweis hängt :1 an.
  /^link-in-text-block \| (\.reversefootnote|a\[href\$="#fnref:[^"]+"\])$/,
];

// settle: feste Wartezeit für axe (Fraktal-Rendering, Einblendungen). Der
// Reflow-Test misst nur Breiten und wartet bloß auf Schriften und Übergänge.
async function open(page, p, { settle = true } = {}) {
  await page.goto(`/auflinie/${p}`, { waitUntil: 'load' });
  if (settle) await page.waitForTimeout(p === 'mandelbrot/' ? 3000 : 800);
  else await page.evaluate(() => document.fonts.ready);
  // Einblendungen (CRT-Boot, Fade-in) zu Ende laufen lassen: axe liest die
  // berechnete Deckkraft, ein halb eingeblendeter Text gälte als zu blass.
  // Chromium ist nach 800 ms fertig, WebKit malt im Container ohne GPU
  // während des Boots unter einem Bild pro Sekunde. Endlos-Animationen
  // zählen nicht, sie enden nie.
  await page.evaluate(() => Promise.all(document.getAnimations()
    .filter((a) => a.effect && a.effect.getComputedTiming().endTime !== Infinity)
    .map((a) => a.finished.catch(() => {}))));
}

async function axeCheck(page, key) {
  const { violations } = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  const found = [...new Set(violations.flatMap((v) => v.nodes.map((n) => `${v.id} | ${n.target.join(' ')}`)))]
    .sort()
    .filter((f) => !KNOWN_PATTERNS.some((re) => re.test(f)));
  collected[key] = found;
  const base = new Set(known[key] || []);
  const fresh = found.filter((f) => !base.has(f));
  const fixed = [...base].filter((b) => !found.includes(b));
  if (fixed.length) console.log(`${key}: behoben, aus a11y-known.json entfernen:\n  ${fixed.join('\n  ')}`);
  if (!process.env.UPDATE_A11Y) {
    expect(fresh, `Neue Verstöße auf ${key}:\n${fresh.join('\n')}`).toEqual([]);
  }
}

for (const p of PAGES) {
  test(`axe: /${p}`, async ({ page }) => {
    await open(page, p);
    await axeCheck(page, p || '/');
  });
}

test.describe('320 px (WCAG 1.4.10 Reflow)', () => {
  test.use({ viewport: { width: 320, height: 640 } });
  for (const p of PAGES) {
    test(`axe: /${p} @320`, async ({ page }) => {
      await open(page, p);
      await axeCheck(page, `${p || '/'} @320`);
    });

    test(`Reflow: /${p}`, async ({ page }) => {
      await open(page, p, { settle: false });
      // Reflow: Die Seite scrollt nicht waagerecht. Breite Inhalte dürfen in
      // einem eigenen Scroll-Container stehen (Code, Tabellen, 1.4.10
      // nimmt sie aus), sie verbreitern dann nicht die Seite.
      const res = await page.evaluate(() => {
        const vw = document.documentElement.clientWidth;
        const sw = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth);
        const wide = [];
        if (sw > vw + 1) {
          for (const el of document.body.querySelectorAll('*')) {
            const r = el.getBoundingClientRect();
            if (r.width < 1 || r.height < 1 || r.right <= vw + 1) continue;
            const pos = getComputedStyle(el).position;
            if (pos === 'fixed') continue;
            let n = el.parentElement;
            let clipped = false;
            for (; n && n !== document.body; n = n.parentElement) {
              if (getComputedStyle(n).overflowX !== 'visible') { clipped = true; break; }
            }
            if (!clipped) wide.push(`${el.tagName.toLowerCase()}.${[...el.classList].join('.')} rechts ${Math.round(r.right)} px`);
            if (wide.length >= 8) break;
          }
        }
        return { vw, sw, wide };
      });
      expect(res.sw, `/${p} ist bei ${res.vw} px ${res.sw} px breit:\n${res.wide.join('\n')}`).toBeLessThanOrEqual(res.vw + 1);
    });
  }
});

test.afterAll(() => {
  if (!process.env.UPDATE_A11Y) return;
  const merged = { ...known, ...collected };
  fs.writeFileSync(KNOWN_FILE, JSON.stringify(merged, null, 2) + '\n');
});
