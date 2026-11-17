"use client";

import { useMemo, useState } from "react";
import SegmentedControl from "@/components/SegmentedControl";
import { UnitAndPrecisionBar, DimensionInput, ResultList, PrintDiagrams, ShareCalculation, ConstructionNotes } from "@/components/construction";
import type { ResultRow } from "@/components/construction";
import { useClipboard } from "@/hooks/useClipboard";
import { useConstructionUnits } from "@/hooks/useConstructionUnits";
import { formatArea } from "@/lib/construction/imperialUtils";
import { arcLayout, gothicArch, oval, GOTHIC_STYLES, type GothicStyle, type Offset } from "@/lib/construction/curveLayoutUtils";
import { formatAngle } from "@/lib/construction/pitchUtils";
import CurveDiagram from "./CurveDiagrams";
import styles from "./ArcLayoutCalculator.module.scss";

type Mode = "arc" | "gothic" | "oval";

interface ArcState {
	mode: Mode;
	arcBy: "chord-rise" | "radius-chord";
	chord: number | null;
	rise: number | null;
	radius: number | null;
	span: number | null;
	style: GothicStyle;
	gothicRise: number | null;
	major: number | null;
	minor: number | null;
	interval: number | null;
}

const DEFAULTS: ArcState = {
	mode: "arc",
	arcBy: "chord-rise",
	chord: 48,
	rise: 6,
	radius: 51,
	span: 48,
	style: "equilateral",
	gothicRise: 18,
	major: 60,
	minor: 40,
	interval: 6,
};

const num = (v: unknown, lo: number, hi: number, fallback: number | null): number | null => (typeof v === "number" && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : fallback);
const oneOf = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T => (allowed.includes(v as T) ? (v as T) : fallback);
const STYLE_VALUES = GOTHIC_STYLES.map((g) => g.value);

function sanitize(s: Partial<ArcState>): ArcState {
	return {
		mode: oneOf(s.mode, ["arc", "gothic", "oval"] as const, DEFAULTS.mode),
		arcBy: oneOf(s.arcBy, ["chord-rise", "radius-chord"] as const, DEFAULTS.arcBy),
		chord: num(s.chord, 1, 1e4, DEFAULTS.chord),
		rise: num(s.rise, 0.01, 1e4, DEFAULTS.rise),
		radius: num(s.radius, 0.5, 1e5, DEFAULTS.radius),
		span: num(s.span, 1, 1e4, DEFAULTS.span),
		style: oneOf(s.style, STYLE_VALUES, DEFAULTS.style),
		gothicRise: num(s.gothicRise, 0.1, 1e4, DEFAULTS.gothicRise),
		major: num(s.major, 1, 1e4, DEFAULTS.major),
		minor: num(s.minor, 1, 1e4, DEFAULTS.minor),
		interval: num(s.interval, 0.25, 1e3, DEFAULTS.interval),
	};
}

