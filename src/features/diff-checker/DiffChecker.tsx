"use client";

import { useState, useCallback, useMemo } from "react";
import {
	ClipboardDocumentIcon,
	CheckIcon,
	ArrowsRightLeftIcon,
	TrashIcon,
	MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import styles from "./DiffChecker.module.scss";

interface DiffLine {
	type: "added" | "removed" | "unchanged";
	content: string;
	leftLineNum: number | null;
	rightLineNum: number | null;
}

interface DiffOptions {
	ignoreWhitespace: boolean;
	ignoreCase: boolean;
	trimLines: boolean;
}

function normalizeLine(line: string, options: DiffOptions): string {
	let normalized = line;
	if (options.trimLines) {
		normalized = normalized.trim();
	}
	if (options.ignoreWhitespace) {
		normalized = normalized.replace(/\s+/g, " ");
	}
	if (options.ignoreCase) {
		normalized = normalized.toLowerCase();
	}
	return normalized;
}

/**
 * Compute the Longest Common Subsequence table for two arrays of strings.
 * Returns a 2D array where lcs[i][j] is the LCS length of
 * left[0..i-1] and right[0..j-1].
 */
function buildLCSTable(left: string[], right: string[], options: DiffOptions): number[][] {
	const m = left.length;
	const n = right.length;
	const table: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

	for (let i = 1; i <= m; i++) {
		for (let j = 1; j <= n; j++) {
			if (normalizeLine(left[i - 1], options) === normalizeLine(right[j - 1], options)) {
				table[i][j] = table[i - 1][j - 1] + 1;
			} else {
				table[i][j] = Math.max(table[i - 1][j], table[i][j - 1]);
			}
		}
	}

	return table;
}

/**
 * Backtrack through the LCS table to produce a line-by-line diff.
 */
function computeDiff(original: string, modified: string, options: DiffOptions): DiffLine[] {
	const leftLines = original.split("\n");
	const rightLines = modified.split("\n");
	const table = buildLCSTable(leftLines, rightLines, options);

	const result: DiffLine[] = [];
	let i = leftLines.length;
	let j = rightLines.length;

	while (i > 0 || j > 0) {
		if (
			i > 0 &&
			j > 0 &&
			normalizeLine(leftLines[i - 1], options) === normalizeLine(rightLines[j - 1], options)
		) {
			result.push({
				type: "unchanged",
				content: leftLines[i - 1],
				leftLineNum: i,
				rightLineNum: j,
			});
			i--;
			j--;
		} else if (j > 0 && (i === 0 || table[i][j - 1] >= table[i - 1][j])) {
			result.push({
				type: "added",
				content: rightLines[j - 1],
				leftLineNum: null,
				rightLineNum: j,
			});
			j--;
		} else if (i > 0) {
			result.push({
				type: "removed",
				content: leftLines[i - 1],
				leftLineNum: i,
				rightLineNum: null,
			});
			i--;
		}
	}

	return result.reverse();
}

export default function DiffChecker() {
	const [original, setOriginal] = useState("");
	const [modified, setModified] = useState("");
	const [options, setOptions] = useState<DiffOptions>({
		ignoreWhitespace: false,
		ignoreCase: false,
		trimLines: false,
	});
	const [copiedField, setCopiedField] = useState<string | null>(null);

	const diff = useMemo(() => {
		if (!original && !modified) return [];
		return computeDiff(original, modified, options);
	}, [original, modified, options]);

	const stats = useMemo(() => {
		let added = 0;
		let removed = 0;
		let unchanged = 0;
		for (const line of diff) {
			if (line.type === "added") added++;
			else if (line.type === "removed") removed++;
			else unchanged++;
		}
		return { added, removed, unchanged };
	}, [diff]);

	const handleSwap = useCallback(() => {
		setOriginal((prev) => {
			const currentModified = modified;
			setModified(prev);
			return currentModified;
		});
	}, [modified]);

	const handleClear = useCallback(() => {
		setOriginal("");
		setModified("");
	}, []);

	const handleCopy = useCallback(async (text: string, field: string) => {
		try {
			await navigator.clipboard.writeText(text);
			setCopiedField(field);
			setTimeout(() => setCopiedField(null), 2000);
		} catch (err) {
			console.error("Failed to copy:", err);
		}
	}, []);

	const diffOutputText = useMemo(() => {
		return diff
			.map((line) => {
				const prefix =
					line.type === "added" ? "+ " : line.type === "removed" ? "- " : "  ";
				return prefix + line.content;
			})
			.join("\n");
	}, [diff]);

	const toggleOption = useCallback((key: keyof DiffOptions) => {
		setOptions((prev) => ({ ...prev, [key]: !prev[key] }));
	}, []);

	return (
		<div className={styles.container}>
			{/* Options Bar */}
			<div className={`flex flex-wrap items-center gap-6 px-6 py-4 mb-6 ${styles.optionsBar}`}>
				<div className={`flex items-center gap-2 ${styles.optionGroup}`}>
					<label className={`flex items-center gap-2 text-sm font-medium cursor-pointer ${styles.checkboxLabel}`}>
						<input
							type="checkbox"
							checked={options.ignoreWhitespace}
							onChange={() => toggleOption("ignoreWhitespace")}
							className={`w-4 h-4 cursor-pointer ${styles.checkbox}`}
						/>
						Ignore whitespace
					</label>
				</div>

				<div className={`flex items-center gap-2 ${styles.optionGroup}`}>
					<label className={`flex items-center gap-2 text-sm font-medium cursor-pointer ${styles.checkboxLabel}`}>
						<input
							type="checkbox"
							checked={options.ignoreCase}
							onChange={() => toggleOption("ignoreCase")}
							className={`w-4 h-4 cursor-pointer ${styles.checkbox}`}
						/>
						Ignore case
					</label>
				</div>

				<div className={`flex items-center gap-2 ${styles.optionGroup}`}>
					<label className={`flex items-center gap-2 text-sm font-medium cursor-pointer ${styles.checkboxLabel}`}>
						<input
							type="checkbox"
							checked={options.trimLines}
							onChange={() => toggleOption("trimLines")}
							className={`w-4 h-4 cursor-pointer ${styles.checkbox}`}
						/>
						Trim lines
					</label>
				</div>

				<div className="flex items-center gap-2 ml-auto">
					<button onClick={handleSwap} className={styles.btnSecondary} title="Swap original and modified">
						<ArrowsRightLeftIcon className="w-4 h-4" />
						Swap
					</button>
					<button onClick={handleClear} className={styles.btnSecondary} disabled={!original && !modified}>
						<TrashIcon className="w-4 h-4" />
						Clear
					</button>
				</div>
			</div>

			{/* Input Panels */}
			<div className={`grid gap-4 mb-6 ${styles.inputGrid}`}>
				{/* Original Panel */}
				<div className={styles.glassCard}>
					<div className={`flex justify-between items-center mb-4 ${styles.cardHeader}`}>
						<h3 className={`text-lg font-semibold m-0 ${styles.cardTitle}`}>Original</h3>
						<span className={`text-xs ${styles.lineCount}`}>
							{original ? original.split("\n").length : 0} lines
						</span>
					</div>
					<textarea
						value={original}
						onChange={(e) => setOriginal(e.target.value)}
						placeholder="Paste original text here..."
						className={styles.textarea}
						spellCheck={false}
					/>
				</div>

				{/* Modified Panel */}
				<div className={styles.glassCard}>
					<div className={`flex justify-between items-center mb-4 ${styles.cardHeader}`}>
						<h3 className={`text-lg font-semibold m-0 ${styles.cardTitle}`}>Modified</h3>
						<span className={`text-xs ${styles.lineCount}`}>
							{modified ? modified.split("\n").length : 0} lines
						</span>
					</div>
					<textarea
						value={modified}
						onChange={(e) => setModified(e.target.value)}
						placeholder="Paste modified text here..."
						className={styles.textarea}
						spellCheck={false}
					/>
				</div>
			</div>

			{/* Stats Bar */}
			{diff.length > 0 && (
				<div className={`flex flex-wrap items-center gap-6 px-6 py-3 mb-6 ${styles.statsBar}`}>
					<div className={`flex items-center gap-2 ${styles.statItem}`}>
						<MagnifyingGlassIcon className="w-4 h-4" />
						<span className="text-sm font-medium">Diff Results</span>
					</div>
					<div className={`flex items-center gap-4 ml-auto ${styles.statCounts}`}>
						<span className={`text-sm font-mono ${styles.statAdded}`}>
							+{stats.added} added
						</span>
						<span className={`text-sm font-mono ${styles.statRemoved}`}>
							-{stats.removed} removed
						</span>
						<span className={`text-sm font-mono ${styles.statUnchanged}`}>
							{stats.unchanged} unchanged
						</span>
					</div>
					<button
						onClick={() => handleCopy(diffOutputText, "diff")}
						className={`${styles.btnPrimary} ${copiedField === "diff" ? styles.copied : ""}`}
						disabled={!diffOutputText}
					>
						{copiedField === "diff" ? (
							<>
								<CheckIcon className="w-4 h-4" />
								Copied!
							</>
						) : (
							<>
								<ClipboardDocumentIcon className="w-4 h-4" />
								Copy Diff
							</>
						)}
					</button>
				</div>
			)}

			{/* Diff Output */}
			{diff.length > 0 && (
				<div className={styles.glassCard}>
					<h3 className={`text-lg font-semibold mb-4 m-0 ${styles.sectionTitle}`}>
						Comparison Output
					</h3>
					<div className={styles.diffOutput}>
						{diff.map((line, index) => (
							<div
								key={index}
								className={`${styles.diffLine} ${
									line.type === "added"
										? styles.diffLineAdded
										: line.type === "removed"
										? styles.diffLineRemoved
										: styles.diffLineUnchanged
								}`}
							>
								<span className={styles.lineNum}>
									{line.leftLineNum ?? ""}
								</span>
								<span className={styles.lineNum}>
									{line.rightLineNum ?? ""}
								</span>
								<span className={styles.linePrefix}>
									{line.type === "added" ? "+" : line.type === "removed" ? "-" : " "}
								</span>
								<span className={styles.lineContent}>
									{line.content || "\u00A0"}
								</span>
							</div>
						))}
					</div>
				</div>
			)}

			{/* Empty State */}
			{diff.length === 0 && (original || modified) && (
				<div className={`flex items-center justify-center py-12 ${styles.glassCard}`}>
					<p className={`text-sm m-0 ${styles.emptyText}`}>
						Enter text in both panels to see the diff.
					</p>
				</div>
			)}
		</div>
	);
}
