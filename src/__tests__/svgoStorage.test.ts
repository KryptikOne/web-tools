import { describe, it, expect, beforeEach } from "vitest";
import {
	loadSvgoState,
	saveSvgoState,
	getDefaultSvgoState,
	STORAGE_KEY,
} from "@/features/svg-optimizer/svgoStorage";
import { DEFAULT_ENABLED_PLUGIN_IDS, ALL_PLUGIN_IDS } from "@/features/svg-optimizer/svgoPlugins";

describe("svgoStorage", () => {
	beforeEach(() => {
		localStorage.clear();
	});

	it("getDefaultSvgoState returns defaults with correct plugin states", () => {
		const state = getDefaultSvgoState();
		expect(state.multipass).toBe(false);
		expect(state.pretty).toBe(false);
		expect(state.indent).toBe(2);
		expect(state.floatPrecision).toBe(2);
		for (const id of ALL_PLUGIN_IDS) {
			expect(state.plugins).toHaveProperty(id);
		}
		for (const id of ALL_PLUGIN_IDS) {
			expect(state.plugins[id]).toBe(DEFAULT_ENABLED_PLUGIN_IDS.has(id));
		}
	});

	it("loadSvgoState returns defaults when localStorage is empty", () => {
		const state = loadSvgoState();
		expect(state).toEqual(getDefaultSvgoState());
	});

	it("loadSvgoState returns defaults when localStorage has corrupt JSON", () => {
		localStorage.setItem(STORAGE_KEY, "not json {{{");
		const state = loadSvgoState();
		expect(state).toEqual(getDefaultSvgoState());
	});

	it("saveSvgoState + loadSvgoState round-trip", () => {
		const next = { ...getDefaultSvgoState(), multipass: true, floatPrecision: 4 };
		saveSvgoState(next);
		const loaded = loadSvgoState();
		expect(loaded.multipass).toBe(true);
		expect(loaded.floatPrecision).toBe(4);
	});

	it("loadSvgoState merges defaults for plugin ids not in stored state (forward-compat)", () => {
		localStorage.setItem(
			STORAGE_KEY,
			JSON.stringify({
				plugins: { removeComments: false },
				multipass: true,
				pretty: false,
				indent: 2,
				floatPrecision: 2,
			})
		);
		const state = loadSvgoState();
		expect(state.plugins.removeComments).toBe(false);
		for (const id of ALL_PLUGIN_IDS) {
			if (id === "removeComments") continue;
			expect(state.plugins[id]).toBe(DEFAULT_ENABLED_PLUGIN_IDS.has(id));
		}
		expect(state.multipass).toBe(true);
	});
});
