import { describe, it, expect } from "vitest";
import { gauge, bond } from "@/lib/construction/masonryUtils";

describe("gauge", () => {
	it("hits an 8 foot height with modular bricks by nudging the joint", () => {
		const g = gauge({ unitHeight: 2.25, bedJoint: 0.375, by: "height", targetHeight: 96, courses: 0, minJoint: 0.25, maxJoint: 0.5, openings: [{ label: "Window sill", height: 36 }] })!;
		expect(g.nominalGauge).toBeCloseTo(2.625, 9);
		expect(g.courses).toBe(37);
		expect(g.nominalHeight).toBeCloseTo(97.125, 9);
		expect(g.adjustedJoint).toBeCloseTo(96 / 37 - 2.25, 9);
		expect(g.jointInRange).toBe(true);
		expect(g.height).toBeCloseTo(96, 9);
		expect(g.courseHeights.length).toBe(37);
		expect(g.courseHeights[36]).toBeCloseTo(96, 9);
		expect(g.openings[0].course).toBe(14);
		expect(g.openings[0].snapped).toBeCloseTo((14 * 96) / 37, 9);
	});

	it("keeps the entered joint when the adjustment would be out of range", () => {
		const g = gauge({ unitHeight: 2.25, bedJoint: 0.375, by: "height", targetHeight: 98.5, courses: 0, minJoint: 0.36, maxJoint: 0.4 })!;
		expect(g.jointInRange).toBe(false);
		expect(g.height).toBeCloseTo(g.nominalHeight, 9);
		expect(g.warnings[0]).toMatch(/outside/);
		const byCourses = gauge({ unitHeight: 7.625, bedJoint: 0.375, by: "courses", targetHeight: 0, courses: 12, minJoint: 0.25, maxJoint: 0.5 })!;
		expect(byCourses.height).toBe(96);
	});
});

describe("bond", () => {
	const base = { wallLength: 120, brickLength: 7.625, brickWidth: 3.625, brickHeight: 2.25, perpJoint: 0.375, bedJoint: 0.375, pattern: "stretcher" as const, fit: "adjust-perps" as const, minJoint: 0.25, maxJoint: 0.5, courses: 10, wastePercent: 5, pricePerBrick: 0.8 };

	it("fits whole stretchers across 10 feet by adjusting the perps", () => {
		const b = bond(base)!;
		expect(b.stretchersExact).toBeCloseTo(15.047, 3);
		expect(b.adjustedPerp).toBeCloseTo((120 - 15 * 7.625) / 14, 9);
		expect(b.perpInRange).toBe(true);
		expect(b.perp).toBeCloseTo(b.adjustedPerp, 9);
		expect(b.courseA.units.length).toBe(15);
		expect(b.courseA.cut).toBe(0);
		// the offset course starts and ends with a half bat
		expect(b.courseB.cut).toBe(2);
		expect(b.courseB.units[0].length).toBeCloseTo(7.625 / 2 - b.perp / 2, 9);
		expect(b.bricksTotal).toBe(5 * 15 + 5 * 16);
		expect(b.bricksWithWaste).toBe(Math.ceil(155 * 1.05));
		expect(b.perSquareFoot).toBeCloseTo(144 / ((7.625 + b.perp) * 2.625), 6);
		expect(b.mortarCubicFeet).toBeGreaterThan(0);
		expect(b.cost).toBeCloseTo(b.bricksWithWaste * 0.8, 9);
	});

	it("cuts the ends when told to keep the perp, and lays flemish and english courses", () => {
		const cut = bond({ ...base, wallLength: 118, fit: "cut-ends" })!;
		expect(cut.perp).toBe(0.375);
		expect(cut.courseA.cut).toBe(1);
		expect(cut.courseA.units[14].length).toBeCloseTo(6, 9);
		const flemish = bond({ ...base, pattern: "flemish" })!;
		expect(flemish.courseA.units.some((u) => u.header)).toBe(true);
		expect(flemish.courseA.units.some((u) => !u.header)).toBe(true);
		const english = bond({ ...base, pattern: "english" })!;
		expect(english.courseA.units.every((u) => !u.header)).toBe(true);
		expect(english.courseB.units.filter((u) => u.header).length).toBeGreaterThan(20);
		const stack = bond({ ...base, pattern: "stack" })!;
		expect(stack.courseB.units.length).toBe(stack.courseA.units.length);
	});

	it("rejects nonsense", () => {
		expect(bond({ ...base, wallLength: 0 })).toBeNull();
		expect(bond({ ...base, wallLength: 1e6 })).toBeNull();
	});
});
