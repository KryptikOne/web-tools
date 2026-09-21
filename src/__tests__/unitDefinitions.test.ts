import { describe, it, expect } from "vitest";
import { UNIT_CATEGORIES, convertUnits, getUnitCategory, formatUnitValue } from "@/lib/unitDefinitions";

describe("unitDefinitions", () => {
	it("every category has a base unit that converts 1:1", () => {
		for (const c of UNIT_CATEGORIES) {
			const base = c.units.find((u) => u.id === c.baseUnitId)!;
			expect(base.toBase(1, c.variants?.[0].id)).toBe(1);
			expect(new Set(c.units.map((u) => u.id)).size).toBe(c.units.length);
		}
	});

	it("converts common values", () => {
		expect(convertUnits(getUnitCategory("length")!, 1, "mi", "km")).toBeCloseTo(1.609344, 5);
		expect(convertUnits(getUnitCategory("temperature")!, 100, "c", "f")).toBe(212);
		expect(convertUnits(getUnitCategory("data")!, 1, "kb", "b", "binary")).toBe(1024);
		expect(convertUnits(getUnitCategory("data")!, 1, "kb", "b", "decimal")).toBe(1000);
		expect(convertUnits(getUnitCategory("fuel")!, 10, "l100km", "kml")).toBe(10);
	});

	it("formats values compactly", () => {
		expect(formatUnitValue(0)).toBe("0");
		expect(formatUnitValue(1.5)).toBe("1.5");
		expect(formatUnitValue(1609.344)).toBe("1609.34");
		expect(formatUnitValue(0.00001)).toBe("1.000e-5");
	});
});
