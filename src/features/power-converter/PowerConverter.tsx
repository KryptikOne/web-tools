"use client";

import UnitConverterPanel from "@/components/UnitConverterPanel";
import { getUnitCategory } from "@/lib/unitDefinitions";
import styles from "./PowerConverter.module.scss";

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

export default function PowerConverter() {
	return (
		<div className={styles.container}>
			<div className="mb-6">
				<UnitConverterPanel category={getUnitCategory("power")!} initialUnitId="hp" initialValue="1" />
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
