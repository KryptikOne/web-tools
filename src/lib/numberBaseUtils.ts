/** Number base conversion helpers (bases 2–36, signs, fractions, two's complement, bitwise ops). */

export const BASE_DIGITS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export function groupString(str: string, groupSize: number, separator = " "): string {
	if (!str) return str;
	const groups: string[] = [];
	let i = str.length;
	while (i > 0) {
		const start = Math.max(0, i - groupSize);
		groups.unshift(str.slice(start, i));
		i = start;
	}
	return groups.join(separator);
}

/** Strip a 0x / 0b / 0o prefix, returning the bare digits and the base it implies (if any). */
export function stripBasePrefix(input: string): { digits: string; base?: number } {
	const m = /^(-?)0([xXbBoO])(.*)$/.test(input) ? input.match(/^(-?)0([xXbBoO])(.*)$/) : null;
	if (!m) return { digits: input };
	const base = { x: 16, b: 2, o: 8 }[m[2].toLowerCase() as "x" | "b" | "o"];
	return { digits: m[1] + m[3], base };
}

export function isValidForBase(input: string, base: number): boolean {
	if (!input || input === "-" || input === "-.") return true;
	const unsigned = input.startsWith("-") ? input.slice(1) : input;
	const validChars = BASE_DIGITS.slice(0, base);
	const regex = new RegExp(`^[${validChars}]+(\\.[${validChars}]*)?$`, "i");
	return regex.test(unsigned);
}

/** Parse an integer string in the given base to a BigInt (supports a leading minus). */
export function parseBigInt(digits: string, base: number): bigint {
	const isNegative = digits.startsWith("-");
	const unsigned = (isNegative ? digits.slice(1) : digits).toUpperCase();
	let value = BigInt(0);
	const big = BigInt(base);
	for (const ch of unsigned) {
		const d = BASE_DIGITS.indexOf(ch);
		if (d < 0 || d >= base) throw new Error(`Invalid digit "${ch}" for base ${base}`);
		value = value * big + BigInt(d);
	}
	return isNegative ? -value : value;
}

export function bigIntToBase(value: bigint, base: number): string {
	if (value === BigInt(0)) return "0";
	const isNegative = value < BigInt(0);
	let abs = isNegative ? -value : value;
	const big = BigInt(base);
	let result = "";
	while (abs > BigInt(0)) {
		result = BASE_DIGITS[Number(abs % big)] + result;
		abs = abs / big;
	}
	return isNegative ? "-" + result : result;
}

function convertFractionalPart(fraction: string, fromBase: number, toBase: number, precision = 20): string {
	let decimalFraction = 0;
	for (let i = 0; i < fraction.length; i++) {
		const digitValue = parseInt(fraction[i], fromBase);
		if (isNaN(digitValue)) return "";
		decimalFraction += digitValue / Math.pow(fromBase, i + 1);
	}
	if (decimalFraction === 0) return "0";
	let result = "";
	let value = decimalFraction;
	for (let i = 0; i < precision && value > 0; i++) {
		value *= toBase;
		const digit = Math.floor(value);
		result += BASE_DIGITS[digit];
		value -= digit;
	}
	return result.replace(/0+$/, "") || "0";
}

/** Convert a number string (sign and fraction allowed) between bases. Returns "" for empty input. */
export function convertNumber(input: string, fromBase: number, toBase: number): string {
	if (!input || input === "-") return "";
	const isNegative = input.startsWith("-");
	const unsigned = isNegative ? input.slice(1) : input;
	const [integerPart = "0", fractionalPart] = unsigned.split(".");
	let result = bigIntToBase(parseBigInt((isNegative ? "-" : "") + (integerPart || "0"), fromBase), toBase);
	if (fractionalPart) {
		result += "." + convertFractionalPart(fractionalPart, fromBase, toBase);
	}
	return result;
}

/** Two's-complement bit string for an integer at a given width, or a message when it does not fit. */
export function getBitRepresentation(decimalStr: string, bits: number): string {
	if (!decimalStr || decimalStr.includes(".")) return "N/A (integer only)";
	let num: bigint;
	try {
		num = BigInt(decimalStr);
	} catch {
		return "N/A";
	}
	const max = (BigInt(1) << BigInt(bits - 1)) - BigInt(1);
	const min = -(BigInt(1) << BigInt(bits - 1));
	if (num > max || num < min) return `Out of range (${min} to ${max})`;
	const unsigned = num >= BigInt(0) ? num : (BigInt(1) << BigInt(bits)) + num;
	return unsigned.toString(2).padStart(bits, "0");
}

export type BitwiseOp = "and" | "or" | "xor" | "not" | "shl" | "shr";

export const BITWISE_OPS: { id: BitwiseOp; symbol: string; label: string; description: string; unary?: boolean }[] = [
	{ id: "and", symbol: "&", label: "AND", description: "1 if both bits are 1" },
	{ id: "or", symbol: "|", label: "OR", description: "1 if either bit is 1" },
	{ id: "xor", symbol: "^", label: "XOR", description: "1 if the bits differ" },
	{ id: "not", symbol: "~", label: "NOT", description: "Flip every bit (within the chosen width)", unary: true },
	{ id: "shl", symbol: "<<", label: "Shift left", description: "Shift bits left by B places" },
	{ id: "shr", symbol: ">>", label: "Shift right", description: "Shift bits right by B places" },
];

/** Apply a bitwise operation on non-negative integers, masked to `bits` width. */
export function bitwise(op: BitwiseOp, a: bigint, b: bigint, bits: number): bigint {
	const mask = (BigInt(1) << BigInt(bits)) - BigInt(1);
	switch (op) {
		case "and":
			return (a & b) & mask;
		case "or":
			return (a | b) & mask;
		case "xor":
			return (a ^ b) & mask;
		case "not":
			return ~a & mask;
		case "shl":
			return (a << b) & mask;
		case "shr":
			return (a >> b) & mask;
	}
}

/** Flip one bit (0 = least significant) of a non-negative integer. */
export function toggleBit(value: bigint, bit: number): bigint {
	return value ^ (BigInt(1) << BigInt(bit));
}

export function isBitSet(value: bigint, bit: number): boolean {
	return ((value >> BigInt(bit)) & BigInt(1)) === BigInt(1);
}
