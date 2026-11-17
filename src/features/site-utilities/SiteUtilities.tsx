"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import SegmentedControl from "@/components/SegmentedControl";
import { UnitAndPrecisionBar, DimensionInput, NumberField, ResultList, PrintDiagrams, ShareCalculation, ConstructionNotes } from "@/components/construction";
import type { ResultRow } from "@/components/construction";
import { useConstructionUnits } from "@/hooks/useConstructionUnits";
import { formatArea, AREA_UNIT } from "@/lib/construction/imperialUtils";
import { toDMS, fromDMS, formatDMS, addAngles, subtractAngles, normalizeAngle, azimuthToBearing, bearingToAzimuth, type Quadrant } from "@/lib/construction/surveyUtils";
import { DRAWING_SCALES, drawingToReal, realToDrawing, scaleFactor, drawingAreaToReal, ratioFromInchesPerFoot } from "@/lib/construction/scaleUtils";
import { floorArea, type Room, type RoomShape } from "@/lib/construction/areaUtils";
import ScaleBarDiagram from "./ScaleBarDiagram";
import styles from "./SiteUtilities.module.scss";

type Mode = "dms" | "scale" | "area";

interface RoomRow extends Room {
	id: number;
}

interface SiteState {
	mode: Mode;
	// dms
	decimal: number;
	degrees: number;
	minutes: number;
	seconds: number;
	negative: boolean;
	places: number;
	angleB: number;
	quadrant: Quadrant;
	bearingAngle: number;
	// scale
	scaleId: string;
	customRatio: number;
	inchesPerFoot: number;
	drawingLength: number | null;
	realLength: number | null;
	toScaleId: string;
	drawnArea: number;
	// area
	rooms: RoomRow[];
	wastePercent: number;
	unitCoverage: number | null;
}

const DEFAULTS: SiteState = {
	mode: "dms",
	decimal: 45.5,
	degrees: 45,
	minutes: 30,
	seconds: 0,
	negative: false,
	places: 1,
	angleB: 30,
	quadrant: "NE",
	bearingAngle: 45,
	scaleId: "1/4in",
	customRatio: 48,
	inchesPerFoot: 0.25,
	drawingLength: 2,
	realLength: 96,
	toScaleId: "1/8in",
	drawnArea: 4,
	rooms: [
		{ id: 1, name: "Living", shape: "rectangle", a: 144, b: 180 },
		{ id: 2, name: "Kitchen", shape: "rectangle", a: 120, b: 144 },
	],
	wastePercent: 10,
	unitCoverage: null,
};

const SCALE_OPTIONS = [...DRAWING_SCALES.map((s) => ({ value: s.id, label: s.label })), { value: "custom", label: "Custom ratio" }, { value: "inches", label: `Custom inches per foot` }];
const QUADRANTS: Quadrant[] = ["NE", "SE", "SW", "NW"];

const num = (v: unknown, lo: number, hi: number, fallback: number | null): number | null => (typeof v === "number" && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : fallback);
const oneOf = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T => (allowed.includes(v as T) ? (v as T) : fallback);
const n = (v: unknown, lo: number, hi: number, fb: number) => num(v, lo, hi, fb) ?? fb;
const int = (v: unknown, lo: number, hi: number, fb: number) => Math.round(n(v, lo, hi, fb));

