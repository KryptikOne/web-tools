/**
 * Equal-pitch hip roof: hips at 45° in plan, commons, jack rafters with their diminish and cheek
 * cuts, drop or backing for the hip, ridge and cap lengths, sheathing and lumber. Lengths in
 * inches, angles in degrees. Each rafter is solved with `commonRafter` so cuts match that tool.
 */

import { commonRafter, runFromSpan, type Rafter } from "./rafterUtils";
import { boardFeet, priceLumber, type BoardSection } from "./lumberUtils";

const DEG = 180 / Math.PI;
const SQRT2 = Math.SQRT2;

export interface HipRoofInput {
	/** Outside of wall to outside of wall, the shorter side */
	buildingWidth: number;
	/** Outside of wall to outside of wall, along the ridge */
	buildingLength: number;
	angle: number;
	/** Level eave overhang, all round */
	overhang: number;
	commonDepth: number;
	commonThickness: number;
	hipDepth: number;
	hipThickness: number;
	ridgeThickness: number;
	/** Birdsmouth seat on the commons */
	seat: number;
	wallThickness: number;
	wallHeight: number;
	centers: number;
	sheetWidth: number;
	sheetLength: number;
	costPer1000Bft: number;
}

export interface Jack {
	index: number;
	/** Level run from the corner along the wall, equal to its run to the hip centre line */
	run: number;
	/** Along the jack to the hip centre line */
	length: number;
	/** Shortened for half the hip's 45° thickness */
	lengthCut: number;
}

export interface HipRoof {
	common: Rafter;
	hip: Rafter;
	/** Level run of the common to the ridge centre */
	run: number;
	rise: number;
	/** Common shortening for the ridge, along the rafter */
	commonShortening: number;
	commonLengthCut: number;
	/** Hip run in plan, corner to the ridge centre */
	hipRun: number;
	hipAngle: number;
	/** Rise per 17 (16.97) of hip run */
	hipPitchPer17: number;
	/** Hip shortening at the ridge, level and along the hip */
	hipShorteningLevel: number;
	hipShortening: number;
	hipLengthCut: number;
	hipOverallCut: number;
	/** Angle of the hip and jack side (cheek) cuts from square, marked on the top edge */
	hipCheekAngle: number;
	jackCheekAngle: number;
	/** Drop the hip seat by this so its edges meet the roof planes */
	hipDrop: number;
	/** Or back (bevel) the top edge at this angle each side, saw bevel from the top face */
	backingAngle: number;
	/** Jacks per hip per face, from the corner */
	jacks: Jack[];
	jackDiminish: number;
	jackCheekLevelShortening: number;
	/** Ridge from hip centre to hip centre, and the board length (plus one common thickness) */
	ridgeLength: number;
	ridgeBoardLength: number;
	ridgeTopAbovePlate: number;
	commonsPerSide: number;
	/** Side commons on both long walls plus the two end king commons */
	totalCommons: number;
	totalJacks: number;
	totalHips: number;
	/** Rafter positions from one corner along a long wall, for the running list: jacks, commons, jacks */
	sideRafterPositions: number[];
	hipCapLength: number;
	/** Trapezoid faces along the long walls and triangle faces on the ends */
	sideFaceArea: number;
	endFaceArea: number;
	roofArea: number;
	sheetsSideFace: number;
	sheetsEndFace: number;
	totalSheets: number;
	lumber: { item: string; pieces: number; length: number; boardFeet: number; cost: number }[];
	totalBoardFeet: number;
	totalCost: number;
	warnings: string[];
}

const stock = (overall: number) => Math.ceil(overall / 24 - 1e-9) * 24;

