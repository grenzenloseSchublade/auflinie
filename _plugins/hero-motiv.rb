# frozen_string_literal: true

# Gemeinsames Hero-Motiv aus _config.yml (background_image)
#
# Seiten und Beiträge mit dem gemeinsamen Titelbild nennen im Front Matter
# den Pfad des Stockbilds:
#   header:
#     overlay_image: /assets/images/background.jpg
#     teaser: /assets/images/background.jpg
# Steht background_image in _config.yml auf einem anderen Bild (etwa dem
# eigenen Motiv hero-eigen.jpg aus scripts/hero-motiv), setzt der Hook genau
# diese Verweise auf das neue Bild um. So passiert der Wechsel nur in
# _config.yml: Preload (head/custom.html), Vorladen in hero-crt.js
# (data-background-image in default.html) und Precache (service-worker.js)
# lesen background_image ohnehin von dort.
#
# Seiten mit einem eigenen Titelbild (anderer Pfad) bleiben unberührt,
# ebenso Bilder im Fließtext. Steht background_image auf dem Stockbild,
# tut der Hook nichts, die Ausgabe bleibt Byte für Byte gleich.
# Läuft nur ohne --safe (eigener Actions-Build, Dev Container).

module HeroMotiv
  STANDARD = "/assets/images/background.jpg"
  FELDER = %w[overlay_image teaser].freeze

  def self.umstellen(item, motiv)
    header = item.data["header"]
    return unless header.is_a?(Hash)

    FELDER.each do |feld|
      header[feld] = motiv if header[feld] == STANDARD
    end
  end
end

Jekyll::Hooks.register :site, :post_read do |site|
  motiv = site.config["background_image"].to_s.strip
  next if motiv.empty? || motiv == HeroMotiv::STANDARD

  (site.pages + site.documents).each { |item| HeroMotiv.umstellen(item, motiv) }
  Jekyll.logger.debug "Hero-Motiv:", motiv
end
