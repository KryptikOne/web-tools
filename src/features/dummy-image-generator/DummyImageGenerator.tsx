"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ArrowDownTrayIcon, ArrowPathIcon, PhotoIcon } from "@heroicons/react/24/outline";
import { ColorPickerPopover } from "@/components/ColorPickerPopover";
import styles from "./DummyImageGenerator.module.scss";

const SIZE_PRESETS = [
	{ label: "300 × 300", width: 300, height: 300 },
	{ label: "600 × 400", width: 600, height: 400 },
	{ label: "800 × 600", width: 800, height: 600 },
	{ label: "1024 × 768", width: 1024, height: 768 },
	{ label: "1280 × 720 (HD)", width: 1280, height: 720 },
	{ label: "1920 × 1080 (Full HD)", width: 1920, height: 1080 },
	{ label: "2560 × 1440 (2K)", width: 2560, height: 1440 },
	{ label: "3840 × 2160 (4K)", width: 3840, height: 2160 },
	{ label: "1200 × 630 (OG Image)", width: 1200, height: 630 },
	{ label: "1080 × 1080 (Instagram)", width: 1080, height: 1080 },
];

type ImageFormat = "png" | "jpeg" | "webp";
type PatternStyle = "solid" | "gradient" | "noise" | "crosshatch";

const PATTERN_OPTIONS: { value: PatternStyle; label: string }[] = [
	{ value: "solid", label: "Solid" },
	{ value: "gradient", label: "Gradient" },
	{ value: "noise", label: "Noise" },
	{ value: "crosshatch", label: "Crosshatch" },
];

function randomHexColor(): string {
	return "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0");
}

