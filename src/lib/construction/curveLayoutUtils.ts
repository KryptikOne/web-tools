/**
 * Setting out curves on site: a circular arc by offsets from its chord, gothic arches (two-centre
 * and Tudor four-centre) and ovals (true ellipse by string and pins or offsets, and the four-centre
 * compass approximation). Lengths in inches, angles in degrees. x runs along the chord or major
 * axis from the left end, y is the offset up from it.
 */

import { solveArc } from "./geometryUtils";

const DEG = 180 / Math.PI;

export interface Offset {
	x: number;
	y: number;
}

/** Offsets at `interval` from x = 0 to `length`, always ending on the far end. */
function offsetsAlong(length: number, interval: number, y: (x: number) => number, maxRows = 2000): Offset[] {
	if (!(interval > 0) || !(length > 0)) return [];
	const n = Math.floor(length / interval + 1e-9);
	if (n + 1 > maxRows) return [];
	const rows: Offset[] = [];
	for (let i = 0; i <= n; i++) rows.push({ x: i * interval, y: Math.max(0, y(i * interval)) });
	if (length - n * interval > 1e-9) rows.push({ x: length, y: Math.max(0, y(length)) });
	return rows;
}

// ── Circular arc ─────────────────────────────────────────────────────────────

export interface ArcLayoutInput {
	by: "chord-rise" | "radius-chord";
	chord: number;
	rise: number;
	radius: number;
	interval: number;
}

export interface ArcLayout {
	radius: number;
	chord: number;
	rise: number;
	arcLength: number;
	angle: number;
	/** Centre below the chord midpoint; negative when the arc is more than a semicircle */
	centreBelowChord: number;
	offsets: Offset[];
	/** Offset at any x along the chord */
	y: (x: number) => number;
}

export function arcLayout(input: ArcLayoutInput): ArcLayout | null {
	const { by, chord: c, interval } = input;
	if (!(c > 0)) return null;
	const arc = by === "chord-rise" ? solveArc({ chord: c, height: input.rise }) : solveArc({ chord: c, radius: input.radius });
	if (!arc) return null;
	const R = arc.radius;
	const h = arc.height;
	const d = R - h; // centre below the chord
	const y = (x: number) => {
		const u = x - c / 2;
		const s = R * R - u * u;
		return s <= 0 ? 0 : Math.sqrt(s) - d;
	};
	return { radius: R, chord: c, rise: h, arcLength: arc.arcLength, angle: arc.angle, centreBelowChord: d, offsets: offsetsAlong(c, interval, y), y };
}

// ── Gothic arches ────────────────────────────────────────────────────────────

export type GothicStyle = "equilateral" | "lancet" | "drop" | "tudor" | "custom";
export const GOTHIC_STYLES: { value: GothicStyle; label: string; hint: string }[] = [
	{ value: "equilateral", label: "Equilateral", hint: "Radius equal to the span, centres at the springing points" },
	{ value: "lancet", label: "Lancet", hint: "Taller: radius greater than the span, centres outside the span" },
	{ value: "drop", label: "Drop", hint: "Lower: radius less than the span, centres inside the span" },
	{ value: "tudor", label: "Tudor (four-centre)", hint: "Small arcs at the springings, flat arcs to a low point" },
	{ value: "custom", label: "Custom rise", hint: "Two-centre arch to any rise above half the span" },
];

export interface GothicInput {
	span: number;
	style: GothicStyle;
	/** Rise for custom (two-centre) and tudor arches */
	rise: number;
	interval: number;
}

export interface GothicArch {
	style: GothicStyle;
	span: number;
	rise: number;
	/** Two-centre: the centres on the springing line, from the left springing point, and the one radius */
	centres: { x: number; y: number; radius: number; label: string }[];
	/** Where the arcs change over, Tudor only */
	junctions: Offset[];
	offsets: Offset[];
	y: (x: number) => number;
	/** Angle at the apex between the two arcs */
	apexAngle: number;
	warnings: string[];
}

function twoCentre(span: number, rise: number, style: GothicStyle, interval: number): GothicArch | null {
	const S = span;
	if (!(rise >= S / 2 - 1e-9)) return null;
	// the right-hand arc is centred at xc on the springing line and passes through the right springing point
	const xc = (3 * S) / 4 - (rise * rise) / S;
	const R = S - xc;
	const yArc = (x: number) => {
		// right half uses the right arc (centre xc), left half mirrors it
		const u = x <= S / 2 ? S - x - xc : x - xc;
		const s = R * R - u * u;
		return s <= 0 ? 0 : Math.sqrt(s);
	};
	// tangent at the apex of the right arc: the radius to the apex makes angle atan((S/2 − xc)/rise) with the vertical
	const half = Math.atan2(S / 2 - xc, rise) * DEG;
	const warnings: string[] = [];
	if (xc < 0) warnings.push(`Centres fall ${(-xc).toFixed(2)} in outside the span; set out from a line extended past the springing points`);
	return {
		style,
		span: S,
		rise,
		centres: [
			{ x: S - xc, y: 0, radius: R, label: "left arc" },
			{ x: xc, y: 0, radius: R, label: "right arc" },
		],
		junctions: [],
		offsets: offsetsAlong(S, interval, yArc),
		y: yArc,
		apexAngle: 180 - 2 * half,
		warnings,
	};
}

