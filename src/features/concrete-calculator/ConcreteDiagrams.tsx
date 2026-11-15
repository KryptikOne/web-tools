"use client";

import { Diagram, DimLine, Label, Member, useDiagramScale } from "@/components/construction/Diagram";
import diagramStyles from "@/components/construction/Diagram.module.scss";
import { inchesToMm } from "@/lib/construction/imperialUtils";
import type { Outline } from "@/lib/construction/concreteUtils";
import styles from "./ConcreteDiagrams.module.scss";

const W = 180;
const PAD = 18;
const r4 = (n: number) => Math.round(n * 1e4) / 1e4;

interface Fmt {
	format: (inches: number) => string;
}

// ── Plan of the slab outline ─────────────────────────────────────────────────

export interface SlabPlanProps extends Fmt {
	outline: Outline;
	edgeBeamWidth: number;
}

export function SlabPlan({ outline, edgeBeamWidth, format }: SlabPlanProps) {
	const w = Math.max(outline.width, 1);
	const d = Math.max(outline.depth, 1);
	const k = Math.min((W - PAD * 2) / inchesToMm(w), 110 / inchesToMm(d));
	const height = inchesToMm(d) * k + PAD * 2;
	return (
		<Diagram widthMm={W} heightMm={height} label={outline.closed ? `Slab plan, ${format(outline.width)} by ${format(outline.depth)} overall, ${outline.points.length} corners` : `Open slab outline, ${format(outline.closingLength)} still to close`} maxWidth="720px">
			<PlanScene outline={outline} edgeBeamWidth={edgeBeamWidth} format={format} k={k} />
		</Diagram>
	);
}

function PlanScene({ outline, edgeBeamWidth, format, k }: SlabPlanProps & { k: number }) {
	const { px } = useDiagramScale();
	const minX = Math.min(...outline.points.map((p) => p.x));
	const maxY = Math.max(...outline.points.map((p) => p.y));
	const X = (x: number) => r4(PAD + inchesToMm(x - minX) * k);
	const Y = (y: number) => r4(PAD + inchesToMm(maxY - y) * k);
	const pts = outline.points.map((p) => ({ x: X(p.x), y: Y(p.y) }));
	const beam = Math.max(inchesToMm(edgeBeamWidth) * k, 0);
	const segs = pts.slice(1).map((b, i) => ({ a: pts[i], b, len: Math.hypot(outline.points[i + 1].x - outline.points[i].x, outline.points[i + 1].y - outline.points[i].y) }));
	return (
		<>
			{pts.length > 2 && <polygon points={pts.map((p) => `${p.x},${p.y}`).join(" ")} className={`${diagramStyles.member} ${diagramStyles["role-wall"]}`} />}
			{beam > 0.3 && pts.length > 2 && outline.closed && <polygon points={pts.map((p) => `${p.x},${p.y}`).join(" ")} className={styles.beam} style={{ strokeWidth: beam * 2 }} />}
			{pts.length > 2 && <polygon points={pts.map((p) => `${p.x},${p.y}`).join(" ")} className={styles.outlineLine} />}
			{segs.map((s, i) => (
				<DimLine key={i} x1={s.a.x} y1={s.a.y} x2={s.b.x} y2={s.b.y} label={format(s.len)} offset={-px(10)} extensions={false} size={9} />
			))}
			{!outline.closed && pts.length > 1 && <line x1={pts[pts.length - 1].x} y1={pts[pts.length - 1].y} x2={pts[0].x} y2={pts[0].y} className={styles.closing} />}
			{!outline.closed && pts.length > 1 && <Label x={r4((pts[pts.length - 1].x + pts[0].x) / 2)} y={r4((pts[pts.length - 1].y + pts[0].y) / 2 - px(6))} text={`${format(outline.closingLength)} to close`} size={9} className={styles.closingText} />}
			<circle cx={pts[0].x} cy={pts[0].y} r={px(3)} className={styles.start} />
			<Label x={pts[0].x} y={pts[0].y + px(12)} text="start" size={8} />
			{pts.length > 1 && <Label x={pts[pts.length - 1].x} y={pts[pts.length - 1].y - px(8)} text="▲" size={9} className={styles.cursor} />}
		</>
	);
}

// ── Section through the slab and an edge beam ────────────────────────────────

export interface SlabSectionProps extends Fmt {
	slabThickness: number;
	edgeBeamWidth: number;
	edgeBeamDepth: number;
	internalBeamWidth: number;
	internalBeamDepth: number;
	splayInternal: boolean;
}

