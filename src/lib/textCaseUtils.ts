/**
 * Split input text into words, handling camelCase, snake_case, kebab-case,
 * dot.case, and path/case boundaries.
 */
export function splitIntoWords(text: string): string[] {
	let normalized = text.replace(/([a-z])([A-Z])/g, "$1 $2");
	normalized = normalized.replace(/[_\-./]/g, " ");
	return normalized.split(/\s+/).filter((w) => w.length > 0);
}

export function toUpperCase(text: string): string {
	return text.toUpperCase();
}

export function toLowerCase(text: string): string {
	return text.toLowerCase();
}

export function toTitleCase(text: string): string {
	return text.replace(/\S+/g, (word) =>
		word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
	);
}

export function toSentenceCase(text: string): string {
	return text
		.toLowerCase()
		.replace(/(^\s*|[.!?]\s+)(\w)/g, (match, separator, char) =>
			separator + char.toUpperCase()
		);
}

export function toCamelCase(text: string): string {
	const words = splitIntoWords(text);
	if (words.length === 0) return "";
	return words
		.map((w, i) =>
			i === 0
				? w.toLowerCase()
				: w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
		)
		.join("");
}

export function toPascalCase(text: string): string {
	const words = splitIntoWords(text);
	if (words.length === 0) return "";
	return words
		.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
		.join("");
}

export function toSnakeCase(text: string): string {
	return splitIntoWords(text)
		.map((w) => w.toLowerCase())
		.join("_");
}

export function toKebabCase(text: string): string {
	return splitIntoWords(text)
		.map((w) => w.toLowerCase())
		.join("-");
}

export function toConstantCase(text: string): string {
	return splitIntoWords(text)
		.map((w) => w.toUpperCase())
		.join("_");
}

export function toDotCase(text: string): string {
	return splitIntoWords(text)
		.map((w) => w.toLowerCase())
		.join(".");
}

export function toPathCase(text: string): string {
	return splitIntoWords(text)
		.map((w) => w.toLowerCase())
		.join("/");
}

export function toAlternatingCase(text: string): string {
	let i = 0;
	return text
		.split("")
		.map((char) => {
			if (/[a-zA-Z]/.test(char)) {
				const result = i % 2 === 0 ? char.toLowerCase() : char.toUpperCase();
				i++;
				return result;
			}
			return char;
		})
		.join("");
}

export function toInverseCase(text: string): string {
	return text
		.split("")
		.map((char) => {
			if (char === char.toUpperCase()) return char.toLowerCase();
			if (char === char.toLowerCase()) return char.toUpperCase();
			return char;
		})
		.join("");
}
