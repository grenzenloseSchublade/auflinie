# frozen_string_literal: true

# Kein Umbruch vor dem Schrägstrich (STYLEGUIDE TYPO-2, Owner, 7. 10. 2026)
#
# Schrägstriche zwischen Begriffen stehen mit Leerzeichen („CI / CD“). Damit
# nie „CI /“ am Zeilenende steht, macht dieser Hook nach dem Rendern jeder
# HTML-Seite aus „CI / CD“ im Lesetext „CI&nbsp;/ CD“: geschütztes
# Leerzeichen (U+00A0) vor dem Strich, normales danach. Umbrechen darf die
# Zeile also nur hinter dem Strich. Autoren tippen weiter normale
# Leerzeichen, in Markdown, _data-Texten und Templates.
#
# Nur im Lesetext, also zwischen den Tags. Unverändert bleiben:
#   - Attribute (aria-label, title, alt …), Screenreader lesen sie wie
#     getippt
#   - Code und Vorformatiertes (<code>, <pre>, <kbd>, <samp>), Kommentare
#   - <script> (auch JSON-Daten wie die des Skill-Graphen), <style>,
#     <textarea>, <template>, <title>, Inline-SVG und MathML
# Selbstschließendes SVG oder MathML (<svg …/>) endet am „/>“, der Text
# danach zählt wieder als Lesetext.
# Beidseits des Strichs muss ein Zeichen stehen. Grenzt ein Inline-Tag an
# („<strong>CI</strong> / CD“), zählt es als Zeichen, ein Block-Tag nicht.
# Zeilenumbruch oder mehrere Leerzeichen um den Strich („CI /⏎CD“) zählen
# wie ein Leerzeichen und werden zu „&nbsp;/ “.
# Ein schon geschützter Strich (&nbsp;/ ) passt nicht mehr ins Muster.
#
# Regex statt Nokogiri aus demselben Grund wie in external-links.rb: jedes
# andere Byte der Seite bleibt gleich. Läuft nach den übrigen
# post_render-Hooks (priority :low), damit von ihnen gesetzte Attribute
# (etwa aria-label aus inhalts-a11y.rb) den Text schon haben, bevor er sich
# ändert. Läuft nur ohne --safe (eigener Actions-Build, Dev Container).

module Auflinie
  module Schraegstrich
    SKIP_ELEMENTS = %w(script style textarea template title pre code kbd samp svg math).freeze
    # Inline-Elemente: Ein angrenzendes Tag zählt als Zeichen neben dem Strich
    INLINE = %w(a abbr b bdi bdo cite code data dfn em i kbd mark q s samp small span strong sub sup time u var).freeze

    # In SVG und MathML schließt „/>“ das Element (Fremdelemente in HTML)
    SELF_CLOSING = %w(svg math).freeze

    TOKEN = %r{
      <!--.*?-->
      | <(?:#{SELF_CLOSING.join("|")})(?=[\s/])[^>]*?/>
      | <(#{SKIP_ELEMENTS.join("|")})(?=[\s/>])[^>]*>.*?</\1\s*>
      | <[a-zA-Z/!?][^>"']*(?:(?:"[^"]*"|'[^']*')[^>"']*)*>
    }mix.freeze
    TAG_NAME = %r{\A<(/?)([a-zA-Z][\w-]*)}.freeze
    # Platzhalter für ein angrenzendes Inline-Tag, kommt in HTML nicht vor
    EDGE = "\u0000"
    SLASH = %r{(?<=\S)\s+/\s+(?=\S)}.freeze
    # Schneller Vorfilter: irgendein Strich zwischen Leerraum
    LOOSE = %r{\s/\s}.freeze
    PROTECTED = "&nbsp;/ "

    module_function

    # Name eines Tags und ob es schließt, nil für Kommentare und Doctype
    def tag(token)
      m = token&.match(TAG_NAME)
      m && [m[2].downcase, m[1] == "/"]
    end

    # Steht vor dem Text ein schließendes Inline-Tag oder ein Code-Element?
    def inline_before?(token)
      name, closing = tag(token)
      return false unless name

      %w(code kbd samp).include?(name) || (closing && INLINE.include?(name))
    end

    # Folgt dem Text ein öffnendes Inline-Tag (Code-Elemente eingeschlossen)?
    def inline_after?(token)
      name, closing = tag(token)
      name && !closing && INLINE.include?(name)
    end

    # Gibt den Text zurück und zählt die Ersetzungen in count[0]
    def text(seg, before, after, count)
      return seg unless seg.match?(LOOSE)

      left = inline_before?(before) ? EDGE : ""
      right = inline_after?(after) ? EDGE : ""
      out = "#{left}#{seg}#{right}".gsub(SLASH) do
        count[0] += 1
        PROTECTED
      end
      out.delete(EDGE)
    end

    def process(html)
      return [html, 0] unless html.match?(LOOSE) && !html.include?(EDGE)

      count = [0]
      out = +""
      pos = 0
      before = nil
      html.scan(TOKEN) do
        m = Regexp.last_match
        out << text(html[pos...m.begin(0)], before, m[0], count) << m[0]
        pos = m.end(0)
        before = m[0]
      end
      out << text(html[pos..], before, nil, count)
      [count[0].zero? ? html : out, count[0]]
    end
  end
end

Jekyll::Hooks.register [:pages, :documents], :post_render, priority: :low do |doc|
  next unless doc.output_ext == ".html" && doc.output

  doc.output, count = Auflinie::Schraegstrich.process(doc.output)
  Jekyll.logger.debug "Schrägstrich:", "#{count}× geschützt in #{doc.relative_path}" if count.positive?
end
