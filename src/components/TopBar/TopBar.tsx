"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { SunIcon, MoonIcon, SwatchIcon, ArrowTrendingUpIcon, EyeSlashIcon, ClockIcon, CalculatorIcon, Square2StackIcon, PaintBrushIcon, CubeIcon, FunnelIcon, Squares2X2Icon, TableCellsIcon } from "@heroicons/react/24/outline";
import { TOOLS_REGISTRY } from "@/config/tools-registry";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { hydrateTheme, toggleTheme } from "@/store/slices/themeSlice";
import styles from "./TopBar.module.scss";

// Map tool IDs to their icons
const TOOL_ICONS: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
	"color-picker": SwatchIcon,
	"cubic-bezier": ArrowTrendingUpIcon,
	"invisible-character-remover": EyeSlashIcon,
	"palette-generator": PaintBrushIcon,
	"gradient-generator": Square2StackIcon,
	"box-shadow-generator": CubeIcon,
	"border-radius-generator": Squares2X2Icon,
	"css-filter-generator": FunnelIcon,
	"background-pattern-generator": Squares2X2Icon,
	"epoch-converter": ClockIcon,
	"px-rem-calculator": CalculatorIcon,
	"aspect-ratio-calculator": CalculatorIcon,
	"percentage-calculator": CalculatorIcon,
	"html-entities": TableCellsIcon,
};

export default function TopBar() {
	const dispatch = useAppDispatch();
	const theme = useAppSelector((state) => state.theme.mode);
	const pathname = usePathname();

	// Find the current tool based on pathname
	const currentTool = TOOLS_REGISTRY.find((tool) => tool.route === pathname);
	const ToolIcon = currentTool ? TOOL_ICONS[currentTool.id] : null;

	// Hydrate theme from localStorage on mount
	useEffect(() => {
		dispatch(hydrateTheme());
	}, [dispatch]);

	const handleToggleTheme = () => {
		dispatch(toggleTheme());
	};

	return (
		<header className={styles.topBar}>
			<div className={styles.leftSection}>
				{currentTool && (
					<>
						{ToolIcon && <ToolIcon className={styles.pageIcon} />}
						<h1 className={styles.pageTitle}>{currentTool.name}</h1>
					</>
				)}
			</div>

			<div className={styles.rightSection}>
				<button className={styles.iconButton} onClick={handleToggleTheme} aria-label="Toggle theme">
					{theme === "dark" ? <SunIcon /> : <MoonIcon />}
				</button>
			</div>
		</header>
	);
}
