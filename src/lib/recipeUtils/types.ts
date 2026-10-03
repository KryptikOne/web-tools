/** Recipe DSL model. Only source text is ever stored; everything here is derived. */

export type UnitMode = "written" | "metric" | "imperial";

export type QuantityKind = "mass" | "volume" | "count" | "text";

export interface Quantity {
	/** Exactly what was typed (or the formatted form after scaling/converting). */
	raw: string;
	value: number | [number, number] | null;
	/** Canonical id (g, kg, ml, l, tsp, tbsp, cup, floz, oz, lb), a literal count word, or null. */
	unit: string | null;
	kind: QuantityKind;
}

export interface ParseError {
	line: number;
	message: string;
}

export interface Note {
	kind: "note";
	line: number;
	text: string;
}

export type StepInput =
	| { kind: "chain"; resolved: number }
	| { kind: "ingredient"; line: number; name: string; amount: Quantity | null; prep?: string }
	| { kind: "result"; line: number; ref: string; resolved: number | null }
	| { kind: "byproduct"; line: number; ref: string; amount: Quantity | null; resolved: number | null };

export interface Step {
	kind: "step";
	line: number;
	action: string;
	duration?: string;
	/** Written order; the implicit chain input is always first when present. */
	inputs: StepInput[];
	resultName?: string;
	byproducts: string[];
	discard?: string;
	footnotes: string[];
}

export type RecipeNode = Note | Step;

export interface Recipe {
	title: string;
	serves: number | null;
	tags: string[];
	source?: string;
	meta: Record<string, string>;
	nodes: RecipeNode[];
	errors: ParseError[];
}

export type LayoutCellKind = "ingredient" | "byproduct" | "step" | "empty";

export interface LayoutCell {
	row: number;
	col: number;
	rowSpan: number;
	colSpan: number;
	kind: LayoutCellKind;
	/** Node index of the step (for step cells) or of the consuming step (for leaf cells). */
	stepIndex?: number;
	input?: StepInput;
}

export interface Layout {
	columns: number;
	rows: number;
	cells: LayoutCell[];
	/** Header notes rendered as full-width rows above the grid. */
	banners: string[];
	/** Present only when a recipe has more than one root; each is a complete grid. */
	tables: Layout[];
}
