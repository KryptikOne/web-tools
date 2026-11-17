"use client";

import { useMemo, useState } from "react";
import SegmentedControl from "@/components/SegmentedControl";
import { UnitAndPrecisionBar, DimensionInput, NumberField, ResultList, RunningList, PrintDiagrams, ShareCalculation, ConstructionNotes } from "@/components/construction";
import type { ResultRow } from "@/components/construction";
import { useConstructionUnits } from "@/hooks/useConstructionUnits";
import { formatArea } from "@/lib/construction/imperialUtils";
import { gauge, bond, BOND_PATTERNS, MASONRY_UNITS, type BondPattern } from "@/lib/construction/masonryUtils";
import { BondDiagram, GaugeRodDiagrams } from "./BrickDiagrams";
import styles from "./BrickCalculator.module.scss";

type Mode = "gauge" | "bond";

interface BrickState {
	mode: Mode;
	unit: string;
	brickLength: number | null;
	brickWidth: number | null;
	brickHeight: number | null;
	bedJoint: number | null;
	perpJoint: number | null;
	minJoint: number | null;
	maxJoint: number | null;
	// gauge
	by: "height" | "courses";
	targetHeight: number | null;
	courses: number;
	sill: number | null;
	head: number | null;
	// bond
	wallLength: number | null;
	pattern: BondPattern;
	fit: "adjust-perps" | "cut-ends";
	wallCourses: number;
	wastePercent: number;
	pricePerBrick: number;
}

const DEFAULTS: BrickState = {
	mode: "gauge",
	unit: "modular",
	brickLength: 7.625,
	brickWidth: 3.625,
	brickHeight: 2.25,
	bedJoint: 0.375,
	perpJoint: 0.375,
	minJoint: 0.25,
	maxJoint: 0.5,
	by: "height",
	targetHeight: 96,
	courses: 36,
	sill: 36,
	head: 84,
	wallLength: 120,
	pattern: "stretcher",
	fit: "adjust-perps",
	wallCourses: 36,
	wastePercent: 5,
	pricePerBrick: 0.8,
};

/** Longest gauge rod drawn: 30 segments of 250 mm, about 24 ft 7 in */
const MAX_ROD_MM = 7500;
const UNIT_OPTIONS = [...MASONRY_UNITS.map((u) => ({ value: u.id, label: u.label })), { value: "custom", label: "Custom" }];
const PATTERN_VALUES = BOND_PATTERNS.map((p) => p.value);

const num = (v: unknown, lo: number, hi: number, fallback: number | null): number | null => (typeof v === "number" && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : fallback);
const oneOf = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T => (allowed.includes(v as T) ? (v as T) : fallback);
const int = (v: unknown, lo: number, hi: number, fb: number) => Math.round(num(v, lo, hi, fb) ?? fb);

function sanitize(s: Partial<BrickState>): BrickState {
	return {
		mode: oneOf(s.mode, ["gauge", "bond"] as const, DEFAULTS.mode),
		unit: typeof s.unit === "string" && UNIT_OPTIONS.some((u) => u.value === s.unit) ? s.unit : DEFAULTS.unit,
		brickLength: num(s.brickLength, 0.5, 100, DEFAULTS.brickLength),
		brickWidth: num(s.brickWidth, 0.5, 100, DEFAULTS.brickWidth),
		brickHeight: num(s.brickHeight, 0.5, 100, DEFAULTS.brickHeight),
		bedJoint: num(s.bedJoint, 0, 5, DEFAULTS.bedJoint),
		perpJoint: num(s.perpJoint, 0, 5, DEFAULTS.perpJoint),
		minJoint: num(s.minJoint, 0, 5, DEFAULTS.minJoint),
		maxJoint: num(s.maxJoint, 0, 5, DEFAULTS.maxJoint),
		by: oneOf(s.by, ["height", "courses"] as const, DEFAULTS.by),
		targetHeight: num(s.targetHeight, 1, 1200, DEFAULTS.targetHeight),
		courses: int(s.courses, 1, 400, DEFAULTS.courses),
		sill: num(s.sill, 0, 10000, DEFAULTS.sill),
		head: num(s.head, 0, 10000, DEFAULTS.head),
		wallLength: num(s.wallLength, 1, 2400, DEFAULTS.wallLength),
		pattern: oneOf(s.pattern, PATTERN_VALUES, DEFAULTS.pattern),
		fit: oneOf(s.fit, ["adjust-perps", "cut-ends"] as const, DEFAULTS.fit),
		wallCourses: int(s.wallCourses, 1, 400, DEFAULTS.wallCourses),
		wastePercent: num(s.wastePercent, 0, 100, DEFAULTS.wastePercent) ?? DEFAULTS.wastePercent,
		pricePerBrick: num(s.pricePerBrick, 0, 1000, DEFAULTS.pricePerBrick) ?? DEFAULTS.pricePerBrick,
	};
}

