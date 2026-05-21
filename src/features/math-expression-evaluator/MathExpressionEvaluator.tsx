"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
	ClipboardDocumentIcon,
	CheckIcon,
	TrashIcon,
	PlayIcon,
	ArrowUturnLeftIcon,
} from "@heroicons/react/24/outline";
import styles from "./MathExpressionEvaluator.module.scss";
import { useClipboard } from "@/hooks/useClipboard";

type HistoryEntry = {
	id: string;
	expression: string;
	result: string;
	error: boolean;
};

const MAX_HISTORY = 20;

type MathJsModule = typeof import("mathjs");

export default function MathExpressionEvaluator() {
	const [expression, setExpression] = useState("");
	const [result, setResult] = useState<string>("");
	const [error, setError] = useState<string | null>(null);
	const [history, setHistory] = useState<HistoryEntry[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const mathRef = useRef<MathJsModule | null>(null);
	const textareaRef = useRef<HTMLTextAreaElement | null>(null);
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
				const value = math.evaluate(expr);
				const formatted = formatResult(value, math);
				setResult(formatted);
				setError(null);
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
		[formatResult]
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

	const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			void evaluateExpression(expression);
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
			<div className={styles.glassCard}>
				<div className="flex justify-between items-center mb-4 flex-wrap gap-3">
					<div>
						<h3 className={`text-lg font-semibold m-0 ${styles.cardTitle}`}>
							Expression
						</h3>
						<p className={`text-xs mt-1 m-0 ${styles.cardSubtitle}`}>
							Press <kbd className={styles.kbd}>Enter</kbd> to evaluate.
							Use <kbd className={styles.kbd}>Shift+Enter</kbd> for a new line.
						</p>
					</div>
					<div className="flex gap-2">
						<button
							onClick={handleClear}
							className={styles.btnSecondary}
							disabled={!expression && !result && !error}
						>
							<TrashIcon className="w-4 h-4" />
							Clear
						</button>
						<button
							onClick={() => void evaluateExpression(expression)}
							className={styles.btnPrimary}
							disabled={!expression.trim() || isLoading}
						>
							<PlayIcon className="w-4 h-4" />
							{isLoading ? "Evaluating..." : "Evaluate"}
						</button>
					</div>
				</div>

				<label htmlFor="math-expression" className="sr-only">
					Math expression
				</label>
				<textarea
					id="math-expression"
					ref={textareaRef}
					value={expression}
					onChange={(e) => setExpression(e.target.value)}
					onKeyDown={handleKeyDown}
					placeholder="e.g. sqrt(2) * sin(45 deg) + log(100, 10)"
					className={styles.textarea}
					spellCheck={false}
					rows={4}
				/>
			</div>

			{error && (
				<div className={`mt-4 px-4 py-3 rounded-lg text-sm ${styles.errorBox}`}>
					{error}
				</div>
			)}

			{result && !error && (
				<div className={`mt-4 ${styles.glassCard}`}>
					<div className="flex justify-between items-center mb-3 flex-wrap gap-3">
						<h3 className={`text-lg font-semibold m-0 ${styles.cardTitle}`}>
							Result
						</h3>
						<button
							onClick={() => copy(result, "result")}
							className={`${styles.btnPrimary} ${isCopied("result") ? styles.copied : ""}`}
						>
							{isCopied("result") ? (
								<>
									<CheckIcon className="w-4 h-4" />
									Copied!
								</>
							) : (
								<>
									<ClipboardDocumentIcon className="w-4 h-4" />
									Copy
								</>
							)}
						</button>
					</div>
					<div className={styles.resultBox}>{result}</div>
				</div>
			)}

			<div className={`mt-4 ${styles.glassCard}`}>
				<div className="flex justify-between items-center mb-4 flex-wrap gap-3">
					<div>
						<h3 className={`text-lg font-semibold m-0 ${styles.cardTitle}`}>
							History
						</h3>
						<p className={`text-xs mt-1 m-0 ${styles.cardSubtitle}`}>
							Last {MAX_HISTORY} evaluations. Click an entry to load it back.
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
					<p className={`text-sm m-0 ${styles.cardSubtitle}`}>
						No evaluations yet.
					</p>
				) : (
					<ul className={styles.historyList}>
						{history.map((entry) => (
							<li key={entry.id}>
								<button
									type="button"
									onClick={() => handleHistoryClick(entry)}
									className={styles.historyItem}
									title="Load this expression"
								>
									<span className={styles.historyExpr}>{entry.expression}</span>
									<span
										className={
											entry.error
												? styles.historyResultError
												: styles.historyResult
										}
									>
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
				<h3 className={`text-lg font-semibold mb-4 m-0 ${styles.cardTitle}`}>
					About this evaluator
				</h3>
				<div className={`grid grid-cols-2 gap-6 ${styles.infoGrid}`}>
					<div>
						<h4 className={`font-semibold mb-2 m-0 ${styles.infoSubtitle}`}>
							Powered by mathjs
						</h4>
						<p className={`text-sm leading-relaxed m-0 ${styles.infoText}`}>
							Expressions are parsed with the <code>mathjs</code> library — never
							with JavaScript&apos;s <code>eval</code>. The library is lazy-loaded
							on first use to keep the initial bundle small.
						</p>
					</div>
					<div>
						<h4 className={`font-semibold mb-2 m-0 ${styles.infoSubtitle}`}>
							What you can do
						</h4>
						<ul className={`list-disc pl-5 m-0 ${styles.infoList}`}>
							<li>Arithmetic, parentheses, variables, functions</li>
							<li>Trig, logs, exponentials, factorials</li>
							<li>Units, e.g. <code>5 cm + 2 inch to mm</code></li>
							<li>Bignumbers, complex numbers, matrices</li>
						</ul>
					</div>
				</div>
			</div>
		</div>
	);
}
