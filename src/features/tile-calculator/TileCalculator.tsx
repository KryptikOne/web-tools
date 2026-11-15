"use client";

import { useMemo, useState } from "react";
import SegmentedControl from "@/components/SegmentedControl";
import { UnitAndPrecisionBar, DimensionInput, NumberField, ResultList, RunningList, PrintDiagrams, LumberTable, ShareCalculation, ConstructionNotes } from "@/components/construction";
import type { ResultRow, MemberRole } from "@/components/construction";
import { useConstructionUnits } from "@/hooks/useConstructionUnits";
import { AREA_UNIT, areaToSquareInches, formatArea, squareInchesToArea } from "@/lib/construction/imperialUtils";
import { tileFit, tileCount, simpleTileCount, TILE_FIT_MODES, type TileFitMode } from "@/lib/construction/tileUtils";
import { TileRowDiagram, TileGridDiagram } from "./TileDiagrams";
import styles from "./TileCalculator.module.scss";

type Section = "fit" | "quantity" | "simple";
type Color = Extract<MemberRole, "common" | "ridge" | "jack">;

interface TileState {
	section: Section;
	// fit
	floorWidth: number | null;
	tileWidth: number | null;
	joint: number | null;
	mode: TileFitMode;
	firstTileEnd: number | null;
	rows: number;
	color: Color;
	// quantity
	areaWidth: number | null;
	areaLength: number | null;
	qTileWidth: number | null;
	qTileLength: number | null;
	qJoint: number | null;
	waste: number;
	tilesPerBox: number;
	costPerTile: number;
	// simple
	areaSquareInches: number | null;
	sTileWidth: number | null;
	sTileLength: number | null;
	sWaste: number;
	sTilesPerBox: number;
	sCostPerTile: number;
}

const DEFAULTS: TileState = {
	section: "fit",
	floorWidth: 100,
	tileWidth: 12,
	joint: 0.25,
	mode: "cut-both",
	firstTileEnd: 8,
	rows: 2,
	color: "common",
	areaWidth: 120,
	areaLength: 96,
	qTileWidth: 12,
	qTileLength: 12,
	qJoint: 0.25,
	waste: 10,
	tilesPerBox: 10,
	costPerTile: 2.5,
	areaSquareInches: 14400,
	sTileWidth: 12,
	sTileLength: 12,
	sWaste: 10,
	sTilesPerBox: 10,
	sCostPerTile: 2.5,
};

const SECTIONS: { value: Section; label: string }[] = [
	{ value: "fit", label: "Fit and joints" },
	{ value: "quantity", label: "Quantity" },
	{ value: "simple", label: "By area" },
];
const COLORS: { value: Color; label: string }[] = [
	{ value: "common", label: "Green" },
	{ value: "ridge", label: "Violet" },
	{ value: "jack", label: "Blue" },
];
const MODE_VALUES = TILE_FIT_MODES.map((m) => m.value);

const num = (v: unknown, lo: number, hi: number, fallback: number | null): number | null => (typeof v === "number" && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : fallback);
const oneOf = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T => (allowed.includes(v as T) ? (v as T) : fallback);
const money = (n: number) => `$${n.toFixed(2)}`;

