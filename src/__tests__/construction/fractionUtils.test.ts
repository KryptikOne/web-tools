import { describe, it, expect } from "vitest";
import {
	CONVERT_OPTIONS,
	convertOption,
	evaluateInchExpression,
	formatAtConverterPrecision,
	formatConverted,
	formatDecimal,
	fractionTable,
	fractionText,
} from "@/lib/construction/fractionUtils";

describe("fractionTable", () => {
	it("lists every step up to the whole inch, reduced", () => {
		const eighths = fractionTable(8);
		expect(eighths).toHaveLength(8);
		expect(eighths[0]).toEqual({ label: "1/8", inches: 0.125 });
		expect(eighths[1].label).toBe("1/4");
		expect(eighths[7]).toEqual({ label: "1", inches: 1 });
		expect(fractionTable(64)).toHaveLength(64);
		expect(fractionTable(64)[31].label).toBe("1/2");
	});
});

describe("fractionText", () => {
	it("formats whole, proper and mixed fractions", () => {
		expect(fractionText(0.5, 16)).toBe("1/2");
		expect(fractionText(1.5, 16)).toBe("1 1/2");
		expect(fractionText(2, 16)).toBe("2");
		expect(fractionText(1 / 128, 128)).toBe("1/128");
	});
});

describe("formatDecimal / formatConverted", () => {
	it("applies pad and leading-zero rules", () => {
		expect(formatDecimal(0.5, 2)).toBe("0.5");
		expect(formatDecimal(0.5, 2, { padZeros: true })).toBe("0.50");
		expect(formatDecimal(0.5, 2, { leadingZero: false })).toBe(".5");
		expect(formatDecimal(0.5, 2, { leadingZero: false, padZeros: true })).toBe(".50");
		expect(formatDecimal(1, 3)).toBe("1");
		expect(formatDecimal(0, 2)).toBe("0");
	});

	it("converts to decimal inches or mm at the option's places", () => {
		expect(formatConverted(0.125, convertOption("dec-2"))).toBe("0.13");
		expect(formatConverted(0.125, convertOption("dec-3"))).toBe("0.125");
		expect(formatConverted(0.5, convertOption("mm-2"))).toBe("12.7");
		expect(formatConverted(0.5, convertOption("mm-2"), { padZeros: true })).toBe("12.70");
		expect(formatConverted(1 / 64, convertOption("mm-3"))).toBe("0.397");
		expect(convertOption("nope")).toBe(CONVERT_OPTIONS[1]);
	});
});

describe("formatAtConverterPrecision", () => {
	it("formats as a fraction or at decimal places", () => {
		expect(formatAtConverterPrecision(3.625, "16")).toBe('3 5/8"');
		expect(formatAtConverterPrecision(3.6, "8")).toBe('3 5/8"');
		expect(formatAtConverterPrecision(3.625, "0.01")).toBe('3.63"');
		expect(formatAtConverterPrecision(3.625, "0.1")).toBe('3.6"');
		expect(formatAtConverterPrecision(3.625, "0.001")).toBe('3.625"');
	});
});

describe("evaluateInchExpression", () => {
	it("adds, subtracts, multiplies and divides inch values with precedence", () => {
		expect(evaluateInchExpression("3 1/2 + 1/8")).toBe(3.625);
		expect(evaluateInchExpression("3 − 1/2")).toBe(2.5);
		expect(evaluateInchExpression("3 - 1/2")).toBe(2.5);
		expect(evaluateInchExpression("3-1/2")).toBe(3.5);
		expect(evaluateInchExpression("2 + 3 × 4")).toBe(14);
		expect(evaluateInchExpression("2 + 3 * 4")).toBe(14);
		expect(evaluateInchExpression(`1' 2" × 2`)).toBe(28);
		expect(evaluateInchExpression("6 ÷ 4")).toBe(1.5);
	});

	it("returns null for empty, unreadable or divide-by-zero input", () => {
		expect(evaluateInchExpression("")).toBeNull();
		expect(evaluateInchExpression("abc")).toBeNull();
		expect(evaluateInchExpression("6 ÷ 0")).toBeNull();
		expect(evaluateInchExpression("3 +")).toBeNull();
	});
});
