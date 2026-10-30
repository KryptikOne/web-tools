"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
	EyeIcon,
	PhotoIcon,
	ClipboardDocumentIcon,
	CheckIcon,
} from "@heroicons/react/24/outline";
import { ColorUtils } from "@/lib/colorUtils";
import styles from "./ColorBlindnessSimulator.module.scss";

// ---------- Types ----------

type InputMode = "color" | "image";

interface SimulationType {
	id: string;
	name: string;
	description: string;
	prevalence: string;
	matrix: number[];
}

// ---------- Color Blindness Simulation Matrices ----------
// Based on Brettel/Vienot simplified matrix transforms.
// Each matrix is a 9-element row-major 3x3 that transforms [R, G, B] (linear).

const SIMULATION_TYPES: SimulationType[] = [
	{
		id: "protanopia",
		name: "Protanopia",
		description: "Complete absence of red cone photoreceptors. Reds appear dark or muddy.",
		prevalence: "~1.3% of males",
		matrix: [
			0.152286, 1.052583, -0.204868,
			0.114503, 0.786281, 0.099216,
			-0.003882, -0.048116, 1.051998,
		],
	},
	{
		id: "deuteranopia",
		name: "Deuteranopia",
		description: "Complete absence of green cone photoreceptors. Greens are indistinguishable from reds.",
		prevalence: "~1.2% of males",
		matrix: [
			0.367322, 0.860646, -0.227968,
			0.280085, 0.672501, 0.047413,
			-0.011820, 0.042940, 0.968881,
		],
	},
	{
		id: "tritanopia",
		name: "Tritanopia",
		description: "Complete absence of blue cone photoreceptors. Blues and yellows become confused.",
		prevalence: "~0.001% of population",
		matrix: [
			1.255528, -0.076749, -0.178779,
			-0.078411, 0.930809, 0.147602,
			0.004733, 0.691367, 0.303900,
		],
	},
	{
		id: "protanomaly",
		name: "Protanomaly",
		description: "Reduced sensitivity of red cones. Red-green distinction is weakened.",
		prevalence: "~1.1% of males",
		matrix: [
			0.458064, 0.679578, -0.137642,
			0.092785, 0.846313, 0.060902,
			-0.007494, -0.016807, 1.024301,
		],
	},
	{
		id: "deuteranomaly",
		name: "Deuteranomaly",
		description: "Reduced sensitivity of green cones. Most common form of color blindness.",
		prevalence: "~5.0% of males",
		matrix: [
			0.547494, 0.607765, -0.155259,
			0.181692, 0.781742, 0.036566,
			-0.010410, 0.027275, 0.983136,
		],
	},
	{
		id: "tritanomaly",
		name: "Tritanomaly",
		description: "Reduced sensitivity of blue cones. Blue-yellow perception is diminished.",
		prevalence: "~0.01% of population",
		matrix: [
			1.017277, 0.027029, -0.044306,
			-0.006113, 0.958479, 0.047634,
			0.006379, 0.248708, 0.744913,
		],
	},
	{
		id: "achromatopsia",
		name: "Achromatopsia",
		description: "Total color blindness. Only shades of gray are perceived.",
		prevalence: "~0.003% of population",
		matrix: [
			0.299, 0.587, 0.114,
			0.299, 0.587, 0.114,
			0.299, 0.587, 0.114,
		],
	},
	{
		id: "achromatomaly",
		name: "Achromatomaly",
		description: "Partial total color blindness. Colors are severely desaturated.",
		prevalence: "~0.001% of population",
		matrix: [
			0.618, 0.320, 0.062,
			0.163, 0.775, 0.062,
			0.163, 0.320, 0.516,
		],
	},
];

// ---------- Color Transformation Helpers ----------

