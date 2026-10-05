// Service-Worker-Precache vollständig (STYLEGUIDE 11.5, Zusage „alles ist
// precached“ in service-worker.js): Jede Datei unter /assets/, die eine
// Seite aus CACHE_URLS per src oder href lädt, steht selbst in CACHE_URLS.
// Sonst bekommt sie nach einem SW-Update offline nur die 404-Antwort des
// cacheFirst-Pfads, und online mischt sie Build-Stände.
// Ausgenommen: Downloads (Netz genügt) und die Styleguide-Ansicht (SG-1).
const { test, expect } = require('@playwright/test');

const BASE = '/auflinie/';
const EXEMPT = [/^assets\/downloads\//, /^assets\/css\/styleguide\.css$/];

test('Precache-Liste enthält jedes Asset der gebauten Seiten', async ({ request }) => {
  const sw = await (await request.get(BASE + 'service-worker.js')).text();
  const cached = new Set([...sw.matchAll(/'\.\/([^']*)'/g)].map((m) => m[1]));
  const pages = [...cached].filter((u) => u === '' || u.endsWith('/') || u.endsWith('.html'));
  expect(pages.length).toBeGreaterThan(5);

  const missing = new Set();
  for (const p of pages) {
    const res = await request.get(BASE + p);
    if (!res.ok()) continue;   // z. B. die Styleguide-Ansicht, nur im Review-Build
    const html = await res.text();
    for (const m of html.matchAll(/(?:src|href)="\/auflinie\/(assets\/[^"#?]+)"/g)) {
      if (!cached.has(m[1]) && !EXEMPT.some((re) => re.test(m[1]))) missing.add(`${m[1]} (${p || '/'})`);
    }
  }
  expect([...missing]).toEqual([]);
});

// Gegenrichtung: Jeder Eintrag in CACHE_URLS existiert. Ein toter Eintrag
// (gelöschte Datei, etwa nach dem Ausbau der SPA-Navigation) fiele sonst
// nicht auf, weil die Installation einzelne Fehler still übergeht.
test('Precache-Liste nennt nur vorhandene Dateien', async ({ request }) => {
  const sw = await (await request.get(BASE + 'service-worker.js')).text();
  const assets = [...sw.matchAll(/'\.\/([^']*)'/g)].map((m) => m[1]).filter((u) => u.startsWith('assets/'));
  expect(assets.length).toBeGreaterThan(10);
  const dead = [];
  for (const a of assets) {
    if (!(await request.get(BASE + a)).ok()) dead.push(a);
  }
  expect(dead).toEqual([]);
});
