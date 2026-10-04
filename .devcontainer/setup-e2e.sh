#!/bin/bash
# Opt-in: Browser für die Playwright-Tests (tests/) im Dev Container.
# @playwright/test selbst installiert schon post-create.sh per npm ci, in der
# Version aus package-lock.json (STYLEGUIDE DOC-7). Hier kommen Chromium,
# Firefox und WebKit samt System-Bibliotheken dazu, passend zu genau dieser
# Version. Die Suite prüft das Verhalten in allen drei Engines (Projekte in
# playwright.config.js, STYLEGUIDE BRW-2). Bewusst nicht in post-create.sh:
# hält das Anlegen des Containers schnell (kein Browser-Download von einigen
# hundert MB bei jedem Rebuild).
# Einmalig ausführen, wenn die Tests im Container laufen sollen:
#     bash .devcontainer/setup-e2e.sh
set -euo pipefail

echo "Installiere Chromium, Firefox, WebKit und System-Bibliotheken für Playwright (braucht sudo/apt)..."
npx playwright install --with-deps chromium firefox webkit

echo ""
echo "Fertig. So laufen die Tests:"
echo "  1) Seite bauen:   JEKYLL_ENV=production bundle exec jekyll build --unpublished -d _site_review"
echo "  2) Tests:         npx playwright test   (startet tests/serve.js selbst)"
echo "Vergleichsbilder (tests/visual/) gelten nur im Playwright-Container wie in der CI (tests/README.md)."
