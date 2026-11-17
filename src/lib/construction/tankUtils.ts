/**
 * Tank volumes and dip charts: horizontal cylinders with flat, dished or hemispherical ends,
 * vertical cylinders with cone or dome ends, horizontal elliptical tanks and rectangular tanks.
 * Dimensions in inches, volumes in cubic inches; converters for the usual liquid units. Dished
 * ends are treated as ellipsoidal caps (a sphere squashed along the tank axis), the standard
 * approximation for a torispherical head.
 */

export type TankShape = "horizontal" | "vertical" | "elliptical" | "rectangular";
export type EndStyle = "flat" | "dished" | "hemispherical";
export type VerticalEnd = "flat" | "cone" | "dome";

export const TANK_UNITS = [
	{ id: "gal", label: "US gallons", cubicInches: 231 },
	{ id: "ukgal", label: "UK gallons", cubicInches: 277.41945 },
	{ id: "l", label: "litres", cubicInches: 61.023744 },
	{ id: "ft3", label: "cubic feet", cubicInches: 1728 },
	{ id: "m3", label: "cubic metres", cubicInches: 61023.744 },
	{ id: "bbl", label: "barrels (42 gal)", cubicInches: 9702 },
] as const;
export type TankUnit = (typeof TANK_UNITS)[number]["id"];

export const WATER_LB_PER_CUBIC_INCH = 62.428 / 1728;
export const LB_PER_KG = 2.20462;

export function toUnit(cubicInches: number, unit: TankUnit): number {
	const u = TANK_UNITS.find((x) => x.id === unit) ?? TANK_UNITS[0];
	return cubicInches / u.cubicInches;
}

/** Area of a circular segment of depth d in a circle of radius r (0 ≤ d ≤ 2r). */
export function circularSegmentArea(r: number, d: number): number {
	if (r <= 0 || d <= 0) return 0;
	if (d >= 2 * r) return Math.PI * r * r;
	const h = r - d;
	return r * r * Math.acos(h / r) - h * Math.sqrt(2 * r * d - d * d);
}

/** Volume of a spherical cap of depth d in a sphere of radius r. */
export function sphericalCapVolume(r: number, d: number): number {
	if (r <= 0 || d <= 0) return 0;
	const dd = Math.min(d, 2 * r);
	return (Math.PI * dd * dd * (3 * r - dd)) / 3;
}

/**
 * Liquid in an ellipsoidal cap of radius r and axial depth `capDepth`, filled sideways to a
 * depth d measured across the radius (a horizontal tank end). The cap is a hemisphere scaled
 * along the axis, so its volume at any side depth is the hemisphere's times capDepth / r.
 */
export function sideFilledCapVolume(r: number, capDepth: number, d: number): number {
	if (capDepth <= 0) return 0;
	return (sphericalCapVolume(r, d) / 2) * (capDepth / r);
}

/** Liquid in an ellipsoidal cap of radius r and height `capHeight` standing on its pole, filled from the pole to depth d. */
export function bottomDomeVolume(r: number, capHeight: number, d: number): number {
	if (capHeight <= 0 || d <= 0) return 0;
	const dd = Math.min(d, capHeight);
	// scale the depth into the unit hemisphere, take the cap, scale the volume back
	const dSphere = dd * (r / capHeight);
	return sphericalCapVolume(r, dSphere) * (capHeight / r);
}

/** Liquid in a cone standing on its point, radius r at height `coneHeight`, filled to depth d. */
export function coneVolume(r: number, coneHeight: number, d: number): number {
	if (coneHeight <= 0 || d <= 0) return 0;
	const dd = Math.min(d, coneHeight);
	const rd = (r * dd) / coneHeight;
	return (Math.PI * rd * rd * dd) / 3;
}

export interface TankInput {
	shape: TankShape;
	/** Outside dimensions */
	diameter: number;
	length: number;
	width: number;
	height: number;
	wallThickness: number;
	/** Horizontal cylinder ends */
	ends: EndStyle;
	/** Dish depth for dished ends */
	dishDepth: number;
	/** Vertical cylinder bottom and top */
	bottom: VerticalEnd;
	bottomHeight: number;
	top: VerticalEnd;
	topHeight: number;
	fillDepth: number;
	/** Density relative to water, for the weight */
	specificGravity: number;
}

export interface Tank {
	/** Inside dimensions used */
	inner: { diameter: number; length: number; width: number; height: number };
	/** Depth from the lowest point of the liquid to the top of the inside */
	maxDepth: number;
	capacity: number;
	volumeAtDepth: number;
	percentFull: number;
	/** Pounds of water at the fill depth, and of the chosen liquid */
	waterWeightLb: number;
	liquidWeightLb: number;
	/** Inside surface area, square inches */
	surfaceArea: number;
	volumeAt: (depth: number) => number;
	warnings: string[];
}

