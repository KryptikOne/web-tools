/**
 * Wall framing: stud layout from a wall end with sheet joints checked for backing, and lumber
 * quantities for studs, plates and noggings. Lengths in inches, angles in degrees.
 */

import { boardFeet, priceLumber, type BoardSection } from "./lumberUtils";

export type EndStyle = "single" | "double" | "double-gap" | "california" | "orthogonal";
export const END_STYLES: { value: EndStyle; label: string }[] = [
	{ value: "single", label: "Single stud" },
	{ value: "double", label: "Double studs" },
	{ value: "double-gap", label: "Double with gap" },
	{ value: "california", label: "California corner" },
	{ value: "orthogonal", label: "Orthogonal wall" },
];

export type StudCenters = 12 | 16 | 19.2 | 24;
export const STUD_CENTERS: StudCenters[] = [12, 16, 19.2, 24];
export type SheetWidth = 48 | 96;

export interface StudLayoutInput {
	wallLength: number;
	/** Stud thickness along the wall, 1.5 for dressed 2x */
	studWidth: number;
	/** Stud depth through the wall, 3.5 for a 2x4 */
	studDepth: number;
	centers: number;
	sheetWidth: SheetWidth;
	startWith: EndStyle;
	endWith: EndStyle;
	/** Shifts the regular layout; 0 puts stud centres on multiples of the spacing */
	firstStudOffset: number;
	/** Interior sheeting starts past the adjacent wall's depth */
	sheetStart: "exterior" | "interior";
	/** Both ends are met by walls at right angles, so sheeting starts past their depth */
	orthogonalWalls: boolean;
	studHeight: number;
	/** Top plate rake from the start end, degrees; 0 is level */
	rakeAngle: number;
}

export type StudKind = "end" | "common" | "flat";

export interface Stud {
	index: number;
	near: number;
	center: number;
	far: number;
	kind: StudKind;
	/** Length of this stud; varies along a raked wall */
	height: number;
}

export interface Sheet {
	start: number;
	end: number;
	width: number;
}

export interface SheetJoint {
	position: number;
	overStud: boolean;
}

export interface StudLayoutResult {
	studs: Stud[];
	count: number;
	commonCount: number;
	sheets: Sheet[];
	joints: SheetJoint[];
	sheetOffset: number;
	warnings: string[];
}

const EPS = 1e-6;

/** Pieces in an end assembly, from the wall end inward: [width along the wall, kind]. */
function endAssembly(style: EndStyle, w: number, d: number): { width: number; kind: StudKind; gapBefore?: number }[] {
	switch (style) {
		case "double":
			return [
				{ width: w, kind: "end" },
				{ width: w, kind: "end" },
			];
		case "double-gap":
			return [
				{ width: w, kind: "end" },
				{ width: w, kind: "end", gapBefore: w },
			];
		case "california":
			return [
				{ width: w, kind: "end" },
				{ width: d, kind: "flat" },
			];
		default:
			return [{ width: w, kind: "end" }];
	}
}

