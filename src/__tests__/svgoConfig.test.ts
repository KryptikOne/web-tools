import { describe, it, expect } from "vitest";
import { buildSvgoConfig } from "@/features/svg-optimizer/svgoConfig";
import { getDefaultSvgoState } from "@/features/svg-optimizer/svgoStorage";

describe("buildSvgoConfig", () => {
	it("includes preset-default when all default-on plugins are enabled", () => {
		const config = buildSvgoConfig(getDefaultSvgoState());
		const presetEntry = config.plugins.find((p) =>
			typeof p === "string" ? p === "preset-default" : p.name === "preset-default"
		);
		expect(presetEntry).toBeDefined();
	});

	it("disables a plugin via preset-default overrides when toggled off", () => {
		const state = getDefaultSvgoState();
		state.plugins.removeComments = false;
		const config = buildSvgoConfig(state);
		const preset = config.plugins.find(
			(p) => typeof p !== "string" && p.name === "preset-default"
		) as { name: string; params?: { overrides?: Record<string, false> } };
		expect(preset.params?.overrides?.removeComments).toBe(false);
	});

	it("adds a default-off plugin as a separate entry when toggled on", () => {
		const state = getDefaultSvgoState();
		state.plugins.removeDimensions = true;
		const config = buildSvgoConfig(state);
		const hasRemoveDimensions = config.plugins.some(
			(p) => p === "removeDimensions" || (typeof p !== "string" && p.name === "removeDimensions")
		);
		expect(hasRemoveDimensions).toBe(true);
	});

	it("passes through multipass, js2svg.pretty/indent, and floatPrecision", () => {
		const state = { ...getDefaultSvgoState(), multipass: true, pretty: true, indent: 4, floatPrecision: 3 };
		const config = buildSvgoConfig(state);
		expect(config.multipass).toBe(true);
		expect(config.js2svg).toEqual({ pretty: true, indent: 4 });
		expect(config.floatPrecision).toBe(3);
	});

	it("does not add a default-off plugin when it stays off", () => {
		const state = getDefaultSvgoState();
		const config = buildSvgoConfig(state);
		const hasRemoveViewBox = config.plugins.some(
			(p) => p === "removeViewBox" || (typeof p !== "string" && p.name === "removeViewBox")
		);
		expect(hasRemoveViewBox).toBe(false);
	});
});
