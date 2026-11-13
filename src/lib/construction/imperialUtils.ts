/**
 * Feet / inch / fraction parsing and formatting for the construction tools.
 *
 * Every construction library works in canonical INCHES. The unit mode only decides how text
 * is read and how numbers are written back out.
 */

export type UnitMode = "ft-in" | "in" | "mm";

/** Fraction denominator for output, or 0 for decimal inches. */
export type FractionPrecision = 8 | 16 | 32 | 64 | 0;

export const UNIT_MODES: { value: UnitMode; label: string; short: string }[] = [
	{ value: "ft-in", label: "Feet-Inch", short: "ft in" },
	{ value: "in", label: "Inch", short: "in" },
	{ value: "mm", label: "Metric", short: "mm" },
];

export const FRACTION_PRECISIONS: { value: FractionPrecision; label: string }[] = [
	{ value: 8, label: "1/8" },
	{ value: 16, label: "1/16" },
	{ value: 32, label: "1/32" },
	{ value: 64, label: "1/64" },
	{ value: 0, label: "Decimal" },
];

export const MM_PER_INCH = 25.4;

export function mmToInches(mm: number): number {
	return mm / MM_PER_INCH;
}

export function inchesToMm(inches: number): number {
	return inches * MM_PER_INCH;
}

// ── Parsing ──────────────────────────────────────────────────────────────────

const NUMBER = "(?:\\d+(?:\\.\\d*)?|\\.\\d+)";
const FRACTION = `(\\d+)\\s*/\\s*(\\d+)`;
const NUMBER_RE = new RegExp(`^${NUMBER}$`);

/**
 * Parse an inch expression without unit marks into inches:
 * `3`, `3.5`, `1/2`, `3 1/2`, `3-1/2`, `3~1/2`, `3 1 2` (whole numerator denominator).
 */
function parseInchPart(raw: string): number | null {
	const text = raw
		.trim()
		.replace(/(\d)\s*[~-]\s*(\d+\s*\/)/g, "$1 $2") // 3-1/2, 3~1/2 → 3 1/2
		.replace(/\s+/g, " ");
	if (!text) return null;

	// whole numerator/denominator or numerator/denominator
	let m = text.match(new RegExp(`^(?:(${NUMBER})\\s+)?${FRACTION}$`));
	if (m) {
		const whole = m[1] ? parseFloat(m[1]) : 0;
		const num = parseInt(m[2], 10);
		const den = parseInt(m[3], 10);
		if (den === 0) return null;
		return whole + num / den;
	}

	// whole numerator denominator (space separated)
	m = text.match(new RegExp(`^(${NUMBER})\\s+(\\d+)\\s+(\\d+)$`));
	if (m) {
		const den = parseInt(m[3], 10);
		if (den === 0) return null;
		return parseFloat(m[1]) + parseInt(m[2], 10) / den;
	}

	if (NUMBER_RE.test(text)) return parseFloat(text);
	return null;
}

/**
 * Parse user text in the given unit mode and return inches, or null when the text cannot be read.
 *
 * ft-in: `10' 3 1/2"`, `10 ft 3 in`, `10'`, `3"`, `120 3/4` (bare numbers are inches).
 * in:    same grammar, feet marks still honoured.
 * mm:    a plain number, optional `mm` suffix.
 */
