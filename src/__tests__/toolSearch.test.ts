import { describe, it, expect } from "vitest";
import { searchTools, filterToolsByQuery } from "@/lib/toolSearch";
import { TOOLS_REGISTRY, CATEGORY_NAMES } from "@/config/tools-registry";
import { ToolCategory, type Tool } from "@/types/tools";

const tool = (id: string, name: string, extra: Partial<Tool> = {}): Tool => ({
	id,
	name,
	description: "",
	category: ToolCategory.TEXT_DATA,
	route: `/tools/${id}`,
	implemented: true,
	...extra,
});

describe("searchTools keywords", () => {
	const tools = [
		tool("a", "Alpha Tool", { keywords: ["exif", "zero-width"] }),
		tool("b", "Beta Tool", { description: "mentions exif in passing" }),
		tool("c", "Exif Viewer"),
	];

	it("ranks name > keyword > description", () => {
		expect(searchTools("exif", tools).map((t) => t.id)).toEqual(["c", "a", "b"]);
	});

	it("matches any word inside a multi-word keyword", () => {
		expect(searchTools("width", tools).map((t) => t.id)).toEqual(["a"]);
	});

	it("requires every term to match", () => {
		expect(searchTools("exif beta", tools).map((t) => t.id)).toEqual(["b"]);
	});
});

describe("filterToolsByQuery", () => {
	const tools = [tool("z", "Zed", { keywords: ["last"] }), tool("a", "Apple", { keywords: ["last"] })];

	it("keeps the caller's order instead of ranking", () => {
		expect(filterToolsByQuery("last", tools).map((t) => t.id)).toEqual(["z", "a"]);
	});

	it("returns everything for a blank query", () => {
		expect(filterToolsByQuery("  ", tools)).toHaveLength(2);
	});
});

describe("registry keywords", () => {
	const find = (q: string) => searchTools(q, TOOLS_REGISTRY, CATEGORY_NAMES).map((t) => t.id);

	it("finds Metadata Stripper by exif", () => {
		expect(find("exif")[0]).toBe("metadata-stripper");
	});

	it("finds Invisible Character Remover by whitespace", () => {
		expect(find("whitespace")).toContain("invisible-character-remover");
	});

	it("keywords are lowercase", () => {
		for (const t of TOOLS_REGISTRY) {
			for (const k of t.keywords ?? []) expect(k).toBe(k.toLowerCase());
		}
	});
});
