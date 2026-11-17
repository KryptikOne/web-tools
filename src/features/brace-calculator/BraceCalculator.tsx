"use client";

import { useMemo, useState } from "react";
import SegmentedControl from "@/components/SegmentedControl";
import { UnitAndPrecisionBar, DimensionInput, NumberField, ResultList, RunningList, PrintDiagrams, ShareCalculation, ConstructionNotes } from "@/components/construction";
import type { ResultRow } from "@/components/construction";
import { useConstructionUnits } from "@/hooks/useConstructionUnits";
import { diagonalBrace, kneeBrace } from "@/lib/construction/braceUtils";
import { formatAngle } from "@/lib/construction/pitchUtils";
import { FrameDiagram, KneeDiagram, BraceEndTemplate } from "./BraceDiagrams";
import styles from "./BraceCalculator.module.scss";

type Mode = "diagonal" | "knee";

interface BraceState {
	mode: Mode;
	frameWidth: number | null;
	frameHeight: number | null;
	braceWidth: number | null;
	memberWidth: number | null;
	ends: "corner" | "square";
	letIn: boolean;
	studCenters: number;
	studWidth: number | null;
	by: "angle" | "rise-run";
	angle: number;
	run: number | null;
	rise: number | null;
	postWidth: number | null;
	beamDepth: number | null;
}

const DEFAULTS: BraceState = {
	mode: "diagonal",
	frameWidth: 96,
	frameHeight: 96,
	braceWidth: 3.5,
	memberWidth: 3.5,
	ends: "corner",
	letIn: true,
	studCenters: 16,
	studWidth: 1.5,
	by: "angle",
	angle: 45,
	run: 24,
	rise: 24,
	postWidth: 5.5,
	beamDepth: 7.25,
};

const num = (v: unknown, lo: number, hi: number, fallback: number | null): number | null => (typeof v === "number" && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : fallback);
const oneOf = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T => (allowed.includes(v as T) ? (v as T) : fallback);

function sanitize(s: Partial<BraceState>): BraceState {
	return {
		mode: oneOf(s.mode, ["diagonal", "knee"] as const, DEFAULTS.mode),
		frameWidth: num(s.frameWidth, 1, 1e4, DEFAULTS.frameWidth),
		frameHeight: num(s.frameHeight, 1, 1e4, DEFAULTS.frameHeight),
		braceWidth: num(s.braceWidth, 0.25, 48, DEFAULTS.braceWidth),
		memberWidth: num(s.memberWidth, 0.25, 48, DEFAULTS.memberWidth),
		ends: oneOf(s.ends, ["corner", "square"] as const, DEFAULTS.ends),
		letIn: typeof s.letIn === "boolean" ? s.letIn : DEFAULTS.letIn,
		studCenters: [12, 16, 19.2, 24].includes(s.studCenters as number) ? (s.studCenters as number) : DEFAULTS.studCenters,
		studWidth: num(s.studWidth, 0.25, 12, DEFAULTS.studWidth),
		by: oneOf(s.by, ["angle", "rise-run"] as const, DEFAULTS.by),
		angle: num(s.angle, 1, 89, DEFAULTS.angle) ?? DEFAULTS.angle,
		run: num(s.run, 0.5, 1e3, DEFAULTS.run),
		rise: num(s.rise, 0.5, 1e3, DEFAULTS.rise),
		postWidth: num(s.postWidth, 0.5, 48, DEFAULTS.postWidth),
		beamDepth: num(s.beamDepth, 0.5, 48, DEFAULTS.beamDepth),
	};
}

