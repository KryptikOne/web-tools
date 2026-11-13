/**
 * Lumber quantities and pricing. Every length is in inches (the construction canonical unit);
 * areas are square feet and volumes cubic feet because that is how board stock is sold. A board
 * foot is 144 cubic inches: a piece 12" wide, 12" long and 1" thick.
 */

import { LUMBER_SIZES, type LumberSize } from "./imperialUtils";

export const CUBIC_INCHES_PER_BOARD_FOOT = 144;
export const CUBIC_INCHES_PER_CUBIC_FOOT = 1728;
export const SQUARE_INCHES_PER_SQUARE_FOOT = 144;
export const M2_PER_FT2 = 0.09290304;
export const M3_PER_FT3 = 0.028316846592;

/** Deck boards sold by quarter-inch thickness: 5/4 and 6/4 dress to 1" and 1 1/4". */
export const DECK_BOARD_SIZES: LumberSize[] = [
	{ nominal: "5/4x6", width: 1, depth: 5.5 },
	{ nominal: "6/4x6", width: 1.25, depth: 5.5 },
];

export const ALL_LUMBER_SIZES: LumberSize[] = [...LUMBER_SIZES, ...DECK_BOARD_SIZES];

/** Cross-section of a board in inches: `thickness` is the small dimension, `width` the face. */
export interface BoardSection {
	width: number;
	thickness: number;
}

export function sectionOf(size: LumberSize): BoardSection {
	return { width: size.depth, thickness: size.width };
}

function positive(...values: number[]): boolean {
	return values.every((v) => Number.isFinite(v) && v > 0);
}

/** Board feet in a piece of the given section and length. */
export function boardFeet(section: BoardSection, lengthIn: number): number {
	if (!positive(section.width, section.thickness) || !Number.isFinite(lengthIn) || lengthIn < 0) return 0;
	return (section.width * section.thickness * lengthIn) / CUBIC_INCHES_PER_BOARD_FOOT;
}

/** Cubic feet in a piece of the given section and length. */
export function cubicFeet(section: BoardSection, lengthIn: number): number {
	if (!positive(section.width, section.thickness) || !Number.isFinite(lengthIn) || lengthIn < 0) return 0;
	return (section.width * section.thickness * lengthIn) / CUBIC_INCHES_PER_CUBIC_FOOT;
}

/** Linear inches of a section that make up the given cubic feet. */
export function lengthForCubicFeet(section: BoardSection, ft3: number): number {
	if (!positive(section.width, section.thickness) || !Number.isFinite(ft3) || ft3 < 0) return 0;
	return (ft3 * CUBIC_INCHES_PER_CUBIC_FOOT) / (section.width * section.thickness);
}

/** Square feet covered by a board of the given face width laid over `lengthIn`, with an optional gap between boards. */
export function coverageSquareFeet(widthIn: number, lengthIn: number, gapIn = 0): number {
	if (!positive(widthIn) || !Number.isFinite(lengthIn) || lengthIn < 0) return 0;
	return ((widthIn + Math.max(0, gapIn)) * lengthIn) / SQUARE_INCHES_PER_SQUARE_FOOT;
}

/** Linear inches of board needed to cover `areaFt2`, with waste added as a percentage. */
export function lengthForCoverage(widthIn: number, areaFt2: number, wastePercent = 0, gapIn = 0): number {
	if (!positive(widthIn) || !Number.isFinite(areaFt2) || areaFt2 < 0) return 0;
	const base = (areaFt2 * SQUARE_INCHES_PER_SQUARE_FOOT) / (widthIn + Math.max(0, gapIn));
	return base * (1 + Math.max(0, wastePercent) / 100);
}

export interface LumberPriceInput {
	section: BoardSection;
	/** Length of one piece in inches */
	lengthIn: number;
	pieces: number;
	/** Dollars per thousand board feet */
	costPer1000Bft: number;
	piecesPerPack?: number;
}

export interface LumberPriceResult {
	bftPerPiece: number;
	totalBft: number;
	costPerBft: number;
	costPerPiece: number;
	/** Dollars per linear foot of this section */
	costPerLinearFoot: number;
	totalCost: number;
	/** Whole packs needed, or null when no pack size is given */
	packs: number | null;
}

/** Price per 1000 board feet to per piece, per linear foot and totals. */
export function priceLumber({ section, lengthIn, pieces, costPer1000Bft, piecesPerPack }: LumberPriceInput): LumberPriceResult {
	const bftPerPiece = boardFeet(section, lengthIn);
	const count = Number.isFinite(pieces) && pieces > 0 ? pieces : 0;
	const costPerBft = Number.isFinite(costPer1000Bft) && costPer1000Bft > 0 ? costPer1000Bft / 1000 : 0;
	const costPerPiece = bftPerPiece * costPerBft;
	const costPerLinearFoot = boardFeet(section, 12) * costPerBft;
	return {
		bftPerPiece,
		totalBft: bftPerPiece * count,
		costPerBft,
		costPerPiece,
		costPerLinearFoot,
		totalCost: costPerPiece * count,
		packs: piecesPerPack && piecesPerPack > 0 && count > 0 ? Math.ceil(count / piecesPerPack) : null,
	};
}

export type LogMeasure = "diameter" | "girth";

/** Volume of a round log treated as a cylinder, in cubic feet. `size` is the diameter or girth (circumference) in inches. */
export function logVolumeCubicFeet(lengthIn: number, size: number, measure: LogMeasure): number {
	if (!positive(lengthIn, size)) return 0;
	const radius = measure === "diameter" ? size / 2 : size / (2 * Math.PI);
	return (Math.PI * radius * radius * lengthIn) / CUBIC_INCHES_PER_CUBIC_FOOT;
}
