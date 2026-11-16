"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import SegmentedControl from "@/components/SegmentedControl";
import { UnitAndPrecisionBar, DimensionInput, NumberField, ResultList, RunningList, PrintDiagrams, LumberTable, ShareCalculation, ConstructionNotes } from "@/components/construction";
import type { ResultRow } from "@/components/construction";
import { useConstructionUnits } from "@/hooks/useConstructionUnits";
import { nominalToActual, formatArea } from "@/lib/construction/imperialUtils";
import { STUD_CENTERS } from "@/lib/construction/framingUtils";
import { gableRoof } from "@/lib/construction/rafterUtils";
import { angleToPitch, formatAngle, formatPitch, pitchToAngle } from "@/lib/construction/pitchUtils";
import type { MarkReference } from "@/lib/construction/spacingUtils";
import { SectionDiagram, PlanDiagram } from "./GableRoofDiagrams";
import styles from "./GableRoof.module.scss";

type SlopeBy = "pitch" | "angle";
type Section = "2x6" | "2x8" | "2x10" | "2x12" | "custom";

interface RoofState {
	buildingWidth: number | null;
	buildingLength: number | null;
	slopeBy: SlopeBy;
	pitch: number;
	angle: number;
	overhang: number | null;
	overhangBy: "level" | "rafter";
	rakeOverhang: number | null;
	section: Section;
	depth: number | null;
	thickness: number | null;
	ridgeThickness: number | null;
	birdsmouthBy: "seat" | "plumb";
	birdsmouth: number | null;
	wallThickness: number | null;
	wallHeight: number | null;
	centers: number;
	sheetWidth: number | null;
	sheetLength: number | null;
	costPer1000Bft: number;
	reference: MarkReference;
}

const DEFAULTS: RoofState = {
	buildingWidth: 288,
	buildingLength: 480,
	slopeBy: "pitch",
	pitch: 6,
	angle: 26.57,
	overhang: 24,
	overhangBy: "level",
	rakeOverhang: 12,
	section: "2x8",
	depth: 7.25,
	thickness: 1.5,
	ridgeThickness: 1.5,
	birdsmouthBy: "seat",
	birdsmouth: 3.5,
	wallThickness: 3.5,
	wallHeight: 96,
	centers: 16,
	sheetWidth: 48,
	sheetLength: 96,
	costPer1000Bft: 800,
	reference: "near",
};

const SECTIONS: { value: Section; label: string }[] = [
	{ value: "2x6", label: "2x6" },
	{ value: "2x8", label: "2x8" },
	{ value: "2x10", label: "2x10" },
	{ value: "2x12", label: "2x12" },
	{ value: "custom", label: "Custom" },
];
const CENTER_OPTIONS = STUD_CENTERS.map((c) => ({ value: `${c}`, label: `${c}"` }));

const num = (v: unknown, lo: number, hi: number, fallback: number | null): number | null => (typeof v === "number" && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : fallback);
const oneOf = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T => (allowed.includes(v as T) ? (v as T) : fallback);

function sanitize(s: Partial<RoofState>): RoofState {
	return {
		buildingWidth: num(s.buildingWidth, 12, 1e4, DEFAULTS.buildingWidth),
		buildingLength: num(s.buildingLength, 12, 1e4, DEFAULTS.buildingLength),
		slopeBy: oneOf(s.slopeBy, ["pitch", "angle"] as const, DEFAULTS.slopeBy),
		pitch: num(s.pitch, 0.1, 100, DEFAULTS.pitch) ?? DEFAULTS.pitch,
		angle: num(s.angle, 0.1, 89.9, DEFAULTS.angle) ?? DEFAULTS.angle,
		overhang: num(s.overhang, 0, 1e3, DEFAULTS.overhang),
		overhangBy: oneOf(s.overhangBy, ["level", "rafter"] as const, DEFAULTS.overhangBy),
		rakeOverhang: num(s.rakeOverhang, 0, 1e3, DEFAULTS.rakeOverhang),
		section: oneOf(s.section, ["2x6", "2x8", "2x10", "2x12", "custom"] as const, DEFAULTS.section),
		depth: num(s.depth, 0.1, 100, DEFAULTS.depth),
		thickness: num(s.thickness, 0.1, 100, DEFAULTS.thickness),
		ridgeThickness: num(s.ridgeThickness, 0, 100, DEFAULTS.ridgeThickness),
		birdsmouthBy: oneOf(s.birdsmouthBy, ["seat", "plumb"] as const, DEFAULTS.birdsmouthBy),
		birdsmouth: num(s.birdsmouth, 0, 100, DEFAULTS.birdsmouth),
		wallThickness: num(s.wallThickness, 0.1, 100, DEFAULTS.wallThickness),
		wallHeight: num(s.wallHeight, 1, 1000, DEFAULTS.wallHeight),
		centers: STUD_CENTERS.includes(s.centers as 16) ? (s.centers as number) : DEFAULTS.centers,
		sheetWidth: num(s.sheetWidth, 1, 1000, DEFAULTS.sheetWidth),
		sheetLength: num(s.sheetLength, 1, 1000, DEFAULTS.sheetLength),
		costPer1000Bft: num(s.costPer1000Bft, 0, 1e6, DEFAULTS.costPer1000Bft) ?? DEFAULTS.costPer1000Bft,
		reference: oneOf(s.reference, ["near", "center", "far"] as const, DEFAULTS.reference),
	};
}

