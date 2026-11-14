"use client";

import { useMemo, useState } from "react";
import { CheckIcon, ClipboardDocumentIcon, TrashIcon, XMarkIcon } from "@heroicons/react/24/outline";
import SegmentedControl from "@/components/SegmentedControl";
import { UnitAndPrecisionBar, PrintDiagrams, ResultList, LumberTable, ShareCalculation, ConstructionNotes } from "@/components/construction";
import type { ResultRow } from "@/components/construction";
import { useClipboard } from "@/hooks/useClipboard";
import { useConstructionUnits } from "@/hooks/useConstructionUnits";
import { inchesToMm } from "@/lib/construction/imperialUtils";
import {
	CONVERTER_PRECISIONS,
	CONVERT_OPTIONS,
	TABLE_DENOMINATORS,
	WHEEL_PRECISIONS,
	convertOption,
	evaluateInchExpression,
	formatAtConverterPrecision,
	formatDecimal,
	fractionTable,
	type ConverterPrecision,
	type WheelPrecision,
} from "@/lib/construction/fractionUtils";
import FractionWheel from "./FractionWheel";
import styles from "./FractionConverter.module.scss";

interface ConverterState {
	wheelPrecision: WheelPrecision;
	convert: string;
	padZeros: boolean;
	leadingZero: boolean;
	/** Fractions added from the tables, in inches */
	measures: number[];
	expression: string;
	converterPrecision: ConverterPrecision;
}

const DEFAULTS: ConverterState = {
	wheelPrecision: 16,
	convert: "dec-2",
	padZeros: false,
	leadingZero: true,
	measures: [],
	expression: "",
	converterPrecision: "16",
};

const KEYPAD: { key: string; insert: string; label?: string; wide?: boolean }[] = [
	{ key: "7", insert: "7" },
	{ key: "8", insert: "8" },
	{ key: "9", insert: "9" },
	{ key: "÷", insert: " ÷ " },
	{ key: "4", insert: "4" },
	{ key: "5", insert: "5" },
	{ key: "6", insert: "6" },
	{ key: "×", insert: " × " },
	{ key: "1", insert: "1" },
	{ key: "2", insert: "2" },
	{ key: "3", insert: "3" },
	{ key: "−", insert: " − " },
	{ key: "0", insert: "0" },
	{ key: ".", insert: "." },
	{ key: "/", insert: "/", label: "fraction bar" },
	{ key: "+", insert: " + " },
	{ key: "'", insert: "' ", label: "feet mark" },
	{ key: "␣", insert: " ", label: "space" },
];

