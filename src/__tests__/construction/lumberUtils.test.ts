import { describe, it, expect } from "vitest";
import {
	boardFeet,
	cubicFeet,
	lengthForCubicFeet,
	coverageSquareFeet,
	lengthForCoverage,
	priceLumber,
	logVolumeCubicFeet,
	sectionOf,
	ALL_LUMBER_SIZES,
} from "@/lib/construction/lumberUtils";
import { nominalToActual } from "@/lib/construction/imperialUtils";

const twoByFour = sectionOf(nominalToActual("2x4")!); // 1.5 x 3.5
const oneByTwelve = { width: 12, thickness: 1 };

describe("board feet and volume", () => {
	it("a 1x12 one foot long is one board foot", () => {
		expect(boardFeet(oneByTwelve, 12)).toBeCloseTo(1, 9);
	});
	it("an 8' 2x4 is 3.5 board feet (actual size)", () => {
		expect(boardFeet(twoByFour, 96)).toBeCloseTo(3.5, 9);
	});
	it("cubic feet are board feet over twelve and invert", () => {
		expect(cubicFeet(twoByFour, 96)).toBeCloseTo(3.5 / 12, 9);
		expect(lengthForCubicFeet(twoByFour, cubicFeet(twoByFour, 96))).toBeCloseTo(96, 9);
	});
	it("returns 0 for empty or negative sections", () => {
		expect(boardFeet({ width: 0, thickness: 1 }, 12)).toBe(0);
		expect(boardFeet(twoByFour, -1)).toBe(0);
		expect(cubicFeet({ width: NaN, thickness: 1 }, 12)).toBe(0);
	});
});

describe("coverage", () => {
	it("a 5 1/2 board 12' long covers 5.5 square feet", () => {
		expect(coverageSquareFeet(5.5, 144)).toBeCloseTo(5.5, 9);
	});
	it("a gap counts toward coverage", () => {
		expect(coverageSquareFeet(5.5, 144, 0.5)).toBeCloseTo(6, 9);
	});
	it("length for an area inverts coverage and adds waste", () => {
		expect(lengthForCoverage(5.5, 5.5)).toBeCloseTo(144, 9);
		expect(lengthForCoverage(5.5, 5.5, 10)).toBeCloseTo(158.4, 9);
		expect(lengthForCoverage(5.5, 6, 0, 0.5)).toBeCloseTo(144, 9);
	});
});

describe("priceLumber", () => {
	it("prices an 8' 2x4 at $600 per 1000 bft", () => {
		const r = priceLumber({ section: twoByFour, lengthIn: 96, pieces: 10, costPer1000Bft: 600, piecesPerPack: 4 });
		expect(r.bftPerPiece).toBeCloseTo(3.5, 9);
		expect(r.totalBft).toBeCloseTo(35, 9);
		expect(r.costPerBft).toBeCloseTo(0.6, 9);
		expect(r.costPerPiece).toBeCloseTo(2.1, 9);
		expect(r.costPerLinearFoot).toBeCloseTo(0.2625, 9);
		expect(r.totalCost).toBeCloseTo(21, 9);
		expect(r.packs).toBe(3);
	});
	it("has no packs without a pack size and zero cost without a price", () => {
		const r = priceLumber({ section: twoByFour, lengthIn: 96, pieces: 10, costPer1000Bft: 0 });
		expect(r.packs).toBeNull();
		expect(r.totalCost).toBe(0);
		expect(r.totalBft).toBeCloseTo(35, 9);
	});
});

describe("logVolumeCubicFeet", () => {
	it("a 12\" diameter log 12' long is pi/4 cubic feet per foot", () => {
		expect(logVolumeCubicFeet(144, 12, "diameter")).toBeCloseTo(Math.PI * 3, 9);
	});
	it("girth equal to pi times diameter gives the same volume", () => {
		expect(logVolumeCubicFeet(144, 12 * Math.PI, "girth")).toBeCloseTo(logVolumeCubicFeet(144, 12, "diameter"), 9);
	});
});

describe("sizes", () => {
	it("includes deck boards after the standard table", () => {
		const names = ALL_LUMBER_SIZES.map((s) => s.nominal);
		expect(names).toContain("2x4");
		expect(names.slice(-2)).toEqual(["5/4x6", "6/4x6"]);
	});
});
