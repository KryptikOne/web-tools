"use client";

import { useState, useCallback, useMemo } from "react";
import {
	ClipboardDocumentIcon,
	CheckIcon,
	ArrowPathIcon,
} from "@heroicons/react/24/outline";
import styles from "./CssFilterGenerator.module.scss";

interface FilterState {
	blur: number;
	brightness: number;
	contrast: number;
	grayscale: number;
	hueRotate: number;
	invert: number;
	opacity: number;
	saturate: number;
	sepia: number;
	dropShadowX: number;
	dropShadowY: number;
	dropShadowBlur: number;
	dropShadowColor: string;
}

const DEFAULT_FILTERS: FilterState = {
	blur: 0,
	brightness: 100,
	contrast: 100,
	grayscale: 0,
	hueRotate: 0,
	invert: 0,
	opacity: 100,
	saturate: 100,
	sepia: 0,
	dropShadowX: 0,
	dropShadowY: 0,
	dropShadowBlur: 0,
	dropShadowColor: "#000000",
};

interface SliderConfig {
	key: keyof FilterState;
	label: string;
	min: number;
	max: number;
	step: number;
	unit: string;
	defaultValue: number;
}

const SLIDER_CONFIGS: SliderConfig[] = [
	{ key: "blur", label: "Blur", min: 0, max: 20, step: 0.1, unit: "px", defaultValue: 0 },
	{ key: "brightness", label: "Brightness", min: 0, max: 300, step: 1, unit: "%", defaultValue: 100 },
	{ key: "contrast", label: "Contrast", min: 0, max: 300, step: 1, unit: "%", defaultValue: 100 },
	{ key: "grayscale", label: "Grayscale", min: 0, max: 100, step: 1, unit: "%", defaultValue: 0 },
	{ key: "hueRotate", label: "Hue Rotate", min: 0, max: 360, step: 1, unit: "deg", defaultValue: 0 },
	{ key: "invert", label: "Invert", min: 0, max: 100, step: 1, unit: "%", defaultValue: 0 },
	{ key: "opacity", label: "Opacity", min: 0, max: 100, step: 1, unit: "%", defaultValue: 100 },
	{ key: "saturate", label: "Saturate", min: 0, max: 300, step: 1, unit: "%", defaultValue: 100 },
	{ key: "sepia", label: "Sepia", min: 0, max: 100, step: 1, unit: "%", defaultValue: 0 },
];

interface Preset {
	name: string;
	filters: Partial<FilterState>;
}

const PRESETS: Preset[] = [
	{
		name: "Vintage",
		filters: { brightness: 110, contrast: 85, saturate: 75, sepia: 40 },
	},
	{
		name: "Dramatic",
		filters: { brightness: 90, contrast: 150, saturate: 130 },
	},
	{
		name: "Muted",
		filters: { brightness: 95, contrast: 90, saturate: 60, grayscale: 20 },
	},
	{
		name: "High Contrast",
		filters: { brightness: 105, contrast: 200, saturate: 110 },
	},
	{
		name: "Grayscale",
		filters: { grayscale: 100 },
	},
	{
		name: "Warm",
		filters: { brightness: 105, contrast: 105, saturate: 130, sepia: 15, hueRotate: 350 },
	},
	{
		name: "Cool",
		filters: { brightness: 105, contrast: 110, saturate: 90, hueRotate: 180 },
	},
	{
		name: "Faded",
		filters: { brightness: 115, contrast: 80, saturate: 70, opacity: 90 },
	},
	{
		name: "Noir",
		filters: { grayscale: 100, contrast: 140, brightness: 90 },
	},
	{
		name: "Dreamy",
		filters: { blur: 1, brightness: 115, contrast: 85, saturate: 120 },
	},
	{
		name: "Inverted",
		filters: { invert: 100 },
	},
	{
		name: "Sunset",
		filters: { brightness: 110, contrast: 110, saturate: 150, sepia: 25, hueRotate: 330 },
	},
];

