"use client";

import { useEffect, useState, type ComponentType } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { UNIT_CATEGORIES } from "@/lib/unitDefinitions";
import { getToolById } from "@/config/tools-registry";
import styles from "./UnitConverterHub.module.scss";

/** Tab ids: every linear unit category plus the two table-driven converters. */
export type UnitHubTab = (typeof UNIT_CATEGORIES)[number]["id"] | "kitchen" | "clothing";

interface HubTab {
	id: UnitHubTab;
	label: string;
	toolId: string;
}

const TABS: HubTab[] = [
	...UNIT_CATEGORIES.map((c) => ({ id: c.id as UnitHubTab, label: c.name, toolId: c.toolId })),
	{ id: "kitchen", label: "Kitchen", toolId: "kitchen-converter" },
	{ id: "clothing", label: "Clothing", toolId: "clothing-size-converter" },
];

// Each tab renders the existing feature component, which owns its reference tables.
const PANELS: Record<UnitHubTab, ComponentType> = {
	length: dynamic(() => import("@/features/distance-converter/DistanceConverter")),
	weight: dynamic(() => import("@/features/weight-converter/WeightConverter")),
	temperature: dynamic(() => import("@/features/temperature-converter/TemperatureConverter")),
	speed: dynamic(() => import("@/features/speed-converter/SpeedConverter")),
	area: dynamic(() => import("@/features/area-converter/AreaConverter")),
	volume: dynamic(() => import("@/features/volume-converter/VolumeConverter")),
	data: dynamic(() => import("@/features/data-storage-converter/DataStorageConverter")),
	energy: dynamic(() => import("@/features/energy-converter/EnergyConverter")),
	power: dynamic(() => import("@/features/power-converter/PowerConverter")),
	pressure: dynamic(() => import("@/features/pressure-converter/PressureConverter")),
	frequency: dynamic(() => import("@/features/frequency-converter/FrequencyConverter")),
	angle: dynamic(() => import("@/features/angle-converter/AngleConverter")),
	fuel: dynamic(() => import("@/features/fuel-economy-converter/FuelEconomyConverter")),
	kitchen: dynamic(() => import("@/features/kitchen-converter/KitchenConverter")),
	clothing: dynamic(() => import("@/features/clothing-size-converter/ClothingSizeConverter")),
};

interface UnitConverterHubProps {
	initialTab?: UnitHubTab;
}

/**
 * One page for every unit converter. Each tab is also reachable at its own
 * route (the registry entries). Switching tabs navigates to that route so the
 * URL, sidebar and top bar all follow, while the tab state updates immediately.
 */
export default function UnitConverterHub({ initialTab = "length" }: UnitConverterHubProps) {
	const [active, setActive] = useState<UnitHubTab>(initialTab);
	const router = useRouter();

	useEffect(() => {
		setActive(initialTab);
	}, [initialTab]);

	const select = (tab: HubTab) => {
		setActive(tab.id);
		const route = getToolById(tab.toolId)?.route;
		if (route && typeof window !== "undefined" && window.location.pathname !== route) {
			router.replace(route, { scroll: false });
		}
	};

	const Panel = PANELS[active];
	const activeTab = TABS.find((t) => t.id === active) ?? TABS[0];
	const tool = getToolById(activeTab.toolId);

	return (
		<div className={styles.container}>
			<div role="tablist" aria-label="Unit categories" className={styles.tabs}>
				{TABS.map((tab) => (
					<button
						key={tab.id}
						type="button"
						role="tab"
						aria-selected={active === tab.id}
						aria-controls={`unit-panel-${tab.id}`}
						id={`unit-tab-${tab.id}`}
						className={`${styles.tab} ${active === tab.id ? styles.tabActive : ""}`}
						onClick={() => select(tab)}
					>
						{tab.label}
					</button>
				))}
			</div>
			<div role="tabpanel" id={`unit-panel-${active}`} aria-labelledby={`unit-tab-${active}`} className={styles.panel}>
				{tool?.description && <p className={styles.description}>{tool.description}</p>}
				<Panel />
			</div>
		</div>
	);
}
