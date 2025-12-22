import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface SavedColor {
	hex: string;
	oklch: { l: number; c: number; h: number };
	alpha: number;
	id: number;
}

interface ColorPickerState {
	oklch: { l: number; c: number; h: number };
	alpha: number;
	savedColors: SavedColor[];
}

const STORAGE_KEY = "color-picker-state";

function loadFromStorage(): Partial<ColorPickerState> {
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

function saveToStorage(state: ColorPickerState) {
	if (typeof window === "undefined") return;

	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
	} catch {
		// Ignore storage errors
	}
}

const initialState: ColorPickerState = {
	oklch: { l: 0.65, c: 0.18, h: 250 },
	alpha: 1,
	savedColors: [],
};

const colorPickerSlice = createSlice({
	name: "colorPicker",
	initialState,
	reducers: {
		hydrateColorPicker: (state) => {
			const stored = loadFromStorage();
			if (stored.oklch) {
				state.oklch = stored.oklch;
			}
			if (stored.alpha !== undefined) {
				state.alpha = stored.alpha;
			}
			if (stored.savedColors) {
				state.savedColors = stored.savedColors;
			}
		},

		setOklch: (state, action: PayloadAction<{ l: number; c: number; h: number }>) => {
			state.oklch = action.payload;
			saveToStorage(state);
		},

		setAlpha: (state, action: PayloadAction<number>) => {
			state.alpha = action.payload;
			saveToStorage(state);
		},

		saveColor: (state, action: PayloadAction<SavedColor>) => {
			state.savedColors = [action.payload, ...state.savedColors.slice(0, 23)];
			saveToStorage(state);
		},

		loadColor: (state, action: PayloadAction<SavedColor>) => {
			state.oklch = action.payload.oklch;
			state.alpha = action.payload.alpha;
			saveToStorage(state);
		},

		clearSavedColors: (state) => {
			state.savedColors = [];
			saveToStorage(state);
		},

		removeColor: (state, action: PayloadAction<number>) => {
			state.savedColors = state.savedColors.filter((c) => c.id !== action.payload);
			saveToStorage(state);
		},
	},
});

export const { hydrateColorPicker, setOklch, setAlpha, saveColor, loadColor, clearSavedColors, removeColor } = colorPickerSlice.actions;
export default colorPickerSlice.reducer;
