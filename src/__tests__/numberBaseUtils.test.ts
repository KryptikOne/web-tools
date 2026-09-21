import { describe, it, expect } from "vitest";
import { convertNumber, isValidForBase, getBitRepresentation, bitwise, toggleBit, stripBasePrefix, parseBigInt, groupString } from "@/lib/numberBaseUtils";

describe("numberBaseUtils", () => {
	it("converts across bases with sign and fraction", () => {
		expect(convertNumber("255", 10, 16)).toBe("FF");
		expect(convertNumber("-FF", 16, 2)).toBe("-11111111");
		expect(convertNumber("10.5", 10, 2)).toBe("1010.1");
		expect(convertNumber("", 10, 2)).toBe("");
	});

	it("handles big integers", () => {
		expect(convertNumber("18446744073709551616", 10, 16)).toBe("10000000000000000");
	});

	it("validates digits per base and strips prefixes", () => {
		expect(isValidForBase("1F", 16)).toBe(true);
		expect(isValidForBase("1F", 10)).toBe(false);
		expect(stripBasePrefix("0xFF")).toEqual({ digits: "FF", base: 16 });
		expect(stripBasePrefix("-0b101")).toEqual({ digits: "-101", base: 2 });
		expect(parseBigInt("-1010", 2)).toBe(-BigInt(10));
	});

	it("produces two's complement", () => {
		expect(getBitRepresentation("-1", 8)).toBe("11111111");
		expect(getBitRepresentation("300", 8)).toMatch(/Out of range/);
	});

	it("does bitwise math within a width", () => {
		expect(bitwise("and", BigInt(0b1100), BigInt(0b1010), 8)).toBe(BigInt(0b1000));
		expect(bitwise("not", BigInt(0), BigInt(0), 8)).toBe(BigInt(255));
		expect(bitwise("shl", BigInt(1), BigInt(9), 8)).toBe(BigInt(0));
		expect(toggleBit(BigInt(0), 3)).toBe(BigInt(8));
		expect(groupString("11111111", 4)).toBe("1111 1111");
	});
});
