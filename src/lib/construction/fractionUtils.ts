/**
 * Fraction / decimal / mm conversion helpers for the inch fraction converter: the clickable
 * fraction tables, the wheel's label formatting, and the free-form inch expression evaluator.
 *
 * Everything is in inches; see `imperialUtils` for parsing and fraction formatting.
 */

import { inchesToMm, parseDimension, formatLength, toFraction } from "./imperialUtils";

// ── Wheel ────────────────────────────────────────────────────────────────────

/** Tick density of the fraction ring. */
export type WheelPrecision = 16 | 32 | 64 | 128;

export const WHEEL_PRECISIONS: { value: WheelPrecision; label: string }[] = [
	{ value: 16, label: "1/16" },
	{ value: 32, label: "1/32" },
	{ value: 64, label: "1/64" },
	{ value: 128, label: "1/128" },
];

export type ConvertTarget = "decimal" | "mm";

export interface ConvertOption {
	id: string;
	label: string;
	target: ConvertTarget;
	/** Decimal places shown for the converted value */
	places: number;
	/** Label the decimal ring at every step instead of labelling each fraction with its conversion */
	ringLabels?: boolean;
}

export const CONVERT_OPTIONS: ConvertOption[] = [
	{ id: "dec-steps", label: 'Decimal ring in 0.01" steps', target: "decimal", places: 2, ringLabels: true },
	{ id: "dec-2", label: 'Fraction to decimal (0.01")', target: "decimal", places: 2 },
	{ id: "dec-3", label: 'Fraction to decimal (0.001")', target: "decimal", places: 3 },
	{ id: "dec-4", label: 'Fraction to decimal (0.0001")', target: "decimal", places: 4 },
	{ id: "mm-2", label: "Fraction to mm (0.01)", target: "mm", places: 2 },
	{ id: "mm-3", label: "Fraction to mm (0.001)", target: "mm", places: 3 },
];

export function convertOption(id: string): ConvertOption {
	return CONVERT_OPTIONS.find((o) => o.id === id) ?? CONVERT_OPTIONS[1];
}

export interface ZeroOptions {
	/** Keep trailing zeros so every value has the same number of places. Default false. */
	padZeros?: boolean;
	/** Keep the zero before the point (0.5 rather than .5). Default true. */
	leadingZero?: boolean;
}

/** Format a decimal already at the right unit with the pad / leading-zero rules. */
export function formatDecimal(value: number, places: number, opts: ZeroOptions = {}): string {
	const padZeros = opts.padZeros ?? false;
	const leadingZero = opts.leadingZero ?? true;
	// Round in decimal space first so binary near-ties (4.7625 → 4.762) land on the half-up side.
	const f = 10 ** places;
	let text = (Math.round(value * f + Math.sign(value) * 1e-9) / f).toFixed(places);
	if (!padZeros && text.includes(".")) text = text.replace(/\.?0+$/, "");
	if (!leadingZero) text = text.replace(/^(-?)0\./, "$1.");
	return text === "-0" ? "0" : text;
}

/** The converted value for a fraction (in inches) under a convert option. */
export function formatConverted(inches: number, option: ConvertOption, opts: ZeroOptions = {}): string {
	const value = option.target === "mm" ? inchesToMm(inches) : inches;
	return formatDecimal(value, option.places, opts);
}

/** Fraction text such as `3/8`, `1 1/2` or `1` at the given denominator. */
export function fractionText(inches: number, denominator: 8 | 16 | 32 | 64 | 128): string {
	const f = toFraction(inches, denominator);
	const sign = f.negative ? "-" : "";
	if (f.numerator === 0) return `${sign}${f.whole}`;
	const frac = `${f.numerator}/${f.denominator}`;
	return f.whole === 0 ? `${sign}${frac}` : `${sign}${f.whole} ${frac}`;
}

// ── Tables ───────────────────────────────────────────────────────────────────

export type TableDenominator = 8 | 16 | 32 | 64;

export const TABLE_DENOMINATORS: { value: TableDenominator; label: string }[] = [
	{ value: 8, label: "Eighths" },
	{ value: 16, label: "Sixteenths" },
	{ value: 32, label: "Thirty-seconds" },
	{ value: 64, label: "Sixty-fourths" },
];

export interface FractionEntry {
	/** Reduced fraction text, `1` for the whole inch */
	label: string;
	inches: number;
}

/** Every n/d from 1/d up to the whole inch, reduced. */
export function fractionTable(denominator: TableDenominator): FractionEntry[] {
	const rows: FractionEntry[] = [];
	for (let n = 1; n <= denominator; n++) {
		const inches = n / denominator;
		rows.push({ label: fractionText(inches, denominator), inches });
	}
	return rows;
}

// ── Free-form converter ──────────────────────────────────────────────────────

/** Output precision of the free-form converter: a fraction denominator or decimal places. */
export type ConverterPrecision = "8" | "16" | "32" | "64" | "0.1" | "0.01" | "0.001";

export const CONVERTER_PRECISIONS: { value: ConverterPrecision; label: string }[] = [
	{ value: "8", label: "1/8" },
	{ value: "16", label: "1/16" },
	{ value: "32", label: "1/32" },
	{ value: "64", label: "1/64" },
	{ value: "0.1", label: "0.1" },
	{ value: "0.01", label: "0.01" },
	{ value: "0.001", label: "0.001" },
];

/** Inches formatted at a converter precision, always with the inch mark. */
export function formatAtConverterPrecision(inches: number, precision: ConverterPrecision): string {
	switch (precision) {
		case "0.1":
			return `${formatDecimal(inches, 1)}"`;
		case "0.01":
			return `${formatDecimal(inches, 2)}"`;
		case "0.001":
			return `${formatDecimal(inches, 3)}"`;
		default:
			return formatLength(inches, { mode: "in", precision: Number(precision) as 8 | 16 | 32 | 64 });
	}
}

type Operator = "+" | "−" | "×" | "÷";

/**
 * Evaluate an inch expression such as `3 1/2 + 1/8 × 2` or `1' 2" − 3/4` to inches.
 * Operands use the dimension grammar (fractions, mixed numbers, feet and inch marks).
 * `×`/`*`, `÷`, `+` and `−` are operators; an ASCII hyphen counts as minus only when it has a
 * space on both sides, so `3-1/2` stays a mixed number. Returns null when it cannot be read.
 */
export function evaluateInchExpression(expression: string): number | null {
	const text = expression
		.replace(/\s-\s/g, " − ")
		.replace(/\*/g, "×")
		.replace(/(?<![\d\s'"/])x(?![\d\s])/gi, "×")
		.trim();
	if (!text) return null;

	const parts = text.split(/\s*([+−×÷])\s*/);
	const values: number[] = [];
	const ops: Operator[] = [];
	for (let i = 0; i < parts.length; i++) {
		if (i % 2 === 0) {
			const v = parseDimension(parts[i], "in");
			if (v === null) return null;
			values.push(v);
		} else {
			ops.push(parts[i] as Operator);
		}
	}

	// × and ÷ first
	for (let i = 0; i < ops.length; ) {
		if (ops[i] === "×" || ops[i] === "÷") {
			const a = values[i];
			const b = values[i + 1];
			if (ops[i] === "÷" && b === 0) return null;
			values.splice(i, 2, ops[i] === "×" ? a * b : a / b);
			ops.splice(i, 1);
		} else {
			i++;
		}
	}
	let result = values[0];
	for (let i = 0; i < ops.length; i++) {
		result = ops[i] === "+" ? result + values[i + 1] : result - values[i + 1];
	}
	return Number.isFinite(result) ? result : null;
}
