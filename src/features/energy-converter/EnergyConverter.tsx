"use client";

import UnitConverterPanel from "@/components/UnitConverterPanel";
import { getUnitCategory } from "@/lib/unitDefinitions";
import styles from "./EnergyConverter.module.scss";

const FOOD_CALORIES = [
	{ food: "Apple (medium)", kcal: "95 kcal", kj: "397 kJ" },
	{ food: "Banana (medium)", kcal: "105 kcal", kj: "439 kJ" },
	{ food: "Slice of bread", kcal: "79 kcal", kj: "331 kJ" },
	{ food: "Egg (large, boiled)", kcal: "78 kcal", kj: "326 kJ" },
	{ food: "Chicken breast (100g)", kcal: "165 kcal", kj: "690 kJ" },
	{ food: "Rice (1 cup cooked)", kcal: "206 kcal", kj: "862 kJ" },
	{ food: "Cheeseburger", kcal: "303 kcal", kj: "1268 kJ" },
	{ food: "Pizza slice", kcal: "285 kcal", kj: "1193 kJ" },
];

const ELECTRICITY_USAGE = [
	{ appliance: "LED bulb", watts: "10 W", daily: "0.24 kWh" },
	{ appliance: "Laptop", watts: "50 W", daily: "0.4 kWh" },
	{ appliance: "Desktop PC", watts: "200 W", daily: "1.6 kWh" },
	{ appliance: "Refrigerator", watts: "150 W", daily: "3.6 kWh" },
	{ appliance: "Washing machine", watts: "500 W", daily: "0.5 kWh" },
	{ appliance: "Microwave", watts: "1,000 W", daily: "0.25 kWh" },
	{ appliance: "Hair dryer", watts: "1,800 W", daily: "0.3 kWh" },
	{ appliance: "Electric oven", watts: "2,400 W", daily: "2.4 kWh" },
];

const ENERGY_EQUIVALENTS = [
	{ description: "1 food Calorie (kcal)", equivalent: "4,184 J = 4.184 kJ" },
	{ description: "1 kWh of electricity", equivalent: "3,600,000 J = 3,412 BTU" },
	{ description: "1 gallon of gasoline", equivalent: "~131,760 BTU = 138.7 MJ" },
	{ description: "Daily human intake (~2000 kcal)", equivalent: "8,368 kJ = 2.33 kWh" },
	{ description: "AA battery", equivalent: "~9,360 J = 2.6 Wh" },
	{ description: "Tesla battery (75 kWh)", equivalent: "270,000,000 J = 270 MJ" },
];

export default function EnergyConverter() {
	return (
		<div className={styles.container}>
			<div className="mb-6">
				<UnitConverterPanel category={getUnitCategory("energy")!} initialUnitId="kcal" initialValue="1" />
			</div>

			<div className={styles.chartsGrid}>
				<div className={styles.glassCard}>
					<h3 className={styles.chartTitle}>Food Calorie Reference</h3>
					<div className={styles.tableWrapper}>
						<table className={styles.referenceTable}>
							<thead>
								<tr>
									<th>Food</th>
									<th>kcal</th>
									<th>kJ</th>
								</tr>
							</thead>
							<tbody>
								{FOOD_CALORIES.map((row, i) => (
									<tr key={i}>
										<td>{row.food}</td>
										<td>{row.kcal}</td>
										<td>{row.kj}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>

				<div className={styles.glassCard}>
					<h3 className={styles.chartTitle}>Electricity Usage</h3>
					<div className={styles.tableWrapper}>
						<table className={styles.referenceTable}>
							<thead>
								<tr>
									<th>Appliance</th>
									<th>Power</th>
									<th>Daily Use</th>
								</tr>
							</thead>
							<tbody>
								{ELECTRICITY_USAGE.map((row, i) => (
									<tr key={i}>
										<td>{row.appliance}</td>
										<td>{row.watts}</td>
										<td>{row.daily}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			</div>

			<div className={styles.glassCard}>
				<h3 className={styles.chartTitle}>Energy Equivalents</h3>
				<div className={styles.referencesGrid}>
					{ENERGY_EQUIVALENTS.map((item, i) => (
						<div key={i} className={styles.referenceCard}>
							<span className={styles.referenceLabel}>{item.description}</span>
							<span className={styles.referenceValue}>{item.equivalent}</span>
						</div>
					))}
				</div>
			</div>

			<div className={styles.glassCard}>
				<h3 className={styles.chartTitle}>Quick Tips</h3>
				<div className={styles.tipsGrid}>
					<div className={styles.tipCard}>
						<h4>Calories vs Kilocalories</h4>
						<p>Food &quot;Calories&quot; (capital C) are actually kilocalories (kcal). 1 food Calorie = 1 kcal = 1000 cal.</p>
					</div>
					<div className={styles.tipCard}>
						<h4>kJ to kcal</h4>
						<p>Divide kilojoules by 4.184 for kilocalories. Example: 500 kJ ÷ 4.184 ≈ 120 kcal</p>
					</div>
					<div className={styles.tipCard}>
						<h4>kWh Cost</h4>
						<p>Average US electricity costs ~$0.12/kWh. A 1000W appliance running 1 hour = 1 kWh ≈ $0.12</p>
					</div>
					<div className={styles.tipCard}>
						<h4>BTU to kWh</h4>
						<p>Divide BTU by 3,412 for kWh. Example: 10,000 BTU ÷ 3,412 ≈ 2.93 kWh</p>
					</div>
				</div>
			</div>
		</div>
	);
}
