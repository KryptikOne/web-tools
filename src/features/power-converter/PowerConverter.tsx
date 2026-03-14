"use client";

import { useState, useCallback } from "react";
import { ArrowsRightLeftIcon } from "@heroicons/react/24/outline";
import styles from "./PowerConverter.module.scss";

interface ConversionUnit {
	id: string;
	name: string;
	abbrev: string;
	toBase: (value: number) => number;
	fromBase: (value: number) => number;
}

// Power units (base: Watts)
const POWER_UNITS: ConversionUnit[] = [
	{ id: "w", name: "Watts", abbrev: "W", toBase: (v) => v, fromBase: (v) => v },
	{ id: "kw", name: "Kilowatts", abbrev: "kW", toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
	{ id: "mw", name: "Megawatts", abbrev: "MW", toBase: (v) => v * 1000000, fromBase: (v) => v / 1000000 },
	{ id: "hp", name: "Horsepower (mechanical)", abbrev: "hp", toBase: (v) => v * 745.7, fromBase: (v) => v / 745.7 },
	{ id: "ps", name: "Metric Horsepower", abbrev: "PS", toBase: (v) => v * 735.499, fromBase: (v) => v / 735.499 },
	{ id: "btuh", name: "BTU per hour", abbrev: "BTU/h", toBase: (v) => v * 0.29307, fromBase: (v) => v / 0.29307 },
	{ id: "ftlbs", name: "Foot-pounds per second", abbrev: "ft·lbf/s", toBase: (v) => v * 1.35582, fromBase: (v) => v / 1.35582 },
	{ id: "cals", name: "Calories per second", abbrev: "cal/s", toBase: (v) => v * 4.184, fromBase: (v) => v / 4.184 },
];

const APPLIANCE_POWER = [
	{ appliance: "LED light bulb", power: "10 W", hp: "0.013 hp" },
	{ appliance: "Ceiling fan", power: "75 W", hp: "0.1 hp" },
	{ appliance: "Laptop computer", power: "50 W", hp: "0.067 hp" },
	{ appliance: "Desktop computer", power: "200 W", hp: "0.27 hp" },
	{ appliance: "Refrigerator", power: "150 W", hp: "0.2 hp" },
	{ appliance: "Microwave oven", power: "1,000 W", hp: "1.34 hp" },
	{ appliance: "Hair dryer", power: "1,800 W", hp: "2.41 hp" },
	{ appliance: "Electric oven", power: "2,400 W", hp: "3.22 hp" },
	{ appliance: "Central AC unit", power: "3,500 W", hp: "4.69 hp" },
	{ appliance: "Electric car charger (L2)", power: "7,200 W", hp: "9.65 hp" },
];

const VEHICLE_POWER = [
	{ vehicle: "Electric scooter", hp: "1-3 hp", kw: "0.75-2.2 kW" },
	{ vehicle: "Lawn mower", hp: "3-7 hp", kw: "2.2-5.2 kW" },
	{ vehicle: "Motorcycle (small)", hp: "15-40 hp", kw: "11-30 kW" },
	{ vehicle: "Economy car", hp: "100-150 hp", kw: "75-112 kW" },
	{ vehicle: "Family sedan", hp: "150-250 hp", kw: "112-186 kW" },
	{ vehicle: "Sports car", hp: "300-500 hp", kw: "224-373 kW" },
	{ vehicle: "Supercar", hp: "600-1000 hp", kw: "447-746 kW" },
	{ vehicle: "Semi truck", hp: "400-600 hp", kw: "298-447 kW" },
	{ vehicle: "Freight locomotive", hp: "4,000-6,000 hp", kw: "2,983-4,474 kW" },
];

function formatNumber(num: number): string {
	if (num === 0) return "0";
	if (Math.abs(num) < 0.0001) return num.toExponential(2);
	if (Math.abs(num) >= 1000000) return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
	if (Number.isInteger(num)) return num.toString();
	return num.toFixed(Math.abs(num) < 1 ? 4 : 2).replace(/\.?0+$/, "");
}

export default function PowerConverter() {
	const [fromUnit, setFromUnit] = useState<string>("hp");
	const [toUnit, setToUnit] = useState<string>("kw");
	const [inputValue, setInputValue] = useState<string>("1");

	const convert = useCallback(() => {
		const value = parseFloat(inputValue);
		if (isNaN(value)) return "";

		const from = POWER_UNITS.find((u) => u.id === fromUnit);
		const to = POWER_UNITS.find((u) => u.id === toUnit);

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
				<h2 className={styles.sectionTitle}>Power Converter</h2>

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
								{POWER_UNITS.map((unit) => (
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
								{POWER_UNITS.map((unit) => (
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
							{inputValue} {POWER_UNITS.find((u) => u.id === fromUnit)?.abbrev} ={" "}
							<strong>
								{result} {POWER_UNITS.find((u) => u.id === toUnit)?.abbrev}
							</strong>
						</span>
					</div>
				)}
			</div>

			<div className={styles.chartsGrid}>
				<div className={styles.glassCard}>
					<h3 className={styles.chartTitle}>Appliance Power Consumption</h3>
					<div className={styles.tableWrapper}>
						<table className={styles.referenceTable}>
							<thead>
								<tr>
									<th>Appliance</th>
									<th>Power</th>
									<th>Horsepower</th>
								</tr>
							</thead>
							<tbody>
								{APPLIANCE_POWER.map((row, i) => (
									<tr key={i}>
										<td>{row.appliance}</td>
										<td>{row.power}</td>
										<td>{row.hp}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>

				<div className={styles.glassCard}>
					<h3 className={styles.chartTitle}>Vehicle Power Reference</h3>
					<div className={styles.tableWrapper}>
						<table className={styles.referenceTable}>
							<thead>
								<tr>
									<th>Vehicle</th>
									<th>HP</th>
									<th>kW</th>
								</tr>
							</thead>
							<tbody>
								{VEHICLE_POWER.map((row, i) => (
									<tr key={i}>
										<td>{row.vehicle}</td>
										<td>{row.hp}</td>
										<td>{row.kw}</td>
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
						<h4>HP to kW</h4>
						<p>Multiply horsepower by 0.746 for kilowatts. Example: 200 hp × 0.746 = 149.2 kW</p>
					</div>
					<div className={styles.tipCard}>
						<h4>kW to HP</h4>
						<p>Multiply kilowatts by 1.34 for horsepower. Example: 100 kW × 1.34 = 134 hp</p>
					</div>
					<div className={styles.tipCard}>
						<h4>HP vs PS</h4>
						<p>Mechanical hp (745.7 W) and metric PS (735.5 W) differ by ~1.4%. European cars often use PS.</p>
					</div>
					<div className={styles.tipCard}>
						<h4>Electricity Cost</h4>
						<p>Power (kW) × time (hours) = energy (kWh). A 1 kW appliance for 1 hour = 1 kWh ≈ $0.12</p>
					</div>
				</div>
			</div>
		</div>
	);
}
