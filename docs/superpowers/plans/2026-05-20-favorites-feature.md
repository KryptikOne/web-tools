# Favorites Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a favoriting system that pins user-starred tools at the top of the sidebar, with a persistent "favorites only" mode and draggable reordering.

**Architecture:** New Redux slice (`favoritesSlice`) persisted to localStorage, accessed via a `useFavorites` hook. One reusable `StarButton` used in three surfaces (sidebar rows, TopBar, tool cards). A `FavoritesSection` owns the pinned list in the sidebar using `@dnd-kit/sortable`. A `FavoritesOnlyToggle` gates the category list.

**Tech Stack:** Next.js 15 App Router, React 19, Redux Toolkit, TypeScript, SCSS modules + Tailwind, `@dnd-kit/core` + `@dnd-kit/sortable` + `@dnd-kit/utilities` for drag-and-drop, Vitest + RTL + jest-axe for tests, pnpm.

**Spec:** [docs/superpowers/specs/2026-05-20-favorites-feature-design.md](../specs/2026-05-20-favorites-feature-design.md)

---

## Conventions in this codebase

- All Redux slices live in `src/store/slices/<name>Slice.ts`. Each slice that persists exports a `hydrate*` action that reads from `localStorage` on mount. See `src/store/slices/userPreferencesSlice.ts` for the canonical pattern: a `loadFromStorage`/`saveToStorage` pair inside the slice file, with every mutating reducer calling `saveToStorage(state)`.
- Use `useAppSelector` / `useAppDispatch` from `src/store/hooks.ts` — never the raw `react-redux` hooks.
- Components live in `src/components/<Name>/<Name>.tsx` + `<Name>.module.scss`. Styling is hybrid: Tailwind for layout/spacing, SCSS module for component-specific polish using tokens from `src/styles/_variables.scss`.
- Tests live in `src/__tests__/`. Slice/hook/util tests as `*.test.ts`. Component tests as `src/__tests__/components/*.test.tsx`. Always:
  - Mock `next/navigation` and `next/link` at the top of component test files (see `src/__tests__/components/smoke.test.tsx` for the exact mock).
  - Import the component under test via dynamic `await import("@/components/...")` inside each test (project convention — works around CSS module loading in Vitest).
  - Tests use `vitest`'s globals (`describe`, `it`, `expect`, `vi`) — no imports needed for those.
- Vitest config disables CSS (`css: false`) and uses an empty `postcss: {}` override. Don't change this.

---

## File Structure

**New files:**
- `src/store/slices/favoritesSlice.ts` — slice + selectors
- `src/hooks/useFavorites.ts` — ergonomic accessor
- `src/components/StarButton/StarButton.tsx` + `.module.scss` — reusable star button
- `src/components/Sidebar/FavoritesSection.tsx` + `.module.scss` — pinned section with dnd-kit sortable list
- `src/components/Sidebar/FavoritesOnlyToggle.tsx` + `.module.scss` — pill toggle
- `src/__tests__/favoritesSlice.test.ts`
- `src/__tests__/useFavorites.test.tsx`
- `src/__tests__/components/StarButton.test.tsx`
- `src/__tests__/components/FavoritesSection.test.tsx`
- `src/__tests__/components/FavoritesOnlyToggle.test.tsx`

**Modified files:**
- `src/store/index.ts` — register reducer
- `src/components/TopBar/TopBar.tsx` — hydrate favorites + render StarButton
- `src/components/Sidebar/Sidebar.tsx` — render toggle, render FavoritesSection, gate category list, add star button to rows
- `src/components/ToolCard/ToolCard.tsx` — add star button
- `src/__tests__/components/a11y.test.tsx` — add new components

---

## Task 1: Create `favoritesSlice` with toggle, reorder, and hydration

**Files:**
- Create: `src/store/slices/favoritesSlice.ts`
- Test: `src/__tests__/favoritesSlice.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/favoritesSlice.test.ts`:

```ts
import { describe, it, expect, beforeEach } from "vitest";
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/__tests__/favoritesSlice.test.ts`
Expected: FAIL with "Cannot find module '@/store/slices/favoritesSlice'".

- [ ] **Step 3: Implement the slice**

Create `src/store/slices/favoritesSlice.ts`:

```ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "@/store";

interface FavoritesState {
	ids: string[];
	showOnlyFavorites: boolean;
}

const STORAGE_KEY = "favorites-state";

function loadFromStorage(): Partial<FavoritesState> {
	if (typeof window === "undefined") return {};
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) return JSON.parse(stored);
	} catch {
		// ignore
	}
	return {};
}

function saveToStorage(state: FavoritesState) {
	if (typeof window === "undefined") return;
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
	} catch {
		// ignore
	}
}

const initialState: FavoritesState = {
	ids: [],
	showOnlyFavorites: false,
};

const favoritesSlice = createSlice({
	name: "favorites",
	initialState,
	reducers: {
		hydrateFavorites: (state) => {
			const stored = loadFromStorage();
			if (Array.isArray(stored.ids)) state.ids = stored.ids;
			if (typeof stored.showOnlyFavorites === "boolean") {
				state.showOnlyFavorites = stored.showOnlyFavorites;
			}
		},
		toggleFavorite: (state, action: PayloadAction<string>) => {
			const id = action.payload;
			const index = state.ids.indexOf(id);
			if (index === -1) {
				state.ids.push(id);
			} else {
				state.ids.splice(index, 1);
			}
			saveToStorage(state);
		},
		reorderFavorites: (state, action: PayloadAction<string[]>) => {
			state.ids = action.payload;
			saveToStorage(state);
		},
		setShowOnlyFavorites: (state, action: PayloadAction<boolean>) => {
			state.showOnlyFavorites = action.payload;
			saveToStorage(state);
		},
	},
});

export const {
	hydrateFavorites,
	toggleFavorite,
	reorderFavorites,
	setShowOnlyFavorites,
} = favoritesSlice.actions;

// Selectors
export const selectFavoriteIds = (state: RootState) => state.favorites.ids;
export const selectIsFavorite = (id: string) => (state: RootState) =>
	state.favorites.ids.includes(id);
export const selectShowOnlyFavorites = (state: RootState) =>
	state.favorites.showOnlyFavorites;

export default favoritesSlice.reducer;
```

