"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ColorUtils } from "@/lib/colorUtils";
import { useIsMobile } from "@/hooks/useIsMobile";
import styles from "./ColorPickerPanel.module.scss";

const FALLBACK_RGB: [number, number, number] = [255, 0, 0];

export interface ColorPickerPanelProps {
	/** Current color as hex string (e.g., "#ff0000") */
	color: string;
	/** Callback when color changes */
	onChange: (color: string) => void;
	/** Disable the picker */
	disabled?: boolean;
	/** Show hex value (default: true) */
	showHex?: boolean;
	/** Make hex value editable as input (default: false) */
	hexEditable?: boolean;
	/** Show color preview swatch (default: true) */
	showPreview?: boolean;
	/** Optional className for the container */
	className?: string;
}

/**
 * A reusable HSV color picker panel.
 * On desktop: renders a canvas-based saturation/value picker with hue slider.
 * On mobile: falls back to the native color input for better UX.
 */
export function ColorPickerPanel({
	color,
	onChange,
	disabled = false,
	showHex = true,
	hexEditable = false,
	showPreview = true,
	className,
}: ColorPickerPanelProps) {
	const isMobile = useIsMobile();

	// Show loading skeleton during SSR/hydration
	if (isMobile === null) {
		return <div className={`${styles.skeleton} ${className ?? ""}`} />;
	}

	// Mobile: use native color picker
	if (isMobile) {
		return (
			<div className={`${styles.mobileWrapper} ${className ?? ""}`}>
				<input
					type="color"
					value={color}
					onChange={(e) => onChange(e.target.value)}
					disabled={disabled}
					className={styles.nativeInput}
				/>
				{showHex && <span className={styles.hexDisplay}>{color}</span>}
			</div>
		);
	}

	// Desktop: use custom HSV picker
	return (
		<DesktopColorPicker
			color={color}
			onChange={onChange}
			disabled={disabled}
			showHex={showHex}
			hexEditable={hexEditable}
			showPreview={showPreview}
			className={className}
		/>
	);
}

/**
 * Desktop HSV color picker with canvas-based saturation/value and hue controls.
 */