// Placeholder SVG for the preview (avoids external image dependency)
const PREVIEW_SVG = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="320" height="220" viewBox="0 0 320 220">
  <defs>
    <linearGradient id="sky" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#1a73e8"/>
      <stop offset="100%" stop-color="#87CEEB"/>
    </linearGradient>
    <linearGradient id="grass" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#4CAF50"/>
      <stop offset="100%" stop-color="#2E7D32"/>
    </linearGradient>
  </defs>
  <rect width="320" height="220" fill="url(#sky)"/>
  <rect y="150" width="320" height="70" fill="url(#grass)"/>
  <circle cx="250" cy="50" r="30" fill="#FFD54F"/>
  <circle cx="80" cy="60" r="25" fill="white" opacity="0.8"/>
  <circle cx="95" cy="55" r="25" fill="white" opacity="0.8"/>
  <circle cx="110" cy="60" r="25" fill="white" opacity="0.8"/>
  <polygon points="140,150 160,90 180,150" fill="#5D4037"/>
  <circle cx="160" cy="100" r="30" fill="#388E3C"/>
  <polygon points="200,150 220,100 240,150" fill="#5D4037"/>
  <circle cx="220" cy="110" r="25" fill="#388E3C"/>
  <rect x="40" y="120" width="40" height="30" fill="#F44336"/>
  <polygon points="35,120 60,95 85,120" fill="#B71C1C"/>
  <rect x="55" y="130" width="12" height="20" fill="#795548"/>
  <rect x="42" y="125" width="10" height="10" fill="#BBDEFB" opacity="0.8"/>
</svg>`)}`;

