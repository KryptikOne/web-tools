"use client";

import { useState, useCallback } from "react";
import { ArrowsRightLeftIcon } from "@heroicons/react/24/outline";
import styles from "./SpeedConverter.module.scss";

interface ConversionUnit {
	id: string;
	name: string;
	abbrev: string;
	toBase: (value: number) => number;
	fromBase: (value: number) => number;
}

// Speed units (base: meters per second)
const SPEED_UNITS: ConversionUnit[] = [
	{ id: "ms", name: "Meters per second", abbrev: "m/s", toBase: (v) => v, fromBase: (v) => v },
	{ id: "kmh", name: "Kilometers per hour", abbrev: "km/h", toBase: (v) => v / 3.6, fromBase: (v) => v * 3.6 },
	{ id: "mph", name: "Miles per hour", abbrev: "mph", toBase: (v) => v * 0.44704, fromBase: (v) => v / 0.44704 },
	{ id: "fps", name: "Feet per second", abbrev: "ft/s", toBase: (v) => v * 0.3048, fromBase: (v) => v / 0.3048 },
	{ id: "knots", name: "Knots", abbrev: "kn", toBase: (v) => v * 0.514444, fromBase: (v) => v / 0.514444 },
	{ id: "mach", name: "Mach (sea level)", abbrev: "Mach", toBase: (v) => v * 343, fromBase: (v) => v / 343 },
];

const SPEED_REFERENCES = [
	{ description: "Walking (casual)", speed: "3.1 mph / 5 km/h" },
	{ description: "Jogging", speed: "6 mph / 9.7 km/h" },
	{ description: "Sprinting (Usain Bolt)", speed: "27.8 mph / 44.7 km/h" },
	{ description: "City speed limit", speed: "25-35 mph / 40-56 km/h" },
	{ description: "Highway speed limit", speed: "55-75 mph / 89-121 km/h" },
	{ description: "Cheetah (top speed)", speed: "75 mph / 121 km/h" },
	{ description: "Commercial aircraft", speed: "575 mph / 925 km/h" },
	{ description: "Speed of sound", speed: "767 mph / 1,235 km/h" },
];

const BEAUFORT_SCALE = [
	{ force: "0", description: "Calm", mph: "< 1", kmh: "< 2" },
	{ force: "1", description: "Light air", mph: "1-3", kmh: "2-5" },
	{ force: "2", description: "Light breeze", mph: "4-7", kmh: "6-11" },
	{ force: "3", description: "Gentle breeze", mph: "8-12", kmh: "12-19" },
	{ force: "4", description: "Moderate breeze", mph: "13-18", kmh: "20-28" },
	{ force: "5", description: "Fresh breeze", mph: "19-24", kmh: "29-38" },
	{ force: "6", description: "Strong breeze", mph: "25-31", kmh: "39-49" },
	{ force: "7", description: "Near gale", mph: "32-38", kmh: "50-61" },
	{ force: "8", description: "Gale", mph: "39-46", kmh: "62-74" },
	{ force: "9", description: "Strong gale", mph: "47-54", kmh: "75-88" },
	{ force: "10", description: "Storm", mph: "55-63", kmh: "89-102" },
	{ force: "11", description: "Violent storm", mph: "64-72", kmh: "103-117" },
	{ force: "12", description: "Hurricane", mph: "73+", kmh: "118+" },
];

const COMMON_CONVERSIONS = [
	{ from: "1 mph", to: "1.609 km/h" },
	{ from: "1 km/h", to: "0.621 mph" },
	{ from: "1 knot", to: "1.151 mph / 1.852 km/h" },
	{ from: "1 m/s", to: "3.6 km/h / 2.237 mph" },
	{ from: "10 mph", to: "16.09 km/h" },
	{ from: "60 mph", to: "96.56 km/h" },
	{ from: "100 km/h", to: "62.14 mph" },
	{ from: "Mach 1", to: "767 mph / 1,235 km/h" },
];

function formatNumber(num: number): string {
	if (num === 0) return "0";
	if (Math.abs(num) < 0.0001) return num.toExponential(2);
	if (Math.abs(num) >= 1000000) return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
	if (Number.isInteger(num)) return num.toString();
	return num.toFixed(Math.abs(num) < 1 ? 4 : 2).replace(/\.?0+$/, "");
}

export default function SpeedConverter() {
	const [fromUnit, setFromUnit] = useState<string>("mph");
	const [toUnit, setToUnit] = useState<string>("kmh");
	const [inputValue, setInputValue] = useState<string>("1");

	const convert = useCallback(() => {
		const value = parseFloat(inputValue);
		if (isNaN(value)) return "";

		const from = SPEED_UNITS.find((u) => u.id === fromUnit);
		const to = SPEED_UNITS.find((u) => u.id === toUnit);

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
				<h2 className={styles.sectionTitle}>Speed / Velocity Converter</h2>

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
								{SPEED_UNITS.map((unit) => (
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
								{SPEED_UNITS.map((unit) => (
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
							{inputValue} {SPEED_UNITS.find((u) => u.id === fromUnit)?.abbrev} ={" "}
							<strong>
								{result} {SPEED_UNITS.find((u) => u.id === toUnit)?.abbrev}
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
					<h3 className={styles.chartTitle}>Speed References</h3>
					<div className={styles.tableWrapper}>
						<table className={styles.referenceTable}>
							<thead>
								<tr>
									<th>Description</th>
									<th>Speed</th>
								</tr>
							</thead>
							<tbody>
								{SPEED_REFERENCES.map((row, i) => (
									<tr key={i}>
										<td>{row.description}</td>
										<td>{row.speed}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			</div>

			<div className={styles.glassCard}>
				<h3 className={styles.chartTitle}>Beaufort Wind Scale</h3>
				<div className={styles.tableWrapper}>
					<table className={styles.referenceTable}>
						<thead>
							<tr>
								<th>Force</th>
								<th>Description</th>
								<th>mph</th>
								<th>km/h</th>
							</tr>
						</thead>
						<tbody>
							{BEAUFORT_SCALE.map((row, i) => (
								<tr key={i}>
									<td>{row.force}</td>
									<td>{row.description}</td>
									<td>{row.mph}</td>
									<td>{row.kmh}</td>
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
						<h4>MPH to KM/H</h4>
						<p>Multiply mph by 1.6 for a quick km/h estimate. Example: 60 mph × 1.6 = 96 km/h</p>
					</div>
					<div className={styles.tipCard}>
						<h4>KM/H to MPH</h4>
						<p>Multiply km/h by 0.6 for a quick mph estimate. Example: 100 km/h × 0.6 = 60 mph</p>
					</div>
					<div className={styles.tipCard}>
						<h4>Knots</h4>
						<p>Knots are used in aviation and maritime. 1 knot ≈ 1.15 mph. Multiply knots by 1.15 for mph.</p>
					</div>
					<div className={styles.tipCard}>
						<h4>Mach Number</h4>
						<p>Mach 1 = speed of sound ≈ 343 m/s at sea level. It varies with temperature and altitude.</p>
					</div>
				</div>
			</div>
		</div>
	);
}
