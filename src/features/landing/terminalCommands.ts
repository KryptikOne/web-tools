import { CATEGORIES, TOOLS_REGISTRY, getToolById } from "@/config/tools-registry";
import { encodeToBase64 } from "@/lib/base64Utils";
import { arrayBufferToHex } from "@/lib/hashUtils";
import { textToMorse } from "@/lib/morseUtils";
import { getSpellingAlphabet, spellText, spellTokensToString } from "@/lib/natoPhoneticUtils";
import { searchTools } from "@/lib/toolSearch";
import type { CategoryInfo, Tool } from "@/types/tools";

/* ---------- log model ---------- */

export type Tone = "dim" | "ok" | "err" | "you" | "ps1";

export type Part =
	| { kind: "text"; text: string; tone?: Tone }
	| { kind: "tool"; tool: Tool }
	| { kind: "run"; command: string; label: string };

export interface LogLine {
	id: number;
	parts: Part[];
	/** Present on key/value lines, rendered after a dotted leader. */
	value?: Part[];
	tone?: Tone;
}

export const text = (t: string, tone?: Tone): Part => ({ kind: "text", text: t, tone });
export const toolPart = (tool: Tool): Part => ({ kind: "tool", tool });
export const runPart = (command: string, label = command): Part => ({ kind: "run", command, label });

export interface TerminalContext {
	print: (parts: Part[] | string, tone?: Tone) => void;
	kv: (key: Part[] | string, value: Part[] | string, tone?: Tone) => void;
	clear: () => void;
	openTool: (tool: Tool) => void;
	/** Surface these tools as revealed words in the glyph field. */
	surface: (tools: Tool[]) => void;
	/** Let the glyph field "speak" a command's output. */
	speak: (output: string) => void;
}

/* ---------- data ---------- */

export const LANDING_TOOLS: Tool[] = TOOLS_REGISTRY.filter((t) => t.implemented);
export const CATEGORY_NAMES: Record<string, string> = Object.fromEntries(Object.values(CATEGORIES).map((c) => [c.id, c.name]));

export interface LandingCategory extends CategoryInfo {
	/** Short `ls` key: first word of the name, e.g. "css", "security". */
	key: string;
	tools: Tool[];
}

export const LANDING_CATEGORIES: LandingCategory[] = Object.values(CATEGORIES).map((c) => ({
	...c,
	key: c.name.toLowerCase().split(/[^a-z]+/)[0],
	tools: LANDING_TOOLS.filter((t) => t.category === c.id),
}));

export const findTools = (query: string): Tool[] => searchTools(query, LANDING_TOOLS, CATEGORY_NAMES);

/* ---------- commands ---------- */

type Command = (arg: string, ctx: TerminalContext) => void | Promise<void>;

const utf8 = (s: string) => new TextEncoder().encode(s);

function fullTool(ctx: TerminalContext, id: string) {
	const tool = getToolById(id);
	if (tool?.implemented) ctx.print([text("full tool: ", "dim"), toolPart(tool)]);
}

function output(ctx: TerminalContext, value: string) {
	ctx.print(value, "ok");
	ctx.speak(value);
}

function requireArg(ctx: TerminalContext, name: string, arg: string): boolean {
	if (arg) return true;
	ctx.print(`usage: ${name} <text>`, "dim");
	return false;
}

const HELP: [string, string][] = [
	["<anything>", "search all tools"],
	["open <tool>", "jump straight to a tool"],
	["ls [category]", "browse categories"],
	["hash <text>", "SHA-256, computed in this tab"],
	["b64 <text>", "Base64 encode"],
	["hex <text>", "text to hex bytes"],
	["morse <text>", "Morse code"],
	["nato <text>", "NATO spelling alphabet"],
	["uuid", "a fresh v4 UUID"],
	["now", "local time and unix epoch"],
	["whoami", "who you are here"],
	["clear", "clear the screen"],
];

const now: Command = (_arg, ctx) => {
	const d = new Date();
	const unix = String(Math.floor(d.getTime() / 1000));
	ctx.kv("local", d.toLocaleString());
	ctx.kv("iso", d.toISOString());
	ctx.kv("unix", [text(unix, "ok")]);
	ctx.speak(unix);
	fullTool(ctx, "epoch-converter");
};

const b64: Command = (arg, ctx) => {
	if (!requireArg(ctx, "b64", arg)) return;
	output(ctx, encodeToBase64(arg, false, false));
	fullTool(ctx, "base64-encoder-decoder");
};

const hello: Command = (_arg, ctx) => ctx.print("hi. try help, or just start typing.", "dim");

