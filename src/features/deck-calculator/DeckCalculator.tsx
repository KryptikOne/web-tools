"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import SegmentedControl from "@/components/SegmentedControl";
import { UnitAndPrecisionBar, DimensionInput, NumberField, ResultList, RunningList, PrintDiagrams, LumberTable, ShareCalculation, ConstructionNotes } from "@/components/construction";
import type { ResultRow } from "@/components/construction";
import { useConstructionUnits } from "@/hooks/useConstructionUnits";
import { nominalToActual, formatArea } from "@/lib/construction/imperialUtils";
import { ALL_LUMBER_SIZES, sectionOf } from "@/lib/construction/lumberUtils";
import { BOARD_LAYOUTS, type BoardLayout, type Stagger } from "@/lib/construction/deckBoardUtils";
import { deck } from "@/lib/construction/deckUtils";
import type { MarkReference } from "@/lib/construction/spacingUtils";
import DeckBoardDiagram from "@/features/deck-boards/DeckBoardDiagram";
import { DeckPlanDiagram, DeckElevationDiagram } from "./DeckDiagrams";
import styles from "./DeckCalculator.module.scss";

type FrameSize = "2x6" | "2x8" | "2x10" | "2x12";
type StumpSize = "4x4" | "6x6";

interface DeckState {
	length: number | null;
	width: number | null;
	height: number | null;
	fall: number | null;
	stumpSize: StumpSize;
	stumpCenters: number | null;
	bearerSize: FrameSize;
	bearerCenters: number | null;
	joistSize: FrameSize;
	joistCenters: number;
	boardSize: string;
	boardWidth: number | null;
	boardThickness: number | null;
	gap: number | null;
	boardLayout: BoardLayout;
	boardLength: number | null;
	stagger: Stagger;
	boardsAcross: boolean;
	fascia: boolean;
	costPer1000Bft: number;
	boardPricePerFoot: number;
	reference: MarkReference;
}

const DEFAULTS: DeckState = {
	length: 240,
	width: 144,
	height: 36,
	fall: 6,
	stumpSize: "4x4",
	stumpCenters: 72,
	bearerSize: "2x8",
	bearerCenters: 72,
	joistSize: "2x8",
	joistCenters: 16,
	boardSize: "5/4x6",
	boardWidth: 5.5,
	boardThickness: 1,
	gap: 0.25,
	boardLayout: "rip-last",
	boardLength: 192,
	stagger: "half",
	boardsAcross: false,
	fascia: true,
	costPer1000Bft: 800,
	boardPricePerFoot: 1.5,
	reference: "near",
};

const FRAME_SIZES: { value: FrameSize; label: string }[] = [
	{ value: "2x6", label: "2x6" },
	{ value: "2x8", label: "2x8" },
	{ value: "2x10", label: "2x10" },
	{ value: "2x12", label: "2x12" },
];
const FRAME_VALUES = FRAME_SIZES.map((s) => s.value);
const STUMP_SIZES: { value: StumpSize; label: string }[] = [
	{ value: "4x4", label: "4x4" },
	{ value: "6x6", label: "6x6" },
];
const BOARD_SIZES = ["5/4x6", "6/4x6", "2x6", "2x4"];
const CENTERS = [12, 16, 19.2, 24];
const CENTER_OPTIONS = CENTERS.map((c) => ({ value: `${c}`, label: `${c}"` }));
const LAYOUT_VALUES = BOARD_LAYOUTS.map((l) => l.value);

const num = (v: unknown, lo: number, hi: number, fallback: number | null): number | null => (typeof v === "number" && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : fallback);
const oneOf = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T => (allowed.includes(v as T) ? (v as T) : fallback);

