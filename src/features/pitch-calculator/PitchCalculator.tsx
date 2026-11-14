"use client";

import { useMemo, useState } from "react";
import SegmentedControl from "@/components/SegmentedControl";
import { UnitAndPrecisionBar, DimensionInput, NumberField, ResultList, PrintDiagrams, LumberTable, ShareCalculation, ConstructionNotes } from "@/components/construction";
import type { ResultRow } from "@/components/construction";
import { useConstructionUnits } from "@/hooks/useConstructionUnits";
import { inchesToMm } from "@/lib/construction/imperialUtils";
import {
	ANGLE_PRECISIONS,
	formatAngle,
	formatGrade,
	formatPitch,
	pitchTable,
	rafterMultiplier,
	solveSlope,
	type AnglePrecision,
	type Slope,
} from "@/lib/construction/pitchUtils";
import PitchDiagram, { drawingScale, PERSON_MIN_RUN_IN, type Orientation } from "./PitchDiagram";
import styles from "./PitchCalculator.module.scss";

type Known = "pitch" | "angle" | "rise" | "grade";

const KNOWNS: { value: Known; label: string }[] = [
	{ value: "pitch", label: "Pitch" },
	{ value: "angle", label: "Angle" },
	{ value: "rise", label: "Rise" },
	{ value: "grade", label: "Grade" },
];

interface PitchState {
	/** Inches */
	run: number | null;
	known: Known;
	pitch: number;
	angle: number;
	/** Inches */
	rise: number | null;
	grade: number;
	anglePrecision: AnglePrecision;
	showPerson: boolean;
	orientation: Orientation;
}

const DEFAULTS: PitchState = {
	run: 144,
	known: "pitch",
	pitch: 6,
	angle: 26.57,
	rise: 72,
	grade: 50,
	anglePrecision: 2,
	showPerson: false,
	orientation: "right",
};

const TABLE = pitchTable(1, 24);

