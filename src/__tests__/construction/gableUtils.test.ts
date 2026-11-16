import { describe, it, expect } from "vitest";
import { gableStuds, gableAngleFromHeights, alongRake, type GableStudInput } from "@/lib/construction/gableUtils";
import { angleFromPitch } from "@/lib/construction/rafterUtils";

const base: GableStudInput = {
	width: 144,
	angle: angleFromPitch(6),
	shape: "half",
	startHeight: 96,
	studWidth: 1.5,
	studDepth: 3.5,
	centers: 16,
	from: "end",
	firstStudOffset: 0,
	startWith: "single",
	endWith: "single",
	plateThickness: 1.5,
	topPlates: 1,
	bottomPlates: 1,
};

describe("gableStuds", () => {
	it("lays out a 12' raked wall at 6:12 from an 8' start height", () => {
		const g = gableStuds(base)!;
		expect(g.count).toBe(10);
		expect(g.commonDifference).toBeCloseTo(8, 9);
		expect(g.cutAngle).toBeCloseTo(26.565, 3);
		expect(g.rise).toBeCloseTo(72, 9);
		expect(g.peakHeight).toBeCloseTo(168, 9);
		expect(g.rakeLength).toBeCloseTo(161, 1);
		expect(g.platePlumb).toBeCloseTo(1.677, 3);
		// first stud: far face at 1 1/2", under one plate each side
		expect(g.studs[0].long).toBeCloseTo(96 - 1.5 - 1.677 + 0.75, 3);
		expect(g.studs[0].short).toBeCloseTo(g.studs[0].long - 0.75, 9);
		// commons step by the common difference
		expect(g.studs[2].long - g.studs[1].long).toBeCloseTo(8, 9);
		expect(g.studs[1].center).toBe(16);
		expect(g.studs.every((s) => !s.peak)).toBe(true);
		expect(g.boardFeet).toBeGreaterThan(0);
		expect(g.warnings).toEqual([]);
	});

	it("mirrors a full gable about the ridge and centres a stud under it", () => {
		const g = gableStuds({ ...base, shape: "full", from: "center", width: 160 })!;
		const peak = g.studs.find((s) => s.peak)!;
		expect(peak.center).toBeCloseTo(80, 9);
		expect(peak.long).toBeCloseTo(96 - 1.5 - 1.677 + 40, 3);
		expect(g.peakHeight).toBeCloseTo(136, 9);
		const left = g.studs.filter((s) => s.far <= 80);
		const right = g.studs.filter((s) => s.near >= 80);
		expect(left.length).toBe(right.length);
		for (let i = 0; i < left.length; i++) expect(left[i].long).toBeCloseTo(right[right.length - 1 - i].long, 9);
		expect(g.warnings.some((w) => /cut to a point/.test(w))).toBe(true);
	});

	it("rejects impossible input", () => {
		expect(gableStuds({ ...base, angle: 0 })).toBeNull();
		expect(gableStuds({ ...base, width: 0 })).toBeNull();
		expect(gableStuds({ ...base, startHeight: 2 })!.warnings.some((w) => /raise the start height/.test(w))).toBe(true);
	});
});

describe("gableAngleFromHeights", () => {
	it("gets the rake from two heights", () => {
		expect(gableAngleFromHeights(144, "half", 96, 168)).toBeCloseTo(26.565, 3);
		expect(gableAngleFromHeights(144, "full", 96, 132)).toBeCloseTo(26.565, 3);
		expect(gableAngleFromHeights(144, "half", 96, 96)).toBeNull();
	});
});

describe("alongRake", () => {
	it("stretches level positions along the slope", () => {
		expect(alongRake([0, 12], 45)[1]).toBeCloseTo(16.97, 2);
	});
});
