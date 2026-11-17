"use client";

import { useMemo, useState } from "react";
import SegmentedControl from "@/components/SegmentedControl";
import { UnitAndPrecisionBar, DimensionInput, NumberField, ResultList, PrintDiagrams, ShareCalculation, ConstructionNotes } from "@/components/construction";
import type { ResultRow } from "@/components/construction";
import { useClipboard } from "@/hooks/useClipboard";
import { useConstructionUnits } from "@/hooks/useConstructionUnits";
import { formatArea } from "@/lib/construction/imperialUtils";
import { tank, dipChart, toUnit, TANK_UNITS, LB_PER_KG, type TankShape, type TankUnit, type EndStyle, type VerticalEnd } from "@/lib/construction/tankUtils";
import { TankSectionDiagram, DipChartDiagram } from "./TankDiagrams";
import styles from "./TankCalculator.module.scss";

interface TankState {
	shape: TankShape;
	diameter: number | null;
	length: number | null;
	width: number | null;
	height: number | null;
	wallThickness: number | null;
	ends: EndStyle;
	dishDepth: number | null;
	bottom: VerticalEnd;
	bottomHeight: number | null;
	top: VerticalEnd;
	topHeight: number | null;
	fillDepth: number | null;
	increment: number | null;
	unit: TankUnit;
	specificGravity: number;
}

const DEFAULTS: TankState = {
	shape: "horizontal",
	diameter: 48,
	length: 120,
	width: 60,
	height: 40,
	wallThickness: 0.25,
	ends: "flat",
	dishDepth: 6,
	bottom: "flat",
	bottomHeight: 12,
	top: "flat",
	topHeight: 12,
	fillDepth: 24,
	increment: 2,
	unit: "gal",
	specificGravity: 1,
};

const SHAPES: { value: TankShape; label: string }[] = [
	{ value: "horizontal", label: "Horizontal" },
	{ value: "vertical", label: "Vertical" },
	{ value: "elliptical", label: "Elliptical" },
	{ value: "rectangular", label: "Rectangular" },
];
const ENDS: { value: EndStyle; label: string }[] = [
	{ value: "flat", label: "Flat" },
	{ value: "dished", label: "Dished" },
	{ value: "hemispherical", label: "Hemispherical" },
];
const VENDS: { value: VerticalEnd; label: string }[] = [
	{ value: "flat", label: "Flat" },
	{ value: "cone", label: "Cone" },
	{ value: "dome", label: "Dome" },
];
const UNIT_IDS = TANK_UNITS.map((u) => u.id);

const num = (v: unknown, lo: number, hi: number, fallback: number | null): number | null => (typeof v === "number" && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : fallback);
const oneOf = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T => (allowed.includes(v as T) ? (v as T) : fallback);

function sanitize(s: Partial<TankState>): TankState {
	const dim = (v: unknown, fb: number | null) => num(v, 0.1, 1e4, fb);
	return {
		shape: oneOf(s.shape, ["horizontal", "vertical", "elliptical", "rectangular"] as const, DEFAULTS.shape),
		diameter: dim(s.diameter, DEFAULTS.diameter),
		length: dim(s.length, DEFAULTS.length),
		width: dim(s.width, DEFAULTS.width),
		height: dim(s.height, DEFAULTS.height),
		wallThickness: num(s.wallThickness, 0, 100, DEFAULTS.wallThickness),
		ends: oneOf(s.ends, ["flat", "dished", "hemispherical"] as const, DEFAULTS.ends),
		dishDepth: num(s.dishDepth, 0, 1e4, DEFAULTS.dishDepth),
		bottom: oneOf(s.bottom, ["flat", "cone", "dome"] as const, DEFAULTS.bottom),
		bottomHeight: num(s.bottomHeight, 0, 1e4, DEFAULTS.bottomHeight),
		top: oneOf(s.top, ["flat", "cone", "dome"] as const, DEFAULTS.top),
		topHeight: num(s.topHeight, 0, 1e4, DEFAULTS.topHeight),
		fillDepth: num(s.fillDepth, 0, 1e4, DEFAULTS.fillDepth),
		increment: num(s.increment, 0.1, 1e4, DEFAULTS.increment),
		unit: oneOf(s.unit, UNIT_IDS, DEFAULTS.unit),
		specificGravity: num(s.specificGravity, 0.01, 30, DEFAULTS.specificGravity) ?? DEFAULTS.specificGravity,
	};
}

