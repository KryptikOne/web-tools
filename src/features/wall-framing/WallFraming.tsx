"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import SegmentedControl from "@/components/SegmentedControl";
import { UnitAndPrecisionBar, DimensionInput, NumberField, ResultList, RunningList, PrintDiagrams, LumberTable, ShareCalculation, ConstructionNotes } from "@/components/construction";
import type { ResultRow } from "@/components/construction";
import { useConstructionUnits } from "@/hooks/useConstructionUnits";
import { nominalToActual } from "@/lib/construction/imperialUtils";
import { sectionOf } from "@/lib/construction/lumberUtils";
import { studLayout, framingQuantities, END_STYLES, STUD_CENTERS, type EndStyle, type SheetWidth } from "@/lib/construction/framingUtils";
import type { MarkReference } from "@/lib/construction/spacingUtils";
import WallDiagram from "./WallDiagram";
import styles from "./WallFraming.module.scss";

type StudSize = "2x4" | "2x6";

interface FramingState {
	// layout
	wallLength: number | null;
	sheetWidth: SheetWidth;
	centers: number;
	studSize: StudSize;
	studHeight: number | null;
	startWith: EndStyle;
	endWith: EndStyle;
	sheetStart: "exterior" | "interior";
	orthogonalWalls: boolean;
	firstStudOffset: number | null;
	rakeAngle: number;
	drawSheeting: boolean;
	heightToScale: boolean;
	reference: MarkReference;
	// quantities
	totalLength: number | null;
	bottomPlates: number;
	topPlates: number;
	noggingRows: number;
	corners: number;
	extraPerCorner: number;
	ends: number;
	extraPerEnd: number;
	openings: number;
	extraPerOpening: number;
	stockLength: number | null;
	costPer1000Bft: number;
}

const DEFAULTS: FramingState = {
	wallLength: 144,
	sheetWidth: 48,
	centers: 16,
	studSize: "2x4",
	studHeight: 92.625,
	startWith: "single",
	endWith: "single",
	sheetStart: "exterior",
	orthogonalWalls: false,
	firstStudOffset: 0,
	rakeAngle: 0,
	drawSheeting: true,
	heightToScale: false,
	reference: "near",
	totalLength: 480,
	bottomPlates: 1,
	topPlates: 2,
	noggingRows: 1,
	corners: 4,
	extraPerCorner: 2,
	ends: 0,
	extraPerEnd: 1,
	openings: 2,
	extraPerOpening: 4,
	stockLength: 192,
	costPer1000Bft: 800,
};

const PLATE_THICKNESS = 1.5;
const CENTER_OPTIONS = STUD_CENTERS.map((c) => ({ value: `${c}`, label: `${c}"` }));
const SIZE_OPTIONS: { value: StudSize; label: string }[] = [
	{ value: "2x4", label: "2x4" },
	{ value: "2x6", label: "2x6" },
];
const SHEET_OPTIONS: { value: "48" | "96"; label: string }[] = [
	{ value: "48", label: `4'` },
	{ value: "96", label: `8'` },
];

const num = (v: unknown, lo: number, hi: number, fallback: number | null): number | null => (typeof v === "number" && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : fallback);
const oneOf = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T => (allowed.includes(v as T) ? (v as T) : fallback);
const int = (v: unknown, lo: number, hi: number, fb: number) => Math.round(num(v, lo, hi, fb) ?? fb);
const END_VALUES = END_STYLES.map((e) => e.value);

