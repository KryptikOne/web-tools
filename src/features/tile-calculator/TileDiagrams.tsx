"use client";

import { Diagram, DimLine, Label, Member, useDiagramScale, type MemberRole } from "@/components/construction/Diagram";
import diagramStyles from "@/components/construction/Diagram.module.scss";
import { inchesToMm } from "@/lib/construction/imperialUtils";
import type { TileCountResult, TileFitResult } from "@/lib/construction/tileUtils";
import styles from "./TileDiagrams.module.scss";

const W = 180;
const PAD_X = 10;
const r4 = (n: number) => Math.round(n * 1e4) / 1e4;

interface Fmt {
	format: (inches: number) => string;
}

// ── One row of tiles across a width ──────────────────────────────────────────

export interface TileRowDiagramProps extends Fmt {
	fit: TileFitResult;
	width: number;
	role: MemberRole;
	/** Draw this many rows stacked, offset like a running bond when more than one */
	rows: number;
}

export function TileRowDiagram({ fit, width, role, rows, format }: TileRowDiagramProps) {
	const k = (W - PAD_X * 2) / inchesToMm(width);
	const tileH = Math.min(18, Math.max(6, inchesToMm(fit.tiles[0]?.width || 12) * k * 0.5));
	const n = Math.max(1, Math.min(rows, 4));
	const height = tileH * n + (n - 1) * 1.2 + 34;
	return (
		<Diagram widthMm={W} heightMm={height} label={`${fit.count} tiles across ${format(width)}: first ${format(fit.firstWidth)}, last ${format(fit.lastWidth)}, ${format(fit.startGap)} at the start and ${format(fit.endGap)} at the end`}>
			<RowScene fit={fit} width={width} role={role} rows={n} k={k} tileH={tileH} height={height} format={format} />
		</Diagram>
	);
}

function RowScene({ fit, width, role, rows, k, tileH, height, format }: TileRowDiagramProps & { k: number; tileH: number; height: number }) {
	const { px } = useDiagramScale();
	const X = (inches: number) => r4(PAD_X + inchesToMm(inches) * k);
	const baseY = height - 22;
	const jointMm = Math.max(inchesToMm(fit.joint) * k, 0.4);
	const label = (p: { width: number; cut: boolean }) => (p.cut ? format(p.width) : "");
	return (
		<>
			{/* walls */}
			<line x1={X(0)} y1={baseY - rows * (tileH + 1.2)} x2={X(0)} y2={baseY + 2} className={styles.wall} />
			<line x1={X(width)} y1={baseY - rows * (tileH + 1.2)} x2={X(width)} y2={baseY + 2} className={styles.wall} />
			{Array.from({ length: rows }, (_, r) => {
				const y = baseY - (r + 1) * tileH - r * 1.2;
				return fit.tiles.map((p) => (
					<g key={`${r}-${p.index}`}>
						<Member x={X(p.near)} y={y} width={Math.max(X(p.far) - X(p.near), 0.4)} height={tileH} role={p.cut ? "hip" : role} />
						{r === 0 && <Label x={r4((X(p.near) + X(p.far)) / 2)} y={r4(y + tileH / 2)} text={`${p.index}`} size={fit.count > 20 ? 6 : 8} className={styles.num} />}
					</g>
				));
			})}
			{fit.tiles.slice(0, -1).map((p) => (
				<rect key={`j${p.index}`} x={X(p.far)} y={baseY - rows * (tileH + 1.2) + 1.2} width={jointMm} height={rows * (tileH + 1.2) - 1.2} className={styles.joint} />
			))}
			<DimLine x1={X(0)} y1={baseY} x2={X(width)} y2={baseY} label={format(width)} offset={px(14)} size={10} />
			{fit.tiles[0].cut && <DimLine x1={X(fit.tiles[0].near)} y1={baseY - rows * (tileH + 1.2) - px(6)} x2={X(fit.tiles[0].far)} y2={baseY - rows * (tileH + 1.2) - px(6)} label={label(fit.tiles[0])} extensions={false} size={9} />}
			{fit.tiles[fit.count - 1].cut && fit.count > 1 && <DimLine x1={X(fit.tiles[fit.count - 1].near)} y1={baseY - rows * (tileH + 1.2) - px(6)} x2={X(fit.tiles[fit.count - 1].far)} y2={baseY - rows * (tileH + 1.2) - px(6)} label={label(fit.tiles[fit.count - 1])} extensions={false} size={9} />}
			{fit.startGap > 0.01 && <Label x={X(fit.startGap / 2)} y={baseY - rows * (tileH + 1.2) - px(16)} text={format(fit.startGap)} size={8} className={styles.num} />}
			{fit.endGap > 0.01 && <Label x={X(width - fit.endGap / 2)} y={baseY - rows * (tileH + 1.2) - px(16)} text={format(fit.endGap)} size={8} className={styles.num} />}
		</>
	);
}

