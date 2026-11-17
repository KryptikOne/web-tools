"use client";

import { Diagram, Label, useDiagramScale } from "@/components/construction/Diagram";
import { scaleBarTicks } from "@/lib/construction/scaleUtils";
import styles from "./ScaleBarDiagram.module.scss";

const r4 = (n: number) => Math.round(n * 1e4) / 1e4;

export interface ScaleBarProps {
	ratio: number;
	label: string;
	system: "metric" | "imperial";
	format: (inches: number) => string;
	barLengthMm?: number;
}

/** A printed scale bar at true size: lay it on the drawing to check the print scale or read lengths off. */
export default function ScaleBarDiagram({ ratio, label, system, format, barLengthMm = 150 }: ScaleBarProps) {
	const ticks = scaleBarTicks(ratio, barLengthMm, system);
	return (
		<Diagram widthMm={barLengthMm + 30} heightMm={26} label={`Scale bar for ${label}: ${ticks.length ? `${format(ticks[ticks.length - 1].real)} over ${r4(ticks[ticks.length - 1].mm)} mm` : "no ticks"}, true size`} maxWidth="760px">
			<BarScene ticks={ticks} format={format} barLengthMm={barLengthMm} />
		</Diagram>
	);
}

function BarScene({ ticks, format, barLengthMm }: { ticks: { mm: number; real: number }[]; format: (inches: number) => string; barLengthMm: number }) {
	const { px } = useDiagramScale();
	const x0 = 10;
	const y = 10;
	return (
		<>
			<line x1={x0} y1={y} x2={x0 + barLengthMm} y2={y} className={styles.bar} />
			{ticks.map((t, i) => (
				<g key={i}>
					<rect x={r4(x0 + t.mm)} y={y - 3} width={i + 1 < ticks.length ? r4(ticks[i + 1].mm - t.mm) : 0} height={6} className={i % 2 === 0 ? styles.dark : styles.light} />
					<line x1={r4(x0 + t.mm)} y1={y - 5} x2={r4(x0 + t.mm)} y2={y + 5} className={styles.tick} />
					<Label x={r4(x0 + t.mm)} y={y + 5 + px(9)} text={format(t.real)} size={7} />
				</g>
			))}
		</>
	);
}
