import { describe, it, expect } from "vitest";
import { diminishingLengths, goldenRatio, PHI } from "@/lib/construction/geometryUtils";

describe("diminishingLengths", () => {
	it("grows members under a 6:12 rake at 16 inch centers", () => {
		const d = diminishingLengths({ firstLength: 36, angle: 26.565, centers: 16, by: "count", count: 5, run: 0, direction: "longer" })!;
		expect(d.count).toBe(5);
		expect(d.commonDifference).toBeCloseTo(8, 3);
		expect(d.lengths[4]).toBeCloseTo(68, 2);
		expect(d.positions).toEqual([0, 16, 32, 48, 64]);
		expect(d.cutAngle).toBeCloseTo(26.565, 9);
		expect(d.rakeLength).toBeCloseTo(64 / Math.cos((26.565 * Math.PI) / 180), 6);
		expect(d.warnings).toEqual([]);
	});

	it("shortens along a run and warns when the members run out", () => {
		const d = diminishingLengths({ firstLength: 36, angle: 45, centers: 12, by: "run", count: 0, run: 48, direction: "shorter" })!;
		expect(d.count).toBe(5);
		[36, 24, 12, 0, -12].forEach((v, i) => expect(d.lengths[i]).toBeCloseTo(v, 9));
		expect(d.warnings[0]).toMatch(/run out/);
		expect(diminishingLengths({ firstLength: 36, angle: 90, centers: 12, by: "count", count: 3, run: 0, direction: "longer" })).toBeNull();
	});
});

describe("goldenRatio", () => {
	it("divides from any part", () => {
		const w = goldenRatio("whole", 100)!;
		expect(w.long).toBeCloseTo(61.803, 3);
		expect(w.short).toBeCloseTo(38.197, 3);
		expect(w.long / w.short).toBeCloseTo(PHI, 9);
		expect(goldenRatio("long", 61.803)!.whole).toBeCloseTo(100, 2);
		expect(goldenRatio("short", 38.197)!.whole).toBeCloseTo(100, 2);
		expect(w.nested.length).toBe(5);
		expect(w.nested[0]).toBeCloseTo(w.short / PHI, 9);
		expect(goldenRatio("whole", 0)).toBeNull();
	});
});
