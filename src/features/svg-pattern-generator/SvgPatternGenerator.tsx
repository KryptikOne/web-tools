"use client";

import { useState, useMemo, useCallback } from "react";
import {
	ClipboardDocumentIcon,
	CheckIcon,
	ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";
import styles from "./SvgPatternGenerator.module.scss";

type PatternType =
	| "circles"
	| "lines"
	| "crosses"
	| "diamonds"
	| "hexagons"
	| "triangles"
	| "squares"
	| "dots";

interface PatternConfig {
	type: PatternType;
	fillColor: string;
	strokeColor: string;
	tileSize: number;
	strokeWidth: number;
	spacing: number;
	rotation: number;
}

const PATTERN_PRESETS: { name: string; type: PatternType }[] = [
	{ name: "Circles", type: "circles" },
	{ name: "Lines", type: "lines" },
	{ name: "Crosses", type: "crosses" },
	{ name: "Diamonds", type: "diamonds" },
	{ name: "Hexagons", type: "hexagons" },
	{ name: "Triangles", type: "triangles" },
	{ name: "Squares", type: "squares" },
	{ name: "Dots", type: "dots" },
];

const DEFAULT_CONFIG: PatternConfig = {
	type: "circles",
	fillColor: "#b5fe67",
	strokeColor: "#1a1a2e",
	tileSize: 40,
	strokeWidth: 2,
	spacing: 10,
	rotation: 0,
};

function generatePatternShape(config: PatternConfig): string {
	const { type, fillColor, strokeColor, tileSize, strokeWidth, spacing } =
		config;
	const size = tileSize;
	const half = size / 2;
	const shapeSize = Math.max(2, (size - spacing) / 2);

	switch (type) {
		case "circles":
			return `<circle cx="${half}" cy="${half}" r="${shapeSize}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}" />`;

		case "dots":
			return `<circle cx="${half}" cy="${half}" r="${Math.max(1, shapeSize / 3)}" fill="${fillColor}" stroke="none" />`;

		case "lines":
			return `<line x1="0" y1="${half}" x2="${size}" y2="${half}" stroke="${strokeColor}" stroke-width="${strokeWidth}" />`;

		case "crosses": {
			const arm = shapeSize;
			return [
				`<line x1="${half - arm}" y1="${half}" x2="${half + arm}" y2="${half}" stroke="${strokeColor}" stroke-width="${strokeWidth}" />`,
				`<line x1="${half}" y1="${half - arm}" x2="${half}" y2="${half + arm}" stroke="${strokeColor}" stroke-width="${strokeWidth}" />`,
			].join("\n    ");
		}

		case "diamonds": {
			const d = shapeSize;
			const points = `${half},${half - d} ${half + d},${half} ${half},${half + d} ${half - d},${half}`;
			return `<polygon points="${points}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}" />`;
		}

		case "hexagons": {
			const r = shapeSize;
			const pts = Array.from({ length: 6 }, (_, i) => {
				const angle = (Math.PI / 3) * i - Math.PI / 6;
				return `${half + r * Math.cos(angle)},${half + r * Math.sin(angle)}`;
			}).join(" ");
			return `<polygon points="${pts}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}" />`;
		}

		case "triangles": {
			const h = shapeSize;
			const points = `${half},${half - h} ${half + h},${half + h} ${half - h},${half + h}`;
			return `<polygon points="${points}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}" />`;
		}

		case "squares": {
			const s = shapeSize;
			return `<rect x="${half - s}" y="${half - s}" width="${s * 2}" height="${s * 2}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}" />`;
		}

		default:
			return "";
	}
}

function generateSvgCode(config: PatternConfig): string {
	const { tileSize, rotation } = config;
	const shape = generatePatternShape(config);
	const transform =
		rotation !== 0
			? `\n      patternTransform="rotate(${rotation})"`
			: "";

	return `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
  <defs>
    <pattern id="pattern" x="0" y="0" width="${tileSize}" height="${tileSize}" patternUnits="userSpaceOnUse"${transform}>
      ${shape}
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="url(#pattern)" />
</svg>`;
}

/**
 * Build a `data:image/svg+xml,...` URI for the pattern. The raw markup uses
 * plain `%` and `#` so the single encodeURIComponent pass produces `%25` and
 * `%23`; writing them pre-encoded double-encodes them and the browser ends up
 * with `fill='url(%23p)'`, which paints nothing.
 */
function buildPatternDataUri(config: PatternConfig): string {
	const { tileSize, rotation } = config;
	const shape = generatePatternShape(config).replace(/"/g, "'");
	const transform =
		rotation !== 0 ? ` patternTransform='rotate(${rotation})'` : "";

	const raw = `<svg xmlns='http://www.w3.org/2000/svg' width='100%' height='100%'><defs><pattern id='p' width='${tileSize}' height='${tileSize}' patternUnits='userSpaceOnUse'${transform}>${shape}</pattern></defs><rect width='100%' height='100%' fill='url(#p)'/></svg>`;

	const encoded = encodeURIComponent(raw)
		.replace(/'/g, "%27")
		.replace(/\(/g, "%28")
		.replace(/\)/g, "%29");

	return `data:image/svg+xml,${encoded}`;
}

function generateCssCode(config: PatternConfig): string {
	return `background-image: url("${buildPatternDataUri(config)}");
background-repeat: repeat;`;
}

export default function SvgPatternGenerator() {
	const [config, setConfig] = useState<PatternConfig>(DEFAULT_CONFIG);
	const [copiedField, setCopiedField] = useState<string | null>(null);

	const updateConfig = useCallback(
		(updates: Partial<PatternConfig>) => {
			setConfig((prev) => ({ ...prev, ...updates }));
		},
		[]
	);

	const svgCode = useMemo(() => generateSvgCode(config), [config]);
	const cssCode = useMemo(() => generateCssCode(config), [config]);

	const previewDataUri = useMemo(
		() => `url("${buildPatternDataUri(config)}")`,
		[config]
	);

	const copyToClipboard = async (value: string, field: string) => {
		try {
			await navigator.clipboard.writeText(value);
			setCopiedField(field);
			setTimeout(() => setCopiedField(null), 2000);
		} catch (err) {
			console.error("Failed to copy:", err);
		}
	};

	const downloadSvg = useCallback(() => {
		const blob = new Blob([svgCode], { type: "image/svg+xml" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `pattern-${config.type}.svg`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}, [svgCode, config.type]);

	return (
		<div className={styles.container}>
			<div className={`mb-6 ${styles.mainGrid}`}>
				{/* Preview */}
				<div className={styles.glassCard}>
					<h2 className={`mb-4 ${styles.sectionTitle}`}>Preview</h2>
					<div
						data-testid="pattern-preview"
						className={`w-full overflow-hidden ${styles.previewArea}`}
						style={{ backgroundImage: previewDataUri }}
					/>
				</div>

				{/* Controls */}
				<div className={styles.glassCard}>
					<h2 className={`mb-4 ${styles.sectionTitle}`}>Controls</h2>

					{/* Pattern Type Presets */}
					<div className="mb-6">
						<label className={`text-sm font-medium mb-2 block ${styles.label}`}>
							Pattern Type
						</label>
						<div className={styles.presetsGrid}>
							{PATTERN_PRESETS.map((preset) => (
								<button
									key={preset.type}
									className={`${styles.presetBtn} ${config.type === preset.type ? styles.active : ""}`}
									onClick={() => updateConfig({ type: preset.type })}
								>
									{preset.name}
								</button>
							))}
						</div>
					</div>

					{/* Fill Color */}
					<div className={`flex flex-col gap-1.5 mb-4 ${styles.controlGroup}`}>
						<label className={`text-sm font-medium ${styles.label}`}>
							Fill Color
						</label>
						<div className="flex items-center gap-2">
							<input
								type="color"
								value={config.fillColor}
								onChange={(e) => updateConfig({ fillColor: e.target.value })}
								className={styles.colorInput}
							/>
							<input
								type="text"
								value={config.fillColor}
								onChange={(e) => updateConfig({ fillColor: e.target.value })}
								className={`flex-1 ${styles.hexInput}`}
								maxLength={7}
								spellCheck={false}
							/>
						</div>
					</div>

					{/* Stroke Color */}
					<div className={`flex flex-col gap-1.5 mb-4 ${styles.controlGroup}`}>
						<label className={`text-sm font-medium ${styles.label}`}>
							Stroke Color
						</label>
						<div className="flex items-center gap-2">
							<input
								type="color"
								value={config.strokeColor}
								onChange={(e) => updateConfig({ strokeColor: e.target.value })}
								className={styles.colorInput}
							/>
							<input
								type="text"
								value={config.strokeColor}
								onChange={(e) => updateConfig({ strokeColor: e.target.value })}
								className={`flex-1 ${styles.hexInput}`}
								maxLength={7}
								spellCheck={false}
							/>
						</div>
					</div>

					{/* Tile Size */}
					<div className="mb-4">
						<div className="flex justify-between mb-1">
							<label className={`text-sm font-medium ${styles.label}`}>
								Tile Size
							</label>
							<span className={`text-sm font-mono ${styles.valueDisplay}`}>
								{config.tileSize}px
							</span>
						</div>
						<input
							type="range"
							min="10"
							max="120"
							value={config.tileSize}
							onChange={(e) =>
								updateConfig({ tileSize: parseInt(e.target.value) })
							}
							className={styles.slider}
						/>
					</div>

					{/* Stroke Width */}
					<div className="mb-4">
						<div className="flex justify-between mb-1">
							<label className={`text-sm font-medium ${styles.label}`}>
								Stroke Width
							</label>
							<span className={`text-sm font-mono ${styles.valueDisplay}`}>
								{config.strokeWidth}px
							</span>
						</div>
						<input
							type="range"
							min="0"
							max="10"
							step="0.5"
							value={config.strokeWidth}
							onChange={(e) =>
								updateConfig({ strokeWidth: parseFloat(e.target.value) })
							}
							className={styles.slider}
						/>
					</div>

					{/* Spacing */}
					<div className="mb-4">
						<div className="flex justify-between mb-1">
							<label className={`text-sm font-medium ${styles.label}`}>
								Spacing
							</label>
							<span className={`text-sm font-mono ${styles.valueDisplay}`}>
								{config.spacing}px
							</span>
						</div>
						<input
							type="range"
							min="0"
							max="40"
							value={config.spacing}
							onChange={(e) =>
								updateConfig({ spacing: parseInt(e.target.value) })
							}
							className={styles.slider}
						/>
					</div>

					{/* Rotation */}
					<div className="mb-4">
						<div className="flex justify-between mb-1">
							<label className={`text-sm font-medium ${styles.label}`}>
								Rotation
							</label>
							<span className={`text-sm font-mono ${styles.valueDisplay}`}>
								{config.rotation}&deg;
							</span>
						</div>
						<input
							type="range"
							min="0"
							max="360"
							value={config.rotation}
							onChange={(e) =>
								updateConfig({ rotation: parseInt(e.target.value) })
							}
							className={styles.slider}
						/>
					</div>
				</div>
			</div>

			{/* Output: SVG Code */}
			<div className={`mb-6 ${styles.glassCard}`}>
				<div className="flex items-center justify-between mb-3">
					<h2 className={styles.sectionTitle}>SVG Code</h2>
					<div className="flex gap-2">
						<button
							className={`${styles.actionBtn} ${copiedField === "svg" ? styles.copied : ""}`}
							onClick={() => copyToClipboard(svgCode, "svg")}
							title="Copy SVG"
						>
							{copiedField === "svg" ? (
								<CheckIcon className="w-4 h-4" />
							) : (
								<ClipboardDocumentIcon className="w-4 h-4" />
							)}
							<span>Copy SVG</span>
						</button>
						<button
							className={styles.actionBtn}
							onClick={downloadSvg}
							title="Download SVG"
						>
							<ArrowDownTrayIcon className="w-4 h-4" />
							<span>Download</span>
						</button>
					</div>
				</div>
				<div className={styles.codeBlock}>
					<pre className={styles.codeContent}>
						<code>{svgCode}</code>
					</pre>
				</div>
			</div>

			{/* Output: CSS Code */}
			<div className={styles.glassCard}>
				<div className="flex items-center justify-between mb-3">
					<h2 className={styles.sectionTitle}>CSS Code</h2>
					<button
						className={`${styles.actionBtn} ${copiedField === "css" ? styles.copied : ""}`}
						onClick={() => copyToClipboard(cssCode, "css")}
						title="Copy CSS"
					>
						{copiedField === "css" ? (
							<CheckIcon className="w-4 h-4" />
						) : (
							<ClipboardDocumentIcon className="w-4 h-4" />
						)}
						<span>Copy CSS</span>
					</button>
				</div>
				<div className={styles.codeBlock}>
					<pre className={styles.codeContent}>
						<code>{cssCode}</code>
					</pre>
				</div>
			</div>
		</div>
	);
}
