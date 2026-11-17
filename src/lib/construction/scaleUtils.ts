/**
 * Drawing scales: ratios and architect's scales, drawing length to real length and back, the
 * factor between two scales, and area scaling. Lengths in inches; a ratio of 48 means 1:48.
 */

export interface DrawingScale {
	id: string;
	label: string;
	/** Real length divided by drawing length */
	ratio: number;
	system: "metric" | "imperial";
}

export const DRAWING_SCALES: DrawingScale[] = [
	{ id: "1:1", label: "1:1 full size", ratio: 1, system: "metric" },
	{ id: "1:2", label: "1:2", ratio: 2, system: "metric" },
	{ id: "1:5", label: "1:5", ratio: 5, system: "metric" },
	{ id: "1:10", label: "1:10", ratio: 10, system: "metric" },
	{ id: "1:20", label: "1:20", ratio: 20, system: "metric" },
	{ id: "1:25", label: "1:25", ratio: 25, system: "metric" },
	{ id: "1:50", label: "1:50", ratio: 50, system: "metric" },
	{ id: "1:100", label: "1:100", ratio: 100, system: "metric" },
	{ id: "1:200", label: "1:200", ratio: 200, system: "metric" },
	{ id: "1:500", label: "1:500", ratio: 500, system: "metric" },
	{ id: "3in", label: `3" = 1'-0" (1:4)`, ratio: 4, system: "imperial" },
	{ id: "1.5in", label: `1 1/2" = 1'-0" (1:8)`, ratio: 8, system: "imperial" },
	{ id: "1in", label: `1" = 1'-0" (1:12)`, ratio: 12, system: "imperial" },
	{ id: "3/4in", label: `3/4" = 1'-0" (1:16)`, ratio: 16, system: "imperial" },
	{ id: "1/2in", label: `1/2" = 1'-0" (1:24)`, ratio: 24, system: "imperial" },
	{ id: "3/8in", label: `3/8" = 1'-0" (1:32)`, ratio: 32, system: "imperial" },
	{ id: "1/4in", label: `1/4" = 1'-0" (1:48)`, ratio: 48, system: "imperial" },
	{ id: "3/16in", label: `3/16" = 1'-0" (1:64)`, ratio: 64, system: "imperial" },
	{ id: "1/8in", label: `1/8" = 1'-0" (1:96)`, ratio: 96, system: "imperial" },
	{ id: "1/16in", label: `1/16" = 1'-0" (1:192)`, ratio: 192, system: "imperial" },
	{ id: "1in20ft", label: `1" = 20' (1:240)`, ratio: 240, system: "imperial" },
	{ id: "1in50ft", label: `1" = 50' (1:600)`, ratio: 600, system: "imperial" },
];

export function drawingToReal(drawingLength: number, ratio: number): number {
	return ratio > 0 ? drawingLength * ratio : 0;
}

export function realToDrawing(realLength: number, ratio: number): number {
	return ratio > 0 ? realLength / ratio : 0;
}

/** Multiply a length drawn at `from` to redraw it at `to`. */
export function scaleFactor(fromRatio: number, toRatio: number): number {
	return fromRatio > 0 && toRatio > 0 ? fromRatio / toRatio : 0;
}

/** Real area from a drawn area, square units. */
export function drawingAreaToReal(drawnArea: number, ratio: number): number {
	return ratio > 0 ? drawnArea * ratio * ratio : 0;
}

/** Ratio from an architect's scale given as inches on the drawing per foot of building. */
export function ratioFromInchesPerFoot(inchesPerFoot: number): number {
	return inchesPerFoot > 0 ? 12 / inchesPerFoot : 0;
}

/**
 * Ticks for a printed scale bar `barLengthMm` long at the given ratio: tick positions in mm along
 * the bar and the real length each represents, in inches, at a round step.
 */
export function scaleBarTicks(ratio: number, barLengthMm: number, system: "metric" | "imperial"): { mm: number; real: number }[] {
	if (!(ratio > 0) || !(barLengthMm > 0)) return [];
	const realTotalIn = (barLengthMm / 25.4) * ratio;
	// choose a round real step giving 4 to 10 ticks
	const candidates = system === "metric" ? [10, 20, 50, 100, 200, 250, 500, 1000, 2000, 2500, 5000, 10000, 20000, 50000].map((mm) => mm / 25.4) : [1, 2, 3, 6, 12, 24, 36, 60, 120, 240, 600, 1200, 2400, 6000, 12000];
	let step = candidates[candidates.length - 1];
	for (const c of candidates) {
		if (realTotalIn / c <= 10) {
			step = c;
			break;
		}
	}
	const ticks: { mm: number; real: number }[] = [];
	for (let real = 0; real <= realTotalIn + 1e-9 && ticks.length < 20; real += step) ticks.push({ mm: (real / ratio) * 25.4, real });
	return ticks;
}
