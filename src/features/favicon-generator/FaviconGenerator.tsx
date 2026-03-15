"use client";

import { useState, useRef, useCallback } from "react";
import {
	ArrowDownTrayIcon,
	ArrowUpTrayIcon,
	ClipboardDocumentIcon,
	CheckIcon,
	ExclamationTriangleIcon,
	InformationCircleIcon,
	TrashIcon,
} from "@heroicons/react/24/outline";
import { ColorPickerPopover } from "@/components/ColorPickerPopover";
import styles from "./FaviconGenerator.module.scss";

interface FaviconSize {
	width: number;
	height: number;
	label: string;
	filename: string;
	description: string;
}

const FAVICON_SIZES: FaviconSize[] = [
	{ width: 16, height: 16, label: "16x16", filename: "favicon-16x16.png", description: "Standard favicon" },
	{ width: 32, height: 32, label: "32x32", filename: "favicon-32x32.png", description: "Standard favicon" },
	{ width: 48, height: 48, label: "48x48", filename: "favicon-48x48.png", description: "Windows site" },
	{ width: 64, height: 64, label: "64x64", filename: "favicon-64x64.png", description: "General use" },
	{ width: 128, height: 128, label: "128x128", filename: "favicon-128x128.png", description: "Chrome Web Store" },
	{ width: 180, height: 180, label: "180x180", filename: "apple-touch-icon.png", description: "Apple Touch Icon" },
	{ width: 192, height: 192, label: "192x192", filename: "android-chrome-192x192.png", description: "Android Chrome" },
	{ width: 512, height: 512, label: "512x512", filename: "android-chrome-512x512.png", description: "Android Chrome" },
];

function generateMetaTags(): string {
	return `<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="48x48" href="/favicon-48x48.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="icon" type="image/png" sizes="192x192" href="/android-chrome-192x192.png">
<link rel="icon" type="image/png" sizes="512x512" href="/android-chrome-512x512.png">`;
}

