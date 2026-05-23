# SVGOMG Replication Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> **Git policy for this session:** the user is handling all git operations themselves. Implementers must NOT run `git add`, `git commit`, `git status`, or any other git operation. Just write code, run tests, run the build, and report results.

**Goal:** Replace the hand-rolled SVG optimizer with a full SVGO-powered implementation that achieves feature parity with SVGOMG — all plugins exposed, side-by-side image preview, gzipped size, multipass, precision slider, persistent settings — while staying fully client-side.

**Architecture:** SVGO runs in a dedicated Web Worker, lazy-loaded only when the SVG optimizer route is opened. A `useSvgoOptimizer` hook owns the worker lifecycle and debounces re-optimize on input/options changes. Plugin metadata, persistence, and config building are isolated pure modules (testable independently). The current `SvgOptimizer.tsx` is rewritten as a thin orchestrator composing new focused components.

**Tech Stack:** Next.js 15 (App Router), React 19, TypeScript, SCSS modules + Tailwind, SVGO v3, fflate (gzipped size), native Web Worker, Vitest + RTL + jest-axe, pnpm.

**Spec:** [docs/superpowers/specs/2026-05-23-svgomg-replication-design.md](../specs/2026-05-23-svgomg-replication-design.md)

---

## Conventions in this codebase

- Feature files live in `src/features/<tool-name>/`. Shared utilities in `src/lib/`. Hooks in `src/hooks/`. Tests in `src/__tests__/` (component tests in `src/__tests__/components/`).
- Vitest globals are enabled (`describe`, `it`, `expect`, `vi` available without imports). Tests use `pnpm test` to run.
- Tailwind + SCSS hybrid: Tailwind for layout/spacing, SCSS modules for component-specific polish. Use existing tokens from `src/styles/_variables.scss` and mixins from `src/styles/_mixins.scss`.
- The project ALWAYS uses `pnpm` — never `npm` or `yarn`.
- Component tests use dynamic `await import("@/components/...")` inside each test (workaround for CSS modules in Vitest).
- `next/navigation` and `next/link` are mocked in component tests — see existing tests for the pattern.

## SVGO v3 config shape (reference)

The implementer should reference SVGO v3 docs as needed: <https://svgo.dev/docs/preset-default/>

Critical points:
- `plugins: ['preset-default', ...]` — `preset-default` is a string OR `{ name: 'preset-default', params: { overrides: {...} } }`.
- The `overrides` object inside `preset-default.params` disables/configures plugins that are part of the preset.
- Default-off plugins (not part of `preset-default`) are added as additional entries: `plugins: ['preset-default', 'removeDimensions', ...]`.
- The complete `preset-default` plugin list and the available standalone plugins can be confirmed at runtime by importing `svgo`'s public API.

---

## File Structure

**New files:**
- `src/features/svg-optimizer/svgoPlugins.ts` — plugin metadata catalog (single source of truth)
- `src/features/svg-optimizer/svgoStorage.ts` — `localStorage` adapter
- `src/features/svg-optimizer/svgoConfig.ts` — pure config builder
- `src/features/svg-optimizer/svgo.worker.ts` — Web Worker entry that runs SVGO
- `src/features/svg-optimizer/useSvgoOptimizer.ts` — React hook managing worker + debounce
- `src/features/svg-optimizer/demoSvgs.ts` — five sample SVGs
- `src/features/svg-optimizer/SvgInputZone.tsx` (+ `.module.scss`) — input + demo loader
- `src/features/svg-optimizer/SvgPreviewPanes.tsx` (+ `.module.scss`) — side-by-side image/code preview
- `src/features/svg-optimizer/SvgGlobalSettings.tsx` (+ `.module.scss`) — multipass / pretty / indent / precision
- `src/features/svg-optimizer/SvgPluginList.tsx` (+ `.module.scss`) — toggle list
- `src/__tests__/svgoStorage.test.ts`
- `src/__tests__/svgoConfig.test.ts`
- `src/__tests__/components/SvgOptimizer.test.tsx`
- `src/__tests__/components/SvgPluginList.test.tsx`
- `src/__tests__/components/SvgGlobalSettings.test.tsx`

**Modified files:**
- `src/features/svg-optimizer/SvgOptimizer.tsx` — complete rewrite, ~689 lines removed
- `src/features/svg-optimizer/SvgOptimizer.module.scss` — trimmed to layout concerns
- `package.json` + `pnpm-lock.yaml` — add `svgo` (v3) and `fflate`

---

## Task 1: Install dependencies

**Files:**
- Modify: `package.json`, `pnpm-lock.yaml`

- [ ] **Step 1: Install svgo and fflate**

Run: `pnpm add svgo@^3 fflate`
Expected: both packages install cleanly.

- [ ] **Step 2: Verify the versions**

Run: `pnpm list svgo fflate`
Expected: shows svgo ~3.x and fflate ~0.8.x.

- [ ] **Step 3: Verify the build still passes**

Run: `pnpm run build`
Expected: clean build (no errors, no new warnings related to these deps).

If the build fails because Next.js can't bundle SVGO's Node.js-specific modules, the implementer must report BLOCKED — this is a fundamental compatibility issue that needs design-level resolution. (SVGO v3 ships ESM and runs in browsers via SVGOMG, so this should work; if it fails, the cause is likely a Next.js/turbopack config issue, not the package itself.)

- [ ] **Step 4: Report DONE** (no git ops)

---

## Task 2: Plugin metadata catalog (`svgoPlugins.ts`)

**Files:**
- Create: `src/features/svg-optimizer/svgoPlugins.ts`

- [ ] **Step 1: Verify plugin names against the installed SVGO version**

Before writing the file, the implementer should verify which plugin names are accurate in the installed SVGO v3 by running:

```bash
node -e "const svgo = require('svgo'); console.log(Object.keys(svgo).filter(k => typeof svgo[k] === 'function' || k.startsWith('builtin')))"
```

Or by reading `node_modules/svgo/plugins/index.js` to see the exported plugin names. Some historical names changed in v3:
- `removeXMLProcInst` is correct in v3.
- `removeScriptElement` was renamed to `removeScripts` in v3.
- `removeStyleElement` may be `removeStyleElement` or removed; verify.

If any plugin name in the list below doesn't exist in the installed version, remove or correct it. Document any corrections.

- [ ] **Step 2: Create the file**

Create `src/features/svg-optimizer/svgoPlugins.ts`:

