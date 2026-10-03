import { parseQuantity } from "./quantity";
import type { ParseError, Recipe, RecipeNode, Step, StepInput } from "./types";

const DURATION_RE = /\s+(\d+(?:\.\d+)?(?:\s*[-–]\s*\d+(?:\.\d+)?)?\s*(?:s|sec|secs|seconds?|m|min|mins|minutes?|h|hr|hrs|hours?))$/i;
const HEADER_FIELD_RE = /^([A-Za-z][\w -]*?):\s*(.*)$/;

function splitAmount(text: string): { amount: string; prep?: string } {
	const idx = text.indexOf(",");
	if (idx === -1) return { amount: text.trim() };
	return { amount: text.slice(0, idx).trim(), prep: text.slice(idx + 1).trim() || undefined };
}

/** Parse recipe DSL text. Never throws; problems land in `errors` with line numbers. */
export function parseRecipe(text: string): Recipe {
	const recipe: Recipe = { title: "Untitled", serves: null, tags: [], meta: {}, nodes: [], errors: [] };
	const nodes: RecipeNode[] = recipe.nodes;
	const errors: ParseError[] = recipe.errors;
	const results = new Map<string, number>();
	const byproducts = new Map<string, number>();

	let inHeader = true;
	let lastStep: Step | null = null;
	let lastStepIndex = -1;
	let lastClosed = false;

	const lines = text.split(/\r?\n/);
	for (let i = 0; i < lines.length; i++) {
		const lineNo = i + 1;
		const line = lines[i].trim();
		if (!line) continue;

		const err = (message: string) => errors.push({ line: lineNo, message });

		if (inHeader) {
			if (line.startsWith("#")) {
				recipe.title = line.replace(/^#+\s*/, "").trim() || "Untitled";
				continue;
			}
			if (line.startsWith(">")) {
				nodes.push({ kind: "note", line: lineNo, text: line.slice(1).trim() });
				continue;
			}
			const field = line.match(HEADER_FIELD_RE);
			if (field && !/^[-@=>x]/.test(line)) {
				const key = field[1].trim().toLowerCase();
				const value = field[2].trim();
				if (key === "serves") {
					const n = parseFloat(value);
					if (Number.isFinite(n) && n > 0) recipe.serves = n;
					else err(`serves should be a number, got "${value}"`);
				} else if (key === "tags") {
					recipe.tags = value.split(",").map((t) => t.trim()).filter(Boolean);
				} else if (key === "source") {
					recipe.source = value;
				} else {
					recipe.meta[key] = value;
				}
				continue;
			}
			if (/^(-|@|=|->|x\s)/.test(line)) {
				err("This line needs a step above it");
				continue;
			}
			inHeader = false;
			// fall through: this line is the first step
		}

		if (line.startsWith("->")) {
			const name = line.slice(2).trim();
			if (!lastStep) err("A byproduct needs a step above it");
			else if (!name) err("Byproduct needs a name, e.g. -> pasta water");
			else {
				lastStep.byproducts.push(name);
				byproducts.set(name.toLowerCase(), lastStepIndex);
			}
			continue;
		}

		if (line.startsWith("-")) {
			const body = line.slice(1).trim();
			if (!lastStep) {
				err("An ingredient needs a step above it");
				continue;
			}
			const colon = body.indexOf(":");
			const name = (colon === -1 ? body : body.slice(0, colon)).trim();
			if (!name) {
				err("Ingredient needs a name, e.g. - garlic: 2 cloves");
				continue;
			}
			const { amount, prep } = colon === -1 ? { amount: "" } : splitAmount(body.slice(colon + 1));
			const input: StepInput = { kind: "ingredient", line: lineNo, name, amount: amount ? parseQuantity(amount) : null, prep };
			lastStep.inputs.push(input);
			continue;
		}

		if (line.startsWith("@")) {
			const body = line.slice(1).trim();
			if (!lastStep) {
				err("A reference needs a step above it");
				continue;
			}
			const colon = body.indexOf(":");
			const ref = (colon === -1 ? body : body.slice(0, colon)).trim();
			const amountText = colon === -1 ? "" : body.slice(colon + 1).trim();
			const key = ref.toLowerCase();
			if (results.has(key)) {
				lastStep.inputs.push({ kind: "result", line: lineNo, ref, resolved: results.get(key)! });
			} else if (byproducts.has(key)) {
				lastStep.inputs.push({ kind: "byproduct", line: lineNo, ref, amount: amountText ? parseQuantity(amountText) : null, resolved: byproducts.get(key)! });
			} else {
				err(`"${ref}" isn't a result (= name) or byproduct (-> name) declared above`);
				lastStep.inputs.push({ kind: "result", line: lineNo, ref, resolved: null });
			}
			continue;
		}

		if (line.startsWith("=")) {
			const name = line.slice(1).trim();
			if (!lastStep) err("A result name needs a step above it");
			else if (!name) err("Result needs a name, e.g. = sauce");
			else {
				lastStep.resultName = name;
				results.set(name.toLowerCase(), lastStepIndex);
				lastClosed = true;
			}
			continue;
		}

		if (/^x\s/.test(line)) {
			if (!lastStep) err("A discard note needs a step above it");
			else lastStep.discard = line.slice(1).trim();
			continue;
		}

		if (line.startsWith(">")) {
			if (lastStep) lastStep.footnotes.push(line.slice(1).trim());
			else nodes.push({ kind: "note", line: lineNo, text: line.slice(1).trim() });
			continue;
		}

		// A step, optionally with an inline byproduct: "drain 2 min -> pasta water"
		const arrow = line.indexOf("->");
		const stepText = arrow === -1 ? line : line.slice(0, arrow).trim();
		const inlineByproduct = arrow === -1 ? "" : line.slice(arrow + 2).trim();
		const durationMatch = stepText.match(DURATION_RE);
		const action = durationMatch ? stepText.slice(0, durationMatch.index).trim() : stepText;
		const step: Step = {
			kind: "step",
			line: lineNo,
			action: action || "step",
			duration: durationMatch ? durationMatch[1].trim() : undefined,
			inputs: [],
			byproducts: [],
			footnotes: [],
		};
		if (lastStep && !lastClosed) step.inputs.push({ kind: "chain", resolved: lastStepIndex });
		nodes.push(step);
		lastStep = step;
		lastStepIndex = nodes.length - 1;
		lastClosed = false;
		if (arrow !== -1) {
			if (!inlineByproduct) err("Byproduct needs a name, e.g. -> pasta water");
			else {
				step.byproducts.push(inlineByproduct);
				byproducts.set(inlineByproduct.toLowerCase(), lastStepIndex);
			}
		}
	}

	return recipe;
}
