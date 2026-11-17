"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import SegmentedControl from "@/components/SegmentedControl";
import { UnitAndPrecisionBar, DimensionInput, NumberField, ResultList, RunningList, PrintDiagrams, ShareCalculation, ConstructionNotes } from "@/components/construction";
import type { ResultRow } from "@/components/construction";
import { useConstructionUnits } from "@/hooks/useConstructionUnits";
import { wainscot, stairWainscot } from "@/lib/construction/wainscotUtils";
import { formatAngle } from "@/lib/construction/pitchUtils";
import { FlatWainscotDiagram, StairWainscotDiagram } from "./WainscotDiagrams";
import styles from "./WainscotCalculator.module.scss";

type Mode = "flat" | "stair";

interface WainscotState {
	mode: Mode;
	wallLength: number | null;
	frameHeight: number | null;
	stileWidth: number | null;
	topRail: number | null;
	bottomRail: number | null;
	by: "count" | "width";
	panels: number;
	targetWidth: number | null;
	rise: number | null;
	run: number | null;
	stairBy: "length" | "treads";
	levelLength: number | null;
	treads: number;
	panelsBy: "per-tread" | "width";
	panelsPerTread: number;
}

const DEFAULTS: WainscotState = {
	mode: "flat",
	wallLength: 120,
	frameHeight: 36,
	stileWidth: 3,
	topRail: 3,
	bottomRail: 5,
	by: "count",
	panels: 4,
	targetWidth: 24,
	rise: 7.5,
	run: 10,
	stairBy: "treads",
	levelLength: 120,
	treads: 12,
	panelsBy: "per-tread",
	panelsPerTread: 1,
};

const num = (v: unknown, lo: number, hi: number, fallback: number | null): number | null => (typeof v === "number" && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : fallback);
const oneOf = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T => (allowed.includes(v as T) ? (v as T) : fallback);
const int = (v: unknown, lo: number, hi: number, fb: number) => Math.round(num(v, lo, hi, fb) ?? fb);

function sanitize(s: Partial<WainscotState>): WainscotState {
	return {
		mode: oneOf(s.mode, ["flat", "stair"] as const, DEFAULTS.mode),
		wallLength: num(s.wallLength, 1, 2400, DEFAULTS.wallLength),
		frameHeight: num(s.frameHeight, 1, 240, DEFAULTS.frameHeight),
		stileWidth: num(s.stileWidth, 0.25, 48, DEFAULTS.stileWidth),
		topRail: num(s.topRail, 0, 48, DEFAULTS.topRail),
		bottomRail: num(s.bottomRail, 0, 48, DEFAULTS.bottomRail),
		by: oneOf(s.by, ["count", "width"] as const, DEFAULTS.by),
		panels: int(s.panels, 1, 100, DEFAULTS.panels),
		targetWidth: num(s.targetWidth, 1, 240, DEFAULTS.targetWidth),
		rise: num(s.rise, 1, 20, DEFAULTS.rise),
		run: num(s.run, 1, 30, DEFAULTS.run),
		stairBy: oneOf(s.stairBy, ["length", "treads"] as const, DEFAULTS.stairBy),
		levelLength: num(s.levelLength, 1, 2400, DEFAULTS.levelLength),
		treads: int(s.treads, 1, 60, DEFAULTS.treads),
		panelsBy: oneOf(s.panelsBy, ["per-tread", "width"] as const, DEFAULTS.panelsBy),
		panelsPerTread: int(s.panelsPerTread, 1, 4, DEFAULTS.panelsPerTread),
	};
}

