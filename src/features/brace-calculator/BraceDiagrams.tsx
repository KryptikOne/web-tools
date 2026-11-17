"use client";

import { Diagram, DimLine, AngleArc, Label, Member, useDiagramScale } from "@/components/construction/Diagram";
import diagramStyles from "@/components/construction/Diagram.module.scss";
import { inchesToMm } from "@/lib/construction/imperialUtils";
import type { DiagonalBrace, KneeBrace } from "@/lib/construction/braceUtils";
import { formatAngle } from "@/lib/construction/pitchUtils";
import styles from "./BraceDiagrams.module.scss";

const W = 180;
const PAD = 16;
const r4 = (n: number) => Math.round(n * 1e4) / 1e4;
type Fmt = { format: (inches: number) => string };
type Pt = { x: number; y: number };

// ── Frame with a diagonal brace ──────────────────────────────────────────────

export interface FrameDiagramProps extends Fmt {
	brace: DiagonalBrace;
	frameWidth: number;
	frameHeight: number;
	braceWidth: number;
	memberWidth: number;
	ends: "corner" | "square";
}

export function FrameDiagram(props: FrameDiagramProps) {
	const { brace, frameWidth, frameHeight, memberWidth, format } = props;
	const totalW = frameWidth + 2 * memberWidth;
	const totalH = frameHeight + 2 * memberWidth;
	const k = Math.min((W - PAD * 2) / inchesToMm(totalW), 100 / inchesToMm(totalH));
	const height = inchesToMm(totalH) * k + PAD * 2 + 12;
	return (
		<Diagram widthMm={W} heightMm={height} label={`Frame ${format(frameWidth)} by ${format(frameHeight)} inside with a ${format(props.braceWidth)} brace at ${formatAngle(brace.angle, 1)}, ${format(brace.longLength)} long point to long point`}>
			<FrameScene {...props} k={k} height={height} />
		</Diagram>
	);
}

function FrameScene({ brace, frameWidth, frameHeight, braceWidth, memberWidth, ends, format, k, height }: FrameDiagramProps & { k: number; height: number }) {
	const { px } = useDiagramScale();
	const X = (inches: number) => r4(PAD + inchesToMm(inches + memberWidth) * k);
	const Y = (inches: number) => r4(height - PAD - 12 - inchesToMm(inches + memberWidth) * k);
	const m = Math.max(r4(inchesToMm(memberWidth) * k), 0.8);
	const t = (brace.angle * Math.PI) / 180;
	const u = { x: Math.cos(t), y: Math.sin(t) };
	const n = { x: -Math.sin(t), y: Math.cos(t) };
	const b = braceWidth / 2;
	const D = brace.diagonal;
	let pts: Pt[];
	if (ends === "corner") {
		// upper edge from the post face to the top plate, lower edge from the bottom plate to the far post
		const upA = { x: 0, y: b / Math.cos(t) };
		const upC = { x: frameWidth - b / Math.sin(t), y: frameHeight };
		const loA = { x: b / Math.sin(t), y: 0 };
		const loC = { x: frameWidth, y: frameHeight - b / Math.cos(t) };
		pts = [{ x: 0, y: 0 }, upA, upC, { x: frameWidth, y: frameHeight }, loC, loA];
	} else {
		const s = brace.squareSetIn;
		const a0 = { x: s * u.x, y: s * u.y };
		const a1 = { x: (D - s) * u.x, y: (D - s) * u.y };
		pts = [
			{ x: a0.x + b * n.x, y: a0.y + b * n.y },
			{ x: a1.x + b * n.x, y: a1.y + b * n.y },
			{ x: a1.x - b * n.x, y: a1.y - b * n.y },
			{ x: a0.x - b * n.x, y: a0.y - b * n.y },
		];
	}
	return (
		<>
			<Member x={X(-memberWidth)} y={Y(frameHeight + memberWidth)} width={m} height={r4(Y(-memberWidth) - Y(frameHeight + memberWidth))} role="wall" />
			<Member x={X(frameWidth)} y={Y(frameHeight + memberWidth)} width={m} height={r4(Y(-memberWidth) - Y(frameHeight + memberWidth))} role="wall" />
			<Member x={X(-memberWidth)} y={Y(frameHeight + memberWidth)} width={r4(X(frameWidth + memberWidth) - X(-memberWidth))} height={m} role="wall" />
			<Member x={X(-memberWidth)} y={Y(0)} width={r4(X(frameWidth + memberWidth) - X(-memberWidth))} height={m} role="wall" />
			{brace.notches.map((nt) => (
				<line key={nt.x} x1={X(nt.x)} y1={Y(0)} x2={X(nt.x)} y2={Y(frameHeight)} className={styles.stud} />
			))}
			<polygon points={pts.map((p) => `${X(p.x)},${Y(p.y)}`).join(" ")} className={`${diagramStyles.member} ${diagramStyles["role-common"]}`} />
			<line x1={X(0)} y1={Y(0)} x2={X(frameWidth)} y2={Y(frameHeight)} className={styles.centre} />
			<DimLine x1={X(0)} y1={Y(0) + px(2)} x2={X(frameWidth)} y2={Y(0) + px(2)} label={format(frameWidth)} offset={px(12)} size={9} />
			<DimLine x1={X(frameWidth) + px(4)} y1={Y(0)} x2={X(frameWidth) + px(4)} y2={Y(frameHeight)} label={format(frameHeight)} offset={-px(8)} extensions={false} size={9} />
			<DimLine x1={X(0)} y1={Y(0)} x2={X(frameWidth)} y2={Y(frameHeight)} label={`${format(brace.longLength)} long points`} offset={-px(14)} extensions={false} size={8} />
			<AngleArc cx={X(0)} cy={Y(0)} radius={r4(Math.min(14, inchesToMm(frameWidth) * k * 0.2))} startDeg={-brace.angle} endDeg={0} label={formatAngle(brace.angle, 1)} size={8} />
			{brace.notches.length > 0 && <Label x={X(brace.notches[0].x)} y={Y(frameHeight) - px(3)} text="let-in notches" size={7} anchor="start" className={styles.num} />}
		</>
	);
}

