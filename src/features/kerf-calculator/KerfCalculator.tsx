"use client";

import { useMemo, useState } from "react";
import SegmentedControl from "@/components/SegmentedControl";
import { UnitAndPrecisionBar, DimensionInput, NumberField, ResultList, RunningList, PrintDiagrams, ShareCalculation, ConstructionNotes } from "@/components/construction";
import type { ResultRow } from "@/components/construction";
import { useConstructionUnits } from "@/hooks/useConstructionUnits";
import { kerfBend, kerfEllipse } from "@/lib/construction/kerfUtils";
import { formatAngle } from "@/lib/construction/pitchUtils";
import { FlatBoardDiagram, BentBoardDiagram, KerfStripDiagrams, EllipseDiagram } from "./KerfDiagrams";
import styles from "./KerfCalculator.module.scss";

type Mode = "bend" | "ellipse";

interface KerfState {
	mode: Mode;
	thickness: number | null;
	kerfWidth: number | null;
	remaining: number | null;
	insideRadius: number | null;
	by: "angle" | "arc";
	angle: number;
	arcLength: number | null;
	round: "up" | "down";
	width: number | null;
	rise: number | null;
}

const DEFAULTS: KerfState = {
	mode: "bend",
	thickness: 0.75,
	kerfWidth: 0.125,
	remaining: 0.125,
	insideRadius: 6,
	by: "angle",
	angle: 90,
	arcLength: 10.6,
	round: "up",
	width: 48,
	rise: 12,
};

const num = (v: unknown, lo: number, hi: number, fallback: number | null): number | null => (typeof v === "number" && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : fallback);
const oneOf = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T => (allowed.includes(v as T) ? (v as T) : fallback);

function sanitize(s: Partial<KerfState>): KerfState {
	return {
		mode: oneOf(s.mode, ["bend", "ellipse"] as const, DEFAULTS.mode),
		thickness: num(s.thickness, 0.05, 12, DEFAULTS.thickness),
		kerfWidth: num(s.kerfWidth, 0.01, 1, DEFAULTS.kerfWidth),
		remaining: num(s.remaining, 0.01, 12, DEFAULTS.remaining),
		insideRadius: num(s.insideRadius, 0, 1000, DEFAULTS.insideRadius),
		by: oneOf(s.by, ["angle", "arc"] as const, DEFAULTS.by),
		angle: num(s.angle, 1, 360, DEFAULTS.angle) ?? DEFAULTS.angle,
		arcLength: num(s.arcLength, 0.1, 5000, DEFAULTS.arcLength),
		round: oneOf(s.round, ["up", "down"] as const, DEFAULTS.round),
		width: num(s.width, 1, 1000, DEFAULTS.width),
		rise: num(s.rise, 0.1, 500, DEFAULTS.rise),
	};
}

