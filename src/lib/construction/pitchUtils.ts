/**
 * Slope and right-triangle math for roof pitch, ramps, stairs and rafters.
 * Angles are in degrees. Pitch is rise per 12 units of run. Grade is percent.
 */

const DEG = 180 / Math.PI;

export function pitchToAngle(risePer12: number): number {
	return Math.atan(risePer12 / 12) * DEG;
}

export function angleToPitch(degrees: number): number {
	return Math.tan(degrees / DEG) * 12;
}

export function gradeToAngle(percent: number): number {
	return Math.atan(percent / 100) * DEG;
}

export function angleToGrade(degrees: number): number {
	return Math.tan(degrees / DEG) * 100;
}

export interface Slope {
	run: number;
	rise: number;
	angle: number;
	pitch: number;
	grade: number;
	/** Slope (hypotenuse) length */
	length: number;
}

export interface SlopeKnown {
	rise?: number;
	angle?: number;
	pitch?: number;
	grade?: number;
}

/** Solve a slope from a positive run and exactly one of rise, angle, pitch or grade. */
export function solveSlope(run: number, known: SlopeKnown): Slope | null {
	if (!(run > 0) || !Number.isFinite(run)) return null;
	const given = (["rise", "angle", "pitch", "grade"] as const).filter((k) => known[k] !== undefined);
	if (given.length !== 1) return null;

	let rise: number;
	switch (given[0]) {
		case "rise":
			rise = known.rise!;
			break;
		case "angle":
			if (Math.abs(known.angle!) >= 90) return null;
			rise = run * Math.tan(known.angle! / DEG);
			break;
		case "pitch":
			rise = (run * known.pitch!) / 12;
			break;
		default:
			rise = (run * known.grade!) / 100;
	}
	if (!Number.isFinite(rise)) return null;

	return {
		run,
		rise,
		angle: Math.atan(rise / run) * DEG,
		pitch: (rise / run) * 12,
		grade: (rise / run) * 100,
		length: Math.hypot(run, rise),
	};
}

/** Right triangle: legs a and b, hypotenuse c; A is opposite a, B opposite b, in degrees. */
export interface RightTriangle {
	a: number;
	b: number;
	c: number;
	A: number;
	B: number;
	area: number;
}

export type RightTriangleKnown = Partial<Pick<RightTriangle, "a" | "b" | "c" | "A" | "B">>;

/** Solve from any two knowns, at least one of them a side. Returns null when underdetermined or impossible. */
export function solveRightTriangle(known: RightTriangleKnown): RightTriangle | null {
	const k: RightTriangleKnown = {};
	for (const key of ["a", "b", "c", "A", "B"] as const) {
		const v = known[key];
		if (v !== undefined) {
			if (!Number.isFinite(v) || v <= 0) return null;
			k[key] = v;
		}
	}
	const sides = (["a", "b", "c"] as const).filter((s) => k[s] !== undefined);
	const angles = (["A", "B"] as const).filter((s) => k[s] !== undefined);
	if (sides.length + angles.length !== 2 || sides.length === 0) return null;

	let a: number, b: number, c: number;

	if (sides.length === 2) {
		if (k.a !== undefined && k.b !== undefined) {
			a = k.a;
			b = k.b;
			c = Math.hypot(a, b);
		} else if (k.a !== undefined && k.c !== undefined) {
			if (k.c <= k.a) return null;
			a = k.a;
			c = k.c;
			b = Math.sqrt(c * c - a * a);
		} else {
			if (k.c! <= k.b!) return null;
			b = k.b!;
			c = k.c!;
			a = Math.sqrt(c * c - b * b);
		}
	} else {
		const A = k.A !== undefined ? k.A : 90 - k.B!;
		if (A <= 0 || A >= 90) return null;
		const rad = A / DEG;
		if (k.a !== undefined) {
			a = k.a;
			c = a / Math.sin(rad);
			b = a / Math.tan(rad);
		} else if (k.b !== undefined) {
			b = k.b;
			a = b * Math.tan(rad);
			c = b / Math.cos(rad);
		} else {
			c = k.c!;
			a = c * Math.sin(rad);
			b = c * Math.cos(rad);
		}
	}

	const A = Math.atan2(a, b) * DEG;
	return { a, b, c, A, B: 90 - A, area: (a * b) / 2 };
}

// ── Formatting and reference ─────────────────────────────────────────────────

/** Decimal places for angle output: 1°, 0.1°, 0.01°, 0.001°. */
export type AnglePrecision = 0 | 1 | 2 | 3;

export const ANGLE_PRECISIONS: { value: AnglePrecision; label: string }[] = [
	{ value: 0, label: "1°" },
	{ value: 1, label: "0.1°" },
	{ value: 2, label: "0.01°" },
	{ value: 3, label: "0.001°" },
];

function trimZeros(text: string): string {
	return text.includes(".") ? text.replace(/\.?0+$/, "") : text;
}

/** `26.57°` at the given places (trailing zeros kept so the precision reads as chosen). */
export function formatAngle(degrees: number, places: AnglePrecision = 2): string {
	const f = 10 ** places;
	return `${(Math.round(degrees * f + 1e-9) / f).toFixed(places)}°`;
}

/** `6:12`, `4.5:12`: rise per 12 of run, trailing zeros trimmed. */
export function formatPitch(risePer12: number, places = 2): string {
	return `${trimZeros(risePer12.toFixed(places))}:12`;
}

/** `50%`, `33.33%`: rise over run as a percentage, trailing zeros trimmed. */
export function formatGrade(percent: number, places = 2): string {
	return `${trimZeros(percent.toFixed(places))}%`;
}

/** Slope length per unit of run for a pitch: 12:12 gives 1.4142. */
export function rafterMultiplier(risePer12: number): number {
	return Math.hypot(12, risePer12) / 12;
}

export interface PitchTableRow {
	pitch: number;
	angle: number;
	grade: number;
	multiplier: number;
}

/** Reference rows for whole-number pitches from `from`:12 to `to`:12. */
export function pitchTable(from = 1, to = 24): PitchTableRow[] {
	const rows: PitchTableRow[] = [];
	for (let p = from; p <= to; p++) {
		rows.push({ pitch: p, angle: pitchToAngle(p), grade: (p / 12) * 100, multiplier: rafterMultiplier(p) });
	}
	return rows;
}