export function SlabSection({ slabThickness, edgeBeamWidth, edgeBeamDepth, internalBeamWidth, internalBeamDepth, splayInternal, format }: SlabSectionProps) {
	const depth = Math.max(slabThickness, edgeBeamDepth, internalBeamDepth, 1);
	const span = Math.max(edgeBeamWidth, 6) * 2 + Math.max(internalBeamWidth, 6) + 60;
	const k = Math.min((W - PAD * 2) / inchesToMm(span), 50 / inchesToMm(depth));
	const height = inchesToMm(depth) * k + PAD * 2 + 10;
	return (
		<Diagram widthMm={W} heightMm={height} label={`Section: slab ${format(slabThickness)} thick, edge beam ${format(edgeBeamWidth)} by ${format(edgeBeamDepth)}, internal beam ${format(internalBeamWidth)} by ${format(internalBeamDepth)}${splayInternal ? " splayed" : ""}`} maxWidth="720px">
			<SectionScene slabThickness={slabThickness} edgeBeamWidth={edgeBeamWidth} edgeBeamDepth={edgeBeamDepth} internalBeamWidth={internalBeamWidth} internalBeamDepth={internalBeamDepth} splayInternal={splayInternal} format={format} k={k} span={span} />
		</Diagram>
	);
}

function SectionScene({ slabThickness, edgeBeamWidth, edgeBeamDepth, internalBeamWidth, internalBeamDepth, splayInternal, format, k, span }: SlabSectionProps & { k: number; span: number }) {
	const { px } = useDiagramScale();
	const mm = (inches: number) => inchesToMm(inches) * k;
	const x0 = PAD;
	const top = PAD;
	const X = (inches: number) => r4(x0 + mm(inches));
	const Y = (inches: number) => r4(top + mm(inches));
	const eb = Math.max(edgeBeamWidth, 0);
	const ib = Math.max(internalBeamWidth, 0);
	const mid = span / 2;
	const ibExtra = Math.max(0, internalBeamDepth - slabThickness);
	const splay = splayInternal ? ibExtra : 0;
	const ibPath = `M ${X(mid - ib / 2 - splay)} ${Y(slabThickness)} L ${X(mid + ib / 2 + splay)} ${Y(slabThickness)} L ${X(mid + ib / 2)} ${Y(internalBeamDepth)} L ${X(mid - ib / 2)} ${Y(internalBeamDepth)} Z`;
	return (
		<>
			{/* ground line */}
			<line x1={X(0) - 4} y1={Y(slabThickness)} x2={X(span) + 4} y2={Y(slabThickness)} className={styles.ground} />
			{/* slab */}
			<Member x={X(0)} y={Y(0)} width={r4(mm(span))} height={r4(mm(slabThickness))} role="wall" />
			{/* edge beams both sides */}
			{eb > 0 && edgeBeamDepth > slabThickness && (
				<>
					<Member x={X(0)} y={Y(slabThickness)} width={r4(mm(eb))} height={r4(mm(edgeBeamDepth - slabThickness))} role="ridge" />
					<Member x={X(span - eb)} y={Y(slabThickness)} width={r4(mm(eb))} height={r4(mm(edgeBeamDepth - slabThickness))} role="ridge" />
				</>
			)}
			{ib > 0 && ibExtra > 0 && <path d={ibPath} className={`${diagramStyles.member} ${diagramStyles["role-hip"]}`} />}
			<DimLine x1={X(span) + 2} y1={Y(0)} x2={X(span) + 2} y2={Y(slabThickness)} label={format(slabThickness)} offset={-px(6)} size={9} />
			{eb > 0 && edgeBeamDepth > slabThickness && (
				<>
					<DimLine x1={X(0)} y1={Y(edgeBeamDepth)} x2={X(eb)} y2={Y(edgeBeamDepth)} label={format(eb)} offset={px(8)} size={9} />
					<DimLine x1={X(0) - 2} y1={Y(0)} x2={X(0) - 2} y2={Y(edgeBeamDepth)} label={format(edgeBeamDepth)} offset={px(6)} size={9} />
				</>
			)}
			{ib > 0 && ibExtra > 0 && (
				<>
					<DimLine x1={X(mid - ib / 2)} y1={Y(internalBeamDepth)} x2={X(mid + ib / 2)} y2={Y(internalBeamDepth)} label={format(ib)} offset={px(8)} size={9} />
					<Label x={X(mid)} y={Y(slabThickness / 2)} text={`internal ${format(internalBeamDepth)} deep`} size={8} />
				</>
			)}
		</>
	);
}
