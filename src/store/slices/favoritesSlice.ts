import { createSlice, PayloadAction, createSelector } from "@reduxjs/toolkit";
import type { RootState } from "@/store";
import { TOOLS_REGISTRY } from "@/config/tools-registry";
import type { Tool } from "@/types/tools";

interface FavoritesState {
	ids: string[];
	/** Sidebar Favorites list folded up (persisted) */
	collapsed: boolean;
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
	collapsed: false,
};

const favoritesSlice = createSlice({
	name: "favorites",
	initialState,
	reducers: {
		hydrateFavorites: (state) => {
			const stored = loadFromStorage();
			if (Array.isArray(stored.ids)) state.ids = stored.ids;
			if (typeof stored.collapsed === "boolean") state.collapsed = stored.collapsed;
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
		toggleFavoritesCollapsed: (state) => {
			state.collapsed = !state.collapsed;
			saveToStorage(state);
		},
	},
});

export const {
	hydrateFavorites,
	toggleFavorite,
	reorderFavorites,
	toggleFavoritesCollapsed,
} = favoritesSlice.actions;

// Selectors
export const selectFavoriteIds = (state: RootState) => state.favorites.ids;
export const selectFavoritesCollapsed = (state: RootState) => state.favorites.collapsed;
export const selectIsFavorite = (id: string) => (state: RootState) =>
	state.favorites.ids.includes(id);

const TOOLS_BY_ID = new Map(TOOLS_REGISTRY.map((t) => [t.id, t]));

export const selectFavoriteTools = createSelector(
	selectFavoriteIds,
	(ids): Tool[] => {
		const result: Tool[] = [];
		for (const id of ids) {
			const tool = TOOLS_BY_ID.get(id);
			if (tool && tool.implemented) result.push(tool);
		}
		return result;
	}
);

export default favoritesSlice.reducer;