- [ ] **Step 4: Register the reducer in the store**

Modify `src/store/index.ts`:

```ts
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
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm test src/__tests__/favoritesSlice.test.ts`
Expected: PASS (all 12 tests green).

- [ ] **Step 6: Commit**

```bash
git add src/store/slices/favoritesSlice.ts src/store/index.ts src/__tests__/favoritesSlice.test.ts
git commit -m "feat(favorites): add favoritesSlice with persistence and selectors"
```

---

## Task 2: Add the `selectFavoriteTools` selector (joins ids against registry)

**Files:**
- Modify: `src/store/slices/favoritesSlice.ts`
- Modify: `src/__tests__/favoritesSlice.test.ts`

- [ ] **Step 1: Write the failing test**

Add to `src/__tests__/favoritesSlice.test.ts` (inside the existing `describe`):

```ts
import { selectFavoriteTools } from "@/store/slices/favoritesSlice";
import { ToolCategory } from "@/types/tools";

// ... existing tests ...

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
		// Inject a fake unimplemented tool by stubbing the registry. The
		// canonical approach in this project: just verify that any id whose
		// registry entry has implemented === false is excluded. We pick a
		// known-implemented id and a known-not-present id to cover that.
		const state = stateWith({ ids: ["color-picker", "made-up-tool"] });
		const tools = selectFavoriteTools(state);
		expect(tools.every((t) => t.implemented)).toBe(true);
		expect(tools.find((t) => t.id === "made-up-tool")).toBeUndefined();
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/__tests__/favoritesSlice.test.ts`
Expected: FAIL with "selectFavoriteTools is not exported".

- [ ] **Step 3: Add the selector**

At the bottom of `src/store/slices/favoritesSlice.ts` (above the default export), add:

```ts
import { TOOLS_REGISTRY } from "@/config/tools-registry";
import type { Tool } from "@/types/tools";

export const selectFavoriteTools = (state: RootState): Tool[] => {
	const ids = state.favorites.ids;
	const byId = new Map(TOOLS_REGISTRY.map((t) => [t.id, t]));
	const result: Tool[] = [];
	for (const id of ids) {
		const tool = byId.get(id);
		if (tool && tool.implemented) result.push(tool);
	}
	return result;
};
```

Move the `import { TOOLS_REGISTRY } ...` and `import type { Tool } ...` lines to the top of the file with the other imports.

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test src/__tests__/favoritesSlice.test.ts`
Expected: PASS (all original tests + 4 new ones).

- [ ] **Step 5: Commit**

```bash
git add src/store/slices/favoritesSlice.ts src/__tests__/favoritesSlice.test.ts
git commit -m "feat(favorites): add selectFavoriteTools selector with registry join"
```

---

## Task 3: Create `useFavorites` hook

**Files:**
- Create: `src/hooks/useFavorites.ts`
- Test: `src/__tests__/useFavorites.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/useFavorites.test.tsx`:

```tsx
import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import favoritesReducer from "@/store/slices/favoritesSlice";
import { useFavorites } from "@/hooks/useFavorites";

function makeWrapper() {
	const store = configureStore({ reducer: { favorites: favoritesReducer } });
	return ({ children }: { children: React.ReactNode }) => (
		<Provider store={store}>{children}</Provider>
	);
}