export default function WainscotCalculator() {
	const { format } = useConstructionUnits();
	const [state, setState] = useState<WainscotState>(DEFAULTS);
	const set = <K extends keyof WainscotState>(key: K) => (value: WainscotState[K]) => setState((s) => ({ ...s, [key]: value }));

	const flat = useMemo(() => (state.mode !== "flat" || state.wallLength === null || state.frameHeight === null || state.stileWidth === null || state.topRail === null || state.bottomRail === null || state.targetWidth === null ? null : wainscot({ wallLength: state.wallLength, frameHeight: state.frameHeight, stileWidth: state.stileWidth, topRail: state.topRail, bottomRail: state.bottomRail, by: state.by, panels: state.panels, targetWidth: state.targetWidth })), [state]);
	const stair = useMemo(() => (state.mode !== "stair" || state.rise === null || state.run === null || state.levelLength === null || state.frameHeight === null || state.stileWidth === null || state.topRail === null || state.bottomRail === null || state.targetWidth === null ? null : stairWainscot({ rise: state.rise, run: state.run, by: state.stairBy, levelLength: state.levelLength, treads: state.treads, frameHeight: state.frameHeight, stileWidth: state.stileWidth, topRail: state.topRail, bottomRail: state.bottomRail, panelsBy: state.panelsBy, panelsPerTread: state.panelsPerTread, targetWidth: state.targetWidth })), [state]);
	const result = flat ?? stair;

	const rows: ResultRow[] = flat
		? [
				{ label: "Panels", value: `${flat.panelCount}`, strong: true, hint: `${flat.stileCount} stiles` },
				{ label: "Panel width", value: format(flat.panelWidth), strong: true, hint: "between stiles" },
				{ label: "Opening height", value: format(flat.openingHeight), hint: "between the rails; stile length" },
				{ label: "Rails", value: `2 × ${format(flat.railLength)}` },
			]
		: stair
			? [
					{ label: "Rake", value: formatAngle(stair.angle, 2), strong: true, hint: `${format(state.rise ?? 0)} rise on ${format(state.run ?? 0)} run` },
					{ label: "Panels", value: `${stair.panelCount}`, strong: true, hint: `${stair.stileCount} plumb stiles over ${format(stair.levelLength)} level, ${format(stair.rakeLength)} along the rake` },
					{ label: "Panel width", value: format(stair.panelWidth), strong: true, hint: `level; ${format(stair.panelRakeWidth)} along the rake` },
					{ label: "Opening height", value: format(stair.openingHeight), hint: `plumb, between rails ${format(stair.topRailPlumb)} and ${format(stair.bottomRailPlumb)} taken plumb` },
					{ label: "Stile end cuts", value: formatAngle(stair.stileEndCut, 2), hint: "from square, both ends, parallel" },
					{ label: "Rail end cuts", value: formatAngle(stair.railEndCut, 2), hint: "from square where the rails meet the end stiles" },
				]
			: [];

	return (
		<div className={styles.container}>
			<div className="flex flex-col gap-6">
				<UnitAndPrecisionBar />

				<div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
					<section className={styles.card} aria-labelledby="wn-heading">
						<h2 id="wn-heading" className={styles.cardTitle}>
							Wainscoting
						</h2>
						<SegmentedControl<Mode>
							label="Wall"
							size="sm"
							value={state.mode}
							onChange={set("mode")}
							options={[
								{ value: "flat", label: "Flat wall" },
								{ value: "stair", label: "Stair wall" },
							]}
						/>
						<p className={`${styles.note} mt-3`}>
							Plumb stiles with a rail top and bottom; stiles at both ends. {state.mode === "stair" && <>Rise and run per step as in the <Link href="/tools/stair-calculator">stair calculator</Link>; rails follow the rake and the panels are parallelograms.</>}
						</p>
						<div className="flex flex-col gap-4">
							{state.mode === "flat" ? (
								<div className="grid grid-cols-2 gap-3">
									<DimensionInput id="wn-length" label="Wall length" value={state.wallLength} onChange={set("wallLength")} />
									<DimensionInput id="wn-height" label="Frame height" value={state.frameHeight} onChange={set("frameHeight")} hint="Base rail to cap" />
								</div>
							) : (
								<>
									<div className="grid grid-cols-3 gap-3">
										<DimensionInput id="wn-rise" label="Rise" value={state.rise} onChange={set("rise")} hint="Per step" />
										<DimensionInput id="wn-run" label="Run" value={state.run} onChange={set("run")} hint="Per step" />
										<DimensionInput id="wn-height" label="Frame height" value={state.frameHeight} onChange={set("frameHeight")} hint="Plumb, from the nosings" />
									</div>
									<div className="flex flex-wrap items-end gap-x-6 gap-y-3">
										<div className="flex flex-col gap-1">
											<span className={styles.label}>Wall by</span>
											<SegmentedControl<"length" | "treads">
												label="Wall by"
												size="sm"
												fill={false}
												value={state.stairBy}
												onChange={set("stairBy")}
												options={[
													{ value: "treads", label: "Treads" },
													{ value: "length", label: "Level length" },
												]}
											/>
										</div>
										{state.stairBy === "treads" ? <NumberField id="wn-treads" label="Treads" value={state.treads} onChange={(v) => set("treads")(int(v, 1, 60, 1))} min={1} max={60} step={1} className="w-28" /> : <DimensionInput id="wn-level" label="Level length" value={state.levelLength} onChange={set("levelLength")} className="w-40" />}
									</div>
								</>
							)}
							<div className="grid grid-cols-3 gap-3">
								<DimensionInput id="wn-stile" label="Stile width" value={state.stileWidth} onChange={set("stileWidth")} />
								<DimensionInput id="wn-top" label="Top rail" value={state.topRail} onChange={set("topRail")} hint={state.mode === "stair" ? "Square to the rake" : ""} />
								<DimensionInput id="wn-bottom" label="Bottom rail" value={state.bottomRail} onChange={set("bottomRail")} hint={state.mode === "stair" ? "Square to the rake" : ""} />
							</div>
							{state.mode === "flat" ? (
								<div className="flex flex-wrap items-end gap-x-6 gap-y-3">
									<div className="flex flex-col gap-1">
										<span className={styles.label}>Panels by</span>
										<SegmentedControl<"count" | "width">
											label="Panels by"
											size="sm"
											fill={false}
											value={state.by}
											onChange={(v) => setState((s) => ({ ...s, by: v, ...(flat && v === "count" ? { panels: flat.panelCount } : {}), ...(flat && v === "width" ? { targetWidth: Number(flat.panelWidth.toFixed(4)) } : {}) }))}
											options={[
												{ value: "count", label: "Count" },
												{ value: "width", label: "Target width" },
											]}
										/>
									</div>
									{state.by === "count" ? <NumberField id="wn-count" label="Panels" value={state.panels} onChange={(v) => set("panels")(int(v, 1, 100, 1))} min={1} max={100} step={1} className="w-28" /> : <DimensionInput id="wn-target" label="Target panel width" value={state.targetWidth} onChange={set("targetWidth")} className="w-40" />}
								</div>
							) : (
								<div className="flex flex-wrap items-end gap-x-6 gap-y-3">
									<div className="flex flex-col gap-1">
										<span className={styles.label}>Panels by</span>
										<SegmentedControl<"per-tread" | "width">
											label="Panels by"
											size="sm"
											fill={false}
											value={state.panelsBy}
											onChange={set("panelsBy")}
											options={[
												{ value: "per-tread", label: "Per tread" },
												{ value: "width", label: "Target width" },
											]}
										/>
									</div>
									{state.panelsBy === "per-tread" ? <NumberField id="wn-per-tread" label="Panels per tread" value={state.panelsPerTread} onChange={(v) => set("panelsPerTread")(int(v, 1, 4, 1))} min={1} max={4} step={1} className="w-32" /> : <DimensionInput id="wn-target" label="Target panel width" value={state.targetWidth} onChange={set("targetWidth")} hint="Level" className="w-40" />}
								</div>
							)}
						</div>
					</section>

					<section className={styles.card} aria-labelledby="wn-results">
						<h2 id="wn-results" className={styles.cardTitle}>
							Frame
						</h2>
						{result ? <ResultList rows={rows} /> : <p className={styles.empty}>The stiles must leave room for the panels and the rails for the opening.</p>}
						{result?.warnings.map((w) => (
							<p key={w} className={styles.warn}>
								{w}
							</p>
						))}
						{result && (
							<table className={`${styles.table} mt-4`}>
								<caption className="sr-only">Cut list</caption>
								<thead>
									<tr>
										<th scope="col">Item</th>
										<th scope="col">Count</th>
										<th scope="col">Length</th>
										<th scope="col">Width</th>
										<th scope="col">Note</th>
									</tr>
								</thead>
								<tbody>
									{result.cutList.map((c) => (
										<tr key={c.item}>
											<td>{c.item}</td>
											<td className="mono">{c.count}</td>
											<td className="mono">{format(c.length)}</td>
											<td className="mono">{format(c.width)}</td>
											<td className={styles.hint}>{c.note ?? ""}</td>
										</tr>
									))}
								</tbody>
							</table>
						)}
					</section>
				</div>

				{flat && state.wallLength !== null && state.frameHeight !== null && state.stileWidth !== null && state.topRail !== null && state.bottomRail !== null && (
					<>
						<section className={styles.card} aria-labelledby="wn-elev">
							<h2 id="wn-elev" className={styles.cardTitle}>
								Elevation
							</h2>
							<PrintDiagrams title="Wainscoting" subtitle={`${format(state.wallLength)} × ${format(state.frameHeight)}, ${flat.panelCount} panels, drawn to fit`}>
								<FlatWainscotDiagram frame={flat} wallLength={state.wallLength} frameHeight={state.frameHeight} stileWidth={state.stileWidth} topRail={state.topRail} bottomRail={state.bottomRail} format={format} />
							</PrintDiagrams>
						</section>
						<RunningList title="Stile positions, near face" positions={flat.positions} />
					</>
				)}
				{stair && state.frameHeight !== null && state.stileWidth !== null && state.topRail !== null && state.bottomRail !== null && state.rise !== null && state.run !== null && (
					<>
						<section className={styles.card} aria-labelledby="wn-stair">
							<h2 id="wn-stair" className={styles.cardTitle}>
								Stair elevation
							</h2>
							<PrintDiagrams title="Stair wainscoting" subtitle={`${stair.panelCount} panels at ${formatAngle(stair.angle, 1)}, ${format(stair.rakeLength)} along the rake, drawn to fit`}>
								<StairWainscotDiagram frame={stair} frameHeight={state.frameHeight} stileWidth={state.stileWidth} topRail={state.topRail} bottomRail={state.bottomRail} rise={state.rise} run={state.run} format={format} />
							</PrintDiagrams>
						</section>
						<div className="grid gap-4 lg:grid-cols-2">
							<RunningList title="Stile positions, level" positions={stair.positions} />
							<RunningList title="Stile positions along the rake" positions={stair.rakePositions} />
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
