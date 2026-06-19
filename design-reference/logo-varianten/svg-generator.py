#!/usr/bin/env python3
"""
SVG Logo Generator v3 - Polygon-basierte Exakte Reproduktion

Extrahiert die tatsächlichen Linienformen aus dem PNG als gefüllte Polygone
statt Mittellinien mit Stroke. Dies ermöglicht eine exakte Reproduktion
mit variabler Linienbreite und ohne Lücken.

Verwendung:
    python3 svg-generator.py

Voraussetzungen:
    - Pillow (pip install Pillow)
"""

from PIL import Image
import os
from collections import defaultdict
from math import sqrt

# === KONFIGURATION ===

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PNG_SOURCE = os.path.join(SCRIPT_DIR, "sokrates-logo-final.png")
SVG_OUTPUT = os.path.join(SCRIPT_DIR, "..", "Logo.svg")

# SVG Parameter
VIEWBOX_SIZE = 100
STEP = 4                    # Feinere Abtastung für Polygone (alle 4 Pixel)
MAX_X_GAP = 8               # Maximale horizontale Lücke für Kontur-Gruppierung
MIN_CONTOUR_LENGTH = 5      # Mindestanzahl Punkte für eine gültige Kontur
GLOW_DEVIATION = 0.9        # Glow-Stärke für Neon-Effekt (erhöht für sichtbaren Glow)
OPEN_LINE_THRESHOLD = 8     # Abstand für offene Linien-Erkennung (SVG-Einheiten)
SHRINK_FACTOR = 0.6         # Faktor zur Reduzierung der Polygon-Breite (60% der Originalbreite)

# Schnurrbart-Bereich (hier wird nicht gruppiert, um V-Form zu erhalten)
MUSTACHE_Y_MIN = 54
MUSTACHE_Y_MAX = 65
MUSTACHE_X_MIN = 27
MUSTACHE_X_MAX = 42
MUSTACHE_MAX_X_GAP = 3      # Strengerer Wert für Schnurrbart-Bereich

# Horizontalfilter-Parameter (entfernt waagerechte Linien im Bartbereich)
HORIZONTAL_FILTER_Y_MIN = 59        # Ab y=59 horizontal filtern
HORIZONTAL_FILTER_Y_MAX = 66        # Bis y=66
HORIZONTAL_RATIO_THRESHOLD = 2.5    # |Δx| > 2.5 * |Δy| gilt als horizontal

# Detail-Bereiche mit dickeren Linien (weniger schrumpfen)
DETAIL_SHRINK_FACTOR = 0.9          # 90% Breite für feine Details (statt 60%)

# Nasenflügel-Bereich (Cyan)
NOSE_Y_MIN = 49
NOSE_Y_MAX = 54
NOSE_X_MIN = 28
NOSE_X_MAX = 34

# Mundbereich (Cyan)
MOUTH_Y_MIN = 59
MOUTH_Y_MAX = 64
MOUTH_X_MIN = 27
MOUTH_X_MAX = 32

# Farben
CYAN_HEX = "#05d9e8"
MAGENTA_HEX = "#ff00cc"


# === FARBERKENNUNG ===

def get_color_type(r, g, b, a):
    """
    Bestimmt ob ein Pixel Cyan, Magenta oder keines ist.
    Berücksichtigt Glow-Effekte mit toleranter Farbprüfung.
    """
    if a < 100:
        return None
    if g > 120 and b > 120 and r < 120:
        return 'cyan'
    if r > 120 and b > 80 and g < 120:
        return 'magenta'
    return None


# === KONTUR-EXTRAKTION ===

