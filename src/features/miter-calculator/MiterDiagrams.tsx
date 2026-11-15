"use client";

import { Diagram, DimLine, AngleArc, Label, useDiagramScale, type MemberRole } from "@/components/construction/Diagram";
import diagramStyles from "@/components/construction/Diagram.module.scss";
import { inchesToMm } from "@/lib/construction/imperialUtils";
import type { CompoundMiter, MiterJoint } from "@/lib/construction/miterUtils";
import { compoundFaceOutline } from "@/lib/construction/miterUtils";
import { formatAngle } from "@/lib/construction/pitchUtils";
import styles from "./MiterDiagrams.module.scss";

const r4 = (n: number) => Math.round(n * 1e4) / 1e4;
type Pt = { x: number; y: number };

interface Fmt {
	format: (inches: number) => string;
}

// ── Plain miter, true scale ──────────────────────────────────────────────────

export interface MiterDiagramProps extends Fmt {
	width1: number;
	width2: number;
	cornerAngle: number;
	joint: MiterJoint;
	role: MemberRole;
	showDimensions: boolean;
}

/** Geometry in mm with the outer corner at the origin; piece 1 runs left, piece 2 at the corner angle. */
function miterGeometry(width1: number, width2: number, cornerAngle: number) {
	const w1 = inchesToMm(width1);
	const w2 = inchesToMm(width2);
	const t = (cornerAngle * Math.PI) / 180;
	const u1: Pt = { x: -1, y: 0 };
	const u2: Pt = { x: -Math.cos(t), y: -Math.sin(t) };
	// inward normals: each toward the other piece
	const n1: Pt = { x: 0, y: -1 };
	const n2: Pt = { x: -Math.sin(t), y: Math.cos(t) };
	// P with P·n1 = w1 and P·n2 = w2
	const py = -w1;
	const px = (w2 - py * n2.y) / n2.x;
	const P: Pt = { x: px, y: py };
	const len = Math.max(w1, w2) * 2.4;
	const piece1: Pt[] = [{ x: 0, y: 0 }, { x: u1.x * len, y: 0 }, { x: u1.x * len + n1.x * w1, y: n1.y * w1 }, P];
	const piece2: Pt[] = [{ x: 0, y: 0 }, { x: u2.x * len, y: u2.y * len }, { x: u2.x * len + n2.x * w2, y: u2.y * len + n2.y * w2 }, P];
	const all = [...piece1, ...piece2];
	const minX = Math.min(...all.map((p) => p.x));
	const maxX = Math.max(...all.map((p) => p.x));
	const minY = Math.min(...all.map((p) => p.y));
	const maxY = Math.max(...all.map((p) => p.y));
	return { w1, w2, u1, u2, n1, n2, P, len, piece1, piece2, minX, maxX, minY, maxY };
}

export function MiterDiagram(props: MiterDiagramProps) {
	const g = miterGeometry(props.width1, props.width2, props.cornerAngle);
	const PAD = 28;
	const width = g.maxX - g.minX + PAD * 2;
	const height = g.maxY - g.minY + PAD * 2;
	return (
		<Diagram widthMm={width} heightMm={height} label={`Miter at a ${formatAngle(props.cornerAngle, 1)} corner between ${props.format(props.width1)} and ${props.format(props.width2)} wide pieces, cut at ${formatAngle(props.joint.angle1, 2)} and ${formatAngle(props.joint.angle2, 2)}, true size`} maxWidth="720px">
			<MiterScene {...props} g={g} ox={PAD - g.minX} oy={PAD - g.minY} />
		</Diagram>
	);
}

