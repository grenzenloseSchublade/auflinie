#!/bin/bash
# Opt-in Setup für die SPA-Navigations-Regressionstests (#6) im Devcontainer.
# Bewusst NICHT in post-create.sh / package.json-Lock: hält den Container-Setup
# schnell (kein ~150-MB-Browser-Download bei jedem Rebuild) und `npm ci` strikt.
# Einmalig ausführen, wenn du die E2E-Tests laufen lassen willst:
#     bash .devcontainer/setup-e2e.sh
set -euo pipefail

echo "Installiere @playwright/test (lokal, ohne package.json/Lock zu ändern)..."
npm install --no-save --no-package-lock @playwright/test

echo "Installiere Chromium + System-Libs (braucht sudo/apt im Container)..."
npx playwright install --with-deps chromium

echo ""
echo "Fertig. So testen:"
echo "  1) Seite servieren:   bundle exec jekyll serve   (-> http://localhost:4000/auflinie/)"
echo "  2) Tests laufen:       npm run test:e2e           (oder: npx playwright test)"
echo "     anderes Setup:      BASE_URL=http://127.0.0.1:PORT npm run test:e2e"
