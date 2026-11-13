import { describe, it, expect } from "vitest";
import { computeSpacing, runningPositions } from "@/lib/construction/spacingUtils";

describe("computeSpacing equal", () => {
	it("both ends: 5 members over 100 at width 4", () => {
		const r = computeSpacing({ mode: "equal", totalLength: 100, memberWidth: 4, endMembers: "both", count: 5 });
		expect(r.gap).toBe(20);
		expect(r.centers).toBe(24);
		expect(r.members.map((m) => m.near)).toEqual([0, 24, 48, 72, 96]);
		expect(runningPositions(r, "far")).toEqual([4, 28, 52, 76, 100]);
		expect(runningPositions(r, "center")).toEqual([2, 26, 50, 74, 98]);
		expect(r.firstGap).toBe(20);
		expect(r.lastGap).toBe(20);
		expect(r.warnings).toEqual([]);
	});

	it("no ends: 3 members over 100 at width 4", () => {
		const r = computeSpacing({ mode: "equal", totalLength: 100, memberWidth: 4, endMembers: "none", count: 3 });
		expect(r.members.map((m) => m.near)).toEqual([22, 48, 74]);
		expect(r.gap).toBe(22);
	});

	it("one end: 4 members over 100 at width 4", () => {
		const r = computeSpacing({ mode: "equal", totalLength: 100, memberWidth: 4, endMembers: "one", count: 4 });
		expect(r.members.map((m) => m.near)).toEqual([0, 25, 50, 75]);
		expect(r.lastGap).toBe(21);
	});

	it("clamps both-ends count below 2", () => {
		const r = computeSpacing({ mode: "equal", totalLength: 100, memberWidth: 4, endMembers: "both", count: 1 });
		expect(r.count).toBe(2);
		expect(r.warnings).toContain("count-clamped");
	});

	it("flags overlap", () => {
		const r = computeSpacing({ mode: "equal", totalLength: 10, memberWidth: 4, endMembers: "both", count: 5 });
		expect(r.warnings).toContain("negative-gap");
	});
});

describe("computeSpacing exact", () => {
	it("both ends, adjust last", () => {
		const r = computeSpacing({ mode: "exact", totalLength: 100, memberWidth: 1.5, endMembers: "both", centers: 16, adjust: "last" });
		expect(r.members.map((m) => m.near)).toEqual([0, 16, 32, 48, 64, 80, 98.5]);
		expect(r.count).toBe(7);
		expect(r.centers).toBe(16);
		expect(r.gap).toBe(14.5);
		expect(r.firstGap).toBeCloseTo(14.5, 9);
		expect(r.lastGap).toBeCloseTo(17, 9);
	});

	it("both ends, adjust both equalizes end gaps", () => {
		const r = computeSpacing({ mode: "exact", totalLength: 100, memberWidth: 1.5, endMembers: "both", centers: 16, adjust: "both" });
		expect(r.firstGap).toBeCloseTo(r.lastGap, 9);
		expect(r.members[1].near).toBeCloseTo(17.25, 9);
		expect(r.members[r.members.length - 1].near).toBe(98.5);
	});

	it("one end", () => {
		const r = computeSpacing({ mode: "exact", totalLength: 50, memberWidth: 2, endMembers: "one", centers: 16, adjust: "last" });
		expect(r.members.map((m) => m.near)).toEqual([0, 16, 32]);
		expect(r.lastGap).toBe(16);
	});

	it("no ends, adjust last starts one gap in", () => {
		const r = computeSpacing({ mode: "exact", totalLength: 50, memberWidth: 2, endMembers: "none", centers: 16, adjust: "last" });
		expect(r.members.map((m) => m.near)).toEqual([14, 30]);
		expect(r.firstGap).toBe(14);
		expect(r.lastGap).toBe(18);
	});

	it("no ends, adjust both centres the run", () => {
		const r = computeSpacing({ mode: "exact", totalLength: 50, memberWidth: 2, endMembers: "none", centers: 16, adjust: "both" });
		expect(r.firstGap).toBeCloseTo(r.lastGap, 9);
		expect(r.members.map((m) => m.near)).toEqual([16, 32]);
	});

	it("drops an interior member that would collide with the end member", () => {
		// 0, 16, 32 fit; 48 + 1.5 > 50 - 1.5 so it is dropped and the end member sits at 48.5
		const r = computeSpacing({ mode: "exact", totalLength: 50, memberWidth: 1.5, endMembers: "both", centers: 16, adjust: "last" });
		expect(r.members.map((m) => m.near)).toEqual([0, 16, 32, 48.5]);
	});

	it("warns when centers are smaller than the member width", () => {
		const r = computeSpacing({ mode: "exact", totalLength: 100, memberWidth: 20, endMembers: "both", centers: 10, adjust: "last" });
		expect(r.warnings).toContain("centers-smaller-than-width");
		expect(r.members.map((m) => m.near)).toEqual([0, 80]);
	});
});
