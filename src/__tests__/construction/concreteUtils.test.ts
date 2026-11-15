import { describe, it, expect } from "vitest";
import { bagsFor, bagYieldCubicFeet, cylinderVolume, cubicFeet, cubicYards, outlineFromSegments, closingSegment, slabVolumes, rebar, REBAR_SIZES, meshSheets } from "@/lib/construction/concreteUtils";

describe("bags", () => {
	it("an 80 lb bag yields 0.6 cubic feet", () => {
		expect(bagYieldCubicFeet(80)).toBeCloseTo(0.6, 2);
		expect(bagsFor(1.2, 80)).toBe(2);
		expect(bagsFor(1.21, 80)).toBe(3);
		expect(bagsFor(0, 80)).toBe(0);
	});

	it("round post holes", () => {
		// 12" × 36" hole ≈ 2.356 ft³
		const v = cubicFeet(cylinderVolume(12, 36));
		expect(v).toBeCloseTo(2.356, 3);
		expect(bagsFor(v * 4, 60)).toBe(21);
		expect(cubicYards(46656)).toBe(1);
	});
});

describe("outline", () => {
	it("walks a 10 × 8 rectangle clockwise and closes", () => {
		const o = outlineFromSegments([
			{ length: 120, direction: "N" },
			{ length: 96, direction: "E" },
			{ length: 120, direction: "S" },
			{ length: 96, direction: "W" },
		]);
		expect(o.closed).toBe(true);
		expect(o.area).toBe(96 * 120);
		expect(o.perimeter).toBe(432);
		expect(o.width).toBe(96);
		expect(o.depth).toBe(120);
	});

	it("reports the closing segment for an open L shape", () => {
		const o = outlineFromSegments([
			{ length: 120, direction: "N" },
			{ length: 96, direction: "E" },
			{ length: 60, direction: "S" },
			{ length: 48, direction: "W" },
			{ length: 60, direction: "S" },
		]);
		expect(o.closed).toBe(false);
		expect(closingSegment(o)).toEqual({ length: 48, direction: "W" });
		// area is taken as if closed
		expect(o.area).toBe(120 * 96 - 60 * 48);
		expect(o.perimeter).toBe(120 + 96 + 60 + 48 + 60 + 48);
	});

	it("handles diagonals and has no closing direction for an odd gap", () => {
		const o = outlineFromSegments([
			{ length: 100, direction: "E" },
			{ length: 100, direction: "N" },
		]);
		expect(o.closingLength).toBeCloseTo(141.42, 2);
		expect(closingSegment(o)!.direction).toBe("SW");
		const odd = outlineFromSegments([
			{ length: 100, direction: "E" },
			{ length: 50, direction: "N" },
		]);
		expect(closingSegment(odd)).toBeNull();
	});
});

describe("slabVolumes", () => {
	it("adds beams below the slab and splays", () => {
		const v = slabVolumes({ area: 14400, perimeter: 480, slabThickness: 4, edgeBeamWidth: 12, edgeBeamDepth: 12, internalBeamLength: 120, internalBeamWidth: 12, internalBeamDepth: 10, splayInternal: true });
		expect(v.slab).toBe(57600);
		expect(v.edgeBeams).toBe(12 * 8 * 480);
		expect(v.internalBeams).toBe(12 * 6 * 120 + 6 * 6 * 120);
		expect(v.total).toBe(v.slab + v.edgeBeams + v.internalBeams);
		const short = slabVolumes({ area: 14400, perimeter: 480, slabThickness: 4, edgeBeamWidth: 12, edgeBeamDepth: 12, edgeBeamLength: 100, internalBeamLength: 0, internalBeamWidth: 0, internalBeamDepth: 0, splayInternal: false });
		expect(short.edgeBeamLength).toBe(100);
		expect(short.internalBeams).toBe(0);
	});
});

describe("rebar and mesh", () => {
	it("totals grid and beam bars with waste, weight and cost", () => {
		const r = rebar({ area: 14400, edgeBeamLength: 480, edgeBeamBars: 2, internalBeamLength: 120, internalBeamBars: 2, gridSpacing: 12, wastePercent: 10, barLength: 240, costPerBar: 10, size: REBAR_SIZES[1] });
		expect(r.gridLength).toBe(2400);
		expect(r.beamLength).toBe(960 + 240);
		expect(r.totalLength).toBeCloseTo(3600 * 1.1, 9);
		expect(r.bars).toBe(17);
		expect(r.weightLb).toBeCloseTo((3960 / 12) * 0.668, 6);
		expect(r.cost).toBe(170);
	});

	it("mesh sheets with overlap", () => {
		expect(meshSheets(14400, 48, 96, 0)).toBe(4);
		expect(meshSheets(14400, 48, 96, 10)).toBe(4);
		expect(meshSheets(14400, 48, 96, 30)).toBe(5);
	});
});
