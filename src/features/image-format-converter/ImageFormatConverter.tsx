"use client";

import { useState, useRef, useCallback } from "react";
import {
	ArrowDownTrayIcon,
	PhotoIcon,
	XMarkIcon,
	ArrowPathIcon,
} from "@heroicons/react/24/outline";
import styles from "./ImageFormatConverter.module.scss";

type OutputFormat = "png" | "jpeg" | "webp";

interface ImageEntry {
	id: string;
	file: File;
	originalUrl: string;
	originalFormat: string;
	width: number;
	height: number;
	originalSize: number;
	convertedUrl: string | null;
	convertedSize: number | null;
	converting: boolean;
}

function formatFileSize(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function getMimeType(format: OutputFormat): string {
	switch (format) {
		case "jpeg":
			return "image/jpeg";
		case "webp":
			return "image/webp";
		default:
			return "image/png";
	}
}

function detectFormat(file: File): string {
	const type = file.type.toLowerCase();
	if (type.includes("png")) return "PNG";
	if (type.includes("jpeg") || type.includes("jpg")) return "JPEG";
	if (type.includes("webp")) return "WebP";
	if (type.includes("gif")) return "GIF";
	if (type.includes("bmp")) return "BMP";
	return "Unknown";
}

function generateId(): string {
	return Math.random().toString(36).substring(2, 10);
}

const ACCEPTED_TYPES = "image/png,image/jpeg,image/webp,image/gif,image/bmp";

export default function ImageFormatConverter() {
	const [images, setImages] = useState<ImageEntry[]>([]);
	const [outputFormat, setOutputFormat] = useState<OutputFormat>("png");
	const [quality, setQuality] = useState<number>(92);
	const [isDragging, setIsDragging] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const loadImage = useCallback(
		(file: File): Promise<ImageEntry> => {
			return new Promise((resolve, reject) => {
				const url = URL.createObjectURL(file);
				const img = new Image();
				img.onload = () => {
					resolve({
						id: generateId(),
						file,
						originalUrl: url,
						originalFormat: detectFormat(file),
						width: img.naturalWidth,
						height: img.naturalHeight,
						originalSize: file.size,
						convertedUrl: null,
						convertedSize: null,
						converting: false,
					});
				};
				img.onerror = () => {
					URL.revokeObjectURL(url);
					reject(new Error(`Failed to load image: ${file.name}`));
				};
				img.src = url;
			});
		},
		[]
	);

	const convertImage = useCallback(
		(entry: ImageEntry): Promise<{ url: string; size: number }> => {
			return new Promise((resolve, reject) => {
				const img = new Image();
				img.onload = () => {
					const canvas = document.createElement("canvas");
					canvas.width = entry.width;
					canvas.height = entry.height;
					const ctx = canvas.getContext("2d");
					if (!ctx) {
						reject(new Error("Could not get canvas context"));
						return;
					}

					// For JPEG, fill white background (no alpha support)
					if (outputFormat === "jpeg") {
						ctx.fillStyle = "#ffffff";
						ctx.fillRect(0, 0, canvas.width, canvas.height);
					}

					ctx.drawImage(img, 0, 0);

					const mime = getMimeType(outputFormat);
					const qualityVal =
						outputFormat === "png" ? undefined : quality / 100;

					canvas.toBlob(
						(blob) => {
							if (!blob) {
								reject(new Error("Conversion failed"));
								return;
							}
							const url = URL.createObjectURL(blob);
							resolve({ url, size: blob.size });
						},
						mime,
						qualityVal
					);
				};
				img.onerror = () =>
					reject(new Error("Failed to load image for conversion"));
				img.src = entry.originalUrl;
			});
		},
		[outputFormat, quality]
	);

	const handleFiles = useCallback(
		async (files: FileList | File[]) => {
			const fileArray = Array.from(files).filter((f) =>
				f.type.startsWith("image/")
			);
			if (fileArray.length === 0) return;

			const newEntries: ImageEntry[] = [];
			for (const file of fileArray) {
				try {
					const entry = await loadImage(file);
					newEntries.push(entry);
				} catch (err) {
					console.error(err);
				}
			}

			setImages((prev) => [...prev, ...newEntries]);
		},
		[loadImage]
	);

	const handleConvertAll = useCallback(async () => {
		setImages((prev) =>
			prev.map((img) => ({ ...img, converting: true }))
		);

		const updated: ImageEntry[] = [];
		for (const entry of images) {
			try {
				// Revoke previous converted URL
				if (entry.convertedUrl) {
					URL.revokeObjectURL(entry.convertedUrl);
				}
				const result = await convertImage(entry);
				updated.push({
					...entry,
					convertedUrl: result.url,
					convertedSize: result.size,
					converting: false,
				});
			} catch (err) {
				console.error(err);
				updated.push({ ...entry, converting: false });
			}
		}

		setImages(updated);
	}, [images, convertImage]);

	const handleRemoveImage = useCallback((id: string) => {
		setImages((prev) => {
			const entry = prev.find((img) => img.id === id);
			if (entry) {
				URL.revokeObjectURL(entry.originalUrl);
				if (entry.convertedUrl) URL.revokeObjectURL(entry.convertedUrl);
			}
			return prev.filter((img) => img.id !== id);
		});
	}, []);

	const handleClearAll = useCallback(() => {
		images.forEach((entry) => {
			URL.revokeObjectURL(entry.originalUrl);
			if (entry.convertedUrl) URL.revokeObjectURL(entry.convertedUrl);
		});
		setImages([]);
	}, [images]);

	const handleDownload = useCallback(
		(entry: ImageEntry) => {
			if (!entry.convertedUrl) return;
			const link = document.createElement("a");
			const nameWithoutExt = entry.file.name.replace(/\.[^/.]+$/, "");
			link.download = `${nameWithoutExt}.${outputFormat}`;
			link.href = entry.convertedUrl;
			link.click();
		},
		[outputFormat]
	);

	const handleDownloadAll = useCallback(() => {
		const converted = images.filter((img) => img.convertedUrl);
		converted.forEach((entry) => {
			handleDownload(entry);
		});
	}, [images, handleDownload]);

	const handleDragOver = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(true);
	}, []);

	const handleDragLeave = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(false);
	}, []);

	const handleDrop = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault();
			setIsDragging(false);
			if (e.dataTransfer.files.length > 0) {
				handleFiles(e.dataTransfer.files);
			}
		},
		[handleFiles]
	);

	const handleFileInputChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			if (e.target.files && e.target.files.length > 0) {
				handleFiles(e.target.files);
				// Reset input so the same file can be selected again
				e.target.value = "";
			}
		},
		[handleFiles]
	);

	const hasImages = images.length > 0;
	const hasConverted = images.some((img) => img.convertedUrl);
	const isConverting = images.some((img) => img.converting);
	const showQuality = outputFormat !== "png";

	return (
		<div className={styles.container}>
			{/* Settings Panel */}
			<div className="flex flex-col gap-6">
				{/* Upload Area */}
				<div className={styles.glassCard}>
					<h2 className={styles.sectionTitle}>Upload Images</h2>
					<div
						className={`flex flex-col items-center justify-center gap-3 rounded-lg cursor-pointer ${styles.dropZone} ${isDragging ? styles.dropZoneActive : ""}`}
						onDragOver={handleDragOver}
						onDragLeave={handleDragLeave}
						onDrop={handleDrop}
						onClick={() => fileInputRef.current?.click()}
					>
						<PhotoIcon className="w-10 h-10" style={{ color: "var(--text-muted)" }} />
						<p className={`text-sm ${styles.dropText}`}>
							Drag & drop images here, or click to browse
						</p>
						<p className={`text-xs ${styles.dropHint}`}>
							PNG, JPEG, WebP, GIF, BMP
						</p>
					</div>
					<input
						ref={fileInputRef}
						type="file"
						accept={ACCEPTED_TYPES}
						multiple
						onChange={handleFileInputChange}
						className="hidden"
						aria-label="Upload images to convert"
					/>
				</div>

				{/* Output Settings */}
				<div className={styles.glassCard}>
					<h2 className={styles.sectionTitle}>Output Settings</h2>

					<div className="mb-4">
						<label className={styles.inputLabel}>Output Format</label>
						<div className={`grid grid-cols-3 gap-2 ${styles.formatButtons}`}>
							{(["png", "jpeg", "webp"] as OutputFormat[]).map(
								(fmt) => (
									<button
										key={fmt}
										className={`${styles.formatBtn} ${outputFormat === fmt ? styles.active : ""}`}
										onClick={() => setOutputFormat(fmt)}
									>
										{fmt.toUpperCase()}
									</button>
								)
							)}
						</div>
					</div>

					{showQuality && (
						<div>
							<div className="flex justify-between items-center mb-2">
								<label className={styles.inputLabel}>
									Quality
								</label>
								<span className={`text-sm font-mono ${styles.qualityValue}`}>
									{quality}%
								</span>
							</div>
							<input
								type="range"
								min="1"
								max="100"
								value={quality}
								onChange={(e) =>
									setQuality(parseInt(e.target.value, 10))
								}
								className={styles.slider}
							/>
							<div className="flex justify-between mt-1">
								<span className={`text-xs ${styles.sliderHint}`}>
									Smaller file
								</span>
								<span className={`text-xs ${styles.sliderHint}`}>
									Higher quality
								</span>
							</div>
						</div>
					)}
				</div>

				{/* Actions */}
				{hasImages && (
					<div className={`flex flex-col gap-3 ${styles.glassCard}`}>
						<h2 className={styles.sectionTitle}>Actions</h2>
						<button
							className={`w-full ${styles.convertBtn}`}
							onClick={handleConvertAll}
							disabled={isConverting}
						>
							<ArrowPathIcon className={`w-5 h-5 ${isConverting ? styles.spinning : ""}`} />
							{isConverting ? "Converting..." : "Convert All"}
						</button>
						{hasConverted && (
							<button
								className={`w-full ${styles.downloadAllBtn}`}
								onClick={handleDownloadAll}
							>
								<ArrowDownTrayIcon className="w-5 h-5" />
								Download All
							</button>
						)}
						<button
							className={`w-full ${styles.clearBtn}`}
							onClick={handleClearAll}
						>
							<XMarkIcon className="w-5 h-5" />
							Clear All
						</button>
					</div>
				)}
			</div>

			{/* Results Panel */}
			<div className="flex flex-col gap-6">
				{!hasImages && (
					<div className={styles.glassCard}>
						<div className={`flex flex-col items-center justify-center gap-4 py-12 ${styles.emptyState}`}>
							<PhotoIcon className="w-16 h-16" style={{ color: "var(--text-muted)" }} />
							<p className={`text-sm ${styles.emptyText}`}>
								Upload images to get started
							</p>
						</div>
					</div>
				)}

				{images.map((entry) => (
					<div key={entry.id} className={styles.glassCard}>
						{/* Image Header */}
						<div className="flex items-start justify-between mb-4 gap-4">
							<div className="min-w-0 flex-1">
								<h3 className={`text-sm font-semibold truncate ${styles.fileName}`}>
									{entry.file.name}
								</h3>
								<p className={`text-xs font-mono mt-1 ${styles.fileMeta}`}>
									{entry.originalFormat} &middot;{" "}
									{entry.width} x {entry.height} &middot;{" "}
									{formatFileSize(entry.originalSize)}
								</p>
							</div>
							<button
								className={styles.removeBtn}
								onClick={() => handleRemoveImage(entry.id)}
								title="Remove image"
							>
								<XMarkIcon className="w-5 h-5" />
							</button>
						</div>

						{/* Side-by-side Comparison */}
						<div className={`grid gap-4 ${entry.convertedUrl ? styles.comparisonGrid : ""}`}>
							{/* Original */}
							<div>
								<p className={`text-xs font-medium mb-2 ${styles.compareLabel}`}>
									Original ({entry.originalFormat})
								</p>
								<div className={`flex items-center justify-center rounded-lg ${styles.previewContainer}`}>
									{/* eslint-disable-next-line @next/next/no-img-element */}
									<img
										src={entry.originalUrl}
										alt={`Original: ${entry.file.name}`}
										className={`max-w-full rounded-md ${styles.previewImage}`}
									/>
								</div>
								<p className={`text-xs font-mono mt-2 text-center ${styles.sizeLabel}`}>
									{formatFileSize(entry.originalSize)}
								</p>
							</div>

							{/* Converted */}
							{entry.convertedUrl && (
								<div>
									<p className={`text-xs font-medium mb-2 ${styles.compareLabel}`}>
										Converted ({outputFormat.toUpperCase()})
									</p>
									<div className={`flex items-center justify-center rounded-lg ${styles.previewContainer}`}>
										{/* eslint-disable-next-line @next/next/no-img-element */}
										<img
											src={entry.convertedUrl}
											alt={`Converted: ${entry.file.name}`}
											className={`max-w-full rounded-md ${styles.previewImage}`}
										/>
									</div>
									<div className="flex items-center justify-between mt-2">
										<p className={`text-xs font-mono ${styles.sizeLabel}`}>
											{entry.convertedSize !== null
												? formatFileSize(entry.convertedSize)
												: ""}
										</p>
										{entry.convertedSize !== null && (
											<span className={`text-xs font-mono ${entry.convertedSize < entry.originalSize ? styles.sizeSaved : styles.sizeGrew}`}>
												{entry.convertedSize < entry.originalSize
													? `-${((1 - entry.convertedSize / entry.originalSize) * 100).toFixed(1)}%`
													: `+${((entry.convertedSize / entry.originalSize - 1) * 100).toFixed(1)}%`}
											</span>
										)}
									</div>
								</div>
							)}

							{entry.converting && (
								<div className="flex items-center justify-center py-8">
									<ArrowPathIcon className={`w-8 h-8 ${styles.spinning}`} style={{ color: "var(--text-muted)" }} />
								</div>
							)}
						</div>

						{/* Download Button */}
						{entry.convertedUrl && (
							<button
								className={`w-full mt-4 ${styles.downloadBtn}`}
								onClick={() => handleDownload(entry)}
							>
								<ArrowDownTrayIcon className="w-5 h-5" />
								Download {outputFormat.toUpperCase()}
							</button>
						)}
					</div>
				))}
			</div>
		</div>
	);
}
