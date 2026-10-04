# frozen_string_literal: true

# Gastbeiträge mit genanntem Autor (STYLEGUIDE INH-5)
#
# Ein Gastbeitrag trägt im Front Matter das Theme-Feld author mit dem Namen:
#   author: "Vorname Nachname"
# Minimal Mistakes schlägt author in _data/authors.yml nach und erwartet
# dort ein Profil (Avatar, Bio, Links). Gäste bekommen bewusst keins, nur
# den Namen. Ohne Eintrag dort ignorierte das Theme den Namen aber
# (seo.html liest author.name). Der Hook macht deshalb aus dem Namen einen
# Eintrag nur mit name, den Theme und Plugins direkt lesen: meta author in
# seo.html, <author> in jekyll-feed, „von <Name>“ in page__meta.html,
# author im JSON-LD (head/custom.html). Weitere Felder (Avatar, Links)
# fallen weg.
#
# Dazu blendet er das Autorprofil in der Sidebar aus (Theme-Schalter
# author_profile: false). Das Theme zeigt dort den Autor der Seite, also
# den Gast als leeres Profil. Hans Müller dort wäre als Autor falsch.
#
# Steht der Wert doch als Schlüssel in _data/authors.yml (Theme-Weg), gilt
# der name von dort. Ein Text ohne Eintrag führt so nie zu einem leeren
# Autornamen oder leeren Link.
#
# Ohne author (oder mit dem Namen des Site-Autors) bleibt alles wie bisher.
# Läuft nur ohne --safe (eigener Actions-Build, Dev Container).

Jekyll::Hooks.register :site, :post_read do |site|
  owner = site.config.dig("author", "name").to_s
  authors = site.data["authors"].is_a?(Hash) ? site.data["authors"] : {}
  site.posts.docs.each do |post|
    raw = post.data["author"]
    next if raw.nil?

    raw = authors[raw] if raw.is_a?(String) && authors[raw].is_a?(Hash)
    name = (raw.is_a?(Hash) ? raw["name"] : raw).to_s.strip
    if name.empty? || name == owner
      post.data.delete("author")
      next
    end
    post.data["author"] = { "name" => name }
    post.data["author_profile"] = false
    Jekyll.logger.debug "Gastbeitrag:", "#{post.relative_path} von #{name}"
  end
end
