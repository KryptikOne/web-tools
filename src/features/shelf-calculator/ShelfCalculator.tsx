"use client";

import { useMemo, useState } from "react";
import SegmentedControl from "@/components/SegmentedControl";
import { UnitAndPrecisionBar, DimensionInput, NumberField, ResultList, RunningList, PrintDiagrams, ShareCalculation, ConstructionNotes } from "@/components/construction";
import type { ResultRow } from "@/components/construction";
import { useConstructionUnits } from "@/hooks/useConstructionUnits";
import { shelfLayout, type ShelfMode, type ShelfReference } from "@/lib/construction/shelfUtils";
import type { GraduationMode } from "@/lib/construction/spacingUtils";
import { CarcassDiagram, StoryStickDiagrams } from "./ShelfDiagrams";
import styles from "./ShelfCalculator.module.scss";

interface ShelfState {
	insideHeight: number | null;
	insideWidth: number | null;
	sideThickness: number | null;
	thickness: number | null;
	openings: number;
	mode: ShelfMode;
	graduation: GraduationMode;
	step: number | null;
	ratio: number;
	setOpenings: (number | null)[];
	topClearance: number | null;
	bottomClearance: number | null;
	reference: ShelfReference;
}

const DEFAULTS: ShelfState = {
	insideHeight: 70,
	insideWidth: 30,
	sideThickness: 0.75,
	thickness: 0.75,
	openings: 5,
	mode: "equal",
	graduation: "arithmetic",
	step: 1.5,
	ratio: 1.15,
	setOpenings: [10, 12, 14, 16],
	topClearance: 0,
	bottomClearance: 0,
	reference: "underside",
};

const num = (v: unknown, lo: number, hi: number, fallback: number | null): number | null => (typeof v === "number" && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : fallback);
const oneOf = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T => (allowed.includes(v as T) ? (v as T) : fallback);
const int = (v: unknown, lo: number, hi: number, fb: number) => Math.round(num(v, lo, hi, fb) ?? fb);

function sanitize(s: Partial<ShelfState>): ShelfState {
	return {
		insideHeight: num(s.insideHeight, 1, 1200, DEFAULTS.insideHeight),
		insideWidth: num(s.insideWidth, 1, 1200, DEFAULTS.insideWidth),
		sideThickness: num(s.sideThickness, 0, 12, DEFAULTS.sideThickness),
		thickness: num(s.thickness, 0, 12, DEFAULTS.thickness),
		openings: int(s.openings, 1, 60, DEFAULTS.openings),
		mode: oneOf(s.mode, ["equal", "graduated", "set"] as const, DEFAULTS.mode),
		graduation: oneOf(s.graduation, ["arithmetic", "geometric"] as const, DEFAULTS.graduation),
		step: num(s.step, -100, 100, DEFAULTS.step),
		ratio: num(s.ratio, 0.1, 10, DEFAULTS.ratio) ?? DEFAULTS.ratio,
		setOpenings: Array.isArray(s.setOpenings) ? s.setOpenings.slice(0, 59).map((h) => num(h, 0, 1200, null)) : DEFAULTS.setOpenings,
		topClearance: num(s.topClearance, 0, 1200, DEFAULTS.topClearance),
		bottomClearance: num(s.bottomClearance, 0, 1200, DEFAULTS.bottomClearance),
		reference: oneOf(s.reference, ["top", "underside", "center"] as const, DEFAULTS.reference),
	};
}

