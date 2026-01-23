"use client";

import { useState, useCallback } from "react";
import { ArrowsRightLeftIcon, ClipboardDocumentIcon, CheckIcon } from "@heroicons/react/24/outline";
import styles from "./AreaConverter.module.scss";

interface ConversionUnit {
	id: string;
	name: string;
	abbrev: string;
	toBase: (value: number) => number; // Convert to base unit (square meters)
	fromBase: (value: number) => number; // Convert from base unit
}

// Area units (base: square meters)
const AREA_UNITS: ConversionUnit[] = [
	{ id: "sqmm", name: "Square Millimeters", abbrev: "mm²", toBase: (v) => v / 1000000, fromBase: (v) => v * 1000000 },
	{ id: "sqcm", name: "Square Centimeters", abbrev: "cm²", toBase: (v) => v / 10000, fromBase: (v) => v * 10000 },
	{ id: "sqm", name: "Square Meters", abbrev: "m²", toBase: (v) => v, fromBase: (v) => v },
	{ id: "sqkm", name: "Square Kilometers", abbrev: "km²", toBase: (v) => v * 1000000, fromBase: (v) => v / 1000000 },
	{ id: "ha", name: "Hectares", abbrev: "ha", toBase: (v) => v * 10000, fromBase: (v) => v / 10000 },
	{ id: "sqin", name: "Square Inches", abbrev: "in²", toBase: (v) => v * 0.00064516, fromBase: (v) => v / 0.00064516 },
	{ id: "sqft", name: "Square Feet", abbrev: "ft²", toBase: (v) => v * 0.092903, fromBase: (v) => v / 0.092903 },
	{ id: "sqyd", name: "Square Yards", abbrev: "yd²", toBase: (v) => v * 0.836127, fromBase: (v) => v / 0.836127 },
	{ id: "acre", name: "Acres", abbrev: "ac", toBase: (v) => v * 4046.86, fromBase: (v) => v / 4046.86 },
	{ id: "sqmi", name: "Square Miles", abbrev: "mi²", toBase: (v) => v * 2589988, fromBase: (v) => v / 2589988 },
];

// Quick conversion reference
const IMPERIAL_TO_METRIC = [
	{ imperial: "1 square inch", metric: "6.452 cm²" },
	{ imperial: "1 square foot", metric: "0.0929 m² / 929 cm²" },
	{ imperial: "1 square yard", metric: "0.836 m²" },
	{ imperial: "1 acre", metric: "4,047 m² / 0.405 ha" },
	{ imperial: "1 square mile", metric: "2.59 km² / 259 ha" },
	{ imperial: "100 square feet", metric: "9.29 m²" },
	{ imperial: "1,000 square feet", metric: "92.9 m²" },
	{ imperial: "43,560 sq ft (1 acre)", metric: "4,047 m²" },
];

const METRIC_TO_IMPERIAL = [
	{ metric: "1 square centimeter", imperial: "0.155 in²" },
	{ metric: "1 square meter", imperial: "10.76 ft² / 1.196 yd²" },
	{ metric: "10 square meters", imperial: "107.6 ft²" },
	{ metric: "100 square meters", imperial: "1,076 ft² / 0.025 ac" },
	{ metric: "1 hectare", imperial: "2.471 acres" },
	{ metric: "1 square kilometer", imperial: "0.386 mi² / 247 ac" },
	{ metric: "10,000 m² (1 ha)", imperial: "2.47 acres" },
	{ metric: "1,000,000 m² (1 km²)", imperial: "0.386 mi²" },
];

const REAL_ESTATE_REFERENCE = [
	{ description: "Small apartment", size: "400-600 ft² / 37-56 m²" },
	{ description: "Average apartment", size: "800-1,000 ft² / 74-93 m²" },
	{ description: "Large apartment", size: "1,200-1,500 ft² / 111-139 m²" },
	{ description: "Small house", size: "1,000-1,500 ft² / 93-139 m²" },
	{ description: "Average house (US)", size: "2,000-2,500 ft² / 186-232 m²" },
	{ description: "Large house", size: "3,000-4,000 ft² / 279-372 m²" },
	{ description: "Standard lot (US)", size: "0.25-0.5 acre / 1,000-2,000 m²" },
	{ description: "Large lot", size: "1+ acre / 4,000+ m²" },
];

