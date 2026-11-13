import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { UnitMode, FractionPrecision } from "@/lib/construction/imperialUtils";

interface UserPreferencesState {
	// PX/REM Calculator base font size
	baseFontSize: number;
	// Language preference (for future i18n)
	language: string;
	// Construction tools: how lengths are typed and shown
	constructionUnitMode: UnitMode;
	constructionPrecision: FractionPrecision;
}

const STORAGE_KEY = "user-preferences-state";

function loadFromStorage(): Partial<UserPreferencesState> {
	if (typeof window === "undefined") return {};

	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) {
			return JSON.parse(stored);
		}
	} catch {
		// Ignore storage errors
	}

	return {};
}

function saveToStorage(state: UserPreferencesState) {
	if (typeof window === "undefined") return;

	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
	} catch {
		// Ignore storage errors
	}
}

const initialState: UserPreferencesState = {
	baseFontSize: 16,
	language: "en",
	constructionUnitMode: "ft-in",
	constructionPrecision: 16,
};

const userPreferencesSlice = createSlice({
	name: "userPreferences",
	initialState,
	reducers: {
		hydrateUserPreferences: (state) => {
			const stored = loadFromStorage();
			if (stored.baseFontSize !== undefined) {
				state.baseFontSize = stored.baseFontSize;
			}
			if (stored.language !== undefined) {
				state.language = stored.language;
			}
			if (stored.constructionUnitMode !== undefined) {
				state.constructionUnitMode = stored.constructionUnitMode;
			}
			if (stored.constructionPrecision !== undefined) {
				state.constructionPrecision = stored.constructionPrecision;
			}
		},

		setBaseFontSize: (state, action: PayloadAction<number>) => {
			state.baseFontSize = action.payload;
			saveToStorage(state);
		},

		setLanguage: (state, action: PayloadAction<string>) => {
			state.language = action.payload;
			saveToStorage(state);
		},

		setConstructionUnitMode: (state, action: PayloadAction<UnitMode>) => {
			state.constructionUnitMode = action.payload;
			saveToStorage(state);
		},

		setConstructionPrecision: (state, action: PayloadAction<FractionPrecision>) => {
			state.constructionPrecision = action.payload;
			saveToStorage(state);
		},
	},
});

export const { hydrateUserPreferences, setBaseFontSize, setLanguage, setConstructionUnitMode, setConstructionPrecision } = userPreferencesSlice.actions;
export default userPreferencesSlice.reducer;
