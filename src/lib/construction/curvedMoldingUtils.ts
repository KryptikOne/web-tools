/**
 * Curved molding: trim or crown around a curved wall or opening. Inside and outside radii, developed
 * lengths, straight segments with their end miters and the blank width to cut a curved face from
 * flat stock, kerf spacing for bent molding, and compound settings for crown on a curve. Lengths in
 * inches, angles in degrees.
 */

import { solveArc } from "./geometryUtils";
import { kerfBend, type KerfBend } from "./kerfUtils";

const DEG = 180 / Math.PI;

export interface CurvedMoldingInput {
	/** Radius of the curve the molding follows, at its inside face, or chord and rise of that curve */
	by: "radius" | "chord-rise";
	radius: number;
	chord: number;
	rise: number;
	/** Sweep of the curve the molding covers; from chord and rise this is derived */
	angle: number;
	width: number;
	thickness: number;
	/** Straight segments to build the curve from; 0 for a continuous (bent or sawn) piece */
	segments: number;
	/** Kerf bending: blade width and wood left, 0 blade for none */
	kerfWidth: number;
	kerfRemaining: number;
	/** Crown spring angle from the wall; 0 for flat trim */
	springAngle: number;
}

export interface MoldingSegment {
	index: number;
	/** Long point to long point on the outside face and on the inside face */
	outsideLength: number;
	insideLength: number;
	/** Miter at each end, from square */
	miter: number;
	/** Angle the segment subtends */
	angle: number;
}

export interface CurvedMolding {
	insideRadius: number;
	outsideRadius: number;
	centreRadius: number;
	angle: number;
	chord: number;
	rise: number;
	insideLength: number;
	outsideLength: number;
	centreLength: number;
	segments: MoldingSegment[];
	/** Flat stock width needed to saw a curved segment face: molding width plus the sagitta of the outside arc over one segment */
	blankWidth: number;
	/** Segment chord length on the outside, for the blank length */
	blankLength: number;
	kerf: KerfBend | null;
	/** Crown on the curve: saw settings between segments with the crown flat on the table, outside face down */
	crown: { miter: number; bevel: number; slopeFromHorizontal: number } | null;
	warnings: string[];
}

export function curvedMolding(input: CurvedMoldingInput): CurvedMolding | null {
	const { by, width: w, thickness: t, segments: n, kerfWidth, kerfRemaining, springAngle } = input;
	if (!(w > 0) || !(t > 0) || !(n >= 0) || !(kerfWidth >= 0) || !(springAngle >= 0) || springAngle >= 90) return null;
	let R: number;
	let angle: number;
	if (by === "radius") {
		R = input.radius;
		angle = input.angle;
	} else {
		const arc = solveArc({ chord: input.chord, height: input.rise });
		if (!arc) return null;
		R = arc.radius;
		angle = arc.angle;
	}
	if (!(R > 0) || !(angle > 0) || angle > 360) return null;
	const Ro = R + w;
	const Rc = R + w / 2;
	const rad = angle / DEG;
	const chord = 2 * R * Math.sin(Math.min(rad, Math.PI) / 2);
	const rise = R * (1 - Math.cos(Math.min(rad, Math.PI) / 2));
	const segs: MoldingSegment[] = [];
	const count = Math.floor(n);
	if (count > 1000) return null;
	let blankWidth = w;
	let blankLength = 0;
	if (count > 0) {
		const a = angle / count;
		const half = a / 2 / DEG;
		for (let i = 0; i < count; i++) segs.push({ index: i + 1, outsideLength: 2 * Ro * Math.sin(half), insideLength: 2 * R * Math.sin(half), miter: a / 2, angle: a });
		blankWidth = w + Ro * (1 - Math.cos(half));
		blankLength = 2 * Ro * Math.sin(half);
	}
	const kerf = kerfWidth > 0 && kerfRemaining > 0 && kerfRemaining < t ? kerfBend({ thickness: t, kerfWidth, remaining: kerfRemaining, insideRadius: R, by: "angle", angle, arcLength: 0, round: "up" }) : null;
	let crown: CurvedMolding["crown"] = null;
	if (springAngle > 0 && count > 0) {
		const slope = (90 - springAngle) / DEG;
		const phi = (segs[0].angle / 2) / DEG;
		crown = { miter: Math.atan(Math.cos(slope) * Math.tan(phi)) * DEG, bevel: Math.asin(Math.sin(slope) * Math.cos(phi)) * DEG, slopeFromHorizontal: 90 - springAngle };
	}
	const warnings: string[] = [];
	if (count > 0 && segs[0].miter > 22.5) warnings.push("Segments turn more than 45° each; use more pieces for a smoother curve");
	if (count === 0 && !kerf) warnings.push("No segments and no kerf: the molding is sawn or steam bent as one piece");
	return {
		insideRadius: R,
		outsideRadius: Ro,
		centreRadius: Rc,
		angle,
		chord,
		rise,
		insideLength: rad * R,
		outsideLength: rad * Ro,
		centreLength: rad * Rc,
		segments: segs,
		blankWidth,
		blankLength,
		kerf,
		crown,
		warnings,
	};
}