export default function FractionConverter() {
	const { format } = useConstructionUnits();
	const { copy, isCopied } = useClipboard();
	const [state, setState] = useState<ConverterState>(DEFAULTS);
	const set = <K extends keyof ConverterState>(key: K) => (value: ConverterState[K]) => setState((s) => ({ ...s, [key]: value }));

	const option = convertOption(state.convert);
	const zeros = { padZeros: state.padZeros, leadingZero: state.leadingZero };
	const tables = useMemo(() => TABLE_DENOMINATORS.map((d) => ({ ...d, rows: fractionTable(d.value) })), []);

	const measureTotal = state.measures.reduce((a, b) => a + b, 0);
	const result = useMemo(() => evaluateInchExpression(state.expression), [state.expression]);
	const highlight = result ?? (state.measures.length ? measureTotal : null);

	const addMeasure = (inches: number) => set("measures")([...state.measures, inches]);
	const removeMeasure = (index: number) => set("measures")(state.measures.filter((_, i) => i !== index));
	const press = (insert: string) => set("expression")(state.expression + insert);
	const backspace = () => set("expression")(state.expression.trimEnd().slice(0, -1).trimEnd());

	const measureRows: ResultRow[] = state.measures.length
		? [
				{ label: "Length", value: format(measureTotal), strong: true },
				{ label: "Decimal inches", value: `${formatDecimal(measureTotal, 4)}"` },
				{ label: "Millimetres", value: `${formatDecimal(inchesToMm(measureTotal), 3)} mm` },
			]
		: [];

	const resultText = result !== null ? formatAtConverterPrecision(result, state.converterPrecision) : null;
	const resultRows: ResultRow[] = resultText
		? [
				{ label: "Result", value: resultText, strong: true },
				{ label: "Decimal inches", value: `${formatDecimal(result!, 4)}"` },
				{ label: "Millimetres", value: `${formatDecimal(inchesToMm(result!), 3)} mm` },
				{ label: "In site units", value: format(result!) },
			]
		: [];

	return (
		<div className={styles.container}>
			<div className="flex flex-col gap-6">
				<UnitAndPrecisionBar />

				<section className={styles.card} aria-labelledby="wheel-heading">
					<h2 id="wheel-heading" className={styles.cardTitle}>
						Inch fraction, decimal and mm wheel
					</h2>
					<p className={styles.note}>
						One turn of the wheel is one inch. Fraction ticks run outward from the shared ring and decimal or mm ticks run inward, so you can see how closely a conversion matches by how
						the tick marks line up. Click a fraction in the tables or type in the converter to point it out.
					</p>
					<div className="flex flex-wrap items-end gap-x-6 gap-y-3 mb-4">
						<div className="flex flex-col gap-1">
							<span className={styles.label}>Wheel precision</span>
							<SegmentedControl<`${WheelPrecision}`>
								label="Wheel precision"
								size="sm"
								fill={false}
								value={`${state.wheelPrecision}`}
								onChange={(v) => set("wheelPrecision")(Number(v) as WheelPrecision)}
								options={WHEEL_PRECISIONS.map((p) => ({ value: `${p.value}` as `${WheelPrecision}`, label: p.label }))}
							/>
						</div>
						<div className="flex flex-col gap-1">
							<label htmlFor="wheel-convert" className={styles.label}>
								Convert
							</label>
							<select id="wheel-convert" className={styles.select} value={state.convert} onChange={(e) => set("convert")(e.target.value)}>
								{CONVERT_OPTIONS.map((o) => (
									<option key={o.id} value={o.id}>
										{o.label}
									</option>
								))}
							</select>
						</div>
						<label className={styles.check}>
							<input type="checkbox" checked={state.padZeros} onChange={(e) => set("padZeros")(e.target.checked)} />
							Pad zeros
						</label>
						<label className={styles.check}>
							<input type="checkbox" checked={state.leadingZero} onChange={(e) => set("leadingZero")(e.target.checked)} />
							Leading zero
						</label>
					</div>
					<PrintDiagrams title="Inch fraction, decimal and mm wheel" subtitle={`Fraction ring at 1/${state.wheelPrecision}, ${option.label.toLowerCase()}`}>
						<FractionWheel precision={state.wheelPrecision} option={option} zeros={zeros} highlight={highlight} />
					</PrintDiagrams>
				</section>

				<section className={styles.card} aria-labelledby="tables-heading">
					<h2 id="tables-heading" className={styles.cardTitle}>
						Fraction tables
					</h2>
					<p className={styles.note}>Click entries to add fractions together. Hover an entry to see its mm value. Click a fraction in the list to remove it.</p>
					<div className="grid gap-4 lg:grid-cols-2 mb-4">
						<div className="flex flex-col gap-2">
							<div className="flex items-center justify-between gap-2">
								<h3 id="measure-heading" className={styles.tableTitle}>
									Measure
								</h3>
								{state.measures.length > 0 && (
									<button type="button" className={styles.iconBtn} onClick={() => set("measures")([])} aria-label="Clear measure list">
										<TrashIcon className="w-4 h-4" />
									</button>
								)}
							</div>
							{state.measures.length === 0 ? (
								<p className={styles.empty}>No fractions added yet.</p>
							) : (
								<ul className={styles.chips} aria-labelledby="measure-heading">
									{state.measures.map((m, i) => (
										<li key={`${m}-${i}`}>
											<button type="button" className={styles.chip} onClick={() => removeMeasure(i)} aria-label={`Remove ${format(m, { mode: "in" })}`}>
												{format(m, { mode: "in" })}
												<XMarkIcon className="w-3 h-3" />
											</button>
										</li>
									))}
								</ul>
							)}
						</div>
						{measureRows.length > 0 && (
							<div className="flex flex-col gap-2">
								<ResultList title="Measure length" rows={measureRows} />
								<button type="button" className={styles.btn} onClick={() => copy(format(measureTotal), "measure")}>
									{isCopied("measure") ? <CheckIcon className="w-4 h-4" /> : <ClipboardDocumentIcon className="w-4 h-4" />}
									{isCopied("measure") ? "Copied" : "Copy length"}
								</button>
							</div>
						)}
					</div>
					<div className="grid gap-4 grid-cols-2 md:grid-cols-4">
						{tables.map((t) => (
							<div key={t.value} className="flex flex-col gap-1">
								<h3 className={styles.tableTitle}>{t.label}</h3>
								<ul className={styles.fractionList} aria-label={t.label}>
									{t.rows.map((row) => (
										<li key={row.label}>
											<button
												type="button"
												className={styles.entry}
												onClick={() => addMeasure(row.inches)}
												title={`${formatDecimal(inchesToMm(row.inches), 3)} mm`}
												aria-label={`Add ${row.label} inch: ${formatDecimal(row.inches, 4)} inches, ${formatDecimal(inchesToMm(row.inches), 3)} mm`}
											>
												<span className={styles.entryFraction}>{row.label}</span>
												<span className={styles.entryDecimal}>{formatConvertedCell(row.inches, option.target === "mm", zeros)}</span>
											</button>
										</li>
									))}
								</ul>
							</div>
						))}
					</div>

				</section>

				<section className={styles.card} aria-labelledby="converter-heading">
					<h2 id="converter-heading" className={styles.cardTitle}>
						Fraction and decimal converter
					</h2>
					<p className={styles.note}>
						Type any inch value or sum: <span className={styles.mono}>3 1/2 + 1/8</span>, <span className={styles.mono}>1&apos; 2&quot; × 2</span>, <span className={styles.mono}>3.625</span>. A hyphen
						joins a mixed number (<span className={styles.mono}>3-1/2</span>); use the minus key to subtract.
					</p>
					<div className="grid gap-4 lg:grid-cols-2">
						<div className="flex flex-col gap-3">
							<div className="grid gap-3 sm:grid-cols-[1fr_auto]">
								<div className="flex flex-col gap-1">
									<label htmlFor="converter-input" className={styles.label}>
										Inches
									</label>
									<input
										id="converter-input"
										type="text"
										inputMode="decimal"
										className={styles.input}
										value={state.expression}
										onChange={(e) => set("expression")(e.target.value)}
										placeholder="3 1/2 + 1/8"
										aria-invalid={state.expression.trim() !== "" && result === null}
										aria-describedby="converter-hint"
									/>
								</div>
								<div className="flex flex-col gap-1">
									<label htmlFor="converter-precision" className={styles.label}>
										Precision
									</label>
									<select id="converter-precision" className={styles.select} value={state.converterPrecision} onChange={(e) => set("converterPrecision")(e.target.value as ConverterPrecision)}>
										{CONVERTER_PRECISIONS.map((p) => (
											<option key={p.value} value={p.value}>
												{p.label}
											</option>
										))}
									</select>
								</div>
							</div>
							<p id="converter-hint" className={styles.hint}>
								{state.expression.trim() !== "" && result === null ? "Could not read that. Check the fractions and operators." : "Fractions, mixed numbers, feet and inch marks are all accepted."}
							</p>
							<div className={styles.keypad} role="group" aria-label="Keypad">
								{KEYPAD.map((k) => (
									<button key={k.key} type="button" className={styles.key} onClick={() => press(k.insert)} aria-label={k.label ?? k.key}>
										{k.key}
									</button>
								))}
								<button type="button" className={styles.key} onClick={backspace} aria-label="Backspace">
									⌫
								</button>
								<button type="button" className={`${styles.key} ${styles.keyClear}`} onClick={() => set("expression")("")} aria-label="Clear">
									C
								</button>
							</div>
						</div>
						<div className="flex flex-col gap-2">
							{resultText ? (
								<>
									<ResultList rows={resultRows} />
									<button type="button" className={styles.btn} onClick={() => copy(resultText, "result")}>
										{isCopied("result") ? <CheckIcon className="w-4 h-4" /> : <ClipboardDocumentIcon className="w-4 h-4" />}
										{isCopied("result") ? "Copied" : "Copy result"}
									</button>
								</>
							) : (
								<p className={styles.empty}>The result appears here and is pointed out on the wheel.</p>
							)}
						</div>
					</div>
				</section>

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

function formatConvertedCell(inches: number, mm: boolean, zeros: { padZeros: boolean; leadingZero: boolean }): string {
	return mm ? `${formatDecimal(inchesToMm(inches), 2, zeros)} mm` : formatDecimal(inches, 4, zeros);
}
