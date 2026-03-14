"use client";

import { useState, useCallback } from "react";
import { ArrowsRightLeftIcon } from "@heroicons/react/24/outline";
import styles from "./PressureConverter.module.scss";

interface ConversionUnit {
	id: string;
	name: string;
	abbrev: string;
	toBase: (value: number) => number;
	fromBase: (value: number) => number;
}

// Pressure units (base: Pascals)
const PRESSURE_UNITS: ConversionUnit[] = [
	{ id: "pa", name: "Pascals", abbrev: "Pa", toBase: (v) => v, fromBase: (v) => v },
	{ id: "kpa", name: "Kilopascals", abbrev: "kPa", toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
	{ id: "mpa", name: "Megapascals", abbrev: "MPa", toBase: (v) => v * 1000000, fromBase: (v) => v / 1000000 },
	{ id: "bar", name: "Bar", abbrev: "bar", toBase: (v) => v * 100000, fromBase: (v) => v / 100000 },
	{ id: "atm", name: "Atmospheres", abbrev: "atm", toBase: (v) => v * 101325, fromBase: (v) => v / 101325 },
	{ id: "psi", name: "PSI", abbrev: "psi", toBase: (v) => v * 6894.76, fromBase: (v) => v / 6894.76 },
	{ id: "mmhg", name: "mmHg (Torr)", abbrev: "mmHg", toBase: (v) => v * 133.322, fromBase: (v) => v / 133.322 },
	{ id: "inhg", name: "Inches of Mercury", abbrev: "inHg", toBase: (v) => v * 3386.39, fromBase: (v) => v / 3386.39 },
];

const COMMON_CONVERSIONS = [
	{ from: "1 atm", to: "101.325 kPa" },
	{ from: "1 atm", to: "14.696 psi" },
	{ from: "1 atm", to: "760 mmHg" },
	{ from: "1 atm", to: "29.921 inHg" },
	{ from: "1 bar", to: "14.504 psi" },
	{ from: "1 bar", to: "100 kPa" },
	{ from: "1 psi", to: "6.895 kPa" },
	{ from: "1 psi", to: "51.715 mmHg" },
];

const TIRE_PRESSURE = [
	{ vehicle: "Passenger car", psi: "30-35 psi", kpa: "207-241 kPa", bar: "2.1-2.4 bar" },
	{ vehicle: "SUV / Light truck", psi: "35-40 psi", kpa: "241-276 kPa", bar: "2.4-2.8 bar" },
	{ vehicle: "Heavy truck", psi: "80-100 psi", kpa: "552-689 kPa", bar: "5.5-6.9 bar" },
	{ vehicle: "Road bike", psi: "80-130 psi", kpa: "552-896 kPa", bar: "5.5-9.0 bar" },
	{ vehicle: "Mountain bike", psi: "30-50 psi", kpa: "207-345 kPa", bar: "2.1-3.4 bar" },
	{ vehicle: "Motorcycle", psi: "28-40 psi", kpa: "193-276 kPa", bar: "1.9-2.8 bar" },
];

const WEATHER_PRESSURE = [
	{ condition: "Strong high pressure", inhg: "30.40+ inHg", hpa: "1030+ hPa" },
	{ condition: "Normal high pressure", inhg: "30.20 inHg", hpa: "1023 hPa" },
	{ condition: "Standard atmosphere", inhg: "29.92 inHg", hpa: "1013.25 hPa" },
	{ condition: "Normal low pressure", inhg: "29.60 inHg", hpa: "1003 hPa" },
	{ condition: "Tropical storm", inhg: "29.00 inHg", hpa: "982 hPa" },
	{ condition: "Category 1 hurricane", inhg: "28.94 inHg", hpa: "980 hPa" },
	{ condition: "Category 5 hurricane", inhg: "< 27.17 inHg", hpa: "< 920 hPa" },
];

function formatNumber(num: number): string {
	if (num === 0) return "0";
	if (Math.abs(num) < 0.0001) return num.toExponential(2);
	if (Math.abs(num) >= 1000000) return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
	if (Number.isInteger(num)) return num.toString();
	return num.toFixed(Math.abs(num) < 1 ? 4 : 2).replace(/\.?0+$/, "");
}

export default function PressureConverter() {
	const [fromUnit, setFromUnit] = useState<string>("psi");
	const [toUnit, setToUnit] = useState<string>("kpa");
	const [inputValue, setInputValue] = useState<string>("1");

	const convert = useCallback(() => {
		const value = parseFloat(inputValue);
		if (isNaN(value)) return "";

		const from = PRESSURE_UNITS.find((u) => u.id === fromUnit);
		const to = PRESSURE_UNITS.find((u) => u.id === toUnit);

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
			<div className={styles.glassCard}>
				<h2 className={styles.sectionTitle}>Pressure Converter</h2>

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
								{PRESSURE_UNITS.map((unit) => (
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
								{PRESSURE_UNITS.map((unit) => (
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
							{inputValue} {PRESSURE_UNITS.find((u) => u.id === fromUnit)?.abbrev} ={" "}
							<strong>
								{result} {PRESSURE_UNITS.find((u) => u.id === toUnit)?.abbrev}
							</strong>
						</span>
					</div>
				)}
			</div>

			<div className={styles.chartsGrid}>
				<div className={styles.glassCard}>
					<h3 className={styles.chartTitle}>Common Conversions</h3>
					<div className={styles.tableWrapper}>
						<table className={styles.referenceTable}>
							<thead>
								<tr>
									<th>From</th>
									<th>To</th>
								</tr>
							</thead>
							<tbody>
								{COMMON_CONVERSIONS.map((row, i) => (
									<tr key={i}>
										<td>{row.from}</td>
										<td>{row.to}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>

				<div className={styles.glassCard}>
					<h3 className={styles.chartTitle}>Weather Pressure</h3>
					<div className={styles.tableWrapper}>
						<table className={styles.referenceTable}>
							<thead>
								<tr>
									<th>Condition</th>
									<th>inHg</th>
									<th>hPa</th>
								</tr>
							</thead>
							<tbody>
								{WEATHER_PRESSURE.map((row, i) => (
									<tr key={i}>
										<td>{row.condition}</td>
										<td>{row.inhg}</td>
										<td>{row.hpa}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			</div>

			<div className={styles.glassCard}>
				<h3 className={styles.chartTitle}>Tire Pressure Reference</h3>
				<div className={styles.tableWrapper}>
					<table className={styles.referenceTable}>
						<thead>
							<tr>
								<th>Vehicle</th>
								<th>PSI</th>
								<th>kPa</th>
								<th>Bar</th>
							</tr>
						</thead>
						<tbody>
							{TIRE_PRESSURE.map((row, i) => (
								<tr key={i}>
									<td>{row.vehicle}</td>
									<td>{row.psi}</td>
									<td>{row.kpa}</td>
									<td>{row.bar}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>

			<div className={styles.glassCard}>
				<h3 className={styles.chartTitle}>Quick Tips</h3>
				<div className={styles.tipsGrid}>
					<div className={styles.tipCard}>
						<h4>PSI to Bar</h4>
						<p>Divide PSI by ~14.5 for a quick bar estimate. Example: 30 psi ÷ 14.5 ≈ 2.07 bar</p>
					</div>
					<div className={styles.tipCard}>
						<h4>Standard Atmosphere</h4>
						<p>Sea level pressure: 1 atm = 101.325 kPa = 14.696 psi = 760 mmHg = 29.92 inHg</p>
					</div>
					<div className={styles.tipCard}>
						<h4>Bar to PSI</h4>
						<p>Multiply bar by ~14.5 for PSI. Example: 2.5 bar × 14.5 ≈ 36.3 psi</p>
					</div>
					<div className={styles.tipCard}>
						<h4>Altitude Effect</h4>
						<p>Atmospheric pressure drops ~1 inHg per 1,000 ft of elevation gain</p>
					</div>
				</div>
			</div>
		</div>
	);
}