def extract_contours(pixels, width, y, color_name, scale):
    """
    Extrahiert BEIDE Kanten (links + rechts) jedes Segments in einer Zeile.
    
    Args:
        pixels: PIL PixelAccess Objekt
        width: Bildbreite in Pixeln
        y: Y-Koordinate der Zeile
        color_name: 'cyan' oder 'magenta'
        scale: Skalierungsfaktor (Bildgröße / ViewBox)
    
    Returns:
        Liste von Dictionaries mit left, right, y (in ViewBox-Koordinaten)
    """
    contours = []
    current_start = None
    
    for x in range(width):
        r, g, b, a = pixels[x, y]
        is_target_color = get_color_type(r, g, b, a) == color_name
        
        if is_target_color and current_start is None:
            current_start = x
        elif not is_target_color and current_start is not None:
            # Segment gefunden: von current_start bis x-1
            contours.append({
                'left': current_start / scale,
                'right': (x - 1) / scale,
                'y': y / scale
            })
            current_start = None
    
    # Falls Segment am Rand endet
    if current_start is not None:
        contours.append({
            'left': current_start / scale,
            'right': (width - 1) / scale,
            'y': y / scale
        })
    
    return contours


def extract_all_contours(pixels, width, height, color_name, scale, step=STEP):
    """
    Extrahiert alle Konturen für eine Farbe aus dem gesamten Bild.
    
    Returns:
        Liste von Konturen, jede mit left, right, y
    """
    all_contours = []
    
    for y in range(0, height, step):
        contours = extract_contours(pixels, width, y, color_name, scale)
        all_contours.extend(contours)
    
    return all_contours


# === KONTUR-GRUPPIERUNG ZU POLYGONEN ===

def is_in_mustache_region(y, x):
    """
    Prüft ob eine Position im Schnurrbart-Bereich liegt.
    In diesem Bereich wird strenger gruppiert, um die V-Form zu erhalten.
    """
    return (MUSTACHE_Y_MIN <= y <= MUSTACHE_Y_MAX and 
            MUSTACHE_X_MIN <= x <= MUSTACHE_X_MAX)


def get_effective_max_x_gap(y, x):
    """
    Gibt den effektiven MAX_X_GAP für eine Position zurück.
    Im Schnurrbart-Bereich wird ein kleinerer Wert verwendet.
    """
    if is_in_mustache_region(y, x):
        return MUSTACHE_MAX_X_GAP
    return MAX_X_GAP


def group_contours_to_polygons(contours, max_x_gap=MAX_X_GAP, step_y=STEP/20.48):
    """
    Gruppiert Konturen zu zusammenhängenden Polygonen.
    
    Konturen gehören zum selben Polygon wenn:
    - Sie in aufeinanderfolgenden Zeilen liegen
    - Ihre x-Positionen überlappen oder nah beieinander sind
    
    AUSNAHME: Im Schnurrbart-Bereich (y=54-62, x=27-40) wird strenger 
    gruppiert, um die V-Form zu erhalten.
    
    Returns:
        Liste von Polygonen, jedes enthält:
        - left_edge: Liste von (x, y) für linke Kante
        - right_edge: Liste von (x, y) für rechte Kante
    """
    if not contours:
        return []
    
    # Sortiere nach y, dann nach left
    sorted_contours = sorted(contours, key=lambda c: (c['y'], c['left']))
    
    # Gruppiere nach y-Koordinate
    rows = defaultdict(list)
    for c in sorted_contours:
        row_key = round(c['y'] / step_y) * step_y
        rows[row_key].append(c)
    
    sorted_rows = sorted(rows.items())
    
    # Baue Polygone durch Verbinden benachbarter Konturen
    polygons = []
    active_polygons = []  # Liste von {last_left, last_right, left_edge, right_edge}
    
    for row_y, row_contours in sorted_rows:
        row_contours = sorted(row_contours, key=lambda c: c['left'])
        new_active = []
        used_contours = set()
        
        # Versuche jedes aktive Polygon fortzusetzen
        for poly in active_polygons:
            best_match = None
            best_overlap = -float('inf')
            
            for i, c in enumerate(row_contours):
                if i in used_contours:
                    continue
                
                # Bestimme effektiven MAX_X_GAP basierend auf Position
                center_x = (c['left'] + c['right']) / 2
                effective_gap = get_effective_max_x_gap(c['y'], center_x)
                
                # Prüfe Überlappung/Nähe
                overlap = min(poly['last_right'], c['right']) - max(poly['last_left'], c['left'])
                gap = max(poly['last_left'], c['left']) - min(poly['last_right'], c['right'])
                
                if overlap > 0 or gap < effective_gap:
                    score = overlap if overlap > 0 else -gap
                    if score > best_overlap:
                        best_match = i
                        best_overlap = score
            
            if best_match is not None:
                c = row_contours[best_match]
                poly['left_edge'].append((c['left'], c['y']))
                poly['right_edge'].append((c['right'], c['y']))
                poly['last_left'] = c['left']
                poly['last_right'] = c['right']
                new_active.append(poly)
                used_contours.add(best_match)
            else:
                # Polygon beenden
                if len(poly['left_edge']) >= MIN_CONTOUR_LENGTH:
                    polygons.append(poly)
        
        # Neue Polygone für nicht zugeordnete Konturen starten
        for i, c in enumerate(row_contours):
            if i not in used_contours:
                new_active.append({
                    'last_left': c['left'],
                    'last_right': c['right'],
                    'left_edge': [(c['left'], c['y'])],
                    'right_edge': [(c['right'], c['y'])]
                })
        
        active_polygons = new_active
    
    # Verbleibende aktive Polygone abschließen
    for poly in active_polygons:
        if len(poly['left_edge']) >= MIN_CONTOUR_LENGTH:
            polygons.append(poly)
    
    return polygons


