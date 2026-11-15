"use client";

import { Diagram, DimLine, AngleArc, Label, useDiagramScale } from "@/components/construction/Diagram";
import diagramStyles from "@/components/construction/Diagram.module.scss";
import type { ArcResult, CircleResult, PolygonResult } from "@/lib/construction/geometryUtils";
import { formatAngle } from "@/lib/construction/pitchUtils";
import styles from "./CircleDiagrams.module.scss";

const W = 180;
const PAD = 24;
const DRAW_R = 52; // circle radius on paper, mm
const r4 = (n: number) => Math.round(n * 1e4) / 1e4;

interface Fmt {
	format: (inches: number) => string;
}

// ── Polygon ──────────────────────────────────────────────────────────────────

export function PolygonDiagram({ polygon, format }: { polygon: PolygonResult } & Fmt) {
	const height = DRAW_R * 2 + PAD * 2;
	return (
		<Diagram widthMm={W} heightMm={height} label={`${polygon.sides}-sided polygon with side ${format(polygon.sideLength)} on a ${format(polygon.radius)} radius circle, drawn to fit`} maxWidth="640px">
			<PolygonScene polygon={polygon} format={format} height={height} />
		</Diagram>
	);
}

function PolygonScene({ polygon, format, height }: { polygon: PolygonResult; height: number } & Fmt) {
	const { px } = useDiagramScale();
	const cx = W / 2;
	const cy = height / 2;
	const k = DRAW_R / polygon.radius;
	const pts = polygon.vertices.map((v) => ({ x: r4(cx + v.x * k), y: r4(cy - v.y * k) }));
	const [a, b] = pts;
	const mid = { x: r4((a.x + b.x) / 2), y: r4((a.y + b.y) / 2) };
	const arcStart = -90;
	const arcEnd = -90 + polygon.centralAngle;
	const ex = r4(cx + DRAW_R * Math.cos((arcEnd * Math.PI) / 180));
	const ey = r4(cy + DRAW_R * Math.sin((arcEnd * Math.PI) / 180));
	const many = polygon.sides > 24;
	return (
		<>
			<circle cx={cx} cy={cy} r={DRAW_R} className={styles.circle} />
			<polygon points={pts.map((p) => `${p.x},${p.y}`).join(" ")} className={`${diagramStyles.member} ${diagramStyles["role-common"]}`} />
			{/* segment between the first side and the arc */}
			<path d={`M ${a.x} ${a.y} A ${DRAW_R} ${DRAW_R} 0 0 1 ${ex} ${ey} L ${b.x} ${b.y} Z`} className={styles.segment} />
			{/* one triangle section */}
			<path d={`M ${cx} ${cy} L ${a.x} ${a.y} L ${b.x} ${b.y} Z`} className={styles.section} />
			<line x1={cx} y1={cy} x2={mid.x} y2={mid.y} className={styles.apothem} />
			<circle cx={cx} cy={cy} r={px(2)} className={styles.centre} />
			{!many && pts.map((p, i) => <Label key={i} x={r4(cx + (p.x - cx) * 1.1)} y={r4(cy + (p.y - cy) * 1.1)} text={`${i + 1}`} size={8} className={styles.vertex} />)}

			<DimLine x1={a.x} y1={a.y} x2={b.x} y2={b.y} label={format(polygon.sideLength)} offset={-px(10)} extensions={false} size={10} />
			<DimLine x1={cx} y1={cy} x2={a.x} y2={a.y} label={`R ${format(polygon.radius)}`} offset={px(8)} extensions={false} size={10} />
			<DimLine x1={cx} y1={cy} x2={mid.x} y2={mid.y} label={format(polygon.apothem)} offset={px(8)} extensions={false} size={9} />
			<AngleArc cx={cx} cy={cy} radius={Math.min(12, DRAW_R * 0.3)} startDeg={arcStart} endDeg={arcEnd} label={formatAngle(polygon.centralAngle, 2)} size={9} />
			{!many && <Label x={b.x} y={b.y + px(12)} text={formatAngle(polygon.interiorAngle, 1)} size={8} anchor="start" />}
		</>
	);
}

// ── Circle ───────────────────────────────────────────────────────────────────

export function CircleDiagram({ circle, format }: { circle: CircleResult } & Fmt) {
	const height = DRAW_R * 2 + PAD * 2;
	return (
		<Diagram widthMm={W} heightMm={height} label={`Circle with radius ${format(circle.radius)} and diameter ${format(circle.diameter)}, drawn to fit`} maxWidth="640px">
			<CircleScene circle={circle} format={format} height={height} />
		</Diagram>
	);
}

