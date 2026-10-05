// Playwright: Seitenwechsel und Seiten-Module (tests/navigation.spec.js),
// Service Worker offline (tests/sw.spec.js), Vendor-Regressionstests (tests/vendor.spec.js: MathJax, noUiSlider,
// Tom Select auf /mandelbrot/) und das automatische Style-Guide-Review (tests/visual/: Screenshot-Vergleich der
// Styleguide-Ansicht, Kontrast, axe-core WCAG 2.2 AA).
// Chromium prüft alles, Firefox und WebKit die Verhaltens-Tests (Projekte
// unten, Übersicht in tests/README.md).
//
// Die Seite muss vorher MIT unveröffentlichten Seiten gebaut sein, damit die
// Styleguide-Ansicht existiert (sie wird nie deployt, STYLEGUIDE.md SG-1):
//   JEKYLL_ENV=production bundle exec jekyll build --unpublished -d _site_review
// Der webServer unten liefert _site_review unter /auflinie aus.
//
// Screenshots sind plattformabhängig (Schriften, Rendering). Vergleichsbilder
// deshalb NUR im Playwright-Container erzeugen und prüfen, wie in der CI.
// --user hält die neuen Bilder beim eigenen Benutzer statt bei root:
//   docker run --rm --ipc=host --user "$(id -u):$(id -g)" -e HOME=/tmp \
//     -v "$PWD":/w -w /w mcr.microsoft.com/playwright:v1.63.0-noble \
//     npx playwright test tests/visual --update-snapshots
// Basis-URL überschreibbar via BASE_URL, Site-Verzeichnis via SITE_DIR.
const { defineConfig, devices } = require('@playwright/test');

const PORT = 4100;
// Verhaltens-Tests, die zusätzlich in Firefox und WebKit laufen (siehe projects)
const NAV_SPECS = ['navigation.spec.js', 'vendor.spec.js'];
const UI_SPECS = ['visual/invariants.spec.js', 'visual/a11y.spec.js', 'visual/blog-search.spec.js'];
const REDUCE = { contextOptions: { reducedMotion: 'reduce' } };
const FIREFOX = { ...devices['Desktop Firefox'], viewport: { width: 1280, height: 900 } };
// deviceScaleFactor 1 statt 2 wie das Safari-Profil: ohne GPU malt WebKit im
// Container sonst die vierfache Pixelzahl, für Verhaltens-Tests ohne Nutzen
const WEBKIT = { ...devices['Desktop Safari'], viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 };
const external = !!process.env.BASE_URL;

module.exports = defineConfig({
  testDir: './tests',
  timeout: 60_000,
  expect: {
    timeout: 7_000,
    // Absolute, sehr kleine Toleranz: im selben Container rendert Chromium
    // deterministisch. Eine Prozent-Toleranz ließ bei großen Abschnitten
    // kleine echte Änderungen (Strich, 1-px-Abstand) durchrutschen.
    toHaveScreenshot: { maxDiffPixels: 8, animations: 'disabled', caret: 'hide' },
  },
  snapshotPathTemplate: '{testDir}/visual/__screenshots__/{projectName}/{arg}{ext}',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // Ein Wiederholungslauf in der CI fängt seltene Timing-Ausreißer ab; der
  // Bericht markiert solche Tests als „flaky“, sie bleiben also sichtbar.
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]] : 'list',
  use: {
    baseURL: process.env.BASE_URL || `http://127.0.0.1:${PORT}`,
    // retain-on-failure statt on-first-retry: ohne konfigurierte retries
    // (Default 0) entstünde bei Fehlschlägen sonst nie ein Trace
    trace: 'retain-on-failure',
    serviceWorkers: 'block',
  },
  webServer: external ? undefined : {
    command: `node tests/serve.js ${process.env.SITE_DIR || '_site_review'} ${PORT}`,
    url: `http://127.0.0.1:${PORT}/auflinie/`,
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    { name: 'navigation', testMatch: 'navigation.spec.js', use: { ...devices['Desktop Chrome'] } },
    // Service Worker echt registriert (sonst überall 'block', siehe use oben)
    { name: 'sw', testMatch: 'sw.spec.js', use: { ...devices['Desktop Chrome'], serviceWorkers: 'allow' } },
    { name: 'vendor', testMatch: 'vendor.spec.js', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 900 } } },
    { name: 'desktop', testMatch: 'visual/**/*.spec.js', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 900 } } },
    { name: 'mobil', testMatch: 'visual/styleguide.spec.js', use: { ...devices['Pixel 7'] } },
    // Firefox und WebKit (STYLEGUIDE BRW-2): nur die Verhaltens-Tests.
    // Screenshot-Vergleich (styleguide.spec.js) und Kontrast (contrast.spec.js)
    // bleiben bewusst bei Chromium: Rendering, Schriftglättung und Farbmischung
    // sind browserabhängig, eigene Vergleichsbilder je Engine verdreifachten
    // die Pflege, ohne eine Regel besser zu prüfen. Die Namen der Chromium-
    // Projekte bleiben, sie stecken im Pfad der Vergleichsbilder.
    { name: 'firefox', testMatch: [...NAV_SPECS, ...UI_SPECS], use: FIREFOX },
    // Primärplattform des Owners: Firefox mit Reduced Motion (BRW-2)
    { name: 'firefox-reduce', testMatch: NAV_SPECS, use: { ...FIREFOX, ...REDUCE } },
    { name: 'webkit', testMatch: UI_SPECS, use: WEBKIT },
    // Seitenwechsel in WebKit nur mit Reduced Motion: Im Container ohne GPU
    // malt WebKit Animationen mit unter einem Bild pro Sekunde (Register
    // R-87). Unter Reduced Motion läuft die View Transition mit Dauer null.
    { name: 'webkit-reduce', testMatch: NAV_SPECS, use: { ...WEBKIT, ...REDUCE } },
  ],
});
