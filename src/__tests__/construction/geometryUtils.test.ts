import { describe, it, expect } from "vitest";
import { diagonal, squareUp } from "@/lib/construction/geometryUtils";

describe("geometryUtils", () => {
	it("3-4-5 diagonal", () => {
		expect(diagonal(36, 48)).toBe(60);
	});

	it("a square layout needs no move", () => {
		const r = squareUp({ referenceLength: 144, sideLength: 192, batterboardGap: 24, currentDiagonal: 240 })!;
		expect(r.correctDiagonal).toBe(240);
		expect(r.currentAngle).toBeCloseTo(90, 9);
		expect(r.direction).toBe("none");
		expect(r.moveAtBatterboard).toBeCloseTo(0, 9);
	});

	it("a short diagonal means the corner is closed in and the string moves away", () => {
		const r = squareUp({ referenceLength: 144, sideLength: 192, batterboardGap: 24, currentDiagonal: 238 })!;
		expect(r.outOfSquare).toBeCloseTo(-2, 9);
		expect(r.direction).toBe("away");
		expect(r.currentAngle).toBeLessThan(90);
		// the string moves further than the corner, in proportion to its radius
		expect(r.moveAtBatterboard / r.moveAtCorner).toBeCloseTo((192 + 24) / 192, 9);
		// small-angle check: corner move ≈ out-of-square × diagonal / reference
		expect(r.moveAtCorner).toBeCloseTo((2 * 240) / 144, 1);
	});

	it("a long diagonal moves the string toward the reference side", () => {
		expect(squareUp({ referenceLength: 144, sideLength: 192, batterboardGap: 0, currentDiagonal: 241 })!.direction).toBe("toward");
	});

	it("rejects a diagonal that cannot close the triangle", () => {
		expect(squareUp({ referenceLength: 144, sideLength: 192, batterboardGap: 0, currentDiagonal: 400 })).toBeNull();
		expect(squareUp({ referenceLength: 0, sideLength: 192, batterboardGap: 0, currentDiagonal: 100 })).toBeNull();
	});
});
