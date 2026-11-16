/**
 * Common rafters: lengths, cuts and the birdsmouth from run, pitch and section. Lengths in inches,
 * angles in degrees. Also the whole gable roof: ridge shortening, rafter layout, sheathing and lumber.
 */

import { angleToPitch, pitchToAngle } from "./pitchUtils";
import { studLayout, type Stud } from "./framingUtils";
import { boardFeet, priceLumber } from "./lumberUtils";

const DEG = 180 / Math.PI;

export interface RafterInput {
	/** Horizontal run from the ridge centre line (or its plumb cut) to the outer face of the wall */
	run: number;
	/** Roof angle from level */
	angle: number;
	/** Level overhang beyond the outer wall face */
	overhang: number;
	/** Actual rafter depth (the wide dimension) */
	depth: number;
	/** Actual rafter thickness */
	thickness: number;
	/** Birdsmouth seat (bearing on the plate), or the plumb (heel) height when `birdsmouthBy` is "plumb" */
	birdsmouth: number;
	birdsmouthBy: "seat" | "plumb";
	wallThickness: number;
	wallHeight: number;
}

export interface Rafter {
	angle: number;
	pitch: number;
	/** Rise over the run, measured on the rafter's measuring line */
	rise: number;
	/** Along the rafter from the ridge plumb cut to the plumb line at the outer wall face */
	lineLength: number;
	/** Along the rafter from the outer wall face to the tail plumb cut */
	tailLength: number;
	/** Along the rafter, ridge cut to tail cut */
	overallLength: number;
	/** Horizontal seat of the birdsmouth */
	seat: number;
	/** Vertical heel (plumb cut) of the birdsmouth */
	heel: number;
	/** Height above plate: plumb height of the rafter's top edge over the outer wall face */
	hap: number;
	/** Birdsmouth depth measured square to the rafter edge */
	birdsmouthDepth: number;
	/** True when the birdsmouth takes more than a third of the depth */
	birdsmouthTooDeep: boolean;
	/** Plumb height of the rafter measured square to its length, e.g. for the plumb cut length */
	plumbDepth: number;
	/** Ridge top above the top of the wall plate */
	ridgeAbovePlate: number;
	/** Drop from the top of the plate to the top of the rafter at the tail cut; negative means above */
	tailDrop: number;
	/** Bottom of the fascia line below the top of the plate */
	fasciaBottomBelowPlate: number;
	/** Saw settings: plumb cut miter from square equals the roof angle; seat cut is its complement */
	plumbCutAngle: number;
	seatCutAngle: number;
	warnings: string[];
}

export function commonRafter(input: RafterInput): Rafter | null {
	const { run, angle, overhang, depth, thickness, birdsmouth, birdsmouthBy, wallThickness } = input;
	if (!(run > 0) || !(angle > 0) || angle >= 90 || !(depth > 0) || !(thickness > 0) || !(overhang >= 0) || !(birdsmouth >= 0)) return null;
	const t = angle / DEG;
	const cos = Math.cos(t);
	const sin = Math.sin(t);
	const tan = Math.tan(t);
	const seat = birdsmouthBy === "seat" ? birdsmouth : birdsmouth / tan;
	const heel = seat * tan;
	const plumbDepth = depth / cos;
	const hap = plumbDepth - heel;
	const birdsmouthDepth = seat * sin;
	const warnings: string[] = [];
	const tooDeep = birdsmouthDepth > depth / 3 + 1e-9;
	if (tooDeep) warnings.push(`The birdsmouth cuts ${birdsmouthDepth.toFixed(2)} in into a ${depth} in rafter, more than a third of its depth`);
	if (hap <= 0) warnings.push("The birdsmouth is deeper than the rafter");
	if (seat > wallThickness + 1e-9) warnings.push(`The seat (${seat.toFixed(2)} in) is wider than the wall (${wallThickness} in)`);
	const rise = run * tan;
	return {
		angle,
		pitch: angleToPitch(angle),
		rise,
		lineLength: run / cos,
		tailLength: overhang / cos,
		overallLength: (run + overhang) / cos,
		seat,
		heel,
		hap,
		birdsmouthDepth,
		birdsmouthTooDeep: tooDeep,
		plumbDepth,
		ridgeAbovePlate: rise + hap,
		tailDrop: overhang * tan - hap,
		fasciaBottomBelowPlate: overhang * tan - hap + plumbDepth,
		plumbCutAngle: angle,
		seatCutAngle: 90 - angle,
		warnings,
	};
}

/** Run to the outer wall from the building width, less half the ridge. */
export function runFromSpan(buildingWidth: number, ridgeThickness: number): number {
	return Math.max(0, (buildingWidth - ridgeThickness) / 2);
}

/** Roof angle from a pitch entered as rise per 12. */
export const angleFromPitch = pitchToAngle;

// ── Gable roof ───────────────────────────────────────────────────────────────

