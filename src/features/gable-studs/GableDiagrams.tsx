"use client";

import { Diagram, DimLine, AngleArc, Label, Member, useDiagramScale } from "@/components/construction/Diagram";
import diagramStyles from "@/components/construction/Diagram.module.scss";
import { inchesToMm } from "@/lib/construction/imperialUtils";
import type { GableStuds, GableShape } from "@/lib/construction/gableUtils";
import { formatAngle } from "@/lib/construction/pitchUtils";
import styles from "./GableDiagrams.module.scss";

const r4 = (n: number) => Math.round(n * 1e4) / 1e4;
type Fmt = { format: (inches: number) => string };

// ── Gable elevation, scaled to fit ───────────────────────────────────────────

export interface GableDiagramProps extends Fmt {
	result: GableStuds;
	width: number;
	shape: GableShape;
	startHeight: number;
	plateThickness: number;
	topPlates: number;
	bottomPlates: number;
	heightToScale: boolean;
}

const W = 180;
const PAD_X = 14;
const PAD_TOP = 14;
const PAD_BOTTOM = 20;

export function GableDiagram(props: GableDiagramProps) {
	const { result, width, shape, heightToScale, format } = props;
	const kx = (W - PAD_X * 2) / inchesToMm(width);
	const ky = heightToScale ? kx : Math.min(kx, 70 / inchesToMm(result.peakHeight));
	const height = inchesToMm(result.peakHeight) * ky + PAD_TOP + PAD_BOTTOM;
	return (
		<Diagram widthMm={W} heightMm={height} label={`${shape === "full" ? "Gable end" : "Raked wall"} ${format(width)} long with ${result.count} studs at ${formatAngle(result.cutAngle, 2)}, peak ${format(result.peakHeight)}, ${heightToScale ? "drawn to scale" : "height compressed"}`}>
			<Scene {...props} kx={kx} ky={ky} height={height} />
		</Diagram>
	);
}

function Scene({ result, width, shape, startHeight, plateThickness: t, topPlates, bottomPlates, kx, ky, height, format }: GableDiagramProps & { kx: number; ky: number; height: number }) {
	const { px } = useDiagramScale();
	const X = (inches: number) => r4(PAD_X + inchesToMm(inches) * kx);
	const Y = (inches: number) => r4(height - PAD_BOTTOM - inchesToMm(inches) * ky);
	const tan = Math.tan((result.cutAngle * Math.PI) / 180);
	const d = (x: number) => (shape === "full" ? Math.min(x, width - x) : x);
	/** Underside of the top plates at a level position */
	const under = (x: number) => startHeight - topPlates * result.platePlumb + d(x) * tan;
	const studBottom = bottomPlates * t;
	const peakX = shape === "full" ? width / 2 : width;
	const line = (f: (x: number) => number) => (shape === "full" ? [0, width / 2, width] : [0, width]).map((x) => `${X(x)} ${Y(f(x))}`);
	const band = (i: number) => {
		const lo = (x: number) => under(x) + i * result.platePlumb;
		const hi = (x: number) => lo(x) + result.platePlumb;
		return `M ${line(lo).join(" L ")} L ${line(hi).reverse().join(" L ")} Z`;
	};
	return (
		<>
			{Array.from({ length: bottomPlates }, (_, i) => (
				<Member key={`b${i}`} x={X(0)} y={Y((i + 1) * t)} width={X(width) - X(0)} height={Math.max(r4(Y(0) - Y(t)), 0.8)} role="wall" />
			))}
			{result.studs.map((s) => {
				const pts = [
					[X(s.near), Y(studBottom)],
					[X(s.far), Y(studBottom)],
					[X(s.far), Y(under(s.far))],
					...(s.peak ? [[X(peakX), Y(under(peakX))]] : []),
					[X(s.near), Y(under(s.near))],
				];
				return <polygon key={s.index} points={pts.map((p) => p.join(",")).join(" ")} className={`${diagramStyles.member} ${diagramStyles[s.kind === "common" ? "role-common" : "role-ridge"]}`} />;
			})}
			{Array.from({ length: topPlates }, (_, i) => (
				<path key={`t${i}`} d={band(i)} className={styles.plate} />
			))}
			{result.studs.map((s) => (
				<Label key={s.index} x={X(s.center)} y={Y(studBottom) + px(10)} text={`${s.index}`} size={8} />
			))}
			<DimLine x1={X(0)} y1={Y(0)} x2={X(width)} y2={Y(0)} label={format(width)} offset={px(16)} size={10} />
			<DimLine x1={X(0)} y1={Y(0)} x2={X(0)} y2={Y(startHeight)} label={format(startHeight)} offset={px(8)} size={9} />
			<DimLine x1={X(peakX)} y1={Y(0)} x2={X(peakX)} y2={Y(result.peakHeight)} label={format(result.peakHeight)} offset={shape === "full" ? -px(8) : px(8)} extensions={false} size={9} />
			{shape === "half" && <AngleArc cx={X(0)} cy={Y(under(0))} radius={r4(Math.min(18, (X(width) - X(0)) * 0.25))} startDeg={-result.cutAngle} endDeg={0} label={formatAngle(result.cutAngle, 1)} size={9} />}
			{shape === "full" && <AngleArc cx={X(0)} cy={Y(under(0))} radius={r4(Math.min(18, (X(width) - X(0)) * 0.2))} startDeg={-result.cutAngle} endDeg={0} label={formatAngle(result.cutAngle, 1)} size={9} />}
		</>
	);
}

