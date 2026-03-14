"use client";

import { useState, useMemo, useCallback } from "react";
import {
	ClipboardDocumentIcon,
	CheckIcon,
	CodeBracketIcon,
	DocumentTextIcon,
} from "@heroicons/react/24/outline";
import styles from "./MarkdownPreview.module.scss";

const SAMPLE_MARKDOWN = `# Markdown Preview

## Getting Started

This is a **live markdown preview** tool. Type in the editor on the left and see the rendered output on the right.

### Text Formatting

You can write **bold text**, *italic text*, and ~~strikethrough text~~. You can also use \`inline code\` for technical terms.

### Links & Images

Here's a [link to example](https://example.com) and an image:

![Placeholder image](https://via.placeholder.com/400x200)

### Code Blocks

\`\`\`
function greet(name) {
  return "Hello, " + name + "!";
}

console.log(greet("World"));
\`\`\`

### Lists

**Unordered list:**

- First item
- Second item
- Third item

**Ordered list:**

1. Step one
2. Step two
3. Step three

### Blockquotes

> "The best way to predict the future is to invent it."
> — Alan Kay

### Horizontal Rule

---

That's it! Start editing to see your markdown rendered in real time.`;

function sanitizeHtml(html: string): string {
	return html
		.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
		.replace(/on\w+="[^"]*"/gi, "")
		.replace(/on\w+='[^']*'/gi, "")
		.replace(/javascript:/gi, "");
}

