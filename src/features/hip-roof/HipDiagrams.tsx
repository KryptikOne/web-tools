"use client";

import { Diagram, DimLine, AngleArc, Label, Member, useDiagramScale } from "@/components/construction/Diagram";
import diagramStyles from "@/components/construction/Diagram.module.scss";
import { inchesToMm } from "@/lib/construction/imperialUtils";
import type { HipRoof } from "@/lib/construction/hipRoofUtils";
import { formatAngle } from "@/lib/construction/pitchUtils";
import styles from "./HipDiagrams.module.scss";

const r4 = (n: number) => Math.round(n * 1e4) / 1e4;
type Pt = { x: number; y: number };
type Fmt = { format: (inches: number) => string };

const W = 180;
const PAD = 16;

// ── Framing plan ─────────────────────────────────────────────────────────────

export interface HipPlanProps extends Fmt {
	roof: HipRoof;
	buildingWidth: number;
	buildingLength: number;
	overhang: number;
	centers: number;
	thickness: number;
}

export function HipPlanDiagram(props: HipPlanProps) {
	const { roof, buildingWidth, buildingLength, overhang, format } = props;
	const totalL = buildingLength + 2 * overhang;
	const totalW = buildingWidth + 2 * overhang;
	const k = Math.min((W - PAD * 2) / inchesToMm(totalL), 100 / inchesToMm(totalW));
	const height = inchesToMm(totalW) * k + PAD * 2 + 8;
	return (
		<Diagram widthMm={W} heightMm={height} label={`Hip roof plan: ${format(buildingLength)} by ${format(buildingWidth)}, ridge ${format(roof.ridgeLength)}, four hips, ${roof.totalCommons} commons and ${roof.totalJacks} jacks at ${format(props.centers)} centers`}>
			<PlanScene {...props} k={k} />
		</Diagram>
	);
}

function PlanScene({ roof, buildingWidth, buildingLength, overhang, thickness, format, k }: HipPlanProps & { k: number }) {
	const { px } = useDiagramScale();
	const X = (inches: number) => r4(PAD + inchesToMm(inches + overhang) * k);
	const Y = (inches: number) => r4(PAD + inchesToMm(inches + overhang) * k);
	const L = buildingLength;
	const Wd = buildingWidth;
	const run = roof.run;
	const tw = Math.max(r4(inchesToMm(thickness) * k), 0.6);
	const line = (a: Pt, b: Pt, cls: string, key: string) => <line key={key} x1={X(a.x)} y1={Y(a.y)} x2={X(b.x)} y2={Y(b.y)} className={cls} />;
	const commons = Array.from({ length: roof.commonsPerSide }, (_, i) => run + i * roof.jacks.length * 0 + i * (roof.sideRafterPositions[roof.jacks.length + 1] - roof.sideRafterPositions[roof.jacks.length] || 0));
	return (
		<>
			{/* eave line and walls */}
			<rect x={X(-overhang)} y={Y(-overhang)} width={r4(X(L + overhang) - X(-overhang))} height={r4(Y(Wd + overhang) - Y(-overhang))} className={styles.eave} />
			<rect x={X(0)} y={Y(0)} width={r4(X(L) - X(0))} height={r4(Y(Wd) - Y(0))} className={styles.wall} />
			{/* side commons, both sides */}
			{commons.map((x, i) => (
				<Member key={`c${i}`} x={r4(X(x) - tw / 2)} y={Y(-overhang)} width={tw} height={r4(Y(Wd + overhang) - Y(-overhang))} role="common" />
			))}
			{/* end king commons */}
			<Member x={X(-overhang)} y={r4(Y(run) - tw / 2)} width={r4(X(run) - X(-overhang))} height={tw} role="common" />
			<Member x={X(L - run)} y={r4(Y(run) - tw / 2)} width={r4(X(L + overhang) - X(L - run))} height={tw} role="common" />
			{/* jacks on all four corners */}
			{roof.jacks.map((j) => (
				<g key={`j${j.index}`}>
					{/* long walls: jack from the eave up to the hip */}
					<Member x={r4(X(j.run) - tw / 2)} y={Y(-overhang)} width={tw} height={r4(Y(j.run) - Y(-overhang))} role="jack" />
					<Member x={r4(X(j.run) - tw / 2)} y={Y(Wd - j.run)} width={tw} height={r4(Y(Wd + overhang) - Y(Wd - j.run))} role="jack" />
					<Member x={r4(X(L - j.run) - tw / 2)} y={Y(-overhang)} width={tw} height={r4(Y(j.run) - Y(-overhang))} role="jack" />
					<Member x={r4(X(L - j.run) - tw / 2)} y={Y(Wd - j.run)} width={tw} height={r4(Y(Wd + overhang) - Y(Wd - j.run))} role="jack" />
					{/* end walls */}
					<Member x={X(-overhang)} y={r4(Y(j.run) - tw / 2)} width={r4(X(j.run) - X(-overhang))} height={tw} role="jack" />
					<Member x={X(-overhang)} y={r4(Y(Wd - j.run) - tw / 2)} width={r4(X(j.run) - X(-overhang))} height={tw} role="jack" />
					<Member x={X(L - j.run)} y={r4(Y(j.run) - tw / 2)} width={r4(X(L + overhang) - X(L - j.run))} height={tw} role="jack" />
					<Member x={X(L - j.run)} y={r4(Y(Wd - j.run) - tw / 2)} width={r4(X(L + overhang) - X(L - j.run))} height={tw} role="jack" />
				</g>
			))}
			{/* hips */}
			{line({ x: -overhang, y: -overhang }, { x: run, y: run }, styles.hip, "h1")}
			{line({ x: -overhang, y: Wd + overhang }, { x: run, y: Wd - run }, styles.hip, "h2")}
			{line({ x: L + overhang, y: -overhang }, { x: L - run, y: run }, styles.hip, "h3")}
			{line({ x: L + overhang, y: Wd + overhang }, { x: L - run, y: Wd - run }, styles.hip, "h4")}
			{/* ridge */}
			<Member x={X(run)} y={r4(Y(run) - 1)} width={r4(X(L - run) - X(run))} height={2} role="ridge" />
			{/* jack numbers along the near long wall */}
			{roof.jacks.map((j) => (
				<Label key={`n${j.index}`} x={X(j.run)} y={Y(Wd + overhang) + px(10)} text={`${j.index}`} size={8} />
			))}
			<DimLine x1={X(0)} y1={Y(Wd + overhang) + px(14)} x2={X(L)} y2={Y(Wd + overhang) + px(14)} label={`building ${format(L)}`} offset={px(4)} size={9} />
			<DimLine x1={X(run)} y1={Y(run)} x2={X(L - run)} y2={Y(run)} label={`ridge ${format(roof.ridgeLength)}`} offset={-px(8)} extensions={false} size={9} />
			<DimLine x1={X(L + overhang) + px(4)} y1={Y(0)} x2={X(L + overhang) + px(4)} y2={Y(Wd)} label={format(Wd)} offset={-px(10)} size={9} />
			<Label x={X((run - overhang) / 2) - px(6)} y={Y((run - overhang) / 2) - px(4)} text="hip" size={8} anchor="end" />
		</>
	);
}

