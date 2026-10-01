#!/usr/bin/env python3
"""Erzeugt die selbst gehostete Textschrift aus der offiziellen Ubuntu-Quelle.

Quelle: Ubuntu Font Family 0.869 (Canonical, Dalton Maag), variable Fassung,
Paket fonts-ubuntu 0.869+git20240321-0ubuntu1 aus dem Ubuntu-Archiv:
  http://archive.ubuntu.com/ubuntu/pool/main/f/fonts-ubuntu/fonts-ubuntu_0.869+git20240321-0ubuntu1_all.deb
  dpkg-deb -x fonts-ubuntu_*.deb pkg/
  → pkg/usr/share/fonts/truetype/ubuntu/Ubuntu[wdth,wght].ttf
  → pkg/usr/share/fonts/truetype/ubuntu/Ubuntu-Italic[wdth,wght].ttf
Lizenz: Ubuntu Font Licence 1.0 (assets/webfonts/UBUNTU-FONT-LICENCE.txt).

Was das Skript tut (STYLEGUIDE.md TYP-13):
- Breitenachse fest auf 100 (normal), Gewichtsachse auf 400–700 gekürzt
  (die Seite nutzt 400, 500, 600, 700, siehe TYP-13).
- Subset Latin (gleicher Bereich wie Google Fonts/Fontsource „latin“): deckt
  Deutsch samt „“ ‚‘ – — … ß und Umlauten ab. U+2010/U+2011 (geschützter
  Bindestrich, im Text genutzt) zeigen auf den normalen Bindestrich, weil
  Ubuntu dafür kein eigenes Zeichen hat.
- Ohne Hinting (variable TrueType-Schrift, moderne Browser glätten selbst).
- Umbenennung nach UFL 1.0 Abschnitt 2(c): Ein Subset ist eine „Modified
  Version“ und heißt deshalb „Ubuntu derivative auflinie“. Copyright und
  Lizenzhinweis bleiben in den Metadaten.
- Gibt die Metrik-Overrides für die lokale Ersatzschrift aus (Arial bzw.
  das metrisch gleiche Liberation Sans), damit der Wechsel beim Laden
  möglichst nicht springt. Die Werte stehen in base/_fonts.scss.

Aufruf (fonttools + brotli z. B. in einer venv, keine Projektabhängigkeit):
  python3 scripts/ubuntu-font-subset.py pkg/usr/share/fonts/truetype/ubuntu \
      [--fallback /usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf]
"""
import argparse
import hashlib
import io
import os
import sys

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

SOURCES = {
    # Datei im Paket: (Ausgabe, SHA-256 der Quelle, Stil)
    'Ubuntu[wdth,wght].ttf': (
        'ubuntu-latin-wght.woff2',
        '28c4c189a44803b1986fd16074187034dc6d94ad35f5e87de13dd0e786b70b73',
        'Regular',
    ),
    'Ubuntu-Italic[wdth,wght].ttf': (
        'ubuntu-latin-italic-wght.woff2',
        'f5689f6ae7f16f7ede2012702abd605ac1afa03c950713523b9953d600937975',
        'Italic',
    ),
}
# Fontsource/Google-Fonts-Bereich „latin“; dieselbe Liste steht als
# unicode-range in assets/_sass/base/_fonts.scss
UNICODES = (
    'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,'
    'U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,'
    'U+2212,U+2215,U+FEFF,U+FFFD'
)
WGHT = (400, 700)
FAMILY = 'Ubuntu derivative auflinie'
PS_FAMILY = 'UbuntuDerivativeAuflinie'
LICENCE_NOTE = 'This Font Software is licensed under the Ubuntu Font Licence, Version 1.0.'
LICENCE_URL = 'https://ubuntu.com/legal/font-licence'
OUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'assets', 'webfonts')
# Repräsentativer deutscher Text für die mittlere Zeichenbreite (size-adjust)
SAMPLE = (
    'Die Seite zeigt Lebenslauf, Projekte und einen Blog über Software, '
    'Daten und Fraktale. Über mich: Ich arbeite gern gründlich, prüfe Annahmen '
    'und schreibe verständlich. Größe, Maße, Äpfel, Öl, Übung – „Zitat“ 0123456789.'
)


