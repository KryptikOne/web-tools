import { describe, it, expect, beforeEach, vi } from "vitest";
import favoritesReducer, {
	hydrateFavorites,
	toggleFavorite,
	reorderFavorites,
	selectFavoriteIds,
	selectIsFavorite,
	selectFavoriteTools,
	STORAGE_KEY,
} from "@/store/slices/favoritesSlice";
import { ToolCategory } from "@/types/tools";

vi.mock("@/config/tools-registry", async (importOriginal) => {
	const original = await importOriginal<typeof import("@/config/tools-registry")>();
	return {
		...original,
		TOOLS_REGISTRY: [
			...original.TOOLS_REGISTRY,
			{
				id: "stub-unimplemented",
				name: "Stub Unimplemented",
				description: "Test stub",
				category: "css-design",
				route: "/tools/stub-unimplemented",
				implemented: false,
			},
		],
	};
});

const stateWith = (overrides: Partial<ReturnType<typeof favoritesReducer>> = {}) =>
	({ favorites: { ids: [], ...overrides } } as never);

describe("favoritesSlice", () => {
	beforeEach(() => {
		localStorage.clear();
	});

	it("starts with empty ids", () => {
		const state = favoritesReducer(undefined, { type: "@@INIT" });
		expect(state.ids).toEqual([]);
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

	it("persists state to localStorage on mutating actions", () => {
		favoritesReducer(undefined, toggleFavorite("color-picker"));
		const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
		expect(stored.ids).toEqual(["color-picker"]);
	});

	it("hydrateFavorites loads ids from localStorage", () => {
		localStorage.setItem(
			STORAGE_KEY,
			JSON.stringify({ ids: ["uuid-generator", "hash-generator"] })
		);
		const state = favoritesReducer(undefined, hydrateFavorites());
		expect(state.ids).toEqual(["uuid-generator", "hash-generator"]);
	});

	it("hydrateFavorites is a no-op when localStorage is empty", () => {
		const state = favoritesReducer(undefined, hydrateFavorites());
		expect(state).toEqual({ ids: [] });
	});

	it("hydrateFavorites does not write to localStorage", () => {
		const pristine = JSON.stringify({ ids: ["color-picker"] });
		localStorage.setItem(STORAGE_KEY, pristine);
		favoritesReducer(undefined, hydrateFavorites());
		expect(localStorage.getItem(STORAGE_KEY)).toBe(pristine);
	});

	it("selectFavoriteIds returns the ids array", () => {
		expect(selectFavoriteIds(stateWith({ ids: ["a", "b"] }))).toEqual(["a", "b"]);
	});

	it("selectIsFavorite returns true when id is present", () => {
		expect(selectIsFavorite("a")(stateWith({ ids: ["a", "b"] }))).toBe(true);
		expect(selectIsFavorite("z")(stateWith({ ids: ["a", "b"] }))).toBe(false);
	});
});

describe("selectFavoriteTools", () => {
	it("returns tools matching ids, in id order", () => {
		const state = stateWith({ ids: ["jwt-decoder", "color-picker"] });
		const tools = selectFavoriteTools(state);
		expect(tools.map((t) => t.id)).toEqual(["jwt-decoder", "color-picker"]);
	});

	it("filters out unknown ids", () => {
		const state = stateWith({ ids: ["color-picker", "does-not-exist"] });
		const tools = selectFavoriteTools(state);
		expect(tools.map((t) => t.id)).toEqual(["color-picker"]);
	});

	it("filters out unimplemented tools", () => {
		const state = stateWith({ ids: ["color-picker", "stub-unimplemented"] });
		const tools = selectFavoriteTools(state);
		expect(tools.every((t) => t.implemented)).toBe(true);
		expect(tools.find((t) => t.id === "stub-unimplemented")).toBeUndefined();
	});

	it("returns the actual Tool objects, with name and route", () => {
		const state = stateWith({ ids: ["color-picker"] });
		const tools = selectFavoriteTools(state);
		expect(tools[0]).toMatchObject({
			id: "color-picker",
			name: "Color Picker",
			route: "/tools/color-picker",
			category: ToolCategory.CSS_DESIGN,
		});
	});
});
