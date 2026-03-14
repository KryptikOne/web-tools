"use client";

import { useState, useCallback, useMemo } from "react";
import {
	ClipboardDocumentIcon,
	CheckIcon,
	ArrowsRightLeftIcon,
	TrashIcon,
} from "@heroicons/react/24/outline";
import styles from "./HtmlEscapeUnescape.module.scss";

type Mode = "escape" | "unescape";
type EntityFormat = "named" | "numeric" | "hex";

// Named entity mappings (char -> entity name)
const NAMED_ENTITIES: Record<string, string> = {
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
const NAMED_TO_CHAR: Record<string, string> = {};
for (const [char, entity] of Object.entries(NAMED_ENTITIES)) {
	NAMED_TO_CHAR[entity.toLowerCase()] = char;
}

// Common reference entities for the reference table
const REFERENCE_ENTITIES = [
	{ char: "&", named: "&amp;", numeric: "&#38;", hex: "&#x26;", description: "Ampersand" },
	{ char: "<", named: "&lt;", numeric: "&#60;", hex: "&#x3C;", description: "Less than" },
	{ char: ">", named: "&gt;", numeric: "&#62;", hex: "&#x3E;", description: "Greater than" },
	{ char: '"', named: "&quot;", numeric: "&#34;", hex: "&#x22;", description: "Double quote" },
	{ char: "'", named: "&apos;", numeric: "&#39;", hex: "&#x27;", description: "Single quote" },
	{ char: "\u00A0", named: "&nbsp;", numeric: "&#160;", hex: "&#xA0;", description: "Non-breaking space" },
	{ char: "\u00A9", named: "&copy;", numeric: "&#169;", hex: "&#xA9;", description: "Copyright" },
	{ char: "\u00AE", named: "&reg;", numeric: "&#174;", hex: "&#xAE;", description: "Registered" },
	{ char: "\u2122", named: "&trade;", numeric: "&#8482;", hex: "&#x2122;", description: "Trademark" },
	{ char: "\u20AC", named: "&euro;", numeric: "&#8364;", hex: "&#x20AC;", description: "Euro sign" },
	{ char: "\u00A3", named: "&pound;", numeric: "&#163;", hex: "&#xA3;", description: "Pound sign" },
	{ char: "\u2013", named: "&ndash;", numeric: "&#8211;", hex: "&#x2013;", description: "En dash" },
	{ char: "\u2014", named: "&mdash;", numeric: "&#8212;", hex: "&#x2014;", description: "Em dash" },
	{ char: "\u2026", named: "&hellip;", numeric: "&#8230;", hex: "&#x2026;", description: "Ellipsis" },
	{ char: "\u00B0", named: "&deg;", numeric: "&#176;", hex: "&#xB0;", description: "Degree" },
];

export default function HtmlEscapeUnescape() {
	const [mode, setMode] = useState<Mode>("escape");
	const [inputText, setInputText] = useState("");
	const [escapeQuotes, setEscapeQuotes] = useState(true);
	const [escapeNonAscii, setEscapeNonAscii] = useState(false);
	const [entityFormat, setEntityFormat] = useState<EntityFormat>("named");
	const [copiedField, setCopiedField] = useState<string | null>(null);

	// Escape HTML characters
	const escapeHtml = useCallback(
		(text: string): string => {
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
					// Check for named entity first when using named format
					if (entityFormat === "named" && NAMED_ENTITIES[char]) {
						result += NAMED_ENTITIES[char];
					} else if (entityFormat === "hex" || (entityFormat === "named" && !NAMED_ENTITIES[char])) {
						result += `&#x${code.toString(16).toUpperCase()};`;
					} else {
						result += `&#${code};`;
					}
					// Handle surrogate pairs for code points > 0xFFFF
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
		},
		[escapeQuotes, escapeNonAscii, entityFormat]
	);

	// Unescape HTML entities
	const unescapeHtml = useCallback((text: string): string => {
		if (!text) return "";

		return text.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (match) => {
			// Named entity
			const lower = match.toLowerCase();
			if (NAMED_TO_CHAR[lower]) {
				return NAMED_TO_CHAR[lower];
			}

			// Numeric decimal: &#123;
			if (match.startsWith("&#") && !match.startsWith("&#x") && !match.startsWith("&#X")) {
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

			// Unknown entity, leave as-is
			return match;
		});
	}, []);

	// Compute output
	const outputText = useMemo(() => {
		if (mode === "escape") {
			return escapeHtml(inputText);
		} else {
			return unescapeHtml(inputText);
		}
	}, [mode, inputText, escapeHtml, unescapeHtml]);

	// Swap: move output to input
	const handleSwap = () => {
		setInputText(outputText);
		setMode((prev) => (prev === "escape" ? "unescape" : "escape"));
	};

	// Copy to clipboard
	const handleCopy = async (text: string, field: string) => {
		try {
			await navigator.clipboard.writeText(text);
			setCopiedField(field);
			setTimeout(() => setCopiedField(null), 2000);
		} catch (err) {
			console.error("Failed to copy:", err);
		}
	};

	const handleClear = () => {
		setInputText("");
	};

	// Stats
	const stats = useMemo(() => {
		return {
			inputChars: inputText.length,
			outputChars: outputText.length,
			inputLines: inputText ? inputText.split("\n").length : 0,
			outputLines: outputText ? outputText.split("\n").length : 0,
		};
	}, [inputText, outputText]);

	return (
		<div className={styles.container}>
			{/* Mode Tabs */}
			<div className={`flex gap-2 mb-6 ${styles.tabBar}`}>
				<button
					onClick={() => setMode("escape")}
					className={`${styles.tab} ${mode === "escape" ? styles.active : ""}`}
				>
					Escape
				</button>
				<button
					onClick={() => setMode("unescape")}
					className={`${styles.tab} ${mode === "unescape" ? styles.active : ""}`}
				>
					Unescape
				</button>
			</div>

			{/* Options Bar */}
			{mode === "escape" && (
				<div className={`flex flex-wrap items-center gap-6 px-6 py-4 mb-6 ${styles.optionsBar}`}>
					<div className={`flex items-center gap-2 ${styles.optionGroup}`}>
						<label className={`text-sm font-medium whitespace-nowrap ${styles.optionLabel}`}>
							Entity Format
						</label>
						<select
							value={entityFormat}
							onChange={(e) => setEntityFormat(e.target.value as EntityFormat)}
							className={styles.select}
						>
							<option value="named">Named (&amp;amp;)</option>
							<option value="numeric">Decimal (&amp;#38;)</option>
							<option value="hex">Hex (&amp;#x26;)</option>
						</select>
					</div>

					<div className={`flex items-center gap-2 ${styles.optionGroup}`}>
						<label className={`flex items-center gap-2 text-sm font-medium cursor-pointer ${styles.checkboxLabel}`}>
							<input
								type="checkbox"
								checked={escapeQuotes}
								onChange={(e) => setEscapeQuotes(e.target.checked)}
								className={`w-4 h-4 cursor-pointer ${styles.checkbox}`}
							/>
							Escape quotes
						</label>
					</div>

					<div className={`flex items-center gap-2 ${styles.optionGroup}`}>
						<label className={`flex items-center gap-2 text-sm font-medium cursor-pointer ${styles.checkboxLabel}`}>
							<input
								type="checkbox"
								checked={escapeNonAscii}
								onChange={(e) => setEscapeNonAscii(e.target.checked)}
								className={`w-4 h-4 cursor-pointer ${styles.checkbox}`}
							/>
							Escape non-ASCII
						</label>
					</div>
				</div>
			)}

			{/* Converter Grid */}
			<div className={`grid gap-4 mb-6 items-start ${styles.grid}`}>
				{/* Input Panel */}
				<div className={styles.glassCard}>
					<div className={`flex justify-between items-center mb-4 flex-wrap gap-4 ${styles.cardHeader}`}>
						<h3 className={`text-lg font-semibold m-0 ${styles.cardTitle}`}>
							{mode === "escape" ? "Plain Text" : "Escaped HTML"}
						</h3>
						<div className={`flex flex-wrap gap-2 ${styles.buttonGroup}`}>
							<button onClick={handleClear} className={styles.btnSecondary} disabled={!inputText}>
								<TrashIcon className="w-4 h-4" />
								Clear
							</button>
						</div>
					</div>

					<textarea
						value={inputText}
						onChange={(e) => setInputText(e.target.value)}
						placeholder={
							mode === "escape"
								? 'Enter text containing <html>, "quotes", & special characters...'
								: "Enter escaped HTML like &lt;div&gt; or &#38; or &#x26;..."
						}
						className={styles.textarea}
						spellCheck={false}
					/>

					<div className={`flex justify-between items-center mt-3 text-xs ${styles.cardFooter}`}>
						<span>{stats.inputChars} characters, {stats.inputLines} lines</span>
					</div>
				</div>

				{/* Swap Button */}
				<div className={`flex items-center justify-center py-4 ${styles.swapContainer}`}>
					<button
						onClick={handleSwap}
						className={`flex items-center justify-center p-3 ${styles.swapButton}`}
						title="Swap: move output to input and toggle mode"
					>
						<ArrowsRightLeftIcon className="w-6 h-6" />
					</button>
				</div>

				{/* Output Panel */}
				<div className={styles.glassCard}>
					<div className={`flex justify-between items-center mb-4 flex-wrap gap-4 ${styles.cardHeader}`}>
						<h3 className={`text-lg font-semibold m-0 ${styles.cardTitle}`}>
							{mode === "escape" ? "Escaped HTML" : "Plain Text"}
						</h3>
						<div className={`flex flex-wrap gap-2 ${styles.buttonGroup}`}>
							<button
								onClick={() => handleCopy(outputText, "output")}
								className={`${styles.btnPrimary} ${copiedField === "output" ? styles.copied : ""}`}
								disabled={!outputText}
							>
								{copiedField === "output" ? (
									<>
										<CheckIcon className="w-4 h-4" />
										Copied!
									</>
								) : (
									<>
										<ClipboardDocumentIcon className="w-4 h-4" />
										Copy
									</>
								)}
							</button>
						</div>
					</div>

					<textarea
						value={outputText}
						readOnly
						placeholder="Output will appear here..."
						className={`${styles.textarea} ${styles.readOnly}`}
						spellCheck={false}
					/>

					<div className={`flex justify-between items-center mt-3 text-xs ${styles.cardFooter}`}>
						<span>{stats.outputChars} characters, {stats.outputLines} lines</span>
					</div>
				</div>
			</div>

			{/* Reference Table */}
			<div className={styles.glassCard}>
				<h3 className={styles.sectionTitle}>Common HTML Entities Reference</h3>

				<div className={styles.tableWrapper}>
					<table className={styles.referenceTable}>
						<thead>
							<tr>
								<th>Character</th>
								<th>Description</th>
								<th>Named</th>
								<th>Decimal</th>
								<th>Hex</th>
							</tr>
						</thead>
						<tbody>
							{REFERENCE_ENTITIES.map((entity) => (
								<tr key={entity.description}>
									<td className={styles.charCell}>{entity.char === "\u00A0" ? "[ ]" : entity.char}</td>
									<td>{entity.description}</td>
									<td>
										<code className={styles.entityCode}>{entity.named}</code>
									</td>
									<td>
										<code className={styles.entityCode}>{entity.numeric}</code>
									</td>
									<td>
										<code className={styles.entityCode}>{entity.hex}</code>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
}
