// Named entity mappings (char -> entity name)
export const NAMED_ENTITIES: Record<string, string> = {
	"&": "&amp;",
	"<": "&lt;",
	">": "&gt;",
	'"': "&quot;",
	"'": "&apos;",
	"\u00A0": "&nbsp;",
	"\u00A9": "&copy;",
	"\u00AE": "&reg;",
	"\u2122": "&trade;",
	"\u00A2": "&cent;",
	"\u00A3": "&pound;",
	"\u00A5": "&yen;",
	"\u20AC": "&euro;",
	"\u2013": "&ndash;",
	"\u2014": "&mdash;",
	"\u2018": "&lsquo;",
	"\u2019": "&rsquo;",
	"\u201C": "&ldquo;",
	"\u201D": "&rdquo;",
	"\u2026": "&hellip;",
	"\u00B0": "&deg;",
	"\u00D7": "&times;",
	"\u00F7": "&divide;",
	"\u00B1": "&plusmn;",
	"\u00B5": "&micro;",
	"\u00B6": "&para;",
	"\u00A7": "&sect;",
	"\u2190": "&larr;",
	"\u2192": "&rarr;",
	"\u2191": "&uarr;",
	"\u2193": "&darr;",
};

// Reverse mapping (entity name -> char)
export const NAMED_TO_CHAR: Record<string, string> = {};
for (const [char, entity] of Object.entries(NAMED_ENTITIES)) {
	NAMED_TO_CHAR[entity.toLowerCase()] = char;
}

export type EntityFormat = "named" | "numeric" | "hex";

export interface EscapeOptions {
	escapeQuotes?: boolean;
	escapeNonAscii?: boolean;
	entityFormat?: EntityFormat;
}

/**
 * Escape HTML characters with configurable entity format and options.
 */
export function escapeHtmlEntities(
	text: string,
	options: EscapeOptions = {}
): string {
	const {
		escapeQuotes = true,
		escapeNonAscii = false,
		entityFormat = "named",
	} = options;

	if (!text) return "";

	let result = "";
	for (let i = 0; i < text.length; i++) {
		const char = text[i];
		const code = text.codePointAt(i)!;

		// Always escape & < >
		if (char === "&" || char === "<" || char === ">") {
			if (entityFormat === "named") {
				result += NAMED_ENTITIES[char];
			} else if (entityFormat === "numeric") {
				result += `&#${code};`;
			} else {
				result += `&#x${code.toString(16).toUpperCase()};`;
			}
			continue;
		}

		// Optionally escape quotes
		if (escapeQuotes && (char === '"' || char === "'")) {
			if (entityFormat === "named") {
				result += NAMED_ENTITIES[char];
			} else if (entityFormat === "numeric") {
				result += `&#${code};`;
			} else {
				result += `&#x${code.toString(16).toUpperCase()};`;
			}
			continue;
		}

		// Optionally escape non-ASCII
		if (escapeNonAscii && code > 127) {
			if (entityFormat === "named" && NAMED_ENTITIES[char]) {
				result += NAMED_ENTITIES[char];
			} else if (
				entityFormat === "hex" ||
				(entityFormat === "named" && !NAMED_ENTITIES[char])
			) {
				result += `&#x${code.toString(16).toUpperCase()};`;
			} else {
				result += `&#${code};`;
			}
			if (code > 0xffff) i++;
			continue;
		}

		// Handle surrogate pairs for non-escaped chars
		if (code > 0xffff) {
			result += text[i] + text[i + 1];
			i++;
		} else {
			result += char;
		}
	}

	return result;
}

/**
 * Unescape HTML entities (named, numeric decimal, and numeric hex).
 */
export function unescapeHtmlEntities(text: string): string {
	if (!text) return "";

	return text.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (match) => {
		// Named entity
		const lower = match.toLowerCase();
		if (NAMED_TO_CHAR[lower]) {
			return NAMED_TO_CHAR[lower];
		}

		// Numeric decimal: &#123;
		if (
			match.startsWith("&#") &&
			!match.startsWith("&#x") &&
			!match.startsWith("&#X")
		) {
			const num = parseInt(match.slice(2, -1), 10);
			if (!isNaN(num) && num >= 0 && num <= 0x10ffff) {
				return String.fromCodePoint(num);
			}
		}

		// Numeric hex: &#x1A;
		if (match.startsWith("&#x") || match.startsWith("&#X")) {
			const num = parseInt(match.slice(3, -1), 16);
			if (!isNaN(num) && num >= 0 && num <= 0x10ffff) {
				return String.fromCodePoint(num);
			}
		}

		return match;
	});
}
