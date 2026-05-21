/**
 * Base32 encoding: RFC 4648 (used by OTP/TOTP secrets) and
 * Crockford's base32 (used by ULID).
 */

const RFC4648_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const CROCKFORD_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

function encodeBase32(bytes: Uint8Array, alphabet: string, pad: boolean): string {
	let bits = 0;
	let value = 0;
	let output = "";
	for (let i = 0; i < bytes.length; i++) {
		value = (value << 8) | bytes[i];
		bits += 8;
		while (bits >= 5) {
			output += alphabet[(value >>> (bits - 5)) & 0x1f];
			bits -= 5;
		}
	}
	if (bits > 0) {
		output += alphabet[(value << (5 - bits)) & 0x1f];
	}
	if (pad) {
		while (output.length % 8 !== 0) output += "=";
	}
	return output;
}

function decodeBase32(input: string, alphabet: string): Uint8Array {
	const cleaned = input.replace(/=+$/, "").toUpperCase();
	const lookup: Record<string, number> = {};
	for (let i = 0; i < alphabet.length; i++) lookup[alphabet[i]] = i;

	let bits = 0;
	let value = 0;
	const out: number[] = [];
	for (const ch of cleaned) {
		const v = lookup[ch];
		if (v === undefined) throw new Error(`Invalid base32 character: ${ch}`);
		value = (value << 5) | v;
		bits += 5;
		if (bits >= 8) {
			out.push((value >>> (bits - 8)) & 0xff);
			bits -= 8;
		}
	}
	return new Uint8Array(out);
}

export function encodeBase32Rfc4648(bytes: Uint8Array, pad: boolean = false): string {
	return encodeBase32(bytes, RFC4648_ALPHABET, pad);
}

export function decodeBase32Rfc4648(input: string): Uint8Array {
	return decodeBase32(input, RFC4648_ALPHABET);
}

export function encodeBase32Crockford(bytes: Uint8Array): string {
	return encodeBase32(bytes, CROCKFORD_ALPHABET, false);
}

export function decodeBase32Crockford(input: string): Uint8Array {
	// Crockford allows I→1, L→1, O→0 substitutions
	const normalized = input
		.toUpperCase()
		.replace(/I|L/g, "1")
		.replace(/O/g, "0")
		.replace(/-/g, "");
	return decodeBase32(normalized, CROCKFORD_ALPHABET);
}
