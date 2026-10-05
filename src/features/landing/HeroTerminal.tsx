"use client";

import { useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState, type Ref, type RefObject } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Tool } from "@/types/tools";
import type { GlyphFieldHandle } from "./glyphField";
import {
	CATEGORY_NAMES,
	LANDING_CATEGORIES,
	promptOptions,
	runInput,
	text,
	toolPart,
	type LogLine,
	type Part,
	type PromptOption,
	type TerminalContext,
	type Tone,
} from "./terminalCommands";
import styles from "./Landing.module.scss";

export interface HeroTerminalHandle {
	/** Log and navigate to a tool opened from outside the terminal (the glyph field). */
	announceOpen: (tool: Tool) => void;
}

interface HeroTerminalProps {
	ref?: Ref<HeroTerminalHandle>;
	panelRef: RefObject<HTMLDivElement | null>;
	field: RefObject<GlyphFieldHandle | null>;
	reducedMotion: boolean;
	toolCount: number;
}

const PS1 = "guest@bittbott:~$";
const MAX_LINES = 120;
const CHIPS = ["help", "ls", "hash hello", "morse sos", "nato bittbott"];
const TONE_CLASS: Record<Tone, string> = {
	dim: styles.dim,
	ok: styles.ok,
	err: styles.err,
	you: styles.you,
	ps1: styles.ps1,
};

const asParts = (p: Part[] | string): Part[] => (typeof p === "string" ? [text(p)] : p);

