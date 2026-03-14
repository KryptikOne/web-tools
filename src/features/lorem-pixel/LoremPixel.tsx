"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
	ArrowDownTrayIcon,
	ArrowPathIcon,
	PhotoIcon,
} from "@heroicons/react/24/outline";
import { ColorPickerPopover } from "@/components/ColorPickerPopover";
import styles from "./LoremPixel.module.scss";

type PatternStyle = "solid" | "gradient" | "noise" | "crosshatch";

interface Preset {
	label: string;
	width: number;
	height: number;
}

const SIZE_PRESETS: Preset[] = [
	{ label: "1920 × 1080", width: 1920, height: 1080 },
	{ label: "1280 × 720", width: 1280, height: 720 },
	{ label: "800 × 600", width: 800, height: 600 },
	{ label: "640 × 480", width: 640, height: 480 },
	{ label: "400 × 400", width: 400, height: 400 },
	{ label: "200 × 200", width: 200, height: 200 },
	{ label: "150 × 150", width: 150, height: 150 },
];

const PATTERN_OPTIONS: { value: PatternStyle; label: string }[] = [
	{ value: "solid", label: "Solid" },
	{ value: "gradient", label: "Gradient" },
	{ value: "noise", label: "Noise" },
	{ value: "crosshatch", label: "Crosshatch" },
];

function randomHexColor(): string {
	return (
		"#" +
		Math.floor(Math.random() * 16777215)
			.toString(16)
			.padStart(6, "0")
	);
}

