"use client";

import { useMemo, useState } from "react";
import SegmentedControl from "@/components/SegmentedControl";
import { UnitAndPrecisionBar, DimensionInput, NumberField, ResultList, PrintDiagrams, LumberTable, ShareCalculation, ConstructionNotes } from "@/components/construction";
import type { ResultRow, MemberRole } from "@/components/construction";
import { useConstructionUnits } from "@/hooks/useConstructionUnits";
import { miterJoint, compoundMiter } from "@/lib/construction/miterUtils";
import { formatAngle } from "@/lib/construction/pitchUtils";
import { MiterDiagram, SawGauge, CompoundTemplate, FormPreview } from "./MiterDiagrams";
import styles from "./MiterCalculator.module.scss";

type Mode = "miter" | "compound";
type Color = Extract<MemberRole, "common" | "ridge" | "hip" | "jack">;

interface MiterState {
	mode: Mode;
	/** Inches */
	width1: number | null;
	width2: number | null;
	cornerAngle: number;
	color: Color;
	showDimensions: boolean;
	thickness: number | null;
	sides: number;
	slope: number;
	baseWidth: number | null;
	height: number | null;
	yaw: number;
}

const DEFAULTS: MiterState = {
	mode: "miter",
	width1: 3.5,
	width2: 3.5,
	cornerAngle: 90,
	color: "common",
	showDimensions: true,
	thickness: 0.75,
	sides: 4,
	slope: 45,
	baseWidth: 12,
	height: 4,
	yaw: 30,
};

const MODES: { value: Mode; label: string }[] = [
	{ value: "miter", label: "Miter angle" },
	{ value: "compound", label: "Compound miter" },
];
const COLORS: { value: Color; label: string }[] = [
	{ value: "common", label: "Green" },
	{ value: "ridge", label: "Violet" },
	{ value: "hip", label: "Amber" },
	{ value: "jack", label: "Blue" },
];

const num = (v: unknown, lo: number, hi: number, fallback: number | null): number | null => (typeof v === "number" && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : fallback);
const oneOf = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T => (allowed.includes(v as T) ? (v as T) : fallback);

function sanitize(s: Partial<MiterState>): MiterState {
	const len = (v: unknown, fb: number | null) => num(v, 0.01, 1000, fb);
	return {
		mode: oneOf(s.mode, ["miter", "compound"] as const, DEFAULTS.mode),
		width1: len(s.width1, DEFAULTS.width1),
		width2: len(s.width2, DEFAULTS.width2),
		cornerAngle: num(s.cornerAngle, 1, 179, DEFAULTS.cornerAngle) ?? DEFAULTS.cornerAngle,
		color: oneOf(s.color, ["common", "ridge", "hip", "jack"] as const, DEFAULTS.color),
		showDimensions: typeof s.showDimensions === "boolean" ? s.showDimensions : DEFAULTS.showDimensions,
		thickness: num(s.thickness, 0, 100, DEFAULTS.thickness),
		sides: Math.round(num(s.sides, 3, 24, DEFAULTS.sides) ?? DEFAULTS.sides),
		slope: num(s.slope, 1, 90, DEFAULTS.slope) ?? DEFAULTS.slope,
		baseWidth: len(s.baseWidth, DEFAULTS.baseWidth),
		height: len(s.height, DEFAULTS.height),
		yaw: num(s.yaw, 0, 360, DEFAULTS.yaw) ?? DEFAULTS.yaw,
	};
}

