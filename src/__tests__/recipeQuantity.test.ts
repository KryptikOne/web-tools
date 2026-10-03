import { describe, it, expect } from "vitest";
import { parseQuantity, scaleQuantity, formatQuantity, sumQuantities } from "@/lib/recipeUtils";

const fmt = (raw: string, factor = 1, mode: "written" | "metric" | "imperial" = "written") =>
	formatQuantity(scaleQuantity(parseQuantity(raw), factor), mode);

describe("parseQuantity", () => {
	it("parses numbers, fractions, ranges and units", () => {
		expect(parseQuantity("200 g")).toMatchObject({ value: 200, unit: "g", kind: "mass" });
		expect(parseQuantity("1/4 cup")).toMatchObject({ value: 0.25, unit: "cup", kind: "volume" });
		expect(parseQuantity("1½ tbsp")).toMatchObject({ value: 1.5, unit: "tbsp", kind: "volume" });
		expect(parseQuantity("1 1/2 cups")).toMatchObject({ value: 1.5, unit: "cup" });
		expect(parseQuantity("2-3 cloves")).toMatchObject({ value: [2, 3], unit: "cloves", kind: "count" });
		expect(parseQuantity("2")).toMatchObject({ value: 2, unit: null, kind: "count" });
		expect(parseQuantity("a pinch")).toMatchObject({ value: null, kind: "text", raw: "a pinch" });
		expect(parseQuantity("3 fl oz")).toMatchObject({ value: 3, unit: "floz", kind: "volume" });
	});
});

describe("scaling and formatting", () => {
	it("scales with kitchen rounding", () => {
		expect(fmt("2 cloves", 1.5)).toBe("3 cloves");
		expect(fmt("1/4 cup", 2)).toBe("½ cup");
		expect(fmt("200 g", 1.5)).toBe("300 g");
		expect(fmt("33 g", 1.5)).toBe("50 g");
		expect(fmt("1 clove", 1.25)).toBe("1.5 cloves");
		expect(fmt("1 pinch", 2)).toBe("2 pinches");
		expect(fmt("2-3 cloves", 2)).toBe("4–6 cloves");
		expect(fmt("a pinch", 3)).toBe("a pinch");
		expect(fmt("1 tsp", 3)).toBe("3 tsp");
	});

	it("converts between metric and imperial", () => {
		expect(fmt("200 g", 1, "imperial")).toBe("7.1 oz");
		expect(fmt("1 cup", 1, "metric")).toBe("237 ml");
		expect(fmt("2 tbsp", 1, "metric")).toBe("30 ml");
		expect(fmt("500 ml", 1, "imperial")).toBe("2 cups");
		expect(fmt("1 kg", 1, "imperial")).toBe("2.2 lb");
		expect(fmt("1200 g", 1, "metric")).toBe("1.2 kg");
		expect(fmt("2 cloves", 1, "metric")).toBe("2 cloves");
		expect(fmt("1 tsp", 1, "imperial")).toBe("1 tsp");
	});
});

describe("sumQuantities", () => {
	it("merges compatible quantities and keeps others separate", () => {
		const merged = sumQuantities([parseQuantity("2 tbsp"), parseQuantity("1 tbsp")]);
		expect(merged).toHaveLength(1);
		expect(formatQuantity(merged[0], "written")).toBe("3 tbsp");
		const mixed = sumQuantities([parseQuantity("2 tbsp"), parseQuantity("30 g")]);
		expect(mixed).toHaveLength(2);
		const counts = sumQuantities([parseQuantity("2 cloves"), parseQuantity("1 clove")]);
		expect(formatQuantity(counts[0], "written")).toBe("3 cloves");
	});
});
