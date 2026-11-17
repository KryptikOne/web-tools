"use client";

import { Diagram, DimLine, AngleArc, Label, Member, useDiagramScale } from "@/components/construction/Diagram";
import diagramStyles from "@/components/construction/Diagram.module.scss";
import { inchesToMm } from "@/lib/construction/imperialUtils";
import type { Wainscot, StairWainscot } from "@/lib/construction/wainscotUtils";
import { formatAngle } from "@/lib/construction/pitchUtils";
import styles from "./WainscotDiagrams.module.scss";

const W = 180;
const PAD = 14;
const r4 = (n: number) => Math.round(n * 1e4) / 1e4;
type Fmt = { format: (inches: number) => string };

// ── Flat wall ────────────────────────────────────────────────────────────────

export interface FlatWainscotProps extends Fmt {
	frame: Wainscot;
	wallLength: number;
	frameHeight: number;
	stileWidth: number;
	topRail: number;
	bottomRail: number;
}

export function FlatWainscotDiagram(props: FlatWainscotProps) {
	const { frame, wallLength, frameHeight, format } = props;
	const k = Math.min((W - PAD * 2) / inchesToMm(wallLength), 80 / inchesToMm(frameHeight));
	const height = inchesToMm(frameHeight) * k + PAD * 2 + 12;
	return (
		<Diagram widthMm={W} heightMm={height} label={`Wainscoting elevation: ${frame.panelCount} panels ${format(frame.panelWidth)} wide between ${frame.stileCount} stiles over ${format(wallLength)}, ${format(frameHeight)} high`}>
			<FlatScene {...props} k={k} height={height} />
		</Diagram>
	);
}

function FlatScene({ frame, wallLength, frameHeight, stileWidth, topRail, bottomRail, format, k, height }: FlatWainscotProps & { k: number; height: number }) {
	const { px } = useDiagramScale();
	const X = (inches: number) => r4(PAD + inchesToMm(inches) * k);
	const Y = (inches: number) => r4(height - PAD - 12 - inchesToMm(inches) * k);
	const h = (a: number, b: number) => Math.max(r4(Y(a) - Y(b)), 0.5);
	const many = frame.panelCount > 24;
	return (
		<>
			{frame.panels.map((p) => (
				<g key={p.index}>
					<rect x={X(p.near)} y={Y(frameHeight - topRail)} width={Math.max(r4(X(p.far) - X(p.near)), 0.5)} height={h(bottomRail, frameHeight - topRail)} className={styles.panel} />
					{!many && <Label x={X((p.near + p.far) / 2)} y={r4(Y((bottomRail + frameHeight - topRail) / 2) + px(3))} text={`${p.index}`} size={8} className={styles.num} />}
				</g>
			))}
			{frame.stiles.members.map((s) => (
				<Member key={s.index} x={X(s.near)} y={Y(frameHeight - topRail)} width={Math.max(r4(X(s.far) - X(s.near)), 0.6)} height={h(bottomRail, frameHeight - topRail)} role="common" />
			))}
			<Member x={X(0)} y={Y(frameHeight)} width={r4(X(wallLength) - X(0))} height={h(frameHeight - topRail, frameHeight)} role="ridge" />
			<Member x={X(0)} y={Y(bottomRail)} width={r4(X(wallLength) - X(0))} height={h(0, bottomRail)} role="ridge" />
			<DimLine x1={X(0)} y1={Y(0)} x2={X(wallLength)} y2={Y(0)} label={format(wallLength)} offset={px(12)} size={9} />
			{frame.panels[0] && <DimLine x1={X(frame.panels[0].near)} y1={Y(frameHeight)} x2={X(frame.panels[0].far)} y2={Y(frameHeight)} label={format(frame.panelWidth)} offset={-px(8)} extensions={false} size={8} />}
			<DimLine x1={X(wallLength) + px(5)} y1={Y(0)} x2={X(wallLength) + px(5)} y2={Y(frameHeight)} label={format(frameHeight)} offset={-px(8)} extensions={false} size={8} />
			<DimLine x1={X(0) - px(5)} y1={Y(bottomRail)} x2={X(0) - px(5)} y2={Y(frameHeight - topRail)} label={format(frame.openingHeight)} offset={px(8)} extensions={false} size={8} />
			<Label x={X(stileWidth / 2)} y={Y(frameHeight) - px(3)} text={format(stileWidth)} size={7} className={styles.num} />
		</>
	);
}

// ── Stair wall ───────────────────────────────────────────────────────────────

export interface StairWainscotProps extends Fmt {
	frame: StairWainscot;
	frameHeight: number;
	stileWidth: number;
	topRail: number;
	bottomRail: number;
	rise: number;
	run: number;
}

