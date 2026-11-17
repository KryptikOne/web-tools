"use client";

import { Diagram, DimLine, Label, Member, useDiagramScale } from "@/components/construction/Diagram";
import { inchesToMm } from "@/lib/construction/imperialUtils";
import type { ShelfLayout } from "@/lib/construction/shelfUtils";
import styles from "./ShelfDiagrams.module.scss";

const r4 = (n: number) => Math.round(n * 1e4) / 1e4;
type Fmt = { format: (inches: number) => string };

// ── Carcass elevation ────────────────────────────────────────────────────────

export interface CarcassDiagramProps extends Fmt {
	layout: ShelfLayout;
	insideHeight: number;
	insideWidth: number;
	thickness: number;
	sideThickness: number;
}

const PAD = 16;

export function CarcassDiagram(props: CarcassDiagramProps) {
	const { layout, insideHeight, insideWidth, sideThickness, format } = props;
	const totalW = insideWidth + 2 * sideThickness;
	const totalH = insideHeight + 2 * sideThickness;
	const k = Math.min((120 - PAD * 2) / inchesToMm(totalW), (130 - PAD * 2) / inchesToMm(totalH));
	const w = inchesToMm(totalW) * k + PAD * 2 + 30;
	const h = inchesToMm(totalH) * k + PAD * 2;
	return (
		<Diagram widthMm={w} heightMm={h} label={`Carcass ${format(insideHeight)} inside with ${layout.shelfCount} shelves and ${layout.openings.length} openings from ${format(layout.openings[0].height)} at the top to ${format(layout.openings[layout.openings.length - 1].height)} at the bottom`} maxWidth="520px">
			<CarcassScene {...props} k={k} totalH={totalH} />
		</Diagram>
	);
}

function CarcassScene({ layout, insideHeight, insideWidth, thickness, sideThickness, format, k, totalH }: CarcassDiagramProps & { k: number; totalH: number }) {
	const { px } = useDiagramScale();
	const X = (inches: number) => r4(PAD + inchesToMm(inches + sideThickness) * k);
	const Y = (inches: number) => r4(PAD + inchesToMm(totalH - sideThickness - inches) * k);
	const sideMm = Math.max(r4(inchesToMm(sideThickness) * k), 0.8);
	const shelfMm = Math.max(r4(inchesToMm(thickness) * k), 0.6);
	return (
		<>
			<Member x={X(-sideThickness)} y={Y(insideHeight + sideThickness)} width={sideMm} height={r4(Y(-sideThickness) - Y(insideHeight + sideThickness))} role="wall" />
			<Member x={X(insideWidth)} y={Y(insideHeight + sideThickness)} width={sideMm} height={r4(Y(-sideThickness) - Y(insideHeight + sideThickness))} role="wall" />
			<Member x={X(-sideThickness)} y={Y(insideHeight + sideThickness)} width={r4(X(insideWidth + sideThickness) - X(-sideThickness))} height={sideMm} role="wall" />
			<Member x={X(-sideThickness)} y={Y(0)} width={r4(X(insideWidth + sideThickness) - X(-sideThickness))} height={sideMm} role="wall" />
			{layout.shelves.map((s) => (
				<g key={s.index}>
					<Member x={X(0)} y={Y(s.top)} width={r4(X(insideWidth) - X(0))} height={shelfMm} role="tread" />
					<Label x={X(0) - px(4) - sideMm} y={r4(Y(s.center) + px(3))} text={`${s.index}`} size={7} anchor="end" className={styles.num} />
				</g>
			))}
			{layout.openings.map((o) => (
				<DimLine key={o.index} x1={X(insideWidth) + sideMm + px(3)} y1={Y(o.bottom)} x2={X(insideWidth) + sideMm + px(3)} y2={Y(o.top)} label={format(o.height)} offset={-px(10)} extensions={false} size={layout.openings.length > 8 ? 6 : 8} />
			))}
			<DimLine x1={X(-sideThickness) - px(6)} y1={Y(0)} x2={X(-sideThickness) - px(6)} y2={Y(insideHeight)} label={format(insideHeight)} offset={px(10)} extensions={false} size={8} />
		</>
	);
}

// ── Story stick, true size in segments ───────────────────────────────────────

export interface StoryStickProps extends Fmt {
	layout: ShelfLayout;
	insideHeight: number;
	thickness: number;
	segmentMm?: number;
}

const STICK_W = 56;

/** Shelf positions at true size from the inside bottom, in segments that each fit a sheet. */
export function StoryStickDiagrams({ layout, insideHeight, thickness, segmentMm = 250, format }: StoryStickProps) {
	const total = inchesToMm(insideHeight);
	const segments = Math.max(1, Math.ceil(total / segmentMm));
	if (segments > 12) return null;
	const per = total / segments;
	return (
		<>
			{Array.from({ length: segments }, (_, s) => {
				const from = (s * per) / 25.4;
				const to = Math.min(insideHeight, ((s + 1) * per) / 25.4);
				return (
					<Diagram key={s} widthMm={STICK_W} heightMm={inchesToMm(to - from) + 20} label={`Story stick segment ${s + 1} of ${segments}: ${format(from)} to ${format(to)} from the inside bottom, true size`} maxWidth="240px">
						<StickScene layout={layout} thickness={thickness} from={from} to={to} segment={s + 1} segments={segments} format={format} />
					</Diagram>
				);
			})}
		</>
	);
}

function StickScene({ layout, thickness, from, to, segment, segments, format }: { layout: ShelfLayout; thickness: number; from: number; to: number; segment: number; segments: number } & Fmt) {
	const { px } = useDiagramScale();
	const PADS = 10;
	const Y = (inches: number) => r4(PADS + inchesToMm(to - inches));
	const x0 = 6;
	const x1 = 22;
	const visible = layout.shelves.filter((s) => s.top >= from - 1e-9 && s.underside <= to + 1e-9);
	return (
		<>
			<rect x={x0} y={Y(to)} width={x1 - x0} height={r4(Y(from) - Y(to))} className={styles.stick} />
			{visible.map((s) => (
				<g key={s.index}>
					<rect x={x0} y={Y(Math.min(s.top, to))} width={x1 - x0} height={r4(Y(Math.max(s.underside, from)) - Y(Math.min(s.top, to)))} className={styles.shelfBand} />
					<line x1={x0 - 3} y1={Y(s.underside)} x2={x1 + 3} y2={Y(s.underside)} className={styles.mark} />
					<Label x={x1 + px(5)} y={r4(Y(s.underside) + px(3))} text={`${s.index}  ${format(s.underside)}`} size={7} anchor="start" />
				</g>
			))}
			<Label x={x0} y={Y(from) + px(9)} text={segment > 1 ? `join to ${segment - 1}` : format(from)} size={7} anchor="start" className={styles.num} />
			<Label x={x0} y={Y(to) - px(3)} text={segment < segments ? `join to ${segment + 1}` : format(to)} size={7} anchor="start" className={styles.num} />
			<Label x={x0} y={Y(from) + px(17)} text={`shelf ${format(thickness)}`} size={6} anchor="start" className={styles.num} />
		</>
	);
}
