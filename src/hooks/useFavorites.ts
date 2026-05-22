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