export default function BraceCalculator() {
	const { format } = useConstructionUnits();
	const [state, setState] = useState<BraceState>(DEFAULTS);
	const set = <K extends keyof BraceState>(key: K) => (value: BraceState[K]) => setState((s) => ({ ...s, [key]: value }));

	const diag = useMemo(() => (state.mode !== "diagonal" || state.frameWidth === null || state.frameHeight === null || state.braceWidth === null || state.studWidth === null ? null : diagonalBrace({ frameWidth: state.frameWidth, frameHeight: state.frameHeight, braceWidth: state.braceWidth, ends: state.ends, studCenters: state.letIn ? state.studCenters : 0, studWidth: state.studWidth })), [state]);
	const knee = useMemo(() => (state.mode !== "knee" || state.braceWidth === null || state.run === null || state.rise === null || state.postWidth === null || state.beamDepth === null ? null : kneeBrace({ by: state.by, angle: state.angle, run: state.run, rise: state.rise, braceWidth: state.braceWidth, postWidth: state.postWidth, beamDepth: state.beamDepth })), [state]);
	const b = state.braceWidth ?? 0;

	const diagRows: ResultRow[] = diag
		? [
				{ label: "Brace angle", value: formatAngle(diag.angle, 2), strong: true, hint: `diagonal ${format(diag.diagonal)}` },
				{ label: "Long point to long point", value: format(diag.longLength), strong: true, hint: state.ends === "corner" ? "on the centre line, corner to corner" : `square ends set ${format(diag.squareSetIn)} in from each corner` },
				{ label: "Short point to short point", value: format(diag.shortLength), hint: state.ends === "corner" ? "along either edge" : "same as the long points" },
				...(state.ends === "corner"
					? [
							{ label: "Plumb cut", value: `${formatAngle(diag.plumbCutAngle, 2)} · ${format(diag.plumbCut)}`, hint: "from square · length against the post, each end" },
							{ label: "Level cut", value: `${formatAngle(diag.levelCutAngle, 2)} · ${format(diag.levelCut)}`, hint: "from square · length along the plate, each end" },
						]
					: [{ label: "End cuts", value: "square", hint: "the corners of the end touch the post and the plate" }]),
				...(diag.notches.length ? [{ label: "Let-in notches", value: `${diag.notches.length}`, hint: `one per stud at ${state.studCenters}" centers, ${format(diag.notches[0].top - diag.notches[0].bottom)} along the stud, ${format(state.studWidth ?? 0)} deep` }] : []),
			]
		: [];
	const kneeRows: ResultRow[] = knee
		? [
				{ label: "Brace angle", value: formatAngle(knee.angle, 2), strong: true, hint: `${format(knee.rise)} down the post, ${format(knee.run)} along the beam` },
				{ label: "Long point to long point", value: format(knee.longLength), strong: true, hint: "outer edge" },
				{ label: "Short point to short point", value: format(knee.shortLength), hint: `inner edge; ${format(knee.centreLength)} on the centre line` },
				{ label: "Post end", value: `${formatAngle(knee.postCutAngle, 2)} · ${format(knee.postCutLength)}`, hint: "plumb cut from square · length of the cut" },
				{ label: "Beam end", value: `${formatAngle(knee.beamCutAngle, 2)} · ${format(knee.beamCutLength)}`, hint: "level cut from square · length of the cut" },
				{ label: "Housing on the post", value: `${format(knee.postHousing.from)} to ${format(knee.postHousing.to)}`, hint: "down from the beam underside" },
				{ label: "Housing on the beam", value: `${format(knee.beamHousing.from)} to ${format(knee.beamHousing.to)}`, hint: "out from the post face" },
			]
		: [];

	// end templates in brace coordinates: x along the brace, y across, cut corner on the centre line at the origin
	const diagEnd = diag && state.ends === "corner" ? (() => {
		const t = (diag.angle * Math.PI) / 180;
		const L = Math.min(12, diag.longLength / 2);
		return {
			points: [{ x: L, y: b / 2 }, { x: (b / 2) * Math.tan(t), y: b / 2 }, { x: 0, y: 0 }, { x: b / 2 / Math.tan(t), y: -b / 2 }, { x: L, y: -b / 2 }],
			cuts: [
				{ a: { x: (b / 2) * Math.tan(t), y: b / 2 }, b: { x: 0, y: 0 }, label: `plumb ${format(diag.plumbCut)}` },
				{ a: { x: 0, y: 0 }, b: { x: b / 2 / Math.tan(t), y: -b / 2 }, label: `level ${format(diag.levelCut)}` },
			],
		};
	})() : null;
	const kneeEnds = knee ? (() => {
		const t = (knee.angle * Math.PI) / 180;
		const L = Math.min(12, knee.shortLength / 2);
		return {
			post: { points: [{ x: 0, y: b / 2 }, { x: L, y: b / 2 }, { x: L, y: -b / 2 }, { x: b * Math.tan(t), y: -b / 2 }], cuts: [{ a: { x: 0, y: b / 2 }, b: { x: b * Math.tan(t), y: -b / 2 }, label: `${formatAngle(knee.postCutAngle, 1)} · ${format(knee.postCutLength)}` }] },
			beam: { points: [{ x: 0, y: -b / 2 }, { x: L, y: -b / 2 }, { x: L, y: b / 2 }, { x: b / Math.tan(t), y: b / 2 }], cuts: [{ a: { x: 0, y: -b / 2 }, b: { x: b / Math.tan(t), y: b / 2 }, label: `${formatAngle(knee.beamCutAngle, 1)} · ${format(knee.beamCutLength)}` }] },
		};
	})() : null;

	return (
		<div className={styles.container}>
			<div className="flex flex-col gap-6">
				<UnitAndPrecisionBar />

				<div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
					<section className={styles.card} aria-labelledby="br-heading">
						<h2 id="br-heading" className={styles.cardTitle}>
							Bracing
						</h2>
						<SegmentedControl<Mode>
							label="Brace"
							size="sm"
							value={state.mode}
							onChange={set("mode")}
							options={[
								{ value: "diagonal", label: "Diagonal brace" },
								{ value: "knee", label: "Knee brace" },
							]}
						/>
						<p className={`${styles.note} mt-3`}>{state.mode === "diagonal" ? "A brace corner to corner across a frame, cut into the corners with a plumb and a level cut or square-ended, let into the studs or fixed on the face." : "A short brace between a post and the beam it carries, housed into both."}</p>
						<div className="flex flex-col gap-4">
							{state.mode === "diagonal" ? (
								<>
									<div className="grid grid-cols-2 gap-3">
										<DimensionInput id="br-width" label="Frame width" value={state.frameWidth} onChange={set("frameWidth")} hint="Inside the members" />
										<DimensionInput id="br-height" label="Frame height" value={state.frameHeight} onChange={set("frameHeight")} hint="Inside the members" />
									</div>
									<div className="grid grid-cols-2 gap-3">
										<DimensionInput id="br-brace" label="Brace width" value={state.braceWidth} onChange={set("braceWidth")} />
										<DimensionInput id="br-member" label="Frame member width" value={state.memberWidth} onChange={set("memberWidth")} hint="Drawing only" />
									</div>
									<div className="flex flex-col gap-1">
										<span className={styles.label}>Ends</span>
										<SegmentedControl<"corner" | "square">
											label="Ends"
											size="sm"
											fill={false}
											value={state.ends}
											onChange={set("ends")}
											options={[
												{ value: "corner", label: "Cut to the corner" },
												{ value: "square", label: "Square to the brace" },
											]}
										/>
									</div>
									<div className="flex flex-wrap items-end gap-x-6 gap-y-3">
										<label className={styles.check}>
											<input type="checkbox" checked={state.letIn} onChange={(e) => set("letIn")(e.target.checked)} />
											Let into the studs
										</label>
										{state.letIn && (
											<>
												<div className="flex flex-col gap-1">
													<span className={styles.label}>Stud centers</span>
													<SegmentedControl<string> label="Stud centers" size="sm" fill={false} value={`${state.studCenters}`} onChange={(v) => set("studCenters")(Number(v))} options={[12, 16, 19.2, 24].map((c) => ({ value: `${c}`, label: `${c}"` }))} />
												</div>
												<DimensionInput id="br-stud" label="Notch depth" value={state.studWidth} onChange={set("studWidth")} hint="Brace thickness" className="w-32" />
											</>
										)}
									</div>
								</>
							) : (
								<>
									<div className="flex flex-wrap items-end gap-x-6 gap-y-3">
										<div className="flex flex-col gap-1">
											<span className={styles.label}>Brace by</span>
											<SegmentedControl<"angle" | "rise-run">
												label="Brace by"
												size="sm"
												fill={false}
												value={state.by}
												onChange={(v) => setState((s) => ({ ...s, by: v, ...(knee && v === "rise-run" ? { rise: Number(knee.rise.toFixed(4)) } : {}), ...(knee && v === "angle" ? { angle: Number(knee.angle.toFixed(2)) } : {}) }))}
												options={[
													{ value: "angle", label: "Angle and run" },
													{ value: "rise-run", label: "Rise and run" },
												]}
											/>
										</div>
										{state.by === "angle" ? <NumberField id="br-angle" label="Angle" value={state.angle} onChange={set("angle")} unit="°" min={1} max={89} step="any" hint="From the beam" className="w-28" /> : <DimensionInput id="br-rise" label="Rise" value={state.rise} onChange={set("rise")} hint="Down the post" className="w-32" />}
										<DimensionInput id="br-run" label="Run" value={state.run} onChange={set("run")} hint="Along the beam" className="w-32" />
									</div>
									<div className="grid grid-cols-3 gap-3">
										<DimensionInput id="br-brace" label="Brace width" value={state.braceWidth} onChange={set("braceWidth")} />
										<DimensionInput id="br-post" label="Post width" value={state.postWidth} onChange={set("postWidth")} />
										<DimensionInput id="br-beam" label="Beam depth" value={state.beamDepth} onChange={set("beamDepth")} />
									</div>
								</>
							)}
						</div>
					</section>

					<section className={styles.card} aria-labelledby="br-results">
						<h2 id="br-results" className={styles.cardTitle}>
							Lengths and cuts
						</h2>
						{diag || knee ? <ResultList rows={diag ? diagRows : kneeRows} /> : <p className={styles.empty}>The brace must fit between its members; check the sizes.</p>}
						{(diag ?? knee)?.warnings.map((w) => (
							<p key={w} className={styles.warn}>
								{w}
							</p>
						))}
					</section>
				</div>

				{diag && state.frameWidth !== null && state.frameHeight !== null && state.braceWidth !== null && state.memberWidth !== null && (
					<>
						<section className={styles.card} aria-labelledby="br-frame">
							<h2 id="br-frame" className={styles.cardTitle}>
								Frame
							</h2>
							<PrintDiagrams title="Diagonal brace" subtitle={`${format(state.frameWidth)} × ${format(state.frameHeight)} frame, ${formatAngle(diag.angle, 1)} brace, drawn to fit`}>
								<FrameDiagram brace={diag} frameWidth={state.frameWidth} frameHeight={state.frameHeight} braceWidth={state.braceWidth} memberWidth={state.memberWidth} ends={state.ends} format={format} />
							</PrintDiagrams>
						</section>
						<div className="grid gap-4 lg:grid-cols-2">
							{diagEnd && (
								<section className={styles.card} aria-labelledby="br-end">
									<h2 id="br-end" className={styles.cardTitle}>
										End cut template
									</h2>
									<p className={styles.note}>Both ends are the same, turned over. The corner point sits on the brace centre line.</p>
									<PrintDiagrams title="Brace end" subtitle={`plumb ${formatAngle(diag.plumbCutAngle, 1)}, level ${formatAngle(diag.levelCutAngle, 1)} from square`}>
										<BraceEndTemplate points={diagEnd.points} cuts={diagEnd.cuts} title="Diagonal brace end cut template" format={format} />
									</PrintDiagrams>
								</section>
							)}
							{diag.notches.length > 0 && <RunningList title="Notch bottoms up each stud, from the plate" positions={diag.notches.map((n) => n.bottom)} labelFor={(i) => `stud at ${format(diag.notches[i].x)}`} />}
						</div>
					</>
				)}
				{knee && kneeEnds && state.braceWidth !== null && state.postWidth !== null && state.beamDepth !== null && (
					<>
						<section className={styles.card} aria-labelledby="br-knee">
							<h2 id="br-knee" className={styles.cardTitle}>
								Post and beam
							</h2>
							<PrintDiagrams title="Knee brace" subtitle={`${formatAngle(knee.angle, 1)}, ${format(knee.rise)} × ${format(knee.run)}, drawn to fit`}>
								<KneeDiagram brace={knee} braceWidth={state.braceWidth} postWidth={state.postWidth} beamDepth={state.beamDepth} format={format} />
							</PrintDiagrams>
						</section>
						<div className="grid gap-4 lg:grid-cols-2">
							<section className={styles.card} aria-labelledby="br-post-end">
								<h2 id="br-post-end" className={styles.cardTitle}>
									Post end template
								</h2>
								<PrintDiagrams title="Knee brace post end" subtitle={`${formatAngle(knee.postCutAngle, 1)} from square`}>
									<BraceEndTemplate points={kneeEnds.post.points} cuts={kneeEnds.post.cuts} title="Knee brace post end template" format={format} />
								</PrintDiagrams>
							</section>
							<section className={styles.card} aria-labelledby="br-beam-end">
								<h2 id="br-beam-end" className={styles.cardTitle}>
									Beam end template
								</h2>
								<PrintDiagrams title="Knee brace beam end" subtitle={`${formatAngle(knee.beamCutAngle, 1)} from square`}>
									<BraceEndTemplate points={kneeEnds.beam.points} cuts={kneeEnds.beam.cuts} title="Knee brace beam end template" format={format} />
								</PrintDiagrams>
							</section>
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
