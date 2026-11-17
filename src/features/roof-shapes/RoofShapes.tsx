"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import SegmentedControl from "@/components/SegmentedControl";
import { UnitAndPrecisionBar, DimensionInput, NumberField, ResultList, PrintDiagrams, LumberTable, ShareCalculation, ConstructionNotes } from "@/components/construction";
import type { ResultRow } from "@/components/construction";
import { useConstructionUnits } from "@/hooks/useConstructionUnits";
import { nominalToActual, formatArea } from "@/lib/construction/imperialUtils";
import { skillion, skillionAngleFromWalls, gambrel, saltbox, type Skillion, type Gambrel, type Saltbox } from "@/lib/construction/roofShapesUtils";
import type { Rafter } from "@/lib/construction/rafterUtils";
import { angleToPitch, formatAngle, formatPitch, pitchToAngle } from "@/lib/construction/pitchUtils";
import { RoofSectionDiagram, type RoofSectionDiagramProps, type RafterPiece } from "@/components/construction";
import styles from "./RoofShapes.module.scss";

type Mode = "skillion" | "gambrel" | "saltbox";
type Section = "2x6" | "2x8" | "2x10" | "2x12" | "custom";
type SlopeBy = "pitch" | "angle";

interface RoofShapesState {
	mode: Mode;
	span: number | null;
	buildingLength: number | null;
	section: Section;
	depth: number | null;
	thickness: number | null;
	seat: number | null;
	wallThickness: number | null;
	wallHeight: number | null;
	ridgeThickness: number | null;
	slopeBy: SlopeBy;
	// skillion
	skillionBy: "slope" | "walls";
	skillionPitch: number;
	skillionAngle: number;
	highWallHeight: number | null;
	overhangLow: number | null;
	overhangHigh: number | null;
	// gambrel
	lowerPitch: number;
	lowerAngle: number;
	upperPitch: number;
	upperAngle: number;
	breakBy: "run" | "height";
	breakValue: number | null;
	gambrelOverhang: number | null;
	// saltbox
	frontPitch: number;
	frontAngle: number;
	rearPitch: number;
	rearAngle: number;
	ridgeBy: "offset" | "equal-walls";
	ridgeOffset: number | null;
	overhangFront: number | null;
	overhangRear: number | null;
}

const DEFAULTS: RoofShapesState = {
	mode: "skillion",
	span: 144,
	buildingLength: 240,
	section: "2x8",
	depth: 7.25,
	thickness: 1.5,
	seat: 3.5,
	wallThickness: 3.5,
	wallHeight: 96,
	ridgeThickness: 1.5,
	slopeBy: "pitch",
	skillionBy: "slope",
	skillionPitch: 3,
	skillionAngle: 14.04,
	highWallHeight: 132,
	overhangLow: 12,
	overhangHigh: 12,
	lowerPitch: 20,
	lowerAngle: 59.04,
	upperPitch: 7,
	upperAngle: 30.26,
	breakBy: "run",
	breakValue: 48,
	gambrelOverhang: 12,
	frontPitch: 12,
	frontAngle: 45,
	rearPitch: 6,
	rearAngle: 26.57,
	ridgeBy: "equal-walls",
	ridgeOffset: 48,
	overhangFront: 12,
	overhangRear: 12,
};

const SECTIONS: { value: Section; label: string }[] = [
	{ value: "2x6", label: "2x6" },
	{ value: "2x8", label: "2x8" },
	{ value: "2x10", label: "2x10" },
	{ value: "2x12", label: "2x12" },
	{ value: "custom", label: "Custom" },
];
const MODES: { value: Mode; label: string }[] = [
	{ value: "skillion", label: "Skillion" },
	{ value: "gambrel", label: "Gambrel" },
	{ value: "saltbox", label: "Saltbox" },
];

const num = (v: unknown, lo: number, hi: number, fallback: number | null): number | null => (typeof v === "number" && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : fallback);
const oneOf = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T => (allowed.includes(v as T) ? (v as T) : fallback);
const pitchOf = (v: unknown, fb: number) => num(v, 0.1, 100, fb) ?? fb;
const angleOf = (v: unknown, fb: number) => num(v, 0.1, 89.9, fb) ?? fb;

