"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
	ClipboardDocumentIcon,
	CheckIcon,
	EyeDropperIcon,
	SwatchIcon,
	PhotoIcon,
} from "@heroicons/react/24/outline";
import { ColorUtils } from "@/lib/colorUtils";
import styles from "./ImageColorExtractor.module.scss";

// ---------- Types ----------

interface ExtractedColor {
	hex: string;
	rgb: [number, number, number];
	hsl: [number, number, number];
	count: number;
}

type ExportFormat = "css" | "scss" | "tailwind" | "json";

// ---------- Color Quantization ----------

function extractColors(imageData: ImageData, numColors: number): ExtractedColor[] {
	const data = imageData.data;
	const totalPixels = data.length / 4;

	// 1. Sample pixels (every Nth pixel for performance on large images)
	const sampleStep = Math.max(1, Math.floor(totalPixels / 50000));
	const buckets = new Map<string, { r: number; g: number; b: number; count: number }>();

	for (let i = 0; i < data.length; i += 4 * sampleStep) {
		const r = data[i];
		const g = data[i + 1];
		const b = data[i + 2];
		const a = data[i + 3];

		// Skip fully transparent pixels
		if (a < 128) continue;

		// 2. Reduce to 5-bit color space (32 levels per channel)
		const qr = (r >> 3) << 3;
		const qg = (g >> 3) << 3;
		const qb = (b >> 3) << 3;
		const key = `${qr},${qg},${qb}`;

		const existing = buckets.get(key);
		if (existing) {
			// Accumulate actual colors for averaging
			existing.r += r;
			existing.g += g;
			existing.b += b;
			existing.count += 1;
		} else {
			buckets.set(key, { r, g, b, count: 1 });
		}
	}

	// 3. Sort buckets by count (most frequent first)
	const sorted = Array.from(buckets.values()).sort((a, b) => b.count - a.count);

	// 4. Merge similar colors (within distance threshold)
	const merged: { r: number; g: number; b: number; count: number }[] = [];
	const threshold = 50; // Euclidean distance threshold

	for (const bucket of sorted) {
		const avgR = Math.round(bucket.r / bucket.count);
		const avgG = Math.round(bucket.g / bucket.count);
		const avgB = Math.round(bucket.b / bucket.count);

		let wasMerged = false;
		for (const existing of merged) {
			const eR = existing.r;
			const eG = existing.g;
			const eB = existing.b;
			const dist = Math.sqrt((avgR - eR) ** 2 + (avgG - eG) ** 2 + (avgB - eB) ** 2);

			if (dist < threshold) {
				// Weight-average toward the more dominant color
				const totalCount = existing.count + bucket.count;
				existing.r = Math.round((existing.r * existing.count + avgR * bucket.count) / totalCount);
				existing.g = Math.round((existing.g * existing.count + avgG * bucket.count) / totalCount);
				existing.b = Math.round((existing.b * existing.count + avgB * bucket.count) / totalCount);
				existing.count = totalCount;
				wasMerged = true;
				break;
			}
		}

		if (!wasMerged) {
			merged.push({ r: avgR, g: avgG, b: avgB, count: bucket.count });
		}
	}

	// 5. Sort merged by count and return top N
	merged.sort((a, b) => b.count - a.count);

	return merged.slice(0, numColors).map((c) => {
		const r = Math.max(0, Math.min(255, c.r));
		const g = Math.max(0, Math.min(255, c.g));
		const b = Math.max(0, Math.min(255, c.b));
		const hex = ColorUtils.rgbToHex(r, g, b);
		const hsl = ColorUtils.rgbToHsl(r, g, b);
		return { hex, rgb: [r, g, b], hsl, count: c.count };
	});
}

// ---------- Export Helpers ----------

function generateExport(colors: ExtractedColor[], format: ExportFormat): string {
	switch (format) {
		case "css":
			return `:root {\n${colors.map((c, i) => `  --color-${i + 1}: ${c.hex};`).join("\n")}\n}`;
		case "scss":
			return colors.map((c, i) => `$color-${i + 1}: ${c.hex};`).join("\n");
		case "tailwind":
			return `// tailwind.config.js\nmodule.exports = {\n  theme: {\n    extend: {\n      colors: {\n        palette: {\n${colors.map((c, i) => `          '${i + 1}': '${c.hex}',`).join("\n")}\n        },\n      },\n    },\n  },\n};`;
		case "json":
			return JSON.stringify(
				colors.map((c) => ({
					hex: c.hex,
					rgb: `rgb(${c.rgb[0]}, ${c.rgb[1]}, ${c.rgb[2]})`,
					hsl: `hsl(${c.hsl[0]}, ${c.hsl[1]}%, ${c.hsl[2]}%)`,
				})),
				null,
				2
			);
		default:
			return "";
	}
}

