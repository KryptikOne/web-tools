"use client";

import styles from "./ResultList.module.scss";

export interface ResultRow {
	label: string;
	value: string;
	/** Visually emphasised row, e.g. the total */
	strong?: boolean;
	hint?: string;
}

export interface ResultListProps {
	title?: string;
	rows: ResultRow[];
	className?: string;
}

/** Label / value pairs for a calculation's outputs, in mono with the value in the accent colour. */
export default function ResultList({ title, rows, className = "" }: ResultListProps) {
	return (
		<div className={`${styles.wrap} ${className}`}>
			{title && <h3 className={styles.title}>{title}</h3>}
			<dl className={styles.list}>
				{rows.map((row) => (
					<div key={row.label} className={`${styles.row} ${row.strong ? styles.strong : ""}`}>
						<dt className={styles.label}>
							{row.label}
							{row.hint && <span className={styles.hint}>{row.hint}</span>}
						</dt>
						<dd className={styles.value}>{row.value}</dd>
					</div>
				))}
			</dl>
		</div>
	);
}
