"use client";

import { useEffect, useRef, useState } from "react";
import { useConstructionUnits } from "@/hooks/useConstructionUnits";
import styles from "./DimensionInput.module.scss";

export interface DimensionInputProps {
	id: string;
	label: string;
	/** Current value in inches, or null when empty / invalid */
	value: number | null;
	onChange: (inches: number | null) => void;
	/** Slider bounds in inches; a slider renders when `step` is given */
	min?: number;
	max?: number;
	step?: number;
	hint?: string;
	disabled?: boolean;
	className?: string;
}

/**
 * A length field that reads whatever the trade types (`10' 3 1/2"`, `120 3/4`, `3136 mm`) in the
 * active unit mode and reports inches. While typing, the text is kept as-is and the parsed value is
 * echoed underneath so the reader can see what the tool understood; on blur, slider moves and unit
 * switches the field shows the value in its marked form (`5' 10"`, `70"`, `1778 mm`).
 */
const PLACEHOLDER = { "ft-in": `0' 0"`, in: `0"`, mm: "0 mm" } as const;

export default function DimensionInput({ id, label, value, onChange, min = 0, max, step, hint, disabled, className = "" }: DimensionInputProps) {
	const { parse, format, mode, precision } = useConstructionUnits();
	const [text, setText] = useState(() => (value === null ? "" : format(value)));
	const focused = useRef(false);

	// Follow outside changes (slider, share link, unit switch) while the field is not being edited.
	useEffect(() => {
		if (focused.current) return;
		setText(value === null ? "" : format(value));
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [value, mode, precision]);

	const parsed = text.trim() === "" ? null : parse(text);
	const invalid = text.trim() !== "" && parsed === null;
	const echo = parsed === null ? "" : format(parsed);
	const showEcho = parsed !== null && text.trim() !== echo;

	const handleText = (next: string) => {
		setText(next);
		onChange(next.trim() === "" ? null : parse(next));
	};

	const sliderValue = Math.min(Math.max(value ?? min, min), max ?? min);
	const fill = max !== undefined && max > min ? ((sliderValue - min) / (max - min)) * 100 : 0;

	return (
		<div className={`${styles.field} ${className}`}>
			<label htmlFor={id} className={styles.label}>
				{label}
			</label>
			<div className={`${styles.inputWrap} ${invalid ? styles.invalid : ""}`}>
				<input
					id={id}
					type="text"
					inputMode="decimal"
					autoComplete="off"
					spellCheck={false}
					className={styles.input}
					value={text}
					disabled={disabled}
					placeholder={PLACEHOLDER[mode]}
					aria-invalid={invalid || undefined}
					aria-describedby={hint ? `${id}-hint` : undefined}
					onChange={(e) => handleText(e.target.value)}
					onFocus={() => (focused.current = true)}
					onBlur={() => {
						focused.current = false;
						if (value !== null) setText(format(value));
					}}
				/>
			</div>
			{step !== undefined && max !== undefined && (
				<input
					type="range"
					aria-label={`${label} slider`}
					className={styles.slider}
					style={{ "--fill": `${fill}%` } as React.CSSProperties}
					min={min}
					max={max}
					step={step}
					value={sliderValue}
					disabled={disabled}
					onChange={(e) => {
						const n = Number(e.target.value);
						setText(format(n));
						onChange(n);
					}}
				/>
			)}
			{(showEcho || invalid || hint) && (
				<div className={styles.meta}>
					{invalid ? (
						<span className={styles.error}>Enter a length like 10&apos; 3 1/2 or 123.5</span>
					) : (
						showEcho && <output htmlFor={id} className={styles.echo}>{echo}</output>
					)}
					{hint && (
						<span id={`${id}-hint`} className={styles.hint}>
							{hint}
						</span>
					)}
				</div>
			)}
		</div>
	);
}
