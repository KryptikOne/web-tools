"use client";

import { BarsArrowDownIcon, BarsArrowUpIcon } from "@heroicons/react/24/outline";
import styles from "./ExpandCollapseAll.module.scss";

interface ExpandCollapseAllProps {
	/** Every category is currently open, so the action on offer is "collapse all" */
	allExpanded: boolean;
	onToggle: () => void;
}

/** One icon button: expands every category when any is closed, otherwise collapses them all. */
export default function ExpandCollapseAll({ allExpanded, onToggle }: ExpandCollapseAllProps) {
	const label = allExpanded ? "Collapse all categories" : "Expand all categories";
	const Icon = allExpanded ? BarsArrowUpIcon : BarsArrowDownIcon;
	return (
		<button type="button" className={styles.button} onClick={onToggle} aria-label={label} title={label}>
			<Icon className={styles.icon} />
		</button>
	);
}
