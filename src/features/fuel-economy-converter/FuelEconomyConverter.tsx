"use client";

import UnitConverterPanel from "@/components/UnitConverterPanel";
import { getUnitCategory } from "@/lib/unitDefinitions";
import styles from "./FuelEconomyConverter.module.scss";

// Fuel economy units (base: km per liter)
const MPG_TO_L100KM = [
	{ mpg_us: "15 mpg", l100km: "15.7 L/100km", mpg_uk: "18.0 mpg (UK)" },
	{ mpg_us: "20 mpg", l100km: "11.8 L/100km", mpg_uk: "24.0 mpg (UK)" },
	{ mpg_us: "25 mpg", l100km: "9.4 L/100km", mpg_uk: "30.0 mpg (UK)" },
	{ mpg_us: "30 mpg", l100km: "7.8 L/100km", mpg_uk: "36.0 mpg (UK)" },
	{ mpg_us: "35 mpg", l100km: "6.7 L/100km", mpg_uk: "42.0 mpg (UK)" },
	{ mpg_us: "40 mpg", l100km: "5.9 L/100km", mpg_uk: "48.0 mpg (UK)" },
	{ mpg_us: "50 mpg", l100km: "4.7 L/100km", mpg_uk: "60.1 mpg (UK)" },
	{ mpg_us: "60 mpg", l100km: "3.9 L/100km", mpg_uk: "72.1 mpg (UK)" },
];

const VEHICLE_EFFICIENCY = [
	{ vehicle: "Large SUV / Truck", mpg: "15-20 mpg", l100km: "11.8-15.7 L/100km" },
	{ vehicle: "Mid-size SUV", mpg: "22-28 mpg", l100km: "8.4-10.7 L/100km" },
	{ vehicle: "Sedan", mpg: "28-35 mpg", l100km: "6.7-8.4 L/100km" },
	{ vehicle: "Compact car", mpg: "30-38 mpg", l100km: "6.2-7.8 L/100km" },
	{ vehicle: "Hybrid", mpg: "45-55 mpg", l100km: "4.3-5.2 L/100km" },
	{ vehicle: "Plug-in hybrid (gas)", mpg: "50-80 mpg", l100km: "2.9-4.7 L/100km" },
	{ vehicle: "Motorcycle", mpg: "40-70 mpg", l100km: "3.4-5.9 L/100km" },
];

export default function FuelEconomyConverter() {
	return (
		<div className={styles.container}>
			<div className="mb-6">
				<UnitConverterPanel category={getUnitCategory("fuel")!} initialUnitId="mpg_us" initialValue="25" />
			</div>

			<div className={styles.chartsGrid}>
				<div className={styles.glassCard}>
					<h3 className={styles.chartTitle}>MPG to L/100km Reference</h3>
					<div className={styles.tableWrapper}>
						<table className={styles.referenceTable}>
							<thead>
								<tr>
									<th>US MPG</th>
									<th>L/100km</th>
									<th>UK MPG</th>
								</tr>
							</thead>
							<tbody>
								{MPG_TO_L100KM.map((row, i) => (
									<tr key={i}>
										<td>{row.mpg_us}</td>
										<td>{row.l100km}</td>
										<td>{row.mpg_uk}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>

				<div className={styles.glassCard}>
					<h3 className={styles.chartTitle}>Typical Vehicle Efficiency</h3>
					<div className={styles.tableWrapper}>
						<table className={styles.referenceTable}>
							<thead>
								<tr>
									<th>Vehicle Type</th>
									<th>US MPG</th>
									<th>L/100km</th>
								</tr>
							</thead>
							<tbody>
								{VEHICLE_EFFICIENCY.map((row, i) => (
									<tr key={i}>
										<td>{row.vehicle}</td>
										<td>{row.mpg}</td>
										<td>{row.l100km}</td>
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
						<h4>MPG to L/100km</h4>
						<p>Divide 235.21 by the MPG value. Example: 235.21 ÷ 30 mpg ≈ 7.8 L/100km</p>
					</div>
					<div className={styles.tipCard}>
						<h4>US vs UK Gallons</h4>
						<p>1 UK gallon = 1.201 US gallons. UK MPG figures are always higher than US MPG for the same car.</p>
					</div>
					<div className={styles.tipCard}>
						<h4>L/100km Meaning</h4>
						<p>Lower is better for L/100km (opposite of MPG). 5 L/100km is very efficient; 15 L/100km is poor.</p>
					</div>
					<div className={styles.tipCard}>
						<h4>Trip Cost Estimate</h4>
						<p>Distance ÷ MPG × price per gallon = trip fuel cost. Example: 300 mi ÷ 30 mpg × $3.50 = $35</p>
					</div>
				</div>
			</div>
		</div>
	);
}