function sanitize(s: Partial<TileState>): TileState {
	const len = (v: unknown, fb: number | null) => num(v, 0.01, 1e5, fb);
	const pct = (v: unknown, fb: number) => num(v, 0, 100, fb) ?? fb;
	const count = (v: unknown, fb: number) => Math.round(num(v, 0, 1e4, fb) ?? fb);
	const price = (v: unknown, fb: number) => num(v, 0, 1e6, fb) ?? fb;
	return {
		section: oneOf(s.section, ["fit", "quantity", "simple"] as const, DEFAULTS.section),
		floorWidth: len(s.floorWidth, DEFAULTS.floorWidth),
		tileWidth: len(s.tileWidth, DEFAULTS.tileWidth),
		joint: num(s.joint, 0, 100, DEFAULTS.joint),
		mode: oneOf(s.mode, MODE_VALUES, DEFAULTS.mode),
		firstTileEnd: len(s.firstTileEnd, DEFAULTS.firstTileEnd),
		rows: Math.round(num(s.rows, 1, 4, DEFAULTS.rows) ?? DEFAULTS.rows),
		color: oneOf(s.color, ["common", "ridge", "jack"] as const, DEFAULTS.color),
		areaWidth: len(s.areaWidth, DEFAULTS.areaWidth),
		areaLength: len(s.areaLength, DEFAULTS.areaLength),
		qTileWidth: len(s.qTileWidth, DEFAULTS.qTileWidth),
		qTileLength: len(s.qTileLength, DEFAULTS.qTileLength),
		qJoint: num(s.qJoint, 0, 100, DEFAULTS.qJoint),
		waste: pct(s.waste, DEFAULTS.waste),
		tilesPerBox: count(s.tilesPerBox, DEFAULTS.tilesPerBox),
		costPerTile: price(s.costPerTile, DEFAULTS.costPerTile),
		areaSquareInches: num(s.areaSquareInches, 1, 1e10, DEFAULTS.areaSquareInches),
		sTileWidth: len(s.sTileWidth, DEFAULTS.sTileWidth),
		sTileLength: len(s.sTileLength, DEFAULTS.sTileLength),
		sWaste: pct(s.sWaste, DEFAULTS.sWaste),
		sTilesPerBox: count(s.sTilesPerBox, DEFAULTS.sTilesPerBox),
		sCostPerTile: price(s.sCostPerTile, DEFAULTS.sCostPerTile),
	};
}