// ── Hip drop against backing ─────────────────────────────────────────────────

export interface HipSectionProps extends Fmt {
	roof: HipRoof;
	hipDepth: number;
	hipThickness: number;
}

/** Cross section square to the hip, with the two roof planes meeting over it: dropped on the left, backed on the right. True size. */
export function HipSectionDiagram({ roof, hipDepth, hipThickness, format }: HipSectionProps) {
	const PADT = 14;
	const gap = 20;
	const w = inchesToMm(hipThickness);
	const h = inchesToMm(Math.min(hipDepth, 6));
	const width = PADT * 2 + w * 2 + gap + 50;
	const height = PADT * 2 + h + 12;
	return (
		<Diagram widthMm={width} heightMm={height} label={`Hip section: drop ${format(roof.hipDrop)} or back the top edge at ${formatAngle(roof.backingAngle, 1)} each side, true size`} maxWidth="560px">
			<HipSectionScene roof={roof} hipDepth={Math.min(hipDepth, 6)} hipThickness={hipThickness} w={w} h={h} gap={gap} pad={PADT} format={format} />
		</Diagram>
	);
}

function HipSectionScene({ roof, hipThickness, w, h, gap, pad, format }: HipSectionProps & { w: number; h: number; gap: number; pad: number }) {
	const { px } = useDiagramScale();
	const dropMm = inchesToMm(roof.hipDrop);
	// roof planes fall from the centre line at the backing angle, in this square section
	const fall = (w / 2) * Math.tan((roof.backingAngle * Math.PI) / 180);
	const planeExt = 22;
	// left: dropped hip, planes meet above its centre
	const lx = pad + 25;
	const top = pad + 12;
	const leftPeak = { x: lx + w / 2, y: top - dropMm };
	const planes = (peak: Pt, key: string) => (
		<g key={key}>
			<line x1={r4(peak.x - w / 2 - planeExt)} y1={r4(peak.y + fall * (1 + planeExt / (w / 2)))} x2={peak.x} y2={peak.y} className={styles.plane} />
			<line x1={r4(peak.x + w / 2 + planeExt)} y1={r4(peak.y + fall * (1 + planeExt / (w / 2)))} x2={peak.x} y2={peak.y} className={styles.plane} />
		</g>
	);
	const rx = lx + w + gap + 25;
	const rightPeak = { x: rx + w / 2, y: top };
	const backedPoly = [
		[rx, top + fall],
		[rx + w / 2, top],
		[rx + w, top + fall],
		[rx + w, top + h],
		[rx, top + h],
	];
	return (
		<>
			{planes(leftPeak, "pl")}
			<Member x={lx} y={top} width={w} height={h} role="hip" />
			<DimLine x1={leftPeak.x} y1={leftPeak.y} x2={leftPeak.x} y2={top} label={`drop ${format(roof.hipDrop)}`} offset={px(14)} extensions={false} size={9} />
			<Label x={lx + w / 2} y={top + h + px(12)} text="dropped" size={9} />
			{planes(rightPeak, "pr")}
			<polygon points={backedPoly.map((p) => `${r4(p[0])},${r4(p[1])}`).join(" ")} className={`${diagramStyles.member} ${diagramStyles["role-hip"]}`} />
			<AngleArc cx={rx + w} cy={top + fall} radius={r4(Math.min(10, w))} startDeg={180} endDeg={180 + roof.backingAngle} label={formatAngle(roof.backingAngle, 1)} size={9} />
			<Label x={rx + w / 2} y={top + h + px(12)} text="backed" size={9} />
			<DimLine x1={lx} y1={top + h} x2={lx + w} y2={top + h} label={format(hipThickness)} offset={px(22)} extensions={false} size={8} />
		</>
	);
}