```ts
export interface PluginMeta {
	id: string;
	label: string;
	description: string;
	defaultOn: boolean;
	a11yWarning?: boolean;
}

export const SVGO_PLUGINS: PluginMeta[] = [
	// Default-on (part of preset-default in SVGO v3)
	{ id: "removeDoctype", label: "Remove DOCTYPE", description: "Remove the <!DOCTYPE> declaration from the SVG.", defaultOn: true },
	{ id: "removeXMLProcInst", label: "Remove XML processing instructions", description: "Remove the <?xml ... ?> declaration.", defaultOn: true },
	{ id: "removeComments", label: "Remove comments", description: "Remove all XML comments.", defaultOn: true },
	{ id: "removeMetadata", label: "Remove metadata", description: "Remove <metadata> elements.", defaultOn: true },
	{ id: "removeEditorsNSData", label: "Remove editor namespace data", description: "Strip editor-specific namespaced attributes (Inkscape, Sketch, Adobe).", defaultOn: true },
	{ id: "cleanupAttrs", label: "Cleanup attributes", description: "Normalize whitespace and line breaks in attribute values.", defaultOn: true },
	{ id: "mergeStyles", label: "Merge styles", description: "Merge multiple <style> elements into one.", defaultOn: true },
	{ id: "inlineStyles", label: "Inline styles", description: "Move CSS rules into matching elements as attributes.", defaultOn: true },
	{ id: "minifyStyles", label: "Minify styles", description: "Minify <style> content using CSSO.", defaultOn: true },
	{ id: "cleanupIds", label: "Cleanup IDs", description: "Remove unused IDs and minify referenced ones.", defaultOn: true },
	{ id: "removeUselessDefs", label: "Remove useless defs", description: "Remove <defs> entries without IDs that aren't referenced.", defaultOn: true },
	{ id: "cleanupNumericValues", label: "Cleanup numeric values", description: "Round floats and remove default px units.", defaultOn: true },
	{ id: "convertColors", label: "Convert colors", description: "Convert rgb() to #hex, shorten hex where possible, name colors.", defaultOn: true },
	{ id: "removeUnknownsAndDefaults", label: "Remove unknowns and defaults", description: "Strip unknown attributes and attributes set to their default value.", defaultOn: true },
	{ id: "removeNonInheritableGroupAttrs", label: "Remove non-inheritable group attrs", description: "Remove non-inheritable presentation attributes from groups.", defaultOn: true },
	{ id: "removeUselessStrokeAndFill", label: "Remove useless stroke/fill", description: "Remove stroke and fill when they have no visible effect.", defaultOn: true },
	{ id: "cleanupEnableBackground", label: "Cleanup enable-background", description: "Remove or fix the enable-background attribute.", defaultOn: true },
	{ id: "removeHiddenElems", label: "Remove hidden elements", description: "Remove elements with display:none, zero opacity, or off-canvas position.", defaultOn: true },
	{ id: "removeEmptyText", label: "Remove empty text", description: "Remove empty <text>, <tspan>, and <tref> elements.", defaultOn: true },
	{ id: "convertShapeToPath", label: "Convert shapes to paths", description: "Convert <rect>, <line>, <polygon>, <polyline> to <path>.", defaultOn: true },
	{ id: "convertEllipseToCircle", label: "Convert ellipse to circle", description: "Convert <ellipse> with equal radii to <circle>.", defaultOn: true },
	{ id: "moveElemsAttrsToGroup", label: "Move element attrs to group", description: "Move common attributes from children up to their parent group.", defaultOn: true },
	{ id: "moveGroupAttrsToElems", label: "Move group attrs to elements", description: "Inverse of above when only one child or attrs conflict.", defaultOn: true },
	{ id: "collapseGroups", label: "Collapse groups", description: "Collapse useless <g> wrappers.", defaultOn: true },
	{ id: "convertPathData", label: "Convert path data", description: "Optimize and shorten path 'd' attributes.", defaultOn: true },
	{ id: "convertTransform", label: "Convert transforms", description: "Collapse multiple transforms into one and shorten matrix notation.", defaultOn: true },
	{ id: "removeEmptyAttrs", label: "Remove empty attrs", description: "Remove attributes with empty string values.", defaultOn: true },
	{ id: "removeEmptyContainers", label: "Remove empty containers", description: "Remove empty <g>, <defs>, and similar containers.", defaultOn: true },
	{ id: "mergePaths", label: "Merge paths", description: "Merge adjacent compatible <path> elements.", defaultOn: true },
	{ id: "removeUnusedNS", label: "Remove unused namespaces", description: "Remove xmlns declarations that aren't referenced.", defaultOn: true },
	{ id: "sortAttrs", label: "Sort attributes", description: "Sort element attributes alphabetically for consistent output.", defaultOn: true },
	{ id: "sortDefsChildren", label: "Sort defs children", description: "Sort children of <defs> for consistent output.", defaultOn: true },
	{ id: "removeDesc", label: "Remove <desc>", description: "Remove <desc> elements (descriptions, often editor metadata).", defaultOn: true, a11yWarning: true },

	// Default-off (opt-in)
	{ id: "removeViewBox", label: "Remove viewBox", description: "Remove the viewBox attribute. Breaks responsive scaling — avoid for icons.", defaultOn: false, a11yWarning: true },
	{ id: "removeTitle", label: "Remove <title>", description: "Remove <title> elements (alt-text equivalent for screen readers).", defaultOn: false, a11yWarning: true },
	{ id: "removeDimensions", label: "Remove width/height", description: "Remove root width and height when viewBox is present.", defaultOn: false, a11yWarning: true },
	{ id: "removeRasterImages", label: "Remove raster images", description: "Remove embedded raster images (PNG, JPEG).", defaultOn: false },
	{ id: "removeOffCanvasPaths", label: "Remove off-canvas paths", description: "Remove path elements drawn outside the viewBox.", defaultOn: false },
	{ id: "removeStyleElement", label: "Remove <style>", description: "Remove all <style> elements entirely.", defaultOn: false },
	{ id: "removeScripts", label: "Remove scripts", description: "Remove all <script> elements.", defaultOn: false },
	{ id: "removeXMLNS", label: "Remove xmlns", description: "Remove root xmlns attribute (use for inline-HTML SVGs only).", defaultOn: false },
	{ id: "reusePaths", label: "Reuse paths", description: "Find duplicate paths and replace with <use> references.", defaultOn: false },
	{ id: "prefixIds", label: "Prefix IDs", description: "Add a prefix to every ID (helps when inlining multiple SVGs).", defaultOn: false },
];

export const DEFAULT_ENABLED_PLUGIN_IDS = new Set(
	SVGO_PLUGINS.filter((p) => p.defaultOn).map((p) => p.id)
);

export const ALL_PLUGIN_IDS = SVGO_PLUGINS.map((p) => p.id);
```

- [ ] **Step 3: Verify the file imports cleanly**

Run: `pnpm run build`
Expected: clean build.

- [ ] **Step 4: Report DONE.** Note any plugin name corrections from Step 1 in the report.

---

## Task 3: Storage adapter (`svgoStorage.ts`)

**Files:**
- Create: `src/features/svg-optimizer/svgoStorage.ts`
- Test: `src/__tests__/svgoStorage.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/svgoStorage.test.ts`:

```ts
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
		// Every plugin id from the catalog is present in state.plugins
		for (const id of ALL_PLUGIN_IDS) {
			expect(state.plugins).toHaveProperty(id);
		}
		// Default-on plugins are true; default-off plugins are false
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
		// Simulate stored state from an older version that's missing some plugins
		localStorage.setItem(
			STORAGE_KEY,
			JSON.stringify({
				plugins: { removeComments: false }, // only one plugin
				multipass: true,
				pretty: false,
				indent: 2,
				floatPrecision: 2,
			})
		);
		const state = loadSvgoState();
		// The explicitly-stored value is preserved
		expect(state.plugins.removeComments).toBe(false);
		// Plugin ids not in storage fall back to their default
		for (const id of ALL_PLUGIN_IDS) {
			if (id === "removeComments") continue;
			expect(state.plugins[id]).toBe(DEFAULT_ENABLED_PLUGIN_IDS.has(id));
		}
		expect(state.multipass).toBe(true);
	});
});
```

