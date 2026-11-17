/**
 * Braces: a diagonal brace across a rectangular frame, cut into the corners or square-ended, with
 * let-in notch positions; and a knee brace between a post and a beam with its housings. Lengths
 * in inches, angles in degrees. The brace centre line runs corner to corner.
 */

const DEG = 180 / Math.PI;

export interface DiagonalBraceInput {
	/** Inside the frame members */
	frameWidth: number;
	frameHeight: number;
	braceWidth: number;
	/** Ends cut to fit the corner (plumb and level cuts) or square to the brace */
	ends: "corner" | "square";
	/** Stud centers for let-in notches; 0 for a face-fixed brace */
	studCenters: number;
	studWidth: number;
}

export interface DiagonalBrace {
	/** Brace angle from level */
	angle: number;
	diagonal: number;
	/** Long point to long point and short point to short point */
	longLength: number;
	shortLength: number;
	/** Corner ends: the plumb cut against the post and the level cut along the plate at each end */
	plumbCut: number;
	levelCut: number;
	/** Cut angles from square */
	plumbCutAngle: number;
	levelCutAngle: number;
	/** Square ends: how far in from the corner the end sits along the centre line */
	squareSetIn: number;
	/** Let-in notches: for each stud crossed, its position along the plate and the notch top and bottom up the stud */
	notches: { x: number; bottom: number; top: number; depth: number }[];
	warnings: string[];
}

export function diagonalBrace(input: DiagonalBraceInput): DiagonalBrace | null {
	const { frameWidth: W, frameHeight: H, braceWidth: b, ends, studCenters, studWidth } = input;
	if (!(W > 0) || !(H > 0) || !(b > 0) || !(studCenters >= 0) || !(studWidth >= 0)) return null;
	const t = Math.atan2(H, W);
	const angle = t * DEG;
	const D = Math.hypot(W, H);
	const sin = Math.sin(t);
	const cos = Math.cos(t);
	const warnings: string[] = [];
	let longLength: number;
	let shortLength: number;
	let squareSetIn = 0;
	const plumbCut = b / 2 / cos;
	const levelCut = b / 2 / sin;
	if (ends === "corner") {
		longLength = D;
		shortLength = D - b / Math.sin(2 * t);
	} else {
		squareSetIn = Math.max((b / 2) * Math.tan(t), b / 2 / Math.tan(t));
		longLength = D - 2 * squareSetIn;
		shortLength = longLength;
	}
	if (shortLength <= 0) return null;
	if (angle < 30 || angle > 60) warnings.push(`A ${angle.toFixed(1)}° brace is flat for its job; 45° braces work best`);
	const notches: DiagonalBrace["notches"] = [];
	if (studCenters > 0) {
		const half = b / 2 / cos; // plumb height of the brace across a stud
		for (let x = studCenters; x < W - 1e-9 && notches.length < 500; x += studCenters) {
			const yc = x * Math.tan(t);
			notches.push({ x, bottom: yc - half, top: yc + half, depth: studWidth });
		}
	}
	return { angle, diagonal: D, longLength, shortLength, plumbCut, levelCut, plumbCutAngle: angle, levelCutAngle: 90 - angle, squareSetIn, notches, warnings };
}

// ── Knee brace ───────────────────────────────────────────────────────────────

export interface KneeBraceInput {
	/** Brace by angle from the beam with a run along it, or by rise down the post and run along the beam */
	by: "angle" | "rise-run";
	angle: number;
	run: number;
	rise: number;
	braceWidth: number;
	postWidth: number;
	beamDepth: number;
}

export interface KneeBrace {
	/** Angle from the beam (level) */
	angle: number;
	rise: number;
	run: number;
	/** Centre line length, outer (long point to long point) and inner edge lengths */
	centreLength: number;
	longLength: number;
	shortLength: number;
	/** Cut against the post is plumb: this angle from square; against the beam level: its complement */
	postCutAngle: number;
	beamCutAngle: number;
	/** Length of each end cut across the brace */
	postCutLength: number;
	beamCutLength: number;
	/** Housings: centre and length along the post (down from the corner) and along the beam (out from the corner) */
	postHousing: { centre: number; length: number; from: number; to: number };
	beamHousing: { centre: number; length: number; from: number; to: number };
	warnings: string[];
}

export function kneeBrace(input: KneeBraceInput): KneeBrace | null {
	const { by, braceWidth: b, postWidth, beamDepth } = input;
	if (!(b > 0) || !(postWidth >= 0) || !(beamDepth >= 0)) return null;
	let rise: number;
	let run: number;
	if (by === "angle") {
		if (!(input.angle > 0) || input.angle >= 90 || !(input.run > 0)) return null;
		run = input.run;
		rise = run * Math.tan(input.angle / DEG);
	} else {
		if (!(input.rise > 0) || !(input.run > 0)) return null;
		rise = input.rise;
		run = input.run;
	}
	const t = Math.atan2(rise, run);
	const angle = t * DEG;
	const sin = Math.sin(t);
	const cos = Math.cos(t);
	const Lc = Math.hypot(rise, run);
	const extra = b / Math.sin(2 * t);
	const postCutLength = b / cos;
	const beamCutLength = b / sin;
	const warnings: string[] = [];
	if (Lc - extra <= 0) return null;
	if (angle < 30 || angle > 60) warnings.push(`A ${angle.toFixed(1)}° knee brace is ${angle < 30 ? "flat" : "steep"}; 45° braces work best`);
	return {
		angle,
		rise,
		run,
		centreLength: Lc,
		longLength: Lc + extra,
		shortLength: Lc - extra,
		postCutAngle: angle,
		beamCutAngle: 90 - angle,
		postCutLength,
		beamCutLength,
		postHousing: { centre: rise, length: postCutLength, from: rise - postCutLength / 2, to: rise + postCutLength / 2 },
		beamHousing: { centre: run, length: beamCutLength, from: run - beamCutLength / 2, to: run + beamCutLength / 2 },
		warnings,
	};
}
