"use client";

import { useMemo, useState } from "react";
import SegmentedControl from "@/components/SegmentedControl";
import { UnitAndPrecisionBar, DimensionInput, NumberField, ResultList, RunningList, PrintDiagrams, ShareCalculation, ConstructionNotes } from "@/components/construction";
import type { ResultRow } from "@/components/construction";
import { useConstructionUnits } from "@/hooks/useConstructionUnits";
import { diminishingLengths, goldenRatio } from "@/lib/construction/geometryUtils";
import { angleToPitch, formatAngle, formatPitch, pitchToAngle } from "@/lib/construction/pitchUtils";
import { DiminishingDiagram, GoldenRectangleDiagram } from "./GoldenDiagrams";
import styles from "./GoldenRatioCalculator.module.scss";

type Mode = "diminishing" | "golden";

interface GoldenState {
	mode: Mode;
	firstLength: number | null;
	slopeBy: "pitch" | "angle";
	pitch: number;
	angle: number;
	centers: number | null;
	memberWidth: number | null;
	by: "count" | "run";
	count: number;
	run: number | null;
	direction: "longer" | "shorter";
	known: "whole" | "long" | "short";
	value: number | null;
}

const DEFAULTS: GoldenState = {
	mode: "diminishing",
	firstLength: 36,
	slopeBy: "pitch",
	pitch: 6,
	angle: 26.57,
	centers: 16,
	memberWidth: 1.5,
	by: "count",
	count: 6,
	run: 96,
	direction: "longer",
	known: "whole",
	value: 48,
};

const num = (v: unknown, lo: number, hi: number, fallback: number | null): number | null => (typeof v === "number" && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : fallback);
const oneOf = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T => (allowed.includes(v as T) ? (v as T) : fallback);
const int = (v: unknown, lo: number, hi: number, fb: number) => Math.round(num(v, lo, hi, fb) ?? fb);

function sanitize(s: Partial<GoldenState>): GoldenState {
	return {
		mode: oneOf(s.mode, ["diminishing", "golden"] as const, DEFAULTS.mode),
		firstLength: num(s.firstLength, 0.1, 1e4, DEFAULTS.firstLength),
		slopeBy: oneOf(s.slopeBy, ["pitch", "angle"] as const, DEFAULTS.slopeBy),
		pitch: num(s.pitch, 0.1, 100, DEFAULTS.pitch) ?? DEFAULTS.pitch,
		angle: num(s.angle, 0.1, 89.9, DEFAULTS.angle) ?? DEFAULTS.angle,
		centers: num(s.centers, 0.1, 1e3, DEFAULTS.centers),
		memberWidth: num(s.memberWidth, 0.1, 100, DEFAULTS.memberWidth),
		by: oneOf(s.by, ["count", "run"] as const, DEFAULTS.by),
		count: int(s.count, 1, 200, DEFAULTS.count),
		run: num(s.run, 0.1, 1e4, DEFAULTS.run),
		direction: oneOf(s.direction, ["longer", "shorter"] as const, DEFAULTS.direction),
		known: oneOf(s.known, ["whole", "long", "short"] as const, DEFAULTS.known),
		value: num(s.value, 0.01, 1e5, DEFAULTS.value),
	};
}

