import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type ThemeMode = "light" | "dark";

interface ThemeState {
	mode: ThemeMode;
}

const STORAGE_KEY = "theme-state";

function loadThemeFromStorage(): ThemeMode {
	if (typeof window === "undefined") return "dark";

	try {
		// First check for new storage format
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) {
			const parsed = JSON.parse(stored);
			return parsed.mode || "dark";
		}

		// Fall back to legacy "theme" key for backwards compatibility
		const legacyTheme = localStorage.getItem("theme") as ThemeMode | null;
		if (legacyTheme === "light" || legacyTheme === "dark") {
			return legacyTheme;
		}
	} catch {
		// Ignore storage errors
	}

	return "dark";
}

function saveThemeToStorage(mode: ThemeMode) {
	if (typeof window === "undefined") return;

	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify({ mode }));
		// Also update legacy key for backwards compatibility
		localStorage.setItem("theme", mode);
	} catch {
		// Ignore storage errors
	}
}

function applyThemeToDocument(mode: ThemeMode) {
	if (typeof document !== "undefined") {
		document.documentElement.setAttribute("data-theme", mode);
	}
}

const initialState: ThemeState = {
	mode: "dark",
};

const themeSlice = createSlice({
	name: "theme",
	initialState,
	reducers: {
		hydrateTheme: (state) => {
			const mode = loadThemeFromStorage();
			state.mode = mode;
			applyThemeToDocument(mode);
		},

		setTheme: (state, action: PayloadAction<ThemeMode>) => {
			state.mode = action.payload;
			saveThemeToStorage(action.payload);
			applyThemeToDocument(action.payload);
		},

		toggleTheme: (state) => {
			const newMode = state.mode === "dark" ? "light" : "dark";
			state.mode = newMode;
			saveThemeToStorage(newMode);
			applyThemeToDocument(newMode);
		},
	},
});

export const { hydrateTheme, setTheme, toggleTheme } = themeSlice.actions;
export default themeSlice.reducer;
