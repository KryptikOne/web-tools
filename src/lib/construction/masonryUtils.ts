/**
 * Brickwork: vertical gauge (courses to a height and the joint that hits it exactly) and horizontal
 * bond (bricks per course with the perp joint adjusted, cut bricks at the ends, quantities and
 * mortar). Lengths in inches, volumes in cubic inches unless named otherwise. Shared by the block
 * calculator, which is brickwork with bigger units.
 */

export interface GaugeInput {
	unitHeight: number;
	bedJoint: number;
	/** Solve for the course count from a height, or the height from a count */
	by: "height" | "courses";
	targetHeight: number;
	courses: number;
	/** Smallest and largest bed joint allowed when adjusting */
	minJoint: number;
	maxJoint: number;
	/** Heads and sills to snap to the nearest course line */
	openings?: { label: string; height: number }[];
}

export interface Gauge {
	courses: number;
	/** Course height with the entered joint */
	nominalGauge: number;
	/** Height the entered joint gives */
	nominalHeight: number;
	/** Joint needed so the courses hit the target height exactly */
	adjustedJoint: number;
	adjustedGauge: number;
	/** The height actually reached: the target when the joint can be adjusted, else the nominal */
	height: number;
	jointInRange: boolean;
	/** Top of each course from the base, adjusted gauge */
	courseHeights: number[];
	openings: { label: string; height: number; course: number; snapped: number; difference: number }[];
	warnings: string[];
}

export function gauge(input: GaugeInput): Gauge | null {
	const { unitHeight: h, bedJoint: j, by, minJoint, maxJoint } = input;
	if (!(h > 0) || !(j >= 0) || !(minJoint >= 0) || !(maxJoint >= minJoint)) return null;
	const nominalGauge = h + j;
	let courses: number;
	let target: number;
	if (by === "height") {
		if (!(input.targetHeight > 0)) return null;
		courses = Math.max(1, Math.round(input.targetHeight / nominalGauge));
		target = input.targetHeight;
	} else {
		courses = Math.max(1, Math.floor(input.courses));
		target = courses * nominalGauge;
	}
	if (courses > 2000) return null;
	const nominalHeight = courses * nominalGauge;
	// the first course sits on a bed joint too: height = courses × (unit + joint)
	const adjustedJoint = target / courses - h;
	const jointInRange = adjustedJoint >= minJoint - 1e-9 && adjustedJoint <= maxJoint + 1e-9;
	const g = jointInRange ? target / courses : nominalGauge;
	const height = g * courses;
	const warnings: string[] = [];
	if (!jointInRange) warnings.push(`Hitting ${target.toFixed(2)} in exactly needs a ${adjustedJoint.toFixed(3)} in bed joint, outside ${minJoint} to ${maxJoint} in; ${courses} courses at the entered joint reach ${nominalHeight.toFixed(2)} in`);
	const courseHeights = Array.from({ length: courses }, (_, i) => (i + 1) * g);
	const openings = (input.openings ?? [])
		.filter((o) => o.height > 0)
		.map((o) => {
			const course = Math.max(0, Math.round(o.height / g));
			return { label: o.label, height: o.height, course, snapped: course * g, difference: course * g - o.height };
		});
	return { courses, nominalGauge, nominalHeight, adjustedJoint, adjustedGauge: g, height, jointInRange, courseHeights, openings, warnings };
}

// ── Bond ─────────────────────────────────────────────────────────────────────

export type BondPattern = "stretcher" | "header" | "english" | "flemish" | "stack";
export const BOND_PATTERNS: { value: BondPattern; label: string; hint: string }[] = [
	{ value: "stretcher", label: "Stretcher", hint: "Every course stretchers, each course offset half a brick" },
	{ value: "header", label: "Header", hint: "Every course headers, offset half a header" },
	{ value: "english", label: "English", hint: "Alternate courses of stretchers and headers" },
	{ value: "flemish", label: "Flemish", hint: "Stretcher and header alternating in every course" },
	{ value: "stack", label: "Stack", hint: "Stretchers with perps in line, no offset" },
];

