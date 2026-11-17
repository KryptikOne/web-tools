/**
 * Fences: post and rail with palings, post and panel, arched (scalloped) paling tops, and glass
 * balustrades on posts or spigots. Lengths in inches. Posts and palings come from the shared
 * spacing engine; the arch from the arc solver; post hole concrete from the premix bag yield.
 */

import { computeSpacing, type SpacingResult } from "./spacingUtils";
import { solveArc } from "./geometryUtils";
import { bagsFor, cylinderVolume, cubicFeet } from "./concreteUtils";


// ── Post and rail ────────────────────────────────────────────────────────────

export interface PostRailInput {
	length: number;
	postWidth: number;
	/** Largest post centre-to-centre distance */
	maxCenters: number;
	rails: number;
	palingWidth: number;
	palingGap: number;
	/** Paling height above ground */
	height: number;
	/** Post above ground, usually the paling height or a little more */
	postAboveGround: number;
	holeDepth: number;
	holeDiameter: number;
	bagWeightLb: number;
	pricePerPost: number;
	pricePerRail: number;
	pricePerPaling: number;
	pricePerBag: number;
}

export interface PostRail {
	posts: SpacingResult;
	palings: SpacingResult;
	bays: number;
	postCount: number;
	postCenters: number;
	bayClear: number;
	railCount: number;
	railLength: number;
	palingCount: number;
	palingGap: number;
	postLength: number;
	/** Per hole and total, cubic feet */
	concretePerHole: number;
	concreteTotal: number;
	bags: number;
	cost: { posts: number; rails: number; palings: number; concrete: number; total: number };
	warnings: string[];
}

export function postAndRail(input: PostRailInput): PostRail | null {
	const { length: L, postWidth: w, maxCenters, rails, palingWidth, palingGap, height, postAboveGround, holeDepth, holeDiameter, bagWeightLb } = input;
	if (!(L > w) || !(w > 0) || !(maxCenters > w) || !(rails >= 0) || !(palingWidth > 0) || !(palingGap >= 0) || !(height > 0) || !(postAboveGround > 0) || !(holeDepth >= 0) || !(holeDiameter >= 0) || !(bagWeightLb > 0)) return null;
	const bays = Math.max(1, Math.ceil((L - w) / maxCenters - 1e-9));
	if (bays > 1000) return null;
	const posts = computeSpacing({ mode: "equal", totalLength: L, memberWidth: w, endMembers: "both", count: bays + 1 });
	const palings = computeSpacing({ mode: "exact", totalLength: L, memberWidth: palingWidth, endMembers: "both", centers: palingWidth + palingGap, adjust: "both" });
	const perHole = cubicFeet(cylinderVolume(holeDiameter, holeDepth));
	const total = perHole * posts.count;
	const bags = bagsFor(total, bagWeightLb);
	const warnings: string[] = [];
	if (palings.warnings.includes("centers-smaller-than-width")) warnings.push("Paling gap cannot be negative");
	const railLength = posts.centers;
	const cost = {
		posts: posts.count * input.pricePerPost,
		rails: rails * bays * input.pricePerRail,
		palings: palings.count * input.pricePerPaling,
		concrete: bags * input.pricePerBag,
		total: 0,
	};
	cost.total = cost.posts + cost.rails + cost.palings + cost.concrete;
	return {
		posts,
		palings,
		bays,
		postCount: posts.count,
		postCenters: posts.centers,
		bayClear: posts.gap,
		railCount: rails * bays,
		railLength,
		palingCount: palings.count,
		palingGap: palings.gap,
		postLength: postAboveGround + holeDepth,
		concretePerHole: perHole,
		concreteTotal: total,
		bags,
		cost,
		warnings,
	};
}

// ── Post and panel ───────────────────────────────────────────────────────────

export interface PostPanelInput {
	length: number;
	panelWidth: number;
	postWidth: number;
	/** Where the odd panel goes: one cut panel at the end, or split between both ends */
	adjust: "last" | "both";
}

export interface PostPanel {
	/** Post near-face positions from the start */
	postPositions: number[];
	postCount: number;
	postCenters: number;
	wholePanels: number;
	/** Width of each cut panel; empty when the panels fit exactly */
	cutPanels: number[];
	panelCount: number;
	warnings: string[];
}

