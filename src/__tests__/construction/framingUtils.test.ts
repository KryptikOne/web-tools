import { describe, it, expect } from "vitest";
import { studLayout, framingQuantities, type StudLayoutInput } from "@/lib/construction/framingUtils";

const base: StudLayoutInput = {
	wallLength: 96,
	studWidth: 1.5,
	studDepth: 3.5,
	centers: 16,
	sheetWidth: 48,
	startWith: "single",
	endWith: "single",
	firstStudOffset: 0,
	sheetStart: "exterior",
	orthogonalWalls: false,
	studHeight: 92.625,
	rakeAngle: 0,
};

describe("studLayout", () => {
	it("lays an 8' wall out at 16\" centres with a stud at each end", () => {
		const r = studLayout(base)!;
		expect(r.studs.map((s) => s.center)).toEqual([0.75, 16, 32, 48, 64, 80, 95.25]);
		expect(r.count).toBe(7);
		expect(r.commonCount).toBe(5);
		expect(r.studs[1].near).toBe(15.25);
		expect(r.sheets).toHaveLength(2);
		expect(r.joints).toEqual([{ position: 48, overStud: true }]);
		expect(r.warnings).toEqual([]);
	});

	it("builds end assemblies and skips regular studs that collide with them", () => {
		const r = studLayout({ ...base, startWith: "double", endWith: "california" })!;
		expect(r.studs[0].kind).toBe("end");
		expect(r.studs[1]).toMatchObject({ near: 1.5, far: 3, kind: "end" });
		const last = r.studs[r.studs.length - 1];
		expect(last).toMatchObject({ far: 96, kind: "end" });
		expect(r.studs[r.studs.length - 2]).toMatchObject({ kind: "flat", far: 94.5, near: 91 });
		const g = studLayout({ ...base, wallLength: 97.5, endWith: "double-gap" })!;
		const ends = g.studs.filter((s) => s.kind === "end");
		expect(ends[ends.length - 1].near).toBe(96);
		expect(ends[ends.length - 2].far).toBe(94.5);
		// the 96" regular stud would land in the gap and is dropped
		expect(g.studs.some((s) => s.kind === "common" && s.center === 96)).toBe(false);
	});

	it("flags a sheet joint without backing and shifts sheeting for orthogonal walls", () => {
		const r = studLayout({ ...base, firstStudOffset: 2 })!;
		expect(r.joints[0].overStud).toBe(false);
		expect(r.warnings[0]).toMatch(/no stud behind/);
		const o = studLayout({ ...base, orthogonalWalls: true })!;
		expect(o.sheetOffset).toBe(3.5);
		expect(o.sheets[0].start).toBe(3.5);
	});

	it("varies stud heights along a rake", () => {
		const r = studLayout({ ...base, rakeAngle: 26.565 })!;
		expect(r.studs[0].height).toBeCloseTo(92.625 + 0.75 * 0.5, 3);
		expect(r.studs[3].height).toBeCloseTo(92.625 + 24, 2);
	});

	it("rejects walls shorter than two studs", () => {
		expect(studLayout({ ...base, wallLength: 2 })).toBeNull();
	});
});

describe("framingQuantities", () => {
	it("counts studs, plates and noggings for 40' of 2x4 wall", () => {
		const q = framingQuantities({
			totalLength: 480,
			studHeight: 92.625,
			centers: 16,
			section: { width: 3.5, thickness: 1.5 },
			bottomPlates: 1,
			topPlates: 2,
			noggingRows: 1,
			corners: 4,
			extraPerCorner: 2,
			ends: 2,
			extraPerEnd: 1,
			openings: 3,
			extraPerOpening: 4,
			stockLength: 192,
			costPer1000Bft: 800,
		})!;
		expect(q.commonStuds).toBe(31);
		expect(q.extraStuds).toBe(8 + 2 + 12);
		expect(q.studs).toBe(53);
		expect(q.plateLinearFeet).toBe(120);
		expect(q.platePieces).toBe(8);
		expect(q.noggingLinearFeet).toBe(40);
		expect(q.totalLinearFeet).toBeCloseTo(120 + 40 + (53 * 92.625) / 12, 6);
		expect(q.boardFeet).toBeCloseTo(q.totalLinearFeet * (3.5 * 1.5 * 12) / 144, 6);
		expect(q.cost).toBeCloseTo(q.boardFeet * 0.8, 6);
	});
});
