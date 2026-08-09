# SPA-Navigations-Regressionstests (#6)

Headless-Regressionstests (Playwright) für die Persistent-Shell-Navigation
(`assets/js/spa-nav.js`, siehe [`README-spa-nav.md`](../README-spa-nav.md)).
Sie nageln die „bricht-nichts"-Invarianten fest, damit künftige Änderungen das
Fundament nicht heimlich brechen.

> **Status:** Gerüst. Bewusst **nicht** in `package.json`/`package-lock.json`
> verdrahtet (hält die npm-Lock/CI unberührt) und aus dem Jekyll-Build
> ausgeschlossen (`_config.yml`). Zum Ausführen einmalig einrichten:

## Einrichten & ausführen

### Im Devcontainer (empfohlen)

```bash
# 1) einmalig: Playwright + Chromium + System-Libs (opt-in, nicht in post-create)
bash .devcontainer/setup-e2e.sh

# 2) Seite servieren (baseurl = /auflinie)
bundle exec jekyll serve          # -> http://localhost:4000/auflinie/

# 3) Tests (zweites Terminal)
npm run test:e2e                  # oder: npx playwright test
```

### Lokal (ohne Devcontainer)

```bash
npm install --no-save @playwright/test   # ohne package.json/Lock zu ändern
npx playwright install chromium
bundle exec jekyll serve                 # -> http://localhost:4000/auflinie/
npm run test:e2e
#   anderes Setup/Port:
BASE_URL=http://127.0.0.1:8080 npm run test:e2e
```

## Was geprüft wird

- **Verdrahteter Link** (Home → Über mich): Same-Document-**Swap** (window
  überlebt, kein Voll-Reload), Aktiv-Marker wandert mit, Masthead steht.
- **Nicht-verdrahteter Link / CDN-Deps** (Mandelbrot): **Voll-Reload**
  (`needsFullLoad`-Leitplanke).
- **Modifier-Klick** (Strg/Cmd): wird **nicht** abgefangen.
- **Zurück** nach Swap: stellt die vorige Seite wieder her.
- **Ohne JavaScript**: Navigation bleibt nativ (Progressive Enhancement).

## Hinweise

- Selektoren gehen von der aktuellen Navigation (`_data/navigation.yml`) aus —
  falls sich Nav-Links ändern, ggf. in `spa-nav.spec.js` anpassen.
- Die View-Transition-/Kanalwechsel-Optik wird hier bewusst **nicht** visuell
  geprüft (das braucht ein Auge); getestet wird das **Verhalten** (Swap vs.
  Reload, History, PE).
