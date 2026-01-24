"use client";

import { useState, useCallback } from "react";
import { ArrowsRightLeftIcon } from "@heroicons/react/24/outline";
import styles from "./TemperatureConverter.module.scss";

interface ConversionUnit {
	id: string;
	name: string;
	abbrev: string;
	toBase: (value: number) => number; // Convert to base unit (Celsius)
	fromBase: (value: number) => number; // Convert from base unit
}

// Temperature units (base: Celsius)
const TEMP_UNITS: ConversionUnit[] = [
	{ id: "c", name: "Celsius", abbrev: "°C", toBase: (v) => v, fromBase: (v) => v },
	{ id: "f", name: "Fahrenheit", abbrev: "°F", toBase: (v) => ((v - 32) * 5) / 9, fromBase: (v) => (v * 9) / 5 + 32 },
	{ id: "k", name: "Kelvin", abbrev: "K", toBase: (v) => v - 273.15, fromBase: (v) => v + 273.15 },
];

// Common temperature reference points
const REFERENCE_POINTS = [
	{ description: "Absolute Zero", celsius: "-273.15", fahrenheit: "-459.67", kelvin: "0" },
	{ description: "Water Freezes", celsius: "0", fahrenheit: "32", kelvin: "273.15" },
	{ description: "Room Temperature", celsius: "20-22", fahrenheit: "68-72", kelvin: "293-295" },
	{ description: "Human Body Temp", celsius: "37", fahrenheit: "98.6", kelvin: "310.15" },
	{ description: "Water Boils", celsius: "100", fahrenheit: "212", kelvin: "373.15" },
];

const WEATHER_TEMPS = [
	{ description: "Freezing Cold", celsius: "-18", fahrenheit: "0", feel: "Extreme cold, frostbite risk" },
	{ description: "Very Cold", celsius: "-7", fahrenheit: "20", feel: "Heavy winter coat needed" },
	{ description: "Cold", celsius: "0", fahrenheit: "32", feel: "Winter coat, ice may form" },
	{ description: "Cool", celsius: "10", fahrenheit: "50", feel: "Light jacket or sweater" },
	{ description: "Mild", celsius: "15", fahrenheit: "59", feel: "Comfortable for most" },
	{ description: "Comfortable", celsius: "21", fahrenheit: "70", feel: "Ideal indoor temperature" },
	{ description: "Warm", celsius: "27", fahrenheit: "80", feel: "Light clothing, may feel warm" },
	{ description: "Hot", celsius: "32", fahrenheit: "90", feel: "Air conditioning helpful" },
	{ description: "Very Hot", celsius: "38", fahrenheit: "100", feel: "Extreme heat, stay hydrated" },
];

const COOKING_TEMPS = [
	{ description: "Warm hold", celsius: "60°C", fahrenheit: "140°F" },
	{ description: "Very Low Oven", celsius: "120°C", fahrenheit: "250°F" },
	{ description: "Low Oven", celsius: "150°C", fahrenheit: "300°F" },
	{ description: "Moderate Oven", celsius: "175°C", fahrenheit: "350°F" },
	{ description: "Moderately Hot", celsius: "190°C", fahrenheit: "375°F" },
	{ description: "Hot Oven", celsius: "200°C", fahrenheit: "400°F" },
	{ description: "Very Hot Oven", celsius: "230°C", fahrenheit: "450°F" },
	{ description: "Broil/Grill", celsius: "260°C+", fahrenheit: "500°F+" },
];

const FORMULAS = [
	{ from: "Celsius to Fahrenheit", formula: "°F = (°C × 9/5) + 32" },
	{ from: "Fahrenheit to Celsius", formula: "°C = (°F - 32) × 5/9" },
	{ from: "Celsius to Kelvin", formula: "K = °C + 273.15" },
	{ from: "Kelvin to Celsius", formula: "°C = K - 273.15" },
	{ from: "Fahrenheit to Kelvin", formula: "K = (°F - 32) × 5/9 + 273.15" },
	{ from: "Kelvin to Fahrenheit", formula: "°F = (K - 273.15) × 9/5 + 32" },
];

function formatNumber(num: number): string {
	if (num === 0) return "0";
	if (Math.abs(num) >= 10000) return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
	if (Number.isInteger(num)) return num.toString();
	return num.toFixed(2).replace(/\.?0+$/, "");
}

