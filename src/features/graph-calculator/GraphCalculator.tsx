"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PlusIcon, XMarkIcon, EyeIcon, EyeSlashIcon, MagnifyingGlassMinusIcon, MagnifyingGlassPlusIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import styles from "./GraphCalculator.module.scss";

type MathJsModule = typeof import("mathjs");
type Compiled = { evaluate: (scope: Record<string, number>) => unknown };

interface FunctionEntry {
	id: string;
	expr: string;
	color: string;
	visible: boolean;
}

interface Range {
	xMin: number;
	xMax: number;
	yMin: number;
	yMax: number;
}

const COLORS = ["#e2447a", "#3b82f6", "#22c55e", "#f59e0b", "#a855f7", "#14b8a6"];
const W = 800;
const H = 500;
const SAMPLES = 700;

const PRESETS: { id: string; label: string; title: string; range: Range | "square" }[] = [
	{ id: "standard", label: "ZStandard", title: "−10…10 on both axes", range: { xMin: -10, xMax: 10, yMin: -10, yMax: 10 } },
	{ id: "trig", label: "ZTrig", title: "−2π…2π by −4…4", range: { xMin: -2 * Math.PI, xMax: 2 * Math.PI, yMin: -4, yMax: 4 } },
	{ id: "decimal", label: "ZDecimal", title: "−4.7…4.7 by −3.1…3.1", range: { xMin: -4.7, xMax: 4.7, yMin: -3.1, yMax: 3.1 } },
	{ id: "square", label: "ZSquare", title: "Equal scale on both axes", range: "square" },
];

const EXAMPLES = ["x^2", "sin(x)", "sqrt(x)", "log(x)", "abs(x)", "2*x + 1", "exp(x)", "tan(x)", "1/x", "floor(x)"];

const DEFAULT_RANGE: Range = { xMin: -10, xMax: 10, yMin: -10, yMax: 10 };

function niceStep(span: number): number {
	const raw = span / 10;
	const mag = Math.pow(10, Math.floor(Math.log10(raw)));
	const norm = raw / mag;
	const nice = norm < 1.5 ? 1 : norm < 3.5 ? 2 : norm < 7.5 ? 5 : 10;
	return nice * mag;
}

function fmt(n: number): string {
	if (Math.abs(n) < 1e-9) return "0";
	const abs = Math.abs(n);
	if (abs >= 1e6 || abs < 1e-4) return n.toExponential(2);
	return String(Number(n.toPrecision(6)));
}

function uid() {
	return Math.random().toString(36).slice(2, 9);
}

