"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import SegmentedControl from "@/components/SegmentedControl";
import { UnitAndPrecisionBar, DimensionInput, NumberField, ResultList, PrintDiagrams, ShareCalculation, ConstructionNotes } from "@/components/construction";
import type { ResultRow } from "@/components/construction";
import { useConstructionUnits } from "@/hooks/useConstructionUnits";
import { formatArea } from "@/lib/construction/imperialUtils";
import { BAG_WEIGHTS_LB, REBAR_SIZES } from "@/lib/construction/concreteUtils";
import { blockWall, BLOCK_SIZES, type BlockOpening } from "@/lib/construction/blockUtils";
import { BlockWallDiagram, BlockSectionDiagram } from "./BlockDiagrams";
import styles from "./BlockCalculator.module.scss";

interface Opening extends BlockOpening {
	id: number;
}

interface BlockState {
	length: number | null;
	height: number | null;
	blockId: string;
	blockLength: number | null;
	blockWidth: number | null;
	blockHeight: number | null;
	cores: number;
	coreFill: number;
	joint: number | null;
	openings: Opening[];
	corners: number;
	ends: number;
	wastePercent: number;
	pricePerBlock: number;
	blocksPerMortarBag: number;
	groutEveryNthCore: number;
	groutBagWeightLb: number;
	pricePerGroutBag: number;
	rebarEveryNthCore: number;
	rebarBar: string;
	rebarExtra: number | null;
}

const eight = BLOCK_SIZES.find((b) => b.id === "8")!;
const DEFAULTS: BlockState = {
	length: 480,
	height: 96,
	blockId: "8",
	blockLength: eight.length,
	blockWidth: eight.width,
	blockHeight: eight.height,
	cores: 2,
	coreFill: eight.coreFillCubicFeet,
	joint: 0.375,
	openings: [{ id: 1, count: 1, width: 36, height: 80 }],
	corners: 2,
	ends: 0,
	wastePercent: 5,
	pricePerBlock: 2.5,
	blocksPerMortarBag: 33,
	groutEveryNthCore: 0,
	groutBagWeightLb: 80,
	pricePerGroutBag: 6,
	rebarEveryNthCore: 0,
	rebarBar: "#4",
	rebarExtra: 12,
};

const BLOCK_OPTIONS = [...BLOCK_SIZES.map((b) => ({ value: b.id, label: b.label })), { value: "custom", label: "Custom" }];
const NTH_OPTIONS = [
	{ value: "0", label: "None" },
	{ value: "1", label: "Every core" },
	{ value: "2", label: "Every 2nd" },
	{ value: "3", label: "Every 3rd" },
	{ value: "4", label: "Every 4th" },
];

const num = (v: unknown, lo: number, hi: number, fallback: number | null): number | null => (typeof v === "number" && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : fallback);
const int = (v: unknown, lo: number, hi: number, fb: number) => Math.round(num(v, lo, hi, fb) ?? fb);

