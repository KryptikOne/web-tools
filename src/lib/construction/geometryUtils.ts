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

// ── Regular polygons ─────────────────────────────────────────────────────────

export interface PolygonResult {
	sides: number;
	/** Circumscribed (bounding circle) radius */
	radius: number;
	sideLength: number;
	/** Centre to the middle of a side */
	apothem: number;
	interiorAngle: number;
	centralAngle: number;
	/** Area of one triangle from the centre to a side */
	triangleArea: number;
	area: number;
	perimeter: number;
	/** Bounding rectangle with one vertex pointing up */
	boundingWidth: number;
	boundingHeight: number;
	circumference: number;
	circleArea: number;
	/** Circle sector area per side */
	sliceArea: number;
	/** Segment between a side and the circle */
	segmentArea: number;
	/** Arc length around the circumference between vertices */
	arcPerSide: number;
	/** Vertex positions, centre origin, y up, first vertex straight up */
	vertices: { x: number; y: number }[];
}

export function regularPolygon(sides: number, radius: number): PolygonResult | null {
	const n = Math.floor(sides);
	if (n < 3 || n > 360 || !(radius > 0)) return null;
	const central = (2 * Math.PI) / n;
	const sideLength = 2 * radius * Math.sin(central / 2);
	const apothem = radius * Math.cos(central / 2);
	const triangleArea = (sideLength * apothem) / 2;
	const vertices = Array.from({ length: n }, (_, i) => {
		const a = Math.PI / 2 - i * central;
		return { x: radius * Math.cos(a), y: radius * Math.sin(a) };
	});
	const xs = vertices.map((v) => v.x);
	const ys = vertices.map((v) => v.y);
	const circumference = 2 * Math.PI * radius;
	const circleArea = Math.PI * radius * radius;
	return {
		sides: n,
		radius,
		sideLength,
		apothem,
		interiorAngle: ((n - 2) * 180) / n,
		centralAngle: 360 / n,
		triangleArea,
		area: triangleArea * n,
		perimeter: sideLength * n,
		boundingWidth: Math.max(...xs) - Math.min(...xs),
		boundingHeight: Math.max(...ys) - Math.min(...ys),
		circumference,
		circleArea,
		sliceArea: circleArea / n,
		segmentArea: circleArea / n - triangleArea,
		arcPerSide: circumference / n,
		vertices,
	};
}

// ── Circles ──────────────────────────────────────────────────────────────────

export interface CircleResult {
	radius: number;
	diameter: number;
	circumference: number;
	area: number;
}

export type CircleKnown = { radius: number } | { diameter: number } | { circumference: number } | { area: number };

export function solveCircle(known: CircleKnown): CircleResult | null {
	let r: number;
	if ("radius" in known) r = known.radius;
	else if ("diameter" in known) r = known.diameter / 2;
	else if ("circumference" in known) r = known.circumference / (2 * Math.PI);
	else r = Math.sqrt(known.area / Math.PI);
	if (!(r > 0) || !Number.isFinite(r)) return null;
	return { radius: r, diameter: 2 * r, circumference: 2 * Math.PI * r, area: Math.PI * r * r };
}

// ── Chords and arcs ──────────────────────────────────────────────────────────

export interface ArcResult {
	radius: number;
	diameter: number;
	chord: number;
	/** Sagitta: arc height above the chord */
	height: number;
	arcLength: number;
	/** Central angle in degrees */
	angle: number;
	/** Centre to the chord; negative when the arc is more than a semicircle */
	apothem: number;
	sectorArea: number;
	segmentArea: number;
}

export type ArcKey = "radius" | "chord" | "height" | "arcLength" | "angle";
export type ArcKnown = Partial<Record<ArcKey, number>>;

function bisect(f: (x: number) => number, lo: number, hi: number): number | null {
	let flo = f(lo);
	const fhi = f(hi);
	if (flo === 0) return lo;
	if (fhi === 0) return hi;
	if (flo * fhi > 0) return null;
	for (let i = 0; i < 200; i++) {
		const mid = (lo + hi) / 2;
		const fm = f(mid);
		if (fm === 0 || hi - lo < 1e-13) return mid;
		if (fm * flo < 0) hi = mid;
		else {
			lo = mid;
			flo = fm;
		}
	}
	return (lo + hi) / 2;
}

/**
 * Solve a circular arc from any two of radius, chord, height, arc length and central angle.
 * Angles up to 360° are allowed; a chord with an arc length picks the unique arc, and a height
 * with an arc length picks the arc under 266° where the pair is unambiguous.
 */