// ---------- Component ----------

export default function ImageColorExtractor() {
	const [imageSrc, setImageSrc] = useState<string | null>(null);
	const [colors, setColors] = useState<ExtractedColor[]>([]);
	const [numColors, setNumColors] = useState(8);
	const [isDragging, setIsDragging] = useState(false);
	const [hoverColor, setHoverColor] = useState<{ hex: string; x: number; y: number } | null>(null);
	const [pickedColor, setPickedColor] = useState<ExtractedColor | null>(null);
	const [exportFormat, setExportFormat] = useState<ExportFormat>("css");
	const [copiedIndex, setCopiedIndex] = useState<string | null>(null);
	const [copiedExport, setCopiedExport] = useState(false);

	const canvasRef = useRef<HTMLCanvasElement>(null);
	const imageRef = useRef<HTMLImageElement>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	// Process image when loaded or numColors changes
	const processImage = useCallback(
		(img: HTMLImageElement) => {
			const canvas = canvasRef.current;
			if (!canvas) return;

			canvas.width = img.naturalWidth;
			canvas.height = img.naturalHeight;

			const ctx = canvas.getContext("2d", { willReadFrequently: true });
			if (!ctx) return;

			ctx.drawImage(img, 0, 0);
			const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
			const extracted = extractColors(imageData, numColors);
			setColors(extracted);
		},
		[numColors]
	);

	// Re-extract when numColors changes and we have an image
	useEffect(() => {
		if (imageSrc && imageRef.current && imageRef.current.complete) {
			processImage(imageRef.current);
		}
	}, [numColors, processImage, imageSrc]);

	const handleFile = useCallback(
		(file: File) => {
			if (!file.type.startsWith("image/")) return;

			const reader = new FileReader();
			reader.onload = (e) => {
				const src = e.target?.result as string;
				setImageSrc(src);
				setPickedColor(null);

				const img = new Image();
				img.onload = () => processImage(img);
				img.src = src;
			};
			reader.readAsDataURL(file);
		},
		[processImage]
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

	// Get pixel color at mouse position on the displayed image
	const getColorAtPosition = useCallback(
		(e: React.MouseEvent<HTMLImageElement>) => {
			const canvas = canvasRef.current;
			const img = imageRef.current;
			if (!canvas || !img) return null;

			const rect = img.getBoundingClientRect();
			const scaleX = canvas.width / rect.width;
			const scaleY = canvas.height / rect.height;

			const x = Math.floor((e.clientX - rect.left) * scaleX);
			const y = Math.floor((e.clientY - rect.top) * scaleY);

			const ctx = canvas.getContext("2d", { willReadFrequently: true });
			if (!ctx) return null;

			const pixel = ctx.getImageData(x, y, 1, 1).data;
			const r = pixel[0];
			const g = pixel[1];
			const b = pixel[2];
			const hex = ColorUtils.rgbToHex(r, g, b);

			return { hex, r, g, b, clientX: e.clientX, clientY: e.clientY, rectLeft: rect.left, rectTop: rect.top };
		},
		[]
	);

	const handleImageMouseMove = useCallback(
		(e: React.MouseEvent<HTMLImageElement>) => {
			const result = getColorAtPosition(e);
			if (!result) return;

			const img = imageRef.current;
			if (!img) return;
			const rect = img.getBoundingClientRect();

			setHoverColor({
				hex: result.hex,
				x: e.clientX - rect.left,
				y: e.clientY - rect.top,
			});
		},
		[getColorAtPosition]
	);

	const handleImageMouseLeave = useCallback(() => {
		setHoverColor(null);
	}, []);

	const handleImageClick = useCallback(
		(e: React.MouseEvent<HTMLImageElement>) => {
			const result = getColorAtPosition(e);
			if (!result) return;

			const rgb: [number, number, number] = [result.r, result.g, result.b];
			const hsl = ColorUtils.rgbToHsl(result.r, result.g, result.b);
			setPickedColor({ hex: result.hex, rgb, hsl, count: 0 });
		},
		[getColorAtPosition]
	);

	const copyToClipboard = useCallback(async (text: string, key: string) => {
		try {
			await navigator.clipboard.writeText(text);
			setCopiedIndex(key);
			setTimeout(() => setCopiedIndex(null), 1500);
		} catch (err) {
			console.error("Failed to copy:", err);
		}
	}, []);

	const copyExport = useCallback(async () => {
		try {
			const text = generateExport(colors, exportFormat);
			await navigator.clipboard.writeText(text);
			setCopiedExport(true);
			setTimeout(() => setCopiedExport(false), 1500);
		} catch (err) {
			console.error("Failed to copy:", err);
		}
	}, [colors, exportFormat]);

	const removeImage = useCallback(() => {
		setImageSrc(null);
		setColors([]);
		setPickedColor(null);
		setHoverColor(null);
		if (fileInputRef.current) fileInputRef.current.value = "";
	}, []);

	const formatRgb = (rgb: [number, number, number]) => `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
	const formatHsl = (hsl: [number, number, number]) => `hsl(${hsl[0]}, ${hsl[1]}%, ${hsl[2]}%)`;

	return (
		<div className={styles.container}>
			{/* Left Column - Image & Controls */}
			<div className="flex flex-col gap-6">
				{/* Upload / Image Preview */}
				<div className={styles.glassCard}>
					<h2 className={styles.sectionTitle}>
						<SwatchIcon className="w-5 h-5 inline-block mr-2 align-text-bottom" />
						Image Color Extractor
					</h2>

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
						<div className="flex flex-col gap-4">
							<div className="flex items-center justify-between">
								<p className={styles.infoText}>Click on the image to pick a specific color</p>
								<button className={styles.removeBtn} onClick={removeImage}>
									Remove
								</button>
							</div>
							<div className={styles.imagePreviewContainer}>
								<img
									ref={imageRef}
									src={imageSrc}
									alt="Uploaded image"
									className={`w-full ${styles.imagePreview}`}
									onMouseMove={handleImageMouseMove}
									onMouseLeave={handleImageMouseLeave}
									onClick={handleImageClick}
								/>
								{hoverColor && (
									<div
										className={`flex items-center gap-2 ${styles.hoverInfo}`}
										style={{
											left: Math.min(hoverColor.x + 16, (imageRef.current?.offsetWidth ?? 300) - 120),
											top: hoverColor.y + 16,
										}}
									>
										<div
											className={styles.hoverSwatch}
											style={{ backgroundColor: hoverColor.hex, width: 18, height: 18 }}
										/>
										<span className={styles.hoverHex}>{hoverColor.hex}</span>
									</div>
								)}
							</div>
						</div>
					)}

					<input
						ref={fileInputRef}
						type="file"
						accept="image/*"
						className="hidden"
						onChange={handleFileInput}
						aria-label="Upload image for color extraction"
					/>
				</div>

				{/* Picked Color */}
				{pickedColor && (
					<div className={styles.glassCard}>
						<h2 className={styles.sectionTitle}>
							<EyeDropperIcon className="w-5 h-5 inline-block mr-2 align-text-bottom" />
							Picked Color
						</h2>
						<div className={`flex items-center gap-4 p-3 ${styles.pickedColor}`}>
							<div
								className={styles.pickedSwatch}
								style={{ backgroundColor: pickedColor.hex, width: 48, height: 48, flexShrink: 0 }}
							/>
							<div className="flex flex-col gap-1 flex-1 min-w-0">
								<div className="flex items-center gap-2">
									<span className={`text-sm font-medium ${styles.pickedHex}`}>{pickedColor.hex}</span>
									<button
										className={styles.copyBtn}
										onClick={() => copyToClipboard(pickedColor.hex, "picked-hex")}
										title="Copy HEX"
									>
										{copiedIndex === "picked-hex" ? (
											<CheckIcon className={styles.copyIcon} />
										) : (
											<ClipboardDocumentIcon className={styles.copyIcon} />
										)}
									</button>
								</div>
								<span className={styles.pickedLabel}>
									{formatRgb(pickedColor.rgb)} | {formatHsl(pickedColor.hsl)}
								</span>
							</div>
						</div>
					</div>
				)}

				{/* Number of Colors Slider */}
				{imageSrc && (
					<div className={styles.glassCard}>
						<div className="flex items-center justify-between mb-3">
							<label className={styles.inputLabel}>Colors to Extract</label>
							<span className="text-sm font-mono font-medium" style={{ color: "var(--text-primary)" }}>
								{numColors}
							</span>
						</div>
						<input
							type="range"
							min={5}
							max={12}
							value={numColors}
							onChange={(e) => setNumColors(parseInt(e.target.value, 10))}
							className={styles.slider}
						/>
					</div>
				)}
			</div>

			{/* Right Column - Extracted Palette & Export */}
			<div className="flex flex-col gap-6">
				{/* Extracted Colors */}
				<div className={styles.glassCard}>
					<h2 className={styles.sectionTitle}>
						<SwatchIcon className="w-5 h-5 inline-block mr-2 align-text-bottom" />
						Extracted Palette
					</h2>

					{colors.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-12 gap-3">
							<PhotoIcon className={`w-10 h-10 ${styles.dropIcon}`} />
							<p className={`text-sm text-center ${styles.dropHint}`}>
								Upload an image to extract its color palette
							</p>
						</div>
					) : (
						<div className="flex flex-col gap-3">
							{colors.map((color, index) => (
								<div key={`${color.hex}-${index}`} className={`flex items-center gap-3 p-3 ${styles.colorCard}`}>
									<div
										className={styles.colorSwatch}
										style={{ backgroundColor: color.hex, width: 40, height: 40, flexShrink: 0 }}
									/>
									<div className="flex flex-col gap-1 flex-1 min-w-0">
										{/* HEX row */}
										<div className="flex items-center gap-2">
											<span className={`font-medium ${styles.colorValue}`} style={{ fontSize: "0.8rem" }}>
												{color.hex}
											</span>
											<button
												className={styles.copyBtn}
												onClick={() => copyToClipboard(color.hex, `hex-${index}`)}
												title="Copy HEX"
											>
												{copiedIndex === `hex-${index}` ? (
													<CheckIcon className={styles.copyIcon} />
												) : (
													<ClipboardDocumentIcon className={styles.copyIcon} />
												)}
											</button>
										</div>
										{/* RGB row */}
										<div className="flex items-center gap-2">
											<span className={styles.colorLabel}>RGB</span>
											<span className={styles.colorValue}>{formatRgb(color.rgb)}</span>
											<button
												className={styles.copyBtn}
												onClick={() => copyToClipboard(formatRgb(color.rgb), `rgb-${index}`)}
												title="Copy RGB"
											>
												{copiedIndex === `rgb-${index}` ? (
													<CheckIcon className={styles.copyIcon} />
												) : (
													<ClipboardDocumentIcon className={styles.copyIcon} />
												)}
											</button>
										</div>
										{/* HSL row */}
										<div className="flex items-center gap-2">
											<span className={styles.colorLabel}>HSL</span>
											<span className={styles.colorValue}>{formatHsl(color.hsl)}</span>
											<button
												className={styles.copyBtn}
												onClick={() => copyToClipboard(formatHsl(color.hsl), `hsl-${index}`)}
												title="Copy HSL"
											>
												{copiedIndex === `hsl-${index}` ? (
													<CheckIcon className={styles.copyIcon} />
												) : (
													<ClipboardDocumentIcon className={styles.copyIcon} />
												)}
											</button>
										</div>
									</div>
								</div>
							))}
						</div>
					)}
				</div>

				{/* Export Section */}
				{colors.length > 0 && (
					<div className={styles.glassCard}>
						<h2 className={styles.sectionTitle}>Export Palette</h2>
						<div className="flex flex-col gap-4">
							<div>
								<label className={styles.inputLabel}>Format</label>
								<select
									value={exportFormat}
									onChange={(e) => setExportFormat(e.target.value as ExportFormat)}
									className={styles.exportSelect}
								>
									<option value="css">CSS Variables</option>
									<option value="scss">SCSS Variables</option>
									<option value="tailwind">Tailwind Config</option>
									<option value="json">JSON Array</option>
								</select>
							</div>

							<div className="relative">
								<pre className={`p-4 ${styles.exportCode}`}>
									{generateExport(colors, exportFormat)}
								</pre>
								<button
									className={`absolute top-2 right-2 ${styles.copyBtn} ${copiedExport ? "copied" : ""}`}
									onClick={copyExport}
									title="Copy to clipboard"
								>
									{copiedExport ? (
										<CheckIcon className={styles.copyIcon} />
									) : (
										<ClipboardDocumentIcon className={styles.copyIcon} />
									)}
								</button>
							</div>
						</div>
					</div>
				)}

				{/* Info Box */}
				<div className={styles.glassCard}>
					<div className={`flex items-start gap-4 p-4 ${styles.infoBox}`}>
						<SwatchIcon className={`w-6 h-6 shrink-0 ${styles.infoIcon}`} />
						<p className={styles.infoText}>
							Upload any image to extract its dominant colors. Adjust the slider to control how many colors are extracted. Click anywhere on the image to pick a specific pixel color. All processing happens in your browser.
						</p>
					</div>
				</div>
			</div>

			{/* Hidden canvas for pixel analysis */}
			<canvas ref={canvasRef} style={{ display: "none" }} />
		</div>
	);
}