- [ ] **Step 2: Run the test, verify it fails**

Run: `pnpm test src/__tests__/svgoStorage.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the storage adapter**

Create `src/features/svg-optimizer/svgoStorage.ts`:

```ts
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
```

- [ ] **Step 4: Run the test, verify it passes**

Run: `pnpm test src/__tests__/svgoStorage.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Report DONE.**

---

## Task 4: Config builder (`svgoConfig.ts`)

**Files:**
- Create: `src/features/svg-optimizer/svgoConfig.ts`
- Test: `src/__tests__/svgoConfig.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/svgoConfig.test.ts`:

```ts
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
		const state = getDefaultSvgoState(); // removeViewBox is default-off
		const config = buildSvgoConfig(state);
		const hasRemoveViewBox = config.plugins.some(
			(p) => p === "removeViewBox" || (typeof p !== "string" && p.name === "removeViewBox")
		);
		expect(hasRemoveViewBox).toBe(false);
	});
});
```

- [ ] **Step 2: Run test, verify it fails**

Run: `pnpm test src/__tests__/svgoConfig.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the config builder**

Create `src/features/svg-optimizer/svgoConfig.ts`:

```ts
import type { SvgoState } from "./svgoStorage";
import { SVGO_PLUGINS } from "./svgoPlugins";

// We type the config loosely (not against SVGO's types) so unit tests can
// import this module without pulling in the full SVGO runtime.
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
```

- [ ] **Step 4: Run test, verify it passes**

Run: `pnpm test src/__tests__/svgoConfig.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Report DONE.**

---

## Task 5: Web Worker entry (`svgo.worker.ts`)

**Files:**
- Create: `src/features/svg-optimizer/svgo.worker.ts`

- [ ] **Step 1: Create the worker file**

Create `src/features/svg-optimizer/svgo.worker.ts`:

```ts
import { optimize } from "svgo";
import type { SvgoConfig } from "./svgoConfig";

interface OptimizeRequest {
	type: "optimize";
	id: number;
	svg: string;
	config: SvgoConfig;
}

interface OptimizeResponse {
	type: "result";
	id: number;
	svg: string;
	error?: string;
}

self.addEventListener("message", (event: MessageEvent<OptimizeRequest>) => {
	const { id, svg, config } = event.data;
	try {
		// SVGO's `optimize` returns { data: string } on success or throws on hard errors.
		// Some plugin errors are surfaced via the returned object as well.
		const result = optimize(svg, config as Parameters<typeof optimize>[1]);
		const message: OptimizeResponse = { type: "result", id, svg: result.data };
		(self as unknown as Worker).postMessage(message);
	} catch (err) {
		const message: OptimizeResponse = {
			type: "result",
			id,
			svg: "",
			error: err instanceof Error ? err.message : "Unknown error during SVG optimization",
		};
		(self as unknown as Worker).postMessage(message);
	}
});

// Export an empty type to satisfy module mode
export type { OptimizeRequest, OptimizeResponse };
```

- [ ] **Step 2: Verify the worker file builds**

Run: `pnpm run build`
Expected: clean build. Next.js' bundler should handle the `new URL("./svgo.worker.ts", import.meta.url)` pattern automatically when the hook imports the worker (Task 6). At THIS stage, the worker file exists but isn't yet referenced, so the build should succeed without bundling it.

If the build fails because the worker can't be parsed standalone, the implementer may need to add `// @ts-nocheck` or rename to `.worker.js` — report the error verbatim.

- [ ] **Step 3: Report DONE.** No tests at this stage; the worker is tested indirectly via the hook smoke test in Task 12.

---

## Task 6: Hook (`useSvgoOptimizer.ts`)

**Files:**
- Create: `src/features/svg-optimizer/useSvgoOptimizer.ts`

- [ ] **Step 1: Implement the hook**

Create `src/features/svg-optimizer/useSvgoOptimizer.ts`:

```ts
import { useEffect, useRef, useState } from "react";
import { gzipSync, strToU8 } from "fflate";
import type { SvgoConfig } from "./svgoConfig";

interface OptimizeResponse {
	type: "result";
	id: number;
	svg: string;
	error?: string;
}

interface UseSvgoOptimizerArgs {
	svg: string;
	config: SvgoConfig;
}

interface UseSvgoOptimizerResult {
	optimizedSvg: string;
	gzippedSize: number;
	isOptimizing: boolean;
	error: string | null;
}

const DEBOUNCE_MS = 200;

export function useSvgoOptimizer({ svg, config }: UseSvgoOptimizerArgs): UseSvgoOptimizerResult {
	const [optimizedSvg, setOptimizedSvg] = useState("");
	const [gzippedSize, setGzippedSize] = useState(0);
	const [isOptimizing, setIsOptimizing] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const workerRef = useRef<Worker | null>(null);
	const requestIdRef = useRef(0);
	const lastDispatchedIdRef = useRef(0);

	// Create the worker lazily on first use
	useEffect(() => {
		if (workerRef.current) return;
		try {
			workerRef.current = new Worker(
				new URL("./svgo.worker.ts", import.meta.url),
				{ type: "module" }
			);
			workerRef.current.addEventListener("message", (event: MessageEvent<OptimizeResponse>) => {
				const { id, svg: resultSvg, error: resultError } = event.data;
				// Drop stale results
				if (id !== lastDispatchedIdRef.current) return;
				setIsOptimizing(false);
				if (resultError) {
					setError(resultError);
					setOptimizedSvg("");
					setGzippedSize(0);
					return;
				}
				setError(null);
				setOptimizedSvg(resultSvg);
				try {
					const gz = gzipSync(strToU8(resultSvg));
					setGzippedSize(gz.length);
				} catch {
					setGzippedSize(0);
				}
			});
		} catch (err) {
			setError(
				err instanceof Error
					? `Failed to load optimizer worker: ${err.message}`
					: "Failed to load optimizer worker."
			);
		}

		return () => {
			workerRef.current?.terminate();
			workerRef.current = null;
		};
	}, []);

	// Debounced dispatch on input or config change
	useEffect(() => {
		if (!svg) {
			setOptimizedSvg("");
			setGzippedSize(0);
			setError(null);
			setIsOptimizing(false);
			return;
		}
		const worker = workerRef.current;
		if (!worker) return; // Worker not ready yet; effect will re-run when it is

		const handle = setTimeout(() => {
			requestIdRef.current += 1;
			lastDispatchedIdRef.current = requestIdRef.current;
			setIsOptimizing(true);
			worker.postMessage({
				type: "optimize",
				id: requestIdRef.current,
				svg,
				config,
			});
		}, DEBOUNCE_MS);

		return () => clearTimeout(handle);
	}, [svg, config]);

	return { optimizedSvg, gzippedSize, isOptimizing, error };
}
```

- [ ] **Step 2: Verify the file builds**

Run: `pnpm run build`
Expected: clean build. The worker URL pattern (`new URL("./svgo.worker.ts", import.meta.url)`) is the standard for Next.js + webpack/turbopack worker bundling.

If the build fails, the most common cause is a Next.js config issue. Try adding to `next.config.ts`:

```ts
webpack: (config) => {
	config.module.rules.push({ test: /\.worker\.ts$/, use: { loader: "worker-loader" } });
	return config;
},
```

