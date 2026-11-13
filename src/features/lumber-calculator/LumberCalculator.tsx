"use client";

import { useMemo, useState } from "react";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import SegmentedControl from "@/components/SegmentedControl";
import { UnitAndPrecisionBar, DimensionInput, NumberField, ResultList, LumberTable, ShareCalculation, ConstructionNotes } from "@/components/construction";
import type { ResultRow } from "@/components/construction";
import { useConstructionUnits } from "@/hooks/useConstructionUnits";
import { nominalToActual } from "@/lib/construction/imperialUtils";
import {
	ALL_LUMBER_SIZES,
	M2_PER_FT2,
	M3_PER_FT3,
	boardFeet,
	coverageSquareFeet,
	cubicFeet,
	lengthForCoverage,
	lengthForCubicFeet,
	logVolumeCubicFeet,
	priceLumber,
	sectionOf,
	type BoardSection,
	type LogMeasure,
} from "@/lib/construction/lumberUtils";
import styles from "./LumberCalculator.module.scss";

type Mode = "price" | "square" | "cubic";

const MODES: { value: Mode; label: string }[] = [
	{ value: "price", label: "Lumber price" },
	{ value: "square", label: "Linear and square" },
	{ value: "cubic", label: "Linear and cubic" },
];

interface LumberState {
	mode: Mode;
	/** Nominal size key from the lumber table, or "custom" */
	size: string;
	customThickness: number | null;
	customWidth: number | null;
	/** Lengths in inches */
	length: number | null;
	pieces: number;
	costPer1000: number;
	piecesPerPack: number;
	gap: number | null;
	/** Square feet */
	area: number;
	waste: number;
	costPerBft: number;
	/** Cubic feet */
	cubic: number;
	costPerFoot: number;
	costPerFt3: number;
	logLength: number | null;
	logSize: number | null;
	logMeasure: LogMeasure;
}

const DEFAULTS: LumberState = {
	mode: "price",
	size: "2x4",
	customThickness: 1.5,
	customWidth: 3.5,
	length: 96,
	pieces: 10,
	costPer1000: 600,
	piecesPerPack: 0,
	gap: 0,
	area: 100,
	waste: 10,
	costPerBft: 0.6,
	cubic: 1,
	costPerFoot: 0,
	costPerFt3: 0,
	logLength: 96,
	logSize: 12,
	logMeasure: "diameter",
};

interface TotalRow {
	id: number;
	label: string;
	pieces: number;
	bft: number;
	cost: number;
}

const money = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const num = (n: number, digits = 2) => n.toLocaleString("en-US", { maximumFractionDigits: digits });

