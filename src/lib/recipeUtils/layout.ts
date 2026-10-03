import type { Layout, LayoutCell, Recipe, Step, StepInput } from "./types";

interface StepInfo {
	index: number;
	col: number;
	leafStart: number;
	leafCount: number;
	children: StepInfo[];
	leaves: LayoutCell[];
}

function stepAt(recipe: Recipe, index: number): Step | null {
	const node = recipe.nodes[index];
	return node && node.kind === "step" ? node : null;
}

/** Steps whose result nothing later consumes; usually just the last step. */
function findRoots(recipe: Recipe): number[] {
	const consumed = new Set<number>();
	recipe.nodes.forEach((node) => {
		if (node.kind !== "step") return;
		for (const input of node.inputs) {
			if (input.kind !== "ingredient" && input.resolved !== null) consumed.add(input.resolved);
		}
	});
	return recipe.nodes.map((n, i) => (n.kind === "step" && !consumed.has(i) ? i : -1)).filter((i) => i >= 0);
}

/** Order inputs the way the table reads: chain first, then result references, then this step's own leaves. */
function orderedInputs(step: Step): StepInput[] {
	const chain = step.inputs.filter((i) => i.kind === "chain");
	const results = step.inputs.filter((i) => i.kind === "result" && i.resolved !== null);
	const leaves = step.inputs.filter((i) => i.kind === "ingredient" || i.kind === "byproduct" || (i.kind === "result" && i.resolved === null));
	return [...chain, ...results, ...leaves];
}

function buildTable(recipe: Recipe, root: number): Layout {
	let nextRow = 0;
	const placed = new Set<number>();
	const cells: LayoutCell[] = [];
	const stepCells: { info: StepInfo; cell: LayoutCell }[] = [];

	const visit = (index: number): StepInfo => {
		const step = stepAt(recipe, index)!;
		placed.add(index);
		const info: StepInfo = { index, col: 1, leafStart: nextRow, leafCount: 0, children: [], leaves: [] };
		let deepest = 0;

		const addLeaf = (kind: LayoutCell["kind"], input?: StepInput) => {
			const cell: LayoutCell = { row: nextRow++, col: 0, rowSpan: 1, colSpan: 1, kind, stepIndex: index, input };
			info.leaves.push(cell);
			cells.push(cell);
		};

		for (const input of orderedInputs(step)) {
			if (input.kind === "ingredient") {
				addLeaf("ingredient", input);
			} else if (input.kind === "byproduct") {
				addLeaf("byproduct", input);
			} else if (input.kind === "result" && input.resolved === null) {
				addLeaf("byproduct", input);
			} else if (input.resolved !== null && !placed.has(input.resolved) && stepAt(recipe, input.resolved)) {
				const child = visit(input.resolved);
				info.children.push(child);
				deepest = Math.max(deepest, child.col);
			} else if (input.kind === "result") {
				// A result used twice cannot be drawn twice; show the second use as a reference row.
				addLeaf("byproduct", input);
			}
		}
		if (info.leaves.length === 0 && info.children.length === 0) addLeaf("empty");

		info.col = deepest + 1;
		info.leafCount = nextRow - info.leafStart;
		const cell: LayoutCell = { row: info.leafStart, col: info.col, rowSpan: info.leafCount, colSpan: 1, kind: "step", stepIndex: index };
		cells.push(cell);
		stepCells.push({ info, cell });
		return info;
	};

	const rootInfo = visit(root);
	const columns = rootInfo.col + 1;

	// Second pass: stretch every cell right until whatever consumes it.
	const assign = (info: StepInfo, consumerCol: number) => {
		const own = stepCells.find((s) => s.info === info)!.cell;
		own.colSpan = Math.max(1, consumerCol - info.col);
		for (const leaf of info.leaves) leaf.colSpan = Math.max(1, info.col);
		for (const child of info.children) assign(child, info.col);
	};
	assign(rootInfo, columns);

	cells.sort((a, b) => a.row - b.row || a.col - b.col);
	return { columns, rows: nextRow, cells, banners: [], tables: [] };
}

/** Turn a parsed recipe into a grid of spanning cells (Cooking for Engineers style). */
export function layoutRecipe(recipe: Recipe): Layout {
	const banners = recipe.nodes.filter((n) => n.kind === "note").map((n) => n.text);
	const roots = findRoots(recipe);
	if (roots.length === 0) return { columns: 0, rows: 0, cells: [], banners, tables: [] };
	if (roots.length === 1) return { ...buildTable(recipe, roots[0]), banners };
	return { columns: 0, rows: 0, cells: [], banners, tables: roots.map((r) => buildTable(recipe, r)) };
}
