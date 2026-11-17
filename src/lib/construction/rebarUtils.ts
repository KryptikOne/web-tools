/**
 * Rebar layouts: a slab grid or a footing cage from the edge cover in, bar positions for marking,
 * splices and laps against a stock length, weight, cost and supports. Lengths in inches, weights
 * in pounds per foot from the bar tables. Bar sizes are the imperial table in `concreteUtils`
 * plus the metric N sizes here.
 */

import { computeSpacing, type SpacingResult } from "./spacingUtils";
import { REBAR_SIZES, type RebarSize } from "./concreteUtils";

export const LB_PER_KG = 2.20462;

/** Australian / NZ deformed bar sizes: diameter in inches, weight in lb/ft from kg/m. */
export const METRIC_REBAR_SIZES: RebarSize[] = [
	{ bar: "N10", diameter: 10 / 25.4, weight: 0.617 * 0.672 },
	{ bar: "N12", diameter: 12 / 25.4, weight: 0.888 * 0.672 },
	{ bar: "N16", diameter: 16 / 25.4, weight: 1.58 * 0.672 },
	{ bar: "N20", diameter: 20 / 25.4, weight: 2.47 * 0.672 },
	{ bar: "N24", diameter: 24 / 25.4, weight: 3.55 * 0.672 },
	{ bar: "N28", diameter: 28 / 25.4, weight: 4.83 * 0.672 },
	{ bar: "N32", diameter: 32 / 25.4, weight: 6.31 * 0.672 },
	{ bar: "N36", diameter: 36 / 25.4, weight: 7.99 * 0.672 },
];
export const ALL_REBAR_SIZES: RebarSize[] = [...REBAR_SIZES, ...METRIC_REBAR_SIZES];

export interface RebarRunInput {
	/** Clear distance the bars must span, cover to cover */
	span: number;
	/** How many bars, or the spacing they sit at across the other dimension */
	by: "spacing" | "count";
	spacing: number;
	count: number;
	/** Width the bars are spread across, cover to cover */
	across: number;
}

export interface BarPiece {
	/** Length of each full bar including its laps */
	totalLength: number;
	/** Stock pieces per bar and the lap count */
	pieces: number;
	laps: number;
}

export interface RebarRun {
	spacing: SpacingResult;
	count: number;
	/** Positions from the slab or footing edge, including the cover */
	positions: number[];
	/** Each bar's clear length, before laps */
	barLength: number;
	piece: BarPiece;
	totalLength: number;
}

/** Bars laid along one direction, spread across the other between the covers. */
export function rebarRun(input: RebarRunInput, cover: number, lap: number, stockLength: number, diameter: number): RebarRun | null {
	const { span, across } = input;
	if (!(span > 0) || !(across >= 0) || !(cover >= 0) || !(lap >= 0) || !(stockLength > 0) || !(diameter > 0)) return null;
	let spacing: SpacingResult;
	if (input.by === "count") {
		const n = Math.max(1, Math.floor(input.count));
		if (n > 1000) return null;
		spacing = computeSpacing({ mode: "equal", totalLength: Math.max(across, diameter), memberWidth: diameter, endMembers: n === 1 ? "none" : "both", count: n });
	} else {
		if (!(input.spacing > 0)) return null;
		spacing = computeSpacing({ mode: "exact", totalLength: Math.max(across, diameter), memberWidth: diameter, endMembers: across > diameter ? "both" : "none", centers: input.spacing, adjust: "last" });
	}
	const pieces = Math.max(1, Math.ceil((span - lap) / (stockLength - lap) - 1e-9));
	const laps = pieces - 1;
	const totalLength = span + laps * lap;
	return {
		spacing,
		count: spacing.count,
		positions: spacing.members.map((m) => cover + m.center),
		barLength: span,
		piece: { totalLength, pieces, laps },
		totalLength: totalLength * spacing.count,
	};
}

// ── Slab grid and footing cage ───────────────────────────────────────────────

