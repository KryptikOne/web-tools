"use client";

import { useMemo, useState } from "react";
import {
	ClipboardDocumentIcon,
	CheckIcon,
	ArrowsRightLeftIcon,
} from "@heroicons/react/24/outline";
import { useClipboard } from "@/hooks/useClipboard";
import styles from "./RomanNumeralConverter.module.scss";

type Mode = "to-roman" | "to-number";

const ROMAN_TABLE: [number, string][] = [
	[1000, "M"],
	[900, "CM"],
	[500, "D"],
	[400, "CD"],
	[100, "C"],
	[90, "XC"],
	[50, "L"],
	[40, "XL"],
	[10, "X"],
	[9, "IX"],
	[5, "V"],
	[4, "IV"],
	[1, "I"],
];

const ROMAN_PATTERN = /^M{0,3}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$/;

function numberToRoman(n: number): string {
	if (!Number.isInteger(n)) throw new Error("Enter a whole number.");
	if (n < 1) throw new Error("Roman numerals start at 1.");
	if (n > 3999) throw new Error("Standard Roman numerals only go up to 3999. Larger values use vinculum (overline) notation, which is not supported here.");

	let value = n;
	let out = "";
	for (const [num, sym] of ROMAN_TABLE) {
		while (value >= num) {
			out += sym;
			value -= num;
		}
	}
	return out;
}

function romanToNumber(roman: string): number {
	const trimmed = roman.trim().toUpperCase();
	if (!trimmed) throw new Error("Enter a Roman numeral.");
	if (!ROMAN_PATTERN.test(trimmed)) throw new Error("Invalid Roman numeral. Use standard notation (I, V, X, L, C, D, M).");

	let i = 0;
	let value = 0;
	for (const [num, sym] of ROMAN_TABLE) {
		while (trimmed.startsWith(sym, i)) {
			value += num;
			i += sym.length;
		}
	}
	return value;
}

export default function RomanNumeralConverter() {
	const [mode, setMode] = useState<Mode>("to-roman");
	const [input, setInput] = useState("");
	const { copy, isCopied } = useClipboard();

	const result = useMemo(() => {
		if (!input.trim()) return { output: "", error: null as string | null };
		try {
			if (mode === "to-roman") {
				const n = Number(input);
				if (!Number.isFinite(n)) throw new Error("Enter a valid integer.");
				return { output: numberToRoman(n), error: null };
			}
			return { output: String(romanToNumber(input)), error: null };
		} catch (err) {
			return {
				output: "",
				error: err instanceof Error ? err.message : "Conversion failed",
			};
		}
	}, [input, mode]);

	const swap = () => {
		setMode((m) => (m === "to-roman" ? "to-number" : "to-roman"));
		setInput(result.output || "");
	};

	const sourceLabel = mode === "to-roman" ? "Number" : "Roman numeral";
	const targetLabel = mode === "to-roman" ? "Roman numeral" : "Number";
	const placeholder = mode === "to-roman" ? "e.g. 1994" : "e.g. MCMXCIV";

	return (
		<div className={styles.container}>
			<div className={`flex gap-2 mb-6 ${styles.tabBar}`}>
				<button
					onClick={() => { setMode("to-roman"); setInput(""); }}
					className={`${styles.tab} ${mode === "to-roman" ? styles.activeTab : ""}`}
				>
					Number → Roman
				</button>
				<button
					onClick={() => { setMode("to-number"); setInput(""); }}
					className={`${styles.tab} ${mode === "to-number" ? styles.activeTab : ""}`}
				>
					Roman → Number
				</button>
			</div>

			<div className={styles.glassCard}>
				<div className="flex justify-between items-center mb-4 flex-wrap gap-4">
					<h3 className={`text-lg font-semibold m-0 ${styles.cardTitle}`}>
						{sourceLabel}
					</h3>
					<button
						type="button"
						onClick={swap}
						className={styles.btnSecondary}
						title="Swap direction"
					>
						<ArrowsRightLeftIcon className="w-4 h-4" />
						Swap
					</button>
				</div>

				<label htmlFor="roman-input" className="sr-only">
					{sourceLabel} input
				</label>
				<input
					id="roman-input"
					type={mode === "to-roman" ? "number" : "text"}
					value={input}
					onChange={(e) => setInput(e.target.value)}
					placeholder={placeholder}
					className={styles.input}
					spellCheck={false}
					min={mode === "to-roman" ? 1 : undefined}
					max={mode === "to-roman" ? 3999 : undefined}
				/>
			</div>

			{result.error && (
				<div className={`mt-4 px-4 py-3 text-sm ${styles.errorBox}`}>
					{result.error}
				</div>
			)}

			<div className={`mt-4 ${styles.glassCard}`}>
				<div className="flex justify-between items-center mb-4 flex-wrap gap-4">
					<h3 className={`text-lg font-semibold m-0 ${styles.cardTitle}`}>
						{targetLabel}
					</h3>
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

				<div className={styles.outputDisplay}>
					{result.output || <span className={styles.placeholder}>Result will appear here</span>}
				</div>
			</div>

			<div className={`mt-6 ${styles.glassCard}`}>
				<h3 className={`text-lg font-semibold mb-4 m-0 ${styles.cardTitle}`}>
					Symbol reference
				</h3>
				<div className={`grid grid-cols-2 md:grid-cols-4 gap-3 ${styles.symbolGrid}`}>
					{[
						["I", "1"],
						["V", "5"],
						["X", "10"],
						["L", "50"],
						["C", "100"],
						["D", "500"],
						["M", "1000"],
					].map(([sym, val]) => (
						<div key={sym} className={styles.symbolCell}>
							<span className={styles.symbol}>{sym}</span>
							<span className={styles.symbolValue}>{val}</span>
						</div>
					))}
				</div>
				<p className={`text-sm leading-relaxed mt-4 m-0 ${styles.infoText}`}>
					Standard range is <code>1</code> to <code>3999</code>. Larger values traditionally use the vinculum (an overline meaning &times;1000), which is not supported in this tool.
				</p>
			</div>
		</div>
	);
}
