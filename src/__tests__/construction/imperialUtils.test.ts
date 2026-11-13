import { describe, it, expect } from "vitest";
import { parseDimension, formatLength, roundToPrecision, toFraction, LUMBER_SIZES, nominalToActual, mmToInches, inchesToMm } from "@/lib/construction/imperialUtils";

describe("parseDimension", () => {
	it.each([
		["10' 3 1/2\"", 123.5],
		["10 ft 3 in", 123],
		["120 3/4", 120.75],
		["120 3 4", 120.75],
		["1~1/2", 1.5],
		["3-1/2", 3.5],
		["1/2", 0.5],
		[".75", 0.75],
		["10'", 120],
		["3\"", 3],
		["6' 0\"", 72],
		["10' 3-1/2\"", 123.5],
		["10'3\"", 123],
	])("ft-in: %s -> %d", (text, inches) => {
		expect(parseDimension(text, "ft-in")).toBeCloseTo(inches, 6);
	});

	it("ft-in mode reads two bare numbers as feet and inches", () => {
		expect(parseDimension("5 10", "ft-in")).toBe(70);
		expect(parseDimension("5 0", "ft-in")).toBe(60);
		expect(parseDimension("4 10 1/2", "ft-in")).toBe(58.5);
		// A whole + numerator + denominator triple still reads as inches
		expect(parseDimension("120 3 4", "ft-in")).toBe(120.75);
		expect(parseDimension("5 10", "in")).toBeNull();
	});

	it("in mode treats bare numbers as inches", () => {
		expect(parseDimension("48", "in")).toBe(48);
		expect(parseDimension("48 1/2", "in")).toBe(48.5);
	});

	it("mm mode converts to inches", () => {
		expect(parseDimension("254", "mm")).toBeCloseTo(10, 9);
		expect(parseDimension("25.4mm", "mm")).toBeCloseTo(1, 9);
	});

	it("rejects garbage and empty", () => {
		expect(parseDimension("", "in")).toBeNull();
		expect(parseDimension("   ", "in")).toBeNull();
		expect(parseDimension("abc", "in")).toBeNull();
		expect(parseDimension("1/0", "in")).toBeNull();
		expect(parseDimension("1 2 3 4", "in")).toBeNull();
	});
});

describe("rounding and fractions", () => {
	it("rounds to the nearest fraction", () => {
		expect(roundToPrecision(1.3, 8)).toBe(1.25);
		expect(roundToPrecision(1.3, 16)).toBe(1.3125);
		expect(roundToPrecision(1.3, 0)).toBe(1.3);
	});

	it("reduces and carries", () => {
		expect(toFraction(0.5, 64)).toEqual({ whole: 0, numerator: 1, denominator: 2, negative: false });
		expect(toFraction(15.984375, 8)).toEqual({ whole: 16, numerator: 0, denominator: 1, negative: false });
		expect(toFraction(-1.5, 8)).toEqual({ whole: 1, numerator: 1, denominator: 2, negative: true });
	});
});

describe("formatLength", () => {
	it("ft-in with fraction", () => expect(formatLength(123.5, { mode: "ft-in", precision: 16 })).toBe("10' 3 1/2\""));
	it("omits zero feet", () => expect(formatLength(11.875, { mode: "ft-in", precision: 8 })).toBe("11 7/8\""));
	it("whole feet", () => expect(formatLength(120, { mode: "ft-in", precision: 8 })).toBe("10' 0\""));
	it("carries rounding", () => expect(formatLength(15.984375, { mode: "in", precision: 8 })).toBe("16\""));
	it("reduces fractions", () => expect(formatLength(0.5, { mode: "in", precision: 64 })).toBe("1/2\""));
	it("decimal", () => {
		expect(formatLength(123.5, { mode: "in", precision: 0 })).toBe("123.5\"");
		expect(formatLength(1 / 3, { mode: "in", precision: 0 })).toBe("0.333\"");
	});
	it("mm", () => {
		expect(formatLength(10, { mode: "mm", precision: 16 })).toBe("254 mm");
		expect(formatLength(123.5, { mode: "mm", precision: 16 })).toBe("3136.9 mm");
	});
	it("no marks", () => expect(formatLength(123.5, { mode: "ft-in", precision: 16, marks: false })).toBe("10 3 1/2"));
	it("zero", () => expect(formatLength(0, { mode: "ft-in", precision: 16 })).toBe("0\""));
	it("negative", () => expect(formatLength(-2.5, { mode: "in", precision: 16 })).toBe("-2 1/2\""));
});

describe("lumber", () => {
	it("has 17 sizes and 2x4 is 1.5 x 3.5", () => {
		expect(LUMBER_SIZES).toHaveLength(17);
		expect(nominalToActual("2x4")).toEqual({ nominal: "2x4", width: 1.5, depth: 3.5 });
		expect(nominalToActual("2 x 4")).toEqual({ nominal: "2x4", width: 1.5, depth: 3.5 });
		expect(nominalToActual("9x9")).toBeUndefined();
	});

	it("mm helpers", () => {
		expect(mmToInches(25.4)).toBe(1);
		expect(inchesToMm(1)).toBe(25.4);
	});
});
