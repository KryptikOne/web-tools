"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
	ClipboardDocumentIcon,
	CheckIcon,
	TrashIcon,
	ArrowUturnLeftIcon,
} from "@heroicons/react/24/outline";
import SegmentedControl from "@/components/SegmentedControl";
import styles from "./MathExpressionEvaluator.module.scss";
import { useClipboard } from "@/hooks/useClipboard";

type HistoryEntry = {
	id: string;
	expression: string;
	result: string;
	error: boolean;
};

type AngleMode = "deg" | "rad";

const MAX_HISTORY = 20;

type MathJsModule = typeof import("mathjs");

interface Key {
	label: string;
	/** Text inserted at the cursor. A trailing "(" leaves the cursor inside. */
	insert?: string;
	action?: "clear" | "backspace" | "evaluate" | "negate" | "ans";
	kind?: "op" | "fn" | "num" | "accent" | "danger";
	title?: string;
	span?: number;
}

const KEYS: Key[] = [
	{ label: "C", action: "clear", kind: "danger", title: "Clear" },
	{ label: "(", insert: "(" },
	{ label: ")", insert: ")" },
	{ label: "%", insert: "%", title: "Percent" },
	{ label: "⌫", action: "backspace", title: "Backspace" },
	{ label: "sin", insert: "sin(", kind: "fn" },
	{ label: "cos", insert: "cos(", kind: "fn" },
	{ label: "tan", insert: "tan(", kind: "fn" },
	{ label: "π", insert: "pi", kind: "fn" },
	{ label: "÷", insert: "/", kind: "op" },
	{ label: "asin", insert: "asin(", kind: "fn" },
	{ label: "acos", insert: "acos(", kind: "fn" },
	{ label: "atan", insert: "atan(", kind: "fn" },
	{ label: "e", insert: "e", kind: "fn" },
	{ label: "×", insert: "*", kind: "op" },
	{ label: "x²", insert: "^2", kind: "fn" },
	{ label: "√", insert: "sqrt(", kind: "fn" },
	{ label: "xʸ", insert: "^", kind: "fn" },
	{ label: "ʸ√x", insert: "nthRoot(", kind: "fn", title: "nthRoot(x, y)" },
	{ label: "−", insert: "-", kind: "op" },
	{ label: "log", insert: "log10(", kind: "fn", title: "Base-10 logarithm" },
	{ label: "ln", insert: "log(", kind: "fn", title: "Natural logarithm" },
	{ label: "!", insert: "!", kind: "fn", title: "Factorial" },
	{ label: "|x|", insert: "abs(", kind: "fn" },
	{ label: "+", insert: "+", kind: "op" },
	{ label: "7", insert: "7", kind: "num" },
	{ label: "8", insert: "8", kind: "num" },
	{ label: "9", insert: "9", kind: "num" },
	{ label: "10ˣ", insert: "10^", kind: "fn" },
	{ label: "eˣ", insert: "exp(", kind: "fn" },
	{ label: "4", insert: "4", kind: "num" },
	{ label: "5", insert: "5", kind: "num" },
	{ label: "6", insert: "6", kind: "num" },
	{ label: "mod", insert: " mod ", kind: "fn" },
	{ label: "Ans", action: "ans", kind: "fn", title: "Last result" },
	{ label: "1", insert: "1", kind: "num" },
	{ label: "2", insert: "2", kind: "num" },
	{ label: "3", insert: "3", kind: "num" },
	{ label: "EE", insert: "e", kind: "fn", title: "Exponent, e.g. 6.02e23" },
	{ label: "=", action: "evaluate", kind: "accent", span: 1 },
	{ label: "0", insert: "0", kind: "num", span: 2 },
	{ label: ".", insert: ".", kind: "num" },
	{ label: "±", action: "negate", kind: "fn", title: "Negate expression" },
];