function sanitize(s: Partial<BlockState>): BlockState {
	const openings = Array.isArray(s.openings)
		? s.openings.slice(0, 20).map((o, i) => ({ id: i + 1, count: int((o as Opening).count, 0, 100, 1), width: num((o as Opening).width, 0, 1000, 36) ?? 36, height: num((o as Opening).height, 0, 1000, 80) ?? 80 }))
		: DEFAULTS.openings;
	return {
		length: num(s.length, 1, 1e5, DEFAULTS.length),
		height: num(s.height, 1, 1200, DEFAULTS.height),
		blockId: typeof s.blockId === "string" && BLOCK_OPTIONS.some((b) => b.value === s.blockId) ? s.blockId : DEFAULTS.blockId,
		blockLength: num(s.blockLength, 1, 100, DEFAULTS.blockLength),
		blockWidth: num(s.blockWidth, 1, 100, DEFAULTS.blockWidth),
		blockHeight: num(s.blockHeight, 1, 100, DEFAULTS.blockHeight),
		cores: int(s.cores, 0, 4, DEFAULTS.cores),
		coreFill: num(s.coreFill, 0, 10, DEFAULTS.coreFill) ?? DEFAULTS.coreFill,
		joint: num(s.joint, 0, 5, DEFAULTS.joint),
		openings,
		corners: int(s.corners, 0, 100, DEFAULTS.corners),
		ends: int(s.ends, 0, 100, DEFAULTS.ends),
		wastePercent: num(s.wastePercent, 0, 100, DEFAULTS.wastePercent) ?? DEFAULTS.wastePercent,
		pricePerBlock: num(s.pricePerBlock, 0, 1000, DEFAULTS.pricePerBlock) ?? DEFAULTS.pricePerBlock,
		blocksPerMortarBag: num(s.blocksPerMortarBag, 1, 1000, DEFAULTS.blocksPerMortarBag) ?? DEFAULTS.blocksPerMortarBag,
		groutEveryNthCore: int(s.groutEveryNthCore, 0, 4, DEFAULTS.groutEveryNthCore),
		groutBagWeightLb: BAG_WEIGHTS_LB.includes(s.groutBagWeightLb as 80) ? (s.groutBagWeightLb as number) : DEFAULTS.groutBagWeightLb,
		pricePerGroutBag: num(s.pricePerGroutBag, 0, 1000, DEFAULTS.pricePerGroutBag) ?? DEFAULTS.pricePerGroutBag,
		rebarEveryNthCore: int(s.rebarEveryNthCore, 0, 4, DEFAULTS.rebarEveryNthCore),
		rebarBar: REBAR_SIZES.some((r) => r.bar === s.rebarBar) ? (s.rebarBar as string) : DEFAULTS.rebarBar,
		rebarExtra: num(s.rebarExtra, 0, 200, DEFAULTS.rebarExtra),
	};
}