def sha256(path):
    with open(path, 'rb') as fh:
        return hashlib.sha256(fh.read()).hexdigest()


def rename(font, style):
    name = font['name']
    # Alle Namenseinträge außer Copyright (0) und Marke (7) neu setzen
    for rec in list(name.names):
        if rec.nameID in (1, 2, 3, 4, 6, 16, 17, 25):
            name.removeNames(nameID=rec.nameID)
    entries = {
        1: FAMILY,
        2: style,
        3: f'0.869;auflinie;{PS_FAMILY}-{style}',
        4: f'{FAMILY} {style}',
        6: f'{PS_FAMILY}-{style}',
        10: 'Modified Version of Ubuntu 0.869 (Canonical Ltd): Latin subset, '
            'wdth 100, wght 400-700, no hinting.',
        13: LICENCE_NOTE,
        14: LICENCE_URL,
    }
    for nid, text in entries.items():
        name.removeNames(nameID=nid)
        name.setName(text, nid, 3, 1, 0x409)
    # Achsen- und Instanznamen (fvar/STAT) zeigen auf IDs >= 256, die bleiben


def build(src_dir):
    for src, (out, digest, style) in SOURCES.items():
        path = os.path.join(src_dir, src)
        got = sha256(path)
        if got != digest:
            sys.exit(f'{src}: SHA-256 {got} passt nicht zur gepinnten Quelle {digest}')
        font = TTFont(path, recalcTimestamp=False)
        font = instancer.instantiateVariableFont(
            font, {'wdth': 100, 'wght': WGHT}, updateFontNames=False)
        # Neu laden: der Instancer hinterlässt gvar halb geladen, subset stolpert sonst
        buf = io.BytesIO()
        font.save(buf)
        buf.seek(0)
        font = TTFont(buf, recalcTimestamp=False)
        # Geschützter Bindestrich -> normaler Bindestrich
        for table in font['cmap'].tables:
            if table.isUnicode():
                for cp in (0x2010, 0x2011):
                    table.cmap.setdefault(cp, 'hyphen')
        opts = subset.Options()
        opts.flavor = 'woff2'
        opts.layout_features += ['tnum', 'lnum', 'pnum']
        opts.name_IDs = ['*']
        opts.name_languages = ['*']
        opts.notdef_outline = True
        opts.hinting = False
        sub = subset.Subsetter(opts)
        sub.populate(unicodes=subset.parse_unicodes(UNICODES))
        sub.subset(font)
        rename(font, style)
        font.flavor = 'woff2'
        target = os.path.join(OUT_DIR, out)
        font.save(target)
        print(f'{out}: {os.path.getsize(target)} Bytes, {len(font.getGlyphOrder())} Glyphen')


def advance(font, text):
    cmap = font.getBestCmap()
    hmtx = font['hmtx']
    return sum(hmtx[cmap[ord(c)]][0] for c in text if ord(c) in cmap) / font['head'].unitsPerEm


def fallback_metrics(fallback_path):
    """size-adjust und Overrides wie fontaine/capsize: Breite angleichen,
    dann Ober-/Unterlänge der Ubuntu in Einheiten der skalierten Ersatzschrift."""
    ubuntu = TTFont(os.path.join(OUT_DIR, SOURCES['Ubuntu[wdth,wght].ttf'][0]))
    fallback = TTFont(fallback_path)
    size_adjust = advance(ubuntu, SAMPLE) / advance(fallback, SAMPLE)
    upm = ubuntu['head'].unitsPerEm
    hhea = ubuntu['hhea']
    print(f'size-adjust: {size_adjust * 100:.2f}%')
    print(f'ascent-override: {hhea.ascent / upm / size_adjust * 100:.2f}%')
    print(f'descent-override: {-hhea.descent / upm / size_adjust * 100:.2f}%')
    print(f'line-gap-override: {hhea.lineGap / upm / size_adjust * 100:.2f}%')


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('src_dir')
    ap.add_argument('--fallback')
    args = ap.parse_args()
    build(args.src_dir)
    if args.fallback:
        fallback_metrics(args.fallback)
