import { describe, it, expect } from "vitest";
import {
	loadHighlighter,
	highlightLines,
	detectLanguage,
	groupTokensBySegments,
	languageFromFileName,
} from "@/lib/syntaxHighlightUtils";

describe("syntaxHighlightUtils", () => {
	it("maps file names to languages", () => {
		expect(languageFromFileName("src/App.tsx")).toBe("typescript");
		expect(languageFromFileName("styles.module.scss")).toBe("scss");
		expect(languageFromFileName("Makefile")).toBe("makefile");
		expect(languageFromFileName("notes")).toBeNull();
		expect(languageFromFileName(null)).toBeNull();
	});

	it("highlights per line, keeping multi-line constructs intact", async () => {
		const h = await loadHighlighter();
		const lines = ["const x = 'a';", "/* start", "still comment */", "return x;"];
		const out = highlightLines(h, lines, "javascript");
		expect(out).toHaveLength(4);
		out.forEach((tokens, i) => expect(tokens.map((t) => t.text).join("")).toBe(lines[i]));
		expect(out[0].find((t) => t.text === "const")?.kind).toBe("keyword");
		expect(out[0].find((t) => t.text === "'a'")?.kind).toBe("string");
		expect(out[2].every((t) => t.kind === "comment")).toBe(true);
	});

	it("auto-detects code and declines prose", async () => {
		const h = await loadHighlighter();
		const code = ["import React from 'react';", "export default function App() {", "  const [n, setN] = useState(0);", "  return null;", "}"];
		expect(["javascript", "typescript"]).toContain(detectLanguage(h, code));
		expect(detectLanguage(h, ["export const TOOLS = [", "\t{", "\t\tid: \"kitchen\",", "\t\tcategory: ToolCategory.KITCHEN,", "\t\timplemented: true,", "\t},", "];"])).toBe("typescript");
		expect(detectLanguage(h, [".btn {", "  color: red;", "  padding: 4px 8px;", "}"])).toBe("css");
		expect(detectLanguage(h, ["Hello there", "This is just a sentence."])).toBeNull();
	});

	it("cuts tokens at diff segment boundaries", () => {
		const groups = groupTokensBySegments(
			"let total = 1;",
			[
				{ text: "let", kind: "keyword" },
				{ text: " total = ", kind: null },
				{ text: "1", kind: "constant" },
				{ text: ";", kind: null },
			],
			[
				{ text: "let tot", changed: false },
				{ text: "al = 1", changed: true },
				{ text: ";", changed: false },
			]
		);
		expect(groups.map((g) => g.changed)).toEqual([false, true, false]);
		expect(groups[1].tokens).toEqual([
			{ text: "al = ", kind: null },
			{ text: "1", kind: "constant" },
		]);
	});

	it("falls back to plain text when tokens do not match", () => {
		expect(groupTokensBySegments("abc", [{ text: "xyz", kind: "string" }], null)).toEqual([
			{ changed: false, tokens: [{ text: "abc", kind: null }] },
		]);
	});
});