export default function GableRoof() {
	const { format, mode } = useConstructionUnits();
	const [state, setState] = useState<RoofState>(DEFAULTS);
	const set = <K extends keyof RoofState>(key: K) => (value: RoofState[K]) => setState((s) => ({ ...s, [key]: value }));
	const angle = state.slopeBy === "pitch" ? pitchToAngle(state.pitch) : state.angle;
	const pickSection = (sec: Section) => {
		const size = sec === "custom" ? null : nominalToActual(sec);
		setState((s) => ({ ...s, section: sec, ...(size ? { depth: size.depth, thickness: size.width } : {}) }));
	};

	const roof = useMemo(() => {
		const s = state;
		if (s.buildingWidth === null || s.buildingLength === null || s.overhang === null || s.rakeOverhang === null || s.depth === null || s.thickness === null || s.ridgeThickness === null || s.birdsmouth === null || s.wallThickness === null || s.wallHeight === null || s.sheetWidth === null || s.sheetLength === null) return null;
		return gableRoof({
			buildingWidth: s.buildingWidth,
			buildingLength: s.buildingLength,
			angle,
			overhang: s.overhang,
			overhangBy: s.overhangBy,
			rakeOverhang: s.rakeOverhang,
			depth: s.depth,
			thickness: s.thickness,
			ridgeThickness: s.ridgeThickness,
			birdsmouth: s.birdsmouth,
			birdsmouthBy: s.birdsmouthBy,
			wallThickness: s.wallThickness,
			wallHeight: s.wallHeight,
			centers: s.centers,
			sheetWidth: s.sheetWidth,
			sheetLength: s.sheetLength,
			costPer1000Bft: s.costPer1000Bft,
		});
	}, [state, angle]);

	const r = roof?.rafter;
	const rafterRows: ResultRow[] =
		roof && r
			? [
					{ label: "Roof angle", value: formatAngle(r.angle, 2), hint: `${formatPitch(r.pitch)} pitch`, strong: true },
					{ label: "Run", value: format(roof.run), hint: "half the building width, to the ridge centre" },
					{ label: "Rise", value: format(r.rise) },
					{ label: "Ridge shortening", value: format(roof.ridgeShortening), hint: "taken off each rafter at the ridge, along the rafter" },
					{ label: "Line length", value: format(roof.lineLengthCut), strong: true, hint: "ridge cut to the outer wall plumb line, shortened for the ridge" },
					{ label: "Tail length", value: format(r.tailLength), hint: `${format(roof.overhang)} level overhang` },
					{ label: "Overall length", value: format(roof.overallLengthCut), strong: true, hint: "long point to long point, shortened for the ridge" },
					{ label: "Plumb cut", value: `${formatAngle(r.plumbCutAngle, 2)} · ${format(r.plumbDepth)}`, hint: "saw miter from square · length of the cut" },
					{ label: "Seat cut", value: `${formatAngle(r.seatCutAngle, 2)} · ${format(r.seat)}` },
					{ label: "Height above plate", value: format(r.hap) },
					{ label: "Ridge top above plate", value: format(roof.ridgeTopAbovePlate), hint: `ridge board at least ${format(roof.ridgeDepthNeeded)} deep to carry the full plumb cut` },
					{ label: "Stock length", value: format(roof.stockLength), hint: "each rafter cut from this, to the next 2 ft" },
				]
			: [];
	const roofRows: ResultRow[] = roof
		? [
				{ label: "Rafters", value: `${roof.totalRafters}`, strong: true, hint: `${roof.raftersPerSide} a side at ${state.centers}" centers, including both end rafters` },
				{ label: "Ridge length", value: format(roof.ridgeLength), hint: state.rakeOverhang ? `building length plus ${format(state.rakeOverhang)} rake overhang each end` : "building length" },
				{ label: "Fascia", value: format(roof.fasciaLength), hint: "both eaves" },
				{ label: "Slope length", value: format(roof.slopeLength), hint: "eave to ridge along the roof, per side" },
				{ label: "Roof area", value: formatArea(roof.roofArea, mode), strong: true, hint: `${formatArea(roof.areaPerSide, mode)} per side` },
				{ label: "Sheathing sheets", value: `${roof.totalSheets}`, hint: `${roof.sheetsPerSide} per side, ${format(state.sheetWidth ?? 0)} × ${format(state.sheetLength ?? 0)} sheets, no waste allowance` },
				{ label: "Rafter lumber", value: `${roof.rafterBoardFeet.toFixed(1)} bft`, hint: `${roof.totalRafters} × ${format(roof.stockLength)} ${state.section === "custom" ? "" : state.section}` },
				{ label: "Rafter cost", value: `$${roof.rafterCost.toFixed(2)}`, hint: `at $${state.costPer1000Bft} per 1000 bft` },
			]
		: [];

	const positions = roof ? roof.rafters.map((s) => (state.reference === "near" ? s.near : state.reference === "far" ? s.far : s.center)) : [];

	return (
		<div className={styles.container}>
			<div className="flex flex-col gap-6">
				<UnitAndPrecisionBar />

				<div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
					<section className={styles.card} aria-labelledby="gr-heading">
						<h2 id="gr-heading" className={styles.cardTitle}>
							Gable roof
						</h2>
						<p className={styles.note}>
							A plain gable with common rafters each side of a ridge board. Cutting templates for the birdsmouth and plumb cuts are in the <Link href="/tools/rafter-calculator">common rafter calculator</Link>.
						</p>
						<div className="flex flex-col gap-4">
							<div className="grid grid-cols-2 gap-3">
								<DimensionInput id="gr-width" label="Building width" value={state.buildingWidth} onChange={set("buildingWidth")} hint="Outside of wall to outside of wall" />
								<DimensionInput id="gr-length" label="Building length" value={state.buildingLength} onChange={set("buildingLength")} hint="Along the ridge" />
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
									<NumberField id="gr-pitch" label="Pitch" value={state.pitch} onChange={set("pitch")} unit=":12" step="any" className="w-36" />
								) : (
									<NumberField id="gr-angle" label="Angle" value={state.angle} onChange={set("angle")} unit="°" min={0.1} max={89.9} step="any" className="w-36" />
								)}
							</div>
							<div className="flex flex-wrap items-end gap-x-6 gap-y-3">
								<div className="flex flex-col gap-1">
									<span className={styles.label}>Overhang measured</span>
									<SegmentedControl<"level" | "rafter">
										label="Overhang measured"
										size="sm"
										fill={false}
										value={state.overhangBy}
										onChange={(v) => setState((s) => ({ ...s, overhangBy: v, overhang: roof ? Number((v === "level" ? roof.overhang : roof.rafter.tailLength).toFixed(4)) : s.overhang }))}
										options={[
											{ value: "level", label: "Level" },
											{ value: "rafter", label: "Along rafter" },
										]}
									/>
								</div>
								<DimensionInput id="gr-overhang" label="Eave overhang" value={state.overhang} onChange={set("overhang")} className="w-44" />
							</div>
							<DimensionInput id="gr-rake" label="Rake overhang" value={state.rakeOverhang} onChange={set("rakeOverhang")} hint="Ridge and fascia past each gable end wall; 0 for none" />
							<div className="flex flex-col gap-1">
								<span className={styles.label}>Rafter</span>
								<SegmentedControl<Section> label="Rafter size" size="sm" value={state.section} onChange={pickSection} options={SECTIONS} />
							</div>
							<div className="grid grid-cols-3 gap-3">
								<DimensionInput id="gr-depth" label="Depth" value={state.depth} onChange={(v) => setState((s) => ({ ...s, depth: v, section: "custom" }))} hint="Actual" />
								<DimensionInput id="gr-thick" label="Thickness" value={state.thickness} onChange={(v) => setState((s) => ({ ...s, thickness: v, section: "custom" }))} hint="Actual" />
								<DimensionInput id="gr-ridge" label="Ridge thickness" value={state.ridgeThickness} onChange={set("ridgeThickness")} />
							</div>
							<div className="flex flex-col gap-1">
								<span className={styles.label}>Rafter centers</span>
								<SegmentedControl<string> label="Rafter centers" size="sm" value={`${state.centers}`} onChange={(v) => set("centers")(Number(v))} options={CENTER_OPTIONS} />
							</div>
							<div className="flex flex-wrap items-end gap-x-6 gap-y-3">
								<div className="flex flex-col gap-1">
									<span className={styles.label}>Birdsmouth by</span>
									<SegmentedControl<"seat" | "plumb">
										label="Birdsmouth by"
										size="sm"
										fill={false}
										value={state.birdsmouthBy}
										onChange={(v) => setState((s) => ({ ...s, birdsmouthBy: v, birdsmouth: r ? (v === "seat" ? r.seat : r.heel) : s.birdsmouth }))}
										options={[
											{ value: "seat", label: "Seat" },
											{ value: "plumb", label: "Plumb" },
										]}
									/>
								</div>
								<DimensionInput id="gr-birdsmouth" label={state.birdsmouthBy === "seat" ? "Seat" : "Plumb (heel)"} value={state.birdsmouth} onChange={set("birdsmouth")} className="w-44" />
							</div>
							<div className="grid grid-cols-2 gap-3">
								<DimensionInput id="gr-wall-t" label="Wall thickness" value={state.wallThickness} onChange={set("wallThickness")} />
								<DimensionInput id="gr-wall-h" label="Wall height" value={state.wallHeight} onChange={set("wallHeight")} hint="Drawing only" />
							</div>
							<div className="grid grid-cols-3 gap-3">
								<DimensionInput id="gr-sheet-w" label="Sheet width" value={state.sheetWidth} onChange={set("sheetWidth")} hint="Across the slope" />
								<DimensionInput id="gr-sheet-l" label="Sheet length" value={state.sheetLength} onChange={set("sheetLength")} hint="Along the ridge" />
								<NumberField id="gr-cost" label="Price per 1000 bft" value={state.costPer1000Bft} onChange={set("costPer1000Bft")} prefix="$" step="any" />
							</div>
						</div>
					</section>

					<div className="flex flex-col gap-4">
						<section className={styles.card} aria-labelledby="gr-rafter-results">
							<h2 id="gr-rafter-results" className={styles.cardTitle}>
								Common rafter
							</h2>
							{roof ? <ResultList rows={rafterRows} /> : <p className={styles.empty}>Enter the building size, a slope under 90° and the rafter size.</p>}
							{roof?.warnings.map((w) => (
								<p key={w} className={styles.warn}>
									{w}
								</p>
							))}
						</section>
						<section className={styles.card} aria-labelledby="gr-roof-results">
							<h2 id="gr-roof-results" className={styles.cardTitle}>
								Whole roof
							</h2>
							{roof ? <ResultList rows={roofRows} /> : <p className={styles.empty}>Counts and areas appear with the rafter.</p>}
						</section>
					</div>
				</div>

				{roof && state.buildingWidth !== null && state.buildingLength !== null && state.wallThickness !== null && state.wallHeight !== null && state.ridgeThickness !== null && state.rakeOverhang !== null && state.thickness !== null && (
					<>
						<section className={styles.card} aria-labelledby="gr-section">
							<h2 id="gr-section" className={styles.cardTitle}>
								Cross section
							</h2>
							<PrintDiagrams title="Gable roof section" subtitle={`${format(state.buildingWidth)} wide, ${formatPitch(roof.rafter.pitch)} (${formatAngle(roof.rafter.angle, 2)}), ${format(roof.overhang)} overhang, drawn to fit`}>
								<SectionDiagram roof={roof} buildingWidth={state.buildingWidth} wallThickness={state.wallThickness} wallHeight={state.wallHeight} ridgeThickness={state.ridgeThickness} format={format} />
							</PrintDiagrams>
						</section>
						<section className={styles.card} aria-labelledby="gr-plan">
							<h2 id="gr-plan" className={styles.cardTitle}>
								Rafter plan
							</h2>
							<PrintDiagrams title="Rafter layout" subtitle={`${roof.raftersPerSide} rafters a side at ${state.centers}" centers over ${format(state.buildingLength)}, drawn to fit`}>
								<PlanDiagram roof={roof} buildingWidth={state.buildingWidth} buildingLength={state.buildingLength} rakeOverhang={state.rakeOverhang} thickness={state.thickness} format={format} />
							</PrintDiagrams>
						</section>
						<RunningList title="Rafter positions along the plate" positions={positions} reference={state.reference} onReferenceChange={set("reference")} labelFor={(i) => (roof.rafters[i].kind === "common" ? "" : "end")} />
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
