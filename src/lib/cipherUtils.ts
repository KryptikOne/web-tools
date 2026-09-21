/** Classical cipher encode/decode, byte-encoding detection, and English-likeness scoring. */

import { MORSE_CODE } from "@/lib/morseUtils";
import { decodeFromBase64 } from "@/lib/base64Utils";
import { decodeBase32Rfc4648 } from "@/lib/base32Utils";

const A = 65;
const ALPHA_LEN = 26;

function shiftLetter(ch: string, shift: number): string {
	const code = ch.charCodeAt(0);
	if (code >= 65 && code <= 90) return String.fromCharCode(((code - 65 + shift) % 26 + 26) % 26 + 65);
	if (code >= 97 && code <= 122) return String.fromCharCode(((code - 97 + shift) % 26 + 26) % 26 + 97);
	return ch;
}

export function caesar(text: string, shift: number): string {
	return Array.from(text, (ch) => shiftLetter(ch, shift)).join("");
}

export function rot13(text: string): string {
	return caesar(text, 13);
}

export function rot47(text: string): string {
	return Array.from(text, (ch) => {
		const code = ch.charCodeAt(0);
		if (code >= 33 && code <= 126) return String.fromCharCode(33 + ((code - 33 + 47) % 94));
		return ch;
	}).join("");
}

export function atbash(text: string): string {
	return Array.from(text, (ch) => {
		const code = ch.charCodeAt(0);
		if (code >= 65 && code <= 90) return String.fromCharCode(90 - (code - 65));
		if (code >= 97 && code <= 122) return String.fromCharCode(122 - (code - 97));
		return ch;
	}).join("");
}

export function vigenere(text: string, key: string, decode = false): string {
	const k = key.toUpperCase().replace(/[^A-Z]/g, "");
	if (!k) return text;
	let i = 0;
	return Array.from(text, (ch) => {
		if (!/[A-Za-z]/.test(ch)) return ch;
		const shift = k.charCodeAt(i++ % k.length) - A;
		return shiftLetter(ch, decode ? -shift : shift);
	}).join("");
}

function modInverse(a: number, m: number): number | null {
	for (let x = 1; x < m; x++) if ((a * x) % m === 1) return x;
	return null;
}

export const AFFINE_A_VALUES = [1, 3, 5, 7, 9, 11, 15, 17, 19, 21, 23, 25];

export function affine(text: string, a: number, b: number, decode = false): string {
	const inv = modInverse(a, ALPHA_LEN);
	if (inv === null) throw new Error("a must be coprime with 26");
	return Array.from(text, (ch) => {
		const code = ch.charCodeAt(0);
		const isUpper = code >= 65 && code <= 90;
		const isLower = code >= 97 && code <= 122;
		if (!isUpper && !isLower) return ch;
		const base = isUpper ? 65 : 97;
		const x = code - base;
		const y = decode ? (((inv * (x - b)) % 26) + 26) % 26 : (a * x + b) % 26;
		return String.fromCharCode(base + y);
	}).join("");
}

export function railFence(text: string, rails: number, decode = false): string {
	if (rails < 2 || text.length < 2) return text;
	const cycle = 2 * (rails - 1);
	const pattern = Array.from(text, (_, i) => {
		const pos = i % cycle;
		return pos < rails ? pos : cycle - pos;
	});
	if (!decode) {
		const rows: string[][] = Array.from({ length: rails }, () => []);
		pattern.forEach((r, i) => rows[r].push(text[i]));
		return rows.map((r) => r.join("")).join("");
	}
	// Decode: distribute characters back into rail order
	const counts = new Array(rails).fill(0);
	pattern.forEach((r) => counts[r]++);
	const rowStarts: number[] = [];
	let acc = 0;
	for (let r = 0; r < rails; r++) {
		rowStarts.push(acc);
		acc += counts[r];
	}
	const cursors = [...rowStarts];
	return pattern.map((r) => text[cursors[r]++]).join("");
}

const MORSE_REVERSE: Record<string, string> = Object.fromEntries(
	Object.entries(MORSE_CODE).map(([k, v]) => [v, k])
);