export function tank(input: TankInput): Tank | null {
	const { shape, wallThickness: t, ends, dishDepth, bottom, bottomHeight, top, topHeight, fillDepth, specificGravity } = input;
	if (!(t >= 0) || !(fillDepth >= 0) || !(specificGravity > 0)) return null;
	const D = input.diameter - 2 * t;
	const L = input.length - 2 * t;
	const W = input.width - 2 * t;
	const H = input.height - 2 * t;
	const warnings: string[] = [];
	let volumeAt: (d: number) => number;
	let maxDepth: number;
	let surfaceArea: number;
	switch (shape) {
		case "horizontal": {
			if (!(D > 0) || !(L > 0)) return null;
			const r = D / 2;
			const cap = ends === "flat" ? 0 : ends === "hemispherical" ? r : Math.min(Math.max(0, dishDepth - t), r);
			if (ends === "dished" && !(dishDepth > t)) warnings.push("Dish depth is no deeper than the wall; the ends are treated as flat");
			volumeAt = (d) => {
				const dd = Math.min(Math.max(0, d), D);
				return circularSegmentArea(r, dd) * L + 2 * sideFilledCapVolume(r, cap, dd);
			};
			maxDepth = D;
			surfaceArea = Math.PI * D * L + (ends === "flat" ? 2 * Math.PI * r * r : ends === "hemispherical" ? 4 * Math.PI * r * r : 2 * Math.PI * (r * r + cap * cap));
			break;
		}
		case "vertical": {
			if (!(D > 0) || !(H > 0)) return null;
			const r = D / 2;
			const hb = bottom === "flat" ? 0 : Math.min(Math.max(0, bottomHeight), H);
			const ht = top === "flat" ? 0 : Math.min(Math.max(0, topHeight), H - hb);
			const straight = H - hb - ht;
			if (straight < 0) return null;
			const bottomFull = bottom === "cone" ? coneVolume(r, hb, hb) : bottom === "dome" ? bottomDomeVolume(r, hb, hb) : 0;
			const topFull = top === "cone" ? coneVolume(r, ht, ht) : top === "dome" ? bottomDomeVolume(r, ht, ht) : 0;
			volumeAt = (d) => {
				const dd = Math.min(Math.max(0, d), H);
				if (dd <= hb) return bottom === "cone" ? coneVolume(r, hb, dd) : bottomDomeVolume(r, hb, dd);
				if (dd <= hb + straight) return bottomFull + Math.PI * r * r * (dd - hb);
				// into the top: the top's remaining empty part is a cap of height (H − dd) measured from the top pole
				const empty = H - dd;
				const emptyVol = top === "cone" ? coneVolume(r, ht, empty) : bottomDomeVolume(r, ht, empty);
				return bottomFull + Math.PI * r * r * straight + (topFull - emptyVol);
			};
			maxDepth = H;
			const slant = (h: number) => Math.sqrt(r * r + h * h);
			const endArea = (style: VerticalEnd, h: number) => (style === "flat" || h <= 0 ? Math.PI * r * r : style === "cone" ? Math.PI * r * slant(h) : Math.PI * (r * r + h * h));
			surfaceArea = Math.PI * D * straight + endArea(bottom, hb) + endArea(top, ht);
			break;
		}
		case "elliptical": {
			if (!(W > 0) || !(H > 0) || !(L > 0)) return null;
			const a = W / 2;
			const b = H / 2;
			volumeAt = (d) => {
				const dd = Math.min(Math.max(0, d), H);
				return (a / b) * circularSegmentArea(b, dd) * L;
			};
			maxDepth = H;
			// Ramanujan's perimeter for the shell plus two flat ends
			const h = (a - b) ** 2 / (a + b) ** 2;
			const perimeter = Math.PI * (a + b) * (1 + (3 * h) / (10 + Math.sqrt(4 - 3 * h)));
			surfaceArea = perimeter * L + 2 * Math.PI * a * b;
			break;
		}
		default: {
			if (!(W > 0) || !(H > 0) || !(L > 0)) return null;
			volumeAt = (d) => L * W * Math.min(Math.max(0, d), H);
			maxDepth = H;
			surfaceArea = 2 * (L * W + L * H + W * H);
		}
	}
	const capacity = volumeAt(maxDepth);
	const v = volumeAt(fillDepth);
	if (fillDepth > maxDepth + 1e-9) warnings.push(`Fill depth is above the inside height of ${maxDepth.toFixed(2)} in; shown full`);
	return {
		inner: { diameter: D, length: L, width: W, height: H },
		maxDepth,
		capacity,
		volumeAtDepth: v,
		percentFull: capacity > 0 ? (v / capacity) * 100 : 0,
		waterWeightLb: v * WATER_LB_PER_CUBIC_INCH,
		liquidWeightLb: v * WATER_LB_PER_CUBIC_INCH * specificGravity,
		surfaceArea,
		volumeAt,
		warnings,
	};
}

export interface DipRow {
	depth: number;
	volume: number;
	percent: number;
}

/** Depth to volume at a fixed increment, always ending on the full depth. */
export function dipChart(t: Tank, increment: number, maxRows = 2000): DipRow[] {
	if (!(increment > 0)) return [];
	const n = Math.floor(t.maxDepth / increment + 1e-9);
	if (n + 1 > maxRows) return [];
	const rows: DipRow[] = [];
	for (let i = 0; i <= n; i++) {
		const d = i * increment;
		const v = t.volumeAt(d);
		rows.push({ depth: d, volume: v, percent: t.capacity > 0 ? (v / t.capacity) * 100 : 0 });
	}
	if (t.maxDepth - n * increment > 1e-9) rows.push({ depth: t.maxDepth, volume: t.capacity, percent: 100 });
	return rows;
}
