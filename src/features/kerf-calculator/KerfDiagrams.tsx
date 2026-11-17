"use client";

import { Diagram, DimLine, Label, Member, useDiagramScale } from "@/components/construction/Diagram";
import { inchesToMm } from "@/lib/construction/imperialUtils";
import type { KerfBend, KerfEllipse } from "@/lib/construction/kerfUtils";
import { formatAngle } from "@/lib/construction/pitchUtils";
import styles from "./KerfDiagrams.module.scss";

const W = 180;
const PAD = 14;
const r4 = (n: number) => Math.round(n * 1e4) / 1e4;
type Fmt = { format: (inches: number) => string };

// ── Flat board with kerfs, scaled to fit ─────────────────────────────────────

export interface FlatBoardProps extends Fmt {
	thickness: number;
	kerfWidth: number;
	kerfDepth: number;
	/** Kerf centres along the outside face from the start of the bend */
	positions: number[];
	length: number;
	/** Extra flat board drawn before and after the bend */
	lead?: number;
}

export function FlatBoardDiagram({ thickness, kerfWidth, kerfDepth, positions, length, lead = 2, format }: FlatBoardProps) {
	const total = length + 2 * lead;
	const k = Math.min((W - PAD * 2) / inchesToMm(total), 1);
	const h = Math.max(inchesToMm(thickness) * k, 6);
	const height = h + PAD * 2 + 16;
	return (
		<Diagram widthMm={W} heightMm={height} label={`Kerfed board flat: ${positions.length} kerfs ${format(kerfDepth)} deep over ${format(length)}, ${k === 1 ? "true size" : "drawn to fit"}`}>
			<FlatScene thickness={thickness} kerfWidth={kerfWidth} kerfDepth={kerfDepth} positions={positions} length={length} lead={lead} k={k} h={h} format={format} />
		</Diagram>
	);
}

function FlatScene({ thickness, kerfWidth, kerfDepth, positions, length, lead, k, h, format }: FlatBoardProps & { lead: number; k: number; h: number }) {
	const { px } = useDiagramScale();
	const X = (inches: number) => r4(PAD + inchesToMm(inches + lead) * k);
	const top = PAD + 8;
	const depthMm = r4((h * kerfDepth) / thickness);
	const kw = Math.max(r4(inchesToMm(kerfWidth) * k), 0.6);
	const many = positions.length > 40;
	return (
		<>
			<Member x={X(-lead)} y={top} width={r4(X(length + lead) - X(-lead))} height={r4(h)} role="common" />
			{positions.map((p, i) => (
				<g key={i}>
					{/* kerfs are cut from the inside face, drawn at the bottom */}
					<rect x={r4(X(p) - kw / 2)} y={r4(top + h - depthMm)} width={kw} height={depthMm} className={styles.kerf} />
					{!many && <Label x={X(p)} y={top - px(3)} text={`${i + 1}`} size={7} className={styles.num} />}
				</g>
			))}
			<DimLine x1={X(0)} y1={top + h} x2={X(length)} y2={top + h} label={`bend ${format(length)}`} offset={px(12)} size={9} />
			{positions.length > 1 && !many && <DimLine x1={X(positions[0])} y1={top} x2={X(positions[1])} y2={top} label={format(positions[1] - positions[0])} offset={-px(12)} extensions={false} size={8} />}
			<Label x={X(-lead) + px(2)} y={r4(top + h + px(9))} text="inside face (kerfed)" size={7} anchor="start" className={styles.num} />
		</>
	);
}

// ── Board bent to the radius ─────────────────────────────────────────────────

export interface BentBoardProps extends Fmt {
	bend: KerfBend;
	insideRadius: number;
	thickness: number;
}

