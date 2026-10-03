"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal, flushSync } from "react-dom";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import SegmentedControl from "@/components/SegmentedControl";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
	createRecipe,
	deleteRecipe,
	duplicateRecipe,
	hydrateRecipes,
	importRecipes,
	selectActiveRecipe,
	selectRecipes,
	selectRecipesHydrated,
	selectRecipesStorageError,
	setActiveRecipe,
	updateRecipeText,
} from "@/store/slices/recipesSlice";
import { decodeShare, parseRecipe, type RecipeView } from "@/lib/recipeUtils";
import RecipeEditor from "./RecipeEditor";
import RecipeList from "./RecipeList";
import RecipeTable from "./RecipeTable";
import RecipeToolbar from "./RecipeToolbar";
import styles from "./RecipeTablePage.module.scss";

type Pane = "write" | "table";

export default function RecipeTablePage() {
	const dispatch = useAppDispatch();
	const recipes = useAppSelector(selectRecipes);
	const active = useAppSelector(selectActiveRecipe);
	const hydrated = useAppSelector(selectRecipesHydrated);
	const storageError = useAppSelector(selectRecipesStorageError);

	const [draft, setDraft] = useState("");
	const [draftId, setDraftId] = useState<string | null>(null);
	const [shared, setShared] = useState<string | null>(null);
	const [sharedBroken, setSharedBroken] = useState(false);
	const [view, setView] = useState<RecipeView>({ serves: null, unitMode: "written" });
	const [pane, setPane] = useState<Pane>("write");
	const [listOpen, setListOpen] = useState(false);
	const [printing, setPrinting] = useState(false);
	const [printRoot, setPrintRoot] = useState<HTMLElement | null>(null);
	const saveTimer = useRef<number | null>(null);

	useEffect(() => {
		dispatch(hydrateRecipes());
	}, [dispatch]);

	// Printing: a body-level portal (so no app container can clip it) and a landscape page rule scoped to this tool.
	useEffect(() => {
		document.body.classList.add("recipe-print");
		const root = document.createElement("div");
		root.setAttribute("data-print-root", "");
		document.body.appendChild(root);
		setPrintRoot(root);
		const pageStyle = document.createElement("style");
		pageStyle.textContent = "@page { size: landscape; margin: 1cm; }";
		document.head.appendChild(pageStyle);
		const before = () => flushSync(() => setPrinting(true));
		const after = () => setPrinting(false);
		window.addEventListener("beforeprint", before);
		window.addEventListener("afterprint", after);
		return () => {
			window.removeEventListener("beforeprint", before);
			window.removeEventListener("afterprint", after);
			document.body.classList.remove("recipe-print");
			root.remove();
			pageStyle.remove();
		};
	}, []);

	// Load the active record into the draft whenever the selection changes
	useEffect(() => {
		if (active && active.id !== draftId) {
			setDraft(active.text);
			setDraftId(active.id);
			setView((v) => ({ ...v, serves: null }));
		}
		if (!active && draftId) {
			setDraft("");
			setDraftId(null);
		}
	}, [active, draftId]);

	// Shared recipe in the hash
	useEffect(() => {
		const read = async () => {
			const hash = window.location.hash;
			if (!hash.includes("r=")) {
				setShared(null);
				setSharedBroken(false);
				return;
			}
			const text = await decodeShare(hash);
			setShared(text);
			setSharedBroken(text === null);
		};
		void read();
		window.addEventListener("hashchange", read);
		return () => window.removeEventListener("hashchange", read);
	}, []);

	const handleChange = useCallback(
		(text: string) => {
			setDraft(text);
			if (!draftId) return;
			if (saveTimer.current) window.clearTimeout(saveTimer.current);
			saveTimer.current = window.setTimeout(() => dispatch(updateRecipeText({ id: draftId, text })), 500);
		},
		[dispatch, draftId]
	);

	useEffect(() => () => {
		if (saveTimer.current) window.clearTimeout(saveTimer.current);
	}, []);

	const text = shared ?? draft;
	const recipe = useMemo(() => parseRecipe(text), [text]);
	const sharedAlreadySaved = shared !== null && recipes.some((r) => r.text.trim() === shared.trim());

	const clearHash = () => {
		window.history.replaceState(window.history.state, "", window.location.pathname);
		setShared(null);
		setSharedBroken(false);
	};

	const saveShared = () => {
		if (!shared) return;
		dispatch(importRecipes([shared]));
		clearHash();
	};

	const openSharedExisting = () => {
		const match = recipes.find((r) => r.text.trim() === shared?.trim());
		if (match) dispatch(setActiveRecipe(match.id));
		clearHash();
	};

	const notebookText = () => recipes.map((r) => r.text.trim()).join("\n\n---\n\n") + "\n";

	return (
		<div className={styles.container}>
			{storageError && <p className={styles.notice}>This browser refused to save the notebook (private mode or storage full). Changes will be lost when you leave.</p>}
			{sharedBroken && (
				<p className={styles.notice}>
					Couldn&apos;t read the recipe in this link. <button type="button" className={styles.linkBtn} onClick={clearHash}>Back to my notebook</button>
				</p>
			)}
			{shared !== null && (
				<div className={styles.sharedBanner}>
					<span>Shared recipe{sharedAlreadySaved ? " · already in your notebook" : ""}</span>
					<span className="flex gap-2">
						{sharedAlreadySaved ? (
							<button type="button" className={styles.btnPrimary} onClick={openSharedExisting}>Open my copy</button>
						) : (
							<button type="button" className={styles.btnPrimary} onClick={saveShared}>Save to my notebook</button>
						)}
						<button type="button" className={styles.toolBtn} onClick={clearHash}>Dismiss</button>
					</span>
				</div>
			)}

			<div className={styles.mobileBar}>
				<button type="button" className={styles.toolBtn} onClick={() => setListOpen((v) => !v)} aria-expanded={listOpen} aria-controls="recipe-list-panel">
					{listOpen ? <XMarkIcon className="w-4 h-4" /> : <Bars3Icon className="w-4 h-4" />}
					Recipes
				</button>
				<SegmentedControl<Pane>
					label="Pane"
					size="sm"
					value={pane}
					onChange={setPane}
					options={[
						{ value: "write", label: "Write" },
						{ value: "table", label: "Table" },
					]}
				/>
			</div>

			<div className={styles.layout}>
				<aside id="recipe-list-panel" className={`${styles.rail} ${listOpen ? styles.railOpen : ""}`}>
					{hydrated && (
						<RecipeList
							recipes={recipes}
							activeId={active?.id ?? null}
							onSelect={(id) => {
								dispatch(setActiveRecipe(id));
								setListOpen(false);
								if (shared !== null) clearHash();
							}}
							onNew={() => {
								dispatch(createRecipe(undefined));
								setListOpen(false);
								setPane("write");
							}}
							onDuplicate={(id) => dispatch(duplicateRecipe(id))}
							onDelete={(id) => {
								if (window.confirm("Delete this recipe? This cannot be undone.")) dispatch(deleteRecipe(id));
							}}
						/>
					)}
				</aside>

				<section className={`${styles.editorPane} ${pane === "write" ? styles.paneActive : ""}`} aria-label="Editor">
					<RecipeEditor text={text} onChange={handleChange} errors={recipe.errors} readOnly={shared !== null} />
				</section>

				<section className={`${styles.tablePane} ${pane === "table" ? styles.paneActive : ""}`} aria-label="Rendered recipe">
					<RecipeToolbar recipe={recipe} text={text} view={view} onViewChange={setView} onImport={(texts) => dispatch(importRecipes(texts))} notebookText={notebookText} />
					<div className={styles.tableCard}>
						<RecipeTable recipe={recipe} view={view} />
					</div>
				</section>
			</div>

			{printing && printRoot && createPortal(<RecipeTable recipe={recipe} view={view} />, printRoot)}
		</div>
	);
}
