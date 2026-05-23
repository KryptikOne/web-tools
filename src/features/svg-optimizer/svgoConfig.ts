import type { SvgoState } from "./svgoStorage";
import { SVGO_PLUGINS } from "./svgoPlugins";

export interface SvgoConfig {
	multipass: boolean;
	floatPrecision: number;
	js2svg: { pretty: boolean; indent: number };
	plugins: Array<string | { name: string; params?: Record<string, unknown> }>;
}

export function buildSvgoConfig(state: SvgoState): SvgoConfig {
	const overrides: Record<string, false> = {};
	const extraPlugins: string[] = [];

	for (const plugin of SVGO_PLUGINS) {
		const enabled = state.plugins[plugin.id];
		if (plugin.defaultOn && !enabled) {
			overrides[plugin.id] = false;
		} else if (!plugin.defaultOn && enabled) {
			extraPlugins.push(plugin.id);
		}
	}

	const presetEntry =
		Object.keys(overrides).length === 0
			? ("preset-default" as const)
			: { name: "preset-default", params: { overrides } };

	return {
		multipass: state.multipass,
		floatPrecision: state.floatPrecision,
		js2svg: { pretty: state.pretty, indent: state.indent },
		plugins: [presetEntry, ...extraPlugins],
	};
}