function sanitize(s: Partial<SiteState>): SiteState {
	const rooms: RoomRow[] = Array.isArray(s.rooms)
		? s.rooms.slice(0, 50).map((r, i) => {
				const room = r as Partial<RoomRow>;
				return { id: i + 1, name: typeof room.name === "string" ? room.name.slice(0, 40) : `Room ${i + 1}`, shape: oneOf(room.shape, ["rectangle", "triangle", "circle"] as const, "rectangle"), a: n(room.a, 0, 1e4, 120), b: n(room.b, 0, 1e4, 120), subtract: room.subtract === true };
			})
		: DEFAULTS.rooms;
	return {
		mode: oneOf(s.mode, ["dms", "scale", "area"] as const, DEFAULTS.mode),
		decimal: n(s.decimal, -3600, 3600, DEFAULTS.decimal),
		degrees: int(s.degrees, 0, 3600, DEFAULTS.degrees),
		minutes: int(s.minutes, 0, 59, DEFAULTS.minutes),
		seconds: n(s.seconds, 0, 59.999, DEFAULTS.seconds),
		negative: s.negative === true,
		places: int(s.places, 0, 3, DEFAULTS.places),
		angleB: n(s.angleB, -3600, 3600, DEFAULTS.angleB),
		quadrant: oneOf(s.quadrant, QUADRANTS, DEFAULTS.quadrant),
		bearingAngle: n(s.bearingAngle, 0, 90, DEFAULTS.bearingAngle),
		scaleId: typeof s.scaleId === "string" && SCALE_OPTIONS.some((o) => o.value === s.scaleId) ? s.scaleId : DEFAULTS.scaleId,
		customRatio: n(s.customRatio, 0.001, 1e6, DEFAULTS.customRatio),
		inchesPerFoot: n(s.inchesPerFoot, 0.001, 120, DEFAULTS.inchesPerFoot),
		drawingLength: num(s.drawingLength, 0, 1e4, DEFAULTS.drawingLength),
		realLength: num(s.realLength, 0, 1e7, DEFAULTS.realLength),
		toScaleId: typeof s.toScaleId === "string" && DRAWING_SCALES.some((o) => o.id === s.toScaleId) ? s.toScaleId : DEFAULTS.toScaleId,
		drawnArea: n(s.drawnArea, 0, 1e6, DEFAULTS.drawnArea),
		rooms,
		wastePercent: n(s.wastePercent, 0, 100, DEFAULTS.wastePercent),
		unitCoverage: num(s.unitCoverage, 0, 1e6, DEFAULTS.unitCoverage),
	};
}