function sanitize(s: Partial<FramingState>): FramingState {
	return {
		wallLength: num(s.wallLength, 3, 10000, DEFAULTS.wallLength),
		sheetWidth: s.sheetWidth === 96 ? 96 : 48,
		centers: STUD_CENTERS.includes(s.centers as 16) ? (s.centers as number) : DEFAULTS.centers,
		studSize: oneOf(s.studSize, ["2x4", "2x6"] as const, DEFAULTS.studSize),
		studHeight: num(s.studHeight, 1, 1000, DEFAULTS.studHeight),
		startWith: oneOf(s.startWith, END_VALUES, DEFAULTS.startWith),
		endWith: oneOf(s.endWith, END_VALUES, DEFAULTS.endWith),
		sheetStart: oneOf(s.sheetStart, ["exterior", "interior"] as const, DEFAULTS.sheetStart),
		orthogonalWalls: typeof s.orthogonalWalls === "boolean" ? s.orthogonalWalls : DEFAULTS.orthogonalWalls,
		firstStudOffset: num(s.firstStudOffset, -100, 100, DEFAULTS.firstStudOffset),
		rakeAngle: num(s.rakeAngle, 0, 60, DEFAULTS.rakeAngle) ?? DEFAULTS.rakeAngle,
		drawSheeting: typeof s.drawSheeting === "boolean" ? s.drawSheeting : DEFAULTS.drawSheeting,
		heightToScale: typeof s.heightToScale === "boolean" ? s.heightToScale : DEFAULTS.heightToScale,
		reference: oneOf(s.reference, ["near", "center", "far"] as const, DEFAULTS.reference),
		totalLength: num(s.totalLength, 1, 1e6, DEFAULTS.totalLength),
		bottomPlates: int(s.bottomPlates, 0, 2, DEFAULTS.bottomPlates),
		topPlates: int(s.topPlates, 0, 2, DEFAULTS.topPlates),
		noggingRows: int(s.noggingRows, 0, 5, DEFAULTS.noggingRows),
		corners: int(s.corners, 0, 100, DEFAULTS.corners),
		extraPerCorner: int(s.extraPerCorner, 1, 3, DEFAULTS.extraPerCorner),
		ends: int(s.ends, 0, 100, DEFAULTS.ends),
		extraPerEnd: int(s.extraPerEnd, 1, 3, DEFAULTS.extraPerEnd),
		openings: int(s.openings, 0, 100, DEFAULTS.openings),
		extraPerOpening: int(s.extraPerOpening, 1, 4, DEFAULTS.extraPerOpening),
		stockLength: num(s.stockLength, 12, 1000, DEFAULTS.stockLength),
		costPer1000Bft: num(s.costPer1000Bft, 0, 1e6, DEFAULTS.costPer1000Bft) ?? DEFAULTS.costPer1000Bft,
	};
}