const CONSTANTS: { label: string; insert: string; title: string }[] = [
	{ label: "π", insert: "pi", title: "Pi" },
	{ label: "τ", insert: "tau", title: "Tau (2π)" },
	{ label: "e", insert: "e", title: "Euler's number" },
	{ label: "φ", insert: "phi", title: "Golden ratio" },
	{ label: "c", insert: "speedOfLight", title: "Speed of light (m/s)" },
	{ label: "G", insert: "gravitationConstant", title: "Gravitational constant" },
	{ label: "g", insert: "9.80665", title: "Standard gravity (m/s²)" },
	{ label: "h", insert: "planckConstant", title: "Planck constant" },
	{ label: "Nₐ", insert: "avogadro", title: "Avogadro's number" },
	{ label: "k", insert: "boltzmann", title: "Boltzmann constant" },
];

const DEG = Math.PI / 180;

/** Scope overrides so trig works in degrees for plain numbers; units still go through mathjs. */
function degreeScope(math: MathJsModule): Record<string, unknown> {
	const wrap = (name: "sin" | "cos" | "tan", fn: (x: number) => number) => (x: unknown) =>
		typeof x === "number" ? fn(x * DEG) : (math[name] as (v: unknown) => unknown)(x);
	const inv = (name: "asin" | "acos" | "atan", fn: (x: number) => number) => (x: unknown) =>
		typeof x === "number" ? fn(x) / DEG : (math[name] as (v: unknown) => unknown)(x);
	return {
		sin: wrap("sin", Math.sin),
		cos: wrap("cos", Math.cos),
		tan: wrap("tan", Math.tan),
		asin: inv("asin", Math.asin),
		acos: inv("acos", Math.acos),
		atan: inv("atan", Math.atan),
	};
}

