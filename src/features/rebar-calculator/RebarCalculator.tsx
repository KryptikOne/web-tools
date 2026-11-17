"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import SegmentedControl from "@/components/SegmentedControl";
import { UnitAndPrecisionBar, DimensionInput, NumberField, ResultList, RunningList, PrintDiagrams, ShareCalculation, ConstructionNotes } from "@/components/construction";
import type { ResultRow } from "@/components/construction";
import { useConstructionUnits } from "@/hooks/useConstructionUnits";
import { rebarGrid, ALL_REBAR_SIZES } from "@/lib/construction/rebarUtils";
import { RebarPlanDiagram, RebarSectionDiagram, LapDiagram } from "./RebarDiagrams";
import styles from "./RebarCalculator.module.scss";

type Mode = "slab" | "footing";
type By = "spacing" | "count";

interface RebarState {
	mode: Mode;
	length: number | null;
	width: number | null;
	depth: number | null;
	cover: number | null;
	bar: string;
	alongBy: By;
	alongSpacing: number | null;
	alongCount: number;
	acrossBy: By;
	acrossSpacing: number | null;
	acrossCount: number;
	lapBy: "length" | "diameters";
	lapLength: number | null;
	lapDiameters: number;
	stockLength: number | null;
	wastePercent: number;
	priceBy: "bar" | "pound";
	price: number;
	tieBar: string;
	tieSpacing: number | null;
	hookDiameters: number;
}

const DEFAULTS: RebarState = {
	mode: "slab",
	length: 240,
	width: 144,
	depth: 4,
	cover: 1.5,
	bar: "#4",
	alongBy: "spacing",
	alongSpacing: 12,
	alongCount: 4,
	acrossBy: "spacing",
	acrossSpacing: 12,
	acrossCount: 10,
	lapBy: "diameters",
	lapLength: 24,
	lapDiameters: 40,
	stockLength: 240,
	wastePercent: 5,
	priceBy: "bar",
	price: 9,
	tieBar: "#3",
	tieSpacing: 24,
	hookDiameters: 6,
};

const BAR_NAMES = ALL_REBAR_SIZES.map((r) => r.bar);
const num = (v: unknown, lo: number, hi: number, fallback: number | null): number | null => (typeof v === "number" && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : fallback);
const oneOf = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T => (allowed.includes(v as T) ? (v as T) : fallback);
const int = (v: unknown, lo: number, hi: number, fb: number) => Math.round(num(v, lo, hi, fb) ?? fb);

function sanitize(s: Partial<RebarState>): RebarState {
	return {
		mode: oneOf(s.mode, ["slab", "footing"] as const, DEFAULTS.mode),
		length: num(s.length, 1, 1e4, DEFAULTS.length),
		width: num(s.width, 1, 1e4, DEFAULTS.width),
		depth: num(s.depth, 0.5, 200, DEFAULTS.depth),
		cover: num(s.cover, 0, 50, DEFAULTS.cover),
		bar: oneOf(s.bar, BAR_NAMES, DEFAULTS.bar),
		alongBy: oneOf(s.alongBy, ["spacing", "count"] as const, DEFAULTS.alongBy),
		alongSpacing: num(s.alongSpacing, 1, 1000, DEFAULTS.alongSpacing),
		alongCount: int(s.alongCount, 1, 500, DEFAULTS.alongCount),
		acrossBy: oneOf(s.acrossBy, ["spacing", "count"] as const, DEFAULTS.acrossBy),
		acrossSpacing: num(s.acrossSpacing, 1, 1000, DEFAULTS.acrossSpacing),
		acrossCount: int(s.acrossCount, 1, 500, DEFAULTS.acrossCount),
		lapBy: oneOf(s.lapBy, ["length", "diameters"] as const, DEFAULTS.lapBy),
		lapLength: num(s.lapLength, 0, 200, DEFAULTS.lapLength),
		lapDiameters: int(s.lapDiameters, 0, 100, DEFAULTS.lapDiameters),
		stockLength: num(s.stockLength, 12, 1000, DEFAULTS.stockLength),
		wastePercent: num(s.wastePercent, 0, 100, DEFAULTS.wastePercent) ?? DEFAULTS.wastePercent,
		priceBy: oneOf(s.priceBy, ["bar", "pound"] as const, DEFAULTS.priceBy),
		price: num(s.price, 0, 1e4, DEFAULTS.price) ?? DEFAULTS.price,
		tieBar: oneOf(s.tieBar, BAR_NAMES, DEFAULTS.tieBar),
		tieSpacing: num(s.tieSpacing, 0, 1000, DEFAULTS.tieSpacing),
		hookDiameters: int(s.hookDiameters, 0, 20, DEFAULTS.hookDiameters),
	};
}

