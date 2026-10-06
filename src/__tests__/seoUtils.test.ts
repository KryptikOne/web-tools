import { describe, it, expect } from "vitest";
import { ToolCategory, type Tool, type CategoryInfo } from "@/types/tools";
import {
	absoluteUrl,
	toolDescription,
	buildPageMetadata,
	buildToolMetadata,
	buildWebsiteJsonLd,
	buildToolJsonLd,
	buildLlmsTxt,
	serializeJsonLd,
	type SiteInfo,
} from "@/lib/seoUtils";

const site: SiteInfo = {
	name: "BittBott.dev",
	url: "https://bittbott.dev",
	title: "BittBott.dev: free tools that run in your browser",
	description: "Free tools.",
};

const tool = (overrides: Partial<Tool> = {}): Tool => ({
	id: "diff-checker",
	name: "Diff Checker",
	description: "Short blurb",
	category: ToolCategory.TEXT_DATA,
	route: "/tools/diff-checker",
	implemented: true,
	...overrides,
});

describe("absoluteUrl", () => {
	it("joins site url and path", () => {
		expect(absoluteUrl(site, "/tools/diff-checker")).toBe("https://bittbott.dev/tools/diff-checker");
		expect(absoluteUrl(site, "/")).toBe("https://bittbott.dev/");
	});
});

describe("toolDescription", () => {
	it("prefers seoDescription", () => {
		expect(toolDescription(tool({ seoDescription: "Long one" }))).toBe("Long one");
	});
	it("falls back to description", () => {
		expect(toolDescription(tool())).toBe("Short blurb");
	});
});

describe("buildPageMetadata", () => {
	it("uses a templated title and full OG/Twitter titles", () => {
		const m = buildPageMetadata({ title: "All Tools", description: "d", path: "/tools" }, site);
		expect(m.title).toBe("All Tools");
		expect(m.description).toBe("d");
		expect(m.alternates).toEqual({ canonical: "/tools" });
		expect(m.openGraph).toMatchObject({
			title: "All Tools | BittBott.dev",
			description: "d",
			url: "/tools",
			siteName: "BittBott.dev",
			type: "website",
			locale: "en_US",
		});
		expect(m.twitter).toMatchObject({ card: "summary", title: "All Tools | BittBott.dev", description: "d" });
	});

	it("supports an absolute title", () => {
		const m = buildPageMetadata({ title: site.title, description: "d", path: "/", absoluteTitle: true }, site);
		expect(m.title).toEqual({ absolute: site.title });
		expect(m.openGraph).toMatchObject({ title: site.title, url: "/" });
	});
});

describe("buildToolMetadata", () => {
	it("maps a tool onto page metadata", () => {
		const m = buildToolMetadata(tool({ seoDescription: "SEO text" }), site);
		expect(m.title).toBe("Diff Checker");
		expect(m.description).toBe("SEO text");
		expect(m.alternates).toEqual({ canonical: "/tools/diff-checker" });
		expect(m.openGraph).toMatchObject({ url: "/tools/diff-checker", title: "Diff Checker | BittBott.dev" });
	});
});

describe("JSON-LD", () => {
	it("builds a WebSite node", () => {
		expect(buildWebsiteJsonLd(site)).toEqual({
			"@context": "https://schema.org",
			"@type": "WebSite",
			name: "BittBott.dev",
			url: "https://bittbott.dev/",
			description: "Free tools.",
		});
	});

	it("builds WebApplication + BreadcrumbList for a tool", () => {
		const ld = buildToolJsonLd(tool({ seoDescription: "SEO text" }), site) as { "@graph": Record<string, unknown>[] };
		const [app, crumbs] = ld["@graph"];
		expect(app).toMatchObject({
			"@type": "WebApplication",
			name: "Diff Checker",
			description: "SEO text",
			url: "https://bittbott.dev/tools/diff-checker",
			applicationCategory: "DeveloperApplication",
			operatingSystem: "Any",
			isAccessibleForFree: true,
			offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
		});
		expect(crumbs["@type"]).toBe("BreadcrumbList");
		const items = crumbs.itemListElement as { position: number; name: string; item: string }[];
		expect(items.map((i) => [i.position, i.name, i.item])).toEqual([
			[1, "BittBott.dev", "https://bittbott.dev/"],
			[2, "All Tools", "https://bittbott.dev/tools"],
			[3, "Diff Checker", "https://bittbott.dev/tools/diff-checker"],
		]);
	});

	it("maps categories to schema.org application categories", () => {
		const cat = (c: ToolCategory) =>
			((buildToolJsonLd(tool({ category: c }), site) as { "@graph": Record<string, unknown>[] })["@graph"][0]).applicationCategory;
		expect(cat(ToolCategory.CSS_DESIGN)).toBe("DesignApplication");
		expect(cat(ToolCategory.SECURITY_CRYPTO)).toBe("SecurityApplication");
		expect(cat(ToolCategory.KITCHEN)).toBe("LifestyleApplication");
	});

	it("serializeJsonLd escapes < so a description cannot close the script tag", () => {
		const out = serializeJsonLd({ description: "</script><script>alert(1)</script>" });
		expect(out).not.toContain("<");
		expect(JSON.parse(out)).toEqual({ description: "</script><script>alert(1)</script>" });
	});
});

describe("buildLlmsTxt", () => {
	const categories: CategoryInfo[] = [
		{ id: ToolCategory.TEXT_DATA, name: "Text & Data", description: "" },
		{ id: ToolCategory.NETWORK, name: "Network", description: "" },
		{ id: ToolCategory.KITCHEN, name: "Kitchen & Food", description: "" },
	];
	const tools = [
		tool({ seoDescription: "Compare text." }),
		tool({ id: "ip", name: "IP Calc", category: ToolCategory.NETWORK, route: "/tools/ip", seoDescription: "Subnets." }),
		tool({ id: "soon", name: "Soon", category: ToolCategory.KITCHEN, route: "/tools/soon", implemented: false }),
	];
	const txt = buildLlmsTxt(tools, categories, site);

	it("starts with the llmstxt.org header", () => {
		expect(txt.startsWith("# BittBott.dev\n\n> Free tools.\n")).toBe(true);
	});

	it("lists implemented tools under their category with absolute links", () => {
		expect(txt).toContain("## Text & Data\n\n- [Diff Checker](https://bittbott.dev/tools/diff-checker): Compare text.");
		expect(txt).toContain("## Network\n\n- [IP Calc](https://bittbott.dev/tools/ip): Subnets.");
	});

	it("omits unimplemented tools and categories left empty", () => {
		expect(txt).not.toContain("Soon");
		expect(txt).not.toContain("## Kitchen & Food");
	});

	it("states the implemented tool count", () => {
		expect(txt).toContain("2 free tools across 2 categories");
	});
});
