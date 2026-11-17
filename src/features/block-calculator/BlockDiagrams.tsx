"use client";

import { Diagram, DimLine, Label, Member, useDiagramScale } from "@/components/construction/Diagram";
import { inchesToMm } from "@/lib/construction/imperialUtils";
import type { BlockOpening, BlockWall } from "@/lib/construction/blockUtils";
import styles from "./BlockDiagrams.module.scss";

const W = 180;
const PAD_X = 12;
const PAD_TOP = 10;
const PAD_BOTTOM = 22;
const r4 = (n: number) => Math.round(n * 1e4) / 1e4;
type Fmt = { format: (inches: number) => string };

// ── Wall elevation in running bond ───────────────────────────────────────────

export interface BlockWallDiagramProps extends Fmt {
	wall: BlockWall;
	length: number;
	blockLength: number;
	blockHeight: number;
	joint: number;
	openings: BlockOpening[];
}

export function BlockWallDiagram(props: BlockWallDiagramProps) {
	const { wall, length, format } = props;
	const drawLength = Math.min(length, 480);
	const k = (W - PAD_X * 2) / inchesToMm(drawLength);
	const drawCourses = Math.min(wall.courses, 16);
	const height = Math.max(inchesToMm(drawCourses * wall.gaugeHeight) * k, 16) + PAD_TOP + PAD_BOTTOM;
	return (
		<Diagram widthMm={W} heightMm={height} label={`Block wall elevation: ${drawCourses} courses of ${wall.blocksPerCourse.toFixed(1)} blocks over ${format(drawLength)} in running bond with ${props.openings.reduce((s, o) => s + o.count, 0)} openings${length > drawLength ? ", first 40 ft drawn" : ""}`}>
			<WallScene {...props} drawLength={drawLength} drawCourses={drawCourses} k={k} height={height} />
		</Diagram>
	);
}

function WallScene({ wall, drawLength, blockLength, blockHeight, joint, openings, format, drawCourses, k, height }: BlockWallDiagramProps & { drawLength: number; drawCourses: number; k: number; height: number }) {
	const { px } = useDiagramScale();
	const X = (inches: number) => r4(PAD_X + inchesToMm(inches) * k);
	const Y = (inches: number) => r4(height - PAD_BOTTOM - inchesToMm(inches) * k);
	const bh = Math.max(r4(inchesToMm(blockHeight) * k), 0.8);
	const pitch = blockLength + joint;
	// openings spread evenly along the drawn length, sills at 0 for doors (height ≥ 72) else at 36
	const spread: { x: number; w: number; sill: number; h: number }[] = [];
	const all = openings.flatMap((o) => Array.from({ length: Math.min(o.count, 20) }, () => o)).filter((o) => o.width > 0 && o.height > 0);
	all.forEach((o, i) => {
		const x = ((i + 1) * drawLength) / (all.length + 1) - o.width / 2;
		spread.push({ x: Math.max(0, Math.min(drawLength - o.width, x)), w: o.width, sill: o.height >= 72 ? 0 : Math.max(0, Math.min(36, wall.wallHeight - o.height)), h: o.height });
	});
	const inOpening = (x0: number, x1: number, y0: number, y1: number) => spread.some((o) => x1 > o.x + 1e-6 && x0 < o.x + o.w - 1e-6 && y1 > o.sill + 1e-6 && y0 < o.sill + o.h - 1e-6);
	const units: { x: number; y: number; w: number; half: boolean }[] = [];
	for (let c = 0; c < drawCourses; c++) {
		const y0 = c * wall.gaugeHeight + joint;
		let x = 0;
		if (c % 2 === 1) {
			units.push({ x: 0, y: y0, w: blockLength / 2, half: true });
			x = blockLength / 2 + joint;
		}
		let guard = 0;
		while (x < drawLength - 1e-9 && guard++ < 2000) {
			const w = Math.min(blockLength, drawLength - x);
			units.push({ x, y: y0, w, half: w < blockLength - 1e-6 });
			x += w + joint;
		}
	}
	return (
		<>
			{units
				.filter((u) => !inOpening(u.x, u.x + u.w, u.y, u.y + blockHeight))
				.map((u, i) => (
					<Member key={i} x={X(u.x)} y={Y(u.y + blockHeight)} width={Math.max(r4(X(u.x + u.w) - X(u.x)), 0.5)} height={bh} role={u.half ? "hip" : "common"} />
				))}
			{spread.map((o, i) => (
				<rect key={`o${i}`} x={X(o.x)} y={Y(o.sill + o.h)} width={r4(X(o.x + o.w) - X(o.x))} height={r4(Y(o.sill) - Y(o.sill + o.h))} className={styles.opening} />
			))}
			<DimLine x1={X(0)} y1={Y(0)} x2={X(drawLength)} y2={Y(0)} label={format(drawLength)} offset={px(14)} size={9} />
			<DimLine x1={X(drawLength) + px(4)} y1={Y(0)} x2={X(drawLength) + px(4)} y2={Y(drawCourses * wall.gaugeHeight)} label={`${drawCourses} courses`} offset={-px(8)} size={8} />
			{drawCourses >= 1 && <Label x={X(pitch / 2)} y={Y(joint + blockHeight / 2) + px(3)} text={format(blockLength)} size={7} className={styles.num} />}
		</>
	);
}

