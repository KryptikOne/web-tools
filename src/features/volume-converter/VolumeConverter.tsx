"use client";

import UnitConverterPanel from "@/components/UnitConverterPanel";
import { getUnitCategory } from "@/lib/unitDefinitions";
import styles from "./VolumeConverter.module.scss";

// Quick conversion reference
const US_TO_METRIC = [
	{ us: "1 fluid ounce", metric: "29.57 mL" },
	{ us: "1 cup (8 fl oz)", metric: "236.6 mL" },
	{ us: "1 pint (16 fl oz)", metric: "473.2 mL" },
	{ us: "1 quart (32 fl oz)", metric: "946.4 mL" },
	{ us: "1 gallon (128 fl oz)", metric: "3.785 L" },
	{ us: "5 gallons", metric: "18.93 L" },
	{ us: "1 cubic foot", metric: "28.32 L" },
	{ us: "1 cubic yard", metric: "764.6 L" },
];

const METRIC_TO_US = [
	{ metric: "100 milliliters", us: "3.38 fl oz" },
	{ metric: "250 milliliters", us: "8.45 fl oz / 1.06 cup" },
	{ metric: "500 milliliters", us: "16.9 fl oz / 1.06 pt" },
	{ metric: "1 liter", us: "33.8 fl oz / 1.06 qt" },
	{ metric: "2 liters", us: "67.6 fl oz / 0.53 gal" },
	{ metric: "5 liters", us: "1.32 gal" },
	{ metric: "20 liters", us: "5.28 gal" },
	{ metric: "1 cubic meter", us: "264.2 gal / 35.3 ft³" },
];

const TANK_SIZES = [
	{ description: "Small fish tank", volume: "5 gal / 19 L" },
	{ description: "Medium aquarium", volume: "20 gal / 76 L" },
	{ description: "Large aquarium", volume: "55 gal / 208 L" },
	{ description: "Water heater (typical)", volume: "40-50 gal / 150-190 L" },
	{ description: "Bathtub (full)", volume: "80 gal / 300 L" },
	{ description: "Hot tub (small)", volume: "200-300 gal / 750-1,135 L" },
	{ description: "Rain barrel", volume: "55 gal / 208 L" },
	{ description: "IBC tote", volume: "275 gal / 1,040 L" },
];

const POOL_ESTIMATES = [
	{ description: "Kiddie pool", volume: "50-200 gal / 190-760 L" },
	{ description: "Above-ground (12ft round)", volume: "~3,400 gal / 12,900 L" },
	{ description: "Above-ground (15ft round)", volume: "~5,300 gal / 20,000 L" },
	{ description: "Above-ground (18ft round)", volume: "~7,600 gal / 28,800 L" },
	{ description: "In-ground (small)", volume: "~10,000 gal / 37,900 L" },
	{ description: "In-ground (medium)", volume: "~20,000 gal / 75,700 L" },
	{ description: "In-ground (large)", volume: "~30,000+ gal / 113,500+ L" },
	{ description: "Olympic pool", volume: "660,000 gal / 2,500,000 L" },
];

const US_UK_COMPARISON = [
	{ unit: "Fluid Ounce", us: "29.57 mL", uk: "28.41 mL", note: "UK slightly smaller" },
	{ unit: "Pint", us: "473 mL (16 fl oz)", uk: "568 mL (20 fl oz)", note: "UK 20% larger" },
	{ unit: "Quart", us: "946 mL", uk: "1,137 mL", note: "UK 20% larger" },
	{ unit: "Gallon", us: "3.785 L", uk: "4.546 L", note: "UK 20% larger" },
];

