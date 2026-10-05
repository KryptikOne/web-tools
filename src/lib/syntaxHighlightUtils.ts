/**
 * Syntax highlighting built on lowlight (highlight.js → hast), lazy-loaded.
 * Output is per-line token lists tagged with a small set of theme-agnostic
 * kinds, so callers style them with their own (light/dark aware) colours.
 */

import type { createLowlight } from "lowlight";
import type { InlineSegment } from "@/lib/diffUtils";

export type Highlighter = ReturnType<typeof createLowlight>;

/** Colour roles, following GitHub's highlight.js themes. */
export type SyntaxKind = "keyword" | "entity" | "constant" | "string" | "builtin" | "comment" | "tag" | "section" | "bullet";

export interface SyntaxToken {
	text: string;
	kind: SyntaxKind | null;
}

/** Languages offered in pickers, all from lowlight's `common` set. */
export const SYNTAX_LANGUAGES: Record<string, string> = {
	bash: "Bash",
	c: "C",
	cpp: "C++",
	csharp: "C#",
	css: "CSS",
	diff: "Diff",
	go: "Go",
	graphql: "GraphQL",
	ini: "INI / TOML",
	java: "Java",
	javascript: "JavaScript",
	json: "JSON",
	kotlin: "Kotlin",
	less: "Less",
	lua: "Lua",
	makefile: "Makefile",
	markdown: "Markdown",
	objectivec: "Objective-C",
	perl: "Perl",
	php: "PHP",
	python: "Python",
	r: "R",
	ruby: "Ruby",
	rust: "Rust",
	scss: "SCSS",
	sql: "SQL",
	swift: "Swift",
	typescript: "TypeScript",
	xml: "HTML / XML",
	yaml: "YAML",
};

const EXTENSION_LANGUAGES: Record<string, string> = {
	sh: "bash",
	bash: "bash",
	zsh: "bash",
	c: "c",
	h: "c",
	cc: "cpp",
	cpp: "cpp",
	cxx: "cpp",
	hpp: "cpp",
	cs: "csharp",
	css: "css",
	diff: "diff",
	patch: "diff",
	go: "go",
	graphql: "graphql",
	gql: "graphql",
	ini: "ini",
	toml: "ini",
	cfg: "ini",
	java: "java",
	js: "javascript",
	mjs: "javascript",
	cjs: "javascript",
	jsx: "javascript",
	json: "json",
	kt: "kotlin",
	kts: "kotlin",
	less: "less",
	lua: "lua",
	mk: "makefile",
	md: "markdown",
	markdown: "markdown",
	m: "objectivec",
	pl: "perl",
	php: "php",
	py: "python",
	r: "r",
	rb: "ruby",
	rs: "rust",
	scss: "scss",
	sql: "sql",
	swift: "swift",
	ts: "typescript",
	tsx: "typescript",
	mts: "typescript",
	cts: "typescript",
	html: "xml",
	htm: "xml",
	xml: "xml",
	svg: "xml",
	vue: "xml",
	yml: "yaml",
	yaml: "yaml",
};

/**
 * Languages tried by auto-detection. Ties go to the earlier entry, so web
 * languages lead. INI and Makefile are left out: they claim almost any
 * `key: value` text (still selectable by hand or by file extension).
 */
const AUTO_DETECT_LANGUAGES = [
	"typescript",
	"javascript",
	"json",
	"css",
	"scss",
	"xml",
	"markdown",
	"python",
	"yaml",
	"sql",
	"php",
	"java",
	"csharp",
	"go",
	"rust",
	"ruby",
	"kotlin",
	"swift",
	"cpp",
	"c",
	"objectivec",
	"graphql",
	"less",
	"lua",
	"perl",
	"r",
	"bash",
	"diff",
];

/** Auto-detection below this relevance falls back to plain text. */
const MIN_DETECT_RELEVANCE = 3;

/** Only this many lines are sampled for auto-detection (it runs every grammar). */
const DETECT_SAMPLE_LINES = 200;

/** Larger inputs are not highlighted, to keep the page responsive. */
export const MAX_HIGHLIGHT_CHARS = 1_000_000;

export function languageFromFileName(name: string | null | undefined): string | null {
	if (!name) return null;
	const base = name.split(/[\\/]/).pop()!.toLowerCase();
	if (base === "makefile" || base === "gnumakefile") return "makefile";
	if (base === "dockerfile") return "bash";
	const ext = base.includes(".") ? base.split(".").pop()! : "";
	return EXTENSION_LANGUAGES[ext] ?? null;
}

let highlighterPromise: Promise<Highlighter> | null = null;

/** Load lowlight with its common grammars once, on first use. */
export function loadHighlighter(): Promise<Highlighter> {
	// webpackExports keeps lowlight's `all` grammars (~190 languages) out of the chunk.
	highlighterPromise ??= import(/* webpackExports: ["createLowlight", "common"] */ "lowlight")
		.then(({ createLowlight, common }) => createLowlight(common))
		.catch((err) => {
			highlighterPromise = null;
			throw err;
		});
	return highlighterPromise;
}

