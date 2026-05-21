"use client";

import { useMemo, useState } from "react";
import {
	ClipboardDocumentIcon,
	CheckIcon,
	TrashIcon,
} from "@heroicons/react/24/outline";
import { useClipboard } from "@/hooks/useClipboard";
import styles from "./ListConverter.module.scss";

type Separator = "newline" | "comma" | "space" | "tab" | "custom";
type SortMode = "none" | "asc" | "desc";
type CaseMode = "none" | "lower" | "upper";
type Quote = "none" | "single" | "double";

const SEPARATOR_VALUES: Record<Exclude<Separator, "custom">, string> = {
	newline: "\n",
	comma: ",",
	space: " ",
	tab: "\t",
};

function resolveSep(kind: Separator, custom: string): string {
	if (kind === "custom") return custom;
	return SEPARATOR_VALUES[kind];
}

function splitList(input: string, sep: string): string[] {
	if (!sep) return input ? [input] : [];
	if (sep === "\n") return input.split(/\r?\n/);
	return input.split(sep);
}

export default function ListConverter() {
	const [input, setInput] = useState("");

	// Pipeline options
	const [inputSeparator, setInputSeparator] = useState<Separator>("newline");
	const [inputCustomSep, setInputCustomSep] = useState(",");
	const [trim, setTrim] = useState(true);
	const [dropBlanks, setDropBlanks] = useState(true);
	const [dedupe, setDedupe] = useState(false);
	const [caseSensitiveDedupe, setCaseSensitiveDedupe] = useState(true);
	const [sortMode, setSortMode] = useState<SortMode>("none");
	const [reverse, setReverse] = useState(false);
	const [caseMode, setCaseMode] = useState<CaseMode>("none");
	const [prefix, setPrefix] = useState("");
	const [suffix, setSuffix] = useState("");
	const [quote, setQuote] = useState<Quote>("none");
	const [outputSeparator, setOutputSeparator] = useState<Separator>("comma");
	const [outputCustomSep, setOutputCustomSep] = useState(" | ");

	const { copy, isCopied } = useClipboard();

	const { output, itemCount } = useMemo(() => {
		if (!input) return { output: "", itemCount: 0 };

		const inSep = resolveSep(inputSeparator, inputCustomSep);
		let items = splitList(input, inSep);

		if (trim) items = items.map((s) => s.trim());
		if (dropBlanks) items = items.filter((s) => s.length > 0);

		if (dedupe) {
			const seen = new Set<string>();
			items = items.filter((item) => {
				const key = caseSensitiveDedupe ? item : item.toLowerCase();
				if (seen.has(key)) return false;
				seen.add(key);
				return true;
			});
		}

		if (sortMode !== "none") {
			items = [...items].sort((a, b) => a.localeCompare(b));
			if (sortMode === "desc") items.reverse();
		}

		if (reverse) items = [...items].reverse();

		if (caseMode === "lower") items = items.map((s) => s.toLowerCase());
		else if (caseMode === "upper") items = items.map((s) => s.toUpperCase());

		items = items.map((s) => `${prefix}${s}${suffix}`);

		if (quote !== "none") {
			const q = quote === "single" ? "'" : '"';
			items = items.map((s) => `${q}${s}${q}`);
		}

		const outSep = resolveSep(outputSeparator, outputCustomSep);
		return { output: items.join(outSep), itemCount: items.length };
	}, [
		input,
		inputSeparator,
		inputCustomSep,
		trim,
		dropBlanks,
		dedupe,
		caseSensitiveDedupe,
		sortMode,
		reverse,
		caseMode,
		prefix,
		suffix,
		quote,
		outputSeparator,
		outputCustomSep,
	]);

	return (
		<div className={styles.container}>
			{/* Options grid */}
			<div className={`p-4 mb-6 ${styles.optionsBar}`}>
				<div className={styles.optionsGrid}>
					{/* Input separator */}
					<div className={styles.optionGroup}>
						<label htmlFor="list-input-sep" className={styles.label}>Input separator</label>
						<select
							id="list-input-sep"
							value={inputSeparator}
							onChange={(e) => setInputSeparator(e.target.value as Separator)}
							className={styles.select}
						>
							<option value="newline">Newline</option>
							<option value="comma">Comma</option>
							<option value="space">Space</option>
							<option value="tab">Tab</option>
							<option value="custom">Custom</option>
						</select>
						{inputSeparator === "custom" && (
							<input
								type="text"
								value={inputCustomSep}
								onChange={(e) => setInputCustomSep(e.target.value)}
								className={`${styles.input} mt-2`}
								placeholder="Custom separator"
								aria-label="Custom input separator"
							/>
						)}
					</div>

					{/* Output separator */}
					<div className={styles.optionGroup}>
						<label htmlFor="list-output-sep" className={styles.label}>Output separator</label>
						<select
							id="list-output-sep"
							value={outputSeparator}
							onChange={(e) => setOutputSeparator(e.target.value as Separator)}
							className={styles.select}
						>
							<option value="newline">Newline</option>
							<option value="comma">Comma</option>
							<option value="space">Space</option>
							<option value="tab">Tab</option>
							<option value="custom">Custom</option>
						</select>
						{outputSeparator === "custom" && (
							<input
								type="text"
								value={outputCustomSep}
								onChange={(e) => setOutputCustomSep(e.target.value)}
								className={`${styles.input} mt-2`}
								placeholder="Custom separator"
								aria-label="Custom output separator"
							/>
						)}
					</div>

					{/* Sort */}
					<div className={styles.optionGroup}>
						<label htmlFor="list-sort" className={styles.label}>Sort</label>
						<select
							id="list-sort"
							value={sortMode}
							onChange={(e) => setSortMode(e.target.value as SortMode)}
							className={styles.select}
						>
							<option value="none">None</option>
							<option value="asc">A → Z</option>
							<option value="desc">Z → A</option>
						</select>
					</div>

					{/* Case */}
					<div className={styles.optionGroup}>
						<label htmlFor="list-case" className={styles.label}>Case</label>
						<select
							id="list-case"
							value={caseMode}
							onChange={(e) => setCaseMode(e.target.value as CaseMode)}
							className={styles.select}
						>
							<option value="none">Unchanged</option>
							<option value="lower">lowercase</option>
							<option value="upper">UPPERCASE</option>
						</select>
					</div>

					{/* Quote */}
					<div className={styles.optionGroup}>
						<label htmlFor="list-quote" className={styles.label}>Wrap in quotes</label>
						<select
							id="list-quote"
							value={quote}
							onChange={(e) => setQuote(e.target.value as Quote)}
							className={styles.select}
						>
							<option value="none">No quotes</option>
							<option value="single">Single &apos;...&apos;</option>
							<option value="double">Double &quot;...&quot;</option>
						</select>
					</div>

					{/* Prefix */}
					<div className={styles.optionGroup}>
						<label htmlFor="list-prefix" className={styles.label}>Prefix each</label>
						<input
							id="list-prefix"
							type="text"
							value={prefix}
							onChange={(e) => setPrefix(e.target.value)}
							className={styles.input}
							placeholder="(none)"
						/>
					</div>

					{/* Suffix */}
					<div className={styles.optionGroup}>
						<label htmlFor="list-suffix" className={styles.label}>Suffix each</label>
						<input
							id="list-suffix"
							type="text"
							value={suffix}
							onChange={(e) => setSuffix(e.target.value)}
							className={styles.input}
							placeholder="(none)"
						/>
					</div>
				</div>

				<div className={`mt-4 pt-4 border-t ${styles.checkboxRow}`}>
					<label className={styles.checkboxLabel}>
						<input
							type="checkbox"
							checked={trim}
							onChange={(e) => setTrim(e.target.checked)}
							className={styles.checkbox}
						/>
						Trim items
					</label>
					<label className={styles.checkboxLabel}>
						<input
							type="checkbox"
							checked={dropBlanks}
							onChange={(e) => setDropBlanks(e.target.checked)}
							className={styles.checkbox}
						/>
						Drop blanks
					</label>
					<label className={styles.checkboxLabel}>
						<input
							type="checkbox"
							checked={dedupe}
							onChange={(e) => setDedupe(e.target.checked)}
							className={styles.checkbox}
						/>
						Dedupe
					</label>
					{dedupe && (
						<label className={styles.checkboxLabel}>
							<input
								type="checkbox"
								checked={caseSensitiveDedupe}
								onChange={(e) => setCaseSensitiveDedupe(e.target.checked)}
								className={styles.checkbox}
							/>
							Case-sensitive dedupe
						</label>
					)}
					<label className={styles.checkboxLabel}>
						<input
							type="checkbox"
							checked={reverse}
							onChange={(e) => setReverse(e.target.checked)}
							className={styles.checkbox}
						/>
						Reverse order
					</label>
				</div>
			</div>

			{/* Input */}
			<div className={styles.glassCard}>
				<div className="flex justify-between items-center mb-4 flex-wrap gap-4">
					<h3 className={`text-lg font-semibold m-0 ${styles.cardTitle}`}>Input list</h3>
					<button
						onClick={() => setInput("")}
						className={styles.btnSecondary}
						disabled={!input}
					>
						<TrashIcon className="w-4 h-4" />
						Clear
					</button>
				</div>
				<label htmlFor="list-input" className="sr-only">List input</label>
				<textarea
					id="list-input"
					value={input}
					onChange={(e) => setInput(e.target.value)}
					placeholder={"apple\nbanana\ncherry"}
					className={styles.textarea}
					spellCheck={false}
				/>
			</div>

			{/* Output */}
			<div className={`mt-4 ${styles.glassCard}`}>
				<div className="flex justify-between items-center mb-4 flex-wrap gap-4">
					<div>
						<h3 className={`text-lg font-semibold m-0 ${styles.cardTitle}`}>Output</h3>
						<p className={`text-xs mt-1 m-0 ${styles.cardSubtitle}`}>
							{itemCount} item{itemCount === 1 ? "" : "s"}
						</p>
					</div>
					<button
						onClick={() => copy(output, "output")}
						className={`${styles.btnPrimary} ${isCopied("output") ? styles.copied : ""}`}
						disabled={!output}
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
					value={output}
					readOnly
					placeholder="Transformed list will appear here..."
					className={`${styles.textarea} ${styles.readOnly}`}
					spellCheck={false}
				/>
			</div>

			<div className={`mt-6 ${styles.glassCard}`}>
				<h3 className={`text-lg font-semibold mb-2 m-0 ${styles.cardTitle}`}>Pipeline order</h3>
				<p className={`text-sm leading-relaxed m-0 ${styles.infoText}`}>
					Operations apply in this order: <strong>split → trim → drop blanks → dedupe → sort → reverse → case → prefix &amp; suffix → quote → join</strong>.
					Knowing the order matters when, for example, the prefix should be quoted along with the item (it will be).
				</p>
			</div>
		</div>
	);
}
