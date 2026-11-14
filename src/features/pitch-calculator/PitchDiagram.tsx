"use client";

import { Diagram, DimLine, AngleArc, Label, Member, useDiagramScale } from "@/components/construction/Diagram";
import diagramStyles from "@/components/construction/Diagram.module.scss";
import { inchesToMm } from "@/lib/construction/imperialUtils";
import { formatAngle, type AnglePrecision, type Slope } from "@/lib/construction/pitchUtils";
import styles from "./PitchDiagram.module.scss";

export type Orientation = "left" | "right";

export interface PitchDiagramProps {
	slope: Slope;
	orientation: Orientation;
	anglePrecision: AnglePrecision;
	showPerson: boolean;
	/** Formats inches in the site units */
	format: (inches: number) => string;
}

/** Drawing width in mm; the triangle is scaled to fit and the ratio is reported by `drawingScale`. */
export const DRAWING_WIDTH_MM = 180;
const PAD = 24;
const AVAIL_W = DRAWING_WIDTH_MM - PAD * 2;
const AVAIL_H = 110;
/** Average adult height used for the optional silhouette, in inches. */
export const PERSON_HEIGHT_IN = 69;
/** The silhouette only makes sense once the run is longer than this, in inches. */
export const PERSON_MIN_RUN_IN = 72;

/** mm on paper per mm of real length for a slope at the drawing size. */
export function drawingScale(slope: Slope): number {
	const runMm = inchesToMm(slope.run);
	const riseMm = inchesToMm(Math.abs(slope.rise));
	const byWidth = AVAIL_W / runMm;
	const byHeight = riseMm > 0 ? AVAIL_H / riseMm : Infinity;
	return Math.min(byWidth, byHeight);
}

export default function PitchDiagram(props: PitchDiagramProps) {
	const { slope, format } = props;
	const k = drawingScale(slope);
	const rh = inchesToMm(Math.abs(slope.rise)) * k;
	const height = Math.max(rh, 40) + PAD * 2;
	return (
		<Diagram widthMm={DRAWING_WIDTH_MM} heightMm={height} label={`Right triangle with run ${format(slope.run)}, rise ${format(slope.rise)} and base angle ${formatAngle(slope.angle, props.anglePrecision)}`} maxWidth="720px">
			<Scene {...props} k={k} height={height} />
		</Diagram>
	);
}

function Scene({ slope, orientation, anglePrecision, showPerson, format, k, height }: PitchDiagramProps & { k: number; height: number }) {
	const { px } = useDiagramScale();
	const rw = inchesToMm(slope.run) * k;
	const rh = inchesToMm(Math.abs(slope.rise)) * k;
	const right = orientation === "right";
	const mirror = (x: number) => (right ? x : DRAWING_WIDTH_MM - x);

	// Angle vertex A, far end of the run B, top of the rise C
	const baseY = height - PAD;
	const ax = mirror(PAD);
	const bx = mirror(PAD + rw);
	const cy = baseY - rh;

	const scaleRadius = Math.max(18, Math.min(rw, AVAIL_H) * 0.45);
	const dir = right ? 1 : -1;
	const toSvgDeg = (deg: number) => (right ? -deg : 180 + deg);
	// Rounded so server and browser trig agree to the digit and hydration stays clean.
	const r4 = (n: number) => Math.round(n * 1e4) / 1e4;
	const polar = (deg: number, r: number) => {
		const rad = (toSvgDeg(deg) * Math.PI) / 180;
		return { x: r4(ax + r * Math.cos(rad)), y: r4(baseY + r * Math.sin(rad)) };
	};

	const personH = inchesToMm(PERSON_HEIGHT_IN) * k;
	const personX = ax + dir * rw * 0.8;

	return (
		<>
			{/* ground line */}
			<Member x={Math.min(ax, bx) - 6} y={baseY} width={rw + 12} height={1.5} role="wall" />
			<path d={`M ${ax} ${baseY} L ${bx} ${baseY} L ${bx} ${cy} Z`} className={`${diagramStyles.member} ${diagramStyles["role-common"]}`} />

			{/* angle scale: a protractor quadrant at the base angle */}
			<g>
				<path d={`M ${polar(0, scaleRadius).x} ${polar(0, scaleRadius).y} A ${scaleRadius} ${scaleRadius} 0 0 ${right ? 0 : 1} ${polar(90, scaleRadius).x} ${polar(90, scaleRadius).y}`} className={diagramStyles.dimLine} />
				{Array.from({ length: 19 }, (_, i) => i * 5).map((deg) => {
					const major = deg % 15 === 0;
					const inner = polar(deg, scaleRadius - (major ? 4 : 2));
					const outer = polar(deg, scaleRadius);
					const lab = polar(deg, scaleRadius + px(9));
					return (
						<g key={deg}>
							<line x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} className={diagramStyles.dimLine} />
							{major && <Label x={lab.x} y={lab.y} text={`${deg}°`} size={9} className={styles.scaleLabel} />}
						</g>
					);
				})}
				<line x1={ax} y1={baseY} x2={polar(slope.angle, scaleRadius + 2).x} y2={polar(slope.angle, scaleRadius + 2).y} className={styles.pointer} />
			</g>

			{showPerson && slope.run >= PERSON_MIN_RUN_IN && <Person x={personX} baseY={baseY} height={personH} />}

			<DimLine x1={Math.min(ax, bx)} y1={baseY} x2={Math.max(ax, bx)} y2={baseY} label={`Run ${format(slope.run)}`} offset={10} />
			<DimLine x1={bx} y1={baseY} x2={bx} y2={cy} label={`Rise ${format(slope.rise)}`} offset={right ? 10 : -10} />
			<DimLine x1={ax} y1={baseY} x2={bx} y2={cy} label={`Slope ${format(slope.length)}`} offset={right ? -6 : 6} extensions={false} />
			<AngleArc cx={ax} cy={baseY} radius={scaleRadius * 0.38} startDeg={right ? -slope.angle : 180} endDeg={right ? 0 : 180 + slope.angle} label={formatAngle(slope.angle, anglePrecision)} />
			<Label x={bx - dir * 3} y={baseY - 3} text="90°" anchor={right ? "end" : "start"} size={10} />
		</>
	);
}

/** Simple standing figure, `height` mm tall with feet at `baseY`. */
function Person({ x, baseY, height }: { x: number; baseY: number; height: number }) {
	const s = height / PERSON_HEIGHT_IN; // mm per inch of figure
	const top = baseY - height;
	const headR = 4.5 * s;
	return (
		<g className={styles.person}>
			<circle cx={x} cy={top + headR} r={headR} />
			<line x1={x} y1={top + headR * 2} x2={x} y2={top + 42 * s} />
			<line x1={x - 9 * s} y1={top + 26 * s} x2={x + 9 * s} y2={top + 26 * s} />
			<line x1={x} y1={top + 42 * s} x2={x - 5 * s} y2={baseY} />
			<line x1={x} y1={top + 42 * s} x2={x + 5 * s} y2={baseY} />
		</g>
	);
}
