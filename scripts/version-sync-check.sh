#!/bin/bash
# Versions-Gleichstand Dev Container (STYLEGUIDE DOC-7)
#
# Der Dev Container nimmt Ruby und Node vorgebaut aus den Features in
# .devcontainer/devcontainer.json. Die Features brauchen dort eine Nummer,
# ein Quelltext-Build aus .ruby-version kostete beim Anlegen Minuten. Die
# einzige Quelle bleiben .ruby-version und .nvmrc, dieser Check verlangt,
# dass die Feature-Nummern sie exakt spiegeln.
set -euo pipefail
cd "$(dirname "$0")/.."

fehler=0
pruefe() {
  local name="$1" quelle="$2" soll="$3" ist="$4"
  if [ "$soll" != "$ist" ]; then
    echo "Versions-Check: $name in .devcontainer/devcontainer.json ist \"$ist\", $quelle sagt \"$soll\"" >&2
    fehler=1
  fi
}

feature_version() {
  python3 - "$1" <<'PY'
import json, sys
features = json.load(open('.devcontainer/devcontainer.json'))['features']
key = next((k for k in features if k.startswith(sys.argv[1])), None)
print(features.get(key, {}).get('version', '') if key else '')
PY
}

pruefe Ruby .ruby-version "$(tr -d '[:space:]' < .ruby-version)" "$(feature_version ghcr.io/devcontainers/features/ruby:)"
pruefe Node .nvmrc "$(tr -d '[:space:]' < .nvmrc)" "$(feature_version ghcr.io/devcontainers/features/node:)"

if [ "$fehler" -ne 0 ]; then exit 1; fi
echo "Versions-Check OK: Dev Container spiegelt .ruby-version und .nvmrc"
