"use client";

import { useMemo, useState } from "react";
import {
	ClipboardDocumentIcon,
	CheckIcon,
	TrashIcon,
	ArrowsRightLeftIcon,
} from "@heroicons/react/24/outline";
import { useClipboard } from "@/hooks/useClipboard";
import styles from "./TextUnicodeConverter.module.scss";

type Direction = "text-to-cp" | "cp-to-text";
type Format = "u-plus" | "backslash-u" | "html-hex" | "html-dec" | "hex-space";

const FORMATS: { value: Format; label: string; example: string }[] = [
	{ value: "u-plus", label: "U+XXXX", example: "U+0041" },
	{ value: "backslash-u", label: "\\uXXXX", example: "\\u0041" },
	{ value: "html-hex", label: "&#xXXXX;", example: "&#x41;" },
	{ value: "html-dec", label: "&#NNNN;", example: "&#65;" },
	{ value: "hex-space", label: "Hex (space-separated)", example: "41" },
];

function toCodePoints(text: string): number[] {
	return Array.from(text).map((ch) => ch.codePointAt(0) ?? 0);
}

function hex(n: number, minWidth = 4): string {
	const s = n.toString(16).toUpperCase();
	return s.length >= minWidth ? s : s.padStart(minWidth, "0");
}

function formatCodePoints(cps: number[], format: Format): string {
	switch (format) {
		case "u-plus":
			return cps.map((cp) => `U+${hex(cp, 4)}`).join(" ");
		case "backslash-u":
			return cps
				.map((cp) => {
					if (cp <= 0xffff) return `\\u${hex(cp, 4)}`;
					// surrogate pair encoding for BMP-only \uXXXX consumers
					const adjusted = cp - 0x10000;
					const high = 0xd800 + (adjusted >> 10);
					const low = 0xdc00 + (adjusted & 0x3ff);
					return `\\u${hex(high, 4)}\\u${hex(low, 4)}`;
				})
				.join("");
		case "html-hex":
			return cps.map((cp) => `&#x${hex(cp, 1)};`).join("");
		case "html-dec":
			return cps.map((cp) => `&#${cp};`).join("");
		case "hex-space":
			return cps.map((cp) => hex(cp, 4)).join(" ");
	}
}

const HEX_RE = /[0-9a-fA-F]+/g;

