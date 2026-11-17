# Agent Instructions

Repo conventions for anyone (or any tool) contributing to this codebase. The checklist, styling rules and utility inventory below are the source of truth; see also [CONTRIBUTING.md](CONTRIBUTING.md).

---

## Engineering Philosophy

Follow these principles, in priority order:

1. Clarity over cleverness
2. Composition over inheritance
3. Explicitness over magic
4. Reuse patterns, not components, unless reuse is proven
5. Prefer boring, well-understood solutions

Avoid premature optimization and over-engineering.

---

## React / Next.js Expectations

- Favor functional components and hooks
- Prefer colocating logic with the components that own it
- Avoid global state unless it clearly provides value
- Treat shared components as products with stable APIs
- Encourage separation of:
    - UI
    - State
    - Domain logic
    - Utilities

---

## Collaboration Model

- Treat this as an evolving codebase, not a greenfield rewrite
- Propose incremental improvements rather than large rewrites
- When refactoring, suggest migration paths
- Proactively identify opportunities for better cohesion or simplification

---

## New Tool Checklist

When creating a new tool, **always complete all of these steps**:

1. **Create the feature component** in `src/features/[tool-name]/[ToolName].tsx`
2. **Create the SCSS module** in `src/features/[tool-name]/[ToolName].module.scss`
3. **Create the route page** in `src/app/tools/[tool-name]/page.tsx`
4. **Register the tool** in `src/config/tools-registry.ts` with `implemented: true` and lowercase `keywords` for search terms people type that are not in the name (e.g. `"exif"` for Metadata Stripper)
5. **SEO**: give the registry entry an `seoDescription` (110–160 chars, no em-dashes, unique) and export `export const metadata = toolMetadata("<tool-id>");` from the route page (`import { toolMetadata } from "@/config/seo"`). Sitemap, llms.txt and JSON-LD pick the tool up automatically; `src/__tests__/seoRegistry.test.ts` fails if either step is skipped.
6. **Ensure accessibility**: All form elements (`<input>`, `<select>`, `<textarea>`) must have labels — use `<label>` wrappers, `htmlFor`/`id` pairing, or `aria-label`. Hidden file inputs always need `aria-label`.
7. **Run `pnpm run build`** to verify everything compiles correctly

---

## Styling Approach: Tailwind + SCSS Hybrid

Use a balanced combination of Tailwind utility classes and SCSS modules:

**Use Tailwind classes for:**

- Layout: `flex`, `grid`, `gap-*`, `p-*`, `m-*`
- Typography: `text-*`, `font-*`
- Common utilities: `shadow-*`, `opacity-*` (no `rounded-*`: the design is square-cornered; `rounded-full` only for genuine circles)
- Responsive: `md:`, `lg:` breakpoint prefixes
- States: `hover:`, `focus:`, `active:` variants

**Use SCSS modules (`.module.scss`) for:**

- Complex animations and transitions
- Pseudo-elements (`::before`, `::after`)
- Multi-property hover states
- Component-specific custom styles
- Styles requiring SCSS variables or mixins

**Pattern example:**

```tsx
// Component.tsx - Tailwind for layout, SCSS for custom styles
<div className={`flex gap-4 p-6 ${styles.glassCard}`}>
	<button className={`px-4 py-2 ${styles.primaryBtn}`}>Click me</button>
</div>
```

```scss
// Component.module.scss - Only what Tailwind can't do
.glassCard {
	@extend .glass-card; // From _utilities.scss
}

.primaryBtn {
	background: $color-accent;
	transition: all 0.2s ease;

	&:hover {
		background: $color-accent-hover;
		transform: translateY(-1px);
	}
}
```

**Key principle:** Tailwind for structure, SCSS for polish. Don't duplicate what Tailwind provides.

---

## Utility-First Development

**ALWAYS leverage existing utilities before writing new code.**

Before implementing any functionality:

1. Check `src/lib/` for existing utility functions
2. Check `src/hooks/` for existing custom hooks
3. Check `src/components/` for existing reusable components

Key utilities in this codebase:

