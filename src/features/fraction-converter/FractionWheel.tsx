"use client";

import { Diagram, useDiagramScale } from "@/components/construction/Diagram";
import diagramStyles from "@/components/construction/Diagram.module.scss";
import { inchesToMm } from "@/lib/construction/imperialUtils";
import { formatConverted, formatDecimal, fractionText, type ConvertOption, type WheelPrecision, type ZeroOptions } from "@/lib/construction/fractionUtils";
import styles from "./FractionWheel.module.scss";

export interface FractionWheelProps {
	precision: WheelPrecision;
	option: ConvertOption;
	zeros: ZeroOptions;
	/** Value in inches whose fractional part is pointed out on the wheel */
	highlight: number | null;
}

/** Physical size of the wheel in mm: fits a letter or A4 sheet with margins. */
export const WHEEL_SIZE_MM = 180;
const C = WHEEL_SIZE_MM / 2;

// Radii in mm, outside in
const R_OUTER = 88;
const R_FRACTION_LABEL = 72;
const R_FRACTION_MAJOR = 73;
const R_FRACTION_MINOR = 70;
const R_SHARED = 64;
const R_STEP_MINOR = 61;
const R_STEP_MAJOR = 57;
const R_INNER = 55;
const R_VALUE_LABEL = 54;

const LABEL_PX: Record<WheelPrecision, number> = { 16: 11, 32: 9.5, 64: 7.5, 128: 5.5 };

/** Angle in degrees clockwise from the top for a fraction of an inch. */
function angleOf(fraction: number): number {
	return (fraction % 1) * 360;
}

function Tick({ angle, r1, r2, className }: { angle: number; r1: number; r2: number; className: string }) {
	return <line x1={C} y1={C - r1} x2={C} y2={C - r2} transform={`rotate(${angle} ${C} ${C})`} className={className} />;
}

/**
 * Text laid along the radius at the angle. On the right half it reads outward from `r`; on the left
 * half it is flipped so it stays upright, still starting at `r` and running in `direction`.
 */
function RadialText({
	angle,
	r,
	text,
	size,
	direction,
	className = "",
}: {
	angle: number;
	r: number;
	text: string;
	size: number;
	direction: "out" | "in";
	className?: string;
}) {
	const { px } = useDiagramScale();
	const left = angle > 180;
	// rotate(a) maps (C + r, C) to angle 90 + a and (C - r, C) to angle 270 + a.
	const rotation = left ? angle + 90 : angle - 90;
	const x = left ? C - r : C + r;
	const anchor = (direction === "out") !== left ? "start" : "end";
	return (
		<text x={x} y={C} fontSize={px(size)} textAnchor={anchor} transform={`rotate(${rotation} ${C} ${C})`} className={`${diagramStyles.label} ${className}`}>
			{text}
		</text>
	);
}

export default function FractionWheel(props: FractionWheelProps) {
	const { precision, option, highlight } = props;
	const summary =
		highlight !== null
			? `${fractionText(highlight, precision)}" is ${formatDecimal(highlight, 4)}" or ${formatDecimal(inchesToMm(highlight), 3)} mm`
			: `Fraction to ${option.target === "mm" ? "mm" : "decimal"} wheel at 1/${precision}`;
	return (
		<Diagram widthMm={WHEEL_SIZE_MM} heightMm={WHEEL_SIZE_MM} label={`Inch fraction wheel. ${summary}`} maxWidth="640px" className={styles.wheel}>
			<WheelScene {...props} />
		</Diagram>
	);
}