export default function LoremPixel() {
	const [width, setWidth] = useState<number>(800);
	const [height, setHeight] = useState<number>(600);
	const [bgColor, setBgColor] = useState<string>("#3b82f6");
	const [textColor, setTextColor] = useState<string>("#ffffff");
	const [gradientColor, setGradientColor] = useState<string>("#8b5cf6");
	const [customText, setCustomText] = useState<string>("");
	const [pattern, setPattern] = useState<PatternStyle>("solid");

	const canvasRef = useRef<HTMLCanvasElement>(null);
	const previewCanvasRef = useRef<HTMLCanvasElement>(null);

	const displayText = customText || `${width} × ${height}`;

	const autoFontSize = useCallback(
		(w: number, h: number): number => {
			const minDim = Math.min(w, h);
			const textLen = (customText || `${w} × ${h}`).length;
			// Scale based on shorter dimension, then adjust for text length
			const baseFontSize = minDim / 6;
			const lengthScale = Math.max(0.4, 1 - (textLen - 10) * 0.03);
			return Math.max(10, Math.min(baseFontSize * lengthScale, w * 0.85 / (textLen * 0.55)));
		},
		[customText]
	);

	const drawPattern = useCallback(
		(ctx: CanvasRenderingContext2D, w: number, h: number) => {
			switch (pattern) {
				case "solid":
					ctx.fillStyle = bgColor;
					ctx.fillRect(0, 0, w, h);
					break;

				case "gradient": {
					const grad = ctx.createLinearGradient(0, 0, w, h);
					grad.addColorStop(0, bgColor);
					grad.addColorStop(1, gradientColor);
					ctx.fillStyle = grad;
					ctx.fillRect(0, 0, w, h);
					break;
				}

				case "noise": {
					ctx.fillStyle = bgColor;
					ctx.fillRect(0, 0, w, h);
					const imageData = ctx.getImageData(0, 0, w, h);
					const data = imageData.data;
					for (let i = 0; i < data.length; i += 4) {
						const noise = (Math.random() - 0.5) * 80;
						data[i] = Math.max(0, Math.min(255, data[i] + noise));
						data[i + 1] = Math.max(
							0,
							Math.min(255, data[i + 1] + noise)
						);
						data[i + 2] = Math.max(
							0,
							Math.min(255, data[i + 2] + noise)
						);
					}
					ctx.putImageData(imageData, 0, 0);
					break;
				}

				case "crosshatch": {
					ctx.fillStyle = bgColor;
					ctx.fillRect(0, 0, w, h);
					const spacing = Math.max(8, Math.min(w, h) / 30);
					ctx.strokeStyle = textColor + "30"; // 30 = ~19% opacity hex
					ctx.lineWidth = 1;
					// Diagonal lines top-left to bottom-right
					for (let i = -h; i < w + h; i += spacing) {
						ctx.beginPath();
						ctx.moveTo(i, 0);
						ctx.lineTo(i + h, h);
						ctx.stroke();
					}
					// Diagonal lines top-right to bottom-left
					for (let i = -h; i < w + h; i += spacing) {
						ctx.beginPath();
						ctx.moveTo(i + h, 0);
						ctx.lineTo(i, h);
						ctx.stroke();
					}
					break;
				}
			}
		},
		[bgColor, gradientColor, textColor, pattern]
	);

	const generateImage = useCallback(() => {
		const canvas = canvasRef.current;
		const previewCanvas = previewCanvasRef.current;
		if (!canvas || !previewCanvas) return;

		canvas.width = width;
		canvas.height = height;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		// Draw pattern/background
		drawPattern(ctx, width, height);

		// Draw text
		const fontSize = autoFontSize(width, height);
		ctx.font = `600 ${fontSize}px sans-serif`;
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";
		ctx.fillStyle = textColor;
		ctx.fillText(displayText, width / 2, height / 2);

		// Update preview (scaled)
		const maxPreviewW = 800;
		const maxPreviewH = 600;
		let scale = 1;
		if (width > maxPreviewW || height > maxPreviewH) {
			scale = Math.min(maxPreviewW / width, maxPreviewH / height);
		}
		previewCanvas.width = width * scale;
		previewCanvas.height = height * scale;

		const pCtx = previewCanvas.getContext("2d");
		if (!pCtx) return;
		pCtx.drawImage(canvas, 0, 0, width * scale, height * scale);
	}, [width, height, textColor, displayText, drawPattern, autoFontSize]);

	useEffect(() => {
		generateImage();
	}, [generateImage]);

	const handleDownload = () => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		canvas.toBlob((blob) => {
			if (!blob) return;
			const url = URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.download = `placeholder-${width}x${height}.png`;
			link.href = url;
			link.click();
			URL.revokeObjectURL(url);
		}, "image/png");
	};

	const handleRandomColors = () => {
		setBgColor(randomHexColor());
		setTextColor(randomHexColor());
		setGradientColor(randomHexColor());
	};

	const handlePresetClick = (preset: Preset) => {
		setWidth(preset.width);
		setHeight(preset.height);
	};

	const handleWidthChange = (value: string) => {
		const num = parseInt(value, 10);
		if (!isNaN(num) && num >= 1 && num <= 4000) {
			setWidth(num);
		} else if (value === "") {
			setWidth(1);
		}
	};

	const handleHeightChange = (value: string) => {
		const num = parseInt(value, 10);
		if (!isNaN(num) && num >= 1 && num <= 4000) {
			setHeight(num);
		} else if (value === "") {
			setHeight(1);
		}
	};

	return (
		<div className={`gap-6 ${styles.container}`}>
			{/* Settings */}
			<div className={`flex flex-col gap-6 ${styles.settingsPanel}`}>
				{/* Size Presets */}
				<div className={styles.glassCard}>
					<h2 className={styles.sectionTitle}>Size Presets</h2>
					<div className="grid grid-cols-2 gap-3">
						{SIZE_PRESETS.map((preset) => (
							<button
								key={preset.label}
								className={`${styles.presetBtn} ${
									width === preset.width &&
									height === preset.height
										? styles.active
										: ""
								}`}
								onClick={() => handlePresetClick(preset)}
							>
								{preset.label}
							</button>
						))}
					</div>
				</div>

				{/* Custom Dimensions */}
				<div className={styles.glassCard}>
					<h2 className={styles.sectionTitle}>Custom Dimensions</h2>
					<div className="grid grid-cols-2 gap-4">
						<div>
							<label className={styles.inputLabel}>
								Width (px)
							</label>
							<input
								type="number"
								inputMode="numeric"
								min="1"
								max="4000"
								value={width}
								onChange={(e) =>
									handleWidthChange(e.target.value)
								}
								className={styles.input}
							/>
						</div>
						<div>
							<label className={styles.inputLabel}>
								Height (px)
							</label>
							<input
								type="number"
								inputMode="numeric"
								min="1"
								max="4000"
								value={height}
								onChange={(e) =>
									handleHeightChange(e.target.value)
								}
								className={styles.input}
							/>
						</div>
					</div>
				</div>

				{/* Pattern Style */}
				<div className={styles.glassCard}>
					<h2 className={styles.sectionTitle}>Pattern Style</h2>
					<div className="grid grid-cols-2 gap-3">
						{PATTERN_OPTIONS.map((opt) => (
							<button
								key={opt.value}
								className={`${styles.presetBtn} ${
									pattern === opt.value ? styles.active : ""
								}`}
								onClick={() => setPattern(opt.value)}
							>
								{opt.label}
							</button>
						))}
					</div>
				</div>

				{/* Colors */}
				<div className={styles.glassCard}>
					<div className="flex items-center justify-between mb-4">
						<h2 className={`!mb-0 ${styles.sectionTitle}`}>
							Colors
						</h2>
						<button
							className={styles.randomBtn}
							onClick={handleRandomColors}
							title="Randomize colors"
						>
							<ArrowPathIcon className="w-4 h-4" />
							Random
						</button>
					</div>

					<div className="flex flex-col gap-4">
						<div>
							<label className={styles.inputLabel}>
								Background Color
							</label>
							<div className="flex gap-3 items-center">
								<ColorPickerPopover
									color={bgColor}
									onChange={setBgColor}
									swatchSize="sm"
								/>
								<input
									type="text"
									value={bgColor}
									onChange={(e) => setBgColor(e.target.value)}
									className={`flex-1 rounded-md text-sm ${styles.colorTextInput}`}
								/>
							</div>
						</div>

						<div>
							<label className={styles.inputLabel}>
								Text Color
							</label>
							<div className="flex gap-3 items-center">
								<ColorPickerPopover
									color={textColor}
									onChange={setTextColor}
									swatchSize="sm"
								/>
								<input
									type="text"
									value={textColor}
									onChange={(e) =>
										setTextColor(e.target.value)
									}
									className={`flex-1 rounded-md text-sm ${styles.colorTextInput}`}
								/>
							</div>
						</div>

						{pattern === "gradient" && (
							<div>
								<label className={styles.inputLabel}>
									Gradient End Color
								</label>
								<div className="flex gap-3 items-center">
									<ColorPickerPopover
										color={gradientColor}
										onChange={setGradientColor}
										swatchSize="sm"
									/>
									<input
										type="text"
										value={gradientColor}
										onChange={(e) =>
											setGradientColor(e.target.value)
										}
										className={`flex-1 rounded-md text-sm ${styles.colorTextInput}`}
									/>
								</div>
							</div>
						)}
					</div>
				</div>

				{/* Custom Text */}
				<div className={styles.glassCard}>
					<h2 className={styles.sectionTitle}>Custom Text</h2>
					<input
						type="text"
						value={customText}
						onChange={(e) => setCustomText(e.target.value)}
						placeholder={`${width} × ${height}`}
						className={styles.input}
					/>
					<p className={`mt-2 text-xs ${styles.hint}`}>
						Leave empty to show dimensions
					</p>
				</div>
			</div>

			{/* Preview */}
			<div className={`flex flex-col ${styles.previewPanel}`}>
				<div className={styles.glassCard}>
					<div className="flex items-start justify-between mb-6 gap-4">
						<div>
							<h2 className={styles.sectionTitle}>Preview</h2>
							<p
								className={`mt-1 text-sm ${styles.previewInfo}`}
							>
								{width} × {height}px
							</p>
						</div>
						<button
							className={`whitespace-nowrap ${styles.downloadBtn}`}
							onClick={handleDownload}
						>
							<ArrowDownTrayIcon className="w-5 h-5" />
							Download PNG
						</button>
					</div>

					<div
						className={`flex items-center justify-center rounded-lg mb-6 ${styles.previewContainer}`}
					>
						<canvas
							ref={previewCanvasRef}
							className={`max-w-full rounded-md ${styles.previewCanvas}`}
						/>
					</div>

					<div
						className={`flex items-start gap-4 p-4 rounded-md ${styles.infoBox}`}
					>
						<PhotoIcon
							className={`w-6 h-6 shrink-0 ${styles.infoIcon}`}
						/>
						<p className={styles.infoText}>
							All images are generated client-side using the
							Canvas API. No data is sent to any server. Download
							as PNG for lossless quality.
						</p>
					</div>
				</div>
			</div>

			{/* Hidden full-size canvas */}
			<canvas ref={canvasRef} style={{ display: "none" }} />
		</div>
	);
}
