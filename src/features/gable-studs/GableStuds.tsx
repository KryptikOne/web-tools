"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import SegmentedControl from "@/components/SegmentedControl";
import { UnitAndPrecisionBar, DimensionInput, NumberField, ResultList, RunningList, PrintDiagrams, LumberTable, ShareCalculation, ConstructionNotes } from "@/components/construction";
import type { ResultRow } from "@/components/construction";
import { useConstructionUnits } from "@/hooks/useConstructionUnits";
import { nominalToActual } from "@/lib/construction/imperialUtils";
import { STUD_CENTERS, type EndStyle } from "@/lib/construction/framingUtils";
import { gableStuds, gableAngleFromHeights, alongRake, type GableShape, type GableLayoutFrom } from "@/lib/construction/gableUtils";
import { angleToPitch, formatAngle, formatPitch, pitchToAngle } from "@/lib/construction/pitchUtils";
import type { MarkReference } from "@/lib/construction/spacingUtils";
import { GableDiagram, TopCutTemplate } from "./GableDiagrams";
import styles from "./GableStuds.module.scss";

type SlopeBy = "pitch" | "angle" | "height";
type StudSize = "2x4" | "2x6";
type RakeEnd = "single" | "double" | "double-gap";

interface GableState {
	shape: GableShape;
	width: number | null;
	slopeBy: SlopeBy;
	pitch: number;
	angle: number;
	peakHeight: number | null;
	startHeight: number | null;
	studSize: StudSize;
	centers: number;
	from: GableLayoutFrom;
	firstStudOffset: number | null;
	startWith: RakeEnd;
	endWith: RakeEnd;
	plateThickness: number | null;
	topPlates: number;
	bottomPlates: number;
	reference: MarkReference;
	heightToScale: boolean;
}

const DEFAULTS: GableState = {
	shape: "full",
	width: 288,
	slopeBy: "pitch",
	pitch: 6,
	angle: 26.57,
	peakHeight: 168,
	startHeight: 96,
	studSize: "2x4",
	centers: 16,
	from: "center",
	firstStudOffset: 0,
	startWith: "single",
	endWith: "single",
	plateThickness: 1.5,
	topPlates: 1,
	bottomPlates: 1,
	reference: "near",
	heightToScale: false,
};

const RAKE_ENDS: { value: RakeEnd; label: string }[] = [
	{ value: "single", label: "Single" },
	{ value: "double", label: "Double" },
	{ value: "double-gap", label: "Double + gap" },
];
const CENTER_OPTIONS = STUD_CENTERS.map((c) => ({ value: `${c}`, label: `${c}"` }));
const SIZE_OPTIONS: { value: StudSize; label: string }[] = [
	{ value: "2x4", label: "2x4" },
	{ value: "2x6", label: "2x6" },
];

const num = (v: unknown, lo: number, hi: number, fallback: number | null): number | null => (typeof v === "number" && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : fallback);
const oneOf = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T => (allowed.includes(v as T) ? (v as T) : fallback);
const int = (v: unknown, lo: number, hi: number, fb: number) => Math.round(num(v, lo, hi, fb) ?? fb);

function sanitize(s: Partial<GableState>): GableState {
	return {
		shape: oneOf(s.shape, ["full", "half"] as const, DEFAULTS.shape),
		width: num(s.width, 3, 10000, DEFAULTS.width),
		slopeBy: oneOf(s.slopeBy, ["pitch", "angle", "height"] as const, DEFAULTS.slopeBy),
		pitch: num(s.pitch, 0.1, 100, DEFAULTS.pitch) ?? DEFAULTS.pitch,
		angle: num(s.angle, 0.1, 89.9, DEFAULTS.angle) ?? DEFAULTS.angle,
		peakHeight: num(s.peakHeight, 1, 10000, DEFAULTS.peakHeight),
		startHeight: num(s.startHeight, 1, 10000, DEFAULTS.startHeight),
		studSize: oneOf(s.studSize, ["2x4", "2x6"] as const, DEFAULTS.studSize),
		centers: STUD_CENTERS.includes(s.centers as 16) ? (s.centers as number) : DEFAULTS.centers,
		from: oneOf(s.from, ["end", "center"] as const, DEFAULTS.from),
		firstStudOffset: num(s.firstStudOffset, -100, 100, DEFAULTS.firstStudOffset),
		startWith: oneOf(s.startWith, ["single", "double", "double-gap"] as const, DEFAULTS.startWith),
		endWith: oneOf(s.endWith, ["single", "double", "double-gap"] as const, DEFAULTS.endWith),
		plateThickness: num(s.plateThickness, 0, 12, DEFAULTS.plateThickness),
		topPlates: int(s.topPlates, 0, 2, DEFAULTS.topPlates),
		bottomPlates: int(s.bottomPlates, 0, 2, DEFAULTS.bottomPlates),
		reference: oneOf(s.reference, ["near", "center", "far"] as const, DEFAULTS.reference),
		heightToScale: typeof s.heightToScale === "boolean" ? s.heightToScale : DEFAULTS.heightToScale,
	};
}