- `src/lib/colorUtils.ts` - Color parsing and conversion (hex, RGB, HSL, HSV, OKLCH)
- `src/lib/formatUtils.ts` - Formatting helpers (formatBytes)
- `src/lib/sanitizeUtils.ts` - HTML/SVG sanitization and escaping (security-critical)
- `src/lib/base64Utils.ts` - UTF-8-aware Base64 encoding/decoding
- `src/lib/hashUtils.ts` - MD5, ArrayBuffer-to-hex/base64, hex-to-bytes
- `src/lib/textCaseUtils.ts` - Text case conversions (camelCase, snake_case, kebab-case, etc.)
- `src/lib/htmlEntityUtils.ts` - HTML entity escaping/unescaping with format options
- `src/lib/textEffects.ts` - Text scramble animation
- `src/lib/natoPhoneticUtils.ts` - Spelling alphabets (NATO, DIN 5009, German 1996): spell text, read calls, auto-detect
- `src/lib/morseUtils.ts` - International Morse code table + charToMorse
- `src/lib/semaphoreUtils.ts` - Flag semaphore positions and arm angles
- `src/lib/downloadUtils.ts` - downloadBlob / downloadTextFile / downloadBytes (client-side file download)
- `src/lib/contrastUtils.ts` - WCAG contrast ratio, checks, ratings, and lightness-based auto-fix
- `src/lib/cipherUtils.ts` - Classical ciphers (Caesar, Vigenère, Affine, Rail fence…), codes, English-likeness scoring, auto-decode
- `src/lib/cronUtils.ts` - Cron field model, parsing/normalising, plain-English description, time-zone aware next runs
- `src/lib/numberBaseUtils.ts` - Base conversion (2–36, sign, fraction, BigInt), two's complement, bitwise ops
- `src/lib/dateTimeUtils.ts` - Time-zone aware parts/format/parse, unix parsing, date arithmetic, relative time
- `src/lib/unitDefinitions.ts` - Unit categories + definitions shared by every unit converter, convertUnits, formatUnitValue
- `src/lib/imageMetadataUtils.ts` - Inspect/strip EXIF, XMP, ICC and comments from JPEG/PNG/WebP (no re-encode)
- `src/lib/diffUtils.ts` - Text diff: Myers line diff, word/char intra-line highlights, moved-block detection, split/unified rows, unchanged-line collapsing, unified patch output
- `src/lib/syntaxHighlightUtils.ts` - Lazy-loaded lowlight highlighter: per-line syntax tokens with theme-agnostic kinds, language detection / file-extension mapping, merging tokens with diff segments
- `src/lib/recipeUtils/` - Recipe DSL: parseRecipe, layoutRecipe (Cooking for Engineers grid), quantities (parse/scale/convert/sum), toHtml/toMarkdown, share-link encode/decode, sample recipes
- `src/lib/toolSearch.ts` - Tool search: `searchTools` (ranked: name > keyword > description) and `filterToolsByQuery` (order-preserving) used by the sidebar, favorites and landing terminal
- `src/lib/seoUtils.ts` - Pure SEO builders: page/tool metadata, WebSite + WebApplication JSON-LD, llms.txt, absoluteUrl. Site constants and `toolMetadata(id)` live in `src/config/seo.ts`
- `src/lib/construction/imperialUtils.ts` - Area helpers (`formatArea`, `squareInchesToArea`, `areaToSquareInches`, `AREA_UNIT` per unit mode); feet/inch/fraction parsing (`10' 3 1/2"`, `120 3/4`, `3-1/2`, mm) to inches, formatting at 1/8–1/64 or decimal or mm, fraction reduce/carry, nominal→actual lumber table. All construction libs work in inches
- `src/lib/construction/spacingUtils.ts` - Equal/exact spacing engine (end members none/one/both, adjust last or both ends) returning near/center/far positions for mark-out lists
- `src/lib/construction/pitchUtils.ts` - Rise/run/pitch/angle/grade conversions, slope solver, right-triangle solver from any two knowns, angle/pitch/grade formatting, rafter multiplier and the 1:12 to 24:12 pitch table
- `src/lib/construction/shareUtils.ts` - Calculation state ⇄ URL hash token (deflate + base64url) and share URL builder
- `src/lib/construction/lumberUtils.ts` - Board feet, cubic feet, linear ⇄ square coverage (gap + waste), linear ⇄ cubic, price per 1000 bft to per piece / per foot, log volume, deck board sizes
- `src/lib/construction/geometryUtils.ts` - Layout geometry: rectangle diagonal, string-line correction from two reference stakes (`squareUp`), regular polygons from sides and radius (`regularPolygon`), circles from any one value (`solveCircle`), chords and arcs from any two of radius, chord, height, arc length, angle (`solveArc`)
- `src/lib/construction/framingUtils.ts` - Wall framing: stud layout from a wall end with end assemblies (single, double, gap, California, orthogonal), sheet joints checked for backing, rake heights (`studLayout`); studs, plates, noggings, board feet and cost for a job (`framingQuantities`)
- `src/lib/construction/gableUtils.ts` - Gable studs: long and short point lengths under a raked plate for a full gable or one slope, common difference, plate plumb allowance, peak height, board feet (`gableStuds`), rake angle from two heights (`gableAngleFromHeights`), level positions along the rake (`alongRake`)
- `src/lib/construction/roofShapesUtils.ts` - Skillion (one slope, angle from two wall heights), gambrel (break by run or rise, break angle and miter, break and ridge heights) and saltbox (ridge by offset or equal walls, rear wall change) roofs, each side solved with `commonRafter`, with areas (`skillion`, `skillionAngleFromWalls`, `gambrel`, `saltbox`)
- `src/lib/construction/hipRoofUtils.ts` - Equal-pitch hip roof: commons and hips via `commonRafter` with ridge and hip shortening, hip angle and pitch per 17, hip drop or backing bevel, hip and jack cheek angles, jacks with diminish and cut lengths, ridge and cap lengths, rafter positions, face areas, sheathing, lumber list with board feet and cost (`hipRoof`)
- `src/lib/construction/deckBoardUtils.ts` - Deck boards: rows across a deck under the tile fit rules (adjust gap, rip last, rip both, whole boards) with a picture-frame border, joints broken over joists with half or third stagger, screws, boards to buy with offcut pairing, waste (`deckBoards`, `rowJoints`, `BOARD_LAYOUTS`)
- `src/lib/construction/deckUtils.ts` - Deck framing: bearers across the width, stumps along each bearer and joists along the length via the exact spacing engine, stump lengths from height and ground fall, boards via `deckBoards`, fascia, fasteners, material list with board feet and cost (`deck`)
- `src/lib/construction/fenceUtils.ts` - Fences: post and rail with palings run across the posts, rails, post hole concrete and cost (`postAndRail`), post and panel with whole panels and a cut panel at one or both ends (`postAndPanel`), arched or scalloped paling tops from the arc solver with a cutting list (`archedPalings`), glass balustrade panels on spigots or posts (`glassBalustrade`)
- `src/lib/construction/masonryUtils.ts` - Brickwork: courses to a height or height of courses with the bed joint adjusted within a range, course heights, openings snapped to courses (`gauge`); bricks along a wall in stretcher, header, English, Flemish or stack bond with perps adjusted or ends cut, per-course layouts, totals with waste, bricks per area, mortar, cost (`bond`); standard brick and block sizes (`MASONRY_UNITS`)
- `src/lib/construction/blockUtils.ts` - Concrete block walls: courses via `gauge`, blocks per course and total less openings plus waste, half blocks at corners and ends, mortar by bag yield, core fill grout and bags, vertical rebar bars, weight and cost (`blockWall`), common block sizes with core fill (`BLOCK_SIZES`)
- `src/lib/construction/rebarUtils.ts` - Rebar layouts: bars along one direction spread across the other from the cover by spacing or count, splices and laps against a stock length (`rebarRun`); slab grid or footing cage with ties and hooks, totals with waste, stock bars, weight in lb and kg, cost by bar or pound, chairs (`rebarGrid`); metric N10 to N36 sizes (`METRIC_REBAR_SIZES`, `ALL_REBAR_SIZES`)
- `src/lib/construction/stairUtils.ts` - Straight stairs: risers and treads from total rise and ideal rise with possible-rise options, run from ideal run, total run or angle, top tread down or level, stringer step and length, notched throat, bottom drop, 2R+T, headroom from the floor opening, tread heights with landing candidates, concrete waist volume (`solveStair`, `possibleRises`, `stringerRunningPoints`)
- `src/lib/construction/rafterUtils.ts` - Common rafters: line, tail and overall lengths, plumb and seat cuts, birdsmouth seat or plumb driven with heel, HAP, depth check and warnings, ridge height and tail drop (`commonRafter`), run from building width (`runFromSpan`), whole gable roof with ridge shortening, rafter layout per side, ridge and fascia lengths, slope length, area, sheathing sheets and rafter lumber cost (`gableRoof`)
- `src/lib/construction/concreteUtils.ts` - Concrete: cubic inch to ft³/yd³/m³, cylinder and box volumes, premix bags from bag weight at 133.3 lb/ft³, slab outline from direction segments with closing segment, area and perimeter (`outlineFromSegments`, `closingSegment`), slab plus edge and internal beam volumes (`slabVolumes`), rebar sizes #3 to #18 with lengths, weight and cost (`rebar`), mesh sheets
- `src/lib/construction/tileUtils.ts` - Tiling: one row of tiles fitted to a width under seven cut rules (`tileFit`, `TILE_FIT_MODES`), tiles across and down with waste, boxes and cost (`tileCount`, `tilesAlong`), count from an area (`simpleTileCount`)
- `src/lib/construction/miterUtils.ts` - Miter joints: cut angles between two widths at any corner (`miterJoint`), compound miter and bevel saw settings plus the developed piece for sloped multi-sided forms (`compoundMiter`, `compoundFaceOutline`)
- `src/lib/construction/balusterUtils.ts` - Baluster layouts: fewest balusters under a code gap on level or raked rails (`balusterRun`), end gaps that match a gap across unequal panels (`panelGap`), tread-by-tread stair positions (`stairBalusters`)
- `src/lib/construction/fractionUtils.ts` - Inch fraction tables (eighths to sixty-fourths), fraction/decimal/mm label formatting with pad and leading-zero rules, free-form inch expression evaluator (+ − × ÷ with mixed numbers and marks)
- `src/hooks/useIsMobile.ts` - SSR-safe mobile detection
- `src/hooks/useConstructionUnits.ts` - Site-wide unit mode (Feet-Inch / Inch / Metric) and fraction precision with bound parse/format, persisted in user preferences
- `src/hooks/useClipboard.ts` - Clipboard operations with feedback
- `src/components/SegmentedControl` - Joined radio-button group for mode/tab switches
- `src/components/UnitConverterPanel` - Live "edit any row, all rows update" unit list driven by `unitDefinitions`
- `src/components/construction` - Construction tool kit: `UnitAndPrecisionBar`, `DimensionInput` (ft-in-fraction field with optional slider), `RunningList` (mark-out table with step-through mode), `LumberTable`, `Diagram` SVG primitives in mm (`Member`, `DimLine`, `AngleArc`, `Label`) that print at true scale (`interactive` exposes a drawing with buttons as a group), `PrintDiagrams`, `ShareCalculation`, `NumberField` (count / money / percent field with prefix and unit), `ResultList` (label-value output card), `ConstructionNotes` (actual-size and geometry-only notes), `SpacingDiagram` (numbered member layout over a run with centers, gap and end-space dimensions), `RoofSectionDiagram` (cross section from rafter bottom edges, walls, dims, arcs and centre lines in inches, scaled to fit), `StairBalusterDiagram` (treads with balusters, side view). Demo at `/styleguide/construction`

**Do not reinvent the wheel.** If a utility exists, use it. If a utility is close but not quite right, extend it rather than duplicating logic elsewhere.

**All pure, reusable utility functions MUST live in `src/lib/`.** Never define reusable logic inside feature component files. Tool-specific helpers that are only used by one tool can stay colocated.

When creating new utilities:

- Add them to the appropriate location (`src/lib/` for pure functions, `src/hooks/` for React hooks)
- Ensure they're exported and discoverable
- Update this list so future contributors know what's available

---

## Package Manager

**Always use `pnpm`** — never `npm` or `yarn`.

- Install: `pnpm install` / `pnpm add <package>`
- Build: `pnpm run build`
- Dev: `pnpm run dev`
