"use client";

import { useMemo, useState, type KeyboardEvent } from "react";
import SegmentedControl from "@/components/SegmentedControl";
import { UnitAndPrecisionBar, DimensionInput, NumberField, ResultList, PrintDiagrams, LumberTable, ShareCalculation, ConstructionNotes } from "@/components/construction";
import type { ResultRow } from "@/components/construction";
import { useConstructionUnits } from "@/hooks/useConstructionUnits";
import { formatArea } from "@/lib/construction/imperialUtils";
import {
	BAG_WEIGHTS_LB,
	DIRECTIONS,
	MESH_SHEETS,
	PREMIX_DENSITY_LB_FT3,
	REBAR_SIZES,
	bagYieldCubicFeet,
	bagsFor,
	boxVolume,
	closingSegment,
	cubicFeet,
	cubicMetres,
	cubicYards,
	cylinderVolume,
	meshSheets,
	outlineFromSegments,
	rebar,
	slabVolumes,
	type Direction,
	type Segment,
} from "@/lib/construction/concreteUtils";
import { SlabPlan, SlabSection } from "./ConcreteDiagrams";
import styles from "./ConcreteCalculator.module.scss";

type Mode = "slab" | "premix" | "columns";

interface ConcreteState {
	mode: Mode;
	// slab outline
	segments: Segment[];
	nextLength: number | null;
	increment: boolean;
	slabThickness: number | null;
	edgeBeamWidth: number | null;
	edgeBeamDepth: number | null;
	fullPerimeter: boolean;
	edgeBeamLength: number | null;
	internalBeamLength: number | null;
	internalBeamWidth: number | null;
	internalBeamDepth: number | null;
	splayInternal: boolean;
	// rebar
	edgeBeamBars: number;
	internalBeamBars: number;
	gridSpacing: number | null;
	rebarWaste: number;
	barLength: number | null;
	costPerBar: number;
	rebarSize: string;
	meshSheet: string;
	meshOverlap: number;
	// premix
	roundCount: number;
	roundDiameter: number | null;
	roundDepth: number | null;
	rectCount: number;
	rectWidth: number | null;
	rectLength: number | null;
	rectDepth: number | null;
	pSlabWidth: number | null;
	pSlabLength: number | null;
	pSlabThickness: number | null;
	bagWeight: number;
	costPerBag: number;
	convertBags: number;
	// columns and footings
	roundColumnCount: number;
	roundColumnDiameter: number | null;
	roundColumnHeight: number | null;
	squareColumnCount: number;
	squareColumnWidth: number | null;
	squareColumnLength: number | null;
	squareColumnHeight: number | null;
	roundFootingCount: number;
	roundFootingDiameter: number | null;
	roundFootingDepth: number | null;
	squareFootingCount: number;
	squareFootingWidth: number | null;
	squareFootingLength: number | null;
	squareFootingDepth: number | null;
	cBagWeight: number;
	cCostPerBag: number;
}

const DEFAULT_SEGMENTS: Segment[] = [
	{ length: 240, direction: "N" },
	{ length: 192, direction: "E" },
	{ length: 120, direction: "S" },
	{ length: 72, direction: "W" },
	{ length: 120, direction: "S" },
	{ length: 120, direction: "W" },
];

const DEFAULTS: ConcreteState = {
	mode: "slab",
	segments: DEFAULT_SEGMENTS,
	nextLength: 120,
	increment: false,
	slabThickness: 4,
	edgeBeamWidth: 12,
	edgeBeamDepth: 12,
	fullPerimeter: true,
	edgeBeamLength: 480,
	internalBeamLength: 0,
	internalBeamWidth: 12,
	internalBeamDepth: 10,
	splayInternal: false,
	edgeBeamBars: 2,
	internalBeamBars: 2,
	gridSpacing: 0,
	rebarWaste: 10,
	barLength: 240,
	costPerBar: 12,
	rebarSize: "#4",
	meshSheet: "none",
	meshOverlap: 10,
	roundCount: 4,
	roundDiameter: 12,
	roundDepth: 36,
	rectCount: 0,
	rectWidth: 12,
	rectLength: 12,
	rectDepth: 36,
	pSlabWidth: 0,
	pSlabLength: 0,
	pSlabThickness: 4,
	bagWeight: 80,
	costPerBag: 6.5,
	convertBags: 10,
	roundColumnCount: 4,
	roundColumnDiameter: 10,
	roundColumnHeight: 96,
	squareColumnCount: 0,
	squareColumnWidth: 12,
	squareColumnLength: 12,
	squareColumnHeight: 96,
	roundFootingCount: 4,
	roundFootingDiameter: 24,
	roundFootingDepth: 12,
	squareFootingCount: 0,
	squareFootingWidth: 24,
	squareFootingLength: 24,
	squareFootingDepth: 12,
	cBagWeight: 80,
	cCostPerBag: 6.5,
};