export function parseDimension(text: string, mode: UnitMode): number | null {
	const trimmed = text.trim().toLowerCase();
	if (!trimmed) return null;

	if (mode === "mm") {
		const m = trimmed.match(new RegExp(`^(-?${NUMBER})\\s*(?:mm)?$`));
		return m ? mmToInches(parseFloat(m[1])) : null;
	}

	let negative = false;
	let body = trimmed;
	if (body.startsWith("-")) {
		negative = true;
		body = body.slice(1).trim();
	}

	// Normalise unit words to marks, then split on the foot mark.
	body = body
		.replace(/\s*(?:feet|foot|ft)\.?\s*/g, "' ")
		.replace(/\s*(?:inches|inch|in)\.?\s*$/g, '"')
		.replace(/[″”]/g, '"')
		.replace(/[′’]/g, "'");

	let feet = 0;
	let inchText = body;
	const footIdx = body.indexOf("'");
	if (footIdx >= 0) {
		const feetText = body.slice(0, footIdx).trim();
		if (!NUMBER_RE.test(feetText)) return null;
		feet = parseFloat(feetText);
		inchText = body.slice(footIdx + 1);
	}

	inchText = inchText.replace(/"/g, "").trim();
	if (inchText.includes("'")) return null;

	let inches = 0;
	if (inchText) {
		let parsed = parseInchPart(inchText);
		// Feet-inch mode with no foot mark: "5 10" or "4 10 1/2" reads as feet then inches when the
		// text is not already a valid inch value ("120 3 4" stays 120 3/4).
		if (parsed === null && mode === "ft-in" && footIdx < 0) {
			const m = inchText.match(/^(\d+)\s+(.+)$/);
			const rest = m ? parseInchPart(m[2]) : null;
			if (m && rest !== null) {
				feet = parseInt(m[1], 10);
				parsed = rest;
			}
		}
		if (parsed === null) return null;
		inches = parsed;
	}

	const total = feet * 12 + inches;
	return negative ? -total : total;
}

// ── Rounding and fractions ───────────────────────────────────────────────────

export function roundToPrecision(inches: number, precision: FractionPrecision): number {
	if (precision === 0) return inches;
	return Math.round(inches * precision) / precision;
}

export interface Fraction {
	whole: number;
	numerator: number;
	denominator: number;
	negative: boolean;
}

function gcd(a: number, b: number): number {
	while (b) [a, b] = [b, a % b];
	return a;
}

/** Nearest fraction at the denominator, reduced, with the carry applied (15 8/8 → 16). */
export function toFraction(inches: number, denominator: 8 | 16 | 32 | 64): Fraction {
	const negative = inches < 0;
	const units = Math.round(Math.abs(inches) * denominator);
	const whole = Math.floor(units / denominator);
	let numerator = units - whole * denominator;
	let den: number = denominator;
	if (numerator === 0) {
		den = 1;
	} else {
		const g = gcd(numerator, den);
		numerator /= g;
		den /= g;
	}
	return { whole, numerator, denominator: den, negative };
}

// ── Formatting ───────────────────────────────────────────────────────────────

export interface FormatOptions {
	mode: UnitMode;
	precision: FractionPrecision;
	/** Append ' and " (or mm). Default true. */
	marks?: boolean;
	/** Decimal places for mm output. Default 1. */
	mmDecimals?: number;
}

function trimZeros(text: string): string {
	return text.includes(".") ? text.replace(/\.?0+$/, "") : text;
}

function formatInchValue(absInches: number, precision: FractionPrecision, marks: boolean): string {
	const mark = marks ? '"' : "";
	if (precision === 0) {
		return `${trimZeros(absInches.toFixed(3))}${mark}`;
	}
	const f = toFraction(absInches, precision);
	if (f.numerator === 0) return `${f.whole}${mark}`;
	const frac = `${f.numerator}/${f.denominator}`;
	return f.whole === 0 ? `${frac}${mark}` : `${f.whole} ${frac}${mark}`;
}

/** Format inches in the given mode: `10' 3 1/2"`, `123 1/2"`, `123.5"`, or `3136.9 mm`. */
export function formatLength(inches: number, opts: FormatOptions): string {
	const marks = opts.marks ?? true;
	const sign = inches < 0 ? "-" : "";
	const abs = Math.abs(inches);

	if (opts.mode === "mm") {
		const mm = trimZeros(inchesToMm(abs).toFixed(opts.mmDecimals ?? 1));
		return `${sign}${mm}${marks ? " mm" : ""}`;
	}

	if (opts.mode === "in") {
		return `${sign}${formatInchValue(abs, opts.precision, marks)}`;
	}

	// ft-in: round first so a carry into the next foot is handled once.
	const rounded = opts.precision === 0 ? abs : roundToPrecision(abs, opts.precision);
	const feet = Math.floor(rounded / 12 + 1e-9);
	const rest = rounded - feet * 12;
	if (feet === 0) return `${sign}${formatInchValue(rest, opts.precision, marks)}`;
	const inchPart = formatInchValue(rest, opts.precision, marks);
	return `${sign}${feet}${marks ? "'" : ""} ${inchPart}`;
}

// ── Lumber ───────────────────────────────────────────────────────────────────

export interface LumberSize {
	nominal: string;
	/** Actual thickness in inches */
	width: number;
	/** Actual depth in inches */
	depth: number;
}

/** Nominal softwood sizes and their actual dressed dimensions (inches). */
export const LUMBER_SIZES: LumberSize[] = [
	{ nominal: "1x2", width: 0.75, depth: 1.5 },
	{ nominal: "1x3", width: 0.75, depth: 2.5 },
	{ nominal: "1x4", width: 0.75, depth: 3.5 },
	{ nominal: "1x6", width: 0.75, depth: 5.5 },
	{ nominal: "1x8", width: 0.75, depth: 7.25 },
	{ nominal: "1x10", width: 0.75, depth: 9.25 },
	{ nominal: "1x12", width: 0.75, depth: 11.25 },
	{ nominal: "2x2", width: 1.5, depth: 1.5 },
	{ nominal: "2x3", width: 1.5, depth: 2.5 },
	{ nominal: "2x4", width: 1.5, depth: 3.5 },
	{ nominal: "2x6", width: 1.5, depth: 5.5 },
	{ nominal: "2x8", width: 1.5, depth: 7.25 },
	{ nominal: "2x10", width: 1.5, depth: 9.25 },
	{ nominal: "2x12", width: 1.5, depth: 11.25 },
	{ nominal: "4x4", width: 3.5, depth: 3.5 },
	{ nominal: "4x6", width: 3.5, depth: 5.5 },
	{ nominal: "6x6", width: 5.5, depth: 5.5 },
];

export function nominalToActual(nominal: string): LumberSize | undefined {
	const key = nominal.toLowerCase().replace(/\s+/g, "").replace("×", "x");
	return LUMBER_SIZES.find((s) => s.nominal === key);
}
