import { describe, it, expect } from "vitest";
import { wainscot, stairWainscot } from "@/lib/construction/wainscotUtils";

describe("wainscot", () => {
	const base = { wallLength: 120, frameHeight: 36, stileWidth: 3, topRail: 3, bottomRail: 5, by: "count" as const, panels: 4, targetWidth: 24 };

	it("frames four panels on a 10 foot wall", () => {
		const w = wainscot(base)!;
		expect(w.stileCount).toBe(5);
		expect(w.panelWidth).toBeCloseTo((120 - 15) / 4, 9);
		expect(w.panels[0].near).toBe(3);
		expect(w.panels[0].width).toBeCloseTo(26.25, 9);
		expect(w.panels[3].far).toBeCloseTo(117, 9);
		expect(w.openingHeight).toBe(28);
		expect(w.positions).toEqual([0, 29.25, 58.5, 87.75, 117]);
		expect(w.cutList.find((c) => c.item === "Stiles")!.count).toBe(5);
		expect(w.warnings).toEqual([]);
	});

	it("picks the count from a target width and rejects an impossible frame", () => {
		const w = wainscot({ ...base, by: "width", targetWidth: 24 })!;
		expect(w.panelCount).toBe(4);
		expect(wainscot({ ...base, panels: 50 })).toBeNull();
		expect(wainscot({ ...base, topRail: 40 })).toBeNull();
	});
});

describe("stairWainscot", () => {
	const base = { rise: 7.5, run: 10, by: "treads" as const, levelLength: 0, treads: 12, frameHeight: 36, stileWidth: 3, topRail: 3, bottomRail: 5, panelsBy: "per-tread" as const, panelsPerTread: 1, targetWidth: 20 };

	it("puts one parallelogram panel per tread", () => {
		const s = stairWainscot(base)!;
		expect(s.angle).toBeCloseTo(36.87, 2);
		expect(s.levelLength).toBe(120);
		expect(s.rakeLength).toBeCloseTo(150, 6);
		expect(s.panelCount).toBe(12);
		expect(s.stileCount).toBe(13);
		expect(s.panelWidth).toBeCloseTo((120 - 39) / 12, 9);
		expect(s.panelRakeWidth).toBeCloseTo(s.panelWidth / 0.8, 9);
		expect(s.topRailPlumb).toBeCloseTo(3.75, 9);
		expect(s.bottomRailPlumb).toBeCloseTo(6.25, 9);
		expect(s.openingHeight).toBeCloseTo(26, 9);
		expect(s.stileEndCut).toBeCloseTo(36.87, 2);
		expect(s.rakePositions[1]).toBeCloseTo(s.positions[1] / 0.8, 9);
		expect(s.cutList.find((c) => c.item === "Stiles")!.length).toBeCloseTo(26 + 3 * 0.75, 9);
	});

	it("takes a level length and a target width", () => {
		const s = stairWainscot({ ...base, by: "length", levelLength: 96, panelsBy: "width", targetWidth: 20 })!;
		expect(s.levelLength).toBe(96);
		expect(s.panelCount).toBe(4);
		expect(stairWainscot({ ...base, rise: 0 })).toBeNull();
	});
});
