"use client";

import { Diagram, DimLine, AngleArc, Label, Member, useDiagramScale } from "./Diagram";
import diagramStyles from "./Diagram.module.scss";
import { inchesToMm } from "@/lib/construction/imperialUtils";
import type { SpacingResult } from "@/lib/construction/spacingUtils";
import { formatAngle } from "@/lib/construction/pitchUtils";
import styles from "./SpacingDiagram.module.scss";

export interface SpacingDiagramProps {
	result: SpacingResult;
	totalLength: number;
	/** Member height in inches, drawn to the same scale as the length */
	memberHeight: number;
	/** Member angle to the length line in degrees; 90 is square */
	angle: number;
	format: (inches: number) => string;
}

export const DRAWING_WIDTH_MM = 180;
const PAD_X = 12;
const PAD_TOP = 26;
const PAD_BOTTOM = 20;
const AVAIL_W = DRAWING_WIDTH_MM - PAD_X * 2;
const AVAIL_H = 36;
const r4 = (n: number) => Math.round(n * 1e4) / 1e4;

/** mm on paper per mm of real length at the drawing size. The run always fills the width; tall members are capped. */
export function spacingDrawingScale(totalLength: number): number {
	return AVAIL_W / inchesToMm(totalLength);
}

export default function SpacingDiagram(props: SpacingDiagramProps) {
	const { result, totalLength, memberHeight, angle, format } = props;
	const k = spacingDrawingScale(totalLength);
	const hMm = Math.min(inchesToMm(memberHeight) * k, AVAIL_H);
	const height = Math.max(hMm, 14) + PAD_TOP + PAD_BOTTOM;
	return (
		<Diagram widthMm={DRAWING_WIDTH_MM} heightMm={height} label={`${result.count} members over ${format(totalLength)} at ${format(result.centers)} centers and ${format(result.gap)} gaps, ${formatAngle(angle, 1)} to the line`}>
			<Scene {...props} k={k} hMm={hMm} height={height} />
		</Diagram>
	);
}

function Scene({ result, totalLength, angle, format, k, hMm, height }: SpacingDiagramProps & { k: number; hMm: number; height: number }) {
	const { px } = useDiagramScale();
	const baseY = height - PAD_BOTTOM;
	const x0 = PAD_X;
	const toMm = (inches: number) => inchesToMm(inches) * k;
	const L = toMm(totalLength);
	const lean = angle === 90 ? 0 : hMm / Math.tan((angle * Math.PI) / 180);
	const members = result.members;
	const first = members[0];
	const second = members[1];
	const last = members[members.length - 1];
	const labelSize = members.length > 24 ? 7 : members.length > 12 ? 8.5 : 10;

	return (
		<>
			<Member x={x0 - 4} y={baseY} width={L + 8} height={1.5} role="wall" />
			{members.map((m) => {
				const nx = x0 + toMm(m.near);
				const fx = x0 + toMm(m.far);
				const isEnd = Math.abs(m.near) < 1e-6 || Math.abs(m.far - totalLength) < 1e-6;
				const role = isEnd ? "ridge" : "common";
				const d = `M ${r4(nx)} ${baseY} L ${r4(fx)} ${baseY} L ${r4(fx + lean)} ${r4(baseY - hMm)} L ${r4(nx + lean)} ${r4(baseY - hMm)} Z`;
				return (
					<g key={m.index}>
						<path d={d} className={`${diagramStyles.member} ${diagramStyles[`role-${role}`]}`} />
						<Label x={r4((nx + fx) / 2 + lean)} y={r4(baseY - hMm - px(7))} text={`${m.index}`} size={labelSize} className={styles.number} />
					</g>
				);
			})}

			<DimLine x1={x0} y1={baseY} x2={x0 + L} y2={baseY} label={`Total ${format(totalLength)}`} offset={9} size={11} />
			{second && (
				<>
					<DimLine x1={r4(x0 + toMm(first.center) + lean)} y1={baseY - hMm} x2={r4(x0 + toMm(second.center) + lean)} y2={baseY - hMm} label={`${format(result.centers)} c/c`} offset={-px(18)} size={10} />
					{result.gap > 1e-6 && (
						<DimLine x1={r4(x0 + toMm(first.far) + lean / 2)} y1={baseY - hMm / 2} x2={r4(x0 + toMm(second.near) + lean / 2)} y2={baseY - hMm / 2} label={`gap ${format(result.gap)}`} extensions={false} size={9} />
					)}
				</>
			)}
			{first && first.near > 1e-6 && <DimLine x1={x0} y1={baseY - hMm / 2} x2={x0 + toMm(first.near)} y2={baseY - hMm / 2} label={format(result.firstGap)} extensions={false} size={9} />}
			{last && totalLength - last.far > 1e-6 && <DimLine x1={x0 + toMm(last.far)} y1={baseY - hMm / 2} x2={x0 + L} y2={baseY - hMm / 2} label={format(result.lastGap)} extensions={false} size={9} />}
			{angle !== 90 && first && <AngleArc cx={r4(x0 + toMm(first.far))} cy={baseY} radius={Math.min(10, hMm * 0.5)} startDeg={-angle} endDeg={0} label={formatAngle(angle, 1)} size={9} />}
		</>
	);
}
