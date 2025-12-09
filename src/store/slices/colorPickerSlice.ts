import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface SavedColor {
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

const initialState: ColorPickerState = {
  oklch: { l: 0.65, c: 0.18, h: 250 },
  alpha: 1,
  savedColors: [],
};

const colorPickerSlice = createSlice({
  name: 'colorPicker',
  initialState,
  reducers: {
    setOklch: (state, action: PayloadAction<{ l: number; c: number; h: number }>) => {
      state.oklch = action.payload;
    },
    setAlpha: (state, action: PayloadAction<number>) => {
      state.alpha = action.payload;
    },
    saveColor: (state, action: PayloadAction<SavedColor>) => {
      state.savedColors = [action.payload, ...state.savedColors.slice(0, 23)];
    },
    loadColor: (state, action: PayloadAction<SavedColor>) => {
      state.oklch = action.payload.oklch;
      state.alpha = action.payload.alpha;
    },
    clearSavedColors: (state) => {
      state.savedColors = [];
    },
  },
});

export const { setOklch, setAlpha, saveColor, loadColor, clearSavedColors } = colorPickerSlice.actions;
export default colorPickerSlice.reducer;
