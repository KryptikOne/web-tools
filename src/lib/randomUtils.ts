/**
 * Cryptographically secure random helpers built on Web Crypto.
 * Never use Math.random for these — always crypto.getRandomValues.
 */

export function getRandomBytes(length: number): Uint8Array {
	const bytes = new Uint8Array(length);
	crypto.getRandomValues(bytes);
	return bytes;
}

/**
 * Uniform random integer in [0, max) using rejection sampling to avoid modulo bias.
 */
export function getRandomInt(max: number): number {
	if (max <= 0 || !Number.isInteger(max)) {
		throw new Error("max must be a positive integer");
	}
	if (max === 1) return 0;

	const bitsNeeded = Math.ceil(Math.log2(max));
	const bytesNeeded = Math.ceil(bitsNeeded / 8);
	const mask = (1 << bitsNeeded) - 1;

	while (true) {
		const bytes = getRandomBytes(bytesNeeded);
		let value = 0;
		for (let i = 0; i < bytesNeeded; i++) {
			value = (value << 8) | bytes[i];
		}
		value &= mask;
		if (value < max) return value;
	}
}

/**
 * Pick a single random element from an array.
 */
export function randomChoice<T>(items: readonly T[]): T {
	if (items.length === 0) throw new Error("Cannot pick from empty array");
	return items[getRandomInt(items.length)];
}

/**
 * Generate a random string from a charset.
 * Uses rejection sampling so distribution is uniform.
 */
export function randomFromCharset(length: number, charset: string): string {
	if (length < 0 || !Number.isInteger(length)) {
		throw new Error("length must be a non-negative integer");
	}
	if (!charset) throw new Error("charset cannot be empty");

	const chars = Array.from(charset);
	const result: string[] = [];
	for (let i = 0; i < length; i++) {
		result.push(chars[getRandomInt(chars.length)]);
	}
	return result.join("");
}

/**
 * Like randomFromCharset but guarantees no two adjacent characters repeat.
 */
export function randomFromCharsetNoRepeats(length: number, charset: string): string {
	const chars = Array.from(charset);
	if (chars.length < 2 && length > 1) {
		throw new Error("Need at least 2 distinct chars for no-repeats with length > 1");
	}
	const result: string[] = [];
	for (let i = 0; i < length; i++) {
		let idx = getRandomInt(chars.length);
		while (result.length > 0 && chars[idx] === result[result.length - 1]) {
			idx = getRandomInt(chars.length);
		}
		result.push(chars[idx]);
	}
	return result.join("");
}

/**
 * Shannon entropy in bits for a random string of given length over a given charset size.
 */
export function entropyBits(length: number, charsetSize: number): number {
	if (length <= 0 || charsetSize <= 1) return 0;
	return length * Math.log2(charsetSize);
}

export const CHARSETS = {
	lowercase: "abcdefghijklmnopqrstuvwxyz",
	uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
	digits: "0123456789",
	symbols: "!@#$%^&*()-_=+[]{}|;:,.<>?/~`",
	ambiguous: "Il1O0o",
} as const;
