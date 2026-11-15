/**
 * Baluster layouts: code-gap driven counts on a level or raked rail, end gaps that keep the same
 * baluster gap across unequal panels, and baluster positions on stair treads. All lengths in inches.
 */

import { computeSpacing, type EndMembers, type SpacingMember, type SpacingResult } from "./spacingUtils";

// ── 1. Quantity from a maximum gap ───────────────────────────────────────────

export interface BalusterRunInput {
	/** Length along the rail */
	length: number;
	width: number;
	endMembers: EndMembers;
	/** Largest clear gap allowed between balusters (code gap) */
	maxGap: number;
	/** Optional largest centre-to-centre distance allowed */
	maxCenters?: number;
	/** Rail angle from level in degrees; balusters stay vertical. 0 for a level rail. */
	rakeAngle?: number;
}

export interface BalusterRunResult extends SpacingResult {
	/** Horizontal length the layout was solved on (equals `length` on a level rail) */
	horizontalLength: number;
	/** Multiply a horizontal measure by this to read it along the rake */
	rakeFactor: number;
}

/** Fewest balusters that keep every gap at or under the code gap, then spaced equally. */
export function minimumBalusters(horizontalLength: number, width: number, endMembers: EndMembers, maxGap: number): number {
	const L = horizontalLength;
	const g = Math.max(maxGap, 1e-9);
	let n: number;
	if (endMembers === "both") n = Math.ceil((L + g) / (width + g) - 1e-9);
	else if (endMembers === "one") n = Math.ceil(L / (width + g) - 1e-9);
	else n = Math.ceil((L - g) / (width + g) - 1e-9);
	return Math.max(n, endMembers === "both" ? 2 : 1);
}

export function balusterRun(input: BalusterRunInput): BalusterRunResult | null {
	const { length, width, endMembers, maxGap, maxCenters, rakeAngle = 0 } = input;
	if (!(length > 0) || !(width > 0) || !(maxGap > 0) || width >= length) return null;
	const cos = Math.cos((rakeAngle * Math.PI) / 180);
	if (cos <= 0) return null;
	const horizontalLength = length * cos;
	let gapLimit = maxGap;
	if (maxCenters !== undefined && maxCenters > width) gapLimit = Math.min(gapLimit, maxCenters - width);
	const count = minimumBalusters(horizontalLength, width, endMembers, gapLimit);
	const result = computeSpacing({ mode: "equal", totalLength: horizontalLength, memberWidth: width, endMembers, count });
	return { ...result, horizontalLength, rakeFactor: 1 / cos };
}

// ── 2. Unequal panels, matching gap ──────────────────────────────────────────

export interface PanelGapInput {
	/** Clear length between posts */
	length: number;
	width: number;
	/** Gap to match from the other panels */
	gap: number;
}

export interface PanelGapResult {
	count: number;
	/** Gap at each end so every interior gap equals `gap` */
	endGap: number;
	members: SpacingMember[];
	/** Nearby counts with the gap every space would get if all gaps were equal */
	equalOptions: { count: number; gap: number }[];
}

export function panelGap(input: PanelGapInput): PanelGapResult | null {
	const { length: L, width: w, gap: g } = input;
	if (!(L > 0) || !(w > 0) || !(g >= 0) || w >= L) return null;
	// Fewest balusters that keep each end gap at or under the matching gap, with the interior gaps
	// exactly g. If the member is wider than the gap that can overshoot, so step back one.
	let n = Math.ceil((L - g) / (w + g) - 1e-9);
	if (n < 1) n = 1;
	let endGap = (L - n * w - (n - 1) * g) / 2;
	if (endGap < 0) {
		n = Math.max(1, n - 1);
		endGap = (L - n * w - (n - 1) * g) / 2;
	}
	const members: SpacingMember[] = Array.from({ length: n }, (_, i) => {
		const near = endGap + i * (w + g);
		return { index: i + 1, near, center: near + w / 2, far: near + w };
	});
	const equalOptions: { count: number; gap: number }[] = [];
	for (let k = Math.max(1, n - 2); k <= n + 2; k++) {
		const eq = (L - k * w) / (k + 1);
		if (eq >= 0) equalOptions.push({ count: k, gap: eq });
	}
	return { count: n, endGap, members, equalOptions };
}

// ── 3. Stair balusters ───────────────────────────────────────────────────────

export interface StairBalusterInput {
	/** Tread run, riser face to riser face */
	run: number;
	nosing: number;
	width: number;
	perTread: number;
	rise: number;
	/** Treads to list in the mark-out */
	treads: number;
}

export interface StairBalusterResult {
	/** Centre-to-centre along the run */
	centers: number;
	/** Clear gap between balusters, horizontal */
	gap: number;
	/** Baluster centres measured from the riser face at the back of the tread */
	fromRiser: number[];
	/** The same centres measured back from the nosing edge */
	fromNosing: number[];
	/** How much longer each successive baluster on a tread is than the one before it */
	lengthStep: number;
	/** Cumulative centre positions from the bottom riser face, tread by tread */
	running: { tread: number; baluster: number; position: number }[];
}

export function stairBalusters(input: StairBalusterInput): StairBalusterResult | null {
	const { run, nosing, width, perTread, rise, treads } = input;
	if (!(run > 0) || !(width > 0) || perTread < 1 || perTread * width >= run) return null;
	const centers = run / perTread;
	const gap = centers - width;
	const first = centers / 2;
	const fromRiser = Array.from({ length: perTread }, (_, i) => first + i * centers);
	const fromNosing = fromRiser.map((p) => run + nosing - p);
	const lengthStep = (centers * rise) / run;
	const running: StairBalusterResult["running"] = [];
	for (let t = 0; t < Math.max(1, Math.floor(treads)); t++) {
		fromRiser.forEach((p, i) => running.push({ tread: t + 1, baluster: i + 1, position: t * run + p }));
	}
	return { centers, gap, fromRiser, fromNosing, lengthStep, running };
}