export function morseEncode(text: string): string {
	return text
		.toUpperCase()
		.split(/\s+/)
		.filter(Boolean)
		.map((word) => Array.from(word).map((ch) => MORSE_CODE[ch] ?? "").filter(Boolean).join(" "))
		.join(" / ");
}

export function morseDecode(text: string): string {
	const normalized = text.replace(/[·•]/g, ".").replace(/[–—_]/g, "-").trim();
	return normalized
		.split(/\s*\/\s*|\s{3,}|\s*\|\s*/)
		.map((word) =>
			word
				.trim()
				.split(/\s+/)
				.filter(Boolean)
				.map((code) => MORSE_REVERSE[code] ?? "?")
				.join("")
		)
		.join(" ");
}

export function a1z26Encode(text: string): string {
	return text
		.toUpperCase()
		.split(/\s+/)
		.filter(Boolean)
		.map((word) =>
			Array.from(word)
				.filter((ch) => /[A-Z]/.test(ch))
				.map((ch) => String(ch.charCodeAt(0) - 64))
				.join("-")
		)
		.join(" ");
}

export function a1z26Decode(text: string): string {
	return text
		.trim()
		.split(/\s*\/\s*|\s+/)
		.map((word) =>
			word
				.split(/[-,.]/)
				.filter(Boolean)
				.map((n) => {
					const v = parseInt(n, 10);
					return v >= 1 && v <= 26 ? String.fromCharCode(64 + v) : "?";
				})
				.join("")
		)
		.join(" ");
}

export function baconEncode(text: string): string {
	return Array.from(text.toUpperCase())
		.filter((ch) => /[A-Z]/.test(ch))
		.map((ch) => (ch.charCodeAt(0) - 65).toString(2).padStart(5, "0").replace(/0/g, "A").replace(/1/g, "B"))
		.join(" ");
}

export function baconDecode(text: string): string {
	const bits = text.toUpperCase().replace(/[^AB]/g, "");
	let out = "";
	for (let i = 0; i + 5 <= bits.length; i += 5) {
		const n = parseInt(bits.slice(i, i + 5).replace(/A/g, "0").replace(/B/g, "1"), 2);
		out += n < 26 ? String.fromCharCode(65 + n) : "?";
	}
	return out;
}

const textDecoder = new TextDecoder();

export function decodeHex(text: string): string {
	const clean = text.replace(/0x/gi, "").replace(/[^0-9a-f]/gi, "");
	if (!clean || clean.length % 2 !== 0) throw new Error("Hex needs an even number of digits");
	const bytes = new Uint8Array(clean.length / 2);
	for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
	return textDecoder.decode(bytes);
}

export function decodeBinary(text: string): string {
	const clean = text.replace(/[^01]/g, "");
	if (!clean || clean.length % 8 !== 0) throw new Error("Binary needs whole bytes");
	const bytes = new Uint8Array(clean.length / 8);
	for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(clean.slice(i * 8, i * 8 + 8), 2);
	return textDecoder.decode(bytes);
}

export function decodeBase32Text(text: string): string {
	return textDecoder.decode(decodeBase32Rfc4648(text.replace(/\s+/g, "")));
}

export function decodeBase64Text(text: string): string {
	const clean = text.replace(/\s+/g, "");
	return decodeFromBase64(clean, /[-_]/.test(clean));
}

// ─── English-likeness scoring ────────────────────────────────────────────────

const ENGLISH_FREQ: Record<string, number> = {
	A: 8.167, B: 1.492, C: 2.782, D: 4.253, E: 12.702, F: 2.228, G: 2.015, H: 6.094, I: 6.966,
	J: 0.153, K: 0.772, L: 4.025, M: 2.406, N: 6.749, O: 7.507, P: 1.929, Q: 0.095, R: 5.987,
	S: 6.327, T: 9.056, U: 2.758, V: 0.978, W: 2.36, X: 0.15, Y: 1.974, Z: 0.074,
};

