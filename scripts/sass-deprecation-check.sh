#!/bin/bash
# Sass-Deprecation-Check (STYLEGUIDE.md SCSS-2, SCSS-3)
#
# Der normale Build läuft mit `quiet_deps: true`. Für Dart Sass ist jede Datei,
# die über einen Load-Path geladen wird, eine „Abhängigkeit“ – in Jekyll also
# nicht nur das Theme, sondern auch alle eigenen Partials unter assets/_sass.
# quiet_deps verschluckt damit auch EIGENE Deprecations. Dieser Check baut
# einmal ohne quiet_deps (und mit verbose, sonst kürzt Sass Wiederholungen
# weg) und schlägt fehl, sobald eine Warnung ihren Ursprung in eigenem Code
# hat. Einzige erlaubte Stelle: [import] in assets/_sass/_theme-bridge.scss
# (das Theme ist @import-basiert, SCSS-4). Theme-Warnungen werden gezählt.
#
# Nutzung: scripts/sass-deprecation-check.sh   (Exit 0 = sauber, 1 = eigene
# Deprecations, 2 = Build-Fehler). Braucht `bundle exec jekyll`, also im
# Ruby-Container oder im CI-Build-Job laufen lassen (siehe README_DEV.md).
# Der Parser ist Ruby, weil der Ruby-Container kein Python mitbringt.
set -u
cd "$(dirname "$0")/.."

TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
printf 'sass:\n  quiet_deps: false\n  verbose: true\n' > "$TMP/deprecation-check.yml"

# --unpublished, damit auch assets/css/styleguide.scss mitkompiliert wird
if ! JEKYLL_ENV=production bundle exec jekyll build --unpublished \
  --config "_config.yml,$TMP/deprecation-check.yml" -d "$TMP/site" > "$TMP/build.log" 2>&1; then
  cat "$TMP/build.log"
  echo "Sass-Deprecation-Check: Build fehlgeschlagen"
  exit 2
fi

ruby - "$TMP/build.log" <<'RUBY'
log = File.read(ARGV[0])
own = []
bridge = 0
theme = Hash.new(0)
log.split(/\n(?=(?:DEPRECATION )?WARNING)/).each do |block|
  m = block.match(/\A(?:DEPRECATION )?WARNING(?: \[([\w-]+)\])?/) or next
  cat = m[1] || "warn"
  # erster Stack-Frame nach dem Code-Ausschnitt = Ursprung der Warnung
  frame = block.split("╵", 2).last[/^\s+(\S+\.scss \d+:\d+)/, 1]
  if frame.nil? || frame.include?("minimal-mistakes")
    theme[cat] += 1
  elsif cat == "import" && frame =~ %r{(\A|/)_theme-bridge\.scss }
    bridge += 1
  else
    own << "  [#{cat}] #{frame.sub(%r{\A.*?/assets/}, 'assets/')}"
  end
end
summary = theme.sort.map { |k, v| "#{k} #{v}" }.join(", ")
puts "Theme-Deprecations (nur Info): #{summary.empty? ? 'keine' : summary}"
puts "Theme-Brücke, erlaubtes @import: #{bridge}"
if own.empty?
  puts "Sass-Deprecation-Check OK: keine eigenen Deprecations"
else
  puts "VERSTOSS – Deprecation-Warnungen aus eigenem Code (SCSS-2/SCSS-3):"
  puts own
  puts
  puts "Fix: Builtins über Module (@use \"sass:list\", \"sass:color\", \"sass:math\"),"
  puts "@if/@else statt Sass-if(), @use statt @import. Hintergrund: STYLEGUIDE.md Abschnitt 9."
  exit 1
end
RUBY