const MODES: { value: Mode; label: string }[] = [
	{ value: "slab", label: "Slab" },
	{ value: "premix", label: "Premix bags" },
	{ value: "columns", label: "Columns" },
];
const ARROWS: Record<Direction, string> = { N: "↑", NE: "↗", E: "→", SE: "↘", S: "↓", SW: "↙", W: "←", NW: "↖" };
const PAD_ORDER: (Direction | "close")[] = ["NW", "N", "NE", "W", "close", "E", "SW", "S", "SE"];
const KEY_DIR: Record<string, Direction> = { ArrowUp: "N", ArrowRight: "E", ArrowDown: "S", ArrowLeft: "W" };
const MAX_SEGMENTS = 60;

const num = (v: unknown, lo: number, hi: number, fallback: number | null): number | null => (typeof v === "number" && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : fallback);
const oneOf = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T => (allowed.includes(v as T) ? (v as T) : fallback);
const int = (v: unknown, lo: number, hi: number, fb: number) => Math.round(num(v, lo, hi, fb) ?? fb);

function sanitize(s: Partial<ConcreteState>): ConcreteState {
	const len = (v: unknown, fb: number | null) => num(v, 0, 1e5, fb);
	const segments = Array.isArray(s.segments)
		? s.segments
				.filter((g): g is Segment => !!g && typeof g === "object" && DIRECTIONS.includes((g as Segment).direction) && Number.isFinite((g as Segment).length) && (g as Segment).length > 0 && (g as Segment).length <= 1e5)
				.slice(0, MAX_SEGMENTS)
		: DEFAULTS.segments;
	const out: ConcreteState = { ...DEFAULTS, segments };
	out.mode = oneOf(s.mode, ["slab", "premix", "columns"] as const, DEFAULTS.mode);
	for (const k of Object.keys(DEFAULTS) as (keyof ConcreteState)[]) {
		if (k === "mode" || k === "segments") continue;
		const d = DEFAULTS[k];
		const v = s[k];
		if (typeof d === "boolean") (out as unknown as Record<string, unknown>)[k] = typeof v === "boolean" ? v : d;
		else if (typeof d === "string") (out as unknown as Record<string, unknown>)[k] = typeof v === "string" && v.length < 20 ? v : d;
		else if (k.endsWith("Count") || k === "edgeBeamBars" || k === "internalBeamBars" || k === "convertBags") (out as unknown as Record<string, unknown>)[k] = int(v, 0, 10000, d as number);
		else (out as unknown as Record<string, unknown>)[k] = len(v, d as number | null);
	}
	out.bagWeight = BAG_WEIGHTS_LB.includes(s.bagWeight as 80) ? (s.bagWeight as number) : DEFAULTS.bagWeight;
	out.cBagWeight = BAG_WEIGHTS_LB.includes(s.cBagWeight as 80) ? (s.cBagWeight as number) : DEFAULTS.cBagWeight;
	if (!REBAR_SIZES.some((r) => r.bar === out.rebarSize)) out.rebarSize = DEFAULTS.rebarSize;
	if (out.meshSheet !== "none" && !MESH_SHEETS.some((m) => m.id === out.meshSheet)) out.meshSheet = DEFAULTS.meshSheet;
	return out;
}

const volumeRows = (label: string, cubicInches: number, bagWeight: number, costPerBag: number, strong = false): ResultRow[] => {
	const ft3 = cubicFeet(cubicInches);
	const bags = bagsFor(ft3, bagWeight);
	return [
		{ label, value: `${ft3.toFixed(2)} ft³`, strong, hint: `${cubicYards(cubicInches).toFixed(3)} yd³ · ${cubicMetres(cubicInches).toFixed(3)} m³` },
		{ label: `${label}: ${bagWeight} lb bags`, value: `${bags}`, strong, hint: `$${(bags * costPerBag).toFixed(2)}` },
	];
};

