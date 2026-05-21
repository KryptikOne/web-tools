# Favorites Feature — Design

**Status:** Approved, ready for implementation plan
**Date:** 2026-05-20

## Purpose

Let users star tools they use often, surface them at the top of the sidebar, and optionally collapse the sidebar to favorites-only for a focused navigation mode.

## Goals

- One-click favorite/unfavorite from the sidebar, the tool page (TopBar), and the tools landing page.
- Favorites are pinned at the top of the sidebar in a user-defined order.
- A "favorites only" sidebar mode persists across sessions, with a clear visual indicator so the user always knows why categories are hidden.
- Fully client-side. Persists in `localStorage`. No backend, no sync.

## Non-Goals

- Export/import favorites.
- Cross-device sync.
- Per-favorite custom labels, notes, or icons.
- Folder grouping of favorites.
- Keyboard shortcuts to jump to favorites.

## User-Facing Behavior

### Star button (three surfaces)

| Surface | Location | Default visibility |
|---|---|---|
| Sidebar row | Right side of each tool `Link` | On desktop: visible on row hover, OR always if the tool is currently a favorite. On mobile: always visible. |
| TopBar | Next to the current tool's title in `leftSection`, rendered only when `currentTool` is set | Always |
| Tool card | Top-right of card header on `/tools` | On desktop: visible on card hover, OR always if the tool is currently a favorite. On mobile: always visible. |

Clicking toggles favorite state. The star is filled when favorited, outline when not. Unimplemented tools (`implemented: false`) do not get a star button on any surface.

### Pinned "Favorites" section in the sidebar

Appears at the top of the sidebar `<nav>`, above the category list.

**With favorites:**
```
★  FAVORITES
  ⋮⋮  Color Picker
  ⋮⋮  JWT Decoder
  ⋮⋮  Hash Generator
```

**Empty:**
```
★  FAVORITES
   Star a tool to pin it here.
```

The hint uses the existing muted description text style for consistency.

### Reordering

Drag-and-drop via `@dnd-kit`:
- Desktop: drag the `⋮⋮` handle (hover-visible).
- Mobile: long-press the handle (`TouchSensor`, 150ms activation).
- Keyboard: Tab to handle, Space/Enter to grab, arrow keys to move (built-in `@dnd-kit/sortable` behavior).
- `<DragOverlay>` portal'd to `document.body` so the floating row isn't clipped by the sidebar's `overflow-y-auto`.

### "Favorites only" toggle

Small pill button at the top of the sidebar `<nav>`, above the FavoritesSection:
- Inactive: `☆ Favorites only` (ghost style)
- Active: `★ Favorites only` with `--color-accent` background + 2px accent left border on the sidebar

When active:
- Pinned Favorites section stays visible.
- The full category list is not rendered.
- The sidebar logo line gains an inline `★` indicator chip so the user can see at a glance why categories are hidden.

State persists across sessions.

### Mobile menu interactions

- Clicking a favorite row closes the mobile menu (existing `closeMobileMenu()` dispatch).
- Clicking the star button does NOT close the menu (`stopPropagation`).
- Dragging a row does NOT close the menu.

## Architecture

### State

New file: `src/store/slices/favoritesSlice.ts`

```ts
interface FavoritesState {
  ids: string[];              // tool ids, order = display order
  showOnlyFavorites: boolean;
}
```

**Actions:**
- `hydrateFavorites()` — load from localStorage on mount.
- `toggleFavorite(id: string)` — add to end if missing, remove if present.
- `reorderFavorites(ids: string[])` — replace order array.
- `setShowOnlyFavorites(value: boolean)`.

**Persistence:** localStorage key `favorites-state`. Pattern mirrors `userPreferencesSlice.ts`: every mutating reducer calls `saveToStorage(state)`; `hydrateFavorites` is dispatched from a top-level `useEffect` (in `TopBar`, alongside `hydrateTheme`).

**Selectors (colocated):**
- `selectFavoriteIds(state)` → `string[]`
- `selectIsFavorite(id)(state)` → `boolean` (curried factory)
- `selectFavoriteTools(state)` → `Tool[]`, joins `ids` against `TOOLS_REGISTRY`, filters out unknown ids and `implemented: false`
- `selectShowOnlyFavorites(state)` → `boolean`

**Registered** in `src/store/index.ts`.

### Hook

New file: `src/hooks/useFavorites.ts`

```ts
function useFavorites(): {
  favorites: Tool[];
  favoriteIds: string[];
  isFavorite: (id: string) => boolean;
  toggle: (id: string) => void;
  reorder: (ids: string[]) => void;
  showOnlyMode: boolean;
  toggleMode: () => void;
}
```

Wraps `useAppSelector` / `useAppDispatch`. Single point of contact for components.

### Components