export function postAndPanel(input: PostPanelInput): PostPanel | null {
	const { length: L, panelWidth: p, postWidth: w, adjust } = input;
	if (!(L > w) || !(p > 0) || !(w > 0)) return null;
	const pitch = p + w;
	const whole = Math.floor((L - w) / pitch + 1e-9);
	if (whole > 1000) return null;
	let rest = L - w - whole * pitch; // leftover beyond the whole panels, includes one post per extra bay
	const warnings: string[] = [];
	const cutPanels: number[] = [];
	const bays: number[] = Array(whole).fill(p);
	if (rest > 1e-9) {
		if (adjust === "both" && rest > 2 * w) {
			const each = (rest - 2 * w) / 2;
			cutPanels.push(each, each);
			bays.unshift(each);
			bays.push(each);
		} else {
			const cut = rest - w;
			if (cut > 1e-9) {
				cutPanels.push(cut);
				bays.push(cut);
			} else {
				// not even room for a post and a panel: stretch is impossible, widen the last gap
				rest = 0;
				warnings.push(`The last ${cutPanelLabel(rest + cut + w)} does not fit a post and panel; extend or shorten the run`);
			}
		}
	}
	const postPositions: number[] = [0];
	let x = w;
	for (const b of bays) {
		x += b;
		postPositions.push(x);
		x += w;
	}
	if (cutPanels.some((c) => c < p / 4)) warnings.push("A cut panel narrower than a quarter panel; try the other end adjustment or a different length");
	return { postPositions, postCount: postPositions.length, postCenters: pitch, wholePanels: whole, cutPanels, panelCount: bays.length, warnings };
}

function cutPanelLabel(n: number): string {
	return `${n.toFixed(2)} in`;
}

// ── Arched (scalloped) palings ───────────────────────────────────────────────

export interface ArchedPalingInput {
	/** Clear width between posts */
	bayWidth: number;
	palingWidth: number;
	gap: number;
	/** How far the arc rises or dips over the bay */
	rise: number;
	/** Concave dips in the middle (scallop), convex rises */
	shape: "concave" | "convex";
	/** Paling height at the posts */
	heightAtPosts: number;
}

export interface ArchedPaling {
	index: number;
	near: number;
	center: number;
	far: number;
	/** Top of the paling at its centre line, and at each edge */
	heightCenter: number;
	heightNear: number;
	heightFar: number;
	/** Longest and shortest edge, for the cutting list */
	long: number;
	short: number;
}

export interface ArchedPalings {
	palings: ArchedPaling[];
	count: number;
	gap: number;
	radius: number;
	arcLength: number;
	/** Height at the centre of the bay */
	heightAtCenter: number;
	/** Cutting list grouped by long-point length, symmetric palings counted together */
	cuttingList: { length: number; count: number }[];
	warnings: string[];
}

export function archedPalings(input: ArchedPalingInput): ArchedPalings | null {
	const { bayWidth: B, palingWidth: w, gap, rise, shape, heightAtPosts: H } = input;
	if (!(B > w) || !(w > 0) || !(gap >= 0) || !(rise > 0) || !(H > rise && shape === "concave") && !(H > 0 && shape === "convex")) return null;
	if (rise >= B / 2) return null;
	const arc = solveArc({ chord: B, height: rise });
	if (!arc) return null;
	const spacing = computeSpacing({ mode: "exact", totalLength: B, memberWidth: w, endMembers: "none", centers: w + gap, adjust: "both" });
	if (spacing.count > 1000) return null;
	const R = arc.radius;
	const c = B / 2;
	// arc height above the chord at a distance u from the bay centre
	const y = (u: number) => Math.sqrt(Math.max(0, R * R - u * u)) - (R - rise);
	const top = (x: number) => (shape === "concave" ? H - y(x - c) : H + y(x - c));
	const palings: ArchedPaling[] = spacing.members.map((m) => {
		const hc = top(m.center);
		const hn = top(m.near);
		const hf = top(m.far);
		return { ...m, heightCenter: hc, heightNear: hn, heightFar: hf, long: Math.max(hn, hf), short: Math.min(hn, hf) };
	});
	const groups = new Map<string, { length: number; count: number }>();
	for (const p of palings) {
		const key = p.long.toFixed(3);
		const g = groups.get(key);
		if (g) g.count++;
		else groups.set(key, { length: p.long, count: 1 });
	}
	const warnings: string[] = [];
	if (shape === "concave" && palings.some((p) => p.short < w)) warnings.push("The scallop dips below a paling width at the middle; reduce the rise");
	return {
		palings,
		count: palings.length,
		gap: spacing.gap,
		radius: R,
		arcLength: arc.arcLength,
		heightAtCenter: top(c),
		cuttingList: [...groups.values()].sort((a, b) => b.length - a.length),
		warnings,
	};
}