export const COMMANDS: Record<string, Command> = {
	help(_arg, ctx) {
		ctx.print("commands", "dim");
		HELP.forEach(([k, v]) => ctx.kv(k, v, "dim"));
	},
	ls(arg, ctx) {
		if (!arg) {
			LANDING_CATEGORIES.forEach((c) => ctx.kv([runPart(`ls ${c.key}`, c.name)], String(c.tools.length)));
			return;
		}
		const a = arg.toLowerCase();
		const cat = LANDING_CATEGORIES.find((c) => c.key.startsWith(a) || c.name.toLowerCase().includes(a));
		if (!cat) {
			ctx.print(`no category matches "${arg}". run ls to see them all.`, "err");
			return;
		}
		ctx.print(`${cat.name}: ${cat.tools.length} tools`, "dim");
		cat.tools.forEach((t) => ctx.print([toolPart(t)]));
		ctx.surface(cat.tools.slice(0, 3));
	},
	open(arg, ctx) {
		if (!arg) {
			ctx.print("usage: open <tool name>", "dim");
			return;
		}
		const [best] = findTools(arg);
		if (best) ctx.openTool(best);
		else ctx.print(`no tool matches "${arg}"`, "err");
	},
	async hash(arg, ctx) {
		if (!requireArg(ctx, "hash", arg)) return;
		if (!globalThis.crypto?.subtle) {
			ctx.print("SHA-256 needs a secure (https) context.", "err");
			return;
		}
		output(ctx, arrayBufferToHex(await crypto.subtle.digest("SHA-256", utf8(arg))));
		fullTool(ctx, "hash-generator");
	},
	b64,
	base64: b64,
	hex(arg, ctx) {
		if (!requireArg(ctx, "hex", arg)) return;
		output(ctx, Array.from(utf8(arg), (b) => b.toString(16).padStart(2, "0")).join(" "));
		fullTool(ctx, "ascii-to-hex");
	},
	morse(arg, ctx) {
		if (!requireArg(ctx, "morse", arg)) return;
		const code = textToMorse(arg);
		if (!code) {
			ctx.print("nothing in that has a Morse code.", "err");
			return;
		}
		output(ctx, code.replace(/\./g, "·").replace(/-/g, "−"));
	},
	nato(arg, ctx) {
		if (!requireArg(ctx, "nato", arg)) return;
		output(ctx, spellTokensToString(spellText(arg, getSpellingAlphabet("nato"))));
		fullTool(ctx, "nato-phonetic-converter");
	},
	uuid(_arg, ctx) {
		// randomUUID only exists in secure contexts, whatever the DOM types say.
		output(ctx, typeof globalThis.crypto?.randomUUID === "function" ? crypto.randomUUID() : "unavailable in this browser");
		fullTool(ctx, "uuid-generator");
	},
	now,
	date: now,
	whoami: (_arg, ctx) => ctx.print("guest. No login, no account. Nothing you type here leaves this tab."),
	clear: (_arg, ctx) => ctx.clear(),
	echo: (arg, ctx) => ctx.print(arg),
	sudo: (_arg, ctx) => ctx.print("guest is not in the sudoers file. Everything here already runs as you.", "err"),
	rm: (_arg, ctx) => ctx.print("There is no server here to delete from. Your files never left your machine.", "err"),
	exit: (_arg, ctx) => ctx.print("There is no exit. Only more tools.", "dim"),
	cd: (_arg, ctx) => ctx.print("you are already where the tools are.", "dim"),
	hi: hello,
	hello,
};

export function splitCommand(input: string): { name: string; arg: string } {
	const trimmed = input.trim();
	const name = trimmed.split(/\s+/)[0]?.toLowerCase() ?? "";
	return { name, arg: trimmed.slice(name.length).trim() };
}

export const isCommand = (name: string) => Object.prototype.hasOwnProperty.call(COMMANDS, name);

/** Run one line of input: a command, otherwise a tool search. The caller echoes the input. */
export async function runInput(input: string, ctx: TerminalContext): Promise<void> {
	const { name, arg } = splitCommand(input);
	if (!name) return;
	if (isCommand(name)) {
		try {
			await COMMANDS[name](arg, ctx);
		} catch (e) {
			ctx.print(`that did not work: ${e instanceof Error ? e.message : String(e)}`, "err");
		}
		return;
	}
	const matches = findTools(input);
	if (matches.length === 1) {
		ctx.openTool(matches[0]);
		return;
	}
	if (matches.length) {
		ctx.print(`${matches.length} tools match "${input.trim()}":`, "dim");
		matches.slice(0, 6).forEach((t) => ctx.print([toolPart(t), text(` ${CATEGORY_NAMES[t.category]}`, "dim")]));
		ctx.surface(matches.slice(0, 3));
		return;
	}
	ctx.print(`command not found: ${name}`, "err");
	ctx.print("no tool matches either. try help or ls.", "dim");
}

/* ---------- prompt suggestions ---------- */

export type PromptOption = { kind: "run"; label: string } | { kind: "tool"; tool: Tool };

/** Suggestions under the prompt: a "run" row for commands, then matching tools. */
export function promptOptions(input: string): PromptOption[] {
	const trimmed = input.trim();
	if (!trimmed) return [];
	const { name } = splitCommand(trimmed);
	const list: PromptOption[] = [];
	if (isCommand(name)) {
		list.push({ kind: "run", label: trimmed });
		if (/\s/.test(trimmed)) return list;
	}
	findTools(trimmed)
		.slice(0, 6 - list.length)
		.forEach((tool) => list.push({ kind: "tool", tool }));
	return list;
}
