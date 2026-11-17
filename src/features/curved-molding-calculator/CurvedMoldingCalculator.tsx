"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import SegmentedControl from "@/components/SegmentedControl";
import { UnitAndPrecisionBar, DimensionInput, NumberField, ResultList, RunningList, PrintDiagrams, ShareCalculation, ConstructionNotes } from "@/components/construction";
import type { ResultRow } from "@/components/construction";
import { useConstructionUnits } from "@/hooks/useConstructionUnits";
import { curvedMolding } from "@/lib/construction/curvedMoldingUtils";
import { formatAngle } from "@/lib/construction/pitchUtils";
import { MoldingPlanDiagram, SegmentTemplate } from "./MoldingDiagrams";
import styles from "./CurvedMoldingCalculator.module.scss";

interface MoldingState {
	by: "radius" | "chord-rise";
	radius: number | null;
	chord: number | null;
	rise: number | null;
	angle: number;
	width: number | null;
	thickness: number | null;
	segments: number;
	kerf: boolean;
	kerfWidth: number | null;
	kerfRemaining: number | null;
	crown: boolean;
	springAngle: number;
}

const DEFAULTS: MoldingState = {
	by: "radius",
	radius: 36,
	chord: 48,
	rise: 6,
	angle: 90,
	width: 3,
	thickness: 0.75,
	segments: 4,
	kerf: false,
	kerfWidth: 0.125,
	kerfRemaining: 0.125,
	crown: false,
	springAngle: 38,
};

const num = (v: unknown, lo: number, hi: number, fallback: number | null): number | null => (typeof v === "number" && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : fallback);
const oneOf = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T => (allowed.includes(v as T) ? (v as T) : fallback);
const int = (v: unknown, lo: number, hi: number, fb: number) => Math.round(num(v, lo, hi, fb) ?? fb);

function sanitize(s: Partial<MoldingState>): MoldingState {
	return {
		by: oneOf(s.by, ["radius", "chord-rise"] as const, DEFAULTS.by),
		radius: num(s.radius, 0.5, 1e4, DEFAULTS.radius),
		chord: num(s.chord, 1, 1e4, DEFAULTS.chord),
		rise: num(s.rise, 0.01, 1e4, DEFAULTS.rise),
		angle: num(s.angle, 1, 360, DEFAULTS.angle) ?? DEFAULTS.angle,
		width: num(s.width, 0.25, 48, DEFAULTS.width),
		thickness: num(s.thickness, 0.05, 12, DEFAULTS.thickness),
		segments: int(s.segments, 0, 200, DEFAULTS.segments),
		kerf: typeof s.kerf === "boolean" ? s.kerf : DEFAULTS.kerf,
		kerfWidth: num(s.kerfWidth, 0.01, 1, DEFAULTS.kerfWidth),
		kerfRemaining: num(s.kerfRemaining, 0.01, 12, DEFAULTS.kerfRemaining),
		crown: typeof s.crown === "boolean" ? s.crown : DEFAULTS.crown,
		springAngle: num(s.springAngle, 1, 89, DEFAULTS.springAngle) ?? DEFAULTS.springAngle,
	};
}

