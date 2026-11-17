"use client";

import { useMemo, useState } from "react";
import SegmentedControl from "@/components/SegmentedControl";
import { UnitAndPrecisionBar, DimensionInput, NumberField, ResultList, RunningList, PrintDiagrams, LumberTable, ShareCalculation, ConstructionNotes } from "@/components/construction";
import type { ResultRow } from "@/components/construction";
import { useConstructionUnits } from "@/hooks/useConstructionUnits";
import { formatArea } from "@/lib/construction/imperialUtils";
import { BAG_WEIGHTS_LB } from "@/lib/construction/concreteUtils";
import { postAndRail, postAndPanel, archedPalings, glassBalustrade } from "@/lib/construction/fenceUtils";
import type { MarkReference } from "@/lib/construction/spacingUtils";
import FenceDiagram, { PostHoleDiagram, type FenceDiagramProps, type FenceRect } from "./FenceDiagrams";
import styles from "./FenceCalculator.module.scss";

type Mode = "post-rail" | "post-panel" | "arched" | "glass";

interface FenceState {
	mode: Mode;
	length: number | null;
	postWidth: number | null;
	// post and rail
	maxCenters: number | null;
	rails: number;
	palingWidth: number | null;
	palingGap: number | null;
	height: number | null;
	postAboveGround: number | null;
	holeDepth: number | null;
	holeDiameter: number | null;
	bagWeightLb: number;
	pricePerPost: number;
	pricePerRail: number;
	pricePerPaling: number;
	pricePerBag: number;
	reference: MarkReference;
	// post and panel
	panelWidth: number | null;
	adjust: "last" | "both";
	// arched
	bayWidth: number | null;
	rise: number | null;
	shape: "concave" | "convex";
	heightAtPosts: number | null;
	// glass
	maxPanelWidth: number | null;
	glassGap: number | null;
	support: "spigots" | "posts";
	glassPostWidth: number | null;
	glassHeight: number | null;
	spigotsPerPanel: number;
	spigotInset: number | null;
}

const DEFAULTS: FenceState = {
	mode: "post-rail",
	length: 288,
	postWidth: 3.5,
	maxCenters: 96,
	rails: 3,
	palingWidth: 3.5,
	palingGap: 0.5,
	height: 72,
	postAboveGround: 72,
	holeDepth: 24,
	holeDiameter: 10,
	bagWeightLb: 80,
	pricePerPost: 12,
	pricePerRail: 8,
	pricePerPaling: 2,
	pricePerBag: 6,
	reference: "near",
	panelWidth: 72,
	adjust: "last",
	bayWidth: 72,
	rise: 6,
	shape: "concave",
	heightAtPosts: 60,
	maxPanelWidth: 48,
	glassGap: 1,
	support: "spigots",
	glassPostWidth: 2,
	glassHeight: 42,
	spigotsPerPanel: 2,
	spigotInset: 8,
};

const MODES: { value: Mode; label: string }[] = [
	{ value: "post-rail", label: "Post and rail" },
	{ value: "post-panel", label: "Post and panel" },
	{ value: "arched", label: "Arched palings" },
	{ value: "glass", label: "Glass" },
];
const BAG_OPTIONS = BAG_WEIGHTS_LB.map((b) => ({ value: `${b}`, label: `${b} lb` }));

const num = (v: unknown, lo: number, hi: number, fallback: number | null): number | null => (typeof v === "number" && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : fallback);
const oneOf = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T => (allowed.includes(v as T) ? (v as T) : fallback);
const money = (v: unknown, fb: number) => num(v, 0, 1e6, fb) ?? fb;