function escapeHtml(text: string): string {
	return text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

function parseMarkdown(md: string): string {
	let html = md;

	// Code blocks (``` ... ```) — must be handled before other inline rules
	html = html.replace(/```([\s\S]*?)```/g, (_match, code: string) => {
		const trimmed = code.replace(/^\n/, "").replace(/\n$/, "");
		return `<pre><code>${escapeHtml(trimmed)}</code></pre>`;
	});

	// Split into blocks to handle block-level elements
	const blocks = html.split(/\n\n+/);
	const processedBlocks: string[] = [];

	for (let i = 0; i < blocks.length; i++) {
		const block = blocks[i].trim();
		if (!block) continue;

		// Skip already-processed pre/code blocks
		if (block.startsWith("<pre>")) {
			processedBlocks.push(block);
			continue;
		}

		// Horizontal rule
		if (/^-{3,}$/.test(block) || /^\*{3,}$/.test(block) || /^_{3,}$/.test(block)) {
			processedBlocks.push("<hr />");
			continue;
		}

		// Headings
		const headingMatch = block.match(/^(#{1,6})\s+(.+)$/m);
		if (headingMatch && block.split("\n").length === 1) {
			const level = headingMatch[1].length;
			const text = parseInline(headingMatch[2]);
			processedBlocks.push(`<h${level}>${text}</h${level}>`);
			continue;
		}

		// Blockquote
		if (block.startsWith(">")) {
			const lines = block.split("\n");
			const quoteContent = lines
				.map((line) => line.replace(/^>\s?/, ""))
				.join("\n");
			processedBlocks.push(`<blockquote>${parseInline(quoteContent)}</blockquote>`);
			continue;
		}

		// Unordered list
		if (/^[\-\*]\s/.test(block)) {
			const lines = block.split("\n");
			const items = lines
				.filter((line) => /^[\-\*]\s/.test(line.trim()))
				.map((line) => `<li>${parseInline(line.replace(/^[\-\*]\s+/, ""))}</li>`)
				.join("");
			processedBlocks.push(`<ul>${items}</ul>`);
			continue;
		}

		// Ordered list
		if (/^\d+\.\s/.test(block)) {
			const lines = block.split("\n");
			const items = lines
				.filter((line) => /^\d+\.\s/.test(line.trim()))
				.map((line) => `<li>${parseInline(line.replace(/^\d+\.\s+/, ""))}</li>`)
				.join("");
			processedBlocks.push(`<ol>${items}</ol>`);
			continue;
		}

		// Paragraph (handle multi-line within block as line breaks)
		const lines = block.split("\n");
		const processed = lines.map((line) => {
			// Check if individual line is a heading
			const lineHeading = line.match(/^(#{1,6})\s+(.+)$/);
			if (lineHeading) {
				const level = lineHeading[1].length;
				return `<h${level}>${parseInline(lineHeading[2])}</h${level}>`;
			}
			return parseInline(line);
		});
		const joined = processed.join("<br />");
		// Don't wrap headings in a paragraph
		if (joined.startsWith("<h")) {
			processedBlocks.push(joined);
		} else {
			processedBlocks.push(`<p>${joined}</p>`);
		}
	}

	return processedBlocks.join("\n");
}

function parseInline(text: string): string {
	let result = escapeHtml(text);

	// Inline code
	result = result.replace(/`([^`]+)`/g, "<code>$1</code>");

	// Images ![alt](url)
	result = result.replace(
		/!\[([^\]]*)\]\(([^)]+)\)/g,
		'<img src="$2" alt="$1" />'
	);

	// Links [text](url)
	result = result.replace(
		/\[([^\]]+)\]\(([^)]+)\)/g,
		'<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
	);

	// Bold **text** or __text__
	result = result.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
	result = result.replace(/__(.+?)__/g, "<strong>$1</strong>");

	// Italic *text* or _text_
	result = result.replace(/\*(.+?)\*/g, "<em>$1</em>");
	result = result.replace(/_(.+?)_/g, "<em>$1</em>");

	// Strikethrough ~~text~~
	result = result.replace(/~~(.+?)~~/g, "<del>$1</del>");

	return result;
}

export default function MarkdownPreview() {
	const [markdown, setMarkdown] = useState(SAMPLE_MARKDOWN);
	const [copiedField, setCopiedField] = useState<string | null>(null);

	const renderedHtml = useMemo(() => {
		const raw = parseMarkdown(markdown);
		return sanitizeHtml(raw);
	}, [markdown]);

	const stats = useMemo(() => {
		const chars = markdown.length;
		const words = markdown.trim() ? markdown.trim().split(/\s+/).length : 0;
		return { chars, words };
	}, [markdown]);

	const handleCopy = useCallback(async (text: string, field: string) => {
		try {
			await navigator.clipboard.writeText(text);
			setCopiedField(field);
			setTimeout(() => setCopiedField(null), 2000);
		} catch (err) {
			console.error("Failed to copy:", err);
		}
	}, []);

	return (
		<div className={styles.container}>
			{/* Toolbar */}
			<div className={`flex flex-wrap items-center justify-between gap-4 px-6 py-4 mb-6 ${styles.toolbar}`}>
				<div className={`flex items-center gap-4 ${styles.stats}`}>
					<span className="text-sm">
						<strong>{stats.words}</strong> words
					</span>
					<span className="text-sm">
						<strong>{stats.chars}</strong> characters
					</span>
				</div>

				<div className={`flex flex-wrap gap-2 ${styles.buttonGroup}`}>
					<button
						onClick={() => handleCopy(renderedHtml, "html")}
						className={`${styles.btnPrimary} ${copiedField === "html" ? styles.copied : ""}`}
						disabled={!markdown}
					>
						{copiedField === "html" ? (
							<>
								<CheckIcon className="w-4 h-4" />
								Copied!
							</>
						) : (
							<>
								<CodeBracketIcon className="w-4 h-4" />
								Copy HTML
							</>
						)}
					</button>
					<button
						onClick={() => handleCopy(markdown, "markdown")}
						className={`${styles.btnPrimary} ${copiedField === "markdown" ? styles.copied : ""}`}
						disabled={!markdown}
					>
						{copiedField === "markdown" ? (
							<>
								<CheckIcon className="w-4 h-4" />
								Copied!
							</>
						) : (
							<>
								<DocumentTextIcon className="w-4 h-4" />
								Copy Markdown
							</>
						)}
					</button>
				</div>
			</div>

			{/* Editor & Preview */}
			<div className={`grid gap-6 ${styles.editorGrid}`}>
				{/* Editor */}
				<div className={styles.glassCard}>
					<h3 className={`text-lg font-semibold mb-4 m-0 ${styles.panelTitle}`}>Editor</h3>
					<textarea
						value={markdown}
						onChange={(e) => setMarkdown(e.target.value)}
						placeholder="Type your markdown here..."
						className={styles.textarea}
						spellCheck={false}
					/>
				</div>

				{/* Preview */}
				<div className={styles.glassCard}>
					<h3 className={`text-lg font-semibold mb-4 m-0 ${styles.panelTitle}`}>Preview</h3>
					<div
						className={styles.preview}
						dangerouslySetInnerHTML={{ __html: renderedHtml }}
					/>
				</div>
			</div>
		</div>
	);
}