/** sRGB gamma decode (sRGB -> linear) */
function srgbToLinear(c: number): number {
	const s = c / 255;
	return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

/** Linear -> sRGB gamma encode */
function linearToSrgb(c: number): number {
	const s = c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
	return Math.round(Math.max(0, Math.min(255, s * 255)));
}

/** Apply a 3x3 color blindness matrix to an [R, G, B] triplet (0-255) */
function simulateColor(r: number, g: number, b: number, matrix: number[]): [number, number, number] {
	// Linearize
	const lr = srgbToLinear(r);
	const lg = srgbToLinear(g);
	const lb = srgbToLinear(b);

	// Matrix multiply
	const outR = matrix[0] * lr + matrix[1] * lg + matrix[2] * lb;
	const outG = matrix[3] * lr + matrix[4] * lg + matrix[5] * lb;
	const outB = matrix[6] * lr + matrix[7] * lg + matrix[8] * lb;

	// Encode back to sRGB
	return [linearToSrgb(outR), linearToSrgb(outG), linearToSrgb(outB)];
}

/** Get the simulated hex color for a given hex input and matrix */
function simulateHexColor(hex: string, matrix: number[]): string {
	const rgb = ColorUtils.hexToRgb(hex, [0, 0, 0]);
	const [sr, sg, sb] = simulateColor(rgb[0], rgb[1], rgb[2], matrix);
	return ColorUtils.rgbToHex(sr, sg, sb);
}

// ---------- Component ----------

export default function ColorBlindnessSimulator() {
	const [inputMode, setInputMode] = useState<InputMode>("color");
	const [hexInput, setHexInput] = useState("#3B82F6");
	const [colorPickerValue, setColorPickerValue] = useState("#3B82F6");
	const [imageSrc, setImageSrc] = useState<string | null>(null);
	const [isDragging, setIsDragging] = useState(false);
	const [copiedId, setCopiedId] = useState<string | null>(null);

	const fileInputRef = useRef<HTMLInputElement>(null);
	const sourceCanvasRef = useRef<HTMLCanvasElement>(null);
	const canvasRefs = useRef<Map<string, HTMLCanvasElement>>(new Map());

	// Keep hex input and color picker in sync
	const handleHexChange = useCallback((value: string) => {
		setHexInput(value);
		if (/^#[0-9a-fA-F]{6}$/.test(value)) {
			setColorPickerValue(value);
		}
	}, []);

	const handleColorPickerChange = useCallback((value: string) => {
		setColorPickerValue(value);
		setHexInput(value.toUpperCase());
	}, []);

	// Image handling
	const processImage = useCallback((img: HTMLImageElement) => {
		const canvas = sourceCanvasRef.current;
		if (!canvas) return;

		canvas.width = img.naturalWidth;
		canvas.height = img.naturalHeight;

		const ctx = canvas.getContext("2d", { willReadFrequently: true });
		if (!ctx) return;

		ctx.drawImage(img, 0, 0);
	}, []);

	const renderSimulatedImages = useCallback(() => {
		const sourceCanvas = sourceCanvasRef.current;
		if (!sourceCanvas) return;

		const sourceCtx = sourceCanvas.getContext("2d", { willReadFrequently: true });
		if (!sourceCtx) return;

		const sourceData = sourceCtx.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);

		for (const simType of SIMULATION_TYPES) {
			const targetCanvas = canvasRefs.current.get(simType.id);
			if (!targetCanvas) continue;

			targetCanvas.width = sourceCanvas.width;
			targetCanvas.height = sourceCanvas.height;

			const targetCtx = targetCanvas.getContext("2d");
			if (!targetCtx) continue;

			const targetData = targetCtx.createImageData(sourceCanvas.width, sourceCanvas.height);
			const src = sourceData.data;
			const dst = targetData.data;

			for (let i = 0; i < src.length; i += 4) {
				const [sr, sg, sb] = simulateColor(src[i], src[i + 1], src[i + 2], simType.matrix);
				dst[i] = sr;
				dst[i + 1] = sg;
				dst[i + 2] = sb;
				dst[i + 3] = src[i + 3]; // preserve alpha
			}

			targetCtx.putImageData(targetData, 0, 0);
		}
	}, []);

	const handleFile = useCallback(
		(file: File) => {
			if (!file.type.startsWith("image/")) return;

			const reader = new FileReader();
			reader.onload = (e) => {
				const src = e.target?.result as string;
				setImageSrc(src);

				const img = new Image();
				img.onload = () => {
					processImage(img);
					// Delay to ensure canvas refs are registered
					requestAnimationFrame(() => renderSimulatedImages());
				};
				img.src = src;
			};
			reader.readAsDataURL(file);
		},
		[processImage, renderSimulatedImages]
	);

	const handleDrop = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault();
			setIsDragging(false);
			const file = e.dataTransfer.files[0];
			if (file) handleFile(file);
		},
		[handleFile]
	);

	const handleDragOver = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(true);
	}, []);

	const handleDragLeave = useCallback(() => {
		setIsDragging(false);
	}, []);

	const handleFileInput = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const file = e.target.files?.[0];
			if (file) handleFile(file);
		},
		[handleFile]
	);

	const removeImage = useCallback(() => {
		setImageSrc(null);
		if (fileInputRef.current) fileInputRef.current.value = "";
	}, []);

	// Re-render simulated images when source canvas updates
	useEffect(() => {
		if (imageSrc && sourceCanvasRef.current) {
			const timer = setTimeout(() => renderSimulatedImages(), 100);
			return () => clearTimeout(timer);
		}
	}, [imageSrc, renderSimulatedImages]);

	const setCanvasRef = useCallback((id: string) => (el: HTMLCanvasElement | null) => {
		if (el) {
			canvasRefs.current.set(id, el);
		} else {
			canvasRefs.current.delete(id);
		}
	}, []);

	const copyToClipboard = useCallback(async (text: string, key: string) => {
		try {
			await navigator.clipboard.writeText(text);
			setCopiedId(key);
			setTimeout(() => setCopiedId(null), 1500);
		} catch (err) {
			console.error("Failed to copy:", err);
		}
	}, []);

	const validHex = /^#[0-9a-fA-F]{6}$/.test(hexInput) ? hexInput : "#3B82F6";

	return (
		<div className={styles.container}>
			{/* Input Controls */}
			<div className={styles.glassCard}>
				<h2 className={styles.sectionTitle}>
					<EyeIcon className="w-5 h-5 inline-block mr-2 align-text-bottom" />
					Color Blindness Simulator
				</h2>

				{/* Mode Toggle */}
				<div className="flex gap-2 mb-6">
					<button
						className={`${styles.modeBtn} ${inputMode === "color" ? styles.modeBtnActive : ""}`}
						onClick={() => setInputMode("color")}
					>
						Color
					</button>
					<button
						className={`${styles.modeBtn} ${inputMode === "image" ? styles.modeBtnActive : ""}`}
						onClick={() => setInputMode("image")}
					>
						Image
					</button>
				</div>

				{inputMode === "color" ? (
					<div className="flex items-center gap-4">
						<input
							type="color"
							value={colorPickerValue}
							onChange={(e) => handleColorPickerChange(e.target.value)}
							className={styles.colorInput}
						/>
						<input
							type="text"
							value={hexInput}
							onChange={(e) => handleHexChange(e.target.value)}
							placeholder="#3B82F6"
							className={styles.hexInput}
							maxLength={7}
						/>
						<div
							className={styles.previewSwatch}
							style={{ backgroundColor: validHex }}
						/>
					</div>
				) : (
					<>
						{!imageSrc ? (
							<div
								className={`flex flex-col items-center justify-center gap-4 p-12 ${styles.dropZone} ${isDragging ? styles.dropZoneActive : ""}`}
								onDrop={handleDrop}
								onDragOver={handleDragOver}
								onDragLeave={handleDragLeave}
								onClick={() => fileInputRef.current?.click()}
							>
								<PhotoIcon className={`w-12 h-12 ${styles.dropIcon}`} />
								<p className={`text-base font-medium ${styles.dropText}`}>
									Drop an image here or click to browse
								</p>
								<p className={`text-sm ${styles.dropHint}`}>Supports PNG, JPG, WebP, GIF, BMP</p>
							</div>
						) : (
							<div className="flex flex-col gap-3">
								<div className="flex items-center justify-between">
									<p className={styles.infoText}>Original image uploaded</p>
									<button className={styles.removeBtn} onClick={removeImage}>
										Remove
									</button>
								</div>
								<div className={styles.imagePreviewContainer}>
									<img src={imageSrc} alt="Original" className={`w-full ${styles.imagePreview}`} />
								</div>
							</div>
						)}
						<input
							ref={fileInputRef}
							type="file"
							accept="image/*"
							className="hidden"
							onChange={handleFileInput}
							aria-label="Upload image for simulation"
						/>
					</>
				)}
			</div>

			{/* Simulation Grid */}
			<div className={styles.simulationGrid}>
				{SIMULATION_TYPES.map((simType) => {
					const simHex = inputMode === "color" ? simulateHexColor(validHex, simType.matrix) : null;

					return (
						<div key={simType.id} className={styles.glassCard}>
							<div className="flex items-start justify-between mb-3">
								<div>
									<h3 className={styles.simTitle}>{simType.name}</h3>
									<p className={styles.simPrevalence}>{simType.prevalence}</p>
								</div>
							</div>
							<p className={`text-sm mb-4 ${styles.simDescription}`}>
								{simType.description}
							</p>

							{inputMode === "color" && simHex ? (
								<div className="flex items-center gap-3">
									{/* Original */}
									<div className="flex flex-col items-center gap-1">
										<div
											className={styles.colorSwatch}
											style={{ backgroundColor: validHex }}
										/>
										<span className={styles.swatchLabel}>Original</span>
										<span className={styles.swatchHex}>{validHex.toUpperCase()}</span>
									</div>

									<span className={`text-lg ${styles.arrow}`}>&rarr;</span>

									{/* Simulated */}
									<div className="flex flex-col items-center gap-1">
										<div
											className={styles.colorSwatch}
											style={{ backgroundColor: simHex }}
										/>
										<span className={styles.swatchLabel}>Simulated</span>
										<div className="flex items-center gap-1">
											<span className={styles.swatchHex}>{simHex.toUpperCase()}</span>
											<button
												className={styles.copyBtn}
												onClick={() => copyToClipboard(simHex.toUpperCase(), simType.id)}
												title="Copy simulated hex"
											>
												{copiedId === simType.id ? (
													<CheckIcon className={styles.copyIcon} />
												) : (
													<ClipboardDocumentIcon className={styles.copyIcon} />
												)}
											</button>
										</div>
									</div>
								</div>
							) : inputMode === "image" && imageSrc ? (
								<div className={styles.canvasContainer}>
									<canvas
										ref={setCanvasRef(simType.id)}
										className={styles.simulatedCanvas}
									/>
								</div>
							) : (
								<div className={`flex items-center justify-center py-6 ${styles.emptyState}`}>
									<p className="text-sm">
										{inputMode === "color" ? "Enter a color above" : "Upload an image above"}
									</p>
								</div>
							)}
						</div>
					);
				})}
			</div>

			{/* Info Box */}
			<div className={styles.glassCard}>
				<div className={`flex items-start gap-4 p-4 ${styles.infoBox}`}>
					<EyeIcon className={`w-6 h-6 shrink-0 ${styles.infoIcon}`} />
					<p className={styles.infoText}>
						This tool simulates how colors and images appear to people with various types of color vision deficiency.
						Approximately 8% of males and 0.5% of females have some form of color blindness.
						All processing happens entirely in your browser — no data is uploaded.
					</p>
				</div>
			</div>

			{/* Hidden canvas for source image data */}
			<canvas ref={sourceCanvasRef} style={{ display: "none" }} />
		</div>
	);
}
