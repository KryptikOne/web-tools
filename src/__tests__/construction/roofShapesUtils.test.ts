import { describe, it, expect } from "vitest";
import { skillion, skillionAngleFromWalls, gambrel, saltbox } from "@/lib/construction/roofShapesUtils";
import { angleFromPitch } from "@/lib/construction/rafterUtils";

const common = { depth: 7.25, thickness: 1.5, seat: 3.5, wallThickness: 3.5, buildingLength: 240 };

describe("skillion", () => {
	it("solves a 12' span from the two wall heights", () => {
		const angle = skillionAngleFromWalls(144, 96, 168)!;
		expect(angle).toBeCloseTo(26.565, 3);
		const s = skillion({ ...common, span: 144, angle, overhangLow: 12, overhangHigh: 12, lowWallHeight: 96 })!;
		expect(s.rise).toBeCloseTo(72, 6);
		expect(s.lineLength).toBeCloseTo(160.997, 2);
		expect(s.tailLow).toBeCloseTo(13.416, 2);
		expect(s.tailHigh).toBeCloseTo(13.416, 2);
		expect(s.overallLength).toBeCloseTo(187.83, 2);
		expect(s.highWallHeight).toBeCloseTo(168, 6);
		expect(s.area / 144).toBeCloseTo((187.83 * 240) / 144, 1);
		expect(s.rafter.hap).toBeCloseTo(6.356, 3);
	});

	it("rejects a flat or inverted roof", () => {
		expect(skillionAngleFromWalls(144, 96, 96)).toBeNull();
		expect(skillion({ ...common, span: 144, angle: 0, overhangLow: 0, overhangHigh: 0, lowWallHeight: 96 })).toBeNull();
	});
});

describe("gambrel", () => {
	it("breaks a 24' span at 4' in with 60° over 30°", () => {
		const g = gambrel({ ...common, span: 288, lowerAngle: 60, upperAngle: 30, breakBy: "run", breakValue: 48, overhang: 12, ridgeThickness: 1.5 })!;
		expect(g.lowerRise).toBeCloseTo(83.138, 2);
		expect(g.lower.lineLength).toBeCloseTo(96, 6);
		expect(g.upperRun).toBe(96);
		expect(g.upperRise).toBeCloseTo(55.426, 2);
		expect(g.upper.lineLength).toBeCloseTo(110.851, 2);
		expect(g.breakAngle).toBe(150);
		expect(g.breakMiter).toBe(15);
		expect(g.ridgeShortening).toBeCloseTo(0.866, 3);
		expect(g.breakHeight).toBeCloseTo(83.138 + g.lower.hap, 3);
		expect(g.ridgeHeight).toBeCloseTo(g.breakHeight + 55.426, 2);
	});

	it("places the break by height and refuses a break past the centre", () => {
		const g = gambrel({ ...common, span: 288, lowerAngle: 60, upperAngle: 30, breakBy: "height", breakValue: 83.138, overhang: 12, ridgeThickness: 1.5 })!;
		expect(g.breakRun).toBeCloseTo(48, 2);
		expect(gambrel({ ...common, span: 288, lowerAngle: 60, upperAngle: 30, breakBy: "run", breakValue: 144, overhang: 0, ridgeThickness: 0 })).toBeNull();
		expect(gambrel({ ...common, span: 288, lowerAngle: 30, upperAngle: 45, breakBy: "run", breakValue: 48, overhang: 0, ridgeThickness: 0 })!.warnings.some((w) => /flattens/.test(w))).toBe(true);
	});
});

describe("saltbox", () => {
	it("finds the ridge for equal walls with 12:12 front and 6:12 rear", () => {
		const s = saltbox({ ...common, span: 288, frontAngle: 45, rearAngle: angleFromPitch(6), ridgeBy: "equal-walls", ridgeOffset: 0, overhangFront: 12, overhangRear: 12, ridgeThickness: 1.5, frontWallHeight: 96 })!;
		expect(s.frontRun).toBeCloseTo(96, 6);
		expect(s.rearRun).toBeCloseTo(192, 6);
		expect(s.ridgeOffset).toBeCloseTo(48, 6);
		expect(s.front.rise).toBeCloseTo(96, 6);
		expect(s.rear.rise).toBeCloseTo(96, 6);
		// equal rises, but the steeper side's HAP is taller, so the rear plate lands a touch higher
		expect(s.rearWallDelta).toBeCloseTo(s.front.hap - s.rear.hap, 9);
		expect(s.front.lineLength).toBeCloseTo(135.765, 2);
		expect(s.rear.lineLength).toBeCloseTo(214.663, 2);
	});

	it("takes a set ridge offset and reports the rear wall change", () => {
		const s = saltbox({ ...common, span: 288, frontAngle: 45, rearAngle: 45, ridgeBy: "offset", ridgeOffset: 48, overhangFront: 0, overhangRear: 0, ridgeThickness: 0, frontWallHeight: 96 })!;
		expect(s.frontRun).toBe(96);
		expect(s.rearRun).toBe(192);
		expect(s.rearWallDelta).toBeCloseTo(-96, 6);
		expect(s.rearWallHeight).toBeCloseTo(0, 6);
		expect(s.warnings.some((w) => /below the floor/.test(w))).toBe(true);
		expect(saltbox({ ...common, span: 288, frontAngle: 45, rearAngle: 45, ridgeBy: "offset", ridgeOffset: 144, overhangFront: 0, overhangRear: 0, ridgeThickness: 0, frontWallHeight: 96 })).toBeNull();
	});
});
