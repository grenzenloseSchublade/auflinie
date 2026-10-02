/**
 * fractal-worker-core.js — gemeinsamer Rechenkern für die Fraktal-Worker
 * (mandelbrot-worker.js, julia-worker.js). Beide iterieren z = z² + c über denselben Pixel-Chunk —
 * der einzige Unterschied ist die Initialisierung: Mandelbrot startet z bei 0
 * und nimmt c aus den Pixel-Koordinaten, Julia startet z bei den Pixel-
 * Koordinaten mit konstantem c. Vorher lebte die Schleife als Kopie in beiden
 * Workern und war bereits auseinandergedriftet (NaN-Härtung nur bei Julia).
 * Läuft im Worker-Scope via importScripts (nach fractal-color-utils.js).
 */
/* exported runFractalChunkJob */

/**
 * Kompletter Chunk-Job: Parameter härten, rechnen, Ergebnis mit
 * Transferables zurücksenden.
 * @param {Object} data   e.data der Worker-Message
 * @param {Object} config { julia: boolean, defaultViewX?: number }
 */
function runFractalChunkJob(data, config) {
    const isJulia = !!config.julia;
    const width = data.width;
    const height = data.height;
    const viewX = typeof data.viewX === 'number' ? data.viewX : (config.defaultViewX || 0);
    const viewY = data.viewY || 0;
    const zoomLevel = data.zoomLevel || 1;
    const startY = data.startY;
    const endY = data.endY;
    const includeIterationData = !!data.includeIterationData;

    // Härtung für beide Worker (war zuvor nur im Julia-Worker): ohne die
    // Guards wirft ein kaputter Parameter-Satz im Worker und der Render
    // bleibt stumm aus.
    const maxIterations = Number.isFinite(data.maxIterations) ? data.maxIterations : 200;
    const colorPalette = Array.isArray(data.colorPalette) && data.colorPalette.length >= 2
        ? data.colorPalette
        : ['#000764', '#206BCB', '#EDFFFF', '#FFB847', '#FB0C00'];

    const imageData = new ImageData(width, endY - startY);
    const iterationChunk = includeIterationData
        ? new Uint16Array(width * (endY - startY))
        : null;

    // Grenzen basierend auf Zoom und Ansicht
    const xRange = 3.0 / zoomLevel;
    const yRange = 3.0 / zoomLevel;
    const xMin = viewX - xRange / 2;
    const yMin = viewY - yRange / 2;

    const fallbackColor = [0, 0, 0, 255];
    let precomputedColors = precomputeColors(colorPalette);
    if (!Array.isArray(precomputedColors) || precomputedColors.length === 0) {
        precomputedColors = [fallbackColor];
    }

    for (let y = startY; y < endY; y++) {
        for (let x = 0; x < width; x++) {
            // Pixel in komplexe Koordinaten
            const px = xMin + (x / width) * xRange;
            const py = yMin + (y / height) * yRange;

            // Mandelbrot: z=0, c=Pixel — Julia: z=Pixel, c=konstant
            let zx = isJulia ? px : 0;
            let zy = isJulia ? py : 0;
            const cx = isJulia ? data.realPart : px;
            const cy = isJulia ? data.imagPart : py;

            let iteration = 0;
            while (zx * zx + zy * zy < 4 && iteration < maxIterations) {
                // z = z² + c
                const xtemp = zx * zx - zy * zy + cx;
                zy = 2 * zx * zy + cy;
                zx = xtemp;
                iteration++;
            }

            if (iterationChunk) {
                iterationChunk[(y - startY) * width + x] = iteration;
            }

            let color;
            if (iteration === maxIterations) {
                color = fallbackColor; // Punkt liegt in der Menge -> Schwarz
            } else {
                // Smooth Coloring für weiche Farbübergänge
                const zn2 = zx * zx + zy * zy;
                const nu = Math.log(Math.log(zn2) / 2 / Math.log(2)) / Math.log(2);
                const smoothed = iteration + 1 - nu;
                const normalized = Math.sqrt(smoothed / maxIterations);

                let colorIndex = Math.floor(normalized * (precomputedColors.length - 1));
                if (!Number.isFinite(colorIndex)) {
                    colorIndex = 0;
                }
                color = precomputedColors[Math.min(colorIndex, precomputedColors.length - 1)] || fallbackColor;
            }

            const dataIndex = ((y - startY) * width + x) * 4;
            imageData.data[dataIndex] = color[0];     // R
            imageData.data[dataIndex + 1] = color[1]; // G
            imageData.data[dataIndex + 2] = color[2]; // B
            imageData.data[dataIndex + 3] = color[3]; // A
        }
    }

    // Ergebnis zurücksenden — Buffers als Transferables (kein Kopieren)
    const transfer = [imageData.data.buffer];
    if (iterationChunk) {
        transfer.push(iterationChunk.buffer);
    }
    self.postMessage({
        requestId: data.requestId,
        imageData: imageData,
        startY: startY,
        endY: endY,
        workerId: data.workerId,
        iterationChunk: iterationChunk
    }, transfer);
}
