"use client";

import { useMemo, useState } from "react";
import SegmentedControl from "@/components/SegmentedControl";
import { UnitAndPrecisionBar, DimensionInput, NumberField, ResultList, RunningList, PrintDiagrams, LumberTable, ShareCalculation, ConstructionNotes } from "@/components/construction";
import type { ResultRow } from "@/components/construction";
import { useConstructionUnits } from "@/hooks/useConstructionUnits";
import { ALL_LUMBER_SIZES, DECK_BOARD_SIZES } from "@/lib/construction/lumberUtils";
import { deckBoards, BOARD_LAYOUTS, type BoardLayout, type Stagger } from "@/lib/construction/deckBoardUtils";
import DeckBoardDiagram from "./DeckBoardDiagram";
import styles from "./DeckBoards.module.scss";

interface DeckBoardState {
	width: number | null;
	length: number | null;
	boardSize: string;
	boardWidth: number | null;
	gap: number | null;
	layout: BoardLayout;
	border: number | null;
	joistCenters: number | null;
	boardLength: number | null;
	stagger: Stagger;
	screwsPerCrossing: number;
}

const DEFAULTS: DeckBoardState = {
	width: 144,
	length: 240,
	boardSize: "5/4x6",
	boardWidth: 5.5,
	gap: 0.25,
	layout: "rip-last",
	border: 0,
	joistCenters: 16,
	boardLength: 192,
	stagger: "half",
	screwsPerCrossing: 2,
};

const LAYOUT_VALUES = BOARD_LAYOUTS.map((l) => l.value);
const SIZE_OPTIONS = [...DECK_BOARD_SIZES.map((s) => ({ value: s.nominal, label: s.nominal })), { value: "2x6", label: "2x6" }, { value: "2x4", label: "2x4" }, { value: "custom", label: "Custom" }];
const STAGGERS: { value: Stagger; label: string }[] = [
	{ value: "none", label: "None" },
	{ value: "half", label: "Half" },
	{ value: "third", label: "Thirds" },
];

const num = (v: unknown, lo: number, hi: number, fallback: number | null): number | null => (typeof v === "number" && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : fallback);
const oneOf = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T => (allowed.includes(v as T) ? (v as T) : fallback);

function sanitize(s: Partial<DeckBoardState>): DeckBoardState {
	return {
		width: num(s.width, 1, 1e4, DEFAULTS.width),
		length: num(s.length, 1, 1e4, DEFAULTS.length),
		boardSize: typeof s.boardSize === "string" && SIZE_OPTIONS.some((o) => o.value === s.boardSize) ? s.boardSize : DEFAULTS.boardSize,
		boardWidth: num(s.boardWidth, 0.25, 100, DEFAULTS.boardWidth),
		gap: num(s.gap, 0, 10, DEFAULTS.gap),
		layout: oneOf(s.layout, LAYOUT_VALUES, DEFAULTS.layout),
		border: num(s.border, 0, 100, DEFAULTS.border),
		joistCenters: num(s.joistCenters, 1, 100, DEFAULTS.joistCenters),
		boardLength: num(s.boardLength, 1, 1000, DEFAULTS.boardLength),
		stagger: oneOf(s.stagger, ["none", "half", "third"] as const, DEFAULTS.stagger),
		screwsPerCrossing: Math.round(num(s.screwsPerCrossing, 0, 10, DEFAULTS.screwsPerCrossing) ?? DEFAULTS.screwsPerCrossing),
	};
}