function sanitize(s: Partial<DeckState>): DeckState {
	return {
		length: num(s.length, 12, 1e4, DEFAULTS.length),
		width: num(s.width, 12, 1e4, DEFAULTS.width),
		height: num(s.height, 1, 1000, DEFAULTS.height),
		fall: num(s.fall, 0, 500, DEFAULTS.fall),
		stumpSize: oneOf(s.stumpSize, ["4x4", "6x6"] as const, DEFAULTS.stumpSize),
		stumpCenters: num(s.stumpCenters, 12, 500, DEFAULTS.stumpCenters),
		bearerSize: oneOf(s.bearerSize, FRAME_VALUES, DEFAULTS.bearerSize),
		bearerCenters: num(s.bearerCenters, 12, 500, DEFAULTS.bearerCenters),
		joistSize: oneOf(s.joistSize, FRAME_VALUES, DEFAULTS.joistSize),
		joistCenters: CENTERS.includes(s.joistCenters as number) ? (s.joistCenters as number) : DEFAULTS.joistCenters,
		boardSize: typeof s.boardSize === "string" && [...BOARD_SIZES, "custom"].includes(s.boardSize) ? s.boardSize : DEFAULTS.boardSize,
		boardWidth: num(s.boardWidth, 1, 100, DEFAULTS.boardWidth),
		boardThickness: num(s.boardThickness, 0, 10, DEFAULTS.boardThickness),
		gap: num(s.gap, 0, 10, DEFAULTS.gap),
		boardLayout: oneOf(s.boardLayout, LAYOUT_VALUES, DEFAULTS.boardLayout),
		boardLength: num(s.boardLength, 12, 1000, DEFAULTS.boardLength),
		stagger: oneOf(s.stagger, ["none", "half", "third"] as const, DEFAULTS.stagger),
		boardsAcross: typeof s.boardsAcross === "boolean" ? s.boardsAcross : DEFAULTS.boardsAcross,
		fascia: typeof s.fascia === "boolean" ? s.fascia : DEFAULTS.fascia,
		costPer1000Bft: num(s.costPer1000Bft, 0, 1e6, DEFAULTS.costPer1000Bft) ?? DEFAULTS.costPer1000Bft,
		boardPricePerFoot: num(s.boardPricePerFoot, 0, 1e4, DEFAULTS.boardPricePerFoot) ?? DEFAULTS.boardPricePerFoot,
		reference: oneOf(s.reference, ["near", "center", "far"] as const, DEFAULTS.reference),
	};
}

