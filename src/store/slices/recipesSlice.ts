import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "@/store";
import { SAMPLE_RECIPES } from "@/lib/recipeUtils/samples";

export interface RecipeRecord {
	id: string;
	text: string;
	updatedAt: number;
}

interface RecipesState {
	recipes: RecipeRecord[];
	activeId: string | null;
	hydrated: boolean;
	storageError: boolean;
}

export const RECIPES_STORAGE_KEY = "recipes-state";

const BLANK_RECIPE = `# New recipe
serves: 2
tags:

step 5 min
- ingredient: 1 cup
`;

function newId(): string {
	return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function loadFromStorage(): Pick<RecipesState, "recipes" | "activeId"> | null {
	if (typeof window === "undefined") return null;
	try {
		const stored = localStorage.getItem(RECIPES_STORAGE_KEY);
		if (!stored) return null;
		const parsed = JSON.parse(stored) as Partial<RecipesState>;
		if (!Array.isArray(parsed.recipes)) return null;
		return { recipes: parsed.recipes, activeId: parsed.activeId ?? null };
	} catch {
		return null;
	}
}

/** Returns false when the browser refused the write (quota, private mode). */
function saveToStorage(state: RecipesState): boolean {
	if (typeof window === "undefined") return true;
	try {
		localStorage.setItem(RECIPES_STORAGE_KEY, JSON.stringify({ recipes: state.recipes, activeId: state.activeId }));
		return true;
	} catch {
		return false;
	}
}

function persist(state: RecipesState) {
	state.storageError = !saveToStorage(state);
}

const initialState: RecipesState = {
	recipes: [],
	activeId: null,
	hydrated: false,
	storageError: false,
};

const recipesSlice = createSlice({
	name: "recipes",
	initialState,
	reducers: {
		hydrateRecipes: (state) => {
			const stored = loadFromStorage();
			if (stored && stored.recipes.length) {
				state.recipes = stored.recipes;
				state.activeId = stored.recipes.some((r) => r.id === stored.activeId) ? stored.activeId : stored.recipes[0].id;
			} else {
				const now = Date.now();
				state.recipes = SAMPLE_RECIPES.map((s, i) => ({ id: s.id, text: s.text, updatedAt: now - i }));
				state.activeId = state.recipes[0].id;
				persist(state);
			}
			state.hydrated = true;
		},
		createRecipe: (state, action: PayloadAction<string | undefined>) => {
			const record: RecipeRecord = { id: newId(), text: action.payload ?? BLANK_RECIPE, updatedAt: Date.now() };
			state.recipes.unshift(record);
			state.activeId = record.id;
			persist(state);
		},
		updateRecipeText: (state, action: PayloadAction<{ id: string; text: string }>) => {
			const record = state.recipes.find((r) => r.id === action.payload.id);
			if (!record || record.text === action.payload.text) return;
			record.text = action.payload.text;
			record.updatedAt = Date.now();
			persist(state);
		},
		duplicateRecipe: (state, action: PayloadAction<string>) => {
			const source = state.recipes.find((r) => r.id === action.payload);
			if (!source) return;
			const text = source.text.replace(/^#\s*(.*)$/m, (_, t: string) => `# ${t} (copy)`).replace(/^sample: true\n?/m, "");
			const record: RecipeRecord = { id: newId(), text, updatedAt: Date.now() };
			state.recipes.unshift(record);
			state.activeId = record.id;
			persist(state);
		},
		deleteRecipe: (state, action: PayloadAction<string>) => {
			state.recipes = state.recipes.filter((r) => r.id !== action.payload);
			if (state.activeId === action.payload) state.activeId = state.recipes[0]?.id ?? null;
			persist(state);
		},
		/** Adds recipes that are not already present (exact text match). Returns nothing; check state. */
		importRecipes: (state, action: PayloadAction<string[]>) => {
			const existing = new Set(state.recipes.map((r) => r.text.trim()));
			let first: string | null = null;
			for (const text of action.payload) {
				const trimmed = text.trim();
				if (!trimmed || existing.has(trimmed)) continue;
				existing.add(trimmed);
				const record: RecipeRecord = { id: newId(), text: trimmed + "\n", updatedAt: Date.now() };
				state.recipes.unshift(record);
				first ??= record.id;
			}
			if (first) state.activeId = first;
			persist(state);
		},
		setActiveRecipe: (state, action: PayloadAction<string>) => {
			if (state.recipes.some((r) => r.id === action.payload)) {
				state.activeId = action.payload;
				persist(state);
			}
		},
	},
});

export const {
	hydrateRecipes,
	createRecipe,
	updateRecipeText,
	duplicateRecipe,
	deleteRecipe,
	importRecipes,
	setActiveRecipe,
} = recipesSlice.actions;

export const selectRecipes = (state: RootState) => state.recipes.recipes;
export const selectActiveRecipe = (state: RootState) =>
	state.recipes.recipes.find((r) => r.id === state.recipes.activeId) ?? null;
export const selectRecipesHydrated = (state: RootState) => state.recipes.hydrated;
export const selectRecipesStorageError = (state: RootState) => state.recipes.storageError;

export default recipesSlice.reducer;
