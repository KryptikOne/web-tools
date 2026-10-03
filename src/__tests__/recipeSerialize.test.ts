import { describe, it, expect } from "vitest";
import { parseRecipe, layoutRecipe, toHtml, toMarkdown, encodeShare, decodeShare, SAMPLE_RECIPES, ingredientTotals, formatQuantity } from "@/lib/recipeUtils";

const aglio = SAMPLE_RECIPES[0].text;

describe("samples", () => {
	it("all parse without errors and lay out with full coverage", () => {
		for (const s of SAMPLE_RECIPES) {
			const r = parseRecipe(s.text);
			expect(r.errors, s.id).toEqual([]);
			const l = layoutRecipe(r);
			expect(l.cells.length + l.tables.length, s.id).toBeGreaterThan(0);
		}
	});
});

describe("toHtml", () => {
	it("emits a self-contained table with no class attributes and the right cell count", () => {
		const recipe = parseRecipe(aglio);
		const html = toHtml(recipe, { serves: null, unitMode: "written" });
		expect(html).toContain("<table");
		expect(html).not.toMatch(/class=/);
		const doc = new DOMParser().parseFromString(html, "text/html");
		const layout = layoutRecipe(recipe);
		expect(doc.querySelectorAll("td").length).toBe(layout.cells.length + layout.banners.length);
		expect(doc.querySelector("h2")?.textContent).toBe("Aglio e olio");
	});

	it("applies scaling and unit mode", () => {
		const html = toHtml(parseRecipe(aglio), { serves: 4, unitMode: "imperial" });
		expect(html).toContain("14.1 oz spaghetti");
	});
});

describe("toMarkdown", () => {
	it("lists ingredients and numbered steps", () => {
		const md = toMarkdown(parseRecipe(aglio), { serves: null, unitMode: "written" });
		expect(md).toContain("- 3 tbsp olive oil");
		expect(md).toContain("1. Fry 2 tbsp olive oil, 2 cloves garlic, 1 pinch chilli flakes for 2 min → sauce");
		expect(md).toContain("3. Drain; discard most of the water; keep pasta water");
	});
});

describe("ingredientTotals", () => {
	it("merges olive oil across steps and scales", () => {
		const totals = ingredientTotals(parseRecipe(aglio), 2);
		const oil = totals.find((t) => t.name === "olive oil")!;
		expect(formatQuantity(oil.quantities[0], "written")).toBe("6 tbsp");
	});
});

describe("share", () => {
	it("round-trips through a compressed token", async () => {
		const token = await encodeShare(aglio);
		expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
		expect(token.length).toBeLessThan(aglio.length);
		expect(await decodeShare(`#r=${token}`)).toBe(aglio);
		expect(await decodeShare(token)).toBe(aglio);
	});

	it("returns null for garbage", async () => {
		expect(await decodeShare("#r=!!!not-a-token")).toBeNull();
		expect(await decodeShare("")).toBeNull();
	});
});
