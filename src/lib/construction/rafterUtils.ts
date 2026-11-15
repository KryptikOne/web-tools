/**
 * Common rafters: lengths, cuts and the birdsmouth from run, pitch and section. Lengths in inches,
 * angles in degrees. Hip, valley, jack and gable rafters are deliberately not here yet.
 */

import { angleToPitch, pitchToAngle } from "./pitchUtils";

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
