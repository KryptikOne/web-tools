"use client";

import { useState, useRef, useCallback } from "react";
import {
	ArrowDownTrayIcon,
	PhotoIcon,
	TrashIcon,
	ArrowUpTrayIcon,
} from "@heroicons/react/24/outline";
import styles from "./ImageCompressor.module.scss";

interface ImageFile {
	id: string;
	file: File;
	name: string;
	originalSize: number;
	width: number;
	height: number;
	format: string;
	previewUrl: string;
	compressedBlob: Blob | null;
	compressedUrl: string;
	compressedSize: number;
	compressing: boolean;
}

type OutputFormat = "image/jpeg" | "image/png" | "image/webp";

const FORMAT_OPTIONS: { label: string; value: OutputFormat }[] = [
	{ label: "JPEG", value: "image/jpeg" },
	{ label: "PNG", value: "image/png" },
	{ label: "WebP", value: "image/webp" },
];

const FORMAT_EXTENSIONS: Record<OutputFormat, string> = {
	"image/jpeg": "jpg",
	"image/png": "png",
	"image/webp": "webp",
};

function formatBytes(bytes: number): string {
	if (bytes === 0) return "0 B";
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function getImageFormat(type: string): string {
	if (type.includes("png")) return "PNG";
	if (type.includes("jpeg") || type.includes("jpg")) return "JPEG";
	if (type.includes("webp")) return "WebP";
	return type.split("/")[1]?.toUpperCase() || "Unknown";
}

export default function ImageCompressor() {
	const [images, setImages] = useState<ImageFile[]>([]);
	const [quality, setQuality] = useState(80);
	const [outputFormat, setOutputFormat] = useState<OutputFormat>("image/jpeg");
	const [maxWidth, setMaxWidth] = useState<string>("");
	const [maxHeight, setMaxHeight] = useState<string>("");
	const [isDragging, setIsDragging] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const canvasRef = useRef<HTMLCanvasElement>(null);

	const compressImage = useCallback(
		(imageFile: ImageFile): Promise<{ blob: Blob; url: string }> => {
			return new Promise((resolve, reject) => {
				const img = new Image();
				img.onload = () => {
					const canvas = canvasRef.current;
					if (!canvas) {
						reject(new Error("Canvas not available"));
						return;
					}

					let targetWidth = img.naturalWidth;
					let targetHeight = img.naturalHeight;

					const mw = maxWidth ? parseInt(maxWidth, 10) : 0;
					const mh = maxHeight ? parseInt(maxHeight, 10) : 0;

					if (mw > 0 || mh > 0) {
						const aspectRatio = targetWidth / targetHeight;

						if (mw > 0 && mh > 0) {
							// Fit within both constraints
							if (targetWidth > mw) {
								targetWidth = mw;
								targetHeight = Math.round(mw / aspectRatio);
							}
							if (targetHeight > mh) {
								targetHeight = mh;
								targetWidth = Math.round(mh * aspectRatio);
							}
						} else if (mw > 0 && targetWidth > mw) {
							targetWidth = mw;
							targetHeight = Math.round(mw / aspectRatio);
						} else if (mh > 0 && targetHeight > mh) {
							targetHeight = mh;
							targetWidth = Math.round(mh * aspectRatio);
						}
					}

					canvas.width = targetWidth;
					canvas.height = targetHeight;

					const ctx = canvas.getContext("2d");
					if (!ctx) {
						reject(new Error("Canvas context not available"));
						return;
					}

					ctx.clearRect(0, 0, targetWidth, targetHeight);
					ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

					canvas.toBlob(
						(blob) => {
							if (!blob) {
								reject(new Error("Compression failed"));
								return;
							}
							const url = URL.createObjectURL(blob);
							resolve({ blob, url });
						},
						outputFormat,
						quality / 100
					);
				};
				img.onerror = () => reject(new Error("Failed to load image"));
				img.src = imageFile.previewUrl;
			});
		},
		[quality, outputFormat, maxWidth, maxHeight]
	);

	const processFiles = useCallback(
		async (files: FileList | File[]) => {
			const validFiles = Array.from(files).filter((f) =>
				["image/png", "image/jpeg", "image/webp"].includes(f.type)
			);

			if (validFiles.length === 0) return;

			const newImages: ImageFile[] = await Promise.all(
				validFiles.map(
					(file) =>
						new Promise<ImageFile>((resolve) => {
							const img = new Image();
							const previewUrl = URL.createObjectURL(file);
							img.onload = () => {
								resolve({
									id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
									file,
									name: file.name,
									originalSize: file.size,
									width: img.naturalWidth,
									height: img.naturalHeight,
									format: getImageFormat(file.type),
									previewUrl,
									compressedBlob: null,
									compressedUrl: "",
									compressedSize: 0,
									compressing: true,
								});
							};
							img.onerror = () => {
								URL.revokeObjectURL(previewUrl);
								resolve({
									id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
									file,
									name: file.name,
									originalSize: file.size,
									width: 0,
									height: 0,
									format: getImageFormat(file.type),
									previewUrl: "",
									compressedBlob: null,
									compressedUrl: "",
									compressedSize: 0,
									compressing: false,
								});
							};
							img.src = previewUrl;
						})
				)
			);

			const validNewImages = newImages.filter((img) => img.previewUrl !== "");
			setImages((prev) => [...prev, ...validNewImages]);

			// Compress each image
			for (const imageFile of validNewImages) {
				try {
					const { blob, url } = await compressImage(imageFile);
					setImages((prev) =>
						prev.map((img) =>
							img.id === imageFile.id
								? {
										...img,
										compressedBlob: blob,
										compressedUrl: url,
										compressedSize: blob.size,
										compressing: false,
									}
								: img
						)
					);
				} catch {
					setImages((prev) =>
						prev.map((img) =>
							img.id === imageFile.id ? { ...img, compressing: false } : img
						)
					);
				}
			}
		},
		[compressImage]
	);

	const recompressAll = useCallback(async () => {
		setImages((prev) => prev.map((img) => ({ ...img, compressing: true })));

		for (const imageFile of images) {
			try {
				// Revoke old compressed URL
				if (imageFile.compressedUrl) {
					URL.revokeObjectURL(imageFile.compressedUrl);
				}
				const { blob, url } = await compressImage(imageFile);
				setImages((prev) =>
					prev.map((img) =>
						img.id === imageFile.id
							? {
									...img,
									compressedBlob: blob,
									compressedUrl: url,
									compressedSize: blob.size,
									compressing: false,
								}
							: img
					)
				);
			} catch {
				setImages((prev) =>
					prev.map((img) =>
						img.id === imageFile.id ? { ...img, compressing: false } : img
					)
				);
			}
		}
	}, [images, compressImage]);

	const removeImage = useCallback((id: string) => {
		setImages((prev) => {
			const target = prev.find((img) => img.id === id);
			if (target) {
				URL.revokeObjectURL(target.previewUrl);
				if (target.compressedUrl) URL.revokeObjectURL(target.compressedUrl);
			}
			return prev.filter((img) => img.id !== id);
		});
	}, []);

	const clearAll = useCallback(() => {
		images.forEach((img) => {
			URL.revokeObjectURL(img.previewUrl);
			if (img.compressedUrl) URL.revokeObjectURL(img.compressedUrl);
		});
		setImages([]);
	}, [images]);

	const downloadImage = useCallback(
		(imageFile: ImageFile) => {
			if (!imageFile.compressedBlob) return;
			const link = document.createElement("a");
			const ext = FORMAT_EXTENSIONS[outputFormat];
			const baseName = imageFile.name.replace(/\.[^.]+$/, "");
			link.download = `${baseName}-compressed.${ext}`;
			link.href = imageFile.compressedUrl;
			link.click();
		},
		[outputFormat]
	);

	const downloadAll = useCallback(() => {
		images.forEach((img) => {
			if (img.compressedBlob) downloadImage(img);
		});
	}, [images, downloadImage]);

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
				processFiles(e.dataTransfer.files);
			}
		},
		[processFiles]
	);

	const handleFileSelect = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			if (e.target.files && e.target.files.length > 0) {
				processFiles(e.target.files);
				// Reset so the same file can be re-selected
				e.target.value = "";
			}
		},
		[processFiles]
	);

	const totalOriginal = images.reduce((sum, img) => sum + img.originalSize, 0);
	const totalCompressed = images.reduce(
		(sum, img) => sum + img.compressedSize,
		0
	);
	const totalSavings =
		totalOriginal > 0
			? (((totalOriginal - totalCompressed) / totalOriginal) * 100).toFixed(1)
			: "0";

	return (
		<div className={`gap-6 ${styles.container}`}>
			{/* Settings Panel */}
			<div className="flex flex-col gap-6">
				{/* Upload Zone */}
				<div className={styles.glassCard}>
					<h2 className={styles.sectionTitle}>Upload Images</h2>
					<div
						className={`flex flex-col items-center justify-center gap-4 rounded-lg cursor-pointer ${styles.dropZone} ${isDragging ? styles.dropZoneActive : ""}`}
						onDragOver={handleDragOver}
						onDragLeave={handleDragLeave}
						onDrop={handleDrop}
						onClick={() => fileInputRef.current?.click()}
					>
						<ArrowUpTrayIcon className={`w-10 h-10 ${styles.dropIcon}`} />
						<div className="text-center">
							<p className={`text-sm font-medium ${styles.dropText}`}>
								Drop images here or click to browse
							</p>
							<p className={`text-xs mt-1 ${styles.dropHint}`}>
								PNG, JPEG, WebP accepted
							</p>
						</div>
					</div>
					<input
						ref={fileInputRef}
						type="file"
						accept="image/png,image/jpeg,image/webp"
						multiple
						onChange={handleFileSelect}
						className="hidden"
					/>
				</div>

				{/* Compression Settings */}
				<div className={styles.glassCard}>
					<h2 className={styles.sectionTitle}>Compression Settings</h2>

					{/* Quality Slider */}
					<div className="mb-5">
						<div className="flex justify-between items-center mb-2">
							<label className={styles.inputLabel}>Quality</label>
							<span className={`text-sm font-mono ${styles.sliderValue}`}>
								{quality}%
							</span>
						</div>
						<input
							type="range"
							min="1"
							max="100"
							value={quality}
							onChange={(e) => setQuality(parseInt(e.target.value, 10))}
							className={styles.slider}
						/>
						<div className="flex justify-between mt-1">
							<span className={`text-xs ${styles.hintText}`}>Smaller file</span>
							<span className={`text-xs ${styles.hintText}`}>Better quality</span>
						</div>
					</div>

					{/* Output Format */}
					<div className="mb-5">
						<label className={styles.inputLabel}>Output Format</label>
						<div className="grid grid-cols-3 gap-2">
							{FORMAT_OPTIONS.map((fmt) => (
								<button
									key={fmt.value}
									className={`${styles.formatBtn} ${outputFormat === fmt.value ? styles.active : ""}`}
									onClick={() => setOutputFormat(fmt.value)}
								>
									{fmt.label}
								</button>
							))}
						</div>
					</div>

					{/* Resize Options */}
					<div>
						<label className={styles.inputLabel}>
							Max Dimensions{" "}
							<span className={`text-xs font-normal ${styles.hintText}`}>
								(optional)
							</span>
						</label>
						<div className="grid grid-cols-2 gap-3">
							<input
								type="number"
								inputMode="numeric"
								min="1"
								placeholder="Max width"
								value={maxWidth}
								onChange={(e) => setMaxWidth(e.target.value)}
								className={styles.input}
							/>
							<input
								type="number"
								inputMode="numeric"
								min="1"
								placeholder="Max height"
								value={maxHeight}
								onChange={(e) => setMaxHeight(e.target.value)}
								className={styles.input}
							/>
						</div>
					</div>
				</div>

				{/* Actions */}
				{images.length > 0 && (
					<div className={styles.glassCard}>
						<h2 className={styles.sectionTitle}>Actions</h2>
						<div className="flex flex-col gap-3">
							<button className={styles.actionBtn} onClick={recompressAll}>
								Recompress All
							</button>
							<button className={styles.actionBtn} onClick={downloadAll}>
								<ArrowDownTrayIcon className="w-4 h-4" />
								Download All
							</button>
							<button className={styles.clearBtn} onClick={clearAll}>
								<TrashIcon className="w-4 h-4" />
								Clear All
							</button>
						</div>
					</div>
				)}
			</div>

			{/* Results Panel */}
			<div className="flex flex-col gap-6">
				{images.length > 0 && (
					<>
						{/* Summary Stats */}
						<div className={styles.glassCard}>
							<h2 className={styles.sectionTitle}>Summary</h2>
							<div className="grid grid-cols-3 gap-4">
								<div className="text-center">
									<p className={`text-xs mb-1 ${styles.statLabel}`}>Original</p>
									<p className={`text-sm font-semibold font-mono ${styles.statValue}`}>
										{formatBytes(totalOriginal)}
									</p>
								</div>
								<div className="text-center">
									<p className={`text-xs mb-1 ${styles.statLabel}`}>
										Compressed
									</p>
									<p className={`text-sm font-semibold font-mono ${styles.statValue}`}>
										{formatBytes(totalCompressed)}
									</p>
								</div>
								<div className="text-center">
									<p className={`text-xs mb-1 ${styles.statLabel}`}>Saved</p>
									<p className={`text-sm font-semibold font-mono ${styles.savingsValue}`}>
										{totalSavings}%
									</p>
								</div>
							</div>
							{/* Overall compression bar */}
							<div className={`mt-4 rounded-full ${styles.progressTrack}`}>
								<div
									className={`rounded-full ${styles.progressBar}`}
									style={{
										width: `${Math.max(0, Math.min(100, 100 - parseFloat(totalSavings)))}%`,
									}}
								/>
							</div>
							<div className="flex justify-between mt-1">
								<span className={`text-xs ${styles.hintText}`}>
									{formatBytes(totalCompressed)} of {formatBytes(totalOriginal)}
								</span>
								<span className={`text-xs ${styles.hintText}`}>
									{images.length} image{images.length !== 1 ? "s" : ""}
								</span>
							</div>
						</div>

						{/* Image List */}
						<div className="flex flex-col gap-4">
							{images.map((img) => {
								const savings =
									img.originalSize > 0 && img.compressedSize > 0
										? (
												((img.originalSize - img.compressedSize) /
													img.originalSize) *
												100
											).toFixed(1)
										: "0";
								const compressionRatio =
									img.originalSize > 0 && img.compressedSize > 0
										? Math.max(
												0,
												Math.min(
													100,
													100 - parseFloat(savings)
												)
											)
										: 100;

								return (
									<div key={img.id} className={styles.glassCard}>
										<div className={`flex gap-4 ${styles.imageRow}`}>
											{/* Thumbnail */}
											<div className={`shrink-0 rounded-md overflow-hidden ${styles.thumbnail}`}>
												{img.compressedUrl ? (
													<img
														src={img.compressedUrl}
														alt={img.name}
														className="w-full h-full object-cover"
													/>
												) : (
													<img
														src={img.previewUrl}
														alt={img.name}
														className="w-full h-full object-cover"
													/>
												)}
											</div>

											{/* Info */}
											<div className="flex-1 min-w-0">
												<div className="flex items-start justify-between gap-2 mb-2">
													<p className={`text-sm font-medium truncate ${styles.fileName}`}>
														{img.name}
													</p>
													<div className="flex gap-1 shrink-0">
														{img.compressedBlob && (
															<button
																className={styles.iconBtn}
																onClick={() => downloadImage(img)}
																title="Download"
															>
																<ArrowDownTrayIcon className="w-4 h-4" />
															</button>
														)}
														<button
															className={styles.iconBtn}
															onClick={() => removeImage(img.id)}
															title="Remove"
														>
															<TrashIcon className="w-4 h-4" />
														</button>
													</div>
												</div>

												<div className={`flex flex-wrap gap-x-4 gap-y-1 text-xs mb-3 ${styles.metaRow}`}>
													<span>
														{img.width} x {img.height}
													</span>
													<span>{img.format}</span>
													<span>{formatBytes(img.originalSize)}</span>
												</div>

												{img.compressing ? (
													<div className={`flex items-center gap-2 text-xs ${styles.hintText}`}>
														<div className={styles.spinner} />
														Compressing...
													</div>
												) : img.compressedSize > 0 ? (
													<>
														<div className="flex items-center justify-between mb-1">
															<span className={`text-xs font-mono ${styles.hintText}`}>
																{formatBytes(img.compressedSize)}
															</span>
															<span
																className={`text-xs font-semibold font-mono ${
																	parseFloat(savings) > 0
																		? styles.savingsValue
																		: styles.negativeValue
																}`}
															>
																{parseFloat(savings) > 0
																	? `-${savings}%`
																	: `+${Math.abs(parseFloat(savings)).toFixed(1)}%`}
															</span>
														</div>
														<div className={`rounded-full ${styles.progressTrack}`}>
															<div
																className={`rounded-full ${styles.progressBar}`}
																style={{ width: `${compressionRatio}%` }}
															/>
														</div>
													</>
												) : null}
											</div>
										</div>
									</div>
								);
							})}
						</div>
					</>
				)}

				{/* Empty State */}
				{images.length === 0 && (
					<div className={styles.glassCard}>
						<div className="flex flex-col items-center justify-center py-16 text-center">
							<PhotoIcon className={`w-16 h-16 mb-4 ${styles.emptyIcon}`} />
							<p className={`text-sm font-medium mb-1 ${styles.emptyTitle}`}>
								No images uploaded
							</p>
							<p className={`text-xs ${styles.hintText}`}>
								Upload images to start compressing
							</p>
						</div>
					</div>
				)}

				{/* Info Box */}
				<div className={`flex items-start gap-4 p-4 rounded-md ${styles.infoBox}`}>
					<PhotoIcon className={`w-6 h-6 shrink-0 ${styles.infoIcon}`} />
					<p className={styles.infoText}>
						All compression happens in your browser using the Canvas API. No
						images are uploaded to any server. Supported formats: PNG, JPEG, and
						WebP.
					</p>
				</div>
			</div>

			{/* Hidden canvas for compression */}
			<canvas ref={canvasRef} style={{ display: "none" }} />
		</div>
	);
}
