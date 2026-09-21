"use client";

import styles from "./SegmentedControl.module.scss";

export interface SegmentedOption<T extends string> {
	value: T;
	label: React.ReactNode;
	title?: string;
	disabled?: boolean;
}

interface SegmentedControlProps<T extends string> {
	options: SegmentedOption<T>[];
	value: T;
	onChange: (value: T) => void;
	/** Accessible name for the group */
	label: string;
	size?: "sm" | "md";
	/** Stretch segments to fill the row (default true) */
	fill?: boolean;
	className?: string;
}

/** A radio-group styled as joined buttons. Used for mode/tab style switches. */
export default function SegmentedControl<T extends string>({
	options,
	value,
	onChange,
	label,
	size = "md",
	fill = true,
	className = "",
}: SegmentedControlProps<T>) {
	return (
		<div
			role="radiogroup"
			aria-label={label}
			className={`${styles.group} ${size === "sm" ? styles.sm : ""} ${fill ? styles.fill : ""} ${className}`}
		>
			{options.map((opt) => (
				<button
					key={opt.value}
					type="button"
					role="radio"
					aria-checked={value === opt.value}
					title={opt.title}
					disabled={opt.disabled}
					className={`${styles.segment} ${value === opt.value ? styles.active : ""}`}
					onClick={() => onChange(opt.value)}
				>
					{opt.label}
				</button>
			))}
		</div>
	);
}
