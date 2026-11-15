"use client";

import { useMemo, useState } from "react";
import SegmentedControl from "@/components/SegmentedControl";
import { UnitAndPrecisionBar, DimensionInput, NumberField, ResultList, RunningList, PrintDiagrams, LumberTable, ShareCalculation, ConstructionNotes } from "@/components/construction";
import type { ResultRow } from "@/components/construction";
import { useConstructionUnits } from "@/hooks/useConstructionUnits";
import { AREA_UNIT, areaToSquareInches, formatArea, squareInchesToArea } from "@/lib/construction/imperialUtils";
import { regularPolygon, solveCircle, solveArc, type ArcKey } from "@/lib/construction/geometryUtils";
import { formatAngle } from "@/lib/construction/pitchUtils";
import { PolygonDiagram, CircleDiagram, ArcDiagram } from "./CircleDiagrams";
import styles from "./CircleCalculator.module.scss";

type Mode = "polygon" | "circle" | "arc";
type CircleKey = "radius" | "diameter" | "circumference" | "area";

interface CircleState {
	mode: Mode;
	sides: number;
	/** Inches */
	polygonRadius: number | null;
	circleKnown: CircleKey;
	/** Inches for lengths */
	circleLength: number | null;
	/** Square inches */
	circleArea: number | null;
	arcSelected: ArcKey[];
	/** Inches, degrees for angle */
	arcValues: Record<ArcKey, number | null>;
}

const DEFAULTS: CircleState = {
	mode: "polygon",
	sides: 6,
	polygonRadius: 24,
	circleKnown: "diameter",
	circleLength: 48,
	circleArea: 1809.56,
	arcSelected: ["radius", "chord"],
	arcValues: { radius: 24, chord: 30, height: 6, arcLength: 36, angle: 90 },
};

const MODES: { value: Mode; label: string }[] = [
	{ value: "polygon", label: "Polygon" },
	{ value: "circle", label: "Circle" },
	{ value: "arc", label: "Chords and arcs" },
];
const CIRCLE_KEYS: { value: CircleKey; label: string }[] = [
	{ value: "radius", label: "Radius" },
	{ value: "diameter", label: "Diameter" },
	{ value: "circumference", label: "Circumference" },
	{ value: "area", label: "Area" },
];
const ARC_KEYS: ArcKey[] = ["radius", "chord", "height", "arcLength", "angle"];
const ARC_NAMES: Record<ArcKey, string> = { radius: "Radius", chord: "Chord", height: "Arc height", arcLength: "Arc length", angle: "Angle" };
const MAX_SIDES = 60;

const num = (v: unknown, lo: number, hi: number, fallback: number | null): number | null => (typeof v === "number" && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : fallback);
const oneOf = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T => (allowed.includes(v as T) ? (v as T) : fallback);

function sanitize(s: Partial<CircleState>): CircleState {
	const len = (v: unknown, fb: number | null) => num(v, 0.001, 1e6, fb);
	const sel = Array.isArray(s.arcSelected) ? s.arcSelected.filter((k): k is ArcKey => ARC_KEYS.includes(k as ArcKey)).slice(0, 2) : DEFAULTS.arcSelected;
	const vals = { ...DEFAULTS.arcValues };
	for (const k of ARC_KEYS) vals[k] = k === "angle" ? num(s.arcValues?.[k], 0.001, 360, DEFAULTS.arcValues[k]) : len(s.arcValues?.[k], DEFAULTS.arcValues[k]);
	return {
		mode: oneOf(s.mode, ["polygon", "circle", "arc"] as const, DEFAULTS.mode),
		sides: Math.round(num(s.sides, 3, MAX_SIDES, DEFAULTS.sides) ?? DEFAULTS.sides),
		polygonRadius: len(s.polygonRadius, DEFAULTS.polygonRadius),
		circleKnown: oneOf(s.circleKnown, ["radius", "diameter", "circumference", "area"] as const, DEFAULTS.circleKnown),
		circleLength: len(s.circleLength, DEFAULTS.circleLength),
		circleArea: num(s.circleArea, 0.001, 1e12, DEFAULTS.circleArea),
		arcSelected: sel,
		arcValues: vals,
	};
}

