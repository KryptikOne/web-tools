/**
 * Deck framing: stumps (posts) under bearers, joists over them, boards on top. Bearers run along
 * the deck length, joists across its width, boards along the length unless turned. Ground fall is
 * across the width, so stumps get longer bearer by bearer. Lengths in inches.
 */

import { computeSpacing, type SpacingResult } from "./spacingUtils";
import { deckBoards, type DeckBoards, type BoardLayout, type Stagger } from "./deckBoardUtils";
import { boardFeet, type BoardSection } from "./lumberUtils";

export interface DeckInput {
	/** Along the bearers and (normally) the boards */
	length: number;
	/** Across, along the joists */
	width: number;
	/** Ground to the top of the boards at the high side */
	height: number;
	/** How much lower the ground is at the far side of the width */
	fall: number;
	stumpSize: number;
	stumpCenters: number;
	bearer: BoardSection;
	bearerCenters: number;
	joist: BoardSection;
	joistCenters: number;
	boardWidth: number;
	boardThickness: number;
	gap: number;
	boardLayout: BoardLayout;
	boardLength: number;
	stagger: Stagger;
	/** Boards along the length (default) or across the width */
	boardsAcross: boolean;
	fascia: boolean;
	costPer1000Bft: number;
	boardPricePerFoot: number;
}

export interface Stump {
	bearer: number;
	index: number;
	/** Along the bearer */
	position: number;
	length: number;
}

export interface DeckMaterial {
	item: string;
	pieces: number;
	/** Length of each piece, or total length when pieces vary */
	length: number;
	boardFeet: number;
	cost: number;
}

export interface Deck {
	bearers: SpacingResult;
	stumpsAlong: SpacingResult;
	joists: SpacingResult;
	boards: DeckBoards;
	stumps: Stump[];
	/** Stump length at the high side: height less boards, joist and bearer */
	stumpBase: number;
	stumpCount: number;
	bearerCount: number;
	joistCount: number;
	fasciaLength: number;
	area: number;
	screws: number;
	stumpBolts: number;
	joistFixings: number;
	materials: DeckMaterial[];
	totalBoardFeet: number;
	totalCost: number;
	warnings: string[];
}

export function deck(input: DeckInput): Deck | null {
	const { length: L, width: W, height, fall, stumpSize, stumpCenters, bearer, bearerCenters, joist, joistCenters, boardWidth, boardThickness, gap, boardLength, fascia, costPer1000Bft, boardPricePerFoot } = input;
	if (!(L > 0) || !(W > 0) || !(height > 0) || !(fall >= 0) || !(stumpSize > 0) || !(stumpCenters > 0) || !(bearerCenters > 0) || !(joistCenters > 0) || !(bearer.width > 0) || !(bearer.thickness > 0) || !(joist.width > 0) || !(joist.thickness > 0) || !(boardThickness >= 0)) return null;
	const bearers = computeSpacing({ mode: "exact", totalLength: W, memberWidth: bearer.thickness, endMembers: "both", centers: bearerCenters, adjust: "last" });
	const stumpsAlong = computeSpacing({ mode: "exact", totalLength: L, memberWidth: stumpSize, endMembers: "both", centers: stumpCenters, adjust: "last" });
	const joists = computeSpacing({ mode: "exact", totalLength: L, memberWidth: joist.thickness, endMembers: "both", centers: joistCenters, adjust: "last" });
	const boards = deckBoards({
		width: input.boardsAcross ? L : W,
		length: input.boardsAcross ? W : L,
		boardWidth,
		gap,
		layout: input.boardLayout,
		border: 0,
		joistCenters: input.boardsAcross ? bearerCenters : joistCenters,
		boardLength,
		stagger: input.stagger,
		screwsPerCrossing: 2,
	});
	if (!boards) return null;
	if (bearers.count * stumpsAlong.count > 5000) return null;

	const stumpBase = height - boardThickness - joist.width - bearer.width;
	const warnings: string[] = [];
	if (stumpBase <= 0) warnings.push("The deck is too low for stumps under the bearers; the bearers would sit on the ground");
	if (bearerCenters > 96) warnings.push("Bearer centers over 8 ft are a long joist span; check the joist size against the span tables");
	const stumps: Stump[] = [];
	for (const b of bearers.members) {
		const extra = (fall * b.center) / W;
		for (const s of stumpsAlong.members) stumps.push({ bearer: b.index, index: s.index, position: s.center, length: Math.max(0, stumpBase + extra) });
	}
	const stumpSection: BoardSection = { width: stumpSize, thickness: stumpSize };
	const fasciaLength = fascia ? 2 * (L + W) : 0;
	const line = (item: string, section: BoardSection, pieces: number, length: number, total = pieces * length): DeckMaterial => {
		const bft = boardFeet(section, total);
		return { item, pieces, length, boardFeet: bft, cost: (bft * costPer1000Bft) / 1000 };
	};
	const stumpTotal = stumps.reduce((s, st) => s + st.length, 0);
	const materials: DeckMaterial[] = [
		{ ...line("Stumps", stumpSection, stumps.length, stumpTotal / Math.max(1, stumps.length), stumpTotal), length: stumpTotal },
		line("Bearers", bearer, bearers.count, L),
		line("Joists", joist, joists.count, W),
	];
	if (fascia) materials.push(line("Fascia", joist, 2, L), line("Fascia ends", joist, 2, W));
	const boardCost = (boards.stockBoards * boardLength * boardPricePerFoot) / 12;
	materials.push({ item: "Deck boards", pieces: boards.stockBoards, length: boardLength, boardFeet: boardFeet({ width: boardWidth, thickness: Math.max(boardThickness, 0.01) }, boards.stockBoards * boardLength), cost: boardCost });
	const totalBoardFeet = materials.reduce((s, m) => s + m.boardFeet, 0);
	const totalCost = materials.reduce((s, m) => s + m.cost, 0);

	return {
		bearers,
		stumpsAlong,
		joists,
		boards,
		stumps,
		stumpBase,
		stumpCount: stumps.length,
		bearerCount: bearers.count,
		joistCount: joists.count,
		fasciaLength,
		area: L * W,
		screws: boards.screws,
		stumpBolts: stumps.length * 2,
		joistFixings: joists.count * bearers.count * 3,
		materials,
		totalBoardFeet,
		totalCost,
		warnings: [...warnings, ...boards.warnings],
	};
}