export default function ArcLayoutCalculator() {
	const { format, mode: unitMode } = useConstructionUnits();
	const { copy, isCopied } = useClipboard();
	const [state, setState] = useState<ArcState>(DEFAULTS);
	const set = <K extends keyof ArcState>(key: K) => (value: ArcState[K]) => setState((s) => ({ ...s, [key]: value }));
	const interval = state.interval ?? 6;

	const arc = useMemo(() => (state.mode !== "arc" || state.chord === null || state.rise === null || state.radius === null ? null : arcLayout({ by: state.arcBy, chord: state.chord, rise: state.rise, radius: state.radius, interval })), [state, interval]);
	const gothic = useMemo(() => (state.mode !== "gothic" || state.span === null || state.gothicRise === null ? null : gothicArch({ span: state.span, style: state.style, rise: state.gothicRise, interval })), [state, interval]);
	const ov = useMemo(() => (state.mode !== "oval" || state.major === null || state.minor === null ? null : oval({ major: state.major, minor: state.minor, interval })), [state, interval]);

	let rows: ResultRow[] = [];
	let offsets: Offset[] = [];
	let drawing: Parameters<typeof CurveDiagram>[0] | null = null;
	let title = "";
	const warnings: string[] = [];
	if (arc) {
		title = `Arc on a ${format(arc.chord)} chord`;
		rows = [
			{ label: "Radius", value: format(arc.radius), strong: true, hint: `centre ${format(Math.abs(arc.centreBelowChord))} ${arc.centreBelowChord >= 0 ? "below" : "above"} the chord midpoint` },
			{ label: "Rise", value: format(arc.rise), strong: true },
			{ label: "Arc length", value: format(arc.arcLength), hint: `${formatAngle(arc.angle, 2)} of arc` },
			{ label: "Offsets", value: `${arc.offsets.length} at ${format(interval)}`, hint: "from the chord, both ends included" },
		];
		offsets = arc.offsets;
		drawing = { length: arc.chord, rise: arc.rise, y: arc.y, offsets, centres: arc.centreBelowChord < arc.chord * 1.5 ? [{ x: arc.chord / 2, y: -arc.centreBelowChord, radius: arc.radius, label: "centre" }] : [], format, label: `Arc ${format(arc.chord)} chord, ${format(arc.rise)} rise, radius ${format(arc.radius)}, offsets every ${format(interval)}` };
	} else if (gothic) {
		title = `${GOTHIC_STYLES.find((g) => g.value === gothic.style)?.label} arch, ${format(gothic.span)} span`;
		rows = [
			{ label: "Rise", value: format(gothic.rise), strong: true, hint: `${(gothic.rise / gothic.span).toFixed(3)} of the span` },
			...gothic.centres.map((c) => ({ label: `Centre, ${c.label}`, value: `${format(c.x)}${c.y ? `, ${format(-c.y)} below` : ""}`, hint: `radius ${format(c.radius)}; from the left springing point along the springing line` })),
			...(gothic.junctions.length ? [{ label: "Junctions", value: gothic.junctions.map((j) => `${format(j.x)} across, ${format(j.y)} up`).join(" and "), hint: "where the small and large arcs meet" }] : []),
			{ label: "Apex angle", value: formatAngle(gothic.apexAngle, 1), hint: "between the two arcs at the point" },
			{ label: "Offsets", value: `${gothic.offsets.length} at ${format(interval)}`, hint: "from the springing line" },
		];
		offsets = gothic.offsets;
		warnings.push(...gothic.warnings);
		const centresDrawn = gothic.centres.filter((c) => Math.abs(c.x - gothic.span / 2) < gothic.span * 1.5 && -c.y < gothic.span * 1.5);
		drawing = { length: gothic.span, rise: gothic.rise, y: gothic.y, offsets, centres: centresDrawn, points: gothic.junctions.map((j, i) => ({ x: j.x, y: j.y, label: `J${i + 1}` })), format, label: `${title}: rise ${format(gothic.rise)}, ${gothic.centres.length} centres, offsets every ${format(interval)}` };
	} else if (ov) {
		title = `Oval ${format(ov.a * 2)} by ${format(ov.b * 2)}`;
		const fc = ov.fourCentre;
		rows = [
			{ label: "Foci", value: format(ov.focalDistance), strong: true, hint: `each side of the centre on the major axis; pins ${format(2 * ov.focalDistance)} apart` },
			{ label: "String length", value: format(ov.stringLength), strong: true, hint: "a loop over both pins and the pencil equals the major axis" },
			{ label: "Perimeter", value: format(ov.perimeter), hint: "Ramanujan's approximation" },
			{ label: "Area", value: formatArea(ov.area, unitMode) },
			{ label: "Four-centre end arcs", value: `R ${format(fc.endRadius)}`, hint: `centres ${format(fc.endCentre)} each side of the middle on the major axis` },
			{ label: "Four-centre side arcs", value: `R ${format(fc.sideRadius)}`, hint: `centres ${format(fc.sideCentreBelow)} beyond the minor axis ends, on the minor axis; arcs meet ${format(fc.junctionX)} out and ${format(fc.junctionY)} up` },
			{ label: "Offsets", value: `${ov.offsets.length} at ${format(interval)}`, hint: "from the major axis, both halves alike" },
		];
		offsets = ov.offsets;
		drawing = {
			length: ov.a * 2,
			rise: ov.b,
			y: ov.y,
			offsets,
			mirror: true,
			points: [
				{ x: ov.a - ov.focalDistance, y: 0, label: "F1" },
				{ x: ov.a + ov.focalDistance, y: 0, label: "F2" },
			],
			format,
			label: `Oval ${format(ov.a * 2)} by ${format(ov.b * 2)}: foci ${format(ov.focalDistance)} from the centre, offsets every ${format(interval)}`,
		};
	}

	const copyOffsets = () => copy(["Along\tOffset", ...offsets.map((o) => `${format(o.x)}\t${format(o.y)}`)].join("\n"));

	return (
		<div className={styles.container}>
			<div className="flex flex-col gap-6">
				<UnitAndPrecisionBar />

				<div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
					<section className={styles.card} aria-labelledby="al-heading">
						<h2 id="al-heading" className={styles.cardTitle}>
							Curve
						</h2>
						<SegmentedControl<Mode>
							label="Curve"
							size="sm"
							value={state.mode}
							onChange={set("mode")}
							options={[
								{ value: "arc", label: "Arc" },
								{ value: "gothic", label: "Gothic arch" },
								{ value: "oval", label: "Oval" },
							]}
						/>
						<p className={`${styles.note} mt-3`}>
							{state.mode === "arc" && "Set out an arc without swinging the radius: measure along the chord and square up the offsets."}
							{state.mode === "gothic" && "Two-centre arches swing from points on the springing line; the Tudor arch adds two flat arcs from centres below it."}
							{state.mode === "oval" && "A true ellipse by string and two pins, by offsets from the major axis, or near enough with four compass arcs."}
						</p>
						<div className="flex flex-col gap-4">
							{state.mode === "arc" && (
								<>
									<div className="flex flex-col gap-1">
										<span className={styles.label}>Known</span>
										<SegmentedControl<"chord-rise" | "radius-chord">
											label="Known"
											size="sm"
											fill={false}
											value={state.arcBy}
											onChange={(v) => setState((s) => ({ ...s, arcBy: v, ...(arc ? { radius: Number(arc.radius.toFixed(4)), rise: Number(arc.rise.toFixed(4)) } : {}) }))}
											options={[
												{ value: "chord-rise", label: "Chord and rise" },
												{ value: "radius-chord", label: "Radius and chord" },
											]}
										/>
									</div>
									<div className="grid grid-cols-2 gap-3">
										<DimensionInput id="al-chord" label="Chord" value={state.chord} onChange={set("chord")} />
										{state.arcBy === "chord-rise" ? <DimensionInput id="al-rise" label="Rise" value={state.rise} onChange={set("rise")} /> : <DimensionInput id="al-radius" label="Radius" value={state.radius} onChange={set("radius")} />}
									</div>
								</>
							)}
							{state.mode === "gothic" && (
								<>
									<DimensionInput id="al-span" label="Span" value={state.span} onChange={set("span")} hint="Between the springing points" />
									<div className="flex flex-col gap-1">
										<label htmlFor="al-style" className={styles.label}>
											Style
										</label>
										<select id="al-style" className={styles.select} value={state.style} onChange={(e) => set("style")(e.target.value as GothicStyle)}>
											{GOTHIC_STYLES.map((g) => (
												<option key={g.value} value={g.value}>
													{g.label}
												</option>
											))}
										</select>
										<span className={styles.hint}>{GOTHIC_STYLES.find((g) => g.value === state.style)?.hint}</span>
									</div>
									{(state.style === "custom" || state.style === "tudor") && <DimensionInput id="al-grise" label="Rise" value={state.gothicRise} onChange={set("gothicRise")} hint={state.style === "tudor" ? "More than a quarter of the span, less than the span" : "At least half the span"} />}
								</>
							)}
							{state.mode === "oval" && (
								<div className="grid grid-cols-2 gap-3">
									<DimensionInput id="al-major" label="Major axis" value={state.major} onChange={set("major")} hint="Long way" />
									<DimensionInput id="al-minor" label="Minor axis" value={state.minor} onChange={set("minor")} hint="Short way" />
								</div>
							)}
							<DimensionInput id="al-interval" label="Offset interval" value={state.interval} onChange={set("interval")} hint="Along the base line" />
						</div>
					</section>

					<section className={styles.card} aria-labelledby="al-results">
						<h2 id="al-results" className={styles.cardTitle}>
							Setting out
						</h2>
						{drawing ? <ResultList rows={rows} /> : <p className={styles.empty}>{state.mode === "gothic" ? "A two-centre rise must be at least half the span; a Tudor rise between a quarter and the whole span." : state.mode === "oval" ? "The major axis must be the longer one." : "Enter the chord and a rise or radius that fits it."}</p>}
						{warnings.map((w) => (
							<p key={w} className={styles.warn}>
								{w}
							</p>
						))}
					</section>
				</div>

				{drawing && (
					<>
						<section className={styles.card} aria-labelledby="al-diagram">
							<h2 id="al-diagram" className={styles.cardTitle}>
								{title}
							</h2>
							<PrintDiagrams title={title} subtitle="Drawn to fit">
								<CurveDiagram {...drawing} />
							</PrintDiagrams>
						</section>
						<section className={styles.card} aria-labelledby="al-offsets">
							<div className="flex flex-wrap items-center justify-between gap-2 mb-2">
								<h2 id="al-offsets" className={styles.cardTitle}>
									Offsets
								</h2>
								<button type="button" className={styles.btn} onClick={copyOffsets}>
									{isCopied() ? "Copied" : "Copy table"}
								</button>
							</div>
							<p className={styles.note}>Measure along the base line from the left end, square up the offset, mark the curve.</p>
							<div className={styles.dipGrid}>
								{offsets.map((o) => (
									<div key={o.x} className={styles.dipRow}>
										<span className="mono">{format(o.x)}</span>
										<span className="mono">{format(o.y)}</span>
									</div>
								))}
							</div>
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