export function StairWainscotDiagram(props: StairWainscotProps) {
	const { frame, frameHeight, format } = props;
	const L = frame.levelLength;
	const totalRise = L * Math.tan((frame.angle * Math.PI) / 180);
	const totalH = totalRise + frameHeight;
	const k = Math.min((W - PAD * 2) / inchesToMm(L), 100 / inchesToMm(totalH));
	const height = inchesToMm(totalH) * k + PAD * 2 + 12;
	return (
		<Diagram widthMm={W} heightMm={height} label={`Stair wainscoting: ${frame.panelCount} parallelogram panels between ${frame.stileCount} plumb stiles along ${format(frame.rakeLength)} of rake at ${formatAngle(frame.angle, 1)}`}>
			<StairScene {...props} k={k} height={height} totalRise={totalRise} />
		</Diagram>
	);
}

function StairScene({ frame, frameHeight, topRail, bottomRail, rise, run, format, k, height, totalRise }: StairWainscotProps & { k: number; height: number; totalRise: number }) {
	const { px } = useDiagramScale();
	const X = (inches: number) => r4(PAD + inchesToMm(inches) * k);
	const Y = (inches: number) => r4(height - PAD - 12 - inchesToMm(inches) * k);
	const tan = Math.tan((frame.angle * Math.PI) / 180);
	const L = frame.levelLength;
	// nosing line rises from 0 at x = 0; frame measured plumb above it
	const nose = (x: number) => x * tan;
	const quad = (x0: number, x1: number, y0: number, y1: number) => `${X(x0)},${Y(nose(x0) + y0)} ${X(x1)},${Y(nose(x1) + y0)} ${X(x1)},${Y(nose(x1) + y1)} ${X(x0)},${Y(nose(x0) + y1)}`;
	const bp = frame.bottomRailPlumb;
	const tp = frame.topRailPlumb;
	const treads = Math.round(L / run);
	return (
		<>
			{/* treads */}
			{Array.from({ length: treads + 1 }, (_, i) => {
				const x = i * run;
				return <polyline key={i} points={`${X(x)},${Y(nose(x))} ${X(Math.min(x + run, L))},${Y(nose(x))} ${X(Math.min(x + run, L))},${Y(nose(Math.min(x + run, L)))}`} className={styles.tread} />;
			})}
			{/* panels */}
			{frame.stiles.members.slice(0, -1).map((s, i) => {
				const next = frame.stiles.members[i + 1];
				return (
					<g key={i}>
						<polygon points={quad(s.far, next.near, bp, frameHeight - tp)} className={styles.panel} />
						{frame.panelCount <= 24 && <Label x={X((s.far + next.near) / 2)} y={r4(Y(nose((s.far + next.near) / 2) + frameHeight / 2) + px(3))} text={`${i + 1}`} size={8} className={styles.num} />}
					</g>
				);
			})}
			{/* stiles, plumb */}
			{frame.stiles.members.map((s) => (
				<polygon key={s.index} points={quad(s.near, s.far, bp, frameHeight - tp)} className={`${diagramStyles.member} ${diagramStyles["role-common"]}`} />
			))}
			{/* rails along the rake */}
			<polygon points={quad(0, L, frameHeight - tp, frameHeight)} className={`${diagramStyles.member} ${diagramStyles["role-ridge"]}`} />
			<polygon points={quad(0, L, 0, bp)} className={`${diagramStyles.member} ${diagramStyles["role-ridge"]}`} />
			<DimLine x1={X(0)} y1={Y(0) + px(2)} x2={X(L)} y2={Y(0) + px(2)} label={`${format(L)} level`} offset={px(12)} size={9} />
			<DimLine x1={X(0)} y1={Y(frameHeight)} x2={X(L)} y2={Y(totalRise + frameHeight)} label={`${format(frame.rakeLength)} along the rake`} offset={-px(10)} extensions={false} size={8} />
			<DimLine x1={X(L) + px(5)} y1={Y(totalRise)} x2={X(L) + px(5)} y2={Y(totalRise + frameHeight)} label={format(frameHeight)} offset={-px(8)} extensions={false} size={8} />
			<AngleArc cx={X(0)} cy={Y(0)} radius={r4(Math.min(16, inchesToMm(L) * k * 0.2))} startDeg={-frame.angle} endDeg={0} label={formatAngle(frame.angle, 1)} size={9} />
			<Label x={X(run / 2)} y={Y(0) - px(3)} text={`${format(run)} × ${format(rise)}`} size={7} className={styles.num} />
			<Label x={X(L) + px(5)} y={Y(totalRise + frameHeight) - px(14)} text={`rails ${format(topRail)} / ${format(bottomRail)}`} size={7} anchor="end" className={styles.num} />
		</>
	);
}
