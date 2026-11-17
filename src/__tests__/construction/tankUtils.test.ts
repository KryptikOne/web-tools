import { describe, it, expect } from "vitest";
import { tank, dipChart, toUnit, circularSegmentArea, coneVolume, sphericalCapVolume, type TankInput } from "@/lib/construction/tankUtils";

const base: TankInput = {
	shape: "horizontal",
	diameter: 48,
	length: 120,
	width: 60,
	height: 40,
	wallThickness: 0,
	ends: "flat",
	dishDepth: 6,
	bottom: "flat",
	bottomHeight: 12,
	top: "flat",
	topHeight: 12,
	fillDepth: 24,
	specificGravity: 1,
};

describe("primitives", () => {
	it("segments, caps and cones", () => {
		expect(circularSegmentArea(24, 24)).toBeCloseTo((Math.PI * 576) / 2, 6);
		expect(circularSegmentArea(24, 48)).toBeCloseTo(Math.PI * 576, 6);
		expect(sphericalCapVolume(24, 48)).toBeCloseTo((4 / 3) * Math.PI * 24 ** 3, 6);
		expect(coneVolume(24, 12, 12)).toBeCloseTo((Math.PI * 576 * 12) / 3, 6);
		expect(coneVolume(24, 12, 6)).toBeCloseTo((Math.PI * 576 * 12) / 3 / 8, 6);
	});
});

describe("tank", () => {
	it("horizontal cylinder, half full, in gallons", () => {
		const t = tank(base)!;
		const full = Math.PI * 576 * 120;
		expect(t.capacity).toBeCloseTo(full, 3);
		expect(toUnit(t.capacity, "gal")).toBeCloseTo(940.03, 1);
		expect(t.volumeAtDepth).toBeCloseTo(full / 2, 3);
		expect(t.percentFull).toBeCloseTo(50, 6);
		expect(t.waterWeightLb).toBeCloseTo((full / 2) * (62.428 / 1728), 3);
		expect(t.surfaceArea).toBeCloseTo(Math.PI * 48 * 120 + 2 * Math.PI * 576, 3);
	});

	it("adds hemispherical and dished ends and takes the wall off", () => {
		const hemi = tank({ ...base, ends: "hemispherical" })!;
		expect(hemi.capacity).toBeCloseTo(Math.PI * 576 * 120 + (4 / 3) * Math.PI * 24 ** 3, 3);
		expect(hemi.volumeAtDepth).toBeCloseTo(hemi.capacity / 2, 3);
		const dished = tank({ ...base, ends: "dished", dishDepth: 6 })!;
		expect(dished.capacity).toBeCloseTo(Math.PI * 576 * 120 + ((4 / 3) * Math.PI * 24 ** 3 * 6) / 24, 3);
		const thick = tank({ ...base, wallThickness: 0.25 })!;
		expect(thick.inner.diameter).toBe(47.5);
		expect(thick.capacity).toBeCloseTo(Math.PI * 23.75 ** 2 * 119.5, 3);
	});

	it("vertical cylinder with a cone bottom and a dome top", () => {
		const t = tank({ ...base, shape: "vertical", height: 96, bottom: "cone", bottomHeight: 12, top: "dome", topHeight: 12, fillDepth: 6 })!;
		const cone = (Math.PI * 576 * 12) / 3;
		const dome = sphericalCapVolume(24, 12 * 2) * 0.5; // hemisphere scaled to half height
		expect(t.volumeAtDepth).toBeCloseTo(cone / 8, 3);
		expect(t.volumeAt(12)).toBeCloseTo(cone, 3);
		expect(t.volumeAt(60)).toBeCloseTo(cone + Math.PI * 576 * 48, 3);
		expect(t.capacity).toBeCloseTo(cone + Math.PI * 576 * 72 + dome, 3);
		expect(t.volumeAt(96)).toBeCloseTo(t.capacity, 6);
		expect(t.volumeAt(90)).toBeLessThan(t.capacity);
		expect(t.volumeAt(90)).toBeGreaterThan(t.volumeAt(84));
	});

	it("elliptical and rectangular tanks", () => {
		const e = tank({ ...base, shape: "elliptical", width: 60, height: 40, length: 100, fillDepth: 20 })!;
		expect(e.capacity).toBeCloseTo(Math.PI * 30 * 20 * 100, 3);
		expect(e.volumeAtDepth).toBeCloseTo(e.capacity / 2, 3);
		const r = tank({ ...base, shape: "rectangular", width: 60, height: 40, length: 100, fillDepth: 10, specificGravity: 0.85 })!;
		expect(r.capacity).toBe(240000);
		expect(r.volumeAtDepth).toBe(60000);
		expect(r.liquidWeightLb).toBeCloseTo(r.waterWeightLb * 0.85, 6);
		expect(tank({ ...base, shape: "rectangular", width: 0 })).toBeNull();
	});

	it("builds a dip chart that ends on the full depth", () => {
		const t = tank(base)!;
		const rows = dipChart(t, 6);
		expect(rows.length).toBe(9);
		expect(rows[0]).toEqual({ depth: 0, volume: 0, percent: 0 });
		expect(rows[4].percent).toBeCloseTo(50, 6);
		expect(rows[8].percent).toBeCloseTo(100, 6);
		expect(dipChart(t, 5).length).toBe(11);
		expect(dipChart(t, 0.001)).toEqual([]);
	});
});
