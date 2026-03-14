"use client";

import { useState, useCallback, useEffect } from "react";
import { ClipboardDocumentIcon, CheckIcon, ArrowsRightLeftIcon } from "@heroicons/react/24/outline";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { hydrateUserPreferences, setBaseFontSize } from "@/store/slices/userPreferencesSlice";
import styles from "./PxRemCalculator.module.scss";

const COMMON_SIZES = [8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48, 56, 64, 72, 80, 96];

export default function PxRemCalculator() {
	const dispatch = useAppDispatch();
	const baseSize = useAppSelector((state) => state.userPreferences.baseFontSize);

	const [pxValue, setPxValue] = useState<string>("16");
	const [remValue, setRemValue] = useState<string>("1");
	const [copiedField, setCopiedField] = useState<string | null>(null);

	// Hydrate user preferences from localStorage on mount
	useEffect(() => {
		dispatch(hydrateUserPreferences());
	}, [dispatch]);

	// Update rem value when base size changes (after hydration)
	useEffect(() => {
		const numPx = parseFloat(pxValue);
		if (!isNaN(numPx)) {
			const rem = numPx / baseSize;
			setRemValue(formatNumber(rem));
		}
	}, [baseSize]); // eslint-disable-line react-hooks/exhaustive-deps

	const pxToRem = useCallback((px: number, base: number): number => {
		return px / base;
	}, []);

	const remToPx = useCallback((rem: number, base: number): number => {
		return rem * base;
	}, []);

	const handlePxChange = (value: string) => {
		setPxValue(value);
		const numValue = parseFloat(value);
		if (!isNaN(numValue)) {
			const rem = pxToRem(numValue, baseSize);
			setRemValue(formatNumber(rem));
		} else if (value === "" || value === "-") {
			setRemValue("");
		}
	};

	const handleRemChange = (value: string) => {
		setRemValue(value);
		const numValue = parseFloat(value);
		if (!isNaN(numValue)) {
			const px = remToPx(numValue, baseSize);
			setPxValue(formatNumber(px));
		} else if (value === "" || value === "-") {
			setPxValue("");
		}
	};

	const handleBaseSizeChange = (newBase: number) => {
		dispatch(setBaseFontSize(newBase));
	};

	const formatNumber = (num: number): string => {
		// Round to 4 decimal places and remove trailing zeros
		const rounded = Math.round(num * 10000) / 10000;
		return rounded.toString();
	};

	const copyToClipboard = async (value: string, unit: string, field: string) => {
		try {
			await navigator.clipboard.writeText(`${value}${unit}`);
			setCopiedField(field);
			setTimeout(() => setCopiedField(null), 2000);
		} catch (err) {
			console.error("Failed to copy:", err);
		}
	};

	const handleQuickConvert = (px: number) => {
		setPxValue(px.toString());
		const rem = pxToRem(px, baseSize);
		setRemValue(formatNumber(rem));
	};

	return (
		<div className={styles.container}>
			<div className={`grid mb-6 ${styles.mainSection}`}>
				<div className={styles.glassCard}>
					<h2 className={`mb-4 ${styles.sectionTitle}`}>Convert</h2>

					<div className={`grid items-end gap-4 ${styles.converterGrid}`}>
						{/* PX Input */}
						<div className={`flex flex-col gap-2 ${styles.inputGroup}`}>
							<label className={styles.inputLabel}>Pixels (px)</label>
							<div className={`relative flex items-center ${styles.inputWrapper}`}>
								<input type="number" inputMode="decimal" value={pxValue} onChange={(e) => handlePxChange(e.target.value)} className={`w-full rounded-md text-xl font-semibold ${styles.input}`} placeholder="Enter pixels" />
								<span className={`absolute text-sm font-medium pointer-events-none ${styles.unitLabel}`}>px</span>
								<button className={`absolute ${styles.copyBtn} ${copiedField === "px" ? styles.copied : ""}`} onClick={() => copyToClipboard(pxValue, "px", "px")} title="Copy to clipboard">
									{copiedField === "px" ? <CheckIcon className={styles.copyIcon} /> : <ClipboardDocumentIcon className={styles.copyIcon} />}
								</button>
							</div>
						</div>

						{/* Arrow Icon */}
						<div className={`flex items-center justify-center ${styles.arrowContainer}`}>
							<ArrowsRightLeftIcon className={`w-6 h-6 ${styles.arrowIcon}`} />
						</div>

						{/* REM Input */}
						<div className={`flex flex-col gap-2 ${styles.inputGroup}`}>
							<label className={styles.inputLabel}>Root EM (rem)</label>
							<div className={`relative flex items-center ${styles.inputWrapper}`}>
								<input type="number" inputMode="decimal" value={remValue} onChange={(e) => handleRemChange(e.target.value)} className={`w-full rounded-md text-xl font-semibold ${styles.input}`} placeholder="Enter rem" step="0.0625" />
								<span className={`absolute text-sm font-medium pointer-events-none ${styles.unitLabel}`}>rem</span>
								<button className={`absolute ${styles.copyBtn} ${copiedField === "rem" ? styles.copied : ""}`} onClick={() => copyToClipboard(remValue, "rem", "rem")} title="Copy to clipboard">
									{copiedField === "rem" ? <CheckIcon className={styles.copyIcon} /> : <ClipboardDocumentIcon className={styles.copyIcon} />}
								</button>
							</div>
						</div>
					</div>

					{/* Base Size Setting */}
					<div className={`mt-6 pt-6 ${styles.baseSizeSection}`}>
						<label className={`block text-sm font-medium mb-3 ${styles.baseSizeLabel}`}>
							Base Font Size: <span className={`font-semibold ${styles.baseSizeValue}`}>{baseSize}px</span>
						</label>
						<input type="range" min="10" max="24" value={baseSize} onChange={(e) => handleBaseSizeChange(parseInt(e.target.value))} className={styles.slider} />
						<div className={`flex justify-between mt-2 text-xs ${styles.sliderMarks}`}>
							<span>10px</span>
							<span>16px</span>
							<span>24px</span>
						</div>
					</div>
				</div>

				{/* Quick Convert */}
				<div className={styles.glassCard}>
					<h2 className={`mb-4 ${styles.sectionTitle}`}>Quick Convert</h2>
					<div className={`grid gap-2 ${styles.quickGrid}`}>
						{COMMON_SIZES.map((size) => (
							<button key={size} className={`flex flex-col items-center gap-1 rounded-md cursor-pointer ${styles.quickBtn} ${pxValue === size.toString() ? styles.active : ""}`} onClick={() => handleQuickConvert(size)}>
								<span className={`font-semibold ${styles.quickPx}`}>{size}px</span>
								<span className={`text-xs ${styles.quickRem}`}>{formatNumber(pxToRem(size, baseSize))}rem</span>
							</button>
						))}
					</div>
				</div>
			</div>

			{/* Reference Table */}
			<div className={styles.glassCard}>
				<h2 className={`mb-4 ${styles.sectionTitle}`}>Reference Table</h2>
				<div className={`overflow-x-auto ${styles.tableWrapper}`}>
					<table className={`w-full text-sm ${styles.table}`}>
						<thead>
							<tr>
								<th className="text-left">Pixels</th>
								<th className="text-left">REM</th>
								<th className="text-left">EM</th>
								<th className="text-left">Points</th>
							</tr>
						</thead>
						<tbody>
							{COMMON_SIZES.map((px) => (
								<tr key={px} className={`cursor-pointer ${pxValue === px.toString() ? styles.activeRow : ""}`} onClick={() => handleQuickConvert(px)}>
									<td>{px}px</td>
									<td>{formatNumber(pxToRem(px, baseSize))}rem</td>
									<td>{formatNumber(pxToRem(px, baseSize))}em</td>
									<td>{formatNumber(px * 0.75)}pt</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>

			{/* Info Section */}
			<div className={`mt-6 ${styles.glassCard}`}>
				<h2 className={`mb-4 ${styles.sectionTitle}`}>About PX and REM</h2>
				<div className={`grid grid-cols-2 gap-6 ${styles.infoGrid}`}>
					<div className={`p-4 rounded-md ${styles.infoItem}`}>
						<h3 className={`text-base font-semibold mb-2 ${styles.infoSubtitle}`}>What is PX?</h3>
						<p className={`text-sm ${styles.infoText}`}>Pixels (px) are absolute units that represent a fixed size on screen. They don&apos;t scale with user preferences, making them less accessible but more predictable for fixed layouts.</p>
					</div>
					<div className={`p-4 rounded-md ${styles.infoItem}`}>
						<h3 className={`text-base font-semibold mb-2 ${styles.infoSubtitle}`}>What is REM?</h3>
						<p className={`text-sm ${styles.infoText}`}>REM (root em) units are relative to the root element&apos;s font size (typically 16px by default). They scale with user preferences, making your design more accessible and responsive.</p>
					</div>
					<div className={`p-4 rounded-md ${styles.infoItem}`}>
						<h3 className={`text-base font-semibold mb-2 ${styles.infoSubtitle}`}>Formula</h3>
						<p className={`text-sm ${styles.infoText}`}>
							<code className={`inline-block px-2 py-1 rounded-sm text-xs ${styles.formula}`}>rem = px / base-font-size</code>
							<br />
							<code className={`inline-block px-2 py-1 rounded-sm text-xs ${styles.formula}`}>px = rem × base-font-size</code>
						</p>
					</div>
					<div className={`p-4 rounded-md ${styles.infoItem}`}>
						<h3 className={`text-base font-semibold mb-2 ${styles.infoSubtitle}`}>When to Use</h3>
						<p className={`text-sm ${styles.infoText}`}>Use REM for font sizes, spacing, and most layout properties. Use PX for borders, shadows, and elements that shouldn&apos;t scale with user font preferences.</p>
					</div>
				</div>
			</div>
		</div>
	);
}
