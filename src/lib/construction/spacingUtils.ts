/**
 * Equal / exact spacing engine shared by every layout tool (battens, balusters, studs, joists,
 * tiles, rebar, fence pickets, shelves). All lengths are in the same unit (inches by convention).
 *
 * Terms: `gap` is the clear space between two members, `centers` is centre-to-centre distance
 * (`gap + memberWidth`). Positions run from 0 at the start of the total length.
 */

export type EndMembers = "none" | "one" | "both";
export type MarkReference = "near" | "center" | "far";

interface SpacingBase {
	totalLength: number;
	memberWidth: number;
	endMembers: EndMembers;
}

export type SpacingInput =
	| (SpacingBase & { mode: "equal"; count: number })
	| (SpacingBase & { mode: "exact"; centers: number; adjust: "last" | "both" });

export interface SpacingMember {
	index: number;
	near: number;
	center: number;
	far: number;
}

export type SpacingWarning = "count-clamped" | "negative-gap" | "centers-smaller-than-width";

export interface SpacingResult {
	members: SpacingMember[];
	count: number;
	/** Centre-to-centre distance of the regular members */
	centers: number;
	/** Clear gap between regular members */
	gap: number;
	/** First clear gap in the layout: before the first member, or after it when a member sits at the start */
	firstGap: number;
	/** Last clear gap in the layout: after the last member, or before it when a member sits at the end */
	lastGap: number;
	warnings: SpacingWarning[];
}

const EPS = 1e-9;
/** Hard ceiling on members in one layout, so bad input (or a crafted share link) cannot hang the page. */
export const MAX_MEMBERS = 1000;

function round(n: number): number {
	return Math.round(n * 1e9) / 1e9;
}

function member(index: number, near: number, width: number): SpacingMember {
	return { index, near: round(near), center: round(near + width / 2), far: round(near + width) };
}

function finish(nears: number[], width: number, total: number, centers: number, warnings: SpacingWarning[]): SpacingResult {
	const members = nears.map((n, i) => member(i + 1, n, width));
	const first = members[0];
	const last = members[members.length - 1];
	let firstGap = total;
	let lastGap = total;
	if (first && last) {
		firstGap = first.near > EPS || members.length < 2 ? round(first.near) : round(members[1].near - first.far);
		lastGap = total - last.far > EPS || members.length < 2 ? round(total - last.far) : round(last.near - members[members.length - 2].far);
	}
	if (members.some((m, i) => i > 0 && m.near < members[i - 1].far - EPS)) warnings.push("negative-gap");
	return {
		members,
		count: members.length,
		centers: round(centers),
		gap: round(centers - width),
		firstGap,
		lastGap,
		warnings,
	};
}

function equalSpacing(input: SpacingBase & { count: number }): SpacingResult {
	const { totalLength: L, memberWidth: w, endMembers } = input;
	const warnings: SpacingWarning[] = [];
	const min = endMembers === "both" ? 2 : 1;
	let n = Math.floor(input.count);
	if (!Number.isFinite(n) || n < min) {
		n = min;
		warnings.push("count-clamped");
	}
	if (n > MAX_MEMBERS) {
		n = MAX_MEMBERS;
		warnings.push("count-clamped");
	}

	let gap: number;
	let start: number;
	if (endMembers === "both") {
		gap = (L - n * w) / (n - 1);
		start = 0;
	} else if (endMembers === "one") {
		gap = (L - n * w) / n;
		start = 0;
	} else {
		gap = (L - n * w) / (n + 1);
		start = gap;
	}
	const centers = gap + w;
	const nears = Array.from({ length: n }, (_, i) => start + i * centers);
	return finish(nears, w, L, centers, warnings);
}

