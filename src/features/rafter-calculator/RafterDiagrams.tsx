"use client";

import { Diagram, DimLine, AngleArc, Label, Member, useDiagramScale } from "@/components/construction/Diagram";
import diagramStyles from "@/components/construction/Diagram.module.scss";
import { inchesToMm } from "@/lib/construction/imperialUtils";
import type { Rafter } from "@/lib/construction/rafterUtils";
import { formatAngle } from "@/lib/construction/pitchUtils";
import styles from "./RafterDiagrams.module.scss";

const r4 = (n: number) => Math.round(n * 1e4) / 1e4;
type Pt = { x: number; y: number };

interface Fmt {
	format: (inches: number) => string;
}

/**
 * Rafter outline in inches with the origin at the outer top corner of the wall plate, x toward
 * the ridge, y up. The rafter's bottom edge passes through the birdsmouth heel corner.
 */
export function rafterOutline(r: Rafter, run: number, overhang: number) {
	const t = (r.angle * Math.PI) / 180;
	const u = { x: Math.cos(t), y: Math.sin(t) }; // along the rafter, up-slope
	const n = { x: -Math.sin(t), y: Math.cos(t) }; // square to the rafter, upward
	// heel corner (inside corner of the birdsmouth) sits on the plate top, `seat` in from the outer face
	const heel: Pt = { x: r.seat, y: 0 };
	// bottom edge line through the heel; the top edge is `depth` above it
	const along = (p: Pt, d: number): Pt => ({ x: p.x + u.x * d, y: p.y + u.y * d });
	const up = (p: Pt, d: number): Pt => ({ x: p.x + n.x * d, y: p.y + n.y * d });
	// positions along the bottom edge measured from the plumb line at the outer wall face
	const bottomAtWall = { x: 0, y: -r.seat * Math.tan(t) + 0 }; // where the bottom edge crosses the outer wall plumb line
	const ridgeBottom = along(bottomAtWall, run / Math.cos(t));
	const tailBottom = along(bottomAtWall, -overhang / Math.cos(t));
	// plumb cuts: the ridge and tail cuts are vertical lines through those bottom-edge points
	const ridgeTop = { x: ridgeBottom.x, y: ridgeBottom.y + r.plumbDepth };
	const tailTop = { x: tailBottom.x, y: tailBottom.y + r.plumbDepth };
	const plumbTop: Pt = { x: 0, y: r.hap }; // top edge over the outer wall face
	return { t, u, n, heel, seatOuter: { x: 0, y: 0 }, plumbFoot: { x: 0, y: -r.heel }, ridgeBottom, ridgeTop, tailBottom, tailTop, plumbTop, along, up };
}

// ── Whole rafter, scaled to fit ──────────────────────────────────────────────

export interface RafterDiagramProps extends Fmt {
	rafter: Rafter;
	run: number;
	overhang: number;
	depth: number;
	wallThickness: number;
	wallHeight: number;
}

const W = 180;
const PAD = 22;

export function RafterDiagram(props: RafterDiagramProps) {
	const { rafter, run, overhang, wallHeight } = props;
	const totalW = run + overhang + props.wallThickness;
	const totalH = rafter.ridgeAbovePlate + Math.min(wallHeight, 48) + Math.max(0, rafter.fasciaBottomBelowPlate);
	const k = Math.min((W - PAD * 2) / inchesToMm(totalW), 110 / inchesToMm(totalH));
	const height = inchesToMm(totalH) * k + PAD * 2;
	return (
		<Diagram widthMm={W} heightMm={height} label={`Common rafter: run ${props.format(run)}, rise ${props.format(rafter.rise)}, ${formatAngle(rafter.angle, 2)}, line length ${props.format(rafter.lineLength)}, overhang ${props.format(overhang)}, drawn to fit`} maxWidth="760px">
			<RafterScene {...props} k={k} />
		</Diagram>
	);
}

