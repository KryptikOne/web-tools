import { useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
	toggleFavorite,
	reorderFavorites,
	toggleFavoritesCollapsed,
	selectFavoriteIds,
	selectFavoriteTools,
	selectFavoritesCollapsed,
} from "@/store/slices/favoritesSlice";
import type { Tool } from "@/types/tools";

export interface UseFavoritesResult {
	favorites: Tool[];
	favoriteIds: string[];
	isFavorite: (id: string) => boolean;
	toggle: (id: string) => void;
	reorder: (ids: string[]) => void;
	/** Sidebar list folded up */
	collapsed: boolean;
	toggleCollapsed: () => void;
}

export function useFavorites(): UseFavoritesResult {
	const dispatch = useAppDispatch();
	const favoriteIds = useAppSelector(selectFavoriteIds);
	const favorites = useAppSelector(selectFavoriteTools);
	const collapsed = useAppSelector(selectFavoritesCollapsed);

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

	const toggleCollapsed = useCallback(() => {
		dispatch(toggleFavoritesCollapsed());
	}, [dispatch]);

	return { favorites, favoriteIds, isFavorite, toggle, reorder, collapsed, toggleCollapsed };
}
