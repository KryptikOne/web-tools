"use client";

import UnitConverterPanel from "@/components/UnitConverterPanel";
import { getUnitCategory } from "@/lib/unitDefinitions";
import styles from "./WeightConverter.module.scss";

// Quick conversion reference
const COMMON_CONVERSIONS = [
	{ imperial: "1 ounce", metric: "28.35 g" },
	{ imperial: "4 ounces (¼ lb)", metric: "113.4 g" },
	{ imperial: "8 ounces (½ lb)", metric: "226.8 g" },
	{ imperial: "1 pound", metric: "453.6 g / 0.454 kg" },
	{ imperial: "1 stone (14 lb)", metric: "6.35 kg" },
	{ imperial: "100 pounds", metric: "45.36 kg" },
	{ imperial: "1 US ton (2000 lb)", metric: "907.2 kg" },
	{ imperial: "1 UK ton (2240 lb)", metric: "1016 kg" },
];

const METRIC_TO_IMPERIAL = [
	{ metric: "1 gram", imperial: "0.035 oz" },
	{ metric: "100 grams", imperial: "3.53 oz" },
	{ metric: "250 grams", imperial: "8.82 oz" },
	{ metric: "500 grams", imperial: "1.1 lb" },
	{ metric: "1 kilogram", imperial: "2.205 lb" },
	{ metric: "5 kilograms", imperial: "11.02 lb" },
	{ metric: "50 kilograms", imperial: "110.2 lb / 7.87 st" },
	{ metric: "1 metric ton", imperial: "2205 lb / 1.1 US ton" },
];

const BODY_WEIGHT_REFERENCE = [
	{ lbs: "100 lb", kg: "45.4 kg", stones: "7 st 2 lb" },
	{ lbs: "120 lb", kg: "54.4 kg", stones: "8 st 8 lb" },
	{ lbs: "140 lb", kg: "63.5 kg", stones: "10 st 0 lb" },
	{ lbs: "160 lb", kg: "72.6 kg", stones: "11 st 6 lb" },
	{ lbs: "180 lb", kg: "81.6 kg", stones: "12 st 12 lb" },
	{ lbs: "200 lb", kg: "90.7 kg", stones: "14 st 4 lb" },
	{ lbs: "220 lb", kg: "99.8 kg", stones: "15 st 10 lb" },
	{ lbs: "250 lb", kg: "113.4 kg", stones: "17 st 12 lb" },
];

const SHIPPING_WEIGHTS = [
	{ description: "Letter (standard)", weight: "< 1 oz / 28 g" },
	{ description: "Small package", weight: "1-4 lb / 0.5-2 kg" },
	{ description: "Medium package", weight: "5-10 lb / 2-5 kg" },
	{ description: "Large package", weight: "11-25 lb / 5-11 kg" },
	{ description: "Heavy package", weight: "26-70 lb / 12-32 kg" },
	{ description: "Freight threshold", weight: "> 150 lb / 68 kg" },
];

export default function WeightConverter() {
	return (
		<div className={styles.container}>
			<div className="mb-6">
				<UnitConverterPanel category={getUnitCategory("weight")!} initialUnitId="lb" initialValue="1" />
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

			{/* Body Weight Reference */}
			<div className={styles.glassCard}>
				<h3 className={styles.chartTitle}>Body Weight Reference</h3>
				<div className={styles.tableWrapper}>
					<table className={styles.referenceTable}>
						<thead>
							<tr>
								<th>Pounds</th>
								<th>Kilograms</th>
								<th>Stones</th>
							</tr>
						</thead>
						<tbody>
							{BODY_WEIGHT_REFERENCE.map((row, i) => (
								<tr key={i}>
									<td>{row.lbs}</td>
									<td>{row.kg}</td>
									<td>{row.stones}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>

			{/* Shipping Weights */}
			<div className={styles.glassCard}>
				<h3 className={styles.chartTitle}>Common Shipping Weights</h3>
				<div className={styles.referencesGrid}>
					{SHIPPING_WEIGHTS.map((item, i) => (
						<div key={i} className={styles.referenceCard}>
							<span className={styles.referenceLabel}>{item.description}</span>
							<span className={styles.referenceValue}>{item.weight}</span>
						</div>
					))}
				</div>
			</div>

			{/* Quick Tips */}
			<div className={styles.glassCard}>
				<h3 className={styles.chartTitle}>Quick Tips</h3>
				<div className={styles.tipsGrid}>
					<div className={styles.tipCard}>
						<h4>Pounds to Kilograms</h4>
						<p>Divide pounds by 2.2 for a quick estimate. Example: 150 lb ÷ 2.2 ≈ 68 kg</p>
					</div>
					<div className={styles.tipCard}>
						<h4>Kilograms to Pounds</h4>
						<p>Multiply kilograms by 2.2 for a quick estimate. Example: 70 kg × 2.2 ≈ 154 lb</p>
					</div>
					<div className={styles.tipCard}>
						<h4>Stones to Pounds</h4>
						<p>Multiply stones by 14 to get pounds. Example: 10 st × 14 = 140 lb</p>
					</div>
					<div className={styles.tipCard}>
						<h4>Ounces to Grams</h4>
						<p>Multiply ounces by 28 for a quick estimate. Example: 4 oz × 28 ≈ 112 g</p>
					</div>
				</div>
			</div>
		</div>
	);
}
