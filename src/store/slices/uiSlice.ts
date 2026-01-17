import { createSlice } from "@reduxjs/toolkit";

interface UiState {
	mobileMenuOpen: boolean;
}

const initialState: UiState = {
	mobileMenuOpen: false,
};

const uiSlice = createSlice({
	name: "ui",
	initialState,
	reducers: {
		toggleMobileMenu: (state) => {
			state.mobileMenuOpen = !state.mobileMenuOpen;
		},
		openMobileMenu: (state) => {
			state.mobileMenuOpen = true;
		},
		closeMobileMenu: (state) => {
			state.mobileMenuOpen = false;
		},
	},
});

export const { toggleMobileMenu, openMobileMenu, closeMobileMenu } = uiSlice.actions;
export default uiSlice.reducer;