function sanitize(s: Partial<RoofShapesState>): RoofShapesState {
	const len = (v: unknown, fb: number | null, lo = 0, hi = 1e4) => num(v, lo, hi, fb);
	return {
		mode: oneOf(s.mode, ["skillion", "gambrel", "saltbox"] as const, DEFAULTS.mode),
		span: len(s.span, DEFAULTS.span, 12),
		buildingLength: len(s.buildingLength, DEFAULTS.buildingLength, 1),
		section: oneOf(s.section, ["2x6", "2x8", "2x10", "2x12", "custom"] as const, DEFAULTS.section),
		depth: len(s.depth, DEFAULTS.depth, 0.1, 100),
		thickness: len(s.thickness, DEFAULTS.thickness, 0.1, 100),
		seat: len(s.seat, DEFAULTS.seat, 0, 100),
		wallThickness: len(s.wallThickness, DEFAULTS.wallThickness, 0.1, 100),
		wallHeight: len(s.wallHeight, DEFAULTS.wallHeight, 1, 1000),
		ridgeThickness: len(s.ridgeThickness, DEFAULTS.ridgeThickness, 0, 100),
		slopeBy: oneOf(s.slopeBy, ["pitch", "angle"] as const, DEFAULTS.slopeBy),
		skillionBy: oneOf(s.skillionBy, ["slope", "walls"] as const, DEFAULTS.skillionBy),
		skillionPitch: pitchOf(s.skillionPitch, DEFAULTS.skillionPitch),
		skillionAngle: angleOf(s.skillionAngle, DEFAULTS.skillionAngle),
		highWallHeight: len(s.highWallHeight, DEFAULTS.highWallHeight, 1, 1000),
		overhangLow: len(s.overhangLow, DEFAULTS.overhangLow, 0, 1000),
		overhangHigh: len(s.overhangHigh, DEFAULTS.overhangHigh, 0, 1000),
		lowerPitch: pitchOf(s.lowerPitch, DEFAULTS.lowerPitch),
		lowerAngle: angleOf(s.lowerAngle, DEFAULTS.lowerAngle),
		upperPitch: pitchOf(s.upperPitch, DEFAULTS.upperPitch),
		upperAngle: angleOf(s.upperAngle, DEFAULTS.upperAngle),
		breakBy: oneOf(s.breakBy, ["run", "height"] as const, DEFAULTS.breakBy),
		breakValue: len(s.breakValue, DEFAULTS.breakValue, 0.1),
		gambrelOverhang: len(s.gambrelOverhang, DEFAULTS.gambrelOverhang, 0, 1000),
		frontPitch: pitchOf(s.frontPitch, DEFAULTS.frontPitch),
		frontAngle: angleOf(s.frontAngle, DEFAULTS.frontAngle),
		rearPitch: pitchOf(s.rearPitch, DEFAULTS.rearPitch),
		rearAngle: angleOf(s.rearAngle, DEFAULTS.rearAngle),
		ridgeBy: oneOf(s.ridgeBy, ["offset", "equal-walls"] as const, DEFAULTS.ridgeBy),
		ridgeOffset: len(s.ridgeOffset, DEFAULTS.ridgeOffset, -1e4),
		overhangFront: len(s.overhangFront, DEFAULTS.overhangFront, 0, 1000),
		overhangRear: len(s.overhangRear, DEFAULTS.overhangRear, 0, 1000),
	};
}

/** Bottom edge of a rafter whose heel sits on a plate at (`wallX`, `plateY`), rising toward +x (dir 1) or -x (dir -1). */
function rafterPiece(r: Rafter, wallX: number, plateY: number, dir: 1 | -1, fromRun: number, toRun: number): RafterPiece {
	const t = Math.tan((r.angle * Math.PI) / 180);
	const at = (run: number) => ({ x: wallX + dir * run, y: plateY - r.heel + run * t });
	return { a: at(fromRun), b: at(toRun), plumbDepth: r.plumbDepth };
}