# === OFFENE LINIEN ERKENNUNG ===

def is_open_line(polygon):
    """
    Erkennt ob eine Linie offen oder geschlossen sein soll.
    
    Offen wenn: Abstand zwischen Start und Ende der Mittellinie > Schwellenwert
    (z.B. V-förmiger Schnurrbart)
    
    Returns:
        True wenn offene Linie, False wenn geschlossenes Polygon
    """
    left_edge = polygon['left_edge']
    right_edge = polygon['right_edge']
    
    if len(left_edge) < 2 or len(right_edge) < 2:
        return True
    
    # Berechne Mittelpunkte am Anfang und Ende
    start_x = (left_edge[0][0] + right_edge[0][0]) / 2
    start_y = (left_edge[0][1] + right_edge[0][1]) / 2
    
    end_x = (left_edge[-1][0] + right_edge[-1][0]) / 2
    end_y = (left_edge[-1][1] + right_edge[-1][1]) / 2
    
    distance = sqrt((end_x - start_x)**2 + (end_y - start_y)**2)
    
    return distance > OPEN_LINE_THRESHOLD


# === POLYGON ZU SVG PATH ===

def is_in_detail_region(y, x):
    """
    Prüft ob eine Position im Detail-Bereich liegt (Nasenflügel oder Mund).
    In diesen Bereichen werden dickere Linien verwendet.
    """
    # Nasenflügel-Bereich
    if (NOSE_Y_MIN <= y <= NOSE_Y_MAX and NOSE_X_MIN <= x <= NOSE_X_MAX):
        return True
    # Mundbereich
    if (MOUTH_Y_MIN <= y <= MOUTH_Y_MAX and MOUTH_X_MIN <= x <= MOUTH_X_MAX):
        return True
    return False


def get_shrink_factor_for_polygon(polygon):
    """
    Bestimmt den SHRINK_FACTOR für ein Polygon basierend auf seiner Position.
    Detail-Bereiche (Nase, Mund) bekommen dickere Linien.
    """
    left_edge = polygon['left_edge']
    right_edge = polygon['right_edge']
    
    if not left_edge or not right_edge:
        return SHRINK_FACTOR
    
    # Prüfe ob die Mehrheit der Punkte im Detail-Bereich liegt
    detail_count = 0
    total_count = len(left_edge)
    
    for i in range(len(left_edge)):
        lx, ly = left_edge[i]
        rx = right_edge[i][0] if i < len(right_edge) else right_edge[-1][0]
        center_x = (lx + rx) / 2
        
        if is_in_detail_region(ly, center_x):
            detail_count += 1
    
    # Wenn mehr als 50% im Detail-Bereich, verwende DETAIL_SHRINK_FACTOR
    if detail_count > total_count * 0.5:
        return DETAIL_SHRINK_FACTOR
    
    return SHRINK_FACTOR


