import { describe, it, expect } from "vitest";
import { deck, type DeckInput } from "@/lib/construction/deckUtils";

const base: DeckInput = {
	length: 240,
	width: 144,
	height: 36,
	fall: 6,
	stumpSize: 3.5,
	stumpCenters: 72,
	bearer: { width: 7.25, thickness: 1.5 },
	bearerCenters: 72,
	joist: { width: 7.25, thickness: 1.5 },
	joistCenters: 16,
	boardWidth: 5.5,
	boardThickness: 1,
	gap: 0.25,
	boardLayout: "rip-last",
	boardLength: 192,
	stagger: "half",
	boardsAcross: false,
	fascia: true,
	costPer1000Bft: 800,
	boardPricePerFoot: 1.5,
};

describe("deck", () => {
	it("frames a 20 by 12 ft deck with six inches of ground fall", () => {
		const d = deck(base)!;
		expect(d.bearerCount).toBe(3);
		expect(d.bearers.members.map((m) => m.near)).toEqual([0, 72, 142.5]);
		expect(d.stumpsAlong.count).toBe(4);
		expect(d.stumpCount).toBe(12);
		expect(d.joistCount).toBe(16);
		expect(d.stumpBase).toBeCloseTo(20.5, 9);
		// stumps under the first bearer sit at the high side, the last bearer gets the full fall less half a bearer
		expect(d.stumps[0].length).toBeCloseTo(20.5 + (6 * 0.75) / 144, 6);
		expect(d.stumps[d.stumps.length - 1].length).toBeCloseTo(20.5 + (6 * 143.25) / 144, 6);
		expect(d.boards.count).toBe(26);
		expect(d.fasciaLength).toBe(768);
		expect(d.area / 144).toBe(240);
		expect(d.stumpBolts).toBe(24);
		expect(d.joistFixings).toBe(16 * 3 * 3);
		expect(d.materials.map((m) => m.item)).toEqual(["Stumps", "Bearers", "Joists", "Fascia", "Fascia ends", "Deck boards"]);
		expect(d.materials[1].pieces).toBe(3);
		expect(d.materials[1].length).toBe(240);
		expect(d.materials[5].cost).toBeCloseTo((d.boards.stockBoards * 192 * 1.5) / 12, 6);
		expect(d.totalCost).toBeCloseTo(d.materials.reduce((s, m) => s + m.cost, 0), 9);
		expect(d.warnings).toEqual([expect.stringMatching(/sliver/)]);
	});

	it("turns the boards across the width and warns on a deck too low for stumps", () => {
		const across = deck({ ...base, boardsAcross: true })!;
		expect(across.boards.fieldWidth).toBe(240);
		expect(across.boards.fieldLength).toBe(144);
		expect(deck({ ...base, height: 12 })!.warnings.some((w) => /too low/.test(w))).toBe(true);
		expect(deck({ ...base, width: 0 })).toBeNull();
	});
});