But ideally the `new URL` pattern works out of the box in Next 15. Report what works.

- [ ] **Step 3: Report DONE.**

---

## Task 7: Demo SVGs (`demoSvgs.ts`)

**Files:**
- Create: `src/features/svg-optimizer/demoSvgs.ts`

- [ ] **Step 1: Create the file**

Create `src/features/svg-optimizer/demoSvgs.ts` with five hand-picked sample SVGs. Use realistic, varied examples:

```ts
export interface DemoSvg {
	id: string;
	name: string;
	description: string;
	svg: string;
}

export const DEMO_SVGS: DemoSvg[] = [
	{
		id: "simple-icon",
		name: "Simple icon",
		description: "A clean Heroicon-style chevron — minimal optimization potential.",
		svg: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/></svg>`,
	},
	{
		id: "inkscape-export",
		name: "Inkscape export (bloated)",
		description: "Typical Inkscape output with editor metadata, sodipodi namespaces, and bloated path data.",
		svg: `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!-- Created with Inkscape (http://www.inkscape.org/) -->
<svg xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:cc="http://creativecommons.org/ns#" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.0.dtd" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" width="100" height="100" viewBox="0 0 100 100" version="1.1" id="svg1" sodipodi:docname="circle.svg" inkscape:version="1.3 (0e150ed, 2023-07-21)">
  <sodipodi:namedview id="namedview1" pagecolor="#ffffff" bordercolor="#666666" borderopacity="1.0" inkscape:showpageshadow="2" inkscape:pageopacity="0.0" inkscape:pagecheckerboard="0" inkscape:deskcolor="#d1d1d1" inkscape:document-units="mm" inkscape:zoom="1" inkscape:cx="50" inkscape:cy="50" inkscape:window-width="1920" inkscape:window-height="1080" inkscape:window-x="0" inkscape:window-y="0" inkscape:window-maximized="0" inkscape:current-layer="svg1"/>
  <defs id="defs1"/>
  <g id="layer1">
    <circle style="fill:#1d4ed8;fill-opacity:1;stroke-width:1.0" id="path1" cx="50.000000" cy="50.000000" r="40.000000"/>
  </g>
</svg>`,
	},
	{
		id: "logo-with-text",
		name: "Logo with text",
		description: "An SVG containing both shapes and a <text> element.",
		svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 60" width="200" height="60">
  <rect x="0" y="0" width="200" height="60" fill="#0f172a" rx="8"/>
  <circle cx="30" cy="30" r="18" fill="#22d3ee"/>
  <text x="60" y="38" font-family="Inter, sans-serif" font-size="22" font-weight="600" fill="#f8fafc">SiteName</text>
</svg>`,
	},
	{
		id: "illustration",
		name: "Illustration (mixed shapes)",
		description: "Multiple overlapping shapes with style attributes and groups.",
		svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="400" height="300">
  <g transform="translate(0,0)">
    <rect x="20" y="20" width="100" height="100" style="fill: rgb(244, 63, 94); stroke: rgb(0, 0, 0); stroke-width: 2;"/>
    <circle cx="200" cy="80" r="60" fill="#22c55e" opacity="0.8"/>
    <polygon points="280,20 340,140 220,140" fill="#3b82f6"/>
    <ellipse cx="120" cy="220" rx="80" ry="40" fill="#f59e0b"/>
    <line x1="0" y1="270" x2="400" y2="270" stroke="#1e293b" stroke-width="4"/>
  </g>
</svg>`,
	},
	{
		id: "complex-paths",
		name: "Complex paths",
		description: "Multiple path elements with potential for merging and path-data optimization.",
		svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <path d="M 10.000000 10.000000 L 30.000000 10.000000 L 30.000000 30.000000 L 10.000000 30.000000 Z" fill="#ef4444"/>
  <path d="M 40.000000 10.000000 L 60.000000 10.000000 L 60.000000 30.000000 L 40.000000 30.000000 Z" fill="#ef4444"/>
  <path d="M 70.000000 10.000000 L 90.000000 10.000000 L 90.000000 30.000000 L 70.000000 30.000000 Z" fill="#ef4444"/>
  <path d="M 10.000000 50.000000 C 20.000000 40.000000 30.000000 60.000000 40.000000 50.000000 S 60.000000 40.000000 70.000000 50.000000" stroke="#0ea5e9" fill="none" stroke-width="2"/>
</svg>`,
	},
];
```

- [ ] **Step 2: Verify build**

Run: `pnpm run build`
Expected: clean.

- [ ] **Step 3: Report DONE.**

---

## Task 8: SvgInputZone component

**Files:**
- Create: `src/features/svg-optimizer/SvgInputZone.tsx`
- Create: `src/features/svg-optimizer/SvgInputZone.module.scss`

- [ ] **Step 1: Create the SCSS module**

Create `src/features/svg-optimizer/SvgInputZone.module.scss`:

```scss
@use "@/styles/variables" as *;
@use "@/styles/mixins" as *;
@use "@/styles/utilities" as util;

.zone {
	display: flex;
	flex-direction: column;
	gap: 1rem;
	@extend .glass-card;
}

.header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 0.5rem;
	flex-wrap: wrap;
}

.headerActions {
	display: flex;
	gap: 0.5rem;
	align-items: center;
}

.uploadButton {
	@include btn-primary;
	padding: 0.5rem 1rem;
	font-size: 0.875rem;
}

.demoSelect {
	padding: 0.5rem 0.75rem;
	background: $input-bg;
	border: 1px solid $input-border;
	border-radius: $radius-md;
	color: $text-primary;
	font-size: 0.875rem;

	&:focus {
		outline: none;
		border-color: $input-border-focus;
	}
}

.uploadZone {
	border: 1px dashed $border-medium;
	border-radius: $radius-md;
	padding: 1.5rem;
	text-align: center;
	color: $text-secondary;
	cursor: pointer;
	transition: border-color 0.2s ease, background 0.2s ease;

	&:hover,
	&.dragOver {
		border-color: $color-accent;
		background: $bg-glass-hover;
	}
}

.uploadIcon {
	color: $color-accent;
}

.textarea {
	@extend .input-field;
	min-height: 8rem;
	font-family: $font-family-mono;
	font-size: 0.8125rem;
	resize: vertical;
}
```

- [ ] **Step 2: Create the component**

Create `src/features/svg-optimizer/SvgInputZone.tsx`:

```tsx
"use client";

import { useRef, useState } from "react";
import { ArrowUpTrayIcon } from "@heroicons/react/24/outline";
import { DEMO_SVGS } from "./demoSvgs";
import styles from "./SvgInputZone.module.scss";

interface SvgInputZoneProps {
	value: string;
	onChange: (svg: string) => void;
	onClear: () => void;
}

export default function SvgInputZone({ value, onChange, onClear }: SvgInputZoneProps) {
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [dragOver, setDragOver] = useState(false);

	const handleFileUpload = (file: File) => {
		const reader = new FileReader();
		reader.onload = (ev) => {
			const text = ev.target?.result;
			if (typeof text === "string") onChange(text);
		};
		reader.readAsText(file);
	};

	const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) handleFileUpload(file);
		e.target.value = "";
	};

	const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		setDragOver(false);
		const file = e.dataTransfer.files[0];
		if (file && file.name.endsWith(".svg")) handleFileUpload(file);
	};

	const handleDemoSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const id = e.target.value;
		if (!id) return;
		const demo = DEMO_SVGS.find((d) => d.id === id);
		if (demo) onChange(demo.svg);
		e.target.value = "";
	};

	return (
		<div className={styles.zone}>
			<div className={styles.header}>
				<h2>SVG Input</h2>
				<div className={styles.headerActions}>
					<button
						type="button"
						className={styles.uploadButton}
						onClick={() => fileInputRef.current?.click()}
					>
						<ArrowUpTrayIcon className="w-4 h-4" />
						Upload SVG
					</button>
					<select
						className={styles.demoSelect}
						onChange={handleDemoSelect}
						defaultValue=""
						aria-label="Load demo SVG"
					>
						<option value="" disabled>
							Load demo…
						</option>
						{DEMO_SVGS.map((demo) => (
							<option key={demo.id} value={demo.id}>
								{demo.name}
							</option>
						))}
					</select>
					{value && (
						<button type="button" className={styles.uploadButton} onClick={onClear}>
							Clear
						</button>
					)}
				</div>
			</div>

			<input
				ref={fileInputRef}
				type="file"
				accept=".svg"
				className="hidden"
				aria-label="Upload SVG file"
				onChange={handleFileInput}
			/>

			{!value && (
				<div
					className={`${styles.uploadZone} ${dragOver ? styles.dragOver : ""}`}
					onClick={() => fileInputRef.current?.click()}
					onDragOver={(e) => {
						e.preventDefault();
						setDragOver(true);
					}}
					onDragLeave={() => setDragOver(false)}
					onDrop={handleDrop}
				>
					<ArrowUpTrayIcon className={`w-8 h-8 mx-auto mb-2 ${styles.uploadIcon}`} />
					<p className="text-sm">Drag and drop an SVG file, click to upload, or paste below</p>
				</div>
			)}

			<textarea
				className={styles.textarea}
				value={value}
				onChange={(e) => onChange(e.target.value)}
				placeholder="Paste your SVG code here…"
				spellCheck={false}
				aria-label="SVG source input"
			/>
		</div>
	);
}
```

- [ ] **Step 3: Verify build**

Run: `pnpm run build`
Expected: clean.

- [ ] **Step 4: Report DONE.**

---

## Task 9: SvgPreviewPanes component

**Files:**
- Create: `src/features/svg-optimizer/SvgPreviewPanes.tsx`
- Create: `src/features/svg-optimizer/SvgPreviewPanes.module.scss`

- [ ] **Step 1: Create the SCSS module**

Create `src/features/svg-optimizer/SvgPreviewPanes.module.scss`:

```scss
@use "@/styles/variables" as *;
@use "@/styles/mixins" as *;
@use "@/styles/utilities" as util;

.container {
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
	@extend .glass-card;
}

.tabBar {
	display: inline-flex;
	gap: 0.25rem;
	padding: 0.25rem;
	background: $bg-glass;
	border-radius: $radius-md;
	width: fit-content;
}

.tab {
	padding: 0.375rem 0.875rem;
	background: transparent;
	border: none;
	border-radius: $radius-sm;
	color: $text-secondary;
	cursor: pointer;
	font-size: 0.875rem;
	transition: background 0.15s ease, color 0.15s ease;

	&[aria-pressed="true"] {
		background: $bg-glass-hover;
		color: $text-primary;
	}
}

.panes {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 0.75rem;

	@media (max-width: 768px) {
		grid-template-columns: 1fr;
	}
}

.pane {
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
}

.paneHeader {
	font-size: 0.8125rem;
	color: $text-secondary;
}

.paneBody {
	border: 1px solid $border-subtle;
	border-radius: $radius-md;
	min-height: 14rem;
	overflow: hidden;
}

.imageBody {
	@include checkerboard-bg;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 0.5rem;

	svg {
		max-width: 100%;
		max-height: 12rem;
		height: auto;
	}
}

.codeBody {
	padding: 0;
}

.codeBody pre {
	margin: 0;
	padding: 0.75rem;
	font-family: $font-family-mono;
	font-size: 0.75rem;
	color: $text-primary;
	overflow: auto;
	max-height: 16rem;
	white-space: pre-wrap;
	word-break: break-all;
}

.empty {
	display: flex;
	align-items: center;
	justify-content: center;
	color: $text-muted;
	font-size: 0.875rem;
	text-align: center;
	padding: 1rem;
}

.error {
	color: $color-error;
	font-size: 0.875rem;
	padding: 0.75rem;
}
```

- [ ] **Step 2: Create the component**

Create `src/features/svg-optimizer/SvgPreviewPanes.tsx`:

```tsx
"use client";

import { useState } from "react";
import { sanitizeSvg } from "@/lib/sanitizeUtils";
import { formatBytes } from "@/lib/formatUtils";
import styles from "./SvgPreviewPanes.module.scss";

interface SvgPreviewPanesProps {
	original: string;
	optimized: string;
	gzippedSize: number;
	error: string | null;
	isOptimizing: boolean;
}

type ViewMode = "image" | "code";

export default function SvgPreviewPanes({
	original,
	optimized,
	gzippedSize,
	error,
	isOptimizing,
}: SvgPreviewPanesProps) {
	const [mode, setMode] = useState<ViewMode>("image");

	const originalSize = new TextEncoder().encode(original).length;
	const optimizedSize = new TextEncoder().encode(optimized).length;
	const savings = originalSize > 0 ? (1 - optimizedSize / originalSize) * 100 : 0;

	const originalHeader = original
		? `Original · ${formatBytes(originalSize)}`
		: "Original";
	const optimizedHeader = optimized
		? `Optimized · ${formatBytes(optimizedSize)} · ${savings.toFixed(1)}% saved · ${formatBytes(gzippedSize)} gzipped`
		: isOptimizing
			? "Optimizing…"
			: "Optimized";

	const sanitizedOriginal = original ? sanitizeSvg(original) : "";
	const sanitizedOptimized = optimized ? sanitizeSvg(optimized) : "";

	return (
		<div className={styles.container}>
			<div className={styles.tabBar} role="tablist" aria-label="Preview view mode">
				<button
					type="button"
					className={styles.tab}
					onClick={() => setMode("image")}
					aria-pressed={mode === "image"}
					role="tab"
				>
					Image
				</button>
				<button
					type="button"
					className={styles.tab}
					onClick={() => setMode("code")}
					aria-pressed={mode === "code"}
					role="tab"
				>
					Code
				</button>
			</div>

			<div className={styles.panes}>
				<div className={styles.pane}>
					<div className={styles.paneHeader}>{originalHeader}</div>
					<div
						className={`${styles.paneBody} ${mode === "image" ? styles.imageBody : styles.codeBody}`}
						aria-label="Original SVG preview"
					>
						{original ? (
							mode === "image" ? (
								<div dangerouslySetInnerHTML={{ __html: sanitizedOriginal }} />
							) : (
								<pre>{original}</pre>
							)
						) : (
							<div className={styles.empty}>Paste, upload, or load a demo SVG.</div>
						)}
					</div>
				</div>

				<div className={styles.pane}>
					<div className={styles.paneHeader}>{optimizedHeader}</div>
					<div
						className={`${styles.paneBody} ${mode === "image" ? styles.imageBody : styles.codeBody}`}
						aria-label="Optimized SVG preview"
					>
						{error ? (
							<div className={styles.error}>{error}</div>
						) : optimized ? (
							mode === "image" ? (
								<div dangerouslySetInnerHTML={{ __html: sanitizedOptimized }} />
							) : (
								<pre>{optimized}</pre>
							)
						) : original ? (
							<div className={styles.empty}>Optimizing…</div>
						) : (
							<div className={styles.empty}>Optimized output will appear here.</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
```

- [ ] **Step 3: Verify build**

Run: `pnpm run build`
Expected: clean.

- [ ] **Step 4: Report DONE.**

---

## Task 10: SvgGlobalSettings component

**Files:**
- Create: `src/features/svg-optimizer/SvgGlobalSettings.tsx`
- Create: `src/features/svg-optimizer/SvgGlobalSettings.module.scss`
- Test: `src/__tests__/components/SvgGlobalSettings.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/components/SvgGlobalSettings.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("next/navigation", () => ({
	usePathname: () => "/",
	useRouter: () => ({ push: vi.fn() }),
}));

describe("SvgGlobalSettings", () => {
	it("renders multipass, pretty, indent, and precision controls", async () => {
		const { default: SvgGlobalSettings } = await import(
			"@/features/svg-optimizer/SvgGlobalSettings"
		);
		render(
			<SvgGlobalSettings
				multipass={false}
				pretty={false}
				indent={2}
				floatPrecision={2}
				onChange={vi.fn()}
			/>
		);
		expect(screen.getByLabelText(/multipass/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/pretty/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/indent/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/precision/i)).toBeInTheDocument();
	});

	it("calls onChange when multipass toggles", async () => {
		const { default: SvgGlobalSettings } = await import(
			"@/features/svg-optimizer/SvgGlobalSettings"
		);
		const onChange = vi.fn();
		render(
			<SvgGlobalSettings
				multipass={false}
				pretty={false}
				indent={2}
				floatPrecision={2}
				onChange={onChange}
			/>
		);
		fireEvent.click(screen.getByLabelText(/multipass/i));
		expect(onChange).toHaveBeenCalledWith({ multipass: true });
	});

	it("calls onChange when precision slider moves", async () => {
		const { default: SvgGlobalSettings } = await import(
			"@/features/svg-optimizer/SvgGlobalSettings"
		);
		const onChange = vi.fn();
		render(
			<SvgGlobalSettings
				multipass={false}
				pretty={false}
				indent={2}
				floatPrecision={2}
				onChange={onChange}
			/>
		);
		fireEvent.change(screen.getByLabelText(/precision/i), { target: { value: "4" } });
		expect(onChange).toHaveBeenCalledWith({ floatPrecision: 4 });
	});

	it("disables the indent input when pretty is off", async () => {
		const { default: SvgGlobalSettings } = await import(
			"@/features/svg-optimizer/SvgGlobalSettings"
		);
		render(
			<SvgGlobalSettings
				multipass={false}
				pretty={false}
				indent={2}
				floatPrecision={2}
				onChange={vi.fn()}
			/>
		);
		expect(screen.getByLabelText(/indent/i)).toBeDisabled();
	});
});
```

- [ ] **Step 2: Run test, verify it fails**

Run: `pnpm test src/__tests__/components/SvgGlobalSettings.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Create SCSS module**

Create `src/features/svg-optimizer/SvgGlobalSettings.module.scss`:

```scss
@use "@/styles/variables" as *;
@use "@/styles/mixins" as *;

.container {
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
	padding: 1rem;
	background: $bg-glass;
	border: 1px solid $border-subtle;
	border-radius: $radius-md;
}

.heading {
	font-size: 0.8125rem;
	font-weight: 600;
	color: $text-secondary;
	text-transform: uppercase;
	letter-spacing: 0.05em;
	margin: 0 0 0.25rem 0;
}

.row {
	display: flex;
	align-items: center;
	gap: 0.75rem;
}

.toggle {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	font-size: 0.875rem;
	color: $text-primary;
	cursor: pointer;

	input {
		cursor: pointer;
	}
}

.indentInput {
	width: 4rem;
	padding: 0.25rem 0.5rem;
	background: $input-bg;
	border: 1px solid $input-border;
	border-radius: $radius-sm;
	color: $text-primary;
	font-size: 0.875rem;

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
}

.slider {
	flex: 1;
	max-width: 12rem;
}

.precisionRow {
	display: flex;
	align-items: center;
	gap: 0.75rem;
	font-size: 0.875rem;
	color: $text-primary;
}

.precisionValue {
	font-family: $font-family-mono;
	color: $text-secondary;
	min-width: 1.5ch;
	text-align: right;
}
```

- [ ] **Step 4: Create the component**

Create `src/features/svg-optimizer/SvgGlobalSettings.tsx`:

```tsx
"use client";

import styles from "./SvgGlobalSettings.module.scss";

interface SvgGlobalSettingsProps {
	multipass: boolean;
	pretty: boolean;
	indent: number;
	floatPrecision: number;
	onChange: (changes: Partial<{ multipass: boolean; pretty: boolean; indent: number; floatPrecision: number }>) => void;
}

export default function SvgGlobalSettings({
	multipass,
	pretty,
	indent,
	floatPrecision,
	onChange,
}: SvgGlobalSettingsProps) {
	return (
		<div className={styles.container}>
			<h3 className={styles.heading}>Global settings</h3>

			<div className={styles.row}>
				<label className={styles.toggle}>
					<input
						type="checkbox"
						checked={multipass}
						onChange={(e) => onChange({ multipass: e.target.checked })}
					/>
					Multipass
				</label>
				<label className={styles.toggle}>
					<input
						type="checkbox"
						checked={pretty}
						onChange={(e) => onChange({ pretty: e.target.checked })}
					/>
					Pretty code
				</label>
				<label className={styles.toggle}>
					Indent
					<input
						className={styles.indentInput}
						type="number"
						min={0}
						max={8}
						value={indent}
						disabled={!pretty}
						onChange={(e) => onChange({ indent: Number(e.target.value) })}
						aria-label="Indent spaces"
					/>
				</label>
			</div>

			<div className={styles.precisionRow}>
				<label htmlFor="precision-slider">Precision</label>
				<input
					id="precision-slider"
					className={styles.slider}
					type="range"
					min={0}
					max={4}
					step={1}
					value={floatPrecision}
					onChange={(e) => onChange({ floatPrecision: Number(e.target.value) })}
				/>
				<span className={styles.precisionValue}>{floatPrecision}</span>
			</div>
		</div>
	);
}
```

- [ ] **Step 5: Run test, verify it passes**

Run: `pnpm test src/__tests__/components/SvgGlobalSettings.test.tsx`
Expected: PASS (4 tests).

- [ ] **Step 6: Report DONE.**

---

## Task 11: SvgPluginList component

**Files:**
- Create: `src/features/svg-optimizer/SvgPluginList.tsx`
- Create: `src/features/svg-optimizer/SvgPluginList.module.scss`
- Test: `src/__tests__/components/SvgPluginList.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/components/SvgPluginList.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SVGO_PLUGINS } from "@/features/svg-optimizer/svgoPlugins";