export function BentBoardDiagram({ bend, insideRadius, thickness, format }: BentBoardProps) {
	const Ro = bend.outsideRadius;
	const a = (bend.angle * Math.PI) / 180;
	// bounding box of the arc from angle 0 to a, centre at origin
	const xs = [Ro, Ro * Math.cos(a), insideRadius, insideRadius * Math.cos(a), a > Math.PI ? -Ro : Ro * Math.cos(Math.min(a, Math.PI))];
	const ys = [0, Ro * Math.sin(a), insideRadius * Math.sin(a), a > Math.PI / 2 ? Ro : Ro * Math.sin(a)];
	const minX = Math.min(...xs, 0);
	const maxX = Math.max(...xs);
	const minY = Math.min(...ys, 0);
	const maxY = Math.max(...ys);
	const k = Math.min((W - PAD * 2) / inchesToMm(maxX - minX), 100 / inchesToMm(maxY - minY));
	const height = inchesToMm(maxY - minY) * k + PAD * 2 + 10;
	return (
		<Diagram widthMm={W} heightMm={height} label={`Board bent through ${formatAngle(bend.angle, 1)} on a ${format(insideRadius)} inside radius with ${bend.kerfs} kerfs, drawn to fit`}>
			<BentScene bend={bend} insideRadius={insideRadius} thickness={thickness} k={k} minX={minX} maxY={maxY} format={format} />
		</Diagram>
	);
}

function BentScene({ bend, insideRadius, k, minX, maxY, format }: BentBoardProps & { k: number; minX: number; maxY: number }) {
	const { px } = useDiagramScale();
	const P = (r: number, deg: number) => ({ x: r4(PAD + inchesToMm(r * Math.cos((deg * Math.PI) / 180) - minX) * k), y: r4(PAD + inchesToMm(maxY - r * Math.sin((deg * Math.PI) / 180)) * k) });
	const Ro = bend.outsideRadius;
	const Ri = insideRadius;
	const a = bend.angle;
	const mm = (r: number) => r4(inchesToMm(r) * k);
	const large = a > 180 ? 1 : 0;
	const o0 = P(Ro, 0);
	const o1 = P(Ro, a);
	const i0 = P(Ri, 0);
	const i1 = P(Ri, a);
	const path = `M ${o0.x} ${o0.y} A ${mm(Ro)} ${mm(Ro)} 0 ${large} 0 ${o1.x} ${o1.y} L ${i1.x} ${i1.y} A ${mm(Ri)} ${mm(Ri)} 0 ${large} 1 ${i0.x} ${i0.y} Z`;
	const c = P(0, 0);
	return (
		<>
			<path d={path} className={styles.board} />
			{Array.from({ length: bend.kerfs }, (_, i) => {
				const deg = (a * (i + 0.5)) / bend.kerfs;
				const inner = P(Ri, deg);
				const outer = P(Ri + bend.kerfDepth, deg);
				return <line key={i} x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} className={styles.kerfLine} />;
			})}
			<line x1={c.x} y1={c.y} x2={i0.x} y2={i0.y} className={styles.radius} />
			<line x1={c.x} y1={c.y} x2={i1.x} y2={i1.y} className={styles.radius} />
			<DimLine x1={c.x} y1={c.y} x2={i0.x} y2={i0.y} label={`R ${format(Ri)}`} offset={px(10)} extensions={false} size={9} />
			<Label x={c.x + px(4)} y={c.y - px(4)} text={formatAngle(a, 1)} size={9} anchor="start" />
		</>
	);
}

// ── True-size kerf strip, in segments ────────────────────────────────────────

export interface KerfStripProps extends Fmt {
	positions: number[];
	length: number;
	kerfWidth: number;
	segmentMm?: number;
}

const STRIP_H = 30;

/** Kerf centre lines at true size along the outside face; tape the segments end to end and transfer the marks. */
export function KerfStripDiagrams({ positions, length, kerfWidth, segmentMm = 250, format }: KerfStripProps) {
	const total = inchesToMm(length);
	const segments = Math.max(1, Math.ceil(total / segmentMm));
	if (segments > 12) return null;
	const per = total / segments;
	return (
		<>
			{Array.from({ length: segments }, (_, s) => {
				const from = (s * per) / 25.4;
				const to = Math.min(length, ((s + 1) * per) / 25.4);
				return (
					<Diagram key={s} widthMm={inchesToMm(to - from) + 20} heightMm={STRIP_H} label={`Kerf strip ${s + 1} of ${segments}: ${format(from)} to ${format(to)}, true size`} maxWidth="760px">
						<StripScene positions={positions} from={from} to={to} kerfWidth={kerfWidth} segment={s + 1} segments={segments} format={format} />
					</Diagram>
				);
			})}
		</>
	);
}

