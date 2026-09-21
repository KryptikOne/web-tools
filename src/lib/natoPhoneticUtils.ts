/**
 * Spelling-alphabet utilities: NATO/ICAO, DIN 5009 (2022) and the older
 * German (1996) alphabet. Supports spelling text into calls and reading
 * calls back into text.
 */

export type SpellingAlphabetId = "nato" | "din5009" | "german1996";

export interface SpellingLetter {
	/** Upper-case character this word stands for */
	char: string;
	word: string;
	/** Extra letters outside A–Z (umlauts, ß). Rendered without Morse/flag data. */
	extra?: boolean;
}

export interface SpellingAlphabet {
	id: SpellingAlphabetId;
	name: string;
	description: string;
	letters: SpellingLetter[];
	/** Words for digits 0–9, indexed by digit */
	digits: string[];
	/** Alternate spellings accepted when reading, lower-cased word → char */
	readAliases: Record<string, string>;
}

const LATIN = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function toLetters(words: string[], extras: SpellingLetter[] = []): SpellingLetter[] {
	return [
		...words.map((word, i) => ({ char: LATIN[i], word })),
		...extras.map((e) => ({ ...e, extra: true })),
	];
}

export const SPELLING_ALPHABETS: SpellingAlphabet[] = [
	{
		id: "nato",
		name: "NATO",
		description: "ICAO / NATO radiotelephony alphabet",
		letters: toLetters([
			"Alfa", "Bravo", "Charlie", "Delta", "Echo", "Foxtrot", "Golf", "Hotel",
			"India", "Juliett", "Kilo", "Lima", "Mike", "November", "Oscar", "Papa",
			"Quebec", "Romeo", "Sierra", "Tango", "Uniform", "Victor", "Whiskey",
			"X-ray", "Yankee", "Zulu",
		]),
		digits: ["Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"],
		readAliases: {
			alpha: "A",
			juliet: "J",
			xray: "X",
			whisky: "W",
			tree: "3",
			fower: "4",
			fife: "5",
			niner: "9",
			nadazero: "0",
			unaone: "1",
			bissotwo: "2",
			terrathree: "3",
			kartefour: "4",
			pantafive: "5",
			soxisix: "6",
			setteseven: "7",
			oktoeight: "8",
			novenine: "9",
		},
	},
	{
		id: "din5009",
		name: "DIN 5009",
		description: "German spelling alphabet, DIN 5009:2022 (city names)",
		letters: toLetters(
			[
				"Aachen", "Berlin", "Chemnitz", "Düsseldorf", "Essen", "Frankfurt", "Goslar",
				"Hamburg", "Ingelheim", "Jena", "Köln", "Leipzig", "München", "Nürnberg",
				"Offenbach", "Potsdam", "Quickborn", "Rostock", "Salzwedel", "Tübingen",
				"Unna", "Völklingen", "Wuppertal", "Xanten", "Ypsilon", "Zwickau",
			],
			[
				{ char: "Ä", word: "Umlaut Aachen" },
				{ char: "Ö", word: "Umlaut Offenbach" },
				{ char: "Ü", word: "Umlaut Unna" },
				{ char: "ß", word: "Eszett" },
			]
		),
		digits: ["Null", "Eins", "Zwei", "Drei", "Vier", "Fünf", "Sechs", "Sieben", "Acht", "Neun"],
		readAliases: { zwo: "2", "umlaut aachen": "Ä", "umlaut offenbach": "Ö", "umlaut unna": "Ü" },
	},
	{
		id: "german1996",
		name: "German (1996)",
		description: "German spelling alphabet, DIN 5009:1996 (given names)",
		letters: toLetters(
			[
				"Anton", "Berta", "Cäsar", "Dora", "Emil", "Friedrich", "Gustav", "Heinrich",
				"Ida", "Julius", "Kaufmann", "Ludwig", "Martha", "Nordpol", "Otto", "Paula",
				"Quelle", "Richard", "Samuel", "Theodor", "Ulrich", "Viktor", "Wilhelm",
				"Xanthippe", "Ypsilon", "Zacharias",
			],
			[
				{ char: "Ä", word: "Ärger" },
				{ char: "Ö", word: "Ökonom" },
				{ char: "Ü", word: "Übermut" },
				{ char: "ß", word: "Eszett" },
			]
		),
		digits: ["Null", "Eins", "Zwei", "Drei", "Vier", "Fünf", "Sechs", "Sieben", "Acht", "Neun"],
		readAliases: { zwo: "2", caesar: "C", konrad: "K", zeppelin: "Z" },
	},
];

export function getSpellingAlphabet(id: SpellingAlphabetId): SpellingAlphabet {
	const found = SPELLING_ALPHABETS.find((a) => a.id === id);
	if (!found) throw new Error(`Unknown spelling alphabet: ${id}`);
	return found;
}

