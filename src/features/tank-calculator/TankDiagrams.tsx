"use client";

import { Diagram, DimLine, Label, useDiagramScale } from "@/components/construction/Diagram";
import { inchesToMm } from "@/lib/construction/imperialUtils";
import type { Tank, TankShape, EndStyle, VerticalEnd, DipRow } from "@/lib/construction/tankUtils";
import styles from "./TankDiagrams.module.scss";

const r4 = (n: number) => Math.round(n * 1e4) / 1e4;
type Fmt = { format: (inches: number) => string };

// ── Section with the fill shaded ─────────────────────────────────────────────

export interface TankSectionProps extends Fmt {
	tank: Tank;
	shape: TankShape;
	ends: EndStyle;
	dishDepth: number;
	bottom: VerticalEnd;
	bottomHeight: number;
	top: VerticalEnd;
	topHeight: number;
	fillDepth: number;
}

const BOX = 120;
const PAD = 22;

export function TankSectionDiagram(props: TankSectionProps) {
	const { tank: t, shape, fillDepth, format } = props;
	const { width, height } = extent(props);
	const k = Math.min((BOX - PAD * 2) / inchesToMm(width), (BOX - PAD * 2) / inchesToMm(height));
	const w = inchesToMm(width) * k + PAD * 2;
	const h = inchesToMm(height) * k + PAD * 2;
	return (
		<Diagram widthMm={w} heightMm={h} label={`${shape === "horizontal" ? "End view" : shape === "vertical" ? "Side view" : "Section"} of the tank with the liquid at ${format(Math.min(fillDepth, t.maxDepth))}, ${t.percentFull.toFixed(1)}% full`} maxWidth="480px">
			<SectionScene {...props} k={k} width={width} height={height} />
		</Diagram>
	);
}

function extent({ tank: t, shape }: TankSectionProps): { width: number; height: number } {
	const i = t.inner;
	if (shape === "horizontal") return { width: i.diameter, height: i.diameter };
	if (shape === "vertical") return { width: i.diameter, height: i.height };
	return { width: i.width, height: i.height };
}

function SectionScene({ tank: t, shape, bottom, bottomHeight, top, topHeight, fillDepth, format, k, width, height }: TankSectionProps & { k: number; width: number; height: number }) {
	const { px } = useDiagramScale();
	const X = (inches: number) => r4(PAD + inchesToMm(inches) * k);
	const Y = (inches: number) => r4(PAD + inchesToMm(height - inches) * k);
	const d = Math.min(Math.max(0, fillDepth), t.maxDepth);
	const clipId = `tank-clip-${shape}`;
	let outline: string;
	if (shape === "horizontal") {
		const r = width / 2;
		outline = `M ${X(0)} ${Y(r)} A ${r4(inchesToMm(r) * k)} ${r4(inchesToMm(r) * k)} 0 1 0 ${X(width)} ${Y(r)} A ${r4(inchesToMm(r) * k)} ${r4(inchesToMm(r) * k)} 0 1 0 ${X(0)} ${Y(r)} Z`;
	} else if (shape === "elliptical") {
		const a = width / 2;
		const b = height / 2;
		outline = `M ${X(0)} ${Y(b)} A ${r4(inchesToMm(a) * k)} ${r4(inchesToMm(b) * k)} 0 1 0 ${X(width)} ${Y(b)} A ${r4(inchesToMm(a) * k)} ${r4(inchesToMm(b) * k)} 0 1 0 ${X(0)} ${Y(b)} Z`;
	} else if (shape === "vertical") {
		const hb = bottom === "flat" ? 0 : Math.min(bottomHeight, height);
		const ht = top === "flat" ? 0 : Math.min(topHeight, height - hb);
		const r = width / 2;
		const bottomPath = bottom === "cone" ? `L ${X(r)} ${Y(0)} L ${X(width)} ${Y(hb)}` : bottom === "dome" ? `A ${r4(inchesToMm(r) * k)} ${r4(inchesToMm(hb) * k)} 0 0 0 ${X(width)} ${Y(hb)}` : `L ${X(width)} ${Y(0)}`;
		const topPath = top === "cone" ? `L ${X(r)} ${Y(height)} L ${X(0)} ${Y(height - ht)}` : top === "dome" ? `A ${r4(inchesToMm(r) * k)} ${r4(inchesToMm(ht) * k)} 0 0 0 ${X(0)} ${Y(height - ht)}` : `L ${X(0)} ${Y(height)}`;
		outline = `M ${X(0)} ${Y(hb)} ${bottomPath} L ${X(width)} ${Y(height - ht)} ${topPath} Z`;
	} else {
		outline = `M ${X(0)} ${Y(0)} L ${X(width)} ${Y(0)} L ${X(width)} ${Y(height)} L ${X(0)} ${Y(height)} Z`;
	}
	return (
		<>
			<defs>
				<clipPath id={clipId}>
					<path d={outline} />
				</clipPath>
			</defs>
			<path d={outline} className={styles.shell} />
			<rect x={X(0) - 2} y={Y(d)} width={r4(X(width) - X(0)) + 4} height={r4(Y(0) - Y(d)) + 2} className={styles.liquid} clipPath={`url(#${clipId})`} />
			<path d={outline} className={styles.shellLine} />
			<line x1={X(0) - 6} y1={Y(d)} x2={X(width) + 6} y2={Y(d)} className={styles.level} />
			<DimLine x1={X(width) + px(8)} y1={Y(0)} x2={X(width) + px(8)} y2={Y(d)} label={format(d)} offset={-px(10)} extensions={false} size={9} />
			<DimLine x1={X(0) - px(8)} y1={Y(0)} x2={X(0) - px(8)} y2={Y(height)} label={format(height)} offset={px(10)} extensions={false} size={9} />
			<DimLine x1={X(0)} y1={Y(0) + px(8)} x2={X(width)} y2={Y(0) + px(8)} label={format(width)} offset={px(6)} size={9} />
			<Label x={X(width / 2)} y={r4((Y(0) + Y(Math.max(d, height * 0.08))) / 2)} text={`${t.percentFull.toFixed(1)}%`} size={10} className={styles.pct} />
		</>
	);
}