export default function DummyImageGenerator() {
	const [width, setWidth] = useState<number>(1920);
	const [height, setHeight] = useState<number>(1080);
	const [backgroundColor, setBackgroundColor] = useState<string>("#3b82f6");
	const [textColor, setTextColor] = useState<string>("#ffffff");
	const [gradientColor, setGradientColor] = useState<string>("#8b5cf6");
	const [format, setFormat] = useState<ImageFormat>("png");
	const [pattern, setPattern] = useState<PatternStyle>("solid");
	const [customText, setCustomText] = useState<string>("");
	const [fileSize, setFileSize] = useState<string>("");
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const previewCanvasRef = useRef<HTMLCanvasElement>(null);

	const displayText = customText || `${width} × ${height}`;

	const autoFontSize = useCallback(
		(w: number, h: number): number => {
			const minDim = Math.min(w, h);
			const textLen = displayText.length;
			const baseFontSize = minDim / 8;
			const lengthScale = Math.max(0.4, 1 - (textLen - 10) * 0.03);
			return Math.max(10, Math.min(baseFontSize * lengthScale, (w * 0.85) / (textLen * 0.55)));
		},
		[displayText]
	);

	const updatePreview = useCallback(() => {
		const canvas = canvasRef.current;
		const previewCanvas = previewCanvasRef.current;
		if (!canvas || !previewCanvas) return;

		const maxPreviewWidth = 800;
		const maxPreviewHeight = 600;
		let scale = 1;

		if (width > maxPreviewWidth || height > maxPreviewHeight) {
			scale = Math.min(maxPreviewWidth / width, maxPreviewHeight / height);
		}

		previewCanvas.width = width * scale;
		previewCanvas.height = height * scale;

		const ctx = previewCanvas.getContext("2d");
		if (!ctx) return;

		ctx.drawImage(canvas, 0, 0, width * scale, height * scale);
	}, [width, height]);

	const updateFileSize = useCallback(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		try {
			const mimeType = format === "jpeg" ? "image/jpeg" : format === "webp" ? "image/webp" : "image/png";
			const quality = format === "jpeg" ? 0.92 : 0.9;
			const dataUrl = canvas.toDataURL(mimeType, quality);

			const base64Length = dataUrl.split(",")[1].length;
			const sizeInBytes = (base64Length * 3) / 4;

			if (sizeInBytes < 1024) {
				setFileSize(`${sizeInBytes.toFixed(0)} B`);
			} else if (sizeInBytes < 1024 * 1024) {
				setFileSize(`${(sizeInBytes / 1024).toFixed(2)} KB`);
			} else {
				setFileSize(`${(sizeInBytes / (1024 * 1024)).toFixed(2)} MB`);
			}
		} catch (err) {
			console.error("Error calculating file size:", err);
			setFileSize("N/A");
		}
	}, [format]);

	const drawPattern = useCallback(
		(ctx: CanvasRenderingContext2D, w: number, h: number) => {
			switch (pattern) {
				case "solid":
					ctx.fillStyle = backgroundColor;
					ctx.fillRect(0, 0, w, h);
					break;

				case "gradient": {
					const grad = ctx.createLinearGradient(0, 0, w, h);
					grad.addColorStop(0, backgroundColor);
					grad.addColorStop(1, gradientColor);
					ctx.fillStyle = grad;
					ctx.fillRect(0, 0, w, h);
					break;
				}

				case "noise": {
					ctx.fillStyle = backgroundColor;
					ctx.fillRect(0, 0, w, h);
					const imageData = ctx.getImageData(0, 0, w, h);
					const data = imageData.data;
					for (let i = 0; i < data.length; i += 4) {
						const n = (Math.random() - 0.5) * 80;
						data[i] = Math.max(0, Math.min(255, data[i] + n));
						data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + n));
						data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + n));
					}
					ctx.putImageData(imageData, 0, 0);
					break;
				}

				case "crosshatch": {
					ctx.fillStyle = backgroundColor;
					ctx.fillRect(0, 0, w, h);
					const spacing = Math.max(8, Math.min(w, h) / 30);
					ctx.strokeStyle = textColor + "30";
					ctx.lineWidth = 1;
					for (let i = -h; i < w + h; i += spacing) {
						ctx.beginPath();
						ctx.moveTo(i, 0);
						ctx.lineTo(i + h, h);
						ctx.stroke();
					}
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
		[backgroundColor, gradientColor, textColor, pattern]
	);

	const generateImage = useCallback(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

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

		updatePreview();
		updateFileSize();
	}, [width, height, textColor, displayText, drawPattern, autoFontSize, updatePreview, updateFileSize]);

	const handleDownload = () => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const mimeType = format === "jpeg" ? "image/jpeg" : format === "webp" ? "image/webp" : "image/png";
		const quality = format === "jpeg" ? 0.92 : 0.9;

		canvas.toBlob(
			(blob) => {
				if (!blob) return;
				const url = URL.createObjectURL(blob);
				const link = document.createElement("a");
				link.download = `placeholder-${width}x${height}.${format}`;
				link.href = url;
				link.click();
				URL.revokeObjectURL(url);
			},
			mimeType,
			quality
		);
	};

	const handleRandomColors = () => {
		setBackgroundColor(randomHexColor());
		setTextColor(randomHexColor());
		setGradientColor(randomHexColor());
	};

	const handlePresetClick = (preset: { width: number; height: number }) => {
		setWidth(preset.width);
		setHeight(preset.height);
	};

	useEffect(() => {
		generateImage();
	}, [generateImage]);

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
		if (!isNaN(num) && num >= 1 && num <= 3000) {
			setHeight(num);
		} else if (value === "") {
			setHeight(1);
		}
	};

	return (
		<div className={`gap-6 ${styles.container}`}>
			{/* Settings Section */}
			<div className={`flex flex-col gap-6 ${styles.settingsPanel}`}>
				{/* Size Presets */}
				<div className={styles.glassCard}>
					<h2 className={styles.sectionTitle}>Size Presets</h2>
					<div className={`grid grid-cols-2 gap-3 ${styles.presetsGrid}`}>
						{SIZE_PRESETS.map((preset) => (
							<button
								key={preset.label}
								className={`${styles.presetBtn} ${width === preset.width && height === preset.height ? styles.active : ""}`}
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
					<div className={`grid grid-cols-2 gap-4 ${styles.dimensionsGrid}`}>
						<div className={styles.inputGroup}>
							<label className={styles.inputLabel}>Width (1-4000px)</label>
							<input type="number" inputMode="numeric" min="1" max="4000" value={width} onChange={(e) => handleWidthChange(e.target.value)} className={styles.input} />
						</div>
						<div className={styles.inputGroup}>
							<label className={styles.inputLabel}>Height (1-3000px)</label>
							<input type="number" inputMode="numeric" min="1" max="3000" value={height} onChange={(e) => handleHeightChange(e.target.value)} className={styles.input} />
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
								className={`${styles.presetBtn} ${pattern === opt.value ? styles.active : ""}`}
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
						<h2 className={`mb-0! ${styles.sectionTitle}`}>Colors</h2>
						<button className={styles.randomBtn} onClick={handleRandomColors} title="Randomize colors">
							<ArrowPathIcon className="w-4 h-4" />
							Random
						</button>
					</div>
					<div className={`grid grid-cols-1 gap-4 ${styles.colorsGrid}`}>
						<div className={styles.inputGroup}>
							<label className={styles.inputLabel}>Background Color</label>
							<div className={`flex gap-3 items-center ${styles.colorInputWrapper}`}>
								<ColorPickerPopover color={backgroundColor} onChange={setBackgroundColor} swatchSize="sm" />
								<input type="text" value={backgroundColor} onChange={(e) => setBackgroundColor(e.target.value)} className={`flex-1 text-sm ${styles.colorTextInput}`} />
							</div>
						</div>
						<div className={styles.inputGroup}>
							<label className={styles.inputLabel}>Text Color</label>
							<div className={`flex gap-3 items-center ${styles.colorInputWrapper}`}>
								<ColorPickerPopover color={textColor} onChange={setTextColor} swatchSize="sm" />
								<input type="text" value={textColor} onChange={(e) => setTextColor(e.target.value)} className={`flex-1 text-sm ${styles.colorTextInput}`} />
							</div>
						</div>
						{pattern === "gradient" && (
							<div className={styles.inputGroup}>
								<label className={styles.inputLabel}>Gradient End Color</label>
								<div className={`flex gap-3 items-center ${styles.colorInputWrapper}`}>
									<ColorPickerPopover color={gradientColor} onChange={setGradientColor} swatchSize="sm" />
									<input type="text" value={gradientColor} onChange={(e) => setGradientColor(e.target.value)} className={`flex-1 text-sm ${styles.colorTextInput}`} />
								</div>
							</div>
						)}
					</div>
				</div>

				{/* Custom Text & Format */}
				<div className={styles.glassCard}>
					<h2 className={styles.sectionTitle}>Text & Format</h2>
					<div className={styles.inputGroup}>
						<label className={styles.inputLabel}>Custom Text</label>
						<input
							type="text"
							value={customText}
							onChange={(e) => setCustomText(e.target.value)}
							placeholder={`${width} × ${height}`}
							className={styles.input}
						/>
						<p className={`mt-1 text-xs ${styles.inputHint}`}>Leave empty to show dimensions</p>
					</div>
					<div className={styles.inputGroup}>
						<label className={styles.inputLabel}>Output Format</label>
						<div className={`grid grid-cols-3 gap-2 ${styles.formatButtons}`}>
							<button className={`${styles.formatBtn} ${format === "png" ? styles.active : ""}`} onClick={() => setFormat("png")}>
								PNG
							</button>
							<button className={`${styles.formatBtn} ${format === "jpeg" ? styles.active : ""}`} onClick={() => setFormat("jpeg")}>
								JPEG
							</button>
							<button className={`${styles.formatBtn} ${format === "webp" ? styles.active : ""}`} onClick={() => setFormat("webp")}>
								WebP
							</button>
						</div>
					</div>
				</div>
			</div>

			{/* Preview Section */}
			<div className={`flex flex-col ${styles.previewPanel}`}>
				<div className={styles.glassCard}>
					<div className={`flex items-start justify-between mb-6 gap-4 ${styles.previewHeader}`}>
						<div>
							<h2 className={styles.sectionTitle}>Preview</h2>
							<p className={`mt-1 text-sm ${styles.previewInfo}`}>
								{width} × {height}px • {fileSize}
							</p>
						</div>
						<button className={`whitespace-nowrap ${styles.downloadBtn}`} onClick={handleDownload}>
							<ArrowDownTrayIcon className={`w-5 h-5 ${styles.downloadIcon}`} />
							Download
						</button>
					</div>

					<div className={`flex items-center justify-center mb-6 ${styles.previewContainer}`}>
						<canvas ref={previewCanvasRef} className={`max-w-full ${styles.previewCanvas}`} />
					</div>

					<div className={`flex items-start gap-4 p-4 ${styles.infoBox}`}>
						<PhotoIcon className={`w-6 h-6 shrink-0 ${styles.infoIcon}`} />
						<p className={styles.infoText}>
							Generated images are perfect for mockups, wireframes, and testing. All processing happens in your browser - no uploads required.
						</p>
					</div>
				</div>
			</div>

			{/* Hidden canvas for full-size generation */}
			<canvas ref={canvasRef} style={{ display: "none" }} />
		</div>
	);
}