export default function DeckBoards() {
	const { format } = useConstructionUnits();
	const [state, setState] = useState<DeckBoardState>(DEFAULTS);
	const set = <K extends keyof DeckBoardState>(key: K) => (value: DeckBoardState[K]) => setState((s) => ({ ...s, [key]: value }));
	const pickSize = (v: string) => {
		const size = ALL_LUMBER_SIZES.find((s) => s.nominal === v);
		setState((s) => ({ ...s, boardSize: v, ...(size ? { boardWidth: size.depth } : {}) }));
	};

	const boards = useMemo(
		() =>
			state.width === null || state.length === null || state.boardWidth === null || state.gap === null || state.border === null || state.joistCenters === null || state.boardLength === null
				? null
				: deckBoards({ width: state.width, length: state.length, boardWidth: state.boardWidth, gap: state.gap, layout: state.layout, border: state.border, joistCenters: state.joistCenters, boardLength: state.boardLength, stagger: state.stagger, screwsPerCrossing: state.screwsPerCrossing }),
		[state],
	);

	const rows: ResultRow[] = boards
		? [
				{ label: "Boards across", value: `${boards.count}`, strong: true, hint: boards.rippedBoards ? `${boards.fullBoards} full, ${boards.rippedBoards} ripped` : "all full width" },
				{ label: "Gap", value: format(boards.gap), hint: state.layout === "adjust-gap" ? "adjusted so whole boards fill the width" : "as entered" },
				{ label: "First board", value: format(boards.firstWidth), hint: boards.startGap > 1e-6 ? `after a ${format(boards.startGap)} edge gap` : "flush with the edge" },
				{ label: "Last board", value: format(boards.lastWidth), hint: boards.endGap > 1e-6 ? `then a ${format(boards.endGap)} edge gap` : "flush with the edge" },
				...(state.border ? [{ label: "Field inside the border", value: `${format(boards.fieldWidth)} × ${format(boards.fieldLength)}`, hint: `border ${format(state.border)} plus a ${format(state.gap ?? 0)} gap all round` }] : []),
				{ label: "Board run per joint", value: format(boards.usableBoardLength), hint: `a ${format(state.boardLength ?? 0)} board cut back so joints land on joists at ${format(state.joistCenters ?? 0)} centers` },
				{ label: "Joists crossed", value: `${boards.joistsCrossed}`, hint: "per row" },
				{ label: "Screws", value: `${boards.screws}`, hint: `${state.screwsPerCrossing} per board per joist, doubled at joints` },
				{ label: "Boards to buy", value: `${boards.stockBoards}`, strong: true, hint: `${format(state.boardLength ?? 0)} stock${state.border ? ", border included" : ""}` },
				{ label: "Linear feet", value: `${boards.netLinearFeet.toFixed(1)} ft laid`, hint: `${boards.grossLinearFeet.toFixed(1)} ft bought, ${boards.wastePercent.toFixed(1)}% offcut` },
			]
		: [];

	const positions = boards ? boards.rows.map((r) => r.near) : [];

	return (
		<div className={styles.container}>
			<div className="flex flex-col gap-6">
				<UnitAndPrecisionBar />

				<div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
					<section className={styles.card} aria-labelledby="db-heading">
						<h2 id="db-heading" className={styles.cardTitle}>
							Deck boards
						</h2>
						<p className={styles.note}>Width is measured across the boards, length along them. Rows are laid from the near edge; the running list gives the near side of each board.</p>
						<div className="flex flex-col gap-4">
							<div className="grid grid-cols-2 gap-3">
								<DimensionInput id="db-width" label="Deck width" value={state.width} onChange={set("width")} hint="Across the boards" />
								<DimensionInput id="db-length" label="Deck length" value={state.length} onChange={set("length")} hint="Along the boards" />
							</div>
							<div className="flex flex-col gap-1">
								<span className={styles.label}>Board</span>
								<SegmentedControl<string> label="Board size" size="sm" value={state.boardSize} onChange={pickSize} options={SIZE_OPTIONS} />
							</div>
							<div className="grid grid-cols-3 gap-3">
								<DimensionInput id="db-board-w" label="Board width" value={state.boardWidth} onChange={(v) => setState((s) => ({ ...s, boardWidth: v, boardSize: "custom" }))} hint="Actual" />
								<DimensionInput id="db-gap" label="Gap" value={state.gap} onChange={set("gap")} />
								<DimensionInput id="db-board-l" label="Board length" value={state.boardLength} onChange={set("boardLength")} hint="Stock" />
							</div>
							<div className="flex flex-col gap-1">
								<label htmlFor="db-layout" className={styles.label}>
									Fit across the width
								</label>
								<select id="db-layout" className={styles.select} value={state.layout} onChange={(e) => set("layout")(e.target.value as BoardLayout)}>
									{BOARD_LAYOUTS.map((l) => (
										<option key={l.value} value={l.value}>
											{l.label}
										</option>
									))}
								</select>
								<span className={styles.hint}>{BOARD_LAYOUTS.find((l) => l.value === state.layout)?.hint}</span>
							</div>
							<div className="grid grid-cols-2 gap-3">
								<DimensionInput id="db-border" label="Picture-frame border" value={state.border} onChange={set("border")} hint="Board width around the edge; 0 for none" />
								<DimensionInput id="db-joists" label="Joist centers" value={state.joistCenters} onChange={set("joistCenters")} />
							</div>
							<div className="flex flex-wrap items-end gap-x-6 gap-y-3">
								<div className="flex flex-col gap-1">
									<span className={styles.label}>Stagger joints</span>
									<SegmentedControl<Stagger> label="Stagger joints" size="sm" fill={false} value={state.stagger} onChange={set("stagger")} options={STAGGERS} />
								</div>
								<NumberField id="db-screws" label="Screws per joist" value={state.screwsPerCrossing} onChange={(v) => set("screwsPerCrossing")(Math.round(Math.min(10, Math.max(0, v))))} min={0} max={10} step={1} className="w-36" />
							</div>
						</div>
					</section>

					<section className={styles.card} aria-labelledby="db-results">
						<h2 id="db-results" className={styles.cardTitle}>
							Layout
						</h2>
						{boards ? <ResultList rows={rows} /> : <p className={styles.empty}>Enter a deck wider than one board, with the board, gap and joist centers.</p>}
						{boards?.warnings.map((w) => (
							<p key={w} className={styles.warn}>
								{w}
							</p>
						))}
						{boards && boards.borderPieces.length > 0 && (
							<p className={styles.note}>
								Border: {boards.borderPieces.map((p) => `${p.count} × ${format(p.length)}`).join(" and ")}, mitered at the corners.
							</p>
						)}
					</section>
				</div>

				{boards && boards.count <= 300 && state.width !== null && state.length !== null && state.border !== null && state.joistCenters !== null && (
					<>
						<section className={styles.card} aria-labelledby="db-plan">
							<h2 id="db-plan" className={styles.cardTitle}>
								Board plan
							</h2>
							<PrintDiagrams title="Deck board layout" subtitle={`${boards.count} rows of ${format(state.boardWidth ?? 0)} boards across ${format(state.width)}, ${format(boards.gap)} gaps, joints ${state.stagger === "none" ? "in line" : `staggered by ${state.stagger === "half" ? "half" : "thirds"}`}, drawn to fit`}>
								<DeckBoardDiagram boards={boards} width={state.width} length={state.length} border={state.border} joistCenters={state.joistCenters} format={format} />
							</PrintDiagrams>
							<p className={styles.legend}>
								<span className={styles.full}>Full boards</span>
								<span className={styles.ripped}>Ripped boards</span>
								<span>Dashed lines are joists; every joint sits over one.</span>
							</p>
						</section>
						<RunningList title="Board positions" positions={positions} labelFor={(i) => (boards.rows[i].ripped ? `rip ${format(boards.rows[i].width)}` : "")} />
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
