"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import SegmentedControl from "@/components/SegmentedControl";
import { UnitAndPrecisionBar, DimensionInput, NumberField, ResultList, RunningList, PrintDiagrams, LumberTable, ShareCalculation, ConstructionNotes, RoofSectionDiagram } from "@/components/construction";
import type { ResultRow, RafterPiece } from "@/components/construction";
import { useConstructionUnits } from "@/hooks/useConstructionUnits";
import { nominalToActual, formatArea } from "@/lib/construction/imperialUtils";
import { STUD_CENTERS } from "@/lib/construction/framingUtils";
import { hipRoof } from "@/lib/construction/hipRoofUtils";
import { angleToPitch, formatAngle, formatPitch, pitchToAngle } from "@/lib/construction/pitchUtils";
import { CutTemplate } from "@/features/rafter-calculator/RafterDiagrams";
import { HipPlanDiagram, HipSectionDiagram, CheekTemplate } from "./HipDiagrams";
import styles from "./HipRoof.module.scss";

type SlopeBy = "pitch" | "angle";
type Section = "2x6" | "2x8" | "2x10" | "2x12" | "custom";

interface HipState {
	buildingWidth: number | null;
	buildingLength: number | null;
	slopeBy: SlopeBy;
	pitch: number;
	angle: number;
	overhang: number | null;
	commonSection: Section;
	commonDepth: number | null;
	commonThickness: number | null;
	hipSection: Section;
	hipDepth: number | null;
	hipThickness: number | null;
	ridgeThickness: number | null;
	seat: number | null;
	wallThickness: number | null;
	wallHeight: number | null;
	centers: number;
	hipTop: "drop" | "back";
	sheetWidth: number | null;
	sheetLength: number | null;
	costPer1000Bft: number;
}

const DEFAULTS: HipState = {
	buildingWidth: 288,
	buildingLength: 480,
	slopeBy: "pitch",
	pitch: 8,
	angle: 33.69,
	overhang: 18,
	commonSection: "2x8",
	commonDepth: 7.25,
	commonThickness: 1.5,
	hipSection: "2x10",
	hipDepth: 9.25,
	hipThickness: 1.5,
	ridgeThickness: 1.5,
	seat: 3.5,
	wallThickness: 3.5,
	wallHeight: 96,
	centers: 16,
	hipTop: "drop",
	sheetWidth: 48,
	sheetLength: 96,
	costPer1000Bft: 800,
};

const SECTIONS: { value: Section; label: string }[] = [
	{ value: "2x6", label: "2x6" },
	{ value: "2x8", label: "2x8" },
	{ value: "2x10", label: "2x10" },
	{ value: "2x12", label: "2x12" },
	{ value: "custom", label: "Custom" },
];
const SECTION_VALUES = SECTIONS.map((s) => s.value);
const CENTER_OPTIONS = STUD_CENTERS.map((c) => ({ value: `${c}`, label: `${c}"` }));

const num = (v: unknown, lo: number, hi: number, fallback: number | null): number | null => (typeof v === "number" && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : fallback);
const oneOf = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T => (allowed.includes(v as T) ? (v as T) : fallback);