export default function FaviconGenerator() {
	const [sourceImage, setSourceImage] = useState<HTMLImageElement | null>(null);
	const [sourceUrl, setSourceUrl] = useState<string>("");
	const [isSquare, setIsSquare] = useState(true);
	const [useBgColor, setUseBgColor] = useState(false);
	const [bgColorValue, setBgColorValue] = useState("#ffffff");
	const [borderRadius, setBorderRadius] = useState(0);
	const [generatedFavicons, setGeneratedFavicons] = useState<Map<string, string>>(new Map());
	const [isDragOver, setIsDragOver] = useState(false);
	const [copied, setCopied] = useState(false);

	const fileInputRef = useRef<HTMLInputElement>(null);
	const canvasRef = useRef<HTMLCanvasElement>(null);

	const loadImage = useCallback((file: File) => {
		if (!file.type.startsWith("image/")) return;

		const reader = new FileReader();
		reader.onload = (e) => {
			const img = new Image();
			img.onload = () => {
				setSourceImage(img);
				setSourceUrl(e.target?.result as string);
				setIsSquare(img.width === img.height);
				setGeneratedFavicons(new Map());
			};
			img.src = e.target?.result as string;
		};
		reader.readAsDataURL(file);
	}, []);

	const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) loadImage(file);
	};

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault();
		setIsDragOver(false);
		const file = e.dataTransfer.files?.[0];
		if (file) loadImage(file);
	};

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
		setIsDragOver(true);
	};

	const handleDragLeave = () => {
		setIsDragOver(false);
	};

	const generateFavicons = useCallback(() => {
		if (!sourceImage) return;

		const canvas = canvasRef.current;
		if (!canvas) return;

		const newFavicons = new Map<string, string>();

		FAVICON_SIZES.forEach((size) => {
			canvas.width = size.width;
			canvas.height = size.height;
			const ctx = canvas.getContext("2d");
			if (!ctx) return;

			// Clear canvas
			ctx.clearRect(0, 0, size.width, size.height);

			// Apply background color if enabled
			if (useBgColor) {
				ctx.fillStyle = bgColorValue;
				if (borderRadius > 0) {
					drawRoundedRect(ctx, 0, 0, size.width, size.height, (borderRadius / 100) * (size.width / 2));
					ctx.fill();
				} else {
					ctx.fillRect(0, 0, size.width, size.height);
				}
			}

			// Apply clipping for border radius
			if (borderRadius > 0) {
				ctx.save();
				ctx.beginPath();
				drawRoundedRect(ctx, 0, 0, size.width, size.height, (borderRadius / 100) * (size.width / 2));
				ctx.clip();
			}

			// Draw the source image (cover fit - crop to fill)
			const srcAspect = sourceImage.width / sourceImage.height;
			const dstAspect = size.width / size.height;
			let sx = 0, sy = 0, sw = sourceImage.width, sh = sourceImage.height;

			if (srcAspect > dstAspect) {
				// Source is wider - crop sides
				sw = sourceImage.height * dstAspect;
				sx = (sourceImage.width - sw) / 2;
			} else if (srcAspect < dstAspect) {
				// Source is taller - crop top/bottom
				sh = sourceImage.width / dstAspect;
				sy = (sourceImage.height - sh) / 2;
			}

			ctx.drawImage(sourceImage, sx, sy, sw, sh, 0, 0, size.width, size.height);

			if (borderRadius > 0) {
				ctx.restore();
			}

			// Export as data URL
			const dataUrl = canvas.toDataURL("image/png");
			newFavicons.set(size.label, dataUrl);
		});

		setGeneratedFavicons(newFavicons);
	}, [sourceImage, useBgColor, bgColorValue, borderRadius]);

	const drawRoundedRect = (
		ctx: CanvasRenderingContext2D,
		x: number,
		y: number,
		w: number,
		h: number,
		r: number
	) => {
		ctx.beginPath();
		ctx.moveTo(x + r, y);
		ctx.lineTo(x + w - r, y);
		ctx.quadraticCurveTo(x + w, y, x + w, y + r);
		ctx.lineTo(x + w, y + h - r);
		ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
		ctx.lineTo(x + r, y + h);
		ctx.quadraticCurveTo(x, y + h, x, y + h - r);
		ctx.lineTo(x, y + r);
		ctx.quadraticCurveTo(x, y, x + r, y);
		ctx.closePath();
	};

	const downloadFavicon = (label: string) => {
		const dataUrl = generatedFavicons.get(label);
		if (!dataUrl) return;

		const size = FAVICON_SIZES.find((s) => s.label === label);
		if (!size) return;

		const link = document.createElement("a");
		link.download = size.filename;
		link.href = dataUrl;
		link.click();
	};

	const downloadAll = () => {
		FAVICON_SIZES.forEach((size, index) => {
			const dataUrl = generatedFavicons.get(size.label);
			if (!dataUrl) return;

			// Stagger downloads to avoid browser blocking
			setTimeout(() => {
				const link = document.createElement("a");
				link.download = size.filename;
				link.href = dataUrl;
				link.click();
			}, index * 200);
		});
	};

	const copyMetaTags = () => {
		navigator.clipboard.writeText(generateMetaTags()).then(() => {
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		});
	};

	const resetAll = () => {
		setSourceImage(null);
		setSourceUrl("");
		setIsSquare(true);
		setGeneratedFavicons(new Map());
		setBorderRadius(0);
		setUseBgColor(false);
		setBgColorValue("#ffffff");
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	};

	return (
		<div className={styles.container}>
			{/* Settings Panel */}
			<div className="flex flex-col gap-6">
				{/* Upload Zone */}
				<div className={styles.glassCard}>
					<h2 className={styles.sectionTitle}>Source Image</h2>

					<input
						ref={fileInputRef}
						type="file"
						accept="image/*"
						onChange={handleFileSelect}
						className="hidden"
						aria-label="Upload image for favicon"
					/>

					<div
						className={`flex flex-col items-center justify-center gap-3 p-8 text-center ${styles.dropZone} ${isDragOver ? styles.dragOver : ""}`}
						onClick={() => fileInputRef.current?.click()}
						onDrop={handleDrop}
						onDragOver={handleDragOver}
						onDragLeave={handleDragLeave}
					>
						<ArrowUpTrayIcon className={`w-10 h-10 ${styles.dropZoneIcon}`} />
						<p className={`text-sm font-medium ${styles.dropZoneText}`}>
							Drop an image here or click to upload
						</p>
						<p className={`text-xs ${styles.dropZoneSub}`}>
							PNG, JPG, SVG, or WebP. Square images work best.
						</p>
					</div>

					{/* Source Preview */}
					{sourceImage && (
						<div className="mt-4">
							<div className={`flex items-center justify-center p-4 ${styles.sourcePreview} ${styles.checkerboard}`}>
								<img
									src={sourceUrl}
									alt="Source"
									className="max-w-full"
									style={{ maxHeight: 200 }}
								/>
							</div>
							<p className={`text-xs mt-2 text-center ${styles.infoText}`}>
								{sourceImage.width} x {sourceImage.height}px
							</p>
						</div>
					)}

					{/* Non-square warning */}
					{sourceImage && !isSquare && (
						<div className={`flex items-start gap-3 p-3 mt-3 text-sm ${styles.warningBox}`}>
							<ExclamationTriangleIcon className="w-5 h-5" />
							<span>Image is not square. It will be center-cropped to fit each size.</span>
						</div>
					)}
				</div>

				{/* Options */}
				<div className={styles.glassCard}>
					<h2 className={styles.sectionTitle}>Options</h2>

					{/* Background Color */}
					<div className="flex flex-col gap-4">
						<div className="flex items-center gap-3">
							<input
								type="checkbox"
								id="useBgColor"
								checked={useBgColor}
								onChange={(e) => setUseBgColor(e.target.checked)}
								className="w-4 h-4 rounded"
							/>
							<label htmlFor="useBgColor" className={`text-sm ${styles.inputLabel}`} style={{ marginBottom: 0 }}>
								Background color (for transparent images)
							</label>
						</div>

						{useBgColor && (
							<div className={`flex gap-3 items-center ${styles.colorInputWrapper}`}>
								<ColorPickerPopover color={bgColorValue} onChange={setBgColorValue} swatchSize="sm" />
								<input
									type="text"
									value={bgColorValue}
									onChange={(e) => setBgColorValue(e.target.value)}
									className={`flex-1 rounded-md text-sm ${styles.colorTextInput}`}
								/>
							</div>
						)}

						{/* Border Radius */}
						<div className="flex flex-col gap-2 mt-2">
							<div className="flex justify-between items-center">
								<label className={styles.inputLabel} style={{ marginBottom: 0 }}>Border Radius</label>
								<span className={`text-sm ${styles.sliderValue}`}>
									{borderRadius}%{borderRadius === 100 ? " (circle)" : ""}
								</span>
							</div>
							<input
								type="range"
								min="0"
								max="100"
								value={borderRadius}
								onChange={(e) => setBorderRadius(parseInt(e.target.value, 10))}
								className={styles.slider}
							/>
						</div>
					</div>
				</div>

				{/* Generate Button */}
				<button
					className={styles.generateBtn}
					onClick={generateFavicons}
					disabled={!sourceImage}
				>
					Generate Favicons
				</button>

				{sourceImage && (
					<button className={styles.resetBtn} onClick={resetAll}>
						<TrashIcon className="w-4 h-4" />
						Reset
					</button>
				)}
			</div>

			{/* Output Panel */}
			<div className="flex flex-col gap-6">
				{/* Generated Favicons Grid */}
				{generatedFavicons.size > 0 && (
					<div className={styles.glassCard}>
						<div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
							<h2 className={styles.sectionTitle} style={{ marginBottom: 0 }}>
								Generated Favicons
							</h2>
							<button className={styles.downloadAllBtn} onClick={downloadAll}>
								<ArrowDownTrayIcon className="w-5 h-5" />
								Download All
							</button>
						</div>

						<div className={styles.faviconGrid}>
							{FAVICON_SIZES.map((size) => {
								const dataUrl = generatedFavicons.get(size.label);
								if (!dataUrl) return null;

								return (
									<div key={size.label} className={styles.faviconCard}>
										<div className={`flex items-center justify-center p-4 ${styles.faviconPreview}`}>
											<img
												src={dataUrl}
												alt={`${size.label} favicon`}
												width={Math.min(size.width, 80)}
												height={Math.min(size.height, 80)}
											/>
										</div>
										<div className="flex flex-col gap-1 p-3">
											<span className={`text-sm font-semibold ${styles.faviconLabel}`}>
												{size.label}
											</span>
											<span className={`text-xs ${styles.faviconSublabel}`}>
												{size.description}
											</span>
											<button
												className={`mt-2 ${styles.downloadBtn}`}
												onClick={() => downloadFavicon(size.label)}
											>
												<ArrowDownTrayIcon className="w-3.5 h-3.5" />
												Download
											</button>
										</div>
									</div>
								);
							})}
						</div>
					</div>
				)}

				{/* Meta Tags Snippet */}
				{generatedFavicons.size > 0 && (
					<div className={styles.glassCard}>
						<div className="flex items-start justify-between mb-4 gap-4">
							<h2 className={styles.sectionTitle} style={{ marginBottom: 0 }}>
								HTML Meta Tags
							</h2>
							<button className={styles.copyBtn} onClick={copyMetaTags} title="Copy to clipboard">
								{copied ? (
									<CheckIcon className="w-4 h-4" />
								) : (
									<ClipboardDocumentIcon className="w-4 h-4" />
								)}
							</button>
						</div>
						<pre className={`p-4 ${styles.codeBlock}`}>
							<code>{generateMetaTags()}</code>
						</pre>
					</div>
				)}

				{/* Empty state / Info */}
				{generatedFavicons.size === 0 && (
					<div className={styles.glassCard}>
						<div className={`flex items-start gap-4 p-4 rounded-md ${styles.infoBox}`}>
							<InformationCircleIcon className={`w-6 h-6 shrink-0 ${styles.infoIcon}`} />
							<div>
								<p className={styles.infoText}>
									Upload a source image and click &quot;Generate Favicons&quot; to create icons in all standard sizes.
									All processing happens in your browser &mdash; no files are uploaded to any server.
								</p>
								<p className={`mt-3 ${styles.infoText}`}>
									For best results, use a square image at least <code>512x512</code> pixels.
									Transparent PNGs and SVGs are supported.
								</p>
							</div>
						</div>
					</div>
				)}
			</div>

			{/* Hidden canvas for generation */}
			<canvas ref={canvasRef} style={{ display: "none" }} />
		</div>
	);
}
