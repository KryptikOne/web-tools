"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
	ArrowDownTrayIcon,
	PhotoIcon,
	ArrowUpTrayIcon,
	LockClosedIcon,
	LockOpenIcon,
	XMarkIcon,
} from "@heroicons/react/24/outline";
import styles from "./ImageResizer.module.scss";

type ImageFormat = "png" | "jpeg" | "webp";

interface OriginalImage {
	src: string;
	name: string;
	width: number;
	height: number;
	size: number;
	type: string;
}

const SIZE_PRESETS = [
	{ label: "1920 x 1080", width: 1920, height: 1080 },
	{ label: "1280 x 720", width: 1280, height: 720 },
	{ label: "800 x 600", width: 800, height: 600 },
	{ label: "640 x 480", width: 640, height: 480 },
	{ label: "500 x 500", width: 500, height: 500 },
	{ label: "256 x 256", width: 256, height: 256 },
	{ label: "128 x 128", width: 128, height: 128 },
	{ label: "64 x 64", width: 64, height: 64 },
];

const PERCENT_PRESETS = [
	{ label: "25%", value: 0.25 },
	{ label: "50%", value: 0.5 },
	{ label: "75%", value: 0.75 },
	{ label: "150%", value: 1.5 },
	{ label: "200%", value: 2.0 },
];

const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