export default function CircleCalculator() {
	const { format, mode: unitMode } = useConstructionUnits();
	const [state, setState] = useState<CircleState>(DEFAULTS);
	const set = <K extends keyof CircleState>(key: K) => (value: CircleState[K]) => setState((s) => ({ ...s, [key]: value }));
	const area = (sqIn: number) => formatArea(sqIn, unitMode);

	// ── polygon
	const polygon = useMemo(() => (state.polygonRadius === null ? null : regularPolygon(state.sides, state.polygonRadius)), [state.sides, state.polygonRadius]);
	const polygonRows: ResultRow[] = polygon
		? [
				{ label: "Side length", value: format(polygon.sideLength), strong: true },
				{ label: "Interior angle", value: formatAngle(polygon.interiorAngle, 2), hint: `central angle ${formatAngle(polygon.centralAngle, 2)}` },
				{ label: "Apothem", value: format(polygon.apothem), hint: "centre to the middle of a side" },
				{ label: "Perimeter", value: format(polygon.perimeter) },
				{ label: "Polygon area", value: area(polygon.area), strong: true },
				{ label: "One triangle section", value: area(polygon.triangleArea) },
				{ label: "Bounding rectangle", value: `${format(polygon.boundingWidth)} × ${format(polygon.boundingHeight)}`, hint: "one vertex pointing up" },
				{ label: "Circle circumference", value: format(polygon.circumference) },
				{ label: "Circle area", value: area(polygon.circleArea) },
				{ label: "Slice area", value: area(polygon.sliceArea), hint: "circle sector per side" },
				{ label: "Segment area", value: area(polygon.segmentArea), hint: "between a side and the circle" },
				{ label: "Centers around circumference", value: format(polygon.arcPerSide), hint: "arc from vertex to vertex" },
			]
		: [];

	// ── circle
	const circle = useMemo(() => {
		if (state.circleKnown === "area") return state.circleArea === null ? null : solveCircle({ area: state.circleArea });
		if (state.circleLength === null) return null;
		return solveCircle({ [state.circleKnown]: state.circleLength } as Parameters<typeof solveCircle>[0]);
	}, [state.circleKnown, state.circleLength, state.circleArea]);
	const circleRows: ResultRow[] = circle
		? [
				{ label: "Radius", value: format(circle.radius), strong: state.circleKnown !== "radius" },
				{ label: "Diameter", value: format(circle.diameter), strong: state.circleKnown !== "diameter" },
				{ label: "Circumference", value: format(circle.circumference), strong: state.circleKnown !== "circumference" },
				{ label: "Area", value: area(circle.area), strong: state.circleKnown !== "area" },
			]
		: [];

	// ── arc
	const pickArc = (key: ArcKey) =>
		setState((s) => {
			if (s.arcSelected.includes(key)) return { ...s, arcSelected: s.arcSelected.filter((k) => k !== key) };
			return { ...s, arcSelected: s.arcSelected.length < 2 ? [...s.arcSelected, key] : [s.arcSelected[1], key] };
		});
	const arc = useMemo(() => {
		if (state.arcSelected.length !== 2) return null;
		const known: Partial<Record<ArcKey, number>> = {};
		for (const k of state.arcSelected) {
			const v = state.arcValues[k];
			if (v === null) return null;
			known[k] = v;
		}
		return solveArc(known);
	}, [state.arcSelected, state.arcValues]);
	const arcRows: ResultRow[] = arc
		? [
				{ label: "Radius", value: format(arc.radius), strong: !state.arcSelected.includes("radius"), hint: `diameter ${format(arc.diameter)}` },
				{ label: "Chord", value: format(arc.chord), strong: !state.arcSelected.includes("chord") },
				{ label: "Arc height", value: format(arc.height), strong: !state.arcSelected.includes("height"), hint: "sagitta, chord to arc" },
				{ label: "Arc length", value: format(arc.arcLength), strong: !state.arcSelected.includes("arcLength") },
				{ label: "Angle", value: formatAngle(arc.angle, 2), strong: !state.arcSelected.includes("angle"), hint: "at the centre" },
				{ label: "Centre to chord", value: format(Math.abs(arc.apothem)), hint: arc.apothem < 0 ? "centre is on the arc side of the chord" : "" },
				{ label: "Sector area", value: area(arc.sectorArea), hint: "pie slice" },
				{ label: "Segment area", value: area(arc.segmentArea), hint: "between chord and arc" },
			]
		: [];
	const arcMessage = state.arcSelected.length < 2 ? "Pick two values to enter." : state.arcSelected.some((k) => state.arcValues[k] === null) ? "Enter both values." : "These two values cannot make one arc. A chord must be shorter than its arc and no longer than the diameter.";

	return (
		<div className={styles.container}>
			<div className="flex flex-col gap-6">
				<UnitAndPrecisionBar />
				<div className="flex flex-col gap-1">
					<span className={styles.label}>Shape</span>
					<SegmentedControl<Mode> label="Shape" value={state.mode} onChange={set("mode")} options={MODES} />
				</div>

				{state.mode === "polygon" && (
					<>
						<div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
							<section className={styles.card} aria-labelledby="poly-heading">
								<h2 id="poly-heading" className={styles.cardTitle}>
									Regular polygon
								</h2>
								<p className={styles.note}>Set the number of sides and the radius of the circle the corners sit on. Mark the corners around the circumference from the running list.</p>
								<div className="flex flex-col gap-4">
									<div className={styles.stepper}>
										<button type="button" className={styles.stepBtn} aria-label="Fewer sides" disabled={state.sides <= 3} onClick={() => set("sides")(Math.max(3, state.sides - 1))}>
											−
										</button>
										<NumberField id="poly-sides" label="Sides" value={state.sides} onChange={(v) => set("sides")(Math.max(3, Math.min(MAX_SIDES, Math.round(v))))} min={3} max={MAX_SIDES} step={1} className="flex-1" />
										<button type="button" className={styles.stepBtn} aria-label="More sides" disabled={state.sides >= MAX_SIDES} onClick={() => set("sides")(Math.min(MAX_SIDES, state.sides + 1))}>
											+
										</button>
									</div>
									<DimensionInput id="poly-radius" label="Radius" value={state.polygonRadius} onChange={set("polygonRadius")} min={1} max={240} step={0.5} hint="Centre to a corner (bounding circle)" />
								</div>
							</section>
							<section className={styles.card} aria-labelledby="poly-results">
								<h2 id="poly-results" className={styles.cardTitle}>
									Results
								</h2>
								{polygon ? <ResultList rows={polygonRows} /> : <p className={styles.empty}>Enter a radius.</p>}
							</section>
						</div>
						{polygon && (
							<>
								<section className={styles.card} aria-labelledby="poly-diagram">
									<h2 id="poly-diagram" className={styles.cardTitle}>
										Polygon, one section and segment
									</h2>
									<PrintDiagrams title={`${polygon.sides}-sided polygon`} subtitle={`Radius ${format(polygon.radius)}, side ${format(polygon.sideLength)}, apothem ${format(polygon.apothem)}, drawn to fit`}>
										<PolygonDiagram polygon={polygon} format={format} />
									</PrintDiagrams>
									<p className={styles.legend}>
										<span className={styles.green}>Polygon</span>
										<span className={styles.violet}>One triangle section</span>
										<span className={styles.amber}>Segment to the circle</span>
									</p>
								</section>
								<RunningList title="Corners around the circumference" positions={polygon.vertices.map((_, i) => i * polygon.arcPerSide)} labelFor={(i) => `Corner ${i + 1}`} />
							</>
						)}
					</>
				)}

				{state.mode === "circle" && (
					<>
						<div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
							<section className={styles.card} aria-labelledby="circ-heading">
								<h2 id="circ-heading" className={styles.cardTitle}>
									Circle
								</h2>
								<p className={styles.note}>Enter any one of radius, diameter, circumference or area and the rest is solved.</p>
								<div className="flex flex-col gap-4">
									<div className="flex flex-col gap-1">
										<span className={styles.label}>Known value</span>
										<SegmentedControl<CircleKey> label="Known value" size="sm" value={state.circleKnown} onChange={set("circleKnown")} options={CIRCLE_KEYS} />
									</div>
									{state.circleKnown === "area" ? (
										<NumberField
											id="circ-area"
											label="Area"
											value={state.circleArea === null ? 0 : Number(squareInchesToArea(state.circleArea, unitMode).toFixed(4))}
											onChange={(v) => set("circleArea")(areaToSquareInches(v, unitMode))}
											unit={AREA_UNIT[unitMode]}
											step="any"
										/>
									) : (
										<DimensionInput id="circ-length" label={CIRCLE_KEYS.find((k) => k.value === state.circleKnown)!.label} value={state.circleLength} onChange={set("circleLength")} min={1} max={600} step={0.5} />
									)}
								</div>
							</section>
							<section className={styles.card} aria-labelledby="circ-results">
								<h2 id="circ-results" className={styles.cardTitle}>
									Results
								</h2>
								{circle ? <ResultList rows={circleRows} /> : <p className={styles.empty}>Enter a value greater than zero.</p>}
							</section>
						</div>
						{circle && (
							<section className={styles.card} aria-labelledby="circ-diagram">
								<h2 id="circ-diagram" className={styles.cardTitle}>
									Circle
								</h2>
								<PrintDiagrams title="Circle" subtitle={`Radius ${format(circle.radius)}, diameter ${format(circle.diameter)}, circumference ${format(circle.circumference)}, area ${area(circle.area)}, drawn to fit`}>
									<CircleDiagram circle={circle} format={format} />
								</PrintDiagrams>
							</section>
						)}
					</>
				)}

				{state.mode === "arc" && (
					<>
						<div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
							<section className={styles.card} aria-labelledby="arc-heading">
								<h2 id="arc-heading" className={styles.cardTitle}>
									Chord and arc
								</h2>
								<p className={styles.note}>Pick any two of radius, chord, arc height, arc length and angle, enter them, and the rest is solved along with the sector and segment areas.</p>
								<div className="flex flex-col gap-4">
									<div className={styles.pickRow} role="group" aria-label="Known values">
										{ARC_KEYS.map((k) => (
											<button key={k} type="button" className={styles.pickBtn} aria-pressed={state.arcSelected.includes(k)} onClick={() => pickArc(k)}>
												{ARC_NAMES[k]}
											</button>
										))}
									</div>
									{state.arcSelected.map((k) =>
										k === "angle" ? (
											<NumberField key={k} id={`arc-${k}`} label={ARC_NAMES[k]} value={state.arcValues.angle ?? 0} onChange={(v) => set("arcValues")({ ...state.arcValues, angle: v })} unit="°" min={0} max={360} step="any" />
										) : (
											<DimensionInput key={k} id={`arc-${k}`} label={ARC_NAMES[k]} value={state.arcValues[k]} onChange={(v) => set("arcValues")({ ...state.arcValues, [k]: v })} />
										),
									)}
								</div>
							</section>
							<section className={styles.card} aria-labelledby="arc-results">
								<h2 id="arc-results" className={styles.cardTitle}>
									Results
								</h2>
								{arc ? <ResultList rows={arcRows} /> : <p className={styles.empty}>{arcMessage}</p>}
							</section>
						</div>
						{arc && (
							<section className={styles.card} aria-labelledby="arc-diagram">
								<h2 id="arc-diagram" className={styles.cardTitle}>
									Chord, arc, sector and segment
								</h2>
								<PrintDiagrams title="Chord and arc" subtitle={`Radius ${format(arc.radius)}, chord ${format(arc.chord)}, height ${format(arc.height)}, arc ${format(arc.arcLength)}, ${formatAngle(arc.angle, 2)}, drawn to fit`}>
									<ArcDiagram arc={arc} format={format} />
								</PrintDiagrams>
								<p className={styles.legend}>
									<span className={styles.violet}>Sector</span>
									<span className={styles.amber}>Segment</span>
								</p>
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