export default function GraphCalculator() {
	const [functions, setFunctions] = useState<FunctionEntry[]>([
		{ id: uid(), expr: "sin(x)", color: COLORS[0], visible: true },
		{ id: uid(), expr: "x^2 / 10", color: COLORS[1], visible: true },
	]);
	const [range, setRange] = useState<Range>(DEFAULT_RANGE);
	const [rangeDraft, setRangeDraft] = useState<Record<keyof Range, string>>({ xMin: "-10", xMax: "10", yMin: "-10", yMax: "10" });
	const [traceX, setTraceX] = useState("1");
	const [hover, setHover] = useState<number | null>(null);
	const [math, setMath] = useState<MathJsModule | null>(null);
	const svgRef = useRef<SVGSVGElement>(null);

	useEffect(() => {
		let cancelled = false;
		import("mathjs").then((m) => {
			if (!cancelled) setMath(m);
		});
		return () => {
			cancelled = true;
		};
	}, []);

	const compiled = useMemo(() => {
		if (!math) return new Map<string, { fn: Compiled | null; error: string | null }>();
		const map = new Map<string, { fn: Compiled | null; error: string | null }>();
		for (const f of functions) {
			if (!f.expr.trim()) {
				map.set(f.id, { fn: null, error: null });
				continue;
			}
			try {
				map.set(f.id, { fn: math.compile(f.expr), error: null });
			} catch (err) {
				map.set(f.id, { fn: null, error: err instanceof Error ? err.message : "Invalid expression" });
			}
		}
		return map;
	}, [functions, math]);

	const evalAt = (fn: Compiled, x: number): number => {
		try {
			const v = fn.evaluate({ x });
			return typeof v === "number" && Number.isFinite(v) ? v : NaN;
		} catch {
			return NaN;
		}
	};

	const toPx = (x: number) => ((x - range.xMin) / (range.xMax - range.xMin)) * W;
	const toPy = (y: number) => H - ((y - range.yMin) / (range.yMax - range.yMin)) * H;
	const fromPx = (px: number) => range.xMin + (px / W) * (range.xMax - range.xMin);

	const paths = useMemo(() => {
		const ySpan = range.yMax - range.yMin;
		return functions
			.filter((f) => f.visible)
			.map((f) => {
				const c = compiled.get(f.id);
				if (!c?.fn) return { id: f.id, d: "", color: f.color };
				let d = "";
				let prevY: number | null = null;
				let penDown = false;
				for (let i = 0; i <= SAMPLES; i++) {
					const x = range.xMin + (i / SAMPLES) * (range.xMax - range.xMin);
					const y = evalAt(c.fn, x);
					if (Number.isNaN(y) || Math.abs(y) > 1e12) {
						penDown = false;
						prevY = null;
						continue;
					}
					// Break the line on asymptotes: a jump far bigger than the visible span
					if (prevY !== null && Math.abs(y - prevY) > ySpan * 3) penDown = false;
					const px = toPx(x);
					const py = Math.max(-H, Math.min(2 * H, toPy(y)));
					d += `${penDown ? "L" : "M"}${px.toFixed(1)},${py.toFixed(1)}`;
					penDown = true;
					prevY = y;
				}
				return { id: f.id, d, color: f.color };
			});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [functions, compiled, range]);

	const gridX = useMemo(() => {
		const step = niceStep(range.xMax - range.xMin);
		const lines: number[] = [];
		for (let v = Math.ceil(range.xMin / step) * step; v <= range.xMax; v += step) lines.push(Number(v.toFixed(10)));
		return lines;
	}, [range]);
	const gridY = useMemo(() => {
		const step = niceStep(range.yMax - range.yMin);
		const lines: number[] = [];
		for (let v = Math.ceil(range.yMin / step) * step; v <= range.yMax; v += step) lines.push(Number(v.toFixed(10)));
		return lines;
	}, [range]);

	const applyRange = (next: Range) => {
		if (next.xMax <= next.xMin || next.yMax <= next.yMin) return;
		setRange(next);
		setRangeDraft({ xMin: fmt(next.xMin), xMax: fmt(next.xMax), yMin: fmt(next.yMin), yMax: fmt(next.yMax) });
	};

	const handleRangeInput = (key: keyof Range, text: string) => {
		const draft = { ...rangeDraft, [key]: text };
		setRangeDraft(draft);
		const parsed = {
			xMin: parseFloat(draft.xMin),
			xMax: parseFloat(draft.xMax),
			yMin: parseFloat(draft.yMin),
			yMax: parseFloat(draft.yMax),
		};
		if (Object.values(parsed).every(Number.isFinite) && parsed.xMax > parsed.xMin && parsed.yMax > parsed.yMin) setRange(parsed);
	};

	const zoom = (factor: number) => {
		const cx = (range.xMin + range.xMax) / 2;
		const cy = (range.yMin + range.yMax) / 2;
		const hx = ((range.xMax - range.xMin) / 2) * factor;
		const hy = ((range.yMax - range.yMin) / 2) * factor;
		applyRange({ xMin: cx - hx, xMax: cx + hx, yMin: cy - hy, yMax: cy + hy });
	};

	const applyPreset = (preset: (typeof PRESETS)[number]) => {
		if (preset.range === "square") {
			const cx = (range.xMin + range.xMax) / 2;
			const cy = (range.yMin + range.yMax) / 2;
			const hx = (range.xMax - range.xMin) / 2;
			const hy = (hx * H) / W;
			applyRange({ xMin: cx - hx, xMax: cx + hx, yMin: cy - hy, yMax: cy + hy });
		} else {
			applyRange(preset.range);
		}
	};

	const updateFunction = (id: string, patch: Partial<FunctionEntry>) =>
		setFunctions((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));

	const addFunction = () =>
		setFunctions((prev) => [...prev, { id: uid(), expr: "", color: COLORS[prev.length % COLORS.length], visible: true }]);

	const removeFunction = (id: string) => setFunctions((prev) => prev.filter((f) => f.id !== id));

	const traceValue = parseFloat(traceX);
	const traceXNum = Number.isFinite(traceValue) ? traceValue : null;
	const probeX = hover ?? traceXNum;

	const probe = useMemo(() => {
		if (probeX === null) return [];
		return functions
			.filter((f) => f.visible && f.expr.trim())
			.map((f) => {
				const c = compiled.get(f.id);
				return { id: f.id, color: f.color, expr: f.expr, y: c?.fn ? evalAt(c.fn, probeX) : NaN };
			});
	}, [probeX, functions, compiled]);

	const handlePointer = (e: React.PointerEvent<SVGSVGElement>) => {
		const rect = svgRef.current?.getBoundingClientRect();
		if (!rect) return;
		const px = ((e.clientX - rect.left) / rect.width) * W;
		setHover(fromPx(px));
	};

	return (
		<div className={styles.container}>
			<div className={styles.layout}>
				{/* Sidebar */}
				<div className={styles.sidebar}>
					<div className={styles.glassCard}>
						<h3 className={styles.cardTitle}>Functions</h3>
						<div className="flex flex-col gap-2">
							{functions.map((f, i) => {
								const c = compiled.get(f.id);
								return (
									<div key={f.id} className={styles.fnRow}>
										<div className={styles.fnLine}>
											<button
												type="button"
												className={styles.swatch}
												style={{ background: f.visible ? f.color : "transparent", borderColor: f.color }}
												onClick={() => updateFunction(f.id, { visible: !f.visible })}
												aria-label={f.visible ? `Hide function ${i + 1}` : `Show function ${i + 1}`}
												title={f.visible ? "Hide" : "Show"}
											>
												{f.visible ? <EyeIcon className="w-3 h-3" /> : <EyeSlashIcon className="w-3 h-3" />}
											</button>
											<label htmlFor={`fn-${f.id}`} className={styles.fnLabel}>
												y<sub>{i + 1}</sub> =
											</label>
											<input
												id={`fn-${f.id}`}
												type="text"
												value={f.expr}
												onChange={(e) => updateFunction(f.id, { expr: e.target.value })}
												className={`${styles.fnInput} ${c?.error ? styles.invalid : ""}`}
												placeholder="e.g. sin(x)"
												spellCheck={false}
												autoComplete="off"
											/>
											<button type="button" className={styles.iconBtn} onClick={() => removeFunction(f.id)} aria-label={`Remove function ${i + 1}`} disabled={functions.length === 1}>
												<XMarkIcon className="w-4 h-4" />
											</button>
										</div>
										{c?.error && <span className={styles.errorText}>{c.error}</span>}
									</div>
								);
							})}
						</div>
						<button type="button" className={styles.btnSecondary} onClick={addFunction} disabled={functions.length >= COLORS.length}>
							<PlusIcon className="w-4 h-4" />
							Add function
						</button>
					</div>

					<div className={styles.glassCard}>
						<h3 className={styles.cardTitle}>View</h3>
						<div className={styles.rangeGrid}>
							{(
								[
									["xMin", "X min"],
									["xMax", "X max"],
									["yMin", "Y min"],
									["yMax", "Y max"],
								] as [keyof Range, string][]
							).map(([key, label]) => (
								<label key={key} className={styles.rangeField}>
									<span>{label}</span>
									<input type="text" inputMode="decimal" value={rangeDraft[key]} onChange={(e) => handleRangeInput(key, e.target.value)} className={styles.rangeInput} />
								</label>
							))}
						</div>
						<div className="flex flex-wrap gap-1.5 mt-3">
							{PRESETS.map((p) => (
								<button key={p.id} type="button" className={styles.chip} onClick={() => applyPreset(p)} title={p.title}>
									{p.label}
								</button>
							))}
							<button type="button" className={styles.chip} onClick={() => zoom(0.5)} title="Zoom in">
								<MagnifyingGlassPlusIcon className="w-4 h-4" />
							</button>
							<button type="button" className={styles.chip} onClick={() => zoom(2)} title="Zoom out">
								<MagnifyingGlassMinusIcon className="w-4 h-4" />
							</button>
							<button type="button" className={styles.chip} onClick={() => applyRange(DEFAULT_RANGE)} title="Reset">
								<ArrowPathIcon className="w-4 h-4" />
							</button>
						</div>
					</div>

					<div className={styles.glassCard}>
						<h3 className={styles.cardTitle}>Trace</h3>
						<label className={styles.rangeField}>
							<span>x =</span>
							<input type="text" inputMode="decimal" value={traceX} onChange={(e) => setTraceX(e.target.value)} className={styles.rangeInput} />
						</label>
						{probe.length > 0 && (
							<ul className={styles.traceList}>
								<li className={styles.traceHead}>{hover !== null ? "Hover" : "Trace"} at x = {probeX !== null ? fmt(probeX) : "—"}</li>
								{probe.map((p) => (
									<li key={p.id}>
										<span className={styles.traceDot} style={{ background: p.color }} />
										<span className={styles.traceExpr}>{p.expr}</span>
										<span className={styles.traceVal}>{Number.isNaN(p.y) ? "undefined" : fmt(p.y)}</span>
									</li>
								))}
							</ul>
						)}
					</div>

					<div className={styles.glassCard}>
						<h3 className={styles.cardTitle}>Syntax examples</h3>
						<div className="flex flex-wrap gap-1.5">
							{EXAMPLES.map((ex) => (
								<button
									key={ex}
									type="button"
									className={styles.chip}
									onClick={() => {
										const empty = functions.find((f) => !f.expr.trim());
										if (empty) updateFunction(empty.id, { expr: ex });
										else if (functions.length < COLORS.length) setFunctions((prev) => [...prev, { id: uid(), expr: ex, color: COLORS[prev.length % COLORS.length], visible: true }]);
										else updateFunction(functions[functions.length - 1].id, { expr: ex });
									}}
								>
									{ex}
								</button>
							))}
						</div>
					</div>
				</div>

				{/* Plot */}
				<div className={styles.plotCard}>
					<svg
						ref={svgRef}
						viewBox={`0 0 ${W} ${H}`}
						className={styles.plot}
						role="img"
						aria-label="Function plot"
						onPointerMove={handlePointer}
						onPointerLeave={() => setHover(null)}
					>
						<rect x="0" y="0" width={W} height={H} className={styles.plotBg} />
						{gridX.map((v) => (
							<line key={`gx${v}`} x1={toPx(v)} x2={toPx(v)} y1={0} y2={H} className={styles.grid} />
						))}
						{gridY.map((v) => (
							<line key={`gy${v}`} x1={0} x2={W} y1={toPy(v)} y2={toPy(v)} className={styles.grid} />
						))}
						{range.yMin <= 0 && range.yMax >= 0 && <line x1={0} x2={W} y1={toPy(0)} y2={toPy(0)} className={styles.axis} />}
						{range.xMin <= 0 && range.xMax >= 0 && <line x1={toPx(0)} x2={toPx(0)} y1={0} y2={H} className={styles.axis} />}
						{gridX.map((v) =>
							v !== 0 ? (
								<text key={`lx${v}`} x={toPx(v)} y={Math.min(H - 6, Math.max(14, toPy(0) + 14))} className={styles.tick} textAnchor="middle">
									{fmt(v)}
								</text>
							) : null
						)}
						{gridY.map((v) =>
							v !== 0 ? (
								<text key={`ly${v}`} x={Math.min(W - 6, Math.max(6, toPx(0) + 6))} y={toPy(v) - 3} className={styles.tick}>
									{fmt(v)}
								</text>
							) : null
						)}
						{paths.map((p) => (
							<path key={p.id} d={p.d} fill="none" stroke={p.color} strokeWidth={2.25} strokeLinejoin="round" strokeLinecap="round" />
						))}
						{probeX !== null && probeX >= range.xMin && probeX <= range.xMax && (
							<>
								<line x1={toPx(probeX)} x2={toPx(probeX)} y1={0} y2={H} className={styles.probeLine} />
								{probe.map((p) =>
									Number.isNaN(p.y) || p.y < range.yMin || p.y > range.yMax ? null : (
										<circle key={p.id} cx={toPx(probeX)} cy={toPy(p.y)} r={5} fill={p.color} className={styles.probeDot} />
									)
								)}
							</>
						)}
					</svg>
					{!math && <div className={styles.loading}>Loading math engine…</div>}
				</div>
			</div>
		</div>
	);
}
