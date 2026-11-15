"use client";

import { Diagram, DimLine, AngleArc, Label, Member, useDiagramScale, type MemberRole } from "@/components/construction/Diagram";
import diagramStyles from "@/components/construction/Diagram.module.scss";
import { inchesToMm } from "@/lib/construction/imperialUtils";
import type { SquareUpResult } from "@/lib/construction/geometryUtils";
import styles from "./SquareUpDiagrams.module.scss";

const W = 180;
const PAD = 22;
const AVAIL_W = W - PAD * 2;
const AVAIL_H = 110;
const r4 = (n: number) => Math.round(n * 1e4) / 1e4;

// ── Part 1: shape with its diagonal ──────────────────────────────────────────

export interface ShapeDiagramProps {
	side1: number;
	side2: number;
	diagonal: number;
	shape: "rectangle" | "triangle";
	role: MemberRole;
	format: (inches: number) => string;
}

export function ShapeDiagram(props: ShapeDiagramProps) {
	const { side1, side2 } = props;
	const k = Math.min(AVAIL_W / inchesToMm(side1), AVAIL_H / inchesToMm(side2));
	const h = inchesToMm(side2) * k;
	const height = h + PAD * 2;
	return (
		<Diagram widthMm={W} heightMm={height} label={`${props.shape === "rectangle" ? "Rectangle" : "Right triangle"} ${props.format(side1)} by ${props.format(side2)} with diagonal ${props.format(props.diagonal)}`} maxWidth="720px">
			<ShapeScene {...props} k={k} w={inchesToMm(side1) * k} h={h} height={height} />
		</Diagram>
	);
}

function ShapeScene({ side1, side2, diagonal, shape, role, format, w, h, height }: ShapeDiagramProps & { k: number; w: number; h: number; height: number }) {
	const x0 = PAD;
	const y1 = height - PAD;
	const x1 = x0 + w;
	const y0 = y1 - h;
	const sq = Math.min(5, w * 0.2, h * 0.2);
	const path = shape === "rectangle" ? `M ${x0} ${y1} L ${x1} ${y1} L ${x1} ${y0} L ${x0} ${y0} Z` : `M ${x0} ${y1} L ${x1} ${y1} L ${x1} ${y0} Z`;
	return (
		<>
			<path d={path} className={`${diagramStyles.member} ${diagramStyles[`role-${role}`]}`} />
			{/* right-angle marks */}
			<path d={`M ${x1 - sq} ${y1} L ${x1 - sq} ${y1 - sq} L ${x1} ${y1 - sq}`} className={diagramStyles.dimLine} />
			{shape === "rectangle" && (
				<>
					<path d={`M ${x0 + sq} ${y1} L ${x0 + sq} ${y1 - sq} L ${x0} ${y1 - sq}`} className={diagramStyles.dimLine} />
					<path d={`M ${x0 + sq} ${y0} L ${x0 + sq} ${y0 + sq} L ${x0} ${y0 + sq}`} className={diagramStyles.dimLine} />
					<path d={`M ${x1 - sq} ${y0} L ${x1 - sq} ${y0 + sq} L ${x1} ${y0 + sq}`} className={diagramStyles.dimLine} />
				</>
			)}
			<DimLine x1={x0} y1={y1} x2={x1} y2={y0} label={format(diagonal)} extensions={false} className={styles.diagonal} />
			<DimLine x1={x0} y1={y1} x2={x1} y2={y1} label={format(side1)} offset={9} />
			<DimLine x1={x1} y1={y1} x2={x1} y2={y0} label={format(side2)} offset={9} />
			<Label x={x1 - 3} y={y1 - 3 - sq} text="90°" anchor="end" size={10} />
		</>
	);
}

// ── Part 2: squaring from two reference stakes ───────────────────────────────

export interface AdjustDiagramProps {
	referenceLength: number;
	sideLength: number;
	batterboardGap: number;
	result: SquareUpResult;
	format: (inches: number) => string;
}

/** Swings under this many degrees are drawn at this angle so the two lines can be told apart. */
export const MIN_DRAWN_SWING = 6;

export function AdjustDiagram(props: AdjustDiagramProps) {
	const { referenceLength, sideLength, batterboardGap, result } = props;
	const reach = sideLength + batterboardGap;
	const drawnSwing = Math.abs(result.swingDeg) < MIN_DRAWN_SWING ? (result.direction === "toward" ? -MIN_DRAWN_SWING : MIN_DRAWN_SWING) : result.swingDeg;
	const spread = inchesToMm(reach) * Math.sin((Math.abs(drawnSwing) * Math.PI) / 180);
	const k = Math.min(AVAIL_W / (inchesToMm(referenceLength) + spread + 10), AVAIL_H / inchesToMm(reach));
	const height = inchesToMm(reach) * k + PAD * 2 + 10;
	const exaggerated = Math.abs(result.swingDeg) < MIN_DRAWN_SWING && result.direction !== "none";
	return (
		<Diagram widthMm={W} heightMm={height} label={`Reference side ${props.format(referenceLength)}, side ${props.format(sideLength)}, string ${result.direction === "none" ? "already square" : `moves ${props.format(result.moveAtBatterboard)} ${result.direction === "away" ? "away from" : "toward"} the reference side`}${exaggerated ? ", angle exaggerated for clarity" : ""}`} maxWidth="720px">
			<AdjustScene {...props} k={k} height={height} drawnSwing={drawnSwing} />
		</Diagram>
	);
}

