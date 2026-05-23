"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { SunIcon, MoonIcon } from "@heroicons/react/24/outline";
import { TOOLS_REGISTRY } from "@/config/tools-registry";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { hydrateTheme, toggleTheme } from "@/store/slices/themeSlice";
import { hydrateFavorites } from "@/store/slices/favoritesSlice";
import { toggleMobileMenu } from "@/store/slices/uiSlice";
import StarButton from "@/components/StarButton/StarButton";
import styles from "./TopBar.module.scss";


export default function TopBar() {
	const dispatch = useAppDispatch();
	const theme = useAppSelector((state) => state.theme.mode);
	const mobileMenuOpen = useAppSelector((state) => state.ui.mobileMenuOpen);
	const pathname = usePathname();

	// Find the current tool based on pathname
	const currentTool = TOOLS_REGISTRY.find((tool) => tool.route === pathname);

	// Hydrate theme and favorites from localStorage on mount
	useEffect(() => {
		dispatch(hydrateTheme());
		dispatch(hydrateFavorites());
	}, [dispatch]);

	const handleToggleTheme = () => {
		dispatch(toggleTheme());
	};

	const handleToggleMobileMenu = () => {
		dispatch(toggleMobileMenu());
	};

	return (
		<header className={styles.topBar}>
			<div className={styles.leftSection}>
				{currentTool && (
					<>
						{/* {ToolIcon && <ToolIcon className={styles.pageIcon} />} */}
						<h1 className={styles.pageTitle}>{currentTool.name}</h1>
						<StarButton toolId={currentTool.id} variant="topbar" size="md" />
					</>
				)}
			</div>

			<div className={styles.rightSection}>
				<button className={styles.iconButton} onClick={handleToggleTheme} aria-label="Toggle theme">
					{theme === "dark" ? <SunIcon /> : <MoonIcon />}
				</button>
				<button className={`${styles.hamburger} ${mobileMenuOpen ? styles.hamburgerActive : ""}`} onClick={handleToggleMobileMenu} aria-label="Toggle menu" aria-expanded={mobileMenuOpen}>
					<span className={styles.hamburgerBox}>
						<span className={styles.hamburgerInner}></span>
					</span>
				</button>
			</div>
		</header>
	);
}