def polygon_to_svg_path(polygon, close=True):
    """
    Konvertiert ein Polygon zu einem SVG path d-Attribut.
    
    Für geschlossene Polygone:
    - Linke Kante von oben nach unten (mit SHRINK_FACTOR zur Mitte verschoben)
    - Rechte Kante von unten nach oben (mit SHRINK_FACTOR zur Mitte verschoben)
    - Schließen mit Z
    
    Für offene Linien:
    - Mittellinie mit Bezier-Kurven
    
    Args:
        polygon: Dictionary mit left_edge und right_edge
        close: True für geschlossenes Polygon, False für offene Linie
    
    Returns:
        SVG path d-Attribut String
    """
    left_edge = polygon['left_edge']
    right_edge = polygon['right_edge']
    
    if not left_edge or not right_edge:
        return ""
    
    if close:
        # Geschlossenes Polygon: links runter, rechts hoch
        # Mit bereichsabhängigem SHRINK_FACTOR die Kanten zur Mitte verschieben
        shrink = get_shrink_factor_for_polygon(polygon)
        path_points = []
        
        # Linke Kante (von oben nach unten) - zur Mitte verschoben
        for i in range(len(left_edge)):
            lx, ly = left_edge[i]
            rx, ry = right_edge[i] if i < len(right_edge) else right_edge[-1]
            center_x = (lx + rx) / 2
            # Neue linke Kante näher zur Mitte
            new_lx = center_x + (lx - center_x) * shrink
            path_points.append((new_lx, ly))
        
        # Rechte Kante (von unten nach oben) - zur Mitte verschoben
        for i in range(len(right_edge) - 1, -1, -1):
            rx, ry = right_edge[i]
            lx, ly = left_edge[i] if i < len(left_edge) else left_edge[-1]
            center_x = (lx + rx) / 2
            # Neue rechte Kante näher zur Mitte
            new_rx = center_x + (rx - center_x) * shrink
            path_points.append((new_rx, ry))
        
        # SVG path erstellen
        path = f"M {path_points[0][0]:.2f} {path_points[0][1]:.2f}"
        for x, y in path_points[1:]:
            path += f" L {x:.2f} {y:.2f}"
        path += " Z"
        
        return path
    else:
        # Offene Linie: Mittellinie mit Bezier-Kurven
        midpoints = []
        for i in range(len(left_edge)):
            lx, ly = left_edge[i]
            rx, ry = right_edge[i] if i < len(right_edge) else right_edge[-1]
            midpoints.append(((lx + rx) / 2, (ly + ry) / 2))
        
        if len(midpoints) < 2:
            return ""
        
        path = f"M {midpoints[0][0]:.2f} {midpoints[0][1]:.2f}"
        
        if len(midpoints) == 2:
            path += f" L {midpoints[1][0]:.2f} {midpoints[1][1]:.2f}"
        else:
            for i in range(1, len(midpoints) - 1):
                cx, cy = midpoints[i]
                nx, ny = midpoints[i + 1]
                ex = (cx + nx) / 2
                ey = (cy + ny) / 2
                path += f" Q {cx:.2f} {cy:.2f}, {ex:.2f} {ey:.2f}"
            path += f" L {midpoints[-1][0]:.2f} {midpoints[-1][1]:.2f}"
        
        return path


def get_average_width(polygon):
    """Berechnet die durchschnittliche Breite eines Polygons."""
    widths = []
    for i in range(len(polygon['left_edge'])):
        if i < len(polygon['right_edge']):
            lx = polygon['left_edge'][i][0]
            rx = polygon['right_edge'][i][0]
            widths.append(abs(rx - lx))
    return sum(widths) / len(widths) if widths else 0.5


