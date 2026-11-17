"use client";

import { Diagram, DimLine, Label, useDiagramScale } from "@/components/construction/Diagram";
import { inchesToMm } from "@/lib/construction/imperialUtils";
import type { Offset } from "@/lib/construction/curveLayoutUtils";
import styles from "./CurveDiagrams.module.scss";

const W = 180;
const PAD = 16;
const r4 = (n: number) => Math.round(n * 1e4) / 1e4;
type Fmt = { format: (inches: number) => string };

export interface Centre {
	x: number;
	y: number;
	radius: number;
	label: string;
}

export interface CurveDiagramProps extends Fmt {
	/** Length of the base line (chord, span or major axis) */
	length: number;
	/** Height of the curve above the base */
	rise: number;
	y: (x: number) => number;
	offsets: Offset[];
	centres?: Centre[];
	/** Extra marked points, e.g. foci or junctions */
	points?: { x: number; y: number; label: string }[];
	/** Draw the mirror image below the base line (full oval) */
	mirror?: boolean;
	/** Dashed compass arcs for a four-centre approximation, as SVG path segments in inches via a builder */
	label: string;
}

/** A curve over its base line, drawn to fit, with centres, radii and the offset ordinates. */
export default function CurveDiagram(props: CurveDiagramProps) {
	const { length, rise, centres = [], mirror = false } = props;
	const below = Math.max(mirror ? rise : 0, ...centres.map((c) => -c.y), 0);
	const extraX = Math.max(0, ...centres.map((c) => -c.x), ...centres.map((c) => c.x - length));
	const totalW = length + 2 * extraX;
	const totalH = rise + below;
	const k = Math.min((W - PAD * 2) / inchesToMm(totalW), 100 / inchesToMm(totalH));
	const height = inchesToMm(totalH) * k + PAD * 2 + 10;
	return (
		<Diagram widthMm={W} heightMm={height} label={props.label}>
			<Scene {...props} k={k} height={height} extraX={extraX} below={below} />
		</Diagram>
	);
}

function Scene({ length, rise, y, offsets, centres = [], points = [], mirror = false, format, k, height, extraX, below }: CurveDiagramProps & { k: number; height: number; extraX: number; below: number }) {
	const { px } = useDiagramScale();
	const X = (inches: number) => r4(PAD + inchesToMm(inches + extraX) * k);
	const Y = (inches: number) => r4(height - PAD - 10 - inchesToMm(inches + below) * k);
	const steps = 160;
	const pts = Array.from({ length: steps + 1 }, (_, i) => {
		const x = (length * i) / steps;
		return `${X(x)},${Y(y(x))}`;
	});
	const mirrorPts = mirror ? Array.from({ length: steps + 1 }, (_, i) => {
		const x = (length * i) / steps;
		return `${X(x)},${Y(-y(x))}`;
	}) : [];
	const many = offsets.length > 30;
	return (
		<>
			<polyline points={pts.join(" ")} className={styles.curve} />
			{mirror && <polyline points={mirrorPts.join(" ")} className={styles.curve} />}
			<line x1={X(0)} y1={Y(0)} x2={X(length)} y2={Y(0)} className={styles.base} />
			{offsets.map((o, i) => (
				<g key={i}>
					<line x1={X(o.x)} y1={Y(0)} x2={X(o.x)} y2={Y(o.y)} className={styles.ordinate} />
					{!many && i > 0 && i < offsets.length - 1 && <Label x={X(o.x)} y={Y(o.y) - px(3)} text={format(o.y)} size={6} className={styles.num} />}
				</g>
			))}
			{centres.map((c, i) => (
				<g key={`c${i}`}>
					<line x1={X(c.x)} y1={Y(c.y)} x2={X(length / 2)} y2={Y(rise)} className={styles.radius} />
					<circle cx={X(c.x)} cy={Y(c.y)} r={1.2} className={styles.centre} />
					<Label x={X(c.x)} y={Y(c.y) + px(9)} text={`${c.label} R ${format(c.radius)}`} size={6} className={styles.num} />
				</g>
			))}
			{points.map((p, i) => (
				<g key={`p${i}`}>
					<circle cx={X(p.x)} cy={Y(p.y)} r={1.2} className={styles.point} />
					<Label x={X(p.x)} y={Y(p.y) + px(9)} text={p.label} size={6} className={styles.num} />
				</g>
			))}
			<DimLine x1={X(0)} y1={Y(mirror ? -rise : 0)} x2={X(length)} y2={Y(mirror ? -rise : 0)} label={format(length)} offset={px(12)} size={9} />
			<DimLine x1={X(length) + px(5)} y1={Y(0)} x2={X(length) + px(5)} y2={Y(rise)} label={format(rise)} offset={-px(8)} extensions={false} size={8} />
		</>
	);
}
