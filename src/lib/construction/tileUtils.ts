/**
 * Tiling: how a row of tiles fits a width under different cut rules, and tile counts with waste,
 * boxes and cost. Lengths in inches.
 */

export type TileFitMode = "wall-joint" | "flush" | "full-first" | "cut-both" | "cut-first-at" | "cut-last" | "fit-evenly";

export const TILE_FIT_MODES: { value: TileFitMode; label: string; hint: string }[] = [
	{ value: "wall-joint", label: "Whole tiles, wall joints take up the slack", hint: "No cuts; the gap at each wall grows to absorb the remainder" },
	{ value: "flush", label: "Flush start and end", hint: "No wall joints; full first tile, last tile cut to the wall" },
	{ value: "full-first", label: "Full first tile, cut last", hint: "Wall joint each end, cut only at the far end" },
	{ value: "cut-both", label: "Cut both ends evenly", hint: "Equal cuts at both walls, never narrower than half a tile when avoidable" },
	{ value: "cut-first-at", label: "Cut first tile at a set position", hint: "The first joint lands where you say; last tile cut to fit" },
	{ value: "cut-last", label: "Cut last tile to fit, flush at the far wall", hint: "Wall joint at the start only" },
	{ value: "fit-evenly", label: "Fit whole tiles evenly", hint: "The joint width is adjusted so whole tiles fill the width" },
];

export interface TileFitInput {
	width: number;
	tile: number;
	joint: number;
	mode: TileFitMode;
	/** For cut-first-at: distance from the start wall to the far edge of the first tile */
	firstTileEnd?: number;
}

export interface TilePiece {
	index: number;
	near: number;
	far: number;
	width: number;
	cut: boolean;
}

export interface TileFitResult {
	tiles: TilePiece[];
	count: number;
	fullTiles: number;
	firstWidth: number;
	lastWidth: number;
	startGap: number;
	endGap: number;
	/** Joint actually used; differs from the input only in fit-evenly */
	joint: number;
	warnings: string[];
}

const EPS = 1e-9;
const MAX_TILES = 2000;

/** Lay tiles of the given widths in a line from `start`, separated by `joint`. */
function lay(widths: number[], start: number, joint: number): TilePiece[] {
	let x = start;
	return widths.map((w, i) => {
		const near = x;
		x += w + joint;
		return { index: i + 1, near, far: near + w, width: w, cut: false };
	});
}

export function tileFit(input: TileFitInput): TileFitResult | null {
	const { width: W, tile: t, joint: j0, mode } = input;
	if (!(W > 0) || !(t > 0) || !(j0 >= 0) || t > W || W / t > MAX_TILES) return null;
	const warnings: string[] = [];
	let j = j0;
	let widths: number[] = [];
	let start = 0;
	const pitch = t + j;

	const fullCount = (avail: number) => Math.max(0, Math.floor((avail + j + EPS) / pitch));

	switch (mode) {
		case "wall-joint": {
			const n = fullCount(W - 2 * j);
			if (n < 1) return null;
			widths = Array(n).fill(t);
			start = (W - (n * t + (n - 1) * j)) / 2;
			break;
		}
		case "fit-evenly": {
			const n = Math.max(1, Math.round((W - j) / pitch));
			j = (W - n * t) / (n + 1);
			if (j < 0) return null;
			widths = Array(n).fill(t);
			start = j;
			break;
		}
		case "flush":
		case "full-first":
		case "cut-last": {
			start = mode === "flush" ? 0 : j;
			const endGap = mode === "full-first" ? j : 0;
			const avail = W - start - endGap;
			const n = fullCount(avail);
			const used = n * t + Math.max(0, n - 1) * j;
			const rest = avail - used - (n > 0 ? j : 0);
			widths = Array(n).fill(t);
			if (rest > EPS) widths.push(rest);
			else if (n > 0 && rest > -EPS && rest <= EPS) {
				/* exact fit */
			}
			break;
		}
		case "cut-both": {
			start = j;
			const avail = W - 2 * j;
			// whole tiles in the middle, equal cuts each side; drop one whole tile if the cuts would be slivers
			let n = fullCount(avail);
			let cut = (avail - (n * t + (n - 1) * j) - 2 * j) / 2;
			if (cut < t / 2 - EPS && n > 0) {
				n -= 1;
				cut = (avail - (n * t + Math.max(0, n - 1) * j) - (n > 0 ? 2 * j : j)) / 2;
			}
			if (n === 0) {
				widths = [avail];
			} else if (cut > EPS) widths = [cut, ...Array(n).fill(t), cut];
			else widths = Array(n).fill(t);
			break;
		}
		case "cut-first-at": {
			start = j;
			const firstEnd = input.firstTileEnd ?? t + j;
			const first = Math.min(t, Math.max(0, firstEnd - j));
			if (first <= EPS) return null;
			const avail = W - j - first - j - j; // after the first tile and its joint, keep an end joint
			const n = fullCount(avail);
			const used = n * t + Math.max(0, n - 1) * j;
			const rest = avail - used - (n > 0 ? j : 0);
			widths = [first, ...Array(n).fill(t)];
			if (rest > EPS) widths.push(rest);
			break;
		}
	}

	if (widths.length === 0) return null;
	const tiles = lay(widths, start, j).map((p) => ({ ...p, cut: p.width < t - EPS }));
	const last = tiles[tiles.length - 1];
	const result: TileFitResult = {
		tiles,
		count: tiles.length,
		fullTiles: tiles.filter((p) => !p.cut).length,
		firstWidth: tiles[0].width,
		lastWidth: last.width,
		startGap: tiles[0].near,
		endGap: W - last.far,
		joint: j,
		warnings,
	};
	for (const p of tiles) if (p.cut && p.width < Math.max(j, t * 0.1)) warnings.push(`Tile ${p.index} is a sliver (${p.width.toFixed(2)} in); choose another layout`);
	if (mode === "fit-evenly" && Math.abs(j - j0) > 0.01) warnings.push(`Joint adjusted from ${j0.toFixed(3)} in to ${j.toFixed(3)} in`);
	return result;
}

