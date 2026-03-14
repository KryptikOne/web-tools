"use client";

import { useState, useMemo, useCallback } from "react";
import {
	ClipboardDocumentIcon,
	CheckIcon,
	ArrowsRightLeftIcon,
	ViewColumnsIcon,
} from "@heroicons/react/24/outline";
import styles from "./CssUnitConverter.module.scss";

type CssUnit = "px" | "rem" | "em" | "%" | "vw" | "vh" | "pt" | "cm" | "mm" | "in";

const CSS_UNITS: CssUnit[] = ["px", "rem", "em", "%", "vw", "vh", "pt", "cm", "mm", "in"];

const UNIT_LABELS: Record<CssUnit, string> = {
	px: "Pixels",
	rem: "Root EM",
	em: "EM",
	"%": "Percent",
	vw: "Viewport Width",
	vh: "Viewport Height",
	pt: "Points",
	cm: "Centimeters",
	mm: "Millimeters",
	in: "Inches",
};

// 1 inch = 96px = 72pt = 2.54cm = 25.4mm
const PX_PER_INCH = 96;
const PT_PER_INCH = 72;
const CM_PER_INCH = 2.54;
const MM_PER_INCH = 25.4;

const COMMON_PX_VALUES = [8, 10, 12, 14, 16, 18, 20, 24, 32, 48, 64, 96];

function formatNumber(num: number): string {
	const rounded = Math.round(num * 10000) / 10000;
	return rounded.toString();
}

/**
 * Convert any CSS unit value to pixels (the canonical intermediate).
 */
function toPx(
	value: number,
	unit: CssUnit,
	baseFontSize: number,
	parentFontSize: number,
	viewportWidth: number,
	viewportHeight: number,
): number {
	switch (unit) {
		case "px":
			return value;
		case "rem":
			return value * baseFontSize;
		case "em":
			return value * parentFontSize;
		case "%":
			// Percent of parent font size (for font-size context)
			return (value / 100) * parentFontSize;
		case "vw":
			return (value / 100) * viewportWidth;
		case "vh":
			return (value / 100) * viewportHeight;
		case "pt":
			return value * (PX_PER_INCH / PT_PER_INCH);
		case "cm":
			return value * (PX_PER_INCH / CM_PER_INCH);
		case "mm":
			return value * (PX_PER_INCH / MM_PER_INCH);
		case "in":
			return value * PX_PER_INCH;
		default:
			return value;
	}
}

/**
 * Convert pixels to any CSS unit.
 */
function fromPx(
	px: number,
	unit: CssUnit,
	baseFontSize: number,
	parentFontSize: number,
	viewportWidth: number,
	viewportHeight: number,
): number {
	switch (unit) {
		case "px":
			return px;
		case "rem":
			return px / baseFontSize;
		case "em":
			return px / parentFontSize;
		case "%":
			return (px / parentFontSize) * 100;
		case "vw":
			return (px / viewportWidth) * 100;
		case "vh":
			return (px / viewportHeight) * 100;
		case "pt":
			return px / (PX_PER_INCH / PT_PER_INCH);
		case "cm":
			return px / (PX_PER_INCH / CM_PER_INCH);
		case "mm":
			return px / (PX_PER_INCH / MM_PER_INCH);
		case "in":
			return px / PX_PER_INCH;
		default:
			return px;
	}
}

