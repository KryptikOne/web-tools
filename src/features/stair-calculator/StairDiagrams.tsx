"use client";

import { Diagram, DimLine, AngleArc, Label, Member, useDiagramScale } from "@/components/construction/Diagram";
import diagramStyles from "@/components/construction/Diagram.module.scss";
import { inchesToMm } from "@/lib/construction/imperialUtils";
import type { Stair, Construction } from "@/lib/construction/stairUtils";
import { formatAngle } from "@/lib/construction/pitchUtils";
import styles from "./StairDiagrams.module.scss";

const r4 = (n: number) => Math.round(n * 1e4) / 1e4;

interface Fmt {
	format: (inches: number) => string;
}

// ── Flight side view ─────────────────────────────────────────────────────────

export interface StairDiagramProps extends Fmt {
	stair: Stair;
	view: "notched" | "housed";
	construction: Construction;
	stringerWidth: number;
	throat: number;
	treadThickness: number;
	riserThickness: number;
	nosing: number;
	floorThickness: number;
	openingLength: number;
	showHeadroom: boolean;
	labels: boolean;
}

const W = 180;
const PAD = 16;

export function StairDiagram(props: StairDiagramProps) {
	const { stair, floorThickness, openingLength, showHeadroom } = props;
	const totalRise = stair.rise * stair.risers;
	const extraRight = showHeadroom ? Math.max(0, openingLength - stair.totalRun) + 24 : 24;
	const spanW = stair.totalRun + extraRight + 12;
	const spanH = totalRise + floorThickness + 12 + (showHeadroom ? 40 : 0);
	const k = Math.min((W - PAD * 2) / inchesToMm(spanW), 120 / inchesToMm(spanH));
	const height = inchesToMm(spanH) * k + PAD * 2;
	return (
		<Diagram widthMm={W} heightMm={height} label={`${stair.risers} risers at ${props.format(stair.rise)}, ${stair.treads} treads at ${props.format(stair.run)}, ${formatAngle(stair.angle, 1)}, ${props.view} stringer${showHeadroom ? `, headroom ${props.format(stair.headroom)}` : ""}, drawn to fit`} maxWidth="820px">
			<FlightScene {...props} k={k} height={height} totalRise={totalRise} />
		</Diagram>
	);
}