export function studLayout(input: StudLayoutInput): StudLayoutResult | null {
	const { wallLength: L, studWidth: w, studDepth: d, centers, sheetWidth, startWith, endWith, firstStudOffset, sheetStart, orthogonalWalls, studHeight, rakeAngle } = input;
	if (!(L > 0) || !(w > 0) || !(d > 0) || !(centers >= w) || !(studHeight > 0) || L < 2 * w) return null;
	const rise = Math.tan((rakeAngle * Math.PI) / 180);
	const heightAt = (x: number) => studHeight + x * rise;
	const warnings: string[] = [];

	const placed: Omit<Stud, "index">[] = [];
	// start assembly
	let x = 0;
	for (const p of endAssembly(startWith, w, d)) {
		x += p.gapBefore ?? 0;
		placed.push({ near: x, center: x + p.width / 2, far: x + p.width, kind: p.kind, height: heightAt(x + p.width / 2) });
		x += p.width;
	}
	const startLen = x;
	// end assembly, mirrored
	const endPieces = endAssembly(endWith, w, d);
	let e = L;
	const endPlaced: Omit<Stud, "index">[] = [];
	for (const p of endPieces) {
		e -= p.gapBefore ?? 0;
		endPlaced.push({ near: e - p.width, center: e - p.width / 2, far: e, kind: p.kind, height: heightAt(e - p.width / 2) });
		e -= p.width;
	}
	const endLen = L - e;
	if (startLen + endLen > L + EPS) return null;

	// regular studs with centres on the layout
	const cap = Math.floor(L / Math.max(centers, w)) + 2;
	for (let k = 1; k <= cap; k++) {
		const c = firstStudOffset + k * centers;
		const near = c - w / 2;
		const far = c + w / 2;
		if (near < startLen - EPS) continue;
		if (far > L - endLen + EPS) break;
		placed.push({ near, center: c, far, kind: "common", height: heightAt(c) });
	}
	const studs: Stud[] = [...placed, ...endPlaced.reverse()].sort((a, b) => a.near - b.near).map((s, i) => ({ ...s, index: i + 1 }));

	// sheeting
	const offsetStart = sheetStart === "interior" || orthogonalWalls || startWith === "orthogonal" ? d : 0;
	const sheets: Sheet[] = [];
	for (let s = offsetStart; s < L - EPS; s += sheetWidth) {
		const end = Math.min(L, s + sheetWidth);
		sheets.push({ start: s, end, width: end - s });
	}
	const joints: SheetJoint[] = sheets
		.slice(1)
		.map((sh) => sh.start)
		.map((position) => ({ position, overStud: studs.some((s) => s.near - EPS <= position && position <= s.far + EPS) }));
	for (const j of joints) if (!j.overStud) warnings.push(`Sheet joint at ${j.position.toFixed(2)} in has no stud behind it`);
	if (sheets.length && sheets[sheets.length - 1].width < sheetWidth / 4) warnings.push("The last sheet is a narrow strip");

	return { studs, count: studs.length, commonCount: studs.filter((s) => s.kind === "common").length, sheets, joints, sheetOffset: offsetStart, warnings };
}

// ── Lumber quantities ────────────────────────────────────────────────────────

export interface FramingQuantityInput {
	/** Total wall length, all walls */
	totalLength: number;
	studHeight: number;
	centers: number;
	section: BoardSection;
	bottomPlates: number;
	topPlates: number;
	noggingRows: number;
	corners: number;
	extraPerCorner: number;
	ends: number;
	extraPerEnd: number;
	openings: number;
	extraPerOpening: number;
	/** Stock length for plates and noggings */
	stockLength: number;
	costPer1000Bft: number;
}

export interface FramingQuantities {
	commonStuds: number;
	extraStuds: number;
	studs: number;
	studLinearFeet: number;
	plateLinearFeet: number;
	noggingLinearFeet: number;
	platePieces: number;
	noggingPieces: number;
	totalLinearFeet: number;
	boardFeet: number;
	cost: number;
}

export function framingQuantities(q: FramingQuantityInput): FramingQuantities | null {
	if (!(q.totalLength > 0) || !(q.studHeight > 0) || !(q.centers > 0) || !(q.stockLength > 0)) return null;
	const commonStuds = Math.ceil(q.totalLength / q.centers - EPS) + 1;
	const extraStuds = q.corners * q.extraPerCorner + q.ends * q.extraPerEnd + q.openings * q.extraPerOpening;
	const studs = commonStuds + extraStuds;
	const plateLinear = (q.bottomPlates + q.topPlates) * q.totalLength;
	const noggingLinear = q.noggingRows * q.totalLength;
	const studLinear = studs * q.studHeight;
	const totalLinear = plateLinear + noggingLinear + studLinear;
	const bft = boardFeet(q.section, totalLinear);
	const cost = priceLumber({ section: q.section, lengthIn: totalLinear, pieces: 1, costPer1000Bft: q.costPer1000Bft }).totalCost;
	return {
		commonStuds,
		extraStuds,
		studs,
		studLinearFeet: studLinear / 12,
		plateLinearFeet: plateLinear / 12,
		noggingLinearFeet: noggingLinear / 12,
		platePieces: Math.ceil(plateLinear / q.stockLength - EPS),
		noggingPieces: Math.ceil(noggingLinear / q.stockLength - EPS),
		totalLinearFeet: totalLinear / 12,
		boardFeet: bft,
		cost,
	};
}
