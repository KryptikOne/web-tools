"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
	ArrowDownTrayIcon,
	ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { ColorPickerPopover } from "@/components/ColorPickerPopover";
import styles from "./IconGenerator.module.scss";

type Shape = "circle" | "square" | "rounded-square" | "hexagon" | "diamond" | "triangle";
type BorderStyle = "solid" | "none";
type GradientDirection = "to right" | "to bottom" | "to bottom right" | "to bottom left";

const SHAPES: { value: Shape; label: string }[] = [
	{ value: "circle", label: "Circle" },
	{ value: "square", label: "Square" },
	{ value: "rounded-square", label: "Rounded" },
	{ value: "hexagon", label: "Hexagon" },
	{ value: "diamond", label: "Diamond" },
	{ value: "triangle", label: "Triangle" },
];

const ICON_SIZES = [16, 32, 48, 64, 128, 256, 512];

const GRADIENT_DIRECTIONS: { value: GradientDirection; label: string }[] = [
	{ value: "to right", label: "Horizontal" },
	{ value: "to bottom", label: "Vertical" },
	{ value: "to bottom right", label: "Diagonal" },
	{ value: "to bottom left", label: "Diagonal (inv)" },
];

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	return result
		? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
		: null;
}

function createCanvasGradient(
	ctx: CanvasRenderingContext2D,
	size: number,
	color1: string,
	color2: string,
	direction: GradientDirection
): CanvasGradient {
	let x0 = 0, x1 = 0;
	const y0 = 0;
	let y1 = 0;
	switch (direction) {
		case "to right": x1 = size; break;
		case "to bottom": y1 = size; break;
		case "to bottom right": x1 = size; y1 = size; break;
		case "to bottom left": x0 = size; y1 = size; break;
	}
	const gradient = ctx.createLinearGradient(x0, y0, x1, y1);
	gradient.addColorStop(0, color1);
	gradient.addColorStop(1, color2);
	return gradient;
}

function drawShapePath(ctx: CanvasRenderingContext2D, shape: Shape, size: number, inset: number = 0) {
	const s = size - inset * 2;
	const cx = size / 2;
	const cy = size / 2;
	const half = s / 2;

	ctx.beginPath();
	switch (shape) {
		case "circle":
			ctx.arc(cx, cy, half, 0, Math.PI * 2);
			break;
		case "square":
			ctx.rect(inset, inset, s, s);
			break;
		case "rounded-square": {
			const r = s * 0.2;
			const x = inset, y = inset;
			ctx.moveTo(x + r, y);
			ctx.lineTo(x + s - r, y);
			ctx.quadraticCurveTo(x + s, y, x + s, y + r);
			ctx.lineTo(x + s, y + s - r);
			ctx.quadraticCurveTo(x + s, y + s, x + s - r, y + s);
			ctx.lineTo(x + r, y + s);
			ctx.quadraticCurveTo(x, y + s, x, y + s - r);
			ctx.lineTo(x, y + r);
			ctx.quadraticCurveTo(x, y, x + r, y);
			break;
		}
		case "hexagon": {
			for (let i = 0; i < 6; i++) {
				const angle = (Math.PI / 3) * i - Math.PI / 6;
				const px = cx + half * Math.cos(angle);
				const py = cy + half * Math.sin(angle);
				if (i === 0) ctx.moveTo(px, py);
				else ctx.lineTo(px, py);
			}
			break;
		}
		case "diamond":
			ctx.moveTo(cx, inset);
			ctx.lineTo(inset + s, cy);
			ctx.lineTo(cx, inset + s);
			ctx.lineTo(inset, cy);
			break;
		case "triangle":
			ctx.moveTo(cx, inset);
			ctx.lineTo(inset + s, inset + s);
			ctx.lineTo(inset, inset + s);
			break;
	}
	ctx.closePath();
}

function getTextCenter(shape: Shape, size: number): { x: number; y: number } {
	// Triangle needs the text shifted down since the visual center is lower
	if (shape === "triangle") {
		return { x: size / 2, y: size * 0.6 };
	}
	return { x: size / 2, y: size / 2 };
}