function FlightScene({ stair, view, construction, stringerWidth, throat, treadThickness, riserThickness, nosing, floorThickness, openingLength, showHeadroom, labels, format, k, height, totalRise }: StairDiagramProps & { k: number; height: number; totalRise: number }) {
	const { px } = useDiagramScale();
	const mm = (inches: number) => inchesToMm(inches) * k;
	const x0 = PAD + mm(6);
	const baseY = height - PAD;
	const X = (inches: number) => r4(x0 + mm(inches));
	const Y = (inches: number) => r4(baseY - mm(inches));
	const { rise, run, treads, risers } = stair;
	const t = Math.atan2(rise, run);
	const topY = risers * rise; // upper floor surface
	const topX = treads * run; // face of the top riser (or back of the top tread when level)
	const showStringer = construction === "wood";
	const stringerW = showStringer ? stringerWidth : throat;

	// stringer outline: the nosing line runs through the step corners; the bottom edge is stringerW square below it
	const nx = Math.sin(t) * stringerW; // offset of the lower edge, x component (inches)
	const ny = Math.cos(t) * stringerW;
	const lowTop = { x: 0, y: rise }; // first step corner on the nosing line
	const highTop = { x: topX, y: topY };
	const lowBottom = { x: lowTop.x + nx, y: lowTop.y - ny };
	const highBottom = { x: highTop.x + nx, y: highTop.y - ny };
	// extend the lower edge down to the floor and up to the top riser face / header
	const bottomAtFloorX = lowBottom.x - lowBottom.y / Math.tan(t);
	const topAtFaceY = highBottom.y + (topX + riserThickness - highBottom.x) * Math.tan(t);
	const stringerPts = showStringer
		? view === "notched"
			? [
					{ x: bottomAtFloorX, y: 0 },
					...Array.from({ length: treads }, (_, i) => [
						{ x: i * run, y: i * rise },
						{ x: i * run, y: (i + 1) * rise },
					]).flat(),
					{ x: topX, y: topY },
					{ x: topX + riserThickness, y: topY },
					{ x: topX + riserThickness, y: Math.min(topAtFaceY, topY) },
				]
			: [
					{ x: bottomAtFloorX, y: 0 },
					{ x: 0, y: 0 },
					{ x: 0, y: rise + treadThickness + 1 },
					{ x: topX + riserThickness, y: topY + 1 },
					{ x: topX + riserThickness, y: Math.min(topAtFaceY, topY) },
				]
		: [];
	const concretePts = !showStringer
		? [
				{ x: bottomAtFloorX, y: 0 },
				...Array.from({ length: treads }, (_, i) => [
					{ x: i * run, y: i * rise },
					{ x: i * run, y: (i + 1) * rise },
				]).flat(),
				{ x: topX, y: topY },
				{ x: topX + 6, y: topY },
				{ x: topX + 6, y: Math.min(highBottom.y + (topX + 6 - highBottom.x) * Math.tan(t), topY) },
			]
		: [];
	const poly = (pts: { x: number; y: number }[]) => pts.map((p) => `${X(p.x)},${Y(p.y)}`).join(" ");

	// headroom: floor above from the top riser back over the flight, opening ends openingLength back
	const openEnd = topX - openingLength;
	const headY = topY - floorThickness;
	const headroomAtOpening = headY - (topY - openingLength * Math.tan(t)) + 0; // vertical clearance to nosing line
	return (
		<>
			<line x1={X(-6)} y1={Y(0)} x2={X(topX + 30)} y2={Y(0)} className={styles.floor} />
			{/* upper floor */}
			<Member x={X(topX)} y={Y(topY)} width={r4(mm(30))} height={r4(mm(floorThickness))} role="wall" />
			{showHeadroom && <Member x={X(Math.min(openEnd, -6))} y={Y(topY)} width={r4(X(openEnd) - X(Math.min(openEnd, -6)))} height={r4(mm(floorThickness))} role="wall" />}

			{showStringer ? <polygon points={poly(stringerPts)} className={`${diagramStyles.member} ${diagramStyles["role-stringer"]}`} /> : <polygon points={poly(concretePts)} className={`${diagramStyles.member} ${diagramStyles["role-wall"]}`} />}

			{/* treads and risers */}
			{Array.from({ length: treads }, (_, i) => (
				<g key={i}>
					{riserThickness > 0 && <Member x={X(i * run - riserThickness)} y={Y((i + 1) * rise)} width={Math.max(r4(mm(riserThickness)), 0.5)} height={r4(mm(rise - treadThickness))} role="riser" />}
					<Member x={X(i * run - nosing - riserThickness)} y={Y((i + 1) * rise + treadThickness)} width={r4(mm(run + nosing + riserThickness))} height={Math.max(r4(mm(treadThickness)), 0.5)} role="tread" />
					{labels && treads <= 20 && <Label x={X(i * run + run / 2)} y={Y((i + 1) * rise + treadThickness) - px(5)} text={`${i + 1}`} size={7} className={styles.num} />}
				</g>
			))}
			{/* top riser */}
			{riserThickness > 0 && <Member x={X(topX - riserThickness)} y={Y(topY)} width={Math.max(r4(mm(riserThickness)), 0.5)} height={r4(mm(rise))} role="riser" />}

			{/* nosing line */}
			<line x1={X(0)} y1={Y(rise)} x2={X(topX)} y2={Y(topY)} className={styles.pitch} />

			{showHeadroom && (
				<>
					<line x1={X(openEnd)} y1={Y(topY)} x2={X(openEnd)} y2={Y(headY)} className={styles.opening} />
					<DimLine x1={X(openEnd)} y1={Y(topY - openingLength * Math.tan(t))} x2={X(openEnd)} y2={Y(headY)} label={`headroom ${format(headroomAtOpening)}`} extensions={false} size={9} className={styles.headroomDim} />
					<DimLine x1={X(openEnd)} y1={Y(topY + floorThickness)} x2={X(topX)} y2={Y(topY + floorThickness)} label={`opening ${format(openingLength)}`} offset={-px(8)} size={9} />
				</>
			)}

			{labels && (
				<>
					<DimLine x1={X(0)} y1={Y(0)} x2={X(topX)} y2={Y(0)} label={`total run ${format(stair.totalRun)}`} offset={px(14)} size={10} />
					<DimLine x1={X(topX + 30)} y1={Y(0)} x2={X(topX + 30)} y2={Y(topY)} label={`total rise ${format(totalRise)}`} offset={-px(8)} size={10} />
					<DimLine x1={X(0)} y1={Y(rise)} x2={X(run)} y2={Y(rise)} label={format(run)} offset={-px(5)} extensions={false} size={8} />
					<DimLine x1={X(run)} y1={Y(rise)} x2={X(run)} y2={Y(2 * rise)} label={format(rise)} offset={px(5)} extensions={false} size={8} />
					<AngleArc cx={X(0)} cy={Y(rise)} radius={Math.min(14, mm(run) * 1.2)} startDeg={-stair.angle} endDeg={0} label={formatAngle(stair.angle, 1)} size={9} />
				</>
			)}
		</>
	);
}