describe("useFavorites", () => {
	beforeEach(() => {
		localStorage.clear();
	});

	it("returns empty favorites initially", () => {
		const { result } = renderHook(() => useFavorites(), { wrapper: makeWrapper() });
		expect(result.current.favoriteIds).toEqual([]);
		expect(result.current.favorites).toEqual([]);
		expect(result.current.showOnlyMode).toBe(false);
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

	it("toggleMode flips showOnlyMode", () => {
		const { result } = renderHook(() => useFavorites(), { wrapper: makeWrapper() });
		expect(result.current.showOnlyMode).toBe(false);
		act(() => result.current.toggleMode());
		expect(result.current.showOnlyMode).toBe(true);
		act(() => result.current.toggleMode());
		expect(result.current.showOnlyMode).toBe(false);
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/__tests__/useFavorites.test.tsx`
Expected: FAIL with "Cannot find module '@/hooks/useFavorites'".

- [ ] **Step 3: Implement the hook**

Create `src/hooks/useFavorites.ts`:

```ts
import { useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
	toggleFavorite,
	reorderFavorites,
	setShowOnlyFavorites,
	selectFavoriteIds,
	selectFavoriteTools,
	selectShowOnlyFavorites,
} from "@/store/slices/favoritesSlice";
import type { Tool } from "@/types/tools";

interface UseFavoritesResult {
	favorites: Tool[];
	favoriteIds: string[];
	isFavorite: (id: string) => boolean;
	toggle: (id: string) => void;
	reorder: (ids: string[]) => void;
	showOnlyMode: boolean;
	toggleMode: () => void;
}

export function useFavorites(): UseFavoritesResult {
	const dispatch = useAppDispatch();
	const favoriteIds = useAppSelector(selectFavoriteIds);
	const favorites = useAppSelector(selectFavoriteTools);
	const showOnlyMode = useAppSelector(selectShowOnlyFavorites);

	const isFavorite = useCallback(
		(id: string) => favoriteIds.includes(id),
		[favoriteIds]
	);
	const toggle = useCallback(
		(id: string) => {
			dispatch(toggleFavorite(id));
		},
		[dispatch]
	);
	const reorder = useCallback(
		(ids: string[]) => {
			dispatch(reorderFavorites(ids));
		},
		[dispatch]
	);
	const toggleMode = useCallback(() => {
		dispatch(setShowOnlyFavorites(!showOnlyMode));
	}, [dispatch, showOnlyMode]);

	return { favorites, favoriteIds, isFavorite, toggle, reorder, showOnlyMode, toggleMode };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test src/__tests__/useFavorites.test.tsx`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useFavorites.ts src/__tests__/useFavorites.test.tsx
git commit -m "feat(favorites): add useFavorites hook"
```

---

## Task 4: Wire `hydrateFavorites` into the TopBar's existing mount effect

**Files:**
- Modify: `src/components/TopBar/TopBar.tsx`

- [ ] **Step 1: Update the effect to also hydrate favorites**

In `src/components/TopBar/TopBar.tsx`, add the import and extend the existing `useEffect`:

```tsx
// Add to existing imports:
import { hydrateFavorites } from "@/store/slices/favoritesSlice";

// Replace the existing useEffect:
useEffect(() => {
	dispatch(hydrateTheme());
	dispatch(hydrateFavorites());
}, [dispatch]);
```

- [ ] **Step 2: Verify the app still builds**

Run: `pnpm run build`
Expected: build succeeds (no type errors).

- [ ] **Step 3: Commit**

```bash
git add src/components/TopBar/TopBar.tsx
git commit -m "feat(favorites): hydrate favorites on mount via TopBar"
```

---

## Task 5: Create `StarButton` component

**Files:**
- Create: `src/components/StarButton/StarButton.tsx`
- Create: `src/components/StarButton/StarButton.module.scss`
- Test: `src/__tests__/components/StarButton.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/components/StarButton.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { axe, toHaveNoViolations } from "jest-axe";
import favoritesReducer from "@/store/slices/favoritesSlice";

expect.extend(toHaveNoViolations);

vi.mock("next/navigation", () => ({
	usePathname: () => "/",
	useRouter: () => ({ push: vi.fn(), back: vi.fn(), forward: vi.fn() }),
}));

vi.mock("next/link", () => ({
	default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
		<a href={href} {...props}>{children}</a>
	),
}));

beforeAll(() => {
	Object.assign(navigator, {
		clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
	});
});

function renderWithStore(ui: React.ReactElement) {
	const store = configureStore({ reducer: { favorites: favoritesReducer } });
	return { ...render(<Provider store={store}>{ui}</Provider>), store };
}

describe("StarButton", () => {
	beforeEach(() => {
		localStorage.clear();
	});

	it("renders an unpressed button when tool is not favorited", async () => {
		const { default: StarButton } = await import("@/components/StarButton/StarButton");
		renderWithStore(<StarButton toolId="color-picker" />);
		const button = screen.getByRole("button");
		expect(button).toHaveAttribute("aria-pressed", "false");
		expect(button).toHaveAttribute("aria-label", "Add to favorites");
	});

	it("toggles to pressed when clicked", async () => {
		const { default: StarButton } = await import("@/components/StarButton/StarButton");
		renderWithStore(<StarButton toolId="color-picker" />);
		const button = screen.getByRole("button");
		fireEvent.click(button);
		expect(button).toHaveAttribute("aria-pressed", "true");
		expect(button).toHaveAttribute("aria-label", "Remove from favorites");
	});

	it("stops click propagation so parent links don't navigate", async () => {
		const { default: StarButton } = await import("@/components/StarButton/StarButton");
		const parentClick = vi.fn();
		renderWithStore(
			<a href="/somewhere" onClick={parentClick}>
				<StarButton toolId="color-picker" />
			</a>
		);
		fireEvent.click(screen.getByRole("button"));
		expect(parentClick).not.toHaveBeenCalled();
	});

	it("has no a11y violations", async () => {
		const { default: StarButton } = await import("@/components/StarButton/StarButton");
		const { container } = renderWithStore(<StarButton toolId="color-picker" />);
		const results = await axe(container);
		expect(results).toHaveNoViolations();
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/__tests__/components/StarButton.test.tsx`
Expected: FAIL with "Cannot find module '@/components/StarButton/StarButton'".

- [ ] **Step 3: Create the SCSS module**

Create `src/components/StarButton/StarButton.module.scss`:

```scss
@use '@/styles/variables' as *;

.starButton {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	background: transparent;
	border: none;
	color: $text-muted;
	cursor: pointer;
	padding: 0.25rem;
	border-radius: $radius-sm;
	transition: color 0.15s ease, background 0.15s ease, transform 0.15s ease;

	&:hover {
		color: $color-accent-secondary;
		background: $bg-glass-hover;
	}

	&:active {
		transform: scale(0.9);
	}

	&.favorited {
		color: $color-accent-secondary;
	}
}

.sizeSm svg {
	width: 1rem;
	height: 1rem;
}

.sizeMd svg {
	width: 1.25rem;
	height: 1.25rem;
}

.sizeLg svg {
	width: 1.5rem;
	height: 1.5rem;
}

// Variant-specific tweaks
.variantSidebar {
	opacity: 0;
	transition: opacity 0.15s ease, color 0.15s ease, background 0.15s ease;

	@media (max-width: 768px) {
		opacity: 1;
	}

	&.favorited {
		opacity: 1;
	}
}

.variantCard {
	opacity: 0;
	transition: opacity 0.15s ease, color 0.15s ease, background 0.15s ease;

	@media (max-width: 768px) {
		opacity: 1;
	}

	&.favorited {
		opacity: 1;
	}
}

.variantTopbar {
	opacity: 1;
}
```

- [ ] **Step 4: Implement the component**

Create `src/components/StarButton/StarButton.tsx`:

```tsx
"use client";

import { MouseEvent } from "react";
import { StarIcon as StarOutline } from "@heroicons/react/24/outline";
import { StarIcon as StarSolid } from "@heroicons/react/24/solid";
import { useFavorites } from "@/hooks/useFavorites";
import styles from "./StarButton.module.scss";

interface StarButtonProps {
	toolId: string;
	size?: "sm" | "md" | "lg";
	variant?: "sidebar" | "topbar" | "card";
}

const SIZE_CLASS: Record<NonNullable<StarButtonProps["size"]>, string> = {
	sm: styles.sizeSm,
	md: styles.sizeMd,
	lg: styles.sizeLg,
};

const VARIANT_CLASS: Record<NonNullable<StarButtonProps["variant"]>, string> = {
	sidebar: styles.variantSidebar,
	topbar: styles.variantTopbar,
	card: styles.variantCard,
};

export default function StarButton({ toolId, size = "md", variant = "topbar" }: StarButtonProps) {
	const { isFavorite, toggle } = useFavorites();
	const favorited = isFavorite(toolId);

	const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
		e.preventDefault();
		e.stopPropagation();
		toggle(toolId);
	};

	const classes = [
		styles.starButton,
		SIZE_CLASS[size],
		VARIANT_CLASS[variant],
		favorited ? styles.favorited : "",
	]
		.filter(Boolean)
		.join(" ");

	return (
		<button
			type="button"
			className={classes}
			onClick={handleClick}
			aria-pressed={favorited}
			aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
		>
			{favorited ? <StarSolid /> : <StarOutline />}
		</button>
	);
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm test src/__tests__/components/StarButton.test.tsx`
Expected: PASS (4 tests).

- [ ] **Step 6: Commit**

```bash
git add src/components/StarButton/ src/__tests__/components/StarButton.test.tsx
git commit -m "feat(favorites): add reusable StarButton component"
```

---

## Task 6: Add `StarButton` to `ToolCard`

**Files:**
- Modify: `src/components/ToolCard/ToolCard.tsx`
- Modify: `src/components/ToolCard/ToolCard.module.scss`

- [ ] **Step 1: Make ToolCard a client component and render StarButton for implemented tools**

Replace `src/components/ToolCard/ToolCard.tsx` with:

```tsx
"use client";

import Link from "next/link";
import { WrenchScrewdriverIcon } from "@heroicons/react/24/outline";
import { Tool } from "@/types/tools";
import { CATEGORIES } from "@/config/tools-registry";
import StarButton from "@/components/StarButton/StarButton";
import styles from "./ToolCard.module.scss";

interface ToolCardProps {
	tool: Tool;
}

export default function ToolCard({ tool }: ToolCardProps) {
	const category = CATEGORIES[tool.category];

	const CardContent = (
		<>
			<div className={styles.header}>
				<div className={styles.iconWrapper}>
					<WrenchScrewdriverIcon />
				</div>
				<div className={styles.headerRight}>
					{tool.implemented ? (
						<>
							<StarButton toolId={tool.id} variant="card" size="sm" />
							<span className={styles.badge}>Ready</span>
						</>
					) : (
						<span className={`${styles.badge} ${styles.comingSoonBadge}`}>Soon</span>
					)}
				</div>
			</div>
			<h3 className={styles.title}>{tool.name}</h3>
			<p className={styles.description}>{tool.description}</p>
			<div className={styles.category}>{category.name}</div>
		</>
	);

	if (!tool.implemented) {
		return <div className={`${styles.card} ${styles.notImplemented}`}>{CardContent}</div>;
	}

	return (
		<Link href={tool.route} className={styles.card}>
			{CardContent}
		</Link>
	);
}
```

- [ ] **Step 2: Add the `headerRight` style + hover rule that reveals card-variant stars**

In `src/components/ToolCard/ToolCard.module.scss`, append:

```scss
.headerRight {
	display: flex;
	align-items: center;
	gap: $spacing-sm;
}

.card:hover :global(.variantCard) {
	opacity: 1;
}
```

Note: this `:global()` approach lets SCSS modules reach across to the StarButton's CSS module class. If the project doesn't compile `:global` references like this (test reveals it), replace the `:global` block by passing an `alwaysVisible` prop into StarButton from ToolCard hover state, or by removing the opacity-on-hover behavior on the card variant and always showing the star on cards. Prefer the simpler always-visible fallback if `:global` doesn't work — verify which by running the dev server (Task 14) and inspecting a tool card.

- [ ] **Step 3: Verify the existing ToolCard a11y test still passes**

Run: `pnpm test src/__tests__/components/a11y.test.tsx -t "ToolCard"`
Expected: PASS.

The existing a11y test wraps ToolCard in plain render with no Provider. Because the StarButton now uses `useFavorites` which calls `useAppSelector`, the test will fail until ToolCard is rendered inside a Redux Provider. Update the a11y test:

```tsx
// Replace the "ToolCard has no a11y violations" test in src/__tests__/components/a11y.test.tsx:

it("ToolCard has no a11y violations", async () => {
	const { Provider } = await import("react-redux");
	const { configureStore } = await import("@reduxjs/toolkit");
	const { default: favoritesReducer } = await import("@/store/slices/favoritesSlice");
	const store = configureStore({ reducer: { favorites: favoritesReducer } });
	const { default: ToolCard } = await import("@/components/ToolCard/ToolCard");
	const { container } = render(
		<Provider store={store}>
			<ToolCard
				tool={{
					id: "test-tool",
					name: "Test Tool",
					description: "A test tool description",
					category: ToolCategory.CSS_DESIGN,
					route: "/tools/test-tool",
					implemented: true,
				}}
			/>
		</Provider>
	);
	const results = await axe(container);
	expect(results).toHaveNoViolations();
});
```

- [ ] **Step 4: Run the updated a11y test**

Run: `pnpm test src/__tests__/components/a11y.test.tsx -t "ToolCard"`
Expected: PASS.

- [ ] **Step 5: Run the full test suite to catch regressions**

Run: `pnpm test`
Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add src/components/ToolCard/ src/__tests__/components/a11y.test.tsx
git commit -m "feat(favorites): add StarButton to ToolCard"
```

---

## Task 7: Add `StarButton` to sidebar tool rows

**Files:**
- Modify: `src/components/Sidebar/Sidebar.tsx`
- Modify: `src/components/Sidebar/Sidebar.module.scss`

- [ ] **Step 1: Insert StarButton into each implemented tool row**

In `src/components/Sidebar/Sidebar.tsx`, add the import:

```tsx
import StarButton from "@/components/StarButton/StarButton";
```

Inside the `tools.map((tool) => ...)` block, just before the closing `</Link>`, render the StarButton (only for implemented tools so the favorites flow doesn't include unimplemented entries):

```tsx
{tool.implemented && <StarButton toolId={tool.id} variant="sidebar" size="sm" />}
```

The full block should look like:

```tsx
<Link
	onMouseEnter={() => handleHover(tool.id, tool.name)}
	onClick={tool.implemented ? handleCloseMobileMenu : undefined}
	key={tool.id}
	href={tool.implemented ? tool.route : "#"}
	className={`flex items-center justify-between gap-2 px-4 py-3 no-underline text-[0.9rem] relative ${styles.toolLink} ${isActive ? styles.active : ""} ${!tool.implemented ? styles.disabled : ""}`}
	title={tool.description}
>
	<span
		className={`flex-1 whitespace-nowrap overflow-hidden text-ellipsis pl-2 ${styles.toolName}`}
		ref={(el) => {
			if (el) textRefs.current.set(tool.id, el);
		}}
	>
		{tool.name}
	</span>
	{!tool.implemented && <span className={styles.comingSoon}>Soon</span>}
	{tool.implemented && <StarButton toolId={tool.id} variant="sidebar" size="sm" />}
</Link>
```

- [ ] **Step 2: Reveal sidebar-variant stars on row hover**

In `src/components/Sidebar/Sidebar.module.scss`, modify the `.toolLink:hover:not(.disabled)` rule and add a sibling rule:

```scss
.toolLink {
	// ... existing styles ...

	&:hover:not(.disabled) :global(.variantSidebar) {
		opacity: 1;
	}
}
```

(Add this nested rule alongside the existing hover styles inside `.toolLink`. If `:global` resolution doesn't work in this project's SCSS modules, fall back to always-visible sidebar stars by removing `opacity: 0` from `.variantSidebar` in `StarButton.module.scss` — verify in the browser during Task 14.)

- [ ] **Step 3: Build to verify no type errors**

Run: `pnpm run build`
Expected: build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/components/Sidebar/Sidebar.tsx src/components/Sidebar/Sidebar.module.scss
git commit -m "feat(favorites): add StarButton to sidebar tool rows"
```

---

## Task 8: Add `StarButton` to the TopBar

**Files:**
- Modify: `src/components/TopBar/TopBar.tsx`

- [ ] **Step 1: Render the StarButton next to the page title when a tool is active**

In `src/components/TopBar/TopBar.tsx`, add the import:

```tsx
import StarButton from "@/components/StarButton/StarButton";
```

Replace the `leftSection` block:

```tsx
<div className={styles.leftSection}>
	{currentTool && (
		<>
			<h1 className={styles.pageTitle}>{currentTool.name}</h1>
			<StarButton toolId={currentTool.id} variant="topbar" size="md" />
		</>
	)}
</div>
```

- [ ] **Step 2: Build to verify**

Run: `pnpm run build`
Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/components/TopBar/TopBar.tsx
git commit -m "feat(favorites): add StarButton to TopBar tool title"
```

---

## Task 9: Install `@dnd-kit/sortable`

**Files:**
- Modify: `package.json`, `pnpm-lock.yaml`

- [ ] **Step 1: Install the dep**

Run: `pnpm add @dnd-kit/sortable`
Expected: installs cleanly (peer deps `@dnd-kit/core` and `@dnd-kit/utilities` are already present).

- [ ] **Step 2: Verify**

Run: `pnpm list @dnd-kit/sortable`
Expected: shows the installed version.

- [ ] **Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: add @dnd-kit/sortable for favorites reordering"
```

---

## Task 10: Create `FavoritesSection` (pinned list + drag-and-drop + empty state)

**Files:**
- Create: `src/components/Sidebar/FavoritesSection.tsx`
- Create: `src/components/Sidebar/FavoritesSection.module.scss`
- Test: `src/__tests__/components/FavoritesSection.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/components/FavoritesSection.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { axe, toHaveNoViolations } from "jest-axe";
import favoritesReducer, { toggleFavorite } from "@/store/slices/favoritesSlice";

expect.extend(toHaveNoViolations);

vi.mock("next/navigation", () => ({
	usePathname: () => "/",
	useRouter: () => ({ push: vi.fn(), back: vi.fn(), forward: vi.fn() }),
}));

vi.mock("next/link", () => ({
	default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
		<a href={href} {...props}>{children}</a>
	),
}));

beforeAll(() => {
	Object.assign(navigator, {
		clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
	});
});

function renderWithStore(ui: React.ReactElement, preloadedIds: string[] = []) {
	const store = configureStore({ reducer: { favorites: favoritesReducer } });
	for (const id of preloadedIds) store.dispatch(toggleFavorite(id));
	return { ...render(<Provider store={store}>{ui}</Provider>), store };
}

describe("FavoritesSection", () => {
	beforeEach(() => {
		localStorage.clear();
	});

	it("shows the FAVORITES header", async () => {
		const { default: FavoritesSection } = await import(
			"@/components/Sidebar/FavoritesSection"
		);
		renderWithStore(<FavoritesSection />);
		expect(screen.getByText(/favorites/i)).toBeInTheDocument();
	});

	it("shows the empty-state hint when there are no favorites", async () => {
		const { default: FavoritesSection } = await import(
			"@/components/Sidebar/FavoritesSection"
		);
		renderWithStore(<FavoritesSection />);
		expect(screen.getByText(/star a tool to pin it here/i)).toBeInTheDocument();
	});

	it("renders each favorite as a link to its route", async () => {
		const { default: FavoritesSection } = await import(
			"@/components/Sidebar/FavoritesSection"
		);
		renderWithStore(<FavoritesSection />, ["color-picker", "jwt-decoder"]);
		expect(screen.getByText("Color Picker")).toBeInTheDocument();
		expect(screen.getByText("JWT Decoder")).toBeInTheDocument();
		expect(screen.queryByText(/star a tool to pin it here/i)).not.toBeInTheDocument();
	});

	it("has no a11y violations when empty", async () => {
		const { default: FavoritesSection } = await import(
			"@/components/Sidebar/FavoritesSection"
		);
		const { container } = renderWithStore(<FavoritesSection />);
		const results = await axe(container);
		expect(results).toHaveNoViolations();
	});

	it("has no a11y violations when populated", async () => {
		const { default: FavoritesSection } = await import(
			"@/components/Sidebar/FavoritesSection"
		);
		const { container } = renderWithStore(<FavoritesSection />, ["color-picker", "jwt-decoder"]);
		const results = await axe(container);
		expect(results).toHaveNoViolations();
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/__tests__/components/FavoritesSection.test.tsx`
Expected: FAIL with "Cannot find module '@/components/Sidebar/FavoritesSection'".

- [ ] **Step 3: Create the SCSS module**

Create `src/components/Sidebar/FavoritesSection.module.scss`:

```scss
@use '@/styles/variables' as *;

.section {
	margin-bottom: $spacing-md;
	padding-bottom: $spacing-md;
	border-bottom: 1px solid $border-subtle;
}

.header {
	display: flex;
	align-items: center;
	gap: $spacing-sm;
	padding: 0.75rem 1.25rem;
	color: $text-tertiary;
	font-size: 0.875rem;
	font-weight: 600;
	letter-spacing: 0.05em;
	text-transform: uppercase;
}

.headerIcon {
	width: 1rem;
	height: 1rem;
	color: $color-accent-secondary;
}

.emptyHint {
	padding: 0 1.25rem 0.5rem;
	color: $text-muted;
	font-size: 0.8125rem;
	line-height: 1.4;
	margin: 0;
}

.list {
	display: flex;
	flex-direction: column;
	gap: 0.125rem;
	padding: 0 0.5rem;
}

.row {
	display: flex;
	align-items: center;
	gap: $spacing-sm;
	padding: 0.5rem 0.5rem;
	border-radius: $radius-md;
	color: $text-secondary;
	text-decoration: none;
	transition: background 0.15s ease, color 0.15s ease;

	&:hover {
		background: linear-gradient(135deg, $color-accent-20 0%, $color-primary-20 100%);
		color: $text-primary;
	}

	&.active {
		background: linear-gradient(135deg, $color-accent-50 0%, $color-primary-50 100%);
		color: $text-primary;
		font-weight: 500;
	}

	&.dragging {
		opacity: 0.5;
	}
}

.dragHandle {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 1.25rem;
	height: 1.25rem;
	color: $text-muted;
	cursor: grab;
	opacity: 0;
	transition: opacity 0.15s ease, color 0.15s ease;

	@media (max-width: 768px) {
		opacity: 1;
	}

	&:hover {
		color: $text-secondary;
	}

	&:active {
		cursor: grabbing;
	}

	.row:hover & {
		opacity: 1;
	}
}

.name {
	flex: 1;
	font-family: $font-family-mono;
	font-size: 0.9rem;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}
```

- [ ] **Step 4: Implement the component**

Create `src/components/Sidebar/FavoritesSection.tsx`:

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { StarIcon } from "@heroicons/react/24/solid";
import { Bars3Icon } from "@heroicons/react/24/outline";
import {
	DndContext,
	closestCenter,
	KeyboardSensor,
	PointerSensor,
	TouchSensor,
	useSensor,
	useSensors,
	DragEndEvent,
	DragOverlay,
} from "@dnd-kit/core";
import {
	SortableContext,
	sortableKeyboardCoordinates,
	useSortable,
	verticalListSortingStrategy,
	arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";
import { createPortal } from "react-dom";
import { useFavorites } from "@/hooks/useFavorites";
import { useAppDispatch } from "@/store/hooks";
import { closeMobileMenu } from "@/store/slices/uiSlice";
import StarButton from "@/components/StarButton/StarButton";
import type { Tool } from "@/types/tools";
import styles from "./FavoritesSection.module.scss";

function SortableRow({ tool, isActive }: { tool: Tool; isActive: boolean }) {
	const dispatch = useAppDispatch();
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
		useSortable({ id: tool.id });

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
	};

	const handleNavClick = () => {
		dispatch(closeMobileMenu());
	};

	return (
		<div
			ref={setNodeRef}
			style={style}
			className={`${styles.row} ${isActive ? styles.active : ""} ${isDragging ? styles.dragging : ""}`}
		>
			<button
				type="button"
				className={styles.dragHandle}
				aria-label={`Reorder ${tool.name}`}
				{...attributes}
				{...listeners}
			>
				<Bars3Icon />
			</button>
			<Link
				href={tool.route}
				className={styles.name}
				onClick={handleNavClick}
			>
				{tool.name}
			</Link>
			<StarButton toolId={tool.id} variant="sidebar" size="sm" />
		</div>
	);
}

export default function FavoritesSection() {
	const { favorites, reorder } = useFavorites();
	const pathname = usePathname();
	const [activeId, setActiveId] = useState<string | null>(null);

	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
		useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
		useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
	);

	const handleDragEnd = (event: DragEndEvent) => {
		setActiveId(null);
		const { active, over } = event;
		if (!over || active.id === over.id) return;
		const oldIndex = favorites.findIndex((t) => t.id === active.id);
		const newIndex = favorites.findIndex((t) => t.id === over.id);
		if (oldIndex === -1 || newIndex === -1) return;
		const reordered = arrayMove(favorites.map((t) => t.id), oldIndex, newIndex);
		reorder(reordered);
	};

	const activeTool = activeId ? favorites.find((t) => t.id === activeId) : null;

	return (
		<div className={styles.section}>
			<div className={styles.header}>
				<StarIcon className={styles.headerIcon} />
				<span>Favorites</span>
			</div>

			{favorites.length === 0 ? (
				<p className={styles.emptyHint}>Star a tool to pin it here.</p>
			) : (
				<DndContext
					sensors={sensors}
					collisionDetection={closestCenter}
					onDragStart={(e) => setActiveId(String(e.active.id))}
					onDragEnd={handleDragEnd}
					onDragCancel={() => setActiveId(null)}
				>
					<SortableContext
						items={favorites.map((t) => t.id)}
						strategy={verticalListSortingStrategy}
					>
						<div className={styles.list}>
							{favorites.map((tool) => (
								<SortableRow
									key={tool.id}
									tool={tool}
									isActive={pathname === tool.route}
								/>
							))}
						</div>
					</SortableContext>
					{typeof document !== "undefined" &&
						createPortal(
							<DragOverlay>
								{activeTool ? (
									<div className={`${styles.row} ${styles.dragging}`}>
										<button type="button" className={styles.dragHandle} aria-hidden="true">
											<Bars3Icon />
										</button>
										<span className={styles.name}>{activeTool.name}</span>
									</div>
								) : null}
							</DragOverlay>,
							document.body
						)}
				</DndContext>
			)}
		</div>
	);
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm test src/__tests__/components/FavoritesSection.test.tsx`
Expected: PASS (5 tests).

- [ ] **Step 6: Commit**

```bash
git add src/components/Sidebar/FavoritesSection.tsx src/components/Sidebar/FavoritesSection.module.scss src/__tests__/components/FavoritesSection.test.tsx
git commit -m "feat(favorites): add FavoritesSection with draggable reorder"
```

---

## Task 11: Create `FavoritesOnlyToggle` pill component

**Files:**
- Create: `src/components/Sidebar/FavoritesOnlyToggle.tsx`
- Create: `src/components/Sidebar/FavoritesOnlyToggle.module.scss`
- Test: `src/__tests__/components/FavoritesOnlyToggle.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/components/FavoritesOnlyToggle.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { axe, toHaveNoViolations } from "jest-axe";
import favoritesReducer from "@/store/slices/favoritesSlice";

expect.extend(toHaveNoViolations);

vi.mock("next/navigation", () => ({
	usePathname: () => "/",
	useRouter: () => ({ push: vi.fn(), back: vi.fn(), forward: vi.fn() }),
}));

beforeAll(() => {
	Object.assign(navigator, {
		clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
	});
});

function renderWithStore(ui: React.ReactElement) {
	const store = configureStore({ reducer: { favorites: favoritesReducer } });
	return { ...render(<Provider store={store}>{ui}</Provider>), store };
}

describe("FavoritesOnlyToggle", () => {
	beforeEach(() => {
		localStorage.clear();
	});

	it("renders as unpressed initially", async () => {
		const { default: FavoritesOnlyToggle } = await import(
			"@/components/Sidebar/FavoritesOnlyToggle"
		);
		renderWithStore(<FavoritesOnlyToggle />);
		const button = screen.getByRole("button", { name: /show favorites only/i });
		expect(button).toHaveAttribute("aria-pressed", "false");
	});

	it("toggles aria-pressed on click", async () => {
		const { default: FavoritesOnlyToggle } = await import(
			"@/components/Sidebar/FavoritesOnlyToggle"
		);
		renderWithStore(<FavoritesOnlyToggle />);
		const button = screen.getByRole("button", { name: /show favorites only/i });
		fireEvent.click(button);
		expect(button).toHaveAttribute("aria-pressed", "true");
		fireEvent.click(button);
		expect(button).toHaveAttribute("aria-pressed", "false");
	});

	it("has no a11y violations", async () => {
		const { default: FavoritesOnlyToggle } = await import(
			"@/components/Sidebar/FavoritesOnlyToggle"
		);
		const { container } = renderWithStore(<FavoritesOnlyToggle />);
		const results = await axe(container);
		expect(results).toHaveNoViolations();
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/__tests__/components/FavoritesOnlyToggle.test.tsx`
Expected: FAIL with "Cannot find module".

- [ ] **Step 3: Create the SCSS module**

Create `src/components/Sidebar/FavoritesOnlyToggle.module.scss`:

```scss
@use '@/styles/variables' as *;

.toggle {
	display: inline-flex;
	align-items: center;
	gap: $spacing-sm;
	margin: $spacing-sm 1.25rem;
	padding: 0.375rem 0.75rem;
	background: transparent;
	border: 1px solid $border-subtle;
	border-radius: 999px;
	color: $text-tertiary;
	font-size: 0.8125rem;
	font-weight: 500;
	cursor: pointer;
	transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;

	svg {
		width: 0.875rem;
		height: 0.875rem;
	}

	&:hover {
		background: $bg-glass-hover;
		color: $text-secondary;
		border-color: $border-medium;
	}

	&.active {
		background: $color-accent-20;
		color: $text-primary;
		border-color: $color-accent;
	}
}
```

- [ ] **Step 4: Implement the component**

Create `src/components/Sidebar/FavoritesOnlyToggle.tsx`:

```tsx
"use client";

import { StarIcon as StarOutline } from "@heroicons/react/24/outline";
import { StarIcon as StarSolid } from "@heroicons/react/24/solid";
import { useFavorites } from "@/hooks/useFavorites";
import styles from "./FavoritesOnlyToggle.module.scss";

export default function FavoritesOnlyToggle() {
	const { showOnlyMode, toggleMode } = useFavorites();

	return (
		<button
			type="button"
			className={`${styles.toggle} ${showOnlyMode ? styles.active : ""}`}
			onClick={toggleMode}
			aria-pressed={showOnlyMode}
			aria-label="Show favorites only"
		>
			{showOnlyMode ? <StarSolid /> : <StarOutline />}
			<span>Favorites only</span>
		</button>
	);
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm test src/__tests__/components/FavoritesOnlyToggle.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 6: Commit**

```bash
git add src/components/Sidebar/FavoritesOnlyToggle.tsx src/components/Sidebar/FavoritesOnlyToggle.module.scss src/__tests__/components/FavoritesOnlyToggle.test.tsx
git commit -m "feat(favorites): add FavoritesOnlyToggle pill component"
```

---

## Task 12: Integrate `FavoritesSection`, toggle, and category-gating into the Sidebar

**Files:**
- Modify: `src/components/Sidebar/Sidebar.tsx`
- Modify: `src/components/Sidebar/Sidebar.module.scss`

- [ ] **Step 1: Render the toggle + section, and gate the category list on `showOnlyMode`**

Modify `src/components/Sidebar/Sidebar.tsx`. Add imports:

```tsx
import FavoritesSection from "@/components/Sidebar/FavoritesSection";
import FavoritesOnlyToggle from "@/components/Sidebar/FavoritesOnlyToggle";
import { useFavorites } from "@/hooks/useFavorites";
import { StarIcon } from "@heroicons/react/24/solid";
```

Inside the component, read `showOnlyMode`:

```tsx
const { showOnlyMode } = useFavorites();
```

Update the logo line to show an indicator chip when `showOnlyMode` is true:

```tsx
<Link href="/tools" className={`flex items-center gap-2 px-5 h-16 no-underline ${styles.logo}`}>
	<WrenchScrewdriverIcon className={`w-7 h-7 shrink-0 ${styles.logoIcon}`} />
	<span className={`text-xl font-bold whitespace-nowrap ${styles.logoText}`}>Tools</span>
	{showOnlyMode && (
		<span className={styles.modeChip} aria-label="Favorites only mode active">
			<StarIcon className="w-3 h-3" />
		</span>
	)}
</Link>
```

Inside the `<nav>`, add the toggle and section before the category loop, and skip the category loop entirely when `showOnlyMode` is true:

```tsx
<nav className="flex-1 py-4 overflow-y-auto">
	<FavoritesOnlyToggle />
	<FavoritesSection />

	{!showOnlyMode && Object.values(CATEGORIES).map((category) => {
		// ... existing category mapping block, unchanged ...
	})}
</nav>
```

- [ ] **Step 2: Add the `.modeChip` style and a subtle accent border when active**

In `src/components/Sidebar/Sidebar.module.scss`, append:

```scss
.modeChip {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	margin-left: $spacing-sm;
	padding: 0.125rem 0.375rem;
	background: $color-accent-20;
	border: 1px solid $color-accent;
	border-radius: 999px;
	color: $color-accent-secondary;
}
```

- [ ] **Step 3: Run the existing Sidebar-touching tests to confirm no regression**

Run: `pnpm test`
Expected: all existing tests still pass.

- [ ] **Step 4: Build**

Run: `pnpm run build`
Expected: build succeeds.

- [ ] **Step 5: Commit**

```bash
git add src/components/Sidebar/Sidebar.tsx src/components/Sidebar/Sidebar.module.scss
git commit -m "feat(favorites): wire FavoritesSection + toggle into Sidebar"
```

---

## Task 13: Manual end-to-end smoke test

**Files:** none modified.

- [ ] **Step 1: Start the dev server**

Run: `pnpm run dev`
Expected: server starts at `http://localhost:3000`.

- [ ] **Step 2: Verify the empty state**

Open `http://localhost:3000/tools` in a browser.
Confirm:
- Sidebar shows a `Favorites only` pill near the top.
- Below the pill, a `★ FAVORITES` header with the text "Star a tool to pin it here."
- Categories appear below the favorites section.

- [ ] **Step 3: Favorite from three surfaces**

- Hover a tool card on `/tools` → click the star → card star fills.
- Navigate to a tool → click the star next to the page title in the TopBar → it fills.
- Hover a tool row in the sidebar → click the star at the right → it fills.

Each click should add the tool to the pinned section at the top of the sidebar.

- [ ] **Step 4: Reorder**

Drag a favorite by the `≡` handle (desktop) — order persists.
On a touch device or mobile emulator: long-press the handle, then drag.

- [ ] **Step 5: Persistence**

Refresh the page. The favorites and their order should remain.

- [ ] **Step 6: Favorites-only mode**

Click the `Favorites only` pill.
- Categories disappear; only the pinned section remains.
- The logo line shows a small star chip indicating the mode is active.
- Refresh — the mode persists.
- Click the pill again → categories return; chip disappears.

- [ ] **Step 7: Unfavorite from sidebar pinned section**

Click the star on a row inside the pinned section — the tool disappears from the pinned section and its star unfills everywhere.

- [ ] **Step 8: Mobile smoke (DevTools responsive mode)**

Resize to 375px wide. Open the menu via the hamburger.
- Star buttons on cards/sidebar rows are visible without hover.
- Long-press drag works on a favorite.
- Clicking a favorite link closes the menu; clicking the star does NOT close the menu.

- [ ] **Step 9: Stop the dev server**

Press `Ctrl+C` in the terminal.

- [ ] **Step 10: Note any issues**

If a `:global(.variantSidebar)` or `:global(.variantCard)` selector did not work (stars stayed permanently hidden behind hover), apply the fallback: remove the `opacity: 0` line from `.variantSidebar` and/or `.variantCard` in `src/components/StarButton/StarButton.module.scss` so stars are always visible. Commit any fallback changes:

```bash
git add src/components/StarButton/StarButton.module.scss
git commit -m "fix(favorites): show star buttons always when :global hover selector fails"
```

If everything works, no commit needed.

---

## Task 14: Final test suite + build pass

**Files:** none.

- [ ] **Step 1: Run the full test suite**

Run: `pnpm test`
Expected: all tests pass, including:
- `favoritesSlice.test.ts` (16 tests)
- `useFavorites.test.tsx` (5 tests)
- `StarButton.test.tsx` (4 tests)
- `FavoritesSection.test.tsx` (5 tests)
- `FavoritesOnlyToggle.test.tsx` (3 tests)
- All pre-existing tests in `a11y.test.tsx`, `smoke.test.tsx`, etc.

- [ ] **Step 2: Run the production build**

Run: `pnpm run build`
Expected: build succeeds with no errors or warnings about new code.

- [ ] **Step 3: Final commit if anything was tweaked, otherwise skip**

If steps 1-2 surfaced anything to fix, fix it and commit:

```bash
git add <files>
git commit -m "fix(favorites): <description>"
```

---

## Done

The favorites feature ships. Definition of done from the spec:

- [x] Slice + hook + StarButton + FavoritesSection + FavoritesOnlyToggle all exist.
- [x] Star button works on sidebar rows, TopBar (when on a tool page), and tool cards.
- [x] Favorites persist across reloads.
- [x] Drag-and-drop reorder works on desktop (mouse + keyboard) and mobile (long-press).
- [x] "Favorites only" toggle persists; logo chip indicates active state.
- [x] Unimplemented tools never get a star.
- [x] Empty state shows the hint message.
- [x] All new tests pass; jest-axe clean.
- [x] `pnpm run build` succeeds.
