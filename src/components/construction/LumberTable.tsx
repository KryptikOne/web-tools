"use client";

import { useConstructionUnits } from "@/hooks/useConstructionUnits";
import { LUMBER_SIZES } from "@/lib/construction/imperialUtils";
import styles from "./LumberTable.module.scss";

/** Nominal to actual dressed lumber sizes, shown in the active unit mode and precision. */
export default function LumberTable({ className = "" }: { className?: string }) {
	const { format, mode } = useConstructionUnits();
	const fmt = (inches: number) => format(inches, { mode: mode === "mm" ? "mm" : "in" });

	return (
		<div className={`${styles.card} ${className}`}>
			<h3 className={styles.title}>Lumber: nominal to actual</h3>
			<p className={styles.note}>Enter actual finished sizes in every tool. A nominal 2x4 is cut and dressed to the size shown.</p>
			<table className={styles.table}>
				<thead>
					<tr>
						<th scope="col">Nominal</th>
						<th scope="col">Actual</th>
					</tr>
				</thead>
				<tbody>
					{LUMBER_SIZES.map((s) => (
						<tr key={s.nominal}>
							<td className={styles.nominal}>{s.nominal}</td>
							<td className={styles.actual}>
								{fmt(s.width)} x {fmt(s.depth)}
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
