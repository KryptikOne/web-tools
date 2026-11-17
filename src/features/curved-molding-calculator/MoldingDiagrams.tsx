"use client";

import { Diagram, DimLine, AngleArc, Label, useDiagramScale } from "@/components/construction/Diagram";
import diagramStyles from "@/components/construction/Diagram.module.scss";
import { inchesToMm } from "@/lib/construction/imperialUtils";
import type { CurvedMolding } from "@/lib/construction/curvedMoldingUtils";
import { formatAngle } from "@/lib/construction/pitchUtils";
import styles from "./MoldingDiagrams.module.scss";

const W = 180;
const PAD = 16;
const r4 = (n: number) => Math.round(n * 1e4) / 1e4;
type Fmt = { format: (inches: number) => string };
type Pt = { x: number; y: number };

const polar = (r: number, deg: number): Pt => ({ x: r * Math.cos((deg * Math.PI) / 180), y: r * Math.sin((deg * Math.PI) / 180) });

// ── Plan of the curve with the molding band ──────────────────────────────────

export interface MoldingPlanProps extends Fmt {
	molding: CurvedMolding;
}

export function MoldingPlanDiagram({ molding, format }: MoldingPlanProps) {
	const Ro = molding.outsideRadius;
	const a = molding.angle;
	// bounding box of the band from 0° to a° (centre at the origin), plus the centre when it fits
	const samples = Array.from({ length: 73 }, (_, i) => (a * i) / 72);
	const xs = samples.map((d) => polar(Ro, d).x);
	const ys = samples.map((d) => polar(Ro, d).y);
	const showCentre = a >= 60;
	const minX = Math.min(...xs, showCentre ? 0 : Math.min(...xs));
	const maxX = Math.max(...xs, showCentre ? 0 : Math.max(...xs));
	const minY = Math.min(...ys, showCentre ? 0 : Math.min(...ys));
	const maxY = Math.max(...ys, showCentre ? 0 : Math.max(...ys));
	const k = Math.min((W - PAD * 2) / inchesToMm(maxX - minX || 1), 110 / inchesToMm(maxY - minY || 1));
	const height = inchesToMm(maxY - minY) * k + PAD * 2 + 8;
	return (
		<Diagram widthMm={W} heightMm={height} label={`Curved molding plan: ${format(molding.outsideRadius - molding.insideRadius)} wide band from ${format(molding.insideRadius)} to ${format(molding.outsideRadius)} radius through ${formatAngle(a, 1)}${molding.segments.length ? ` in ${molding.segments.length} segments` : ""}`}>
			<PlanScene molding={molding} k={k} minX={minX} maxY={maxY} showCentre={showCentre} format={format} />
		</Diagram>
	);
}

function PlanScene({ molding, k, minX, maxY, showCentre, format }: MoldingPlanProps & { k: number; minX: number; maxY: number; showCentre: boolean }) {
	const { px } = useDiagramScale();
	const P = (p: Pt): Pt => ({ x: r4(PAD + inchesToMm(p.x - minX) * k), y: r4(PAD + inchesToMm(maxY - p.y) * k) });
	const Ri = molding.insideRadius;
	const Ro = molding.outsideRadius;
	const a = molding.angle;
	const mm = (r: number) => r4(inchesToMm(r) * k);
	const large = a > 180 ? 1 : 0;
	const o0 = P(polar(Ro, 0));
	const o1 = P(polar(Ro, a));
	const i0 = P(polar(Ri, 0));
	const i1 = P(polar(Ri, a));
	const band = `M ${o0.x} ${o0.y} A ${mm(Ro)} ${mm(Ro)} 0 ${large} 0 ${o1.x} ${o1.y} L ${i1.x} ${i1.y} A ${mm(Ri)} ${mm(Ri)} 0 ${large} 1 ${i0.x} ${i0.y} Z`;
	const c = P({ x: 0, y: 0 });
	const n = molding.segments.length;
	return (
		<>
			<path d={band} className={styles.band} />
			{n > 0 &&
				molding.segments.map((s, i) => {
					const d0 = (a * i) / n;
					const d1 = (a * (i + 1)) / n;
					const p0 = P(polar(Ro, d0));
					const p1 = P(polar(Ro, d1));
					const q0 = P(polar(Ri, d0));
					const q1 = P(polar(Ri, d1));
					const mid = P(polar((Ri + Ro) / 2, (d0 + d1) / 2));
					return (
						<g key={s.index}>
							<polygon points={`${p0.x},${p0.y} ${p1.x},${p1.y} ${q1.x},${q1.y} ${q0.x},${q0.y}`} className={`${diagramStyles.member} ${diagramStyles["role-common"]}`} />
							{n <= 40 && <Label x={mid.x} y={mid.y + px(3)} text={`${s.index}`} size={7} className={styles.num} />}
						</g>
					);
				})}
			{showCentre && (
				<>
					<line x1={c.x} y1={c.y} x2={i0.x} y2={i0.y} className={styles.radius} />
					<line x1={c.x} y1={c.y} x2={i1.x} y2={i1.y} className={styles.radius} />
					<circle cx={c.x} cy={c.y} r={1.2} className={styles.centre} />
					<DimLine x1={c.x} y1={c.y} x2={i0.x} y2={i0.y} label={`R ${format(Ri)}`} offset={px(10)} extensions={false} size={8} />
					<AngleArc cx={c.x} cy={c.y} radius={r4(Math.min(14, mm(Ri) * 0.3))} startDeg={-a} endDeg={0} label={formatAngle(a, 1)} size={8} />
				</>
			)}
			<DimLine x1={i0.x} y1={i0.y} x2={o0.x} y2={o0.y} label={format(Ro - Ri)} offset={px(10)} extensions={false} size={8} />
		</>
	);
}