export interface BondInput {
	wallLength: number;
	brickLength: number;
	brickWidth: number;
	brickHeight: number;
	perpJoint: number;
	bedJoint: number;
	pattern: BondPattern;
	/** Change the perp so whole bricks fit, or keep it and cut the end bricks */
	fit: "adjust-perps" | "cut-ends";
	minJoint: number;
	maxJoint: number;
	courses: number;
	wastePercent: number;
	pricePerBrick: number;
}

export interface CourseLayout {
	/** Each unit along the course: length laid, header or stretcher, cut or whole */
	units: { near: number; far: number; length: number; header: boolean; cut: boolean }[];
	whole: number;
	cut: number;
}

export interface Bond {
	/** Stretchers per course at the entered perp, as a decimal */
	stretchersExact: number;
	/** Perp joint needed so whole stretchers fill the length exactly */
	adjustedPerp: number;
	perp: number;
	perpInRange: boolean;
	/** The two course types that alternate (identical for stretcher, header and stack) */
	courseA: CourseLayout;
	courseB: CourseLayout;
	/** Face bricks per course, averaged over the two course types, cut bricks counted whole */
	bricksPerCourse: number;
	bricksTotal: number;
	bricksWithWaste: number;
	/** Face bricks per square foot and per square metre of wall */
	perSquareFoot: number;
	perSquareMetre: number;
	wallArea: number;
	/** Mortar in the face, cubic feet, bed and perp joints one brick deep */
	mortarCubicFeet: number;
	cost: number;
	warnings: string[];
}

function layCourse(L: number, pattern: BondPattern, odd: boolean, brickLength: number, brickWidth: number, perp: number): CourseLayout {
	const units: CourseLayout["units"] = [];
	// the repeating unit of the pattern and where this course starts in it
	const seq: { len: number; header: boolean }[] = [];
	const S = { len: brickLength, header: false };
	const H = { len: brickWidth, header: true };
	switch (pattern) {
		case "header":
			seq.push(H);
			break;
		case "english":
			seq.push(odd ? H : S);
			break;
		case "flemish":
			seq.push(S, H);
			break;
		default:
			seq.push(S);
	}
	// offset the odd course by half a unit so perps are staggered (not for stack bond)
	let x = 0;
	let i = 0;
	if (pattern !== "stack" && odd) {
		const first = pattern === "english" ? brickWidth / 2 : pattern === "flemish" ? brickLength / 2 + perp / 2 + brickWidth / 2 : seq[0].len / 2;
		// start with a cut piece (queen closer / half bat) so the joints break
		const len = Math.min(first - perp / 2, L);
		units.push({ near: 0, far: len, length: len, header: seq[0].header, cut: true });
		x = len + perp;
		i = 1;
	}
	let guard = 0;
	while (x < L - 1e-9 && guard++ < 5000) {
		const u = seq[i % seq.length];
		const len = Math.min(u.len, L - x);
		units.push({ near: x, far: x + len, length: len, header: u.header, cut: len < u.len - 1e-9 });
		x += len + perp;
		i++;
	}
	return { units, whole: units.filter((u) => !u.cut).length, cut: units.filter((u) => u.cut).length };
}

