# frozen_string_literal: true

# Barrierefreiheit für Markup, das kramdown und Rouge erzeugen (STYLEGUIDE 6.1)
#
# Nach dem Rendern jeder HTML-Seite:
#   - Codeblöcke: Der waagrecht scrollende Container bekommt tabindex="0",
#     damit er per Tastatur erreichbar und scrollbar ist (WCAG 2.1.1, axe
#     scrollable-region-focusable). Mit Zeilennummern (line_numbers in
#     _config.yml) scrollt table.rouge-table, ohne sie pre.highlight, bei
#     Code ohne Sprache (etwa in einer Liste eingerückt) ein schlichtes pre.
#     Chromium und Firefox fokussieren Scroller inzwischen selbst, WebKit
#     und Safari nicht. Fokusring: theme-overrides/_syntax.scss
#   - Aufgabenlisten (GFM „- [x] …“): Das Kontrollkästchen bekommt den
#     Text des Listenpunkts als aria-label (WCAG 4.1.2). kramdown setzt den
#     Text neben das input, nicht in ein label. Ein <label> drumherum
#     änderte die Optik (das Theme setzt label auf display: block).
# Autoren schreiben Codeblöcke und Aufgabenlisten wie gewohnt in Markdown.
#
# Regex statt Nokogiri aus demselben Grund wie in external-links.rb: jedes
# andere Byte der Seite bleibt gleich. Kommentare, <script>, <style>,
# <textarea> und <template> werden übersprungen. Läuft nur ohne --safe
# (eigener Actions-Build, Dev Container).

module Auflinie
  module InhaltsA11y
    SKIP = %r{<!--.*?-->|<(script|style|textarea|template)\b.*?</\1\s*>}mi.freeze
    TABLE = /<table class="rouge-table">/.freeze
    PRE = %r{<pre( class="highlight")?><code>(?!<table class="rouge-table">)}.freeze
    TASK = %r{(<input type="checkbox" class="task-list-item-checkbox"[^>]*?)\s*/>(.*?)(?=</li|</p|<ul|<ol)}m.freeze
    TOKEN = Regexp.union(SKIP, TABLE, PRE, TASK)

    module_function

    def label(text)
      text.gsub(/<[^>]*>/, "").gsub(/\s+/, " ").strip.gsub('"', "&quot;")
    end

    def process(html)
      return html unless html.include?("<pre") ||
                         html.include?("task-list-item-checkbox")

      html.gsub(TOKEN) do |match|
        # Gruppe 1 gehört zu SKIP, 2 zu PRE, 3 und 4 zu TASK
        m = Regexp.last_match
        if m[3] # Aufgabe
          next match if m[3].include?("aria-label") || label(m[4]).empty?

          %(#{m[3]} aria-label="#{label(m[4])}" />#{m[4]})
        elsif match == '<table class="rouge-table">'
          '<table class="rouge-table" tabindex="0">'
        elsif match.start_with?("<pre")
          %(<pre#{m[2]} tabindex="0"><code>)
        else # übersprungener Bereich
          match
        end
      end
    end
  end
end

Jekyll::Hooks.register [:pages, :documents], :post_render do |doc|
  next unless doc.output_ext == ".html" && doc.output

  doc.output = Auflinie::InhaltsA11y.process(doc.output)
end