// ── Notching template, true size ─────────────────────────────────────────────

export interface NotchTemplateProps extends Fmt {
	stair: Stair;
	stringerWidth: number;
	treadThickness: number;
	nosing: number;
}

export function NotchTemplate({ stair, stringerWidth, treadThickness, nosing, format }: NotchTemplateProps) {
	const { rise, run } = stair;
	const t = Math.atan2(rise, run);
	const PADT = 14;
	// draw two steps worth of stringer edge, true size, with the lower edge of the board
	const steps = 2;
	const spanX = steps * run + nosing + 2;
	const nx = Math.sin(t) * stringerWidth;
	const ny = Math.cos(t) * stringerWidth;
	// the board's lower edge runs ny below the first step corner, so the drawing spans -ny .. steps × rise
	const spanY = steps * rise + ny + 2;
	const width = inchesToMm(spanX + nx) + PADT * 2;
	const height = inchesToMm(spanY) + PADT * 2;
	const X = (inches: number) => r4(PADT + inchesToMm(inches + 1));
	const Y = (inches: number) => r4(PADT + inchesToMm(steps * rise + 1 - inches));
	const stepPts = [
		{ x: 0, y: 0 },
		...Array.from({ length: steps }, (_, i) => [
			{ x: i * run, y: i * rise },
			{ x: i * run, y: (i + 1) * rise },
		]).flat(),
		{ x: steps * run, y: steps * rise },
		{ x: steps * run + nx, y: steps * rise - ny },
		{ x: nx, y: -ny },
	];
	return (
		<Diagram widthMm={width} heightMm={height} label={`Stringer notching template: rise ${format(rise)}, run ${format(run)}, ${formatAngle(stair.angle, 2)}, ${format(stair.throat)} of board left below the notch, true size`} maxWidth="820px">
			<NotchScene pts={stepPts} X={X} Y={Y} rise={rise} run={run} throat={stair.throat} treadThickness={treadThickness} angle={stair.angle} format={format} />
		</Diagram>
	);
}

function NotchScene({ pts, X, Y, rise, run, throat, treadThickness, angle, format }: { pts: { x: number; y: number }[]; X: (n: number) => number; Y: (n: number) => number; rise: number; run: number; throat: number; treadThickness: number; angle: number } & Fmt) {
	const { px } = useDiagramScale();
	return (
		<>
			<polygon points={pts.map((p) => `${X(p.x)},${Y(p.y)}`).join(" ")} className={`${diagramStyles.member} ${diagramStyles["role-stringer"]}`} />
			{/* square lines */}
			<DimLine x1={X(0)} y1={Y(rise)} x2={X(run)} y2={Y(rise)} label={`run ${format(run)}`} offset={-px(8)} extensions={false} size={10} />
			<DimLine x1={X(run)} y1={Y(rise)} x2={X(run)} y2={Y(2 * rise)} label={`rise ${format(rise)}`} offset={px(8)} extensions={false} size={10} />
			<AngleArc cx={X(0)} cy={Y(rise)} radius={18} startDeg={-angle} endDeg={0} label={formatAngle(angle, 2)} size={9} />
			{/* bottom drop reminder */}
			<line x1={X(0)} y1={Y(treadThickness)} x2={X(run * 0.6)} y2={Y(treadThickness)} className={styles.drop} />
			<Label x={X(run * 0.3)} y={Y(treadThickness) - px(5)} text={`drop ${format(treadThickness)}`} size={8} />
			<Label x={X(run * 1.5)} y={Y(rise * 1.5 - throat / Math.cos((angle * Math.PI) / 180) / 2)} text={`${format(throat)} left`} size={8} rotate={-angle} />
		</>
	);
}