// ── Glass balustrade ─────────────────────────────────────────────────────────

export interface GlassInput {
	length: number;
	maxPanelWidth: number;
	/** Clear gap between panels (spigots) or between a panel and a post */
	gap: number;
	support: "spigots" | "posts";
	postWidth: number;
	glassHeight: number;
	/** Spigots per panel and their inset from each panel end */
	spigotsPerPanel: number;
	spigotInset: number;
}

export interface GlassPanel {
	index: number;
	near: number;
	far: number;
	width: number;
	spigots: number[];
}

export interface GlassBalustrade {
	panels: GlassPanel[];
	panelCount: number;
	panelWidth: number;
	postPositions: number[];
	spigotPositions: number[];
	spigotCount: number;
	glassArea: number;
	warnings: string[];
}

export function glassBalustrade(input: GlassInput): GlassBalustrade | null {
	const { length: L, maxPanelWidth: maxW, gap, support, postWidth, glassHeight, spigotsPerPanel, spigotInset } = input;
	if (!(L > 0) || !(maxW > 0) || !(gap >= 0) || !(glassHeight > 0) || (support === "posts" && !(postWidth > 0)) || !(spigotsPerPanel >= 0) || !(spigotInset >= 0)) return null;
	const warnings: string[] = [];
	let panels: GlassPanel[] = [];
	let postPositions: number[] = [];
	let panelWidth: number;
	if (support === "spigots") {
		const n = Math.max(1, Math.ceil((L + gap) / (maxW + gap) - 1e-9));
		if (n > 1000) return null;
		panelWidth = (L - (n - 1) * gap) / n;
		if (panelWidth <= 0) return null;
		panels = Array.from({ length: n }, (_, i) => {
			const near = i * (panelWidth + gap);
			return { index: i + 1, near, far: near + panelWidth, width: panelWidth, spigots: [] };
		});
	} else {
		// posts at both ends and between panels; a gap each side of every panel
		const n = Math.max(1, Math.ceil((L - postWidth) / (maxW + 2 * gap + postWidth) - 1e-9));
		if (n > 1000) return null;
		panelWidth = (L - (n + 1) * postWidth - 2 * n * gap) / n;
		if (panelWidth <= 0) return null;
		postPositions = Array.from({ length: n + 1 }, (_, i) => i * (postWidth + 2 * gap + panelWidth));
		panels = Array.from({ length: n }, (_, i) => {
			const near = postPositions[i] + postWidth + gap;
			return { index: i + 1, near, far: near + panelWidth, width: panelWidth, spigots: [] };
		});
	}
	if (support === "spigots" && spigotsPerPanel > 0) {
		for (const p of panels) {
			if (spigotsPerPanel === 1) p.spigots = [p.near + p.width / 2];
			else {
				const span = p.width - 2 * spigotInset;
				p.spigots = Array.from({ length: spigotsPerPanel }, (_, i) => p.near + spigotInset + (span * i) / (spigotsPerPanel - 1));
			}
		}
		if (spigotInset * 2 >= panelWidth) warnings.push("Spigot inset is more than half the panel width");
	}
	const spigotPositions = panels.flatMap((p) => p.spigots);
	return {
		panels,
		panelCount: panels.length,
		panelWidth,
		postPositions,
		spigotPositions,
		spigotCount: spigotPositions.length,
		glassArea: panels.length * panelWidth * glassHeight,
		warnings,
	};
}
