/**
 * Gable studs: the studs under a raked top plate, either one slope (a half gable or raked wall)
 * or both slopes of a full gable end. Lengths in inches, angles in degrees. Positions come from
 * the wall framing layout engine so end assemblies and offsets behave the same as a level wall.
 */

import { studLayout, type EndStyle, type Stud } from "./framingUtils";
import { boardFeet, type BoardSection } from "./lumberUtils";

const DEG = 180 / Math.PI;

export type GableShape = "half" | "full";
export type GableLayoutFrom = "end" | "center";

export interface GableStudInput {
	/** Level length of the plate the studs stand on */
	width: number;
	/** Roof angle from level */
	angle: number;
	shape: GableShape;
	/** Wall height at the low end (half) or at both ends (full), top of top plate to bottom of bottom plate */
	startHeight: number;
	/** Stud thickness along the wall */
	studWidth: number;
	/** Stud depth through the wall, for board feet */
	studDepth: number;
	centers: number;
	/** Layout from the start end, or with a stud centred under the ridge (full gable only) */
	from: GableLayoutFrom;
	/** Shifts the regular layout when laying out from the end */
	firstStudOffset: number;
	startWith: EndStyle;
	endWith: EndStyle;
	plateThickness: number;
	topPlates: number;
	bottomPlates: number;
}

export interface GableStud extends Stud {
	/** Length to the long point, square to the plate */
	long: number;
	/** Length to the short point */
	short: number;
	/** True for a full-gable stud that straddles the ridge and is cut to a point */
	peak: boolean;
}

export interface GableStuds {
	studs: GableStud[];
	count: number;
	/** Change in length from one stud to the next at the given centers */
	commonDifference: number;
	/** Saw miter from square for the top cut */
	cutAngle: number;
	/** Wall height at the high end (half) or the ridge (full), including plates */
	peakHeight: number;
	/** Rise of the rake over its run */
	rise: number;
	/** Length of raked top plate, both slopes for a full gable */
	rakeLength: number;
	/** Plumb thickness of a top plate on the rake */
	platePlumb: number;
	totalLength: number;
	boardFeet: number;
	warnings: string[];
}

/** Rake angle from the heights at the low end and the peak. */
export function gableAngleFromHeights(width: number, shape: GableShape, startHeight: number, peakHeight: number): number | null {
	const run = shape === "full" ? width / 2 : width;
	if (!(run > 0) || !(peakHeight > startHeight)) return null;
	return Math.atan((peakHeight - startHeight) / run) * DEG;
}

export function gableStuds(input: GableStudInput): GableStuds | null {
	const { width: W, angle, shape, startHeight, studWidth: w, studDepth, centers, plateThickness: t, topPlates, bottomPlates } = input;
	if (!(W > 0) || !(angle > 0) || angle >= 90 || !(startHeight > 0) || !(w > 0) || !(studDepth > 0) || !(centers > 0) || !(t >= 0)) return null;
	const rad = angle / DEG;
	const tan = Math.tan(rad);
	const cos = Math.cos(rad);
	const platePlumb = t / cos;
	const run = shape === "full" ? W / 2 : W;
	const rise = run * tan;
	const peakHeight = startHeight + rise;
	// stud length under the plates at a level distance `d` from the low end of its slope
	const base = startHeight - bottomPlates * t - topPlates * platePlumb;
	const lengthAt = (d: number) => base + d * tan;

	const firstStudOffset = input.from === "center" && shape === "full" ? ((W / 2) % centers + centers) % centers : input.firstStudOffset;
	const layout = studLayout({
		wallLength: W,
		studWidth: w,
		studDepth,
		centers,
		sheetWidth: 48,
		startWith: input.startWith,
		endWith: input.endWith,
		firstStudOffset,
		sheetStart: "exterior",
		orthogonalWalls: false,
		studHeight: 1,
		rakeAngle: 0,
	});
	if (!layout) return null;

	const warnings: string[] = [];
	const studs: GableStud[] = layout.studs.map((s) => {
		let long: number;
		let short: number;
		let peak = false;
		if (shape === "half") {
			long = lengthAt(s.far);
			short = lengthAt(s.near);
		} else if (s.far <= W / 2 + 1e-9) {
			long = lengthAt(s.far);
			short = lengthAt(s.near);
		} else if (s.near >= W / 2 - 1e-9) {
			long = lengthAt(W - s.near);
			short = lengthAt(W - s.far);
		} else {
			peak = true;
			long = lengthAt(W / 2);
			short = Math.min(lengthAt(s.near), lengthAt(W - s.far));
		}
		return { ...s, long, short, peak };
	});
	if (studs.some((s) => s.short <= 0)) warnings.push("The plates take the whole wall height at the low end; raise the start height");
	if (studs.some((s) => s.peak)) warnings.push("The ridge falls inside a stud; that stud is cut to a point with the top cut on both faces");

	const section: BoardSection = { width: studDepth, thickness: w };
	const totalLength = studs.reduce((sum, s) => sum + Math.max(0, s.long), 0);
	return {
		studs,
		count: studs.length,
		commonDifference: centers * tan,
		cutAngle: angle,
		peakHeight,
		rise,
		rakeLength: W / cos,
		platePlumb,
		totalLength,
		boardFeet: boardFeet(section, totalLength),
		warnings,
	};
}

/** Positions along the raked plate's underside for each level position, measured from the low end. */
export function alongRake(levelPositions: number[], angle: number): number[] {
	const cos = Math.cos(angle / DEG);
	return levelPositions.map((p) => p / cos);
}