function sanitize(s: Partial<FenceState>): FenceState {
	return {
		mode: oneOf(s.mode, ["post-rail", "post-panel", "arched", "glass"] as const, DEFAULTS.mode),
		length: num(s.length, 1, 1e5, DEFAULTS.length),
		postWidth: num(s.postWidth, 0.5, 100, DEFAULTS.postWidth),
		maxCenters: num(s.maxCenters, 6, 1000, DEFAULTS.maxCenters),
		rails: Math.round(num(s.rails, 0, 10, DEFAULTS.rails) ?? DEFAULTS.rails),
		palingWidth: num(s.palingWidth, 0.5, 100, DEFAULTS.palingWidth),
		palingGap: num(s.palingGap, 0, 100, DEFAULTS.palingGap),
		height: num(s.height, 1, 1000, DEFAULTS.height),
		postAboveGround: num(s.postAboveGround, 1, 1000, DEFAULTS.postAboveGround),
		holeDepth: num(s.holeDepth, 0, 200, DEFAULTS.holeDepth),
		holeDiameter: num(s.holeDiameter, 0, 100, DEFAULTS.holeDiameter),
		bagWeightLb: BAG_WEIGHTS_LB.includes(s.bagWeightLb as 80) ? (s.bagWeightLb as number) : DEFAULTS.bagWeightLb,
		pricePerPost: money(s.pricePerPost, DEFAULTS.pricePerPost),
		pricePerRail: money(s.pricePerRail, DEFAULTS.pricePerRail),
		pricePerPaling: money(s.pricePerPaling, DEFAULTS.pricePerPaling),
		pricePerBag: money(s.pricePerBag, DEFAULTS.pricePerBag),
		reference: oneOf(s.reference, ["near", "center", "far"] as const, DEFAULTS.reference),
		panelWidth: num(s.panelWidth, 1, 1000, DEFAULTS.panelWidth),
		adjust: oneOf(s.adjust, ["last", "both"] as const, DEFAULTS.adjust),
		bayWidth: num(s.bayWidth, 1, 1000, DEFAULTS.bayWidth),
		rise: num(s.rise, 0.1, 500, DEFAULTS.rise),
		shape: oneOf(s.shape, ["concave", "convex"] as const, DEFAULTS.shape),
		heightAtPosts: num(s.heightAtPosts, 1, 1000, DEFAULTS.heightAtPosts),
		maxPanelWidth: num(s.maxPanelWidth, 1, 1000, DEFAULTS.maxPanelWidth),
		glassGap: num(s.glassGap, 0, 100, DEFAULTS.glassGap),
		support: oneOf(s.support, ["spigots", "posts"] as const, DEFAULTS.support),
		glassPostWidth: num(s.glassPostWidth, 0.5, 100, DEFAULTS.glassPostWidth),
		glassHeight: num(s.glassHeight, 1, 1000, DEFAULTS.glassHeight),
		spigotsPerPanel: Math.round(num(s.spigotsPerPanel, 0, 6, DEFAULTS.spigotsPerPanel) ?? DEFAULTS.spigotsPerPanel),
		spigotInset: num(s.spigotInset, 0, 500, DEFAULTS.spigotInset),
	};
}