function CircleScene({ circle, format, height }: { circle: CircleResult; height: number } & Fmt) {
	const { px } = useDiagramScale();
	const cx = W / 2;
	const cy = height / 2;
	const r45 = DRAW_R * Math.SQRT1_2;
	return (
		<>
			<circle cx={cx} cy={cy} r={DRAW_R} className={`${diagramStyles.member} ${diagramStyles["role-common"]}`} />
			<circle cx={cx} cy={cy} r={px(2)} className={styles.centre} />
			<DimLine x1={cx - DRAW_R} y1={cy} x2={cx + DRAW_R} y2={cy} label={`D ${format(circle.diameter)}`} extensions={false} size={10} />
			<DimLine x1={cx} y1={cy} x2={r4(cx + r45)} y2={r4(cy - r45)} label={`R ${format(circle.radius)}`} offset={-px(8)} extensions={false} size={10} />
			<Label x={cx} y={cy + DRAW_R + px(14)} text={`C ${format(circle.circumference)}`} size={10} />
		</>
	);
}

// ── Chord and arc ────────────────────────────────────────────────────────────

export function ArcDiagram({ arc, format }: { arc: ArcResult } & Fmt) {
	const height = DRAW_R * 2 + PAD * 2;
	return (
		<Diagram widthMm={W} heightMm={height} label={`Arc of ${formatAngle(arc.angle, 2)} on a ${format(arc.radius)} radius with chord ${format(arc.chord)} and height ${format(arc.height)}, drawn to fit`} maxWidth="640px">
			<ArcScene arc={arc} format={format} height={height} />
		</Diagram>
	);
}

function ArcScene({ arc, format, height }: { arc: ArcResult; height: number } & Fmt) {
	const { px } = useDiagramScale();
	const cx = W / 2;
	const cy = height / 2;
	const half = (arc.angle / 2) * (Math.PI / 180);
	// arc centred on straight up: ends at ±half from the top
	const ends = [-Math.PI / 2 - half, -Math.PI / 2 + half].map((t) => ({ x: r4(cx + DRAW_R * Math.cos(t)), y: r4(cy + DRAW_R * Math.sin(t)) }));
	const [l, r] = ends;
	const large = arc.angle > 180 ? 1 : 0;
	const top = { x: cx, y: cy - DRAW_R };
	const chordMid = { x: cx, y: r4((l.y + r.y) / 2) };
	const startDeg = -90 - arc.angle / 2;
	return (
		<>
			<circle cx={cx} cy={cy} r={DRAW_R} className={styles.circle} />
			<path d={`M ${l.x} ${l.y} A ${DRAW_R} ${DRAW_R} 0 ${large} 1 ${r.x} ${r.y} Z`} className={styles.segment} />
			<path d={`M ${cx} ${cy} L ${l.x} ${l.y} A ${DRAW_R} ${DRAW_R} 0 ${large} 1 ${r.x} ${r.y} Z`} className={styles.sector} />
			<path d={`M ${l.x} ${l.y} A ${DRAW_R} ${DRAW_R} 0 ${large} 1 ${r.x} ${r.y}`} className={styles.arc} />
			<line x1={l.x} y1={l.y} x2={r.x} y2={r.y} className={styles.chord} />
			<circle cx={cx} cy={cy} r={px(2)} className={styles.centre} />

			<DimLine x1={l.x} y1={l.y} x2={r.x} y2={r.y} label={`chord ${format(arc.chord)}`} offset={px(10)} extensions={false} size={10} />
			<DimLine x1={chordMid.x} y1={chordMid.y} x2={top.x} y2={top.y} label={`h ${format(arc.height)}`} offset={-px(8)} extensions={false} size={9} />
			<DimLine x1={cx} y1={cy} x2={r.x} y2={r.y} label={`R ${format(arc.radius)}`} offset={-px(8)} extensions={false} size={9} />
			<AngleArc cx={cx} cy={cy} radius={Math.min(12, DRAW_R * 0.28)} startDeg={startDeg} endDeg={startDeg + arc.angle} label={formatAngle(arc.angle, 2)} size={9} />
			<Label x={cx} y={r4(cy - DRAW_R - px(12))} text={`arc ${format(arc.arcLength)}`} size={10} />
		</>
	);
}