// ── One segment, true size where it fits ─────────────────────────────────────

export interface SegmentTemplateProps extends Fmt {
	molding: CurvedMolding;
}

export function SegmentTemplate({ molding, format }: SegmentTemplateProps) {
	const seg = molding.segments[0];
	if (!seg) return null;
	const Ro = molding.outsideRadius;
	const Ri = molding.insideRadius;
	const half = seg.angle / 2;
	// blank: rectangle holding the segment, long edge = outside chord, width = blank width
	const L = molding.blankLength;
	const Wb = molding.blankWidth;
	const k = Math.min(1, 150 / inchesToMm(L), 70 / inchesToMm(Wb));
	const PADT = 14;
	const width = inchesToMm(L) * k + PADT * 2 + 10;
	const height = inchesToMm(Wb) * k + PADT * 2 + 14;
	return (
		<Diagram widthMm={width} heightMm={height} label={`Segment template: ${format(L)} long blank, ${format(Wb)} wide, miters ${formatAngle(seg.miter, 2)} from square, curved face radius ${format(Ro)} outside and ${format(Ri)} inside, ${k === 1 ? "true size" : "drawn to fit"}`} maxWidth="760px">
			<SegmentScene molding={molding} half={half} L={L} Wb={Wb} k={k} pad={PADT} format={format} />
		</Diagram>
	);
}

function SegmentScene({ molding, half, L, Wb, k, pad, format }: SegmentTemplateProps & { half: number; L: number; Wb: number; k: number; pad: number }) {
	const { px } = useDiagramScale();
	const X = (inches: number) => r4(pad + inchesToMm(inches) * k);
	const Y = (inches: number) => r4(pad + inchesToMm(Wb - inches) * k);
	const Ro = molding.outsideRadius;
	const Ri = molding.insideRadius;
	const seg = molding.segments[0];
	const mm = (r: number) => r4(inchesToMm(r) * k);
	// segment in blank coordinates: centre of the arcs sits below the blank's bottom edge at distance d
	// so the outside arc touches the top of the blank at the middle and its ends sit at the blank corners
	const sag = Ro * (1 - Math.cos((half * Math.PI) / 180));
	const cx = L / 2;
	const cy = Wb - Ro; // arc centre y (below the blank when Ro > Wb)
	const outerEnd = (sign: number): Pt => ({ x: cx + sign * Ro * Math.sin((half * Math.PI) / 180), y: cy + Ro * Math.cos((half * Math.PI) / 180) });
	const innerEnd = (sign: number): Pt => ({ x: cx + sign * Ri * Math.sin((half * Math.PI) / 180), y: cy + Ri * Math.cos((half * Math.PI) / 180) });
	const oL = outerEnd(-1);
	const oR = outerEnd(1);
	const iL = innerEnd(-1);
	const iR = innerEnd(1);
	const path = `M ${X(oL.x)} ${Y(oL.y)} A ${mm(Ro)} ${mm(Ro)} 0 0 1 ${X(oR.x)} ${Y(oR.y)} L ${X(iR.x)} ${Y(iR.y)} A ${mm(Ri)} ${mm(Ri)} 0 0 0 ${X(iL.x)} ${Y(iL.y)} Z`;
	return (
		<>
			<rect x={X(0)} y={Y(Wb)} width={r4(X(L) - X(0))} height={r4(Y(0) - Y(Wb))} className={styles.blank} />
			<path d={path} className={styles.band} />
			<DimLine x1={X(0)} y1={Y(0)} x2={X(L)} y2={Y(0)} label={`${format(L)} long point to long point`} offset={px(12)} size={9} />
			<DimLine x1={X(L) + px(4)} y1={Y(0)} x2={X(L) + px(4)} y2={Y(Wb)} label={format(Wb)} offset={-px(8)} extensions={false} size={8} />
			<DimLine x1={X(iL.x)} y1={Y(iL.y) - px(2)} x2={X(iR.x)} y2={Y(iR.y) - px(2)} label={`${format(seg.insideLength)} inside`} offset={-px(6)} extensions={false} size={8} />
			<AngleArc cx={X(oL.x)} cy={Y(oL.y)} radius={r4(Math.min(12, mm(Wb) * 0.6))} startDeg={90} endDeg={90 + seg.miter} label={formatAngle(seg.miter, 1)} size={8} />
			<Label x={X(L / 2)} y={Y(Wb) - px(3)} text={`sagitta ${format(sag)}`} size={7} className={styles.num} />
		</>
	);
}