function sanitize(s: Partial<HipState>): HipState {
	return {
		buildingWidth: num(s.buildingWidth, 12, 1e4, DEFAULTS.buildingWidth),
		buildingLength: num(s.buildingLength, 12, 1e4, DEFAULTS.buildingLength),
		slopeBy: oneOf(s.slopeBy, ["pitch", "angle"] as const, DEFAULTS.slopeBy),
		pitch: num(s.pitch, 0.1, 100, DEFAULTS.pitch) ?? DEFAULTS.pitch,
		angle: num(s.angle, 0.1, 89.9, DEFAULTS.angle) ?? DEFAULTS.angle,
		overhang: num(s.overhang, 0, 1e3, DEFAULTS.overhang),
		commonSection: oneOf(s.commonSection, SECTION_VALUES, DEFAULTS.commonSection),
		commonDepth: num(s.commonDepth, 0.1, 100, DEFAULTS.commonDepth),
		commonThickness: num(s.commonThickness, 0.1, 100, DEFAULTS.commonThickness),
		hipSection: oneOf(s.hipSection, SECTION_VALUES, DEFAULTS.hipSection),
		hipDepth: num(s.hipDepth, 0.1, 100, DEFAULTS.hipDepth),
		hipThickness: num(s.hipThickness, 0.1, 100, DEFAULTS.hipThickness),
		ridgeThickness: num(s.ridgeThickness, 0, 100, DEFAULTS.ridgeThickness),
		seat: num(s.seat, 0, 100, DEFAULTS.seat),
		wallThickness: num(s.wallThickness, 0.1, 100, DEFAULTS.wallThickness),
		wallHeight: num(s.wallHeight, 1, 1000, DEFAULTS.wallHeight),
		centers: STUD_CENTERS.includes(s.centers as 16) ? (s.centers as number) : DEFAULTS.centers,
		hipTop: oneOf(s.hipTop, ["drop", "back"] as const, DEFAULTS.hipTop),
		sheetWidth: num(s.sheetWidth, 1, 1000, DEFAULTS.sheetWidth),
		sheetLength: num(s.sheetLength, 1, 1000, DEFAULTS.sheetLength),
		costPer1000Bft: num(s.costPer1000Bft, 0, 1e6, DEFAULTS.costPer1000Bft) ?? DEFAULTS.costPer1000Bft,
	};
}

