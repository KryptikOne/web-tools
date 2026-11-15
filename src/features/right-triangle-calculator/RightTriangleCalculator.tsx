"use client";

import { useMemo, useState } from "react";
import SegmentedControl from "@/components/SegmentedControl";
import { UnitAndPrecisionBar, DimensionInput, NumberField, ResultList, PrintDiagrams, LumberTable, ShareCalculation, ConstructionNotes } from "@/components/construction";
import type { ResultRow } from "@/components/construction";
import { useConstructionUnits } from "@/hooks/useConstructionUnits";
import { ANGLE_PRECISIONS, formatAngle, formatPitch, solveRightTriangle, type AnglePrecision, type RightTriangle, type RightTriangleKnown } from "@/lib/construction/pitchUtils";
import TriangleDiagram, { TRI_KEYS, TRI_NAMES, type TriKey } from "./TriangleDiagram";
import styles from "./RightTriangleCalculator.module.scss";

interface TriState {
	/** Sides in inches, angles in degrees; null when the field is empty */
	values: Record<TriKey, number | null>;
	/** The two quantities being entered, oldest first */
	selected: TriKey[];
	anglePrecision: AnglePrecision;
}

const DEFAULTS: TriState = {
	values: { a: 72, b: 144, c: null, A: null, B: null },
	selected: ["b", "a"],
	anglePrecision: 2,
};

const isSide = (k: TriKey) => k === "a" || k === "b" || k === "c";
/** Proportion drawn while nothing solves, so the labels stay in place to be picked. */
const PLACEHOLDER = { a: 3, b: 4 };

export default function RightTriangleCalculator() {
	const { format, mode } = useConstructionUnits();
	const [state, setState] = useState<TriState>(DEFAULTS);

	const pick = (key: TriKey) =>
		setState((s) => {
			if (s.selected.includes(key)) return { ...s, selected: s.selected.filter((k) => k !== key) };
			const selected = s.selected.length < 2 ? [...s.selected, key] : [s.selected[1], key];
			return { ...s, selected };
		});
	const setValue = (key: TriKey) => (v: number | null) => setState((s) => ({ ...s, values: { ...s.values, [key]: v } }));

	const tri: RightTriangle | null = useMemo(() => {
		if (state.selected.length !== 2) return null;
		const known: RightTriangleKnown = {};
		for (const k of state.selected) {
			const v = state.values[k];
			if (v === null) return null;
			known[k] = v;
		}
		return solveRightTriangle(known);
	}, [state.selected, state.values]);

	const fmt = (k: TriKey, v: number) => (isSide(k) ? format(v) : formatAngle(v, state.anglePrecision));
	const text = Object.fromEntries(
		TRI_KEYS.map((k) => {
			const v = state.selected.includes(k) ? state.values[k] : tri ? tri[k] : null;
			return [k, `${k} = ${v === null ? "?" : fmt(k, v)}`];
		}),
	) as Record<TriKey, string>;

	const unknowns = TRI_KEYS.filter((k) => !state.selected.includes(k));
	const rows: ResultRow[] = tri
		? [
				...unknowns.map((k) => ({ label: TRI_NAMES[k], value: fmt(k, tri[k]), strong: true })),
				{ label: "Pitch", value: formatPitch((tri.a / tri.b) * 12), hint: "rise per 12 of run" },
				{ label: "Area", value: formatArea(tri.area, mode) },
			]
		: [];

	const bothAngles = state.selected.length === 2 && !state.selected.some(isSide);
	const message = state.selected.length < 2 ? "Pick two values in the diagram, then enter them." : bothAngles ? "Two angles alone cannot fix a size. Pick at least one side." : state.selected.some((k) => state.values[k] === null) ? "Enter both known values." : "These values do not make a right triangle. The hypotenuse c must be the longest side and angles must be under 90°.";

	return (
		<div className={styles.container}>
			<div className="flex flex-col gap-6">
				<UnitAndPrecisionBar />

				<section className={styles.card} aria-labelledby="tri-diagram-heading">
					<h2 id="tri-diagram-heading" className={styles.cardTitle}>
						Right triangle
					</h2>
					<p className={styles.note}>Click any side or angle to make it an input. Enter any two sides, or one side and one angle, and the rest is solved.</p>
					<PrintDiagrams title="Right triangle" subtitle={TRI_KEYS.map((k) => text[k]).join(", ")}>
						<TriangleDiagram
							shape={tri ?? PLACEHOLDER}
							text={text}
							selected={state.selected}
							onPick={pick}
							label={tri ? `Right triangle with ${TRI_KEYS.map((k) => text[k]).join(", ")}` : "Right triangle awaiting two known values"}
						/>
					</PrintDiagrams>
					<div className={styles.pickRow} role="group" aria-label="Known values">
						{TRI_KEYS.map((k) => (
							<button key={k} type="button" className={styles.pickBtn} aria-pressed={state.selected.includes(k)} onClick={() => pick(k)}>
								{TRI_NAMES[k]}
							</button>
						))}
					</div>
				</section>

				<div className="grid gap-4 lg:grid-cols-2">
					<section className={styles.card} aria-labelledby="tri-known-heading">
						<h2 id="tri-known-heading" className={styles.cardTitle}>
							We know
						</h2>
						<div className="flex flex-col gap-4">
							{state.selected.length === 0 && <p className={styles.empty}>Nothing picked yet.</p>}
							{state.selected.map((k) =>
								isSide(k) ? (
									<DimensionInput key={k} id={`tri-${k}`} label={TRI_NAMES[k]} value={state.values[k]} onChange={setValue(k)} min={1} max={600} step={1} />
								) : (
									<NumberField key={k} id={`tri-${k}`} label={TRI_NAMES[k]} value={state.values[k] ?? 0} onChange={setValue(k)} unit="°" min={0} max={89.999} step="any" />
								),
							)}
							<div className="flex flex-col gap-1">
								<span className={styles.label}>Angle precision</span>
								<SegmentedControl<`${AnglePrecision}`>
									label="Angle precision"
									size="sm"
									fill={false}
									value={`${state.anglePrecision}`}
									onChange={(v) => setState((s) => ({ ...s, anglePrecision: Number(v) as AnglePrecision }))}
									options={ANGLE_PRECISIONS.map((p) => ({ value: `${p.value}` as `${AnglePrecision}`, label: p.label }))}
								/>
							</div>
						</div>
					</section>

					<section className={styles.card} aria-labelledby="tri-so-heading">
						<h2 id="tri-so-heading" className={styles.cardTitle}>
							So
						</h2>
						{tri ? <ResultList rows={rows} /> : <p className={styles.empty}>{message}</p>}
					</section>
				</div>

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

function formatArea(squareInches: number, mode: "ft-in" | "in" | "mm"): string {
	if (mode === "mm") return `${((squareInches * 645.16) / 1e6).toFixed(3)} m²`;
	if (mode === "in") return `${squareInches.toFixed(1)} sq in`;
	return `${(squareInches / 144).toFixed(2)} sq ft`;
}
