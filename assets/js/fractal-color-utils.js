// Gemeinsame Farb-Utilities für die Fraktal-Worker (Mandelbrot & Julia).
// Wird in den Workern via importScripts('fractal-color-utils.js') geladen.
// Reine Funktionen (nur Math) – identisches Verhalten in beiden Workern.

// Vorberechnung von Farben für bessere Performance
function precomputeColors(palette, maxIterations) {
    const colors = [];
    const steps = 1000; // Anzahl der vorberechneten Farben

    for (let i = 0; i < steps; i++) {
        const t = i / (steps - 1);
        colors.push(interpolateColor(palette, t));
    }

    return colors;
}

// Kubische Interpolation zwischen Farben
function interpolateColor(palette, t) {
    // Stelle sicher, dass t im Bereich [0, 1] liegt
    t = Math.max(0, Math.min(1, t));

    // Anzahl der Farbsegmente
    const segments = palette.length - 1;

    // Berechne das aktuelle Segment
    const segment = Math.min(Math.floor(t * segments), segments - 1);

    // Normalisiere t für dieses Segment
    const segmentT = (t * segments) - segment;

    // Kubische Interpolation (Smoothstep)
    const smoothT = segmentT * segmentT * (3 - 2 * segmentT);

    // Gamma-korrigierte Interpolation für bessere Farbwahrnehmung
    return gammaInterpolate(
        hexToRgb(palette[segment]),
        hexToRgb(palette[segment + 1]),
        smoothT
    );
}

// Gamma-korrigierte Interpolation zwischen zwei Farben
function gammaInterpolate(color1, color2, t) {
    // Konvertiere sRGB zu linearem RGB für korrekte Interpolation
    const linearColor1 = color1.map(c => Math.pow(c / 255, 2.2));
    const linearColor2 = color2.map(c => Math.pow(c / 255, 2.2));

    // Verbesserte Interpolation mit Smoothstep für weichere Übergänge
    const smoothT = t * t * (3 - 2 * t);

    // Lineare Interpolation im linearen Farbraum
    const linearResult = linearColor1.map((c, i) => c + smoothT * (linearColor2[i] - c));

    // Konvertiere zurück zu sRGB mit verbesserter Farbsättigung
    const result = linearResult.map(c => {
        // Erhöhe die Farbsättigung für intensivere Farben
        const saturated = Math.max(0, Math.min(1, c * 1.1));
        return Math.round(Math.pow(saturated, 1 / 2.2) * 255);
    });

    // Füge Alpha-Kanal hinzu
    return [...result, 255];
}

// Hilfsfunktion: HEX zu RGB
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16)
    ] : [0, 0, 0];
}
