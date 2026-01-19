"use client";

import { useState, useCallback, useEffect } from "react";
import { ClipboardDocumentIcon, CheckIcon } from "@heroicons/react/24/outline";
import styles from "./PercentageCalculator.module.scss";

type CalculationMode = "findPercentage" | "findPart" | "findWhole";

export default function PercentageCalculator() {
	// Mode 1: What % is [part] of [whole]?
	// Mode 2: What is [percentage]% of [whole]?
	// Mode 3: [part] is [percentage]% of what?

	const [whole, setWhole] = useState<string>("");
	const [part, setPart] = useState<string>("");
	const [percentage, setPercentage] = useState<string>("");
	const [lastEdited, setLastEdited] = useState<CalculationMode | null>(null);
	const [copiedField, setCopiedField] = useState<string | null>(null);

	const formatNumber = (num: number): string => {
		const rounded = Math.round(num * 10000) / 10000;
		return rounded.toString();
	};

	const calculate = useCallback(() => {
		const wholeNum = parseFloat(whole);
		const partNum = parseFloat(part);
		const percentNum = parseFloat(percentage);

		const hasWhole = !isNaN(wholeNum) && whole !== "";
		const hasPart = !isNaN(partNum) && part !== "";
		const hasPercent = !isNaN(percentNum) && percentage !== "";

		// Count how many fields have values
		const filledCount = [hasWhole, hasPart, hasPercent].filter(Boolean).length;

		if (filledCount < 2) return;

		// Calculate the missing field based on which two are filled
		if (hasWhole && hasPart && !hasPercent) {
			// Calculate percentage: (part / whole) * 100
			if (wholeNum !== 0) {
				const result = (partNum / wholeNum) * 100;
				setPercentage(formatNumber(result));
			}
		} else if (hasWhole && hasPercent && !hasPart) {
			// Calculate part: (percentage / 100) * whole
			const result = (percentNum / 100) * wholeNum;
			setPart(formatNumber(result));
		} else if (hasPart && hasPercent && !hasWhole) {
			// Calculate whole: part / (percentage / 100)
			if (percentNum !== 0) {
				const result = partNum / (percentNum / 100);
				setWhole(formatNumber(result));
			}
		}
	}, [whole, part, percentage]);

	useEffect(() => {
		calculate();
	}, [calculate]);

	const handleWholeChange = (value: string) => {
		setWhole(value);
		setLastEdited("findPercentage");
		// Clear the calculated field if we're overwriting
		if (lastEdited === "findWhole") {
			setPercentage("");
		}
	};

	const handlePartChange = (value: string) => {
		setPart(value);
		setLastEdited("findPart");
		if (lastEdited === "findPart") {
			setPercentage("");
		}
	};

	const handlePercentageChange = (value: string) => {
		setPercentage(value);
		setLastEdited("findPercentage");
		if (lastEdited === "findPercentage") {
			setPart("");
		}
	};

	const copyToClipboard = async (value: string, field: string) => {
		try {
			await navigator.clipboard.writeText(value);
			setCopiedField(field);
			setTimeout(() => setCopiedField(null), 2000);
		} catch (err) {
			console.error("Failed to copy:", err);
		}
	};

	const clearAll = () => {
		setWhole("");
		setPart("");
		setPercentage("");
		setLastEdited(null);
	};

	// Common percentage calculations for quick access
	const quickCalcs = [
		{ label: "10% of 100", whole: "100", percentage: "10" },
		{ label: "15% of 80", whole: "80", percentage: "15" },
		{ label: "20% of 50", whole: "50", percentage: "20" },
		{ label: "25% of 200", whole: "200", percentage: "25" },
		{ label: "33% of 90", whole: "90", percentage: "33" },
		{ label: "50% of 150", whole: "150", percentage: "50" },
	];

	const applyQuickCalc = (calc: { whole: string; percentage: string }) => {
		setWhole(calc.whole);
		setPercentage(calc.percentage);
		setPart("");
		setLastEdited("findPart");
	};

	return (
		<div className={styles.container}>
			{/* Main Calculator */}
			<div className={styles.glassCard}>
				<div className="flex justify-between items-center mb-6">
					<h2 className={styles.sectionTitle}>Percentage Calculator</h2>
					<button onClick={clearAll} className={styles.clearBtn}>
						Clear All
					</button>
				</div>

				<p className="text-sm text-gray-400 mb-6">Enter any two values to calculate the third automatically.</p>

				<div className="grid gap-6 md:grid-cols-3">
					{/* Whole Input */}
					<div className="flex flex-col gap-2">
						<label className={styles.inputLabel}>Whole (Total)</label>
						<div className={styles.inputWrapper}>
							<input type="number" inputMode="decimal" value={whole} onChange={(e) => handleWholeChange(e.target.value)} className={styles.input} placeholder="e.g., 100" />
							<button
								className={`${styles.copyBtn} ${copiedField === "whole" ? styles.copied : ""}`}
								onClick={() => copyToClipboard(whole, "whole")}
								title="Copy to clipboard"
								disabled={!whole}
							>
								{copiedField === "whole" ? <CheckIcon className={styles.copyIcon} /> : <ClipboardDocumentIcon className={styles.copyIcon} />}
							</button>
						</div>
						<span className="text-xs text-gray-500">The total amount (100%)</span>
					</div>

					{/* Part Input */}
					<div className="flex flex-col gap-2">
						<label className={styles.inputLabel}>Part</label>
						<div className={styles.inputWrapper}>
							<input type="number" inputMode="decimal" value={part} onChange={(e) => handlePartChange(e.target.value)} className={styles.input} placeholder="e.g., 25" />
							<button
								className={`${styles.copyBtn} ${copiedField === "part" ? styles.copied : ""}`}
								onClick={() => copyToClipboard(part, "part")}
								title="Copy to clipboard"
								disabled={!part}
							>
								{copiedField === "part" ? <CheckIcon className={styles.copyIcon} /> : <ClipboardDocumentIcon className={styles.copyIcon} />}
							</button>
						</div>
						<span className="text-xs text-gray-500">The portion of the whole</span>
					</div>

					{/* Percentage Input */}
					<div className="flex flex-col gap-2">
						<label className={styles.inputLabel}>Percentage</label>
						<div className={styles.inputWrapper}>
							<input type="number" inputMode="decimal" value={percentage} onChange={(e) => handlePercentageChange(e.target.value)} className={styles.input} placeholder="e.g., 25" />
							<span className={styles.unitLabel}>%</span>
							<button
								className={`${styles.copyBtn} ${copiedField === "percentage" ? styles.copied : ""}`}
								onClick={() => copyToClipboard(percentage + "%", "percentage")}
								title="Copy to clipboard"
								disabled={!percentage}
							>
								{copiedField === "percentage" ? <CheckIcon className={styles.copyIcon} /> : <ClipboardDocumentIcon className={styles.copyIcon} />}
							</button>
						</div>
						<span className="text-xs text-gray-500">The percentage value</span>
					</div>
				</div>

				{/* Result Summary */}
				{whole && part && percentage && (
					<div className={styles.resultBox}>
						<p className="text-center text-lg">
							<span className="font-semibold text-white">{part}</span>
							<span className="text-gray-400"> is </span>
							<span className={`font-semibold ${styles.textAccent}`}>{percentage}%</span>
							<span className="text-gray-400"> of </span>
							<span className="font-semibold text-white">{whole}</span>
						</p>
					</div>
				)}
			</div>

			{/* Quick Calculations */}
			<div className={styles.glassCard}>
				<h2 className={styles.sectionTitle}>Quick Examples</h2>
				<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
					{quickCalcs.map((calc, idx) => (
						<button key={idx} onClick={() => applyQuickCalc(calc)} className={styles.quickBtn}>
							{calc.label}
						</button>
					))}
				</div>
			</div>

			{/* Common Use Cases */}
			<div className={styles.glassCard}>
				<h2 className={styles.sectionTitle}>Common Formulas</h2>
				<div className="grid gap-4 md:grid-cols-3">
					<div className={styles.formulaCard}>
						<h3 className="font-semibold text-white mb-2">Find Percentage</h3>
						<code className={styles.formula}>Percentage = (Part ÷ Whole) × 100</code>
						<p className="text-sm text-gray-400 mt-2">&quot;What % is 25 of 100?&quot; → 25%</p>
					</div>
					<div className={styles.formulaCard}>
						<h3 className="font-semibold text-white mb-2">Find Part</h3>
						<code className={styles.formula}>Part = (Percentage ÷ 100) × Whole</code>
						<p className="text-sm text-gray-400 mt-2">&quot;What is 25% of 100?&quot; → 25</p>
					</div>
					<div className={styles.formulaCard}>
						<h3 className="font-semibold text-white mb-2">Find Whole</h3>
						<code className={styles.formula}>Whole = Part ÷ (Percentage ÷ 100)</code>
						<p className="text-sm text-gray-400 mt-2">&quot;25 is 25% of what?&quot; → 100</p>
					</div>
				</div>
			</div>

			{/* Use Cases */}
			<div className={styles.glassCard}>
				<h2 className={styles.sectionTitle}>Common Use Cases</h2>
				<div className="grid gap-4 md:grid-cols-2">
					<div className="text-sm text-gray-300">
						<h3 className="font-semibold text-white mb-2">Discounts & Sales</h3>
						<p>Calculate sale prices: &quot;20% off $80&quot; = $16 discount</p>
					</div>
					<div className="text-sm text-gray-300">
						<h3 className="font-semibold text-white mb-2">Grades & Scores</h3>
						<p>Find your score: &quot;42 out of 50&quot; = 84%</p>
					</div>
					<div className="text-sm text-gray-300">
						<h3 className="font-semibold text-white mb-2">Tax Calculations</h3>
						<p>Add tax: &quot;8.5% of $120&quot; = $10.20 tax</p>
					</div>
					<div className="text-sm text-gray-300">
						<h3 className="font-semibold text-white mb-2">Growth & Change</h3>
						<p>Track changes: &quot;From 80 to 100&quot; = 25% increase</p>
					</div>
				</div>
			</div>
		</div>
	);
}