function StripScene({ positions, from, to, kerfWidth, segment, segments, format }: { positions: number[]; from: number; to: number; kerfWidth: number; segment: number; segments: number } & Fmt) {
	const { px } = useDiagramScale();
	const X = (inches: number) => r4(10 + inchesToMm(inches - from));
	const kw = Math.max(inchesToMm(kerfWidth), 0.6);
	const marks = positions.map((p, i) => ({ p, i: i + 1 })).filter((m) => m.p >= from - 1e-9 && m.p <= to + 1e-9);
	return (
		<>
			<rect x={X(from)} y={8} width={r4(X(to) - X(from))} height={14} className={styles.strip} />
			{marks.map((m) => (
				<g key={m.i}>
					<rect x={r4(X(m.p) - kw / 2)} y={8} width={kw} height={14} className={styles.kerf} />
					<Label x={X(m.p)} y={8 + 14 + px(9)} text={`${m.i}`} size={7} className={styles.num} />
				</g>
			))}
			<Label x={X(from)} y={6} text={format(from)} size={7} anchor="start" />
			<Label x={X(to)} y={6} text={format(to)} size={7} anchor="end" />
			{segment < segments && <Label x={X(to) + px(2)} y={16} text="→" size={9} anchor="start" />}
		</>
	);
}

// ── Half ellipse with kerfs ──────────────────────────────────────────────────

export interface EllipseDiagramProps extends Fmt {
	ellipse: KerfEllipse;
	width: number;
	rise: number;
	thickness: number;
}

export function EllipseDiagram({ ellipse, width, rise, thickness, format }: EllipseDiagramProps) {
	const totalW = width + 2 * thickness;
	const totalH = rise + thickness;
	const k = Math.min((W - PAD * 2) / inchesToMm(totalW), 90 / inchesToMm(totalH));
	const height = inchesToMm(totalH) * k + PAD * 2 + 12;
	return (
		<Diagram widthMm={W} heightMm={height} label={`Half ellipse ${format(width)} wide rising ${format(rise)} with ${ellipse.kerfs} kerfs, closer at the ends where the curve is tighter, drawn to fit`}>
			<EllipseScene ellipse={ellipse} width={width} rise={rise} thickness={thickness} k={k} height={height} format={format} />
		</Diagram>
	);
}

function EllipseScene({ ellipse, width, rise, thickness, k, height, format }: EllipseDiagramProps & { k: number; height: number }) {
	const { px } = useDiagramScale();
	const X = (x: number) => r4(PAD + inchesToMm(x + width / 2 + thickness) * k);
	const Y = (y: number) => r4(height - PAD - 12 - inchesToMm(y) * k);
	const path = `M ${ellipse.inside.map((p) => `${X(p.x)} ${Y(p.y)}`).join(" L ")} L ${[...ellipse.outside].reverse().map((p) => `${X(p.x)} ${Y(p.y)}`).join(" L ")} Z`;
	// kerf marks: interpolate along the outside polyline by arc length fraction
	const outsideLen = ellipse.outsideLength;
	const marks = ellipse.kerfList.map((kf) => {
		const f = kf.position / outsideLen;
		const idx = Math.min(ellipse.outside.length - 1, Math.max(0, Math.round(f * (ellipse.outside.length - 1))));
		return { o: ellipse.outside[idx], i: ellipse.inside[idx] };
	});
	return (
		<>
			<path d={path} className={styles.board} />
			{marks.map((m, i) => (
				<line key={i} x1={X(m.i.x)} y1={Y(m.i.y)} x2={X(m.i.x + (m.o.x - m.i.x) * 0.8)} y2={Y(m.i.y + (m.o.y - m.i.y) * 0.8)} className={styles.kerfLine} />
			))}
			<DimLine x1={X(-width / 2)} y1={Y(0) + px(4)} x2={X(width / 2)} y2={Y(0) + px(4)} label={format(width)} offset={px(10)} size={9} />
			<DimLine x1={X(width / 2) + px(8)} y1={Y(0)} x2={X(width / 2) + px(8)} y2={Y(rise)} label={format(rise)} offset={-px(8)} extensions={false} size={9} />
		</>
	);
}
