"use client";

import { useState, useCallback } from "react";
import { ArrowsRightLeftIcon } from "@heroicons/react/24/outline";
import styles from "./AngleConverter.module.scss";

interface ConversionUnit {
	id: string;
	name: string;
	abbrev: string;
	toBase: (value: number) => number;
	fromBase: (value: number) => number;
}

// Angle units (base: Degrees)
const ANGLE_UNITS: ConversionUnit[] = [
	{ id: "deg", name: "Degrees", abbrev: "°", toBase: (v) => v, fromBase: (v) => v },
	{ id: "rad", name: "Radians", abbrev: "rad", toBase: (v) => v * (180 / Math.PI), fromBase: (v) => v * (Math.PI / 180) },
	{ id: "grad", name: "Gradians", abbrev: "grad", toBase: (v) => v * 0.9, fromBase: (v) => v / 0.9 },
	{ id: "turn", name: "Turns", abbrev: "turn", toBase: (v) => v * 360, fromBase: (v) => v / 360 },
	{ id: "arcmin", name: "Arc minutes", abbrev: "'", toBase: (v) => v / 60, fromBase: (v) => v * 60 },
	{ id: "arcsec", name: "Arc seconds", abbrev: "\"", toBase: (v) => v / 3600, fromBase: (v) => v * 3600 },
];

const COMMON_ANGLES = [
	{ degrees: "0°", radians: "0", gradians: "0 grad", turns: "0" },
	{ degrees: "30°", radians: "π/6 ≈ 0.5236", gradians: "33.33 grad", turns: "1/12" },
	{ degrees: "45°", radians: "π/4 ≈ 0.7854", gradians: "50 grad", turns: "1/8" },
	{ degrees: "60°", radians: "π/3 ≈ 1.0472", gradians: "66.67 grad", turns: "1/6" },
	{ degrees: "90°", radians: "π/2 ≈ 1.5708", gradians: "100 grad", turns: "1/4" },
	{ degrees: "120°", radians: "2π/3 ≈ 2.0944", gradians: "133.33 grad", turns: "1/3" },
	{ degrees: "180°", radians: "π ≈ 3.1416", gradians: "200 grad", turns: "1/2" },
	{ degrees: "270°", radians: "3π/2 ≈ 4.7124", gradians: "300 grad", turns: "3/4" },
	{ degrees: "360°", radians: "2π ≈ 6.2832", gradians: "400 grad", turns: "1" },
];

const TRIG_VALUES = [
	{ angle: "0°", sin: "0", cos: "1", tan: "0" },
	{ angle: "30°", sin: "1/2 = 0.5", cos: "√3/2 ≈ 0.866", tan: "1/√3 ≈ 0.577" },
	{ angle: "45°", sin: "√2/2 ≈ 0.707", cos: "√2/2 ≈ 0.707", tan: "1" },
	{ angle: "60°", sin: "√3/2 ≈ 0.866", cos: "1/2 = 0.5", tan: "√3 ≈ 1.732" },
	{ angle: "90°", sin: "1", cos: "0", tan: "undefined" },
	{ angle: "120°", sin: "√3/2 ≈ 0.866", cos: "-1/2 = -0.5", tan: "-√3 ≈ -1.732" },
	{ angle: "180°", sin: "0", cos: "-1", tan: "0" },
];

const GEOMETRY_REFERENCE = [
	{ shape: "Triangle", fact: "Interior angles sum to 180°" },
	{ shape: "Quadrilateral", fact: "Interior angles sum to 360°" },
	{ shape: "Regular pentagon", fact: "Interior angle = 108°" },
	{ shape: "Regular hexagon", fact: "Interior angle = 120°" },
	{ shape: "Regular octagon", fact: "Interior angle = 135°" },
	{ shape: "Right angle", fact: "Exactly 90° (π/2 rad)" },
	{ shape: "Straight angle", fact: "Exactly 180° (π rad)" },
	{ shape: "Full rotation", fact: "Exactly 360° (2π rad)" },
];