export default function FenceCalculator() {
	const { format, mode: unitMode } = useConstructionUnits();
	const [state, setState] = useState<FenceState>(DEFAULTS);
	const set = <K extends keyof FenceState>(key: K) => (value: FenceState[K]) => setState((s) => ({ ...s, [key]: value }));

	const pr = useMemo(() => {
		const s = state;
		if (s.mode !== "post-rail" || s.length === null || s.postWidth === null || s.maxCenters === null || s.palingWidth === null || s.palingGap === null || s.height === null || s.postAboveGround === null || s.holeDepth === null || s.holeDiameter === null) return null;
		return postAndRail({ length: s.length, postWidth: s.postWidth, maxCenters: s.maxCenters, rails: s.rails, palingWidth: s.palingWidth, palingGap: s.palingGap, height: s.height, postAboveGround: s.postAboveGround, holeDepth: s.holeDepth, holeDiameter: s.holeDiameter, bagWeightLb: s.bagWeightLb, pricePerPost: s.pricePerPost, pricePerRail: s.pricePerRail, pricePerPaling: s.pricePerPaling, pricePerBag: s.pricePerBag });
	}, [state]);
	const pp = useMemo(() => (state.mode !== "post-panel" || state.length === null || state.panelWidth === null || state.postWidth === null ? null : postAndPanel({ length: state.length, panelWidth: state.panelWidth, postWidth: state.postWidth, adjust: state.adjust })), [state]);
	const ar = useMemo(() => (state.mode !== "arched" || state.bayWidth === null || state.palingWidth === null || state.palingGap === null || state.rise === null || state.heightAtPosts === null ? null : archedPalings({ bayWidth: state.bayWidth, palingWidth: state.palingWidth, gap: state.palingGap, rise: state.rise, shape: state.shape, heightAtPosts: state.heightAtPosts })), [state]);
	const gl = useMemo(() => (state.mode !== "glass" || state.length === null || state.maxPanelWidth === null || state.glassGap === null || state.glassPostWidth === null || state.glassHeight === null || state.spigotInset === null ? null : glassBalustrade({ length: state.length, maxPanelWidth: state.maxPanelWidth, gap: state.glassGap, support: state.support, postWidth: state.glassPostWidth, glassHeight: state.glassHeight, spigotsPerPanel: state.spigotsPerPanel, spigotInset: state.spigotInset })), [state]);

	const result = pr ?? pp ?? ar ?? gl;
	const pick = (m: { near: number; center: number; far: number }) => (state.reference === "near" ? m.near : state.reference === "far" ? m.far : m.center);

	let rows: ResultRow[] = [];
	let drawing: FenceDiagramProps | null = null;
	let running: { title: string; positions: number[]; withReference?: boolean; labelFor?: (i: number) => string } | null = null;
	let title = "";

	if (pr && state.length !== null && state.postWidth !== null && state.height !== null && state.postAboveGround !== null && state.holeDepth !== null && state.palingWidth !== null) {
		title = `Post and rail, ${format(state.length)}`;
		rows = [
			{ label: "Posts", value: `${pr.postCount}`, strong: true, hint: `${pr.bays} bays at ${format(pr.postCenters)} centers, ${format(pr.bayClear)} clear` },
			{ label: "Post length", value: format(pr.postLength), hint: `${format(state.postAboveGround)} above ground plus ${format(state.holeDepth)} in the hole` },
			{ label: "Rails", value: `${pr.railCount}`, hint: `${state.rails} per bay, ${format(pr.railLength)} centre to centre` },
			{ label: "Palings", value: `${pr.palingCount}`, strong: true, hint: `${format(state.palingWidth)} wide at ${format(pr.palingGap)} gaps, ${format(state.height)} long` },
			{ label: "Concrete", value: `${pr.concreteTotal.toFixed(2)} ft³`, hint: `${pr.concretePerHole.toFixed(2)} ft³ per hole, ${pr.bags} × ${state.bagWeightLb} lb bags` },
			{ label: "Cost", value: `$${pr.cost.total.toFixed(2)}`, strong: true, hint: `posts $${pr.cost.posts.toFixed(0)}, rails $${pr.cost.rails.toFixed(0)}, palings $${pr.cost.palings.toFixed(0)}, concrete $${pr.cost.concrete.toFixed(0)}` },
		];
		const railH = 1.5;
		const rects: FenceRect[] = [
			...pr.posts.members.map((p) => ({ x: p.near, y: -state.holeDepth!, w: state.postWidth!, h: state.postAboveGround! + state.holeDepth!, role: "wall" as const, label: `${p.index}` })),
			...Array.from({ length: state.rails }, (_, i) => ({ x: 0, y: 6 + ((state.height! - 12) * i) / Math.max(1, state.rails - 1), w: state.length!, h: railH, role: "ridge" as const })),
			...(pr.palingCount <= 400 ? pr.palings.members.map((p) => ({ x: p.near, y: 2, w: state.palingWidth!, h: state.height! - 2, role: "common" as const })) : []),
		];
		drawing = {
			length: state.length,
			height: Math.max(state.height, state.postAboveGround),
			below: state.holeDepth,
			rects,
			dims: [
				{ x1: 0, y1: -state.holeDepth - 2, x2: state.length, y2: -state.holeDepth - 2, label: format(state.length), offset: 14 },
				{ x1: pr.posts.members[0].center, y1: state.postAboveGround + 2, x2: pr.posts.members[1]?.center ?? state.length, y2: state.postAboveGround + 2, label: format(pr.postCenters), offset: -8, extensions: false },
				{ x1: state.length + 3, y1: 0, x2: state.length + 3, y2: state.height, label: format(state.height), offset: -10 },
			],
			label: `Post and rail fence: ${pr.postCount} posts over ${format(state.length)}, ${state.rails} rails, ${pr.palingCount} palings, holes ${format(state.holeDepth)} deep`,
		};
		running = { title: "Paling positions", positions: pr.palings.members.map(pick), withReference: true };
	} else if (pp && state.length !== null && state.postWidth !== null && state.panelWidth !== null) {
		title = `Post and panel, ${format(state.length)}`;
		rows = [
			{ label: "Posts", value: `${pp.postCount}`, strong: true, hint: `${format(pp.postCenters)} centers for whole panels` },
			{ label: "Whole panels", value: `${pp.wholePanels}`, hint: `${format(state.panelWidth)} each` },
			{ label: "Cut panels", value: pp.cutPanels.length ? pp.cutPanels.map((c) => format(c)).join(" and ") : "none", hint: pp.cutPanels.length ? (state.adjust === "both" ? "one at each end" : "at the far end") : "the panels fit the run exactly", strong: pp.cutPanels.length > 0 },
			{ label: "Panels in all", value: `${pp.panelCount}` },
		];
		const H = 72;
		const rects: FenceRect[] = pp.postPositions.map((x, i) => ({ x, y: 0, w: state.postWidth!, h: H + 4, role: "wall" as const, label: `${i + 1}` }));
		for (let i = 0; i < pp.postPositions.length - 1; i++) {
			const a = pp.postPositions[i] + state.postWidth;
			const b = pp.postPositions[i + 1];
			rects.push({ x: a, y: 3, w: b - a, h: H - 3, role: Math.abs(b - a - state.panelWidth) < 1e-6 ? "tread" : "hip" });
		}
		drawing = {
			length: state.length,
			height: H + 4,
			rects,
			dims: [
				{ x1: 0, y1: -2, x2: state.length, y2: -2, label: format(state.length), offset: 14 },
				...(pp.postPositions.length > 1 ? [{ x1: pp.postPositions[0] + state.postWidth / 2, y1: H + 6, x2: pp.postPositions[1] + state.postWidth / 2, y2: H + 6, label: format(pp.postPositions[1] - pp.postPositions[0]), offset: -8, extensions: false }] : []),
			],
			label: `Post and panel fence: ${pp.postCount} posts, ${pp.wholePanels} whole panels${pp.cutPanels.length ? ` and ${pp.cutPanels.length} cut` : ""} over ${format(state.length)}`,
		};
		running = { title: "Post positions", positions: pp.postPositions, labelFor: () => "near face" };
	} else if (ar && state.bayWidth !== null && state.palingWidth !== null && state.heightAtPosts !== null && state.rise !== null && state.postWidth !== null) {
		title = `${state.shape === "concave" ? "Scalloped" : "Arched"} palings, ${format(state.bayWidth)} bay`;
		rows = [
			{ label: "Palings", value: `${ar.count}`, strong: true, hint: `${format(state.palingWidth)} wide at ${format(ar.gap)} gaps` },
			{ label: "Arc radius", value: format(ar.radius), hint: `${format(ar.arcLength)} along the curve; swing from ${state.shape === "concave" ? "above" : "below"} the bay centre` },
			{ label: "Height at the posts", value: format(state.heightAtPosts) },
			{ label: "Height at the centre", value: format(ar.heightAtCenter), strong: true, hint: `${state.shape === "concave" ? "dips" : "rises"} ${format(state.rise)}` },
			{ label: "Cutting list", value: ar.cuttingList.map((g) => `${g.count} × ${format(g.length)}`).join(", "), hint: "long point of each paling, pairs from both sides of the bay together" },
		];
		const P = state.postWidth;
		const steps = 40;
		const curve = Array.from({ length: steps + 1 }, (_, i) => {
			const x = (state.bayWidth! * i) / steps;
			const u = x - state.bayWidth! / 2;
			const y = Math.sqrt(Math.max(0, ar.radius ** 2 - u * u)) - (ar.radius - state.rise!);
			return { x: P + x, y: state.shape === "concave" ? state.heightAtPosts! - y : state.heightAtPosts! + y };
		});
		const top = Math.max(state.heightAtPosts, ar.heightAtCenter);
		drawing = {
			length: state.bayWidth + 2 * P,
			height: top + 4,
			rects: [
				{ x: 0, y: 0, w: P, h: top + 4, role: "wall" },
				{ x: P + state.bayWidth, y: 0, w: P, h: top + 4, role: "wall" },
				...ar.palings.map((p) => ({ x: P + p.near, y: 2, w: state.palingWidth!, h: p.heightCenter - 2, role: "common" as const, label: ar.count <= 30 ? `${p.index}` : undefined })),
			],
			curve,
			dims: [
				{ x1: P, y1: -2, x2: P + state.bayWidth, y2: -2, label: `bay ${format(state.bayWidth)}`, offset: 14 },
				{ x1: P + state.bayWidth / 2, y1: state.shape === "concave" ? ar.heightAtCenter : state.heightAtPosts, x2: P + state.bayWidth / 2, y2: state.shape === "concave" ? state.heightAtPosts : ar.heightAtCenter, label: format(state.rise), offset: 10, extensions: false },
				{ x1: -3, y1: 0, x2: -3, y2: state.heightAtPosts, label: format(state.heightAtPosts), offset: 10 },
			],
			label: `${state.shape === "concave" ? "Scalloped" : "Arched"} palings: ${ar.count} palings over a ${format(state.bayWidth)} bay, ${format(state.rise)} ${state.shape === "concave" ? "dip" : "rise"} on a ${format(ar.radius)} radius`,
		};
		running = { title: "Paling positions from the post", positions: ar.palings.map(pick), withReference: true, labelFor: (i) => format(ar.palings[i].long) };
	} else if (gl && state.length !== null && state.glassHeight !== null && state.glassPostWidth !== null) {
		title = `Glass balustrade, ${format(state.length)}`;
		rows = [
			{ label: "Panels", value: `${gl.panelCount}`, strong: true, hint: `${format(gl.panelWidth)} wide, ${format(state.glassHeight)} high` },
			{ label: "Glass area", value: formatArea(gl.glassArea, unitMode) },
			...(state.support === "spigots" ? [{ label: "Spigots", value: `${gl.spigotCount}`, hint: `${state.spigotsPerPanel} per panel, ${format(state.spigotInset ?? 0)} in from each end` }] : [{ label: "Posts", value: `${gl.postPositions.length}`, hint: `${format(state.glassPostWidth)} wide with a ${format(state.glassGap ?? 0)} gap each side of the glass` }]),
		];
		const H = state.glassHeight;
		drawing = {
			length: state.length,
			height: H + 4,
			rects: [
				...gl.panels.map((p) => ({ x: p.near, y: state.support === "spigots" ? 3 : 1, w: p.width, h: H - 3, role: "fill" as const, label: `${p.index}` })),
				...gl.postPositions.map((x) => ({ x, y: 0, w: state.glassPostWidth!, h: H + 2, role: "wall" as const })),
			],
			marks: gl.spigotPositions.map((x) => ({ x: x - 1, w: 2 })),
			dims: [
				{ x1: 0, y1: -2, x2: state.length, y2: -2, label: format(state.length), offset: 14 },
				{ x1: gl.panels[0].near, y1: H + 4, x2: gl.panels[0].far, y2: H + 4, label: format(gl.panelWidth), offset: -8, extensions: false },
				{ x1: state.length + 3, y1: 0, x2: state.length + 3, y2: H, label: format(H), offset: -10 },
			],
			label: `Glass balustrade: ${gl.panelCount} panels of ${format(gl.panelWidth)} over ${format(state.length)} on ${state.support === "spigots" ? `${gl.spigotCount} spigots` : `${gl.postPositions.length} posts`}`,
		};
		running = state.support === "spigots" ? { title: "Spigot positions", positions: gl.spigotPositions } : { title: "Post positions", positions: gl.postPositions, labelFor: () => "near face" };
	}

	return (
		<div className={styles.container}>
			<div className="flex flex-col gap-6">
				<UnitAndPrecisionBar />

				<div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
					<section className={styles.card} aria-labelledby="fc-heading">
						<h2 id="fc-heading" className={styles.cardTitle}>
							Fence
						</h2>
						<SegmentedControl<Mode> label="Fence type" size="sm" value={state.mode} onChange={set("mode")} options={MODES} />
						<div className="flex flex-col gap-4 mt-4">
							{state.mode !== "arched" && <DimensionInput id="fc-length" label="Fence length" value={state.length} onChange={set("length")} hint="End of run to end of run" />}

							{state.mode === "post-rail" && (
								<>
									<div className="grid grid-cols-2 gap-3">
										<DimensionInput id="fc-post" label="Post width" value={state.postWidth} onChange={set("postWidth")} hint="Along the fence" />
										<DimensionInput id="fc-centers" label="Max post centers" value={state.maxCenters} onChange={set("maxCenters")} hint="Posts are spaced evenly within this" />
									</div>
									<div className="grid grid-cols-3 gap-3">
										<NumberField id="fc-rails" label="Rails per bay" value={state.rails} onChange={(v) => set("rails")(Math.round(Math.min(10, Math.max(0, v))))} min={0} max={10} step={1} />
										<DimensionInput id="fc-paling-w" label="Paling width" value={state.palingWidth} onChange={set("palingWidth")} />
										<DimensionInput id="fc-paling-g" label="Paling gap" value={state.palingGap} onChange={set("palingGap")} hint="Adjusted to fit" />
									</div>
									<div className="grid grid-cols-2 gap-3">
										<DimensionInput id="fc-height" label="Paling height" value={state.height} onChange={set("height")} />
										<DimensionInput id="fc-post-h" label="Post above ground" value={state.postAboveGround} onChange={set("postAboveGround")} />
									</div>
									<div className="grid grid-cols-3 gap-3">
										<DimensionInput id="fc-hole-d" label="Hole depth" value={state.holeDepth} onChange={set("holeDepth")} />
										<DimensionInput id="fc-hole-dia" label="Hole diameter" value={state.holeDiameter} onChange={set("holeDiameter")} />
										<div className="flex flex-col gap-1">
											<span className={styles.label}>Bag</span>
											<SegmentedControl<string> label="Premix bag" size="sm" value={`${state.bagWeightLb}`} onChange={(v) => set("bagWeightLb")(Number(v))} options={BAG_OPTIONS.filter((b) => ["60", "80"].includes(b.value))} />
										</div>
									</div>
									<div className="grid grid-cols-4 gap-3">
										<NumberField id="fc-p-post" label="Post" value={state.pricePerPost} onChange={set("pricePerPost")} prefix="$" step="any" />
										<NumberField id="fc-p-rail" label="Rail" value={state.pricePerRail} onChange={set("pricePerRail")} prefix="$" step="any" />
										<NumberField id="fc-p-paling" label="Paling" value={state.pricePerPaling} onChange={set("pricePerPaling")} prefix="$" step="any" />
										<NumberField id="fc-p-bag" label="Bag" value={state.pricePerBag} onChange={set("pricePerBag")} prefix="$" step="any" />
									</div>
								</>
							)}

							{state.mode === "post-panel" && (
								<>
									<div className="grid grid-cols-2 gap-3">
										<DimensionInput id="fc-panel" label="Panel width" value={state.panelWidth} onChange={set("panelWidth")} />
										<DimensionInput id="fc-post" label="Post width" value={state.postWidth} onChange={set("postWidth")} hint="Along the fence" />
									</div>
									<div className="flex flex-col gap-1">
										<span className={styles.label}>Odd panel</span>
										<SegmentedControl<"last" | "both">
											label="Odd panel"
											size="sm"
											fill={false}
											value={state.adjust}
											onChange={set("adjust")}
											options={[
												{ value: "last", label: "Cut at the end" },
												{ value: "both", label: "Split both ends" },
											]}
										/>
									</div>
								</>
							)}

							{state.mode === "arched" && (
								<>
									<div className="grid grid-cols-2 gap-3">
										<DimensionInput id="fc-bay" label="Bay width" value={state.bayWidth} onChange={set("bayWidth")} hint="Clear between posts" />
										<DimensionInput id="fc-post" label="Post width" value={state.postWidth} onChange={set("postWidth")} hint="Drawing only" />
									</div>
									<div className="grid grid-cols-2 gap-3">
										<DimensionInput id="fc-paling-w" label="Paling width" value={state.palingWidth} onChange={set("palingWidth")} />
										<DimensionInput id="fc-paling-g" label="Paling gap" value={state.palingGap} onChange={set("palingGap")} hint="Adjusted to fit" />
									</div>
									<div className="flex flex-wrap items-end gap-x-6 gap-y-3">
										<div className="flex flex-col gap-1">
											<span className={styles.label}>Shape</span>
											<SegmentedControl<"concave" | "convex">
												label="Shape"
												size="sm"
												fill={false}
												value={state.shape}
												onChange={set("shape")}
												options={[
													{ value: "concave", label: "Scalloped (dips)" },
													{ value: "convex", label: "Arched (rises)" },
												]}
											/>
										</div>
										<DimensionInput id="fc-rise" label={state.shape === "concave" ? "Dip" : "Rise"} value={state.rise} onChange={set("rise")} className="w-36" />
										<DimensionInput id="fc-h-posts" label="Height at the posts" value={state.heightAtPosts} onChange={set("heightAtPosts")} className="w-44" />
									</div>
								</>
							)}

							{state.mode === "glass" && (
								<>
									<div className="grid grid-cols-3 gap-3">
										<DimensionInput id="fc-max-panel" label="Max panel width" value={state.maxPanelWidth} onChange={set("maxPanelWidth")} />
										<DimensionInput id="fc-glass-gap" label="Gap" value={state.glassGap} onChange={set("glassGap")} hint="Between panels, or panel to post" />
										<DimensionInput id="fc-glass-h" label="Glass height" value={state.glassHeight} onChange={set("glassHeight")} />
									</div>
									<div className="flex flex-wrap items-end gap-x-6 gap-y-3">
										<div className="flex flex-col gap-1">
											<span className={styles.label}>Supported on</span>
											<SegmentedControl<"spigots" | "posts">
												label="Supported on"
												size="sm"
												fill={false}
												value={state.support}
												onChange={set("support")}
												options={[
													{ value: "spigots", label: "Spigots" },
													{ value: "posts", label: "Posts" },
												]}
											/>
										</div>
										{state.support === "posts" ? (
											<DimensionInput id="fc-glass-post" label="Post width" value={state.glassPostWidth} onChange={set("glassPostWidth")} className="w-36" />
										) : (
											<>
												<NumberField id="fc-spigots" label="Spigots per panel" value={state.spigotsPerPanel} onChange={(v) => set("spigotsPerPanel")(Math.round(Math.min(6, Math.max(0, v))))} min={0} max={6} step={1} className="w-36" />
												<DimensionInput id="fc-inset" label="Spigot inset" value={state.spigotInset} onChange={set("spigotInset")} hint="From each panel end" className="w-40" />
											</>
										)}
									</div>
								</>
							)}
						</div>
					</section>

					<section className={styles.card} aria-labelledby="fc-results">
						<h2 id="fc-results" className={styles.cardTitle}>
							Layout
						</h2>
						{result ? <ResultList rows={rows} /> : <p className={styles.empty}>Enter the run and the member sizes. An arch must rise less than half the bay; posts and panels must fit the run.</p>}
						{result?.warnings.map((w) => (
							<p key={w} className={styles.warn}>
								{w}
							</p>
						))}
						{ar && (
							<table className={`${styles.table} mt-4`}>
								<caption className="sr-only">Paling lengths</caption>
								<thead>
									<tr>
										<th scope="col">#</th>
										<th scope="col">From post</th>
										<th scope="col">Long point</th>
										<th scope="col">Short point</th>
									</tr>
								</thead>
								<tbody>
									{ar.palings.map((p) => (
										<tr key={p.index}>
											<td className="mono">{p.index}</td>
											<td className="mono">{format(p.near)}</td>
											<td className="mono">{format(p.long)}</td>
											<td className="mono">{format(p.short)}</td>
										</tr>
									))}
								</tbody>
							</table>
						)}
					</section>
				</div>

				{drawing && (
					<>
						<section className={styles.card} aria-labelledby="fc-diagram">
							<h2 id="fc-diagram" className={styles.cardTitle}>
								Elevation
							</h2>
							<PrintDiagrams title={title} subtitle="Drawn to fit">
								<FenceDiagram {...drawing} />
							</PrintDiagrams>
						</section>
						<div className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
							{running && <RunningList title={running.title} positions={running.positions} labelFor={running.labelFor} reference={running.withReference ? state.reference : undefined} onReferenceChange={running.withReference ? set("reference") : undefined} />}
							{pr && state.postWidth !== null && state.holeDiameter !== null && state.holeDepth !== null && state.postAboveGround !== null && (
								<section className={styles.card} aria-labelledby="fc-hole">
									<h2 id="fc-hole" className={styles.cardTitle}>
										Post hole
									</h2>
									<PrintDiagrams title="Post hole" subtitle={`${format(state.holeDiameter)} across, ${format(state.holeDepth)} deep, ${pr.concretePerHole.toFixed(2)} ft³ each`}>
										<PostHoleDiagram postWidth={state.postWidth} holeDiameter={state.holeDiameter} holeDepth={state.holeDepth} aboveGround={state.postAboveGround} format={format} />
									</PrintDiagrams>
								</section>
							)}
						</div>
					</>
				)}

				<div className="grid gap-4 lg:grid-cols-2">
					<LumberTable />
					<div className="flex flex-col gap-4">
						<ShareCalculation state={state} onLoad={(s) => setState(sanitize(s))} />
						<ConstructionNotes />
					</div>
				</div>
			</div>
		</div>
	);
}