export default function HipRoof() {
	const { format, mode } = useConstructionUnits();
	const [state, setState] = useState<HipState>(DEFAULTS);
	const set = <K extends keyof HipState>(key: K) => (value: HipState[K]) => setState((s) => ({ ...s, [key]: value }));
	const angle = state.slopeBy === "pitch" ? pitchToAngle(state.pitch) : state.angle;
	const pickCommon = (sec: Section) => {
		const size = sec === "custom" ? null : nominalToActual(sec);
		setState((s) => ({ ...s, commonSection: sec, ...(size ? { commonDepth: size.depth, commonThickness: size.width } : {}) }));
	};
	const pickHip = (sec: Section) => {
		const size = sec === "custom" ? null : nominalToActual(sec);
		setState((s) => ({ ...s, hipSection: sec, ...(size ? { hipDepth: size.depth, hipThickness: size.width } : {}) }));
	};

	const roof = useMemo(() => {
		const s = state;
		if (s.buildingWidth === null || s.buildingLength === null || s.overhang === null || s.commonDepth === null || s.commonThickness === null || s.hipDepth === null || s.hipThickness === null || s.ridgeThickness === null || s.seat === null || s.wallThickness === null || s.wallHeight === null || s.sheetWidth === null || s.sheetLength === null) return null;
		const [w, l] = s.buildingWidth <= s.buildingLength ? [s.buildingWidth, s.buildingLength] : [s.buildingLength, s.buildingWidth];
		return hipRoof({ buildingWidth: w, buildingLength: l, angle, overhang: s.overhang, commonDepth: s.commonDepth, commonThickness: s.commonThickness, hipDepth: s.hipDepth, hipThickness: s.hipThickness, ridgeThickness: s.ridgeThickness, seat: s.seat, wallThickness: s.wallThickness, wallHeight: s.wallHeight, centers: s.centers, sheetWidth: s.sheetWidth, sheetLength: s.sheetLength, costPer1000Bft: s.costPer1000Bft });
	}, [state, angle]);
	const widthIn = state.buildingWidth !== null && state.buildingLength !== null ? Math.min(state.buildingWidth, state.buildingLength) : null;
	const lengthIn = state.buildingWidth !== null && state.buildingLength !== null ? Math.max(state.buildingWidth, state.buildingLength) : null;

	const commonRows: ResultRow[] = roof
		? [
				{ label: "Roof angle", value: formatAngle(roof.common.angle, 2), hint: `${formatPitch(roof.common.pitch)} pitch`, strong: true },
				{ label: "Run", value: format(roof.run), hint: "half the width, to the ridge centre" },
				{ label: "Rise", value: format(roof.rise) },
				{ label: "Common line length", value: format(roof.commonLengthCut), strong: true, hint: `${format(roof.common.lineLength)} to the ridge centre less ${format(roof.commonShortening)} for the ridge` },
				{ label: "Common overall", value: format(roof.common.overallLength - roof.commonShortening), strong: true, hint: `tail ${format(roof.common.tailLength)} for ${format(state.overhang ?? 0)} overhang` },
				{ label: "Common plumb cut", value: `${formatAngle(roof.common.plumbCutAngle, 2)} · ${format(roof.common.plumbDepth)}`, hint: `seat ${formatAngle(roof.common.seatCutAngle, 2)}, heel ${format(roof.common.heel)}, HAP ${format(roof.common.hap)}` },
				{ label: "Ridge", value: format(roof.ridgeLength), hint: `hip centre to hip centre; board ${format(roof.ridgeBoardLength)} (plus one common thickness), top ${format(roof.ridgeTopAbovePlate)} above the plate` },
			]
		: [];
	const hipRows: ResultRow[] = roof
		? [
				{ label: "Hip angle", value: formatAngle(roof.hipAngle, 2), hint: `${formatPitch(roof.hipPitchPer17)} per 17 (16.97) of run`, strong: true },
				{ label: "Hip run", value: format(roof.hipRun), hint: "in plan, corner to the ridge centre" },
				{ label: "Hip line length", value: format(roof.hipLengthCut), strong: true, hint: `${format(roof.hip.lineLength)} to the ridge centre less ${format(roof.hipShortening)} (${format(roof.hipShorteningLevel)} level)` },
				{ label: "Hip overall", value: format(roof.hipOverallCut), strong: true, hint: `tail ${format(roof.hip.tailLength)}` },
				{ label: "Hip plumb cut", value: `${formatAngle(roof.hip.plumbCutAngle, 2)} · ${format(roof.hip.plumbDepth)}`, hint: `seat ${formatAngle(roof.hip.seatCutAngle, 2)} · ${format(roof.hip.seat)}, heel ${format(roof.hip.heel)}` },
				{ label: "Hip cheek cut", value: formatAngle(roof.hipCheekAngle, 2), hint: "from square on the top edge, both ways to a point at the ridge" },
				{ label: state.hipTop === "drop" ? "Hip drop" : "Backing bevel", value: state.hipTop === "drop" ? format(roof.hipDrop) : formatAngle(roof.backingAngle, 2), hint: state.hipTop === "drop" ? `deepen the seat so the edges meet the roof planes; HAP ${format(roof.hip.hap)} after the drop` : "saw bevel from the top face, each side of the centre line" },
				{ label: "Hip cap", value: format(roof.hipCapLength), hint: "all four hips, eave to ridge" },
			]
		: [];
	const jackRows: ResultRow[] = roof
		? [
				{ label: "Jack diminish", value: format(roof.jackDiminish), strong: true, hint: `each jack is this much longer than the last at ${state.centers}" centers` },
				{ label: "Jack cheek cut", value: formatAngle(roof.jackCheekAngle, 2), hint: "from square on the top edge; plumb cut same as the common" },
				{ label: "Jack shortening", value: format(roof.jackCheekLevelShortening / Math.cos((roof.common.angle * Math.PI) / 180)), hint: `half the hip's 45° thickness, ${format(roof.jackCheekLevelShortening)} level` },
				{ label: "Rafters", value: `${roof.totalCommons + roof.totalJacks + 4}`, hint: `${roof.totalCommons} commons, ${roof.totalJacks} jacks (${roof.jacks.length} per hip per face), 4 hips`, strong: true },
				{ label: "Roof area", value: formatArea(roof.roofArea, mode), hint: `sides ${formatArea(roof.sideFaceArea, mode)} each, ends ${formatArea(roof.endFaceArea, mode)} each` },
				{ label: "Sheathing", value: `${roof.totalSheets} sheets`, hint: `${roof.sheetsSideFace} per side face, ${roof.sheetsEndFace} per end face, no waste allowance` },
				{ label: "Lumber", value: `${roof.totalBoardFeet.toFixed(1)} bft`, hint: `$${roof.totalCost.toFixed(2)} at $${state.costPer1000Bft} per 1000 bft` },
			]
		: [];

	const hipPiece: RafterPiece | null = roof
		? (() => {
				const t = Math.tan((roof.hipAngle * Math.PI) / 180);
				const at = (run: number) => ({ x: run, y: -roof.hip.heel + run * t });
				return { a: at(-(state.overhang ?? 0) * Math.SQRT2), b: at(roof.hipRun), plumbDepth: roof.hip.plumbDepth };
			})()
		: null;

	return (
		<div className={styles.container}>
			<div className="flex flex-col gap-6">
				<UnitAndPrecisionBar />

				<div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
					<section className={styles.card} aria-labelledby="hr-heading">
						<h2 id="hr-heading" className={styles.cardTitle}>
							Hip roof
						</h2>
						<p className={styles.note}>
							Equal pitch all round, hips at 45° in plan. Birdsmouth and plumb cut templates for the commons are in the <Link href="/tools/rafter-calculator">common rafter calculator</Link>.
						</p>
						<div className="flex flex-col gap-4">
							<div className="grid grid-cols-2 gap-3">
								<DimensionInput id="hr-width" label="Building width" value={state.buildingWidth} onChange={set("buildingWidth")} hint="Outside of walls" />
								<DimensionInput id="hr-length" label="Building length" value={state.buildingLength} onChange={set("buildingLength")} hint="Outside of walls" />
							</div>
							<div className="flex flex-wrap items-end gap-x-6 gap-y-3">
								<div className="flex flex-col gap-1">
									<span className={styles.label}>Slope as</span>
									<SegmentedControl<SlopeBy>
										label="Slope as"
										size="sm"
										fill={false}
										value={state.slopeBy}
										onChange={(v) => setState((s) => ({ ...s, slopeBy: v, ...(v === "angle" ? { angle: Number(pitchToAngle(s.pitch).toFixed(2)) } : { pitch: Number(angleToPitch(s.angle).toFixed(3)) }) }))}
										options={[
											{ value: "pitch", label: "Pitch x:12" },
											{ value: "angle", label: "Angle" },
										]}
									/>
								</div>
								{state.slopeBy === "pitch" ? (
									<NumberField id="hr-pitch" label="Pitch" value={state.pitch} onChange={set("pitch")} unit=":12" step="any" className="w-36" />
								) : (
									<NumberField id="hr-angle" label="Angle" value={state.angle} onChange={set("angle")} unit="°" min={0.1} max={89.9} step="any" className="w-36" />
								)}
								<DimensionInput id="hr-overhang" label="Overhang" value={state.overhang} onChange={set("overhang")} hint="Level, all round" className="w-40" />
							</div>
							<div className="flex flex-col gap-1">
								<span className={styles.label}>Commons and jacks</span>
								<SegmentedControl<Section> label="Common rafter size" size="sm" value={state.commonSection} onChange={pickCommon} options={SECTIONS} />
							</div>
							<div className="grid grid-cols-3 gap-3">
								<DimensionInput id="hr-c-depth" label="Depth" value={state.commonDepth} onChange={(v) => setState((s) => ({ ...s, commonDepth: v, commonSection: "custom" }))} hint="Actual" />
								<DimensionInput id="hr-c-thick" label="Thickness" value={state.commonThickness} onChange={(v) => setState((s) => ({ ...s, commonThickness: v, commonSection: "custom" }))} hint="Actual" />
								<DimensionInput id="hr-seat" label="Birdsmouth seat" value={state.seat} onChange={set("seat")} />
							</div>
							<div className="flex flex-col gap-1">
								<span className={styles.label}>Hips</span>
								<SegmentedControl<Section> label="Hip rafter size" size="sm" value={state.hipSection} onChange={pickHip} options={SECTIONS} />
							</div>
							<div className="grid grid-cols-3 gap-3">
								<DimensionInput id="hr-h-depth" label="Hip depth" value={state.hipDepth} onChange={(v) => setState((s) => ({ ...s, hipDepth: v, hipSection: "custom" }))} hint="Actual" />
								<DimensionInput id="hr-h-thick" label="Hip thickness" value={state.hipThickness} onChange={(v) => setState((s) => ({ ...s, hipThickness: v, hipSection: "custom" }))} hint="Actual" />
								<DimensionInput id="hr-ridge" label="Ridge thickness" value={state.ridgeThickness} onChange={set("ridgeThickness")} />
							</div>
							<div className="flex flex-wrap items-end gap-x-6 gap-y-3">
								<div className="flex flex-col gap-1">
									<span className={styles.label}>Hip top edge</span>
									<SegmentedControl<"drop" | "back">
										label="Hip top edge"
										size="sm"
										fill={false}
										value={state.hipTop}
										onChange={set("hipTop")}
										options={[
											{ value: "drop", label: "Drop" },
											{ value: "back", label: "Back (bevel)" },
										]}
									/>
								</div>
								<div className="flex flex-col gap-1">
									<span className={styles.label}>Centers</span>
									<SegmentedControl<string> label="Rafter centers" size="sm" fill={false} value={`${state.centers}`} onChange={(v) => set("centers")(Number(v))} options={CENTER_OPTIONS} />
								</div>
							</div>
							<div className="grid grid-cols-2 gap-3">
								<DimensionInput id="hr-wall-t" label="Wall thickness" value={state.wallThickness} onChange={set("wallThickness")} />
								<DimensionInput id="hr-wall-h" label="Wall height" value={state.wallHeight} onChange={set("wallHeight")} hint="Drawing only" />
							</div>
							<div className="grid grid-cols-3 gap-3">
								<DimensionInput id="hr-sheet-w" label="Sheet width" value={state.sheetWidth} onChange={set("sheetWidth")} hint="Up the slope" />
								<DimensionInput id="hr-sheet-l" label="Sheet length" value={state.sheetLength} onChange={set("sheetLength")} hint="Along the eave" />
								<NumberField id="hr-cost" label="Price per 1000 bft" value={state.costPer1000Bft} onChange={set("costPer1000Bft")} prefix="$" step="any" />
							</div>
						</div>
					</section>

					<div className="flex flex-col gap-4">
						<section className={styles.card} aria-labelledby="hr-common">
							<h2 id="hr-common" className={styles.cardTitle}>
								Commons and ridge
							</h2>
							{roof ? <ResultList rows={commonRows} /> : <p className={styles.empty}>Enter the building size, a slope under 90° and the rafter sizes.</p>}
							{roof?.warnings.map((w) => (
								<p key={w} className={styles.warn}>
									{w}
								</p>
							))}
						</section>
						<section className={styles.card} aria-labelledby="hr-hip">
							<h2 id="hr-hip" className={styles.cardTitle}>
								Hip rafters
							</h2>
							{roof ? <ResultList rows={hipRows} /> : <p className={styles.empty}>Hip lengths appear with the commons.</p>}
						</section>
						<section className={styles.card} aria-labelledby="hr-jacks">
							<h2 id="hr-jacks" className={styles.cardTitle}>
								Jacks, counts and materials
							</h2>
							{roof ? <ResultList rows={jackRows} /> : <p className={styles.empty}>Jack lengths appear with the commons.</p>}
							{roof && roof.jacks.length > 0 && (
								<table className={`${styles.table} mt-4`}>
									<caption className="sr-only">Jack rafter lengths from the corner</caption>
									<thead>
										<tr>
											<th scope="col">#</th>
											<th scope="col">From corner</th>
											<th scope="col">To hip centre</th>
											<th scope="col">Cut length</th>
										</tr>
									</thead>
									<tbody>
										{roof.jacks.map((j) => (
											<tr key={j.index}>
												<td className="mono">{j.index}</td>
												<td className="mono">{format(j.run)}</td>
												<td className="mono">{format(j.length)}</td>
												<td className="mono">{format(j.lengthCut)}</td>
											</tr>
										))}
									</tbody>
								</table>
							)}
							{roof && <p className={styles.note}>Jack lengths are from the plumb line at the outer wall to the hip, long point of the cheek; add the common tail for the overhang. The same jacks occur on all four corners and both faces.</p>}
						</section>
					</div>
				</div>

				{roof && widthIn !== null && lengthIn !== null && state.overhang !== null && state.commonThickness !== null && state.hipDepth !== null && state.hipThickness !== null && state.wallThickness !== null && state.wallHeight !== null && hipPiece && (
					<>
						<section className={styles.card} aria-labelledby="hr-plan">
							<h2 id="hr-plan" className={styles.cardTitle}>
								Framing plan
							</h2>
							<PrintDiagrams title="Hip roof framing plan" subtitle={`${format(lengthIn)} × ${format(widthIn)}, ${formatPitch(roof.common.pitch)}, ${state.centers}" centers, drawn to fit`}>
								<HipPlanDiagram roof={roof} buildingWidth={widthIn} buildingLength={lengthIn} overhang={state.overhang} centers={state.centers} thickness={state.commonThickness} format={format} />
							</PrintDiagrams>
							<p className={styles.legend}>
								<span className={styles.common}>Commons</span>
								<span className={styles.jack}>Jacks</span>
								<span className={styles.hipKey}>Hips</span>
								<span>Jacks are numbered from the corner along the near wall.</span>
							</p>
						</section>
						<section className={styles.card} aria-labelledby="hr-elev">
							<h2 id="hr-elev" className={styles.cardTitle}>
								Hip rafter
							</h2>
							<PrintDiagrams title="Hip rafter" subtitle={`Run ${format(roof.hipRun)} at ${formatAngle(roof.hipAngle, 2)}, ${format(roof.hipOverallCut)} overall, drawn to fit`}>
								<RoofSectionDiagram
									label={`Hip rafter elevation: run ${format(roof.hipRun)}, rise ${format(roof.rise)}, ${formatAngle(roof.hipAngle, 2)}, line length ${format(roof.hipLengthCut)}`}
									rafters={[hipPiece]}
									walls={[{ x: 0, top: 0, thickness: state.wallThickness * Math.SQRT2, height: Math.min(state.wallHeight, 48) }]}
									centreLines={[{ x: roof.hipRun, from: 0, to: roof.ridgeTopAbovePlate + 4 }]}
									dims={[
										{ a: { x: 0, y: 0 }, b: { x: roof.hipRun, y: 0 }, label: `hip run ${format(roof.hipRun)}`, offset: 14 },
										{ a: { x: roof.hipRun, y: 0 }, b: { x: roof.hipRun, y: roof.rise }, label: `rise ${format(roof.rise)}`, offset: -10, extensions: false },
										{ a: { x: 0, y: roof.hip.hap }, b: { x: roof.hipRun, y: roof.hip.hap + roof.rise }, label: `line ${format(roof.hip.lineLength)}`, offset: -12, extensions: false },
										{ a: { x: hipPiece.a.x, y: hipPiece.a.y + roof.hip.plumbDepth }, b: { x: 0, y: roof.hip.hap }, label: `tail ${format(roof.hip.tailLength)}`, offset: -10, extensions: false },
									]}
									arcs={[{ c: { x: 0, y: 0 }, startDeg: -roof.hipAngle, endDeg: 0, label: formatAngle(roof.hipAngle, 1) }]}
								/>
							</PrintDiagrams>
						</section>
						<div className="grid gap-4 lg:grid-cols-2">
							<section className={styles.card} aria-labelledby="hr-section">
								<h2 id="hr-section" className={styles.cardTitle}>
									Drop or backing
								</h2>
								<p className={styles.note}>Square section through the hip. Dropping lowers the whole hip by deepening the seat so its top corners meet the roof planes; backing bevels the top edge instead and keeps the full height above plate.</p>
								<PrintDiagrams title="Hip drop and backing" subtitle={`Drop ${format(roof.hipDrop)} or bevel ${formatAngle(roof.backingAngle, 1)} each side, true size`}>
									<HipSectionDiagram roof={roof} hipDepth={state.hipDepth} hipThickness={state.hipThickness} format={format} />
								</PrintDiagrams>
							</section>
							<section className={styles.card} aria-labelledby="hr-plumb">
								<h2 id="hr-plumb" className={styles.cardTitle}>
									Hip plumb cut template
								</h2>
								<p className={styles.note}>Mark the plumb line at {formatAngle(roof.hip.plumbCutAngle, 2)} from square on the hip&apos;s face, then the cheek cuts from the top edge.</p>
								<PrintDiagrams title="Hip plumb cut" subtitle={`${formatAngle(roof.hip.plumbCutAngle, 2)} from square, ${format(roof.hip.plumbDepth)} long, true size`}>
									<CutTemplate rafter={roof.hip} depth={state.hipDepth} end="ridge" lengthIn={5} format={format} />
								</PrintDiagrams>
							</section>
							<section className={styles.card} aria-labelledby="hr-jack-cheek">
								<h2 id="hr-jack-cheek" className={styles.cardTitle}>
									Jack cheek cut template
								</h2>
								<p className={styles.note}>Top edge view. Lay a jack&apos;s top edge on the drawing with its long point at the square line and mark the cheek; the plumb cut below it is the common&apos;s.</p>
								<PrintDiagrams title="Jack cheek cut" subtitle={`${formatAngle(roof.jackCheekAngle, 2)} from square across ${format(state.commonThickness)}, true size`}>
									<CheekTemplate cheekAngle={roof.jackCheekAngle} thickness={state.commonThickness} title="Jack cheek cut template" format={format} />
								</PrintDiagrams>
							</section>
							<section className={styles.card} aria-labelledby="hr-hip-cheek">
								<h2 id="hr-hip-cheek" className={styles.cardTitle}>
									Hip cheek cut template
								</h2>
								<p className={styles.note}>The hip is cut both ways from the centre of its top edge to meet the ridge and the two king commons.</p>
								<PrintDiagrams title="Hip cheek cut" subtitle={`${formatAngle(roof.hipCheekAngle, 2)} from square across ${format(state.hipThickness)}, both ways, true size`}>
									<CheekTemplate cheekAngle={roof.hipCheekAngle} thickness={state.hipThickness} double title="Hip cheek cut template" format={format} />
								</PrintDiagrams>
							</section>
						</div>
						<RunningList title="Rafter positions along a long wall" positions={roof.sideRafterPositions} labelFor={(i) => (i < roof.jacks.length || i >= roof.jacks.length + roof.commonsPerSide ? "jack" : "common")} />
						<section className={styles.card} aria-labelledby="hr-lumber">
							<h2 id="hr-lumber" className={styles.cardTitle}>
								Lumber
							</h2>
							<table className={styles.table}>
								<caption className="sr-only">Rafter lumber</caption>
								<thead>
									<tr>
										<th scope="col">Item</th>
										<th scope="col">Pieces</th>
										<th scope="col">Stock length</th>
										<th scope="col">Board feet</th>
										<th scope="col">Cost</th>
									</tr>
								</thead>
								<tbody>
									{roof.lumber.map((l) => (
										<tr key={l.item}>
											<td>{l.item}</td>
											<td className="mono">{l.pieces}</td>
											<td className="mono">{format(l.length)}</td>
											<td className="mono">{l.boardFeet.toFixed(1)}</td>
											<td className="mono">${l.cost.toFixed(2)}</td>
										</tr>
									))}
								</tbody>
							</table>
							<p className={styles.note}>Jacks are paired long with short out of one stock length where they fit. Ridge, fascia, hip and ridge caps are reported as lengths above.</p>
						</section>
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
