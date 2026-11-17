"use client";

import { Diagram, DimLine, Label, Member, useDiagramScale } from "@/components/construction/Diagram";
import { inchesToMm } from "@/lib/construction/imperialUtils";
import type { DeckBoards } from "@/lib/construction/deckBoardUtils";
import styles from "./DeckBoardDiagram.module.scss";

const W = 180;
const PAD_X = 12;
const PAD_TOP = 10;
const PAD_BOTTOM = 24;
const r4 = (n: number) => Math.round(n * 1e4) / 1e4;

export interface DeckBoardDiagramProps {
	boards: DeckBoards;
	width: number;
	length: number;
	border: number;
	joistCenters: number;
	format: (inches: number) => string;
}

/** Plan of the deck: boards run left to right, rows stack up the drawing, joists dashed underneath. */
export default function DeckBoardDiagram(props: DeckBoardDiagramProps) {
	const { boards, width, length, format } = props;
	const k = Math.min((W - PAD_X * 2) / inchesToMm(length), 90 / inchesToMm(width));
	const height = inchesToMm(width) * k + PAD_TOP + PAD_BOTTOM;
	return (
		<Diagram widthMm={W} heightMm={height} label={`${boards.count} board rows across ${format(width)}, ${format(boards.gap)} gaps, first ${format(boards.firstWidth)} and last ${format(boards.lastWidth)}, joints staggered over joists at ${format(props.joistCenters)} centers`}>
			<Scene {...props} k={k} height={height} />
		</Diagram>
	);
}

function Scene({ boards, width, length, border, joistCenters, format, k, height }: DeckBoardDiagramProps & { k: number; height: number }) {
	const { px } = useDiagramScale();
	const X = (inches: number) => r4(PAD_X + inchesToMm(inches) * k);
	const Y = (inches: number) => r4(height - PAD_BOTTOM - inchesToMm(inches) * k);
	const inset = border > 0 ? boards.rows[0].near : 0;
	const joists: number[] = [];
	for (let x = 0; x <= length + 1e-9; x += joistCenters) joists.push(x);
	const h = (near: number, far: number) => Math.max(r4(Y(near) - Y(far)), 0.5);
	return (
		<>
			{/* deck outline and joists */}
			<rect x={X(0)} y={Y(width)} width={r4(X(length) - X(0))} height={r4(Y(0) - Y(width))} className={styles.outline} />
			{joists.map((x) => (
				<line key={x} x1={X(x)} y1={Y(width)} x2={X(x)} y2={Y(0)} className={styles.joist} />
			))}
			{/* border */}
			{border > 0 && (
				<>
					<Member x={X(0)} y={Y(border)} width={r4(X(length) - X(0))} height={h(0, border)} role="wall" />
					<Member x={X(0)} y={Y(width)} width={r4(X(length) - X(0))} height={h(width - border, width)} role="wall" />
					<Member x={X(0)} y={Y(width - border)} width={Math.max(r4(X(border) - X(0)), 0.5)} height={h(border, width - border)} role="wall" />
					<Member x={X(length - border)} y={Y(width - border)} width={Math.max(r4(X(length) - X(length - border)), 0.5)} height={h(border, width - border)} role="wall" />
				</>
			)}
			{/* rows */}
			{boards.rows.map((r) => {
				const ends = [inset, ...r.joints.map((j) => inset + j), inset + boards.fieldLength];
				return (
					<g key={r.index}>
						{ends.slice(0, -1).map((x0, i) => (
							<Member key={i} x={X(x0)} y={Y(r.far)} width={Math.max(r4(X(ends[i + 1]) - X(x0)) - 0.3, 0.5)} height={h(r.near, r.far)} role={r.ripped ? "hip" : "tread"} />
						))}
						{boards.count <= 40 && <Label x={X(inset) - px(5)} y={r4((Y(r.near) + Y(r.far)) / 2 + px(3))} text={`${r.index}`} size={boards.count > 24 ? 6 : 8} anchor="end" className={styles.num} />}
					</g>
				);
			})}
			{/* dims */}
			<DimLine x1={X(length) + px(6)} y1={Y(0)} x2={X(length) + px(6)} y2={Y(width)} label={format(width)} offset={-px(8)} size={9} />
			<DimLine x1={X(0)} y1={Y(0)} x2={X(length)} y2={Y(0)} label={format(length)} offset={px(14)} size={9} />
			{boards.rows.length > 1 && <DimLine x1={X(inset + boards.fieldLength / 2)} y1={Y(boards.rows[0].far)} x2={X(inset + boards.fieldLength / 2)} y2={Y(boards.rows[1].near)} label={`gap ${format(boards.gap)}`} offset={px(28)} extensions={false} size={8} />}
			{boards.rows[0].ripped && <Label x={X(inset + boards.fieldLength * 0.25)} y={r4((Y(boards.rows[0].near) + Y(boards.rows[0].far)) / 2 + px(3))} text={format(boards.rows[0].width)} size={8} className={styles.num} />}
			{boards.rows[boards.count - 1].ripped && <Label x={X(inset + boards.fieldLength * 0.25)} y={r4((Y(boards.rows[boards.count - 1].near) + Y(boards.rows[boards.count - 1].far)) / 2 + px(3))} text={format(boards.rows[boards.count - 1].width)} size={8} className={styles.num} />}
		</>
	);
}