function formatFileSize(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function ImageResizer() {
	const [originalImage, setOriginalImage] = useState<OriginalImage | null>(null);
	const [width, setWidth] = useState<number>(0);
	const [height, setHeight] = useState<number>(0);
	const [lockAspectRatio, setLockAspectRatio] = useState(true);
	const [format, setFormat] = useState<ImageFormat>("png");
	const [quality, setQuality] = useState(92);
	const [resizedDataUrl, setResizedDataUrl] = useState<string | null>(null);
	const [resizedSize, setResizedSize] = useState<number>(0);
	const [isDragging, setIsDragging] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const fileInputRef = useRef<HTMLInputElement>(null);
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const aspectRatioRef = useRef<number>(1);

	const processFile = useCallback((file: File) => {
		setError(null);

		if (!ACCEPTED_TYPES.includes(file.type)) {
			setError("Unsupported file type. Please upload PNG, JPEG, WebP, or GIF.");
			return;
		}

		if (file.size > MAX_FILE_SIZE) {
			setError("File is too large. Maximum size is 50MB.");
			return;
		}

		const reader = new FileReader();
		reader.onload = (e) => {
			const src = e.target?.result as string;
			const img = new Image();
			img.onload = () => {
				const original: OriginalImage = {
					src,
					name: file.name,
					width: img.width,
					height: img.height,
					size: file.size,
					type: file.type,
				};
				setOriginalImage(original);
				setWidth(img.width);
				setHeight(img.height);
				aspectRatioRef.current = img.width / img.height;
			};
			img.onerror = () => {
				setError("Failed to load the image. The file may be corrupted.");
			};
			img.src = src;
		};
		reader.onerror = () => {
			setError("Failed to read the file.");
		};
		reader.readAsDataURL(file);
	}, []);

	// Resize logic
	const resizeImage = useCallback(() => {
		if (!originalImage || width <= 0 || height <= 0) {
			setResizedDataUrl(null);
			setResizedSize(0);
			return;
		}

		const canvas = canvasRef.current;
		if (!canvas) return;

		canvas.width = width;
		canvas.height = height;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		// Use high quality rendering
		ctx.imageSmoothingEnabled = true;
		ctx.imageSmoothingQuality = "high";

		const img = new Image();
		img.onload = () => {
			ctx.drawImage(img, 0, 0, width, height);

			const mimeType =
				format === "jpeg" ? "image/jpeg" : format === "webp" ? "image/webp" : "image/png";
			const q = format === "png" ? undefined : quality / 100;

			const dataUrl = canvas.toDataURL(mimeType, q);
			setResizedDataUrl(dataUrl);

			// Estimate file size from base64
			const base64 = dataUrl.split(",")[1];
			if (base64) {
				const sizeInBytes = (base64.length * 3) / 4;
				setResizedSize(sizeInBytes);
			}
		};
		img.src = originalImage.src;
	}, [originalImage, width, height, format, quality]);

	useEffect(() => {
		const timer = setTimeout(() => {
			resizeImage();
		}, 150);
		return () => clearTimeout(timer);
	}, [resizeImage]);

	// Dimension handlers with aspect ratio lock
	const handleWidthChange = (value: string) => {
		const num = parseInt(value, 10);
		if (isNaN(num) || num < 0) {
			setWidth(0);
			return;
		}
		const clamped = Math.min(num, 10000);
		setWidth(clamped);
		if (lockAspectRatio && aspectRatioRef.current > 0) {
			setHeight(Math.round(clamped / aspectRatioRef.current));
		}
	};

	const handleHeightChange = (value: string) => {
		const num = parseInt(value, 10);
		if (isNaN(num) || num < 0) {
			setHeight(0);
			return;
		}
		const clamped = Math.min(num, 10000);
		setHeight(clamped);
		if (lockAspectRatio && aspectRatioRef.current > 0) {
			setWidth(Math.round(clamped * aspectRatioRef.current));
		}
	};

	const handleSizePreset = (presetWidth: number, presetHeight: number) => {
		setWidth(presetWidth);
		setHeight(presetHeight);
		if (lockAspectRatio) {
			// When locked, use preset width and calculate height from aspect ratio
			setHeight(Math.round(presetWidth / aspectRatioRef.current));
		} else {
			setHeight(presetHeight);
		}
	};

	const handlePercentPreset = (multiplier: number) => {
		if (!originalImage) return;
		const newWidth = Math.round(originalImage.width * multiplier);
		const newHeight = Math.round(originalImage.height * multiplier);
		setWidth(newWidth);
		setHeight(newHeight);
	};

	const handleDownload = () => {
		if (!resizedDataUrl) return;

		const link = document.createElement("a");
		const ext = format;
		const baseName = originalImage?.name.replace(/\.[^.]+$/, "") || "resized";
		link.download = `${baseName}-${width}x${height}.${ext}`;
		link.href = resizedDataUrl;
		link.click();
	};

	const handleReset = () => {
		setOriginalImage(null);
		setWidth(0);
		setHeight(0);
		setResizedDataUrl(null);
		setResizedSize(0);
		setError(null);
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	};

	// Drag and drop handlers
	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(true);
	};

	const handleDragLeave = (e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(false);
	};

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(false);
		const file = e.dataTransfer.files[0];
		if (file) processFile(file);
	};

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) processFile(file);
	};

	return (
		<div className={`gap-6 ${styles.container}`}>
			{/* Settings Panel */}
			<div className={`flex flex-col gap-6 ${styles.settingsPanel}`}>
				{/* Upload Zone */}
				<div className={styles.glassCard}>
					<div className="flex items-center justify-between mb-4">
						<h2 className={styles.sectionTitle} style={{ margin: 0 }}>
							Upload Image
						</h2>
						{originalImage && (
							<button
								className={styles.resetBtn}
								onClick={handleReset}
								title="Remove image"
							>
								<XMarkIcon className="w-5 h-5" />
							</button>
						)}
					</div>

					{!originalImage ? (
						<div
							className={`flex flex-col items-center justify-center gap-3 p-8 ${styles.dropZone} ${isDragging ? styles.dropZoneActive : ""}`}
							onDragOver={handleDragOver}
							onDragLeave={handleDragLeave}
							onDrop={handleDrop}
							onClick={() => fileInputRef.current?.click()}
						>
							<ArrowUpTrayIcon className={`w-10 h-10 ${styles.dropZoneIcon}`} />
							<p className={`text-sm text-center ${styles.dropZoneText}`}>
								Drag & drop an image here, or{" "}
								<span className={styles.dropZoneBrowse}>browse</span>
							</p>
							<p className={`text-xs ${styles.dropZoneHint}`}>
								PNG, JPEG, WebP, GIF - Max 50MB
							</p>
						</div>
					) : (
						<div className="flex flex-col gap-3">
							<div className={`flex items-center gap-3 p-3 rounded-md ${styles.originalInfo}`}>
								<PhotoIcon className="w-5 h-5 shrink-0 text-gray-400" />
								<div className="flex-1 min-w-0">
									<p className="text-sm font-medium truncate">{originalImage.name}</p>
									<p className={`text-xs ${styles.originalInfoLabel}`}>
										{originalImage.width} x {originalImage.height}px
										{" "}·{" "}
										{formatFileSize(originalImage.size)}
									</p>
								</div>
							</div>
							<button
								className={`text-xs w-full ${styles.dropZone} ${isDragging ? styles.dropZoneActive : ""}`}
								style={{ padding: "0.75rem" }}
								onDragOver={handleDragOver}
								onDragLeave={handleDragLeave}
								onDrop={handleDrop}
								onClick={() => fileInputRef.current?.click()}
							>
								<span className={styles.dropZoneBrowse}>Replace image</span>
							</button>
						</div>
					)}

					<input
						ref={fileInputRef}
						type="file"
						accept={ACCEPTED_TYPES.join(",")}
						onChange={handleFileChange}
						className="hidden"
					/>

					{error && (
						<p className="text-sm mt-3" style={{ color: "var(--color-error)" }}>
							{error}
						</p>
					)}
				</div>

				{/* Dimensions */}
				{originalImage && (
					<>
						<div className={styles.glassCard}>
							<h2 className={styles.sectionTitle}>Dimensions</h2>
							<div className="flex items-end gap-3 mb-4">
								<div className="flex-1">
									<label className={styles.inputLabel}>Width (px)</label>
									<input
										type="number"
										inputMode="numeric"
										min="1"
										max="10000"
										value={width || ""}
										onChange={(e) => handleWidthChange(e.target.value)}
										className={styles.input}
									/>
								</div>
								<button
									className={`${styles.lockBtn} ${lockAspectRatio ? styles.lockBtnActive : ""}`}
									onClick={() => setLockAspectRatio(!lockAspectRatio)}
									title={lockAspectRatio ? "Unlock aspect ratio" : "Lock aspect ratio"}
								>
									{lockAspectRatio ? (
										<LockClosedIcon className="w-5 h-5" />
									) : (
										<LockOpenIcon className="w-5 h-5" />
									)}
								</button>
								<div className="flex-1">
									<label className={styles.inputLabel}>Height (px)</label>
									<input
										type="number"
										inputMode="numeric"
										min="1"
										max="10000"
										value={height || ""}
										onChange={(e) => handleHeightChange(e.target.value)}
										className={styles.input}
									/>
								</div>
							</div>
						</div>

						{/* Size Presets */}
						<div className={styles.glassCard}>
							<h2 className={styles.sectionTitle}>Size Presets</h2>
							<div className="grid grid-cols-2 gap-2 mb-4">
								{SIZE_PRESETS.map((preset) => (
									<button
										key={preset.label}
										className={`${styles.presetBtn} ${width === preset.width && height === preset.height ? "active" : ""}`}
										onClick={() => handleSizePreset(preset.width, preset.height)}
									>
										{preset.label}
									</button>
								))}
							</div>

							<h3 className="text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
								Scale by Percentage
							</h3>
							<div className="grid grid-cols-5 gap-2">
								{PERCENT_PRESETS.map((preset) => (
									<button
										key={preset.label}
										className={styles.presetBtn}
										onClick={() => handlePercentPreset(preset.value)}
									>
										{preset.label}
									</button>
								))}
							</div>
						</div>

						{/* Format & Quality */}
						<div className={styles.glassCard}>
							<h2 className={styles.sectionTitle}>Output Format</h2>
							<div className={styles.inputGroup}>
								<label className={styles.inputLabel}>Format</label>
								<div className="grid grid-cols-3 gap-2">
									<button
										className={`${styles.formatBtn} ${format === "png" ? "active" : ""}`}
										onClick={() => setFormat("png")}
									>
										PNG
									</button>
									<button
										className={`${styles.formatBtn} ${format === "jpeg" ? "active" : ""}`}
										onClick={() => setFormat("jpeg")}
									>
										JPEG
									</button>
									<button
										className={`${styles.formatBtn} ${format === "webp" ? "active" : ""}`}
										onClick={() => setFormat("webp")}
									>
										WebP
									</button>
								</div>
							</div>

							{(format === "jpeg" || format === "webp") && (
								<div className={`mt-4 ${styles.inputGroup}`}>
									<label className={styles.inputLabel}>
										Quality: {quality}%
										<span className={`text-xs font-normal ml-2 ${styles.inputHint}`}>
											(Lower = smaller file)
										</span>
									</label>
									<input
										type="range"
										min="1"
										max="100"
										value={quality}
										onChange={(e) => setQuality(parseInt(e.target.value, 10))}
										className={styles.slider}
									/>
								</div>
							)}
						</div>
					</>
				)}
			</div>

			{/* Preview Panel */}
			<div className={`flex flex-col ${styles.previewPanel}`}>
				<div className={styles.glassCard}>
					<div className={`flex items-start justify-between mb-6 gap-4 ${styles.previewHeader}`}>
						<div>
							<h2 className={styles.sectionTitle}>Preview</h2>
							{originalImage && resizedDataUrl && (
								<p className={`mt-1 text-sm ${styles.previewInfo}`}>
									{width} x {height}px · {formatFileSize(resizedSize)}
								</p>
							)}
						</div>
						{resizedDataUrl && (
							<button
								className={`whitespace-nowrap ${styles.downloadBtn}`}
								onClick={handleDownload}
							>
								<ArrowDownTrayIcon className="w-5 h-5" />
								Download
							</button>
						)}
					</div>

					<div className={`flex items-center justify-center rounded-lg mb-6 ${styles.previewContainer}`}>
						{resizedDataUrl ? (
							<img
								src={resizedDataUrl}
								alt="Resized preview"
								className={`max-w-full rounded-md ${styles.previewImage}`}
							/>
						) : (
							<div className={`flex flex-col items-center gap-3 ${styles.emptyPreview}`}>
								<PhotoIcon className="w-16 h-16 opacity-30" />
								<p className="text-sm">Upload an image to get started</p>
							</div>
						)}
					</div>

					<div className={`flex items-start gap-4 p-4 rounded-md ${styles.infoBox}`}>
						<PhotoIcon className={`w-6 h-6 shrink-0 ${styles.infoIcon}`} />
						<p className={styles.infoText}>
							All image processing happens entirely in your browser using the Canvas API. Your images are never uploaded to any server.
						</p>
					</div>
				</div>
			</div>

			{/* Hidden canvas for resizing */}
			<canvas ref={canvasRef} style={{ display: "none" }} />
		</div>
	);
}
