"use client";

import { Diagram, DimLine, Label, Member, useDiagramScale } from "@/components/construction/Diagram";
import { inchesToMm } from "@/lib/construction/imperialUtils";
import type { RebarGrid } from "@/lib/construction/rebarUtils";
import styles from "./RebarDiagrams.module.scss";

const W = 180;
const PAD_X = 14;
const PAD_TOP = 12;
const PAD_BOTTOM = 24;
const r4 = (n: number) => Math.round(n * 1e4) / 1e4;
type Fmt = { format: (inches: number) => string };

// ── Plan of the grid or cage ─────────────────────────────────────────────────

export interface RebarPlanProps extends Fmt {
	grid: RebarGrid;
	length: number;
	width: number;
	cover: number;
	diameter: number;
}

export function RebarPlanDiagram(props: RebarPlanProps) {
	const { grid, length, width, format } = props;
	const k = Math.min((W - PAD_X * 2) / inchesToMm(length), 90 / inchesToMm(width));
	const height = inchesToMm(width) * k + PAD_TOP + PAD_BOTTOM;
	return (
		<Diagram widthMm={W} heightMm={height} label={`Rebar plan: ${grid.along.count} bars along ${format(length)}${grid.across ? ` and ${grid.across.count} across ${format(width)}` : ""}${grid.ties ? `, ${grid.ties.count} ties` : ""}, ${format(props.cover)} cover`}>
			<PlanScene {...props} k={k} height={height} />
		</Diagram>
	);
}

function PlanScene({ grid, length, width, cover, diameter, format, k, height }: RebarPlanProps & { k: number; height: number }) {
	const { px } = useDiagramScale();
	const X = (inches: number) => r4(PAD_X + inchesToMm(inches) * k);
	const Y = (inches: number) => r4(height - PAD_BOTTOM - inchesToMm(inches) * k);
	const bar = Math.max(r4(inchesToMm(diameter) * k), 0.7);
	const many = grid.along.count + (grid.across?.count ?? 0) > 80;
	return (
		<>
			<rect x={X(0)} y={Y(width)} width={r4(X(length) - X(0))} height={r4(Y(0) - Y(width))} className={styles.edge} />
			<rect x={X(cover)} y={Y(width - cover)} width={r4(X(length - cover) - X(cover))} height={r4(Y(cover) - Y(width - cover))} className={styles.cover} />
			{grid.across?.positions.map((x, i) => <Member key={`a${i}`} x={r4(X(x) - bar / 2)} y={Y(width - cover)} width={bar} height={r4(Y(cover) - Y(width - cover))} role="ridge" />)}
			{grid.ties?.positions.map((x, i) => <Member key={`t${i}`} x={r4(X(x) - bar / 2)} y={Y(width - cover)} width={bar} height={r4(Y(cover) - Y(width - cover))} role="hip" />)}
			{grid.along.positions.map((y, i) => (
				<g key={`l${i}`}>
					<Member x={X(cover)} y={r4(Y(y) - bar / 2)} width={r4(X(length - cover) - X(cover))} height={bar} role="common" />
					{!many && <Label x={X(cover) - px(4)} y={r4(Y(y) + px(3))} text={`${i + 1}`} size={7} anchor="end" className={styles.num} />}
				</g>
			))}
			{!many && grid.across?.positions.map((x, i) => <Label key={`an${i}`} x={X(x)} y={Y(width - cover) - px(3)} text={`${i + 1}`} size={7} className={styles.num} />)}
			<DimLine x1={X(0)} y1={Y(0)} x2={X(length)} y2={Y(0)} label={format(length)} offset={px(14)} size={9} />
			<DimLine x1={X(length) + px(6)} y1={Y(0)} x2={X(length) + px(6)} y2={Y(width)} label={format(width)} offset={-px(8)} size={9} />
			{grid.along.positions.length > 1 && <DimLine x1={X(length - cover) + px(2)} y1={Y(grid.along.positions[0])} x2={X(length - cover) + px(2)} y2={Y(grid.along.positions[1])} label={format(grid.along.positions[1] - grid.along.positions[0])} offset={-px(6)} extensions={false} size={8} />}
			{grid.across && grid.across.positions.length > 1 && <DimLine x1={X(grid.across.positions[0])} y1={Y(cover) - px(2)} x2={X(grid.across.positions[1])} y2={Y(cover) - px(2)} label={format(grid.across.positions[1] - grid.across.positions[0])} offset={px(8)} extensions={false} size={8} />}
			<DimLine x1={X(0)} y1={Y(width / 2)} x2={X(cover)} y2={Y(width / 2)} label={`cover ${format(cover)}`} offset={-px(10)} extensions={false} size={8} />
		</>
	);
}

// ── Section with cover and the lap detail, true size where it fits ───────────

export interface RebarSectionProps extends Fmt {
	width: number;
	depth: number;
	cover: number;
	diameter: number;
	/** Bars across the section (along-bars seen end on) */
	positions: number[];
	/** Ties drawn as a loop for a footing */
	ties: boolean;
	tieDiameter: number;
}

