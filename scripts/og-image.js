#!/usr/bin/env node
// Vorschaubild beim Teilen (og:image, STYLEGUIDE SEO-3): rendert
// scripts/og-image.html in 1200 × 630 px als JPEG nach
// assets/images/og-vorschaubild.jpg. Motiv: Hero-Grafik mit Namen und
// Adresse (Owner-Entscheidung R-67 vom 6. 10. 2026). Wie das Motiv scharf
// wird, steht im Kopf der Vorlage.
//
// Nötig nur, wenn sich Name, Adresse, Schrift oder background.jpg ändern.
// Schriften: Ubuntu aus assets/webfonts (wie die Seite). Die Adresse steht
// in Ubuntu Mono, die nicht im Repo liegt (die Seite braucht sie nicht).
// Sie kommt aus dem Paket fonts-ubuntu des Rechners, eingehängt in den
// Container (Pfad änderbar über OG_MONO). Gerendert wird im selben
// Playwright-Image wie die Tests (Name und Version in tests/README.md):
//   docker run --rm --user "$(id -u):$(id -g)" -e HOME=/tmp -v "$PWD":/w -w /w \
//     -v /usr/share/fonts/truetype/ubuntu:/usr/share/fonts/truetype/ubuntu:ro \
//     <Playwright-Image> node scripts/og-image.js [ziel.jpg]
// Danach Datei ansehen und Größe prüfen (Ziel unter 150 KB). Neuer
// Dateiname: og_image in _config.yml mitziehen.
//
// Die Vorlage liest background.jpg per Canvas. Unter file:// wäre das Bild
// fremder Herkunft und der Canvas gesperrt, darum liefert page.route die
// Dateien des Repos unter einer erfundenen http-Adresse aus.
const fs = require('fs');
const path = require('path');
const { chromium } = require('@playwright/test');

const ROOT = path.resolve(__dirname, '..');
const ZIEL = path.resolve(process.argv[2] || path.join(ROOT, 'assets/images/og-vorschaubild.jpg'));
const ORIGIN = 'http://og.local';
const MONO = process.env.OG_MONO || '/usr/share/fonts/truetype/ubuntu/UbuntuMono-R.ttf';
const TYPEN = { '.html': 'text/html', '.jpg': 'image/jpeg', '.woff2': 'font/woff2' };
// JPEG-Qualität von Chromium: 88 hält Gitter und Schriftkanten sauber und
// bleibt deutlich unter 150 KB
const QUALITAET = Number(process.env.OG_QUALITAET || 88);
// Mit OG_OHNE_TEXT=1 nur das Motiv (Vergleich mit background.jpg)
const SUCHE = process.env.OG_OHNE_TEXT ? '?ohne-text' : '';
const BREITE = Number(process.env.OG_BREITE || 1200);
const HOEHE = Number(process.env.OG_HOEHE || 630);

(async () => {
  if (!fs.existsSync(MONO)) throw new Error(`Ubuntu Mono fehlt: ${MONO} (fonts-ubuntu einhängen oder OG_MONO setzen)`);
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: BREITE, height: HOEHE }, deviceScaleFactor: 1 });
    await page.route(`${ORIGIN}/**`, (route) => {
      if (new URL(route.request().url()).pathname === '/ubuntu-mono.ttf') {
        return route.fulfill({ body: fs.readFileSync(MONO), contentType: 'font/ttf' });
      }
      const datei = path.join(ROOT, decodeURIComponent(new URL(route.request().url()).pathname));
      if (!datei.startsWith(ROOT + path.sep) || !fs.existsSync(datei)) return route.fulfill({ status: 404 });
      return route.fulfill({
        body: fs.readFileSync(datei),
        contentType: TYPEN[path.extname(datei)] || 'application/octet-stream',
      });
    });
    page.on('pageerror', (err) => { throw err; });
    await page.goto(`${ORIGIN}/scripts/og-image.html${SUCHE}`);
    await page.evaluate(() => window.ogFertig);
    const schriften = await page.evaluate(() => [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family.replace(/"/g, '')));
    for (const name of ['Ubuntu OG', 'Ubuntu Mono OG']) {
      if (!schriften.includes(name)) throw new Error(`Schrift ${name} nicht geladen`);
    }
    await page.screenshot({ path: ZIEL, type: 'jpeg', quality: QUALITAET });
    console.log(`${path.relative(ROOT, ZIEL)}: ${BREITE} × ${HOEHE}, ${(fs.statSync(ZIEL).size / 1024).toFixed(1)} KB`);
  } finally {
    await browser.close();
  }
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
