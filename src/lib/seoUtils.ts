import type { Metadata } from "next";
import { ToolCategory, type CategoryInfo, type Tool } from "@/types/tools";

export interface SiteInfo {
	name: string;
	url: string;
	/** Full default title, used as-is on the home page. */
	title: string;
	description: string;
}

export interface PageSeo {
	title: string;
	description: string;
	/** Site-relative path, e.g. "/tools/diff-checker". */
	path: string;
	/** Skip the root title template (home page). */
	absoluteTitle?: boolean;
}

/** schema.org applicationCategory per tool category. */
export const APPLICATION_CATEGORY: Record<ToolCategory, string> = {
	[ToolCategory.CSS_DESIGN]: "DesignApplication",
	[ToolCategory.IMAGE_MEDIA]: "MultimediaApplication",
	[ToolCategory.TEXT_DATA]: "DeveloperApplication",
	[ToolCategory.ENCODING_DATA]: "DeveloperApplication",
	[ToolCategory.WEB_DEV]: "DeveloperApplication",
	[ToolCategory.UNIT_CONVERTERS]: "UtilitiesApplication",
	[ToolCategory.CALCULATORS_TIME]: "UtilitiesApplication",
	[ToolCategory.SECURITY_CRYPTO]: "SecurityApplication",
	[ToolCategory.NETWORK]: "UtilitiesApplication",
	[ToolCategory.KITCHEN]: "LifestyleApplication",
};

export function absoluteUrl(site: SiteInfo, path: string): string {
	return new URL(path, site.url).toString();
}

export function toolDescription(tool: Tool): string {
	return tool.seoDescription ?? tool.description;
}

export function buildPageMetadata(page: PageSeo, site: SiteInfo): Metadata {
	const fullTitle = page.absoluteTitle ? page.title : `${page.title} | ${site.name}`;
	// Next replaces nested openGraph/twitter objects wholesale, so every page repeats siteName/type/locale.
	return {
		title: page.absoluteTitle ? { absolute: page.title } : page.title,
		description: page.description,
		alternates: { canonical: page.path },
		openGraph: {
			title: fullTitle,
			description: page.description,
			url: page.path,
			siteName: site.name,
			type: "website",
			locale: "en_US",
		},
		twitter: { card: "summary", title: fullTitle, description: page.description },
	};
}

export function buildToolMetadata(tool: Tool, site: SiteInfo): Metadata {
	return buildPageMetadata({ title: tool.name, description: toolDescription(tool), path: tool.route }, site);
}

export function buildWebsiteJsonLd(site: SiteInfo): Record<string, unknown> {
	return {
		"@context": "https://schema.org",
		"@type": "WebSite",
		name: site.name,
		url: absoluteUrl(site, "/"),
		description: site.description,
	};
}

export function buildToolJsonLd(tool: Tool, site: SiteInfo): Record<string, unknown> {
	const url = absoluteUrl(site, tool.route);
	return {
		"@context": "https://schema.org",
		"@graph": [
			{
				"@type": "WebApplication",
				"@id": `${url}#app`,
				name: tool.name,
				description: toolDescription(tool),
				url,
				applicationCategory: APPLICATION_CATEGORY[tool.category],
				operatingSystem: "Any",
				browserRequirements: "Requires JavaScript",
				isAccessibleForFree: true,
				offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
			},
			{
				"@type": "BreadcrumbList",
				itemListElement: [
					{ "@type": "ListItem", position: 1, name: site.name, item: absoluteUrl(site, "/") },
					{ "@type": "ListItem", position: 2, name: "All Tools", item: absoluteUrl(site, "/tools") },
					{ "@type": "ListItem", position: 3, name: tool.name, item: url },
				],
			},
		],
	};
}

/** llms.txt (llmstxt.org): H1, blockquote summary, then one H2 link list per category. */
export function buildLlmsTxt(tools: Tool[], categories: CategoryInfo[], site: SiteInfo): string {
	const live = tools.filter((t) => t.implemented);
	const sections = categories
		.map((category) => ({ category, tools: live.filter((t) => t.category === category.id) }))
		.filter((s) => s.tools.length > 0);

	const lines = [
		`# ${site.name}`,
		"",
		`> ${site.description}`,
		"",
		`${live.length} free tools across ${sections.length} categories. Every tool runs client-side in the browser; input is never uploaded to a server. No account needed.`,
		"",
	];
	for (const { category, tools: inCategory } of sections) {
		lines.push(`## ${category.name}`, "");
		for (const t of inCategory) lines.push(`- [${t.name}](${absoluteUrl(site, t.route)}): ${toolDescription(t)}`);
		lines.push("");
	}
	return lines.join("\n");
}

/** JSON for a <script type="application/ld+json">, with "<" escaped so content can't close the tag. */
export function serializeJsonLd(data: unknown): string {
	return JSON.stringify(data).replace(/</g, "\\u003c");
}