// ── Cheek (side) cut template, top edge view, true size ──────────────────────

export interface CheekTemplateProps extends Fmt {
	/** Angle from square marked on the top edge */
	cheekAngle: number;
	thickness: number;
	/** Hip ends are cut both ways to a point; jacks one way */
	double?: boolean;
	lengthIn?: number;
	title: string;
}

export function CheekTemplate({ cheekAngle, thickness, double = false, lengthIn = 6, title, format }: CheekTemplateProps) {
	const PADT = 14;
	const run = thickness * Math.tan(((90 - cheekAngle) * Math.PI) / 180);
	const width = PADT * 2 + inchesToMm(lengthIn) + 24;
	const height = PADT * 2 + inchesToMm(thickness) + 14;
	return (
		<Diagram widthMm={width} heightMm={height} label={`${title}: ${formatAngle(cheekAngle, 2)} from square across a ${format(thickness)} edge, ${format(run)} long, true size`} maxWidth="560px">
			<CheekScene cheekAngle={cheekAngle} thickness={thickness} double={double} lengthIn={lengthIn} run={run} pad={PADT} format={format} />
		</Diagram>
	);
}

function CheekScene({ cheekAngle, thickness, double, lengthIn, run, pad, format }: { cheekAngle: number; thickness: number; double: boolean; lengthIn: number; run: number; pad: number } & Fmt) {
	const { px } = useDiagramScale();
	const X = (inches: number) => r4(pad + inchesToMm(inches));
	const Y = (inches: number) => r4(pad + inchesToMm(inches));
	// top edge of the rafter seen from above: long point at the right on the top line
	const pts: number[][] = double
		? [
				[X(0), Y(0)],
				[X(lengthIn - run), Y(0)],
				[X(lengthIn), Y(thickness / 2)],
				[X(lengthIn - run), Y(thickness)],
				[X(0), Y(thickness)],
			]
		: [
				[X(0), Y(0)],
				[X(lengthIn), Y(0)],
				[X(lengthIn - run), Y(thickness)],
				[X(0), Y(thickness)],
			];
	const halfRun = double ? run : run;
	return (
		<>
			<polygon points={pts.map((p) => p.join(",")).join(" ")} className={`${diagramStyles.member} ${diagramStyles["role-jack"]}`} />
			{/* square line at the long point */}
			<line x1={X(double ? lengthIn - run : lengthIn)} y1={Y(0) - 8} x2={X(double ? lengthIn - run : lengthIn)} y2={Y(thickness) + 4} className={styles.square} />
			<AngleArc cx={X(double ? lengthIn - run : lengthIn)} cy={Y(0)} radius={r4(Math.min(inchesToMm(thickness) * 0.7, 18))} startDeg={90} endDeg={90 + (90 - cheekAngle)} label={formatAngle(cheekAngle, 1)} size={9} />
			<DimLine x1={X(lengthIn - halfRun)} y1={Y(thickness)} x2={X(lengthIn)} y2={Y(thickness)} label={format(run)} offset={px(10)} extensions={false} size={8} />
			<Label x={X(0) + px(4)} y={Y(thickness / 2) + px(3)} text="top edge" size={8} anchor="start" />
		</>
	);
}