vi.mock("next/navigation", () => ({
	usePathname: () => "/",
	useRouter: () => ({ push: vi.fn() }),
}));

describe("SvgPluginList", () => {
	it("renders all plugin toggles alphabetically", async () => {
		const { default: SvgPluginList } = await import(
			"@/features/svg-optimizer/SvgPluginList"
		);
		const allOn = Object.fromEntries(SVGO_PLUGINS.map((p) => [p.id, true]));
		render(<SvgPluginList plugins={allOn} onToggle={vi.fn()} />);
		// Every plugin label is present
		for (const p of SVGO_PLUGINS) {
			expect(screen.getByLabelText(new RegExp(p.label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"))).toBeInTheDocument();
		}
	});

	it("calls onToggle with the right id when a plugin is clicked", async () => {
		const { default: SvgPluginList } = await import(
			"@/features/svg-optimizer/SvgPluginList"
		);
		const onToggle = vi.fn();
		const allOn = Object.fromEntries(SVGO_PLUGINS.map((p) => [p.id, true]));
		render(<SvgPluginList plugins={allOn} onToggle={onToggle} />);
		const first = SVGO_PLUGINS[0];
		fireEvent.click(
			screen.getByLabelText(new RegExp(first.label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"))
		);
		expect(onToggle).toHaveBeenCalledWith(first.id, false);
	});
});
```

- [ ] **Step 2: Run test, verify it fails**

Run: `pnpm test src/__tests__/components/SvgPluginList.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Create SCSS module**

Create `src/features/svg-optimizer/SvgPluginList.module.scss`:

```scss
@use "@/styles/variables" as *;
@use "@/styles/mixins" as *;

.container {
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
	padding: 1rem;
	background: $bg-glass;
	border: 1px solid $border-subtle;
	border-radius: $radius-md;
}

.heading {
	font-size: 0.8125rem;
	font-weight: 600;
	color: $text-secondary;
	text-transform: uppercase;
	letter-spacing: 0.05em;
	margin: 0 0 0.25rem 0;
}

.list {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
	gap: 0.375rem 1rem;
}

.toggle {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	font-size: 0.8125rem;
	color: $text-primary;
	cursor: pointer;
	padding: 0.25rem 0;

	input {
		cursor: pointer;
	}
}

.warningMarker {
	color: $color-warning;
	font-size: 0.75rem;
}
```

- [ ] **Step 4: Create the component**

Create `src/features/svg-optimizer/SvgPluginList.tsx`:

```tsx
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
							{plugin.a11yWarning && <span className={styles.warningMarker}> ⚠</span>}
						</span>
					</label>
				))}
			</div>
		</div>
	);
}
```

- [ ] **Step 5: Run test, verify it passes**

Run: `pnpm test src/__tests__/components/SvgPluginList.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 6: Report DONE.**

---

## Task 12: Rewrite SvgOptimizer.tsx as orchestrator

**Files:**
- Modify: `src/features/svg-optimizer/SvgOptimizer.tsx`
- Modify: `src/features/svg-optimizer/SvgOptimizer.module.scss`
- Test: `src/__tests__/components/SvgOptimizer.test.tsx`

This is the big one. The current 689-line file is fully replaced.

- [ ] **Step 1: Write the smoke test (mocks the worker)**

Create `src/__tests__/components/SvgOptimizer.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";

expect.extend(toHaveNoViolations);

vi.mock("next/navigation", () => ({
	usePathname: () => "/",
	useRouter: () => ({ push: vi.fn() }),
}));

// Stub the worker module: useSvgoOptimizer imports the worker via `new Worker(new URL(...))`.
// JSDOM doesn't actually run workers; we replace global.Worker with a no-op stub.
beforeAll(() => {
	class FakeWorker {
		onmessage: ((ev: MessageEvent) => void) | null = null;
		addEventListener() {}
		removeEventListener() {}
		postMessage() {}
		terminate() {}
	}
	// @ts-expect-error replacing the global
	global.Worker = FakeWorker;
	Object.assign(navigator, {
		clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
	});
});

beforeEach(() => {
	localStorage.clear();
});

describe("SvgOptimizer", () => {
	it("renders all major sections", async () => {
		const { default: SvgOptimizer } = await import(
			"@/features/svg-optimizer/SvgOptimizer"
		);
		render(<SvgOptimizer />);
		expect(screen.getByText(/SVG Input/i)).toBeInTheDocument();
		expect(screen.getByRole("button", { name: /Upload SVG/i })).toBeInTheDocument();
		expect(screen.getByText(/Global settings/i)).toBeInTheDocument();
		expect(screen.getByText(/Plugins/i)).toBeInTheDocument();
		expect(screen.getByRole("tab", { name: /Image/i })).toBeInTheDocument();
		expect(screen.getByRole("tab", { name: /Code/i })).toBeInTheDocument();
	});

	it("has no a11y violations on initial render", async () => {
		const { default: SvgOptimizer } = await import(
			"@/features/svg-optimizer/SvgOptimizer"
		);
		const { container } = render(<SvgOptimizer />);
		const results = await axe(container);
		expect(results).toHaveNoViolations();
	});
});
```

- [ ] **Step 2: Run test, verify it fails**

Run: `pnpm test src/__tests__/components/SvgOptimizer.test.tsx`
Expected: FAIL — the current SvgOptimizer doesn't have these sections labeled correctly (it's a different structure).

- [ ] **Step 3: Replace SvgOptimizer.module.scss with a trimmed version**

Read the current file first. Then replace the entire contents of `src/features/svg-optimizer/SvgOptimizer.module.scss` with:

```scss
@use "@/styles/variables" as *;

.container {
	display: flex;
	flex-direction: column;
	gap: 1rem;
}

.actionsRow {
	display: flex;
	gap: 0.5rem;
	flex-wrap: wrap;
}

.actionButton {
	padding: 0.5rem 0.875rem;
	background: $bg-glass;
	border: 1px solid $border-subtle;
	border-radius: $radius-md;
	color: $text-primary;
	font-size: 0.875rem;
	cursor: pointer;
	transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;

	&:hover {
		background: $bg-glass-hover;
		border-color: $border-medium;
	}

	&.copied {
		color: $color-success;
		border-color: $color-success;
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
}

.optionsPanel {
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
}

.resetButton {
	align-self: flex-start;
	padding: 0.375rem 0.75rem;
	background: transparent;
	border: 1px solid $border-subtle;
	border-radius: $radius-md;
	color: $text-secondary;
	font-size: 0.8125rem;
	cursor: pointer;
	transition: background 0.15s ease, color 0.15s ease;

	&:hover {
		background: $bg-glass-hover;
		color: $text-primary;
	}
}
```

The old SCSS (~216 lines) is fully replaced. Removing dependent classes is fine — the new components own their own styles.

- [ ] **Step 4: Replace SvgOptimizer.tsx with the orchestrator**

Read the current file first to acknowledge what's being replaced. Then fully replace `src/features/svg-optimizer/SvgOptimizer.tsx` with:

```tsx
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import SvgInputZone from "./SvgInputZone";
import SvgPreviewPanes from "./SvgPreviewPanes";
import SvgGlobalSettings from "./SvgGlobalSettings";
import SvgPluginList from "./SvgPluginList";
import { useSvgoOptimizer } from "./useSvgoOptimizer";
import { buildSvgoConfig } from "./svgoConfig";
import {
	loadSvgoState,
	saveSvgoState,
	getDefaultSvgoState,
	type SvgoState,
} from "./svgoStorage";
import styles from "./SvgOptimizer.module.scss";

export default function SvgOptimizer() {
	const [inputSvg, setInputSvg] = useState("");
	const [state, setState] = useState<SvgoState>(() => loadSvgoState());
	const [copiedField, setCopiedField] = useState<string | null>(null);

	// Persist state whenever it changes
	useEffect(() => {
		saveSvgoState(state);
	}, [state]);

	const config = useMemo(() => buildSvgoConfig(state), [state]);

	const { optimizedSvg, gzippedSize, isOptimizing, error } = useSvgoOptimizer({
		svg: inputSvg,
		config,
	});

	const handlePluginToggle = useCallback((id: string, enabled: boolean) => {
		setState((prev) => ({
			...prev,
			plugins: { ...prev.plugins, [id]: enabled },
		}));
	}, []);

	const handleSettingsChange = useCallback(
		(changes: Partial<{ multipass: boolean; pretty: boolean; indent: number; floatPrecision: number }>) => {
			setState((prev) => ({ ...prev, ...changes }));
		},
		[]
	);

	const handleReset = useCallback(() => {
		setState(getDefaultSvgoState());
	}, []);

	const handleClear = useCallback(() => {
		setInputSvg("");
	}, []);

	const handleCopy = useCallback(async (text: string, field: string) => {
		try {
			await navigator.clipboard.writeText(text);
			setCopiedField(field);
			setTimeout(() => setCopiedField(null), 2000);
		} catch {
			// ignore
		}
	}, []);

	const handleCopyCode = useCallback(() => {
		if (optimizedSvg) handleCopy(optimizedSvg, "code");
	}, [optimizedSvg, handleCopy]);

	const handleCopyDataUrl = useCallback(() => {
		if (!optimizedSvg) return;
		const dataUrl = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(optimizedSvg)))}`;
		handleCopy(dataUrl, "dataurl");
	}, [optimizedSvg, handleCopy]);

	const handleDownload = useCallback(() => {
		if (!optimizedSvg) return;
		const blob = new Blob([optimizedSvg], { type: "image/svg+xml" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = "optimized.svg";
		a.click();
		URL.revokeObjectURL(url);
	}, [optimizedSvg]);

	return (
		<div className={styles.container}>
			<SvgInputZone value={inputSvg} onChange={setInputSvg} onClear={handleClear} />

			<SvgPreviewPanes
				original={inputSvg}
				optimized={optimizedSvg}
				gzippedSize={gzippedSize}
				error={error}
				isOptimizing={isOptimizing}
			/>

			<div className={styles.actionsRow}>
				<button
					type="button"
					className={`${styles.actionButton} ${copiedField === "code" ? styles.copied : ""}`}
					onClick={handleCopyCode}
					disabled={!optimizedSvg}
				>
					{copiedField === "code" ? "Copied!" : "Copy code"}
				</button>
				<button
					type="button"
					className={`${styles.actionButton} ${copiedField === "dataurl" ? styles.copied : ""}`}
					onClick={handleCopyDataUrl}
					disabled={!optimizedSvg}
				>
					{copiedField === "dataurl" ? "Copied!" : "Copy data URL"}
				</button>
				<button
					type="button"
					className={styles.actionButton}
					onClick={handleDownload}
					disabled={!optimizedSvg}
				>
					Download
				</button>
			</div>

			<div className={styles.optionsPanel}>
				<SvgGlobalSettings
					multipass={state.multipass}
					pretty={state.pretty}
					indent={state.indent}
					floatPrecision={state.floatPrecision}
					onChange={handleSettingsChange}
				/>
				<SvgPluginList plugins={state.plugins} onToggle={handlePluginToggle} />
				<button type="button" className={styles.resetButton} onClick={handleReset}>
					Reset to defaults
				</button>
			</div>
		</div>
	);
}
```

- [ ] **Step 5: Run the smoke test, verify it passes**

Run: `pnpm test src/__tests__/components/SvgOptimizer.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 6: Run full test suite**

Run: `pnpm test`
Expected: all existing tests pass plus the new ones added in Tasks 3, 4, 10, 11, 12.

- [ ] **Step 7: Run build**

Run: `rm -rf .next && pnpm run build`
Expected: clean build.

- [ ] **Step 8: Report DONE.**

---

## Task 13: Manual end-to-end smoke test (user-driven)

**Files:** none modified.

This task is interactive — the user runs it. Implementer should not attempt to drive a browser.

- [ ] **Step 1: Start the dev server**

Run: `pnpm run dev`

- [ ] **Step 2: User opens `http://localhost:3000/tools/svg-optimizer` and verifies:**

- The page loads. A brief delay is acceptable while the worker boots and SVGO loads (~500ms).
- The input zone renders with upload / demo dropdown / textarea.
- Loading a demo SVG from the dropdown populates the textarea and triggers optimization.
- Side-by-side preview shows the rendered image of original and optimized.
- Sizes display correctly (`Original · 4.5 KB`, `Optimized · 1.2 KB · 73.3% saved · 0.7 KB gzipped`).
- Toggle between Image and Code tabs works.
- Toggling plugins changes the optimized output in real time (after 200ms debounce).
- Multipass on / pretty on / precision changes affect the output.
- Reset to defaults restores the initial plugin set.
- Copy code, copy data URL, and download all work.
- Plugin state persists across page reload.
- Test with each of the 5 demo SVGs.
- Test with a real-world SVG (paste from an external source, or upload a file).

- [ ] **Step 3: User stops the dev server (`Ctrl+C`)**

- [ ] **Step 4: Report any issues found, or report DONE.**

---

## Task 14: Final test suite + production build

**Files:** none modified.

- [ ] **Step 1: Run the full test suite**

Run: `pnpm test`
Expected: all tests pass. Compared to the baseline before this work, the new tests are:
- 5 in `svgoStorage.test.ts`
- 5 in `svgoConfig.test.ts`
- 4 in `SvgGlobalSettings.test.tsx`
- 2 in `SvgPluginList.test.tsx`
- 2 in `SvgOptimizer.test.tsx`

Total: 18 new tests on top of existing.

- [ ] **Step 2: Run the production build**

Run: `rm -rf .next && pnpm run build`
Expected: clean. Verify in the build output that the SVG optimizer route shows a notably larger bundle size than other routes (because SVGO is bundled there), but no other routes show inflation — proving the lazy-load worked.

- [ ] **Step 3: Report DONE.**

---

## Done

Definition of done from the spec:

- [x] `svgo` + `fflate` installed.
- [x] All ~40 SVGO plugins exposed as toggles with defaults matching `preset-default`.
- [x] Global settings (multipass, pretty, indent, precision) function correctly.
- [x] Side-by-side rendered preview + tab to code view.
- [x] Sizes (original / optimized / savings / gzipped) display correctly.
- [x] Plugin + setting state persists across reloads.
- [x] "Load demo" loads each of the five samples.
- [x] Copy code, copy data URL, download work.
- [x] Worker runs optimization off the main thread.
- [x] A11y warnings on relevant plugins.
- [x] All new unit tests pass; jest-axe clean.
- [x] Old hand-rolled optimization code (~689 lines) removed.
- [x] Manual smoke test on demo + real SVGs.
- [x] `pnpm run build` clean.
