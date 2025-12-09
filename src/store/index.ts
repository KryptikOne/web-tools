import { configureStore } from '@reduxjs/toolkit';
import colorPickerReducer from './slices/colorPickerSlice';

export const store = configureStore({
  reducer: {
    colorPicker: colorPickerReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