export function solveArc(known: ArcKnown): ArcResult | null {
	const keys = (Object.keys(known) as ArcKey[]).filter((k) => known[k] !== undefined);
	if (keys.length !== 2) return null;
	for (const k of keys) if (!(known[k]! > 0) || !Number.isFinite(known[k]!)) return null;
	const has = (k: ArcKey) => keys.includes(k);
	const { radius: R, chord: c, height: h, arcLength: s, angle: deg } = known;
	let r: number | undefined;
	let theta: number | undefined; // radians

	if (has("angle")) {
		theta = (deg! * Math.PI) / 180;
		if (theta > 2 * Math.PI) return null;
		if (has("radius")) r = R;
		else if (has("chord")) r = c! / (2 * Math.sin(theta / 2));
		else if (has("height")) r = h! / (1 - Math.cos(theta / 2));
		else r = s! / theta;
	} else if (has("radius")) {
		r = R!;
		if (has("chord")) {
			if (c! > 2 * r) return null;
			theta = 2 * Math.asin(c! / (2 * r));
		} else if (has("height")) {
			if (h! > 2 * r) return null;
			theta = 2 * Math.acos(1 - h! / r);
		} else {
			theta = s! / r;
			if (theta > 2 * Math.PI) return null;
		}
	} else if (has("chord") && has("height")) {
		r = (c! * c! / 4 + h! * h!) / (2 * h!);
		theta = 2 * Math.acos(1 - h! / r);
	} else if (has("chord") && has("arcLength")) {
		if (c! >= s!) return null;
		// c/s = sin(x)/x with x = θ/2 in (0, π]
		const ratio = c! / s!;
		const x = bisect((x) => Math.sin(x) / x - ratio, 1e-9, Math.PI);
		if (x === null) return null;
		theta = 2 * x;
		r = s! / theta;
	} else {
		// height and arc length: h/s = (1 - cos x)/(2x), x = θ/2, rising until x ≈ 2.331
		const ratio = h! / s!;
		const x = bisect((x) => (1 - Math.cos(x)) / (2 * x) - ratio, 1e-9, 2.3311);
		if (x === null) return null;
		theta = 2 * x;
		r = s! / theta;
	}

	if (r === undefined || theta === undefined || !(r > 0) || !(theta > 0) || !Number.isFinite(r)) return null;
	const chord = 2 * r * Math.sin(theta / 2);
	const height = r * (1 - Math.cos(theta / 2));
	return {
		radius: r,
		diameter: 2 * r,
		chord,
		height,
		arcLength: r * theta,
		angle: (theta * 180) / Math.PI,
		apothem: r - height,
		sectorArea: (r * r * theta) / 2,
		segmentArea: (r * r * (theta - Math.sin(theta))) / 2,
	};
}

// ── Diminishing lengths and the golden ratio ────────────────────────────────

export interface DiminishingInput {
	/** Length of the first member */
	firstLength: number;
	/** Angle of the line the members meet, from level */
	angle: number;
	centers: number;
	by: "count" | "run";
	count: number;
	/** Level run the members cover when `by` is "run" */
	run: number;
	/** Members get longer or shorter along the run */
	direction: "longer" | "shorter";
}

export interface Diminishing {
	lengths: number[];
	count: number;
	/** Change in length from one member to the next */
	commonDifference: number;
	/** Cut angle from square where a member meets the raked line */
	cutAngle: number;
	/** Level position of each member from the first */
	positions: number[];
	/** Length of the raked line covered */
	rakeLength: number;
	warnings: string[];
}

/** Members at set centers meeting a raked line: each is longer (or shorter) than the last by centers × tan(angle). */
export function diminishingLengths(input: DiminishingInput): Diminishing | null {
	const { firstLength, angle, centers, direction } = input;
	if (!(firstLength > 0) || !(angle > 0) || angle >= 90 || !(centers > 0)) return null;
	const n = input.by === "count" ? Math.floor(input.count) : Math.floor(input.run / centers + 1e-9) + 1;
	if (n < 1 || n > 1000) return null;
	const d = centers * Math.tan((angle * Math.PI) / 180) * (direction === "longer" ? 1 : -1);
	const lengths = Array.from({ length: n }, (_, i) => firstLength + i * d);
	const warnings: string[] = [];
	if (lengths.some((l) => l <= 0)) warnings.push("The members run out of length before the end of the run; fewer members or a longer first member");
	return {
		lengths,
		count: n,
		commonDifference: Math.abs(d),
		cutAngle: angle,
		positions: Array.from({ length: n }, (_, i) => i * centers),
		rakeLength: ((n - 1) * centers) / Math.cos((angle * Math.PI) / 180),
		warnings,
	};
}

export const PHI = (1 + Math.sqrt(5)) / 2;

export interface GoldenRatio {
	whole: number;
	long: number;
	short: number;
	ratio: number;
	/** Successive golden divisions of the short part, largest first */
	nested: number[];
}

/** Golden section from any one of the whole, the long part or the short part. */
export function goldenRatio(known: "whole" | "long" | "short", value: number, levels = 5): GoldenRatio | null {
	if (!(value > 0) || !Number.isFinite(value)) return null;
	let whole: number;
	if (known === "whole") whole = value;
	else if (known === "long") whole = value * PHI;
	else whole = value * PHI * PHI;
	const long = whole / PHI;
	const short = whole - long;
	const nested: number[] = [];
	let x = short;
	for (let i = 0; i < Math.max(0, Math.min(levels, 12)); i++) {
		x = x / PHI;
		nested.push(x);
	}
	return { whole, long, short, ratio: PHI, nested };
}