export function RebarSectionDiagram({ width, depth, cover, diameter, positions, ties, tieDiameter, format }: RebarSectionProps) {
	const k = Math.min(1, 150 / inchesToMm(width), 60 / inchesToMm(depth));
	const PAD = 14;
	const w = inchesToMm(width) * k + PAD * 2;
	const h = inchesToMm(depth) * k + PAD * 2 + 10;
	return (
		<Diagram widthMm={w} heightMm={h} label={`Section ${format(width)} wide by ${format(depth)} deep with ${positions.length} bars at ${format(cover)} cover${ties ? " inside a tie" : ""}, ${k === 1 ? "true size" : "drawn to fit"}`} maxWidth="640px">
			<SectionScene width={width} depth={depth} cover={cover} diameter={diameter} positions={positions} ties={ties} tieDiameter={tieDiameter} k={k} pad={PAD} format={format} />
		</Diagram>
	);
}

function SectionScene({ width, depth, cover, diameter, positions, ties, tieDiameter, k, pad, format }: RebarSectionProps & { k: number; pad: number }) {
	const { px } = useDiagramScale();
	const X = (inches: number) => r4(pad + inchesToMm(inches) * k);
	const Y = (inches: number) => r4(pad + inchesToMm(depth - inches) * k);
	const r = Math.max(r4((inchesToMm(diameter) * k) / 2), 0.6);
	const barY = ties ? cover + tieDiameter + diameter / 2 : depth / 2;
	return (
		<>
			<rect x={X(0)} y={Y(depth)} width={r4(X(width) - X(0))} height={r4(Y(0) - Y(depth))} className={styles.concrete} />
			{ties && <rect x={X(cover)} y={Y(depth - cover)} width={r4(X(width - cover) - X(cover))} height={r4(Y(cover) - Y(depth - cover))} className={styles.tie} />}
			{positions.map((x, i) => (
				<circle key={i} cx={X(x)} cy={Y(barY)} r={r} className={styles.bar} />
			))}
			{ties && positions.map((x, i) => <circle key={`t${i}`} cx={X(x)} cy={Y(depth - barY)} r={r} className={styles.bar} />)}
			<DimLine x1={X(0)} y1={Y(0)} x2={X(width)} y2={Y(0)} label={format(width)} offset={px(14)} size={9} />
			<DimLine x1={X(width) + px(4)} y1={Y(0)} x2={X(width) + px(4)} y2={Y(depth)} label={format(depth)} offset={-px(8)} size={9} />
			<DimLine x1={X(0)} y1={Y(barY)} x2={X(cover)} y2={Y(barY)} label={format(cover)} offset={-px(8)} extensions={false} size={8} />
			{!ties && <DimLine x1={X(positions[0] ?? cover)} y1={Y(barY)} x2={X(positions[0] ?? cover)} y2={Y(0)} label={format(barY)} offset={px(8)} extensions={false} size={8} />}
		</>
	);
}

// ── Lap detail ───────────────────────────────────────────────────────────────

export function LapDiagram({ lap, diameter, format }: { lap: number; diameter: number } & Fmt) {
	const k = Math.min(1, 140 / inchesToMm(lap * 1.8));
	const PAD = 12;
	const w = inchesToMm(lap * 1.8) * k + PAD * 2;
	const h = inchesToMm(diameter * 2) * k + PAD * 2 + 14;
	return (
		<Diagram widthMm={w} heightMm={h} label={`Lap splice: bars overlap ${format(lap)}, ${k === 1 ? "true size" : "drawn to fit"}`} maxWidth="640px">
			<LapScene lap={lap} diameter={diameter} k={k} pad={PAD} format={format} />
		</Diagram>
	);
}

function LapScene({ lap, diameter, k, pad, format }: { lap: number; diameter: number; k: number; pad: number } & Fmt) {
	const { px } = useDiagramScale();
	const X = (inches: number) => r4(pad + inchesToMm(inches) * k);
	const d = Math.max(r4(inchesToMm(diameter) * k), 1);
	const total = lap * 1.8;
	const start = (total - lap) / 2;
	return (
		<>
			<Member x={X(0)} y={pad} width={r4(X(start + lap) - X(0))} height={d} role="common" />
			<Member x={X(start)} y={r4(pad + d + 0.4)} width={r4(X(total) - X(start))} height={d} role="ridge" />
			<DimLine x1={X(start)} y1={r4(pad + 2 * d + 2)} x2={X(start + lap)} y2={r4(pad + 2 * d + 2)} label={`lap ${format(lap)}`} offset={px(12)} size={9} />
			<Label x={X(0) + px(2)} y={pad - px(3)} text="bar 1" size={7} anchor="start" className={styles.num} />
			<Label x={X(total) - px(2)} y={r4(pad + 2 * d + 0.4) + px(9)} text="bar 2" size={7} anchor="end" className={styles.num} />
		</>
	);
}
