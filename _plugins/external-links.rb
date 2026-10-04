# frozen_string_literal: true

# Externe Links öffnen in einem neuen Tab, mit Hinweis (STYLEGUIDE LINK-3)
#
# Nach dem Rendern jeder HTML-Seite bekommt jedes <a href="http(s)://…"> auf
# einen fremden Host (oder auf denselben Host außerhalb von baseurl):
#   - target="_blank" und rel mit noopener und noreferrer (vorhandene
#     rel-Werte wie me oder nofollow bleiben)
#   - ein Pfeil-aus-Kasten-Symbol als Inline-SVG (aria-hidden, currentColor).
#     Ein Wortverbinder (U+2060) davor verhindert den Umbruch zwischen
#     letztem Wort und Symbol
#   - den Hinweis „öffnet in neuem Tab“ für Screenreader: als
#     .visually-hidden-Text oder, wenn der Link ein aria-label trägt, im
#     aria-label (das überdeckt den Linktext)
# Interne und relative Links, Anker, mailto: und tel: bleiben unverändert.
# Ausnahme: Ein handgeschriebenes target="_blank" (etwa im HTML eines
# Gastbeitrags) bekommt auch bei internen Links rel und Hinweis.
# Autoren schreiben Links ganz normal, auch in _data-Texten und Templates.
#
# Warum Regex statt Nokogiri: Nokogiri ist zwar im Bundle (über
# html-proofer), serialisiert aber die ganze Seite neu (Entities, Leerraum,
# Inline-SVG). Der Eingriff hier ändert nur die betroffenen <a>-Tags, jedes
# andere Byte bleibt gleich. Kommentare, <script>, <style>, <textarea> und
# <template> werden übersprungen. Code-Beispiele sind ohnehin maskiert (&lt;a).
#
# Nicht zur Laufzeit per JavaScript: spa-nav.js tauscht fertiges HTML ein,
# das so schon den Hinweis trägt. Läuft nur ohne --safe (eigener
# Actions-Build, Dev Container).

require "uri"

module Auflinie
  module ExternalLinks
    HINT = "öffnet in neuem Tab"

    # Eigene Zeichnung (16er-Raster): Kasten mit offener Ecke, Pfeil nach rechts oben
    ICON = '<span class="ext-link-icon" aria-hidden="true">' \
           "⁠" \
           '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 16 16" ' \
           'fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" ' \
           'stroke-linejoin="round" aria-hidden="true" focusable="false">' \
           '<path d="M9.5 2.5h4v4M13.5 2.5 7 9M11.5 9.5v3a1 1 0 0 1-1 1h-7a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1h3"/>' \
           "</svg></span>"
    HIDDEN = %(<span class="visually-hidden"> (#{HINT})</span>)

    SKIP = %r{<!--.*?-->|<(script|style|textarea|template)\b.*?</\1\s*>}mi.freeze
    LINK = %r{<a\b([^>]*)>(.*?)</a\s*>}mi.freeze
    TOKEN = Regexp.union(SKIP, LINK)
    ABS_URL = %r{\A\s*(?:https?:)?//([^/?#:\s]+)(?::\d+)?([^?#\s]*)}i.freeze

    module_function

    def attr(attrs, name)
      m = attrs.match(/\s#{name}\s*=\s*(?:"([^"]*)"|'([^']*)')/i)
      m && (m[1] || m[2])
    end

    def set_attr(attrs, name, value)
      stripped = attrs.sub(/\s#{name}\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/i, "")
      %(#{stripped.rstrip} #{name}="#{value}")
    end

    def external?(href, host, baseurl)
      m = href && href.match(ABS_URL)
      return false unless m
      return true unless m[1].downcase == host

      path = m[2]
      !(baseurl.empty? || path == baseurl || path.start_with?("#{baseurl}/"))
    end

    def link(attrs, inner)
      rel = (attr(attrs, "rel") || "").split
      rel |= %w(noopener noreferrer)
      attrs = set_attr(attrs, "target", "_blank")
      attrs = set_attr(attrs, "rel", rel.join(" "))
      label = attr(attrs, "aria-label")
      hidden = HIDDEN
      if label
        attrs = set_attr(attrs, "aria-label", "#{label} (#{HINT})") unless label.include?(HINT)
        hidden = ""
      end
      # Leerraum am Ende (mehrzeiliges Template-Markup) hinter das Symbol,
      # sonst wäre er eine Umbruchstelle vor dem Symbol
      body = inner.sub(/\s+\z/, "")
      trail = inner[body.length..]
      %(<a#{attrs}>#{body}#{ICON}#{hidden}#{trail}</a>)
    end

    def process(html, site)
      return html unless html.include?("//") || html.include?("_blank")

      host = URI(site.config["url"].to_s).host.to_s.downcase
      baseurl = site.config["baseurl"].to_s.chomp("/")
      html.gsub(TOKEN) do |match|
        # Gruppe 1 gehört zu SKIP, 2 und 3 zu LINK
        attrs = Regexp.last_match(2)
        inner = Regexp.last_match(3)
        next match if attrs.nil? # übersprungener Bereich
        next match if inner.include?("ext-link-icon") # schon bearbeitet
        blank = attr(attrs, "target").to_s.strip.casecmp?("_blank")
        next match unless blank || external?(attr(attrs, "href"), host, baseurl)

        link(attrs, inner)
      end
    end
  end
end

Jekyll::Hooks.register [:pages, :documents], :post_render do |doc|
  next unless doc.output_ext == ".html" && doc.output

  doc.output = Auflinie::ExternalLinks.process(doc.output, doc.site)
end
