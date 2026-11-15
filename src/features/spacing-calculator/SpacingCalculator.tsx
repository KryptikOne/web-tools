"use client";

import { useMemo, useState } from "react";
import SegmentedControl from "@/components/SegmentedControl";
import { UnitAndPrecisionBar, DimensionInput, NumberField, ResultList, RunningList, PrintDiagrams, LumberTable, ShareCalculation, ConstructionNotes, SpacingDiagram, spacingDrawingScale } from "@/components/construction";
import type { ResultRow } from "@/components/construction";
import { useConstructionUnits } from "@/hooks/useConstructionUnits";
import { computeSpacing, runningPositions, type EndMembers, type MarkReference, type SpacingResult } from "@/lib/construction/spacingUtils";
import { formatAngle } from "@/lib/construction/pitchUtils";
import styles from "./SpacingCalculator.module.scss";

type Mode = "equal" | "exact";
type Adjust = "last" | "both";

interface SpacingState {
	/** Inches */
	length: number | null;
	width: number | null;
	height: number | null;
	/** Degrees to the length line; 90 is square */
	angle: number;
	endMembers: EndMembers;
	mode: Mode;
	count: number;
	/** Inches, centre to centre along the length */
	centers: number | null;
	adjust: Adjust;
	reference: MarkReference;
}

const DEFAULTS: SpacingState = {
	length: 96,
	width: 1.5,
	height: 48,
	angle: 90,
	endMembers: "both",
	mode: "equal",
	count: 5,
	centers: 16,
	adjust: "last",
	reference: "center",
};

const END_OPTIONS: { value: EndMembers; label: string }[] = [
	{ value: "both", label: "Both ends" },
	{ value: "one", label: "One end" },
	{ value: "none", label: "No end members" },
];
const MODE_OPTIONS: { value: Mode; label: string }[] = [
	{ value: "equal", label: "Equal spacing" },
	{ value: "exact", label: "Exact centers" },
];
const ADJUST_OPTIONS: { value: Adjust; label: string }[] = [
	{ value: "last", label: "Adjust last space" },
	{ value: "both", label: "Adjust both ends" },
];

const MAX_COUNT = 60;

const num = (v: unknown, lo: number, hi: number, fallback: number | null): number | null => (typeof v === "number" && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : fallback);
const oneOf = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T => (allowed.includes(v as T) ? (v as T) : fallback);

/** Shared links are untrusted: coerce every field back into the ranges the inputs allow. */
function sanitize(s: Partial<SpacingState>): SpacingState {
	return {
		length: num(s.length, 1, 100000, DEFAULTS.length),
		width: num(s.width, 0.01, 10000, DEFAULTS.width),
		height: num(s.height, 0.01, 10000, DEFAULTS.height),
		angle: num(s.angle, 1, 90, DEFAULTS.angle) ?? DEFAULTS.angle,
		endMembers: oneOf(s.endMembers, ["both", "one", "none"] as const, DEFAULTS.endMembers),
		mode: oneOf(s.mode, ["equal", "exact"] as const, DEFAULTS.mode),
		count: Math.round(num(s.count, 1, MAX_COUNT, DEFAULTS.count) ?? DEFAULTS.count),
		centers: num(s.centers, 0.01, 100000, DEFAULTS.centers),
		adjust: oneOf(s.adjust, ["last", "both"] as const, DEFAULTS.adjust),
		reference: oneOf(s.reference, ["near", "center", "far"] as const, DEFAULTS.reference),
	};
}

