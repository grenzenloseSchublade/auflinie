#!/bin/bash
# Versions-Gleichstand Dev Container (STYLEGUIDE DOC-7)
#
# Der Dev Container nimmt Ruby und Node vorgebaut aus den Features in
# .devcontainer/devcontainer.json. Die Features brauchen dort eine Nummer,
# ein Quelltext-Build aus .ruby-version kostete beim Anlegen Minuten. Die
# einzige Quelle bleiben .ruby-version und .nvmrc, dieser Check verlangt,
# dass die Feature-Nummern sie exakt spiegeln.
#
# Playwright: Quelle ist @playwright/test in package.json (exakte Version).
# package-lock.json und jedes Container-Image mcr.microsoft.com/playwright:vX
# (Workflow, playwright.config.js, Doku) müssen dieselbe Version tragen,
# sonst passen Browser-Builds und Vergleichsbilder nicht zur Bibliothek.
set -euo pipefail
cd "$(dirname "$0")/.."

fehler=0
pruefe() {
  local name="$1" quelle="$2" soll="$3" ist="$4"
  local ort="${5:-.devcontainer/devcontainer.json}"
  if [ "$soll" != "$ist" ]; then
    echo "Versions-Check: $name in $ort ist \"$ist\", $quelle sagt \"$soll\"" >&2
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

PW=$(python3 -c "import json; print(json.load(open('package.json'))['devDependencies']['@playwright/test'])")
case "$PW" in
  [0-9]*.[0-9]*.[0-9]*) ;;
  *) echo "Versions-Check: @playwright/test in package.json ist \"$PW\", gebraucht wird eine exakte Version (ohne ^ oder ~), passend zum Container-Image" >&2; fehler=1 ;;
esac
pruefe Playwright package.json "$PW" \
  "$(python3 -c "import json; print(json.load(open('package-lock.json'))['packages']['node_modules/@playwright/test']['version'])")" \
  package-lock.json
treffer=0
while IFS=: read -r datei zeile bild; do
  treffer=$((treffer + 1))
  pruefe Playwright-Image package.json "v$PW" "${bild#mcr.microsoft.com/playwright:}" "$datei:$zeile"
done < <(grep -rnoE 'mcr\.microsoft\.com/playwright:v[0-9]+\.[0-9]+\.[0-9]+' \
  .github/workflows playwright.config.js tests/README.md README.md README_DEV.md .devcontainer docs 2>/dev/null)
if [ "$treffer" -eq 0 ]; then
  echo "Versions-Check: kein Playwright-Image im Workflow gefunden (Muster mcr.microsoft.com/playwright:vX.Y.Z)" >&2
  fehler=1
fi

if [ "$fehler" -ne 0 ]; then exit 1; fi
echo "Versions-Check OK: Dev Container spiegelt .ruby-version und .nvmrc, Playwright $PW überall gleich ($treffer Image-Angaben)"
