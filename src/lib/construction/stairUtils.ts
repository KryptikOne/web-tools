/**
 * Straight stairs: risers and treads from a total rise, stringer geometry, headroom and concrete
 * volume. Lengths in inches, angles in degrees. Geometric only: codes set the limits.
 */

const DEG = 180 / Math.PI;

export type TopTread = "down" | "level";
export type RunBy = "ideal-run" | "total-run" | "angle";
export type Construction = "wood" | "concrete";

export interface StairInput {
	totalRise: number;
	idealRise: number;
	/** Overrides the riser count chosen from the ideal rise */
	risers?: number;
	runBy: RunBy;
	idealRun: number;
	totalRun: number;
	angle: number;
	topTread: TopTread;
	construction: Construction;
	/** Stringer board depth for wood, throat (waist) thickness for concrete */
	stringerWidth: number;
	throat: number;
	stairWidth: number;
	floorThickness: number;
	treadThickness: number;
	riserThickness: number;
	nosing: number;
	/** Horizontal length of the opening in the floor above, from the top riser face */
	openingLength: number;
	/** Keep rise and run inside the usual residential range */
	restrict: boolean;
}

export interface Stair {
	risers: number;
	rise: number;
	treads: number;
	run: number;
	totalRun: number;
	angle: number;
	/** Along the stringer per step */
	stepLength: number;
	/** Along the stringer, bottom to top of the flight on the pitch line */
	stringerLength: number;
	/** Remaining width of a notched stringer, square to its edge */
	throat: number;
	/** Cut off the bottom of the stringer so the first rise matches once treads are on */
	bottomDrop: number;
	/** 2R + T, the common comfort check */
	twoRisePlusRun: number;
	/** R × T */
	riseTimesRun: number;
	headroom: number;
	/** Opening length that would give 80 in of headroom */
	openingFor80: number;
	/** Top of each tread above the lower floor, bottom tread first */
	treadHeights: number[];
	/** Treads where a landing could go: at least 36 in of rise above and below */
	landingCandidates: number[];
	/** Concrete: cross-section area and volume, zero for wood */
	concreteArea: number;
	concreteVolume: number;
	warnings: string[];
}

export interface RiseOption {
	risers: number;
	rise: number;
	treads: number;
}

/** Riser counts around the ideal with the rise each gives. */
export function possibleRises(totalRise: number, idealRise: number, topTread: TopTread, spread = 2): RiseOption[] {
	if (!(totalRise > 0) || !(idealRise > 0)) return [];
	const ideal = Math.max(2, Math.round(totalRise / idealRise));
	const out: RiseOption[] = [];
	for (let n = Math.max(2, ideal - spread); n <= ideal + spread; n++) out.push({ risers: n, rise: totalRise / n, treads: topTread === "level" ? n : n - 1 });
	return out;
}

export function solveStair(input: StairInput): Stair | null {
	const { totalRise, idealRise, topTread, construction, stringerWidth, throat: throatIn, stairWidth, floorThickness, treadThickness, nosing, openingLength, restrict } = input;
	if (!(totalRise > 0) || !(idealRise > 0) || !(stairWidth > 0)) return null;
	let risers = input.risers ?? Math.max(2, Math.round(totalRise / idealRise));
	risers = Math.max(2, Math.floor(risers));
	const rise = totalRise / risers;
	const treads = topTread === "level" ? risers : risers - 1;
	let run: number;
	if (input.runBy === "total-run") run = input.totalRun / treads;
	else if (input.runBy === "angle") {
		if (!(input.angle > 0) || input.angle >= 90) return null;
		run = rise / Math.tan(input.angle / DEG);
	} else run = input.idealRun;
	if (!(run > 0)) return null;
	const warnings: string[] = [];
	if (restrict) {
		const r0 = rise;
		const t0 = run;
		const rClamped = Math.min(Math.max(rise, 4), 7.75);
		if (Math.abs(rClamped - rise) > 1e-9) warnings.push(`A ${r0.toFixed(2)} in rise is outside the usual 4 to 7 3/4 in; change the riser count`);
		run = Math.min(Math.max(run, 9), 14);
		if (Math.abs(run - t0) > 1e-9) warnings.push(`Run held to ${run} in (usual range 9 to 14 in)`);
	}
	const angle = Math.atan2(rise, run) * DEG;
	const stepLength = Math.hypot(rise, run);
	const totalRun = run * treads;
	const stringerLength = Math.hypot(totalRise, totalRun);
	const cos = run / stepLength;
	const notchDepth = rise * cos;
	const throat = construction === "wood" ? stringerWidth - notchDepth : throatIn;
	if (construction === "wood" && throat < 3.5) warnings.push(`Only ${throat.toFixed(2)} in of stringer is left below the notches; 3 1/2 in is the usual minimum`);
	const twoRisePlusRun = 2 * rise + run;
	if (twoRisePlusRun < 24 || twoRisePlusRun > 25) warnings.push(`2R + T is ${twoRisePlusRun.toFixed(1)} in; 24 to 25 in is the comfortable range`);
	const tan = rise / run;
	const headroom = openingLength * tan - floorThickness;
	const openingFor80 = (80 + floorThickness) / tan;
	if (headroom < 80) warnings.push(`Headroom at the opening is ${headroom.toFixed(1)} in; 80 in needs an opening ${openingFor80.toFixed(1)} in long`);
	if (nosing > run / 2) warnings.push("Nosing is more than half the run");
	const treadHeights = Array.from({ length: treads }, (_, i) => (i + 1) * rise);
	const landingCandidates = treadHeights.map((h, i) => i + 1).filter((i) => i * rise >= 36 && totalRise - i * rise >= 36);
	let concreteArea = 0;
	let concreteVolume = 0;
	if (construction === "concrete") {
		concreteArea = treads * ((rise * run) / 2) + throatIn * stringerLength;
		concreteVolume = concreteArea * stairWidth;
	}
	return {
		risers,
		rise,
		treads,
		run,
		totalRun,
		angle,
		stepLength,
		stringerLength,
		throat,
		bottomDrop: treadThickness,
		twoRisePlusRun,
		riseTimesRun: rise * run,
		headroom,
		openingFor80,
		treadHeights,
		landingCandidates,
		concreteArea,
		concreteVolume,
		warnings,
	};
}

/** Running points along a stringer edge from its bottom end: the nosing line crossing for each step. */
export function stringerRunningPoints(stair: Stair): number[] {
	return Array.from({ length: stair.treads + 1 }, (_, i) => i * stair.stepLength);
}