export default function CssUnitConverter() {
	const [inputValue, setInputValue] = useState<string>("16");
	const [sourceUnit, setSourceUnit] = useState<CssUnit>("px");
	const [targetUnit, setTargetUnit] = useState<CssUnit>("rem");
	const [baseFontSize, setBaseFontSize] = useState<string>("16");
	const [parentFontSize, setParentFontSize] = useState<string>("16");
	const [viewportWidth, setViewportWidth] = useState<string>("1920");
	const [viewportHeight, setViewportHeight] = useState<string>("1080");
	const [showAllUnits, setShowAllUnits] = useState(false);
	const [copiedField, setCopiedField] = useState<string | null>(null);

	const baseFs = parseFloat(baseFontSize) || 16;
	const parentFs = parseFloat(parentFontSize) || 16;
	const vpWidth = parseFloat(viewportWidth) || 1920;
	const vpHeight = parseFloat(viewportHeight) || 1080;

	const convert = useCallback(
		(value: number, from: CssUnit, to: CssUnit): number => {
			const px = toPx(value, from, baseFs, parentFs, vpWidth, vpHeight);
			return fromPx(px, to, baseFs, parentFs, vpWidth, vpHeight);
		},
		[baseFs, parentFs, vpWidth, vpHeight],
	);

	const result = useMemo(() => {
		const num = parseFloat(inputValue);
		if (isNaN(num)) return "";
		return formatNumber(convert(num, sourceUnit, targetUnit));
	}, [inputValue, sourceUnit, targetUnit, convert]);

	const allConversions = useMemo(() => {
		const num = parseFloat(inputValue);
		if (isNaN(num)) return null;
		return CSS_UNITS.map((unit) => ({
			unit,
			label: UNIT_LABELS[unit],
			value: formatNumber(convert(num, sourceUnit, unit)),
		}));
	}, [inputValue, sourceUnit, convert]);

	const referenceRows = useMemo(() => {
		return COMMON_PX_VALUES.map((px) => ({
			px,
			rem: formatNumber(fromPx(px, "rem", baseFs, parentFs, vpWidth, vpHeight)),
			em: formatNumber(fromPx(px, "em", baseFs, parentFs, vpWidth, vpHeight)),
			pt: formatNumber(fromPx(px, "pt", baseFs, parentFs, vpWidth, vpHeight)),
			vw: formatNumber(fromPx(px, "vw", baseFs, parentFs, vpWidth, vpHeight)),
			vh: formatNumber(fromPx(px, "vh", baseFs, parentFs, vpWidth, vpHeight)),
			percent: formatNumber(fromPx(px, "%", baseFs, parentFs, vpWidth, vpHeight)),
		}));
	}, [baseFs, parentFs, vpWidth, vpHeight]);

	const copyToClipboard = async (value: string, unit: string, field: string) => {
		try {
			await navigator.clipboard.writeText(`${value}${unit}`);
			setCopiedField(field);
			setTimeout(() => setCopiedField(null), 2000);
		} catch (err) {
			console.error("Failed to copy:", err);
		}
	};

	const swapUnits = () => {
		setSourceUnit(targetUnit);
		setTargetUnit(sourceUnit);
	};

	return (
		<div className={styles.container}>
			{/* Context Settings */}
			<div className={styles.glassCard}>
				<h2 className={`mb-4 ${styles.sectionTitle}`}>Context Settings</h2>
				<div className={`grid gap-4 ${styles.settingsGrid}`}>
					<div className="flex flex-col gap-1">
						<label className={styles.inputLabel}>Base Font Size</label>
						<div className={`relative flex items-center ${styles.inputWrapper}`}>
							<input
								type="number"
								inputMode="decimal"
								value={baseFontSize}
								onChange={(e) => setBaseFontSize(e.target.value)}
								className={`w-full ${styles.settingsInput}`}
								placeholder="16"
								min="1"
							/>
							<span className={`absolute text-sm font-medium pointer-events-none ${styles.unitLabel}`}>px</span>
						</div>
					</div>
					<div className="flex flex-col gap-1">
						<label className={styles.inputLabel}>Parent Font Size</label>
						<div className={`relative flex items-center ${styles.inputWrapper}`}>
							<input
								type="number"
								inputMode="decimal"
								value={parentFontSize}
								onChange={(e) => setParentFontSize(e.target.value)}
								className={`w-full ${styles.settingsInput}`}
								placeholder="16"
								min="1"
							/>
							<span className={`absolute text-sm font-medium pointer-events-none ${styles.unitLabel}`}>px</span>
						</div>
					</div>
					<div className="flex flex-col gap-1">
						<label className={styles.inputLabel}>Viewport Width</label>
						<div className={`relative flex items-center ${styles.inputWrapper}`}>
							<input
								type="number"
								inputMode="decimal"
								value={viewportWidth}
								onChange={(e) => setViewportWidth(e.target.value)}
								className={`w-full ${styles.settingsInput}`}
								placeholder="1920"
								min="1"
							/>
							<span className={`absolute text-sm font-medium pointer-events-none ${styles.unitLabel}`}>px</span>
						</div>
					</div>
					<div className="flex flex-col gap-1">
						<label className={styles.inputLabel}>Viewport Height</label>
						<div className={`relative flex items-center ${styles.inputWrapper}`}>
							<input
								type="number"
								inputMode="decimal"
								value={viewportHeight}
								onChange={(e) => setViewportHeight(e.target.value)}
								className={`w-full ${styles.settingsInput}`}
								placeholder="1080"
								min="1"
							/>
							<span className={`absolute text-sm font-medium pointer-events-none ${styles.unitLabel}`}>px</span>
						</div>
					</div>
				</div>
			</div>

			{/* Main Converter */}
			<div className={`mt-6 ${styles.glassCard}`}>
				<div className="flex items-center justify-between mb-4">
					<h2 className={styles.sectionTitle}>Convert</h2>
					<button
						className={`flex items-center gap-2 ${styles.toggleBtn} ${showAllUnits ? styles.active : ""}`}
						onClick={() => setShowAllUnits(!showAllUnits)}
						title="Show all unit conversions"
					>
						<ViewColumnsIcon className="w-4 h-4" />
						<span className="text-sm">Convert All</span>
					</button>
				</div>

				<div className={`grid items-end gap-4 ${styles.converterGrid}`}>
					{/* Source Value + Unit */}
					<div className="flex flex-col gap-2">
						<label className={styles.inputLabel}>Value</label>
						<div className={`relative flex items-center ${styles.inputWrapper}`}>
							<input
								type="number"
								inputMode="decimal"
								value={inputValue}
								onChange={(e) => setInputValue(e.target.value)}
								className={`w-full rounded-md text-xl font-semibold ${styles.input}`}
								placeholder="Enter value"
							/>
						</div>
					</div>

					<div className="flex flex-col gap-2">
						<label className={styles.inputLabel}>From</label>
						<div className={`flex flex-wrap gap-1 ${styles.unitBtnGroup}`}>
							{CSS_UNITS.map((unit) => (
								<button
									key={unit}
									className={`${styles.unitBtn} ${sourceUnit === unit ? styles.active : ""}`}
									onClick={() => setSourceUnit(unit)}
								>
									{unit}
								</button>
							))}
						</div>
					</div>

					{/* Arrow / Swap */}
					<div className={`flex items-center justify-center ${styles.arrowContainer}`}>
						<button onClick={swapUnits} className={styles.swapBtn} title="Swap units">
							<ArrowsRightLeftIcon className="w-6 h-6" />
						</button>
					</div>

					{/* Target Unit */}
					{!showAllUnits && (
						<div className="flex flex-col gap-2">
							<label className={styles.inputLabel}>To</label>
							<div className={`flex flex-wrap gap-1 ${styles.unitBtnGroup}`}>
								{CSS_UNITS.map((unit) => (
									<button
										key={unit}
										className={`${styles.unitBtn} ${targetUnit === unit ? styles.active : ""}`}
										onClick={() => setTargetUnit(unit)}
									>
										{unit}
									</button>
								))}
							</div>
						</div>
					)}

					{/* Single Result */}
					{!showAllUnits && (
						<div className="flex flex-col gap-2">
							<label className={styles.inputLabel}>Result</label>
							<div className={`relative flex items-center ${styles.inputWrapper}`}>
								<input
									type="text"
									value={result ? `${result}${targetUnit}` : ""}
									readOnly
									className={`w-full rounded-md text-xl font-semibold ${styles.input} ${styles.resultInput}`}
									placeholder="Result"
								/>
								<button
									className={`absolute ${styles.copyBtn} ${copiedField === "result" ? styles.copied : ""}`}
									onClick={() => copyToClipboard(result, targetUnit, "result")}
									title="Copy to clipboard"
									disabled={!result}
								>
									{copiedField === "result" ? (
										<CheckIcon className={styles.copyIcon} />
									) : (
										<ClipboardDocumentIcon className={styles.copyIcon} />
									)}
								</button>
							</div>
						</div>
					)}
				</div>

				{/* Convert All Grid */}
				{showAllUnits && allConversions && (
					<div className={`mt-6 pt-6 ${styles.allUnitsSection}`}>
						<h3 className={`text-sm font-medium mb-3 ${styles.allUnitsLabel}`}>
							{inputValue}{sourceUnit} in all units
						</h3>
						<div className={`grid gap-3 ${styles.allUnitsGrid}`}>
							{allConversions.map(({ unit, label, value }) => (
								<div key={unit} className={`flex items-center justify-between p-3 rounded-md ${styles.allUnitsItem}`}>
									<div className="flex flex-col">
										<span className={`text-xs ${styles.allUnitsUnitLabel}`}>{label}</span>
										<span className={`font-semibold ${styles.allUnitsValue}`}>
											{value}{unit}
										</span>
									</div>
									<button
										className={`${styles.copyBtnSm} ${copiedField === `all-${unit}` ? styles.copied : ""}`}
										onClick={() => copyToClipboard(value, unit, `all-${unit}`)}
										title={`Copy ${unit} value`}
									>
										{copiedField === `all-${unit}` ? (
											<CheckIcon className={styles.copyIcon} />
										) : (
											<ClipboardDocumentIcon className={styles.copyIcon} />
										)}
									</button>
								</div>
							))}
						</div>
					</div>
				)}
			</div>

			{/* Reference Table */}
			<div className={`mt-6 ${styles.glassCard}`}>
				<h2 className={`mb-4 ${styles.sectionTitle}`}>Reference Table</h2>
				<div className={`overflow-x-auto ${styles.tableWrapper}`}>
					<table className={`w-full text-sm ${styles.table}`}>
						<thead>
							<tr>
								<th className="text-left">px</th>
								<th className="text-left">rem</th>
								<th className="text-left">em</th>
								<th className="text-left">pt</th>
								<th className="text-left">%</th>
								<th className="text-left">vw</th>
								<th className="text-left">vh</th>
							</tr>
						</thead>
						<tbody>
							{referenceRows.map((row) => (
								<tr
									key={row.px}
									className={`cursor-pointer ${inputValue === row.px.toString() && sourceUnit === "px" ? styles.activeRow : ""}`}
									onClick={() => {
										setInputValue(row.px.toString());
										setSourceUnit("px");
									}}
								>
									<td>{row.px}px</td>
									<td>{row.rem}rem</td>
									<td>{row.em}em</td>
									<td>{row.pt}pt</td>
									<td>{row.percent}%</td>
									<td>{row.vw}vw</td>
									<td>{row.vh}vh</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>

			{/* Info Section */}
			<div className={`mt-6 ${styles.glassCard}`}>
				<h2 className={`mb-4 ${styles.sectionTitle}`}>CSS Unit Guide</h2>
				<div className={`grid grid-cols-2 gap-4 ${styles.infoGrid}`}>
					<div className={`p-4 rounded-md ${styles.infoItem}`}>
						<h3 className={`text-base font-semibold mb-2 ${styles.infoSubtitle}`}>Absolute Units</h3>
						<p className={`text-sm ${styles.infoText}`}>
							<strong>px</strong> &mdash; Pixels, the most common absolute unit.
							<br />
							<strong>pt</strong> &mdash; Points (1pt = 1/72 inch), used in print.
							<br />
							<strong>cm / mm / in</strong> &mdash; Physical measurements, rarely used on screen but useful for print stylesheets.
						</p>
					</div>
					<div className={`p-4 rounded-md ${styles.infoItem}`}>
						<h3 className={`text-base font-semibold mb-2 ${styles.infoSubtitle}`}>Relative Units</h3>
						<p className={`text-sm ${styles.infoText}`}>
							<strong>rem</strong> &mdash; Relative to the root font size (html element).
							<br />
							<strong>em</strong> &mdash; Relative to the parent element&apos;s font size.
							<br />
							<strong>%</strong> &mdash; Percentage of the parent&apos;s computed value.
						</p>
					</div>
					<div className={`p-4 rounded-md ${styles.infoItem}`}>
						<h3 className={`text-base font-semibold mb-2 ${styles.infoSubtitle}`}>Viewport Units</h3>
						<p className={`text-sm ${styles.infoText}`}>
							<strong>vw</strong> &mdash; 1% of the viewport width.
							<br />
							<strong>vh</strong> &mdash; 1% of the viewport height.
							<br />
							Useful for full-screen layouts and responsive typography.
						</p>
					</div>
					<div className={`p-4 rounded-md ${styles.infoItem}`}>
						<h3 className={`text-base font-semibold mb-2 ${styles.infoSubtitle}`}>Key Formulas</h3>
						<p className={`text-sm ${styles.infoText}`}>
							<code className={`inline-block px-2 py-1 rounded-sm text-xs ${styles.formula}`}>rem = px / base-font-size</code>
							<br />
							<code className={`inline-block px-2 py-1 rounded-sm text-xs ${styles.formula}`}>1in = 96px = 72pt = 2.54cm</code>
							<br />
							<code className={`inline-block px-2 py-1 rounded-sm text-xs ${styles.formula}`}>vw = (px / viewport-width) * 100</code>
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