export interface GableRoofInput {
	/** Outside of wall to outside of wall */
	buildingWidth: number;
	/** Along the ridge, outside of wall to outside of wall */
	buildingLength: number;
	angle: number;
	/** Eave overhang, level or along the rafter */
	overhang: number;
	overhangBy: "level" | "rafter";
	/** Gable end (rake) overhang beyond each end wall, level */
	rakeOverhang: number;
	depth: number;
	thickness: number;
	ridgeThickness: number;
	birdsmouth: number;
	birdsmouthBy: "seat" | "plumb";
	wallThickness: number;
	wallHeight: number;
	centers: number;
	/** Sheathing sheet size, across the slope and along the ridge */
	sheetWidth: number;
	sheetLength: number;
	costPer1000Bft: number;
}

export interface GableRoof {
	run: number;
	rafter: Rafter;
	/** Level overhang used for the rafter */
	overhang: number;
	/** Taken off the ridge end of the rafter, along its length */
	ridgeShortening: number;
	/** Line length and overall length after shortening for the ridge */
	lineLengthCut: number;
	overallLengthCut: number;
	/** Top of the ridge board above the top of the wall plate */
	ridgeTopAbovePlate: number;
	/** Ridge board depth that reaches the full plumb cut */
	ridgeDepthNeeded: number;
	ridgeLength: number;
	fasciaLength: number;
	/** Rafters along one side, their level positions from one end wall */
	rafters: Stud[];
	raftersPerSide: number;
	totalRafters: number;
	/** Eave to ridge along the roof surface, per side */
	slopeLength: number;
	areaPerSide: number;
	roofArea: number;
	sheetsPerSide: number;
	totalSheets: number;
	/** Stock length each rafter is cut from, to the next 2 ft */
	stockLength: number;
	rafterBoardFeet: number;
	rafterCost: number;
	warnings: string[];
}

export function gableRoof(input: GableRoofInput): GableRoof | null {
	const { buildingWidth, buildingLength, angle, ridgeThickness, depth, thickness, centers, rakeOverhang, sheetWidth, sheetLength } = input;
	if (!(buildingWidth > 0) || !(buildingLength > 0) || !(angle > 0) || angle >= 90 || !(ridgeThickness >= 0) || !(centers > 0) || !(rakeOverhang >= 0) || !(sheetWidth > 0) || !(sheetLength > 0)) return null;
	const t = angle / DEG;
	const cos = Math.cos(t);
	const run = runFromSpan(buildingWidth, 0);
	const overhang = input.overhangBy === "level" ? input.overhang : input.overhang * cos;
	const rafter = commonRafter({ run, angle, overhang, depth, thickness, birdsmouth: input.birdsmouth, birdsmouthBy: input.birdsmouthBy, wallThickness: input.wallThickness, wallHeight: input.wallHeight });
	if (!rafter) return null;
	const ridgeShortening = ridgeThickness / 2 / cos;
	const layout = studLayout({
		wallLength: buildingLength,
		studWidth: thickness,
		studDepth: depth,
		centers,
		sheetWidth: 48,
		startWith: "single",
		endWith: "single",
		firstStudOffset: 0,
		sheetStart: "exterior",
		orthogonalWalls: false,
		studHeight: 1,
		rakeAngle: 0,
	});
	if (!layout) return null;
	const ridgeLength = buildingLength + 2 * rakeOverhang;
	const slopeLength = (run + overhang) / cos;
	const areaPerSide = slopeLength * ridgeLength;
	const across = Math.ceil(slopeLength / sheetWidth - 1e-9);
	const along = Math.ceil(ridgeLength / sheetLength - 1e-9);
	const sheetsPerSide = across * along;
	const stockLength = Math.ceil(rafter.overallLength / 24 - 1e-9) * 24;
	const totalRafters = layout.count * 2;
	const section = { width: depth, thickness };
	const warnings = [...rafter.warnings];
	const ridgeDepthNeeded = rafter.plumbDepth;
	if (sheetsPerSide * 2 > 1e5) return null;
	return {
		run,
		rafter,
		overhang,
		ridgeShortening,
		lineLengthCut: rafter.lineLength - ridgeShortening,
		overallLengthCut: rafter.overallLength - ridgeShortening,
		ridgeTopAbovePlate: rafter.ridgeAbovePlate,
		ridgeDepthNeeded,
		ridgeLength,
		fasciaLength: 2 * ridgeLength,
		rafters: layout.studs,
		raftersPerSide: layout.count,
		totalRafters,
		slopeLength,
		areaPerSide,
		roofArea: 2 * areaPerSide,
		sheetsPerSide,
		totalSheets: 2 * sheetsPerSide,
		stockLength,
		rafterBoardFeet: boardFeet(section, stockLength) * totalRafters,
		rafterCost: priceLumber({ section, lengthIn: stockLength, pieces: totalRafters, costPer1000Bft: input.costPer1000Bft }).totalCost,
		warnings,
	};
}
