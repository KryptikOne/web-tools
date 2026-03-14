"use client";

import { useState, useCallback, useMemo } from "react";
import { ClipboardDocumentIcon, CheckIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import styles from "./BackgroundPatternGenerator.module.scss";

type PatternType = "stripes-horizontal" | "stripes-vertical" | "stripes-diagonal" | "dots" | "checkerboard" | "grid" | "zigzag" | "waves" | "triangles";

interface PatternConfig {
	type: PatternType;
	primaryColor: string;
	secondaryColor: string;
	size: number;
	spacing: number;
	rotation: number;
}

const PATTERN_OPTIONS: { value: PatternType; label: string }[] = [
	{ value: "stripes-horizontal", label: "Stripes (Horizontal)" },
	{ value: "stripes-vertical", label: "Stripes (Vertical)" },
	{ value: "stripes-diagonal", label: "Stripes (Diagonal)" },
	{ value: "dots", label: "Dots" },
	{ value: "checkerboard", label: "Checkerboard" },
	{ value: "grid", label: "Grid" },
	{ value: "zigzag", label: "Zigzag" },
	{ value: "waves", label: "Waves" },
	{ value: "triangles", label: "Triangles" },
];

const DEFAULT_CONFIG: PatternConfig = {
	type: "stripes-diagonal",
	primaryColor: "#1a1a2e",
	secondaryColor: "#16213e",
	size: 20,
	spacing: 10,
	rotation: 0,
};

function generatePatternCSS(config: PatternConfig): Record<string, string> {
	const { type, primaryColor, secondaryColor, size, spacing, rotation } = config;
	const totalSize = size + spacing;

	let backgroundImage = "";
	let backgroundSize = "";
	let backgroundColor = secondaryColor;

	switch (type) {
		case "stripes-horizontal":
			backgroundImage = `repeating-linear-gradient(
  0deg,
  ${primaryColor} 0px,
  ${primaryColor} ${size}px,
  ${secondaryColor} ${size}px,
  ${secondaryColor} ${totalSize}px
)`;
			backgroundSize = `100% ${totalSize}px`;
			break;

		case "stripes-vertical":
			backgroundImage = `repeating-linear-gradient(
  90deg,
  ${primaryColor} 0px,
  ${primaryColor} ${size}px,
  ${secondaryColor} ${size}px,
  ${secondaryColor} ${totalSize}px
)`;
			backgroundSize = `${totalSize}px 100%`;
			break;

		case "stripes-diagonal":
			backgroundImage = `repeating-linear-gradient(
  45deg,
  ${primaryColor} 0px,
  ${primaryColor} ${size}px,
  ${secondaryColor} ${size}px,
  ${secondaryColor} ${totalSize}px
)`;
			backgroundSize = `${Math.round(totalSize * Math.SQRT2)}px ${Math.round(totalSize * Math.SQRT2)}px`;
			break;

		case "dots": {
			const dotRadius = size / 2;
			backgroundImage = `radial-gradient(
  circle ${dotRadius}px at ${totalSize / 2}px ${totalSize / 2}px,
  ${primaryColor} ${dotRadius}px,
  ${secondaryColor} ${dotRadius}px
)`;
			backgroundSize = `${totalSize}px ${totalSize}px`;
			break;
		}

		case "checkerboard": {
			const half = totalSize / 2;
			backgroundImage = `linear-gradient(45deg, ${primaryColor} 25%, transparent 25%),
  linear-gradient(-45deg, ${primaryColor} 25%, transparent 25%),
  linear-gradient(45deg, transparent 75%, ${primaryColor} 75%),
  linear-gradient(-45deg, transparent 75%, ${primaryColor} 75%)`;
			backgroundSize = `${totalSize}px ${totalSize}px`;
			backgroundColor = secondaryColor;
			// backgroundPosition is needed for checkerboard alignment
			return {
				"background-color": backgroundColor,
				"background-image": backgroundImage,
				"background-size": backgroundSize,
				"background-position": `0 0, 0 ${half}px, ${half}px -${half}px, -${half}px 0px`,
				...(rotation !== 0 ? { transform: `rotate(${rotation}deg)` } : {}),
			};
		}

		case "grid":
			backgroundImage = `linear-gradient(${primaryColor} ${size}px, transparent ${size}px),
  linear-gradient(90deg, ${primaryColor} ${size}px, transparent ${size}px)`;
			backgroundSize = `${totalSize}px ${totalSize}px`;
			backgroundColor = secondaryColor;
			break;

		case "zigzag": {
			const zigHeight = totalSize;
			const zigWidth = totalSize;
			backgroundImage = `linear-gradient(135deg, ${primaryColor} 25%, transparent 25%),
  linear-gradient(225deg, ${primaryColor} 25%, transparent 25%),
  linear-gradient(315deg, ${primaryColor} 25%, transparent 25%),
  linear-gradient(45deg, ${primaryColor} 25%, transparent 25%)`;
			backgroundSize = `${zigWidth}px ${zigHeight}px`;
			backgroundColor = secondaryColor;
			return {
				"background-color": backgroundColor,
				"background-image": backgroundImage,
				"background-size": backgroundSize,
				"background-position": `0 0, ${zigWidth / 2}px 0, ${zigWidth / 2}px -${zigHeight / 2}px, 0px ${zigHeight / 2}px`,
				...(rotation !== 0 ? { transform: `rotate(${rotation}deg)` } : {}),
			};
		}

		case "waves":
			backgroundImage = `radial-gradient(circle at 0% 50%, transparent ${size}px, ${primaryColor} ${size}px, ${primaryColor} ${size + spacing / 2}px, transparent ${size + spacing / 2}px),
  radial-gradient(circle at 100% 50%, transparent ${size}px, ${primaryColor} ${size}px, ${primaryColor} ${size + spacing / 2}px, transparent ${size + spacing / 2}px)`;
			backgroundSize = `${totalSize}px ${totalSize}px`;
			backgroundColor = secondaryColor;
			return {
				"background-color": backgroundColor,
				"background-image": backgroundImage,
				"background-size": backgroundSize,
				"background-position": `0 0, ${totalSize / 2}px ${totalSize / 2}px`,
				...(rotation !== 0 ? { transform: `rotate(${rotation}deg)` } : {}),
			};

		case "triangles": {
			const triSize = totalSize;
			backgroundImage = `linear-gradient(60deg, ${primaryColor} 25%, transparent 25.5%),
  linear-gradient(-60deg, ${primaryColor} 25%, transparent 25.5%),
  linear-gradient(60deg, transparent 74.5%, ${primaryColor} 75%),
  linear-gradient(-60deg, transparent 74.5%, ${primaryColor} 75%)`;
			backgroundSize = `${triSize}px ${Math.round(triSize * 0.866)}px`;
			backgroundColor = secondaryColor;
			break;
		}
	}

	const result: Record<string, string> = {
		"background-color": backgroundColor,
		"background-image": backgroundImage,
		"background-size": backgroundSize,
	};

	if (rotation !== 0) {
		result.transform = `rotate(${rotation}deg)`;
	}

	return result;
}

function formatCSSOutput(cssProps: Record<string, string>): string {
	return Object.entries(cssProps)
		.map(([key, value]) => `${key}: ${value};`)
		.join("\n");
}

export default function BackgroundPatternGenerator() {
	const [config, setConfig] = useState<PatternConfig>(DEFAULT_CONFIG);
	const [copiedField, setCopiedField] = useState<string | null>(null);

	const updateConfig = useCallback((updates: Partial<PatternConfig>) => {
		setConfig((prev) => ({ ...prev, ...updates }));
	}, []);

	const cssProps = useMemo(() => generatePatternCSS(config), [config]);
	const cssOutput = useMemo(() => formatCSSOutput(cssProps), [cssProps]);

	const previewStyle = useMemo(() => {
		const style: React.CSSProperties = {};
		if (cssProps["background-color"]) style.backgroundColor = cssProps["background-color"];
		if (cssProps["background-image"]) style.backgroundImage = cssProps["background-image"];
		if (cssProps["background-size"]) style.backgroundSize = cssProps["background-size"];
		if (cssProps["background-position"]) style.backgroundPosition = cssProps["background-position"];
		if (cssProps.transform) style.transform = cssProps.transform;
		return style;
	}, [cssProps]);

	const handleReset = useCallback(() => {
		setConfig(DEFAULT_CONFIG);
	}, []);

	const copyToClipboard = async (value: string, field: string) => {
		try {
			await navigator.clipboard.writeText(value);
			setCopiedField(field);
			setTimeout(() => setCopiedField(null), 2000);
		} catch (err) {
			console.error("Failed to copy:", err);
		}
	};

	const handleColorInput = (field: "primaryColor" | "secondaryColor", value: string) => {
		// Allow typing partial hex values
		if (value === "" || /^#?[0-9a-fA-F]{0,6}$/.test(value)) {
			const normalized = value.startsWith("#") ? value : `#${value}`;
			updateConfig({ [field]: normalized });
		}
	};

	const isValidHex = (value: string): boolean => /^#[0-9a-fA-F]{6}$/.test(value);

	return (
		<div className={styles.container}>
			<div className={`mb-6 ${styles.mainGrid}`}>
				{/* Preview Section */}
				<div className={styles.glassCard}>
					<h2 className={`mb-4 ${styles.sectionTitle}`}>Preview</h2>
					<div className={`overflow-hidden rounded-lg ${styles.previewWrapper}`}>
						<div className={styles.previewArea} style={previewStyle} />
					</div>
				</div>

				{/* Controls Section */}
				<div className={styles.glassCard}>
					<div className="flex items-center justify-between mb-4">
						<h2 className={styles.sectionTitle}>Controls</h2>
						<button className={`p-2 ${styles.resetBtn}`} onClick={handleReset} title="Reset to defaults">
							<ArrowPathIcon className="w-4 h-4" />
						</button>
					</div>

					{/* Pattern Type */}
					<div className="flex flex-col gap-4">
						<div>
							<label className={`block mb-2 text-sm font-medium ${styles.controlLabel}`}>Pattern Type</label>
							<div className={`grid grid-cols-3 gap-2 ${styles.patternGrid}`}>
								{PATTERN_OPTIONS.map((option) => (
									<button
										key={option.value}
										className={`${styles.patternBtn} ${config.type === option.value ? styles.active : ""}`}
										onClick={() => updateConfig({ type: option.value })}
									>
										{option.label}
									</button>
								))}
							</div>
						</div>

						{/* Color Inputs */}
						<div className="grid grid-cols-2 gap-4">
							<div>
								<label className={`block mb-2 text-sm font-medium ${styles.controlLabel}`}>Primary Color</label>
								<div className="flex items-center gap-2">
									<input
										type="color"
										value={isValidHex(config.primaryColor) ? config.primaryColor : "#000000"}
										onChange={(e) => updateConfig({ primaryColor: e.target.value })}
										className={styles.colorSwatch}
									/>
									<input
										type="text"
										value={config.primaryColor}
										onChange={(e) => handleColorInput("primaryColor", e.target.value)}
										className={styles.hexInput}
										placeholder="#000000"
										maxLength={7}
									/>
								</div>
							</div>
							<div>
								<label className={`block mb-2 text-sm font-medium ${styles.controlLabel}`}>Secondary Color</label>
								<div className="flex items-center gap-2">
									<input
										type="color"
										value={isValidHex(config.secondaryColor) ? config.secondaryColor : "#ffffff"}
										onChange={(e) => updateConfig({ secondaryColor: e.target.value })}
										className={styles.colorSwatch}
									/>
									<input
										type="text"
										value={config.secondaryColor}
										onChange={(e) => handleColorInput("secondaryColor", e.target.value)}
										className={styles.hexInput}
										placeholder="#ffffff"
										maxLength={7}
									/>
								</div>
							</div>
						</div>

						{/* Size Slider */}
						<div>
							<div className="flex justify-between items-center mb-2">
								<label className={`text-sm font-medium ${styles.controlLabel}`}>Size</label>
								<span className={`text-sm font-mono ${styles.sliderValue}`}>{config.size}px</span>
							</div>
							<input
								type="range"
								min="2"
								max="80"
								value={config.size}
								onChange={(e) => updateConfig({ size: parseInt(e.target.value) })}
								className={styles.slider}
							/>
						</div>

						{/* Spacing Slider */}
						<div>
							<div className="flex justify-between items-center mb-2">
								<label className={`text-sm font-medium ${styles.controlLabel}`}>Spacing</label>
								<span className={`text-sm font-mono ${styles.sliderValue}`}>{config.spacing}px</span>
							</div>
							<input
								type="range"
								min="2"
								max="80"
								value={config.spacing}
								onChange={(e) => updateConfig({ spacing: parseInt(e.target.value) })}
								className={styles.slider}
							/>
						</div>

						{/* Rotation Slider */}
						<div>
							<div className="flex justify-between items-center mb-2">
								<label className={`text-sm font-medium ${styles.controlLabel}`}>Rotation</label>
								<span className={`text-sm font-mono ${styles.sliderValue}`}>{config.rotation}&deg;</span>
							</div>
							<input
								type="range"
								min="0"
								max="360"
								value={config.rotation}
								onChange={(e) => updateConfig({ rotation: parseInt(e.target.value) })}
								className={styles.slider}
							/>
						</div>
					</div>
				</div>
			</div>

			{/* CSS Output */}
			<div className={styles.glassCard}>
				<div className="flex items-center justify-between mb-4">
					<h2 className={styles.sectionTitle}>Generated CSS</h2>
					<button
						className={`${styles.copyBtn} ${copiedField === "css" ? styles.copied : ""}`}
						onClick={() => copyToClipboard(cssOutput, "css")}
						title="Copy to clipboard"
					>
						{copiedField === "css" ? (
							<>
								<CheckIcon className={styles.copyIcon} />
								<span className="text-sm">Copied!</span>
							</>
						) : (
							<>
								<ClipboardDocumentIcon className={styles.copyIcon} />
								<span className="text-sm">Copy CSS</span>
							</>
						)}
					</button>
				</div>
				<div className={`rounded-lg p-4 ${styles.outputSection}`}>
					<pre className={`text-sm font-mono whitespace-pre-wrap break-all leading-relaxed ${styles.outputCode}`}>{cssOutput}</pre>
				</div>
			</div>

			{/* Info Section */}
			<div className={`mt-6 ${styles.glassCard}`}>
				<h2 className={`mb-4 ${styles.sectionTitle}`}>About CSS Background Patterns</h2>
				<div className={styles.infoGrid}>
					<div className={styles.infoItem}>
						<h3 className={styles.infoSubtitle}>How It Works</h3>
						<p className={styles.infoText}>
							CSS background patterns use <code>background-image</code> with CSS gradients (<code>linear-gradient</code>, <code>radial-gradient</code>) combined with{" "}
							<code>background-size</code> and <code>background-position</code> to create seamlessly repeating patterns without any image files.
						</p>
					</div>
					<div className={styles.infoItem}>
						<h3 className={styles.infoSubtitle}>Performance</h3>
						<p className={styles.infoText}>
							CSS-only patterns are resolution-independent and require zero HTTP requests, making them ideal for decorative backgrounds. They render efficiently on all screen
							densities including retina displays.
						</p>
					</div>
					<div className={styles.infoItem}>
						<h3 className={styles.infoSubtitle}>Browser Support</h3>
						<p className={styles.infoText}>
							CSS gradient patterns are supported in all modern browsers. The <code>repeating-linear-gradient</code> and <code>radial-gradient</code> functions have excellent
							cross-browser compatibility.
						</p>
					</div>
					<div className={styles.infoItem}>
						<h3 className={styles.infoSubtitle}>Tips</h3>
						<p className={styles.infoText}>
							For best results, use subtle color differences between primary and secondary colors. Combine patterns with <code>opacity</code> or overlay them on solid backgrounds for
							sophisticated visual effects.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
