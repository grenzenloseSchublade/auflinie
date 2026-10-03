# frozen_string_literal: true

# exclude aus _config.yml auch für Theme-Assets (STYLEGUIDE.md SEC-8b)
#
# Jekylls ThemeAssetsReader kopiert alles unter assets/ des Themes nach _site
# und fragt exclude dabei nicht ab. So landeten main.min.js (jQuery-Bundle),
# vendor/jquery, lunr/ und plugins/ im Deploy, obwohl keine Seite sie lädt.
# Der Hook wirft nach dem Einlesen jede Datei heraus, deren Pfad unter
# exclude fällt und die im Theme liegt. Dateien der Site selbst hat Jekyll
# da schon gefiltert, Generatoren (Feed, Sitemap, Paginierung) laufen erst
# danach.
#
# Läuft nur ohne --safe (eigener Actions-Build, Dev Container).

Jekyll::Hooks.register :site, :post_read do |site|
  theme_root = site.theme&.root
  next unless theme_root

  filter = Jekyll::EntryFilter.new(site)
  dropped = 0
  [site.static_files, site.pages].each do |list|
    list.reject! do |doc|
      rel = doc.relative_path
      next false unless File.file?(File.join(theme_root, rel))
      next false unless filter.excluded?(rel)

      dropped += 1
      true
    end
  end
  Jekyll.logger.debug "Theme-Assets:", "#{dropped} Dateien per exclude entfernt"
end
