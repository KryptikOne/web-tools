"use client";

import { useState, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { WrenchScrewdriverIcon, DocumentTextIcon, SwatchIcon, PhotoIcon, CodeBracketIcon, CalculatorIcon, ArrowsRightLeftIcon, LockClosedIcon, ClockIcon, ShieldCheckIcon, GlobeAltIcon, ChevronRightIcon,
	CakeIcon,
} from "@heroicons/react/24/outline";
import { CATEGORIES, getToolsByCategory } from "@/config/tools-registry";
import { ToolCategory, type Tool } from "@/types/tools";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { closeMobileMenu } from "@/store/slices/uiSlice";
import StarButton from "@/components/StarButton/StarButton";
import FavoritesSection from "@/components/Sidebar/FavoritesSection";
import ExpandCollapseAll from "@/components/Sidebar/ExpandCollapseAll";
import SidebarSearch from "@/components/Sidebar/SidebarSearch";
import styles from "./Sidebar.module.scss";

// Map categories to their icons
const CATEGORY_ICONS: Record<ToolCategory, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
	[ToolCategory.CSS_DESIGN]: SwatchIcon,
	[ToolCategory.IMAGE_MEDIA]: PhotoIcon,
	[ToolCategory.TEXT_DATA]: DocumentTextIcon,
	[ToolCategory.ENCODING_DATA]: LockClosedIcon,
	[ToolCategory.WEB_DEV]: CodeBracketIcon,
	[ToolCategory.UNIT_CONVERTERS]: ArrowsRightLeftIcon,
	[ToolCategory.CALCULATORS_TIME]: CalculatorIcon,
	[ToolCategory.SECURITY_CRYPTO]: ShieldCheckIcon,
	[ToolCategory.NETWORK]: GlobeAltIcon,
	[ToolCategory.KITCHEN]: CakeIcon,
};