// ── Volume against depth ─────────────────────────────────────────────────────

export interface DipChartDiagramProps extends Fmt {
	rows: DipRow[];
	unitLabel: string;
	toUnit: (cubicInches: number) => number;
	fillDepth: number;
}

const CW = 180;
const CH = 90;
const CP = { l: 26, r: 10, t: 8, b: 20 };

export function DipChartDiagram({ rows, unitLabel, toUnit, fillDepth, format }: DipChartDiagramProps) {
	if (rows.length < 2) return null;
	const maxD = rows[rows.length - 1].depth;
	const maxV = rows[rows.length - 1].volume;
	const X = (d: number) => r4(CP.l + ((CW - CP.l - CP.r) * d) / maxD);
	const Y = (v: number) => r4(CH - CP.b - ((CH - CP.t - CP.b) * v) / Math.max(maxV, 1e-9));
	const pts = rows.map((r) => `${X(r.depth)},${Y(r.volume)}`).join(" ");
	const fd = Math.min(Math.max(0, fillDepth), maxD);
	return (
		<Diagram widthMm={CW} heightMm={CH} label={`Volume against depth: ${toUnit(maxV).toFixed(1)} ${unitLabel} at ${format(maxD)}`} maxWidth="640px">
			<ChartScene rows={rows} X={X} Y={Y} pts={pts} fd={fd} maxD={maxD} maxV={maxV} unitLabel={unitLabel} toUnit={toUnit} format={format} />
		</Diagram>
	);
}

function ChartScene({ rows, X, Y, pts, fd, maxD, maxV, unitLabel, toUnit, format }: { rows: DipRow[]; X: (d: number) => number; Y: (v: number) => number; pts: string; fd: number; maxD: number; maxV: number; unitLabel: string; toUnit: (n: number) => number } & Fmt) {
	const { px } = useDiagramScale();
	const fv = interpolate(rows, fd);
	return (
		<>
			<line x1={X(0)} y1={Y(0)} x2={X(maxD)} y2={Y(0)} className={styles.axis} />
			<line x1={X(0)} y1={Y(0)} x2={X(0)} y2={Y(maxV)} className={styles.axis} />
			{[0.25, 0.5, 0.75, 1].map((f) => (
				<g key={f}>
					<line x1={X(0)} y1={Y(maxV * f)} x2={X(maxD)} y2={Y(maxV * f)} className={styles.grid} />
					<Label x={X(0) - px(3)} y={Y(maxV * f) + px(3)} text={toUnit(maxV * f).toFixed(0)} size={7} anchor="end" />
				</g>
			))}
			<polyline points={pts} className={styles.curve} />
			<line x1={X(fd)} y1={Y(0)} x2={X(fd)} y2={Y(fv)} className={styles.marker} />
			<line x1={X(0)} y1={Y(fv)} x2={X(fd)} y2={Y(fv)} className={styles.marker} />
			<circle cx={X(fd)} cy={Y(fv)} r={1.4} className={styles.dot} />
			<Label x={X(maxD / 2)} y={Y(0) + px(14)} text={`depth, ${format(maxD)} full`} size={8} />
			<Label x={X(0) - px(3)} y={Y(maxV) - px(4)} text={unitLabel} size={7} anchor="end" />
			<Label x={X(fd) + px(4)} y={Y(fv) - px(4)} text={`${format(fd)}: ${toUnit(fv).toFixed(1)}`} size={8} anchor={fd > maxD * 0.6 ? "end" : "start"} className={styles.pct} />
		</>
	);
}

function interpolate(rows: DipRow[], d: number): number {
	for (let i = 1; i < rows.length; i++) {
		if (d <= rows[i].depth) {
			const a = rows[i - 1];
			const b = rows[i];
			const f = b.depth === a.depth ? 0 : (d - a.depth) / (b.depth - a.depth);
			return a.volume + f * (b.volume - a.volume);
		}
	}
	return rows[rows.length - 1].volume;
}
