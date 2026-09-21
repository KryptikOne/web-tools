import { describe, it, expect } from "vitest";
import {
	caesar, rot13, rot47, atbash, vigenere, affine, railFence,
	morseEncode, morseDecode, a1z26Encode, a1z26Decode, baconEncode, baconDecode,
	decodeHex, decodeBinary, englishScore, recoverVigenereKey, autoDecode,
} from "@/lib/cipherUtils";

const PLAIN = "THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG";

describe("classical ciphers", () => {
	it("caesar shifts and wraps, keeping case and punctuation", () => {
		expect(caesar("Hello, World!", 3)).toBe("Khoor, Zruog!");
		expect(caesar(caesar(PLAIN, 7), -7)).toBe(PLAIN);
	});

	it("rot13 and rot47 are self-inverse", () => {
		expect(rot13(rot13("Secret"))).toBe("Secret");
		expect(rot47(rot47("Secret 123!"))).toBe("Secret 123!");
	});

	it("atbash mirrors the alphabet", () => {
		expect(atbash("abc XYZ")).toBe("zyx CBA");
	});

	it("vigenère round-trips", () => {
		const enc = vigenere("ATTACK AT DAWN", "LEMON");
		expect(enc).toBe("LXFOPV EF RNHR");
		expect(vigenere(enc, "LEMON", true)).toBe("ATTACK AT DAWN");
	});

	it("affine round-trips and rejects a non-coprime a", () => {
		expect(affine(affine("AFFINE", 5, 8), 5, 8, true)).toBe("AFFINE");
		expect(() => affine("x", 2, 1)).toThrow();
	});

	it("rail fence round-trips", () => {
		const enc = railFence("WEAREDISCOVEREDFLEEATONCE", 3);
		expect(enc).toBe("WECRLTEERDSOEEFEAOCAIVDEN");
		expect(railFence(enc, 3, true)).toBe("WEAREDISCOVEREDFLEEATONCE");
	});
});

describe("codes and encodings", () => {
	it("morse round-trips with word separators", () => {
		const m = morseEncode("SOS help");
		expect(m).toBe("... --- ... / .... . .-.. .--.");
		expect(morseDecode(m)).toBe("SOS HELP");
	});

	it("a1z26 and bacon round-trip", () => {
		expect(a1z26Encode("Hi there")).toBe("8-9 20-8-5-18-5");
		expect(a1z26Decode("8-9 20-8-5-18-5")).toBe("HI THERE");
		expect(baconDecode(baconEncode("BACON"))).toBe("BACON");
	});

	it("decodes hex and binary to text", () => {
		expect(decodeHex("48 65 6c 6c 6f")).toBe("Hello");
		expect(decodeBinary("01001000 01101001")).toBe("Hi");
		expect(() => decodeHex("abc")).toThrow();
	});
});

describe("scoring and auto-decode", () => {
	it("scores English higher than gibberish", () => {
		expect(englishScore(PLAIN)).toBeGreaterThan(englishScore(caesar(PLAIN, 7)));
		expect(englishScore("\u0003\u0007\u0010")).toBe(0);
	});

	it("recovers a vigenère key from a long ciphertext", () => {
		const text = "THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG AND THEN THE DOG SLEEPS WHILE THE FOX RUNS AWAY INTO THE FOREST TO FIND MORE FOOD FOR THE WINTER";
		const key = recoverVigenereKey(vigenere(text, "LEMON"));
		expect(key).toBe("LEMON");
	});

	it("ranks the Caesar decode of a classic sentence at the top", () => {
		const candidates = autoDecode(caesar(PLAIN, 7));
		expect(candidates[0].output).toBe(PLAIN);
		expect(candidates[0].label).toBe("Caesar (shift 7)");
	});

	it("detects encodings by shape", () => {
		expect(autoDecode("SGVsbG8gV29ybGQ=")[0].cipher).toBe("base64");
		expect(autoDecode(".... . .-.. .-.. --- / .-- --- .-. .-.. -..")[0].output).toBe("HELLO WORLD");
		expect(autoDecode("")).toEqual([]);
	});
});