export default function DeckCalculator() {
	const { format, mode } = useConstructionUnits();
	const [state, setState] = useState<DeckState>(DEFAULTS);
	const set = <K extends keyof DeckState>(key: K) => (value: DeckState[K]) => setState((s) => ({ ...s, [key]: value }));
	const bearer = sectionOf(nominalToActual(state.bearerSize)!);
	const joist = sectionOf(nominalToActual(state.joistSize)!);
	const stump = nominalToActual(state.stumpSize)!.width;
	const pickBoard = (v: string) => {
		const size = ALL_LUMBER_SIZES.find((s) => s.nominal === v);
		setState((s) => ({ ...s, boardSize: v, ...(size ? { boardWidth: size.depth, boardThickness: size.width } : {}) }));
	};

	const result = useMemo(() => {
		const s = state;
		if (s.length === null || s.width === null || s.height === null || s.fall === null || s.stumpCenters === null || s.bearerCenters === null || s.boardWidth === null || s.boardThickness === null || s.gap === null || s.boardLength === null) return null;
		return deck({
			length: s.length,
			width: s.width,
			height: s.height,
			fall: s.fall,
			stumpSize: stump,
			stumpCenters: s.stumpCenters,
			bearer,
			bearerCenters: s.bearerCenters,
			joist,
			joistCenters: s.joistCenters,
			boardWidth: s.boardWidth,
			boardThickness: s.boardThickness,
			gap: s.gap,
			boardLayout: s.boardLayout,
			boardLength: s.boardLength,
			stagger: s.stagger,
			boardsAcross: s.boardsAcross,
			fascia: s.fascia,
			costPer1000Bft: s.costPer1000Bft,
			boardPricePerFoot: s.boardPricePerFoot,
		});
	}, [state, bearer, joist, stump]);

	const rows: ResultRow[] = result
		? [
				{ label: "Deck area", value: formatArea(result.area, mode), strong: true },
				{ label: "Stumps", value: `${result.stumpCount}`, strong: true, hint: `${result.bearerCount} bearers × ${result.stumpsAlong.count} along each; ${format(result.stumps[0]?.length ?? 0)} to ${format(result.stumps[result.stumps.length - 1]?.length ?? 0)} long` },
				{ label: "Bearers", value: `${result.bearerCount} × ${format(state.length ?? 0)}`, hint: `${state.bearerSize} at ${format(state.bearerCenters ?? 0)} centers across the width` },
				{ label: "Joists", value: `${result.joistCount} × ${format(state.width ?? 0)}`, hint: `${state.joistSize} at ${state.joistCenters}" centers along the length` },
				{ label: "Boards", value: `${result.boards.count} rows`, hint: `${result.boards.stockBoards} boards of ${format(state.boardLength ?? 0)} to buy, ${result.boards.wastePercent.toFixed(1)}% offcut` },
				...(state.fascia ? [{ label: "Fascia", value: format(result.fasciaLength), hint: `${state.joistSize}, all round` }] : []),
				{ label: "Fasteners", value: `${result.screws} screws`, hint: `${result.stumpBolts} stump bolts, ${result.joistFixings} joist fixings` },
				{ label: "Lumber", value: `${result.totalBoardFeet.toFixed(1)} bft`, hint: `framing at $${state.costPer1000Bft} per 1000 bft, boards at $${state.boardPricePerFoot.toFixed(2)} per ft` },
				{ label: "Total cost", value: `$${result.totalCost.toFixed(2)}`, strong: true },
			]
		: [];

	const pick = (m: { near: number; center: number; far: number }) => (state.reference === "near" ? m.near : state.reference === "far" ? m.far : m.center);

	return (
		<div className={styles.container}>
			<div className="flex flex-col gap-6">
				<UnitAndPrecisionBar />

				<div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
					<section className={styles.card} aria-labelledby="dk-heading">
						<h2 id="dk-heading" className={styles.cardTitle}>
							Deck
						</h2>
						<p className={styles.note}>
							Bearers run along the length on stumps, joists cross them along the width, boards go along the length unless turned. Ground fall is across the width. Finer board fitting is in the <Link href="/tools/deck-boards">deck board layout</Link>.
						</p>
						<div className="flex flex-col gap-4">
							<div className="grid grid-cols-2 gap-3">
								<DimensionInput id="dk-length" label="Deck length" value={state.length} onChange={set("length")} hint="Along the bearers" />
								<DimensionInput id="dk-width" label="Deck width" value={state.width} onChange={set("width")} hint="Along the joists" />
							</div>
							<div className="grid grid-cols-2 gap-3">
								<DimensionInput id="dk-height" label="Height to deck" value={state.height} onChange={set("height")} hint="Ground to top of boards, high side" />
								<DimensionInput id="dk-fall" label="Ground fall" value={state.fall} onChange={set("fall")} hint="Drop across the width" />
							</div>
							<div className="flex flex-wrap items-end gap-x-6 gap-y-3">
								<div className="flex flex-col gap-1">
									<span className={styles.label}>Stumps</span>
									<SegmentedControl<StumpSize> label="Stump size" size="sm" fill={false} value={state.stumpSize} onChange={set("stumpSize")} options={STUMP_SIZES} />
								</div>
								<DimensionInput id="dk-stump-c" label="Stump centers" value={state.stumpCenters} onChange={set("stumpCenters")} hint="Along each bearer" className="w-44" />
							</div>
							<div className="flex flex-wrap items-end gap-x-6 gap-y-3">
								<div className="flex flex-col gap-1">
									<span className={styles.label}>Bearers</span>
									<SegmentedControl<FrameSize> label="Bearer size" size="sm" fill={false} value={state.bearerSize} onChange={set("bearerSize")} options={FRAME_SIZES} />
								</div>
								<DimensionInput id="dk-bearer-c" label="Bearer centers" value={state.bearerCenters} onChange={set("bearerCenters")} hint="Joist span" className="w-44" />
							</div>
							<div className="flex flex-wrap items-end gap-x-6 gap-y-3">
								<div className="flex flex-col gap-1">
									<span className={styles.label}>Joists</span>
									<SegmentedControl<FrameSize> label="Joist size" size="sm" fill={false} value={state.joistSize} onChange={set("joistSize")} options={FRAME_SIZES} />
								</div>
								<div className="flex flex-col gap-1">
									<span className={styles.label}>Joist centers</span>
									<SegmentedControl<string> label="Joist centers" size="sm" fill={false} value={`${state.joistCenters}`} onChange={(v) => set("joistCenters")(Number(v))} options={CENTER_OPTIONS} />
								</div>
							</div>
							<div className="flex flex-col gap-1">
								<span className={styles.label}>Boards</span>
								<SegmentedControl<string> label="Board size" size="sm" value={state.boardSize} onChange={pickBoard} options={[...BOARD_SIZES.map((b) => ({ value: b, label: b })), { value: "custom", label: "Custom" }]} />
							</div>
							<div className="grid grid-cols-3 gap-3">
								<DimensionInput id="dk-board-w" label="Board width" value={state.boardWidth} onChange={(v) => setState((s) => ({ ...s, boardWidth: v, boardSize: "custom" }))} />
								<DimensionInput id="dk-board-t" label="Board thickness" value={state.boardThickness} onChange={(v) => setState((s) => ({ ...s, boardThickness: v, boardSize: "custom" }))} />
								<DimensionInput id="dk-gap" label="Gap" value={state.gap} onChange={set("gap")} />
							</div>
							<div className="grid grid-cols-2 gap-3">
								<div className="flex flex-col gap-1">
									<label htmlFor="dk-layout" className={styles.label}>
										Fit across
									</label>
									<select id="dk-layout" className={styles.select} value={state.boardLayout} onChange={(e) => set("boardLayout")(e.target.value as BoardLayout)}>
										{BOARD_LAYOUTS.map((l) => (
											<option key={l.value} value={l.value}>
												{l.label}
											</option>
										))}
									</select>
								</div>
								<DimensionInput id="dk-board-l" label="Board length" value={state.boardLength} onChange={set("boardLength")} hint="Stock" />
							</div>
							<div className="flex flex-wrap items-end gap-x-6 gap-y-3">
								<div className="flex flex-col gap-1">
									<span className={styles.label}>Stagger joints</span>
									<SegmentedControl<Stagger>
										label="Stagger joints"
										size="sm"
										fill={false}
										value={state.stagger}
										onChange={set("stagger")}
										options={[
											{ value: "none", label: "None" },
											{ value: "half", label: "Half" },
											{ value: "third", label: "Thirds" },
										]}
									/>
								</div>
								<label className={styles.check}>
									<input type="checkbox" checked={state.boardsAcross} onChange={(e) => set("boardsAcross")(e.target.checked)} />
									Boards across the width
								</label>
								<label className={styles.check}>
									<input type="checkbox" checked={state.fascia} onChange={(e) => set("fascia")(e.target.checked)} />
									Fascia all round
								</label>
							</div>
							<div className="grid grid-cols-2 gap-3">
								<NumberField id="dk-cost" label="Framing per 1000 bft" value={state.costPer1000Bft} onChange={set("costPer1000Bft")} prefix="$" step="any" />
								<NumberField id="dk-board-cost" label="Boards per foot" value={state.boardPricePerFoot} onChange={set("boardPricePerFoot")} prefix="$" step="any" />
							</div>
						</div>
					</section>

					<section className={styles.card} aria-labelledby="dk-results">
						<h2 id="dk-results" className={styles.cardTitle}>
							Quantities
						</h2>
						{result ? <ResultList rows={rows} /> : <p className={styles.empty}>Enter the deck size, height and member sizes.</p>}
						{result?.warnings.map((w) => (
							<p key={w} className={styles.warn}>
								{w}
							</p>
						))}
						{result && (
							<table className={`${styles.table} mt-4`}>
								<caption className="sr-only">Material list</caption>
								<thead>
									<tr>
										<th scope="col">Item</th>
										<th scope="col">Pieces</th>
										<th scope="col">Length</th>
										<th scope="col">Board feet</th>
										<th scope="col">Cost</th>
									</tr>
								</thead>
								<tbody>
									{result.materials.map((m) => (
										<tr key={m.item}>
											<td>{m.item}</td>
											<td className="mono">{m.pieces}</td>
											<td className="mono">{m.item === "Stumps" ? `${format(m.length)} total` : format(m.length)}</td>
											<td className="mono">{m.boardFeet.toFixed(1)}</td>
											<td className="mono">${m.cost.toFixed(2)}</td>
										</tr>
									))}
								</tbody>
							</table>
						)}
					</section>
				</div>

				{result && state.length !== null && state.width !== null && state.height !== null && state.fall !== null && state.boardThickness !== null && (
					<>
						<section className={styles.card} aria-labelledby="dk-plan">
							<h2 id="dk-plan" className={styles.cardTitle}>
								Framing plan
							</h2>
							<PrintDiagrams title="Deck framing plan" subtitle={`${format(state.length)} × ${format(state.width)}, ${result.bearerCount} bearers, ${result.joistCount} joists, ${result.stumpCount} stumps, drawn to fit`}>
								<DeckPlanDiagram deck={result} length={state.length} width={state.width} stumpSize={stump} format={format} />
							</PrintDiagrams>
							<p className={styles.note}>Bearers are B1 to B{result.bearerCount} from the high side, stumps S1 onward along each bearer, joists numbered along the length.</p>
						</section>
						<section className={styles.card} aria-labelledby="dk-elev">
							<h2 id="dk-elev" className={styles.cardTitle}>
								Elevation across the deck
							</h2>
							<PrintDiagrams title="Deck elevation" subtitle={`${format(state.height)} to the boards, ${format(state.fall)} fall across ${format(state.width)}, drawn to fit`}>
								<DeckElevationDiagram deck={result} width={state.width} height={state.height} fall={state.fall} bearerDepth={bearer.width} joistDepth={joist.width} boardThickness={state.boardThickness} stumpSize={stump} format={format} />
							</PrintDiagrams>
							<table className={`${styles.table} mt-4`}>
								<caption className="sr-only">Stump lengths by bearer</caption>
								<thead>
									<tr>
										<th scope="col">Bearer</th>
										<th scope="col">Across</th>
										<th scope="col">Stump length</th>
									</tr>
								</thead>
								<tbody>
									{result.bearers.members.map((b) => (
										<tr key={b.index}>
											<td className="mono">B{b.index}</td>
											<td className="mono">{format(b.center)}</td>
											<td className="mono">{format(result.stumps.find((s) => s.bearer === b.index)?.length ?? 0)}</td>
										</tr>
									))}
								</tbody>
							</table>
						</section>
						{result.boards.count <= 300 && (
							<section className={styles.card} aria-labelledby="dk-boards">
								<h2 id="dk-boards" className={styles.cardTitle}>
									Board layout
								</h2>
								<PrintDiagrams title="Deck boards" subtitle={`${result.boards.count} rows, ${format(result.boards.gap)} gaps, joints ${state.stagger === "none" ? "in line" : "staggered"}, drawn to fit`}>
									<DeckBoardDiagram boards={result.boards} width={state.boardsAcross ? state.length : state.width} length={state.boardsAcross ? state.width : state.length} border={0} joistCenters={state.boardsAcross ? (state.bearerCenters ?? 0) : state.joistCenters} format={format} />
								</PrintDiagrams>
							</section>
						)}
						<div className="grid gap-4 lg:grid-cols-3">
							<RunningList title="Joists along the length" positions={result.joists.members.map(pick)} reference={state.reference} onReferenceChange={set("reference")} />
							<RunningList title="Stumps along a bearer" positions={result.stumpsAlong.members.map(pick)} />
							<RunningList title="Bearers across the width" positions={result.bearers.members.map(pick)} />
						</div>
					</>
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