export default function MathExpressionEvaluator() {
	const [expression, setExpression] = useState("");
	const [result, setResult] = useState<string>("");
	const [error, setError] = useState<string | null>(null);
	const [history, setHistory] = useState<HistoryEntry[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [angleMode, setAngleMode] = useState<AngleMode>("deg");
	const [showConstants, setShowConstants] = useState(false);
	const mathRef = useRef<MathJsModule | null>(null);
	const textareaRef = useRef<HTMLTextAreaElement | null>(null);
	const lastResultRef = useRef<string>("");
	const { copy, isCopied } = useClipboard();

	const formatResult = useCallback((value: unknown, math: MathJsModule): string => {
		if (value === undefined || value === null) return "";
		if (typeof value === "number" || typeof value === "bigint") return String(value);
		if (typeof value === "string") return value;
		if (typeof value === "boolean") return String(value);
		try {
			return math.format(value, { precision: 14 });
		} catch {
			return String(value);
		}
	}, []);

	const evaluateExpression = useCallback(
		async (exprRaw: string) => {
			const expr = exprRaw.trim();
			if (!expr) return;

			setIsLoading(true);
			try {
				if (!mathRef.current) {
					mathRef.current = await import("mathjs");
				}
				const math = mathRef.current;
				const scope: Record<string, unknown> = angleMode === "deg" ? degreeScope(math) : {};
				if (lastResultRef.current) {
					try {
						scope.Ans = math.evaluate(lastResultRef.current);
					} catch {
						/* previous result not re-evaluable */
					}
				}
				const value = math.evaluate(expr, scope);
				const formatted = formatResult(value, math);
				setResult(formatted);
				setError(null);
				lastResultRef.current = formatted;
				setHistory((prev) => {
					const next: HistoryEntry = {
						id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
						expression: expr,
						result: formatted,
						error: false,
					};
					return [next, ...prev].slice(0, MAX_HISTORY);
				});
			} catch (err) {
				const message = err instanceof Error ? err.message : "Invalid expression";
				setError(message);
				setResult("");
				setHistory((prev) => {
					const next: HistoryEntry = {
						id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
						expression: expr,
						result: message,
						error: true,
					};
					return [next, ...prev].slice(0, MAX_HISTORY);
				});
			} finally {
				setIsLoading(false);
			}
		},
		[formatResult, angleMode]
	);

	useEffect(() => {
		// Pre-warm import on idle so first evaluation feels snappier
		const idle = (window as Window & {
			requestIdleCallback?: (cb: () => void) => number;
		}).requestIdleCallback;
		const handle = idle
			? idle(() => {
					import("mathjs").then((m) => {
						mathRef.current = m;
					});
				})
			: window.setTimeout(() => {
					import("mathjs").then((m) => {
						mathRef.current = m;
					});
				}, 800);
		return () => {
			if (!idle && typeof handle === "number") window.clearTimeout(handle);
		};
	}, []);

	/** Insert text at the caret, keeping focus in the textarea. */
	const insertAtCursor = (text: string) => {
		const ta = textareaRef.current;
		if (!ta) {
			setExpression((prev) => prev + text);
			return;
		}
		const start = ta.selectionStart ?? expression.length;
		const end = ta.selectionEnd ?? start;
		const next = expression.slice(0, start) + text + expression.slice(end);
		setExpression(next);
		requestAnimationFrame(() => {
			ta.focus();
			const pos = start + text.length;
			ta.setSelectionRange(pos, pos);
		});
	};

	const handleKey = (key: Key) => {
		switch (key.action) {
			case "clear":
				handleClear();
				textareaRef.current?.focus();
				return;
			case "backspace": {
				const ta = textareaRef.current;
				const start = ta?.selectionStart ?? expression.length;
				const end = ta?.selectionEnd ?? start;
				if (start === end && start === 0) return;
				const from = start === end ? start - 1 : start;
				setExpression(expression.slice(0, from) + expression.slice(end));
				requestAnimationFrame(() => {
					ta?.focus();
					ta?.setSelectionRange(from, from);
				});
				return;
			}
			case "evaluate":
				void evaluateExpression(expression);
				return;
			case "negate":
				setExpression((prev) => (prev.trim() ? `-(${prev.trim()})` : "-"));
				return;
			case "ans":
				insertAtCursor("Ans");
				return;
		}
		if (key.insert !== undefined) insertAtCursor(key.insert);
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			void evaluateExpression(expression);
		} else if (e.key === "Escape") {
			e.preventDefault();
			handleClear();
		}
	};

	const handleHistoryClick = (entry: HistoryEntry) => {
		setExpression(entry.expression);
		setError(null);
		setResult(entry.error ? "" : entry.result);
		textareaRef.current?.focus();
	};

	const handleClear = () => {
		setExpression("");
		setResult("");
		setError(null);
	};

	const handleClearHistory = () => setHistory([]);

	return (
		<div className={styles.container}>
			<div className={styles.calculator}>
				{/* Display */}
				<div className={styles.display}>
					<div className={styles.displayBar}>
						<SegmentedControl<AngleMode>
							label="Angle mode"
							size="sm"
							fill={false}
							value={angleMode}
							onChange={setAngleMode}
							options={[
								{ value: "deg", label: "DEG" },
								{ value: "rad", label: "RAD" },
							]}
						/>
						<div className="flex gap-2">
							<button type="button" className={`${styles.btnSecondary} ${showConstants ? styles.active : ""}`} onClick={() => setShowConstants((v) => !v)} aria-expanded={showConstants}>
								Const
							</button>
							<button
								type="button"
								onClick={() => copy(result, "result")}
								className={`${styles.btnSecondary} ${isCopied("result") ? styles.copied : ""}`}
								disabled={!result}
							>
								{isCopied("result") ? <CheckIcon className="w-4 h-4" /> : <ClipboardDocumentIcon className="w-4 h-4" />}
								{isCopied("result") ? "Copied" : "Copy"}
							</button>
						</div>
					</div>
					{showConstants && (
						<div className={styles.constants}>
							{CONSTANTS.map((c) => (
								<button key={c.insert} type="button" className={styles.constBtn} onClick={() => insertAtCursor(c.insert)} title={c.title}>
									<span>{c.label}</span>
									<small>{c.insert}</small>
								</button>
							))}
						</div>
					)}
					<label htmlFor="math-expression" className="sr-only">
						Math expression
					</label>
					<textarea
						id="math-expression"
						ref={textareaRef}
						value={expression}
						onChange={(e) => setExpression(e.target.value)}
						onKeyDown={handleKeyDown}
						placeholder="0"
						className={styles.textarea}
						spellCheck={false}
						rows={2}
						autoComplete="off"
					/>
					<div className={`${styles.resultLine} ${error ? styles.resultError : ""}`} aria-live="polite">
						{error ?? (result ? `= ${result}` : "")}
					</div>
				</div>

				{/* Keypad */}
				<div className={styles.keypad}>
					{KEYS.map((key) => (
						<button
							key={key.label}
							type="button"
							className={`${styles.key} ${key.kind ? styles[`key-${key.kind}`] ?? "" : ""}`}
							style={key.span ? { gridColumn: `span ${key.span}` } : undefined}
							onClick={() => handleKey(key)}
							title={key.title}
							disabled={key.action === "evaluate" && (isLoading || !expression.trim())}
						>
							{key.label}
						</button>
					))}
				</div>
				<p className={styles.kbdHint}>
					Keyboard works too: type any expression, <kbd className={styles.kbd}>Enter</kbd> evaluates,{" "}
					<kbd className={styles.kbd}>Shift+Enter</kbd> adds a line, <kbd className={styles.kbd}>Esc</kbd> clears.
				</p>
			</div>

			<div className={`mt-4 ${styles.glassCard}`}>
				<div className="flex justify-between items-center mb-4 flex-wrap gap-3">
					<div>
						<h3 className={`text-lg font-semibold m-0 ${styles.cardTitle}`}>History</h3>
						<p className={`text-xs mt-1 m-0 ${styles.cardSubtitle}`}>
							Last {MAX_HISTORY} evaluations. Click an entry to load it back. <code>Ans</code> holds the latest result.
						</p>
					</div>
					{history.length > 0 && (
						<button onClick={handleClearHistory} className={styles.btnSecondary}>
							<TrashIcon className="w-4 h-4" />
							Clear history
						</button>
					)}
				</div>

				{history.length === 0 ? (
					<p className={`text-sm m-0 ${styles.cardSubtitle}`}>No evaluations yet.</p>
				) : (
					<ul className={styles.historyList}>
						{history.map((entry) => (
							<li key={entry.id}>
								<button type="button" onClick={() => handleHistoryClick(entry)} className={styles.historyItem} title="Load this expression">
									<span className={styles.historyExpr}>{entry.expression}</span>
									<span className={entry.error ? styles.historyResultError : styles.historyResult}>
										{entry.error ? "Error: " : "= "}
										{entry.result}
									</span>
									<ArrowUturnLeftIcon className={styles.historyIcon} />
								</button>
							</li>
						))}
					</ul>
				)}
			</div>

			<div className={`mt-6 ${styles.glassCard}`}>
				<h3 className={`text-lg font-semibold mb-4 m-0 ${styles.cardTitle}`}>About this calculator</h3>
				<div className={`grid grid-cols-2 gap-6 ${styles.infoGrid}`}>
					<div>
						<h4 className={`font-semibold mb-2 m-0 ${styles.infoSubtitle}`}>Powered by mathjs</h4>
						<p className={`text-sm leading-relaxed m-0 ${styles.infoText}`}>
							Expressions are parsed with the <code>mathjs</code> library, never with JavaScript&apos;s <code>eval</code>.
							In DEG mode, <code>sin</code>, <code>cos</code>, <code>tan</code> and their inverses use degrees for plain
							numbers; explicit units like <code>sin(45 deg)</code> always work.
						</p>
					</div>
					<div>
						<h4 className={`font-semibold mb-2 m-0 ${styles.infoSubtitle}`}>What you can do</h4>
						<ul className={`list-disc pl-5 m-0 ${styles.infoList}`}>
							<li>Arithmetic, parentheses, variables, functions</li>
							<li>Trig, logs, exponentials, factorials, <code>nthRoot(x, n)</code></li>
							<li>Units, e.g. <code>5 cm + 2 inch to mm</code></li>
							<li>Bignumbers, complex numbers, matrices</li>
						</ul>
					</div>
				</div>
			</div>
		</div>
	);
}