export default function KerfCalculator() {
	const { format } = useConstructionUnits();
	const [state, setState] = useState<KerfState>(DEFAULTS);
	const set = <K extends keyof KerfState>(key: K) => (value: KerfState[K]) => setState((s) => ({ ...s, [key]: value }));

	const bend = useMemo(() => (state.mode !== "bend" || state.thickness === null || state.kerfWidth === null || state.remaining === null || state.insideRadius === null || state.arcLength === null ? null : kerfBend({ thickness: state.thickness, kerfWidth: state.kerfWidth, remaining: state.remaining, insideRadius: state.insideRadius, by: state.by, angle: state.angle, arcLength: state.arcLength, round: state.round })), [state]);
	const ellipse = useMemo(() => (state.mode !== "ellipse" || state.thickness === null || state.kerfWidth === null || state.remaining === null || state.width === null || state.rise === null ? null : kerfEllipse({ thickness: state.thickness, kerfWidth: state.kerfWidth, remaining: state.remaining, width: state.width, rise: state.rise })), [state]);
	const result = bend ?? ellipse;

	const bendRows: ResultRow[] = bend
		? [
				{ label: "Kerfs", value: `${bend.kerfs}`, strong: true, hint: `${formatAngle(bend.anglePerKerf, 2)} each; a kerf closes fully at ${formatAngle(bend.anglePerKerfClosed, 2)}` },
				{ label: "Kerf spacing", value: format(bend.spacing), strong: true, hint: "centre to centre on the outside face" },
				{ label: "Kerf depth", value: format(bend.kerfDepth), hint: `leaves ${format(state.remaining ?? 0)}` },
				{ label: "Bend length", value: format(bend.bendLength), hint: "along the outside face; first kerf half a spacing in" },
				{ label: "Inside arc", value: format(bend.insideArc), hint: `on the ${format(state.insideRadius ?? 0)} radius` },
				{ label: "Outside arc", value: format(bend.outsideArc), hint: `on the ${format(bend.outsideRadius)} radius` },
				{ label: "Gap left in each kerf", value: format(bend.gapLeft), hint: bend.gapLeft < 1e-6 ? "kerfs close fully" : "on the inside face after bending; glue fills it" },
			]
		: [];
	const ellipseRows: ResultRow[] = ellipse
		? [
				{ label: "Kerfs", value: `${ellipse.kerfs}`, strong: true, hint: `${formatAngle(ellipse.anglePerKerf, 2)} of turn each around the half ellipse` },
				{ label: "Kerf spacing", value: `${format(ellipse.minSpacing)} to ${format(ellipse.maxSpacing)}`, strong: true, hint: "tightest at the ends, widest at the middle" },
				{ label: "Kerf depth", value: format(ellipse.kerfDepth), hint: `leaves ${format(state.remaining ?? 0)}` },
				{ label: "Board length", value: format(ellipse.outsideLength), hint: `outside face; ${format(ellipse.insideLength)} on the inside` },
				{ label: "Radius of curvature", value: `${format(ellipse.minRadius)} to ${format(ellipse.maxRadius)}`, hint: "inside face, ends to middle" },
			]
		: [];

	const positions = bend ? bend.positions : ellipse ? ellipse.kerfList.map((k) => k.position) : [];
	const stripLength = bend ? bend.bendLength : ellipse ? ellipse.outsideLength : 0;

	return (
		<div className={styles.container}>
			<div className="flex flex-col gap-6">
				<UnitAndPrecisionBar />

				<div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
					<section className={styles.card} aria-labelledby="kf-heading">
						<h2 id="kf-heading" className={styles.cardTitle}>
							Kerf bending
						</h2>
						<SegmentedControl<Mode>
							label="Curve"
							size="sm"
							value={state.mode}
							onChange={set("mode")}
							options={[
								{ value: "bend", label: "Radius bend" },
								{ value: "ellipse", label: "Half ellipse" },
							]}
						/>
						<p className={`${styles.note} mt-3`}>Kerfs are cut across the inside face, leaving a skin on the outside. Each kerf closes by the blade width as the board turns, so the spacing follows the radius.</p>
						<div className="flex flex-col gap-4">
							<div className="grid grid-cols-3 gap-3">
								<DimensionInput id="kf-thick" label="Board thickness" value={state.thickness} onChange={set("thickness")} />
								<DimensionInput id="kf-kerf" label="Kerf width" value={state.kerfWidth} onChange={set("kerfWidth")} hint="Blade" />
								<DimensionInput id="kf-remaining" label="Wood left" value={state.remaining} onChange={set("remaining")} hint="Under each kerf" />
							</div>
							{state.mode === "bend" ? (
								<>
									<DimensionInput id="kf-radius" label="Inside radius" value={state.insideRadius} onChange={set("insideRadius")} hint="To the kerfed face" />
									<div className="flex flex-wrap items-end gap-x-6 gap-y-3">
										<div className="flex flex-col gap-1">
											<span className={styles.label}>Bend as</span>
											<SegmentedControl<"angle" | "arc">
												label="Bend as"
												size="sm"
												fill={false}
												value={state.by}
												onChange={(v) => setState((s) => ({ ...s, by: v, ...(bend && v === "arc" ? { arcLength: Number(bend.outsideArc.toFixed(4)) } : {}), ...(bend && v === "angle" ? { angle: Number(bend.angle.toFixed(2)) } : {}) }))}
												options={[
													{ value: "angle", label: "Angle" },
													{ value: "arc", label: "Outside arc" },
												]}
											/>
										</div>
										{state.by === "angle" ? <NumberField id="kf-angle" label="Angle" value={state.angle} onChange={set("angle")} unit="°" min={1} max={360} step="any" className="w-32" /> : <DimensionInput id="kf-arc" label="Outside arc" value={state.arcLength} onChange={set("arcLength")} className="w-36" />}
									</div>
									<div className="flex flex-col gap-1">
										<span className={styles.label}>Kerf count</span>
										<SegmentedControl<"up" | "down">
											label="Kerf count"
											size="sm"
											fill={false}
											value={state.round}
											onChange={set("round")}
											options={[
												{ value: "up", label: "Round up, kerfs stay a touch open" },
												{ value: "down", label: "Round down, kerfs close fully" },
											]}
										/>
									</div>
								</>
							) : (
								<div className="grid grid-cols-2 gap-3">
									<DimensionInput id="kf-width" label="Width" value={state.width} onChange={set("width")} hint="End to end on the inside face" />
									<DimensionInput id="kf-rise" label="Rise" value={state.rise} onChange={set("rise")} hint="At the middle" />
								</div>
							)}
						</div>
					</section>

					<section className={styles.card} aria-labelledby="kf-results">
						<h2 id="kf-results" className={styles.cardTitle}>
							Kerfs
						</h2>
						{result ? <ResultList rows={bend ? bendRows : ellipseRows} /> : <p className={styles.empty}>Enter the board, blade and the wood to leave; the wood left must be less than the thickness.</p>}
						{result?.warnings.map((w) => (
							<p key={w} className={styles.warn}>
								{w}
							</p>
						))}
						{ellipse && (
							<table className={`${styles.table} mt-4`}>
								<caption className="sr-only">Kerf positions and local radius</caption>
								<thead>
									<tr>
										<th scope="col">#</th>
										<th scope="col">From the end</th>
										<th scope="col">Radius here</th>
										<th scope="col">To next</th>
									</tr>
								</thead>
								<tbody>
									{ellipse.kerfList.map((k) => (
										<tr key={k.index}>
											<td className="mono">{k.index}</td>
											<td className="mono">{format(k.position)}</td>
											<td className="mono">{format(k.radius)}</td>
											<td className="mono">{k.spacingAfter ? format(k.spacingAfter) : ""}</td>
										</tr>
									))}
								</tbody>
							</table>
						)}
					</section>
				</div>

				{result && state.thickness !== null && state.kerfWidth !== null && (
					<>
						<section className={styles.card} aria-labelledby="kf-flat">
							<h2 id="kf-flat" className={styles.cardTitle}>
								Board flat
							</h2>
							<PrintDiagrams title="Kerfed board" subtitle={`${positions.length} kerfs ${format(result.kerfDepth)} deep over ${format(stripLength)}`}>
								<FlatBoardDiagram thickness={state.thickness} kerfWidth={state.kerfWidth} kerfDepth={result.kerfDepth} positions={positions} length={stripLength} format={format} />
							</PrintDiagrams>
						</section>
						<section className={styles.card} aria-labelledby="kf-bent">
							<h2 id="kf-bent" className={styles.cardTitle}>
								Board bent
							</h2>
							<PrintDiagrams title={bend ? "Bent board" : "Half ellipse"} subtitle={bend ? `${formatAngle(bend.angle, 1)} on a ${format(state.insideRadius ?? 0)} inside radius` : `${format(state.width ?? 0)} wide, ${format(state.rise ?? 0)} rise`}>
								{bend && state.insideRadius !== null && <BentBoardDiagram bend={bend} insideRadius={state.insideRadius} thickness={state.thickness} format={format} />}
								{ellipse && state.width !== null && state.rise !== null && <EllipseDiagram ellipse={ellipse} width={state.width} rise={state.rise} thickness={state.thickness} format={format} />}
							</PrintDiagrams>
						</section>
						<RunningList title="Kerf positions along the outside face" positions={positions} />
						<section className={styles.card} aria-labelledby="kf-strip">
							<h2 id="kf-strip" className={styles.cardTitle}>
								Kerf layout strip
							</h2>
							<p className={styles.note}>Kerf centre lines at true size along the outside face. Print at 100%, tape the segments end to end in order and transfer the marks to the board.</p>
							<PrintDiagrams title="Kerf layout strip" subtitle={`${positions.length} kerfs over ${format(stripLength)}, true size`}>
								<div className="flex flex-col gap-3">
									<KerfStripDiagrams positions={positions} length={stripLength} kerfWidth={state.kerfWidth} format={format} />
								</div>
							</PrintDiagrams>
							{stripLength * 25.4 > 3000 && <p className={styles.note}>The strip is only printed for bends up to about 10 ft; use the running list above for longer boards.</p>}
						</section>
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
