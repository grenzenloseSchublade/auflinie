// Playwright-Konfiguration für die SPA-Navigations-Regressionstests (#6).
//
// Voraussetzungen (einmalig / lokal — bewusst NICHT in package.json, damit die
// npm-Lock/CI unberührt bleibt):
//   1) npm install -D @playwright/test
//   2) npx playwright install chromium
//   3) Seite lokal servieren, z.B.:  bundle exec jekyll serve
//      -> http://localhost:4000/auflinie/  (baseurl = /auflinie)
//   4) npx playwright test
// Basis-URL überschreibbar via BASE_URL (z.B. für ein anderes Port/Setup).
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 30_000,
  expect: { timeout: 7_000 },
  fullyParallel: true,
  reporter: 'list',
  use: {
    baseURL: process.env.BASE_URL || 'http://127.0.0.1:4000',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