export function bond(input: BondInput): Bond | null {
	const { wallLength: L, brickLength: b, brickWidth: w, brickHeight: h, perpJoint: p0, bedJoint, pattern, fit, minJoint, maxJoint, courses, wastePercent, pricePerBrick } = input;
	if (!(L > 0) || !(b > 0) || !(w > 0) || !(h > 0) || !(p0 >= 0) || !(bedJoint >= 0) || !(courses >= 1) || !(minJoint >= 0) || !(maxJoint >= minJoint)) return null;
	if (L / Math.min(b, w) > 5000 || courses > 10000) return null;
	const stretchersExact = (L + p0) / (b + p0);
	const n = Math.max(1, Math.round(stretchersExact));
	const adjustedPerp = n > 1 ? (L - n * b) / (n - 1) : 0;
	const perpInRange = adjustedPerp >= minJoint - 1e-9 && adjustedPerp <= maxJoint + 1e-9;
	const warnings: string[] = [];
	let perp = p0;
	if (fit === "adjust-perps") {
		if (perpInRange) perp = adjustedPerp;
		else warnings.push(`Whole stretchers need a ${adjustedPerp.toFixed(3)} in perp, outside ${minJoint} to ${maxJoint} in; perps kept at ${p0} in with cut ends`);
	}
	const courseA = layCourse(L, pattern, false, b, w, perp);
	const courseB = layCourse(L, pattern, true, b, w, perp);
	const perCourseA = courseA.units.length;
	const perCourseB = courseB.units.length;
	const bricksPerCourse = (perCourseA + perCourseB) / 2;
	const evenCourses = Math.ceil(courses / 2);
	const oddCourses = Math.floor(courses / 2);
	const bricksTotal = evenCourses * perCourseA + oddCourses * perCourseB;
	const bricksWithWaste = Math.ceil(bricksTotal * (1 + Math.max(0, wastePercent) / 100) - 1e-9);
	const gaugeH = h + bedJoint;
	const wallHeight = courses * gaugeH;
	const wallArea = L * wallHeight;
	const faceA = b * h;
	const perSquareFoot = 144 / ((b + perp) * gaugeH);
	const perSquareMetre = perSquareFoot / 0.09290304;
	// mortar: bed joints the full length by brick width, plus perps between units
	const bedVol = courses * L * w * bedJoint;
	const perpVol = (evenCourses * Math.max(0, perCourseA - 1) + oddCourses * Math.max(0, perCourseB - 1)) * perp * w * h;
	void faceA;
	return {
		stretchersExact,
		adjustedPerp,
		perp,
		perpInRange,
		courseA,
		courseB,
		bricksPerCourse,
		bricksTotal,
		bricksWithWaste,
		perSquareFoot,
		perSquareMetre,
		wallArea,
		mortarCubicFeet: (bedVol + perpVol) / 1728,
		cost: bricksWithWaste * Math.max(0, pricePerBrick),
		warnings,
	};
}

/** Standard brick and block sizes, actual dimensions in inches (length × width × height). */
export const MASONRY_UNITS: { id: string; label: string; length: number; width: number; height: number; joint: number }[] = [
	{ id: "modular", label: "Modular brick 7 5/8 × 3 5/8 × 2 1/4", length: 7.625, width: 3.625, height: 2.25, joint: 0.375 },
	{ id: "standard", label: "Standard brick 8 × 3 5/8 × 2 1/4", length: 8, width: 3.625, height: 2.25, joint: 0.375 },
	{ id: "queen", label: "Queen brick 7 5/8 × 2 3/4 × 2 3/4", length: 7.625, width: 2.75, height: 2.75, joint: 0.375 },
	{ id: "king", label: "King brick 9 5/8 × 2 5/8 × 2 5/8", length: 9.625, width: 2.625, height: 2.625, joint: 0.375 },
	{ id: "uk", label: "UK brick 215 × 102.5 × 65 mm", length: 215 / 25.4, width: 102.5 / 25.4, height: 65 / 25.4, joint: 10 / 25.4 },
	{ id: "au", label: "AU brick 230 × 110 × 76 mm", length: 230 / 25.4, width: 110 / 25.4, height: 76 / 25.4, joint: 10 / 25.4 },
	{ id: "block-8", label: "Block 15 5/8 × 7 5/8 × 7 5/8 (8 in)", length: 15.625, width: 7.625, height: 7.625, joint: 0.375 },
];
