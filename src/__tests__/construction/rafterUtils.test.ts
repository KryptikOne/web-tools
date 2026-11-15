import { describe, it, expect } from "vitest";
import { commonRafter, runFromSpan, angleFromPitch } from "@/lib/construction/rafterUtils";

const base = { run: 144, angle: angleFromPitch(6), overhang: 24, depth: 7.25, thickness: 1.5, birdsmouth: 3.5, birdsmouthBy: "seat" as const, wallThickness: 3.5, wallHeight: 96 };

describe("commonRafter", () => {
	it("12' run at 6:12 with a 2' overhang", () => {
		const r = commonRafter(base)!;
		expect(r.angle).toBeCloseTo(26.565, 3);
		expect(r.pitch).toBeCloseTo(6, 9);
		expect(r.rise).toBeCloseTo(72, 9);
		expect(r.lineLength).toBeCloseTo(160.997, 2);
		expect(r.tailLength).toBeCloseTo(26.833, 2);
		expect(r.overallLength).toBeCloseTo(187.83, 2);
		expect(r.heel).toBeCloseTo(1.75, 9);
		expect(r.plumbDepth).toBeCloseTo(8.106, 3);
		expect(r.hap).toBeCloseTo(6.356, 3);
		expect(r.birdsmouthDepth).toBeCloseTo(1.565, 3);
		expect(r.birdsmouthTooDeep).toBe(false);
		expect(r.ridgeAbovePlate).toBeCloseTo(78.356, 3);
		expect(r.plumbCutAngle).toBeCloseTo(26.565, 3);
		expect(r.seatCutAngle).toBeCloseTo(63.435, 3);
		expect(r.warnings).toEqual([]);
	});

	it("drives the birdsmouth from the plumb height instead", () => {
		const r = commonRafter({ ...base, birdsmouth: 1.75, birdsmouthBy: "plumb" })!;
		expect(r.seat).toBeCloseTo(3.5, 9);
		expect(r.heel).toBeCloseTo(1.75, 9);
	});

	it("warns when the birdsmouth takes more than a third of the depth or overhangs the wall", () => {
		const r = commonRafter({ ...base, angle: 45, birdsmouth: 5.5, wallThickness: 3.5 })!;
		expect(r.birdsmouthDepth).toBeCloseTo(3.889, 3);
		expect(r.birdsmouthTooDeep).toBe(true);
		expect(r.warnings.some((w) => /third/.test(w))).toBe(true);
		expect(r.warnings.some((w) => /wider than the wall/.test(w))).toBe(true);
	});

	it("rejects impossible input", () => {
		expect(commonRafter({ ...base, run: 0 })).toBeNull();
		expect(commonRafter({ ...base, angle: 90 })).toBeNull();
	});
});

describe("runFromSpan", () => {
	it("half the width less half the ridge", () => {
		expect(runFromSpan(288, 1.5)).toBe(143.25);
		expect(runFromSpan(10, 20)).toBe(0);
	});
});
