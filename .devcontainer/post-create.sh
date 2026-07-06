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

# Ruby kommt aus dem Devcontainer-Feature (ghcr.io/devcontainers/features/ruby,
# Version in devcontainer.json an .ruby-version angleichen) — kein rbenv-Source-
# Build mehr; Container-Setup dauert Sekunden statt Minuten.

echo "Installing Bundler (Version aus Gemfile.lock)..."
gem install bundler -v 4.0.10 --no-document

echo "Installing Jekyll dependencies..."
bundle config set --local path vendor/bundle
bundle install

echo "Installing lint tooling (Stylelint)..."
npm ci

echo "===================================="
echo "Setup complete!"
echo "   Ruby: $(ruby -v)"
echo "   Bundler: $(bundle -v)"
echo "   Node: $(node --version)"
echo "===================================="
