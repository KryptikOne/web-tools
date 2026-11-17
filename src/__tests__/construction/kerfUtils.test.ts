import { describe, it, expect } from "vitest";
import { kerfBend, kerfEllipse } from "@/lib/construction/kerfUtils";

describe("kerfBend", () => {
	const base = { thickness: 0.75, kerfWidth: 0.125, remaining: 0.125, insideRadius: 6, by: "angle" as const, angle: 90, arcLength: 0, round: "up" as const };

	it("bends 3/4 stock through 90° on a 6 inch radius", () => {
		const b = kerfBend(base)!;
		expect(b.kerfDepth).toBeCloseTo(0.625, 9);
		expect(b.anglePerKerfClosed).toBeCloseTo(0.2 * (180 / Math.PI), 6);
		expect(b.kerfs).toBe(8);
		expect(b.anglePerKerf).toBeCloseTo(11.25, 9);
		expect(b.outsideRadius).toBe(6.75);
		expect(b.spacing).toBeCloseTo((Math.PI / 16) * 6.75, 9);
		expect(b.insideArc).toBeCloseTo((Math.PI / 2) * 6, 9);
		expect(b.outsideArc).toBeCloseTo((Math.PI / 2) * 6.75, 9);
		expect(b.bendLength).toBeCloseTo(b.outsideArc, 9);
		expect(b.positions.length).toBe(8);
		expect(b.positions[0]).toBeCloseTo(b.spacing / 2, 9);
		expect(b.gapLeft).toBeGreaterThan(0);
		expect(b.gapLeft).toBeLessThan(0.125);
		expect(b.warnings).toEqual([]);
	});

	it("rounds down to fully closed kerfs and takes the bend as an arc length", () => {
		const d = kerfBend({ ...base, round: "down" })!;
		expect(d.kerfs).toBe(7);
		expect(d.gapLeft).toBeCloseTo(0, 9);
		expect(d.angle).toBeCloseTo(7 * 0.2 * (180 / Math.PI), 6);
		expect(d.warnings[0]).toMatch(/add one kerf/);
		const arc = kerfBend({ ...base, by: "arc", arcLength: (Math.PI / 2) * 6.75 })!;
		expect(arc.angle).toBeCloseTo(90, 9);
		expect(kerfBend({ ...base, remaining: 1 })).toBeNull();
	});
});

describe("kerfEllipse", () => {
	it("puts kerfs closer together where a half ellipse is tighter", () => {
		const e = kerfEllipse({ thickness: 0.75, kerfWidth: 0.125, remaining: 0.125, width: 48, rise: 12 })!;
		expect(e.anglePerKerf).toBeCloseTo(180 / e.kerfs, 9);
		expect(e.kerfs).toBe(Math.round(Math.PI / 0.2));
		// radius of curvature: tightest at the ends of the major axis (b²/a), widest at the top (a²/b)
		expect(e.minRadius).toBeCloseTo(144 / 24, 2);
		expect(e.maxRadius).toBeCloseTo(576 / 12, 2);
		expect(e.minSpacing).toBeLessThan(e.maxSpacing);
		expect(e.kerfList[0].position).toBeGreaterThan(0);
		expect(e.kerfList[e.kerfs - 1].position).toBeLessThan(e.outsideLength);
		expect(e.outsideLength).toBeGreaterThan(e.insideLength);
		// the middle kerf sits near the top of the rise where the curve is flattest
		const mid = e.kerfList[Math.floor(e.kerfs / 2)];
		expect(mid.radius).toBeGreaterThan(e.kerfList[0].radius);
		expect(e.inside[0].x).toBeCloseTo(-24, 6);
		expect(e.inside[e.inside.length - 1].x).toBeCloseTo(24, 6);
	});

	it("rejects a flat or impossible curve", () => {
		expect(kerfEllipse({ thickness: 0.75, kerfWidth: 0.125, remaining: 0.125, width: 48, rise: 0 })).toBeNull();
		expect(kerfEllipse({ thickness: 0.75, kerfWidth: 0.125, remaining: 0.125, width: 48, rise: 2 })!.warnings.some((w) => /tighter/.test(w))).toBe(true);
	});
});
