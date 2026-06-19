#!/bin/bash
set -euo pipefail

echo "===================================="
echo "Python 3.11 & Jekyll Setup"
echo "===================================="

# Claude config volume: Docker legt benannte Volumes als root:root an.
# Damit der vscode-User die Credentials (~/.claude/.credentials.json) schreiben
# und der Login Rebuilds überdauert, muss das Mount ihm gehören.
if [ -d /home/vscode/.claude ]; then
    echo "Fixing permissions on Claude config volume..."
    sudo chown -R vscode:vscode /home/vscode/.claude
fi

# Ruby Build Dependencies
echo "Installing Ruby build dependencies..."
sudo apt-get update
sudo apt-get install -y \
    autoconf bison build-essential \
    libssl-dev libyaml-dev libreadline-dev \
    zlib1g-dev libncurses5-dev \
    libffi-dev libgdbm-dev libgdbm6 \
    git curl

# rbenv Installation
echo "Installing rbenv..."
if [ ! -d "$HOME/.rbenv" ]; then
    git clone https://github.com/rbenv/rbenv.git ~/.rbenv
fi

export PATH="$HOME/.rbenv/bin:$PATH"
eval "$(rbenv init -)"

if ! grep -q 'rbenv init' ~/.bashrc; then
    echo 'export PATH="$HOME/.rbenv/bin:$PATH"' >> ~/.bashrc
    echo 'eval "$(rbenv init -)"' >> ~/.bashrc
fi

# ruby-build Plugin
echo "Installing ruby-build plugin..."
if [ ! -d "$HOME/.rbenv/plugins/ruby-build" ]; then
    git clone https://github.com/rbenv/ruby-build.git ~/.rbenv/plugins/ruby-build
fi

# Ruby Installation (Version siehe .ruby-version — mit CI abgestimmt)
RUBY_VERSION="$(tr -d '\r\n' < "${PWD}/.ruby-version")"
echo "Installing Ruby ${RUBY_VERSION} (einige Minuten)..."
rbenv install "${RUBY_VERSION}" --skip-existing
rbenv global "${RUBY_VERSION}"

# RubyGems & Bundler (an Gemfile.lock »BUNDLED WITH« angeglichen)
echo "Updating RubyGems..."
gem update --system 4.0.10

echo "Installing Bundler (Version aus Gemfile.lock)..."
gem install bundler -v 4.0.10 --no-document

# Python pip
echo "Upgrading pip..."
pip install --upgrade pip

# Jekyll Setup
echo "Installing Jekyll dependencies..."
bundle config set --local path vendor/bundle
bundle install

echo "===================================="
echo "Setup complete!"
echo "   Ruby: $(ruby -v)"
echo "   Bundler: $(bundle -v)"
echo "   Python: $(python --version)"
echo "===================================="
