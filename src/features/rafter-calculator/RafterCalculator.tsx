"use client";

import { useMemo, useState } from "react";
import SegmentedControl from "@/components/SegmentedControl";
import { UnitAndPrecisionBar, DimensionInput, NumberField, ResultList, PrintDiagrams, LumberTable, ShareCalculation, ConstructionNotes } from "@/components/construction";
import type { ResultRow } from "@/components/construction";
import { useConstructionUnits } from "@/hooks/useConstructionUnits";
import { nominalToActual } from "@/lib/construction/imperialUtils";
import { commonRafter, runFromSpan } from "@/lib/construction/rafterUtils";
import { angleToPitch, formatAngle, formatPitch, pitchToAngle } from "@/lib/construction/pitchUtils";
import { RafterDiagram, CutTemplate, SpanDiagram } from "./RafterDiagrams";
import styles from "./RafterCalculator.module.scss";

type SlopeBy = "pitch" | "angle";
type Section = "2x6" | "2x8" | "2x10" | "2x12" | "custom";

interface RafterState {
	run: number | null;
	slopeBy: SlopeBy;
	pitch: number;
	angle: number;
	overhang: number | null;
	section: Section;
	depth: number | null;
	thickness: number | null;
	birdsmouthBy: "seat" | "plumb";
	birdsmouth: number | null;
	wallThickness: number | null;
	wallHeight: number | null;
	buildingWidth: number | null;
	ridgeThickness: number | null;
}

const DEFAULTS: RafterState = {
	run: 144,
	slopeBy: "pitch",
	pitch: 6,
	angle: 26.57,
	overhang: 24,
	section: "2x8",
	depth: 7.25,
	thickness: 1.5,
	birdsmouthBy: "seat",
	birdsmouth: 3.5,
	wallThickness: 3.5,
	wallHeight: 96,
	buildingWidth: 289.5,
	ridgeThickness: 1.5,
};

const SECTIONS: { value: Section; label: string }[] = [
	{ value: "2x6", label: "2x6" },
	{ value: "2x8", label: "2x8" },
	{ value: "2x10", label: "2x10" },
	{ value: "2x12", label: "2x12" },
	{ value: "custom", label: "Custom" },
];

const num = (v: unknown, lo: number, hi: number, fallback: number | null): number | null => (typeof v === "number" && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : fallback);
const oneOf = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T => (allowed.includes(v as T) ? (v as T) : fallback);

function sanitize(s: Partial<RafterState>): RafterState {
	const len = (v: unknown, fb: number | null) => num(v, 0, 1e5, fb);
	return {
		run: num(s.run, 1, 1e5, DEFAULTS.run),
		slopeBy: oneOf(s.slopeBy, ["pitch", "angle"] as const, DEFAULTS.slopeBy),
		pitch: num(s.pitch, 0.1, 100, DEFAULTS.pitch) ?? DEFAULTS.pitch,
		angle: num(s.angle, 0.1, 89.9, DEFAULTS.angle) ?? DEFAULTS.angle,
		overhang: len(s.overhang, DEFAULTS.overhang),
		section: oneOf(s.section, ["2x6", "2x8", "2x10", "2x12", "custom"] as const, DEFAULTS.section),
		depth: num(s.depth, 0.1, 100, DEFAULTS.depth),
		thickness: num(s.thickness, 0.1, 100, DEFAULTS.thickness),
		birdsmouthBy: oneOf(s.birdsmouthBy, ["seat", "plumb"] as const, DEFAULTS.birdsmouthBy),
		birdsmouth: len(s.birdsmouth, DEFAULTS.birdsmouth),
		wallThickness: num(s.wallThickness, 0.1, 100, DEFAULTS.wallThickness),
		wallHeight: num(s.wallHeight, 1, 1000, DEFAULTS.wallHeight),
		buildingWidth: num(s.buildingWidth, 1, 1e5, DEFAULTS.buildingWidth),
		ridgeThickness: len(s.ridgeThickness, DEFAULTS.ridgeThickness),
	};
}

