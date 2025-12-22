import { configureStore } from "@reduxjs/toolkit";
import colorPickerReducer from "./slices/colorPickerSlice";
import paletteReducer from "./slices/paletteSlice";
import themeReducer from "./slices/themeSlice";
import userPreferencesReducer from "./slices/userPreferencesSlice";

export const store = configureStore({
	reducer: {
		colorPicker: colorPickerReducer,
		palette: paletteReducer,
		theme: themeReducer,
		userPreferences: userPreferencesReducer,
	},
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
