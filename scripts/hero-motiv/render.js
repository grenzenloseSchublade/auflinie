#!/usr/bin/env node
// Eigenes Hero-Motiv: rendert scripts/hero-motiv/generator.html zweimal als
// JPEG, das Motiv in 1920 × 1024 px nach assets/images/hero-eigen.jpg und
// das Vorschaubild beim Teilen (1200 × 630, Name und Adresse) nach
// assets/images/og-vorschaubild-eigen.jpg. Umstellen der Seite auf das
// Motiv: docs/pflege.md, Abschnitt „Hero-Motiv wechseln“.
//
// Nötig nur, wenn sich das Motiv, Name, Adresse oder die Schrift ändern.
// Gerendert wird im selben Playwright-Image wie die Tests (Name und Version
// in tests/README.md). Ubuntu Mono kommt wie bei scripts/og-image.js aus dem
// Paket fonts-ubuntu des Rechners (Pfad änderbar über OG_MONO):
//   docker run --rm --user "$(id -u):$(id -g)" -e HOME=/tmp -v "$PWD":/w -w /w \
//     -v /usr/share/fonts/truetype/ubuntu:/usr/share/fonts/truetype/ubuntu:ro \
//     <Playwright-Image> node scripts/hero-motiv/render.js [zielordner]
// Ohne Zielordner landen beide Dateien in assets/images/. Danach ansehen und
// Größen prüfen: Motiv unter 150 KB (IMG-2 und PERF-2, die Qualität sinkt
// dafür von selbst in Zweierschritten), Vorschaubild unter 150 KB.
//
// Der Generator lädt Schriften per @font-face. Unter file:// wären sie
// fremder Herkunft, darum liefert page.route die Dateien des Repos unter
// einer erfundenen http-Adresse aus.
const fs = require('fs');
const path = require('path');
const { chromium } = require('@playwright/test');

const ROOT = path.resolve(__dirname, '../..');
const ZIEL = path.resolve(process.argv[2] || path.join(ROOT, 'assets/images'));
const ORIGIN = 'http://motiv.local';
const MONO = process.env.OG_MONO || '/usr/share/fonts/truetype/ubuntu/UbuntuMono-R.ttf';
const TYPEN = { '.html': 'text/html', '.woff2': 'font/woff2' };
const SEITE = `${ORIGIN}/scripts/hero-motiv/generator.html`;
const HERO_GRENZE = 150 * 1024;
const HERO_BREITE = 1920;
const HERO_HOEHE = 1024;
const OG_GRENZE = 150 * 1024;

async function oeffnen(browser, breite, hoehe, suche) {
  const page = await browser.newPage({ viewport: { width: breite, height: hoehe }, deviceScaleFactor: 1 });
  await page.route(`${ORIGIN}/**`, (route) => {
    const pfad = decodeURIComponent(new URL(route.request().url()).pathname);
    if (pfad === '/ubuntu-mono.ttf') return route.fulfill({ body: fs.readFileSync(MONO), contentType: 'font/ttf' });
    const datei = path.join(ROOT, pfad);
    if (!datei.startsWith(ROOT + path.sep) || !fs.existsSync(datei)) return route.fulfill({ status: 404 });
    return route.fulfill({ body: fs.readFileSync(datei), contentType: TYPEN[path.extname(datei)] || 'application/octet-stream' });
  });
  page.on('pageerror', (err) => { throw err; });
  await page.goto(SEITE + suche);
  await page.evaluate(() => window.fertig);
  return page;
}

function melden(datei, breite, hoehe, extra) {
  const kb = (fs.statSync(datei).size / 1024).toFixed(1);
  console.log(`${path.relative(process.cwd(), datei)}: ${breite} × ${hoehe}, ${kb} KB${extra}`);
}

(async () => {
  if (!fs.existsSync(MONO)) throw new Error(`Ubuntu Mono fehlt: ${MONO} (fonts-ubuntu einhängen oder OG_MONO setzen)`);
  fs.mkdirSync(ZIEL, { recursive: true });
  const browser = await chromium.launch();
  try {
    // Motiv: höchste Qualität, die unter die Grenze passt
    const hero = await oeffnen(browser, HERO_BREITE, HERO_HOEHE, '');
    let q = 90;
    let bild;
    for (; q >= 50; q -= 2) {
      bild = await hero.screenshot({ type: 'jpeg', quality: q });
      if (bild.length < HERO_GRENZE) break;
    }
    if (bild.length >= HERO_GRENZE) throw new Error('hero-eigen.jpg bleibt auch bei Qualität 50 über 150 KB');
    const heroDatei = path.join(ZIEL, 'hero-eigen.jpg');
    fs.writeFileSync(heroDatei, bild);
    melden(heroDatei, HERO_BREITE, HERO_HOEHE, `, Qualität ${q}`);

    // Vorschaubild: Schriften müssen wirklich geladen sein
    const og = await oeffnen(browser, 1200, 630, '?og');
    const schriften = await og.evaluate(() => [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family.replace(/"/g, '')));
    for (const name of ['Ubuntu OG', 'Ubuntu Mono OG']) {
      if (!schriften.includes(name)) throw new Error(`Schrift ${name} nicht geladen`);
    }
    const ogDatei = path.join(ZIEL, 'og-vorschaubild-eigen.jpg');
    await og.screenshot({ path: ogDatei, type: 'jpeg', quality: 88 });
    if (fs.statSync(ogDatei).size >= OG_GRENZE) throw new Error('og-vorschaubild-eigen.jpg über 150 KB');
    melden(ogDatei, 1200, 630, '');
  } finally {
    await browser.close();
  }
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
