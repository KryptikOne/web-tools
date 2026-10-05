"use client";

import { useEffect, useMemo, useState } from "react";
import type { LineDiff } from "@/lib/diffUtils";
import {
	detectLanguage,
	highlightLines,
	languageFromFileName,
	loadHighlighter,
	MAX_HIGHLIGHT_CHARS,
	type Highlighter,
	type SyntaxToken,
} from "@/lib/syntaxHighlightUtils";

/** "auto", "plaintext", or a language id from SYNTAX_LANGUAGES */
export type LanguageChoice = string;

interface SyntaxHighlight {
	/** Language in effect, or null for plain text */
	language: string | null;
	/** Per-line tokens for each side, indexed by 0-based line number */
	left: SyntaxToken[][] | null;
	right: SyntaxToken[][] | null;
	tooLarge: boolean;
}

const DETECT_SAMPLE_LINES = 200;

/**
 * Syntax tokens for both sides of a diff. The highlighter is loaded on first
 * use; "auto" prefers the file extension, then content detection.
 */
export function useSyntaxHighlight(
	diff: LineDiff,
	choice: LanguageChoice,
	names: { left: string; right: string }
): SyntaxHighlight {
	const [highlighter, setHighlighter] = useState<Highlighter | null>(null);
	const enabled = choice !== "plaintext";

	useEffect(() => {
		if (!enabled || highlighter) return;
		let active = true;
		loadHighlighter()
			.then((h) => active && setHighlighter(h))
			.catch(() => {
				// Highlighting is an enhancement; the diff stays usable as plain text.
			});
		return () => {
			active = false;
		};
	}, [enabled, highlighter]);

	const tooLarge = useMemo(
		() => charCount(diff.left) + charCount(diff.right) > MAX_HIGHLIGHT_CHARS,
		[diff.left, diff.right]
	);

	// Detection only reruns when the sampled text changes, not on every edit further down.
	const detectSample = (diff.right.length ? diff.right : diff.left).slice(0, DETECT_SAMPLE_LINES).join("\n");
	const fileLanguage = languageFromFileName(names.right) ?? languageFromFileName(names.left);

	const language = useMemo(() => {
		if (!enabled || tooLarge) return null;
		if (choice !== "auto") return choice;
		if (fileLanguage) return fileLanguage;
		return highlighter ? detectLanguage(highlighter, detectSample.split("\n")) : null;
	}, [enabled, tooLarge, choice, fileLanguage, highlighter, detectSample]);

	const tokens = useMemo(() => {
		if (!highlighter || !language) return { left: null, right: null };
		return {
			left: highlightLines(highlighter, diff.left, language),
			right: highlightLines(highlighter, diff.right, language),
		};
	}, [highlighter, language, diff.left, diff.right]);

	return { language, ...tokens, tooLarge };
}

function charCount(lines: string[]): number {
	let total = 0;
	for (const line of lines) total += line.length + 1;
	return total;
}
