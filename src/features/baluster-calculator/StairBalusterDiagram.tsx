"use client";

import { Diagram, DimLine, Label, Member, useDiagramScale } from "@/components/construction/Diagram";
import { inchesToMm } from "@/lib/construction/imperialUtils";
import type { StairBalusterResult } from "@/lib/construction/balusterUtils";
import styles from "./StairBalusterDiagram.module.scss";

export interface StairBalusterDiagramProps {
	result: StairBalusterResult;
	run: number;
	rise: number;
	nosing: number;
	width: number;
	treadThickness: number;
	riserThickness: number;
	/** Treads drawn */
	treads: number;
	format: (inches: number) => string;
}

const WIDTH_MM = 180;
const PAD = 16;
const r4 = (n: number) => Math.round(n * 1e4) / 1e4;

/** Side view of a few treads with the balusters standing on them, scaled to fit. */
export default function StairBalusterDiagram(props: StairBalusterDiagramProps) {
	const { run, rise, nosing, treads, result, format } = props;
	const n = Math.max(1, Math.min(treads, 4));
	const totalRunMm = inchesToMm(n * run + nosing);
	const totalRiseMm = inchesToMm((n + 1) * rise + rise * 1.6); // room for balusters above the top tread
	const k = Math.min((WIDTH_MM - PAD * 2) / totalRunMm, 90 / totalRiseMm);
	const height = totalRiseMm * k + PAD * 2;
	return (
		<Diagram widthMm={WIDTH_MM} heightMm={height} label={`${n} treads with ${result.fromRiser.length} balusters each at ${format(result.centers)} centers, drawn to fit`} maxWidth="720px">
			<Scene {...props} treads={n} k={k} height={height} />
		</Diagram>
	);
}

function Scene({ result, run, rise, nosing, width, treadThickness, riserThickness, treads, format, k, height }: StairBalusterDiagramProps & { k: number; height: number }) {
	const { px } = useDiagramScale();
	const mm = (inches: number) => inchesToMm(inches) * k;
	const x0 = PAD;
	const baseY = height - PAD;
	const balusterH = mm(rise * 1.6);
	const steps = Array.from({ length: treads }, (_, t) => t);
	const topY = (t: number) => baseY - mm((t + 1) * rise);

	return (
		<>
			<Member x={x0 - 6} y={baseY} width={mm(treads * run + nosing) + 12} height={1.5} role="wall" />
			{steps.map((t) => {
				const rx = x0 + mm(t * run);
				const ty = topY(t);
				return (
					<g key={t}>
						{/* riser */}
						<Member x={rx} y={ty} width={Math.max(mm(riserThickness), 0.8)} height={mm(rise) - mm(treadThickness)} role="riser" />
						{/* tread with nosing overhanging the riser below */}
						<Member x={rx - mm(nosing)} y={ty} width={mm(run + nosing)} height={Math.max(mm(treadThickness), 0.8)} role="tread" />
						{result.fromRiser.map((p, i) => {
							const bx = rx + mm(p) - mm(width) / 2;
							return <Member key={i} x={r4(bx)} y={r4(ty - balusterH)} width={Math.max(mm(width), 0.6)} height={balusterH} role="common" />;
						})}
						<Label x={r4(rx + mm(run) / 2)} y={r4(ty + mm(treadThickness) + px(8))} text={`${t + 1}`} size={9} className={styles.number} />
					</g>
				);
			})}
			{/* back wall of the top tread */}
			<Member x={x0 + mm(treads * run)} y={topY(treads - 1) - balusterH} width={1} height={balusterH + mm(rise)} role="wall" />

			{/* dimension the first tread */}
			<DimLine x1={x0} y1={topY(0) - balusterH - px(6)} x2={x0 + mm(result.fromRiser[0])} y2={topY(0) - balusterH - px(6)} label={format(result.fromRiser[0])} extensions={false} size={9} />
			{result.fromRiser.length > 1 && (
				<DimLine x1={x0 + mm(result.fromRiser[0])} y1={topY(0) - balusterH - px(6)} x2={x0 + mm(result.fromRiser[1])} y2={topY(0) - balusterH - px(6)} label={`${format(result.centers)} c/c`} extensions={false} size={9} />
			)}
			<DimLine x1={x0} y1={baseY} x2={x0 + mm(run)} y2={baseY} label={`run ${format(run)}`} offset={8} size={9} />
			<DimLine x1={x0 - mm(nosing)} y1={baseY} x2={x0 - mm(nosing)} y2={topY(0)} label={`rise ${format(rise)}`} offset={-4} size={9} />
		</>
	);
}
