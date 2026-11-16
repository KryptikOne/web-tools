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

describe("gableRoof", () => {
	const roof = {
		buildingWidth: 288,
		buildingLength: 480,
		angle: angleFromPitch(6),
		overhang: 24,
		overhangBy: "level" as const,
		rakeOverhang: 12,
		depth: 7.25,
		thickness: 1.5,
		ridgeThickness: 1.5,
		birdsmouth: 3.5,
		birdsmouthBy: "seat" as const,
		wallThickness: 3.5,
		wallHeight: 96,
		centers: 16,
		sheetWidth: 48,
		sheetLength: 96,
		costPer1000Bft: 800,
	};

	it("frames a 24' x 40' gable at 6:12", async () => {
		const { gableRoof } = await import("@/lib/construction/rafterUtils");
		const g = gableRoof(roof)!;
		expect(g.run).toBe(144);
		expect(g.ridgeShortening).toBeCloseTo(0.8385, 3);
		expect(g.lineLengthCut).toBeCloseTo(160.997 - 0.8385, 2);
		expect(g.overallLengthCut).toBeCloseTo(187.83 - 0.8385, 2);
		expect(g.ridgeTopAbovePlate).toBeCloseTo(78.356, 2);
		expect(g.raftersPerSide).toBe(31);
		expect(g.totalRafters).toBe(62);
		expect(g.ridgeLength).toBe(504);
		expect(g.fasciaLength).toBe(1008);
		expect(g.slopeLength).toBeCloseTo(187.83, 2);
		expect(g.areaPerSide / 144).toBeCloseTo(657.4, 1);
		expect(g.sheetsPerSide).toBe(4 * 6);
		expect(g.stockLength).toBe(192);
		expect(g.rafterBoardFeet).toBeCloseTo(((7.25 * 1.5 * 192) / 144) * 62, 6);
		expect(g.rafterCost).toBeCloseTo(g.rafterBoardFeet * 0.8, 6);
	});

	it("takes the overhang along the rafter", async () => {
		const { gableRoof } = await import("@/lib/construction/rafterUtils");
		const g = gableRoof({ ...roof, overhangBy: "rafter", overhang: 26.833 })!;
		expect(g.overhang).toBeCloseTo(24, 2);
		expect(gableRoof({ ...roof, buildingLength: 0 })).toBeNull();
	});
});
