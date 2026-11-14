import { describe, it, expect } from "vitest";
import { pitchToAngle, angleToPitch, gradeToAngle, angleToGrade, solveSlope, solveRightTriangle } from "@/lib/construction/pitchUtils";

describe("pitch / angle / grade", () => {
	it("12:12 is 45°, 6:12 is 26.565°", () => {
		expect(pitchToAngle(12)).toBeCloseTo(45, 9);
		expect(pitchToAngle(6)).toBeCloseTo(26.5651, 3);
		expect(angleToPitch(45)).toBeCloseTo(12, 9);
	});

	it("grade 100% is 45°", () => {
		expect(gradeToAngle(100)).toBeCloseTo(45, 9);
		expect(angleToGrade(45)).toBeCloseTo(100, 9);
	});
});

describe("solveSlope", () => {
	it("from pitch", () => {
		const s = solveSlope(144, { pitch: 6 })!;
		expect(s.rise).toBeCloseTo(72, 9);
		expect(s.length).toBeCloseTo(160.9969, 3);
		expect(s.grade).toBeCloseTo(50, 9);
		expect(s.angle).toBeCloseTo(26.5651, 3);
	});

	it("from rise, angle and grade agree", () => {
		expect(solveSlope(144, { rise: 72 })!.pitch).toBeCloseTo(6, 9);
		expect(solveSlope(144, { angle: 45 })!.rise).toBeCloseTo(144, 9);
		expect(solveSlope(144, { grade: 50 })!.rise).toBeCloseTo(72, 9);
	});

	it("needs exactly one known and a positive run", () => {
		expect(solveSlope(10, {})).toBeNull();
		expect(solveSlope(10, { rise: 1, angle: 2 })).toBeNull();
		expect(solveSlope(0, { rise: 1 })).toBeNull();
	});
});

describe("solveRightTriangle", () => {
	it("3-4-5 from two legs", () => {
		const t = solveRightTriangle({ a: 3, b: 4 })!;
		expect(t.c).toBeCloseTo(5, 9);
		expect(t.A).toBeCloseTo(36.8699, 3);
		expect(t.B).toBeCloseTo(53.1301, 3);
		expect(t.area).toBeCloseTo(6, 9);
	});

	it("from hypotenuse and angle", () => {
		const t = solveRightTriangle({ c: 10, A: 30 })!;
		expect(t.a).toBeCloseTo(5, 9);
		expect(t.B).toBeCloseTo(60, 9);
	});

	it("from leg and opposite / adjacent angle", () => {
		expect(solveRightTriangle({ a: 5, A: 30 })!.c).toBeCloseTo(10, 9);
		expect(solveRightTriangle({ a: 5, B: 60 })!.c).toBeCloseTo(10, 9);
		expect(solveRightTriangle({ b: 4, A: 36.86989764584402 })!.a).toBeCloseTo(3, 6);
	});

	it("from leg and hypotenuse", () => {
		expect(solveRightTriangle({ b: 4, c: 5 })!.a).toBeCloseTo(3, 9);
	});

	it("two angles and no side is underdetermined", () => {
		expect(solveRightTriangle({ A: 30, B: 60 })).toBeNull();
		expect(solveRightTriangle({ a: 3 })).toBeNull();
	});

	it("rejects impossible input", () => {
		expect(solveRightTriangle({ a: 6, c: 5 })).toBeNull();
		expect(solveRightTriangle({ a: 3, A: 90 })).toBeNull();
		expect(solveRightTriangle({ a: -3, b: 4 })).toBeNull();
	});
});

describe("pitch formatting and reference table", async () => {
	const { formatAngle, formatPitch, formatGrade, rafterMultiplier, pitchTable } = await import("@/lib/construction/pitchUtils");

	it("formats angle, pitch and grade", () => {
		expect(formatAngle(26.56505, 2)).toBe("26.57°");
		expect(formatAngle(26.56505, 0)).toBe("27°");
		expect(formatAngle(45, 3)).toBe("45.000°");
		expect(formatPitch(6)).toBe("6:12");
		expect(formatPitch(4.5)).toBe("4.5:12");
		expect(formatGrade(50)).toBe("50%");
		expect(formatGrade(100 / 3)).toBe("33.33%");
	});

	it("rafter multiplier and table", () => {
		expect(rafterMultiplier(12)).toBeCloseTo(Math.SQRT2, 9);
		expect(rafterMultiplier(0)).toBe(1);
		const rows = pitchTable();
		expect(rows).toHaveLength(24);
		expect(rows[0].pitch).toBe(1);
		expect(rows[11].angle).toBeCloseTo(45, 9);
		expect(rows[11].grade).toBeCloseTo(100, 9);
		expect(rows[5].multiplier).toBeCloseTo(1.118, 3);
	});
});
