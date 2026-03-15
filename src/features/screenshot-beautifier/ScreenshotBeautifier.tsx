"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
	ArrowDownTrayIcon,
	ArrowUpTrayIcon,
	PhotoIcon,
	XMarkIcon,
} from "@heroicons/react/24/outline";
import { ColorPickerPopover } from "@/components/ColorPickerPopover";
import styles from "./ScreenshotBeautifier.module.scss";

// --- Types ---

type BackgroundType = "solid" | "gradient-preset" | "gradient-custom" | "transparent";
type ShadowPreset = "none" | "small" | "medium" | "large" | "xl" | "custom";
type AspectRatio = "free" | "16:9" | "4:3" | "1:1" | "3:2";
type ExportFormat = "png" | "jpeg";

interface CustomShadow {
	blur: number;
	spread: number;
	offsetX: number;
	offsetY: number;
	color: string;
}

interface CustomGradient {
	color1: string;
	color2: string;
	angle: number;
}

// --- Constants ---

const GRADIENT_PRESETS = [
	{ name: "Purple Pink", colors: ["#7c3aed", "#ec4899"], angle: 135 },
	{ name: "Blue Cyan", colors: ["#2563eb", "#06b6d4"], angle: 135 },
	{ name: "Orange Red", colors: ["#f97316", "#ef4444"], angle: 135 },
	{ name: "Green Teal", colors: ["#10b981", "#14b8a6"], angle: 135 },
	{ name: "Indigo Blue", colors: ["#6366f1", "#3b82f6"], angle: 135 },
	{ name: "Rose Orange", colors: ["#f43f5e", "#fb923c"], angle: 135 },
	{ name: "Violet Fuchsia", colors: ["#8b5cf6", "#d946ef"], angle: 135 },
	{ name: "Slate Dark", colors: ["#1e293b", "#334155"], angle: 180 },
];

const SHADOW_PRESETS: Record<Exclude<ShadowPreset, "custom">, { blur: number; spread: number; offsetX: number; offsetY: number; opacity: number }> = {
	none: { blur: 0, spread: 0, offsetX: 0, offsetY: 0, opacity: 0 },
	small: { blur: 10, spread: 0, offsetX: 0, offsetY: 4, opacity: 0.15 },
	medium: { blur: 25, spread: 0, offsetX: 0, offsetY: 10, opacity: 0.2 },
	large: { blur: 50, spread: 0, offsetX: 0, offsetY: 20, opacity: 0.25 },
	xl: { blur: 80, spread: -10, offsetX: 0, offsetY: 30, opacity: 0.3 },
};

const ASPECT_RATIOS: Record<AspectRatio, { label: string; ratio: number | null }> = {
	free: { label: "Free", ratio: null },
	"16:9": { label: "16:9", ratio: 16 / 9 },
	"4:3": { label: "4:3", ratio: 4 / 3 },
	"1:1": { label: "1:1", ratio: 1 },
	"3:2": { label: "3:2", ratio: 3 / 2 },
};

// --- Helpers ---

function hexToRgba(hex: string, alpha: number): string {
	const r = parseInt(hex.slice(1, 3), 16);
	const g = parseInt(hex.slice(3, 5), 16);
	const b = parseInt(hex.slice(5, 7), 16);
	return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Draw a checkerboard pattern onto a canvas context
function drawCheckerboard(ctx: CanvasRenderingContext2D, w: number, h: number, size: number = 16) {
	ctx.fillStyle = "#cccccc";
	ctx.fillRect(0, 0, w, h);
	ctx.fillStyle = "#999999";
	for (let y = 0; y < h; y += size) {
		for (let x = 0; x < w; x += size) {
			if ((Math.floor(x / size) + Math.floor(y / size)) % 2 === 0) {
				ctx.fillRect(x, y, size, size);
			}
		}
	}
}

// Draw a rounded rectangle path
function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
	r = Math.min(r, w / 2, h / 2);
	ctx.beginPath();
	ctx.moveTo(x + r, y);
	ctx.lineTo(x + w - r, y);
	ctx.arcTo(x + w, y, x + w, y + r, r);
	ctx.lineTo(x + w, y + h - r);
	ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
	ctx.lineTo(x + r, y + h);
	ctx.arcTo(x, y + h, x, y + h - r, r);
	ctx.lineTo(x, y + r);
	ctx.arcTo(x, y, x + r, y, r);
	ctx.closePath();
}

