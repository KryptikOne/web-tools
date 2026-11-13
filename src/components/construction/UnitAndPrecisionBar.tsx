"use client";

import SegmentedControl from "@/components/SegmentedControl";
import { useConstructionUnits } from "@/hooks/useConstructionUnits";
import { FRACTION_PRECISIONS, UNIT_MODES, type FractionPrecision, type UnitMode } from "@/lib/construction/imperialUtils";
import styles from "./UnitAndPrecisionBar.module.scss";

/** Site-wide unit mode and fraction precision for construction tools. Precision hides in metric mode. */
export default function UnitAndPrecisionBar({ className = "" }: { className?: string }) {
	const { mode, precision, setMode, setPrecision } = useConstructionUnits();

	return (
		<div className={`flex flex-wrap items-center gap-x-6 gap-y-3 ${styles.bar} ${className}`}>
			<div className="flex items-center gap-2">
				<span className={styles.caption}>Units</span>
				<SegmentedControl<UnitMode>
					label="Units"
					size="sm"
					fill={false}
					value={mode}
					onChange={setMode}
					options={UNIT_MODES.map((u) => ({ value: u.value, label: u.label }))}
				/>
			</div>
			{mode !== "mm" && (
				<div className="flex items-center gap-2">
					<span className={styles.caption}>Precision</span>
					<SegmentedControl<`${FractionPrecision}`>
						label="Precision"
						size="sm"
						fill={false}
						value={`${precision}`}
						onChange={(v) => setPrecision(Number(v) as FractionPrecision)}
						options={FRACTION_PRECISIONS.map((p) => ({ value: `${p.value}` as `${FractionPrecision}`, label: p.label }))}
					/>
				</div>
			)}
		</div>
	);
}
