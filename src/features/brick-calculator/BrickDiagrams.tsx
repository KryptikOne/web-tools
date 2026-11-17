"use client";

import { Diagram, DimLine, Label, Member, useDiagramScale } from "@/components/construction/Diagram";
import { inchesToMm } from "@/lib/construction/imperialUtils";
import type { Bond, Gauge } from "@/lib/construction/masonryUtils";
import styles from "./BrickDiagrams.module.scss";

const W = 180;
const PAD_X = 12;
const PAD_TOP = 10;
const PAD_BOTTOM = 22;
const r4 = (n: number) => Math.round(n * 1e4) / 1e4;
type Fmt = { format: (inches: number) => string };

// ── Bond elevation ───────────────────────────────────────────────────────────

export interface BondDiagramProps extends Fmt {
	bond: Bond;
	wallLength: number;
	brickHeight: number;
	bedJoint: number;
	/** Courses to draw */
	courses: number;
}

export function BondDiagram(props: BondDiagramProps) {
	const { bond, wallLength, brickHeight, bedJoint, courses, format } = props;
	const n = Math.max(1, Math.min(courses, 8));
	const k = (W - PAD_X * 2) / inchesToMm(wallLength);
	const g = brickHeight + bedJoint;
	const height = Math.max(inchesToMm(n * g) * k, 16) + PAD_TOP + PAD_BOTTOM;
	return (
		<Diagram widthMm={W} heightMm={height} label={`${n} courses of brickwork over ${format(wallLength)}: ${bond.courseA.units.length} bricks on the first course, ${bond.courseB.units.length} on the next, perps ${format(bond.perp)}, cut bricks highlighted`}>
			<BondScene {...props} courses={n} k={k} height={height} />
		</Diagram>
	);
}

function BondScene({ bond, wallLength, brickHeight, bedJoint, courses, format, k, height }: BondDiagramProps & { k: number; height: number }) {
	const { px } = useDiagramScale();
	const X = (inches: number) => r4(PAD_X + inchesToMm(inches) * k);
	const g = brickHeight + bedJoint;
	const Y = (inches: number) => r4(height - PAD_BOTTOM - inchesToMm(inches) * k);
	const bh = Math.max(r4(inchesToMm(brickHeight) * k), 0.8);
	const many = bond.courseA.units.length > 60;
	return (
		<>
			{Array.from({ length: courses }, (_, c) => {
				const course = c % 2 === 0 ? bond.courseA : bond.courseB;
				const y0 = c * g + bedJoint;
				return course.units.map((u, i) => <Member key={`${c}-${i}`} x={X(u.near)} y={Y(y0 + brickHeight)} width={Math.max(r4(X(u.far) - X(u.near)), 0.5)} height={bh} role={u.cut ? "hip" : u.header ? "ridge" : "common"} />);
			})}
			<line x1={X(0)} y1={Y(0)} x2={X(0)} y2={Y(courses * g)} className={styles.end} />
			<line x1={X(wallLength)} y1={Y(0)} x2={X(wallLength)} y2={Y(courses * g)} className={styles.end} />
			<DimLine x1={X(0)} y1={Y(0)} x2={X(wallLength)} y2={Y(0)} label={format(wallLength)} offset={px(14)} size={9} />
			{!many && bond.courseA.units.length > 1 && <DimLine x1={X(bond.courseA.units[0].far)} y1={Y(bedJoint + brickHeight / 2)} x2={X(bond.courseA.units[1].near)} y2={Y(bedJoint + brickHeight / 2)} label={format(bond.perp)} offset={-px(10)} extensions={false} size={8} />}
			{bond.courseB.units[0]?.cut && !many && <Label x={X(bond.courseB.units[0].near + bond.courseB.units[0].length / 2)} y={Y(g + bedJoint + brickHeight / 2) + px(3)} text={format(bond.courseB.units[0].length)} size={7} className={styles.num} />}
		</>
	);
}

// ── Gauge rod, true size in segments ─────────────────────────────────────────

export interface GaugeRodProps extends Fmt {
	gauge: Gauge;
	unitHeight: number;
	/** Longest segment to print on one sheet, mm */
	segmentMm?: number;
}

const ROD_W = 60;

/** Course lines at true size, split into segments short enough for one sheet each; tape them end to end. */
export function GaugeRodDiagrams({ gauge, unitHeight, segmentMm = 250, format }: GaugeRodProps) {
	const total = inchesToMm(gauge.height);
	const segments = Math.max(1, Math.ceil(total / segmentMm));
	const perSegment = total / segments;
	return (
		<>
			{Array.from({ length: segments }, (_, s) => {
				const fromMm = s * perSegment;
				const toMm = Math.min(total, (s + 1) * perSegment);
				const from = fromMm / 25.4;
				const to = toMm / 25.4;
				return (
					<Diagram key={s} widthMm={ROD_W} heightMm={toMm - fromMm + 20} label={`Gauge rod segment ${s + 1} of ${segments}: ${format(from)} to ${format(to)}, course lines at ${format(gauge.adjustedGauge)}, true size`} maxWidth="260px">
						<RodScene gauge={gauge} unitHeight={unitHeight} from={from} to={to} segment={s + 1} segments={segments} format={format} />
					</Diagram>
				);
			})}
		</>
	);
}

function RodScene({ gauge, unitHeight, from, to, segment, segments, format }: { gauge: Gauge; unitHeight: number; from: number; to: number; segment: number; segments: number } & Fmt) {
	const { px } = useDiagramScale();
	const PAD = 10;
	const Y = (inches: number) => r4(PAD + inchesToMm(to - inches));
	const x0 = 8;
	const x1 = 30;
	const lines = gauge.courseHeights.map((h, i) => ({ h, i: i + 1 })).filter((c) => c.h >= from - 1e-9 && c.h <= to + 1e-9);
	return (
		<>
			<rect x={x0} y={Y(to)} width={x1 - x0} height={r4(Y(from) - Y(to))} className={styles.rod} />
			{lines.map((c) => (
				<g key={c.i}>
					{/* bed joint band under the course top */}
					<rect x={x0} y={Y(c.h)} width={x1 - x0} height={r4(Math.max(inchesToMm(gauge.adjustedGauge - unitHeight), 0.3))} className={styles.joint} />
					<line x1={x0 - 3} y1={Y(c.h)} x2={x1 + 3} y2={Y(c.h)} className={styles.courseLine} />
					<Label x={x1 + px(6)} y={Y(c.h) + px(3)} text={`${c.i}  ${format(c.h)}`} size={8} anchor="start" />
				</g>
			))}
			{from > 1e-9 && <Label x={x0} y={Y(from) + px(9)} text={`join to ${segment - 1}`} size={7} anchor="start" className={styles.num} />}
			{segment < segments && <Label x={x0} y={Y(to) - px(3)} text={`join to ${segment + 1}`} size={7} anchor="start" className={styles.num} />}
			{gauge.openings
				.filter((o) => o.snapped >= from - 1e-9 && o.snapped <= to + 1e-9)
				.map((o) => (
					<Label key={o.label} x={x0 - px(4)} y={Y(o.snapped) + px(3)} text={o.label} size={7} anchor="end" className={styles.num} />
				))}
		</>
	);
}
