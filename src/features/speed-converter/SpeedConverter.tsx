"use client";

import UnitConverterPanel from "@/components/UnitConverterPanel";
import { getUnitCategory } from "@/lib/unitDefinitions";
import styles from "./SpeedConverter.module.scss";

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

export default function SpeedConverter() {
	return (
		<div className={styles.container}>
			<div className="mb-6">
				<UnitConverterPanel category={getUnitCategory("speed")!} initialUnitId="mph" initialValue="1" />
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