| Component | Path | Responsibility |
|---|---|---|
| `StarButton` | `src/components/StarButton/StarButton.tsx` (+ `.module.scss`) | One reusable button. Props: `toolId`, optional `size` and `variant`. Uses `useFavorites().isFavorite` + `toggle`. `aria-pressed`, dynamic `aria-label`, `stopPropagation` on click. |
| `FavoritesSection` | `src/components/Sidebar/FavoritesSection.tsx` (+ `.module.scss`) | Pinned section block. Renders empty state, sortable list, drag handles. Owns the `DndContext`. |
| `FavoritesOnlyToggle` | `src/components/Sidebar/FavoritesOnlyToggle.tsx` (+ `.module.scss`) | Pill button. `aria-pressed`. Dispatches `setShowOnlyFavorites`. Separate file so it can be unit-tested in isolation. |

### Touch points in existing files

| File | Change |
|---|---|
| `src/store/index.ts` | Register `favoritesReducer`. |
| `src/components/TopBar/TopBar.tsx` | Dispatch `hydrateFavorites` in existing `useEffect`. Render `<StarButton variant="topbar" toolId={currentTool.id} />` next to the title when `currentTool` is set. |
| `src/components/Sidebar/Sidebar.tsx` | Render `<FavoritesOnlyToggle />` and `<FavoritesSection />` at the top of `<nav>`. Skip the categories loop when `showOnlyFavorites` is true. Add `<StarButton variant="sidebar" toolId={tool.id} />` to each tool row (implemented tools only). Add an inline `★` indicator chip to the logo line when `showOnlyFavorites` is true. |
| `src/components/ToolCard/ToolCard.tsx` | Render `<StarButton variant="card" toolId={tool.id} />` in the card header (implemented tools only). |

### Dependencies to add

- `@dnd-kit/core` (MIT)
- `@dnd-kit/sortable` (MIT)
- `@dnd-kit/utilities` (MIT)

All small, no network calls, fully tree-shakeable. Install with `pnpm add`.

## Edge cases

- **Registry drift.** `selectFavoriteTools` silently drops ids that no longer resolve to an implemented tool, but the raw `ids` array is preserved in storage so a rename + revert doesn't lose data. Pruning happens only on explicit `toggle`.
- **SSR / hydration.** Initial state is `ids: []`, `showOnlyFavorites: false` — matches server render, no mismatch warning. Sidebar shows the empty state on first paint, then re-renders after hydration. Matches the existing theme hydration pattern.
- **Star button inside `<Link>`.** Click handler uses `e.preventDefault(); e.stopPropagation();` to avoid triggering parent navigation.
- **Drag overlay clipping.** `<DragOverlay>` is portal'd to `document.body` so it floats above the sidebar's `overflow-y-auto`.
- **Unimplemented tools.** No star button rendered. If somehow present in `ids` (e.g., a tool was implemented then reverted), `selectFavoriteTools` filters it out.

## Accessibility

- `StarButton`: `<button>` with `aria-pressed={isFavorite}` and `aria-label` that flips between "Add to favorites" and "Remove from favorites".
- Drag handle: `aria-label="Reorder [tool name]"`; keyboard-operable per `@dnd-kit/sortable` defaults (Tab + Space/Enter + arrows).
- Favorites-only toggle: `<button>` with `aria-pressed` and label "Show favorites only".
- Empty-state hint: plain `<p>`, no role needed.

## Testing

Project uses Vitest + RTL + jest-axe.

- `src/__tests__/favoritesSlice.test.ts` — toggle, reorder, hydrate, persistence round-trip, selector behavior with stale/unimplemented ids.
- `src/__tests__/useFavorites.test.tsx` — hook returns correct values and dispatches correct actions.
- `src/__tests__/components/StarButton.test.tsx` — `aria-pressed` reflects state, click stops propagation (does not trigger parent `<Link>`), jest-axe pass.
- `src/__tests__/components/FavoritesSection.test.tsx` — empty state, populated state, keyboard reorder, jest-axe pass.

## Implementation order

1. `favoritesSlice` + selectors + tests.
2. `useFavorites` hook + tests.
3. Register slice in store; wire `hydrateFavorites` into `TopBar`.
4. `StarButton` component + tests.
5. Add `StarButton` to `ToolCard` and to sidebar rows (no pinned section yet — verify the toggle/persistence end-to-end first).
6. Add `StarButton` to `TopBar`.
7. Install `@dnd-kit` deps.
8. `FavoritesSection` with sortable list + empty state + tests.
9. `FavoritesOnlyToggle` + sidebar gating + logo indicator chip.
10. Final pass: jest-axe across new components, manual mobile-drag smoke test, `pnpm run build`.

## Definition of done

- [ ] All four new files exist (slice, hook, StarButton, FavoritesSection).
- [ ] Star button appears and works on sidebar rows, TopBar (when on a tool page), and tool cards.
- [ ] Favorites persist across page reloads.
- [ ] Drag-and-drop reordering works on desktop (mouse + keyboard) and mobile (long-press).
- [ ] "Favorites only" toggle persists and hides the category list, with a visible indicator on the sidebar logo line.
- [ ] Unimplemented tools never get a star.
- [ ] Empty state shows the hint message.
- [ ] All new tests pass; jest-axe finds no violations.
- [ ] `pnpm run build` succeeds.
