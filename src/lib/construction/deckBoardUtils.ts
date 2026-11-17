/**
 * Deck boards: how board rows fit across a deck under the same cut rules as tiles, with an
 * optional picture-frame border, and how board lengths break over the joists with staggered
 * joints. Lengths in inches.
 */

import { tileFit, type TileFitMode } from "./tileUtils";

export type BoardLayout = "adjust-gap" | "rip-last" | "rip-both" | "whole-boards";
export const BOARD_LAYOUTS: { value: BoardLayout; label: string; hint: string }[] = [
	{ value: "adjust-gap", label: "Adjust the gap", hint: "Whole boards; the gap is changed so they fill the width" },
	{ value: "rip-last", label: "Rip the last board", hint: "Full boards from the start, the last board ripped to fit" },
	{ value: "rip-both", label: "Rip both edges", hint: "Equal rips at both edges, never narrower than half a board when avoidable" },
	{ value: "whole-boards", label: "Whole boards, edge gaps", hint: "No rips; the remainder is split between the two edge gaps" },
];

export type Stagger = "none" | "half" | "third";

export interface DeckBoardInput {
	/** Across the boards, inside any fascia */
	width: number;
	/** Along the boards */
	length: number;
	boardWidth: number;
	gap: number;
	layout: BoardLayout;
	/** Picture-frame border board width around the field; 0 for none */
	border: number;
	joistCenters: number;
	/** Stock length of a board */
	boardLength: number;
	stagger: Stagger;
	/** Screws per board per joist crossing */
	screwsPerCrossing: number;
}

export interface BoardRow {
	index: number;
	near: number;
	far: number;
	width: number;
	ripped: boolean;
	/** Joint positions along the row, from the start of the field */
	joints: number[];
	pieces: number;
}

export interface DeckBoards {
	rows: BoardRow[];
	count: number;
	fullBoards: number;
	rippedBoards: number;
	gap: number;
	firstWidth: number;
	lastWidth: number;
	startGap: number;
	endGap: number;
	/** Field inside the border */
	fieldWidth: number;
	fieldLength: number;
	/** Longest run a stock board can span and still joint on a joist */
	usableBoardLength: number;
	joistsCrossed: number;
	screws: number;
	/** Boards to buy at the stock length, border included */
	stockBoards: number;
	netLinearFeet: number;
	grossLinearFeet: number;
	wastePercent: number;
	borderPieces: { length: number; count: number }[];
	warnings: string[];
}

const MODE: Record<BoardLayout, TileFitMode> = { "adjust-gap": "fit-evenly", "rip-last": "flush", "rip-both": "cut-both", "whole-boards": "wall-joint" };

/** Break one row of boards into stock pieces with joints landing on joist centres. */
export function rowJoints(length: number, usable: number, firstPiece: number): { joints: number[]; pieces: number } {
	if (!(length > 0) || !(usable > 0)) return { joints: [], pieces: 0 };
	const joints: number[] = [];
	let x = Math.min(firstPiece > 0 ? firstPiece : usable, length);
	let pieces = 1;
	while (x < length - 1e-9) {
		joints.push(x);
		x = Math.min(x + usable, length);
		pieces++;
	}
	return { joints, pieces };
}

export function deckBoards(input: DeckBoardInput): DeckBoards | null {
	const { width, length, boardWidth, gap, layout, border, joistCenters, boardLength, stagger, screwsPerCrossing } = input;
	if (!(width > 0) || !(length > 0) || !(boardWidth > 0) || !(gap >= 0) || !(border >= 0) || !(joistCenters > 0) || !(boardLength > 0) || !(screwsPerCrossing >= 0)) return null;
	const inset = border > 0 ? border + gap : 0;
	const fieldWidth = width - 2 * inset;
	const fieldLength = length - 2 * inset;
	if (fieldWidth < boardWidth || fieldLength <= 0) return null;
	const fit = tileFit({ width: fieldWidth, tile: boardWidth, joint: gap, mode: MODE[layout] });
	if (!fit) return null;
	const warnings = [...fit.warnings.map((w) => w.replace(/^Tile/, "Board"))];

	const usable = Math.max(joistCenters, Math.floor(boardLength / joistCenters + 1e-9) * joistCenters);
	if (usable > boardLength + 1e-9) warnings.push(`A ${boardLength} in board does not reach from one joist to the next`);
	const firstFor = (i: number) => {
		if (stagger === "none") return usable;
		const n = stagger === "half" ? 2 : 3;
		const k = i % n;
		if (k === 0) return usable;
		return Math.max(joistCenters, Math.round(((usable * k) / n) / joistCenters) * joistCenters);
	};
	const rows: BoardRow[] = fit.tiles.map((t, i) => {
		const { joints, pieces } = rowJoints(fieldLength, usable, firstFor(i));
		return { index: t.index, near: inset + t.near, far: inset + t.far, width: t.width, ripped: t.cut, joints, pieces };
	});
	const joistsCrossed = Math.floor(fieldLength / joistCenters + 1e-9) + 1;
	const netLinear = rows.length * fieldLength;
	// pieces from stock: each row is cut from whole boards; count boards by total pieces needing a fresh board
	// (a piece shorter than the usable length can share a board with another short piece)
	const shortPieces: number[] = [];
	let fullBoards = 0;
	for (const r of rows) {
		let x = 0;
		const ends = [...r.joints, fieldLength];
		for (const e of ends) {
			const len = e - x;
			if (len >= boardLength - 1e-9) fullBoards++;
			else shortPieces.push(len);
			x = e;
		}
	}
	shortPieces.sort((a, b) => b - a);
	let i = 0;
	let j = shortPieces.length - 1;
	let shared = 0;
	while (i <= j) {
		shared++;
		if (i < j && shortPieces[i] + shortPieces[j] <= boardLength + 1e-9) j--;
		i++;
	}
	const borderPieces = border > 0 ? [{ length, count: 2 }, { length: width - 2 * border, count: 2 }] : [];
	const borderBoards = border > 0 ? borderPieces.reduce((s, p) => s + p.count * Math.ceil(p.length / boardLength - 1e-9), 0) : 0;
	const stockBoards = fullBoards + shared + borderBoards;
	const borderLinear = borderPieces.reduce((s, p) => s + p.count * p.length, 0);
	const gross = stockBoards * boardLength;
	return {
		rows,
		count: rows.length,
		fullBoards: fit.fullTiles,
		rippedBoards: rows.filter((r) => r.ripped).length,
		gap: fit.joint,
		firstWidth: fit.firstWidth,
		lastWidth: fit.lastWidth,
		startGap: fit.startGap,
		endGap: fit.endGap,
		fieldWidth,
		fieldLength,
		usableBoardLength: usable,
		joistsCrossed,
		screws: rows.reduce((s, r) => s + (joistsCrossed + r.joints.length) * screwsPerCrossing, 0),
		stockBoards,
		netLinearFeet: (netLinear + borderLinear) / 12,
		grossLinearFeet: gross / 12,
		wastePercent: gross > 0 ? ((gross - netLinear - borderLinear) / gross) * 100 : 0,
		borderPieces,
		warnings,
	};
}
