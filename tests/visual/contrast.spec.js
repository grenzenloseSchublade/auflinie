// Automatisches Style-Guide-Review, Teil 2: Kontrast der Farb-Tokens.
// Jede Textprobe [data-sg-min] in der Styleguide-Ansicht wird mit ihrem
// tatsächlichen Hintergrund verrechnet (Alpha-Kanäle werden über die
// Vorfahren-Hintergründe gemischt) und muss den geforderten Wert erreichen
// (WCAG 2.2 AA, STYLEGUIDE.md FARB-2). Ausnahmen tragen die Regel-ID.
const { test, expect } = require('@playwright/test');

test('Text-Tokens erreichen ihren Mindestkontrast', async ({ page }) => {
  await page.goto('/auflinie/styleguide/', { waitUntil: 'load' });
  const results = await page.locator('[data-sg-min]').evaluateAll((els) => {
    function parse(c) {
      const m = c.match(/rgba?\(([^)]+)\)/);
      if (!m) return [0, 0, 0, 0];
      const p = m[1].split(/[\s,/]+/).filter(Boolean).map(Number);
      return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1];
    }
    function over(top, bottom) {
      const a = top[3] + bottom[3] * (1 - top[3]);
      if (a === 0) return [0, 0, 0, 0];
      return [0, 1, 2].map((k) => (top[k] * top[3] + bottom[k] * bottom[3] * (1 - top[3])) / a).concat(a);
    }
    function lum(c) {
      const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
      return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]);
    }
    return els.map((el) => {
      // Hintergrund: von unten (html) nach oben bis zum Element aufschichten
      const chain = [];
      for (let n = el; n; n = n.parentElement) chain.unshift(parse(getComputedStyle(n).backgroundColor));
      let bg = [0, 0, 0, 1];
      chain.forEach((c) => { bg = over(c, bg); });
      const fg = over(parse(getComputedStyle(el).color), bg);
      const l1 = lum(fg), l2 = lum(bg);
      return {
        name: el.dataset.sgName,
        min: Number(el.dataset.sgMin),
        exception: el.dataset.sgException || null,
        ratio: (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05),
      };
    });
  });
  expect(results.length).toBeGreaterThan(0);
  const failures = results.filter((r) => r.ratio + 1e-9 < r.min)
    .map((r) => `${r.name}: ${r.ratio.toFixed(2)}:1 < ${r.min}:1${r.exception ? ` (Ausnahme ${r.exception})` : ''}`);
  expect(failures, failures.join('\n')).toEqual([]);
  for (const r of results.filter((x) => x.exception)) {
    expect(r.exception, `${r.name}: Ausnahme ohne Regel-ID`).toMatch(/^[A-Z]+-\d+[a-z]?$/);
  }
});
