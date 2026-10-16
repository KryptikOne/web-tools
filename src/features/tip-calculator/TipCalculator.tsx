"use client";

import { useState, useMemo } from "react";
import { ClipboardDocumentIcon, CheckIcon, UserIcon, UserGroupIcon, TrashIcon } from "@heroicons/react/24/outline";
import styles from "./TipCalculator.module.scss";

const TIP_PRESETS = [5, 10, 15, 18, 20, 25];

type CustomMode = "none" | "percent" | "dollar";

export default function TipCalculator() {
	const [billAmount, setBillAmount] = useState<string>("");
	const [tipPercent, setTipPercent] = useState<number>(18);
	const [customTipPercent, setCustomTipPercent] = useState<string>("");
	const [customTipDollar, setCustomTipDollar] = useState<string>("");
	const [customMode, setCustomMode] = useState<CustomMode>("none");
	const [splitCount, setSplitCount] = useState<number>(1);
	const [copiedField, setCopiedField] = useState<string | null>(null);

	const calculations = useMemo(() => {
		const bill = parseFloat(billAmount) || 0;

		let tipAmount = 0;
		let effectiveTip = tipPercent;

		if (customMode === "dollar") {
			// Custom dollar amount
			tipAmount = parseFloat(customTipDollar) || 0;
			effectiveTip = bill > 0 ? (tipAmount / bill) * 100 : 0;
		} else if (customMode === "percent") {
			// Custom percentage
			effectiveTip = parseFloat(customTipPercent) || 0;
			tipAmount = bill * (effectiveTip / 100);
		} else {
			// Preset percentage
			tipAmount = bill * (tipPercent / 100);
			effectiveTip = tipPercent;
		}

		const totalBill = bill + tipAmount;
		const perPersonBill = totalBill / splitCount;
		const perPersonTip = tipAmount / splitCount;

		return {
			tipAmount,
			totalBill,
			perPersonBill,
			perPersonTip,
			effectiveTip,
		};
	}, [billAmount, tipPercent, customTipPercent, customTipDollar, customMode, splitCount]);

	const formatCurrency = (amount: number): string => {
		return amount.toFixed(2);
	};

	const handlePresetClick = (percent: number) => {
		setTipPercent(percent);
		setCustomMode("none");
		setCustomTipPercent("");
		setCustomTipDollar("");
	};

	const handleCustomTipPercentChange = (value: string) => {
		setCustomTipPercent(value);
		setCustomTipDollar("");
		setCustomMode("percent");
	};

	const handleCustomTipDollarChange = (value: string) => {
		setCustomTipDollar(value);
		setCustomTipPercent("");
		setCustomMode("dollar");
	};

	const adjustSplit = (delta: number) => {
		const newCount = Math.max(1, Math.min(20, splitCount + delta));
		setSplitCount(newCount);
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
		setBillAmount("");
		setTipPercent(18);
		setCustomTipPercent("");
		setCustomTipDollar("");
		setCustomMode("none");
		setSplitCount(1);
	};

	const hasBill = parseFloat(billAmount) > 0;
	const isSplitting = splitCount > 1;
	const money = (amount: number) => `$${hasBill ? formatCurrency(amount) : "0.00"}`;

	const renderCopy = (value: number, field: string) => (
		<button
			className={`${styles.copyBtnSmall} ${copiedField === field ? styles.copied : ""}`}
			onClick={() => copyToClipboard(formatCurrency(value), field)}
			aria-label={`Copy ${field === "tip" ? "tip amount" : field === "total" ? "total bill" : "amount per person"}`}
			title="Copy"
			disabled={!hasBill}
		>
			{copiedField === field ? <CheckIcon className="w-4 h-4" /> : <ClipboardDocumentIcon className="w-4 h-4" />}
		</button>
	);

	return (
		<div className={styles.container}>
			{/* Readout first: on a phone this keeps the number you care about on screen while you adjust. */}
			<div className={`${styles.glassCard} ${styles.resultsCard}`} aria-live="polite">
				<div className="flex items-center justify-between gap-3 mb-3">
					<h2 className={`${styles.sectionTitle} mb-0`}>Results</h2>
					<button onClick={clearAll} className={styles.clearBtn}>
						<TrashIcon className="w-4 h-4" />
						Clear
					</button>
				</div>

				{/* Lead number: what each person pays when splitting, otherwise the total */}
				<div className={styles.lead}>
					<span className={styles.resultLabel}>{isSplitting ? "Each person pays" : "Total bill"}</span>
					<div className={styles.resultValueWrapper}>
						<span className={styles.resultValueLarge}>{money(isSplitting ? calculations.perPersonBill : calculations.totalBill)}</span>
						{renderCopy(isSplitting ? calculations.perPersonBill : calculations.totalBill, isSplitting ? "perPerson" : "total")}
					</div>
				</div>

				<div className={styles.resultsGrid}>
					<div className={styles.resultItem}>
						<span className={styles.resultLabel}>Tip Amount</span>
						<div className={styles.resultValueWrapper}>
							<span className={styles.resultValue}>{money(calculations.tipAmount)}</span>
							{renderCopy(calculations.tipAmount, "tip")}
						</div>
					</div>
					{isSplitting ? (
						<>
							<div className={styles.resultItem}>
								<span className={styles.resultLabel}>Total Bill</span>
								<div className={styles.resultValueWrapper}>
									<span className={styles.resultValue}>{money(calculations.totalBill)}</span>
									{renderCopy(calculations.totalBill, "total")}
								</div>
							</div>
							<div className={styles.resultItem}>
								<span className={styles.resultLabel}>Tip Per Person</span>
								<div className={styles.resultValueWrapper}>
									<span className={styles.resultValue}>{money(calculations.perPersonTip)}</span>
								</div>
							</div>
						</>
					) : (
						<div className={styles.resultItem}>
							<span className={styles.resultLabel}>Effective Tip</span>
							<div className={styles.resultValueWrapper}>
								<span className={styles.resultValue}>{hasBill ? `${calculations.effectiveTip.toFixed(customMode === "dollar" ? 1 : 0)}%` : "0%"}</span>
							</div>
						</div>
					)}
				</div>
			</div>

			{/* Controls */}
			<div className={styles.glassCard}>
				{/* Bill Amount */}
				<div className={styles.field}>
					<label htmlFor="tip-bill" className={styles.inputLabel}>
						Bill
					</label>
					<div className={styles.billInputWrapper}>
						<span className={styles.currencySymbol} aria-hidden="true">
							$
						</span>
						<input
							id="tip-bill"
							type="number"
							inputMode="decimal"
							value={billAmount}
							onChange={(e) => setBillAmount(e.target.value)}
							className={styles.billInput}
							placeholder="0.00"
							min="0"
							step="0.01"
						/>
					</div>
				</div>

				{/* Tip Percentage */}
				<div className={styles.field} role="group" aria-labelledby="tip-percent-label">
					<span id="tip-percent-label" className={styles.inputLabel}>
						Tip
					</span>
					<div className={styles.tipGrid}>
						{TIP_PRESETS.map((percent) => (
							<button
								key={percent}
								onClick={() => handlePresetClick(percent)}
								className={`${styles.tipBtn} ${customMode === "none" && tipPercent === percent ? styles.active : ""}`}
								aria-pressed={customMode === "none" && tipPercent === percent}
							>
								{percent}%
							</button>
						))}
					</div>
					<div className={styles.customTipRow}>
						<div className={styles.customTipWrapper}>
							<input
								type="number"
								inputMode="decimal"
								value={customTipPercent}
								onChange={(e) => handleCustomTipPercentChange(e.target.value)}
								className={`${styles.customTipInput} ${customMode === "percent" ? styles.active : ""}`}
								placeholder="Custom %"
								aria-label="Custom tip percentage"
								min="0"
								max="100"
							/>
							<span className={styles.customTipUnit} aria-hidden="true">
								%
							</span>
						</div>
						<span className={styles.customTipOr}>or</span>
						<div className={styles.customTipWrapper}>
							<span className={styles.customTipCurrency} aria-hidden="true">
								$
							</span>
							<input
								type="number"
								inputMode="decimal"
								value={customTipDollar}
								onChange={(e) => handleCustomTipDollarChange(e.target.value)}
								className={`${styles.customTipInput} ${styles.dollarInput} ${customMode === "dollar" ? styles.active : ""}`}
								placeholder="Amount"
								aria-label="Custom tip amount"
								min="0"
								step="0.01"
							/>
						</div>
					</div>
				</div>

				{/* Split Bill */}
				<div className={`${styles.field} ${styles.splitField}`} role="group" aria-labelledby="tip-split-label">
					<span id="tip-split-label" className={styles.inputLabel}>
						Split
					</span>
					<div className={styles.splitWrapper}>
						<button onClick={() => adjustSplit(-1)} className={styles.splitBtn} disabled={splitCount <= 1} aria-label="One fewer person">
							−
						</button>
						<div className={styles.splitDisplay}>
							{splitCount === 1 ? <UserIcon className="w-5 h-5" /> : <UserGroupIcon className="w-5 h-5" />}
							<span className={styles.splitCount}>{splitCount}</span>
							<span className={styles.splitLabel}>{splitCount === 1 ? "person" : "people"}</span>
						</div>
						<button onClick={() => adjustSplit(1)} className={styles.splitBtn} disabled={splitCount >= 20} aria-label="One more person">
							+
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
