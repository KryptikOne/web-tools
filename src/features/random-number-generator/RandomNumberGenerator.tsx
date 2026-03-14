"use client";

import { useState, useCallback } from "react";
import {
	ClipboardDocumentIcon,
	CheckIcon,
	TrashIcon,
	ArrowPathIcon,
	BoltIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import styles from "./RandomNumberGenerator.module.scss";

interface Preset {
	label: string;
	min: number;
	max: number;
	isInteger: boolean;
}

interface HistoryEntry {
	numbers: number[];
	min: number;
	max: number;
	isInteger: boolean;
	timestamp: number;
}

const PRESETS: Preset[] = [
	{ label: "Coin Flip (0-1)", min: 0, max: 1, isInteger: true },
	{ label: "Dice Roll (1-6)", min: 1, max: 6, isInteger: true },
	{ label: "Percentage (0-100)", min: 0, max: 100, isInteger: true },
	{ label: "Byte (0-255)", min: 0, max: 255, isInteger: true },
];

function cryptoRandom(): number {
	const array = new Uint32Array(1);
	crypto.getRandomValues(array);
	return array[0] / (0xffffffff + 1);
}

function generateNumber(
	min: number,
	max: number,
	isInteger: boolean,
	decimalPlaces: number
): number {
	const raw = cryptoRandom() * (max - min) + min;
	if (isInteger) {
		return Math.floor(raw + (max === min ? 0 : Number.EPSILON));
	}
	return parseFloat(raw.toFixed(decimalPlaces));
}

export default function RandomNumberGenerator() {
	const [min, setMin] = useState(1);
	const [max, setMax] = useState(100);
	const [isInteger, setIsInteger] = useState(true);
	const [decimalPlaces, setDecimalPlaces] = useState(2);
	const [count, setCount] = useState(1);
	const [allowDuplicates, setAllowDuplicates] = useState(true);
	const [sortResults, setSortResults] = useState(false);
	const [results, setResults] = useState<number[]>([]);
	const [copied, setCopied] = useState(false);
	const [history, setHistory] = useState<HistoryEntry[]>([]);

	const generate = useCallback(() => {
		const effectiveMin = Math.min(min, max);
		const effectiveMax = Math.max(min, max);
		const generated: number[] = [];

		// Calculate max unique values for duplicate prevention
		let maxUnique = Infinity;
		if (!allowDuplicates && isInteger) {
			maxUnique = effectiveMax - effectiveMin + 1;
		}

		const targetCount = allowDuplicates
			? count
			: Math.min(count, maxUnique);

		let attempts = 0;
		const maxAttempts = targetCount * 100;

		while (generated.length < targetCount && attempts < maxAttempts) {
			const num = generateNumber(
				effectiveMin,
				effectiveMax,
				isInteger,
				decimalPlaces
			);
			if (allowDuplicates || !generated.includes(num)) {
				generated.push(num);
			}
			attempts++;
		}

		if (sortResults) {
			generated.sort((a, b) => a - b);
		}

		setResults(generated);
		setHistory((prev) => [
			{
				numbers: generated,
				min: effectiveMin,
				max: effectiveMax,
				isInteger,
				timestamp: Date.now(),
			},
			...prev.slice(0, 19),
		]);
	}, [min, max, isInteger, decimalPlaces, count, allowDuplicates, sortResults]);

	const applyPreset = (preset: Preset) => {
		setMin(preset.min);
		setMax(preset.max);
		setIsInteger(preset.isInteger);
		setCount(1);
		setAllowDuplicates(true);
		setSortResults(false);
	};

	const copyResults = useCallback(async () => {
		if (results.length === 0) return;
		const text = results.join(", ");
		try {
			await navigator.clipboard.writeText(text);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch {
			// Clipboard access denied
		}
	}, [results]);

	const clearHistory = () => {
		setHistory([]);
	};

	const isValid = !isNaN(min) && !isNaN(max) && count > 0 && count <= 1000;

	return (
		<div className={styles.container}>
			<div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6`}>
				{/* Controls */}
				<div className={styles.glassCard}>
					<h2 className={`mb-4 ${styles.sectionTitle}`}>Settings</h2>

					{/* Presets */}
					<div className="mb-5">
						<label className={`block text-sm font-medium mb-2 ${styles.label}`}>
							Presets
						</label>
						<div className="flex flex-wrap gap-2">
							{PRESETS.map((preset) => (
								<button
									key={preset.label}
									className={styles.presetBtn}
									onClick={() => applyPreset(preset)}
								>
									<BoltIcon className="w-3.5 h-3.5" />
									{preset.label}
								</button>
							))}
						</div>
					</div>

					{/* Min / Max */}
					<div className="grid grid-cols-2 gap-4 mb-4">
						<div>
							<label className={`block text-sm font-medium mb-2 ${styles.label}`}>
								Minimum
							</label>
							<input
								type="number"
								value={min}
								onChange={(e) => setMin(parseFloat(e.target.value))}
								className={styles.input}
							/>
						</div>
						<div>
							<label className={`block text-sm font-medium mb-2 ${styles.label}`}>
								Maximum
							</label>
							<input
								type="number"
								value={max}
								onChange={(e) => setMax(parseFloat(e.target.value))}
								className={styles.input}
							/>
						</div>
					</div>

					{/* Integer / Decimal Toggle */}
					<div className="mb-4">
						<label className={`block text-sm font-medium mb-2 ${styles.label}`}>
							Number Type
						</label>
						<div className="flex gap-2">
							<button
								className={`${styles.toggleBtn} ${isInteger ? styles.active : ""}`}
								onClick={() => setIsInteger(true)}
							>
								Integer
							</button>
							<button
								className={`${styles.toggleBtn} ${!isInteger ? styles.active : ""}`}
								onClick={() => setIsInteger(false)}
							>
								Decimal
							</button>
						</div>
					</div>

					{/* Decimal Places */}
					{!isInteger && (
						<div className="mb-4">
							<label className={`block text-sm font-medium mb-2 ${styles.label}`}>
								Decimal Places
							</label>
							<select
								value={decimalPlaces}
								onChange={(e) => setDecimalPlaces(parseInt(e.target.value))}
								className={styles.input}
							>
								{[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
									<option key={n} value={n}>
										{n}
									</option>
								))}
							</select>
						</div>
					)}

					{/* Count */}
					<div className="mb-4">
						<label className={`block text-sm font-medium mb-2 ${styles.label}`}>
							How many numbers
						</label>
						<input
							type="number"
							min={1}
							max={1000}
							value={count}
							onChange={(e) =>
								setCount(
									Math.max(1, Math.min(1000, parseInt(e.target.value) || 1))
								)
							}
							className={styles.input}
						/>
					</div>

					{/* Options */}
					<div className="flex flex-col gap-3 mb-5">
						<label className={`flex items-center gap-3 cursor-pointer ${styles.checkboxLabel}`}>
							<input
								type="checkbox"
								checked={allowDuplicates}
								onChange={(e) => setAllowDuplicates(e.target.checked)}
								className={styles.checkbox}
							/>
							<span className="text-sm">Allow duplicates</span>
						</label>
						<label className={`flex items-center gap-3 cursor-pointer ${styles.checkboxLabel}`}>
							<input
								type="checkbox"
								checked={sortResults}
								onChange={(e) => setSortResults(e.target.checked)}
								className={styles.checkbox}
							/>
							<span className="text-sm">Sort results</span>
						</label>
					</div>

					{/* Generate Button */}
					<Button
						onClick={generate}
						disabled={!isValid}
						className={`w-full items-center justify-center gap-2 text-lg font-bold ${styles.generateBtn}`}
					>
						<ArrowPathIcon className="w-5 h-5" />
						Generate
					</Button>
				</div>

				{/* Results */}
				<div className={styles.glassCard}>
					<div className="flex justify-between items-center mb-4">
						<h2 className={styles.sectionTitle}>Results</h2>
						{results.length > 0 && (
							<button
								onClick={copyResults}
								className={`${styles.copyBtn} ${copied ? styles.copied : ""}`}
								title="Copy to clipboard"
							>
								{copied ? (
									<CheckIcon className="w-4 h-4" />
								) : (
									<ClipboardDocumentIcon className="w-4 h-4" />
								)}
								{copied ? "Copied" : "Copy"}
							</button>
						)}
					</div>

					{results.length > 0 ? (
						<div className={styles.resultsArea}>
							<div className="flex flex-wrap gap-2">
								{results.map((num, i) => (
									<span key={i} className={styles.resultNumber}>
										{num}
									</span>
								))}
							</div>
							{results.length > 1 && (
								<div className={`flex gap-6 mt-4 pt-4 ${styles.statBar}`}>
									<div className={styles.stat}>
										<span className={styles.statLabel}>Count</span>
										<span className={styles.statValue}>{results.length}</span>
									</div>
									<div className={styles.stat}>
										<span className={styles.statLabel}>Sum</span>
										<span className={styles.statValue}>
											{parseFloat(
												results.reduce((a, b) => a + b, 0).toFixed(4)
											)}
										</span>
									</div>
									<div className={styles.stat}>
										<span className={styles.statLabel}>Min</span>
										<span className={styles.statValue}>
											{Math.min(...results)}
										</span>
									</div>
									<div className={styles.stat}>
										<span className={styles.statLabel}>Max</span>
										<span className={styles.statValue}>
											{Math.max(...results)}
										</span>
									</div>
								</div>
							)}
						</div>
					) : (
						<div className={styles.emptyState}>
							<p className="text-sm">
								Configure your settings and click Generate to create random
								numbers.
							</p>
						</div>
					)}
				</div>
			</div>

			{/* History */}
			{history.length > 0 && (
				<div className={`mb-6 ${styles.glassCard}`}>
					<div className="flex justify-between items-center mb-4">
						<h2 className={styles.sectionTitle}>History</h2>
						<Button
							onClick={clearHistory}
							className={`flex items-center ${styles.clearHistoryBtn}`}
						>
							<TrashIcon className="w-4 h-4" />
							Clear
						</Button>
					</div>
					<div className={`flex flex-col gap-2 ${styles.historyList}`}>
						{history.map((entry, index) => (
							<div
								key={entry.timestamp}
								className={`flex items-center gap-4 ${styles.historyEntry}`}
							>
								<span className={`text-sm font-semibold ${styles.historyIndex}`}>
									#{history.length - index}
								</span>
								<div className="flex flex-wrap gap-1.5 flex-1 min-w-0">
									{entry.numbers.slice(0, 20).map((num, i) => (
										<span key={i} className={styles.historyNumber}>
											{num}
										</span>
									))}
									{entry.numbers.length > 20 && (
										<span className={styles.historyMore}>
											+{entry.numbers.length - 20} more
										</span>
									)}
								</div>
								<span className={`text-xs whitespace-nowrap ${styles.historyRange}`}>
									[{entry.min}, {entry.max}]
								</span>
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
}
