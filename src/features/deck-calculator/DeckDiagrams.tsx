"use client";

import { Diagram, DimLine, Label, Member, useDiagramScale } from "@/components/construction/Diagram";
import { inchesToMm } from "@/lib/construction/imperialUtils";
import type { Deck } from "@/lib/construction/deckUtils";
import styles from "./DeckDiagrams.module.scss";

const W = 180;
const PAD_X = 14;
const PAD_TOP = 12;
const PAD_BOTTOM = 24;
const r4 = (n: number) => Math.round(n * 1e4) / 1e4;
type Fmt = { format: (inches: number) => string };

// ── Framing plan ─────────────────────────────────────────────────────────────

export interface DeckPlanProps extends Fmt {
	deck: Deck;
	length: number;
	width: number;
	stumpSize: number;
}

export function DeckPlanDiagram(props: DeckPlanProps) {
	const { deck, length, width, format } = props;
	const k = Math.min((W - PAD_X * 2) / inchesToMm(length), 90 / inchesToMm(width));
	const height = inchesToMm(width) * k + PAD_TOP + PAD_BOTTOM + 6;
	return (
		<Diagram widthMm={W} heightMm={height} label={`Deck framing plan: ${format(length)} by ${format(width)}, ${deck.bearerCount} bearers along the length with ${deck.stumpsAlong.count} stumps each, ${deck.joistCount} joists across`}>
			<PlanScene {...props} k={k} height={height} />
		</Diagram>
	);
}

function PlanScene({ deck, length, width, stumpSize, format, k, height }: DeckPlanProps & { k: number; height: number }) {
	const { px } = useDiagramScale();
	const X = (inches: number) => r4(PAD_X + inchesToMm(inches) * k);
	const Y = (inches: number) => r4(height - PAD_BOTTOM - inchesToMm(inches) * k);
	const h = (a: number, b: number) => Math.max(r4(Y(a) - Y(b)), 0.5);
	const w = (a: number, b: number) => Math.max(r4(X(b) - X(a)), 0.5);
	const stumpMm = Math.max(inchesToMm(stumpSize) * k, 1.6);
	return (
		<>
			<rect x={X(0)} y={Y(width)} width={w(0, length)} height={h(0, width)} className={styles.outline} />
			{deck.joists.members.map((j) => (
				<Member key={`j${j.index}`} x={X(j.near)} y={Y(width)} width={w(j.near, j.far)} height={h(0, width)} role="common" />
			))}
			{deck.bearers.members.map((b) => (
				<Member key={`b${b.index}`} x={X(0)} y={Y(b.far)} width={w(0, length)} height={h(b.near, b.far)} role="ridge" />
			))}
			{deck.stumps.map((s) => {
				const b = deck.bearers.members[s.bearer - 1];
				return <rect key={`s${s.bearer}-${s.index}`} x={r4(X(s.position) - stumpMm / 2)} y={r4(Y(b.center) - stumpMm / 2)} width={stumpMm} height={stumpMm} className={styles.stump} />;
			})}
			{deck.joists.count <= 40 && deck.joists.members.map((j) => <Label key={`jn${j.index}`} x={X(j.center)} y={Y(0) + px(9)} text={`${j.index}`} size={7} className={styles.num} />)}
			{deck.stumpsAlong.members.map((s) => (
				<Label key={`sn${s.index}`} x={X(s.center)} y={Y(width) - px(4)} text={`S${s.index}`} size={7} className={styles.num} />
			))}
			{deck.bearers.members.map((b) => (
				<Label key={`bn${b.index}`} x={X(0) - px(4)} y={r4(Y(b.center) + px(3))} text={`B${b.index}`} size={7} anchor="end" className={styles.num} />
			))}
			<DimLine x1={X(0)} y1={Y(0) + px(14)} x2={X(length)} y2={Y(0) + px(14)} label={format(length)} offset={px(4)} size={9} />
			<DimLine x1={X(length) + px(6)} y1={Y(0)} x2={X(length) + px(6)} y2={Y(width)} label={format(width)} offset={-px(8)} size={9} />
		</>
	);
}

// ── Side elevation across the width, showing the fall ────────────────────────