export interface RebarGridInput {
	mode: "slab" | "footing";
	length: number;
	width: number;
	/** Slab thickness or footing depth */
	depth: number;
	cover: number;
	size: RebarSize;
	along: Omit<RebarRunInput, "span" | "across">;
	across: Omit<RebarRunInput, "span" | "across">;
	/** Lap as a length or as a multiple of the bar diameter */
	lapBy: "length" | "diameters";
	lapValue: number;
	stockLength: number;
	wastePercent: number;
	priceBy: "bar" | "pound";
	price: number;
	/** Footing ties (stirrups): size and spacing along the footing; 0 spacing for none */
	tieSize: RebarSize;
	tieSpacing: number;
	/** Hook allowance added to each tie, in bar diameters per hook, two hooks */
	hookDiameters: number;
}

export interface RebarGrid {
	lap: number;
	along: RebarRun;
	across: RebarRun | null;
	ties: { count: number; positions: number[]; eachLength: number; totalLength: number; weightLb: number } | null;
	/** Bars + ties, with waste */
	totalLength: number;
	stockBars: number;
	weightLb: number;
	weightKg: number;
	cost: number;
	/** Chairs or supports: about one per 3 sq ft for a slab, one per 2 ft of footing */
	supports: number;
	warnings: string[];
}

export function rebarGrid(input: RebarGridInput): RebarGrid | null {
	const { mode, length: L, width: W, depth, cover, size, lapBy, lapValue, stockLength, wastePercent, priceBy, price, tieSize, tieSpacing, hookDiameters } = input;
	if (!(L > 0) || !(W > 0) || !(depth > 0) || !(cover >= 0) || !(stockLength > 0) || !(lapValue >= 0) || !(tieSpacing >= 0)) return null;
	const lap = lapBy === "length" ? lapValue : lapValue * size.diameter;
	if (lap >= stockLength) return null;
	const clearL = L - 2 * cover;
	const clearW = W - 2 * cover;
	if (clearL <= 0 || clearW <= 0) return null;
	const along = rebarRun({ ...input.along, span: clearL, across: clearW }, cover, lap, stockLength, size.diameter);
	if (!along) return null;
	const across = mode === "slab" ? rebarRun({ ...input.across, span: clearW, across: clearL }, cover, lap, stockLength, size.diameter) : null;
	if (mode === "slab" && !across) return null;
	const warnings: string[] = [];
	if (along.count * (across?.count ?? 1) > 1e5) return null;
	let ties: RebarGrid["ties"] = null;
	if (mode === "footing" && tieSpacing > 0) {
		const sp = computeSpacing({ mode: "exact", totalLength: clearL, memberWidth: tieSize.diameter, endMembers: "both", centers: tieSpacing, adjust: "last" });
		const eachLength = 2 * (clearW - tieSize.diameter) + 2 * (depth - 2 * cover - tieSize.diameter) + 2 * Math.max(0, hookDiameters) * tieSize.diameter;
		ties = { count: sp.count, positions: sp.members.map((m) => cover + m.center), eachLength, totalLength: eachLength * sp.count, weightLb: ((eachLength * sp.count) / 12) * tieSize.weight };
	}
	const barLength = along.totalLength + (across?.totalLength ?? 0);
	const waste = 1 + Math.max(0, wastePercent) / 100;
	const barWeight = (barLength / 12) * size.weight;
	const totalLength = (barLength + (ties?.totalLength ?? 0)) * waste;
	const weightLb = (barWeight + (ties?.weightLb ?? 0)) * waste;
	const stockBars = Math.ceil((barLength * waste) / stockLength - 1e-9) + (ties ? Math.ceil((ties.totalLength * waste) / stockLength - 1e-9) : 0);
	const cost = priceBy === "bar" ? stockBars * Math.max(0, price) : weightLb * Math.max(0, price);
	const supports = mode === "slab" ? Math.ceil((L * W) / 432 - 1e-9) : Math.ceil(L / 24 - 1e-9);
	if (along.piece.laps > 0 || (across?.piece.laps ?? 0) > 0) warnings.push(`Bars longer than the ${stockLength} in stock are spliced with ${lap.toFixed(1)} in laps, staggered on site`);
	if (cover > depth / 2) warnings.push("Cover is more than half the depth; no room for the bars");
	return { lap, along, across, ties, totalLength, stockBars, weightLb, weightKg: weightLb / LB_PER_KG, cost, supports, warnings };
}