export default function SiteUtilities() {
	const { format, mode: unitMode } = useConstructionUnits();
	const [state, setState] = useState<SiteState>(DEFAULTS);
	const set = <K extends keyof SiteState>(key: K) => (value: SiteState[K]) => setState((s) => ({ ...s, [key]: value }));

	// DMS: the decimal field and the D/M/S fields are kept in step
	const setDecimal = (v: number) => {
		const d = toDMS(v, 3);
		setState((s) => ({ ...s, decimal: v, degrees: d.degrees, minutes: d.minutes, seconds: d.seconds, negative: d.negative }));
	};
	const setPart = (patch: Partial<Pick<SiteState, "degrees" | "minutes" | "seconds" | "negative">>) =>
		setState((s) => {
			const next = { ...s, ...patch };
			return { ...next, decimal: fromDMS(next.degrees, next.minutes, next.seconds, next.negative) };
		});
	const bearing = azimuthToBearing(state.decimal, state.places);
	const dmsRows: ResultRow[] = [
		{ label: "Decimal degrees", value: `${state.decimal.toFixed(6).replace(/0+$/, "").replace(/\.$/, "")}°`, strong: true },
		{ label: "Degrees minutes seconds", value: formatDMS(state.decimal, state.places), strong: true },
		{ label: "Normalised", value: formatDMS(normalizeAngle(state.decimal), state.places), hint: "brought into 0° to 360°" },
		{ label: "As a bearing", value: bearing.text, hint: "taking the angle as an azimuth from north" },
		{ label: `Plus ${formatDMS(state.angleB, state.places)}`, value: formatDMS(addAngles(state.decimal, state.angleB), state.places), hint: `${formatDMS(addAngles(state.decimal, state.angleB, false), state.places)} before normalising` },
		{ label: `Minus ${formatDMS(state.angleB, state.places)}`, value: formatDMS(subtractAngles(state.decimal, state.angleB), state.places), hint: `${formatDMS(subtractAngles(state.decimal, state.angleB, false), state.places)} before normalising` },
		{ label: `Bearing ${state.quadrant[0]} ${formatDMS(state.bearingAngle, state.places)} ${state.quadrant[1]}`, value: formatDMS(bearingToAzimuth(state.quadrant, state.bearingAngle), state.places), hint: "as an azimuth from north" },
	];

	// Scale
	const scale = DRAWING_SCALES.find((s) => s.id === state.scaleId);
	const ratio = state.scaleId === "custom" ? state.customRatio : state.scaleId === "inches" ? ratioFromInchesPerFoot(state.inchesPerFoot) : (scale?.ratio ?? 48);
	const scaleLabel = state.scaleId === "custom" ? `1:${state.customRatio}` : state.scaleId === "inches" ? `${state.inchesPerFoot}" = 1'-0" (1:${ratio.toFixed(2).replace(/\.?0+$/, "")})` : (scale?.label ?? "");
	const toScale = DRAWING_SCALES.find((s) => s.id === state.toScaleId) ?? DRAWING_SCALES[0];
	const system: "metric" | "imperial" = scale ? scale.system : unitMode === "mm" ? "metric" : "imperial";
	const scaleRows: ResultRow[] = [
		{ label: "Scale", value: scaleLabel, strong: true, hint: `one unit on the drawing is ${ratio.toFixed(ratio % 1 ? 3 : 0)} in the building` },
		...(state.drawingLength !== null ? [{ label: `${format(state.drawingLength)} on the drawing`, value: format(drawingToReal(state.drawingLength, ratio)), strong: true, hint: "real length" }] : []),
		...(state.realLength !== null ? [{ label: `${format(state.realLength)} real`, value: format(realToDrawing(state.realLength, ratio)), strong: true, hint: "on the drawing" }] : []),
		{ label: `Redraw at ${toScale.label}`, value: `× ${scaleFactor(ratio, toScale.ratio).toFixed(4).replace(/0+$/, "").replace(/\.$/, "")}`, hint: "multiply drawn lengths by this" },
		{ label: `${state.drawnArea} square units drawn`, value: `${drawingAreaToReal(state.drawnArea, ratio).toLocaleString(undefined, { maximumFractionDigits: 1 })} square units real`, hint: "areas scale by the ratio squared" },
	];

	// Area
	const area = useMemo(() => floorArea(state.rooms, state.wastePercent, state.unitCoverage ?? 0), [state.rooms, state.wastePercent, state.unitCoverage]);
	const updateRoom = (id: number, patch: Partial<RoomRow>) => setState((s) => ({ ...s, rooms: s.rooms.map((r) => (r.id === id ? { ...r, ...patch } : r)) }));
	const addRoom = () => setState((s) => (s.rooms.length >= 50 ? s : { ...s, rooms: [...s.rooms, { id: Math.max(0, ...s.rooms.map((r) => r.id)) + 1, name: `Room ${s.rooms.length + 1}`, shape: "rectangle", a: 120, b: 120 }] }));
	const removeRoom = (id: number) => setState((s) => ({ ...s, rooms: s.rooms.filter((r) => r.id !== id) }));
	const areaRows: ResultRow[] = [
		{ label: "Total area", value: formatArea(area.totalArea, unitMode), strong: true, hint: `${area.rooms.length} rooms${area.rooms.some((r) => r.subtract) ? ", voids taken away" : ""}` },
		{ label: "Perimeter", value: format(area.totalPerimeter), hint: "all rooms, for skirting or trim" },
		{ label: `With ${state.wastePercent}% waste`, value: formatArea(area.withWaste, unitMode), strong: true, hint: "flooring to buy" },
		...(state.unitCoverage ? [{ label: "Units to buy", value: `${area.units}`, hint: `at ${formatArea(state.unitCoverage, unitMode)} per box or sheet` }] : []),
	];

	return (
		<div className={styles.container}>
			<div className="flex flex-col gap-6">
				<UnitAndPrecisionBar />

				<SegmentedControl<Mode>
					label="Utility"
					size="sm"
					value={state.mode}
					onChange={set("mode")}
					options={[
						{ value: "dms", label: "Degrees minutes seconds" },
						{ value: "scale", label: "Drawing scale" },
						{ value: "area", label: "Floor area" },
					]}
				/>

				{state.mode === "dms" && (
					<div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
						<section className={styles.card} aria-labelledby="su-dms">
							<h2 id="su-dms" className={styles.cardTitle}>
								Angle
							</h2>
							<p className={styles.note}>Type either the decimal degrees or the degrees, minutes and seconds; the other follows.</p>
							<div className="flex flex-col gap-4">
								<NumberField id="su-decimal" label="Decimal degrees" value={state.decimal} onChange={setDecimal} unit="°" min={-3600} max={3600} step="any" />
								<div className="grid grid-cols-3 gap-3">
									<NumberField id="su-deg" label="Degrees" value={state.degrees} onChange={(v) => setPart({ degrees: int(v, 0, 3600, 0) })} min={0} max={3600} step={1} />
									<NumberField id="su-min" label="Minutes" value={state.minutes} onChange={(v) => setPart({ minutes: int(v, 0, 59, 0) })} min={0} max={59} step={1} />
									<NumberField id="su-sec" label="Seconds" value={state.seconds} onChange={(v) => setPart({ seconds: n(v, 0, 59.999, 0) })} min={0} max={59.999} step="any" />
								</div>
								<div className="flex flex-wrap items-end gap-x-6 gap-y-3">
									<label className={styles.check}>
										<input type="checkbox" checked={state.negative} onChange={(e) => setPart({ negative: e.target.checked })} />
										Negative
									</label>
									<div className="flex flex-col gap-1">
										<span className={styles.label}>Seconds to</span>
										<SegmentedControl<string>
											label="Seconds to"
											size="sm"
											fill={false}
											value={`${state.places}`}
											onChange={(v) => set("places")(Number(v))}
											options={[
												{ value: "0", label: `1"` },
												{ value: "1", label: `0.1"` },
												{ value: "2", label: `0.01"` },
											]}
										/>
									</div>
								</div>
								<NumberField id="su-b" label="Second angle" value={state.angleB} onChange={set("angleB")} unit="°" min={-3600} max={3600} step="any" hint="Added to and taken from the angle above" />
								<div className="flex flex-wrap items-end gap-x-6 gap-y-3">
									<div className="flex flex-col gap-1">
										<span className={styles.label}>Bearing quadrant</span>
										<SegmentedControl<Quadrant> label="Bearing quadrant" size="sm" fill={false} value={state.quadrant} onChange={set("quadrant")} options={QUADRANTS.map((q) => ({ value: q, label: `${q[0]} … ${q[1]}` }))} />
									</div>
									<NumberField id="su-bearing" label="Bearing angle" value={state.bearingAngle} onChange={set("bearingAngle")} unit="°" min={0} max={90} step="any" className="w-32" />
								</div>
							</div>
						</section>
						<section className={styles.card} aria-labelledby="su-dms-results">
							<h2 id="su-dms-results" className={styles.cardTitle}>
								Conversions
							</h2>
							<ResultList rows={dmsRows} />
						</section>
					</div>
				)}

				{state.mode === "scale" && (
					<>
						<div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
							<section className={styles.card} aria-labelledby="su-scale">
								<h2 id="su-scale" className={styles.cardTitle}>
									Drawing scale
								</h2>
								<div className="flex flex-col gap-4">
									<div className="flex flex-col gap-1">
										<label htmlFor="su-scale-id" className={styles.label}>
											Scale
										</label>
										<select id="su-scale-id" className={styles.select} value={state.scaleId} onChange={(e) => set("scaleId")(e.target.value)}>
											{SCALE_OPTIONS.map((o) => (
												<option key={o.value} value={o.value}>
													{o.label}
												</option>
											))}
										</select>
									</div>
									{state.scaleId === "custom" && <NumberField id="su-ratio" label="Ratio 1 :" value={state.customRatio} onChange={set("customRatio")} min={0.001} step="any" />}
									{state.scaleId === "inches" && <NumberField id="su-ipf" label="Inches on the drawing per foot" value={state.inchesPerFoot} onChange={set("inchesPerFoot")} min={0.001} step="any" />}
									<div className="grid grid-cols-2 gap-3">
										<DimensionInput id="su-drawn" label="Length on the drawing" value={state.drawingLength} onChange={set("drawingLength")} />
										<DimensionInput id="su-real" label="Real length" value={state.realLength} onChange={set("realLength")} />
									</div>
									<div className="grid grid-cols-2 gap-3">
										<div className="flex flex-col gap-1">
											<label htmlFor="su-to" className={styles.label}>
												Redraw at
											</label>
											<select id="su-to" className={styles.select} value={state.toScaleId} onChange={(e) => set("toScaleId")(e.target.value)}>
												{DRAWING_SCALES.map((o) => (
													<option key={o.id} value={o.id}>
														{o.label}
													</option>
												))}
											</select>
										</div>
										<NumberField id="su-area" label="Area drawn" value={state.drawnArea} onChange={set("drawnArea")} min={0} step="any" hint="Square drawing units" />
									</div>
								</div>
							</section>
							<section className={styles.card} aria-labelledby="su-scale-results">
								<h2 id="su-scale-results" className={styles.cardTitle}>
									Conversions
								</h2>
								<ResultList rows={scaleRows} />
							</section>
						</div>
						<section className={styles.card} aria-labelledby="su-bar">
							<h2 id="su-bar" className={styles.cardTitle}>
								Scale bar
							</h2>
							<p className={styles.note}>Print at 100% and lay the bar on the drawing to check it printed to scale, or read lengths straight off it.</p>
							<PrintDiagrams title={`Scale bar ${scaleLabel}`} subtitle="True size">
								<ScaleBarDiagram ratio={ratio} label={scaleLabel} system={system} format={format} />
							</PrintDiagrams>
						</section>
					</>
				)}

				{state.mode === "area" && (
					<div className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
						<section className={styles.card} aria-labelledby="su-rooms">
							<h2 id="su-rooms" className={styles.cardTitle}>
								Rooms
							</h2>
							<p className={styles.note}>
								Rectangles are width × length, triangles base × height (right angled), circles by diameter. Tick a room to take it away, e.g. a stair void. Tiles and sheets are counted in the <Link href="/tools/tile-calculator">tile calculator</Link>.
							</p>
							<div className="flex flex-col gap-3">
								{state.rooms.map((r, i) => (
									<div key={r.id} className={styles.roomRow}>
										<input className={styles.text} aria-label={`Room ${i + 1} name`} value={r.name} maxLength={40} onChange={(e) => updateRoom(r.id, { name: e.target.value })} />
										<select className={styles.select} aria-label={`Room ${i + 1} shape`} value={r.shape} onChange={(e) => updateRoom(r.id, { shape: e.target.value as RoomShape })}>
											<option value="rectangle">Rectangle</option>
											<option value="triangle">Triangle</option>
											<option value="circle">Circle</option>
										</select>
										<DimensionInput id={`su-room-a-${r.id}`} label={r.shape === "circle" ? `Room ${i + 1} diameter` : r.shape === "triangle" ? `Room ${i + 1} base` : `Room ${i + 1} width`} value={r.a} onChange={(v) => updateRoom(r.id, { a: v ?? 0 })} />
										{r.shape !== "circle" && <DimensionInput id={`su-room-b-${r.id}`} label={r.shape === "triangle" ? `Room ${i + 1} height` : `Room ${i + 1} length`} value={r.b} onChange={(v) => updateRoom(r.id, { b: v ?? 0 })} />}
										<label className={styles.check}>
											<input type="checkbox" checked={r.subtract === true} onChange={(e) => updateRoom(r.id, { subtract: e.target.checked })} />
											Take away
										</label>
										<span className={`${styles.hint} mono`}>{formatArea(area.rooms[i]?.area ?? 0, unitMode)}</span>
										<button type="button" className={styles.btn} onClick={() => removeRoom(r.id)} aria-label={`Remove room ${i + 1}`}>
											×
										</button>
									</div>
								))}
								<button type="button" className={`${styles.btn} self-start`} onClick={addRoom} disabled={state.rooms.length >= 50}>
									Add room
								</button>
								<div className="grid grid-cols-2 gap-3">
									<NumberField id="su-waste" label="Waste" value={state.wastePercent} onChange={set("wastePercent")} unit="%" min={0} max={100} step="any" />
									<NumberField id="su-cover" label={`Coverage per unit (${AREA_UNIT[unitMode]})`} value={state.unitCoverage === null ? 0 : Math.round((state.unitCoverage / (unitMode === "mm" ? 1550.0031 : unitMode === "in" ? 1 : 144)) * 1000) / 1000} onChange={(v) => set("unitCoverage")(v > 0 ? v * (unitMode === "mm" ? 1550.0031 : unitMode === "in" ? 1 : 144) : null)} min={0} step="any" hint="Per box or sheet; 0 for none" />
								</div>
							</div>
						</section>
						<section className={styles.card} aria-labelledby="su-area-results">
							<h2 id="su-area-results" className={styles.cardTitle}>
								Totals
							</h2>
							<ResultList rows={areaRows} />
							{area.warnings.map((w) => (
								<p key={w} className={styles.warn}>
									{w}
								</p>
							))}
						</section>
					</div>
				)}

				<div className="grid gap-4 lg:grid-cols-2">
					<ShareCalculation state={state} onLoad={(s) => setState(sanitize(s))} />
					<ConstructionNotes />
				</div>
			</div>
		</div>
	);
}
