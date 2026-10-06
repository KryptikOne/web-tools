// @vitest-environment node
import fs from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";
import { TOOLS_REGISTRY } from "@/config/tools-registry";
import { SITE, toolMetadata } from "@/config/seo";
import sitemap from "@/app/sitemap";
import robots from "@/app/robots";
import { GET as getLlmsTxt } from "@/app/llms.txt/route";

describe("SITE", () => {
	it("points at the production domain", () => {
		expect(SITE.url).toBe("https://bittbott.dev");
		expect(SITE.name).toBe("BittBott.dev");
	});
});

describe("toolMetadata", () => {
	it("builds metadata for a registry tool", () => {
		expect(toolMetadata("diff-checker").alternates).toEqual({ canonical: "/tools/diff-checker" });
	});
	it("throws for an unknown id", () => {
		expect(() => toolMetadata("nope")).toThrow('unknown tool id "nope"');
	});
});

describe("registry seoDescription", () => {
	it.each(TOOLS_REGISTRY.map((t) => [t.id, t.seoDescription] as const))("%s has a valid seoDescription", (_id, d) => {
		expect(d).toBeDefined();
		expect(d!.length).toBeGreaterThanOrEqual(110);
		expect(d!.length).toBeLessThanOrEqual(160);
		expect(d).not.toContain("—");
		expect(d).toBe(d!.trim());
		expect(d).not.toMatch(/\s{2,}/);
	});

	it("every seoDescription is unique", () => {
		const all = TOOLS_REGISTRY.map((t) => t.seoDescription);
		expect(new Set(all).size).toBe(all.length);
	});
});

const toolsDir = path.resolve(process.cwd(), "src/app/tools");
const routeSlugs = fs
	.readdirSync(toolsDir, { withFileTypes: true })
	.filter((e) => e.isDirectory())
	.map((e) => e.name);

describe("tool route pages", () => {
	it("route folders and registry tools match one-to-one", () => {
		const registrySlugs = TOOLS_REGISTRY.map((t) => t.route.replace("/tools/", "")).sort();
		expect([...routeSlugs].sort()).toEqual(registrySlugs);
		for (const t of TOOLS_REGISTRY) expect(t.route).toBe(`/tools/${t.id}`);
	});

	it.each(routeSlugs)("%s exports metadata from toolMetadata", (slug) => {
		const src = fs.readFileSync(path.join(toolsDir, slug, "page.tsx"), "utf8");
		expect(src).toContain(`export const metadata = toolMetadata("${slug}");`);
		expect(src).not.toMatch(/export const metadata(: ?Metadata)? = \{/);
	});
});

describe("sitemap", () => {
	const urls = sitemap().map((e) => e.url);

	it("lists home, /tools and every implemented tool as absolute URLs", () => {
		expect(urls).toContain("https://bittbott.dev/");
		expect(urls).toContain("https://bittbott.dev/tools");
		for (const t of TOOLS_REGISTRY.filter((t) => t.implemented)) expect(urls).toContain(`https://bittbott.dev${t.route}`);
	});

	it("has no duplicates, no styleguide and no unimplemented tools", () => {
		expect(new Set(urls).size).toBe(urls.length);
		expect(urls.some((u) => u.includes("styleguide"))).toBe(false);
		for (const t of TOOLS_REGISTRY.filter((t) => !t.implemented)) expect(urls).not.toContain(`https://bittbott.dev${t.route}`);
	});
});

describe("robots", () => {
	it("allows all crawlers and points to the sitemap", () => {
		expect(robots()).toEqual({
			rules: [{ userAgent: "*", allow: "/" }],
			sitemap: "https://bittbott.dev/sitemap.xml",
		});
	});
});

describe("llms.txt route", () => {
	it("serves plain text listing every implemented tool", async () => {
		const res = getLlmsTxt();
		expect(res.headers.get("Content-Type")).toBe("text/plain; charset=utf-8");
		const body = await res.text();
		expect(body.startsWith("# BittBott.dev")).toBe(true);
		for (const t of TOOLS_REGISTRY.filter((t) => t.implemented)) expect(body).toContain(`(https://bittbott.dev${t.route})`);
	});
});
