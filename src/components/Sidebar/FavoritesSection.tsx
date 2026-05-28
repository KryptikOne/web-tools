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
	DragOverlay,
} from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
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

interface FavoritesSectionProps {
	query?: string;
}

export default function FavoritesSection({ query = "" }: FavoritesSectionProps) {
	const { favorites, reorder } = useFavorites();
	const pathname = usePathname();
	const [activeId, setActiveId] = useState<string | null>(null);

	const isSearching = query.length > 0;
	const visibleFavorites = isSearching
		? favorites.filter((t) => t.name.toLowerCase().includes(query))
		: favorites;

	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
		useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
		useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
	);

	// Hide the favorites section entirely while searching if nothing matches.
	if (isSearching && visibleFavorites.length === 0) return null;

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
						items={visibleFavorites.map((t) => t.id)}
						strategy={verticalListSortingStrategy}
					>
						<div className={styles.list}>
							{visibleFavorites.map((tool) => (
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