export default function MiterCalculator() {
	const { format } = useConstructionUnits();
	const [state, setState] = useState<MiterState>(DEFAULTS);
	const set = <K extends keyof MiterState>(key: K) => (value: MiterState[K]) => setState((s) => ({ ...s, [key]: value }));

	const joint = useMemo(() => (state.width1 === null || state.width2 === null ? null : miterJoint(state.width1, state.width2, state.cornerAngle)), [state.width1, state.width2, state.cornerAngle]);
	const jointRows: ResultRow[] = joint
		? [
				{ label: "Piece 1 miter", value: formatAngle(joint.angle1, 2), strong: true, hint: `saw setting ${formatAngle(joint.saw1, 2)} from square` },
				{ label: "Piece 2 miter", value: formatAngle(joint.angle2, 2), strong: true, hint: `saw setting ${formatAngle(joint.saw2, 2)} from square` },
				{ label: "Joint length", value: format(joint.jointLength), hint: "outer corner to inner corner" },
				{ label: "Corner angle", value: formatAngle(state.cornerAngle, 2) },
			]
		: [];

	const compound = useMemo(
		() => (state.thickness === null || state.baseWidth === null || state.height === null ? null : compoundMiter({ sides: state.sides, slope: state.slope, thickness: state.thickness, baseWidth: state.baseWidth, height: state.height })),
		[state.sides, state.slope, state.thickness, state.baseWidth, state.height],
	);
	const compoundRows: ResultRow[] = compound
		? [
				{ label: "Saw miter", value: formatAngle(compound.miter, 2), strong: true, hint: "piece flat on the table, outside face down" },
				{ label: "Saw bevel", value: formatAngle(compound.bevel, 2), strong: true },
				{ label: "Flat miter", value: formatAngle(compound.flatMiter, 2), hint: `half of the ${formatAngle(compound.cornerAngle, 1)} corner in plan` },
				{ label: "Base edge length", value: format(compound.baseLength), hint: "outside, long point to long point" },
				{ label: "Top edge length", value: format(compound.topLength), hint: "outside" },
				{ label: "Face width", value: format(compound.slantHeight), hint: "base edge to top edge along the slope" },
				{ label: "Top across flats", value: format(compound.topWidth) },
				{ label: "Bevel inset", value: format(compound.bevelInset), hint: "how far the inside face is set back at each cut" },
				...(Number.isFinite(compound.apexHeight) ? [{ label: "Sides meet at", value: format(compound.apexHeight), hint: "height of a closed pyramid" }] : []),
			]
		: [];

	return (
		<div className={styles.container}>
			<div className="flex flex-col gap-6">
				<UnitAndPrecisionBar />
				<div className="flex flex-col gap-1">
					<span className={styles.label}>Joint</span>
					<SegmentedControl<Mode> label="Joint" value={state.mode} onChange={set("mode")} options={MODES} />
				</div>

				{state.mode === "miter" && (
					<>
						<div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
							<section className={styles.card} aria-labelledby="miter-heading">
								<h2 id="miter-heading" className={styles.cardTitle}>
									Miter between two widths
								</h2>
								<p className={styles.note}>When the two pieces are different widths the joint is not a 45° split. Enter both widths and the corner angle to get each piece&apos;s cut.</p>
								<div className="flex flex-col gap-4">
									<div className="grid grid-cols-2 gap-3">
										<DimensionInput id="miter-w1" label="Width 1" value={state.width1} onChange={set("width1")} />
										<DimensionInput id="miter-w2" label="Width 2" value={state.width2} onChange={set("width2")} />
									</div>
									<NumberField id="miter-corner" label="Corner angle" value={state.cornerAngle} onChange={set("cornerAngle")} unit="°" min={1} max={179} step="any" hint="Inside angle where the pieces meet; 90° for a square corner" />
									<div className="flex flex-wrap items-end gap-x-6 gap-y-3">
										<div className="flex flex-col gap-1">
											<span className={styles.label}>Color</span>
											<SegmentedControl<Color> label="Color" size="sm" fill={false} value={state.color} onChange={set("color")} options={COLORS} />
										</div>
										<label className={styles.check}>
											<input type="checkbox" checked={state.showDimensions} onChange={(e) => set("showDimensions")(e.target.checked)} />
											Show dimensions
										</label>
									</div>
								</div>
							</section>
							<section className={styles.card} aria-labelledby="miter-results">
								<h2 id="miter-results" className={styles.cardTitle}>
									Cuts
								</h2>
								{joint ? <ResultList rows={jointRows} /> : <p className={styles.empty}>Enter both widths and a corner angle under 180°.</p>}
								{joint && (
									<div className={`${styles.gauges} mt-4`}>
										<SawGauge label="Piece 1 saw" value={joint.saw1} />
										<SawGauge label="Piece 2 saw" value={joint.saw2} left />
									</div>
								)}
							</section>
						</div>
						{joint && state.width1 !== null && state.width2 !== null && (
							<section className={styles.card} aria-labelledby="miter-diagram">
								<h2 id="miter-diagram" className={styles.cardTitle}>
									Cutting template
								</h2>
								<p className={styles.note}>Printed at 100% this is true size: lay a piece on it to mark the cut.</p>
								<PrintDiagrams title="Miter template" subtitle={`${format(state.width1)} and ${format(state.width2)} at ${formatAngle(state.cornerAngle, 1)}: piece 1 ${formatAngle(joint.angle1, 2)}, piece 2 ${formatAngle(joint.angle2, 2)}`}>
									<MiterDiagram width1={state.width1} width2={state.width2} cornerAngle={state.cornerAngle} joint={joint} role={state.color} showDimensions={state.showDimensions} format={format} />
								</PrintDiagrams>
							</section>
						)}
					</>
				)}

				{state.mode === "compound" && (
					<>
						<div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
							<section className={styles.card} aria-labelledby="compound-heading">
								<h2 id="compound-heading" className={styles.cardTitle}>
									Compound miter for sloped sides
								</h2>
								<p className={styles.note}>A planter, hopper or tapered box: sides lean in at the slope angle and meet at compound-mitered corners. Settings assume the piece lies flat on the saw table with its outside face down.</p>
								<div className="flex flex-col gap-4">
									<div className="grid grid-cols-2 gap-3">
										<NumberField id="compound-sides" label="Sides" value={state.sides} onChange={(v) => set("sides")(Math.max(3, Math.min(24, Math.round(v))))} min={3} max={24} step={1} />
										<NumberField id="compound-slope" label="Side angle" value={state.slope} onChange={set("slope")} unit="°" min={1} max={90} step="any" hint="From horizontal; 90° is vertical" />
									</div>
									<div className="grid grid-cols-2 gap-3">
										<DimensionInput id="compound-base" label="Base width" value={state.baseWidth} onChange={set("baseWidth")} hint="Outside, across flats" />
										<DimensionInput id="compound-height" label="Height" value={state.height} onChange={set("height")} hint="Vertical" />
									</div>
									<DimensionInput id="compound-thickness" label="Piece thickness" value={state.thickness} onChange={set("thickness")} />
								</div>
							</section>
							<section className={styles.card} aria-labelledby="compound-results">
								<h2 id="compound-results" className={styles.cardTitle}>
									Saw settings and piece
								</h2>
								{compound ? <ResultList rows={compoundRows} /> : <p className={styles.empty}>The sides would meet before reaching this height. Lower the height, widen the base or steepen the slope.</p>}
								{compound && (
									<div className={`${styles.gauges} mt-4`}>
										<SawGauge label="Miter" value={compound.miter} />
										<SawGauge label="Bevel" value={compound.bevel} max={45} />
									</div>
								)}
							</section>
						</div>
						{compound && state.thickness !== null && state.height !== null && (
							<div className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
								<section className={styles.card} aria-labelledby="compound-template">
									<h2 id="compound-template" className={styles.cardTitle}>
										Fold-over template, one side
									</h2>
									<p className={styles.note}>Print at 100%, cut out the face, fold the flap down over the base edge. The dashed outline is the inside face after the bevel.</p>
									<PrintDiagrams title="Compound miter template" subtitle={`${compound.sides} sides at ${formatAngle(state.slope, 1)}: miter ${formatAngle(compound.miter, 2)}, bevel ${formatAngle(compound.bevel, 2)}, base ${format(compound.baseLength)}, top ${format(compound.topLength)}`}>
										<CompoundTemplate miter={compound} thickness={state.thickness} format={format} />
									</PrintDiagrams>
								</section>
								<section className={styles.card} aria-labelledby="compound-preview">
									<h2 id="compound-preview" className={styles.cardTitle}>
										Preview
									</h2>
									<FormPreview miter={compound} yaw={state.yaw} height={state.height} />
									<label className="flex flex-col gap-1 mt-2">
										<span className={styles.label}>Turn</span>
										<input type="range" className={styles.slider} style={{ "--fill": `${(state.yaw / 360) * 100}%` } as React.CSSProperties} min={0} max={360} step={1} value={state.yaw} onChange={(e) => set("yaw")(Number(e.target.value))} />
									</label>
								</section>
							</div>
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
