"use client";

import { useMemo, useState } from "react";
import SegmentedControl from "@/components/SegmentedControl";
import { UnitAndPrecisionBar, DimensionInput, ResultList, PrintDiagrams, LumberTable, ShareCalculation, ConstructionNotes } from "@/components/construction";
import type { ResultRow, MemberRole } from "@/components/construction";
import { useConstructionUnits } from "@/hooks/useConstructionUnits";
import { diagonal, squareUp } from "@/lib/construction/geometryUtils";
import { formatAngle } from "@/lib/construction/pitchUtils";
import { ShapeDiagram, AdjustDiagram, MIN_DRAWN_SWING } from "./SquareUpDiagrams";
import styles from "./SquareUpCalculator.module.scss";

type Shape = "rectangle" | "triangle";
type Color = Extract<MemberRole, "common" | "ridge" | "hip" | "jack">;

interface SquareUpState {
	shape: Shape;
	color: Color;
	/** Inches */
	side1: number | null;
	side2: number | null;
	referenceLength: number | null;
	sideLength: number | null;
	batterboardGap: number | null;
	currentDiagonal: number | null;
}

const DEFAULTS: SquareUpState = {
	shape: "rectangle",
	color: "common",
	side1: 144,
	side2: 120,
	referenceLength: 144,
	sideLength: 192,
	batterboardGap: 24,
	currentDiagonal: 238.5,
};

const SHAPES: { value: Shape; label: string }[] = [
	{ value: "rectangle", label: "Rectangle" },
	{ value: "triangle", label: "Triangle" },
];
const COLORS: { value: Color; label: string }[] = [
	{ value: "common", label: "Green" },
	{ value: "ridge", label: "Violet" },
	{ value: "hip", label: "Amber" },
	{ value: "jack", label: "Blue" },
];

const num = (v: unknown, lo: number, hi: number, fallback: number | null): number | null => (typeof v === "number" && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : fallback);
const oneOf = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T => (allowed.includes(v as T) ? (v as T) : fallback);

function sanitize(s: Partial<SquareUpState>): SquareUpState {
	const len = (v: unknown, fb: number | null) => num(v, 0.01, 1e6, fb);
	return {
		shape: oneOf(s.shape, ["rectangle", "triangle"] as const, DEFAULTS.shape),
		color: oneOf(s.color, ["common", "ridge", "hip", "jack"] as const, DEFAULTS.color),
		side1: len(s.side1, DEFAULTS.side1),
		side2: len(s.side2, DEFAULTS.side2),
		referenceLength: len(s.referenceLength, DEFAULTS.referenceLength),
		sideLength: len(s.sideLength, DEFAULTS.sideLength),
		batterboardGap: num(s.batterboardGap, 0, 1e6, DEFAULTS.batterboardGap),
		currentDiagonal: len(s.currentDiagonal, DEFAULTS.currentDiagonal),
	};
}