export default function GableStuds() {
	const { format } = useConstructionUnits();
	const [state, setState] = useState<GableState>(DEFAULTS);
	const set = <K extends keyof GableState>(key: K) => (value: GableState[K]) => setState((s) => ({ ...s, [key]: value }));
	const size = nominalToActual(state.studSize)!;

	const angle = useMemo(() => {
		if (state.slopeBy === "pitch") return pitchToAngle(state.pitch);
		if (state.slopeBy === "angle") return state.angle;
		if (state.width === null || state.startHeight === null || state.peakHeight === null) return null;
		return gableAngleFromHeights(state.width, state.shape, state.startHeight, state.peakHeight);
	}, [state.slopeBy, state.pitch, state.angle, state.width, state.shape, state.startHeight, state.peakHeight]);

	const result = useMemo(
		() =>
			angle === null || state.width === null || state.startHeight === null || state.firstStudOffset === null || state.plateThickness === null
				? null
				: gableStuds({
						width: state.width,
						angle,
						shape: state.shape,
						startHeight: state.startHeight,
						studWidth: size.width,
						studDepth: size.depth,
						centers: state.centers,
						from: state.from,
						firstStudOffset: state.firstStudOffset,
						startWith: state.startWith as EndStyle,
						endWith: state.endWith as EndStyle,
						plateThickness: state.plateThickness,
						topPlates: state.topPlates,
						bottomPlates: state.bottomPlates,
					}),
		[angle, state.width, state.shape, state.startHeight, size, state.centers, state.from, state.firstStudOffset, state.startWith, state.endWith, state.plateThickness, state.topPlates, state.bottomPlates],
	);

	const changeSlopeBy = (v: SlopeBy) =>
		setState((s) => {
			const a = angle ?? pitchToAngle(s.pitch);
			return { ...s, slopeBy: v, angle: Number(a.toFixed(2)), pitch: Number(angleToPitch(a).toFixed(3)), peakHeight: result ? Number(result.peakHeight.toFixed(4)) : s.peakHeight };
		});

	const rows: ResultRow[] = result
		? [
				{ label: "Rake angle", value: formatAngle(result.cutAngle, 2), hint: `${formatPitch(angleToPitch(result.cutAngle))} pitch`, strong: true },
				{ label: "Studs", value: `${result.count}`, strong: true, hint: `${state.studSize} at ${state.centers}" centers` },
				{ label: "Common difference", value: format(result.commonDifference), hint: "each stud is this much longer than the last" },
				{ label: "Top cut", value: formatAngle(result.cutAngle, 2), hint: `saw miter from square · ${format(size.width * Math.tan((result.cutAngle * Math.PI) / 180))} drop across the stud` },
				{ label: state.shape === "full" ? "Height at the ridge" : "Height at the high end", value: format(result.peakHeight), hint: "including plates" },
				{ label: "Rise", value: format(result.rise), hint: state.shape === "full" ? "over half the width" : "over the width" },
				{ label: "Raked plate", value: format(result.rakeLength), hint: state.shape === "full" ? "both slopes together" : "along the slope" },
				{ label: "Plate plumb thickness", value: format(result.platePlumb), hint: "a raked plate takes this much stud height" },
				{ label: "Total stud length", value: format(result.totalLength), hint: `${result.boardFeet.toFixed(1)} board feet` },
			]
		: [];

	const positions = result ? result.studs.map((s) => (state.reference === "near" ? s.near : state.reference === "far" ? s.far : s.center)) : [];
	const rakePositions = result ? alongRake(positions, result.cutAngle) : [];

	return (
		<div className={styles.container}>
			<div className="flex flex-col gap-6">
				<UnitAndPrecisionBar />

				<div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
					<section className={styles.card} aria-labelledby="gable-heading">
						<h2 id="gable-heading" className={styles.cardTitle}>
							Gable studs
						</h2>
						<p className={styles.note}>
							Stud lengths under a raked top plate. Use the full gable for a gable end framed as one wall, or the half gable for a single slope such as a shed or lean-to. Level studs are in the <Link href="/tools/wall-framing">wall framing calculator</Link>.
						</p>
						<div className="flex flex-col gap-4">
							<div className="flex flex-col gap-1">
								<span className={styles.label}>Shape</span>
								<SegmentedControl<GableShape>
									label="Shape"
									size="sm"
									value={state.shape}
									onChange={(v) => setState((s) => ({ ...s, shape: v, from: v === "half" ? "end" : s.from }))}
									options={[
										{ value: "full", label: "Full gable" },
										{ value: "half", label: "Half gable" },
									]}
								/>
							</div>
							<DimensionInput id="gable-width" label="Plate length" value={state.width} onChange={set("width")} min={24} max={720} step={1} hint="Level, end to end" />
							<div className="flex flex-wrap items-end gap-x-6 gap-y-3">
								<div className="flex flex-col gap-1">
									<span className={styles.label}>Slope as</span>
									<SegmentedControl<SlopeBy>
										label="Slope as"
										size="sm"
										fill={false}
										value={state.slopeBy}
										onChange={changeSlopeBy}
										options={[
											{ value: "pitch", label: "Pitch x:12" },
											{ value: "angle", label: "Angle" },
											{ value: "height", label: "Peak height" },
										]}
									/>
								</div>
								{state.slopeBy === "pitch" && <NumberField id="gable-pitch" label="Pitch" value={state.pitch} onChange={set("pitch")} unit=":12" step="any" className="w-36" />}
								{state.slopeBy === "angle" && <NumberField id="gable-angle" label="Angle" value={state.angle} onChange={set("angle")} unit="°" min={0.1} max={89.9} step="any" className="w-36" />}
								{state.slopeBy === "height" && <DimensionInput id="gable-peak" label={state.shape === "full" ? "Height at the ridge" : "Height at the high end"} value={state.peakHeight} onChange={set("peakHeight")} hint="Including plates" className="w-44" />}
							</div>
							<DimensionInput id="gable-start" label={state.shape === "full" ? "Height at the ends" : "Height at the low end"} value={state.startHeight} onChange={set("startHeight")} hint="Top of top plate to bottom of bottom plate" />
							<div className="flex flex-wrap items-end gap-x-6 gap-y-3">
								<div className="flex flex-col gap-1">
									<span className={styles.label}>Stud</span>
									<SegmentedControl<StudSize> label="Stud size" size="sm" fill={false} value={state.studSize} onChange={set("studSize")} options={SIZE_OPTIONS} />
								</div>
								<div className="flex flex-col gap-1">
									<span className={styles.label}>Centers</span>
									<SegmentedControl<string> label="Stud centers" size="sm" fill={false} value={`${state.centers}`} onChange={(v) => set("centers")(Number(v))} options={CENTER_OPTIONS} />
								</div>
							</div>
							<div className="flex flex-wrap items-end gap-x-6 gap-y-3">
								<div className="flex flex-col gap-1">
									<span className={styles.label}>Lay out from</span>
									<SegmentedControl<GableLayoutFrom>
										label="Lay out from"
										size="sm"
										fill={false}
										value={state.from}
										onChange={set("from")}
										options={[
											{ value: "end", label: "Start end" },
											{ value: "center", label: "Ridge", disabled: state.shape === "half" },
										]}
									/>
								</div>
								{state.from === "end" && <DimensionInput id="gable-offset" label="First stud offset" value={state.firstStudOffset} onChange={set("firstStudOffset")} min={-100} hint="Shifts the layout; 0 puts centers on multiples of the spacing" className="w-44" />}
							</div>
							<div className="grid grid-cols-2 gap-3">
								<div className="flex flex-col gap-1">
									<span className={styles.label}>Start with</span>
									<SegmentedControl<RakeEnd> label="Start with" size="sm" value={state.startWith} onChange={set("startWith")} options={RAKE_ENDS} />
								</div>
								<div className="flex flex-col gap-1">
									<span className={styles.label}>End with</span>
									<SegmentedControl<RakeEnd> label="End with" size="sm" value={state.endWith} onChange={set("endWith")} options={RAKE_ENDS} />
								</div>
							</div>
							<div className="grid grid-cols-3 gap-3">
								<DimensionInput id="gable-plate" label="Plate thickness" value={state.plateThickness} onChange={set("plateThickness")} />
								<NumberField id="gable-top-plates" label="Top plates" value={state.topPlates} onChange={(v) => set("topPlates")(int(v, 0, 2, 1))} min={0} max={2} step={1} />
								<NumberField id="gable-bottom-plates" label="Bottom plates" value={state.bottomPlates} onChange={(v) => set("bottomPlates")(int(v, 0, 2, 1))} min={0} max={2} step={1} />
							</div>
						</div>
					</section>

					<section className={styles.card} aria-labelledby="gable-results">
						<h2 id="gable-results" className={styles.cardTitle}>
							Lengths and cuts
						</h2>
						{result ? <ResultList rows={rows} /> : <p className={styles.empty}>Enter the plate length, a slope and the wall height at the ends.</p>}
						{result?.warnings.map((w) => (
							<p key={w} className={styles.warn}>
								{w}
							</p>
						))}
						{result && (
							<table className={`${styles.table} mt-4`}>
								<caption className="sr-only">Stud lengths</caption>
								<thead>
									<tr>
										<th scope="col">#</th>
										<th scope="col">Center</th>
										<th scope="col">Long point</th>
										<th scope="col">Short point</th>
									</tr>
								</thead>
								<tbody>
									{result.studs.map((s) => (
										<tr key={s.index}>
											<td className="mono">{s.index}</td>
											<td className="mono">{format(s.center)}</td>
											<td className="mono">{format(s.long)}</td>
											<td className="mono">{s.peak ? `${format(s.short)} both sides` : format(s.short)}</td>
										</tr>
									))}
								</tbody>
							</table>
						)}
					</section>
				</div>

				{result && state.width !== null && state.startHeight !== null && state.plateThickness !== null && (
					<>
						<section className={styles.card} aria-labelledby="gable-diagram">
							<h2 id="gable-diagram" className={styles.cardTitle}>
								{state.shape === "full" ? "Gable end" : "Raked wall"}
							</h2>
							<label className={`${styles.check} mb-3`}>
								<input type="checkbox" checked={state.heightToScale} onChange={(e) => set("heightToScale")(e.target.checked)} />
								Draw the height to scale
							</label>
							<PrintDiagrams title={state.shape === "full" ? "Gable end studs" : "Raked wall studs"} subtitle={`${format(state.width)} plate, ${formatAngle(result.cutAngle, 2)} rake, ${result.count} ${state.studSize} studs at ${state.centers}" centers, drawn to fit`}>
								<GableDiagram result={result} width={state.width} shape={state.shape} startHeight={state.startHeight} plateThickness={state.plateThickness} topPlates={state.topPlates} bottomPlates={state.bottomPlates} heightToScale={state.heightToScale} format={format} />
							</PrintDiagrams>
						</section>
						<div className="grid gap-4 lg:grid-cols-2">
							<RunningList title="Stud positions, level" positions={positions} reference={state.reference} onReferenceChange={set("reference")} labelFor={(i) => (result.studs[i].kind === "common" ? "" : "end")} />
							<RunningList title="Stud positions along the rake" positions={rakePositions} labelFor={(i) => (result.studs[i].kind === "common" ? "" : "end")} />
						</div>
						<section className={styles.card} aria-labelledby="gable-template">
							<h2 id="gable-template" className={styles.cardTitle}>
								Top cut template
							</h2>
							<p className={styles.note}>Print at 100% and lay a stud edge along the left side to mark the cut. Set the saw miter to {formatAngle(result.cutAngle, 2)} from square; the cut drops {format(size.width * Math.tan((result.cutAngle * Math.PI) / 180))} across the stud.</p>
							<PrintDiagrams title="Gable stud top cut" subtitle={`${formatAngle(result.cutAngle, 2)} from square across a ${format(size.width)} stud, true size`}>
								<TopCutTemplate angle={result.cutAngle} studWidth={size.width} format={format} />
							</PrintDiagrams>
						</section>
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
