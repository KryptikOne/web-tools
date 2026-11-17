import { describe, it, expect } from "vitest";
import { rebarGrid, rebarRun, METRIC_REBAR_SIZES, type RebarGridInput } from "@/lib/construction/rebarUtils";
import { REBAR_SIZES } from "@/lib/construction/concreteUtils";

const four = REBAR_SIZES.find((r) => r.bar === "#4")!;
const three = REBAR_SIZES.find((r) => r.bar === "#3")!;

const slab: RebarGridInput = {
	mode: "slab",
	length: 240,
	width: 144,
	depth: 4,
	cover: 1.5,
	size: four,
	along: { by: "spacing", spacing: 12, count: 0 },
	across: { by: "spacing", spacing: 12, count: 0 },
	lapBy: "diameters",
	lapValue: 40,
	stockLength: 240,
	wastePercent: 5,
	priceBy: "bar",
	price: 9,
	tieSize: three,
	tieSpacing: 0,
	hookDiameters: 6,
};

describe("rebarRun", () => {
	it("splices bars longer than the stock", () => {
		const r = rebarRun({ span: 500, across: 100, by: "count", count: 3, spacing: 0 }, 3, 20, 240, 0.5)!;
		expect(r.count).toBe(3);
		expect(r.piece.pieces).toBe(3);
		expect(r.piece.laps).toBe(2);
		expect(r.piece.totalLength).toBe(540);
		expect(r.positions[0]).toBeCloseTo(3.25, 9);
		expect(r.positions[2]).toBeCloseTo(102.75, 9);
	});
});

describe("rebarGrid", () => {
	it("grids a 20 by 12 foot slab with #4 at 12 inches", () => {
		const g = rebarGrid(slab)!;
		expect(g.lap).toBe(20);
		// bars along span 237", spread across 141" at 12": 0, 12, ..., 132 then the last at 140.5
		expect(g.along.count).toBe(13);
		expect(g.along.positions[0]).toBeCloseTo(1.75, 9);
		expect(g.along.positions[1]).toBeCloseTo(13.75, 9);
		expect(g.along.barLength).toBe(237);
		expect(g.along.piece.pieces).toBe(1);
		expect(g.across!.count).toBe(21);
		expect(g.across!.barLength).toBe(141);
		expect(g.ties).toBeNull();
		const bars = 13 * 237 + 21 * 141;
		expect(g.totalLength).toBeCloseTo(bars * 1.05, 6);
		expect(g.weightLb).toBeCloseTo(((bars * 1.05) / 12) * 0.668, 6);
		expect(g.weightKg).toBeCloseTo(g.weightLb / 2.20462, 6);
		expect(g.stockBars).toBe(Math.ceil((bars * 1.05) / 240));
		expect(g.cost).toBe(g.stockBars * 9);
		expect(g.supports).toBe(80);
		expect(g.warnings).toEqual([]);
	});

	it("cages a footing with ties and prices by weight", () => {
		const g = rebarGrid({ ...slab, mode: "footing", length: 480, width: 24, depth: 12, cover: 3, along: { by: "count", count: 4, spacing: 0 }, tieSpacing: 24, priceBy: "pound", price: 0.9, lapBy: "length", lapValue: 24 })!;
		expect(g.along.count).toBe(4);
		expect(g.along.piece.pieces).toBe(3);
		expect(g.along.piece.totalLength).toBe(474 + 48);
		expect(g.across).toBeNull();
		expect(g.ties!.count).toBe(21);
		expect(g.ties!.eachLength).toBeCloseTo(2 * (18 - 0.375) + 2 * (6 - 0.375) + 2 * 6 * 0.375, 9);
		expect(g.cost).toBeCloseTo(g.weightLb * 0.9, 9);
		expect(g.supports).toBe(20);
		expect(g.warnings.some((w) => /spliced/.test(w))).toBe(true);
	});

	it("knows the metric sizes and rejects impossible cover", () => {
		expect(METRIC_REBAR_SIZES.find((m) => m.bar === "N12")!.weight).toBeCloseTo(0.5967, 3);
		expect(rebarGrid({ ...slab, cover: 80 })).toBeNull();
		expect(rebarGrid({ ...slab, lapBy: "length", lapValue: 300 })).toBeNull();
	});
});