export default function LumberCalculator() {
	const { format, mode: unitMode } = useConstructionUnits();
	const [state, setState] = useState<LumberState>(DEFAULTS);
	const [totals, setTotals] = useState<TotalRow[]>([]);
	const set = <K extends keyof LumberState>(key: K) => (value: LumberState[K]) => setState((s) => ({ ...s, [key]: value }));

	const metric = unitMode === "mm";
	const areaUnit = metric ? "m²" : "ft²";
	const volUnit = metric ? "m³" : "ft³";
	const fmtArea = (ft2: number) => `${num(metric ? ft2 * M2_PER_FT2 : ft2, 3)} ${areaUnit}`;
	const fmtVol = (ft3: number) => `${num(metric ? ft3 * M3_PER_FT3 : ft3, 4)} ${volUnit}`;
	const fmtBft = (bft: number) => `${num(bft, 3)} bft`;
	// Area and volume are stored in ft² / ft³; the fields show the active unit.
	const areaShown = Number((metric ? state.area * M2_PER_FT2 : state.area).toFixed(4));
	const cubicShown = Number((metric ? state.cubic * M3_PER_FT3 : state.cubic).toFixed(4));
	const setArea = (shown: number) => set("area")(metric ? shown / M2_PER_FT2 : shown);
	const setCubic = (shown: number) => set("cubic")(metric ? shown / M3_PER_FT3 : shown);
	const costPerFt3 = metric ? state.costPerFt3 / M3_PER_FT3 : state.costPerFt3;

	const section: BoardSection | null = useMemo(() => {
		if (state.size === "custom") {
			return state.customThickness && state.customWidth ? { thickness: state.customThickness, width: state.customWidth } : null;
		}
		const size = nominalToActual(state.size);
		return size ? sectionOf(size) : null;
	}, [state.size, state.customThickness, state.customWidth]);

	const sectionLabel = section ? `${format(section.thickness, { mode: metric ? "mm" : "in" })} x ${format(section.width, { mode: metric ? "mm" : "in" })}` : "";
	const sizeLabel = state.size === "custom" ? sectionLabel : state.size;
	const length = state.length ?? 0;

	const price = useMemo(
		() => (section ? priceLumber({ section, lengthIn: length, pieces: state.pieces, costPer1000Bft: state.costPer1000, piecesPerPack: state.piecesPerPack }) : null),
		[section, length, state.pieces, state.costPer1000, state.piecesPerPack],
	);

	const addToTotal = () => {
		if (!price) return;
		setTotals((rows) => [...rows, { id: Date.now() + rows.length, label: `${state.pieces} x ${sizeLabel} @ ${format(length)}`, pieces: state.pieces, bft: price.totalBft, cost: price.totalCost }]);
	};
	const grand = totals.reduce((acc, r) => ({ pieces: acc.pieces + r.pieces, bft: acc.bft + r.bft, cost: acc.cost + r.cost }), { pieces: 0, bft: 0, cost: 0 });

	const priceRows: ResultRow[] = price
		? [
				{ label: "Board feet per piece", value: fmtBft(price.bftPerPiece) },
				{ label: "Total board feet", value: fmtBft(price.totalBft) },
				{ label: "Cost per board foot", value: money(price.costPerBft) },
				{ label: "Cost per piece", value: money(price.costPerPiece) },
				{ label: "Cost per linear foot", value: money(price.costPerLinearFoot) },
				...(price.packs !== null ? [{ label: "Packs", value: `${price.packs}`, hint: `${state.piecesPerPack} pieces per pack` }] : []),
				{ label: "Total cost", value: money(price.totalCost), strong: true },
			]
		: [];

	const squareRows: ResultRow[] = section
		? [
				{ label: `Area covered by ${format(length)}`, value: fmtArea(coverageSquareFeet(section.width, length, state.gap ?? 0)) },
				{ label: "Board feet in that length", value: fmtBft(boardFeet(section, length)) },
			]
		: [];
	const needed = section ? lengthForCoverage(section.width, state.area, state.waste, state.gap ?? 0) : 0;
	const neededBoards = section && length > 0 ? Math.ceil(needed / length) : 0;
	const areaRows: ResultRow[] = section
		? [
				{ label: `Board length to cover ${fmtArea(state.area)}`, value: format(Math.ceil(needed / 12) * 12), hint: `rounded up to whole feet, ${state.waste}% waste` },
				{ label: `Boards at ${format(length)}`, value: `${neededBoards}` },
				{ label: "Board feet", value: fmtBft(boardFeet(section, needed)) },
				{ label: "Cost", value: money(boardFeet(section, needed) * state.costPerBft), strong: true },
			]
		: [];

	const cubicRows: ResultRow[] = section
		? [
				{ label: `Volume of ${format(length)}`, value: fmtVol(cubicFeet(section, length)) },
				{ label: "Board feet", value: fmtBft(boardFeet(section, length)) },
				{ label: "Cost at price per foot", value: money((length / 12) * state.costPerFoot) },
				{ label: `Cost at price per ${volUnit}`, value: money(cubicFeet(section, length) * costPerFt3), strong: true },
			]
		: [];
	const lenForCubic = section ? lengthForCubicFeet(section, state.cubic) : 0;
	const fromCubicRows: ResultRow[] = section
		? [
				{ label: `Length in ${fmtVol(state.cubic)}`, value: format(lenForCubic) },
				{ label: "Board feet", value: fmtBft(state.cubic * 12) },
				{ label: `Cost at price per ${volUnit}`, value: money(state.cubic * costPerFt3), strong: true },
			]
		: [];
	const logFt3 = logVolumeCubicFeet(state.logLength ?? 0, state.logSize ?? 0, state.logMeasure);
	const logRows: ResultRow[] = [
		{ label: "Log volume", value: fmtVol(logFt3), hint: "treated as a cylinder" },
		{ label: "Board feet", value: fmtBft(logFt3 * 12), hint: "gross, before sawing losses" },
	];

	const lengthField = <DimensionInput id="lumber-length" label="Piece length" value={state.length} onChange={set("length")} min={12} max={288} step={12} />;

	return (
		<div className={styles.container}>
			<div className="flex flex-col gap-6">
				<UnitAndPrecisionBar />

				<SegmentedControl options={MODES} value={state.mode} onChange={set("mode")} label="Calculator mode" />

				<section className={styles.card} aria-labelledby="lumber-board-heading">
					<h2 id="lumber-board-heading" className={styles.cardTitle}>
						Board
					</h2>
					<div className="grid gap-4 md:grid-cols-3">
						<div className="flex flex-col gap-1">
							<label htmlFor="lumber-size" className={styles.label}>
								Size
							</label>
							<select id="lumber-size" className={styles.select} value={state.size} onChange={(e) => set("size")(e.target.value)}>
								{ALL_LUMBER_SIZES.map((s) => (
									<option key={s.nominal} value={s.nominal}>
										{s.nominal}
									</option>
								))}
								<option value="custom">Custom actual size</option>
							</select>
							{state.size !== "custom" && section && <span className={styles.echo}>Actual {sectionLabel}</span>}
						</div>
						{state.size === "custom" ? (
							<>
								<DimensionInput id="lumber-thickness" label="Thickness" value={state.customThickness} onChange={set("customThickness")} hint="Actual, not nominal" />
								<DimensionInput id="lumber-width" label="Width" value={state.customWidth} onChange={set("customWidth")} hint="Actual, not nominal" />
								{lengthField}
							</>
						) : (
							<div className="md:col-span-2">{lengthField}</div>
						)}
					</div>
				</section>

				{state.mode === "price" && (
					<div className="grid gap-4 lg:grid-cols-2">
						<section className={styles.card} aria-labelledby="lumber-price-heading">
							<h2 id="lumber-price-heading" className={styles.cardTitle}>
								Price per thousand board feet
							</h2>
							<div className="grid gap-4 sm:grid-cols-2">
								<NumberField id="lumber-pieces" label="Pieces needed" value={state.pieces} onChange={set("pieces")} step={1} />
								<NumberField id="lumber-cost1000" label="Cost per 1000 board feet" prefix="$" value={state.costPer1000} onChange={set("costPer1000")} step={0.01} />
								<NumberField id="lumber-pack" label="Pieces per pack" value={state.piecesPerPack} onChange={set("piecesPerPack")} step={1} hint="Leave 0 if not sold in packs" />
							</div>
							<p className={styles.note}>A board foot is a piece 12&quot; wide, 12&quot; long and 1&quot; thick. The cost per board foot is worked out first, then applied to the actual size of each piece.</p>
							<button type="button" className={styles.btn} onClick={addToTotal} disabled={!price || price.totalBft === 0}>
								<PlusIcon className="w-4 h-4" />
								Add to total
							</button>
						</section>
						<div className="flex flex-col gap-4">
							<ResultList title="This calculation" rows={priceRows} />
							{totals.length > 0 && (
								<section className={styles.card} aria-labelledby="lumber-totals-heading">
									<h2 id="lumber-totals-heading" className={styles.cardTitle}>
										Running total
									</h2>
									<table className={styles.table} aria-labelledby="lumber-totals-heading">
										<thead>
											<tr>
												<th scope="col">Item</th>
												<th scope="col">Board feet</th>
												<th scope="col">Cost</th>
												<th scope="col">
													<span className="sr-only">Remove</span>
												</th>
											</tr>
										</thead>
										<tbody>
											{totals.map((row) => (
												<tr key={row.id}>
													<td>{row.label}</td>
													<td className={styles.mono}>{num(row.bft, 3)}</td>
													<td className={styles.mono}>{money(row.cost)}</td>
													<td>
														<button type="button" className={styles.iconBtn} aria-label={`Remove ${row.label}`} onClick={() => setTotals((rows) => rows.filter((r) => r.id !== row.id))}>
															<TrashIcon className="w-4 h-4" />
														</button>
													</td>
												</tr>
											))}
										</tbody>
										<tfoot>
											<tr>
												<th scope="row">{grand.pieces} pieces</th>
												<td className={styles.mono}>{num(grand.bft, 3)}</td>
												<td className={styles.mono}>{money(grand.cost)}</td>
												<td />
											</tr>
										</tfoot>
									</table>
								</section>
							)}
						</div>
					</div>
				)}

				{state.mode === "square" && (
					<div className="grid gap-4 lg:grid-cols-2">
						<section className={styles.card} aria-labelledby="lumber-square-heading">
							<h2 id="lumber-square-heading" className={styles.cardTitle}>
								Linear to square
							</h2>
							<p className={styles.note}>Length is measured along a board, area is what the boards cover. The board width above ties the two together. Add a gap if the boards are laid with spacing, as decking is.</p>
							<div className="grid gap-4 sm:grid-cols-2">
								<DimensionInput id="lumber-gap" label="Gap between boards" value={state.gap} onChange={set("gap")} />
							</div>
							<ResultList rows={squareRows} className="mt-4" />
						</section>
						<section className={styles.card} aria-labelledby="lumber-area-heading">
							<h2 id="lumber-area-heading" className={styles.cardTitle}>
								Square to linear
							</h2>
							<div className="grid gap-4 sm:grid-cols-3">
								<NumberField id="lumber-area" label="Area to cover" unit={areaUnit} value={areaShown} onChange={setArea} step={0.01} />
								<NumberField id="lumber-waste" label="Plus waste" unit="%" value={state.waste} onChange={set("waste")} step={1} />
								<NumberField id="lumber-costbft" label="Cost per board foot" prefix="$" value={state.costPerBft} onChange={set("costPerBft")} step={0.01} />
							</div>
							<ResultList rows={areaRows} className="mt-4" />
						</section>
					</div>
				)}

				{state.mode === "cubic" && (
					<div className="grid gap-4 lg:grid-cols-2">
						<section className={styles.card} aria-labelledby="lumber-cubic-heading">
							<h2 id="lumber-cubic-heading" className={styles.cardTitle}>
								Linear to cubic
							</h2>
							<div className="grid gap-4 sm:grid-cols-2">
								<NumberField id="lumber-costft" label="Cost per linear foot" prefix="$" value={state.costPerFoot} onChange={set("costPerFoot")} step={0.01} />
								<NumberField id="lumber-costft3" label={`Cost per ${volUnit}`} prefix="$" value={state.costPerFt3} onChange={set("costPerFt3")} step={0.01} />
							</div>
							<ResultList rows={cubicRows} className="mt-4" />
						</section>
						<section className={styles.card} aria-labelledby="lumber-fromcubic-heading">
							<h2 id="lumber-fromcubic-heading" className={styles.cardTitle}>
								Cubic to linear
							</h2>
							<div className="grid gap-4 sm:grid-cols-2">
								<NumberField id="lumber-cubic" label="Volume" unit={volUnit} value={cubicShown} onChange={setCubic} step={0.01} />
							</div>
							<ResultList rows={fromCubicRows} className="mt-4" />
						</section>
						<section className={styles.card} aria-labelledby="lumber-log-heading">
							<h2 id="lumber-log-heading" className={styles.cardTitle}>
								Log volume
							</h2>
							<div className="grid gap-4 sm:grid-cols-3">
								<DimensionInput id="lumber-log-length" label="Log length" value={state.logLength} onChange={set("logLength")} />
								<div className="flex flex-col gap-1">
									<span className={styles.label}>Measured as</span>
									<SegmentedControl
										size="sm"
										label="Log measurement"
										options={[
											{ value: "diameter", label: "Diameter" },
											{ value: "girth", label: "Girth" },
										]}
										value={state.logMeasure}
										onChange={set("logMeasure")}
									/>
								</div>
								<DimensionInput id="lumber-log-size" label={state.logMeasure === "diameter" ? "Diameter" : "Girth"} value={state.logSize} onChange={set("logSize")} />
							</div>
							<ResultList rows={logRows} className="mt-4" />
						</section>
					</div>
				)}

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