function exactSpacing(input: SpacingBase & { centers: number; adjust: "last" | "both" }): SpacingResult {
	const { totalLength: L, memberWidth: w, endMembers, centers, adjust } = input;
	const warnings: SpacingWarning[] = [];
	if (centers < w - EPS) warnings.push("centers-smaller-than-width");
	// Never step finer than the length allows for MAX_MEMBERS members.
	const step = Math.max(centers, w, L / MAX_MEMBERS);
	const stdGap = step - w;
	// A member landing within half a gap of an end reads as a doubled end member; it is dropped.
	const merge = stdGap / 2;

	if (centers < w - EPS) {
		const nears = endMembers === "both" && L - w > EPS ? [0, L - w] : [endMembers === "none" ? (L - w) / 2 : 0];
		return finish(nears, w, L, step, warnings);
	}

	if (endMembers === "one") {
		const nears: number[] = [];
		for (let x = 0; x + w <= L - merge + EPS || x === 0; x += step) nears.push(x);
		return finish(nears, w, L, step, warnings);
	}

	if (endMembers === "none") {
		// Members must clear both ends. Place from one standard gap in, then centre if asked.
		const nears: number[] = [];
		for (let x = stdGap; x + w <= L - stdGap + EPS; x += step) nears.push(x);
		if (nears.length === 0) {
			// Fall back to a single centred member if it fits at all.
			if (w <= L) nears.push((L - w) / 2);
			return finish(nears, w, L, step, warnings);
		}
		if (adjust === "both") {
			const span = nears[nears.length - 1] + w - nears[0];
			const offset = (L - span) / 2 - nears[0];
			for (let i = 0; i < nears.length; i++) nears[i] += offset;
		}
		return finish(nears, w, L, step, warnings);
	}

	// both: end members fixed at 0 and L - w, interior members at i * step while they clear the end member.
	const endNear = L - w;
	const interior: number[] = [];
	for (let x = step; x + w <= endNear - merge + EPS; x += step) interior.push(x);
	if (interior.length && adjust === "both") {
		const lastGap = endNear - (interior[interior.length - 1] + w);
		const shift = (lastGap - stdGap) / 2;
		for (let i = 0; i < interior.length; i++) interior[i] += shift;
	}
	const nears = endNear > EPS ? [0, ...interior, endNear] : [0];
	return finish(nears, w, L, step, warnings);
}

export function computeSpacing(input: SpacingInput): SpacingResult {
	return input.mode === "equal" ? equalSpacing(input) : exactSpacing(input);
}

/** Cumulative mark-out positions from the start, read to the chosen face of each member. */
export function runningPositions(result: SpacingResult, ref: MarkReference): number[] {
	return result.members.map((m) => m[ref]);
}

// ── Graduated series ─────────────────────────────────────────────────────────

export type GraduationMode = "arithmetic" | "geometric";

/**
 * `count` openings that fill `total` and grow from the first to the last: arithmetic adds a fixed
 * `step` each time, geometric multiplies by `ratio`. With no step or ratio given the first opening
 * is `first` and the series is solved to close on the total. Returns the openings in order.
 */
export function graduatedSeries(total: number, count: number, mode: GraduationMode, opts: { step?: number; ratio?: number; first?: number }): number[] | null {
	const n = Math.floor(count);
	if (!(total > 0) || n < 1 || n > MAX_MEMBERS) return null;
	if (n === 1) return [total];
	if (mode === "arithmetic") {
		let step: number;
		if (opts.step !== undefined) step = opts.step;
		else if (opts.first !== undefined) step = (total - n * opts.first) / ((n * (n - 1)) / 2);
		else return null;
		const first = (total - step * ((n * (n - 1)) / 2)) / n;
		if (first <= 0 || first + step * (n - 1) <= 0) return null;
		return Array.from({ length: n }, (_, i) => first + i * step);
	}
	let ratio: number;
	if (opts.ratio !== undefined) ratio = opts.ratio;
	else if (opts.first !== undefined && opts.first > 0 && opts.first < total) {
		// solve first × (r^n − 1) / (r − 1) = total for r by bisection
		const f = (r: number) => (Math.abs(r - 1) < 1e-12 ? opts.first! * n : (opts.first! * (Math.pow(r, n) - 1)) / (r - 1)) - total;
		let lo = 1e-6;
		let hi = 1e3;
		if (f(lo) > 0 || f(hi) < 0) return null;
		for (let i = 0; i < 200; i++) {
			const mid = (lo + hi) / 2;
			if (f(mid) > 0) hi = mid;
			else lo = mid;
		}
		ratio = (lo + hi) / 2;
	} else return null;
	if (!(ratio > 0)) return null;
	const sum = Math.abs(ratio - 1) < 1e-12 ? n : (Math.pow(ratio, n) - 1) / (ratio - 1);
	const first = total / sum;
	return Array.from({ length: n }, (_, i) => first * Math.pow(ratio, i));
}
