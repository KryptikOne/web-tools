"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { DndContext, useDraggable, DragEndEvent, DragMoveEvent, useSensor, useSensors, PointerSensor } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { ClipboardDocumentIcon, CheckIcon, PlusIcon, TrashIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { ColorUtils } from "@/lib/colorUtils";
import { ColorPickerPanel } from "@/components/ColorPickerPanel";
import styles from "./GradientGenerator.module.scss";

interface ColorStop {
	id: number;
	color: string;
	position: number;
}

type GradientType = "linear" | "radial";
type RadialShape = "circle" | "ellipse";

const PRESET_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];

const DEFAULT_COLOR_STOPS: ColorStop[] = [
	{ id: 1, color: "#b5fe67", position: 0 },
	{ id: 2, color: "#00ccad", position: 100 },
];

const PRESET_GRADIENTS = [
	{
		name: "Sunset",
		stops: [
			{ id: 1, color: "#ff6b6b", position: 0 },
			{ id: 2, color: "#feca57", position: 50 },
			{ id: 3, color: "#ff9ff3", position: 100 },
		],
	},
	{
		name: "Ocean",
		stops: [
			{ id: 1, color: "#667eea", position: 0 },
			{ id: 2, color: "#764ba2", position: 100 },
		],
	},
	{
		name: "Forest",
		stops: [
			{ id: 1, color: "#11998e", position: 0 },
			{ id: 2, color: "#38ef7d", position: 100 },
		],
	},
	{
		name: "Fire",
		stops: [
			{ id: 1, color: "#f12711", position: 0 },
			{ id: 2, color: "#f5af19", position: 100 },
		],
	},
	{
		name: "Purple Haze",
		stops: [
			{ id: 1, color: "#7f00ff", position: 0 },
			{ id: 2, color: "#e100ff", position: 100 },
		],
	},
	{
		name: "Cool Blues",
		stops: [
			{ id: 1, color: "#2193b0", position: 0 },
			{ id: 2, color: "#6dd5ed", position: 100 },
		],
	},
	{
		name: "Rainbow",
		stops: [
			{ id: 1, color: "#ff0000", position: 0 },
			{ id: 2, color: "#ff8000", position: 17 },
			{ id: 3, color: "#ffff00", position: 33 },
			{ id: 4, color: "#00ff00", position: 50 },
			{ id: 5, color: "#0080ff", position: 67 },
			{ id: 6, color: "#8000ff", position: 83 },
			{ id: 7, color: "#ff00ff", position: 100 },
		],
	},
	{
		name: "Midnight",
		stops: [
			{ id: 1, color: "#232526", position: 0 },
			{ id: 2, color: "#414345", position: 100 },
		],
	},
];

// Default fallback color for invalid hex parsing
const FALLBACK_RGB: [number, number, number] = [255, 0, 0];

// Draggable Color Stop Handle Component
interface DraggableStopProps {
	stop: ColorStop;
	isSelected: boolean;
	onSelect: () => void;
	isDraggingOutside: boolean;
	canDelete: boolean;
}

function DraggableStop({ stop, isSelected, onSelect, isDraggingOutside, canDelete }: DraggableStopProps) {
	const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
		id: stop.id.toString(),
		data: { stop },
	});

	const style = {
		left: `${stop.position}%`,
		transform: transform ? CSS.Translate.toString(transform) : undefined,
		opacity: isDragging && isDraggingOutside && canDelete ? 0.4 : 1,
	};

	return (
		<div
			ref={setNodeRef}
			className={`${styles.stopHandle} ${isSelected ? styles.selected : ""} ${isDragging ? styles.dragging : ""}`}
			style={style}
			onClick={(e) => {
				e.stopPropagation();
				onSelect();
			}}
			{...listeners}
			{...attributes}
		>
			<div className={styles.stopColor} style={{ backgroundColor: stop.color }} />
			<div className={styles.stopArrow} />
			{isDragging && isDraggingOutside && canDelete && <div className={styles.deleteIndicator}>×</div>}
		</div>
	);
}

