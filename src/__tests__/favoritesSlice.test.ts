import favoritesReducer, {
	hydrateFavorites,
	toggleFavorite,
	reorderFavorites,
	setShowOnlyFavorites,
	selectFavoriteIds,
	selectIsFavorite,
	selectShowOnlyFavorites,
} from "@/store/slices/favoritesSlice";

const STORAGE_KEY = "favorites-state";

const stateWith = (overrides: Partial<ReturnType<typeof favoritesReducer>> = {}) =>
	({ favorites: { ids: [], showOnlyFavorites: false, ...overrides } } as never);

describe("favoritesSlice", () => {
	beforeEach(() => {
		localStorage.clear();
	});

	it("starts with empty ids and showOnlyFavorites=false", () => {
		const state = favoritesReducer(undefined, { type: "@@INIT" });
		expect(state).toEqual({ ids: [], showOnlyFavorites: false });
	});

	it("toggleFavorite adds an id when missing", () => {
		const state = favoritesReducer(undefined, toggleFavorite("color-picker"));
		expect(state.ids).toEqual(["color-picker"]);
	});

	it("toggleFavorite appends new ids to the end", () => {
		let state = favoritesReducer(undefined, toggleFavorite("color-picker"));
		state = favoritesReducer(state, toggleFavorite("jwt-decoder"));
		expect(state.ids).toEqual(["color-picker", "jwt-decoder"]);
	});

	it("toggleFavorite removes an id when present", () => {
		let state = favoritesReducer(undefined, toggleFavorite("color-picker"));
		state = favoritesReducer(state, toggleFavorite("color-picker"));
		expect(state.ids).toEqual([]);
	});

	it("reorderFavorites replaces the id order", () => {
		let state = favoritesReducer(undefined, toggleFavorite("a"));
		state = favoritesReducer(state, toggleFavorite("b"));
		state = favoritesReducer(state, toggleFavorite("c"));
		state = favoritesReducer(state, reorderFavorites(["c", "a", "b"]));
		expect(state.ids).toEqual(["c", "a", "b"]);
	});

	it("setShowOnlyFavorites updates the flag", () => {
		const state = favoritesReducer(undefined, setShowOnlyFavorites(true));
		expect(state.showOnlyFavorites).toBe(true);
	});

	it("persists state to localStorage on mutating actions", () => {
		favoritesReducer(undefined, toggleFavorite("color-picker"));
		const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
		expect(stored.ids).toEqual(["color-picker"]);
	});

	it("hydrateFavorites loads ids and flag from localStorage", () => {
		localStorage.setItem(
			STORAGE_KEY,
			JSON.stringify({ ids: ["uuid-generator", "hash-generator"], showOnlyFavorites: true })
		);
		const state = favoritesReducer(undefined, hydrateFavorites());
		expect(state.ids).toEqual(["uuid-generator", "hash-generator"]);
		expect(state.showOnlyFavorites).toBe(true);
	});

	it("hydrateFavorites is a no-op when localStorage is empty", () => {
		const state = favoritesReducer(undefined, hydrateFavorites());
		expect(state).toEqual({ ids: [], showOnlyFavorites: false });
	});

	it("selectFavoriteIds returns the ids array", () => {
		expect(selectFavoriteIds(stateWith({ ids: ["a", "b"] }))).toEqual(["a", "b"]);
	});

	it("selectIsFavorite returns true when id is present", () => {
		expect(selectIsFavorite("a")(stateWith({ ids: ["a", "b"] }))).toBe(true);
		expect(selectIsFavorite("z")(stateWith({ ids: ["a", "b"] }))).toBe(false);
	});

	it("selectShowOnlyFavorites returns the flag", () => {
		expect(selectShowOnlyFavorites(stateWith({ showOnlyFavorites: true }))).toBe(true);
	});
});
