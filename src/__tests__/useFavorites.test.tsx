import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import favoritesReducer from "@/store/slices/favoritesSlice";
import { useFavorites } from "@/hooks/useFavorites";

function makeWrapper() {
	const store = configureStore({ reducer: { favorites: favoritesReducer } });
	function Wrapper({ children }: { children: React.ReactNode }) {
		return <Provider store={store}>{children}</Provider>;
	}
	return Wrapper;
}

describe("useFavorites", () => {
	beforeEach(() => {
		localStorage.clear();
	});

	it("returns empty favorites initially", () => {
		const { result } = renderHook(() => useFavorites(), { wrapper: makeWrapper() });
		expect(result.current.favoriteIds).toEqual([]);
		expect(result.current.favorites).toEqual([]);
	});

	it("isFavorite reflects current state", () => {
		const { result } = renderHook(() => useFavorites(), { wrapper: makeWrapper() });
		expect(result.current.isFavorite("color-picker")).toBe(false);
		act(() => result.current.toggle("color-picker"));
		expect(result.current.isFavorite("color-picker")).toBe(true);
	});

	it("toggle adds and removes ids", () => {
		const { result } = renderHook(() => useFavorites(), { wrapper: makeWrapper() });
		act(() => result.current.toggle("a"));
		act(() => result.current.toggle("b"));
		expect(result.current.favoriteIds).toEqual(["a", "b"]);
		act(() => result.current.toggle("a"));
		expect(result.current.favoriteIds).toEqual(["b"]);
	});

	it("reorder replaces the order", () => {
		const { result } = renderHook(() => useFavorites(), { wrapper: makeWrapper() });
		act(() => result.current.toggle("color-picker"));
		act(() => result.current.toggle("jwt-decoder"));
		act(() => result.current.reorder(["jwt-decoder", "color-picker"]));
		expect(result.current.favoriteIds).toEqual(["jwt-decoder", "color-picker"]);
	});
});
