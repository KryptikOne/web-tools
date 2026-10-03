import { convertUnits, getUnitCategory } from "@/lib/unitDefinitions";
import type { Quantity, UnitMode } from "./types";

const UNICODE_FRACTIONS: Record<string, number> = {
	"¼": 0.25, "½": 0.5, "¾": 0.75, "⅓": 1 / 3, "⅔": 2 / 3, "⅛": 0.125, "⅜": 0.375, "⅝": 0.625, "⅞": 0.875,
};

const NUMBER_RE = /^(\d+\s+\d+\/\d+|\d+\/\d+|\d*[¼½¾⅓⅔⅛⅜⅝⅞]|\d+(?:\.\d+)?)/;

function readNumber(s: string): { value: number; rest: string } | null {
	const m = s.match(NUMBER_RE);
	if (!m) return null;
	const token = m[1];
	let value: number;
	if (/\s/.test(token)) {
		const [whole, frac] = token.split(/\s+/);
		const [n, d] = frac.split("/").map(Number);
		value = Number(whole) + n / d;
	} else if (token.includes("/")) {
		const [n, d] = token.split("/").map(Number);
		value = n / d;
	} else if (/[¼½¾⅓⅔⅛⅜⅝⅞]$/.test(token)) {
		const sym = token.slice(-1);
		value = Number(token.slice(0, -1) || 0) + UNICODE_FRACTIONS[sym];
	} else {
		value = Number(token);
	}
	return { value, rest: s.slice(token.length) };
}

// ── Units ────────────────────────────────────────────────────────────────────

type Family = "mass" | "volume";

interface UnitDef {
	id: string;
	family: Family;
	/** Unit id in unitDefinitions, or a literal factor to the family base (g or ml) */
	base: string | number;
	label: string;
	plural?: string;
}

const UNITS: UnitDef[] = [
	{ id: "g", family: "mass", base: "g", label: "g" },
	{ id: "kg", family: "mass", base: "kg", label: "kg" },
	{ id: "oz", family: "mass", base: "oz", label: "oz" },
	{ id: "lb", family: "mass", base: "lb", label: "lb" },
	{ id: "ml", family: "volume", base: "ml", label: "ml" },
	{ id: "l", family: "volume", base: "l", label: "l" },
	{ id: "cup", family: "volume", base: "cup_us", label: "cup", plural: "cups" },
	{ id: "floz", family: "volume", base: "floz_us", label: "fl oz" },
	// Not in unitDefinitions (kitchen-only sizes); US customary values in ml
	{ id: "tsp", family: "volume", base: 4.92892, label: "tsp" },
	{ id: "tbsp", family: "volume", base: 14.7868, label: "tbsp" },
];

const ALIASES: Record<string, string> = {
	g: "g", gram: "g", grams: "g", gr: "g",
	kg: "kg", kilogram: "kg", kilograms: "kg",
	oz: "oz", ounce: "oz", ounces: "oz",
	lb: "lb", lbs: "lb", pound: "lb", pounds: "lb",
	ml: "ml", milliliter: "ml", milliliters: "ml", millilitre: "ml", millilitres: "ml",
	l: "l", liter: "l", liters: "l", litre: "l", litres: "l",
	tsp: "tsp", tsps: "tsp", teaspoon: "tsp", teaspoons: "tsp", t: "tsp",
	tbsp: "tbsp", tbs: "tbsp", tbsps: "tbsp", tablespoon: "tbsp", tablespoons: "tbsp", T: "tbsp",
	cup: "cup", cups: "cup", c: "cup",
	"fl oz": "floz", floz: "floz", "fl. oz.": "floz", "fl. oz": "floz", "fluid ounce": "floz", "fluid ounces": "floz",
};

const WEIGHT = getUnitCategory("weight")!;
const VOLUME = getUnitCategory("volume")!;

function unitDef(id: string | null): UnitDef | undefined {
	return UNITS.find((u) => u.id === id);
}