export default function RebarCalculator() {
	const { format } = useConstructionUnits();
	const [state, setState] = useState<RebarState>(DEFAULTS);
	const set = <K extends keyof RebarState>(key: K) => (value: RebarState[K]) => setState((s) => ({ ...s, [key]: value }));
	const size = ALL_REBAR_SIZES.find((r) => r.bar === state.bar) ?? ALL_REBAR_SIZES[1];
	const tieSize = ALL_REBAR_SIZES.find((r) => r.bar === state.tieBar) ?? ALL_REBAR_SIZES[0];

	const grid = useMemo(() => {
		const s = state;
		if (s.length === null || s.width === null || s.depth === null || s.cover === null || s.alongSpacing === null || s.acrossSpacing === null || s.lapLength === null || s.stockLength === null || s.tieSpacing === null) return null;
		return rebarGrid({
			mode: s.mode,
			length: s.length,
			width: s.width,
			depth: s.depth,
			cover: s.cover,
			size,
			along: { by: s.alongBy, spacing: s.alongSpacing, count: s.alongCount },
			across: { by: s.acrossBy, spacing: s.acrossSpacing, count: s.acrossCount },
			lapBy: s.lapBy,
			lapValue: s.lapBy === "length" ? s.lapLength : s.lapDiameters,
			stockLength: s.stockLength,
			wastePercent: s.wastePercent,
			priceBy: s.priceBy,
			price: s.price,
			tieSize,
			tieSpacing: s.mode === "footing" ? s.tieSpacing : 0,
			hookDiameters: s.hookDiameters,
		});
	}, [state, size, tieSize]);

	const rows: ResultRow[] = grid
		? [
				{ label: "Bars along", value: `${grid.along.count}`, strong: true, hint: `${format(grid.along.barLength)} clear${grid.along.piece.laps ? `, ${grid.along.piece.pieces} pieces with ${grid.along.piece.laps} laps, ${format(grid.along.piece.totalLength)} each` : ""}` },
				...(grid.across ? [{ label: "Bars across", value: `${grid.across.count}`, strong: true, hint: `${format(grid.across.barLength)} clear${grid.across.piece.laps ? `, ${grid.across.piece.pieces} pieces with ${grid.across.piece.laps} laps` : ""}` }] : []),
				...(grid.ties ? [{ label: "Ties", value: `${grid.ties.count}`, strong: true, hint: `${state.tieBar} at ${format(state.tieSpacing ?? 0)}, ${format(grid.ties.eachLength)} each with hooks, ${grid.ties.weightLb.toFixed(1)} lb` }] : []),
				{ label: "Lap", value: format(grid.lap), hint: state.lapBy === "diameters" ? `${state.lapDiameters} bar diameters` : "as entered" },
				{ label: "Total length", value: `${(grid.totalLength / 12).toFixed(1)} ft`, hint: `with ${state.wastePercent}% waste, laps included` },
				{ label: "Stock bars", value: `${grid.stockBars}`, strong: true, hint: `${format(state.stockLength ?? 0)} each` },
				{ label: "Weight", value: `${grid.weightLb.toFixed(1)} lb`, hint: `${grid.weightKg.toFixed(1)} kg at ${size.weight.toFixed(3)} lb/ft` },
				{ label: "Cost", value: `$${grid.cost.toFixed(2)}`, hint: state.priceBy === "bar" ? `at $${state.price} per stock bar` : `at $${state.price} per lb` },
				{ label: state.mode === "slab" ? "Chairs" : "Supports", value: `${grid.supports}`, hint: state.mode === "slab" ? "about one per 3 sq ft" : "about one per 2 ft of footing" },
			]
		: [];

	return (
		<div className={styles.container}>
			<div className="flex flex-col gap-6">
				<UnitAndPrecisionBar />

				<div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
					<section className={styles.card} aria-labelledby="rb-heading">
						<h2 id="rb-heading" className={styles.cardTitle}>
							Rebar
						</h2>
						<SegmentedControl<Mode>
							label="Element"
							size="sm"
							value={state.mode}
							onChange={set("mode")}
							options={[
								{ value: "slab", label: "Slab grid" },
								{ value: "footing", label: "Footing cage" },
							]}
						/>
						<p className={`${styles.note} mt-3`}>
							Bars start at the cover and run to the cover on the far side. Slab concrete and mesh are in the <Link href="/tools/concrete-calculator">concrete calculator</Link>.
						</p>
						<div className="flex flex-col gap-4">
							<div className="grid grid-cols-3 gap-3">
								<DimensionInput id="rb-length" label="Length" value={state.length} onChange={set("length")} />
								<DimensionInput id="rb-width" label="Width" value={state.width} onChange={set("width")} />
								<DimensionInput id="rb-depth" label={state.mode === "slab" ? "Thickness" : "Depth"} value={state.depth} onChange={set("depth")} />
							</div>
							<div className="grid grid-cols-2 gap-3">
								<DimensionInput id="rb-cover" label="Cover" value={state.cover} onChange={set("cover")} hint="Edge to the bar" />
								<div className="flex flex-col gap-1">
									<label htmlFor="rb-bar" className={styles.label}>
										Bar size
									</label>
									<select id="rb-bar" className={styles.select} value={state.bar} onChange={(e) => set("bar")(e.target.value)}>
										{ALL_REBAR_SIZES.map((r) => (
											<option key={r.bar} value={r.bar}>
												{r.bar} ({(r.diameter * 25.4).toFixed(1)} mm, {r.weight.toFixed(3)} lb/ft)
											</option>
										))}
									</select>
								</div>
							</div>
							<div className="flex flex-wrap items-end gap-x-6 gap-y-3">
								<div className="flex flex-col gap-1">
									<span className={styles.label}>Bars along the length</span>
									<SegmentedControl<By>
										label="Bars along by"
										size="sm"
										fill={false}
										value={state.alongBy}
										onChange={(v) => setState((s) => ({ ...s, alongBy: v, ...(grid && v === "count" ? { alongCount: grid.along.count } : {}) }))}
										options={[
											{ value: "spacing", label: "Spacing" },
											{ value: "count", label: "Count" },
										]}
									/>
								</div>
								{state.alongBy === "spacing" ? <DimensionInput id="rb-along-sp" label="Spacing along" value={state.alongSpacing} onChange={set("alongSpacing")} className="w-36" /> : <NumberField id="rb-along-n" label="Bars along" value={state.alongCount} onChange={(v) => set("alongCount")(int(v, 1, 500, 1))} min={1} max={500} step={1} className="w-36" />}
							</div>
							{state.mode === "slab" ? (
								<div className="flex flex-wrap items-end gap-x-6 gap-y-3">
									<div className="flex flex-col gap-1">
										<span className={styles.label}>Bars across the width</span>
										<SegmentedControl<By>
											label="Bars across by"
											size="sm"
											fill={false}
											value={state.acrossBy}
											onChange={(v) => setState((s) => ({ ...s, acrossBy: v, ...(grid?.across && v === "count" ? { acrossCount: grid.across.count } : {}) }))}
											options={[
												{ value: "spacing", label: "Spacing" },
												{ value: "count", label: "Count" },
											]}
										/>
									</div>
									{state.acrossBy === "spacing" ? <DimensionInput id="rb-across-sp" label="Spacing across" value={state.acrossSpacing} onChange={set("acrossSpacing")} className="w-36" /> : <NumberField id="rb-across-n" label="Bars across" value={state.acrossCount} onChange={(v) => set("acrossCount")(int(v, 1, 500, 1))} min={1} max={500} step={1} className="w-36" />}
								</div>
							) : (
								<div className="grid grid-cols-3 gap-3">
									<div className="flex flex-col gap-1">
										<label htmlFor="rb-tie" className={styles.label}>
											Tie bar
										</label>
										<select id="rb-tie" className={styles.select} value={state.tieBar} onChange={(e) => set("tieBar")(e.target.value)}>
											{ALL_REBAR_SIZES.slice(0, 4).map((r) => (
												<option key={r.bar} value={r.bar}>
													{r.bar}
												</option>
											))}
											{ALL_REBAR_SIZES.slice(11, 13).map((r) => (
												<option key={r.bar} value={r.bar}>
													{r.bar}
												</option>
											))}
										</select>
									</div>
									<DimensionInput id="rb-tie-sp" label="Tie spacing" value={state.tieSpacing} onChange={set("tieSpacing")} hint="0 for none" />
									<NumberField id="rb-hook" label="Hook" value={state.hookDiameters} onChange={(v) => set("hookDiameters")(int(v, 0, 20, 6))} unit="d" min={0} max={20} step={1} hint="Per hook, in tie diameters" />
								</div>
							)}
							<div className="flex flex-wrap items-end gap-x-6 gap-y-3">
								<div className="flex flex-col gap-1">
									<span className={styles.label}>Lap</span>
									<SegmentedControl<"length" | "diameters">
										label="Lap by"
										size="sm"
										fill={false}
										value={state.lapBy}
										onChange={(v) => setState((s) => ({ ...s, lapBy: v, ...(grid && v === "length" ? { lapLength: Number(grid.lap.toFixed(4)) } : {}) }))}
										options={[
											{ value: "diameters", label: "Bar diameters" },
											{ value: "length", label: "Length" },
										]}
									/>
								</div>
								{state.lapBy === "diameters" ? <NumberField id="rb-lap-d" label="Lap" value={state.lapDiameters} onChange={(v) => set("lapDiameters")(int(v, 0, 100, 40))} unit="d" min={0} max={100} step={1} className="w-28" /> : <DimensionInput id="rb-lap-l" label="Lap length" value={state.lapLength} onChange={set("lapLength")} className="w-36" />}
								<DimensionInput id="rb-stock" label="Stock bar length" value={state.stockLength} onChange={set("stockLength")} className="w-40" />
							</div>
							<div className="flex flex-wrap items-end gap-x-6 gap-y-3">
								<NumberField id="rb-waste" label="Waste" value={state.wastePercent} onChange={set("wastePercent")} unit="%" min={0} max={100} step="any" className="w-28" />
								<div className="flex flex-col gap-1">
									<span className={styles.label}>Price per</span>
									<SegmentedControl<"bar" | "pound">
										label="Price per"
										size="sm"
										fill={false}
										value={state.priceBy}
										onChange={set("priceBy")}
										options={[
											{ value: "bar", label: "Stock bar" },
											{ value: "pound", label: "Pound" },
										]}
									/>
								</div>
								<NumberField id="rb-price" label="Price" value={state.price} onChange={set("price")} prefix="$" step="any" className="w-28" />
							</div>
						</div>
					</section>

					<section className={styles.card} aria-labelledby="rb-results">
						<h2 id="rb-results" className={styles.cardTitle}>
							Bars and weight
						</h2>
						{grid ? <ResultList rows={rows} /> : <p className={styles.empty}>Enter the size, cover and bar; the cover must leave room for the bars and the lap must be shorter than a stock bar.</p>}
						{grid?.warnings.map((w) => (
							<p key={w} className={styles.warn}>
								{w}
							</p>
						))}
					</section>
				</div>

				{grid && state.length !== null && state.width !== null && state.depth !== null && state.cover !== null && (
					<>
						<section className={styles.card} aria-labelledby="rb-plan">
							<h2 id="rb-plan" className={styles.cardTitle}>
								Plan
							</h2>
							<PrintDiagrams title={state.mode === "slab" ? "Slab rebar grid" : "Footing cage"} subtitle={`${format(state.length)} × ${format(state.width)}, ${state.bar} bars, ${format(state.cover)} cover, drawn to fit`}>
								<RebarPlanDiagram grid={grid} length={state.length} width={state.width} cover={state.cover} diameter={size.diameter} format={format} />
							</PrintDiagrams>
						</section>
						<div className="grid gap-4 lg:grid-cols-2">
							<section className={styles.card} aria-labelledby="rb-section">
								<h2 id="rb-section" className={styles.cardTitle}>
									Section
								</h2>
								<PrintDiagrams title="Section" subtitle={`${format(state.width)} × ${format(state.depth)}, ${format(state.cover)} cover`}>
									<RebarSectionDiagram width={state.width} depth={state.depth} cover={state.cover} diameter={size.diameter} positions={grid.along.positions} ties={grid.ties !== null} tieDiameter={tieSize.diameter} format={format} />
								</PrintDiagrams>
							</section>
							<section className={styles.card} aria-labelledby="rb-lap">
								<h2 id="rb-lap" className={styles.cardTitle}>
									Lap splice
								</h2>
								<p className={styles.note}>Where a run is longer than a stock bar, overlap the bars by the lap and tie them; stagger the splices on neighbouring bars.</p>
								<PrintDiagrams title="Lap splice" subtitle={`${format(grid.lap)} lap for ${state.bar}`}>
									<LapDiagram lap={grid.lap} diameter={size.diameter} format={format} />
								</PrintDiagrams>
							</section>
						</div>
						<div className="grid gap-4 lg:grid-cols-2">
							<RunningList title={state.mode === "slab" ? "Bars along, from the long edge" : "Bars along, from the side"} positions={grid.along.positions} />
							{grid.across && <RunningList title="Bars across, from the end" positions={grid.across.positions} />}
							{grid.ties && <RunningList title="Ties, from the end" positions={grid.ties.positions} />}
						</div>
					</>
				)}

				<div className="grid gap-4 lg:grid-cols-2">
					<ShareCalculation state={state} onLoad={(s) => setState(sanitize(s))} />
					<ConstructionNotes />
				</div>
			</div>
		</div>
	);
}