export default function ConcreteCalculator() {
	const { format, mode: unitMode } = useConstructionUnits();
	const [state, setState] = useState<ConcreteState>(DEFAULTS);
	const set = <K extends keyof ConcreteState>(key: K) => (value: ConcreteState[K]) => setState((s) => ({ ...s, [key]: value }));

	// ── slab outline builder
	const outline = useMemo(() => outlineFromSegments(state.segments), [state.segments]);
	const closer = useMemo(() => closingSegment(outline), [outline]);
	const addSegment = (direction: Direction) => {
		const length = state.nextLength;
		if (length === null || length <= 0) return;
		setState((s) => {
			const last = s.segments[s.segments.length - 1];
			if (s.increment && last && last.direction === direction) {
				return { ...s, segments: [...s.segments.slice(0, -1), { ...last, length: last.length + length }] };
			}
			if (s.segments.length >= MAX_SEGMENTS) return s;
			return { ...s, segments: [...s.segments, { length, direction }] };
		});
	};
	const closeOutline = () => closer && setState((s) => ({ ...s, segments: [...s.segments, closer] }));
	const undo = () => setState((s) => ({ ...s, segments: s.segments.slice(0, -1) }));
	const clear = () => setState((s) => ({ ...s, segments: [] }));
	const onBuilderKey = (e: KeyboardEvent<HTMLDivElement>) => {
		if (!e.shiftKey) return;
		const dir = KEY_DIR[e.key];
		if (dir) {
			e.preventDefault();
			addSegment(dir);
		} else if (e.key.toLowerCase() === "c") {
			e.preventDefault();
			closeOutline();
		} else if (e.key.toLowerCase() === "z") {
			e.preventDefault();
			undo();
		}
	};

	const slab = useMemo(() => {
		if (!outline.closed || state.slabThickness === null) return null;
		return slabVolumes({
			area: outline.area,
			perimeter: outline.perimeter,
			slabThickness: state.slabThickness,
			edgeBeamWidth: state.edgeBeamWidth ?? 0,
			edgeBeamDepth: state.edgeBeamDepth ?? 0,
			edgeBeamLength: state.fullPerimeter ? undefined : (state.edgeBeamLength ?? 0),
			internalBeamLength: state.internalBeamLength ?? 0,
			internalBeamWidth: state.internalBeamWidth ?? 0,
			internalBeamDepth: state.internalBeamDepth ?? 0,
			splayInternal: state.splayInternal,
		});
	}, [outline, state.slabThickness, state.edgeBeamWidth, state.edgeBeamDepth, state.fullPerimeter, state.edgeBeamLength, state.internalBeamLength, state.internalBeamWidth, state.internalBeamDepth, state.splayInternal]);
	const rebarSize = REBAR_SIZES.find((r) => r.bar === state.rebarSize) ?? REBAR_SIZES[1];
	const bars = useMemo(
		() =>
			slab
				? rebar({
						area: outline.area,
						edgeBeamLength: slab.edgeBeamLength,
						edgeBeamBars: state.edgeBeamBars,
						internalBeamLength: state.internalBeamLength ?? 0,
						internalBeamBars: state.internalBeamBars,
						gridSpacing: state.gridSpacing ?? 0,
						wastePercent: state.rebarWaste,
						barLength: state.barLength ?? 0,
						costPerBar: state.costPerBar,
						size: rebarSize,
					})
				: null,
		[slab, outline.area, state.edgeBeamBars, state.internalBeamLength, state.internalBeamBars, state.gridSpacing, state.rebarWaste, state.barLength, state.costPerBar, rebarSize],
	);
	const mesh = MESH_SHEETS.find((m) => m.id === state.meshSheet);
	const slabRows: ResultRow[] = slab
		? [
				{ label: "Area", value: formatArea(outline.area, unitMode), hint: `perimeter ${format(outline.perimeter)}` },
				{ label: "Slab", value: `${cubicFeet(slab.slab).toFixed(2)} ft³` },
				...(slab.edgeBeams > 0 ? [{ label: "Edge beams", value: `${cubicFeet(slab.edgeBeams).toFixed(2)} ft³`, hint: `${format(slab.edgeBeamLength)} long, below the slab` }] : []),
				...(slab.internalBeams > 0 ? [{ label: "Internal beams", value: `${cubicFeet(slab.internalBeams).toFixed(2)} ft³`, hint: state.splayInternal ? "with 45° splays" : "" }] : []),
				{ label: "Total concrete", value: `${cubicYards(slab.total).toFixed(2)} yd³`, strong: true, hint: `${cubicFeet(slab.total).toFixed(1)} ft³ · ${cubicMetres(slab.total).toFixed(2)} m³` },
				...(bars && bars.totalLength > 0
					? [
							{ label: "Rebar", value: `${bars.bars} × ${format(state.barLength ?? 0)}`, strong: true, hint: `${(bars.totalLength / 12).toFixed(0)} ft of ${rebarSize.bar} incl. ${state.rebarWaste}% laps and waste` },
							{ label: "Rebar weight", value: `${bars.weightLb.toFixed(0)} lb`, hint: `${(bars.weightLb * 0.4536).toFixed(0)} kg` },
							{ label: "Rebar cost", value: `$${bars.cost.toFixed(2)}` },
						]
					: []),
				...(mesh ? [{ label: "Mesh", value: `${meshSheets(outline.area, mesh.width, mesh.length, state.meshOverlap)} × ${mesh.label}`, hint: `${state.meshOverlap}% for laps` }] : []),
			]
		: [];

	// ── premix
	const premix = useMemo(() => {
		const round = state.roundCount * cylinderVolume(state.roundDiameter ?? 0, state.roundDepth ?? 0);
		const rect = state.rectCount * boxVolume(state.rectWidth ?? 0, state.rectLength ?? 0, state.rectDepth ?? 0);
		const pslab = boxVolume(state.pSlabWidth ?? 0, state.pSlabLength ?? 0, state.pSlabThickness ?? 0);
		return { round, rect, pslab, total: round + rect + pslab };
	}, [state.roundCount, state.roundDiameter, state.roundDepth, state.rectCount, state.rectWidth, state.rectLength, state.rectDepth, state.pSlabWidth, state.pSlabLength, state.pSlabThickness]);
	const premixRows: ResultRow[] =
		premix.total > 0
			? [
					...(premix.round > 0 ? [{ label: "Round holes", value: `${cubicFeet(premix.round).toFixed(2)} ft³`, hint: `${state.roundCount} × ${format(state.roundDiameter ?? 0)} × ${format(state.roundDepth ?? 0)}` }] : []),
					...(premix.rect > 0 ? [{ label: "Rectangular holes", value: `${cubicFeet(premix.rect).toFixed(2)} ft³` }] : []),
					...(premix.pslab > 0 ? [{ label: "Slab", value: `${cubicFeet(premix.pslab).toFixed(2)} ft³` }] : []),
					...volumeRows("Total", premix.total, state.bagWeight, state.costPerBag, true),
				]
			: [];

	// ── columns and footings
	const columns = useMemo(() => {
		const rc = state.roundColumnCount * cylinderVolume(state.roundColumnDiameter ?? 0, state.roundColumnHeight ?? 0);
		const sc = state.squareColumnCount * boxVolume(state.squareColumnWidth ?? 0, state.squareColumnLength ?? 0, state.squareColumnHeight ?? 0);
		const rf = state.roundFootingCount * cylinderVolume(state.roundFootingDiameter ?? 0, state.roundFootingDepth ?? 0);
		const sf = state.squareFootingCount * boxVolume(state.squareFootingWidth ?? 0, state.squareFootingLength ?? 0, state.squareFootingDepth ?? 0);
		return { rc, sc, rf, sf, total: rc + sc + rf + sf };
	}, [state.roundColumnCount, state.roundColumnDiameter, state.roundColumnHeight, state.squareColumnCount, state.squareColumnWidth, state.squareColumnLength, state.squareColumnHeight, state.roundFootingCount, state.roundFootingDiameter, state.roundFootingDepth, state.squareFootingCount, state.squareFootingWidth, state.squareFootingLength, state.squareFootingDepth]);
	const columnRows: ResultRow[] =
		columns.total > 0
			? [
					...(columns.rc > 0 ? [{ label: "Round columns", value: `${cubicFeet(columns.rc).toFixed(2)} ft³`, hint: `${(cubicFeet(columns.rc) / state.roundColumnCount).toFixed(2)} ft³ each` }] : []),
					...(columns.sc > 0 ? [{ label: "Square columns", value: `${cubicFeet(columns.sc).toFixed(2)} ft³`, hint: `${(cubicFeet(columns.sc) / state.squareColumnCount).toFixed(2)} ft³ each` }] : []),
					...(columns.rf > 0 ? [{ label: "Round footings", value: `${cubicFeet(columns.rf).toFixed(2)} ft³`, hint: `${(cubicFeet(columns.rf) / state.roundFootingCount).toFixed(2)} ft³ each` }] : []),
					...(columns.sf > 0 ? [{ label: "Square footings", value: `${cubicFeet(columns.sf).toFixed(2)} ft³`, hint: `${(cubicFeet(columns.sf) / state.squareFootingCount).toFixed(2)} ft³ each` }] : []),
					...volumeRows("Total", columns.total, state.cBagWeight, state.cCostPerBag, true),
				]
			: [];

	const bagOptions = BAG_WEIGHTS_LB.map((w) => ({ value: `${w}`, label: `${w} lb` }));

	return (
		<div className={styles.container}>
			<div className="flex flex-col gap-6">
				<UnitAndPrecisionBar />
				<div className="flex flex-col gap-1">
					<span className={styles.label}>Pour</span>
					<SegmentedControl<Mode> label="Pour" value={state.mode} onChange={set("mode")} options={MODES} />
				</div>

				{state.mode === "slab" && (
					<>
						<div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
							<section className={styles.card} aria-labelledby="slab-heading">
								<h2 id="slab-heading" className={styles.cardTitle}>
									Irregular slab
								</h2>
								<p className={styles.note}>Draw the outline: enter a side length, then click the direction it runs, going clockwise, until the shape comes back to the start.</p>
								<div className="flex flex-col gap-4">
									<div className={styles.builder} tabIndex={0} role="group" aria-label="Slab outline builder" onKeyDown={onBuilderKey}>
										<div className="flex flex-wrap items-end gap-4">
											<DimensionInput id="slab-next" label="Side length" value={state.nextLength} onChange={set("nextLength")} className="flex-1 min-w-[10rem]" />
											<div className={styles.pad} role="group" aria-label="Direction">
												{PAD_ORDER.map((d) =>
													d === "close" ? (
														<button key="close" type="button" className={`${styles.dirBtn} ${styles.closeBtn}`} onClick={closeOutline} disabled={!closer} aria-label={closer ? `Close the outline with ${format(closer.length)} ${closer.direction}` : "Close the outline"}>
															close
														</button>
													) : (
														<button key={d} type="button" className={styles.dirBtn} onClick={() => addSegment(d)} aria-label={`Add side going ${d}`}>
															{ARROWS[d]}
														</button>
													),
												)}
											</div>
										</div>
										<div className={`${styles.actions} mt-3`}>
											<button type="button" className={styles.btn} onClick={undo} disabled={state.segments.length === 0}>
												Undo
											</button>
											<button type="button" className={styles.btn} onClick={clear} disabled={state.segments.length === 0}>
												Clear
											</button>
											<label className={styles.check}>
												<input type="checkbox" checked={state.increment} onChange={(e) => set("increment")(e.target.checked)} />
												Increment mode
											</label>
										</div>
										<p className={styles.keys}>
											With this box focused: <kbd>Shift</kbd>+arrows add a side, <kbd>Shift</kbd>+<kbd>C</kbd> closes, <kbd>Shift</kbd>+<kbd>Z</kbd> undoes. Increment mode adds the length to the last side when the direction repeats.
										</p>
										{state.segments.length > 0 && (
											<ol className={`${styles.segments} mt-3`} aria-label="Sides">
												{state.segments.map((g, i) => (
													<li key={i} className={styles.segment}>
														{i + 1}. {ARROWS[g.direction]} {format(g.length)}
														{i === state.segments.length - 1 && (
															<button type="button" onClick={undo} aria-label={`Remove side ${i + 1}`}>
																×
															</button>
														)}
													</li>
												))}
											</ol>
										)}
										{!outline.closed && state.segments.length > 0 && <p className={styles.warn}>{closer ? `${format(closer.length)} ${closer.direction} would close the outline.` : `${format(outline.closingLength)} short of the start, and no single straight side closes it.`}</p>}
									</div>

									<h3 className={styles.subTitle}>Thickness and beams</h3>
									<DimensionInput id="slab-thick" label="Slab thickness" value={state.slabThickness} onChange={set("slabThickness")} />
									<div className="grid grid-cols-2 gap-3">
										<DimensionInput id="slab-eb-w" label="Edge beam width" value={state.edgeBeamWidth} onChange={set("edgeBeamWidth")} hint="0 for none" />
										<DimensionInput id="slab-eb-d" label="Edge beam depth" value={state.edgeBeamDepth} onChange={set("edgeBeamDepth")} hint="Total, slab included" />
									</div>
									<label className={styles.check}>
										<input type="checkbox" checked={state.fullPerimeter} onChange={(e) => set("fullPerimeter")(e.target.checked)} />
										Edge beam around the full perimeter
									</label>
									{!state.fullPerimeter && <DimensionInput id="slab-eb-len" label="Edge beam length" value={state.edgeBeamLength} onChange={set("edgeBeamLength")} />}
									<div className="grid grid-cols-3 gap-3">
										<DimensionInput id="slab-ib-len" label="Internal beam length" value={state.internalBeamLength} onChange={set("internalBeamLength")} hint="0 for none" />
										<DimensionInput id="slab-ib-w" label="Width" value={state.internalBeamWidth} onChange={set("internalBeamWidth")} />
										<DimensionInput id="slab-ib-d" label="Depth" value={state.internalBeamDepth} onChange={set("internalBeamDepth")} hint="Total" />
									</div>
									<label className={styles.check}>
										<input type="checkbox" checked={state.splayInternal} onChange={(e) => set("splayInternal")(e.target.checked)} />
										Splay internal beam sides at 45°
									</label>

									<h3 className={styles.subTitle}>Rebar and mesh</h3>
									<div className="grid grid-cols-3 gap-3">
										<NumberField id="slab-eb-bars" label="Edge beam bars" value={state.edgeBeamBars} onChange={(v) => set("edgeBeamBars")(int(v, 0, 20, 2))} step={1} />
										<NumberField id="slab-ib-bars" label="Internal beam bars" value={state.internalBeamBars} onChange={(v) => set("internalBeamBars")(int(v, 0, 20, 2))} step={1} />
										<DimensionInput id="slab-grid" label="Slab grid OC" value={state.gridSpacing} onChange={set("gridSpacing")} hint="0 for none" />
									</div>
									<div className="grid grid-cols-2 gap-3">
										<label className="flex flex-col gap-1">
											<span className={styles.label}>Bar size</span>
											<select className={styles.select} value={state.rebarSize} onChange={(e) => set("rebarSize")(e.target.value)}>
												{REBAR_SIZES.map((r) => (
													<option key={r.bar} value={r.bar}>
														{r.bar} · {r.diameter}&quot; · {r.weight} lb/ft
													</option>
												))}
											</select>
										</label>
										<DimensionInput id="slab-bar-len" label="Bar length" value={state.barLength} onChange={set("barLength")} />
										<NumberField id="slab-waste" label="Laps and waste" value={state.rebarWaste} onChange={set("rebarWaste")} unit="%" step="any" />
										<NumberField id="slab-bar-cost" label="Cost per bar" value={state.costPerBar} onChange={set("costPerBar")} prefix="$" step="any" />
										<label className="flex flex-col gap-1">
											<span className={styles.label}>Mesh</span>
											<select className={styles.select} value={state.meshSheet} onChange={(e) => set("meshSheet")(e.target.value)}>
												<option value="none">None</option>
												{MESH_SHEETS.map((m) => (
													<option key={m.id} value={m.id}>
														{m.label}
													</option>
												))}
											</select>
										</label>
										<NumberField id="slab-mesh-lap" label="Mesh laps" value={state.meshOverlap} onChange={set("meshOverlap")} unit="%" step="any" disabled={state.meshSheet === "none"} />
									</div>
								</div>
							</section>
							<section className={styles.card} aria-labelledby="slab-results">
								<h2 id="slab-results" className={styles.cardTitle}>
									Concrete and steel
								</h2>
								{slab ? <ResultList rows={slabRows} /> : <p className={styles.empty}>Close the outline to get volumes. The plan below shows what is still open.</p>}
								{slab && <p className={styles.warn}>Order a little over: ground is never perfectly level and formwork moves. 5 to 10% extra is usual.</p>}
							</section>
						</div>
						{state.segments.length > 0 && (
							<div className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
								<section className={styles.card} aria-labelledby="slab-plan">
									<h2 id="slab-plan" className={styles.cardTitle}>
										Plan
									</h2>
									<PrintDiagrams title="Slab plan" subtitle={outline.closed ? `${formatArea(outline.area, unitMode)}, perimeter ${format(outline.perimeter)}, drawn to fit` : "Outline not closed"}>
										<SlabPlan outline={outline} edgeBeamWidth={state.fullPerimeter ? (state.edgeBeamWidth ?? 0) : 0} format={format} />
									</PrintDiagrams>
								</section>
								<section className={styles.card} aria-labelledby="slab-section">
									<h2 id="slab-section" className={styles.cardTitle}>
										Section
									</h2>
									<SlabSection slabThickness={state.slabThickness ?? 0} edgeBeamWidth={state.edgeBeamWidth ?? 0} edgeBeamDepth={state.edgeBeamDepth ?? 0} internalBeamWidth={state.internalBeamLength ? (state.internalBeamWidth ?? 0) : 0} internalBeamDepth={state.internalBeamLength ? (state.internalBeamDepth ?? 0) : 0} splayInternal={state.splayInternal} format={format} />
									<p className={styles.legend}>Slab grey, edge beams violet, internal beam amber. Not to scale with the plan.</p>
								</section>
							</div>
						)}
					</>
				)}

				{state.mode === "premix" && (
					<div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
						<section className={styles.card} aria-labelledby="premix-heading">
							<h2 id="premix-heading" className={styles.cardTitle}>
								Premix bags
							</h2>
							<p className={styles.note}>Post holes and small slabs from bagged mix. Bags are rated at {PREMIX_DENSITY_LB_FT3} lb per cubic foot of placed concrete, so an 80 lb bag makes about 0.6 ft³.</p>
							<div className="flex flex-col gap-4">
								<h3 className={styles.subTitle}>Round holes</h3>
								<div className="grid grid-cols-3 gap-3">
									<NumberField id="pm-round-n" label="Holes" value={state.roundCount} onChange={(v) => set("roundCount")(int(v, 0, 10000, 0))} step={1} />
									<DimensionInput id="pm-round-d" label="Diameter" value={state.roundDiameter} onChange={set("roundDiameter")} />
									<DimensionInput id="pm-round-h" label="Depth" value={state.roundDepth} onChange={set("roundDepth")} />
								</div>
								<h3 className={styles.subTitle}>Rectangular holes</h3>
								<div className="grid grid-cols-4 gap-3">
									<NumberField id="pm-rect-n" label="Holes" value={state.rectCount} onChange={(v) => set("rectCount")(int(v, 0, 10000, 0))} step={1} />
									<DimensionInput id="pm-rect-w" label="Width" value={state.rectWidth} onChange={set("rectWidth")} />
									<DimensionInput id="pm-rect-l" label="Length" value={state.rectLength} onChange={set("rectLength")} />
									<DimensionInput id="pm-rect-h" label="Depth" value={state.rectDepth} onChange={set("rectDepth")} />
								</div>
								<h3 className={styles.subTitle}>Slab</h3>
								<div className="grid grid-cols-3 gap-3">
									<DimensionInput id="pm-slab-w" label="Width" value={state.pSlabWidth} onChange={set("pSlabWidth")} hint="0 for none" />
									<DimensionInput id="pm-slab-l" label="Length" value={state.pSlabLength} onChange={set("pSlabLength")} />
									<DimensionInput id="pm-slab-t" label="Thickness" value={state.pSlabThickness} onChange={set("pSlabThickness")} />
								</div>
								<h3 className={styles.subTitle}>Bags</h3>
								<div className="flex flex-wrap items-end gap-x-6 gap-y-3">
									<div className="flex flex-col gap-1">
										<span className={styles.label}>Bag weight</span>
										<SegmentedControl<string> label="Bag weight" size="sm" fill={false} value={`${state.bagWeight}`} onChange={(v) => set("bagWeight")(Number(v))} options={bagOptions} />
									</div>
									<NumberField id="pm-cost" label="Cost per bag" value={state.costPerBag} onChange={set("costPerBag")} prefix="$" step="any" className="w-32" />
								</div>
								<h3 className={styles.subTitle}>Bags to cubic feet</h3>
								<div className="flex flex-wrap items-end gap-3">
									<NumberField id="pm-convert" label="Bags" value={state.convertBags} onChange={(v) => set("convertBags")(int(v, 0, 10000, 10))} step={1} className="w-28" />
									<p className={styles.note}>
										{state.convertBags} × {state.bagWeight} lb bags make {(state.convertBags * bagYieldCubicFeet(state.bagWeight)).toFixed(2)} ft³ ({((state.convertBags * bagYieldCubicFeet(state.bagWeight)) / 27).toFixed(3)} yd³). One bag makes {bagYieldCubicFeet(state.bagWeight).toFixed(2)} ft³.
									</p>
								</div>
							</div>
						</section>
						<section className={styles.card} aria-labelledby="premix-results">
							<h2 id="premix-results" className={styles.cardTitle}>
								Bags to buy
							</h2>
							{premixRows.length ? <ResultList rows={premixRows} /> : <p className={styles.empty}>Enter at least one hole or slab.</p>}
							{premixRows.length > 0 && <p className={styles.warn}>Allow extra for waste and for holes that are dug a little bigger than planned. One or two spare bags is cheap insurance.</p>}
						</section>
					</div>
				)}

				{state.mode === "columns" && (
					<div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
						<section className={styles.card} aria-labelledby="col-heading">
							<h2 id="col-heading" className={styles.cardTitle}>
								Columns and footings
							</h2>
							<p className={styles.note}>Round or square columns on round or square footings. Enter 0 for any you do not have.</p>
							<div className="flex flex-col gap-4">
								<h3 className={styles.subTitle}>Round columns</h3>
								<div className="grid grid-cols-3 gap-3">
									<NumberField id="col-rc-n" label="Count" value={state.roundColumnCount} onChange={(v) => set("roundColumnCount")(int(v, 0, 10000, 0))} step={1} />
									<DimensionInput id="col-rc-d" label="Diameter" value={state.roundColumnDiameter} onChange={set("roundColumnDiameter")} />
									<DimensionInput id="col-rc-h" label="Height" value={state.roundColumnHeight} onChange={set("roundColumnHeight")} />
								</div>
								<h3 className={styles.subTitle}>Square columns</h3>
								<div className="grid grid-cols-4 gap-3">
									<NumberField id="col-sc-n" label="Count" value={state.squareColumnCount} onChange={(v) => set("squareColumnCount")(int(v, 0, 10000, 0))} step={1} />
									<DimensionInput id="col-sc-w" label="Width" value={state.squareColumnWidth} onChange={set("squareColumnWidth")} />
									<DimensionInput id="col-sc-l" label="Length" value={state.squareColumnLength} onChange={set("squareColumnLength")} />
									<DimensionInput id="col-sc-h" label="Height" value={state.squareColumnHeight} onChange={set("squareColumnHeight")} />
								</div>
								<h3 className={styles.subTitle}>Round footings</h3>
								<div className="grid grid-cols-3 gap-3">
									<NumberField id="col-rf-n" label="Count" value={state.roundFootingCount} onChange={(v) => set("roundFootingCount")(int(v, 0, 10000, 0))} step={1} />
									<DimensionInput id="col-rf-d" label="Diameter" value={state.roundFootingDiameter} onChange={set("roundFootingDiameter")} />
									<DimensionInput id="col-rf-h" label="Depth" value={state.roundFootingDepth} onChange={set("roundFootingDepth")} />
								</div>
								<h3 className={styles.subTitle}>Square footings</h3>
								<div className="grid grid-cols-4 gap-3">
									<NumberField id="col-sf-n" label="Count" value={state.squareFootingCount} onChange={(v) => set("squareFootingCount")(int(v, 0, 10000, 0))} step={1} />
									<DimensionInput id="col-sf-w" label="Width" value={state.squareFootingWidth} onChange={set("squareFootingWidth")} />
									<DimensionInput id="col-sf-l" label="Length" value={state.squareFootingLength} onChange={set("squareFootingLength")} />
									<DimensionInput id="col-sf-h" label="Depth" value={state.squareFootingDepth} onChange={set("squareFootingDepth")} />
								</div>
								<h3 className={styles.subTitle}>Bags</h3>
								<div className="flex flex-wrap items-end gap-x-6 gap-y-3">
									<div className="flex flex-col gap-1">
										<span className={styles.label}>Bag weight</span>
										<SegmentedControl<string> label="Bag weight" size="sm" fill={false} value={`${state.cBagWeight}`} onChange={(v) => set("cBagWeight")(Number(v))} options={bagOptions} />
									</div>
									<NumberField id="col-cost" label="Cost per bag" value={state.cCostPerBag} onChange={set("cCostPerBag")} prefix="$" step="any" className="w-32" />
								</div>
							</div>
						</section>
						<section className={styles.card} aria-labelledby="col-results">
							<h2 id="col-results" className={styles.cardTitle}>
								Concrete
							</h2>
							{columnRows.length ? <ResultList rows={columnRows} /> : <p className={styles.empty}>Enter at least one column or footing.</p>}
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
