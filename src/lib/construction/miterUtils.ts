/**
 * Miter joints: plain miters between boards of different widths and compound miters for sloped
 * multi-sided forms. Angles in degrees, lengths in inches.
 */

const DEG = 180 / Math.PI;

// ── Plain miter between two widths ───────────────────────────────────────────

export interface MiterJoint {
	/** Angle between piece 1's edge and the joint line */
	angle1: number;
	/** Angle between piece 2's edge and the joint line */
	angle2: number;
	/** Miter saw settings, measured from a square cut */
	saw1: number;
	saw2: number;
	/** Length of the joint line, outer corner to inner corner */
	jointLength: number;
}

/**
 * Two boards meeting at `cornerAngle` (interior angle, 90 for a square corner). The joint runs
 * from the outer corner to where the inner edges cross, so with unequal widths it is not the
 * bisector: sin(a1) / sin(a2) = w1 / w2 with a1 + a2 = corner angle.
 */
export function miterJoint(width1: number, width2: number, cornerAngle: number): MiterJoint | null {
	if (!(width1 > 0) || !(width2 > 0) || !(cornerAngle > 0) || cornerAngle >= 180) return null;
	const t = cornerAngle / DEG;
	const a1 = Math.atan2(width1 * Math.sin(t), width2 + width1 * Math.cos(t));
	const a2 = t - a1;
	return {
		angle1: a1 * DEG,
		angle2: a2 * DEG,
		saw1: 90 - a1 * DEG,
		saw2: 90 - a2 * DEG,
		jointLength: width1 / Math.sin(a1),
	};
}

// ── Compound miter for sloped sides ──────────────────────────────────────────

export interface CompoundMiterInput {
	sides: number;
	/** Side angle from horizontal: 90 is a vertical box, 0 a flat frame */
	slope: number;
	thickness: number;
	/** Outside across-flats width at the base */
	baseWidth: number;
	/** Vertical height of the form */
	height: number;
}

export interface CompoundMiter {
	sides: number;
	/** Half the corner angle in plan: 180 / sides. 45 for a square form */
	flatMiter: number;
	/** Corner angle in plan */
	cornerAngle: number;
	/** Saw miter setting with the piece flat on the table, outside face down */
	miter: number;
	/** Saw bevel setting */
	bevel: number;
	/** Outside length of the piece along its base edge */
	baseLength: number;
	/** Outside length along its top edge; 0 when the sides meet at a point */
	topLength: number;
	/** Length of the piece across its face, base edge to top edge */
	slantHeight: number;
	/** How far each cut end is set in through the thickness on the inside face */
	bevelInset: number;
	/** Across-flats width at the top, outside */
	topWidth: number;
	/** Height at which the sides would meet, for a closed pyramid; Infinity when vertical */
	apexHeight: number;
}

/**
 * Standard compound miter solution with the piece lying flat on the saw, outside face down:
 * tan(miter) = cos(slope) · tan(flatMiter), sin(bevel) = sin(slope) · cos(flatMiter).
 */
export function compoundMiter(input: CompoundMiterInput): CompoundMiter | null {
	const { sides, slope, thickness, baseWidth, height } = input;
	const n = Math.floor(sides);
	if (n < 3 || !(slope > 0) || slope > 90 || !(thickness >= 0) || !(baseWidth > 0) || !(height > 0)) return null;
	const phi = Math.PI / n;
	const s = slope / DEG;
	const miter = Math.atan(Math.cos(s) * Math.tan(phi));
	const bevel = Math.asin(Math.sin(s) * Math.cos(phi));
	const baseApothem = baseWidth / 2;
	const inset = slope === 90 ? 0 : height / Math.tan(s);
	const topApothem = baseApothem - inset;
	const slantHeight = height / Math.sin(s);
	const apexHeight = slope === 90 ? Infinity : baseApothem * Math.tan(s);
	if (topApothem < -1e-9) return null;
	return {
		sides: n,
		flatMiter: phi * DEG,
		cornerAngle: 180 - 2 * phi * DEG,
		miter: miter * DEG,
		bevel: bevel * DEG,
		baseLength: 2 * baseApothem * Math.tan(phi),
		topLength: Math.max(0, 2 * topApothem * Math.tan(phi)),
		slantHeight,
		bevelInset: thickness * Math.tan(bevel),
		topWidth: Math.max(0, 2 * topApothem),
		apexHeight,
	};
}

/** Corners of the outside face of one piece, laid flat: base edge along y = 0, top edge above. */
export function compoundFaceOutline(m: CompoundMiter): { x: number; y: number }[] {
	const half = m.baseLength / 2;
	const topHalf = m.topLength / 2;
	return [
		{ x: -half, y: 0 },
		{ x: half, y: 0 },
		{ x: topHalf, y: m.slantHeight },
		{ x: -topHalf, y: m.slantHeight },
	];
}
