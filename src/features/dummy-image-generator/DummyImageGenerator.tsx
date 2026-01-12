"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ArrowDownTrayIcon, PhotoIcon } from "@heroicons/react/24/outline";
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

export default function DummyImageGenerator() {
	const [width, setWidth] = useState<number>(1920);
	const [height, setHeight] = useState<number>(1080);
	const [backgroundColor, setBackgroundColor] = useState<string>("#3b82f6");
	const [textColor, setTextColor] = useState<string>("#ffffff");
	const [format, setFormat] = useState<ImageFormat>("png");
	const [noise, setNoise] = useState<number>(0);
	const [fileSize, setFileSize] = useState<string>("");
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const previewCanvasRef = useRef<HTMLCanvasElement>(null);

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

			// Calculate base64 size
			const base64Length = dataUrl.split(",")[1].length;
			const sizeInBytes = (base64Length * 3) / 4;

			// Format size
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

	const generateImage = useCallback(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		canvas.width = width;
		canvas.height = height;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		// Fill background
		ctx.fillStyle = backgroundColor;
		ctx.fillRect(0, 0, width, height);

		// Add noise if requested
		if (noise > 0) {
			const imageData = ctx.getImageData(0, 0, width, height);
			const data = imageData.data;
			const noiseAmount = noise * 2.55; // Convert 0-100 to 0-255

			for (let i = 0; i < data.length; i += 4) {
				const randomNoise = (Math.random() - 0.5) * noiseAmount;
				data[i] = Math.max(0, Math.min(255, data[i] + randomNoise)); // R
				data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + randomNoise)); // G
				data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + randomNoise)); // B
			}

			ctx.putImageData(imageData, 0, 0);
		}

		// Draw dimension text
		const text = `${width} × ${height}`;
		const fontSize = Math.min(width, height) / 10;
		ctx.font = `${fontSize}px sans-serif`;
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";
		ctx.fillStyle = textColor;
		ctx.fillText(text, width / 2, height / 2);

		// Update preview (scaled down)
		updatePreview();

		// Calculate file size
		updateFileSize();
	}, [width, height, backgroundColor, textColor, noise, updatePreview, updateFileSize]);

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

	const handlePresetClick = (preset: { width: number; height: number }) => {
		setWidth(preset.width);
		setHeight(preset.height);
	};

	// Regenerate image when settings change
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
		<div className={styles.container}>
			{/* Settings Section */}
			<div className={styles.settingsPanel}>
				{/* Size Presets */}
				<div className={styles.glassCard}>
					<h2 className={styles.sectionTitle}>Size Presets</h2>
					<div className={styles.presetsGrid}>
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
					<div className={styles.dimensionsGrid}>
						<div className={styles.inputGroup}>
							<label className={styles.inputLabel}>Width (1-4000px)</label>
							<input type="number" min="1" max="4000" value={width} onChange={(e) => handleWidthChange(e.target.value)} className={styles.input} />
						</div>
						<div className={styles.inputGroup}>
							<label className={styles.inputLabel}>Height (1-3000px)</label>
							<input type="number" min="1" max="3000" value={height} onChange={(e) => handleHeightChange(e.target.value)} className={styles.input} />
						</div>
					</div>
				</div>

				{/* Colors */}
				<div className={styles.glassCard}>
					<h2 className={styles.sectionTitle}>Colors</h2>
					<div className={styles.colorsGrid}>
						<div className={styles.inputGroup}>
							<label className={styles.inputLabel}>Background Color</label>
							<div className={styles.colorInputWrapper}>
								<input type="color" value={backgroundColor} onChange={(e) => setBackgroundColor(e.target.value)} className={styles.colorInput} />
								<input type="text" value={backgroundColor} onChange={(e) => setBackgroundColor(e.target.value)} className={styles.colorTextInput} />
							</div>
						</div>
						<div className={styles.inputGroup}>
							<label className={styles.inputLabel}>Text Color</label>
							<div className={styles.colorInputWrapper}>
								<input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} className={styles.colorInput} />
								<input type="text" value={textColor} onChange={(e) => setTextColor(e.target.value)} className={styles.colorTextInput} />
							</div>
						</div>
					</div>
				</div>

				{/* Format & Noise */}
				<div className={styles.glassCard}>
					<h2 className={styles.sectionTitle}>Format & Advanced</h2>
					<div className={styles.inputGroup}>
						<label className={styles.inputLabel}>Output Format</label>
						<div className={styles.formatButtons}>
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
					<div className={styles.inputGroup}>
						<label className={styles.inputLabel}>
							Noise Level: {noise}%
							<span className={styles.inputHint}>(Increases file size)</span>
						</label>
						<input type="range" min="0" max="100" value={noise} onChange={(e) => setNoise(parseInt(e.target.value, 10))} className={styles.slider} />
					</div>
				</div>
			</div>

			{/* Preview Section */}
			<div className={styles.previewPanel}>
				<div className={styles.glassCard}>
					<div className={styles.previewHeader}>
						<div>
							<h2 className={styles.sectionTitle}>Preview</h2>
							<p className={styles.previewInfo}>
								{width} × {height}px • {fileSize}
							</p>
						</div>
						<button className={styles.downloadBtn} onClick={handleDownload}>
							<ArrowDownTrayIcon className={styles.downloadIcon} />
							Download
						</button>
					</div>

					<div className={styles.previewContainer}>
						<canvas ref={previewCanvasRef} className={styles.previewCanvas} />
					</div>

					<div className={styles.infoBox}>
						<PhotoIcon className={styles.infoIcon} />
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