export default function ScreenshotBeautifier() {
	// Image state
	const [image, setImage] = useState<HTMLImageElement | null>(null);
	const [isDragging, setIsDragging] = useState(false);

	// Background
	const [bgType, setBgType] = useState<BackgroundType>("gradient-preset");
	const [bgSolidColor, setBgSolidColor] = useState("#6366f1");
	const [selectedPresetIndex, setSelectedPresetIndex] = useState(0);
	const [customGradient, setCustomGradient] = useState<CustomGradient>({
		color1: "#7c3aed",
		color2: "#ec4899",
		angle: 135,
	});

	// Padding, radius, shadow
	const [padding, setPadding] = useState(64);
	const [borderRadius, setBorderRadius] = useState(12);
	const [shadowPreset, setShadowPreset] = useState<ShadowPreset>("medium");
	const [customShadow, setCustomShadow] = useState<CustomShadow>({
		blur: 25,
		spread: 0,
		offsetX: 0,
		offsetY: 10,
		color: "#000000",
	});

	// Aspect ratio & scale
	const [aspectRatio, setAspectRatio] = useState<AspectRatio>("free");
	const [scale, setScale] = useState(100);

	// Export
	const [exportFormat, setExportFormat] = useState<ExportFormat>("png");

	// Refs
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const previewCanvasRef = useRef<HTMLCanvasElement>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	// --- Image loading ---

	const loadImage = useCallback((file: File) => {
		if (!file.type.startsWith("image/")) return;
		const reader = new FileReader();
		reader.onload = (e) => {
			const img = new Image();
			img.onload = () => setImage(img);
			img.src = e.target?.result as string;
		};
		reader.readAsDataURL(file);
	}, []);

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) loadImage(file);
	};

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(false);
		const file = e.dataTransfer.files?.[0];
		if (file) loadImage(file);
	};

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(true);
	};

	const handleDragLeave = () => setIsDragging(false);

	// Clipboard paste
	useEffect(() => {
		const handlePaste = (e: ClipboardEvent) => {
			const items = e.clipboardData?.items;
			if (!items) return;
			for (const item of items) {
				if (item.type.startsWith("image/")) {
					const file = item.getAsFile();
					if (file) loadImage(file);
					break;
				}
			}
		};
		window.addEventListener("paste", handlePaste);
		return () => window.removeEventListener("paste", handlePaste);
	}, [loadImage]);

	// --- Canvas rendering ---

	const getCanvasDimensions = useCallback(() => {
		if (!image) return { width: 0, height: 0, imgW: 0, imgH: 0 };

		const scaleFactor = scale / 100;
		const imgW = image.width * scaleFactor;
		const imgH = image.height * scaleFactor;
		let canvasW = imgW + padding * 2;
		let canvasH = imgH + padding * 2;

		const ratioSpec = ASPECT_RATIOS[aspectRatio];
		if (ratioSpec.ratio) {
			const targetRatio = ratioSpec.ratio;
			const currentRatio = canvasW / canvasH;
			if (currentRatio < targetRatio) {
				canvasW = canvasH * targetRatio;
			} else {
				canvasH = canvasW / targetRatio;
			}
		}

		return { width: Math.round(canvasW), height: Math.round(canvasH), imgW, imgH };
	}, [image, padding, aspectRatio, scale]);

	const renderCanvas = useCallback(
		(canvas: HTMLCanvasElement) => {
			if (!image) return;

			const { width, height, imgW, imgH } = getCanvasDimensions();
			if (width === 0 || height === 0) return;

			canvas.width = width;
			canvas.height = height;
			const ctx = canvas.getContext("2d");
			if (!ctx) return;

			// 1. Draw background
			if (bgType === "transparent") {
				drawCheckerboard(ctx, width, height);
			} else if (bgType === "solid") {
				ctx.fillStyle = bgSolidColor;
				ctx.fillRect(0, 0, width, height);
			} else {
				// gradient
				let colors: string[];
				let angle: number;
				if (bgType === "gradient-preset") {
					const preset = GRADIENT_PRESETS[selectedPresetIndex];
					colors = preset.colors;
					angle = preset.angle;
				} else {
					colors = [customGradient.color1, customGradient.color2];
					angle = customGradient.angle;
				}

				const rad = (angle * Math.PI) / 180;
				const cx = width / 2;
				const cy = height / 2;
				const len = Math.sqrt(width * width + height * height) / 2;
				const x0 = cx - Math.cos(rad) * len;
				const y0 = cy - Math.sin(rad) * len;
				const x1 = cx + Math.cos(rad) * len;
				const y1 = cy + Math.sin(rad) * len;

				const grad = ctx.createLinearGradient(x0, y0, x1, y1);
				grad.addColorStop(0, colors[0]);
				grad.addColorStop(1, colors[1]);
				ctx.fillStyle = grad;
				ctx.fillRect(0, 0, width, height);
			}

			// 2. Calculate image position (centered)
			const imgX = (width - imgW) / 2;
			const imgY = (height - imgH) / 2;

			// 3. Draw shadow
			if (shadowPreset !== "none") {
				let shadow: { blur: number; spread: number; offsetX: number; offsetY: number; opacity?: number; color?: string };
				if (shadowPreset === "custom") {
					shadow = { ...customShadow, opacity: 1 };
				} else {
					shadow = SHADOW_PRESETS[shadowPreset];
				}

				ctx.save();
				// We simulate box-shadow by drawing a filled rounded rect behind the image with a shadow filter
				ctx.shadowOffsetX = shadow.offsetX;
				ctx.shadowOffsetY = shadow.offsetY;
				ctx.shadowBlur = shadow.blur;

				if (shadowPreset === "custom") {
					ctx.shadowColor = hexToRgba(shadow.color ?? "#000000", 1);
				} else {
					ctx.shadowColor = hexToRgba("#000000", shadow.opacity ?? 0.2);
				}

				// Draw shadow source rect (will be clipped out, only shadow remains)
				roundedRect(ctx, imgX, imgY, imgW, imgH, borderRadius);
				ctx.fillStyle = "rgba(0,0,0,1)";
				ctx.fill();
				ctx.restore();

				// Redraw background over the shadow source to clean up
				ctx.save();
				roundedRect(ctx, imgX, imgY, imgW, imgH, borderRadius);
				ctx.clip();

				// Re-draw background inside clip
				if (bgType === "transparent") {
					drawCheckerboard(ctx, width, height);
				} else if (bgType === "solid") {
					ctx.fillStyle = bgSolidColor;
					ctx.fillRect(0, 0, width, height);
				} else {
					let colors: string[];
					let angle: number;
					if (bgType === "gradient-preset") {
						const preset = GRADIENT_PRESETS[selectedPresetIndex];
						colors = preset.colors;
						angle = preset.angle;
					} else {
						colors = [customGradient.color1, customGradient.color2];
						angle = customGradient.angle;
					}
					const rad = (angle * Math.PI) / 180;
					const cx2 = width / 2;
					const cy2 = height / 2;
					const len2 = Math.sqrt(width * width + height * height) / 2;
					const grad = ctx.createLinearGradient(
						cx2 - Math.cos(rad) * len2,
						cy2 - Math.sin(rad) * len2,
						cx2 + Math.cos(rad) * len2,
						cy2 + Math.sin(rad) * len2
					);
					grad.addColorStop(0, colors[0]);
					grad.addColorStop(1, colors[1]);
					ctx.fillStyle = grad;
					ctx.fillRect(0, 0, width, height);
				}
				ctx.restore();
			}

			// 4. Draw image with border radius
			ctx.save();
			roundedRect(ctx, imgX, imgY, imgW, imgH, borderRadius);
			ctx.clip();
			ctx.drawImage(image, imgX, imgY, imgW, imgH);
			ctx.restore();
		},
		[image, bgType, bgSolidColor, selectedPresetIndex, customGradient, borderRadius, shadowPreset, customShadow, getCanvasDimensions]
	);

	// Render to hidden canvas + scaled preview
	useEffect(() => {
		if (!image) return;

		const canvas = canvasRef.current;
		const preview = previewCanvasRef.current;
		if (!canvas || !preview) return;

		renderCanvas(canvas);

		// Scale down for preview
		const maxW = 800;
		const maxH = 600;
		const scaleDown = Math.min(1, maxW / canvas.width, maxH / canvas.height);
		preview.width = canvas.width * scaleDown;
		preview.height = canvas.height * scaleDown;
		const pCtx = preview.getContext("2d");
		if (pCtx) {
			pCtx.drawImage(canvas, 0, 0, preview.width, preview.height);
		}
	}, [image, renderCanvas]);

	// --- Download ---

	const handleDownload = () => {
		const canvas = canvasRef.current;
		if (!canvas || !image) return;

		const mimeType = exportFormat === "jpeg" ? "image/jpeg" : "image/png";
		const quality = exportFormat === "jpeg" ? 0.92 : undefined;

		canvas.toBlob(
			(blob) => {
				if (!blob) return;
				const url = URL.createObjectURL(blob);
				const link = document.createElement("a");
				link.download = `screenshot.${exportFormat}`;
				link.href = url;
				link.click();
				URL.revokeObjectURL(url);
			},
			mimeType,
			quality
		);
	};

	const clearImage = () => {
		setImage(null);
		if (fileInputRef.current) fileInputRef.current.value = "";
	};

	// --- Render ---

	return (
		<div className={styles.container}>
			{/* Controls Panel */}
			<div className="flex flex-col gap-4">
				{/* Upload */}
				<div className={styles.glassCard}>
					<h2 className={styles.sectionTitle}>Upload</h2>
					<div
						className={`flex flex-col items-center justify-center gap-3 rounded-lg cursor-pointer transition-colors ${styles.dropZone} ${isDragging ? styles.dropZoneActive : ""}`}
						onDrop={handleDrop}
						onDragOver={handleDragOver}
						onDragLeave={handleDragLeave}
						onClick={() => fileInputRef.current?.click()}
					>
						<ArrowUpTrayIcon className="w-8 h-8" />
						<p className="text-sm text-center">
							Drop an image, click to browse,
							<br />
							or paste from clipboard (Ctrl+V)
						</p>
						<input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" aria-label="Upload screenshot" />
					</div>
					{image && (
						<button className={`flex items-center gap-1.5 mt-3 text-sm ${styles.clearBtn}`} onClick={clearImage}>
							<XMarkIcon className="w-4 h-4" />
							Clear image
						</button>
					)}
				</div>

				{/* Background */}
				<div className={styles.glassCard}>
					<h2 className={styles.sectionTitle}>Background</h2>
					<div className="flex flex-wrap gap-2 mb-4">
						{(["solid", "gradient-preset", "gradient-custom", "transparent"] as BackgroundType[]).map((type) => (
							<button
								key={type}
								className={`${styles.presetBtn} ${bgType === type ? styles.active : ""}`}
								onClick={() => setBgType(type)}
							>
								{type === "solid" ? "Solid" : type === "gradient-preset" ? "Gradient" : type === "gradient-custom" ? "Custom" : "Transparent"}
							</button>
						))}
					</div>

					{bgType === "solid" && (
						<div className="flex items-center gap-3">
							<ColorPickerPopover color={bgSolidColor} onChange={setBgSolidColor} swatchSize="md" />
							<span className="text-xs font-mono">{bgSolidColor}</span>
						</div>
					)}

					{bgType === "gradient-preset" && (
						<div className="grid grid-cols-4 gap-2">
							{GRADIENT_PRESETS.map((preset, i) => (
								<button
									key={preset.name}
									className={`${styles.gradientSwatch} ${selectedPresetIndex === i ? styles.active : ""}`}
									style={{
										background: `linear-gradient(${preset.angle}deg, ${preset.colors[0]}, ${preset.colors[1]})`,
									}}
									onClick={() => setSelectedPresetIndex(i)}
									title={preset.name}
								/>
							))}
						</div>
					)}

					{bgType === "gradient-custom" && (
						<div className="flex flex-col gap-3">
							<div className="flex items-center gap-3">
								<ColorPickerPopover color={customGradient.color1} onChange={(c) => setCustomGradient((g) => ({ ...g, color1: c }))} swatchSize="sm" />
								<span className="text-xs font-mono">{customGradient.color1}</span>
							</div>
							<div className="flex items-center gap-3">
								<ColorPickerPopover color={customGradient.color2} onChange={(c) => setCustomGradient((g) => ({ ...g, color2: c }))} swatchSize="sm" />
								<span className="text-xs font-mono">{customGradient.color2}</span>
							</div>
							<div>
								<div className={styles.sliderHeader}>
									<span className={styles.sliderLabel}>Angle</span>
									<span className={styles.sliderValue}>{customGradient.angle}°</span>
								</div>
								<input
									type="range"
									min="0"
									max="360"
									value={customGradient.angle}
									onChange={(e) => setCustomGradient((g) => ({ ...g, angle: parseInt(e.target.value) }))}
									className={styles.slider}
								/>
							</div>
						</div>
					)}
				</div>

				{/* Padding & Radius */}
				<div className={styles.glassCard}>
					<h2 className={styles.sectionTitle}>Spacing & Shape</h2>
					<div className="flex flex-col gap-4">
						<div>
							<div className={styles.sliderHeader}>
								<span className={styles.sliderLabel}>Padding</span>
								<span className={styles.sliderValue}>{padding}px</span>
							</div>
							<input
								type="range"
								min="0"
								max="200"
								value={padding}
								onChange={(e) => setPadding(parseInt(e.target.value))}
								className={styles.slider}
							/>
						</div>
						<div>
							<div className={styles.sliderHeader}>
								<span className={styles.sliderLabel}>Border Radius</span>
								<span className={styles.sliderValue}>{borderRadius}px</span>
							</div>
							<input
								type="range"
								min="0"
								max="32"
								value={borderRadius}
								onChange={(e) => setBorderRadius(parseInt(e.target.value))}
								className={styles.slider}
							/>
						</div>
					</div>
				</div>

				{/* Shadow */}
				<div className={styles.glassCard}>
					<h2 className={styles.sectionTitle}>Shadow</h2>
					<div className="flex flex-wrap gap-2 mb-4">
						{(["none", "small", "medium", "large", "xl", "custom"] as ShadowPreset[]).map((preset) => (
							<button
								key={preset}
								className={`${styles.presetBtn} ${shadowPreset === preset ? styles.active : ""}`}
								onClick={() => setShadowPreset(preset)}
							>
								{preset === "xl" ? "Extra Large" : preset.charAt(0).toUpperCase() + preset.slice(1)}
							</button>
						))}
					</div>

					{shadowPreset === "custom" && (
						<div className="flex flex-col gap-3">
							<div>
								<div className={styles.sliderHeader}>
									<span className={styles.sliderLabel}>Blur</span>
									<span className={styles.sliderValue}>{customShadow.blur}px</span>
								</div>
								<input
									type="range" min="0" max="100"
									value={customShadow.blur}
									onChange={(e) => setCustomShadow((s) => ({ ...s, blur: parseInt(e.target.value) }))}
									className={styles.slider}
								/>
							</div>
							<div>
								<div className={styles.sliderHeader}>
									<span className={styles.sliderLabel}>Spread</span>
									<span className={styles.sliderValue}>{customShadow.spread}px</span>
								</div>
								<input
									type="range" min="-50" max="50"
									value={customShadow.spread}
									onChange={(e) => setCustomShadow((s) => ({ ...s, spread: parseInt(e.target.value) }))}
									className={styles.slider}
								/>
							</div>
							<div>
								<div className={styles.sliderHeader}>
									<span className={styles.sliderLabel}>X Offset</span>
									<span className={styles.sliderValue}>{customShadow.offsetX}px</span>
								</div>
								<input
									type="range" min="-50" max="50"
									value={customShadow.offsetX}
									onChange={(e) => setCustomShadow((s) => ({ ...s, offsetX: parseInt(e.target.value) }))}
									className={styles.slider}
								/>
							</div>
							<div>
								<div className={styles.sliderHeader}>
									<span className={styles.sliderLabel}>Y Offset</span>
									<span className={styles.sliderValue}>{customShadow.offsetY}px</span>
								</div>
								<input
									type="range" min="-50" max="50"
									value={customShadow.offsetY}
									onChange={(e) => setCustomShadow((s) => ({ ...s, offsetY: parseInt(e.target.value) }))}
									className={styles.slider}
								/>
							</div>
							<div className="flex items-center gap-3">
								<ColorPickerPopover color={customShadow.color} onChange={(c) => setCustomShadow((s) => ({ ...s, color: c }))} swatchSize="sm" />
								<span className="text-xs font-mono">{customShadow.color}</span>
							</div>
						</div>
					)}
				</div>

				{/* Aspect Ratio & Scale */}
				<div className={styles.glassCard}>
					<h2 className={styles.sectionTitle}>Output</h2>
					<div className="flex flex-col gap-4">
						<div>
							<label className={styles.inputLabel}>Aspect Ratio</label>
							<div className="flex flex-wrap gap-2">
								{(Object.keys(ASPECT_RATIOS) as AspectRatio[]).map((ratio) => (
									<button
										key={ratio}
										className={`${styles.presetBtn} ${aspectRatio === ratio ? styles.active : ""}`}
										onClick={() => setAspectRatio(ratio)}
									>
										{ASPECT_RATIOS[ratio].label}
									</button>
								))}
							</div>
						</div>
						<div>
							<div className={styles.sliderHeader}>
								<span className={styles.sliderLabel}>Scale</span>
								<span className={styles.sliderValue}>{scale}%</span>
							</div>
							<input
								type="range"
								min="25"
								max="200"
								value={scale}
								onChange={(e) => setScale(parseInt(e.target.value))}
								className={styles.slider}
							/>
						</div>
						<div>
							<label className={styles.inputLabel}>Format</label>
							<div className="flex gap-2">
								{(["png", "jpeg"] as ExportFormat[]).map((fmt) => (
									<button
										key={fmt}
										className={`${styles.presetBtn} ${exportFormat === fmt ? styles.active : ""}`}
										onClick={() => setExportFormat(fmt)}
									>
										{fmt.toUpperCase()}
									</button>
								))}
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Preview Panel */}
			<div className="flex flex-col gap-4">
				<div className={styles.glassCard}>
					<div className="flex items-center justify-between mb-4">
						<h2 className={styles.sectionTitle}>Preview</h2>
						{image && (
							<button className={styles.downloadBtn} onClick={handleDownload}>
								<ArrowDownTrayIcon className="w-5 h-5" />
								Download
							</button>
						)}
					</div>

					{image ? (
						<div className={`flex items-center justify-center rounded-lg ${styles.previewArea}`}>
							<canvas ref={previewCanvasRef} className="max-w-full rounded-md" />
						</div>
					) : (
						<div className={`flex flex-col items-center justify-center gap-4 rounded-lg ${styles.emptyPreview}`}>
							<PhotoIcon className="w-16 h-16 opacity-30" />
							<p className={styles.infoText}>
								Upload a screenshot to get started. You can drag and drop, browse files, or paste from your clipboard.
							</p>
						</div>
					)}
				</div>

				{/* Info */}
				<div className={styles.glassCard}>
					<h2 className={styles.sectionTitle}>About Screenshot Beautifier</h2>
					<div className={styles.infoGrid}>
						<div className={styles.infoItem}>
							<h3 className={styles.infoSubtitle}>How It Works</h3>
							<p className={styles.infoText}>
								Upload any screenshot, then customize the background, padding, border radius, and shadow. Everything is rendered on an HTML Canvas for crisp, high-quality output.
							</p>
						</div>
						<div className={styles.infoItem}>
							<h3 className={styles.infoSubtitle}>Privacy First</h3>
							<p className={styles.infoText}>
								All processing happens entirely in your browser. Your images are never uploaded to any server.
							</p>
						</div>
					</div>
				</div>
			</div>

			{/* Hidden full-size canvas */}
			<canvas ref={canvasRef} style={{ display: "none" }} />
		</div>
	);
}