export type SpellingMode = "auto" | "spell" | "read";

export type SpellToken =
	| { kind: "pair"; char: string; word: string }
	| { kind: "break" }
	| { kind: "literal"; char: string };

function letterMap(alphabet: SpellingAlphabet): Map<string, string> {
	const map = new Map<string, string>();
	for (const l of alphabet.letters) map.set(l.char, l.word);
	return map;
}

/** Strip combining diacritics so "é" falls back to "E". */
function baseLetter(ch: string): string {
	return ch.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

/**
 * Spell text into a token list: one pair per letter/digit, one break per
 * whitespace run, and literals for anything the alphabet has no word for.
 */
export function spellText(text: string, alphabet: SpellingAlphabet): SpellToken[] {
	if (!text) return [];
	const words = letterMap(alphabet);
	const tokens: SpellToken[] = [];

	for (const ch of Array.from(text)) {
		if (/\s/.test(ch)) {
			if (tokens[tokens.length - 1]?.kind !== "break") tokens.push({ kind: "break" });
			continue;
		}
		// Check the raw char first: "ß".toUpperCase() is "SS".
		const upper = ch.toUpperCase();
		const word = words.get(ch) ?? words.get(upper) ?? words.get(baseLetter(upper));
		if (word) {
			tokens.push({ kind: "pair", char: ch, word });
		} else if (/^[0-9]$/.test(ch)) {
			tokens.push({ kind: "pair", char: ch, word: alphabet.digits[Number(ch)] });
		} else {
			tokens.push({ kind: "literal", char: ch });
		}
	}
	return tokens;
}

/** Plain-text form of a spelling: words separated by spaces, "/" between words. */
export function spellTokensToString(tokens: SpellToken[]): string {
	return tokens
		.map((t) => (t.kind === "pair" ? t.word : t.kind === "break" ? "/" : t.char))
		.join(" ");
}

function readMap(alphabet: SpellingAlphabet): Map<string, string> {
	const map = new Map<string, string>();
	const norm = (w: string) => w.toLowerCase().replace(/-/g, "");
	for (const l of alphabet.letters) map.set(norm(l.word), l.char);
	alphabet.digits.forEach((w, i) => map.set(norm(w), String(i)));
	for (const [alias, ch] of Object.entries(alphabet.readAliases)) map.set(norm(alias), ch);
	return map;
}

function tokenizeCalls(text: string): string[] {
	return text.split(/\s+/).filter(Boolean);
}

/**
 * Read spelled calls back into text. "/" becomes a space, code words become
 * their character, single punctuation marks are kept, and anything else is
 * passed through unchanged.
 */
export function readSpelledText(text: string, alphabet: SpellingAlphabet): string {
	const map = readMap(alphabet);
	const tokens = tokenizeCalls(text);
	let out = "";
	for (let i = 0; i < tokens.length; i++) {
		const token = tokens[i];
		if (token === "/") {
			out += " ";
			continue;
		}
		const key = token.toLowerCase().replace(/-/g, "");
		// Two-word calls such as "Umlaut Aachen"
		const next = tokens[i + 1];
		if (next && next !== "/") {
			const pairKey = `${key} ${next.toLowerCase().replace(/-/g, "")}`;
			const pairHit = map.get(pairKey);
			if (pairHit) {
				out += pairHit;
				i++;
				continue;
			}
		}
		out += map.get(key) ?? token;
	}
	return out;
}

/** Auto-detect: read when every token is a known call, otherwise spell. */
export function detectSpellingMode(text: string, alphabet: SpellingAlphabet): "spell" | "read" {
	const tokens = tokenizeCalls(text).filter((t) => t !== "/");
	if (tokens.length === 0) return "spell";
	const map = readMap(alphabet);
	const isCall = (t: string) => map.has(t.toLowerCase().replace(/-/g, ""));
	const isPunct = (t: string) => t.length === 1 && !/[\p{L}\p{N}]/u.test(t);
	let calls = 0;
	for (let i = 0; i < tokens.length; i++) {
		const t = tokens[i];
		if (isCall(t)) {
			calls++;
			continue;
		}
		const next = tokens[i + 1];
		if (next && map.has(`${t.toLowerCase()} ${next.toLowerCase()}`)) {
			calls++;
			i++;
			continue;
		}
		if (!isPunct(t)) return "spell";
	}
	return calls > 0 ? "read" : "spell";
}

export function resolveSpellingMode(
	mode: SpellingMode,
	text: string,
	alphabet: SpellingAlphabet
): "spell" | "read" {
	return mode === "auto" ? detectSpellingMode(text, alphabet) : mode;
}
