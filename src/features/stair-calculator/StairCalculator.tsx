"use client";

import { useMemo, useState } from "react";
import SegmentedControl from "@/components/SegmentedControl";
import { UnitAndPrecisionBar, DimensionInput, NumberField, ResultList, RunningList, PrintDiagrams, LumberTable, ShareCalculation, ConstructionNotes, StairBalusterDiagram } from "@/components/construction";
import type { ResultRow } from "@/components/construction";
import { useConstructionUnits } from "@/hooks/useConstructionUnits";
import { possibleRises, solveStair, stringerRunningPoints, type Construction, type RunBy, type TopTread } from "@/lib/construction/stairUtils";
import { stairBalusters } from "@/lib/construction/balusterUtils";
import { cubicFeet, cubicYards } from "@/lib/construction/concreteUtils";
import { formatAngle } from "@/lib/construction/pitchUtils";
import { StairDiagram, NotchTemplate } from "./StairDiagrams";
import styles from "./StairCalculator.module.scss";

interface StairState {
	topTread: TopTread;
	totalRise: number | null;
	idealRise: number | null;
	risers: number | null;
	runBy: RunBy;
	idealRun: number | null;
	totalRun: number | null;
	angle: number;
	construction: Construction;
	stringerWidth: number | null;
	throat: number | null;
	stairWidth: number | null;
	floorThickness: number | null;
	treadThickness: number | null;
	riserThickness: number | null;
	nosing: number | null;
	showHeadroom: boolean;
	openingLength: number | null;
	balusterWidth: number | null;
	balustersPerTread: number;
	restrict: boolean;
	labels: boolean;
	view: "notched" | "housed";
}

const DEFAULTS: StairState = {
	topTread: "down",
	totalRise: 108,
	idealRise: 7.5,
	risers: null,
	runBy: "ideal-run",
	idealRun: 10,
	totalRun: 130,
	angle: 37,
	construction: "wood",
	stringerWidth: 11.25,
	throat: 5,
	stairWidth: 36,
	floorThickness: 10,
	treadThickness: 1,
	riserThickness: 0.75,
	nosing: 1,
	showHeadroom: true,
	openingLength: 120,
	balusterWidth: 1.25,
	balustersPerTread: 2,
	restrict: true,
	labels: true,
	view: "notched",
};

const num = (v: unknown, lo: number, hi: number, fallback: number | null): number | null => (typeof v === "number" && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : fallback);
const oneOf = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T => (allowed.includes(v as T) ? (v as T) : fallback);
const bool = (v: unknown, fb: boolean) => (typeof v === "boolean" ? v : fb);

function sanitize(s: Partial<StairState>): StairState {
	const len = (v: unknown, fb: number | null) => num(v, 0, 1e4, fb);
	return {
		topTread: oneOf(s.topTread, ["down", "level"] as const, DEFAULTS.topTread),
		totalRise: num(s.totalRise, 1, 1e4, DEFAULTS.totalRise),
		idealRise: num(s.idealRise, 1, 100, DEFAULTS.idealRise),
		risers: s.risers === null ? null : num(s.risers, 2, 200, null),
		runBy: oneOf(s.runBy, ["ideal-run", "total-run", "angle"] as const, DEFAULTS.runBy),
		idealRun: num(s.idealRun, 1, 100, DEFAULTS.idealRun),
		totalRun: num(s.totalRun, 1, 1e4, DEFAULTS.totalRun),
		angle: num(s.angle, 1, 89, DEFAULTS.angle) ?? DEFAULTS.angle,
		construction: oneOf(s.construction, ["wood", "concrete"] as const, DEFAULTS.construction),
		stringerWidth: num(s.stringerWidth, 1, 100, DEFAULTS.stringerWidth),
		throat: num(s.throat, 1, 100, DEFAULTS.throat),
		stairWidth: num(s.stairWidth, 1, 1000, DEFAULTS.stairWidth),
		floorThickness: len(s.floorThickness, DEFAULTS.floorThickness),
		treadThickness: len(s.treadThickness, DEFAULTS.treadThickness),
		riserThickness: len(s.riserThickness, DEFAULTS.riserThickness),
		nosing: len(s.nosing, DEFAULTS.nosing),
		showHeadroom: bool(s.showHeadroom, DEFAULTS.showHeadroom),
		openingLength: len(s.openingLength, DEFAULTS.openingLength),
		balusterWidth: num(s.balusterWidth, 0.1, 100, DEFAULTS.balusterWidth),
		balustersPerTread: Math.round(num(s.balustersPerTread, 2, 4, DEFAULTS.balustersPerTread) ?? 2),
		restrict: bool(s.restrict, DEFAULTS.restrict),
		labels: bool(s.labels, DEFAULTS.labels),
		view: oneOf(s.view, ["notched", "housed"] as const, DEFAULTS.view),
	};
}