function RafterScene({ rafter, run, overhang, wallThickness, wallHeight, format, k }: RafterDiagramProps & { k: number }) {
	const { px } = useDiagramScale();
	const o = rafterOutline(rafter, run, overhang);
	const wallDraw = Math.min(wallHeight, 48);
	// origin on paper: outer wall face at x = PAD + overhang, plate top at y = PAD + ridge height
	const ox = PAD + inchesToMm(overhang) * k;
	const oy = PAD + inchesToMm(rafter.ridgeAbovePlate) * k;
	const P = (p: Pt): Pt => ({ x: r4(ox + inchesToMm(p.x) * k), y: r4(oy - inchesToMm(p.y) * k) });
	const poly = (pts: Pt[]) => pts.map(P).map((p) => `${p.x},${p.y}`).join(" ");
	const rafterPts = [o.tailBottom, o.plumbFoot, o.seatOuter, o.heel, o.ridgeBottom, o.ridgeTop, o.tailTop];
	const wallTop = P({ x: 0, y: 0 });
	const wallW = r4(inchesToMm(wallThickness) * k);
	const ridgeX = P(o.ridgeTop).x;
	return (
		<>
			{/* wall and plate */}
			<Member x={wallTop.x} y={wallTop.y} width={Math.max(wallW, 0.8)} height={r4(inchesToMm(wallDraw) * k)} role="wall" />
			{/* ridge line */}
			<line x1={ridgeX} y1={P(o.ridgeTop).y - 4} x2={ridgeX} y2={P({ x: run, y: 0 }).y} className={styles.centre} />
			{/* rafter */}
			<polygon points={poly(rafterPts)} className={`${diagramStyles.member} ${diagramStyles["role-common"]}`} />
			{/* measuring line: run and rise */}
			<line x1={P({ x: 0, y: 0 }).x} y1={P({ x: 0, y: 0 }).y} x2={P({ x: run, y: 0 }).x} y2={P({ x: run, y: 0 }).y} className={styles.faint} />
			<line x1={P({ x: run, y: 0 }).x} y1={P({ x: run, y: 0 }).y} x2={P({ x: run, y: rafter.rise }).x} y2={P({ x: run, y: rafter.rise }).y} className={styles.faint} />
			<DimLine x1={P({ x: 0, y: 0 }).x} y1={P({ x: 0, y: 0 }).y} x2={P({ x: run, y: 0 }).x} y2={P({ x: run, y: 0 }).y} label={`run ${format(run)}`} offset={px(14)} size={10} />
			<DimLine x1={P({ x: run, y: 0 }).x} y1={P({ x: run, y: 0 }).y} x2={P({ x: run, y: rafter.rise }).x} y2={P({ x: run, y: rafter.rise }).y} label={`rise ${format(rafter.rise)}`} offset={-px(10)} size={10} />
			<DimLine x1={P({ x: -overhang, y: 0 }).x} y1={P({ x: 0, y: 0 }).y} x2={P({ x: 0, y: 0 }).x} y2={P({ x: 0, y: 0 }).y} label={`overhang ${format(overhang)}`} offset={px(14)} size={9} />
			<DimLine x1={P(o.plumbTop).x} y1={P(o.plumbTop).y} x2={P(o.ridgeTop).x} y2={P(o.ridgeTop).y} label={`line length ${format(rafter.lineLength)}`} offset={-px(12)} extensions={false} size={10} />
			<DimLine x1={P(o.tailTop).x} y1={P(o.tailTop).y} x2={P(o.plumbTop).x} y2={P(o.plumbTop).y} label={`tail ${format(rafter.tailLength)}`} offset={-px(12)} extensions={false} size={9} />
			<DimLine x1={P({ x: 0, y: 0 }).x} y1={P({ x: 0, y: 0 }).y} x2={P(o.plumbTop).x} y2={P(o.plumbTop).y} label={`HAP ${format(rafter.hap)}`} offset={-px(6)} extensions={false} size={9} />
			<AngleArc cx={P({ x: 0, y: 0 }).x} cy={P({ x: 0, y: 0 }).y} radius={r4(Math.min(16, inchesToMm(run) * k * 0.3))} startDeg={-rafter.angle} endDeg={0} label={formatAngle(rafter.angle, 2)} size={10} />
			<Label x={ridgeX + px(4)} y={P(o.ridgeTop).y - px(6)} text="ridge" size={9} anchor="start" />
		</>
	);
}

// ── Birdsmouth and ridge cuts, true size ─────────────────────────────────────

export interface CutTemplateProps extends Fmt {
	rafter: Rafter;
	depth: number;
	/** Which end to draw */
	end: "birdsmouth" | "ridge";
	/** Length of rafter to draw along the top edge */
	lengthIn?: number;
}

export function CutTemplate({ rafter, depth, end, lengthIn = 7, format }: CutTemplateProps) {
	const o = rafterOutline(rafter, 100, 0);
	// piece: a length of rafter around the cut, with the cut at the right-hand end for the ridge
	// and the birdsmouth at the left for the seat
	const L = lengthIn;
	let pts: Pt[];
	let labels: { a: Pt; b: Pt; text: string; offset: number }[];
	if (end === "ridge") {
		const bottomEnd: Pt = { x: 0, y: 0 };
		const topEnd: Pt = { x: 0, y: rafter.plumbDepth };
		const bottomStart = o.along(bottomEnd, -L);
		const topStart = o.along(topEnd, -L);
		pts = [bottomStart, bottomEnd, topEnd, topStart];
		labels = [
			{ a: bottomEnd, b: topEnd, text: `plumb cut ${format(rafter.plumbDepth)}`, offset: -12 },
			{ a: topStart, b: topEnd, text: `${formatAngle(rafter.plumbCutAngle, 2)} from square`, offset: -8 },
		];
	} else {
		// outer wall face at x = 0, plate top at y = 0; draw from a little before the tail side to L up-slope
		const heel = o.heel;
		const plumbFoot = o.plumbFoot;
		const tailB = o.along(plumbFoot, -Math.min(L * 0.35, 3));
		const ridgeB = o.along(heel, L);
		const tailT = o.up(tailB, depth);
		const ridgeT = o.up(ridgeB, depth);
		pts = [tailB, plumbFoot, o.seatOuter, heel, ridgeB, ridgeT, tailT];
		labels = [
			{ a: plumbFoot, b: { x: 0, y: 0 }, text: `heel ${format(rafter.heel)}`, offset: 6 },
			{ a: { x: 0, y: 0 }, b: heel, text: `seat ${format(rafter.seat)}`, offset: 6 },
			{ a: { x: 0, y: 0 }, b: o.plumbTop, text: `HAP ${format(rafter.hap)}`, offset: -6 },
		];
	}
	const xs = pts.map((p) => p.x);
	const ys = pts.map((p) => p.y);
	const minX = Math.min(...xs) - 1;
	const maxX = Math.max(...xs) + 1;
	const minY = Math.min(...ys) - 1;
	const maxY = Math.max(...ys) + 1;
	const PADT = 16;
	const width = inchesToMm(maxX - minX) + PADT * 2;
	const height = inchesToMm(maxY - minY) + PADT * 2;
	return (
		<Diagram widthMm={width} heightMm={height} label={end === "ridge" ? `Ridge plumb cut template at ${formatAngle(rafter.plumbCutAngle, 2)}, true size` : `Birdsmouth template: seat ${format(rafter.seat)}, heel ${format(rafter.heel)}, true size`} maxWidth="720px">
			<TemplateScene pts={pts} labels={labels} minX={minX} maxY={maxY} pad={PADT} angle={rafter.angle} end={end} />
		</Diagram>
	);
}

