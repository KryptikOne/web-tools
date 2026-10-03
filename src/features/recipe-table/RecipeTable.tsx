"use client";

import { useMemo } from "react";
import {
	groupRows,
	ingredientTotals,
	inputLabel,
	layoutRecipe,
	formatQuantity,
	viewFactor,
	type Layout,
	type LayoutCell,
	type Recipe,
	type RecipeView,
	type Step,
} from "@/lib/recipeUtils";
import styles from "./RecipeTable.module.scss";

interface RecipeTableProps {
	recipe: Recipe;
	view: RecipeView;
	/** Show parse errors under the table (the editor already lists them, so pages may turn this off). */
	showErrors?: boolean;
}

function StepCell({ step }: { step: Step }) {
	return (
		<>
			<span className={styles.stepAction}>{step.action}</span>
			{step.duration && <span className={styles.stepDuration}>{step.duration}</span>}
			{step.discard && <span className={`${styles.chip} ${styles.chipDiscard}`}>✕ {step.discard}</span>}
			{step.byproducts.map((b) => (
				<span key={b} className={`${styles.chip} ${styles.chipKeep}`}>
					→ {b}
				</span>
			))}
			{step.footnotes.map((f, i) => (
				<span key={i} className={styles.footnote}>
					{f}
				</span>
			))}
		</>
	);
}

function LeafCell({ cell, factor, view }: { cell: LayoutCell; factor: number; view: RecipeView }) {
	if (cell.kind === "empty" || !cell.input) return null;
	const label = inputLabel(cell.input, factor, view.unitMode);
	const unresolved = cell.input.kind === "result" && cell.input.resolved === null;
	return (
		<span className={`${styles.leaf} ${unresolved ? styles.leafError : ""}`}>
			{cell.kind === "byproduct" && <span className={styles.leafMarker} aria-hidden="true">↩</span>}
			{label.amount && <strong className={styles.leafAmount}>{label.amount}</strong>}
			<span className={styles.leafName}>{label.name}</span>
			{label.prep && <span className={styles.leafPrep}>{label.prep}</span>}
			{unresolved && <span className={styles.leafPrep}>not found</span>}
		</span>
	);
}

function Grid({ recipe, layout, factor, view }: { recipe: Recipe; layout: Layout; factor: number; view: RecipeView }) {
	const rows = groupRows(layout);
	return (
		<table className={styles.table}>
			<tbody>
				{layout.banners.map((b, i) => (
					<tr key={`b${i}`}>
						<td colSpan={layout.columns} className={styles.banner}>
							{b}
						</td>
					</tr>
				))}
				{rows.map((row, r) => (
					<tr key={r}>
						{row.map((cell) => (
							<td
								key={`${cell.row}-${cell.col}`}
								rowSpan={cell.rowSpan > 1 ? cell.rowSpan : undefined}
								colSpan={cell.colSpan > 1 ? cell.colSpan : undefined}
								className={cell.kind === "step" ? styles.stepCell : styles.leafCell}
							>
								{cell.kind === "step" ? <StepCell step={recipe.nodes[cell.stepIndex!] as Step} /> : <LeafCell cell={cell} factor={factor} view={view} />}
							</td>
						))}
					</tr>
				))}
			</tbody>
		</table>
	);
}

/** The rendered recipe: title, ingredient totals, and the action table. Print and copy both target this. */
export default function RecipeTable({ recipe, view, showErrors = false }: RecipeTableProps) {
	const factor = viewFactor(recipe, view);
	const layout = useMemo(() => layoutRecipe(recipe), [recipe]);
	const totals = useMemo(() => ingredientTotals(recipe, factor), [recipe, factor]);
	const serves = view.serves ?? recipe.serves;
	const tables = layout.tables.length ? layout.tables : [layout];

	return (
		<article className={styles.recipe}>
			<header className={styles.header}>
				<h2 className={styles.title}>{recipe.title}</h2>
				<p className={styles.meta}>
					{serves && <span>Serves {serves}</span>}
					{recipe.tags.map((t) => (
						<span key={t} className={styles.tag}>
							{t}
						</span>
					))}
					{recipe.source && (
						<a href={recipe.source} target="_blank" rel="noopener noreferrer" className={styles.source}>
							source
						</a>
					)}
				</p>
			</header>

			{totals.length > 0 && (
				<ul className={styles.totals}>
					{totals.map((t) => (
						<li key={t.name}>
							{t.quantities.length > 0 && (
								<strong>{t.quantities.map((q) => formatQuantity(q, view.unitMode)).join(" + ")}</strong>
							)}{" "}
							{t.name}
							{t.preps.length > 0 && <span className={styles.leafPrep}>{t.preps.join(", ")}</span>}
						</li>
					))}
				</ul>
			)}

			{layout.tables.length > 0 && layout.banners.length > 0 && (
				<p className={styles.bannerLoose}>{layout.banners.join(" · ")}</p>
			)}

			{tables.map((t, i) => (
				<div key={i} className={styles.tableWrap}>
					<Grid recipe={recipe} layout={layout.tables.length ? { ...t, banners: [] } : t} factor={factor} view={view} />
				</div>
			))}

			{layout.rows === 0 && layout.tables.length === 0 && (
				<p className={styles.empty}>Add a step (any line) with ingredients (- name: amount) under it to build the table.</p>
			)}

			{showErrors && recipe.errors.length > 0 && (
				<ul className={styles.errors}>
					{recipe.errors.map((e, i) => (
						<li key={i}>
							Line {e.line}: {e.message}
						</li>
					))}
				</ul>
			)}
		</article>
	);
}