// ── Top cut template, true size ──────────────────────────────────────────────

export interface TopCutTemplateProps extends Fmt {
	angle: number;
	studWidth: number;
	/** Length of stud to draw below the long point */
	lengthIn?: number;
}

export function TopCutTemplate({ angle, studWidth, lengthIn = 6, format }: TopCutTemplateProps) {
	const tan = Math.tan((angle * Math.PI) / 180);
	const drop = studWidth * tan;
	const PAD = 16;
	const width = inchesToMm(studWidth) + PAD * 2 + 30;
	const height = inchesToMm(lengthIn) + PAD * 2;
	return (
		<Diagram widthMm={width} heightMm={height} label={`Gable stud top cut template at ${formatAngle(angle, 2)} from square, ${format(drop)} drop across a ${format(studWidth)} stud, true size`} maxWidth="520px">
			<TemplateScene angle={angle} studWidth={studWidth} drop={drop} lengthIn={lengthIn} pad={PAD} format={format} />
		</Diagram>
	);
}

function TemplateScene({ angle, studWidth, drop, lengthIn, pad, format }: { angle: number; studWidth: number; drop: number; lengthIn: number; pad: number } & Fmt) {
	const { px } = useDiagramScale();
	const X = (inches: number) => r4(pad + inchesToMm(inches));
	const Y = (inches: number) => r4(pad + inchesToMm(inches));
	// long point at the top left, the cut falls `drop` toward the right (short) side
	const pts = [
		[X(0), Y(0)],
		[X(studWidth), Y(drop)],
		[X(studWidth), Y(lengthIn)],
		[X(0), Y(lengthIn)],
	];
	return (
		<>
			<polygon points={pts.map((p) => p.join(",")).join(" ")} className={`${diagramStyles.member} ${diagramStyles["role-common"]}`} />
			<line x1={X(0)} y1={Y(0)} x2={X(studWidth) + 20} y2={Y(0)} className={styles.square} />
			<AngleArc cx={X(0)} cy={Y(0)} radius={r4(Math.min(inchesToMm(studWidth) * 0.8, 24))} startDeg={0} endDeg={angle} label={formatAngle(angle, 1)} size={9} />
			<DimLine x1={X(studWidth)} y1={Y(0)} x2={X(studWidth)} y2={Y(drop)} label={format(drop)} offset={px(10)} size={9} />
			<Label x={X(0) - px(4)} y={Y(0) + px(4)} text="long point" size={9} anchor="end" />
			<Label x={X(studWidth) + px(4)} y={Y(drop) + px(12)} text="short point" size={9} anchor="start" />
		</>
	);
}