export default function WallFraming() {
	const { format } = useConstructionUnits();
	const [state, setState] = useState<FramingState>(DEFAULTS);
	const set = <K extends keyof FramingState>(key: K) => (value: FramingState[K]) => setState((s) => ({ ...s, [key]: value }));
	const size = nominalToActual(state.studSize)!;
	// 19.2" centres are a five-per-sheet layout that only works on 8' sheets
	const sheetWidth: SheetWidth = state.centers === 19.2 ? 96 : state.sheetWidth;

	const layout = useMemo(
		() =>
			state.wallLength === null || state.studHeight === null || state.firstStudOffset === null
				? null
				: studLayout({
						wallLength: state.wallLength,
						studWidth: size.width,
						studDepth: size.depth,
						centers: state.centers,
						sheetWidth,
						startWith: state.startWith,
						endWith: state.endWith,
						firstStudOffset: state.firstStudOffset,
						sheetStart: state.sheetStart,
						orthogonalWalls: state.orthogonalWalls,
						studHeight: state.studHeight,
						rakeAngle: state.rakeAngle,
					}),
		[state.wallLength, state.studHeight, state.firstStudOffset, size.width, size.depth, state.centers, sheetWidth, state.startWith, state.endWith, state.sheetStart, state.orthogonalWalls, state.rakeAngle],
	);
	const layoutRows: ResultRow[] = layout
		? [
				{ label: "Studs", value: `${layout.count}`, strong: true, hint: `${layout.commonCount} on layout, ${layout.count - layout.commonCount} at the ends` },
				{ label: "Sheets", value: `${layout.sheets.length}`, hint: layout.sheets.length ? `last one ${format(layout.sheets[layout.sheets.length - 1].width)} wide` : "" },
				{ label: "Sheet joints backed", value: `${layout.joints.filter((j) => j.overStud).length} of ${layout.joints.length}`, strong: layout.joints.some((j) => !j.overStud) },
				...(state.rakeAngle > 0 && layout.studs.length ? [{ label: "Stud lengths", value: `${format(layout.studs[0].height)} to ${format(layout.studs[layout.studs.length - 1].height)}`, hint: "rising along the rake" }] : []),
			]
		: [];
	const kindLabel = (k: "end" | "common" | "flat") => (k === "common" ? "Stud" : k === "flat" ? "Flat stud" : "End stud");
	const positions = layout ? layout.studs.map((s) => s[state.reference]) : [];

	const quantities = useMemo(
		() =>
			state.totalLength === null || state.studHeight === null || state.stockLength === null
				? null
				: framingQuantities({
						totalLength: state.totalLength,
						studHeight: state.studHeight,
						centers: state.centers,
						section: sectionOf(size),
						bottomPlates: state.bottomPlates,
						topPlates: state.topPlates,
						noggingRows: state.noggingRows,
						corners: state.corners,
						extraPerCorner: state.extraPerCorner,
						ends: state.ends,
						extraPerEnd: state.extraPerEnd,
						openings: state.openings,
						extraPerOpening: state.extraPerOpening,
						stockLength: state.stockLength,
						costPer1000Bft: state.costPer1000Bft,
					}),
		[state.totalLength, state.studHeight, state.stockLength, state.centers, size, state.bottomPlates, state.topPlates, state.noggingRows, state.corners, state.extraPerCorner, state.ends, state.extraPerEnd, state.openings, state.extraPerOpening, state.costPer1000Bft],
	);
	const quantityRows: ResultRow[] = quantities
		? [
				{ label: "Studs", value: `${quantities.studs}`, strong: true, hint: `${quantities.commonStuds} on layout + ${quantities.extraStuds} for corners, ends and openings` },
				{ label: "Plate stock", value: `${quantities.platePieces} × ${format(state.stockLength!)}`, strong: true, hint: `${quantities.plateLinearFeet.toFixed(1)} linear ft` },
				{ label: "Nogging stock", value: `${quantities.noggingPieces} × ${format(state.stockLength!)}`, hint: `${quantities.noggingLinearFeet.toFixed(1)} linear ft` },
				{ label: "Total linear feet", value: quantities.totalLinearFeet.toFixed(1) },
				{ label: "Board feet", value: quantities.boardFeet.toFixed(1) },
				{ label: "Cost", value: `$${quantities.cost.toFixed(2)}`, strong: true, hint: `at $${state.costPer1000Bft} per 1000 bft` },
			]
		: [];

	const endSelect = (id: string, label: string, key: "startWith" | "endWith") => (
		<label className="flex flex-col gap-1">
			<span className={styles.label}>{label}</span>
			<select id={id} className={styles.select} value={state[key]} onChange={(e) => set(key)(e.target.value as EndStyle)}>
				{END_STYLES.map((o) => (
					<option key={o.value} value={o.value}>
						{o.label}
					</option>
				))}
			</select>
		</label>
	);

	return (
		<div className={styles.container}>
			<div className="flex flex-col gap-6">
				<UnitAndPrecisionBar />

				{/* Stud layout */}
				<div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
					<section className={styles.card} aria-labelledby="wf-layout-heading">
						<h2 id="wf-layout-heading" className={styles.cardTitle}>
							Stud layout
						</h2>
						<p className={styles.note}>Stud centres sit on multiples of the spacing from the start of the wall so sheet edges land on a stud. Mark the near side from the running list.</p>
						<div className="flex flex-col gap-4">
							<DimensionInput id="wf-length" label="Wall length" value={state.wallLength} onChange={set("wallLength")} min={24} max={720} step={1} />
							<div className="grid grid-cols-2 gap-3">
								<DimensionInput id="wf-height" label="Stud height" value={state.studHeight} onChange={set("studHeight")} hint={`92 5/8" for an 8' wall`} />
								<DimensionInput id="wf-offset" label="First stud offset" value={state.firstStudOffset} onChange={set("firstStudOffset")} hint="Shifts the layout" />
							</div>
							<div className="flex flex-wrap items-end gap-x-6 gap-y-3">
								<div className="flex flex-col gap-1">
									<span className={styles.label}>Stud centers</span>
									<SegmentedControl<string> label="Stud centers" size="sm" fill={false} value={`${state.centers}`} onChange={(v) => set("centers")(Number(v))} options={CENTER_OPTIONS} />
								</div>
								<div className="flex flex-col gap-1">
									<span className={styles.label}>Studs</span>
									<SegmentedControl<StudSize> label="Stud size" size="sm" fill={false} value={state.studSize} onChange={set("studSize")} options={SIZE_OPTIONS} />
								</div>
								<div className="flex flex-col gap-1">
									<span className={styles.label}>Sheet width</span>
									<SegmentedControl<"48" | "96"> label="Sheet width" size="sm" fill={false} value={`${sheetWidth}` as "48" | "96"} onChange={(v) => set("sheetWidth")(Number(v) as SheetWidth)} options={SHEET_OPTIONS.map((o) => ({ ...o, disabled: state.centers === 19.2 && o.value === "48" }))} />
								</div>
							</div>
							<div className="grid grid-cols-2 gap-3">
								{endSelect("wf-start", "Start with", "startWith")}
								{endSelect("wf-end", "End with", "endWith")}
							</div>
							<div className="flex flex-wrap items-end gap-x-6 gap-y-3">
								<div className="flex flex-col gap-1">
									<span className={styles.label}>Sheeting starts</span>
									<SegmentedControl<"exterior" | "interior">
										label="Sheeting starts"
										size="sm"
										fill={false}
										value={state.sheetStart}
										onChange={set("sheetStart")}
										options={[
											{ value: "exterior", label: "Exterior" },
											{ value: "interior", label: "Interior" },
										]}
									/>
								</div>
								<NumberField id="wf-rake" label="Rake angle" value={state.rakeAngle} onChange={set("rakeAngle")} unit="°" min={0} max={60} step="any" className="w-36" />
							</div>
							<div className="flex flex-wrap gap-x-6 gap-y-2">
								<label className={styles.check}>
									<input type="checkbox" checked={state.orthogonalWalls} onChange={(e) => set("orthogonalWalls")(e.target.checked)} />
									Orthogonal walls at both ends
								</label>
								<label className={styles.check}>
									<input type="checkbox" checked={state.drawSheeting} onChange={(e) => set("drawSheeting")(e.target.checked)} />
									Draw sheeting
								</label>
								<label className={styles.check}>
									<input type="checkbox" checked={state.heightToScale} onChange={(e) => set("heightToScale")(e.target.checked)} />
									Height to scale
								</label>
							</div>
						</div>
					</section>
					<section className={styles.card} aria-labelledby="wf-layout-results">
						<h2 id="wf-layout-results" className={styles.cardTitle}>
							Layout
						</h2>
						{layout ? <ResultList rows={layoutRows} /> : <p className={styles.empty}>Enter a wall at least two studs long and a stud height.</p>}
						{layout?.warnings.map((w) => (
							<p key={w} className={styles.warn}>
								{w}
							</p>
						))}
						{layout && state.rakeAngle > 0 && (
							<p className={styles.note}>
								Lengths here are to the stud centre. For long and short points, plate allowances and a full gable end use the <Link href="/tools/gable-studs">gable studs calculator</Link>.
							</p>
						)}
						{layout && state.rakeAngle > 0 && (
							<table className={`${styles.studTable} mt-4`} aria-label="Stud lengths along the rake">
								<thead>
									<tr>
										<th scope="col">#</th>
										<th scope="col">At</th>
										<th scope="col">Length</th>
									</tr>
								</thead>
								<tbody>
									{layout.studs.map((s) => (
										<tr key={s.index}>
											<td className="mono">{s.index}</td>
											<td className="mono">{format(s.center)}</td>
											<td className="mono">{format(s.height)}</td>
										</tr>
									))}
								</tbody>
							</table>
						)}
					</section>
				</div>

				{layout && state.wallLength !== null && state.studHeight !== null && (
					<>
						<section className={styles.card} aria-labelledby="wf-diagram">
							<h2 id="wf-diagram" className={styles.cardTitle}>
								Wall
							</h2>
							<PrintDiagrams title="Wall framing" subtitle={`${format(state.wallLength)} wall, ${state.studSize} studs at ${state.centers}" centers, ${layout.count} studs, drawn to fit`}>
								<WallDiagram layout={layout} wallLength={state.wallLength} studHeight={state.studHeight} plateThickness={PLATE_THICKNESS} topPlates={state.topPlates} rakeAngle={state.rakeAngle} drawSheeting={state.drawSheeting} heightToScale={state.heightToScale} format={format} />
							</PrintDiagrams>
							<p className={styles.legend}>
								<span className={styles.common}>Studs on layout</span>
								<span className={styles.end}>End studs</span>
								<span className={styles.flat}>Flat studs</span>
								<span>Sheet joints in violet have a stud behind them; amber ones do not.</span>
							</p>
						</section>
						<RunningList title="Stud mark-out" positions={positions} reference={state.reference} onReferenceChange={set("reference")} labelFor={(i) => kindLabel(layout.studs[i].kind)} />
					</>
				)}

				{/* Quantities */}
				<div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
					<section className={styles.card} aria-labelledby="wf-qty-heading">
						<h2 id="wf-qty-heading" className={styles.cardTitle}>
							Lumber quantities
						</h2>
						<p className={styles.note}>For all the walls together. Studs on layout are one per spacing plus one, then extras for each corner, wall end and opening. Plates and noggings run the total length.</p>
						<div className="flex flex-col gap-4">
							<DimensionInput id="wf-total" label="Total wall length" value={state.totalLength} onChange={set("totalLength")} />
							<div className="grid grid-cols-3 gap-3">
								<NumberField id="wf-bottom" label="Bottom plates" value={state.bottomPlates} onChange={(v) => set("bottomPlates")(int(v, 0, 2, 1))} min={0} max={2} step={1} />
								<NumberField id="wf-top" label="Top plates" value={state.topPlates} onChange={(v) => set("topPlates")(int(v, 0, 2, 2))} min={0} max={2} step={1} />
								<NumberField id="wf-noggings" label="Nogging rows" value={state.noggingRows} onChange={(v) => set("noggingRows")(int(v, 0, 5, 1))} min={0} max={5} step={1} />
							</div>
							<div className="grid grid-cols-2 gap-3">
								<NumberField id="wf-corners" label="Corners" value={state.corners} onChange={(v) => set("corners")(int(v, 0, 100, 4))} min={0} max={100} step={1} />
								<NumberField id="wf-corner-extra" label="Extra studs each" value={state.extraPerCorner} onChange={(v) => set("extraPerCorner")(int(v, 1, 3, 2))} min={1} max={3} step={1} />
								<NumberField id="wf-ends" label="Wall ends" value={state.ends} onChange={(v) => set("ends")(int(v, 0, 100, 0))} min={0} max={100} step={1} hint="Free ends and T junctions" />
								<NumberField id="wf-end-extra" label="Extra studs each" value={state.extraPerEnd} onChange={(v) => set("extraPerEnd")(int(v, 1, 3, 1))} min={1} max={3} step={1} />
								<NumberField id="wf-openings" label="Openings" value={state.openings} onChange={(v) => set("openings")(int(v, 0, 100, 2))} min={0} max={100} step={1} />
								<NumberField id="wf-opening-extra" label="Extra studs each" value={state.extraPerOpening} onChange={(v) => set("extraPerOpening")(int(v, 1, 4, 4))} min={1} max={4} step={1} hint="King and jack studs" />
							</div>
							<div className="grid grid-cols-2 gap-3">
								<DimensionInput id="wf-stock" label="Plate stock length" value={state.stockLength} onChange={set("stockLength")} />
								<NumberField id="wf-cost" label="Price per 1000 bft" value={state.costPer1000Bft} onChange={set("costPer1000Bft")} prefix="$" step="any" />
							</div>
						</div>
					</section>
					<section className={styles.card} aria-labelledby="wf-qty-results">
						<h2 id="wf-qty-results" className={styles.cardTitle}>
							Order
						</h2>
						{quantities ? <ResultList rows={quantityRows} /> : <p className={styles.empty}>Enter a total length, stud height and stock length.</p>}
					</section>
				</div>

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
