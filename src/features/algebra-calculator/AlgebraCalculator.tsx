"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ClipboardDocumentIcon, CheckIcon, PlayIcon, TrashIcon } from "@heroicons/react/24/outline";
import SegmentedControl from "@/components/SegmentedControl";
import { useClipboard } from "@/hooks/useClipboard";
import styles from "./AlgebraCalculator.module.scss";

type Operation = "simplify" | "expand" | "factor" | "solve" | "diff" | "integrate";
type Nerdamer = typeof import("nerdamer");

const OPERATIONS: { value: Operation; label: string; title: string; needsVar?: boolean }[] = [
	{ value: "simplify", label: "Simplify", title: "Combine like terms and reduce" },
	{ value: "expand", label: "Expand", title: "Multiply out products and powers" },
	{ value: "factor", label: "Factor", title: "Factor a polynomial" },
	{ value: "solve", label: "Solve", title: "Solve an equation for a variable", needsVar: true },
	{ value: "diff", label: "d/dx", title: "Differentiate with respect to a variable", needsVar: true },
	{ value: "integrate", label: "∫", title: "Integrate with respect to a variable", needsVar: true },
];

const EXAMPLES: { expr: string; op: Operation }[] = [
	{ expr: "(x+1)^2 - x^2", op: "simplify" },
	{ expr: "sin(x)^2 + cos(x)^2", op: "simplify" },
	{ expr: "(a*b)/(a*c)", op: "simplify" },
	{ expr: "(x+2)*(x-3)", op: "expand" },
	{ expr: "x^2 - 5x + 6", op: "factor" },
	{ expr: "x^2 - 4 = 0", op: "solve" },
	{ expr: "x^3 + 2x", op: "diff" },
	{ expr: "x^2 * e^x", op: "integrate" },
];

const SYNTAX: { label: string; code: string }[] = [
	{ label: "Power", code: "x^2" },
	{ label: "Multiply", code: "a*b or 2x" },
	{ label: "Divide", code: "a/b" },
	{ label: "Square root", code: "sqrt(x)" },
	{ label: "Trig", code: "sin(x), cos(x), tan(x)" },
	{ label: "Natural log", code: "log(x)" },
	{ label: "Euler's number", code: "e" },
	{ label: "Pi", code: "pi" },
	{ label: "Absolute", code: "abs(x)" },
	{ label: "Equation", code: "x^2 = 4" },
];

interface Outcome {
	input: string;
	operation: Operation;
	text: string;
	tex: string;
}