export default function GradientGenerator() {
	const [gradientType, setGradientType] = useState<GradientType>("linear");
	const [angle, setAngle] = useState(135);
	const [radialShape, setRadialShape] = useState<RadialShape>("circle");
	const [colorStops, setColorStops] = useState<ColorStop[]>(DEFAULT_COLOR_STOPS);
	const [copiedFormat, setCopiedFormat] = useState<string | null>(null);
	const [nextId, setNextId] = useState(3);
	const [selectedStopId, setSelectedStopId] = useState<number | null>(1); // Default to first stop
	const [dragOutsideId, setDragOutsideId] = useState<number | null>(null);

	const sliderRef = useRef<HTMLDivElement>(null);

	// Configure pointer sensor with activation constraint
	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				distance: 3,
			},
		}),
	);

	// Generate CSS gradient string
	const gradientCSS = useMemo(() => {
		const sortedStops = [...colorStops].sort((a, b) => a.position - b.position);
		const stopsStr = sortedStops.map((stop) => `${stop.color} ${stop.position}%`).join(", ");

		if (gradientType === "linear") {
			return `linear-gradient(${angle}deg, ${stopsStr})`;
		} else {
			return `radial-gradient(${radialShape}, ${stopsStr})`;
		}
	}, [gradientType, angle, radialShape, colorStops]);

	// Full CSS property
	const fullCSS = useMemo(() => {
		return `background: ${gradientCSS};`;
	}, [gradientCSS]);

	// Copy to clipboard
	const copyToClipboard = async (text: string, format: string) => {
		try {
			await navigator.clipboard.writeText(text);
			setCopiedFormat(format);
			setTimeout(() => setCopiedFormat(null), 2000);
		} catch (err) {
			console.error("Failed to copy:", err);
		}
	};

	// Add color stop at position
	const addColorStopAtPosition = useCallback(
		(position: number) => {
			if (colorStops.length >= 8) return;

			// Interpolate color at this position
			const sortedStops = [...colorStops].sort((a, b) => a.position - b.position);
			let leftStop = sortedStops[0];
			let rightStop = sortedStops[sortedStops.length - 1];

			for (let i = 0; i < sortedStops.length - 1; i++) {
				if (sortedStops[i].position <= position && sortedStops[i + 1].position >= position) {
					leftStop = sortedStops[i];
					rightStop = sortedStops[i + 1];
					break;
				}
			}

			// Simple color interpolation
			const t = rightStop.position === leftStop.position ? 0 : (position - leftStop.position) / (rightStop.position - leftStop.position);

			const leftRgb = ColorUtils.hexToRgb(leftStop.color, FALLBACK_RGB);
			const rightRgb = ColorUtils.hexToRgb(rightStop.color, FALLBACK_RGB);

			const r = Math.round(leftRgb[0] + (rightRgb[0] - leftRgb[0]) * t);
			const g = Math.round(leftRgb[1] + (rightRgb[1] - leftRgb[1]) * t);
			const b = Math.round(leftRgb[2] + (rightRgb[2] - leftRgb[2]) * t);

			const newStop: ColorStop = {
				id: nextId,
				color: ColorUtils.rgbToHex(r, g, b),
				position: Math.round(position),
			};

			setColorStops([...colorStops, newStop]);
			setNextId(nextId + 1);
			setSelectedStopId(newStop.id);
		},
		[colorStops, nextId],
	);

	// Handle click on slider track to add stop
	const handleSliderClick = useCallback(
		(e: React.MouseEvent<HTMLDivElement>) => {
			if (!sliderRef.current) return;

			// Don't add if clicking on a handle
			if ((e.target as HTMLElement).closest(`.${styles.stopHandle}`)) return;

			const rect = sliderRef.current.getBoundingClientRect();
			const position = ((e.clientX - rect.left) / rect.width) * 100;
			addColorStopAtPosition(Math.max(0, Math.min(100, position)));
		},
		[addColorStopAtPosition],
	);

	// Handle drag move to detect if outside slider
	const handleDragMove = useCallback((event: DragMoveEvent) => {
		if (!sliderRef.current) return;

		const rect = sliderRef.current.getBoundingClientRect();
		const y = event.activatorEvent instanceof MouseEvent ? event.activatorEvent.clientY + (event.delta.y || 0) : 0;

		// Check if dragged outside vertically (threshold of 50px)
		const isOutside = y < rect.top - 50 || y > rect.bottom + 50;
		setDragOutsideId(isOutside ? parseInt(event.active.id as string) : null);
	}, []);

	// Handle drag end
	const handleDragEnd = useCallback(
		(event: DragEndEvent) => {
			const { active, delta } = event;
			const stopId = parseInt(active.id as string);

			// Check if should delete (dragged outside)
			if (dragOutsideId === stopId && colorStops.length > 2) {
				const newStops = colorStops.filter((s) => s.id !== stopId);
				setColorStops(newStops);
				if (selectedStopId === stopId) {
					setSelectedStopId(newStops[0]?.id ?? null);
				}
			} else if (sliderRef.current) {
				// Update position based on drag
				const rect = sliderRef.current.getBoundingClientRect();
				const deltaPercent = (delta.x / rect.width) * 100;

				setColorStops(
					colorStops.map((stop) => {
						if (stop.id === stopId) {
							const newPosition = Math.max(0, Math.min(100, stop.position + deltaPercent));
							return { ...stop, position: Math.round(newPosition) };
						}
						return stop;
					}),
				);
			}

			setDragOutsideId(null);
		},
		[colorStops, dragOutsideId, selectedStopId],
	);

	// Handle stop selection
	const handleStopSelect = useCallback((stop: ColorStop) => {
		setSelectedStopId(stop.id);
	}, []);

	// Update selected stop color
	const handleColorChange = useCallback(
		(newColor: string) => {
			if (!selectedStopId) return;
			setColorStops(colorStops.map((stop) => (stop.id === selectedStopId ? { ...stop, color: newColor } : stop)));
		},
		[colorStops, selectedStopId],
	);

	// Add a new color stop (button version)
	const addColorStop = useCallback(() => {
		if (colorStops.length >= 8) return;

		const sortedStops = [...colorStops].sort((a, b) => a.position - b.position);
		let newPosition = 50;

		let maxGap = 0;
		let gapStart = 0;
		for (let i = 0; i < sortedStops.length - 1; i++) {
			const gap = sortedStops[i + 1].position - sortedStops[i].position;
			if (gap > maxGap) {
				maxGap = gap;
				gapStart = sortedStops[i].position;
			}
		}
		newPosition = gapStart + maxGap / 2;

		addColorStopAtPosition(newPosition);
	}, [colorStops, addColorStopAtPosition]);

	// Remove a color stop
	const removeColorStop = useCallback(
		(id: number) => {
			if (colorStops.length <= 2) return;
			const newStops = colorStops.filter((stop) => stop.id !== id);
			setColorStops(newStops);
			if (selectedStopId === id) {
				// Select the first remaining stop
				setSelectedStopId(newStops[0]?.id ?? null);
			}
		},
		[colorStops, selectedStopId],
	);

	// Update a color stop
	const updateColorStop = useCallback(
		(id: number, updates: Partial<Omit<ColorStop, "id">>) => {
			setColorStops(colorStops.map((stop) => (stop.id === id ? { ...stop, ...updates } : stop)));
		},
		[colorStops],
	);

	// Distribute stops evenly
	const distributeEvenly = useCallback(() => {
		const sortedStops = [...colorStops].sort((a, b) => a.position - b.position);
		const count = sortedStops.length;
		const newStops = sortedStops.map((stop, index) => ({
			...stop,
			position: Math.round((index / (count - 1)) * 100),
		}));
		setColorStops(newStops);
	}, [colorStops]);

	// Reverse gradient
	const reverseGradient = useCallback(() => {
		const newStops = colorStops.map((stop) => ({
			...stop,
			position: 100 - stop.position,
		}));
		setColorStops(newStops);
	}, [colorStops]);

	// Load preset
	const loadPreset = useCallback(
		(preset: (typeof PRESET_GRADIENTS)[0]) => {
			const newStops = preset.stops.map((stop, index) => ({
				...stop,
				id: nextId + index,
			}));
			setColorStops(newStops);
			setNextId(nextId + preset.stops.length);
			setSelectedStopId(newStops[0]?.id ?? null);
		},
		[nextId],
	);

	// Generate random gradient
	const generateRandom = useCallback(() => {
		const numStops = Math.floor(Math.random() * 3) + 2;
		const newStops: ColorStop[] = [];

		for (let i = 0; i < numStops; i++) {
			newStops.push({
				id: nextId + i,
				color:
					"#" +
					Math.floor(Math.random() * 16777215)
						.toString(16)
						.padStart(6, "0"),
				position: Math.round((i / (numStops - 1)) * 100),
			});
		}

		setColorStops(newStops);
		setNextId(nextId + numStops);
		setAngle(PRESET_ANGLES[Math.floor(Math.random() * PRESET_ANGLES.length)]);
		setSelectedStopId(newStops[0]?.id ?? null);
	}, [nextId]);

	// Get selected stop
	const selectedStop = useMemo(() => colorStops.find((s) => s.id === selectedStopId), [colorStops, selectedStopId]);

	return (
		<div className={styles.container}>
			{/* Full-width Preview at Top */}
			<div className={styles.previewBox} style={{ background: gradientCSS }} />

			<div className={styles.grid}>
				{/* Left Column: Color Picker */}
				<div className={styles.previewSection}>
					{/* Gradient Type */}
					<div className={styles.glassCard}>
						<h3 className={styles.sectionTitle}>Gradient Type</h3>
						<div className={styles.typeToggle}>
							<Button onClick={() => setGradientType("linear")} className={`${styles.toggleBtn} ${gradientType === "linear" ? styles.active : ""}`}>
								Linear
							</Button>
							<Button onClick={() => setGradientType("radial")} className={`${styles.toggleBtn} ${gradientType === "radial" ? styles.active : ""}`}>
								Radial
							</Button>
						</div>

						{gradientType === "linear" && (
							<div className={styles.angleControl}>
								<div className={styles.sliderHeader}>
									<label className={styles.label}>Angle</label>
									<span className={styles.valueDisplay}>{angle}°</span>
								</div>
								<input type="range" min="0" max="360" value={angle} onChange={(e) => setAngle(parseInt(e.target.value))} className={styles.slider} />
								<div className={styles.presetAngles}>
									{PRESET_ANGLES.map((presetAngle) => (
										<Button key={presetAngle} onClick={() => setAngle(presetAngle)} className={`${styles.angleBtn} ${angle === presetAngle ? styles.active : ""}`}>
											{presetAngle}°
										</Button>
									))}
								</div>
							</div>
						)}

						{gradientType === "radial" && (
							<div className={styles.shapeControl}>
								<label className={styles.label}>Shape</label>
								<div className={styles.shapeToggle}>
									<Button onClick={() => setRadialShape("circle")} className={`${styles.toggleBtn} ${radialShape === "circle" ? styles.active : ""}`}>
										Circle
									</Button>
									<Button onClick={() => setRadialShape("ellipse")} className={`${styles.toggleBtn} ${radialShape === "ellipse" ? styles.active : ""}`}>
										Ellipse
									</Button>
								</div>
							</div>
						)}
					</div>

					{/* Color Picker Panel */}
					<div className={styles.glassCard}>
						<h3 className={styles.sectionTitle}>Color Picker</h3>
						{!selectedStop && <p className={styles.pickerHint}>Select a color stop to edit</p>}
						<ColorPickerPanel color={selectedStop?.color ?? "#ff6b6b"} onChange={handleColorChange} disabled={!selectedStop} />
					</div>
				</div>

				{/* Right Column: Controls */}
				<div className={styles.controlsSection}>
					{/* Color Stops */}
					<div className={styles.glassCard}>
						<div className={styles.colorStopsHeader}>
							<h3 className={styles.sectionTitle}>Color Stops</h3>
							<Button onClick={addColorStop} className={styles.addBtn} disabled={colorStops.length >= 8}>
								<PlusIcon className="w-4 h-4" />
								Add
							</Button>
						</div>

						{/* Interactive Gradient Slider */}
						<DndContext sensors={sensors} onDragMove={handleDragMove} onDragEnd={handleDragEnd}>
							<div className={styles.interactiveSlider} ref={sliderRef} onClick={handleSliderClick}>
								<div
									className={styles.sliderTrack}
									style={{
										background: `linear-gradient(to right, ${[...colorStops]
											.sort((a, b) => a.position - b.position)
											.map((s) => `${s.color} ${s.position}%`)
											.join(", ")})`,
									}}
								/>
								{colorStops.map((stop) => (
									<DraggableStop
										key={stop.id}
										stop={stop}
										isSelected={selectedStopId === stop.id}
										onSelect={() => handleStopSelect(stop)}
										isDraggingOutside={dragOutsideId === stop.id}
										canDelete={colorStops.length > 2}
									/>
								))}
							</div>
						</DndContext>

						<p className={styles.sliderHint}>Click to add • Drag to move • Drag outside to remove</p>

						{/* Action Buttons */}
						<div className={styles.buttonGroup}>
							<Button onClick={generateRandom} className={styles.btnSecondary}>
								<ArrowPathIcon className="w-4 h-4" />
								Random
							</Button>
							<Button onClick={reverseGradient} className={styles.btnSecondary}>
								Reverse
							</Button>
							<Button onClick={distributeEvenly} className={styles.btnSecondary}>
								Distribute
							</Button>
						</div>

						{/* Color Stops List */}
						<div className={styles.colorStopsList}>
							{[...colorStops]
								.sort((a, b) => a.position - b.position)
								.map((stop) => (
									<div key={stop.id} className={`${styles.colorStopItem} ${selectedStopId === stop.id ? styles.selected : ""}`} onClick={() => handleStopSelect(stop)}>
										<input
											type="color"
											value={stop.color}
											onChange={(e) => updateColorStop(stop.id, { color: e.target.value })}
											className={styles.colorInput}
											onClick={(e) => e.stopPropagation()}
										/>
										<input
											type="text"
											value={stop.color}
											onChange={(e) => updateColorStop(stop.id, { color: e.target.value })}
											className={styles.hexInput}
											maxLength={7}
											onClick={(e) => e.stopPropagation()}
										/>
										<div className={styles.positionInput}>
											<input
												type="number"
												min="0"
												max="100"
												value={stop.position}
												onChange={(e) => updateColorStop(stop.id, { position: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)) })}
												className={styles.numberInput}
												onClick={(e) => e.stopPropagation()}
											/>
											<span className={styles.percentSign}>%</span>
										</div>
										<Button
											onClick={(e) => {
												e.stopPropagation();
												removeColorStop(stop.id);
											}}
											className={styles.removeBtn}
											disabled={colorStops.length <= 2}
											title="Remove color stop"
										>
											<TrashIcon className="w-4 h-4" />
										</Button>
									</div>
								))}
						</div>
					</div>

					{/* CSS Output */}
					<div className={styles.glassCard}>
						<h3 className={styles.sectionTitle}>CSS Output</h3>
						<div className={styles.codeBlock}>
							<code>{fullCSS}</code>
							<button onClick={() => copyToClipboard(fullCSS, "css")} className={`${styles.copyBtn} ${copiedFormat === "css" ? styles.copied : ""}`} title="Copy to clipboard">
								{copiedFormat === "css" ? <CheckIcon className={styles.copyIcon} /> : <ClipboardDocumentIcon className={styles.copyIcon} />}
							</button>
						</div>
					</div>
				</div>
			</div>

			{/* Presets Section */}
			<div className={styles.glassCard} style={{ marginTop: "1.5rem" }}>
				<h3 className={styles.sectionTitle}>Presets</h3>
				<div className={styles.presetsGrid}>
					{PRESET_GRADIENTS.map((preset) => (
						<button
							key={preset.name}
							onClick={() => loadPreset(preset)}
							className={styles.presetBtn}
							style={{
								background: `linear-gradient(135deg, ${preset.stops.map((s) => `${s.color} ${s.position}%`).join(", ")})`,
							}}
							title={preset.name}
						>
							<span className={styles.presetName}>{preset.name}</span>
						</button>
					))}
				</div>
			</div>

			{/* Info Section */}
			{/* <div className={styles.glassCard} style={{ marginTop: "1.5rem" }}>
				<h3 className={styles.infoTitle}>About CSS Gradients</h3>
				<div className={styles.infoGrid}>
					<div>
						<h4 className={styles.infoSubtitle}>Linear Gradient</h4>
						<p className={styles.infoText}>Colors change along a straight line. Use the angle control to set the direction (0° is bottom to top, 90° is left to right).</p>
					</div>
					<div>
						<h4 className={styles.infoSubtitle}>Radial Gradient</h4>
						<p className={styles.infoText}>Colors spread outward from the center. Choose between circular or elliptical shapes for different effects.</p>
					</div>
				</div>
				<div className={styles.noteBox}>
					<p>
						<strong>Tip:</strong> Click on the gradient slider to add color stops. Drag stops to reposition them, or drag outside the slider to remove them.
					</p>
				</div>
			</div> */}
		</div>
	);
}
