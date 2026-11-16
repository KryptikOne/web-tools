/**
 * Roof shapes beyond the plain gable: skillion (one slope), gambrel (two slopes a side) and
 * saltbox (a different slope each side). Each side is solved with `commonRafter`, so lengths,
 * cuts and the birdsmouth follow the common rafter tool. Lengths in inches, angles in degrees.
 */

import { commonRafter, type Rafter } from "./rafterUtils";

const DEG = 180 / Math.PI;
const tan = (deg: number) => Math.tan(deg / DEG);
const cos = (deg: number) => Math.cos(deg / DEG);

interface SectionCommon {
	depth: number;
	thickness: number;
	/** Birdsmouth seat on each wall */
	seat: number;
	wallThickness: number;
	/** Along the ridge, for areas */
	buildingLength: number;
}

const validSection = (s: SectionCommon) => s.depth > 0 && s.thickness > 0 && s.seat >= 0 && s.wallThickness > 0 && s.buildingLength > 0;

// ── Skillion ─────────────────────────────────────────────────────────────────

export interface SkillionInput extends SectionCommon {
	/** Outside of low wall to outside of high wall */
	span: number;
	angle: number;
	overhangLow: number;
	overhangHigh: number;
	/** Low wall height, plate top above the floor */
	lowWallHeight: number;
}

export interface Skillion {
	rafter: Rafter;
	run: number;
	rise: number;
	/** Along the rafter, low wall to high wall plumb lines */
	lineLength: number;
	tailLow: number;
	tailHigh: number;
	overallLength: number;
	/** High wall plate top above the floor */
	highWallHeight: number;
	/** Roof surface area, both overhangs included */
	area: number;
	warnings: string[];
}

/** Rake angle from the two wall heights across the span. */
export function skillionAngleFromWalls(span: number, lowWallHeight: number, highWallHeight: number): number | null {
	if (!(span > 0) || !(highWallHeight > lowWallHeight)) return null;
	return Math.atan((highWallHeight - lowWallHeight) / span) * DEG;
}

export function skillion(input: SkillionInput): Skillion | null {
	const { span, angle, overhangLow, overhangHigh, lowWallHeight, buildingLength } = input;
	if (!(span > 0) || !(angle > 0) || angle >= 90 || !(overhangLow >= 0) || !(overhangHigh >= 0) || !(lowWallHeight > 0) || !validSection(input)) return null;
	const rafter = commonRafter({ run: span, angle, overhang: overhangLow, depth: input.depth, thickness: input.thickness, birdsmouth: input.seat, birdsmouthBy: "seat", wallThickness: input.wallThickness, wallHeight: lowWallHeight });
	if (!rafter) return null;
	const c = cos(angle);
	const rise = span * tan(angle);
	const tailHigh = overhangHigh / c;
	const overallLength = (span + overhangLow + overhangHigh) / c;
	const warnings = [...rafter.warnings];
	if (input.seat > 0 && input.seat > input.wallThickness) warnings.push("The high wall birdsmouth also overhangs its wall");
	return {
		rafter,
		run: span,
		rise,
		lineLength: rafter.lineLength,
		tailLow: rafter.tailLength,
		tailHigh,
		overallLength,
		highWallHeight: lowWallHeight + rise,
		area: overallLength * buildingLength,
		warnings,
	};
}

// ── Gambrel ──────────────────────────────────────────────────────────────────

export interface GambrelInput extends SectionCommon {
	span: number;
	/** Steeper lower slope */
	lowerAngle: number;
	upperAngle: number;
	/** Where the slope changes: level run in from the outer wall, or height of the roof surface above the plate */
	breakBy: "run" | "height";
	breakValue: number;
	overhang: number;
	ridgeThickness: number;
}

export interface Gambrel {
	lower: Rafter;
	upper: Rafter;
	/** Level distance from the outer wall to the break */
	breakRun: number;
	/** Rise of the lower slope on its measuring line */
	lowerRise: number;
	upperRun: number;
	upperRise: number;
	/** Top of the roof at the break, above the plate */
	breakHeight: number;
	/** Ridge top above the plate */
	ridgeHeight: number;
	/** Interior angle between the two slopes at the break */
	breakAngle: number;
	/** Miter from square on each piece for a butt joint at the break */
	breakMiter: number;
	/** Taken off the upper rafter at the ridge, along the rafter */
	ridgeShortening: number;
	upperLengthCut: number;
	/** Eave to ridge along the surface, per side */
	slopeLength: number;
	area: number;
	warnings: string[];
}