# === HORIZONTALFILTER ===

def filter_horizontal_segments(polygon):
    """
    Entfernt horizontale Segmente am Ende von Polygonen im Bartbereich.
    
    Horizontale Linien entstehen, wenn der Algorithmus versucht, separate
    Bart-Linien zu verbinden. Diese Funktion entfernt solche Artefakte.
    
    Args:
        polygon: Dictionary mit left_edge und right_edge
        
    Returns:
        Gefiltertes Polygon (oder Original wenn kein Filter nötig)
    """
    left_edge = polygon['left_edge']
    right_edge = polygon['right_edge']
    
    if len(left_edge) < 3:
        return polygon
    
    # Prüfe ob Polygon im Filterbereich endet
    last_y = left_edge[-1][1]
    if not (HORIZONTAL_FILTER_Y_MIN <= last_y <= HORIZONTAL_FILTER_Y_MAX):
        return polygon
    
    # Finde den letzten Punkt, der NICHT horizontal ist
    cut_index = len(left_edge)
    
    for i in range(len(left_edge) - 1, 0, -1):
        # Berechne Mittelpunkte für aktuelle und vorherige Position
        curr_x = (left_edge[i][0] + right_edge[min(i, len(right_edge)-1)][0]) / 2
        curr_y = left_edge[i][1]
        prev_x = (left_edge[i-1][0] + right_edge[min(i-1, len(right_edge)-1)][0]) / 2
        prev_y = left_edge[i-1][1]
        
        delta_x = abs(curr_x - prev_x)
        delta_y = abs(curr_y - prev_y)
        
        # Prüfe ob im Filterbereich
        if not (HORIZONTAL_FILTER_Y_MIN <= curr_y <= HORIZONTAL_FILTER_Y_MAX):
            break
            
        # Prüfe ob horizontal (große x-Änderung bei kleiner y-Änderung)
        if delta_y > 0.01:  # Verhindere Division durch 0
            ratio = delta_x / delta_y
            if ratio > HORIZONTAL_RATIO_THRESHOLD:
                cut_index = i
            else:
                break  # Nicht mehr horizontal, aufhören
        elif delta_x > 1.0:  # Fast keine y-Änderung aber x-Änderung
            cut_index = i
        else:
            break
    
    # Wenn wir Punkte abschneiden müssen
    if cut_index < len(left_edge) - 1:
        new_polygon = {
            'left_edge': left_edge[:cut_index],
            'right_edge': right_edge[:min(cut_index, len(right_edge))],
            'last_left': polygon.get('last_left'),
            'last_right': polygon.get('last_right')
        }
        return new_polygon
    
    return polygon


# === SVG-GENERIERUNG ===

