"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { WrenchScrewdriverIcon, DocumentTextIcon, SwatchIcon, PhotoIcon, CodeBracketIcon, CalculatorIcon, SparklesIcon } from "@heroicons/react/24/outline";
import { CATEGORIES, getToolsByCategory } from "@/config/tools-registry";
import { ToolCategory } from "@/types/tools";
import { scrambleText } from "@/lib/textEffects";
import styles from "./Sidebar.module.scss";

// Map categories to their icons
const CATEGORY_ICONS: Record<ToolCategory, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
	[ToolCategory.TEXT_DATA]: DocumentTextIcon,
	[ToolCategory.COLOR_DESIGN]: SwatchIcon,
	[ToolCategory.IMAGE_VISUAL]: PhotoIcon,
	[ToolCategory.CODE_WEB]: CodeBracketIcon,
	[ToolCategory.UTILITY_CONVERSION]: CalculatorIcon,
	[ToolCategory.FUN_RANDOM]: SparklesIcon,
};

export default function Sidebar() {
	const [expandedCategories, setExpandedCategories] = useState<Set<ToolCategory>>(new Set(Object.keys(CATEGORIES) as ToolCategory[]));
	const pathname = usePathname();

	const toggleCategory = (category: ToolCategory) => {
		const newExpanded = new Set(expandedCategories);
		if (newExpanded.has(category)) {
			newExpanded.delete(category);
		} else {
			newExpanded.add(category);
		}
		setExpandedCategories(newExpanded);
	};

	// Use a Map to store refs by tool ID for uniqueness across categories
	const textRefs = useRef<Map<string, HTMLSpanElement>>(new Map());

	const handleHover = useCallback((toolId: string, toolName: string) => {
		const el = textRefs.current.get(toolId);
		if (!el) return;
		// scrambleText(el, toolName); // I'll add this back in later just wanted to visually keep it simple for now
	}, []);

	return (
		<aside className={styles.sidebar}>
			<div className={styles.sidebarContent}>
				<Link href="/" className={styles.logo}>
					<WrenchScrewdriverIcon className={styles.logoIcon} />
					<span className={styles.logoText}>BittBott.dev</span>
				</Link>

				<nav className={styles.navigation}>
					{Object.values(CATEGORIES).map((category) => {
						const tools = getToolsByCategory(category.id);
						const isExpanded = expandedCategories.has(category.id);

						if (tools.length === 0) return null;

						return (
							<div key={category.id} className={styles.categorySection}>
								{(() => {
									const CategoryIcon = CATEGORY_ICONS[category.id];
									return (
										<button className={styles.categoryHeader} onClick={() => toggleCategory(category.id)}>
											<CategoryIcon className={styles.categoryIcon} />
											<span className={styles.categoryName}>{category.name}</span>
										</button>
									);
								})()}

								{isExpanded && (
									<div className={styles.toolsList}>
										{tools.map((tool) => {
											const isActive = pathname === tool.route;
											return (
												<Link
													onMouseEnter={() => handleHover(tool.id, tool.name)}
													key={tool.id}
													href={tool.implemented ? tool.route : "#"}
													className={`${styles.toolLink} ${isActive ? styles.active : ""} ${!tool.implemented ? styles.disabled : ""}`}
													title={tool.description}
												>
													<span
														className={styles.toolName}
														ref={(el) => {
															if (el) textRefs.current.set(tool.id, el);
														}}
													>
														{tool.name}
													</span>
													{!tool.implemented && <span className={styles.comingSoon}>Soon</span>}
												</Link>
											);
										})}
									</div>
								)}
							</div>
						);
					})}
				</nav>
			</div>
		</aside>
	);
}
