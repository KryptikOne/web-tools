import {
	ALL_PLUGIN_IDS,
	DEFAULT_ENABLED_PLUGIN_IDS,
} from "./svgoPlugins";

export interface SvgoState {
	plugins: Record<string, boolean>;
	multipass: boolean;
	pretty: boolean;
	indent: number;
	floatPrecision: number;
}

export const STORAGE_KEY = "svgo-options-state";

export function getDefaultSvgoState(): SvgoState {
	const plugins: Record<string, boolean> = {};
	for (const id of ALL_PLUGIN_IDS) {
		plugins[id] = DEFAULT_ENABLED_PLUGIN_IDS.has(id);
	}
	return {
		plugins,
		multipass: false,
		pretty: false,
		indent: 2,
		floatPrecision: 2,
	};
}

export function loadSvgoState(): SvgoState {
	if (typeof window === "undefined") return getDefaultSvgoState();
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return getDefaultSvgoState();
		const parsed = JSON.parse(raw) as Partial<SvgoState>;
		const defaults = getDefaultSvgoState();
		const plugins: Record<string, boolean> = { ...defaults.plugins };
		if (parsed.plugins && typeof parsed.plugins === "object") {
			for (const [id, val] of Object.entries(parsed.plugins)) {
				if (typeof val === "boolean" && id in plugins) {
					plugins[id] = val;
				}
			}
		}
		return {
			plugins,
			multipass: typeof parsed.multipass === "boolean" ? parsed.multipass : defaults.multipass,
			pretty: typeof parsed.pretty === "boolean" ? parsed.pretty : defaults.pretty,
			indent: typeof parsed.indent === "number" ? parsed.indent : defaults.indent,
			floatPrecision: typeof parsed.floatPrecision === "number" ? parsed.floatPrecision : defaults.floatPrecision,
		};
	} catch {
		return getDefaultSvgoState();
	}
}

export function saveSvgoState(state: SvgoState): void {
	if (typeof window === "undefined") return;
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
	} catch {
		// ignore quota / privacy errors
	}
}