export default function BrickCalculator() {
	const { format, mode: unitMode } = useConstructionUnits();
	const [state, setState] = useState<BrickState>(DEFAULTS);
	const set = <K extends keyof BrickState>(key: K) => (value: BrickState[K]) => setState((s) => ({ ...s, [key]: value }));
	const pickUnit = (id: string) => {
		const u = MASONRY_UNITS.find((m) => m.id === id);
		setState((s) => ({ ...s, unit: id, ...(u ? { brickLength: u.length, brickWidth: u.width, brickHeight: u.height, bedJoint: u.joint, perpJoint: u.joint } : {}) }));
	};
	const custom = <K extends "brickLength" | "brickWidth" | "brickHeight">(key: K) => (v: number | null) => setState((s) => ({ ...s, [key]: v, unit: "custom" }));

	const g = useMemo(
		() =>
			state.mode !== "gauge" || state.brickHeight === null || state.bedJoint === null || state.minJoint === null || state.maxJoint === null || state.targetHeight === null
				? null
				: gauge({
						unitHeight: state.brickHeight,
						bedJoint: state.bedJoint,
						by: state.by,
						targetHeight: state.targetHeight,
						courses: state.courses,
						minJoint: state.minJoint,
						maxJoint: state.maxJoint,
						openings: [
							{ label: "Sill", height: state.sill ?? 0 },
							{ label: "Head", height: state.head ?? 0 },
						],
					}),
		[state],
	);
	const b = useMemo(
		() =>
			state.mode !== "bond" || state.wallLength === null || state.brickLength === null || state.brickWidth === null || state.brickHeight === null || state.perpJoint === null || state.bedJoint === null || state.minJoint === null || state.maxJoint === null
				? null
				: bond({ wallLength: state.wallLength, brickLength: state.brickLength, brickWidth: state.brickWidth, brickHeight: state.brickHeight, perpJoint: state.perpJoint, bedJoint: state.bedJoint, pattern: state.pattern, fit: state.fit, minJoint: state.minJoint, maxJoint: state.maxJoint, courses: state.wallCourses, wastePercent: state.wastePercent, pricePerBrick: state.pricePerBrick }),
		[state],
	);

	const gaugeRows: ResultRow[] = g
		? [
				{ label: "Courses", value: `${g.courses}`, strong: true, hint: state.by === "height" ? `nearest to ${format(state.targetHeight ?? 0)}` : "as entered" },
				{ label: "Gauge", value: format(g.adjustedGauge), strong: true, hint: g.jointInRange && Math.abs(g.adjustedGauge - g.nominalGauge) > 1e-6 ? `course height; ${format(g.nominalGauge)} with the entered joint` : "course height, brick plus bed joint" },
				{ label: "Bed joint", value: format(g.adjustedJoint), hint: g.jointInRange ? `entered ${format(state.bedJoint ?? 0)}; this joint hits the height exactly` : `needed for the exact height, outside the ${format(state.minJoint ?? 0)} to ${format(state.maxJoint ?? 0)} range` },
				{ label: "Height reached", value: format(g.height), strong: true, hint: g.jointInRange ? "" : `${format(g.nominalHeight)} at the entered joint` },
				...g.openings.filter((o) => o.height > 0).map((o) => ({ label: `${o.label} at ${format(o.height)}`, value: `course ${o.course}, ${format(o.snapped)}`, hint: Math.abs(o.difference) < 1e-6 ? "on a course line" : `${o.difference > 0 ? "up" : "down"} ${format(Math.abs(o.difference))} to the nearest course line` })),
			]
		: [];
	const bondRows: ResultRow[] = b
		? [
				{ label: "Stretchers per course", value: b.stretchersExact.toFixed(2), hint: `at a ${format(state.perpJoint ?? 0)} perp` },
				{ label: "Perp joint", value: format(b.perp), strong: true, hint: state.fit === "adjust-perps" && b.perpInRange ? `adjusted from ${format(state.perpJoint ?? 0)} so whole bricks fit` : "as entered" },
				{ label: "Bricks per course", value: `${b.courseA.units.length} / ${b.courseB.units.length}`, strong: true, hint: `alternate courses; cuts ${b.courseA.cut} / ${b.courseB.cut}` },
				{ label: "Bricks", value: `${b.bricksTotal}`, strong: true, hint: `${state.wallCourses} courses, ${b.bricksWithWaste} with ${state.wastePercent}% waste` },
				{ label: "Per area", value: `${b.perSquareFoot.toFixed(2)} / sq ft`, hint: `${b.perSquareMetre.toFixed(1)} per m², wall ${formatArea(b.wallArea, unitMode)}` },
				{ label: "Mortar", value: `${b.mortarCubicFeet.toFixed(2)} ft³`, hint: "bed and perp joints, one brick deep, no waste" },
				{ label: "Cost", value: `$${b.cost.toFixed(2)}`, hint: `at $${state.pricePerBrick.toFixed(2)} per brick` },
			]
		: [];

	return (
		<div className={styles.container}>
			<div className="flex flex-col gap-6">
				<UnitAndPrecisionBar />

				<div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
					<section className={styles.card} aria-labelledby="bk-heading">
						<h2 id="bk-heading" className={styles.cardTitle}>
							Brickwork
						</h2>
						<SegmentedControl<Mode>
							label="Calculation"
							size="sm"
							value={state.mode}
							onChange={set("mode")}
							options={[
								{ value: "gauge", label: "Gauge (courses)" },
								{ value: "bond", label: "Bond (bricks along)" },
							]}
						/>
						<div className="flex flex-col gap-4 mt-4">
							<div className="flex flex-col gap-1">
								<label htmlFor="bk-unit" className={styles.label}>
									Brick
								</label>
								<select id="bk-unit" className={styles.select} value={state.unit} onChange={(e) => pickUnit(e.target.value)}>
									{UNIT_OPTIONS.map((u) => (
										<option key={u.value} value={u.value}>
											{u.label}
										</option>
									))}
								</select>
							</div>
							<div className="grid grid-cols-3 gap-3">
								<DimensionInput id="bk-len" label="Brick length" value={state.brickLength} onChange={custom("brickLength")} />
								<DimensionInput id="bk-wid" label="Brick width" value={state.brickWidth} onChange={custom("brickWidth")} />
								<DimensionInput id="bk-hgt" label="Brick height" value={state.brickHeight} onChange={custom("brickHeight")} />
							</div>
							<div className="grid grid-cols-2 gap-3">
								<DimensionInput id="bk-bed" label="Bed joint" value={state.bedJoint} onChange={set("bedJoint")} hint="Horizontal" />
								<DimensionInput id="bk-perp" label="Perp joint" value={state.perpJoint} onChange={set("perpJoint")} hint="Vertical" />
							</div>
							<div className="grid grid-cols-2 gap-3">
								<DimensionInput id="bk-min" label="Smallest joint" value={state.minJoint} onChange={set("minJoint")} hint="When adjusting" />
								<DimensionInput id="bk-max" label="Largest joint" value={state.maxJoint} onChange={set("maxJoint")} hint="When adjusting" />
							</div>

							{state.mode === "gauge" && (
								<>
									<div className="flex flex-wrap items-end gap-x-6 gap-y-3">
										<div className="flex flex-col gap-1">
											<span className={styles.label}>Solve for</span>
											<SegmentedControl<"height" | "courses">
												label="Solve for"
												size="sm"
												fill={false}
												value={state.by}
												onChange={(v) => setState((s) => ({ ...s, by: v, ...(g && v === "courses" ? { courses: g.courses } : {}), ...(g && v === "height" ? { targetHeight: Number(g.height.toFixed(4)) } : {}) }))}
												options={[
													{ value: "height", label: "Courses to a height" },
													{ value: "courses", label: "Height of courses" },
												]}
											/>
										</div>
										{state.by === "height" ? <DimensionInput id="bk-target" label="Target height" value={state.targetHeight} onChange={set("targetHeight")} className="w-44" /> : <NumberField id="bk-courses" label="Courses" value={state.courses} onChange={(v) => set("courses")(int(v, 1, 400, 1))} min={1} max={400} step={1} className="w-36" />}
									</div>
									<div className="grid grid-cols-2 gap-3">
										<DimensionInput id="bk-sill" label="Window sill" value={state.sill} onChange={set("sill")} hint="Height to snap to a course; 0 for none" />
										<DimensionInput id="bk-head" label="Door or window head" value={state.head} onChange={set("head")} hint="Height to snap to a course; 0 for none" />
									</div>
								</>
							)}

							{state.mode === "bond" && (
								<>
									<DimensionInput id="bk-wall" label="Wall length" value={state.wallLength} onChange={set("wallLength")} />
									<div className="flex flex-col gap-1">
										<label htmlFor="bk-pattern" className={styles.label}>
											Bond pattern
										</label>
										<select id="bk-pattern" className={styles.select} value={state.pattern} onChange={(e) => set("pattern")(e.target.value as BondPattern)}>
											{BOND_PATTERNS.map((p) => (
												<option key={p.value} value={p.value}>
													{p.label}
												</option>
											))}
										</select>
										<span className={styles.hint}>{BOND_PATTERNS.find((p) => p.value === state.pattern)?.hint}</span>
									</div>
									<div className="flex flex-col gap-1">
										<span className={styles.label}>Odd length</span>
										<SegmentedControl<"adjust-perps" | "cut-ends">
											label="Odd length"
											size="sm"
											fill={false}
											value={state.fit}
											onChange={set("fit")}
											options={[
												{ value: "adjust-perps", label: "Adjust the perps" },
												{ value: "cut-ends", label: "Cut the end bricks" },
											]}
										/>
									</div>
									<div className="grid grid-cols-3 gap-3">
										<NumberField id="bk-wall-courses" label="Courses high" value={state.wallCourses} onChange={(v) => set("wallCourses")(int(v, 1, 400, 1))} min={1} max={400} step={1} />
										<NumberField id="bk-waste" label="Waste" value={state.wastePercent} onChange={set("wastePercent")} unit="%" min={0} max={100} step="any" />
										<NumberField id="bk-price" label="Per brick" value={state.pricePerBrick} onChange={set("pricePerBrick")} prefix="$" step="any" />
									</div>
								</>
							)}
						</div>
					</section>

					<section className={styles.card} aria-labelledby="bk-results">
						<h2 id="bk-results" className={styles.cardTitle}>
							{state.mode === "gauge" ? "Courses" : "Bricks"}
						</h2>
						{(g ?? b) ? <ResultList rows={state.mode === "gauge" ? gaugeRows : bondRows} /> : <p className={styles.empty}>Enter the brick, joints and the height or wall length.</p>}
						{(g ?? b)?.warnings.map((w) => (
							<p key={w} className={styles.warn}>
								{w}
							</p>
						))}
						{g && <p className={styles.note}>Courses are counted with a bed joint under every brick, so the height is courses × (brick + joint). Mark the rod from the base with the running list below so rounding never drifts.</p>}
					</section>
				</div>

				{g && state.brickHeight !== null && (
					<>
						<RunningList title="Course heights" positions={g.courseHeights} labelFor={(i) => g.openings.find((o) => o.height > 0 && o.course === i + 1)?.label ?? ""} />
						{g.height * 25.4 > MAX_ROD_MM ? (
							<p className={styles.note}>The gauge rod is only drawn for heights up to {Math.round(MAX_ROD_MM / 25.4 / 12)} ft; the running list above carries every course.</p>
						) : (
						<section className={styles.card} aria-labelledby="bk-rod">
							<h2 id="bk-rod" className={styles.cardTitle}>
								Gauge rod
							</h2>
							<p className={styles.note}>Course lines at true size for marking a storey rod, split into segments that each fit a sheet. Print at 100%, cut along the segment ends and tape them in order; every segment is labelled with its heights so it can be checked against a tape.</p>
							<PrintDiagrams title="Gauge rod" subtitle={`${g.courses} courses at ${format(g.adjustedGauge)} to ${format(g.height)}, true size in ${Math.max(1, Math.ceil((g.height * 25.4) / 250))} segments`}>
								<div className="flex flex-wrap gap-4">
									<GaugeRodDiagrams gauge={g} unitHeight={state.brickHeight} format={format} />
								</div>
							</PrintDiagrams>
						</section>
						)}
					</>
				)}

				{b && state.wallLength !== null && state.brickHeight !== null && state.bedJoint !== null && (
					<section className={styles.card} aria-labelledby="bk-elev">
						<h2 id="bk-elev" className={styles.cardTitle}>
							Bond
						</h2>
						<PrintDiagrams title={`${BOND_PATTERNS.find((p) => p.value === state.pattern)?.label} bond`} subtitle={`${format(state.wallLength)} wall, ${format(b.perp)} perps, drawn to fit`}>
							<BondDiagram bond={b} wallLength={state.wallLength} brickHeight={state.brickHeight} bedJoint={state.bedJoint} courses={Math.min(state.wallCourses, 8)} format={format} />
						</PrintDiagrams>
						<p className={styles.legend}>
							<span className={styles.stretcher}>Stretchers</span>
							<span className={styles.header}>Headers</span>
							<span className={styles.cut}>Cut bricks</span>
						</p>
					</section>
				)}

				<div className="grid gap-4 lg:grid-cols-2">
					<ShareCalculation state={state} onLoad={(s) => setState(sanitize(s))} />
					<ConstructionNotes />
				</div>
			</div>
		</div>
	);
}