def generate_svg(cyan_polygons, magenta_polygons):
    """
    Generiert das vollständige SVG mit gefüllten Polygonen und Neon-Glow-Effekten.
    
    Args:
        cyan_polygons: Liste von Polygon-Dictionaries für Cyan-Elemente
        magenta_polygons: Liste von Polygon-Dictionaries für Magenta-Elemente
    
    Returns:
        Vollständiger SVG-String
    """
    cyan_filled = []
    cyan_stroked = []
    magenta_filled = []
    magenta_stroked = []
    
    # Kategorisiere Polygone
    for poly in cyan_polygons:
        # Horizontalfilter anwenden
        poly = filter_horizontal_segments(poly)
        if len(poly['left_edge']) < MIN_CONTOUR_LENGTH:
            continue
            
        if is_open_line(poly):
            path = polygon_to_svg_path(poly, close=False)
            # Dünnere Stroke-Width mit SHRINK_FACTOR
            width = max(0.4, get_average_width(poly) * SHRINK_FACTOR)
            cyan_stroked.append((path, width))
        else:
            path = polygon_to_svg_path(poly, close=True)
            cyan_filled.append(path)
    
    for poly in magenta_polygons:
        # Horizontalfilter anwenden (besonders wichtig für Schnurrbart)
        poly = filter_horizontal_segments(poly)
        if len(poly['left_edge']) < MIN_CONTOUR_LENGTH:
            continue
            
        if is_open_line(poly):
            path = polygon_to_svg_path(poly, close=False)
            # Dünnere Stroke-Width mit SHRINK_FACTOR
            width = max(0.4, get_average_width(poly) * SHRINK_FACTOR)
            magenta_stroked.append((path, width))
        else:
            path = polygon_to_svg_path(poly, close=True)
            magenta_filled.append(path)
    
    svg = f'''<svg viewBox="0 0 {VIEWBOX_SIZE} {VIEWBOX_SIZE}" width="200" height="200" xmlns="http://www.w3.org/2000/svg">
  <!-- Sokrates Profil - Automatisch generiert aus PNG -->
  <!-- Generator v3: Polygon-basiert -->
  <!-- {len(cyan_filled)} Cyan gefuellt, {len(cyan_stroked)} Cyan Stroke -->
  <!-- {len(magenta_filled)} Magenta gefuellt, {len(magenta_stroked)} Magenta Stroke -->
  
  <!-- Neon-Glow Filter -->
  <defs>
    <filter id="glow-cyan" x="-100%" y="-100%" width="300%" height="300%">
      <feGaussianBlur stdDeviation="{GLOW_DEVIATION}" result="blur1"/>
      <feGaussianBlur stdDeviation="{GLOW_DEVIATION * 2}" result="blur2"/>
      <feMerge>
        <feMergeNode in="blur2"/>
        <feMergeNode in="blur1"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <filter id="glow-magenta" x="-100%" y="-100%" width="300%" height="300%">
      <feGaussianBlur stdDeviation="{GLOW_DEVIATION}" result="blur1"/>
      <feGaussianBlur stdDeviation="{GLOW_DEVIATION * 2}" result="blur2"/>
      <feMerge>
        <feMergeNode in="blur2"/>
        <feMergeNode in="blur1"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  
  <!-- CYAN: Gefuellte Polygone -->
  <g fill="{CYAN_HEX}" stroke="none" filter="url(#glow-cyan)">
'''
    
    for i, path in enumerate(cyan_filled):
        if path:
            svg += f'    <path d="{path}"/>\n'
    
    svg += f'''  </g>
  
  <!-- CYAN: Offene Linien (Stroke) -->
  <g fill="none" stroke="{CYAN_HEX}" stroke-linecap="round" stroke-linejoin="round" filter="url(#glow-cyan)">
'''
    
    for path, width in cyan_stroked:
        if path:
            svg += f'    <path d="{path}" stroke-width="{width:.2f}"/>\n'
    
    svg += f'''  </g>
  
  <!-- MAGENTA: Gefuellte Polygone -->
  <g fill="{MAGENTA_HEX}" stroke="none" filter="url(#glow-magenta)">
'''
    
    for i, path in enumerate(magenta_filled):
        if path:
            svg += f'    <path d="{path}"/>\n'
    
    svg += f'''  </g>
  
  <!-- MAGENTA: Offene Linien (Stroke) -->
  <g fill="none" stroke="{MAGENTA_HEX}" stroke-linecap="round" stroke-linejoin="round" filter="url(#glow-magenta)">
'''
    
    for path, width in magenta_stroked:
        if path:
            svg += f'    <path d="{path}" stroke-width="{width:.2f}"/>\n'
    
    svg += '''  </g>
</svg>
'''
    return svg


# === HAUPTPROGRAMM ===