export default function BlockCalculator() {
	const { format, mode } = useConstructionUnits();
	const [state, setState] = useState<BlockState>(DEFAULTS);
	const set = <K extends keyof BlockState>(key: K) => (value: BlockState[K]) => setState((s) => ({ ...s, [key]: value }));
	const pickBlock = (id: string) => {
		const b = BLOCK_SIZES.find((x) => x.id === id);
		setState((s) => ({ ...s, blockId: id, ...(b ? { blockLength: b.length, blockWidth: b.width, blockHeight: b.height, cores: b.cores, coreFill: b.coreFillCubicFeet } : {}) }));
	};
	const custom = <K extends "blockLength" | "blockWidth" | "blockHeight">(key: K) => (v: number | null) => setState((s) => ({ ...s, [key]: v, blockId: "custom" }));
	const updateOpening = (id: number, patch: Partial<Opening>) => setState((s) => ({ ...s, openings: s.openings.map((o) => (o.id === id ? { ...o, ...patch } : o)) }));
	const addOpening = () => setState((s) => (s.openings.length >= 20 ? s : { ...s, openings: [...s.openings, { id: Math.max(0, ...s.openings.map((o) => o.id)) + 1, count: 1, width: 36, height: 48 }] }));
	const removeOpening = (id: number) => setState((s) => ({ ...s, openings: s.openings.filter((o) => o.id !== id) }));
	const rebarSize = REBAR_SIZES.find((r) => r.bar === state.rebarBar) ?? REBAR_SIZES[1];

	const wall = useMemo(() => {
		const s = state;
		if (s.length === null || s.height === null || s.blockLength === null || s.blockWidth === null || s.blockHeight === null || s.joint === null || s.rebarExtra === null) return null;
		return blockWall({
			length: s.length,
			height: s.height,
			block: { length: s.blockLength, width: s.blockWidth, height: s.blockHeight, coreFillCubicFeet: s.coreFill, cores: s.cores },
			joint: s.joint,
			openings: s.openings,
			corners: s.corners,
			ends: s.ends,
			wastePercent: s.wastePercent,
			pricePerBlock: s.pricePerBlock,
			blocksPerMortarBag: s.blocksPerMortarBag,
			groutEveryNthCore: s.groutEveryNthCore,
			groutBagWeightLb: s.groutBagWeightLb,
			rebarEveryNthCore: s.rebarEveryNthCore,
			rebarSize,
			rebarExtra: s.rebarExtra,
			pricePerGroutBag: s.pricePerGroutBag,
		});
	}, [state, rebarSize]);

	const rows: ResultRow[] = wall
		? [
				{ label: "Courses", value: `${wall.courses}`, strong: true, hint: `${format(wall.gaugeHeight)} each, ${format(wall.wallHeight)} high` },
				{ label: "Blocks per course", value: wall.blocksPerCourse.toFixed(2), hint: `${format((state.blockLength ?? 0) + (state.joint ?? 0))} per block with the joint` },
				{ label: "Blocks", value: `${wall.netBlocks}`, strong: true, hint: `${wall.grossBlocks.toFixed(1)} in the wall less ${wall.openingBlocks.toFixed(1)} in openings` },
				{ label: "With waste", value: `${wall.blocksWithWaste}`, hint: `${state.wastePercent}% waste; buy these` },
				{ label: "Half blocks", value: `${wall.halfBlocks}`, hint: `${state.corners} corners and ${state.ends} ends, one every other course; cut from full blocks or buy halves` },
				{ label: "Wall area", value: formatArea(wall.wallArea, mode), hint: `${formatArea(wall.openingArea, mode)} of openings` },
				{ label: "Mortar", value: `${wall.mortarBags} bags`, hint: `at ${state.blocksPerMortarBag} blocks per bag` },
				...(state.groutEveryNthCore > 0 ? [{ label: "Core fill", value: `${wall.groutCubicFeet.toFixed(1)} ft³`, hint: `${wall.groutedCores} of ${wall.coresTotal} cores, ${wall.groutBags} × ${state.groutBagWeightLb} lb bags` }] : []),
				...(state.rebarEveryNthCore > 0 ? [{ label: "Vertical rebar", value: `${wall.rebarBars} × ${format(wall.wallHeight + (state.rebarExtra ?? 0))}`, hint: `${state.rebarBar}, ${(wall.rebarLength / 12).toFixed(0)} ft, ${wall.rebarWeightLb.toFixed(0)} lb` }] : []),
				{ label: "Cost", value: `$${wall.cost.total.toFixed(2)}`, strong: true, hint: `blocks $${wall.cost.blocks.toFixed(0)}${state.groutEveryNthCore > 0 ? `, grout $${wall.cost.grout.toFixed(0)}` : ""}` },
			]
		: [];

	return (
		<div className={styles.container}>
			<div className="flex flex-col gap-6">
				<UnitAndPrecisionBar />

				<div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
					<section className={styles.card} aria-labelledby="bl-heading">
						<h2 id="bl-heading" className={styles.cardTitle}>
							Block wall
						</h2>
						<p className={styles.note}>
							Running bond. Enter all the walls as one length and count the corners and free ends. Course heights and the gauge rod are in the <Link href="/tools/brick-calculator">brick gauge calculator</Link>.
						</p>
						<div className="flex flex-col gap-4">
							<div className="grid grid-cols-2 gap-3">
								<DimensionInput id="bl-length" label="Wall length" value={state.length} onChange={set("length")} hint="All walls together" />
								<DimensionInput id="bl-height" label="Wall height" value={state.height} onChange={set("height")} hint="Rounded to whole courses" />
							</div>
							<div className="flex flex-col gap-1">
								<label htmlFor="bl-block" className={styles.label}>
									Block
								</label>
								<select id="bl-block" className={styles.select} value={state.blockId} onChange={(e) => pickBlock(e.target.value)}>
									{BLOCK_OPTIONS.map((b) => (
										<option key={b.value} value={b.value}>
											{b.label}
										</option>
									))}
								</select>
							</div>
							<div className="grid grid-cols-3 gap-3">
								<DimensionInput id="bl-bl" label="Block length" value={state.blockLength} onChange={custom("blockLength")} />
								<DimensionInput id="bl-bw" label="Block width" value={state.blockWidth} onChange={custom("blockWidth")} />
								<DimensionInput id="bl-bh" label="Block height" value={state.blockHeight} onChange={custom("blockHeight")} />
							</div>
							<div className="grid grid-cols-3 gap-3">
								<DimensionInput id="bl-joint" label="Mortar joint" value={state.joint} onChange={set("joint")} />
								<NumberField id="bl-cores" label="Cores per block" value={state.cores} onChange={(v) => set("cores")(int(v, 0, 4, 2))} min={0} max={4} step={1} />
								<NumberField id="bl-fill" label="Core fill per block" value={state.coreFill} onChange={set("coreFill")} unit="ft³" step="any" />
							</div>
							<div className="flex flex-col gap-2">
								<span className={styles.label}>Openings</span>
								{state.openings.map((o, i) => (
									<div key={o.id} className="grid grid-cols-[3rem_1fr_1fr_auto] items-end gap-2">
										<NumberField id={`bl-o-count-${o.id}`} label={`Opening ${i + 1} count`} value={o.count} onChange={(v) => updateOpening(o.id, { count: int(v, 0, 100, 1) })} min={0} max={100} step={1} />
										<DimensionInput id={`bl-o-w-${o.id}`} label={`Opening ${i + 1} width`} value={o.width} onChange={(v) => updateOpening(o.id, { width: v ?? 0 })} />
										<DimensionInput id={`bl-o-h-${o.id}`} label={`Opening ${i + 1} height`} value={o.height} onChange={(v) => updateOpening(o.id, { height: v ?? 0 })} />
										<button type="button" className={styles.btn} onClick={() => removeOpening(o.id)} aria-label={`Remove opening ${i + 1}`}>
											×
										</button>
									</div>
								))}
								<button type="button" className={`${styles.btn} self-start`} onClick={addOpening} disabled={state.openings.length >= 20}>
									Add opening
								</button>
							</div>
							<div className="grid grid-cols-3 gap-3">
								<NumberField id="bl-corners" label="Corners" value={state.corners} onChange={(v) => set("corners")(int(v, 0, 100, 0))} min={0} max={100} step={1} />
								<NumberField id="bl-ends" label="Free ends" value={state.ends} onChange={(v) => set("ends")(int(v, 0, 100, 0))} min={0} max={100} step={1} />
								<NumberField id="bl-waste" label="Waste" value={state.wastePercent} onChange={set("wastePercent")} unit="%" min={0} max={100} step="any" />
							</div>
							<div className="grid grid-cols-2 gap-3">
								<NumberField id="bl-price" label="Price per block" value={state.pricePerBlock} onChange={set("pricePerBlock")} prefix="$" step="any" />
								<NumberField id="bl-mortar" label="Blocks per mortar bag" value={state.blocksPerMortarBag} onChange={(v) => set("blocksPerMortarBag")(Math.max(1, v))} min={1} step="any" hint="About 33 for an 80 lb bag" />
							</div>
							<div className="flex flex-wrap items-end gap-x-6 gap-y-3">
								<div className="flex flex-col gap-1">
									<label htmlFor="bl-grout" className={styles.label}>
										Grout cores
									</label>
									<select id="bl-grout" className={styles.select} value={`${state.groutEveryNthCore}`} onChange={(e) => set("groutEveryNthCore")(Number(e.target.value))}>
										{NTH_OPTIONS.map((o) => (
											<option key={o.value} value={o.value}>
												{o.label}
											</option>
										))}
									</select>
								</div>
								{state.groutEveryNthCore > 0 && (
									<>
										<div className="flex flex-col gap-1">
											<span className={styles.label}>Grout bag</span>
											<SegmentedControl<string> label="Grout bag" size="sm" fill={false} value={`${state.groutBagWeightLb}`} onChange={(v) => set("groutBagWeightLb")(Number(v))} options={[60, 80].map((b) => ({ value: `${b}`, label: `${b} lb` }))} />
										</div>
										<NumberField id="bl-grout-price" label="Per bag" value={state.pricePerGroutBag} onChange={set("pricePerGroutBag")} prefix="$" step="any" className="w-28" />
									</>
								)}
							</div>
							<div className="flex flex-wrap items-end gap-x-6 gap-y-3">
								<div className="flex flex-col gap-1">
									<label htmlFor="bl-rebar" className={styles.label}>
										Vertical rebar
									</label>
									<select id="bl-rebar" className={styles.select} value={`${state.rebarEveryNthCore}`} onChange={(e) => set("rebarEveryNthCore")(Number(e.target.value))}>
										{NTH_OPTIONS.map((o) => (
											<option key={o.value} value={o.value}>
												{o.label}
											</option>
										))}
									</select>
								</div>
								{state.rebarEveryNthCore > 0 && (
									<>
										<div className="flex flex-col gap-1">
											<label htmlFor="bl-bar" className={styles.label}>
												Bar
											</label>
											<select id="bl-bar" className={styles.select} value={state.rebarBar} onChange={(e) => set("rebarBar")(e.target.value)}>
												{REBAR_SIZES.slice(0, 6).map((r) => (
													<option key={r.bar} value={r.bar}>
														{r.bar}
													</option>
												))}
											</select>
										</div>
										<DimensionInput id="bl-rebar-extra" label="Extra per bar" value={state.rebarExtra} onChange={set("rebarExtra")} hint="Lap and projection" className="w-40" />
									</>
								)}
							</div>
						</div>
					</section>

					<section className={styles.card} aria-labelledby="bl-results">
						<h2 id="bl-results" className={styles.cardTitle}>
							Quantities
						</h2>
						{wall ? <ResultList rows={rows} /> : <p className={styles.empty}>Enter the wall size and the block.</p>}
						{wall?.warnings.map((w) => (
							<p key={w} className={styles.warn}>
								{w}
							</p>
						))}
					</section>
				</div>

				{wall && state.length !== null && state.blockLength !== null && state.blockWidth !== null && state.blockHeight !== null && state.joint !== null && (
					<div className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
						<section className={styles.card} aria-labelledby="bl-elev">
							<h2 id="bl-elev" className={styles.cardTitle}>
								Elevation
							</h2>
							<PrintDiagrams title="Block wall" subtitle={`${format(state.length)} × ${format(wall.wallHeight)}, ${wall.courses} courses in running bond, drawn to fit`}>
								<BlockWallDiagram wall={wall} length={state.length} blockLength={state.blockLength} blockHeight={state.blockHeight} joint={state.joint} openings={state.openings} format={format} />
							</PrintDiagrams>
							<p className={styles.note}>Half blocks at the ends of alternate courses are highlighted; openings are spread along the wall for the drawing only.</p>
						</section>
						<section className={styles.card} aria-labelledby="bl-section">
							<h2 id="bl-section" className={styles.cardTitle}>
								Block
							</h2>
							<PrintDiagrams title="Block plan" subtitle={`${format(state.blockLength)} × ${format(state.blockWidth)}, ${state.cores} cores, true size`}>
								<BlockSectionDiagram length={state.blockLength} width={state.blockWidth} cores={state.cores} groutEveryNth={state.groutEveryNthCore} format={format} />
							</PrintDiagrams>
						</section>
					</div>
				)}

				<div className="grid gap-4 lg:grid-cols-2">
					<ShareCalculation state={state} onLoad={(s) => setState(sanitize(s))} />
					<ConstructionNotes />
				</div>
			</div>
		</div>
	);
}
