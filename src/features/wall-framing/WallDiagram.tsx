"use client";

import { Diagram, DimLine, Label, Member, useDiagramScale } from "@/components/construction/Diagram";
import { inchesToMm } from "@/lib/construction/imperialUtils";
import type { StudLayoutResult } from "@/lib/construction/framingUtils";
import styles from "./WallDiagram.module.scss";

export interface WallDiagramProps {
	layout: StudLayoutResult;
	wallLength: number;
	studHeight: number;
	plateThickness: number;
	topPlates: number;
	rakeAngle: number;
	drawSheeting: boolean;
	heightToScale: boolean;
	format: (inches: number) => string;
}

const W = 180;
const PAD_X = 12;
const PAD_TOP = 14;
const PAD_BOTTOM = 22;
const r4 = (n: number) => Math.round(n * 1e4) / 1e4;

export default function WallDiagram(props: WallDiagramProps) {
	const { layout, wallLength, studHeight, plateThickness, topPlates, rakeAngle, heightToScale, format } = props;
	const kx = (W - PAD_X * 2) / inchesToMm(wallLength);
	const rise = Math.tan((rakeAngle * Math.PI) / 180) * wallLength;
	const fullH = studHeight + Math.max(0, rise) + plateThickness * (1 + topPlates);
	const ky = heightToScale ? kx : Math.min(kx, 60 / inchesToMm(fullH));
	const hMm = inchesToMm(fullH) * ky;
	const height = hMm + PAD_TOP + PAD_BOTTOM;
	return (
		<Diagram widthMm={W} heightMm={height} label={`${layout.count} studs over a ${format(wallLength)} wall${rakeAngle ? ` raked ${rakeAngle}°` : ""}, ${layout.joints.length} sheet joints, ${heightToScale ? "drawn to scale" : "height compressed"}`}>
			<Scene {...props} kx={kx} ky={ky} height={height} />
		</Diagram>
	);
}

function Scene({ layout, wallLength, studHeight, plateThickness, topPlates, rakeAngle, drawSheeting, kx, ky, height, format }: WallDiagramProps & { kx: number; ky: number; height: number }) {
	const { px } = useDiagramScale();
	const X = (inches: number) => r4(PAD_X + inchesToMm(inches) * kx);
	const Y = (inches: number) => r4(height - PAD_BOTTOM - inchesToMm(inches) * ky);
	const wMm = (inches: number) => Math.max(inchesToMm(inches) * kx, 0.6);
	const rise = Math.tan((rakeAngle * Math.PI) / 180);
	const topAt = (x: number) => plateThickness + studHeight + x * rise;
	const plateH = Math.max(inchesToMm(plateThickness) * ky, 0.8);
	const firstCommon = layout.studs.find((s) => s.kind === "common");
	const secondCommon = layout.studs.filter((s) => s.kind === "common")[1];

	return (
		<>
			{/* bottom plate */}
			<Member x={X(0)} y={Y(plateThickness)} width={X(wallLength) - X(0)} height={plateH} role="wall" />
			{/* studs */}
			{layout.studs.map((s) => {
				const top = topAt(s.center);
				return <Member key={s.index} x={X(s.near)} y={Y(top)} width={wMm(s.far - s.near)} height={r4(Y(plateThickness) - Y(top))} role={s.kind === "common" ? "common" : s.kind === "flat" ? "hip" : "ridge"} />;
			})}
			{/* top plates follow the rake */}
			{Array.from({ length: topPlates }, (_, i) => {
				const y0 = topAt(0) + i * plateThickness;
				const y1 = topAt(wallLength) + i * plateThickness;
				const d = `M ${X(0)} ${Y(y0)} L ${X(wallLength)} ${Y(y1)} L ${X(wallLength)} ${Y(y1 + plateThickness)} L ${X(0)} ${Y(y0 + plateThickness)} Z`;
				return <path key={i} d={d} className={styles.plate} />;
			})}
			{/* sheeting */}
			{drawSheeting &&
				layout.sheets.map((sh, i) => (
					<rect key={i} x={X(sh.start)} y={Y(topAt(sh.end) + topPlates * plateThickness)} width={r4(X(sh.end) - X(sh.start))} height={r4(Y(0) - Y(topAt(sh.end) + topPlates * plateThickness))} className={styles.sheet} />
				))}
			{drawSheeting &&
				layout.joints.map((j) => (
					<g key={j.position}>
						<line x1={X(j.position)} y1={Y(0)} x2={X(j.position)} y2={Y(topAt(j.position) + topPlates * plateThickness)} className={j.overStud ? styles.jointOk : styles.jointBad} />
						{!j.overStud && <Label x={X(j.position)} y={Y(topAt(j.position) + topPlates * plateThickness) - px(6)} text="no stud" size={8} className={styles.bad} />}
					</g>
				))}
			{/* dims */}
			<DimLine x1={X(0)} y1={Y(0)} x2={X(wallLength)} y2={Y(0)} label={format(wallLength)} offset={px(14)} size={10} />
			{firstCommon && secondCommon && <DimLine x1={X(firstCommon.center)} y1={Y(topAt(firstCommon.center) + topPlates * plateThickness)} x2={X(secondCommon.center)} y2={Y(topAt(secondCommon.center) + topPlates * plateThickness)} label={`${format(secondCommon.center - firstCommon.center)} c/c`} offset={-px(8)} extensions={false} size={9} />}
			{firstCommon && <DimLine x1={X(0)} y1={Y(studHeight / 2)} x2={X(firstCommon.near)} y2={Y(studHeight / 2)} label={format(firstCommon.near)} extensions={false} size={9} />}
		</>
	);
}