export default function SquareUpCalculator() {
	const { format, mode } = useConstructionUnits();
	const [state, setState] = useState<SquareUpState>(DEFAULTS);
	const set = <K extends keyof SquareUpState>(key: K) => (value: SquareUpState[K]) => setState((s) => ({ ...s, [key]: value }));

	const diag = state.side1 !== null && state.side2 !== null && state.side1 > 0 && state.side2 > 0 ? diagonal(state.side1, state.side2) : null;
	const area = (sqIn: number) => (mode === "mm" ? `${((sqIn * 645.16) / 1e6).toFixed(2)} m²` : `${(sqIn / 144).toFixed(2)} sq ft`);
	const shapeRows: ResultRow[] =
		diag !== null
			? [
					{ label: "Diagonal", value: format(diag), strong: true, hint: state.shape === "rectangle" ? "both diagonals, corner to corner" : "the long side" },
					{ label: "Perimeter", value: format(state.shape === "rectangle" ? 2 * (state.side1! + state.side2!) : state.side1! + state.side2! + diag) },
					{ label: "Area", value: area(state.shape === "rectangle" ? state.side1! * state.side2! : (state.side1! * state.side2!) / 2) },
					...(state.shape === "triangle"
						? [
								{ label: "Angle at side 1 end", value: formatAngle((Math.atan2(state.side2!, state.side1!) * 180) / Math.PI) },
								{ label: "Angle at side 2 end", value: formatAngle((Math.atan2(state.side1!, state.side2!) * 180) / Math.PI) },
							]
						: []),
				]
			: [];

	const adjust = useMemo(
		() =>
			state.referenceLength === null || state.sideLength === null || state.batterboardGap === null || state.currentDiagonal === null
				? null
				: squareUp({ referenceLength: state.referenceLength, sideLength: state.sideLength, batterboardGap: state.batterboardGap, currentDiagonal: state.currentDiagonal }),
		[state.referenceLength, state.sideLength, state.batterboardGap, state.currentDiagonal],
	);
	const dirText = adjust ? (adjust.direction === "none" ? "No move, it is square" : adjust.direction === "away" ? "away from the reference side" : "toward the reference side") : "";
	const adjustRows: ResultRow[] = adjust
		? [
				{ label: "Correct diagonal", value: format(adjust.correctDiagonal), strong: true },
				{ label: "Out of square", value: `${adjust.outOfSquare >= 0 ? "+" : "−"}${format(Math.abs(adjust.outOfSquare))}`, hint: adjust.outOfSquare < 0 ? "diagonal is short, corner closed in" : adjust.outOfSquare > 0 ? "diagonal is long, corner opened out" : "" },
				{ label: "Move string on batterboard", value: adjust.direction === "none" ? "0" : format(adjust.moveAtBatterboard), strong: true, hint: dirText },
				{ label: "Corner moves", value: format(adjust.moveAtCorner), hint: "at the far end of the side" },
				{ label: "Corner angle now", value: formatAngle(adjust.currentAngle, 2) },
			]
		: [];

	return (
		<div className={styles.container}>
			<div className="flex flex-col gap-6">
				<UnitAndPrecisionBar />

				{/* Part 1 */}
				<div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
					<section className={styles.card} aria-labelledby="sq-shape-heading">
						<h2 id="sq-shape-heading" className={styles.cardTitle}>
							Shape and diagonal
						</h2>
						<p className={styles.note}>Enter the two sides. When the measured diagonals match this length, the corners are square.</p>
						<div className="flex flex-col gap-4">
							<DimensionInput id="sq-side1" label="Side 1" value={state.side1} onChange={set("side1")} min={12} max={960} step={1} />
							<DimensionInput id="sq-side2" label="Side 2" value={state.side2} onChange={set("side2")} min={12} max={960} step={1} />
							<div className="flex flex-wrap items-end gap-x-6 gap-y-3">
								<div className="flex flex-col gap-1">
									<span className={styles.label}>Shape</span>
									<SegmentedControl<Shape> label="Shape" size="sm" fill={false} value={state.shape} onChange={set("shape")} options={SHAPES} />
								</div>
								<div className="flex flex-col gap-1">
									<span className={styles.label}>Color</span>
									<SegmentedControl<Color> label="Color" size="sm" fill={false} value={state.color} onChange={set("color")} options={COLORS} />
								</div>
							</div>
						</div>
					</section>
					<section className={styles.card} aria-labelledby="sq-shape-results">
						<h2 id="sq-shape-results" className={styles.cardTitle}>
							Diagonal and size
						</h2>
						{diag !== null ? <ResultList rows={shapeRows} /> : <p className={styles.empty}>Enter both sides.</p>}
					</section>
				</div>
				{diag !== null && (
					<section className={styles.card} aria-labelledby="sq-shape-diagram">
						<h2 id="sq-shape-diagram" className={styles.cardTitle}>
							Diagonal check
						</h2>
						<PrintDiagrams title="Square up: diagonal" subtitle={`${format(state.side1!)} × ${format(state.side2!)}, diagonal ${format(diag)}, drawn to fit`}>
							<ShapeDiagram side1={state.side1!} side2={state.side2!} diagonal={diag} shape={state.shape} role={state.color} format={format} />
						</PrintDiagrams>
					</section>
				)}

				{/* Part 2 */}
				<div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
					<section className={styles.card} aria-labelledby="sq-adjust-heading">
						<h2 id="sq-adjust-heading" className={styles.cardTitle}>
							Adjust the diagonal from two reference stakes
						</h2>
						<p className={styles.note}>Working alone with string lines and batterboards: fix one side between two stakes (A and B), run the next side from A past its corner to a batterboard, measure the diagonal from B, and this tells you how far to slide the string on the batterboard.</p>
						<div className="flex flex-col gap-4">
							<DimensionInput id="sq-ref" label="Reference length (A to B)" value={state.referenceLength} onChange={set("referenceLength")} hint="The side already fixed" />
							<DimensionInput id="sq-side" label="Side length (from A)" value={state.sideLength} onChange={set("sideLength")} hint="A to the corner being squared" />
							<DimensionInput id="sq-gap" label="Batterboard gap" value={state.batterboardGap} onChange={set("batterboardGap")} hint="Corner to the batterboard along the string" />
							<DimensionInput id="sq-diag" label="Current diagonal (B to corner)" value={state.currentDiagonal} onChange={set("currentDiagonal")} hint="As measured now" />
						</div>
					</section>
					<section className={styles.card} aria-labelledby="sq-adjust-results">
						<h2 id="sq-adjust-results" className={styles.cardTitle}>
							Adjustment
						</h2>
						{adjust ? <ResultList rows={adjustRows} /> : <p className={styles.empty}>Enter the reference, the side and a diagonal that can reach between them.</p>}
					</section>
				</div>
				{adjust && (
					<section className={styles.card} aria-labelledby="sq-adjust-diagram">
						<h2 id="sq-adjust-diagram" className={styles.cardTitle}>
							Current and correct string lines
						</h2>
						<PrintDiagrams title="Square up: adjust the diagonal" subtitle={`Reference ${format(state.referenceLength!)}, side ${format(state.sideLength!)}, diagonal now ${format(state.currentDiagonal!)}, correct ${format(adjust.correctDiagonal)}, move ${format(adjust.moveAtBatterboard)} ${dirText}, drawn to fit`}>
							<AdjustDiagram referenceLength={state.referenceLength!} sideLength={state.sideLength!} batterboardGap={state.batterboardGap!} result={adjust} format={format} />
						</PrintDiagrams>
						<p className={styles.legend}>
							<span className={styles.now}>Current string and diagonal</span>
							<span className={styles.correct}>Correct string and diagonal</span>
							{Math.abs(adjust.swingDeg) < MIN_DRAWN_SWING && adjust.direction !== "none" && <span>The swing is exaggerated to {MIN_DRAWN_SWING}° so the two lines can be told apart; the move distance is exact.</span>}
						</p>
					</section>
				)}

				<section className={styles.card} aria-labelledby="sq-steps-heading">
					<h2 id="sq-steps-heading" className={styles.cardTitle}>
						Squaring up a layout on your own
					</h2>
					<ol className={styles.steps}>
						<li>Set two stakes for one side at its exact length. This is the reference side, A to B. Everything else is squared from it.</li>
						<li>From A, run a string for the next side past its corner to a batterboard, and mark the corner on the string at the side length.</li>
						<li>Measure from B to that corner mark. Enter it above as the current diagonal; the tool gives the correct diagonal and how far to slide the string on the batterboard.</li>
						<li>Move the string that much on the batterboard, re-measure the diagonal and repeat until it matches. Each move is proportional, so it usually takes one or two tries.</li>
						<li>Once this side is square, use it and the reference side to set the remaining corners, checking both diagonals of the finished rectangle against the diagonal above.</li>
					</ol>
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
