import { describe, it, expect } from "vitest";
import { hipRoof, type HipRoofInput } from "@/lib/construction/hipRoofUtils";
import { angleFromPitch } from "@/lib/construction/rafterUtils";

const base: HipRoofInput = {
	buildingWidth: 288,
	buildingLength: 480,
	angle: angleFromPitch(8),
	overhang: 18,
	commonDepth: 7.25,
	commonThickness: 1.5,
	hipDepth: 9.25,
	hipThickness: 1.5,
	ridgeThickness: 1.5,
	seat: 3.5,
	wallThickness: 3.5,
	wallHeight: 96,
	centers: 16,
	sheetWidth: 48,
	sheetLength: 96,
	costPer1000Bft: 800,
};

describe("hipRoof", () => {
	it("matches the framing-square reference for an 8:12 roof on a 24' x 40' building", () => {
		const h = hipRoof(base)!;
		expect(h.run).toBe(144);
		expect(h.rise).toBeCloseTo(96, 9);
		expect(h.hipRun).toBeCloseTo(203.647, 2);
		expect(h.hipAngle).toBeCloseTo(25.239, 2);
		expect(h.hipPitchPer17).toBeCloseTo(8, 9);
		expect(h.hip.lineLength).toBeCloseTo(225.14, 1);
		expect(h.jackDiminish).toBeCloseTo(19.23, 2);
		expect(h.jacks.length).toBe(8);
		expect(h.jacks[0].run).toBe(16);
		expect(h.jacks[0].length).toBeCloseTo(19.23, 2);
		expect(h.jacks[7].length).toBeCloseTo(8 * 19.23, 1);
		expect(h.jackCheekAngle).toBeCloseTo(Math.atan(Math.cos(Math.atan(8 / 12))) * (180 / Math.PI), 6);
		expect(h.jackCheekAngle).toBeCloseTo(39.76, 1);
		expect(h.hipCheekAngle).toBeCloseTo(Math.atan(16.97 / Math.hypot(16.97, 8)) * (180 / Math.PI), 6);
		expect(h.hipDrop).toBeCloseTo(0.75 * Math.tan((25.239 * Math.PI) / 180), 3);
		expect(h.backingAngle).toBeCloseTo(Math.atan(Math.sin((25.239 * Math.PI) / 180)) * (180 / Math.PI), 2);
		expect(h.ridgeLength).toBe(192);
		expect(h.ridgeBoardLength).toBe(193.5);
		expect(h.commonsPerSide).toBe(13);
		expect(h.totalCommons).toBe(28);
		expect(h.totalJacks).toBe(64);
		expect(h.sideRafterPositions[0]).toBe(16);
		expect(h.sideRafterPositions[8]).toBe(144);
		expect(h.sideRafterPositions[h.sideRafterPositions.length - 1]).toBe(464);
		expect(h.roofArea / 144).toBeCloseTo((516 * 324) / 144 / Math.cos(Math.atan(8 / 12)), 1);
		expect(h.endFaceArea * 2 + h.sideFaceArea * 2).toBeCloseTo(h.roofArea, 6);
		expect(h.hipCapLength).toBeCloseTo(4 * h.hip.overallLength, 9);
		expect(h.lumber.map((l) => l.item)).toEqual(["Common rafters", "Hip rafters", "Jack rafters"]);
		expect(h.lumber[0].pieces).toBe(28);
		expect(h.totalBoardFeet).toBeGreaterThan(0);
		expect(h.totalCost).toBeCloseTo(h.totalBoardFeet * 0.8, 6);
	});

	it("keeps the hip's top edge on the roof planes", () => {
		const h = hipRoof(base)!;
		// hip HAP plus the drop equals the common HAP
		expect(h.hip.hap + h.hipDrop).toBeCloseTo(h.common.hap, 6);
		expect(h.warnings).toEqual([]);
	});

	it("warns on a hip that is too shallow and rejects a building longer than wide the wrong way", () => {
		expect(hipRoof({ ...base, hipDepth: 5.5 })!.warnings.some((w) => /top edge will sit below/.test(w))).toBe(true);
		expect(hipRoof({ ...base, buildingLength: 200 })).toBeNull();
	});
});