const LAND_MEASUREMENT = [
	{ description: "Tennis court", size: "2,808 ft² / 261 m²" },
	{ description: "Basketball court", size: "4,700 ft² / 437 m²" },
	{ description: "Football field (US)", size: "1.32 acres / 0.53 ha" },
	{ description: "Soccer field", size: "1.76 acres / 0.71 ha" },
	{ description: "City block (typical)", size: "2-5 acres / 0.8-2 ha" },
	{ description: "Central Park (NYC)", size: "843 acres / 341 ha" },
	{ description: "Manhattan (NYC)", size: "22.8 mi² / 59.1 km²" },
	{ description: "Rhode Island", size: "1,545 mi² / 4,001 km²" },
];

function formatNumber(num: number): string {
	if (num === 0) return "0";
	if (Math.abs(num) < 0.0001) return num.toExponential(2);
	if (Math.abs(num) >= 1000000) return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
	if (Number.isInteger(num)) return num.toLocaleString();
	return num.toFixed(Math.abs(num) < 1 ? 4 : 2).replace(/\.?0+$/, "");
}

export default function AreaConverter() {
	const [fromUnit, setFromUnit] = useState<string>("sqft");
	const [toUnit, setToUnit] = useState<string>("sqm");
	const [inputValue, setInputValue] = useState<string>("1000");
	const [copiedCell, setCopiedCell] = useState<string | null>(null);

	const convert = useCallback(() => {
		const value = parseFloat(inputValue);
		if (isNaN(value)) return "";

		const from = AREA_UNITS.find((u) => u.id === fromUnit);
		const to = AREA_UNITS.find((u) => u.id === toUnit);

		if (!from || !to) return "";

		const baseValue = from.toBase(value);
		const result = to.fromBase(baseValue);

		return formatNumber(result);
	}, [inputValue, fromUnit, toUnit]);

	const swapUnits = () => {
		const temp = fromUnit;
		setFromUnit(toUnit);
		setToUnit(temp);
	};

	const copyToClipboard = async (text: string, cellId: string) => {
		try {
			await navigator.clipboard.writeText(text);
			setCopiedCell(cellId);
			setTimeout(() => setCopiedCell(null), 1500);
		} catch (err) {
			console.error("Failed to copy:", err);
		}
	};

	const result = convert();

	return (
		<div className={styles.container}>
			{/* Converter Section */}
			<div className={styles.glassCard}>
				<h2 className={styles.sectionTitle}>Area Converter</h2>

				{/* Converter Interface */}
				<div className={styles.converterGrid}>
					<div className={styles.converterInput}>
						<label className={styles.inputLabel}>From</label>
						<div className={styles.inputRow}>
							<input
								type="number"
								inputMode="decimal"
								value={inputValue}
								onChange={(e) => setInputValue(e.target.value)}
								className={styles.numberInput}
								placeholder="Enter value"
							/>
							<select value={fromUnit} onChange={(e) => setFromUnit(e.target.value)} className={styles.unitSelect}>
								{AREA_UNITS.map((unit) => (
									<option key={unit.id} value={unit.id}>
										{unit.name} ({unit.abbrev})
									</option>
								))}
							</select>
						</div>
					</div>

					<button className={styles.swapButton} onClick={swapUnits} title="Swap units">
						<ArrowsRightLeftIcon className="w-5 h-5" />
					</button>

					<div className={styles.converterInput}>
						<label className={styles.inputLabel}>To</label>
						<div className={styles.inputRow}>
							<div className={styles.resultDisplay}>{result || "—"}</div>
							<select value={toUnit} onChange={(e) => setToUnit(e.target.value)} className={styles.unitSelect}>
								{AREA_UNITS.map((unit) => (
									<option key={unit.id} value={unit.id}>
										{unit.name} ({unit.abbrev})
									</option>
								))}
							</select>
						</div>
					</div>
				</div>

				{result && (
					<div className={styles.resultSummary}>
						<span className={styles.resultText}>
							{inputValue} {AREA_UNITS.find((u) => u.id === fromUnit)?.abbrev} ={" "}
							<strong>
								{result} {AREA_UNITS.find((u) => u.id === toUnit)?.abbrev}
							</strong>
						</span>
						<button
							className={`${styles.copyBtn} ${copiedCell === "result" ? styles.copied : ""}`}
							onClick={() => copyToClipboard(`${result} ${AREA_UNITS.find((u) => u.id === toUnit)?.abbrev}`, "result")}
							title="Copy to clipboard"
						>
							{copiedCell === "result" ? <CheckIcon className={styles.copyIcon} /> : <ClipboardDocumentIcon className={styles.copyIcon} />}
						</button>
					</div>
				)}
			</div>

			{/* Reference Charts */}
			<div className={styles.chartsGrid}>
				{/* Imperial to Metric */}
				<div className={styles.glassCard}>
					<h3 className={styles.chartTitle}>Imperial to Metric</h3>
					<div className={styles.tableWrapper}>
						<table className={styles.referenceTable}>
							<thead>
								<tr>
									<th>Imperial</th>
									<th>Metric</th>
								</tr>
							</thead>
							<tbody>
								{IMPERIAL_TO_METRIC.map((row, i) => (
									<tr key={i}>
										<td>{row.imperial}</td>
										<td className={styles.clickableCell} onClick={() => copyToClipboard(row.metric, `imp-${i}`)}>
											{row.metric}
											{copiedCell === `imp-${i}` && <CheckIcon className={styles.copiedIcon} />}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>

				{/* Metric to Imperial */}
				<div className={styles.glassCard}>
					<h3 className={styles.chartTitle}>Metric to Imperial</h3>
					<div className={styles.tableWrapper}>
						<table className={styles.referenceTable}>
							<thead>
								<tr>
									<th>Metric</th>
									<th>Imperial</th>
								</tr>
							</thead>
							<tbody>
								{METRIC_TO_IMPERIAL.map((row, i) => (
									<tr key={i}>
										<td>{row.metric}</td>
										<td className={styles.clickableCell} onClick={() => copyToClipboard(row.imperial, `met-${i}`)}>
											{row.imperial}
											{copiedCell === `met-${i}` && <CheckIcon className={styles.copiedIcon} />}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			</div>

			{/* Real Estate Reference */}
			<div className={styles.glassCard}>
				<h3 className={styles.chartTitle}>Real Estate Reference</h3>
				<div className={styles.referencesGrid}>
					{REAL_ESTATE_REFERENCE.map((item, i) => (
						<div key={i} className={styles.referenceCard} onClick={() => copyToClipboard(item.size, `real-${i}`)}>
							<span className={styles.referenceLabel}>{item.description}</span>
							<span className={styles.referenceValue}>{item.size}</span>
							{copiedCell === `real-${i}` && <CheckIcon className={styles.referenceCopied} />}
						</div>
					))}
				</div>
			</div>

			{/* Land Measurement Reference */}
			<div className={styles.glassCard}>
				<h3 className={styles.chartTitle}>Land Measurement Examples</h3>
				<div className={styles.referencesGrid}>
					{LAND_MEASUREMENT.map((item, i) => (
						<div key={i} className={styles.referenceCard} onClick={() => copyToClipboard(item.size, `land-${i}`)}>
							<span className={styles.referenceLabel}>{item.description}</span>
							<span className={styles.referenceValue}>{item.size}</span>
							{copiedCell === `land-${i}` && <CheckIcon className={styles.referenceCopied} />}
						</div>
					))}
				</div>
			</div>

			{/* Quick Tips */}
			<div className={styles.glassCard}>
				<h3 className={styles.chartTitle}>Quick Tips</h3>
				<div className={styles.tipsGrid}>
					<div className={styles.tipCard}>
						<h4>Square Feet to Square Meters</h4>
						<p>Divide square feet by 10.76 for a quick estimate. Example: 1,000 ft² ÷ 10.76 ≈ 93 m²</p>
					</div>
					<div className={styles.tipCard}>
						<h4>Square Meters to Square Feet</h4>
						<p>Multiply square meters by 10.76 for a quick estimate. Example: 100 m² × 10.76 ≈ 1,076 ft²</p>
					</div>
					<div className={styles.tipCard}>
						<h4>Acres to Hectares</h4>
						<p>Multiply acres by 0.4 for a quick estimate. Example: 5 acres × 0.4 ≈ 2 hectares</p>
					</div>
					<div className={styles.tipCard}>
						<h4>Hectares to Acres</h4>
						<p>Multiply hectares by 2.5 for a quick estimate. Example: 4 ha × 2.5 ≈ 10 acres</p>
					</div>
				</div>
			</div>
		</div>
	);
}
