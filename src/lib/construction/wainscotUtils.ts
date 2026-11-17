/**
 * Wainscoting and shaker panel frames: plumb stiles with a top and bottom rail on a flat wall,
 * or on a stair wall where the rails follow the rake and the panels become parallelograms.
 * Lengths in inches, angles in degrees. Stiles come from the shared spacing engine.
 */

import { computeSpacing, type SpacingResult } from "./spacingUtils";

const DEG = 180 / Math.PI;

export interface WainscotInput {
	wallLength: number;
	/** Total frame height, bottom of the base rail to top of the cap rail, measured plumb */
	frameHeight: number;
	stileWidth: number;
	topRail: number;
	bottomRail: number;
	/** Choose the panel count or aim for a panel width */
	by: "count" | "width";
	panels: number;
	targetWidth: number;
}

export interface Panel {
	index: number;
	near: number;
	far: number;
	width: number;
}

export interface Wainscot {
	stiles: SpacingResult;
	stileCount: number;
	panels: Panel[];
	panelCount: number;
	panelWidth: number;
	/** Plumb height of the opening between the rails */
	openingHeight: number;
	/** Stile length between the rails */
	stileLength: number;
	railLength: number;
	/** Horizontal stile positions, near face, for the running list */
	positions: number[];
	cutList: { item: string; count: number; length: number; width: number; note?: string }[];
	warnings: string[];
}

export function wainscot(input: WainscotInput): Wainscot | null {
	const { wallLength: L, frameHeight: H, stileWidth: s, topRail, bottomRail, by } = input;
	if (!(L > 0) || !(H > 0) || !(s > 0) || !(topRail >= 0) || !(bottomRail >= 0)) return null;
	let n: number;
	if (by === "count") n = Math.floor(input.panels);
	else {
		if (!(input.targetWidth > 0)) return null;
		n = Math.round((L - s) / (input.targetWidth + s));
	}
	n = Math.max(1, n);
	if (n > 500) return null;
	const panelWidth = (L - (n + 1) * s) / n;
	if (panelWidth <= 0) return null;
	const stiles = computeSpacing({ mode: "equal", totalLength: L, memberWidth: s, endMembers: "both", count: n + 1 });
	const panels: Panel[] = stiles.members.slice(0, -1).map((m, i) => ({ index: i + 1, near: m.far, far: stiles.members[i + 1].near, width: stiles.members[i + 1].near - m.far }));
	const openingHeight = H - topRail - bottomRail;
	const warnings: string[] = [];
	if (openingHeight <= 0) return null;
	if (panelWidth < s) warnings.push("Panels are narrower than the stiles");
	const cutList = [
		{ item: "Stiles", count: n + 1, length: openingHeight, width: s, note: "between the rails" },
		{ item: "Top rail", count: 1, length: L, width: topRail },
		{ item: "Bottom rail", count: 1, length: L, width: bottomRail },
		{ item: "Panels", count: n, length: openingHeight, width: panelWidth, note: "add any rebate or groove depth" },
	].filter((c) => c.width > 0);
	return {
		stiles,
		stileCount: n + 1,
		panels,
		panelCount: n,
		panelWidth,
		openingHeight,
		stileLength: openingHeight,
		railLength: L,
		positions: stiles.members.map((m) => m.near),
		cutList,
		warnings,
	};
}

// ── Stair wall ───────────────────────────────────────────────────────────────

export interface StairWainscotInput {
	rise: number;
	run: number;
	/** Length of the panelled wall measured level, or the number of treads it spans */
	by: "length" | "treads";
	levelLength: number;
	treads: number;
	/** Frame height measured plumb from the nosing line */
	frameHeight: number;
	stileWidth: number;
	/** Rail widths measured square to the rake */
	topRail: number;
	bottomRail: number;
	/** Panels per tread, or a target level panel width */
	panelsBy: "per-tread" | "width";
	panelsPerTread: number;
	targetWidth: number;
}

export interface StairWainscot {
	angle: number;
	levelLength: number;
	rakeLength: number;
	stiles: SpacingResult;
	stileCount: number;
	panelCount: number;
	/** Level width of each panel and its width along the rake */
	panelWidth: number;
	panelRakeWidth: number;
	/** Plumb height of the opening between the raked rails */
	openingHeight: number;
	/** Stile length between the rails, measured plumb (long point to long point) */
	stileLength: number;
	/** Rail widths taken plumb */
	topRailPlumb: number;
	bottomRailPlumb: number;
	/** Cut angles from square: stile ends and rail ends both meet at the rake angle */
	stileEndCut: number;
	railEndCut: number;
	/** Stile near faces, level and along the rake, from the bottom end */
	positions: number[];
	rakePositions: number[];
	cutList: { item: string; count: number; length: number; width: number; note?: string }[];
	warnings: string[];
}

export function stairWainscot(input: StairWainscotInput): StairWainscot | null {
	const { rise, run, frameHeight: H, stileWidth: s, topRail, bottomRail } = input;
	if (!(rise > 0) || !(run > 0) || !(H > 0) || !(s > 0) || !(topRail >= 0) || !(bottomRail >= 0)) return null;
	const angle = Math.atan2(rise, run) * DEG;
	const cos = Math.cos(angle / DEG);
	const L = input.by === "length" ? input.levelLength : Math.floor(input.treads) * run;
	if (!(L > s)) return null;
	let n: number;
	if (input.panelsBy === "per-tread") n = Math.max(1, Math.round((L / run) * Math.max(1, Math.floor(input.panelsPerTread))));
	else {
		if (!(input.targetWidth > 0)) return null;
		n = Math.max(1, Math.round((L - s) / (input.targetWidth + s)));
	}
	if (n > 500) return null;
	const panelWidth = (L - (n + 1) * s) / n;
	if (panelWidth <= 0) return null;
	const stiles = computeSpacing({ mode: "equal", totalLength: L, memberWidth: s, endMembers: "both", count: n + 1 });
	const topPlumb = topRail / cos;
	const bottomPlumb = bottomRail / cos;
	const openingHeight = H - topPlumb - bottomPlumb;
	if (openingHeight <= 0) return null;
	const warnings: string[] = [];
	if (panelWidth < s) warnings.push("Panels are narrower than the stiles");
	const cutList = [
		{ item: "Stiles", count: n + 1, length: openingHeight + s * Math.tan(angle / DEG), width: s, note: `long point to long point, ends cut ${angle.toFixed(1)}° from square` },
		{ item: "Top rail", count: 1, length: L / cos, width: topRail, note: "along the rake" },
		{ item: "Bottom rail", count: 1, length: L / cos, width: bottomRail, note: "along the rake" },
		{ item: "Panels", count: n, length: openingHeight, width: panelWidth, note: `parallelograms, ${angle.toFixed(1)}° skew; width level, height plumb` },
	].filter((c) => c.width > 0);
	return {
		angle,
		levelLength: L,
		rakeLength: L / cos,
		stiles,
		stileCount: n + 1,
		panelCount: n,
		panelWidth,
		panelRakeWidth: panelWidth / cos,
		openingHeight,
		stileLength: openingHeight,
		topRailPlumb: topPlumb,
		bottomRailPlumb: bottomPlumb,
		stileEndCut: angle,
		railEndCut: angle,
		positions: stiles.members.map((m) => m.near),
		rakePositions: stiles.members.map((m) => m.near / cos),
		cutList,
		warnings,
	};
}