export interface DeckElevationProps extends Fmt {
	deck: Deck;
	width: number;
	height: number;
	fall: number;
	bearerDepth: number;
	joistDepth: number;
	boardThickness: number;
	stumpSize: number;
}

export function DeckElevationDiagram(props: DeckElevationProps) {
	const { deck, width, height, fall, format } = props;
	const k = Math.min((W - PAD_X * 2) / inchesToMm(width), 80 / inchesToMm(height + fall));
	const hMm = inchesToMm(height + fall) * k + PAD_TOP + PAD_BOTTOM + 10;
	return (
		<Diagram widthMm={W} heightMm={hMm} label={`Deck elevation across ${format(width)}: ${format(height)} to the boards at the high side, ground falls ${format(fall)}, stumps from ${format(deck.stumps[0]?.length ?? 0)} to ${format(deck.stumps[deck.stumps.length - 1]?.length ?? 0)}`}>
			<ElevationScene {...props} k={k} hMm={hMm} />
		</Diagram>
	);
}

function ElevationScene({ deck, width, height, fall, bearerDepth, joistDepth, boardThickness, stumpSize, format, k, hMm }: DeckElevationProps & { k: number; hMm: number }) {
	const { px } = useDiagramScale();
	const X = (inches: number) => r4(PAD_X + inchesToMm(inches) * k);
	// y measured up from the lowest ground point
	const Y = (inches: number) => r4(hMm - PAD_BOTTOM - inchesToMm(inches + fall) * k);
	const h = (a: number, b: number) => Math.max(r4(Y(a) - Y(b)), 0.5);
	const groundAt = (x: number) => -(fall * x) / width;
	const bearerBottom = height - boardThickness - joistDepth - bearerDepth;
	const stumpW = Math.max(inchesToMm(stumpSize) * k, 1.2);
	const firstStumps = deck.stumps.filter((s) => s.index === 1);
	return (
		<>
			{/* ground */}
			<line x1={X(-6)} y1={Y(groundAt(-6))} x2={X(width + 6)} y2={Y(groundAt(width + 6))} className={styles.ground} />
			{/* stumps under each bearer */}
			{firstStumps.map((s) => {
				const b = deck.bearers.members[s.bearer - 1];
				return <Member key={s.bearer} x={r4(X(b.center) - stumpW / 2)} y={Y(bearerBottom)} width={stumpW} height={h(groundAt(b.center), bearerBottom)} role="wall" />;
			})}
			{/* bearers (end view), joist (side view), boards */}
			{deck.bearers.members.map((b) => (
				<Member key={`b${b.index}`} x={X(b.near)} y={Y(bearerBottom + bearerDepth)} width={Math.max(r4(X(b.far) - X(b.near)), 0.8)} height={h(bearerBottom, bearerBottom + bearerDepth)} role="ridge" />
			))}
			<Member x={X(0)} y={Y(height - boardThickness)} width={r4(X(width) - X(0))} height={h(bearerBottom + bearerDepth, height - boardThickness)} role="common" />
			<Member x={X(0)} y={Y(height)} width={r4(X(width) - X(0))} height={h(height - boardThickness, height)} role="tread" />
			{/* dims */}
			<DimLine x1={X(0) - px(6)} y1={Y(0)} x2={X(0) - px(6)} y2={Y(height)} label={`${format(height)} to deck`} offset={px(10)} size={9} />
			<DimLine x1={X(width) + px(6)} y1={Y(0)} x2={X(width) + px(6)} y2={Y(groundAt(width))} label={`fall ${format(fall)}`} offset={-px(10)} extensions={false} size={9} />
			{firstStumps.map((s) => {
				const b = deck.bearers.members[s.bearer - 1];
				return <Label key={`l${s.bearer}`} x={X(b.center)} y={r4(Y((groundAt(b.center) + bearerBottom) / 2) + px(3))} text={format(s.length)} size={8} rotate={-90} className={styles.num} />;
			})}
			<DimLine x1={X(0)} y1={Y(0) + px(14)} x2={X(width)} y2={Y(0) + px(14)} label={format(width)} offset={px(4)} size={9} />
		</>
	);
}