function AdjustScene({ referenceLength, sideLength, batterboardGap, result, format, k, height, drawnSwing }: AdjustDiagramProps & { k: number; height: number; drawnSwing: number }) {
	const { px } = useDiagramScale();
	const mm = (inches: number) => inchesToMm(inches) * k;
	const R = mm(referenceLength);
	const S = mm(sideLength);
	const reach = mm(sideLength + batterboardGap);
	// Stake A left, stake B right on the reference line; the side rises from A. "Away" from the
	// reference side means the corner swings left (opening the angle past the current one).
	const baseY = height - PAD - 6;
	const ax = PAD + (drawnSwing > 0 ? mm(sideLength + batterboardGap) * Math.sin((drawnSwing * Math.PI) / 180) : 0) + 4;
	const bx = ax + R;
	// Current string: angle (90 - drawnSwing) from the reference line, measured at A
	const cur = ((90 - drawnSwing) * Math.PI) / 180;
	const curC = { x: r4(ax + S * Math.cos(cur)), y: r4(baseY - S * Math.sin(cur)) };
	const curEnd = { x: r4(ax + reach * Math.cos(cur)), y: r4(baseY - reach * Math.sin(cur)) };
	const okC = { x: ax, y: r4(baseY - S) };
	const okEnd = { x: ax, y: r4(baseY - reach) };
	const boardY = r4(baseY - reach);
	const boardHalf = Math.max(Math.abs(curEnd.x - okEnd.x) / 2 + 8, 12);
	const boardCx = (curEnd.x + okEnd.x) / 2;
	const stakeR = px(3);
	const moveLabel = result.direction === "none" ? "square" : `move ${format(result.moveAtBatterboard)} ${result.direction === "away" ? "◂" : "▸"}`;

	return (
		<>
			{/* reference line and stakes */}
			<line x1={ax} y1={baseY} x2={bx} y2={baseY} className={styles.reference} />
			<circle cx={ax} cy={baseY} r={stakeR} className={styles.stake} />
			<circle cx={bx} cy={baseY} r={stakeR} className={styles.stake} />
			<Label x={ax} y={baseY + px(12)} text="A" size={10} />
			<Label x={bx} y={baseY + px(12)} text="B" size={10} />
			<DimLine x1={ax} y1={baseY} x2={bx} y2={baseY} label={`reference ${format(referenceLength)}`} offset={px(18)} size={10} />

			{/* batterboard */}
			<Member x={r4(boardCx - boardHalf)} y={boardY - 1.2} width={r4(boardHalf * 2)} height={2.4} role="wall" />

			{/* current layout */}
			<line x1={ax} y1={baseY} x2={curEnd.x} y2={curEnd.y} className={styles.current} />
			<line x1={bx} y1={baseY} x2={curC.x} y2={curC.y} className={styles.currentDiag} />
			<circle cx={curC.x} cy={curC.y} r={stakeR * 0.8} className={styles.currentDot} />

			{/* correct layout */}
			<line x1={ax} y1={baseY} x2={okEnd.x} y2={okEnd.y} className={styles.correct} />
			<line x1={bx} y1={baseY} x2={okC.x} y2={okC.y} className={styles.correctDiag} />
			<circle cx={okC.x} cy={okC.y} r={stakeR * 0.8} className={styles.correctDot} />

			<AngleArc cx={ax} cy={baseY} radius={Math.min(14, S * 0.3)} startDeg={-90} endDeg={0} label="90°" size={9} />
			<DimLine x1={ax} y1={baseY} x2={okC.x} y2={okC.y} label={`side ${format(sideLength)}`} offset={-px(14)} extensions={false} size={9} />
			<DimLine x1={bx} y1={baseY} x2={curC.x} y2={curC.y} label={`now ${format(result.outOfSquare + result.correctDiagonal)}`} offset={px(22)} extensions={false} size={9} className={styles.currentText} />
			<DimLine x1={bx} y1={baseY} x2={okC.x} y2={okC.y} label={`correct ${format(result.correctDiagonal)}`} offset={-px(22)} extensions={false} size={9} className={styles.correctText} />

			{/* move at the batterboard */}
			{result.direction !== "none" && <DimLine x1={curEnd.x} y1={boardY - px(6)} x2={okEnd.x} y2={boardY - px(6)} label={moveLabel} extensions={false} size={10} className={styles.moveText} />}
			{result.direction === "none" && <Label x={okEnd.x} y={boardY - px(10)} text="square" size={10} />}
		</>
	);
}