function MiterScene({ joint, role, showDimensions, format, width1, width2, cornerAngle, g, ox, oy }: MiterDiagramProps & { g: ReturnType<typeof miterGeometry>; ox: number; oy: number }) {
	const { px } = useDiagramScale();
	const T = (p: Pt): Pt => ({ x: r4(p.x + ox), y: r4(p.y + oy) });
	const poly = (pts: Pt[]) => pts.map(T).map((p) => `${p.x},${p.y}`).join(" ");
	const O = T({ x: 0, y: 0 });
	const P = T(g.P);
	const arcR = Math.min(g.w1, g.w2) * 0.6;
	const a1 = T({ x: g.u1.x * g.len * 0.55, y: g.u1.y * g.len * 0.55 });
	const a1b = T({ x: g.u1.x * g.len * 0.55 + g.n1.x * g.w1, y: g.u1.y * g.len * 0.55 + g.n1.y * g.w1 });
	const a2 = T({ x: g.u2.x * g.len * 0.55, y: g.u2.y * g.len * 0.55 });
	const a2b = T({ x: g.u2.x * g.len * 0.55 + g.n2.x * g.w2, y: g.u2.y * g.len * 0.55 + g.n2.y * g.w2 });
	return (
		<>
			<polygon points={poly(g.piece1)} className={`${diagramStyles.member} ${diagramStyles[`role-${role}`]}`} />
			<polygon points={poly(g.piece2)} className={`${diagramStyles.member} ${diagramStyles[`role-${role}`]} ${styles.second}`} />
			<line x1={O.x} y1={O.y} x2={P.x} y2={P.y} className={styles.joint} />
			{showDimensions && (
				<>
					<DimLine x1={a1.x} y1={a1.y} x2={a1b.x} y2={a1b.y} label={format(width1)} offset={-px(14)} size={10} />
					<DimLine x1={a2.x} y1={a2.y} x2={a2b.x} y2={a2b.y} label={format(width2)} offset={px(14)} size={10} />
					<DimLine x1={O.x} y1={O.y} x2={P.x} y2={P.y} label={format(joint.jointLength)} offset={0} extensions={false} size={9} className={styles.jointDim} />
					{/* piece 1 runs at 180°, the joint at 180° + angle 1, piece 2 at 180° + corner angle (SVG degrees, clockwise) */}
					<AngleArc cx={O.x} cy={O.y} radius={arcR} startDeg={180} endDeg={180 + joint.angle1} label={formatAngle(joint.angle1, 2)} size={10} />
					<AngleArc cx={O.x} cy={O.y} radius={arcR * 0.7} startDeg={180 + joint.angle1} endDeg={180 + cornerAngle} label={formatAngle(joint.angle2, 2)} size={10} />
					<Label x={r4(O.x + g.u1.x * g.len * 0.85)} y={r4(O.y + g.n1.y * g.w1 * 0.5)} text="1" size={11} />
					<Label x={r4(O.x + g.u2.x * g.len * 0.85 + g.n2.x * g.w2 * 0.5)} y={r4(O.y + g.u2.y * g.len * 0.85 + g.n2.y * g.w2 * 0.5)} text="2" size={11} />
				</>
			)}
		</>
	);
}

// ── Saw gauge ────────────────────────────────────────────────────────────────

export interface SawGaugeProps {
	label: string;
	/** Degrees from square */
	value: number;
	/** Scale extent each side of square */
	max?: number;
	/** Mirror the pointer to the left of square */
	left?: boolean;
}

