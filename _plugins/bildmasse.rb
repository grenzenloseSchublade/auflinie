# frozen_string_literal: true

# Pixelmaße eines Bildes für width und height (STYLEGUIDE.md IMG-3)
#
# Liquid-Filter `bildmasse`: nimmt einen Pfad ab der Wurzel der Site, wie
# er in header.teaser steht (ohne baseurl), und gibt {"width", "height"}
# zurück, gelesen aus dem Dateikopf von JPEG, PNG, WebP oder GIF. Ohne
# lesbare Maße (URL, Datei fehlt, anderes Format wie SVG) kommt nil. Das
# Include lässt die Attribute dann weg, der Build läuft weiter, und
# scripts/content-check.py --site warnt. Nutzer: archive-single.html
# (Kachelbilder auf der Startseite und unter „Das könnte auch
# interessieren“) und seo.html (og:image:width und og:image:height).
#
# Warum ein Plugin: Wer bloggt, trägt nur den Pfad zum Bild ein
# (Leitlinie 1.8, docs/pflege.md). Maße im Front Matter oder in _data
# wären ein weiteres Feld je Beitrag, das beim Tausch des Bildes still
# veraltet. Kein Gem: Die Köpfe der vier Formate sind kurz und fest
# beschrieben. Gelesen wird die Datei unter site.source, nicht
# site.static_files, damit auch Bilder außerhalb der statischen Dateien
# keinen Sonderweg brauchen.
#
# JPEG mit EXIF-Ausrichtung 5 bis 8 (hochkant aufgenommen, quer
# gespeichert) zeigen Browser gedreht, Breite und Höhe sind dann vertauscht.
#
# Läuft nur ohne --safe (eigener Actions-Build, Dev Container).

module Auflinie
  module Bildmasse
    PNG_SIGNATUR = "\x89PNG\r\n\x1A\n".b
    # SOF-Marker mit Bildmaßen: C0 bis CF ohne DHT (C4), JPG (C8), DAC (CC)
    JPEG_SOF = ((0xC0..0xCF).to_a - [0xC4, 0xC8, 0xCC]).freeze
    CACHE = {}

    module_function

    # Absoluter Pfad unter source oder nil (URL, Ausbruch aus source)
    def datei(source, pfad)
      # Prozent-Kodierung wie im Browser auflösen (mein%20bild.jpg), + bleibt +
      pfad = pfad.to_s.strip.sub(/[?#].*\z/, "").gsub(/%\h\h/) { |m| m[1, 2].hex.chr }.force_encoding(Encoding::UTF_8)
      return nil if pfad.empty? || pfad.start_with?("//") || pfad.match?(%r{\A[a-z][a-z0-9+.-]*:}i)

      wurzel = File.expand_path(source)
      ziel = File.expand_path(File.join(wurzel, pfad))
      ziel.start_with?(wurzel + File::SEPARATOR) && File.file?(ziel) ? ziel : nil
    rescue ArgumentError # Null-Byte oder ungültiges UTF-8 im Pfad: ohne Maße weiter
      nil
    end

    def masse(datei)
      stat = File.stat(datei)
      schluessel = [datei, stat.mtime.to_f, stat.size]
      return CACHE[schluessel] if CACHE.key?(schluessel)

      CACHE[schluessel] = File.open(datei, "rb") { |f| lesen(f) }
    rescue StandardError # kaputte Datei: ohne Maße weiter, der Build bricht nie
      nil
    end

    def lesen(f)
      kopf = f.read(30).to_s
      breite, hoehe =
        if kopf.start_with?(PNG_SIGNATUR) && kopf[12, 4] == "IHDR"
          kopf[16, 8].unpack("NN")
        elsif kopf.start_with?("GIF87a", "GIF89a")
          kopf[6, 4].unpack("vv")
        elsif kopf[0, 4] == "RIFF" && kopf[8, 4] == "WEBP"
          webp(kopf)
        elsif kopf.start_with?("\xFF\xD8".b)
          f.seek(2)
          jpeg(f)
        end
      return nil unless breite.to_i.positive? && hoehe.to_i.positive?

      { "width" => breite, "height" => hoehe }
    end

    def webp(kopf)
      return nil if kopf.bytesize < 30

      case kopf[12, 4]
      when "VP8 " # verlustbehaftet: Startcode 9D 01 2A, dann 14 Bit je Maß
        return nil unless kopf[23, 3] == "\x9D\x01\x2A".b

        kopf[26, 4].unpack("vv").map { |v| v & 0x3FFF }
      when "VP8L" # verlustfrei: Signatur 2F, dann je 14 Bit Maß minus 1
        return nil unless kopf.getbyte(20) == 0x2F

        bits = kopf[21, 4].unpack1("V")
        [(bits & 0x3FFF) + 1, ((bits >> 14) & 0x3FFF) + 1]
      when "VP8X" # erweitert: Leinwand je 24 Bit minus 1
        [kopf[24, 3], kopf[27, 3]].map { |b| (b + "\0").unpack1("V") + 1 }
      end
    end

    def jpeg(f)
      gedreht = false
      loop do
        byte = f.readbyte
        next unless byte == 0xFF

        marker = f.readbyte
        marker = f.readbyte while marker == 0xFF # Füllbytes
        next if marker == 0x01 || (0xD0..0xD7).cover?(marker)
        return nil if marker == 0xD9 || marker == 0xDA # Ende oder Bilddaten ohne SOF

        laenge = f.read(2).to_s.unpack1("n")
        return nil if laenge.nil? || laenge < 2

        inhalt = f.read(laenge - 2).to_s
        return nil if inhalt.bytesize < laenge - 2

        gedreht ||= exif_gedreht?(inhalt) if marker == 0xE1
        next unless JPEG_SOF.include?(marker)

        hoehe, breite = inhalt[1, 4].unpack("nn")
        return gedreht ? [hoehe, breite] : [breite, hoehe]
      end
    rescue EOFError
      nil
    end

    # EXIF-Ausrichtung 5 bis 8 dreht um 90 Grad (Tag 0x0112 in IFD0)
    def exif_gedreht?(app1)
      return false unless app1.start_with?("Exif\0\0".b)

      tiff = app1.byteslice(6..)
      return false if tiff.nil? || tiff.bytesize < 8

      kurz, lang = tiff.start_with?("II") ? %w[v V] : %w[n N]
      ifd = tiff[4, 4].unpack1(lang)
      return false if ifd.nil? || ifd + 2 > tiff.bytesize

      tiff[ifd, 2].unpack1(kurz).times do |i|
        eintrag = tiff[ifd + 2 + (i * 12), 12]
        break if eintrag.nil? || eintrag.bytesize < 12
        next unless eintrag[0, 2].unpack1(kurz) == 0x0112

        return (5..8).cover?(eintrag[8, 2].unpack1(kurz))
      end
      false
    end
  end

  # Liquid: {% assign masse = pfad | bildmasse %}, dann masse.width und masse.height
  module BildmasseFilter
    def bildmasse(pfad)
      site = @context.registers[:site]
      datei = Bildmasse.datei(site.source, pfad)
      datei && Bildmasse.masse(datei)
    end
  end
end

Liquid::Template.register_filter(Auflinie::BildmasseFilter)