export default function TemperatureConverter() {
	const [fromUnit, setFromUnit] = useState<string>("f");
	const [toUnit, setToUnit] = useState<string>("c");
	const [inputValue, setInputValue] = useState<string>("72");

	const convert = useCallback(() => {
		const value = parseFloat(inputValue);
		if (isNaN(value)) return "";

		const from = TEMP_UNITS.find((u) => u.id === fromUnit);
		const to = TEMP_UNITS.find((u) => u.id === toUnit);

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
				<h2 className={styles.sectionTitle}>Temperature Converter</h2>

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
								placeholder="Enter temperature"
							/>
							<select value={fromUnit} onChange={(e) => setFromUnit(e.target.value)} className={styles.unitSelect}>
								{TEMP_UNITS.map((unit) => (
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
								{TEMP_UNITS.map((unit) => (
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
							{inputValue} {TEMP_UNITS.find((u) => u.id === fromUnit)?.abbrev} ={" "}
							<strong>
								{result} {TEMP_UNITS.find((u) => u.id === toUnit)?.abbrev}
							</strong>
						</span>
					</div>
				)}
			</div>

			{/* Reference Points */}
			<div className={styles.glassCard}>
				<h3 className={styles.chartTitle}>Key Temperature Reference Points</h3>
				<div className={styles.tableWrapper}>
					<table className={styles.referenceTable}>
						<thead>
							<tr>
								<th>Description</th>
								<th>Celsius</th>
								<th>Fahrenheit</th>
								<th>Kelvin</th>
							</tr>
						</thead>
						<tbody>
							{REFERENCE_POINTS.map((row, i) => (
								<tr key={i}>
									<td className={styles.descCell}>{row.description}</td>
									<td>{row.celsius}°C</td>
									<td>{row.fahrenheit}°F</td>
									<td>{row.kelvin} K</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>

			{/* Charts Grid */}
			<div className={styles.chartsGrid}>
				{/* Weather Temperatures */}
				<div className={styles.glassCard}>
					<h3 className={styles.chartTitle}>Weather Temperature Guide</h3>
					<div className={styles.tableWrapper}>
						<table className={styles.referenceTable}>
							<thead>
								<tr>
									<th>Condition</th>
									<th>°C</th>
									<th>°F</th>
									<th>Feel</th>
								</tr>
							</thead>
							<tbody>
								{WEATHER_TEMPS.map((row, i) => (
									<tr key={i}>
										<td>{row.description}</td>
										<td>{row.celsius}</td>
										<td>{row.fahrenheit}</td>
										<td className={styles.mutedCell}>{row.feel}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>

				{/* Cooking Temperatures */}
				<div className={styles.glassCard}>
					<h3 className={styles.chartTitle}>Cooking Temperatures</h3>
					<div className={styles.tableWrapper}>
						<table className={styles.referenceTable}>
							<thead>
								<tr>
									<th>Description</th>
									<th>Celsius</th>
									<th>Fahrenheit</th>
								</tr>
							</thead>
							<tbody>
								{COOKING_TEMPS.map((row, i) => (
									<tr key={i}>
										<td>{row.description}</td>
										<td>{row.celsius}</td>
										<td>{row.fahrenheit}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			</div>

			{/* Conversion Formulas */}
			<div className={styles.glassCard}>
				<h3 className={styles.chartTitle}>Conversion Formulas</h3>
				<div className={styles.formulasGrid}>
					{FORMULAS.map((item, i) => (
						<div key={i} className={styles.formulaCard}>
							<span className={styles.formulaLabel}>{item.from}</span>
							<code className={styles.formulaCode}>{item.formula}</code>
						</div>
					))}
				</div>
			</div>

			{/* Quick Tips */}
			<div className={styles.glassCard}>
				<h3 className={styles.chartTitle}>Quick Tips</h3>
				<div className={styles.tipsGrid}>
					<div className={styles.tipCard}>
						<h4>Quick °F to °C</h4>
						<p>Subtract 30, then divide by 2 for a rough estimate. Example: 80°F → (80-30)/2 = 25°C (actual: 26.7°C)</p>
					</div>
					<div className={styles.tipCard}>
						<h4>Quick °C to °F</h4>
						<p>Double the value and add 30 for a rough estimate. Example: 20°C → (20×2)+30 = 70°F (actual: 68°F)</p>
					</div>
					<div className={styles.tipCard}>
						<h4>Equal Point</h4>
						<p>-40° is where Celsius and Fahrenheit are equal: -40°C = -40°F</p>
					</div>
					<div className={styles.tipCard}>
						<h4>Kelvin for Science</h4>
						<p>Kelvin is the SI unit for temperature. It uses the same scale as Celsius but starts at absolute zero.</p>
					</div>
				</div>
			</div>
		</div>
	);
}