def main():
    print("=" * 60)
    print("SVG Logo Generator v3 - Polygon-basierte Reproduktion")
    print("=" * 60)
    
    # PNG laden
    print(f"\n[1/6] Lade PNG: {PNG_SOURCE}")
    img = Image.open(PNG_SOURCE).convert('RGBA')
    width, height = img.size
    pixels = img.load()
    scale = width / VIEWBOX_SIZE
    
    print(f"      Bildgroesse: {width}x{height}")
    print(f"      Skalierungsfaktor: {scale}")
    print(f"      Abtastrate: alle {STEP} Pixel")
    
    # Konturen extrahieren
    print(f"\n[2/6] Extrahiere Konturen (beide Kanten)...")
    cyan_contours = extract_all_contours(pixels, width, height, 'cyan', scale, STEP)
    magenta_contours = extract_all_contours(pixels, width, height, 'magenta', scale, STEP)
    
    print(f"      Cyan: {len(cyan_contours)} Kontursegmente")
    print(f"      Magenta: {len(magenta_contours)} Kontursegmente")
    
    # Zu Polygonen gruppieren
    print(f"\n[3/6] Gruppiere zu Polygonen...")
    step_y = STEP / scale
    cyan_polygons = group_contours_to_polygons(cyan_contours, MAX_X_GAP, step_y)
    magenta_polygons = group_contours_to_polygons(magenta_contours, MAX_X_GAP, step_y)
    
    print(f"      Cyan: {len(cyan_polygons)} Polygone")
    print(f"      Magenta: {len(magenta_polygons)} Polygone")
    
    # Offene Linien erkennen
    print(f"\n[4/6] Erkenne offene vs. geschlossene Linien...")
    cyan_open = sum(1 for p in cyan_polygons if is_open_line(p))
    magenta_open = sum(1 for p in magenta_polygons if is_open_line(p))
    
    print(f"      Cyan: {cyan_open} offen, {len(cyan_polygons) - cyan_open} geschlossen")
    print(f"      Magenta: {magenta_open} offen, {len(magenta_polygons) - magenta_open} geschlossen")
    
    # Polygon-Details ausgeben
    print(f"\n[5/6] Polygon-Details:")
    for i, p in enumerate(cyan_polygons):
        y_range = f"y={p['left_edge'][0][1]:.0f}-{p['left_edge'][-1][1]:.0f}"
        x_range = f"x={min(pt[0] for pt in p['left_edge']):.0f}-{max(pt[0] for pt in p['right_edge']):.0f}"
        status = "OFFEN" if is_open_line(p) else "geschlossen"
        avg_width = get_average_width(p)
        print(f"      Cyan {i+1}: {len(p['left_edge'])} Punkte, {y_range}, {x_range}, {status}, Breite={avg_width:.1f}")
    
    for i, p in enumerate(magenta_polygons):
        y_range = f"y={p['left_edge'][0][1]:.0f}-{p['left_edge'][-1][1]:.0f}"
        x_range = f"x={min(pt[0] for pt in p['left_edge']):.0f}-{max(pt[0] for pt in p['right_edge']):.0f}"
        status = "OFFEN" if is_open_line(p) else "geschlossen"
        avg_width = get_average_width(p)
        print(f"      Magenta {i+1}: {len(p['left_edge'])} Punkte, {y_range}, {x_range}, {status}, Breite={avg_width:.1f}")
    
    # SVG generieren
    print(f"\n[6/6] Generiere SVG...")
    svg_content = generate_svg(cyan_polygons, magenta_polygons)
    
    # Speichern
    print(f"\nSpeichere: {SVG_OUTPUT}")
    with open(SVG_OUTPUT, 'w', encoding='utf-8') as f:
        f.write(svg_content)
    
    lines = svg_content.count('\n')
    print(f"\n{'=' * 60}")
    print(f"FERTIG!")
    print(f"  SVG Zeilen: {lines}")
    print(f"  Polygone gesamt: {len(cyan_polygons) + len(magenta_polygons)}")
    print(f"  Methode: Gefuellte Polygone + Stroke fuer offene Linien")
    print(f"{'=' * 60}")


if __name__ == "__main__":
    main()
