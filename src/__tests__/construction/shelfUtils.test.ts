import { describe, it, expect } from "vitest";
import { graduatedSeries } from "@/lib/construction/spacingUtils";
import { shelfLayout, type ShelfInput } from "@/lib/construction/shelfUtils";

describe("graduatedSeries", () => {
	it("arithmetic by step and by first opening", () => {
		expect(graduatedSeries(60, 4, "arithmetic", { step: 2 })).toEqual([12, 14, 16, 18]);
		const byFirst = graduatedSeries(60, 4, "arithmetic", { first: 12 })!;
		expect(byFirst[0]).toBeCloseTo(12, 9);
		expect(byFirst.reduce((s, x) => s + x, 0)).toBeCloseTo(60, 9);
		expect(graduatedSeries(60, 4, "arithmetic", { step: 20 })).toBeNull();
	});

	it("geometric by ratio and by first opening", () => {
		const g = graduatedSeries(75, 4, "geometric", { ratio: 2 })!;
		expect(g).toEqual([5, 10, 20, 40]);
		const byFirst = graduatedSeries(75, 4, "geometric", { first: 5 })!;
		expect(byFirst[3]).toBeCloseTo(40, 6);
		expect(graduatedSeries(60, 1, "geometric", { ratio: 2 })).toEqual([60]);
	});
});

const base: ShelfInput = {
	insideHeight: 70,
	thickness: 0.75,
	openings: 5,
	mode: "equal",
	graduation: "arithmetic",
	step: 1.5,
	ratio: 1.15,
	setOpenings: [10, 12, 14, 16],
	topClearance: 0,
	bottomClearance: 0,
	reference: "underside",
};

describe("shelfLayout", () => {
	it("spaces five equal openings with four shelves", () => {
		const s = shelfLayout(base)!;
		expect(s.shelfCount).toBe(4);
		expect(s.available).toBe(67);
		expect(s.openings.every((o) => Math.abs(o.height - 13.4) < 1e-9)).toBe(true);
		expect(s.openings[0].top).toBe(70);
		expect(s.openings[4].bottom).toBeCloseTo(0, 9);
		expect(s.closes).toBe(true);
		// undersides from the bottom: shelf 4 is lowest
		expect(s.positions[0]).toBeCloseTo(13.4, 9);
		expect(s.positions[3]).toBeCloseTo(13.4 * 4 + 0.75 * 3, 9);
		expect(s.warnings).toEqual([]);
	});

	it("graduates openings top to bottom and honours clearances", () => {
		const s = shelfLayout({ ...base, mode: "graduated", step: 1.5, topClearance: 2, bottomClearance: 4, reference: "top" })!;
		expect(s.available).toBe(61);
		expect(s.openings[1].height - s.openings[0].height).toBeCloseTo(1.5, 9);
		expect(s.openings[0].top).toBe(68);
		expect(s.openings[4].bottom).toBeCloseTo(4, 9);
		expect(s.closes).toBe(true);
		expect(s.positions[0]).toBeCloseTo(4 + s.openings[4].height + 0.75, 9);
		const geo = shelfLayout({ ...base, mode: "graduated", graduation: "geometric", ratio: 1.15 })!;
		expect(geo.openings[1].height / geo.openings[0].height).toBeCloseTo(1.15, 9);
		expect(shelfLayout({ ...base, mode: "graduated", step: 30 })).toBeNull();
	});

	it("takes set openings and gives the last the remainder", () => {
		const s = shelfLayout({ ...base, mode: "set" })!;
		expect(s.openings.map((o) => o.height)).toEqual([10, 12, 14, 16, 67 - 52]);
		expect(s.closes).toBe(true);
		const over = shelfLayout({ ...base, mode: "set", setOpenings: [20, 20, 20, 20] })!;
		expect(over.openings[4].height).toBe(0);
		expect(over.warnings.some((w) => /no height/.test(w))).toBe(true);
	});
});
