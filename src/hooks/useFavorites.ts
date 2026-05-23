import { useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
	toggleFavorite,
	reorderFavorites,
	selectFavoriteIds,
	selectFavoriteTools,
} from "@/store/slices/favoritesSlice";
import type { Tool } from "@/types/tools";

export interface UseFavoritesResult {
	favorites: Tool[];
	favoriteIds: string[];
	isFavorite: (id: string) => boolean;
	toggle: (id: string) => void;
	reorder: (ids: string[]) => void;
}

export function useFavorites(): UseFavoritesResult {
	const dispatch = useAppDispatch();
	const favoriteIds = useAppSelector(selectFavoriteIds);
	const favorites = useAppSelector(selectFavoriteTools);

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

	return { favorites, favoriteIds, isFavorite, toggle, reorder };
}