function formatNumber(num: number): string {
	if (num === 0) return "0";
	if (Math.abs(num) < 0.0001) return num.toExponential(2);
	if (Math.abs(num) >= 1000000) return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
	if (Number.isInteger(num)) return num.toString();
	return num.toFixed(Math.abs(num) < 1 ? 4 : 2).replace(/\.?0+$/, "");
}

export default function AngleConverter() {
	const [fromUnit, setFromUnit] = useState<string>("deg");
	const [toUnit, setToUnit] = useState<string>("rad");
	const [inputValue, setInputValue] = useState<string>("90");

	const convert = useCallback(() => {
		const value = parseFloat(inputValue);
		if (isNaN(value)) return "";

		const from = ANGLE_UNITS.find((u) => u.id === fromUnit);
		const to = ANGLE_UNITS.find((u) => u.id === toUnit);

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
				<h2 className={styles.sectionTitle}>Angle Converter</h2>

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
								{ANGLE_UNITS.map((unit) => (
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
								{ANGLE_UNITS.map((unit) => (
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
							{inputValue} {ANGLE_UNITS.find((u) => u.id === fromUnit)?.abbrev} ={" "}
							<strong>
								{result} {ANGLE_UNITS.find((u) => u.id === toUnit)?.abbrev}
							</strong>
						</span>
					</div>
				)}
			</div>

			<div className={styles.chartsGrid}>
				<div className={styles.glassCard}>
					<h3 className={styles.chartTitle}>Common Angles</h3>
					<div className={styles.tableWrapper}>
						<table className={styles.referenceTable}>
							<thead>
								<tr>
									<th>Degrees</th>
									<th>Radians</th>
									<th>Gradians</th>
									<th>Turns</th>
								</tr>
							</thead>
							<tbody>
								{COMMON_ANGLES.map((row, i) => (
									<tr key={i}>
										<td>{row.degrees}</td>
										<td>{row.radians}</td>
										<td>{row.gradians}</td>
										<td>{row.turns}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>

				<div className={styles.glassCard}>
					<h3 className={styles.chartTitle}>Trigonometric Values</h3>
					<div className={styles.tableWrapper}>
						<table className={styles.referenceTable}>
							<thead>
								<tr>
									<th>Angle</th>
									<th>sin</th>
									<th>cos</th>
									<th>tan</th>
								</tr>
							</thead>
							<tbody>
								{TRIG_VALUES.map((row, i) => (
									<tr key={i}>
										<td>{row.angle}</td>
										<td>{row.sin}</td>
										<td>{row.cos}</td>
										<td>{row.tan}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			</div>

			<div className={styles.glassCard}>
				<h3 className={styles.chartTitle}>Geometry Reference</h3>
				<div className={styles.referencesGrid}>
					{GEOMETRY_REFERENCE.map((item, i) => (
						<div key={i} className={styles.referenceCard}>
							<span className={styles.referenceLabel}>{item.shape}</span>
							<span className={styles.referenceValue}>{item.fact}</span>
						</div>
					))}
				</div>
			</div>

			<div className={styles.glassCard}>
				<h3 className={styles.chartTitle}>Quick Tips</h3>
				<div className={styles.tipsGrid}>
					<div className={styles.tipCard}>
						<h4>Degrees to Radians</h4>
						<p>Multiply degrees by π/180. Example: 90° × π/180 = π/2 ≈ 1.5708 rad</p>
					</div>
					<div className={styles.tipCard}>
						<h4>Radians to Degrees</h4>
						<p>Multiply radians by 180/π. Example: π rad × 180/π = 180°</p>
					</div>
					<div className={styles.tipCard}>
						<h4>Gradians</h4>
						<p>A right angle = 100 grad. Full circle = 400 grad. Used in surveying and some European countries.</p>
					</div>
					<div className={styles.tipCard}>
						<h4>Polygon Interior Angle</h4>
						<p>For a regular n-sided polygon: interior angle = (n-2) × 180° ÷ n</p>
					</div>
				</div>
			</div>
		</div>
	);
}
