import { describe, it, expect } from "vitest";
import { diagonalBrace, kneeBrace } from "@/lib/construction/braceUtils";

describe("diagonalBrace", () => {
	const base = { frameWidth: 96, frameHeight: 48, braceWidth: 3.5, ends: "corner" as const, studCenters: 16, studWidth: 1.5 };

	it("fits a brace into the corners of an 8 by 4 frame", () => {
		const d = diagonalBrace(base)!;
		expect(d.angle).toBeCloseTo(26.565, 3);
		expect(d.diagonal).toBeCloseTo(107.331, 3);
		expect(d.longLength).toBeCloseTo(107.331, 3);
		expect(d.shortLength).toBeCloseTo(107.331 - 3.5 / 0.8, 3);
		expect(d.plumbCut).toBeCloseTo(1.75 / Math.cos((26.565 * Math.PI) / 180), 3);
		expect(d.levelCut).toBeCloseTo(1.75 / Math.sin((26.565 * Math.PI) / 180), 3);
		expect(d.plumbCutAngle).toBeCloseTo(26.565, 3);
		expect(d.levelCutAngle).toBeCloseTo(63.435, 3);
		expect(d.notches.length).toBe(5);
		expect(d.notches[0].x).toBe(16);
		expect(d.notches[0].bottom).toBeCloseTo(8 - d.plumbCut, 6);
		expect(d.notches[0].top).toBeCloseTo(8 + d.plumbCut, 6);
		expect(d.warnings[0]).toMatch(/flat/);
	});

	it("sets square ends in from the corners and skips notches when face fixed", () => {
		const s = diagonalBrace({ ...base, ends: "square", studCenters: 0 })!;
		expect(s.squareSetIn).toBeCloseTo(3.5, 9);
		expect(s.longLength).toBeCloseTo(107.331 - 7, 3);
		expect(s.shortLength).toBeCloseTo(s.longLength, 9);
		expect(s.notches).toEqual([]);
		expect(diagonalBrace({ ...base, frameWidth: 96, frameHeight: 96 })!.warnings).toEqual([]);
		expect(diagonalBrace({ ...base, braceWidth: 0 })).toBeNull();
	});
});

describe("kneeBrace", () => {
	it("cuts a 45° knee brace with 24 inch legs", () => {
		const k = kneeBrace({ by: "rise-run", angle: 0, run: 24, rise: 24, braceWidth: 3.5, postWidth: 5.5, beamDepth: 7.25 })!;
		expect(k.angle).toBeCloseTo(45, 9);
		expect(k.centreLength).toBeCloseTo(24 * Math.SQRT2, 9);
		expect(k.longLength).toBeCloseTo(24 * Math.SQRT2 + 3.5, 9);
		expect(k.shortLength).toBeCloseTo(24 * Math.SQRT2 - 3.5, 9);
		expect(k.postCutAngle).toBeCloseTo(45, 9);
		expect(k.beamCutAngle).toBeCloseTo(45, 9);
		expect(k.postCutLength).toBeCloseTo(3.5 * Math.SQRT2, 9);
		expect(k.postHousing.centre).toBe(24);
		expect(k.postHousing.from).toBeCloseTo(24 - 1.75 * Math.SQRT2, 9);
		expect(k.beamHousing.to).toBeCloseTo(24 + 1.75 * Math.SQRT2, 9);
		expect(k.warnings).toEqual([]);
	});

	it("takes an angle and run, and warns on a flat brace", () => {
		const k = kneeBrace({ by: "angle", angle: 60, run: 12, rise: 0, braceWidth: 3.5, postWidth: 5.5, beamDepth: 7.25 })!;
		expect(k.rise).toBeCloseTo(12 * Math.tan(Math.PI / 3), 9);
		expect(k.warnings).toEqual([]);
		const flat = kneeBrace({ by: "angle", angle: 20, run: 24, rise: 0, braceWidth: 3.5, postWidth: 5.5, beamDepth: 7.25 })!;
		expect(flat.warnings[0]).toMatch(/flat/);
		expect(kneeBrace({ by: "angle", angle: 90, run: 12, rise: 0, braceWidth: 3.5, postWidth: 5.5, beamDepth: 7.25 })).toBeNull();
	});
});
