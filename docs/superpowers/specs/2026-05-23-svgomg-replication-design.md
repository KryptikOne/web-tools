# SVG Optimizer — SVGOMG Replication Design

**Status:** Approved, ready for implementation plan
**Date:** 2026-05-23

## Purpose

Replace the current custom SVG optimizer (~13 hand-rolled toggles, DOMParser-based) with a full SVGO-powered implementation that reaches feature parity with [SVGOMG](https://jakearchibald.github.io/svgomg/). Same client-side guarantees, much higher optimization quality, full plugin coverage including path collapsing, shape-to-path conversion, style merging, and the rest of SVGO's ~40-plugin surface.

The visual design stays consistent with the rest of the web-tools app (not a 1:1 SVGOMG UI clone) — but the functional capability is full parity.

## Goals

- Achieve optimization output quality on par with SVGOMG for any input SVG.
- Expose every meaningful SVGO plugin as a user-controllable toggle.
- Side-by-side rendered-image preview (original | optimized) so users can spot visual regressions caused by aggressive plugins.
- Tab to view the optimized code.
- Display original size, optimized size, savings percent, and gzipped size.
- Persist plugin/option choices across sessions.
- Stay fully client-side (no upload, no server) — matches the rest of the site's promise.
- Keep the UI responsive on large SVGs by running optimization in a Web Worker.

## Non-Goals

- Multi-file batch optimization (drag many SVGs, optimize all, zip download).
- Undo/redo history.
- Shareable optimization URLs.
- Visual diff highlighting between original and optimized.
- A 1:1 SVGOMG UI layout — visual design stays in our app's language.

## Architecture

### Dependencies

| Dep | Purpose | Approx. size | Notes |
|---|---|---|---|
| `svgo` (v3.x) | Optimization engine | ~300 KB minified | Lazy-loaded only when the tool page mounts. Tree-shaking won't help much; the cost is real and accepted. |
| `fflate` | Gzipped size estimate | ~14 KB minified | Used to display realistic "deployment size" alongside raw byte count. |

No worker library (Comlink, etc.); native `Worker` + `postMessage` is sufficient for a single endpoint.

### Worker boundary

A dedicated Web Worker (`svgo.worker.ts`) imports SVGO and exposes one operation. The main thread never imports SVGO directly — that's the whole point of the boundary.

**Worker contract:**

```ts
// Sent from main thread:
{ type: "optimize"; id: number; svg: string; config: SvgoConfig }

// Received from worker:
{ type: "result"; id: number; svg: string; error?: string }
```

The `id` lets the main thread match responses to requests and discard stale results when rapid changes cause overlapping in-flight requests.

### Hook: `useSvgoOptimizer`

Owns the worker lifecycle. Lazy-loads the worker via `new Worker(new URL("./svgo.worker.ts", import.meta.url), { type: "module" })` on first use. Single source of truth for optimization state.

**Returns:**

```ts
{
    optimizedSvg: string;
    gzippedSize: number;        // bytes
    isOptimizing: boolean;
    error: string | null;
}
```

**Behavior:**

- Debounces input + config changes by 200 ms before dispatching to the worker.
- Tracks the latest request `id`; results for older `id`s are dropped.
- Computes `gzippedSize` on the main thread via `fflate.gzipSync(optimizedSvg)` after a successful result.
- Surfaces worker errors (invalid SVG, plugin failure) via `error`.

### File structure

**New files:**

| File | Responsibility |
|---|---|
| `src/features/svg-optimizer/svgo.worker.ts` | Worker entry. Imports SVGO. Handles `optimize` messages. |
| `src/features/svg-optimizer/useSvgoOptimizer.ts` | Hook owning worker lifecycle + debounced re-optimize. |
| `src/features/svg-optimizer/svgoPlugins.ts` | Single source of truth for plugin metadata (id, label, description, defaultOn). |
| `src/features/svg-optimizer/svgoStorage.ts` | `localStorage` adapter for plugin states + global settings. |
| `src/features/svg-optimizer/svgoConfig.ts` | Pure function building the SVGO config object from current settings. |
| `src/features/svg-optimizer/demoSvgs.ts` | Five hand-picked sample SVGs. |
| `src/features/svg-optimizer/SvgPreviewPanes.tsx` (+ `.module.scss`) | Side-by-side image/code preview with tab toggle. |
| `src/features/svg-optimizer/SvgPluginList.tsx` (+ `.module.scss`) | Plugin toggle list, alphabetical, with tooltips. |
| `src/features/svg-optimizer/SvgGlobalSettings.tsx` (+ `.module.scss`) | Multipass / pretty / indent / precision slider. |
| `src/features/svg-optimizer/SvgInputZone.tsx` (+ `.module.scss`) | Upload / paste / drag-drop / demo loader. |

**Modified files:**

| File | Change |
|---|---|
| `src/features/svg-optimizer/SvgOptimizer.tsx` | Full rewrite. Becomes a thin orchestrator that composes the new components. |
| `src/features/svg-optimizer/SvgOptimizer.module.scss` | Trimmed to layout-level concerns only; component-specific styles live in their own modules. |
| `package.json` + `pnpm-lock.yaml` | Add `svgo` and `fflate`. |

**Removed:**

The bulk of the current `SvgOptimizer.tsx` (~689 lines of hand-rolled optimization passes — `removeComments`, `removeMetadata`, `removeEmptyAttributesFromElement`, etc.) goes away entirely. SVGO covers every existing capability and a great deal more. No backwards-compatibility shim.

## UI

### Page layout (top to bottom)

1. **Input row** — `SvgInputZone`. Upload button, drag-and-drop zone (when empty), paste textarea, "Load demo" dropdown selecting from five samples, "Clear" button.
2. **Preview tabs** — small tab bar: `Image` (default) | `Code`. Switches what's shown inside the preview panes.
3. **Side-by-side preview panes** — `SvgPreviewPanes`. Two equal columns:
   - Left pane: original SVG. Header reads `Original · 12.4 KB`.
   - Right pane: optimized SVG. Header reads `Optimized · 4.2 KB · 66% saved · 1.8 KB gzipped`.
   - In Image mode: each pane renders the sanitized SVG (via `sanitizeSvg` + `dangerouslySetInnerHTML`) inside a fixed-aspect container with the existing `@mixin checkerboard-bg` background. Transparent SVGs are visible against the checkerboard.
   - In Code mode: each pane shows a read-only `<pre>` with the SVG source. Monospace, scroll on overflow.
4. **Action row** — `Copy code` / `Copy data URL` / `Download` buttons. All operate on the optimized output.
5. **Options panel** — `SvgGlobalSettings` followed by `SvgPluginList`. Collapsible (open by default).
   - **Global settings:** Multipass toggle, Pretty code toggle, Indent input (only enabled when Pretty is on), Precision slider (0–4, default 2).
   - **Plugins:** ~40 plugin toggles, alphabetical, each with a brief tooltip describing what it does. Default-on/off matches SVGO's `preset-default` baseline.
   - **Reset to defaults** button at the bottom of the panel.

### Design language

- Existing `glass-card` panels for the input zone, preview, and options panel sections.
- Existing tighter spacing tokens from the recent design tweaks pass.
- Existing toggle pattern (the same `ToggleOption` component shape currently in the file, or its equivalent — refactor lightly if needed).
- No display font on labels or toggle text — that stays for titles/headers per project convention.
- Plugin tooltips use the existing `title` attribute pattern for now (no custom tooltip component).

## Plugin coverage

`src/features/svg-optimizer/svgoPlugins.ts` is the single source of truth. Format:

```ts
interface PluginMeta {
    id: string;
    label: string;
    description: string;
    defaultOn: boolean;
}

export const SVGO_PLUGINS: PluginMeta[] = [ /* see lists below */ ];
```

### Default-on (matches SVGO `preset-default`)

`removeDoctype`, `removeXMLProcInst`, `removeComments`, `removeMetadata`, `removeEditorsNSData`, `cleanupAttrs`, `mergeStyles`, `inlineStyles`, `minifyStyles`, `cleanupIds`, `removeUselessDefs`, `cleanupNumericValues`, `convertColors`, `removeUnknownsAndDefaults`, `removeNonInheritableGroupAttrs`, `removeUselessStrokeAndFill`, `cleanupEnableBackground`, `removeHiddenElems`, `removeEmptyText`, `convertShapeToPath`, `convertEllipseToCircle`, `moveElemsAttrsToGroup`, `moveGroupAttrsToElems`, `collapseGroups`, `convertPathData`, `convertTransform`, `removeEmptyAttrs`, `removeEmptyContainers`, `mergePaths`, `removeUnusedNS`, `sortAttrs`, `sortDefsChildren`, `removeDesc`.

### Default-off (opt-in)

`removeViewBox`, `removeTitle`, `removeDimensions`, `removeRasterImages`, `removeOffCanvasPaths`, `removeStyleElement`, `removeScriptElement`, `removeXMLNS`, `reusePaths`, `prefixIds`.

### Accessibility-sensitive warnings

Tooltips for these include a leading "⚠ may affect accessibility / responsiveness":

- `removeTitle` (strips alt-text-equivalent)
- `removeDesc` (strips long description)
- `removeViewBox` (breaks responsive scaling)
- `removeDimensions` (depends on viewBox to scale correctly)

## SVGO config construction

`svgoConfig.ts` exports a pure function:

```ts
buildSvgoConfig(state: SvgoState): SvgoConfig
```

Where `SvgoState` is the persisted shape (see Persistence). The returned config uses SVGO's `preset-default` with an `overrides` block disabling any default-on plugins the user toggled off, plus standalone plugin entries for any default-off plugins the user toggled on. Example shape:

```ts
{
    multipass: state.multipass,
    js2svg: { pretty: state.pretty, indent: state.indent },
    floatPrecision: state.floatPrecision,
    plugins: [
        {
            name: "preset-default",
            params: { overrides: { /* { removeComments: false, ... } */ } },
        },
        // ...plus { name: "removeViewBox" } etc. for opt-ins
    ],
}
```

The function is pure — no side effects, fully unit-testable.

## Persistence

`src/features/svg-optimizer/svgoStorage.ts` writes to `localStorage` under the key `svgo-options-state`. Not Redux — the state is feature-local and no other tool consumes it.

```ts
interface SvgoState {
    plugins: Record<string, boolean>;
    multipass: boolean;
    pretty: boolean;
    indent: number;
    floatPrecision: number;
}

export function loadSvgoState(): SvgoState; // returns defaults if missing or invalid
export function saveSvgoState(state: SvgoState): void;
export function getDefaultSvgoState(): SvgoState; // derived from SVGO_PLUGINS metadata
```

SSR-safe via the `typeof window === "undefined"` guard used elsewhere in the project.

The hook initializes via `useState(() => loadSvgoState())` (lazy initializer) and writes via `saveSvgoState` on every change. "Reset to defaults" calls `getDefaultSvgoState()` and writes it back.

## Edge cases

| Case | Handling |
|---|---|
| Invalid SVG input | Worker catches the parse error, returns `{ error: "Could not parse SVG" }`. Right pane shows the error message inline; left pane still renders the original text (image mode falls back to showing the raw textarea if it won't parse for the preview either). |
| Empty input | Both panes show an empty state: "Paste, upload, or load a demo SVG to get started." No worker dispatches. |
| Very large SVG (>1 MB) | Worker keeps UI responsive. Subtle "Optimizing…" indicator on the right pane during the in-flight period. |
| Plugin combo produces unrenderable output | Right pane in image mode shows a red-bordered fallback: "Rendered preview unavailable — output may still be valid SVG. Switch to Code view to inspect." |
| Rapid plugin toggling | 200 ms debounce between option change and worker dispatch. In-flight result with stale `id` is discarded. |
| Worker fails to load (CSP, ancient browser) | Show a clear error: "SVG optimizer requires a modern browser with Web Worker support." No main-thread synchronous fallback (would freeze UI on the exact inputs where it matters most). |
| Download filename | Default `optimized.svg`. If input came from a file picker with a known name, use `${baseName}.optimized.svg`. |
| Copy as data URL | UTF-8-safe: `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(optimizedSvg)))}`. |
| SSR / hydration | Hook initializes from `localStorage` only on the client. Server render shows the empty state with default plugin set; client hydrates and re-runs if needed. |

## Accessibility

- All toggles are real `<input type="checkbox">` elements with associated `<label>` (no custom div-button toggles).
- The precision slider is a real `<input type="range">` with `<label>` + visible numeric value.
- Plugin tooltips use `title` attribute (works for keyboard focus + hover; not custom).
- The tab bar (`Image` / `Code`) uses real `<button>` elements with `aria-pressed` reflecting the active state.
- Preview panes have `aria-label="Original SVG preview"` / `"Optimized SVG preview"`.
- `prefers-reduced-motion` honored for any panel collapse animation.
- jest-axe covers the main `SvgOptimizer` component.

## Testing

| File | Coverage |
|---|---|
| `src/__tests__/svgoStorage.test.ts` | Load/save round-trip; missing-key returns defaults; corrupted JSON returns defaults. |
| `src/__tests__/svgoConfig.test.ts` | `buildSvgoConfig` produces correct shape for: all defaults; one default-on disabled; one default-off enabled; pretty + indent combo. |
| `src/__tests__/components/SvgOptimizer.test.tsx` | Smoke: renders input zone, plugin list, preview panes. Worker is mocked via `vi.mock` returning a fake `Worker` class — actual SVGO behavior is SVGO's responsibility, not ours. |
| `src/__tests__/components/SvgPluginList.test.tsx` | Renders all toggle labels from `SVGO_PLUGINS`; toggling fires the callback with the right plugin id. |
| `src/__tests__/components/SvgGlobalSettings.test.tsx` | Precision slider, multipass toggle, pretty toggle, indent input all wired correctly. |

Worker logic itself is not unit-tested (the JSDOM test environment doesn't run Web Workers natively, and SVGO has its own test suite). Integration is verified manually on real SVGs in the final smoke test.

## Performance considerations

- **First-load delay:** SVGO is ~300 KB lazy-loaded the first time a user visits `/tools/svg-optimizer` in a session. Tool page shows a brief "Loading optimizer…" state while the worker boots. Subsequent visits in the same session are instant.
- **Bundle impact on other tools:** zero — SVGO is loaded only by the worker, which is only requested by the SVG optimizer route.
- **Optimization speed:** SVGO is fast on small/medium SVGs (<100 ms for typical icons). Large illustrations (100KB+) may take 500ms–1s with multipass. The worker absorbs this without blocking UI.
- **Multipass setting:** off by default because the cost can be substantial on large inputs. Users who care about absolute minimum size enable it deliberately.

## Implementation order

1. Add `svgo` + `fflate` to package.json (Task 1).
2. `svgoPlugins.ts` — the plugin metadata catalog (Task 2).
3. `svgoStorage.ts` — load/save with tests (Task 3).
4. `svgoConfig.ts` — pure config builder with tests (Task 4).
5. `svgo.worker.ts` — worker entry, optimize handler (Task 5).
6. `useSvgoOptimizer.ts` — hook, debouncing, worker lifecycle (Task 6).
7. `demoSvgs.ts` — five sample SVGs (Task 7).
8. `SvgInputZone.tsx` — extracted from existing, plus demo loader dropdown (Task 8).
9. `SvgPreviewPanes.tsx` — side-by-side image/code preview (Task 9).
10. `SvgGlobalSettings.tsx` — multipass/pretty/indent/precision (Task 10).
11. `SvgPluginList.tsx` — alphabetical toggle list with tooltips (Task 11).
12. Rewrite `SvgOptimizer.tsx` as orchestrator composing all the above; remove old optimization code (Task 12).
13. Component a11y tests + final smoke test on real SVGs (Task 13).
14. Final test suite + production build (Task 14).

## Definition of done

- [ ] `svgo` and `fflate` installed and bundled lazily — `pnpm run build` confirms SVG optimizer route is the only one carrying the SVGO bundle.
- [ ] All ~40 SVGO plugins exposed as toggles with sensible defaults matching SVGO's `preset-default`.
- [ ] Global settings (multipass, pretty, indent, precision) function correctly.
- [ ] Side-by-side rendered-image preview works; tab to code view works.
- [ ] Original / optimized / savings / gzipped sizes display correctly.
- [ ] Plugin + setting state persists across reloads.
- [ ] "Load demo" dropdown loads each of the five samples.
- [ ] Copy code, copy data URL, download all work.
- [ ] Worker runs optimization off the main thread; UI stays responsive on large SVGs.
- [ ] Accessibility-sensitive plugin tooltips include the warning marker.
- [ ] All new unit tests pass; jest-axe clean on `SvgOptimizer`.
- [ ] Old hand-rolled optimization code (~689 lines from the previous `SvgOptimizer.tsx`) fully removed.
- [ ] Manual smoke test on at least five real-world SVGs (a simple icon, a complex illustration, a logo with text, an Inkscape export, a Figma export) confirms output renders identically to input and size reduction is comparable to SVGOMG running the same plugin set.
- [ ] `pnpm run build` succeeds clean.