export default function PitchCalculator() {
	const { format } = useConstructionUnits();
	const [state, setState] = useState<PitchState>(DEFAULTS);
	const set = <K extends keyof PitchState>(key: K) => (value: PitchState[K]) => setState((s) => ({ ...s, [key]: value }));

	const slope: Slope | null = useMemo(() => {
		if (state.run === null) return null;
		switch (state.known) {
			case "pitch":
				return solveSlope(state.run, { pitch: state.pitch });
			case "angle":
				return solveSlope(state.run, { angle: state.angle });
			case "grade":
				return solveSlope(state.run, { grade: state.grade });
			default:
				return state.rise === null ? null : solveSlope(state.run, { rise: state.rise });
		}
	}, [state.run, state.known, state.pitch, state.angle, state.rise, state.grade]);

	const rows: ResultRow[] = slope
		? [
				{ label: "Pitch", value: formatPitch(slope.pitch), strong: state.known !== "pitch", hint: "rise per 12 of run" },
				{ label: "Angle", value: formatAngle(slope.angle, state.anglePrecision), strong: state.known !== "angle" },
				{ label: "Rise", value: format(slope.rise), strong: state.known !== "rise" },
				{ label: "Grade", value: formatGrade(slope.grade), strong: state.known !== "grade", hint: "rise over run" },
				{ label: "Slope length", value: format(slope.length), hint: "along the incline" },
				{ label: "Rafter multiplier", value: rafterMultiplier(slope.pitch).toFixed(4), hint: "slope length per unit of run" },
				{ label: "Rise per foot", value: format(slope.rise / (slope.run / 12), { mode: "in" }) },
			]
		: [];

	const scaleNote = slope ? `drawn at 1:${(1 / drawingScale(slope)).toFixed(1)}` : "";
	const personAllowed = (state.run ?? 0) >= PERSON_MIN_RUN_IN;

	return (
		<div className={styles.container}>
			<div className="flex flex-col gap-6">
				<UnitAndPrecisionBar />

				<div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
					<section className={styles.card} aria-labelledby="pitch-inputs-heading">
						<h2 id="pitch-inputs-heading" className={styles.cardTitle}>
							Known run and one more value
						</h2>
						<p className={styles.note}>Enter the run, pick which of pitch, angle, rise or grade you know, and the rest is calculated.</p>
						<div className="flex flex-col gap-4">
							<DimensionInput id="pitch-run" label="Run" value={state.run} onChange={set("run")} min={12} max={480} step={1} hint="Horizontal distance" />
							<div className="flex flex-col gap-1">
								<span className={styles.label}>Known value</span>
								<SegmentedControl<Known> label="Known value" size="sm" value={state.known} onChange={set("known")} options={KNOWNS} />
							</div>
							{state.known === "pitch" && <NumberField id="pitch-pitch" label="Pitch" value={state.pitch} onChange={set("pitch")} unit=":12" step="any" hint="Rise per 12 units of run" />}
							{state.known === "angle" && <NumberField id="pitch-angle" label="Angle" value={state.angle} onChange={set("angle")} unit="°" min={0} max={89.999} step="any" />}
							{state.known === "rise" && <DimensionInput id="pitch-rise" label="Rise" value={state.rise} onChange={set("rise")} hint="Vertical distance over the run" />}
							{state.known === "grade" && <NumberField id="pitch-grade" label="Grade" value={state.grade} onChange={set("grade")} unit="%" step="any" hint="Rise over run as a percentage" />}

							<div className="flex flex-wrap items-end gap-x-6 gap-y-3">
								<div className="flex flex-col gap-1">
									<span className={styles.label}>Angle precision</span>
									<SegmentedControl<`${AnglePrecision}`>
										label="Angle precision"
										size="sm"
										fill={false}
										value={`${state.anglePrecision}`}
										onChange={(v) => set("anglePrecision")(Number(v) as AnglePrecision)}
										options={ANGLE_PRECISIONS.map((p) => ({ value: `${p.value}` as `${AnglePrecision}`, label: p.label }))}
									/>
								</div>
								<div className="flex flex-col gap-1">
									<span className={styles.label}>Rise on the</span>
									<SegmentedControl<Orientation>
										label="Orientation"
										size="sm"
										fill={false}
										value={state.orientation}
										onChange={set("orientation")}
										options={[
											{ value: "left", label: "◂ Left" },
											{ value: "right", label: "Right ▸" },
										]}
									/>
								</div>
							</div>
							<label className={`${styles.check} ${personAllowed ? "" : styles.checkDisabled}`}>
								<input type="checkbox" checked={state.showPerson} disabled={!personAllowed} onChange={(e) => set("showPerson")(e.target.checked)} />
								Show an average height person for scale
								<span className={styles.hint}>(runs over 6&apos;)</span>
							</label>
						</div>
					</section>

					<section className={styles.card} aria-labelledby="pitch-results-heading">
						<h2 id="pitch-results-heading" className={styles.cardTitle}>
							Results
						</h2>
						{slope ? <ResultList rows={rows} /> : <p className={styles.empty}>Enter a run greater than zero and a known value under 90°.</p>}
					</section>
				</div>

				{slope && (
					<section className={styles.card} aria-labelledby="pitch-diagram-heading">
						<h2 id="pitch-diagram-heading" className={styles.cardTitle}>
							Pitch, run and angle scale
						</h2>
						<PrintDiagrams title="Rise, run, pitch and angle" subtitle={`Run ${format(slope.run)}, rise ${format(slope.rise)}, ${formatPitch(slope.pitch)}, ${formatAngle(slope.angle, state.anglePrecision)}, ${scaleNote}`}>
							<PitchDiagram slope={slope} orientation={state.orientation} anglePrecision={state.anglePrecision} showPerson={state.showPerson} format={format} />
						</PrintDiagrams>
						<p className={styles.note}>
							The triangle is {scaleNote}, so it is not a cutting template. Run {inchesToMm(slope.run).toFixed(0)} mm real becomes {(inchesToMm(slope.run) * drawingScale(slope)).toFixed(0)} mm on paper.
						</p>
					</section>
				)}

				<section className={styles.card} aria-labelledby="pitch-table-heading">
					<h2 id="pitch-table-heading" className={styles.cardTitle}>
						Pitch to angle, grade and rafter multiplier
					</h2>
					<p className={styles.note}>Click a row to use that pitch. Rafter multiplier is the slope length per unit of run: multiply the run by it for the rafter line length.</p>
					<div className={styles.tableWrap}>
						<table className={styles.table}>
							<thead>
								<tr>
									<th scope="col">Pitch</th>
									<th scope="col">Angle</th>
									<th scope="col">Grade</th>
									<th scope="col">Multiplier</th>
								</tr>
							</thead>
							<tbody>
								{TABLE.map((r) => {
									const active = slope !== null && Math.abs(slope.pitch - r.pitch) < 1e-9;
									return (
										<tr key={r.pitch} className={active ? styles.activeRow : ""}>
											<td>
												<button type="button" className={styles.rowBtn} onClick={() => setState((s) => ({ ...s, known: "pitch", pitch: r.pitch }))} aria-pressed={active}>
													{formatPitch(r.pitch)}
												</button>
											</td>
											<td className={styles.mono}>{formatAngle(r.angle, state.anglePrecision)}</td>
											<td className={styles.mono}>{formatGrade(r.grade)}</td>
											<td className={styles.mono}>{r.multiplier.toFixed(4)}</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>
				</section>

				<div className="grid gap-4 lg:grid-cols-2">
					<LumberTable />
					<div className="flex flex-col gap-4">
						<ShareCalculation state={state} onLoad={(s) => setState({ ...DEFAULTS, ...s })} />
						<ConstructionNotes />
					</div>
				</div>
			</div>
		</div>
	);
}
