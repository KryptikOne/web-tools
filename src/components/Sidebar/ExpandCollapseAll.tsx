"use client";

import { ChevronDoubleDownIcon, ChevronDoubleUpIcon } from "@heroicons/react/24/outline";
import styles from "./ExpandCollapseAll.module.scss";

interface ExpandCollapseAllProps {
	onExpandAll: () => void;
	onCollapseAll: () => void;
}

export default function ExpandCollapseAll({ onExpandAll, onCollapseAll }: ExpandCollapseAllProps) {
	return (
		<div className={styles.row}>
			<button
				type="button"
				className={styles.button}
				onClick={onExpandAll}
				aria-label="Expand all categories"
			>
				<ChevronDoubleDownIcon className={styles.icon} />
				<span>Expand all</span>
			</button>
			<button
				type="button"
				className={styles.button}
				onClick={onCollapseAll}
				aria-label="Collapse all categories"
			>
				<ChevronDoubleUpIcon className={styles.icon} />
				<span>Collapse all</span>
			</button>
		</div>
	);
}
