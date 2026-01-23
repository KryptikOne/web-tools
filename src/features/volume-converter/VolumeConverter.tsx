"use client";

import { useState, useCallback } from "react";
import { ArrowsRightLeftIcon, ClipboardDocumentIcon, CheckIcon } from "@heroicons/react/24/outline";
import styles from "./VolumeConverter.module.scss";

interface ConversionUnit {
	id: string;
	name: string;
	abbrev: string;
	toBase: (value: number) => number; // Convert to base unit (liters)
	fromBase: (value: number) => number; // Convert from base unit
}

// Volume units (base: liters)
const VOLUME_UNITS: ConversionUnit[] = [
	{ id: "ml", name: "Milliliters", abbrev: "mL", toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
	{ id: "l", name: "Liters", abbrev: "L", toBase: (v) => v, fromBase: (v) => v },
	{ id: "cubm", name: "Cubic Meters", abbrev: "m³", toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
	{ id: "floz_us", name: "Fluid Ounces (US)", abbrev: "fl oz", toBase: (v) => v * 0.0295735, fromBase: (v) => v / 0.0295735 },
	{ id: "floz_uk", name: "Fluid Ounces (UK)", abbrev: "fl oz UK", toBase: (v) => v * 0.0284131, fromBase: (v) => v / 0.0284131 },
	{ id: "cup_us", name: "Cups (US)", abbrev: "cup", toBase: (v) => v * 0.236588, fromBase: (v) => v / 0.236588 },
	{ id: "pt_us", name: "Pints (US)", abbrev: "pt", toBase: (v) => v * 0.473176, fromBase: (v) => v / 0.473176 },
	{ id: "qt_us", name: "Quarts (US)", abbrev: "qt", toBase: (v) => v * 0.946353, fromBase: (v) => v / 0.946353 },
	{ id: "gal_us", name: "Gallons (US)", abbrev: "gal", toBase: (v) => v * 3.78541, fromBase: (v) => v / 3.78541 },
	{ id: "gal_uk", name: "Gallons (UK)", abbrev: "gal UK", toBase: (v) => v * 4.54609, fromBase: (v) => v / 4.54609 },
	{ id: "cubin", name: "Cubic Inches", abbrev: "in³", toBase: (v) => v * 0.0163871, fromBase: (v) => v / 0.0163871 },
	{ id: "cubft", name: "Cubic Feet", abbrev: "ft³", toBase: (v) => v * 28.3168, fromBase: (v) => v / 28.3168 },
	{ id: "cubyd", name: "Cubic Yards", abbrev: "yd³", toBase: (v) => v * 764.555, fromBase: (v) => v / 764.555 },
];

// Quick conversion reference
const US_TO_METRIC = [
	{ us: "1 fluid ounce", metric: "29.57 mL" },
	{ us: "1 cup (8 fl oz)", metric: "236.6 mL" },
	{ us: "1 pint (16 fl oz)", metric: "473.2 mL" },
	{ us: "1 quart (32 fl oz)", metric: "946.4 mL" },
	{ us: "1 gallon (128 fl oz)", metric: "3.785 L" },
	{ us: "5 gallons", metric: "18.93 L" },
	{ us: "1 cubic foot", metric: "28.32 L" },
	{ us: "1 cubic yard", metric: "764.6 L" },
];

const METRIC_TO_US = [
	{ metric: "100 milliliters", us: "3.38 fl oz" },
	{ metric: "250 milliliters", us: "8.45 fl oz / 1.06 cup" },
	{ metric: "500 milliliters", us: "16.9 fl oz / 1.06 pt" },
	{ metric: "1 liter", us: "33.8 fl oz / 1.06 qt" },
	{ metric: "2 liters", us: "67.6 fl oz / 0.53 gal" },
	{ metric: "5 liters", us: "1.32 gal" },
	{ metric: "20 liters", us: "5.28 gal" },
	{ metric: "1 cubic meter", us: "264.2 gal / 35.3 ft³" },
];

const TANK_SIZES = [
	{ description: "Small fish tank", volume: "5 gal / 19 L" },
	{ description: "Medium aquarium", volume: "20 gal / 76 L" },
	{ description: "Large aquarium", volume: "55 gal / 208 L" },
	{ description: "Water heater (typical)", volume: "40-50 gal / 150-190 L" },
	{ description: "Bathtub (full)", volume: "80 gal / 300 L" },
	{ description: "Hot tub (small)", volume: "200-300 gal / 750-1,135 L" },
	{ description: "Rain barrel", volume: "55 gal / 208 L" },
	{ description: "IBC tote", volume: "275 gal / 1,040 L" },
];

const POOL_ESTIMATES = [
	{ description: "Kiddie pool", volume: "50-200 gal / 190-760 L" },
	{ description: "Above-ground (12ft round)", volume: "~3,400 gal / 12,900 L" },
	{ description: "Above-ground (15ft round)", volume: "~5,300 gal / 20,000 L" },
	{ description: "Above-ground (18ft round)", volume: "~7,600 gal / 28,800 L" },
	{ description: "In-ground (small)", volume: "~10,000 gal / 37,900 L" },
	{ description: "In-ground (medium)", volume: "~20,000 gal / 75,700 L" },
	{ description: "In-ground (large)", volume: "~30,000+ gal / 113,500+ L" },
	{ description: "Olympic pool", volume: "660,000 gal / 2,500,000 L" },
];

const US_UK_COMPARISON = [
	{ unit: "Fluid Ounce", us: "29.57 mL", uk: "28.41 mL", note: "UK slightly smaller" },
	{ unit: "Pint", us: "473 mL (16 fl oz)", uk: "568 mL (20 fl oz)", note: "UK 20% larger" },
	{ unit: "Quart", us: "946 mL", uk: "1,137 mL", note: "UK 20% larger" },
	{ unit: "Gallon", us: "3.785 L", uk: "4.546 L", note: "UK 20% larger" },
];

function formatNumber(num: number): string {
	if (num === 0) return "0";
	if (Math.abs(num) < 0.0001) return num.toExponential(2);
	if (Math.abs(num) >= 1000000) return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
	if (Number.isInteger(num)) return num.toLocaleString();
	return num.toFixed(Math.abs(num) < 1 ? 4 : 2).replace(/\.?0+$/, "");
}

export default function VolumeConverter() {
	const [fromUnit, setFromUnit] = useState<string>("gal_us");
	const [toUnit, setToUnit] = useState<string>("l");
	const [inputValue, setInputValue] = useState<string>("1");
	const [copiedCell, setCopiedCell] = useState<string | null>(null);

	const convert = useCallback(() => {
		const value = parseFloat(inputValue);
		if (isNaN(value)) return "";

		const from = VOLUME_UNITS.find((u) => u.id === fromUnit);
		const to = VOLUME_UNITS.find((u) => u.id === toUnit);

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
				<h2 className={styles.sectionTitle}>Volume Converter</h2>

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
								{VOLUME_UNITS.map((unit) => (
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
								{VOLUME_UNITS.map((unit) => (
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
							{inputValue} {VOLUME_UNITS.find((u) => u.id === fromUnit)?.abbrev} ={" "}
							<strong>
								{result} {VOLUME_UNITS.find((u) => u.id === toUnit)?.abbrev}
							</strong>
						</span>
						<button
							className={`${styles.copyBtn} ${copiedCell === "result" ? styles.copied : ""}`}
							onClick={() => copyToClipboard(`${result} ${VOLUME_UNITS.find((u) => u.id === toUnit)?.abbrev}`, "result")}
							title="Copy to clipboard"
						>
							{copiedCell === "result" ? <CheckIcon className={styles.copyIcon} /> : <ClipboardDocumentIcon className={styles.copyIcon} />}
						</button>
					</div>
				)}
			</div>

			{/* Reference Charts */}
			<div className={styles.chartsGrid}>
				{/* US to Metric */}
				<div className={styles.glassCard}>
					<h3 className={styles.chartTitle}>US to Metric</h3>
					<div className={styles.tableWrapper}>
						<table className={styles.referenceTable}>
							<thead>
								<tr>
									<th>US</th>
									<th>Metric</th>
								</tr>
							</thead>
							<tbody>
								{US_TO_METRIC.map((row, i) => (
									<tr key={i}>
										<td>{row.us}</td>
										<td className={styles.clickableCell} onClick={() => copyToClipboard(row.metric, `us-${i}`)}>
											{row.metric}
											{copiedCell === `us-${i}` && <CheckIcon className={styles.copiedIcon} />}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>

				{/* Metric to US */}
				<div className={styles.glassCard}>
					<h3 className={styles.chartTitle}>Metric to US</h3>
					<div className={styles.tableWrapper}>
						<table className={styles.referenceTable}>
							<thead>
								<tr>
									<th>Metric</th>
									<th>US</th>
								</tr>
							</thead>
							<tbody>
								{METRIC_TO_US.map((row, i) => (
									<tr key={i}>
										<td>{row.metric}</td>
										<td className={styles.clickableCell} onClick={() => copyToClipboard(row.us, `met-${i}`)}>
											{row.us}
											{copiedCell === `met-${i}` && <CheckIcon className={styles.copiedIcon} />}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			</div>

			{/* US vs UK Comparison */}
			<div className={styles.glassCard}>
				<h3 className={styles.chartTitle}>US vs UK Units</h3>
				<p className={styles.chartSubtitle}>Imperial units differ between US and UK systems</p>
				<div className={styles.tableWrapper}>
					<table className={styles.referenceTable}>
						<thead>
							<tr>
								<th>Unit</th>
								<th>US</th>
								<th>UK</th>
								<th>Note</th>
							</tr>
						</thead>
						<tbody>
							{US_UK_COMPARISON.map((row, i) => (
								<tr key={i}>
									<td className={styles.boldCell}>{row.unit}</td>
									<td className={styles.clickableCell} onClick={() => copyToClipboard(row.us, `comp-us-${i}`)}>
										{row.us}
										{copiedCell === `comp-us-${i}` && <CheckIcon className={styles.copiedIcon} />}
									</td>
									<td className={styles.clickableCell} onClick={() => copyToClipboard(row.uk, `comp-uk-${i}`)}>
										{row.uk}
										{copiedCell === `comp-uk-${i}` && <CheckIcon className={styles.copiedIcon} />}
									</td>
									<td className={styles.mutedCell}>{row.note}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>

			{/* Tank and Container Sizes */}
			<div className={styles.glassCard}>
				<h3 className={styles.chartTitle}>Common Tank &amp; Container Sizes</h3>
				<div className={styles.referencesGrid}>
					{TANK_SIZES.map((item, i) => (
						<div key={i} className={styles.referenceCard} onClick={() => copyToClipboard(item.volume, `tank-${i}`)}>
							<span className={styles.referenceLabel}>{item.description}</span>
							<span className={styles.referenceValue}>{item.volume}</span>
							{copiedCell === `tank-${i}` && <CheckIcon className={styles.referenceCopied} />}
						</div>
					))}
				</div>
			</div>

			{/* Pool Volume Estimates */}
			<div className={styles.glassCard}>
				<h3 className={styles.chartTitle}>Pool Volume Estimates</h3>
				<div className={styles.referencesGrid}>
					{POOL_ESTIMATES.map((item, i) => (
						<div key={i} className={styles.referenceCard} onClick={() => copyToClipboard(item.volume, `pool-${i}`)}>
							<span className={styles.referenceLabel}>{item.description}</span>
							<span className={styles.referenceValue}>{item.volume}</span>
							{copiedCell === `pool-${i}` && <CheckIcon className={styles.referenceCopied} />}
						</div>
					))}
				</div>
			</div>

			{/* Quick Tips */}
			<div className={styles.glassCard}>
				<h3 className={styles.chartTitle}>Quick Tips</h3>
				<div className={styles.tipsGrid}>
					<div className={styles.tipCard}>
						<h4>Gallons to Liters</h4>
						<p>Multiply US gallons by 3.8 for a quick estimate. Example: 10 gal × 3.8 ≈ 38 L</p>
					</div>
					<div className={styles.tipCard}>
						<h4>Liters to Gallons</h4>
						<p>Divide liters by 3.8 for a quick estimate. Example: 20 L ÷ 3.8 ≈ 5.3 gal</p>
					</div>
					<div className={styles.tipCard}>
						<h4>Cubic Feet to Gallons</h4>
						<p>Multiply cubic feet by 7.5 for gallons. Example: 10 ft³ × 7.5 ≈ 75 gal</p>
					</div>
					<div className={styles.tipCard}>
						<h4>Pool Volume Formula</h4>
						<p>For rectangular pools: Length × Width × Avg Depth × 7.5 = gallons</p>
					</div>
				</div>
			</div>
		</div>
	);
}
