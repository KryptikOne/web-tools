/**
 * Shelf and drawer spacing inside a carcass: equal openings, graduated openings that grow from
 * top to bottom, or set openings with the last taking the remainder. Positions are measured from
 * the bottom of the inside. Lengths in inches.
 */

import { graduatedSeries, type GraduationMode } from "./spacingUtils";

export type ShelfMode = "equal" | "graduated" | "set";
export type ShelfReference = "top" | "underside" | "center";

export interface ShelfInput {
	/** Inside height of the carcass */
	insideHeight: number;
	/** Shelf or drawer front thickness */
	thickness: number;
	/** Number of openings; shelves between them number one fewer */
	openings: number;
	mode: ShelfMode;
	/** Graduated: grow by a fixed step or a ratio, top opening to bottom opening */
	graduation: GraduationMode;
	step: number;
	ratio: number;
	/** Set: opening heights from the top; the last opening takes whatever is left */
	setOpenings: number[];
	/** Clearance left above the top opening and below the bottom one, e.g. for a top rail or kick */
	topClearance: number;
	bottomClearance: number;
	reference: ShelfReference;
}

export interface ShelfOpening {
	index: number;
	/** From the top down, matching how a cabinet is read */
	height: number;
	/** Bottom of the opening above the inside bottom */
	bottom: number;
	top: number;
}

export interface Shelf {
	index: number;
	/** Underside, centre and top above the inside bottom */
	underside: number;
	center: number;
	top: number;
}

export interface ShelfLayout {
	openings: ShelfOpening[];
	shelves: Shelf[];
	shelfCount: number;
	/** Height the openings share after the shelves and clearances */
	available: number;
	/** Graduation step or ratio actually used */
	step: number;
	/** Positions for the running list at the chosen reference, from the bottom */
	positions: number[];
	/** Sum of openings + shelves + clearances, which must equal the inside height */
	closes: boolean;
	remainder: number;
	warnings: string[];
}

export function shelfLayout(input: ShelfInput): ShelfLayout | null {
	const { insideHeight: H, thickness: t, mode, topClearance, bottomClearance, reference } = input;
	const n = Math.floor(input.openings);
	if (!(H > 0) || !(t >= 0) || n < 1 || n > 500 || !(topClearance >= 0) || !(bottomClearance >= 0)) return null;
	const shelfCount = n - 1;
	const available = H - topClearance - bottomClearance - shelfCount * t;
	if (available <= 0) return null;
	const warnings: string[] = [];
	let heights: number[] | null;
	let step = 0;
	if (mode === "equal") {
		heights = Array(n).fill(available / n);
	} else if (mode === "graduated") {
		if (input.graduation === "arithmetic") {
			heights = graduatedSeries(available, n, "arithmetic", { step: input.step });
			step = input.step;
		} else {
			heights = graduatedSeries(available, n, "geometric", { ratio: input.ratio });
			step = input.ratio;
		}
		if (!heights) {
			warnings.push("That graduation makes an opening smaller than nothing; reduce the step or the count");
			return null;
		}
	} else {
		const set = input.setOpenings.slice(0, n - 1).map((h) => Math.max(0, h));
		const used = set.reduce((s, h) => s + h, 0);
		const last = available - used;
		if (last <= 0) warnings.push(`The set openings use ${used.toFixed(2)} in; only ${available.toFixed(2)} in is available, so the last opening has no height`);
		heights = [...set, Math.max(0, last)];
		while (heights.length < n) heights.splice(heights.length - 1, 0, 0);
	}
	// build from the top down, then convert to heights above the inside bottom
	const openings: ShelfOpening[] = [];
	const shelves: Shelf[] = [];
	let y = H - topClearance; // current top edge, measured from the bottom
	heights.forEach((h, i) => {
		const top = y;
		const bottom = y - h;
		openings.push({ index: i + 1, height: h, bottom, top });
		y = bottom;
		if (i < n - 1) {
			shelves.push({ index: i + 1, top: y, center: y - t / 2, underside: y - t });
			y -= t;
		}
	});
	const remainder = y - bottomClearance;
	const closes = Math.abs(remainder) < 1e-6;
	if (!closes) warnings.push(`The layout is ${Math.abs(remainder).toFixed(3)} in ${remainder > 0 ? "short of" : "over"} the inside height`);
	const positions = [...shelves].reverse().map((s) => (reference === "top" ? s.top : reference === "center" ? s.center : s.underside));
	if (openings.some((o) => o.height < t && o.height > 0)) warnings.push("An opening is thinner than a shelf");
	return { openings, shelves, shelfCount, available, step, positions, closes, remainder, warnings };
}
