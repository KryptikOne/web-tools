"use client";

import { Diagram, DimLine, AngleArc, Label, Member, useDiagramScale } from "@/components/construction/Diagram";
import { inchesToMm } from "@/lib/construction/imperialUtils";
import type { Diminishing, GoldenRatio } from "@/lib/construction/geometryUtils";
import { formatAngle } from "@/lib/construction/pitchUtils";
import styles from "./GoldenDiagrams.module.scss";

const W = 180;
const PAD = 14;
const r4 = (n: number) => Math.round(n * 1e4) / 1e4;
type Fmt = { format: (inches: number) => string };

// ── Members under a rake ─────────────────────────────────────────────────────

export interface DiminishingDiagramProps extends Fmt {
	result: Diminishing;
	centers: number;
	memberWidth: number;
}

export function DiminishingDiagram({ result, centers, memberWidth, format }: DiminishingDiagramProps) {
	const run = Math.max(result.positions[result.positions.length - 1] + memberWidth, centers);
	const maxLen = Math.max(...result.lengths, 1);
	const k = Math.min((W - PAD * 2) / inchesToMm(run), 90 / inchesToMm(maxLen));
	const height = inchesToMm(maxLen) * k + PAD * 2 + 14;
	return (
		<Diagram widthMm={W} heightMm={height} label={`${result.count} members from ${format(result.lengths[0])} to ${format(result.lengths[result.count - 1])} at ${format(centers)} centers under a ${formatAngle(result.cutAngle, 1)} line`}>
			<DimScene result={result} centers={centers} memberWidth={memberWidth} k={k} height={height} maxLen={maxLen} format={format} />
		</Diagram>
	);
}

function DimScene({ result, memberWidth, format, k, height, maxLen }: DiminishingDiagramProps & { k: number; height: number; maxLen: number }) {
	const { px } = useDiagramScale();
	const X = (inches: number) => r4(PAD + inchesToMm(inches) * k);
	const Y = (inches: number) => r4(height - PAD - 14 + 0 - inchesToMm(inches) * k);
	const w = Math.max(r4(inchesToMm(memberWidth) * k), 1);
	const first = result.positions[0];
	const last = result.positions[result.count - 1];
	const many = result.count > 30;
	return (
		<>
			{result.lengths.map((len, i) => {
				const h = Math.max(0, len);
				return (
					<g key={i}>
						<Member x={X(result.positions[i])} y={Y(h)} width={w} height={Math.max(r4(Y(0) - Y(h)), 0.5)} role="common" />
						{!many && <Label x={X(result.positions[i]) + w / 2} y={Y(h) - px(3)} text={format(len)} size={6} className={styles.num} />}
					</g>
				);
			})}
			<line x1={X(first)} y1={Y(result.lengths[0])} x2={X(last) + w} y2={Y(result.lengths[result.count - 1] + (memberWidth * (result.lengths[1] - result.lengths[0])) / Math.max(1e-9, result.positions[1] ?? 1))} className={styles.rake} />
			<line x1={X(first) - 4} y1={Y(0)} x2={X(last) + w + 4} y2={Y(0)} className={styles.base} />
			<DimLine x1={X(first)} y1={Y(0)} x2={X(last)} y2={Y(0)} label={format(last - first)} offset={px(12)} size={9} />
			{result.count > 1 && <DimLine x1={X(result.positions[0])} y1={Y(0) + px(2)} x2={X(result.positions[1])} y2={Y(0) + px(2)} label={format(result.positions[1] - result.positions[0])} offset={px(24)} extensions={false} size={8} />}
			<AngleArc cx={X(first)} cy={Y(result.lengths[0])} radius={r4(Math.min(14, inchesToMm(maxLen) * k * 0.3))} startDeg={result.lengths[1] > result.lengths[0] ? -result.cutAngle : 0} endDeg={result.lengths[1] > result.lengths[0] ? 0 : result.cutAngle} label={formatAngle(result.cutAngle, 1)} size={8} />
		</>
	);
}

// ── Golden rectangle with spiral ─────────────────────────────────────────────

export interface GoldenDiagramProps extends Fmt {
	ratio: GoldenRatio;
	/** Draw the rectangle with this long side */
	longSide: number;
}

