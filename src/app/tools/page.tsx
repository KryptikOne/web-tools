import type { Metadata } from "next";
import { TOOLS_REGISTRY, CATEGORIES, getToolsByCategory } from "@/config/tools-registry";
import { SITE } from "@/config/seo";
import { buildPageMetadata } from "@/lib/seoUtils";
import { ToolCategory } from "@/types/tools";
import ToolCard from "@/components/ToolCard/ToolCard";
import styles from "./page.module.scss";

const liveTools = TOOLS_REGISTRY.filter((tool) => tool.implemented);
const liveCategoryCount = new Set(liveTools.map((tool) => tool.category)).size;

export const metadata: Metadata = buildPageMetadata(
	{
		title: "All Tools",
		description: `Browse all ${liveTools.length} free BittBott.dev tools across ${liveCategoryCount} categories: color, CSS, text, encoding, security, network, unit conversion and more. All run in your browser.`,
		path: "/tools",
	},
	SITE,
);

export default function ToolsPage() {
	const implementedTools = TOOLS_REGISTRY.filter((tool) => tool.implemented);
	const upcomingTools = TOOLS_REGISTRY.filter((tool) => !tool.implemented);

	// Get categories that have at least one implemented tool
	const categoriesWithTools = Object.values(ToolCategory).filter((category) => getToolsByCategory(category).some((tool) => tool.implemented));

	return (
		<div className={styles.container}>
			<section className={styles.header}>
				<h1 className={styles.title}>All Tools</h1>
				<p className={styles.subtitle}>
					{implementedTools.length} tools across {categoriesWithTools.length} categories
					{upcomingTools.length > 0 && `, ${upcomingTools.length} coming soon`}. All of them run in your browser.
				</p>
			</section>

			{categoriesWithTools.map((category) => {
				const categoryInfo = CATEGORIES[category];
				const tools = getToolsByCategory(category).filter((tool) => tool.implemented);

				if (tools.length === 0) return null;

				return (
					<section key={category} className={styles.categorySection}>
						<div className={styles.categoryHeader}>
							<h2 className={styles.categoryTitle}>
								{categoryInfo.name} <span className={styles.categoryCount}>{tools.length}</span>
							</h2>
							<p className={styles.categoryDescription}>{categoryInfo.description}</p>
						</div>
						<div className={styles.toolsGrid}>
							{tools.map((tool) => (
								<ToolCard key={tool.id} tool={tool} />
							))}
						</div>
					</section>
				);
			})}

			{upcomingTools.length > 0 && (
				<section className={styles.categorySection}>
					<div className={styles.categoryHeader}>
						<h2 className={styles.categoryTitle}>Coming Soon</h2>
						<p className={styles.categoryDescription}>These tools are currently in development</p>
					</div>
					<div className={styles.toolsGrid}>
						{upcomingTools.map((tool) => (
							<ToolCard key={tool.id} tool={tool} />
						))}
					</div>
				</section>
			)}
		</div>
	);
}