// ── Grid for quantity ────────────────────────────────────────────────────────

export interface TileGridDiagramProps extends Fmt {
	count: TileCountResult;
	areaWidth: number;
	areaLength: number;
	tileWidth: number;
	tileLength: number;
	joint: number;
	role: MemberRole;
}

export function TileGridDiagram({ count, areaWidth, areaLength, tileWidth, tileLength, joint, role, format }: TileGridDiagramProps) {
	const k = Math.min((W - PAD_X * 2) / inchesToMm(areaWidth), 110 / inchesToMm(areaLength));
	const height = inchesToMm(areaLength) * k + 30;
	return (
		<Diagram widthMm={W} heightMm={height} label={`${count.across} tiles across by ${count.down} down over ${format(areaWidth)} by ${format(areaLength)}`}>
			<GridScene count={count} areaWidth={areaWidth} areaLength={areaLength} tileWidth={tileWidth} tileLength={tileLength} joint={joint} role={role} k={k} format={format} />
		</Diagram>
	);
}

function GridScene({ count, areaWidth, areaLength, tileWidth, tileLength, joint, role, k, format }: TileGridDiagramProps & { k: number }) {
	const { px } = useDiagramScale();
	const X = (inches: number) => r4(PAD_X + inchesToMm(inches) * k);
	const Y = (inches: number) => r4(6 + inchesToMm(inches) * k);
	const cells: { x: number; y: number; w: number; h: number; cut: boolean }[] = [];
	const many = count.across * count.down > 900;
	for (let r = 0; r < count.down; r++) {
		const y0 = r * (tileLength + joint);
		const h = Math.min(tileLength, areaLength - y0);
		for (let c = 0; c < count.across; c++) {
			const x0 = c * (tileWidth + joint);
			const w = Math.min(tileWidth, areaWidth - x0);
			cells.push({ x: x0, y: y0, w, h, cut: w < tileWidth - 1e-9 || h < tileLength - 1e-9 });
		}
	}
	return (
		<>
			<rect x={X(0)} y={Y(0)} width={r4(X(areaWidth) - X(0))} height={r4(Y(areaLength) - Y(0))} className={diagramStyles.outline} />
			{many ? (
				<rect x={X(0)} y={Y(0)} width={r4(X(areaWidth) - X(0))} height={r4(Y(areaLength) - Y(0))} className={`${diagramStyles.member} ${diagramStyles[`role-${role}`]}`} />
			) : (
				cells.map((c, i) => <rect key={i} x={X(c.x)} y={Y(c.y)} width={Math.max(r4(inchesToMm(c.w) * k), 0.3)} height={Math.max(r4(inchesToMm(c.h) * k), 0.3)} className={`${diagramStyles.member} ${c.cut ? diagramStyles["role-hip"] : diagramStyles[`role-${role}`]}`} />)
			)}
			<DimLine x1={X(0)} y1={Y(areaLength)} x2={X(areaWidth)} y2={Y(areaLength)} label={`${format(areaWidth)} · ${count.across} across`} offset={px(12)} size={10} />
			<DimLine x1={X(areaWidth)} y1={Y(areaLength)} x2={X(areaWidth)} y2={Y(0)} label={`${format(areaLength)} · ${count.down} down`} offset={px(16)} size={10} />
			{many && <Label x={r4((X(0) + X(areaWidth)) / 2)} y={r4((Y(0) + Y(areaLength)) / 2)} text={`${count.tiles} tiles`} size={12} />}
		</>
	);
}