/** A miter-saw style scale: 0 at square in the middle, pointer at the setting. */
export function SawGauge({ label, value, max = 60, left = false }: SawGaugeProps) {
	const W = 200;
	const H = 118;
	const cx = W / 2;
	const cy = H - 12;
	const R = 92;
	const tick = (deg: number, r0: number, r1: number) => {
		const a = ((-90 + deg) * Math.PI) / 180;
		return { x1: r4(cx + r0 * Math.cos(a)), y1: r4(cy + r0 * Math.sin(a)), x2: r4(cx + r1 * Math.cos(a)), y2: r4(cy + r1 * Math.sin(a)) };
	};
	const degs: number[] = [];
	for (let d = -max; d <= max; d += 5) degs.push(d);
	const ptr = tick((left ? -1 : 1) * Math.min(value, max), 0, R - 6);
	return (
		<figure className={styles.gauge}>
			<svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${label} ${formatAngle(value, 2)}`}>
				<path d={`M ${cx - R} ${cy} A ${R} ${R} 0 0 1 ${cx + R} ${cy}`} className={styles.gaugeArc} />
				{degs.map((d) => {
					const major = d % 15 === 0;
					const t = tick(d, R - (major ? 10 : 5), R);
					const lp = tick(d, R - 18, R - 18);
					return (
						<g key={d}>
							<line {...t} className={styles.gaugeTick} />
							{major && (
								<text x={lp.x1} y={lp.y1} className={styles.gaugeText} textAnchor="middle" dominantBaseline="middle">
									{Math.abs(d)}
								</text>
							)}
						</g>
					);
				})}
				<line x1={ptr.x1} y1={ptr.y1} x2={ptr.x2} y2={ptr.y2} className={styles.gaugePointer} />
				<circle cx={cx} cy={cy} r={4} className={styles.gaugeHub} />
			</svg>
			<figcaption className={styles.gaugeCaption}>
				{label} <strong>{formatAngle(value, 2)}</strong>
			</figcaption>
		</figure>
	);
}

// ── Compound miter: fold-over template, true scale ───────────────────────────

export interface CompoundTemplateProps extends Fmt {
	miter: CompoundMiter;
	thickness: number;
}

export function CompoundTemplate({ miter, thickness, format }: CompoundTemplateProps) {
	const face = compoundFaceOutline(miter).map((p) => ({ x: inchesToMm(p.x), y: inchesToMm(p.y) }));
	const t = inchesToMm(thickness);
	const PAD = 24;
	const w = inchesToMm(miter.baseLength) + PAD * 2;
	const h = inchesToMm(miter.slantHeight) + t + PAD * 2 + 6;
	return (
		<Diagram widthMm={w} heightMm={h} label={`Template for one side: ${format(miter.baseLength)} along the base, ${format(miter.topLength)} along the top, ${format(miter.slantHeight)} across the face, fold over the base edge for the ${format(thickness)} edge, true size`} maxWidth="720px">
			<CompoundTemplateScene miter={miter} thickness={thickness} format={format} face={face} t={t} ox={PAD + inchesToMm(miter.baseLength) / 2} oy={PAD + inchesToMm(miter.slantHeight)} />
		</Diagram>
	);
}

function CompoundTemplateScene({ miter, format, face, t, ox, oy }: CompoundTemplateProps & { face: Pt[]; t: number; ox: number; oy: number }) {
	const { px } = useDiagramScale();
	const T = (p: Pt): Pt => ({ x: r4(ox + p.x), y: r4(oy - p.y) });
	const [bl, br, tr, tl] = face.map(T);
	const inset = inchesToMm(miter.bevelInset);
	// inside-face outline: each cut end moved in by the bevel inset, perpendicular to the cut
	const cutDir = (a: Pt, b: Pt) => {
		const dx = b.x - a.x;
		const dy = b.y - a.y;
		const L = Math.hypot(dx, dy) || 1;
		return { x: -dy / L, y: dx / L };
	};
	const nL = cutDir(bl, tl);
	const nR = cutDir(br, tr);
	const inner = [
		{ x: r4(bl.x + nL.x * inset), y: r4(bl.y + nL.y * inset) },
		{ x: r4(br.x - nR.x * inset), y: r4(br.y - nR.y * inset) },
		{ x: r4(tr.x - nR.x * inset), y: r4(tr.y - nR.y * inset) },
		{ x: r4(tl.x + nL.x * inset), y: r4(tl.y + nL.y * inset) },
	];
	// fold-over flap for the base edge (the thickness), below the base line
	const flap = [bl, br, { x: br.x, y: r4(br.y + t) }, { x: bl.x, y: r4(bl.y + t) }];
	return (
		<>
			<polygon points={[bl, br, tr, tl].map((p) => `${p.x},${p.y}`).join(" ")} className={`${diagramStyles.member} ${diagramStyles["role-common"]}`} />
			{inset > 0.05 && <polygon points={inner.map((p) => `${p.x},${p.y}`).join(" ")} className={styles.innerFace} />}
			{t > 0 && <polygon points={flap.map((p) => `${p.x},${p.y}`).join(" ")} className={styles.flap} />}
			<line x1={bl.x} y1={bl.y} x2={br.x} y2={br.y} className={styles.fold} />
			<DimLine x1={bl.x} y1={bl.y} x2={br.x} y2={br.y} label={`base ${format(miter.baseLength)}`} offset={t + px(12)} size={10} />
			{miter.topLength > 0.01 && <DimLine x1={tl.x} y1={tl.y} x2={tr.x} y2={tr.y} label={`top ${format(miter.topLength)}`} offset={-px(10)} size={10} />}
			<DimLine x1={br.x} y1={br.y} x2={tr.x} y2={tr.y} label={format(miter.slantHeight)} offset={px(12)} size={10} />
			<AngleArc cx={br.x} cy={br.y} radius={Math.min(14, inchesToMm(miter.slantHeight) * 0.4)} startDeg={180} endDeg={180 + (90 - miter.miter)} label={formatAngle(90 - miter.miter, 2)} size={9} />
			<Label x={r4((bl.x + br.x) / 2)} y={r4(bl.y + t / 2)} text={t > px(9) ? "fold: edge" : ""} size={8} />
		</>
	);
}

// ── Compound miter: rotating preview ─────────────────────────────────────────

export interface FormPreviewProps {
	miter: CompoundMiter;
	/** Degrees of turn around the vertical axis */
	yaw: number;
	height: number;
}

/** Orthographic wireframe of the form, tilted so the top is visible, turned by `yaw`. */
export function FormPreview({ miter, yaw, height }: FormPreviewProps) {
	const n = miter.sides;
	const phi = Math.PI / n;
	const rb = miter.baseLength / 2 / Math.sin(phi);
	const rt = miter.topLength / 2 / Math.sin(phi);
	const tilt = (28 * Math.PI) / 180;
	const yawR = (yaw * Math.PI) / 180;
	const scale = 90 / Math.max(rb * 2, height, 1);
	const W = 240;
	const H = 200;
	const project = (x: number, y: number, z: number) => {
		const X = x * Math.cos(yawR) - z * Math.sin(yawR);
		const Z = x * Math.sin(yawR) + z * Math.cos(yawR);
		return { x: r4(W / 2 + X * scale), y: r4(H / 2 + 30 - (y * Math.cos(tilt) - Z * Math.sin(tilt)) * scale) };
	};
	const ring = (r: number, y: number) => Array.from({ length: n }, (_, i) => project(r * Math.cos(i * 2 * phi + phi), y, r * Math.sin(i * 2 * phi + phi)));
	const base = ring(rb, 0);
	const top = ring(rt, height);
	const faceNormalZ = (i: number) => {
		// outward normal of face i after yaw; faces pointing toward the viewer (positive) draw solid
		const a = (i + 1) * 2 * phi;
		const nx = Math.cos(a);
		const nz = Math.sin(a);
		return nx * Math.sin(yawR) + nz * Math.cos(yawR);
	};
	return (
		<svg viewBox={`0 0 ${W} ${H}`} className={styles.preview} role="img" aria-label={`${n}-sided form turned ${Math.round(yaw)}°`}>
			{base.map((b, i) => {
				const j = (i + 1) % n;
				const front = faceNormalZ(i) > 0;
				const pts = [b, base[j], top[j], top[i]];
				return <polygon key={i} points={pts.map((p) => `${p.x},${p.y}`).join(" ")} className={front ? styles.faceFront : styles.faceBack} />;
			})}
			<polygon points={top.map((p) => `${p.x},${p.y}`).join(" ")} className={styles.faceTop} />
		</svg>
	);
}