function DesktopColorPicker({
	color,
	onChange,
	disabled,
	showHex,
	hexEditable,
	showPreview,
	className,
}: ColorPickerPanelProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const hueRef = useRef<HTMLCanvasElement>(null);
	const [hsv, setHsv] = useState<[number, number, number]>(() => {
		const rgb = ColorUtils.hexToRgb(color, FALLBACK_RGB);
		return ColorUtils.rgbToHsv(...rgb);
	});
	const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
	const [isDraggingHue, setIsDraggingHue] = useState(false);
	// Track raw input for multi-format support
	const [hexInputValue, setHexInputValue] = useState(color);

	// Sync input value when external color changes (but not when user is typing)
	useEffect(() => {
		setHexInputValue(color);
	}, [color]);

	// Sync HSV when external color changes
	useEffect(() => {
		const rgb = ColorUtils.hexToRgb(color, FALLBACK_RGB);
		const newHsv = ColorUtils.rgbToHsv(...rgb);
		// Only update if significantly different to avoid loops
		if (Math.abs(newHsv[0] - hsv[0]) > 1 || Math.abs(newHsv[1] - hsv[1]) > 0.01 || Math.abs(newHsv[2] - hsv[2]) > 0.01) {
			setHsv(newHsv);
		}
	}, [color]); // eslint-disable-line react-hooks/exhaustive-deps

	const hue = hsv[0];

	// Draw saturation/value canvas
	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		const width = canvas.width;
		const height = canvas.height;

		// Draw hue base
		const [r, g, b] = ColorUtils.hsvToRgb(hue, 1, 1);
		ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
		ctx.fillRect(0, 0, width, height);

		// White gradient (left to right)
		const whiteGradient = ctx.createLinearGradient(0, 0, width, 0);
		whiteGradient.addColorStop(0, "rgba(255, 255, 255, 1)");
		whiteGradient.addColorStop(1, "rgba(255, 255, 255, 0)");
		ctx.fillStyle = whiteGradient;
		ctx.fillRect(0, 0, width, height);

		// Black gradient (top to bottom)
		const blackGradient = ctx.createLinearGradient(0, 0, 0, height);
		blackGradient.addColorStop(0, "rgba(0, 0, 0, 0)");
		blackGradient.addColorStop(1, "rgba(0, 0, 0, 1)");
		ctx.fillStyle = blackGradient;
		ctx.fillRect(0, 0, width, height);
	}, [hue]);

	// Draw hue slider
	useEffect(() => {
		const canvas = hueRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		const width = canvas.width;
		const height = canvas.height;
		const gradient = ctx.createLinearGradient(0, 0, width, 0);

		for (let i = 0; i <= 360; i += 60) {
			const [r, g, b] = ColorUtils.hsvToRgb(i, 1, 1);
			gradient.addColorStop(i / 360, `rgb(${r}, ${g}, ${b})`);
		}

		ctx.fillStyle = gradient;
		ctx.fillRect(0, 0, width, height);
	}, []);

	// Update color when HSV changes (only from user interaction)
	const updateColorFromHsv = useCallback(
		(newHsv: [number, number, number]) => {
			const [r, g, b] = ColorUtils.hsvToRgb(newHsv[0], newHsv[1], newHsv[2]);
			const newHex = ColorUtils.rgbToHex(r, g, b);
			onChange(newHex);
		},
		[onChange]
	);

	const handleCanvasInteraction = useCallback(
		(e: React.MouseEvent<HTMLCanvasElement>) => {
			if (disabled) return;
			const canvas = canvasRef.current;
			if (!canvas) return;

			const rect = canvas.getBoundingClientRect();
			const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
			const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

			const newHsv: [number, number, number] = [hsv[0], x, 1 - y];
			setHsv(newHsv);
			updateColorFromHsv(newHsv);
		},
		[hsv, disabled, updateColorFromHsv]
	);

	const handleHueInteraction = useCallback(
		(e: React.MouseEvent<HTMLCanvasElement>) => {
			if (disabled) return;
			const canvas = hueRef.current;
			if (!canvas) return;

			const rect = canvas.getBoundingClientRect();
			const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));

			const newHsv: [number, number, number] = [x * 360, hsv[1], hsv[2]];
			setHsv(newHsv);
			updateColorFromHsv(newHsv);
		},
		[hsv, disabled, updateColorFromHsv]
	);

	// Parse multi-format color input (hex, rgb, hsl, oklch)
	const handleColorInputCommit = useCallback(() => {
		if (disabled) return;
		const input = hexInputValue.trim();

		// Try parsing with ColorUtils (supports hex, rgb, hsl, oklch)
		const parsed = ColorUtils.parseColor(input);
		if (parsed) {
			const newHex = ColorUtils.rgbToHex(...parsed.rgb);
			onChange(newHex);
			setHsv(ColorUtils.rgbToHsv(...parsed.rgb));
			setHexInputValue(newHex);
			return;
		}

		// Also try adding # prefix if it looks like a hex without it
		if (/^[0-9A-Fa-f]{3,6}$/.test(input)) {
			const withHash = '#' + input;
			const parsedHex = ColorUtils.parseColor(withHash);
			if (parsedHex) {
				const newHex = ColorUtils.rgbToHex(...parsedHex.rgb);
				onChange(newHex);
				setHsv(ColorUtils.rgbToHsv(...parsedHex.rgb));
				setHexInputValue(newHex);
				return;
			}
		}

		// Invalid input - revert to current color
		setHexInputValue(color);
	}, [hexInputValue, color, onChange, disabled]);

	return (
		<div className={`${styles.panel} ${disabled ? styles.disabled : ""} ${className ?? ""}`}>
			{/* Saturation/Value Canvas */}
			<div className={styles.canvasContainer}>
				<canvas
					ref={canvasRef}
					width={280}
					height={180}
					className={styles.colorCanvas}
					onMouseDown={(e) => {
						if (disabled) return;
						setIsDraggingCanvas(true);
						handleCanvasInteraction(e);
					}}
					onMouseMove={(e) => isDraggingCanvas && handleCanvasInteraction(e)}
					onMouseUp={() => setIsDraggingCanvas(false)}
					onMouseLeave={() => setIsDraggingCanvas(false)}
				/>
				{/* Canvas cursor */}
				<div
					className={styles.canvasCursor}
					style={{
						left: `${hsv[1] * 100}%`,
						top: `${(1 - hsv[2]) * 100}%`,
					}}
				/>
			</div>

			{/* Hue Slider */}
			<div className={styles.hueContainer}>
				<canvas
					ref={hueRef}
					width={280}
					height={20}
					className={styles.hueCanvas}
					onMouseDown={(e) => {
						if (disabled) return;
						setIsDraggingHue(true);
						handleHueInteraction(e);
					}}
					onMouseMove={(e) => isDraggingHue && handleHueInteraction(e)}
					onMouseUp={() => setIsDraggingHue(false)}
					onMouseLeave={() => setIsDraggingHue(false)}
				/>
				{/* Hue cursor */}
				<div className={styles.hueCursor} style={{ left: `${(hsv[0] / 360) * 100}%` }} />
			</div>

			{/* Footer with preview and hex */}
			{(showPreview || showHex) && (
				<div className={styles.footer}>
					{showPreview && <div className={styles.preview} style={{ backgroundColor: color }} />}
					{showHex && (
						hexEditable ? (
							<input
								type="text"
								value={hexInputValue}
								onChange={(e) => setHexInputValue(e.target.value)}
								onBlur={handleColorInputCommit}
								onKeyDown={(e) => {
									if (e.key === 'Enter') {
										handleColorInputCommit();
										(e.target as HTMLInputElement).blur();
									}
								}}
								className={styles.hexInput}
								placeholder="#hex, rgb(), hsl(), oklch()"
								disabled={disabled}
							/>
						) : (
							<span className={styles.hexDisplay}>{color}</span>
						)
					)}
				</div>
			)}
		</div>
	);
}

export default ColorPickerPanel;
