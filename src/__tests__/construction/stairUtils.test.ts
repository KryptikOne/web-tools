import { describe, it, expect } from "vitest";
import { possibleRises, solveStair, stringerRunningPoints, type StairInput } from "@/lib/construction/stairUtils";

const base: StairInput = {
	totalRise: 108,
	idealRise: 7.5,
	runBy: "ideal-run",
	idealRun: 10,
	totalRun: 130,
	angle: 37,
	topTread: "down",
	construction: "wood",
	stringerWidth: 11.25,
	throat: 5,
	stairWidth: 36,
	floorThickness: 10,
	treadThickness: 1,
	riserThickness: 0.75,
	nosing: 1,
	openingLength: 120,
	restrict: false,
};

describe("solveStair", () => {
	it("108\" rise at 7.5\" ideal gives 14 risers at 7 5/7\"", () => {
		const s = solveStair(base)!;
		expect(s.risers).toBe(14);
		expect(s.rise).toBeCloseTo(7.714, 3);
		expect(s.treads).toBe(13);
		expect(s.run).toBe(10);
		expect(s.totalRun).toBe(130);
		expect(s.angle).toBeCloseTo(37.65, 2);
		expect(s.stepLength).toBeCloseTo(12.63, 2);
		expect(s.throat).toBeCloseTo(11.25 - 7.714 * (10 / 12.63), 2);
		expect(s.treadHeights[0]).toBeCloseTo(7.714, 3);
		expect(s.treadHeights).toHaveLength(13);
		expect(s.twoRisePlusRun).toBeCloseTo(25.43, 2);
		expect(s.headroom).toBeCloseTo(120 * 0.7714 - 10, 2);
	});

	it("level top tread adds a tread; total run and angle drive the run", () => {
		expect(solveStair({ ...base, topTread: "level" })!.treads).toBe(14);
		expect(solveStair({ ...base, runBy: "total-run", totalRun: 143 })!.run).toBeCloseTo(11, 9);
		const a = solveStair({ ...base, runBy: "angle", angle: 45 })!;
		expect(a.run).toBeCloseTo(a.rise, 9);
	});

	it("lists possible rises and honours an explicit riser count", () => {
		const opts = possibleRises(108, 7.5, "down");
		expect(opts.map((o) => o.risers)).toEqual([12, 13, 14, 15, 16]);
		expect(opts[2].rise).toBeCloseTo(7.714, 3);
		expect(solveStair({ ...base, risers: 15 })!.rise).toBeCloseTo(7.2, 9);
	});

	it("warns on a thin throat, a short opening and restricts extremes", () => {
		const s = solveStair({ ...base, stringerWidth: 9.25, openingLength: 60 })!;
		expect(s.warnings.some((w) => /stringer is left/.test(w))).toBe(true);
		expect(s.warnings.some((w) => /Headroom/.test(w))).toBe(true);
		const r = solveStair({ ...base, idealRun: 20, restrict: true })!;
		expect(r.run).toBe(14);
		expect(r.warnings.some((w) => /Run held/.test(w))).toBe(true);
	});

	it("finds landing candidates and concrete volume", () => {
		const s = solveStair(base)!;
		// treads with ≥36" above and below: 5..9 (5×7.71=38.6, 9×7.71=69.4 leaves 38.6)
		expect(s.landingCandidates).toEqual([5, 6, 7, 8, 9]);
		const c = solveStair({ ...base, construction: "concrete", throat: 5 })!;
		expect(c.concreteArea).toBeCloseTo(13 * (7.714 * 10) / 2 + 5 * Math.hypot(108, 130), 1);
		expect(c.concreteVolume).toBeCloseTo(c.concreteArea * 36, 6);
		expect(s.concreteVolume).toBe(0);
	});

	it("running points along the stringer", () => {
		const s = solveStair(base)!;
		const pts = stringerRunningPoints(s);
		expect(pts).toHaveLength(14);
		expect(pts[1]).toBeCloseTo(s.stepLength, 9);
	});
});
