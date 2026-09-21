"use client";

import UnitConverterPanel from "@/components/UnitConverterPanel";
import { getUnitCategory } from "@/lib/unitDefinitions";
import styles from "./DistanceConverter.module.scss";

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

export default function DistanceConverter() {
	return (
		<div className={styles.container}>
			<div className="mb-6">
				<UnitConverterPanel category={getUnitCategory("length")!} initialUnitId="mi" initialValue="1" />
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