// ── Knee brace ───────────────────────────────────────────────────────────────

export interface KneeDiagramProps extends Fmt {
	brace: KneeBrace;
	braceWidth: number;
	postWidth: number;
	beamDepth: number;
}

export function KneeDiagram(props: KneeDiagramProps) {
	const { brace, postWidth, beamDepth, format } = props;
	const totalW = brace.run * 1.3 + postWidth;
	const totalH = brace.rise * 1.3 + beamDepth;
	const k = Math.min((W - PAD * 2) / inchesToMm(totalW), 100 / inchesToMm(totalH));
	const height = inchesToMm(totalH) * k + PAD * 2 + 12;
	return (
		<Diagram widthMm={W} heightMm={height} label={`Knee brace at ${formatAngle(brace.angle, 1)}: ${format(brace.rise)} down the post and ${format(brace.run)} along the beam, ${format(brace.longLength)} long point to long point`}>
			<KneeScene {...props} k={k} height={height} totalH={totalH} />
		</Diagram>
	);
}

function KneeScene({ brace, braceWidth, postWidth, beamDepth, format, k, totalH }: KneeDiagramProps & { k: number; height: number; totalH: number }) {
	const { px } = useDiagramScale();
	// origin at the inside corner: post face x = 0 going left, beam underside y = 0 going down
	const X = (inches: number) => r4(PAD + inchesToMm(inches + postWidth) * k);
	const Y = (inches: number) => r4(PAD + inchesToMm(beamDepth - inches) * k);
	const t = (brace.angle * Math.PI) / 180;
	const b = braceWidth / 2;
	const P = { x: 0, y: -brace.rise };
	const B = { x: brace.run, y: 0 };
	const n = { x: Math.sin(t), y: -Math.cos(t) }; // toward the outside of the corner
	const outerP = { x: 0, y: -brace.rise - b / Math.cos(t) };
	const innerP = { x: 0, y: -brace.rise + b / Math.cos(t) };
	const outerB = { x: brace.run + b / Math.sin(t), y: 0 };
	const innerB = { x: brace.run - b / Math.sin(t), y: 0 };
	void n;
	const pts = [outerP, outerB, innerB, innerP];
	return (
		<>
			<Member x={X(-postWidth)} y={Y(beamDepth)} width={r4(X(0) - X(-postWidth))} height={r4(Y(-(totalH - beamDepth)) - Y(beamDepth))} role="wall" />
			<Member x={X(-postWidth)} y={Y(beamDepth)} width={r4(X(brace.run * 1.3) - X(-postWidth))} height={r4(Y(0) - Y(beamDepth))} role="ridge" />
			<polygon points={pts.map((p) => `${X(p.x)},${Y(p.y)}`).join(" ")} className={`${diagramStyles.member} ${diagramStyles["role-common"]}`} />
			<line x1={X(P.x)} y1={Y(P.y)} x2={X(B.x)} y2={Y(B.y)} className={styles.centre} />
			<DimLine x1={X(0) - px(6)} y1={Y(0)} x2={X(0) - px(6)} y2={Y(-brace.rise)} label={format(brace.rise)} offset={px(10)} extensions={false} size={9} />
			<DimLine x1={X(0)} y1={Y(0) + px(6)} x2={X(brace.run)} y2={Y(0) + px(6)} label={format(brace.run)} offset={px(10)} extensions={false} size={9} />
			<DimLine x1={X(outerP.x)} y1={Y(outerP.y)} x2={X(outerB.x)} y2={Y(outerB.y)} label={format(brace.longLength)} offset={px(12)} extensions={false} size={8} />
			<DimLine x1={X(0) - px(16)} y1={Y(brace.postHousing.from * -1)} x2={X(0) - px(16)} y2={Y(-brace.postHousing.to)} label={`housing ${format(brace.postHousing.length)}`} offset={px(8)} extensions={false} size={7} />
			<AngleArc cx={X(B.x)} cy={Y(B.y)} radius={r4(Math.min(14, inchesToMm(brace.run) * k * 0.3))} startDeg={180} endDeg={180 + brace.angle} label={formatAngle(brace.angle, 1)} size={8} />
		</>
	);
}