// ── Quantity and cost ────────────────────────────────────────────────────────

export interface TileCountInput {
	areaWidth: number;
	areaLength: number;
	tileWidth: number;
	tileLength: number;
	joint: number;
	wastePercent: number;
	tilesPerBox: number;
	costPerTile: number;
}

export interface TileCountResult {
	across: number;
	down: number;
	/** Cut columns / rows at the far edges, 0 or 1 each */
	cutAcross: number;
	cutDown: number;
	tiles: number;
	tilesWithWaste: number;
	boxes: number;
	tilesToBuy: number;
	cost: number;
	coverageSquareInches: number;
}

/** Tiles along one dimension: a full tile at the start, no outside joint, cut edge tiles count as full, slivers narrower than the joint are not counted. */
export function tilesAlong(length: number, tile: number, joint: number): { full: number; cut: number } {
	if (!(length > 0) || !(tile > 0)) return { full: 0, cut: 0 };
	const pitch = tile + joint;
	const full = Math.floor((length + joint + EPS) / pitch);
	const covered = full * pitch - joint;
	const rest = length - covered;
	return { full, cut: rest > joint + EPS ? 1 : 0 };
}

export function tileCount(q: TileCountInput): TileCountResult | null {
	if (!(q.areaWidth > 0) || !(q.areaLength > 0) || !(q.tileWidth > 0) || !(q.tileLength > 0) || !(q.joint >= 0)) return null;
	const a = tilesAlong(q.areaWidth, q.tileWidth, q.joint);
	const d = tilesAlong(q.areaLength, q.tileLength, q.joint);
	const across = a.full + a.cut;
	const down = d.full + d.cut;
	if (across * down > 1e6) return null;
	const tiles = across * down;
	const tilesWithWaste = Math.ceil(tiles * (1 + Math.max(0, q.wastePercent) / 100) - EPS);
	const perBox = q.tilesPerBox > 0 ? Math.floor(q.tilesPerBox) : 0;
	const boxes = perBox > 0 ? Math.ceil(tilesWithWaste / perBox - EPS) : 0;
	const tilesToBuy = perBox > 0 ? boxes * perBox : tilesWithWaste;
	return {
		across,
		down,
		cutAcross: a.cut,
		cutDown: d.cut,
		tiles,
		tilesWithWaste,
		boxes,
		tilesToBuy,
		cost: tilesToBuy * Math.max(0, q.costPerTile),
		coverageSquareInches: q.areaWidth * q.areaLength,
	};
}

export interface SimpleTileInput {
	/** Square inches to cover */
	areaSquareInches: number;
	tileWidth: number;
	tileLength: number;
	wastePercent: number;
	tilesPerBox: number;
	costPerTile: number;
}

export function simpleTileCount(q: SimpleTileInput): { tiles: number; tilesWithWaste: number; boxes: number; tilesToBuy: number; cost: number } | null {
	if (!(q.areaSquareInches > 0) || !(q.tileWidth > 0) || !(q.tileLength > 0)) return null;
	const tiles = Math.ceil(q.areaSquareInches / (q.tileWidth * q.tileLength) - EPS);
	const tilesWithWaste = Math.ceil(tiles * (1 + Math.max(0, q.wastePercent) / 100) - EPS);
	const perBox = q.tilesPerBox > 0 ? Math.floor(q.tilesPerBox) : 0;
	const boxes = perBox > 0 ? Math.ceil(tilesWithWaste / perBox - EPS) : 0;
	const tilesToBuy = perBox > 0 ? boxes * perBox : tilesWithWaste;
	return { tiles, tilesWithWaste, boxes, tilesToBuy, cost: tilesToBuy * Math.max(0, q.costPerTile) };
}
