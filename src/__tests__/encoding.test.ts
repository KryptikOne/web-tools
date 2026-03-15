import { describe, it, expect } from "vitest";
import { encodeToBase64, decodeFromBase64 } from "@/lib/base64Utils";

describe("Base64 encoding", () => {
	it("encodes ASCII text", () => {
		expect(encodeToBase64("Hello, World!", false, false)).toBe(
			"SGVsbG8sIFdvcmxkIQ=="
		);
	});

	it("encodes empty string", () => {
		expect(encodeToBase64("", false, false)).toBe("");
	});

	it("encodes UTF-8 text", () => {
		const encoded = encodeToBase64("Hello 🌍", false, false);
		expect(decodeFromBase64(encoded, false)).toBe("Hello 🌍");
	});

	it("produces URL-safe output", () => {
		// Use input that generates + and / in base64
		const encoded = encodeToBase64("subjects?_d", true, false);
		expect(encoded).not.toContain("+");
		expect(encoded).not.toContain("/");
		expect(encoded).not.toContain("=");
	});

	it("adds line breaks at 76 chars", () => {
		const longText = "A".repeat(100);
		const encoded = encodeToBase64(longText, false, true);
		const lines = encoded.split("\n");
		expect(lines[0].length).toBeLessThanOrEqual(76);
	});
});

describe("Base64 decoding", () => {
	it("decodes ASCII text", () => {
		expect(decodeFromBase64("SGVsbG8sIFdvcmxkIQ==", false)).toBe(
			"Hello, World!"
		);
	});

	it("decodes empty string", () => {
		expect(decodeFromBase64("", false)).toBe("");
	});

	it("handles whitespace in input", () => {
		expect(decodeFromBase64("SGVs bG8s\nIFdv cmxk IQ==", false)).toBe(
			"Hello, World!"
		);
	});

	it("decodes URL-safe base64", () => {
		const original = "subjects?_d";
		const encoded = encodeToBase64(original, true, false);
		expect(decodeFromBase64(encoded, true)).toBe(original);
	});

	it("roundtrips complex text", () => {
		const texts = [
			"Special chars: <>&\"'",
			"Unicode: café résumé naïve",
			"CJK: 你好世界",
			"Mixed: Hello 🌍 café",
		];
		for (const text of texts) {
			const encoded = encodeToBase64(text, false, false);
			expect(decodeFromBase64(encoded, false)).toBe(text);
		}
	});

	it("throws on invalid base64", () => {
		expect(() => decodeFromBase64("!!!invalid!!!", false)).toThrow();
	});
});
