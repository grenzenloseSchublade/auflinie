# frozen_string_literal: true

# Social-Links aus einer Quelle (STYLEGUIDE ARCH-4)
#
# Kontakt- und Social-Links stehen nur in author.links in _config.yml. Die
# Autor-Sidebar des Themes liest sie dort selbst. Das Theme-Schema der Site
# (_includes/schema.html, auf der Startseite) und das eigene Person-Schema
# (_includes/head/custom.html) erwarten die Profil-Adressen aber als Liste in
# social.links. Der Hook füllt social.links deshalb beim Start aus den
# Web-Adressen von author.links, in derselben Reihenfolge. So bleibt das
# Theme-Include unverändert (ARCH-1), und eine zweite Liste kann nicht
# auseinanderlaufen. Steht social.links doch von Hand in _config.yml, gewinnt
# author.links mit einer Warnung im Build-Log.
# Läuft nur ohne --safe (eigener Actions-Build, Dev Container).

Jekyll::Hooks.register :site, :after_init do |site|
  links = Array(site.config.dig("author", "links")).filter_map do |link|
    url = link.is_a?(Hash) ? link["url"].to_s : ""
    url if url.start_with?("http://", "https://")
  end
  social = site.config["social"].is_a?(Hash) ? site.config["social"].dup : {}
  if social.key?("links") && social["links"] != links
    Jekyll.logger.warn "social-links:", "social.links in _config.yml wird ignoriert, Quelle ist author.links"
  end
  social["links"] = links
  site.config["social"] = social
end
