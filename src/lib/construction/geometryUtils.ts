/**
 * Site layout geometry: diagonals for squaring up and the string-line correction when a layout
 * measured from two reference stakes is out of square. All lengths in the same unit (inches).
 */

const DEG = 180 / Math.PI;

/** Diagonal of a rectangle (or hypotenuse of the right triangle) with these sides. */
export function diagonal(side1: number, side2: number): number {
	return Math.hypot(side1, side2);
}

export interface SquareUpInput {
	/** Distance between the two reference stakes, the side already fixed */
	referenceLength: number;
	/** Length of the side being squared, from the first reference stake */
	sideLength: number;
	/** How far past the far corner the string runs to its batterboard */
	batterboardGap: number;
	/** Diagonal as measured from the second reference stake to the far corner */
	currentDiagonal: number;
}

export interface SquareUpResult {
	correctDiagonal: number;
	/** Angle at the first reference stake as laid out now, degrees */
	currentAngle: number;
	/** Degrees the side must swing; positive opens the corner (away from the reference side) */
	swingDeg: number;
	/** Measured diagonal minus the correct one; negative means the corner is closed in */
	outOfSquare: number;
	/** Distance the far corner moves */
	moveAtCorner: number;
	/** Distance to move the string on the batterboard */
	moveAtBatterboard: number;
	direction: "away" | "toward" | "none";
}

/**
 * The far corner of the side being squared sits on a circle around the first stake, so the
 * measured diagonal fixes its current angle. Swinging it to 90° moves the corner along a chord,
 * and the string on the batterboard moves in proportion to its longer radius.
 */
export function squareUp(input: SquareUpInput): SquareUpResult | null {
	const { referenceLength: R, sideLength: S, batterboardGap: G, currentDiagonal: d } = input;
	if (!(R > 0) || !(S > 0) || !(G >= 0) || !(d > 0)) return null;
	const correctDiagonal = Math.hypot(R, S);
	const cos = (R * R + S * S - d * d) / (2 * R * S);
	if (cos <= -1 || cos >= 1) return null;
	const currentAngle = Math.acos(cos) * DEG;
	const swingDeg = 90 - currentAngle;
	const half = Math.abs(swingDeg) / 2 / DEG;
	const moveAtCorner = 2 * S * Math.sin(half);
	const moveAtBatterboard = 2 * (S + G) * Math.sin(half);
	const outOfSquare = d - correctDiagonal;
	const direction = Math.abs(swingDeg) < 1e-9 ? "none" : swingDeg > 0 ? "away" : "toward";
	return { correctDiagonal, currentAngle, swingDeg, outOfSquare, moveAtCorner, moveAtBatterboard, direction };
}
