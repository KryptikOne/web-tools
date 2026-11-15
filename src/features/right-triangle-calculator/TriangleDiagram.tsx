"use client";

import type { KeyboardEvent } from "react";
import { Diagram, DimLine, AngleArc, Member, useDiagramScale } from "@/components/construction/Diagram";
import diagramStyles from "@/components/construction/Diagram.module.scss";
import { inchesToMm } from "@/lib/construction/imperialUtils";
import type { RightTriangle } from "@/lib/construction/pitchUtils";
import styles from "./TriangleDiagram.module.scss";

/** The five editable quantities: legs a and b, hypotenuse c, angle A opposite a, angle B opposite b. */
export type TriKey = "a" | "b" | "c" | "A" | "B";
export const TRI_KEYS: TriKey[] = ["a", "b", "c", "A", "B"];

export const TRI_NAMES: Record<TriKey, string> = {
	a: "Side a (rise)",
	b: "Side b (run)",
	c: "Side c (slope)",
	A: "Angle A (base)",
	B: "Angle B (top)",
};

export interface TriangleDiagramProps {
	/** Shape to draw; when nothing is solved yet pass a placeholder proportion. */
	shape: Pick<RightTriangle, "a" | "b">;
	/** Text shown on each label, e.g. `a = 6' 0"` or `a = ?` */
	text: Record<TriKey, string>;
	/** Keys the reader has picked as inputs */
	selected: TriKey[];
	onPick: (key: TriKey) => void;
	label: string;
}

export const DRAWING_WIDTH_MM = 180;
const PAD = 26;
const AVAIL_W = DRAWING_WIDTH_MM - PAD * 2;
const AVAIL_H = 100;

/** Rounded so server and browser trig agree to the digit and hydration stays clean. */
const r4 = (n: number) => Math.round(n * 1e4) / 1e4;

export default function TriangleDiagram(props: TriangleDiagramProps) {
	const { shape } = props;
	const aMm = inchesToMm(shape.a);
	const bMm = inchesToMm(shape.b);
	const k = Math.min(AVAIL_W / bMm, AVAIL_H / aMm);
	const ah = aMm * k;
	const height = Math.max(ah, 36) + PAD * 2;
	return (
		<Diagram widthMm={DRAWING_WIDTH_MM} heightMm={height} label={props.label} maxWidth="720px" interactive>
			<Scene {...props} bw={bMm * k} ah={ah} height={height} />
		</Diagram>
	);
}

function Scene({ text, selected, onPick, bw, ah, height }: TriangleDiagramProps & { bw: number; ah: number; height: number }) {
	const { px } = useDiagramScale();
	// A bottom-left (base angle), C bottom-right (right angle), B top-right
	const baseY = height - PAD;
	const ax = PAD;
	const cx = PAD + bw;
	const by = baseY - ah;
	const angleA = (Math.atan2(ah, bw) * 180) / Math.PI;
	const arcR = Math.min(20, Math.max(8, Math.min(bw, ah) * 0.3));
	const hyp = Math.hypot(bw, ah) || 1;
	// Outward unit normal of the hypotenuse (away from the triangle)
	const nx = -ah / hyp;
	const ny = -bw / hyp;
	const labelR = arcR + px(14);
	const midA = (-angleA / 2) * (Math.PI / 180);
	const midB = ((90 + 180 - angleA) / 2) * (Math.PI / 180);
	const sq = Math.min(5, bw * 0.3, ah * 0.3);

	return (
		<>
			<Member x={ax - 6} y={baseY} width={bw + 12} height={1.5} role="wall" />
			<path d={`M ${ax} ${baseY} L ${cx} ${baseY} L ${cx} ${by} Z`} className={`${diagramStyles.member} ${diagramStyles["role-common"]}`} />
			<path d={`M ${cx - sq} ${baseY} L ${cx - sq} ${baseY - sq} L ${cx} ${baseY - sq}`} className={diagramStyles.dimLine} />

			<DimLine x1={ax} y1={baseY} x2={cx} y2={baseY} label="" offset={10} />
			<DimLine x1={cx} y1={baseY} x2={cx} y2={by} label="" offset={10} />
			<DimLine x1={ax} y1={baseY} x2={cx} y2={by} label="" offset={-6} extensions={false} />
			<AngleArc cx={ax} cy={baseY} radius={arcR} startDeg={-angleA} endDeg={0} label="" />
			<AngleArc cx={cx} cy={by} radius={arcR} startDeg={90} endDeg={180 - angleA} label="" />

			<PickLabel x={ax + bw / 2} y={baseY + 10 + px(7)} anchor="middle" k="b" text={text.b} selected={selected} onPick={onPick} />
			<PickLabel x={cx + 10 + px(7)} y={baseY - ah / 2} anchor="middle" rotate={-90} k="a" text={text.a} selected={selected} onPick={onPick} />
			<PickLabel x={r4((ax + cx) / 2 + nx * (6 + px(8)))} y={r4((baseY + by) / 2 + ny * (6 + px(8)))} anchor="middle" k="c" text={text.c} selected={selected} onPick={onPick} />
			<PickLabel x={r4(ax + labelR * Math.cos(midA))} y={r4(baseY + labelR * Math.sin(midA))} anchor="start" k="A" text={text.A} selected={selected} onPick={onPick} />
			<PickLabel x={r4(cx + labelR * Math.cos(midB))} y={r4(by + labelR * Math.sin(midB))} anchor="end" k="B" text={text.B} selected={selected} onPick={onPick} />
		</>
	);
}

interface PickLabelProps {
	x: number;
	y: number;
	anchor: "start" | "middle" | "end";
	/** Degrees, for a label running along a vertical side */
	rotate?: number;
	k: TriKey;
	text: string;
	selected: TriKey[];
	onPick: (key: TriKey) => void;
}

/** A side or angle readout that doubles as the button which makes it an input. */
function PickLabel({ x, y, anchor, rotate, k, text, selected, onPick }: PickLabelProps) {
	const { px } = useDiagramScale();
	const fs = px(11);
	const padX = fs * 0.5;
	const w = text.length * fs * 0.62 + padX * 2;
	const h = fs * 1.6;
	const left = anchor === "start" ? x - padX : anchor === "end" ? x - w + padX : x - w / 2;
	const picked = selected.includes(k);
	const onKey = (e: KeyboardEvent<SVGGElement>) => {
		if (e.key === "Enter" || e.key === " ") {
			e.preventDefault();
			onPick(k);
		}
	};
	return (
		<g
			role="button"
			tabIndex={0}
			aria-pressed={picked}
			aria-label={`${TRI_NAMES[k]}: ${text.replace(/^\S+ = /, "")}. ${picked ? "An input, click to drop it" : "Click to make it an input"}`}
			className={`${styles.pick} ${picked ? styles.picked : ""}`}
			onClick={() => onPick(k)}
			onKeyDown={onKey}
			transform={rotate ? `rotate(${rotate} ${x} ${y})` : undefined}
		>
			<rect x={r4(left)} y={r4(y - h / 2)} width={r4(w)} height={r4(h)} className={styles.pickBox} />
			<text x={x} y={y} textAnchor={anchor} fontSize={fs} className={styles.pickText}>
				{text}
			</text>
		</g>
	);
}
