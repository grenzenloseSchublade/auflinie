# Dev Container

Entwicklungsumgebung für Jekyll (Ruby) und das Node-Werkzeug (Stylelint, ESLint, Playwright), auf Basis von `mcr.microsoft.com/devcontainers/python:3.11`.

## Versionen

Die einzige Quelle jeder Version ist eine Datei im Repo (STYLEGUIDE DOC-7):

| Werkzeug | Quelle | Installiert von |
|---|---|---|
| Ruby | `.ruby-version` | Ruby-Feature, vorgebaut. Die Nummer in `devcontainer.json` spiegelt die Datei |
| Bundler | `Gemfile.lock` (`BUNDLED WITH`) | `gem install bundler` in `post-create.sh` |
| Gems | `Gemfile.lock` | `bundle install` nach `vendor/bundle` |
| Node | `.nvmrc` | Node-Feature. Die Nummer in `devcontainer.json` spiegelt die Datei |
| npm-Pakete | `package-lock.json` | `npm ci` |

Die Features brauchen eine Nummer in `devcontainer.json`, ein Bau von Ruby aus dem Quelltext kostete beim Anlegen Minuten. Dass beide Nummern zu `.ruby-version` und `.nvmrc` passen, prüft die CI mit `scripts/version-sync-check.sh`.

## Ablauf

| Schritt | Was passiert | Wann |
|---|---|---|
| Image-Bau | Features: Ruby, Node, GitHub CLI, Claude Code | einmal, Docker cached das Image |
| `onCreateCommand` | entfernt das Yarn-APT-Repository (verhindert GPG-Fehler) | einmal beim Anlegen |
| `postCreateCommand` | `post-create.sh`: Rechte am Claude-Volume, Bundler, `bundle install`, `npm ci` | einmal beim Anlegen |

## Nutzung

```bash
# Prüfen
ruby -v && bundle -v && node --version

# Jekyll lokal
bundle exec jekyll serve
# → http://localhost:4000/auflinie/

# Lint
npm run lint:css && npm run lint:js
```

Playwright-Tests im Container brauchen einmalig Chromium: `bash .devcontainer/setup-e2e.sh`. Die Vergleichsbilder in `tests/visual/` gelten nur im Playwright-Container wie in der CI (`tests/README.md`).

Port `4000` ist weitergeleitet (Jekyll).

## Fehlersuche

| Problem | Lösung |
|---|---|
| `bundle: not found` | Terminal neu öffnen, dann `bundle -v` |
| Yarn-GPG-Fehler beim Bau | erledigt `onCreateCommand` |

## Ändern

- Ruby, Node: Versionsdatei im Repo und die Feature-Nummer in `devcontainer.json` im selben Commit ändern (die CI prüft den Gleichstand), dann „Rebuild Container“
- Bundler: nur `Gemfile.lock`
- Extensions: `devcontainer.json` → `customizations.vscode.extensions`
- Ports: `devcontainer.json` → `forwardPorts`
