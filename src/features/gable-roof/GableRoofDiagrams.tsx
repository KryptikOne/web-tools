"use client";

import { Diagram, DimLine, AngleArc, Label, Member, useDiagramScale } from "@/components/construction/Diagram";
import diagramStyles from "@/components/construction/Diagram.module.scss";
import { inchesToMm } from "@/lib/construction/imperialUtils";
import type { GableRoof } from "@/lib/construction/rafterUtils";
import { formatAngle } from "@/lib/construction/pitchUtils";
import { rafterOutline } from "@/features/rafter-calculator/RafterDiagrams";
import styles from "./GableRoofDiagrams.module.scss";

const r4 = (n: number) => Math.round(n * 1e4) / 1e4;
type Pt = { x: number; y: number };
type Fmt = { format: (inches: number) => string };

const W = 180;
const PAD = 22;

// ── Cross section through the ridge ──────────────────────────────────────────

export interface SectionDiagramProps extends Fmt {
	roof: GableRoof;
	buildingWidth: number;
	wallThickness: number;
	wallHeight: number;
	ridgeThickness: number;
}

export function SectionDiagram(props: SectionDiagramProps) {
	const { roof, buildingWidth, wallHeight, format } = props;
	const wallDraw = Math.min(wallHeight, 48);
	const totalW = buildingWidth + 2 * roof.overhang;
	const totalH = roof.ridgeTopAbovePlate + wallDraw + Math.max(0, roof.rafter.fasciaBottomBelowPlate);
	const k = Math.min((W - PAD * 2) / inchesToMm(totalW), 110 / inchesToMm(totalH));
	const height = inchesToMm(totalH) * k + PAD * 2;
	return (
		<Diagram widthMm={W} heightMm={height} label={`Gable roof section: ${format(buildingWidth)} wide, ${formatAngle(roof.rafter.angle, 2)}, ridge ${format(roof.ridgeTopAbovePlate)} above the plates, rafters ${format(roof.overallLengthCut)} overall, drawn to fit`} maxWidth="820px">
			<SectionScene {...props} k={k} wallDraw={wallDraw} />
		</Diagram>
	);
}

function SectionScene({ roof, buildingWidth, wallThickness, ridgeThickness, format, k, wallDraw }: SectionDiagramProps & { k: number; wallDraw: number }) {
	const { px } = useDiagramScale();
	const r = roof.rafter;
	const o = rafterOutline(r, roof.run, roof.overhang);
	// origin on paper: left outer wall face at x = PAD + overhang, plate top at y = PAD + ridge height
	const ox = PAD + inchesToMm(roof.overhang) * k;
	const oy = PAD + inchesToMm(roof.ridgeTopAbovePlate) * k;
	const mid = buildingWidth / 2;
	const P = (p: Pt): Pt => ({ x: r4(ox + inchesToMm(p.x) * k), y: r4(oy - inchesToMm(p.y) * k) });
	const M = (p: Pt): Pt => P({ x: buildingWidth - p.x, y: p.y }); // mirrored for the right rafter
	const poly = (pts: Pt[], map: (p: Pt) => Pt) => pts.map(map).map((p) => `${p.x},${p.y}`).join(" ");
	// shorten the ridge end of each rafter by half the ridge thickness, level
	const half = ridgeThickness / 2;
	const shorten = (p: Pt): Pt => ({ x: p.x - half, y: p.y - half * Math.tan(o.t) * 0 });
	const ridgeBottom = { x: roof.run - half, y: o.ridgeBottom.y - half * Math.tan(o.t) };
	const ridgeTop = { x: roof.run - half, y: ridgeBottom.y + r.plumbDepth };
	const pts = [o.tailBottom, o.plumbFoot, o.seatOuter, o.heel, ridgeBottom, ridgeTop, o.tailTop];
	void shorten;
	const ridgeW = Math.max(r4(inchesToMm(ridgeThickness) * k), 0.8);
	const ridgeTopPt = P({ x: mid, y: roof.ridgeTopAbovePlate });
	const ridgeH = r4(inchesToMm(r.plumbDepth) * k);
	const wallW = Math.max(r4(inchesToMm(wallThickness) * k), 0.8);
	const left = P({ x: 0, y: 0 });
	const right = P({ x: buildingWidth, y: 0 });
	return (
		<>
			<Member x={left.x} y={left.y} width={wallW} height={r4(inchesToMm(wallDraw) * k)} role="wall" />
			<Member x={r4(right.x - wallW)} y={right.y} width={wallW} height={r4(inchesToMm(wallDraw) * k)} role="wall" />
			<polygon points={poly(pts, P)} className={`${diagramStyles.member} ${diagramStyles["role-common"]}`} />
			<polygon points={poly(pts, M)} className={`${diagramStyles.member} ${diagramStyles["role-common"]}`} />
			<Member x={r4(ridgeTopPt.x - ridgeW / 2)} y={ridgeTopPt.y} width={ridgeW} height={ridgeH} role="ridge" />
			<line x1={ridgeTopPt.x} y1={ridgeTopPt.y - 5} x2={ridgeTopPt.x} y2={left.y} className={styles.centre} />
			<DimLine x1={left.x} y1={left.y} x2={right.x} y2={right.y} label={`building ${format(buildingWidth)}`} offset={px(14)} size={10} />
			<DimLine x1={left.x} y1={left.y} x2={ridgeTopPt.x} y2={left.y} label={`run ${format(roof.run)}`} offset={px(26)} size={9} />
			<DimLine x1={P({ x: -roof.overhang, y: 0 }).x} y1={left.y} x2={left.x} y2={left.y} label={`overhang ${format(roof.overhang)}`} offset={px(14)} size={9} />
			<DimLine x1={ridgeTopPt.x} y1={left.y} x2={ridgeTopPt.x} y2={ridgeTopPt.y} label={`ridge ${format(roof.ridgeTopAbovePlate)}`} offset={-px(10)} extensions={false} size={9} />
			<DimLine x1={P(o.plumbTop).x} y1={P(o.plumbTop).y} x2={P(ridgeTop).x} y2={P(ridgeTop).y} label={`line ${format(roof.lineLengthCut)}`} offset={-px(12)} extensions={false} size={10} />
			<DimLine x1={M(o.tailTop).x} y1={M(o.tailTop).y} x2={M(ridgeTop).x} y2={M(ridgeTop).y} label={`overall ${format(roof.overallLengthCut)}`} offset={-px(12)} extensions={false} size={10} />
			<AngleArc cx={left.x} cy={left.y} radius={r4(Math.min(16, inchesToMm(roof.run) * k * 0.3))} startDeg={-r.angle} endDeg={0} label={formatAngle(r.angle, 2)} size={10} />
			<Label x={ridgeTopPt.x + px(4)} y={ridgeTopPt.y - px(6)} text="ridge" size={9} anchor="start" />
		</>
	);
}