export default function TankCalculator() {
	const { format, mode } = useConstructionUnits();
	const { copy, isCopied } = useClipboard();
	const [state, setState] = useState<TankState>(DEFAULTS);
	const set = <K extends keyof TankState>(key: K) => (value: TankState[K]) => setState((s) => ({ ...s, [key]: value }));
	const unitLabel = TANK_UNITS.find((u) => u.id === state.unit)?.label ?? "US gallons";
	const vol = (cubicInches: number) => toUnit(cubicInches, state.unit);
	const fmtVol = (cubicInches: number) => `${vol(cubicInches).toLocaleString(undefined, { maximumFractionDigits: vol(cubicInches) < 100 ? 2 : 1 })} ${unitLabel}`;

	const t = useMemo(() => {
		const s = state;
		if (s.diameter === null || s.length === null || s.width === null || s.height === null || s.wallThickness === null || s.dishDepth === null || s.bottomHeight === null || s.topHeight === null || s.fillDepth === null) return null;
		return tank({ shape: s.shape, diameter: s.diameter, length: s.length, width: s.width, height: s.height, wallThickness: s.wallThickness, ends: s.ends, dishDepth: s.dishDepth, bottom: s.bottom, bottomHeight: s.bottomHeight, top: s.top, topHeight: s.topHeight, fillDepth: s.fillDepth, specificGravity: s.specificGravity });
	}, [state]);
	const rows = useMemo(() => (t && state.increment !== null ? dipChart(t, state.increment) : []), [t, state.increment]);

	const results: ResultRow[] = t
		? [
				{ label: "Capacity", value: fmtVol(t.capacity), strong: true, hint: `${(t.capacity / 1728).toFixed(2)} ft³, ${(t.capacity / 61023.744).toFixed(3)} m³` },
				{ label: `At ${format(Math.min(state.fillDepth ?? 0, t.maxDepth))}`, value: fmtVol(t.volumeAtDepth), strong: true, hint: `${t.percentFull.toFixed(1)}% full, ${fmtVol(t.capacity - t.volumeAtDepth)} to go` },
				{ label: "Weight of water", value: `${t.waterWeightLb.toFixed(0)} lb`, hint: `${(t.waterWeightLb / LB_PER_KG).toFixed(0)} kg at the fill depth` },
				...(Math.abs(state.specificGravity - 1) > 1e-9 ? [{ label: `Weight at SG ${state.specificGravity}`, value: `${t.liquidWeightLb.toFixed(0)} lb`, hint: `${(t.liquidWeightLb / LB_PER_KG).toFixed(0)} kg` }] : []),
				{ label: "Inside depth", value: format(t.maxDepth), hint: state.wallThickness ? `outside less ${format(state.wallThickness)} wall each side` : "" },
				{ label: "Inside surface", value: formatArea(t.surfaceArea, mode), hint: "shell and ends" },
			]
		: [];

	const copyChart = () => copy(["Depth\tVolume\t%", ...rows.map((r) => `${format(r.depth)}\t${vol(r.volume).toFixed(2)}\t${r.percent.toFixed(1)}`)].join("\n"));

	return (
		<div className={styles.container}>
			<div className="flex flex-col gap-6">
				<UnitAndPrecisionBar />

				<div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
					<section className={styles.card} aria-labelledby="tk-heading">
						<h2 id="tk-heading" className={styles.cardTitle}>
							Tank
						</h2>
						<SegmentedControl<TankShape> label="Tank shape" size="sm" value={state.shape} onChange={set("shape")} options={SHAPES} />
						<p className={`${styles.note} mt-3`}>Outside dimensions; the wall thickness is taken off all round. Depth is measured from the lowest point inside.</p>
						<div className="flex flex-col gap-4">
							{state.shape === "horizontal" && (
								<>
									<div className="grid grid-cols-2 gap-3">
										<DimensionInput id="tk-dia" label="Diameter" value={state.diameter} onChange={set("diameter")} />
										<DimensionInput id="tk-len" label="Length" value={state.length} onChange={set("length")} hint="Straight shell, end to end" />
									</div>
									<div className="flex flex-wrap items-end gap-x-6 gap-y-3">
										<div className="flex flex-col gap-1">
											<span className={styles.label}>Ends</span>
											<SegmentedControl<EndStyle> label="Ends" size="sm" fill={false} value={state.ends} onChange={set("ends")} options={ENDS} />
										</div>
										{state.ends === "dished" && <DimensionInput id="tk-dish" label="Dish depth" value={state.dishDepth} onChange={set("dishDepth")} className="w-36" hint="Each end, beyond the shell" />}
									</div>
								</>
							)}
							{state.shape === "vertical" && (
								<>
									<div className="grid grid-cols-2 gap-3">
										<DimensionInput id="tk-dia" label="Diameter" value={state.diameter} onChange={set("diameter")} />
										<DimensionInput id="tk-height" label="Height" value={state.height} onChange={set("height")} hint="Overall, ends included" />
									</div>
									<div className="flex flex-wrap items-end gap-x-6 gap-y-3">
										<div className="flex flex-col gap-1">
											<span className={styles.label}>Bottom</span>
											<SegmentedControl<VerticalEnd> label="Bottom" size="sm" fill={false} value={state.bottom} onChange={set("bottom")} options={VENDS} />
										</div>
										{state.bottom !== "flat" && <DimensionInput id="tk-bottom-h" label="Bottom height" value={state.bottomHeight} onChange={set("bottomHeight")} className="w-36" />}
									</div>
									<div className="flex flex-wrap items-end gap-x-6 gap-y-3">
										<div className="flex flex-col gap-1">
											<span className={styles.label}>Top</span>
											<SegmentedControl<VerticalEnd> label="Top" size="sm" fill={false} value={state.top} onChange={set("top")} options={VENDS} />
										</div>
										{state.top !== "flat" && <DimensionInput id="tk-top-h" label="Top height" value={state.topHeight} onChange={set("topHeight")} className="w-36" />}
									</div>
								</>
							)}
							{(state.shape === "elliptical" || state.shape === "rectangular") && (
								<div className="grid grid-cols-3 gap-3">
									<DimensionInput id="tk-width" label="Width" value={state.width} onChange={set("width")} />
									<DimensionInput id="tk-height" label="Height" value={state.height} onChange={set("height")} />
									<DimensionInput id="tk-len" label="Length" value={state.length} onChange={set("length")} />
								</div>
							)}
							<div className="grid grid-cols-2 gap-3">
								<DimensionInput id="tk-wall" label="Wall thickness" value={state.wallThickness} onChange={set("wallThickness")} />
								<DimensionInput id="tk-fill" label="Fill depth" value={state.fillDepth} onChange={set("fillDepth")} min={0} max={t?.maxDepth} step={0.5} />
							</div>
							<div className="grid grid-cols-3 gap-3">
								<div className="flex flex-col gap-1">
									<label htmlFor="tk-unit" className={styles.label}>
										Show volumes in
									</label>
									<select id="tk-unit" className={styles.select} value={state.unit} onChange={(e) => set("unit")(e.target.value as TankUnit)}>
										{TANK_UNITS.map((u) => (
											<option key={u.id} value={u.id}>
												{u.label}
											</option>
										))}
									</select>
								</div>
								<DimensionInput id="tk-inc" label="Dip chart step" value={state.increment} onChange={set("increment")} />
								<NumberField id="tk-sg" label="Specific gravity" value={state.specificGravity} onChange={set("specificGravity")} min={0.01} max={30} step="any" hint="1 for water, 0.85 diesel" />
							</div>
						</div>
					</section>

					<section className={styles.card} aria-labelledby="tk-results">
						<h2 id="tk-results" className={styles.cardTitle}>
							Volume
						</h2>
						{t ? <ResultList rows={results} /> : <p className={styles.empty}>Enter the tank dimensions; the wall must leave an inside.</p>}
						{t?.warnings.map((w) => (
							<p key={w} className={styles.warn}>
								{w}
							</p>
						))}
						{t && state.shape === "horizontal" && state.ends === "dished" && <p className={styles.note}>Dished ends are treated as shallow ellipsoidal caps, the usual approximation for torispherical heads; actual heads vary by a few percent.</p>}
					</section>
				</div>

				{t && state.fillDepth !== null && state.dishDepth !== null && state.bottomHeight !== null && state.topHeight !== null && (
					<div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
						<section className={styles.card} aria-labelledby="tk-section">
							<h2 id="tk-section" className={styles.cardTitle}>
								Section
							</h2>
							<PrintDiagrams title="Tank section" subtitle={`${format(Math.min(state.fillDepth, t.maxDepth))} of ${format(t.maxDepth)}, ${t.percentFull.toFixed(1)}% full`}>
								<TankSectionDiagram tank={t} shape={state.shape} ends={state.ends} dishDepth={state.dishDepth} bottom={state.bottom} bottomHeight={state.bottomHeight} top={state.top} topHeight={state.topHeight} fillDepth={state.fillDepth} format={format} />
							</PrintDiagrams>
						</section>
						<section className={styles.card} aria-labelledby="tk-chart">
							<h2 id="tk-chart" className={styles.cardTitle}>
								Volume against depth
							</h2>
							<PrintDiagrams title="Volume against depth" subtitle={`${fmtVol(t.capacity)} full`}>
								<DipChartDiagram rows={rows} unitLabel={unitLabel} toUnit={vol} fillDepth={state.fillDepth} format={format} />
							</PrintDiagrams>
						</section>
					</div>
				)}

				{t && rows.length > 0 && (
					<section className={styles.card} aria-labelledby="tk-dip">
						<div className="flex flex-wrap items-center justify-between gap-2 mb-2">
							<h2 id="tk-dip" className={styles.cardTitle}>
								Dip chart
							</h2>
							<button type="button" className={styles.btn} onClick={copyChart}>
								{isCopied() ? "Copied" : "Copy chart"}
							</button>
						</div>
						<p className={styles.note}>Depth from the inside bottom to the volume held, every {format(state.increment ?? 0)}. Print this page for the tank.</p>
						<div className={styles.dipGrid}>
							{rows.map((r) => (
								<div key={r.depth} className={styles.dipRow}>
									<span className="mono">{format(r.depth)}</span>
									<span className="mono">{vol(r.volume).toLocaleString(undefined, { maximumFractionDigits: 1 })}</span>
									<span className={styles.pct}>{r.percent.toFixed(1)}%</span>
								</div>
							))}
						</div>
					</section>
				)}
				{t && rows.length === 0 && <p className={styles.note}>The dip chart step is too fine for this tank; use a larger step.</p>}

				<div className="grid gap-4 lg:grid-cols-2">
					<ShareCalculation state={state} onLoad={(s) => setState(sanitize(s))} />
					<ConstructionNotes />
				</div>
			</div>
		</div>
	);
}