/** Convert a value in `unit` to the family base (grams or millilitres). */
function toBase(value: number, u: UnitDef): number {
	if (typeof u.base === "number") return value * u.base;
	return u.family === "mass" ? convertUnits(WEIGHT, value, u.base, "g") : convertUnits(VOLUME, value, u.base, "ml");
}

function fromBase(value: number, u: UnitDef): number {
	if (typeof u.base === "number") return value / u.base;
	return u.family === "mass" ? convertUnits(WEIGHT, value, "g", u.base) : convertUnits(VOLUME, value, "ml", u.base);
}

function matchUnit(rest: string): string | null {
	const clean = rest.trim().replace(/\.$/, "");
	if (!clean) return null;
	if (ALIASES[clean]) return ALIASES[clean];
	const lower = clean.toLowerCase();
	if (ALIASES[lower]) return ALIASES[lower];
	return null;
}

// ── Public API ───────────────────────────────────────────────────────────────

export function parseQuantity(raw: string): Quantity {
	const text = raw.trim();
	const first = readNumber(text);
	if (!first) return { raw: text, value: null, unit: null, kind: "text" };

	let value: number | [number, number] = first.value;
	let rest = first.rest;
	const range = rest.match(/^\s*[-–]\s*/);
	if (range) {
		const second = readNumber(rest.slice(range[0].length));
		if (second) {
			value = [first.value, second.value];
			rest = second.rest;
		}
	}
	rest = rest.trim();
	const canonical = matchUnit(rest);
	if (canonical) {
		const def = unitDef(canonical)!;
		return { raw: text, value, unit: canonical, kind: def.family };
	}
	return { raw: text, value, unit: rest || null, kind: "count" };
}

function mapValue(value: number | [number, number], fn: (n: number) => number): number | [number, number] {
	return Array.isArray(value) ? [fn(value[0]), fn(value[1])] : fn(value);
}

/** Multiply by a factor. Text quantities pass through untouched. */
export function scaleQuantity(q: Quantity, factor: number): Quantity {
	if (q.value === null || factor === 1) return q;
	const scaled = { ...q, value: mapValue(q.value, (n) => n * factor) };
	return { ...scaled, raw: formatQuantity(scaled, "written") };
}

/** Re-express mass/volume in the target system. Written mode and counts/text are unchanged. */
export function convertQuantity(q: Quantity, mode: UnitMode): Quantity {
	if (mode === "written" || q.value === null || (q.kind !== "mass" && q.kind !== "volume")) return q;
	const def = unitDef(q.unit);
	if (!def) return q;
	const base = mapValue(q.value, (n) => toBase(n, def));
	const probe = Array.isArray(base) ? base[1] : base;
	let target: string;
	if (mode === "metric") {
		target = def.family === "mass" ? (probe >= 1000 ? "kg" : "g") : probe >= 1000 ? "l" : "ml";
	} else if (def.family === "mass") {
		target = probe >= 453.592 ? "lb" : "oz";
	} else {
		const tsp = probe / 4.92892;
		target = tsp < 3 ? "tsp" : tsp < 12 ? "tbsp" : "cup";
	}
	const targetDef = unitDef(target)!;
	const value = mapValue(base, (n) => fromBase(n, targetDef));
	const converted: Quantity = { ...q, value, unit: target };
	return { ...converted, raw: formatQuantity(converted, "written") };
}

// ── Formatting ───────────────────────────────────────────────────────────────

const KITCHEN_FRACTIONS: [number, string][] = [
	[0, ""], [0.25, "¼"], [1 / 3, "⅓"], [0.5, "½"], [2 / 3, "⅔"], [0.75, "¾"], [1, ""],
];