export default function CssFilterGenerator() {
	const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
	const [copiedField, setCopiedField] = useState<string | null>(null);

	const updateFilter = useCallback((key: keyof FilterState, value: number | string) => {
		setFilters((prev) => ({ ...prev, [key]: value }));
	}, []);

	const resetFilters = useCallback(() => {
		setFilters(DEFAULT_FILTERS);
	}, []);

	const applyPreset = useCallback((preset: Preset) => {
		setFilters({ ...DEFAULT_FILTERS, ...preset.filters });
	}, []);

	const filterCssValue = useMemo((): string => {
		const parts: string[] = [];

		if (filters.blur !== 0) parts.push(`blur(${filters.blur}px)`);
		if (filters.brightness !== 100) parts.push(`brightness(${filters.brightness}%)`);
		if (filters.contrast !== 100) parts.push(`contrast(${filters.contrast}%)`);
		if (filters.grayscale !== 0) parts.push(`grayscale(${filters.grayscale}%)`);
		if (filters.hueRotate !== 0) parts.push(`hue-rotate(${filters.hueRotate}deg)`);
		if (filters.invert !== 0) parts.push(`invert(${filters.invert}%)`);
		if (filters.opacity !== 100) parts.push(`opacity(${filters.opacity}%)`);
		if (filters.saturate !== 100) parts.push(`saturate(${filters.saturate}%)`);
		if (filters.sepia !== 0) parts.push(`sepia(${filters.sepia}%)`);
		if (filters.dropShadowX !== 0 || filters.dropShadowY !== 0 || filters.dropShadowBlur !== 0) {
			parts.push(
				`drop-shadow(${filters.dropShadowX}px ${filters.dropShadowY}px ${filters.dropShadowBlur}px ${filters.dropShadowColor})`
			);
		}

		return parts.length > 0 ? parts.join(" ") : "none";
	}, [filters]);

	const cssCode = useMemo((): string => {
		return `filter: ${filterCssValue};`;
	}, [filterCssValue]);

	const filterStyle = useMemo((): React.CSSProperties => {
		return filterCssValue !== "none" ? { filter: filterCssValue } : {};
	}, [filterCssValue]);

	const copyToClipboard = async (value: string, field: string) => {
		try {
			await navigator.clipboard.writeText(value);
			setCopiedField(field);
			setTimeout(() => setCopiedField(null), 2000);
		} catch (err) {
			console.error("Failed to copy:", err);
		}
	};

	const isDefault = useMemo(() => {
		return JSON.stringify(filters) === JSON.stringify(DEFAULT_FILTERS);
	}, [filters]);

	return (
		<div className={styles.container}>
			<div className={`mb-6 ${styles.mainGrid}`}>
				{/* Preview Section */}
				<div className={styles.glassCard}>
					<h2 className={`mb-4 ${styles.sectionTitle}`}>Preview</h2>
					<div className={`flex items-center justify-center p-6 mb-6 ${styles.previewContainer}`}>
						{/* eslint-disable-next-line @next/next/no-img-element */}
						<img
							src={PREVIEW_SVG}
							alt="Filter preview"
							className={styles.previewImage}
							style={filterStyle}
						/>
					</div>

					{/* CSS Output */}
					<div className={`p-4 ${styles.outputSection}`}>
						<div className="flex items-center justify-between mb-2">
							<span className={`text-xs font-semibold uppercase tracking-wide ${styles.outputLabel}`}>CSS</span>
							<button
								className={`${styles.copyBtn} ${copiedField === "css" ? styles.copied : ""}`}
								onClick={() => copyToClipboard(cssCode, "css")}
								title="Copy to clipboard"
							>
								{copiedField === "css" ? (
									<CheckIcon className={styles.copyIcon} />
								) : (
									<ClipboardDocumentIcon className={styles.copyIcon} />
								)}
							</button>
						</div>
						<code className={`block text-sm font-mono leading-relaxed ${styles.outputCode}`}>
							{cssCode}
						</code>
					</div>
				</div>

				{/* Controls Section */}
				<div className={styles.glassCard}>
					<div className="flex items-center justify-between mb-4">
						<h2 className={styles.sectionTitle}>Filters</h2>
						<button
							className={`flex items-center gap-1.5 ${styles.resetBtn}`}
							onClick={resetFilters}
							disabled={isDefault}
							title="Reset all filters"
						>
							<ArrowPathIcon className="w-4 h-4" />
							<span className="text-xs font-medium">Reset</span>
						</button>
					</div>

					<div className={`flex flex-col gap-1 pr-2 ${styles.controlsList}`}>
						{SLIDER_CONFIGS.map((config) => {
							const value = filters[config.key] as number;
							const isModified = value !== config.defaultValue;

							return (
								<div key={config.key} className={styles.sliderGroup}>
									<div className={styles.sliderHeader}>
										<label className={styles.sliderLabel}>
											{config.label}
											{isModified && (
												<span className="ml-1.5 text-xs opacity-50">*</span>
											)}
										</label>
										<span className={styles.sliderValue}>
											{config.step < 1 ? value.toFixed(1) : value}
											{config.unit}
										</span>
									</div>
									<input
										type="range"
										min={config.min}
										max={config.max}
										step={config.step}
										value={value}
										onChange={(e) => updateFilter(config.key, parseFloat(e.target.value))}
										className={styles.slider}
									/>
								</div>
							);
						})}

						{/* Drop Shadow Controls */}
						<div className={styles.sliderGroup}>
							<div className={styles.sliderHeader}>
								<label className={styles.sliderLabel}>
									Drop Shadow
									{(filters.dropShadowX !== 0 || filters.dropShadowY !== 0 || filters.dropShadowBlur !== 0) && (
										<span className="ml-1.5 text-xs opacity-50">*</span>
									)}
								</label>
							</div>
							<div className={styles.dropShadowControls}>
								<div className="flex flex-col gap-2">
									<div className={`grid items-center gap-2 ${styles.dropShadowRow}`}>
										<label className={styles.dropShadowLabel}>X Offset</label>
										<input
											type="range"
											min={-30}
											max={30}
											step={1}
											value={filters.dropShadowX}
											onChange={(e) => updateFilter("dropShadowX", parseInt(e.target.value))}
											className={styles.slider}
										/>
										<span className={styles.dropShadowValue}>{filters.dropShadowX}px</span>
									</div>
									<div className={`grid items-center gap-2 ${styles.dropShadowRow}`}>
										<label className={styles.dropShadowLabel}>Y Offset</label>
										<input
											type="range"
											min={-30}
											max={30}
											step={1}
											value={filters.dropShadowY}
											onChange={(e) => updateFilter("dropShadowY", parseInt(e.target.value))}
											className={styles.slider}
										/>
										<span className={styles.dropShadowValue}>{filters.dropShadowY}px</span>
									</div>
									<div className={`grid items-center gap-2 ${styles.dropShadowRow}`}>
										<label className={styles.dropShadowLabel}>Blur</label>
										<input
											type="range"
											min={0}
											max={30}
											step={1}
											value={filters.dropShadowBlur}
											onChange={(e) => updateFilter("dropShadowBlur", parseInt(e.target.value))}
											className={styles.slider}
										/>
										<span className={styles.dropShadowValue}>{filters.dropShadowBlur}px</span>
									</div>
									<div className={`grid items-center gap-2 ${styles.dropShadowRow}`}>
										<label className={styles.dropShadowLabel}>Color</label>
										<input
											type="color"
											value={filters.dropShadowColor}
											onChange={(e) => updateFilter("dropShadowColor", e.target.value)}
											className={styles.colorInput}
										/>
										<span className={styles.dropShadowValue}>{filters.dropShadowColor}</span>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Presets Section */}
			<div className={styles.glassCard}>
				<h2 className={`mb-4 ${styles.sectionTitle}`}>Presets</h2>
				<div className={styles.presetsGrid}>
					{PRESETS.map((preset) => {
						const presetFilterValue = (() => {
							const merged = { ...DEFAULT_FILTERS, ...preset.filters };
							const parts: string[] = [];
							if (merged.blur !== 0) parts.push(`blur(${merged.blur}px)`);
							if (merged.brightness !== 100) parts.push(`brightness(${merged.brightness}%)`);
							if (merged.contrast !== 100) parts.push(`contrast(${merged.contrast}%)`);
							if (merged.grayscale !== 0) parts.push(`grayscale(${merged.grayscale}%)`);
							if (merged.hueRotate !== 0) parts.push(`hue-rotate(${merged.hueRotate}deg)`);
							if (merged.invert !== 0) parts.push(`invert(${merged.invert}%)`);
							if (merged.opacity !== 100) parts.push(`opacity(${merged.opacity}%)`);
							if (merged.saturate !== 100) parts.push(`saturate(${merged.saturate}%)`);
							if (merged.sepia !== 0) parts.push(`sepia(${merged.sepia}%)`);
							return parts.length > 0 ? parts.join(" ") : "none";
						})();

						return (
							<button
								key={preset.name}
								className={styles.presetBtn}
								onClick={() => applyPreset(preset)}
							>
								<div className={styles.presetPreviewWrapper}>
									{/* eslint-disable-next-line @next/next/no-img-element */}
									<img
										src={PREVIEW_SVG}
										alt={preset.name}
										className={styles.presetPreviewImg}
										style={presetFilterValue !== "none" ? { filter: presetFilterValue } : {}}
									/>
								</div>
								<span className={styles.presetName}>{preset.name}</span>
							</button>
						);
					})}
				</div>
			</div>

			{/* Info Section */}
			<div className={`mt-6 ${styles.glassCard}`}>
				<h2 className={`mb-4 ${styles.sectionTitle}`}>About CSS Filters</h2>
				<div className={styles.infoGrid}>
					<div className={styles.infoItem}>
						<h3 className={styles.infoSubtitle}>Syntax</h3>
						<p className={styles.infoText}>
							<code>filter: function(value) function(value);</code>
							<br />
							Multiple filter functions can be chained together separated by spaces. They are applied in the order listed.
						</p>
					</div>
					<div className={styles.infoItem}>
						<h3 className={styles.infoSubtitle}>Filter vs Backdrop Filter</h3>
						<p className={styles.infoText}>
							The <code>filter</code> property applies effects to the element itself.
							Use <code>backdrop-filter</code> to apply effects to the area behind an element, commonly used for frosted-glass UI effects.
						</p>
					</div>
					<div className={styles.infoItem}>
						<h3 className={styles.infoSubtitle}>Performance</h3>
						<p className={styles.infoText}>
							CSS filters are GPU-accelerated in most browsers. However, <code>blur()</code> with large values can be expensive.
							Use <code>will-change: filter</code> on animated elements to hint the browser for optimization.
						</p>
					</div>
					<div className={styles.infoItem}>
						<h3 className={styles.infoSubtitle}>Drop Shadow vs Box Shadow</h3>
						<p className={styles.infoText}>
							<code>drop-shadow()</code> follows the alpha channel of an image, creating shadows that match the shape.
							<code>box-shadow</code> always follows the rectangular box of the element.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
