"use client";

import { useMemo } from "react";
import { SVGO_PLUGINS } from "./svgoPlugins";
import styles from "./SvgPluginList.module.scss";

interface SvgPluginListProps {
	plugins: Record<string, boolean>;
	onToggle: (id: string, enabled: boolean) => void;
}

export default function SvgPluginList({ plugins, onToggle }: SvgPluginListProps) {
	const sorted = useMemo(
		() => [...SVGO_PLUGINS].sort((a, b) => a.label.localeCompare(b.label)),
		[]
	);

	return (
		<div className={styles.container}>
			<h3 className={styles.heading}>Plugins</h3>
			<div className={styles.list}>
				{sorted.map((plugin) => (
					<label
						key={plugin.id}
						className={styles.toggle}
						title={
							plugin.a11yWarning
								? `⚠ may affect accessibility — ${plugin.description}`
								: plugin.description
						}
					>
						<input
							type="checkbox"
							checked={Boolean(plugins[plugin.id])}
							onChange={(e) => onToggle(plugin.id, e.target.checked)}
						/>
						<span>
							{plugin.label}
							{plugin.a11yWarning && (
								<span className={styles.warningMarker}> &#x26A0;</span>
							)}
						</span>
					</label>
				))}
			</div>
		</div>
	);
}