/** Snap to the fractions found on measuring spoons and cups. Kitchen measures are approximate by nature. */
function kitchenFraction(n: number): string {
	const whole = Math.floor(n);
	const frac = n - whole;
	let best = KITCHEN_FRACTIONS[0];
	for (const f of KITCHEN_FRACTIONS) if (Math.abs(f[0] - frac) < Math.abs(best[0] - frac)) best = f;
	const w = best[0] === 1 ? whole + 1 : whole;
	const sym = best[0] === 1 || best[0] === 0 ? "" : best[1];
	if (w === 0 && sym) return sym;
	return sym ? `${w}${sym}` : String(w);
}

function trim(s: string): string {
	return s.includes(".") ? s.replace(/\.?0+$/, "") : s;
}

function roundTo(n: number, step: number): number {
	return Math.round(n / step) * step;
}

function formatNumberFor(n: number, unit: string | null, kind: Quantity["kind"]): string {
	if (kind === "count") return trim((Math.round(n * 2) / 2).toFixed(1));
	switch (unit) {
		case "g": return String(n < 100 ? Math.round(n) : roundTo(n, 5));
		case "kg": return trim(n.toFixed(2));
		case "oz": return trim(n.toFixed(1));
		case "lb": return trim(n.toFixed(2));
		case "ml": return String(Math.round(n));
		case "l": return trim(n.toFixed(2));
		case "tsp":
		case "tbsp":
		case "cup":
		case "floz":
			return kitchenFraction(n);
		default:
			return trim(n.toFixed(2));
	}
}

function unitLabel(q: Quantity, n: number): string {
	if (q.kind === "count") return q.unit ? (n > 1 ? plural(q.unit) : q.unit) : "";
	const def = unitDef(q.unit);
	if (!def) return q.unit ?? "";
	return def.plural && n > 1 ? def.plural : def.label;
}

/** Human form in the requested unit mode, e.g. "1½ cups", "300 g", "2–3 cloves", "a pinch". */
export function formatQuantity(q: Quantity, mode: UnitMode): string {
	if (q.value === null) return q.raw;
	const c = mode === "written" ? q : convertQuantity(q, mode);
	const v = c.value!;
	const label = (n: number) => unitLabel(c, n);
	if (Array.isArray(v)) {
		const [a, b] = v;
		const text = `${formatNumberFor(a, c.unit, c.kind)}–${formatNumberFor(b, c.unit, c.kind)}`;
		return joinUnit(text, label(b));
	}
	return joinUnit(formatNumberFor(v, c.unit, c.kind), label(v));
}

function joinUnit(num: string, unit: string): string {
	return unit ? `${num} ${unit}` : num;
}

/** Merge quantities that share a unit family (or the same count word); keep the rest separate. */
export function sumQuantities(qs: Quantity[]): Quantity[] {
	const out: Quantity[] = [];
	for (const q of qs) {
		if (q.value === null) {
			out.push(q);
			continue;
		}
		const single = Array.isArray(q.value) ? q.value[1] : q.value;
		const target = out.find((o) => {
			if (o.value === null) return false;
			if ((q.kind === "mass" || q.kind === "volume") && o.kind === q.kind) return true;
			return q.kind === "count" && o.kind === "count" && singular(o.unit) === singular(q.unit);
		});
		if (!target) {
			out.push({ ...q, value: single });
			continue;
		}
		const tv = Array.isArray(target.value) ? target.value[1] : (target.value as number);
		if (q.kind === "count") {
			target.value = tv + single;
		} else {
			const tDef = unitDef(target.unit)!;
			const qDef = unitDef(q.unit)!;
			target.value = fromBase(toBase(tv, tDef) + toBase(single, qDef), tDef);
		}
		target.raw = formatQuantity(target, "written");
	}
	return out;
}

function singular(word: string | null): string {
	return (word ?? "").toLowerCase().replace(/s$/, "");
}

/** Good-enough English plural for count words (cloves, pinches, berries). */
function plural(word: string): string {
	if (/s$/i.test(word)) return word;
	if (/(ch|sh|x)$/i.test(word)) return `${word}es`;
	if (/[^aeiou]y$/i.test(word)) return `${word.slice(0, -1)}ies`;
	return `${word}s`;
}
