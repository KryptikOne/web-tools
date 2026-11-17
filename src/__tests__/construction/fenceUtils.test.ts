import { describe, it, expect } from "vitest";
import { postAndRail, postAndPanel, archedPalings, glassBalustrade } from "@/lib/construction/fenceUtils";

describe("postAndRail", () => {
	const base = { length: 288, postWidth: 3.5, maxCenters: 96, rails: 3, palingWidth: 3.5, palingGap: 0.5, height: 72, postAboveGround: 72, holeDepth: 24, holeDiameter: 10, bagWeightLb: 80, pricePerPost: 12, pricePerRail: 8, pricePerPaling: 2, pricePerBag: 6 };

	it("spaces four posts evenly over 24 feet and runs palings across", () => {
		const f = postAndRail(base)!;
		expect(f.bays).toBe(3);
		expect(f.postCount).toBe(4);
		expect(f.postCenters).toBeCloseTo((288 - 3.5) / 3, 6);
		expect(f.railCount).toBe(9);
		expect(f.railLength).toBeCloseTo(f.postCenters, 9);
		expect(f.palingCount).toBe(72);
		expect(f.palings.members[0].near).toBe(0);
		expect(f.palings.members[71].far).toBeCloseTo(288, 6);
		expect(f.postLength).toBe(96);
		expect(f.concretePerHole).toBeCloseTo((Math.PI * 25 * 24) / 1728, 6);
		expect(f.bags).toBe(Math.ceil((f.concreteTotal / 80) * 133.3));
		expect(f.cost.total).toBeCloseTo(4 * 12 + 9 * 8 + 72 * 2 + f.bags * 6, 6);
	});

	it("rejects a run shorter than a post", () => {
		expect(postAndRail({ ...base, length: 3 })).toBeNull();
	});
});

describe("postAndPanel", () => {
	it("fits whole panels and cuts the last", () => {
		const f = postAndPanel({ length: 300, panelWidth: 72, postWidth: 3.5, adjust: "last" })!;
		expect(f.wholePanels).toBe(3);
		expect(f.cutPanels).toEqual([66.5]);
		expect(f.postCount).toBe(5);
		expect(f.postPositions[f.postPositions.length - 1]).toBeCloseTo(296.5, 9);
		expect(f.panelCount).toBe(4);
	});

	it("splits the odd panel between both ends and reports an exact fit", () => {
		const f = postAndPanel({ length: 300, panelWidth: 72, postWidth: 3.5, adjust: "both" })!;
		expect(f.cutPanels.length).toBe(2);
		expect(f.cutPanels[0]).toBeCloseTo((300 - 3.5 - 3 * 75.5 - 7) / 2, 9);
		expect(f.postCount).toBe(6);
		const exact = postAndPanel({ length: 3.5 + 3 * 75.5, panelWidth: 72, postWidth: 3.5, adjust: "last" })!;
		expect(exact.cutPanels).toEqual([]);
		expect(exact.postCount).toBe(4);
	});
});

describe("archedPalings", () => {
	it("scallops a 6 foot bay by 6 inches", () => {
		const a = archedPalings({ bayWidth: 72, palingWidth: 3.5, gap: 0.5, rise: 6, shape: "concave", heightAtPosts: 60 })!;
		expect(a.radius).toBeCloseTo(111, 6);
		expect(a.count).toBe(17);
		expect(a.heightAtCenter).toBeCloseTo(54, 9);
		const mid = a.palings[8];
		expect(mid.heightCenter).toBeCloseTo(54, 3);
		expect(mid.heightCenter).toBeLessThan(a.palings[0].heightCenter);
		expect(a.palings[0].long).toBeCloseTo(a.palings[16].long, 6);
		expect(a.cuttingList.reduce((s, g) => s + g.count, 0)).toBe(17);
		expect(a.cuttingList[0].length).toBeGreaterThan(a.cuttingList[a.cuttingList.length - 1].length);
	});

	it("arches upward for convex and refuses an impossible rise", () => {
		const a = archedPalings({ bayWidth: 72, palingWidth: 3.5, gap: 0.5, rise: 6, shape: "convex", heightAtPosts: 60 })!;
		expect(a.heightAtCenter).toBeCloseTo(66, 9);
		expect(archedPalings({ bayWidth: 72, palingWidth: 3.5, gap: 0.5, rise: 40, shape: "convex", heightAtPosts: 60 })).toBeNull();
	});
});

describe("glassBalustrade", () => {
	it("splits a 20 foot run into equal panels on spigots", () => {
		const g = glassBalustrade({ length: 240, maxPanelWidth: 48, gap: 1, support: "spigots", postWidth: 0, glassHeight: 42, spigotsPerPanel: 2, spigotInset: 8 })!;
		expect(g.panelCount).toBe(5);
		expect(g.panelWidth).toBeCloseTo(47.2, 9);
		expect(g.panels[4].far).toBeCloseTo(240, 9);
		expect(g.spigotCount).toBe(10);
		expect(g.spigotPositions[0]).toBeCloseTo(8, 9);
		expect(g.spigotPositions[1]).toBeCloseTo(47.2 - 8, 9);
		expect(g.glassArea / 144).toBeCloseTo((5 * 47.2 * 42) / 144, 6);
	});

	it("puts posts between panels", () => {
		const g = glassBalustrade({ length: 240, maxPanelWidth: 48, gap: 0.5, support: "posts", postWidth: 2, glassHeight: 42, spigotsPerPanel: 0, spigotInset: 0 })!;
		expect(g.panelCount).toBe(5);
		expect(g.postPositions.length).toBe(6);
		expect(g.panelWidth).toBeCloseTo((240 - 12 - 5) / 5, 9);
		expect(g.panels[0].near).toBeCloseTo(2.5, 9);
		expect(g.postPositions[5]).toBeCloseTo(238, 9);
	});
});