function parseCodePoints(input: string): number[] {
	const trimmed = input.trim();
	if (!trimmed) return [];

	// decimal HTML entities: &#NNN;
	if (/^(?:\s*&#\d+;\s*)+$/.test(trimmed)) {
		const matches = trimmed.match(/&#(\d+);/g) ?? [];
		return matches.map((m) => parseInt(m.slice(2, -1), 10));
	}

	// any remaining mode: pull all hex runs
	const matches = trimmed.match(HEX_RE);
	if (!matches) throw new Error("No code points found in input.");

	const raw = matches.map((m) => parseInt(m, 16));

	// re-combine UTF-16 surrogate pairs into single code points
	const out: number[] = [];
	for (let i = 0; i < raw.length; i++) {
		const cp = raw[i];
		if (
			cp >= 0xd800 &&
			cp <= 0xdbff &&
			i + 1 < raw.length &&
			raw[i + 1] >= 0xdc00 &&
			raw[i + 1] <= 0xdfff
		) {
			const low = raw[++i];
			out.push(((cp - 0xd800) << 10) + (low - 0xdc00) + 0x10000);
		} else {
			out.push(cp);
		}
	}

	for (const cp of out) {
		if (!Number.isInteger(cp) || cp < 0 || cp > 0x10ffff) {
			throw new Error(`Code point out of range: 0x${cp.toString(16).toUpperCase()}`);
		}
	}
	return out;
}

function codePointsToText(cps: number[]): string {
	return String.fromCodePoint(...cps);
}

export default function TextUnicodeConverter() {
	const [direction, setDirection] = useState<Direction>("text-to-cp");
	const [format, setFormat] = useState<Format>("u-plus");
	const [input, setInput] = useState("");
	const { copy, isCopied } = useClipboard();

	const result = useMemo(() => {
		if (!input) return { output: "", error: null as string | null };
		try {
			if (direction === "text-to-cp") {
				return { output: formatCodePoints(toCodePoints(input), format), error: null };
			}
			return { output: codePointsToText(parseCodePoints(input)), error: null };
		} catch (err) {
			return {
				output: "",
				error: err instanceof Error ? err.message : "Conversion failed",
			};
		}
	}, [input, direction, format]);

	const swap = () => {
		setDirection((d) => (d === "text-to-cp" ? "cp-to-text" : "text-to-cp"));
		setInput(result.output || "");
	};

	const sourceLabel = direction === "text-to-cp" ? "Text" : "Code points";
	const targetLabel = direction === "text-to-cp" ? "Code points" : "Text";

	return (
		<div className={styles.container}>
			<div className={`flex gap-2 mb-6 ${styles.tabBar}`}>
				<button
					onClick={() => { setDirection("text-to-cp"); setInput(""); }}
					className={`${styles.tab} ${direction === "text-to-cp" ? styles.activeTab : ""}`}
				>
					Text → Code points
				</button>
				<button
					onClick={() => { setDirection("cp-to-text"); setInput(""); }}
					className={`${styles.tab} ${direction === "cp-to-text" ? styles.activeTab : ""}`}
				>
					Code points → Text
				</button>
			</div>

			{direction === "text-to-cp" && (
				<div className={`flex flex-wrap items-end gap-4 mb-6 p-4 ${styles.optionsBar}`}>
					<div className="flex flex-col gap-1">
						<label htmlFor="unicode-format" className={`text-xs font-medium ${styles.cardSubtitle}`}>
							Output format
						</label>
						<select
							id="unicode-format"
							value={format}
							onChange={(e) => setFormat(e.target.value as Format)}
							className={styles.select}
						>
							{FORMATS.map((f) => (
								<option key={f.value} value={f.value}>
									{f.label}  —  {f.example}
								</option>
							))}
						</select>
					</div>
					<button
						type="button"
						onClick={swap}
						className={`ml-auto ${styles.btnSecondary}`}
					>
						<ArrowsRightLeftIcon className="w-4 h-4" />
						Swap
					</button>
				</div>
			)}

			{direction === "cp-to-text" && (
				<div className={`flex justify-end mb-6 ${styles.swapRow}`}>
					<button
						type="button"
						onClick={swap}
						className={styles.btnSecondary}
					>
						<ArrowsRightLeftIcon className="w-4 h-4" />
						Swap
					</button>
				</div>
			)}

			<div className={styles.glassCard}>
				<div className="flex justify-between items-center mb-4 flex-wrap gap-4">
					<h3 className={`text-lg font-semibold m-0 ${styles.cardTitle}`}>{sourceLabel}</h3>
					<button
						onClick={() => setInput("")}
						className={styles.btnSecondary}
						disabled={!input}
					>
						<TrashIcon className="w-4 h-4" />
						Clear
					</button>
				</div>

				<label htmlFor="unicode-input" className="sr-only">{sourceLabel} input</label>
				<textarea
					id="unicode-input"
					value={input}
					onChange={(e) => setInput(e.target.value)}
					placeholder={
						direction === "text-to-cp"
							? "Type any text (emoji, CJK, accented letters all welcome)..."
							: "Paste code points in any supported format (U+0041, \\u0041, &#x41;, &#65;, or hex)"
					}
					className={styles.textarea}
					spellCheck={false}
				/>
				<div className={`flex justify-between items-center mt-3 text-xs ${styles.cardFooter}`}>
					<span>{input.length} UTF-16 units</span>
					{direction === "text-to-cp" && (
						<span>{Array.from(input).length} code points</span>
					)}
				</div>
			</div>

			{result.error && (
				<div className={`mt-4 px-4 py-3 text-sm ${styles.errorBox}`}>
					{result.error}
				</div>
			)}

			<div className={`mt-4 ${styles.glassCard}`}>
				<div className="flex justify-between items-center mb-4 flex-wrap gap-4">
					<h3 className={`text-lg font-semibold m-0 ${styles.cardTitle}`}>{targetLabel}</h3>
					<button
						onClick={() => copy(result.output, "output")}
						className={`${styles.btnPrimary} ${isCopied("output") ? styles.copied : ""}`}
						disabled={!result.output}
					>
						{isCopied("output") ? (
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

				<textarea
					value={result.output}
					readOnly
					placeholder="Output will appear here..."
					className={`${styles.textarea} ${styles.readOnly}`}
					spellCheck={false}
				/>
				<div className={`flex justify-between items-center mt-3 text-xs ${styles.cardFooter}`}>
					<span>{result.output.length} characters</span>
				</div>
			</div>

			<div className={`mt-6 ${styles.glassCard}`}>
				<h3 className={`text-lg font-semibold mb-2 m-0 ${styles.cardTitle}`}>About code points</h3>
				<p className={`text-sm leading-relaxed m-0 ${styles.infoText}`}>
					This tool iterates by Unicode code point (using <code>String.prototype.codePointAt</code>),
					so characters outside the Basic Multilingual Plane — emoji, many CJK extensions, mathematical symbols —
					round-trip correctly. The <code>\uXXXX</code> output uses surrogate pairs for code points above <code>U+FFFF</code>,
					since the <code>\u</code> escape only encodes 16-bit values.
				</p>
			</div>
		</div>
	);
}
