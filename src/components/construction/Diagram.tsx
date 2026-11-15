"use client";

import { createContext, useContext, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import styles from "./Diagram.module.scss";

/**
 * SVG primitives for construction diagrams. One user unit is one millimetre, so a Diagram sized
 * `widthMm` prints at true scale through the print stylesheet while scaling to fit on screen.
 *
 * Text, arrowheads and strokes are sized in screen pixels, not millimetres: the Diagram measures
 * how many pixels one millimetre currently occupies and the primitives convert through that, so a
 * label stays the same size on screen whether the drawing is 100 mm or 1000 mm wide. In print the
 * drawing is pinned to its physical width, so one millimetre is one millimetre and a 12 px label
 * comes out about 3 mm tall.
 */

/** Rounds trig-derived coordinates so server and browser markup agree to the digit. */
const r4 = (n: number) => Math.round(n * 1e4) / 1e4;

export const MM = 1;

/** CSS pixels per millimetre at 100% (96 dpi). */
export const PX_PER_MM_TRUE_SCALE = 96 / 25.4;

const ScaleContext = createContext(PX_PER_MM_TRUE_SCALE);

/** Current pixels-per-millimetre of the enclosing Diagram and a converter from screen pixels to user units. */
export function useDiagramScale() {
	const pxPerMm = useContext(ScaleContext);
	return { pxPerMm, px: (screenPx: number) => screenPx / pxPerMm };
}

export type MemberRole = "common" | "ridge" | "hip" | "jack" | "stringer" | "tread" | "riser" | "wall" | "fill";

export interface DiagramProps {
	widthMm: number;
	heightMm: number;
	/** Accessible description of what the drawing shows */
	label: string;
	/** Screen-only cap on the rendered width (CSS length). Default none: fills the container. */
	maxWidth?: string;
	/** Set when the drawing holds buttons: it is exposed as a group rather than an image. Default false. */
	interactive?: boolean;
	className?: string;
	children: ReactNode;
}

export function Diagram({ widthMm, heightMm, label, maxWidth, interactive = false, className = "", children }: DiagramProps) {
	const ref = useRef<SVGSVGElement>(null);
	const [pxPerMm, setPxPerMm] = useState(PX_PER_MM_TRUE_SCALE);

	useLayoutEffect(() => {
		const el = ref.current;
		if (!el) return;
		const measure = () => {
			const w = el.getBoundingClientRect().width;
			if (w > 0) setPxPerMm(w / widthMm);
		};
		measure();
		if (typeof ResizeObserver === "undefined") return;
		const ro = new ResizeObserver(measure);
		ro.observe(el);
		return () => ro.disconnect();
	}, [widthMm]);

	return (
		<svg
			ref={ref}
			role={interactive ? "group" : "img"}
			aria-label={label}
			className={`${styles.diagram} ${className}`}
			viewBox={`0 0 ${widthMm} ${heightMm}`}
			style={{ "--diagram-w": `${widthMm}mm`, maxWidth } as React.CSSProperties}
			data-diagram=""
		>
			<ScaleContext.Provider value={pxPerMm}>
				<g className={styles.scene}>{children}</g>
			</ScaleContext.Provider>
		</svg>
	);
}

export interface MemberProps {
	x: number;
	y: number;
	width: number;
	height: number;
	role?: MemberRole;
	/** Rotation in degrees around the rect's top-left corner */
	rotate?: number;
	className?: string;
}

/** A framing member or surface, colour-coded by role. */
export function Member({ x, y, width, height, role = "common", rotate, className = "" }: MemberProps) {
	return (
		<rect
			x={x}
			y={y}
			width={width}
			height={height}
			className={`${styles.member} ${styles[`role-${role}`]} ${className}`}
			transform={rotate ? `rotate(${rotate} ${x} ${y})` : undefined}
		/>
	);
}

export interface LabelProps {
	x: number;
	y: number;
	text: string;
	anchor?: "start" | "middle" | "end";
	/** Font size in screen pixels. Default 12 */
	size?: number;
	rotate?: number;
	className?: string;
}

export function Label({ x, y, text, anchor = "middle", size = 12, rotate, className = "" }: LabelProps) {
	const { px } = useDiagramScale();
	return (
		<text
			x={x}
			y={y}
			textAnchor={anchor}
			fontSize={px(size)}
			className={`${styles.label} ${className}`}
			transform={rotate ? `rotate(${rotate} ${x} ${y})` : undefined}
		>
			{text}
		</text>
	);
}

export interface DimLineProps {
	x1: number;
	y1: number;
	x2: number;
	y2: number;
	label: string;
	/** Perpendicular offset of the dimension line from the measured points, in mm. Default 0. */
	offset?: number;
	/** Draw extension lines from the points to the dimension line. Default true when offset != 0. */
	extensions?: boolean;
	/** Font size in screen pixels. Default 12 */
	size?: number;
	className?: string;
}

/** A dimension line with arrowheads at both ends and a label running along it. */
export function DimLine({ x1, y1, x2, y2, label, offset = 0, extensions, size = 12, className = "" }: DimLineProps) {
	const { px } = useDiagramScale();
	const fs = px(size);
	const dx = x2 - x1;
	const dy = y2 - y1;
	const len = Math.hypot(dx, dy) || 1;
	// Unit normal (left of the direction of travel)
	const nx = -dy / len;
	const ny = dx / len;
	const ax = x1 + nx * offset;
	const ay = y1 + ny * offset;
	const bx = x2 + nx * offset;
	const by = y2 + ny * offset;
	let angle = r4((Math.atan2(dy, dx) * 180) / Math.PI);
	let textSide = -1; // label sits above the line in its own frame
	if (angle > 90 || angle <= -90) {
		angle += 180;
		textSide = 1;
	}
	const mx = (ax + bx) / 2;
	const my = (ay + by) / 2;
	const gap = fs * 0.4;
	const drawExt = extensions ?? offset !== 0;

	return (
		<g className={`${styles.dim} ${className}`}>
			{drawExt && (
				<>
					<line x1={x1} y1={y1} x2={ax + nx * gap} y2={ay + ny * gap} className={styles.ext} />
					<line x1={x2} y1={y2} x2={bx + nx * gap} y2={by + ny * gap} className={styles.ext} />
				</>
			)}
			<DimArrowLine x1={ax} y1={ay} x2={bx} y2={by} />
			<text
				x={mx}
				y={my}
				fontSize={fs}
				strokeWidth={fs * 0.28}
				textAnchor="middle"
				className={styles.dimLabel}
				transform={`rotate(${angle} ${mx} ${my}) translate(0 ${textSide < 0 ? -gap : fs + gap * 0.5})`}
			>
				{label}
			</text>
		</g>
	);
}

/** Line with filled arrowheads drawn inline and sized in screen pixels, so they never scale with the drawing. */
function DimArrowLine({ x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number }) {
	const { px } = useDiagramScale();
	const dx = x2 - x1;
	const dy = y2 - y1;
	const len = Math.hypot(dx, dy) || 1;
	const ux = dx / len;
	const uy = dy / len;
	const head = px(8);
	const half = px(3);
	const headAt = (p: number, q: number, dir: number) =>
		`M ${p} ${q} L ${p - dir * ux * head + uy * half} ${q - dir * uy * head - ux * half} L ${p - dir * ux * head - uy * half} ${q - dir * uy * head + ux * half} Z`;
	return (
		<>
			<line x1={x1} y1={y1} x2={x2} y2={y2} className={styles.dimLine} />
			<path d={headAt(x1, y1, -1)} className={styles.arrow} />
			<path d={headAt(x2, y2, 1)} className={styles.arrow} />
		</>
	);
}

export interface AngleArcProps {
	cx: number;
	cy: number;
	radius: number;
	/** Degrees, SVG convention: 0 along +x, positive clockwise on screen */
	startDeg: number;
	endDeg: number;
	label: string;
	/** Font size in screen pixels. Default 12 */
	size?: number;
	className?: string;
}

/** An arc between two bearings with the angle label placed past its midpoint. */
export function AngleArc({ cx, cy, radius, startDeg, endDeg, label, size = 12, className = "" }: AngleArcProps) {
	const { px } = useDiagramScale();
	const fs = px(size);
	const toRad = (d: number) => (d * Math.PI) / 180;
	const sx = r4(cx + radius * Math.cos(toRad(startDeg)));
	const sy = r4(cy + radius * Math.sin(toRad(startDeg)));
	const ex = r4(cx + radius * Math.cos(toRad(endDeg)));
	const ey = r4(cy + radius * Math.sin(toRad(endDeg)));
	const sweep = endDeg - startDeg;
	const large = Math.abs(sweep) > 180 ? 1 : 0;
	const dir = sweep >= 0 ? 1 : 0;
	const mid = toRad(startDeg + sweep / 2);
	const lr = radius + fs * 1.4;
	return (
		<g className={`${styles.dim} ${className}`}>
			<path d={`M ${sx} ${sy} A ${radius} ${radius} 0 ${large} ${dir} ${ex} ${ey}`} className={styles.arc} />
			<text
				x={r4(cx + lr * Math.cos(mid))}
				y={r4(cy + lr * Math.sin(mid) + fs / 3)}
				fontSize={fs}
				strokeWidth={fs * 0.28}
				textAnchor="middle"
				className={styles.dimLabel}
			>
				{label}
			</text>
		</g>
	);
}
