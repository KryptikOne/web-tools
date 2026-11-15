"use client";

import { useMemo, useState } from "react";
import SegmentedControl from "@/components/SegmentedControl";
import { UnitAndPrecisionBar, DimensionInput, NumberField, ResultList, RunningList, PrintDiagrams, LumberTable, ShareCalculation, ConstructionNotes, SpacingDiagram, StairBalusterDiagram } from "@/components/construction";
import type { ResultRow } from "@/components/construction";
import { useConstructionUnits } from "@/hooks/useConstructionUnits";
import { balusterRun, panelGap, stairBalusters } from "@/lib/construction/balusterUtils";
import { runningPositions, type EndMembers, type MarkReference, type SpacingResult } from "@/lib/construction/spacingUtils";
import { formatAngle } from "@/lib/construction/pitchUtils";
import styles from "./BalusterCalculator.module.scss";

type Section = "run" | "panel" | "stair";

interface BalusterState {
	section: Section;
	// 1. quantity, centers and spacing (inches / degrees)
	length: number | null;
	width: number | null;
	height: number | null;
	rakeAngle: number;
	infillHeight: number | null;
	endMembers: EndMembers;
	maxGap: number | null;
	maxCenters: number | null;
	reference: MarkReference;
	// 2. unequal panels
	panelLength: number | null;
	panelWidth: number | null;
	panelGap: number | null;
	panelHeight: number | null;
	panelReference: MarkReference;
	// 3. stairs
	run: number | null;
	nosing: number | null;
	stairWidth: number | null;
	perTread: number;
	rise: number | null;
	riserThickness: number | null;
	treadThickness: number | null;
	treads: number;
	stairReference: MarkReference;
}

const DEFAULTS: BalusterState = {
	section: "run",
	length: 72,
	width: 1.5,
	height: 32,
	rakeAngle: 0,
	infillHeight: 32,
	endMembers: "none",
	maxGap: 4,
	maxCenters: null,
	reference: "center",
	panelLength: 40,
	panelWidth: 1.5,
	panelGap: 3.75,
	panelHeight: 32,
	panelReference: "center",
	run: 10,
	nosing: 1,
	stairWidth: 1.25,
	perTread: 2,
	rise: 7.5,
	riserThickness: 0.75,
	treadThickness: 1,
	treads: 3,
	stairReference: "center",
};

const SECTIONS: { value: Section; label: string }[] = [
	{ value: "run", label: "Quantity" },
	{ value: "panel", label: "Panels" },
	{ value: "stair", label: "Stairs" },
];
const END_OPTIONS: { value: EndMembers; label: string }[] = [
	{ value: "none", label: "None" },
	{ value: "one", label: "One end" },
	{ value: "both", label: "Both ends" },
];
const PER_TREAD: { value: "2" | "3" | "4"; label: string }[] = [
	{ value: "2", label: "2" },
	{ value: "3", label: "3" },
	{ value: "4", label: "4" },
];

const num = (v: unknown, lo: number, hi: number, fallback: number | null): number | null => (typeof v === "number" && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : fallback);
const oneOf = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T => (allowed.includes(v as T) ? (v as T) : fallback);
const REFS = ["near", "center", "far"] as const;