export default function VolumeConverter() {
	return (
		<div className={styles.container}>
			<div className="mb-6">
				<UnitConverterPanel category={getUnitCategory("volume")!} initialUnitId="gal_us" initialValue="1" />
			</div>

			{/* Reference Charts */}
			<div className={styles.chartsGrid}>
				{/* US to Metric */}
				<div className={styles.glassCard}>
					<h3 className={styles.chartTitle}>US to Metric</h3>
					<div className={styles.tableWrapper}>
						<table className={styles.referenceTable}>
							<thead>
								<tr>
									<th>US</th>
									<th>Metric</th>
								</tr>
							</thead>
							<tbody>
								{US_TO_METRIC.map((row, i) => (
									<tr key={i}>
										<td>{row.us}</td>
										<td>{row.metric}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>

				{/* Metric to US */}
				<div className={styles.glassCard}>
					<h3 className={styles.chartTitle}>Metric to US</h3>
					<div className={styles.tableWrapper}>
						<table className={styles.referenceTable}>
							<thead>
								<tr>
									<th>Metric</th>
									<th>US</th>
								</tr>
							</thead>
							<tbody>
								{METRIC_TO_US.map((row, i) => (
									<tr key={i}>
										<td>{row.metric}</td>
										<td>{row.us}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			</div>

			{/* US vs UK Comparison */}
			<div className={styles.glassCard}>
				<h3 className={styles.chartTitle}>US vs UK Units</h3>
				<p className={styles.chartSubtitle}>Imperial units differ between US and UK systems</p>
				<div className={styles.tableWrapper}>
					<table className={styles.referenceTable}>
						<thead>
							<tr>
								<th>Unit</th>
								<th>US</th>
								<th>UK</th>
								<th>Note</th>
							</tr>
						</thead>
						<tbody>
							{US_UK_COMPARISON.map((row, i) => (
								<tr key={i}>
									<td className={styles.boldCell}>{row.unit}</td>
									<td>{row.us}</td>
									<td>{row.uk}</td>
									<td className={styles.mutedCell}>{row.note}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>

			{/* Tank and Container Sizes */}
			<div className={styles.glassCard}>
				<h3 className={styles.chartTitle}>Common Tank &amp; Container Sizes</h3>
				<div className={styles.referencesGrid}>
					{TANK_SIZES.map((item, i) => (
						<div key={i} className={styles.referenceCard}>
							<span className={styles.referenceLabel}>{item.description}</span>
							<span className={styles.referenceValue}>{item.volume}</span>
						</div>
					))}
				</div>
			</div>

			{/* Pool Volume Estimates */}
			<div className={styles.glassCard}>
				<h3 className={styles.chartTitle}>Pool Volume Estimates</h3>
				<div className={styles.referencesGrid}>
					{POOL_ESTIMATES.map((item, i) => (
						<div key={i} className={styles.referenceCard}>
							<span className={styles.referenceLabel}>{item.description}</span>
							<span className={styles.referenceValue}>{item.volume}</span>
						</div>
					))}
				</div>
			</div>

			{/* Quick Tips */}
			<div className={styles.glassCard}>
				<h3 className={styles.chartTitle}>Quick Tips</h3>
				<div className={styles.tipsGrid}>
					<div className={styles.tipCard}>
						<h4>Gallons to Liters</h4>
						<p>Multiply US gallons by 3.8 for a quick estimate. Example: 10 gal × 3.8 ≈ 38 L</p>
					</div>
					<div className={styles.tipCard}>
						<h4>Liters to Gallons</h4>
						<p>Divide liters by 3.8 for a quick estimate. Example: 20 L ÷ 3.8 ≈ 5.3 gal</p>
					</div>
					<div className={styles.tipCard}>
						<h4>Cubic Feet to Gallons</h4>
						<p>Multiply cubic feet by 7.5 for gallons. Example: 10 ft³ × 7.5 ≈ 75 gal</p>
					</div>
					<div className={styles.tipCard}>
						<h4>Pool Volume Formula</h4>
						<p>For rectangular pools: Length × Width × Avg Depth × 7.5 = gallons</p>
					</div>
				</div>
			</div>
		</div>
	);
}