export function GoldenRectangleDiagram({ ratio, longSide, format }: GoldenDiagramProps) {
	const shortSide = longSide / ratio.ratio;
	const k = Math.min((W - PAD * 2) / inchesToMm(longSide), 90 / inchesToMm(shortSide));
	const height = inchesToMm(shortSide) * k + PAD * 2 + 10;
	return (
		<Diagram widthMm={W} heightMm={height} label={`Golden rectangle ${format(longSide)} by ${format(shortSide)} with the spiral through its nested squares`}>
			<GoldenScene ratio={ratio} longSide={longSide} shortSide={shortSide} k={k} height={height} format={format} />
		</Diagram>
	);
}

function GoldenScene({ ratio, longSide, shortSide, k, height, format }: GoldenDiagramProps & { shortSide: number; k: number; height: number }) {
	const { px } = useDiagramScale();
	const X = (inches: number) => r4(PAD + inchesToMm(inches) * k);
	const Y = (inches: number) => r4(height - PAD - 10 - inchesToMm(inches) * k);
	// nested squares: start with the whole rectangle, peel a square off the long side each time, turning clockwise
	let x0 = 0;
	let y0 = 0;
	let w = longSide;
	let h = shortSide;
	let dir = 0; // 0 square on the left, 1 top, 2 right, 3 bottom
	const squares: { x: number; y: number; s: number; dir: number }[] = [];
	for (let i = 0; i < 7 && Math.min(w, h) > longSide / 200; i++) {
		if (w >= h) {
			const s = h;
			if (dir === 0) {
				squares.push({ x: x0, y: y0, s, dir });
				x0 += s;
			} else {
				squares.push({ x: x0 + w - s, y: y0, s, dir });
			}
			w -= s;
		} else {
			const s = w;
			if (dir === 1) {
				squares.push({ x: x0, y: y0 + h - s, s, dir });
			} else {
				squares.push({ x: x0, y: y0, s, dir });
				y0 += s;
			}
			h -= s;
		}
		dir = (dir + 1) % 4;
	}
	// quarter arcs: each square gets a quarter circle of radius s centred on the corner that touches the next square
	const arcs = squares.map((sq) => {
		const r = r4(inchesToMm(sq.s) * k);
		let start: [number, number];
		let end: [number, number];
		switch (sq.dir) {
			case 0:
				start = [sq.x, sq.y + sq.s];
				end = [sq.x + sq.s, sq.y];
				break;
			case 1:
				start = [sq.x, sq.y];
				end = [sq.x + sq.s, sq.y + sq.s];
				break;
			case 2:
				start = [sq.x + sq.s, sq.y];
				end = [sq.x, sq.y + sq.s];
				break;
			default:
				start = [sq.x + sq.s, sq.y + sq.s];
				end = [sq.x, sq.y];
		}
		return `M ${X(start[0])} ${Y(start[1])} A ${r} ${r} 0 0 1 ${X(end[0])} ${Y(end[1])}`;
	});
	return (
		<>
			<rect x={X(0)} y={Y(shortSide)} width={r4(X(longSide) - X(0))} height={r4(Y(0) - Y(shortSide))} className={styles.rect} />
			{squares.map((sq, i) => (
				<rect key={i} x={X(sq.x)} y={Y(sq.y + sq.s)} width={r4(X(sq.x + sq.s) - X(sq.x))} height={r4(Y(sq.y) - Y(sq.y + sq.s))} className={styles.square} />
			))}
			<path d={arcs.join(" ")} className={styles.spiral} />
			<DimLine x1={X(0)} y1={Y(0)} x2={X(longSide)} y2={Y(0)} label={format(longSide)} offset={px(12)} size={9} />
			<DimLine x1={X(longSide) + px(4)} y1={Y(0)} x2={X(longSide) + px(4)} y2={Y(shortSide)} label={format(shortSide)} offset={-px(8)} extensions={false} size={9} />
			<DimLine x1={X(0)} y1={Y(shortSide)} x2={X(shortSide)} y2={Y(shortSide)} label={format(shortSide)} offset={-px(8)} extensions={false} size={8} />
			<DimLine x1={X(shortSide)} y1={Y(shortSide)} x2={X(longSide)} y2={Y(shortSide)} label={format(longSide - shortSide)} offset={-px(8)} extensions={false} size={8} />
			<Label x={X(longSide / 2)} y={Y(shortSide) - px(16)} text={`1 : ${ratio.ratio.toFixed(3)}`} size={9} className={styles.num} />
		</>
	);
}
