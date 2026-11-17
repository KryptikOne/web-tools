import { describe, it, expect } from "vitest";
import { curvedMolding, type CurvedMoldingInput } from "@/lib/construction/curvedMoldingUtils";

const base: CurvedMoldingInput = {
	by: "radius",
	radius: 36,
	chord: 0,
	rise: 0,
	angle: 90,
	width: 3,
	thickness: 0.75,
	segments: 4,
	kerfWidth: 0,
	kerfRemaining: 0.125,
	springAngle: 0,
};

describe("curvedMolding", () => {
	it("runs 3 inch trim round a quarter circle in four segments", () => {
		const m = curvedMolding(base)!;
		expect(m.outsideRadius).toBe(39);
		expect(m.centreRadius).toBe(37.5);
		expect(m.insideLength).toBeCloseTo((Math.PI / 2) * 36, 9);
		expect(m.outsideLength).toBeCloseTo((Math.PI / 2) * 39, 9);
		expect(m.chord).toBeCloseTo(36 * Math.SQRT2, 9);
		expect(m.segments.length).toBe(4);
		expect(m.segments[0].angle).toBe(22.5);
		expect(m.segments[0].miter).toBe(11.25);
		expect(m.segments[0].outsideLength).toBeCloseTo(2 * 39 * Math.sin((11.25 * Math.PI) / 180), 9);
		expect(m.segments[0].insideLength).toBeCloseTo(2 * 36 * Math.sin((11.25 * Math.PI) / 180), 9);
		expect(m.blankWidth).toBeCloseTo(3 + 39 * (1 - Math.cos((11.25 * Math.PI) / 180)), 9);
		expect(m.kerf).toBeNull();
		expect(m.crown).toBeNull();
		expect(m.warnings).toEqual([]);
	});

	it("takes the curve from chord and rise, kerfs it and sets crown compound cuts", () => {
		const m = curvedMolding({ ...base, by: "chord-rise", chord: 48, rise: 6, segments: 0, kerfWidth: 0.125 })!;
		expect(m.insideRadius).toBeCloseTo(51, 9);
		expect(m.angle).toBeCloseTo(2 * Math.asin(24 / 51) * (180 / Math.PI), 6);
		expect(m.kerf).not.toBeNull();
		expect(m.kerf!.kerfs).toBeGreaterThan(0);
		expect(m.segments).toEqual([]);
		const crown = curvedMolding({ ...base, springAngle: 38 })!;
		const slope = (52 * Math.PI) / 180;
		const phi = (11.25 * Math.PI) / 180;
		expect(crown.crown!.miter).toBeCloseTo(Math.atan(Math.cos(slope) * Math.tan(phi)) * (180 / Math.PI), 6);
		expect(crown.crown!.bevel).toBeCloseTo(Math.asin(Math.sin(slope) * Math.cos(phi)) * (180 / Math.PI), 6);
		expect(curvedMolding({ ...base, segments: 1 })!.warnings[0]).toMatch(/more pieces/);
		expect(curvedMolding({ ...base, radius: 0 })).toBeNull();
	});
});
