#!/bin/bash
set -euo pipefail

echo "===================================="
echo "Jekyll Setup"
echo "===================================="

# Claude config volume: Docker legt benannte Volumes als root:root an.
# Damit der vscode-User die Credentials (~/.claude/.credentials.json) schreiben
# und der Login Rebuilds überdauert, muss das Mount ihm gehören.
if [ -d /home/vscode/.claude ]; then
    echo "Fixing permissions on Claude config volume..."
    sudo chown -R vscode:vscode /home/vscode/.claude
fi

# Ruby und Node kommen vorgebaut aus den Dev-Container-Features, ihre Nummern
# in devcontainer.json spiegeln .ruby-version und .nvmrc (kein Quelltext-Build,
# Anlegen in Sekunden statt Minuten). Gleichstand prüft die CI
# (scripts/version-sync-check.sh, STYLEGUIDE DOC-7).

echo "Installing Bundler (Version aus Gemfile.lock)..."
BUNDLER_VERSION="$(awk '/^BUNDLED WITH$/ { getline; print $1 }' Gemfile.lock)"
gem install bundler -v "${BUNDLER_VERSION}" --no-document

echo "Installing Jekyll dependencies..."
bundle config set --local path vendor/bundle
bundle install

echo "Installing lint and test tooling (npm ci)..."
npm ci

# Commit-Hook gegen STYLEGUIDE GIT-1, GIT-7 und GIT-8 (README_DEV.md)
git config core.hooksPath .githooks

echo ""
echo "Optional: Browser für die Playwright-Tests einrichten mit:  bash .devcontainer/setup-e2e.sh"
echo ""
echo "===================================="
echo "Setup complete!"
echo "   Ruby: $(ruby -v)"
echo "   Bundler: $(bundle -v)"
echo "   Node: $(node --version)"
echo "===================================="