// ── End cut template, true size ──────────────────────────────────────────────

export interface EndTemplateProps extends Fmt {
	/** Polygon of the brace end in inches: x along the brace, y across it */
	points: Pt[];
	cuts: { a: Pt; b: Pt; label: string }[];
	angleAt?: { c: Pt; start: number; end: number; label: string };
	title: string;
}

export function BraceEndTemplate({ points, cuts, angleAt, title, format }: EndTemplateProps) {
	const xs = points.map((p) => p.x);
	const ys = points.map((p) => p.y);
	const minX = Math.min(...xs);
	const maxX = Math.max(...xs);
	const minY = Math.min(...ys);
	const maxY = Math.max(...ys);
	const PADT = 14;
	const k = Math.min(1, 150 / inchesToMm(maxX - minX), 60 / inchesToMm(maxY - minY));
	const width = inchesToMm(maxX - minX) * k + PADT * 2 + 10;
	const height = inchesToMm(maxY - minY) * k + PADT * 2 + 10;
	return (
		<Diagram widthMm={width} heightMm={height} label={`${title}, ${k === 1 ? "true size" : "drawn to fit"}`} maxWidth="680px">
			<EndScene points={points} cuts={cuts} angleAt={angleAt} minX={minX} maxY={maxY} k={k} pad={PADT} format={format} />
		</Diagram>
	);
}

function EndScene({ points, cuts, angleAt, minX, maxY, k, pad, format }: { points: Pt[]; cuts: EndTemplateProps["cuts"]; angleAt?: EndTemplateProps["angleAt"]; minX: number; maxY: number; k: number; pad: number } & Fmt) {
	const { px } = useDiagramScale();
	const P = (p: Pt): Pt => ({ x: r4(pad + inchesToMm(p.x - minX) * k), y: r4(pad + inchesToMm(maxY - p.y) * k) });
	void format;
	return (
		<>
			<polygon points={points.map(P).map((p) => `${p.x},${p.y}`).join(" ")} className={`${diagramStyles.member} ${diagramStyles["role-common"]}`} />
			{cuts.map((c, i) => {
				const a = P(c.a);
				const b = P(c.b);
				return <DimLine key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} label={c.label} offset={-px(10)} extensions={false} size={8} />;
			})}
			{angleAt && <AngleArc cx={P(angleAt.c).x} cy={P(angleAt.c).y} radius={10} startDeg={angleAt.start} endDeg={angleAt.end} label={angleAt.label} size={8} />}
		</>
	);
}
