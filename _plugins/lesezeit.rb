# frozen_string_literal: true

# Lesezeit eines Beitrags unabhängig von der Renderreihenfolge
#
# page__meta.html zählte die Wörter aus document.content. Je nachdem, ob
# der Beitrag beim Einbinden schon gerendert war, war das rohes Markdown
# oder fertiges HTML samt Zeilennummern der Codeblöcke. Derselbe Beitrag
# zeigte so 27 Minuten unter „Das könnte auch interessieren“ und 32
# Minuten überall sonst.
#
# Vor dem Rendern wandelt dieser Hook jeden Beitrag einmal mit dem
# Markdown-Konverter der Seite um, ohne die Zeilennummern-Spalte von Rouge
# und ohne Liquid-Kommentare, und legt die Wortzahl als read_words ab.
# page__meta.html nimmt sie überall, wo der Beitrag erscheint. Seiten ohne
# read_words zählen wie bisher. Läuft nur ohne --safe (eigener
# Actions-Build, Dev Container).

Jekyll::Hooks.register :site, :pre_render do |site|
  converter = site.find_converter_instance(Jekyll::Converters::Markdown)
  site.posts.docs.each do |post|
    next unless post.data["read_time"]

    raw = post.content
      .gsub(/\{%-?\s*comment\s*-?%\}.*?\{%-?\s*endcomment\s*-?%\}/m, " ")
      .gsub(/\{%-?\s*(?:end)?raw\s*-?%\}/, " ")
    # Gezählt wie strip_html | number_of_words im Theme: Tags fallen ersatzlos weg
    html = converter.convert(raw)
      .gsub(%r{<td class="rouge-gutter gl">.*?</td>}m, "")
      .gsub(%r{<(script|style)\b.*?</\1>|<!--.*?-->}m, "")
    post.data["read_words"] = html.gsub(/<[^>]*>/, "").split.size
  end
end