// ── Block section with cores ─────────────────────────────────────────────────

export interface BlockSectionProps extends Fmt {
	length: number;
	width: number;
	cores: number;
	/** Cores that are grouted, drawn filled */
	groutEveryNth: number;
}

/** Plan view of one block at true size with its cores. */
export function BlockSectionDiagram({ length, width, cores, groutEveryNth, format }: BlockSectionProps) {
	const PAD = 14;
	const w = inchesToMm(length);
	const h = inchesToMm(width);
	return (
		<Diagram widthMm={w + PAD * 2} heightMm={h + PAD * 2 + 10} label={`Block plan: ${format(length)} by ${format(width)} with ${cores} cores${groutEveryNth > 0 ? `, every ${groutEveryNth === 1 ? "core" : `${groutEveryNth}th core`} grouted` : ""}, true size`} maxWidth="520px">
			<SectionScene length={length} width={width} cores={cores} groutEveryNth={groutEveryNth} pad={PAD} format={format} />
		</Diagram>
	);
}

function SectionScene({ length, width, cores, groutEveryNth, pad, format }: BlockSectionProps & { pad: number }) {
	const { px } = useDiagramScale();
	const X = (inches: number) => r4(pad + inchesToMm(inches));
	const Y = (inches: number) => r4(pad + inchesToMm(inches));
	const shell = Math.min(1.25, width / 4);
	const web = Math.min(1, length / 8);
	const n = Math.max(0, Math.min(cores, 4));
	const coreW = n > 0 ? (length - 2 * shell - (n - 1) * web) / n : 0;
	return (
		<>
			<rect x={X(0)} y={Y(0)} width={r4(X(length) - X(0))} height={r4(Y(width) - Y(0))} className={styles.block} />
			{Array.from({ length: n }, (_, i) => {
				const x0 = shell + i * (coreW + web);
				const grouted = groutEveryNth > 0 && i % groutEveryNth === 0;
				return <rect key={i} x={X(x0)} y={Y(shell)} width={r4(X(x0 + coreW) - X(x0))} height={r4(Y(width - shell) - Y(shell))} className={grouted ? styles.grout : styles.core} />;
			})}
			<DimLine x1={X(0)} y1={Y(width)} x2={X(length)} y2={Y(width)} label={format(length)} offset={px(12)} size={9} />
			<DimLine x1={X(length)} y1={Y(0)} x2={X(length)} y2={Y(width)} label={format(width)} offset={-px(10)} size={9} />
		</>
	);
}