export default function Sidebar() {
	const [expandedCategories, setExpandedCategories] = useState<Set<ToolCategory>>(new Set(Object.keys(CATEGORIES) as ToolCategory[]));
	const [query, setQuery] = useState("");
	// Snapshot of expand state captured when search begins, restored when it ends.
	const preSearchExpanded = useRef<Set<ToolCategory> | null>(null);
	const pathname = usePathname();
	const router = useRouter();
	const dispatch = useAppDispatch();
	const mobileMenuOpen = useAppSelector((state) => state.ui.mobileMenuOpen);

	const normalizedQuery = query.trim().toLowerCase();
	const isSearching = normalizedQuery.length > 0;

	const filteredByCategory = useMemo(() => {
		const map = new Map<ToolCategory, Tool[]>();
		for (const category of Object.values(CATEGORIES)) {
			const tools = getToolsByCategory(category.id);
			const filtered = isSearching ? tools.filter((t) => t.name.toLowerCase().includes(normalizedQuery)) : tools;
			map.set(category.id, filtered);
		}
		return map;
	}, [isSearching, normalizedQuery]);

	const matchCount = useMemo(() => {
		if (!isSearching) return 0;
		let n = 0;
		filteredByCategory.forEach((tools) => {
			n += tools.length;
		});
		return n;
	}, [filteredByCategory, isSearching]);

	const handleQueryChange = (next: string) => {
		const wasSearching = isSearching;
		const willSearch = next.trim().length > 0;
		if (!wasSearching && willSearch) {
			preSearchExpanded.current = expandedCategories;
			setExpandedCategories(new Set(Object.keys(CATEGORIES) as ToolCategory[]));
		} else if (wasSearching && !willSearch && preSearchExpanded.current) {
			setExpandedCategories(preSearchExpanded.current);
			preSearchExpanded.current = null;
		}
		setQuery(next);
	};

	const handleSubmit = () => {
		if (!isSearching) return;
		for (const category of Object.values(CATEGORIES)) {
			const tools = filteredByCategory.get(category.id) ?? [];
			const target = tools.find((t) => t.implemented);
			if (target) {
				handleQueryChange("");
				dispatch(closeMobileMenu());
				router.push(target.route);
				return;
			}
		}
	};

	const toggleCategory = (category: ToolCategory) => {
		const newExpanded = new Set(expandedCategories);
		if (newExpanded.has(category)) {
			newExpanded.delete(category);
		} else {
			newExpanded.add(category);
		}
		setExpandedCategories(newExpanded);
	};

	const expandAll = () => {
		setExpandedCategories(new Set(Object.keys(CATEGORIES) as ToolCategory[]));
	};

	const collapseAll = () => {
		setExpandedCategories(new Set());
	};

	const handleCloseMobileMenu = () => {
		dispatch(closeMobileMenu());
	};

	// Use a Map to store refs by tool ID for uniqueness across categories
	const textRefs = useRef<Map<string, HTMLSpanElement>>(new Map());

	const handleHover = useCallback((toolId: string, toolName: string) => {
		const el = textRefs.current.get(toolId);
		if (!el) return;
		// scrambleText(el, toolName); // I'll add this back in later just wanted to visually keep it simple for now
	}, []);

	return (
		<>
			{/* Mobile overlay */}
			{mobileMenuOpen && <div className={styles.overlay} onClick={handleCloseMobileMenu} />}

			<aside className={`${styles.sidebar} ${mobileMenuOpen ? styles.sidebarOpen : ""}`}>
				<div className={`h-full flex flex-col overflow-y-auto overflow-x-hidden ${styles.sidebarContent}`}>
					<Link href="/tools" className={`flex items-center gap-2 px-5 h-16 no-underline ${styles.logo}`}>
						<WrenchScrewdriverIcon className={`w-7 h-7 shrink-0 ${styles.logoIcon}`} />
						<span className={`text-xl font-bold whitespace-nowrap ${styles.logoText}`}>Tools</span>
					</Link>

					<nav className="flex-1 py-4 overflow-y-auto">
						<SidebarSearch query={query} onQueryChange={handleQueryChange} onSubmit={handleSubmit} matchCount={matchCount} />
						{!isSearching && <ExpandCollapseAll onExpandAll={expandAll} onCollapseAll={collapseAll} />}
						<FavoritesSection query={normalizedQuery} />

						{isSearching && matchCount === 0 && (
							<p className={styles.noResults}>No tools match &ldquo;{query.trim()}&rdquo;</p>
						)}

						{Object.values(CATEGORIES).map((category) => {
							const tools = filteredByCategory.get(category.id) ?? [];
							const isExpanded = expandedCategories.has(category.id);

							if (tools.length === 0) return null;

							return (
								<div key={category.id} className="mb-2">
									{(() => {
										const CategoryIcon = CATEGORY_ICONS[category.id];
										return (
											<button className={`w-full flex items-center gap-2 px-5 py-3 text-sm font-semibold uppercase tracking-wide cursor-pointer ${styles.categoryHeader}`} onClick={() => toggleCategory(category.id)} aria-expanded={isExpanded}>
												<CategoryIcon className={`w-4.5 h-4.5 shrink-0 ${styles.categoryIcon}`} />
												<span className="flex-1 text-left whitespace-nowrap">{category.name}</span>
												<ChevronRightIcon className={`w-4 h-4 shrink-0 ${styles.chevron} ${isExpanded ? styles.chevronExpanded : ""}`} />
											</button>
										);
									})()}

									<div className={`${styles.categoryItems} ${isExpanded ? styles.expanded : ""}`}>
										<div className={`flex flex-col gap-0.5 ${styles.categoryItemsInner}`}>
											{tools.map((tool) => {
												const isActive = pathname === tool.route;
												return (
													<Link
														onMouseEnter={() => handleHover(tool.id, tool.name)}
														onClick={tool.implemented ? handleCloseMobileMenu : undefined}
														key={tool.id}
														href={tool.implemented ? tool.route : "#"}
														className={`flex items-center justify-between gap-2 px-3 py-1.5 no-underline text-[0.9rem] relative ${styles.toolLink} ${isActive ? styles.active : ""} ${!tool.implemented ? styles.disabled : ""}`}
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
												);
											})}
										</div>
									</div>
								</div>
							);
						})}
					</nav>
				</div>
			</aside>
		</>
	);
}