export default function AlgebraCalculator() {
	const [operation, setOperation] = useState<Operation>("simplify");
	const [expression, setExpression] = useState("(x+1)^2 - x^2");
	const [variable, setVariable] = useState("x");
	const [outcome, setOutcome] = useState<Outcome | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const engineRef = useRef<Nerdamer | null>(null);
	const { copy, isCopied } = useClipboard();

	const loadEngine = useCallback(async (): Promise<Nerdamer> => {
		if (engineRef.current) return engineRef.current;
		const mod = await import("nerdamer");
		await Promise.all([import("nerdamer/Algebra"), import("nerdamer/Calculus"), import("nerdamer/Solve")]);
		const engine = (mod as unknown as { default?: Nerdamer }).default ?? (mod as unknown as Nerdamer);
		engineRef.current = engine;
		return engine;
	}, []);

	useEffect(() => {
		const t = window.setTimeout(() => void loadEngine(), 600);
		return () => window.clearTimeout(t);
	}, [loadEngine]);

	const opMeta = OPERATIONS.find((o) => o.value === operation)!;

	const calculate = useCallback(async () => {
		const expr = expression.trim();
		if (!expr) return;
		setIsLoading(true);
		setError(null);
		try {
			const nerdamer = await loadEngine();
			const v = (variable.trim() || "x").replace(/[^A-Za-z_]/g, "") || "x";
			let result: { toString(): string; toTeX?(): string };
			switch (operation) {
				case "simplify":
					result = nerdamer(`simplify(${expr})`);
					break;
				case "expand":
					result = nerdamer(`expand(${expr})`);
					break;
				case "factor":
					result = nerdamer(`factor(${expr})`);
					break;
				case "solve": {
					const eq = expr.includes("=") ? expr : `${expr}=0`;
					result = nerdamer(eq).solveFor(v);
					break;
				}
				case "diff":
					result = nerdamer(`diff(${expr}, ${v})`);
					break;
				case "integrate":
					result = nerdamer(`integrate(${expr}, ${v})`);
					break;
			}
			const text = result.toString();
			let tex = "";
			try {
				tex = result.toTeX ? result.toTeX() : nerdamer(text).toTeX();
			} catch {
				tex = "";
			}
			setOutcome({ input: expr, operation, text, tex });
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			setError(message.replace(/^Error:\s*/, "") || "Could not evaluate that expression");
			setOutcome(null);
		} finally {
			setIsLoading(false);
		}
	}, [expression, operation, variable, loadEngine]);

	const loadExample = (ex: (typeof EXAMPLES)[number]) => {
		setExpression(ex.expr);
		setOperation(ex.op);
		setOutcome(null);
		setError(null);
	};

	return (
		<div className={styles.container}>
			<SegmentedControl<Operation>
				label="Operation"
				value={operation}
				onChange={(op) => {
					setOperation(op);
					setOutcome(null);
					setError(null);
				}}
				options={OPERATIONS.map((o) => ({ value: o.value, label: o.label, title: o.title }))}
			/>

			<div className={`mt-4 ${styles.glassCard}`}>
				<div className={styles.inputRow}>
					<div className="flex-1 min-w-0">
						<label htmlFor="algebra-expression" className={styles.label}>
							Expression
						</label>
						<input
							id="algebra-expression"
							type="text"
							value={expression}
							onChange={(e) => setExpression(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === "Enter") void calculate();
							}}
							className={styles.input}
							placeholder={operation === "solve" ? "x^2 - 4 = 0" : "(x+1)^2 - x^2"}
							spellCheck={false}
							autoComplete="off"
						/>
					</div>
					{opMeta.needsVar && (
						<div>
							<label htmlFor="algebra-variable" className={styles.label}>
								{operation === "solve" ? "Solve for" : "Variable"}
							</label>
							<input
								id="algebra-variable"
								type="text"
								value={variable}
								onChange={(e) => setVariable(e.target.value)}
								className={`${styles.input} ${styles.varInput}`}
								maxLength={8}
								spellCheck={false}
								autoComplete="off"
							/>
						</div>
					)}
					<div className="flex gap-2 items-end">
						<button type="button" className={styles.btnSecondary} onClick={() => { setExpression(""); setOutcome(null); setError(null); }} disabled={!expression}>
							<TrashIcon className="w-4 h-4" />
							Clear
						</button>
						<button type="button" className={styles.btnPrimary} onClick={() => void calculate()} disabled={!expression.trim() || isLoading}>
							<PlayIcon className="w-4 h-4" />
							{isLoading ? "Working…" : "Calculate"}
						</button>
					</div>
				</div>

				{error && <p className={styles.error}>{error}</p>}

				{outcome && (
					<div className={styles.result}>
						<div className={styles.resultMeta}>
							<span className={styles.resultLabel}>{OPERATIONS.find((o) => o.value === outcome.operation)?.label}</span>
							<code className={styles.resultInput}>{outcome.input}</code>
						</div>
						<div className={styles.resultLine}>
							<code className={styles.resultText}>{outcome.text}</code>
							<button type="button" className={styles.iconBtn} onClick={() => copy(outcome.text, "text")} aria-label="Copy result">
								{isCopied("text") ? <CheckIcon className="w-4 h-4" /> : <ClipboardDocumentIcon className="w-4 h-4" />}
							</button>
						</div>
						{outcome.tex && (
							<div className={styles.resultLine}>
								<code className={styles.resultTex}>{outcome.tex}</code>
								<button type="button" className={styles.iconBtn} onClick={() => copy(outcome.tex, "tex")} aria-label="Copy LaTeX">
									{isCopied("tex") ? <CheckIcon className="w-4 h-4" /> : <ClipboardDocumentIcon className="w-4 h-4" />}
								</button>
							</div>
						)}
					</div>
				)}
			</div>

			<div className={`grid gap-4 mt-4 md:grid-cols-2`}>
				<div className={styles.glassCard}>
					<h3 className={styles.cardTitle}>Examples</h3>
					<div className="flex flex-wrap gap-1.5">
						{EXAMPLES.map((ex) => (
							<button key={ex.expr} type="button" className={styles.chip} onClick={() => loadExample(ex)} title={OPERATIONS.find((o) => o.value === ex.op)?.label}>
								{ex.expr}
							</button>
						))}
					</div>
				</div>
				<div className={styles.glassCard}>
					<h3 className={styles.cardTitle}>Syntax reference</h3>
					<dl className={styles.syntax}>
						{SYNTAX.map((s) => (
							<div key={s.label}>
								<dt>{s.label}</dt>
								<dd><code>{s.code}</code></dd>
							</div>
						))}
					</dl>
				</div>
			</div>

			<div className={`mt-4 ${styles.glassCard}`}>
				<h3 className={styles.cardTitle}>Notes</h3>
				<ul className={styles.notes}>
					<li>Symbolic work is done by the nerdamer library, loaded on first use. Everything runs in your browser.</li>
					<li>Solve handles polynomials up to the third degree symbolically and falls back to numeric roots for higher degrees. Give it an equation with <code>=</code>, or an expression to set equal to zero.</li>
					<li>Integration is indefinite and omits the constant. Some integrals have no closed form and will come back unevaluated.</li>
					<li>The second line of a result is LaTeX, ready to paste into a document.</li>
				</ul>
			</div>
		</div>
	);
}
