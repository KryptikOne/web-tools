"use client";

import { useState, useCallback } from "react";
import { ArrowsRightLeftIcon } from "@heroicons/react/24/outline";
import styles from "./EnergyConverter.module.scss";

interface ConversionUnit {
	id: string;
	name: string;
	abbrev: string;
	toBase: (value: number) => number;
	fromBase: (value: number) => number;
}

// Energy units (base: Joules)
const ENERGY_UNITS: ConversionUnit[] = [
	{ id: "j", name: "Joules", abbrev: "J", toBase: (v) => v, fromBase: (v) => v },
	{ id: "kj", name: "Kilojoules", abbrev: "kJ", toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
	{ id: "cal", name: "Calories (small)", abbrev: "cal", toBase: (v) => v * 4.184, fromBase: (v) => v / 4.184 },
	{ id: "kcal", name: "Kilocalories (food)", abbrev: "kcal", toBase: (v) => v * 4184, fromBase: (v) => v / 4184 },
	{ id: "wh", name: "Watt-hours", abbrev: "Wh", toBase: (v) => v * 3600, fromBase: (v) => v / 3600 },
	{ id: "kwh", name: "Kilowatt-hours", abbrev: "kWh", toBase: (v) => v * 3600000, fromBase: (v) => v / 3600000 },
	{ id: "btu", name: "BTU", abbrev: "BTU", toBase: (v) => v * 1055.06, fromBase: (v) => v / 1055.06 },
	{ id: "ev", name: "Electron Volts", abbrev: "eV", toBase: (v) => v * 1.602e-19, fromBase: (v) => v / 1.602e-19 },
	{ id: "ftlbf", name: "Foot-pounds", abbrev: "ft·lbf", toBase: (v) => v * 1.35582, fromBase: (v) => v / 1.35582 },
];

const FOOD_CALORIES = [
	{ food: "Apple (medium)", kcal: "95 kcal", kj: "397 kJ" },
	{ food: "Banana (medium)", kcal: "105 kcal", kj: "439 kJ" },
	{ food: "Slice of bread", kcal: "79 kcal", kj: "331 kJ" },
	{ food: "Egg (large, boiled)", kcal: "78 kcal", kj: "326 kJ" },
	{ food: "Chicken breast (100g)", kcal: "165 kcal", kj: "690 kJ" },
	{ food: "Rice (1 cup cooked)", kcal: "206 kcal", kj: "862 kJ" },
	{ food: "Cheeseburger", kcal: "303 kcal", kj: "1268 kJ" },
	{ food: "Pizza slice", kcal: "285 kcal", kj: "1193 kJ" },
];

const ELECTRICITY_USAGE = [
	{ appliance: "LED bulb", watts: "10 W", daily: "0.24 kWh" },
	{ appliance: "Laptop", watts: "50 W", daily: "0.4 kWh" },
	{ appliance: "Desktop PC", watts: "200 W", daily: "1.6 kWh" },
	{ appliance: "Refrigerator", watts: "150 W", daily: "3.6 kWh" },
	{ appliance: "Washing machine", watts: "500 W", daily: "0.5 kWh" },
	{ appliance: "Microwave", watts: "1,000 W", daily: "0.25 kWh" },
	{ appliance: "Hair dryer", watts: "1,800 W", daily: "0.3 kWh" },
	{ appliance: "Electric oven", watts: "2,400 W", daily: "2.4 kWh" },
];

const ENERGY_EQUIVALENTS = [
	{ description: "1 food Calorie (kcal)", equivalent: "4,184 J = 4.184 kJ" },
	{ description: "1 kWh of electricity", equivalent: "3,600,000 J = 3,412 BTU" },
	{ description: "1 gallon of gasoline", equivalent: "~131,760 BTU = 138.7 MJ" },
	{ description: "Daily human intake (~2000 kcal)", equivalent: "8,368 kJ = 2.33 kWh" },
	{ description: "AA battery", equivalent: "~9,360 J = 2.6 Wh" },
	{ description: "Tesla battery (75 kWh)", equivalent: "270,000,000 J = 270 MJ" },
];

function formatNumber(num: number): string {
	if (num === 0) return "0";
	if (Math.abs(num) < 0.0001) return num.toExponential(2);
	if (Math.abs(num) >= 1000000) return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
	if (Number.isInteger(num)) return num.toString();
	return num.toFixed(Math.abs(num) < 1 ? 4 : 2).replace(/\.?0+$/, "");
}

export default function EnergyConverter() {
	const [fromUnit, setFromUnit] = useState<string>("kcal");
	const [toUnit, setToUnit] = useState<string>("kj");
	const [inputValue, setInputValue] = useState<string>("1");

	const convert = useCallback(() => {
		const value = parseFloat(inputValue);
		if (isNaN(value)) return "";

		const from = ENERGY_UNITS.find((u) => u.id === fromUnit);
		const to = ENERGY_UNITS.find((u) => u.id === toUnit);

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
				<h2 className={styles.sectionTitle}>Energy Converter</h2>

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
								{ENERGY_UNITS.map((unit) => (
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
								{ENERGY_UNITS.map((unit) => (
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
							{inputValue} {ENERGY_UNITS.find((u) => u.id === fromUnit)?.abbrev} ={" "}
							<strong>
								{result} {ENERGY_UNITS.find((u) => u.id === toUnit)?.abbrev}
							</strong>
						</span>
					</div>
				)}
			</div>

			<div className={styles.chartsGrid}>
				<div className={styles.glassCard}>
					<h3 className={styles.chartTitle}>Food Calorie Reference</h3>
					<div className={styles.tableWrapper}>
						<table className={styles.referenceTable}>
							<thead>
								<tr>
									<th>Food</th>
									<th>kcal</th>
									<th>kJ</th>
								</tr>
							</thead>
							<tbody>
								{FOOD_CALORIES.map((row, i) => (
									<tr key={i}>
										<td>{row.food}</td>
										<td>{row.kcal}</td>
										<td>{row.kj}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>

				<div className={styles.glassCard}>
					<h3 className={styles.chartTitle}>Electricity Usage</h3>
					<div className={styles.tableWrapper}>
						<table className={styles.referenceTable}>
							<thead>
								<tr>
									<th>Appliance</th>
									<th>Power</th>
									<th>Daily Use</th>
								</tr>
							</thead>
							<tbody>
								{ELECTRICITY_USAGE.map((row, i) => (
									<tr key={i}>
										<td>{row.appliance}</td>
										<td>{row.watts}</td>
										<td>{row.daily}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			</div>

			<div className={styles.glassCard}>
				<h3 className={styles.chartTitle}>Energy Equivalents</h3>
				<div className={styles.referencesGrid}>
					{ENERGY_EQUIVALENTS.map((item, i) => (
						<div key={i} className={styles.referenceCard}>
							<span className={styles.referenceLabel}>{item.description}</span>
							<span className={styles.referenceValue}>{item.equivalent}</span>
						</div>
					))}
				</div>
			</div>

			<div className={styles.glassCard}>
				<h3 className={styles.chartTitle}>Quick Tips</h3>
				<div className={styles.tipsGrid}>
					<div className={styles.tipCard}>
						<h4>Calories vs Kilocalories</h4>
						<p>Food &quot;Calories&quot; (capital C) are actually kilocalories (kcal). 1 food Calorie = 1 kcal = 1000 cal.</p>
					</div>
					<div className={styles.tipCard}>
						<h4>kJ to kcal</h4>
						<p>Divide kilojoules by 4.184 for kilocalories. Example: 500 kJ ÷ 4.184 ≈ 120 kcal</p>
					</div>
					<div className={styles.tipCard}>
						<h4>kWh Cost</h4>
						<p>Average US electricity costs ~$0.12/kWh. A 1000W appliance running 1 hour = 1 kWh ≈ $0.12</p>
					</div>
					<div className={styles.tipCard}>
						<h4>BTU to kWh</h4>
						<p>Divide BTU by 3,412 for kWh. Example: 10,000 BTU ÷ 3,412 ≈ 2.93 kWh</p>
					</div>
				</div>
			</div>
		</div>
	);
}