/** Shared links are untrusted: coerce every field back into a sane range. */
function sanitize(s: Partial<BalusterState>): BalusterState {
	const len = (v: unknown, fb: number | null) => num(v, 0.01, 100000, fb);
	return {
		section: oneOf(s.section, ["run", "panel", "stair"] as const, DEFAULTS.section),
		length: len(s.length, DEFAULTS.length),
		width: len(s.width, DEFAULTS.width),
		height: len(s.height, DEFAULTS.height),
		rakeAngle: num(s.rakeAngle, 0, 60, DEFAULTS.rakeAngle) ?? DEFAULTS.rakeAngle,
		infillHeight: len(s.infillHeight, DEFAULTS.infillHeight),
		endMembers: oneOf(s.endMembers, ["none", "one", "both"] as const, DEFAULTS.endMembers),
		maxGap: len(s.maxGap, DEFAULTS.maxGap),
		maxCenters: s.maxCenters === null ? null : len(s.maxCenters, null),
		reference: oneOf(s.reference, REFS, DEFAULTS.reference),
		panelLength: len(s.panelLength, DEFAULTS.panelLength),
		panelWidth: len(s.panelWidth, DEFAULTS.panelWidth),
		panelGap: num(s.panelGap, 0, 100000, DEFAULTS.panelGap),
		panelHeight: len(s.panelHeight, DEFAULTS.panelHeight),
		panelReference: oneOf(s.panelReference, REFS, DEFAULTS.panelReference),
		run: len(s.run, DEFAULTS.run),
		nosing: num(s.nosing, 0, 100, DEFAULTS.nosing),
		stairWidth: len(s.stairWidth, DEFAULTS.stairWidth),
		perTread: Math.round(num(s.perTread, 2, 4, DEFAULTS.perTread) ?? DEFAULTS.perTread),
		rise: len(s.rise, DEFAULTS.rise),
		riserThickness: num(s.riserThickness, 0, 100, DEFAULTS.riserThickness),
		treadThickness: num(s.treadThickness, 0, 100, DEFAULTS.treadThickness),
		treads: Math.round(num(s.treads, 1, 30, DEFAULTS.treads) ?? DEFAULTS.treads),
		stairReference: oneOf(s.stairReference, REFS, DEFAULTS.stairReference),
	};
}

