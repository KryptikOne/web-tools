import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type HarmonyType = "analogous" | "monochromatic" | "complementary" | "split-complementary" | "triadic" | "tetradic" | "square";

export interface PaletteColor {
	id: number;
	hex: string;
	locked: boolean;
}

export interface SavedPalette {
	id: number;
	colors: string[];
	harmony: HarmonyType;
}

// Muted Spectrum as the default preset
const INITIAL_COLORS = ["#001219", "#005f73", "#0a9396", "#94d2bd", "#e9d8a6", "#ee9b00", "#ca6702", "#bb3e03", "#ae2012", "#9b2226"];

const INITIAL_PALETTE: PaletteColor[] = INITIAL_COLORS.map((hex, i) => ({
	id: i,
	hex,
	locked: false,
}));

interface PaletteState {
	palette: PaletteColor[];
	harmony: HarmonyType;
	baseHue: number;
	saturation: number;
	lightness: number;
	savedPalettes: SavedPalette[];
}

const STORAGE_KEY = "palette-generator-state";

function loadStateFromStorage(): PaletteState | null {
	if (typeof window === "undefined") return null;

	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) {
			return JSON.parse(stored);
		}
	} catch {
		// Ignore localStorage errors
	}
	return null;
}

function saveStateToStorage(state: PaletteState) {
	if (typeof window === "undefined") return;

	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
	} catch {
		// Ignore localStorage errors
	}
}

const initialState: PaletteState = {
	palette: INITIAL_PALETTE,
	harmony: "analogous",
	baseHue: 180,
	saturation: 0.15,
	lightness: 0.65,
	savedPalettes: [],
};

const paletteSlice = createSlice({
	name: "palette",
	initialState,
	reducers: {
		// Load state from localStorage (called on hydration)
		hydrateFromStorage: (state) => {
			const stored = loadStateFromStorage();
			if (stored) {
				state.palette = stored.palette;
				state.harmony = stored.harmony;
				state.baseHue = stored.baseHue;
				state.saturation = stored.saturation;
				state.lightness = stored.lightness;
				state.savedPalettes = stored.savedPalettes;
			}
		},

		setPalette: (state, action: PayloadAction<PaletteColor[]>) => {
			state.palette = action.payload;
			saveStateToStorage(state);
		},

		setHarmony: (state, action: PayloadAction<HarmonyType>) => {
			state.harmony = action.payload;
			saveStateToStorage(state);
		},

		setBaseHue: (state, action: PayloadAction<number>) => {
			state.baseHue = action.payload;
			saveStateToStorage(state);
		},

		setSaturation: (state, action: PayloadAction<number>) => {
			state.saturation = action.payload;
			saveStateToStorage(state);
		},

		setLightness: (state, action: PayloadAction<number>) => {
			state.lightness = action.payload;
			saveStateToStorage(state);
		},

		toggleLock: (state, action: PayloadAction<number>) => {
			const color = state.palette.find((c) => c.id === action.payload);
			if (color) {
				color.locked = !color.locked;
				saveStateToStorage(state);
			}
		},

		updateColor: (state, action: PayloadAction<{ id: number; hex: string }>) => {
			const color = state.palette.find((c) => c.id === action.payload.id);
			if (color) {
				color.hex = action.payload.hex;
				saveStateToStorage(state);
			}
		},

		addColor: (state, action: PayloadAction<string>) => {
			if (state.palette.length < 8) {
				state.palette.push({
					id: state.palette.length,
					hex: action.payload,
					locked: false,
				});
				saveStateToStorage(state);
			}
		},

		removeLastColor: (state) => {
			if (state.palette.length > 2) {
				state.palette.pop();
				saveStateToStorage(state);
			}
		},

		savePalette: (state) => {
			const newSaved: SavedPalette = {
				id: Date.now(),
				colors: state.palette.map((c) => c.hex),
				harmony: state.harmony,
			};
			state.savedPalettes = [newSaved, ...state.savedPalettes.slice(0, 11)];
			saveStateToStorage(state);
		},

		loadSavedPalette: (state, action: PayloadAction<SavedPalette>) => {
			state.harmony = action.payload.harmony;
			state.palette = action.payload.colors.map((hex, i) => ({
				id: i,
				hex,
				locked: false,
			}));
			saveStateToStorage(state);
		},

		loadPreset: (state, action: PayloadAction<string[]>) => {
			state.palette = action.payload.map((hex, i) => ({
				id: i,
				hex,
				locked: false,
			}));
			saveStateToStorage(state);
		},
	},
});

export const {
	hydrateFromStorage,
	setPalette,
	setHarmony,
	setBaseHue,
	setSaturation,
	setLightness,
	toggleLock,
	updateColor,
	addColor,
	removeLastColor,
	savePalette,
	loadSavedPalette,
	loadPreset,
} = paletteSlice.actions;

export default paletteSlice.reducer;