// ── Rafter layout plan ───────────────────────────────────────────────────────

export interface PlanDiagramProps extends Fmt {
	roof: GableRoof;
	buildingWidth: number;
	buildingLength: number;
	rakeOverhang: number;
	thickness: number;
}

const PAD_P = 14;

export function PlanDiagram(props: PlanDiagramProps) {
	const { roof, buildingWidth, buildingLength, rakeOverhang, format } = props;
	const totalL = buildingLength + 2 * rakeOverhang;
	const totalW = buildingWidth + 2 * roof.overhang;
	const k = (W - PAD_P * 2) / inchesToMm(totalL);
	const height = Math.min(inchesToMm(totalW) * k, 90) + PAD_P * 2 + 10;
	return (
		<Diagram widthMm={W} heightMm={height} label={`Rafter plan: ${roof.raftersPerSide} rafters a side at ${format(roof.rafters[1] ? roof.rafters[1].center - roof.rafters[0].center : 0)} centers along a ${format(buildingLength)} building, ridge ${format(roof.ridgeLength)}`}>
			<PlanScene {...props} k={k} height={height} totalW={totalW} />
		</Diagram>
	);
}

function PlanScene({ roof, buildingWidth, buildingLength, rakeOverhang, thickness, format, k, height, totalW }: PlanDiagramProps & { k: number; height: number; totalW: number }) {
	const { px } = useDiagramScale();
	const ky = Math.min(k, (height - PAD_P * 2 - 10) / inchesToMm(totalW));
	const X = (inches: number) => r4(PAD_P + inchesToMm(inches + rakeOverhang) * k);
	const Y = (inches: number) => r4(PAD_P + inchesToMm(inches + roof.overhang) * ky);
	const rw = Math.max(r4(inchesToMm(thickness) * k), 0.6);
	const mid = buildingWidth / 2;
	return (
		<>
			{/* walls */}
			<rect x={X(0)} y={Y(0)} width={r4(X(buildingLength) - X(0))} height={r4(Y(buildingWidth) - Y(0))} className={styles.faint} fill="none" />
			{/* rafters, both sides */}
			{roof.rafters.map((s) => (
				<Member key={s.index} x={X(s.near)} y={Y(-roof.overhang)} width={rw} height={r4(Y(buildingWidth + roof.overhang) - Y(-roof.overhang))} role="common" />
			))}
			{/* ridge */}
			<Member x={X(-rakeOverhang)} y={r4(Y(mid) - 1)} width={r4(X(buildingLength + rakeOverhang) - X(-rakeOverhang))} height={2} role="ridge" />
			<DimLine x1={X(0)} y1={Y(buildingWidth + roof.overhang)} x2={X(buildingLength)} y2={Y(buildingWidth + roof.overhang)} label={`building ${format(buildingLength)}`} offset={px(12)} size={10} />
			<DimLine x1={X(-rakeOverhang)} y1={Y(-roof.overhang)} x2={X(buildingLength + rakeOverhang)} y2={Y(-roof.overhang)} label={`ridge and fascia ${format(roof.ridgeLength)}`} offset={-px(8)} size={9} />
			{roof.rafters.length > 1 && <DimLine x1={X(roof.rafters[0].center)} y1={Y(mid)} x2={X(roof.rafters[1].center)} y2={Y(mid)} label={format(roof.rafters[1].center - roof.rafters[0].center)} offset={px(10)} extensions={false} size={8} />}
		</>
	);
}
