"use client";

import UnitConverterPanel from "@/components/UnitConverterPanel";
import { getUnitCategory } from "@/lib/unitDefinitions";
import styles from "./AngleConverter.module.scss";

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

export default function AngleConverter() {
	return (
		<div className={styles.container}>
			<div className="mb-6">
				<UnitConverterPanel category={getUnitCategory("angle")!} initialUnitId="deg" initialValue="90" />
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