export default function StairCalculator() {
	const { format } = useConstructionUnits();
	const [state, setState] = useState<StairState>(DEFAULTS);
	const set = <K extends keyof StairState>(key: K) => (value: StairState[K]) => setState((s) => ({ ...s, [key]: value }));

	const stair = useMemo(() => {
		if (state.totalRise === null || state.idealRise === null || state.idealRun === null || state.totalRun === null || state.stringerWidth === null || state.throat === null || state.stairWidth === null) return null;
		return solveStair({
			totalRise: state.totalRise,
			idealRise: state.idealRise,
			risers: state.risers ?? undefined,
			runBy: state.runBy,
			idealRun: state.idealRun,
			totalRun: state.totalRun,
			angle: state.angle,
			topTread: state.topTread,
			construction: state.construction,
			stringerWidth: state.stringerWidth,
			throat: state.throat,
			stairWidth: state.stairWidth,
			floorThickness: state.floorThickness ?? 0,
			treadThickness: state.treadThickness ?? 0,
			riserThickness: state.riserThickness ?? 0,
			nosing: state.nosing ?? 0,
			openingLength: state.openingLength ?? 0,
			restrict: state.restrict,
		});
	}, [state]);
	const options = useMemo(() => (state.totalRise === null || state.idealRise === null ? [] : possibleRises(state.totalRise, state.idealRise, state.topTread)), [state.totalRise, state.idealRise, state.topTread]);

	const rows: ResultRow[] = stair
		? [
				{ label: "Risers", value: `${stair.risers} × ${format(stair.rise)}`, strong: true },
				{ label: "Treads", value: `${stair.treads} × ${format(stair.run)}`, strong: true, hint: state.topTread === "level" ? "top tread level with the floor" : "floor is the top landing" },
				{ label: "Total run", value: format(stair.totalRun), strong: true },
				{ label: "Stair angle", value: formatAngle(stair.angle, 2) },
				{ label: "2R + T", value: format(stair.twoRisePlusRun, { mode: "in" }), hint: "24 to 25 is comfortable" },
				{ label: "Stringer length", value: format(stair.stringerLength), hint: "on the nosing line; add for the top and bottom cuts" },
				{ label: "Step along stringer", value: format(stair.stepLength), hint: "nosing to nosing" },
				...(state.construction === "wood" ? [{ label: "Stringer left below notch", value: format(stair.throat), strong: stair.throat < 3.5 }, { label: "Bottom drop", value: format(stair.bottomDrop), hint: "cut off the bottom so the first rise matches once treads are on" }] : []),
				...(state.showHeadroom ? [{ label: "Headroom at the opening", value: format(stair.headroom), strong: stair.headroom < 80, hint: `80 in needs an opening ${format(stair.openingFor80)} long` }] : []),
				...(state.construction === "concrete" ? [{ label: "Concrete", value: `${cubicYards(stair.concreteVolume).toFixed(2)} yd³`, strong: true, hint: `${cubicFeet(stair.concreteVolume).toFixed(1)} ft³ for a ${format(state.stairWidth!)} wide flight with a ${format(state.throat!)} waist` }] : []),
			]
		: [];

	const balusters = useMemo(() => (stair && state.balusterWidth !== null ? stairBalusters({ run: stair.run, nosing: state.nosing ?? 0, width: state.balusterWidth, perTread: state.balustersPerTread, rise: stair.rise, treads: Math.min(stair.treads, 3) }) : null), [stair, state.balusterWidth, state.balustersPerTread, state.nosing]);
	const openingMax = stair ? Math.max(stair.totalRun + 24, 60) : 240;
	const openingFill = state.openingLength === null ? 0 : (Math.min(state.openingLength, openingMax) / openingMax) * 100;

	return (
		<div className={styles.container}>
			<div className="flex flex-col gap-6">
				<UnitAndPrecisionBar />

				<div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
					<section className={styles.card} aria-labelledby="stair-heading">
						<h2 id="stair-heading" className={styles.cardTitle}>
							Straight stair
						</h2>
						<p className={styles.note}>Total rise is finished floor to finished floor. The riser count comes from the ideal rise; pick another from the list if the run or headroom needs it.</p>
						<div className="flex flex-col gap-4">
							<div className="flex flex-col gap-1">
								<span className={styles.label}>Top tread</span>
								<SegmentedControl<TopTread>
									label="Top tread"
									size="sm"
									value={state.topTread}
									onChange={set("topTread")}
									options={[
										{ value: "down", label: "One rise down" },
										{ value: "level", label: "Level with floor" },
									]}
								/>
							</div>
							<div className="grid grid-cols-2 gap-3">
								<DimensionInput id="stair-rise" label="Total rise" value={state.totalRise} onChange={(v) => setState((s) => ({ ...s, totalRise: v, risers: null }))} />
								<DimensionInput id="stair-ideal" label="Ideal rise" value={state.idealRise} onChange={(v) => setState((s) => ({ ...s, idealRise: v, risers: null }))} />
							</div>
							{options.length > 0 && (
								<div className="flex flex-col gap-1">
									<span className={styles.label}>Possible rises</span>
									<div className={styles.rises} role="group" aria-label="Possible rises">
										{options.map((o) => (
											<button key={o.risers} type="button" className={styles.riseBtn} aria-pressed={stair?.risers === o.risers} onClick={() => set("risers")(o.risers)}>
												{o.risers} × {format(o.rise)}
												<small>{o.treads} treads</small>
											</button>
										))}
									</div>
								</div>
							)}
							<div className="flex flex-wrap items-end gap-x-6 gap-y-3">
								<div className="flex flex-col gap-1">
									<span className={styles.label}>Run from</span>
									<SegmentedControl<RunBy>
										label="Run from"
										size="sm"
										fill={false}
										value={state.runBy}
										onChange={set("runBy")}
										options={[
											{ value: "ideal-run", label: "Ideal run" },
											{ value: "total-run", label: "Total run" },
											{ value: "angle", label: "Angle" },
										]}
									/>
								</div>
								{state.runBy === "ideal-run" && <DimensionInput id="stair-run" label="Ideal run" value={state.idealRun} onChange={set("idealRun")} className="w-40" />}
								{state.runBy === "total-run" && <DimensionInput id="stair-total-run" label="Total run" value={state.totalRun} onChange={set("totalRun")} className="w-40" />}
								{state.runBy === "angle" && <NumberField id="stair-angle" label="Angle" value={state.angle} onChange={set("angle")} unit="°" min={1} max={89} step="any" className="w-40" />}
							</div>

							<h3 className={styles.subTitle}>Construction</h3>
							<div className="flex flex-wrap items-end gap-x-6 gap-y-3">
								<div className="flex flex-col gap-1">
									<span className={styles.label}>Built from</span>
									<SegmentedControl<Construction>
										label="Built from"
										size="sm"
										fill={false}
										value={state.construction}
										onChange={set("construction")}
										options={[
											{ value: "wood", label: "Wood stringers" },
											{ value: "concrete", label: "Concrete" },
										]}
									/>
								</div>
								{state.construction === "wood" ? (
									<DimensionInput id="stair-stringer" label="Stringer width" value={state.stringerWidth} onChange={set("stringerWidth")} hint={`11 1/4" for a 2x12`} className="w-40" />
								) : (
									<DimensionInput id="stair-throat" label="Waist thickness" value={state.throat} onChange={set("throat")} hint="Slab under the steps" className="w-40" />
								)}
							</div>
							<div className="grid grid-cols-2 gap-3">
								<DimensionInput id="stair-width" label="Stair width" value={state.stairWidth} onChange={set("stairWidth")} />
								<DimensionInput id="stair-floor" label="Floor thickness" value={state.floorThickness} onChange={set("floorThickness")} hint="Upper floor, joists included" />
								<DimensionInput id="stair-tread-t" label="Tread thickness" value={state.treadThickness} onChange={set("treadThickness")} />
								<DimensionInput id="stair-riser-t" label="Riser thickness" value={state.riserThickness} onChange={set("riserThickness")} />
								<DimensionInput id="stair-nosing" label="Nosing" value={state.nosing} onChange={set("nosing")} />
							</div>

							<h3 className={styles.subTitle}>Headroom</h3>
							<label className={styles.check}>
								<input type="checkbox" checked={state.showHeadroom} onChange={(e) => set("showHeadroom")(e.target.checked)} />
								Show headroom and the floor opening
							</label>
							{state.showHeadroom && (
								<div className="flex flex-col gap-1">
									<DimensionInput id="stair-opening" label="Opening length" value={state.openingLength} onChange={set("openingLength")} hint="From the top riser back along the floor above" />
									<input type="range" aria-label="Opening length slider" className={styles.slider} style={{ "--fill": `${openingFill}%` } as React.CSSProperties} min={0} max={Math.round(openingMax)} step={1} value={Math.round(Math.min(state.openingLength ?? 0, openingMax))} onChange={(e) => set("openingLength")(Number(e.target.value))} />
								</div>
							)}

							<h3 className={styles.subTitle}>Balusters</h3>
							<div className="flex flex-wrap items-end gap-x-6 gap-y-3">
								<DimensionInput id="stair-bal-w" label="Baluster width" value={state.balusterWidth} onChange={set("balusterWidth")} className="w-36" />
								<div className="flex flex-col gap-1">
									<span className={styles.label}>Per tread</span>
									<SegmentedControl<"2" | "3" | "4">
										label="Balusters per tread"
										size="sm"
										fill={false}
										value={`${state.balustersPerTread}` as "2" | "3" | "4"}
										onChange={(v) => set("balustersPerTread")(Number(v))}
										options={[
											{ value: "2", label: "2" },
											{ value: "3", label: "3" },
											{ value: "4", label: "4" },
										]}
									/>
								</div>
							</div>

							<div className="flex flex-wrap gap-x-6 gap-y-2">
								<label className={styles.check}>
									<input type="checkbox" checked={state.restrict} onChange={(e) => set("restrict")(e.target.checked)} />
									Restrict extreme values
								</label>
								<label className={styles.check}>
									<input type="checkbox" checked={state.labels} onChange={(e) => set("labels")(e.target.checked)} />
									Label the diagram
								</label>
							</div>
						</div>
					</section>
					<section className={styles.card} aria-labelledby="stair-results">
						<h2 id="stair-results" className={styles.cardTitle}>
							Rise and run
						</h2>
						{stair ? <ResultList rows={rows} /> : <p className={styles.empty}>Enter the total rise, an ideal rise and a run.</p>}
						{stair?.warnings.map((w) => (
							<p key={w} className={styles.warn}>
								{w}
							</p>
						))}
						<p className={`${styles.note} mt-3`}>Geometric only. Stair codes set the limits on rise, run, headroom, width and guard heights; check yours before building.</p>
					</section>
				</div>

				{stair && (
					<>
						<section className={styles.card} aria-labelledby="stair-diagram">
							<div className="flex flex-wrap items-center justify-between gap-3">
								<h2 id="stair-diagram" className={styles.cardTitle}>
									Flight
								</h2>
								{state.construction === "wood" && (
									<SegmentedControl<"notched" | "housed">
										label="Stringer type"
										size="sm"
										fill={false}
										value={state.view}
										onChange={set("view")}
										options={[
											{ value: "notched", label: "Notched stringer" },
											{ value: "housed", label: "Housed stringer" },
										]}
									/>
								)}
							</div>
							<PrintDiagrams title="Straight stair" subtitle={`${stair.risers} × ${format(stair.rise)} rise, ${stair.treads} × ${format(stair.run)} run, ${formatAngle(stair.angle, 1)}${state.showHeadroom ? `, headroom ${format(stair.headroom)} at a ${format(state.openingLength ?? 0)} opening` : ""}, drawn to fit`}>
								<StairDiagram stair={stair} view={state.view} construction={state.construction} stringerWidth={state.stringerWidth!} throat={state.throat!} treadThickness={state.treadThickness ?? 0} riserThickness={state.riserThickness ?? 0} nosing={state.nosing ?? 0} floorThickness={state.floorThickness ?? 0} openingLength={state.openingLength ?? 0} showHeadroom={state.showHeadroom} labels={state.labels} format={format} />
							</PrintDiagrams>
							<p className={styles.legend}>Violet dashed line is the nosing line. {state.showHeadroom && "Headroom is measured plumb from the nosing line to the underside of the floor at the opening edge; move the slider to see it change."}</p>
						</section>

						<div className="grid gap-4 lg:grid-cols-2">
							<RunningList title="Tread heights" positions={stair.treadHeights} labelFor={(i) => `Tread ${i + 1}${stair.landingCandidates.includes(i + 1) ? " · landing possible" : ""}`} />
							<RunningList title="Stringer running points" positions={stringerRunningPoints(stair)} labelFor={(i) => (i === 0 ? "Bottom" : `Nosing ${i}`)} />
						</div>
						<p className={styles.note}>Tread heights are from the lower floor to the top of each tread, each rounded on its own. Landings are flagged where at least 36&quot; of rise remains above and below. Stringer points are along the edge from the bottom end, nosing to nosing.</p>

						{state.construction === "wood" && (
							<section className={styles.card} aria-labelledby="stair-template">
								<h2 id="stair-template" className={styles.cardTitle}>
									Stringer notching template
								</h2>
								<p className={styles.note}>Print at 100% and step it along the board, or set a framing square to {format(stair.rise)} rise and {format(stair.run)} run. Drop the bottom by the tread thickness.</p>
								<PrintDiagrams title="Stringer notching" subtitle={`Rise ${format(stair.rise)}, run ${format(stair.run)}, ${formatAngle(stair.angle, 2)}, ${format(stair.throat)} left below the notch, true size`}>
									<NotchTemplate stair={stair} stringerWidth={state.stringerWidth!} treadThickness={state.treadThickness ?? 0} nosing={state.nosing ?? 0} format={format} />
								</PrintDiagrams>
							</section>
						)}

						{balusters && (
							<section className={styles.card} aria-labelledby="stair-balusters">
								<h2 id="stair-balusters" className={styles.cardTitle}>
									Balusters on the treads
								</h2>
								<p className={styles.note}>{state.balustersPerTread} per tread at {format(balusters.centers)} centres, first one {format(balusters.fromRiser[0])} from the riser face; each is {format(balusters.lengthStep)} longer than the one in front.</p>
								<StairBalusterDiagram result={balusters} run={stair.run} rise={stair.rise} nosing={state.nosing ?? 0} width={state.balusterWidth!} treadThickness={state.treadThickness ?? 0} riserThickness={state.riserThickness ?? 0} treads={Math.min(stair.treads, 3)} format={format} />
							</section>
						)}
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