export default function GoldenRatioCalculator() {
	const { format } = useConstructionUnits();
	const [state, setState] = useState<GoldenState>(DEFAULTS);
	const set = <K extends keyof GoldenState>(key: K) => (value: GoldenState[K]) => setState((s) => ({ ...s, [key]: value }));
	const angle = state.slopeBy === "pitch" ? pitchToAngle(state.pitch) : state.angle;

	const dim = useMemo(() => (state.mode !== "diminishing" || state.firstLength === null || state.centers === null || state.run === null ? null : diminishingLengths({ firstLength: state.firstLength, angle, centers: state.centers, by: state.by, count: state.count, run: state.run, direction: state.direction })), [state, angle]);
	const golden = useMemo(() => (state.mode !== "golden" || state.value === null ? null : goldenRatio(state.known, state.value)), [state]);

	const dimRows: ResultRow[] = dim
		? [
				{ label: "Members", value: `${dim.count}`, strong: true, hint: `${format(dim.lengths[0])} to ${format(dim.lengths[dim.count - 1])}` },
				{ label: "Common difference", value: format(dim.commonDifference), strong: true, hint: `${format(state.centers ?? 0)} × tan ${formatAngle(angle, 2)}; each member ${state.direction} than the last by this` },
				{ label: "Cut angle", value: formatAngle(dim.cutAngle, 2), hint: `from square where the members meet the line; ${formatPitch(angleToPitch(angle))} pitch` },
				{ label: "Along the line", value: format(dim.rakeLength), hint: "first member to last, on the rake" },
			]
		: [];
	const goldenRows: ResultRow[] = golden
		? [
				{ label: "Whole", value: format(golden.whole), strong: state.known === "whole" },
				{ label: "Long part", value: format(golden.long), strong: state.known === "long", hint: "whole ÷ 1.618" },
				{ label: "Short part", value: format(golden.short), strong: state.known === "short", hint: "whole − long, also long ÷ 1.618" },
				{ label: "Ratio", value: golden.ratio.toFixed(6), hint: "long : short = whole : long" },
				{ label: "Nested divisions", value: golden.nested.map((n) => format(n)).join(", "), hint: "the short part divided again and again" },
			]
		: [];

	return (
		<div className={styles.container}>
			<div className="flex flex-col gap-6">
				<UnitAndPrecisionBar />

				<div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
					<section className={styles.card} aria-labelledby="gd-heading">
						<h2 id="gd-heading" className={styles.cardTitle}>
							Proportions
						</h2>
						<SegmentedControl<Mode>
							label="Calculation"
							size="sm"
							value={state.mode}
							onChange={set("mode")}
							options={[
								{ value: "diminishing", label: "Diminishing lengths" },
								{ value: "golden", label: "Golden ratio" },
							]}
						/>
						<p className={`${styles.note} mt-3`}>{state.mode === "diminishing" ? "Members at set centers meeting a sloping line: gable studs, jack rafters, pickets under a rake, balusters under a sloped rail. Each is longer or shorter than the last by the same amount." : "Divide a length so the whole is to the long part as the long part is to the short part, 1 : 1.618."}</p>
						<div className="flex flex-col gap-4">
							{state.mode === "diminishing" ? (
								<>
									<div className="grid grid-cols-2 gap-3">
										<DimensionInput id="gd-first" label="First member" value={state.firstLength} onChange={set("firstLength")} />
										<DimensionInput id="gd-centers" label="Centers" value={state.centers} onChange={set("centers")} />
									</div>
									<div className="flex flex-wrap items-end gap-x-6 gap-y-3">
										<div className="flex flex-col gap-1">
											<span className={styles.label}>Line as</span>
											<SegmentedControl<"pitch" | "angle">
												label="Line as"
												size="sm"
												fill={false}
												value={state.slopeBy}
												onChange={(v) => setState((s) => ({ ...s, slopeBy: v, ...(v === "angle" ? { angle: Number(pitchToAngle(s.pitch).toFixed(2)) } : { pitch: Number(angleToPitch(s.angle).toFixed(3)) }) }))}
												options={[
													{ value: "pitch", label: "Pitch x:12" },
													{ value: "angle", label: "Angle" },
												]}
											/>
										</div>
										{state.slopeBy === "pitch" ? <NumberField id="gd-pitch" label="Pitch" value={state.pitch} onChange={set("pitch")} unit=":12" step="any" className="w-32" /> : <NumberField id="gd-angle" label="Angle" value={state.angle} onChange={set("angle")} unit="°" min={0.1} max={89.9} step="any" className="w-32" />}
									</div>
									<div className="flex flex-wrap items-end gap-x-6 gap-y-3">
										<div className="flex flex-col gap-1">
											<span className={styles.label}>Run by</span>
											<SegmentedControl<"count" | "run">
												label="Run by"
												size="sm"
												fill={false}
												value={state.by}
												onChange={(v) => setState((s) => ({ ...s, by: v, ...(dim && v === "count" ? { count: dim.count } : {}), ...(dim && v === "run" ? { run: dim.positions[dim.count - 1] } : {}) }))}
												options={[
													{ value: "count", label: "Count" },
													{ value: "run", label: "Level run" },
												]}
											/>
										</div>
										{state.by === "count" ? <NumberField id="gd-count" label="Members" value={state.count} onChange={(v) => set("count")(int(v, 1, 200, 1))} min={1} max={200} step={1} className="w-28" /> : <DimensionInput id="gd-run" label="Level run" value={state.run} onChange={set("run")} className="w-36" />}
									</div>
									<div className="flex flex-wrap items-end gap-x-6 gap-y-3">
										<div className="flex flex-col gap-1">
											<span className={styles.label}>Members get</span>
											<SegmentedControl<"longer" | "shorter">
												label="Members get"
												size="sm"
												fill={false}
												value={state.direction}
												onChange={set("direction")}
												options={[
													{ value: "longer", label: "Longer" },
													{ value: "shorter", label: "Shorter" },
												]}
											/>
										</div>
										<DimensionInput id="gd-width" label="Member width" value={state.memberWidth} onChange={set("memberWidth")} hint="Drawing only" className="w-36" />
									</div>
								</>
							) : (
								<div className="flex flex-wrap items-end gap-x-6 gap-y-3">
									<div className="flex flex-col gap-1">
										<span className={styles.label}>Known</span>
										<SegmentedControl<"whole" | "long" | "short">
											label="Known"
											size="sm"
											fill={false}
											value={state.known}
											onChange={(v) => setState((s) => ({ ...s, known: v, value: golden ? Number(golden[v].toFixed(6)) : s.value }))}
											options={[
												{ value: "whole", label: "Whole" },
												{ value: "long", label: "Long part" },
												{ value: "short", label: "Short part" },
											]}
										/>
									</div>
									<DimensionInput id="gd-value" label={state.known === "whole" ? "Whole length" : state.known === "long" ? "Long part" : "Short part"} value={state.value} onChange={set("value")} className="w-40" />
								</div>
							)}
						</div>
					</section>

					<section className={styles.card} aria-labelledby="gd-results">
						<h2 id="gd-results" className={styles.cardTitle}>
							{state.mode === "diminishing" ? "Lengths" : "Golden section"}
						</h2>
						{dim || golden ? <ResultList rows={dim ? dimRows : goldenRows} /> : <p className={styles.empty}>Enter a first length, centers and a slope under 90°.</p>}
						{dim?.warnings.map((w) => (
							<p key={w} className={styles.warn}>
								{w}
							</p>
						))}
					</section>
				</div>

				{dim && state.centers !== null && state.memberWidth !== null && (
					<>
						<section className={styles.card} aria-labelledby="gd-diagram">
							<h2 id="gd-diagram" className={styles.cardTitle}>
								Members under the line
							</h2>
							<PrintDiagrams title="Diminishing lengths" subtitle={`${dim.count} members at ${format(state.centers)} centers, ${formatAngle(angle, 1)}, drawn to fit`}>
								<DiminishingDiagram result={dim} centers={state.centers} memberWidth={state.memberWidth} format={format} />
							</PrintDiagrams>
						</section>
						<div className="grid gap-4 lg:grid-cols-2">
							<RunningList title="Member lengths" positions={dim.lengths.map((l) => Math.max(0, l))} labelFor={(i) => `member ${i + 1}`} />
							<RunningList title="Member positions, level" positions={dim.positions} />
						</div>
					</>
				)}
				{golden && (
					<section className={styles.card} aria-labelledby="gd-rect">
						<h2 id="gd-rect" className={styles.cardTitle}>
							Golden rectangle
						</h2>
						<PrintDiagrams title="Golden rectangle" subtitle={`${format(golden.whole)} × ${format(golden.long)}, drawn to fit`}>
							<GoldenRectangleDiagram ratio={golden} longSide={golden.whole} format={format} />
						</PrintDiagrams>
						<p className={styles.note}>The rectangle is the whole by the long part. Taking a square off the long side leaves another golden rectangle, and the quarter circles through those squares trace the spiral.</p>
					</section>
				)}

				<div className="grid gap-4 lg:grid-cols-2">
					<ShareCalculation state={state} onLoad={(s) => setState(sanitize(s))} />
					<ConstructionNotes />
				</div>
			</div>
		</div>
	);
}
