import { configureStore } from '@reduxjs/toolkit';
import colorPickerReducer from './slices/colorPickerSlice';
import paletteReducer from './slices/paletteSlice';

export const store = configureStore({
  reducer: {
    colorPicker: colorPickerReducer,
    palette: paletteReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
