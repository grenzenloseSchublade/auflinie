# Logo Varianten

Dieser Ordner enthält alle generierten Logo-Varianten und das Tool zur SVG-Erstellung.

## Dateien

### Generierte PNG-Varianten

| Datei | Beschreibung |
|-------|--------------|
| `sokrates-logo-final.png` | **Finale Version** - Cyan Gesicht, Magenta Haar/Bart |
| `sokrates-variante-1-minimal-weiss.png` | Minimalistisch, weiß |
| `sokrates-variante-2-sketch-weiss.png` | Skizzenhaft, weiß |
| `sokrates-variante-3-bold-weiss.png` | Kräftige Linien, weiß |
| `sokrates-variante-4-minimal-neon.png` | Minimalistisch, Neon (Original) |
| `sokrates-variante-4-modified-neon.png` | Mit Haarlinie |
| `sokrates-variante-5-sketch-neon.png` | Skizzenhaft, Neon |
| `sokrates-variante-6-bold-neon.png` | Kräftige Linien, Neon |

### Tools

| Datei | Beschreibung |
|-------|--------------|
| `svg-generator.py` | Python-Script zur SVG-Erstellung aus PNG |

## SVG-Generator verwenden

Das Script `svg-generator.py` extrahiert die Neon-Linien aus dem PNG und erstellt ein SVG mit Bezier-Kurven.

### Voraussetzungen

```bash
pip install Pillow
```

### Ausführung

```bash
cd assets/images/logo-varianten
python3 svg-generator.py
```

### Funktionsweise

1. **PNG laden** - Das Quell-PNG (`sokrates-logo-final.png`) wird geladen
2. **Farben erkennen** - Cyan und Magenta Pixel werden identifiziert
3. **Konturen tracen** - Linke und rechte Kante jeder Farbe werden extrahiert
4. **Bezier-Kurven** - Punkte werden in glatte SVG-Pfade konvertiert
5. **SVG generieren** - Vollständiges SVG mit Neon-Glow-Filtern wird erstellt

### Anpassungen

Im Script können folgende Parameter geändert werden:

```python
# Abtastrate (kleiner = mehr Detail, langsamer)
step = 20  # in trace_outline()

# Glow-Stärke
stdDeviation="1.2"  # in generate_svg()

# Linienstärke
stroke-width="2.2"  # in generate_svg()
```

## Aktive Logo-Dateien

Die aktiven Logos befinden sich in `/assets/images/`:

- `Logo.svg` - SVG-Version (aktuell aktiv in _config.yml)
- `Logo.png` - PNG-Version (77% transparent)
- `favicon.ico` - Browser-Tab Icon
- `favicon-*.png` - Verschiedene Größen
- `apple-touch-icon.png` - iOS Icon
