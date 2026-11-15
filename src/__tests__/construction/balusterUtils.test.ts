import { describe, it, expect } from "vitest";
import { balusterRun, minimumBalusters, panelGap, stairBalusters } from "@/lib/construction/balusterUtils";

describe("balusterRun", () => {
	it("picks the fewest balusters that keep the gap under the code gap", () => {
		// 72" between posts, 1.5" balusters, 4" max gap, no end members: 12 gives 4.0" exactly? (72-12*1.5)/13 = 4.15 → 13
		expect(minimumBalusters(72, 1.5, "none", 4)).toBe(13);
		const r = balusterRun({ length: 72, width: 1.5, endMembers: "none", maxGap: 4 })!;
		expect(r.count).toBe(13);
		expect(r.gap).toBeLessThanOrEqual(4);
		expect(r.gap).toBeCloseTo((72 - 13 * 1.5) / 14, 9);
	});

	it("honours a maximum centers limit and end member rules", () => {
		expect(balusterRun({ length: 72, width: 1.5, endMembers: "none", maxGap: 4, maxCenters: 5 })!.centers).toBeLessThanOrEqual(5);
		expect(minimumBalusters(100, 4, "both", 20)).toBe(5);
		expect(minimumBalusters(100, 4, "one", 21)).toBe(4);
	});

	it("solves a raked rail on the horizontal and reports the rake factor", () => {
		const level = balusterRun({ length: 100, width: 1.5, endMembers: "none", maxGap: 4 })!;
		const raked = balusterRun({ length: 100, width: 1.5, endMembers: "none", maxGap: 4, rakeAngle: 60 })!;
		expect(raked.horizontalLength).toBeCloseTo(50, 9);
		expect(raked.count).toBeLessThan(level.count);
		expect(raked.rakeFactor).toBeCloseTo(2, 9);
	});

	it("rejects nonsense", () => {
		expect(balusterRun({ length: 10, width: 12, endMembers: "none", maxGap: 4 })).toBeNull();
	});
});

describe("panelGap", () => {
	it("keeps every interior gap at the target and puts the remainder at the ends", () => {
		const p = panelGap({ length: 40, width: 1.5, gap: 3.75 })!;
		// 7 balusters: 7*1.5 + 6*3.75 = 33; 7" left → 3.5" each end
		expect(p.count).toBe(7);
		expect(p.endGap).toBeCloseTo(3.5, 9);
		expect(p.members[1].near - p.members[0].far).toBeCloseTo(3.75, 9);
		expect(p.members[6].far + p.endGap).toBeCloseTo(40, 9);
		expect(p.equalOptions.map((o) => o.count)).toEqual([5, 6, 7, 8, 9]);
		expect(p.equalOptions.find((o) => o.count === 7)!.gap).toBeCloseTo((40 - 10.5) / 8, 9);
	});

	it("keeps the end gaps at or under the matching gap", () => {
		const p = panelGap({ length: 33, width: 1.5, gap: 3.75 })!;
		expect(p.count).toBe(6);
		expect(p.endGap).toBeCloseTo(2.625, 9);
		// wide members, tiny gap: never a negative end gap
		const q = panelGap({ length: 20, width: 5, gap: 0.5 })!;
		expect(q.endGap).toBeGreaterThanOrEqual(0);
		// absurd input never builds a giant layout
		expect(panelGap({ length: 1e6, width: 0.01, gap: 0 })).toBeNull();
	});
});

describe("stairBalusters", () => {
	it("spaces balusters evenly along the run and continues across treads", () => {
		const s = stairBalusters({ run: 10, nosing: 1, width: 1.25, perTread: 2, rise: 7.5, treads: 3 })!;
		expect(s.centers).toBe(5);
		expect(s.gap).toBe(3.75);
		expect(s.fromRiser).toEqual([2.5, 7.5]);
		expect(s.fromNosing).toEqual([8.5, 3.5]);
		expect(s.lengthStep).toBeCloseTo(3.75, 9);
		expect(s.running.map((r) => r.position)).toEqual([2.5, 7.5, 12.5, 17.5, 22.5, 27.5]);
		expect(s.running[2]).toEqual({ tread: 2, baluster: 1, position: 12.5 });
	});

	it("rejects more baluster than tread", () => {
		expect(stairBalusters({ run: 10, nosing: 1, width: 4, perTread: 3, rise: 7, treads: 1 })).toBeNull();
	});
});
