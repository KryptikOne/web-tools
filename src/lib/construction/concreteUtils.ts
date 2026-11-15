/**
 * Concrete: volumes of slabs, beams, holes, columns and footings; premix bags from bag weight;
 * rebar lengths, weights and cost; mesh sheets. Lengths in inches, volumes in cubic inches unless
 * the name says otherwise.
 */

export const CUBIC_INCHES_PER_CUBIC_FOOT = 1728;
export const CUBIC_FEET_PER_CUBIC_YARD = 27;
export const CUBIC_FEET_PER_CUBIC_METRE = 35.3146667;
/** Wet density premix bags are rated at: an 80 lb bag yields 0.6 ft³. */
export const PREMIX_DENSITY_LB_FT3 = 133.3;
export const BAG_WEIGHTS_LB = [40, 50, 60, 80, 90] as const;

export const cubicFeet = (cubicInches: number) => cubicInches / CUBIC_INCHES_PER_CUBIC_FOOT;
export const cubicYards = (cubicInches: number) => cubicFeet(cubicInches) / CUBIC_FEET_PER_CUBIC_YARD;
export const cubicMetres = (cubicInches: number) => cubicFeet(cubicInches) / CUBIC_FEET_PER_CUBIC_METRE;

export const cylinderVolume = (diameter: number, height: number) => (Math.PI * diameter * diameter * height) / 4;
export const boxVolume = (width: number, length: number, height: number) => width * length * height;

/** Cubic feet one bag makes. */
export function bagYieldCubicFeet(bagWeightLb: number, density = PREMIX_DENSITY_LB_FT3): number {
	return bagWeightLb > 0 ? bagWeightLb / density : 0;
}

/** Whole bags for a volume in cubic feet. */
export function bagsFor(volumeCubicFeet: number, bagWeightLb: number, density = PREMIX_DENSITY_LB_FT3): number {
	const y = bagYieldCubicFeet(bagWeightLb, density);
	return y > 0 && volumeCubicFeet > 0 ? Math.ceil(volumeCubicFeet / y - 1e-9) : 0;
}

// ── Irregular slab outline ───────────────────────────────────────────────────

export type Direction = "N" | "NE" | "E" | "SE" | "S" | "SW" | "W" | "NW";
export const DIRECTIONS: Direction[] = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
const UNIT: Record<Direction, { x: number; y: number }> = {
	N: { x: 0, y: 1 },
	NE: { x: Math.SQRT1_2, y: Math.SQRT1_2 },
	E: { x: 1, y: 0 },
	SE: { x: Math.SQRT1_2, y: -Math.SQRT1_2 },
	S: { x: 0, y: -1 },
	SW: { x: -Math.SQRT1_2, y: -Math.SQRT1_2 },
	W: { x: -1, y: 0 },
	NW: { x: -Math.SQRT1_2, y: Math.SQRT1_2 },
};

export interface Segment {
	length: number;
	direction: Direction;
}

export interface Point {
	x: number;
	y: number;
}

export interface Outline {
	/** Corner points starting at the origin, y up */
	points: Point[];
	/** Vector from the last point back to the start */
	closing: Point;
	closingLength: number;
	closed: boolean;
	area: number;
	perimeter: number;
	width: number;
	depth: number;
}

/** Walk the segments from the origin; the outline is closed when it comes back within 1/16". */
export function outlineFromSegments(segments: Segment[]): Outline {
	const points: Point[] = [{ x: 0, y: 0 }];
	let x = 0;
	let y = 0;
	for (const s of segments) {
		if (!(s.length > 0)) continue;
		x += UNIT[s.direction].x * s.length;
		y += UNIT[s.direction].y * s.length;
		points.push({ x, y });
	}
	const closing = { x: -x, y: -y };
	const closingLength = Math.hypot(x, y);
	const closed = points.length > 2 && closingLength < 1 / 16;
	// shoelace on the closed polygon (closing it if needed)
	let area2 = 0;
	for (let i = 0; i < points.length; i++) {
		const a = points[i];
		const b = points[(i + 1) % points.length];
		area2 += a.x * b.y - b.x * a.y;
	}
	let perimeter = 0;
	for (let i = 1; i < points.length; i++) perimeter += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
	if (!closed) perimeter += closingLength;
	const xs = points.map((p) => p.x);
	const ys = points.map((p) => p.y);
	return {
		points,
		closing,
		closingLength,
		closed,
		area: points.length > 2 ? Math.abs(area2) / 2 : 0,
		perimeter,
		width: Math.max(...xs) - Math.min(...xs),
		depth: Math.max(...ys) - Math.min(...ys),
	};
}

/** The segment that would close the outline, when one of the eight directions does it exactly. */
export function closingSegment(outline: Outline): Segment | null {
	const { closing, closingLength } = outline;
	if (closingLength < 1 / 16) return null;
	for (const d of DIRECTIONS) {
		const u = UNIT[d];
		const dot = (u.x * closing.x + u.y * closing.y) / closingLength;
		if (dot > 1 - 1e-6) return { length: closingLength, direction: d };
	}
	return null;
}

