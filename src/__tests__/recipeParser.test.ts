import { describe, it, expect } from "vitest";
import { parseRecipe } from "@/lib/recipeUtils";
import type { Step } from "@/lib/recipeUtils";

const SAMPLE = `# Aglio e olio
serves: 2
tags: pasta, weeknight
source: https://example.com

> Salt a large pot of water

fry 2 min
- olive oil: 2 tbsp
- garlic: 2 cloves, sliced
- chilli flakes: 1 pinch
= sauce

boil 9 min
- spaghetti: 200 g
- water: salted
drain -> pasta water
x most of the water
toss 1 min
@ sauce
loosen
@ pasta water: 1/4 cup
serve
- parmesan: 30 g, grated
- parsley: 1 handful, chopped
- olive oil: 1 tbsp
> Toss quickly so the cheese melts
`;

const steps = (text: string) => parseRecipe(text).nodes.filter((n): n is Step => n.kind === "step");

describe("parseRecipe", () => {
	it("reads the header", () => {
		const r = parseRecipe(SAMPLE);
		expect(r.title).toBe("Aglio e olio");
		expect(r.serves).toBe(2);
		expect(r.tags).toEqual(["pasta", "weeknight"]);
		expect(r.source).toBe("https://example.com");
		expect(r.errors).toEqual([]);
	});

	it("falls back to Untitled and keeps unknown header fields", () => {
		const r = parseRecipe("cuisine: italian\n\nboil 5 min\n- egg: 1");
		expect(r.title).toBe("Untitled");
		expect(r.meta).toEqual({ cuisine: "italian" });
	});

	it("parses steps with durations and ingredients with prep", () => {
		const s = steps(SAMPLE);
		expect(s[0]).toMatchObject({ action: "fry", duration: "2 min", resultName: "sauce" });
		expect(s[0].inputs[1]).toMatchObject({ kind: "ingredient", name: "garlic", prep: "sliced" });
		expect((s[0].inputs[1] as { amount: { value: number } }).amount.value).toBe(2);
		expect(parseRecipe("bake 25-30 min\n- dough: 1").nodes[0]).toMatchObject({ duration: "25-30 min" });
		expect(parseRecipe("rest\n- dough: 1").nodes[0]).toMatchObject({ action: "rest", duration: undefined });
	});

	it("chains steps unless the previous one was closed with =", () => {
		const s = steps(SAMPLE);
		expect(s[0].inputs.some((i) => i.kind === "chain")).toBe(false); // first step
		expect(s[1].inputs.some((i) => i.kind === "chain")).toBe(false); // fry was closed
		expect(s[2].inputs[0]).toEqual({ kind: "chain", resolved: 2 }); // drain ← boil (node index 2: note, fry, boil)
	});

	it("resolves results and byproducts", () => {
		const s = steps(SAMPLE);
		const toss = s[3];
		expect(toss.inputs.find((i) => i.kind === "result")).toMatchObject({ ref: "sauce", resolved: 1 });
		expect(s[2].byproducts).toEqual(["pasta water"]);
		expect(s[2].discard).toBe("most of the water");
		const loosen = s[4];
		expect(loosen.inputs.find((i) => i.kind === "byproduct")).toMatchObject({ ref: "pasta water", resolved: 3 });
		expect((loosen.inputs[1] as { amount: { value: number } }).amount.value).toBe(0.25);
	});

	it("puts notes before the first step in nodes and later ones on the step", () => {
		const r = parseRecipe(SAMPLE);
		expect(r.nodes[0]).toMatchObject({ kind: "note", text: "Salt a large pot of water" });
		const serve = steps(SAMPLE)[5];
		expect(serve.footnotes).toEqual(["Toss quickly so the cheese melts"]);
	});

	it("collects errors with line numbers instead of throwing", () => {
		const r = parseRecipe("- egg: 1\nfry\n@ nothing\n= \n");
		expect(r.errors.map((e) => e.line)).toEqual([1, 3, 4]);
		const fry = r.nodes[0] as Step;
		expect(fry.inputs.find((i) => i.kind === "result")).toMatchObject({ ref: "nothing", resolved: null });
	});

	it("treats key: value after the first step as a step", () => {
		const r = parseRecipe("fry\n- egg: 1\nsalt: to taste\n");
		expect(r.nodes).toHaveLength(2);
		expect((r.nodes[1] as Step).action).toBe("salt: to taste");
	});
});
