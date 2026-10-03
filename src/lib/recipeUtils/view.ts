import { formatQuantity, scaleQuantity, sumQuantities } from "./quantity";
import type { Quantity, Recipe, Step, StepInput, UnitMode } from "./types";

export interface RecipeView {
	/** Target servings; null means "as written". */
	serves: number | null;
	unitMode: UnitMode;
}

export function viewFactor(recipe: Recipe, view: RecipeView): number {
	if (view.serves === null) return 1;
	const base = recipe.serves ?? 1;
	return base > 0 ? view.serves / base : 1;
}

/** Scale then format a quantity for display. */
export function formatForView(q: Quantity | null, factor: number, mode: UnitMode): string {
	if (!q) return "";
	return formatQuantity(scaleQuantity(q, factor), mode);
}

export interface IngredientTotal {
	name: string;
	quantities: Quantity[];
	preps: string[];
}

/** Ingredient list with same-named lines merged (case-insensitive), in first-appearance order. */
export function ingredientTotals(recipe: Recipe, factor = 1): IngredientTotal[] {
	const order: string[] = [];
	const map = new Map<string, { name: string; quantities: Quantity[]; preps: string[] }>();
	for (const node of recipe.nodes) {
		if (node.kind !== "step") continue;
		for (const input of node.inputs) {
			if (input.kind !== "ingredient") continue;
			const key = input.name.toLowerCase();
			if (!map.has(key)) {
				map.set(key, { name: input.name, quantities: [], preps: [] });
				order.push(key);
			}
			const entry = map.get(key)!;
			if (input.amount) entry.quantities.push(scaleQuantity(input.amount, factor));
			if (input.prep && !entry.preps.includes(input.prep)) entry.preps.push(input.prep);
		}
	}
	return order.map((k) => {
		const e = map.get(k)!;
		return { name: e.name, quantities: sumQuantities(e.quantities), preps: e.preps };
	});
}

export function stepTitle(step: Step): string {
	return step.duration ? `${step.action} · ${step.duration}` : step.action;
}

/** Label for a leaf row: "200 g spaghetti" / "↩ ¼ cup pasta water". */
export function inputLabel(input: StepInput, factor: number, mode: UnitMode): { amount: string; name: string; prep?: string } {
	switch (input.kind) {
		case "ingredient":
			return { amount: formatForView(input.amount, factor, mode), name: input.name, prep: input.prep };
		case "byproduct":
			return { amount: formatForView(input.amount, factor, mode), name: input.ref };
		case "result":
			return { amount: "", name: input.ref };
		case "chain":
			return { amount: "", name: "" };
	}
}
