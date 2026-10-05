import { describe, it, expect } from "vitest";
import { searchTools } from "@/lib/toolSearch";
import { textToMorse } from "@/lib/morseUtils";
import { ToolCategory, type Tool } from "@/types/tools";
import { promptOptions, runInput, splitCommand, type Part, type TerminalContext } from "@/features/landing/terminalCommands";

const tool = (id: string, name: string, description = "", category = ToolCategory.TEXT_DATA): Tool => ({
	id,
	name,
	description,
	category,
	route: `/tools/${id}`,
	implemented: true,
});

describe("searchTools", () => {
	const tools = [
		tool("json-minifier", "JSON Minifier", "Shrink JSON"),
		tool("json-prettifier", "JSON Prettifier & Viewer", "Format JSON"),
		tool("csv-to-json", "CSV to JSON", "Convert CSV"),
		tool("hash-generator", "Hash Generator", "MD5 and SHA digests", ToolCategory.SECURITY_CRYPTO),
	];

	it("returns nothing for an empty query", () => {
		expect(searchTools("   ", tools)).toEqual([]);
	});

	it("ranks name prefixes above word prefixes", () => {
		const names = searchTools("json", tools).map((t) => t.name);
		expect(names.slice(0, 2).sort()).toEqual(["JSON Minifier", "JSON Prettifier & Viewer"]);
		expect(names[2]).toBe("CSV to JSON");
	});

	it("requires every term to match", () => {
		expect(searchTools("json minif", tools).map((t) => t.id)).toEqual(["json-minifier"]);
		expect(searchTools("json zebra", tools)).toEqual([]);
	});

	it("matches descriptions and category names", () => {
		expect(searchTools("sha", tools).map((t) => t.id)).toEqual(["hash-generator"]);
		expect(searchTools("security", tools, { [ToolCategory.SECURITY_CRYPTO]: "Security & Crypto" }).map((t) => t.id)).toEqual(["hash-generator"]);
	});
});

describe("textToMorse", () => {
	it("separates letters with spaces and words with a slash", () => {
		expect(textToMorse("sos")).toBe("... --- ...");
		expect(textToMorse("hi there")).toBe(".... .. / - .... . .-. .");
	});

	it("drops characters without a code", () => {
		expect(textToMorse("a~b")).toBe(".- -...");
		expect(textToMorse("~~")).toBe("");
	});
});

function fakeContext() {
	const printed: string[] = [];
	const flat = (p: Part[] | string) =>
		typeof p === "string" ? p : p.map((x) => (x.kind === "text" ? x.text : x.kind === "tool" ? `[${x.tool.name}]` : `<${x.label}>`)).join("");
	const ctx: TerminalContext & { opened: Tool[]; spoken: string[]; cleared: number } = {
		opened: [],
		spoken: [],
		cleared: 0,
		print: (parts) => printed.push(flat(parts)),
		kv: (k, v) => printed.push(`${flat(k)}: ${flat(v)}`),
		clear: () => ctx.cleared++,
		openTool: (t) => ctx.opened.push(t),
		surface: () => {},
		speak: (s) => ctx.spoken.push(s),
	};
	return { ctx, printed };
}

describe("terminal commands", () => {
	it("splits command name and argument", () => {
		expect(splitCommand("  HASH  hello world ")).toEqual({ name: "hash", arg: "hello world" });
	});

	it("morse prints and speaks the code", async () => {
		const { ctx, printed } = fakeContext();
		await runInput("morse sos", ctx);
		expect(printed[0]).toBe("··· −−− ···");
		expect(ctx.spoken).toHaveLength(1);
	});

	it("b64 uses the shared encoder and links the full tool", async () => {
		const { ctx, printed } = fakeContext();
		await runInput("b64 hello", ctx);
		expect(printed[0]).toBe("aGVsbG8=");
		expect(printed[1]).toMatch(/^full tool: \[/);
	});

	it("nato spells with the shared alphabet", async () => {
		const { ctx, printed } = fakeContext();
		await runInput("nato ab", ctx);
		expect(printed[0]).toBe("Alfa Bravo");
	});

	it("asks for an argument when one is required", async () => {
		const { ctx, printed } = fakeContext();
		await runInput("hash", ctx);
		expect(printed).toEqual(["usage: hash <text>"]);
	});

	it("clear clears", async () => {
		const { ctx } = fakeContext();
		await runInput("clear", ctx);
		expect(ctx.cleared).toBe(1);
	});

	it("open jumps to the best match", async () => {
		const { ctx } = fakeContext();
		await runInput("open json minifier", ctx);
		expect(ctx.opened.map((t) => t.id)).toEqual(["json-minifier"]);
	});

	it("falls back to tool search, then to command not found", async () => {
		const { ctx, printed } = fakeContext();
		await runInput("zzqqxx", ctx);
		expect(printed[0]).toBe("command not found: zzqqxx");
	});

	it("ls lists every category with a count", async () => {
		const { ctx, printed } = fakeContext();
		await runInput("ls", ctx);
		expect(printed.length).toBeGreaterThanOrEqual(10);
		expect(printed[0]).toMatch(/^<.+>: \d+$/);
	});
});

describe("promptOptions", () => {
	it("offers a run row and tool matches for a bare command", () => {
		const opts = promptOptions("hash");
		expect(opts[0]).toEqual({ kind: "run", label: "hash" });
		expect(opts.some((o) => o.kind === "tool" && o.tool.id === "hash-generator")).toBe(true);
	});

	it("offers only the run row once the command has arguments", () => {
		expect(promptOptions("hash hello")).toEqual([{ kind: "run", label: "hash hello" }]);
	});

	it("offers tool matches for plain text", () => {
		const opts = promptOptions("color picker");
		expect(opts[0]).toMatchObject({ kind: "tool" });
		expect(opts.length).toBeLessThanOrEqual(6);
	});
});
