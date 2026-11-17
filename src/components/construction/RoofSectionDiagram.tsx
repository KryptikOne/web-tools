"use client";

import { Diagram, DimLine, AngleArc, Label, Member, useDiagramScale } from "./Diagram";
import diagramStyles from "./Diagram.module.scss";
import { inchesToMm } from "@/lib/construction/imperialUtils";
import styles from "./RoofSectionDiagram.module.scss";

const r4 = (n: number) => Math.round(n * 1e4) / 1e4;
export type Pt = { x: number; y: number };

/** A rafter drawn from its bottom edge: `a` is the low end, `b` the high end, both ends cut plumb. */
export interface RafterPiece {
	a: Pt;
	b: Pt;
	plumbDepth: number;
}
export interface WallPiece {
	/** Outer face */
	x: number;
	/** Plate top */
	top: number;
	thickness: number;
	height: number;
}
export interface DimPiece {
	a: Pt;
	b: Pt;
	label: string;
	/** Offset in screen pixels; positive is to the right of a → b */
	offset: number;
	extensions?: boolean;
}
export interface ArcPiece {
	c: Pt;
	startDeg: number;
	endDeg: number;
	label: string;
}
export interface TextPiece {
	at: Pt;
	text: string;
	anchor?: "start" | "middle" | "end";
}

export interface RoofSectionDiagramProps {
	rafters: RafterPiece[];
	walls: WallPiece[];
	dims: DimPiece[];
	arcs?: ArcPiece[];
	texts?: TextPiece[];
	/** Extra dashed centre lines, as vertical x positions */
	centreLines?: { x: number; from: number; to: number }[];
	label: string;
}

const W = 180;
const PAD = 24;
const MAX_H = 120;

/**
 * Cross section through a roof in inches: x along the span, y up from the lowest plate top.
 * Scaled to fit the drawing width with the same scale both ways.
 */
export default function RoofSectionDiagram(props: RoofSectionDiagramProps) {
	const pts: Pt[] = [];
	for (const r of props.rafters) pts.push(r.a, r.b, { x: r.a.x, y: r.a.y + r.plumbDepth }, { x: r.b.x, y: r.b.y + r.plumbDepth });
	for (const w of props.walls) pts.push({ x: w.x, y: w.top }, { x: w.x + w.thickness, y: w.top - w.height });
	const minX = Math.min(...pts.map((p) => p.x));
	const maxX = Math.max(...pts.map((p) => p.x));
	const minY = Math.min(...pts.map((p) => p.y));
	const maxY = Math.max(...pts.map((p) => p.y));
	const k = Math.min((W - PAD * 2) / inchesToMm(maxX - minX), MAX_H / inchesToMm(maxY - minY));
	const height = inchesToMm(maxY - minY) * k + PAD * 2;
	return (
		<Diagram widthMm={W} heightMm={height} label={props.label} maxWidth="820px">
			<Scene {...props} k={k} minX={minX} maxY={maxY} />
		</Diagram>
	);
}

function Scene({ rafters, walls, dims, arcs = [], texts = [], centreLines = [], k, minX, maxY }: RoofSectionDiagramProps & { k: number; minX: number; maxY: number }) {
	const { px } = useDiagramScale();
	const P = (p: Pt): Pt => ({ x: r4(PAD + inchesToMm(p.x - minX) * k), y: r4(PAD + inchesToMm(maxY - p.y) * k) });
	return (
		<>
			{walls.map((w, i) => {
				const tl = P({ x: w.x, y: w.top });
				return <Member key={`w${i}`} x={tl.x} y={tl.y} width={Math.max(r4(inchesToMm(w.thickness) * k), 0.8)} height={r4(inchesToMm(w.height) * k)} role="wall" />;
			})}
			{rafters.map((r, i) => {
				const poly = [r.a, r.b, { x: r.b.x, y: r.b.y + r.plumbDepth }, { x: r.a.x, y: r.a.y + r.plumbDepth }].map(P);
				return <polygon key={`r${i}`} points={poly.map((p) => `${p.x},${p.y}`).join(" ")} className={`${diagramStyles.member} ${diagramStyles["role-common"]}`} />;
			})}
			{centreLines.map((c, i) => {
				const a = P({ x: c.x, y: c.from });
				const b = P({ x: c.x, y: c.to });
				return <line key={`c${i}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} className={styles.centre} />;
			})}
			{dims.map((d, i) => {
				const a = P(d.a);
				const b = P(d.b);
				return <DimLine key={`d${i}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} label={d.label} offset={px(d.offset)} extensions={d.extensions} size={9} />;
			})}
			{arcs.map((a, i) => {
				const c = P(a.c);
				return <AngleArc key={`a${i}`} cx={c.x} cy={c.y} radius={14} startDeg={a.startDeg} endDeg={a.endDeg} label={a.label} size={9} />;
			})}
			{texts.map((t, i) => {
				const p = P(t.at);
				return <Label key={`t${i}`} x={p.x} y={p.y} text={t.text} size={9} anchor={t.anchor} />;
			})}
		</>
	);
}
