"use client";

import styles from "./NumberField.module.scss";

export interface NumberFieldProps {
	id: string;
	label: string;
	value: number;
	onChange: (value: number) => void;
	/** Text before the number, e.g. "$" */
	prefix?: string;
	/** Text after the number, e.g. "ft²" or "%" */
	unit?: string;
	min?: number;
	max?: number;
	step?: number | "any";
	hint?: string;
	disabled?: boolean;
	className?: string;
}

/** A plain numeric field (counts, money, percentages, areas) with an optional prefix and unit. */
export default function NumberField({ id, label, value, onChange, prefix, unit, min = 0, max, step = "any", hint, disabled, className = "" }: NumberFieldProps) {
	const hintId = `${id}-hint`;
	return (
		<div className={`${styles.field} ${className}`}>
			<label htmlFor={id} className={styles.label}>
				{label}
			</label>
			<div className={styles.inputWrap}>
				{prefix && (
					<span className={styles.affix} aria-hidden="true">
						{prefix}
					</span>
				)}
				<input
					id={id}
					type="number"
					inputMode="decimal"
					className={styles.input}
					value={Number.isFinite(value) ? value : ""}
					min={min}
					max={max}
					step={step}
					disabled={disabled}
					aria-describedby={hint ? hintId : undefined}
					onChange={(e) => onChange(e.target.value === "" ? 0 : Number(e.target.value))}
				/>
				{unit && (
					<span className={styles.affix} aria-hidden="true">
						{unit}
					</span>
				)}
			</div>
			{hint && (
				<span id={hintId} className={styles.hint}>
					{hint}
				</span>
			)}
		</div>
	);
}