export default function ShelfCalculator() {
	const { format } = useConstructionUnits();
	const [state, setState] = useState<ShelfState>(DEFAULTS);
	const set = <K extends keyof ShelfState>(key: K) => (value: ShelfState[K]) => setState((s) => ({ ...s, [key]: value }));
	const setOpening = (i: number, v: number | null) =>
		setState((s) => {
			const next = [...s.setOpenings];
			while (next.length < i + 1) next.push(null);
			next[i] = v;
			return { ...s, setOpenings: next };
		});

	const layout = useMemo(() => {
		const s = state;
		if (s.insideHeight === null || s.thickness === null || s.step === null || s.topClearance === null || s.bottomClearance === null) return null;
		return shelfLayout({
			insideHeight: s.insideHeight,
			thickness: s.thickness,
			openings: s.openings,
			mode: s.mode,
			graduation: s.graduation,
			step: s.step,
			ratio: s.ratio,
			setOpenings: s.setOpenings.map((h) => h ?? 0),
			topClearance: s.topClearance,
			bottomClearance: s.bottomClearance,
			reference: s.reference,
		});
	}, [state]);

	const rows: ResultRow[] = layout
		? [
				{ label: "Shelves", value: `${layout.shelfCount}`, strong: true, hint: `${layout.openings.length} openings sharing ${format(layout.available)}` },
				...(state.mode === "equal" ? [{ label: "Each opening", value: format(layout.openings[0].height), strong: true }] : []),
				...(state.mode === "graduated" ? [{ label: "Openings", value: `${format(layout.openings[0].height)} to ${format(layout.openings[layout.openings.length - 1].height)}`, strong: true, hint: state.graduation === "arithmetic" ? `each ${format(layout.step)} taller than the one above` : `each ${state.ratio}× the one above` }] : []),
				...(state.mode === "set" ? [{ label: "Last opening", value: format(layout.openings[layout.openings.length - 1].height), strong: true, hint: "takes what is left" }] : []),
				{ label: "Closes", value: layout.closes ? "yes" : `${format(Math.abs(layout.remainder))} ${layout.remainder > 0 ? "short" : "over"}`, hint: "openings + shelves + clearances against the inside height" },
			]
		: [];

	return (
		<div className={styles.container}>
			<div className="flex flex-col gap-6">
				<UnitAndPrecisionBar />

				<div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
					<section className={styles.card} aria-labelledby="sh-heading">
						<h2 id="sh-heading" className={styles.cardTitle}>
							Shelves and drawers
						</h2>
						<p className={styles.note}>Openings are counted from the top down the way a cabinet is read; positions are measured up from the inside bottom for marking.</p>
						<div className="flex flex-col gap-4">
							<div className="grid grid-cols-2 gap-3">
								<DimensionInput id="sh-height" label="Inside height" value={state.insideHeight} onChange={set("insideHeight")} />
								<DimensionInput id="sh-width" label="Inside width" value={state.insideWidth} onChange={set("insideWidth")} hint="Drawing only" />
							</div>
							<div className="grid grid-cols-3 gap-3">
								<DimensionInput id="sh-thick" label="Shelf thickness" value={state.thickness} onChange={set("thickness")} hint="Or drawer front" />
								<DimensionInput id="sh-side" label="Side thickness" value={state.sideThickness} onChange={set("sideThickness")} hint="Drawing only" />
								<NumberField id="sh-count" label="Openings" value={state.openings} onChange={(v) => set("openings")(int(v, 1, 60, 1))} min={1} max={60} step={1} />
							</div>
							<div className="flex flex-col gap-1">
								<span className={styles.label}>Spacing</span>
								<SegmentedControl<ShelfMode>
									label="Spacing"
									size="sm"
									value={state.mode}
									onChange={set("mode")}
									options={[
										{ value: "equal", label: "Equal" },
										{ value: "graduated", label: "Graduated" },
										{ value: "set", label: "Set heights" },
									]}
								/>
							</div>
							{state.mode === "graduated" && (
								<div className="flex flex-wrap items-end gap-x-6 gap-y-3">
									<div className="flex flex-col gap-1">
										<span className={styles.label}>Grow by</span>
										<SegmentedControl<GraduationMode>
											label="Grow by"
											size="sm"
											fill={false}
											value={state.graduation}
											onChange={set("graduation")}
											options={[
												{ value: "arithmetic", label: "Fixed step" },
												{ value: "geometric", label: "Ratio" },
											]}
										/>
									</div>
									{state.graduation === "arithmetic" ? <DimensionInput id="sh-step" label="Step" value={state.step} onChange={set("step")} min={-100} hint="Added to each opening going down" className="w-36" /> : <NumberField id="sh-ratio" label="Ratio" value={state.ratio} onChange={set("ratio")} min={0.1} max={10} step="any" hint="Each opening × this" className="w-32" />}
								</div>
							)}
							{state.mode === "set" && (
								<div className="flex flex-col gap-2">
									<span className={styles.label}>Opening heights from the top</span>
									<div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
										{Array.from({ length: Math.max(0, state.openings - 1) }, (_, i) => (
											<DimensionInput key={i} id={`sh-open-${i}`} label={`Opening ${i + 1}`} value={state.setOpenings[i] ?? null} onChange={(v) => setOpening(i, v)} />
										))}
									</div>
									<span className={styles.hint}>Opening {state.openings} takes the remainder.</span>
								</div>
							)}
							<div className="grid grid-cols-2 gap-3">
								<DimensionInput id="sh-top" label="Top clearance" value={state.topClearance} onChange={set("topClearance")} hint="Above the first opening" />
								<DimensionInput id="sh-bottom" label="Bottom clearance" value={state.bottomClearance} onChange={set("bottomClearance")} hint="Below the last opening" />
							</div>
							<div className="flex flex-col gap-1">
								<span className={styles.label}>Mark shelves at</span>
								<SegmentedControl<ShelfReference>
									label="Mark shelves at"
									size="sm"
									fill={false}
									value={state.reference}
									onChange={set("reference")}
									options={[
										{ value: "underside", label: "Underside" },
										{ value: "center", label: "Centre" },
										{ value: "top", label: "Top" },
									]}
								/>
							</div>
						</div>
					</section>

					<section className={styles.card} aria-labelledby="sh-results">
						<h2 id="sh-results" className={styles.cardTitle}>
							Openings
						</h2>
						{layout ? <ResultList rows={rows} /> : <p className={styles.empty}>The shelves and clearances must leave room for the openings, and a graduation must keep every opening above zero.</p>}
						{layout?.warnings.map((w) => (
							<p key={w} className={styles.warn}>
								{w}
							</p>
						))}
						{layout && (
							<table className={`${styles.table} mt-4`}>
								<caption className="sr-only">Openings from the top</caption>
								<thead>
									<tr>
										<th scope="col">Opening</th>
										<th scope="col">Height</th>
										<th scope="col">Bottom above floor</th>
										<th scope="col">Shelf below at</th>
									</tr>
								</thead>
								<tbody>
									{layout.openings.map((o, i) => (
										<tr key={o.index}>
											<td className="mono">{o.index}</td>
											<td className="mono">{format(o.height)}</td>
											<td className="mono">{format(o.bottom)}</td>
											<td className="mono">{layout.shelves[i] ? format(state.reference === "top" ? layout.shelves[i].top : state.reference === "center" ? layout.shelves[i].center : layout.shelves[i].underside) : ""}</td>
										</tr>
									))}
								</tbody>
							</table>
						)}
					</section>
				</div>

				{layout && state.insideHeight !== null && state.insideWidth !== null && state.thickness !== null && state.sideThickness !== null && (
					<>
						<div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
							<section className={styles.card} aria-labelledby="sh-elev">
								<h2 id="sh-elev" className={styles.cardTitle}>
									Elevation
								</h2>
								<PrintDiagrams title="Shelf layout" subtitle={`${format(state.insideHeight)} inside, ${layout.shelfCount} shelves, drawn to fit`}>
									<CarcassDiagram layout={layout} insideHeight={state.insideHeight} insideWidth={state.insideWidth} thickness={state.thickness} sideThickness={state.sideThickness} format={format} />
								</PrintDiagrams>
							</section>
							{layout.shelfCount > 0 && <RunningList title={`Shelf ${state.reference === "top" ? "tops" : state.reference === "center" ? "centres" : "undersides"} from the inside bottom`} positions={layout.positions} labelFor={(i) => `shelf ${layout.shelfCount - i}`} />}
						</div>
						{layout.shelfCount > 0 && (
							<section className={styles.card} aria-labelledby="sh-stick">
								<h2 id="sh-stick" className={styles.cardTitle}>
									Story stick
								</h2>
								<p className={styles.note}>Shelf undersides at true size from the inside bottom, split into segments that each fit a sheet. Print at 100%, tape the segments in order and stand the stick in the carcass.</p>
								<PrintDiagrams title="Shelf story stick" subtitle={`${layout.shelfCount} shelves over ${format(state.insideHeight)}, true size`}>
									<div className="flex flex-wrap gap-4">
										<StoryStickDiagrams layout={layout} insideHeight={state.insideHeight} thickness={state.thickness} format={format} />
									</div>
								</PrintDiagrams>
								{state.insideHeight * 25.4 > 3000 && <p className={styles.note}>The stick is only printed for carcasses up to about 10 ft; use the running list for taller ones.</p>}
							</section>
						)}
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