export default function CurvedMoldingCalculator() {
	const { format } = useConstructionUnits();
	const [state, setState] = useState<MoldingState>(DEFAULTS);
	const set = <K extends keyof MoldingState>(key: K) => (value: MoldingState[K]) => setState((s) => ({ ...s, [key]: value }));

	const m = useMemo(() => {
		const s = state;
		if (s.radius === null || s.chord === null || s.rise === null || s.width === null || s.thickness === null || s.kerfWidth === null || s.kerfRemaining === null) return null;
		return curvedMolding({ by: s.by, radius: s.radius, chord: s.chord, rise: s.rise, angle: s.angle, width: s.width, thickness: s.thickness, segments: s.segments, kerfWidth: s.kerf ? s.kerfWidth : 0, kerfRemaining: s.kerfRemaining, springAngle: s.crown ? s.springAngle : 0 });
	}, [state]);

	const rows: ResultRow[] = m
		? [
				{ label: "Inside radius", value: format(m.insideRadius), hint: `outside ${format(m.outsideRadius)}, centre line ${format(m.centreRadius)}` , strong: true },
				{ label: "Sweep", value: formatAngle(m.angle, 2), hint: `chord ${format(m.chord)}, rise ${format(m.rise)}` },
				{ label: "Developed length", value: format(m.centreLength), strong: true, hint: `${format(m.insideLength)} inside, ${format(m.outsideLength)} outside` },
				...(m.segments.length
					? [
							{ label: "Segments", value: `${m.segments.length} × ${format(m.segments[0].outsideLength)}`, strong: true, hint: `long point to long point outside; ${format(m.segments[0].insideLength)} inside; each turns ${formatAngle(m.segments[0].angle, 2)}` },
							{ label: "End miters", value: formatAngle(m.segments[0].miter, 2), hint: "from square, both ends of every segment" },
							{ label: "Blank for a curved face", value: `${format(m.blankLength)} × ${format(m.blankWidth)}`, hint: `saw the face to R ${format(m.outsideRadius)} outside and R ${format(m.insideRadius)} inside` },
						]
					: []),
				...(m.kerf ? [{ label: "Kerfs", value: `${m.kerf.kerfs} at ${format(m.kerf.spacing)}`, hint: `${format(m.kerf.kerfDepth)} deep on the back; ${format(m.kerf.bendLength)} of bend` }] : []),
				...(m.crown ? [{ label: "Crown compound cut", value: `miter ${formatAngle(m.crown.miter, 2)}, bevel ${formatAngle(m.crown.bevel, 2)}`, hint: `crown flat on the table, ${formatAngle(m.crown.slopeFromHorizontal, 0)} from the ceiling` }] : []),
			]
		: [];

	return (
		<div className={styles.container}>
			<div className="flex flex-col gap-6">
				<UnitAndPrecisionBar />

				<div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
					<section className={styles.card} aria-labelledby="cm-heading">
						<h2 id="cm-heading" className={styles.cardTitle}>
							Curved molding
						</h2>
						<p className={styles.note}>
							Trim following a curved wall or opening, built from straight segments with mitered ends, sawn from flat stock, or kerf bent. Kerf details are in the <Link href="/tools/kerf-calculator">kerf bending calculator</Link>.
						</p>
						<div className="flex flex-col gap-4">
							<div className="flex flex-col gap-1">
								<span className={styles.label}>Curve by</span>
								<SegmentedControl<"radius" | "chord-rise">
									label="Curve by"
									size="sm"
									fill={false}
									value={state.by}
									onChange={(v) => setState((s) => ({ ...s, by: v, ...(m && v === "chord-rise" ? { chord: Number(m.chord.toFixed(4)), rise: Number(m.rise.toFixed(4)) } : {}), ...(m && v === "radius" ? { radius: Number(m.insideRadius.toFixed(4)), angle: Number(m.angle.toFixed(2)) } : {}) }))}
									options={[
										{ value: "radius", label: "Radius and sweep" },
										{ value: "chord-rise", label: "Chord and rise" },
									]}
								/>
							</div>
							{state.by === "radius" ? (
								<div className="grid grid-cols-2 gap-3">
									<DimensionInput id="cm-radius" label="Inside radius" value={state.radius} onChange={set("radius")} hint="Wall or opening, at the molding's inside face" />
									<NumberField id="cm-angle" label="Sweep" value={state.angle} onChange={set("angle")} unit="°" min={1} max={360} step="any" />
								</div>
							) : (
								<div className="grid grid-cols-2 gap-3">
									<DimensionInput id="cm-chord" label="Chord" value={state.chord} onChange={set("chord")} />
									<DimensionInput id="cm-rise" label="Rise" value={state.rise} onChange={set("rise")} />
								</div>
							)}
							<div className="grid grid-cols-3 gap-3">
								<DimensionInput id="cm-width" label="Molding width" value={state.width} onChange={set("width")} hint="Across the curve" />
								<DimensionInput id="cm-thick" label="Thickness" value={state.thickness} onChange={set("thickness")} />
								<NumberField id="cm-segments" label="Segments" value={state.segments} onChange={(v) => set("segments")(int(v, 0, 200, 0))} min={0} max={200} step={1} hint="0 for one piece" />
							</div>
							<div className="flex flex-wrap items-end gap-x-6 gap-y-3">
								<label className={styles.check}>
									<input type="checkbox" checked={state.kerf} onChange={(e) => set("kerf")(e.target.checked)} />
									Kerf bent
								</label>
								{state.kerf && (
									<>
										<DimensionInput id="cm-kerf" label="Kerf width" value={state.kerfWidth} onChange={set("kerfWidth")} className="w-32" />
										<DimensionInput id="cm-remaining" label="Wood left" value={state.kerfRemaining} onChange={set("kerfRemaining")} className="w-32" />
									</>
								)}
							</div>
							<div className="flex flex-wrap items-end gap-x-6 gap-y-3">
								<label className={styles.check}>
									<input type="checkbox" checked={state.crown} onChange={(e) => set("crown")(e.target.checked)} />
									Crown molding
								</label>
								{state.crown && <NumberField id="cm-spring" label="Spring angle" value={state.springAngle} onChange={set("springAngle")} unit="°" min={1} max={89} step="any" hint="From the wall; 38 or 45 are common" className="w-36" />}
							</div>
						</div>
					</section>

					<section className={styles.card} aria-labelledby="cm-results">
						<h2 id="cm-results" className={styles.cardTitle}>
							Lengths and cuts
						</h2>
						{m ? <ResultList rows={rows} /> : <p className={styles.empty}>Enter the curve, the molding size and how it is built.</p>}
						{m?.warnings.map((w) => (
							<p key={w} className={styles.warn}>
								{w}
							</p>
						))}
						{m && state.crown && !m.segments.length && <p className={styles.note}>Compound settings apply between straight segments; set a segment count to see them.</p>}
					</section>
				</div>

				{m && (
					<>
						<section className={styles.card} aria-labelledby="cm-plan">
							<h2 id="cm-plan" className={styles.cardTitle}>
								Plan
							</h2>
							<PrintDiagrams title="Curved molding plan" subtitle={`R ${format(m.insideRadius)} inside, ${formatAngle(m.angle, 1)} sweep${m.segments.length ? `, ${m.segments.length} segments` : ""}, drawn to fit`}>
								<MoldingPlanDiagram molding={m} format={format} />
							</PrintDiagrams>
						</section>
						{m.segments.length > 0 && (
							<section className={styles.card} aria-labelledby="cm-segment">
								<h2 id="cm-segment" className={styles.cardTitle}>
									Segment template
								</h2>
								<p className={styles.note}>One segment inside its flat blank: miter both ends at {formatAngle(m.segments[0].miter, 2)}, then saw the curved faces to the two radii. True size when it fits the sheet.</p>
								<PrintDiagrams title="Molding segment" subtitle={`${format(m.blankLength)} × ${format(m.blankWidth)} blank, ${formatAngle(m.segments[0].miter, 2)} miters`}>
									<SegmentTemplate molding={m} format={format} />
								</PrintDiagrams>
							</section>
						)}
						{m.kerf && <RunningList title="Kerf positions along the back" positions={m.kerf.positions} />}
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
