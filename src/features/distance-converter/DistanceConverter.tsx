"use client";

import { useState, useCallback } from "react";
import { ArrowsRightLeftIcon } from "@heroicons/react/24/outline";
import styles from "./DistanceConverter.module.scss";

interface ConversionUnit {
	id: string;
	name: string;
	abbrev: string;
	toBase: (value: number) => number; // Convert to base unit (meters)
	fromBase: (value: number) => number; // Convert from base unit
}

// Distance units (base: meters)
const DISTANCE_UNITS: ConversionUnit[] = [
	{ id: "mm", name: "Millimeters", abbrev: "mm", toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
	{ id: "cm", name: "Centimeters", abbrev: "cm", toBase: (v) => v / 100, fromBase: (v) => v * 100 },
	{ id: "m", name: "Meters", abbrev: "m", toBase: (v) => v, fromBase: (v) => v },
	{ id: "km", name: "Kilometers", abbrev: "km", toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
	{ id: "in", name: "Inches", abbrev: "in", toBase: (v) => v * 0.0254, fromBase: (v) => v / 0.0254 },
	{ id: "ft", name: "Feet", abbrev: "ft", toBase: (v) => v * 0.3048, fromBase: (v) => v / 0.3048 },
	{ id: "yd", name: "Yards", abbrev: "yd", toBase: (v) => v * 0.9144, fromBase: (v) => v / 0.9144 },
	{ id: "mi", name: "Miles", abbrev: "mi", toBase: (v) => v * 1609.344, fromBase: (v) => v / 1609.344 },
	{ id: "nmi", name: "Nautical Miles", abbrev: "nmi", toBase: (v) => v * 1852, fromBase: (v) => v / 1852 },
];

// Quick conversion reference
const COMMON_CONVERSIONS = [
	{ imperial: "1 inch", metric: "2.54 cm" },
	{ imperial: "1 foot", metric: "30.48 cm" },
	{ imperial: "1 yard", metric: "0.9144 m" },
	{ imperial: "1 mile", metric: "1.609 km" },
	{ imperial: "1 nautical mile", metric: "1.852 km" },
	{ imperial: "100 yards", metric: "91.44 m" },
	{ imperial: "5 miles", metric: "8.047 km" },
	{ imperial: "26.2 miles", metric: "42.195 km (marathon)" },
];

const METRIC_TO_IMPERIAL = [
	{ metric: "1 millimeter", imperial: "0.0394 in" },
	{ metric: "1 centimeter", imperial: "0.3937 in" },
	{ metric: "1 meter", imperial: "3.281 ft / 1.094 yd" },
	{ metric: "1 kilometer", imperial: "0.6214 mi" },
	{ metric: "100 meters", imperial: "328.1 ft" },
	{ metric: "5 kilometers", imperial: "3.107 mi" },
	{ metric: "10 kilometers", imperial: "6.214 mi" },
	{ metric: "100 kilometers", imperial: "62.14 mi" },
];

const COMMON_DISTANCES = [
	{ description: "Average human height", value: "1.7 m / 5 ft 7 in" },
	{ description: "Football field (US)", value: "100 yd / 91.44 m" },
	{ description: "Soccer field (length)", value: "100-110 m / 110-120 yd" },
	{ description: "Olympic swimming pool", value: "50 m / 164 ft" },
	{ description: "5K run", value: "5 km / 3.1 mi" },
	{ description: "10K run", value: "10 km / 6.2 mi" },
	{ description: "Half marathon", value: "21.1 km / 13.1 mi" },
	{ description: "Marathon", value: "42.195 km / 26.2 mi" },
];

function formatNumber(num: number): string {
	if (num === 0) return "0";
	if (Math.abs(num) < 0.0001) return num.toExponential(2);
	if (Math.abs(num) >= 1000000) return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
	if (Number.isInteger(num)) return num.toString();
	return num.toFixed(Math.abs(num) < 1 ? 4 : 2).replace(/\.?0+$/, "");
}

export default function DistanceConverter() {
	const [fromUnit, setFromUnit] = useState<string>("mi");
	const [toUnit, setToUnit] = useState<string>("km");
	const [inputValue, setInputValue] = useState<string>("1");

	const convert = useCallback(() => {
		const value = parseFloat(inputValue);
		if (isNaN(value)) return "";

		const from = DISTANCE_UNITS.find((u) => u.id === fromUnit);
		const to = DISTANCE_UNITS.find((u) => u.id === toUnit);

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

	const result = convert();

	return (
		<div className={styles.container}>
			{/* Converter Section */}
			<div className={styles.glassCard}>
				<h2 className={styles.sectionTitle}>Distance / Length Converter</h2>

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
								{DISTANCE_UNITS.map((unit) => (
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
								{DISTANCE_UNITS.map((unit) => (
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
							{inputValue} {DISTANCE_UNITS.find((u) => u.id === fromUnit)?.abbrev} ={" "}
							<strong>
								{result} {DISTANCE_UNITS.find((u) => u.id === toUnit)?.abbrev}
							</strong>
						</span>
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
								{COMMON_CONVERSIONS.map((row, i) => (
									<tr key={i}>
										<td>{row.imperial}</td>
										<td>{row.metric}</td>
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
										<td>{row.imperial}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			</div>

			{/* Common Distances */}
			<div className={styles.glassCard}>
				<h3 className={styles.chartTitle}>Common Distance References</h3>
				<div className={styles.referencesGrid}>
					{COMMON_DISTANCES.map((item, i) => (
						<div key={i} className={styles.referenceCard}>
							<span className={styles.referenceLabel}>{item.description}</span>
							<span className={styles.referenceValue}>{item.value}</span>
						</div>
					))}
				</div>
			</div>

			{/* Quick Tips */}
			<div className={styles.glassCard}>
				<h3 className={styles.chartTitle}>Quick Tips</h3>
				<div className={styles.tipsGrid}>
					<div className={styles.tipCard}>
						<h4>Miles to Kilometers</h4>
						<p>Multiply miles by 1.6 for a quick estimate. Example: 10 miles ≈ 16 km</p>
					</div>
					<div className={styles.tipCard}>
						<h4>Kilometers to Miles</h4>
						<p>Multiply kilometers by 0.6 for a quick estimate. Example: 10 km ≈ 6 miles</p>
					</div>
					<div className={styles.tipCard}>
						<h4>Feet to Meters</h4>
						<p>Divide feet by 3.3 for a quick estimate. Example: 100 ft ≈ 30 m</p>
					</div>
					<div className={styles.tipCard}>
						<h4>Inches to Centimeters</h4>
						<p>Multiply inches by 2.5 for a quick estimate. Example: 10 in ≈ 25 cm</p>
					</div>
				</div>
			</div>
		</div>
	);
}
