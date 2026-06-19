# Dev Container: Python 3.11 & Jekyll

Vollständig konfigurierte Entwicklungsumgebung für Jekyll-Projekte mit Python 3.11, Ruby 3.4.8 und Node.js LTS.

## Stack

- **Python** 3.11
- **Ruby** 3.4.1 (via rbenv)
- **Jekyll** + Bundler (vendor/bundle)
- **Node.js** LTS + Corepack
- **GitHub CLI**

## Ports

- `4000` - Jekyll dev server
- `8888` - Python

## Setup

```bash
# Container starten
F1 -> "Reopen in Container"

# Verifizieren
ruby -v
bundle -v
bundle exec jekyll -v
```

## Shortcut 

| Aspekt             | Was passiert                | Wann                | Warum                                           |
| ------------------ | --------------------------- | ------------------- | ----------------------------------------------- |
| onCreateCommand    | Entfernt Yarn-Repo          | Einmalig beim Build | Verhindert GPG-Fehler                           |
| postCreateCommand  | Ruby + pip + bundle install | Einmalig beim Build | Installiert alle Dependencies                   |
| postStartCommand   | Jekyll-Version-Check        | Bei jedem Start     | Validiert Jekyll funktioniertcode.visualstudio​ |
| bundle config path | Setzt vendor/bundle         | Beim Build          | Gems lokal installierenbundler​                 |
| KEIN PATH          | vendor/bundle NICHT im PATH | -                   | Verhindert Permission-Fehler                    |


## postCreateCommand

1. System-Dependencies installieren
2. rbenv + Ruby 3.4.8 kompilieren
3. gem update --system 4.0.10
4. pip upgrade
5. bundle install (vendor/bundle)

**Erste Installation: 3-5 Min. (Ruby-Kompilierung)**

## Lifecycle

```
onCreateCommand: Entfernt Yarn-APT-Repository (GPG-Fix)
postCreateCommand: Ruby + pip + bundle install (nur Build)
postStartCommand: Jekyll-Check (jeden Start)
```

## Usage

```bash
# Jekyll starten
bundle exec jekyll serve
# → http://localhost:4000

# Gems hinzufügen
bundle add gemname

# Python
python script.py
```

## Troubleshooting

| Problem | Lösung |
|---------|--------|
| "bundle: not found" | `source ~/.bashrc && bundle ...` |
| Slow startup (1. Build) | Normal - Ruby wird kompiliert |
| Yarn GPG-Fehler | ✅ onCreateCommand behebt das |
| Permission denied | ✅ vendor/bundle nicht im PATH |

## Ändern

**Ruby-Version:** `.devcontainer/post-create.sh` → `rbenv install X.X.X`

**Extensions:** `devcontainer.json` → `customizations.vscode.extensions`

**Ports:** `devcontainer.json` → `forwardPorts`

---

**Status:** Production-Ready | **Updated:** Jan 2026
