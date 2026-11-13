"use client";

import { useMemo, useState } from "react";
import {
	UnitAndPrecisionBar,
	DimensionInput,
	RunningList,
	LumberTable,
	PrintDiagrams,
	ShareCalculation,
	Diagram,
	Member,
	DimLine,
	AngleArc,
	Label,
} from "@/components/construction";
import { useConstructionUnits } from "@/hooks/useConstructionUnits";
import { computeSpacing, runningPositions, type MarkReference } from "@/lib/construction/spacingUtils";
import { solveSlope } from "@/lib/construction/pitchUtils";
import { inchesToMm } from "@/lib/construction/imperialUtils";
import diagramStyles from "@/components/construction/Diagram.module.scss";

interface DemoState {
	length: number | null;
	width: number | null;
	centers: number | null;
	run: number | null;
	pitch: number;
}

const DEFAULTS: DemoState = { length: 96, width: 1.5, centers: 16, run: 60, pitch: 6 };

/** Styleguide page exercising every construction primitive. Not a tool; tools arrive in their own tickets. */
export default function ConstructionDemo() {
	const { format } = useConstructionUnits();
	const [state, setState] = useState<DemoState>(DEFAULTS);
	const [reference, setReference] = useState<MarkReference>("near");
	const set = <K extends keyof DemoState>(key: K) => (value: DemoState[K]) => setState((s) => ({ ...s, [key]: value }));

	const spacing = useMemo(
		() =>
			state.length && state.width && state.centers
				? computeSpacing({ mode: "exact", totalLength: state.length, memberWidth: state.width, endMembers: "both", centers: state.centers, adjust: "both" })
				: null,
		[state.length, state.width, state.centers],
	);
	const slope = useMemo(() => (state.run ? solveSlope(state.run, { pitch: state.pitch }) : null), [state.run, state.pitch]);

	// Slope triangle drawn at 1:10 so a 60" run becomes a 152 mm wide drawing.
	const scale = 0.1;
	const pad = 18;
	const runMm = slope ? inchesToMm(slope.run) * scale : 0;
	const riseMm = slope ? inchesToMm(slope.rise) * scale : 0;
	const w = runMm + pad * 2;
	const h = riseMm + pad * 2;

	return (
		<div className="flex flex-col gap-6">
			<UnitAndPrecisionBar />

			<section className="grid gap-4 md:grid-cols-3">
				<DimensionInput id="demo-length" label="Total length" value={state.length} onChange={set("length")} min={12} max={480} step={1} />
				<DimensionInput id="demo-width" label="Member width" value={state.width} onChange={set("width")} hint="Actual size, not nominal" />
				<DimensionInput id="demo-centers" label="Centers" value={state.centers} onChange={set("centers")} />
			</section>

			{spacing && (
				<RunningList
					title="Running measurements"
					positions={runningPositions(spacing, reference)}
					reference={reference}
					onReferenceChange={setReference}
					labelFor={(i) => `Member ${i + 1}`}
				/>
			)}

			<section className="grid gap-4 md:grid-cols-2">
				<DimensionInput id="demo-run" label="Run" value={state.run} onChange={set("run")} min={12} max={240} step={1} />
				<label className="flex flex-col gap-1 text-sm">
					<span className="font-semibold">Pitch (rise per 12)</span>
					<input
						type="number"
						min={0}
						max={24}
						step={0.5}
						value={state.pitch}
						onChange={(e) => set("pitch")(Number(e.target.value))}
						className="px-3 py-2 bg-transparent border"
					/>
				</label>
			</section>

			{slope && (
				<PrintDiagrams title="Slope triangle" subtitle={`Run ${format(slope.run)}, rise ${format(slope.rise)}, ${slope.angle.toFixed(2)}° (drawn at 1:10)`}>
					<Diagram widthMm={w} heightMm={h} label={`Right triangle with run ${format(slope.run)} and rise ${format(slope.rise)}`} maxWidth="640px">
						<Member x={pad} y={pad + riseMm - 2} width={runMm} height={2} role="wall" />
						<path d={`M ${pad} ${pad + riseMm} L ${pad + runMm} ${pad + riseMm} L ${pad + runMm} ${pad} Z`} className={diagramStyles.outline} />
						<DimLine x1={pad} y1={pad + riseMm} x2={pad + runMm} y2={pad + riseMm} label={`Run ${format(slope.run)}`} offset={8} />
						<DimLine x1={pad + runMm} y1={pad + riseMm} x2={pad + runMm} y2={pad} label={`Rise ${format(slope.rise)}`} offset={-8} />
						<DimLine x1={pad} y1={pad + riseMm} x2={pad + runMm} y2={pad} label={`Slope ${format(slope.length)}`} offset={-6} extensions={false} />
						<AngleArc cx={pad} cy={pad + riseMm} radius={14} startDeg={-slope.angle} endDeg={0} label={`${slope.angle.toFixed(1)}°`} />
						<Label x={pad + runMm - 3} y={pad + riseMm - 3} text="90°" anchor="end" size={11} />
					</Diagram>
				</PrintDiagrams>
			)}

			<section className="grid gap-4 md:grid-cols-2">
				<LumberTable />
				<div className="flex flex-col gap-3">
					<ShareCalculation state={state} onLoad={(s) => setState({ ...DEFAULTS, ...s })} />
					<p className="text-xs opacity-70">
						Every length above is stored in inches and only formatted in the chosen units. Change the units or precision and the fields, list and
						drawing follow.
					</p>
				</div>
			</section>
		</div>
	);
}
