import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "@/store";
import { TOOLS_REGISTRY } from "@/config/tools-registry";
import type { Tool } from "@/types/tools";

interface FavoritesState {
	ids: string[];
	showOnlyFavorites: boolean;
}

export const STORAGE_KEY = "favorites-state";

function loadFromStorage(): Partial<FavoritesState> {
	if (typeof window === "undefined") return {};

	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) return JSON.parse(stored);
	} catch {
		// ignore
	}

	return {};
}

function saveToStorage(state: FavoritesState) {
	if (typeof window === "undefined") return;

	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
	} catch {
		// ignore
	}
}

const initialState: FavoritesState = {
	ids: [],
	showOnlyFavorites: false,
};

const favoritesSlice = createSlice({
	name: "favorites",
	initialState,
	reducers: {
		hydrateFavorites: (state) => {
			const stored = loadFromStorage();
			if (Array.isArray(stored.ids)) state.ids = stored.ids;
			if (typeof stored.showOnlyFavorites === "boolean") {
				state.showOnlyFavorites = stored.showOnlyFavorites;
			}
		},
		toggleFavorite: (state, action: PayloadAction<string>) => {
			const id = action.payload;
			const index = state.ids.indexOf(id);
			if (index === -1) {
				state.ids.push(id);
			} else {
				state.ids.splice(index, 1);
			}
			saveToStorage(state);
		},
		reorderFavorites: (state, action: PayloadAction<string[]>) => {
			state.ids = action.payload;
			saveToStorage(state);
		},
		setShowOnlyFavorites: (state, action: PayloadAction<boolean>) => {
			state.showOnlyFavorites = action.payload;
			saveToStorage(state);
		},
	},
});

export const { hydrateFavorites, toggleFavorite, reorderFavorites, setShowOnlyFavorites } =
	favoritesSlice.actions;

// Selectors
export const selectFavoriteIds = (state: RootState) => state.favorites.ids;
export const selectIsFavorite = (id: string) => (state: RootState) =>
	state.favorites.ids.includes(id);
export const selectShowOnlyFavorites = (state: RootState) => state.favorites.showOnlyFavorites;

export const selectFavoriteTools = (state: RootState): Tool[] => {
	const ids = state.favorites.ids;
	const byId = new Map(TOOLS_REGISTRY.map((t) => [t.id, t]));
	const result: Tool[] = [];
	for (const id of ids) {
		const tool = byId.get(id);
		if (tool && tool.implemented) result.push(tool);
	}
	return result;
};

export default favoritesSlice.reducer;
