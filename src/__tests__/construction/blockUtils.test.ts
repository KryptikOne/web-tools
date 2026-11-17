import { describe, it, expect } from "vitest";
import { blockWall, BLOCK_SIZES } from "@/lib/construction/blockUtils";
import { REBAR_SIZES } from "@/lib/construction/concreteUtils";

const eight = BLOCK_SIZES.find((b) => b.id === "8")!;
const base = {
	length: 480,
	height: 96,
	block: eight,
	joint: 0.375,
	openings: [{ count: 1, width: 36, height: 80 }],
	corners: 2,
	ends: 0,
	wastePercent: 5,
	pricePerBlock: 2.5,
	blocksPerMortarBag: 33,
	groutEveryNthCore: 2,
	groutBagWeightLb: 80,
	rebarEveryNthCore: 2,
	rebarSize: REBAR_SIZES.find((r) => r.bar === "#4")!,
	rebarExtra: 12,
	pricePerGroutBag: 6,
};

describe("blockWall", () => {
	it("quantifies a 40 by 8 foot 8 inch block wall with a door", () => {
		const w = blockWall(base)!;
		expect(w.courses).toBe(12);
		expect(w.gaugeHeight).toBe(8);
		expect(w.wallHeight).toBe(96);
		expect(w.blocksPerCourse).toBeCloseTo(480.375 / 16, 9);
		expect(w.grossBlocks).toBeCloseTo(360.28, 2);
		expect(w.openingBlocks).toBeCloseTo((36 * 80) / 128, 9);
		expect(w.netBlocks).toBe(338);
		expect(w.halfBlocks).toBe(12);
		expect(w.blocksWithWaste).toBe(Math.ceil(338 * 1.05));
		expect(w.mortarBags).toBe(Math.ceil(338 / 33));
		expect(w.coresTotal).toBe(676);
		expect(w.groutedCores).toBe(338);
		expect(w.groutCubicFeet).toBeCloseTo(338 * 0.125, 9);
		expect(w.groutBags).toBe(Math.ceil((338 * 0.125) / (80 / 133.3)));
		expect(w.rebarBars).toBe(Math.ceil((480.375 / 16) * 2 / 2));
		expect(w.rebarLength).toBeCloseTo(w.rebarBars * 108, 9);
		expect(w.rebarWeightLb).toBeCloseTo((w.rebarLength / 12) * 0.668, 6);
		expect(w.cost.total).toBeCloseTo(w.blocksWithWaste * 2.5 + w.groutBags * 6, 6);
		expect(w.warnings).toEqual([]);
	});

	it("warns when the height is not whole courses and handles no grout or rebar", () => {
		const w = blockWall({ ...base, height: 100, groutEveryNthCore: 0, rebarEveryNthCore: 0 })!;
		expect(w.courses).toBe(13);
		expect(w.wallHeight).toBe(104);
		expect(w.warnings[0]).toMatch(/whole courses/);
		expect(w.groutBags).toBe(0);
		expect(w.rebarBars).toBe(0);
		expect(blockWall({ ...base, length: 0 })).toBeNull();
	});
});
