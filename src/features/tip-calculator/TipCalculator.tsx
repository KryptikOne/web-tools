"use client";

import { useState, useMemo } from "react";
import { ClipboardDocumentIcon, CheckIcon, UserIcon, UserGroupIcon } from "@heroicons/react/24/outline";
import styles from "./TipCalculator.module.scss";

const TIP_PRESETS = [5, 10, 15, 18, 20, 25];

export default function TipCalculator() {
	const [billAmount, setBillAmount] = useState<string>("");
	const [tipPercent, setTipPercent] = useState<number>(18);
	const [customTip, setCustomTip] = useState<string>("");
	const [isCustom, setIsCustom] = useState<boolean>(false);
	const [splitCount, setSplitCount] = useState<number>(1);
	const [copiedField, setCopiedField] = useState<string | null>(null);

	const calculations = useMemo(() => {
		const bill = parseFloat(billAmount) || 0;
		const tip = isCustom ? (parseFloat(customTip) || 0) : tipPercent;

		const tipAmount = bill * (tip / 100);
		const totalBill = bill + tipAmount;
		const perPersonBill = totalBill / splitCount;
		const perPersonTip = tipAmount / splitCount;

		return {
			tipAmount,
			totalBill,
			perPersonBill,
			perPersonTip,
			effectiveTip: tip,
		};
	}, [billAmount, tipPercent, customTip, isCustom, splitCount]);

	const formatCurrency = (amount: number): string => {
		return amount.toFixed(2);
	};

	const handlePresetClick = (percent: number) => {
		setTipPercent(percent);
		setIsCustom(false);
		setCustomTip("");
	};

	const handleCustomTipChange = (value: string) => {
		setCustomTip(value);
		setIsCustom(true);
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
		setCustomTip("");
		setIsCustom(false);
		setSplitCount(1);
	};

	const hasBill = parseFloat(billAmount) > 0;

	return (
		<div className={styles.container}>
			{/* Main Calculator */}
			<div className={styles.glassCard}>
				<div className="flex justify-between items-center mb-6">
					<h2 className={styles.sectionTitle}>Tip Calculator</h2>
					<button onClick={clearAll} className={styles.clearBtn}>
						Clear All
					</button>
				</div>

				{/* Bill Amount */}
				<div className="mb-6">
					<label className={styles.inputLabel}>Bill Amount</label>
					<div className={styles.billInputWrapper}>
						<span className={styles.currencySymbol}>$</span>
						<input
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
				<div className="mb-6">
					<label className={styles.inputLabel}>Tip Percentage</label>
					<div className={styles.tipGrid}>
						{TIP_PRESETS.map((percent) => (
							<button
								key={percent}
								onClick={() => handlePresetClick(percent)}
								className={`${styles.tipBtn} ${!isCustom && tipPercent === percent ? styles.active : ""}`}
							>
								{percent}%
							</button>
						))}
						<div className={styles.customTipWrapper}>
							<input
								type="number"
								inputMode="decimal"
								value={customTip}
								onChange={(e) => handleCustomTipChange(e.target.value)}
								className={`${styles.customTipInput} ${isCustom ? styles.active : ""}`}
								placeholder="Custom"
								min="0"
								max="100"
							/>
							<span className={styles.customTipUnit}>%</span>
						</div>
					</div>
				</div>

				{/* Split Bill */}
				<div className="mb-6">
					<label className={styles.inputLabel}>Split Between</label>
					<div className={styles.splitWrapper}>
						<button
							onClick={() => adjustSplit(-1)}
							className={styles.splitBtn}
							disabled={splitCount <= 1}
						>
							−
						</button>
						<div className={styles.splitDisplay}>
							{splitCount === 1 ? (
								<UserIcon className="w-5 h-5" />
							) : (
								<UserGroupIcon className="w-5 h-5" />
							)}
							<span className={styles.splitCount}>{splitCount}</span>
							<span className={styles.splitLabel}>
								{splitCount === 1 ? "person" : "people"}
							</span>
						</div>
						<button
							onClick={() => adjustSplit(1)}
							className={styles.splitBtn}
							disabled={splitCount >= 20}
						>
							+
						</button>
					</div>
				</div>
			</div>

			{/* Results */}
			<div className={styles.glassCard}>
				<h2 className={styles.sectionTitle}>Results</h2>

				<div className={styles.resultsGrid}>
					{/* Tip Amount */}
					<div className={styles.resultItem}>
						<span className={styles.resultLabel}>Tip Amount</span>
						<div className={styles.resultValueWrapper}>
							<span className={styles.resultValue}>
								${hasBill ? formatCurrency(calculations.tipAmount) : "0.00"}
							</span>
							<button
								className={`${styles.copyBtnSmall} ${copiedField === "tip" ? styles.copied : ""}`}
								onClick={() => copyToClipboard(formatCurrency(calculations.tipAmount), "tip")}
								title="Copy"
								disabled={!hasBill}
							>
								{copiedField === "tip" ? (
									<CheckIcon className="w-4 h-4" />
								) : (
									<ClipboardDocumentIcon className="w-4 h-4" />
								)}
							</button>
						</div>
					</div>

					{/* Total Bill */}
					<div className={styles.resultItem}>
						<span className={styles.resultLabel}>Total Bill</span>
						<div className={styles.resultValueWrapper}>
							<span className={styles.resultValue}>
								${hasBill ? formatCurrency(calculations.totalBill) : "0.00"}
							</span>
							<button
								className={`${styles.copyBtnSmall} ${copiedField === "total" ? styles.copied : ""}`}
								onClick={() => copyToClipboard(formatCurrency(calculations.totalBill), "total")}
								title="Copy"
								disabled={!hasBill}
							>
								{copiedField === "total" ? (
									<CheckIcon className="w-4 h-4" />
								) : (
									<ClipboardDocumentIcon className="w-4 h-4" />
								)}
							</button>
						</div>
					</div>
				</div>

				{/* Per Person (only show if splitting) */}
				{splitCount > 1 && (
					<>
						<div className={styles.divider} />
						<div className={styles.resultsGrid}>
							<div className={styles.resultItem}>
								<span className={styles.resultLabel}>Tip Per Person</span>
								<div className={styles.resultValueWrapper}>
									<span className={styles.resultValueSmall}>
										${hasBill ? formatCurrency(calculations.perPersonTip) : "0.00"}
									</span>
								</div>
							</div>
							<div className={`${styles.resultItem} ${styles.highlight}`}>
								<span className={styles.resultLabel}>Each Person Pays</span>
								<div className={styles.resultValueWrapper}>
									<span className={styles.resultValueLarge}>
										${hasBill ? formatCurrency(calculations.perPersonBill) : "0.00"}
									</span>
									<button
										className={`${styles.copyBtnSmall} ${copiedField === "perPerson" ? styles.copied : ""}`}
										onClick={() => copyToClipboard(formatCurrency(calculations.perPersonBill), "perPerson")}
										title="Copy"
										disabled={!hasBill}
									>
										{copiedField === "perPerson" ? (
											<CheckIcon className="w-4 h-4" />
										) : (
											<ClipboardDocumentIcon className="w-4 h-4" />
										)}
									</button>
								</div>
							</div>
						</div>
					</>
				)}
			</div>

			{/* Tip Guide */}
			<div className={styles.glassCard}>
				<h2 className={styles.sectionTitle}>Tipping Guide</h2>
				<div className="grid gap-4 md:grid-cols-2">
					<div className={styles.guideItem}>
						<div className={styles.guidePercent}>15-20%</div>
						<div className={styles.guideDesc}>
							<strong>Restaurant / Sit-down dining</strong>
							<p>Standard for good service. 20%+ for exceptional service.</p>
						</div>
					</div>
					<div className={styles.guideItem}>
						<div className={styles.guidePercent}>10-15%</div>
						<div className={styles.guideDesc}>
							<strong>Takeout / Counter service</strong>
							<p>Optional but appreciated for complex orders.</p>
						</div>
					</div>
					<div className={styles.guideItem}>
						<div className={styles.guidePercent}>15-20%</div>
						<div className={styles.guideDesc}>
							<strong>Delivery</strong>
							<p>More for bad weather or long distances.</p>
						</div>
					</div>
					<div className={styles.guideItem}>
						<div className={styles.guidePercent}>18-25%</div>
						<div className={styles.guideDesc}>
							<strong>Hair / Spa services</strong>
							<p>Higher end for complex styling or treatments.</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
