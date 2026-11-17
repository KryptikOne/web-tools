"use client";

import { Diagram, DimLine, Label, Member, useDiagramScale, type MemberRole } from "@/components/construction/Diagram";
import { inchesToMm } from "@/lib/construction/imperialUtils";
import styles from "./FenceDiagrams.module.scss";

const W = 180;
const PAD_X = 12;
const PAD_TOP = 12;
const PAD_BOTTOM = 22;
const r4 = (n: number) => Math.round(n * 1e4) / 1e4;

/** A rectangle in inches: x from the start of the run, y of its bottom above ground, width and height up. */
export interface FenceRect {
	x: number;
	y: number;
	w: number;
	h: number;
	role: MemberRole;
	label?: string;
}
export interface FenceDim {
	x1: number;
	y1: number;
	x2: number;
	y2: number;
	label: string;
	offset: number;
	extensions?: boolean;
}

export interface FenceDiagramProps {
	length: number;
	/** Highest point drawn above ground */
	height: number;
	/** Depth drawn below ground, for post holes */
	below?: number;
	rects: FenceRect[];
	/** Optional arc over the run: points in inches */
	curve?: { x: number; y: number }[];
	/** Small marks on the ground, e.g. spigots */
	marks?: { x: number; w: number }[];
	dims: FenceDim[];
	label: string;
}

/** Fence elevation scaled to fit: posts, rails, palings or panels over a ground line. */
export default function FenceDiagram(props: FenceDiagramProps) {
	const { length, height, below = 0 } = props;
	const k = Math.min((W - PAD_X * 2) / inchesToMm(length), 80 / inchesToMm(height + below));
	const hMm = inchesToMm(height + below) * k + PAD_TOP + PAD_BOTTOM;
	return (
		<Diagram widthMm={W} heightMm={hMm} label={props.label}>
			<Scene {...props} k={k} hMm={hMm} below={below} />
		</Diagram>
	);
}

function Scene({ length, rects, curve, marks = [], dims, k, hMm, below }: FenceDiagramProps & { k: number; hMm: number; below: number }) {
	const { px } = useDiagramScale();
	const X = (inches: number) => r4(PAD_X + inchesToMm(inches) * k);
	const Y = (inches: number) => r4(hMm - PAD_BOTTOM - inchesToMm(inches + below) * k);
	return (
		<>
			{rects.map((r, i) => (
				<Member key={i} x={X(r.x)} y={Y(r.y + r.h)} width={Math.max(r4(X(r.x + r.w) - X(r.x)), 0.5)} height={Math.max(r4(Y(r.y) - Y(r.y + r.h)), 0.5)} role={r.role} />
			))}
			{rects.filter((r) => r.label).map((r, i) => (
				<Label key={`l${i}`} x={X(r.x + r.w / 2)} y={Y(r.y + r.h) - px(4)} text={r.label!} size={7} className={styles.num} />
			))}
			{/* ground */}
			<line x1={X(-4)} y1={Y(0)} x2={X(length + 4)} y2={Y(0)} className={styles.ground} />
			{below > 0 && <rect x={X(-4)} y={Y(0)} width={r4(X(length + 4) - X(-4))} height={r4(Y(-below) - Y(0))} className={styles.soil} />}
			{marks.map((m, i) => (
				<rect key={`m${i}`} x={X(m.x)} y={Y(0) - 2.5} width={Math.max(r4(X(m.x + m.w) - X(m.x)), 0.8)} height={2.5} className={styles.spigot} />
			))}
			{curve && curve.length > 1 && <polyline points={curve.map((p) => `${X(p.x)},${Y(p.y)}`).join(" ")} className={styles.curve} />}
			{dims.map((d, i) => (
				<DimLine key={`d${i}`} x1={X(d.x1)} y1={Y(d.y1)} x2={X(d.x2)} y2={Y(d.y2)} label={d.label} offset={px(d.offset)} extensions={d.extensions} size={9} />
			))}
		</>
	);
}

// ── Post hole detail ─────────────────────────────────────────────────────────

export interface PostHoleProps {
	postWidth: number;
	holeDiameter: number;
	holeDepth: number;
	aboveGround: number;
	format: (inches: number) => string;
}

export function PostHoleDiagram({ postWidth, holeDiameter, holeDepth, aboveGround, format }: PostHoleProps) {
	const drawnAbove = Math.min(aboveGround, 18);
	const total = drawnAbove + holeDepth;
	const k = Math.min(50 / inchesToMm(Math.max(holeDiameter, postWidth) * 2.5), 70 / inchesToMm(total));
	const width = inchesToMm(Math.max(holeDiameter, postWidth) * 2.5) * k + 60;
	const height = inchesToMm(total) * k + 28;
	return (
		<Diagram widthMm={width} heightMm={height} label={`Post hole: ${format(holeDiameter)} across and ${format(holeDepth)} deep around a ${format(postWidth)} post`} maxWidth="420px">
			<HoleScene postWidth={postWidth} holeDiameter={holeDiameter} holeDepth={holeDepth} drawnAbove={drawnAbove} k={k} width={width} format={format} />
		</Diagram>
	);
}

function HoleScene({ postWidth, holeDiameter, holeDepth, drawnAbove, k, width, format }: { postWidth: number; holeDiameter: number; holeDepth: number; drawnAbove: number; k: number; width: number; format: (n: number) => string }) {
	const { px } = useDiagramScale();
	const cx = width / 2 - 16;
	const groundY = 14 + inchesToMm(drawnAbove) * k;
	const mm = (n: number) => r4(inchesToMm(n) * k);
	const bottomY = r4(groundY + mm(holeDepth));
	return (
		<>
			<line x1={4} y1={groundY} x2={width - 4} y2={groundY} className={styles.ground} />
			<rect x={r4(cx - mm(holeDiameter) / 2)} y={groundY} width={mm(holeDiameter)} height={mm(holeDepth)} className={styles.concrete} />
			<Member x={r4(cx - mm(postWidth) / 2)} y={14} width={mm(postWidth)} height={r4(mm(drawnAbove + holeDepth) - mm(2))} role="wall" />
			<DimLine x1={r4(cx - mm(holeDiameter) / 2)} y1={bottomY} x2={r4(cx + mm(holeDiameter) / 2)} y2={bottomY} label={format(holeDiameter)} offset={px(12)} size={9} />
			<DimLine x1={r4(cx + mm(holeDiameter) / 2)} y1={groundY} x2={r4(cx + mm(holeDiameter) / 2)} y2={bottomY} label={format(holeDepth)} offset={-px(12)} size={9} />
			<Label x={r4(cx + mm(holeDiameter) / 2) + px(30)} y={r4(groundY - px(4))} text="ground" size={8} anchor="middle" />
		</>
	);
}
