import { describe, it, expect } from "vitest";
import { diagonal, squareUp, regularPolygon, solveCircle, solveArc } from "@/lib/construction/geometryUtils";

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

describe("regularPolygon", () => {
	it("hexagon on a 10 radius", () => {
		const p = regularPolygon(6, 10)!;
		expect(p.sideLength).toBeCloseTo(10, 9);
		expect(p.apothem).toBeCloseTo(8.66025, 4);
		expect(p.interiorAngle).toBe(120);
		expect(p.centralAngle).toBe(60);
		expect(p.area).toBeCloseTo(259.8076, 3);
		expect(p.perimeter).toBeCloseTo(60, 9);
		expect(p.boundingHeight).toBeCloseTo(20, 9);
		expect(p.boundingWidth).toBeCloseTo(17.3205, 3);
		expect(p.sliceArea * 6).toBeCloseTo(p.circleArea, 9);
		expect(p.segmentArea).toBeCloseTo(p.sliceArea - p.triangleArea, 9);
		expect(p.vertices[0]).toEqual({ x: expect.closeTo(0, 9), y: 10 });
	});

	it("square on radius 1 has side √2 and rejects fewer than 3 sides", () => {
		expect(regularPolygon(4, 1)!.sideLength).toBeCloseTo(Math.SQRT2, 9);
		expect(regularPolygon(2, 1)).toBeNull();
	});
});

describe("solveCircle", () => {
	it("solves from any one value", () => {
		expect(solveCircle({ radius: 2 })!.area).toBeCloseTo(4 * Math.PI, 9);
		expect(solveCircle({ diameter: 4 })!.circumference).toBeCloseTo(4 * Math.PI, 9);
		expect(solveCircle({ circumference: 4 * Math.PI })!.radius).toBeCloseTo(2, 9);
		expect(solveCircle({ area: 4 * Math.PI })!.diameter).toBeCloseTo(4, 9);
		expect(solveCircle({ radius: 0 })).toBeNull();
	});
});

describe("solveArc", () => {
	const quarter = { radius: 10, angle: 90 };
	it("radius and angle", () => {
		const a = solveArc(quarter)!;
		expect(a.chord).toBeCloseTo(14.1421, 3);
		expect(a.height).toBeCloseTo(2.9289, 3);
		expect(a.arcLength).toBeCloseTo(15.708, 3);
		expect(a.sectorArea).toBeCloseTo(78.5398, 3);
		expect(a.segmentArea).toBeCloseTo(28.5398, 3);
	});

	it("every other pair returns the same quarter circle", () => {
		const q = solveArc(quarter)!;
		const pairs = [
			{ radius: 10, chord: q.chord },
			{ radius: 10, height: q.height },
			{ radius: 10, arcLength: q.arcLength },
			{ chord: q.chord, height: q.height },
			{ chord: q.chord, angle: 90 },
			{ height: q.height, angle: 90 },
			{ arcLength: q.arcLength, angle: 90 },
			{ chord: q.chord, arcLength: q.arcLength },
			{ height: q.height, arcLength: q.arcLength },
		];
		for (const p of pairs) {
			const a = solveArc(p)!;
			expect(a.radius).toBeCloseTo(10, 6);
			expect(a.angle).toBeCloseTo(90, 6);
		}
	});

	it("handles arcs past a semicircle and rejects impossible input", () => {
		const big = solveArc({ radius: 10, height: 15 })!;
		expect(big.angle).toBeCloseTo(240, 6);
		expect(big.apothem).toBeCloseTo(-5, 9);
		expect(solveArc({ radius: 10, chord: 25 })).toBeNull();
		expect(solveArc({ chord: 10, arcLength: 9 })).toBeNull();
		expect(solveArc({ radius: 10 })).toBeNull();
	});
});
