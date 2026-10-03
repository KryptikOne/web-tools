import { describe, it, expect } from "vitest";
import { parseRecipe, layoutRecipe } from "@/lib/recipeUtils";
import type { Layout, LayoutCell } from "@/lib/recipeUtils";

const AGLIO = `# Aglio e olio
serves: 2
> Salt a large pot of water

fry 2 min
- olive oil: 2 tbsp
- garlic: 2 cloves, sliced
- chilli flakes: 1 pinch
= sauce

boil 9 min
- spaghetti: 200 g
- water: salted
drain -> pasta water
x most of the water
toss 1 min
@ sauce
loosen
@ pasta water: 1/4 cup
serve
- parmesan: 30 g, grated
- parsley: 1 handful, chopped
- olive oil: 1 tbsp
`;

const lay = (text: string) => layoutRecipe(parseRecipe(text));
const step = (l: Layout, action: string) =>
	l.cells.find((c) => c.kind === "step" && (parseRecipeCache.get(l)?.nodes[c.stepIndex!] as { action: string })?.action === action);
const parseRecipeCache = new WeakMap<Layout, ReturnType<typeof parseRecipe>>();
function build(text: string): Layout {
	const recipe = parseRecipe(text);
	const layout = layoutRecipe(recipe);
	parseRecipeCache.set(layout, recipe);
	return layout;
}

function coverage(l: Layout): boolean {
	const grid: number[][] = Array.from({ length: l.rows }, () => Array(l.columns).fill(0));
	for (const c of l.cells) {
		for (let r = c.row; r < c.row + c.rowSpan; r++) for (let k = c.col; k < c.col + c.colSpan; k++) grid[r][k]++;
	}
	return grid.every((row) => row.every((n) => n === 1));
}

describe("layoutRecipe", () => {
	it("lays out one step with three ingredients", () => {
		const l = build("mix\n- a: 1\n- b: 2\n- c: 3");
		expect(l.columns).toBe(2);
		expect(l.rows).toBe(3);
		expect(step(l, "mix")).toMatchObject({ row: 0, col: 1, rowSpan: 3, colSpan: 1 });
		expect(l.cells.filter((c) => c.kind === "ingredient")).toHaveLength(3);
		expect(coverage(l)).toBe(true);
	});

	it("merges two branches, visiting the chain before references", () => {
		const l = build("fry\n- oil: 1\n- garlic: 1\n= sauce\nboil\n- pasta: 1\ntoss\n@ sauce");
		const leaves = l.cells.filter((c) => c.kind === "ingredient").sort((a, b) => a.row - b.row);
		expect(leaves.map((c) => (c.input as { name: string }).name)).toEqual(["pasta", "oil", "garlic"]);
		expect(step(l, "boil")).toMatchObject({ row: 0, col: 1, rowSpan: 1, colSpan: 1 });
		expect(step(l, "fry")).toMatchObject({ row: 1, col: 1, rowSpan: 2, colSpan: 1 });
		expect(step(l, "toss")).toMatchObject({ row: 0, col: 2, rowSpan: 3, colSpan: 1 });
		expect(coverage(l)).toBe(true);
	});

	it("turns a byproduct use into a leaf row and keeps the chip on the producer", () => {
		const l = build("boil\n- pasta: 1\ndrain -> water\ntoss\n- oil: 1\nloosen\n@ water: 1 cup");
		const by = l.cells.find((c) => c.kind === "byproduct")!;
		expect(by).toMatchObject({ row: 2, col: 0, rowSpan: 1, colSpan: 4 });
		expect(step(l, "loosen")).toMatchObject({ col: 4, rowSpan: 3 });
		expect(coverage(l)).toBe(true);
	});

	it("stacks separate tables for multiple roots", () => {
		const l = build("fry\n- oil: 1\n= sauce\nboil\n- pasta: 1");
		expect(l.tables).toHaveLength(2);
		expect(l.cells).toHaveLength(0);
		expect(l.tables.every(coverage)).toBe(true);
	});

	it("renders a step with no inputs as a single empty row", () => {
		const l = build("preheat 10 min\nbake\n- dough: 1");
		expect(l.cells.find((c) => c.kind === "empty")).toBeDefined();
		expect(coverage(l)).toBe(true);
	});

	it("reproduces the reference aglio e olio table", () => {
		const l = build(AGLIO);
		expect(l.banners).toEqual(["Salt a large pot of water"]);
		expect(l.columns).toBe(6);
		expect(l.rows).toBe(9);
		expect(l.cells).toHaveLength(15);
		expect(step(l, "boil")).toMatchObject({ row: 0, col: 1, rowSpan: 2, colSpan: 1 });
		expect(step(l, "fry")).toMatchObject({ row: 2, col: 1, rowSpan: 3, colSpan: 2 });
		expect(step(l, "toss")).toMatchObject({ row: 0, col: 3, rowSpan: 5, colSpan: 1 });
		expect(step(l, "serve")).toMatchObject({ row: 0, col: 5, rowSpan: 9, colSpan: 1 });
		expect(l.cells.find((c) => c.kind === "byproduct")).toMatchObject({ row: 5, col: 0, colSpan: 4 });
		const parm = l.cells.find((c) => c.kind === "ingredient" && (c.input as { name: string }).name === "parmesan")!;
		expect(parm).toMatchObject({ row: 6, colSpan: 5 });
		expect(coverage(l)).toBe(true);
	});

	it("flags an unresolved reference as a leaf and still covers the grid", () => {
		const l = lay("fry\n- oil: 1\n@ ghost");
		expect(l.cells.filter((c) => c.kind === "ingredient" || c.kind === "byproduct")).toHaveLength(2);
		expect(coverage(l)).toBe(true);
	});
});

export type { LayoutCell };
