import { describe, it, expect } from "vitest";
import {
	SPELLING_ALPHABETS,
	getSpellingAlphabet,
	spellText,
	spellTokensToString,
	readSpelledText,
	detectSpellingMode,
	resolveSpellingMode,
} from "@/lib/natoPhoneticUtils";
import { charToMorse } from "@/lib/morseUtils";
import { SEMAPHORE_POSITIONS, semaphoreAngles } from "@/lib/semaphoreUtils";

const nato = getSpellingAlphabet("nato");
const din = getSpellingAlphabet("din5009");
const de96 = getSpellingAlphabet("german1996");

describe("spelling alphabets", () => {
	it("exposes three alphabets with 26 base letters each", () => {
		expect(SPELLING_ALPHABETS.map((a) => a.id)).toEqual(["nato", "din5009", "german1996"]);
		for (const a of SPELLING_ALPHABETS) {
			const base = a.letters.filter((l) => !l.extra);
			expect(base).toHaveLength(26);
			expect(base.map((l) => l.char).join("")).toBe("ABCDEFGHIJKLMNOPQRSTUVWXYZ");
		}
	});

	it("uses official ICAO spellings", () => {
		expect(nato.letters.find((l) => l.char === "A")?.word).toBe("Alfa");
		expect(nato.letters.find((l) => l.char === "J")?.word).toBe("Juliett");
	});

	it("uses German city names for DIN 5009 and given names for 1996", () => {
		expect(din.letters.find((l) => l.char === "A")?.word).toBe("Aachen");
		expect(de96.letters.find((l) => l.char === "A")?.word).toBe("Anton");
		expect(din.letters.find((l) => l.char === "Ä")?.extra).toBe(true);
	});
});

describe("spellText", () => {
	it("spells letters and digits as char/word pairs", () => {
		expect(spellText("Hi 5", nato)).toEqual([
			{ kind: "pair", char: "H", word: "Hotel" },
			{ kind: "pair", char: "i", word: "India" },
			{ kind: "break" },
			{ kind: "pair", char: "5", word: "Five" },
		]);
	});

	it("collapses whitespace runs into one break and passes punctuation through", () => {
		expect(spellText("a,  \n b?", nato)).toEqual([
			{ kind: "pair", char: "a", word: "Alfa" },
			{ kind: "literal", char: "," },
			{ kind: "break" },
			{ kind: "pair", char: "b", word: "Bravo" },
			{ kind: "literal", char: "?" },
		]);
	});

	it("strips diacritics when the alphabet has no dedicated entry", () => {
		expect(spellText("é", nato)).toEqual([{ kind: "pair", char: "é", word: "Echo" }]);
	});

	it("uses dedicated umlaut entries for German alphabets", () => {
		expect(spellText("ä", din)).toEqual([{ kind: "pair", char: "ä", word: "Umlaut Aachen" }]);
		expect(spellText("ß", de96)).toEqual([{ kind: "pair", char: "ß", word: "Eszett" }]);
	});

	it("returns an empty list for empty input", () => {
		expect(spellText("", nato)).toEqual([]);
	});
});

describe("spellTokensToString", () => {
	it("joins words with spaces and marks word breaks with a slash", () => {
		expect(spellTokensToString(spellText("Hello World 12, ok?", nato))).toBe(
			"Hotel Echo Lima Lima Oscar / Whiskey Oscar Romeo Lima Delta / One Two , / Oscar Kilo ?"
		);
	});
});

describe("readSpelledText", () => {
	it("decodes code words back to text", () => {
		expect(
			readSpelledText("Hotel Echo Lima Lima Oscar / Whiskey Oscar Romeo Lima Delta / One Two Three", nato)
		).toBe("HELLO WORLD 123");
	});

	it("is case-insensitive and accepts common aliases", () => {
		expect(readSpelledText("alpha JULIET xray niner tree fife", nato)).toBe("AJX935");
	});

	it("passes unknown tokens through unchanged", () => {
		expect(readSpelledText("Hotel Echo Lima Lima Oscar", din)).toBe("HotelEchoLimaLimaOscar");
	});

	it("keeps single punctuation tokens", () => {
		expect(readSpelledText("Oscar Kilo ?", nato)).toBe("OK?");
	});

	it("decodes German alphabets including umlauts", () => {
		expect(readSpelledText("Anton Ärger Eszett", de96)).toBe("AÄß");
		expect(readSpelledText("Umlaut Aachen Berlin", din)).toBe("ÄB");
	});
});

describe("detectSpellingMode", () => {
	it("chooses read when every token is a code word", () => {
		expect(detectSpellingMode("Hotel Echo / Lima", nato)).toBe("read");
	});

	it("chooses spell for plain text or empty input", () => {
		expect(detectSpellingMode("Hello World", nato)).toBe("spell");
		expect(detectSpellingMode("", nato)).toBe("spell");
		expect(detectSpellingMode("Hotel Echo Lima Lima Oscar", din)).toBe("spell");
	});

	it("resolveSpellingMode only detects in auto mode", () => {
		expect(resolveSpellingMode("auto", "Hotel", nato)).toBe("read");
		expect(resolveSpellingMode("spell", "Hotel", nato)).toBe("spell");
		expect(resolveSpellingMode("read", "Hello", nato)).toBe("read");
	});
});

describe("morse and semaphore reference data", () => {
	it("maps letters and digits to Morse", () => {
		expect(charToMorse("A")).toBe(".-");
		expect(charToMorse("s")).toBe("...");
		expect(charToMorse("0")).toBe("-----");
		expect(charToMorse("#")).toBeUndefined();
	});

	it("maps every letter to one or two semaphore positions", () => {
		for (const ch of "ABCDEFGHIJKLMNOPQRSTUVWXYZ") {
			const pos = SEMAPHORE_POSITIONS[ch];
			expect(pos.length).toBeGreaterThanOrEqual(1);
			expect(pos.length).toBeLessThanOrEqual(2);
		}
		expect(semaphoreAngles("A")).toEqual([225, 180]);
		expect(semaphoreAngles("Z")).toEqual([90, 135]);
	});
});