export default function RoofShapes() {
	const { format, mode: unitMode } = useConstructionUnits();
	const [state, setState] = useState<RoofShapesState>(DEFAULTS);
	const set = <K extends keyof RoofShapesState>(key: K) => (value: RoofShapesState[K]) => setState((s) => ({ ...s, [key]: value }));
	const pickSection = (sec: Section) => {
		const size = sec === "custom" ? null : nominalToActual(sec);
		setState((s) => ({ ...s, section: sec, ...(size ? { depth: size.depth, thickness: size.width } : {}) }));
	};
	const byPitch = state.slopeBy === "pitch";
	const angleFrom = (pitch: number, angle: number) => (byPitch ? pitchToAngle(pitch) : angle);
	const switchSlopeBy = (v: SlopeBy) =>
		setState((s) => {
			const sync = (pitchKey: "skillionPitch" | "lowerPitch" | "upperPitch" | "frontPitch" | "rearPitch", angleKey: "skillionAngle" | "lowerAngle" | "upperAngle" | "frontAngle" | "rearAngle") =>
				v === "angle" ? { [angleKey]: Number(pitchToAngle(s[pitchKey]).toFixed(2)) } : { [pitchKey]: Number(angleToPitch(s[angleKey]).toFixed(3)) };
			return { ...s, slopeBy: v, ...sync("skillionPitch", "skillionAngle"), ...sync("lowerPitch", "lowerAngle"), ...sync("upperPitch", "upperAngle"), ...sync("frontPitch", "frontAngle"), ...sync("rearPitch", "rearAngle") };
		});

	const common = useMemo(
		() =>
			state.span === null || state.buildingLength === null || state.depth === null || state.thickness === null || state.seat === null || state.wallThickness === null || state.wallHeight === null || state.ridgeThickness === null
				? null
				: { span: state.span, buildingLength: state.buildingLength, depth: state.depth, thickness: state.thickness, seat: state.seat, wallThickness: state.wallThickness, wallHeight: state.wallHeight, ridgeThickness: state.ridgeThickness },
		[state.span, state.buildingLength, state.depth, state.thickness, state.seat, state.wallThickness, state.wallHeight, state.ridgeThickness],
	);

	const sk = useMemo<Skillion | null>(() => {
		if (!common || state.mode !== "skillion" || state.overhangLow === null || state.overhangHigh === null) return null;
		const angle = state.skillionBy === "walls" ? (state.highWallHeight === null ? null : skillionAngleFromWalls(common.span, common.wallHeight, state.highWallHeight)) : angleFrom(state.skillionPitch, state.skillionAngle);
		if (angle === null) return null;
		return skillion({ ...common, angle, overhangLow: state.overhangLow, overhangHigh: state.overhangHigh, lowWallHeight: common.wallHeight });
	}, [common, state.mode, state.skillionBy, state.highWallHeight, state.skillionPitch, state.skillionAngle, state.overhangLow, state.overhangHigh, byPitch]); // eslint-disable-line react-hooks/exhaustive-deps

	const ga = useMemo<Gambrel | null>(() => {
		if (!common || state.mode !== "gambrel" || state.breakValue === null || state.gambrelOverhang === null) return null;
		return gambrel({ ...common, lowerAngle: angleFrom(state.lowerPitch, state.lowerAngle), upperAngle: angleFrom(state.upperPitch, state.upperAngle), breakBy: state.breakBy, breakValue: state.breakValue, overhang: state.gambrelOverhang });
	}, [common, state.mode, state.lowerPitch, state.lowerAngle, state.upperPitch, state.upperAngle, state.breakBy, state.breakValue, state.gambrelOverhang, byPitch]); // eslint-disable-line react-hooks/exhaustive-deps

	const sb = useMemo<Saltbox | null>(() => {
		if (!common || state.mode !== "saltbox" || state.ridgeOffset === null || state.overhangFront === null || state.overhangRear === null) return null;
		return saltbox({ ...common, frontAngle: angleFrom(state.frontPitch, state.frontAngle), rearAngle: angleFrom(state.rearPitch, state.rearAngle), ridgeBy: state.ridgeBy, ridgeOffset: state.ridgeOffset, overhangFront: state.overhangFront, overhangRear: state.overhangRear, frontWallHeight: common.wallHeight });
	}, [common, state.mode, state.frontPitch, state.frontAngle, state.rearPitch, state.rearAngle, state.ridgeBy, state.ridgeOffset, state.overhangFront, state.overhangRear, byPitch]); // eslint-disable-line react-hooks/exhaustive-deps

	const cuts = (r: Rafter, prefix: string): ResultRow[] => [
		{ label: `${prefix} plumb cut`, value: `${formatAngle(r.plumbCutAngle, 2)} · ${format(r.plumbDepth)}`, hint: "saw miter from square · length of the cut" },
		{ label: `${prefix} seat cut`, value: `${formatAngle(r.seatCutAngle, 2)} · ${format(r.seat)}`, hint: `heel ${format(r.heel)}, HAP ${format(r.hap)}` },
	];
	const result = sk ?? ga ?? sb;
	const warnings = result?.warnings ?? [];

	let rows: ResultRow[] = [];
	let drawing: RoofSectionDiagramProps | null = null;
	let title = "";
	if (sk && common && state.overhangLow !== null && state.overhangHigh !== null) {
		const r = sk.rafter;
		title = `Skillion, ${format(common.span)} span at ${formatPitch(r.pitch)} (${formatAngle(r.angle, 2)})`;
		rows = [
			{ label: "Roof angle", value: formatAngle(r.angle, 2), hint: `${formatPitch(r.pitch)} pitch`, strong: true },
			{ label: "Rise", value: format(sk.rise), hint: "over the span, low wall to high wall" },
			{ label: "High wall height", value: format(sk.highWallHeight), hint: `low wall ${format(common.wallHeight)}, difference ${format(sk.rise)}` },
			{ label: "Line length", value: format(sk.lineLength), strong: true, hint: "wall to wall along the rafter" },
			{ label: "Tails", value: `${format(sk.tailLow)} · ${format(sk.tailHigh)}`, hint: "low end · high end, along the rafter" },
			{ label: "Overall length", value: format(sk.overallLength), strong: true },
			...cuts(r, "Rafter"),
			{ label: "Roof area", value: formatArea(sk.area, unitMode), hint: `over ${format(common.buildingLength)} of building` },
		];
		const piece = rafterPiece(r, 0, 0, 1, -state.overhangLow, common.span + state.overhangHigh);
		const top = (x: number) => piece.a.y + (x - piece.a.x) * Math.tan((r.angle * Math.PI) / 180) + r.plumbDepth;
		drawing = {
			label: `Skillion section: ${format(common.span)} span, ${formatAngle(r.angle, 2)}, rise ${format(sk.rise)}, rafter ${format(sk.overallLength)} overall`,
			rafters: [piece],
			walls: [
				{ x: 0, top: 0, thickness: common.wallThickness, height: common.wallHeight },
				{ x: common.span - common.wallThickness, top: sk.rise, thickness: common.wallThickness, height: sk.highWallHeight },
			],
			dims: [
				{ a: { x: 0, y: -common.wallHeight }, b: { x: common.span, y: -common.wallHeight }, label: `span ${format(common.span)}`, offset: 14 },
				{ a: { x: common.span, y: 0 }, b: { x: common.span, y: sk.rise }, label: `rise ${format(sk.rise)}`, offset: 12 },
				{ a: { x: 0, y: -common.wallHeight }, b: { x: 0, y: 0 }, label: format(common.wallHeight), offset: 10 },
				{ a: { x: common.span, y: -common.wallHeight }, b: { x: common.span, y: sk.rise }, label: format(sk.highWallHeight), offset: 30 },
				{ a: { x: 0, y: top(0) }, b: { x: common.span, y: top(common.span) }, label: `line ${format(sk.lineLength)}`, offset: -12, extensions: false },
				{ a: { x: -state.overhangLow, y: top(-state.overhangLow) }, b: { x: 0, y: top(0) }, label: format(sk.tailLow), offset: -10, extensions: false },
				{ a: { x: common.span, y: top(common.span) }, b: { x: common.span + state.overhangHigh, y: top(common.span + state.overhangHigh) }, label: format(sk.tailHigh), offset: -10, extensions: false },
			],
			arcs: [{ c: { x: 0, y: 0 }, startDeg: -r.angle, endDeg: 0, label: formatAngle(r.angle, 1) }],
		};
	} else if (ga && common && state.gambrelOverhang !== null) {
		title = `Gambrel, ${format(common.span)} span, ${formatAngle(ga.lower.angle, 1)} over ${formatAngle(ga.upper.angle, 1)}`;
		rows = [
			{ label: "Lower slope", value: formatAngle(ga.lower.angle, 2), hint: `${formatPitch(ga.lower.pitch)} pitch, run ${format(ga.breakRun)}, rise ${format(ga.lowerRise)}`, strong: true },
			{ label: "Upper slope", value: formatAngle(ga.upper.angle, 2), hint: `${formatPitch(ga.upper.pitch)} pitch, run ${format(ga.upperRun)}, rise ${format(ga.upperRise)}`, strong: true },
			{ label: "Lower rafter", value: format(ga.lower.overallLength), strong: true, hint: `${format(ga.lower.lineLength)} wall to break plus ${format(ga.lower.tailLength)} tail` },
			{ label: "Upper rafter", value: format(ga.upperLengthCut), strong: true, hint: `${format(ga.upper.lineLength)} break to ridge centre less ${format(ga.ridgeShortening)} for the ridge` },
			{ label: "Break height", value: format(ga.breakHeight), hint: "top of the roof at the break, above the plate" },
			{ label: "Ridge height", value: format(ga.ridgeHeight), hint: "top of the roof at the ridge, above the plate" },
			{ label: "Break angle", value: formatAngle(ga.breakAngle, 2), hint: `interior; butt joint miter ${formatAngle(ga.breakMiter, 2)} from square on each piece` },
			...cuts(ga.lower, "Lower"),
			{ label: "Upper plumb cut", value: `${formatAngle(ga.upper.plumbCutAngle, 2)} · ${format(ga.upper.plumbDepth)}`, hint: "at the ridge and at a purlin" },
			{ label: "Slope length", value: format(ga.slopeLength), hint: "eave to ridge along the surface, per side" },
			{ label: "Roof area", value: formatArea(ga.area, unitMode), hint: `both sides over ${format(common.buildingLength)}` },
		];
		const S = common.span;
		const lowerL = rafterPiece(ga.lower, 0, 0, 1, -state.gambrelOverhang, ga.breakRun);
		const lowerR = rafterPiece(ga.lower, S, 0, -1, -state.gambrelOverhang, ga.breakRun);
		const breakTop = ga.breakHeight;
		const tu = Math.tan((ga.upper.angle * Math.PI) / 180);
		const upperL: RafterPiece = { a: { x: ga.breakRun, y: breakTop - ga.upper.plumbDepth }, b: { x: S / 2, y: breakTop - ga.upper.plumbDepth + ga.upperRun * tu }, plumbDepth: ga.upper.plumbDepth };
		const upperR: RafterPiece = { a: { x: S - ga.breakRun, y: upperL.a.y }, b: { x: S / 2, y: upperL.b.y }, plumbDepth: ga.upper.plumbDepth };
		const wallH = Math.min(common.wallHeight, 48);
		drawing = {
			label: `Gambrel section: ${format(S)} span, break ${format(ga.breakRun)} in at ${format(ga.breakHeight)} high, ridge ${format(ga.ridgeHeight)}`,
			rafters: [lowerL, upperL, lowerR, upperR],
			walls: [
				{ x: 0, top: 0, thickness: common.wallThickness, height: wallH },
				{ x: S - common.wallThickness, top: 0, thickness: common.wallThickness, height: wallH },
			],
			centreLines: [{ x: S / 2, from: 0, to: ga.ridgeHeight + 4 }],
			dims: [
				{ a: { x: 0, y: -wallH }, b: { x: S, y: -wallH }, label: `span ${format(S)}`, offset: 14 },
				{ a: { x: 0, y: 0 }, b: { x: ga.breakRun, y: 0 }, label: format(ga.breakRun), offset: 28, extensions: false },
				{ a: { x: ga.breakRun, y: 0 }, b: { x: ga.breakRun, y: ga.breakHeight }, label: format(ga.breakHeight), offset: 10, extensions: false },
				{ a: { x: S / 2, y: 0 }, b: { x: S / 2, y: ga.ridgeHeight }, label: format(ga.ridgeHeight), offset: 10, extensions: false },
				{ a: { x: lowerL.a.x, y: lowerL.a.y + ga.lower.plumbDepth }, b: { x: lowerL.b.x, y: lowerL.b.y + ga.lower.plumbDepth }, label: format(ga.lower.overallLength), offset: -12, extensions: false },
				{ a: { x: upperL.a.x, y: upperL.a.y + ga.upper.plumbDepth }, b: { x: upperL.b.x, y: upperL.b.y + ga.upper.plumbDepth }, label: format(ga.upper.lineLength), offset: -12, extensions: false },
			],
			arcs: [
				{ c: { x: 0, y: 0 }, startDeg: -ga.lower.angle, endDeg: 0, label: formatAngle(ga.lower.angle, 1) },
				{ c: { x: ga.breakRun, y: breakTop - ga.upper.plumbDepth }, startDeg: -ga.upper.angle, endDeg: 0, label: formatAngle(ga.upper.angle, 1) },
			],
		};
	} else if (sb && common && state.overhangFront !== null && state.overhangRear !== null) {
		title = `Saltbox, ${format(common.span)} span, ${formatPitch(sb.front.pitch)} front and ${formatPitch(sb.rear.pitch)} rear`;
		rows = [
			{ label: "Front slope", value: formatAngle(sb.front.angle, 2), hint: `${formatPitch(sb.front.pitch)} pitch, run ${format(sb.frontRun)}, rise ${format(sb.front.rise)}`, strong: true },
			{ label: "Rear slope", value: formatAngle(sb.rear.angle, 2), hint: `${formatPitch(sb.rear.pitch)} pitch, run ${format(sb.rearRun)}, rise ${format(sb.rear.rise)}`, strong: true },
			{ label: "Ridge offset", value: format(Math.abs(sb.ridgeOffset)), hint: sb.ridgeOffset >= 0 ? "from the centre toward the front wall" : "from the centre toward the rear wall" },
			{ label: "Ridge height", value: format(sb.ridgeHeight), hint: "top of the roof above the front plate" },
			{ label: "Rear wall", value: format(sb.rearWallHeight), hint: Math.abs(sb.rearWallDelta) < 0.01 ? "same height as the front wall" : sb.rearWallDelta > 0 ? `${format(sb.rearWallDelta)} higher than the front wall` : `${format(-sb.rearWallDelta)} lower than the front wall` },
			{ label: "Front rafter", value: format(sb.front.overallLength - sb.ridgeShorteningFront), strong: true, hint: `${format(sb.front.lineLength)} line, ${format(sb.front.tailLength)} tail, less ${format(sb.ridgeShorteningFront)} at the ridge` },
			{ label: "Rear rafter", value: format(sb.rear.overallLength - sb.ridgeShorteningRear), strong: true, hint: `${format(sb.rear.lineLength)} line, ${format(sb.rear.tailLength)} tail, less ${format(sb.ridgeShorteningRear)} at the ridge` },
			...cuts(sb.front, "Front"),
			...cuts(sb.rear, "Rear"),
			{ label: "Roof area", value: formatArea(sb.area, unitMode), hint: `both sides over ${format(common.buildingLength)}` },
		];
		const S = common.span;
		const front = rafterPiece(sb.front, 0, 0, 1, -state.overhangFront, sb.frontRun);
		const rear = rafterPiece(sb.rear, S, sb.rearWallDelta, -1, -state.overhangRear, sb.rearRun);
		const ridgeX = sb.frontRun;
		drawing = {
			label: `Saltbox section: ${format(S)} span, ridge ${format(Math.abs(sb.ridgeOffset))} off centre, ${format(sb.ridgeHeight)} above the front plate, rear wall ${format(sb.rearWallHeight)}`,
			rafters: [front, rear],
			walls: [
				{ x: 0, top: 0, thickness: common.wallThickness, height: common.wallHeight },
				{ x: S - common.wallThickness, top: sb.rearWallDelta, thickness: common.wallThickness, height: Math.max(sb.rearWallHeight, 1) },
			],
			centreLines: [
				{ x: S / 2, from: -common.wallHeight, to: sb.ridgeHeight + 4 },
				{ x: ridgeX, from: 0, to: sb.ridgeHeight + 4 },
			],
			dims: [
				{ a: { x: 0, y: -common.wallHeight }, b: { x: S, y: -common.wallHeight }, label: `span ${format(S)}`, offset: 14 },
				{ a: { x: 0, y: 0 }, b: { x: ridgeX, y: 0 }, label: `front run ${format(sb.frontRun)}`, offset: 28, extensions: false },
				{ a: { x: ridgeX, y: 0 }, b: { x: S, y: 0 }, label: `rear run ${format(sb.rearRun)}`, offset: 28, extensions: false },
				{ a: { x: ridgeX, y: 0 }, b: { x: ridgeX, y: sb.ridgeHeight }, label: format(sb.ridgeHeight), offset: 10, extensions: false },
				{ a: { x: 0, y: -common.wallHeight }, b: { x: 0, y: 0 }, label: format(common.wallHeight), offset: 10 },
				{ a: { x: S, y: -common.wallHeight }, b: { x: S, y: sb.rearWallDelta }, label: format(sb.rearWallHeight), offset: 24 },
				{ a: { x: front.a.x, y: front.a.y + sb.front.plumbDepth }, b: { x: front.b.x, y: front.b.y + sb.front.plumbDepth }, label: format(sb.front.overallLength), offset: -12, extensions: false },
				{ a: { x: rear.b.x, y: rear.b.y + sb.rear.plumbDepth }, b: { x: rear.a.x, y: rear.a.y + sb.rear.plumbDepth }, label: format(sb.rear.overallLength), offset: -12, extensions: false },
			],
			arcs: [
				{ c: { x: 0, y: 0 }, startDeg: -sb.front.angle, endDeg: 0, label: formatAngle(sb.front.angle, 1) },
				{ c: { x: S, y: sb.rearWallDelta }, startDeg: 180, endDeg: 180 + sb.rear.angle, label: formatAngle(sb.rear.angle, 1) },
			],
		};
	}

	const slopeField = (id: string, label: string, pitchKey: keyof RoofShapesState, angleKey: keyof RoofShapesState) =>
		byPitch ? (
			<NumberField id={id} label={label} value={state[pitchKey] as number} onChange={(v) => set(pitchKey)(v as never)} unit=":12" step="any" />
		) : (
			<NumberField id={id} label={label} value={state[angleKey] as number} onChange={(v) => set(angleKey)(v as never)} unit="°" min={0.1} max={89.9} step="any" />
		);

	return (
		<div className={styles.container}>
			<div className="flex flex-col gap-6">
				<UnitAndPrecisionBar />

				<div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
					<section className={styles.card} aria-labelledby="rs-heading">
						<h2 id="rs-heading" className={styles.cardTitle}>
							Roof shape
						</h2>
						<SegmentedControl<Mode> label="Roof shape" size="sm" value={state.mode} onChange={set("mode")} options={MODES} />
						<p className={`${styles.note} mt-3`}>
							{state.mode === "skillion" && "One slope from a low wall to a high wall, as on a shed, lean-to or mono-pitch addition."}
							{state.mode === "gambrel" && "Two slopes a side: steep from the eave to a break, then flatter to the ridge, as on a barn."}
							{state.mode === "saltbox" && "A ridge off centre with a different pitch each side, so the rear wall ends up a different height."}
							{" Cutting templates for any of the rafters are in the "}
							<Link href="/tools/rafter-calculator">common rafter calculator</Link>.
						</p>
						<div className="flex flex-col gap-4">
							<div className="grid grid-cols-2 gap-3">
								<DimensionInput id="rs-span" label="Span" value={state.span} onChange={set("span")} hint="Outside of wall to outside of wall" />
								<DimensionInput id="rs-length" label="Building length" value={state.buildingLength} onChange={set("buildingLength")} hint="For areas" />
							</div>
							<div className="flex flex-col gap-1">
								<span className={styles.label}>Slopes as</span>
								<SegmentedControl<SlopeBy>
									label="Slopes as"
									size="sm"
									fill={false}
									value={state.slopeBy}
									onChange={switchSlopeBy}
									options={[
										{ value: "pitch", label: "Pitch x:12" },
										{ value: "angle", label: "Angle" },
									]}
								/>
							</div>

							{state.mode === "skillion" && (
								<>
									<div className="flex flex-col gap-1">
										<span className={styles.label}>Slope from</span>
										<SegmentedControl<"slope" | "walls">
											label="Slope from"
											size="sm"
											fill={false}
											value={state.skillionBy}
											onChange={(v) => setState((s) => ({ ...s, skillionBy: v, ...(sk && v === "walls" ? { highWallHeight: Number(sk.highWallHeight.toFixed(4)) } : {}), ...(sk && v === "slope" ? { skillionAngle: Number(sk.rafter.angle.toFixed(2)), skillionPitch: Number(sk.rafter.pitch.toFixed(3)) } : {}) }))}
											options={[
												{ value: "slope", label: byPitch ? "Pitch" : "Angle" },
												{ value: "walls", label: "Wall heights" },
											]}
										/>
									</div>
									<div className="grid grid-cols-2 gap-3">
										{state.skillionBy === "slope" ? slopeField("rs-sk-slope", byPitch ? "Pitch" : "Angle", "skillionPitch", "skillionAngle") : <DimensionInput id="rs-high" label="High wall height" value={state.highWallHeight} onChange={set("highWallHeight")} hint="Plate top above the floor" />}
										<DimensionInput id="rs-wall" label="Low wall height" value={state.wallHeight} onChange={set("wallHeight")} hint="Plate top above the floor" />
									</div>
									<div className="grid grid-cols-2 gap-3">
										<DimensionInput id="rs-oh-low" label="Overhang, low end" value={state.overhangLow} onChange={set("overhangLow")} hint="Level" />
										<DimensionInput id="rs-oh-high" label="Overhang, high end" value={state.overhangHigh} onChange={set("overhangHigh")} hint="Level" />
									</div>
								</>
							)}

							{state.mode === "gambrel" && (
								<>
									<div className="grid grid-cols-2 gap-3">
										{slopeField("rs-lower", byPitch ? "Lower pitch" : "Lower angle", "lowerPitch", "lowerAngle")}
										{slopeField("rs-upper", byPitch ? "Upper pitch" : "Upper angle", "upperPitch", "upperAngle")}
									</div>
									<div className="flex flex-wrap items-end gap-x-6 gap-y-3">
										<div className="flex flex-col gap-1">
											<span className={styles.label}>Break at</span>
											<SegmentedControl<"run" | "height">
												label="Break at"
												size="sm"
												fill={false}
												value={state.breakBy}
												onChange={(v) => setState((s) => ({ ...s, breakBy: v, breakValue: ga ? Number((v === "run" ? ga.breakRun : ga.lowerRise).toFixed(4)) : s.breakValue }))}
												options={[
													{ value: "run", label: "Run in from wall" },
													{ value: "height", label: "Rise above plate" },
												]}
											/>
										</div>
										<DimensionInput id="rs-break" label={state.breakBy === "run" ? "Break run" : "Break rise"} value={state.breakValue} onChange={set("breakValue")} className="w-44" hint={state.breakBy === "run" ? "Level, outer wall to the break" : "On the measuring line"} />
									</div>
									<div className="grid grid-cols-2 gap-3">
										<DimensionInput id="rs-ga-oh" label="Overhang" value={state.gambrelOverhang} onChange={set("gambrelOverhang")} hint="Level, both eaves" />
										<DimensionInput id="rs-wall" label="Wall height" value={state.wallHeight} onChange={set("wallHeight")} hint="Drawing only" />
									</div>
								</>
							)}

							{state.mode === "saltbox" && (
								<>
									<div className="grid grid-cols-2 gap-3">
										{slopeField("rs-front", byPitch ? "Front pitch" : "Front angle", "frontPitch", "frontAngle")}
										{slopeField("rs-rear", byPitch ? "Rear pitch" : "Rear angle", "rearPitch", "rearAngle")}
									</div>
									<div className="flex flex-wrap items-end gap-x-6 gap-y-3">
										<div className="flex flex-col gap-1">
											<span className={styles.label}>Ridge placed by</span>
											<SegmentedControl<"offset" | "equal-walls">
												label="Ridge placed by"
												size="sm"
												fill={false}
												value={state.ridgeBy}
												onChange={(v) => setState((s) => ({ ...s, ridgeBy: v, ridgeOffset: sb && v === "offset" ? Number(sb.ridgeOffset.toFixed(4)) : s.ridgeOffset }))}
												options={[
													{ value: "equal-walls", label: "Equal walls" },
													{ value: "offset", label: "Offset" },
												]}
											/>
										</div>
										{state.ridgeBy === "offset" && <DimensionInput id="rs-offset" label="Ridge offset" value={state.ridgeOffset} onChange={set("ridgeOffset")} min={-1e4} className="w-44" hint="From the centre toward the front; negative for rear" />}
									</div>
									<div className="grid grid-cols-3 gap-3">
										<DimensionInput id="rs-oh-f" label="Front overhang" value={state.overhangFront} onChange={set("overhangFront")} />
										<DimensionInput id="rs-oh-r" label="Rear overhang" value={state.overhangRear} onChange={set("overhangRear")} />
										<DimensionInput id="rs-wall" label="Front wall height" value={state.wallHeight} onChange={set("wallHeight")} />
									</div>
								</>
							)}

							<div className="flex flex-col gap-1">
								<span className={styles.label}>Rafter</span>
								<SegmentedControl<Section> label="Rafter size" size="sm" value={state.section} onChange={pickSection} options={SECTIONS} />
							</div>
							<div className="grid grid-cols-3 gap-3">
								<DimensionInput id="rs-depth" label="Depth" value={state.depth} onChange={(v) => setState((s) => ({ ...s, depth: v, section: "custom" }))} hint="Actual" />
								<DimensionInput id="rs-thick" label="Thickness" value={state.thickness} onChange={(v) => setState((s) => ({ ...s, thickness: v, section: "custom" }))} hint="Actual" />
								<DimensionInput id="rs-seat" label="Birdsmouth seat" value={state.seat} onChange={set("seat")} />
							</div>
							<div className="grid grid-cols-2 gap-3">
								<DimensionInput id="rs-wall-t" label="Wall thickness" value={state.wallThickness} onChange={set("wallThickness")} />
								{state.mode !== "skillion" && <DimensionInput id="rs-ridge" label="Ridge thickness" value={state.ridgeThickness} onChange={set("ridgeThickness")} />}
							</div>
						</div>
					</section>

					<section className={styles.card} aria-labelledby="rs-results">
						<h2 id="rs-results" className={styles.cardTitle}>
							Lengths and cuts
						</h2>
						{result ? <ResultList rows={rows} /> : <p className={styles.empty}>Enter the span, the slopes and the rafter size. A gambrel break must fall before the centre; a saltbox ridge must fall between the walls.</p>}
						{warnings.map((w) => (
							<p key={w} className={styles.warn}>
								{w}
							</p>
						))}
						{ga && <p className={styles.note}>The upper rafter sits on the lower rafter&apos;s top edge at the break, as on a purlin or knee wall. Lower rafter length is to the break on its top edge; shorten it for a butt joint using the break miter.</p>}
						{sb && <p className={styles.note}>Both rafters meet on their top edges at the ridge. With unequal pitches the rear plate lands a little above or below the front plate even when the rises match, because the two heights above plate differ.</p>}
					</section>
				</div>

				{drawing && (
					<section className={styles.card} aria-labelledby="rs-diagram">
						<h2 id="rs-diagram" className={styles.cardTitle}>
							Cross section
						</h2>
						<PrintDiagrams title={title} subtitle="Drawn to fit">
							<RoofSectionDiagram {...drawing} />
						</PrintDiagrams>
					</section>
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
