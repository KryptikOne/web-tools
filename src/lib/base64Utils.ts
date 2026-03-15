/**
 * Encode a string to Base64 with UTF-8 support.
 * @param urlSafe - Use URL-safe alphabet (- _ instead of + /, no padding)
 * @param lineBreaks - Insert line breaks every 76 characters (MIME style)
 */
export function encodeToBase64(
	text: string,
	urlSafe: boolean,
	lineBreaks: boolean
): string {
	const encoder = new TextEncoder();
	const bytes = encoder.encode(text);
	const binaryString = Array.from(bytes)
		.map((byte) => String.fromCharCode(byte))
		.join("");
	let encoded = btoa(binaryString);

	if (urlSafe) {
		encoded = encoded
			.replace(/\+/g, "-")
			.replace(/\//g, "_")
			.replace(/=+$/, "");
	}

	if (lineBreaks) {
		encoded = encoded.replace(/(.{76})/g, "$1\n").trimEnd();
	}

	return encoded;
}

/**
 * Decode a Base64 string back to UTF-8 text.
 * @param urlSafe - Expect URL-safe alphabet and restore padding
 */
export function decodeFromBase64(input: string, urlSafe: boolean): string {
	let cleaned = input.replace(/\s/g, "");

	if (urlSafe) {
		cleaned = cleaned.replace(/-/g, "+").replace(/_/g, "/");
		const pad = cleaned.length % 4;
		if (pad === 2) cleaned += "==";
		else if (pad === 3) cleaned += "=";
	}

	const binaryString = atob(cleaned);
	const bytes = Uint8Array.from(binaryString, (char) => char.charCodeAt(0));
	const decoder = new TextDecoder();
	return decoder.decode(bytes);
}
