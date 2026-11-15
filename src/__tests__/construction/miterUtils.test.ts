import { describe, it, expect } from "vitest";
import { miterJoint, compoundMiter, compoundFaceOutline } from "@/lib/construction/miterUtils";

describe("miterJoint", () => {
	it("equal widths at 90° split the corner at 45°", () => {
		const j = miterJoint(3.5, 3.5, 90)!;
		expect(j.angle1).toBeCloseTo(45, 9);
		expect(j.angle2).toBeCloseTo(45, 9);
		expect(j.saw1).toBeCloseTo(45, 9);
		expect(j.jointLength).toBeCloseTo(3.5 * Math.SQRT2, 9);
	});

	it("unequal widths move the joint off the bisector", () => {
		const j = miterJoint(2, 4, 90)!;
		expect(j.angle1).toBeCloseTo(26.5651, 3);
		expect(j.angle2).toBeCloseTo(63.4349, 3);
		expect(j.angle1 + j.angle2).toBeCloseTo(90, 9);
		// the joint line is at distance w1 from piece 1's edge and w2 from piece 2's
		expect(j.jointLength * Math.sin((j.angle2 * Math.PI) / 180)).toBeCloseTo(4, 9);
	});

	it("handles other corner angles and rejects flat ones", () => {
		const j = miterJoint(2, 2, 120)!;
		expect(j.angle1).toBeCloseTo(60, 9);
		expect(miterJoint(2, 2, 180)).toBeNull();
		expect(miterJoint(0, 2, 90)).toBeNull();
	});
});

describe("compoundMiter", () => {
	const base = { thickness: 0.75, baseWidth: 12, height: 6 };

	it("matches the standard table: 4 sides at 45° is miter 35.26°, bevel 30°", () => {
		const m = compoundMiter({ sides: 4, slope: 45, ...base })!;
		expect(m.flatMiter).toBe(45);
		expect(m.miter).toBeCloseTo(35.264, 2);
		expect(m.bevel).toBeCloseTo(30, 6);
	});

	it("6 sides at 60° is miter 16.1°, bevel 48.59°", () => {
		const m = compoundMiter({ sides: 6, slope: 60, ...base })!;
		expect(m.miter).toBeCloseTo(16.1, 1);
		expect(m.bevel).toBeCloseTo(48.59, 2);
	});

	it("vertical sides are a plain bevel, a flat frame a plain miter", () => {
		const v = compoundMiter({ sides: 4, slope: 90, ...base })!;
		expect(v.miter).toBeCloseTo(0, 9);
		expect(v.bevel).toBeCloseTo(45, 9);
		expect(v.topLength).toBeCloseTo(v.baseLength, 9);
		const f = compoundMiter({ sides: 4, slope: 0.01, ...base, height: 1e-7 })!;
		expect(f.miter).toBeCloseTo(45, 3);
		expect(f.bevel).toBeCloseTo(0, 1);
	});

	it("develops the face of a piece", () => {
		const m = compoundMiter({ sides: 4, slope: 45, thickness: 0.75, baseWidth: 12, height: 3 })!;
		expect(m.baseLength).toBeCloseTo(12, 9);
		expect(m.topWidth).toBeCloseTo(6, 9);
		expect(m.topLength).toBeCloseTo(6, 9);
		expect(m.slantHeight).toBeCloseTo(3 * Math.SQRT2, 9);
		expect(m.apexHeight).toBeCloseTo(6, 9);
		const face = compoundFaceOutline(m);
		expect(face[0].x).toBeCloseTo(-6, 9);
		expect(face[0].y).toBe(0);
		expect(face[2].x).toBeCloseTo(3, 9);
		// the cut across the face runs at the miter angle from square
		expect(Math.atan((face[1].x - face[2].x) / face[2].y) * (180 / Math.PI)).toBeCloseTo(m.miter, 6);
	});

	it("rejects a form taller than its apex", () => {
		expect(compoundMiter({ sides: 4, slope: 45, thickness: 0.75, baseWidth: 12, height: 7 })).toBeNull();
	});
});