export default function TileCalculator() {
	const { format, mode: unitMode } = useConstructionUnits();
	const [state, setState] = useState<TileState>(DEFAULTS);
	const set = <K extends keyof TileState>(key: K) => (value: TileState[K]) => setState((s) => ({ ...s, [key]: value }));

	// ── fit
	const fit = useMemo(
		() => (state.floorWidth === null || state.tileWidth === null || state.joint === null ? null : tileFit({ width: state.floorWidth, tile: state.tileWidth, joint: state.joint, mode: state.mode, firstTileEnd: state.firstTileEnd ?? undefined })),
		[state.floorWidth, state.tileWidth, state.joint, state.mode, state.firstTileEnd],
	);
	const fitRows: ResultRow[] = fit
		? [
				{ label: "Tiles across", value: `${fit.count}`, strong: true, hint: `${fit.fullTiles} whole, ${fit.count - fit.fullTiles} cut` },
				{ label: "First tile", value: format(fit.firstWidth), strong: fit.tiles[0].cut },
				{ label: "Last tile", value: format(fit.lastWidth), strong: fit.tiles[fit.count - 1].cut },
				{ label: "Gap at start wall", value: format(fit.startGap) },
				{ label: "Gap at end wall", value: format(fit.endGap) },
				{ label: "Joint", value: format(fit.joint), hint: state.mode === "fit-evenly" ? "adjusted so whole tiles fit" : "" },
			]
		: [];

	// ── quantity
	const count = useMemo(
		() =>
			state.areaWidth === null || state.areaLength === null || state.qTileWidth === null || state.qTileLength === null || state.qJoint === null
				? null
				: tileCount({ areaWidth: state.areaWidth, areaLength: state.areaLength, tileWidth: state.qTileWidth, tileLength: state.qTileLength, joint: state.qJoint, wastePercent: state.waste, tilesPerBox: state.tilesPerBox, costPerTile: state.costPerTile }),
		[state.areaWidth, state.areaLength, state.qTileWidth, state.qTileLength, state.qJoint, state.waste, state.tilesPerBox, state.costPerTile],
	);
	const countRows: ResultRow[] = count
		? [
				{ label: "Tiles", value: `${count.across} × ${count.down} = ${count.tiles}`, strong: true, hint: `${count.cutAcross ? "cut column at the far side" : "no cut column"}, ${count.cutDown ? "cut row at the bottom" : "no cut row"}` },
				{ label: "With waste", value: `${count.tilesWithWaste}`, hint: `${state.waste}% added` },
				{ label: "Boxes", value: state.tilesPerBox > 0 ? `${count.boxes}` : "—", strong: true, hint: state.tilesPerBox > 0 ? `${count.tilesToBuy} tiles` : "enter tiles per box" },
				{ label: "Cost", value: money(count.cost), strong: true },
				{ label: "Area", value: formatArea(count.coverageSquareInches, unitMode) },
			]
		: [];

	// ── simple
	const simple = useMemo(
		() => (state.areaSquareInches === null || state.sTileWidth === null || state.sTileLength === null ? null : simpleTileCount({ areaSquareInches: state.areaSquareInches, tileWidth: state.sTileWidth, tileLength: state.sTileLength, wastePercent: state.sWaste, tilesPerBox: state.sTilesPerBox, costPerTile: state.sCostPerTile })),
		[state.areaSquareInches, state.sTileWidth, state.sTileLength, state.sWaste, state.sTilesPerBox, state.sCostPerTile],
	);
	const simpleRows: ResultRow[] = simple
		? [
				{ label: "Tiles to cover", value: `${simple.tiles}`, hint: "area divided by one tile, no joints" },
				{ label: "With waste", value: `${simple.tilesWithWaste}`, strong: true, hint: `${state.sWaste}% added` },
				{ label: "Boxes", value: state.sTilesPerBox > 0 ? `${simple.boxes}` : "—", strong: true, hint: state.sTilesPerBox > 0 ? `${simple.tilesToBuy} tiles` : "enter tiles per box" },
				{ label: "Cost", value: money(simple.cost), strong: true },
			]
		: [];

	const areaValue = (sqIn: number | null) => (sqIn === null ? 0 : Number(squareInchesToArea(sqIn, unitMode).toFixed(3)));

	return (
		<div className={styles.container}>
			<div className="flex flex-col gap-6">
				<UnitAndPrecisionBar />
				<div className="flex flex-col gap-1">
					<span className={styles.label}>Section</span>
					<SegmentedControl<Section> label="Section" value={state.section} onChange={set("section")} options={SECTIONS} />
				</div>

				{state.section === "fit" && (
					<>
						<div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
							<section className={styles.card} aria-labelledby="tile-fit-heading">
								<h2 id="tile-fit-heading" className={styles.cardTitle}>
									Tile fit, spacing and cuts
								</h2>
								<p className={styles.note}>One row across the floor or wall: how many tiles, where the cuts fall and how wide they are, under the layout rule you choose.</p>
								<div className="flex flex-col gap-4">
									<DimensionInput id="tile-floor" label="Floor or wall width" value={state.floorWidth} onChange={set("floorWidth")} min={12} max={600} step={0.5} />
									<div className="grid grid-cols-2 gap-3">
										<DimensionInput id="tile-width" label="Tile width" value={state.tileWidth} onChange={set("tileWidth")} />
										<DimensionInput id="tile-joint" label="Joint width" value={state.joint} onChange={set("joint")} hint={`1/4" is usual`} />
									</div>
									<div className="flex flex-col gap-1">
										<label htmlFor="tile-mode" className={styles.label}>
											Layout
										</label>
										<select id="tile-mode" className={styles.select} value={state.mode} onChange={(e) => set("mode")(e.target.value as TileFitMode)}>
											{TILE_FIT_MODES.map((m) => (
												<option key={m.value} value={m.value}>
													{m.label}
												</option>
											))}
										</select>
										<span className={styles.hint}>{TILE_FIT_MODES.find((m) => m.value === state.mode)?.hint}</span>
									</div>
									{state.mode === "cut-first-at" && <DimensionInput id="tile-first-end" label="First tile ends at" value={state.firstTileEnd} onChange={set("firstTileEnd")} hint="From the start wall to the first joint" />}
									<div className="flex flex-wrap items-end gap-x-6 gap-y-3">
										<NumberField id="tile-rows" label="Rows to draw" value={state.rows} onChange={(v) => set("rows")(Math.max(1, Math.min(4, Math.round(v))))} min={1} max={4} step={1} className="w-32" />
										<div className="flex flex-col gap-1">
											<span className={styles.label}>Color</span>
											<SegmentedControl<Color> label="Color" size="sm" fill={false} value={state.color} onChange={set("color")} options={COLORS} />
										</div>
									</div>
								</div>
							</section>
							<section className={styles.card} aria-labelledby="tile-fit-results">
								<h2 id="tile-fit-results" className={styles.cardTitle}>
									Fit
								</h2>
								{fit ? <ResultList rows={fitRows} /> : <p className={styles.empty}>Enter a width, a tile narrower than it and a joint.</p>}
								{fit?.warnings.map((w) => (
									<p key={w} className={styles.warn}>
										{w}
									</p>
								))}
								<p className={`${styles.warn} mt-3`}>Verify on site: walls are rarely straight or square. Dry-lay the first row and check the last cut before spreading adhesive.</p>
							</section>
						</div>
						{fit && state.floorWidth !== null && (
							<>
								<section className={styles.card} aria-labelledby="tile-row-diagram">
									<h2 id="tile-row-diagram" className={styles.cardTitle}>
										Row layout
									</h2>
									<PrintDiagrams title="Tile layout" subtitle={`${fit.count} tiles across ${format(state.floorWidth)}, ${TILE_FIT_MODES.find((m) => m.value === state.mode)?.label.toLowerCase()}, drawn to fit`}>
										<TileRowDiagram fit={fit} width={state.floorWidth} role={state.color} rows={state.rows} format={format} />
									</PrintDiagrams>
									<p className={styles.legend}>
										<span className={styles.full}>Whole tiles</span>
										<span className={styles.cut}>Cut tiles</span>
									</p>
								</section>
								<RunningList title="Tile mark-out" positions={fit.tiles.map((t) => t.far)} labelFor={(i) => (fit.tiles[i].cut ? `Tile ${i + 1}, cut ${format(fit.tiles[i].width)}` : `Tile ${i + 1}`)} />
								<p className={styles.note}>Running points are to the far side of each tile, measured from the start wall. Use Highlight every to mark every Nth tile and Only highlighted to list just those.</p>
							</>
						)}
					</>
				)}

				{state.section === "quantity" && (
					<>
						<div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
							<section className={styles.card} aria-labelledby="tile-qty-heading">
								<h2 id="tile-qty-heading" className={styles.cardTitle}>
									Quantity and cost
								</h2>
								<p className={styles.note}>Tiles across and down from the room size, then waste, boxes and cost.</p>
								<div className="flex flex-col gap-4">
									<div className="grid grid-cols-2 gap-3">
										<DimensionInput id="tile-area-w" label="Width across" value={state.areaWidth} onChange={set("areaWidth")} />
										<DimensionInput id="tile-area-l" label="Length down" value={state.areaLength} onChange={set("areaLength")} />
									</div>
									<div className="grid grid-cols-3 gap-3">
										<DimensionInput id="tile-q-w" label="Tile width" value={state.qTileWidth} onChange={set("qTileWidth")} />
										<DimensionInput id="tile-q-l" label="Tile length" value={state.qTileLength} onChange={set("qTileLength")} />
										<DimensionInput id="tile-q-joint" label="Joint" value={state.qJoint} onChange={set("qJoint")} />
									</div>
									<div className="grid grid-cols-3 gap-3">
										<NumberField id="tile-waste" label="Waste" value={state.waste} onChange={set("waste")} unit="%" step="any" />
										<NumberField id="tile-box" label="Tiles per box" value={state.tilesPerBox} onChange={(v) => set("tilesPerBox")(Math.max(0, Math.round(v)))} step={1} />
										<NumberField id="tile-cost" label="Cost per tile" value={state.costPerTile} onChange={set("costPerTile")} prefix="$" step="any" />
									</div>
								</div>
								<ul className={styles.rules}>
									<li>A whole tile starts in the top-left corner; there is no joint against the walls.</li>
									<li>Cut tiles along the far edges count as whole tiles.</li>
									<li>A strip narrower than the joint is not counted.</li>
								</ul>
							</section>
							<section className={styles.card} aria-labelledby="tile-qty-results">
								<h2 id="tile-qty-results" className={styles.cardTitle}>
									Order
								</h2>
								{count ? <ResultList rows={countRows} /> : <p className={styles.empty}>Enter the room and tile sizes.</p>}
							</section>
						</div>
						{count && state.areaWidth !== null && state.areaLength !== null && state.qTileWidth !== null && state.qTileLength !== null && state.qJoint !== null && (
							<section className={styles.card} aria-labelledby="tile-grid-diagram">
								<h2 id="tile-grid-diagram" className={styles.cardTitle}>
									Layout
								</h2>
								<PrintDiagrams title="Tile quantity" subtitle={`${count.across} × ${count.down} tiles over ${format(state.areaWidth)} × ${format(state.areaLength)}, drawn to fit`}>
									<TileGridDiagram count={count} areaWidth={state.areaWidth} areaLength={state.areaLength} tileWidth={state.qTileWidth} tileLength={state.qTileLength} joint={state.qJoint} role="common" format={format} />
								</PrintDiagrams>
								<p className={styles.legend}>
									<span className={styles.full}>Whole tiles</span>
									<span className={styles.cut}>Cut tiles</span>
								</p>
							</section>
						)}
					</>
				)}

				{state.section === "simple" && (
					<div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
						<section className={styles.card} aria-labelledby="tile-simple-heading">
							<h2 id="tile-simple-heading" className={styles.cardTitle}>
								Quantity from an area
							</h2>
							<p className={styles.note}>For odd-shaped rooms: total area divided by one tile, plus waste. Joints are ignored, which errs on the side of a few spare tiles.</p>
							<div className="flex flex-col gap-4">
								<NumberField id="tile-area" label="Area to tile" value={areaValue(state.areaSquareInches)} onChange={(v) => set("areaSquareInches")(areaToSquareInches(v, unitMode))} unit={AREA_UNIT[unitMode]} step="any" />
								<div className="grid grid-cols-2 gap-3">
									<DimensionInput id="tile-s-w" label="Tile width" value={state.sTileWidth} onChange={set("sTileWidth")} />
									<DimensionInput id="tile-s-l" label="Tile length" value={state.sTileLength} onChange={set("sTileLength")} />
								</div>
								<div className="grid grid-cols-3 gap-3">
									<NumberField id="tile-s-waste" label="Waste" value={state.sWaste} onChange={set("sWaste")} unit="%" step="any" />
									<NumberField id="tile-s-box" label="Tiles per box" value={state.sTilesPerBox} onChange={(v) => set("sTilesPerBox")(Math.max(0, Math.round(v)))} step={1} />
									<NumberField id="tile-s-cost" label="Cost per tile" value={state.sCostPerTile} onChange={set("sCostPerTile")} prefix="$" step="any" />
								</div>
							</div>
						</section>
						<section className={styles.card} aria-labelledby="tile-simple-results">
							<h2 id="tile-simple-results" className={styles.cardTitle}>
								Order
							</h2>
							{simple ? <ResultList rows={simpleRows} /> : <p className={styles.empty}>Enter an area and a tile size.</p>}
						</section>
					</div>
				)}

				<div className="grid gap-4 lg:grid-cols-2">
					<LumberTable />
					<div className="flex flex-col gap-4">
						<ShareCalculation state={state} onLoad={(s) => setState(sanitize(s))} />
						<ConstructionNotes />
					</div>
				</div>
			</div>
		</div>
	);
}
