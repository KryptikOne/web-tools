"use client";

import styles from "./SvgGlobalSettings.module.scss";

interface SvgGlobalSettingsProps {
	multipass: boolean;
	pretty: boolean;
	indent: number;
	floatPrecision: number;
	onChange: (changes: Partial<{ multipass: boolean; pretty: boolean; indent: number; floatPrecision: number }>) => void;
}

export default function SvgGlobalSettings({
	multipass,
	pretty,
	indent,
	floatPrecision,
	onChange,
}: SvgGlobalSettingsProps) {
	return (
		<div className={styles.container}>
			<h3 className={styles.heading}>Global settings</h3>

			<div className={styles.row}>
				<label className={styles.toggle}>
					<input
						type="checkbox"
						checked={multipass}
						aria-label="Multipass"
						onChange={(e) => onChange({ multipass: e.target.checked })}
					/>
					Multipass
				</label>
				<label className={styles.toggle}>
					<input
						type="checkbox"
						checked={pretty}
						aria-label="Pretty code"
						onChange={(e) => onChange({ pretty: e.target.checked })}
					/>
					Pretty code
				</label>
				<label className={styles.toggle}>
					Indent
					<input
						className={styles.indentInput}
						type="number"
						min={0}
						max={8}
						value={indent}
						disabled={!pretty}
						onChange={(e) => onChange({ indent: Number(e.target.value) })}
						aria-label="Indent spaces"
					/>
				</label>
			</div>

			<div className={styles.precisionRow}>
				<label htmlFor="precision-slider">Precision</label>
				<input
					id="precision-slider"
					className={styles.slider}
					type="range"
					min={0}
					max={4}
					step={1}
					value={floatPrecision}
					onChange={(e) => onChange({ floatPrecision: Number(e.target.value) })}
				/>
				<span className={styles.precisionValue}>{floatPrecision}</span>
			</div>
		</div>
	);
}
