import { layoutRecipe } from "./layout";
import { formatQuantity } from "./quantity";
import { ingredientTotals, inputLabel, stepTitle, viewFactor, type RecipeView } from "./view";
import type { Layout, LayoutCell, Recipe, Step } from "./types";

/** Cells grouped by starting row, in column order, ready for a <table> walk. */
export function groupRows(layout: Layout): LayoutCell[][] {
	const rows: LayoutCell[][] = Array.from({ length: layout.rows }, () => []);
	for (const cell of layout.cells) rows[cell.row].push(cell);
	rows.forEach((r) => r.sort((a, b) => a.col - b.col));
	return rows;
}

function escapeHtml(s: string): string {
	return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

const HTML_STYLES = {
	table: "border-collapse:collapse;font-family:system-ui,sans-serif;font-size:14px;width:100%;max-width:900px",
	cell: "border:1px solid #bbb;padding:6px 10px;vertical-align:middle",
	leaf: "background:#fff;text-align:left",
	step: "background:#f3f1ea;text-align:center;font-weight:600",
	banner: "background:#e8e6de;text-align:center;font-style:italic",
	small: "font-size:12px;font-weight:400;color:#555",
	chip: "display:inline-block;margin:2px 4px 0 0;padding:1px 6px;border:1px solid #999;border-radius:4px;font-size:11px;font-weight:400",
};

function stepCellHtml(step: Step): string {
	const parts = [`<span>${escapeHtml(step.action)}</span>`];
	if (step.duration) parts.push(`<div style="${HTML_STYLES.small}">${escapeHtml(step.duration)}</div>`);
	if (step.discard) parts.push(`<div><span style="${HTML_STYLES.chip}">✕ ${escapeHtml(step.discard)}</span></div>`);
	for (const b of step.byproducts) parts.push(`<div><span style="${HTML_STYLES.chip}">→ ${escapeHtml(b)}</span></div>`);
	for (const f of step.footnotes) parts.push(`<div style="${HTML_STYLES.small}">${escapeHtml(f)}</div>`);
	return parts.join("");
}

function tableHtml(recipe: Recipe, layout: Layout, factor: number, view: RecipeView): string {
	const rows = groupRows(layout);
	const out: string[] = [`<table style="${HTML_STYLES.table}">`];
	for (const banner of layout.banners) {
		out.push(`<tr><td colspan="${layout.columns}" style="${HTML_STYLES.cell};${HTML_STYLES.banner}">${escapeHtml(banner)}</td></tr>`);
	}
	for (const row of rows) {
		out.push("<tr>");
		for (const cell of row) {
			const span = `${cell.rowSpan > 1 ? ` rowspan="${cell.rowSpan}"` : ""}${cell.colSpan > 1 ? ` colspan="${cell.colSpan}"` : ""}`;
			if (cell.kind === "step") {
				const step = recipe.nodes[cell.stepIndex!] as Step;
				out.push(`<td${span} style="${HTML_STYLES.cell};${HTML_STYLES.step}">${stepCellHtml(step)}</td>`);
			} else if (cell.kind === "empty") {
				out.push(`<td${span} style="${HTML_STYLES.cell};${HTML_STYLES.leaf}"></td>`);
			} else {
				const label = inputLabel(cell.input!, factor, view.unitMode);
				const prefix = cell.kind === "byproduct" ? "↩ " : "";
				const text = [label.amount, label.name].filter(Boolean).join(" ");
				const prep = label.prep ? ` <span style="${HTML_STYLES.small}">${escapeHtml(label.prep)}</span>` : "";
				out.push(`<td${span} style="${HTML_STYLES.cell};${HTML_STYLES.leaf}">${prefix}${escapeHtml(text)}${prep}</td>`);
			}
		}
		out.push("</tr>");
	}
	out.push("</table>");
	return out.join("");
}

/** Self-contained HTML (inline styles, no classes) for pasting into editors and email. */
export function toHtml(recipe: Recipe, view: RecipeView): string {
	const factor = viewFactor(recipe, view);
	const layout = layoutRecipe(recipe);
	const totals = ingredientTotals(recipe, factor)
		.map((t) => {
			const qty = t.quantities.map((q) => formatQuantity(q, view.unitMode)).join(" + ");
			return `<li>${escapeHtml([qty, t.name].filter(Boolean).join(" "))}${t.preps.length ? ` <span style="${HTML_STYLES.small}">${escapeHtml(t.preps.join(", "))}</span>` : ""}</li>`;
		})
		.join("");
	const serves = view.serves ?? recipe.serves;
	const tables = layout.tables.length ? layout.tables.map((t) => tableHtml(recipe, { ...t, banners: [] }, factor, view)) : [tableHtml(recipe, layout, factor, view)];
	if (layout.tables.length && layout.banners.length) {
		tables.unshift(`<p style="${HTML_STYLES.small}">${layout.banners.map(escapeHtml).join("<br>")}</p>`);
	}
	return [
		`<div style="font-family:system-ui,sans-serif;max-width:900px">`,
		`<h2 style="margin:0 0 4px">${escapeHtml(recipe.title)}</h2>`,
		serves ? `<p style="margin:0 0 8px;${HTML_STYLES.small}">Serves ${serves}</p>` : "",
		totals ? `<ul style="margin:0 0 12px;padding-left:20px">${totals}</ul>` : "",
		...tables,
		`</div>`,
	].join("");
}

/** Ingredient list plus numbered steps; the honest plain-text form of the same tree. */
export function toMarkdown(recipe: Recipe, view: RecipeView): string {
	const factor = viewFactor(recipe, view);
	const lines: string[] = [`# ${recipe.title}`];
	const serves = view.serves ?? recipe.serves;
	if (serves) lines.push(`Serves ${serves}`);
	if (recipe.source) lines.push(`Source: ${recipe.source}`);
	lines.push("");
	for (const t of ingredientTotals(recipe, factor)) {
		const qty = t.quantities.map((q) => formatQuantity(q, view.unitMode)).join(" + ");
		lines.push(`- ${[qty, t.name].filter(Boolean).join(" ")}${t.preps.length ? `, ${t.preps.join(", ")}` : ""}`);
	}
	lines.push("");
	for (const note of recipe.nodes) if (note.kind === "note") lines.push(`> ${note.text}`);
	let n = 1;
	for (const node of recipe.nodes) {
		if (node.kind !== "step") continue;
		const items = node.inputs
			.map((i) => {
				if (i.kind === "chain") return null;
				const label = inputLabel(i, factor, view.unitMode);
				return [label.amount, label.name].filter(Boolean).join(" ");
			})
			.filter(Boolean);
		const verb = node.action.charAt(0).toUpperCase() + node.action.slice(1);
		let text = `${n}. ${verb}`;
		if (items.length) text += ` ${items.join(", ")}`;
		if (node.duration) text += ` for ${node.duration}`;
		if (node.discard) text += `; discard ${node.discard}`;
		if (node.byproducts.length) text += `; keep ${node.byproducts.join(", ")}`;
		if (node.resultName) text += ` → ${node.resultName}`;
		lines.push(text);
		for (const f of node.footnotes) lines.push(`   ${f}`);
		n++;
	}
	return lines.join("\n").trim() + "\n";
}

export const INSERT_TEMPLATES = {
	step: "\nstep 5 min\n- ingredient: 1 cup\n",
	ingredient: "- ingredient: amount, prep\n",
	useResult: "@ name\n",
	note: "> note\n",
} as const;

export const CHEAT_SHEET: { rule: string; example: string }[] = [
	{ rule: "Header first: a title line and key: value fields (serves, tags, source).", example: "# Aglio e olio\nserves: 2\ntags: pasta, weeknight" },
	{ rule: "A step is any other line: an action and an optional time.", example: "fry 2 min\nbake 25-30 min" },
	{ rule: "Ingredients go under their step: name, amount, prep.", example: "- garlic: 2 cloves, sliced\n- water: salted" },
	{ rule: "Steps chain top to bottom unless the one above was closed with =.", example: "boil 9 min\ndrain\ntoss 1 min" },
	{ rule: "= names a result and closes it; use it later with @. -> keeps a byproduct; x notes a discard.", example: "= sauce\ndrain -> pasta water\nx most of the water\n@ sauce\n@ pasta water: 1/4 cup" },
	{ rule: "> before the first step is a banner; after a step it's a footnote in that step's cell.", example: "> Salt a large pot of water" },
];

export { stepTitle };