/** Drawn inside the Diagram so screen-pixel sizes come from the measured scale. */
function WheelScene({ precision, option, zeros, highlight }: FractionWheelProps) {
	const { px } = useDiagramScale();
	const labelPx = LABEL_PX[precision];
	const isMm = option.target === "mm";
	const stepCount = isMm ? 254 : 100;
	const majorEvery = isMm ? 10 : 10;

	const fractions = Array.from({ length: precision }, (_, i) => (i + 1) / precision);
	const highlightAngle = highlight !== null ? angleOf(highlight) : null;

	return (
		<>
			<circle cx={C} cy={C} r={R_OUTER} className={diagramStyles.outline} />
			<circle cx={C} cy={C} r={R_SHARED} className={diagramStyles.outline} />
			<circle cx={C} cy={C} r={R_INNER} className={diagramStyles.dimLine} />

			{/* Decimal or mm ring: ticks run inward from the shared circle */}
			{Array.from({ length: stepCount }, (_, i) => {
				const major = i % majorEvery === 0;
				const angle = (i / stepCount) * 360;
				return <Tick key={`s${i}`} angle={angle} r1={R_SHARED} r2={major ? R_STEP_MAJOR : R_STEP_MINOR} className={major ? diagramStyles.outline : diagramStyles.dimLine} />;
			})}
			{option.ringLabels &&
				Array.from({ length: stepCount }, (_, i) => {
					if (i === 0) return null;
					const angle = (i / stepCount) * 360;
					const value = isMm ? i / 10 : i / 100;
					return <RadialText key={`sl${i}`} angle={angle} r={R_VALUE_LABEL} text={formatDecimal(value, option.places, zeros)} size={5.5} direction="in" />;
				})}
			{!option.ringLabels &&
				isMm &&
				Array.from({ length: 25 }, (_, i) => i + 1).map((v) => (
					<RadialText key={`m${v}`} angle={(v / 25.4) * 360} r={R_STEP_MAJOR - 1} text={`${v}`} size={6} direction="in" className={styles.ringLabel} />
				))}

			{/* Fraction ring: ticks run outward from the shared circle so both tick sets meet on it */}
			{fractions.map((f, i) => {
				const angle = angleOf(f);
				const major = ((i + 1) * 8) % precision === 0;
				return (
					<g key={`f${i}`}>
						<Tick angle={angle} r1={R_SHARED} r2={major ? R_FRACTION_MAJOR : R_FRACTION_MINOR} className={major ? diagramStyles.outline : diagramStyles.dimLine} />
						<RadialText angle={angle} r={R_FRACTION_LABEL + 2} text={f === 1 ? "1" : fractionText(f, precision)} size={labelPx} direction="out" className={major ? styles.major : ""} />
						{!option.ringLabels && <RadialText angle={angle} r={R_VALUE_LABEL} text={formatConverted(f, option, zeros)} size={labelPx} direction="in" className={styles.value} />}
					</g>
				);
			})}

			{/* Highlighted value */}
			{highlightAngle !== null && (
				<g className={styles.pointer}>
					<line x1={C} y1={C} x2={C} y2={C - R_OUTER - 2} transform={`rotate(${highlightAngle} ${C} ${C})`} />
					<circle cx={C} cy={C - R_SHARED} r={px(3)} transform={`rotate(${highlightAngle} ${C} ${C})`} />
				</g>
			)}

			{/* Centre readout */}
			<text x={C} y={C - px(14)} fontSize={px(10)} textAnchor="middle" className={`${diagramStyles.label} ${styles.centreTitle}`}>
				1 inch
			</text>
			<text x={C} y={C} fontSize={px(9)} textAnchor="middle" className={diagramStyles.label}>
				{isMm ? "mm" : "decimal"} at 1/{precision}
			</text>
			{highlight !== null && (
				<>
					<text x={C} y={C + px(14)} fontSize={px(11)} textAnchor="middle" className={`${diagramStyles.label} ${styles.centreValue}`}>
						{fractionText(highlight, precision)}&quot;
					</text>
					<text x={C} y={C + px(28)} fontSize={px(9)} textAnchor="middle" className={diagramStyles.label}>
						{formatDecimal(highlight, 4)}&quot; · {formatDecimal(inchesToMm(highlight), 3)} mm
					</text>
				</>
			)}
		</>
	);
}