export default function HeroTerminal({ ref, panelRef, field, reducedMotion, toolCount }: HeroTerminalProps) {
	const router = useRouter();
	const [lines, setLines] = useState<LogLine[]>([]);
	const [value, setValue] = useState("");
	const [options, setOptions] = useState<PromptOption[]>([]);
	const [sel, setSel] = useState(0);
	const inputRef = useRef<HTMLInputElement>(null);
	const logRef = useRef<HTMLDivElement>(null);
	const listRef = useRef<HTMLDivElement>(null);
	const nextId = useRef(0);
	const history = useRef<string[]>([]);
	const historyIndex = useRef(0);
	const typing = useRef(false);
	const reducedRef = useRef(reducedMotion);
	useEffect(() => {
		reducedRef.current = reducedMotion;
	}, [reducedMotion]);

	const sleep = useCallback((ms: number) => new Promise((r) => setTimeout(r, reducedRef.current ? 0 : ms)), []);

	const push = useCallback((line: Omit<LogLine, "id">) => {
		setLines((prev) => [...prev, { ...line, id: nextId.current++ }].slice(-MAX_LINES));
	}, []);

	const echo = useCallback((cmd: string) => push({ parts: [text(PS1, "ps1"), text(" "), text(cmd, "you")] }), [push]);

	const ctx = useMemo<TerminalContext>(
		() => ({
			print: (parts, tone) => push({ parts: asParts(parts), tone }),
			kv: (key, val, tone) => push({ parts: asParts(key), value: asParts(val), tone }),
			clear: () => setLines([]),
			openTool: (tool) => {
				push({ parts: [text("opening ", "ok"), toolPart(tool)] });
				router.push(tool.route);
			},
			surface: (tools) => field.current?.surface(tools),
			speak: (out) => field.current?.speak(out),
		}),
		[push, router, field]
	);

	const ctxRef = useRef(ctx);
	useEffect(() => {
		ctxRef.current = ctx;
	}, [ctx]);

	useImperativeHandle(ref, () => ({
		announceOpen: (tool) => {
			echo(`open ${tool.name.toLowerCase()}`);
			ctx.openTool(tool);
		},
	}), [echo, ctx]);

	/** Approximate viewport position of the caret after `length` characters. */
	const caretPoint = useCallback((length: number) => {
		const el = inputRef.current;
		if (!el) return null;
		const r = el.getBoundingClientRect();
		// Ubuntu Mono advance is 0.5em of the 16px input.
		return { x: r.left + Math.min(r.width, length * 8 + 4), y: r.top + r.height / 2 };
	}, []);

	const updateValue = useCallback(
		(next: string) => {
			setValue(next);
			const list = promptOptions(next);
			setOptions(list);
			setSel(0);
			const p = caretPoint(next.length);
			if (p) field.current?.pulse(p.x, p.y, 0.32);
			field.current?.surface(list.flatMap((o) => (o.kind === "tool" ? [o.tool] : [])).slice(0, 3));
		},
		[caretPoint, field]
	);

	const submit = useCallback(
		async (raw: string) => {
			const input = raw.trim();
			setValue("");
			setOptions([]);
			if (!input) return;
			history.current.push(input);
			historyIndex.current = history.current.length;
			echo(input);
			const p = caretPoint(0);
			if (p) field.current?.pulse(p.x, p.y, 1);
			await runInput(input, ctx);
		},
		[caretPoint, ctx, echo, field]
	);

	const openOption = useCallback(
		(tool: Tool) => {
			const typed = value;
			setValue("");
			setOptions([]);
			echo(typed);
			ctx.openTool(tool);
		},
		[ctx, echo, value]
	);

	const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "ArrowDown" || e.key === "ArrowUp") {
			e.preventDefault();
			const dir = e.key === "ArrowDown" ? 1 : -1;
			if (options.length) {
				setSel((s) => (s + dir + options.length) % options.length);
				return;
			}
			if (!history.current.length) return;
			historyIndex.current = Math.max(0, Math.min(history.current.length, historyIndex.current + dir));
			setValue(history.current[historyIndex.current] ?? "");
		} else if (e.key === "Enter") {
			e.preventDefault();
			const o = options[sel];
			if (o?.kind === "tool") openOption(o.tool);
			else void submit(value);
		} else if (e.key === "Escape") {
			setValue("");
			setOptions([]);
		}
	};

	const typeOut = async (command: string) => {
		if (typing.current) return;
		typing.current = true;
		setValue("");
		if (window.matchMedia("(hover: hover)").matches) inputRef.current?.focus({ preventScroll: true });
		let acc = "";
		for (const chr of command) {
			acc += chr;
			updateValue(acc);
			await sleep(45);
		}
		await sleep(180);
		typing.current = false;
		void submit(acc);
	};

	// Keep the newest line in view, like a real terminal.
	useEffect(() => {
		const el = logRef.current;
		if (el) el.scrollTop = el.scrollHeight;
	}, [lines]);

	useEffect(() => {
		listRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: "nearest" });
	}, [sel, options]);

	// Boot sequence (runs once; StrictMode's throwaway mount is cancelled before printing).
	useEffect(() => {
		let cancelled = false;
		const ctx = ctxRef.current;
		(async () => {
			const steps: (() => void)[] = [
				() => ctx.print("booting bittbott", "dim"),
				() => ctx.kv("indexing tools", [text(`${toolCount} ok`, "ok")]),
				() => ctx.kv("categories", String(LANDING_CATEGORIES.length)),
				() => ctx.kv("server uploads", [text("0", "ok")]),
				() => ctx.kv("accounts required", [text("0", "ok")]),
				() => ctx.print([text("ready. start typing, or run "), { kind: "run", command: "help", label: "help" }, text(".")]),
			];
			await sleep(400);
			for (const step of steps) {
				if (cancelled) return;
				step();
				await sleep(220);
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [sleep, toolCount]);

	// Global "/" focuses the prompt (skipped while typing in another field).
	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
			const t = e.target as HTMLElement | null;
			if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)) return;
			e.preventDefault();
			inputRef.current?.focus();
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, []);

	const renderParts = (parts: Part[]) =>
		parts.map((p, i) => {
			if (p.kind === "tool") {
				return (
					<Link key={i} href={p.tool.route} className={styles.logLink}>
						{p.tool.name}
					</Link>
				);
			}
			if (p.kind === "run") {
				return (
					<button key={i} type="button" className={styles.logLink} onClick={() => void submit(p.command)}>
						{p.label}
					</button>
				);
			}
			return (
				<span key={i} className={p.tone ? TONE_CLASS[p.tone] : undefined} aria-hidden={p.tone === "ps1" || undefined}>
					{p.text}
				</span>
			);
		});

	const expanded = options.length > 0;

	return (
		<div ref={panelRef} className={`relative z-[2] mt-[clamp(28px,6vh,64px)] flex w-full max-w-[620px] flex-col gap-3.5 ${styles.terminal}`} data-field-ignore>
			<h1 className={styles.title}>
				<span className={styles.count}>{toolCount}</span> tools that run in your browser.
			</h1>
			<p className={styles.sub}>Nothing you paste leaves your machine. Type to search, or try a command.</p>

			<div className={styles.screen}>
				<div ref={logRef} className={styles.log} aria-live="polite">
					{lines.map((l) => (
						<div key={l.id} className={`${styles.line} ${l.value ? styles.kv : ""} ${l.tone ? TONE_CLASS[l.tone] : ""}`}>
							{l.value ? (
								<>
									<span className={styles.key}>{renderParts(l.parts)}</span>
									<span className={styles.dots} aria-hidden="true" />
									<span>{renderParts(l.value)}</span>
								</>
							) : (
								renderParts(l.parts)
							)}
						</div>
					))}
				</div>

				<form className={`relative mt-1.5 flex items-center gap-2 ${styles.prompt}`} autoComplete="off" onSubmit={(e) => e.preventDefault()}>
					<span className={styles.ps1} aria-hidden="true">
						{PS1}
					</span>
					<input
						ref={inputRef}
						type="text"
						className={styles.input}
						value={value}
						onChange={(e) => updateValue(e.target.value)}
						onKeyDown={onKeyDown}
						onBlur={() => setTimeout(() => document.activeElement !== inputRef.current && setOptions([]), 150)}
						spellCheck={false}
						autoCapitalize="off"
						autoComplete="off"
						placeholder="search tools"
						role="combobox"
						aria-label="Search tools or type a command"
						aria-autocomplete="list"
						aria-expanded={expanded}
						aria-controls="landing-results"
						aria-activedescendant={expanded ? `landing-opt-${sel}` : undefined}
					/>
					<div
						ref={listRef}
						id="landing-results"
						role="listbox"
						aria-label="Matching tools"
						className={styles.results}
						hidden={!expanded}
						onMouseDown={(e) => e.preventDefault()}
					>
						{options.map((o, i) =>
							o.kind === "tool" ? (
								<Link
									key={o.tool.id}
									id={`landing-opt-${i}`}
									href={o.tool.route}
									role="option"
									tabIndex={-1}
									aria-selected={i === sel}
									className={styles.option}
									onPointerEnter={() => setSel(i)}
									onClick={() => {
										echo(value);
										setValue("");
										setOptions([]);
									}}
								>
									<span className={styles.optionName}>{o.tool.name}</span>
									<span className={styles.optionCat}>{CATEGORY_NAMES[o.tool.category]}</span>
								</Link>
							) : (
								<div
									key="run"
									id={`landing-opt-${i}`}
									role="option"
									aria-selected={i === sel}
									className={styles.option}
									onPointerEnter={() => setSel(i)}
									onClick={() => void submit(value)}
								>
									<span className={styles.optionName}>
										run <span className={styles.ok}>{o.label}</span>
									</span>
									<span className={styles.optionCat}>enter</span>
								</div>
							)
						)}
					</div>
				</form>
			</div>

			<div className="flex flex-wrap items-center gap-2">
				<span className={styles.chipLabel}>try</span>
				{CHIPS.map((c) => (
					<button key={c} type="button" className={styles.chip} onClick={() => void typeOut(c)}>
						{c}
					</button>
				))}
			</div>
		</div>
	);
}