export default function RafterCalculator() {
	const { format } = useConstructionUnits();
	const [state, setState] = useState<RafterState>(DEFAULTS);
	const set = <K extends keyof RafterState>(key: K) => (value: RafterState[K]) => setState((s) => ({ ...s, [key]: value }));

	const angle = state.slopeBy === "pitch" ? pitchToAngle(state.pitch) : state.angle;
	const pickSection = (sec: Section) => {
		const size = sec === "custom" ? null : nominalToActual(sec);
		setState((s) => ({ ...s, section: sec, ...(size ? { depth: size.depth, thickness: size.width } : {}) }));
	};

	const rafter = useMemo(
		() =>
			state.run === null || state.overhang === null || state.depth === null || state.thickness === null || state.birdsmouth === null || state.wallThickness === null || state.wallHeight === null
				? null
				: commonRafter({ run: state.run, angle, overhang: state.overhang, depth: state.depth, thickness: state.thickness, birdsmouth: state.birdsmouth, birdsmouthBy: state.birdsmouthBy, wallThickness: state.wallThickness, wallHeight: state.wallHeight }),
		[state.run, angle, state.overhang, state.depth, state.thickness, state.birdsmouth, state.birdsmouthBy, state.wallThickness, state.wallHeight],
	);
	const rows: ResultRow[] = rafter
		? [
				{ label: "Roof angle", value: formatAngle(rafter.angle, 2), hint: `${formatPitch(rafter.pitch)} pitch`, strong: true },
				{ label: "Rise", value: format(rafter.rise), hint: "over the run, on the measuring line" },
				{ label: "Line length", value: format(rafter.lineLength), strong: true, hint: "ridge plumb cut to the outer wall plumb line, along the rafter" },
				{ label: "Tail length", value: format(rafter.tailLength), hint: "outer wall to the tail cut, along the rafter" },
				{ label: "Overall length", value: format(rafter.overallLength), strong: true, hint: "long point to long point before any ridge shortening" },
				{ label: "Plumb cut", value: `${formatAngle(rafter.plumbCutAngle, 2)} · ${format(rafter.plumbDepth)}`, hint: "saw miter from square · length of the cut" },
				{ label: "Seat cut", value: `${formatAngle(rafter.seatCutAngle, 2)} · ${format(rafter.seat)}`, hint: "from square · bearing on the plate" },
				{ label: "Heel (birdsmouth plumb)", value: format(rafter.heel) },
				{ label: "Height above plate", value: format(rafter.hap), hint: "top of rafter over the outer wall face" },
				{ label: "Birdsmouth depth", value: format(rafter.birdsmouthDepth), hint: `square to the edge; ${format(state.depth! - rafter.birdsmouthDepth)} left`, strong: rafter.birdsmouthTooDeep },
				{ label: "Ridge above plate", value: format(rafter.ridgeAbovePlate), hint: "top of rafter at the ridge over the top of the wall" },
				{ label: "Tail top below plate", value: format(rafter.tailDrop), hint: rafter.tailDrop < 0 ? "negative: the tail top is above the plate" : "" },
				{ label: "Fascia bottom below plate", value: format(rafter.fasciaBottomBelowPlate) },
			]
		: [];

	const span = state.buildingWidth !== null && state.ridgeThickness !== null ? runFromSpan(state.buildingWidth, state.ridgeThickness) : null;

	return (
		<div className={styles.container}>
			<div className="flex flex-col gap-6">
				<UnitAndPrecisionBar />

				<div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
					<section className={styles.card} aria-labelledby="rafter-heading">
						<h2 id="rafter-heading" className={styles.cardTitle}>
							Common rafter
						</h2>
						<p className={styles.note}>Run is measured level from the ridge plumb cut to the outer face of the wall. Use the span box below to get it from the building width.</p>
						<div className="flex flex-col gap-4">
							<DimensionInput id="rafter-run" label="Run to outer wall" value={state.run} onChange={set("run")} min={12} max={480} step={1} />
							<div className="flex flex-wrap items-end gap-x-6 gap-y-3">
								<div className="flex flex-col gap-1">
									<span className={styles.label}>Slope as</span>
									<SegmentedControl<SlopeBy>
										label="Slope as"
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
								{state.slopeBy === "pitch" ? (
									<NumberField id="rafter-pitch" label="Pitch" value={state.pitch} onChange={set("pitch")} unit=":12" step="any" className="w-36" />
								) : (
									<NumberField id="rafter-angle" label="Angle" value={state.angle} onChange={set("angle")} unit="°" min={0.1} max={89.9} step="any" className="w-36" />
								)}
							</div>
							<DimensionInput id="rafter-overhang" label="Overhang" value={state.overhang} onChange={set("overhang")} hint="Level, from the outer wall face to the tail plumb cut" />
							<div className="flex flex-col gap-1">
								<span className={styles.label}>Rafter</span>
								<SegmentedControl<Section> label="Rafter size" size="sm" value={state.section} onChange={pickSection} options={SECTIONS} />
							</div>
							<div className="grid grid-cols-2 gap-3">
								<DimensionInput id="rafter-depth" label="Depth" value={state.depth} onChange={(v) => setState((s) => ({ ...s, depth: v, section: "custom" }))} hint="Actual" />
								<DimensionInput id="rafter-thick" label="Thickness" value={state.thickness} onChange={(v) => setState((s) => ({ ...s, thickness: v, section: "custom" }))} hint="Actual" />
							</div>
							<div className="flex flex-wrap items-end gap-x-6 gap-y-3">
								<div className="flex flex-col gap-1">
									<span className={styles.label}>Birdsmouth by</span>
									<SegmentedControl<"seat" | "plumb">
										label="Birdsmouth by"
										size="sm"
										fill={false}
										value={state.birdsmouthBy}
										onChange={(v) => setState((s) => ({ ...s, birdsmouthBy: v, birdsmouth: rafter ? (v === "seat" ? rafter.seat : rafter.heel) : s.birdsmouth }))}
										options={[
											{ value: "seat", label: "Seat" },
											{ value: "plumb", label: "Plumb" },
										]}
									/>
								</div>
								<DimensionInput id="rafter-birdsmouth" label={state.birdsmouthBy === "seat" ? "Seat" : "Plumb (heel)"} value={state.birdsmouth} onChange={set("birdsmouth")} hint={state.birdsmouthBy === "seat" ? "Bearing on the plate, usually the wall thickness" : "Vertical height of the heel cut"} className="w-44" />
							</div>
							<div className="grid grid-cols-2 gap-3">
								<DimensionInput id="rafter-wall-t" label="Wall thickness" value={state.wallThickness} onChange={set("wallThickness")} />
								<DimensionInput id="rafter-wall-h" label="Wall height" value={state.wallHeight} onChange={set("wallHeight")} hint="Drawing only" />
							</div>
						</div>
					</section>
					<section className={styles.card} aria-labelledby="rafter-results">
						<h2 id="rafter-results" className={styles.cardTitle}>
							Lengths and cuts
						</h2>
						{rafter ? <ResultList rows={rows} /> : <p className={styles.empty}>Enter a run, a slope under 90° and the rafter size.</p>}
						{rafter?.warnings.map((w) => (
							<p key={w} className={styles.warn}>
								{w}
							</p>
						))}
						{rafter && <p className={styles.note}>Lengths are to the ridge plumb cut on the centre line. Shorten the ridge end by half the ridge thickness measured level ({state.ridgeThickness !== null && state.ridgeThickness > 0 ? `${format(state.ridgeThickness / 2 / Math.cos((rafter.angle * Math.PI) / 180))} along the rafter for a ${format(state.ridgeThickness)} ridge` : "ridge thickness ÷ 2 ÷ cos angle"}).</p>}
					</section>
				</div>

				{rafter && state.run !== null && state.overhang !== null && state.depth !== null && state.wallThickness !== null && state.wallHeight !== null && (
					<>
						<section className={styles.card} aria-labelledby="rafter-diagram">
							<h2 id="rafter-diagram" className={styles.cardTitle}>
								Rafter
							</h2>
							<PrintDiagrams title="Common rafter" subtitle={`Run ${format(state.run)}, ${formatPitch(rafter.pitch)} (${formatAngle(rafter.angle, 2)}), overhang ${format(state.overhang)}, ${format(state.depth)} × ${format(state.thickness ?? 0)}, drawn to fit`}>
								<RafterDiagram rafter={rafter} run={state.run} overhang={state.overhang} depth={state.depth} wallThickness={state.wallThickness} wallHeight={state.wallHeight} format={format} />
							</PrintDiagrams>
						</section>
						<div className="grid gap-4 lg:grid-cols-2">
							<section className={styles.card} aria-labelledby="rafter-birdsmouth">
								<h2 id="rafter-birdsmouth" className={styles.cardTitle}>
									Birdsmouth template
								</h2>
								<p className={styles.note}>Print at 100% and lay the rafter&apos;s bottom edge along the drawing to mark the seat and heel. The dashed lines are the top and outer face of the wall plate.</p>
								<PrintDiagrams title="Birdsmouth" subtitle={`Seat ${format(rafter.seat)}, heel ${format(rafter.heel)}, ${formatAngle(rafter.angle, 2)}, true size`}>
									<CutTemplate rafter={rafter} depth={state.depth} end="birdsmouth" format={format} />
								</PrintDiagrams>
							</section>
							<section className={styles.card} aria-labelledby="rafter-ridge">
								<h2 id="rafter-ridge" className={styles.cardTitle}>
									Ridge plumb cut template
								</h2>
								<p className={styles.note}>The same angle marks the tail plumb cut. Set the saw miter to {formatAngle(rafter.plumbCutAngle, 2)} from square.</p>
								<PrintDiagrams title="Ridge plumb cut" subtitle={`${formatAngle(rafter.plumbCutAngle, 2)} from square, ${format(rafter.plumbDepth)} long, true size`}>
									<CutTemplate rafter={rafter} depth={state.depth} end="ridge" lengthIn={5} format={format} />
								</PrintDiagrams>
							</section>
						</div>
					</>
				)}

				<section className={styles.card} aria-labelledby="rafter-span">
					<h2 id="rafter-span" className={styles.cardTitle}>
						Run from the building width
					</h2>
					<p className={styles.note}>Half the width between the outer wall faces, less half the ridge thickness.</p>
					<div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
						<div className="flex flex-col gap-4">
							<DimensionInput id="rafter-span-width" label="Building width" value={state.buildingWidth} onChange={set("buildingWidth")} hint="Outside of wall to outside of wall" />
							<DimensionInput id="rafter-span-ridge" label="Ridge thickness" value={state.ridgeThickness} onChange={set("ridgeThickness")} />
							{span !== null && (
								<div className="flex flex-wrap items-center gap-3">
									<span className={styles.label}>Run {format(span)}</span>
									<button type="button" className={styles.btn} onClick={() => set("run")(span)}>
										Use this run
									</button>
								</div>
							)}
						</div>
						{span !== null && state.buildingWidth !== null && state.ridgeThickness !== null && <SpanDiagram buildingWidth={state.buildingWidth} ridgeThickness={state.ridgeThickness} run={span} format={format} />}
					</div>
				</section>

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