export default function BalusterCalculator() {
	const { format } = useConstructionUnits();
	const [state, setState] = useState<BalusterState>(DEFAULTS);
	const set = <K extends keyof BalusterState>(key: K) => (value: BalusterState[K]) => setState((s) => ({ ...s, [key]: value }));

	return (
		<div className={styles.container}>
			<div className="flex flex-col gap-6">
				<UnitAndPrecisionBar />
				<div className="flex flex-col gap-1">
					<span className={styles.label}>Section</span>
					<SegmentedControl<Section> label="Section" value={state.section} onChange={set("section")} options={SECTIONS} />
				</div>

				{state.section === "run" && <RunSection state={state} set={set} format={format} />}
				{state.section === "panel" && <PanelSection state={state} set={set} format={format} />}
				{state.section === "stair" && <StairSection state={state} set={set} format={format} />}

				<p className={styles.note}>Centers and gaps are shown rounded to the site precision, so the rounded spacing times the number of spaces may not add up to the total length. Mark out from the running measurements, which are each measured from the same start.</p>

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

interface SectionProps {
	state: BalusterState;
	set: <K extends keyof BalusterState>(key: K) => (value: BalusterState[K]) => void;
	format: (inches: number) => string;
}

// ── 1. Quantity, centers and spacing ─────────────────────────────────────────

function RunSection({ state, set, format }: SectionProps) {
	const result = useMemo(
		() =>
			state.length === null || state.width === null || state.maxGap === null
				? null
				: balusterRun({ length: state.length, width: state.width, endMembers: state.endMembers, maxGap: state.maxGap, maxCenters: state.maxCenters ?? undefined, rakeAngle: state.rakeAngle }),
		[state.length, state.width, state.endMembers, state.maxGap, state.maxCenters, state.rakeAngle],
	);
	const raked = state.rakeAngle > 0;
	const rows: ResultRow[] = result
		? [
				{ label: "Balusters", value: `${result.count}`, strong: true },
				{ label: "Centers", value: format(result.centers), strong: true, hint: raked ? "horizontal" : "centre to centre" },
				{ label: "Gap", value: format(result.gap), strong: true, hint: raked ? "horizontal, as code measures it" : "clear between balusters" },
				...(raked
					? [
							{ label: "Centers along rail", value: format(result.centers * result.rakeFactor) },
							{ label: "Horizontal length", value: format(result.horizontalLength), hint: `rail length × cos ${formatAngle(state.rakeAngle, 1)}` },
						]
					: []),
				{ label: "First space", value: format(result.firstGap) },
				{ label: "Last space", value: format(result.lastGap) },
			]
		: [];

	return (
		<>
			<div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
				<section className={styles.card} aria-labelledby="bal-run-heading">
					<h2 id="bal-run-heading" className={styles.cardTitle}>
						Quantity, centers and spacing
					</h2>
					<p className={styles.note}>The fewest balusters that keep every gap under the code gap, spaced equally. Set the rail angle for a raked rail: balusters stay plumb and the gap is measured horizontally.</p>
					<div className="flex flex-col gap-4">
						<DimensionInput id="bal-length" label="Length" value={state.length} onChange={set("length")} min={12} max={480} step={1} hint={raked ? "Along the rail, post to post" : "Between posts"} />
						<div className="grid grid-cols-2 gap-3">
							<DimensionInput id="bal-width" label="Baluster width" value={state.width} onChange={set("width")} hint="Actual size" />
							<DimensionInput id="bal-height" label="Baluster height" value={state.height} onChange={set("height")} hint="Drawing only" />
						</div>
						<div className="grid grid-cols-2 gap-3">
							<NumberField id="bal-angle" label="Rail angle" value={state.rakeAngle} onChange={set("rakeAngle")} unit="°" min={0} max={60} step="any" hint="0° is level" />
							{raked && <DimensionInput id="bal-infill" label="Infill height" value={state.infillHeight} onChange={set("infillHeight")} hint="Plumb, tread to rail" />}
						</div>
						<div className="flex flex-col gap-1">
							<span className={styles.label}>End balusters</span>
							<SegmentedControl<EndMembers> label="End balusters" size="sm" value={state.endMembers} onChange={set("endMembers")} options={END_OPTIONS} />
						</div>
						<div className="grid grid-cols-2 gap-3">
							<DimensionInput id="bal-maxgap" label="Maximum gap" value={state.maxGap} onChange={set("maxGap")} hint="Code gap, often 4 in or 100 mm" />
							<DimensionInput id="bal-maxcenters" label="Maximum centers" value={state.maxCenters} onChange={set("maxCenters")} hint="Optional" />
						</div>
					</div>
				</section>
				<section className={styles.card} aria-labelledby="bal-run-results">
					<h2 id="bal-run-results" className={styles.cardTitle}>
						Results
					</h2>
					{result ? <ResultList rows={rows} /> : <p className={styles.empty}>Enter a length, a baluster width narrower than it and a maximum gap.</p>}
					{result?.warnings.includes("negative-gap") && <p className={styles.warn}>Balusters overlap at this gap and width.</p>}
				</section>
			</div>
			{result && state.length !== null && state.height !== null && (
				<>
					<section className={styles.card} aria-labelledby="bal-run-diagram">
						<h2 id="bal-run-diagram" className={styles.cardTitle}>
							Layout
						</h2>
						<PrintDiagrams title="Baluster layout" subtitle={`${result.count} balusters over ${format(result.horizontalLength)}${raked ? " horizontal" : ""}, ${format(result.centers)} centers, ${format(result.gap)} gap, drawn to fit`}>
							<SpacingDiagram result={result} totalLength={result.horizontalLength} memberHeight={raked && state.infillHeight ? state.infillHeight : state.height} angle={90} format={format} />
						</PrintDiagrams>
						{raked && <p className={styles.note}>Drawn on the horizontal. Multiply any horizontal measure by {result.rakeFactor.toFixed(4)} to read it along the rail.</p>}
					</section>
					<RunningList title="Running measurements" positions={runningPositions(result, state.reference).map((p) => p * result.rakeFactor)} reference={state.reference} onReferenceChange={set("reference")} labelFor={(i) => `Baluster ${i + 1}`} />
				</>
			)}
		</>
	);
}

// ── 2. Unequal panels ────────────────────────────────────────────────────────

function PanelSection({ state, set, format }: SectionProps) {
	const result = useMemo(
		() => (state.panelLength === null || state.panelWidth === null || state.panelGap === null ? null : panelGap({ length: state.panelLength, width: state.panelWidth, gap: state.panelGap })),
		[state.panelLength, state.panelWidth, state.panelGap],
	);
	const spacing: SpacingResult | null =
		result && state.panelWidth !== null && state.panelGap !== null
			? { members: result.members, count: result.count, centers: state.panelWidth + state.panelGap, gap: state.panelGap, firstGap: result.endGap, lastGap: result.endGap, warnings: [] }
			: null;
	const rows: ResultRow[] = result
		? [
				{ label: "Balusters", value: `${result.count}`, strong: true },
				{ label: "End gap", value: format(result.endGap), strong: true, hint: "at each post, so the middle gaps match" },
				{ label: "Matching gap", value: format(state.panelGap!), hint: "between balusters" },
				{ label: "Centers", value: format(state.panelWidth! + state.panelGap!) },
			]
		: [];

	return (
		<>
			<div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
				<section className={styles.card} aria-labelledby="bal-panel-heading">
					<h2 id="bal-panel-heading" className={styles.cardTitle}>
						Unequal panels, matching gap
					</h2>
					<p className={styles.note}>When panels between posts differ in length, keep the gap between balusters the same in every panel and let the gap at each post take up the difference. Enter one panel at a time.</p>
					<div className="flex flex-col gap-4">
						<DimensionInput id="bal-panel-length" label="Panel length" value={state.panelLength} onChange={set("panelLength")} min={6} max={240} step={0.5} hint="Clear between posts" />
						<div className="grid grid-cols-2 gap-3">
							<DimensionInput id="bal-panel-width" label="Baluster width" value={state.panelWidth} onChange={set("panelWidth")} />
							<DimensionInput id="bal-panel-height" label="Baluster height" value={state.panelHeight} onChange={set("panelHeight")} hint="Drawing only" />
						</div>
						<DimensionInput id="bal-panel-gap" label="Gap to match" value={state.panelGap} onChange={set("panelGap")} hint="The gap used in the other panels" />
					</div>
				</section>
				<section className={styles.card} aria-labelledby="bal-panel-results">
					<h2 id="bal-panel-results" className={styles.cardTitle}>
						Results
					</h2>
					{result ? <ResultList rows={rows} /> : <p className={styles.empty}>Enter a panel length, baluster width and the gap to match.</p>}
					{result && (
						<>
							<h3 className={`${styles.cardTitle} mt-4`}>Options with equal gaps</h3>
							<p className={styles.note}>If you would rather every gap in this panel be equal, including at the posts:</p>
							<table className={styles.table} aria-label="Options with equal gaps">
								<thead>
									<tr>
										<th scope="col">Balusters</th>
										<th scope="col">Every gap</th>
										<th scope="col">Centers</th>
									</tr>
								</thead>
								<tbody>
									{result.equalOptions.map((o) => (
										<tr key={o.count} className={o.count === result.count ? styles.activeRow : ""}>
											<td className={styles.mono}>{o.count}</td>
											<td className={styles.mono}>{format(o.gap)}</td>
											<td className={styles.mono}>{format(o.gap + state.panelWidth!)}</td>
										</tr>
									))}
								</tbody>
							</table>
						</>
					)}
				</section>
			</div>
			{spacing && state.panelLength !== null && state.panelHeight !== null && (
				<>
					<section className={styles.card} aria-labelledby="bal-panel-diagram">
						<h2 id="bal-panel-diagram" className={styles.cardTitle}>
							Panel layout
						</h2>
						<PrintDiagrams title="Panel layout" subtitle={`${spacing.count} balusters over ${format(state.panelLength)}, ${format(spacing.gap)} gaps, ${format(spacing.firstGap)} at each post, drawn to fit`}>
							<SpacingDiagram result={spacing} totalLength={state.panelLength} memberHeight={state.panelHeight} angle={90} format={format} />
						</PrintDiagrams>
					</section>
					<RunningList title="Running measurements" positions={runningPositions(spacing, state.panelReference)} reference={state.panelReference} onReferenceChange={set("panelReference")} labelFor={(i) => `Baluster ${i + 1}`} />
				</>
			)}
		</>
	);
}

// ── 3. Stair balusters ───────────────────────────────────────────────────────

function StairSection({ state, set, format }: SectionProps) {
	const result = useMemo(
		() =>
			state.run === null || state.nosing === null || state.stairWidth === null || state.rise === null
				? null
				: stairBalusters({ run: state.run, nosing: state.nosing, width: state.stairWidth, perTread: state.perTread, rise: state.rise, treads: state.treads }),
		[state.run, state.nosing, state.stairWidth, state.perTread, state.rise, state.treads],
	);
	const rows: ResultRow[] = result
		? [
				{ label: "Centers", value: format(result.centers), strong: true, hint: "horizontal, continues tread to tread" },
				{ label: "Gap", value: format(result.gap), strong: true, hint: "horizontal, between balusters" },
				...result.fromRiser.map((p, i) => ({ label: `Baluster ${i + 1} from riser`, value: format(p), hint: `${format(result.fromNosing[i])} back from the nosing` })),
				{ label: "Length step", value: format(result.lengthStep), hint: "each baluster on a tread is this much longer than the one in front" },
			]
		: [];

	const refOffset = (ref: MarkReference) => (state.stairWidth === null ? 0 : ref === "near" ? -state.stairWidth / 2 : ref === "far" ? state.stairWidth / 2 : 0);

	return (
		<>
			<div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
				<section className={styles.card} aria-labelledby="bal-stair-heading">
					<h2 id="bal-stair-heading" className={styles.cardTitle}>
						Stair balusters
					</h2>
					<p className={styles.note}>Balusters are set out evenly along each tread run so the pattern continues up the flight. Positions are from the riser face at the back of the tread, with the distance back from the nosing alongside.</p>
					<div className="flex flex-col gap-4">
						<div className="grid grid-cols-2 gap-3">
							<DimensionInput id="bal-run" label="Tread run" value={state.run} onChange={set("run")} hint="Riser face to riser face" />
							<DimensionInput id="bal-rise" label="Rise" value={state.rise} onChange={set("rise")} />
						</div>
						<div className="grid grid-cols-2 gap-3">
							<DimensionInput id="bal-nosing" label="Nosing" value={state.nosing} onChange={set("nosing")} />
							<DimensionInput id="bal-stair-width" label="Baluster width" value={state.stairWidth} onChange={set("stairWidth")} />
						</div>
						<div className="grid grid-cols-2 gap-3">
							<DimensionInput id="bal-riser-thick" label="Riser thickness" value={state.riserThickness} onChange={set("riserThickness")} hint="Drawing only" />
							<DimensionInput id="bal-tread-thick" label="Tread thickness" value={state.treadThickness} onChange={set("treadThickness")} hint="Drawing only" />
						</div>
						<div className="flex flex-wrap items-end gap-x-6 gap-y-3">
							<div className="flex flex-col gap-1">
								<span className={styles.label}>Balusters per tread</span>
								<SegmentedControl<"2" | "3" | "4"> label="Balusters per tread" size="sm" fill={false} value={`${state.perTread}` as "2" | "3" | "4"} onChange={(v) => set("perTread")(Number(v))} options={PER_TREAD} />
							</div>
							<NumberField id="bal-treads" label="Treads to list" value={state.treads} onChange={(v) => set("treads")(Math.max(1, Math.min(30, Math.round(v))))} min={1} max={30} step={1} className="w-32" />
						</div>
					</div>
				</section>
				<section className={styles.card} aria-labelledby="bal-stair-results">
					<h2 id="bal-stair-results" className={styles.cardTitle}>
						Results
					</h2>
					{result ? <ResultList rows={rows} /> : <p className={styles.empty}>Enter the tread run, rise, nosing and a baluster width that fits the chosen count on the tread.</p>}
				</section>
			</div>
			{result && state.run !== null && state.rise !== null && state.nosing !== null && state.stairWidth !== null && (
				<>
					<section className={styles.card} aria-labelledby="bal-stair-diagram">
						<h2 id="bal-stair-diagram" className={styles.cardTitle}>
							Treads
						</h2>
						<PrintDiagrams title="Stair balusters" subtitle={`${state.perTread} per tread at ${format(result.centers)} centers, run ${format(state.run)}, rise ${format(state.rise)}, drawn to fit`}>
							<StairBalusterDiagram result={result} run={state.run} rise={state.rise} nosing={state.nosing} width={state.stairWidth} treadThickness={state.treadThickness ?? 0} riserThickness={state.riserThickness ?? 0} treads={state.treads} format={format} />
						</PrintDiagrams>
					</section>
					<RunningList
						title="Running measurements"
						positions={result.running.map((r) => r.position + refOffset(state.stairReference))}
						reference={state.stairReference}
						onReferenceChange={set("stairReference")}
						labelFor={(i) => `Tread ${result.running[i].tread}, baluster ${result.running[i].baluster}`}
					/>
				</>
			)}
		</>
	);
}