export default function SpacingCalculator() {
	const { format } = useConstructionUnits();
	const [state, setState] = useState<SpacingState>(DEFAULTS);
	const set = <K extends keyof SpacingState>(key: K) => (value: SpacingState[K]) => setState((s) => ({ ...s, [key]: value }));

	// Angled members take up more of the length than their square width.
	const sin = Math.sin((state.angle * Math.PI) / 180);
	const footprint = state.width === null || sin <= 0 ? null : state.width / sin;

	const result: SpacingResult | null = useMemo(() => {
		if (state.length === null || footprint === null || state.length <= 0 || footprint <= 0 || footprint > state.length) return null;
		const base = { totalLength: state.length, memberWidth: footprint, endMembers: state.endMembers };
		if (state.mode === "equal") return computeSpacing({ ...base, mode: "equal", count: state.count });
		if (state.centers === null || state.centers <= 0) return null;
		return computeSpacing({ ...base, mode: "exact", centers: state.centers, adjust: state.adjust });
	}, [state.length, footprint, state.endMembers, state.mode, state.count, state.centers, state.adjust]);

	const angled = state.angle !== 90;
	const rows: ResultRow[] = result
		? [
				{ label: "Members", value: `${result.count}`, strong: true },
				{ label: "Centers", value: format(result.centers), strong: true, hint: angled ? "along the length" : "centre to centre" },
				{ label: "Gap", value: format(result.gap), strong: true, hint: angled ? "along the length" : "clear between members" },
				...(angled
					? [
							{ label: "Square centers", value: format(result.centers * sin), hint: "measured square to the members" },
							{ label: "Square gap", value: format(result.gap * sin), hint: "measured square to the members" },
							{ label: "Footprint", value: format(footprint!), hint: "width along the length" },
						]
					: []),
				{ label: "First space", value: format(result.firstGap), hint: state.endMembers === "none" ? "start to first member" : "after the first member" },
				{ label: "Last space", value: format(result.lastGap), hint: state.endMembers === "both" || state.endMembers === "one" ? "before the last member" : "last member to end" },
		  ]
		: [];

	const warnings: string[] = [];
	if (result?.warnings.includes("negative-gap")) warnings.push("Members overlap at this count. Use fewer members or a narrower member.");
	if (result?.warnings.includes("count-clamped")) warnings.push("At least two members are needed with a member at each end.");
	if (result?.warnings.includes("centers-smaller-than-width")) warnings.push("Centers are smaller than the member width, so members would overlap. Only the end members are placed.");
	if (result && state.mode === "exact" && Math.abs(result.lastGap - result.gap) > 1e-6 && result.count > 2) {
		warnings.push(
			state.adjust === "last"
				? `The run does not divide into ${format(result.centers)} centers, so the last space is ${format(result.lastGap)}. A member closer than half a gap to the end is dropped rather than doubling the end member.`
				: `The run does not divide into ${format(result.centers)} centers, so the odd space is split between the ends: ${format(result.firstGap)} and ${format(result.lastGap)}.`,
		);
	}

	const scaleNote = result && state.length && state.height ? `drawn at 1:${(1 / spacingDrawingScale(state.length)).toFixed(1)}` : "";
	const countFill = ((state.count - 1) / (MAX_COUNT - 1)) * 100;

	return (
		<div className={styles.container}>
			<div className="flex flex-col gap-6">
				<UnitAndPrecisionBar />

				<div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
					<section className={styles.card} aria-labelledby="spacing-inputs-heading">
						<h2 id="spacing-inputs-heading" className={styles.cardTitle}>
							Run and members
						</h2>
						<p className={styles.note}>Battens, balusters, pickets, studs, joists or tiles: enter the run and the member, then space them equally or to exact centers.</p>
						<div className="flex flex-col gap-4">
							<DimensionInput id="spacing-length" label="Total length" value={state.length} onChange={set("length")} min={12} max={960} step={1} hint="Outside to outside of the run" />
							<div className="grid grid-cols-2 gap-3">
								<DimensionInput id="spacing-width" label="Member width" value={state.width} onChange={set("width")} hint="Actual size, not nominal" />
								<DimensionInput id="spacing-height" label="Member height" value={state.height} onChange={set("height")} hint="Drawing only, capped when tall" />
							</div>
							<NumberField id="spacing-angle" label="Angle" value={state.angle} onChange={set("angle")} unit="°" min={1} max={90} step="any" hint="Member to the length line; 90° is square" />
							<div className="flex flex-col gap-1">
								<span className={styles.label}>End members</span>
								<SegmentedControl<EndMembers> label="End members" size="sm" value={state.endMembers} onChange={set("endMembers")} options={END_OPTIONS} />
							</div>
							<div className="flex flex-col gap-1">
								<span className={styles.label}>Spacing</span>
								<SegmentedControl<Mode> label="Spacing mode" size="sm" value={state.mode} onChange={set("mode")} options={MODE_OPTIONS} />
							</div>
							{state.mode === "equal" ? (
								<div className="flex flex-col gap-1">
									<NumberField id="spacing-count" label="Member count" value={state.count} onChange={(v) => set("count")(Math.max(1, Math.min(MAX_COUNT, Math.round(v))))} min={1} max={MAX_COUNT} step={1} />
									<input
										type="range"
										aria-label="Member count slider"
										className={styles.slider}
										style={{ "--fill": `${countFill}%` } as React.CSSProperties}
										min={1}
										max={MAX_COUNT}
										step={1}
										value={state.count}
										onChange={(e) => set("count")(Number(e.target.value))}
									/>
								</div>
							) : (
								<>
									<DimensionInput id="spacing-centers" label="Centers" value={state.centers} onChange={set("centers")} min={1} max={96} step={0.25} hint="Centre to centre along the length" />
									<div className="flex flex-col gap-1">
										<span className={styles.label}>When the run does not divide</span>
										<SegmentedControl<Adjust> label="Odd space" size="sm" value={state.adjust} onChange={set("adjust")} options={ADJUST_OPTIONS} />
									</div>
								</>
							)}
						</div>
					</section>

					<section className={styles.card} aria-labelledby="spacing-results-heading">
						<h2 id="spacing-results-heading" className={styles.cardTitle}>
							Results
						</h2>
						{result ? <ResultList rows={rows} /> : <p className={styles.empty}>Enter a length, a member width narrower than the length, and centers greater than zero.</p>}
						{warnings.map((w) => (
							<p key={w} className={styles.warn} role="status">
								{w}
							</p>
						))}
					</section>
				</div>

				{result && state.length !== null && state.height !== null && (
					<section className={styles.card} aria-labelledby="spacing-diagram-heading">
						<h2 id="spacing-diagram-heading" className={styles.cardTitle}>
							Layout
						</h2>
						<PrintDiagrams title="Centers and spacing" subtitle={`${result.count} members over ${format(state.length)}, ${format(result.centers)} centers, ${format(result.gap)} gap, ${formatAngle(state.angle, 1)}, ${scaleNote}`}>
							<SpacingDiagram result={result} totalLength={state.length} memberHeight={state.height} angle={state.angle} format={format} />
						</PrintDiagrams>
						<p className={styles.legend}>
							<span className={styles.end}>End members</span>
							<span className={styles.regular}>Spaced members</span>
							<span>Numbers match the running list. The layout is {scaleNote}.</span>
						</p>
					</section>
				)}

				{result && (
					<RunningList
						title="Running measurements"
						positions={runningPositions(result, state.reference)}
						reference={state.reference}
						onReferenceChange={set("reference")}
						labelFor={(i) => (i === 0 || i === result.count - 1) && result.members[i] && (result.members[i].near < 1e-6 || state.length! - result.members[i].far < 1e-6) ? `End member ${i + 1}` : `Member ${i + 1}`}
					/>
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