export function hipRoof(input: HipRoofInput): HipRoof | null {
	const { buildingWidth: W, buildingLength: L, angle, overhang, commonDepth, commonThickness, hipDepth, hipThickness, ridgeThickness, seat, wallThickness, wallHeight, centers, sheetWidth, sheetLength, costPer1000Bft } = input;
	if (!(W > 0) || !(L >= W) || !(angle > 0) || angle >= 90 || !(overhang >= 0) || !(hipDepth > 0) || !(hipThickness > 0) || !(ridgeThickness >= 0) || !(centers > 0) || !(sheetWidth > 0) || !(sheetLength > 0)) return null;
	const t = angle / DEG;
	const tan = Math.tan(t);
	const cos = Math.cos(t);
	const run = runFromSpan(W, 0);
	const common = commonRafter({ run, angle, overhang, depth: commonDepth, thickness: commonThickness, birdsmouth: seat, birdsmouthBy: "seat", wallThickness, wallHeight });
	if (!common) return null;
	const rise = common.rise;
	const hipRun = run * SQRT2;
	const hipAngle = Math.atan(tan / SQRT2) * DEG;
	const hipCos = Math.cos(hipAngle / DEG);
	const hipTan = Math.tan(hipAngle / DEG);
	const hipDrop = (hipThickness / 2) * hipTan;
	// the hip's top edge sits `hipDrop` under the common's HAP so its edges meet the roof planes
	const hipHeel = Math.max(0, hipDepth / hipCos - (common.hap - hipDrop));
	const hip = commonRafter({ run: hipRun, angle: hipAngle, overhang: overhang * SQRT2, depth: hipDepth, thickness: hipThickness, birdsmouth: hipHeel, birdsmouthBy: "plumb", wallThickness: wallThickness * SQRT2, wallHeight });
	if (!hip) return null;

	const commonShortening = ridgeThickness / 2 / cos;
	const hipShorteningLevel = (ridgeThickness / 2) * SQRT2;
	const hipShortening = hipShorteningLevel / hipCos;
	const unitHip = Math.hypot(16.97, 12 * tan);
	const hipCheekAngle = Math.atan(16.97 / unitHip) * DEG;
	const jackCheekAngle = Math.atan(cos) * DEG;
	const backingAngle = Math.atan(Math.sin(hipAngle / DEG)) * DEG;

	const jackCheekLevelShortening = (hipThickness / 2) * SQRT2;
	const jacks: Jack[] = [];
	for (let k = 1; k * centers < run - 1e-9 && k < 10000; k++) {
		const r = k * centers;
		const length = r / cos;
		jacks.push({ index: k, run: r, length, lengthCut: length - jackCheekLevelShortening / cos });
	}
	const jackDiminish = centers / cos;

	const ridgeLength = L - W;
	const commonsPerSide = Math.floor(ridgeLength / centers + 1e-9) + 1;
	const totalCommons = commonsPerSide * 2 + 2;
	const totalJacks = jacks.length * 8;
	const sideRafterPositions = [...jacks.map((j) => j.run), ...Array.from({ length: commonsPerSide }, (_, i) => run + i * centers), ...jacks.map((j) => L - j.run).reverse()];

	const plan = (L + 2 * overhang) * (W + 2 * overhang);
	const endPlan = (W + 2 * overhang) ** 2 / 4;
	const endFaceArea = endPlan / cos;
	const sideFaceArea = (plan - 2 * endPlan) / 2 / cos;
	const roofArea = plan / cos;
	const slope = common.overallLength;
	const across = Math.ceil(slope / sheetWidth - 1e-9);
	const sheetsEndFace = across * Math.ceil((W + 2 * overhang) / sheetLength - 1e-9);
	const sheetsSideFace = across * Math.ceil((L + 2 * overhang) / sheetLength - 1e-9);
	if (sheetsSideFace > 1e5) return null;

	const commonSection: BoardSection = { width: commonDepth, thickness: commonThickness };
	const hipSection: BoardSection = { width: hipDepth, thickness: hipThickness };
	const line = (item: string, section: BoardSection, pieces: number, length: number) => ({ item, pieces, length, boardFeet: boardFeet(section, length) * pieces, cost: priceLumber({ section, lengthIn: length, pieces, costPer1000Bft }).totalCost });
	const lumber = [line("Common rafters", commonSection, totalCommons, stock(common.overallLength)), line("Hip rafters", hipSection, 4, stock(hip.overallLength))];
	// jacks: pair the longest with the shortest from one stock length where it fits
	const jackLengths = jacks.map((j) => j.lengthCut + common.tailLength).sort((a, b) => b - a);
	let jackPieces = 0;
	let jackStock = 0;
	if (jackLengths.length) {
		jackStock = stock(jackLengths[0]);
		let i = 0;
		let j = jackLengths.length - 1;
		while (i <= j) {
			jackPieces++;
			if (i < j && jackLengths[i] + jackLengths[j] <= jackStock) j--;
			i++;
		}
		lumber.push(line("Jack rafters", commonSection, jackPieces * 8, jackStock));
	}
	const totalBoardFeet = lumber.reduce((s, l) => s + l.boardFeet, 0);
	const totalCost = lumber.reduce((s, l) => s + l.cost, 0);

	const warnings = [...common.warnings];
	if (hipHeel <= 0) warnings.push("The hip is too shallow to leave a heel under the common's height above plate; use a deeper hip");
	if (hipDepth < common.plumbDepth * hipCos) warnings.push("The hip is shallower than the commons' plumb cut; its top edge will sit below the roof planes");

	return {
		common,
		hip,
		run,
		rise,
		commonShortening,
		commonLengthCut: common.lineLength - commonShortening,
		hipRun,
		hipAngle,
		hipPitchPer17: 12 * tan,
		hipShorteningLevel,
		hipShortening,
		hipLengthCut: hip.lineLength - hipShortening,
		hipOverallCut: hip.overallLength - hipShortening,
		hipCheekAngle,
		jackCheekAngle,
		hipDrop,
		backingAngle,
		jacks,
		jackDiminish,
		jackCheekLevelShortening,
		ridgeLength,
		ridgeBoardLength: ridgeLength + commonThickness,
		ridgeTopAbovePlate: common.ridgeAbovePlate,
		commonsPerSide,
		totalCommons,
		totalJacks,
		totalHips: 4,
		sideRafterPositions,
		hipCapLength: 4 * hip.overallLength,
		sideFaceArea,
		endFaceArea,
		roofArea,
		sheetsSideFace,
		sheetsEndFace,
		totalSheets: 2 * sheetsSideFace + 2 * sheetsEndFace,
		lumber,
		totalBoardFeet,
		totalCost,
		warnings,
	};
}