function TemplateScene({ pts, labels, minX, maxY, pad, angle, end }: { pts: Pt[]; labels: { a: Pt; b: Pt; text: string; offset: number }[]; minX: number; maxY: number; pad: number; angle: number; end: "birdsmouth" | "ridge" }) {
	const { px } = useDiagramScale();
	const P = (p: Pt): Pt => ({ x: r4(pad + inchesToMm(p.x - minX)), y: r4(pad + inchesToMm(maxY - p.y)) });
	const poly = pts.map(P).map((p) => `${p.x},${p.y}`).join(" ");
	const origin = P({ x: 0, y: 0 });
	return (
		<>
			<polygon points={poly} className={`${diagramStyles.member} ${diagramStyles["role-common"]}`} />
			{end === "birdsmouth" && (
				<>
					{/* plate outline under the seat */}
					<line x1={origin.x - 40} y1={origin.y} x2={origin.x + 60} y2={origin.y} className={styles.plate} />
					<line x1={origin.x} y1={origin.y} x2={origin.x} y2={origin.y + 30} className={styles.plate} />
					<AngleArc cx={origin.x} cy={origin.y} radius={14} startDeg={-angle} endDeg={0} label={formatAngle(angle, 1)} size={9} />
				</>
			)}
			{labels.map((l, i) => {
				const a = P(l.a);
				const b = P(l.b);
				return <DimLine key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} label={l.text} offset={px(l.offset)} extensions={false} size={9} />;
			})}
		</>
	);
}

// ── Run from the building width ──────────────────────────────────────────────

export function SpanDiagram({ buildingWidth, ridgeThickness, run, format }: { buildingWidth: number; ridgeThickness: number; run: number } & Fmt) {
	const k = (W - PAD * 2) / inchesToMm(Math.max(buildingWidth, 1));
	const height = 46;
	const X = (inches: number) => r4(PAD + inchesToMm(inches) * k);
	const mid = buildingWidth / 2;
	const ridgeW = r4(Math.max(inchesToMm(ridgeThickness) * k, 1));
	return (
		<Diagram widthMm={W} heightMm={height} label={`Building ${format(buildingWidth)} wide with a ${format(ridgeThickness)} ridge gives a ${format(run)} run each side`}>
			<SpanScene X={X} mid={mid} ridgeW={ridgeW} buildingWidth={buildingWidth} ridgeThickness={ridgeThickness} run={run} format={format} />
		</Diagram>
	);
}

function SpanScene({ X, mid, ridgeW, buildingWidth, ridgeThickness, run, format }: { X: (n: number) => number; mid: number; ridgeW: number; buildingWidth: number; ridgeThickness: number; run: number } & Fmt) {
	const { px } = useDiagramScale();
	const y = 14;
	return (
		<>
			<Member x={X(0)} y={y} width={2} height={10} role="wall" />
			<Member x={X(buildingWidth) - 2} y={y} width={2} height={10} role="wall" />
			<Member x={r4(X(mid) - ridgeW / 2)} y={y - 4} width={ridgeW} height={16} role="ridge" />
			<DimLine x1={X(0)} y1={y + 10} x2={X(buildingWidth)} y2={y + 10} label={`building ${format(buildingWidth)}`} offset={px(14)} size={10} />
			<DimLine x1={X(0)} y1={y} x2={X(mid - ridgeThickness / 2)} y2={y} label={`run ${format(run)}`} offset={-px(6)} extensions={false} size={9} />
			<DimLine x1={X(mid + ridgeThickness / 2)} y1={y} x2={X(buildingWidth)} y2={y} label={`run ${format(run)}`} offset={-px(6)} extensions={false} size={9} />
		</>
	);
}