/** Best-guess language for some lines, or null when nothing is confident enough. */
export function detectLanguage(highlighter: Highlighter, lines: string[]): string | null {
	const sample = lines.slice(0, DETECT_SAMPLE_LINES).join("\n");
	if (!sample.trim()) return null;
	const result = highlighter.highlightAuto(sample, { subset: AUTO_DETECT_LANGUAGES });
	const { language, relevance } = (result.data ?? {}) as { language?: string; relevance?: number };
	return language && (relevance ?? 0) >= MIN_DETECT_RELEVANCE ? language : null;
}

/**
 * Highlight a whole document (so multi-line comments and strings are
 * understood) and split the result back into one token list per line.
 */
export function highlightLines(highlighter: Highlighter, lines: string[], language: string): SyntaxToken[][] {
	if (lines.length === 0) return [];
	const root = highlighter.highlight(language, lines.join("\n"));
	const result = hastToLines(root as HastNode);
	// Defensive: never hand back tokens that do not line up with the input.
	return result.length === lines.length ? result : lines.map((text) => [{ text, kind: null }]);
}

interface HastNode {
	type: string;
	value?: string;
	properties?: { className?: unknown };
	children?: HastNode[];
}

/** Flatten a lowlight tree into per-line tokens; the innermost highlight.js scope wins. */
export function hastToLines(root: HastNode): SyntaxToken[][] {
	const lines: SyntaxToken[][] = [[]];
	const push = (text: string, kind: SyntaxKind | null) => {
		const line = lines[lines.length - 1];
		const last = line[line.length - 1];
		if (last && last.kind === kind) last.text += text;
		else line.push({ text, kind });
	};
	const visit = (node: HastNode, kind: SyntaxKind | null) => {
		if (node.type === "text" && node.value !== undefined) {
			node.value.split("\n").forEach((part, i) => {
				if (i > 0) lines.push([]);
				if (part) push(part, kind);
			});
			return;
		}
		const classes = node.properties?.className;
		const scoped = Array.isArray(classes) && classes.some((c) => String(c).startsWith("hljs-"));
		const nextKind = scoped ? kindOf((classes as unknown[]).map(String)) : kind;
		node.children?.forEach((child) => visit(child, nextKind));
	};
	visit(root, null);
	return lines;
}

const SCOPE_KINDS: Record<string, SyntaxKind> = {
	keyword: "keyword",
	doctag: "keyword",
	"template-tag": "keyword",
	"template-variable": "keyword",
	type: "keyword",
	title: "entity",
	attr: "constant",
	attribute: "constant",
	literal: "constant",
	meta: "constant",
	number: "constant",
	operator: "constant",
	"selector-attr": "constant",
	"selector-class": "constant",
	"selector-id": "constant",
	regexp: "string",
	string: "string",
	built_in: "builtin",
	symbol: "builtin",
	comment: "comment",
	code: "comment",
	formula: "comment",
	name: "tag",
	quote: "tag",
	"selector-tag": "tag",
	"selector-pseudo": "tag",
	section: "section",
	bullet: "bullet",
};

function kindOf(classes: string[]): SyntaxKind | null {
	const scope = classes.find((c) => c.startsWith("hljs-"))?.slice(5);
	if (!scope) return null;
	if (scope === "variable") return classes.includes("language_") ? "keyword" : "constant";
	return SCOPE_KINDS[scope] ?? null;
}

/**
 * Cut a line's syntax tokens at diff-segment boundaries, so changed-text
 * highlights (backgrounds) and syntax colours (foregrounds) can nest.
 * Falls back to a single plain token if the tokens do not match the text.
 */
export function groupTokensBySegments(
	text: string,
	tokens: SyntaxToken[] | null,
	segments: InlineSegment[] | null
): Array<{ changed: boolean; tokens: SyntaxToken[] }> {
	const lineTokens =
		tokens && tokens.map((t) => t.text).join("") === text ? tokens : [{ text, kind: null }];
	if (!segments) return [{ changed: false, tokens: lineTokens }];

	const groups: Array<{ changed: boolean; tokens: SyntaxToken[] }> = [];
	let ti = 0;
	let offset = 0; // characters of lineTokens[ti] already consumed
	for (const seg of segments) {
		const group = { changed: seg.changed, tokens: [] as SyntaxToken[] };
		let remaining = seg.text.length;
		while (remaining > 0 && ti < lineTokens.length) {
			const token = lineTokens[ti];
			const take = Math.min(remaining, token.text.length - offset);
			group.tokens.push({ text: token.text.slice(offset, offset + take), kind: token.kind });
			remaining -= take;
			offset += take;
			if (offset === token.text.length) {
				ti++;
				offset = 0;
			}
		}
		groups.push(group);
	}
	return groups;
}
