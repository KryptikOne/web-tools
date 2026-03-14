"use client";

import { useState, useCallback } from "react";
import { ArrowsRightLeftIcon } from "@heroicons/react/24/outline";
import styles from "./FuelEconomyConverter.module.scss";

interface ConversionUnit {
	id: string;
	name: string;
	abbrev: string;
	toBase: (value: number) => number;
	fromBase: (value: number) => number;
}

// Fuel economy units (base: km per liter)
// Note: L/100km is inverse - handled specially in convert()
const FUEL_UNITS: ConversionUnit[] = [
	{ id: "kml", name: "Kilometers per liter", abbrev: "km/L", toBase: (v) => v, fromBase: (v) => v },
	{ id: "mpg_us", name: "Miles per gallon (US)", abbrev: "mpg (US)", toBase: (v) => v * 0.425144, fromBase: (v) => v / 0.425144 },
	{ id: "mpg_uk", name: "Miles per gallon (UK)", abbrev: "mpg (UK)", toBase: (v) => v * 0.354006, fromBase: (v) => v / 0.354006 },
	{ id: "l100km", name: "Liters per 100 km", abbrev: "L/100km", toBase: (v) => (v === 0 ? 0 : 100 / v), fromBase: (v) => (v === 0 ? 0 : 100 / v) },
	{ id: "mil", name: "Miles per liter", abbrev: "mi/L", toBase: (v) => v * 1.60934, fromBase: (v) => v / 1.60934 },
];

const MPG_TO_L100KM = [
	{ mpg_us: "15 mpg", l100km: "15.7 L/100km", mpg_uk: "18.0 mpg (UK)" },
	{ mpg_us: "20 mpg", l100km: "11.8 L/100km", mpg_uk: "24.0 mpg (UK)" },
	{ mpg_us: "25 mpg", l100km: "9.4 L/100km", mpg_uk: "30.0 mpg (UK)" },
	{ mpg_us: "30 mpg", l100km: "7.8 L/100km", mpg_uk: "36.0 mpg (UK)" },
	{ mpg_us: "35 mpg", l100km: "6.7 L/100km", mpg_uk: "42.0 mpg (UK)" },
	{ mpg_us: "40 mpg", l100km: "5.9 L/100km", mpg_uk: "48.0 mpg (UK)" },
	{ mpg_us: "50 mpg", l100km: "4.7 L/100km", mpg_uk: "60.1 mpg (UK)" },
	{ mpg_us: "60 mpg", l100km: "3.9 L/100km", mpg_uk: "72.1 mpg (UK)" },
];

const VEHICLE_EFFICIENCY = [
	{ vehicle: "Large SUV / Truck", mpg: "15-20 mpg", l100km: "11.8-15.7 L/100km" },
	{ vehicle: "Mid-size SUV", mpg: "22-28 mpg", l100km: "8.4-10.7 L/100km" },
	{ vehicle: "Sedan", mpg: "28-35 mpg", l100km: "6.7-8.4 L/100km" },
	{ vehicle: "Compact car", mpg: "30-38 mpg", l100km: "6.2-7.8 L/100km" },
	{ vehicle: "Hybrid", mpg: "45-55 mpg", l100km: "4.3-5.2 L/100km" },
	{ vehicle: "Plug-in hybrid (gas)", mpg: "50-80 mpg", l100km: "2.9-4.7 L/100km" },
	{ vehicle: "Motorcycle", mpg: "40-70 mpg", l100km: "3.4-5.9 L/100km" },
];

function formatNumber(num: number): string {
	if (num === 0) return "0";
	if (Math.abs(num) < 0.0001) return num.toExponential(2);
	if (Math.abs(num) >= 1000000) return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
	if (Number.isInteger(num)) return num.toString();
	return num.toFixed(Math.abs(num) < 1 ? 4 : 2).replace(/\.?0+$/, "");
}

export default function FuelEconomyConverter() {
	const [fromUnit, setFromUnit] = useState<string>("mpg_us");
	const [toUnit, setToUnit] = useState<string>("l100km");
	const [inputValue, setInputValue] = useState<string>("25");

	const convert = useCallback(() => {
		const value = parseFloat(inputValue);
		if (isNaN(value) || value === 0) return "";

		const from = FUEL_UNITS.find((u) => u.id === fromUnit);
		const to = FUEL_UNITS.find((u) => u.id === toUnit);

		if (!from || !to) return "";

		const baseValue = from.toBase(value);
		if (baseValue === 0) return "0";
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
			<div className={styles.glassCard}>
				<h2 className={styles.sectionTitle}>Fuel Economy Converter</h2>

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
								{FUEL_UNITS.map((unit) => (
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
								{FUEL_UNITS.map((unit) => (
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
							{inputValue} {FUEL_UNITS.find((u) => u.id === fromUnit)?.abbrev} ={" "}
							<strong>
								{result} {FUEL_UNITS.find((u) => u.id === toUnit)?.abbrev}
							</strong>
						</span>
					</div>
				)}
			</div>

			<div className={styles.chartsGrid}>
				<div className={styles.glassCard}>
					<h3 className={styles.chartTitle}>MPG to L/100km Reference</h3>
					<div className={styles.tableWrapper}>
						<table className={styles.referenceTable}>
							<thead>
								<tr>
									<th>US MPG</th>
									<th>L/100km</th>
									<th>UK MPG</th>
								</tr>
							</thead>
							<tbody>
								{MPG_TO_L100KM.map((row, i) => (
									<tr key={i}>
										<td>{row.mpg_us}</td>
										<td>{row.l100km}</td>
										<td>{row.mpg_uk}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>

				<div className={styles.glassCard}>
					<h3 className={styles.chartTitle}>Typical Vehicle Efficiency</h3>
					<div className={styles.tableWrapper}>
						<table className={styles.referenceTable}>
							<thead>
								<tr>
									<th>Vehicle Type</th>
									<th>US MPG</th>
									<th>L/100km</th>
								</tr>
							</thead>
							<tbody>
								{VEHICLE_EFFICIENCY.map((row, i) => (
									<tr key={i}>
										<td>{row.vehicle}</td>
										<td>{row.mpg}</td>
										<td>{row.l100km}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			</div>

			<div className={styles.glassCard}>
				<h3 className={styles.chartTitle}>Quick Tips</h3>
				<div className={styles.tipsGrid}>
					<div className={styles.tipCard}>
						<h4>MPG to L/100km</h4>
						<p>Divide 235.21 by the MPG value. Example: 235.21 ÷ 30 mpg ≈ 7.8 L/100km</p>
					</div>
					<div className={styles.tipCard}>
						<h4>US vs UK Gallons</h4>
						<p>1 UK gallon = 1.201 US gallons. UK MPG figures are always higher than US MPG for the same car.</p>
					</div>
					<div className={styles.tipCard}>
						<h4>L/100km Meaning</h4>
						<p>Lower is better for L/100km (opposite of MPG). 5 L/100km is very efficient; 15 L/100km is poor.</p>
					</div>
					<div className={styles.tipCard}>
						<h4>Trip Cost Estimate</h4>
						<p>Distance ÷ MPG × price per gallon = trip fuel cost. Example: 300 mi ÷ 30 mpg × $3.50 = $35</p>
					</div>
				</div>
			</div>
		</div>
	);
}
