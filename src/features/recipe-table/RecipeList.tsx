"use client";

import { useMemo, useState } from "react";
import { PlusIcon, DocumentDuplicateIcon, TrashIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { parseRecipe } from "@/lib/recipeUtils";
import type { RecipeRecord } from "@/store/slices/recipesSlice";
import styles from "./RecipeTablePage.module.scss";

interface RecipeListProps {
	recipes: RecipeRecord[];
	activeId: string | null;
	onSelect: (id: string) => void;
	onNew: () => void;
	onDuplicate: (id: string) => void;
	onDelete: (id: string) => void;
}

export default function RecipeList({ recipes, activeId, onSelect, onNew, onDuplicate, onDelete }: RecipeListProps) {
	const [query, setQuery] = useState("");
	const [tag, setTag] = useState<string | null>(null);

	const entries = useMemo(
		() =>
			recipes
				.map((r) => {
					const parsed = parseRecipe(r.text);
					return { id: r.id, updatedAt: r.updatedAt, title: parsed.title, tags: parsed.tags, sample: parsed.meta.sample === "true" };
				})
				.sort((a, b) => b.updatedAt - a.updatedAt),
		[recipes]
	);

	const allTags = useMemo(() => Array.from(new Set(entries.flatMap((e) => e.tags))).sort(), [entries]);

	const visible = entries.filter((e) => {
		if (tag && !e.tags.includes(tag)) return false;
		if (query && !e.title.toLowerCase().includes(query.toLowerCase())) return false;
		return true;
	});

	return (
		<div className={styles.list}>
			<div className={styles.listHeader}>
				<div className={styles.search}>
					<MagnifyingGlassIcon className="w-4 h-4" aria-hidden="true" />
					<label htmlFor="recipe-search" className="sr-only">
						Search recipes
					</label>
					<input id="recipe-search" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search" className={styles.searchInput} />
				</div>
				<button type="button" className={styles.btnPrimary} onClick={onNew}>
					<PlusIcon className="w-4 h-4" />
					New
				</button>
			</div>

			{allTags.length > 0 && (
				<div className={styles.tagRow}>
					{allTags.map((t) => (
						<button key={t} type="button" className={`${styles.chip} ${tag === t ? styles.chipActive : ""}`} aria-pressed={tag === t} onClick={() => setTag(tag === t ? null : t)}>
							{t}
						</button>
					))}
				</div>
			)}

			<ul className={styles.recipeItems}>
				{visible.map((e) => (
					<li key={e.id} className={`${styles.recipeItem} ${e.id === activeId ? styles.recipeItemActive : ""}`}>
						<button type="button" className={styles.recipeItemMain} onClick={() => onSelect(e.id)} aria-current={e.id === activeId ? "true" : undefined}>
							<span className={styles.recipeItemTitle}>{e.title}</span>
							<span className={styles.recipeItemTags}>
								{e.sample && <span className={styles.sampleTag}>sample</span>}
								{e.tags.join(" · ")}
							</span>
						</button>
						<span className={styles.recipeItemActions}>
							<button type="button" className={styles.iconBtn} onClick={() => onDuplicate(e.id)} aria-label={`Duplicate ${e.title}`}>
								<DocumentDuplicateIcon className="w-4 h-4" />
							</button>
							<button type="button" className={styles.iconBtn} onClick={() => onDelete(e.id)} aria-label={`Delete ${e.title}`}>
								<TrashIcon className="w-4 h-4" />
							</button>
						</span>
					</li>
				))}
				{visible.length === 0 && <li className={styles.listEmpty}>No recipes match.</li>}
			</ul>
		</div>
	);
}
