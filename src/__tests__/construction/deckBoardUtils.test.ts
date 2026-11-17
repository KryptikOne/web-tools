import { describe, it, expect } from "vitest";
import { deckBoards, rowJoints, type DeckBoardInput } from "@/lib/construction/deckBoardUtils";

const base: DeckBoardInput = {
	width: 144,
	length: 240,
	boardWidth: 5.5,
	gap: 0.25,
	layout: "rip-last",
	border: 0,
	joistCenters: 16,
	boardLength: 192,
	stagger: "half",
	screwsPerCrossing: 2,
};

describe("rowJoints", () => {
	it("breaks a row on joist centres with a shorter first piece", () => {
		expect(rowJoints(240, 192, 192)).toEqual({ joints: [192], pieces: 2 });
		expect(rowJoints(240, 192, 96)).toEqual({ joints: [96], pieces: 2 });
		expect(rowJoints(100, 192, 192)).toEqual({ joints: [], pieces: 1 });
	});
});

describe("deckBoards", () => {
	it("rips the last board across a 12' deck", () => {
		const d = deckBoards(base)!;
		// 25 full boards take 25 × 5.5 + 24 × 0.25 = 143.5, leaving a 1/4 in rip that the tool flags as a sliver
		expect(d.count).toBe(26);
		expect(d.rippedBoards).toBe(1);
		expect(d.warnings.some((w) => /^Board 26 is a sliver/.test(w))).toBe(true);
		expect(d.gap).toBe(0.25);
		expect(d.rows[0].near).toBe(0);
		expect(d.rows[25].far).toBeCloseTo(144, 9);
		expect(d.usableBoardLength).toBe(192);
		expect(d.rows[0].joints).toEqual([192]);
		expect(d.rows[1].joints).toEqual([96]);
		expect(d.joistsCrossed).toBe(16);
		expect(d.screws).toBe(26 * 17 * 2);
		expect(d.netLinearFeet).toBeCloseTo(520, 9);
		expect(d.stockBoards).toBe(13 + 13 + 7);
		expect(d.wastePercent).toBeGreaterThan(0);
	});

	it("adjusts the gap for whole boards and rips both edges", () => {
		const even = deckBoards({ ...base, width: 140, layout: "adjust-gap" })!;
		expect(even.rippedBoards).toBe(0);
		expect(even.gap).toBeGreaterThan(0.25);
		expect(even.rows[even.count - 1].far).toBeCloseTo(140 - even.gap, 6);
		const both = deckBoards({ ...base, width: 140, layout: "rip-both" })!;
		expect(both.rippedBoards).toBe(2);
		expect(both.rows[0].width).toBeCloseTo(both.rows[both.count - 1].width, 9);
	});

	it("insets the field for a picture-frame border", () => {
		const d = deckBoards({ ...base, border: 5.5 })!;
		expect(d.fieldWidth).toBeCloseTo(144 - 2 * 5.75, 9);
		expect(d.fieldLength).toBeCloseTo(240 - 2 * 5.75, 9);
		expect(d.rows[0].near).toBeCloseTo(5.75, 9);
		expect(d.borderPieces).toEqual([
			{ length: 240, count: 2 },
			{ length: 133, count: 2 },
		]);
	});

	it("rejects a field narrower than a board", () => {
		expect(deckBoards({ ...base, width: 5 })).toBeNull();
		expect(deckBoards({ ...base, boardLength: 10 })!.warnings.some((w) => /does not reach/.test(w))).toBe(true);
	});
});