export function gambrel(input: GambrelInput): Gambrel | null {
	const { span, lowerAngle, upperAngle, breakBy, breakValue, overhang, ridgeThickness, buildingLength } = input;
	if (!(span > 0) || !(lowerAngle > 0) || lowerAngle >= 90 || !(upperAngle > 0) || upperAngle >= 90 || !(breakValue > 0) || !(overhang >= 0) || !(ridgeThickness >= 0) || !validSection(input)) return null;
	const half = span / 2;
	const breakRun = breakBy === "run" ? breakValue : breakValue / tan(lowerAngle);
	if (!(breakRun > 0) || breakRun >= half) return null;
	const lower = commonRafter({ run: breakRun, angle: lowerAngle, overhang, depth: input.depth, thickness: input.thickness, birdsmouth: input.seat, birdsmouthBy: "seat", wallThickness: input.wallThickness, wallHeight: 96 });
	const upperRun = half - breakRun;
	const upper = commonRafter({ run: upperRun, angle: upperAngle, overhang: 0, depth: input.depth, thickness: input.thickness, birdsmouth: 0, birdsmouthBy: "seat", wallThickness: input.wallThickness, wallHeight: 96 });
	if (!lower || !upper) return null;
	const warnings = [...lower.warnings];
	if (upperAngle >= lowerAngle) warnings.push("The upper slope is as steep as the lower one; a gambrel normally flattens above the break");
	const breakHeight = lower.rise + lower.hap;
	const ridgeShortening = ridgeThickness / 2 / cos(upperAngle);
	return {
		lower,
		upper,
		breakRun,
		lowerRise: lower.rise,
		upperRun,
		upperRise: upper.rise,
		breakHeight,
		ridgeHeight: breakHeight + upper.rise,
		breakAngle: 180 - (lowerAngle - upperAngle),
		breakMiter: (lowerAngle - upperAngle) / 2,
		ridgeShortening,
		upperLengthCut: upper.lineLength - ridgeShortening,
		slopeLength: lower.overallLength + upper.lineLength,
		area: 2 * (lower.overallLength + upper.lineLength) * buildingLength,
		warnings,
	};
}

// ── Saltbox ──────────────────────────────────────────────────────────────────

export interface SaltboxInput extends SectionCommon {
	span: number;
	frontAngle: number;
	rearAngle: number;
	/** Place the ridge by a level offset from the centre toward the front, or where equal wall heights put it */
	ridgeBy: "offset" | "equal-walls";
	ridgeOffset: number;
	overhangFront: number;
	overhangRear: number;
	ridgeThickness: number;
	frontWallHeight: number;
}

export interface Saltbox {
	front: Rafter;
	rear: Rafter;
	frontRun: number;
	rearRun: number;
	/** Ridge centre line from the centre of the span toward the front */
	ridgeOffset: number;
	/** Ridge top above the front plate */
	ridgeHeight: number;
	/** Rear plate top above the front plate; negative when the rear wall is lower */
	rearWallDelta: number;
	rearWallHeight: number;
	ridgeShorteningFront: number;
	ridgeShorteningRear: number;
	area: number;
	warnings: string[];
}

export function saltbox(input: SaltboxInput): Saltbox | null {
	const { span, frontAngle, rearAngle, ridgeBy, ridgeThickness, overhangFront, overhangRear, frontWallHeight, buildingLength } = input;
	if (!(span > 0) || !(frontAngle > 0) || frontAngle >= 90 || !(rearAngle > 0) || rearAngle >= 90 || !(overhangFront >= 0) || !(overhangRear >= 0) || !(ridgeThickness >= 0) || !(frontWallHeight > 0) || !validSection(input)) return null;
	const tf = tan(frontAngle);
	const tr = tan(rearAngle);
	const frontRun = ridgeBy === "equal-walls" ? (span * tr) / (tf + tr) : span / 2 - input.ridgeOffset;
	const rearRun = span - frontRun;
	if (!(frontRun > 0) || !(rearRun > 0)) return null;
	const front = commonRafter({ run: frontRun, angle: frontAngle, overhang: overhangFront, depth: input.depth, thickness: input.thickness, birdsmouth: input.seat, birdsmouthBy: "seat", wallThickness: input.wallThickness, wallHeight: frontWallHeight });
	const rear = commonRafter({ run: rearRun, angle: rearAngle, overhang: overhangRear, depth: input.depth, thickness: input.thickness, birdsmouth: input.seat, birdsmouthBy: "seat", wallThickness: input.wallThickness, wallHeight: frontWallHeight });
	if (!front || !rear) return null;
	// both rafters' top edges meet at the ridge: the rear plate sits wherever that leaves it
	const ridgeHeight = front.rise + front.hap;
	const rearWallDelta = ridgeHeight - (rear.rise + rear.hap);
	const warnings = [...new Set([...front.warnings, ...rear.warnings])];
	if (rearWallDelta + frontWallHeight < 1e-9) warnings.push("The rear wall would be below the floor; move the ridge or change a pitch");
	return {
		front,
		rear,
		frontRun,
		rearRun,
		ridgeOffset: span / 2 - frontRun,
		ridgeHeight,
		rearWallDelta,
		rearWallHeight: frontWallHeight + rearWallDelta,
		ridgeShorteningFront: ridgeThickness / 2 / cos(frontAngle),
		ridgeShorteningRear: ridgeThickness / 2 / cos(rearAngle),
		area: (front.overallLength + rear.overallLength) * buildingLength,
		warnings,
	};
}