function tudor(span: number, rise: number, interval: number): GothicArch | null {
	const S = span;
	const r1 = S / 4;
	if (!(rise > r1) || rise >= S) return null;
	// small arcs centred at S/4 and 3S/4 on the springing line; the left large arc is centred below the
	// right small centre, at depth d, so that its arc through the junction reaches the apex
	const c1 = S / 4;
	const c1r = (3 * S) / 4;
	const f = (d: number) => {
		const R2 = Math.hypot(c1r - c1, d) + r1;
		return Math.hypot(S / 2 - c1r, rise + d) - R2;
	};
	let lo = 0;
	let hi = 10 * S;
	if (f(lo) * f(hi) > 0) return null;
	for (let i = 0; i < 200; i++) {
		const mid = (lo + hi) / 2;
		if (f(lo) * f(mid) <= 0) hi = mid;
		else lo = mid;
	}
	const d = (lo + hi) / 2;
	const R2 = Math.hypot(c1r - c1, d) + r1;
	// junction on the line from the large centre through the small centre, r1 beyond it
	const ux = (c1 - c1r) / Math.hypot(c1 - c1r, d);
	const uy = d / Math.hypot(c1 - c1r, d);
	const jx = c1 + ux * r1;
	const jy = 0 + uy * r1;
	const yArc = (x: number) => {
		const xm = x <= S / 2 ? x : S - x; // mirror onto the left half
		if (xm <= jx) {
			const s = r1 * r1 - (xm - c1) ** 2;
			return s <= 0 ? 0 : Math.sqrt(s);
		}
		const s = R2 * R2 - (xm - c1r) ** 2;
		return s <= 0 ? 0 : Math.sqrt(s) - d;
	};
	const half = Math.atan2(c1r - S / 2, rise + d) * DEG;
	return {
		style: "tudor",
		span: S,
		rise,
		centres: [
			{ x: c1, y: 0, radius: r1, label: "left small arc" },
			{ x: c1r, y: 0, radius: r1, label: "right small arc" },
			{ x: c1r, y: -d, radius: R2, label: "left large arc" },
			{ x: c1, y: -d, radius: R2, label: "right large arc" },
		],
		junctions: [
			{ x: jx, y: jy },
			{ x: S - jx, y: jy },
		],
		offsets: offsetsAlong(S, interval, yArc),
		y: yArc,
		apexAngle: 180 - 2 * half,
		warnings: [],
	};
}

export function gothicArch(input: GothicInput): GothicArch | null {
	const { span: S, style, interval } = input;
	if (!(S > 0)) return null;
	switch (style) {
		case "equilateral":
			return twoCentre(S, (S * Math.sqrt(3)) / 2, style, interval);
		case "lancet":
			return twoCentre(S, S, style, interval);
		case "drop":
			return twoCentre(S, 0.7 * S, style, interval);
		case "tudor":
			return tudor(S, input.rise, interval);
		default:
			return twoCentre(S, input.rise, style, interval);
	}
}

// ── Ovals ────────────────────────────────────────────────────────────────────

export interface OvalInput {
	major: number;
	minor: number;
	interval: number;
}

export interface Oval {
	a: number;
	b: number;
	/** Foci from the centre along the major axis, and the string length for the pins method */
	focalDistance: number;
	stringLength: number;
	/** Ramanujan's approximation */
	perimeter: number;
	area: number;
	/** Offsets from the major axis, left end to right end */
	offsets: Offset[];
	y: (x: number) => number;
	/** Four-centre compass approximation: end arcs and side arcs */
	fourCentre: { endRadius: number; endCentre: number; sideRadius: number; sideCentreBelow: number; junctionX: number; junctionY: number };
}

export function oval(input: OvalInput): Oval | null {
	const a = input.major / 2;
	const b = input.minor / 2;
	if (!(a > 0) || !(b > 0) || b > a) return null;
	const c = Math.sqrt(a * a - b * b);
	const h = (a - b) ** 2 / (a + b) ** 2;
	const perimeter = Math.PI * (a + b) * (1 + (3 * h) / (10 + Math.sqrt(4 - 3 * h)));
	const y = (x: number) => {
		const u = x - a;
		const s = 1 - (u * u) / (a * a);
		return s <= 0 ? 0 : b * Math.sqrt(s);
	};
	// end arcs with the ellipse's own curvature at the end of the major axis, side arcs tangent to them
	const r = (b * b) / a;
	const R = ((a - r) ** 2 + b * b - r * r) / (2 * (b - r));
	const endCentre = a - r;
	const sideBelow = R - b;
	// junction lies on the line from the side centre (0, −sideBelow) through the end centre (endCentre, 0), r beyond
	const len = Math.hypot(endCentre, sideBelow);
	const jx = endCentre + (r * endCentre) / len;
	const jy = (r * sideBelow) / len;
	return {
		a,
		b,
		focalDistance: c,
		stringLength: 2 * a,
		perimeter,
		area: Math.PI * a * b,
		offsets: offsetsAlong(2 * a, input.interval, y),
		y,
		fourCentre: { endRadius: r, endCentre, sideRadius: R, sideCentreBelow: sideBelow, junctionX: jx, junctionY: jy },
	};
}
