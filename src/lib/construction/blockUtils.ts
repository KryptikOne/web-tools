/**
 * Concrete block walls: blocks per course and courses, openings taken out, half blocks at corners
 * and ends in running bond, mortar by bag yield, core fill grout and bags, vertical rebar in the
 * cores, cost. Lengths in inches. Uses the brick gauge maths and the premix bag yield.
 */

import { gauge } from "./masonryUtils";
import { bagsFor, type RebarSize } from "./concreteUtils";

export interface BlockSize {
	id: string;
	label: string;
	/** Actual length, width (through the wall) and height */
	length: number;
	width: number;
	height: number;
	/** Grout to fill all cores of one block, cubic feet */
	coreFillCubicFeet: number;
	cores: number;
}

/** Common sizes, actual dimensions (nominal less a 3/8 in joint). Core fill from manufacturers' tables. */
export const BLOCK_SIZES: BlockSize[] = [
	{ id: "4", label: `4" block 15 5/8 × 3 5/8 × 7 5/8`, length: 15.625, width: 3.625, height: 7.625, coreFillCubicFeet: 0.08, cores: 2 },
	{ id: "6", label: `6" block 15 5/8 × 5 5/8 × 7 5/8`, length: 15.625, width: 5.625, height: 7.625, coreFillCubicFeet: 0.17, cores: 2 },
	{ id: "8", label: `8" block 15 5/8 × 7 5/8 × 7 5/8`, length: 15.625, width: 7.625, height: 7.625, coreFillCubicFeet: 0.25, cores: 2 },
	{ id: "10", label: `10" block 15 5/8 × 9 5/8 × 7 5/8`, length: 15.625, width: 9.625, height: 7.625, coreFillCubicFeet: 0.33, cores: 2 },
	{ id: "12", label: `12" block 15 5/8 × 11 5/8 × 7 5/8`, length: 15.625, width: 11.625, height: 7.625, coreFillCubicFeet: 0.42, cores: 2 },
	{ id: "half-8", label: `8" half block 7 5/8 × 7 5/8 × 7 5/8`, length: 7.625, width: 7.625, height: 7.625, coreFillCubicFeet: 0.125, cores: 1 },
];

export interface BlockOpening {
	count: number;
	width: number;
	height: number;
}

export interface BlockWallInput {
	/** Total wall length, all walls together */
	length: number;
	height: number;
	block: { length: number; width: number; height: number; coreFillCubicFeet: number; cores: number };
	joint: number;
	openings: BlockOpening[];
	/** Outside corners; each takes a half block on alternate courses */
	corners: number;
	/** Free wall ends; each takes a half block on alternate courses */
	ends: number;
	wastePercent: number;
	pricePerBlock: number;
	/** Blocks laid per bag of mortar */
	blocksPerMortarBag: number;
	/** Fill every nth core; 0 for none, 1 for all */
	groutEveryNthCore: number;
	groutBagWeightLb: number;
	/** Vertical bar in every nth core; 0 for none */
	rebarEveryNthCore: number;
	rebarSize: RebarSize;
	/** Bar projection above the wall and lap into the footing, added to the wall height */
	rebarExtra: number;
	pricePerGroutBag: number;
}

export interface BlockWall {
	courses: number;
	/** Course height with the joint */
	gaugeHeight: number;
	/** Height the courses actually reach */
	wallHeight: number;
	blocksPerCourse: number;
	grossBlocks: number;
	openingBlocks: number;
	netBlocks: number;
	halfBlocks: number;
	blocksWithWaste: number;
	wallArea: number;
	openingArea: number;
	mortarBags: number;
	coresTotal: number;
	groutedCores: number;
	groutCubicFeet: number;
	groutBags: number;
	rebarBars: number;
	rebarLength: number;
	rebarWeightLb: number;
	cost: { blocks: number; grout: number; total: number };
	warnings: string[];
}

export function blockWall(input: BlockWallInput): BlockWall | null {
	const { length: L, height: H, block, joint, openings, corners, ends, wastePercent, pricePerBlock, blocksPerMortarBag, groutEveryNthCore, groutBagWeightLb, rebarEveryNthCore, rebarSize, rebarExtra } = input;
	if (!(L > 0) || !(H > 0) || !(block.length > 0) || !(block.width > 0) || !(block.height > 0) || !(joint >= 0) || !(corners >= 0) || !(ends >= 0) || !(blocksPerMortarBag > 0)) return null;
	const g = gauge({ unitHeight: block.height, bedJoint: joint, by: "height", targetHeight: H, courses: 0, minJoint: joint, maxJoint: joint });
	if (!g) return null;
	const courses = g.courses;
	const gaugeHeight = g.nominalGauge;
	const wallHeight = g.nominalHeight;
	const blocksPerCourse = (L + joint) / (block.length + joint);
	if (courses > 2000 || blocksPerCourse > 20000) return null;
	const grossBlocks = blocksPerCourse * courses;
	const faceArea = (block.length + joint) * (block.height + joint);
	const openingArea = openings.reduce((s, o) => s + Math.max(0, o.count) * Math.max(0, o.width) * Math.max(0, o.height), 0);
	const openingBlocks = openingArea / faceArea;
	const netBlocks = Math.max(0, Math.ceil(grossBlocks - openingBlocks - 1e-9));
	const halfBlocks = (corners + ends) * Math.ceil(courses / 2);
	const blocksWithWaste = Math.ceil(netBlocks * (1 + Math.max(0, wastePercent) / 100) - 1e-9);
	const wallArea = L * wallHeight;
	const warnings: string[] = [];
	if (openingArea > wallArea) warnings.push("The openings are bigger than the wall");
	if (Math.abs(wallHeight - H) > 1e-6) warnings.push(`${courses} courses reach ${wallHeight.toFixed(2)} in, not ${H} in; block walls step in whole courses`);
	const coresTotal = netBlocks * Math.max(0, block.cores);
	const groutedCores = groutEveryNthCore > 0 ? Math.ceil(coresTotal / groutEveryNthCore) : 0;
	const groutCubicFeet = block.cores > 0 ? (groutedCores * block.coreFillCubicFeet) / block.cores : 0;
	const groutBags = groutBagWeightLb > 0 ? bagsFor(groutCubicFeet, groutBagWeightLb) : 0;
	// vertical bars: one per nth core along a course, full height plus the extra
	const coresAlong = blocksPerCourse * Math.max(0, block.cores);
	const rebarBars = rebarEveryNthCore > 0 ? Math.ceil(coresAlong / rebarEveryNthCore) : 0;
	const rebarLength = rebarBars * (wallHeight + Math.max(0, rebarExtra));
	const cost = { blocks: blocksWithWaste * Math.max(0, pricePerBlock), grout: groutBags * Math.max(0, input.pricePerGroutBag), total: 0 };
	cost.total = cost.blocks + cost.grout;
	return {
		courses,
		gaugeHeight,
		wallHeight,
		blocksPerCourse,
		grossBlocks,
		openingBlocks,
		netBlocks,
		halfBlocks,
		blocksWithWaste,
		wallArea,
		openingArea,
		mortarBags: Math.ceil(netBlocks / blocksPerMortarBag - 1e-9),
		coresTotal,
		groutedCores,
		groutCubicFeet,
		groutBags,
		rebarBars,
		rebarLength,
		rebarWeightLb: (rebarLength / 12) * rebarSize.weight,
		cost,
		warnings,
	};
}