// ── Slab with beams ──────────────────────────────────────────────────────────

export interface SlabInput {
	area: number;
	perimeter: number;
	slabThickness: number;
	edgeBeamWidth: number;
	/** Total depth at the edge beam, slab included */
	edgeBeamDepth: number;
	/** Length of edge beam; defaults to the full perimeter */
	edgeBeamLength?: number;
	internalBeamLength: number;
	internalBeamWidth: number;
	internalBeamDepth: number;
	/** 45° splays each side of the internal beams */
	splayInternal: boolean;
}

export interface SlabVolumes {
	slab: number;
	edgeBeams: number;
	internalBeams: number;
	total: number;
	edgeBeamLength: number;
}

export function slabVolumes(s: SlabInput): SlabVolumes {
	const slab = Math.max(0, s.area) * Math.max(0, s.slabThickness);
	const edgeBeamLength = s.edgeBeamLength ?? s.perimeter;
	const edgeExtra = Math.max(0, s.edgeBeamDepth - s.slabThickness);
	const edgeBeams = Math.max(0, s.edgeBeamWidth) * edgeExtra * Math.max(0, edgeBeamLength);
	const internalExtra = Math.max(0, s.internalBeamDepth - s.slabThickness);
	let internalBeams = Math.max(0, s.internalBeamWidth) * internalExtra * Math.max(0, s.internalBeamLength);
	if (s.splayInternal) internalBeams += internalExtra * internalExtra * Math.max(0, s.internalBeamLength);
	return { slab, edgeBeams, internalBeams, total: slab + edgeBeams + internalBeams, edgeBeamLength };
}

// ── Rebar and mesh ───────────────────────────────────────────────────────────

export interface RebarSize {
	bar: string;
	/** Nominal diameter, inches */
	diameter: number;
	/** Pounds per foot */
	weight: number;
}

export const REBAR_SIZES: RebarSize[] = [
	{ bar: "#3", diameter: 0.375, weight: 0.376 },
	{ bar: "#4", diameter: 0.5, weight: 0.668 },
	{ bar: "#5", diameter: 0.625, weight: 1.043 },
	{ bar: "#6", diameter: 0.75, weight: 1.502 },
	{ bar: "#7", diameter: 0.875, weight: 2.044 },
	{ bar: "#8", diameter: 1, weight: 2.67 },
	{ bar: "#9", diameter: 1.128, weight: 3.4 },
	{ bar: "#10", diameter: 1.27, weight: 4.303 },
	{ bar: "#11", diameter: 1.41, weight: 5.313 },
	{ bar: "#14", diameter: 1.693, weight: 7.65 },
	{ bar: "#18", diameter: 2.257, weight: 13.6 },
];

export interface RebarInput {
	area: number;
	edgeBeamLength: number;
	edgeBeamBars: number;
	internalBeamLength: number;
	internalBeamBars: number;
	/** Slab grid spacing on centre; 0 for no grid */
	gridSpacing: number;
	wastePercent: number;
	/** Stock bar length */
	barLength: number;
	costPerBar: number;
	size: RebarSize;
}

export interface RebarResult {
	gridLength: number;
	beamLength: number;
	totalLength: number;
	bars: number;
	weightLb: number;
	cost: number;
}

export function rebar(r: RebarInput): RebarResult {
	const gridLength = r.gridSpacing > 0 ? (2 * Math.max(0, r.area)) / r.gridSpacing : 0;
	const beamLength = Math.max(0, r.edgeBeamLength) * Math.max(0, r.edgeBeamBars) + Math.max(0, r.internalBeamLength) * Math.max(0, r.internalBeamBars);
	const totalLength = (gridLength + beamLength) * (1 + Math.max(0, r.wastePercent) / 100);
	const bars = r.barLength > 0 ? Math.ceil(totalLength / r.barLength - 1e-9) : 0;
	return {
		gridLength,
		beamLength,
		totalLength,
		bars,
		weightLb: (totalLength / 12) * r.size.weight,
		cost: bars * Math.max(0, r.costPerBar),
	};
}

export const MESH_SHEETS: { id: string; label: string; width: number; length: number }[] = [
	{ id: "4x8", label: `4' × 8' sheet`, width: 48, length: 96 },
	{ id: "5x10", label: `5' × 10' sheet`, width: 60, length: 120 },
	{ id: "7x20", label: `7' × 20' sheet`, width: 84, length: 240 },
	{ id: "5x150", label: `5' × 150' roll`, width: 60, length: 1800 },
];

export function meshSheets(area: number, sheetWidth: number, sheetLength: number, overlapPercent: number): number {
	const a = sheetWidth * sheetLength;
	return a > 0 && area > 0 ? Math.ceil((area * (1 + Math.max(0, overlapPercent) / 100)) / a - 1e-9) : 0;
}