export default function IconGenerator() {
	const [shape, setShape] = useState<Shape>("rounded-square");
	const [bgColor, setBgColor] = useState("#4f46e5");
	const [text, setText] = useState("A");
	const [textColor, setTextColor] = useState("#ffffff");
	const [fontSize, setFontSize] = useState(50);
	const [iconSize, setIconSize] = useState(128);
	const [borderWidth, setBorderWidth] = useState(0);
	const [borderColor, setBorderColor] = useState("#000000");
	const [borderStyle, setBorderStyle] = useState<BorderStyle>("solid");
	const [useGradient, setUseGradient] = useState(false);
	const [gradientColor1, setGradientColor1] = useState("#4f46e5");
	const [gradientColor2, setGradientColor2] = useState("#7c3aed");
	const [gradientDirection, setGradientDirection] = useState<GradientDirection>("to bottom right");

	const canvasRef = useRef<HTMLCanvasElement>(null);
	const previewCanvasRef = useRef<HTMLCanvasElement>(null);

	const renderToCanvas = useCallback(
		(canvas: HTMLCanvasElement, size: number) => {
			const ctx = canvas.getContext("2d");
			if (!ctx) return;

			canvas.width = size;
			canvas.height = size;
			ctx.clearRect(0, 0, size, size);

			const effectiveBorderWidth = borderStyle === "none" ? 0 : borderWidth;
			const inset = effectiveBorderWidth / 2;

			// Draw shape fill
			drawShapePath(ctx, shape, size, inset);
			if (useGradient) {
				ctx.fillStyle = createCanvasGradient(ctx, size, gradientColor1, gradientColor2, gradientDirection);
			} else {
				ctx.fillStyle = bgColor;
			}
			ctx.fill();

			// Draw border
			if (effectiveBorderWidth > 0) {
				drawShapePath(ctx, shape, size, inset);
				ctx.strokeStyle = borderColor;
				ctx.lineWidth = effectiveBorderWidth;
				ctx.stroke();
			}

			// Draw text
			if (text.trim()) {
				const computedFontSize = (fontSize / 100) * size * 0.8;
				ctx.font = `bold ${computedFontSize}px sans-serif`;
				ctx.fillStyle = textColor;
				ctx.textAlign = "center";
				ctx.textBaseline = "middle";
				const center = getTextCenter(shape, size);
				ctx.fillText(text.slice(0, 3), center.x, center.y);
			}
		},
		[shape, bgColor, text, textColor, fontSize, iconSize, borderWidth, borderColor, borderStyle, useGradient, gradientColor1, gradientColor2, gradientDirection]
	);

	// Render preview whenever settings change
	useEffect(() => {
		const canvas = previewCanvasRef.current;
		if (canvas) {
			// Preview always renders at the selected icon size, but displayed in a fixed container
			renderToCanvas(canvas, iconSize);
		}
	}, [renderToCanvas, iconSize]);

	const downloadPNG = () => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		renderToCanvas(canvas, iconSize);

		const link = document.createElement("a");
		link.download = `icon-${iconSize}x${iconSize}.png`;
		link.href = canvas.toDataURL("image/png");
		link.click();
	};

	const buildSVG = useCallback((): string => {
		const size = iconSize;
		const effectiveBorderWidth = borderStyle === "none" ? 0 : borderWidth;
		const inset = effectiveBorderWidth / 2;

		let gradientDef = "";
		let fillAttr = bgColor;
		if (useGradient) {
			let x1 = "0%";
			const y1 = "0%";
			let x2 = "0%", y2 = "0%";
			switch (gradientDirection) {
				case "to right": x2 = "100%"; break;
				case "to bottom": y2 = "100%"; break;
				case "to bottom right": x2 = "100%"; y2 = "100%"; break;
				case "to bottom left": x1 = "100%"; y2 = "100%"; break;
			}
			gradientDef = `<defs><linearGradient id="bg" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"><stop offset="0%" stop-color="${gradientColor1}"/><stop offset="100%" stop-color="${gradientColor2}"/></linearGradient></defs>`;
			fillAttr = "url(#bg)";
		}

		let shapeEl = "";
		const s = size - inset * 2;
		const cx = size / 2;
		const cy = size / 2;
		const half = s / 2;
		const strokeAttr = effectiveBorderWidth > 0
			? ` stroke="${borderColor}" stroke-width="${effectiveBorderWidth}"`
			: "";

		switch (shape) {
			case "circle":
				shapeEl = `<circle cx="${cx}" cy="${cy}" r="${half}" fill="${fillAttr}"${strokeAttr}/>`;
				break;
			case "square":
				shapeEl = `<rect x="${inset}" y="${inset}" width="${s}" height="${s}" fill="${fillAttr}"${strokeAttr}/>`;
				break;
			case "rounded-square": {
				const r = s * 0.2;
				shapeEl = `<rect x="${inset}" y="${inset}" width="${s}" height="${s}" rx="${r}" ry="${r}" fill="${fillAttr}"${strokeAttr}/>`;
				break;
			}
			case "hexagon": {
				const pts = Array.from({ length: 6 }, (_, i) => {
					const angle = (Math.PI / 3) * i - Math.PI / 6;
					return `${cx + half * Math.cos(angle)},${cy + half * Math.sin(angle)}`;
				}).join(" ");
				shapeEl = `<polygon points="${pts}" fill="${fillAttr}"${strokeAttr}/>`;
				break;
			}
			case "diamond": {
				const pts = `${cx},${inset} ${inset + s},${cy} ${cx},${inset + s} ${inset},${cy}`;
				shapeEl = `<polygon points="${pts}" fill="${fillAttr}"${strokeAttr}/>`;
				break;
			}
			case "triangle": {
				const pts = `${cx},${inset} ${inset + s},${inset + s} ${inset},${inset + s}`;
				shapeEl = `<polygon points="${pts}" fill="${fillAttr}"${strokeAttr}/>`;
				break;
			}
		}

		let textEl = "";
		if (text.trim()) {
			const computedFontSize = (fontSize / 100) * size * 0.8;
			const center = getTextCenter(shape, size);
			textEl = `<text x="${center.x}" y="${center.y}" fill="${textColor}" font-size="${computedFontSize}" font-weight="bold" font-family="sans-serif" text-anchor="middle" dominant-baseline="central">${escapeXml(text.slice(0, 3))}</text>`;
		}

		return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${gradientDef}${shapeEl}${textEl}</svg>`;
	}, [shape, bgColor, text, textColor, fontSize, iconSize, borderWidth, borderColor, borderStyle, useGradient, gradientColor1, gradientColor2, gradientDirection]);

	const downloadSVG = () => {
		const svgString = buildSVG();
		const blob = new Blob([svgString], { type: "image/svg+xml" });
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.download = `icon-${iconSize}x${iconSize}.svg`;
		link.href = url;
		link.click();
		URL.revokeObjectURL(url);
	};

	const resetAll = () => {
		setShape("rounded-square");
		setBgColor("#4f46e5");
		setText("A");
		setTextColor("#ffffff");
		setFontSize(50);
		setIconSize(128);
		setBorderWidth(0);
		setBorderColor("#000000");
		setBorderStyle("solid");
		setUseGradient(false);
		setGradientColor1("#4f46e5");
		setGradientColor2("#7c3aed");
		setGradientDirection("to bottom right");
	};

	return (
		<div className={styles.container}>
			{/* Controls Panel */}
			<div className="flex flex-col gap-6">
				{/* Shape Selection */}
				<div className={styles.glassCard}>
					<h2 className={styles.sectionTitle}>Shape</h2>
					<div className="grid grid-cols-3 gap-2">
						{SHAPES.map((s) => (
							<button
								key={s.value}
								className={`${styles.shapeBtn} ${shape === s.value ? styles.active : ""}`}
								onClick={() => setShape(s.value)}
							>
								{s.label}
							</button>
						))}
					</div>
				</div>

				{/* Background */}
				<div className={styles.glassCard}>
					<h2 className={styles.sectionTitle}>Background</h2>
					<div className="flex flex-col gap-4">
						{/* Solid color */}
						{!useGradient && (
							<div className="flex gap-3 items-center">
								<ColorPickerPopover color={bgColor} onChange={setBgColor} swatchSize="sm" />
								<input
									type="text"
									value={bgColor}
									onChange={(e) => setBgColor(e.target.value)}
									maxLength={7}
									className={styles.inputField}
								/>
							</div>
						)}

						{/* Gradient toggle */}
						<div className="flex items-center gap-3">
							<input
								type="checkbox"
								id="useGradient"
								checked={useGradient}
								onChange={(e) => setUseGradient(e.target.checked)}
								className="w-4 h-4 rounded"
							/>
							<label htmlFor="useGradient" className={`text-sm ${styles.inputLabel}`}>
								Use gradient
							</label>
						</div>

						{/* Gradient controls */}
						{useGradient && (
							<div className="flex flex-col gap-3">
								<div className="flex gap-3 items-center">
									<ColorPickerPopover color={gradientColor1} onChange={setGradientColor1} swatchSize="sm" />
									<input
										type="text"
										value={gradientColor1}
										onChange={(e) => setGradientColor1(e.target.value)}
										maxLength={7}
										className={styles.inputField}
									/>
								</div>
								<div className="flex gap-3 items-center">
									<ColorPickerPopover color={gradientColor2} onChange={setGradientColor2} swatchSize="sm" />
									<input
										type="text"
										value={gradientColor2}
										onChange={(e) => setGradientColor2(e.target.value)}
										maxLength={7}
										className={styles.inputField}
									/>
								</div>
								<div className="flex flex-col gap-1">
									<label className={styles.inputLabel}>Direction</label>
									<div className="grid grid-cols-2 gap-2">
										{GRADIENT_DIRECTIONS.map((d) => (
											<button
												key={d.value}
												className={`${styles.shapeBtn} ${gradientDirection === d.value ? styles.active : ""}`}
												onClick={() => setGradientDirection(d.value)}
											>
												{d.label}
											</button>
										))}
									</div>
								</div>
							</div>
						)}
					</div>
				</div>

				{/* Text */}
				<div className={styles.glassCard}>
					<h2 className={styles.sectionTitle}>Text</h2>
					<div className="flex flex-col gap-4">
						<div className="flex flex-col gap-1">
							<label className={styles.inputLabel}>Characters (1-3)</label>
							<input
								type="text"
								value={text}
								onChange={(e) => setText(e.target.value.slice(0, 3))}
								maxLength={3}
								placeholder="A"
								className={styles.inputField}
							/>
						</div>
						<div className="flex flex-col gap-1">
							<label className={styles.inputLabel}>Text Color</label>
							<div className="flex gap-3 items-center">
								<ColorPickerPopover color={textColor} onChange={setTextColor} swatchSize="sm" />
								<input
									type="text"
									value={textColor}
									onChange={(e) => setTextColor(e.target.value)}
									maxLength={7}
									className={styles.inputField}
								/>
							</div>
						</div>
						<div className="flex flex-col gap-1">
							<div className="flex justify-between items-center">
								<label className={styles.inputLabel}>Font Size</label>
								<span className={styles.sliderValue}>{fontSize}%</span>
							</div>
							<input
								type="range"
								min="10"
								max="100"
								value={fontSize}
								onChange={(e) => setFontSize(parseInt(e.target.value, 10))}
								className={styles.slider}
							/>
						</div>
					</div>
				</div>

				{/* Size & Border */}
				<div className={styles.glassCard}>
					<h2 className={styles.sectionTitle}>Size &amp; Border</h2>
					<div className="flex flex-col gap-4">
						<div className="flex flex-col gap-1">
							<label className={styles.inputLabel}>Icon Size</label>
							<div className="flex flex-wrap gap-2">
								{ICON_SIZES.map((s) => (
									<button
										key={s}
										className={`${styles.sizeBtn} ${iconSize === s ? styles.active : ""}`}
										onClick={() => setIconSize(s)}
									>
										{s}
									</button>
								))}
							</div>
						</div>
						<div className="flex flex-col gap-1">
							<label className={styles.inputLabel}>Border Style</label>
							<div className="flex gap-2">
								<button
									className={`${styles.shapeBtn} ${borderStyle === "solid" ? styles.active : ""}`}
									onClick={() => setBorderStyle("solid")}
								>
									Solid
								</button>
								<button
									className={`${styles.shapeBtn} ${borderStyle === "none" ? styles.active : ""}`}
									onClick={() => setBorderStyle("none")}
								>
									None
								</button>
							</div>
						</div>
						{borderStyle === "solid" && (
							<>
								<div className="flex flex-col gap-1">
									<div className="flex justify-between items-center">
										<label className={styles.inputLabel}>Border Width</label>
										<span className={styles.sliderValue}>{borderWidth}px</span>
									</div>
									<input
										type="range"
										min="0"
										max="20"
										value={borderWidth}
										onChange={(e) => setBorderWidth(parseInt(e.target.value, 10))}
										className={styles.slider}
									/>
								</div>
								<div className="flex flex-col gap-1">
									<label className={styles.inputLabel}>Border Color</label>
									<div className="flex gap-3 items-center">
										<ColorPickerPopover color={borderColor} onChange={setBorderColor} swatchSize="sm" />
										<input
											type="text"
											value={borderColor}
											onChange={(e) => setBorderColor(e.target.value)}
											maxLength={7}
											className={styles.inputField}
										/>
									</div>
								</div>
							</>
						)}
					</div>
				</div>

				{/* Reset */}
				<button className={styles.resetBtn} onClick={resetAll}>
					<ArrowPathIcon className="w-4 h-4" />
					Reset
				</button>
			</div>

			{/* Preview & Download Panel */}
			<div className="flex flex-col gap-6">
				<div className={styles.glassCard}>
					<h2 className={styles.sectionTitle}>Preview</h2>
					<div className={`flex items-center justify-center ${styles.previewArea}`}>
						<canvas
							ref={previewCanvasRef}
							style={{ width: Math.min(iconSize, 256), height: Math.min(iconSize, 256) }}
						/>
					</div>
					<p className={`text-xs text-center mt-3 ${styles.previewLabel}`}>
						{iconSize} x {iconSize}px
					</p>
				</div>

				<div className={styles.glassCard}>
					<h2 className={styles.sectionTitle}>Download</h2>
					<div className="flex flex-col gap-3">
						<button className={styles.downloadBtn} onClick={downloadPNG}>
							<ArrowDownTrayIcon className="w-5 h-5" />
							Download PNG
						</button>
						<button className={styles.downloadBtn} onClick={downloadSVG}>
							<ArrowDownTrayIcon className="w-5 h-5" />
							Download SVG
						</button>
					</div>
				</div>
			</div>

			{/* Hidden canvas for export */}
			<canvas ref={canvasRef} style={{ display: "none" }} />
		</div>
	);
}

function escapeXml(str: string): string {
	return str
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&apos;");
}
