import { configureStore } from "@reduxjs/toolkit";
import colorPickerReducer from "./slices/colorPickerSlice";
import paletteReducer from "./slices/paletteSlice";
import themeReducer from "./slices/themeSlice";
import uiReducer from "./slices/uiSlice";
import userPreferencesReducer from "./slices/userPreferencesSlice";
import favoritesReducer from "./slices/favoritesSlice";

export const store = configureStore({
	reducer: {
		colorPicker: colorPickerReducer,
		palette: paletteReducer,
		theme: themeReducer,
		ui: uiReducer,
		userPreferences: userPreferencesReducer,
		favorites: favoritesReducer,
	},
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
