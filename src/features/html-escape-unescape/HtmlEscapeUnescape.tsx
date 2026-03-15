"use client";

import { useState, useMemo } from "react";
import {
	ClipboardDocumentIcon,
	CheckIcon,
	ArrowsRightLeftIcon,
	TrashIcon,
} from "@heroicons/react/24/outline";
import styles from "./HtmlEscapeUnescape.module.scss";
import {
	escapeHtmlEntities,
	unescapeHtmlEntities,
	type EntityFormat,
} from "@/lib/htmlEntityUtils";

type Mode = "escape" | "unescape";

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

	// Compute output
	const outputText = useMemo(() => {
		if (mode === "escape") {
			return escapeHtmlEntities(inputText, {
				escapeQuotes,
				escapeNonAscii,
				entityFormat,
			});
		} else {
			return unescapeHtmlEntities(inputText);
		}
	}, [mode, inputText, escapeQuotes, escapeNonAscii, entityFormat]);

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
