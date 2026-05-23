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
		// preventDefault is required even though this is type="button": the
		// StarButton renders inside the sidebar's <Link>, which is an <a>
		// element. Without preventDefault, the browser's native anchor
		// navigation fires and triggers a full page reload.
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
			data-variant={variant}
			onClick={handleClick}
			aria-pressed={favorited}
			aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
		>
			{favorited ? <StarSolid /> : <StarOutline />}
		</button>
	);
}
