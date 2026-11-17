import { describe, it, expect } from "vitest";
import { arcLayout, gothicArch, oval } from "@/lib/construction/curveLayoutUtils";

describe("arcLayout", () => {
	it("gives offsets from a 48 inch chord with a 6 inch rise", () => {
		const a = arcLayout({ by: "chord-rise", chord: 48, rise: 6, radius: 0, interval: 12 })!;
		expect(a.radius).toBeCloseTo(51, 9);
		expect(a.centreBelowChord).toBeCloseTo(45, 9);
		expect(a.offsets.map((o) => o.x)).toEqual([0, 12, 24, 36, 48]);
		expect(a.offsets[1].y).toBeCloseTo(Math.sqrt(51 * 51 - 144) - 45, 9);
		expect(a.offsets[2].y).toBeCloseTo(6, 9);
		expect(a.offsets[0].y).toBeCloseTo(0, 9);
		const byRadius = arcLayout({ by: "radius-chord", chord: 48, rise: 0, radius: 51, interval: 24 })!;
		expect(byRadius.rise).toBeCloseTo(6, 9);
		expect(arcLayout({ by: "chord-rise", chord: 48, rise: 0, radius: 0, interval: 12 })).toBeNull();
	});
});

describe("gothicArch", () => {
	it("builds equilateral, lancet and drop arches", () => {
		const eq = gothicArch({ span: 48, style: "equilateral", rise: 0, interval: 12 })!;
		expect(eq.rise).toBeCloseTo(41.569, 3);
		expect(eq.centres[1].x).toBeCloseTo(0, 9);
		expect(eq.centres[1].radius).toBeCloseTo(48, 9);
		expect(eq.y(24)).toBeCloseTo(41.569, 3);
		expect(eq.y(0)).toBeCloseTo(0, 6);
		expect(eq.apexAngle).toBeCloseTo(120, 6);
		const lancet = gothicArch({ span: 48, style: "lancet", rise: 0, interval: 12 })!;
		expect(lancet.centres[1].x).toBeCloseTo(-12, 9);
		expect(lancet.centres[1].radius).toBeCloseTo(60, 9);
		expect(lancet.warnings[0]).toMatch(/outside the span/);
		const drop = gothicArch({ span: 48, style: "drop", rise: 0, interval: 12 })!;
		expect(drop.centres[1].x).toBeGreaterThan(0);
		expect(drop.y(24)).toBeCloseTo(0.7 * 48, 6);
	});

	it("solves a Tudor four-centre arch that is tangent at the junctions and reaches the apex", () => {
		const t = gothicArch({ span: 48, style: "tudor", rise: 18, interval: 6 })!;
		expect(t.centres.length).toBe(4);
		expect(t.centres[0].radius).toBe(12);
		expect(t.y(24)).toBeCloseTo(18, 6);
		expect(t.y(0)).toBeCloseTo(0, 6);
		// continuous at the junction
		const j = t.junctions[0];
		expect(t.y(j.x - 1e-6)).toBeCloseTo(t.y(j.x + 1e-6), 4);
		expect(j.y).toBeGreaterThan(0);
		expect(gothicArch({ span: 48, style: "tudor", rise: 10, interval: 6 })).toBeNull();
		expect(gothicArch({ span: 48, style: "custom", rise: 20, interval: 6 })).toBeNull();
	});
});

describe("oval", () => {
	it("lays out a 60 by 40 ellipse", () => {
		const o = oval({ major: 60, minor: 40, interval: 10 })!;
		expect(o.focalDistance).toBeCloseTo(Math.sqrt(500), 9);
		expect(o.stringLength).toBe(60);
		expect(o.perimeter).toBeCloseTo(158.65, 1);
		expect(o.area).toBeCloseTo(Math.PI * 600, 6);
		expect(o.offsets.length).toBe(7);
		expect(o.offsets[3].y).toBeCloseTo(20, 9);
		expect(o.fourCentre.endRadius).toBeCloseTo(400 / 30, 9);
		expect(o.fourCentre.sideRadius).toBeCloseTo(37.5, 6);
		// the junction lies on both arcs
		const f = o.fourCentre;
		expect(Math.hypot(f.junctionX - f.endCentre, f.junctionY)).toBeCloseTo(f.endRadius, 6);
		expect(Math.hypot(f.junctionX, f.junctionY + f.sideCentreBelow)).toBeCloseTo(f.sideRadius, 6);
		expect(oval({ major: 40, minor: 60, interval: 10 })).toBeNull();
	});
});