const COMMON_WORDS = new Set(
	"the be to of and a in that have i it for not on with he as you do at this but his by from they we say her she or an will my one all would there their what so up out if about who get which go me when make can like time no just him know take people into year your good some could them see other than then now look only come its over think also back after use two how our work first well way even new want because any these give day most us is are was were been has had did said dog fox quick brown jumps over lazy hello world attack dawn meet secret message".split(
		" "
	)
);

/** 0–1 estimate of how much a string looks like English text. */
export function englishScore(text: string): number {
	if (!text) return 0;
	const chars = Array.from(text);
	const printable = chars.filter((c) => /[\x20-\x7E\n\r\t]/.test(c)).length / chars.length;
	if (printable < 0.9) return 0;

	const letters = text.toUpperCase().replace(/[^A-Z]/g, "");
	const n = letters.length;
	if (n === 0) return 0;

	const counts: Record<string, number> = {};
	for (const ch of letters) counts[ch] = (counts[ch] || 0) + 1;
	let chi = 0;
	for (const [letter, pct] of Object.entries(ENGLISH_FREQ)) {
		const expected = (pct / 100) * n;
		const observed = counts[letter] || 0;
		chi += ((observed - expected) ** 2) / expected;
	}
	const freqScore = Math.exp(-chi / n / 1.5);

	const tokens = text.toLowerCase().split(/[^a-z']+/).filter((t) => t.length >= 2);
	const hits = tokens.filter((t) => COMMON_WORDS.has(t)).length;
	const wordScore = tokens.length ? hits / tokens.length : 0;

	const letterRatio = n / text.replace(/\s/g, "").length;
	const base = 0.55 * freqScore + 0.45 * Math.min(1, wordScore * 1.5);
	return Math.max(0, Math.min(1, base * (0.5 + 0.5 * letterRatio) * printable));
}

// ─── Auto-detection ──────────────────────────────────────────────────────────

export type CipherId =
	| "caesar" | "rot13" | "rot47" | "atbash" | "vigenere" | "affine" | "railfence"
	| "morse" | "a1z26" | "bacon" | "base64" | "base32" | "hex" | "binary";

export interface CipherCandidate {
	cipher: CipherId;
	label: string;
	params?: Record<string, string | number>;
	output: string;
	score: number;
}

function indexOfCoincidence(letters: string): number {
	const n = letters.length;
	if (n < 2) return 0;
	const counts: Record<string, number> = {};
	for (const ch of letters) counts[ch] = (counts[ch] || 0) + 1;
	let sum = 0;
	for (const c of Object.values(counts)) sum += c * (c - 1);
	return sum / (n * (n - 1));
}

function bestCaesarShift(letters: string): number {
	// Maximise correlation between the shifted observed frequencies and English frequencies
	const n = letters.length || 1;
	const counts = new Array(26).fill(0);
	for (const ch of letters) counts[ch.charCodeAt(0) - 65]++;
	let best = 0;
	let bestFit = -Infinity;
	for (let shift = 0; shift < 26; shift++) {
		let fit = 0;
		for (let i = 0; i < 26; i++) {
			fit += (counts[(i + shift) % 26] / n) * ENGLISH_FREQ[String.fromCharCode(65 + i)];
		}
		if (fit > bestFit) {
			bestFit = fit;
			best = shift;
		}
	}
	return best;
}

/** Recover a likely Vigenère key using the Index of Coincidence, then per-column frequency fit. */
export function recoverVigenereKey(text: string, maxKeyLength = 16): string | null {
	const letters = text.toUpperCase().replace(/[^A-Z]/g, "");
	if (letters.length < 20) return null;
	let bestLen = 1;
	let bestIoc = 0;
	for (let len = 1; len <= Math.min(maxKeyLength, Math.floor(letters.length / 3)); len++) {
		let total = 0;
		for (let c = 0; c < len; c++) {
			let col = "";
			for (let i = c; i < letters.length; i += len) col += letters[i];
			total += indexOfCoincidence(col);
		}
		const avg = total / len;
		if (avg > 0.06 && bestIoc <= 0.06) {
			bestLen = len;
			bestIoc = avg;
			break;
		}
		if (avg > bestIoc) {
			bestIoc = avg;
			bestLen = len;
		}
	}
	let key = "";
	for (let c = 0; c < bestLen; c++) {
		let col = "";
		for (let i = c; i < letters.length; i += bestLen) col += letters[i];
		key += String.fromCharCode(65 + bestCaesarShift(col));
	}
	return key;
}

function tryCandidate(list: CipherCandidate[], cipher: CipherId, label: string, fn: () => string, params?: Record<string, string | number>) {
	try {
		const output = fn();
		if (!output || !output.trim()) return;
		list.push({ cipher, label, params, output, score: englishScore(output) });
	} catch {
		/* not decodable this way */
	}
}

/** Try every supported cipher/encoding and rank the results by English-likeness. */
export function autoDecode(input: string, limit = 8): CipherCandidate[] {
	const text = input.trim();
	if (!text) return [];
	const results: CipherCandidate[] = [];
	const compact = text.replace(/\s+/g, "");

	if (/^[.\-·•–—_/|\s]+$/.test(text) && /[.\-·•]/.test(text)) {
		tryCandidate(results, "morse", "Morse code", () => morseDecode(text));
	}
	if (/^[01\s]+$/.test(text) && compact.length % 8 === 0) {
		tryCandidate(results, "binary", "Binary", () => decodeBinary(text));
	}
	if (/^(0x)?[0-9a-f\s]+$/i.test(text) && compact.replace(/0x/gi, "").length % 2 === 0 && /[0-9a-f]{4,}/i.test(compact)) {
		tryCandidate(results, "hex", "Hex", () => decodeHex(text));
	}
	if (/^[A-Za-z0-9+/=\s]+$/.test(text) && compact.length % 4 === 0 && compact.length >= 4 && /[a-z]/.test(compact) && /[A-Z0-9+/]/.test(compact)) {
		tryCandidate(results, "base64", "Base64", () => decodeBase64Text(text));
	}
	if (/^[A-Z2-7=\s]+$/i.test(text) && compact.length >= 8 && !/[a-z]/.test(compact)) {
		tryCandidate(results, "base32", "Base32", () => decodeBase32Text(text));
	}
	if (/^[\d\s\-,./]+$/.test(text) && /\d/.test(text)) {
		tryCandidate(results, "a1z26", "A1Z26", () => a1z26Decode(text));
	}
	if (/^[abAB\s]+$/.test(text) && compact.length % 5 === 0 && compact.length >= 10) {
		tryCandidate(results, "bacon", "Bacon's cipher", () => baconDecode(text));
	}

	if (/[A-Za-z]/.test(text)) {
		for (let shift = 1; shift < 26; shift++) {
			const label = shift === 13 ? "ROT13" : `Caesar (shift ${shift})`;
			tryCandidate(results, shift === 13 ? "rot13" : "caesar", label, () => caesar(text, -shift), { shift });
		}
		tryCandidate(results, "atbash", "Atbash", () => atbash(text));
		for (const a of AFFINE_A_VALUES) {
			if (a === 1) continue;
			for (let b = 0; b < 26; b++) {
				tryCandidate(results, "affine", `Affine (a=${a}, b=${b})`, () => affine(text, a, b, true), { a, b });
			}
		}
		for (let rails = 2; rails <= 8; rails++) {
			tryCandidate(results, "railfence", `Rail fence (${rails} rails)`, () => railFence(text, rails, true), { rails });
		}
		const key = recoverVigenereKey(text);
		if (key && key.length > 1) {
			tryCandidate(results, "vigenere", `Vigenère (key ${key})`, () => vigenere(text, key, true), { key });
		}
	}
	if (/[!-~]/.test(text)) {
		tryCandidate(results, "rot47", "ROT47", () => rot47(text));
	}

	const seen = new Set<string>();
	return results
		.filter((c) => c.output.trim().toLowerCase() !== text.toLowerCase())
		.sort((a, b) => b.score - a.score)
		.filter((c) => {
			const key = c.output.trim().toLowerCase();
			if (seen.has(key)) return false;
			seen.add(key);
			return true;
		})
		.slice(0, limit);
}
